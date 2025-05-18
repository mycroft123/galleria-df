import React from 'react';
import { Copy, ExternalLink, X } from 'lucide-react';

const DFCT_TOKEN_ADDRESS = "YOUR_TOKEN_ADDRESS"; // Added missing constant

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  publicKey: string | null;
  tokenBalance: number | null;
}

const WalletModal: React.FC<WalletModalProps> = ({ 
  isOpen, 
  onClose, 
  publicKey = "Sample Address", 
  tokenBalance = 0
}) => {
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
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 max-w-md w-full mx-4 relative">
        {/* Top-right close button */}
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

export default WalletModal;