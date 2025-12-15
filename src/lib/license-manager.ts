/**
 * License Manager
 * 
 * Handles loading, storing, and managing license files.
 * Provides a singleton instance to track license state across the application.
 */

import type { LicenseData, LicenseValidationResult } from './license-types';
import { validateLicense } from './license-validator';

const LICENSE_STORAGE_KEY = 'app-license-data';
const LICENSE_VALIDATION_KEY = 'app-license-validation';

/**
 * License Manager class - singleton pattern
 */
class LicenseManager {
  private static instance: LicenseManager;
  private licenseData: LicenseData | null = null;
  private validationResult: LicenseValidationResult | null = null;
  private validationPromise: Promise<LicenseValidationResult> | null = null;
  
  private constructor() {
    // Private constructor for singleton
  }
  
  public static getInstance(): LicenseManager {
    if (!LicenseManager.instance) {
      LicenseManager.instance = new LicenseManager();
    }
    return LicenseManager.instance;
  }
  
  /**
   * Load license from localStorage
   */
  public loadLicense(): LicenseData | null {
    try {
      const stored = localStorage.getItem(LICENSE_STORAGE_KEY);
      if (stored) {
        this.licenseData = JSON.parse(stored);
        return this.licenseData;
      }
    } catch (error) {
      console.error('Failed to load license:', error);
    }
    return null;
  }
  
  /**
   * Save license to localStorage
   */
  public saveLicense(licenseData: LicenseData): void {
    try {
      localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(licenseData));
      this.licenseData = licenseData;
      // Clear cached validation when license changes
      this.validationResult = null;
      this.validationPromise = null;
      localStorage.removeItem(LICENSE_VALIDATION_KEY);
    } catch (error) {
      console.error('Failed to save license:', error);
      throw new Error('Failed to save license data');
    }
  }
  
  /**
   * Remove license from storage
   */
  public removeLicense(): void {
    localStorage.removeItem(LICENSE_STORAGE_KEY);
    localStorage.removeItem(LICENSE_VALIDATION_KEY);
    this.licenseData = null;
    this.validationResult = null;
    this.validationPromise = null;
  }
  
  /**
   * Get current license data
   */
  public getLicense(): LicenseData | null {
    if (!this.licenseData) {
      return this.loadLicense();
    }
    return this.licenseData;
  }
  
  /**
   * Validate the current license
   * Returns cached result if available and still valid
   */
  public async validateCurrentLicense(): Promise<LicenseValidationResult> {
    // Return cached validation if available
    if (this.validationResult) {
      return this.validationResult;
    }
    
    // Return in-flight validation promise if one exists
    if (this.validationPromise) {
      return this.validationPromise;
    }
    
    // Start new validation
    this.validationPromise = this._performValidation();
    this.validationResult = await this.validationPromise;
    this.validationPromise = null;
    
    return this.validationResult;
  }
  
  /**
   * Internal validation method
   */
  private async _performValidation(): Promise<LicenseValidationResult> {
    const license = this.getLicense();
    
    if (!license) {
      return {
        isValid: false,
        isExpired: false,
        daysRemaining: null,
        features: [],
        errorMessage: 'No license file found. Please install a valid license to use this application.',
      };
    }
    
    const result = await validateLicense(license);
    
    // Don't cache the result - always validate fresh
    return result;
  }
  
  /**
   * Force revalidation (clears cache)
   */
  public async revalidate(): Promise<LicenseValidationResult> {
    this.validationResult = null;
    this.validationPromise = null;
    localStorage.removeItem(LICENSE_VALIDATION_KEY);
    return this.validateCurrentLicense();
  }
  
  /**
   * Import license from a file
   */
  public async importLicenseFile(file: File): Promise<LicenseValidationResult> {
    try {
      const text = await file.text();
      const licenseData: LicenseData = JSON.parse(text);
      
      // Validate the license before saving
      const validation = await validateLicense(licenseData);
      
      if (!validation.isValid) {
        throw new Error(validation.errorMessage || 'Invalid license file');
      }
      
      // Save the license
      this.saveLicense(licenseData);
      this.validationResult = validation;
      
      return validation;
    } catch (error) {
      console.error('Failed to import license:', error);
      throw new Error(`Failed to import license: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Export current license to a JSON string
   */
  public exportLicense(): string | null {
    const license = this.getLicense();
    if (!license) {
      return null;
    }
    return JSON.stringify(license, null, 2);
  }
  
  /**
   * Check if a license is currently loaded and valid
   */
  public async isLicenseValid(): Promise<boolean> {
    const validation = await this.validateCurrentLicense();
    return validation.isValid;
  }
  
  /**
   * Get the current validation result (cached)
   */
  public getCachedValidation(): LicenseValidationResult | null {
    return this.validationResult;
  }
}

// Export singleton instance
export const licenseManager = LicenseManager.getInstance();
