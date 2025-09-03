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
  Trash2
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DebugPanel } from "@/components/ui/debug-panel";

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
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  task_title?: string;
  worker_profile?: {
    full_name: string;
  };
}

const EmployerDashboard = () => {
  const { profile, user } = useAuth();
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

      // Load recent submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('task_submissions')
        .select('*')
        .eq('employer_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(5);

      if (submissionsError) {
        console.error('Submissions query error:', submissionsError);
        throw submissionsError;
      }

      console.log('Submissions loaded:', submissionsData);

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

        const workerProfileMap = new Map();
        workerProfiles?.forEach(profile => {
          workerProfileMap.set(profile.user_id, profile);
        });

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-success/10 text-success";
      case "pending": return "bg-warning/10 text-warning";
      case "approved": return "bg-success/10 text-success";
      case "rejected": return "bg-destructive/10 text-destructive";
      case "paused": return "bg-muted text-muted-foreground";
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

              {/* Recent Submissions & Quick Actions */}
              <div className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Recent Submissions</CardTitle>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/employer/submissions">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {recentSubmissions.filter(s => s.status === 'pending').length} Pending
                      </Link>
                    </Button>
                  </CardHeader>
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