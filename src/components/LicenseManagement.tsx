/**
 * License Management Component
 * 
 * UI for managing application licenses including:
 * - Viewing current license status
 * - Importing new licenses
 * - Displaying license information
 */

import { useState, useRef } from "react";
import { useLicense } from "@/lib/license-context";
import { licenseManager } from "@/lib/license-manager";
import type { LicenseData } from "@/lib/license-types";
import { getLicenseStatusMessage } from "@/lib/license-validator";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Upload } from "@phosphor-icons/react/dist/csr/Upload";
import { Certificate } from "@phosphor-icons/react/dist/csr/Certificate";
import { Calendar } from "@phosphor-icons/react/dist/csr/Calendar";
import { User } from "@phosphor-icons/react/dist/csr/User";
import { Shield } from "@phosphor-icons/react/dist/csr/Shield";
import { Warning } from "@phosphor-icons/react/dist/csr/Warning";

export function LicenseManagement() {
  const { validation, isLoading, revalidate } = useLicense();
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleImportLicense = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    try {
      const result = await licenseManager.importLicenseFile(file);
      
      if (result.isValid) {
        toast.success("License imported successfully!", {
          description: `Valid until ${new Date(licenseManager.getLicense()?.expiryDate || '').toLocaleDateString()}`,
        });
        await revalidate();
      } else {
        toast.error("Invalid license file", {
          description: result.errorMessage,
        });
      }
    } catch (error) {
      toast.error("Failed to import license", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsImporting(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
  
  const handleRemoveLicense = () => {
    licenseManager.removeLicense();
    toast.info("License removed");
    revalidate();
  };
  
  const licenseData = licenseManager.getLicense();
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">License Status</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Manage your application license for continued access to features.
        </p>
      </div>
      
      <Separator />
      
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Validating license...</div>
        </div>
      ) : validation && validation.isValid ? (
        <div className="space-y-4">
          {/* License Status Badge */}
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" weight="fill" />
            <Badge variant="default" className="bg-green-600">
              {getLicenseStatusMessage(validation)}
            </Badge>
            {validation.daysRemaining !== null && validation.daysRemaining <= 30 && (
              <Badge variant="outline" className="border-yellow-600 text-yellow-600">
                Expiring Soon
              </Badge>
            )}
          </div>
          
          {/* License Details */}
          {licenseData && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <Label className="text-sm font-medium">Customer</Label>
                  <p className="text-sm text-muted-foreground">{licenseData.customerName}</p>
                  <p className="text-xs text-muted-foreground">ID: {licenseData.customerId}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Certificate className="w-5 h-5 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <Label className="text-sm font-medium">License Type</Label>
                  <p className="text-sm text-muted-foreground capitalize">{licenseData.licenseType}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <Label className="text-sm font-medium">Validity Period</Label>
                  <p className="text-sm text-muted-foreground">
                    Issued: {new Date(licenseData.issuedDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Expires: {new Date(licenseData.expiryDate).toLocaleDateString()}
                  </p>
                  {validation.daysRemaining !== null && (
                    <p className="text-sm font-medium mt-1">
                      {validation.daysRemaining} days remaining
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <Label className="text-sm font-medium">Enabled Features</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {validation.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
            >
              <Upload className="w-4 h-4 mr-2" />
              Update License
            </Button>
            <Button
              variant="outline"
              onClick={handleRemoveLicense}
            >
              Remove License
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* No Valid License */}
          <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
            <Warning className="w-5 h-5 mt-0.5 text-yellow-600" weight="fill" />
            <div className="flex-1">
              <p className="font-medium text-sm">No Valid License</p>
              <p className="text-sm text-muted-foreground mt-1">
                {validation?.errorMessage || "Please install a valid license to use this application."}
              </p>
            </div>
          </div>
          
          {/* Import License */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Import License File</Label>
            <p className="text-sm text-muted-foreground">
              Select a valid license file (.json) to activate the application.
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isImporting ? "Importing..." : "Select License File"}
            </Button>
          </div>
        </div>
      )}
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImportLicense}
        className="hidden"
      />
      
      <Separator />
      
      {/* License Information */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">About Licenses</h4>
        <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
          <li>License files are cryptographically signed to prevent tampering</li>
          <li>A valid license is required to access AI features and pipeline execution</li>
          <li>Contact your vendor for license renewal or support</li>
          <li>Your license data is stored locally on your device</li>
        </ul>
      </div>
    </div>
  );
}
