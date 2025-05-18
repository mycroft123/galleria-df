'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';

interface RevenueGaugeProps {
  walletAddress: string;
}

interface RevenueDataPoint {
  date: string;
  value: number;
}

const RevenueGauge: React.FC<RevenueGaugeProps> = ({ walletAddress }) => {
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [currentRevenue, setCurrentRevenue] = useState(0);
  const [revenueChange, setRevenueChange] = useState(0);
  const [projectedRevenue, setProjectedRevenue] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  
  // Fetch revenue data
  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock revenue data for the past 30 days with a clear upward trend
      const today = new Date();
      const mockData: RevenueDataPoint[] = [];
      let runningTotal = 0;
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Generate upward trending revenue
        // Base value increases significantly as we approach the present day
        const dayIndex = 30 - i; // 1 to 30
        
        // Create a strong upward curve - exponential growth
        const growthFactor = 1.15; // Each day is about 15% more than previous on average
        const baseValue = 2 * Math.pow(growthFactor, dayIndex / 6); // Exponential growth
        
        // Add some randomness but maintain the clear upward trend
        const randomFactor = (Math.random() * 0.3 - 0.1) * baseValue; // Random between -10% and +20%
        const dayValue = Math.max(0.5, baseValue + randomFactor); // Ensure at least 0.5 minimum
        
        runningTotal += dayValue;
        
        mockData.push({
          date: date.toISOString().split('T')[0], // YYYY-MM-DD format
          value: dayValue
        });
      }
      
      setRevenueData(mockData);
      
      // Calculate current day's revenue (last item in the array)
      const currentDayRevenue = mockData[mockData.length - 1].value;
      setCurrentRevenue(currentDayRevenue);
      
      // Calculate revenue change (compare to previous day)
      const previousDayRevenue = mockData[mockData.length - 2].value;
      const changePercent = ((currentDayRevenue - previousDayRevenue) / previousDayRevenue) * 100;
      setRevenueChange(changePercent);
      
      // Calculate projected revenue (simple projection based on recent trend)
      // Use exponential growth for projection to show continued strong growth
      const last7Days = mockData.slice(-7);
      const last3Days = mockData.slice(-3); 
      
      // Calculate growth rate based on recent days (more heavily weighted to most recent)
      const recentAvgDaily = last3Days.reduce((sum, day) => sum + day.value, 0) / 3;
      const projectedMonthly = recentAvgDaily * 30 * 1.2; // 20% additional growth projected
      
      setProjectedRevenue(projectedMonthly);
      
      // Set total earnings
      setTotalEarnings(runningTotal);
      
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Initial data fetch
  useEffect(() => {
    fetchRevenueData();
  }, [walletAddress]);

  // Find the max value for scaling the chart
  const maxValue = Math.max(...revenueData.map(d => d.value)) * 1.1; // 10% padding

  if (loading) {
    return (
      <div className="bg-gray-800/50 p-6 rounded-lg ring-1 ring-white/10 flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 p-6 rounded-lg ring-1 ring-white/10">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Revenue Timeline</h3>
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-400">30-day view</span>
        </div>
      </div>
      
      {/* Revenue Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800/80 p-3 rounded-lg">
          <div className="text-sm text-gray-400">Today&apos;s Revenue</div>
          <div className="text-xl font-semibold">{formatCurrency(currentRevenue)}</div>
          <div className={`flex items-center text-xs mt-1 ${revenueChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {revenueChange >= 0 ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {Math.abs(revenueChange).toFixed(1)}% from yesterday
          </div>
        </div>
        
        <div className="bg-gray-800/80 p-3 rounded-lg">
          <div className="text-sm text-gray-400">Projected Monthly</div>
          <div className="text-xl font-semibold">{formatCurrency(projectedRevenue)}</div>
          <div className="text-xs text-green-400 mt-1 flex items-center">
            <TrendingUp className="h-3 w-3 mr-1" />
            ~35% increase expected
          </div>
        </div>
        
        <div className="bg-gray-800/80 p-3 rounded-lg">
          <div className="text-sm text-gray-400">Total Earnings</div>
          <div className="text-xl font-semibold">{formatCurrency(totalEarnings)}</div>
          <div className="text-xs text-gray-500 mt-1">Last 30 days</div>
        </div>
      </div>
      
      {/* Revenue Timeline */}
      <div className="h-40 relative">
        {/* Add growth trendline */}
        <div className="absolute inset-0 flex items-end pointer-events-none z-10">
          <svg className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="trendGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(59, 130, 246, 0.2)" />
                <stop offset="100%" stopColor="rgba(59, 130, 246, 0.7)" />
              </linearGradient>
            </defs>
            <path 
              d={`M 0,${40 * 0.9} ${revenueData.map((point, index) => {
                const x = (index / (revenueData.length - 1)) * 100 + '%';
                const y = 40 * (1 - (point.value / maxValue) * 0.9);
                return `L ${x},${y}`;
              }).join(' ')}`}
              fill="none"
              stroke="url(#trendGradient)"
              strokeWidth="2"
              strokeDasharray="5,3"
              className="opacity-70"
            />
          </svg>
        </div>
        
        {/* Create the timeline visualization */}
        <div className="absolute inset-0 flex items-end">
          {revenueData.map((point, index) => {
            const barHeight = (point.value / maxValue) * 100;
            const isToday = index === revenueData.length - 1;
            
            // Generate color gradient based on position to show growth
            const colorIntensity = Math.min(100, (index / revenueData.length) * 150);
            const barColor = isToday 
              ? 'bg-blue-500' 
              : index >= revenueData.length - 7 
                ? `bg-green-500 bg-opacity-${Math.round(70 + colorIntensity/5)}` 
                : `bg-blue-${Math.round(400 + colorIntensity)} bg-opacity-${Math.round(50 + colorIntensity/3)}`;
            
            return (
              <div 
                key={point.date} 
                className="flex-1 flex flex-col items-center group"
              >
                <div 
                  className={`w-full max-w-[8px] mx-auto rounded-t transition-all duration-300 ${
                    isToday 
                      ? 'bg-blue-500' 
                      : index >= revenueData.length - 7 
                        ? 'bg-green-500 bg-opacity-80' 
                        : 'bg-blue-400 bg-opacity-60'
                  }`}
                  style={{ 
                    height: `${barHeight}%`,
                    background: isToday 
                      ? '#3b82f6' // blue
                      : `rgba(${50 + (index * 7)}, ${150 + (index * 3)}, ${100 + index}, ${0.5 + (index/revenueData.length) * 0.5})`
                  }}
                ></div>
                
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 bg-gray-900 text-white text-xs rounded p-2 pointer-events-none transition-opacity whitespace-nowrap z-20">
                  <div>{new Date(point.date).toLocaleDateString()}</div>
                  <div className="font-semibold">{formatCurrency(point.value)}</div>
                </div>
                
                {/* X-axis label - show for every 5th day */}
                {(index % 5 === 0 || isToday) && (
                  <div className="text-[9px] text-gray-400 mt-1 rotate-45 origin-top-left">
                    {new Date(point.date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Horizontal grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="w-full h-px bg-gray-700 bg-opacity-40"></div>
          ))}
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-700/50 text-xs text-gray-500 flex justify-between">
        <span>Updated just now</span>
        <button 
          onClick={fetchRevenueData}
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default RevenueGauge;