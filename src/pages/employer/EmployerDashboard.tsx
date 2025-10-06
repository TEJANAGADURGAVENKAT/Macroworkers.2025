import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { 
  Plus,
  BarChart3,
  Users,
  IndianRupee,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  Activity,
  Briefcase,
  FileText,
  CreditCard,
  Loader2,
  Trash2,
  Star,
  MessageSquare,
  UserCheck,
  Calendar
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StarRating from "@/components/ui/star-rating-simple";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { updateEmployeeRating, getDesignationColor, getDesignationLabel, getEmployeeRatingSummary } from "@/lib/employee-ratings-api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkersList } from "@/hooks/useWorkersList";
import { useWorkerDocuments } from "@/hooks/useWorkerDocuments";
import { WorkerVerificationCard } from "@/components/employer/WorkerVerificationCard";

interface Task {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: string;
  created_at: string;
  slots?: number;
  completed_slots?: number;
  submission_count?: { count: number }[];
  employer_name?: string;
  max_assignees?: number;
  current_assignees?: number;
  assignment_start_time?: string;
  assignment_end_time?: string;
  assigned_workers?: WorkerDetail[];
}

interface WorkerDetail {
  user_id: string;
  full_name: string;
  rating: number;
  total_tasks_completed: number;
  status: 'assigned' | 'pending' | 'approved' | 'rejected';
  assigned_at: string;
  proof_text?: string;
  proof_files?: string[];
}

interface Submission {
  id: string;
  task_id: string;
  worker_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'assigned';
  submitted_at: string;
  proof_text?: string;
  proof_files?: string[];
  task_title?: string;
  task_budget?: number;
  employer_rating_given?: number;
  rating_feedback?: string;
  worker_profile?: {
    full_name: string;
    rating?: number;
    total_tasks_completed?: number;
    designation?: string;
  };
}

const EmployerDashboard = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState({
    activeCampaigns: 0,
            totalEmployeesWorkers: 0,
    monthlySpent: 0,
    completionRate: 0
  });
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [submissionRatings, setSubmissionRatings] = useState<Record<string, number>>({});
  const [submissionFeedback, setSubmissionFeedback] = useState<Record<string, string>>({});
  const [submittingRating, setSubmittingRating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const displayName = (profile?.full_name || user?.email || "").split("@")[0] || "User";
  
  // Worker verification hooks
  const { 
    workers, 
    loading: workersLoading, 
    getWorkersNeedingVerification, 
    getWorkersReadyForInterview 
  } = useWorkersList();
  const sidebarItems = [
    { title: "Dashboard", url: "/employer", icon: Activity },
    { title: "My Campaigns", url: "/employer/campaigns", icon: Briefcase },
    { title: "Create Task", url: "/employer/create-task", icon: Plus },
    { title: "Worker Verification", url: "/employer/worker-verification", icon: UserCheck },
    { title: "Interview Scheduling", url: "/employer/interview-scheduling", icon: Calendar },
    { title: "Review Submissions", url: "/employer/submissions", icon: FileText },
    { title: "Payments", url: "/employer/payments", icon: CreditCard },
    { title: "Profile", url: "/employer/profile", icon: Users },
  ];

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('Loading dashboard data for user:', user.id);
      
      // Load tasks with new assignment limit fields
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });
      
      console.log('Tasks loaded with assignment data:', tasksData?.map(t => ({
        id: t.id,
        title: t.title,
        assignment_start_time: t.assignment_start_time,
        assignment_end_time: t.assignment_end_time,
        max_workers: t.max_workers,
        assigned_count: t.assigned_count
      })));

      if (tasksError) {
        console.error('Tasks query error:', tasksError);
        throw tasksError;
      }

      console.log('Tasks loaded:', tasksData);

      // Load recent submissions with more details
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('task_submissions')
        .select(`
          *,
          tasks!inner(
            id,
            title,
            budget,
            created_by
          )
        `)
        .eq('tasks.created_by', user.id)
        .order('submitted_at', { ascending: false })
        .limit(10);

      if (submissionsError) {
        console.error('Submissions query error:', submissionsError);
        throw submissionsError;
      }

      console.log('Submissions loaded:', submissionsData);

      // Get worker profiles for submissions with calculated ratings
      if (submissionsData && submissionsData.length > 0) {
        const workerIds = [...new Set(submissionsData.map(s => s.worker_id))];
        
        // Fetch worker profiles with basic info
        const { data: workerProfiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, designation')
          .in('user_id', workerIds);
        
        // Calculate actual ratings for each worker using the same logic as Employee Dashboard
        const workerProfileMap = new Map();
        
        for (const profile of workerProfiles || []) {
          try {
            // Use the same API that Employee Dashboard uses
            const ratingSummary = await getEmployeeRatingSummary(profile.user_id);
            
            if (ratingSummary) {
              workerProfileMap.set(profile.user_id, {
                full_name: profile.full_name,
                rating: ratingSummary.average_rating,
                total_tasks_completed: ratingSummary.approved_ratings_count,
                designation: ratingSummary.designation
              });
            } else {
              // Fallback to default values for new workers
              workerProfileMap.set(profile.user_id, {
                full_name: profile.full_name,
                rating: 1.0,
                total_tasks_completed: 0,
                designation: 'L1'
              });
            }
          } catch (error) {
            console.error(`Error getting rating for worker ${profile.user_id}:`, error);
            // Fallback to default values
            workerProfileMap.set(profile.user_id, {
              full_name: profile.full_name,
              rating: 1.0,
              total_tasks_completed: 0,
              designation: 'L1'
            });
          }
        }
        
        const submissionsWithData = submissionsData.map(submission => ({
          ...submission,
          status: submission.status as 'pending' | 'approved' | 'rejected' | 'assigned',
          task_title: submission.tasks?.title || 'Unknown Task',
          task_budget: submission.tasks?.budget || 0,
          employer_rating_given: submission.employer_rating_given || 0,
          rating_feedback: submission.rating_feedback || '',
          worker_profile: workerProfileMap.get(submission.worker_id) || {
            full_name: `Worker ${submission.worker_id.substring(0, 8)}`,
            rating: 1.0, // New workers start with 1.0 rating
            total_tasks_completed: 0,
            designation: 'L1'
          }
        }));

        setRecentSubmissions(submissionsWithData);
      }

      // Calculate statistics
      const activeTasks = tasksData?.filter(t => t.status === 'active') || [];
      const totalBudget = tasksData?.reduce((sum, t) => sum + (t.budget || 0), 0) || 0;
      const completedTasks = tasksData?.filter(t => t.status === 'completed') || [];
      const completionRate = tasksData && tasksData.length > 0 
        ? Math.round((completedTasks.length / tasksData.length) * 100) 
        : 0;

      // Get unique workers who submitted tasks
      const { data: uniqueWorkers } = await supabase
        .from('task_submissions')
        .select('worker_id')
        .eq('employer_id', user.id);

      const uniqueWorkerCount = uniqueWorkers ? new Set(uniqueWorkers.map(w => w.worker_id)).size : 0;

      setStats({
        activeCampaigns: activeTasks.length,
        totalEmployeesWorkers: uniqueWorkerCount,
        monthlySpent: totalBudget,
        completionRate
      });

      // Load assigned worker details for each task
      const tasksWithWorkers = await Promise.all(
        (tasksData || []).map(async (task) => {
          try {
            // Get all assignments for this task from task_assignments table
            const { data: taskAssignments, error: assignmentError } = await supabase
              .from('task_assignments')
              .select(`
                *,
                profiles!inner(user_id, full_name, email, rating, total_tasks_completed)
              `)
              .eq('task_id', task.id);
              
            console.log(`Assignments for task ${task.title}:`, taskAssignments);
            console.log(`Assignment query error:`, assignmentError);
            
            if (taskAssignments && taskAssignments.length > 0) {
              // Get detailed worker info
              const assignedWorkers = taskAssignments.map((assignment) => {
                const workerProfile = assignment.profiles;
                
                return {
                  user_id: assignment.worker_id,
                  full_name: workerProfile?.full_name || `Worker ${assignment.worker_id.substring(0, 8)}`,
                  email: workerProfile?.email || 'No email',
                  rating: workerProfile?.rating || 1.0,
                  total_tasks_completed: workerProfile?.total_tasks_completed || 0,
                  status: assignment.status,
                  assigned_at: assignment.assigned_at
                };
              });
              
              console.log(`Assigned workers for task ${task.title}:`, assignedWorkers);

              return {
                ...task,
                assigned_workers: assignedWorkers
              };
            }

            return task;
          } catch (error) {
            console.error(`Error loading workers for task ${task.id}:`, error);
            return task;
          }
        })
      );

      setTasks(tasksWithWorkers || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleRatingChange = (submissionId: string, rating: number) => {
    setSubmissionRatings(prev => ({
      ...prev,
      [submissionId]: rating
    }));
  };

  const handleFeedbackChange = (submissionId: string, feedback: string) => {
    setSubmissionFeedback(prev => ({
      ...prev,
      [submissionId]: feedback
    }));
  };

  const handleSubmitRating = async (submissionId: string) => {
    const rating = submissionRatings[submissionId];
    const feedback = submissionFeedback[submissionId] || '';

    if (!rating || rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting.",
        variant: "destructive"
      });
      return;
    }

    // Find the submission to check its status
    const submission = recentSubmissions.find(s => s.id === submissionId);
    if (!submission) {
      toast({
        title: "Submission Not Found",
        description: "Unable to find the submission to rate.",
        variant: "destructive"
      });
      return;
    }

    // Only allow rating approved submissions
    if (submission.status !== 'approved') {
      toast({
        title: "Rating Not Allowed",
        description: "You can only rate approved submissions.",
        variant: "destructive"
      });
      return;
    }

    setSubmittingRating(submissionId);

    try {
      // Use the new employee ratings API
      const result = await updateEmployeeRating(submissionId, rating, feedback);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update rating');
      }

      // Update local state to reflect the submitted rating
      setRecentSubmissions(prev => 
        prev.map(submission => 
          submission.id === submissionId 
            ? { ...submission, employer_rating_given: rating, rating_feedback: feedback }
            : submission
        )
      );

      // Reload dashboard data to get updated ratings
      await loadDashboardData();

      toast({
        title: "Rating Submitted",
        description: `Successfully rated ${rating} star${rating > 1 ? 's' : ''} for this approved submission.`,
      });

    } catch (error: any) {
      console.error('Error submitting rating:', error);
      toast({
        title: "Failed to Submit Rating",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setSubmittingRating(null);
    }
  };

  const handleDocumentStatusUpdate = async (documentId: string, status: 'approved' | 'rejected', notes?: string) => {
    try {
      const { error } = await supabase
        .from('worker_documents')
        .update({
          verification_status: status,
          verification_notes: notes,
          verified_by: user?.id,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: "Document Status Updated",
        description: `Document has been ${status} successfully.`,
      });

      // Check if all documents are approved and update worker status
      const document = await supabase
        .from('worker_documents')
        .select('worker_id')
        .eq('id', documentId)
        .single();

      if (document.data) {
        const { data: allDocuments } = await supabase
          .from('worker_documents')
          .select('verification_status')
          .eq('worker_id', document.data.worker_id);

        const allApproved = allDocuments?.every(doc => doc.verification_status === 'approved');
        
        if (allApproved) {
          await supabase
            .from('profiles')
            .update({ 
              worker_status: 'interview_pending',
              status: 'interview_pending',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', document.data.worker_id);

          toast({
            title: "Worker Status Updated",
            description: "All documents approved. Worker is now ready for interview scheduling.",
          });
        }
      }
    } catch (error: any) {
      console.error('Error updating document status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update document status.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const handleManualStatusUpdate = async (workerId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          worker_status: newStatus,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', workerId);

      if (error) throw error;

      // Log the status change
      await supabase
        .from('worker_status_logs')
        .insert({
          worker_id: workerId,
          old_status: 'interview_scheduled',
          new_status: newStatus,
          notes: 'Manually updated by employer',
          changed_by: user?.id
        });

      toast({
        title: "Worker Status Updated",
        description: `Worker status updated to ${newStatus}.`,
      });

      // Reload workers data
      await loadWorkersForInterview();
    } catch (error: any) {
      console.error('Error updating worker status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update worker status.",
        variant: "destructive"
      });
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-success/10 text-success";
      case "pending": return "bg-warning/10 text-warning";
      case "approved": return "bg-success/10 text-success";
      case "rejected": return "bg-destructive/10 text-destructive";
      case "assigned": return "bg-blue-100 text-blue-700";
      case "paused": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };
  const getDesignationColor = (designation: string) => {
    switch (designation) {
      case "L1": return "bg-red-100 text-red-700";
      case "L2": return "bg-yellow-100 text-yellow-700";
      case "L3": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getDesignationLabel = (designation: string) => {
    switch (designation) {
      case "L1": return "Beginner";
      case "L2": return "Intermediate";
      case "L3": return "Expert";
      default: return "Unknown";
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
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }
    
    setDeletingTaskId(taskId);
    
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
      
      // Remove from local state
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      
      // Show success message
      alert('Task deleted successfully!');
      
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(`Failed to delete task: ${error.message}`);
    } finally {
      setDeletingTaskId(null);
    }
  };

  const statsCards = [
    { 
      label: "Active Campaigns", 
      value: stats.activeCampaigns.toString(), 
      icon: BarChart3, 
      color: "text-primary" 
    },
    { 
      label: "Total Workers",
      value: stats.totalEmployeesWorkers.toString(), 
      icon: Users, 
      color: "text-success" 
    },
    { 
      label: "Total Budget", 
      value: formatINR(stats.monthlySpent), 
      icon: IndianRupee, 
      color: "text-warning" 
    },
    { 
      label: "Completion Rate", 
      value: `${stats.completionRate}%`, 
      icon: CheckCircle, 
      color: "text-success" 
    }
  ];

  const activeCampaigns = tasks.filter(task => task.status === 'active').slice(0, 3);

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <Sidebar className="w-64">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel className="text-lg font-semibold mb-4">
                  Employer Portal
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {sidebarItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <Link to={item.url} className="flex items-center space-x-3">
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>

          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading dashboard...</span>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar className="w-64">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-lg font-semibold mb-4">
                Employer Portal
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sidebarItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link to={item.url} className="flex items-center space-x-3">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Welcome back, {displayName}! 🚀</h1>
                <p className="text-muted-foreground">
                  Employer Dashboard • {displayName} • {tasks.length} tasks created
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    console.log('=== DEBUG DASHBOARD ===');
                    console.log('User:', user);
                    console.log('Profile:', profile);
                    console.log('Tasks:', tasks);
                    console.log('Submissions:', recentSubmissions);
                    console.log('Stats:', stats);
                  }}
                >
                  Debug
                </Button>
                <Button className="bg-gradient-primary" asChild>
                  <Link to="/employer/create-task">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Task
                  </Link>
                </Button>
                <SidebarTrigger />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsCards.map((stat) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                          <p className="text-2xl font-bold">{stat.value}</p>
                        </div>
                        <stat.icon className={`h-8 w-8 ${stat.color}`} />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Tabbed Interface */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="verification">Worker Verification</TabsTrigger>
                <TabsTrigger value="interviews">Interview Scheduling</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Active Campaigns */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Active Campaigns</CardTitle>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/employer/campaigns">View All</Link>
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {activeCampaigns.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No active campaigns yet.</p>
                        <Button className="mt-2" asChild>
                          <Link to="/employer/create-task">Create Your First Task</Link>
                        </Button>
                      </div>
                    ) : (
                                             activeCampaigns.map((campaign) => {
                         const target = campaign.slots || 0;
                         const completed = campaign.completed_slots || 0;
                         
                         return (
                          <div key={campaign.id} className="p-4 bg-muted/30 rounded-lg space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">{campaign.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Budget: {formatINR(campaign.budget)} • Created by: {displayName}
                                </p>
                                {campaign.assigned_workers && campaign.assigned_workers.length > 0 && (
                                  <p className="text-xs text-blue-600 mt-1">
                                    {campaign.assigned_workers.length} worker{campaign.assigned_workers.length > 1 ? 's' : ''} assigned
                                  </p>
                                )}
                                {/* Show assignment constraints and counts */}
                                <div className="text-xs text-muted-foreground mt-1 space-y-1">
                                  {campaign.assignment_start_time && campaign.assignment_end_time && (
                                    <div>🕒 Assignment: {campaign.assignment_start_time} - {campaign.assignment_end_time}</div>
                                  )}
                                  {campaign.max_workers && (
                                    <div>👥 Assigned: {campaign.assigned_count || 0}/{campaign.max_workers} workers</div>
                                  )}
                                </div>
                              </div>
                              <Badge className={getStatusColor(campaign.status)}>
                                {campaign.status}
                              </Badge>
                            </div>

                            {/* Assigned Workers Details */}
                            {campaign.assigned_workers && campaign.assigned_workers.length > 0 && (
                              <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                                <h5 className="text-sm font-medium text-blue-900">Assigned Workers:</h5>
                                <div className="space-y-2">
                                  {campaign.assigned_workers.map((worker) => (
                                    <div key={worker.user_id} className="flex items-center justify-between bg-white rounded p-2">
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                          <span className="text-sm font-medium">{worker.full_name}</span>
                                          <Badge variant="outline" className="text-xs">
                                            ⭐ {worker.rating.toFixed(1)}
                                          </Badge>
                                          <Badge 
                                            variant="secondary" 
                                            className={`text-xs ${
                                              worker.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                                              worker.status === 'working' ? 'bg-yellow-100 text-yellow-800' :
                                              worker.status === 'submitted' ? 'bg-green-100 text-green-800' :
                                              'bg-gray-100 text-gray-800'
                                            }`}
                                          >
                                            {worker.status}
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                          📧 {worker.email}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {worker.total_tasks_completed} tasks completed • Assigned {formatTimeAgo(worker.assigned_at)}
                                        </p>
                                        {worker.proof_text && worker.status !== 'assigned' && (
                                          <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                                            Proof: {worker.proof_text}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                                                         <div className="space-y-2">
                               <div className="flex justify-between text-sm">
                                 <span>Progress</span>
                                 <span>{completed}/{target}</span>
                               </div>
                               <div className="w-full bg-muted rounded-full h-2">
                                 <div 
                                   className="bg-gradient-primary h-2 rounded-full transition-all duration-500"
                                   style={{ width: `${target > 0 ? (completed / target) * 100 : 0}%` }}
                                 />
                               </div>
                             </div>

                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Created: {new Date(campaign.created_at).toLocaleDateString()}</span>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm" asChild>
                                  <Link to={`/employer/task/${campaign.id}`}>
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Link>
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => deleteTask(campaign.id)}
                                  disabled={deletingTaskId === campaign.id}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  {deletingTaskId === campaign.id ? '...' : 'Delete'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Submitted Tasks & Quick Actions */}
              <div className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Submitted Tasks</CardTitle>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/employer/submissions">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {recentSubmissions.filter(s => s.status === 'pending').length} Pending
                      </Link>
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentSubmissions.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground mb-2">No submissions yet.</p>
                        <p className="text-xs text-muted-foreground">Workers will appear here when they submit tasks.</p>
                      </div>
                    ) : (
                      recentSubmissions.slice(0, 5).map((submission) => (
                        <div key={submission.id} className="p-4 bg-muted/30 rounded-lg space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{submission.task_title || 'Unknown Task'}</h4>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  Worker: {submission.worker_profile?.full_name || `Worker ${submission.worker_id.substring(0, 8)}`}
                                </span>
                                {submission.worker_profile?.rating && (
                                  <Badge variant="outline" className="text-xs">
                                    ⭐ {submission.worker_profile.rating.toFixed(1)}
                                  </Badge>
                                )}
                                {submission.worker_profile?.designation && (
                                  <Badge 
                                    variant="secondary" 
                                    className={`text-xs ${getDesignationColor(submission.worker_profile.designation)}`}
                                  >
                                    {submission.worker_profile.designation} - {getDesignationLabel(submission.worker_profile.designation)}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Budget: {formatINR(submission.task_budget || 0)} • {formatTimeAgo(submission.submitted_at)}
                              </p>
                            </div>
                            <Badge 
                              variant="secondary" 
                              className={getStatusColor(submission.status)}
                            >
                              {submission.status}
                            </Badge>
                          </div>
                          
                          {/* Proof Information */}
                          {(submission.proof_text || submission.proof_files?.length) && (
                            <div className="bg-white/50 rounded p-3 space-y-2">
                              <p className="text-xs font-medium text-slate-700">Proof Submitted:</p>
                              {submission.proof_text && (
                                <p className="text-xs text-slate-600 line-clamp-2">
                                  {submission.proof_text}
                                </p>
                              )}
                              {submission.proof_files && submission.proof_files.length > 0 && (
                                <div className="flex items-center space-x-1">
                                  <FileText className="w-3 h-3 text-slate-500" />
                                  <span className="text-xs text-slate-600">
                                    {submission.proof_files.length} file{submission.proof_files.length > 1 ? 's' : ''} attached
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Rating Section - Only show for approved submissions */}
                          {submission.status === 'approved' && (
                            <div className="pt-3 border-t border-slate-200">
                              {submission.employer_rating_given && submission.employer_rating_given > 0 ? (
                                /* Already Rated - Show Submitted Rating */
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs font-medium text-slate-700">Your Rating:</span>
                                      <div className="flex items-center space-x-1">
                                        {Array.from({ length: 5 }, (_, index) => (
                                          <Star
                                            key={index}
                                            className={`w-4 h-4 ${
                                              index < submission.employer_rating_given!
                                                ? 'text-yellow-400 fill-yellow-400'
                                                : 'text-gray-300 fill-gray-300'
                                            }`}
                                          />
                                        ))}
                                        <span className="text-xs text-muted-foreground ml-1">
                                          ({submission.employer_rating_given}/5)
                                        </span>
                                      </div>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                      Rated
                                    </Badge>
                                  </div>
                                  {submission.rating_feedback && (
                                    <div className="bg-blue-50 p-2 rounded text-xs text-slate-700">
                                      <span className="font-medium">Your feedback:</span> {submission.rating_feedback}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                /* Not Rated - Show Rating Interface */
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-700">Rate this submission:</span>
                                    <div className="flex items-center space-x-2">
                                      <StarRating
                                        currentRating={submissionRatings[submission.id] || 0}
                                        onRatingChange={(rating) => handleRatingChange(submission.id, rating)}
                                        size="sm"
                                      />
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                      <MessageSquare className="w-3 h-3 text-slate-500" />
                                      <span className="text-xs text-slate-700">Optional feedback:</span>
                                    </div>
                                    <Textarea
                                      placeholder="Share your thoughts about this submission..."
                                      value={submissionFeedback[submission.id] || ''}
                                      onChange={(e) => handleFeedbackChange(submission.id, e.target.value)}
                                      className="min-h-[60px] text-xs resize-none"
                                      maxLength={500}
                                    />
                                    <div className="text-xs text-muted-foreground text-right">
                                      {(submissionFeedback[submission.id] || '').length}/500 characters
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <Button variant="outline" size="sm" asChild>
                                        <Link to={`/employer/submissions/${submission.id}`}>
                                          <Eye className="h-3 w-3 mr-1" />
                                          Review
                                        </Link>
                                      </Button>
                                    </div>
                                    
                                    <Button
                                      size="sm"
                                      onClick={() => handleSubmitRating(submission.id)}
                                      disabled={submittingRating === submission.id || !submissionRatings[submission.id] || submissionRatings[submission.id] === 0}
                                      className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                      {submittingRating === submission.id ? (
                                        <>
                                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                          Submitting...
                                        </>
                                      ) : (
                                        <>
                                          <Star className="h-3 w-3 mr-1" />
                                          Submit Rating
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Action buttons for non-approved submissions */}
                          {submission.status !== 'approved' && (
                            <div className="pt-3 border-t border-slate-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Button variant="outline" size="sm" asChild>
                                    <Link to={`/employer/submissions/${submission.id}`}>
                                      <Eye className="h-3 w-3 mr-1" />
                                      Review
                                    </Link>
                                  </Button>
                                  {submission.status === 'pending' && (
                                    <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Approve
                                    </Button>
                                  )}
                                </div>
                                
                                {submission.status === 'rejected' && (
                                  <div className="text-xs text-muted-foreground">
                                    Rating not available for rejected submissions
                                  </div>
                                )}
                                
                                {submission.status === 'pending' && (
                                  <div className="text-xs text-muted-foreground">
                                    Rate after approval
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
              </TabsContent>

              <TabsContent value="verification" className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Worker Verification</h2>
                      <p className="text-muted-foreground">
                        Review and verify worker documents for onboarding
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {workers.filter(w => w.worker_status === 'verification_pending').length} Pending
                      </Badge>
                      <Badge variant="outline" className="bg-success/20 text-success border-success">
                        {workers.filter(w => w.worker_status === 'interview_pending').length} Ready for Interview
                      </Badge>
                    </div>
                  </div>

                  {workersLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-2">Loading workers...</span>
                    </div>
                  ) : workers.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Workers to Verify</h3>
                        <p className="text-muted-foreground">
                          No workers have uploaded documents for verification yet.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-6">
                  {workers.map((worker) => (
                    <WorkerVerificationCard
                      key={worker.id}
                      worker={worker}
                      onDocumentStatusUpdate={handleDocumentStatusUpdate}
                      onManualStatusUpdate={handleManualStatusUpdate}
                    />
                  ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="interviews" className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Interview Scheduling</h2>
                      <p className="text-muted-foreground">
                        Schedule interviews with verified workers
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-warning/20 text-warning border-warning">
                        {workers.filter(w => w.worker_status === 'interview_pending').length} Ready
                      </Badge>
                      <Badge variant="outline" className="bg-success/20 text-success border-success">
                        {workers.filter(w => w.worker_status === 'interview_scheduled').length} Scheduled
                      </Badge>
                    </div>
                  </div>

                  {workersLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-2">Loading workers...</span>
                    </div>
                  ) : workers.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Workers Available</h3>
                        <p className="text-muted-foreground mb-4">
                          No workers have completed document verification yet.
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Use the "Worker Verification" tab to approve documents and make workers eligible for interviews.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-6">
                      {workers
                        .filter(worker => 
                          worker.worker_status === 'interview_pending' || 
                          worker.worker_status === 'interview_scheduled' ||
                          worker.worker_status === 'active_employee'
                        )
                        .map((worker) => (
                          <WorkerVerificationCard
                            key={worker.id}
                            worker={worker}
                            onDocumentStatusUpdate={handleDocumentStatusUpdate}
                            onManualStatusUpdate={handleManualStatusUpdate}
                          />
                        ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      
    </SidebarProvider>
  );
};

export default EmployerDashboard;