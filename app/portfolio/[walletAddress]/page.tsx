import { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import {
  NFTDetails,
  TokenDetails,
  TokensList,
  NFTTable,
  TokenMetrics,
  NFTMetrics,
  Navigation,
  URLInput,
  AIInput,
  PAIInput,
  Analysis,
  Story
} from "@/app/components";
import PortfolioView from "@/app/components/tokenbalance/PortfolioView";
import PersistentChatFrame from "@/app/components/PersistentChatFrame"; // Import the new component

import { FungibleToken, NonFungibleToken } from "@/app/types";

interface GroupedNFTs {
  name: string;
  count: number;
  nfts: NonFungibleToken[];
}

type SearchParams = { 
  view?: string; 
  details?: string; 
  tokenDetails?: string;
  collection?: string;
  type?: string;
  symbol?: string;
  search?: string;
  [key: string]: string | string[] | undefined;
};

type Props = {
  walletAddress: string;
};

// Helper function to safely get params
const getParams = async (params: Props) => {
  'use server';
  return params;
};

// Helper function to safely get search params
const getSearchParams = async (searchParams: SearchParams) => {
  'use server';
  return searchParams;
};

interface PageProps {
  params: { walletAddress: string };
  searchParams: SearchParams;
}

const PortfolioPage = async ({ params, searchParams }: PageProps) => {
  // Await params and searchParams safely
  const awaitedParams = await getParams(params);
  const awaitedSearchParams = await getSearchParams(searchParams);

  // Destructure awaited values
  const walletAddress = awaitedParams.walletAddress || "ExK2ZcWx6tpVe5xfqkHZ62bMQNpStLj98z2WDUWKUKGp";
  const { view, details, tokenDetails } = awaitedSearchParams;

  // Fetch assets
  const { fungibleTokens, nonFungibleTokens } = await getAllAssets(walletAddress);

  const hasModal = details || tokenDetails;
  const modalClass = hasModal ? "flex h-screen flex-col overflow-hidden" : "";
  
  // Check if the current view is chat
  const isChatView = view === "chat";

  return (
    <div className="min-h-screen bg-radial-gradient">
      <div className="lg:pl-20">
        {/* Navigation - Added fixed positioning and z-index */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-radial-gradient">
          <Navigation searchParams={awaitedSearchParams} params={awaitedParams} />
        </div>

        {/* Persistent Chat Frame - always rendered, visibility controlled by prop */}
        <PersistentChatFrame isActive={isChatView} />

        {/* Main area - only render content when not in chat view */}
        <main className={isChatView ? "pt-16 hidden" : "pt-16"}>
          <div className="px-6 py-6">
            {/* Tokens Modal */}
            {tokenDetails && (
              <div className="fixed inset-0 z-40 flex items-center justify-center bg-orange-900 bg-opacity-70">
                <div className="h-4/5 w-10/12 sm:w-2/3">
                  <TokenDetails
                    key={`token-${tokenDetails}`}
                    tokenData={fungibleTokens.filter(token => token.id === tokenDetails)}
                    searchParams={awaitedSearchParams}
                    walletAddress={walletAddress}
                  />
                </div>
              </div>
            )}

            {/* NFTs Modal */}
            {details && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-orange-900 bg-opacity-70">
                <div className="h-4/5 w-10/12 sm:w-2/3">
                  <NFTDetails
                    key={`nft-${details}`}
                    nftData={nonFungibleTokens.filter(nft => nft.id === details)}
                    searchParams={`view=${view}`}
                    walletAddress={walletAddress}
                  />
                </div>
              </div>
            )}

            <div className={modalClass}>
              <Suspense
                fallback={
                  <div className="flex h-screen items-center justify-center">
                    <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-orange-400"></div>
                  </div>
                }
                key={`${view}-${walletAddress}`}
              >
                <div>
                  {view === "ai" && (
                    <div className="flex justify-center items-center">
                      <AIInput key={`ai-${walletAddress}`} />
                    </div>
                  )}
                  
                  {view === "ai2" && (
                    <div className="flex justify-center items-center">
                      <PAIInput key={`pai-${walletAddress}`} />
                    </div>
                  )}

                  {view === "story" && (
                      <div className="flex justify-center items-center">
                        <Story key={`story-${walletAddress}`} />
                      </div>
                  )}
                  
                  {view === "url" && (
                    <div className="flex justify-center items-center">
                      <URLInput key={`url-${walletAddress}`} />
                    </div>
                  )}
                  
                  {/* The chat iframe is now handled by PersistentChatFrame */}
                  {/* We've removed the chat view code from here */}
                  
                  {view === "analysis" && (
                    <div className="flex justify-center items-center">
                      <Analysis key={`analysis-${walletAddress}`} />
                    </div>
                  )}
                  
                  {view === "nfts" && (
                    <NFTTable
                      key={`table-${walletAddress}`}
                      walletAddress={walletAddress}
                      nftDataArray={nonFungibleTokens}
                      searchParams={awaitedSearchParams}
                    />
                  )}
                  
                  {view === "portfolio" && (
                    <PortfolioView
                      key={`portfolio-${walletAddress}`}
                      walletAddress={walletAddress}
                      searchParams={awaitedSearchParams.toString()}
                    />
                  )}
                  
                  {view === "tokens" && (
                    <>
                      <TokenMetrics 
                        key={`token-metrics-${walletAddress}`}
                        fungibleTokens={fungibleTokens} 
                      />
                      <TokensList
                        key={`token-list-${walletAddress}`}
                        tokens={fungibleTokens}
                        searchParams={awaitedSearchParams.toString()}
                        walletAddress={walletAddress}
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
  // Existing getAllAssets implementation
  const url = process.env.NEXT_PUBLIC_HELIUS_RPC_URL;
  const apiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY;

  if (!url || !apiKey) {
    throw new Error("Helius configuration is not properly set");
  }

  try {
    // Add timestamp to prevent caching
    const timestamp = Date.now();
    const baseUrl = `${url}/?api-key=${apiKey}`;
    
    // Prepare request body for fungible tokens
    const fungibleRequestBody = {
      jsonrpc: "2.0",
      id: "my-id",
      method: "getAssetsByOwner",
      params: {
        ownerAddress: walletAddress,
        limit: 100,
        sortBy: {
          sortBy: "id",
          sortDirection: "desc"
        }
      }
    };

    const fungibleResponse = await fetch(`${baseUrl}&t=${timestamp}`, {
      cache: 'no-store',
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fungibleRequestBody),
    });

    if (!fungibleResponse.ok) {
      throw new Error('Failed to fetch data from Helius API');
    }

    const fungibleData = await fungibleResponse.json();

    let fungibleTokens: FungibleToken[] = [];

    if (fungibleData?.result?.items) {
      fungibleTokens = fungibleData.result.items.filter(
        (item): item is FungibleToken =>
          item.interface === "FungibleToken" || item.interface === "FungibleAsset",
      );
    }

    const solBalance = fungibleData.result?.nativeBalance?.lamports || 0;
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
          owner: walletAddress,
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

    return { 
      fungibleTokens, 
      nonFungibleTokens: [] // Return empty array for NFTs
    };
  } catch (error) {
    console.error('Helius API Error:', {
      error,
      message: error.message,
      timestamp: new Date().toISOString()
    });
    return {
      fungibleTokens: [],
      nonFungibleTokens: []
    };
  }
};

// Generate metadata using awaited params
export async function generateMetadata({
  params,
}: {
  params: Props;
}): Promise<Metadata> {
  const { walletAddress } = await getParams(params);
  return {
    title: `DeFacts - ${walletAddress}`,
    description: `View portfolio details for wallet ${walletAddress}`,
  };
}

export default PortfolioPage;