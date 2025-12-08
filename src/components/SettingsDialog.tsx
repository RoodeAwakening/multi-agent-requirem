import { useState, useEffect } from "react";
import { useStoredValue } from "@/lib/storage";
import { 
  AIModel, 
  AISettings, 
  GeminiAuthMode,
  setApiKey, 
  getApiKey,
  getGeminiAuthMode,
  setGeminiAuthMode,
  getGeminiCLIProjectId,
  setGeminiCLIProjectId,
  getGeminiCLILocation,
  setGeminiCLILocation,
  checkBackendStatus,
} from "@/lib/ai-client";
import {
  isFileSystemAccessSupported,
  selectStorageDirectory,
  getStorageMode,
  getStoredDirectoryName,
  getCachedDirectoryName,
  clearStorageConfig,
  exportJobsToFileSystem,
  getCachedDirectoryHandle,
  StorageMode,
} from "@/lib/filesystem-storage";
import { getStoredValue, setStoredValue } from "@/lib/storage";
import { Job } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PipelineStepId } from "@/lib/types";
import { PROMPTS } from "@/lib/prompts";
import { toast } from "sonner";
// Use deep imports for better tree-shaking (reduces bundle size by ~750KB)
import { CheckCircle } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { ArrowCounterClockwise } from "@phosphor-icons/react/dist/csr/ArrowCounterClockwise";
import { FloppyDisk } from "@phosphor-icons/react/dist/csr/FloppyDisk";
import { Eye } from "@phosphor-icons/react/dist/csr/Eye";
import { EyeSlash } from "@phosphor-icons/react/dist/csr/EyeSlash";
import { FolderOpen } from "@phosphor-icons/react/dist/csr/FolderOpen";
import { HardDrives } from "@phosphor-icons/react/dist/csr/HardDrives";
import { Browser } from "@phosphor-icons/react/dist/csr/Browser";
import { Warning } from "@phosphor-icons/react/dist/csr/Warning";
import { PlayCircle } from "@phosphor-icons/react/dist/csr/PlayCircle";
import { createDemoJob, getDemoDescription } from "@/lib/demo-data";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStorageModeChange?: (mode: StorageMode) => void;
  onDemoCreated?: () => void;
}

export function SettingsDialog({ open, onOpenChange, onStorageModeChange, onDemoCreated }: SettingsDialogProps) {
  const [aiSettings, setAISettings] = useStoredValue<AISettings>("ai-settings", {
    model: "gemini-2.5-flash",
  });
  const [customPrompts, setCustomPrompts] = useStoredValue<
    Partial<Record<PipelineStepId, string>>
  >("custom-prompts", {});

  const [localModel, setLocalModel] = useState<AIModel>(
    aiSettings?.model || "gemini-2.5-flash"
  );
  const [localPrompts, setLocalPrompts] = useState<
    Partial<Record<PipelineStepId, string>>
  >(customPrompts || {});
  const [selectedPrompt, setSelectedPrompt] =
    useState<PipelineStepId>("tech_lead_initial");
  const [hasChanges, setHasChanges] = useState(false);
  
  // API Key states
  const [openaiKey, setOpenaiKey] = useState<string>(getApiKey("openai") || "");
  const [geminiKey, setGeminiKey] = useState<string>(getApiKey("gemini") || "");
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  
  // Gemini CLI auth states
  const [geminiAuthMode, setGeminiAuthModeState] = useState<GeminiAuthMode>(getGeminiAuthMode());
  const [geminiProjectId, setGeminiProjectId] = useState<string>(getGeminiCLIProjectId() || "");
  const [geminiLocation, setGeminiLocation] = useState<string>(getGeminiCLILocation());
  
  // Backend status for CLI auth
  const [backendStatus, setBackendStatus] = useState<{
    running: boolean;
    projectId: string | null;
    authenticated: boolean;
  } | null>(null);
  
  // Storage mode states
  const [storageMode, setLocalStorageMode] = useState<StorageMode>(getStorageMode());
  const [directoryName, setDirectoryName] = useState<string | null>(
    getCachedDirectoryName() || getStoredDirectoryName()
  );
  const [isSelectingDirectory, setIsSelectingDirectory] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [showMigrationWarning, setShowMigrationWarning] = useState(false);
  const fsSupported = isFileSystemAccessSupported();
  
  // Get current jobs count for migration warning
  const localStorageJobs = getStoredValue<Job[]>("jobs") || [];

  useEffect(() => {
    setLocalModel(aiSettings?.model || "gemini-2.5-flash");
  }, [aiSettings]);

  useEffect(() => {
    setLocalPrompts(customPrompts || {});
  }, [customPrompts]);
  
  // Refresh storage mode and directory name when dialog opens
  // This ensures the UI reflects the current state after changes made elsewhere (e.g., StorageSetupDialog)
  useEffect(() => {
    if (open) {
      setLocalStorageMode(getStorageMode());
      setDirectoryName(getCachedDirectoryName() || getStoredDirectoryName());
    }
  }, [open]);
  
  // Check backend status when CLI auth is selected
  useEffect(() => {
    if (geminiAuthMode === "cli-auth" && open) {
      checkBackendStatus().then(setBackendStatus);
    }
  }, [geminiAuthMode, open]);

  const handleSaveSettings = () => {
    // Validate file system mode requires a directory
    if (storageMode === "fileSystem" && !directoryName) {
      toast.error("Please select a storage directory for file system mode");
      return;
    }
    
    // Save AI settings with proper structure
    const newAISettings: AISettings = {
      model: localModel,
      geminiAuthMode: geminiAuthMode,
      temperature: aiSettings?.temperature,
    };
    console.log('[Settings] Saving AI settings:', newAISettings);
    setAISettings(newAISettings);
    setCustomPrompts(localPrompts);
    
    // Save API keys (save even if empty to allow clearing)
    setApiKey("openai", openaiKey);
    setApiKey("gemini", geminiKey);
    
    // Save Gemini CLI auth settings
    setGeminiAuthMode(geminiAuthMode);
    setGeminiCLIProjectId(geminiProjectId);
    setGeminiCLILocation(geminiLocation);
    
    // Persist storage mode change
    if (storageMode === "localStorage") {
      // Switching to localStorage - clear file system config
      clearStorageConfig();
    }
    // Note: For fileSystem mode, the config is set when directory is selected via selectStorageDirectory()
    
    // Notify parent of storage mode change if callback provided
    if (onStorageModeChange) {
      onStorageModeChange(storageMode);
    }
    
    setHasChanges(false);
    toast.success("Settings saved successfully");
  };

  const handlePromptChange = (stepId: PipelineStepId, value: string) => {
    setLocalPrompts((prev) => ({
      ...prev,
      [stepId]: value,
    }));
    setHasChanges(true);
  };

  const handleResetPrompt = (stepId: PipelineStepId) => {
    const updatedPrompts = { ...localPrompts };
    delete updatedPrompts[stepId];
    setLocalPrompts(updatedPrompts);
    setHasChanges(true);
    toast.success("Prompt reset to default");
  };

  const handleResetAllPrompts = () => {
    setLocalPrompts({});
    setHasChanges(true);
    toast.success("All prompts reset to defaults");
  };

  const getCurrentPrompt = (stepId: PipelineStepId): string => {
    return localPrompts[stepId] || PROMPTS[stepId];
  };

  const isPromptCustomized = (stepId: PipelineStepId): boolean => {
    return !!localPrompts[stepId];
  };

  const promptSteps: Array<{
    id: PipelineStepId;
    label: string;
    description: string;
  }> = [
    {
      id: "tech_lead_initial",
      label: "Tech Lead - Initial",
      description: "Initial technical assessment",
    },
    {
      id: "business_analyst_initial",
      label: "Business Analyst - Initial",
      description: "Initial business analysis",
    },
    {
      id: "cross_reviewer",
      label: "Cross Reviewer",
      description: "Questions and clarifications",
    },
    {
      id: "tech_lead_update",
      label: "Tech Lead - Update",
      description: "Updated with Q&A",
    },
    {
      id: "business_analyst_update",
      label: "Business Analyst - Update",
      description: "Updated with Q&A",
    },
    {
      id: "requirements_agent",
      label: "Requirements Agent",
      description: "System requirements spec",
    },
    {
      id: "product_owner",
      label: "Product Owner",
      description: "Product backlog",
    },
    {
      id: "executive_assistant",
      label: "Executive Assistant",
      description: "Executive summary",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[95vw] lg:max-w-[1400px] w-full lg:w-[1400px] h-[92vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure AI model and customize agent prompts for the pipeline
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="model" className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full justify-start rounded-none border-b px-6 shrink-0">
            <TabsTrigger value="model">AI Model</TabsTrigger>
            <TabsTrigger value="prompts">Agent Prompts</TabsTrigger>
            <TabsTrigger value="storage">Data Storage</TabsTrigger>
            <TabsTrigger value="demo">Demo</TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 overflow-hidden">
            <TabsContent value="model" className="m-0 h-full overflow-y-auto">
              <div className="p-6 space-y-6 max-w-3xl">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Model Selection</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose the AI model for pipeline execution. Different models
                      offer varying capabilities and response times.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model">AI Model</Label>
                    <Select
                      value={localModel}
                      onValueChange={(value: AIModel) => {
                        setLocalModel(value);
                        setHasChanges(true);
                      }}
                    >
                      <SelectTrigger id="model" className="w-full max-w-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o">
                          <div className="flex flex-col items-start">
                            <span className="font-medium">GPT-4o</span>
                            <span className="text-xs text-muted-foreground">
                              Most capable - Best for complex analysis
                            </span>
                          </div>
                        </SelectItem>
                        <SelectItem value="gpt-4o-mini">
                          <div className="flex flex-col items-start">
                            <span className="font-medium">GPT-4o Mini</span>
                            <span className="text-xs text-muted-foreground">
                              Faster and more efficient - Good for most tasks
                            </span>
                          </div>
                        </SelectItem>
                        <SelectItem value="gemini-2.5-pro">
                          <div className="flex flex-col items-start">
                            <span className="font-medium">Gemini 2.5 Pro</span>
                            <span className="text-xs text-muted-foreground">
                              Most advanced - Best for complex reasoning
                            </span>
                          </div>
                        </SelectItem>
                        <SelectItem value="gemini-2.5-flash">
                          <div className="flex flex-col items-start">
                            <span className="font-medium">Gemini 2.5 Flash</span>
                            <span className="text-xs text-muted-foreground">
                              Fast and efficient - Great balance
                            </span>
                          </div>
                        </SelectItem>
                        <SelectItem value="gemini-2.0-flash-lite">
                          <div className="flex flex-col items-start">
                            <span className="font-medium">Gemini 2.0 Flash Lite</span>
                            <span className="text-xs text-muted-foreground">
                              Lightweight and fast - Cost effective
                            </span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-2">API Keys</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Configure API keys for the AI providers you want to use.
                    </p>
                  </div>

                  {/* OpenAI API Key */}
                  <div className="space-y-2">
                    <Label htmlFor="openai-key">OpenAI API Key</Label>
                    <div className="flex gap-2 max-w-md">
                      <div className="relative flex-1">
                        <Input
                          id="openai-key"
                          type={showOpenaiKey ? "text" : "password"}
                          value={openaiKey}
                          onChange={(e) => {
                            setOpenaiKey(e.target.value);
                            setHasChanges(true);
                          }}
                          placeholder="sk-..."
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                        >
                          {showOpenaiKey ? <EyeSlash size={16} /> : <Eye size={16} />}
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Required for GPT-4o and GPT-4o Mini models.{" "}
                      <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                        Get an API key
                      </a>
                    </p>
                  </div>

                  {/* Gemini Authentication */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-semibold">Gemini Authentication</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Choose how to authenticate with Gemini. API Key is recommended as it doesn't require Vertex AI API.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="gemini-auth-mode">Authentication Mode</Label>
                      <Select
                        value={geminiAuthMode}
                        onValueChange={(value: GeminiAuthMode) => {
                          setGeminiAuthModeState(value);
                          setHasChanges(true);
                        }}
                      >
                        <SelectTrigger id="gemini-auth-mode" className="w-full max-w-md">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="api-key">
                            <div className="flex flex-col items-start">
                              <span className="font-medium">API Key (Recommended)</span>
                              <span className="text-xs text-muted-foreground">
                                Uses Google AI Studio - No Vertex AI API required
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="cli-auth">
                            <div className="flex flex-col items-start">
                              <span className="font-medium">CLI Auth (Vertex AI)</span>
                              <span className="text-xs text-muted-foreground">
                                Requires Vertex AI API enabled & backend server
                              </span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {geminiAuthMode === "cli-auth" && (
                      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                        {/* Backend Status */}
                        <div className="p-3 rounded-lg border bg-background">
                          <h4 className="font-medium text-sm mb-2">Backend Server Status</h4>
                          {backendStatus === null ? (
                            <p className="text-sm text-muted-foreground">Checking...</p>
                          ) : backendStatus.running ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                <span className="text-sm text-green-600 dark:text-green-400">Server running</span>
                              </div>
                              {backendStatus.projectId && (
                                <p className="text-xs text-muted-foreground">
                                  Project from gcloud: <code className="bg-muted px-1 rounded">{backendStatus.projectId}</code>
                                </p>
                              )}
                              {backendStatus.authenticated ? (
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                  <span className="text-xs text-green-600 dark:text-green-400">gcloud authenticated</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                  <span className="text-xs text-amber-600 dark:text-amber-400">Run: gcloud auth application-default login</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                <span className="text-sm text-red-600 dark:text-red-400">Server not running</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Start with: <code className="bg-muted px-1 rounded">npm run start</code>
                              </p>
                            </div>
                          )}
                        </div>

                        {geminiAuthMode === "cli-auth" && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="gemini-project-id">Google Cloud Project ID (optional)</Label>
                              <Input
                                id="gemini-project-id"
                                value={geminiProjectId}
                                onChange={(e) => {
                                  setGeminiProjectId(e.target.value);
                                  setHasChanges(true);
                                }}
                                placeholder={backendStatus?.projectId || "your-project-id"}
                                className="max-w-md"
                              />
                              <p className="text-xs text-muted-foreground">
                                Leave empty to use project from your shell profile (GOOGLE_CLOUD_PROJECT)
                              </p>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="gemini-location">Region</Label>
                              <Select
                                value={geminiLocation}
                                onValueChange={(value) => {
                                  setGeminiLocation(value);
                                  setHasChanges(true);
                                }}
                              >
                                <SelectTrigger id="gemini-location" className="w-full max-w-md">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="us-central1">us-central1 (Iowa)</SelectItem>
                                  <SelectItem value="us-east4">us-east4 (Virginia)</SelectItem>
                                  <SelectItem value="us-west1">us-west1 (Oregon)</SelectItem>
                                  <SelectItem value="europe-west1">europe-west1 (Belgium)</SelectItem>
                                  <SelectItem value="europe-west4">europe-west4 (Netherlands)</SelectItem>
                                  <SelectItem value="asia-northeast1">asia-northeast1 (Tokyo)</SelectItem>
                                  <SelectItem value="asia-southeast1">asia-southeast1 (Singapore)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="mt-4 p-4 border-2 border-green-500/50 rounded-lg bg-green-50 dark:bg-green-900/10">
                              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-green-700 dark:text-green-400">
                                <span>✓</span> Setup Instructions
                              </h4>
                              <div className="text-sm space-y-2">
                                <p className="text-foreground">1. Add to your <code className="bg-background px-1 rounded">.bashrc</code> or <code className="bg-background px-1 rounded">.zshrc</code>:</p>
                                <pre className="bg-background p-2 rounded text-xs overflow-x-auto">
{`export GOOGLE_CLOUD_PROJECT="your-project-id"`}
                                </pre>
                                <p className="text-foreground">2. Authenticate with gcloud:</p>
                                <pre className="bg-background p-2 rounded text-xs overflow-x-auto">
{`gcloud auth application-default login`}
                                </pre>
                                <p className="text-foreground">3. Start the app with the backend server:</p>
                                <pre className="bg-background p-2 rounded text-xs overflow-x-auto">
{`npm run start`}
                                </pre>
                                <p className="text-foreground text-amber-600 dark:text-amber-400">⚠️ Requires Vertex AI API to be enabled in your project</p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {geminiAuthMode === "api-key" && (
                      <div className="space-y-2">
                        <Label htmlFor="gemini-key">Gemini API Key</Label>
                        <div className="flex gap-2 max-w-md">
                          <div className="relative flex-1">
                            <Input
                              id="gemini-key"
                              type={showGeminiKey ? "text" : "password"}
                              value={geminiKey}
                              onChange={(e) => {
                                setGeminiKey(e.target.value);
                                setHasChanges(true);
                              }}
                              placeholder="Enter your Gemini API key"
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowGeminiKey(!showGeminiKey)}
                            >
                              {showGeminiKey ? <EyeSlash size={16} /> : <Eye size={16} />}
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Required for Gemini Pro and Gemini Flash models.{" "}
                          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                            Get an API key
                          </a>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <h4 className="font-medium text-sm">Current Configuration</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Model:</span>
                      <Badge variant="secondary">{localModel}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">OpenAI Key:</span>
                      <Badge variant={openaiKey ? "default" : "outline"}>
                        {openaiKey ? "Configured" : "Not set"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Gemini Auth:</span>
                      <Badge variant="secondary">
                        {geminiAuthMode === "cli-auth" ? "CLI (Vertex AI)" : "API Key"}
                      </Badge>
                      {geminiAuthMode === "cli-auth" ? (
                        <Badge variant={geminiProjectId ? "default" : "outline"}>
                          {geminiProjectId ? "Project Configured" : "Project Not Set"}
                        </Badge>
                      ) : (
                        <Badge variant={geminiKey ? "default" : "outline"}>
                          {geminiKey ? "Key Configured" : "Key Not Set"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="prompts" className="m-0 h-full">
              <div className="grid grid-cols-[280px_1fr] h-full">
                <div className="border-r flex flex-col min-h-0">
                  <ScrollArea className="flex-1">
                    <div className="p-4 space-y-1">
                      {promptSteps.map((step) => (
                        <button
                          key={step.id}
                          onClick={() => setSelectedPrompt(step.id)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            selectedPrompt === step.id
                              ? "bg-accent text-accent-foreground"
                              : "hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">
                              {step.label}
                            </span>
                            {isPromptCustomized(step.id) && (
                              <CheckCircle
                                size={16}
                                weight="fill"
                                className="text-accent"
                              />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {step.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="flex flex-col min-h-0">
                  <div className="p-6 border-b shrink-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {
                            promptSteps.find((s) => s.id === selectedPrompt)
                              ?.label
                          }
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Customize the prompt for this agent
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {isPromptCustomized(selectedPrompt) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetPrompt(selectedPrompt)}
                          >
                            <ArrowCounterClockwise className="mr-2" />
                            Reset
                          </Button>
                        )}
                      </div>
                    </div>
                    {isPromptCustomized(selectedPrompt) && (
                      <Badge variant="secondary" className="mt-2">
                        Customized
                      </Badge>
                    )}
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto">
                    <div className="p-6 space-y-4">
                      <Textarea
                        value={getCurrentPrompt(selectedPrompt)}
                        onChange={(e) =>
                          handlePromptChange(selectedPrompt, e.target.value)
                        }
                        className="w-full h-[calc(92vh-380px)] min-h-[500px] font-mono text-sm leading-relaxed"
                        placeholder="Enter custom prompt..."
                      />

                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="text-sm font-semibold mb-2">
                          Available Variables
                        </h4>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>
                            <code className="bg-background px-1 py-0.5 rounded">
                              {`{{TASK_TITLE}}`}
                            </code>{" "}
                            - Task title
                          </div>
                          <div>
                            <code className="bg-background px-1 py-0.5 rounded">
                              {`{{TASK_DESCRIPTION}}`}
                            </code>{" "}
                            - Task description
                          </div>
                          <div>
                            <code className="bg-background px-1 py-0.5 rounded">
                              {`{{REFERENCE_CONTENT}}`}
                            </code>{" "}
                            - Reference materials
                          </div>
                          {selectedPrompt !== "tech_lead_initial" && (
                            <div>
                              <code className="bg-background px-1 py-0.5 rounded">
                                {`{{TECH_LEAD_CONTENT}}`}
                              </code>{" "}
                              - Tech Lead analysis
                            </div>
                          )}
                          {(selectedPrompt === "cross_reviewer" ||
                            selectedPrompt === "tech_lead_update" ||
                            selectedPrompt === "business_analyst_update" ||
                            selectedPrompt === "requirements_agent" ||
                            selectedPrompt === "product_owner") && (
                            <div>
                              <code className="bg-background px-1 py-0.5 rounded">
                                {`{{BUSINESS_ANALYST_CONTENT}}`}
                              </code>{" "}
                              - Business Analyst analysis
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="storage" className="m-0 h-full overflow-y-auto">
              <div className="p-6 space-y-6 max-w-3xl">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Data Storage Location</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose where to store your task data and generated outputs. File system storage
                    reduces browser memory usage and prevents slowdowns with many tasks.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Storage Mode Selection */}
                  <div className="space-y-3">
                    <Label>Storage Mode</Label>
                    
                    {/* Browser Storage Option */}
                    <div
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        storageMode === "localStorage"
                          ? "border-accent bg-accent/5"
                          : "border-border hover:border-accent/50"
                      }`}
                      onClick={() => {
                        setLocalStorageMode("localStorage");
                        setHasChanges(true);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <Browser size={24} className="text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">Browser Storage</h4>
                            {storageMode === "localStorage" && (
                              <Badge variant="secondary" className="text-xs">Current</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Store data in your browser's localStorage. Simple and works everywhere,
                            but limited to ~5-10MB and can slow down with many tasks.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* File System Storage Option */}
                    <div
                      className={`p-4 border-2 rounded-lg transition-colors ${
                        fsSupported
                          ? `cursor-pointer ${
                              storageMode === "fileSystem"
                                ? "border-accent bg-accent/5"
                                : "border-border hover:border-accent/50"
                            }`
                          : "border-border opacity-60"
                      }`}
                      onClick={() => {
                        if (fsSupported && storageMode !== "fileSystem") {
                          // Show migration warning if there are jobs in localStorage
                          if (localStorageJobs.length > 0) {
                            setShowMigrationWarning(true);
                          } else {
                            setLocalStorageMode("fileSystem");
                            setHasChanges(true);
                          }
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <HardDrives size={24} className="text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">Local File System</h4>
                            {storageMode === "fileSystem" && (
                              <Badge variant="secondary" className="text-xs">Current</Badge>
                            )}
                            {!fsSupported && (
                              <Badge variant="outline" className="text-xs">Not Supported</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Store data in a folder on your computer. Better performance with many tasks,
                            no size limits, and files can be accessed directly.
                          </p>
                          {!fsSupported && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                              <Warning size={14} />
                              Your browser doesn't support the File System Access API. Try Chrome, Edge, or Opera.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* File System Configuration */}
                  {fsSupported && storageMode === "fileSystem" && (
                    <div className="p-4 border rounded-lg space-y-4 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            <FolderOpen size={18} />
                            Storage Directory
                          </h4>
                          {directoryName ? (
                            <p className="text-sm text-muted-foreground mt-1">
                              Selected: <code className="bg-background px-2 py-0.5 rounded">{directoryName}</code>
                            </p>
                          ) : (
                            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                              No directory selected. Please select a folder to store your data.
                            </p>
                          )}
                        </div>
                        <Button
                          variant={directoryName ? "outline" : "default"}
                          onClick={async () => {
                            setIsSelectingDirectory(true);
                            try {
                              const handle = await selectStorageDirectory();
                              if (handle) {
                                setDirectoryName(handle.name);
                                setHasChanges(true);
                                toast.success(`Storage directory set to: ${handle.name}`);
                              }
                            } catch (error) {
                              const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
                              toast.error(`Failed to select directory: ${errorMessage}`);
                            } finally {
                              setIsSelectingDirectory(false);
                            }
                          }}
                          disabled={isSelectingDirectory}
                        >
                          {isSelectingDirectory ? (
                            "Selecting..."
                          ) : directoryName ? (
                            "Change Directory"
                          ) : (
                            "Select Directory"
                          )}
                        </Button>
                      </div>

                      {directoryName && (
                        <div className="p-3 bg-background rounded-lg">
                          <h5 className="text-sm font-medium mb-2">Directory Structure</h5>
                          <pre className="text-xs text-muted-foreground font-mono">
{`${directoryName}/
├── .ian-config.json    # Configuration
├── jobs/               # All your tasks
│   └── JOB-YYYYMMDD-HHMMSS/
│       ├── job.json    # Task metadata
│       ├── outputs/    # Generated documents
│       └── references/ # Reference files
└── settings/           # App settings`}
                          </pre>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Show warning about data not being migrated
                            const confirmed = window.confirm(
                              "Switching to browser storage will make your file system tasks inaccessible from this app. Your files will remain on disk but won't be loaded.\n\nAre you sure you want to continue?"
                            );
                            if (!confirmed) return;
                            
                            clearStorageConfig();
                            setLocalStorageMode("localStorage");
                            setDirectoryName(null);
                            setHasChanges(true);
                            toast.info("Switched to browser storage. File system tasks won't be loaded.");
                          }}
                        >
                          Switch to Browser Storage
                        </Button>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Info about current storage */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Storage Information</h4>
                    
                    {storageMode === "localStorage" && (
                      <div className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Storage Keys:</span>
                        </div>
                        <div className="text-sm space-y-2">
                          <div className="flex items-center gap-2">
                            <code className="bg-muted px-2 py-1 rounded text-xs">multi-agent-pipeline:jobs</code>
                            <span className="text-muted-foreground">- All tasks and outputs</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <code className="bg-muted px-2 py-1 rounded text-xs">multi-agent-pipeline:ai-settings</code>
                            <span className="text-muted-foreground">- AI model settings</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {storageMode === "fileSystem" && directoryName && (
                      <div className="p-4 border rounded-lg space-y-3">
                        <div className="text-sm space-y-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-600" />
                            <span>Files stored directly on your computer</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-600" />
                            <span>No browser storage limits</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-600" />
                            <span>Access files directly in your file manager</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-600" />
                            <span>Better performance with many tasks</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tips */}
                  <div className="p-4 border-2 border-blue-500/50 rounded-lg bg-blue-50 dark:bg-blue-900/10">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-blue-700 dark:text-blue-400">
                      <span>💡</span> Tips
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Use "Export PDF" to create permanent backups of your analysis results</li>
                      <li>File system storage keeps each task in its own folder for easy organization</li>
                      <li>Browser storage is simpler but may slow down with 20+ tasks</li>
                    </ul>
                  </div>

                  <div className="p-4 border-2 border-amber-500/50 rounded-lg bg-amber-50 dark:bg-amber-900/10">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <span>⚠️</span> Important Notes
                    </h4>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                      {storageMode === "localStorage" ? (
                        <>
                          <li>Browser storage has size limits (typically 5-10MB)</li>
                          <li>Clearing browser data will delete all saved tasks</li>
                          <li>Private/Incognito mode will not persist data</li>
                        </>
                      ) : (
                        <>
                          <li>You'll need to re-select the directory each browser session</li>
                          <li>Don't delete or move the storage folder while the app is open</li>
                          <li>The app needs permission to access the selected folder</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="demo" className="m-0 h-full overflow-y-auto">
              <div className="p-6 space-y-6 max-w-3xl">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Try the Demo</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Experience I.A.N. with a pre-configured demo task that showcases all features.
                  </p>
                </div>

                <div className="p-6 border-2 border-accent/50 rounded-lg bg-accent/5 space-y-4">
                  <div className="flex items-start gap-4">
                    <PlayCircle size={32} className="text-accent shrink-0 mt-1" weight="fill" />
                    <div className="flex-1 space-y-3">
                      <h4 className="font-semibold text-lg">Smart Shopping Cart Demo</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {getDemoDescription()}
                      </p>
                      
                      <div className="pt-2">
                        <Button
                          size="lg"
                          onClick={() => {
                            const demoJob = createDemoJob();
                            // Store the demo job
                            const jobs = JSON.parse(localStorage.getItem("multi-agent-pipeline:jobs") || "[]");
                            jobs.unshift(demoJob);
                            localStorage.setItem("multi-agent-pipeline:jobs", JSON.stringify(jobs));
                            
                            // Notify parent component
                            if (onDemoCreated) {
                              onDemoCreated();
                            }
                            
                            // Close dialog
                            onOpenChange(false);
                            
                            toast.success("Demo task created! Select it from the task list to get started.");
                          }}
                          className="w-full sm:w-auto"
                        >
                          <PlayCircle className="mr-2" weight="fill" />
                          Create Demo Task
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">What's Included in the Demo?</h4>
                  
                  <div className="grid gap-3">
                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" weight="fill" />
                      <div>
                        <p className="font-medium text-sm">Pre-filled Task Details</p>
                        <p className="text-xs text-muted-foreground">
                          Complete title and description for a real-world e-commerce feature
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" weight="fill" />
                      <div>
                        <p className="font-medium text-sm">Mock Meeting Transcript</p>
                        <p className="text-xs text-muted-foreground">
                          Realistic conversation between PM, Engineering, UX, and Business teams
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" weight="fill" />
                      <div>
                        <p className="font-medium text-sm">Technical Documentation</p>
                        <p className="text-xs text-muted-foreground">
                          Architecture notes, API specs, and performance requirements
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" weight="fill" />
                      <div>
                        <p className="font-medium text-sm">Email Communications</p>
                        <p className="text-xs text-muted-foreground">
                          Stakeholder emails including CEO priorities and competitive analysis
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" weight="fill" />
                      <div>
                        <p className="font-medium text-sm">UX Design Notes</p>
                        <p className="text-xs text-muted-foreground">
                          User flows, visual design specs, and accessibility considerations
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" weight="fill" />
                      <div>
                        <p className="font-medium text-sm">Implementation Checklist</p>
                        <p className="text-xs text-muted-foreground">
                          Detailed project plan with phases, tasks, and success criteria
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-2 border-blue-500/50 rounded-lg bg-blue-50 dark:bg-blue-900/10">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <span>💡</span> How to Use the Demo
                  </h4>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                    <li>Click "Create Demo Task" to add the pre-configured task</li>
                    <li>Select the demo task from your task list in the sidebar</li>
                    <li>Review the reference materials to understand the context</li>
                    <li>Click "Run Full Pipeline" to see AI agents analyze the task</li>
                    <li>Explore the generated outputs from different agent perspectives</li>
                    <li>Try creating a new version with updated requirements</li>
                    <li>Export the results as a PDF for sharing</li>
                  </ol>
                </div>

                <div className="p-4 border-2 border-amber-500/50 rounded-lg bg-amber-50 dark:bg-amber-900/10">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <span>⚠️</span> Note
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    The demo task is a fictional example created for demonstration purposes. 
                    It will be added to your task list like any other task and can be deleted when you're done exploring.
                  </p>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <Separator className="shrink-0" />

        <div className="px-6 py-4 flex items-center justify-between shrink-0">
          <Button
            variant="outline"
            onClick={handleResetAllPrompts}
            disabled={Object.keys(localPrompts).length === 0}
          >
            <ArrowCounterClockwise className="mr-2" />
            Reset All Prompts
          </Button>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} disabled={!hasChanges}>
              <FloppyDisk className="mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
      
      {/* Migration Warning Dialog */}
      <AlertDialog open={showMigrationWarning} onOpenChange={setShowMigrationWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Migrate Tasks to File System?</AlertDialogTitle>
            <AlertDialogDescription>
              You have {localStorageJobs.length} task{localStorageJobs.length !== 1 ? 's' : ''} stored in browser storage.
              Would you like to migrate them to file system storage?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => {
              setShowMigrationWarning(false);
            }}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => {
                // Switch without migrating
                setLocalStorageMode("fileSystem");
                setHasChanges(true);
                setShowMigrationWarning(false);
                toast.info("Switched to file system storage. Browser tasks were not migrated.");
              }}
            >
              Switch Without Migrating
            </Button>
            <AlertDialogAction
              disabled={isMigrating || !getCachedDirectoryHandle()}
              onClick={async () => {
                if (!getCachedDirectoryHandle()) {
                  toast.error("Please select a storage directory first");
                  return;
                }
                
                setIsMigrating(true);
                try {
                  const count = await exportJobsToFileSystem(localStorageJobs);
                  // Clear localStorage jobs after successful migration
                  setStoredValue("jobs", []);
                  setLocalStorageMode("fileSystem");
                  setHasChanges(true);
                  toast.success(`Migrated ${count} task${count !== 1 ? 's' : ''} to file system storage`);
                } catch (error) {
                  const errorMessage = error instanceof Error ? error.message : "Unknown error";
                  toast.error(`Migration failed: ${errorMessage}`);
                } finally {
                  setIsMigrating(false);
                  setShowMigrationWarning(false);
                }
              }}
            >
              {isMigrating ? "Migrating..." : "Migrate Tasks"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
