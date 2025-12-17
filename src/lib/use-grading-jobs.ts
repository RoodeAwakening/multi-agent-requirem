/**
 * Custom hook for managing grading jobs with localStorage storage.
 */

import { useState, useCallback, useEffect } from "react";
import { GradingJob } from "./types";
import { useStoredValue } from "./storage";

/**
 * Hook for managing grading jobs.
 * Uses localStorage for persistence.
 */
export function useGradingJobs(): {
  gradingJobs: GradingJob[];
  isLoading: boolean;
  addGradingJob: (job: GradingJob) => Promise<void>;
  updateGradingJob: (job: GradingJob) => Promise<void>;
  deleteGradingJob: (jobId: string) => Promise<void>;
  refreshGradingJobs: () => void;
} {
  const [storedJobs, setStoredJobs] = useStoredValue<GradingJob[]>("grading-jobs", []);
  const [isLoading, setIsLoading] = useState(false);

  const gradingJobs = storedJobs || [];

  // Add a new grading job
  const addGradingJob = useCallback(async (job: GradingJob) => {
    setStoredJobs((prev) => [...(prev || []), job]);
  }, [setStoredJobs]);

  // Update an existing grading job
  const updateGradingJob = useCallback(async (job: GradingJob) => {
    setStoredJobs((prev) => 
      (prev || []).map((j) => (j.id === job.id ? job : j))
    );
  }, [setStoredJobs]);

  // Delete a grading job
  const deleteGradingJob = useCallback(async (jobId: string) => {
    setStoredJobs((prev) => (prev || []).filter((j) => j.id !== jobId));
  }, [setStoredJobs]);

  // Refresh grading jobs (mainly for consistency with useJobs interface)
  const refreshGradingJobs = useCallback(() => {
    // Jobs are already reactive through useStoredValue
    // This is mainly a no-op but kept for API consistency
  }, []);

  return {
    gradingJobs,
    isLoading,
    addGradingJob,
    updateGradingJob,
    deleteGradingJob,
    refreshGradingJobs,
  };
}
