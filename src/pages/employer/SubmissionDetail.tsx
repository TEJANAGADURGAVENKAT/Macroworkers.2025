import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft,
  User,
  Calendar,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatINR } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { SubmissionProofModal } from "@/components/ui/submission-proof-modal";

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
  task?: {
    title: string;
    budget: number;
    description: string;
  };
}

const SubmissionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProofModal, setShowProofModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadSubmissionDetails();
    }
  }, [id]);

  const loadSubmissionDetails = async () => {
    if (!id || !user) return;
    
    setLoading(true);
    try {
      // Load submission details
      const { data: submissionData, error: submissionError } = await supabase
        .from('task_submissions')
        .select('*')
        .eq('id', id)
        .single();

      if (submissionError) throw submissionError;

      // Load task details
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('title, budget, description')
        .eq('id', submissionData.task_id)
        .eq('created_by', user.id)
        .single();

      if (taskError) throw taskError;

      // Load worker profile with debug logging
      console.log('Loading worker profile for ID:', submissionData.worker_id);
      
      const { data: workerData, error: workerError } = await supabase
        .from('profiles')
        .select('full_name, user_id, role, email, phone')
        .eq('user_id', submissionData.worker_id)
        .single();

      console.log('Worker profile data:', workerData);
      console.log('Worker profile error:', workerError);

      // If profile not found, try to get from auth.users
      let workerProfile;
      if (workerError || !workerData) {
        console.log('Profile not found, trying auth.users...');
        
        // Try to get user data from auth.users (admin function)
        try {
          const { data: authUserData, error: authError } = await supabase.auth.admin.getUserById(submissionData.worker_id);
          console.log('Auth user data:', authUserData);
          
          if (authUserData?.user) {
            workerProfile = {
              full_name: authUserData.user.user_metadata?.full_name || 
                         authUserData.user.user_metadata?.name || 
                         `Employee/Worker ${submissionData.worker_id.substring(0, 8)}`,
              user_id: submissionData.worker_id,
              role: 'worker',
              email: authUserData.user.email,
              phone: authUserData.user.user_metadata?.phone
            };
          } else {
            workerProfile = { 
              full_name: `Employee/Worker ${submissionData.worker_id.substring(0, 8)}`,
              user_id: submissionData.worker_id,
              role: 'worker'
            };
          }
        } catch (authErr) {
          console.error('Auth user fetch error:', authErr);
          workerProfile = { 
            full_name: `Employee/Worker ${submissionData.worker_id.substring(0, 8)}`,
            user_id: submissionData.worker_id,
            role: 'worker'
          };
        }
      } else {
        workerProfile = workerData;
      }

      console.log('Final worker profile:', workerProfile);

      setSubmission({
        ...submissionData,
        worker_profile: workerProfile,
        task: taskData
      });

    } catch (error: any) {
      console.error('Error loading submission details:', error);
      toast({
        title: "Error",
        description: "Failed to load submission details.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!submission) return;
    
    try {
      const { error } = await supabase
        .from('task_submissions')
        .update({ 
          status: 'approved',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', submission.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Submission approved successfully.",
      });

      // Reload submission details
      loadSubmissionDetails();
    } catch (error: any) {
      console.error('Error approving submission:', error);
      toast({
        title: "Error",
        description: "Failed to approve submission.",
        variant: "destructive"
      });
    }
  };

  const handleReject = async () => {
    if (!submission) return;
    
    try {
      const { error } = await supabase
        .from('task_submissions')
        .update({ 
          status: 'rejected',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', submission.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Submission rejected successfully.",
      });

      // Reload submission details
      loadSubmissionDetails();
    } catch (error: any) {
      console.error('Error rejecting submission:', error);
      toast({
        title: "Error",
        description: "Failed to reject submission.",
        variant: "destructive"
      });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/10 text-warning';
      case 'approved': return 'bg-success/10 text-success';
      case 'rejected': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading submission details...</span>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-muted-foreground">Submission not found</h1>
          <p className="text-muted-foreground mt-2">The submission you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button asChild className="mt-4">
            <Link to="/employer/submissions">← Back to Submissions</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Submission Details</h1>
            <p className="text-muted-foreground">Submission #{submission.id}</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/employer/submissions">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Submissions
            </Link>
          </Button>
        </div>

                 {/* Worker Information */}
         <Card>
           <CardHeader>
             <div className="flex justify-between items-center">
               <CardTitle className="flex items-center gap-2">
                 <User className="h-5 w-5" />
                 Worker Information
               </CardTitle>
               <Button 
                 variant="outline" 
                 size="sm"
                 onClick={() => {
                   console.log('=== DEBUGGING WORKER DATA ===');
                   console.log('Current submission:', submission);
                   console.log('Worker profile:', submission?.worker_profile);
                   console.log('Worker ID:', submission?.worker_id);
                 }}
               >
                 Debug Worker Data
               </Button>
             </div>
           </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                <p className="text-lg font-semibold">
                  {submission.worker_profile?.full_name || `Employee/Worker ${submission.worker_id.substring(0, 8)}`}
                </p>
              </div>
              <div>
                                  <p className="text-sm font-medium text-muted-foreground">Employee/Worker ID</p>
                <p className="text-sm font-mono bg-muted p-2 rounded">
                  {submission.worker_id}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Role</p>
                <Badge variant="outline">{submission.worker_profile?.role || 'worker'}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-sm">{submission.worker_profile?.email || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p className="text-sm">{submission.worker_profile?.phone || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Submitted</p>
                <p className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatTimeAgo(submission.submitted_at)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Task Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Task Title</p>
                <p className="text-lg font-semibold">{submission.task?.title || 'Unknown Task'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Budget</p>
                <p className="text-2xl font-bold text-success">
                  {submission.task ? formatINR(submission.task.budget) : 'Unknown'}
                </p>
              </div>
            </div>
            {submission.task?.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                <p className="text-sm">{submission.task.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submission Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Submission Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge className={getStatusColor(submission.status)} variant="secondary">
                {submission.status}
              </Badge>
              {submission.reviewed_at && (
                <p className="text-sm text-muted-foreground">
                  Reviewed {formatTimeAgo(submission.reviewed_at)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Proof Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Proof Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {submission.proof_text && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Text Proof</p>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{submission.proof_text}</p>
                </div>
              </div>
            )}

            {submission.proof_files && submission.proof_files.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Proof Files</p>
                <div className="space-y-2">
                  {submission.proof_files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">File {index + 1}</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setShowProofModal(true)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!submission.proof_text && (!submission.proof_files || submission.proof_files.length === 0) && (
              <p className="text-muted-foreground text-center py-8">No proof content provided</p>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {submission.status === 'pending' && (
          <Card>
            <CardHeader>
              <CardTitle>Review Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button 
                  onClick={handleApprove}
                  className="flex-1"
                  variant="default"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Submission
                </Button>
                <Button 
                  onClick={handleReject}
                  className="flex-1"
                  variant="destructive"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Submission
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Proof Modal */}
        {showProofModal && submission.proof_files && (
          <SubmissionProofModal
            submission={submission}
            isOpen={showProofModal}
            onClose={() => setShowProofModal(false)}
          />
        )}
      </div>
    </div>
  );
};

export default SubmissionDetail;
