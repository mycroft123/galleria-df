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
  { name: "Mining", href: "nfts", icon: PhotoIcon },
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
    
    // Get initial view from searchParams or default to 'chat'
    const initialView = searchParams.view || 'chat';
    const { currentView, changeView } = usePersistentView(initialView);
    
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
      checkCount: 0,
      currentView: initialView
    });
    
    // Track if we have a confirmed DeFacts balance and the detected value
    const [hasDeFacts, setHasDeFacts] = useState(false);
    const [detectedBalance, setDetectedBalance] = useState("");
    const checkCountRef = useRef(0);
    
    // PostMessage implementation for cross-domain communication
    useEffect(() => {
      if (typeof window === 'undefined') return;
      
      const LIBRECHAT_ORIGIN = 'https://defacts-production-e393.up.railway.app'; // ← Your LibreChat domain

      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://defacts-production-e393.up.railway.app' // ← Your LibreChat domain
      ];
        
        const isAllowedOrigin = allowedOrigins.some(origin => event.origin.startsWith(origin));
        
        if (!isAllowedOrigin) {
          console.warn('Rejected message from unauthorized origin:', event.origin);
          return;
        }
        
        // Check if it's a balance update message
        if (event.data?.type === 'defacts-token-balance') {
          const balance = event.data.balance;
          const hasBalance = typeof balance === 'number' && balance > 0;
          
          console.log('Received balance from iframe:', balance, 'hasBalance:', hasBalance);
          
          // Update check count
          checkCountRef.current += 1;
          
          // Update state
          setHasDeFacts(hasBalance);
          setDetectedBalance(balance?.toString() || '0');
          setShowFullNavigation(hasBalance);
          
          // Update debug info
          setDebugInfo(prev => ({
            ...prev,
            showFullNav: hasBalance,
            hasWalletBalance: hasBalance,
            foundBalance: balance?.toString() || '0',
            navigationItems: hasBalance ? FULL_NAV.map(item => item.name) : CHAT_ONLY_NAV.map(item => item.name),
            checkCount: checkCountRef.current,
            currentView: prev.currentView
          }));
        }
      };
      
      // Add message listener
      window.addEventListener('message', handleMessage);
      
      // Function to request balance from iframe
      const requestBalance = () => {
        const iframe = document.querySelector('iframe') as HTMLIFrameElement;
        if (iframe?.contentWindow) {
          try {
            iframe.contentWindow.postMessage(
              { type: 'request-token-balance' },
              '*' // We use * here because the iframe will verify the origin
            );
            console.log('Requested balance from iframe');
          } catch (e) {
            console.error('Error requesting balance:', e);
          }
        }
      };
      
      // Request balance periodically
      const requestInterval = setInterval(requestBalance, 3000); // Every 3 seconds
      
      // Initial requests after iframe likely loaded
      setTimeout(requestBalance, 1000);
      setTimeout(requestBalance, 2000);
      setTimeout(requestBalance, 3000);
      
      // Also request when iframe loads
      const iframe = document.querySelector('iframe') as HTMLIFrameElement;
      if (iframe) {
        iframe.addEventListener('load', () => {
          console.log('Iframe loaded, requesting balance');
          setTimeout(requestBalance, 500);
        });
      }
      
      // Cleanup
      return () => {
        window.removeEventListener('message', handleMessage);
        clearInterval(requestInterval);
      };
    }, []);
    
    // Handle redirection if navigation is restricted
    useEffect(() => {
      if (!showFullNavigation && currentView !== 'chat') {
        console.log("Redirecting to chat view - navigation restricted");
        router.push(`/portfolio/${params.walletAddress}?view=chat`);
      }
    }, [showFullNavigation, currentView, router, params.walletAddress]);
    
    // Update debug info when currentView changes
    useEffect(() => {
      console.log("Current view changed to:", currentView);
      setDebugInfo(prev => ({ ...prev, currentView }));
    }, [currentView]);
    
    // SIMPLIFIED: Choose navigation based solely on our fullNavigation state
    const navItems = showFullNavigation ? FULL_NAV : CHAT_ONLY_NAV;
    
    // We'll pass down the onClick handler separately to keep the structure clean
    const handleNavigationClick = (href: string) => {
      console.log(`Navigation clicked: ${href}`);
      
      // If trying to navigate away from chat while navigation is restricted
      if (href !== 'chat' && !showFullNavigation) {
        console.log("Attempt to navigate to restricted area, redirecting to chat");
        router.push(`/portfolio/${params.walletAddress}?view=chat`);
      } else {
        // Normal navigation
        console.log(`Changing view to: ${href}`);
        changeView(href, params.walletAddress);
      }
    };
    
    return (
      <>
        {/* Debug overlay - Uncomment to see debug info */}
        {/*<div 
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
        </div>*/}
      
        {/* Mobile navigation */}
        <MobileNavigation
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          navigation={navItems}
          currentView={currentView}
          onNavigate={handleNavigationClick}
          searchParams={{ view: currentView }}
          params={params}
        />

        {/* Sidebar navigation */}
        <SidebarNavigation
          navigation={navItems}
          currentView={currentView}
          onNavigate={handleNavigationClick}
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