'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { FungibleToken } from "@/app/types";
import DEFactTable from './DEFactTable';

// Define DEFact types
interface DEFact {
  id: string;
  name: string;
  symbol: string;
  totalBalance: number;
  totalEarnings: number;
  ofacts: OFact[];
}

// Interface for OFact structure
interface OFact {
  id: string;
  content: string;
  sourceUrl: string;
  createdDate: string;
  afacts: AFact[];
}

// Interface for AFact structure
interface AFact {
  id: string;
  fact: string;
  sourceUrl: string;
  extractedDate: string;
  earnings: number;
}

interface DEFactsViewProps {
  walletAddress: string;
  tokens?: FungibleToken[];
}

const DEFactsView: React.FC<DEFactsViewProps> = ({ walletAddress, tokens }) => {
  const [defacts, setDefacts] = useState<DEFact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Simulate fetching DEFacts, OFacts, and AFacts data
  const fetchDEFacts = async () => {
    if (!walletAddress) {
      setError('No wallet address provided');
      setLoading(false);
      return;
    }

    try {
      // In a real implementation, you would fetch this data from your API
      // For now, we'll generate mock data
      const mockDEFacts: DEFact[] = [
        {
          id: 'defact1',
          name: 'Finance DEFacts',
          symbol: 'FDEF',
          totalBalance: 1250.75,
          totalEarnings: 320.50,
          ofacts: [
            {
              id: 'ofact1',
              content: 'Q1 2025 Financial Report',
              sourceUrl: 'https://example.com/finance-report-q1-2025',
              createdDate: new Date('2025-04-15').toISOString(),
              afacts: [
                {
                  id: 'afact1-1',
                  fact: 'The company reported a 12% increase in quarterly revenue, reaching $3.5 billion.',
                  sourceUrl: 'https://example.com/finance-report-q1-2025',
                  extractedDate: new Date('2025-04-15T10:30:00').toISOString(),
                  earnings: 15.25
                },
                {
                  id: 'afact1-2',
                  fact: 'Operating margins improved by 2.3 percentage points compared to the same quarter last year.',
                  sourceUrl: 'https://example.com/finance-report-q1-2025',
                  extractedDate: new Date('2025-04-15T10:35:00').toISOString(),
                  earnings: 12.80
                }
              ]
            },
            {
              id: 'ofact2',
              content: 'Annual Shareholders Meeting Summary',
              sourceUrl: 'https://example.com/annual-meeting-2025',
              createdDate: new Date('2025-03-28').toISOString(),
              afacts: [
                {
                  id: 'afact2-1',
                  fact: 'The board approved a $1.2 billion share buyback program for the fiscal year 2025.',
                  sourceUrl: 'https://example.com/annual-meeting-2025',
                  extractedDate: new Date('2025-03-28T14:15:00').toISOString(),
                  earnings: 18.50
                }
              ]
            }
          ]
        },
        {
          id: 'defact2',
          name: 'Technology DEFacts',
          symbol: 'TDEF',
          totalBalance: 875.20,
          totalEarnings: 215.30,
          ofacts: [
            {
              id: 'ofact3',
              content: 'Product Launch Announcement',
              sourceUrl: 'https://example.com/product-launch-may-2025',
              createdDate: new Date('2025-05-10').toISOString(),
              afacts: [
                {
                  id: 'afact3-1',
                  fact: 'The company unveiled its next-generation AI chip with 40% improved performance.',
                  sourceUrl: 'https://example.com/product-launch-may-2025',
                  extractedDate: new Date('2025-05-10T09:45:00').toISOString(),
                  earnings: 22.15
                },
                {
                  id: 'afact3-2',
                  fact: 'The new product line will be available for enterprise customers starting June 2025.',
                  sourceUrl: 'https://example.com/product-launch-may-2025',
                  extractedDate: new Date('2025-05-10T09:50:00').toISOString(),
                  earnings: 16.70
                }
              ]
            }
          ]
        }
      ];

      setDefacts(mockDEFacts);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch DEFacts');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    await fetchDEFacts();
  };

  // Load DEFacts data on component mount
  useEffect(() => {
    fetchDEFacts();
  }, [walletAddress]);

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

  if (defacts.length === 0) {
    return <div className="w-full p-4 text-center text-gray-400">No DEFacts found</div>;
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="text-xl font-semibold">DEFacts Portfolio</div>
          <div className="text-sm text-gray-400">
            Showing earnings and balance information
          </div>
        </div>
        <div className="flex items-center gap-3">
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
      </div>
      
      {/* DEFacts Table */}
      <div className="w-full overflow-x-auto rounded-lg bg-black bg-opacity-60 p-2">
        <DEFactTable defacts={defacts} />
      </div>
    </div>
  );
};

export default DEFactsView;