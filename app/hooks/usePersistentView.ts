"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export const usePersistentView = (defaultView: string = 'tokens') => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentView, setCurrentView] = useState<string>(defaultView);
  const [viewStates, setViewStates] = useState<{[key: string]: any}>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize state from localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || isInitialized) return;

    try {
      // Load saved view states
      const savedStates = localStorage.getItem('viewStates');
      if (savedStates) {
        const parsed = JSON.parse(savedStates);
        console.log('Loaded states:', parsed); // Debug log
        setViewStates(parsed);
      }

      // Handle view restoration
      const urlView = searchParams.get('view');
      const savedView = localStorage.getItem('currentView');

      if (urlView) {
        setCurrentView(urlView);
        localStorage.setItem('currentView', urlView);
      } else if (savedView) {
        setCurrentView(savedView);
        const walletAddress = window.location.pathname.split('/')[2];
        if (walletAddress) {
          router.push(`/portfolio/${walletAddress}?view=${savedView}`);
        }
      }

      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing view states:', error);
      setIsInitialized(true);
    }
  }, [router, searchParams, isInitialized, defaultView]);

  const saveViewState = (view: string, state: any) => {
    try {
      setViewStates(prev => {
        const newStates = {
          ...prev,
          [view]: state
        };
        console.log('Saving states:', newStates); // Debug log
        localStorage.setItem('viewStates', JSON.stringify(newStates));
        return newStates;
      });
    } catch (error) {
      console.error('Error saving view state:', error);
    }
  };

  const getViewState = (view: string) => {
    try {
      return viewStates[view] || null;
    } catch (error) {
      console.error('Error getting view state:', error);
      return null;
    }
  };

  const changeView = (newView: string, walletAddress: string) => {
    setCurrentView(newView);
    localStorage.setItem('currentView', newView);
    router.push(`/portfolio/${walletAddress}?view=${newView}`);
  };

  return {
    currentView,
    changeView,
    saveViewState,
    getViewState,
    isInitialized
  };
};