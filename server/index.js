import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

/**
 * Get access token from gcloud CLI
 * This uses the Application Default Credentials configured via gcloud auth
 */
async function getAccessToken() {
  try {
    const { stdout } = await execAsync('gcloud auth print-access-token');
    return stdout.trim();
  } catch (error) {
    console.error('Failed to get access token:', error.message);
    throw new Error(
      'Failed to get gcloud access token. Make sure you have run:\n' +
      '1. gcloud auth application-default login\n' +
      '2. gcloud config set project YOUR_PROJECT_ID'
    );
  }
}

/**
 * Get project ID from environment or gcloud config
 */
async function getProjectId() {
  // First check environment variable
  if (process.env.GOOGLE_CLOUD_PROJECT) {
    return process.env.GOOGLE_CLOUD_PROJECT;
  }
  if (process.env.CLOUDSDK_CORE_PROJECT) {
    return process.env.CLOUDSDK_CORE_PROJECT;
  }
  
  // Fall back to gcloud config
  try {
    const { stdout } = await execAsync('gcloud config get-value project');
    const projectId = stdout.trim();
    if (projectId && projectId !== '(unset)') {
      return projectId;
    }
  } catch (error) {
    console.error('Failed to get project from gcloud config:', error.message);
  }
  
  return null;
}

/**
 * Health check endpoint
 */
app.get('/api/health', async (req, res) => {
  try {
    const projectId = await getProjectId();
    res.json({ 
      status: 'ok', 
      projectId: projectId || null,
      hasProject: !!projectId
    });
  } catch (error) {
    res.json({ 
      status: 'ok', 
      projectId: null,
      hasProject: false
    });
  }
});

/**
 * Get current gcloud configuration
 */
app.get('/api/gcloud/config', async (req, res) => {
  try {
    const projectId = await getProjectId();
    
    // Try to verify authentication
    let authenticated = false;
    try {
      await getAccessToken();
      authenticated = true;
    } catch (e) {
      authenticated = false;
    }
    
    res.json({
      projectId: projectId || null,
      authenticated,
      envProject: process.env.GOOGLE_CLOUD_PROJECT || process.env.CLOUDSDK_CORE_PROJECT || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Call Gemini via Vertex AI using gcloud CLI authentication
 */
app.post('/api/gemini/generate', async (req, res) => {
  try {
    const { prompt, model, projectId: requestProjectId, location = 'us-central1' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    // Validate model
    const allowedModels = ['gemini-pro', 'gemini-flash'];
    if (model && !allowedModels.includes(model)) {
      return res.status(400).json({ error: `Invalid model. Allowed: ${allowedModels.join(', ')}` });
    }
    
    // Validate location (common Vertex AI regions)
    const allowedLocations = [
      'us-central1', 'us-east4', 'us-west1', 
      'europe-west1', 'europe-west4',
      'asia-northeast1', 'asia-southeast1'
    ];
    if (!allowedLocations.includes(location)) {
      return res.status(400).json({ error: `Invalid location. Allowed: ${allowedLocations.join(', ')}` });
    }
    
    // Validate projectId format if provided (alphanumeric, hyphens, 6-30 chars)
    if (requestProjectId && !/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(requestProjectId)) {
      return res.status(400).json({ error: 'Invalid project ID format' });
    }
    
    // Get project ID - prefer request, then env, then gcloud config
    let projectId = requestProjectId;
    if (!projectId) {
      projectId = await getProjectId();
    }
    
    if (!projectId) {
      return res.status(400).json({ 
        error: 'No Google Cloud project configured. Set GOOGLE_CLOUD_PROJECT in your shell profile or pass projectId in the request.' 
      });
    }
    
    // Get access token from gcloud
    const accessToken = await getAccessToken();
    
    // Map model names to Vertex AI model names
    const modelMap = {
      'gemini-pro': 'gemini-1.5-pro',
      'gemini-flash': 'gemini-1.5-flash',
    };
    const modelName = modelMap[model] || 'gemini-1.5-flash';
    
    // Call Vertex AI API
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelName}:generateContent`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
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
      console.error('Vertex AI error:', response.status, errorData);
      return res.status(response.status).json({
        error: `Vertex AI API error: ${response.status} ${response.statusText}`,
        details: errorData.error?.message || null
      });
    }
    
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    res.json({ text, projectId, model: modelName });
  } catch (error) {
    console.error('Gemini generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 I.A.N. Backend Server running on http://localhost:${PORT}`);
  console.log(`\n📋 Checking gcloud configuration...`);
  
  getProjectId()
    .then(projectId => {
      if (projectId) {
        console.log(`✅ Google Cloud Project: ${projectId}`);
      } else {
        console.log(`⚠️  No Google Cloud project configured.`);
        console.log(`   Set GOOGLE_CLOUD_PROJECT in your .bashrc/.zshrc or run:`);
        console.log(`   gcloud config set project YOUR_PROJECT_ID`);
      }
    })
    .catch(err => {
      console.log(`⚠️  Could not check project: ${err.message}`);
    });
  
  getAccessToken()
    .then(() => {
      console.log(`✅ gcloud authentication: OK`);
    })
    .catch(() => {
      console.log(`⚠️  gcloud not authenticated. Run: gcloud auth application-default login`);
    });
  
  console.log(`\n`);
});
