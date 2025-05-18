// In actions.ts (refreshNFTs function)
'use server'


// In actions.ts
const fetchFromHelius = async (walletAddress: string) => {
  const url = process.env.NEXT_PUBLIC_HELIUS_RPC_URL;
  const apiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY;

  if (!url || !apiKey) {
    throw new Error("Helius configuration is not properly set");
  }

  const baseUrl = `${url}/?api-key=${apiKey}`;
  const response = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "nfts",
      method: "getAssetsByOwner",
      params: {
        ownerAddress: walletAddress,
        limit: 100,
        sortBy: {
          sortBy: "id",
          sortDirection: "desc"
        }
      }
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`API error: ${data.error.message}`);
  }

  return data.result?.items || [];
}



export async function refreshNFTs(walletAddress: string) {
  if (!walletAddress) {
    throw new Error('No wallet address provided');
  }

  try {
    return await fetchFromHelius(walletAddress);
  } catch (error) {
    console.error('Error refreshing NFTs:', error);
    throw error;
  }
}