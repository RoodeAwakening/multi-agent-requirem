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
 * For Gemini models, uses the Google Generative AI SDK
 * For OpenAI models, uses the OpenAI API directly
 * API keys are configured via the Settings dialog and stored in localStorage
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
 * API key is loaded from localStorage (configured via Settings dialog)
 */
async function callGemini(prompt: string, model: AIModel): Promise<string> {
  const apiKey = getGeminiApiKey();
  
  if (!apiKey) {
    throw new Error(
      "Gemini API key not configured. Please add your Gemini API key in the Settings dialog."
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
    return !!getGeminiApiKey();
  } else {
    return !!getOpenAIApiKey();
  }
}
