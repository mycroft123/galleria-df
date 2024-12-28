export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    citations?: string[];
  }
  
  export interface PerplexityResponse {
    success: boolean;
    response?: string;
    citations?: string[];
    error?: string;
    choices?: Array<{
      message: {
        content: string;
      };
    }>;
  }

  // types.ts

export interface SubSection {
    title: string;
    content: string;
  }
  
  export interface SectionContent {
    mainPoint: string;
    details: string[];
    subSections: SubSection[];
  }
  
  export interface Section {
    title: string;
    content: SectionContent;
  }
  
  export interface Summary {
    mainPoint: string;
    keyTakeaways: string[];
  }
  
  export interface ParsedResponse {
    sections: Section[];
    summary: Summary;
  }
  
  export interface Message {
    role: 'user' | 'assistant';
    content: string | ParsedResponse;
    timestamp: number;
    citations?: string[];
  }
  