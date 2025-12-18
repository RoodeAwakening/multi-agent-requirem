/**
 * Custom hook for managing grading jobs with support for both localStorage and file system storage.
 * Provides a seamless abstraction over the underlying storage mechanism.
 */

import { useState, useEffect, useCallback } from "react";
import { GradingJob } from "./types";
import { useStoredValue } from "./storage";
import {
  getStorageMode,
  getCachedDirectoryHandle,
  saveGradingJobToFileSystem,
  loadAllGradingJobsFromFileSystem,
  deleteGradingJobFromFileSystem,
  clearStorageConfig,
  StorageMode,
} from "./filesystem-storage";

/**
 * Hook for managing grading jobs with hybrid storage support.
 * Automatically uses file system storage when configured, falls back to localStorage.
 */
export function useGradingJobs(): {
  gradingJobs: GradingJob[];
  isLoading: boolean;
  storageMode: StorageMode;
  fileSystemError: string | null;
  addGradingJob: (job: GradingJob) => Promise<void>;
  updateGradingJob: (job: GradingJob) => Promise<void>;
  deleteGradingJob: (jobId: string) => Promise<void>;
  refreshGradingJobs: () => Promise<void>;
  setStorageMode: (mode: StorageMode) => void;
  clearFileSystemError: () => void;
} {
  // State for storage mode - must be declared first
  const [currentStorageMode, setCurrentStorageMode] = useState<StorageMode>(getStorageMode());
  
  // Always use localStorage as a fallback/primary source
  const [localStorageJobs, setLocalStorageJobs] = useStoredValue<GradingJob[]>("grading-jobs", []);
  
  // State for file system jobs
  const [fileSystemJobs, setFileSystemJobs] = useState<GradingJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fileSystemError, setFileSystemError] = useState<string | null>(null);

  // Determine which jobs to use based on storage mode
  const gradingJobs = currentStorageMode === "fileSystem" && getCachedDirectoryHandle()
    ? fileSystemJobs
    : localStorageJobs || [];

  // Load grading jobs from file system on mount if configured
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (currentStorageMode === "fileSystem" && getCachedDirectoryHandle()) {
        setIsLoading(true);
        setFileSystemError(null);
        try {
          const loadedJobs = await loadAllGradingJobsFromFileSystem();
          if (!cancelled) {
            setFileSystemJobs(loadedJobs);
          }
        } catch (error) {
          if (!cancelled) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            console.error("Failed to load grading jobs from file system:", error);
            // Set error state so UI can show warning and offer to retry or switch storage
            setFileSystemError(`Failed to access file system storage: ${errorMessage}. Please re-select your storage folder or switch to browser storage.`);
            // Fall back to localStorage and persist the change
            clearStorageConfig();
            setCurrentStorageMode("localStorage");
          }
        } finally {
          if (!cancelled) {
            setIsLoading(false);
          }
        }
      } else {
        setIsLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [currentStorageMode]);

  // Clear file system error
  const clearFileSystemError = useCallback(() => {
    setFileSystemError(null);
  }, []);

  // Add a new grading job
  const addGradingJob = useCallback(async (job: GradingJob) => {
    if (currentStorageMode === "fileSystem" && getCachedDirectoryHandle()) {
      try {
        await saveGradingJobToFileSystem(job);
        setFileSystemJobs((prev) => [job, ...prev]);
      } catch (error) {
        console.error("Failed to save grading job to file system:", error);
        throw error;
      }
    } else {
      setLocalStorageJobs((prev) => [job, ...(prev || [])]);
    }
  }, [currentStorageMode, setLocalStorageJobs]);

  // Update an existing grading job
  const updateGradingJob = useCallback(async (job: GradingJob) => {
    if (currentStorageMode === "fileSystem" && getCachedDirectoryHandle()) {
      try {
        await saveGradingJobToFileSystem(job);
        setFileSystemJobs((prev) =>
          prev.map((j) => (j.id === job.id ? job : j))
        );
      } catch (error) {
        console.error("Failed to update grading job in file system:", error);
        throw error;
      }
    } else {
      setLocalStorageJobs((prev) =>
        (prev || []).map((j) => (j.id === job.id ? job : j))
      );
    }
  }, [currentStorageMode, setLocalStorageJobs]);

  // Delete a grading job
  const deleteGradingJob = useCallback(async (jobId: string) => {
    if (currentStorageMode === "fileSystem" && getCachedDirectoryHandle()) {
      try {
        await deleteGradingJobFromFileSystem(jobId);
        setFileSystemJobs((prev) => prev.filter((j) => j.id !== jobId));
      } catch (error) {
        console.error("Failed to delete grading job from file system:", error);
        throw error;
      }
    } else {
      setLocalStorageJobs((prev) => (prev || []).filter((j) => j.id !== jobId));
    }
  }, [currentStorageMode, setLocalStorageJobs]);

  // Refresh grading jobs from storage
  const refreshGradingJobs = useCallback(async () => {
    if (currentStorageMode === "fileSystem" && getCachedDirectoryHandle()) {
      setIsLoading(true);
      try {
        const loadedJobs = await loadAllGradingJobsFromFileSystem();
        setFileSystemJobs(loadedJobs);
        setFileSystemError(null);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Failed to refresh grading jobs from file system:", error);
        setFileSystemError(`Failed to access file system storage: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    }
    // localStorage is automatically synced via useStoredValue
  }, [currentStorageMode]);

  // Change storage mode
  const setStorageMode = useCallback((mode: StorageMode) => {
    setCurrentStorageMode(mode);
    // Persist the storage mode to localStorage
    window.localStorage.setItem("storageMode", mode);
  }, []);

  return {
    gradingJobs,
    isLoading,
    storageMode: currentStorageMode,
    fileSystemError,
    addGradingJob,
    updateGradingJob,
    deleteGradingJob,
    refreshGradingJobs,
    setStorageMode,
    clearFileSystemError,
  };
}
