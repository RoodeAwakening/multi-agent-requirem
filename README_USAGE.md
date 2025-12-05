# Agent Pipeline Orchestrator

A local-first multi-agent pipeline system that orchestrates specialized AI agents to analyze tasks from initial technical and business perspectives through to executive summaries.

## Overview

This application runs a fixed pipeline of 8 AI agents that analyze your tasks:

1. **Tech Lead** - Initial technical assessment and architecture
2. **Business Analyst** - Business context and requirements
3. **Cross Reviewer** - Questions and clarifications
4. **Tech Lead Update** - Updated analysis with Q&A
5. **Business Analyst Update** - Updated analysis with Q&A
6. **Requirements Agent** - Comprehensive requirements specification
7. **Product Owner** - User stories and backlog
8. **Executive Assistant** - Executive summary

## Features

- 🚀 **Easy Setup**: No cloud databases or complex configuration required
- 🔒 **Local First**: All data stored locally using browser storage
- 🤖 **Multi-Agent Pipeline**: 8 specialized agents analyze your task
- 📝 **Markdown Outputs**: All outputs in readable markdown format
- 🎯 **Minimal Interaction**: Create task → Run pipeline → Read results
- 💾 **Persistent Storage**: Tasks and outputs saved between sessions

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Modern web browser

## Installation

1. Clone or download this repository

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to the URL shown (typically `http://localhost:5173`)

## Usage

### Creating a Task

1. Click **"New Task"** button in the sidebar
2. Fill in:
   - **Task Title**: Brief name for your task
   - **Description**: Detailed description of what needs to be analyzed
   - **Reference Materials** (optional): Paths, URLs, or descriptions of supporting documents
3. Click **"Create Task"**

### Running the Pipeline

1. Select a task from the sidebar
2. Click **"Run Full Pipeline"**
3. Wait for all 8 agents to complete (progress bar shows status)
4. View generated outputs in the tabs

### Viewing Outputs

- Use the tabs to switch between different agent outputs
- All outputs are formatted markdown
- Outputs include:
  - Technical analysis and architecture
  - Business requirements and objectives
  - Clarifying questions and answers
  - Detailed requirements specification
  - Product backlog with user stories
  - Executive summary for leadership

## Customizing the AI Model

This application uses the Spark LLM API which defaults to GPT-4. To use **Gemini** instead:

1. Open `src/lib/pipeline.ts`
2. Find the `executeStep` method
3. Change the model parameter:

```typescript
// Current (GPT-4):
const result = await window.spark.llm(prompt, "gpt-4o");

// For Gemini (when supported by Spark):
const result = await window.spark.llm(prompt, "gemini-2.0-pro");
```

**Note**: The current Spark runtime may not support Gemini directly. For full Gemini integration, you would need to:
- Set up a backend server with Gemini API access
- Modify the pipeline orchestrator to call your backend
- Handle file uploads for reference materials

## Architecture

### Frontend (React + TypeScript)
- **React 19** with TypeScript for type safety
- **Tailwind CSS v4** for styling
- **Shadcn UI** components for consistent design
- **Spark KV Store** for data persistence

### Key Files
- `src/lib/types.ts` - TypeScript type definitions
- `src/lib/constants.ts` - Pipeline configuration
- `src/lib/prompts.ts` - Agent prompt templates
- `src/lib/pipeline.ts` - Pipeline orchestration logic
- `src/components/MainLayout.tsx` - Main application layout
- `src/components/JobDetail.tsx` - Task detail and output viewer
- `src/components/JobList.tsx` - Task list sidebar
- `src/components/NewJobDialog.tsx` - Task creation dialog

### Data Storage

All data is stored in the browser using the Spark KV store:
- Key: `"jobs"`
- Value: Array of Job objects with outputs

No external database required!

## Customizing Prompts

Each agent has a customizable prompt template in `src/lib/prompts.ts`. You can modify:
- Agent roles and instructions
- Required output structure
- Section headings
- Analysis focus areas

Example:
```typescript
export const PROMPTS: Record<PipelineStepId, string> = {
  tech_lead_initial: `You are a Senior Engineering Tech Lead...
  
  // Modify this prompt to change Tech Lead behavior
  `,
  // ... other agents
};
```

## Troubleshooting

### Pipeline Fails
- Check browser console for errors
- Verify AI model is accessible
- Ensure task description is clear and detailed

### Outputs Not Showing
- Wait for pipeline to complete (check status badge)
- Look for error messages in toast notifications
- Try running the pipeline again

### Data Not Persisting
- Check that browser storage is enabled
- Verify you're using the same browser/profile
- Try clearing and recreating tasks

## Development

### Adding New Agents

1. Add new step to `PipelineStepId` type in `src/lib/types.ts`
2. Add step config to `PIPELINE_STEPS` in `src/lib/constants.ts`
3. Create prompt template in `src/lib/prompts.ts`
4. Update pipeline orchestrator in `src/lib/pipeline.ts`
5. Add output file to `OUTPUT_FILES` constant

### Modifying UI

- Theme colors: `src/index.css` (`:root` section)
- Layout: `src/components/MainLayout.tsx`
- Components use Shadcn UI from `src/components/ui/`

## Technical Stack

- **React 19** - UI framework
- **TypeScript 5** - Type safety
- **Tailwind CSS v4** - Styling
- **Shadcn UI v4** - Component library
- **Vite 7** - Build tool
- **Spark Runtime** - LLM integration and storage
- **Marked** - Markdown rendering
- **Phosphor Icons** - Icons

## License

MIT

## Contributing

This is a template application. Feel free to fork and customize for your needs!

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the code comments
3. Examine browser console for errors
