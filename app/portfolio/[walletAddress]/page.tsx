import React, { Suspense } from "react";

import {
  NFTDetails,
  TokenDetails,
  TokensList,
  NFTList,
  TokenMetrics,
  NFTMetrics,
  Navigation,
  URLInput,
  AIInput,
  PAIInput,
  ChatAIInput
} from "@/app/components";

import { FungibleToken, NonFungibleToken } from "@/app/types";

interface PortfolioPageProps {
  searchParams: { view: string; details: string; tokenDetails: string };
  params: { walletAddress: string };
}

const PortfolioPage = async ({ searchParams, params }: PortfolioPageProps) => {
  // Fetch both fungible and non-fungible token data
  const { fungibleTokens, nonFungibleTokens } = await getAllAssets(
    params.walletAddress,
  );

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
                        (item) => item.id === searchParams.tokenDetails,
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
                        (item) => item.id === searchParams.details,
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
                searchParams.details
                  ? "flex h-screen flex-col overflow-hidden"
                  : ""
              }${
                searchParams.tokenDetails
                  ? "flex h-screen flex-col overflow-hidden"
                  : ""
              }`}
            >
              <Suspense
                fallback={<div>Loading...</div>}
                key={searchParams.view}
              >
                <div>
                  {searchParams.view === "ai" && (
                    <div className="flex justify-center items-center">
                      <AIInput />
                    </div>
                  )}
                  {searchParams.view === "ai2" && (
                    <div className="flex justify-center items-center">
                      <PAIInput />
                    </div>
                  )}
                  {searchParams.view === "url" && (
                    <div className="flex justify-center items-center">
                      <URLInput />
                    </div>
                  )}
                  {searchParams.view === "chat" && (
                    <div className="flex justify-center items-center">
                      <ChatAIInput />
                    </div>
                  )}
                  {searchParams.view === "nfts" && (
                    <>
                      {/* NFTs Metrics */}
                      <NFTMetrics nonFungibleTokens={nonFungibleTokens} />

                      {/* NFTs List */}
                      <NFTList
                        tokens={nonFungibleTokens}
                        searchParams={searchParams.toString()}
                        walletAddress={params.walletAddress}
                      />
                    </>
                  )}
                  {searchParams.view === "tokens" && (
                    <>
                      {/* Token Metrics */}
                      <TokenMetrics fungibleTokens={fungibleTokens} />

                      {/* Tokens List */}
                      <TokensList
                        tokens={fungibleTokens}
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
  const url = process.env.NEXT_PUBLIC_HELIUS_RPC_URL;

  if (!url) {
    throw new Error("NEXT_PUBLIC_HELIUS_RPC_URL is not set");
  }

  try {
    // Separate requests for fungible and non-fungible tokens
    const [fungibleResponse, nftResponse] = await Promise.all([
      fetch(url, {
        cache: 'no-store',
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "fungible-tokens",
          method: "searchAssets",
          params: {
            ownerAddress: walletAddress,
            tokenType: "fungible",
            displayOptions: {
              showNativeBalance: true,
            },
          },
        }),
      }),
      fetch(url, {
        cache: 'no-store',
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "nfts",
          method: "searchAssets",
          params: {
            ownerAddress: walletAddress,
            tokenType: "nonFungible",
            displayOptions: {
              showCollectionMetadata: true,
            },
          },
        }),
      }),
    ]);

    const [fungibleData, nftData] = await Promise.all([
      fungibleResponse.json(),
      nftResponse.json(),
    ]);

    // Debug log the response structure
    console.log("Fungible Data:", fungibleData);
    console.log("NFT Data:", nftData);

    // Initialize empty arrays for both token types
    let fungibleTokens: FungibleToken[] = [];
    let nonFungibleTokens: NonFungibleToken[] = [];

    // Process fungible tokens if they exist
    if (fungibleData?.result?.items) {
      fungibleTokens = fungibleData.result.items.filter(
        (item): item is FungibleToken =>
          item.interface === "FungibleToken" || item.interface === "FungibleAsset",
      );

      // Hardcoding the image for USDC
      fungibleTokens = fungibleTokens.map((item) => {
        if (item.id === "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v") {
          return {
            ...item,
            content: {
              ...item.content,
              files: [
                {
                  uri: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
                  cdn_uri: "",
                  mime: "image/png",
                },
              ],
              links: {
                image:
                  "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
              },
            },
          };
        } else if (item.id === "bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1") {
          return {
            ...item,
            content: {
              ...item.content,
              files: [
                {
                  uri: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1/logo.png",
                  cdn_uri: "",
                  mime: "image/png",
                },
              ],
              links: {
                image:
                  "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1/logo.png",
              },
            },
          };
        }
        return item;
      });
    }

    // Process non-fungible tokens if they exist
    if (nftData?.result?.items) {
      nonFungibleTokens = nftData.result.items.filter(
        (item): item is NonFungibleToken =>
          !["FungibleToken", "FungibleAsset"].includes(item.interface),
      );
    }

    // Calculate SOL balance from lamports (with safety check)
    const solBalance = fungibleData.result?.nativeBalance?.lamports || 0;

    // Create SOL token object if there's a balance
    if (solBalance > 0) {
      const solToken = {
        interface: "FungibleAsset",
        id: "So11111111111111111111111111111111111111112",
        content: {
          $schema: "https://schema.metaplex.com/nft1.0.json",
          json_uri: "",
          files: [
            {
              uri: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
              cdn_uri: "",
              mime: "image/png",
            },
          ],
          metadata: {
            description: "Solana Token",
            name: "Wrapped SOL",
            symbol: "SOL",
            token_standard: "Native Token",
          },
          links: {
            image:
              "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
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
          owner: nonFungibleTokens[0]?.ownership?.owner,
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
            price_per_token: fungibleData.result?.nativeBalance?.price_per_sol || 0,
            total_price: fungibleData.result?.nativeBalance?.total_price || 0,
            currency: "",
          },
        },
      };
      fungibleTokens.push(solToken);
    }

    return { fungibleTokens, nonFungibleTokens };
  } catch (error) {
    console.error("Error in getAllAssets:", error);
    // Return empty arrays in case of error
    return {
      fungibleTokens: [],
      nonFungibleTokens: []
    };
  }
};

export default PortfolioPage;