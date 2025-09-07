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
  RefreshCw,
  Award,
  MessageSquare,
  Calendar
} from "lucide-react";
import { IndianRupee } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getEmployeeRatingSummary, getDesignationColor, getDesignationLabel } from "@/lib/employee-ratings-api";

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
  const [ratingData, setRatingData] = useState({
    averageRating: 0,
    designation: 'L1' as 'L1' | 'L2' | 'L3',
    totalRatings: 0,
    approvedRatingsCount: 0,
    rejectedRatingsCount: 0,
    pendingRatingsCount: 0,
    ratingHistory: [] as any[]
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

      // Load rating data
      await loadRatingData();

    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
          totalRatings: ratingSummary.approved_ratings_count,
          approvedRatingsCount: ratingSummary.approved_ratings_count,
          rejectedRatingsCount: ratingSummary.rejected_ratings_count,
          pendingRatingsCount: ratingSummary.pending_ratings_count,
          ratingHistory: ratingSummary.rating_history
        };
        
        console.log('Setting rating data:', newRatingData);
        setRatingData(newRatingData);
      } else {
        console.log('No rating summary found, using defaults');
        // Fallback to default values
        setRatingData({
          averageRating: 1.0,
          designation: 'L1',
          totalRatings: 0,
          approvedRatingsCount: 0,
          rejectedRatingsCount: 0,
          pendingRatingsCount: 0,
          ratingHistory: []
        });
      }

    } catch (error: any) {
      console.error('Error loading rating data:', error);
      // Set default values on error
      setRatingData({
        averageRating: 1.0,
        designation: 'L1',
        totalRatings: 0,
        approvedRatingsCount: 0,
        rejectedRatingsCount: 0,
        pendingRatingsCount: 0,
        ratingHistory: []
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
      case 'approved': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'rejected': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
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

  const renderStars = (rating: number | null, size: 'sm' | 'md' | 'lg' = 'md') => {
    if (rating === null || rating === undefined) {
      // Show empty stars for unrated items
      return Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={`${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} text-gray-300`}
        />
      ));
    }

    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} ${
          index < rating
            ? 'text-yellow-400 fill-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
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

                {/* Dashboard Tabs */}
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
                  </TabsContent>

                  <TabsContent value="ratings" className="space-y-6">
                    <div className="grid lg:grid-cols-3 gap-6">
                      {/* Rating Overview */}
                      <div className="lg:col-span-1">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5 }}
                        >
                          <Card className="h-full">
                            <CardHeader>
                              <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Award className="h-5 w-5" />
                                  <span>Rating Overview</span>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    console.log('Force refreshing rating data...');
                                    loadRatingData();
                                  }}
                                  className="h-8 w-8 p-0"
                                  title="Refresh rating data"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                              {/* Average Rating */}
                              <div className="text-center space-y-4">
                                <div className="flex justify-center space-x-1">
                                  {renderStars(Math.floor(ratingData.averageRating), 'lg')}
                                </div>
                              <div>
                                <p className="text-4xl font-bold text-primary">{ratingData.averageRating.toFixed(1)}</p>
                                <p className="text-sm text-muted-foreground">Average Rating</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Based on {ratingData.approvedRatingsCount} approved submission{ratingData.approvedRatingsCount !== 1 ? 's' : ''}
                                </p>
                                {ratingData.approvedRatingsCount === 0 && (
                                  <p className="text-xs text-amber-600 mt-1">
                                    No approved ratings yet - default rating shown
                                  </p>
                                )}
                              </div>
                              </div>

                              <Separator />

                              {/* Designation */}
                              <div className="text-center space-y-3">
                                <Badge 
                                  variant="secondary" 
                                  className={`text-sm px-4 py-2 ${getDesignationColor(ratingData.designation)}`}
                                >
                                  {ratingData.designation} - {getDesignationLabel(ratingData.designation)}
                                </Badge>
                                <p className="text-xs text-muted-foreground">Current Level</p>
                              </div>

                              <Separator />

                              {/* Detailed Stats */}
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="text-center p-3 bg-green-50 rounded-lg">
                                    <p className="text-lg font-bold text-green-600">{ratingData.approvedRatingsCount}</p>
                                    <p className="text-xs text-green-700">Approved</p>
                                  </div>
                                  <div className="text-center p-3 bg-red-50 rounded-lg">
                                    <p className="text-lg font-bold text-red-600">{ratingData.rejectedRatingsCount}</p>
                                    <p className="text-xs text-red-700">Rejected</p>
                                  </div>
                                </div>
                                
                                <div className="text-center p-3 bg-blue-50 rounded-lg">
                                  <p className="text-lg font-bold text-blue-600">{ratingData.pendingRatingsCount}</p>
                                  <p className="text-xs text-blue-700">Pending Review</p>
                                </div>

                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Total Tasks</span>
                                  <span className="font-semibold">{stats.tasksCompleted}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      </div>

                      {/* Rating History */}
                      <div className="lg:col-span-2">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                        >
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Star className="h-5 w-5" />
                                  <span>Rating History</span>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {ratingData.ratingHistory.length} total
                                </Badge>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              {ratingData.ratingHistory.length === 0 ? (
                                <div className="text-center py-12">
                                  <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                  <p className="text-lg text-muted-foreground mb-2">No ratings yet</p>
                                  <p className="text-sm text-muted-foreground">
                                    Complete tasks to start receiving ratings from employers
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {ratingData.ratingHistory.map((rating, index) => (
                                    <motion.div
                                      key={rating.id}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ duration: 0.3, delay: index * 0.1 }}
                                      className={`p-4 rounded-lg space-y-3 border-l-4 ${
                                        rating.status === 'approved' 
                                          ? 'bg-green-50 border-green-400' 
                                          : rating.status === 'rejected'
                                          ? 'bg-red-50 border-red-400'
                                          : 'bg-yellow-50 border-yellow-400'
                                      }`}
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <h4 className="font-medium text-slate-900">{rating.task_title || 'Unknown Task'}</h4>
                                          <p className="text-sm text-muted-foreground">
                                            {formatTimeAgo(rating.submitted_at)}
                                          </p>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                          <div className="flex space-x-1">
                                            {renderStars(rating.employer_rating_given, 'sm')}
                                          </div>
                                          <div className="text-right">
                                            <span className="text-sm font-medium">
                                              {rating.employer_rating_given ? `${rating.employer_rating_given}/5` : 'Not Rated'}
                                            </span>
                                            <div className="flex items-center space-x-1 mt-1">
                                              <Badge 
                                                variant="outline" 
                                                className={`text-xs ${
                                                  rating.status === 'approved' 
                                                    ? 'text-green-700 border-green-300 bg-green-100' 
                                                    : rating.status === 'rejected'
                                                    ? 'text-red-700 border-red-300 bg-red-100'
                                                    : 'text-yellow-700 border-yellow-300 bg-yellow-100'
                                                }`}
                                              >
                                                {rating.status}
                                              </Badge>
                                              {rating.is_counted_in_average && (
                                                <Badge variant="secondary" className="text-xs">
                                                  Counted
                                                </Badge>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {rating.rating_feedback && (
                                        <motion.div
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: 'auto' }}
                                          transition={{ duration: 0.3 }}
                                          className="bg-white/70 p-3 rounded border-l-4 border-blue-500"
                                        >
                                          <div className="flex items-start space-x-2">
                                            <MessageSquare className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                              <p className="text-xs font-medium text-blue-700 mb-1">Employer Feedback</p>
                                              <p className="text-sm text-slate-700">{rating.rating_feedback}</p>
                                            </div>
                                          </div>
                                        </motion.div>
                                      )}
                                      
                                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <div className="flex items-center space-x-4">
                                          <span>Budget: {formatINR(rating.task_budget || 0)}</span>
                                          {rating.employer_rating_given && (
                                            <span className="flex items-center space-x-1">
                                              <Star className="h-3 w-3" />
                                              <span>Rated</span>
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center space-x-1">
                                          <Calendar className="h-3 w-3" />
                                          <span>{new Date(rating.submitted_at).toLocaleDateString()}</span>
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default WorkerDashboard;