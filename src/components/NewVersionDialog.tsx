import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Job } from "@/lib/types";
import { FolderOpen, File, X } from "@phosphor-icons/react";

interface NewVersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentJob: Job;
  onVersionCreated: (job: Job) => void;
}

export function NewVersionDialog({
  open,
  onOpenChange,
  currentJob,
  onVersionCreated,
}: NewVersionDialogProps) {
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPaths = Array.from(files).map((file) => {
        return (file as any).path || file.name;
      });
      setSelectedPaths((prev) => [...prev, ...newPaths]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const folderPath = (file as any).path || file.webkitRelativePath.split("/")[0];
      if (folderPath && !selectedPaths.includes(folderPath)) {
        setSelectedPaths((prev) => [...prev, folderPath]);
      }
    }
    if (folderInputRef.current) {
      folderInputRef.current.value = "";
    }
  };

  const removePath = (pathToRemove: string) => {
    setSelectedPaths((prev) => prev.filter((path) => path !== pathToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newVersion: Job = {
      ...currentJob,
      version: currentJob.version + 1,
      description: additionalDetails
        ? `${currentJob.description}\n\n--- Version ${currentJob.version + 1} Updates ---\n${additionalDetails}`
        : currentJob.description,
      referenceFolders: [
        ...currentJob.referenceFolders,
        ...selectedPaths,
      ],
      updatedAt: new Date().toISOString(),
      status: "new",
      outputs: {},
    };

    onVersionCreated(newVersion);
    onOpenChange(false);

    setAdditionalDetails("");
    setSelectedPaths([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Version {currentJob.version + 1}</DialogTitle>
          <DialogDescription>
            Add new insights, requirements, or reference materials to re-run the
            agent pipeline with updated information.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="original-description">Original Task</Label>
            <div className="rounded-md border border-input bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                {currentJob.description}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additional-details">
              Additional Details & Updates
            </Label>
            <Textarea
              id="additional-details"
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              placeholder="What has changed? New requirements, feedback, insights, or directions..."
              rows={6}
              required
            />
            <p className="text-xs text-muted-foreground">
              Describe what's new or different for this version
            </p>
          </div>

          <div className="space-y-2">
            <Label>Additional Reference Materials</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <File />
                Add File
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => folderInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <FolderOpen />
                Add Folder
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <input
              ref={folderInputRef}
              type="file"
              className="hidden"
              onChange={handleFolderSelect}
            />

            {currentJob.referenceFolders.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Existing references ({currentJob.referenceFolders.length}):
                </p>
                <ScrollArea className="h-24 rounded-md border border-input bg-muted/50 p-3">
                  <div className="space-y-1">
                    {currentJob.referenceFolders.map((path, index) => (
                      <div key={index} className="text-xs font-mono text-muted-foreground">
                        {path}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {selectedPaths.length > 0 && (
              <ScrollArea className="h-40 rounded-md border border-input bg-background p-3">
                <div className="space-y-2">
                  {selectedPaths.map((path, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-2 rounded-md bg-secondary px-3 py-2"
                    >
                      <span className="text-sm font-mono text-foreground truncate flex-1">
                        {path}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePath(path)}
                        className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            <p className="text-xs text-muted-foreground">
              Optional: Add new files or folders to provide additional context
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Create Version {currentJob.version + 1}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
