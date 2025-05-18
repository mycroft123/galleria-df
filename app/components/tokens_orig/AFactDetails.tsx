'use client';

import React from 'react';
import { X, ExternalLink, Coins, Info } from 'lucide-react';

// Interface for AFact structure
interface AFact {
  id: string;
  fact: string;
  sourceUrl: string;
  extractedDate: string;
  earnings: number;
}

interface AFactDetailsProps {
  afact: AFact;
  onClose: () => void;
}

const AFactDetails: React.FC<AFactDetailsProps> = ({ afact, onClose }) => {
  // Helper function to format date for display
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-auto border border-gray-700 shadow-xl">
        <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <div className="w-6 h-6">
              <img 
                src="https://w6hav65sf2mc3do4yxsgex3rfupnngahqfibv7lphwvgisf7cfua.arweave.net/t44K-7IumC2N3MXkYl9xLR7WmAeBUBr9bz2qZEi_EWg"
                alt="AFACT"
                className="w-full h-full"
              />
            </div>
            AFact Details
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-400">Fact Content</h4>
            <p className="text-white bg-gray-800 p-3 rounded border border-gray-700">
              {afact.fact}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-400">Extraction Date</h4>
              <div className="text-white bg-gray-800 p-2 rounded border border-gray-700">
                {formatDate(afact.extractedDate)}
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-400">AFact ID</h4>
              <div className="text-white bg-gray-800 p-2 rounded border border-gray-700 break-all">
                {afact.id}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-400">Source URL</h4>
            <div className="flex items-center gap-2 text-white bg-gray-800 p-2 rounded border border-gray-700 break-all">
              <ExternalLink className="h-4 w-4 flex-shrink-0 text-blue-400" />
              <a 
                href={afact.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                {afact.sourceUrl}
              </a>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-green-900/20 rounded-lg border border-green-800">
            <h4 className="text-lg font-medium text-green-400 flex items-center gap-2 mb-3">
              <Coins className="h-5 w-5" />
              Earnings Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-700">
                <div className="text-sm text-gray-400 mb-1">Current Earnings</div>
                <div className="text-2xl font-semibold text-green-400">${afact.earnings.toFixed(2)}</div>
              </div>
              
              <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-700">
                <div className="text-sm text-gray-400 mb-1">Earnings per Month</div>
                <div className="text-2xl font-semibold text-green-400">${(afact.earnings * 0.1).toFixed(2)}</div>
              </div>
            </div>
            
            <div className="mt-4 flex items-start gap-2 text-xs text-gray-400 bg-gray-800/20 p-2 rounded">
              <Info className="h-4 w-4 flex-shrink-0 text-blue-400 mt-0.5" />
              <p>
                The earnings are calculated based on the fact's usage and citation across the network. 
                Monthly earnings represent recurring revenue from continued usage of this fact.
              </p>
            </div>
          </div>
          
          <div className="pt-4 flex justify-end">
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AFactDetails;