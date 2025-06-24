"use client";
import React, { useState, useEffect } from 'react';

interface DefactsBalanceProps {
  balance?: string;
  hasBalance?: boolean;
}

const DefactsBalance = ({ balance, hasBalance }: DefactsBalanceProps) => {
  // State to store the token balance received from the iframe
  const [tokenBalance, setTokenBalance] = useState('0');
  const [userEmail, setUserEmail] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Use the balance prop if provided
  useEffect(() => {
    if (balance !== undefined) {
      setTokenBalance(balance);
      setIsLoaded(true);
    }
  }, [balance]);
  
  // Also listen for messages from the iframe (backwards compatibility)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Check if we have the right message type
      if (event.data && event.data.type === 'DEFACTS_USER_INFO') {
        console.log('Received user info from iframe:', event.data);
        setTokenBalance(event.data.tokenBalance);
        setUserEmail(event.data.email);
        setIsLoaded(true);
      }
    };
    
    // Add the event listener
    window.addEventListener('message', handleMessage);
    
    // Clean up the event listener when component unmounts
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);
  
  // Format balance with proper decimals
  const formattedBalance = parseFloat(tokenBalance || '0').toFixed(4);
  
  // If no balance and not loaded, show loading state
  if (!isLoaded && !balance) {
    return (
      <div className="flex items-center">
        <div className="rounded-full bg-gray-700 px-3 py-1.5 text-sm">
          <span className="font-medium text-gray-300">
            -- <span className="ml-1 font-normal">DeFacts</span>
          </span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center">
      <div className={`rounded-full ${hasBalance ? 'bg-green-100 bg-opacity-20' : 'bg-gray-700'} px-3 py-1.5 text-sm shadow-sm`}>
        <span className={`font-semibold ${hasBalance ? 'text-green-400' : 'text-gray-300'}`}>
          {formattedBalance} <span className="ml-1 font-normal">DF</span>
        </span>
      </div>
      
      {/* Optionally show email or user info - can be hidden if not needed */}
      {userEmail && (
        <div className="ml-2 text-xs text-gray-400">
          {userEmail}
        </div>
      )}
    </div>
  );
};

export default DefactsBalance;