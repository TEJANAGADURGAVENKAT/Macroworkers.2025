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
<<<<<<< HEAD
  Trash2,
  Star,
  MessageSquare
=======
  Trash2
>>>>>>> 8923d1417afa2f21dcb51ed1cb6520730dfd74f7
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DebugPanel } from "@/components/ui/debug-panel";
<<<<<<< HEAD
import StarRating from "@/components/ui/star-rating-simple";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { updateEmployeeRating, getDesignationColor, getDesignationLabel } from "@/lib/employee-ratings-api";
=======
>>>>>>> 8923d1417afa2f21dcb51ed1cb6520730dfd74f7

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
}

interface Submission {
  id: string;
  task_id: string;
  worker_id: string;
<<<<<<< HEAD
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
=======
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  task_title?: string;
  worker_profile?: {
    full_name: string;
>>>>>>> 8923d1417afa2f21dcb51ed1cb6520730dfd74f7
  };
}

const EmployerDashboard = () => {
  const { profile, user } = useAuth();
<<<<<<< HEAD
  const { toast } = useToast();
=======
>>>>>>> 8923d1417afa2f21dcb51ed1cb6520730dfd74f7
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
<<<<<<< HEAD
  const [submissionRatings, setSubmissionRatings] = useState<Record<string, number>>({});
  const [submissionFeedback, setSubmissionFeedback] = useState<Record<string, string>>({});
  const [submittingRating, setSubmittingRating] = useState<string | null>(null);
=======
>>>>>>> 8923d1417afa2f21dcb51ed1cb6520730dfd74f7

  const displayName = (profile?.full_name || user?.email || "").split("@")[0] || "User";
  
  const sidebarItems = [
    { title: "Dashboard", url: "/employer", icon: Activity },
    { title: "My Campaigns", url: "/employer/campaigns", icon: Briefcase },
    { title: "Create Task", url: "/employer/create-task", icon: Plus },
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
      
      // Load tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (tasksError) {
        console.error('Tasks query error:', tasksError);
        throw tasksError;
      }

      console.log('Tasks loaded:', tasksData);

<<<<<<< HEAD
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
=======
      // Load recent submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('task_submissions')
        .select('*')
        .eq('employer_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(5);
>>>>>>> 8923d1417afa2f21dcb51ed1cb6520730dfd74f7

      if (submissionsError) {
        console.error('Submissions query error:', submissionsError);
        throw submissionsError;
      }

      console.log('Submissions loaded:', submissionsData);

<<<<<<< HEAD
      // Get worker profiles for submissions
      if (submissionsData && submissionsData.length > 0) {
        const workerIds = [...new Set(submissionsData.map(s => s.worker_id))];
        
        // Fetch worker profiles with rating information
        const { data: workerProfiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, rating, total_tasks_completed, designation')
          .in('user_id', workerIds);

=======
      // Get worker profiles and task titles for submissions
      if (submissionsData && submissionsData.length > 0) {
        const workerIds = [...new Set(submissionsData.map(s => s.worker_id))];
        const taskIds = [...new Set(submissionsData.map(s => s.task_id))];
        
        // Fetch worker profiles
        const { data: workerProfiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', workerIds);

        // Fetch task titles
        const { data: taskTitles } = await supabase
          .from('tasks')
          .select('id, title')
          .in('id', taskIds);

>>>>>>> 8923d1417afa2f21dcb51ed1cb6520730dfd74f7
        const workerProfileMap = new Map();
        workerProfiles?.forEach(profile => {
          workerProfileMap.set(profile.user_id, profile);
        });

<<<<<<< HEAD
        const submissionsWithData = submissionsData.map(submission => ({
          ...submission,
          status: submission.status as 'pending' | 'approved' | 'rejected' | 'assigned',
          task_title: submission.tasks?.title || 'Unknown Task',
          task_budget: submission.tasks?.budget || 0,
          employer_rating_given: submission.employer_rating_given || 0,
          rating_feedback: submission.rating_feedback || '',
          worker_profile: workerProfileMap.get(submission.worker_id) || {
            full_name: `Worker ${submission.worker_id.substring(0, 8)}`,
            rating: 0,
            total_tasks_completed: 0,
            designation: 'L1'
=======
        const taskTitleMap = new Map();
        taskTitles?.forEach(task => {
          taskTitleMap.set(task.id, task.title);
        });

        const submissionsWithData = submissionsData.map(submission => ({
          ...submission,
          status: submission.status as 'pending' | 'approved' | 'rejected',
          task_title: taskTitleMap.get(submission.task_id) || 'Unknown Task',
          worker_profile: workerProfileMap.get(submission.worker_id) || {
            full_name: `Worker ${submission.worker_id.substring(0, 8)}`
>>>>>>> 8923d1417afa2f21dcb51ed1cb6520730dfd74f7
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

      setTasks(tasksData || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
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

=======
>>>>>>> 8923d1417afa2f21dcb51ed1cb6520730dfd74f7
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-success/10 text-success";
      case "pending": return "bg-warning/10 text-warning";
      case "approved": return "bg-success/10 text-success";
      case "rejected": return "bg-destructive/10 text-destructive";
<<<<<<< HEAD
      case "assigned": return "bg-blue-100 text-blue-700";
=======
>>>>>>> 8923d1417afa2f21dcb51ed1cb6520730dfd74f7
      case "paused": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

<<<<<<< HEAD
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

=======
>>>>>>> 8923d1417afa2f21dcb51ed1cb6520730dfd74f7
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
                              </div>
                              <Badge className={getStatusColor(campaign.status)}>
                                {campaign.status}
                              </Badge>
                            </div>
                            
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

<<<<<<< HEAD
              {/* Submitted Tasks & Quick Actions */}
              <div className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Submitted Tasks</CardTitle>
=======
              {/* Recent Submissions & Quick Actions */}
              <div className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Recent Submissions</CardTitle>
>>>>>>> 8923d1417afa2f21dcb51ed1cb6520730dfd74f7
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/employer/submissions">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {recentSubmissions.filter(s => s.status === 'pending').length} Pending
                      </Link>
                    </Button>
                  </CardHeader>
<<<<<<< HEAD
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
=======
                  <CardContent className="space-y-3">
                    {recentSubmissions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No submissions yet.
                      </p>
                    ) : (
                      recentSubmissions.slice(0, 4).map((submission) => (
                        <div key={submission.id} className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{submission.task_title || 'Unknown Task'}</p>
                            <p className="text-xs text-muted-foreground">
                              Worker: {submission.worker_profile?.full_name || `Worker ${submission.worker_id.substring(0, 8)}`} • {formatTimeAgo(submission.submitted_at)}
                            </p>
                          </div>
                          <Badge 
                            variant="secondary" 
                            className={getStatusColor(submission.status)}
                          >
                            {submission.status}
                          </Badge>
>>>>>>> 8923d1417afa2f21dcb51ed1cb6520730dfd74f7
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full bg-gradient-primary" asChild>
                      <Link to="/employer/create-task">Create New Task</Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/employer/submissions">Review Submissions</Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/employer/payments">Manage Payments</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Employer Name</span>
                        <span className="font-semibold">{displayName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Tasks</span>
                        <span className="font-semibold">{tasks.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Active Tasks</span>
                        <span className="font-semibold">{stats.activeCampaigns}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Workers</span>
                        <span className="font-semibold">{stats.totalEmployeesWorkers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Budget</span>
                        <span className="font-semibold">{formatINR(stats.monthlySpent)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Debug Panel - Remove this after fixing */}
      <div className="p-6 bg-muted/30">
        <DebugPanel />
      </div>
    </SidebarProvider>
  );
};

export default EmployerDashboard;