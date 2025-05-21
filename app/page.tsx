'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// Import your custom auth hook - update this import path to match your actual hook
import { useAuth } from '@/app/hooks/useAuth'; 

export default function Home() {
  const router = useRouter();
  // Replace with your actual auth check mechanism
  const { isLoggedIn, walletAddress, isLoading: authLoading } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(true);
  
  useEffect(() => {
    // Only proceed if auth check is complete
    if (!authLoading) {
      if (!isLoggedIn) {
        // User is not logged in - redirect to the default portfolio
        router.push('/portfolio/ExK2ZcWx6tpVe5xfqkHZ62bMQNpStLj98z2WDUWKUKGp?view=chat');
      } else {
        // User is logged in - redirect to their own portfolio
        router.push(`/portfolio/${walletAddress}?view=portfolio`);
      }
      setIsRedirecting(false);
    }
  }, [isLoggedIn, walletAddress, authLoading, router]);
  
  // Loading state text depends on current status
  const loadingText = authLoading 
    ? "Checking account status..." 
    : isRedirecting 
      ? "Redirecting..." 
      : "Loading...";
  
  return (
    <main className="flex h-screen items-center justify-center bg-radial-gradient p-4 md:p-10">
      <div className="flex w-full flex-col items-center justify-center rounded-lg text-center">
        <div className="animate-pulse text-white text-2xl">{loadingText}</div>
      </div>
    </main>
  );
}