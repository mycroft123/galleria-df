"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

import { NonFungibleToken } from "@/app/types";
import { NFTCard } from "@/app/components";
import NFTTableView from "./NFTTableView";

interface NFTTableProps {
  walletAddress: string;
  nftDataArray: NonFungibleToken[];
}

const NFTTable = ({ walletAddress, nftDataArray }: NFTTableProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const collectionFilter = searchParams.get("collection");
  const typeFilter = searchParams.get("type");
  const symbolFilter = searchParams.get("symbol");

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredNFTs, setFilteredNFTs] = useState<NonFungibleToken[]>([]);

  const categorizeNFT = (nft: NonFungibleToken) => {
    if (nft.compression && nft.compression.compressed) return "CompressedNFT";
    if (nft.inscription) return "Inscription";
    if (nft.spl20) return "SPL20";
    if (nft.interface === "ProgrammableNFT") return "ProgrammableNFT";
    return "StandardNFT";
  };

  useEffect(() => {
    let filtered = nftDataArray.map((nft) => ({
      ...nft,
      type: categorizeNFT(nft),
    }));

    const searchFilter = searchParams.get("search");
    
    if (searchFilter) {
      filtered = filtered.filter((nft) => {
        const description = nft.content.metadata?.description?.toLowerCase() || '';
        return description.includes(searchFilter.toLowerCase());
      });
    }

    if (collectionFilter) {
      filtered = filtered.filter(
        (nft) =>
          nft.grouping.find((g) => g.group_key === "collection")
            ?.group_value === collectionFilter,
      );
    }

    if (typeFilter) {
      filtered = filtered.filter((nft) => nft.type === typeFilter);
    }

    if (symbolFilter) {
      filtered = filtered.filter(
        (nft) => nft.content.metadata?.symbol === symbolFilter
      );
    }

    setFilteredNFTs(filtered);
    setCurrentPage(1);
  }, [nftDataArray, collectionFilter, typeFilter, symbolFilter, searchParams]);

  const clearFilters = () => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete("collection");
    newSearchParams.delete("type");
    newSearchParams.delete("symbol");
    newSearchParams.delete("search");
    const newURL = `${pathname}?${newSearchParams.toString()}`;
    router.push(newURL);
  };

  const totalItems = filteredNFTs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredNFTs.slice(indexOfFirstItem, indexOfLastItem);
  const MemoizedNFTCard = React.memo(NFTCard);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="flex flex-col items-center justify-center">
      {/* View Toggle */}
      <div className="mb-4 flex w-full justify-end px-4">
        <div className="flex gap-2 rounded-lg bg-gray-800/10 p-1 ring-1 ring-white/10">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1 rounded-md px-3 py-1 ${
              viewMode === 'grid' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {/* Grid Icon */}
            <svg 
              className="h-4 w-4" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
            Grid
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1 rounded-md px-3 py-1 ${
              viewMode === 'table' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {/* Table Icon */}
            <svg 
              className="h-4 w-4" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M3 10h18M3 14h18M3 18h18M3 6h18" />
            </svg>
            Table
          </button>
        </div>
      </div>

      {currentItems.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            <div className="flex w-full flex-wrap justify-center gap-3">
              {currentItems.map((nftData) => (
                <MemoizedNFTCard
                  key={nftData.id}
                  nftData={nftData}
                  walletAddress={walletAddress}
                  searchParams={searchParams.toString()}
                />
              ))}
            </div>
          ) : (
            <NFTTableView 
              nfts={currentItems}
              walletAddress={walletAddress}
              searchParams={searchParams.toString()}
            />
          )}

          {/* Pagination */}
          <div className="mb-4 mt-14 flex justify-center">
            <div className="join flex items-center">
              <button
                onClick={() => paginate(currentPage - 1)}
                className="h-8 w-8 rounded-full bg-indigo-100/5 bg-opacity-50 text-white ring-1 ring-inset ring-white/10 disabled:cursor-not-allowed disabled:bg-neutral"
                disabled={currentPage === 1}
              >
                «
              </button>

              <span className="mx-6 flex h-8 w-20 items-center justify-center rounded-full bg-indigo-100/5 text-sm font-semibold leading-6 text-white ring-1 ring-inset ring-white/10 transition duration-200 ease-in-out">
                Page {currentPage}
              </span>

              <button
                onClick={() => paginate(currentPage + 1)}
                className="h-8 w-8 rounded-full bg-indigo-100/5 bg-opacity-50 text-white ring-1 ring-inset ring-white/10 disabled:cursor-not-allowed disabled:bg-neutral"
                disabled={currentPage === totalPages}
              >
                »
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center p-10 text-center text-lg font-semibold">
          <h1 className="text-2xl">No NFTs Found</h1>
          {(collectionFilter || typeFilter || symbolFilter) && (
            <button
              className="btn btn-neutral m-5 bg-opacity-60 text-base text-white"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default NFTTable;