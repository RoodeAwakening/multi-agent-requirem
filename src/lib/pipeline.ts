import { Job, PipelineStepId } from "./types";
import { PIPELINE_STEPS } from "./constants";
import { fillPromptTemplate } from "./prompts";

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
    const prompt = fillPromptTemplate(stepId, variables);

    try {
      const result = await window.spark.llm(prompt, "gpt-4o");
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
    if (!this.job.referenceFolders || this.job.referenceFolders.length === 0) {
      return "No reference materials provided.";
    }

    return this.job.referenceFolders
      .map((folder, index) => `Reference ${index + 1}: ${folder}`)
      .join("\n");
  }
}
