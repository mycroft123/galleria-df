"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { PhotoIcon, StopCircleIcon, LinkIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import HeaderNavigation from "./HeaderNavigation";
import MobileNavigation from "./MobileNavigation";
import SidebarNavigation from "./SidebarNavigation";
import { usePersistentView } from "../../hooks/usePersistentView";
import { useWallet } from '@/app/providers/WalletProvider';
import { MessageSquare, Bot, CircuitBoard, ScatterChart } from "lucide-react";

interface NavigationProps {
  searchParams: {
    view?: string;
    [key: string]: string | undefined;
  };
  params: {
    walletAddress: string;
  };
}

const navigation = [
  { name: "Chat", href: "chat", icon: MessageSquare },
  { name: "Analysis", href: "analysis", icon: ScatterChart },
  { name: "NFTs", href: "nfts", icon: PhotoIcon },
  { name: "Portfolio", href: "portfolio", icon: ChartBarIcon },
  { name: "Tokens", href: "tokens", icon: StopCircleIcon },
  { name: "URL Input", href: "url", icon: LinkIcon },
];

const Navigation = ({
    params,
    searchParams
}: NavigationProps) => {
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { currentView, changeView } = usePersistentView('tokens');
    const { isConnected, publicKey, tokenBalance } = useWallet();
    
    // Check authentication status and redirect if needed
    useEffect(() => {
      // If not viewing chat and not authenticated
      if (
        currentView !== 'chat' && 
        (!isConnected || !publicKey || tokenBalance === null || tokenBalance === 0)
      ) {
        // Redirect to the default portfolio with chat view
        router.push('/portfolio/ExK2ZcWx6tpVe5xfqkHZ62bMQNpStLj98z2WDUWKUKGp?view=chat');
      }
    }, [currentView, isConnected, publicKey, tokenBalance, router]);

    // Create navigation items with auth-aware handler
    const navigationWithHandler = navigation.map(item => ({
      ...item,
      onClick: () => {
        // If trying to navigate away from chat without being authenticated
        if (
          item.href !== 'chat' && 
          (!isConnected || !publicKey || tokenBalance === null || tokenBalance === 0)
        ) {
          // Force redirect to chat view
          router.push('/portfolio/ExK2ZcWx6tpVe5xfqkHZ62bMQNpStLj98z2WDUWKUKGp?view=chat');
        } else {
          // Otherwise proceed with normal navigation
          changeView(item.href, params.walletAddress);
        }
      }
    }));

    return (
      <>
        {/* Mobile navigation */}
        <MobileNavigation
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          navigation={navigationWithHandler}
          searchParams={{ view: currentView }}
          params={params}
        />

        {/* Sidebar navigation */}
        <SidebarNavigation
          navigation={navigationWithHandler}
          searchParams={{ view: currentView }}
          params={params}
        />

        {/* Navbar */}
        <HeaderNavigation setSidebarOpen={setSidebarOpen} />
      </>
    );
};

export default Navigation;