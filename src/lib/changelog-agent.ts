/**
 * Changelog Agent
 * 
 * This module provides functionality to generate AI-powered changelogs
 * that describe what changed between versions of a task/job.
 * 
 * The changelog compares agent outputs between versions after the pipeline completes.
 */

import { callAI } from "./ai-client";
import { getStoredValue } from "./storage";
import { AISettings } from "./ai-client";
import { Job, VersionSnapshot } from "./types";

/**
 * Generates a changelog describing the differences between two completed versions
 * by comparing their agent outputs (Tech Lead, BA, Requirements, Product Owner)
 * 
 * @param previousVersion - The previous version snapshot with completed outputs
 * @param currentVersion - The current version with completed outputs  
 * @returns A markdown-formatted changelog describing what changed in each agent's output
 */
export async function generateChangelog(
  previousVersion: VersionSnapshot | null,
  currentVersion: Job | VersionSnapshot
): Promise<string> {
  // For version 1, there's no changelog
  if (!previousVersion || currentVersion.version === 1) {
    return "Initial version - no previous changes to compare.";
  }

  const prompt = buildChangelogPrompt(previousVersion, currentVersion);
  
  try {
    // Get the AI model from settings
    const aiSettings = getStoredValue<AISettings>("ai-settings");
    const model = aiSettings?.model || "gemini-2.5-flash";
    const authMode = aiSettings?.geminiAuthMode;
    
    const changelog = await callAI(prompt, model, authMode);
    return changelog;
  } catch (error) {
    console.error("Error generating changelog:", error);
    return "Unable to generate changelog at this time.";
  }
}

/**
 * Builds the prompt for the changelog generation
 * Compares agent outputs between versions to show what changed
 */
function buildChangelogPrompt(
  previousVersion: VersionSnapshot,
  currentVersion: Job | VersionSnapshot
): string {
  // Extract changes in requirements/description
  const descriptionChanged = previousVersion.description !== currentVersion.description;
  
  // Extract changes in reference materials
  const oldRefs = new Set(previousVersion.referenceFolders);
  const newRefs = new Set(currentVersion.referenceFolders);
  const addedRefs = [...newRefs].filter(ref => !oldRefs.has(ref));
  const removedRefs = [...oldRefs].filter(ref => !newRefs.has(ref));
  
  // Compare agent outputs
  const prevOutputs = previousVersion.outputs || {};
  const currOutputs = currentVersion.outputs || {};
  
  // Key output files to compare
  const keyOutputs = {
    techLead: "01_tech_lead.md",
    businessAnalyst: "02_business_analyst.md",
    requirements: "04_requirements_spec.md",
    productOwner: "05_product_backlog.md",
  };
  
  // Check which outputs changed
  const outputChanges = {
    techLead: prevOutputs[keyOutputs.techLead] !== currOutputs[keyOutputs.techLead],
    businessAnalyst: prevOutputs[keyOutputs.businessAnalyst] !== currOutputs[keyOutputs.businessAnalyst],
    requirements: prevOutputs[keyOutputs.requirements] !== currOutputs[keyOutputs.requirements],
    productOwner: prevOutputs[keyOutputs.productOwner] !== currOutputs[keyOutputs.productOwner],
  };
  
  // Get fuller content for comparison (up to 2000 chars to allow more detailed analysis)
  const getPrevContent = (key: string) => (prevOutputs[key] || "Not available").slice(0, 2000);
  const getCurrContent = (key: string) => (currOutputs[key] || "Not available").slice(0, 2000);

  // Build prompt
  return `You are a Technical Documentation Specialist analyzing changes between two versions of a requirements analysis project.

**Task:** Generate a comprehensive, detailed changelog documenting all significant changes from version ${previousVersion.version} to version ${currentVersion.version}.

**Context:**

Previous Version (v${previousVersion.version}):
Description: ${previousVersion.description}
${previousVersion.changeReason ? `Change Reason: ${previousVersion.changeReason}` : ""}

Current Version (v${currentVersion.version}):
Description: ${currentVersion.description}
${"changeReason" in currentVersion && currentVersion.changeReason ? `Change Reason: ${currentVersion.changeReason}` : ""}

**Agent Output Analysis:**

**Tech Lead Analysis:** ${outputChanges.techLead ? "CHANGED" : "No significant changes"}
${outputChanges.techLead ? `
--- Previous Version (v${previousVersion.version}) ---
${getPrevContent(keyOutputs.techLead)}

--- Current Version (v${currentVersion.version}) ---
${getCurrContent(keyOutputs.techLead)}
` : ""}

**Business Analyst Analysis:** ${outputChanges.businessAnalyst ? "CHANGED" : "No significant changes"}
${outputChanges.businessAnalyst ? `
--- Previous Version (v${previousVersion.version}) ---
${getPrevContent(keyOutputs.businessAnalyst)}

--- Current Version (v${currentVersion.version}) ---
${getCurrContent(keyOutputs.businessAnalyst)}
` : ""}

**Requirements Specification:** ${outputChanges.requirements ? "CHANGED" : "No significant changes"}
${outputChanges.requirements ? `
--- Previous Version (v${previousVersion.version}) ---
${getPrevContent(keyOutputs.requirements)}

--- Current Version (v${currentVersion.version}) ---
${getCurrContent(keyOutputs.requirements)}
` : ""}

**Product Owner Backlog:** ${outputChanges.productOwner ? "CHANGED" : "No significant changes"}
${outputChanges.productOwner ? `
--- Previous Version (v${previousVersion.version}) ---
${getPrevContent(keyOutputs.productOwner)}

--- Current Version (v${currentVersion.version}) ---
${getCurrContent(keyOutputs.productOwner)}
` : ""}

**Reference Materials Changes:**
- Added Folders: ${addedRefs.length > 0 ? addedRefs.join(", ") : "None"}
- Removed Folders: ${removedRefs.length > 0 ? removedRefs.join(", ") : "None"}

**Required Output Structure:**

Generate a detailed changelog document following this structure:

# Version ${currentVersion.version} Changelog

## Overview
Provide a 2-3 sentence executive summary of what changed in this version and why.

## Tech Lead Changes

### Architecture & Technical Approach
- Detail specific changes to architecture, design patterns, or technical approach
- Include new technologies, frameworks, or tools introduced
- Note any deprecated or removed technical components

### Technical Risks & Dependencies
- List new risks identified
- Note changes to existing risk assessments
- Document new or changed dependencies

### Implementation Considerations
- Detail changes to implementation strategy
- Note new technical requirements or constraints
- List updated best practices or guidelines

## Business Analyst Changes

### Business Context & Objectives
- Describe changes to business problem understanding
- Note shifts in business objectives or priorities
- Document new stakeholder insights

### Requirements Evolution
- Detail new functional requirements added
- Note requirements that were modified or clarified
- List any requirements that were removed or deprioritized

### Success Metrics & KPIs
- Document new or changed success metrics
- Note updates to measurement approaches
- List any new business constraints

## Requirements Specification Changes

### Functional Requirements
- List specific new functional requirements
- Detail modifications to existing requirements
- Note acceptance criteria changes
- Include priority shifts

### Non-Functional Requirements
- Document performance requirement changes
- Note security or compliance updates
- List scalability or reliability changes

### Technical Specifications
- Detail API or interface changes
- Note data model or schema updates
- List integration requirement changes

## Product Owner Changes

### User Stories & Epics
- List new user stories added
- Detail modifications to existing stories
- Note story prioritization changes
- Include acceptance criteria updates

### Backlog Organization
- Document backlog restructuring
- Note sprint planning impacts
- List dependency changes between stories

### Stakeholder Feedback Integration
- Detail how user feedback was incorporated
- Note usability or UX improvements
- List stakeholder-requested features

## Reference Materials Updates
${addedRefs.length > 0 || removedRefs.length > 0 ? `
### Added Materials
${addedRefs.map(ref => `- ${ref}`).join('\n') || '- None'}

### Removed Materials
${removedRefs.map(ref => `- ${ref}`).join('\n') || '- None'}
` : '- No changes to reference materials'}

## Impact Summary

### High Impact Changes
List the 3-5 most significant changes and their implications.

### Migration Considerations
Note any breaking changes or migration steps needed.

### Next Steps
Suggest recommended actions or follow-ups based on the changes.

---

**Instructions:**
1. Be comprehensive - include ALL significant changes, not just highlights
2. Be specific - use concrete examples and details from the agent outputs
3. Be clear - use plain language and avoid jargon where possible
4. Be structured - follow the exact section headings provided above
5. If a section has no changes, state "No significant changes in this area" 
6. Focus on WHAT changed and WHY it matters to the project

Generate the complete detailed changelog now:`;
}

/**
 * Extracts a brief summary from a full changelog (first line or section)
 */
export function extractChangelogSummary(changelog: string): string {
  if (!changelog) return "No changes";
  
  // Try to extract the title after "Version X -"
  const titleMatch = changelog.match(/##\s*Version\s*\d+\s*-\s*(.+)/i);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1].trim();
  }
  
  // Fall back to first meaningful line
  const lines = changelog.split("\n").filter(line => line.trim() && !line.startsWith("#"));
  if (lines.length > 0) {
    return lines[0].trim().slice(0, 100);
  }
  
  return "Changes made";
}
