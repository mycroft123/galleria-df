"use client";

import React, { useState } from "react";
import { MessageSquare, Bot, CircuitBoard } from "lucide-react";
import { PhotoIcon, StopCircleIcon, LinkIcon } from "@heroicons/react/24/outline";
import HeaderNavigation from "./HeaderNavigation";
import MobileNavigation from "./MobileNavigation";
import SidebarNavigation from "./SidebarNavigation";

interface NavigationProps {
  searchParams: {
    view: string;
  };
  params: {
    walletAddress: string;
  };
}

const navigation = [
  { name: "Chat", href: "chat", icon: MessageSquare },
  { name: "AI", href: "ai", icon: Bot },
  { name: "Strategy", href: "ai2", icon: CircuitBoard },
  { name: "NFTs", href: "nfts", icon: PhotoIcon },
  { name: "Tokens", href: "tokens", icon: StopCircleIcon },
  { name: "URL Input", href: "url", icon: LinkIcon },
];

const Navigation = ({
    params,
    searchParams
}: NavigationProps) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
      <>
        {/* Mobile navigation */}
        <MobileNavigation
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          navigation={navigation}
          searchParams={searchParams}
          params={params}
        />

        {/* Sidebar navigation */}
        <SidebarNavigation
          navigation={navigation}
          searchParams={searchParams}
          params={params}
        />

        {/* Navbar */}
        <HeaderNavigation setSidebarOpen={setSidebarOpen} />
      </>
    );
};

export default Navigation;