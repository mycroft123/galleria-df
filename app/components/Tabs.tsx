"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

interface TabsProps {
  searchParams: { view: string };
  walletAddress: string;
}

const Tabs = ({ searchParams, walletAddress }: TabsProps) => {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center">
      <nav className="flex w-full flex-col md:flex-row">
        <Link
          href={`/portfolio/${walletAddress}?view=tokens`}
          className={`block flex-1 rounded bg-black bg-opacity-50 px-4 py-2 text-center font-bold hover:bg-neutral-500 hover:bg-opacity-50 md:inline-flex md:justify-center ${
            searchParams.view === "tokens"
              ? "  border-b-4 border-primary text-primary"
              : "text-white"
          } mb-2 md:mb-0 md:mr-4`}
        >
          Tokens
        </Link>
        <Link
          href={`/portfolio/${walletAddress}?view=nfts`}
          className={`block flex-1 rounded bg-black bg-opacity-50 px-4 py-2 text-center font-bold hover:bg-neutral-500 hover:bg-opacity-50 md:inline-flex md:justify-center ${
            searchParams.view === "nfts"
              ? "  border-b-4 border-primary text-primary"
              : "text-white"
          } mb-2 md:mb-0 md:ml-4`}
        >
          NFTs
        </Link>
      </nav>
    </div>
  );
};

export default Tabs;
