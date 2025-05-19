"use client";

import React from "react";
import { Bars3Icon } from "@heroicons/react/24/outline";
import dynamic from 'next/dynamic';
import { Logo } from "@/app/components";

// Import WalletBalance component with dynamic import to prevent SSR issues
const WalletBalance = dynamic(() => import('@/app/components/WalletBalance'), { 
  ssr: false 
});

interface HeaderNavigationProps {
  setSidebarOpen: (open: boolean) => void;
}

const HeaderNavigation = ({ setSidebarOpen }: HeaderNavigationProps) => {
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

          {/* Center - Logo and DeFacts text (visible only on mobile) */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center lg:hidden">
            <Logo />
            <span className="ml-2 text-white font-semibold text-lg">DeFacts</span>
          </div>

          {/* Right side - Wallet balance */}
          <div className="hidden items-center gap-x-2 sm:flex lg:gap-x-4">
            <WalletBalance />
          </div>
        </div>
      </div>
    </>
  );
};

export default HeaderNavigation;