import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ChevronRight, ChevronDown, Link as LinkIcon } from 'lucide-react';
import { NonFungibleToken } from "@/app/types";
import NFTDetails from './NFTDetails';



interface NFTTreeViewProps {
  nfts: NonFungibleToken[];
  walletAddress: string;
  searchParams: string;
}

interface GroupedNFTs {
  [symbol: string]: {
    urls: {
      [url: string]: NonFungibleToken[];
    };
  };
}

interface ExpandedState {
  symbols: { [symbol: string]: boolean };
  urls: { [url: string]: boolean };
}

const NFTTreeView = ({ nfts, walletAddress, searchParams }: NFTTreeViewProps) => {
 
    console.log("NFTTreeView loaded", new Date().toISOString());
    console.log("NFTs received:", nfts.length);
    console.log("Sample NFT structure:", nfts[0]);
 
    const [selectedNFT, setSelectedNFT] = useState<NonFungibleToken | null>(null);
  const [expandedState, setExpandedState] = useState<ExpandedState>({
    symbols: {},
    urls: {}
  });

  // Group NFTs by symbol and then by source URL
  const groupedData = useMemo(() => {
    return nfts.reduce((acc: GroupedNFTs, nft) => {
      const symbol = nft.content.metadata?.symbol || 'No Symbol';
      const sourceUrl = nft.content.links?.source || 'No Source URL';
      
      if (!acc[symbol]) {
        acc[symbol] = { urls: {} };
      }
      
      if (!acc[symbol].urls[sourceUrl]) {
        acc[symbol].urls[sourceUrl] = [];
      }
      
      acc[symbol].urls[sourceUrl].push(nft);
      return acc;
    }, {});
  }, [nfts]);

  console.log("Grouped data:", groupedData);

  const toggleSymbol = (symbol: string) => {
    setExpandedState(prev => ({
      ...prev,
      symbols: {
        ...prev.symbols,
        [symbol]: !prev.symbols[symbol]
      }
    }));
  };

  const toggleUrl = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedState(prev => ({
      ...prev,
      urls: {
        ...prev.urls,
        [url]: !prev.urls[url]
      }
    }));
  };

  const handleNFTClick = (nft: NonFungibleToken, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNFT(nft);
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return '-';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const getUrlFacts = (url: string) => {
    try {
      const urlObj = new URL(url);
      return {
        protocol: urlObj.protocol,
        hostname: urlObj.hostname,
        pathname: urlObj.pathname,
        searchParams: urlObj.search,
      };
    } catch {
      return {
        protocol: '-',
        hostname: '-',
        pathname: '-',
        searchParams: '-'
      };
    }
  };

  return (
    <>
      <div className="w-full overflow-x-auto rounded-lg bg-gray-800/10 ring-1 ring-white/10">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="w-8 p-3"></th>
              <th className="p-3 text-left">Symbol/URL/Facts</th>
              <th className="p-3 text-left">Details</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedData).map(([symbol, { urls }]) => (
              <React.Fragment key={symbol}>
                {/* Symbol Level */}
                <tr 
                  className="border-b border-white/10 hover:bg-gray-800/20 cursor-pointer"
                  onClick={() => toggleSymbol(symbol)}
                >
                  <td className="p-3">
                    {expandedState.symbols[symbol]
                      ? <ChevronDown className="h-4 w-4" />
                      : <ChevronRight className="h-4 w-4" />
                    }
                  </td>
                  <td className="p-3 font-medium">
                    {symbol}
                  </td>
                  <td className="p-3 text-gray-400">
                    {`${Object.keys(urls).length} unique source URLs`}
                  </td>
                </tr>

                {/* URL Level */}
                {expandedState.symbols[symbol] && Object.entries(urls).map(([url, nftsWithUrl]) => (
                  <React.Fragment key={url}>
                    <tr 
                      className="border-b border-white/10 hover:bg-gray-800/20 bg-gray-800/5"
                    >
                      <td className="p-3 pl-6">
                        <button
                          onClick={(e) => toggleUrl(url, e)}
                          className="focus:outline-none"
                        >
                          {expandedState.urls[url]
                            ? <ChevronDown className="h-4 w-4" />
                            : <ChevronRight className="h-4 w-4" />
                          }
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <LinkIcon className="h-4 w-4" />
                          <a 
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {truncateText(url, 50)}
                          </a>
                        </div>
                      </td>
                      <td className="p-3 text-gray-400">
                        {`${nftsWithUrl.length} NFTs`}
                      </td>
                    </tr>

                    {/* Facts Level */}
                    {expandedState.urls[url] && (
                      <tr className="border-b border-white/10 bg-gray-800/10">
                        <td className="p-3"></td>
                        <td colSpan={2} className="p-3">
                          <div className="pl-8 border-l-2 border-gray-700">
                            <h4 className="font-medium mb-2">URL Facts</h4>
                            <div className="space-y-2 text-sm text-gray-400">
                              {Object.entries(getUrlFacts(url)).map(([key, value]) => (
                                <div key={key} className="flex items-start gap-2">
                                  <span className="font-medium min-w-24">{key}:</span>
                                  <span className="break-all">{value}</span>
                                </div>
                              ))}
                              {/* Link to NFTs */}
                              <div className="mt-4">
                                <h5 className="font-medium mb-2">Associated NFTs:</h5>
                                <div className="flex flex-wrap gap-2">
                                  {nftsWithUrl.map((nft) => (
                                    <div 
                                      key={nft.id}
                                      onClick={(e) => handleNFTClick(nft, e)}
                                      className="cursor-pointer"
                                    >
                                      <img 
                                        src={nft.content.links.image} 
                                        alt={nft.content.metadata.name}
                                        className="h-8 w-8 rounded hover:ring-2 hover:ring-primary"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* NFT Details Modal */}
      {selectedNFT && (
        <NFTDetails
          nftData={[selectedNFT]}
          walletAddress={walletAddress}
          searchParams={searchParams}
          onClose={() => setSelectedNFT(null)}
        />
      )}
    </>
  );
};

export default NFTTreeView;