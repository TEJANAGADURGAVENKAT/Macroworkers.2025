import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, X, Eye, Loader2, Star, User } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SubmissionProofModal } from "@/components/ui/submission-proof-modal";
import WorkerRatingModal from "@/components/ui/worker-rating-modal";
import { debugStorageBucket, checkFileExists, testSignedUrl } from "@/lib/storage-debug";

interface Submission {
  id: string;
  task_id: string;
  worker_id: string;
  proof_text: string | null;
  proof_files: string[] | null;
  proof_type?: 'text' | 'file' | 'both';
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  employer_rating_given?: number;
  rating_feedback?: string;
  task: {
    id: string;
    title: string;
    budget: number;
    created_by: string;
    required_rating?: number;
  };
  worker_profile?: {
    full_name: string;
    user_id?: string;
    rating?: number;
    total_tasks_completed?: number;
    total_earnings?: number;
  } | null;
}

const SubmissionsReview = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  // Check if employer is approved - redirect if not
  useEffect(() => {
    if (profile && profile.worker_status !== 'active_employee') {
      toast({
        title: "Access Restricted",
        description: "Please complete document verification to access submissions review.",
        variant: "destructive"
      });
      navigate('/employer/verify');
    }
  }, [profile, navigate, toast]);
  
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [submissionToRate, setSubmissionToRate] = useState<Submission | null>(null);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // First, get all submissions using a simpler approach
      console.log('Fetching submissions for user:', user.id);
      
      // Get user's tasks first
      const { data: userTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, title, budget, description, required_rating')
        .eq('created_by', user.id);
      
      console.log('User tasks:', userTasks);
      
      if (tasksError) {
        console.error('Tasks query error:', tasksError);
        throw tasksError;
      }
      
      let submissionsData = [];
      if (userTasks && userTasks.length > 0) {
        const taskIds = userTasks.map(t => t.id);
        console.log('Task IDs for submissions:', taskIds);
        
        const { data: submissions, error: submissionsError } = await supabase
          .from('task_submissions')
          .select('*')
          .in('task_id', taskIds)
          .order('submitted_at', { ascending: false });
        
        if (submissionsError) {
          console.error('Submissions query error:', submissionsError);
          throw submissionsError;
        }
        
        submissionsData = submissions || [];
        console.log('Raw submissions data:', submissionsData);
      }

      console.log('Raw submissions data:', submissionsData);
      
      // Get all unique worker IDs
      const workerIds = [...new Set(submissionsData?.map(s => s.worker_id) || [])];
      console.log('Worker IDs to fetch:', workerIds);
      
      // Fetch all worker profiles with rating information
      let { data: workerProfiles, error: workerError } = await supabase
        .from('profiles')
        .select('user_id, full_name, rating, total_tasks_completed, total_earnings')
        .in('user_id', workerIds);

      if (workerError) {
        console.error('Worker profiles query error:', workerError);
      }

      // If no profiles found, try to get from auth.users as fallback
      if (!workerProfiles || workerProfiles.length === 0) {
        console.log('No profiles found, trying auth.users fallback...');
        
        // For each worker ID, try to get user data
        const fallbackProfiles = [];
        for (const workerId of workerIds) {
          try {
            const { data: userData, error: userError } = await supabase.auth.admin.getUserById(workerId);
            if (userData?.user) {
              fallbackProfiles.push({
                user_id: workerId,
                full_name: userData.user.user_metadata?.full_name || 
                           userData.user.user_metadata?.name || 
                           userData.user.email ||
                           `Employee/Worker ${workerId.substring(0, 8)}`,
                rating: 3.0,
                total_tasks_completed: 0,
                total_earnings: 0
              });
            }
          } catch (err) {
            console.error('Error fetching user data for:', workerId, err);
          }
        }
        
        if (fallbackProfiles.length > 0) {
          console.log('Using fallback profiles:', fallbackProfiles);
          workerProfiles = fallbackProfiles;
        }
      }

      console.log('Worker profiles data:', workerProfiles);
      
      // Create a map for quick lookup
      const workerProfileMap = new Map();
      workerProfiles?.forEach(profile => {
        workerProfileMap.set(profile.user_id, profile);
      });
      
      // Fetch task data for submissions
      const taskIds = [...new Set(submissionsData.map(s => s.task_id))];
      const { data: taskData } = await supabase
        .from('tasks')
        .select('id, title, budget, description, required_rating')
        .in('id', taskIds);
      
      console.log('Task data for submissions:', taskData);
      
      const taskDataMap = new Map();
      taskData?.forEach(task => {
        taskDataMap.set(task.id, task);
      });
      
      // Transform the data to match our interface
      const submissionsWithWorkerNames = (submissionsData || []).map((submission) => {
        const workerProfile = workerProfileMap.get(submission.worker_id) || {
          full_name: `Worker ${submission.worker_id.substring(0, 8)}`,
          user_id: submission.worker_id,
          rating: 3.0,
          total_tasks_completed: 0,
          total_earnings: 0
        };
        
        const taskData = taskDataMap.get(submission.task_id) || {
          id: submission.task_id,
          title: 'Unknown Task',
          budget: 0,
          description: 'Task details not available',
          required_rating: 1.0
        };
        
        console.log(`Worker profile for ${submission.worker_id}:`, workerProfile);
        console.log(`Task data for ${submission.task_id}:`, taskData);
        
        return {
          ...submission,
          worker_profile: workerProfile,
          task: taskData
        };
      });
      
      // Cast the data to match our interface
      const typedData = submissionsWithWorkerNames.map(item => ({
        ...item,
        proof_type: item.proof_type as 'text' | 'file' | 'both' | undefined,
        status: item.status as 'pending' | 'approved' | 'rejected'
      }));
      
      setSubmissions(typedData);
    } catch (err: any) {
      console.error('Error loading submissions:', err);
      setError(err?.message || 'Failed to load submissions');
      toast({
        title: "Error",
        description: "Failed to load submissions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (submissionId: string) => {
    await updateSubmissionStatus(submissionId, 'approved');
  };

  const handleReject = async (submissionId: string) => {
    await updateSubmissionStatus(submissionId, 'rejected');
  };

  const handleViewProof = (submission: Submission) => {
    setSelectedSubmission(submission);
    setIsProofModalOpen(true);
  };

  const handleRateWorker = (submission: Submission) => {
    setSubmissionToRate(submission);
    setIsRatingModalOpen(true);
  };

  const updateSubmissionStatus = async (submissionId: string, status: 'approved' | 'rejected') => {
    setProcessingId(submissionId);
    
    try {
      const { error } = await supabase
        .from('task_submissions')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewer_notes: status === 'approved' ? 'Approved by employer' : 'Rejected by employer'
        })
        .eq('id', submissionId);

      if (error) throw error;

      toast({
        title: `Submission ${status}`,
        description: `The submission has been ${status}.`,
      });

      // Reload submissions to reflect the change
      await loadSubmissions();
    } catch (err: any) {
      console.error('Error updating submission:', err);
      toast({
        title: "Error",
        description: `Failed to ${status} submission. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success/10 text-success';
      case 'rejected': return 'bg-destructive/10 text-destructive';
      default: return 'bg-warning/10 text-warning';
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

  const handleDebugStorage = async () => {
    console.log('=== DEBUGGING STORAGE ===');
    await debugStorageBucket();
    
    // Test with first submission that has files
    const submissionWithFiles = submissions.find(s => s.proof_files && s.proof_files.length > 0);
    if (submissionWithFiles && submissionWithFiles.proof_files) {
      console.log('Testing with submission:', submissionWithFiles);
      for (const fileName of submissionWithFiles.proof_files) {
        await checkFileExists(submissionWithFiles.worker_id, fileName);
        await testSignedUrl(submissionWithFiles.worker_id, fileName);
      }
    }
  };

  const handleDebugWorkerNames = async () => {
    console.log('=== DEBUGGING WORKER NAMES ===');
    console.log('Current submissions:', submissions);
    
    // Test direct profile fetch for each worker
    for (const submission of submissions) {
      console.log(`\n--- Worker ${submission.worker_id} ---`);
      
      // Try to fetch profile directly
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .eq('user_id', submission.worker_id)
        .single();
      
      if (error) {
        console.log('Profile fetch error:', error);
      } else {
        console.log('Profile found:', profile);
      }
      
      console.log('Current display name:', submission.worker_profile?.full_name);
    }
  };

  const handleRatingComplete = () => {
    // Reload submissions to show updated ratings
    loadSubmissions();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading submissions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Review Submissions</h1>
            <p className="text-muted-foreground">Review, approve, and rate worker submissions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDebugStorage}>
              Debug Storage
            </Button>
            <Button variant="outline" size="sm" onClick={handleDebugWorkerNames}>
              Debug Worker Names
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={async () => {
                console.log('=== DEBUG SUBMISSIONS DIRECT ===');
                try {
                  // Test direct submissions query
                  const { data, error } = await supabase
                    .from('task_submissions')
                    .select('*');
                  
                  console.log('All submissions:', data);
                  console.log('Submissions error:', error);
                  
                  if (data && data.length > 0) {
                    console.log('Submission count:', data.length);
                    console.log('First submission:', data[0]);
                  }
                } catch (err) {
                  console.error('Direct submissions test failed:', err);
                }
              }}
            >
              Debug Submissions
            </Button>
            <Button variant="outline" asChild>
              <Link to="/employer">← Back to Dashboard</Link>
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {submissions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No submissions found.</p>
              <p className="text-sm text-muted-foreground mt-2">
                When workers submit tasks, they will appear here for review.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <Card key={submission.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold">{submission.task?.title || 'Unknown Task'}</h3>
                        {submission.task?.required_rating && (
                          <Badge variant="outline" className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span>{submission.task.required_rating}</span>
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>
                            {submission.worker_profile?.full_name ? submission.worker_profile.full_name : `Worker ${submission.worker_id.substring(0, 8)}...`}
                          </span>
                        </div>
                        <span>•</span>
                        <span>{formatTimeAgo(submission.submitted_at)}</span>
                        {submission.worker_profile?.rating && (
                          <>
                            <span>•</span>
                            <div className="flex items-center space-x-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span>{submission.worker_profile.rating.toFixed(1)}</span>
                            </div>
                          </>
                        )}
                      </div>
                      {submission.proof_text && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Text Proof: {submission.proof_text.substring(0, 100)}{submission.proof_text.length > 100 ? '...' : ''}
                        </p>
                      )}
                      {submission.proof_files && submission.proof_files.length > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Files: {submission.proof_files.length} file{submission.proof_files.length > 1 ? 's' : ''}
                        </p>
                      )}
                      {submission.employer_rating_given && (
                        <div className="flex items-center space-x-2 mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                          <Star className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-800 font-medium">
                            Rated: {submission.employer_rating_given}★
                          </span>
                          {submission.rating_feedback && (
                            <span className="text-xs text-green-700">
                              - {submission.rating_feedback}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge className={getStatusColor(submission.status)} variant="secondary">
                        {submission.status}
                      </Badge>
                      <span className="font-semibold">{formatINR(submission.task?.budget || 0)}</span>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleViewProof(submission)}
                          disabled={processingId === submission.id}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        {submission.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              className="bg-success" 
                              onClick={() => handleApprove(submission.id)}
                              disabled={processingId === submission.id}
                            >
                              {processingId === submission.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle className="h-3 w-3" />
                              )}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleReject(submission.id)}
                              disabled={processingId === submission.id}
                            >
                              {processingId === submission.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                            </Button>
                          </>
                        )}
                        {submission.status === 'approved' && !submission.employer_rating_given && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleRateWorker(submission)}
                            className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                          >
                            <Star className="h-3 w-3 mr-1" />
                            Rate Worker
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Proof Modal */}
        <SubmissionProofModal
          isOpen={isProofModalOpen}
          onClose={() => {
            setIsProofModalOpen(false);
            setSelectedSubmission(null);
          }}
          submission={selectedSubmission}
        />

        {/* Rating Modal */}
        {submissionToRate && (
          <WorkerRatingModal
            isOpen={isRatingModalOpen}
            onClose={() => {
              setIsRatingModalOpen(false);
              setSubmissionToRate(null);
            }}
            submission={submissionToRate}
            task={submissionToRate.task}
            worker={submissionToRate.worker_profile}
            onRatingComplete={handleRatingComplete}
          />
        )}
      </div>
    </div>
  );
};

export default SubmissionsReview;