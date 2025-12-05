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

Configure your API keys in the Settings dialog (click the gear icon).

### Using OpenAI Models (GPT-4o, GPT-4o Mini)

1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Open Settings in the application
3. Enter your OpenAI API key
4. Select GPT-4o or GPT-4o Mini as your model

### Using Gemini Models (Gemini Pro, Gemini Flash)

1. Get an API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Open Settings in the application
3. Enter your Gemini API key
4. Select Gemini Pro or Gemini Flash as your model

**Note:** Your API keys are stored locally in your browser and are only sent directly to the respective AI provider's API.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

## License

This project is licensed under the MIT license.
