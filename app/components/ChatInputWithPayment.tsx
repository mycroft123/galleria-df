import React, { useState, useRef, useEffect } from 'react';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { createTransferInstruction } from '@solana/spl-token';
import { Send } from 'lucide-react';

const TREASURY_ADDRESS = 'ExK2ZcWx6tpVe5xfqkHZ62bMQNpStLj98z2WDUWKUKGp';
const DFCT_TOKEN_ADDRESS = '8mTDKt6gY1DatZDKbvMCdiw4AZRdCpUjxuRv4GRBg2Xn';

const ChatInputWithPayment = ({ 
  connection,
  isConnected,
  tokenBalance,
  onSubmit 
}) => {
  const [chatInput, setChatInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handlePaymentAndSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    if (!window.solana?.isPhantom) {
      setError('Phantom wallet not found');
      return;
    }

    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!tokenBalance || tokenBalance < 1) {
      setError('Insufficient DFCT balance');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const wallet = window.solana;
      
      // Get user's token account
      const userTokenAccounts = await connection.getParsedTokenAccountsByOwner(
        wallet.publicKey,
        { mint: new PublicKey(DFCT_TOKEN_ADDRESS) }
      );

      if (userTokenAccounts.value.length === 0) {
        throw new Error('No DFCT token account found');
      }

      // Get treasury's token account
      const treasuryPubkey = new PublicKey(TREASURY_ADDRESS);
      const treasuryTokenAccounts = await connection.getParsedTokenAccountsByOwner(
        treasuryPubkey,
        { mint: new PublicKey(DFCT_TOKEN_ADDRESS) }
      );

      if (treasuryTokenAccounts.value.length === 0) {
        throw new Error('Treasury token account not found');
      }

      // Create transfer instruction
      const transferInstruction = createTransferInstruction(
        userTokenAccounts.value[0].pubkey,
        treasuryTokenAccounts.value[0].pubkey,
        wallet.publicKey,
        1 * Math.pow(10, 9) // 1 token with 9 decimals
      );

      const transaction = new Transaction().add(transferInstruction);
      transaction.feePayer = wallet.publicKey;
      transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

      // Sign and send transaction
      const signed = await wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(signature);

      // If payment successful, proceed with the query
      await onSubmit(chatInput);
      setChatInput('');

    } catch (err) {
      console.error('Payment/submission error:', err);
      setError(err.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="border-t border-gray-800">
      <form onSubmit={handlePaymentAndSubmit} className="p-4 relative">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder={isProcessing ? "Processing payment..." : "Type your message (costs 1 DFCT)..."}
          className="w-full bg-gray-900/50 text-white rounded-xl pl-4 pr-12 py-3 border border-gray-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
          disabled={isProcessing}
        />
        <button
          type="submit"
          disabled={isProcessing || !chatInput.trim() || !isConnected || !tokenBalance || tokenBalance < 1}
          className={`absolute right-6 top-1/2 -translate-y-1/2 p-2 ${
            isProcessing || !chatInput.trim() || !isConnected || !tokenBalance || tokenBalance < 1
              ? 'text-gray-600 cursor-not-allowed'
              : 'text-orange-400 hover:text-orange-300'
          } transition-colors`}
        >
          <Send size={20} />
        </button>
      </form>

      {error && (
        <div className="px-4 pb-4">
          <div className="rounded-full bg-red-500/10 px-3 py-1 text-sm font-semibold text-red-400 ring-1 ring-inset ring-red-500/20">
            {error}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInputWithPayment;