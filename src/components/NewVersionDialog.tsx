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
import { Switch } from "@/components/ui/switch";
import { Job, ReferenceFile } from "@/lib/types";
import { processFiles, processFolderFiles } from "@/lib/file-utils";
// Use deep imports for better tree-shaking
import { FolderOpen } from "@phosphor-icons/react/dist/csr/FolderOpen";
import { File } from "@phosphor-icons/react/dist/csr/File";
import { X } from "@phosphor-icons/react/dist/csr/X";

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
  const [changeReason, setChangeReason] = useState("");
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [referenceFiles, setReferenceFiles] = useState<ReferenceFile[]>([]);
  const [includeOldReferences, setIncludeOldReferences] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsLoading(true);
    try {
      const result = await processFiles(files, selectedPaths);
      setSelectedPaths(prev => [...prev, ...result.paths]);
      setReferenceFiles(prev => [...prev, ...result.referenceFiles]);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsLoading(true);
    try {
      const result = await processFolderFiles(files, selectedPaths);
      
      if (!selectedPaths.includes(result.folderName)) {
        setSelectedPaths(prev => [...prev, result.folderName]);
      }
      
      setReferenceFiles(prev => [...prev, ...result.referenceFiles]);
    } finally {
      setIsLoading(false);
      if (folderInputRef.current) {
        folderInputRef.current.value = "";
      }
    }
  };

  const removePath = (pathToRemove: string) => {
    setSelectedPaths(prev => prev.filter(path => path !== pathToRemove));
    // Also remove associated files
    setReferenceFiles(prev => 
      prev.filter(file => 
        !file.path.startsWith(pathToRemove + "/") && file.path !== pathToRemove
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Smart reference handling: 
    // If includeOldReferences is FALSE (default), only use new files
    // If includeOldReferences is TRUE, include old reference files too
    const combinedReferenceFiles = includeOldReferences
      ? [...(currentJob.referenceFiles || []), ...referenceFiles]
      : referenceFiles; // Only new files

    const combinedReferenceFolders = includeOldReferences
      ? [...currentJob.referenceFolders, ...selectedPaths]
      : selectedPaths; // Only new folders

    // Create a snapshot of the current version before creating a new one
    const currentVersionSnapshot = {
      version: currentJob.version,
      createdAt: currentJob.updatedAt,
      description: currentJob.description,
      // Combine both fields explicitly for clarity in version history
      changeReason: changeReason.trim() 
        ? (additionalDetails.trim() 
            ? `${changeReason.trim()} - ${additionalDetails.trim()}` 
            : changeReason.trim())
        : additionalDetails.trim(),
      status: currentJob.status,
      referenceFolders: currentJob.referenceFolders,
      referenceFiles: currentJob.referenceFiles,
      outputs: currentJob.outputs,
    };

    // Initialize version history if it doesn't exist and add the current version
    const versionHistory = [
      ...(currentJob.versionHistory || []),
      currentVersionSnapshot,
    ];

    const newVersion: Job = {
      ...currentJob,
      version: currentJob.version + 1,
      description: additionalDetails
        ? `${currentJob.description}\n\n--- Version ${currentJob.version + 1} Updates ---\n${additionalDetails}`
        : currentJob.description,
      referenceFolders: combinedReferenceFolders,
      referenceFiles: combinedReferenceFiles,
      updatedAt: new Date().toISOString(),
      status: "new",
      outputs: {}, // Clear outputs - they will be regenerated
      versionHistory,
    };

    onVersionCreated(newVersion);
    onOpenChange(false);

    setAdditionalDetails("");
    setChangeReason("");
    setSelectedPaths([]);
    setReferenceFiles([]);
    setIncludeOldReferences(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <div className="px-6 pt-6">
          <DialogHeader>
            <DialogTitle>Create Version {currentJob.version + 1}</DialogTitle>
            <DialogDescription>
              Add new insights, requirements, or reference materials to re-run the
              agent pipeline with updated information.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-4 pr-4">{/* pr-4 for scrollbar spacing */}
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
              <Label htmlFor="change-reason">
                Reason for Creating New Version (Optional)
              </Label>
              <Textarea
                id="change-reason"
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder="Why are you creating this version? (e.g., 'Client feedback', 'New requirements', 'Bug fixes')"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                This helps track why changes were made across versions
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
                  disabled={isLoading}
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
                  disabled={isLoading}
                >
                  <FolderOpen />
                  Add Folder
                </Button>
                {isLoading && (
                  <span className="text-sm text-muted-foreground animate-pulse">
                    Reading files...
                  </span>
                )}
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
                {...({ webkitdirectory: '' } as any)}
                className="hidden"
                onChange={handleFolderSelect}
              />

              {/* Smart reference handling toggle */}
              {currentJob.referenceFolders.length > 0 && (
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <Label htmlFor="include-old-refs" className="text-sm font-medium">
                        Include previous version's reference files
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {includeOldReferences ? (
                          <>
                            <strong>Enabled:</strong> All old reference files will be included along with new ones.
                            This uses more context but ensures all original materials are available.
                          </>
                        ) : (
                          <>
                            <strong>Disabled (Recommended):</strong> Only new reference files will be used.
                            Previous outputs contain the analysis from old files, saving context.
                          </>
                        )}
                      </p>
                    </div>
                    <Switch
                      id="include-old-refs"
                      checked={includeOldReferences}
                      onCheckedChange={setIncludeOldReferences}
                    />
                  </div>
                </div>
              )}

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

              {referenceFiles.length > 0 && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  ✓ {referenceFiles.length} new file{referenceFiles.length !== 1 ? 's' : ''} loaded with content
                </p>
              )}

              <p className="text-xs text-muted-foreground">
                Optional: Add new files or folders to provide additional context
              </p>
            </div>
            </div>
          </ScrollArea>

          <div className="px-6 pb-6 pt-4">
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
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
