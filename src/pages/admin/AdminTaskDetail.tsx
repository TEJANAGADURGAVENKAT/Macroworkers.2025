import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Eye, 
  CheckCircle, 
  Clock, 
  IndianRupee,
  Calendar,
  MapPin,
  FileText,
  TrendingUp,
  AlertCircle,
  Building,
  ArrowLeft,
  Loader2,
  Download,
  X
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
  target_countries: string[];
  requirements: string;
  deadline: string;
  slots?: number;
  completed_slots?: number;
  category?: string;
  expires_at?: string;
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

interface TaskStats {
  totalViews: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
  completionRate: number;
}

const AdminTaskDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [task, setTask] = useState<Task | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [employerProfile, setEmployerProfile] = useState<EmployerProfile | null>(null);
  const [stats, setStats] = useState<TaskStats>({
    totalViews: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0,
    approvedSubmissions: 0,
    rejectedSubmissions: 0,
    completionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);

  useEffect(() => {
    if (id && user) {
      loadTaskDetails();
    }
  }, [id, user]);

  const loadTaskDetails = async () => {
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

      // Calculate stats
      const totalSubmissions = submissionsData?.length || 0;
      const pendingSubmissions = submissionsData?.filter(s => s.status === 'pending').length || 0;
      const approvedSubmissions = submissionsData?.filter(s => s.status === 'approved').length || 0;
      const rejectedSubmissions = submissionsData?.filter(s => s.status === 'rejected').length || 0;
      const completionRate = totalSubmissions > 0 ? Math.round((approvedSubmissions / totalSubmissions) * 100) : 0;

      setStats({
        totalViews: 0, // Not implemented yet
        totalSubmissions,
        pendingSubmissions,
        approvedSubmissions,
        rejectedSubmissions,
        completionRate
      });

    } catch (error) {
      console.error('Error loading task details:', error);
      toast({
        title: "Error",
        description: "Failed to load task details. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-success/10 text-success";
      case "pending": return "bg-warning/10 text-warning";
      case "completed": return "bg-success/10 text-success";
      case "paused": return "bg-muted text-muted-foreground";
      case "cancelled": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
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

  const handleViewProof = (submission: Submission) => {
    setSelectedSubmission(submission);
    setIsProofModalOpen(true);
  };

  const closeProofModal = () => {
    setIsProofModalOpen(false);
    setSelectedSubmission(null);
  };

  const handleDownloadFile = (fileName: string) => {
    // For now, we'll create a placeholder download
    // In a real implementation, you would get the actual file URL from your storage
    const link = document.createElement('a');
    
    // If you have actual file URLs stored, you can use them here
    // For example: link.href = `https://your-storage-bucket.com/files/${fileName}`;
    
    // For now, we'll create a text file with the filename as content
    const blob = new Blob([`This is a placeholder for: ${fileName}\n\nIn a real implementation, this would be the actual file content.`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
    
    // Show success message
    toast({
      title: "Download Started",
      description: `Downloading ${fileName}`,
    });
  };

  const handleViewFile = (fileName: string) => {
    // Try to get the actual file from the submission data
    if (selectedSubmission && selectedSubmission.proof_files) {
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
          <span className="ml-2">Loading task details...</span>
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
            <h1 className="text-3xl font-bold">Task Details</h1>
            <p className="text-muted-foreground">
              Admin view of campaign details and submissions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(task.status)}>
            {task.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Task Information */}
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
                <h2 className="text-2xl font-bold mb-2">{task.title}</h2>
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
                  <Calendar className="h-5 w-5 text-muted-foreground" />
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
                {task.expires_at && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Expires</p>
                      <p className="font-semibold">
                        {new Date(task.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {task.requirements && (
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Requirements</h4>
                  <p className="text-muted-foreground">{task.requirements}</p>
                </div>
              )}

              {task.target_countries && task.target_countries.length > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Target Countries</h4>
                  <div className="flex flex-wrap gap-2">
                    {task.target_countries.map((country, index) => (
                      <Badge key={index} variant="outline">
                        {country}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submissions */}
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
                          <div className="flex items-center gap-2 mb-2">
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
                          
                          {submission.proof_text && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {submission.proof_text}
                            </p>
                          )}
                          
                          {submission.proof_files && submission.proof_files.length > 0 && (
                            <div className="mb-2">
                              <p className="text-sm font-medium text-muted-foreground mb-1">
                                Proof Files:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {submission.proof_files.map((file, index) => (
                                  <span key={index} className="text-xs bg-muted px-2 py-1 rounded">
                                    {file}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right ml-4">
                          <div className="flex flex-col gap-2">
                            {(submission.proof_text || (submission.proof_files && submission.proof_files.length > 0)) && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewProof(submission)}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                View Proof
                              </Button>
                            )}
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
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
                <Building className="h-5 w-5" />
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

          {/* Campaign Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {stats.totalSubmissions}
                  </div>
                  <p className="text-xs text-muted-foreground">Total Submissions</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">
                    {stats.completionRate}%
                  </div>
                  <p className="text-xs text-muted-foreground">Completion Rate</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending</span>
                  <span className="font-medium">{stats.pendingSubmissions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Approved</span>
                  <span className="font-medium text-success">{stats.approvedSubmissions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rejected</span>
                  <span className="font-medium text-destructive">{stats.rejectedSubmissions}</span>
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
              <Button className="w-full" variant="outline" asChild>
                <Link to={`/admin/task/${id}/submissions`}>
                  <Users className="h-4 w-4 mr-2" />
                  View All Submissions
                </Link>
              </Button>
              <Button className="w-full" variant="outline">
                <AlertCircle className="h-4 w-4 mr-2" />
                Report Issue
              </Button>
              <Button className="w-full" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Proof Modal */}
      {isProofModalOpen && selectedSubmission && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={closeProofModal}
        >
          <div 
            className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Submission Proof</h2>
                  <p className="text-muted-foreground">
                    Worker: {selectedSubmission.worker_profile?.full_name || `Worker ${selectedSubmission.worker_id.substring(0, 8)}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Task: {task?.title} • Submitted: {formatTimeAgo(selectedSubmission.submitted_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(selectedSubmission.status)}>
                    {selectedSubmission.status}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={closeProofModal}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Proof Content */}
                <div className="space-y-6">
                  {/* Proof Text */}
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
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">
                            {selectedSubmission.proof_text}
                          </p>
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
                            <div key={index} className="p-3 bg-muted/30 rounded-lg border">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <span className="font-medium text-sm block truncate">{file}</span>
                                    <p className="text-xs text-muted-foreground">
                                      Click view to open or download to save
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleViewFile(file)}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleDownloadFile(file)}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Right Column - Worker Info & Actions */}
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
                          <span className="font-medium">Email:</span>
                          <span>{selectedSubmission.worker_profile.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Submitted:</span>
                        <span>{new Date(selectedSubmission.submitted_at).toLocaleString()}</span>
                      </div>
                      {selectedSubmission.reviewed_at && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Reviewed:</span>
                          <span>{new Date(selectedSubmission.reviewed_at).toLocaleString()}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Submission Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Submission Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Current Status</span>
                        <Badge className={getStatusColor(selectedSubmission.status)}>
                          {selectedSubmission.status}
                        </Badge>
                      </div>
                      {selectedSubmission.reviewer_notes && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-muted-foreground mb-2">Reviewer Notes:</p>
                          <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-l-blue-500">
                            <p className="text-sm">{selectedSubmission.reviewer_notes}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
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
                        Export All Data
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

export default AdminTaskDetail; 