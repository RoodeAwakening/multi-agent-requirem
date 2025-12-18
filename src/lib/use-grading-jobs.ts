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

  // Refresh grading jobs.
  // Note: This is intentionally a no-op. The `useStoredValue` hook already keeps
  // `gradingJobs` in sync with localStorage/reactive state, so there is no extra
  // work needed to "refresh" them. This function exists to keep the API surface
  // consistent with other hooks (e.g. `useJobs`) and as a future extension point
  // if explicit refresh behavior is ever required (for example, to re-read from a
  // different backing store or to force-sync across tabs).
  const refreshGradingJobs = useCallback(() => {
    // Intentionally left blank: see detailed comment above.
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
