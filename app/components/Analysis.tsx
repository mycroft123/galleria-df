"use client";

import React, { useState, useEffect } from 'react';
import { usePersistentView } from '@/app/hooks/usePersistentView';

interface AnalysisState {
  mapId?: string;
  projectId?: string;
}

const NOMIC_MAP_URL = "https://atlas.nomic.ai/data/df-research/english-news-weak-ner/map/e362c1a1-a830-4840-995a-6ea6c2ca5d38#rofF";

const Analysis = () => {
  const { saveViewState, getViewState, isInitialized } = usePersistentView();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Initialize Nomic Atlas if needed
    const initializeMap = async () => {
      try {
        setLoading(true);
        // Load the map in an iframe
        setLoading(false);
      } catch (err) {
        setError('Failed to initialize map');
        console.error('Map initialization error:', err);
      }
    };

    initializeMap();
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
              src={NOMIC_MAP_URL}
              className="w-full h-full border-0"
              allow="fullscreen"
              title="Nomic Atlas Map"
            />
          )}
        </div>

        <div className="mt-4 p-4 bg-black/20 rounded-lg">
          <h3 className="text-lg font-medium text-white mb-2">Map Information</h3>
          <p className="text-sm text-gray-300">
            This visualization shows the USA news data using Nomic Atlas. You can interact with the map
            to explore different regions and data points.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analysis;