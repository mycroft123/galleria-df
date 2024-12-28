export const generateDisplayText = (parsedContent: ParsedResponse): string => {
    let displayText = "";
  
    // Handle Summary
    if (parsedContent.summary) {
      displayText += `**Summary:**\n${parsedContent.summary.mainPoint}\n\n`;
      if (parsedContent.summary.keyTakeaways && parsedContent.summary.keyTakeaways.length > 0) {
        displayText += `**Key Takeaways:**\n`;
        parsedContent.summary.keyTakeaways.forEach((takeaway, index) => {
          displayText += `${index + 1}. ${takeaway}\n`;
        });
        displayText += `\n`;
      }
    }
  
    // Handle Sections
    if (parsedContent.sections && parsedContent.sections.length > 0) {
      parsedContent.sections.forEach((section, index) => {
        // Add extra spacing before each section (except the first one)
        if (index > 0) {
          displayText += `\n`;
        }
        
        displayText += `**Section ${index + 1}: ${section.title}**\n`;
        displayText += `${section.content.mainPoint}\n`;
  
        if (section.content.details && section.content.details.length > 0) {
          displayText += `**Details:**\n`;
          section.content.details.forEach((detail, idx) => {
            displayText += `- ${detail}\n`;
          });
          displayText += `\n`;
        }
  
        if (section.content.subSections && section.content.subSections.length > 0) {
          section.content.subSections.forEach((subSection, subIdx) => {
            displayText += `**Subsection: ${subSection.title}**\n\n${subSection.content}\n\n`;
          });
        }
      });
    }
  
    // Ensure consistent double newlines throughout
    return displayText
      .replace(/\n{3,}/g, '\n\n') // Replace triple+ newlines with double
      .trim(); // Remove trailing whitespace
};