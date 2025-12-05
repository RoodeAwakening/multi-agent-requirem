import { useState, useEffect } from "react";
import { useStoredValue } from "@/lib/storage";
import { AIModel, AISettings, setApiKey, getApiKey } from "@/lib/ai-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  CheckCircle,
  ArrowCounterClockwise,
  FloppyDisk,
  Eye,
  EyeSlash,
} from "@phosphor-icons/react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [aiSettings, setAISettings] = useStoredValue<AISettings>("ai-settings", {
    model: "gpt-4o",
  });
  const [customPrompts, setCustomPrompts] = useStoredValue<
    Partial<Record<PipelineStepId, string>>
  >("custom-prompts", {});

  const [localModel, setLocalModel] = useState<AIModel>(
    aiSettings?.model || "gpt-4o"
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

  useEffect(() => {
    setLocalModel(aiSettings?.model || "gpt-4o");
  }, [aiSettings]);

  useEffect(() => {
    setLocalPrompts(customPrompts || {});
  }, [customPrompts]);

  const handleSaveSettings = () => {
    setAISettings({ model: localModel });
    setCustomPrompts(localPrompts);
    
    // Save API keys (save even if empty to allow clearing)
    setApiKey("openai", openaiKey);
    setApiKey("gemini", geminiKey);
    
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
      <DialogContent className="max-w-[95vw] w-full lg:w-[1400px] h-[92vh] p-0 flex flex-col">
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
                        <SelectItem value="gemini-pro">
                          <div className="flex flex-col items-start">
                            <span className="font-medium">Gemini Pro</span>
                            <span className="text-xs text-muted-foreground">
                              Google's advanced model - Strong reasoning
                            </span>
                          </div>
                        </SelectItem>
                        <SelectItem value="gemini-flash">
                          <div className="flex flex-col items-start">
                            <span className="font-medium">Gemini Flash</span>
                            <span className="text-xs text-muted-foreground">
                              Fast responses - Cost effective
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

                  {/* Gemini API Key */}
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

                  {(localModel === "gemini-pro" || localModel === "gemini-flash") && !geminiKey && (
                    <div className="mt-4 p-4 border-2 border-blue-500/50 rounded-lg bg-blue-50 dark:bg-blue-900/10">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-blue-700 dark:text-blue-400">
                        <span>ℹ️</span> Gemini Setup
                      </h4>
                      <div className="text-sm space-y-2">
                        <p className="text-foreground">
                          To use Gemini models, enter your API key above. You can get one from Google AI Studio.
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Your API key is stored locally and never sent to any server other than Google's API.
                        </p>
                      </div>
                    </div>
                  )}

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
                      <span className="text-sm text-muted-foreground">Gemini Key:</span>
                      <Badge variant={geminiKey ? "default" : "outline"}>
                        {geminiKey ? "Configured" : "Not set"}
                      </Badge>
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
    </Dialog>
  );
}
