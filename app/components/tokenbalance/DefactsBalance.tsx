"use client";
import React, { useState, useEffect } from 'react';

const DefactsBalance = () => {
  // State to store the token balance received from the iframe
  const [tokenBalance, setTokenBalance] = useState('0.0000');
  const [userEmail, setUserEmail] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Listen for messages from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Optional: Check the origin for security
      // if (event.origin !== "https://your-librechat-domain.com") return;
      
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

  // If no data received yet, show loading state
  if (!isLoaded) {
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
      <div className="rounded-full bg-green-100 bg-opacity-20 px-3 py-1.5 text-sm shadow-sm">
        <span className="font-semibold text-green-400">
          {tokenBalance} <span className="ml-1 font-normal">DF</span>
        </span>
      </div>
      
      {/* Optionally show email or user info - can be hidden if not needed */}
      {/* 
      <div className="ml-2 text-xs text-gray-400">
        {userEmail}
      </div>
      */}
    </div>
  );
};

export default DefactsBalance;
