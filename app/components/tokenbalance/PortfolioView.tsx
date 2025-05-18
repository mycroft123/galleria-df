
'use client';

import React, { useState, useEffect } from 'react';
import { TokenDashboard } from '@/app/components/tokenbalance';

interface PortfolioViewProps {
  walletAddress: string;
  searchParams?: string;
}

const PortfolioView: React.FC<PortfolioViewProps> = ({ walletAddress, searchParams }) => {
  return (
    <div className="w-full">
      <TokenDashboard walletAddress={walletAddress} />
    </div>
  );
};

export default PortfolioView;