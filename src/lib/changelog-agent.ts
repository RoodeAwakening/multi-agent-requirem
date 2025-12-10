/**
 * Changelog Agent
 * 
 * This module provides functionality to generate AI-powered changelogs
 * that describe what changed between versions of a task/job.
 */

import { generateContent } from "./ai-client";
import { Job, VersionSnapshot } from "./types";

/**
 * Generates a changelog describing the differences between two versions
 * @param previousVersion - The previous version snapshot (or null for version 1)
 * @param currentVersion - The current/new version
 * @returns A markdown-formatted changelog describing the changes
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
    const changelog = await generateContent(prompt);
    return changelog;
  } catch (error) {
    console.error("Error generating changelog:", error);
    return "Unable to generate changelog at this time.";
  }
}

/**
 * Builds the prompt for the changelog generation
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
  
  // Extract changes in reference files
  const oldFiles = new Set((previousVersion.referenceFiles || []).map(f => f.name));
  const newFiles = new Set((currentVersion.referenceFiles || []).map(f => f.name));
  const addedFiles = [...newFiles].filter(file => !oldFiles.has(file));
  const removedFiles = [...oldFiles].filter(file => !newFiles.has(file));

  // Build prompt
  return `You are a technical writer creating release notes/changelog for a software requirements document.

**Task:** Generate a concise, professional changelog that describes what changed from version ${previousVersion.version} to version ${currentVersion.version}.

**Previous Version (v${previousVersion.version}):**
Description: ${previousVersion.description}
${previousVersion.changeReason ? `Change Reason: ${previousVersion.changeReason}` : ""}

**Current Version (v${currentVersion.version}):**
Description: ${currentVersion.description}
${"changeReason" in currentVersion && currentVersion.changeReason ? `Change Reason: ${currentVersion.changeReason}` : ""}

**Changes in Reference Materials:**
- Added Folders: ${addedRefs.length > 0 ? addedRefs.join(", ") : "None"}
- Removed Folders: ${removedRefs.length > 0 ? removedRefs.join(", ") : "None"}
- Added Files: ${addedFiles.length > 0 ? addedFiles.join(", ") : "None"}
- Removed Files: ${removedFiles.length > 0 ? removedFiles.join(", ") : "None"}

**Instructions:**
1. Create a changelog in markdown format
2. Use bullet points to list changes
3. Organize into sections: "Requirements Changes", "New Features/Updates", "Reference Materials", "Technical Changes"
4. Be specific about what changed and why (if the change reason is provided)
5. Keep it concise but informative (aim for 100-300 words)
6. If there are no significant changes, say "Minor updates and refinements"
7. Focus on business value and user impact

**Format Example:**
## Version ${currentVersion.version} - [Brief Title]

### Requirements Changes
- Updated requirement X to include Y
- Added new constraint for Z

### New Features/Updates
- New feature A based on stakeholder feedback
- Enhanced functionality for B

### Reference Materials
- Added: [list new files/folders]
- Updated: [list updated materials]

### Technical Changes
- [Any technical specifications that changed]

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
