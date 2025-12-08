/**
 * Storage Setup Dialog
 * 
 * Prompts users to choose their storage location before running their first job.
 * This helps prevent performance issues by encouraging file system storage from the start.
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  isFileSystemAccessSupported,
  selectStorageDirectory,
  StorageMode,
} from "@/lib/filesystem-storage";
import { setStoredValue } from "@/lib/storage";
import { toast } from "sonner";
// Use deep imports for better tree-shaking
import { FolderOpen } from "@phosphor-icons/react/dist/csr/FolderOpen";
import { HardDrives } from "@phosphor-icons/react/dist/csr/HardDrives";
import { Browser } from "@phosphor-icons/react/dist/csr/Browser";
import { Warning } from "@phosphor-icons/react/dist/csr/Warning";
import { Rocket } from "@phosphor-icons/react/dist/csr/Rocket";
import { CheckCircle } from "@phosphor-icons/react/dist/csr/CheckCircle";

interface StorageSetupDialogProps {
  open: boolean;
  onComplete: (mode: StorageMode, directoryName?: string) => void;
}

const STORAGE_SETUP_COMPLETE_KEY = "storage-setup-complete";

/**
 * Check if storage setup has been completed
 */
export function isStorageSetupComplete(): boolean {
  try {
    const value = localStorage.getItem(`multi-agent-pipeline:${STORAGE_SETUP_COMPLETE_KEY}`);
    return value === "true";
  } catch {
    return false;
  }
}

/**
 * Mark storage setup as complete
 */
export function markStorageSetupComplete(): void {
  try {
    localStorage.setItem(`multi-agent-pipeline:${STORAGE_SETUP_COMPLETE_KEY}`, "true");
  } catch {
    // Ignore errors
  }
}

export function StorageSetupDialog({ open, onComplete }: StorageSetupDialogProps) {
  const [selectedMode, setSelectedMode] = useState<StorageMode | null>(null);
  const [isSelectingDirectory, setIsSelectingDirectory] = useState(false);
  const [directoryName, setDirectoryName] = useState<string | null>(null);
  
  const fsSupported = isFileSystemAccessSupported();

  const handleSelectDirectory = async () => {
    setIsSelectingDirectory(true);
    try {
      const handle = await selectStorageDirectory();
      if (handle) {
        setDirectoryName(handle.name);
        setSelectedMode("fileSystem");
        toast.success(`Storage directory set to: ${handle.name}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to select directory: ${errorMessage}`);
    } finally {
      setIsSelectingDirectory(false);
    }
  };

  const handleContinue = () => {
    const mode = selectedMode || "localStorage";
    markStorageSetupComplete();
    onComplete(mode, directoryName || undefined);
  };

  const handleSkip = () => {
    markStorageSetupComplete();
    onComplete("localStorage");
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px]" hideCloseButton>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-accent/10">
              <Rocket size={24} className="text-accent" />
            </div>
            <div>
              <DialogTitle className="text-xl">Welcome to I.A.N.</DialogTitle>
              <DialogDescription>
                Let's set up where to store your analysis tasks
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose where to save your tasks and generated analysis documents. 
            This affects performance when you have many tasks.
          </p>

          <div className="space-y-3">
            {/* File System Option - Recommended */}
            <div
              className={`p-4 border-2 rounded-lg transition-colors ${
                fsSupported
                  ? `cursor-pointer ${
                      selectedMode === "fileSystem"
                        ? "border-accent bg-accent/5"
                        : "border-border hover:border-accent/50"
                    }`
                  : "border-border opacity-60"
              }`}
              onClick={() => {
                if (fsSupported && !directoryName) {
                  handleSelectDirectory();
                } else if (fsSupported) {
                  setSelectedMode("fileSystem");
                }
              }}
            >
              <div className="flex items-start gap-3">
                <HardDrives size={24} className="text-accent mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">Save to Your Computer</h4>
                    <Badge className="bg-accent/20 text-accent border-0 text-xs">
                      Recommended
                    </Badge>
                    {selectedMode === "fileSystem" && directoryName && (
                      <CheckCircle size={18} className="text-green-600" weight="fill" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Store tasks in a folder on your computer. Best for many tasks,
                    no size limits, and you can access files directly.
                  </p>
                  {!fsSupported && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                      <Warning size={14} />
                      Not supported in this browser. Try Chrome, Edge, or Opera.
                    </p>
                  )}
                  {directoryName && (
                    <div className="mt-3 p-2 bg-background rounded flex items-center gap-2">
                      <FolderOpen size={16} className="text-muted-foreground" />
                      <code className="text-sm">{directoryName}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectDirectory();
                        }}
                        disabled={isSelectingDirectory}
                      >
                        Change
                      </Button>
                    </div>
                  )}
                  {fsSupported && !directoryName && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectDirectory();
                      }}
                      disabled={isSelectingDirectory}
                    >
                      <FolderOpen className="mr-2" size={16} />
                      {isSelectingDirectory ? "Selecting..." : "Choose Folder"}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Browser Storage Option */}
            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedMode === "localStorage"
                  ? "border-accent bg-accent/5"
                  : "border-border hover:border-accent/50"
              }`}
              onClick={() => setSelectedMode("localStorage")}
            >
              <div className="flex items-start gap-3">
                <Browser size={24} className="text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">Browser Storage</h4>
                    {selectedMode === "localStorage" && (
                      <CheckCircle size={18} className="text-green-600" weight="fill" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Store in your browser. Simple setup, but limited to ~5-10MB and may
                    slow down with 20+ tasks.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              💡 You can change this later in Settings → Data Storage
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="sm:mr-auto"
          >
            Skip for now
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!selectedMode}
          >
            {selectedMode === "fileSystem" && directoryName
              ? "Start with File Storage"
              : selectedMode === "localStorage"
              ? "Start with Browser Storage"
              : "Select a storage option"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
