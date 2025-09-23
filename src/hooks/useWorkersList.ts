import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface WorkerProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  worker_status: 'document_upload_pending' | 'verification_pending' | 'interview_pending' | 'interview_scheduled' | 'active_employee' | 'rejected';
  category?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkerWithDocuments extends WorkerProfile {
  documents: Array<{
    id: string;
    document_type: string;
    verification_status: 'pending' | 'approved' | 'rejected';
    verification_notes?: string;
    verified_at?: string;
  }>;
}

export const useWorkersList = () => {
  const [workers, setWorkers] = useState<WorkerWithDocuments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchWorkers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch workers with their documents
      const { data: workersData, error: workersError } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          full_name,
          email,
          phone,
          role,
          worker_status,
          category,
          created_at,
          updated_at
        `)
        .eq('role', 'worker')
        .in('worker_status', ['verification_pending', 'interview_pending', 'interview_scheduled', 'active_employee'])
        .order('created_at', { ascending: false });

      if (workersError) throw workersError;

      // Fetch documents for each worker
      const workersWithDocuments = await Promise.all(
        (workersData || []).map(async (worker) => {
          const { data: documentsData, error: documentsError } = await supabase
            .from('worker_documents')
            .select(`
              id,
              document_type,
              verification_status,
              verification_notes,
              verified_at
            `)
            .eq('worker_id', worker.user_id);

          if (documentsError) {
            console.error('Error fetching documents for worker:', worker.user_id, documentsError);
          }

          return {
            ...worker,
            documents: documentsData || []
          };
        })
      );

      setWorkers(workersWithDocuments);
    } catch (err: any) {
      console.error('Error fetching workers list:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getWorkerDocumentStatus = (worker: WorkerWithDocuments, documentType: string) => {
    const doc = worker.documents.find(d => d.document_type === documentType);
    return doc?.verification_status || null;
  };

  const areAllDocumentsApproved = (worker: WorkerWithDocuments) => {
    const requiredTypes = ['10th_certificate', '12th_certificate', 'graduation_certificate', 'resume', 'kyc_document'];
    return requiredTypes.every(type => getWorkerDocumentStatus(worker, type) === 'approved');
  };

  const getApprovedDocumentsCount = (worker: WorkerWithDocuments) => {
    return worker.documents.filter(doc => doc.verification_status === 'approved').length;
  };

  const getTotalDocumentsCount = (worker: WorkerWithDocuments) => {
    return worker.documents.length;
  };

  const canScheduleInterview = (worker: WorkerWithDocuments) => {
    return areAllDocumentsApproved(worker) && worker.worker_status === 'interview_pending';
  };

  const getWorkersByStatus = (status: string) => {
    return workers.filter(worker => worker.worker_status === status);
  };

  const getWorkersNeedingVerification = () => {
    return workers.filter(worker => 
      worker.worker_status === 'verification_pending' && 
      worker.documents.some(doc => doc.verification_status === 'pending')
    );
  };

  const getWorkersReadyForInterview = () => {
    return workers.filter(worker => canScheduleInterview(worker));
  };

  useEffect(() => {
    fetchWorkers();
  }, [user?.id]);

  // Set up realtime subscription for worker status changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('workers_list_changes')
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
          fetchWorkers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'worker_documents'
        },
        (payload) => {
          console.log('Worker document change received:', payload);
          fetchWorkers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    workers,
    loading,
    error,
    fetchWorkers,
    getWorkerDocumentStatus,
    areAllDocumentsApproved,
    getApprovedDocumentsCount,
    getTotalDocumentsCount,
    canScheduleInterview,
    getWorkersByStatus,
    getWorkersNeedingVerification,
    getWorkersReadyForInterview
  };
};

