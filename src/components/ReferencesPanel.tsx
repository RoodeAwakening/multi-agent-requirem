import { ReferenceFile } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { File } from "@phosphor-icons/react/dist/csr/File";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

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
        <div className="flex-1 overflow-hidden">
          <Tabs
            value={selectedFile}
            onValueChange={setSelectedFile}
            className="h-full flex flex-col"
          >
            <div className="border-b">
              <ScrollArea className="w-full" orientation="horizontal">
                <TabsList className="w-max justify-start rounded-none border-none h-auto p-2 inline-flex">
                  {referenceFiles.map((file) => (
                    <TabsTrigger
                      key={file.path}
                      value={file.path}
                      className="data-[state=active]:border-b-2 data-[state=active]:border-accent whitespace-nowrap"
                    >
                      <File size={14} className="mr-1" />
                      {file.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </ScrollArea>
            </div>

            <div className="flex-1 overflow-auto">
              {referenceFiles.map((file) => (
                <TabsContent
                  key={file.path}
                  value={file.path}
                  className="h-full m-0 p-0"
                >
                  <div className="p-6">
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <File size={20} />
                        <h4 className="font-semibold text-base">{file.name}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {file.path}
                      </p>
                      <Separator className="mt-2" />
                    </div>
                    <ScrollArea className="h-[calc(100vh-16rem)]">
                      <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg">
                        {file.content}
                      </pre>
                    </ScrollArea>
                  </div>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-muted-foreground text-sm">No reference files available</p>
        </div>
      )}
    </div>
  );
}
