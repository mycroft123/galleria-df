'use client';

import React, { useState, useEffect } from 'react';
import TokenBalanceView from './TokenBalanceView';
import NFTRevenueTable from './NFTRevenueTable';
import RevenueGauge from './RevenueGauge';
import NFTEarningsSummary from './NFTEarningsSummary';

interface Token {
  symbol: string;
  name: string;
  balance: number;
  value: number;
  change24h: number;
  iconUrl?: string;
}

interface NFTRevenue {
  id: string;
  name: string;
  type: 'OFACT' | 'AFACT';
  imageUrl: string;
  daily: number;
  weekly: number;
  monthly: number;
  allTime: number;
  lastUpdated: string;
}

interface TokenDashboardProps {
  walletAddress: string;
}

const TokenDashboard: React.FC<TokenDashboardProps> = ({ walletAddress }) => {
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [selectedNFT, setSelectedNFT] = useState<NFTRevenue | null>(null);
  const [totalRevenue, setTotalRevenue] = useState({
    daily: 15.7,
    weekly: 109.9,
    monthly: 471.0,
    allTime: 847.55
  });

  // Handle token selection
  const handleTokenSelected = (token: Token) => {
    setSelectedToken(token);
    setSelectedNFT(null);
  };

  // Handle NFT selection
  const handleNFTSelected = (nftId: string, revenueData: NFTRevenue) => {
    setSelectedNFT(revenueData);
    setSelectedToken(null);
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Token & NFT Dashboard (balances are for DEMO ONLY)</h1>
        <div className="text-sm text-gray-400">
          Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
        </div>
      </div>

      {/* Top Row: Revenue Timeline and Earnings Information */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Revenue Timeline - Left 2/3 */}
        <div className="md:col-span-2">
             {/* Token Balances */}
      <TokenBalanceView 
        walletAddress={walletAddress} 
        onTokenSelected={handleTokenSelected}
      />
        </div>

        {/* Right Column - Earnings Summary */}
        <div>
          <NFTEarningsSummary 
            totalRevenue={totalRevenue}
            selectedNFT={selectedNFT}
          />
        </div>
      </div>



      {/* NFT Revenue Table */}
      <NFTRevenueTable 
        walletAddress={walletAddress}
        onNFTSelected={handleNFTSelected}
      />
    </div>
  );
};

export default TokenDashboard;