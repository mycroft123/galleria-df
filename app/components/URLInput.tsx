"use client";

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from "lucide-react";
import { usePersistentView } from '@/app/hooks/usePersistentView';

// Updated API URL to use Railway deployment
const API_BASE_URL = "https://df-backend-13-production.up.railway.app";
const API_BATCH_NFT_URL = `${API_BASE_URL}/api/batch-create-nft`;

interface URLState {
  url: string;
  debug: string;
  isDebugOpen: boolean;
}

const URLInput = () => {
  const { saveViewState, getViewState, isInitialized } = usePersistentView();
  
  const [url, setUrl] = useState('');
  const [debug, setDebug] = useState('');
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  interface MintResult {
    tokenId: string;
    transferredTo: string;
  }
  const [mintResult, setMintResult] = useState<MintResult | null>(null);

  // Save state function
  const saveCompleteState = (updates: Partial<URLState>) => {
    if (!isInitialized) return;

    const currentState: URLState = {
      url,
      debug,
      isDebugOpen
    };

    const newState = {
      ...currentState,
      ...updates
    };

    saveViewState('url', newState);
  };

  // Restore state on mount
  useEffect(() => {
    if (!isInitialized) return;
    
    const savedState = getViewState('url') as URLState;
    
    if (savedState) {
      setUrl(savedState.url || '');
      setDebug(savedState.debug || '');
      setIsDebugOpen(!!savedState.isDebugOpen);
    }
  }, [isInitialized, getViewState]);

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    saveCompleteState({ url: newUrl });
  };

  const handleDebugChange = (newDebug: string | ((prev: string) => string)) => {
    setDebug(current => {
      const nextDebug = typeof newDebug === 'function' ? newDebug(current) : newDebug;
      saveCompleteState({ debug: nextDebug });
      return nextDebug;
    });
  };

  const handleDebugOpenChange = (isOpen: boolean) => {
    setIsDebugOpen(isOpen);
    saveCompleteState({ isDebugOpen: isOpen });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    handleDebugChange('');
    setMintResult(null);

    try {
      const facts = [{
        fact: url,
        sourceUrl: url,
        extractedDate: new Date().toISOString().split('T')[0]
      }];

      handleDebugChange(`Minting URL as NFT: ${url}`);
      
      const mintResponse = await fetch(API_BATCH_NFT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ facts }),
      });

      const mintData = await mintResponse.json();
      handleDebugChange(prev => `${prev}\nNFT Minting Response: ${JSON.stringify(mintData, null, 2)}`);

      if (mintData.success && mintData.results?.length > 0) {
        setMintResult({
          tokenId: mintData.results[0].tokenId,
          transferredTo: mintData.results[0].transferredTo
        });
      } else {
        throw new Error(mintData.error || 'Failed to mint NFT');
      }
    } catch (err) {
      console.error('NFT Minting Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Error minting NFT: ${errorMessage}`);
      handleDebugChange(prev => `${prev}\nNFT Minting Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isInitialized) {
    return <div className="w-full h-full flex items-center justify-center">
      <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-white"></div>
    </div>;
  }

  return (
    <div className="w-full max-w-5xl">
      <div className="bg-black/30 backdrop-blur-sm rounded-lg p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-6">Mint URL as NFT</h2>

        <div className="mb-4 text-sm text-gray-300">
          Service status: {loading ? 'Minting...' : error ? 'Error' : 'Ready'}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-2">
              URL to Mint
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://example.com/article"
              className="w-full px-4 py-2 bg-black/20 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !url}
            className="w-full bg-indigo-100/5 text-white px-4 py-2 rounded-md hover:bg-indigo-100/10 transition duration-200 ring-1 ring-inset ring-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Minting...' : 'Mint NFT'}
          </button>
        </form>

        {error && (
          <div className="bg-red-900/20 border border-red-500/20 rounded-md p-4 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {mintResult && (
          <div className="bg-green-900/20 border border-green-500/20 rounded-md p-4 mb-4">
            <p className="text-green-400 text-sm font-medium">NFT Successfully Minted</p>
            <div className="flex flex-col gap-2 mt-2">
              <p className="text-green-400 text-sm">
                Token ID:{" "}
                <a 
                  href={`https://explorer.solana.com/address/${mintResult.tokenId}/metadata?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono underline hover:text-green-300"
                >
                  {mintResult.tokenId}
                </a>
              </p>
              <p className="text-green-400 text-sm">
                Transferred to:{" "}
                <span className="font-mono">
                  {mintResult.transferredTo}
                </span>
              </p>
            </div>
          </div>
        )}

        {debug && (
          <div className="collapse bg-gray-900/20 border border-gray-500/20 rounded-md">
            <input 
              type="checkbox" 
              checked={isDebugOpen}
              onChange={(e) => handleDebugOpenChange(e.target.checked)}
              className="collapse-toggle"
            /> 
            <div className="collapse-title flex items-center justify-between text-gray-400 hover:text-gray-300">
              <span className="text-sm font-medium">Debug Information</span>
              {isDebugOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
            <div className="collapse-content">
              <pre className="text-xs whitespace-pre-wrap text-gray-400">{debug}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default URLInput;