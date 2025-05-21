"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { PhotoIcon, StopCircleIcon, LinkIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import HeaderNavigation from "./HeaderNavigation";
import MobileNavigation from "./MobileNavigation";
import SidebarNavigation from "./SidebarNavigation";
import { usePersistentView } from "../../hooks/usePersistentView";
import { WalletProvider, useWallet } from '@/app/providers/WalletProvider';
import { MessageSquare, ScatterChart } from "lucide-react";

interface NavigationProps {
  searchParams: {
    view?: string;
    [key: string]: string | undefined;
  };
  params: {
    walletAddress: string;
  };
}

// Chat-only navigation - this is the default
const CHAT_ONLY_NAV = [
  { 
    name: "Chat", 
    href: "chat", 
    icon: MessageSquare
  }
];

// Full navigation - only shown when we confirm there's a balance
const FULL_NAV = [
  { name: "Chat", href: "chat", icon: MessageSquare },
  { name: "Analysis", href: "analysis", icon: ScatterChart },
  { name: "NFTs", href: "nfts", icon: PhotoIcon },
  { name: "Portfolio", href: "portfolio", icon: ChartBarIcon },
  { name: "Tokens", href: "tokens", icon: StopCircleIcon },
  { name: "URL Input", href: "url", icon: LinkIcon }
];

// This is the inner component that uses the wallet hook
const NavigationContent = ({
    params,
    searchParams
}: NavigationProps) => {
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { currentView, changeView } = usePersistentView('tokens');
    const { tokenBalance } = useWallet();
    
    // IMPORTANT: Start with limited navigation by default
    const [confirmedHasTokens, setConfirmedHasTokens] = useState(false);
    
    // Check and update token balance status
    useEffect(() => {
      console.log("Token balance updated:", tokenBalance);
      
      // Only set to true if we positively confirm there are tokens
      if (tokenBalance && tokenBalance > 0) {
        console.log("✅ CONFIRMED: User has tokens, enabling full navigation");
        setConfirmedHasTokens(true);
      } else {
        console.log("❌ NO TOKENS CONFIRMED: Limited to chat only");
        setConfirmedHasTokens(false);
        
        // If not on chat view, redirect to chat
        if (currentView !== 'chat') {
          console.log("Redirecting to chat view");
          router.push('/portfolio/ExK2ZcWx6tpVe5xfqkHZ62bMQNpStLj98z2WDUWKUKGp?view=chat');
        }
      }
    }, [tokenBalance, currentView, router]);
    
    // CRITICAL: Start with chat-only navigation, then expand only when confirmed
    const navItems = confirmedHasTokens ? FULL_NAV : CHAT_ONLY_NAV;
    
    // Add onClick handlers to navigation items
    const navigationWithHandlers = navItems.map(item => ({
      ...item,
      onClick: () => {
        // If trying to navigate away from chat without confirmed tokens
        if (item.href !== 'chat' && !confirmedHasTokens) {
          console.log("Attempt to navigate to restricted area, redirecting to chat");
          router.push('/portfolio/ExK2ZcWx6tpVe5xfqkHZ62bMQNpStLj98z2WDUWKUKGp?view=chat');
        } else {
          // Normal navigation
          changeView(item.href, params.walletAddress);
        }
      }
    }));
    
    console.log("Navigation status:", {
      confirmedHasTokens,
      tokenBalance,
      navItems: navigationWithHandlers.map(item => item.name),
      currentView
    });

    return (
      <>
        {/* Mobile navigation */}
        <MobileNavigation
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          navigation={navigationWithHandlers}
          searchParams={{ view: currentView }}
          params={params}
        />

        {/* Sidebar navigation */}
        <SidebarNavigation
          navigation={navigationWithHandlers}
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