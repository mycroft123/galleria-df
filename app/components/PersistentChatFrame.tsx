'use client';

import React, { useRef, useEffect } from 'react';

interface PersistentChatFrameProps {
  isActive: boolean;
}

const PersistentChatFrame: React.FC<PersistentChatFrameProps> = ({ isActive }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Log visibility changes for debugging
  useEffect(() => {
    console.log(`Chat iframe visibility changed: ${isActive ? 'visible' : 'hidden'}`);
  }, [isActive]);

  // Mobile iframe positioning fix
  useEffect(() => {
    const adjustIframePosition = () => {
      const iframe = iframeRef.current;
      const container = containerRef.current;
      
      if (iframe && container && isActive) {
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

  return (
    <div 
      ref={containerRef}
      className={`librechat-iframe-container ${isActive ? 'block' : 'hidden'}`}
      style={{ 
        position: 'fixed',
        top: '64px', // Account for your header height
        left: '0',
        right: '0',
        bottom: '0',
        marginLeft: typeof window !== 'undefined' && window.innerWidth >= 1024 ? '80px' : '0', // lg:left-20 equivalent
        zIndex: isActive ? 10 : -1,
        overflow: 'hidden',
        WebkitOverflowScrolling: 'touch',
        transform: 'translateZ(0)',
        margin: '0',
        padding: '0',
        border: 'none',
        outline: 'none',
      }}
    >
      <iframe 
        ref={iframeRef}
        src="https://librechat-production-97e2.up.railway.app/c/new" 
        className="librechat-iframe"
        title="DeFacts"
        allow="microphone; camera; geolocation"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
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
        @media screen and (max-width: 768px) {
          .librechat-iframe-container {
            top: 64px !important; /* Keep same as desktop for now */
            margin-left: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            outline: none !important;
          }
        }
        
        /* iOS Safari specific fixes */
        @media screen and (max-width: 768px) and (-webkit-min-device-pixel-ratio: 1) {
          .librechat-iframe-container {
            top: 64px !important; /* Match desktop */
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