export const dynamic = 'force-dynamic';  // This tells Next.js this is a dynamic route

import React, { Suspense } from "react";
import {
  NFTDetails,
  TokenDetails,
  TokensList,
  NFTList,
  TokenMetrics,
  NFTMetrics,
  Navigation,
} from "@/app/components";
import { FungibleToken, NonFungibleToken } from "@/app/types";

interface PortfolioPageProps {
  searchParams: { view: string; details: string; tokenDetails: string };
  params: { walletAddress: string };
}

// Add Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
  </div>
);

const PortfolioPage = async ({ searchParams, params }: PortfolioPageProps) => {
  let assets;
  try {
    assets = await getAllAssets(params.walletAddress);
  } catch (error) {
    console.error("Error loading portfolio:", error);
    throw new Error(
      `Failed to load portfolio data: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  const { fungibleTokens, nonFungibleTokens } = assets;

  return (
    <div className="h-screen bg-radial-gradient">
      <div className="lg:pl-20">
        {/* Navigation (Mobile / Side / Primary) */}
        <Navigation searchParams={searchParams} params={params} />

        {/* Main area */}
        <main>
          <div className="px-6 py-6">
            {/* Tokens */}
            <div>
              {searchParams.tokenDetails && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-700 bg-opacity-70">
                  <div className="h-4/5 w-10/12 sm:w-2/3">
                    <TokenDetails
                      tokenData={fungibleTokens.filter(
                        (item) => item.id === searchParams.tokenDetails
                      )}
                      searchParams={searchParams}
                      walletAddress={params.walletAddress}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* NFTS */}
            <div>
              {searchParams.details && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-700 bg-opacity-70">
                  <div className="h-4/5 w-10/12 sm:w-2/3">
                    <NFTDetails
                      nftData={nonFungibleTokens.filter(
                        (item) => item.id === searchParams.details
                      )}
                      searchParams={"view=" + searchParams.view}
                      walletAddress={params.walletAddress}
                    />
                  </div>
                </div>
              )}
            </div>

            <div
              className={`${
                searchParams.details || searchParams.tokenDetails
                  ? "flex h-screen flex-col overflow-hidden"
                  : ""
              }`}
            >
              <Suspense fallback={<LoadingSpinner />} key={searchParams.view}>
                <div>
                  {searchParams.view === "tokens" && (
                    <>
                      <TokenMetrics fungibleTokens={fungibleTokens} />
                      <TokensList
                        tokens={fungibleTokens}
                        searchParams={searchParams.toString()}
                        walletAddress={params.walletAddress}
                      />
                    </>
                  )}
                  {searchParams.view === "nfts" && (
                    <>
                      <NFTMetrics nonFungibleTokens={nonFungibleTokens} />
                      <NFTList
                        tokens={nonFungibleTokens}
                        searchParams={searchParams.toString()}
                        walletAddress={params.walletAddress}
                      />
                    </>
                  )}
                </div>
              </Suspense>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const getAllAssets = async (walletAddress: string) => {
  // Validate wallet address
  if (!walletAddress || walletAddress.length !== 44) {
    throw new Error("Invalid wallet address format");
  }

  const url = process.env.NEXT_PUBLIC_HELIUS_RPC_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_HELIUS_RPC_URL is not set");
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(url, {
      cache: 'no-store',
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "my-id",
        method: "searchAssets",
        params: {
          ownerAddress: walletAddress,
          tokenType: "all",
          displayOptions: {
            showNativeBalance: true,
            showInscription: true,
            showCollectionMetadata: true,
          },
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch data: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.result || !data.result.items) {
      throw new Error(`Invalid response structure: ${JSON.stringify(data)}`);
    }

    const items = data.result.items;

    // Split tokens
    let fungibleTokens: FungibleToken[] = items.filter(
      (item): item is FungibleToken =>
        item.interface === "FungibleToken" || item.interface === "FungibleAsset"
    );

    // Handle token images
    const tokenImages: Record<string, string> = {
      "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": 
        "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
      "bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1":
        "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1/logo.png",
    };

    fungibleTokens = fungibleTokens.map((item) => {
      const imageUrl = tokenImages[item.id];
      if (imageUrl) {
        return {
          ...item,
          content: {
            ...item.content,
            files: [{ uri: imageUrl, cdn_uri: "", mime: "image/png" }],
            links: { image: imageUrl },
          },
        };
      }
      return item;
    });

    const nonFungibleTokens: NonFungibleToken[] = items.filter(
      (item): item is NonFungibleToken =>
        !["FungibleToken", "FungibleAsset"].includes(item.interface)
    );

    // Calculate SOL balance
    const solBalance = data.result.nativeBalance.lamports;
    if (solBalance > 0) {
      const solToken = {
        interface: "FungibleAsset",
        id: "So11111111111111111111111111111111111111112",
        content: {
          $schema: "https://schema.metaplex.com/nft1.0.json",
          json_uri: "",
          files: [{
            uri: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
            cdn_uri: "",
            mime: "image/png",
          }],
          metadata: {
            description: "Solana Token",
            name: "Wrapped SOL",
            symbol: "SOL",
            token_standard: "Native Token",
          },
          links: {
            image: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
          },
        },
        authorities: [],
        compression: {
          eligible: false,
          compressed: false,
          data_hash: "",
          creator_hash: "",
          asset_hash: "",
          tree: "",
          seq: 0,
          leaf_id: 0,
        },
        grouping: [],
        royalty: {
          royalty_model: "",
          target: null,
          percent: 0,
          basis_points: 0,
          primary_sale_happened: false,
          locked: false,
        },
        creators: [],
        ownership: {
          frozen: false,
          delegated: false,
          delegate: null,
          ownership_model: "token",
          owner: nonFungibleTokens[0]?.ownership?.owner || walletAddress,
        },
        supply: null,
        mutable: true,
        burnt: false,
        token_info: {
          symbol: "SOL",
          balance: solBalance,
          supply: 0,
          decimals: 9,
          token_program: "",
          associated_token_address: "",
          price_info: {
            price_per_token: data.result.nativeBalance.price_per_sol,
            total_price: data.result.nativeBalance.total_price,
            currency: "",
          },
        },
      };

      fungibleTokens.push(solToken);
    }

    return { fungibleTokens, nonFungibleTokens };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out after 15 seconds');
      }
      throw error;
    }
    throw new Error('An unknown error occurred while fetching assets');
  }
};

export default PortfolioPage;