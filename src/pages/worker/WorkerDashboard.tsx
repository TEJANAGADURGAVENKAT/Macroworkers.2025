import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  FileText,
  CreditCard,
  User,
  Star,
  Calendar,
  MessageSquare,
  UserCheck
} from "lucide-react";
import { IndianRupee } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getEmployeeRatingSummary, getDesignationColor, getDesignationLabel } from "@/lib/employee-ratings-api";
import OnboardingStatus from "@/components/worker/OnboardingStatus";
import { MyInterviewCard } from "@/components/worker/MyInterviewCard";

const WorkerDashboard = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [showRedirectToast, setShowRedirectToast] = useState(false);
  const [lastKnownStatus, setLastKnownStatus] = useState<string | null>(null);
  const [stats, setStats] = useState({
    currentBalance: 0,
    tasksCompleted: 0,
    inProgress: 0,
    successRate: 0
  });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [ratingData, setRatingData] = useState({
    averageRating: 0,
    designation: 'L1',
    totalRatings: 0,
    recentRatings: [] as any[]
  });
  const [weeklyStats, setWeeklyStats] = useState({
    tasksCompleted: 0,
    earnings: 0,
    averagePerTask: 0
  });

  const sidebarItems = [
    { title: "Dashboard", url: "/worker", icon: Activity },
    { title: "Find Jobs", url: "/worker/jobs", icon: Briefcase },
    { title: "My Tasks", url: "/worker/tasks", icon: FileText },
    { title: "Earnings", url: "/worker/earnings", icon: DollarSign },
    { title: "Profile", url: "/worker/profile", icon: User },
  ];

  // Realtime subscription for profile status changes
  useEffect(() => {
    if (!user) return;

    console.log('Setting up realtime subscription for user:', user.id);

    const channel = supabase
      .channel('worker_profile_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Profile status change received:', payload);
          console.log('Old data:', payload.old);
          console.log('New data:', payload.new);
          
          const newStatus = payload.new.worker_status;
          const oldStatus = payload.old.worker_status;
          
          console.log('Status changed from', oldStatus, 'to', newStatus);
          
          // Check if worker was just approved for interview
          if (newStatus === 'interview_pending' && oldStatus === 'verification_pending') {
            console.log('Worker approved! Showing redirect toast...');
            setShowRedirectToast(true);
            
            // Auto-hide toast after 5 seconds
            setTimeout(() => {
              setShowRedirectToast(false);
            }, 5000);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Check for status changes on component mount
  useEffect(() => {
    if (!profile || !user) return;

    console.log('Current profile status:', profile.worker_status);
    
    // If this is the first time we're seeing interview_pending status, show toast
    if (profile.worker_status === 'interview_pending' && lastKnownStatus !== 'interview_pending') {
      console.log('First time seeing interview_pending status, showing toast');
      setShowRedirectToast(true);
      
      // Auto-hide toast after 5 seconds
      setTimeout(() => {
        setShowRedirectToast(false);
      }, 5000);
    }
    
    setLastKnownStatus(profile.worker_status);
  }, [profile?.worker_status, user, lastKnownStatus]);

  const handleRedirectToInterview = () => {
    setShowRedirectToast(false);
    
    // Show a brief loading state
    toast({
      title: "Redirecting to Interview Schedule",
      description: "Please wait while we redirect you...",
    });

    // Redirect after 2 seconds with smooth animation
    setTimeout(() => {
      navigate('/interview-schedule');
    }, 2000);
  };

  const loadRatingData = async () => {
    if (!user) return;

    try {
      console.log('Loading rating data for user:', user.id);
      
      // Use the new employee ratings API
      const ratingSummary = await getEmployeeRatingSummary(user.id);
      
      console.log('Rating summary received:', ratingSummary);
      
      if (ratingSummary) {
        const newRatingData = {
          averageRating: ratingSummary.average_rating,
          designation: ratingSummary.designation,
          totalRatings: ratingSummary.total_ratings,
          recentRatings: ratingSummary.recent_ratings || []
        };
        
        console.log('Setting rating data:', newRatingData);
        setRatingData(newRatingData);
      }
    } catch (error) {
      console.error('Error loading rating data:', error);
    }
  };

  const loadRecentTasks = async () => {
    if (!user) return;

    try {
      const { data: tasks, error } = await supabase
        .from('task_submissions')
        .select(`
          id,
          submitted_at,
          status,
          task:tasks(id, title, budget)
        `)
        .eq('worker_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentTasks(tasks || []);
    } catch (error) {
      console.error('Error loading recent tasks:', error);
    }
  };

  const loadWeeklyStats = async () => {
    if (!user) return;

    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data: tasks, error } = await supabase
        .from('task_submissions')
        .select(`
          id,
          submitted_at,
          status,
          task:tasks(id, title, budget)
        `)
        .eq('worker_id', user.id)
        .eq('status', 'approved')
        .gte('submitted_at', oneWeekAgo.toISOString());

      if (error) throw error;

      const completedTasks = tasks || [];
      const totalEarnings = completedTasks.reduce((sum, task) => sum + (task.task?.budget || 0), 0);
      const averagePerTask = completedTasks.length > 0 ? totalEarnings / completedTasks.length : 0;

      setWeeklyStats({
        tasksCompleted: completedTasks.length,
        earnings: totalEarnings,
        averagePerTask
      });
    } catch (error) {
      console.error('Error loading weekly stats:', error);
    }
  };

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      await Promise.all([
        loadRatingData(),
        loadRecentTasks(),
        loadWeeklyStats()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const statsCards = [
    {
      label: "Current Balance",
      value: formatINR(stats.currentBalance),
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      label: "Tasks Completed",
      value: stats.tasksCompleted.toString(),
      icon: CheckCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      label: "In Progress",
      value: stats.inProgress.toString(),
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100"
    },
    {
      label: "Success Rate",
      value: `${stats.successRate}%`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    }
  ];

  return (
    <SidebarProvider>
      {/* Redirect Toast Overlay */}
      <AnimatePresence>
        {showRedirectToast && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-lg p-8 max-w-md mx-4 text-center"
            >
              <div className="mb-4">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Documents Approved! 🎉
                </h3>
                <p className="text-gray-600 mb-6">
                  Your documents have been approved. You can now schedule your interview!
                </p>
                <Button onClick={handleRedirectToInterview} className="w-full">
                  Go to Interview Schedule
                </Button>
              </div>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm text-gray-500">Please wait...</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">
                  Welcome back, {profile?.full_name || user?.email || "Worker"}!
                </h1>
                <p className="text-muted-foreground">
                  Here's what's happening with your work today.
                </p>
              </div>
              <Badge variant="outline" className="text-sm">
                {getDesignationLabel(ratingData.designation)}
              </Badge>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Loading dashboard...</span>
              </div>
            ) : (
              <>
                {/* Show onboarding status for non-active workers */}
                {profile?.worker_status !== 'active_employee' && (
                  <div className="mb-8">
                    <OnboardingStatus />
                  </div>
                )}

                {/* Show interview card for workers with scheduled interviews */}
                {(profile?.worker_status === 'interview_pending' || 
                  profile?.worker_status === 'interview_scheduled' || 
                  profile?.worker_status === 'active_employee') && (
                  <div className="mb-8">
                    <MyInterviewCard />
                  </div>
                )}

                {/* Stats Grid - only show for active employees */}
                {profile?.worker_status === 'active_employee' && (
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
                              <p className="text-sm font-medium text-muted-foreground">
                                {stat.label}
                              </p>
                              <p className="text-2xl font-bold">{stat.value}</p>
                            </div>
                            <div className={`p-3 rounded-full ${stat.bgColor}`}>
                              <stat.icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                  </div>
                )}

                {/* Dashboard Tabs - only show for active employees */}
                {profile?.worker_status === 'active_employee' && (
                  <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="ratings">My Ratings</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-6">
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
                                  <Badge variant={task.status === 'approved' ? 'default' : 'secondary'}>
                                    {task.status}
                                  </Badge>
                                </div>
                              ))
                            )}
                          </CardContent>
                        </Card>
                      </div>

                      {/* Weekly Stats */}
                      <div>
                        <Card>
                          <CardHeader>
                            <CardTitle>This Week</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Tasks Completed</span>
                              <span className="font-semibold">{weeklyStats.tasksCompleted}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Earnings</span>
                              <span className="font-semibold text-success">{formatINR(weeklyStats.earnings)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Avg per Task</span>
                              <span className="font-semibold text-success">{formatINR(weeklyStats.averagePerTask)}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="ratings" className="space-y-6">
                    <div className="grid lg:grid-cols-2 gap-6">
                      {/* Rating Summary */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Rating Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Average Rating</span>
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-semibold">{ratingData.averageRating.toFixed(1)}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Total Ratings</span>
                            <span className="font-semibold">{ratingData.totalRatings}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Designation</span>
                            <Badge variant="outline" className={getDesignationColor(ratingData.designation)}>
                              {getDesignationLabel(ratingData.designation)}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Recent Ratings */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Recent Ratings</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {ratingData.recentRatings.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">No ratings yet.</p>
                          ) : (
                            <div className="space-y-3">
                              {ratingData.recentRatings.map((rating, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                  <div className="flex items-center space-x-2">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span className="font-medium">{rating.rating}</span>
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    {formatTimeAgo(rating.created_at)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  </Tabs>
                )}

                {/* Additional dashboard content - only show for active employees */}
                {profile?.worker_status === 'active_employee' && (
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
                              <Badge variant={task.status === 'approved' ? 'default' : 'secondary'}>
                                {task.status}
                              </Badge>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Weekly Stats */}
                  <div>
                    <Card>
                      <CardHeader>
                        <CardTitle>This Week</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Tasks Completed</span>
                          <span className="font-semibold">{weeklyStats.tasksCompleted}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Earnings</span>
                          <span className="font-semibold text-success">{formatINR(weeklyStats.earnings)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Avg per Task</span>
                          <span className="font-semibold text-success">{formatINR(weeklyStats.averagePerTask)}</span>
                        </div>
                      </CardContent>
                    </Card>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default WorkerDashboard;