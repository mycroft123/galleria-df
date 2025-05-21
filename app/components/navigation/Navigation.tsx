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
    
    // Get all wallet state
    const { isConnected, publicKey } = useWallet();
    
    // Debug component state
    const [debugInfo, setDebugInfo] = useState({
      showFullNav: false,
      hasWalletBalance: false,
      navigationItems: [] as string[]
    });
    
    // Track if we have a confirmed DeFacts balance
    const [hasDeFacts, setHasDeFacts] = useState(false);
    
    // Check for DeFacts balance on component mount and when wallet state changes
    useEffect(() => {
      // This should check for the "-- DeFacts" presence in the UI
      // We'll use a timeout to allow the UI to render
      const checkTimer = setTimeout(() => {
        try {
          // Try to find elements that contain "-- DeFacts"
          const elements = document.getElementsByClassName('rounded-full');
          let foundEmptyDeFacts = false;
          
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            if (el.textContent && el.textContent.includes('-- DeFacts')) {
              foundEmptyDeFacts = true;
              break;
            }
          }
          
          // If we didn't find "-- DeFacts", then assume we have a balance
          const hasBalance = !foundEmptyDeFacts && isConnected && publicKey;
          setHasDeFacts(hasBalance);
          
          console.log("DeFacts balance check:", { 
            foundEmptyDeFacts,
            hasBalance,
            isConnected,
            hasPublicKey: !!publicKey
          });
        } catch (e) {
          console.error("Error checking DeFacts balance:", e);
        }
      }, 1000);
      
      return () => clearTimeout(checkTimer);
    }, [isConnected, publicKey]);
    
    // Update navigation items based on DeFacts balance
    useEffect(() => {
      console.log(`
      --------------------------
      WALLET STATE:
      --------------------------
      isConnected: ${isConnected}
      publicKey: ${publicKey ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}` : 'None'}
      hasDeFacts: ${hasDeFacts}
      --------------------------
      `);
      
      if (hasDeFacts) {
        console.log("✅ SHOWING FULL NAVIGATION - Has DeFacts balance");
        setDebugInfo({
          showFullNav: true,
          hasWalletBalance: hasDeFacts,
          navigationItems: FULL_NAV.map(item => item.name)
        });
      } else {
        console.log("❌ SHOWING LIMITED NAVIGATION - No DeFacts balance");
        setDebugInfo({
          showFullNav: false,
          hasWalletBalance: hasDeFacts,
          navigationItems: CHAT_ONLY_NAV.map(item => item.name)
        });
        
        // If current view is not chat, redirect to chat
        if (currentView !== 'chat') {
          console.log("Redirecting to chat view - no DeFacts balance");
          router.push('/portfolio/ExK2ZcWx6tpVe5xfqkHZ62bMQNpStLj98z2WDUWKUKGp?view=chat');
        }
      }
    }, [hasDeFacts, isConnected, publicKey, currentView, router]);
    
    // Choose navigation based on DeFacts balance
    const navItems = hasDeFacts ? FULL_NAV : CHAT_ONLY_NAV;
    
    // Add onClick handlers to navigation items
    const navigationWithHandlers = navItems.map(item => ({
      ...item,
      onClick: () => {
        // If trying to navigate away from chat without DeFacts balance
        if (item.href !== 'chat' && !hasDeFacts) {
          console.log("Attempt to navigate to restricted area, redirecting to chat");
          router.push('/portfolio/ExK2ZcWx6tpVe5xfqkHZ62bMQNpStLj98z2WDUWKUKGp?view=chat');
        } else {
          // Normal navigation
          changeView(item.href, params.walletAddress);
        }
      }
    }));
    
    return (
      <>
        {/* Debug overlay */}
        <div 
          style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '10px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
            zIndex: 9999
          }}
        >
          <div>Navigation: {debugInfo.showFullNav ? 'FULL' : 'LIMITED'}</div>
          <div>DeFacts Balance: {debugInfo.hasWalletBalance ? 'YES' : 'NO'}</div>
          <div>Items: {debugInfo.navigationItems.join(', ')}</div>
          <div>Current View: {currentView}</div>
        </div>
      
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