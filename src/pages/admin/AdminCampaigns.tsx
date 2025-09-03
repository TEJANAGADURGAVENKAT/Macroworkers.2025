import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Briefcase, 
  Users, 
  Eye, 
  Clock, 
  IndianRupee,
  Building,
  Loader2,
  RefreshCw,
  Search,
  Filter,
  FileText,
  Download,
  X,
  CheckCircle,
  AlertCircle,
  Calendar,
  Mail,
  User
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatINR } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  submission_count?: number;
}

interface Submission {
  id: string;
  task_id: string;
  worker_id: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  proof_text?: string;
  proof_files?: string[];
  worker_profile?: {
    full_name: string;
    email: string;
  };
}

interface Employer {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
  tasks: Task[];
}

const AdminCampaigns = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadCampaignData();
      
      // Set up real-time updates every 30 seconds
      const interval = setInterval(() => {
        loadCampaignData();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadCampaignData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('Loading campaign data for admin...');
      
      // Load all employers
      const { data: employersData, error: employersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'employer')
        .order('created_at', { ascending: false });

      if (employersError) {
        console.error('Employers query error:', employersError);
        throw employersError;
      }

      // Load all tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (tasksError) {
        console.error('Tasks query error:', tasksError);
        throw tasksError;
      }

      // Group tasks by employer
      const employersWithTasks = (employersData || []).map(employer => {
        const employerTasks = (tasksData || []).filter(task => 
          task.created_by === employer.user_id
        );
        
        return {
          ...employer,
          tasks: employerTasks
        };
      });

      setEmployers(employersWithTasks);
      console.log('Campaign data loaded:', employersWithTasks);
      
    } catch (error) {
      console.error('Error loading campaign data:', error);
      toast({
        title: "Error",
        description: "Failed to load campaign data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadCampaignData();
    setRefreshing(false);
    toast({
      title: "Success",
      description: "Campaign data refreshed successfully.",
    });
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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const handleViewProof = async (taskId: string) => {
    try {
      // Fetch submissions for this task
      const { data: submissions, error } = await supabase
        .from('task_submissions')
        .select(`
          *,
          worker_profile:profiles!task_submissions_worker_id_fkey(
            full_name,
            email
          )
        `)
        .eq('task_id', taskId)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching submissions:', error);
        toast({
          title: "Error",
          description: "Failed to load submissions",
          variant: "destructive",
        });
        return;
      }

      if (submissions && submissions.length > 0) {
        // Use the first submission for now (you can modify this to show a list)
        const submission = submissions[0];
        setSelectedSubmission({
          ...submission,
          status: submission.status as 'pending' | 'approved' | 'rejected',
          worker_profile: submission.worker_profile || {
            full_name: `Worker ${submission.worker_id.substring(0, 8)}`,
            email: 'Unknown'
          }
        });
        setIsProofModalOpen(true);
      } else {
        toast({
          title: "No Submissions",
          description: "This task has no submissions yet",
        });
      }
    } catch (error) {
      console.error('Error viewing proof:', error);
      toast({
        title: "Error",
        description: "Failed to load proof",
        variant: "destructive",
      });
    }
  };

  const closeProofModal = () => {
    setIsProofModalOpen(false);
    setSelectedSubmission(null);
  };

  const handleDownloadFile = (fileName: string) => {
    // In a real implementation, you would download the actual file
    // For now, we'll create a placeholder download
    const fileContent = `This is a placeholder for: ${fileName}\n\nIn a real implementation, this would be the actual file content.`;
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    
    toast({
      title: "File Downloaded",
      description: `${fileName} downloaded successfully`,
    });
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

  // Filter employers and tasks based on search and status
  const filteredEmployers = employers.filter(employer => {
    const matchesSearch = 
      employer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employer.tasks.some(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesStatus = statusFilter === "all" || 
      employer.tasks.some(task => task.status === statusFilter);

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading campaign data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Campaign Moderation Interface</h1>
          <p className="text-muted-foreground">
            Monitor and manage all campaigns created by employers
          </p>
        </div>
        <div className="flex space-x-3">
        <Button variant="outline" asChild>
            <Link to="/admin">← Back to Admin Dashboard</Link>
          </Button>
          <Button 
            variant="outline" 
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
        </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employers</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employers.length}</div>
            <p className="text-xs text-muted-foreground">
              Active employers in the platform
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employers.reduce((total, employer) => total + employer.tasks.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              All campaigns created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employers.reduce((total, employer) => 
                total + employer.tasks.filter(task => task.status === 'active').length, 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently running campaigns
            </p>
          </CardContent>
        </Card>
      
      <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatINR(
                employers.reduce((total, employer) => 
                  total + employer.tasks.reduce((taskTotal, task) => taskTotal + (task.budget || 0), 0), 0
                )
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Combined value of all campaigns
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search employers, task titles, or descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns List */}
      {filteredEmployers.length > 0 && (
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredEmployers.length} employer{filteredEmployers.length !== 1 ? 's' : ''} with {filteredEmployers.reduce((total, employer) => total + employer.tasks.length, 0)} total campaign{filteredEmployers.reduce((total, employer) => total + employer.tasks.length, 0) !== 1 ? 's' : ''}
        </div>
      )}
      
      {filteredEmployers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all" 
                ? "Try adjusting your search or filters."
                : "No employers have created campaigns yet."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredEmployers.length} employer{filteredEmployers.length !== 1 ? 's' : ''} with {filteredEmployers.reduce((total, employer) => total + employer.tasks.length, 0)} total campaign{filteredEmployers.reduce((total, employer) => total + employer.tasks.length, 0) !== 1 ? 's' : ''}
          </div>
          
          <div className="space-y-6">
          {filteredEmployers.map((employer) => (
            <Card key={employer.user_id} className="overflow-hidden">
              {/* Employer Header */}
              <CardHeader className="bg-muted/30 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Building className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{employer.full_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {employer.email} • {formatTimeAgo(employer.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {employer.tasks.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Campaign{employer.tasks.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </CardHeader>

              {/* Employer's Tasks */}
              <CardContent className="p-0">
                {employer.tasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No campaigns created yet by {employer.full_name}
                  </div>
                ) : (
                  <div className="divide-y">
                    {employer.tasks.map((task) => (
                      <div key={task.id} className="p-6 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {/* Task Header */}
                            <div className="flex items-center gap-3 mb-3">
                              <span className="text-xs font-mono text-muted-foreground bg-background px-2 py-1 rounded border">
                                ID: {task.id.substring(0, 8)}...
                              </span>
                              <Badge className={getStatusColor(task.status)}>
                                {task.status}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {formatTimeAgo(task.created_at)}
                              </span>
                            </div>

                            {/* Task Title and Description */}
                            <h3 className="text-lg font-semibold mb-2">{task.title}</h3>
                            <p className="text-muted-foreground mb-3">
                              {task.description.length > 100 ? `${task.description.substring(0, 100)}...` : task.description}
                            </p>

                            {/* Task Details */}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <IndianRupee className="h-4 w-4" />
                                <span className="font-medium">{formatINR(task.budget)}</span>
                              </div>
                              {task.slots && (
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  <span>
                                    {task.completed_slots || 0}/{task.slots} slots
                                  </span>
                                </div>
                              )}
                              {task.submission_count !== undefined && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{task.submission_count} submissions</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2 ml-4">
                            <Button asChild size="sm" className="w-full">
                              <Link to={`/admin/task/${task.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild className="w-full">
                              <Link to={`/admin/task/${task.id}/submissions`}>
                                <Users className="h-4 w-4 mr-2" />
                                View Submissions
                              </Link>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                              onClick={() => handleViewProof(task.id)}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              View Proof
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        </>
      )}

      {/* Proof Modal */}
      <Dialog open={isProofModalOpen} onOpenChange={setIsProofModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Submission Proof
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeProofModal}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    Worker: {selectedSubmission.worker_profile?.full_name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    Task: {selectedSubmission.task_id.substring(0, 8)}...
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    Submitted: {formatTimeAgo(selectedSubmission.submitted_at)}
                  </span>
                </div>
                <Badge className={getStatusColor(selectedSubmission.status)}>
                  {selectedSubmission.status}
                </Badge>
              </div>

              {/* Proof Text */}
              {selectedSubmission.proof_text && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Proof Text
                  </h3>
                  <div className="p-4 bg-muted/30 rounded-lg border">
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedSubmission.proof_text}
                    </p>
                  </div>
                </div>
              )}

              {/* Proof Files */}
              {selectedSubmission.proof_files && selectedSubmission.proof_files.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Proof Files ({selectedSubmission.proof_files.length})
                  </h3>
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
                </div>
              )}

              {/* Worker Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Worker Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-semibold">{selectedSubmission.worker_profile?.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-semibold">{selectedSubmission.worker_profile?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Submitted</p>
                      <p className="font-semibold">
                        {new Date(selectedSubmission.submitted_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge className={getStatusColor(selectedSubmission.status)}>
                        {selectedSubmission.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Quick Actions
                </h3>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1">
                    <FileText className="h-4 w-4 mr-2" />
                    Add Review Notes
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCampaigns;