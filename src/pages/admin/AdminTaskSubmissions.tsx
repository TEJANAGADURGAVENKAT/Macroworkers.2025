import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Eye, 
  Clock, 
  IndianRupee,
  ArrowLeft,
  Loader2,
  FileText,
  Download,
  CheckCircle,
  X,
  AlertCircle,
  Calendar,
  Mail,
  Phone
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatINR } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: string;
  created_at: string;
  created_by: string;
  slots?: number;
  completed_slots?: number;
}

interface Submission {
  id: string;
  task_id: string;
  worker_id: string;
  proof_text: string | null;
  proof_files: string[] | null;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  worker_profile?: {
    full_name: string;
    user_id: string;
    role: string;
    email?: string;
    phone?: string;
  };
}

interface EmployerProfile {
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

const AdminTaskSubmissions = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [task, setTask] = useState<Task | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [employerProfile, setEmployerProfile] = useState<EmployerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    if (id && user) {
      loadTaskSubmissions();
    }
  }, [id, user]);

  const loadTaskSubmissions = async () => {
    if (!id || !user) return;
    
    setLoading(true);
    try {
      // Load task details
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();

      if (taskError) {
        console.error('Task query error:', taskError);
        throw taskError;
      }

      setTask(taskData);

      // Load employer profile
      if (taskData.created_by) {
        const { data: employerData, error: employerError } = await supabase
          .from('profiles')
          .select('full_name, email, role, created_at')
          .eq('user_id', taskData.created_by)
          .single();

        if (!employerError && employerData) {
          setEmployerProfile(employerData);
        }
      }

      // Load submissions for this task
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('task_submissions')
        .select('*')
        .eq('task_id', id)
        .order('submitted_at', { ascending: false });

      if (submissionsError) {
        console.error('Submissions query error:', submissionsError);
      } else {
        setSubmissions(submissionsData || []);

        // Load worker profiles for submissions
        if (submissionsData && submissionsData.length > 0) {
          const workerIds = [...new Set(submissionsData.map(s => s.worker_id))];
          
          const { data: workerProfiles } = await supabase
            .from('profiles')
            .select('user_id, full_name, email, phone, role')
            .in('user_id', workerIds);

          if (workerProfiles) {
            const workerProfileMap = new Map();
            workerProfiles.forEach(profile => {
              workerProfileMap.set(profile.user_id, profile);
            });

            const submissionsWithProfiles = submissionsData.map(submission => ({
              ...submission,
              worker_profile: workerProfileMap.get(submission.worker_id)
            }));

            setSubmissions(submissionsWithProfiles);
          }
        }
      }

    } catch (error) {
      console.error('Error loading task submissions:', error);
      toast({
        title: "Error",
        description: "Failed to load task submissions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-success/10 text-success";
      case "pending": return "bg-warning/10 text-warning";
      case "rejected": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const handleViewSubmissionDetails = (submission: Submission) => {
    setSelectedSubmission(submission);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedSubmission(null);
  };

  const handleViewFile = (fileName: string) => {
    // In a real implementation, you would have the actual file URL
    // For now, we'll create a more realistic file viewer
    
    // Check if it's a PDF file
    if (fileName.toLowerCase().endsWith('.pdf')) {
      // For PDFs, create a PDF-like viewer
      const pdfContent = `
        PDF Document: ${fileName}
        
        This is a simulated PDF viewer for: ${fileName}
        
        In a real implementation, this would display the actual PDF content
        using a PDF.js library or similar technology.
        
        File Details:
        - Name: ${fileName}
        - Type: PDF Document
        - Size: ~2.5 MB
        - Pages: 3
        
        Content Preview:
        This would show the actual PDF content here...
      `;
      
      const blob = new Blob([pdfContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      // Open file in new tab for viewing
      const newWindow = window.open(url, '_blank');
      if (newWindow) {
        newWindow.document.title = `PDF Viewer - ${fileName}`;
      }
      
      // Clean up the URL object after a delay
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } else if (fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      // For images, create an image viewer
      const imageContent = `
        Image File: ${fileName}
        
        This is a simulated image viewer for: ${fileName}
        
        In a real implementation, this would display the actual image
        with zoom, pan, and other image viewing features.
        
        File Details:
        - Name: ${fileName}
        - Type: Image
        - Size: ~1.2 MB
        - Dimensions: 1920x1080
        
        Image Content:
        [This would display the actual image here]
        
        Navigation Controls:
        - Zoom In/Out
        - Pan around the image
        - Rotate image
        - Download original
      `;
      
      const blob = new Blob([imageContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      // Open file in new tab for viewing
      const newWindow = window.open(url, '_blank');
      if (newWindow) {
        newWindow.document.title = `Image Viewer - ${fileName}`;
      }
      
      // Clean up the URL object after a delay
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } else if (fileName.toLowerCase().match(/\.(txt|md|js|ts|jsx|tsx|html|css|json|xml)$/)) {
      // For text-based files, show formatted content
      const textContent = `
        Text Document: ${fileName}
        
        This is a simulated text viewer for: ${fileName}
        
        File Details:
        - Name: ${fileName}
        - Type: Text Document
        - Size: ~15 KB
        - Lines: ~50
        
        Content Preview:
        This would show the actual text content here with proper formatting,
        syntax highlighting, and line numbers.
        
        Example content structure:
        Line 1: // This is a comment
        Line 2: function example() {
        Line 3:   return "Hello World";
        Line 4: }
        Line 5: 
        Line 6: // More content would be here...
      `;
      
      const blob = new Blob([textContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      // Open file in new tab for viewing
      const newWindow = window.open(url, '_blank');
      if (newWindow) {
        newWindow.document.title = `Text Viewer - ${fileName}`;
      }
      
      // Clean up the URL object after a delay
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } else {
      // For other file types
      const fileContent = `
        File: ${fileName}
        
        This is a simulated file viewer for: ${fileName}
        
        In a real implementation, this would display the actual file content
        based on the file type (text, code, etc.).
        
        File Details:
        - Name: ${fileName}
        - Type: Document
        - Size: ~500 KB
        - Format: Unknown
        
        Content Preview:
        This would show the actual file content here with appropriate
        formatting and viewer controls.
      `;
      
      const blob = new Blob([fileContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      // Open file in new tab for viewing
      const newWindow = window.open(url, '_blank');
      if (newWindow) {
        newWindow.document.title = `File Viewer - ${fileName}`;
      }
      
      // Clean up the URL object after a delay
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
    
    // Show success message
    toast({
      title: "File Opened",
      description: `Opening ${fileName} in new tab for viewing`,
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading task submissions...</span>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Task not found</h3>
            <p className="text-muted-foreground mb-4">
              The task you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/admin/campaigns">← Back to Campaigns</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link to="/admin/campaigns">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Task Submissions</h1>
            <p className="text-muted-foreground">
              View all submissions for: {task.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{task.status}</Badge>
          <span className="font-semibold">{formatINR(task.budget)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Campaign Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">{task.title}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {task.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Budget</p>
                    <p className="font-semibold">{formatINR(task.budget)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-semibold">
                      {new Date(task.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {task.slots && (
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Slots</p>
                      <p className="font-semibold">
                        {task.completed_slots || 0}/{task.slots}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submissions List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Submissions ({submissions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4" />
                  <p>No submissions yet for this campaign.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <Badge className={getSubmissionStatusColor(submission.status)}>
                              {submission.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatTimeAgo(submission.submitted_at)}
                            </span>
                          </div>
                          
                          <h4 className="font-medium mb-2">
                            Worker: {submission.worker_profile?.full_name || `Worker ${submission.worker_id.substring(0, 8)}`}
                          </h4>
                          
                          {submission.worker_profile?.email && (
                            <p className="text-sm text-muted-foreground mb-2">
                              Email: {submission.worker_profile.email}
                            </p>
                          )}
                          
                          {submission.proof_text && (
                            <div className="mb-3">
                              <p className="text-sm font-medium text-muted-foreground mb-1">
                                Proof Text:
                              </p>
                              <div className="bg-muted/30 p-3 rounded-lg">
                                <p className="text-sm">{submission.proof_text}</p>
                              </div>
                            </div>
                          )}
                          
                          {submission.proof_files && submission.proof_files.length > 0 && (
                            <div className="mb-3">
                              <p className="text-sm font-medium text-muted-foreground mb-1">
                                Proof Files:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {submission.proof_files.map((file, index) => (
                                  <div key={index} className="flex items-center gap-2 bg-muted/30 px-3 py-2 rounded-lg">
                                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <span className="text-sm truncate max-w-[150px]">{file}</span>
                                    <div className="flex gap-1 flex-shrink-0">
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleViewFile(file)}
                                      >
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                      <Button variant="ghost" size="sm">
                                        <Download className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {submission.reviewer_notes && (
                            <div className="mb-3">
                              <p className="text-sm font-medium text-muted-foreground mb-1">
                                Reviewer Notes:
                              </p>
                              <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-l-blue-500">
                                <p className="text-sm">{submission.reviewer_notes}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right ml-4">
                          <div className="flex flex-col items-end space-y-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewSubmissionDetails(submission)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Full Details
                            </Button>
                            {submission.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button size="sm" className="bg-success hover:bg-success/90">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button size="sm" variant="destructive">
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Employer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Campaign Creator
              </CardTitle>
            </CardHeader>
            <CardContent>
              {employerProfile ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-semibold">{employerProfile.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-semibold">{employerProfile.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p className="font-semibold">
                      {new Date(employerProfile.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Employer information not available</p>
              )}
            </CardContent>
          </Card>

          {/* Submission Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Submission Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {submissions.length}
                  </div>
                  <p className="text-xs text-muted-foreground">Total Submissions</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">
                    {submissions.filter(s => s.status === 'approved').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Approved</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending</span>
                  <span className="font-medium">{submissions.filter(s => s.status === 'pending').length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rejected</span>
                  <span className="font-medium">{submissions.filter(s => s.status === 'rejected').length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Export Submissions
              </Button>
              <Button className="w-full" variant="outline">
                <AlertCircle className="h-4 w-4 mr-2" />
                Report Issue
              </Button>
              <Button className="w-full" variant="outline" asChild>
                <Link to={`/admin/task/${id}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Task Details
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submission Detail Modal */}
      {isDetailModalOpen && selectedSubmission && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={closeDetailModal}
        >
          <div 
            className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Submission Details</h2>
                  <p className="text-muted-foreground">
                    Worker: {selectedSubmission.worker_profile?.full_name || `Worker ${selectedSubmission.worker_id.substring(0, 8)}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getSubmissionStatusColor(selectedSubmission.status)}>
                    {selectedSubmission.status}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={closeDetailModal}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Submission Details */}
                <div className="space-y-6">
                  {/* Worker Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Worker Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Name:</span>
                        <span>{selectedSubmission.worker_profile?.full_name || `Worker ${selectedSubmission.worker_id.substring(0, 8)}`}</span>
                      </div>
                      {selectedSubmission.worker_profile?.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Email:</span>
                          <span>{selectedSubmission.worker_profile.email}</span>
                        </div>
                      )}
                      {selectedSubmission.worker_profile?.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Phone:</span>
                          <span>{selectedSubmission.worker_profile.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Submitted:</span>
                        <span>{new Date(selectedSubmission.submitted_at).toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Proof Content */}
                  {selectedSubmission.proof_text && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Proof Text
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <p className="whitespace-pre-wrap">{selectedSubmission.proof_text}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Proof Files */}
                  {selectedSubmission.proof_files && selectedSubmission.proof_files.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Download className="h-5 w-5" />
                          Proof Files ({selectedSubmission.proof_files.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {selectedSubmission.proof_files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <span className="font-medium">{file}</span>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleViewFile(file)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Right Column - Review & Actions */}
                <div className="space-y-6">
                  {/* Submission Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Submission Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Current Status</span>
                        <Badge className={getSubmissionStatusColor(selectedSubmission.status)}>
                          {selectedSubmission.status}
                        </Badge>
                      </div>
                      {selectedSubmission.reviewed_at && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Reviewed At</span>
                          <span>{new Date(selectedSubmission.reviewed_at).toLocaleString()}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Reviewer Notes */}
                  {selectedSubmission.reviewer_notes && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Reviewer Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-l-blue-500">
                          <p className="text-sm">{selectedSubmission.reviewer_notes}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Admin Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Admin Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedSubmission.status === 'pending' && (
                        <>
                          <Button className="w-full bg-success hover:bg-success/90">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve Submission
                          </Button>
                          <Button className="w-full" variant="destructive">
                            <X className="h-4 w-4 mr-2" />
                            Reject Submission
                          </Button>
                        </>
                      )}
                      <Button className="w-full" variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Add Review Notes
                      </Button>
                      <Button className="w-full" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export Submission Data
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTaskSubmissions; 