// File: app/components/tokenbalance/DefactsBalance.tsx
"use client";

import { useState, useEffect } from 'react';

export default function DefactsBalance() {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        // Direct API call to get balance from MongoDB
        const response = await fetch('/api/token-balance');
        
        if (!response.ok) {
          throw new Error('Failed to fetch balance from API');
        }
        
        const data = await response.json();
        console.log('Received balance from API:', data.balance);
        
        setBalance(data.balance);
        setLoading(false);
        
        // Store in localStorage as a fallback for future visits
        localStorage.setItem('defactsBalance', String(data.balance));
      } catch (err) {
        console.error('Error fetching balance from API:', err);
        
        // Try to get balance from localStorage as fallback
        const storedBalance = localStorage.getItem('defactsBalance');
        if (storedBalance) {
          setBalance(parseInt(storedBalance, 10));
          setLoading(false);
        } else {
          // Fall back to original iframe method if API and localStorage both fail
          tryIframeMethod();
        }
      }
    };

    // Original iframe method as fallback
    const tryIframeMethod = () => {
      // Find the chat iframe
      const chatIframe = document.querySelector('iframe[src*="librechat-production"]') as HTMLIFrameElement;
      
      if (chatIframe && chatIframe.contentWindow) {
        console.log('Falling back to iframe method for balance');
        
        // Set up message listener
        const handleMessage = (event: MessageEvent) => {
          const libreChatDomain = 'librechat-production-97e2.up.railway.app';
          if (event.origin.includes(libreChatDomain)) {
            try {
              const data = event.data;
              if (data && data.type === 'defacts-token-balance') {
                console.log('Received balance from iframe fallback:', data.balance);
                setBalance(data.balance);
                setLoading(false);
                localStorage.setItem('defactsBalance', String(data.balance));
                // Remove listener after successful response
                window.removeEventListener('message', handleMessage);
              }
            } catch (err) {
              console.error('Error processing iframe message:', err);
            }
          }
        };
        
        // Add event listener
        window.addEventListener('message', handleMessage);
        
        // Send request to iframe
        chatIframe.contentWindow.postMessage({ 
          type: 'request-token-balance' 
        }, '*');
        
        // Set timeout for iframe method
        setTimeout(() => {
          if (loading) {
            setError('Failed to load balance');
            setLoading(false);
            // Cleanup listener if no response
            window.removeEventListener('message', handleMessage);
          }
        }, 5000);
      } else {
        console.error('Chat iframe not found and API failed');
        setError('Balance unavailable');
        setLoading(false);
      }
    };

    // Start by trying the API method
    fetchBalance();
    
    // Refresh balance periodically
    const intervalId = setInterval(fetchBalance, 60000); // Every minute
    
    return () => {
      clearInterval(intervalId);
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <div className="defacts-balance bg-orange-900 bg-opacity-25 rounded-md px-3 py-2 flex items-center mr-4">
      <div className="icon mr-2">
        <img 
          src="/assets/defacts-icon.png" 
          alt="DeFacts Token" 
          className="w-5 h-5"
          onError={(e) => {
            // Fallback if image doesn't exist
            e.currentTarget.onerror = null;
            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'%3E%3C/circle%3E%3Cpath d='M8 14s1.5 2 4 2 4-2 4-2'%3E%3C/path%3E%3Cline x1='9' y1='9' x2='9.01' y2='9'%3E%3C/line%3E%3Cline x1='15' y1='9' x2='15.01' y2='9'%3E%3C/line%3E%3C/svg%3E";
          }}
        />
      </div>
      <div className="balance-info">
        <div className="label text-xs text-orange-200">DeFacts Balance</div>
        <div className="amount text-sm font-medium text-white">
          {loading ? (
            <div className="w-16 h-4 bg-orange-700 animate-pulse rounded"></div>
          ) : error ? (
            <span className="text-red-400 text-xs">{error}</span>
          ) : (
            <>{balance?.toLocaleString() || 0} tokens</>
          )}
        </div>
      </div>
    </div>
  );
}