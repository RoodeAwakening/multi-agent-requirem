# License Enforcement System

## Overview

This application implements a cryptographic license enforcement mechanism to control continued use based on an active commercial license. The system is designed for locally-run applications where the client has access to the source code.

## Architecture

### Components

1. **License File Structure** (`src/lib/license-types.ts`)
   - Contains license metadata (customer info, expiry date, features)
   - Cryptographically signed with RSA-2048 signature
   - JSON format for easy portability

2. **License Validator** (`src/lib/license-validator.ts`)
   - Verifies RSA signature using embedded public key
   - Checks expiration dates
   - Validates feature access
   - Tamper-resistant through cryptographic verification

3. **License Manager** (`src/lib/license-manager.ts`)
   - Singleton pattern for consistent state management
   - Handles license loading, storage, and caching
   - Provides import/export functionality

4. **License Context** (`src/lib/license-context.tsx`)
   - React context for application-wide license state
   - Provides hooks for components to check license status
   - Automatic validation on app startup

5. **AI Client Integration** (`src/lib/ai-client.ts`)
   - Validates license before each API call
   - Blocks AI access if license is invalid or expired
   - Returns clear error messages for license issues

6. **UI Components** (`src/components/LicenseManagement.tsx`)
   - Settings panel for license management
   - Import license files
   - View license status and details
   - User-friendly error messages

## Security Features

### Cryptographic Protection

- **RSA-2048 Signatures**: License files are signed with RSA-2048 PSS padding
- **Public Key Embedding**: Public key is embedded in the application code
- **Signature Verification**: All licenses are verified before use
- **Tamper Detection**: Any modification to license data invalidates the signature

### Protection Against Bypass

1. **Code Integration**: License checks are integrated throughout the codebase
2. **Multiple Checkpoints**: Validation occurs at:
   - Application startup
   - Before AI API calls
   - In feature-gated UI components
3. **No Local Database**: License stored in localStorage (browser storage)
4. **Cannot be easily removed**: Requires code modification to bypass

### Limitations (Acknowledged)

Since this is a client-side application with visible source code:
- Determined users can modify the code to bypass checks
- This system provides **commercial friction**, not absolute protection
- Suitable for **honest customers** and **license compliance tracking**
- Not suitable for preventing determined adversaries

## License File Format

```json
{
  "customerId": "CUST-12345",
  "customerName": "Acme Corporation",
  "expiryDate": "2025-12-31T23:59:59.999Z",
  "issuedDate": "2025-01-01T00:00:00.000Z",
  "licenseType": "commercial",
  "allowedFeatures": [
    "ai_api_access",
    "pipeline_execution",
    "pdf_export",
    "version_management",
    "file_upload"
  ],
  "maxVersions": null,
  "signature": "Base64EncodedRSASignature..."
}
```

## Features System

The license controls access to the following features:

- `ai_api_access`: Required for making AI API calls
- `pipeline_execution`: Required for running multi-agent pipelines
- `pdf_export`: Enables PDF export functionality
- `version_management`: Allows creating multiple versions of tasks
- `file_upload`: Enables file upload and reference materials

## Failure Modes

### Invalid License
- **Trigger**: Missing license, invalid signature, or tampered data
- **Behavior**: Application displays error message, blocks AI features
- **User Action**: Import a valid license file

### Expired License
- **Trigger**: Current date exceeds expiry date
- **Behavior**: Application blocks access to licensed features
- **User Action**: Contact vendor for license renewal

### Missing Features
- **Trigger**: License doesn't include required feature
- **Behavior**: Specific features are disabled
- **User Action**: Upgrade license to include needed features

### License Expiring Soon
- **Trigger**: Less than 30 days until expiration
- **Behavior**: Warning badge displayed in license settings
- **User Action**: Plan for license renewal

## Usage

### For End Users

1. **Installing a License**:
   - Open Settings → License tab
   - Click "Select License File"
   - Choose your license file (.json)
   - Application validates and activates the license

2. **Checking License Status**:
   - Open Settings → License tab
   - View license details, expiry date, and enabled features

3. **Renewing a License**:
   - Contact your vendor for a new license file
   - Import the new license file (overwrites the old one)

### For Vendors/Administrators

1. **Generating Licenses**:
   ```bash
   node scripts/generate-license.js customer-license.json
   ```
   Follow the prompts to create a signed license file.

2. **Key Management**:
   - Private key: Keep secure, use only for signing licenses
   - Public key: Embedded in application code
   - Keys stored in `license-keys.json` (DO NOT distribute)

3. **Distributing Licenses**:
   - Send the generated `.json` file to customers
   - Provide instructions for importing the license
   - Store customer license records for support

## Implementation Details

### Key Generation

The license generator script creates an RSA-2048 key pair:
```javascript
crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
})
```

### Signature Creation

License data is canonicalized (deterministic JSON) and signed:
```javascript
const signature = crypto.sign('RSA-SHA256', buffer, {
  key: privateKey,
  padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
  saltLength: 32
})
```

### Signature Verification

The application verifies signatures using the embedded public key:
```javascript
const isValid = await crypto.subtle.verify(
  { name: 'RSA-PSS', saltLength: 32 },
  publicKey,
  signatureBuffer,
  dataBuffer
)
```

## Best Practices

### For Development

1. **Generate Dev Keys**: Create a test key pair for development
2. **Test All Scenarios**: Valid, expired, tampered, and missing licenses
3. **Clear Error Messages**: Help users understand license issues
4. **Graceful Degradation**: Application should inform, not crash

### For Production

1. **Secure Key Storage**: Keep private keys in secure, offline storage
2. **Key Rotation**: Plan for periodic key rotation
3. **License Tracking**: Maintain records of issued licenses
4. **Customer Support**: Provide clear license renewal process
5. **Documentation**: Include license installation instructions

### For Security

1. **No Backdoors**: No hidden license bypass mechanisms
2. **Transparent Behavior**: License requirements clearly documented
3. **Regular Updates**: Update public key if private key is compromised
4. **Audit Trail**: Log license validation attempts (optional)

## Compliance

This license enforcement system follows software licensing best practices:

- ✅ **Transparent**: License requirements are clearly documented
- ✅ **Non-deceptive**: No hidden behavior or undisclosed limitations
- ✅ **Standard Practices**: Uses industry-standard cryptography (RSA)
- ✅ **User Control**: Users can view and manage their licenses
- ✅ **Clear Communication**: Error messages explain what's needed

## Maintenance

### Updating the Public Key

If the private key is compromised:

1. Generate a new key pair with the license generator
2. Update `PUBLIC_KEY` in `src/lib/license-validator.ts`
3. Rebuild and redistribute the application
4. Re-issue all customer licenses with the new key

### Adding New Features

1. Add feature constant to `src/lib/license-types.ts`
2. Update license generator to include new feature
3. Add feature checks in relevant code locations
4. Update documentation

## Support

For license-related issues:

1. **Invalid License**: Verify file format and signature
2. **Expired License**: Contact vendor for renewal
3. **Feature Access**: Check license includes required features
4. **Import Errors**: Ensure file is valid JSON format

## Appendix: Example License Generation

```bash
$ node scripts/generate-license.js demo-license.json

=== I.A.N. License Generator ===

Enter license details:

Customer ID: DEMO-001
Customer Name: Demo Customer Inc.
License Type:
  1. Trial
  2. Commercial
  3. Enterprise
Select (1-3): 2
Days valid (e.g., 30, 365): 365
Select features to enable:
  1. ai_api_access (required for AI operations)
  2. pipeline_execution (required for running pipelines)
  3. pdf_export
  4. version_management
  5. file_upload
Enter feature numbers (comma-separated, e.g., 1,2,3,4,5): 1,2,3,4,5

✅ License generated successfully!
   File: demo-license.json
   Customer: Demo Customer Inc. (DEMO-001)
   Type: commercial
   Valid until: 12/15/2025
   Features: ai_api_access, pipeline_execution, pdf_export, version_management, file_upload
```
