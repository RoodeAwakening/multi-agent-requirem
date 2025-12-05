import { useState, useEffect } from "react";
import { useKV } from "@github/spark/hooks";
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
} from "@phosphor-icons/react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AIModel = "gpt-4o" | "gpt-4o-mini" | "gemini-pro" | "gemini-flash";

interface AISettings {
  model: AIModel;
  temperature?: number;
  useLocalGemini?: boolean;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [aiSettings, setAISettings] = useKV<AISettings>("ai-settings", {
    model: "gpt-4o",
  });
  const [customPrompts, setCustomPrompts] = useKV<
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

  useEffect(() => {
    setLocalModel(aiSettings?.model || "gpt-4o");
  }, [aiSettings]);

  useEffect(() => {
    setLocalPrompts(customPrompts || {});
  }, [customPrompts]);

  const handleSaveSettings = () => {
    setAISettings({ model: localModel });
    setCustomPrompts(localPrompts);
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
      <DialogContent className="max-w-[95vw] w-[1600px] h-[92vh] p-0 flex flex-col">
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
                    
                    {(localModel === "gemini-pro" || localModel === "gemini-flash") && (
                      <div className="mt-4 p-4 border-2 border-destructive/50 rounded-lg bg-destructive/5">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-destructive">
                          <span>⚠️</span> Gemini Not Currently Supported
                        </h4>
                        <div className="text-sm space-y-3">
                          <p className="text-foreground">
                            Gemini models are not currently supported by the Spark runtime SDK.
                            The built-in <code className="bg-muted px-1.5 py-0.5 rounded text-xs">spark.llm</code> API 
                            only supports <strong>GPT-4o</strong> and <strong>GPT-4o-mini</strong>.
                          </p>
                          <div className="bg-background/50 p-3 rounded border">
                            <p className="font-medium text-foreground mb-2">Future Implementation Options:</p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs ml-2">
                              <li>Use Google's Gemini API directly with API keys</li>
                              <li>Integrate with Vertex AI through REST APIs</li>
                              <li>Use gcloud CLI as a subprocess (requires Node.js backend)</li>
                            </ul>
                          </div>
                          <p className="text-muted-foreground text-xs italic">
                            For now, please select GPT-4o or GPT-4o-mini to run the pipeline.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <h4 className="font-medium text-sm">Current Configuration</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Model:</span>
                      <Badge variant="secondary">{localModel}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="prompts" className="m-0 h-full">
              <div className="grid grid-cols-[320px_1fr] h-full">
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
                        className="w-full h-[calc(92vh-400px)] min-h-[400px] font-mono text-sm"
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
