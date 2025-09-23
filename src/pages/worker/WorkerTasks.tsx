import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Eye,
  Loader2,
  Play,
  Send
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WorkerSubmissionModal } from "@/components/ui/worker-submission-modal";

// Utility functions
const getStatusColor = (status: string) => {
  switch (status) {
    case "pending": return "bg-warning/10 text-warning";
    case "approved": return "bg-success/10 text-success";
    case "rejected": return "bg-destructive/10 text-destructive";
    case "assigned": return "bg-blue-100 text-blue-800 border-blue-200";
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

interface TaskSubmission {
  id: string;
  task_id: string;
  worker_id: string;
  proof_text: string | null;
  proof_files: string[] | null;
  status: 'pending' | 'approved' | 'rejected' | 'assigned';
  submitted_at: string;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  task: {
    id: string;
    title: string;
    budget: number;
    created_by: string;
  };
}

const WorkerTasks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<TaskSubmission | null>(null);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Load task assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('task_assignments')
        .select(`
          *,
          task:tasks(id, title, budget, created_by)
        `)
        .eq('worker_id', user.id)
        .order('assigned_at', { ascending: false });

      // Load task submissions  
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('task_submissions')
        .select(`
          *,
          task:tasks(id, title, budget, created_by)
        `)
        .eq('worker_id', user.id)
        .order('submitted_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;
      if (submissionsError) throw submissionsError;
      
      // Combine assignments and submissions
      const allTasks = [
        ...(assignmentsData || []).map(assignment => ({
          id: assignment.id,
          task_id: assignment.task_id,
          worker_id: assignment.worker_id,
          proof_text: null,
          proof_files: null,
          status: assignment.status,
          submitted_at: assignment.assigned_at,
          reviewed_at: null,
          reviewer_notes: null,
          task: assignment.task
        })),
        ...(submissionsData || [])
      ];
      
      setSubmissions(allTasks);
      
      console.log('Loaded assignments and submissions:', allTasks);
    } catch (err: any) {
      console.error('Error loading submissions:', err);
      setError(err?.message || 'Failed to load submissions');
      toast({
        title: "Error",
        description: "Failed to load your task submissions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };



  const getSubmissionsByStatus = (status: string) => {
    return submissions.filter(submission => submission.status === status);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading your tasks...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Tasks</h1>
          <p className="text-muted-foreground">Track your task progress and earnings</p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {/* My Task Status Section */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="font-semibold text-lg">I assigned a task</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {getSubmissionsByStatus('assigned').length} task{getSubmissionsByStatus('assigned').length !== 1 ? 's' : ''} assigned
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="assigned" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="assigned">Assigned ({getSubmissionsByStatus('assigned').length})</TabsTrigger>
            <TabsTrigger value="submitted">Submitted ({getSubmissionsByStatus('pending').length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({getSubmissionsByStatus('approved').length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({getSubmissionsByStatus('rejected').length})</TabsTrigger>
          </TabsList>

          <TabsContent value="assigned" className="space-y-4">
            {getSubmissionsByStatus('assigned').length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No assigned tasks found.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Assign yourself to tasks from the Available Jobs page to see them here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              getSubmissionsByStatus('assigned').map((submission) => (
                <TaskCard 
                  key={submission.id} 
                  submission={submission} 
                  onViewSubmission={(sub) => {
                    setSelectedSubmission(sub);
                    setIsSubmissionModalOpen(true);
                  }}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="submitted" className="space-y-4">
            {getSubmissionsByStatus('pending').length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No submitted tasks found.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Submit tasks from the Available Jobs page to see them here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              getSubmissionsByStatus('pending').map((submission) => (
                <TaskCard 
                  key={submission.id} 
                  submission={submission} 
                  onViewSubmission={(sub) => {
                    setSelectedSubmission(sub);
                    setIsSubmissionModalOpen(true);
                  }}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {getSubmissionsByStatus('approved').length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No approved tasks found.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Approved tasks will appear here once employers review your submissions.
                  </p>
                </CardContent>
              </Card>
            ) : (
              getSubmissionsByStatus('approved').map((submission) => (
                <TaskCard 
                  key={submission.id} 
                  submission={submission} 
                  onViewSubmission={(sub) => {
                    setSelectedSubmission(sub);
                    setIsSubmissionModalOpen(true);
                  }}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {getSubmissionsByStatus('rejected').length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No rejected tasks found.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Rejected tasks will appear here if any of your submissions are not approved.
                  </p>
                </CardContent>
              </Card>
            ) : (
              getSubmissionsByStatus('rejected').map((submission) => (
                <TaskCard 
                  key={submission.id} 
                  submission={submission} 
                  onViewSubmission={(sub) => {
                    setSelectedSubmission(sub);
                    setIsSubmissionModalOpen(true);
                  }}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Worker Submission Modal */}
      <WorkerSubmissionModal
        isOpen={isSubmissionModalOpen}
        onClose={() => {
          setIsSubmissionModalOpen(false);
          setSelectedSubmission(null);
        }}
        submission={selectedSubmission}
      />
    </div>
  );
};

const TaskCard = ({ submission, onViewSubmission }: { submission: TaskSubmission; onViewSubmission: (submission: TaskSubmission) => void }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h4 className="font-medium">{submission.task?.title || 'Unknown Task'}</h4>
          <p className="text-sm text-muted-foreground">
            {submission.status === 'assigned' 
              ? 'You assigned yourself to this task'
              : `Employer ${submission.task?.created_by?.substring(0, 8) || 'Unknown'}...`
            }
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-success">
            {formatINR(submission.task?.budget || 0)}
          </p>
          <Badge className={getStatusColor(submission.status)} variant="secondary">
            {submission.status === 'assigned' ? 'Assigned' : submission.status}
          </Badge>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-1" />
          <span>
            {submission.status === 'assigned' 
              ? `Assigned ${formatTimeAgo(submission.submitted_at)}`
              : `Submitted ${formatTimeAgo(submission.submitted_at)}`
            }
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {submission.status === 'assigned' && (
            <Button 
              variant="default" 
              size="sm" 
              asChild
            >
              <Link to={`/worker/task/${submission.task_id}`}>
                <Play className="w-4 h-4 mr-1" />
                Work on Task
              </Link>
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onViewSubmission(submission)}
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
        </div>
      </div>

      {submission.status === 'assigned' && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Status:</strong> You have assigned yourself to this task. You can now work on it and submit your proof when ready.
          </p>
        </div>
      )}

      {submission.proof_text && submission.status !== 'assigned' && (
        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Proof:</strong> {submission.proof_text.substring(0, 150)}
            {submission.proof_text.length > 150 ? '...' : ''}
          </p>
        </div>
      )}

      {submission.reviewer_notes && (
        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Review Notes:</strong> {submission.reviewer_notes}
          </p>
        </div>
      )}
    </CardContent>
  </Card>
);

export default WorkerTasks;