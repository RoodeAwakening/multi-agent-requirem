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
  
  // Get summaries of outputs for comparison (first 500 chars to keep prompt manageable)
  const getPrevSummary = (key: string) => (prevOutputs[key] || "Not available").slice(0, 500);
  const getCurrSummary = (key: string) => (currOutputs[key] || "Not available").slice(0, 500);

  // Build prompt
  return `You are a technical writer creating release notes/changelog for a software requirements analysis.

**Task:** Generate a concise, professional changelog that describes what changed from version ${previousVersion.version} to version ${currentVersion.version} by comparing the agent outputs.

**Previous Version (v${previousVersion.version}):**
Description: ${previousVersion.description}
${previousVersion.changeReason ? `Change Reason: ${previousVersion.changeReason}` : ""}

**Current Version (v${currentVersion.version}):**
Description: ${currentVersion.description}
${"changeReason" in currentVersion && currentVersion.changeReason ? `Change Reason: ${currentVersion.changeReason}` : ""}

**Agent Output Changes:**

**Tech Lead Analysis:** ${outputChanges.techLead ? "CHANGED" : "No changes"}
${outputChanges.techLead ? `
Previous (excerpt): ${getPrevSummary(keyOutputs.techLead)}
Current (excerpt): ${getCurrSummary(keyOutputs.techLead)}
` : ""}

**Business Analyst Analysis:** ${outputChanges.businessAnalyst ? "CHANGED" : "No changes"}
${outputChanges.businessAnalyst ? `
Previous (excerpt): ${getPrevSummary(keyOutputs.businessAnalyst)}
Current (excerpt): ${getCurrSummary(keyOutputs.businessAnalyst)}
` : ""}

**Requirements Specification:** ${outputChanges.requirements ? "CHANGED" : "No changes"}
${outputChanges.requirements ? `
Previous (excerpt): ${getPrevSummary(keyOutputs.requirements)}
Current (excerpt): ${getCurrSummary(keyOutputs.requirements)}
` : ""}

**Product Owner Backlog:** ${outputChanges.productOwner ? "CHANGED" : "No changes"}
${outputChanges.productOwner ? `
Previous (excerpt): ${getPrevSummary(keyOutputs.productOwner)}
Current (excerpt): ${getCurrSummary(keyOutputs.productOwner)}
` : ""}

**Reference Materials Changes:**
- Added Folders: ${addedRefs.length > 0 ? addedRefs.join(", ") : "None"}
- Removed Folders: ${removedRefs.length > 0 ? removedRefs.join(", ") : "None"}

**Instructions:**
1. Create a changelog in markdown format with clear sections for each agent
2. For each agent that changed, summarize the KEY differences and their impact
3. Use bullet points for clarity
4. Organize into sections: "Tech Lead Changes", "Business Analyst Changes", "Requirements Changes", "Product Owner Changes"
5. Keep each section concise (2-4 bullet points per agent)
6. Focus on WHAT changed and WHY it matters
7. If an agent's output didn't change, briefly note "No significant changes"

**Format Example:**
## Version ${currentVersion.version} - [Brief Title]

### Tech Lead Changes
- Updated architecture to include [specific change]
- Added technical consideration for [feature]
- Refined performance requirements

### Business Analyst Changes
- Expanded business case for [feature]
- Added new success metrics
- No significant changes (if applicable)

### Requirements Changes  
- Added detailed specification for [feature]
- Updated acceptance criteria
- Clarified edge cases

### Product Owner Changes
- New user stories for [feature]
- Reprioritized backlog based on feedback
- Added acceptance criteria for [story]

Generate the changelog now:`;
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
