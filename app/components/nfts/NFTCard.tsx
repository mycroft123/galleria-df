"use client";

import React, { useState } from "react";
import { NonFungibleToken } from "@/app/types";

interface NFTCardProps {
  walletAddress: string;
  nftData: NonFungibleToken;
  searchParams: string;
}

const NFTCard = ({ walletAddress, nftData, searchParams }: NFTCardProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const imageSrc = nftData.content.links.image;
  const title = nftData.content.metadata.name;
  const symbol = nftData.content.metadata?.symbol || "";
  const description = nftData.content.metadata?.description || "No description available";
  const mint = nftData.id;

  const handleImageLoaded = () => setIsLoaded(true);
  const handleImageError = () => setIsLoaded(false);

  const truncateDescription = (text: string, minLength: number = 30) => {
    if (text.length <= minLength) return text;
    let truncated = text.substr(0, Math.max(minLength, text.substr(0, 60).lastIndexOf(' ')));
    return truncated + '...';
  };

  return (
    <div className="group w-[150px] rounded-lg bg-gray-800/10 bg-opacity-20 p-1.5 ring-1 ring-white/10 transition duration-200 ease-in-out hover:bg-gray-800/20 hover:ring-white/30">
      <a href={`/portfolio/${walletAddress}?${searchParams}&details=${mint}`}>
        <div className="rounded-lg p-1 flex flex-col justify-between">
          <div className="flex-grow">
            {/* Added flex centering to image container */}
            <div className="h-20 overflow-hidden rounded-lg flex items-center justify-center bg-black/20">
              {!isLoaded && (
                <div className="skeleton-seconda skeleton h-full w-full"></div>
              )}
              <img
                src={imageSrc}
                alt={title}
                className={`h-[100px] w-[100px] rounded-xl object-cover ${
                  !isLoaded ? "hidden" : ""
                }`}
                onLoad={handleImageLoaded}
                onError={handleImageError}
              />
            </div>
            
            <div className="mt-2 flex flex-col space-y-1.5">
              <h2 className="w-full truncate rounded-lg bg-indigo-100/5 py-1 px-2 text-center text-sm font-medium leading-5 text-white ring-1 ring-inset ring-white/10 transition duration-200 ease-in-out group-hover:ring-white/30">
                {title}
              </h2>
              
              {symbol && (
                <div className="text-xs text-gray-300 px-1 font-medium">
                  {symbol}
                </div>
              )}
              
              <div className="text-xs text-gray-400 px-1 line-clamp-3 leading-tight">
                {truncateDescription(description)}
              </div>
            </div>
          </div>
        </div>
      </a>
    </div>
  );
};

export default NFTCard;