# Multi-Agent Requirements Pipeline

A multi-agent orchestration system for generating comprehensive requirements documentation from task descriptions. This application uses AI-powered agents to analyze tasks from multiple perspectives (Tech Lead, Business Analyst, Product Owner, etc.) and produce structured requirements documents.

## Features

- **Multi-agent pipeline**: Sequential processing through specialized AI agents
- **AI Model Selection**: Support for GPT-4o, GPT-4o Mini, Gemini Pro, and Gemini Flash
- **Customizable prompts**: Modify agent prompts to fit your workflow
- **Document generation**: Produces technical specs, business analysis, requirements, and product backlogs

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

## AI Model Configuration

### Using OpenAI Models (GPT-4o, GPT-4o Mini)

OpenAI models work out of the box with the default configuration.

### Using Gemini Models (Gemini Pro, Gemini Flash)

To use Google's Gemini models, you need to configure access via the Google Cloud CLI:

1. **Install the Google Cloud CLI**
   
   Follow the installation instructions at: https://cloud.google.com/sdk/docs/install

2. **Authenticate with Google Cloud**
   ```bash
   gcloud auth login
   ```

3. **Select a Project with Gemini API Access**
   
   List your available projects:
   ```bash
   gcloud projects list
   ```
   
   Set your project (use a project that has Gemini API enabled):
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

4. **Enable the Gemini API**
   
   If not already enabled, enable the Gemini API for your project:
   ```bash
   gcloud services enable aiplatform.googleapis.com
   ```

5. **Verify Your Configuration**
   ```bash
   gcloud config list
   ```

Once configured, select Gemini Pro or Gemini Flash in the Settings dialog within the application.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

## License

This project is licensed under the MIT license.
