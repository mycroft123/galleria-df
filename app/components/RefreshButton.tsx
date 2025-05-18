"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

const RefreshButton = () => {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      router.refresh();
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="inline-flex items-center gap-2 rounded-lg bg-indigo-100/5 px-3 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-white/10 transition-all hover:bg-indigo-100/10 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <RefreshCw 
        className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} 
      />
      Refresh
    </button>
  );
};

export default RefreshButton;