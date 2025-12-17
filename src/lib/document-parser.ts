import { Requirement } from "./types";

/**
 * Parse structured documents to extract individual functional requirements
 * Handles documents with sections like:
 * - Assumptions
 * - Dependencies  
 * - High Level Scope
 * - Detailed Scope
 * - Functional Requirements (focus area)
 */

interface ParsedSection {
  name: string;
  content: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Find major sections in a document
 */
function findSections(text: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  
  // Match section headers (various formats)
  // - "# Section Name"
  // - "## Section Name"
  // - "Section Name:" at start of line
  // - "SECTION NAME" (all caps)
  const sectionRegex = /^(?:#{1,3}\s+(.+)|([A-Z][A-Za-z\s]+):|([A-Z\s]{5,}))$/gm;
  
  const matches = Array.from(text.matchAll(sectionRegex));
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const sectionName = (match[1] || match[2] || match[3] || '').trim();
    const startIndex = match.index || 0;
    const endIndex = i < matches.length - 1 ? (matches[i + 1].index || text.length) : text.length;
    
    sections.push({
      name: sectionName,
      content: text.substring(startIndex, endIndex),
      startIndex,
      endIndex
    });
  }
  
  return sections;
}

/**
 * Extract functional requirements from a section
 * Looks for structured entries with:
 * - Requirement ID
 * - Title
 * - User Story
 * - Acceptance Criteria
 * - Dependencies, TLS's, Notes (optional)
 */
function extractFunctionalRequirements(sectionContent: string): Requirement[] {
  const requirements: Requirement[] = [];
  
  console.log('[Extract] Processing section content, length:', sectionContent.length);
  
  // Try to identify individual requirement blocks
  // Pattern 1: Numbered requirements with subsections
  // Pattern 2: Requirements with explicit ID field
  // Pattern 3: Table-like format with consistent fields
  
  // First, try to find requirement IDs (common patterns: REQ-001, FR-001, R001, etc.)
  // Made regex more flexible to catch more patterns
  const reqIdRegex = /(?:^|\n)(?:Requirement\s+ID|ID|Req\s*ID|Requirement\s*#|Req\s*#)[\s:]*([A-Z]+-?\d+|R?\d+)(?:\s|$)/gi;
  const idMatches = Array.from(sectionContent.matchAll(reqIdRegex));
  
  console.log('[Extract] Found', idMatches.length, 'requirement ID matches');
  
  if (idMatches.length > 0) {
    // Document has explicit requirement IDs
    for (let i = 0; i < idMatches.length; i++) {
      const match = idMatches[i];
      const reqId = match[1];
      const startIndex = match.index || 0;
      const endIndex = i < idMatches.length - 1 ? (idMatches[i + 1].index || sectionContent.length) : sectionContent.length;
      
      const reqContent = sectionContent.substring(startIndex, endIndex).trim();
      
      // Extract title (usually first line after ID or labeled)
      const titleMatch = reqContent.match(/(?:Title|Name|Requirement)[\s:]+(.+?)(?:\n|$)/i) ||
                        reqContent.match(/\n([^\n]+?)(?:\n(?:User Story|Description)|$)/);
      const title = titleMatch ? titleMatch[1].trim() : `Requirement ${reqId}`;
      
      console.log('[Extract] Extracted requirement:', reqId, '-', title);
      
      requirements.push({
        id: reqId,
        name: title,
        content: reqContent
      });
    }
  } else {
    // Try numbered format (1., 2., 3., etc.)
    const numberedRegex = /(?:^|\n)(\d+)\.\s+([^\n]+)/g;
    const numberedMatches = Array.from(sectionContent.matchAll(numberedRegex));
    
    console.log('[Extract] Found', numberedMatches.length, 'numbered items');
    
    if (numberedMatches.length > 1) {
      // Has numbered requirements
      for (let i = 0; i < numberedMatches.length; i++) {
        const match = numberedMatches[i];
        const reqNum = match[1];
        const title = match[2].trim();
        const startIndex = match.index || 0;
        const endIndex = i < numberedMatches.length - 1 ? (numberedMatches[i + 1].index || sectionContent.length) : sectionContent.length;
        
        const reqContent = sectionContent.substring(startIndex, endIndex).trim();
        
        console.log('[Extract] Extracted numbered requirement:', reqNum, '-', title);
        
        requirements.push({
          id: `REQ-${String(reqNum).padStart(3, '0')}`,
          name: title,
          content: reqContent
        });
      }
    }
  }
  
  return requirements;
}

/**
 * Intelligently parse a document to extract requirements
 * Focuses on Functional Requirements section if present
 */
export function parseStructuredDocument(text: string): Requirement[] {
  if (!text.trim()) return [];
  
  console.log('[Document Parser] Parsing document, length:', text.length);
  
  // Find all sections in the document
  const sections = findSections(text);
  console.log('[Document Parser] Found sections:', sections.map(s => s.name));
  
  // Look for Functional Requirements section (case-insensitive)
  const functionalReqSection = sections.find(s => 
    /functional\s+requirements?/i.test(s.name)
  );
  
  if (functionalReqSection) {
    console.log('[Document Parser] Found Functional Requirements section');
    // Extract requirements from this section
    const requirements = extractFunctionalRequirements(functionalReqSection.content);
    
    if (requirements.length > 0) {
      console.log('[Document Parser] Extracted', requirements.length, 'requirements from Functional Requirements section');
      return requirements;
    }
  }
  
  // If no Functional Requirements section found, or it was empty,
  // try to extract from Requirements section
  const requirementsSection = sections.find(s => 
    /^requirements?$/i.test(s.name)
  );
  
  if (requirementsSection) {
    console.log('[Document Parser] Found Requirements section');
    const requirements = extractFunctionalRequirements(requirementsSection.content);
    if (requirements.length > 0) {
      console.log('[Document Parser] Extracted', requirements.length, 'requirements from Requirements section');
      return requirements;
    }
  }
  
  // Fallback: treat entire document as requirements and try to parse
  console.log('[Document Parser] No specific section found, parsing entire document');
  const allRequirements = extractFunctionalRequirements(text);
  if (allRequirements.length > 0) {
    console.log('[Document Parser] Extracted', allRequirements.length, 'requirements from full document');
    return allRequirements;
  }
  
  // Last resort: split by major separators
  console.log('[Document Parser] Falling back to simple format parsing');
  const simpleRequirements = parseSimpleFormat(text);
  console.log('[Document Parser] Extracted', simpleRequirements.length, 'requirements using simple format');
  return simpleRequirements;
}

/**
 * Simple format parser (fallback)
 * Splits by --- or numbered items
 */
function parseSimpleFormat(text: string): Requirement[] {
  const requirements: Requirement[] = [];
  
  // Split by section breaks or numbered items
  const sections = text.split(/\n---+\n|\n(?=\d+\.\s)/);
  
  let idCounter = 1;
  sections.forEach(section => {
    const trimmed = section.trim();
    if (!trimmed || trimmed.length < 20) return; // Skip very short sections
    
    // Try to extract name from first line
    const lines = trimmed.split('\n');
    let name = '';
    
    // Check for "# Title" format
    const titleMatch = trimmed.match(/^#\s+(.+)/m);
    if (titleMatch) {
      name = titleMatch[1].trim();
    } 
    // Check for numbered format
    else {
      const nameMatch = trimmed.match(/^(?:\d+\.\s*)?(.+?)(?:\n|$)/);
      if (nameMatch) {
        name = nameMatch[1].trim().replace(/:\s*$/, '');
        if (name.length > 100) {
          name = name.substring(0, 100);
        }
      }
    }
    
    if (!name) {
      name = `Requirement ${idCounter}`;
    }
    
    requirements.push({
      id: `REQ-${String(idCounter).padStart(3, '0')}`,
      name,
      content: trimmed,
    });
    idCounter++;
  });
  
  return requirements;
}
