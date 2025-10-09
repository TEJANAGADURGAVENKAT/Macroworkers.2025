import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import EmployerStatus from "@/components/employer/EmployerStatus";
import { 
  Upload, 
  X, 
  CheckCircle, 
  FileText, 
  Building2, 
  Shield, 
  User, 
  Camera,
  AlertCircle
} from "lucide-react";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

interface DocumentSection {
  id: string;
  title: string;
  description: string;
  required: boolean;
  icon: React.ComponentType<any>;
  uploadedFile: UploadedFile | null;
}

const EmployerVerificationPage = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [showStatus, setShowStatus] = useState(false);
  // Document type mapping for employer documents to worker document types
  const documentTypeMapping: Record<string, string> = {
    "cin": "10th_certificate",
    "moa": "12th_certificate", 
    "aoa": "graduation_certificate",
    "dsc": "resume",
    "din": "kyc_document",
    "photographs": "resume" // Use resume for photographs to avoid conflicts
  };

  const [documents, setDocuments] = useState<DocumentSection[]>([
    {
      id: "cin",
      title: "CIN – Company Incorporation Details",
      description: "Certificate of Incorporation from Ministry of Corporate Affairs",
      required: true,
      icon: Building2,
      uploadedFile: null
    },
    {
      id: "moa",
      title: "Memorandum of Association (MoA)",
      description: "Legal document defining company's constitution and objectives",
      required: true,
      icon: FileText,
      uploadedFile: null
    },
    {
      id: "aoa",
      title: "Articles of Association (AoA)",
      description: "Rules and regulations for internal management of the company",
      required: true,
      icon: FileText,
      uploadedFile: null
    },
    {
      id: "dsc",
      title: "Digital Signature Certificate (DSC)",
      description: "Digital certificate for secure online transactions",
      required: true,
      icon: Shield,
      uploadedFile: null
    },
    {
      id: "din",
      title: "Director Identification Number (DIN)",
      description: "Unique identification number for company directors",
      required: true,
      icon: User,
      uploadedFile: null
    },
    {
      id: "photographs",
      title: "Photographs – Directors/Shareholders",
      description: "Passport-sized photos of all directors and major shareholders",
      required: true,
      icon: Camera,
      uploadedFile: null
    }
  ]);

  // Load existing documents and check status
  useEffect(() => {
    if (user && profile) {
      loadExistingDocuments();
      
      // Only show status component if employer is already approved or rejected
      // Allow upload for: verification_pending, document_upload_pending, and other pending statuses
      const shouldShowStatus = profile.worker_status === 'active_employee' || profile.worker_status === 'rejected';
      setShowStatus(shouldShowStatus);
    }
  }, [user, profile]);

  const loadExistingDocuments = async () => {
    if (!user) return;

    try {
      // Load existing documents from database using type assertion
      const { data: existingDocs, error } = await supabase
        .from('worker_documents' as any)
        .select('document_type, file_name, file_path, verification_status')
        .eq('worker_id', user.id);

      if (error) {
        console.error('Error loading existing documents:', error);
        return;
      }

      // Update documents state with existing files
      if (existingDocs && existingDocs.length > 0) {
        setDocuments(prevDocs => 
          prevDocs.map(doc => {
            // Find matching document by mapping employer doc ID to worker document type
            const mappedType = documentTypeMapping[doc.id];
            const existingDoc = (existingDocs as any[]).find((d: any) => d.document_type === mappedType);
            
            if (existingDoc) {
              return {
                ...doc,
                uploadedFile: {
                  id: existingDoc.document_type,
                  name: existingDoc.file_name,
                  size: 0, // Size not stored in DB
                  type: 'application/pdf' // Default type
                }
              };
            }
            return doc;
          })
        );
      }
    } catch (error) {
      console.error('Error loading existing documents:', error);
      // Don't show error to user, just log it
      // This allows the page to still work even if document loading fails
    }
  };

  const handleFileUpload = useCallback(async (documentId: string, file: File) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upload files.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }

    // Debug: Log file information
    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    });

    // Check file type by extension as fallback
    const fileExt = file.name.toLowerCase().split('.').pop();
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
    const allowedMimeTypes = [
      'application/pdf',
      'application/x-pdf',
      'application/acrobat',
      'applications/vnd.pdf',
      'text/pdf',
      'text/x-pdf',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];
    
    const isValidByExtension = allowedExtensions.includes(fileExt || '');
    const isValidByMimeType = allowedMimeTypes.includes(file.type);
    
    // Special case: if file type is empty but extension is valid, allow it
    const isValidEmptyType = !file.type && isValidByExtension;
    
    if (!isValidByExtension && !isValidByMimeType && !isValidEmptyType) {
      // For debugging: show what we got
      console.log('File validation failed:', {
        fileName: file.name,
        fileType: file.type,
        fileExt: fileExt,
        isValidByExtension,
        isValidByMimeType,
        isValidEmptyType
      });
      
      toast({
        title: "Invalid File Type",
        description: `File type "${file.type || 'unknown'}" or extension ".${fileExt}" not allowed. Please upload PDF, JPEG, or PNG files only.`,
        variant: "destructive"
      });
      return;
    }
    
    // Log successful validation
    console.log('File validation passed:', {
      fileName: file.name,
      fileType: file.type,
      fileExt: fileExt,
      isValidByExtension,
      isValidByMimeType,
      isValidEmptyType
    });

    try {
      // Set uploading state
      setUploadingFiles(prev => new Set([...prev, documentId]));
      
      // Create unique file path
      const fileName = `${documentId}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('employer-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('employer-documents')
        .getPublicUrl(filePath);

      // Store in database (using existing worker_documents table structure)
      const mappedDocumentType = documentTypeMapping[documentId] || '10th_certificate';
      
      console.log('Document type mapping:', {
        originalId: documentId,
        mappedType: mappedDocumentType,
        fileName: file.name
      });
      
      const { error: dbError } = await supabase
        .from('worker_documents' as any)
        .insert({
          worker_id: user.id,
          document_type: mappedDocumentType, // Using mapped document type
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          upload_status: 'uploaded',
          verification_status: 'pending'
        });

      if (dbError) {
        // If database insert fails, clean up the uploaded file
        await supabase.storage
          .from('employer-documents')
          .remove([filePath]);
        throw dbError;
      }

      const uploadedFile: UploadedFile = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        type: file.type
      };

      setDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, uploadedFile }
            : doc
        )
      );

      toast({
        title: "File Uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      
      let errorMessage = "Failed to upload file. Please try again.";
      
      if (error.message?.includes('row-level security policy')) {
        errorMessage = "Permission denied. Please contact support to enable document uploads.";
      } else if (error.message?.includes('bucket')) {
        errorMessage = "Storage bucket not configured. Please contact support.";
      } else if (error.message?.includes('size')) {
        errorMessage = "File is too large. Please upload a smaller file.";
      } else if (error.message?.includes('type')) {
        errorMessage = "File type not allowed. Please upload PDF, JPEG, or PNG files only.";
      }
      
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      // Clear uploading state
      setUploadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  }, [toast, user]);

  const handleFileRemove = useCallback(async (documentId: string) => {
    if (!user) return;

    try {
      // Find the document to get file path
      const document = documents.find(doc => doc.id === documentId);
      if (!document?.uploadedFile) return;

      // Remove from database
      const mappedDocumentType = documentTypeMapping[documentId] || '10th_certificate';
      const { error: dbError } = await supabase
        .from('worker_documents' as any)
        .delete()
        .eq('worker_id', user.id)
        .eq('document_type', mappedDocumentType);

      if (dbError) {
        console.error('Database removal error:', dbError);
      }

      // Remove from storage (optional - you might want to keep files for audit)
      // const filePath = `${user.id}/${documentId}_${document.uploadedFile.id}.${document.uploadedFile.name.split('.').pop()}`;
      // await supabase.storage
      //   .from('employer-documents')
      //   .remove([filePath]);

      setDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, uploadedFile: null }
            : doc
        )
      );

      toast({
        title: "File Removed",
        description: "File has been removed successfully.",
      });

    } catch (error: any) {
      console.error('Remove error:', error);
      toast({
        title: "Remove Failed",
        description: "Failed to remove file. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast, user, documents]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, documentId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(documentId, files[0]);
    }
  }, [handleFileUpload]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, documentId: string) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(documentId, files[0]);
    }
    // Reset input value to allow same file to be selected again
    e.target.value = '';
  }, [handleFileUpload]);

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to submit documents.",
        variant: "destructive"
      });
      return;
    }

    const requiredDocuments = documents.filter(doc => doc.required);
    const uploadedRequired = requiredDocuments.filter(doc => doc.uploadedFile);
    
    if (uploadedRequired.length !== requiredDocuments.length) {
      toast({
        title: "Missing Documents",
        description: "Please upload all required documents before submitting.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Update employer verification status in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          worker_status: 'verification_pending', // Using worker_status for employer verification
          status: 'verification_pending',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (profileError) {
        throw profileError;
      }

      toast({
        title: "Documents Submitted",
        description: "Your documents have been submitted for admin review. You'll be notified once approved.",
      });

    } catch (error: any) {
      console.error('Submit error:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit documents. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadedCount = documents.filter(doc => doc.uploadedFile).length;
  const requiredCount = documents.filter(doc => doc.required).length;
  const progress = (uploadedCount / documents.length) * 100;
  const canSubmit = documents.filter(doc => doc.required).every(doc => doc.uploadedFile);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Show status component if documents are already submitted
  if (showStatus) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <EmployerStatus />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Employer Verification
          </h1>
          <p className="text-lg text-gray-600">
            Please upload the required company documents. Your dashboard access will be enabled after admin approval.
          </p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Upload Progress
                </h3>
                <Badge variant="outline" className="text-sm">
                  {uploadedCount} of {documents.length} uploaded
                </Badge>
              </div>
              <Progress value={progress} className="h-3" />
              <p className="text-sm text-gray-600 mt-2">
                {requiredCount} required documents • {uploadedCount} completed
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Document Upload Sections */}
        <div className="space-y-6">
          {documents.map((document, index) => {
            const IconComponent = document.icon;
            return (
              <motion.div
                key={document.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <IconComponent className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <span className="text-lg">{document.title}</span>
                        {document.required && (
                          <Badge variant="destructive" className="ml-2 text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                    </CardTitle>
                    <p className="text-gray-600 text-sm">
                      {document.description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    {document.uploadedFile ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-900">
                              {document.uploadedFile.name}
                            </p>
                            <p className="text-sm text-green-700">
                              {formatFileSize(document.uploadedFile.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFileRemove(document.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    ) : (
                      <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                          uploadingFiles.has(document.id)
                            ? 'border-blue-400 bg-blue-50 cursor-wait'
                            : 'border-gray-300 hover:border-blue-400 cursor-pointer'
                        }`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, document.id)}
                        onClick={() => {
                          if (!uploadingFiles.has(document.id)) {
                            const fileInput = window.document.getElementById(`file-input-${document.id}`) as HTMLInputElement;
                            fileInput?.click();
                          }
                        }}
                      >
                        {uploadingFiles.has(document.id) ? (
                          <>
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-lg font-medium text-blue-900 mb-2">
                              Uploading...
                            </p>
                            <p className="text-sm text-blue-700">
                              Please wait while we upload your file
                            </p>
                          </>
                        ) : (
                          <>
                            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-lg font-medium text-gray-900 mb-2">
                              Drop your file here, or click to browse
                            </p>
                            <p className="text-sm text-gray-500 mb-4">
                              PDF, JPEG, PNG up to 10MB
                            </p>
                            <Button variant="outline" size="sm">
                              Choose File
                            </Button>
                          </>
                        )}
                        <input
                          id={`file-input-${document.id}`}
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                          onChange={(e) => handleFileInputChange(e, document.id)}
                          disabled={uploadingFiles.has(document.id)}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center"
        >
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            size="lg"
            className="px-8 py-3 text-lg"
          >
            <AnimatePresence mode="wait">
              {isSubmitting ? (
                <motion.div
                  key="submitting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center space-x-2"
                >
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </motion.div>
              ) : (
                <motion.div
                  key="submit"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center space-x-2"
                >
                  <CheckCircle className="h-5 w-5" />
                  <span>Submit for Verification</span>
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
          
          {!canSubmit && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-gray-500 mt-3 flex items-center justify-center space-x-1"
            >
              <AlertCircle className="h-4 w-4" />
              <span>Please upload all required documents to continue</span>
            </motion.p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default EmployerVerificationPage;
