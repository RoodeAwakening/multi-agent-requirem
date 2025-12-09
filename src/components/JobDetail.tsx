import { useState, useMemo, useEffect, useRef } from "react";
import { Job } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
// Use deep imports for better tree-shaking
import { Play } from "@phosphor-icons/react/dist/csr/Play";
import { FolderOpen } from "@phosphor-icons/react/dist/csr/FolderOpen";
import { ArrowsClockwise } from "@phosphor-icons/react/dist/csr/ArrowsClockwise";
import { FilePdf } from "@phosphor-icons/react/dist/csr/FilePdf";
import { DownloadSimple } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { Clock } from "@phosphor-icons/react/dist/csr/Clock";
import { PipelineOrchestrator } from "@/lib/pipeline";
import { OUTPUT_FILES } from "@/lib/constants";
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

interface JobDetailProps {
  job: Job;
  onJobUpdated: (job: Job) => void;
}

export function JobDetail({ job, onJobUpdated }: JobDetailProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [selectedOutput, setSelectedOutput] = useState<string>(
    OUTPUT_FILES[0].filename
  );
  const [isNewVersionDialogOpen, setIsNewVersionDialogOpen] = useState(false);
  const [viewingVersion, setViewingVersion] = useState<number>(job.version);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isReferencesOpen, setIsReferencesOpen] = useState(false);

  // Reset viewing version when job changes
  useEffect(() => {
    setViewingVersion(job.version);
  }, [job.id, job.version]);

  // Fix for pipeline running state bug: If job status is "running" but isRunning is false,
  // it means the user left and returned while the pipeline was "running" (which is actually stale).
  // Reset the status to prevent showing a stuck "running" state.
  // IMPORTANT: We use a ref to track if we just completed a pipeline to avoid race conditions
  // where the effect runs after successful completion but before the job prop updates.
  const justCompletedRef = useRef(false);
  const hasCheckedStaleStatus = useRef(false);
  
  useEffect(() => {
    // Don't reset if we just completed the pipeline (avoid race condition)
    if (justCompletedRef.current) {
      justCompletedRef.current = false;
      return;
    }
    
    // Only check for stale status once between state changes
    // The flag is reset whenever dependencies change (including status updates)
    if (!hasCheckedStaleStatus.current && job.status === "running" && !isRunning) {
      hasCheckedStaleStatus.current = true;
      const updatedJob = { ...job, status: "new" as const };
      onJobUpdated(updatedJob);
      toast.info("Pipeline status was reset. Please run again if needed.");
    }
    
    // Reset the flag when switching to a different job
    return () => {
      hasCheckedStaleStatus.current = false;
    };
  }, [job.id, job.status, isRunning, onJobUpdated]); // Proper dependencies for React hooks

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

  const outputContent = currentViewData.outputs[selectedOutput];
  const hasOutputs = Object.keys(currentViewData.outputs).length > 0;
  const hasVersionHistory = (job.versionHistory?.length || 0) > 0;

  const renderedMarkdown = useMemo(() => {
    if (!outputContent) return "";
    try {
      return marked.parse(outputContent, { async: false }) as string;
    } catch (error) {
      console.error("Error parsing markdown:", error);
      return outputContent;
    }
  }, [outputContent]);

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
          </div>
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
                  />
                </SheetContent>
              </Sheet>
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
              <div className="text-sm text-muted-foreground mb-1">
                {currentStep && `Processing: ${currentStep}`}
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

            <div className="flex-1 overflow-auto">{OUTPUT_FILES.map((file) => (
                <TabsContent
                  key={file.filename}
                  value={file.filename}
                  className="h-full m-0 p-6"
                >
                  <ScrollArea className="h-full">
                    {outputContent ? (
                      <div
                        className="markdown-content prose max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: renderedMarkdown,
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
              ))}
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
