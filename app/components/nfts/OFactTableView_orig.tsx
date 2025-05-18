'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import { NonFungibleToken } from "@/app/types";
import NFTDetails from './NFTDetails';

interface GroupedNFTs {
  symbol: string;
  count: number;
  nfts: NonFungibleToken[];
}

interface OFactTableViewProps {
  walletAddress: string;
}

const OFactTableView: React.FC<OFactTableViewProps> = ({ walletAddress }) => {
  const [nfts, setNfts] = useState<NonFungibleToken[]>([]);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNFT, setSelectedNFT] = useState<NonFungibleToken | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [miningStatus, setMiningStatus] = useState<{ [key: string]: boolean }>({});

  const formatDate = (nft: NonFungibleToken): string => {
    const foundDates: Record<string, string> = {};
    
    const lifecycleMintDate = nft.lifecycle?.minted?.timestamp;
    const tokenMintDate = nft.tokenInfo?.mintTimestamp;
    const attributeMintDate = nft.content?.metadata?.attributes?.find(attr => attr.trait_type === 'Mint Date')?.value;
    const attributeCreationDate = nft.content?.metadata?.attributes?.find(attr => attr.trait_type === 'Creation Date')?.value;
    
    if (lifecycleMintDate) foundDates.lifecycle = lifecycleMintDate;
    if (tokenMintDate) foundDates.token = tokenMintDate;
    if (attributeMintDate) foundDates.mintDate = attributeMintDate;
    if (attributeCreationDate) foundDates.creationDate = attributeCreationDate;
    
    if (Object.keys(foundDates).length > 0) {
      console.log('Found dates:', foundDates);
    }

    const dateToUse = attributeMintDate || attributeCreationDate || lifecycleMintDate || tokenMintDate;
    return dateToUse ? new Date(dateToUse).toLocaleString() : 'No date available';
  };

  const fetchOFactNFTs = async () => {
    if (!walletAddress) {
      setError('No wallet address provided');
      setLoading(false);
      return;
    }
  
    const rpcUrl = process.env.NEXT_PUBLIC_HELIUS_RPC_URL;
    const apiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
    
    if (!rpcUrl || !apiKey) {
      setError('Helius configuration not complete');
      setLoading(false);
      return;
    }

    const baseUrl = `${rpcUrl}/?api-key=${apiKey}`;
  
    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'my-id',
          method: 'getAssetsByOwner',
          params: {
            ownerAddress: walletAddress,
            page: 1,
            limit: 1000,
            sortBy: {
              sortBy: "created",
              sortDirection: "desc"
            }
          }
        })
      });
  
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      
      if (result.error) throw new Error(`Helius API error: ${result.error.message || 'Unknown error'}`);
      if (!result?.result?.items) throw new Error('Invalid response format from Helius API');

      setNfts(result.result.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch NFTs');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    setLastRefreshTime(new Date());
    await fetchOFactNFTs();
  };

  const handleMining = async (nftId: string) => {
    setMiningStatus(prev => ({ ...prev, [nftId]: true }));
    try {
      // Add your mining logic here
      // For example:
      // await mineNFTFacts(nftId);
      
      // Simulated mining delay for demonstration
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error('Mining failed:', error);
      // Handle error appropriately
    } finally {
      setMiningStatus(prev => ({ ...prev, [nftId]: false }));
    }
  };

  useEffect(() => {
    fetchOFactNFTs();
  }, [walletAddress]);

  const groupedNFTs = React.useMemo(() => {
    if (!Array.isArray(nfts)) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const validNFTs = nfts.filter(nft => {
        // Check symbol first
        const symbol = nft.content?.metadata?.symbol;
        if (symbol !== 'OFACT') return false;
        
        // Get dates from various possible fields
        const attributeMintDate = nft.content?.metadata?.attributes?.find(attr => attr.trait_type === 'Mint Date')?.value;
        const attributeCreationDate = nft.content?.metadata?.attributes?.find(attr => attr.trait_type === 'Creation Date')?.value;
        const lifecycleMintDate = nft.lifecycle?.minted?.timestamp;
        const tokenMintDate = nft.tokenInfo?.mintTimestamp;
        
        // Get the most recent date from all available date fields
        const nftDate = new Date(attributeMintDate || attributeCreationDate || lifecycleMintDate || tokenMintDate || '');
        
        // Calculate the timestamp from .25 hours ago
        const twoHoursAgo = new Date();
        twoHoursAgo.setHours(twoHoursAgo.getHours() - .25);
        
        // Check if the NFT was created within the last 2 hours
        return !isNaN(nftDate.getTime()) && nftDate.getTime() >= twoHoursAgo.getTime();
      });

    const groups: { [key: string]: GroupedNFTs } = {};
    validNFTs.forEach(nft => {
      const symbol = 'OFACT';
      if (!groups[symbol]) {
        groups[symbol] = { symbol, count: 0, nfts: [] };
      }
      groups[symbol].nfts.push(nft);
      groups[symbol].count++;
    });

    return Object.values(groups);
  }, [nfts]);

  const toggleGroup = (symbol: string) => {
    setExpandedGroups(prev => ({ ...prev, [symbol]: !prev[symbol] }));
  };

  if (loading) {
    return (
      <div className="w-full p-8 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4 text-center text-red-400 bg-red-900/20 rounded-lg">
        {error}
      </div>
    );
  }

  if (groupedNFTs.length === 0) {
    return <div className="w-full p-4 text-center text-gray-400">No NFTs found</div>;
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-400">Showing all NFTs</div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-100/5 px-3 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-white/10 transition-all hover:bg-indigo-100/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRefreshing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            'Refresh'
          )}
        </button>
      </div>
      
      <div className="w-full overflow-x-auto rounded-lg bg-gray-800/10 ring-1 ring-white/10">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="w-8 p-3"></th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Symbol</th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-left">Creation Date</th>
              <th className="p-3 text-left">Count</th>
              <th className="p-3 text-left">Fact Mining</th>
            </tr>
          </thead>
          <tbody>
            {groupedNFTs.map((group) => (
              <React.Fragment key={group.symbol}>
                <tr 
                  onClick={() => toggleGroup(group.symbol)}
                  className="border-b border-white/10 bg-blue-900/30 cursor-pointer hover:bg-blue-900/40"
                >
                  <td className="w-8 p-3 text-center">
                    {expandedGroups[group.symbol] ? 
                      <ChevronDown className="h-4 w-4" /> : 
                      <ChevronRight className="h-4 w-4" />
                    }
                  </td>
                  <td className="p-3">
                    <div className="w-8 h-8">
                      <img 
                        src="/images/Yellow.svg"
                        alt="Fact Icon"
                        className="w-full h-full"
                      />
                    </div>
                  </td>
                  <td className="p-3">{group.symbol}</td>
                  <td className="p-3"></td>
                  <td className="p-3 text-gray-400"></td>
                  <td className="p-3">{group.count} NFTs</td>
                  <td className="p-3"></td>
                </tr>

                {expandedGroups[group.symbol] && group.nfts.map((nft) => (
                  <tr 
                    key={nft.id}
                    className="border-b border-white/10 bg-emerald-900/20 hover:bg-emerald-900/30"
                  >
                    <td className="w-8 p-3"></td>
                    <td className="p-3" onClick={() => setSelectedNFT(nft)}>NFT</td>
                    <td className="p-3" onClick={() => setSelectedNFT(nft)}>{nft.content?.metadata?.symbol || 'No Symbol'}</td>
                    <td className="p-3 text-gray-300" onClick={() => setSelectedNFT(nft)}>{nft.content?.metadata?.description || 'No description'}</td>
                    <td className="p-3 text-gray-300" onClick={() => setSelectedNFT(nft)}>{formatDate(nft)}</td>
                    <td className="p-3 text-gray-300" onClick={() => setSelectedNFT(nft)}>1</td>
                    <td className="p-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMining(nft.id);
                        }}
                        disabled={miningStatus[nft.id]}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-100/5 px-3 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-white/10 transition-all hover:bg-emerald-100/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {miningStatus[nft.id] ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Mining...
                          </>
                        ) : (
                          'Mine Fact'
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {selectedNFT && (
          <NFTDetails
            nftData={[selectedNFT]}
            walletAddress={walletAddress}
            searchParams=""
            onClose={() => setSelectedNFT(null)}
          />
        )}
      </div>
    </div>
  );
};

export default OFactTableView;