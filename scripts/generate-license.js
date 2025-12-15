#!/usr/bin/env node

/**
 * License Generator Script
 * 
 * This is a development tool for generating signed license files.
 * In production, this would be run by the license vendor/provider.
 * 
 * This script generates an RSA key pair and signs license data.
 * The public key should be embedded in the application.
 * The private key should be kept secure and used only for signing licenses.
 * 
 * Usage:
 *   node scripts/generate-license.js [output-file]
 * 
 * Example:
 *   node scripts/generate-license.js my-license.json
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { createInterface } from 'readline';
import crypto from 'crypto';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

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
  console.log('\n=== I.A.N. License Generator ===\n');
  
  const outputFile = process.argv[2] || 'license.json';
  const keyFile = 'license-keys.json';
  
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
    console.log('\n⚠️  IMPORTANT: Update the PUBLIC_KEY constant in src/lib/license-validator.ts\n');
  }
  
  // Gather license information
  console.log('Enter license details:\n');
  
  const customerId = await question('Customer ID: ');
  const customerName = await question('Customer Name: ');
  
  console.log('\nLicense Type:');
  console.log('  1. Trial');
  console.log('  2. Commercial');
  console.log('  3. Enterprise');
  const licenseTypeChoice = await question('Select (1-3): ');
  const licenseTypes = ['trial', 'commercial', 'enterprise'];
  const licenseType = licenseTypes[parseInt(licenseTypeChoice) - 1] || 'trial';
  
  const daysValid = await question('Days valid (e.g., 30, 365): ');
  const issuedDate = new Date().toISOString();
  const expiryDate = new Date(Date.now() + parseInt(daysValid) * 24 * 60 * 60 * 1000).toISOString();
  
  console.log('\nSelect features to enable:');
  console.log('  1. ai_api_access (required for AI operations)');
  console.log('  2. pipeline_execution (required for running pipelines)');
  console.log('  3. pdf_export');
  console.log('  4. version_management');
  console.log('  5. file_upload');
  const featuresInput = await question('Enter feature numbers (comma-separated, e.g., 1,2,3,4,5): ');
  
  const allFeatures = ['ai_api_access', 'pipeline_execution', 'pdf_export', 'version_management', 'file_upload'];
  const selectedIndices = featuresInput.split(',').map(s => parseInt(s.trim()) - 1);
  const allowedFeatures = selectedIndices
    .filter(i => i >= 0 && i < allFeatures.length)
    .map(i => allFeatures[i]);
  
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
  
  console.log('\n✅ License generated successfully!');
  console.log(`   File: ${outputFile}`);
  console.log(`   Customer: ${customerName} (${customerId})`);
  console.log(`   Type: ${licenseType}`);
  console.log(`   Valid until: ${new Date(expiryDate).toLocaleDateString()}`);
  console.log(`   Features: ${allowedFeatures.join(', ')}`);
  console.log('\nYou can now import this license file in the application settings.\n');
  
  rl.close();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
