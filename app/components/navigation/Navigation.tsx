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
      currentView: initialView,
      lastMessageReceived: null as any,
      lastOrigin: "",
      messageHistory: [] as string[],
      iframeFound: false,
      requestsSent: 0
    });
    
    // Track if we have a confirmed DeFacts balance and the detected value
    const [hasDeFacts, setHasDeFacts] = useState(false);
    const [detectedBalance, setDetectedBalance] = useState("");
    const checkCountRef = useRef(0);
    const requestsSentRef = useRef(0);
    
    // PostMessage implementation for cross-domain communication
    useEffect(() => {
      if (typeof window === 'undefined') return;
      
      console.log('🚀 Navigation PostMessage Setup Starting...');
      
      const LIBRECHAT_ORIGIN = 'https://defacts-production-e393.up.railway.app';
      console.log('📍 Expected LibreChat Origin:', LIBRECHAT_ORIGIN);

      // Handle incoming balance messages
      const handleMessage = (event: MessageEvent) => {
        console.log('📨 Message received from:', event.origin);
        console.log('📦 Message data:', event.data);
        
        // Update debug with last message info
        setDebugInfo(prev => ({
          ...prev,
          lastOrigin: event.origin,
          lastMessageReceived: event.data,
          messageHistory: [...prev.messageHistory.slice(-4), `${new Date().toLocaleTimeString()}: ${event.origin}`]
        }));
        
        // Security: Check allowed origins
        const allowedOrigins = [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:5173', // Vite dev server
          'https://defacts-production-e393.up.railway.app' // Your LibreChat domain
        ];
        
        console.log('🔒 Checking against allowed origins:', allowedOrigins);
        const isAllowedOrigin = allowedOrigins.some(origin => event.origin === origin);
        
        if (!isAllowedOrigin) {
          console.warn('❌ Rejected message from unauthorized origin:', event.origin);
          console.warn('   Expected one of:', allowedOrigins);
          return;
        }
        
        console.log('✅ Origin authorized');
        
        // Check if it's a balance update message
        if (event.data?.type === 'defacts-token-balance') {
          const balance = event.data.balance;
          const hasBalance = typeof balance === 'number' && balance > 0;
          
          console.log('💰 Balance Update Received!');
          console.log('   Raw balance:', balance);
          console.log('   Has balance:', hasBalance);
          console.log('   Type of balance:', typeof balance);
          
          // Update check count
          checkCountRef.current += 1;
          
          // Update state
          setHasDeFacts(hasBalance);
          setDetectedBalance(balance?.toString() || '0');
          setShowFullNavigation(hasBalance);
          
          console.log('🔄 State Updated:');
          console.log('   showFullNavigation:', hasBalance);
          console.log('   detectedBalance:', balance?.toString() || '0');
          
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
        } else {
          console.log('🤔 Message type not recognized:', event.data?.type);
        }
      };
      
      // Add message listener
      console.log('👂 Adding message event listener...');
      window.addEventListener('message', handleMessage);
      
      // Function to request balance from iframe
      const requestBalance = () => {
        const iframe = document.querySelector('iframe') as HTMLIFrameElement;
        
        if (iframe?.contentWindow) {
          try {
            requestsSentRef.current += 1;
            console.log(`📤 Sending balance request #${requestsSentRef.current} to iframe...`);
            console.log('   iframe src:', iframe.src);
            
            iframe.contentWindow.postMessage(
              { type: 'request-token-balance' },
              '*' // We use * here because the iframe will verify the origin
            );
            
            setDebugInfo(prev => ({
              ...prev,
              iframeFound: true,
              requestsSent: requestsSentRef.current
            }));
          } catch (e) {
            console.error('❌ Error requesting balance:', e);
          }
        } else {
          console.log('⚠️ iframe not found or contentWindow not available');
          setDebugInfo(prev => ({
            ...prev,
            iframeFound: false
          }));
        }
      };
      
      // Request balance periodically
      console.log('⏰ Setting up periodic balance requests (every 3 seconds)...');
      const requestInterval = setInterval(requestBalance, 3000);
      
      // Initial requests after iframe likely loaded
      console.log('🎯 Scheduling initial balance requests...');
      setTimeout(() => {
        console.log('⏱️ Initial request 1 (after 1s)');
        requestBalance();
      }, 1000);
      
      setTimeout(() => {
        console.log('⏱️ Initial request 2 (after 2s)');
        requestBalance();
      }, 2000);
      
      setTimeout(() => {
        console.log('⏱️ Initial request 3 (after 3s)');
        requestBalance();
      }, 3000);
      
      // Also request when iframe loads
      const iframe = document.querySelector('iframe') as HTMLIFrameElement;
      if (iframe) {
        console.log('🖼️ iframe found, adding load listener...');
        iframe.addEventListener('load', () => {
          console.log('✅ iframe loaded event fired!');
          setTimeout(() => {
            console.log('📤 Sending balance request after iframe load...');
            requestBalance();
          }, 500);
        });
      } else {
        console.log('⚠️ No iframe found during setup');
      }
      
      // Cleanup
      return () => {
        console.log('🧹 Cleaning up Navigation PostMessage listeners...');
        window.removeEventListener('message', handleMessage);
        clearInterval(requestInterval);
      };
    }, []);
    
    // Handle redirection if navigation is restricted
    useEffect(() => {
      if (!showFullNavigation && currentView !== 'chat') {
        console.log("🚫 Redirecting to chat view - navigation restricted");
        console.log("   showFullNavigation:", showFullNavigation);
        console.log("   currentView:", currentView);
        router.push(`/portfolio/${params.walletAddress}?view=chat`);
      }
    }, [showFullNavigation, currentView, router, params.walletAddress]);
    
    // Update debug info when currentView changes
    useEffect(() => {
      console.log("👁️ Current view changed to:", currentView);
      setDebugInfo(prev => ({ ...prev, currentView }));
    }, [currentView]);
    
    // SIMPLIFIED: Choose navigation based solely on our fullNavigation state
    const navItems = showFullNavigation ? FULL_NAV : CHAT_ONLY_NAV;
    
    // We'll pass down the onClick handler separately to keep the structure clean
    const handleNavigationClick = (href: string) => {
      console.log(`🖱️ Navigation clicked: ${href}`);
      
      // If trying to navigate away from chat while navigation is restricted
      if (href !== 'chat' && !showFullNavigation) {
        console.log("⛔ Attempt to navigate to restricted area, redirecting to chat");
        router.push(`/portfolio/${params.walletAddress}?view=chat`);
      } else {
        // Normal navigation
        console.log(`✅ Changing view to: ${href}`);
        changeView(href, params.walletAddress);
      }
    };
    
    return (
      <>
        {/* Enhanced Debug overlay - Always visible for debugging */}
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
            <div>📨 Messages Received: <span style={{ color: '#a78bfa' }}>{debugInfo.checkCount}</span></div>
            <div>📤 Requests Sent: <span style={{ color: '#facc15' }}>{debugInfo.requestsSent}</span></div>
            <div>🖼️ iframe Found: <span style={{ color: debugInfo.iframeFound ? '#4ade80' : '#f87171' }}>
              {debugInfo.iframeFound ? 'YES' : 'NO'}
            </span></div>
            <div>📱 Current View: <span style={{ color: '#60a5fa' }}>{currentView}</span></div>
            <div>🗂️ Menu Items: <span style={{ color: '#a78bfa' }}>{debugInfo.navigationItems.join(', ')}</span></div>
            
            {debugInfo.lastOrigin && (
              <div style={{ marginTop: '5px', paddingTop: '5px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                <div>🌐 Last Origin: <span style={{ color: '#facc15', fontSize: '10px' }}>{debugInfo.lastOrigin}</span></div>
                <div>📦 Last Message: <span style={{ color: '#60a5fa', fontSize: '10px' }}>
                  {JSON.stringify(debugInfo.lastMessageReceived, null, 2).substring(0, 100)}...
                </span></div>
              </div>
            )}
            
            {debugInfo.messageHistory.length > 0 && (
              <div style={{ marginTop: '5px', paddingTop: '5px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>📜 Recent Messages:</div>
                {debugInfo.messageHistory.map((msg, i) => (
                  <div key={i} style={{ fontSize: '9px', color: '#94a3b8' }}>{msg}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      
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