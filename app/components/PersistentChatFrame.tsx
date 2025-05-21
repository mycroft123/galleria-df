'use client';

import React, { useRef, useEffect } from 'react';

interface PersistentChatFrameProps {
  isActive: boolean;
}

const PersistentChatFrame: React.FC<PersistentChatFrameProps> = ({ isActive }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Log visibility changes for debugging
  useEffect(() => {
    console.log(`Chat iframe visibility changed: ${isActive ? 'visible' : 'hidden'}`);
  }, [isActive]);

  return (
    <div 
      className={`absolute top-16 left-0 right-0 bottom-0 lg:left-20 ${isActive ? 'block' : 'hidden'}`}
      style={{ zIndex: isActive ? 10 : -1 }} // Ensure iframe is below other content when hidden
    >
      <iframe 
        ref={iframeRef}
        src="https://librechat-production-97e2.up.railway.app/c/new" 
        className="w-full h-full border-0"
        title="DeFacts"
        allow="microphone; camera; geolocation"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
      />
    </div>
  );
};

export default PersistentChatFrame;