/**
 * License System Test
 * 
 * Simple test to verify license validation works correctly.
 * This is a manual test script - run with: node scripts/test-license.js
 */

import { readFileSync } from 'fs';

// Simulate the license validation logic
import crypto from 'crypto';

const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtmwryHdEY4HrHvKbDHdF
IVB5vQuCa7WcDJw6tfZFPQxc8QxeRfLIeOfIlYR6S8Jblt3w5PleDmrGI/6uoAU8
HCryhbSlMckJ0PvpsYTssoFD5nlhS2jqC+uZRvqEl1eFAH2A99Yi3Xhu8jOOkyZi
Iu4coYm7WsNy3dl4dvpgKLgaCpwhCCN0DZDmZvBpS7HUji9yD8KSoqZhX6D9KoZR
teL+zL9nFp4sP005XZ6SW0uUOinrL3bCqKlxGt0+WL8V/buvF+/pIXhvK8181TT1
5eGABf8ad/hVSwnEjacoaYztZlrCAw52atixxxvWqVMRPUndkunmbm4Qzuxzm1cf
bwIDAQAB
-----END PUBLIC KEY-----`;

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

function verifySignature(data, signature) {
  try {
    const canonical = canonicalizeLicenseData(data);
    
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(canonical);
    verify.end();
    
    const isValid = verify.verify({
      key: PUBLIC_KEY,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: 32
    }, signature, 'base64');
    
    return isValid;
  } catch (error) {
    console.error('Verification error:', error);
    return false;
  }
}

function testLicense(filename) {
  console.log(`\n=== Testing License: ${filename} ===\n`);
  
  try {
    // Read license file
    const licenseData = JSON.parse(readFileSync(filename, 'utf8'));
    
    console.log('License Details:');
    console.log(`  Customer: ${licenseData.customerName} (${licenseData.customerId})`);
    console.log(`  Type: ${licenseData.licenseType}`);
    console.log(`  Issued: ${new Date(licenseData.issuedDate).toLocaleDateString()}`);
    console.log(`  Expires: ${new Date(licenseData.expiryDate).toLocaleDateString()}`);
    console.log(`  Features: ${licenseData.allowedFeatures.join(', ')}`);
    
    // Verify signature
    console.log('\nSignature Verification:');
    const { signature, ...dataWithoutSignature } = licenseData;
    const isValid = verifySignature(dataWithoutSignature, signature);
    
    if (isValid) {
      console.log('  ✅ Signature is VALID');
    } else {
      console.log('  ❌ Signature is INVALID');
    }
    
    // Check expiration
    console.log('\nExpiration Check:');
    const now = new Date();
    const expiry = new Date(licenseData.expiryDate);
    const daysRemaining = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    
    if (expiry > now) {
      console.log(`  ✅ License is active (${daysRemaining} days remaining)`);
    } else {
      console.log(`  ❌ License has EXPIRED (${Math.abs(daysRemaining)} days ago)`);
    }
    
    // Overall result
    console.log('\nOverall Result:');
    if (isValid && expiry > now) {
      console.log('  ✅ License is VALID and ACTIVE');
    } else {
      console.log('  ❌ License is NOT VALID');
    }
    
  } catch (error) {
    console.error('Error testing license:', error.message);
  }
}

// Test the generated license
const licenseFile = process.argv[2] || 'test-license.json';
testLicense(licenseFile);

console.log('\n=== Testing Tamper Detection ===\n');

// Test tampered license
try {
  const licenseData = JSON.parse(readFileSync(licenseFile, 'utf8'));
  
  // Tamper with the data
  const { signature, ...dataWithoutSignature } = licenseData;
  const tamperedData = { ...dataWithoutSignature, customerName: 'TAMPERED NAME' };
  
  console.log('Testing license with tampered customer name...');
  const isValid = verifySignature(tamperedData, signature);
  
  if (isValid) {
    console.log('  ❌ SECURITY ISSUE: Tampered license passed validation!');
  } else {
    console.log('  ✅ Tamper detection working: Invalid signature detected');
  }
} catch (error) {
  console.error('Error in tamper test:', error.message);
}

console.log('\n');
