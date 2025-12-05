import { useState } from "react";
import { useStoredValue } from "@/lib/storage";
import { Job } from "@/lib/types";
import { JobList } from "./JobList";
import { JobDetail } from "./JobDetail";
import { NewJobDialog } from "./NewJobDialog";
import { SettingsDialog } from "./SettingsDialog";
import { Button } from "@/components/ui/button";
import { Plus, Gear } from "@phosphor-icons/react";

export function MainLayout() {
  const [jobs, setJobs] = useStoredValue<Job[]>("jobs", []);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isNewJobDialogOpen, setIsNewJobDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const selectedJob = jobs?.find((job) => job.id === selectedJobId);

  const handleJobCreated = (newJob: Job) => {
    setJobs((current) => [newJob, ...(current || [])]);
    setSelectedJobId(newJob.id);
  };

  const handleJobUpdated = (updatedJob: Job) => {
    setJobs((current) =>
      (current || []).map((job) => (job.id === updatedJob.id ? updatedJob : job))
    );
  };

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-80 border-r border-border bg-secondary flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h1 className="text-2xl font-bold tracking-tight mb-2">
                Agent Pipeline
              </h1>
              <p className="text-sm text-muted-foreground">
                Multi-agent task orchestration
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSettingsOpen(true)}
              className="shrink-0"
            >
              <Gear size={20} />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <JobList
            jobs={jobs}
            selectedJobId={selectedJobId}
            onSelectJob={setSelectedJobId}
          />
        </div>

        <div className="p-4 border-t border-border">
          <Button
            onClick={() => setIsNewJobDialogOpen(true)}
            className="w-full"
            size="lg"
          >
            <Plus className="mr-2" />
            New Task
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {selectedJob ? (
          <JobDetail job={selectedJob} onJobUpdated={handleJobUpdated} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">
                No task selected
              </h2>
              <p className="text-muted-foreground mb-6">
                Create a new task or select one from the list
              </p>
              <Button onClick={() => setIsNewJobDialogOpen(true)} size="lg">
                <Plus className="mr-2" />
                Create Your First Task
              </Button>
            </div>
          </div>
        )}
      </main>

      <NewJobDialog
        open={isNewJobDialogOpen}
        onOpenChange={setIsNewJobDialogOpen}
        onJobCreated={handleJobCreated}
      />

      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </div>
  );
}
