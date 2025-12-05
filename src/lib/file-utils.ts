import { ReferenceFile } from "./types";

// Text file extensions that can be read as text
const TEXT_EXTENSIONS = [
  '.txt', '.md', '.json', '.js', '.ts', '.tsx', '.jsx', '.css', '.scss',
  '.html', '.xml', '.yaml', '.yml', '.csv', '.py', '.java', '.c', '.cpp',
  '.h', '.hpp', '.rb', '.go', '.rs', '.php', '.sh', '.bash', '.zsh',
  '.sql', '.graphql', '.vue', '.svelte', '.swift', '.kt', '.scala',
  '.conf', '.config', '.ini', '.env', '.gitignore', '.dockerfile',
  '.makefile', '.cmake', '.gradle', '.properties', '.toml', '.lock'
];

/**
 * Check if a file is likely to be a text file based on its extension
 */
export const isTextFile = (filename: string): boolean => {
  const lowerName = filename.toLowerCase();
  return TEXT_EXTENSIONS.some(ext => lowerName.endsWith(ext)) || 
         !lowerName.includes('.'); // Files without extension are often text
};

/**
 * Read file content as text using FileReader API
 */
export const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};

/**
 * Process multiple files and read their contents
 */
export const processFiles = async (
  files: FileList,
  existingPaths: string[]
): Promise<{ paths: string[]; referenceFiles: ReferenceFile[] }> => {
  const newFiles: ReferenceFile[] = [];
  const newPaths: string[] = [];
  
  for (const file of Array.from(files)) {
    const filePath = (file as any).path || file.name;
    
    // Skip if already added
    if (existingPaths.includes(filePath)) continue;
    
    newPaths.push(filePath);
    
    // Only read text files
    if (isTextFile(file.name)) {
      try {
        const content = await readFileContent(file);
        newFiles.push({
          name: file.name,
          path: filePath,
          content: content,
          type: file.type || 'text/plain'
        });
      } catch (err) {
        console.warn(`Could not read file ${file.name}:`, err);
        newFiles.push({
          name: file.name,
          path: filePath,
          content: `[Could not read file: ${file.name}]`,
          type: file.type || 'unknown'
        });
      }
    } else {
      newFiles.push({
        name: file.name,
        path: filePath,
        content: `[Binary file: ${file.name}]`,
        type: file.type || 'binary'
      });
    }
  }
  
  return { paths: newPaths, referenceFiles: newFiles };
};

/**
 * Process files from a folder selection
 */
export const processFolderFiles = async (
  files: FileList,
  existingPaths: string[]
): Promise<{ folderName: string; referenceFiles: ReferenceFile[] }> => {
  const newFiles: ReferenceFile[] = [];
  const addedPaths = new Set<string>();
  
  // Get folder name from first file's relative path
  const firstFile = files[0];
  const folderName = firstFile.webkitRelativePath.split("/")[0];
  
  for (const file of Array.from(files)) {
    const relativePath = file.webkitRelativePath;
    
    // Skip if already processed
    if (addedPaths.has(relativePath)) continue;
    addedPaths.add(relativePath);
    
    // Only read text files
    if (isTextFile(file.name)) {
      try {
        const content = await readFileContent(file);
        newFiles.push({
          name: file.name,
          path: relativePath,
          content: content,
          type: file.type || 'text/plain'
        });
      } catch (err) {
        console.warn(`Could not read file ${file.name}:`, err);
      }
    }
  }
  
  return { folderName, referenceFiles: newFiles };
};
