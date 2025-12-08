import { Job, PipelineStepId } from "./types";
import { PIPELINE_STEPS } from "./constants";
import { getPromptTemplate, fillPromptTemplate } from "./prompts";
import { callAI, AIModel, AISettings } from "./ai-client";
import { getStoredValue } from "./storage";

export class PipelineOrchestrator {
  private job: Job;
  private onProgress?: (step: PipelineStepId, progress: number) => void;
  private onStepComplete?: (step: PipelineStepId, output: string) => void;

  constructor(
    job: Job,
    callbacks?: {
      onProgress?: (step: PipelineStepId, progress: number) => void;
      onStepComplete?: (step: PipelineStepId, output: string) => void;
    }
  ) {
    this.job = job;
    this.onProgress = callbacks?.onProgress;
    this.onStepComplete = callbacks?.onStepComplete;
  }

  async runFullPipeline(): Promise<Job> {
    const steps = PIPELINE_STEPS;
    const totalSteps = steps.length;

    for (let i = 0; i < totalSteps; i++) {
      const step = steps[i];
      const progress = ((i + 1) / totalSteps) * 100;

      this.onProgress?.(step.id, progress);

      try {
        const output = await this.executeStep(step.id);
        this.job.outputs[step.outputFile] = output;
        this.job.currentStep = step.id;
        this.onStepComplete?.(step.id, output);
      } catch (error) {
        this.job.status = "failed";
        throw error;
      }
    }

    this.job.status = "completed";
    this.job.updatedAt = new Date().toISOString();
    return this.job;
  }

  private async executeStep(stepId: PipelineStepId): Promise<string> {
    const variables = this.buildVariables(stepId);
    const promptTemplate = await getPromptTemplate(stepId);
    const prompt = fillPromptTemplate(promptTemplate, variables);

    // Get AI settings from storage
    let aiSettings: AISettings = { model: "gemini-flash" };
    try {
      const savedSettings = getStoredValue<AISettings>("ai-settings");
      if (savedSettings) {
        aiSettings = savedSettings;
      }
    } catch (error) {
      console.warn("Failed to load AI settings, using defaults:", error);
    }

    try {
      // Call the AI using our unified client, passing the auth mode for Gemini
      const result = await callAI(prompt, aiSettings.model, aiSettings.geminiAuthMode);
      return result;
    } catch (error) {
      console.error(`Failed to execute step ${stepId}:`, error);
      throw new Error(`Pipeline step ${stepId} failed: ${error}`);
    }
  }

  private buildVariables(stepId: PipelineStepId): Record<string, string> {
    const variables: Record<string, string> = {
      TASK_TITLE: this.job.title,
      TASK_DESCRIPTION: this.job.description,
      REFERENCE_CONTENT: this.formatReferences(),
    };

    switch (stepId) {
      case "tech_lead_initial":
        break;

      case "business_analyst_initial":
        variables.TECH_LEAD_CONTENT =
          this.job.outputs["01_tech_lead.md"] || "Not yet available";
        break;

      case "cross_reviewer":
        variables.TECH_LEAD_CONTENT =
          this.job.outputs["01_tech_lead.md"] || "Not yet available";
        variables.BUSINESS_ANALYST_CONTENT =
          this.job.outputs["02_business_analyst.md"] || "Not yet available";
        break;

      case "tech_lead_update":
        variables.TECH_LEAD_CONTENT =
          this.job.outputs["01_tech_lead.md"] || "Not yet available";
        variables.BUSINESS_ANALYST_CONTENT =
          this.job.outputs["02_business_analyst.md"] || "Not yet available";
        variables.QUESTIONS_CONTENT =
          this.job.outputs["03_questions.md"] || "Not yet available";
        break;

      case "business_analyst_update":
        variables.BUSINESS_ANALYST_CONTENT =
          this.job.outputs["02_business_analyst.md"] || "Not yet available";
        variables.TECH_LEAD_CONTENT =
          this.job.outputs["01_tech_lead.md"] || "Not yet available";
        variables.QUESTIONS_CONTENT =
          this.job.outputs["03_questions.md"] || "Not yet available";
        break;

      case "requirements_agent":
        variables.TECH_LEAD_CONTENT =
          this.job.outputs["01_tech_lead.md"] || "Not yet available";
        variables.BUSINESS_ANALYST_CONTENT =
          this.job.outputs["02_business_analyst.md"] || "Not yet available";
        variables.QUESTIONS_CONTENT =
          this.job.outputs["03_questions.md"] || "Not yet available";
        break;

      case "product_owner":
        variables.REQUIREMENTS_CONTENT =
          this.job.outputs["04_requirements_spec.md"] || "Not yet available";
        variables.TECH_LEAD_CONTENT =
          this.job.outputs["01_tech_lead.md"] || "Not yet available";
        variables.BUSINESS_ANALYST_CONTENT =
          this.job.outputs["02_business_analyst.md"] || "Not yet available";
        break;

      case "executive_assistant":
        variables.REQUIREMENTS_CONTENT =
          this.job.outputs["04_requirements_spec.md"] || "Not yet available";
        variables.PRODUCT_BACKLOG_CONTENT =
          this.job.outputs["05_product_backlog.md"] || "Not yet available";
        break;
    }

    return variables;
  }

  private formatReferences(): string {
    const parts: string[] = [];

    // If this is a versioned job with previous outputs, include them as reference context
    if (this.job.version > 1 && this.job.versionHistory && this.job.versionHistory.length > 0) {
      const previousVersion = this.job.versionHistory[this.job.versionHistory.length - 1];
      
      if (previousVersion.outputs && Object.keys(previousVersion.outputs).length > 0) {
        parts.push(`=== PREVIOUS VERSION ANALYSIS (Version ${previousVersion.version}) ===`);
        parts.push("This context provides the analysis from the previous version. Use it to maintain continuity and build upon prior work.\n");
        
        Object.entries(previousVersion.outputs).forEach(([filename, content]) => {
          if (content) {
            parts.push(`--- Previous Analysis: ${filename} ---`);
            parts.push(content);
            parts.push(`--- End of ${filename} ---\n`);
          }
        });
        
        parts.push("=== END OF PREVIOUS VERSION ANALYSIS ===\n");
      }
    }

    // Then, include current reference files
    if (this.job.referenceFiles && this.job.referenceFiles.length > 0) {
      if (parts.length > 0) {
        parts.push("=== NEW REFERENCE MATERIALS ===");
        parts.push("These are new materials added for this version:\n");
      }
      
      const formattedFiles = this.job.referenceFiles.map((file) => {
        return `--- File: ${file.path} ---\n${file.content}\n--- End of ${file.name} ---`;
      });
      parts.push(formattedFiles.join("\n\n"));
      
      if (this.job.version > 1) {
        parts.push("=== END OF NEW REFERENCE MATERIALS ===");
      }
      
      return parts.join("\n\n");
    }
    
    // Fallback to just listing folders if no file contents available
    if (this.job.referenceFolders && this.job.referenceFolders.length > 0) {
      if (parts.length > 0) {
        parts.push("=== REFERENCE FOLDERS ===");
      }
      parts.push(this.job.referenceFolders
        .map((folder, index) => `Reference ${index + 1}: ${folder}`)
        .join("\n"));
      return parts.join("\n\n");
    }

    if (parts.length > 0) {
      return parts.join("\n\n");
    }

    return "No reference materials provided.";
  }
}
