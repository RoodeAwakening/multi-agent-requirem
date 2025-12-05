import { PipelineStep, OutputFile } from "./types";

export const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "tech_lead_initial",
    name: "Tech Lead Analysis",
    outputFile: "01_tech_lead.md",
    description: "Initial technical assessment and architecture proposal",
    order: 1,
  },
  {
    id: "business_analyst_initial",
    name: "Business Analysis",
    outputFile: "02_business_analyst.md",
    description: "Business context, objectives, and requirements",
    order: 2,
  },
  {
    id: "cross_reviewer",
    name: "Cross Review",
    outputFile: "03_questions.md",
    description: "Questions and clarifications needed",
    order: 3,
  },
  {
    id: "tech_lead_update",
    name: "Tech Lead Update",
    outputFile: "01_tech_lead.md",
    description: "Updated technical analysis with clarifications",
    order: 4,
  },
  {
    id: "business_analyst_update",
    name: "Business Analyst Update",
    outputFile: "02_business_analyst.md",
    description: "Updated business analysis with clarifications",
    order: 5,
  },
  {
    id: "requirements_agent",
    name: "Requirements Specification",
    outputFile: "04_requirements_spec.md",
    description: "Detailed system requirements and specifications",
    order: 6,
  },
  {
    id: "product_owner",
    name: "Product Backlog",
    outputFile: "05_product_backlog.md",
    description: "User stories and product backlog items",
    order: 7,
  },
  {
    id: "executive_assistant",
    name: "Executive Summary",
    outputFile: "06_exec_summary.md",
    description: "High-level summary for leadership",
    order: 8,
  },
];

export const OUTPUT_FILES: OutputFile[] = [
  {
    filename: "01_tech_lead.md",
    label: "Tech Lead",
    step: "tech_lead_initial",
    icon: "Code",
  },
  {
    filename: "02_business_analyst.md",
    label: "Business Analyst",
    step: "business_analyst_initial",
    icon: "ChartLine",
  },
  {
    filename: "03_questions.md",
    label: "Questions",
    step: "cross_reviewer",
    icon: "Question",
  },
  {
    filename: "04_requirements_spec.md",
    label: "Requirements",
    step: "requirements_agent",
    icon: "ListChecks",
  },
  {
    filename: "05_product_backlog.md",
    label: "Product Backlog",
    step: "product_owner",
    icon: "Kanban",
  },
  {
    filename: "06_exec_summary.md",
    label: "Executive Summary",
    step: "executive_assistant",
    icon: "PresentationChart",
  },
];

export function generateJobId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  
  return `JOB-${year}${month}${day}-${hours}${minutes}${seconds}`;
}
