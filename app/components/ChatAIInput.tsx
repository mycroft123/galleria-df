"use client";

import React, { useState, useRef, useEffect } from "react";
import { LinkIcon, User, Bot, Send, ChevronDown, ChevronUp } from "lucide-react";
import { Message, ParsedResponse } from "./types";
import { generateDisplayText } from "./helpers";

const API_URL = "http://localhost:3002/api/ai-perplexity";

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
        {/* Message Header */}
        <div className={`flex items-center gap-2 ${
          message.role === 'user' ? 'justify-end' : 'justify-start'
        }`}>
          {message.role === 'assistant' && (
            <div className="flex items-center gap-2">
              <div className="bg-orange-500/20 p-1.5 rounded-lg">
                <Bot size={14} className="text-orange-400" />
              </div>
              <span className="text-orange-400 text-sm font-medium">DeFacts</span>
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
  
        {/* Message Content */}
        <div className={`rounded-xl p-4 ${
          message.role === 'user'
            ? 'bg-purple-500/10 border border-purple-500/20'
            : 'bg-orange-500/10 border border-orange-500/20'
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
  
        {/* Citations Section - Moved below message content */}
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
                  <LinkIcon size={14} className="text-orange-300" />
                </div>
                <span className="text-orange-300 text-sm font-medium">
                  ({message.citations.length}) Web Sources
                </span>
              </div>
              {citationsVisible ?
                <ChevronUp size={16} className="text-orange-300" /> :
                <ChevronDown size={16} className="text-orange-300" />
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
                        className="text-orange-300 hover:text-orange-200 text-sm break-all hover:bg-orange-500/10 p-2 rounded-lg transition-colors flex-grow"
                      >
                        {citation}
                      </a>
                      {mintedAssets[citation] && (
                        <button
                          onClick={() => handleParseUrl(citation)}
                          disabled={parseStatus[citation]?.loading}
                          className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
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
                          id={`solana-explorer-${mintedAssets[citation]}`}
                          aria-label="View NFT metadata on Solana Explorer (opens in new window)"
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
                        <h4 className="text-sm font-medium text-orange-300 mb-2">Parsing Results</h4>
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
                            <p className="text-sm font-medium text-orange-300">Minted Facts:</p>
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
  
    setLoading(true);
    setError("");

    const newMessages = [...chatMessages, { 
      role: 'user', 
      content: chatInput, 
      timestamp: Date.now() 
    }];
    setChatMessages(newMessages);

    try {
      const requestBody = {
        model: defaultModel,
        messages: [
          {
            role: "system",
            content: `You are an assistant that provides responses **ONLY** in pure JSON format as specified below. **Do not** include any markdown, code blocks, explanations, or additional text. Return exactly the JSON structure without any extra characters.
      
      {
         "summary": {
          "mainPoint": "brief conclusion",
          "keyTakeaways": ["takeaway 1", "takeaway 2"]
        },
        "sections": [
          {
            "title": "section title",
            "content": {
              "mainPoint": "primary explanation",
              "details": ["detail point 1", "detail point 2"],
              "subSections": [
                {
                  "title": "subsection title",
                  "content": "subsection explanation"
                }
              ]
            }
          }
        ]
      }`
          },
          {
            role: "user",
            content: chatInput
          }
        ],
      };

      setDebug(`Requesting from AI API\nRequest Body: ${JSON.stringify(requestBody, null, 2)}`);
      
      const response = await fetchWithTimeout(
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setDebug(prev => `${prev}\nResponse: ${JSON.stringify(data, null, 2)}`);

      if (data.choices?.[0]?.message?.content) {
        let rawContent = data.choices[0].message.content;
        rawContent = rawContent.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();

        let parsedContent: ParsedResponse;
        try {
          parsedContent = JSON.parse(rawContent);
        } catch (parseError) {
          console.error("Failed to parse JSON:", rawContent);
          throw new Error("Failed to parse JSON response from the API.");
        }

        const displayText = generateDisplayText(parsedContent);
        const messageIndex = newMessages.length;

        const newMessage: Message = {
          role: 'assistant',
          content: displayText,
          timestamp: Date.now(),
          citations: data.citations || []
        };

        // Automatically mint NFTs for citations
        if (data.citations && data.citations.length > 0) {
          try {
            const mintResponse = await fetch('http://localhost:3002/api/batch-create-nft', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                facts: data.citations.map((url: string) => ({
                  fact: displayText.substring(0, 100) + "...",
                  sourceUrl: url,
                  extractedDate: new Date().toISOString().split('T')[0]
                }))
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
            console.error('Error minting NFTs:', error);
          }
        }

        setChatMessages(prev => [...prev, newMessage]);
        setTypingStates(prev => ({
          ...prev,
          [messageIndex]: {
            isComplete: false,
            displayedContent: ''
          }
        }));
        setChatInput("");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'An unexpected error occurred';
      setError(`Error fetching response: ${errorMessage}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl">
      <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl rounded-xl p-6 shadow-2xl border border-gray-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-3 w-3 rounded-full bg-red-500"></div>
          <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
          <div className="h-3 w-3 rounded-full bg-green-500"></div>
          <div className="text-gray-400 text-sm ml-2">
            {loading ? "Processing..." : error ? "Error" : "Ready"}
          </div>
        </div>

        <div className="bg-gradient-to-b from-gray-900 to-black rounded-lg border border-gray-800">
          <div className="flex flex-col min-h-[600px]">
            <div className="flex-1 p-4 space-y-6">
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
                  placeholder="Type your message..."
                  className="w-full bg-gray-900/50 text-white rounded-xl pl-4 pr-12 py-3 border border-gray-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !chatInput.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-orange-400 hover:text-orange-300 disabled:text-gray-600 disabled:hover:text-gray-600 transition-colors"
                >
                  <Send size={20} />
                </button>
              </form>

              {error && (
                <div className="px-4 pb-4">
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                </div>
              )}

              {debug && (
                <div className="border-t border-gray-800">
                  <button
                    onClick={() => setIsDebugVisible(!isDebugVisible)}
                    className="w-full p-2 flex items-center justify-between text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    <span className="text-sm font-medium">Debug Information</span>
                    {isDebugVisible ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {isDebugVisible && (
                    <div className="px-4 pt-2 pb-6 bg-orange-500/10 border-t border-orange-500/20">
                      <pre className="text-xs text-gray-400 whitespace-pre-wrap">
                        {debug}
                      </pre>
                    </div>
                  )}
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