import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface WorkerInterview {
  id: string;
  worker_id: string;
  employer_id: string;
  scheduled_date: string;
  mode: 'online' | 'offline';
  meeting_link?: string;
  location?: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  result?: 'selected' | 'rejected' | 'pending';
  feedback?: string;
  created_at: string;
  updated_at: string;
  employer_name?: string;
}

export interface InterviewSchedulingData {
  worker_id: string;
  scheduled_date: string;
  mode: 'online' | 'offline';
  meeting_link?: string;
  location?: string;
  notes?: string;
}

export const useWorkerInterview = (workerId?: string) => {
  const [interview, setInterview] = useState<WorkerInterview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchInterview = async () => {
    if (!workerId && !user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // First, get the interview data
      const { data, error: fetchError } = await supabase
        .from('worker_interviews')
        .select('*')
        .eq('worker_id', workerId || user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // Process the data to include employer name
      let employerName = 'Unknown Employer';
      if (data) {
        // Fetch employer name separately
        const { data: employerData, error: employerError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', data.employer_id)
          .single();
        
        if (employerData && !employerError) {
          employerName = employerData.full_name;
        }
      }

      const processedData = data ? {
        ...data,
        employer_name: employerName
      } : null;

      console.log('Worker interview data:', {
        data,
        employerName,
        employer_id: data?.employer_id,
        processedData
      });

      setInterview(processedData);
    } catch (err: any) {
      console.error('Error fetching worker interview:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const scheduleInterview = async (interviewData: InterviewSchedulingData) => {
    try {
      const { data, error } = await supabase
        .from('worker_interviews')
        .insert([interviewData])
        .select()
        .single();

      if (error) throw error;

      // Update worker status to interview_scheduled
      const { error: statusError } = await supabase
        .from('profiles')
        .update({ 
          worker_status: 'interview_scheduled',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', interviewData.worker_id);

      if (statusError) {
        console.error('Error updating worker status:', statusError);
      }

      setInterview(data);
      return data;
    } catch (err: any) {
      console.error('Error scheduling interview:', err);
      setError(err.message);
      throw err;
    }
  };

  const updateInterviewStatus = async (
    interviewId: string,
    status: 'completed' | 'cancelled' | 'rescheduled',
    result?: 'selected' | 'rejected' | 'pending',
    feedback?: string
  ) => {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (result) updateData.result = result;
      if (feedback) updateData.feedback = feedback;

      const { error } = await supabase
        .from('worker_interviews')
        .update(updateData)
        .eq('id', interviewId);

      if (error) throw error;

      // If interview is completed and worker is selected, update worker status
      if (status === 'completed' && result === 'selected') {
        const { error: statusError } = await supabase
          .from('profiles')
          .update({ 
            worker_status: 'active_employee',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', interview?.worker_id);

        if (statusError) {
          console.error('Error updating worker status to active:', statusError);
        }
      }

      // Refresh interview data
      await fetchInterview();
    } catch (err: any) {
      console.error('Error updating interview status:', err);
      setError(err.message);
    }
  };

  const getTimeUntilInterview = () => {
    if (!interview || interview.status !== 'scheduled') return null;

    const now = new Date();
    const interviewDate = new Date(interview.scheduled_date);
    const diff = interviewDate.getTime() - now.getTime();

    if (diff <= 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes, total: diff };
  };

  const isInterviewScheduled = () => {
    return interview && interview.status === 'scheduled';
  };

  const isInterviewCompleted = () => {
    return interview && interview.status === 'completed';
  };

  const getInterviewResult = () => {
    return interview?.result || null;
  };

  useEffect(() => {
    fetchInterview();
  }, [workerId, user?.id]);

  // Set up realtime subscription
  useEffect(() => {
    if (!workerId && !user?.id) return;

    const channel = supabase
      .channel('worker_interviews_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'worker_interviews',
          filter: `worker_id=eq.${workerId || user?.id}`
        },
        (payload) => {
          console.log('Interview change received:', payload);
          fetchInterview();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workerId, user?.id]);

  return {
    interview,
    loading,
    error,
    fetchInterview,
    scheduleInterview,
    updateInterviewStatus,
    getTimeUntilInterview,
    isInterviewScheduled,
    isInterviewCompleted,
    getInterviewResult
  };
};

