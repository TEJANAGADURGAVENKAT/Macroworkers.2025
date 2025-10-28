import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BankDetailsValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasBankDetails: boolean;
  onAddBankDetails?: () => void;
}

export const BankDetailsValidationModal = ({
  isOpen,
  onClose,
  hasBankDetails,
  onAddBankDetails
}: BankDetailsValidationModalProps) => {
  const navigate = useNavigate();

  const handleAddBankDetails = () => {
    if (onAddBankDetails) {
      onAddBankDetails();
    } else {
      navigate("/worker/profile/bank-details");
    }
    onClose();
  };

  if (hasBankDetails) {
    return (
      <AlertDialog open={isOpen} onOpenChange={onClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Bank Details Verified
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your bank details are set up correctly. You can proceed with your task submission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={onClose}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Bank Details Required
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              You need to add your bank details before you can receive payments for completed tasks.
            </p>
            <p className="text-sm text-muted-foreground">
              Without bank details, employers cannot process your payments. Please add your banking information to continue.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onClose}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleAddBankDetails}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Add Bank Details
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};


