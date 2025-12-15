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
import { Job, VersionSnapshot, PipelineStepId } from "./types";
import { getPromptTemplate, fillPromptTemplate } from "./prompts";

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

  const prompt = await buildChangelogPrompt(previousVersion, currentVersion);
  
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
async function buildChangelogPrompt(
  previousVersion: VersionSnapshot,
  currentVersion: Job | VersionSnapshot
): Promise<string> {
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

  // Get the changelog prompt template (custom or default)
  const promptTemplate = await getPromptTemplate("changelog_agent" as PipelineStepId);
  
  // Build the variables for the template
  const variables: Record<string, string> = {
    PREVIOUS_DESCRIPTION: previousVersion.description,
    PREVIOUS_CHANGE_REASON: previousVersion.changeReason ? `Change Reason: ${previousVersion.changeReason}` : "",
    CURRENT_DESCRIPTION: currentVersion.description,
    CURRENT_CHANGE_REASON: "changeReason" in currentVersion && currentVersion.changeReason ? `Change Reason: ${currentVersion.changeReason}` : "",
    CURRENT_VERSION: currentVersion.version.toString(),
    PREVIOUS_VERSION: previousVersion.version.toString(),
    
    TECH_LEAD_CHANGED: outputChanges.techLead ? "CHANGED" : "No significant changes",
    TECH_LEAD_COMPARISON: outputChanges.techLead ? `
--- Previous Version (v${previousVersion.version}) ---
${getPrevContent(keyOutputs.techLead)}

--- Current Version (v${currentVersion.version}) ---
${getCurrContent(keyOutputs.techLead)}
` : "",
    
    BA_CHANGED: outputChanges.businessAnalyst ? "CHANGED" : "No significant changes",
    BA_COMPARISON: outputChanges.businessAnalyst ? `
--- Previous Version (v${previousVersion.version}) ---
${getPrevContent(keyOutputs.businessAnalyst)}

--- Current Version (v${currentVersion.version}) ---
${getCurrContent(keyOutputs.businessAnalyst)}
` : "",
    
    REQ_CHANGED: outputChanges.requirements ? "CHANGED" : "No significant changes",
    REQ_COMPARISON: outputChanges.requirements ? `
--- Previous Version (v${previousVersion.version}) ---
${getPrevContent(keyOutputs.requirements)}

--- Current Version (v${currentVersion.version}) ---
${getCurrContent(keyOutputs.requirements)}
` : "",
    
    PO_CHANGED: outputChanges.productOwner ? "CHANGED" : "No significant changes",
    PO_COMPARISON: outputChanges.productOwner ? `
--- Previous Version (v${previousVersion.version}) ---
${getPrevContent(keyOutputs.productOwner)}

--- Current Version (v${currentVersion.version}) ---
${getCurrContent(keyOutputs.productOwner)}
` : "",
    
    ADDED_REFS: addedRefs.length > 0 ? addedRefs.join(", ") : "None",
    REMOVED_REFS: removedRefs.length > 0 ? removedRefs.join(", ") : "None",
    REFERENCE_MATERIALS_SECTION: addedRefs.length > 0 || removedRefs.length > 0 ? `
### Added Materials
${addedRefs.map(ref => `- ${ref}`).join('\n') || '- None'}

### Removed Materials
${removedRefs.map(ref => `- ${ref}`).join('\n') || '- None'}
` : '- No changes to reference materials',
  };
  
  // Fill the template with variables
  return fillPromptTemplate(promptTemplate, variables);
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
