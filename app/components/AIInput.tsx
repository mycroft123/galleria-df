"use client";

import React, { useState, useEffect } from "react";

interface AIEngine {
  id: string;
  name: string;
}

interface Strategy {
  source: string;
  searchTerm: string;
}

interface AIResponse {
  success: boolean;
  strategies?: string[];
  response?: string;
  error?: string;
}

const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
    return "https://galleria-df-backend-1hopzcdyd-mycroft123s-projects.vercel.app/api";
  }
  return "http://localhost:3002/api";
};

const API_URL = getApiUrl();

// Rest of your component code remains the same...

const AIInput: React.FC = () => {
  const [question, setQuestion] = useState<string>("");
  const [selectedEngine, setSelectedEngine] = useState<string>("gpt4");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [debug, setDebug] = useState<string>("");
  const [strategies, setStrategies] = useState<string[] | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [finalResults, setFinalResults] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'question' | 'strategy' | 'results'>('question');

  const aiEngines: AIEngine[] = [
    { id: "gpt4", name: "ChatGPT 4.0" },
    { id: "claude", name: "Claude 3.5" },
    { id: "gemini", name: "Gemini 2.0" },
    { id: "grok", name: "Grok 2.0" },
  ];

  const fetchWithTimeout = async (url: string, options: RequestInit, timeout: number = 30000) => {
    const controller = new AbortController();
    const { signal } = controller;
    
    const timeoutPromise = new Promise((_, reject) => {
      const timeoutId = setTimeout(() => {
        controller.abort();
        reject(new Error('Request timed out'));
      }, timeout);

      signal.addEventListener('abort', () => clearTimeout(timeoutId));
    });

    try {
      const fetchPromise = fetch(url, {
        ...options,
        signal,
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);
      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  };

  const parseStrategies = (rawStrategies: string[]): Strategy[] => {
    try {
      if (!rawStrategies || rawStrategies.length === 0) {
        return [];
      }
  
      // Join all parts of the strategy array back together
      const completeJsonStr = rawStrategies.join("");
      
      // Parse the complete JSON array
      const strategies = JSON.parse(completeJsonStr);
  
      // Map to our Strategy interface
      return strategies.map((strategy: { source: string; searchTerms: string[] }) => ({
        source: strategy.source,
        searchTerm: Array.isArray(strategy.searchTerms) ? strategy.searchTerms.join(", ") : strategy.searchTerms
      }));
  
    } catch (error) {
      console.error("Error parsing strategies:", error);
      return [];
    }
  };

  const handleGetStrategies = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setDebug("");
    setStrategies(null);
    setSelectedStrategy(null);
    setFinalResults(null);

    try {
      const requestBody = { question };
      setDebug(`Requesting strategies from: ${API_URL}/ai-strategy\nRequest Body: ${JSON.stringify(requestBody, null, 2)}`);
      
      const response = await fetchWithTimeout(
        `${API_URL}/ai-strategy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(requestBody),
        },
        30000
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AIResponse = await response.json();
      setDebug(prev => `${prev}\nResponse: ${JSON.stringify(data, null, 2)}`);

      if (data.success && data.strategies) {
        // Store the raw strategies
        setStrategies(data.strategies);
        
        // Parse strategies immediately to verify they're valid
        const parsedStrategies = parseStrategies(data.strategies);
        if (parsedStrategies.length > 0) {
          setSelectedStrategy(parsedStrategies[0]);
          setActiveTab('strategy');
        } else {
          throw new Error("No valid strategies found in response");
        }
      } else {
        throw new Error(data.error || "No strategies returned");
      }
    } catch (err) {
      console.error("Error in handleGetStrategies:", err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'An unexpected error occurred';
      setError(`Error fetching strategies: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStrategy) return;

    setLoading(true);
    setError("");
    setFinalResults(null);

    try {
      const response = await fetchWithTimeout(
        `${API_URL}/ai-query`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            question,
            engine: selectedEngine,
            strategy: selectedStrategy,
          }),
        },
        30000
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setFinalResults(data.response);
        setActiveTab('results');
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'An unexpected error occurred';
      setError(`Error processing query: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (strategies && strategies.length > 0) {
      const parsedStrategies = parseStrategies(strategies);
      if (parsedStrategies.length > 0) {
        setSelectedStrategy(parsedStrategies[0]);
      }
    }
  }, [strategies]);

  return (
    <div className="w-full max-w-5xl">
      <div className="bg-black/30 backdrop-blur-sm rounded-lg p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-6">
          Find DeFacts - AI Ingestion Assistant - URL
        </h2>

        <div className="mb-4 text-sm text-gray-300">
          Service status: {loading ? "Processing..." : error ? "Error" : "Ready"}
        </div>

        <div className="tabs tabs-lifted">
          <a 
            className={`tab ${activeTab === 'question' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('question')}
          >
            Question Input
          </a>
          <a 
            className={`tab ${activeTab === 'strategy' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('strategy')}
            disabled={!strategies}
          >
            Select Strategy
          </a>
          <a 
            className={`tab ${activeTab === 'results' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('results')}
            disabled={!finalResults}
          >
            Results
          </a>
        </div>

        <div className="p-4 bg-base-200 rounded-b-box">
          {activeTab === 'question' && (
            <form onSubmit={handleGetStrategies} className="space-y-4">
              <div>
                <label htmlFor="engine" className="block text-sm font-medium text-gray-300 mb-2">
                  Select AI Engine
                </label>
                <select
                  id="engine"
                  value={selectedEngine}
                  onChange={(e) => setSelectedEngine(e.target.value)}
                  className="select select-bordered w-full bg-black/20 text-white"
                  disabled={loading}
                >
                  {aiEngines.map((engine) => (
                    <option key={engine.id} value={engine.id}>
                      {engine.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="question" className="block text-sm font-medium text-gray-300 mb-2">
                  Ask a Question
                </label>
                <textarea
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Enter your question here..."
                  className="textarea textarea-bordered w-full min-h-[100px] bg-black/20 text-white"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !question}
                className="btn btn-primary w-full"
              >
                {loading ? "Processing..." : "Get AI Strategies"}
              </button>
            </form>
          )}

{activeTab === 'strategy' && strategies && (
  <form onSubmit={handleSubmitStrategy} className="space-y-4">
    <div className="space-y-2">
      {parseStrategies(strategies).map((strategy, index) => (
        <label
          key={index}
          className={`block p-4 border rounded-lg cursor-pointer transition-all ${
            JSON.stringify(selectedStrategy) === JSON.stringify(strategy)
              ? "bg-orange-500/20 border-orange-500"
              : "bg-gray-800 border-gray-600 hover:bg-gray-700 hover:border-gray-400"
          }`}
        >
          <div className="flex items-start gap-4">
            <input
              type="radio"
              name="strategy"
              className="hidden"
              checked={JSON.stringify(selectedStrategy) === JSON.stringify(strategy)}
              onChange={() => setSelectedStrategy(strategy)}
            />
            <div className="flex-1">
              <div className="font-semibold text-white">Source:</div>
              <div className="text-gray-300 mb-2">{strategy.source}</div>
              <div className="font-semibold text-white">Search Terms:</div>
              <div className="text-gray-300">{strategy.searchTerm}</div>
            </div>
          </div>
        </label>
      ))}
    </div>
    <button
      type="submit"
      disabled={loading || !selectedStrategy}
      className="btn btn-warning w-full mt-6"
    >
      {loading ? "Processing..." : "Apply Selected Strategy"}
    </button>
  </form>
)}

          {activeTab === 'results' && finalResults && (
            <div className="bg-black/20 border border-white/20 rounded-lg p-4">
              <h3 className="text-white font-medium mb-2">Final Response:</h3>
              <div className="text-gray-300 whitespace-pre-wrap">
                {finalResults}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="alert alert-error mt-4">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {debug && (
          <div className="alert alert-info mt-4">
            <pre className="text-xs whitespace-pre-wrap">
              Debug Information:
              {debug}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInput;