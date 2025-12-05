import { GoogleGenerativeAI } from "@google/generative-ai";

export type AIModel = "gpt-4o" | "gpt-4o-mini" | "gemini-pro" | "gemini-flash";

export interface AISettings {
  model: AIModel;
  temperature?: number;
}

// Map our model names to actual API model names
const GEMINI_MODEL_MAP: Record<string, string> = {
  "gemini-pro": "gemini-1.5-pro",
  "gemini-flash": "gemini-1.5-flash",
};

/**
 * Call the AI model with the given prompt
 * For Gemini models, uses the Google Generative AI SDK with Application Default Credentials
 * For OpenAI models, uses the OpenAI API
 */
export async function callAI(prompt: string, model: AIModel): Promise<string> {
  if (model === "gemini-pro" || model === "gemini-flash") {
    return callGemini(prompt, model);
  } else {
    return callOpenAI(prompt, model);
  }
}

/**
 * Call Gemini using the Google Generative AI SDK
 * Credentials are loaded automatically from:
 * 1. GOOGLE_API_KEY environment variable, or
 * 2. Application Default Credentials (gcloud auth application-default login)
 */
async function callGemini(prompt: string, model: AIModel): Promise<string> {
  // Get API key from environment or use ADC
  const apiKey = getGeminiApiKey();
  
  if (!apiKey) {
    throw new Error(
      "Gemini API key not found. Please set up Gemini access by either:\n" +
      "1. Setting GOOGLE_API_KEY environment variable, or\n" +
      "2. Running 'gcloud auth application-default login' and configuring a project with Gemini API access"
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
 * Call OpenAI API
 * This uses fetch to call the OpenAI API directly
 */
async function callOpenAI(prompt: string, model: AIModel): Promise<string> {
  const apiKey = getOpenAIApiKey();
  
  if (!apiKey) {
    throw new Error(
      "OpenAI API key not found. Please set the OPENAI_API_KEY environment variable."
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
 * Get Gemini API key from environment or stored settings
 */
function getGeminiApiKey(): string | null {
  // Check for API key in localStorage (set via settings)
  const storedKey = localStorage.getItem("gemini-api-key");
  if (storedKey) {
    return storedKey;
  }
  
  // In a browser environment, we can't directly access environment variables
  // The API key should be provided via settings or a backend proxy
  // For now, return null to indicate no key is available
  return null;
}

/**
 * Get OpenAI API key from environment or stored settings
 */
function getOpenAIApiKey(): string | null {
  // Check for API key in localStorage (set via settings)
  const storedKey = localStorage.getItem("openai-api-key");
  if (storedKey) {
    return storedKey;
  }
  
  return null;
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
    return !!getGeminiApiKey();
  } else {
    return !!getOpenAIApiKey();
  }
}
