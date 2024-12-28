'use client';

import React, { useState } from 'react';

const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
    return "https://galleria-df-backend-1hopzcdyd-mycroft123s-projects.vercel.app/api";
  }
  return "http://localhost:3002/api";
};

const API_URL = `${getApiUrl()}/facts-to-nfts`;

const URLInput = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [debug, setDebug] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setDebug('');
    
    try {
      setDebug(`Sending request to: ${API_URL}\nWith URL: ${url}`);
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      setDebug(prev => `${prev}\nResponse status: ${response.status}`);

      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        setResults(data);
        setDebug(prev => `${prev}\nSuccessfully processed ${data.totalFactsProcessed} facts, minted ${data.totalMinted} NFTs`);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Request error:', err);
      setError(`Error processing URL: ${err.message}`);
      setDebug(prev => `${prev}\nError: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl">
      <div className="bg-black/30 backdrop-blur-sm rounded-lg p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-6">Enter URL</h2>
        
        <div className="mb-4 text-sm text-gray-300">
          Service status: {loading ? 'Connecting...' : error ? 'Error' : 'Ready'}
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
              onChange={(e) => setUrl(e.target.value)}
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

        {debug && (
          <div className="bg-gray-900/20 border border-gray-500/20 rounded-md p-4 mb-4">
            <pre className="text-gray-400 text-xs whitespace-pre-wrap">
              Debug Information:
              {debug}
            </pre>
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
                  {results.mintedFacts.map((fact, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-black/20' : 'bg-black/10'}>
                      <td className="px-4 py-3 text-sm text-white">
                        {fact.fact}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300 font-mono">
                        {fact.mintId}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {new Date(fact.extractedDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
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