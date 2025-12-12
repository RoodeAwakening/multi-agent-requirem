import { PipelineStepId } from "./types";

export interface StatusMessage {
  text: string;
  type: "serious" | "funny";
}

export const STATUS_MESSAGES: Record<PipelineStepId, StatusMessage[]> = {
  tech_lead_initial: [
    { text: "Architecting the future, one API at a time...", type: "serious" },
    { text: "Analyzing technical feasibility and system design...", type: "serious" },
    { text: "Evaluating technology stack and infrastructure needs...", type: "serious" },
    { text: "Mapping out microservices before they become macro-problems...", type: "funny" },
    { text: "Checking if we can just use Kubernetes for this...", type: "funny" },
    { text: "Convincing myself this won't need a complete rewrite in 6 months...", type: "funny" },
  ],
  business_analyst_initial: [
    { text: "Identifying business requirements and objectives...", type: "serious" },
    { text: "Analyzing stakeholder needs and market context...", type: "serious" },
    { text: "Mapping business processes and workflows...", type: "serious" },
    { text: "Translating 'make it pop' into actual requirements...", type: "funny" },
    { text: "Finding out what the stakeholders really meant to say...", type: "funny" },
    { text: "Writing down requirements that will definitely change next week...", type: "funny" },
  ],
  cross_reviewer: [
    { text: "Identifying gaps and inconsistencies between perspectives...", type: "serious" },
    { text: "Generating clarifying questions for alignment...", type: "serious" },
    { text: "Cross-referencing technical and business requirements...", type: "serious" },
    { text: "Decoding what the Tech Lead and Business Analyst were actually saying...", type: "funny" },
    { text: "Playing mediator between tech dreams and business reality...", type: "funny" },
    { text: "Asking the questions everyone was too afraid to ask...", type: "funny" },
  ],
  tech_lead_update: [
    { text: "Refining technical approach based on clarifications...", type: "serious" },
    { text: "Updating architecture decisions with new insights...", type: "serious" },
    { text: "Incorporating feedback into technical specifications...", type: "serious" },
    { text: "Admitting that the first draft missed a few things...", type: "funny" },
    { text: "Grudgingly accepting that the Business Analyst had a point...", type: "funny" },
    { text: "Revising the 'definitely scalable' architecture...", type: "funny" },
  ],
  business_analyst_update: [
    { text: "Refining business requirements with technical context...", type: "serious" },
    { text: "Updating stakeholder requirements based on feedback...", type: "serious" },
    { text: "Aligning business objectives with technical constraints...", type: "serious" },
    { text: "Adjusting expectations to match reality (finally)...", type: "funny" },
    { text: "Accepting that 'enterprise-grade' means more than just expensive...", type: "funny" },
    { text: "Rewriting requirements to work with actual technology...", type: "funny" },
  ],
  requirements_agent: [
    { text: "Synthesizing comprehensive system requirements...", type: "serious" },
    { text: "Documenting functional and non-functional specifications...", type: "serious" },
    { text: "Creating detailed requirement traceability matrix...", type: "serious" },
    { text: "Making sense of everyone's 'synergistic vision'...", type: "funny" },
    { text: "Turning abstract concepts into concrete specifications...", type: "funny" },
    { text: "Writing requirements that developers won't immediately question...", type: "funny" },
  ],
  product_owner: [
    { text: "Breaking down requirements into user stories...", type: "serious" },
    { text: "Prioritizing backlog items by business value...", type: "serious" },
    { text: "Creating actionable sprint-ready work items...", type: "serious" },
    { text: "Splitting epics before they become sagas...", type: "funny" },
    { text: "Assigning story points with unfounded confidence...", type: "funny" },
    { text: "Convincing myself these estimates are totally accurate...", type: "funny" },
  ],
  executive_assistant: [
    { text: "Summarizing technical details for leadership...", type: "serious" },
    { text: "Creating executive-level overview and recommendations...", type: "serious" },
    { text: "Distilling complexity into strategic insights...", type: "serious" },
    { text: "Removing all the words executives don't want to read...", type: "funny" },
    { text: "Translating 'it's complicated' into 'strategic opportunity'...", type: "funny" },
    { text: "Making sure the TL;DR is actually TL...", type: "funny" },
  ],
};

export function getRandomStatusMessage(stepId: PipelineStepId): StatusMessage {
  const messages = STATUS_MESSAGES[stepId];
  if (!messages || messages.length === 0) {
    return { text: `Processing ${stepId}...`, type: "serious" };
  }
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}

export function getStatusMessages(stepId: PipelineStepId): StatusMessage[] {
  return STATUS_MESSAGES[stepId] || [{ text: `Processing ${stepId}...`, type: "serious" }];
}
