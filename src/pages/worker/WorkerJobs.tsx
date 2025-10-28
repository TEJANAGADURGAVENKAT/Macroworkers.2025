import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search,
  Filter,
  Clock,
  IndianRupee,
  Users,
  Star,
  Briefcase,
  Timer,
  Calendar,
  AlertCircle,
  TrendingUp,
  Award,
  Zap,
  UserPlus,
  CheckCircle,
  Loader2,
  Play
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getEmployeeRatingSummary } from "@/lib/employee-ratings-api";
import { useToast } from "@/hooks/use-toast";
import { checkWorkerBankDetails } from "@/lib/bank-details-validation";
import { BankDetailsValidationModal } from "@/components/ui/bank-details-validation-modal";

// TypeScript interfaces for better type safety
interface Task {
  id: string;
  title: string;
  description: string;
  budget: number;
  category: string;
  status: string;
  created_at: string;
  created_by: string;
  requirements?: string;
  max_workers: number;
  assigned_count: number;
  assignment_start_time?: string;
  assignment_end_time?: string;
  required_rating?: number;
  role_category?: string;
  difficulty?: string;
  slots?: number;
  is_time_sensitive?: boolean;
  time_slot_start?: string;
  time_slot_end?: string;
}

interface TaskAssignment {
  id: string;
  task_id: string;
  worker_id: string;
  status: 'assigned' | 'working' | 'submitted' | 'completed';
  assigned_at: string;
  created_at: string;
  updated_at: string;
}

const WorkerJobs = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workerRating, setWorkerRating] = useState<number>(1.0);
  const [showRatingInfo, setShowRatingInfo] = useState(false);
  const [assigningTask, setAssigningTask] = useState<string | null>(null);
  const [assignedTasks, setAssignedTasks] = useState<Set<string>>(new Set());
  const [taskSlotCounts, setTaskSlotCounts] = useState<Record<string, number>>({});
  const [refreshingSlots, setRefreshingSlots] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [showBankDetailsModal, setShowBankDetailsModal] = useState(false);
  const [hasBankDetails, setHasBankDetails] = useState<boolean | null>(null);

  // Load slot counts for all tasks - use database assigned_count field
  const loadTaskSlotCounts = async (taskIds: string[]) => {
    try {
      setRefreshingSlots(true);
      console.log('🚨 Loading slot counts for task IDs:', taskIds);
      
      // Get slot information directly from tasks table using assigned_count
      const { data: tasksData, error } = await supabase
        .from('tasks')
        .select('id, assigned_count, max_workers, updated_at')
        .in('id', taskIds);

      if (error) {
        console.error('🚨 Error loading slot counts:', error);
        return;
      }

      console.log('🚨 Raw tasks data from database:', tasksData);

      // Use the assigned_count from database (should be updated by triggers)
      const counts: Record<string, number> = {};
      tasksData?.forEach(task => {
        // Use assigned_count as the current count, handle NULL values
        const currentCount = task.assigned_count || 0;
        counts[task.id] = currentCount;
        console.log(`🚨 Task ${task.id}: assigned_count=${task.assigned_count || 0}, max_workers=${task.max_workers}, updated_at=${task.updated_at}, using=${currentCount}`);
      });

      console.log('🚨 Processed slot counts:', counts);
      setTaskSlotCounts(counts);
      
      // Force UI re-render to ensure slot counts are displayed correctly
      setForceUpdate(prev => prev + 1);
      console.log('🚨 Force update triggered, new value:', forceUpdate + 1);
    } catch (error) {
      console.error('🚨 Error loading slot counts:', error);
    } finally {
      setRefreshingSlots(false);
    }
  };

  // Manual refresh function that directly updates all slot counts from database
  const manualRefreshSlotCounts = async () => {
    try {
      console.log('🚨 MANUAL REFRESH: Updating all slot counts from database');
      
      // Get all active tasks
      const { data: allTasks, error } = await supabase
        .from('tasks')
        .select('id, assigned_count, max_workers')
        .eq('status', 'active');

      if (error) {
        console.error('🚨 Error fetching all tasks:', error);
        return;
      }

      // Count actual assignments for each task
      const counts: Record<string, number> = {};
      
      for (const task of allTasks || []) {
        const { data: assignments, error: assignmentError } = await supabase
          .from('task_assignments')
          .select('id')
          .eq('task_id', task.id)
          .in('status', ['assigned', 'working', 'submitted', 'completed']);

        if (assignmentError) {
          console.error('🚨 Error counting assignments for task', task.id, ':', assignmentError);
          counts[task.id] = task.assigned_count || 0;
        } else {
          const actualCount = assignments?.length || 0;
          counts[task.id] = actualCount;
          
          // Update the database if counts don't match
          if (actualCount !== (task.assigned_count || 0)) {
            console.log(`🚨 CORRECTING DATABASE: Task ${task.id} assigned_count ${task.assigned_count || 0} -> ${actualCount}`);
            
            const { error: updateError } = await supabase
              .from('tasks')
              .update({ 
                assigned_count: actualCount,
                updated_at: new Date().toISOString()
              })
              .eq('id', task.id);

            if (updateError) {
              console.error('🚨 Error updating task', task.id, ':', updateError);
            } else {
              console.log(`🚨 SUCCESS: Updated task ${task.id} assigned_count to ${actualCount}`);
            }
          }
        }
      }

      console.log('🚨 MANUAL REFRESH: Final slot counts:', counts);
      setTaskSlotCounts(counts);
      setForceUpdate(prev => prev + 1);
      
      toast({
        title: "Slot Counts Refreshed",
        description: "All slot counts have been updated from the database.",
      });
      
    } catch (error) {
      console.error('🚨 Error in manual refresh:', error);
      toast({
        title: "Refresh Failed",
        description: "Could not refresh slot counts. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Refresh slot counts every 5 seconds to keep them up-to-date (reduced from 10s)
  useEffect(() => {
    const interval = setInterval(() => {
      if (tasks.length > 0) {
        const taskIds = tasks.map(t => t.id);
        console.log('🚨 Auto-refreshing slot counts every 5 seconds');
        loadTaskSlotCounts(taskIds);
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [tasks]);

  // Refresh slot counts when page becomes visible (user switches back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && tasks.length > 0) {
        const taskIds = tasks.map(t => t.id);
        console.log('Page became visible, refreshing slot counts');
        loadTaskSlotCounts(taskIds);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [tasks]);

  // Real-time subscription to task assignments for immediate updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('task_assignments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_assignments'
        },
        (payload) => {
          console.log('🚨 Real-time assignment change detected:', payload);
          
          // Force immediate UI update
          setForceUpdate(prev => prev + 1);
          console.log('🚨 Force update triggered due to real-time change');
          
          // Optimistically update slot counts based on the change
          if (payload.eventType === 'INSERT') {
            setTaskSlotCounts(prev => {
              const updated = { ...prev };
              updated[payload.new.task_id] = (updated[payload.new.task_id] || 0) + 1;
              console.log('🚨 Real-time: Slot count increased for task:', payload.new.task_id, 'New count:', updated[payload.new.task_id]);
              return updated;
            });
            
            // Force UI update
            setForceUpdate(prev => prev + 1);
          } else if (payload.eventType === 'DELETE') {
            setTaskSlotCounts(prev => {
              const updated = { ...prev };
              updated[payload.old.task_id] = Math.max(0, (updated[payload.old.task_id] || 0) - 1);
              console.log('🚨 Real-time: Slot count decreased for task:', payload.old.task_id, 'New count:', updated[payload.old.task_id]);
              return updated;
            });
            
            // Force UI update
            setForceUpdate(prev => prev + 1);
          }
          
          // Refresh slot counts when any assignment changes
          if (tasks.length > 0) {
            const taskIds = tasks.map(t => t.id);
            console.log('🚨 Refreshing slot counts due to real-time change');
            loadTaskSlotCounts(taskIds);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          console.log('🚨 Real-time task change detected:', payload);
          
          // Force immediate UI update
          setForceUpdate(prev => prev + 1);
          console.log('🚨 Force update triggered due to task change');
          
          // Refresh slot counts when task data changes
          if (tasks.length > 0) {
            const taskIds = tasks.map(t => t.id);
            console.log('🚨 Refreshing slot counts due to task change');
            loadTaskSlotCounts(taskIds);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, tasks]);

  useEffect(() => {
    const loadTasks = async () => {
      if (!user || !profile) return;
      setIsLoading(true);
      setLoadError(null);
      try {
        // Load worker's current rating using the same API as Dashboard
        const ratingSummary = await getEmployeeRatingSummary(user.id);

        if (ratingSummary) {
          setWorkerRating(ratingSummary.average_rating);
          console.log('🔍 Worker rating loaded:', ratingSummary.average_rating);
        } else {
          // Fallback to default for new workers
          setWorkerRating(1.0);
          console.log('🔍 Worker rating fallback to 1.0');
        }

        // Load ALL active tasks (universal trigger handles slot counting for all tasks)
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        console.log('Tasks loaded with constraints:', data?.map(t => ({
          id: t.id,
          title: t.title,
          role_category: (t as any).role_category,
          required_rating: (t as any).required_rating,
          assignment_start_time: (t as any).assignment_start_time,
          assignment_end_time: (t as any).assignment_end_time,
          max_workers: (t as any).max_workers,
          assigned_count: (t as any).assigned_count
        })));
        
        console.log('Worker profile category:', (profile as any)?.category);
        console.log('Total tasks loaded:', data?.length || 0);
        console.log('Tasks by role_category:', data?.reduce((acc, t) => {
          const cat = (t as any).role_category || 'NULL';
          acc[cat] = (acc[cat] || 0) + 1;
          return acc;
        }, {} as Record<string, number>));
        
        setTasks(data || []);
        
        // Load slot counts for all tasks immediately
        const taskIds = (data || []).map(t => t.id);
        console.log('Loading slot counts for task IDs:', taskIds);
        await loadTaskSlotCounts(taskIds);

        // Load already assigned tasks
        await loadAssignedTasks();
      } catch (e: any) {
        setLoadError(e?.message || "Failed to load tasks");
      } finally {
        setIsLoading(false);
      }
    };
    loadTasks();
  }, [user, profile]);

  const loadAssignedTasks = async () => {
    if (!user) return;
    
    try {
      // Load from both task_assignments and task_submissions for transition
      const [assignmentsResult, submissionsResult] = await Promise.all([
        supabase
          .from('task_assignments')
          .select('task_id')
          .eq('worker_id', user.id),
        supabase
          .from('task_submissions')
          .select('task_id')
          .eq('worker_id', user.id)
          .eq('status', 'assigned')
      ]);

      const assignmentTaskIds = assignmentsResult.data?.map(item => item.task_id) || [];
      const submissionTaskIds = submissionsResult.data?.map(item => item.task_id) || [];
      
      // Combine both sources
      const allAssignedTaskIds = new Set([...assignmentTaskIds, ...submissionTaskIds]);
      setAssignedTasks(allAssignedTaskIds);
      
      console.log('Loaded assigned tasks from both sources:', allAssignedTaskIds);
    } catch (err: any) {
      console.error('Error loading assigned tasks:', err);
    }
  };

  const handleAssignTask = async (taskId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to assign tasks.",
        variant: "destructive"
      });
      return;
    }
    
    setAssigningTask(taskId);
    
    try {
      // Check bank details before allowing task assignment
      const bankDetailsCheck = await checkWorkerBankDetails(user.id);
      setHasBankDetails(bankDetailsCheck.hasBankDetails);
      
      if (!bankDetailsCheck.hasBankDetails) {
        setShowBankDetailsModal(true);
        return;
      }
      
      // Check if already assigned
      if (assignedTasks.has(taskId)) {
        toast({
          title: "Already Assigned",
          description: "You have already assigned yourself to this task.",
          variant: "destructive"
        });
        return;
      }

      // Get task details to check constraints
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        toast({
          title: "Task Not Found",
          description: "The task you're trying to assign no longer exists.",
          variant: "destructive"
        });
        return;
      }

      // Validate worker eligibility
      if (profile?.worker_status && profile.worker_status !== 'active_employee') {
        toast({
          title: "Assignment Not Available",
          description: "You need to complete your onboarding process before assigning tasks.",
          variant: "destructive"
        });
        return;
      }

      // Check assignment time window
      if (task.assignment_start_time && task.assignment_end_time) {
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
        
        if (currentTime < task.assignment_start_time || currentTime > task.assignment_end_time) {
          toast({
            title: "Assignment Window Closed",
            description: `Task assignments are only allowed between ${task.assignment_start_time} and ${task.assignment_end_time}.`,
            variant: "destructive"
          });
          return;
        }
      }

      // Check if task has available slots before assignment
      const currentAssignedCount = task.assigned_count || 0;
      const maxWorkers = task.max_workers || 1;
      
      if (currentAssignedCount >= maxWorkers) {
        toast({
          title: "Task Full",
          description: `This task is already full (${currentAssignedCount}/${maxWorkers} slots taken).`,
          variant: "destructive"
        });
        return;
      }

      // Create task assignment with proper error handling
      console.log('Creating assignment with data:', {
        task_id: taskId,
        worker_id: user.id,
        status: 'assigned',
        current_slots: currentAssignedCount,
        max_slots: maxWorkers
      });

      // Create in task_assignments table - simplified insert
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('task_assignments')
        .insert({
          task_id: taskId,
          worker_id: user.id,
          status: 'assigned'
        })
        .select()
        .single();

      console.log('Assignment creation result:', { data: assignmentData, error: assignmentError });

      if (assignmentError) {
        console.error('Detailed assignment error:', assignmentError);
        
        // Handle specific database errors with user-friendly messages
        if (assignmentError.code === '23505') { // Unique constraint violation
          toast({
            title: "Already Assigned",
            description: "You have already assigned yourself to this task.",
            variant: "destructive"
          });
          return;
        }
        
        if (assignmentError.code === '23503') { // Foreign key constraint violation
          toast({
            title: "Assignment Failed",
            description: "Task or worker information is invalid. Please refresh and try again.",
            variant: "destructive"
          });
          return;
        }

        // Show the actual error for debugging
        toast({
          title: "Assignment Failed",
          description: `Error: ${assignmentError.message || 'Unknown error'}`,
          variant: "destructive"
        });
        return;
      }

      console.log('Assignment successful! Assignment data:', assignmentData);

      // Update local state immediately for optimistic UI
      setAssignedTasks(prev => new Set([...prev, taskId]));

      // Optimistically update slot counts immediately
      setTaskSlotCounts(prev => {
        const updated = { ...prev };
        updated[taskId] = (updated[taskId] || 0) + 1;
        console.log('🚨 Optimistically updated slot counts:', updated);
        return updated;
      });
      
      // Force UI re-render after optimistic update
      setForceUpdate(prev => prev + 1);
      console.log('🚨 Force update after optimistic slot update');

      // DIRECTLY UPDATE THE DATABASE assigned_count FIELD
      console.log('🚨 DIRECTLY UPDATING DATABASE assigned_count for task:', taskId);
      
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ 
          assigned_count: currentAssignedCount + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (updateError) {
        console.error('🚨 Error updating assigned_count:', updateError);
      } else {
        console.log('🚨 Successfully updated assigned_count in database');
      }

      // Refresh slot counts to reflect the new assignment
      const taskIds = tasks.map(t => t.id);
      console.log('🚨 Refreshing slot counts after assignment for task IDs:', taskIds);
      
      // Immediate refresh
      await loadTaskSlotCounts(taskIds);

      // Show success toast
      toast({
        title: "Task Assigned Successfully!",
        description: "You have successfully assigned yourself to this task.",
      });

      // Redirect to work on task page after a short delay
      setTimeout(() => {
        navigate(`/worker/task/${taskId}`);
      }, 1500);
      
    } catch (err: any) {
      console.error('Error assigning task:', err);
      
      // Handle network or unexpected errors
      toast({
        title: "Assignment Failed",
        description: "Could not assign task. Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setAssigningTask(null);
    }
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => t.category && set.add(t.category));
    return [{ value: "all", label: "All Categories" }, ...Array.from(set).map((c) => ({ value: c, label: c }))];
  }, [tasks]);

  // Helper function to check if task has available slots
  const hasAvailableSlots = (task: Task) => {
    const currentCount = task.assigned_count || 0;
    const maxSlotsAvailable = task.max_workers || 1;
    return currentCount < maxSlotsAvailable;
  };

  // Helper function to get available slots count
  const getAvailableSlots = (task: Task) => {
    const currentCount = task.assigned_count || 0;
    const totalSlots = task.max_workers || 1;
    return Math.max(0, totalSlots - currentCount);
  };

  const filteredTasks = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const workerCategory = (profile as any)?.category;
    
    console.log('Filtering tasks:', {
      totalTasks: tasks.length,
      workerCategory,
      workerRating,
      searchQuery: q,
      selectedCategory
    });
    
    const filtered = tasks.filter((task) => {
      const matchesSearch = task.title?.toLowerCase().includes(q) || 
                           task.description?.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === "all" || task.category === selectedCategory;
      const meetsRating = ((task as any).required_rating || 1.0) <= workerRating;
      
      // Match worker category with task role_category
      const taskRoleCategory = (task as any).role_category;
      const matchesWorkerCategory = !workerCategory || !taskRoleCategory || 
                                   taskRoleCategory === 'General' || 
                                   workerCategory === taskRoleCategory;
      
      // Hide tasks that are full (unless worker is already assigned)
      const currentAssignedCount = task.assigned_count || 0;
      const isTaskFull = task.max_workers && currentAssignedCount >= task.max_workers;
      const isWorkerAssigned = assignedTasks.has(task.id);
      const shouldShowFullTask = !isTaskFull || isWorkerAssigned;
      
      const passes = matchesSearch && matchesCategory && meetsRating && matchesWorkerCategory && shouldShowFullTask;
      
      // Debug logging for all tasks
      if (task.title) {
        console.log(`Task "${task.title}":`, {
          role_category: taskRoleCategory,
          required_rating: (task as any).required_rating,
          matchesSearch,
          matchesCategory,
          meetsRating,
          matchesWorkerCategory,
          shouldShowFullTask,
          passes
        });
      }
      
      return passes;
    });
    
    console.log(`Filtered ${filtered.length} tasks out of ${tasks.length}`);
    return filtered;
  }, [tasks, searchQuery, selectedCategory, workerRating, profile, assignedTasks]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-800 border-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "hard":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-muted text-muted-foreground border-muted";
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return <Zap className="h-3 w-3" />;
      case "medium":
        return <TrendingUp className="h-3 w-3" />;
      case "hard":
        return <Award className="h-3 w-3" />;
      default:
        return <Star className="h-3 w-3" />;
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    if (rating >= 4.0) return "text-yellow-500 bg-yellow-50 border-yellow-200";
    if (rating >= 3.0) return "text-blue-500 bg-blue-50 border-blue-200";
    if (rating >= 2.0) return "text-orange-500 bg-orange-50 border-orange-200";
    return "text-red-500 bg-red-50 border-red-200";
  };

  const formatTimeSlot = (task: any) => {
    if (!task.is_time_sensitive || !task.time_slot_date) return null;
    
    const date = new Date(task.time_slot_date).toLocaleDateString();
    const startTime = task.time_slot_start;
    const endTime = task.time_slot_end;
    
    return `${date} ${startTime} - ${endTime}`;
  };

  const isTimeSlotActive = (task: any) => {
    if (!task.is_time_sensitive || !task.time_slot_date) return true;
    
    const now = new Date();
    const taskDate = new Date(task.time_slot_date);
    const currentTime = now.toTimeString().slice(0, 5);
    
    // Check if current date matches task date
    if (now.toDateString() !== taskDate.toDateString()) {
      return false;
    }
    
    // Check if current time is within the slot
    return currentTime >= task.time_slot_start && currentTime <= task.time_slot_end;
  };

  const getTimeProgress = (task: any) => {
    if (!task.is_time_sensitive || !task.time_slot_date || !task.time_slot_start || !task.time_slot_end) {
      return null;
    }

    const now = new Date();
    const taskDate = new Date(task.time_slot_date);
    
    // If not today, return null
    if (now.toDateString() !== taskDate.toDateString()) {
      return null;
    }

    const startTime = new Date(`${taskDate.toDateString()} ${task.time_slot_start}`);
    const endTime = new Date(`${taskDate.toDateString()} ${task.time_slot_end}`);
    
    if (now < startTime) {
      return { progress: 0, status: "upcoming" };
    } else if (now > endTime) {
      return { progress: 100, status: "expired" };
    } else {
      const totalDuration = endTime.getTime() - startTime.getTime();
      const elapsed = now.getTime() - startTime.getTime();
      const progress = Math.min((elapsed / totalDuration) * 100, 100);
      return { progress, status: "active" };
    }
  };

  const canAccessTask = (task: any) => {
    // Check rating requirement - worker rating should be >= required rating
    const requiredRating = task.required_rating || 1.0;
    const hasRequiredRating = workerRating >= requiredRating;
    
    console.log(`🔍 Rating check for ${task.title}:`, {
      workerRating,
      requiredRating,
      hasRequiredRating,
      comparison: `${workerRating} >= ${requiredRating} = ${hasRequiredRating}`
    });

    // Check slot availability
    const currentAssignedCount = task.assigned_count || 0;
    const isTaskFull = task.max_workers && currentAssignedCount >= task.max_workers;
    
    console.log(`🔍 Slot check for ${task.title}:`, {
      max_workers: task.max_workers,
      assigned_count: currentAssignedCount,
      isTaskFull,
      slots_left: task.max_workers - currentAssignedCount
    });

    if (!hasRequiredRating) {
      return false;
    }

    // Check assignment time window
    if (task.assignment_start_time && task.assignment_end_time) {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      
      if (currentTime < task.assignment_start_time || currentTime > task.assignment_end_time) {
        return false;
      }
    }

    // Check worker limit using current slot counts
    if (isTaskFull) {
      return false;
    }

    return true;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Star key="half" className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />);
    }
    
    return stars;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Professional Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Briefcase className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Job Marketplace</h1>
                  <p className="text-sm text-gray-600 font-medium">Discover opportunities that match your skills</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2 rounded-lg border border-amber-200">
                <Star className="h-5 w-5 text-amber-600" />
                <div className="text-sm">
                  <span className="font-semibold text-gray-900">Rating: {workerRating.toFixed(1)}</span>
                  <span className="text-gray-500 ml-2">/ 5.0</span>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/worker')}
                className="flex items-center space-x-2 bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:text-gray-900"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">Dashboard</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">

          {/* Professional Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Your Rating</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-gray-900">{workerRating.toFixed(1)}</span>
                    <div className="flex">
                      {renderStars(workerRating)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Tasks Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{(profile as any)?.total_tasks_completed || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <IndianRupee className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-bold text-gray-900">₹{((profile as any)?.total_earnings || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search for tasks by title, description, or skills..."
                  className="pl-12 h-12 text-gray-900 placeholder-gray-500 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="lg:w-64 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <Filter className="h-5 w-5 mr-3 text-gray-400" />
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Task Count and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
                <p className="text-sm font-medium text-gray-700">
                  {isLoading ? "Loading tasks..." : `${filteredTasks.length} of ${tasks.length} tasks available`}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  console.log('🚨 Manual refresh triggered by user');
                  manualRefreshSlotCounts();
                }}
                className="flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:text-gray-900"
                disabled={refreshingSlots}
              >
                {refreshingSlots ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Users className="h-4 w-4" />
                )}
                {refreshingSlots ? 'Refreshing...' : 'Refresh Slots'}
              </Button>
            </div>
          </div>

          {/* Error State */}
          {loadError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Tasks</h3>
                <p className="text-red-700">{loadError}</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredTasks.length === 0 && !loadError && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
              <div className="text-center">
                <Briefcase className="h-16 w-16 mx-auto mb-6 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Tasks Found</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery || selectedCategory !== 'all' 
                    ? "Try adjusting your search criteria or filters to find more tasks."
                    : "There are currently no available tasks. Check back later for new opportunities!"
                  }
                </p>
                {(searchQuery || selectedCategory !== 'all') && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                    className="bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:text-gray-900"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Tasks Grid */}
          <div className="grid gap-6">
            {filteredTasks.map((task) => (
              <motion.div
                key={`${task.id}-${forceUpdate}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className={`bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 ${
                  !canAccessTask(task) ? 'opacity-60' : ''
                }`}>
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                      {/* Task Content */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{task.title}</h3>
                            <p className="text-gray-600 mb-4 line-clamp-2">
                              {task.description}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3 ml-6">
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(task.difficulty)}`}>
                              {getDifficultyIcon(task.difficulty)}
                              <span className="ml-1">{task.difficulty || "Not specified"}</span>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRatingColor(task.required_rating || 1.0)}`}>
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span className="ml-1">{task.required_rating || 1.0}★</span>
                            </div>
                          </div>
                        </div>

                        {/* Task Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                              <IndianRupee className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Payment</p>
                              <p className="text-lg font-bold text-gray-900">{formatINR(task.budget || 0)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                              <Users className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Available Slots</p>
                              <p className="text-lg font-bold text-gray-900">
                                {Math.max(0, (task.max_workers || 1) - (task.assigned_count || 0))} of {task.max_workers || 1}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                              <Clock className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Category</p>
                              <p className="text-lg font-bold text-gray-900">{task.category || "General"}</p>
                            </div>
                          </div>
                        </div>

                      {/* Time Slot Information with Progress Bar */}
                      {task.is_time_sensitive && formatTimeSlot(task) && (
                        <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-blue-800 font-medium">
                              Time Slot: {formatTimeSlot(task)}
                            </span>
                          </div>
                          
                          {/* Progress Bar for Time-Sensitive Tasks */}
                          {(() => {
                            const timeProgress = getTimeProgress(task);
                            if (!timeProgress) return null;
                            
                            return (
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-blue-700">
                                  <span>
                                    {timeProgress.status === "upcoming" && "Starting soon..."}
                                    {timeProgress.status === "active" && "In progress..."}
                                    {timeProgress.status === "expired" && "Time expired"}
                                  </span>
                                  <span>{Math.round(timeProgress.progress)}%</span>
                                </div>
                                <Progress value={timeProgress.progress} className="h-2" />
                                <div className="flex justify-between text-xs text-blue-600">
                                  <span>{task.time_slot_start}</span>
                                  <span>{task.time_slot_end}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Rating Requirements Display */}
                      <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-gray-700">
                          <strong>Required Rating:</strong> {task.required_rating || 1.0}★ 
                          {task.required_rating > workerRating && (
                            <span className="text-red-600 ml-2">(Your rating: {workerRating.toFixed(1)}★)</span>
                          )}
                        </span>
                      </div>

                      {/* Star Rating Display */}
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Task Level:</span>
                        <div className="flex items-center space-x-1">
                          {renderStars(task.required_rating || 1.0)}
                        </div>
                        <span className="text-xs text-gray-500 ml-2">
                          {task.required_rating >= 4.5 ? "Expert Level" :
                           task.required_rating >= 4.0 ? "Advanced Level" :
                           task.required_rating >= 3.0 ? "Intermediate Level" :
                           task.required_rating >= 2.0 ? "Beginner Level" : "Basic Level"}
                        </span>
                      </div>

                      {/* Assignment Constraints */}
                      {(task.assignment_start_time && task.assignment_end_time) && (
                        <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg border border-green-200">
                          <Clock className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-800">
                            Assignment window: {task.assignment_start_time} - {task.assignment_end_time}
                          </span>
                        </div>
                      )}

                      {task.max_workers && (
                        <div className="flex items-center space-x-2 p-2 bg-purple-50 rounded-lg border border-purple-200">
                          <Users className="h-4 w-4 text-purple-600" />
                          <span className="text-sm text-purple-800">
                            Slots left: {Math.max(0, (task.max_workers || 1) - (task.assigned_count || 0))} of {task.max_workers || 1}
                          </span>
                          {!hasAvailableSlots(task) && (
                            <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                              Full
                            </Badge>
                          )}
                          {refreshingSlots && (
                            <Loader2 className="h-3 w-3 animate-spin text-purple-600" />
                          )}
                        </div>
                      )}

                      {!canAccessTask(task) && (
                        <div className="flex items-center space-x-2 p-2 bg-red-50 rounded-lg border border-red-200">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <span className="text-sm text-red-800">
                            {(() => {
                              const requiredRating = task.required_rating || 1.0;
                              const hasRequiredRating = workerRating >= requiredRating;
                              const currentAssignedCount = task.assigned_count || 0;
                              const isTaskFull = task.max_workers && currentAssignedCount >= task.max_workers;
                              
                              if (!hasRequiredRating) {
                                return `Requires ${task.required_rating}★ rating. Your rating: ${workerRating.toFixed(1)}★`;
                              } else if (isTaskFull) {
                                return `Task is full (${currentAssignedCount}/${task.max_workers} slots taken)`;
                              } else {
                                return "Cannot access this task";
                              }
                            })()}
                          </span>
                        </div>
                      )}
                    </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col space-y-3 lg:w-48">
                        <Button 
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300" 
                          disabled={!canAccessTask(task)}
                          asChild
                        >
                          <Link to={`/worker/task/${task.id}`}>
                            {(() => {
                              const requiredRating = task.required_rating || 1.0;
                              const hasRequiredRating = workerRating >= requiredRating;
                              const currentAssignedCount = task.assigned_count || 0;
                              const isTaskFull = task.max_workers && currentAssignedCount >= task.max_workers;
                              
                              if (!hasRequiredRating) {
                                return "Rating Too Low";
                              } else if (isTaskFull) {
                                return "Slots Full";
                              } else {
                                return "View Details";
                              }
                            })()}
                          </Link>
                        </Button>
                        
                        {canAccessTask(task) && (
                          assignedTasks.has(task.id) ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full bg-green-50 hover:bg-green-100 border-green-300 text-green-700 hover:text-green-800 font-medium"
                              asChild
                            >
                              <Link to={`/worker/task/${task.id}`}>
                                <Play className="h-4 w-4 mr-2" />
                                Continue Task
                              </Link>
                            </Button>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 font-medium">
                                  Available: {Math.max(0, (task.max_workers || 1) - (task.assigned_count || 0))}/{task.max_workers || 1}
                                </span>
                                {!hasAvailableSlots(task) && (
                                  <div className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                    Full
                                  </div>
                                )}
                              </div>
                              
                              <Button
                                variant={hasAvailableSlots(task) ? "default" : "secondary"}
                                size="sm"
                                className={`w-full font-semibold py-2 rounded-lg transition-all duration-200 ${
                                  hasAvailableSlots(task) 
                                    ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl hover:scale-105" 
                                    : "opacity-50 cursor-not-allowed"
                                }`}
                                disabled={
                                  assigningTask === task.id || 
                                  !canAccessTask(task) || 
                                  !hasAvailableSlots(task)
                                }
                                onClick={() => handleAssignTask(task.id)}
                              >
                                {assigningTask === task.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Assigning...
                                  </>
                                ) : !hasAvailableSlots(task) ? (
                                  <>
                                    <AlertCircle className="h-4 w-4 mr-2" />
                                    Slots Full
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Assign Task
                                  </>
                                )}
                              </Button>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Bank Details Validation Modal */}
      <BankDetailsValidationModal
        isOpen={showBankDetailsModal}
        onClose={() => setShowBankDetailsModal(false)}
        hasBankDetails={hasBankDetails || false}
      />
    </div>
  );
};

export default WorkerJobs;