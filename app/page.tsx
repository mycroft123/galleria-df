'use client';

import { Hero } from "@/app/components";
import { useEffect, useState } from "react";

const Home = () => {
  const [isClient, setIsClient] = useState(false);

  // This ensures that any API calls within Hero only happen client-side
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <main className="flex h-screen items-center justify-center bg-radial-gradient p-4 md:p-10">
      <div className="flex w-full flex-col items-center justify-center rounded-lg text-center">
        {isClient ? (
          <Hero />
        ) : (
          <div className="animate-pulse text-2xl text-white">Loading...</div>
        )}
      </div>
    </main>
  );
};

export default Home;