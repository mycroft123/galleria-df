'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Loader2, CheckCircle, Clock, UserCheck, ExternalLink, ChevronDown as DropdownIcon, X } from 'lucide-react';
import { NonFungibleToken } from "@/app/types";
import NFTDetails from './NFTDetails';

// Define mining status types
type MiningState = 'open_request' | 'mining_in_progress' | 'mining_complete';

// Define time filter options
type TimeFilter = 'hour' | 'day' | 'week' | 'all';

// Define tab options
type TabOption = 'open_requests' | 'in_progress' | 'mining_complete';

// Color to image map for SVG icons
const COLOR_TO_IMAGE_MAP = {
  blue: "https://rim3qi36iu6y55tmt77rm7w3ved7cpdjjrhty2kl3tplkez3drmq.arweave.net/ihm4I35FPY72bJ__Fn7bqQfxPGlMTzxpS9zetRM7HFk",
  yellow: "https://w6hav65sf2mc3do4yxsgex3rfupnngahqfibv7lphwvgisf7cfua.arweave.net/t44K-7IumC2N3MXkYl9xLR7WmAeBUBr9bz2qZEi_EWg",
  orange: "https://z325ctfzpasszfceuep3x4mv33dncyszsb2gcbg67rjljiguchba.arweave.net/zvXRTLl4JSyURKEfu_GV3sbRYlmQdGEE3vxStKDUEcI",
  purple: "https://vcbkxb2o4tbqmi3watpcr7smrk3sviqiibvqbzj443qxh7ltgzbq.arweave.net/qIKrh07kwwYjdgTeKP5MircqoghAawDlPObhc_1zNkM",
  green: "https://imauscty4e4ddllrj32jcna2gei5xpgigjxgplkbugqoceyo2j2q.arweave.net/QwFJCnjhODGtcU70kTQaMRHbvMgybmetQaGg4RMO0nU",
  red: "https://tczw6pw6uivwwld5pas5bfaxcjhd5ssfndhu6eoqynggvehj2aua.arweave.net/mLNvPt6iK2ssfXgl0JQXEk4-ykVoz08R0MNMapDp0Cg"
};

interface OFactTableViewProps {
  walletAddress: string;
  onNFTSelected?: (nftId: string, nftType: 'ofact' | 'afact') => void;
}

// Interface for AFACT structure returned from API
interface AFact {
  mintId: string;
  fact: string;
  sourceUrl: string;
  extractedDate: string;
}

// Type for the detail popup content
type DetailPopupContent = {
  type: 'nft' | 'afact';
  nft?: NonFungibleToken;
  afact?: AFact;
  parent?: NonFungibleToken; // Parent NFT for afacts
}

const OFactTableView: React.FC<OFactTableViewProps> = ({ walletAddress }) => {
  const [nfts, setNfts] = useState<NonFungibleToken[]>([]);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNFT, setSelectedNFT] = useState<NonFungibleToken | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Add time filter state
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  // Add active tab state
  const [activeTab, setActiveTab] = useState<TabOption>('open_requests');
  
  // Mining state management
  const [miningState, setMiningState] = useState<{ [key: string]: MiningState }>({});
  const [minerNames, setMinerNames] = useState<{ [key: string]: string }>({});
  const [progressPercent, setProgressPercent] = useState<{ [key: string]: number }>({});
  const [extractedFacts, setExtractedFacts] = useState<{ [key: string]: AFact[] }>({});
  const [expandedOfacts, setExpandedOfacts] = useState<{ [key: string]: boolean }>({});
  const [pollingIntervals, setPollingIntervals] = useState<{ [key: string]: NodeJS.Timeout }>({});
  const [miningErrors, setMiningErrors] = useState<{ [key: string]: string }>({});
  const [statusCheckFailures, setStatusCheckFailures] = useState<{ [key: string]: number }>({});
  
  // Add state for the detailed popup
  const [detailPopup, setDetailPopup] = useState<DetailPopupContent | null>(null);
  
  // Helper function to format date for display
  const formatAFactDate = (dateString: string): string => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  const formatDate = (nft: NonFungibleToken): string => {
    const foundDates: Record<string, string> = {};
    
    const lifecycleMintDate = nft.lifecycle?.minted?.timestamp;
    const tokenMintDate = nft.tokenInfo?.mintTimestamp;
    const attributeMintDate = nft.content?.metadata?.attributes?.find(attr => attr.trait_type === 'Mint Date')?.value;
    const attributeCreationDate = nft.content?.metadata?.attributes?.find(attr => attr.trait_type === 'Creation Date')?.value;
    
    if (lifecycleMintDate) foundDates.lifecycle = lifecycleMintDate;
    if (tokenMintDate) foundDates.token = tokenMintDate;
    if (attributeMintDate) foundDates.mintDate = attributeMintDate;
    if (attributeCreationDate) foundDates.creationDate = attributeCreationDate;

    const dateToUse = attributeMintDate || attributeCreationDate || lifecycleMintDate || tokenMintDate;
    return dateToUse ? new Date(dateToUse).toLocaleString() : 'No date available';
  };

  const fetchOFactNFTs = async () => {
    if (!walletAddress) {
      setError('No wallet address provided');
      setLoading(false);
      return;
    }
  
    const rpcUrl = process.env.NEXT_PUBLIC_HELIUS_RPC_URL;
    const apiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
    
    if (!rpcUrl || !apiKey) {
      setError('Helius configuration not complete');
      setLoading(false);
      return;
    }

    const baseUrl = `${rpcUrl}/?api-key=${apiKey}`;
  
    try {
      // Store current state values to preserve them during refresh
      const currentMiningState = { ...miningState };
      const currentMinerNames = { ...minerNames };
      const currentProgressPercent = { ...progressPercent };
      const currentExtractedFacts = { ...extractedFacts };
      
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'my-id',
          method: 'getAssetsByOwner',
          params: {
            ownerAddress: walletAddress,
            page: 1,
            limit: 1000,
            sortBy: {
              sortBy: "created",
              sortDirection: "desc"
            }
          }
        })
      });
  
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      
      if (result.error) throw new Error(`Helius API error: ${result.error.message || 'Unknown error'}`);
      if (!result?.result?.items) throw new Error('Invalid response format from Helius API');

      // Filter for OFACTs
      const ofactNFTs = result.result.items.filter((nft: NonFungibleToken) => {
        const symbol = nft.content?.metadata?.symbol || '';
        return symbol === 'OFACT';
      });

      // Filter for AFACTs to find parent relationships
      const afactNFTs = result.result.items.filter((nft: NonFungibleToken) => {
        const symbol = nft.content?.metadata?.symbol || '';
        return symbol === 'AFACT';
      });

      // Map to keep track of which OFACTs have child AFACTs
      const ofactsWithChildren = new Set<string>();
      
      // Create a temporary map to store AFACT data by parent ID
      const afactsByParent: { [parentId: string]: AFact[] } = {};
      
      // Process all AFACTs to find their parent OFACTs
      afactNFTs.forEach((afact: NonFungibleToken) => {
        try {
          // Look for parent reference in metadata
          const parentId = afact.content?.metadata?.properties?.parentOfactId ||
                           afact.content?.metadata?.attributes?.find(attr => 
                             attr.trait_type === 'Parent' || 
                             attr.trait_type === 'ParentOfactId' || 
                             attr.trait_type === 'ParentId'
                           )?.value;
          
          if (parentId) {
            // Mark this OFACT as having children
            ofactsWithChildren.add(parentId);
            
            // Store AFACT data for its parent
            if (!afactsByParent[parentId]) {
              afactsByParent[parentId] = [];
            }
            
            // Convert NFT to AFact type
            const afactData: AFact = {
              mintId: afact.id,
              fact: afact.content?.metadata?.description || 'No fact content',
              sourceUrl: afact.content?.metadata?.external_url || '',
              extractedDate: afact.tokenInfo?.mintTimestamp || new Date().toISOString()
            };
            
            afactsByParent[parentId].push(afactData);
          }
        } catch (err) {
          console.error('Error processing AFACT:', afact.id, err);
        }
      });

      setNfts(ofactNFTs);
      
      // Initialize mining states for all new NFTs while preserving existing states
      const newMiningStates: { [key: string]: MiningState } = { ...currentMiningState };
      const newMinerNames = { ...currentMinerNames };
      const newProgressPercent = { ...currentProgressPercent };
      const newExtractedFacts = { ...currentExtractedFacts };
      
      // Process OFACTs to set mining states
      ofactNFTs.forEach((nft: NonFungibleToken) => {
        const nftId = nft.id;
        
        // If this NFT has extracted facts already in our state, keep it as completed
        if (currentExtractedFacts[nftId] && currentExtractedFacts[nftId].length > 0) {
          newMiningStates[nftId] = 'mining_complete';
          newProgressPercent[nftId] = 100;
        } 
        // If we found AFACTs that reference this as a parent, mark it as completed
        else if (ofactsWithChildren.has(nftId)) {
          newMiningStates[nftId] = 'mining_complete';
          newProgressPercent[nftId] = 100;
          
          // If we already have miner name, keep it, otherwise generate one
          if (!newMinerNames[nftId]) {
            const miners = [
              'BitDigger', 'BlockVerifier', 'ChainGuardian', 
              'DataMiner', 'HashHunter', 'FactChaser', 
              'TruthSeeker', 'CryptoSleuth', 'TokenExplorer'
            ];
            newMinerNames[nftId] = miners[Math.floor(Math.random() * miners.length)];
          }
          
          // Add the child AFACTs to our extracted facts
          if (afactsByParent[nftId] && afactsByParent[nftId].length > 0) {
            newExtractedFacts[nftId] = afactsByParent[nftId];
          }
        }
        // Otherwise use existing state or default to open_request
        else if (!newMiningStates[nftId]) {
          newMiningStates[nftId] = 'open_request';
          newProgressPercent[nftId] = 0;
        }
      });
      
      setMiningState(newMiningStates);
      setMinerNames(newMinerNames);
      setProgressPercent(newProgressPercent);
      setExtractedFacts(newExtractedFacts);
      setError(null);
      
      console.log('OFACTs with children:', ofactsWithChildren);
      console.log('AFACTs by parent:', afactsByParent);
      console.log('Mining states after processing:', newMiningStates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch NFTs');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    setLastRefreshTime(new Date());
    await fetchOFactNFTs();
  };


// Update this part of your frontend code that handles mining and polling

// Define the API base URL
const API_BASE_URL = "https://df-backend-13-production.up.railway.app";
const API_FACTS_URL = `${API_BASE_URL}/api/facts-to-nfts`;

// Enhanced startJobStatusPolling function with better logging
const startJobStatusPolling = (jobId: string, nftId: string) => {
  // Clear any existing interval for this NFT
  if (pollingIntervals[nftId]) {
    clearInterval(pollingIntervals[nftId]);
  }
  
  // Set initial progress to indicate start
  setProgressPercent(prev => ({ ...prev, [nftId]: 5 }));
  
  // Reset failure counter for this NFT
  setStatusCheckFailures(prev => ({ ...prev, [nftId]: 0 }));
  
  console.log(`Starting to poll job status for jobId: ${jobId}, nftId: ${nftId}`);
  
  const interval = setInterval(async () => {
    try {
      // Construct the status URL with the jobId
      const statusUrl = `${API_FACTS_URL}?jobId=${jobId}`;
      console.log(`Polling job status: ${statusUrl}`);
      
      try {
        // Use fetch with explicit mode and no credentials
        const response = await fetch(statusUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          },
          mode: 'cors',
          credentials: 'omit'
        });
        
        // Log response status for debugging
        console.log(`Status poll response status: ${response.status}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            console.warn(`Job ${jobId} not found or API endpoint issue`);
            throw new Error(`Job status check returned 404 for jobId ${jobId}`);
          }
          
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('text/html')) {
            console.error('Received HTML instead of JSON for job status');
            throw new Error('API returned HTML instead of JSON');
          }
          
          throw new Error(`Error checking job status: ${response.status}`);
        }
        
        // Verify we have JSON response
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('Response is not JSON:', contentType);
        }
        
        // Get job status from response
        const jobStatus = await response.json();
        console.log(`Job status for ${nftId}:`, jobStatus);
        
        // Reset failures counter on successful request
        setStatusCheckFailures(prev => ({ ...prev, [nftId]: 0 }));
        
        // Update progress based on job status
        if (jobStatus.progress) {
          let progressValue = 5; // Default starting value
          
          if (jobStatus.progress.currentStep === 'Extracting content from URL') {
            progressValue = 15;
          } else if (jobStatus.progress.currentStep === 'Processing content with AI') {
            // Calculate based on sentences processed if available
            if (jobStatus.progress.processedSentences && jobStatus.progress.totalSentences) {
              progressValue = 20 + Math.floor((jobStatus.progress.processedSentences / jobStatus.progress.totalSentences) * 40);
            } else {
              progressValue = 35; // Default mid-processing
            }
          } else if (jobStatus.progress.currentStep === 'Creating NFTs') {
            // Calculate based on batches if available
            if (jobStatus.progress.currentBatch && jobStatus.progress.totalBatches) {
              progressValue = 60 + Math.floor((jobStatus.progress.currentBatch / jobStatus.progress.totalBatches) * 35);
            } else {
              progressValue = 75; // Default late-processing
            }
          }
          
          console.log(`Setting progress for ${nftId} to ${progressValue}%`);
          setProgressPercent(prev => ({ ...prev, [nftId]: progressValue }));
        }
        
        // Handle completed job
        if (jobStatus.status === 'completed') {
          console.log(`Job ${jobId} completed successfully!`);
          
          // Mining complete - update UI state
          setMiningState(prev => ({ ...prev, [nftId]: 'mining_complete' }));
          setProgressPercent(prev => ({ ...prev, [nftId]: 100 }));
          
          // Store the extracted AFACTs for display in the UI
          if (jobStatus.results?.mintedFacts) {
            console.log(`Storing ${jobStatus.results.mintedFacts.length} minted facts for display`);
            setExtractedFacts(prev => ({
              ...prev,
              [nftId]: jobStatus.results.mintedFacts
            }));
          } else {
            console.warn('Completed job has no mintedFacts in results');
          }
          
          // Stop polling
          clearInterval(interval);
          console.log(`Stopped polling for completed job ${jobId}`);
          
          // Switch to the "Mining Complete" tab when done
          setActiveTab('mining_complete');
        } 
        // Handle failed job
        else if (jobStatus.status === 'failed') {
          console.error(`Job ${jobId} failed: ${jobStatus.error || 'Unknown error'}`);
          
          // Handle failure
          setMiningState(prev => ({ ...prev, [nftId]: 'open_request' })); // Revert to open state on error
          setMiningErrors(prev => ({ 
            ...prev, 
            [nftId]: jobStatus.error || 'Mining failed' 
          }));
          
          // Stop polling
          clearInterval(interval);
          console.log(`Stopped polling for failed job ${jobId}`);
          
          // Switch back to "Open Requests" tab on failure
          setActiveTab('open_requests');
        }
        // Job is still processing
        else {
          console.log(`Job ${jobId} still processing. Current status: ${jobStatus.status}`);
        }
      } catch (fetchError) {
        console.error('Error fetching job status:', fetchError);
        
        // Increment failure counter
        setStatusCheckFailures(prev => {
          const currentFailures = (prev[nftId] || 0) + 1;
          console.log(`Status check failure count for ${nftId}: ${currentFailures}`);
          return { ...prev, [nftId]: currentFailures };
        });
        
        // Get the current failure count
        const currentFailures = statusCheckFailures[nftId] || 0;
        
        // After 5 consecutive failures, stop polling and show error
        if (currentFailures >= 5) {
          console.error(`Stopping status polling after ${currentFailures} failures`);
          setMiningState(prev => ({ ...prev, [nftId]: 'open_request' }));
          setMiningErrors(prev => ({
            ...prev,
            [nftId]: 'Lost connection to mining service after multiple attempts'
          }));
          clearInterval(interval);
          // Switch back to "Open Requests" tab after failures
          setActiveTab('open_requests');
        }
      }
    } catch (outerError) {
      console.error('Unhandled error in status polling:', outerError);
    }
  }, 3000); // Poll every 3 seconds
  
  // Store the interval ID to clear it later if needed
  setPollingIntervals(prev => ({
    ...prev,
    [nftId]: interval
  }));
  
  console.log(`Set up polling interval for ${nftId}`, interval);
};

// Updated handleMining function
const handleMining = async (nftId: string) => {
  try {
    // Find the OFACT NFT
    const nft = nfts.find(n => n.id === nftId);
    if (!nft) {
      throw new Error('NFT not found');
    }
    
    // Get the URL from the NFT description or attributes
    let url = nft.content?.metadata?.description || '';
    // Clean up the URL - ensure it starts with http:// or https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      // Try to extract URL from the description
      const urlMatch = url.match(/(https?:\/\/[^\s]+)/);
      if (urlMatch) {
        url = urlMatch[0];
      } else {
        throw new Error('No valid URL found in NFT description');
      }
    }
    
    console.log('Mining URL:', url);
    
    // Generate a random miner name for UI
    const miners = [
      'BitDigger', 'BlockVerifier', 'ChainGuardian', 
      'DataMiner', 'HashHunter', 'FactChaser', 
      'TruthSeeker', 'CryptoSleuth', 'TokenExplorer'
    ];
    const selectedMiner = miners[Math.floor(Math.random() * miners.length)];
    setMinerNames(prev => ({ ...prev, [nftId]: selectedMiner }));
    
    // Update UI state to show "Mining In Progress"
    setMiningState(prev => ({ ...prev, [nftId]: 'mining_in_progress' }));
    setProgressPercent(prev => ({ ...prev, [nftId]: 5 }));
    setMiningErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[nftId];
      return newErrors;
    });
    
    // Main API call to start fact extraction
    console.log(`Calling API at ${API_FACTS_URL} with URL: ${url}`);
    
    // Use fetch with enhanced error handling
    const response = await fetch(API_FACTS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        ...(nftId && { parentOfactId: nftId })
      }),
      mode: 'cors',
      credentials: 'omit'  // Explicitly don't send cookies
    });
    
    // Log full response for debugging
    console.log(`API response status: ${response.status}`);
    console.log('API response headers:', Object.fromEntries([...response.headers.entries()]));
    
    // Handle non-OK responses with detailed error information
    if (!response.ok) {
      console.error('Response status:', response.status);
      console.error('Response status text:', response.statusText);
      
      const contentType = response.headers.get('content-type');
      console.error('Content-Type:', contentType);
      
      // Get detailed error information
      let errorText;
      try {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorText = JSON.stringify(errorData);
        } else {
          errorText = await response.text();
        }
      } catch (e) {
        errorText = 'Unable to parse error response';
      }
      
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
    
    // Successfully got a response, parse it
    const result = await response.json();
    console.log('Mining started successfully:', result);
    
    if (result.success && result.jobId) {
      // Start polling for job status
      startJobStatusPolling(result.jobId, nftId);
      // Switch to the "In Progress" tab
      setActiveTab('in_progress');
    } else {
      throw new Error('Missing jobId in API response');
    }
  } catch (error) {
    console.error('Error starting mining process:', error);
    // Handle error state in UI
    setMiningState(prev => ({ ...prev, [nftId]: 'open_request' })); // Revert to open state on error
    setMiningErrors(prev => ({ 
      ...prev, 
      [nftId]: error instanceof Error ? error.message : 'Failed to start mining' 
    }));
  }
};


  // Toggle expanded state for OFACTs in the completed section
  const toggleExpandedOfact = (ofactId: string) => {
    setExpandedOfacts(prev => ({
      ...prev,
      [ofactId]: !prev[ofactId]
    }));
  };

  // Clean up polling intervals when component unmounts
  useEffect(() => {
    return () => {
      Object.values(pollingIntervals).forEach(interval => {
        clearInterval(interval);
      });
    };
  }, [pollingIntervals]);

  useEffect(() => {
    fetchOFactNFTs();
  }, [walletAddress]);

  // Helper function to check if an NFT is from the selected time period
  const isNFTInSelectedTimeRange = (nft: NonFungibleToken): boolean => {
    // If showing all NFTs, always return true
    if (timeFilter === 'all') return true;
    
    // Get dates from various possible fields
    const attributeMintDate = nft.content?.metadata?.attributes?.find(attr => attr.trait_type === 'Mint Date')?.value;
    const attributeCreationDate = nft.content?.metadata?.attributes?.find(attr => attr.trait_type === 'Creation Date')?.value;
    const lifecycleMintDate = nft.lifecycle?.minted?.timestamp;
    const tokenMintDate = nft.tokenInfo?.mintTimestamp;
    
    // Get the most recent date from all available date fields
    const dateStr = attributeMintDate || attributeCreationDate || lifecycleMintDate || tokenMintDate;
    
    if (!dateStr) return false; // No date available
    
    const nftDate = new Date(dateStr);
    if (isNaN(nftDate.getTime())) return false; // Invalid date
    
    const now = new Date();
    
    // Define time ranges based on selection
    if (timeFilter === 'hour') {
      // Check if NFT was created within the last hour
      const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
      return nftDate.getTime() >= oneHourAgo.getTime();
    } else if (timeFilter === 'day') {
      // Check if NFT was created within the last 24 hours
      const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
      return nftDate.getTime() >= oneDayAgo.getTime();
    } else if (timeFilter === 'week') {
      // Check if NFT was created within the last week
      const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      return nftDate.getTime() >= oneWeekAgo.getTime();
    }
    
    return false; // Should never reach here
  };
  
  // Get time filter label for display
  const getTimeFilterLabel = (): string => {
    switch (timeFilter) {
      case 'hour': return 'Last Hour';
      case 'day': return 'Last 24 Hours';
      case 'week': return 'Last 7 Days';
      case 'all': return 'All Time';
      default: return 'Last 7 Days';
    }
  };

  // Handle time filter change
  const handleTimeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeFilter(e.target.value as TimeFilter);
  };

  // Filter NFTs by selected time range and mining state
  const filteredNFTs = nfts.filter(isNFTInSelectedTimeRange);
  
  const openRequests = filteredNFTs.filter(nft => 
    (miningState[nft.id] || 'open_request') === 'open_request'
  );
  
  const miningInProgress = filteredNFTs.filter(nft => 
    miningState[nft.id] === 'mining_in_progress'
  );
  
  const miningComplete = filteredNFTs.filter(nft => 
    miningState[nft.id] === 'mining_complete'
  );

  // Extract source URL from NFT description
  const getSourceUrl = (nft: NonFungibleToken): string => {
    return nft.content?.metadata?.description || '';
  };

  // Function to get the counts for tab badges
  const getTabCounts = () => {
    return {
      open_requests: openRequests.length,
      in_progress: miningInProgress.length,
      mining_complete: miningComplete.length
    };
  };

  const tabCounts = getTabCounts();

  if (loading) {
    return (
      <div className="w-full p-8 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4 text-center text-red-400 bg-red-900/20 rounded-lg">
        {error}
      </div>
    );
  }

  if (nfts.length === 0) {
    return <div className="w-full p-4 text-center text-gray-400">No OFacts found</div>;
  }

  // Use this for debugging the state of tabs
  const debugInfo = {
    activeTab,
    tabCounts,
    openRequestsLength: openRequests.length,
    inProgressLength: miningInProgress.length,
    completedLength: miningComplete.length
  };
  
  // Uncomment to debug the tab state
  // console.log('Tab Debug Info:', debugInfo);

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="text-xl font-semibold">Fact Mining Dashboard</div>
          <div className="text-sm text-gray-400">
            Showing OFacts from {getTimeFilterLabel()}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Time filter dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="timeFilter" className="text-sm text-gray-400">
              Time Range:
            </label>
            <div className="relative">
              <select
                id="timeFilter"
                value={timeFilter}
                onChange={handleTimeFilterChange}
                className="appearance-none bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-8"
              >
                <option value="hour">Last Hour</option>
                <option value="day">Last 24 Hours</option>
                <option value="week">Last 7 Days</option>
                <option value="all">All Time</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <DropdownIcon className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-100/5 px-3 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-white/10 transition-all hover:bg-indigo-100/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRefreshing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              'Refresh'
            )}
          </button>
        </div>
      </div>
      
      {/* Tabs Navigation */}
      <div className="border-b border-white/10">
        <nav className="flex space-x-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('open_requests')}
            className={`${
              activeTab === 'open_requests'
                ? 'text-white border-amber-500'
                : 'text-gray-400 border-transparent hover:text-gray-300 hover:border-gray-600'
            } py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            aria-current={activeTab === 'open_requests' ? 'page' : undefined}
          >
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            Open Requests
            <span className="inline-flex items-center justify-center ml-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-800">
              {tabCounts.open_requests}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('in_progress')}
            className={`${
              activeTab === 'in_progress'
                ? 'text-white border-blue-500'
                : 'text-gray-400 border-transparent hover:text-gray-300 hover:border-gray-600'
            } py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            aria-current={activeTab === 'in_progress' ? 'page' : undefined}
          >
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            In Progress
            <span className="inline-flex items-center justify-center ml-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-800">
              {tabCounts.in_progress}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('mining_complete')}
            className={`${
              activeTab === 'mining_complete'
                ? 'text-white border-green-500'
                : 'text-gray-400 border-transparent hover:text-gray-300 hover:border-gray-600'
            } py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            aria-current={activeTab === 'mining_complete' ? 'page' : undefined}
          >
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            Mined Facts
            <span className="inline-flex items-center justify-center ml-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-800">
              {tabCounts.mining_complete}
            </span>
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="mt-4">
        {/* Open Requests Tab */}
        {activeTab === 'open_requests' && (
          <div className="w-full overflow-x-auto rounded-lg bg-gray-800/10 ring-1 ring-amber-500/30">
            {openRequests.length > 0 ? (
              <div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 bg-amber-900/20">
                      <th className="p-3 text-left">Type</th>
                      <th className="p-3 text-left">URL</th>
                      <th className="p-3 text-left">Created</th>
                      <th className="p-3 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openRequests.map(nft => (
                      <tr 
                        key={nft.id}
                        className="border-b border-white/10 hover:bg-gray-800/30 transition-colors cursor-pointer"
                        onClick={() => setDetailPopup({ type: 'nft', nft })}
                      >
                        <td className="p-3">
                          <div className="w-6 h-6 flex-shrink-0">
                            <img 
                              src={COLOR_TO_IMAGE_MAP.red}
                              alt="OFact"
                              className="w-full h-full"
                            />
                          </div>
                        </td>
                        <td className="p-3 text-sm">
                          <div className="flex items-center gap-1">
                            <ExternalLink className="h-3 w-3 text-gray-400" />
                            <div className="text-gray-300 truncate max-w-md">
                              {getSourceUrl(nft)}
                            </div>
                          </div>
                          {miningErrors[nft.id] && (
                            <div className="text-xs text-red-400 mt-1">
                              Error: {miningErrors[nft.id]}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-sm text-gray-300">
                          {formatDate(nft)}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMining(nft.id);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-100/5 px-3 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-white/10 transition-all hover:bg-emerald-100/10"
                          >
                            Mine Fact
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400">
                No open fact requests
              </div>
            )}
          </div>
        )}
        
        {/* Mining In Progress Tab */}
        {activeTab === 'in_progress' && (
          <div className="w-full overflow-x-auto rounded-lg bg-gray-800/10 ring-1 ring-blue-500/30">
            {miningInProgress.length > 0 ? (
              <div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 bg-blue-900/20">
                      <th className="p-3 text-left">Type</th>
                      <th className="p-3 text-left">URL</th>
                      <th className="p-3 text-left">Miner</th>
                      <th className="p-3 text-left">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {miningInProgress.map(nft => (
                      <tr 
                        key={nft.id}
                        className="border-b border-white/10 hover:bg-gray-800/30 transition-colors cursor-pointer"
                        onClick={() => setDetailPopup({ type: 'nft', nft })}
                      >
                        <td className="p-3">
                          <div className="w-6 h-6 flex-shrink-0">
                            <img 
                              src={COLOR_TO_IMAGE_MAP.blue}
                              alt="OFACT"
                              className="w-full h-full"
                            />
                          </div>
                        </td>
                        <td className="p-3 text-sm">
                          <div className="flex items-center gap-1">
                            <ExternalLink className="h-3 w-3 text-gray-400" />
                            <div className="text-gray-300 truncate max-w-md">
                              {getSourceUrl(nft)}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-gray-300">
                          {minerNames[nft.id] || 'Unknown'}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-1">
                            <div className="inline-flex items-center gap-1 text-blue-400 text-sm">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span className="font-medium">
                                {progressPercent[nft.id]}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-200" 
                                style={{ width: `${progressPercent[nft.id]}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400">
                No facts being mined
              </div>
            )}
          </div>
        )}
        
        {/* Mining Complete Tab */}
        {activeTab === 'mining_complete' && (
          <div className="w-full overflow-x-auto rounded-lg bg-gray-800/10 ring-1 ring-green-500/30">
            {miningComplete.length > 0 ? (
              <div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 bg-green-900/20">
                      <th className="p-3 w-10"></th>
                      <th className="p-3 text-left w-20">Type</th>
                      <th className="p-3 text-left">Source</th>
                      <th className="p-3 text-left">Completed</th>
                      <th className="p-3 text-left">Facts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {miningComplete.map((ofact) => (
                      <React.Fragment key={ofact.id}>
                        {/* OFACT Row */}
                        <tr 
                          className="border-b border-white/10 hover:bg-gray-800/30 transition-colors cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent toggling when clicking on the row
                            setDetailPopup({ type: 'nft', nft: ofact });
                          }}
                        >
                          <td className="p-3 text-center" onClick={(e) => {
                            e.stopPropagation(); // Don't open detail popup when clicking chevron
                            toggleExpandedOfact(ofact.id);
                          }}>
                            {expandedOfacts[ofact.id] ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center">
                              <div className="w-6 h-6 flex-shrink-0">
                                <img 
                                  src={COLOR_TO_IMAGE_MAP.orange}
                                  alt="Completed OFACT"
                                  className="w-full h-full"
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-sm">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                <div className="text-gray-300 truncate max-w-md">
                                  {getSourceUrl(ofact)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-sm text-gray-300">
                            {formatDate(ofact)}
                          </td>
                          <td className="p-3 text-sm">
                            <span className="text-green-400 font-medium">
                              {(extractedFacts[ofact.id]?.length || 0)} facts
                            </span>
                          </td>
                        </tr>
                        
                        {/* AFACT Rows (expanded) */}
                        {expandedOfacts[ofact.id] && extractedFacts[ofact.id]?.map((afact, index) => (
                          <tr 
                            key={`${ofact.id}-${index}`}
                            className="border-b border-white/10 bg-green-900/10 hover:bg-green-900/20 cursor-pointer"
                            onClick={() => setDetailPopup({ type: 'afact', afact, parent: ofact })}
                          >
                            <td className="p-3"></td>
                            <td className="p-3 pl-6">
                              <div className="w-6 h-6 flex-shrink-0">
                                <img 
                                  src={COLOR_TO_IMAGE_MAP.yellow}
                                  alt="AFACT"
                                  className="w-full h-full"
                                />
                              </div>
                            </td>
                            <td colSpan={3} className="p-3 text-sm">
                              <div className="text-gray-200 line-clamp-2 mb-1">{afact.fact}</div>
                              <div className="flex items-center justify-between">
                                <div className="text-xs text-gray-500">
                                  ID: {afact.mintId.slice(0, 8)}...
                                </div>
                                <div className="text-xs text-blue-400 whitespace-nowrap flex-shrink-0">
                                  {formatAFactDate(afact.extractedDate)}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                        
                        {/* Show message if no AFacts are found */}
                        {expandedOfacts[ofact.id] && (!extractedFacts[ofact.id] || extractedFacts[ofact.id].length === 0) && (
                          <tr className="border-b border-white/10 bg-green-900/10">
                            <td colSpan={5} className="p-3 text-center text-xs text-gray-400">
                              No facts extracted from this source
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400">
                No completed facts
              </div>
            )}
          </div>
        )}
      </div>
      
{selectedNFT && (
  <NFTDetails
    nftData={[selectedNFT]}
    walletAddress={walletAddress}
    searchParams=""
    onClose={() => setSelectedNFT(null)}
  />
)}
      
{/* Detail Popup Modal */}
{detailPopup && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
    <div className="bg-gray-900 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-auto border border-gray-700 shadow-xl">
      <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {detailPopup.type === 'nft' ? 'OFACT Details' : 'AFACT Details'}
        </h3>
        <button 
          onClick={() => setDetailPopup(null)}
          className="p-1 rounded-full hover:bg-gray-800"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <div className="p-6 space-y-4">
        {detailPopup.type === 'nft' && detailPopup.nft && (
          <>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12">
                <img 
                  src={detailPopup.nft.content?.metadata?.image || 
                      (miningState[detailPopup.nft.id] === 'mining_complete' ? COLOR_TO_IMAGE_MAP.orange : COLOR_TO_IMAGE_MAP.red)}
                  alt="OFACT"
                  className="w-full h-full rounded"
                />
              </div>
              <div>
                <h4 className="font-medium">{detailPopup.nft.content?.metadata?.name || 'OFACT'}</h4>
                <div className="text-sm text-gray-400">
                  {formatDate(detailPopup.nft)}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-400">Source URL</h4>
              <div className="flex items-center gap-2 text-white bg-gray-800 p-2 rounded border border-gray-700 break-all">
                <ExternalLink className="h-4 w-4 flex-shrink-0 text-blue-400" />
                <a 
                  href={getSourceUrl(detailPopup.nft)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  {getSourceUrl(detailPopup.nft)}
                </a>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-400">NFT ID</h4>
                <div className="text-white bg-gray-800 p-2 rounded border border-gray-700 break-all">
                  {detailPopup.nft.id}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-400">Status</h4>
                <div className="text-white bg-gray-800 p-2 rounded border border-gray-700">
                  {miningState[detailPopup.nft.id] === 'mining_in_progress' ? (
                    <div className="flex items-center gap-2">
                      <div className="text-blue-400 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Mining in progress ({progressPercent[detailPopup.nft.id]}%)
                      </div>
                    </div>
                  ) : miningState[detailPopup.nft.id] === 'mining_complete' ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      Mining complete
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-400">
                      <Clock className="h-4 w-4" />
                      Open request
                    </div>
                  )}
                  
                  {miningErrors[detailPopup.nft.id] && (
                    <div className="mt-2 text-red-400 text-sm">
                      Error: {miningErrors[detailPopup.nft.id]}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Show extracted facts if available */}
            {miningState[detailPopup.nft.id] === 'mining_complete' && 
             extractedFacts[detailPopup.nft.id] && 
             extractedFacts[detailPopup.nft.id].length > 0 && (
              <div className="space-y-2 mt-4">
                <h4 className="text-sm font-medium text-gray-400">Extracted Facts ({extractedFacts[detailPopup.nft.id].length})</h4>
                <div className="bg-gray-800 rounded border border-gray-700 overflow-hidden">
                  {extractedFacts[detailPopup.nft.id].map((fact, i) => (
                    <div 
                      key={fact.mintId} 
                      className={`p-3 text-sm ${i !== extractedFacts[detailPopup.nft.id].length - 1 ? 'border-b border-gray-700' : ''}`}
                    >
                      {fact.fact}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        
        {detailPopup.type === 'afact' && detailPopup.afact && (
          <>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-400">Fact Content</h4>
              <p className="text-white bg-gray-800 p-3 rounded border border-gray-700">
                {detailPopup.afact.fact}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-400">Mint ID</h4>
                <div className="text-white bg-gray-800 p-2 rounded border border-gray-700 break-all">
                  {detailPopup.afact.mintId}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-400">Extracted Date</h4>
                <div className="text-white bg-gray-800 p-2 rounded border border-gray-700">
                  {formatAFactDate(detailPopup.afact.extractedDate)}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-400">Source URL</h4>
              <div className="flex items-center gap-2 text-white bg-gray-800 p-2 rounded border border-gray-700 break-all">
                <ExternalLink className="h-4 w-4 flex-shrink-0 text-blue-400" />
                <a 
                  href={detailPopup.afact.sourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  {detailPopup.afact.sourceUrl}
                </a>
              </div>
            </div>
            
            {detailPopup.parent && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-400">Parent OFACT</h4>
                <div className="bg-gray-800 p-2 rounded border border-gray-700 flex items-center gap-2">
                  <div className="w-6 h-6">
                    <img 
                      src={COLOR_TO_IMAGE_MAP.orange}
                      alt="Parent OFACT"
                      className="w-full h-full"
                    />
                  </div>
                  <div className="text-sm">{detailPopup.parent.id.slice(0, 12)}...</div>
                </div>
              </div>
            )}
          </>
        )}
        
        <div className="pt-4 flex justify-end">
          <button 
            onClick={() => setDetailPopup(null)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default OFactTableView;