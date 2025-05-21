"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { PhotoIcon, StopCircleIcon, LinkIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import HeaderNavigation from "./HeaderNavigation";
import MobileNavigation from "./MobileNavigation";
import SidebarNavigation from "./SidebarNavigation";
import { usePersistentView } from "../../hooks/usePersistentView";
import { WalletProvider, useWallet } from '@/app/providers/WalletProvider';
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

// This is the inner component that uses the wallet hook
const NavigationContent = ({
    params,
    searchParams
}: NavigationProps) => {
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { currentView, changeView } = usePersistentView('tokens');
    const { isConnected, publicKey, tokenBalance, isLoading } = useWallet();
    
    // Check authentication and redirect if needed
    useEffect(() => {
      // Skip check if wallet state is still loading
      if (isLoading) return;
      
      // If viewing something other than chat and not authenticated
      if (currentView !== 'chat' && (!isConnected || !publicKey)) {
        // Redirect to default portfolio with chat view
        router.push('/portfolio/ExK2ZcWx6tpVe5xfqkHZ62bMQNpStLj98z2WDUWKUKGp?view=chat');
      }
    }, [currentView, isConnected, publicKey, isLoading, router]);

    // Add auth check to navigation handler
    const navigationWithHandler = navigation.map(item => ({
      ...item,
      onClick: () => {
        // If trying to navigate to a view other than chat while not authenticated
        if (item.href !== 'chat' && (!isConnected || !publicKey)) {
          // Force redirect to the default portfolio chat view
          router.push('/portfolio/ExK2ZcWx6tpVe5xfqkHZ62bMQNpStLj98z2WDUWKUKGp?view=chat');
        } else {
          // Otherwise, normal navigation
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

// This is the main component that provides the wallet context
const Navigation = (props: NavigationProps) => {
  return (
    <WalletProvider>
      <NavigationContent {...props} />
    </WalletProvider>
  );
};

export default Navigation;