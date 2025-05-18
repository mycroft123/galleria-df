'use client';

import React, { useEffect, useRef, useState } from "react";
import { useStore } from "@/app/store/useStore";
import OFactTableView from "./OFactTableView";
import { NonFungibleToken } from "@/app/types";
import { Loader2 } from "lucide-react";

interface NFTTableProps {
  walletAddress: string;
}

interface NFTCounts {
  ofact: number;
  afact: number;
}

const NFTTable = ({ walletAddress }: NFTTableProps) => {
  const isInitialMount = useRef(true);
  const { currentView, setView } = useStore();
  const [nftCounts, setNftCounts] = useState<NFTCounts>({ ofact: 0, afact: 0 });
  const [loading, setLoading] = useState(true);
  const [miningCapacity, setMiningCapacity] = useState(85); // Default mining capacity (percentage)
  const [remainingCapacity, setRemainingCapacity] = useState<number>(15);
  const [loadingCapacity, setLoadingCapacity] = useState(true);
  const [recentActivityCount, setRecentActivityCount] = useState(0);
  
  // Mining capacity constants
  const MAX_MINING_CAPACITY = 100; // Maximum capacity value

  const fetchNFTCounts = async () => {
    if (!walletAddress) return;

    const rpcUrl = process.env.NEXT_PUBLIC_HELIUS_RPC_URL;
    const apiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
    
    if (!rpcUrl || !apiKey) return;

    try {
      const response = await fetch(`${rpcUrl}/?api-key=${apiKey}`, {
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

      const result = await response.json();
      
      if (result?.result?.items) {
        const allNFTs: NonFungibleToken[] = result.result.items;
        
        // Count all NFTs by type
        const counts = {
          ofact: allNFTs.filter(nft => 
            (nft.content?.metadata?.symbol || '').toLowerCase().includes('ofact')
          ).length,
          afact: allNFTs.filter(nft => 
            (nft.content?.metadata?.symbol || '').toLowerCase().includes('afact')
          ).length
        };
        setNftCounts(counts);
        
        // Count recent activity (NFTs from the last week)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const recentNFTs = allNFTs.filter(nft => {
          const attributeMintDate = nft.content?.metadata?.attributes?.find(attr => attr.trait_type === 'Mint Date')?.value;
          const attributeCreationDate = nft.content?.metadata?.attributes?.find(attr => attr.trait_type === 'Creation Date')?.value;
          const lifecycleMintDate = nft.lifecycle?.minted?.timestamp;
          const tokenMintDate = nft.tokenInfo?.mintTimestamp;
          
          const dateStr = attributeMintDate || attributeCreationDate || lifecycleMintDate || tokenMintDate;
          if (!dateStr) return false;
          
          const nftDate = new Date(dateStr);
          return !isNaN(nftDate.getTime()) && nftDate.getTime() >= oneWeekAgo.getTime();
        });
        
        setRecentActivityCount(recentNFTs.length);
      }
    } catch (error) {
      console.error('Error fetching NFT counts:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Simulate fetching mining capacity
  const fetchMiningCapacity = async () => {
    setLoadingCapacity(true);
    try {
      // This would normally be an API call to get current mining capacity
      // For demo purposes, we'll use a simulated value
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Randomize capacity between 50-95% for demonstration
      const capacity = Math.floor(Math.random() * 46) + 50;
      setMiningCapacity(capacity);
      setRemainingCapacity(MAX_MINING_CAPACITY - capacity);
    } catch (error) {
      console.error('Error fetching mining capacity:', error);
    } finally {
      setLoadingCapacity(false);
    }
  };

  // Simulate real-time capacity changes with a heartbeat effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (!loadingCapacity) {
      // Create heartbeat effect by making small variations to the capacity value
      interval = setInterval(() => {
        // Small random fluctuation (±2%)
        const fluctuation = (Math.random() * 4) - 2;
        
        // Ensure capacity stays within bounds and changes are subtle
        const baseCapacity = miningCapacity;
        const newCapacity = Math.min(MAX_MINING_CAPACITY, Math.max(0, baseCapacity + fluctuation));
        
        setMiningCapacity(newCapacity);
        setRemainingCapacity(MAX_MINING_CAPACITY - newCapacity);
      }, 2000); // Update every 2 seconds for heartbeat effect
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loadingCapacity, miningCapacity]);

  useEffect(() => {
    fetchNFTCounts();
    fetchMiningCapacity();
  }, [walletAddress]);

  // Cleanup when changing views
  useEffect(() => {
    return () => {
      if (currentView !== 'nfts') {
        setView('nfts');
      }
    };
  }, [currentView, setView]);

  return (
    <div className="flex flex-col items-center justify-center space-y-4 w-full">
      {/* Top Row: Mining Capacity and Recent Activity */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Mining Capacity Gauge */}
        <div className="bg-gray-800/50 p-4 rounded-lg ring-1 ring-white/10 md:col-span-2">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-gray-400">Mining Capacity</h3>
            {loadingCapacity ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            ) : (
              <div className="flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                <span className="text-sm font-medium text-gray-400">
                  {Math.round(remainingCapacity)} units available
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            {/* Circle gauge */}
            <div className="relative">
              <svg width="140" height="140" className="transform -rotate-90">
                {/* Background circle */}
                <circle 
                  cx="70" 
                  cy="70" 
                  r="54" 
                  stroke="rgba(255,255,255,0.1)" 
                  strokeWidth="10" 
                  fill="none" 
                />
                {/* Progress circle */}
                <circle 
                  cx="70" 
                  cy="70" 
                  r="54" 
                  stroke={miningCapacity >= 80 ? "rgb(34, 197, 94)" : 
                          miningCapacity >= 60 ? "rgb(74, 222, 128)" : 
                          miningCapacity >= 40 ? "rgb(250, 204, 21)" : 
                          miningCapacity >= 20 ? "rgb(249, 115, 22)" : 
                          "rgb(239, 68, 68)"}
                  strokeWidth="10" 
                  fill="none" 
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 54}
                  strokeDashoffset={2 * Math.PI * 54 - (miningCapacity / 100) * 2 * Math.PI * 54}
                  className="transition-all duration-700 ease-out"
                />
                
                {/* Animated point on the progress circle */}
                <circle 
                  cx={70 + 54 * Math.cos(((miningCapacity / 100) * 360 - 90) * (Math.PI / 180))}
                  cy={70 + 54 * Math.sin(((miningCapacity / 100) * 360 - 90) * (Math.PI / 180))}
                  r="3" 
                  fill="white"
                  className="animate-pulse"
                />
              </svg>
              
              {/* Digital display in center */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`text-3xl font-bold ${
                  miningCapacity >= 80 ? "text-green-500" : 
                  miningCapacity >= 60 ? "text-green-400" : 
                  miningCapacity >= 40 ? "text-yellow-400" : 
                  miningCapacity >= 20 ? "text-orange-500" : 
                  "text-red-500"
                } font-mono tracking-tight`}>
                  {miningCapacity.toFixed(1)}
                </div>
                <div className="text-xs text-gray-400">CAPACITY</div>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex flex-col justify-between py-1 ml-3 h-32">
              <div className="text-sm text-gray-300 mb-2 border-b border-gray-700 pb-2">
                Status: <span className={
                  miningCapacity >= 80 ? "text-green-500" : 
                  miningCapacity >= 60 ? "text-green-400" : 
                  miningCapacity >= 40 ? "text-yellow-400" : 
                  miningCapacity >= 20 ? "text-orange-500" : 
                  "text-red-500"
                }>{
                  miningCapacity >= 80 ? "Optimal" : 
                  miningCapacity >= 60 ? "Good" : 
                  miningCapacity >= 40 ? "Moderate" : 
                  miningCapacity >= 20 ? "Low" : 
                  "Critical"
                }</span>
              </div>
              
              {/* System Indicators with digital blinking effect */}
              <div className="space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping mr-1.5 opacity-75"></span>
                    <span className="text-gray-400">HASH</span>
                  </div>
                  <span className="text-blue-400">142 MH/s</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse mr-1.5"></span>
                    <span className="text-gray-400">NODES</span>
                  </div>
                  <span className="text-purple-400">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse"></span>
                    <span className="text-gray-400">LOAD</span>
                  </div>
                  <span className="text-amber-400">68%</span>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 pt-2 border-t border-gray-700/50">
                Last updated: <span className="text-gray-400">just now</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Activity and Fact Stats */}
        <div className="space-y-4">
          {/* Recent Activity */}
          <div className="bg-gray-800/50 p-4 rounded-lg ring-1 ring-white/10">
            <h3 className="text-sm font-medium text-gray-400">Recent Activity (7 days)</h3>
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center">
                <div className="rounded-full w-3 h-3 bg-blue-500 mr-2"></div>
                <span className="text-sm text-gray-300">Facts Created</span>
              </div>
              <p className="text-xl font-semibold text-white">
                {loading ? '...' : recentActivityCount}
              </p>
            </div>
          </div>
          
          {/* OFact Stats */}
          <div className="bg-gray-800/50 p-4 rounded-lg ring-1 ring-white/10">
            <h3 className="text-sm font-medium text-gray-400">Active OFacts</h3>
            <p className="mt-2 text-3xl font-semibold text-white">
              {loading ? '...' : nftCounts.ofact}
            </p>
          </div>
        </div>
      </div>

      {/* Fact Mining Dashboard */}
      <OFactTableView walletAddress={walletAddress} />
    </div>
  );
};

export default NFTTable;