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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Job, ReferenceFile } from "@/lib/types";
import { generateJobId } from "@/lib/constants";
import { processFiles, processFolderFiles } from "@/lib/file-utils";
// Use deep imports for better tree-shaking
import { FolderOpen } from "@phosphor-icons/react/dist/csr/FolderOpen";
import { File } from "@phosphor-icons/react/dist/csr/File";
import { X } from "@phosphor-icons/react/dist/csr/X";

interface NewJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobCreated: (job: Job) => void;
}

export function NewJobDialog({
  open,
  onOpenChange,
  onJobCreated,
}: NewJobDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [referenceFiles, setReferenceFiles] = useState<ReferenceFile[]>([]);
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

    const newJob: Job = {
      id: generateJobId(),
      title,
      description,
      referenceFolders: selectedPaths,
      referenceFiles: referenceFiles,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "new",
      version: 1,
      outputs: {},
    };

    onJobCreated(newJob);
    onOpenChange(false);

    setTitle("");
    setDescription("");
    setSelectedPaths([]);
    setReferenceFiles([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Define your task and provide reference materials for the agent
            pipeline to analyze.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Mobile Tier Selector Redesign"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what needs to be analyzed and built..."
              rows={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Reference Materials</Label>
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
              accept=".txt,.md,.json,.js,.ts,.tsx,.jsx,.css,.scss,.html,.xml,.yaml,.yml,.csv,.py,.java,.c,.cpp,.h,.hpp,.rb,.go,.rs,.php,.sh,.bash,.zsh,.sql,.graphql,.vue,.svelte,.swift,.kt,.scala,.conf,.config,.ini,.env,.pdf,.docx"
              className="hidden"
              onChange={handleFileSelect}
            />
            <input
              ref={folderInputRef}
              type="file"
              // @ts-expect-error - webkitdirectory is a valid HTML attribute for folder selection
              webkitdirectory=""
              multiple
              className="hidden"
              onChange={handleFolderSelect}
            />

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
                ✓ {referenceFiles.length} file{referenceFiles.length !== 1 ? 's' : ''} loaded with content
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              Optional: Add files or folders to provide context for the analysis
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
            <Button type="submit">Create Task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
