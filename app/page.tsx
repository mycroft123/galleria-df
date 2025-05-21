// app/page.tsx
import { redirect } from 'next/navigation';

export default function Home() {
  // Server-side redirect using Next.js redirect function
  // This happens on the server before any client-side rendering
  redirect('/portfolio/ExK2ZcWx6tpVe5xfqkHZ62bMQNpStLj98z2WDUWKUKGp?view=chat');
  
  // This part won't be rendered due to the redirect, but is included as a fallback
  return (
    <main className="flex h-screen items-center justify-center bg-radial-gradient p-4 md:p-10">
      <div className="flex w-full flex-col items-center justify-center rounded-lg text-center">
        <div className="animate-pulse text-white text-2xl">Loading...</div>
      </div>
    </main>
  );
}