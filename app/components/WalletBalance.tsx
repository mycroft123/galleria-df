"use client";

import React, { useState } from 'react';
import { Copy, ExternalLink, X } from 'lucide-react';
import { useWallet, WalletProvider } from '@/app/providers/WalletProvider';

const DFCT_TOKEN_ADDRESS = '8mTDKt6gY1DatZDKbvMCdiw4AZRdCpUjxuRv4GRBg2Xn';

// Internal components that use the hook
const WalletModalContent = ({ 
  isOpen, 
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { publicKey, tokenBalance } = useWallet();
  
  if (!isOpen) return null;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Modal content - keep the same as your original */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 max-w-md w-full mx-4 relative">
        {/* Content unchanged */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800"
          type="button"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold text-white mb-6">Wallet Details</h2>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Wallet Address</label>
            <div className="flex items-center gap-2">
              <code className="block w-full bg-black/30 rounded-lg p-3 text-sm text-white font-mono break-all">
                {publicKey}
              </code>
              <button 
                onClick={() => copyToClipboard(publicKey || '')}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                type="button"
              >
                <Copy size={16} className="text-gray-400 hover:text-white" />
              </button>
              <a 
                href={`https://explorer.solana.com/address/${publicKey}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ExternalLink size={16} className="text-gray-400 hover:text-white" />
              </a>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">DFCT Balance</label>
            <div className="flex items-center gap-2">
              <code className="block w-full bg-black/30 rounded-lg p-3 text-sm text-white font-mono">
                {tokenBalance} DFCT
              </code>
              <button 
                onClick={() => copyToClipboard(tokenBalance?.toString() || '')}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                type="button"
              >
                <Copy size={16} className="text-gray-400 hover:text-white" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Token Contract</label>
            <div className="flex items-center gap-2">
              <code className="block w-full bg-black/30 rounded-lg p-3 text-sm text-white font-mono break-all">
                {DFCT_TOKEN_ADDRESS}
              </code>
              <button 
                onClick={() => copyToClipboard(DFCT_TOKEN_ADDRESS)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                type="button"
              >
                <Copy size={16} className="text-gray-400 hover:text-white" />
              </button>
              <a 
                href={`https://explorer.solana.com/address/${DFCT_TOKEN_ADDRESS}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ExternalLink size={16} className="text-gray-400 hover:text-white" />
              </a>
            </div>
          </div>

          {/* Bottom close button */}
          <div className="mt-8 pt-4 border-t border-gray-800">
            <button
              onClick={onClose}
              className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              type="button"
            >
              <X size={16} />
              Close Modal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const WalletBalanceContent = () => {
  const { isConnected, isLoading, error, publicKey, tokenBalance, connectWallet } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

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
        onClick={connectWallet}
        className="rounded-full bg-indigo-100/5 px-3 py-1 text-sm font-semibold text-white ring-1 ring-inset ring-white/10 hover:bg-indigo-100/10"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <>
      <div 
        className="flex items-center gap-2 cursor-pointer"
        onClick={handleOpenModal}
      >
        <div className="flex items-center justify-center rounded-full bg-indigo-100/5 px-3 py-1 text-sm font-semibold text-white ring-1 ring-inset ring-white/10 hover:bg-indigo-100/10 transition-colors">
          {publicKey ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}` : 'Error loading wallet'}
        </div>
        {tokenBalance !== null && (
          <div className="flex items-center justify-center rounded-full bg-indigo-100/5 px-3 py-1 text-sm font-semibold text-white ring-1 ring-inset ring-white/10 transition-all duration-200 hover:bg-indigo-100/10">
            {tokenBalance} DFCT
          </div>
        )}
      </div>

      <WalletModalContent
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
};

// Main component wrapped with provider
const WalletBalance = () => {
  return (
    <WalletProvider>
      <WalletBalanceContent />
    </WalletProvider>
  );
};

export default WalletBalance;