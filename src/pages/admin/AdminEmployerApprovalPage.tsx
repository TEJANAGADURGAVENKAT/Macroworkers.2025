import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Download, 
  FileText, 
  Building2, 
  Calendar,
  User,
  Mail,
  Phone,
  AlertCircle
} from "lucide-react";

interface EmployerDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  filePath?: string;
}

interface Employer {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  cin: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  documents: EmployerDocument[];
  rejectionReason?: string;
}

const AdminEmployerApprovalPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedEmployer, setSelectedEmployer] = useState<Employer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [employers, setEmployers] = useState<Employer[]>([]);

  // Load employers with document verification requests
  useEffect(() => {
    loadEmployers();
  }, []);

  const loadEmployers = async () => {
    try {
      setLoading(true);
      
      // Get all employers who have submitted documents
      const { data: employersData, error: employersError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, phone, worker_status, status, updated_at')
        .eq('role', 'employer')
        .in('worker_status', ['verification_pending', 'active_employee', 'rejected']);

      if (employersError) throw employersError;

      // Get documents for each employer
      const employersWithDocs = await Promise.all(
        (employersData || []).map(async (employer) => {
          const { data: documentsData, error: docsError } = await supabase
            .from('worker_documents' as any)
            .select('*')
            .eq('worker_id', employer.user_id)
            .order('created_at', { ascending: true });

          if (docsError) {
            console.error('Error loading documents for employer:', employer.user_id, docsError);
          }

          const documents = (documentsData || []).map(doc => ({
            id: doc.id,
            name: doc.file_name,
            type: doc.mime_type,
            size: doc.file_size,
            uploadedAt: doc.created_at,
            documentType: doc.document_type,
            filePath: doc.file_path // Include file path for download
          }));

          return {
            id: employer.user_id,
            name: employer.full_name || 'Unknown Employer',
            email: employer.email || '',
            phone: employer.phone || '',
            companyName: 'Company Name', // You might want to add this to profiles table
            cin: 'CIN Number', // You might want to add this to profiles table
            status: employer.worker_status === 'verification_pending' ? 'pending' as const : 
                   employer.worker_status === 'active_employee' ? 'approved' as const : 'rejected' as const,
            submittedAt: employer.updated_at || employer.user_id,
            documents
          };
        })
      );

      setEmployers(employersWithDocs);
    } catch (error: any) {
      console.error('Error loading employers:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load employer verification requests.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fallback mock data for demonstration
  const mockEmployers: Employer[] = [
    {
      id: "1",
      name: "Rajesh Kumar",
      email: "rajesh@techcorp.com",
      phone: "+91 9876543210",
      companyName: "TechCorp Solutions Pvt Ltd",
      cin: "U72900DL2020PTC123456",
      status: "pending",
      submittedAt: "2024-01-15T10:30:00Z",
       documents: [
         { id: "1", name: "CIN_Certificate.pdf", type: "application/pdf", size: 2048576, uploadedAt: "2024-01-15T10:30:00Z", filePath: "user1/cin_1234567890.pdf" },
         { id: "2", name: "MoA_Document.pdf", type: "application/pdf", size: 1536000, uploadedAt: "2024-01-15T10:31:00Z", filePath: "user1/moa_1234567891.pdf" },
         { id: "3", name: "AoA_Document.pdf", type: "application/pdf", size: 1800000, uploadedAt: "2024-01-15T10:32:00Z", filePath: "user1/aoa_1234567892.pdf" },
         { id: "4", name: "DSC_Certificate.pdf", type: "application/pdf", size: 1024000, uploadedAt: "2024-01-15T10:33:00Z", filePath: "user1/dsc_1234567893.pdf" },
         { id: "5", name: "DIN_Details.pdf", type: "application/pdf", size: 512000, uploadedAt: "2024-01-15T10:34:00Z", filePath: "user1/din_1234567894.pdf" },
         { id: "6", name: "Directors_Photos.zip", type: "application/zip", size: 3072000, uploadedAt: "2024-01-15T10:35:00Z", filePath: "user1/photographs_1234567895.zip" }
       ]
    },
    {
      id: "2",
      name: "Priya Sharma",
      email: "priya@innovate.com",
      phone: "+91 8765432109",
      companyName: "Innovate Digital Services",
      cin: "U72900MH2021PTC234567",
      status: "pending",
      submittedAt: "2024-01-14T14:20:00Z",
       documents: [
         { id: "7", name: "Company_Registration.pdf", type: "application/pdf", size: 2560000, uploadedAt: "2024-01-14T14:20:00Z", filePath: "user2/cin_1234567896.pdf" },
         { id: "8", name: "Memorandum.pdf", type: "application/pdf", size: 1800000, uploadedAt: "2024-01-14T14:21:00Z", filePath: "user2/moa_1234567897.pdf" },
         { id: "9", name: "Articles.pdf", type: "application/pdf", size: 1600000, uploadedAt: "2024-01-14T14:22:00Z", filePath: "user2/aoa_1234567898.pdf" },
         { id: "10", name: "Digital_Signature.pdf", type: "application/pdf", size: 1200000, uploadedAt: "2024-01-14T14:23:00Z", filePath: "user2/dsc_1234567899.pdf" },
         { id: "11", name: "Director_DIN.pdf", type: "application/pdf", size: 800000, uploadedAt: "2024-01-14T14:24:00Z", filePath: "user2/din_1234567900.pdf" },
         { id: "12", name: "Photos.zip", type: "application/zip", size: 4096000, uploadedAt: "2024-01-14T14:25:00Z", filePath: "user2/photographs_1234567901.zip" }
       ]
    },
    {
      id: "3",
      name: "Amit Patel",
      email: "amit@startup.com",
      phone: "+91 7654321098",
      companyName: "Startup Innovations Ltd",
      cin: "U72900GJ2022PTC345678",
      status: "approved",
      submittedAt: "2024-01-10T09:15:00Z",
       documents: [
         { id: "13", name: "Incorporation_Cert.pdf", type: "application/pdf", size: 2200000, uploadedAt: "2024-01-10T09:15:00Z", filePath: "user3/cin_1234567902.pdf" },
         { id: "14", name: "MoA.pdf", type: "application/pdf", size: 1900000, uploadedAt: "2024-01-10T09:16:00Z", filePath: "user3/moa_1234567903.pdf" },
         { id: "15", name: "AoA.pdf", type: "application/pdf", size: 1700000, uploadedAt: "2024-01-10T09:17:00Z", filePath: "user3/aoa_1234567904.pdf" },
         { id: "16", name: "DSC.pdf", type: "application/pdf", size: 1100000, uploadedAt: "2024-01-10T09:18:00Z", filePath: "user3/dsc_1234567905.pdf" },
         { id: "17", name: "DIN.pdf", type: "application/pdf", size: 600000, uploadedAt: "2024-01-10T09:19:00Z", filePath: "user3/din_1234567906.pdf" },
         { id: "18", name: "Director_Photos.zip", type: "application/zip", size: 3500000, uploadedAt: "2024-01-10T09:20:00Z", filePath: "user3/photographs_1234567907.zip" }
       ]
     }
   ];

  // Use real data if available, otherwise fallback to mock data
  const displayEmployers = employers.length > 0 ? employers : mockEmployers;

  const handleViewDocuments = (employer: Employer) => {
    setSelectedEmployer(employer);
    setIsModalOpen(true);
  };

  const handleDownloadDocument = async (filePath: string, fileName: string) => {
    try {
      console.log('Downloading file:', { filePath, fileName });
      
      const { data, error } = await supabase.storage
        .from('employer-documents')
        .download(filePath);

      if (error) {
        console.error('Storage download error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No file data received');
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: `${fileName} is being downloaded.`,
      });
    } catch (error: any) {
      console.error('Download error:', error);
      
      let errorMessage = "Failed to download file. Please try again.";
      
      if (error.message?.includes('not found')) {
        errorMessage = "File not found. It may have been deleted.";
      } else if (error.message?.includes('permission')) {
        errorMessage = "Permission denied. Please contact support.";
      } else if (error.message?.includes('bucket')) {
        errorMessage = "Storage bucket not accessible. Please contact support.";
      }
      
      toast({
        title: "Download Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleApprove = async (employerId: string) => {
    if (!user) return;
    
    setIsProcessing(employerId);
    
    try {
      // Update employer verification status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          worker_status: 'active_employee',
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', employerId);

      if (profileError) throw profileError;

      // Update all documents to approved status
      const { error: docsError } = await supabase
        .from('worker_documents' as any)
        .update({ 
          verification_status: 'approved',
          verified_by: user.id,
          verified_at: new Date().toISOString()
        })
        .eq('worker_id', employerId);

      if (docsError) throw docsError;
      
      setEmployers(prev => 
        prev.map(emp => 
          emp.id === employerId 
            ? { ...emp, status: 'approved' as const }
            : emp
        )
      );

      toast({
        title: "Employer Approved",
        description: "Employer has been approved successfully and can now access their dashboard.",
      });

    } catch (error: any) {
      console.error('Approve error:', error);
      toast({
        title: "Approval Failed",
        description: "Failed to approve employer. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(null);
      setIsModalOpen(false);
    }
  };

  const handleReject = async (employerId: string) => {
    if (!user) return;
    
    if (!rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejection.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(employerId);
    
    try {
      // Update employer verification status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          worker_status: 'rejected',
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', employerId);

      if (profileError) throw profileError;

      // Update all documents to rejected status with notes
      const { error: docsError } = await supabase
        .from('worker_documents' as any)
        .update({ 
          verification_status: 'rejected',
          verification_notes: rejectionReason,
          verified_by: user.id,
          verified_at: new Date().toISOString()
        })
        .eq('worker_id', employerId);

      if (docsError) throw docsError;
      
      setEmployers(prev => 
        prev.map(emp => 
          emp.id === employerId 
            ? { ...emp, status: 'rejected' as const, rejectionReason }
            : emp
        )
      );

      toast({
        title: "Employer Rejected",
        description: "Employer has been rejected with the provided reason.",
        variant: "destructive"
      });

    } catch (error: any) {
      console.error('Reject error:', error);
      toast({
        title: "Rejection Failed",
        description: "Failed to reject employer. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(null);
      setRejectionReason("");
      setIsModalOpen(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingEmployers = displayEmployers.filter(emp => emp.status === 'pending');
  const approvedEmployers = displayEmployers.filter(emp => emp.status === 'approved');
  const rejectedEmployers = displayEmployers.filter(emp => emp.status === 'rejected');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Employer Document Verification Requests
          </h1>
          <p className="text-lg text-gray-600">
            Review and approve employer document submissions
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{pendingEmployers.length}</p>
                  <p className="text-sm text-gray-600">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{approvedEmployers.length}</p>
                  <p className="text-sm text-gray-600">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-red-100 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{rejectedEmployers.length}</p>
                  <p className="text-sm text-gray-600">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employers List */}
        <div className="space-y-6">
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading employer verification requests...</p>
              </CardContent>
            </Card>
          ) : displayEmployers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Verification Requests</h3>
                <p className="text-gray-600">No employer document verification requests found.</p>
              </CardContent>
            </Card>
          ) : (
            displayEmployers.map((employer, index) => (
            <motion.div
              key={employer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {employer.name}
                          </h3>
                          <p className="text-sm text-gray-600">{employer.companyName}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span>{employer.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span>{employer.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span>CIN: {employer.cin}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>Submitted: {formatDate(employer.submittedAt)}</span>
                        </div>
                      </div>
                      
                      {employer.rejectionReason && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800">
                            <strong>Rejection Reason:</strong> {employer.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        {getStatusBadge(employer.status)}
                        <p className="text-xs text-gray-500 mt-1">
                          {employer.documents.length} documents
                        </p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDocuments(employer)}
                          disabled={isProcessing === employer.id}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Documents
                        </Button>
                        
                        {employer.status === 'pending' && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApprove(employer.id)}
                              disabled={isProcessing === employer.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {isProcessing === employer.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              ) : (
                                <CheckCircle className="h-4 w-4 mr-2" />
                              )}
                              Approve
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            ))
          )}
        </div>

        {/* Documents Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-3">
                <Building2 className="h-6 w-6 text-blue-600" />
                <span>Documents - {selectedEmployer?.name}</span>
              </DialogTitle>
            </DialogHeader>
            
            {selectedEmployer && (
              <div className="space-y-6">
                {/* Employer Info */}
                <Card>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-900">Company Name</p>
                        <p className="text-gray-600">{selectedEmployer.companyName}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">CIN</p>
                        <p className="text-gray-600">{selectedEmployer.cin}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Email</p>
                        <p className="text-gray-600">{selectedEmployer.email}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Phone</p>
                        <p className="text-gray-600">{selectedEmployer.phone}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Documents List */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Uploaded Documents</h4>
                  {selectedEmployer.documents.map((doc) => (
                    <Card key={doc.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="font-medium text-gray-900">{doc.name}</p>
                              <p className="text-sm text-gray-600">
                                {formatFileSize(doc.size)} • {formatDate(doc.uploadedAt)}
                              </p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDownloadDocument(doc.filePath || doc.name, doc.name)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Action Buttons */}
                {selectedEmployer.status === 'pending' && (
                  <div className="flex space-x-4 pt-4 border-t">
                    <Button
                      onClick={() => handleApprove(selectedEmployer.id)}
                      disabled={isProcessing === selectedEmployer.id}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {isProcessing === selectedEmployer.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Approve Employer
                    </Button>
                    
                    <div className="flex-1">
                      <Textarea
                        placeholder="Reason for rejection (required)"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="mb-3"
                        rows={3}
                      />
                      <Button
                        variant="destructive"
                        onClick={() => handleReject(selectedEmployer.id)}
                        disabled={isProcessing === selectedEmployer.id || !rejectionReason.trim()}
                        className="w-full"
                      >
                        {isProcessing === selectedEmployer.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Reject Employer
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminEmployerApprovalPage;
