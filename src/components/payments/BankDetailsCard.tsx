import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, 
  User, 
  Hash, 
  CreditCard, 
  MapPin, 
  Smartphone,
  Copy,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BankDetails {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName?: string;
  upiId?: string;
}

interface BankDetailsCardProps {
  bankDetails: BankDetails;
  workerName?: string;
  showTitle?: boolean;
  compact?: boolean;
}

const BankDetailsCard = ({ 
  bankDetails, 
  workerName, 
  showTitle = true,
  compact = false 
}: BankDetailsCardProps) => {
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast({
        title: "Copied!",
        description: `${fieldName} copied to clipboard`,
        duration: 2000
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 w-6 p-0"
      onClick={() => handleCopy(text, field)}
    >
      {copiedField === field ? (
        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
      )}
    </Button>
  );

  if (compact) {
    return (
      <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
        {workerName && (
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{workerName}</span>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs mb-1">Account Holder</p>
            <p className="font-medium">{bankDetails.accountHolderName}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Bank</p>
            <p className="font-medium">{bankDetails.bankName}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Account Number</p>
            <div className="flex items-center gap-1">
              <p className="font-mono text-sm">{bankDetails.accountNumber}</p>
              <CopyButton text={bankDetails.accountNumber} field="Account Number" />
            </div>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">IFSC Code</p>
            <div className="flex items-center gap-1">
              <p className="font-mono text-sm">{bankDetails.ifscCode}</p>
              <CopyButton text={bankDetails.ifscCode} field="IFSC Code" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="shadow-lg border-muted">
      {showTitle && (
        <>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              {workerName ? `${workerName}'s Bank Details` : "Bank Account Details"}
            </CardTitle>
            {workerName && (
              <Badge variant="outline" className="w-fit mt-2 bg-blue-50 text-blue-700 border-blue-200">
                Read-Only
              </Badge>
            )}
          </CardHeader>
          <Separator />
        </>
      )}
      
      <CardContent className={showTitle ? "p-6" : "p-4"}>
        <div className="space-y-4">
          {/* Account Holder Name */}
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Account Holder Name</p>
              <p className="text-base font-medium mt-1">{bankDetails.accountHolderName}</p>
            </div>
          </div>

          {/* Bank Name */}
          <div className="flex items-start gap-3">
            <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Bank Name</p>
              <p className="text-base font-medium mt-1">{bankDetails.bankName}</p>
            </div>
          </div>

          {/* Account Number */}
          <div className="flex items-start gap-3">
            <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Account Number</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-base font-mono font-medium">{bankDetails.accountNumber}</p>
                <CopyButton text={bankDetails.accountNumber} field="Account Number" />
              </div>
            </div>
          </div>

          {/* IFSC Code */}
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">IFSC Code</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-base font-mono font-medium">{bankDetails.ifscCode}</p>
                <CopyButton text={bankDetails.ifscCode} field="IFSC Code" />
              </div>
            </div>
          </div>

          {/* Branch Name */}
          {bankDetails.branchName && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Branch Name</p>
                <p className="text-base font-medium mt-1">{bankDetails.branchName}</p>
              </div>
            </div>
          )}

          {/* UPI ID */}
          {bankDetails.upiId && (
            <div className="flex items-start gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">UPI ID</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-base font-medium">{bankDetails.upiId}</p>
                  <CopyButton text={bankDetails.upiId} field="UPI ID" />
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BankDetailsCard;


