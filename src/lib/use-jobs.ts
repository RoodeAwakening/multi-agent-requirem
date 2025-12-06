/**
 * Custom hook for managing jobs with support for both localStorage and file system storage.
 * Provides a seamless abstraction over the underlying storage mechanism.
 */

import { useState, useEffect, useCallback } from "react";
import { Job } from "./types";
import { useStoredValue, getStoredValue } from "./storage";
import {
  getStorageMode,
  getCachedDirectoryHandle,
  saveJobToFileSystem,
  loadAllJobsFromFileSystem,
  loadJobFromFileSystem,
  deleteJobFromFileSystem,
  StorageMode,
} from "./filesystem-storage";

/**
 * Hook for managing jobs with hybrid storage support.
 * Automatically uses file system storage when configured, falls back to localStorage.
 */
export function useJobs(): {
  jobs: Job[];
  isLoading: boolean;
  storageMode: StorageMode;
  addJob: (job: Job) => Promise<void>;
  updateJob: (job: Job) => Promise<void>;
  deleteJob: (jobId: string) => Promise<void>;
  refreshJobs: () => Promise<void>;
  setStorageMode: (mode: StorageMode) => void;
} {
  // State for storage mode - must be declared first
  const [currentStorageMode, setCurrentStorageMode] = useState<StorageMode>(getStorageMode());
  
  // Always use localStorage as a fallback/primary source
  const [localStorageJobs, setLocalStorageJobs] = useStoredValue<Job[]>("jobs", []);
  
  // State for file system jobs
  const [fileSystemJobs, setFileSystemJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Determine which jobs to use based on storage mode
  const jobs = currentStorageMode === "fileSystem" && getCachedDirectoryHandle()
    ? fileSystemJobs
    : localStorageJobs || [];

  // Load jobs from file system on mount if configured
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (currentStorageMode === "fileSystem" && getCachedDirectoryHandle()) {
        setIsLoading(true);
        try {
          const loadedJobs = await loadAllJobsFromFileSystem();
          if (!cancelled) {
            setFileSystemJobs(loadedJobs);
          }
        } catch (error) {
          if (!cancelled) {
            console.error("Failed to load jobs from file system:", error);
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
  // Add a new job
  const addJob = useCallback(async (job: Job) => {
    if (currentStorageMode === "fileSystem" && getCachedDirectoryHandle()) {
      try {
        await saveJobToFileSystem(job);
        setFileSystemJobs((prev) => [job, ...prev]);
      } catch (error) {
        console.error("Failed to save job to file system:", error);
        throw error;
      }
    } else {
      setLocalStorageJobs((prev) => [job, ...(prev || [])]);
    }
  }, [currentStorageMode, setLocalStorageJobs]);

  // Update an existing job
  const updateJob = useCallback(async (job: Job) => {
    if (currentStorageMode === "fileSystem" && getCachedDirectoryHandle()) {
      try {
        await saveJobToFileSystem(job);
        setFileSystemJobs((prev) =>
          prev.map((j) => (j.id === job.id ? job : j))
        );
      } catch (error) {
        console.error("Failed to update job in file system:", error);
        throw error;
      }
    } else {
      setLocalStorageJobs((prev) =>
        (prev || []).map((j) => (j.id === job.id ? job : j))
      );
    }
  }, [currentStorageMode, setLocalStorageJobs]);

  // Delete a job
  const deleteJob = useCallback(async (jobId: string) => {
    if (currentStorageMode === "fileSystem" && getCachedDirectoryHandle()) {
      try {
        await deleteJobFromFileSystem(jobId);
        setFileSystemJobs((prev) => prev.filter((j) => j.id !== jobId));
      } catch (error) {
        console.error("Failed to delete job from file system:", error);
        throw error;
      }
    } else {
      setLocalStorageJobs((prev) => (prev || []).filter((j) => j.id !== jobId));
    }
  }, [currentStorageMode, setLocalStorageJobs]);

  // Refresh jobs from storage
  const refreshJobs = useCallback(async () => {
    if (currentStorageMode === "fileSystem" && getCachedDirectoryHandle()) {
      await loadFileSystemJobs();
    }
    // localStorage is automatically synced via useStoredValue
  }, [currentStorageMode, loadFileSystemJobs]);

  // Change storage mode
  const setStorageMode = useCallback((mode: StorageMode) => {
    setCurrentStorageMode(mode);
    // Persist the storage mode to localStorage
    window.localStorage.setItem("storageMode", mode);
  }, []);

  return {
    jobs,
    isLoading,
    storageMode: currentStorageMode,
    addJob,
    updateJob,
    deleteJob,
    refreshJobs,
    setStorageMode,
  };
}

/**
 * Hook for getting a single job with lazy loading of outputs.
 * When using file system storage, outputs are loaded on-demand to improve performance.
 */
export function useJob(jobId: string | null): {
  job: Job | null;
  isLoading: boolean;
  error: Error | null;
} {
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      return;
    }

    const loadJob = async () => {
      const storageMode = getStorageMode();
      
      if (storageMode === "fileSystem" && getCachedDirectoryHandle()) {
        setIsLoading(true);
        try {
          const loadedJob = await loadJobFromFileSystem(jobId);
          setJob(loadedJob);
          setError(null);
        } catch (err) {
          console.error("Failed to load job:", err);
          setError(err instanceof Error ? err : new Error("Failed to load job"));
          setJob(null);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Load from localStorage
        const jobs = getStoredValue<Job[]>("jobs") || [];
        const foundJob = jobs.find((j) => j.id === jobId) || null;
        setJob(foundJob);
      }
    };

    loadJob();
  }, [jobId]);

  return { job, isLoading, error };
}
