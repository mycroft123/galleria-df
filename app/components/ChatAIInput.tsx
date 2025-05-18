"use client";

import React, { useState, useRef, useEffect } from "react";
import { LinkIcon, User, Bot, Send, ChevronDown, ChevronUp, Search, Cpu, Loader2 } from "lucide-react";
import { Message, ParsedResponse } from "./types";
import { generateDisplayText } from "./helpers";
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { createTransferInstruction } from '@solana/spl-token';

const TREASURY_ADDRESS = 'ExK2ZcWx6tpVe5xfqkHZ62bMQNpStLj98z2WDUWKUKGp';
const DFCT_TOKEN_ADDRESS = '8mTDKt6gY1DatZDKbvMCdiw4AZRdCpUjxuRv4GRBg2Xn';

const API_URL = "http://localhost:3002/api/ai-perplexity";

const connection = new Connection(
  `${process.env.NEXT_PUBLIC_HELIUS_RPC_URL}/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`,
  {
    commitment: 'confirmed',
    cluster: 'devnet'  // Explicitly specify devnet
  }
);

interface ParseStatus {
  [url: string]: {
    loading: boolean;
    error?: string;
    results?: any;
  };
}

// Enhanced Markdown to HTML conversion function with better handling of edge cases
const convertMarkdownToHtml = (markdown: string): string => {
  if (!markdown) return '';
  
  try {
    // Preserve code blocks before other processing
    const codeBlocks: string[] = [];
    let processedMarkdown = markdown.replace(/```([\s\S]*?)```/g, (match) => {
      const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
      codeBlocks.push(match);
      return placeholder;
    });
    
    // Also preserve inline code to prevent formatting inside them
    const inlineCodes: string[] = [];
    processedMarkdown = processedMarkdown.replace(/`([^`]+)`/g, (match) => {
      const placeholder = `__INLINE_CODE_${inlineCodes.length}__`;
      inlineCodes.push(match);
      return placeholder;
    });
    
    // Preserve superscript references so they don't get mixed in paragraphs
    const superscripts: string[] = [];
    processedMarkdown = processedMarkdown.replace(/\[(\d+)\]/g, (match) => {
      const placeholder = `__SUPERSCRIPT_${superscripts.length}__`;
      superscripts.push(match);
      return placeholder;
    });
    
    // Format double newlines for paragraph spacing
    processedMarkdown = processedMarkdown.replace(/\n\n/g, '§DOUBLE_NEWLINE§');
    
    // Format headings - using a more specific pattern and checking for the exact number of #
    processedMarkdown = processedMarkdown.replace(/^###\s+([^#].*?)$/gm, '<h3 class="text-xl font-semibold mt-6 mb-2 text-gray-800">$1</h3>');
    processedMarkdown = processedMarkdown.replace(/^##\s+([^#].*?)$/gm, '<h2 class="text-2xl font-semibold mt-8 mb-3 text-gray-800">$1</h2>');
    processedMarkdown = processedMarkdown.replace(/^#\s+([^#].*?)$/gm, '<h1 class="text-3xl font-bold mt-8 mb-4 text-gray-900">$1</h1>');
    
    // Explicit pattern for "### Title" format - this is a backup for the patterns above
    processedMarkdown = processedMarkdown.replace(/(?:^|\n)###\s+(.*?)(?=\n|$)/g, '\n<h3 class="text-xl font-semibold mt-6 mb-2 text-gray-800">$1</h3>\n');
    
    // Format bullet points with • character
    processedMarkdown = processedMarkdown.replace(/^•\s+(.*)/gm, (match, content) => {
      return `<div class="flex gap-2 items-baseline mb-3 ml-4">
        <span class="text-gray-400">•</span>
        <span class="flex-1">${content}</span>
      </div>`;
    });
    
    // Format numbering with proper spacing and font weights
    processedMarkdown = processedMarkdown.replace(/^(\d+)\.\s+(.*)/gm, (match, number, content) => {
      return `<div class="flex gap-2 items-baseline mb-3">
        <span class="text-green-700 font-semibold">${number}.</span>
        <span class="flex-1 font-medium">${content}</span>
      </div>`;
    });
    
    // Format indented points with dashes
    processedMarkdown = processedMarkdown.replace(/^(\s*)-\s+(.*)/gm, (match, indent, content) => {
      const indentLevel = indent.length > 0 ? 8 : 4;
      return `<div class="flex gap-2 items-baseline mb-3 ml-${indentLevel}">
        <span class="text-gray-400">•</span>
        <span class="flex-1">${content}</span>
      </div>`;
    });
    
    // Format bullet points with * character
    processedMarkdown = processedMarkdown.replace(/^\*\s+(.*)/gm, (match, content) => {
      return `<div class="flex gap-2 items-baseline mb-3 ml-4">
        <span class="text-gray-400">•</span>
        <span class="flex-1">${content}</span>
      </div>`;
    });
    
    // Basic inline formatting
    processedMarkdown = processedMarkdown.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    processedMarkdown = processedMarkdown.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Links
    processedMarkdown = processedMarkdown.replace(/\[([^\]]+)\]\(([^)]+)\)/g, 
      '<a href="$2" class="text-green-700 hover:text-green-900 underline" target="_blank">$1</a>'
    );
    
    // Restore superscript references
    superscripts.forEach((ref, index) => {
      processedMarkdown = processedMarkdown.replace(`__SUPERSCRIPT_${index}__`, 
        `<sup class="text-green-700 font-medium">${ref}</sup>`
      );
    });
    
    // Convert normal lines to paragraphs, but skip lines that already have HTML
    const paragraphs = processedMarkdown.split('\n').map(para => {
      const trimmedPara = para.trim();
      if (!trimmedPara) return '';
      if (trimmedPara.startsWith('<')) return trimmedPara;
      return `<p class="mb-4 leading-relaxed">${trimmedPara}</p>`;
    }).filter(Boolean).join('');
    
    processedMarkdown = paragraphs;
    
    // Restore inline code with proper formatting
    inlineCodes.forEach((code, index) => {
      const formattedCode = code.replace(/`([^`]+)`/g, 
        '<code class="px-1 py-0.5 bg-gray-100 rounded text-sm font-mono text-green-700">$1</code>'
      );
      processedMarkdown = processedMarkdown.replace(`__INLINE_CODE_${index}__`, formattedCode);
    });
    
    // Restore code blocks with proper formatting
    codeBlocks.forEach((block, index) => {
      const codeContent = block.replace(/```(?:(\w+))?\n([\s\S]*?)```/g, (match, language, code) => {
        const formattedCode = code.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<pre class="bg-gray-100 p-3 rounded-md overflow-x-auto text-sm font-mono text-gray-800 my-4"><code>${formattedCode}</code></pre>`;
      });
      processedMarkdown = processedMarkdown.replace(`__CODE_BLOCK_${index}__`, codeContent);
    });
    
    // Replace double newlines with margin
    processedMarkdown = processedMarkdown.replace(/§DOUBLE_NEWLINE§/g, '<div class="mb-6"></div>');
    
    return processedMarkdown;
  } catch (error) {
    console.error('Error converting markdown to HTML:', error);
    // Fallback to basic HTML escaping if conversion fails
    return markdown
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
  }
};

interface TypingMessageProps {
  content: string;
  messageIndex: number;
  onComplete: () => void;
  speed?: number;
  isComplete: boolean;
  displayedContent: string;
}

// Enhanced typing message component with improved animation
const MemoizedTypingMessage = React.memo(({ 
  content, 
  messageIndex, 
  onComplete, 
  speed = 1,
  isComplete,
  displayedContent 
}: TypingMessageProps) => {
  // Use a simpler approach with fewer states to avoid loops
  const [displayText, setDisplayText] = useState(isComplete ? content : displayedContent || '');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const contentRef = useRef(content);
  const indexRef = useRef(displayedContent?.length || 0);
  const isTypingRef = useRef(!isComplete);
  
  // Update refs when props change
  useEffect(() => {
    contentRef.current = content;
    if (isComplete) {
      setDisplayText(content);
      isTypingRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  }, [content, isComplete]);

  // Start/manage typing animation once on initial render
  useEffect(() => {
    // If already complete, don't animate
    if (isComplete) {
      setDisplayText(content);
      return;
    }
    
    const typeNextChunk = () => {
      if (!isTypingRef.current) return;
      
      if (indexRef.current < contentRef.current.length) {
        // Process a chunk of text at a time
        const chunkSize = 5;
        const newIndex = Math.min(indexRef.current + chunkSize, contentRef.current.length);
        const newText = contentRef.current.slice(0, newIndex);
        setDisplayText(newText);
        
        // Determine next chunk delay based on punctuation
        let delay = speed;
        const lastChar = contentRef.current[newIndex - 1];
        if (['.', '!', '?', ':'].includes(lastChar)) delay = speed * 3;
        else if ([',', ';'].includes(lastChar)) delay = speed * 2;
        
        indexRef.current = newIndex;
        
        // Schedule next chunk
        timeoutRef.current = setTimeout(typeNextChunk, delay);
      } else {
        // Animation complete
        isTypingRef.current = false;
        setDisplayText(contentRef.current); // Ensure full text is displayed
        onComplete();
      }
    };
    
    // Start the animation
    typeNextChunk();
    
    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  return (
    <div className="prose max-w-none whitespace-pre-wrap text-gray-800">
      <div 
        dangerouslySetInnerHTML={{ 
          __html: convertMarkdownToHtml(displayText || '') 
        }} 
      />
      {!isComplete && isTypingRef.current && (
        <span className="inline-block ml-1 text-green-600 animate-pulse">▌</span>
      )}
    </div>
  );
});

MemoizedTypingMessage.displayName = 'MemoizedTypingMessage';

interface ChatMessageProps {
  message: Message;
  index: number;
  typingState: {
    isComplete: boolean;
    displayedContent: string;
  };
  onTypingComplete: (index: number, content: string) => void;
  onCitationToggle: (index: number) => void;
  citationsVisible: boolean;
  mintedAssets: {[url: string]: string};
}

const ChatMessage = React.memo(({ 
  message, 
  index, 
  typingState, 
  onTypingComplete,
  onCitationToggle,
  citationsVisible,
  mintedAssets
}: ChatMessageProps) => {
  const [parseStatus, setParseStatus] = useState<ParseStatus>({});

  const handleParseUrl = async (url: string) => {
    setParseStatus(prev => ({
      ...prev,
      [url]: { loading: true }
    }));

    try {
      const response = await fetch('http://localhost:3002/api/facts-to-nfts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      
      if (data.success) {
        setParseStatus(prev => ({
          ...prev,
          [url]: { loading: false, results: data }
        }));
      } else {
        throw new Error(data.error || 'Failed to parse URL');
      }
    } catch (error) {
      console.error('Error parsing URL:', error);
      setParseStatus(prev => ({
        ...prev,
        [url]: { loading: false, error: error.message }
      }));
    }
  };

  const handleTypingComplete = React.useCallback(() => {
    onTypingComplete(index, message.content);
  }, [index, message.content, onTypingComplete]);

  return (
    <div className="py-6 border-b border-gray-200 last:border-0">
      <div className={`flex items-center gap-2 mb-3`}>
        {message.role === 'user' && (
          <div className="flex items-center gap-2">
            <div className="bg-green-100 p-2 rounded-full">
              <User size={16} className="text-green-700" />
            </div>
            <span className="text-green-700 text-sm font-medium">You</span>
          </div>
        )}
        {message.role === 'assistant' && (
          <div className="flex items-center gap-2">
            <div className="p-1">
              <img 
                src="https://imauscty4e4ddllrj32jcna2gei5xpgigjxgplkbugqoceyo2j2q.arweave.net/QwFJCnjhODGtcU70kTQaMRHbvMgybmetQaGg4RMO0nU" 
                alt="AI Logo" 
                className="h-6 w-auto"
              />
            </div>
            <span className="text-green-700 text-sm font-medium">AI Assistant</span>
          </div>
        )}
      </div>

      <div className={`pl-10 ${
        message.role === 'user' 
          ? 'text-gray-900 font-medium text-lg bg-green-50 p-4 rounded-lg border-l-4 border-green-200'
          : 'text-gray-800'
      }`}>
        {message.role === 'assistant' ? (
          <div className="space-y-4">
            <MemoizedTypingMessage
              content={message.content}
              messageIndex={index}
              onComplete={handleTypingComplete}
              speed={1}
              isComplete={typingState.isComplete}
              displayedContent={typingState.displayedContent}
            />
          </div>
        ) : (
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{
              __html: convertMarkdownToHtml(message.content as string)
            }}
          />
        )}
      </div>

      {message.role === 'assistant' && message.citations && message.citations.length > 0 && (
        <div className="mt-6 pl-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCitationToggle(index);
            }}
            className="w-full p-3 flex items-center justify-between hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <div className="flex items-center gap-2">
              <div className="bg-green-100 p-1.5 rounded-lg">
                <LinkIcon size={14} className="text-green-700" />
              </div>
              <span className="text-green-700 text-sm font-medium">
                {message.citations.length} Web Sources
              </span>
            </div>
            {citationsVisible ?
              <ChevronUp size={16} className="text-green-700" /> :
              <ChevronDown size={16} className="text-green-700" />
            }
          </button>
          
          {citationsVisible && (
            <div className="p-3 space-y-4 max-h-80 overflow-y-auto bg-gray-50 rounded-lg mt-1 border border-gray-200">
              {message.citations.map((citation, citationIndex) => (
                <div key={citationIndex} className="space-y-2 rounded-lg bg-white p-3 border border-gray-200 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 flex-grow">
                      <div className="flex-shrink-0 text-gray-500 font-medium">
                        {citationIndex + 1}.
                      </div>
                      <a
                        href={citation}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-700 hover:text-green-800 text-sm break-all hover:underline transition-colors flex-grow"
                      >
                        {citation}
                      </a>
                    </div>
                    {mintedAssets[citation] ? (
                      <div className="flex items-center gap-2">
                        <div className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                          Verified
                        </div>
                        <button
                          onClick={() => handleParseUrl(citation)}
                          disabled={parseStatus[citation]?.loading}
                          className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                        >
                          {parseStatus[citation]?.loading ? 
                            <Loader2 size={14} className="animate-spin" /> : 
                            'Parse Facts'
                          }
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                        Unverified
                      </div>
                    )}
                  </div>

                  {mintedAssets[citation] && (
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <span className="text-gray-600">NFT:</span>
                      <a 
                        href={`https://explorer.solana.com/address/${mintedAssets[citation]}/metadata?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-green-700 text-gray-700 font-mono"
                      >
                        {mintedAssets[citation].substring(0, 8)}...{mintedAssets[citation].substring(mintedAssets[citation].length - 8)}
                      </a>
                    </div>
                  )}

                  {parseStatus[citation]?.error && (
                    <div className="text-xs text-red-600 p-2 bg-red-50 rounded-lg mt-1">
                      {parseStatus[citation].error}
                    </div>
                  )}

                  {parseStatus[citation]?.results && (
                    <div className="bg-gray-50 rounded-lg p-3 mt-2 border border-gray-200">
                      <h4 className="text-sm font-medium text-green-700 mb-2">Facts Retrieved</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white p-2 rounded-lg border border-gray-200">
                          <span className="text-gray-600">Total Facts:</span>
                          <span className="text-gray-900 ml-1 font-medium">{parseStatus[citation].results.totalFactsProcessed}</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-gray-200">
                          <span className="text-gray-600">Minted:</span>
                          <span className="text-gray-900 ml-1 font-medium">{parseStatus[citation].results.totalMinted}</span>
                        </div>
                      </div>
                      {parseStatus[citation].results.mintedFacts?.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-medium text-green-700">Verified Facts:</p>
                          <div className="max-h-40 overflow-y-auto pr-1">
                            {parseStatus[citation].results.mintedFacts.map((fact: any, i: number) => (
                              <div key={i} className="text-xs p-2 bg-white rounded-lg mb-2 border border-gray-200 shadow-sm">
                                <p className="text-gray-800">{fact.fact.substring(0, 100)}{fact.fact.length > 100 ? '...' : ''}</p>
                                <div className="text-gray-500 mt-1 font-mono text-2xs">
                                  NFT: {fact.mintId.substring(0, 8)}...
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';

const ChatAIInput: React.FC = () => {
  // Existing state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isDebugVisible, setIsDebugVisible] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [citationsVisible, setCitationsVisible] = useState<{ [key: number]: boolean }>({});
  const [typingStates, setTypingStates] = useState<{
    [key: number]: {
      isComplete: boolean;
      displayedContent: string;
    }
  }>({});
  const [mintedAssets, setMintedAssets] = useState<{[url: string]: string}>({});
  
  // New state for engine selection
  const [selectedEngines, setSelectedEngines] = useState({
    perplexity: true,
    openai: false,
    defacts: false
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const defaultModel = "llama-3.1-sonar-small-128k-online";

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleTypingComplete = React.useCallback((index: number, content: string) => {
    setTypingStates(prev => {
      // Only update if needed to prevent unnecessary re-renders
      if (prev[index]?.isComplete === true) {
        return prev;
      }
      return {
        ...prev,
        [index]: {
          isComplete: true,
          displayedContent: content
        }
      };
    });
  }, []);

  const handleCitationToggle = React.useCallback((index: number) => {
    setCitationsVisible(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  }, []);

  const handleEngineChange = (engine: string) => {
    setSelectedEngines(prev => ({
      ...prev,
      [engine]: !prev[engine]
    }));
  };

  const fetchWithTimeout = async (url: string, options: RequestInit, timeout: number = 30000) => {
    const controller = new AbortController();
    const { signal } = controller;
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timeoutId = setTimeout(() => {
        controller.abort();
        reject(new Error('Request timed out'));
      }, timeout);
      signal.addEventListener('abort', () => clearTimeout(timeoutId));
    });

    try {
      const fetchPromise = fetch(url, { ...options, signal });
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  };

  // Add a new state for input processing
  const [isInputProcessing, setIsInputProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Initial validation
    if (!chatInput.trim()) return;
    if (!Object.values(selectedEngines).some(value => value)) {
      setError("Please select at least one AI engine");
      return;
    }
  
    const userMessage = chatInput;
    setChatInput(""); // Clear input early
    setIsInputProcessing(true); // Use the new state instead of loading
    setError("");
  
    try {
      // Check if wallet is available
      if (!window.solana) {
        throw new Error('Please install Phantom wallet');
      }
      
      // Check if wallet is connected
      try {
        // First try to access the publicKey to see if already connected
        if (!window.solana.publicKey) {
          // Not connected, attempt to connect
          console.log('Connecting to wallet...');
          await window.solana.connect();
          console.log('Connected successfully');
        }
      } catch (connectError) {
        console.error('Connection error:', connectError);
        throw new Error(`Failed to connect wallet: ${connectError.message || 'Unknown error'}`);
      }
  
      // Now we should have a connected wallet
      const wallet = window.solana;
      
      // Step 1: Process token transfer first
      try {
        await processTokenTransfer(wallet);
      } catch (error) {
        throw new Error(`Payment failed: ${error.message}`);
      }
  
      // Step 2: Add user message immediately after payment
      const newMessages = [...chatMessages, { 
        role: 'user', 
        content: userMessage,
        timestamp: Date.now() 
      }];
      setChatMessages(newMessages);
  
      // Step 3: Prepare and send AI request
      const response = await sendAIRequest(userMessage, selectedEngines);
      const data = await handleAIResponse(response);
      
      // Step 4: Process AI response content
      const { rawContent, messageIndex } = await processAIContent(data, newMessages);
  
      // Step 5: Display AI response immediately
      const newMessage = {
        role: 'assistant',
        content: rawContent,
        timestamp: Date.now(),
        citations: data.citations || []
      };
  
      setChatMessages(prev => [...prev, newMessage]);
      setTypingStates(prev => ({
        ...prev,
        [messageIndex]: {
          isComplete: false,
          displayedContent: ''
        }
      }));
  
      // Free up the input box after we've received and displayed the AI response
      setIsInputProcessing(false);
  
      // Step 6: Process NFT minting asynchronously
      if (data.citations?.length > 0) {
        setLoading(true); // Use the original loading state for NFT minting
        processNFTMinting(data.citations)
          .catch(console.error)
          .finally(() => setLoading(false));
      }
  
    } catch (err) {
      console.error("[Handle Submit Error]", {
        error: err,
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      });
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(`Error: ${errorMessage}. Please try again.`);
    } finally {
      setIsInputProcessing(false); // Always ensure input is freed
    }
  };
  
  // Helper function to process token transfer
// Updated processTokenTransfer function - replace your existing implementation with this
const processTokenTransfer = async (wallet: any) => {
  console.log('Starting token transfer flow...');
  
  try {
    // 1. Find the user's token account for DFCT
    const userTokenAccounts = await connection.getParsedTokenAccountsByOwner(
      wallet.publicKey,
      { mint: new PublicKey(DFCT_TOKEN_ADDRESS) }
    );

    if (userTokenAccounts.value.length === 0) {
      throw new Error('No DFCT token account found');
    }

    // Always use the account with the highest balance
    const userAccount = userTokenAccounts.value.reduce((highest, current) => {
      const currentAmount = BigInt(current.account.data.parsed.info.tokenAmount.amount);
      const highestAmount = BigInt(highest.account.data.parsed.info.tokenAmount.amount);
      return currentAmount > highestAmount ? current : highest;
    }, userTokenAccounts.value[0]);
    
    const userBalance = userAccount.account.data.parsed.info.tokenAmount;
    console.log('User token account found:', userAccount.pubkey.toString());
    console.log('User balance:', userBalance.uiAmount, userBalance.decimals);
    
    // Calculate transfer amount as BigInt to avoid precision issues
    // Exactly 1 token with proper decimal places
    const transferAmount = BigInt(10 ** userBalance.decimals);
    
    if (BigInt(userBalance.amount) < transferAmount) {
      throw new Error(`Insufficient DFCT balance. You need at least 1 DFCT token. Current balance: ${userBalance.uiAmount}`);
    }

    // 2. Find the treasury's token account for receiving DFCT
    const treasuryPubkey = new PublicKey(TREASURY_ADDRESS);
    const treasuryTokenAccounts = await connection.getParsedTokenAccountsByOwner(
      treasuryPubkey,
      { mint: new PublicKey(DFCT_TOKEN_ADDRESS) }
    );

    if (treasuryTokenAccounts.value.length === 0) {
      throw new Error('Treasury token account not found');
    }

    const treasuryAccount = treasuryTokenAccounts.value[0];
    console.log('Treasury token account found:', treasuryAccount.pubkey.toString());

    // 3. Get a fresh blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    
    // 4. Create a fresh transaction
    const transaction = new Transaction();
    
    // 5. Add the transfer instruction
    transaction.add(
      createTransferInstruction(
        userAccount.pubkey, 
        treasuryAccount.pubkey,
        wallet.publicKey,
        transferAmount
      )
    );
    
    // 6. Set the required transaction properties
    transaction.feePayer = wallet.publicKey;
    transaction.recentBlockhash = blockhash;
    
    // 7. Sign the transaction via wallet
    console.log('Requesting wallet signature...');
    const signed = await wallet.signTransaction(transaction);
    
    // 8. Send the transaction
    console.log('Sending transaction to network...');
    const signature = await connection.sendRawTransaction(signed.serialize());
    
    // 9. Confirm with explicit parameters and timeout
    console.log('Confirming transaction:', signature);
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight
    }, 'confirmed');
    
    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }
    
    console.log('Transaction confirmed successfully:', signature);
    return signature;
  } catch (error) {
    console.error('Token transfer error:', error);
    throw error; // Rethrow to be handled by the caller
  }
};
  
  // Helper function to send AI request
  const sendAIRequest = async (userMessage: string, selectedEngines: any) => {
    let systemPrompt = "You are an assistant that provides responses with these capabilities:";
    if (selectedEngines.perplexity) systemPrompt += "\n- Perplexity AI for web search and analysis";
    if (selectedEngines.openai) systemPrompt += "\n- OpenAI for advanced reasoning";
    if (selectedEngines.defacts) systemPrompt += "\n- DeFacts for blockchain verification";
  
    // Get the last 10 messages to keep context manageable
    const recentMessages = chatMessages.slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  
    const requestBody = {
      model: defaultModel,
      messages: [
        { role: "system", content: systemPrompt },
        ...recentMessages,  // Include recent conversation history
        { role: "user", content: userMessage }
      ]
    };
  
    console.log('Sending request with context:', {
      historyLength: recentMessages.length,
      totalMessages: requestBody.messages.length
    });
  
    return await fetchWithTimeout(
      API_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(requestBody),
      },
      30000
    );
  };
  
  // Helper function to handle AI response
  const handleAIResponse = async (response: Response) => {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  };
  
  // Helper function to process AI content
  const processAIContent = async (data: any, messages: Message[]) => {
    let rawContent;
    try {
      if (data.choices?.[0]?.message?.content) {
        rawContent = data.choices[0].message.content;
      } else if (data.answer) {
        rawContent = data.answer;
      } else {
        throw new Error("Invalid response format: Missing required content");
      }
    
      return {
        rawContent,
        messageIndex: messages.length
      };
    } catch (error) {
      console.error('Error processing AI content:', error);
      throw new Error('Failed to process AI response. Please try again.');
    }
  };
  
  // Helper function to process NFT minting
  const processNFTMinting = async (citations: string[]) => {
    try {
      const mintResponse = await fetch('http://localhost:3002/api/batch-create-nft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          facts: citations.map((url: string) => ({
            fact: url,
            sourceUrl: url,
            extractedDate: new Date().toISOString().split('T')[0],
          })),
        }),
      });
  
      const mintData = await mintResponse.json();
      if (mintData.success) {
        const newMintedAssets = mintData.results.reduce((acc: any, result: any) => {
          acc[result.sourceUrl] = result.assetId;
          return acc;
        }, {});
        setMintedAssets(prev => ({ ...prev, ...newMintedAssets }));
      }
    } catch (error) {
      console.error("[NFT Minting Exception]", {
        error,
        message: error instanceof Error ? error.message : String(error)
      });
      // Note: We don't throw here since this is a background process
    }
  };

  return (
    <div className="w-full h-full bg-gray-50 text-gray-900">
      <div className="h-full flex flex-col">

        
        {/* Main chat area */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="container mx-auto max-w-4xl px-4">
            {chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12">
   <div className="flex flex-col items-center justify-center text-center p-8 w-full">
      <img 
        src="https://imauscty4e4ddllrj32jcna2gei5xpgigjxgplkbugqoceyo2j2q.arweave.net/QwFJCnjhODGtcU70kTQaMRHbvMgybmetQaGg4RMO0nU" 
        alt="DeFacts Logo" 
        className="h-24 w-auto mb-6"
      />
      <h1 className="text-4xl font-bold text-gray-900">DeFacts AI Chat</h1>
    </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-green-500/50 hover:shadow transition-all cursor-pointer">
                    <Search size={18} className="text-green-700 mb-2" />
                    <h3 className="text-gray-900 font-medium mb-1">Web Search</h3>
                    <p className="text-xs text-gray-600">Get up-to-date information from the web</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-green-500/50 hover:shadow transition-all cursor-pointer">
                    <Cpu size={18} className="text-green-700 mb-2" />
                    <h3 className="text-gray-900 font-medium mb-1">AI Analysis</h3>
                    <p className="text-xs text-gray-600">Complex reasoning and data processing</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-green-500/50 hover:shadow transition-all cursor-pointer">
                    <LinkIcon size={18} className="text-green-700 mb-2" />
                    <h3 className="text-gray-900 font-medium mb-1">Blockchain Verification</h3>
                    <p className="text-xs text-gray-600">All facts are verified on-chain</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-4">
                {chatMessages.map((message, index) => (
                  <ChatMessage
                    key={index}
                    message={message}
                    index={index}
                    typingState={typingStates[index] || { isComplete: false, displayedContent: '' }}
                    onTypingComplete={handleTypingComplete}
                    onCitationToggle={handleCitationToggle}
                    citationsVisible={citationsVisible[index] || false}
                    mintedAssets={mintedAssets}
                  />
                ))}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>
        </div>
        
        {/* Input area */}
        <div className="border-t border-gray-200 bg-white">
          <div className="container mx-auto max-w-4xl px-4 py-4">
            {/* Engine selector */}
            <div className="mb-4 flex flex-wrap gap-3">
              <div className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                AI Engines:
              </div>
              <label className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs cursor-pointer transition-colors ${
                selectedEngines.perplexity 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}>
                <input
                  type="checkbox"
                  checked={selectedEngines.perplexity}
                  onChange={() => handleEngineChange('perplexity')}
                  className="sr-only"
                />
                <Search size={12} className={selectedEngines.perplexity ? 'text-green-700' : 'text-gray-500'} />
                <span>Perplexity</span>
              </label>
              <label className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs cursor-pointer transition-colors ${
                selectedEngines.openai 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}>
                <input
                  type="checkbox"
                  checked={selectedEngines.openai}
                  onChange={() => handleEngineChange('openai')}
                  className="sr-only"
                />
                <Cpu size={12} className={selectedEngines.openai ? 'text-green-700' : 'text-gray-500'} />
                <span>OpenAI</span>
              </label>
              <label className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs cursor-pointer transition-colors ${
                selectedEngines.defacts 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}>
                <input
                  type="checkbox"
                  checked={selectedEngines.defacts}
                  onChange={() => handleEngineChange('defacts')}
                  className="sr-only"
                />
                <LinkIcon size={12} className={selectedEngines.defacts ? 'text-green-700' : 'text-gray-500'} />
                <span>DeFacts</span>
              </label>
            </div>
            
            {/* Input form */}
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={isInputProcessing ? "Generating response..." : "Type your question (costs 1 DFCT)..."}
                className="w-full bg-white text-gray-900 rounded-xl pl-4 pr-12 py-3.5 border border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors placeholder:text-gray-500"
                disabled={isInputProcessing}
              />
              <button
                type="submit"
                disabled={isInputProcessing || !chatInput.trim() || !Object.values(selectedEngines).some(v => v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
              >
                {isInputProcessing ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </form>
            
            {/* Pricing info */}
            <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
              <div>
                Each question costs 1 DFCT token
              </div>
              <div className="text-right">
                Powered by DeFacts | Blockchain-verified AI
              </div>
            </div>
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-3 bg-red-500 text-white rounded-lg shadow-lg max-w-lg w-full animate-slide-up">
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatAIInput;