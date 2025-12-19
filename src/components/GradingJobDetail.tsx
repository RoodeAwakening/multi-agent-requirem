import { useEffect, useState } from "react";
import { GradingJob } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play } from "@phosphor-icons/react/dist/csr/Play";
import { FilePdf } from "@phosphor-icons/react/dist/csr/FilePdf";
import { Warning } from "@phosphor-icons/react/dist/csr/Warning";
import { normalizeRequirementName, processGradingJob, processTeamReadyReview } from "@/lib/requirement-grading-agent";
import { toast } from "sonner";
import { marked } from "marked";
import { exportGradingJobToPDF, exportTeamReadyToPDF } from "@/lib/pdf-export";

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

function getTeamReadyBadgeVariant(teamReady: boolean): "default" | "destructive" | "secondary" {
  return teamReady ? "default" : "destructive";
}

export function GradingJobDetail({ job, onJobUpdated }: GradingJobDetailProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentRequirement, setCurrentRequirement] = useState("");
  const [teamView, setTeamView] = useState<"initial" | "team-ready">("initial");
  const [isTeamRunning, setIsTeamRunning] = useState(false);
  const [teamProgress, setTeamProgress] = useState(0);
  const [currentTeamRequirement, setCurrentTeamRequirement] = useState("");

  useEffect(() => {
    setTeamView("initial");
  }, [job.id]);

  const gradingDisabled = isRunning || job.status === "running" || job.status === "completed";
  const canRunTeamReady = job.status === "completed" && !!job.gradedRequirements?.length;

  const handleRunGrading = async () => {
    setIsRunning(true);
    setProgress(0);
    setTeamView("initial");
    
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

  const handleRunTeamReady = async () => {
    setIsTeamRunning(true);
    setTeamProgress(0);
    setTeamView("team-ready");

    const updatedJob = { ...job, teamReadyStatus: "running" as const };
    onJobUpdated(updatedJob);

    try {
      const result = await processTeamReadyReview(updatedJob, (current, total, reqName) => {
        setTeamProgress(total === 0 ? 100 : (current / total) * 100);
        setCurrentTeamRequirement(reqName);
      });

      onJobUpdated(result);
      toast.success("Team-ready grading completed!");
    } catch (error) {
      const failedJob = { ...job, teamReadyStatus: "failed" as const };
      onJobUpdated(failedJob);
      toast.error(`Team-ready grading failed: ${error}`);
    } finally {
      setIsTeamRunning(false);
      setTeamProgress(0);
      setCurrentTeamRequirement("");
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

  const handleExportTeamReadyPDF = async () => {
    try {
      exportTeamReadyToPDF(job);
      toast.success("Team-ready PDF exported successfully!");
    } catch (error) {
      toast.error(`Failed to export team-ready PDF: ${error}`);
    }
  };

  const renderSummaryCard = () => {
    if (!job.gradedRequirements?.length) return null;

    const total = job.gradedRequirements.length;
    const ready = job.gradedRequirements.filter((r) => r.readyForHandoff).length;
    const gradeCounts = ["A", "B", "C", "D", "F"].map((g) => ({
      grade: g,
      count: job.gradedRequirements.filter((r) => r.grade === g).length,
    }));

    return (
      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Requirements Grading Summary</h3>
            <p className="text-sm text-muted-foreground">
              {ready} of {total} ready for handoff
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="px-2 py-1 rounded-md border bg-muted">Total: {total}</span>
            <span className="px-2 py-1 rounded-md border bg-muted text-green-700">Ready: {ready}</span>
            <span className="px-2 py-1 rounded-md border bg-muted text-amber-700">Needs work: {total - ready}</span>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-sm">
          {gradeCounts.map(({ grade, count }) => (
            <div key={grade} className="rounded-md border bg-muted/50 px-3 py-2">
              <div className="font-semibold">Grade {grade}</div>
              <div className="text-muted-foreground">{count}</div>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  const renderTeamReady = () => {
    if (job.teamReadyStatus === "failed") {
      return (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2 text-destructive">
            Team-ready review failed
          </h3>
          <p className="text-muted-foreground">
            Please retry running the team-level review.
          </p>
        </div>
      );
    }

    if (!job.teamReadyRequirements || job.teamReadyRequirements.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          {canRunTeamReady
            ? "Run the team-ready review to generate team-level stories."
            : "Complete initial grading to enable team-level review."}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {job.teamReadyRequirements.map((req) => (
          <Card key={req.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-sm text-muted-foreground">{req.id}</span>
                  <Badge variant={getTeamReadyBadgeVariant(req.teamReady)}>
                    {req.teamReady ? "Team Ready" : "Needs Refinement"}
                  </Badge>
                  {req.assignedTeam && (
                    <Badge variant="secondary">{req.assignedTeam}</Badge>
                  )}
                </div>
                <h3 className="font-semibold">{req.name}</h3>
              </div>
            </div>

            {req.userStory && (
              <p className="text-sm text-muted-foreground mb-2">
                <span className="font-medium text-foreground">User Story:</span>{" "}
                {req.userStory}
              </p>
            )}

            {req.acceptanceCriteria && req.acceptanceCriteria.length > 0 && (
              <div className="mb-2">
                <p className="text-sm font-medium text-foreground">Acceptance Criteria</p>
                <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                  {req.acceptanceCriteria.map((ac, idx) => (
                    <li key={`${req.id}-ac-${idx}`}>{ac}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm mb-2">
              {typeof req.storyPoints === "number" && (
                <div>
                  <span className="text-muted-foreground">Story Points: </span>
                  <span className="font-medium">{req.storyPoints}</span>
                </div>
              )}
              {req.splitNote && (
                <div className="flex items-center gap-2 text-sm text-amber-700 font-medium">
                  <Warning size={16} aria-label="Split warning" role="img" />
                  <span>Split: {req.splitNote}</span>
                </div>
              )}
            </div>

            {!req.teamReady && req.notReadyNotes && (
              <div className="mt-3 flex items-center gap-2 text-sm text-amber-700">
                <Warning size={16} aria-label="Not ready warning" role="img" />
                <span>Not Ready: {req.notReadyNotes}</span>
              </div>
            )}
          </Card>
        ))}
      </div>
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
          {job.teamReadyRequirements && (
            <div>
              <div className="text-sm text-muted-foreground">Team Ready</div>
              <div className="text-2xl font-bold text-green-600">
                {job.teamReadyRequirements.filter(r => r.teamReady).length}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <Button
            onClick={handleRunGrading}
            disabled={gradingDisabled}
            variant={job.status === "completed" ? "secondary" : "default"}
            size="lg"
          >
            <Play className="mr-2" />
            {job.status === "completed" ? "Grading Completed" : isRunning ? "Grading..." : "Run Grading"}
          </Button>

          {canRunTeamReady && (
            <Button
              onClick={handleRunTeamReady}
              disabled={isTeamRunning || job.teamReadyStatus === "running"}
              variant="outline"
              size="lg"
            >
              <Play className="mr-2" />
              {isTeamRunning || job.teamReadyStatus === "running" ? "Reviewing..." : "Run Team Ready Review"}
            </Button>
          )}

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

          {job.teamReadyStatus === "completed" && job.teamReadyRequirements?.length && (
            <Button
              onClick={handleExportTeamReadyPDF}
              variant="outline"
              size="lg"
            >
              <FilePdf className="mr-2" />
              Export Team Ready PDF
            </Button>
          )}

          {job.teamReadyStatus === "completed" && (
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant={teamView === "initial" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTeamView("initial")}
              >
                Initial Output
              </Button>
              <Button
                variant={teamView === "team-ready" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTeamView("team-ready")}
                disabled={!job.teamReadyRequirements?.length}
              >
                Team-Level Output
              </Button>
            </div>
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

        {isTeamRunning && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Team-ready review: {currentTeamRequirement}
              </span>
              <span className="font-medium">{Math.round(teamProgress)}%</span>
            </div>
            <Progress value={teamProgress} />
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

          {job.status === "completed" && (
            <div className="space-y-6">
              {teamView === "initial" ? (
                <>
                  {job.gradedRequirements && (
                    <div className="space-y-4">
                      {renderSummaryCard()}
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
                </>
              ) : (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Team-Level Output</h2>
                  {renderTeamReady()}
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
