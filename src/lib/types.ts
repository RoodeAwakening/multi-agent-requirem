export type JobStatus = "new" | "running" | "completed" | "failed";

export type PipelineStepId =
  | "tech_lead_initial"
  | "business_analyst_initial"
  | "cross_reviewer"
  | "tech_lead_update"
  | "business_analyst_update"
  | "requirements_agent"
  | "product_owner"
  | "executive_assistant"
  | "changelog_agent";

export interface ReferenceFile {
  name: string;
  path: string;
  content: string;
  type: string;
}

export interface VersionSnapshot {
  version: number;
  createdAt: string;
  description: string;
  changeReason?: string;
  changelog?: string; // AI-generated changelog describing what changed from previous version
  status: JobStatus;
  referenceFolders: string[];
  referenceFiles?: ReferenceFile[];
  outputs: {
    [key: string]: string;
  };
}

export interface Job {
  id: string;
  title: string;
  description: string;
  changeReason?: string; // Description of why this version was created
  referenceFolders: string[];
  referenceFiles?: ReferenceFile[];
  createdAt: string;
  updatedAt: string;
  status: JobStatus;
  version: number;
  currentStep?: PipelineStepId;
  changelog?: string; // AI-generated changelog describing what changed from previous version
  outputs: {
    [key: string]: string;
  };
  versionHistory?: VersionSnapshot[];
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

// Requirement Grading Types
export type RequirementGrade = "A" | "B" | "C" | "D" | "F";

export interface Team {
  name: string;
  description: string;
}

export interface Requirement {
  id: string;
  name: string;
  content: string;
}

export interface GradedRequirement {
  id: string;
  name: string;
  grade: RequirementGrade;
  explanation: string;
  readyForHandoff: boolean;
  assignedTeam?: string;
}

export interface GradingJob {
  id: string;
  title: string;
  description: string;
  requirements: Requirement[];
  teams: Team[];
  createdAt: string;
  updatedAt: string;
  status: JobStatus;
  gradedRequirements?: GradedRequirement[];
  reportContent?: string; // Full markdown report
}
