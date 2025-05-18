'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Loader2, DollarSign, ArrowUp, ArrowDown } from 'lucide-react';

interface Token {
  symbol: string;
  name: string;
  balance: number;
  value: number;
  change24h: number;
  iconUrl?: string;
}

interface TokenBalanceViewProps {
  walletAddress: string;
  onTokenSelected: (token: Token) => void;
}

const TokenBalanceView: React.FC<TokenBalanceViewProps> = ({ walletAddress, onTokenSelected }) => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch token balances
  const fetchTokenBalances = async () => {
    if (!walletAddress) {
      setError('No wallet address provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data for SOL and DFACT tokens
      const mockTokens: Token[] = [
        { 
          symbol: 'SOL', 
          name: 'Solana', 
          balance: 12.45, 
          value: 1245.67, 
          change24h: 5.2,
          iconUrl: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
        },
        { 
          symbol: 'DFACT', 
          name: 'DFacts Token', 
          balance: 200, 
          value: 600.00, 
          change24h: 7.8,
          iconUrl: 'https://tczw6pw6uivwwld5pas5bfaxcjhd5ssfndhu6eoqynggvehj2aua.arweave.net/mLNvPt6iK2ssfXgl0JQXEk4-ykVoz08R0MNMapDp0Cg'
        }
      ];

      setTokens(mockTokens);
    } catch (err) {
      setError('Failed to fetch token balances');
      console.error('Error fetching token balances:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTokenBalances();
  };

  useEffect(() => {
    fetchTokenBalances();
  }, [walletAddress]);

  // Calculate total portfolio value
  const totalValue = tokens.reduce((sum, token) => sum + token.value, 0);

  if (loading) {
    return (
      <div className="w-full p-8 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4 text-center text-red-400 bg-red-900/20 rounded-lg">
        {error}
      </div>
    );
  }

  if (tokens.length === 0) {
    return <div className="w-full p-4 text-center text-gray-400">No tokens found</div>;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(2) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(2) + 'K';
    } else if (value < 0.01) {
      return '<0.01';
    } else {
      return value.toFixed(2);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Token Balances</h2>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-100/5 px-3 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-white/10 transition-all hover:bg-indigo-100/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRefreshing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            'Refresh'
          )}
        </button>
      </div>

      <div className="p-4 rounded-lg bg-gray-800/30 ring-1 ring-white/10">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Total Portfolio Value</span>
          <span className="text-2xl font-bold">{formatCurrency(totalValue)}</span>
        </div>
      </div>
      
      <div className="w-full overflow-x-auto rounded-lg bg-gray-800/10 ring-1 ring-white/10">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="p-3 text-left">Asset</th>
              <th className="p-3 text-right">Balance</th>
              <th className="p-3 text-right">Value</th>
              <th className="p-3 text-right">24h</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => (
              <tr 
                key={token.symbol}
                onClick={() => onTokenSelected(token)}
                className="border-b border-white/10 hover:bg-blue-900/20 cursor-pointer"
              >
                <td className="p-3">
                  <div className="flex items-center">
                    <div className="w-6 h-6 mr-2 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                      <img 
                        src={token.iconUrl || '/api/placeholder/24/24'} 
                        alt={token.symbol}
                        className="w-6 h-6"
                      />
                    </div>
                    <div>
                      <div className="font-medium">{token.symbol}</div>
                      <div className="text-xs text-gray-400">{token.name}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-right font-mono">
                  {formatNumber(token.balance)}
                </td>
                <td className="p-3 text-right font-mono">
                  {formatCurrency(token.value)}
                </td>
                <td className={`p-3 text-right font-mono ${
                  token.change24h > 0 ? 'text-green-400' : 
                  token.change24h < 0 ? 'text-red-400' : 
                  'text-gray-400'
                }`}>
                  <div className="flex items-center justify-end">
                    {token.change24h > 0 ? (
                      <ArrowUp className="h-3 w-3 mr-1" />
                    ) : token.change24h < 0 ? (
                      <ArrowDown className="h-3 w-3 mr-1" />
                    ) : null}
                    {Math.abs(token.change24h).toFixed(2)}%
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TokenBalanceView;