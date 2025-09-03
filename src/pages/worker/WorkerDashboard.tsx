import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  Search, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  Star,
  Briefcase,
  User,
  Wallet,
  Activity,
  RefreshCw
} from "lucide-react";
import { IndianRupee } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const WorkerDashboard = () => {
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    currentBalance: 0,
    tasksCompleted: 0,
    inProgress: 0,
    successRate: 0
  });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [weeklyStats, setWeeklyStats] = useState({
    earnings: 0,
    tasks: 0,
    averagePerTask: 0
  });

  const displayName = (profile?.full_name || user?.email || "").split("@")[0] || "User";
  const sidebarItems = [
    { title: "Dashboard", url: "/worker", icon: Activity },
    { title: "Available Jobs", url: "/worker/jobs", icon: Search },
    { title: "My Tasks", url: "/worker/tasks", icon: Briefcase },
    { title: "Earnings", url: "/worker/earnings", icon: Wallet },
    { title: "Profile", url: "/worker/profile", icon: User },
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
      console.log('Loading worker dashboard data for user:', user.id);
      
      // Load worker's submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('task_submissions')
        .select(`
          *,
          task:tasks(
            id,
            title,
            budget,
            created_by
          )
        `)
        .eq('worker_id', user.id)
        .order('submitted_at', { ascending: false });

      if (submissionsError) {
        console.error('Error loading submissions:', submissionsError);
        throw submissionsError;
      }

      console.log('Submissions loaded:', submissionsData);

      // Calculate stats
      const totalSubmissions = submissionsData?.length || 0;
      const completedTasks = submissionsData?.filter(s => s.status === 'approved').length || 0;
      const pendingTasks = submissionsData?.filter(s => s.status === 'pending').length || 0;
      const totalEarnings = submissionsData
        ?.filter(s => s.status === 'approved')
        .reduce((sum, s) => sum + (s.task?.budget || 0), 0) || 0;
      
      const successRate = totalSubmissions > 0 ? Math.round((completedTasks / totalSubmissions) * 100) : 0;

      setStats({
        currentBalance: totalEarnings,
        tasksCompleted: completedTasks,
        inProgress: pendingTasks,
        successRate
      });

      // Get recent tasks (last 5 submissions)
      const recentSubmissions = submissionsData?.slice(0, 5) || [];
      setRecentTasks(recentSubmissions);

      // Calculate weekly stats (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const weeklySubmissions = submissionsData?.filter(s => 
        new Date(s.submitted_at) >= oneWeekAgo
      ) || [];

      const weeklyEarnings = weeklySubmissions
        .filter(s => s.status === 'approved')
        .reduce((sum, s) => sum + (s.task?.budget || 0), 0);
      
      const weeklyTasks = weeklySubmissions.length;
      const weeklyAverage = weeklyTasks > 0 ? weeklyEarnings / weeklyTasks : 0;

      setWeeklyStats({
        earnings: weeklyEarnings,
        tasks: weeklyTasks,
        averagePerTask: weeklyAverage
      });

    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'rejected': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const statsCards = [
    { label: "Current Balance", value: formatINR(stats.currentBalance), icon: IndianRupee, color: "text-success" },
    { label: "Tasks Completed", value: stats.tasksCompleted.toString(), icon: CheckCircle, color: "text-primary" },
    { label: "In Progress", value: stats.inProgress.toString(), icon: Clock, color: "text-warning" },
    { label: "Success Rate", value: `${stats.successRate}%`, icon: TrendingUp, color: "text-success" }
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar className="w-64">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-lg font-semibold mb-4">
                Worker Portal
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
                <h1 className="text-3xl font-bold">Welcome back, {displayName}! 👋</h1>
                <p className="text-muted-foreground">Here's your worker dashboard overview</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={loadDashboardData}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Loading...' : 'Refresh'}
                </Button>
                <Badge className="bg-success/10 text-success">
                  <Star className="w-3 h-3 mr-1" />
                  {stats.successRate > 0 ? `${stats.successRate}% Success` : 'New Worker'}
                </Badge>
                <SidebarTrigger />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Loading dashboard...</span>
              </div>
            ) : (
              <>
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
                  {/* Recent Tasks */}
                  <div className="lg:col-span-2">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Recent Tasks</CardTitle>
                        <Button variant="outline" size="sm" asChild>
                          <Link to="/worker/tasks">View All</Link>
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {recentTasks.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground">No tasks completed yet.</p>
                            <Button className="mt-2" asChild>
                              <Link to="/worker/jobs">Find Your First Task</Link>
                            </Button>
                          </div>
                        ) : (
                          recentTasks.map((task) => (
                            <div key={task.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                              <div className="flex-1">
                                <h4 className="font-medium">{task.task?.title || 'Unknown Task'}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Submitted: {formatTimeAgo(task.submitted_at)}
                                </p>
                              </div>
                              <div className="text-right space-y-1">
                                <p className="font-semibold">{formatINR(task.task?.budget || 0)}</p>
                                <Badge 
                                  variant="secondary"
                                  className={getStatusColor(task.status)}
                                >
                                  {task.status}
                                </Badge>
                              </div>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button className="w-full bg-gradient-primary" asChild>
                          <Link to="/worker/jobs">Find New Tasks</Link>
                        </Button>
                        <Button variant="outline" className="w-full" asChild>
                          <Link to="/worker/earnings">Withdraw Earnings</Link>
                        </Button>
                        <Button variant="outline" className="w-full" asChild>
                          <Link to="/worker/profile">Update Profile</Link>
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Earnings Summary */}
                    <Card>
                      <CardHeader>
                        <CardTitle>This Week</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Earnings</span>
                            <span className="font-semibold">{formatINR(weeklyStats.earnings)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tasks</span>
                            <span className="font-semibold">{weeklyStats.tasks}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between">
                            <span className="font-medium">Average per task</span>
                            <span className="font-semibold text-success">{formatINR(weeklyStats.averagePerTask)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default WorkerDashboard;