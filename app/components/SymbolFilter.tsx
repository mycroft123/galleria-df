'use client';

import { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface SymbolFilterProps {
  symbols: string[];
  onSymbolSelect: (symbol: string) => void;
}

const SymbolFilter = ({ symbols, onSymbolSelect }: SymbolFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('All Symbols');

  const handleSymbolSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
    onSymbolSelect(symbol);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="flex items-center justify-between rounded-full bg-indigo-100/5 px-3 py-1.5 text-sm font-semibold text-white ring-1 ring-inset ring-white/10 hover:ring-white/30 transition duration-200 ease-in-out min-w-[140px]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedSymbol}</span>
        <ChevronDownIcon className="ml-2 h-4 w-4" aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md bg-black bg-opacity-90 backdrop-blur-sm shadow-lg ring-1 ring-white ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <button
              className="block w-full px-4 py-2 text-left text-sm text-white hover:bg-indigo-100/5"
              onClick={() => handleSymbolSelect('All Symbols')}
            >
              All Symbols
            </button>
            {symbols.map((symbol) => (
              <button
                key={symbol}
                className="block w-full px-4 py-2 text-left text-sm text-white hover:bg-indigo-100/5"
                onClick={() => handleSymbolSelect(symbol)}
              >
                {symbol}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SymbolFilter;