import { useState, useEffect } from "react";
import { Job } from "@/lib/types";
import { JobList } from "./JobList";
import { JobDetail } from "./JobDetail";
import { NewJobDialog } from "./NewJobDialog";
import { SettingsDialog } from "./SettingsDialog";
import { StorageSetupDialog, isStorageSetupComplete } from "./StorageSetupDialog";
import { ReconnectStorageDialog, needsStorageReconnect } from "./ReconnectStorageDialog";
import { Button } from "@/components/ui/button";
import { Plus, Gear } from "@phosphor-icons/react";
import { StorageMode } from "@/lib/filesystem-storage";
import { useJobs } from "@/lib/use-jobs";

export function MainLayout() {
  // Check if storage setup needs to be shown
  const [showStorageSetup, setShowStorageSetup] = useState(false);
  const [showReconnectDialog, setShowReconnectDialog] = useState(false);
  const [storageConfigured, setStorageConfigured] = useState(false);
  
  // Use the new jobs hook for hybrid storage
  const { jobs, storageMode, addJob, updateJob, refreshJobs, setStorageMode } = useJobs();
  
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isNewJobDialogOpen, setIsNewJobDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Check if we need to show storage setup or reconnect dialog on mount
  useEffect(() => {
    const setupComplete = isStorageSetupComplete();
    if (!setupComplete) {
      // First time user - show setup dialog
      setShowStorageSetup(true);
    } else if (needsStorageReconnect()) {
      // Returning user with file system storage - show reconnect dialog
      setShowReconnectDialog(true);
    } else {
      setStorageConfigured(true);
    }
  }, []);

  const selectedJob = jobs?.find((job) => job.id === selectedJobId);

  const handleJobCreated = async (newJob: Job) => {
    await addJob(newJob);
    setSelectedJobId(newJob.id);
  };

  const handleJobUpdated = async (updatedJob: Job) => {
    await updateJob(updatedJob);
  };
  
  const handleStorageSetupComplete = (mode: StorageMode, directoryName?: string) => {
    setStorageMode(mode);
    setShowStorageSetup(false);
    setStorageConfigured(true);
  };
  
  const handleStorageModeChange = (mode: StorageMode) => {
    setStorageMode(mode);
    refreshJobs();
  };
  
  const handleStorageReconnected = () => {
    setShowReconnectDialog(false);
    setStorageConfigured(true);
    setStorageMode("fileSystem");
    refreshJobs();
  };
  
  const handleUseBrowserStorage = () => {
    setShowReconnectDialog(false);
    setStorageConfigured(true);
    setStorageMode("localStorage");
  };

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-80 border-r border-border bg-secondary flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h1 className="text-2xl font-bold tracking-tight mb-2">
                I.A.N.
              </h1>
              <p className="text-sm text-muted-foreground">
                Intelligent Analysis Navigator
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
        onStorageModeChange={handleStorageModeChange}
      />
      
      <StorageSetupDialog
        open={showStorageSetup}
        onComplete={handleStorageSetupComplete}
      />
      
      <ReconnectStorageDialog
        open={showReconnectDialog}
        onReconnected={handleStorageReconnected}
        onUseBrowserStorage={handleUseBrowserStorage}
      />
    </div>
  );
}
