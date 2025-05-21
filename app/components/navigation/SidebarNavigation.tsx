"use client";

import { Logo } from "@/app/components";
import { classNames } from "@/app/utils";

interface SidebarNavigationProps {
    navigation: {
        name: string;
        href: string;
        icon: any;
    }[];
    currentView: string; // Add explicit currentView prop
    onNavigate: (href: string) => void; // Add callback for navigation
    searchParams: {
        view?: string;
    };
    params: {
        walletAddress: string;
    };
}

const SidebarNavigation = ({
    navigation,
    currentView,
    onNavigate,
    params,
}: SidebarNavigationProps) => {
    // Filter out "Analysis" and "Tokens", and replace "NFTs" with "Mining"
    const filteredNavigation = navigation.filter(item => item.name !== "Analysis" && item.name !== "Tokens")
        .map(item => item.name === "Nfts" ? {...item, name: "Mining"} : item);
    
    return (
        <div className="hidden bg-black bg-opacity-40 backdrop-blur-sm lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-20 lg:overflow-y-auto lg:pb-4">
            <div className="flex h-16 shrink-0 items-center justify-center">
                <Logo />
            </div>
            <nav className="mt-8">
                <ul role="list" className="flex flex-col items-center space-y-4">
                    {filteredNavigation.map((item) => (
                        <li key={item.name} className="w-full px-2">
                            <button
                                onClick={() => onNavigate(item.href)}
                                className={classNames(
                                    currentView === item.href
                                        ? "bg-indigo-100/5 text-white ring-1 ring-inset ring-white/30 transition duration-200 ease-in-out"
                                        : "bg-indigo-100/5 text-white/40 transition duration-200 ease-in-out hover:bg-indigo-100/10 hover:text-white",
                                    "group flex w-full flex-col items-center justify-center gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 h-14"
                                )}
                            >
                                <item.icon
                                    className={classNames(
                                        currentView === item.href
                                            ? "text-white" // Highlighted state
                                            : "text-white/40 group-hover:text-white",
                                        "h-5 w-5 shrink-0"
                                    )}
                                    aria-hidden="true"
                                />
                                <span className="text-xs font-base mt-1">
                                    {item.href === "url" ? "URL" : 
                                     item.name === "Mining" ? "Mining" : 
                                     item.href.charAt(0).toUpperCase() + item.href.slice(1)}
                                </span>
                                <span className="sr-only">{item.name}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
};

export default SidebarNavigation;