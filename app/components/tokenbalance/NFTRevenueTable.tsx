'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Loader2, ExternalLink, FileText, ChevronUp } from 'lucide-react';
import { NonFungibleToken } from "@/app/types";

// Define the structure for NFT revenue data
interface NFTRevenue {
  id: string;
  name: string;
  type: 'OFACT' | 'AFACT';
  imageUrl: string;
  description?: string;
  sourceUrl?: string;
  daily: number;
  weekly: number;
  monthly: number;
  allTime: number;
  lastUpdated: string;
  parentId?: string; // For AFACTs to link to their parent OFACT
}

// Interface for AFACT structure (same as in OFactTableView)
interface AFact {
  mintId: string;
  fact: string;
  sourceUrl: string;
  extractedDate: string;
}

interface NFTRevenueTableProps {
  walletAddress: string;
  onNFTSelected: (nftId: string, revenueData: NFTRevenue) => void;
}

// Color to image map for SVG icons (same as in OFactTableView)
const COLOR_TO_IMAGE_MAP: { [key: string]: string } = {
  blue: "https://rim3qi36iu6y55tmt77rm7w3ved7cpdjjrhty2kl3tplkez3drmq.arweave.net/ihm4I35FPY72bJ__Fn7bqQfxPGlMTzxpS9zetRM7HFk",
  yellow: "https://w6hav65sf2mc3do4yxsgex3rfupnngahqfibv7lphwvgisf7cfua.arweave.net/t44K-7IumC2N3MXkYl9xLR7WmAeBUBr9bz2qZEi_EWg",
  orange: "https://z325ctfzpasszfceuep3x4mv33dncyszsb2gcbg67rjljiguchba.arweave.net/zvXRTLl4JSyURKEfu_GV3sbRYlmQdGEE3vxStKDUEcI",
  purple: "https://vcbkxb2o4tbqmi3watpcr7smrk3sviqiibvqbzj443qxh7ltgzbq.arweave.net/qIKrh07kwwYjdgTeKP5MircqoghAawDlPObhc_1zNkM",
  green: "https://imauscty4e4ddllrj32jcna2gei5xpgigjxgplkbugqoceyo2j2q.arweave.net/QwFJCnjhODGtcU70kTQaMRHbvMgybmetQaGg4RMO0nU",
  red: "https://tczw6pw6uivwwld5pas5bfaxcjhd5ssfndhu6eoqynggvehj2aua.arweave.net/mLNvPt6iK2ssfXgl0JQXEk4-ykVoz08R0MNMapDp0Cg"
};

// Mining state types (same as in OFactTableView)
type MiningState = 'open_request' | 'mining_in_progress' | 'mining_complete';

const NFTRevenueTable: React.FC<NFTRevenueTableProps> = ({ walletAddress, onNFTSelected }) => {
  const [ofacts, setOFacts] = useState<NonFungibleToken[]>([]);
  const [extractedFacts, setExtractedFacts] = useState<{ [key: string]: AFact[] }>({});
  const [miningState, setMiningState] = useState<{ [key: string]: MiningState }>({});
  const [nftRevenues, setNftRevenues] = useState<NFTRevenue[]>([]);
  const [expandedOfacts, setExpandedOfacts] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalDailyRevenue, setTotalDailyRevenue] = useState(0);

  // Helper function to generate random but realistic revenue for an NFT
  const generateRevenueForNFT = (nftId: string, type: 'OFACT' | 'AFACT', childCount: number = 0) => {
    // Create a deterministic but seemingly random base value from the NFT ID
    const hashCode = nftId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    // Use the hash to generate a base value
    const baseFactor = Math.abs(hashCode % 1000) / 200 + 0.5;
    
    // OFACTs earn more than AFACTs
    const typeMultiplier = type === 'OFACT' ? 5 : 1;
    
    // OFACTs with more children earn more
    const childMultiplier = type === 'OFACT' ? 1 + (childCount * 0.5) : 1;
    
    // Calculate daily revenue
    const dailyValue = typeMultiplier * baseFactor * childMultiplier;
    
    return {
      daily: dailyValue,
      weekly: dailyValue * 7,
      monthly: dailyValue * 30,
      allTime: dailyValue * 30 * (Math.abs(hashCode % 12) + 1) // Variable "age" in months
    };
  };

  // Function to expand all OFACTs
  const expandAllOfacts = () => {
    const allExpanded: { [key: string]: boolean } = {};
    
    // Get all OFACT IDs
    const ofactIds = nftRevenues
      .filter(nft => nft.type === 'OFACT')
      .map(ofact => ofact.id);
    
    // Set all to expanded
    ofactIds.forEach(id => {
      allExpanded[id] = true;
    });
    
    setExpandedOfacts(allExpanded);
  };
  
  // Function to collapse all OFACTs
  const collapseAllOfacts = () => {
    setExpandedOfacts({});
  };

  // Fetch real OFACTs and AFACTs
  const fetchNFTs = async () => {
    if (!walletAddress) {
      setError('No wallet address provided');
      setLoading(false);
      return;
    }
  
    setLoading(true);
    setError(null);
    
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

      // Filter for OFACTs
      const ofactNFTs = result.result.items.filter((nft: NonFungibleToken) => {
        const symbol = nft.content?.metadata?.symbol || '';
        return symbol === 'OFACT';
      });

      // Filter for AFACTs to find parent relationships
      const afactNFTs = result.result.items.filter((nft: NonFungibleToken) => {
        const symbol = nft.content?.metadata?.symbol || '';
        return symbol === 'AFACT';
      });

      // Map to keep track of which OFACTs have child AFACTs
      const ofactsWithChildren = new Set<string>();
      
      // Create a temporary map to store AFACT data by parent ID
      const afactsByParent: { [parentId: string]: AFact[] } = {};
      
      // Process all AFACTs to find their parent OFACTs
      afactNFTs.forEach((afact: NonFungibleToken) => {
        try {
          // Look for parent reference in metadata
          const parentId = afact.content?.metadata?.properties?.parentOfactId ||
                           afact.content?.metadata?.attributes?.find(attr => 
                             attr.trait_type === 'Parent' || 
                             attr.trait_type === 'ParentOfactId' || 
                             attr.trait_type === 'ParentId'
                           )?.value;
          
          if (parentId) {
            // Mark this OFACT as having children
            ofactsWithChildren.add(parentId);
            
            // Store AFACT data for its parent
            if (!afactsByParent[parentId]) {
              afactsByParent[parentId] = [];
            }
            
            // Convert NFT to AFact type
            const afactData: AFact = {
              mintId: afact.id,
              fact: afact.content?.metadata?.description || 'No fact content',
              sourceUrl: afact.content?.metadata?.external_url || '',
              extractedDate: afact.tokenInfo?.mintTimestamp || new Date().toISOString()
            };
            
            afactsByParent[parentId].push(afactData);
          }
        } catch (err) {
          console.error('Error processing AFACT:', afact.id, err);
        }
      });

      setOFacts(ofactNFTs);
      setExtractedFacts(afactsByParent);
      
      // Process OFACTs to set mining states
      const newMiningStates: { [key: string]: MiningState } = {};
      
      ofactNFTs.forEach((nft: NonFungibleToken) => {
        const nftId = nft.id;
        
        // If we found AFACTs that reference this as a parent, mark it as completed
        if (ofactsWithChildren.has(nftId)) {
          newMiningStates[nftId] = 'mining_complete';
        } else {
          newMiningStates[nftId] = 'open_request';
        }
      });
      
      setMiningState(newMiningStates);
      
      // Now, let's prepare the revenue data for both OFACTs and AFACTs
      const revenueData: NFTRevenue[] = [];
      let totalDailyValue = 0;
      
      // Add only completed OFACTs with revenue data
      ofactNFTs.forEach(ofact => {
        const ofactId = ofact.id;
        
        if (newMiningStates[ofactId] === 'mining_complete') {
          const childFacts = afactsByParent[ofactId] || [];
          const revenueValues = generateRevenueForNFT(ofactId, 'OFACT', childFacts.length);
          
          revenueData.push({
            id: ofactId,
            name: ofact.content?.metadata?.name || `OFACT ${ofactId.slice(0, 6)}`,
            type: 'OFACT',
            imageUrl: COLOR_TO_IMAGE_MAP.orange,
            description: ofact.content?.metadata?.description || '',
            sourceUrl: ofact.content?.metadata?.external_url || ofact.content?.metadata?.description || '',
            daily: revenueValues.daily,
            weekly: revenueValues.weekly,
            monthly: revenueValues.monthly,
            allTime: revenueValues.allTime,
            lastUpdated: new Date().toLocaleString()
          });
          
          totalDailyValue += revenueValues.daily;
          
          // Add AFACTs as child items
          childFacts.forEach(afact => {
            const revenueValues = generateRevenueForNFT(afact.mintId, 'AFACT');
            
            revenueData.push({
              id: afact.mintId,
              name: `AFACT ${afact.mintId.slice(0, 6)}`,
              type: 'AFACT',
              imageUrl: COLOR_TO_IMAGE_MAP.yellow,
              description: afact.fact,
              sourceUrl: afact.sourceUrl,
              daily: revenueValues.daily,
              weekly: revenueValues.weekly,
              monthly: revenueValues.monthly,
              allTime: revenueValues.allTime,
              lastUpdated: new Date().toLocaleString(),
              parentId: ofactId  // Link to parent OFACT
            });
            
            totalDailyValue += revenueValues.daily;
          });
        }
      });
      
      setNftRevenues(revenueData);
      setTotalDailyRevenue(totalDailyValue);
      setError(null);
      
      // By default, all OFACTs are closed
      setExpandedOfacts({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch NFTs');
      // If there's an error, generate some sample data to show UI functionality
      generateSampleData();
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fallback to generate sample data if API fails
  const generateSampleData = () => {
    // Sample parent OFACT
    const parentId1 = 'sample-ofact-1';
    const parentId2 = 'sample-ofact-2';
    
    const sampleRevenues: NFTRevenue[] = [
      {
        id: parentId1,
        name: 'OFACT Sample #1234',
        type: 'OFACT',
        imageUrl: COLOR_TO_IMAGE_MAP.orange,
        sourceUrl: 'https://example.com/article1',
        daily: 5.75,
        weekly: 40.25,
        monthly: 172.50,
        allTime: 310.25,
        lastUpdated: new Date().toLocaleString()
      },
      {
        id: 'sample-afact-1',
        name: 'AFACT Sample #9012',
        type: 'AFACT',
        imageUrl: COLOR_TO_IMAGE_MAP.yellow,
        description: 'A fact extracted from an article about technology',
        daily: 1.25,
        weekly: 8.75,
        monthly: 37.50,
        allTime: 67.50,
        lastUpdated: new Date().toLocaleString(),
        parentId: parentId1  // Child of first OFACT
      },
      {
        id: 'sample-afact-2',
        name: 'AFACT Sample #3456',
        type: 'AFACT',
        imageUrl: COLOR_TO_IMAGE_MAP.yellow,
        description: 'Another fact from the same article about innovation',
        daily: 1.50,
        weekly: 10.50,
        monthly: 45.00,
        allTime: 81.00,
        lastUpdated: new Date().toLocaleString(),
        parentId: parentId1  // Child of first OFACT
      },
      {
        id: parentId2,
        name: 'OFACT Sample #5678',
        type: 'OFACT',
        imageUrl: COLOR_TO_IMAGE_MAP.orange,
        sourceUrl: 'https://example.com/article2',
        daily: 7.20,
        weekly: 50.40,
        monthly: 216.00,
        allTime: 388.80,
        lastUpdated: new Date().toLocaleString()
      },
      {
        id: 'sample-afact-3',
        name: 'AFACT Sample #7890',
        type: 'AFACT',
        imageUrl: COLOR_TO_IMAGE_MAP.yellow,
        description: 'A fact about climate science from article 2',
        daily: 1.80,
        weekly: 12.60,
        monthly: 54.00,
        allTime: 97.20,
        lastUpdated: new Date().toLocaleString(),
        parentId: parentId2  // Child of second OFACT
      }
    ];
    
    setNftRevenues(sampleRevenues);
    
    // All OFACTs are closed by default
    setExpandedOfacts({});
    
    const totalDaily = sampleRevenues.reduce((sum, nft) => sum + nft.daily, 0);
    setTotalDailyRevenue(totalDaily);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    await fetchNFTs();
  };

  useEffect(() => {
    fetchNFTs();
  }, [walletAddress]);

  const toggleOfact = (ofactId: string) => {
    setExpandedOfacts(prev => ({
      ...prev,
      [ofactId]: !prev[ofactId]
    }));
  };

  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Extract source URL - simplify it for display
  const formatUrl = (url: string = '') => {
    try {
      if (!url) return '';
      if (url.startsWith('http')) {
        const urlObj = new URL(url);
        return urlObj.hostname + urlObj.pathname.substring(0, 15) + (urlObj.pathname.length > 15 ? '...' : '');
      }
      return url.length > 25 ? url.substring(0, 25) + '...' : url;
    } catch {
      return url.length > 25 ? url.substring(0, 25) + '...' : url;
    }
  };

  if (loading) {
    return (
      <div className="w-full p-8 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && nftRevenues.length === 0) {
    return (
      <div className="w-full p-4 text-center text-red-400 bg-red-900/20 rounded-lg">
        {error}
      </div>
    );
  }

  if (nftRevenues.length === 0) {
    return <div className="w-full p-4 text-center text-gray-400">No earning NFTs found. Mine some facts to generate revenue.</div>;
  }

  // Filter down to just the root OFACTs
  const rootOFacts = nftRevenues.filter(nft => nft.type === 'OFACT');

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">NFT Revenue</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAllOfacts}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-800/70 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-gray-700/70"
          >
            <ChevronDown className="h-3.5 w-3.5" />
            Expand All
          </button>
          <button
            onClick={collapseAllOfacts}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-800/70 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-gray-700/70"
          >
            <ChevronUp className="h-3.5 w-3.5" />
            Collapse All
          </button>
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
      </div>

      <div className="p-4 rounded-lg bg-gray-800/30 ring-1 ring-white/10">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Total Daily Revenue</span>
          <span className="text-2xl font-bold">{formatCurrency(totalDailyRevenue)}</span>
        </div>
      </div>
      
      <div className="w-full overflow-x-auto rounded-lg bg-gray-800/10 ring-1 ring-white/10">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="w-8 p-3"></th>
              <th className="p-3 text-left">NFT</th>
              <th className="p-3 text-left">Source/Content</th>
              <th className="p-3 text-right">Daily</th>
              <th className="p-3 text-right">Weekly</th>
              <th className="p-3 text-right">Monthly</th>
            </tr>
          </thead>
          <tbody>
            {rootOFacts.length > 0 ? (
              rootOFacts.map(ofact => (
                <React.Fragment key={ofact.id}>
                  {/* OFACT Row */}
                  <tr 
                    className="border-b border-white/10 bg-blue-900/30 cursor-pointer hover:bg-blue-900/40"
                    onClick={() => toggleOfact(ofact.id)}
                  >
                    <td className="w-8 p-3 text-center">
                      {expandedOfacts[ofact.id] ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center">
                        <div className="w-6 h-6 mr-2">
                          <img 
                            src={ofact.imageUrl}
                            alt={ofact.name}
                            className="w-full h-full"
                          />
                        </div>
                        <span>{ofact.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm">
                      {ofact.sourceUrl && (
                        <div className="flex items-center gap-1">
                          <ExternalLink className="h-3 w-3 text-gray-400" />
                          <div className="text-xs text-gray-300 truncate max-w-[150px]">
                            {formatUrl(ofact.sourceUrl)}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono text-green-400">
                      {formatCurrency(ofact.daily)}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {formatCurrency(ofact.weekly)}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {formatCurrency(ofact.monthly)}
                    </td>
                  </tr>

                  {/* Child AFACT Rows (displayed when parent is expanded) */}
                  {expandedOfacts[ofact.id] && 
                    nftRevenues
                      .filter(nft => nft.type === 'AFACT' && nft.parentId === ofact.id)
                      .map(afact => (
                        <tr 
                          key={afact.id}
                          onClick={() => onNFTSelected(afact.id, afact)}
                          className="border-b border-white/10 bg-yellow-900/10 hover:bg-yellow-900/20 cursor-pointer"
                        >
                          <td className="w-8 p-3"></td>
                          <td className="p-3 pl-8">
                            <div className="flex items-center">
                              <div className="w-5 h-5 mr-2">
                                <img 
                                  src={afact.imageUrl}
                                  alt={afact.name}
                                  className="w-full h-full"
                                />
                              </div>
                              <span>{afact.name}</span>
                            </div>
                          </td>
                          <td className="p-3 text-xs text-gray-300 line-clamp-1 max-w-[150px]">
                            {afact.description && afact.description.substring(0, 40) + (afact.description.length > 40 ? '...' : '')}
                          </td>
                          <td className="p-3 text-right font-mono text-green-400">
                            {formatCurrency(afact.daily)}
                          </td>
                          <td className="p-3 text-right font-mono">
                            {formatCurrency(afact.weekly)}
                          </td>
                          <td className="p-3 text-right font-mono">
                            {formatCurrency(afact.monthly)}
                          </td>
                        </tr>
                      ))
                  }
                </React.Fragment>
              ))
            ) : (
              <tr className="border-b border-white/10">
                <td colSpan={6} className="p-6 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <FileText className="h-10 w-10 mb-2 opacity-50" />
                    <p className="text-sm">No completed OFACTs found.</p>
                    <p className="text-xs mt-1">Mine some facts to see revenue.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NFTRevenueTable;