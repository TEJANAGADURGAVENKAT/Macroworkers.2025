import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Zap,
  GraduationCap,
  FileCheck,
  IdCard,
  Loader2,
  Trash2,
  Eye,
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface DocumentType {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  required: boolean;
}

interface UploadedDocument {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  verification_notes?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

interface UploadProgress {
  [key: string]: {
    progress: number;
    status: 'uploading' | 'uploaded' | 'error';
    error?: string;
  };
}

interface FileHistory {
  id: string;
  file_name: string;
  uploaded_at: string;
  status: 'replaced' | 'current';
}

const DocumentUpload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, loading } = useAuth();
  const [uploading, setUploading] = useState<string | null>(null);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [fileHistory, setFileHistory] = useState<FileHistory[]>([]);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [replaceConfirm, setReplaceConfirm] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const documentTypes: DocumentType[] = [
    {
      key: '10th_certificate',
      label: '10th Certificate',
      description: 'Upload your 10th standard certificate or marksheet',
      icon: GraduationCap,
      required: true
    },
    {
      key: '12th_certificate',
      label: '12th Certificate',
      description: 'Upload your 12th standard certificate or marksheet',
      icon: GraduationCap,
      required: true
    },
    {
      key: 'graduation_certificate',
      label: 'Graduation Certificate',
      description: 'Upload your graduation degree or diploma certificate',
      icon: GraduationCap,
      required: true
    },
    {
      key: 'resume',
      label: 'Resume / CV',
      description: 'Upload your latest resume or curriculum vitae',
      icon: FileText,
      required: true
    },
    {
      key: 'kyc_document',
      label: 'KYC / Government ID',
      description: 'Upload Aadhar card, Passport, or other government ID proof',
      icon: IdCard,
      required: true
    }
  ];

  // File validation constants
  const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ];

  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
  const MAX_FILENAME_LENGTH = 100;

  useEffect(() => {
    if (!loading && user) {
      loadDocuments();
    }
  }, [user, loading]);

  useEffect(() => {
    // Redirect non-workers or users without proper access
    if (!loading && profile && profile.role !== 'worker') {
      navigate('/signin');
    }
  }, [profile, loading, navigate]);

  const loadDocuments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('worker_documents')
        .select('*')
        .eq('worker_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDocuments(data || []);
      
      // Build file history
      const history: FileHistory[] = (data || []).map(doc => ({
        id: doc.id,
        file_name: doc.file_name,
        uploaded_at: doc.created_at,
        status: 'current'
      }));
      setFileHistory(history);
    } catch (error: any) {
      console.error('Error loading documents:', error);
      toast({
        title: "Error loading documents",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoadingDocuments(false);
    }
  };

  // File validation
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Please upload PDF, DOC, DOCX, PNG, or JPG files only.`
      };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size too large. Maximum size is 20MB.`
      };
    }

    // Check filename length
    if (file.name.length > MAX_FILENAME_LENGTH) {
      return {
        valid: false,
        error: `Filename too long. Maximum length is ${MAX_FILENAME_LENGTH} characters.`
      };
    }

    return { valid: true };
  };

  // Simulate chunked upload progress
  const simulateChunkedUpload = useCallback((documentType: string, file: File) => {
    return new Promise<void>((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15; // Random progress increments
        
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setUploadProgress(prev => ({
            ...prev,
            [documentType]: { progress: 100, status: 'uploaded' }
          }));
          resolve();
        } else {
          setUploadProgress(prev => ({
            ...prev,
            [documentType]: { progress, status: 'uploading' }
          }));
        }
      }, 200);
    });
  }, []);

  const handleFileUpload = async (file: File, documentType: string) => {
    if (!user) return;

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      toast({
        title: "Invalid file",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    // Check if document already exists
    const existingDoc = documents.find(doc => doc.document_type === documentType);
    if (existingDoc) {
      setReplaceConfirm(documentType);
      return;
    }

    await performUpload(file, documentType);
  };

  const performUpload = async (file: File, documentType: string) => {
    if (!user) return;

    setUploading(documentType);
    setUploadProgress(prev => ({
      ...prev,
      [documentType]: { progress: 0, status: 'uploading' }
    }));

    try {
      // Start chunked upload simulation
      const uploadPromise = simulateChunkedUpload(documentType, file);
      
      // Upload file to storage
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('worker-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Wait for progress simulation to complete
      await uploadPromise;

      // Check if document already exists for this type
      const existingDoc = documents.find(doc => doc.document_type === documentType);

      if (existingDoc) {
        // Add to history as replaced
        setFileHistory(prev => [
          ...prev.map(h => h.id === existingDoc.id ? { ...h, status: 'replaced' } : h),
          {
            id: existingDoc.id,
            file_name: existingDoc.file_name,
            uploaded_at: existingDoc.created_at,
            status: 'replaced'
          }
        ]);

        // Update existing document
        const { error: updateError } = await supabase
          .from('worker_documents')
          .update({
            file_name: fileName,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type,
            verification_status: 'pending',
            verification_notes: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingDoc.id);

        if (updateError) throw updateError;
      } else {
        // Create new document record
        const { error: insertError } = await supabase
          .from('worker_documents')
          .insert({
            worker_id: user.id,
            document_type: documentType,
            file_name: fileName,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type,
            verification_status: 'pending'
          });

        if (insertError) throw insertError;
      }

      // Add to history
      setFileHistory(prev => [
        ...prev,
        {
          id: `${Date.now()}-${documentType}`,
          file_name: fileName,
          uploaded_at: new Date().toISOString(),
          status: 'current'
        }
      ]);

      toast({
        title: "Document uploaded successfully",
        description: "Your document has been uploaded and is under review",
      });

      // Reload documents
      await loadDocuments();

    } catch (error: any) {
      console.error('Error uploading document:', error);
      setUploadProgress(prev => ({
        ...prev,
        [documentType]: { progress: 0, status: 'error', error: error.message }
      }));
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(null);
      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[documentType];
          return newProgress;
        });
      }, 2000);
    }
  };

  const handleReplaceConfirm = async (file: File, documentType: string) => {
    setReplaceConfirm(null);
    await performUpload(file, documentType);
  };

  const handleDragOver = (e: React.DragEvent, documentType: string) => {
    e.preventDefault();
    setDragOver(documentType);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
  };

  const handleDrop = (e: React.DragEvent, documentType: string) => {
    e.preventDefault();
    setDragOver(null);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0], documentType);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0], documentType);
    }
  };

  const removeDocument = async (documentType: string) => {
    if (!user) return;

    const doc = documents.find(d => d.document_type === documentType);
    if (!doc) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('worker-documents')
        .remove([doc.file_path]);

      if (storageError) console.error('Storage deletion error:', storageError);

      // Delete from database
      const { error: dbError } = await supabase
        .from('worker_documents')
        .delete()
        .eq('id', doc.id);

      if (dbError) throw dbError;

      toast({
        title: "Document removed",
        description: "Document has been removed successfully",
      });

      // Reload documents
      await loadDocuments();

    } catch (error: any) {
      console.error('Error removing document:', error);
      toast({
        title: "Error removing document",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getDocumentStatus = (documentType: string) => {
    const doc = documents.find(d => d.document_type === documentType);
    return doc?.verification_status || null;
  };

  const getDocumentFileName = (documentType: string) => {
    const doc = documents.find(d => d.document_type === documentType);
    return doc?.file_name || null;
  };

  const getVerificationNotes = (documentType: string) => {
    const doc = documents.find(d => d.document_type === documentType);
    return doc?.verification_notes || null;
  };

  const getDocumentFileSize = (documentType: string) => {
    const doc = documents.find(d => d.document_type === documentType);
    return doc?.file_size || 0;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (documentType: string) => {
    const status = getDocumentStatus(documentType);
    const progress = uploadProgress[documentType];
    
    if (progress?.status === 'uploading') {
      return {
        label: 'Uploading...',
        variant: 'secondary' as const,
        className: 'bg-primary/20 text-primary border-primary',
        icon: Loader2
      };
    }
    
    if (progress?.status === 'error') {
      return {
        label: 'Upload Failed',
        variant: 'destructive' as const,
        className: 'bg-destructive/20 text-destructive border-destructive',
        icon: XCircle
      };
    }

    switch (status) {
      case 'approved':
        return {
          label: 'Approved',
          variant: 'secondary' as const,
          className: 'bg-success/20 text-success border-success',
          icon: CheckCircle
        };
      case 'rejected':
        return {
          label: 'Rejected',
          variant: 'destructive' as const,
          className: 'bg-destructive/20 text-destructive border-destructive',
          icon: XCircle
        };
      case 'pending':
        return {
          label: 'Under Review',
          variant: 'secondary' as const,
          className: 'bg-warning/20 text-warning border-warning',
          icon: Clock
        };
      default:
        return {
          label: 'Not Uploaded',
          variant: 'secondary' as const,
          className: 'bg-muted/20 text-muted-foreground border-muted',
          icon: Upload
        };
    }
  };

  const getUploadProgress = () => {
    const uploadedCount = documentTypes.filter(type => getDocumentStatus(type.key)).length;
    return (uploadedCount / documentTypes.length) * 100;
  };

  const canProceed = () => {
    return documentTypes.every(type => getDocumentStatus(type.key));
  };

  const handleProceed = () => {
    if (canProceed()) {
      navigate('/worker');
    }
  };

  const triggerFileInput = (documentType: string) => {
    const input = fileInputRefs.current[documentType];
    if (input) {
      input.click();
    }
  };

  if (loading || loadingDocuments) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Macroworkers
            </span>
          </div>
          
          <h1 className="text-3xl font-bold mb-2">Document Upload</h1>
          <p className="text-muted-foreground mb-4">
            Upload all required documents to complete your registration
          </p>
          
          <div className="max-w-md mx-auto">
            <Progress value={getUploadProgress()} className="mb-2" />
            <p className="text-sm text-muted-foreground">
              {documentTypes.filter(type => getDocumentStatus(type.key)).length} of {documentTypes.length} documents uploaded
            </p>
          </div>
        </motion.div>

        {/* Document Upload Cards */}
        <div className="grid gap-6 mb-8">
          {documentTypes.map((docType, index) => {
            const status = getDocumentStatus(docType.key);
            const fileName = getDocumentFileName(docType.key);
            const fileSize = getDocumentFileSize(docType.key);
            const notes = getVerificationNotes(docType.key);
            const progress = uploadProgress[docType.key];
            const statusBadge = getStatusBadge(docType.key);
            const Icon = docType.icon;
            const StatusIcon = statusBadge.icon;

            return (
              <motion.div
                key={docType.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`border-2 transition-all duration-300 ${
                  status === 'approved' ? 'border-success bg-success/5' :
                  status === 'rejected' ? 'border-destructive bg-destructive/5' :
                  status === 'pending' ? 'border-warning bg-warning/5' :
                  dragOver === docType.key ? 'border-primary bg-primary/5' :
                  'border-muted hover:border-muted-foreground/30'
                }`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg transition-colors ${
                          status === 'approved' ? 'bg-success/20' :
                          status === 'rejected' ? 'bg-destructive/20' :
                          status === 'pending' ? 'bg-warning/20' :
                          dragOver === docType.key ? 'bg-primary/20' :
                          'bg-muted'
                        }`}>
                          <Icon className={`h-5 w-5 transition-colors ${
                            status === 'approved' ? 'text-success' :
                            status === 'rejected' ? 'text-destructive' :
                            status === 'pending' ? 'text-warning' :
                            dragOver === docType.key ? 'text-primary' :
                            'text-muted-foreground'
                          }`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {docType.label}
                            {docType.required && <span className="text-red-500">*</span>}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">{docType.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Badge variant={statusBadge.variant} className={statusBadge.className}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusBadge.label}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* File Info */}
                    {fileName && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <FileCheck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{fileName}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(fileSize)} • Uploaded {formatDistanceToNow(new Date(documents.find(d => d.document_type === docType.key)?.created_at || ''))} ago
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => triggerFileInput(docType.key)}
                              className="text-primary hover:text-primary"
                              disabled={uploading === docType.key}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument(docType.key)}
                              className="text-destructive hover:text-destructive"
                              disabled={uploading === docType.key}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Progress Bar */}
                    {progress && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-2"
                      >
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {progress.status === 'uploading' ? 'Uploading...' : 'Processing...'}
                          </span>
                          <span className="font-medium">{Math.round(progress.progress)}%</span>
                        </div>
                        <Progress value={progress.progress} className="h-2" />
                        {progress.status === 'error' && (
                          <p className="text-sm text-destructive">{progress.error}</p>
                        )}
                      </motion.div>
                    )}

                    {/* Rejection Notes */}
                    {notes && status === 'rejected' && (
                      <Alert className="border-destructive bg-destructive/5">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <AlertDescription className="text-destructive">
                          <strong>Rejection Reason:</strong> {notes}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Upload Area */}
                    <div
                      className={`relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg transition-all duration-300 cursor-pointer group ${
                        dragOver === docType.key 
                          ? 'border-primary bg-primary/5 scale-105' 
                          : 'border-muted hover:border-muted-foreground/50 hover:bg-muted/30'
                      } ${uploading === docType.key ? 'pointer-events-none opacity-50' : ''}`}
                      onDragOver={(e) => handleDragOver(e, docType.key)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, docType.key)}
                      onClick={() => triggerFileInput(docType.key)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          triggerFileInput(docType.key);
                        }
                      }}
                      aria-label={`Upload ${docType.label}`}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <AnimatePresence mode="wait">
                          {uploading === docType.key ? (
                            <motion.div
                              key="uploading"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="flex flex-col items-center"
                            >
                              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                              <p className="text-sm font-medium text-primary">Uploading...</p>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="upload"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="flex flex-col items-center"
                            >
                              <Upload className="h-8 w-8 text-muted-foreground mb-2 group-hover:text-primary transition-colors" />
                              <p className="mb-1 text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                                {fileName ? 'Replace file' : 'Click to upload'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                or drag and drop
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <p className="text-xs text-muted-foreground mt-2">
                          PDF, DOC, DOCX, PNG, JPG (MAX. 20MB)
                        </p>
                      </div>
                      
                      <input
                        ref={(el) => fileInputRefs.current[docType.key] = el}
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                        onChange={(e) => handleFileInputChange(e, docType.key)}
                        disabled={uploading === docType.key}
                        aria-describedby={`file-help-${docType.key}`}
                      />
                    </div>
                    
                    <p id={`file-help-${docType.key}`} className="text-xs text-muted-foreground text-center">
                      Supported formats: PDF, DOC, DOCX, PNG, JPG. Maximum file size: 20MB
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center space-x-4"
        >
          {canProceed() ? (
            <Button
              onClick={handleProceed}
              className="bg-gradient-primary hover:bg-primary-dark px-8"
              size="lg"
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Complete Registration
            </Button>
          ) : (
            <Alert className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please upload all required documents to proceed. Your documents will be reviewed by our team.
              </AlertDescription>
            </Alert>
          )}
        </motion.div>

        {/* Replace Confirmation Dialog */}
        <Dialog open={!!replaceConfirm} onOpenChange={() => setReplaceConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Replace Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>You already have a document uploaded for this category. Do you want to replace it?</p>
              <div className="flex space-x-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setReplaceConfirm(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    // This will be handled by the file input change
                    setReplaceConfirm(null);
                  }}
                >
                  Replace
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default DocumentUpload;
