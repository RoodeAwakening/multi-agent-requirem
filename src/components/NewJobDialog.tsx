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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Job } from "@/lib/types";
import { generateJobId } from "@/lib/constants";
import { FolderOpen, File, X } from "@phosphor-icons/react";

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

    const newJob: Job = {
      id: generateJobId(),
      title,
      description,
      referenceFolders: selectedPaths,
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
