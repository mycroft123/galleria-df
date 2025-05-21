

"use client"; import React, { useState, useEffect, useRef } from "react"; import { useRouter } from 'next/navigation'; import { PhotoIcon, StopCircleIcon, LinkIcon, ChartBarIcon } from "@heroicons/react/24/outline"; import HeaderNavigation from "./HeaderNavigation"; import MobileNavigation fr

pasted

my icins higlight dont change when i click on menu items:

I can see the problem in your navigation code. The issue is that the navigation icons don't change their highlighted state when you click on menu items. Let me analyze the code and provide a solution.

The key issue appears to be in how the navigation items are handled. While you're tracking the current view with usePersistentView, you're not properly applying a "selected" or "active" state to the navigation items.

Let me create a fix for this issue:


Fixed Navigation Component
Code 
Now I need to check the structure of your MobileNavigation and SidebarNavigation components to see if they correctly handle the current property. Let me explain the fix:

The Issue and Solution
The main problem is that you were not passing information about which navigation item is currently selected to your navigation components. I've added a current property to each navigation item in the navigationWithHandlers array:

javascript
const navigationWithHandlers = navItems.map(item => ({
  ...item,
  current: item.href === currentView, // Add current state based on the currentView
  onClick: () => {
    // Navigation logic
  }
}));
This sets a current: true flag on the active navigation item, which should cause your MobileNavigation and SidebarNavigation components to properly highlight the active icon.

Implementation Details
I've added the current property to each navigation item, which will be true when the item's href matches the currentView from your usePersistentView hook.
Your SidebarNavigation and MobileNavigation components should now receive this current property for each item in the navigation array, allowing them to apply the appropriate styling.
Next Steps
If you're still experiencing issues after implementing this fix, you may need to check:

That your SidebarNavigation and MobileNavigation components properly use the current property to apply different styling to the selected item. They should check item.current and apply the appropriate CSS class.
You might need to update those components to apply styling based on the current property if they don't already do so.
Would you like me to provide sample code for how the SidebarNavigation or MobileNavigation components should handle the current property for proper highlighting?




chat just tays select even if i click anout link

I understand the issue now – the "Chat" menu item stays selected even when you click other navigation links. This suggests your navigation components aren't properly updating their state based on the current property we set.

Let's fix this by examining how your SidebarNavigation and MobileNavigation components handle the selected state. I'll create an improved version that ensures the icons highlight correctly when clicked:


Fixed SidebarNavigation Component
Code 

Fixed MobileNavigation Component
Code 

Navigation Component with Debugging
Code 




SidebarNavigation.tsx
76 lines

tsx


MobileNavigation.tsx
136 lines

tsx

here is my current code.  update with fixes

I can see the issue now. Your SidebarNavigation and MobileNavigation components use their own instance of usePersistentView() instead of using the current property we tried to pass in from the main Navigation component. Let me update all three components to ensure they work together correctly:


Fixed Navigation Component
Code 

Fixed SidebarNavigation Component
Code 

Fixed MobileNavigation Component
Code 
I've fixed the issue with your navigation highlighting. Here's what I changed:

The Core Problem
The main issue was that each component (Navigation, SidebarNavigation, and MobileNavigation) was using its own separate instance of usePersistentView(). This caused the components to be out of sync, which is why your highlight wasn't updating properly when clicking on menu items.

Key Changes Made
Central Source of Truth: The main Navigation component now serves as the single source of truth for the current view.
Explicit Props for Child Components: Instead of having each navigation component manage its own state, I've explicitly passed:
currentView - The active view from the main component
onNavigate - A callback function to handle navigation clicks
Icon Highlighting: I've enhanced the highlighting logic in both the sidebar and mobile navigation components to explicitly set the icon color based on the currentView




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
