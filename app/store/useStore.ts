// /app/store/useStore.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { FungibleToken, NonFungibleToken } from '@/app/types'

interface Store {
  // View state
  currentView: string
  viewMode: 'grid' | 'table'
  setView: (view: string) => void
  setViewMode: (mode: 'grid' | 'table') => void
  
  // Pagination
  currentPage: number
  setCurrentPage: (page: number) => void
  
  // Modal state
  selectedNFT: NonFungibleToken | null
  selectedToken: FungibleToken | null
  setSelectedNFT: (nft: NonFungibleToken | null) => void
  setSelectedToken: (token: FungibleToken | null) => void

  // Filter state
  textFilter: string
  setTextFilter: (filter: string) => void
  
  // NFT Data
  localNFTData: NonFungibleToken[]
  setLocalNFTData: (data: NonFungibleToken[]) => void
  
  // Loading states
  isRefreshing: boolean
  setIsRefreshing: (state: boolean) => void
  error: string | null
  setError: (error: string | null) => void

  // Sorting
  sortConfig: {
    key: string | null
    direction: 'asc' | 'desc'
  }
  setSortConfig: (config: { key: string | null; direction: 'asc' | 'desc' }) => void

  // Group expansion
  expandedGroups: { [key: string]: boolean }
  toggleGroup: (symbol: string) => void

  // Reset state
  resetState: () => void
}

const initialState = {
  currentView: 'nfts',
  viewMode: 'table', // Default to table view
  currentPage: 1,
  selectedNFT: null,
  selectedToken: null,
  textFilter: '',
  localNFTData: [],
  isRefreshing: false,
  error: null,
  sortConfig: {
    key: null,
    direction: 'asc'
  },
  expandedGroups: {}
};

// Helper function to get stored value with type safety
const getStoredValue = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  const stored = sessionStorage.getItem(key);
  if (!stored) return defaultValue;
  try {
    return JSON.parse(stored) as T;
  } catch {
    return defaultValue;
  }
};

export const useStore = create<Store>()(
  devtools(
    (set) => ({
      ...initialState,
      
      // View state
      setView: (view) => {
        set({ currentView: view }, false, 'setView');
        sessionStorage.setItem('currentView', view);
      },
      setViewMode: (mode) => {
        set({ viewMode: mode }, false, 'setViewMode');
        sessionStorage.setItem('viewMode', mode);
      },

      // Pagination
      setCurrentPage: (page) => {
        set({ currentPage: page }, false, 'setCurrentPage');
        sessionStorage.setItem('currentPage', String(page));
      },

      // Modal state
      setSelectedNFT: (nft) => set({ selectedNFT: nft }, false, 'setSelectedNFT'),
      setSelectedToken: (token) => set({ selectedToken: token }, false, 'setSelectedToken'),

      // Filter state
      setTextFilter: (filter) => {
        set({ textFilter: filter }, false, 'setTextFilter');
        sessionStorage.setItem('textFilter', filter);
      },
      
      // NFT Data
      setLocalNFTData: (data) => set({ localNFTData: data }, false, 'setLocalNFTData'),

      // Loading states
      setIsRefreshing: (state) => set({ isRefreshing: state }, false, 'setIsRefreshing'),
      setError: (error) => set({ error }, false, 'setError'),

      // Sorting
      setSortConfig: (config) => {
        set({ sortConfig: config }, false, 'setSortConfig');
        sessionStorage.setItem('sortConfig', JSON.stringify(config));
      },

      // Group expansion
      toggleGroup: (symbol) => {
        set(
          (state) => ({
            expandedGroups: {
              ...state.expandedGroups,
              [symbol]: !state.expandedGroups[symbol]
            }
          }),
          false,
          'toggleGroup'
        );
      },

      // Reset state
      resetState: () => {
        sessionStorage.clear();
        set(initialState, false, 'resetState');
      },
    }),
    {
      name: 'portfolio-store',
      enabled: process.env.NODE_ENV === 'development'
    }
  )
);

// Initialize store with persisted values
if (typeof window !== 'undefined') {
  const storedView = getStoredValue<string>('currentView', initialState.currentView);
  const storedViewMode = getStoredValue<'grid' | 'table'>('viewMode', initialState.viewMode);
  const storedPage = getStoredValue<number>('currentPage', initialState.currentPage);
  const storedFilter = getStoredValue<string>('textFilter', initialState.textFilter);
  const storedSortConfig = getStoredValue(
    'sortConfig',
    initialState.sortConfig
  );

  useStore.setState({
    currentView: storedView,
    viewMode: storedViewMode,
    currentPage: storedPage,
    textFilter: storedFilter,
    sortConfig: storedSortConfig,
  });
}