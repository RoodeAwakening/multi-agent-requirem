import { useState, useMemo, useEffect, useRef } from "react";
import { Job, PipelineStepId } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
// Use deep imports for better tree-shaking
import { Play } from "@phosphor-icons/react/dist/csr/Play";
import { FolderOpen } from "@phosphor-icons/react/dist/csr/FolderOpen";
import { ArrowsClockwise } from "@phosphor-icons/react/dist/csr/ArrowsClockwise";
import { FilePdf } from "@phosphor-icons/react/dist/csr/FilePdf";
import { DownloadSimple } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { Clock } from "@phosphor-icons/react/dist/csr/Clock";
// import { Trash } from "@phosphor-icons/react/dist/csr/Trash"; // Removed - delete only from sidebar
import { GitDiff } from "@phosphor-icons/react/dist/csr/GitDiff";
import { PipelineOrchestrator } from "@/lib/pipeline";
import { OUTPUT_FILES, PIPELINE_STEPS } from "@/lib/constants";
import { toast } from "sonner";
import { marked } from "marked";
import { NewVersionDialog } from "./NewVersionDialog";
import { VersionHistoryPanel } from "./VersionHistoryPanel";
import { ReferencesPanel } from "./ReferencesPanel";
import { exportJobToPDF } from "@/lib/pdf-export";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { getStatusMessages, StatusMessage } from "@/lib/status-messages";

// Regex to match markdown code fences - moved outside function for performance
const MARKDOWN_CODE_FENCE_REGEX = /^```(?:markdown|md)?\s*([\s\S]*?)\s*```\s*$/;

// Helper function to strip markdown code fences if present
// This handles cases where AI returns content wrapped in ```markdown ... ```
function stripMarkdownCodeFence(content: string): string {
  if (!content) return content;
  
  const match = content.match(MARKDOWN_CODE_FENCE_REGEX);
  
  if (match) {
    return match[1]; // Return the content inside the code fence
  }
  
  return content; // Return as-is if no code fence
}

interface JobDetailProps {
  job: Job;
  onJobUpdated: (job: Job) => void;
  // onJobDeleted removed - deletion only available from sidebar
}

export function JobDetail({ job, onJobUpdated }: JobDetailProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [currentStatusMessage, setCurrentStatusMessage] = useState<StatusMessage>({ text: "", type: "serious" });
  const [selectedOutput, setSelectedOutput] = useState<string>(
    OUTPUT_FILES[0].filename
  );
  const [isNewVersionDialogOpen, setIsNewVersionDialogOpen] = useState(false);
  const [viewingVersion, setViewingVersion] = useState<number>(job.version);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isReferencesOpen, setIsReferencesOpen] = useState(false);
  // const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); // Removed - delete only from sidebar
  const [isChangelogDialogOpen, setIsChangelogDialogOpen] = useState(false);

  // Reset viewing version when job changes
  useEffect(() => {
    setViewingVersion(job.version);
  }, [job.id, job.version]);

  // Fix for pipeline running state bug: If job status is "running" but isRunning is false,
  // it means the user left and returned while the pipeline was "running" (which is actually stale).
  // Reset the status to prevent showing a stuck "running" state.
  // IMPORTANT: We use refs to track completion and per-job stale check state to avoid race conditions.
  const justCompletedRef = useRef(false);
  const hasCheckedStaleStatus = useRef(false);
  
  // Reset both flags when switching jobs to ensure clean state
  useEffect(() => {
    return () => {
      hasCheckedStaleStatus.current = false;
      justCompletedRef.current = false;
    };
  }, [job.id]);
  
  useEffect(() => {
    // Don't reset if we just completed the pipeline (avoid race condition)
    if (justCompletedRef.current) {
      justCompletedRef.current = false;
      return;
    }
    
    // Only check for stale status once per job to prevent repeated resets
    if (!hasCheckedStaleStatus.current && job.status === "running" && !isRunning) {
      hasCheckedStaleStatus.current = true;
      const updatedJob = { ...job, status: "new" as const };
      onJobUpdated(updatedJob);
      toast.info("Pipeline status was reset. Please run again if needed.");
    }
  }, [job.status, isRunning, onJobUpdated]); // Check on status/state changes

  // Rotate status messages while running
  useEffect(() => {
    if (!isRunning || !currentStep) {
      setCurrentStatusMessage({ text: "", type: "serious" });
      return;
    }

    const messages = getStatusMessages(currentStep as PipelineStepId);
    let messageIndex = 0;

    // Set initial message immediately
    setCurrentStatusMessage(messages[messageIndex]);

    // Rotate messages every 4 seconds
    const intervalId = setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length;
      setCurrentStatusMessage(messages[messageIndex]);
    }, 4000);

    return () => clearInterval(intervalId);
  }, [currentStep, isRunning]);

  // Get the data for the currently viewing version
  const currentViewData = useMemo(() => {
    if (viewingVersion === job.version) {
      return job;
    }
    
    const historicalVersion = job.versionHistory?.find(
      (v) => v.version === viewingVersion
    );
    
    if (historicalVersion) {
      // Return a Job-like object for display
      return {
        ...job,
        version: historicalVersion.version,
        description: historicalVersion.description,
        status: historicalVersion.status,
        referenceFolders: historicalVersion.referenceFolders,
        referenceFiles: historicalVersion.referenceFiles,
        outputs: historicalVersion.outputs,
        updatedAt: historicalVersion.createdAt,
        changeReason: historicalVersion.changeReason,
        changelog: historicalVersion.changelog,
      } as Job;
    }
    
    return job;
  }, [job, viewingVersion]);

  const handleVersionSelect = (version: number) => {
    setViewingVersion(version);
    setIsVersionHistoryOpen(false);
    toast.success(`Viewing version ${version}`);
  };

  const handleRunPipeline = async () => {
    if (isRunning) return;

    setIsRunning(true);
    setProgress(0);
    // Don't mutate the job prop - create a new object with updated status
    const runningJob = { ...job, status: "running" as const };
    onJobUpdated(runningJob);

    const orchestrator = new PipelineOrchestrator(runningJob, {
      onProgress: (step, prog) => {
        setProgress(prog);
        setCurrentStep(step);
      },
      onStepComplete: (step) => {
        toast.success(`Completed: ${step}`);
      },
    });

    try {
      const updatedJob = await orchestrator.runFullPipeline();
      justCompletedRef.current = true; // Mark that we just completed to avoid race condition
      
      // Generate changelog after pipeline completes
      if (updatedJob.versionHistory && updatedJob.versionHistory.length > 0) {
        toast.info("Generating changelog...");
        try {
          const { generateChangelog } = await import("@/lib/changelog-agent");
          
          // Get the previous version (last item in history)
          const previousVersion = updatedJob.versionHistory[updatedJob.versionHistory.length - 1];
          
          // Generate changelog comparing previous to current
          const changelog = await generateChangelog(previousVersion, updatedJob);
          
          // Add changelog to the CURRENT version (not the previous one)
          // The changelog describes what changed from previous version to current version
          updatedJob.changelog = changelog;
          
          toast.success("Changelog generated!");
        } catch (error) {
          console.error("Error generating changelog:", error);
          toast.warning("Pipeline completed but changelog generation failed");
        }
      }
      
      onJobUpdated(updatedJob);
      toast.success("Pipeline completed successfully!");
    } catch (error) {
      const failedJob = { ...job, status: "failed" as const };
      justCompletedRef.current = true; // Prevent race condition on failure too
      onJobUpdated(failedJob);
      toast.error(`Pipeline failed: ${error}`);
    } finally {
      setIsRunning(false);
      setProgress(0);
      setCurrentStep("");
    }
  };

  const handleVersionCreated = (newVersionJob: Job) => {
    setViewingVersion(newVersionJob.version); // Switch to viewing the new version
    onJobUpdated(newVersionJob);
    toast.success(`Version ${newVersionJob.version} created successfully!`);
  };

  const handleVersionDelete = (versionNumber: number) => {
    const isCurrentVersion = versionNumber === job.version;
    
    if (isCurrentVersion) {
      // Deleting current version - promote the most recent version from history
      if (!job.versionHistory || job.versionHistory.length === 0) {
        toast.error("Cannot delete the only version");
        return;
      }
      
      // Find the most recent version in history (highest version number)
      const sortedHistory = [...job.versionHistory].sort((a, b) => b.version - a.version);
      const newCurrentVersion = sortedHistory[0];
      
      // Remove the new current version from history
      const updatedHistory = job.versionHistory.filter(
        (v) => v.version !== newCurrentVersion.version
      );
      
      // Promote the most recent history version to current
      const updatedJob: Job = {
        ...job,
        version: newCurrentVersion.version,
        description: newCurrentVersion.description,
        referenceFolders: newCurrentVersion.referenceFolders,
        referenceFiles: newCurrentVersion.referenceFiles,
        outputs: newCurrentVersion.outputs,
        status: newCurrentVersion.status,
        changeReason: newCurrentVersion.changeReason,
        changelog: newCurrentVersion.changelog,
        updatedAt: new Date().toISOString(),
        versionHistory: updatedHistory,
      };
      
      // Switch to viewing the new current version
      setViewingVersion(newCurrentVersion.version);
      onJobUpdated(updatedJob);
    } else {
      // Deleting a past version from history
      const updatedHistory = (job.versionHistory || []).filter(
        (v) => v.version !== versionNumber
      );
      
      const updatedJob: Job = {
        ...job,
        versionHistory: updatedHistory,
      };
      
      // If we're viewing the deleted version, switch back to current
      if (viewingVersion === versionNumber) {
        setViewingVersion(job.version);
      }
      
      onJobUpdated(updatedJob);
    }
  };

  const handleExportCurrentTab = () => {
    try {
      exportJobToPDF(currentViewData, selectedOutput);
      toast.success(`PDF exported: ${selectedOutput}`);
    } catch (error) {
      toast.error("Failed to export PDF");
      console.error(error);
    }
  };

  const handleExportFullReport = () => {
    try {
      exportJobToPDF(currentViewData);
      toast.success("Full report exported as PDF");
    } catch (error) {
      toast.error("Failed to export PDF");
      console.error(error);
    }
  };

  const handleExportSpecificDocument = (filename: string) => {
    try {
      exportJobToPDF(currentViewData, filename);
      toast.success(`PDF exported: ${filename}`);
    } catch (error) {
      toast.error("Failed to export PDF");
      console.error(error);
    }
  };

  // Delete handlers removed - deletion only available from sidebar

  const outputContent = currentViewData.outputs[selectedOutput];
  const hasOutputs = Object.keys(currentViewData.outputs).length > 0;
  const hasVersionHistory = (job.versionHistory?.length || 0) > 0;

  const renderedMarkdown = useMemo(() => {
    if (!outputContent) return "";
    try {
      const cleanContent = stripMarkdownCodeFence(outputContent);
      return marked.parse(cleanContent, { async: false }) as string;
    } catch (error) {
      console.error("Error parsing markdown:", error);
      return outputContent;
    }
  }, [outputContent]);

  const renderedChangelog = useMemo(() => {
    if (!currentViewData.changelog) return "";
    try {
      const cleanContent = stripMarkdownCodeFence(currentViewData.changelog);
      return marked.parse(cleanContent, { async: false }) as string;
    } catch (error) {
      console.error("Error parsing changelog markdown:", error);
      return currentViewData.changelog;
    }
  }, [currentViewData.changelog]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-border bg-card">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold">{job.title}</h2>
              <StatusBadge status={currentViewData.status} />
              {viewingVersion !== job.version && (
                <Badge variant="outline">
                  Viewing v{viewingVersion}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{currentViewData.description}</p>
            
            {/* Display changeReason for any version that has it */}
            {currentViewData.changeReason && (
              <div className="mt-3 p-3 bg-muted/50 rounded-md border border-border">
                <p className="text-sm font-medium text-foreground">
                  {currentViewData.changeReason}
                </p>
              </div>
            )}
          </div>
          {/* Delete button removed - deletion only available from sidebar */}
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="text-sm text-muted-foreground">
            Created: {new Date(job.createdAt).toLocaleString()}
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="text-sm text-muted-foreground">
            Version {currentViewData.version}/{job.version}
          </div>
          {(currentViewData.referenceFiles?.length || currentViewData.referenceFolders.length > 0) && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <Sheet open={isReferencesOpen} onOpenChange={setIsReferencesOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8">
                    <FolderOpen size={16} className="mr-2" />
                    References
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="!w-[75vw] sm:!w-[80vw] md:!w-[85vw] lg:!w-[90vw] !max-w-none p-0">
                  <ReferencesPanel
                    referenceFiles={currentViewData.referenceFiles || []}
                    referenceFolders={currentViewData.referenceFolders}
                  />
                </SheetContent>
              </Sheet>
            </>
          )}
          {hasVersionHistory && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <Sheet open={isVersionHistoryOpen} onOpenChange={setIsVersionHistoryOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8">
                    <Clock size={16} className="mr-2" />
                    History ({(job.versionHistory?.length || 0) + 1})
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[400px] p-0">
                  <VersionHistoryPanel
                    job={job}
                    onVersionSelect={handleVersionSelect}
                    currentlyViewingVersion={viewingVersion}
                    onVersionDelete={handleVersionDelete}
                  />
                </SheetContent>
              </Sheet>
            </>
          )}
          {currentViewData.changelog && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8"
                onClick={() => setIsChangelogDialogOpen(true)}
              >
                <GitDiff size={16} className="mr-2" />
                What's Changed
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {viewingVersion === job.version && (
            <Button
              onClick={handleRunPipeline}
              disabled={isRunning}
              size="lg"
              className="min-w-40"
            >
              {isRunning ? (
                <>Running...</>
              ) : job.status === "failed" ? (
                <>
                  <Play className="mr-2" weight="fill" />
                  Retry Pipeline
                </>
              ) : (
                <>
                  <Play className="mr-2" weight="fill" />
                  Run Full Pipeline
                </>
              )}
            </Button>
          )}

          {viewingVersion !== job.version && (
            <Button
              onClick={() => setViewingVersion(job.version)}
              size="lg"
              variant="outline"
            >
              <ArrowsClockwise className="mr-2" />
              Return to Current Version (v{job.version})
            </Button>
          )}

          {job.status === "completed" && viewingVersion === job.version && (
            <Button
              onClick={() => setIsNewVersionDialogOpen(true)}
              disabled={isRunning}
              size="lg"
              variant="outline"
            >
              <ArrowsClockwise className="mr-2" />
              Create New Version
            </Button>
          )}

          {hasOutputs && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  disabled={isRunning}
                  size="lg"
                  variant="secondary"
                >
                  <FilePdf className="mr-2" />
                  Export PDF
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem onClick={handleExportFullReport}>
                  <DownloadSimple className="mr-2" />
                  Full Report (All Outputs)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                  {OUTPUT_FILES.map((file) => {
                    const hasOutput = !!currentViewData.outputs[file.filename];
                    return (
                      <DropdownMenuItem
                        key={file.filename}
                        onClick={() => handleExportSpecificDocument(file.filename)}
                        disabled={!hasOutput}
                      >
                        {file.label}
                        {hasOutput && <span className="ml-auto text-green-600">✓</span>}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
          )}

          {isRunning && (
            <div className="flex-1">
              <div className="text-sm mb-1">
                <span className="font-semibold text-foreground">
                  {PIPELINE_STEPS.find(s => s.id === currentStep)?.name || currentStep}
                </span>
                <span className="text-muted-foreground ml-2">
                  {currentStatusMessage.text || `Processing...`}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {hasOutputs ? (
          <Tabs
            value={selectedOutput}
            onValueChange={setSelectedOutput}
            className="h-full flex flex-col"
          >
            <div className="flex items-center justify-between border-b px-6 py-2">
              <TabsList className="justify-start rounded-none border-none h-auto p-0">
                {OUTPUT_FILES.map((file) => {
                  const hasOutput = !!currentViewData.outputs[file.filename];
                  return (
                    <TabsTrigger
                      key={file.filename}
                      value={file.filename}
                      disabled={!hasOutput}
                      className="data-[state=active]:border-b-2 data-[state=active]:border-accent"
                    >
                      {file.label}
                      {hasOutput && (
                        <span className="ml-2 text-green-600">✓</span>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              
              {outputContent && (
                <Button
                  onClick={handleExportCurrentTab}
                  size="sm"
                  variant="ghost"
                  className="shrink-0"
                >
                  <FilePdf className="mr-2" size={16} />
                  Export This Page
                </Button>
              )}
            </div>

            <div className="flex-1 overflow-auto">{OUTPUT_FILES.map((file) => {
                const tabOutputContent = currentViewData.outputs[file.filename];
                let tabRenderedMarkdown = "";
                if (tabOutputContent) {
                  try {
                    const cleanContent = stripMarkdownCodeFence(tabOutputContent);
                    tabRenderedMarkdown = marked.parse(cleanContent, { async: false }) as string;
                  } catch (error) {
                    console.error("Error parsing markdown:", error);
                    tabRenderedMarkdown = tabOutputContent;
                  }
                }
                
                return (
                <TabsContent
                  key={file.filename}
                  value={file.filename}
                  className="h-full m-0 p-6"
                >
                  <ScrollArea className="h-full">
                    {tabOutputContent ? (
                      <div
                        className="markdown-content prose max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: tabRenderedMarkdown,
                        }}
                      />
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <p>Output not yet generated</p>
                        <p className="text-sm mt-2">
                          Run the pipeline to generate this document
                        </p>
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              );
            })}
            </div>
          </Tabs>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <h3 className="text-xl font-semibold mb-2">
                Ready to analyze
              </h3>
              <p className="text-muted-foreground mb-6">
                Click "Run Full Pipeline" to start the multi-agent analysis.
                This will generate comprehensive documentation from technical,
                business, product, and executive perspectives.
              </p>
            </div>
          </div>
        )}
      </div>

      <NewVersionDialog
        open={isNewVersionDialogOpen}
        onOpenChange={setIsNewVersionDialogOpen}
        currentJob={job}
        onVersionCreated={handleVersionCreated}
      />

      <Dialog open={isChangelogDialogOpen} onOpenChange={setIsChangelogDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitDiff size={20} weight="bold" />
              What's Changed - Version {currentViewData.version}
            </DialogTitle>
            <DialogDescription>
              {currentViewData.version === 1
                ? "Initial version"
                : `Comparing changes from version ${currentViewData.version - 1} to version ${currentViewData.version}`}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            {renderedChangelog ? (
              <div
                className="markdown-content prose max-w-none text-sm"
                dangerouslySetInnerHTML={{
                  __html: renderedChangelog,
                }}
              />
            ) : (
              <div className="text-sm text-muted-foreground">
                No changelog available
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete dialog removed - deletion only available from sidebar */}
    </div>
  );
}

function StatusBadge({ status }: { status: Job["status"] }) {
  const variants: Record<
    Job["status"],
    { label: string; variant: "default" | "secondary" | "destructive" }
  > = {
    new: { label: "New", variant: "secondary" },
    running: { label: "Running", variant: "default" },
    completed: { label: "Completed", variant: "default" },
    failed: { label: "Failed", variant: "destructive" },
  };

  const { label, variant } = variants[status];

  return <Badge variant={variant}>{label}</Badge>;
}
