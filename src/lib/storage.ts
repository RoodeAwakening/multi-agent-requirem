/**
 * Simple localStorage-based key-value storage
 * Replaces the spark KV storage functionality
 */

import { useState, useEffect, useCallback } from "react";

const STORAGE_PREFIX = "multi-agent-pipeline:";

/**
 * Get a value from storage
 */
export function getStoredValue<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    if (item === null) {
      return null;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`Failed to get stored value for key "${key}":`, error);
    return null;
  }
}

/**
 * Set a value in storage
 */
export function setStoredValue<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to set stored value for key "${key}":`, error);
  }
}

/**
 * Remove a value from storage
 */
export function removeStoredValue(key: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
  } catch (error) {
    console.warn(`Failed to remove stored value for key "${key}":`, error);
  }
}

/**
 * React hook for using stored values
 * Similar to useState but persists to localStorage
 */
export function useStoredValue<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    const stored = getStoredValue<T>(key);
    return stored !== null ? stored : defaultValue;
  });

  // Sync to localStorage when value changes
  useEffect(() => {
    setStoredValue(key, value);
  }, [key, value]);

  // Listen for storage events from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_PREFIX + key && e.newValue !== null) {
        try {
          setValue(JSON.parse(e.newValue) as T);
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key]);

  const setValueWrapper = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const nextValue =
          typeof newValue === "function"
            ? (newValue as (prev: T) => T)(prev)
            : newValue;
        return nextValue;
      });
    },
    []
  );

  return [value, setValueWrapper];
}
