"use client";

import React, { useState } from "react";

interface PerplexityResponse {
  success: boolean;
  response?: string;
  citations?: string[];
  error?: string;
  choices?: Array<{
    message: {
      content: string;
    };
  }>;
}

const getApiUrl = () => {
  // In development, use localhost
  if (process.env.NODE_ENV === 'development') {
    return "http://localhost:3002/api";
  }
  // In all other cases (including production), use the Vercel URL
  return "https://galleria-df-backend-1hopzcdyd-mycroft123s-projects.vercel.app/api";
};

const API_URL = `${getApiUrl()}/ai-perplexity`;

// Rest of your code remains the same...

// Function to convert markdown to HTML
const convertMarkdownToHtml = (markdown: string): string => {
  // Handle bold text
  let html = markdown.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Handle italic text
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Handle code blocks
  html = html.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
  
  // Handle inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Handle headings
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  
  // Handle lists
  html = html.replace(/^\s*[-*+]\s+(.*)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  // Handle numbered lists
  html = html.replace(/^\d+\.\s+(.*)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');
  
  // Handle paragraphs
  html = html.split('\n\n').map(para => 
    para.trim().startsWith('<') ? para : `<p>${para}</p>`
  ).join('');
  
  return html;
};

const PAIInput: React.FC = () => {
  const [question, setQuestion] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [debug, setDebug] = useState<string>("");
  const [response, setResponse] = useState<PerplexityResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'question' | 'results'>('question');
  const [selectedSources, setSelectedSources] = useState<Set<number>>(new Set());

  const defaultModel = "llama-3.1-sonar-small-128k-online";

  const handleSourceToggle = (index: number) => {
    setSelectedSources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleLogFacts = () => {
    const selectedCitations = Array.from(selectedSources).map(index => 
      response?.citations?.[index]
    ).filter(Boolean);
    
    console.log('Logging facts from sources:', selectedCitations);
  };

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

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setDebug("");
    setResponse(null);
    setSelectedSources(new Set());

    try {
      const requestBody = {
        model: defaultModel,
        messages: [
          {
            role: "system",
            content: "Be precise and concise."
          },
          {
            role: "user",
            content: question
          }
        ],
        temperature: 0.2,
        top_p: 0.9,
        search_domain_filter: ["perplexity.ai"],
        return_images: false,
        return_related_questions: false,
        search_recency_filter: "month",
        top_k: 0,
        stream: false,
        presence_penalty: 0,
        frequency_penalty: 1
      };

      setDebug(`Requesting from Perplexity API\nRequest Body: ${JSON.stringify(requestBody, null, 2)}`);
      
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

      if (data.choices?.[0]?.message) {
        setResponse({
          success: true,
          response: data.choices[0].message.content,
          citations: data.citations || []
        });
        setActiveTab('results');
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Error in handleSubmitQuestion:", err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'An unexpected error occurred';
      setError(`Error fetching response: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl">
      <div className="bg-black/30 backdrop-blur-sm rounded-lg p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-6">
          Get DeFacts AI Assistant
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
            className={`tab ${activeTab === 'results' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('results')}
            disabled={!response}
          >
            Results & Sources
          </a>
        </div>

        <div className="p-4 bg-base-200 rounded-b-box">
          {activeTab === 'question' && (
            <form onSubmit={handleSubmitQuestion} className="space-y-4">
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
                {loading ? "Processing..." : "Get Answer"}
              </button>
            </form>
          )}

          {activeTab === 'results' && response && (
            <div className="space-y-4">
              <div className="bg-black/20 border border-white/20 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">Response:</h3>
                <div 
                  className="text-gray-300 prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: convertMarkdownToHtml(response.response || '') 
                  }}
                />
              </div>
              
              {response.citations && response.citations.length > 0 && (
                <div className="bg-black/20 border border-white/20 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2">Sources:</h3>
                  <div className="space-y-2">
                    {response.citations.map((citation, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id={`source-${index}`}
                          checked={selectedSources.has(index)}
                          onChange={() => handleSourceToggle(index)}
                          className="checkbox checkbox-sm"
                        />
                        <label 
                          htmlFor={`source-${index}`}
                          className="text-blue-400 hover:text-blue-300 cursor-pointer flex-1"
                        >
                          <a href={citation} target="_blank" rel="noopener noreferrer">
                            {citation}
                          </a>
                        </label>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4">
                    <button
                      onClick={handleLogFacts}
                      disabled={selectedSources.size === 0}
                      className={`btn btn-primary w-full ${selectedSources.size === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Log Facts
                    </button>
                  </div>
                </div>
              )}
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

export default PAIInput;