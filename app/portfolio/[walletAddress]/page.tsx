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

interface BaseItem {
  interface: string;
  id: string;
  content?: any;
  ownership?: any;
  token_info?: any;
}

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
  </div>
);

const PortfolioPage = async ({ searchParams, params }: PortfolioPageProps) => {
  let assets;
  try {
    console.log('Starting to fetch assets for wallet:', params.walletAddress);
    
    if (!params.walletAddress) {
      console.error('No wallet address provided');
      throw new Error('Wallet address is required');
    }

    assets = await getAllAssets(params.walletAddress);
    console.log('Successfully fetched assets');
    
  } catch (error) {
    console.error("Detailed portfolio error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack available');
    console.error("Wallet address attempted:", params.walletAddress);
    
    return (
      <div className="h-screen bg-radial-gradient flex items-center justify-center">
        <div className="text-white text-center p-6 rounded-lg">
          <h2 className="text-xl mb-4">Error Loading Portfolio</h2>
          <p>{error instanceof Error ? error.message : 'Failed to load portfolio data'}</p>
        </div>
      </div>
    );
  }

  if (!assets) {
    console.error('No assets returned from getAllAssets');
    return (
      <div className="h-screen bg-radial-gradient flex items-center justify-center">
        <div className="text-white text-center">
          <p>No portfolio data available</p>
        </div>
      </div>
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
  // Initial debug logging
  console.log('=== DEBUG START ===');
  console.log('1. Wallet Address:', walletAddress);
  
  // Log raw environment variables
  console.log('2. Raw Environment Variables:');
  console.log('   RPC URL:', process.env.NEXT_PUBLIC_HELIUS_RPC_URL);
  console.log('   API Key exists:', !!process.env.NEXT_PUBLIC_HELIUS_API_KEY);
  console.log('   API Key length:', process.env.NEXT_PUBLIC_HELIUS_API_KEY?.length || 0);

  // Using Edge-compatible environment variable access
  const baseUrl = process.env.NEXT_PUBLIC_HELIUS_RPC_URL;
  const apiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY;

  console.log('3. Extracted Variables:');
  console.log('   Base URL:', baseUrl);
  console.log('   API Key exists:', !!apiKey);

  if (!baseUrl) {
    console.error('4. ERROR: RPC URL is missing');
    throw new Error("NEXT_PUBLIC_HELIUS_RPC_URL is not set");
  }

  if (!apiKey) {
    console.error('4. ERROR: API Key is missing');
    throw new Error("NEXT_PUBLIC_HELIUS_API_KEY is not set");
  }

  // Construct URL with API key as query parameter
  const url = `${baseUrl}?api-key=${apiKey}`;
  
  // Log URL (safely)
  const urlObj = new URL(url);
  console.log('5. Constructed URL:');
  console.log('   Origin:', urlObj.origin);
  console.log('   Pathname:', urlObj.pathname);
  console.log('   Has API Key in query:', urlObj.searchParams.has('api-key'));

  console.log('6. Making fetch request...');
  
  try {
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
    });

    console.log('7. Response received:');
    console.log('   Status:', response.status);
    console.log('   OK:', response.ok);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('8. Error Response Data:', errorData);
      throw new Error(`Failed to fetch data: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('8. Success! Data received');
    
    if (!data.result) {
      console.error('9. Invalid API response format:', data);
      throw new Error('Invalid API response format');
    }

    const items = data.result.items;
    console.log('10. Number of items received:', items.length);
    console.log('=== DEBUG END ===');

    // Rest of your existing code...
    
  } catch (error) {
    console.error('ERROR in getAllAssets:', error);
    throw error;
  }
};

export default PortfolioPage;