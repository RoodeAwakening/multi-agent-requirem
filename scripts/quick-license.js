#!/usr/bin/env node

/**
 * Quick License Generator (Non-interactive)
 * 
 * Generates a test license with default values for development testing.
 * 
 * Usage:
 *   node scripts/quick-license.js
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import crypto from 'crypto';

/**
 * Generate RSA key pair
 */
function generateKeyPair() {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
}

/**
 * Sign license data
 */
function signLicenseData(data, privateKey) {
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(data);
  sign.end();
  return sign.sign({
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: 32
  }, 'base64');
}

/**
 * Create canonical license data string (must match frontend implementation)
 */
function canonicalizeLicenseData(data) {
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

async function main() {
  console.log('\n=== Quick License Generator ===\n');
  
  const outputFile = 'test-license.json';
  const keyFile = 'license-keys.json';
  const DEFAULT_VALIDITY_DAYS = 365;
  
  // Check if keys already exist
  let publicKey, privateKey;
  if (existsSync(keyFile)) {
    console.log('Loading existing key pair from', keyFile);
    const keys = JSON.parse(readFileSync(keyFile, 'utf8'));
    publicKey = keys.publicKey;
    privateKey = keys.privateKey;
  } else {
    console.log('Generating new RSA key pair...');
    const keyPair = generateKeyPair();
    publicKey = keyPair.publicKey;
    privateKey = keyPair.privateKey;
    
    // Save keys
    writeFileSync(keyFile, JSON.stringify({ publicKey, privateKey }, null, 2));
    console.log('Keys saved to', keyFile);
    console.log('\n⚠️  IMPORTANT: Update the PUBLIC_KEY constant in src/lib/license-validator.ts');
    console.log('\nPublic Key:');
    console.log(publicKey);
    console.log('\n');
  }
  
  // Default license values
  const customerId = 'DEMO-001';
  const customerName = 'Demo Customer Inc.';
  const licenseType = 'commercial';
  const daysValid = DEFAULT_VALIDITY_DAYS;
  const issuedDate = new Date().toISOString();
  const expiryDate = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000).toISOString();
  const allowedFeatures = ['ai_api_access', 'pipeline_execution', 'pdf_export', 'version_management', 'file_upload'];
  
  // Build license data
  const licenseData = {
    customerId,
    customerName,
    expiryDate,
    issuedDate,
    licenseType,
    allowedFeatures,
    maxVersions: null,
  };
  
  // Sign the license
  const canonical = canonicalizeLicenseData(licenseData);
  const signature = signLicenseData(canonical, privateKey);
  
  const signedLicense = {
    ...licenseData,
    signature
  };
  
  // Write license file
  writeFileSync(outputFile, JSON.stringify(signedLicense, null, 2));
  
  console.log('✅ License generated successfully!');
  console.log(`   File: ${outputFile}`);
  console.log(`   Customer: ${customerName} (${customerId})`);
  console.log(`   Type: ${licenseType}`);
  console.log(`   Valid until: ${new Date(expiryDate).toLocaleDateString()}`);
  console.log(`   Features: ${allowedFeatures.join(', ')}`);
  console.log('\nYou can now import this license file in the application settings.\n');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
