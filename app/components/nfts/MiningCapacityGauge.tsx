'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Activity, Cpu, Gauge, Server } from 'lucide-react';

// Mining capacity constants
const MAX_MINING_CAPACITY = 100; // Maximum capacity value

interface MiningGaugeProps {
  capacity: number;
  remainingCapacity: number;
  loading: boolean;
  style: 'vertical' | 'circular';
}

const MiningCapacityGauge: React.FC<MiningGaugeProps> = ({ 
  capacity, 
  remainingCapacity, 
  loading,
  style
}) => {
  // Get color based on capacity level
  const getCapacityColor = () => {
    if (capacity >= 80) return "bg-green-500";
    if (capacity >= 60) return "bg-green-400";
    if (capacity >= 40) return "bg-yellow-400";
    if (capacity >= 20) return "bg-orange-500";
    return "bg-red-500";
  };
  
  const getCapacityTextColor = () => {
    if (capacity >= 80) return "text-green-500";
    if (capacity >= 60) return "text-green-400";
    if (capacity >= 40) return "text-yellow-400";
    if (capacity >= 20) return "text-orange-500";
    return "text-red-500";
  };
  
  const getCapacityStatus = () => {
    if (capacity >= 80) return "Optimal";
    if (capacity >= 60) return "Good";
    if (capacity >= 40) return "Moderate";
    if (capacity >= 20) return "Low";
    return "Critical";
  };

  // For circular gauge - calculate the stroke dash offset
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (capacity / 100) * circumference;
  
  if (style === 'vertical') {
    return (
      <div className="bg-gray-800/50 p-4 rounded-lg ring-1 ring-white/10 h-full">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium text-gray-400">Mining Capacity</h3>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : (
            <div className="flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
              <span className="text-sm font-medium text-gray-400">
                {Math.round(remainingCapacity)} units available
              </span>
            </div>
          )}
        </div>
        
        <div className="flex h-40 items-center gap-6">
          {/* Vertical Gauge */}
          <div className="relative h-full w-8 bg-gray-700 rounded-full overflow-hidden flex justify-center">
            <div 
              className={`w-full ${getCapacityColor()} transition-all duration-700 ease-out absolute bottom-0 rounded-b-full`}
              style={{ height: `${capacity}%` }}
            >
              {/* Pulse effect at the top of the filled area */}
              <div className="absolute -top-1 left-0 right-0 h-1 bg-white/50 animate-pulse"></div>
            </div>
            
            {/* Gauge markings */}
            <div className="absolute inset-0 flex flex-col justify-between p-1.5 pointer-events-none">
              <div className="w-full border-t border-white/20 h-0 relative">
                <span className="absolute -top-1.5 -right-6 text-xs text-gray-400">100%</span>
              </div>
              <div className="w-full border-t border-white/20 h-0 relative">
                <span className="absolute -top-1.5 -right-6 text-xs text-gray-400">75%</span>
              </div>
              <div className="w-full border-t border-white/20 h-0 relative">
                <span className="absolute -top-1.5 -right-6 text-xs text-gray-400">50%</span>
              </div>
              <div className="w-full border-t border-white/20 h-0 relative">
                <span className="absolute -top-1.5 -right-6 text-xs text-gray-400">25%</span>
              </div>
              <div className="w-full border-t border-white/20 h-0 relative">
                <span className="absolute -top-1.5 -right-6 text-xs text-gray-400">0%</span>
              </div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex flex-col justify-between h-full py-1">
            <div>
              <div className={`text-2xl font-semibold ${getCapacityTextColor()}`}>
                {capacity.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400">Capacity Used</div>
              <div className="mt-1 text-xs text-gray-300">
                Status: <span className={getCapacityTextColor()}>{getCapacityStatus()}</span>
              </div>
            </div>
            
            {/* System Indicators */}
            <div className="space-y-1">
              <div className="flex items-center text-xs">
                <Cpu className="h-3 w-3 mr-1.5 text-blue-400" />
                <span className="text-gray-400">Hash Rate: </span>
                <span className="ml-1 text-gray-300">142 MH/s</span>
              </div>
              <div className="flex items-center text-xs">
                <Server className="h-3 w-3 mr-1.5 text-purple-400" />
                <span className="text-gray-400">Nodes: </span>
                <span className="ml-1 text-gray-300">12 active</span>
              </div>
              <div className="flex items-center text-xs">
                <Activity className="h-3 w-3 mr-1.5 text-amber-400" />
                <span className="text-gray-400">Network: </span>
                <span className="ml-1 text-gray-300">stable</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Circular gauge
  return (
    <div className="bg-gray-800/50 p-4 rounded-lg ring-1 ring-white/10 h-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-gray-400">Mining Capacity</h3>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        ) : (
          <div className="flex items-center">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
            <span className="text-sm font-medium text-gray-400">
              {Math.round(remainingCapacity)} units available
            </span>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        {/* Circular Gauge */}
        <div className="relative">
          <svg width="140" height="140" className="transform -rotate-90">
            {/* Background circle */}
            <circle 
              cx="70" 
              cy="70" 
              r={radius} 
              stroke="rgba(255,255,255,0.1)" 
              strokeWidth="10" 
              fill="none" 
            />
            {/* Progress circle */}
            <circle 
              cx="70" 
              cy="70" 
              r={radius} 
              stroke={getCapacityColor().replace('bg-', 'text-')} 
              strokeWidth="10" 
              fill="none" 
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-700 ease-out"
            />
            
            {/* Animated point on the progress circle */}
            <circle 
              cx={70 + radius * Math.cos(((capacity / 100) * 360 - 90) * (Math.PI / 180))}
              cy={70 + radius * Math.sin(((capacity / 100) * 360 - 90) * (Math.PI / 180))}
              r="3" 
              fill="white"
              className="animate-pulse"
            />
          </svg>
          
          {/* Digital display in center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-3xl font-bold ${getCapacityTextColor()} font-mono tracking-tight`}>
              {capacity.toFixed(1)}
            </div>
            <div className="text-xs text-gray-400">CAPACITY</div>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex flex-col justify-between py-1 ml-3 h-32">
          <div className="text-sm text-gray-300 mb-2 border-b border-gray-700 pb-2">
            Status: <span className={getCapacityTextColor()}>{getCapacityStatus()}</span>
          </div>
          
          {/* System Indicators with digital blinking effect */}
          <div className="space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping mr-1.5 opacity-75"></span>
                <span className="text-gray-400">HASH</span>
              </div>
              <span className="text-blue-400">142 MH/s</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse mr-1.5"></span>
                <span className="text-gray-400">NODES</span>
              </div>
              <span className="text-purple-400">12</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" 
                  style={{ animationDuration: "1.5s", animationIterationCount: "infinite", animationName: "ping", animationTimingFunction: "ease-in-out" }}></span>
                <span className="text-gray-400">LOAD</span>
              </div>
              <span className="text-amber-400">68%</span>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 pt-2 border-t border-gray-700/50">
            Last updated: <span className="text-gray-400">just now</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiningCapacityGauge;