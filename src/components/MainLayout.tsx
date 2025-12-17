import { useState, useEffect } from "react";
import { Job, GradingJob } from "@/lib/types";
import { JobList } from "./JobList";
import { JobDetail } from "./JobDetail";
import { NewJobDialog } from "./NewJobDialog";
import { NewGradingJobDialog } from "./NewGradingJobDialog";
import { GradingJobList } from "./GradingJobList";
import { GradingJobDetail } from "./GradingJobDetail";
import { SettingsDialog } from "./SettingsDialog";
import { StorageSetupDialog, isStorageSetupComplete } from "./StorageSetupDialog";
import { ReconnectStorageDialog, needsStorageReconnect } from "./ReconnectStorageDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
// Use deep imports for better tree-shaking (reduces bundle size by ~750KB)
import { Plus } from "@phosphor-icons/react/dist/csr/Plus";
import { Gear } from "@phosphor-icons/react/dist/csr/Gear";
import { Warning } from "@phosphor-icons/react/dist/csr/Warning";
import { StorageMode } from "@/lib/filesystem-storage";
import { useJobs } from "@/lib/use-jobs";
import { useGradingJobs } from "@/lib/use-grading-jobs";

export function MainLayout() {
  // Check if storage setup needs to be shown
  const [showStorageSetup, setShowStorageSetup] = useState(false);
  const [showReconnectDialog, setShowReconnectDialog] = useState(false);
  
  // Use the new jobs hook for hybrid storage
  const { jobs, fileSystemError, addJob, updateJob, deleteJob, refreshJobs, setStorageMode, clearFileSystemError } = useJobs();
  
  // Use grading jobs hook
  const { gradingJobs, addGradingJob, updateGradingJob, deleteGradingJob } = useGradingJobs();
  
  const [activeTab, setActiveTab] = useState<"analysis" | "grading">("analysis");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedGradingJobId, setSelectedGradingJobId] = useState<string | null>(null);
  const [isNewJobDialogOpen, setIsNewJobDialogOpen] = useState(false);
  const [isNewGradingJobDialogOpen, setIsNewGradingJobDialogOpen] = useState(false);
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
    }
  }, []);

  const selectedJob = jobs?.find((job) => job.id === selectedJobId);
  const selectedGradingJob = gradingJobs?.find((job) => job.id === selectedGradingJobId);

  const handleJobCreated = async (newJob: Job) => {
    await addJob(newJob);
    setSelectedJobId(newJob.id);
    setActiveTab("analysis");
  };

  const handleJobUpdated = async (updatedJob: Job) => {
    await updateJob(updatedJob);
  };
  
  const handleJobDeleted = async (jobId: string) => {
    await deleteJob(jobId);
    // If the deleted job was selected, clear selection
    if (selectedJobId === jobId) {
      setSelectedJobId(null);
    }
  };

  const handleGradingJobCreated = async (newJob: GradingJob) => {
    await addGradingJob(newJob);
    setSelectedGradingJobId(newJob.id);
    setActiveTab("grading");
  };

  const handleGradingJobUpdated = async (updatedJob: GradingJob) => {
    await updateGradingJob(updatedJob);
  };

  const handleGradingJobDeleted = async (jobId: string) => {
    await deleteGradingJob(jobId);
    if (selectedGradingJobId === jobId) {
      setSelectedGradingJobId(null);
    }
  };
  
  const handleStorageSetupComplete = (mode: StorageMode) => {
    setStorageMode(mode);
    setShowStorageSetup(false);
  };
  
  const handleStorageModeChange = (mode: StorageMode) => {
    setStorageMode(mode);
    refreshJobs();
  };
  
  const handleDemoCreated = async (demoJob: Job) => {
    // Add the demo job using the proper storage mechanism
    await addJob(demoJob);
    // Select the demo job so user can see it immediately
    setSelectedJobId(demoJob.id);
  };
  
  const handleStorageReconnected = () => {
    setShowReconnectDialog(false);
    setStorageMode("fileSystem");
    refreshJobs();
  };
  
  const handleUseBrowserStorage = () => {
    setShowReconnectDialog(false);
    setStorageMode("localStorage");
  };
  
  const handleFileSystemErrorDismiss = () => {
    clearFileSystemError();
  };
  
  const handleFileSystemErrorOpenSettings = () => {
    clearFileSystemError();
    setIsSettingsOpen(true);
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
          
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "analysis" | "grading")} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="grading">Grading</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {activeTab === "analysis" ? (
            <JobList
              jobs={jobs}
              selectedJobId={selectedJobId}
              onSelectJob={(id) => {
                setSelectedJobId(id);
                setSelectedGradingJobId(null);
              }}
              onDeleteJob={handleJobDeleted}
            />
          ) : (
            <GradingJobList
              jobs={gradingJobs}
              selectedJobId={selectedGradingJobId}
              onSelectJob={(id) => {
                setSelectedGradingJobId(id);
                setSelectedJobId(null);
              }}
              onDeleteJob={handleGradingJobDeleted}
            />
          )}
        </div>

        <div className="p-4 border-t border-border">
          {activeTab === "analysis" ? (
            <Button
              onClick={() => setIsNewJobDialogOpen(true)}
              className="w-full"
              size="lg"
            >
              <Plus className="mr-2" />
              New Analysis Task
            </Button>
          ) : (
            <Button
              onClick={() => setIsNewGradingJobDialogOpen(true)}
              className="w-full"
              size="lg"
            >
              <Plus className="mr-2" />
              New Grading Task
            </Button>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {activeTab === "analysis" ? (
          selectedJob ? (
            <JobDetail job={selectedJob} onJobUpdated={handleJobUpdated} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">
                  No analysis task selected
                </h2>
                <p className="text-muted-foreground mb-6">
                  Create a new analysis task or select one from the list
                </p>
                <Button onClick={() => setIsNewJobDialogOpen(true)} size="lg">
                  <Plus className="mr-2" />
                  Create Your First Analysis Task
                </Button>
              </div>
            </div>
          )
        ) : (
          selectedGradingJob ? (
            <GradingJobDetail job={selectedGradingJob} onJobUpdated={handleGradingJobUpdated} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">
                  No grading task selected
                </h2>
                <p className="text-muted-foreground mb-6">
                  Create a new grading task or select one from the list
                </p>
                <Button onClick={() => setIsNewGradingJobDialogOpen(true)} size="lg">
                  <Plus className="mr-2" />
                  Create Your First Grading Task
                </Button>
              </div>
            </div>
          )
        )}
      </main>

      <NewJobDialog
        open={isNewJobDialogOpen}
        onOpenChange={setIsNewJobDialogOpen}
        onJobCreated={handleJobCreated}
      />

      <NewGradingJobDialog
        open={isNewGradingJobDialogOpen}
        onOpenChange={setIsNewGradingJobDialogOpen}
        onJobCreated={handleGradingJobCreated}
      />

      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        onStorageModeChange={handleStorageModeChange}
        onDemoCreated={handleDemoCreated}
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
      
      {/* File System Error Warning Dialog */}
      <AlertDialog open={!!fileSystemError} onOpenChange={(open) => !open && handleFileSystemErrorDismiss()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Warning size={20} className="text-amber-500" />
              File System Storage Issue
            </AlertDialogTitle>
            <AlertDialogDescription>
              {fileSystemError}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleFileSystemErrorDismiss}>
              Continue with Browser Storage
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleFileSystemErrorOpenSettings}>
              Open Settings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
