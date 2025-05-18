'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import Image from 'next/image';
import NFTDetails from './NFTDetails';
import { NonFungibleToken } from "@/app/types";

interface GroupedNFTs {
  sourceUrl: string;
  facts: {
    symbol: string;
    description: string;
    creationDate: string;
    nft: NonFungibleToken;
  }[];
}

interface AFactTableViewProps {
  walletAddress: string;
}

const AFactTableView: React.FC<AFactTableViewProps> = ({ walletAddress }) => {
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
    
    const attributeMintDate = nft.content?.metadata?.attributes?.find(attr => attr.trait_type === 'Mint Date')?.value;
    const attributeCreationDate = nft.content?.metadata?.attributes?.find(attr => attr.trait_type === 'Creation Date')?.value;
    const lifecycleMintDate = nft.lifecycle?.minted?.timestamp;
    const tokenMintDate = nft.tokenInfo?.mintTimestamp;
    
    if (attributeMintDate) foundDates.mintDate = attributeMintDate;
    if (attributeCreationDate) foundDates.creationDate = attributeCreationDate;
    if (lifecycleMintDate) foundDates.lifecycle = lifecycleMintDate;
    if (tokenMintDate) foundDates.token = tokenMintDate;
    
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
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Mining failed:', error);
    } finally {
      setMiningStatus(prev => ({ ...prev, [nftId]: false }));
    }
  };

  useEffect(() => {
    fetchOFactNFTs();
  }, [walletAddress]);

  const groupedNFTs = React.useMemo(() => {
    if (!Array.isArray(nfts)) return [];
    
    const validNFTs = nfts.filter(nft => {
      // Check for AFACT symbol first
      const hasAFactSymbol = nft.content?.metadata?.symbol === "AFACT";
      if (!hasAFactSymbol) return false;
      
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
      const sourceUrl = nft.content?.metadata?.attributes?.find(
        attr => attr.trait_type === 'Source'
      )?.value || 'Unknown Source';
      
      if (!groups[sourceUrl]) {
        groups[sourceUrl] = {
          sourceUrl,
          facts: []
        };
      }
      
      groups[sourceUrl].facts.push({
        symbol: nft.content?.metadata?.symbol || 'Unknown Symbol',
        description: nft.content?.metadata?.description || 'No description',
        creationDate: formatDate(nft),
        nft: nft
      });
    });
  
    return Object.values(groups);
  }, [nfts]);

  const toggleGroup = (sourceUrl: string) => {
    setExpandedGroups(prev => ({ ...prev, [sourceUrl]: !prev[sourceUrl] }));
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
    return <div className="w-full p-4 text-center text-gray-400">No AFacts found</div>;
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-400">Showing AFacts by Source*</div>
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
              <th className="w-24 p-3 text-left">Type</th>
              <th className="p-3 text-left">AFACT Symbol</th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-left">Creation Date</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {groupedNFTs.map((group) => (
              <React.Fragment key={group.sourceUrl}>
                <tr 
                  onClick={() => toggleGroup(group.sourceUrl)}
                  className="border-b border-white/10 bg-blue-900/30 cursor-pointer hover:bg-blue-900/40"
                >
                  <td className="w-8 p-3 text-center">
                    {expandedGroups[group.sourceUrl] ? 
                      <ChevronDown className="h-6 w-6" /> : 
                      <ChevronRight className="h-6 w-6" />
                    }
                  </td>
                  <td className="w-24 p-3">
                    <div className="flex items-center justify-center">
                      <Image 
                        src="/images/Yellow.svg" 
                        alt="Yellow indicator"
                        width={48}
                        height={48}
                      />
                    </div>
                  </td>
                  <td className="p-3" colSpan={4}>{group.sourceUrl}</td>
                </tr>

                {expandedGroups[group.sourceUrl] && group.facts.map((fact) => (
                  <tr 
                    key={fact.nft.id}
                    onClick={() => setSelectedNFT(fact.nft)}
                    className="border-b border-white/10 bg-emerald-900/20 hover:bg-emerald-900/30 cursor-pointer"
                  >
                    <td className="w-8 p-3"></td>
                    <td className="w-24 p-3">
                      <div className="flex items-center justify-center">
                        <Image 
                          src="/images/Red.svg" 
                          alt="Red indicator"
                          width={48}
                          height={48}
                        />
                      </div>
                    </td>
                    <td className="p-3">{fact.symbol}</td>
                    <td className="p-3 text-gray-300">{fact.description}</td>
                    <td className="p-3 text-gray-300">{fact.creationDate}</td>
                    <td className="p-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMining(fact.nft.id);
                        }}
                        disabled={miningStatus[fact.nft.id]}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-100/5 px-3 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-white/10 transition-all hover:bg-emerald-100/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {miningStatus[fact.nft.id] ? (
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

export default AFactTableView;