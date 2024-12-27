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

const PortfolioPage = async ({ searchParams, params }: PortfolioPageProps) => {
  console.log("=== PortfolioPage Debugging Start ===");
  console.log("Search Params:", searchParams);
  console.log("Wallet Address:", params.walletAddress);

  let fungibleTokens: FungibleToken[] = [];
  let nonFungibleTokens: NonFungibleToken[] = [];

  try {
    const { fungibleTokens: fetchedFungibleTokens, nonFungibleTokens: fetchedNonFungibleTokens } = await getAllAssets(params.walletAddress);
    fungibleTokens = fetchedFungibleTokens;
    nonFungibleTokens = fetchedNonFungibleTokens;
    console.log("Fetched Assets:", { fungibleTokens, nonFungibleTokens });
  } catch (error) {
    console.error("Error fetching assets:", error);
    return (
      <div className="h-screen bg-radial-gradient flex items-center justify-center">
        <p>Error loading assets. Please try again later.</p>
      </div>
    );
  }

  if (!fungibleTokens.length && !nonFungibleTokens.length) {
    console.warn("No assets found for wallet:", params.walletAddress);
    return (
      <div className="h-screen bg-radial-gradient flex items-center justify-center">
        <p>No assets found for this wallet.</p>
      </div>
    );
  }

  console.log("Rendering PortfolioPage with assets...");

  return (
    <div className="h-screen bg-radial-gradient">
      <div className="lg:pl-20">
        <Navigation searchParams={searchParams} params={params} />
        <main>
          <div className="px-6 py-6">
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
              <Suspense fallback={<div>Loading...</div>} key={searchParams.view}>
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
  console.log("Fetching assets for wallet:", walletAddress);

  const baseUrl = process.env.NEXT_PUBLIC_HELIUS_RPC_URL;
  const apiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY;

  console.log("Environment Variables:", {
    baseUrl,
    apiKeyExists: !!apiKey,
    apiKeyLength: apiKey?.length || 0,
  });

  if (!baseUrl || !apiKey) {
    console.error("Environment variables are missing or invalid.");
    throw new Error("Environment variables are not correctly set.");
  }

  const url = `${baseUrl}?api-key=${apiKey}`;
  console.log("Constructed URL:", url);

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

    console.log("Response received:", {
      status: response.status,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API returned an error:", errorData);
      throw new Error(`Failed to fetch data: ${response.status}`);
    }

    const data = await response.json();
    console.log("Raw API response:", data);

    const items: (FungibleToken | NonFungibleToken)[] = data.result.items;
    const fungibleTokens = items.filter((item): item is FungibleToken => item.interface === "FungibleToken" || item.interface === "FungibleAsset");
    const nonFungibleTokens = items.filter((item): item is NonFungibleToken => item.interface !== "FungibleToken" && item.interface !== "FungibleAsset");

    console.log("Processed Assets:", { fungibleTokens, nonFungibleTokens });

    return { fungibleTokens, nonFungibleTokens };
  } catch (error) {
    console.error("Error during fetch:", error);
    throw error;
  }
};

export default PortfolioPage;
