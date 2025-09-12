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
  Trash2
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

interface TaskStats {
  totalViews: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
  completionRate: number;
}

const TaskDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [task, setTask] = useState<Task | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<TaskStats>({
    totalViews: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0,
    approvedSubmissions: 0,
    rejectedSubmissions: 0,
    completionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadTaskDetails();
    }
  }, [id]);

  const loadTaskDetails = async () => {
    if (!id || !user) return;
    
    setLoading(true);
    try {
      // Load task details
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .eq('created_by', user.id)
        .single();

      if (taskError) throw taskError;
      setTask(taskData);

      // Load submissions for this task (without join to avoid relationship ambiguity)
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('task_submissions')
        .select('*')
        .eq('task_id', id)
        .order('submitted_at', { ascending: false });

      if (submissionsError) throw submissionsError;

      // Fetch worker names for submissions separately
      const submissionsWithNames = await Promise.all(
        (submissionsData || []).map(async (submission) => {
          try {
            console.log('Fetching worker profile for:', submission.worker_id);
            
                         const { data: workerData, error: workerError } = await supabase
               .from('profiles')
               .select('full_name, user_id, role, email, phone')
               .eq('user_id', submission.worker_id)
               .single();
            
            if (workerError || !workerData) {
              console.log('Worker profile not found for:', submission.worker_id);
              return {
                ...submission,
                worker_profile: { 
                  full_name: `Worker ${submission.worker_id.substring(0, 8)}`,
                  user_id: submission.worker_id,
                  role: 'worker'
                }
              };
            }
            
            console.log('Worker data found:', workerData);
            return {
              ...submission,
              worker_profile: workerData
            };
          } catch (err) {
            console.error('Error fetching worker profile:', err);
            return {
              ...submission,
              worker_profile: { 
                full_name: `Worker ${submission.worker_id.substring(0, 8)}`,
                user_id: submission.worker_id,
                role: 'worker'
              }
            };
          }
        })
      );

      setSubmissions(submissionsWithNames);

      // Load task view statistics
      const { data: viewsData, error: viewsError } = await supabase
        .from('task_views')
        .select('*')
        .eq('task_id', id);

      const totalViews = viewsData?.length || 0;

      // Calculate statistics
      const totalSubmissions = submissionsWithNames.length;
      const pendingSubmissions = submissionsWithNames.filter(s => s.status === 'pending').length;
      const approvedSubmissions = submissionsWithNames.filter(s => s.status === 'approved').length;
      const rejectedSubmissions = submissionsWithNames.filter(s => s.status === 'rejected').length;
      const completionRate = totalSubmissions > 0 ? (approvedSubmissions / totalSubmissions) * 100 : 0;

      setStats({
        totalViews,
        totalSubmissions,
        pendingSubmissions,
        approvedSubmissions,
        rejectedSubmissions,
        completionRate
      });

    } catch (error: any) {
      console.error('Error loading task details:', error);
      toast({
        title: "Error",
        description: "Failed to load task details.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

  const deleteTask = async (taskId: string) => {
    if (!user) return;
    
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone and will also delete all related submissions.')) {
      return;
    }
    
    setDeleting(true);
    
    try {
      console.log('Deleting task:', taskId);
      
      // First, delete related submissions
      const { error: submissionsError } = await supabase
        .from('task_submissions')
        .delete()
        .eq('task_id', taskId);
      
      if (submissionsError) {
        console.error('Error deleting submissions:', submissionsError);
        throw submissionsError;
      }
      
      // Then delete the task
      const { error: taskError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('created_by', user.id); // Ensure only the creator can delete
      
      if (taskError) {
        console.error('Error deleting task:', taskError);
        throw taskError;
      }
      
      console.log('Task deleted successfully');
      
      toast({
        title: "Task Deleted",
        description: "The task and all its submissions have been deleted successfully.",
      });
      
      // Redirect to campaigns page
      window.location.href = '/employer/campaigns';
      
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: `Failed to delete task: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
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
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading task details...</span>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-muted-foreground">Task not found</h1>
          <p className="text-muted-foreground mt-2">The task you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button asChild className="mt-4">
            <Link to="/employer/campaigns">← Back to Campaigns</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Task Details</h1>
            <p className="text-muted-foreground">Task #{task.id}</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" asChild>
              <Link to="/employer/campaigns">← Back to Campaigns</Link>
            </Button>
            <Button 
              variant="destructive"
              onClick={() => deleteTask(task.id)}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleting ? 'Deleting...' : 'Delete Task'}
            </Button>
          </div>
        </div>

        {/* Task Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {task.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Budget</p>
                <p className="text-2xl font-bold text-success">{formatINR(task.budget)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant="secondary">{task.status}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatTimeAgo(task.created_at)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Target Countries</p>
                <div className="flex flex-wrap gap-1">
                  {task.target_countries?.map((country, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      <MapPin className="h-3 w-3 mr-1" />
                      {country}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
              <p className="text-sm">{task.description}</p>
            </div>

            {task.requirements && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Requirements</p>
                <p className="text-sm">{task.requirements}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-bold">{stats.totalViews}</p>
                </div>
                <Eye className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Submissions</p>
                  <p className="text-2xl font-bold">{stats.totalSubmissions}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold text-success">{stats.approvedSubmissions}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                  <p className="text-2xl font-bold">{stats.completionRate.toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

                 {/* Submissions */}
         <Card>
           <CardHeader>
             <div className="flex justify-between items-center">
               <CardTitle>Worker Submissions</CardTitle>
               <Button 
                 variant="outline" 
                 size="sm"
                 onClick={() => {
                   console.log('=== DEBUGGING SUBMISSIONS ===');
                   console.log('All submissions:', submissions);
                   submissions.forEach((sub, index) => {
                     console.log(`Submission ${index + 1}:`, {
                       id: sub.id,
                       worker_id: sub.worker_id,
                       worker_name: sub.worker_profile?.full_name,
                       worker_role: sub.worker_profile?.role,
                       status: sub.status,
                       submitted_at: sub.submitted_at
                     });
                   });
                 }}
               >
                 Debug Submissions
               </Button>
             </div>
           </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No submissions yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Employees/Workers will appear here once they submit their work.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                                 {submissions.map((submission) => (
                   <div key={submission.id} className="border rounded-lg p-4">
                     <div className="flex justify-between items-start">
                       <div className="flex-1">
                         <div className="flex items-center gap-2 mb-2">
                           <h3 className="font-semibold text-lg">
                             {submission.worker_profile?.full_name || `Worker ${submission.worker_id.substring(0, 8)}`}
                           </h3>
                           <Badge variant="outline" className="text-xs">
                             {submission.worker_profile?.role || 'worker'}
                           </Badge>
                         </div>
                         
                                                    <div className="space-y-1 mb-3">
                             <p className="text-sm text-muted-foreground">
                               <span className="font-medium">Worker ID:</span> {submission.worker_id}
                             </p>
                             <p className="text-sm text-muted-foreground">
                               <span className="font-medium">Email:</span> {submission.worker_profile?.email || 'Not provided'}
                             </p>
                             <p className="text-sm text-muted-foreground">
                               <span className="font-medium">Phone:</span> {submission.worker_profile?.phone || 'Not provided'}
                             </p>
                             <p className="text-sm text-muted-foreground">
                               <span className="font-medium">Submitted:</span> {formatTimeAgo(submission.submitted_at)}
                             </p>
                             <p className="text-sm text-muted-foreground">
                               <span className="font-medium">Status:</span> 
                               <Badge className={`ml-2 ${getStatusColor(submission.status)}`} variant="secondary">
                                 {submission.status}
                               </Badge>
                             </p>
                           </div>
                         
                         {submission.proof_text && (
                           <div className="mb-2">
                             <p className="text-sm font-medium text-muted-foreground mb-1">Text Proof:</p>
                             <p className="text-sm bg-muted p-2 rounded">
                               {submission.proof_text.substring(0, 150)}
                               {submission.proof_text.length > 150 ? '...' : ''}
                             </p>
                           </div>
                         )}
                         
                         {submission.proof_files && submission.proof_files.length > 0 && (
                           <div className="mb-2">
                             <p className="text-sm font-medium text-muted-foreground mb-1">Proof Files:</p>
                             <div className="flex flex-wrap gap-1">
                               {submission.proof_files.map((file, index) => (
                                 <Badge key={index} variant="outline" className="text-xs">
                                   <FileText className="h-3 w-3 mr-1" />
                                   File {index + 1}
                                 </Badge>
                               ))}
                             </div>
                           </div>
                         )}
                       </div>
                       
                       <div className="flex flex-col items-end space-y-3">
                         <div className="text-right">
                           <p className="text-sm text-muted-foreground">Task Budget</p>
                           <p className="text-lg font-bold text-success">{formatINR(task.budget)}</p>
                         </div>
                         
                         <Button 
                           size="sm" 
                           variant="outline" 
                           asChild
                         >
                           <Link to={`/employer/submissions/${submission.id}`}>
                             <Eye className="h-3 w-3 mr-1" />
                             View Details
                           </Link>
                         </Button>
                       </div>
                     </div>
                   </div>
                 ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TaskDetails;
