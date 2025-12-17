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
import { GradingJob, Requirement, Team } from "@/lib/types";
import { generateJobId } from "@/lib/constants";
import { Plus } from "@phosphor-icons/react/dist/csr/Plus";
import { X } from "@phosphor-icons/react/dist/csr/X";
import { File } from "@phosphor-icons/react/dist/csr/File";
import { processFiles } from "@/lib/file-utils";
import { parseStructuredDocument } from "@/lib/document-parser";
import { toast } from "sonner";

// Default teams from the issue
const DEFAULT_TEAMS: Team[] = [
  { name: "Data Supply Chain (DSC)", description: "Handles data pipeline and supply chain systems" },
  { name: "Apigee", description: "API gateway management and implementation" },
  { name: "Wealth Domain Layer (WDL)", description: "Wealth management domain logic and services" },
  { name: "Online Banking (IBX)", description: "Online banking platform and features" },
  { name: "Salesforce (B2C)", description: "B2C CRM and customer engagement" },
  { name: "Wealth Technology", description: "Wealth management technology solutions" },
  { name: "Mail Systems", description: "Email and messaging systems" },
  { name: "CMOD", description: "CMOD system maintenance and development" },
];

interface NewGradingJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobCreated: (job: GradingJob) => void;
}

export function NewGradingJobDialog({
  open,
  onOpenChange,
  onJobCreated,
}: NewGradingJobDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirementsText, setRequirementsText] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsLoading(true);
    try {
      const result = await processFiles(files, []);
      
      // Combine all file contents as requirements text
      const combinedContent = result.referenceFiles
        .map(f => `# ${f.name}\n\n${f.content}`)
        .join('\n\n---\n\n');
      
      setRequirementsText(prev => 
        prev ? `${prev}\n\n---\n\n${combinedContent}` : combinedContent
      );
      
      toast.success(`Loaded ${result.referenceFiles.length} file(s)`);
    } catch (error) {
      toast.error(`Failed to load files: ${error}`);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const addTeam = () => {
    if (!newTeamName.trim()) {
      toast.error("Team name is required");
      return;
    }
    
    if (teams.some(t => t.name === newTeamName.trim())) {
      toast.error("Team already exists");
      return;
    }

    setTeams([...teams, { 
      name: newTeamName.trim(), 
      description: newTeamDescription.trim() 
    }]);
    setNewTeamName("");
    setNewTeamDescription("");
  };

  const removeTeam = (teamName: string) => {
    setTeams(teams.filter(t => t.name !== teamName));
  };

  const loadDefaultTeams = () => {
    // Merge with existing teams, avoiding duplicates
    const existingNames = new Set(teams.map(t => t.name));
    const newTeams = DEFAULT_TEAMS.filter(t => !existingNames.has(t.name));
    if (newTeams.length > 0) {
      setTeams([...teams, ...newTeams]);
      toast.success(`Added ${newTeams.length} default team(s)`);
    } else {
      toast.info("All default teams are already added");
    }
  };

  const parseRequirements = (text: string): Requirement[] => {
    if (!text.trim()) return [];
    
    // Use the intelligent document parser
    const requirements = parseStructuredDocument(text);
    console.log('[Parse Requirements] Parsed', requirements.length, 'requirement(s)');
    return requirements;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!requirementsText.trim()) {
      toast.error("Requirements are required");
      return;
    }

    const requirements = parseRequirements(requirementsText);
    
    if (requirements.length === 0) {
      toast.error("Could not parse any requirements from the input");
      return;
    }
    
    // Show count of parsed requirements
    console.log('[Submit] Creating grading job with', requirements.length, 'requirement(s)');
    toast.success(`Parsed ${requirements.length} requirement(s) - creating grading job...`);

    const newJob: GradingJob = {
      id: generateJobId(),
      title: title.trim(),
      description: description.trim(),
      requirements,
      teams,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "new",
    };

    onJobCreated(newJob);
    
    // Reset form
    setTitle("");
    setDescription("");
    setRequirementsText("");
    setTeams([]);
    setNewTeamName("");
    setNewTeamDescription("");
    
    onOpenChange(false);
    toast.success(`Created grading job with ${requirements.length} requirements`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>New Requirements Grading Job</DialogTitle>
          <DialogDescription>
            Grade and route project requirements to appropriate teams.
          </DialogDescription>
        </DialogHeader>

        <form id="new-job-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-4">
            <div className="space-y-6 pb-6">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Q1 2024 Requirements Review"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this grading job..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="requirements">Requirements *</Label>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      accept=".txt,.md,.pdf,.docx,.doc,.xlsx,.xls"
                      multiple
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                    >
                      <File className="mr-2" size={16} />
                      Load from File(s)
                    </Button>
                  </div>
                </div>
                <ScrollArea className="h-40 w-full rounded-md border">
                  <Textarea
                    id="requirements"
                    value={requirementsText}
                    onChange={(e) => setRequirementsText(e.target.value)}
                    placeholder="Paste requirements here or load from files. The system will intelligently extract individual requirements from structured documents."
                    className="font-mono text-sm min-h-40 border-0 focus-visible:ring-0"
                    required
                  />
                </ScrollArea>
                <p className="text-xs text-muted-foreground">
                  Tip: For structured documents with sections like "Functional Requirements", the system will automatically extract each requirement. For plain text, separate requirements with "---" or numbered format.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Teams (Optional)</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Add teams that can handle requirements. Graded requirements will be automatically assigned.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={loadDefaultTeams}
                  >
                    Load Default Teams
                  </Button>
                </div>

                <div className="border rounded-lg flex flex-col">
                  <ScrollArea className="max-h-60">
                    <div className="p-4 space-y-2 pr-6 max-h-60">
                      {teams.map((team) => (
                        <div
                          key={team.name}
                          className="flex items-start justify-between p-3 border rounded-lg bg-background"
                        >
                          <div className="flex-1 pr-2">
                            <div className="font-medium">{team.name}</div>
                            {team.description && (
                              <p className="text-sm text-muted-foreground break-words">
                                {team.description}
                              </p>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={() => removeTeam(team.name)}
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="space-y-2 p-4 border-t bg-muted/50">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="teamName" className="text-sm">Team Name</Label>
                        <Input
                          id="teamName"
                          value={newTeamName}
                          onChange={(e) => setNewTeamName(e.target.value)}
                          placeholder="e.g., Data Supply Chain"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addTeam();
                            }
                          }}
                        />
                      </div>
                      <div>
                        <Label htmlFor="teamDesc" className="text-sm">Description</Label>
                        <Input
                          id="teamDesc"
                          value={newTeamDescription}
                          onChange={(e) => setNewTeamDescription(e.target.value)}
                          placeholder="What this team handles..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addTeam();
                            }
                          }}
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={addTeam}
                      className="w-full"
                    >
                      <Plus className="mr-2" size={16} />
                      Add Team
                    </Button>
                  </div>
                </div>
              </div>
            </div>
        </form>
        <DialogFooter className="pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" form="new-job-form" disabled={isLoading}>
              Create Grading Job
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
