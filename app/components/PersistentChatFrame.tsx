'use client';

import React, { useRef, useEffect, useState } from 'react';

interface PersistentChatFrameProps {
  isActive: boolean;
}

const PersistentChatFrame: React.FC<PersistentChatFrameProps> = ({ isActive }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [iframeError, setIframeError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Log visibility changes for debugging
  useEffect(() => {
    console.log(`Chat iframe visibility changed: ${isActive ? 'visible' : 'hidden'}`);
  }, [isActive]);

  // Handle iframe load events
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      console.log('Iframe loaded successfully');
      setIsLoading(false);
      setIframeError(false);
    };

    const handleError = () => {
      console.error('Iframe failed to load');
      setIframeError(true);
      setIsLoading(false);
    };

    iframe.addEventListener('load', handleLoad);
    iframe.addEventListener('error', handleError);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      iframe.removeEventListener('error', handleError);
    };
  }, []);

  // Mobile iframe positioning fix
  useEffect(() => {
    const adjustIframePosition = () => {
      const iframe = iframeRef.current;
      const container = containerRef.current;
      
      if (iframe && container && isActive) {
        // Update container position based on current sidebar width
        const sidebarWidth = getSidebarWidth();
        container.style.left = sidebarWidth;
        
        // Force iframe to recalculate position on mobile
        iframe.style.height = '99%';
        setTimeout(() => {
          iframe.style.height = '100%';
        }, 10);
      }
    };

    // Handle mobile orientation changes and resize events
    const handleOrientationChange = () => {
      setTimeout(adjustIframePosition, 100);
    };

    const handleResize = () => {
      adjustIframePosition();
    };

    // Add event listeners
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleResize);
    
    // Initial adjustment when component becomes active
    if (isActive) {
      setTimeout(adjustIframePosition, 100);
    }
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleResize);
    };
  }, [isActive]);

  // Calculate proper sidebar width based on your actual sidebar
  const getSidebarWidth = () => {
    if (typeof window === 'undefined') return '0';
    
    // Your sidebar is lg:w-20 (80px) and only visible on lg+ screens
    if (window.innerWidth >= 1024) {
      return '80px'; // This matches your lg:w-20 class
    }
    return '0';
  };

  // Handle iframe error with retry
  const handleRetry = () => {
    setIsLoading(true);
    setIframeError(false);
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`librechat-iframe-container ${isActive ? 'block' : 'hidden'}`}
      style={{ 
        position: 'fixed',
        top: '64px', // Account for your header height
        left: getSidebarWidth(), // Use proper sidebar width
        right: '0',
        bottom: '0',
        zIndex: isActive ? 40 : -1, // Changed from 10 to 40 to match your header's z-40
        overflow: 'hidden',
        WebkitOverflowScrolling: 'touch',
        transform: 'translateZ(0)',
        margin: '0',
        padding: '0',
        border: 'none',
        outline: 'none',
      }}
    >
      {/* Loading indicator */}
      {isLoading && isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading DeFacts...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {iframeError && isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">Failed to load DeFacts</p>
            <button 
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <iframe 
        ref={iframeRef}
        src={isActive ? "https://chat.defacts.ai/c/new" : "about:blank"}
        className="defacts-iframe"
        title="DeFacts"
        allow="autoplay; microphone; camera; geolocation; fullscreen; clipboard-read; clipboard-write"
        allowFullScreen
        // Remove sandbox attribute completely to allow full functionality
        // If you must use sandbox, use the most permissive settings:
        // sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-storage-access-by-user-activation allow-downloads allow-presentation allow-top-navigation allow-top-navigation-by-user-activation"
        
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: isActive ? 'block' : 'none',
          position: 'absolute',
          top: '0',
          left: '0',
          transform: 'translate3d(0,0,0)',
          willChange: 'transform',
          overscrollBehavior: 'contain',
          WebkitTransform: 'translateZ(0)',
        }}
      />
      
      {/* Add CSS for mobile-specific fixes */}
      <style jsx>{`
        @media screen and (max-width: 1024px) {
          .librechat-iframe-container {
            left: 0 !important; /* No sidebar on mobile */
            top: 64px !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            outline: none !important;
          }
        }
        
        /* iOS Safari specific fixes */
        @media screen and (max-width: 768px) and (-webkit-min-device-pixel-ratio: 1) {
          .librechat-iframe-container {
            left: 0 !important;
            top: 64px !important;
            position: fixed !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
          }
          
          .librechat-iframe {
            -webkit-transform: translateZ(0) !important;
            transform: translateZ(0) !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PersistentChatFrame;