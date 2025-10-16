import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Building2, 
  User, 
  CreditCard, 
  Hash, 
  MapPin, 
  Smartphone,
  ArrowLeft,
  Save,
  CheckCircle,
  AlertCircle,
  Shield,
  Clock,
  IndianRupee,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import PaymentStatusTag from "@/components/payments/PaymentStatusTag";
import type { PaymentStatus } from "@/components/payments/PaymentStatusTag";

interface BankDetailsForm {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
  branchName: string;
  upiId: string;
}

const BankDetails = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [hasExistingDetails, setHasExistingDetails] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("pending");
  const [pendingPaymentAmount, setPendingPaymentAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [transactionProofUrl, setTransactionProofUrl] = useState<string | null>(null);
  const [isTransactionProofModalOpen, setIsTransactionProofModalOpen] = useState(false);
  const [formData, setFormData] = useState<BankDetailsForm>({
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "",
    branchName: "",
    upiId: ""
  });
  const [errors, setErrors] = useState<Partial<Record<keyof BankDetailsForm, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof BankDetailsForm, boolean>>>({});

  // Load existing bank details and payment status on mount
  useEffect(() => {
    const loadBankDetails = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        
        // Load bank details from database
        const { data: bankDetails, error: bankError } = await supabase
          .from('worker_bank_details')
          .select('*')
          .eq('worker_id', user.id)
          .single();

        if (bankError && bankError.code !== 'PGRST116') { // PGRST116 = no rows found
          throw bankError;
        }

        if (bankDetails) {
          console.log('Loading existing bank details for user:', user.id, bankDetails);
          setFormData({
            bankName: bankDetails.bank_name || "",
            accountHolderName: bankDetails.account_holder_name || "",
            accountNumber: bankDetails.account_number || "",
            confirmAccountNumber: bankDetails.account_number || "",
            ifscCode: bankDetails.ifsc_code || "",
            branchName: bankDetails.branch_name || "",
            upiId: bankDetails.upi_id || ""
          });
          setHasExistingDetails(true);
        } else {
          console.log('No existing bank details found for user:', user.id);
        }

        // Load payment status from database
        const { data: paymentRecords, error: paymentError } = await supabase
          .from('task_payment_records')
          .select('amount, payment_status')
          .eq('worker_id', user.id)
          .in('payment_status', ['pending', 'processing']);

        if (paymentRecords && paymentRecords.length > 0) {
          const totalPendingAmount = paymentRecords.reduce((sum, record) => sum + parseFloat(record.amount), 0);
          setPaymentStatus("pending");
          setPendingPaymentAmount(totalPendingAmount);
        } else {
          // Check if there are completed payments
          const { data: completedPayments } = await supabase
            .from('task_payment_records')
            .select('id')
            .eq('worker_id', user.id)
            .eq('payment_status', 'completed')
            .limit(1);

          if (completedPayments && completedPayments.length > 0) {
            setPaymentStatus("completed");
            // Load transaction proof for completed payment
            loadTransactionProof(completedPayments[0].id);
          } else {
            setPaymentStatus("pending");
          }
        }

      } catch (error) {
        console.error('Error loading bank details:', error);
        toast({
          title: "Error",
          description: "Failed to load bank details. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    const loadTransactionProof = async (paymentRecordId: string) => {
      try {
        const { data: transactionProof, error } = await supabase
          .from('transaction_proofs')
          .select('file_url, file_name, file_type')
          .eq('payment_record_id', paymentRecordId)
          .single();

        if (error) {
          console.log('No transaction proof found:', error.message);
          return;
        }

        if (transactionProof?.file_url) {
          setTransactionProofUrl(transactionProof.file_url);
        }
      } catch (error) {
        console.error('Error loading transaction proof:', error);
      }
    };

    loadBankDetails();
  }, [user?.id]);

  // IFSC Code validation (Format: ABCD0123456 - 4 letters, 7 digits with 5th character as 0)
  const validateIFSC = (ifsc: string): boolean => {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return ifscRegex.test(ifsc.toUpperCase());
  };

  // Account Number validation (8-18 digits)
  const validateAccountNumber = (accountNumber: string): boolean => {
    const accountRegex = /^[0-9]{8,18}$/;
    return accountRegex.test(accountNumber);
  };

  // UPI ID validation (optional, format: username@bankname)
  const validateUPI = (upi: string): boolean => {
    if (!upi) return true; // Optional field
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    return upiRegex.test(upi);
  };

  const handleInputChange = (field: keyof BankDetailsForm, value: string) => {
    // Auto-uppercase for IFSC code
    const processedValue = field === 'ifscCode' ? value.toUpperCase() : value;
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBlur = (field: keyof BankDetailsForm) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (field: keyof BankDetailsForm): boolean => {
    const value = formData[field];
    let error = "";

    switch (field) {
      case 'bankName':
        if (!value.trim()) error = "Bank name is required";
        break;
      case 'accountHolderName':
        if (!value.trim()) error = "Account holder name is required";
        break;
      case 'accountNumber':
        if (!value.trim()) {
          error = "Account number is required";
        } else if (!validateAccountNumber(value)) {
          error = "Account number must be 8-18 digits";
        }
        break;
      case 'confirmAccountNumber':
        if (!value.trim()) {
          error = "Please confirm your account number";
        } else if (value !== formData.accountNumber) {
          error = "Account numbers do not match";
        }
        break;
      case 'ifscCode':
        if (!value.trim()) {
          error = "IFSC code is required";
        } else if (!validateIFSC(value)) {
          error = "Invalid IFSC code format (e.g., SBIN0001234)";
        }
        break;
      case 'upiId':
        if (value && !validateUPI(value)) {
          error = "Invalid UPI ID format (e.g., username@bank)";
        }
        break;
    }

    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
      return false;
    }
    return true;
  };

  const validateForm = (): boolean => {
    const requiredFields: (keyof BankDetailsForm)[] = [
      'bankName', 
      'accountHolderName', 
      'accountNumber', 
      'confirmAccountNumber',
      'ifscCode'
    ];
    
    let isValid = true;
    const newErrors: Partial<Record<keyof BankDetailsForm, string>> = {};

    // Validate all required fields
    requiredFields.forEach(field => {
      if (!validateField(field)) {
        isValid = false;
      }
    });

    // Validate optional fields if filled
    if (formData.upiId && !validateUPI(formData.upiId)) {
      newErrors.upiId = "Invalid UPI ID format";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      bankName: true,
      accountHolderName: true,
      accountNumber: true,
      confirmAccountNumber: true,
      ifscCode: true,
      branchName: true,
      upiId: true
    });

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix all errors before saving.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      const bankDetailsData = {
        worker_id: user.id,
        bank_name: formData.bankName,
        account_holder_name: formData.accountHolderName,
        account_number: formData.accountNumber,
        ifsc_code: formData.ifscCode.toUpperCase(),
        branch_name: formData.branchName || null,
        upi_id: formData.upiId || null,
      };

      // Check if bank details already exist
      const { data: existing } = await supabase
        .from('worker_bank_details')
        .select('id')
        .eq('worker_id', user.id)
        .single();

      console.log('Existing bank details check for user:', user.id, existing);

      let result;
      if (existing) {
        // Update existing record
        console.log('Updating existing bank details...');
        result = await supabase
          .from('worker_bank_details')
          .update(bankDetailsData)
          .eq('worker_id', user.id)
          .select()
          .single();
      } else {
        // Insert new record
        console.log('Inserting new bank details...');
        result = await supabase
          .from('worker_bank_details')
          .insert(bankDetailsData)
          .select()
          .single();
      }

      console.log('Bank details save result:', result);

      if (result.error) throw result.error;

      // Create audit log
      await supabase.rpc('create_payment_audit_log', {
        p_action_type: existing ? 'bank_details_updated' : 'bank_details_added',
        p_action_description: existing ? 'Bank details updated' : 'Bank details added',
        p_worker_id: user.id,
        p_metadata: { bank_name: formData.bankName }
      });

      setHasExistingDetails(true);
      
      toast({
        title: hasExistingDetails ? "Bank Details Updated!" : "Bank Details Saved!",
        description: hasExistingDetails 
          ? "Your bank details have been updated successfully." 
          : "Your bank details have been saved successfully.",
        duration: 4000
      });

    } catch (error: any) {
      console.error('Error saving bank details:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save bank details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData({
      bankName: "",
      accountHolderName: "",
      accountNumber: "",
      confirmAccountNumber: "",
      ifscCode: "",
      branchName: "",
      upiId: ""
    });
    setErrors({});
    setTouched({});
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CreditCard className="h-8 w-8 text-primary" />
              Bank Details
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your bank account information for payments
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/worker">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Payment Status Section */}
        {hasExistingDetails && (
          <Card className={`${
            paymentStatus === 'completed' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  {paymentStatus === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="space-y-2 flex-1">
                    <p className={`text-sm font-medium ${
                      paymentStatus === 'completed' ? 'text-green-900' : 'text-yellow-900'
                    }`}>
                      {paymentStatus === 'completed' ? 'Payment Received' : 'Awaiting Employer Payment'}
                    </p>
                    <p className={`text-sm ${
                      paymentStatus === 'completed' ? 'text-green-700' : 'text-yellow-700'
                    }`}>
                      {paymentStatus === 'completed' 
                        ? 'Your payment has been successfully processed and credited to your account.' 
                        : 'Your bank details are visible to the employer after task approval. Payment will be processed soon.'
                      }
                    </p>
                    {pendingPaymentAmount > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <IndianRupee className={`h-4 w-4 ${
                          paymentStatus === 'completed' ? 'text-green-600' : 'text-yellow-600'
                        }`} />
                        <span className={`font-semibold ${
                          paymentStatus === 'completed' ? 'text-green-900' : 'text-yellow-900'
                        }`}>
                          ₹{pendingPaymentAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <PaymentStatusTag status={paymentStatus} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transaction Proof Section - Only show for completed payments */}
        {paymentStatus === 'completed' && transactionProofUrl && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <FileText className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <p className="text-sm font-medium text-green-900">
                      Transaction Proof Available
                    </p>
                    <p className="text-sm text-green-700">
                      The employer has uploaded a transaction proof for your payment. You can view it to confirm the payment details.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-green-100 text-green-700 border-green-300 hover:bg-green-200"
                  onClick={() => setIsTransactionProofModalOpen(true)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Proof
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Notice */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900">
                  Your information is secure
                </p>
                <p className="text-sm text-blue-700">
                  Your bank details are encrypted and will only be used for payment processing. 
                  We never share your financial information with third parties.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Form Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Bank Account Information</CardTitle>
                <CardDescription className="mt-1">
                  Enter your bank details to receive payments for completed tasks
                </CardDescription>
              </div>
              {hasExistingDetails && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Saved
                </Badge>
              )}
            </div>
          </CardHeader>
          
          <Separator />
          
          <CardContent className="p-6">
            <form onSubmit={handleSave} className="space-y-6">
              {/* Bank Name */}
              <div className="space-y-2">
                <Label htmlFor="bankName" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Bank Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="bankName"
                  placeholder="e.g., State Bank of India, HDFC Bank"
                  value={formData.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  onBlur={() => handleBlur('bankName')}
                  className={errors.bankName && touched.bankName ? "border-red-500" : ""}
                />
                {errors.bankName && touched.bankName && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.bankName}
                  </p>
                )}
              </div>

              {/* Account Holder Name */}
              <div className="space-y-2">
                <Label htmlFor="accountHolderName" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Account Holder Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="accountHolderName"
                  placeholder="Name as per bank account"
                  value={formData.accountHolderName}
                  onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                  onBlur={() => handleBlur('accountHolderName')}
                  className={errors.accountHolderName && touched.accountHolderName ? "border-red-500" : ""}
                />
                {errors.accountHolderName && touched.accountHolderName && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.accountHolderName}
                  </p>
                )}
              </div>

              {/* Account Number & Confirm */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountNumber" className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    Account Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="accountNumber"
                    type="text"
                    placeholder="Enter account number"
                    value={formData.accountNumber}
                    onChange={(e) => handleInputChange('accountNumber', e.target.value.replace(/\D/g, ''))}
                    onBlur={() => handleBlur('accountNumber')}
                    maxLength={18}
                    className={errors.accountNumber && touched.accountNumber ? "border-red-500" : ""}
                  />
                  {errors.accountNumber && touched.accountNumber && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.accountNumber}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmAccountNumber">
                    Confirm Account Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="confirmAccountNumber"
                    type="text"
                    placeholder="Re-enter account number"
                    value={formData.confirmAccountNumber}
                    onChange={(e) => handleInputChange('confirmAccountNumber', e.target.value.replace(/\D/g, ''))}
                    onBlur={() => handleBlur('confirmAccountNumber')}
                    maxLength={18}
                    className={errors.confirmAccountNumber && touched.confirmAccountNumber ? "border-red-500" : ""}
                  />
                  {errors.confirmAccountNumber && touched.confirmAccountNumber && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.confirmAccountNumber}
                    </p>
                  )}
                </div>
              </div>

              {/* IFSC Code & Branch Name */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ifscCode" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    IFSC Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ifscCode"
                    placeholder="e.g., SBIN0001234"
                    value={formData.ifscCode}
                    onChange={(e) => handleInputChange('ifscCode', e.target.value)}
                    onBlur={() => handleBlur('ifscCode')}
                    maxLength={11}
                    className={errors.ifscCode && touched.ifscCode ? "border-red-500" : ""}
                  />
                  {errors.ifscCode && touched.ifscCode && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.ifscCode}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    11 characters (4 letters + 0 + 6 alphanumeric)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branchName" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Branch Name <span className="text-muted-foreground text-xs">(Optional)</span>
                  </Label>
                  <Input
                    id="branchName"
                    placeholder="e.g., Main Branch, Delhi"
                    value={formData.branchName}
                    onChange={(e) => handleInputChange('branchName', e.target.value)}
                  />
                </div>
              </div>

              {/* UPI ID */}
              <div className="space-y-2">
                <Label htmlFor="upiId" className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  UPI ID <span className="text-muted-foreground text-xs">(Optional)</span>
                </Label>
                <Input
                  id="upiId"
                  placeholder="e.g., yourname@paytm, 9876543210@ybl"
                  value={formData.upiId}
                  onChange={(e) => handleInputChange('upiId', e.target.value.toLowerCase())}
                  onBlur={() => handleBlur('upiId')}
                  className={errors.upiId && touched.upiId ? "border-red-500" : ""}
                />
                {errors.upiId && touched.upiId && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.upiId}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  For faster payments (format: username@bankname)
                </p>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1 sm:flex-initial"
                  disabled={isSaving || paymentStatus === 'completed'}
                >
                  {isSaving ? (
                    <>
                      <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {hasExistingDetails ? "Updating..." : "Saving..."}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {hasExistingDetails ? "Update Details" : "Save Details"}
                    </>
                  )}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleReset}
                  disabled={isSaving || paymentStatus === 'completed'}
                  className="flex-1 sm:flex-initial"
                >
                  Reset Form
                </Button>
              </div>

              {/* Payment Completed Notice */}
              {paymentStatus === 'completed' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-800">
                    Bank details cannot be edited after payment completion. Contact admin for changes.
                  </p>
                </div>
              )}

              {/* Helper Text */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  Important Information
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                  <li>Ensure all details match your bank records exactly</li>
                  <li>Double-check your account number to avoid payment delays</li>
                  <li>IFSC code can be found on your cheque book or bank passbook</li>
                  <li>UPI ID is optional but enables faster payment processing</li>
                  <li>You can update your bank details anytime from this page</li>
                </ul>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Transaction Proof Modal */}
        {transactionProofUrl && (
          <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isTransactionProofModalOpen ? 'block' : 'hidden'}`}>
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  Transaction Proof
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTransactionProofModalOpen(false)}
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    This is the transaction proof uploaded by your employer. You can view or download this file to verify your payment details.
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <Button
                    onClick={() => window.open(transactionProofUrl, '_blank')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Transaction Proof
                  </Button>
                </div>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-600 text-center">
                    File URL: {transactionProofUrl}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default BankDetails;


