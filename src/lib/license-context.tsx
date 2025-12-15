/**
 * License Context Provider
 * 
 * React context for managing license state across the application.
 * Provides hooks for accessing license validation status and functions.
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { LicenseValidationResult } from './license-types';
import { licenseManager } from './license-manager';

interface LicenseContextValue {
  validation: LicenseValidationResult | null;
  isLoading: boolean;
  revalidate: () => Promise<void>;
  isLicenseValid: boolean;
}

const LicenseContext = createContext<LicenseContextValue | null>(null);

interface LicenseProviderProps {
  children: ReactNode;
}

export function LicenseProvider({ children }: LicenseProviderProps) {
  const [validation, setValidation] = useState<LicenseValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const validateLicense = async () => {
    setIsLoading(true);
    try {
      const result = await licenseManager.validateCurrentLicense();
      setValidation(result);
    } catch (error) {
      console.error('License validation error:', error);
      setValidation({
        isValid: false,
        isExpired: false,
        daysRemaining: null,
        features: [],
        errorMessage: 'Failed to validate license',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const revalidate = async () => {
    await licenseManager.revalidate();
    await validateLicense();
  };
  
  useEffect(() => {
    validateLicense();
  }, []);
  
  const value: LicenseContextValue = {
    validation,
    isLoading,
    revalidate,
    isLicenseValid: validation?.isValid || false,
  };
  
  return (
    <LicenseContext.Provider value={value}>
      {children}
    </LicenseContext.Provider>
  );
}

/**
 * Hook to access license context
 */
export function useLicense() {
  const context = useContext(LicenseContext);
  if (!context) {
    throw new Error('useLicense must be used within a LicenseProvider');
  }
  return context;
}

/**
 * Hook to check if a specific feature is available
 */
export function useFeatureAccess(feature: string): boolean {
  const { validation } = useLicense();
  
  if (!validation || !validation.isValid) {
    return false;
  }
  
  return validation.features.includes(feature);
}
