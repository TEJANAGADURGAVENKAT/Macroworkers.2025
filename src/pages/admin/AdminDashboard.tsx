import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Briefcase, 
  FileText, 
  TrendingUp, 
  UserCheck, 
  UserX,
  Calendar,
  IndianRupee,
  Eye,
  CheckCircle,
  X,
  AlertCircle,
  User,
  Building,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Shield,
  CreditCard
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatINR } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { SubmissionProofModal } from "@/components/ui/submission-proof-modal";

interface Task {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: string;
  created_at: string;
  created_by: string;
  target_countries: string[];
  employer_profile?: {
    full_name: string;
    email: string;
  };
  submission_count?: number;
  submissions?: Submission[];
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
  task: {
    id: string;
    title: string;
    budget: number;
    created_by: string;
  };
  worker_profile?: {
    full_name: string;
    email: string;
  };
  employer_profile?: {
    full_name: string;
    email: string;
  };
}

interface User {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
  email: string;
  task_count?: number;
  completed_task_count?: number;
  tasks?: Task[];
}

interface DashboardStats {
  totalUsers: number;
  totalEmployers: number;
  totalWorkers: number;
  totalAdmins: number;
  totalTasks: number;
  totalSubmissions: number;
  totalBudget: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [employers, setEmployers] = useState<User[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalEmployers: 0,
    totalWorkers: 0,
    totalTasks: 0,
    totalSubmissions: 0,
    totalBudget: 0,
    pendingSubmissions: 0,
    approvedSubmissions: 0,
    rejectedSubmissions: 0
  });
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      console.log('Starting to load dashboard data...');
      console.log('Current user:', user);
      
      if (!user) {
        console.error('No user authenticated');
        toast({
          title: "Error",
          description: "You must be logged in to access the admin dashboard.",
          variant: "destructive"
        });
        return;
      }

      // Test basic Supabase connection first
      const testResponse = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });
      
      console.log('Test response to verify Supabase connection:', testResponse);
      
      // Fetch total number of workers using exact count
      const workersResponse = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'worker');

      const workersCount = workersResponse.count || 0;
      const workersError = workersResponse.error;

      if (workersError) {
        console.error('Workers count error:', workersError);
        console.log('Setting workers count to 0 due to error');
      }

      // Fetch total number of employers using exact count
      const employersResponse = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'employer');

      const employersCount = employersResponse.count || 0;
      const employersError = employersResponse.error;

      if (employersError) {
        console.error('Employers count error:', employersError);
        console.log('Setting employers count to 0 due to error');
      }

      // Fetch total number of admins using exact count
      const adminsResponse = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin');

      const adminsCount = adminsResponse.count || 0;
      const adminsError = adminsResponse.error;

      if (adminsError) {
        console.error('Admins count error:', adminsError);
        console.log('Setting admins count to 0 due to error');
      }

      console.log('=== QUERY RESULTS ===');
      console.log('Workers query result:', { count: workersCount, error: workersError });
      console.log('Employers query result:', { count: employersCount, error: employersError });
      console.log('Admins query result:', { count: adminsCount, error: adminsError });

      console.log('Database counts - Workers:', workersCount, 'Employers:', employersCount, 'Admins:', adminsCount);
      console.log('Workers response:', workersResponse);
      console.log('Employers response:', employersResponse);
      console.log('Admins response:', adminsResponse);
      
      // Additional debugging for workers and employers
      console.log('Workers response details:', {
        data: workersResponse.data,
        count: workersResponse.count,
        error: workersResponse.error,
        status: workersResponse.status,
        statusText: workersResponse.statusText
      });
      
      console.log('Employers response details:', {
        data: employersResponse.data,
        count: employersResponse.count,
        error: employersResponse.error,
        status: employersResponse.status,
        statusText: employersResponse.statusText
      });

      // Get all profiles for detailed view
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Profiles error:', profilesError);
        console.log('Setting profiles data to empty array due to error');
      } else {
        console.log('All profiles loaded:', allProfiles?.length || 0);
        console.log('Profile roles breakdown:', allProfiles?.reduce((acc, profile) => {
          acc[profile.role] = (acc[profile.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>));
        console.log('Sample profiles:', allProfiles?.slice(0, 3).map(p => ({
          id: p.id,
          user_id: p.user_id,
          full_name: p.full_name,
          role: p.role,
          email: p.email
        })));
      }

      // Fetch total number of task submissions using exact count
      const submissionsResponse = await supabase
        .from('task_submissions')
        .select('id', { count: 'exact', head: true });

      const submissionsCount = submissionsResponse.count || 0;
      const submissionsError = submissionsResponse.error;

      if (submissionsError) {
        console.error('Submissions count error:', submissionsError);
        console.log('Setting submissions count to 0 due to error');
      }

      console.log('Database counts - Workers:', workersCount, 'Employers:', employersCount, 'Submissions:', submissionsCount);
      console.log('Submissions response:', submissionsResponse);

      // Fetch total number of tasks using exact count
      const tasksResponse = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true });

      const tasksCount = tasksResponse.count || 0;
      const tasksCountError = tasksResponse.error;

      if (tasksCountError) {
        console.error('Tasks count error:', tasksCountError);
        console.log('Setting tasks count to 0 due to error');
      }

      console.log('Tasks response:', tasksResponse);

      // Load all tasks with employer profile details
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          employer_profile:profiles!tasks_created_by_fkey(
            id,
            user_id,
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (tasksError) {
        console.error('Tasks error:', tasksError);
        console.log('Setting tasks data to empty array due to error');
      } else {
        console.log('Tasks with employer profiles loaded:', tasksData?.map(task => ({
          id: task.id,
          title: task.title,
          created_by: task.created_by,
          employer_profile: task.employer_profile,
          has_employer_profile: !!task.employer_profile
        })));
        console.log('Sample task employer profile:', tasksData?.[0]?.employer_profile);
      }

      // Load all submissions with task details
      const { data: submissionsDetailedData, error: submissionsDetailedError } = await supabase
        .from('task_submissions')
        .select(`
          *,
          task:tasks!task_submissions_task_id_fkey(
            id,
            title,
            budget,
            created_by
          )
        `)
        .order('submitted_at', { ascending: false });

      if (submissionsDetailedError) {
        console.error('Submissions detailed error:', submissionsDetailedError);
        // Don't throw error, just set data to empty array
        console.log('Setting submissions detailed data to empty array due to error');
      }

      // Use the already loaded profiles data
      const usersData = allProfiles || [];
      
      // Separate employers, workers, and admins for detailed view
      const employersList = usersData.filter(u => u.role === 'employer') || [];
      const workersList = usersData.filter(u => u.role === 'worker') || [];
      const adminsList = usersData.filter(u => u.role === 'admin') || [];
      
      console.log('Profile details:', usersData.map(p => ({ id: p.id, user_id: p.user_id, role: p.role, full_name: p.full_name })));
      console.log('Employers found:', employersList.length);
      console.log('Workers found:', workersList.length);
      console.log('Admins found:', adminsList.length);
      
      console.log('Statistics fetched:', {
        totalWorkers: workersCount || 0,
        totalEmployers: employersCount || 0,
        totalAdmins: adminsCount || 0,
        totalSubmissions: submissionsCount || 0,
        totalUsers: usersData?.length || 0,
        employersFound: employersList.length,
        workersFound: workersList.length,
        adminsFound: adminsList.length
      });

      // Calculate task counts and add tasks for each user
      const usersWithTaskCounts = usersData.map(user => {
        const userTasks = (tasksData || []).filter(t => t.created_by === user.id) || [];
        const completedTaskCount = (submissionsDetailedData || []).filter(s => 
          s.worker_id === user.id && s.status === 'approved'
        ).length || 0;

        return {
          ...user,
          task_count: userTasks.length,
          completed_task_count: completedTaskCount,
          tasks: userTasks
        };
      }) || [];

      // Add submission counts to tasks and group submissions by task
      const tasksWithSubmissions = (tasksData || []).map(task => {
        const taskSubmissions = (submissionsDetailedData || []).filter(s => s.task_id === task.id) || [];
        
        // Fallback: If employer_profile is not loaded via join, try to find it manually
        let employerProfile = task.employer_profile;
        if (!employerProfile && task.created_by) {
          employerProfile = usersData.find(user => user.user_id === task.created_by);
        }
        
        return {
          ...task,
          employer_profile: employerProfile,
          submission_count: taskSubmissions.length,
          submissions: taskSubmissions
        };
      }) || [];

      // Calculate additional stats
      const totalBudget = (submissionsDetailedData || []).reduce((sum, sub) => sum + (sub.task?.budget || 0), 0) || 0;
      const pendingSubmissions = (submissionsDetailedData || []).filter(s => s.status === 'pending').length || 0;
      const approvedSubmissions = (submissionsDetailedData || []).filter(s => s.status === 'approved').length || 0;
      const rejectedSubmissions = (submissionsDetailedData || []).filter(s => s.status === 'rejected').length || 0;

      setTasks(tasksWithSubmissions || []);
      
      // Debug: Log the final tasks with employer profiles
      console.log('Final tasks with employer profiles:', tasksWithSubmissions.map(task => ({
        id: task.id,
        title: task.title,
        created_by: task.created_by,
        employer_profile: task.employer_profile,
        has_employer_profile: !!task.employer_profile
      })));
      setSubmissions(submissionsDetailedData || []);
      setUsers(usersWithTaskCounts || []);
      setEmployers(employersList || []);
      setWorkers(workersList || []);
      // Ensure we're using the count values from Supabase responses
      let finalWorkersCount = workersCount || 0;
      let finalEmployersCount = employersCount || 0;
      const finalSubmissionsCount = submissionsCount || 0;
      const finalTasksCount = tasksCount || 0;

      console.log('Final counts for dashboard:', {
        workers: finalWorkersCount,
        employers: finalEmployersCount,
        submissions: finalSubmissionsCount,
        tasks: finalTasksCount
      });

      // Test: If counts are still 0, try a different approach
      if (finalWorkersCount === 0 || finalEmployersCount === 0) {
        console.log('Counts are 0, trying alternative approach...');
        
        // Try to get counts from the detailed profiles data
        const workersFromData = (allProfiles || []).filter(p => p.role === 'worker').length;
        const employersFromData = (allProfiles || []).filter(p => p.role === 'employer').length;
        const adminsFromData = (allProfiles || []).filter(p => p.role === 'admin').length;
        
        console.log('Alternative counts from data:', {
          workers: workersFromData,
          employers: employersFromData,
          admins: adminsFromData
        });
        
        // Check for case sensitivity issues
        const workersFromDataCaseInsensitive = (allProfiles || []).filter(p => 
          p.role && p.role.toLowerCase() === 'worker'
        ).length;
        const employersFromDataCaseInsensitive = (allProfiles || []).filter(p => 
          p.role && p.role.toLowerCase() === 'employer'
        ).length;
        
        console.log('Case insensitive counts:', {
          workers: workersFromDataCaseInsensitive,
          employers: employersFromDataCaseInsensitive
        });
        
        // Use alternative counts if database counts are 0
        if (finalWorkersCount === 0 && workersFromData > 0) {
          finalWorkersCount = workersFromData;
          console.log('Using workers count from data:', workersFromData);
        }
        if (finalEmployersCount === 0 && employersFromData > 0) {
          finalEmployersCount = employersFromData;
          console.log('Using employers count from data:', employersFromData);
        }
        
        // If still 0, try case insensitive
        if (finalWorkersCount === 0 && workersFromDataCaseInsensitive > 0) {
          finalWorkersCount = workersFromDataCaseInsensitive;
          console.log('Using case insensitive workers count:', workersFromDataCaseInsensitive);
        }
        if (finalEmployersCount === 0 && employersFromDataCaseInsensitive > 0) {
          finalEmployersCount = employersFromDataCaseInsensitive;
          console.log('Using case insensitive employers count:', employersFromDataCaseInsensitive);
        }
        
        // Final fallback: if allProfiles has data but counts are still 0, use the data
        if (finalWorkersCount === 0 && finalEmployersCount === 0 && allProfiles && allProfiles.length > 0) {
          console.log('All counts are 0 but profiles exist, using manual counting...');
          console.log('All profiles:', allProfiles.map(p => ({ id: p.id, role: p.role, full_name: p.full_name })));
          
          // Manual counting from allProfiles
          const manualWorkers = allProfiles.filter(p => p.role === 'worker').length;
          const manualEmployers = allProfiles.filter(p => p.role === 'employer').length;
          
          finalWorkersCount = manualWorkers;
          finalEmployersCount = manualEmployers;
          
          console.log('Manual counts applied:', { workers: manualWorkers, employers: manualEmployers });
        }
      }

      const newStats = {
        totalUsers: usersData.length || 0,
        totalEmployers: finalEmployersCount,
        totalWorkers: finalWorkersCount,
        totalAdmins: adminsCount || 0,
        totalTasks: finalTasksCount,
        totalSubmissions: finalSubmissionsCount,
        totalBudget,
        pendingSubmissions,
        approvedSubmissions,
        rejectedSubmissions
      };

      console.log('Setting stats with:', newStats);
      setStats(newStats);

      console.log('Dashboard data loaded successfully:', {
        tasks: finalTasksCount,
        submissions: finalSubmissionsCount,
        users: usersData.length,
        employers: finalEmployersCount,
        workers: finalWorkersCount,
        totalSubmissions: finalSubmissionsCount
      });

      // Show immediate alert with results
      // Debug logging only (no popup)
      console.log('Dashboard data loaded successfully:', {
        workers: finalWorkersCount,
        employers: finalEmployersCount,
        admins: adminsCount || 0,
        tasks: finalTasksCount,
        submissions: finalSubmissionsCount,
        totalProfiles: usersData.length
      });

    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setIsProofModalOpen(true);
  };

  const toggleTaskExpansion = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/10 text-warning';
      case 'approved': return 'bg-success/10 text-success';
      case 'rejected': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-muted-foreground';
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Monitor all platform activities and user statistics</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadDashboardData}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={async () => {
                console.log('=== MANUAL DEBUG ===');
                console.log('Current state:', {
                  users,
                  employers,
                  workers,
                  tasks,
                  submissions,
                  stats
                });
                
                // Test direct database queries
                console.log('=== TESTING DIRECT QUERIES ===');
                
                const { data: testProfiles, error: testError } = await supabase
                  .from('profiles')
                  .select('*');
                
                console.log('Direct profiles query:', { data: testProfiles, error: testError });
                
                if (testProfiles) {
                  console.log('Profile roles found:', testProfiles.map(p => ({ id: p.id, role: p.role, full_name: p.full_name })));
                  console.log('Workers count from direct query:', testProfiles.filter(p => p.role === 'worker').length);
                  console.log('Employers count from direct query:', testProfiles.filter(p => p.role === 'employer').length);
                  console.log('Admins count from direct query:', testProfiles.filter(p => p.role === 'admin').length);
                  
                  // Test count queries
                  const { count: workersCount, error: workersError } = await supabase
                    .from('profiles')
                    .select('id', { count: 'exact', head: true })
                    .eq('role', 'worker');
                  
                  const { count: employersCount, error: employersError } = await supabase
                    .from('profiles')
                    .select('id', { count: 'exact', head: true })
                    .eq('role', 'employer');
                  
                  const { count: adminsCount, error: adminsError } = await supabase
                    .from('profiles')
                    .select('id', { count: 'exact', head: true })
                    .eq('role', 'admin');
                  
                  console.log('Direct count queries:', {
                    workers: { count: workersCount, error: workersError },
                    employers: { count: employersCount, error: employersError },
                    admins: { count: adminsCount, error: adminsError }
                  });
                  
                  // Show alert with results
                  alert(`Database Results:
Total Profiles: ${testProfiles.length}
Workers: ${testProfiles.filter(p => p.role === 'worker').length}
Employers: ${testProfiles.filter(p => p.role === 'employer').length}
Admins: ${testProfiles.filter(p => p.role === 'admin').length}

Count Query Results:
Workers Count: ${workersCount || 0}
Employers Count: ${employersCount || 0}
Admins Count: ${adminsCount || 0}

Check browser console for detailed logs.`);
                }
              }}
            >
              Debug Data
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Total Employees/Workers</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWorkers}</div>
              <p className="text-xs text-muted-foreground">
                Registered employees/workers in the platform
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employers</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEmployers}</div>
              <p className="text-xs text-muted-foreground">
                Registered employers in the platform
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAdmins || 0}</div>
              <p className="text-xs text-muted-foreground">
                Platform administrators
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingSubmissions} pending, {stats.approvedSubmissions} approved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTasks}</div>
              <p className="text-xs text-muted-foreground">
                Active tasks in the platform
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatINR(stats.totalBudget)}</div>
              <p className="text-xs text-muted-foreground">
                Total value of all tasks
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="tasks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tasks">All Tasks ({stats.totalTasks})</TabsTrigger>
            <TabsTrigger value="employers">Employers ({stats.totalEmployers})</TabsTrigger>
            <TabsTrigger value="workers">Workers ({stats.totalWorkers})</TabsTrigger>
            <TabsTrigger value="submissions">All Submissions ({stats.totalSubmissions})</TabsTrigger>
            <TabsTrigger value="payment-bank-details">Payment & Bank Details</TabsTrigger>
            <TabsTrigger value="employer-verifications">Employer Verifications</TabsTrigger>
          </TabsList>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No tasks found.</p>
                ) : (
                  <div className="space-y-4">
                    {tasks.map((task) => (
                      <div key={task.id} className="border rounded-lg">
                        {/* Task Header */}
                        <div 
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleTaskExpansion(task.id)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{task.title}</h3>
                              <Badge variant="outline">{task.submission_count} submissions</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Created by: {task.employer_profile?.full_name || `Employer ${task.created_by.substring(0, 8)}`} • 
                              {task.employer_profile?.email || 'No email'} • 
                              {formatTimeAgo(task.created_at)}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {task.description}
                            </p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <Badge variant="outline">{task.status}</Badge>
                            <span className="font-semibold">{formatINR(task.budget)}</span>
                            <Button variant="ghost" size="sm">
                              {expandedTasks.has(task.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Task Details (Expandable) */}
                        {expandedTasks.has(task.id) && task.submissions && (
                          <div className="border-t bg-muted/20 p-4">
                            <h4 className="font-medium mb-3">Submissions ({task.submissions.length})</h4>
                            {task.submissions.length === 0 ? (
                              <p className="text-muted-foreground text-sm">No submissions yet.</p>
                            ) : (
                              <div className="space-y-2">
                                {task.submissions.map((submission) => (
                                  <div key={submission.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                                    <div className="flex-1">
                                      <p className="font-medium">
                                        {submission.worker_profile?.full_name || `Employee/Worker ${submission.worker_id.substring(0, 8)}`}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {formatTimeAgo(submission.submitted_at)}
                                      </p>
                                      {submission.proof_text && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                          Proof: {submission.proof_text.substring(0, 100)}{submission.proof_text.length > 100 ? '...' : ''}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-3">
                                      <Badge className={getStatusColor(submission.status)} variant="secondary">
                                        {submission.status}
                                      </Badge>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleViewSubmission(submission);
                                        }}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employers Tab */}
          <TabsContent value="employers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Employers</CardTitle>
              </CardHeader>
              <CardContent>
                {employers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No employers found.</p>
                ) : (
                  <div className="space-y-6">
                    {employers.map((employer) => {
                      const employerTasks = tasks.filter(task => task.created_by === employer.user_id);
                      return (
                        <div key={employer.id} className="border rounded-lg p-4">
                          {/* Employer Header */}
                          <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold">{employer.full_name}</h3>
                            <Badge variant="outline">employer</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {employer.email} • {formatTimeAgo(employer.created_at)}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                                Created {employerTasks.length} task{employerTasks.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                              <Building className="h-5 w-5 text-muted-foreground" />
                              <span className="font-semibold text-lg">{employerTasks.length}</span>
                            </div>
                          </div>

                          {/* Employer's Tasks */}
                          {employerTasks.length > 0 ? (
                            <div className="space-y-3">
                              <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">
                                Tasks Created by {employer.full_name}
                              </h4>
                              {employerTasks.map((task) => (
                                <div key={task.id} className="bg-muted/30 rounded-lg p-3 border-l-4 border-l-primary">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-mono text-muted-foreground bg-background px-2 py-1 rounded">
                                          ID: {task.id.substring(0, 8)}...
                                        </span>
                                        <Badge variant="outline" className="text-xs">
                                          {task.status}
                                        </Badge>
                                      </div>
                                      <h5 className="font-medium text-sm">{task.title}</h5>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {task.description.length > 100 ? `${task.description.substring(0, 100)}...` : task.description}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-2">
                                        Created: {new Date(task.created_at).toLocaleDateString()} at {new Date(task.created_at).toLocaleTimeString()}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm font-semibold">{formatINR(task.budget)}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {task.submission_count || 0} submissions
                                      </div>
                                    </div>
                        </div>
                      </div>
                    ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 bg-muted/20 rounded-lg">
                              <p className="text-sm text-muted-foreground">
                                No tasks created yet by {employer.full_name}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

                        {/* Employees/Workers Tab */}
          <TabsContent value="workers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Employees/Workers</CardTitle>
              </CardHeader>
              <CardContent>
                {workers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No workers found.</p>
                ) : (
                  <div className="space-y-6">
                    {workers.map((worker) => {
                      const workerSubmissions = submissions.filter(submission => submission.worker_id === worker.user_id);
                      return (
                        <div key={worker.id} className="border rounded-lg p-4">
                          {/* Worker Header */}
                          <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold">{worker.full_name}</h3>
                            <Badge variant="outline">worker</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {worker.email} • {formatTimeAgo(worker.created_at)}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                                Made {workerSubmissions.length} submission{workerSubmissions.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                              <User className="h-5 w-5 text-muted-foreground" />
                              <span className="font-semibold text-lg">{workerSubmissions.length}</span>
                        </div>
                      </div>

                          {/* Worker's Submissions */}
                          {workerSubmissions.length > 0 ? (
                            <div className="space-y-3">
                              <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">
                                Submissions by {worker.full_name}
                              </h4>
                              {workerSubmissions.map((submission) => (
                                <div key={submission.id} className="bg-muted/30 rounded-lg p-3 border-l-4 border-l-success">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-mono text-muted-foreground bg-background px-2 py-1 rounded">
                                          Submission ID: {submission.id.substring(0, 8)}...
                                        </span>
                                        <span className="text-xs font-mono text-muted-foreground bg-background px-2 py-1 rounded">
                                          Task ID: {submission.task_id.substring(0, 8)}...
                                        </span>
                                        <Badge className={`${getStatusColor(submission.status)} text-xs`} variant="secondary">
                                          {submission.status}
                                        </Badge>
                                      </div>
                                      
                                      {/* Task Title */}
                                      <h5 className="font-medium text-sm mb-2">
                                        Task: {submission.task?.title || 'Unknown Task'}
                                      </h5>
                                      
                                      {/* Proof Information */}
                                      {submission.proof_text && (
                                        <div className="mb-2">
                                          <p className="text-xs text-muted-foreground font-medium">Proof Text:</p>
                                          <p className="text-xs text-muted-foreground mt-1 bg-background p-2 rounded">
                                            {submission.proof_text.length > 100 ? `${submission.proof_text.substring(0, 100)}...` : submission.proof_text}
                                          </p>
                                        </div>
                                      )}
                                      
                                      {submission.proof_files && submission.proof_files.length > 0 && (
                                        <div className="mb-2">
                                          <p className="text-xs text-muted-foreground font-medium">Proof Files:</p>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {submission.proof_files.map((file, index) => (
                                              <span key={index} className="text-xs bg-background px-2 py-1 rounded border">
                                                {file}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      
                                      <p className="text-xs text-muted-foreground mt-2">
                                        Submitted: {new Date(submission.submitted_at).toLocaleDateString()} at {new Date(submission.submitted_at).toLocaleTimeString()}
                                      </p>
                                    </div>
                                    
                                    <div className="text-right ml-4">
                                      <div className="flex flex-col items-end space-y-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleViewSubmission(submission)}
                                        >
                                          <Eye className="h-3 w-3 mr-1" />
                                          View
                                        </Button>
                                        {submission.task && (
                                          <div className="text-xs text-muted-foreground">
                                            Budget: {formatINR(submission.task.budget)}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 bg-muted/20 rounded-lg">
                              <p className="text-sm text-muted-foreground">
                                No submissions yet by {worker.full_name}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Submissions Tab */}
          <TabsContent value="submissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                {submissions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No submissions found.</p>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((submission) => (
                      <div key={submission.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-semibold">{submission.task?.title || 'Unknown Task'}</h3>
                          <p className="text-sm text-muted-foreground">
                            Employee/Worker: {submission.worker_profile?.full_name || `Employee/Worker ${submission.worker_id.substring(0, 8)}`} • 
                            Employer: {submission.employer_profile?.full_name || `Employer ${submission.task?.created_by.substring(0, 8)}`} • 
                            {formatTimeAgo(submission.submitted_at)}
                          </p>
                          {submission.proof_text && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Proof: {submission.proof_text.substring(0, 100)}{submission.proof_text.length > 100 ? '...' : ''}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge className={getStatusColor(submission.status)} variant="secondary">
                            {submission.status}
                          </Badge>
                          <span className="font-semibold">{formatINR(submission.task?.budget || 0)}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewSubmission(submission)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment & Bank Details Tab */}
          <TabsContent value="payment-bank-details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Payment & Bank Details Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Payment & Bank Details Management
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Monitor all worker payments, view bank account information, and track payment status across the platform.
                  </p>
                  <Button asChild className="bg-blue-600 hover:bg-blue-700">
                    <a href="/admin/payment-bank-details">
                      <CreditCard className="h-4 w-4 mr-2" />
                      View Payment & Bank Details
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employer Verifications Tab */}
          <TabsContent value="employer-verifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Employer Document Verification</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Employer Verification Management
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Review and approve employer document submissions to grant dashboard access.
                  </p>
                  <Button asChild className="bg-blue-600 hover:bg-blue-700">
                    <a href="/admin/employer-verifications">
                      <Shield className="h-4 w-4 mr-2" />
                      Manage Employer Verifications
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Proof Modal */}
        {selectedSubmission && (
          <SubmissionProofModal
            submission={selectedSubmission}
            isOpen={isProofModalOpen}
            onClose={() => setIsProofModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;