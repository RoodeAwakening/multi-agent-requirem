import { GradingJob } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash } from "@phosphor-icons/react/dist/csr/Trash";
import { ClipboardText } from "@phosphor-icons/react/dist/csr/ClipboardText";

interface GradingJobListProps {
  jobs: GradingJob[];
  selectedJobId: string | null;
  onSelectJob: (jobId: string) => void;
  onDeleteJob: (jobId: string) => void;
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

function getStatusLabel(status: string): string {
  switch (status) {
    case "new":
      return "New";
    case "running":
      return "Running";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}

export function GradingJobList({
  jobs,
  selectedJobId,
  onSelectJob,
  onDeleteJob,
}: GradingJobListProps) {
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <ClipboardText size={48} className="text-muted-foreground mb-4" />
        <h3 className="font-semibold mb-2">No Grading Jobs Yet</h3>
        <p className="text-sm text-muted-foreground">
          Create your first grading job to get started
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2">
        {jobs.map((job) => (
          <div
            key={job.id}
            className={`group relative p-3 rounded-lg border cursor-pointer transition-colors ${
              selectedJobId === job.id
                ? "bg-accent border-accent-foreground"
                : "hover:bg-accent/50"
            }`}
            onClick={() => onSelectJob(job.id)}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-medium text-sm line-clamp-2 flex-1">
                {job.title}
              </h3>
              <AlertDialog>
                <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash size={14} />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Grading Job</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{job.title}"? This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDeleteJob(job.id)}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <span>
                {formatDistanceToNow(new Date(job.createdAt), {
                  addSuffix: true,
                })}
              </span>
              <span>•</span>
              <span>{job.requirements.length} requirements</span>
              {job.teams.length > 0 && (
                <>
                  <span>•</span>
                  <span>{job.teams.length} teams</span>
                </>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Badge variant={getStatusBadgeVariant(job.status)}>
                {getStatusLabel(job.status)}
              </Badge>
              
              {job.gradedRequirements && (
                <div className="text-xs text-muted-foreground">
                  {job.gradedRequirements.filter(r => r.readyForHandoff).length}/
                  {job.gradedRequirements.length} ready
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
