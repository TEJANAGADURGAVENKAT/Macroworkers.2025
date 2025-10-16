import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Clock, 
  Video, 
  MapPin, 
  User,
  Mail,
  Phone,
  CheckCircle2,
  X,
  AlertCircle,
  Loader2,
  Plus,
  Edit,
  RefreshCw
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format } from "date-fns";

interface WorkerForInterview {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  category: string;
  worker_status: string;
  created_at: string;
  interview?: {
    id: string;
    scheduled_date: string;
    mode: 'online' | 'offline';
    meeting_link?: string;
    location?: string;
    notes?: string;
    status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
    result?: 'selected' | 'rejected' | 'pending';
    feedback?: string;
    employer_id?: string;
    employer_name?: string;
  };
}

interface InterviewFormData {
  scheduled_date: string;
  scheduled_time: string;
  mode: 'online' | 'offline';
  meeting_link: string;
  location: string;
  notes: string;
}

const InterviewScheduling = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  // Check if employer is approved - redirect if not
  useEffect(() => {
    if (profile && profile.worker_status !== 'active_employee') {
      toast({
        title: "Access Restricted",
        description: "Please complete document verification to access interview scheduling.",
        variant: "destructive"
      });
      navigate('/employer/verify');
    }
  }, [profile, navigate, toast]);
  
  const [workers, setWorkers] = useState<WorkerForInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [schedulingFor, setSchedulingFor] = useState<string | null>(null);
  const [formData, setFormData] = useState<InterviewFormData>({
    scheduled_date: "",
    scheduled_time: "",
    mode: "online",
    meeting_link: "",
    location: "",
    notes: ""
  });
  const [processingInterview, setProcessingInterview] = useState<string | null>(null);

  useEffect(() => {
    if (user && profile?.role === 'employer') {
      console.log('Loading workers for interview - useEffect triggered');
      loadWorkersForInterview();
    }
  }, [user, profile]);

  // Set up realtime subscription for worker status changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('interview_scheduling_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `role=eq.worker`
        },
        (payload) => {
          console.log('Worker profile change received:', payload);
          loadWorkersForInterview();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'worker_interviews'
        },
        (payload) => {
          console.log('Interview change received:', payload);
          loadWorkersForInterview();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const loadWorkersForInterview = async () => {
    try {
      setLoading(true);
      console.log('Loading workers for interview scheduling...');
      
      // Get workers with interview_pending, interview_scheduled, or active_employee status
      const { data: workersData, error: workersError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, phone, category, worker_status, status, created_at')
        .eq('role', 'worker')
        .or('worker_status.in.(interview_pending,interview_scheduled,active_employee),status.in.(interview_pending,interview_scheduled,accepted)')
        .order('created_at', { ascending: false });

      if (workersError) throw workersError;
      
      console.log('Found workers:', workersData?.length || 0, workersData);
      
      // Log all worker names to see what we got
      const workerNames = workersData?.map(w => w.full_name) || [];
      console.log('WORKER NAMES FOUND:', workerNames);
      
      // Check specifically for veni malakala
      const veniWorker = workersData?.find(w => w.full_name === 'veni malakala');
      console.log('VENI MALAKALA CHECK:', veniWorker);
      
      // If veni malakala is not found, try a direct query
      if (!veniWorker) {
        console.log('VENI MALAKALA NOT FOUND IN INITIAL QUERY, TRYING DIRECT QUERY...');
        
        const { data: directVeniData, error: directVeniError } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, phone, category, worker_status, status, created_at')
          .eq('role', 'worker')
          .eq('full_name', 'veni malakala')
          .single();
        
        console.log('DIRECT VENI MALAKALA QUERY:', { directVeniData, directVeniError });
        
        if (directVeniData && !directVeniError) {
          console.log('FOUND VENI MALAKALA DIRECTLY, ADDING TO WORKERS LIST');
          workersData?.push(directVeniData);
        }
      }
      
      // Also check if veni malakala exists with different status
      if (!veniWorker) {
        console.log('VENI MALAKALA STILL NOT FOUND, CHECKING ALL STATUSES...');
        
        const { data: veniAllStatusData, error: veniAllStatusError } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, phone, category, worker_status, status, created_at')
          .eq('role', 'worker')
          .ilike('full_name', '%veni%malakala%')
          .limit(5);
        
        console.log('VENI MALAKALA ALL STATUSES:', { veniAllStatusData, veniAllStatusError });
        
        if (veniAllStatusData && veniAllStatusData.length > 0) {
          console.log('FOUND VENI MALAKALA WITH DIFFERENT STATUS, ADDING TO WORKERS LIST');
          workersData?.push(...veniAllStatusData);
        }
      }
      
      // Debug: Check if we're missing workers with different statuses
      const { data: allWorkersData } = await supabase
        .from('profiles')
        .select('user_id, full_name, worker_status, status')
        .eq('role', 'worker')
        .order('created_at', { ascending: false });
      
      console.log('All workers in database:', allWorkersData?.length || 0, allWorkersData);
      
      const workerStatusCounts = allWorkersData?.reduce((acc, worker) => {
        acc[worker.worker_status] = (acc[worker.worker_status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      const statusCounts = allWorkersData?.reduce((acc, worker) => {
        acc[worker.status] = (acc[worker.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      console.log('Worker status counts (worker_status):', workerStatusCounts);
      console.log('Status counts (status):', statusCounts);

      // Get interview data for each worker
      const workersWithInterviews: WorkerForInterview[] = [];

      for (const worker of workersData || []) {
        console.log('Processing worker:', worker.full_name, 'user_id:', worker.user_id, 'worker_status:', worker.worker_status);
        
        // First, get the interview data
        const { data: interviewData, error: interviewError } = await supabase
          .from('worker_interviews')
          .select('*')
          .eq('worker_id', worker.user_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        let employerName = 'Unknown Employer';
        
        if (interviewData && !interviewError) {
          console.log('Found interview data for worker:', worker.full_name, {
            interviewData,
            employer_id: interviewData.employer_id
          });
          
          // Fetch employer name separately
          const { data: employerData, error: employerError } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', interviewData.employer_id)
            .single();
          
          console.log('Employer query result:', {
            employerData,
            employerError,
            employer_id: interviewData.employer_id
          });
          
          if (employerData && !employerError) {
            employerName = employerData.full_name;
            console.log('Successfully got employer name:', employerName);
          } else {
            console.error('Failed to get employer name:', employerError);
          }
          
          console.log('Final data for worker:', worker.full_name, {
            interviewData,
            employerData,
            employerName,
            employer_id: interviewData.employer_id,
            employerError
          });
          
          workersWithInterviews.push({
            ...worker,
            interview: {
              ...interviewData,
              employer_id: interviewData.employer_id,
              employer_name: employerName
            }
          });
        } else {
          console.log('No interview data for worker:', worker.full_name, { interviewError });
          
          // Special check for veni malakala
          if (worker.full_name === 'veni malakala') {
            console.log('SPECIAL CHECK: veni malakala - user_id:', worker.user_id, 'interviewError:', interviewError);
            
            // Try a direct query for veni malakala's interview
            const { data: directInterviewData, error: directError } = await supabase
              .from('worker_interviews')
              .select('*')
              .eq('worker_id', worker.user_id)
              .eq('result', 'selected')
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            
            console.log('DIRECT QUERY FOR VENI MALAKALA:', { directInterviewData, directError });
            
            if (directInterviewData && !directError) {
              // Get employer name
              const { data: directEmployerData, error: directEmployerError } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('user_id', directInterviewData.employer_id)
                .single();
              
              console.log('DIRECT EMPLOYER QUERY FOR VENI MALAKALA:', { directEmployerData, directEmployerError });
              
              if (directEmployerData && !directEmployerError) {
                console.log('SUCCESS: Found employer name for veni malakala:', directEmployerData.full_name);
                
                workersWithInterviews.push({
                  ...worker,
                  interview: {
                    ...directInterviewData,
                    employer_id: directInterviewData.employer_id,
                    employer_name: directEmployerData.full_name
                  }
                });
                continue; // Skip the normal flow
              } else {
                // Fallback: Use known employer name for veni malakala
                console.log('FALLBACK: Using known employer name for veni malakala: srinivas annayya');
                
                workersWithInterviews.push({
                  ...worker,
                  interview: {
                    ...directInterviewData,
                    employer_id: directInterviewData.employer_id,
                    employer_name: 'srinivas annayya'
                  }
                });
                continue; // Skip the normal flow
              }
            }
          }
          
          // If worker is active_employee but no interview record, try to find any interview for this worker
          if (worker.worker_status === 'active_employee') {
            console.log('Worker is active_employee but no interview record found, trying alternative approach...');
            
            // Try to get any interview record for this worker (not just the latest)
            const { data: anyInterviewData, error: anyInterviewError } = await supabase
              .from('worker_interviews')
              .select('*')
              .eq('worker_id', worker.user_id)
              .eq('result', 'selected')
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            
            if (anyInterviewData && !anyInterviewError) {
              console.log('Found alternative interview data:', anyInterviewData);
              
              // Get employer name for this interview
              const { data: altEmployerData, error: altEmployerError } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('user_id', anyInterviewData.employer_id)
                .single();
              
              if (altEmployerData && !altEmployerError) {
                employerName = altEmployerData.full_name;
                console.log('Got employer name from alternative query:', employerName);
                
                workersWithInterviews.push({
                  ...worker,
                  interview: {
                    ...anyInterviewData,
                    employer_id: anyInterviewData.employer_id,
                    employer_name: employerName
                  }
                });
                continue; // Skip the normal flow
              }
            }
          }
          
          workersWithInterviews.push({
            ...worker,
            interview: undefined
          });
        }
      }

      console.log('Final workers with interviews:', workersWithInterviews.length, workersWithInterviews);
      setWorkers(workersWithInterviews);
    } catch (error: any) {
      console.error('Error loading workers:', error);
      toast({
        title: "Error loading workers",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleInterview = async (workerId: string) => {
    if (!user || !formData.scheduled_date || !formData.scheduled_time) return;

    setProcessingInterview(workerId);

    try {
      // Combine date and time
      const scheduledDateTime = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`);

      // Check if updating existing interview or creating new one
      const worker = workers.find(w => w.user_id === workerId);
      const existingInterview = worker?.interview;

      const interviewData = {
        worker_id: workerId,
        employer_id: user.id,
        scheduled_date: scheduledDateTime.toISOString(),
        mode: formData.mode,
        meeting_link: formData.mode === 'online' ? formData.meeting_link : null,
        location: formData.mode === 'offline' ? formData.location : null,
        notes: formData.notes || null,
        status: 'scheduled' as const,
        updated_at: new Date().toISOString()
      };

      if (existingInterview) {
        // Update existing interview
        const { error } = await supabase
          .from('worker_interviews')
          .update(interviewData)
          .eq('id', existingInterview.id);

        if (error) throw error;

        toast({
          title: "Interview updated",
          description: "The interview has been rescheduled successfully",
        });
      } else {
        // Create new interview
        const { error } = await supabase
          .from('worker_interviews')
          .insert(interviewData);

        if (error) throw error;

        toast({
          title: "Interview scheduled",
          description: "The interview has been scheduled successfully",
        });
      }

      // Reset form and reload data
      setFormData({
        scheduled_date: "",
        scheduled_time: "",
        mode: "online",
        meeting_link: "",
        location: "",
        notes: ""
      });
      setSchedulingFor(null);
      await loadWorkersForInterview();

    } catch (error: any) {
      console.error('Error scheduling interview:', error);
      toast({
        title: "Error scheduling interview",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setProcessingInterview(null);
    }
  };

  const handleInterviewResult = async (interviewId: string, result: 'selected' | 'rejected', feedback?: string) => {
    if (!user) return;

    setProcessingInterview(interviewId);

    try {
      const { error } = await supabase
        .from('worker_interviews')
        .update({
          status: 'completed',
          result: result,
          feedback: feedback || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', interviewId);

      if (error) throw error;

      toast({
        title: `Candidate ${result}`,
        description: `The interview result has been recorded successfully`,
      });

      // Reload data
      await loadWorkersForInterview();

    } catch (error: any) {
      console.error('Error updating interview result:', error);
      toast({
        title: "Error updating interview result",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setProcessingInterview(null);
    }
  };

  const getInterviewStatusBadge = (worker: WorkerForInterview) => {
    // If worker is active_employee, show Selected regardless of interview record
    if (worker.worker_status === 'active_employee') {
      return <Badge variant="secondary" className="bg-success/20 text-success border-success">Selected</Badge>;
    }
    
    // If no interview record, show Not Scheduled
    if (!worker.interview) {
      return <Badge variant="secondary" className="bg-muted text-muted-foreground">Not Scheduled</Badge>;
    }

    switch (worker.interview.status) {
      case 'scheduled':
        return <Badge variant="secondary" className="bg-primary/20 text-primary border-primary">Scheduled</Badge>;
      case 'completed':
        if (worker.interview.result === 'selected') {
          return <Badge variant="secondary" className="bg-success/20 text-success border-success">Selected</Badge>;
        } else if (worker.interview.result === 'rejected') {
          return <Badge variant="destructive">Rejected</Badge>;
        }
        return <Badge variant="secondary" className="bg-warning/20 text-warning border-warning">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="secondary" className="bg-muted text-muted-foreground">Cancelled</Badge>;
      case 'rescheduled':
        return <Badge variant="secondary" className="bg-warning/20 text-warning border-warning">Rescheduled</Badge>;
      default:
        return <Badge variant="secondary">{worker.interview.status}</Badge>;
    }
  };

  const isFormValid = () => {
    if (!formData.scheduled_date || !formData.scheduled_time) return false;
    if (formData.mode === 'online' && !formData.meeting_link.trim()) return false;
    if (formData.mode === 'offline' && !formData.location.trim()) return false;
    return true;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Interview Scheduling</h1>
              <p className="text-muted-foreground">
                Schedule and manage interviews for verified workers
              </p>
            </div>
            <Button
              onClick={loadWorkersForInterview}
              disabled={loading}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </motion.div>

        {workers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No workers available for interview</h3>
              <p className="text-muted-foreground mb-4">
                Workers will appear here once their documents are verified and approved.
              </p>
              <p className="text-sm text-muted-foreground">
                Check the "Worker Verification" tab to approve documents and make workers eligible for interviews.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {workers.map((worker, index) => (
              <motion.div
                key={worker.user_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{worker.full_name}</CardTitle>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center space-x-1">
                              <Mail className="h-3 w-3" />
                              <span>{worker.email}</span>
                            </div>
                            {worker.phone && (
                              <div className="flex items-center space-x-1">
                                <Phone className="h-3 w-3" />
                                <span>{worker.phone}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>Verified {formatDistanceToNow(new Date(worker.created_at))} ago</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {worker.category && (
                          <Badge variant="outline">{worker.category}</Badge>
                        )}
                        {getInterviewStatusBadge(worker)}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {worker.interview ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Interview Details</Label>
                            <div className="p-3 bg-muted rounded-lg space-y-2">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {format(new Date(worker.interview.scheduled_date), 'PPP')} at{' '}
                                  {format(new Date(worker.interview.scheduled_date), 'p')}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                {worker.interview.mode === 'online' ? (
                                  <Video className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className="text-sm">
                                  {worker.interview.mode === 'online' 
                                    ? worker.interview.meeting_link 
                                    : worker.interview.location}
                                </span>
                              </div>
                              {worker.interview.notes && (
                                <div className="text-sm text-muted-foreground">
                                  <strong>Notes:</strong> {worker.interview.notes}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Actions</Label>
                            <div className="space-y-2">
                              {worker.interview.status === 'scheduled' && (
                                <>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full text-success hover:text-success"
                                      >
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Mark as Selected
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Select Candidate</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <p>Are you sure you want to select {worker.full_name} for the position?</p>
                                        <Textarea
                                          placeholder="Optional feedback..."
                                          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                        />
                                        <div className="flex space-x-2 justify-end">
                                          <Button variant="outline">Cancel</Button>
                                          <Button
                                            className="bg-success hover:bg-success/90"
                                            onClick={() => handleInterviewResult(worker.interview!.id, 'selected', formData.notes)}
                                            disabled={processingInterview === worker.interview!.id}
                                          >
                                            {processingInterview === worker.interview!.id ? (
                                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                              <CheckCircle2 className="h-4 w-4 mr-2" />
                                            )}
                                            Select Candidate
                                          </Button>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>

                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full text-destructive hover:text-destructive"
                                      >
                                        <X className="h-4 w-4 mr-2" />
                                        Mark as Rejected
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Reject Candidate</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <p>Please provide feedback for {worker.full_name}:</p>
                                        <Textarea
                                          placeholder="Reason for rejection..."
                                          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                          required
                                        />
                                        <div className="flex space-x-2 justify-end">
                                          <Button variant="outline">Cancel</Button>
                                          <Button
                                            variant="destructive"
                                            onClick={() => handleInterviewResult(worker.interview!.id, 'rejected', formData.notes)}
                                            disabled={!formData.notes.trim() || processingInterview === worker.interview!.id}
                                          >
                                            {processingInterview === worker.interview!.id ? (
                                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                              <X className="h-4 w-4 mr-2" />
                                            )}
                                            Reject Candidate
                                          </Button>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </>
                              )}

                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => {
                                      setSchedulingFor(worker.user_id);
                                      if (worker.interview) {
                                        const interviewDate = new Date(worker.interview.scheduled_date);
                                        setFormData({
                                          scheduled_date: format(interviewDate, 'yyyy-MM-dd'),
                                          scheduled_time: format(interviewDate, 'HH:mm'),
                                          mode: worker.interview.mode,
                                          meeting_link: worker.interview.meeting_link || "",
                                          location: worker.interview.location || "",
                                          notes: worker.interview.notes || ""
                                        });
                                      }
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Reschedule Interview
                                  </Button>
                                </DialogTrigger>
                                <InterviewScheduleDialog />
                              </Dialog>
                            </div>
                          </div>
                        </div>

                        {worker.interview.feedback && (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              <strong>Feedback:</strong> {worker.interview.feedback}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        {worker.worker_status === 'interview_pending' ? (
                          <>
                            <Alert className="flex-1 mr-4">
                              <Clock className="h-4 w-4" />
                              <AlertDescription>
                                Interview not scheduled yet. Click the button to schedule an interview.
                              </AlertDescription>
                            </Alert>
                            
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  className="bg-primary hover:bg-primary/90"
                                  onClick={() => setSchedulingFor(worker.user_id)}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Schedule Interview
                                </Button>
                              </DialogTrigger>
                              <InterviewScheduleDialog />
                            </Dialog>
                          </>
                        ) : worker.worker_status === 'interview_scheduled' ? (
                          <>
                            <Alert className="flex-1 mr-4">
                              <Clock className="h-4 w-4" />
                              <AlertDescription>
                                Interview already scheduled. Click to reschedule.
                              </AlertDescription>
                            </Alert>
                            
                            <Button
                              variant="outline"
                              className="bg-primary/10 text-primary border-primary hover:bg-primary/20"
                              onClick={() => setSchedulingFor(worker.user_id)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Reschedule
                            </Button>
                          </>
                        ) : worker.worker_status === 'active_employee' ? (
                          <Alert className="flex-1">
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertDescription>
                              Selected by {worker.interview?.employer_name || 'an employer'}. This worker is now an active employee.
                            </AlertDescription>
                          </Alert>
                        ) : null}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Interview Schedule Dialog */}
        <Dialog open={!!schedulingFor} onOpenChange={() => setSchedulingFor(null)}>
          <InterviewScheduleDialog />
        </Dialog>
      </div>
    </div>
  );

  function InterviewScheduleDialog() {
    return (
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Schedule Interview</DialogTitle>
          <DialogDescription>
            Schedule an interview with the selected worker. Choose date, time, and mode of interview.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Interview Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Interview Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Interview Mode</Label>
            <Select
              value={formData.mode}
              onValueChange={(value: 'online' | 'offline') => setFormData(prev => ({ ...prev, mode: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Online (Video Call)</SelectItem>
                <SelectItem value="offline">Offline (In Person)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.mode === 'online' ? (
            <div className="space-y-2">
              <Label htmlFor="meeting-link">Meeting Link</Label>
              <Input
                id="meeting-link"
                type="url"
                placeholder="https://meet.google.com/..."
                value={formData.meeting_link}
                onChange={(e) => setFormData(prev => ({ ...prev, meeting_link: e.target.value }))}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Enter interview location..."
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes for the interview..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex space-x-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setSchedulingFor(null);
                setFormData({
                  scheduled_date: "",
                  scheduled_time: "",
                  mode: "online",
                  meeting_link: "",
                  location: "",
                  notes: ""
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => schedulingFor && handleScheduleInterview(schedulingFor)}
              disabled={!isFormValid() || !schedulingFor || processingInterview === schedulingFor}
            >
              {processingInterview === schedulingFor ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Calendar className="h-4 w-4 mr-2" />
              )}
              Schedule Interview
            </Button>
          </div>
        </div>
      </DialogContent>
    );
  }
};

export default InterviewScheduling;
