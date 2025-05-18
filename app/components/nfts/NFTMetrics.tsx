"use client";

import React, { useEffect, useState } from "react";
import { NonFungibleToken } from "@/app/types";

interface GroupedNFTs {
  name: string;
  count: number;
  nfts: NonFungibleToken[];
}

interface NFTMetricsProps {
  nonFungibleTokens: GroupedNFTs[];
}

const NFTMetrics = ({ nonFungibleTokens }: NFTMetricsProps) => {
  const [totalNFTs, setTotalNFTs] = useState(0);
  const [totalcNFTs, setTotalcNFTs] = useState(0);
  const [totalpNFTs, setTotalpNFTs] = useState(0);

  useEffect(() => {
    // Flatten the grouped NFTs to count totals
    const allNFTs = nonFungibleTokens.flatMap(group => group.nfts);
    
    const totalNFTs = allNFTs.length;
    const totalcNFTs = allNFTs.filter(
      (token) => token.compression.compressed === true,
    ).length;
    const totalpNFTs = allNFTs.filter(
      (token) => token.interface === "ProgrammableNFT",
    ).length;

    setTotalNFTs(totalNFTs);
    setTotalcNFTs(totalcNFTs);
    setTotalpNFTs(totalpNFTs);
  }, [nonFungibleTokens]);

  return (
    <>
      <div className="mb-6">
        <dl className="grid grid-cols-1 gap-5 shadow-sm sm:grid-cols-4">
          <div className="overflow-hidden rounded-lg bg-black bg-opacity-60 px-4 py-5 shadow sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-300">
              Total Collections
            </dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-white">
              {nonFungibleTokens.length}
            </dd>
          </div>

          <div className="overflow-hidden rounded-lg bg-black bg-opacity-60 px-4 py-5 shadow sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-300">
              Total NFTs
            </dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-white">
              {totalNFTs}
            </dd>
          </div>

          <div className="overflow-hidden rounded-lg bg-black bg-opacity-60 px-4 py-5 shadow sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-300">
              Total cNFTs
            </dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-white">
              {totalcNFTs}
            </dd>
          </div>

          <div className="overflow-hidden rounded-lg bg-black bg-opacity-60 px-4 py-5 shadow sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-300">
              Total pNFTs
            </dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-white">
              {totalpNFTs}
            </dd>
          </div>
        </dl>
      </div>
    </>
  );
};

export default NFTMetrics;