"use client";

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from "lucide-react";
import { usePersistentView } from '@/app/hooks/usePersistentView';

interface ProcessingResults {
  success: boolean;
  totalFactsProcessed: number;
  totalMinted: number;
  mintedFacts: Array<{
    fact: string;
    mintId: string;
    sourceUrl: string;
    extractedDate: string;
  }>;
  processingDetails: {
    url: string;
    title: string;
    contentLength: number;
    factsSent: number;
    successfulMints: number;
    totalBatches: number;
  };
}

interface JobStatus {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  progress?: {
    currentStep: string;
    totalFactsProcessed?: number;
    currentBatch?: number;
    totalBatches?: number;
  };
  results?: ProcessingResults;
  error?: string;
}

interface URLState {
  url: string;
  debug: string;
  results: ProcessingResults | null;
  isDebugOpen: boolean;
}

const URLInput = () => {
  const { saveViewState, getViewState, isInitialized } = usePersistentView();
  
  // States that should persist
  const [url, setUrl] = useState('');
  const [results, setResults] = useState<ProcessingResults | null>(null);
  const [debug, setDebug] = useState('');
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  
  // States that shouldn't persist between sessions
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);

  // Function to save the complete state
  const saveCompleteState = (updates: Partial<URLState>) => {
    if (!isInitialized) return;

    const currentState: URLState = {
      url,
      debug,
      results,
      isDebugOpen
    };

    const newState = {
      ...currentState,
      ...updates
    };

    console.log('Saving URL Input state:', newState);
    saveViewState('url', newState);
  };

  // Restore state when component mounts
  useEffect(() => {
    if (!isInitialized) return;
    
    const savedState = getViewState('url') as URLState;
    console.log('Loading URL Input state:', savedState);
    
    if (savedState) {
      setUrl(savedState.url || '');
      setDebug(savedState.debug || '');
      if (savedState.results) setResults(savedState.results);
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

  const handleResultsChange = (newResults: ProcessingResults | null) => {
    setResults(newResults);
    saveCompleteState({ results: newResults });
  };

  // Poll for job status
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const pollJobStatus = async () => {
      if (!jobId) return;

      try {
        const response = await fetch(`http://localhost:3002/api/facts-to-nfts?jobId=${jobId}`);
        const status: JobStatus = await response.json();
        
        setJobStatus(status);
        handleDebugChange(prev => `${prev}\nJob status: ${status.status}${
          status.results?.mintedFacts 
            ? `\nMinted Facts: ${status.results.mintedFacts.length}` 
            : ''
        }`);

        if (status.status === 'completed' && status.results) {
          handleResultsChange({
            success: status.results.success,
            totalFactsProcessed: status.results.totalFactsProcessed,
            totalMinted: status.results.totalMinted,
            mintedFacts: status.results.mintedFacts || [],
            processingDetails: status.results.processingDetails
          });
          
          setJobId(null);
          setLoading(false);
        } else if (status.status === 'failed') {
          setError(`Processing failed: ${status.error}`);
          setJobId(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error polling job status:', err);
        setError('Failed to get job status');
        setJobId(null);
        setLoading(false);
      }
    };

    if (jobId) {
      intervalId = setInterval(pollJobStatus, 2000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [jobId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    handleDebugChange('');
    handleResultsChange(null);
    setJobStatus(null);

    const apiUrl = 'http://localhost:3002/api/facts-to-nfts';

    try {
      handleDebugChange(`Sending request to: ${apiUrl}\nWith URL: ${url}`);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      handleDebugChange(prev => `${prev}\nResponse status: ${response.status}`);

      const data = await response.json();
      
      if (data.success && data.jobId) {
        setJobId(data.jobId);
        handleDebugChange(prev => `${prev}\nJob ID: ${data.jobId}`);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Request error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Error processing URL: ${errorMessage}`);
      handleDebugChange(prev => `${prev}\nError: ${errorMessage}`);
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
        <h2 className="text-2xl font-bold text-white mb-6">Enter URL</h2>

        <div className="mb-4 text-sm text-gray-300">
          Service status: {loading ? jobStatus?.progress?.currentStep || 'Connecting...' : error ? 'Error' : 'Ready'}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-2">
              URL to Process
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
            {loading ? 'Processing...' : 'Submit'}
          </button>
        </form>

        {error && (
          <div className="bg-red-900/20 border border-red-500/20 rounded-md p-4 mb-4">
            <p className="text-red-400 text-sm">
              {error}
            </p>
            {error.includes('Failed to fetch') && (
              <p className="text-gray-400 text-xs mt-2">
                Make sure the facts service is running on port 3002
              </p>
            )}
          </div>
        )}

        {jobStatus && jobStatus.status === 'processing' && (
          <div className="bg-blue-900/20 border border-blue-500/20 rounded-md p-4 mb-4">
            <p className="text-blue-400 text-sm">
              {jobStatus.progress?.currentStep}
              {jobStatus.progress?.totalFactsProcessed !== undefined && 
                ` (${jobStatus.progress.totalFactsProcessed} facts processed)`}
            </p>
          </div>
        )}

        {debug && (
          <div className="collapse bg-gray-900/20 border border-gray-500/20 rounded-md mb-4">
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
              <pre className="text-xs whitespace-pre-wrap text-gray-400">
                {debug}
              </pre>
            </div>
          </div>
        )}

        {results && (
          <div className="mt-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-white">Processing Results</h3>
              <p className="text-sm text-gray-300">
                Total Facts Processed: {results.totalFactsProcessed} |
                Total Minted: {results.totalMinted}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Fact
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Mint ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {results.mintedFacts.length > 0 ? (
                    results.mintedFacts.map((fact, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-black/20' : 'bg-black/10'}>
                        <td className="px-4 py-3 text-sm text-white">{fact.fact}</td>
                        <td className="px-4 py-3 text-sm text-gray-300 font-mono">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{fact.mintId}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {new Date(fact.extractedDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-sm text-gray-400 text-center">
                        No NFTs were minted.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-4 bg-gray-900/20 rounded-md">
              <h4 className="text-sm font-medium text-white mb-2">Processing Details</h4>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <dt className="text-gray-400">URL:</dt>
                <dd className="text-gray-300">{results.processingDetails.url}</dd>
                <dt className="text-gray-400">Title:</dt>
                <dd className="text-gray-300">{results.processingDetails.title}</dd>
                <dt className="text-gray-400">Content Length:</dt>
                <dd className="text-gray-300">{results.processingDetails.contentLength}</dd>
                <dt className="text-gray-400">Facts Sent:</dt>
                <dd className="text-gray-300">{results.processingDetails.factsSent}</dd>
                <dt className="text-gray-400">Successful Mints:</dt>
                <dd className="text-gray-300">{results.processingDetails.successfulMints}</dd>
                <dt className="text-gray-400">Total Batches:</dt>
                <dd className="text-gray-300">{results.processingDetails.totalBatches}</dd>
              </dl>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default URLInput;