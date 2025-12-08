/**
 * Reconnect Storage Dialog
 * 
 * Prompts returning users to reconnect their previously selected storage folder.
 * This is shown when the user previously configured file system storage but
 * the directory handle is not connected (new browser session).
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
import {
  selectStorageDirectory,
  getStoredDirectoryName,
  clearStorageConfig,
  isFileSystemStorageConfigured,
  getCachedDirectoryHandle,
} from "@/lib/filesystem-storage";
import { toast } from "sonner";
// Use deep imports for better tree-shaking
import { FolderOpen } from "@phosphor-icons/react/dist/csr/FolderOpen";
import { ArrowsClockwise } from "@phosphor-icons/react/dist/csr/ArrowsClockwise";
import { Browser } from "@phosphor-icons/react/dist/csr/Browser";
import { Info } from "@phosphor-icons/react/dist/csr/Info";

interface ReconnectStorageDialogProps {
  open: boolean;
  onReconnected: () => void;
  onUseBrowserStorage: () => void;
}

/**
 * Check if we need to show the reconnect dialog
 * Returns true if:
 * - File system storage was previously configured
 * - But directory handle is not currently connected
 */
export function needsStorageReconnect(): boolean {
  return isFileSystemStorageConfigured() && !getCachedDirectoryHandle();
}

export function ReconnectStorageDialog({ 
  open, 
  onReconnected,
  onUseBrowserStorage 
}: ReconnectStorageDialogProps) {
  const [isReconnecting, setIsReconnecting] = useState(false);
  const storedDirectoryName = getStoredDirectoryName();

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      const handle = await selectStorageDirectory();
      if (handle) {
        toast.success(`Reconnected to: ${handle.name}`);
        onReconnected();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to reconnect: ${errorMessage}`);
    } finally {
      setIsReconnecting(false);
    }
  };

  const handleUseBrowserStorage = () => {
    const confirmed = window.confirm(
      "Switching to browser storage will make your previously saved file system tasks inaccessible. Are you sure you want to continue?"
    );
    if (!confirmed) return;
    clearStorageConfig();
    toast.info("Switched to browser storage. File system tasks won't be loaded.");
    onUseBrowserStorage();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px]" hideCloseButton>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-accent/10">
              <ArrowsClockwise size={24} className="text-accent" />
            </div>
            <div>
              <DialogTitle className="text-xl">Reconnect Your Storage</DialogTitle>
              <DialogDescription>
                Your tasks are saved on your computer
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-3">
              <Info size={20} className="text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm">
                  You previously saved your tasks to a folder on your computer
                  {storedDirectoryName && (
                    <> called <code className="bg-background px-1.5 py-0.5 rounded text-xs font-mono">{storedDirectoryName}</code></>
                  )}.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  For security, browsers require you to re-select the folder each session to access your files.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleReconnect}
              disabled={isReconnecting}
              className="w-full justify-start h-auto py-4"
              size="lg"
            >
              <FolderOpen size={20} className="mr-3" />
              <div className="text-left">
                <div className="font-medium">
                  {isReconnecting ? "Selecting folder..." : "Select Your Folder"}
                </div>
                <div className="text-xs text-primary-foreground/70 mt-0.5">
                  Choose the same folder to load your existing tasks
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={handleUseBrowserStorage}
              className="w-full justify-start h-auto py-4"
              size="lg"
            >
              <Browser size={20} className="mr-3" />
              <div className="text-left">
                <div className="font-medium">Use Browser Storage Instead</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Start fresh with browser storage (won't load previous tasks)
                </div>
              </div>
            </Button>
          </div>
        </div>

        <DialogFooter>
          <p className="text-xs text-muted-foreground text-center w-full">
            💡 Tip: Select the same folder you used before to see your existing tasks
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
