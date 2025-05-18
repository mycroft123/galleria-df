"use client";

import React, { useState } from "react";

import { PhotoIcon, StopCircleIcon, LinkIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import HeaderNavigation from "./HeaderNavigation";
import MobileNavigation from "./MobileNavigation";
import SidebarNavigation from "./SidebarNavigation";
import { usePersistentView } from "../../hooks/usePersistentView";
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

const Navigation = ({
    params,
    searchParams
}: NavigationProps) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { currentView, changeView } = usePersistentView('tokens');

    // Pass the changeView function to child components with wallet address
    const navigationWithHandler = navigation.map(item => ({
      ...item,
      onClick: () => changeView(item.href, params.walletAddress)
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

export default Navigation;