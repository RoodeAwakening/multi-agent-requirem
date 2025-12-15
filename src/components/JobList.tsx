import { Job } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { useState } from "react";
// Use deep imports for better tree-shaking
import { CheckCircle } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { Circle } from "@phosphor-icons/react/dist/csr/Circle";
import { XCircle } from "@phosphor-icons/react/dist/csr/XCircle";
import { Spinner } from "@phosphor-icons/react/dist/csr/Spinner";
import { Trash } from "@phosphor-icons/react/dist/csr/Trash";
import { toast } from "sonner";

interface JobListProps {
  jobs: Job[] | undefined;
  selectedJobId: string | null;
  onSelectJob: (jobId: string) => void;
  onDeleteJob: (jobId: string) => Promise<void>;
}

export function JobList({ jobs, selectedJobId, onSelectJob, onDeleteJob }: JobListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    setJobToDelete(job);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (jobToDelete) {
      try {
        await onDeleteJob(jobToDelete.id);
        toast.success("Task deleted successfully");
      } catch (error) {
        toast.error("Failed to delete task");
        console.error("Error deleting job:", error);
      }
    }
    setDeleteDialogOpen(false);
    setJobToDelete(null);
  };

  if (!jobs || jobs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No tasks yet</p>
        <p className="text-xs mt-1">Create your first task to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {jobs.map((job) => (
          <div
            key={job.id}
            className={cn(
              "group relative w-full text-left p-3 rounded-lg transition-colors",
              "hover:bg-background/50",
              selectedJobId === job.id
                ? "bg-background border-2 border-accent"
                : "bg-background/30 border-2 border-transparent"
            )}
          >
            <button
              onClick={() => onSelectJob(job.id)}
              className="w-full text-left"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-sm line-clamp-2">{job.title}</h3>
                <StatusIcon status={job.status} />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {new Date(job.createdAt).toLocaleDateString()}
                </p>
                <StatusBadge status={job.status} />
              </div>
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
              onClick={(e) => handleDeleteClick(e, job)}
              title="Delete task"
            >
              <Trash size={14} className="text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{jobToDelete?.title}"? The task will be moved to trash where you can restore it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function StatusIcon({ status }: { status: Job["status"] }) {
  switch (status) {
    case "completed":
      return <CheckCircle className="text-green-600" weight="fill" />;
    case "running":
      return <Spinner className="text-accent animate-spin" />;
    case "failed":
      return <XCircle className="text-destructive" weight="fill" />;
    default:
      return <Circle className="text-muted-foreground" />;
  }
}

function StatusBadge({ status }: { status: Job["status"] }) {
  const variants: Record<Job["status"], { label: string; className: string }> =
    {
      new: { label: "New", className: "bg-muted text-muted-foreground" },
      running: {
        label: "Running",
        className: "bg-accent/20 text-accent animate-pulse",
      },
      completed: {
        label: "Done",
        className: "bg-green-100 text-green-700",
      },
      failed: {
        label: "Failed",
        className: "bg-destructive/20 text-destructive",
      },
    };

  const { label, className } = variants[status];

  return (
    <Badge variant="secondary" className={cn("text-xs", className)}>
      {label}
    </Badge>
  );
}
