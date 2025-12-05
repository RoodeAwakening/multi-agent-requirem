import { useState } from "react";
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
import { Job } from "@/lib/types";
import { generateJobId } from "@/lib/constants";

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
  const [references, setReferences] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newJob: Job = {
      id: generateJobId(),
      title,
      description,
      referenceFolders: references
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0),
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
    setReferences("");
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
            <Label htmlFor="references">
              Reference Materials (one path or description per line)
            </Label>
            <Textarea
              id="references"
              value={references}
              onChange={(e) => setReferences(e.target.value)}
              placeholder="e.g.,
Design doc: /docs/tier-selector-spec.md
User research: /research/tier-interviews.pdf
Current implementation: /src/components/TierSelector"
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              Optional: Provide paths, URLs, or descriptions of reference
              materials
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
