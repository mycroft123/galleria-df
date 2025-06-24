"use client";
import React, { useEffect } from "react";
import { Bars3Icon } from "@heroicons/react/24/outline";
import dynamic from 'next/dynamic';
import { Logo } from "@/app/components";

// Import DefactsBalance component with dynamic import to prevent SSR issues
const DefactsBalance = dynamic(() => import('@/app/components/tokenbalance/DefactsBalance'), {
  ssr: false
});

// Import WalletBalance component with dynamic import to prevent SSR issues
const WalletBalance = dynamic(() => import('@/app/components/WalletBalance'), {
  ssr: false
});

// Import our debug component
const WalletDebug = dynamic(() => import('./WalletDebug'), {
  ssr: false
});

interface HeaderNavigationProps {
  setSidebarOpen: (open: boolean) => void;
  balance?: string;
  hasBalance?: boolean;
}

const HeaderNavigation = ({ setSidebarOpen, balance, hasBalance }: HeaderNavigationProps) => {
  // Debug logging
  useEffect(() => {
    console.log('🎯 HeaderNavigation Debug:');
    console.log('   balance prop:', balance);
    console.log('   hasBalance prop:', hasBalance);
    console.log('   balance type:', typeof balance);
    console.log('   hasBalance type:', typeof hasBalance);
  }, [balance, hasBalance]);

  // Also log on every render
  console.log('🔄 HeaderNavigation Render:', {
    balance,
    hasBalance,
    timestamp: new Date().toLocaleTimeString()
  });

  return (
    <>
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 bg-black bg-opacity-40 px-4 shadow-sm backdrop-blur-md sm:gap-x-6 sm:px-6 lg:px-8">
        <div className="flex w-full items-center justify-between self-stretch">
          {/* Left side - Mobile menu button */}
          <div className="flex items-center">
            <button
              type="button"
              className="-m-2.5 mr-4 p-2.5 text-gray-700 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>
                     
          {/* Center - DeFacts text */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center">
            <span className="text-white font-semibold text-2xl">DeFacts.ai</span>
          </div>
                     
          {/* Right side - Debug info, DeFacts Balance, and Wallet balance */}
          <div className="flex items-center gap-x-2 sm:flex lg:gap-x-4">
            {/* Debug display in UI (temporary) 
            <div style={{
              fontSize: '10px',
              color: 'yellow',
              backgroundColor: 'rgba(0,0,0,0.5)',
              padding: '2px 6px',
              borderRadius: '4px'
            }}>
              B: {balance || 'null'} | H: {hasBalance ? 'Y' : 'N'}
            </div>*/}
            
            {/* Add wallet debug component */}
            {/*<WalletDebug />*/}
                         
            {/* Add DefactsBalance component with balance prop */}
            <DefactsBalance balance={balance} hasBalance={hasBalance} />
                         
            {/* Keep the original WalletBalance as last item */}
           {/*  <WalletBalance />*/}
          </div>
        </div>
      </div>
    </>
  );
};

export default HeaderNavigation;