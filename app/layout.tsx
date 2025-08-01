import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ToastContainer } from "react-toastify";
import { SpeedInsights } from "@vercel/speed-insights/next";
import StoreProvider from "@/app/providers/StoreProvider";

import "./globals.css";
import "react-toastify/dist/ReactToastify.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DeFacts",
  description: "A portfolio viewer from DeFacts Labs",
  // icons: {
  //   icon: '/icon.png',
  //   shortcut: '/favicon.ico',
  //   apple: '/icon.png',
  // },
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body className={`${inter.className}`}>
        <StoreProvider>
          {children}
          <ToastContainer
            position="bottom-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnFocusLoss={false}
            draggable
            pauseOnHover={false}
          />
          <Analytics />
          <SpeedInsights />
        </StoreProvider>
      </body>
    </html>
  );
};

export default RootLayout;