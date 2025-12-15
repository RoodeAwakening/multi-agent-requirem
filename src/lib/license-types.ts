/**
 * License Types and Interfaces
 * 
 * This module defines the structure for license files and validation results.
 */

export interface LicenseData {
  customerId: string;
  customerName: string;
  expiryDate: string; // ISO 8601 date string
  allowedFeatures: string[];
  issuedDate: string; // ISO 8601 date string
  licenseType: 'trial' | 'commercial' | 'enterprise';
  maxVersions?: number; // Optional: limit number of versions per job
  signature?: string; // RSA signature of the license data
}

export interface LicenseValidationResult {
  isValid: boolean;
  isExpired: boolean;
  daysRemaining: number | null;
  features: string[];
  errorMessage?: string;
  customerId?: string;
  licenseType?: 'trial' | 'commercial' | 'enterprise';
}

export const REQUIRED_FEATURES = {
  AI_API_ACCESS: 'ai_api_access',
  PIPELINE_EXECUTION: 'pipeline_execution',
  PDF_EXPORT: 'pdf_export',
  VERSION_MANAGEMENT: 'version_management',
  FILE_UPLOAD: 'file_upload',
} as const;

export type RequiredFeature = typeof REQUIRED_FEATURES[keyof typeof REQUIRED_FEATURES];
