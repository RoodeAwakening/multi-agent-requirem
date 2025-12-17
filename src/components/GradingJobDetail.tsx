import { useState } from "react";
import { GradingJob } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play } from "@phosphor-icons/react/dist/csr/Play";
import { FilePdf } from "@phosphor-icons/react/dist/csr/FilePdf";
import { processGradingJob } from "@/lib/requirement-grading-agent";
import { toast } from "sonner";
import { marked } from "marked";
import { exportGradingJobToPDF } from "@/lib/pdf-export";

interface GradingJobDetailProps {
  job: GradingJob;
  onJobUpdated: (job: GradingJob) => void;
}

function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed":
      return "default";
    case "running":
      return "secondary";
    case "failed":
      return "destructive";
    default:
      return "outline";
  }
}

function getGradeBadgeVariant(grade: string): "default" | "secondary" | "destructive" | "outline" {
  switch (grade) {
    case "A":
      return "default";
    case "B":
      return "secondary";
    case "C":
    case "D":
    case "F":
      return "destructive";
    default:
      return "outline";
  }
}

export function GradingJobDetail({ job, onJobUpdated }: GradingJobDetailProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentRequirement, setCurrentRequirement] = useState("");

  const handleRunGrading = async () => {
    setIsRunning(true);
    setProgress(0);
    
    const updatedJob = { ...job, status: "running" as const };
    onJobUpdated(updatedJob);

    try {
      const result = await processGradingJob(job, (current, total, reqName) => {
        setProgress((current / total) * 100);
        setCurrentRequirement(reqName);
      });
      
      onJobUpdated(result);
      toast.success("Requirements grading completed!");
    } catch (error) {
      const failedJob = { ...job, status: "failed" as const };
      onJobUpdated(failedJob);
      toast.error(`Grading failed: ${error}`);
    } finally {
      setIsRunning(false);
      setProgress(0);
      setCurrentRequirement("");
    }
  };

  const handleExportPDF = async () => {
    try {
      exportGradingJobToPDF(job);
      toast.success("PDF exported successfully!");
    } catch (error) {
      toast.error(`Failed to export PDF: ${error}`);
    }
  };

  const renderReport = () => {
    if (!job.reportContent) return null;

    return (
      <div 
        className="prose prose-sm max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: marked(job.reportContent) }}
      />
    );
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="m-6 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">{job.title}</h1>
            {job.description && (
              <p className="text-muted-foreground">{job.description}</p>
            )}
          </div>
          <Badge variant={getStatusBadgeVariant(job.status)}>
            {job.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <div className="text-sm text-muted-foreground">Requirements</div>
            <div className="text-2xl font-bold">{job.requirements.length}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Teams</div>
            <div className="text-2xl font-bold">{job.teams.length}</div>
          </div>
          {job.gradedRequirements && (
            <>
              <div>
                <div className="text-sm text-muted-foreground">Ready for Handoff</div>
                <div className="text-2xl font-bold text-green-600">
                  {job.gradedRequirements.filter(r => r.readyForHandoff).length}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Needs Work</div>
                <div className="text-2xl font-bold text-amber-600">
                  {job.gradedRequirements.filter(r => !r.readyForHandoff).length}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleRunGrading}
            disabled={isRunning || job.status === "running"}
            size="lg"
          >
            <Play className="mr-2" />
            {isRunning ? "Grading..." : "Run Grading"}
          </Button>
          
          {job.status === "completed" && job.reportContent && (
            <Button
              onClick={handleExportPDF}
              variant="outline"
              size="lg"
            >
              <FilePdf className="mr-2" />
              Export PDF
            </Button>
          )}
        </div>

        {isRunning && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Grading: {currentRequirement}
              </span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}
      </Card>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-6 pb-6">
          {job.status === "new" && (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">Ready to Grade</h3>
              <p className="text-muted-foreground">
                Click "Run Grading" to evaluate all requirements
              </p>
            </div>
          )}

          {job.status === "running" && !isRunning && (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">Grading in Progress</h3>
              <p className="text-muted-foreground">
                Please wait while requirements are being evaluated...
              </p>
            </div>
          )}

          {job.status === "completed" && job.reportContent && (
            <div className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-6">
                {renderReport()}
              </div>

              {job.gradedRequirements && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Graded Requirements</h2>
                  <div className="space-y-3">
                    {job.gradedRequirements.map((req) => (
                      <Card key={req.id} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm text-muted-foreground">
                                {req.id}
                              </span>
                              <Badge variant={getGradeBadgeVariant(req.grade)}>
                                Grade {req.grade}
                              </Badge>
                            </div>
                            <h3 className="font-semibold">{req.name}</h3>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">
                          {req.explanation}
                        </p>

                        <div className="flex items-center gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Ready: </span>
                            <span className={req.readyForHandoff ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                              {req.readyForHandoff ? "Yes" : "No"}
                            </span>
                          </div>
                          {req.assignedTeam && (
                            <div>
                              <span className="text-muted-foreground">Team: </span>
                              <span className="font-medium">{req.assignedTeam}</span>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {job.status === "failed" && (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2 text-destructive">
                Grading Failed
              </h3>
              <p className="text-muted-foreground mb-4">
                An error occurred while grading requirements
              </p>
              <Button onClick={handleRunGrading} variant="outline">
                <Play className="mr-2" />
                Retry
              </Button>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
