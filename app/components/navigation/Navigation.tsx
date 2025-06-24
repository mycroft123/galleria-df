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
    
    // Track if we have a confirmed DeFacts balance and the detected value
    const [hasDeFacts, setHasDeFacts] = useState(false);
    const [detectedBalance, setDetectedBalance] = useState("");
    
    // Use refs to prevent unnecessary re-renders
    const lastReceivedBalance = useRef<number | null>(null);
    const checkCountRef = useRef(0);
    const requestsSentRef = useRef(0);
    const requestIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const hasAuthErrorRef = useRef(false);
    const lastRequestTimeRef = useRef(0);
    
    // Debug state - separate from main state to prevent re-renders
    const [debugInfo, setDebugInfo] = useState({
      showFullNav: false,
      hasWalletBalance: false,
      foundBalance: "",
      navigationItems: CHAT_ONLY_NAV.map(item => item.name),
      checkCount: 0,
      currentView: initialView,
      lastMessageReceived: null as any,
      lastOrigin: "",
      messageHistory: [] as string[],
      iframeFound: false,
      requestsSent: 0,
      allMessagesCount: 0,
      errorCount: 0,
      loadingCount: 0,
      authError: false,
      lastErrorTime: null as string | null
    });
    
    // PostMessage implementation for cross-domain communication
    useEffect(() => {
      if (typeof window === 'undefined') return;
      
      console.log('🚀 Navigation PostMessage Setup Starting...');
      
      // Handle incoming balance messages
      const handleMessage = (event: MessageEvent) => {
        // Only accept messages from LibreChat
        const LIBRECHAT_ORIGIN = 'https://defacts-production-e393.up.railway.app';
        
        if (event.origin !== LIBRECHAT_ORIGIN) {
          console.log('🚫 Ignoring message from unknown origin:', event.origin);
          return;
        }
        
        console.log('✅ Message from LibreChat:', event.data);
        
        // Handle different message types
        if (event.data?.type === 'defacts-token-balance') {
          const balance = event.data.balance;
          const numericBalance = Number(balance);
          
          // IMPORTANT: Only update if balance actually changed
          if (lastReceivedBalance.current !== numericBalance) {
            console.log('💰 Balance changed from', lastReceivedBalance.current, 'to', numericBalance);
            
            lastReceivedBalance.current = numericBalance;
            checkCountRef.current += 1;
            
            const hasBalance = numericBalance > 0;
            
            // Update state only if values actually changed
            setHasDeFacts(prev => {
              if (prev !== hasBalance) {
                console.log('🔄 Updating hasDeFacts:', hasBalance);
                return hasBalance;
              }
              return prev;
            });
            
            setDetectedBalance(prev => {
              const newValue = numericBalance.toString();
              if (prev !== newValue) {
                console.log('🔄 Updating detectedBalance:', newValue);
                return newValue;
              }
              return prev;
            });
            
            setShowFullNavigation(prev => {
              if (prev !== hasBalance) {
                console.log('🔄 Updating showFullNavigation:', hasBalance);
                return hasBalance;
              }
              return prev;
            });
            
            // Clear auth error state
            hasAuthErrorRef.current = false;
            
            // Update debug info separately to avoid main component re-renders
            setDebugInfo(prev => ({
              ...prev,
              showFullNav: hasBalance,
              hasWalletBalance: hasBalance,
              foundBalance: numericBalance.toString(),
              navigationItems: hasBalance ? FULL_NAV.map(item => item.name) : CHAT_ONLY_NAV.map(item => item.name),
              checkCount: checkCountRef.current,
              authError: false
            }));
          } else {
            console.log('💤 Balance unchanged, skipping update');
          }
          
        } else if (event.data?.type === 'defacts-auth-status') {
          console.log('🔐 Auth status received:', event.data);
          
          if (!event.data.authenticated && event.data.onLoginPage) {
            console.log('👤 User needs to log in to LibreChat');
            // Stop requesting balance while user is logging in
            if (requestIntervalRef.current) {
              clearInterval(requestIntervalRef.current);
              requestIntervalRef.current = null;
            }
          }
          
        } else if (event.data?.type === 'defacts-token-balance-error') {
          console.log('❌ Balance Error Received:', event.data.error);
          
          hasAuthErrorRef.current = true;
          
          // Update debug info only
          setDebugInfo(prev => ({
            ...prev,
            errorCount: prev.errorCount + 1,
            authError: event.data.status === 401,
            lastErrorTime: new Date().toLocaleTimeString()
          }));
          
          // Stop requesting if auth error
          if (event.data.status === 401 && requestIntervalRef.current) {
            console.log('🛑 Stopping balance requests due to auth error');
            clearInterval(requestIntervalRef.current);
            requestIntervalRef.current = null;
          }
          
        } else if (event.data?.type === 'defacts-token-balance-loading') {
          // Update debug info only
          setDebugInfo(prev => ({
            ...prev,
            loadingCount: prev.loadingCount + 1
          }));
        }
      };
      
      // Add message listener
      window.addEventListener('message', handleMessage);
      
      // Function to request balance from iframe
      const requestBalance = () => {
        // Skip if we have an auth error or if we requested recently
        if (hasAuthErrorRef.current) {
          return;
        }
        
        const now = Date.now();
        if (now - lastRequestTimeRef.current < 10000) { // 10 second minimum between requests
          return;
        }
        lastRequestTimeRef.current = now;
        
        const iframe = document.querySelector('iframe') as HTMLIFrameElement;
        
        if (iframe?.contentWindow) {
          try {
            requestsSentRef.current += 1;
            console.log(`📤 Sending balance request #${requestsSentRef.current}`);
            
            // Use specific LibreChat origin
            const LIBRECHAT_ORIGIN = 'https://defacts-production-e393.up.railway.app';
            iframe.contentWindow.postMessage(
              { type: 'request-token-balance' },
              LIBRECHAT_ORIGIN
            );
            
            setDebugInfo(prev => ({
              ...prev,
              iframeFound: true,
              requestsSent: requestsSentRef.current
            }));
          } catch (e) {
            console.error('❌ Error requesting balance:', e);
          }
        }
      };
      
      // Request balance less frequently
      requestIntervalRef.current = setInterval(requestBalance, 15000); // Increased to 15 seconds
      
      // Initial request after iframe likely loaded
      setTimeout(requestBalance, 3000);
      
      // Cleanup
      return () => {
        window.removeEventListener('message', handleMessage);
        if (requestIntervalRef.current) {
          clearInterval(requestIntervalRef.current);
        }
      };
    }, []); // Empty deps array - setup only once
    
    // Handle redirection if navigation is restricted
    useEffect(() => {
      if (!showFullNavigation && currentView !== 'chat') {
        console.log("🚫 Redirecting to chat view - navigation restricted");
        router.push(`/portfolio/${params.walletAddress}?view=chat`);
      }
    }, [showFullNavigation, currentView, router, params.walletAddress]);
    
    // Update debug info when currentView changes
    useEffect(() => {
      setDebugInfo(prev => ({ ...prev, currentView }));
    }, [currentView]);
    
    // Choose navigation based on our state
    const navItems = showFullNavigation ? FULL_NAV : CHAT_ONLY_NAV;
    
    // Navigation click handler
    const handleNavigationClick = (href: string) => {
      if (href !== 'chat' && !showFullNavigation) {
        router.push(`/portfolio/${params.walletAddress}?view=chat`);
      } else {
        changeView(href, params.walletAddress);
      }
    };
    
    return (
      <>
        {/* Debug overlay - Consider making this conditional for production
        <div 
          style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            backgroundColor: 'rgba(0,0,0,0.9)',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            fontSize: '11px',
            fontFamily: 'monospace',
            zIndex: 9999,
            maxWidth: '350px',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
          }}
        >
          <div style={{ marginBottom: '5px', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '5px' }}>
            🐛 DeFacts Navigation Debug
          </div>
          <div style={{ display: 'grid', gap: '3px' }}>
            <div>📍 Navigation: <span style={{ color: debugInfo.showFullNav ? '#4ade80' : '#f87171' }}>
              {debugInfo.showFullNav ? 'FULL' : 'LIMITED'}
            </span></div>
            <div>💰 DeFacts Balance: <span style={{ color: debugInfo.hasWalletBalance ? '#4ade80' : '#f87171' }}>
              {debugInfo.hasWalletBalance ? 'YES' : 'NO'}
            </span></div>
            <div>🔢 Balance Value: <span style={{ color: '#60a5fa' }}>{debugInfo.foundBalance || 'none'}</span></div>
            <div>📨 Balance Updates: <span style={{ color: '#a78bfa' }}>{debugInfo.checkCount}</span></div>
            <div>❌ Errors: <span style={{ color: debugInfo.errorCount > 0 ? '#f87171' : '#4ade80' }}>{debugInfo.errorCount}</span></div>
            <div>🔐 Auth Error: <span style={{ color: debugInfo.authError ? '#f87171' : '#4ade80' }}>
              {debugInfo.authError ? 'YES' : 'NO'}
            </span></div>
            <div>📤 Requests Sent: <span style={{ color: '#facc15' }}>{debugInfo.requestsSent}</span></div>
            <div>📱 Current View: <span style={{ color: '#60a5fa' }}>{currentView}</span></div>
          </div>
        </div> */}
      
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
        <HeaderNavigation 
          setSidebarOpen={setSidebarOpen} 
          balance={detectedBalance}
          hasBalance={hasDeFacts}
        />
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