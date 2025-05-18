'use client';

import React, { useState } from "react";

import { FungibleToken } from "@/app/types";
import { TokenTable } from "@/app/components";
import DEFactsView from "./DEFactsView";

interface TokensProps {
  searchParams: string;
  walletAddress: string;
  tokens: FungibleToken[];
}

const TokensList = ({ searchParams, walletAddress, tokens }: TokensProps) => {
  const [activeTab, setActiveTab] = useState<'tokens' | 'defacts'>('tokens');
  
  if (!tokens) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setActiveTab('tokens')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${
            activeTab === 'tokens'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Tokens
        </button>
        <button
          onClick={() => setActiveTab('defacts')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${
            activeTab === 'defacts'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          DEFacts
        </button>
      </div>
      
      <div className="rounded-lg bg-black bg-opacity-50 ">
        <div className="p-3 sm:p-5">
          {activeTab === 'tokens' ? (
            <TokenTable
              tokens={tokens}
              source="tokenPage"
              walletAddress={walletAddress}
              perPage={8}
            />
          ) : (
            <DEFactsView 
              walletAddress={walletAddress}
              tokens={tokens}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default TokensList;