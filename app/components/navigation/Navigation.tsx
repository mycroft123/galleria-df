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

// Function to check the entire DOM for any balance indicators
const checkForDefactsBalance = () => {
  try {
    // Check all div elements in the DOM
    const allElements = document.querySelectorAll('div');
    let foundEmptyDeFacts = false;
    let foundBalance = "";
    let htmlContent = "";
    
    // Regular expressions for different balance formats
    const emptyRegex = /--\s*DeFacts/i;
    const balanceRegex = /(\d[\d,.]+)\s*DeFacts/i;
    
    // Look for balance indicators in each element
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];
      if (el.textContent) {
        htmlContent = el.textContent.trim();
        
        // Check for empty balance indicator
        if (emptyRegex.test(htmlContent)) {
          foundEmptyDeFacts = true;
          console.log("Found empty DeFacts:", htmlContent);
        }
        
        // Check for numeric balance
        const match = htmlContent.match(balanceRegex);
        if (match) {
          foundBalance = match[1]; // This captures the numeric part
          console.log("Found DeFacts balance:", foundBalance);
        }
      }
    }
    
    // If we explicitly found a balance, that takes precedence
    if (foundBalance !== "") {
      return { hasBalance: true, balance: foundBalance };
    }
    
    // If we found an empty indicator and no balance, we know there's no balance
    if (foundEmptyDeFacts) {
      return { hasBalance: false, balance: "" };
    }
    
    // If we didn't find either, assume no balance (MORE RESTRICTIVE)
    return { hasBalance: false, balance: "unknown" };
  } catch (e) {
    console.error("Error checking DeFacts balance:", e);
    return { hasBalance: false, balance: "" };
  }
};

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
    
    // IMPORTANT STATE: Track if full navigation should be shown
    const [showFullNavigation, setShowFullNavigation] = useState(false);
    
    // Debug component state
    const [debugInfo, setDebugInfo] = useState({
      showFullNav: false,
      hasWalletBalance: false,
      foundBalance: "",
      navigationItems: CHAT_ONLY_NAV.map(item => item.name),
      checkCount: 0
    });
    
    // Track if we have a confirmed DeFacts balance and the detected value
    const [hasDeFacts, setHasDeFacts] = useState(false);
    const [detectedBalance, setDetectedBalance] = useState("");
    const checkCountRef = useRef(0);
    
    // Set up frequent balance checks and DOM observer
    useEffect(() => {
      if (typeof window === 'undefined') return;
      
      // Function to run the balance check
      const runBalanceCheck = () => {
        checkCountRef.current += 1;
        const { hasBalance, balance } = checkForDefactsBalance();
        
        // Only update state if there's a change to avoid re-renders
        if (hasBalance !== hasDeFacts || balance !== detectedBalance) {
          console.log("Balance check update:", { hasBalance, balance, checkCount: checkCountRef.current });
          
          // Update our state
          setHasDeFacts(hasBalance);
          setDetectedBalance(balance);
          
          // THE KEY PART: Update navigation state based on balance
          // We only need wallet connected AND balance
          const shouldShowFullNav = hasBalance;
          setShowFullNavigation(shouldShowFullNav);
          
          // CRITICAL: Update debug info consistently with our state
          setDebugInfo(prev => ({
            ...prev,
            showFullNav: shouldShowFullNav,
            hasWalletBalance: hasBalance,
            foundBalance: balance,
            navigationItems: shouldShowFullNav ? FULL_NAV.map(item => item.name) : CHAT_ONLY_NAV.map(item => item.name),
            checkCount: checkCountRef.current
          }));
        } else if (checkCountRef.current % 5 === 0) {
          // Just update the check count periodically
          setDebugInfo(prev => ({ ...prev, checkCount: checkCountRef.current }));
        }
      };
      
      // Run initial check
      runBalanceCheck();
      
      // Set up interval to check frequently
      const checkInterval = setInterval(runBalanceCheck, 500); // Check every 500ms
      
      // Set up mutation observer to detect DOM changes
      const observer = new MutationObserver(() => {
        runBalanceCheck();
      });
      
      // Start observing the entire document for changes
      observer.observe(document.body, { 
        childList: true, 
        subtree: true,
        characterData: true, 
        attributes: true 
      });
      
      // Clean up
      return () => {
        clearInterval(checkInterval);
        observer.disconnect();
      };
    }, [hasDeFacts, detectedBalance]);
    
    // Handle redirection if navigation is restricted
    useEffect(() => {
      if (!showFullNavigation && currentView !== 'chat') {
        console.log("Redirecting to chat view - navigation restricted");
        router.push('/portfolio/ExK2ZcWx6tpVe5xfqkHZ62bMQNpStLj98z2WDUWKUKGp?view=chat');
      }
    }, [showFullNavigation, currentView, router]);
    
    // SIMPLIFIED: Choose navigation based solely on our fullNavigation state
    const navItems = showFullNavigation ? FULL_NAV : CHAT_ONLY_NAV;
    
    // Add onClick handlers to navigation items
    const navigationWithHandlers = navItems.map(item => ({
      ...item,
      onClick: () => {
        // If trying to navigate away from chat while navigation is restricted
        if (item.href !== 'chat' && !showFullNavigation) {
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
          <div>Detected Balance: {debugInfo.foundBalance || 'none'}</div>
          <div>Check Count: {debugInfo.checkCount}</div>
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