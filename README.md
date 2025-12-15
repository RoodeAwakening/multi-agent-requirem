# I.A.N. - Intelligent Analysis Navigator

A multi-agent orchestration system for generating comprehensive requirements documentation from task descriptions. This application uses AI-powered agents to analyze tasks from multiple perspectives (Tech Lead, Business Analyst, Product Owner, etc.) and produce structured requirements documents.

## Features

- **Multi-agent pipeline**: Sequential processing through specialized AI agents
- **AI Model Selection**: Support for Gemini Flash (default), Gemini Pro, GPT-4o, and GPT-4o Mini
- **Flexible Gemini Authentication**: Use CLI-based auth (gcloud) or API key
- **Customizable prompts**: Modify agent prompts to fit your workflow
- **Document generation**: Produces technical specs, business analysis, requirements, and product backlogs
- **Document upload support**: Upload and analyze PDF, DOCX, and various text files as reference materials

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

## Architecture

The application consists of:
- **Frontend**: React + Vite application
- **Backend**: Node.js Express server for CLI authentication

The backend server (`server/index.js`) provides:
- Access to gcloud CLI for authentication
- Reading `GOOGLE_CLOUD_PROJECT` from environment
- Proxying requests to Vertex AI with proper credentials

## License Enforcement

This application includes a cryptographic license enforcement system to control continued use based on an active commercial license. 

### Features
- **Cryptographic Validation**: RSA-2048 signatures ensure license authenticity
- **Tamper-Resistant**: Any modification to license data invalidates the signature
- **Feature-Based Control**: Different license types enable different features
- **Expiration Management**: Licenses have defined validity periods
- **User-Friendly**: Clear error messages and license management UI

### For End Users

1. **Installing a License**:
   - Open Settings (gear icon) → License tab
   - Click "Select License File"
   - Choose your license file (.json)
   - The license will be validated and activated

2. **License Requirements**:
   - A valid license is required to access AI features and run pipelines
   - License files are cryptographically signed
   - Contact your vendor for license renewal or support

### For Administrators/Vendors

1. **Generating Licenses**:
   ```bash
   # Generate a test license with default values
   node scripts/quick-license.js
   
   # Or use the interactive generator
   node scripts/generate-license.js customer-license.json
   ```

2. **Key Management**:
   - Private key: Keep secure, use only for signing licenses
   - Public key: Already embedded in application code
   - Keys stored in `license-keys.json` (DO NOT distribute private key)

3. **Documentation**:
   - See [docs/LICENSE_SYSTEM.md](docs/LICENSE_SYSTEM.md) for complete documentation
   - Includes architecture, security features, and best practices

## Project License

This project code is licensed under the MIT license.
