"use client";

import React, { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { RefreshCw, Loader2 } from 'lucide-react';

const DFCT_TOKEN_ADDRESS = '8mTDKt6gY1DatZDKbvMCdiw4AZRdCpUjxuRv4GRBg2Xn';

// Create Helius connection
const connection = new Connection(
  `${process.env.NEXT_PUBLIC_HELIUS_RPC_URL}/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`
);

const PAIInput = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [inputText, setInputText] = useState('');

  const fetchTokenBalance = async (walletAddress: string) => {
    try {
      console.log('Fetching balance for:', walletAddress);
      
      // Convert string address to PublicKey
      const owner = new PublicKey(walletAddress);
      
      // Get all token accounts for this wallet using Helius RPC
      const accounts = await connection.getParsedTokenAccountsByOwner(owner, {
        programId: TOKEN_PROGRAM_ID
      });

      console.log('Found token accounts:', accounts.value.length);

      // Find our specific token account
      const tokenAccount = accounts.value.find(
        accountInfo => accountInfo.account.data.parsed.info.mint === DFCT_TOKEN_ADDRESS
      );

      if (tokenAccount) {
        console.log('Found DFCT token account:', tokenAccount.account.data.parsed.info.tokenAmount.uiAmount);
        setTokenBalance(tokenAccount.account.data.parsed.info.tokenAmount.uiAmount);
      } else {
        console.log('No DFCT token account found, setting balance to 0');
        setTokenBalance(0);
      }
    } catch (error) {
      console.error('Error fetching token balance:', error);
      setTokenBalance(null);
      setError('Failed to fetch token balance');
    }
  };

  const handleRefresh = async () => {
    if (!publicKey || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await fetchTokenBalance(publicKey);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;

    try {
      setIsProcessing(true);
      // Here you would add your AI processing logic
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulated processing
      setInputText('');
    } catch (error) {
      console.error('Error processing input:', error);
      setError('Failed to process input');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const checkIfWalletIsConnected = async () => {
    try {
      const provider = window.solana;
      
      if (!provider) {
        setError('Please install Phantom wallet');
        setIsLoading(false);
        return;
      }

      // Clear any previous errors
      setError(null);

      try {
        // Only try to eagerly connect if the wallet was previously connected
        const resp = await provider.connect({ onlyIfTrusted: true });
        const address = resp.publicKey.toString();
        console.log('Wallet auto-connected:', address);
        setIsConnected(true);
        setPublicKey(address);
        await fetchTokenBalance(address);
      } catch (err) {
        // This is expected if wallet wasn't previously connected
        console.log('Wallet not previously connected:', err);
        setIsConnected(false);
        setPublicKey(null);
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      setError('Failed to check wallet connection');
      setIsConnected(false);
      setPublicKey(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualConnect = async () => {
    try {
      const provider = window.solana;
      
      if (!provider) {
        setError('Please install Phantom wallet');
        return;
      }

      // Clear any previous errors
      setError(null);
      setIsLoading(true);
      
      const resp = await provider.connect();
      const address = resp.publicKey.toString();
      setIsConnected(true);
      setPublicKey(address);
      await fetchTokenBalance(address);
    } catch (error: any) {
      console.error('Manual connection error:', error);
      // Handle specific error cases
      if (error.code === 4001) {
        setError('Connection request was rejected');
      } else if (error.message?.includes('User rejected')) {
        setError('Connection request was rejected');
      } else {
        setError('Failed to connect wallet. Please try again.');
      }
      setIsConnected(false);
      setPublicKey(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial setup and event listeners
  useEffect(() => {
    const provider = window.solana;
    
    if (provider) {
      // Initial connection check
      checkIfWalletIsConnected();

      const handleConnect = async () => {
        try {
          if (provider.publicKey) {
            const address = provider.publicKey.toString();
            console.log('Wallet connected:', address);
            setIsConnected(true);
            setPublicKey(address);
            await fetchTokenBalance(address);
          }
        } catch (error) {
          console.error('Connect event error:', error);
          setError('Failed to handle wallet connection');
        }
      };

      const handleDisconnect = () => {
        console.log('Wallet disconnected');
        setIsConnected(false);
        setPublicKey(null);
        setTokenBalance(null);
        setError(null); // Clear any previous errors
      };

      const handleAccountChange = async () => {
        try {
          if (provider.publicKey) {
            const address = provider.publicKey.toString();
            console.log('Account changed:', address);
            setPublicKey(address);
            await fetchTokenBalance(address);
          } else {
            setPublicKey(null);
            setTokenBalance(null);
          }
        } catch (error) {
          console.error('Account change error:', error);
          setError('Failed to handle account change');
        }
      };

      // Set up event listeners
      provider.on('connect', handleConnect);
      provider.on('disconnect', handleDisconnect);
      provider.on('accountChanged', handleAccountChange);

      return () => {
        try {
          provider.removeAllListeners();
        } catch (error) {
          console.error('Error removing listeners:', error);
        }
      };
    } else {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh setup
  useEffect(() => {
    if (!isConnected || !publicKey) return;

    const interval = setInterval(() => {
      fetchTokenBalance(publicKey);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isConnected, publicKey]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-full bg-indigo-100/5 px-3 py-1 text-sm font-semibold text-white ring-1 ring-inset ring-white/10">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center rounded-full bg-red-500/10 px-3 py-1 text-sm font-semibold text-red-400 ring-1 ring-inset ring-red-500/20">
        {error}
      </div>
    );
  }

  if (!isConnected) {
    return (
      <button
        onClick={handleManualConnect}
        className="rounded-full bg-indigo-100/5 px-3 py-1 text-sm font-semibold text-white ring-1 ring-inset ring-white/10 hover:bg-indigo-100/10"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center rounded-full bg-indigo-100/5 px-3 py-1 text-sm font-semibold text-white ring-1 ring-inset ring-white/10">
          {publicKey ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}` : 'Error loading wallet'}
        </div>
        {tokenBalance !== null && (
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-full bg-indigo-100/5 px-3 py-1 text-sm font-semibold text-white ring-1 ring-inset ring-white/10">
              {tokenBalance} DFCT
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`rounded-full bg-indigo-100/5 p-1.5 text-white ring-1 ring-inset ring-white/10 
                ${isRefreshing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-100/10'}`}
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="relative w-full">
        <div className="relative flex items-center">
          <textarea
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={isProcessing}
            rows={1}
            className="w-full resize-none bg-gray-900/50 rounded-xl border border-gray-800 px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed pr-12"
            style={{ minHeight: '42px', maxHeight: '200px' }}
          />
          <button
            type="submit"
            disabled={isProcessing || !inputText.trim()}
            className="absolute right-2 rounded-lg p-2 text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            {isProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg
                className="h-5 w-5 rotate-90"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PAIInput;