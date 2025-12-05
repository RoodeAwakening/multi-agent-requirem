export type JobStatus = "new" | "running" | "completed" | "failed";

export type PipelineStepId =
  | "tech_lead_initial"
  | "business_analyst_initial"
  | "cross_reviewer"
  | "tech_lead_update"
  | "business_analyst_update"
  | "requirements_agent"
  | "product_owner"
  | "executive_assistant";

export interface Job {
  id: string;
  title: string;
  description: string;
  referenceFolders: string[];
  createdAt: string;
  updatedAt: string;
  status: JobStatus;
  version: number;
  currentStep?: PipelineStepId;
  outputs: {
    [key: string]: string;
  };
}

export interface PipelineStep {
  id: PipelineStepId;
  name: string;
  outputFile: string;
  description: string;
  order: number;
}

export interface OutputFile {
  filename: string;
  label: string;
  step: PipelineStepId;
  icon: string;
}
