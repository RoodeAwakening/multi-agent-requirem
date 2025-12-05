import { useState, useMemo } from "react";
import { Job } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Play, FolderOpen } from "@phosphor-icons/react";
import { PipelineOrchestrator } from "@/lib/pipeline";
import { OUTPUT_FILES } from "@/lib/constants";
import { toast } from "sonner";
import { marked } from "marked";

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

  const handleRunPipeline = async () => {
    if (isRunning) return;

    setIsRunning(true);
    setProgress(0);
    job.status = "running";
    onJobUpdated({ ...job });

    const orchestrator = new PipelineOrchestrator(job, {
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
      onJobUpdated(updatedJob);
      toast.success("Pipeline completed successfully!");
    } catch (error) {
      job.status = "failed";
      onJobUpdated({ ...job });
      toast.error(`Pipeline failed: ${error}`);
    } finally {
      setIsRunning(false);
      setProgress(0);
      setCurrentStep("");
    }
  };

  const outputContent = job.outputs[selectedOutput];
  const hasOutputs = Object.keys(job.outputs).length > 0;

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
              <StatusBadge status={job.status} />
            </div>
            <p className="text-muted-foreground">{job.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="text-sm text-muted-foreground">
            Created: {new Date(job.createdAt).toLocaleString()}
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="text-sm text-muted-foreground">
            Version: {job.version}
          </div>
          {job.referenceFolders.length > 0 && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <FolderOpen size={16} />
                {job.referenceFolders.length} reference
                {job.referenceFolders.length !== 1 ? "s" : ""}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleRunPipeline}
            disabled={isRunning}
            size="lg"
            className="min-w-40"
          >
            {isRunning ? (
              <>Running...</>
            ) : (
              <>
                <Play className="mr-2" weight="fill" />
                Run Full Pipeline
              </>
            )}
          </Button>

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
            <TabsList className="w-full justify-start rounded-none border-b px-6 h-auto py-2">
              {OUTPUT_FILES.map((file) => {
                const hasOutput = !!job.outputs[file.filename];
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

            <div className="flex-1 overflow-auto">
              {OUTPUT_FILES.map((file) => (
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
