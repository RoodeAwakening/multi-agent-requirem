import { ReferenceFile } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { File } from "@phosphor-icons/react/dist/csr/File";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ReferencesPanelProps {
  referenceFiles: ReferenceFile[];
  referenceFolders: string[];
}

export function ReferencesPanel({ referenceFiles, referenceFolders }: ReferencesPanelProps) {
  const [selectedFile, setSelectedFile] = useState<string>(
    referenceFiles?.[0]?.path || ""
  );

  const selectedFileData = referenceFiles?.find((f) => f.path === selectedFile);

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold mb-1">Reference Materials</h3>
        <p className="text-sm text-muted-foreground">
          {referenceFolders.length > 0 && (
            <>
              From: <span className="font-mono">{referenceFolders.join(", ")}</span>
            </>
          )}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {referenceFiles.length} file{referenceFiles.length !== 1 ? "s" : ""} available
        </p>
      </div>

      {referenceFiles.length > 0 ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar with file list - narrower */}
          <div className="w-64 border-r flex flex-col shrink-0">
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {referenceFiles.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file.path)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md transition-colors flex items-start gap-2",
                      selectedFile === file.path
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <File size={16} className="shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{file.path}</p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Right content area - takes remaining space */}
          <div className="flex-1 overflow-auto min-w-0">
            {selectedFileData && (
              <div className="p-6 h-full">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <File size={20} />
                    <h4 className="font-semibold text-base">{selectedFileData.name}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {selectedFileData.path}
                  </p>
                  <Separator className="mt-2" />
                </div>
                <div className="h-[calc(100%-5rem)]">
                  <ScrollArea className="h-full">
                    <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg">
                      {selectedFileData.content}
                    </pre>
                  </ScrollArea>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-muted-foreground text-sm">No reference files available</p>
        </div>
      )}
    </div>
  );
}
