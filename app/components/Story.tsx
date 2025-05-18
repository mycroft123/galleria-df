"use client";

import React, { useState, useEffect } from 'react';
import { usePersistentView } from '@/app/hooks/usePersistentView';

const STORY_URL = "https://www.nomic.ai/blog/posts/atlas-story-congressional-tweets";

const Story = () => {
  const { saveViewState, getViewState, isInitialized } = usePersistentView();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleScroll = () => {
    try {
      const iframe = document.querySelector('iframe');
      if (iframe && iframe.contentWindow) {
        // Try multiple approaches
        // 1. Using postMessage
        iframe.contentWindow.postMessage({ 
          type: 'SCROLL_TO', 
          top: 1000,
          behavior: 'smooth'
        }, '*');

        // 2. Direct scrolling attempt
        iframe.contentWindow.scrollTo({
          top: 1000,
          behavior: 'smooth'
        });

        // 3. Using scrollBy as fallback
        iframe.contentWindow.scrollBy({
          top: 500,
          behavior: 'smooth'
        });
      }
    } catch (err) {
      console.error('Scroll failed:', err);
    }
  };

  useEffect(() => {
    const initializeStory = async () => {
      try {
        setLoading(true);
        setLoading(false);
      } catch (err) {
        setError('Failed to load story');
        console.error('Story loading error:', err);
      }
    };

    initializeStory();
  }, []);

  if (!isInitialized) {
    return <div className="w-full h-full flex items-center justify-center">
      <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-white"></div>
    </div>;
  }

  return (
    <div className="w-full h-full">
      <div className="bg-black/30 backdrop-blur-sm rounded-lg p-8 shadow-lg h-full">
       

        <div className="relative w-full h-[calc(100vh-200px)] bg-black/20 rounded-lg overflow-hidden">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-white"></div>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-red-400">{error}</p>
            </div>
          ) : (
            <iframe
              src={STORY_URL}
              className="w-full h-full border-0"
              allow="fullscreen"
              title="Congressional Tweets Story"
            />
          )}
        </div>

        
      </div>
    </div>
  );
};

export default Story;