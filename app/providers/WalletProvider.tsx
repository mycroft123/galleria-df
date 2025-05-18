"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

const DFCT_TOKEN_ADDRESS = '8mTDKt6gY1DatZDKbvMCdiw4AZRdCpUjxuRv4GRBg2Xn';

// Create Helius connection with enhanced configuration
const connection = new Connection(
  `${process.env.NEXT_PUBLIC_HELIUS_RPC_URL}/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`,
  {
    commitment: 'confirmed',
    disableRetryOnRateLimit: false
  }
);

interface WalletContextType {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  publicKey: string | null;
  tokenBalance: number | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  
  const fetchTokenBalance = async (walletAddress: string) => {
    try {
      const owner = new PublicKey(walletAddress);
      
      const accounts = await connection.getParsedTokenAccountsByOwner(
        owner,
        {
          programId: TOKEN_PROGRAM_ID
        },
        'confirmed'
      );

      const tokenAccount = accounts.value.find(
        accountInfo => accountInfo.account.data.parsed.info.mint === DFCT_TOKEN_ADDRESS
      );

      if (tokenAccount) {
        const balance = tokenAccount.account.data.parsed.info.tokenAmount.uiAmount;
        setTokenBalance(balance);
      } else {
        setTokenBalance(0);
      }
    } catch (error) {
      console.error('Error fetching token balance:', error);
      setTokenBalance(null);
      setError('Failed to fetch token balance');
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

      setError(null);

      try {
        const resp = await provider.connect({ onlyIfTrusted: true });
        const address = resp.publicKey.toString();
        setIsConnected(true);
        setPublicKey(address);
        await fetchTokenBalance(address);
      } catch (err) {
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

  const connectWallet = async () => {
    try {
      const provider = window.solana;
      
      if (!provider) {
        setError('Please install Phantom wallet');
        return;
      }

      setError(null);
      setIsLoading(true);
      
      const resp = await provider.connect();
      const address = resp.publicKey.toString();
      setIsConnected(true);
      setPublicKey(address);
      await fetchTokenBalance(address);
    } catch (error: any) {
      console.error('Manual connection error:', error);
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

  const disconnectWallet = () => {
    try {
      const provider = window.solana;
      if (provider && provider.disconnect) {
        provider.disconnect();
      }
      
      setIsConnected(false);
      setPublicKey(null);
      setTokenBalance(null);
      setError(null);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      setError('Failed to disconnect wallet');
    }
  };

  const refreshBalance = async () => {
    if (isConnected && publicKey) {
      await fetchTokenBalance(publicKey);
    }
  };

  useEffect(() => {
    const provider = window.solana;
    
    if (provider) {
      checkIfWalletIsConnected();

      const handleConnect = async () => {
        try {
          if (provider.publicKey) {
            const address = provider.publicKey.toString();
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
        setIsConnected(false);
        setPublicKey(null);
        setTokenBalance(null);
        setError(null);
      };

      const handleAccountChange = async () => {
        try {
          if (provider.publicKey) {
            const address = provider.publicKey.toString();
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

  useEffect(() => {
    if (!isConnected || !publicKey) return;

    fetchTokenBalance(publicKey);

    const interval = setInterval(() => {
      fetchTokenBalance(publicKey);
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [isConnected, publicKey]);

  const value = {
    isConnected,
    isLoading,
    error,
    publicKey,
    tokenBalance,
    connectWallet,
    disconnectWallet,
    refreshBalance
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};