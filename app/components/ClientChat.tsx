// /app/components/ClientChat.tsx
"use client";

import React from 'react';
import { WalletProvider } from '@/app/providers/WalletProvider';
import ChatAIInput from './ChatAIInput';

export default function ClientChat() {
  // Log to confirm this component is rendering
  console.log('ClientChat component rendering');
  
  return (
    <WalletProvider>
      <ChatAIInput />
    </WalletProvider>
  );
}