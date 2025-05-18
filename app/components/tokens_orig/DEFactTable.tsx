'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Coins, ExternalLink } from 'lucide-react';
import AFactDetails from './AFactDetails';

// Interface for DEFact structure
interface DEFact {
  id: string;
  name: string;
  symbol: string;
  totalBalance: number;
  totalEarnings: number;
  ofacts: OFact[];
}

// Interface for OFact structure
interface OFact {
  id: string;
  content: string;
  sourceUrl: string;
  createdDate: string;
  afacts: AFact[];
}

// Interface for AFact structure
interface AFact {
  id: string;
  fact: string;
  sourceUrl: string;
  extractedDate: string;
  earnings: number;
}

interface DEFactTableProps {
  defacts: DEFact[];
}

const DEFactTable: React.FC<DEFactTableProps> = ({ defacts }) => {
  const [expandedDefacts, setExpandedDefacts] = useState<{ [key: string]: boolean }>({});
  const [expandedOfacts, setExpandedOfacts] = useState<{ [key: string]: boolean }>({});
  const [selectedAFact, setSelectedAFact] = useState<AFact | null>(null);
  
  // Toggle expanded state for DEFacts
  const toggleExpandedDefact = (defactId: string) => {
    setExpandedDefacts(prev => ({
      ...prev,
      [defactId]: !prev[defactId]
    }));
  };

  // Toggle expanded state for OFacts
  const toggleExpandedOfact = (ofactId: string) => {
    setExpandedOfacts(prev => ({
      ...prev,
      [ofactId]: !prev[ofactId]
    }));
  };

  // Format currency with $ sign and 2 decimal places
  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };
  
  // Helper function to format date for display
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };
  
  // Handle AFact click to show details
  const handleAFactClick = (afact: AFact) => {
    setSelectedAFact(afact);
  };
  
  // Calculate total AFacts for a DEFact
  const getTotalAFactsCount = (defact: DEFact): number => {
    return defact.ofacts.reduce((total, ofact) => total + ofact.afacts.length, 0);
  };

  return (
    <div className="w-full overflow-auto rounded-lg">
      <table className="w-full">
        <thead className="border-b border-white/10 text-sm leading-6 text-white">
          <tr>
            <th className="p-2 w-8"></th>
            <th className="p-2 text-left">Symbol</th>
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Balance</th>
            <th className="p-2 text-left">Total Earnings</th>
            <th className="p-2 text-left">Facts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {defacts.map((defact) => (
            <React.Fragment key={defact.id}>
              {/* DEFact Row */}
              <tr className="group hover:bg-gray-800/30 border-b border-white/10">
                <td className="p-2 text-center cursor-pointer" onClick={() => toggleExpandedDefact(defact.id)}>
                  {expandedDefacts[defact.id] ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </td>
                <td className="p-2">
                  <div className="w-24 rounded-md bg-indigo-100/5 py-1 text-center text-sm font-semibold leading-6 text-gray-400 ring-1 ring-inset ring-white/10 transition duration-200 ease-in-out group-hover:ring-white/30 group-hover:text-white">
                    {defact.symbol}
                  </div>
                </td>
                <td className="p-2 text-gray-400 group-hover:text-white">
                  {defact.name}
                </td>
                <td className="p-2 text-gray-400 group-hover:text-white">
                  {formatCurrency(defact.totalBalance)}
                </td>
                <td className="p-2 text-green-400">
                  {formatCurrency(defact.totalEarnings)}
                </td>
                <td className="p-2 text-gray-400 group-hover:text-white">
                  {getTotalAFactsCount(defact)} facts
                </td>
              </tr>
              
              {/* OFact Rows (expanded) */}
              {expandedDefacts[defact.id] && defact.ofacts.map((ofact) => (
                <React.Fragment key={ofact.id}>
                  <tr className="bg-gray-800/20 border-b border-white/10 hover:bg-gray-800/30">
                    <td className="p-2 text-center cursor-pointer" onClick={() => toggleExpandedOfact(ofact.id)}>
                      {expandedOfacts[ofact.id] ? (
                        <ChevronDown className="h-3 w-3 ml-4" />
                      ) : (
                        <ChevronRight className="h-3 w-3 ml-4" />
                      )}
                    </td>
                    <td className="p-2">
                      <div className="flex items-center">
                        <div className="w-6 h-6 flex-shrink-0 mr-2">
                          <img 
                            src="https://z325ctfzpasszfceuep3x4mv33dncyszsb2gcbg67rjljiguchba.arweave.net/zvXRTLl4JSyURKEfu_GV3sbRYlmQdGEE3vxStKDUEcI"
                            alt="OFACT"
                            className="w-full h-full"
                          />
                        </div>
                        <span className="text-xs text-gray-400">OFACT</span>
                      </div>
                    </td>
                    <td className="p-2 text-xs text-gray-400" colSpan={4}>
                      <div className="flex items-center gap-2">
                        <span>{ofact.content}</span>
                        <span className="text-gray-500">({formatDate(ofact.createdDate)})</span>
                        <a 
                          href={ofact.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 ml-2"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <span className="ml-2 text-blue-400">{ofact.afacts.length} extracted facts</span>
                      </div>
                    </td>
                  </tr>
                  
                  {/* AFact Rows (when OFact is expanded) */}
                  {expandedOfacts[ofact.id] && ofact.afacts.map((afact) => (
                    <tr 
                      key={afact.id}
                      className="bg-gray-800/40 border-b border-white/10 hover:bg-gray-800/60 cursor-pointer"
                      onClick={() => handleAFactClick(afact)}
                    >
                      <td className="p-2"></td>
                      <td className="p-2">
                        <div className="flex items-center ml-6">
                          <div className="w-6 h-6 flex-shrink-0 mr-2">
                            <img 
                              src="https://w6hav65sf2mc3do4yxsgex3rfupnngahqfibv7lphwvgisf7cfua.arweave.net/t44K-7IumC2N3MXkYl9xLR7WmAeBUBr9bz2qZEi_EWg"
                              alt="AFACT"
                              className="w-full h-full"
                            />
                          </div>
                          <span className="text-xs text-gray-400">AFACT</span>
                        </div>
                      </td>
                      <td className="p-2 text-xs text-gray-300">
                        <div className="line-clamp-2">{afact.fact}</div>
                      </td>
                      <td className="p-2 text-xs text-gray-500">
                        {formatDate(afact.extractedDate)}
                      </td>
                      <td className="p-2 text-xs text-green-400">
                        <div className="flex items-center gap-1">
                          <Coins className="h-3 w-3" />
                          {formatCurrency(afact.earnings)}
                        </div>
                      </td>
                      <td className="p-2 text-xs text-blue-400">
                        View Details
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      
      {/* AFact Details Modal */}
      {selectedAFact && (
        <AFactDetails 
          afact={selectedAFact} 
          onClose={() => setSelectedAFact(null)} 
        />
      )}
    </div>
  );
};

export default DEFactTable;