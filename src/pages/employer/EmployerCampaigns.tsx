import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search,
  Plus,
  Eye,
  Pause,
  Play,
  BarChart3,
  Clock,
  TrendingUp,
  DollarSign,
  Calendar,
  IndianRupee,
  Trash2
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const EmployerCampaigns = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Check if employer is approved - redirect if not
  useEffect(() => {
    if (profile && profile.worker_status !== 'active_employee') {
      toast({
        title: "Access Restricted",
        description: "Please complete document verification to access campaigns.",
        variant: "destructive"
      });
      navigate('/employer/verify');
    }
  }, [profile, navigate, toast]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const loadTasks = async () => {
    if (!user) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      console.log('Loading tasks for user:', user.id);
      
      // Try multiple approaches to load tasks
      let data = null;
      let error = null;
      
      // Approach 1: Direct query
      const result1 = await supabase
        .from("tasks")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });
      
      console.log('Approach 1 result:', result1);
      
      if (result1.data && result1.data.length > 0) {
        data = result1.data;
        error = result1.error;
      } else {
        // Approach 2: Try with profile ID
        console.log('Trying with profile ID...');
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (profileData) {
          const result2 = await supabase
            .from("tasks")
            .select("*")
            .eq("created_by", profileData.id)
            .order("created_at", { ascending: false });
          
          console.log('Approach 2 result:', result2);
          data = result2.data;
          error = result2.error;
        }
      }
      
      // Approach 3: If still no data, try without any filter
      if (!data || data.length === 0) {
        console.log('Trying without filter...');
        const result3 = await supabase
          .from("tasks")
          .select("*")
          .order("created_at", { ascending: false });
        
        console.log('Approach 3 result:', result3);
        data = result3.data;
        error = result3.error;
      }
      
      if (error) {
        console.error('Tasks query error:', error);
        throw error;
      }
      
      console.log('Final loaded tasks:', data);
      setTasks(data || []);
    } catch (e: any) {
      console.error('Load error:', e);
      setLoadError(e?.message || "Failed to load campaigns");
    } finally {
      setIsLoading(false);
    }
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

  useEffect(() => {
    loadTasks();
  }, [user]);

  const grouped = useMemo(() => {
    const norm = (s?: string | null) => (s || "").toLowerCase();
    const result = {
      active: tasks.filter((t) => norm(t.status) === "active"),
      paused: tasks.filter((t) => norm(t.status) === "paused"),
      completed: tasks.filter((t) => norm(t.status) === "completed"),
    };
    console.log('Grouped tasks:', result);
    return result;
  }, [tasks]);

  const filtered = (list: any[]) =>
    list.filter((c) =>
      (c.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

  const getStatusColor = (status: string) => {
    switch ((status || "").toLowerCase()) {
      case "active":
        return "bg-success/10 text-success";
      case "paused":
        return "bg-warning/10 text-warning";
      case "completed":
        return "bg-primary/10 text-primary";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const CampaignCard = ({ campaign }: { campaign: any }) => {
    const target = campaign.slots ?? 0;
    const completed = campaign.completed_slots ?? 0;
    const completionRate = target > 0 ? (completed / target) * 100 : 0;
    const budget = typeof campaign.budget === "number" ? campaign.budget : 0;
    const spent = Math.min(budget, completed * (budget / Math.max(1, target)));

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-lg font-semibold">{campaign.title}</h3>
                <Badge className={getStatusColor(campaign.status)}>
                  {campaign.status || "draft"}
                </Badge>
              </div>
              {campaign.description && (
                <p className="text-sm text-muted-foreground mb-3">{campaign.description}</p>
              )}
              {campaign.category && (
                <Badge variant="outline" className="text-xs">{campaign.category}</Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{completed}/{target}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-gradient-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{completionRate.toFixed(0)}% Complete</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Budget</span>
                <span className="font-medium">{formatINR(spent)}/{formatINR(budget)}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-warning h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${budget > 0 ? (spent / budget) * 100 : 0}%` 
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{campaign.created_at?.slice(0, 10)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {campaign.status === "active" && (
                <Button size="sm" variant="outline">
                  <Pause className="h-3 w-3 mr-1" />
                  Pause
                </Button>
              )}
              {campaign.status === "paused" && (
                <Button size="sm" variant="outline">
                  <Play className="h-3 w-3 mr-1" />
                  Resume
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
              <Button size="sm" asChild>
                <Link to={`/employer/task/${campaign.id}`}>
                  <Eye className="h-3 w-3 mr-1" />
                  View Details
                </Link>
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => deleteTask(campaign.id)}
                disabled={deletingTaskId === campaign.id}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                {deletingTaskId === campaign.id ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Campaigns</h1>
            <p className="text-muted-foreground">Manage and monitor your task campaigns</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" asChild>
              <Link to="/employer">← Back to Dashboard</Link>
            </Button>
            <Button className="bg-gradient-primary" asChild>
              <Link to="/employer/create-task">
                <Plus className="h-4 w-4 mr-2" />
                Create New Campaign
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{grouped.active.length}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold">{grouped.paused.length}</p>
              <p className="text-sm text-muted-foreground">Paused</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold">{grouped.completed.length}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <IndianRupee className="h-6 w-6 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold">{formatINR(tasks.reduce((sum, t) => sum + (Number(t.budget) || 0), 0))}</p>
              <p className="text-sm text-muted-foreground">Total Budget</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search campaigns..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {loadError && (
          <Card>
            <CardContent className="p-4 text-sm text-destructive">{loadError}</CardContent>
          </Card>
        )}

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Active ({grouped.active.length})</span>
            </TabsTrigger>
            <TabsTrigger value="paused" className="flex items-center space-x-2">
              <Pause className="h-4 w-4" />
              <span>Paused ({grouped.paused.length})</span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Completed ({grouped.completed.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              {filtered(grouped.active).map((campaign, index) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <CampaignCard campaign={campaign} />
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="paused" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              {filtered(grouped.paused).map((campaign, index) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <CampaignCard campaign={campaign} />
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              {filtered(grouped.completed).map((campaign, index) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <CampaignCard campaign={campaign} />
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EmployerCampaigns;