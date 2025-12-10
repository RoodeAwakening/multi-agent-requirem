import { useState } from "react";
import { Job, VersionSnapshot } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
// Use deep imports for better tree-shaking
import { Clock } from "@phosphor-icons/react/dist/csr/Clock";
import { GitDiff } from "@phosphor-icons/react/dist/csr/GitDiff";
import { ArrowRight } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { Trash } from "@phosphor-icons/react/dist/csr/Trash";

interface VersionHistoryPanelProps {
  job: Job;
  onVersionSelect: (version: number) => void;
  currentlyViewingVersion?: number;
  onVersionDelete?: (versionNumber: number) => void;
}

export function VersionHistoryPanel({
  job,
  onVersionSelect,
  currentlyViewingVersion,
  onVersionDelete,
}: VersionHistoryPanelProps) {
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [compareVersions, setCompareVersions] = useState<{
    from: number;
    to: number;
  } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [versionToDelete, setVersionToDelete] = useState<number | null>(null);

  const allVersions: VersionSnapshot[] = [
    ...(job.versionHistory || []),
    {
      version: job.version,
      createdAt: job.updatedAt,
      description: job.description,
      status: job.status,
      referenceFolders: job.referenceFolders,
      referenceFiles: job.referenceFiles,
      outputs: job.outputs,
      changeReason: job.changeReason,
      changelog: job.changelog,
    },
  ];

  // Sort versions in descending order (newest first)
  const sortedVersions = [...allVersions].sort((a, b) => b.version - a.version);

  const handleCompareClick = (fromVersion: number, toVersion: number) => {
    setCompareVersions({ from: fromVersion, to: toVersion });
    setCompareDialogOpen(true);
  };

  const handleDeleteClick = (versionNumber: number) => {
    setVersionToDelete(versionNumber);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (versionToDelete && onVersionDelete) {
      onVersionDelete(versionToDelete);
      toast.success(`Version ${versionToDelete} deleted successfully`);
    }
    setDeleteDialogOpen(false);
    setVersionToDelete(null);
  };

  const getVersionData = (version: number): VersionSnapshot | undefined => {
    return allVersions.find((v) => v.version === version);
  };

  return (
    <>
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2">
            <Clock size={20} />
            Version History
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {allVersions.length} version{allVersions.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {sortedVersions.map((version, index) => {
              const isCurrentVersion = version.version === job.version;
              const isViewing =
                currentlyViewingVersion !== undefined &&
                version.version === currentlyViewingVersion;
              const previousVersion = sortedVersions[index + 1];

              return (
                <div
                  key={version.version}
                  className={cn(
                    "rounded-lg border p-3 transition-colors",
                    isViewing
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-accent/50"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={isCurrentVersion ? "default" : "secondary"}
                      >
                        v{version.version}
                      </Badge>
                      {isCurrentVersion && (
                        <Badge variant="outline" className="text-xs">
                          Current
                        </Badge>
                      )}
                      {isViewing && (
                        <Badge variant="outline" className="text-xs">
                          Viewing
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(version.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Show changeReason as the main title if available */}
                  {version.changeReason && (
                    <div className="mb-2">
                      <p className="text-sm font-bold text-foreground">
                        {version.changeReason}
                      </p>
                    </div>
                  )}

                  {version.changelog && (
                    <div className="mb-2">
                      <details className="text-xs">
                        <summary className="cursor-pointer text-accent hover:text-accent/80 font-medium">
                          What's Changed
                        </summary>
                        <div className="mt-2 pl-2 text-muted-foreground whitespace-pre-wrap">
                          {(() => {
                            const lines = version.changelog.split('\n');
                            const preview = lines.slice(0, 5).join('\n');
                            return preview + (lines.length > 5 ? '...' : '');
                          })()}
                        </div>
                      </details>
                    </div>
                  )}

                  {/* Show description as secondary text, truncated */}
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {version.description}
                  </p>

                  <div className="flex items-center gap-2">
                    {!isViewing && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onVersionSelect(version.version)}
                        className="text-xs h-7"
                      >
                        View
                      </Button>
                    )}
                    {previousVersion && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleCompareClick(
                            previousVersion.version,
                            version.version
                          )
                        }
                        className="text-xs h-7"
                      >
                        <GitDiff size={14} className="mr-1" />
                        Compare
                      </Button>
                    )}
                    {/* Allow deleting any version if there are more than 1 version */}
                    {allVersions.length > 1 && onVersionDelete && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteClick(version.version)}
                        className="text-xs h-7 ml-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Delete this version"
                      >
                        <Trash size={14} />
                      </Button>
                    )}
                  </div>

                  {version.status && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <Badge
                        variant="secondary"
                        className="text-xs"
                      >
                        {version.status}
                      </Badge>
                    </div>
                  )}
                </div>
              );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Comparison Dialog */}
      <Dialog open={compareDialogOpen} onOpenChange={setCompareDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitDiff size={24} />
              Version Comparison
            </DialogTitle>
            <DialogDescription>
              {compareVersions && (
                <>
                  Comparing version {compareVersions.from} <ArrowRight className="inline" /> version{" "}
                  {compareVersions.to}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {compareVersions && (
            <VersionComparisonView
              fromVersion={getVersionData(compareVersions.from)}
              toVersion={getVersionData(compareVersions.to)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Version Dialog */}
      <DeleteVersionDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        versionNumber={versionToDelete}
        isCurrentVersion={versionToDelete === job.version}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}

interface VersionComparisonViewProps {
  fromVersion?: VersionSnapshot;
  toVersion?: VersionSnapshot;
}

function VersionComparisonView({
  fromVersion,
  toVersion,
}: VersionComparisonViewProps) {
  if (!fromVersion || !toVersion) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Unable to compare versions
      </div>
    );
  }

  // Helper function to check if two arrays have the same elements
  const arraysEqual = (a: string[], b: string[]): boolean => {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, idx) => val === sortedB[idx]);
  };

  const descriptionChanged =
    fromVersion.description !== toVersion.description;
  const referencesChanged = !arraysEqual(
    fromVersion.referenceFolders,
    toVersion.referenceFolders
  );
  const outputsChanged = !arraysEqual(
    Object.keys(fromVersion.outputs),
    Object.keys(toVersion.outputs)
  );

  const newReferences = toVersion.referenceFolders.filter(
    (ref) => !fromVersion.referenceFolders.includes(ref)
  );
  const removedReferences = fromVersion.referenceFolders.filter(
    (ref) => !toVersion.referenceFolders.includes(ref)
  );

  const newOutputs = Object.keys(toVersion.outputs).filter(
    (key) => !fromVersion.outputs[key]
  );
  const removedOutputs = Object.keys(fromVersion.outputs).filter(
    (key) => !toVersion.outputs[key]
  );

  return (
    <ScrollArea className="max-h-[60vh]">
      <div className="space-y-4">
        {/* Changelog Section */}
        {toVersion.changelog && (
          <div className="rounded-lg border border-accent/50 bg-accent/5 p-4">
            <h4 className="font-semibold text-sm mb-2">What's Changed</h4>
            <div className="text-sm text-muted-foreground prose prose-sm max-w-none whitespace-pre-wrap">
              {toVersion.changelog}
            </div>
          </div>
        )}

        {/* Change Reason */}
        {toVersion.changeReason && (
          <div className="rounded-lg border border-accent/50 bg-accent/5 p-4">
            <h4 className="font-semibold text-sm mb-2">Reason for Change</h4>
            <p className="text-sm text-muted-foreground">
              {toVersion.changeReason}
            </p>
          </div>
        )}

        {/* Description Changes */}
        {descriptionChanged && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Description Changes</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border p-3">
                <Badge variant="secondary" className="mb-2 text-xs">
                  v{fromVersion.version}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {fromVersion.description}
                </p>
              </div>
              <div className="rounded-lg border border-accent bg-accent/5 p-3">
                <Badge variant="default" className="mb-2 text-xs">
                  v{toVersion.version}
                </Badge>
                <p className="text-xs text-foreground">{toVersion.description}</p>
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Reference Changes */}
        {referencesChanged && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Reference Materials</h4>
            {newReferences.length > 0 && (
              <div className="mb-2">
                <Badge variant="default" className="mb-1 text-xs bg-green-600">
                  + {newReferences.length} Added
                </Badge>
                <ul className="space-y-1">
                  {newReferences.map((ref, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-green-600 dark:text-green-400 font-mono"
                    >
                      + {ref}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {removedReferences.length > 0 && (
              <div>
                <Badge
                  variant="destructive"
                  className="mb-1 text-xs"
                >
                  - {removedReferences.length} Removed
                </Badge>
                <ul className="space-y-1">
                  {removedReferences.map((ref, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-destructive font-mono"
                    >
                      - {ref}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Output Changes */}
        {outputsChanged && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Outputs Generated</h4>
            {newOutputs.length > 0 && (
              <div className="mb-2">
                <Badge variant="default" className="mb-1 text-xs bg-green-600">
                  + {newOutputs.length} New
                </Badge>
                <ul className="space-y-1">
                  {newOutputs.map((output, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-green-600 dark:text-green-400 font-mono"
                    >
                      + {output}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {removedOutputs.length > 0 && (
              <div>
                <Badge
                  variant="destructive"
                  className="mb-1 text-xs"
                >
                  - {removedOutputs.length} Removed
                </Badge>
                <ul className="space-y-1">
                  {removedOutputs.map((output, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-destructive font-mono"
                    >
                      - {output}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Status Change */}
        {fromVersion.status !== toVersion.status && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold text-sm mb-2">Status Change</h4>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{fromVersion.status}</Badge>
                <ArrowRight size={16} />
                <Badge variant="default">{toVersion.status}</Badge>
              </div>
            </div>
          </>
        )}

        {!descriptionChanged &&
          !referencesChanged &&
          !outputsChanged &&
          fromVersion.status === toVersion.status && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No significant changes detected</p>
            </div>
          )}
      </div>
    </ScrollArea>
  );
}

// Delete Version Confirmation Dialog Component
function DeleteVersionDialog({
  open,
  onOpenChange,
  versionNumber,
  isCurrentVersion,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versionNumber: number | null;
  isCurrentVersion: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Version {versionNumber}?</AlertDialogTitle>
          <AlertDialogDescription>
            {isCurrentVersion ? (
              <>
                Are you sure you want to delete the current version {versionNumber}? This action cannot be undone.
                The most recent version from history will become the new current version.
              </>
            ) : (
              <>
                Are you sure you want to delete version {versionNumber}? This action cannot be undone.
                The version will be permanently removed from history.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive hover:bg-destructive/90">
            Delete Version
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
