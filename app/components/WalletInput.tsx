"use client";

import React, { useState, useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { Button } from "@/app/components";

const WalletInput = ({ source }: { source: string }) => {
  const DEFAULT_WALLET = "ExK2ZcWx6tpVe5xfqkHZ62bMQNpStLj98z2WDUWKUKGp";
  const [inputValue, setInputValue] = useState<string>(DEFAULT_WALLET);
  const [isValid, setIsValid] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  let id = useId();
  const router = useRouter();
  const searchParams = useSearchParams();

  const validateSolanaPublicKey = async (address: string): Promise<string | null> => {
    let publicKey;
    if (typeof window !== "undefined") {
      const url = window.location.href;
      const addressRegex = /portfolio\/([^\/?]+)/;
      const match = url.match(addressRegex);
      publicKey = match ? match[1] : null;

      console.log(publicKey);
    } else {
      console.warn(
        "Window is undefined. This code may not work as expected during server-side rendering.",
      );
    }

    if (publicKey && publicKey === address) {
      setIsLoading(false);
      return publicKey;  // Return the public key instead of clearing input
    }

    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
      return address;
    }
    else {
      const response = await fetch(
        `https://sns-sdk-proxy.bonfida.workers.dev/resolve/${address?.toLowerCase()}`,
      );
      const data = await response.json();
      if (data.s == "ok") {
        return data.result;
      }
      return null;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const resolvedAddr = await validateSolanaPublicKey(inputValue);

    if (!resolvedAddr) {
      toast.error("Something went wrong");
      setInputValue(DEFAULT_WALLET);  // Reset to default wallet instead of empty string
      setIsLoading(false);
      return;
    }

    setIsValid(true);
    const currentView = searchParams.get("view") || "chat";

    try {
      await router.push(
        `/portfolio/${encodeURIComponent(resolvedAddr)}?view=${currentView}`,
      );
    } catch (error) {
      console.log("Error", error);
      toast.error("Something went wrong");
    }
    setIsLoading(false);
  };

  // Initialize the route with the default wallet if no wallet is currently set
  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = window.location.href;
      const addressRegex = /portfolio\/([^\/?]+)/;
      const match = url.match(addressRegex);
      
      if (!match) {
        const currentView = searchParams.get("view") || "chat";
        router.push(`/portfolio/${DEFAULT_WALLET}?view=${currentView}`);
      }
    }
  }, []);

  return (
    <form
      onSubmit={handleSubmit}
      className="relative isolate flex h-11 w-[300px] items-center pr-1.5 md:w-[450px]"
    >
      <label htmlFor={id} className="sr-only">
        DeFacts Wallet Address
      </label>
      <input
        required
        type="walletAddress"
        autoComplete="walletAddress"
        name="walletAddress"
        id={id}
        placeholder="DeFacts Wallet Address"
        className="peer w-0 flex-auto bg-transparent px-4 py-2.5 text-base text-white placeholder:text-gray-400 focus:outline-none sm:text-[0.8125rem]/6"
        value={inputValue}
        onChange={handleInputChange}
      />
      <Button type="submit" isLoading={isLoading} disabled={!isValid} arrow />
      <div className="absolute inset-0 -z-10 rounded-full ring-offset-0 transition duration-200 ease-in-out peer-focus:ring-1 peer-focus:ring-primary" />
      <div className="bg-white/2.5 absolute inset-0 -z-10 rounded-full ring-1 ring-white/50" />
    </form>
  );
};

export default WalletInput;