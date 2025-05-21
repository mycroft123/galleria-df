"use client";

import React, { useState, useEffect, useRef } from "react";
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

// Navigation arrays
const CHAT_ONLY_NAV = [{ name: "Chat", href: "chat", icon: MessageSquare }];
const FULL_NAV = [
  { name: "Chat", href: "chat", icon: MessageSquare },
  { name: "Analysis", href: "analysis", icon: ScatterChart },
  { name: "NFTs", href: "nfts", icon: PhotoIcon },
  { name: "Portfolio", href: "portfolio", icon: ChartBarIcon },
  { name: "Tokens", href: "tokens", icon: StopCircleIcon },
  { name: "URL Input", href: "url", icon: LinkIcon }
];

// Inner component
const NavigationContent = ({ params, searchParams }: NavigationProps) => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentView, changeView, setCurrentView } = usePersistentView('tokens');
  
  // State
  const [hasBalance, setHasBalance] = useState(false);
  const [detectedBalance, setDetectedBalance] = useState("");
  const checkCountRef = useRef(0);
  
  // Sync currentView with URL on component mount
  useEffect(() => {
    // If searchParams has a view, update currentView to match
    if (searchParams.view) {
      setCurrentView(searchParams.view);
      console.log(`Synced view from URL: ${searchParams.view}`);
    }
  }, [searchParams.view, setCurrentView]);
  
  // Check DOM for balance
  const checkBalance = () => {
    try {
      checkCountRef.current += 1;
      const elements = document.querySelectorAll('div');
      
      // Look for numbers followed by "DeFacts"
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        if (el.textContent) {
          const text = el.textContent.trim();
          const match = text.match(/(\d[\d,.]+)\s*DeFacts/i);
          
          if (match && !text.includes('-- DeFacts')) {
            if (!hasBalance) {
              console.log("Found balance:", match[1]);
            }
            setHasBalance(true);
            setDetectedBalance(match[1]);
            return;
          }
        }
      }
      
      // No balance found
      if (hasBalance) {
        console.log("Balance not found anymore");
      }
      setHasBalance(false);
    } catch (e) {
      console.error("Check error:", e);
    }
  };
  
  // Set up balance checking
  useEffect(() => {
    // Check immediately
    checkBalance();
    
    // Set up periodic checking
    const interval = setInterval(checkBalance, 1000);
    
    // Set up DOM observer
    const observer = new MutationObserver(checkBalance);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      characterData: true
    });
    
    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);
  
  // Handle redirection
  useEffect(() => {
    if (!hasBalance && currentView !== 'chat') {
      const redirectUrl = '/portfolio/ExK2ZcWx6tpVe5xfqkHZ62bMQNpStLj98z2WDUWKUKGp?view=chat';
      router.push(redirectUrl);
      
      // Also update currentView to match the redirect
      setCurrentView('chat');
      console.log("Redirecting to chat and updating current view");
    }
  }, [hasBalance, currentView, router, setCurrentView]);
  
  // Navigation items with handlers
  const navItems = hasBalance ? FULL_NAV : CHAT_ONLY_NAV;
  const navigationWithHandlers = navItems.map(item => ({
    ...item,
    onClick: () => {
      if (item.href !== 'chat' && !hasBalance) {
        const redirectUrl = '/portfolio/ExK2ZcWx6tpVe5xfqkHZ62bMQNpStLj98z2WDUWKUKGp?view=chat';
        router.push(redirectUrl);
        
        // Update currentView to chat
        setCurrentView('chat');
        console.log(`Redirecting to chat view from ${item.href}`);
      } else {
        // Important: Update currentView before navigating
        setCurrentView(item.href);
        changeView(item.href, params.walletAddress);
        console.log(`Changed view to: ${item.href}`);
      }
    },
    // Add "active" property to identify current view for highlighting
    active: currentView === item.href
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
        <div>Navigation: {hasBalance ? 'FULL' : 'LIMITED'}</div>
        <div>DeFacts Balance: {hasBalance ? 'YES' : 'NO'}</div>
        <div>Detected Balance: {detectedBalance || 'none'}</div>
        <div>Check Count: {checkCountRef.current}</div>
        <div>Items: {navItems.map(i => i.name).join(', ')}</div>
        <div>Current View: {currentView}</div>
      </div>
    
      {/* Navigation components */}
      <MobileNavigation
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        navigation={navigationWithHandlers}
        searchParams={{ view: currentView }}
        params={params}
      />
      <SidebarNavigation
        navigation={navigationWithHandlers}
        searchParams={{ view: currentView }}
        params={params}
      />
      <HeaderNavigation setSidebarOpen={setSidebarOpen} />
    </>
  );
};

// Provider wrapper
const Navigation = (props: NavigationProps) => (
  <WalletProvider>
    <NavigationContent {...props} />
  </WalletProvider>
);

export default Navigation;