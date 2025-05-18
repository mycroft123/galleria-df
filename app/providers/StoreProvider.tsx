'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { useStore } from "@/app/store/useStore";

interface Props {
  children: ReactNode;
}

export default function StoreProvider({ children }: Props) {
  const hydrated = useRef(false);
  const initialState = useStore((state) => state);

  useEffect(() => {
    // Perform hydration check and state initialization only once
    if (!hydrated.current) {
      hydrated.current = true;
      
      // If initialState exists, set it in the store
      if (initialState) {
        const savedState = sessionStorage.getItem('portfolio-store');
        if (savedState) {
          try {
            const parsedState = JSON.parse(savedState);
            Object.keys(parsedState).forEach(key => {
              useStore.setState({ [key]: parsedState[key] });
            });
          } catch (e) {
            console.error('Failed to parse stored state:', e);
          }
        }
      }
    }
  }, [initialState]);

  return children;
}