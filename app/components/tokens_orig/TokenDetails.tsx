'use client';

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Coins, ExternalLink, LinkIcon } from "lucide-react";

import { FungibleToken, MintExtensions } from "@/app/types";

type MintExtensionValue = string | number | boolean | NestedMintExtensionObject;

interface NestedMintExtensionObject {
  [key: string]: MintExtensionValue;
}

interface TokenDetailsProps {
  searchParams: { view: string; details: string };
  walletAddress: string;
  tokenData: FungibleToken[];
}

// Interface for OFact structure
interface OFact {
  id: string;
  content: string;
  sourceUrl: string;
  createdDate: string;
  afacts: AFact[];
}

// Interface for AFact structure
interface AFact {
  id: string;
  fact: string;
  sourceUrl: string;
  extractedDate: string;
  earnings: number;
}

const TokenDetails = ({
  searchParams,
  walletAddress,
  tokenData,
}: TokenDetailsProps) => {
  const [expandedOfacts, setExpandedOfacts] = useState<{ [key: string]: boolean }>({});
  
  const imageSrc = tokenData[0]?.content?.links?.image || "/noImg.svg";
  const title = tokenData[0]?.content?.metadata.name;
  const mint = tokenData[0].id;
  const ownerAddress = tokenData[0].ownership.owner;
  const tokenSymbol = tokenData[0].token_info.symbol || tokenData[0].content.metadata.symbol || tokenData[0].id;
  
  // Check if this is a DEFact token (simulated for now)
  // In a real implementation, this would come from your token data
  const isDEFact = tokenSymbol.includes('DEF') || tokenSymbol.includes('FACT');
  
  // Toggle expanded state for OFacts
  const toggleExpandedOfact = (ofactId: string) => {
    setExpandedOfacts(prev => ({
      ...prev,
      [ofactId]: !prev[ofactId]
    }));
  };
  
  // Simulate DEFact related data
  // In a real implementation, this would come from your API
  const mockOFacts: OFact[] = isDEFact ? [
    {
      id: 'ofact1',
      content: 'Q1 2025 Financial Report',
      sourceUrl: 'https://example.com/finance-report-q1-2025',
      createdDate: new Date('2025-04-15').toISOString(),
      afacts: [
        {
          id: 'afact1-1',
          fact: 'The company reported a 12% increase in quarterly revenue, reaching $3.5 billion.',
          sourceUrl: 'https://example.com/finance-report-q1-2025',
          extractedDate: new Date('2025-04-15T10:30:00').toISOString(),
          earnings: 15.25
        },
        {
          id: 'afact1-2',
          fact: 'Operating margins improved by 2.3 percentage points compared to the same quarter last year.',
          sourceUrl: 'https://example.com/finance-report-q1-2025',
          extractedDate: new Date('2025-04-15T10:35:00').toISOString(),
          earnings: 12.80
        }
      ]
    },
    {
      id: 'ofact2',
      content: 'Annual Shareholders Meeting Summary',
      sourceUrl: 'https://example.com/annual-meeting-2025',
      createdDate: new Date('2025-03-28').toISOString(),
      afacts: [
        {
          id: 'afact2-1',
          fact: 'The board approved a $1.2 billion share buyback program for the fiscal year 2025.',
          sourceUrl: 'https://example.com/annual-meeting-2025',
          extractedDate: new Date('2025-03-28T14:15:00').toISOString(),
          earnings: 18.50
        }
      ]
    }
  ] : [];
  
  // Calculate total DEFact earnings
  const totalEarnings = mockOFacts.reduce((total, ofact) => {
    return total + ofact.afacts.reduce((subtotal, afact) => subtotal + afact.earnings, 0);
  }, 0);

  const renderMintExtensionDetails = (
    mintExtension: MintExtensions,
    indentLevel = 0,
  ) => {
    if (!mintExtension) return null;

    const renderValue = (value: any, key: string, indent: number) => {
      if (typeof value === "object" && value !== null) {
        if (indent === 0) {
          return (
            <div className="w-full border-gray-600">
              <p className="bg-gray-700/20px-3 flex w-40 justify-center rounded-md py-1.5 text-sm font-medium text-gray-300 ring-1 ring-inset ring-white/30">
                {key}
              </p>
              <div className="mt-2 border-l border-dashed border-gray-600">
                {Object.entries(value).map(([innerKey, innerValue]) =>
                  renderValue(innerValue, innerKey, indent + 1),
                )}
              </div>
            </div>
          );
        } else {
          return (
            <div
              className="mt-4 w-full  border-gray-600"
              style={{ paddingLeft: `${indent * 20}px` }}
            >
              <p className="bg-gray-700/20px-3 flex w-40 justify-center rounded-md py-1.5 text-sm font-medium text-gray-300 ring-1 ring-inset ring-white/30">
                {key}
              </p>
              <div className="mt-2 border-l border-dashed border-gray-600">
                {Object.entries(value).map(([innerKey, innerValue]) =>
                  renderValue(innerValue, innerKey, indent + 1),
                )}
              </div>
            </div>
          );
        }
      } else {
        return (
          <p
            className="flex w-full items-center overflow-scroll py-1 leading-7"
            style={{ paddingLeft: `${indent * 20}px` }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="mr-1 h-3 w-3"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
            <span className="font-base text-sm text-gray-400">{key}:</span>
            <span className="ml-1 text-sm font-normal">{` ${value}`}</span>
          </p>
        );
      }
    };

    return Object.entries(mintExtension).map(([key, value]) =>
      renderValue(value, key, indentLevel),
    );
  };

  const tokenDetails = [
    { type: "Mint", value: mint },
    { type: "Owner", value: ownerAddress },
  ];

  // Format date for display
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto overflow-x-clip rounded-xl bg-black/90 p-2 text-white shadow-xl backdrop-blur-md sm:p-2">
      {/* Header */}
      <div className="relative">
        <Link href={`/portfolio/${walletAddress}?view=${searchParams.view}`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="absolute right-0 top-0 h-8 w-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </Link>
        <div className="flex items-center gap-3 m-2 p-3">
          <h1 className="text-3xl font-bold">{title}</h1>
          {isDEFact && (
            <div className="rounded-md bg-green-900/30 px-3 py-1 text-sm text-green-400 flex items-center gap-1">
              <Coins className="h-4 w-4" />
              DEFact
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <section>
        <div className="mx-4 flex flex-col justify-evenly gap-x-4 break-words sm:flex-row">
          <div className="sm:w-1/2">
            <Suspense
              fallback={<div>Loading...</div>}
              key={searchParams.details}
            >
              <a href={imageSrc} target="_blank" rel="noopener noreferrer">
                <img src={imageSrc} alt={title} className={`rounded-xl`} />
              </a>
            </Suspense>
          </div>
          <div className="w-full sm:w-1/2">
            <div className="break-words">
              <p className="mb-4 border-b border-white/50 pb-1 text-2xl font-bold">
                Details
              </p>
              <ul>
                {/* Flex container for each detail item with content justified between */}
                {tokenDetails.map((detail) => (
                  <li
                    key={detail.type}
                    className="my-1 flex items-center justify-between"
                  >
                    <p className="text-lg font-bold">{detail.type}</p>
                    {/* JavaScript slice method to show only the first 3 and last 4 characters of the ownerAddress */}
                    <a
                      href={`https://xray.helius.xyz/${
                        detail.type === "Mint" ? "token" : "account"
                      }/${detail.value}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-primary transition-colors duration-200 ease-in-out hover:text-white"
                    >
                      {`${detail.value.slice(0, 3)}...${detail.value.slice(
                        -4,
                      )}`}
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
                    </a>
                  </li>
                ))}
                
                {/* Show DEFact earnings if this is a DEFact token */}
                {isDEFact && (
                  <li className="my-1 flex items-center justify-between">
                    <p className="text-lg font-bold">Total Earnings</p>
                    <div className="flex items-center text-green-400">
                      <Coins className="h-5 w-5 mr-1" />
                      ${totalEarnings.toFixed(2)}
                    </div>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Token 22 Details */}
        <div className="flex justify-center">
          <div className="mx-4 w-full p-3">
            {tokenData[0].mint_extensions && (
              <div className="my-3 break-words">
                <p className="text-2xl font-bold">Token2022 Extensions</p>
                <hr className="my-2 border-gray-600" />
                {renderMintExtensionDetails(tokenData[0].mint_extensions)}
              </div>
            )}
            
            {/* DEFact Information */}
            {isDEFact && mockOFacts.length > 0 && (
              <div className="my-6 break-words">
                <p className="text-2xl font-bold mb-4">DEFact Information</p>
                <hr className="my-2 border-gray-600" />
                
                {/* OFact and AFact table */}
                <div className="mt-4 rounded-lg bg-gray-800/30 overflow-hidden">
                  <table className="w-full">
                    <thead className="border-b border-white/10 bg-gray-800/50">
                      <tr>
                        <th className="p-3 text-left w-8"></th>
                        <th className="p-3 text-left">Type</th>
                        <th className="p-3 text-left">Content</th>
                        <th className="p-3 text-left">Date</th>
                        <th className="p-3 text-left">Earnings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockOFacts.map((ofact) => (
                        <React.Fragment key={ofact.id}>
                          {/* OFact row */}
                          <tr className="border-b border-white/10 hover:bg-gray-800/30">
                            <td className="p-3 text-center" onClick={(e) => {
                              e.stopPropagation();
                              toggleExpandedOfact(ofact.id);
                            }}>
                              {expandedOfacts[ofact.id] ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center">
                                <div className="w-6 h-6 flex-shrink-0 mr-2">
                                  <img 
                                    src="https://z325ctfzpasszfceuep3x4mv33dncyszsb2gcbg67rjljiguchba.arweave.net/zvXRTLl4JSyURKEfu_GV3sbRYlmQdGEE3vxStKDUEcI"
                                    alt="OFACT"
                                    className="w-full h-full"
                                  />
                                </div>
                                <span>OFACT</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <span>{ofact.content}</span>
                                <a 
                                  href={ofact.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </div>
                            </td>
                            <td className="p-3">
                              {formatDate(ofact.createdDate)}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center text-gray-400">
                                {ofact.afacts.length} facts
                              </div>
                            </td>
                          </tr>

                          {/* AFact rows (when expanded) */}
                          {expandedOfacts[ofact.id] && ofact.afacts.map((afact) => (
                            <tr key={afact.id} className="border-b border-white/10 bg-gray-800/20">
                              <td className="p-3"></td>
                              <td className="p-3">
                                <div className="flex items-center">
                                  <div className="w-6 h-6 flex-shrink-0 mr-2">
                                    <img 
                                      src="https://w6hav65sf2mc3do4yxsgex3rfupnngahqfibv7lphwvgisf7cfua.arweave.net/t44K-7IumC2N3MXkYl9xLR7WmAeBUBr9bz2qZEi_EWg"
                                      alt="AFACT"
                                      className="w-full h-full"
                                    />
                                  </div>
                                  <span>AFACT</span>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="line-clamp-2">{afact.fact}</div>
                              </td>
                              <td className="p-3">
                                {formatDate(afact.extractedDate)}
                              </td>
                              <td className="p-3">
                                <div className="flex items-center text-green-400">
                                  <Coins className="h-4 w-4 mr-1" />
                                  ${afact.earnings.toFixed(2)}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default TokenDetails;