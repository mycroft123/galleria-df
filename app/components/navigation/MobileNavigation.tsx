"use client";

import React, { Fragment, useState, useEffect } from "react";
import { Transition, Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Logo } from "@/app/components";
import { classNames } from "@/app/utils";

interface MobileNavigationProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
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

const MobileNavigation = ({
    sidebarOpen,
    setSidebarOpen,
    navigation,
    currentView,
    onNavigate,
    params,
}: MobileNavigationProps) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Filter out "Analysis" and "Tokens", and replace "NFTs" with "Mining"
  const filteredNavigation = navigation.filter(item => item.name !== "Analysis" && item.name !== "Tokens")
      .map(item => item.name === "Nfts" ? {...item, name: "Mining"} : item);

  if (!isClient) {
    return null;
  }

  return (
    <Transition.Root show={sidebarOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50 lg:hidden"
        onClose={setSidebarOpen}
      >
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/80" />
        </Transition.Child>

        <div className="fixed inset-0 flex">
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
              <Transition.Child
                as={Fragment}
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                  <button
                    type="button"
                    className="-m-2.5 p-2.5"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon
                      className="h-6 w-6 text-white"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </Transition.Child>

              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-black bg-opacity-50 px-6 pb-2 ring-1 ring-white/10 backdrop-blur-sm">
                <div className="flex h-16 shrink-0 items-center">
                  <Logo />
                </div>
                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="-mx-2 flex-1 space-y-2">
                    {filteredNavigation.map((item) => (
                      <button
                        key={item.name}
                        onClick={() => {
                          onNavigate(item.href);
                          setSidebarOpen(false);
                        }}
                        className={classNames(
                          currentView === item.href
                            ? "bg-indigo-100/5 text-white ring-1 ring-inset ring-white/30 transition duration-200 ease-in-out"
                            : "bg-indigo-100/5 text-white/40 transition duration-200 ease-in-out hover:bg-indigo-100/10 hover:text-white",
                          "group flex w-full gap-x-3 rounded-md p-2 text-sm font-semibold leading-6"
                        )}
                      >
                        <item.icon
                          className={classNames(
                            currentView === item.href
                              ? "text-white" // Highlighted state
                              : "text-white/40 group-hover:text-white",
                            "h-6 w-6 shrink-0"
                          )}
                          aria-hidden="true"
                        />
                        {item.href === "url" ? "URL" : 
                         item.name === "Mining" ? "Mining" : 
                         item.href.charAt(0).toUpperCase() + item.href.slice(1)}
                      </button>
                    ))}
                  </ul>
                </nav>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default MobileNavigation;