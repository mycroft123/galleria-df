"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

import { Grouping, NonFungibleToken } from "@/app/types";

interface NFTFiltersProps {
  nftDataArray: NonFungibleToken[];
}

const NFTFilters = ({ nftDataArray }: NFTFiltersProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const collectionFilter = searchParams.get("collection");
  const typeFilter = searchParams.get("type");
  const symbolFilter = searchParams.get("symbol");
  const [collections, setCollections] = useState<Grouping[]>([]);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [searchText, setSearchText] = useState(searchParams.get("search") || "");

  useEffect(() => {
    // Extract unique collection and symbol values from nftDataArray
    const collectionMap = new Map<string, Grouping>();
    const symbolSet = new Set<string>();

    nftDataArray.forEach((nft) => {
      // Handle collections
      const collection = nft.grouping.find((g) => g.group_key === "collection");
      if (collection && collection.collection_metadata) {
        collectionMap.set(collection.group_value, collection);
      }
      
      // Handle symbols
      if (nft.content.metadata?.symbol) {
        symbolSet.add(nft.content.metadata.symbol);
      }
    });

    setCollections(Array.from(collectionMap.values()));
    setSymbols(Array.from(symbolSet).sort());
  }, [nftDataArray]);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams);
      params.set(name, value);
      return params.toString();
    },
    [searchParams],
  );

  const handleCollectionFilter = (collection: string) => {
    const queryString = createQueryString("collection", collection);
    router.push(`${pathname}?${queryString}`);
  };

  const handleTypeFilter = (type: string) => {
    const queryString = createQueryString("type", type);
    router.push(`${pathname}?${queryString}`);
  };

  const handleSymbolFilter = (symbol: string) => {
    const queryString = createQueryString("symbol", symbol);
    router.push(`${pathname}?${queryString}`);
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    const params = new URLSearchParams(searchParams);
    if (text) {
      params.set("search", text);
    } else {
      params.delete("search");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleNoFilter = (type: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete(type);
    const newURL = `${pathname}?${newSearchParams.toString()}`;
    router.push(newURL);
  };

  return (
    <div className="flex w-full flex-col px-2 py-2">
      <h1 className="text-2xl font-bold">Filters</h1>

      {/* Search Box */}
      <div className="relative mt-4">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          placeholder="Search by description..."
          value={searchText}
          onChange={(e) => handleSearch(e.target.value)}
          className="block w-full rounded-lg bg-gray-500/20 pl-10 pr-3 py-2 text-white placeholder-gray-400 ring-1 ring-inset ring-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
        />
      </div>

      {/* Collection */}
      <ul className="menu mt-6 w-full rounded-md bg-gray-500/20">
        <li>
          <details>
            <summary className="text-base font-bold">Collection</summary>
            <ul className="max-h-60 overflow-y-auto">
              <li
                onClick={() => handleNoFilter("collection")}
                className={`w-full font-medium hover:bg-neutral-700 hover:bg-opacity-60 ${
                  !collectionFilter ? "text-primary" : "text-white"
                }`}
              >
                <a className="block px-4 py-2 text-sm">All Collections</a>
              </li>
              {collections.map((collection) =>
                collection.collection_metadata ? (
                  <li
                    key={collection.group_value}
                    onClick={() => handleCollectionFilter(collection.group_value)}
                    className={`w-full font-medium hover:bg-neutral-700 hover:bg-opacity-60 ${
                      collectionFilter === collection.group_value
                        ? "text-primary"
                        : "text-white"
                    }`}
                  >
                    <a className="block px-4 py-2 text-sm">
                      {collection.collection_metadata.name}
                    </a>
                  </li>
                ) : null,
              )}
            </ul>
          </details>
        </li>
      </ul>

      {/* Symbol */}
      <ul className="menu mt-2 w-full rounded-md bg-gray-500/20">
        <li>
          <details>
            <summary className="text-base font-bold">Symbol</summary>
            <ul className="max-h-60 overflow-y-auto">
              <li
                onClick={() => handleNoFilter("symbol")}
                className={`w-full font-medium hover:bg-neutral-700 hover:bg-opacity-60 ${
                  !symbolFilter ? "text-primary" : "text-white"
                }`}
              >
                <a className="block px-4 py-2 text-sm">All Symbols</a>
              </li>
              {symbols.map((symbol) => (
                <li
                  key={symbol}
                  onClick={() => handleSymbolFilter(symbol)}
                  className={`w-full font-medium hover:bg-neutral-700 hover:bg-opacity-60 ${
                    symbolFilter === symbol ? "text-primary" : "text-white"
                  }`}
                >
                  <a className="block px-4 py-2 text-sm">{symbol}</a>
                </li>
              ))}
            </ul>
          </details>
        </li>
      </ul>

      {/* NFT Type */}
      <ul className="menu mt-2 w-full rounded-md bg-gray-500/20">
        <li>
          <details>
            <summary className="text-base font-bold">NFT Type</summary>
            <ul className="max-h-60 overflow-y-auto">
              <li
                onClick={() => handleNoFilter("type")}
                className={`w-full font-medium hover:bg-neutral-700 hover:bg-opacity-60 ${
                  !typeFilter ? "text-primary" : "text-white"
                }`}
              >
                <a className="block px-4 py-2 text-sm">All Types</a>
              </li>
              {[
                "StandardNFT",
                "CompressedNFT",
                "ProgrammableNFT",
                "Inscriptions",
                "SPL20",
              ].map((type) => (
                <li
                  key={type}
                  onClick={() => handleTypeFilter(type)}
                  className={`w-full font-medium hover:bg-neutral-700 hover:bg-opacity-60 ${
                    typeFilter === type ? "text-primary" : "text-white"
                  }`}
                >
                  <a className="block px-4 py-2 text-sm">
                    {type.replace(/([A-Z])/g, " $1").trim()}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        </li>
      </ul>
    </div>
  );
};

export default NFTFilters;