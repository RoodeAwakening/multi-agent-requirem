import { GradingJob, GradedRequirement, RequirementGrade, Requirement, Team } from "./types";
import { callAI, AISettings } from "./ai-client";
import { getStoredValue } from "./storage";

/**
 * Grading rubric based on the issue requirements
 */
export const GRADING_RUBRIC = `
# Requirement Grading Rubric

## Grade A - Excellent
- **Description**: Requirement is clear, complete and specific. Contains all necessary details for a tech team to start work without ambiguity. Scope is well defined.
- **Agent litmus test**: All required sections are present, filled out and meet quality standards
- **Actionable checklist**:
  - Contains a standard user story (as a... I want to... so that...)
  - Contains a detailed acceptance criteria section (e.g. a numbered list of specific outcomes or Given/when/then)
  - Scope is clearly defined (e.g. reference specific systems, pages or components)
  - Contains no placeholder language (e.g. TBD, TBD later)
- **Ready for handoff**: Yes

## Grade B - Good
- **Description**: Mostly clear and specific, but minor clarifications may be needed. Tech team can proceed with minimal follow up.
- **Agent Litmus test**: All required sections are present, but some content is slightly ambiguous or needs minor expansion.
- **Actionable checklist**:
  - Contains a user story
  - Contains an acceptance criteria section, but the criteria may be high level (e.g. "user should see an error" instead of specifying the error message)
  - May contain minor placeholder language (e.g. "final error message TBD")
- **Ready for handoff**: Yes

## Grade C - Fair
- **Description**: Requirement is understandable but lacks some key details, needs moderate refinement before handoff.
- **Agent Litmus test**: A major required section (like acceptance criteria) is missing entirely.
- **Actionable checklist**:
  - Contains a clear goal or user story
  - Is missing the entire acceptance criteria section
  - OR the scope is undefined (e.g. "Improve dashboard performance" without specifying what to improve or by how much)
- **Ready for handoff**: No

## Grade D - Poor
- **Description**: Requirement is incomplete or overly vague. Significant clarification and restructuring required.
- **Agent Litmus test**: The requirement is just a single vague sentence or a title with no body
- **Actionable checklist**:
  - Lacks a standard user story format or clear goal
  - Is a single sentence that describes a feature without any context (e.g. "we need a password reset feature")
  - Lacks any definition of scope or success
- **Ready for handoff**: No

## Grade F - Unacceptable
- **Description**: Requirement is confusing, contradictory, too high level (a business goal) or missing critical context
- **Agent Litmus test**: The text is not a software requirement, it's a business goal, a bug report with no context, or nonsensical.
- **Actionable checklist**:
  - Describes a large business objective, not a specific feature (e.g. "increase user engagement")
  - OR contains contradictory statements (e.g. "the user must log in to see the public homepage")
  - OR is nonsensical or indecipherable
- **Ready for handoff**: No
`;

/**
 * Generate the prompt for grading a single requirement
 */
function generateGradingPrompt(requirement: Requirement, teams: Team[]): string {
  const teamsSection = teams.length > 0 
    ? `\n**Available Teams:**\n${teams.map(t => `- ${t.name}: ${t.description}`).join('\n')}\n`
    : '';

  return `You are a Requirements Quality Analyst. Your job is to evaluate software requirements against a strict grading rubric.

${GRADING_RUBRIC}

**Requirement to Grade:**
ID: ${requirement.id}
Name: ${requirement.name}

Content:
${requirement.content}
${teamsSection}

**Your Task:**
Analyze this requirement and provide:
1. A grade (A, B, C, D, or F) based on the rubric above
2. A clear explanation (2-3 sentences) of why you assigned this grade and what needs to change to reach an A
3. Whether it's ready for tech team handoff (Yes/No based on the rubric)
4. If it's ready for handoff (grade A or B) AND teams are provided, assign it to the most appropriate team based on the requirement content and team descriptions. If not ready or no teams provided, leave this empty.

**IMPORTANT OUTPUT FORMAT:**
Return ONLY a valid JSON object with this exact structure (no markdown code fences, no extra text):
{
  "grade": "A|B|C|D|F",
  "explanation": "Brief explanation here...",
  "readyForHandoff": true|false,
  "assignedTeam": "Team Name" or ""
}`;
}

/**
 * Grade a single requirement using AI
 */
async function gradeRequirement(
  requirement: Requirement, 
  teams: Team[],
  aiSettings: AISettings
): Promise<GradedRequirement> {
  const prompt = generateGradingPrompt(requirement, teams);
  
  try {
    const response = await callAI(prompt, aiSettings.model, aiSettings.geminiAuthMode);
    
    // Parse the JSON response
    // Remove potential markdown code fences
    let cleanedResponse = response.trim();
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*/g, '').replace(/\s*```$/g, '');
    }
    
    const parsed = JSON.parse(cleanedResponse);
    
    return {
      id: requirement.id,
      name: requirement.name,
      grade: parsed.grade as RequirementGrade,
      explanation: parsed.explanation,
      readyForHandoff: parsed.readyForHandoff,
      assignedTeam: parsed.assignedTeam || undefined,
    };
  } catch (error) {
    console.error(`Failed to grade requirement ${requirement.id}:`, error);
    // Return a default failed grade
    return {
      id: requirement.id,
      name: requirement.name,
      grade: "F",
      explanation: `Error during grading: ${error instanceof Error ? error.message : String(error)}`,
      readyForHandoff: false,
    };
  }
}

/**
 * Generate a comprehensive report from all graded requirements
 */
function generateGradingReport(
  job: GradingJob,
  gradedRequirements: GradedRequirement[]
): string {
  const totalRequirements = gradedRequirements.length;
  const readyCount = gradedRequirements.filter(r => r.readyForHandoff).length;
  const gradeDistribution = {
    A: gradedRequirements.filter(r => r.grade === 'A').length,
    B: gradedRequirements.filter(r => r.grade === 'B').length,
    C: gradedRequirements.filter(r => r.grade === 'C').length,
    D: gradedRequirements.filter(r => r.grade === 'D').length,
    F: gradedRequirements.filter(r => r.grade === 'F').length,
  };

  let report = `# Requirements Grading Report\n\n`;
  report += `**Job:** ${job.title}\n`;
  report += `**Description:** ${job.description}\n`;
  report += `**Date:** ${new Date(job.updatedAt).toLocaleString()}\n\n`;
  
  report += `## Summary\n\n`;
  report += `- **Total Requirements:** ${totalRequirements}\n`;
  report += `- **Ready for Handoff:** ${readyCount} (${Math.round(readyCount/totalRequirements*100)}%)\n`;
  report += `- **Grade Distribution:**\n`;
  report += `  - A (Excellent): ${gradeDistribution.A}\n`;
  report += `  - B (Good): ${gradeDistribution.B}\n`;
  report += `  - C (Fair): ${gradeDistribution.C}\n`;
  report += `  - D (Poor): ${gradeDistribution.D}\n`;
  report += `  - F (Unacceptable): ${gradeDistribution.F}\n\n`;

  report += `## Detailed Results\n\n`;
  report += `| Requirement ID | Requirement Name | Grade | Ready for Handoff | Assigned Team | Explanation |\n`;
  report += `|---------------|------------------|-------|-------------------|---------------|-------------|\n`;
  
  gradedRequirements.forEach(req => {
    const readyText = req.readyForHandoff ? 'Yes' : 'No';
    const teamText = req.assignedTeam || '-';
    report += `| ${req.id} | ${req.name} | ${req.grade} | ${readyText} | ${teamText} | ${req.explanation} |\n`;
  });

  report += `\n## Recommendations\n\n`;
  
  const needsWork = gradedRequirements.filter(r => !r.readyForHandoff);
  if (needsWork.length > 0) {
    report += `### Requirements Needing Refinement (${needsWork.length})\n\n`;
    needsWork.forEach(req => {
      report += `#### ${req.id}: ${req.name}\n`;
      report += `- **Grade:** ${req.grade}\n`;
      report += `- **Issue:** ${req.explanation}\n\n`;
    });
  }

  const ready = gradedRequirements.filter(r => r.readyForHandoff);
  if (ready.length > 0) {
    report += `### Ready for Development (${ready.length})\n\n`;
    
    // Group by team
    const byTeam = new Map<string, GradedRequirement[]>();
    ready.forEach(req => {
      const team = req.assignedTeam || 'Unassigned';
      if (!byTeam.has(team)) {
        byTeam.set(team, []);
      }
      byTeam.get(team)!.push(req);
    });

    byTeam.forEach((reqs, team) => {
      report += `#### ${team} (${reqs.length} requirements)\n`;
      reqs.forEach(req => {
        report += `- ${req.id}: ${req.name} (Grade: ${req.grade})\n`;
      });
      report += `\n`;
    });
  }

  return report;
}

/**
 * Process all requirements in a grading job
 */
export async function processGradingJob(
  job: GradingJob,
  onProgress?: (current: number, total: number, currentReq: string) => void
): Promise<GradingJob> {
  // Get AI settings from storage
  let aiSettings: AISettings = { model: "gemini-2.5-flash" };
  try {
    const savedSettings = getStoredValue<AISettings>("ai-settings");
    if (savedSettings) {
      aiSettings = savedSettings;
    }
  } catch (error) {
    console.warn("Failed to load AI settings, using defaults:", error);
  }

  const gradedRequirements: GradedRequirement[] = [];
  const total = job.requirements.length;

  for (let i = 0; i < total; i++) {
    const requirement = job.requirements[i];
    onProgress?.(i + 1, total, requirement.name);
    
    const graded = await gradeRequirement(requirement, job.teams, aiSettings);
    gradedRequirements.push(graded);
  }

  // Generate the comprehensive report
  const reportContent = generateGradingReport(job, gradedRequirements);

  // Update the job
  const updatedJob: GradingJob = {
    ...job,
    gradedRequirements,
    reportContent,
    status: "completed",
    updatedAt: new Date().toISOString(),
  };

  return updatedJob;
}
