// Type definitions for Phantom Wallet
interface Phantom {
    isPhantom?: boolean;
    publicKey?: {
      toString(): string;
    };
    connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{
      publicKey: {
        toString(): string;
      };
    }>;
    disconnect: () => Promise<void>;
    signTransaction: (transaction: any) => Promise<any>;
    signAllTransactions: (transactions: any[]) => Promise<any[]>;
    signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
    on: (event: string, callback: (...args: any[]) => void) => void;
    removeAllListeners: () => void;
  }
  
  interface Window {
    solana?: Phantom;
    phantom?: {
      solana?: Phantom;
    };
  }