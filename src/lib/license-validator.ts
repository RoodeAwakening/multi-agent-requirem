/**
 * License Validator
 * 
 * Handles cryptographic validation of license files using RSA signatures.
 * The license file is signed with a private key, and the application verifies
 * the signature using an embedded public key.
 * 
 * Security Features:
 * - RSA-2048 signature verification
 * - Tamper detection through signature validation
 * - Expiration date checking
 * - Feature-based access control
 */

import type { LicenseData, LicenseValidationResult, RequiredFeature } from './license-types';

/**
 * Public key for license verification (embedded in application)
 * 
 * This is the public key corresponding to the private key used to sign licenses.
 * In a production environment, this would be your actual public key.
 * 
 * Note: This is a development/example key. Generate your own key pair for production.
 */
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyVwKq8cJYq0h7XGZxqWw
kzr3KYvjF8J1LwI4R7K4F5qU8XJm8fF3E7qE5zGLvQ8XcR2tKwH9F4Z7cT6Y3J8Q
qR5LcP7T3dF6qD9mR8wK4L5T2hV9F3xQ7dR5mP8wT4K9F2qH5xL7cR3mT8wP4K9F
6qU8XJm8fF3E7qE5zGLvQ8XcR2tKwH9F4Z7cT6Y3J8QqR5LcP7T3dF6qD9mR8wK4
L5T2hV9F3xQ7dR5mP8wT4K9F2qH5xL7cR3mT8wP4K9F6qU8XJm8fF3E7qE5zGLvQ
8XcR2tKwH9F4Z7cT6Y3J8QqR5LcP7T3dF6qD9mR8wK4L5T2hV9F3xQ7dR5mP8wT4
K9F2qH5xL7cR3mT8wP4K9FQIDAQAB
-----END PUBLIC KEY-----`;

/**
 * Convert a string to ArrayBuffer for crypto operations
 */
function str2ab(str: string): ArrayBuffer {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0; i < str.length; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Import the public key for verification
 */
async function importPublicKey(): Promise<CryptoKey> {
  // Remove the header and footer from the PEM key
  const pemContents = PUBLIC_KEY
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s/g, '');
  
  const binaryDer = base64ToArrayBuffer(pemContents);
  
  return await crypto.subtle.importKey(
    'spki',
    binaryDer,
    {
      name: 'RSA-PSS',
      hash: 'SHA-256',
    },
    true,
    ['verify']
  );
}

/**
 * Create a canonical string representation of license data for signing/verification
 */
function canonicalizeLicenseData(data: Omit<LicenseData, 'signature'>): string {
  // Create a deterministic string representation by sorting keys
  const canonical = {
    customerId: data.customerId,
    customerName: data.customerName,
    expiryDate: data.expiryDate,
    issuedDate: data.issuedDate,
    licenseType: data.licenseType,
    allowedFeatures: [...data.allowedFeatures].sort(),
    maxVersions: data.maxVersions || null,
  };
  
  return JSON.stringify(canonical);
}

/**
 * Verify the signature of a license file
 */
async function verifySignature(data: Omit<LicenseData, 'signature'>, signature: string): Promise<boolean> {
  try {
    const publicKey = await importPublicKey();
    const canonical = canonicalizeLicenseData(data);
    const dataBuffer = str2ab(canonical);
    const signatureBuffer = base64ToArrayBuffer(signature);
    
    const isValid = await crypto.subtle.verify(
      {
        name: 'RSA-PSS',
        saltLength: 32,
      },
      publicKey,
      signatureBuffer,
      dataBuffer
    );
    
    return isValid;
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * Check if a date string represents a date in the past
 */
function isExpired(expiryDate: string): boolean {
  const expiry = new Date(expiryDate);
  const now = new Date();
  return expiry < now;
}

/**
 * Calculate days remaining until expiry
 */
function daysRemaining(expiryDate: string): number {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Validate a license and return the validation result
 */
export async function validateLicense(licenseData: LicenseData): Promise<LicenseValidationResult> {
  // Check if signature exists
  if (!licenseData.signature) {
    return {
      isValid: false,
      isExpired: false,
      daysRemaining: null,
      features: [],
      errorMessage: 'License file is missing signature. This license is not valid.',
    };
  }
  
  // Verify cryptographic signature
  const { signature, ...dataWithoutSignature } = licenseData;
  const signatureValid = await verifySignature(dataWithoutSignature, signature);
  
  if (!signatureValid) {
    return {
      isValid: false,
      isExpired: false,
      daysRemaining: null,
      features: [],
      errorMessage: 'License signature verification failed. This license may have been tampered with.',
    };
  }
  
  // Check expiration
  const expired = isExpired(licenseData.expiryDate);
  const remaining = daysRemaining(licenseData.expiryDate);
  
  if (expired) {
    return {
      isValid: false,
      isExpired: true,
      daysRemaining: remaining,
      features: licenseData.allowedFeatures,
      errorMessage: `License expired on ${new Date(licenseData.expiryDate).toLocaleDateString()}. Please renew your license to continue using this application.`,
      customerId: licenseData.customerId,
      licenseType: licenseData.licenseType,
    };
  }
  
  // License is valid
  return {
    isValid: true,
    isExpired: false,
    daysRemaining: remaining,
    features: licenseData.allowedFeatures,
    customerId: licenseData.customerId,
    licenseType: licenseData.licenseType,
  };
}

/**
 * Check if a specific feature is enabled in the license
 */
export function hasFeature(validationResult: LicenseValidationResult, feature: RequiredFeature): boolean {
  if (!validationResult.isValid) {
    return false;
  }
  
  return validationResult.features.includes(feature);
}

/**
 * Check if license allows access to AI API
 */
export function canAccessAI(validationResult: LicenseValidationResult): boolean {
  return hasFeature(validationResult, 'ai_api_access');
}

/**
 * Check if license allows pipeline execution
 */
export function canExecutePipeline(validationResult: LicenseValidationResult): boolean {
  return hasFeature(validationResult, 'pipeline_execution');
}

/**
 * Get a user-friendly license status message
 */
export function getLicenseStatusMessage(validationResult: LicenseValidationResult): string {
  if (!validationResult.isValid) {
    return validationResult.errorMessage || 'License is invalid';
  }
  
  if (validationResult.daysRemaining !== null) {
    if (validationResult.daysRemaining <= 7) {
      return `⚠️ License expires in ${validationResult.daysRemaining} day${validationResult.daysRemaining !== 1 ? 's' : ''}`;
    }
    if (validationResult.daysRemaining <= 30) {
      return `License expires in ${validationResult.daysRemaining} days`;
    }
  }
  
  return '✓ License active';
}
