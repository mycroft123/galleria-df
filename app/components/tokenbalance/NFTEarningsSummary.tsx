'use client';

import React from 'react';
import { DollarSign, Clock, TrendingUp, BarChart4, Award } from 'lucide-react';

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

interface NFTEarningsSummaryProps {
  totalRevenue: {
    daily: number;
    weekly: number;
    monthly: number;
    allTime: number;
  };
  selectedNFT: NFTRevenue | null;
}

const NFTEarningsSummary: React.FC<NFTEarningsSummaryProps> = ({ totalRevenue, selectedNFT }) => {
  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="space-y-4">
      {selectedNFT ? (
        // NFT Earnings Display when an NFT is selected
        <>
          <div className="bg-gray-800/50 p-4 rounded-lg ring-1 ring-white/10">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-400">
                {selectedNFT.type} Earnings
              </h3>
              <div className="text-xs text-gray-500">
                {selectedNFT.name}
              </div>
            </div>
            <div className="mt-3 flex justify-between items-center">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-yellow-500 mr-2" />
                <span className="text-sm text-gray-300">Daily Revenue</span>
              </div>
              <p className="text-xl font-semibold text-white">
                {formatCurrency(selectedNFT.daily)}
              </p>
            </div>
          </div>
          
          <div className="bg-gray-800/50 p-4 rounded-lg ring-1 ring-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Revenue Statistics</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-blue-400 mr-2" />
                  <span className="text-xs text-gray-300">Weekly</span>
                </div>
                <p className="text-sm font-medium text-white">
                  {formatCurrency(selectedNFT.weekly)}
                </p>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <BarChart4 className="h-4 w-4 text-purple-400 mr-2" />
                  <span className="text-xs text-gray-300">Monthly</span>
                </div>
                <p className="text-sm font-medium text-white">
                  {formatCurrency(selectedNFT.monthly)}
                </p>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Award className="h-4 w-4 text-amber-400 mr-2" />
                  <span className="text-xs text-gray-300">All Time</span>
                </div>
                <p className="text-sm font-medium text-white">
                  {formatCurrency(selectedNFT.allTime)}
                </p>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-700/50 text-xs text-gray-500">
              Last updated: {selectedNFT.lastUpdated}
            </div>
          </div>
        </>
      ) : (
        // Total earnings summary (default view)
        <>
          <div className="bg-gray-800/50 p-4 rounded-lg ring-1 ring-white/10">
            <h3 className="text-sm font-medium text-gray-400">Total NFT Earnings</h3>
            <div className="mt-3 flex items-center">
              <DollarSign className="h-6 w-6 text-green-500 mr-2" />
              <p className="text-2xl font-bold text-white">
                {formatCurrency(totalRevenue.daily)}
                <span className="text-xs font-normal text-gray-400 ml-1">/ day</span>
              </p>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-gray-400">Weekly</span>
              <span className="text-white">{formatCurrency(totalRevenue.weekly)}</span>
            </div>
            <div className="mt-1 flex justify-between text-sm">
              <span className="text-gray-400">Monthly</span>
              <span className="text-white">{formatCurrency(totalRevenue.monthly)}</span>
            </div>
          </div>
          
          <div className="bg-gray-800/50 p-4 rounded-lg ring-1 ring-white/10">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-400">Revenue Growth</h3>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            
            {/* Simple chart visualization */}
            <div className="h-16 w-full flex items-end justify-between mt-2">
              {Array.from({ length: 14 }).map((_, i) => {
                const height = 20 + Math.random() * 60;
                const opacity = 0.5 + (i / 28);
                return (
                  <div 
                    key={i}
                    className="w-1 rounded-t-sm bg-green-500"
                    style={{ 
                      height: `${height}%`, 
                      opacity: opacity
                    }}
                  ></div>
                );
              })}
            </div>
            
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Apr 15</span>
              <span>May 1</span>
              <span>May 15</span>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-700/50 text-xs">
              <span className="text-green-400">+12.5%</span>
              <span className="text-gray-500 ml-1">since last month</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NFTEarningsSummary;