'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WalletProvider, useWallet } from '@/app/providers/WalletProvider';

// This component will handle the redirect logic after checking wallet status
const RedirectHandler = () => {
  const router = useRouter();
  const { isConnected, publicKey, isLoading } = useWallet();
  
  useEffect(() => {
    // Only redirect once wallet state is loaded (no longer loading)
    if (!isLoading) {
      if (isConnected && publicKey) {
        // User is logged in - redirect to their portfolio
        router.push(`/portfolio/${publicKey}?view=portfolio`);
      } else {
        // User is not logged in - redirect to default portfolio
        router.push('/portfolio/ExK2ZcWx6tpVe5xfqkHZ62bMQNpStLj98z2WDUWKUKGp?view=chat');
      }
    }
  }, [isConnected, publicKey, isLoading, router]);
  
  return (
    <main className="flex h-screen items-center justify-center bg-radial-gradient p-4 md:p-10">
      <div className="flex w-full flex-col items-center justify-center rounded-lg text-center">
        <div className="animate-pulse text-white text-2xl">
          {isLoading ? "Checking wallet status..." : "Redirecting..."}
        </div>
      </div>
    </main>
  );
};

// Main component that wraps the redirect handler with the wallet provider
export default function Home() {
  return (
    <WalletProvider>
      <RedirectHandler />
    </WalletProvider>
  );
}