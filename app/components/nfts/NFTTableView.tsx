'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import { NonFungibleToken } from "@/app/types";
import NFTDetails from './NFTDetails';

interface GroupedNFTs {
  name: string;
  count: number;
  nfts: NonFungibleToken[];
}

interface DFactTableViewProps {
  walletAddress: string;
}

const DFactTableView: React.FC<DFactTableViewProps> = ({ walletAddress }) => {
  const [nfts, setNfts] = useState<NonFungibleToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNFT, setSelectedNFT] = useState<NonFungibleToken | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDFactNFTs = async () => {
    if (!walletAddress) {
      setError('No wallet address provided');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_HELIUS_RPC_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'my-id',
          method: 'getAssetsByOwner',
          params: {
            ownerAddress: walletAddress,
            page: 1,
            limit: 1000
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch NFTs');
      }

      const data = await response.json();
      
      // Filter for DFact NFTs
      const dFactNFTs = data.result.items.filter((nft: NonFungibleToken) => {
        const symbol = nft.content?.metadata?.symbol;
        return symbol?.toLowerCase().includes('dfact');
      });

      setNfts(dFactNFTs);
      setError(null);
    } catch (err) {
      setError('Failed to fetch DFact NFTs');
      console.error('Error fetching DFact NFTs:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    await fetchDFactNFTs();
  };

  useEffect(() => {
    fetchDFactNFTs();
  }, [walletAddress]);

  // Group NFTs by collection
  const groupedNFTs: GroupedNFTs[] = React.useMemo(() => {
    if (!Array.isArray(nfts)) {
      console.error('NFTs is not an array:', nfts);
      return [];
    }
    
    // Group by collection
    const collections: { [key: string]: GroupedNFTs } = {};
    
    nfts.forEach(nft => {
      const collectionName = nft.content?.metadata?.name || "Unnamed Collection";
      
      if (!collections[collectionName]) {
        collections[collectionName] = {
          name: collectionName,
          count: 0,
          nfts: []
        };
      }
      
      collections[collectionName].nfts.push(nft);
      collections[collectionName].count++;
    });

    return Object.values(collections);
  }, [nfts]);

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
    return <div className="w-full p-4 text-center text-gray-400">No DFact NFTs found</div>;
  }

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const truncateText = (text: string | undefined, maxLength: number = 50) => {
    if (!text) return 'No description';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-end">
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
              <th className="p-3 text-left">Label</th>
              <th className="p-3 text-left">Content</th>
            </tr>
          </thead>
          <tbody>
            {groupedNFTs.map((group) => (
              <React.Fragment key={group.name}>
                <tr 
                  onClick={() => toggleGroup(group.name)}
                  className="border-b border-white/10 bg-blue-900/30 cursor-pointer hover:bg-blue-900/40"
                >
                  <td className="w-8 p-3 text-center">
                    {expandedGroups[group.name] ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </td>
                  <td className="p-3">Collection</td>
                  <td className="p-3">{group.name}</td>
                  <td className="p-3 text-gray-400">{group.count} NFTs</td>
                </tr>

                {expandedGroups[group.name] && group.nfts.map((nft) => (
                  <tr 
                    key={nft.id}
                    onClick={() => setSelectedNFT(nft)}
                    className="border-b border-white/10 bg-emerald-900/20 hover:bg-emerald-900/30 cursor-pointer"
                  >
                    <td className="w-8 p-3"></td>
                    <td className="p-3">NFT</td>
                    <td className="p-3">
                      {nft.content?.metadata?.name || 'Unnamed NFT'}
                    </td>
                    <td className="p-3 text-gray-300">
                      {truncateText(nft.content?.metadata?.description)}
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

export default DFactTableView;