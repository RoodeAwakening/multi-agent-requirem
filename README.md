# I.A.N. - Intelligent Analysis Navigator

A multi-agent orchestration system for generating comprehensive requirements documentation from task descriptions. This application uses AI-powered agents to analyze tasks from multiple perspectives (Tech Lead, Business Analyst, Product Owner, etc.) and produce structured requirements documents.

## Features

### Requirements Analysis Pipeline
- **Multi-agent pipeline**: Sequential processing through specialized AI agents
- **AI Model Selection**: Support for Gemini Flash (default), Gemini Pro, GPT-4o, and GPT-4o Mini
- **Flexible Gemini Authentication**: Use CLI-based auth (gcloud) or API key
- **Customizable prompts**: Modify agent prompts to fit your workflow
- **Document generation**: Produces technical specs, business analysis, requirements, and product backlogs
- **Document upload support**: Upload and analyze PDF, DOCX, and various text files as reference materials

### Requirements Grading & Routing
- **Automated requirement grading**: Grade requirements against a comprehensive rubric (A-F)
- **Team assignment**: Automatically route requirements to appropriate teams
- **Quality assessment**: Determine which requirements are ready for handoff
- **Batch processing**: Grade multiple requirements in one job
- **PDF export**: Export grading reports with detailed results
- **Team management**: Define custom teams or use built-in defaults

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the application:
   ```bash
   npm run start
   ```
   This starts both the frontend (Vite) and backend server (Node.js) needed for CLI authentication.

   Or run just the frontend:
   ```bash
   npm run dev
   ```

## AI Model Configuration

I.A.N. defaults to **Gemini Flash** for optimal performance and cost-effectiveness.

### Using Gemini Models (Default - Recommended)

#### Option 1: CLI Authentication (Recommended)

This method uses your gcloud project configuration from your `.bashrc` or `.zshrc` files. The backend server reads the `GOOGLE_CLOUD_PROJECT` environment variable and uses gcloud CLI for authentication.

1. Install the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)
2. Add to your `.bashrc` or `.zshrc`:
   ```bash
   export GOOGLE_CLOUD_PROJECT="your-project-id"
   ```
3. Authenticate:
   ```bash
   gcloud auth application-default login
   ```
4. Enable Vertex AI API in your project
5. Start the app with the backend server:
   ```bash
   npm run start
   ```
6. Open Settings in I.A.N. and select "CLI Authentication"

The backend server will automatically detect your project from the environment variable.

#### Option 2: API Key Authentication

1. Get an API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Open Settings in I.A.N.
3. Select "API Key" authentication mode
4. Enter your Gemini API key
5. Select Gemini Pro or Gemini Flash as your model

### Using OpenAI Models (GPT-4o, GPT-4o Mini)

If you prefer to use OpenAI models instead:

1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Open Settings in I.A.N.
3. Enter your OpenAI API key
4. Select GPT-4o or GPT-4o Mini as your model

**Note:** Your API keys are stored locally in your browser and are only sent directly to the respective AI provider's API.

## Supported File Formats

I.A.N. can process and analyze various file types as reference materials:

### Text Files
- Code files: `.js`, `.ts`, `.tsx`, `.jsx`, `.py`, `.java`, `.c`, `.cpp`, `.go`, `.rs`, `.php`, `.rb`, `.swift`, `.kt`, `.scala`
- Markup/Config: `.html`, `.xml`, `.json`, `.yaml`, `.yml`, `.md`, `.txt`, `.csv`
- Web styles: `.css`, `.scss`
- Shell scripts: `.sh`, `.bash`, `.zsh`
- Database: `.sql`
- Other: `.graphql`, `.vue`, `.svelte`, `.conf`, `.ini`, `.env`, `.toml`

### Document Files
- **PDF** (`.pdf`): Text content is automatically extracted from PDF documents
- **DOCX** (`.docx`): Text content is automatically extracted from Word documents

All extracted text from these files is provided to the AI agents as reference context during analysis.

## Development

- `npm run start` - Start both frontend and backend (recommended)
- `npm run dev` - Start frontend only (Vite dev server)
- `npm run server` - Start backend only (Node.js server)
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

## Using the Requirements Grading Feature

The Requirements Grading feature allows you to automatically assess the quality and readiness of project requirements.

### Creating a Grading Job

1. Switch to the **Grading** tab in the sidebar
2. Click **New Grading Task**
3. Enter a job title and description
4. Add requirements:
   - Paste requirements directly (separate with `---` or use numbered format)
   - Upload from files (PDF, DOCX, TXT, MD)
5. Define teams (optional):
   - Add teams manually with name and description
   - Or click **Load Default Teams** for pre-configured teams
6. Click **Create Grading Job**

### Grading Rubric

Requirements are graded on a scale from A to F:

- **Grade A (Excellent)**: Ready for handoff. Contains complete user story, detailed acceptance criteria, clear scope, no placeholders.
- **Grade B (Good)**: Ready for handoff with minor follow-up. Has user story and acceptance criteria but may be slightly high-level.
- **Grade C (Fair)**: Needs refinement. Missing major sections like acceptance criteria or has undefined scope.
- **Grade D (Poor)**: Incomplete. Just a vague sentence without context or clear goal.
- **Grade F (Unacceptable)**: Not a software requirement. Business goal, contradictory, or nonsensical.

### Running Grading

1. Select a grading job from the list
2. Click **Run Grading**
3. Watch progress as each requirement is evaluated
4. Review the comprehensive report with:
   - Overall summary and grade distribution
   - Detailed results for each requirement
   - Team assignments (if teams were provided)
   - Recommendations for improvements

### Exporting Results

Click **Export PDF** to download a formatted report containing:
- Job summary with statistics
- Grade distribution
- Detailed grading results for all requirements
- Explanations and recommendations

## Architecture

The application consists of:
- **Frontend**: React + Vite application
- **Backend**: Node.js Express server for CLI authentication

The backend server (`server/index.js`) provides:
- Access to gcloud CLI for authentication
- Reading `GOOGLE_CLOUD_PROJECT` from environment
- Proxying requests to Vertex AI with proper credentials

## License

This project is licensed under the MIT license.
