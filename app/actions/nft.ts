export async function refreshNFTs(walletAddress: string) {
  try {
    const url = process.env.NEXT_PUBLIC_HELIUS_RPC_URL;
    if (!url) {
      throw new Error("NEXT_PUBLIC_HELIUS_RPC_URL is not set");
    }

    const timestamp = Date.now();
    const response = await fetch(`${url}?t=${timestamp}`, {
      cache: 'no-store',
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "my-id",
        method: "getAssetsByOwner",  // Changed from searchAssets
        params: {
          ownerAddress: walletAddress,
          page: 1,                   // Added page parameter
          limit: 10,                 // Added limit parameter
          sortBy: {                  // Added sortBy parameter
            sortBy: "recent_action", // Sort by most recent
            sortDirection: "desc"    // Descending order
          }
        },
      }),
    });

    const data = await response.json();
    
    if (!data.result?.items) {
      return [];
    }

    return data.result.items.filter(
      (item) => !["FungibleToken", "FungibleAsset"].includes(item.interface)
    );
  } catch (error) {
    console.error('Error refreshing NFTs:', error);
    throw error;
  }
}