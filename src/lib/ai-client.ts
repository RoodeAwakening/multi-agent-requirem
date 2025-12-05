import { GoogleGenerativeAI } from "@google/generative-ai";

export type AIModel = "gpt-4o" | "gpt-4o-mini" | "gemini-pro" | "gemini-flash";
export type GeminiAuthMode = "api-key" | "cli-auth";

export interface AISettings {
  model: AIModel;
  temperature?: number;
  geminiAuthMode?: GeminiAuthMode;
}

// Map our model names to actual API model names
const GEMINI_MODEL_MAP: Record<string, string> = {
  "gemini-pro": "gemini-1.5-pro",
  "gemini-flash": "gemini-1.5-flash",
};

/**
 * Call the AI model with the given prompt
 * For Gemini models, uses the Google Generative AI SDK or CLI auth
 * For OpenAI models, uses the OpenAI API directly
 * API keys are configured via the Settings dialog and stored in localStorage
 */
export async function callAI(prompt: string, model: AIModel, authMode?: GeminiAuthMode): Promise<string> {
  if (model === "gemini-pro" || model === "gemini-flash") {
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
 * Call Gemini using CLI-based authentication (gcloud auth)
 * This uses the Vertex AI REST API with Application Default Credentials
 * Requires gcloud CLI to be configured with proper authentication
 */
async function callGeminiWithCLIAuth(prompt: string, model: AIModel): Promise<string> {
  // Get project ID and location from localStorage
  const projectId = localStorage.getItem("gemini-cli-project-id");
  const location = localStorage.getItem("gemini-cli-location") || "us-central1";
  
  if (!projectId) {
    throw new Error(
      "Gemini CLI authentication requires a Google Cloud Project ID. Please configure it in Settings."
    );
  }

  const modelName = GEMINI_MODEL_MAP[model] || "gemini-1.5-flash";
  
  // Use Vertex AI REST API endpoint
  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelName}:generateContent`;

  try {
    // Note: In a browser context, this requires the browser to have valid ADC tokens
    // This typically works when running in an environment where gcloud auth is configured
    // and passed through (e.g., when running on Cloud Shell or with proper proxy setup)
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // The browser will need to have credentials available
        // This works with Google Cloud Shell or environments with ADC configured
      },
      credentials: "include",
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Vertex AI API error: ${response.status} ${response.statusText}` +
        (errorData.error?.message ? ` - ${errorData.error.message}` : "") +
        "\n\nMake sure gcloud is authenticated with: gcloud auth application-default login"
      );
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch (error) {
    console.error("Gemini CLI auth error:", error);
    throw new Error(
      `Gemini CLI authentication failed: ${error instanceof Error ? error.message : String(error)}\n\n` +
      "Make sure you have:\n" +
      "1. gcloud CLI installed and configured\n" +
      "2. Run: gcloud auth application-default login\n" +
      "3. Set your project: gcloud config set project YOUR_PROJECT_ID\n" +
      "4. Enabled the Vertex AI API in your project"
    );
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
  if (model === "gemini-pro" || model === "gemini-flash") {
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
  return (mode === "cli-auth" ? "cli-auth" : "api-key") as GeminiAuthMode;
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
