// TokenMetrics.tsx - Update with DEFacts metrics
"use client";

import React, { useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";
import { FungibleToken } from "@/app/types";
import { Coins } from "lucide-react";

ChartJS.register(ArcElement, Tooltip, Legend);

interface TokenMetricsProps {
  fungibleTokens: FungibleToken[];
}

const TokenMetrics = ({ fungibleTokens }: TokenMetricsProps) => {
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalToken22, setTotalToken22] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [totalDEFacts, setTotalDEFacts] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [chartData, setChartData] = useState<{
    labels: string[];
    datasets: { data: number[]; backgroundColor: string[] }[];
  }>({ labels: [], datasets: [] });

  useEffect(() => {
    setTotalTokens(fungibleTokens?.length || 0);
    if (fungibleTokens) {
      // Calculate regular token values
      const data = fungibleTokens.map((token) => {
        const balance = token.token_info.balance / Math.pow(10, token.token_info.decimals);
        return balance * (token.token_info.price_info?.price_per_token || 0.10);
      });
      
      const labels = fungibleTokens.map(
        (token) => token.content.metadata.symbol || token.id || "Unknown Token",
      );
      const backgroundColors = labels.map(
        (_, index) => `hsl(${(index * 35) % 360}, 70%, 50%)`,
      );

      setChartData({
        labels,
        datasets: [
          {
            data,
            backgroundColor: backgroundColors,
          },
        ],
      });

      const total = fungibleTokens.reduce((acc, token) => {
        const balance = token.token_info.balance / Math.pow(10, token.token_info.decimals);
        return acc + (balance * (token.token_info.price_info?.price_per_token || 0.10));
      }, 0);
      
      setTotalValue(total);

      const totalToken22 = fungibleTokens.filter(
        (token) => token.mint_extensions !== undefined,
      ).length;
      setTotalToken22(totalToken22);
      
      // Simulate DEFacts data for now
      // In a real implementation, this would come from your API
      const defactsCount = 2; // Simulated value
      const defactsEarnings = 535.80; // Simulated value
      
      setTotalDEFacts(defactsCount);
      setTotalEarnings(defactsEarnings);
    }
  }, [fungibleTokens]);

  const options = {
    plugins: {
      legend: {
        display: false, // or false
        labels: {
          color: "#fff", // specify the color
          boxWidth: 40, // specify the box width
          padding: 20, // specify the padding
          usePointStyle: true, // true or false
        },
        fullSize: true, // true or false
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = "";

            if (context.parsed !== null) {
              label += `$${context.parsed.toFixed(2)}`; // Adds '$' symbol
            }
            return label;
          },
        },
      },
    },
  };

  if (!fungibleTokens) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="mb-6">
        <dl className="grid grid-cols-1 gap-5 shadow-sm sm:grid-cols-3">
          {/* First column */}
          <div className="grid grid-rows-2 gap-y-5 shadow-sm">
            <div className="overflow-hidden rounded-lg bg-black bg-opacity-60 px-4 py-5 shadow sm:p-6">
              <dt className="truncate text-sm font-medium text-gray-300">
                Total Tokens
              </dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-white">
                {totalTokens}
              </dd>
            </div>

            <div className="overflow-hidden rounded-lg bg-black bg-opacity-60 px-4 py-5 shadow sm:p-6">
              <dt className="truncate text-sm font-medium text-gray-300">
                Token22 Tokens
              </dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-white">
                {totalToken22}
              </dd>
            </div>
          </div>
          
          {/* Second column */}
          <div className="grid grid-rows-2 gap-y-5 shadow-sm">
            <div className="overflow-hidden rounded-lg bg-black bg-opacity-60 px-4 py-5 shadow sm:p-6">
              <dt className="truncate text-sm font-medium text-gray-300">
                Total Value
              </dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-white">
                ${totalValue.toFixed(2)}
              </dd>
            </div>

            <div className="overflow-hidden rounded-lg bg-black bg-opacity-60 px-4 py-5 shadow sm:p-6">
              <dt className="truncate text-sm font-medium text-gray-300">
                DEFacts
              </dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-white">
                {totalDEFacts}
              </dd>
            </div>
          </div>

          {/* Third column */}
          <div className="grid grid-rows-2 gap-y-5 shadow-sm">
            <div className="overflow-hidden rounded-lg bg-black bg-opacity-60 px-4 py-5 shadow sm:p-6">
              <dt className="truncate text-sm font-medium text-gray-300 flex items-center gap-1">
                <Coins className="h-4 w-4" />
                Total Earnings
              </dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-green-400">
                ${totalEarnings.toFixed(2)}
              </dd>
            </div>

            <div className="overflow-hidden rounded-lg bg-black bg-opacity-60 px-4 py-5 shadow sm:p-6">
              <dt className="truncate text-sm font-medium text-gray-300">
                Value Distribution
              </dt>
              <div className="flex h-full w-full items-center justify-center">
                <dd className="mt-1 flex items-center justify-center w-full sm:w-56">
                  <Pie data={chartData} options={options} />
                </dd>
              </div>
            </div>
          </div>
        </dl>
      </div>
    </>
  );
};

export default TokenMetrics;