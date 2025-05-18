"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NonFungibleToken } from "@/app/types";

interface NFTDetails {
  searchParams: string;
  walletAddress: string;
  nftData: NonFungibleToken[];
  onClose?: () => void;
}

const NFTDetails = ({ searchParams, walletAddress, nftData, onClose }: NFTDetails) => {
  const router = useRouter();
  
  // Prevent click events from bubbling up and closing the modal
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  // Early return if no data
  if (!nftData?.length || !nftData[0]) {
    return null;
  }

  // Safely extract all the data with fallbacks
  const nft = nftData[0];
  const imageSrc = nft?.content?.links?.image || "/noImg.svg";
  const title = nft?.content?.metadata?.name || "Unnamed NFT";
  const description = nft?.content?.metadata?.description || "No description available";
  const mint = nft?.id || "Unknown";
  const ownerAddress = nft?.ownership?.owner || "Unknown";
  const royaltyPercentage = nft?.royalty?.percent || 0;

  const nftDetails = [
    { type: "Mint", value: mint },
    { type: "Owner", value: ownerAddress },
    { type: "Royalty", value: royaltyPercentage },
  ];

  const LinkIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="ml-1 w-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
      />
    </svg>
  );

  const renderLinkWithAddress = (value: string, accountType: 'account' | 'token' = 'account') => (
    <a
      href={`https://xray.helius.xyz/${accountType}/${value}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center text-primary transition-colors duration-200 ease-in-out hover:text-white"
    >
      {`${value.toString().slice(0, 3)}...${value.toString().slice(-4)}`}
      <LinkIcon />
    </a>
  );

  const DataCard = ({ title, value, isLink = false, accountType = 'account' }: { 
    title: string; 
    value: any; 
    isLink?: boolean;
    accountType?: 'account' | 'token';
  }) => (
    <div className="col-span-1 w-full overflow-hidden rounded-lg bg-gray-700/20 p-4 shadow ring-1 ring-inset ring-white/30">
      <dt className="truncate text-sm font-semibold text-gray-300">
        {title}
      </dt>
      <dd className="font-base mt-2 text-xl tracking-tight text-white overflow-x-scroll">
        {value !== (null || undefined) ? (
          isLink ? renderLinkWithAddress(value, accountType) : value.toString()
        ) : 'N/A'}
      </dd>
    </div>
  );

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleClose}
    >
      <div 
        className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-black/90 p-2 text-white shadow-xl backdrop-blur-md sm:p-2"
        onClick={handleContentClick}
      >
        <div className="relative">
          <button
            onClick={handleClose}
            className="absolute right-2 top-2 rounded-lg p-2 hover:bg-gray-800/50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="h-8 w-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <h1 className="m-2 p-3 text-3xl font-bold">{title}</h1>
        </div>

        <div>
          <div className="mx-4 flex flex-col justify-evenly gap-x-4 break-words sm:flex-row">
            <div className="w-full sm:w-1/2">
              <Suspense fallback={<div>Loading...</div>} key={searchParams}>
                <a href={imageSrc} target="_blank" rel="noopener noreferrer">
                  <img src={imageSrc} alt={title} className="rounded-xl" />
                </a>
              </Suspense>
            </div>
            <div className="w-full sm:w-1/2">
              {description && (
                <div className="mt-10">
                  <p className="mb-4 border-b border-white/50 pb-1 text-2xl font-bold">
                    Description:
                  </p>
                  <p className="text-lg">{description}</p>
                </div>
              )}
              <div className="mt-10 break-words">
                <p className="mb-4 border-b border-white/50 pb-1 text-2xl font-bold">
                  Details:
                </p>

                <ul>
                  {nftDetails.map((detail) => (
                    <li
                      key={detail.type}
                      className="my-1 flex items-center justify-between"
                    >
                      <p className="text-lg font-bold">{detail.type}</p>
                      {detail.type !== "Royalty" ? (
                        <a
                          href={`https://xray.helius.xyz/${
                            detail.type === "Mint" ? "token" : "account"
                          }/${detail.value}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-primary transition-colors duration-200 ease-in-out hover:text-white"
                        >
                          {`${detail.value
                            .toString()
                            .slice(0, 3)}...${detail.value.toString().slice(-4)}`}
                          <LinkIcon />
                        </a>
                      ) : (
                        <span>{detail.value}%</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-full p-3">
              {nft?.creators?.length > 0 && (
                <div className="mt-10">
                  <p className="mb-4 border-b border-white/50 pb-1 text-xl font-bold">
                    Creators:
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {nft.creators.map((creator, creatorIndex) => (
                      <div
                        key={`creator-${creatorIndex}`}
                        className="rounded-lg bg-gray-700/5 px-2 ring-1 ring-inset ring-white/30"
                      >
                        {Object.entries(creator).map(([key, value]) => (
                          <div key={`creator-${creatorIndex}-${key}`}>
                            {value !== null && value !== undefined && (
                              <DataCard
                                title={(typeof value === "string" && "Address") ||
                                  (typeof value === "number" && "Share") ||
                                  (typeof value === "boolean" && "Verified") ||
                                  key}
                                value={value}
                                isLink={typeof value === "string"}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {nft?.content?.metadata?.attributes?.length > 0 && (
                <div className="mt-10">
                  <p className="mb-4 border-b border-white/50 pb-1 text-xl font-bold">
                    Attributes:
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {nft.content.metadata.attributes.map((attr, index) => (
                      <React.Fragment key={`attribute-${index}-${attr.trait_type}`}>
                        {attr.value !== null && attr.value !== undefined && (
                          <div className="col-span-1 w-full overflow-hidden rounded-lg bg-gray-700/20 p-4 shadow ring-1 ring-inset ring-white/30">
                            <dt className="truncate text-sm font-semibold text-gray-300">
                              {attr.trait_type}
                            </dt>
                            <dd className="font-base mt-2 text-xl tracking-tight text-white">
                              {attr.value}
                            </dd>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {nft?.compression?.compressed && (
                <div className="mt-10">
                  <p className="mb-4 border-b border-white/50 pb-1 text-xl font-bold">
                    Compression Details:
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {Object.entries(nft.compression).map(([key, value], index) => (
                      <React.Fragment key={`compression-${key}-${index}`}>
                        {value !== null && value !== undefined && (
                          <div className="col-span-1 w-full overflow-hidden rounded-lg bg-gray-700/20 p-4 shadow ring-1 ring-inset ring-white/30">
                            <dt className="truncate text-sm font-semibold text-gray-300">
                              {key}
                            </dt>
                            <dd className="font-base mt-2 text-xl tracking-tight text-white overflow-x-scroll">
                              {value.toString()}
                            </dd>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {nft?.spl20 && (
                <div className="mt-10">
                  <p className="mb-4 border-b border-white/50 pb-1 text-xl font-bold">
                    SPL20 Details:
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {Object.entries(nft.spl20).map(([key, value], index) => (
                      <React.Fragment key={`spl20-${key}-${index}`}>
                        {value !== null && value !== undefined && (
                          <div className="col-span-1 w-full overflow-hidden rounded-lg bg-gray-700/20 p-4 shadow ring-1 ring-inset ring-white/30">
                            <dt className="truncate text-sm font-semibold text-gray-300">
                              {key}
                            </dt>
                            <dd className="font-base mt-2 text-xl tracking-tight text-white">
                              {value.toString()}
                            </dd>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {nft?.inscription && (
                <div className="mt-10">
                  <p className="mb-4 border-b border-white/50 pb-1 text-xl font-bold">
                    Inscription Details:
                  </p>
                  <hr className="my-2 border-gray-600" />
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {Object.entries(nft.inscription).map(([key, value], index) => (
                      <React.Fragment key={`inscription-${key}-${index}`}>
                        {value !== null && value !== undefined && (
                          <div className="col-span-1 w-full overflow-hidden rounded-lg bg-gray-700/20 p-4 shadow ring-1 ring-inset ring-white/30">
                            <dt className="truncate text-sm font-semibold text-gray-300">
                              {key}
                            </dt>
                            <dd className="font-base mt-2 text-xl tracking-tight text-white">
                              {value !== (null || undefined) ? (
                                key === "authority" ||
                                key === "inscriptionDataAccount" ? (
                                  <a
                                    href={`https://xray.helius.xyz/account/${value}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center text-primary transition-colors duration-200 ease-in-out hover:text-white"
                                  >
                                    {`${value.toString().slice(0, 3)}...${value
                                      .toString()
                                      .slice(-4)}`}
                                    <LinkIcon />
                                  </a>
                                ) : (
                                  <span>{value.toString()}</span>
                                )
                              ) : (
                                'N/A'
                              )}
                            </dd>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTDetails;