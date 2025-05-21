'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the chat view with the specific wallet address
    router.push('/portfolio/ExK2ZcWx6tpVe5xfqkHZ62bMQNpStLj98z2WDUWKUKGp?view=chat');
  }, [router]);
  
  // Show a loading state while the redirect happens
  return (
    <main className="flex h-screen items-center justify-center bg-radial-gradient p-4 md:p-10">
      <div className="flex w-full flex-col items-center justify-center rounded-lg text-center">
        <div className="animate-pulse text-white text-2xl">Loading...</div>
      </div>
    </main>
  );
}