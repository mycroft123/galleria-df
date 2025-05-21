'use client';

import React from 'react';
import { useWallet } from '@/app/providers/WalletProvider';

const WalletDebug = () => {
  const { isConnected, publicKey, tokenBalance, isLoading } = useWallet();
  
  const debugStyle = {
    fontSize: '12px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '4px',
    marginLeft: '8px',
    fontFamily: 'monospace',
  };
  
  return (
    <div style={debugStyle}>
      <div>
        Status: {isLoading ? '🔄' : isConnected ? '✅' : '❌'}
        {isConnected ? ' Connected' : ' Not Connected'}
      </div>
      <div>
        Address: {publicKey ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}` : 'None'}
      </div>
      <div>
        Balance: {tokenBalance !== null ? tokenBalance : 'null'} 
        {typeof tokenBalance === 'number' && tokenBalance > 0 ? ' ✅' : ' ❌'}
      </div>
    </div>
  );
};

export default WalletDebug;