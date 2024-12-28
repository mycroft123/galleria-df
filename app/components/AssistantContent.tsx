// AssistantContent.tsx

import React from 'react';
import { ParsedResponse, Section, Summary } from './types';

interface AssistantContentProps {
  parsedContent: ParsedResponse;
}

const AssistantContent: React.FC<AssistantContentProps> = ({ parsedContent }) => {
  const { sections, summary } = parsedContent;

  interface SubSection {
    title: string;
    content: string;
  }
  
  interface Section {
    title: string;
    content: {
      mainPoint: string;
      details?: string[];
      subSections?: SubSection[];
    };
  }
  
  interface Summary {
    mainPoint: string;
    keyTakeaways?: string[];
  }
  
  interface ParsedResponse {
    summary?: Summary;
    sections: Section[];
  }
  
  return (
    <div className="space-y-6">
      {/* Summary section without top border */}
      {summary && typeof summary === 'object' && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Summary</h2>
          <p className="mb-2">{summary.mainPoint}</p>
          
          {summary.keyTakeaways && Array.isArray(summary.keyTakeaways) && (
            <ul className="list-disc list-inside">
              {summary.keyTakeaways.map((takeaway, takeIdx) => (
                <li key={takeIdx}>{takeaway}</li>
              ))}
            </ul>
          )}
        </div>
      )}
  
      {/* Sections with dividing lines */}
      {Array.isArray(sections) && sections.map((section: Section, idx: number) => (
        <div key={idx}>
          <div className="border-t border-gray-700 pt-6">
            <h2 className="text-xl font-semibold mb-2">{section.title}</h2>
            {section.content && typeof section.content === 'object' && (
              <>
                <p className="mb-2">{section.content.mainPoint}</p>
                
                {section.content.details && Array.isArray(section.content.details) && (
                  <ul className="list-disc list-inside mb-2">
                    {section.content.details.map((detail, detailIdx) => (
                      <li key={detailIdx}>{detail}</li>
                    ))}
                  </ul>
                )}
                
                {section.content.subSections && Array.isArray(section.content.subSections) && (
                  <div className="ml-4">
                    {section.content.subSections.map((subSection, subIdx) => (
                      <div key={subIdx} className="mb-4">
                        <h3 className="text-lg font-medium">{subSection.title}</h3>
                        <p>{subSection.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AssistantContent;
