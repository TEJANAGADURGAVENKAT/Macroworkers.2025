import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface WorkerDocument {
  id: string;
  worker_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  verification_notes?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

export const useWorkerDocuments = (workerId?: string) => {
  const [documents, setDocuments] = useState<WorkerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchDocuments = async () => {
    if (!workerId && !user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('worker_documents')
        .select('*')
        .eq('worker_id', workerId || user?.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setDocuments(data || []);
    } catch (err: any) {
      console.error('Error fetching worker documents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateDocumentStatus = async (
    documentId: string,
    status: 'approved' | 'rejected',
    notes?: string
  ) => {
    try {
      const { error } = await supabase
        .from('worker_documents')
        .update({
          verification_status: status,
          verification_notes: notes,
          verified_by: user?.id,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (error) throw error;

      // Refresh documents
      await fetchDocuments();
    } catch (err: any) {
      console.error('Error updating document status:', err);
      setError(err.message);
    }
  };

  const getDocumentStatus = (documentType: string) => {
    const doc = documents.find(d => d.document_type === documentType);
    return doc?.verification_status || null;
  };

  const areAllDocumentsApproved = () => {
    const requiredTypes = ['10th_certificate', '12th_certificate', 'graduation_certificate', 'resume', 'kyc_document'];
    return requiredTypes.every(type => getDocumentStatus(type) === 'approved');
  };

  const getApprovedDocumentsCount = () => {
    return documents.filter(doc => doc.verification_status === 'approved').length;
  };

  const getTotalDocumentsCount = () => {
    return documents.length;
  };

  useEffect(() => {
    fetchDocuments();
  }, [workerId, user?.id]);

  // Set up realtime subscription
  useEffect(() => {
    if (!workerId && !user?.id) return;

    const channel = supabase
      .channel('worker_documents_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'worker_documents',
          filter: `worker_id=eq.${workerId || user?.id}`
        },
        (payload) => {
          console.log('Document change received:', payload);
          fetchDocuments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workerId, user?.id]);

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    updateDocumentStatus,
    getDocumentStatus,
    areAllDocumentsApproved,
    getApprovedDocumentsCount,
    getTotalDocumentsCount
  };
};

