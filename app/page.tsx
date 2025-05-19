'use client';

import { useState, useEffect } from "react";
import { Hero } from "@/app/components";

// Remove these exports as they're not compatible with client components
// export const dynamic = 'force-dynamic';
// export const revalidate = 0;

const Home = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <main className="flex h-screen items-center justify-center bg-radial-gradient p-4 md:p-10">
      <div className="flex w-full flex-col items-center justify-center rounded-lg text-center">
        {isClient ? (
          <Hero />
        ) : (
          <div className="animate-pulse text-white text-2xl">Loading...</div>
        )}
      </div>
    </main>
  );
};

export default Home;