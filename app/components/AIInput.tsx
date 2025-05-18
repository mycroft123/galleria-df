"use client";

import React, { useState, useRef, useEffect } from "react";
import { LinkIcon, User, Bot, Send, ChevronDown, ChevronUp } from "lucide-react";
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

const convertMarkdownToHtml = (markdown: string): string => {
  let html = markdown.replace(/\n\n/g, '§DOUBLE_NEWLINE§');
  
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  html = html.replace(/^•\s+(.*)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  html = html.replace(/^\d+\.\s+(.*)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');
  
  html = html.split('\n').map(para => 
    para.trim().startsWith('<') ? para : `<p>${para}</p>`
  ).join('');
  
  html = html.replace(/§DOUBLE_NEWLINE§/g, '<div class="mb-8"></div>');
  
  return html;
};

interface TypingMessageProps {
  content: string;
  messageIndex: number;
  onComplete: () => void;
  speed?: number;
  isComplete: boolean;
  displayedContent: string;
}

const MemoizedTypingMessage = React.memo(({ 
  content, 
  messageIndex, 
  onComplete, 
  speed = 1,
  isComplete,
  displayedContent 
}: TypingMessageProps) => {
  const [currentContent, setCurrentContent] = useState(displayedContent);
  const [isTyping, setIsTyping] = useState(!isComplete);

  useEffect(() => {
    if (!isComplete && isTyping) {
      let currentIndex = currentContent.length;
      let isMounted = true;

      const typeNextCharacter = () => {
        if (!isMounted) return;
        
        if (currentIndex <= content.length) {
          const newContent = content.slice(0, currentIndex);
          setCurrentContent(newContent);
          currentIndex++;
          setTimeout(typeNextCharacter, speed);
        } else {
          setIsTyping(false);
          onComplete();
        }
      };

      typeNextCharacter();
      
      return () => {
        isMounted = false;
      };
    }
  }, [content, speed, onComplete, isComplete, isTyping, currentContent]);

  useEffect(() => {
    if (isComplete) {
      setCurrentContent(content);
    }
  }, [isComplete, content]);

  return (
    <div className="prose prose-invert max-w-none whitespace-pre-wrap">
      <span 
        dangerouslySetInnerHTML={{ 
          __html: convertMarkdownToHtml(currentContent || '') 
        }} 
      />
      {!isComplete && isTyping && (
        <span className="blinking-cursor">|</span>
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
    <div className="space-y-3">
      <div className={`flex items-center gap-2 ${
        message.role === 'user' ? 'justify-end' : 'justify-start'
      }`}>
        {message.role === 'assistant' && (
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500/20 p-1.5 rounded-lg">
              <Bot size={14} className="text-emerald-400" />
            </div>
            <span className="text-emerald-400 text-sm font-medium">AI Assistant</span>
          </div>
        )}
        {message.role === 'user' && (
          <div className="flex items-center gap-2">
            <span className="text-purple-400 text-sm font-medium">You</span>
            <div className="bg-purple-500/20 p-1.5 rounded-lg">
              <User size={14} className="text-purple-400" />
            </div>
          </div>
        )}
      </div>

      <div className={`rounded-xl p-4 ${
        message.role === 'user'
          ? 'bg-purple-500/10 border border-purple-500/20'
          : 'bg-emerald-500/10 border border-emerald-500/20'
      }`}>
        {message.role === 'assistant' ? (
          <div>
            <MemoizedTypingMessage
              content={message.content}
              messageIndex={index}
              onComplete={handleTypingComplete}
              speed={10}
              isComplete={typingState.isComplete}
              displayedContent={typingState.displayedContent}
            />
          </div>
        ) : (
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{
              __html: convertMarkdownToHtml(message.content as string)
            }}
          />
        )}
      </div>

      {message.role === 'assistant' && message.citations && message.citations.length > 0 && (
        <div className="bg-gray-800/30 rounded-lg border border-gray-700">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCitationToggle(index);
            }}
            className="w-full p-3 flex items-center justify-between hover:bg-gray-700/30 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="bg-gray-700 p-1.5 rounded-lg">
                <LinkIcon size={14} className="text-emerald-300" />
              </div>
              <span className="text-emerald-300 text-sm font-medium">
                ({message.citations.length}) Web Sources
              </span>
            </div>
            {citationsVisible ?
              <ChevronUp size={16} className="text-emerald-300" /> :
              <ChevronDown size={16} className="text-emerald-300" />
            }
          </button>
          
          {citationsVisible && (
            <div className="p-3 space-y-4">
              {message.citations.map((citation, citationIndex) => (
                <div key={citationIndex} className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <a
                      href={citation}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-300 hover:text-emerald-200 text-sm break-all hover:bg-emerald-500/10 p-2 rounded-lg transition-colors flex-grow"
                    >
                      {citation}
                    </a>
                    {mintedAssets[citation] && (
                      <button
                        onClick={() => handleParseUrl(citation)}
                        disabled={parseStatus[citation]?.loading}
                        className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                      >
                        {parseStatus[citation]?.loading ? 'Parsing...' : 'Parse for Facts'}
                      </button>
                    )}
                  </div>

                  {mintedAssets[citation] && (
                    <div className="text-xs text-gray-400 pl-2">
                      NFT Asset ID:{" "}
                      <a 
                        href={`https://explorer.solana.com/address/${mintedAssets[citation]}/metadata?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-gray-300"
                      >
                        {mintedAssets[citation]}
                      </a>
                    </div>
                  )}

                  {parseStatus[citation]?.error && (
                    <div className="text-xs text-red-400 pl-2">
                      Error: {parseStatus[citation].error}
                    </div>
                  )}

                  {parseStatus[citation]?.results && (
                    <div className="bg-gray-900/30 rounded-lg p-3 mt-2">
                      <h4 className="text-sm font-medium text-emerald-300 mb-2">Parsing Results</h4>
                      <div className="space-y-1 text-xs">
                        <p className="text-gray-300">
                          Facts Found: {parseStatus[citation].results.totalFactsProcessed}
                        </p>
                        <p className="text-gray-300">
                          Facts Minted: {parseStatus[citation].results.totalMinted}
                        </p>
                      </div>
                      {parseStatus[citation].results.mintedFacts?.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm font-medium text-emerald-300">Minted Facts:</p>
                          {parseStatus[citation].results.mintedFacts.map((fact: any, i: number) => (
                            <div key={i} className="text-xs text-gray-300 pl-2">
                              • {fact.fact.substring(0, 100)}...
                              <div className="text-gray-400">
                                NFT ID: {fact.mintId}
                              </div>
                            </div>
                          ))}
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
  const [debug, setDebug] = useState<string>("");
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
    setTypingStates(prev => ({
      ...prev,
      [index]: {
        isComplete: true,
        displayedContent: content
      }
    }));
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
  if (!window.solana?.isPhantom) {
    setError('Phantom wallet not found');
    return;
  }

  const userMessage = chatInput;
  setChatInput(""); // Clear input early
  setIsInputProcessing(true); // Use the new state instead of loading
  setError("");

  try {
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
  const processTokenTransfer = async (wallet: any) => {
    console.log('Starting token transfer flow...');
    
    const userTokenAccounts = await connection.getParsedTokenAccountsByOwner(
      wallet.publicKey,
      { mint: new PublicKey(DFCT_TOKEN_ADDRESS) }
    );
  
    if (userTokenAccounts.value.length === 0) {
      throw new Error('No DFCT token account found');
    }
  
    const userAccount = userTokenAccounts.value[0];
    const userBalance = userAccount.account.data.parsed.info.tokenAmount;
    const transferAmount = 1 * Math.pow(10, userBalance.decimals);
  
    const treasuryPubkey = new PublicKey(TREASURY_ADDRESS);
    const treasuryTokenAccounts = await connection.getParsedTokenAccountsByOwner(
      treasuryPubkey,
      { mint: new PublicKey(DFCT_TOKEN_ADDRESS) }
    );
  
    if (treasuryTokenAccounts.value.length === 0) {
      throw new Error('Treasury token account not found');
    }
  
    const transferInstruction = createTransferInstruction(
      userTokenAccounts.value[0].pubkey,
      treasuryTokenAccounts.value[0].pubkey,
      wallet.publicKey,
      transferAmount
    );
  
    const transaction = new Transaction().add(transferInstruction);
    transaction.feePayer = wallet.publicKey;
    transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
  
    const signed = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(signature);
    
    console.log('Transaction confirmed:', signature);
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
    <div className="w-full h-full">
      <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl rounded-xl p-6 shadow-2xl border border-gray-800 h-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-3 w-3 rounded-full bg-red-500"></div>
          <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
          <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
          <div className="text-gray-400 text-sm ml-2">
            {loading ? "Processing..." : error ? "Error" : "Ready"}
          </div>
        </div>

        <div className="bg-gradient-to-b from-gray-900 to-black rounded-lg border border-gray-800 h-[calc(100%-3rem)]">
          <div className="flex flex-col h-full">
            <div className="flex-1 p-4 space-y-6 overflow-y-auto">
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
            
            <div className="border-t border-gray-800">
              <form onSubmit={handleSubmit} className="p-4 relative">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={loading ? "Processing..." : "Type your message (costs 1 DFCT)..."}
                  className="w-full bg-gray-900/50 text-white rounded-xl pl-4 pr-12 py-3 border border-gray-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !chatInput.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-emerald-400 hover:text-emerald-300 disabled:text-gray-600 disabled:hover:text-gray-600 transition-colors"
                >
                  <Send size={20} />
                </button>
              </form>

              <div className="px-4 pb-4">
                <div className="flex flex-wrap gap-4 items-center bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                  <span className="text-sm text-gray-400">AI Engines:</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedEngines.perplexity}
                        onChange={() => handleEngineChange('perplexity')}
                        className="form-checkbox h-4 w-4 text-emerald-500 rounded border-gray-600 bg-gray-800 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-300">Perplexity</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedEngines.openai}
                        onChange={() => handleEngineChange('openai')}
                        className="form-checkbox h-4 w-4 text-emerald-500 rounded border-gray-600 bg-gray-800 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-300">OpenAI</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedEngines.defacts}
                        onChange={() => handleEngineChange('defacts')}
                        className="form-checkbox h-4 w-4 text-emerald-500 rounded border-gray-600 bg-gray-800 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-300">DeFacts</span>
                    </label>
                  </div>
                </div>
              </div>

              {error && (
                <div className="px-4 pb-4">
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-400">{error}</p>
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

export default ChatAIInput;