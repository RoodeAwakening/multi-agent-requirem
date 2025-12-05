# I.A.N. - Intelligent Analysis Navigator

A multi-agent orchestration system for generating comprehensive requirements documentation from task descriptions. This application uses AI-powered agents to analyze tasks from multiple perspectives (Tech Lead, Business Analyst, Product Owner, etc.) and produce structured requirements documents.

## Features

- **Multi-agent pipeline**: Sequential processing through specialized AI agents
- **AI Model Selection**: Support for Gemini Flash (default), Gemini Pro, GPT-4o, and GPT-4o Mini
- **Flexible Gemini Authentication**: Use CLI-based auth (gcloud) or API key
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

I.A.N. defaults to **Gemini Flash** for optimal performance and cost-effectiveness.

### Using Gemini Models (Default - Recommended)

#### Option 1: CLI Authentication (Recommended)

This method uses your gcloud project configuration, which is typically set up in your `.bashrc` or `.zshrc` files.

1. Install the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)
2. Add to your `.bashrc` or `.zshrc`:
   ```bash
   export GOOGLE_CLOUD_PROJECT="your-project-id"
   export CLOUDSDK_CORE_PROJECT="your-project-id"
   ```
3. Authenticate:
   ```bash
   gcloud auth application-default login
   gcloud config set project your-project-id
   ```
4. Enable Vertex AI API in your project
5. Open Settings in I.A.N., select "CLI Authentication" and enter your project ID

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

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

## License

This project is licensed under the MIT license.
