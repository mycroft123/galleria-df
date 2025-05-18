export const fetchNFTs = async (walletAddress: string) => {
    if (!walletAddress) {
      throw new Error('No wallet address provided');
    }
  
    const url = process.env.NEXT_PUBLIC_HELIUS_RPC_URL;
    const apiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
    
    if (!url || !apiKey) {
      throw new Error('Helius configuration is not properly set');
    }
  
    const baseUrl = `${url}/?api-key=${apiKey}`;
    const timestamp = Date.now();
  
    try {
      const response = await fetch(`${baseUrl}&t=${timestamp}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'nfts',
          method: 'searchAssets',
          params: {
            ownerAddress: walletAddress,
            tokenType: 'nonFungible',
            displayOptions: {
              showCollectionMetadata: true,
            },
          },
        }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
  
      if (data.error) {
        throw new Error(`API error: ${data.error.message}`);
      }
  
      return data.result?.items?.filter(
        (item) => !['FungibleToken', 'FungibleAsset'].includes(item.interface)
      ) || [];
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      throw error;
    }
  }