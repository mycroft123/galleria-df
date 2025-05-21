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

// This is the inner component that uses the wallet hook
const NavigationContent = ({
    params,
    searchParams
}: NavigationProps) => {
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { currentView, changeView } = usePersistentView('tokens');
    const { isConnected, publicKey, tokenBalance, isLoading } = useWallet();
    
    // Debug logging
    console.log("Wallet Status:", { isConnected, publicKey, tokenBalance, isLoading });
    
    // Check if user has a valid balance (not null, undefined, or 0)
    const hasValidBalance = tokenBalance !== null && tokenBalance !== undefined && tokenBalance > 0;
    
    // Force chat view if not authenticated or no balance
    useEffect(() => {
      console.log("Effect checking view:", currentView);
      console.log("Auth status:", { isConnected, publicKey, tokenBalance, hasValidBalance, isLoading });
      
      if (!isLoading && currentView !== 'chat' && (!isConnected || !publicKey || !hasValidBalance)) {
        console.log("Redirecting to chat view due to authentication/balance check");
        router.push('/portfolio/ExK2ZcWx6tpVe5xfqkHZ62bMQNpStLj98z2WDUWKUKGp?view=chat');
      }
    }, [currentView, isConnected, publicKey, tokenBalance, hasValidBalance, isLoading, router]);
    
    // Explicitly create navigation arrays
    const chatOnlyNav = [
      { 
        name: "Chat", 
        href: "chat", 
        icon: MessageSquare,
        onClick: () => changeView("chat", params.walletAddress)
      }
    ];
    
    const fullNav = [
      { 
        name: "Chat", 
        href: "chat", 
        icon: MessageSquare,
        onClick: () => changeView("chat", params.walletAddress)
      },
      { 
        name: "Analysis", 
        href: "analysis", 
        icon: ScatterChart,
        onClick: () => changeView("analysis", params.walletAddress)
      },
      { 
        name: "NFTs", 
        href: "nfts", 
        icon: PhotoIcon,
        onClick: () => changeView("nfts", params.walletAddress)
      },
      { 
        name: "Portfolio", 
        href: "portfolio", 
        icon: ChartBarIcon,
        onClick: () => changeView("portfolio", params.walletAddress)
      },
      { 
        name: "Tokens", 
        href: "tokens", 
        icon: StopCircleIcon,
        onClick: () => changeView("tokens", params.walletAddress)
      },
      { 
        name: "URL Input", 
        href: "url", 
        icon: LinkIcon,
        onClick: () => changeView("url", params.walletAddress)
      }
    ];
    
    // Determine which navigation to use - now checks balance as well
    const navItems = (!isLoading && isConnected && publicKey && hasValidBalance) ? fullNav : chatOnlyNav;
    
    console.log("Navigation items:", 
      navItems.map(item => item.name),
      "Auth status:", { isConnected, publicKey, tokenBalance, hasValidBalance, isLoading }
    );

    return (
      <>
        {/* Mobile navigation */}
        <MobileNavigation
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          navigation={navItems}
          searchParams={{ view: currentView }}
          params={params}
        />

        {/* Sidebar navigation */}
        <SidebarNavigation
          navigation={navItems}
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