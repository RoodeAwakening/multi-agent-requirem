# License Enforcement Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         I.A.N. Application                               │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │                    User Interface Layer                         │   │
│  │                                                                  │   │
│  │  ┌──────────────────┐        ┌─────────────────────────────┐  │   │
│  │  │  Settings Dialog │───────▶│  LicenseManagement.tsx      │  │   │
│  │  │                  │        │                             │  │   │
│  │  │  - License Tab   │        │  - Import License           │  │   │
│  │  │  - View Status   │        │  - Display Status           │  │   │
│  │  └──────────────────┘        │  - Show Features            │  │   │
│  │                               │  - Warning Messages         │  │   │
│  │                               └─────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                   │                                    │
│                                   ▼                                    │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │                 License Context Provider                        │   │
│  │                   (license-context.tsx)                         │   │
│  │                                                                  │   │
│  │  - Wraps entire application                                     │   │
│  │  - Provides license state via React Context                     │   │
│  │  - Validates on startup                                         │   │
│  │  - Exposes useLicense() hook                                    │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                   │                                    │
│                                   ▼                                    │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │                   License Manager (Singleton)                   │   │
│  │                    (license-manager.ts)                         │   │
│  │                                                                  │   │
│  │  - loadLicense()        ───────▶  localStorage                  │   │
│  │  - saveLicense()        ◀───────  (browser storage)             │   │
│  │  - validateCurrentLicense()                                     │   │
│  │  - importLicenseFile()                                          │   │
│  │  - getCachedValidation()                                        │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                   │                                    │
│                                   ▼                                    │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │                  License Validator                              │   │
│  │                (license-validator.ts)                           │   │
│  │                                                                  │   │
│  │  ┌───────────────────────────────────────────────────────┐     │   │
│  │  │  1. Check signature exists                            │     │   │
│  │  │  2. Verify RSA-2048 signature ───▶ [Public Key]      │     │   │
│  │  │  3. Check expiration date                             │     │   │
│  │  │  4. Return validation result                          │     │   │
│  │  └───────────────────────────────────────────────────────┘     │   │
│  │                                                                  │   │
│  │  Embedded Public Key (RSA-2048):                                │   │
│  │  ┌────────────────────────────────────────────────┐            │   │
│  │  │  -----BEGIN PUBLIC KEY-----                     │            │   │
│  │  │  MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB...      │            │   │
│  │  │  -----END PUBLIC KEY-----                       │            │   │
│  │  └────────────────────────────────────────────────┘            │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                   │                                    │
│                                   ▼                                    │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │              AI Client (ai-client.ts)                           │   │
│  │                                                                  │   │
│  │  Before each AI API call:                                       │   │
│  │  ┌──────────────────────────────────────────────────────────┐  │   │
│  │  │  1. await licenseManager.validateCurrentLicense()        │  │   │
│  │  │  2. if (!validation.isValid)                             │  │   │
│  │  │      throw Error("License Error")                        │  │   │
│  │  │  3. if (!canAccessAI(validation))                        │  │   │
│  │  │      throw Error("Feature not licensed")                 │  │   │
│  │  │  4. Proceed with API call                                │  │   │
│  │  └──────────────────────────────────────────────────────────┘  │   │
│  │                                  │                               │   │
│  │                                  ▼                               │   │
│  │                      ┌────────────────────┐                     │   │
│  │                      │  Gemini/OpenAI API │                     │   │
│  │                      └────────────────────┘                     │   │
│  └────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                       License Generation (Vendor)                        │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  scripts/generate-license.js  (Interactive)                     │    │
│  │  scripts/quick-license.js     (Quick/Automated)                 │    │
│  │                                                                  │    │
│  │  1. Load or generate RSA key pair                               │    │
│  │  2. Collect license data (customer, dates, features)            │    │
│  │  3. Canonicalize data (deterministic JSON)                      │    │
│  │  4. Sign with private key (RSA-PSS, SHA-256)                    │    │
│  │  5. Create license.json file                                    │    │
│  │                                                                  │    │
│  │  Private Key: ┌─────────────────────────────────┐               │    │
│  │               │  -----BEGIN PRIVATE KEY-----     │               │    │
│  │               │  MIIEvAIBADANBgkqhkiG9w0B...   │               │    │
│  │               │  -----END PRIVATE KEY-----       │               │    │
│  │               └─────────────────────────────────┘               │    │
│  │               (KEEP SECURE - DO NOT DISTRIBUTE)                 │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                   │                                     │
│                                   ▼                                     │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                    License File (license.json)                  │    │
│  │                                                                  │    │
│  │  {                                                               │    │
│  │    "customerId": "CUST-001",                                    │    │
│  │    "customerName": "Acme Corp",                                 │    │
│  │    "expiryDate": "2026-12-31T23:59:59.999Z",                    │    │
│  │    "issuedDate": "2025-01-01T00:00:00.000Z",                    │    │
│  │    "licenseType": "commercial",                                 │    │
│  │    "allowedFeatures": [                                         │    │
│  │      "ai_api_access",                                           │    │
│  │      "pipeline_execution",                                      │    │
│  │      "pdf_export",                                              │    │
│  │      "version_management",                                      │    │
│  │      "file_upload"                                              │    │
│  │    ],                                                            │    │
│  │    "maxVersions": null,                                         │    │
│  │    "signature": "UPe0mWrXr3XFJsSaV5CWw4B..."                    │    │
│  │  }                                                               │    │
│  │                                                                  │    │
│  │  Distribute to Customer ───────────────────────────────────▶   │    │
│  └────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                       Security Features                                  │
│                                                                          │
│  ✓ RSA-2048 Cryptographic Signatures (Industry Standard)                │
│  ✓ Tamper Detection (Any modification invalidates signature)            │
│  ✓ Multiple Validation Checkpoints (Startup + API calls)                │
│  ✓ Feature-Based Access Control                                         │
│  ✓ Expiration Date Enforcement                                          │
│  ✓ Clear Error Messages (No confusion)                                  │
│  ✓ No Hidden Behavior (Transparent)                                     │
│  ✓ Public Key Embedded in Code (No external dependencies)               │
│                                                                          │
│  Known Limitations:                                                      │
│  ⚠ Client-side enforcement can be bypassed by code modification         │
│  ⚠ Suitable for honest customers and compliance tracking                │
│  ⚠ Not suitable for preventing determined adversaries                   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                       Data Flow                                          │
│                                                                          │
│  Application Start:                                                      │
│    1. LicenseProvider mounts                                             │
│    2. Loads license from localStorage                                    │
│    3. Validates signature and expiration                                 │
│    4. Stores validation result in context                                │
│    5. Makes result available to entire app                               │
│                                                                          │
│  User Imports License:                                                   │
│    1. User selects .json file in Settings                                │
│    2. File content parsed as JSON                                        │
│    3. License validated (signature + expiration)                         │
│    4. If valid: saved to localStorage                                    │
│    5. If invalid: error message displayed                                │
│    6. Context revalidates and updates                                    │
│                                                                          │
│  AI API Call:                                                            │
│    1. callAI() invoked by pipeline                                       │
│    2. License validation performed                                       │
│    3. Check: isValid?                                                    │
│    4. Check: hasFeature('ai_api_access')?                               │
│    5. If both pass: proceed with API call                                │
│    6. If either fails: throw clear error                                 │
└─────────────────────────────────────────────────────────────────────────┘
```
