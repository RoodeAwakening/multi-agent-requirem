import { Job } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
// Use deep imports for better tree-shaking
import { CheckCircle } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { Circle } from "@phosphor-icons/react/dist/csr/Circle";
import { XCircle } from "@phosphor-icons/react/dist/csr/XCircle";
import { Spinner } from "@phosphor-icons/react/dist/csr/Spinner";

interface JobListProps {
  jobs: Job[] | undefined;
  selectedJobId: string | null;
  onSelectJob: (jobId: string) => void;
}

export function JobList({ jobs, selectedJobId, onSelectJob }: JobListProps) {
  if (!jobs || jobs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No tasks yet</p>
        <p className="text-xs mt-1">Create your first task to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {jobs.map((job) => (
        <button
          key={job.id}
          onClick={() => onSelectJob(job.id)}
          className={cn(
            "w-full text-left p-3 rounded-lg transition-colors",
            "hover:bg-background/50",
            selectedJobId === job.id
              ? "bg-background border-2 border-accent"
              : "bg-background/30 border-2 border-transparent"
          )}
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
      ))}
    </div>
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
