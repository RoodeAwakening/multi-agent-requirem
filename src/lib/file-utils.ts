import { ReferenceFile } from "./types";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Text file extensions that can be read as text
const TEXT_EXTENSIONS = [
  '.txt', '.md', '.json', '.js', '.ts', '.tsx', '.jsx', '.css', '.scss',
  '.html', '.xml', '.yaml', '.yml', '.csv', '.py', '.java', '.c', '.cpp',
  '.h', '.hpp', '.rb', '.go', '.rs', '.php', '.sh', '.bash', '.zsh',
  '.sql', '.graphql', '.vue', '.svelte', '.swift', '.kt', '.scala',
  '.conf', '.config', '.ini', '.env', '.gitignore', '.dockerfile',
  '.makefile', '.cmake', '.gradle', '.properties', '.toml', '.lock'
];

// Document file extensions that require special processing
const DOCUMENT_EXTENSIONS = ['.pdf', '.docx'];

/**
 * Check if a file is likely to be a text file based on its extension
 */
export const isTextFile = (filename: string): boolean => {
  const lowerName = filename.toLowerCase();
  return TEXT_EXTENSIONS.some(ext => lowerName.endsWith(ext)) || 
         !lowerName.includes('.'); // Files without extension are often text
};

/**
 * Check if a file is a document that requires special processing (PDF, DOCX)
 */
export const isDocumentFile = (filename: string): boolean => {
  const lowerName = filename.toLowerCase();
  return DOCUMENT_EXTENSIONS.some(ext => lowerName.endsWith(ext));
};

/**
 * Check if a file is processable (text, PDF, or DOCX)
 */
export const isProcessableFile = (filename: string): boolean => {
  return isTextFile(filename) || isDocumentFile(filename);
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
 * Extract text content from a PDF file
 */
export const extractPdfText = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const textParts: string[] = [];

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      textParts.push(`--- Page ${pageNum} ---\n${pageText}`);
    }

    return textParts.join('\n\n');
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw new Error(`Failed to extract text from PDF: ${error}`);
  }
};

/**
 * Extract text content from a DOCX file
 */
export const extractDocxText = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    if (result.messages.length > 0) {
      console.warn('DOCX extraction warnings:', result.messages);
    }
    
    return result.value || '';
  } catch (error) {
    console.error('Error extracting DOCX text:', error);
    throw new Error(`Failed to extract text from DOCX: ${error}`);
  }
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
    
    // Process based on file type
    if (isDocumentFile(file.name)) {
      // Handle PDF and DOCX files
      try {
        let content: string;
        const lowerName = file.name.toLowerCase();
        
        if (lowerName.endsWith('.pdf')) {
          content = await extractPdfText(file);
        } else if (lowerName.endsWith('.docx')) {
          content = await extractDocxText(file);
        } else {
          content = '[Unsupported document format]';
        }
        
        newFiles.push({
          name: file.name,
          path: filePath,
          content: content,
          type: file.type || 'application/octet-stream'
        });
      } catch (err) {
        console.warn(`Could not extract text from document ${file.name}:`, err);
        newFiles.push({
          name: file.name,
          path: filePath,
          content: `[Could not extract text from document: ${file.name}]`,
          type: file.type || 'unknown'
        });
      }
    } else if (isTextFile(file.name)) {
      // Handle regular text files
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
      // Mark binary files
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
  const addedPaths = new Set<string>();
  
  // Get folder name from first file's relative path
  const firstFile = files[0];
  const folderName = firstFile.webkitRelativePath.split("/")[0];
  
  const filePromises = Array.from(files).map(async (file) => {
    const relativePath = file.webkitRelativePath;
    // Skip if already processed
    if (addedPaths.has(relativePath)) return null;
    addedPaths.add(relativePath);
    
    // Process based on file type
    if (isDocumentFile(file.name)) {
      // Handle PDF and DOCX files
      try {
        let content: string;
        const lowerName = file.name.toLowerCase();
        
        if (lowerName.endsWith('.pdf')) {
          content = await extractPdfText(file);
        } else if (lowerName.endsWith('.docx')) {
          content = await extractDocxText(file);
        } else {
          return null; // Unsupported document format
        }
        
        return {
          name: file.name,
          path: relativePath,
          content: content,
          type: file.type || 'application/octet-stream'
        } as ReferenceFile;
      } catch (err) {
        console.warn(`Could not extract text from document ${file.name}:`, err);
        return null;
      }
    } else if (isTextFile(file.name)) {
      // Handle regular text files
      try {
        const content = await readFileContent(file);
        return {
          name: file.name,
          path: relativePath,
          content: content,
          type: file.type || 'text/plain'
        } as ReferenceFile;
      } catch (err) {
        console.warn(`Could not read file ${file.name}:`, err);
        return null;
      }
    }
    return null;
  });

  const results = await Promise.all(filePromises);
  const newFiles: ReferenceFile[] = results.filter((r): r is ReferenceFile => r !== null);
  
  return { folderName, referenceFiles: newFiles };
};
