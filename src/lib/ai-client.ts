import { GoogleGenerativeAI } from "@google/generative-ai";

export type AIModel = "gpt-4o" | "gpt-4o-mini" | "gemini-2.5-pro" | "gemini-2.5-flash" | "gemini-2.0-flash-lite";
export type GeminiAuthMode = "api-key" | "cli-auth";

export interface AISettings {
  model: AIModel;
  temperature?: number;
  geminiAuthMode?: GeminiAuthMode;
}

// Backend server URL for CLI authentication
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Map our model names to actual API model names
const GEMINI_MODEL_MAP: Record<string, string> = {
  "gemini-2.5-pro": "gemini-2.5-pro",
  "gemini-2.5-flash": "gemini-2.5-flash",
  "gemini-2.0-flash-lite": "gemini-2.0-flash",
};

/**
 * Call the AI model with the given prompt
 * For Gemini models, uses the Google Generative AI SDK or CLI auth
 * For OpenAI models, uses the OpenAI API directly
 * API keys are configured via the Settings dialog and stored in localStorage
 */
export async function callAI(prompt: string, model: AIModel, authMode?: GeminiAuthMode): Promise<string> {
  if (model === "gemini-2.5-pro" || model === "gemini-2.5-flash" || model === "gemini-2.0-flash-lite") {
    return callGemini(prompt, model, authMode);
  } else {
    return callOpenAI(prompt, model);
  }
}

/**
 * Call Gemini using the Google Generative AI SDK or CLI-based auth
 * Auth mode and API key are loaded from localStorage (configured via Settings dialog)
 */
async function callGemini(prompt: string, model: AIModel, authMode?: GeminiAuthMode): Promise<string> {
  // Get auth mode from settings if not provided
  const effectiveAuthMode = authMode || getGeminiAuthMode();
  
  if (effectiveAuthMode === "cli-auth") {
    return callGeminiWithCLIAuth(prompt, model);
  }
  
  // Default to API key auth
  const apiKey = getGeminiApiKey();
  
  if (!apiKey) {
    throw new Error(
      "Gemini API key not configured. Please add your Gemini API key in the Settings dialog, or switch to CLI authentication mode."
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = GEMINI_MODEL_MAP[model] || "gemini-1.5-flash";
  const geminiModel = genAI.getGenerativeModel({ model: modelName });

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error(`Gemini API call failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Call Gemini using CLI-based authentication via the backend server
 * 
 * The backend server (server/index.js) has access to gcloud CLI and can:
 * - Read GOOGLE_CLOUD_PROJECT from environment variables
 * - Execute gcloud auth print-access-token to get credentials
 * - Make authenticated requests to Vertex AI
 * 
 * Run with: npm run start (or npm run dev:full)
 */
async function callGeminiWithCLIAuth(prompt: string, model: AIModel): Promise<string> {
  // Get project ID and location from localStorage (optional - backend can auto-detect)
  const projectId = localStorage.getItem("gemini-cli-project-id") || undefined;
  const location = localStorage.getItem("gemini-cli-location") || "us-central1";

  try {
    const response = await fetch(`${BACKEND_URL}/api/gemini/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        model,
        projectId,
        location,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 0 || errorData.error?.includes('ECONNREFUSED')) {
        throw new Error(
          "Cannot connect to backend server.\n\n" +
          "Make sure to start the app with: npm run start\n" +
          "This runs both the frontend and backend server needed for CLI authentication."
        );
      }
      
      throw new Error(
        errorData.error || `Backend error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return data.text || '';
  } catch (error) {
    console.error('Gemini CLI auth error:', error);
    
    // Check if it's a network error (backend not running)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        "Cannot connect to backend server.\n\n" +
        "Make sure to start the app with: npm run start\n" +
        "This runs both the frontend and backend server needed for CLI authentication."
      );
    }
    
    throw error;
  }
}

/**
 * Check if the backend server is running and gcloud is configured
 */
export async function checkBackendStatus(): Promise<{
  running: boolean;
  projectId: string | null;
  authenticated: boolean;
}> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/gcloud/config`);
    if (!response.ok) {
      return { running: true, projectId: null, authenticated: false };
    }
    const data = await response.json();
    return {
      running: true,
      projectId: data.projectId || null,
      authenticated: data.authenticated || false,
    };
  } catch {
    return { running: false, projectId: null, authenticated: false };
  }
}

/**
 * Call OpenAI API
 * API key is loaded from localStorage (configured via Settings dialog)
 */
async function callOpenAI(prompt: string, model: AIModel): Promise<string> {
  const apiKey = getOpenAIApiKey();
  
  if (!apiKey) {
    throw new Error(
      "OpenAI API key not configured. Please add your OpenAI API key in the Settings dialog."
    );
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText}` +
        (errorData.error?.message ? ` - ${errorData.error.message}` : "")
      );
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error(`OpenAI API call failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get Gemini API key from localStorage (configured via Settings dialog)
 */
function getGeminiApiKey(): string | null {
  const storedKey = localStorage.getItem("gemini-api-key");
  return storedKey || null;
}

/**
 * Get OpenAI API key from localStorage (configured via Settings dialog)
 */
function getOpenAIApiKey(): string | null {
  const storedKey = localStorage.getItem("openai-api-key");
  return storedKey || null;
}

/**
 * Store API key for a provider
 */
export function setApiKey(provider: "openai" | "gemini", apiKey: string): void {
  localStorage.setItem(`${provider}-api-key`, apiKey);
}

/**
 * Get stored API key for a provider
 */
export function getApiKey(provider: "openai" | "gemini"): string | null {
  return localStorage.getItem(`${provider}-api-key`);
}

/**
 * Check if an API key is configured for the given model
 */
export function isModelConfigured(model: AIModel): boolean {
  if (model === "gemini-2.5-pro" || model === "gemini-2.5-flash" || model === "gemini-2.0-flash-lite") {
    const authMode = getGeminiAuthMode();
    if (authMode === "cli-auth") {
      return !!localStorage.getItem("gemini-cli-project-id");
    }
    return !!getGeminiApiKey();
  } else {
    return !!getOpenAIApiKey();
  }
}

/**
 * Get Gemini auth mode from localStorage
 */
export function getGeminiAuthMode(): GeminiAuthMode {
  const mode = localStorage.getItem("gemini-auth-mode");
  if (mode === "cli-auth" || mode === "api-key") {
    return mode;
  }
  return "api-key"; // default to api-key if invalid/missing
}

/**
 * Set Gemini auth mode
 */
export function setGeminiAuthMode(mode: GeminiAuthMode): void {
  localStorage.setItem("gemini-auth-mode", mode);
}

/**
 * Get Gemini CLI project ID
 */
export function getGeminiCLIProjectId(): string | null {
  return localStorage.getItem("gemini-cli-project-id");
}

/**
 * Set Gemini CLI project ID
 */
export function setGeminiCLIProjectId(projectId: string): void {
  localStorage.setItem("gemini-cli-project-id", projectId);
}

/**
 * Get Gemini CLI location (region)
 */
export function getGeminiCLILocation(): string {
  return localStorage.getItem("gemini-cli-location") || "us-central1";
}

/**
 * Set Gemini CLI location (region)
 */
export function setGeminiCLILocation(location: string): void {
  localStorage.setItem("gemini-cli-location", location);
}
