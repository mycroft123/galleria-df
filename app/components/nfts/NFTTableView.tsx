"use client";

import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { NonFungibleToken } from "@/app/types";

interface NFTTableViewProps {
  nfts: NonFungibleToken[];
  walletAddress: string;
  searchParams: string;
}

const NFTTableView = ({ nfts, walletAddress, searchParams }: NFTTableViewProps) => {
  const [sortConfig, setSortConfig] = React.useState<{
    key: string | null;
    direction: 'asc' | 'desc';
  }>({
    key: null,
    direction: 'asc'
  });

  const sortedNFTs = React.useMemo(() => {
    const sorted = [...nfts];
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        let aVal, bVal;
        
        switch(sortConfig.key) {
          case 'symbol':
            aVal = a.content.metadata?.symbol || '';
            bVal = b.content.metadata?.symbol || '';
            break;
          case 'description':
            aVal = a.content.metadata?.description || '';
            bVal = b.content.metadata?.description || '';
            break;
          default:
            return 0;
        }
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sorted;
  }, [nfts, sortConfig]);

  const requestSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return '-';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="w-full overflow-x-auto rounded-lg bg-gray-800/10 ring-1 ring-white/10">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            <th className="p-3 text-left">Image</th>
            <th className="p-3 text-left min-w-[300px]">
              <button 
                className="flex items-center gap-1 hover:text-primary"
                onClick={() => requestSort('description')}
              >
                Description <ArrowUpDown className="h-4 w-4" />
              </button>
            </th>
            <th className="p-3 text-left">
              <button 
                className="flex items-center gap-1 hover:text-primary"
                onClick={() => requestSort('symbol')}
              >
                Symbol <ArrowUpDown className="h-4 w-4" />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedNFTs.map((nft) => (
            <tr 
              key={nft.id} 
              className="border-b border-white/10 hover:bg-gray-800/20"
            >
              <td className="p-3">
                <a href={`/portfolio/${walletAddress}?${searchParams}&details=${nft.id}`}>
                  <div className="h-12 w-12 overflow-hidden rounded-lg">
                    <img 
                      src={nft.content.links.image} 
                      alt={nft.content.metadata.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </a>
              </td>
              <td className="p-3 max-w-xs">
                <a href={`/portfolio/${walletAddress}?${searchParams}&details=${nft.id}`} 
                   className="hover:text-primary">
                  {truncateText(nft.content.metadata?.description || '-', 100)}
                </a>
              </td>
              <td className="p-3">
                {nft.content.metadata?.symbol || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default NFTTableView;