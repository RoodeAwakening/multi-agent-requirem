/**
 * File System Storage Module
 * 
 * This module provides an abstraction for storing job data directly on the user's file system
 * using the File System Access API. This helps reduce browser memory usage and localStorage
 * limitations when dealing with many jobs and large AI-generated outputs.
 * 
 * Directory structure:
 * <selected-directory>/
 *   ├── .ian-config.json          # Storage configuration metadata
 *   ├── jobs/
 *   │   ├── JOB-20240101-123456/
 *   │   │   ├── job.json          # Job metadata (without outputs)
 *   │   │   ├── outputs/
 *   │   │   │   ├── 01_tech_lead.md
 *   │   │   │   ├── 02_business_analyst.md
 *   │   │   │   └── ...
 *   │   │   └── references/       # Cached reference files
 *   │   └── JOB-20240102-134567/
 *   │       └── ...
 *   ├── grading-jobs/
 *   │   ├── GRADE-20240101-123456/
 *   │   │   └── job.json          # Grading job data
 *   │   └── GRADE-20240102-134567/
 *   │       └── job.json
 *   └── settings/
 *       ├── ai-settings.json
 *       └── custom-prompts.json
 */

import { Job, GradingJob } from "./types";

// File System Access API types
interface FileSystemWritableFileStream extends WritableStream {
  write(data: string | BufferSource | Blob): Promise<void>;
  seek(position: number): Promise<void>;
  truncate(size: number): Promise<void>;
}

interface FileSystemFileHandle {
  kind: "file";
  name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<FileSystemWritableFileStream>;
}

interface FileSystemDirectoryHandle {
  kind: "directory";
  name: string;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>;
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
  values(): AsyncIterableIterator<FileSystemFileHandle | FileSystemDirectoryHandle>;
  entries(): AsyncIterableIterator<[string, FileSystemFileHandle | FileSystemDirectoryHandle]>;
}

// Storage configuration stored in the selected directory
interface StorageConfig {
  version: number;
  createdAt: string;
  lastAccess: string;
}

// Storage mode types
export type StorageMode = "localStorage" | "fileSystem";

export interface StorageSettings {
  mode: StorageMode;
  directoryHandle?: FileSystemDirectoryHandle;
  directoryName?: string;
}

// In-memory cache for the directory handle (since it can't be serialized)
let cachedDirectoryHandle: FileSystemDirectoryHandle | null = null;
let cachedDirectoryName: string | null = null;

const STORAGE_CONFIG_KEY = "multi-agent-pipeline:storage-config";

/**
 * Check if File System Access API is available
 */
export function isFileSystemAccessSupported(): boolean {
  return "showDirectoryPicker" in window;
}

/**
 * Get the cached directory handle
 */
export function getCachedDirectoryHandle(): FileSystemDirectoryHandle | null {
  return cachedDirectoryHandle;
}

/**
 * Get the cached directory name
 */
export function getCachedDirectoryName(): string | null {
  return cachedDirectoryName;
}

/**
 * Prompt the user to select a directory for storage
 */
export async function selectStorageDirectory(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFileSystemAccessSupported()) {
    throw new Error("File System Access API is not supported in this browser");
  }

  try {
    // @ts-expect-error - showDirectoryPicker is not in TypeScript types yet
    const handle: FileSystemDirectoryHandle = await window.showDirectoryPicker({
      id: "ian-storage",
      mode: "readwrite",
      startIn: "documents",
    });

    // Store handle in memory
    cachedDirectoryHandle = handle;
    cachedDirectoryName = handle.name;

    // Save the directory name to localStorage (handle can't be serialized)
    localStorage.setItem(
      STORAGE_CONFIG_KEY,
      JSON.stringify({ directoryName: handle.name, mode: "fileSystem" })
    );

    // Initialize the directory structure
    await initializeStorageDirectory(handle);

    return handle;
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      // User cancelled the picker
      return null;
    }
    throw error;
  }
}

/**
 * Verify and request permission for an existing directory handle
 */
export async function verifyPermission(
  handle: FileSystemDirectoryHandle,
  mode: "read" | "readwrite" = "readwrite"
): Promise<boolean> {
  try {
    // @ts-expect-error - queryPermission is not in TypeScript types yet
    const options = { mode };
    // @ts-expect-error - queryPermission is not in TypeScript types yet
    if ((await handle.queryPermission(options)) === "granted") {
      return true;
    }
    // @ts-expect-error - requestPermission is not in TypeScript types yet
    if ((await handle.requestPermission(options)) === "granted") {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Initialize the directory structure for I.A.N. storage
 */
async function initializeStorageDirectory(handle: FileSystemDirectoryHandle): Promise<void> {
  // Create the subdirectories
  await handle.getDirectoryHandle("jobs", { create: true });
  await handle.getDirectoryHandle("grading-jobs", { create: true });
  await handle.getDirectoryHandle("settings", { create: true });

  // Create or update the config file
  const configHandle = await handle.getFileHandle(".ian-config.json", { create: true });
  const writable = await configHandle.createWritable();
  const config: StorageConfig = {
    version: 1,
    createdAt: new Date().toISOString(),
    lastAccess: new Date().toISOString(),
  };
  await writable.write(JSON.stringify(config, null, 2));
  await writable.close();
}

/**
 * Write a file to the storage directory
 */
async function writeFile(
  dirHandle: FileSystemDirectoryHandle,
  path: string[],
  filename: string,
  content: string
): Promise<void> {
  let currentHandle = dirHandle;

  // Navigate/create the path
  for (const dir of path) {
    currentHandle = await currentHandle.getDirectoryHandle(dir, { create: true });
  }

  // Write the file
  const fileHandle = await currentHandle.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

/**
 * Read a file from the storage directory
 */
async function readFile(
  dirHandle: FileSystemDirectoryHandle,
  path: string[],
  filename: string
): Promise<string | null> {
  try {
    let currentHandle = dirHandle;

    // Navigate the path
    for (const dir of path) {
      currentHandle = await currentHandle.getDirectoryHandle(dir);
    }

    // Read the file
    const fileHandle = await currentHandle.getFileHandle(filename);
    const file = await fileHandle.getFile();
    return await file.text();
  } catch {
    return null;
  }
}

/**
 * Check if a file exists in the storage directory
 */
async function fileExists(
  dirHandle: FileSystemDirectoryHandle,
  path: string[],
  filename: string
): Promise<boolean> {
  try {
    let currentHandle = dirHandle;

    for (const dir of path) {
      currentHandle = await currentHandle.getDirectoryHandle(dir);
    }

    await currentHandle.getFileHandle(filename);
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete a directory recursively
 */
async function deleteDirectory(
  dirHandle: FileSystemDirectoryHandle,
  path: string[],
  directoryName: string
): Promise<void> {
  try {
    let currentHandle = dirHandle;

    for (const dir of path) {
      currentHandle = await currentHandle.getDirectoryHandle(dir);
    }

    await currentHandle.removeEntry(directoryName, { recursive: true });
  } catch (error) {
    console.warn("Failed to delete directory:", error);
  }
}

/**
 * List all entries in a directory
 */
async function listDirectory(
  dirHandle: FileSystemDirectoryHandle,
  path: string[]
): Promise<string[]> {
  try {
    let currentHandle = dirHandle;

    for (const dir of path) {
      currentHandle = await currentHandle.getDirectoryHandle(dir);
    }

    const entries: string[] = [];
    for await (const entry of currentHandle.values()) {
      if (entry.kind === "directory") {
        entries.push(entry.name);
      }
    }
    return entries;
  } catch {
    return [];
  }
}

// ============================================================
// Job Storage Functions
// ============================================================

/**
 * Save a job to the file system
 * Stores job metadata separately from outputs for better performance
 */
export async function saveJobToFileSystem(job: Job): Promise<void> {
  if (!cachedDirectoryHandle) {
    throw new Error("No storage directory selected");
  }

  const hasPermission = await verifyPermission(cachedDirectoryHandle);
  if (!hasPermission) {
    throw new Error("Permission denied. Please re-select your storage folder in Settings.");
  }

  const jobPath = ["jobs", job.id];

  // Save job metadata (without outputs to keep file small)
  const { outputs, ...jobMetadata } = job;
  const jobMetadataWithFiles: Omit<Job, "outputs"> & { outputFiles: string[] } = {
    ...jobMetadata,
    outputFiles: Object.keys(outputs),
  };

  await writeFile(
    cachedDirectoryHandle,
    jobPath,
    "job.json",
    JSON.stringify(jobMetadataWithFiles, null, 2)
  );

  // Save each output file separately (concurrent writes for better performance)
  const outputWrites = Object.entries(job.outputs)
    .filter(([, content]) => content)
    .map(([filename, content]) =>
      writeFile(cachedDirectoryHandle!, [...jobPath, "outputs"], filename, content)
    );
  await Promise.all(outputWrites);

  // Save reference files if present
  if (job.referenceFiles && job.referenceFiles.length > 0) {
    await writeFile(
      cachedDirectoryHandle,
      [...jobPath, "references"],
      "files.json",
      JSON.stringify(job.referenceFiles, null, 2)
    );
  }
}

/**
 * Load a job from the file system
 */
export async function loadJobFromFileSystem(jobId: string): Promise<Job | null> {
  if (!cachedDirectoryHandle) {
    return null;
  }

  try {
    const jobPath = ["jobs", jobId];

    // Read job metadata
    const metadataContent = await readFile(cachedDirectoryHandle, jobPath, "job.json");
    if (!metadataContent) {
      return null;
    }

    const metadata = JSON.parse(metadataContent);
    const job: Job = {
      ...metadata,
      outputs: {},
    };

    // Read output files
    if (metadata.outputFiles && Array.isArray(metadata.outputFiles)) {
      for (const filename of metadata.outputFiles) {
        const content = await readFile(cachedDirectoryHandle, [...jobPath, "outputs"], filename);
        if (content) {
          job.outputs[filename] = content;
        }
      }
    }

    // Read reference files if they exist
    const referencesContent = await readFile(
      cachedDirectoryHandle,
      [...jobPath, "references"],
      "files.json"
    );
    if (referencesContent) {
      job.referenceFiles = JSON.parse(referencesContent);
    }

    return job;
  } catch (error) {
    console.error("Failed to load job:", error);
    return null;
  }
}

/**
 * Load all jobs from the file system (metadata only for performance)
 */
export async function loadAllJobsFromFileSystem(): Promise<Job[]> {
  if (!cachedDirectoryHandle) {
    return [];
  }

  try {
    const jobIds = await listDirectory(cachedDirectoryHandle, ["jobs"]);
    
    // Load all jobs concurrently for better performance
    const jobPromises = jobIds.map((jobId) => loadJobFromFileSystem(jobId));
    const loadedJobs = await Promise.all(jobPromises);
    const jobs = loadedJobs.filter((job): job is Job => job !== null);

    // Sort by creation date (newest first)
    jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return jobs;
  } catch (error) {
    console.error("Failed to load jobs:", error);
    return [];
  }
}

/**
 * Delete a job from the file system
 */
/**
 * Move a job to trash instead of permanently deleting it
 */
export async function deleteJobFromFileSystem(jobId: string): Promise<void> {
  if (!cachedDirectoryHandle) {
    throw new Error("No storage directory selected");
  }

  const hasPermission = await verifyPermission(cachedDirectoryHandle);
  if (!hasPermission) {
    throw new Error("Permission denied to write to storage directory");
  }

  // Move to trash instead of permanent delete
  await moveJobToTrash(jobId);
}

/**
 * Move a job directory to the .trash folder
 */
async function moveJobToTrash(jobId: string): Promise<void> {
  if (!cachedDirectoryHandle) {
    throw new Error("No storage directory selected");
  }

  try {
    // Ensure trash directory exists
    const trashHandle = await cachedDirectoryHandle.getDirectoryHandle(".trash", { create: true });
    
    // Read the job data before moving
    const jobsHandle = await cachedDirectoryHandle.getDirectoryHandle("jobs");
    const jobHandle = await jobsHandle.getDirectoryHandle(jobId);
    
    // Create a copy in trash with timestamp
    const timestamp = Date.now();
    const trashedName = `${jobId}_${timestamp}`;
    const trashedJobHandle = await trashHandle.getDirectoryHandle(trashedName, { create: true });
    
    // Copy job directory contents to trash
    await copyDirectory(jobHandle, trashedJobHandle);
    
    // Now delete the original
    await jobsHandle.removeEntry(jobId, { recursive: true });
  } catch (error) {
    console.error("Failed to move job to trash:", error);
    throw error;
  }
}

/**
 * Helper function to recursively copy a directory
 */
async function copyDirectory(
  sourceHandle: FileSystemDirectoryHandle,
  targetHandle: FileSystemDirectoryHandle
): Promise<void> {
  for await (const entry of sourceHandle.values()) {
    if (entry.kind === "file") {
      const sourceFile = await entry.getFile();
      const targetFileHandle = await targetHandle.getFileHandle(entry.name, { create: true });
      const writable = await targetFileHandle.createWritable();
      await writable.write(await sourceFile.text());
      await writable.close();
    } else if (entry.kind === "directory") {
      const targetDirHandle = await targetHandle.getDirectoryHandle(entry.name, { create: true });
      await copyDirectory(entry, targetDirHandle);
    }
  }
}

/**
 * List all trashed jobs
 */
export async function listTrashedJobs(): Promise<Array<{ id: string; originalId: string; trashedAt: number }>> {
  if (!cachedDirectoryHandle) {
    return [];
  }

  try {
    const trashHandle = await cachedDirectoryHandle.getDirectoryHandle(".trash");
    const trashedJobs: Array<{ id: string; originalId: string; trashedAt: number }> = [];
    
    for await (const entry of trashHandle.values()) {
      if (entry.kind === "directory") {
        // Parse the format: {jobId}_{timestamp}
        const parts = entry.name.split("_");
        const timestamp = parseInt(parts[parts.length - 1]);
        const originalId = parts.slice(0, -1).join("_");
        
        trashedJobs.push({
          id: entry.name,
          originalId,
          trashedAt: timestamp
        });
      }
    }
    
    return trashedJobs.sort((a, b) => b.trashedAt - a.trashedAt);
  } catch {
    return [];
  }
}

/**
 * Restore a job from trash
 */
export async function restoreJobFromTrash(trashedJobId: string): Promise<void> {
  if (!cachedDirectoryHandle) {
    throw new Error("No storage directory selected");
  }

  const hasPermission = await verifyPermission(cachedDirectoryHandle);
  if (!hasPermission) {
    throw new Error("Permission denied to write to storage directory");
  }

  try {
    const trashHandle = await cachedDirectoryHandle.getDirectoryHandle(".trash");
    const jobsHandle = await cachedDirectoryHandle.getDirectoryHandle("jobs", { create: true });
    
    // Get the trashed job
    const trashedJobHandle = await trashHandle.getDirectoryHandle(trashedJobId);
    
    // Extract original job ID (remove timestamp)
    const parts = trashedJobId.split("_");
    const originalId = parts.slice(0, -1).join("_");
    
    // Create the restored job directory
    const restoredJobHandle = await jobsHandle.getDirectoryHandle(originalId, { create: true });
    
    // Copy contents back
    await copyDirectory(trashedJobHandle, restoredJobHandle);
    
    // Delete from trash
    await trashHandle.removeEntry(trashedJobId, { recursive: true });
  } catch (error) {
    console.error("Failed to restore job from trash:", error);
    throw error;
  }
}

/**
 * Permanently delete a job from trash
 */
export async function permanentlyDeleteFromTrash(trashedJobId: string): Promise<void> {
  if (!cachedDirectoryHandle) {
    throw new Error("No storage directory selected");
  }

  const hasPermission = await verifyPermission(cachedDirectoryHandle);
  if (!hasPermission) {
    throw new Error("Permission denied to write to storage directory");
  }

  try {
    const trashHandle = await cachedDirectoryHandle.getDirectoryHandle(".trash");
    await trashHandle.removeEntry(trashedJobId, { recursive: true });
  } catch (error) {
    console.error("Failed to permanently delete from trash:", error);
    throw error;
  }
}

// ============================================================
// Settings Storage Functions
// ============================================================

/**
 * Save a setting to the file system
 */
export async function saveSettingToFileSystem(key: string, value: unknown): Promise<void> {
  if (!cachedDirectoryHandle) {
    throw new Error("No storage directory selected");
  }

  const hasPermission = await verifyPermission(cachedDirectoryHandle);
  if (!hasPermission) {
    throw new Error("Permission denied to write to storage directory");
  }

  await writeFile(
    cachedDirectoryHandle,
    ["settings"],
    `${key}.json`,
    JSON.stringify(value, null, 2)
  );
}

/**
 * Load a setting from the file system
 */
export async function loadSettingFromFileSystem<T>(key: string): Promise<T | null> {
  if (!cachedDirectoryHandle) {
    return null;
  }

  try {
    const content = await readFile(cachedDirectoryHandle, ["settings"], `${key}.json`);
    if (!content) {
      return null;
    }
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

// ============================================================
// Storage Mode Management
// ============================================================

/**
 * Get the current storage mode from localStorage
 */
export function getStorageMode(): StorageMode {
  try {
    const config = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (config) {
      const parsed = JSON.parse(config);
      if (parsed.mode === "fileSystem" && cachedDirectoryHandle) {
        return "fileSystem";
      }
    }
  } catch {
    // Ignore errors
  }
  return "localStorage";
}

/**
 * Check if file system storage is configured (directory was selected)
 */
export function isFileSystemStorageConfigured(): boolean {
  try {
    const config = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (config) {
      const parsed = JSON.parse(config);
      return parsed.mode === "fileSystem" && !!parsed.directoryName;
    }
  } catch {
    // Ignore errors
  }
  return false;
}

/**
 * Get the stored directory name (if any)
 */
export function getStoredDirectoryName(): string | null {
  try {
    const config = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (config) {
      const parsed = JSON.parse(config);
      return parsed.directoryName || null;
    }
  } catch {
    // Ignore errors
  }
  return null;
}

/**
 * Clear the storage configuration (switch back to localStorage)
 */
export function clearStorageConfig(): void {
  cachedDirectoryHandle = null;
  cachedDirectoryName = null;
  localStorage.removeItem(STORAGE_CONFIG_KEY);
}

/**
 * Export all jobs from localStorage to the file system
 */
export async function exportJobsToFileSystem(jobs: Job[]): Promise<number> {
  if (!cachedDirectoryHandle) {
    throw new Error("No storage directory selected");
  }

  let exportedCount = 0;

  for (const job of jobs) {
    try {
      await saveJobToFileSystem(job);
      exportedCount++;
    } catch (error) {
      console.error(`Failed to export job ${job.id}:`, error);
    }
  }

  return exportedCount;
}

/**
 * Import all jobs from file system to localStorage format
 */
export async function importJobsFromFileSystem(): Promise<Job[]> {
  return loadAllJobsFromFileSystem();
}

// ============================================================
// Grading Job Storage Functions
// ============================================================

/**
 * Save a grading job to the file system
 */
export async function saveGradingJobToFileSystem(job: GradingJob): Promise<void> {
  if (!cachedDirectoryHandle) {
    throw new Error("No storage directory selected");
  }

  const hasPermission = await verifyPermission(cachedDirectoryHandle);
  if (!hasPermission) {
    throw new Error("Permission denied. Please re-select your storage folder in Settings.");
  }

  const jobPath = ["grading-jobs", job.id];

  // Save complete grading job data in a single file
  await writeFile(
    cachedDirectoryHandle,
    jobPath,
    "job.json",
    JSON.stringify(job, null, 2)
  );
}

/**
 * Load a grading job from the file system
 */
async function loadGradingJobFromDirectory(baseDir: "grading-jobs" | "grading", jobId: string): Promise<GradingJob | null> {
  if (!cachedDirectoryHandle) {
    return null;
  }

  try {
    const jobPath = [baseDir, jobId];

    // Read job data
    const jobContent = await readFile(cachedDirectoryHandle, jobPath, "job.json");
    if (!jobContent) {
      return null;
    }

    const job: GradingJob = JSON.parse(jobContent);
    return job;
  } catch (error) {
    console.error("Failed to load grading job:", error);
    return null;
  }
}

export async function loadGradingJobFromFileSystem(jobId: string): Promise<GradingJob | null> {
  // Prefer current directory structure, but fall back to legacy "grading" folder
  const job = await loadGradingJobFromDirectory("grading-jobs", jobId);
  if (job) return job;
  return loadGradingJobFromDirectory("grading", jobId);
}

/**
 * Load all grading jobs from the file system
 */
export async function loadAllGradingJobsFromFileSystem(): Promise<GradingJob[]> {
  if (!cachedDirectoryHandle) {
    return [];
  }

  try {
    const primaryIds = await listDirectory(cachedDirectoryHandle, ["grading-jobs"]);
    const legacyIds = await listDirectory(cachedDirectoryHandle, ["grading"]);

    // Deduplicate ids (prefer primary directory when present)
    const jobDescriptors: Array<{ id: string; dir: "grading-jobs" | "grading" }> = [
      ...primaryIds.map((id) => ({ id, dir: "grading-jobs" as const })),
    ];
    legacyIds.forEach((id) => {
      if (!primaryIds.includes(id)) {
        jobDescriptors.push({ id, dir: "grading" });
      }
    });

    // Load all grading jobs concurrently for better performance
    const jobPromises = jobDescriptors.map(({ id, dir }) => loadGradingJobFromDirectory(dir, id));
    const loadedJobs = await Promise.all(jobPromises);
    const jobs = loadedJobs.filter((job): job is GradingJob => job !== null);

    // Sort by creation date (newest first)
    jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return jobs;
  } catch (error) {
    console.error("Failed to load grading jobs:", error);
    return [];
  }
}

/**
 * Delete a grading job from the file system
 */
export async function deleteGradingJobFromFileSystem(jobId: string): Promise<void> {
  if (!cachedDirectoryHandle) {
    throw new Error("No storage directory selected");
  }

  const hasPermission = await verifyPermission(cachedDirectoryHandle);
  if (!hasPermission) {
    throw new Error("Permission denied to write to storage directory");
  }

  try {
    await deleteDirectory(cachedDirectoryHandle, ["grading-jobs"], jobId);
  } catch (error) {
    console.error("Failed to delete grading job:", error);
    throw error;
  }
}

/**
 * Export grading jobs from localStorage to file system
 */
export async function exportGradingJobsToFileSystem(jobs: GradingJob[]): Promise<number> {
  if (!cachedDirectoryHandle) {
    throw new Error("No storage directory selected");
  }

  let exportedCount = 0;

  for (const job of jobs) {
    try {
      await saveGradingJobToFileSystem(job);
      exportedCount++;
    } catch (error) {
      console.error(`Failed to export grading job ${job.id}:`, error);
    }
  }

  return exportedCount;
}

/**
 * Import all grading jobs from file system to localStorage format
 */
export async function importGradingJobsFromFileSystem(): Promise<GradingJob[]> {
  return loadAllGradingJobsFromFileSystem();
}
