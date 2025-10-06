import { supabase } from "@/integrations/supabase/client";

export type WorkerStatus = 
  | 'document_upload_pending'
  | 'verification_pending'
  | 'interview_pending'
  | 'interview_scheduled'
  | 'active_employee'
  | 'rejected';

export interface WorkerStatusInfo {
  status: WorkerStatus;
  title: string;
  description: string;
  canAccessJobs: boolean;
  canSubmitTasks: boolean;
  nextSteps: string[];
}

export const getWorkerStatusInfo = (status: WorkerStatus): WorkerStatusInfo => {
  switch (status) {
    case 'document_upload_pending':
      return {
        status,
        title: 'Document Upload Required',
        description: 'Please upload all required documents to continue your registration',
        canAccessJobs: false,
        canSubmitTasks: false,
        nextSteps: [
          'Upload 10th certificate',
          'Upload 12th certificate', 
          'Upload graduation certificate',
          'Upload resume/CV',
          'Upload KYC/Government ID'
        ]
      };

    case 'verification_pending':
      return {
        status,
        title: 'Document Verification in Progress',
        description: 'Your documents are being reviewed by our verification team',
        canAccessJobs: false,
        canSubmitTasks: false,
        nextSteps: [
          'Wait for document verification',
          'Check for any rejection notifications',
          'Re-upload rejected documents if needed'
        ]
      };

    case 'interview_pending':
      return {
        status,
        title: 'Interview Scheduling',
        description: 'Your documents are approved. An interview will be scheduled soon',
        canAccessJobs: true,
        canSubmitTasks: false,
        nextSteps: [
          'Browse available jobs',
          'Wait for interview scheduling',
          'Prepare for the interview',
          'Check your email for interview details'
        ]
      };

    case 'interview_scheduled':
      return {
        status,
        title: 'Interview Scheduled',
        description: 'Your interview has been scheduled. You can browse jobs while waiting for your interview',
        canAccessJobs: true,
        canSubmitTasks: false,
        nextSteps: [
          'Browse available jobs',
          'Prepare for your scheduled interview',
          'Check your email for interview details'
        ]
      };

    case 'active_employee':
      return {
        status,
        title: 'Active Employee',
        description: 'Congratulations! You can now access and work on tasks',
        canAccessJobs: true,
        canSubmitTasks: true,
        nextSteps: [
          'Browse available jobs',
          'Start working on tasks',
          'Build your rating and reputation'
        ]
      };

    case 'rejected':
      return {
        status,
        title: 'Application Rejected',
        description: 'Unfortunately, your application was not approved',
        canAccessJobs: false,
        canSubmitTasks: false,
        nextSteps: [
          'Review rejection feedback',
          'Consider reapplying after addressing issues'
        ]
      };

    default:
      return {
        status: 'document_upload_pending',
        title: 'Getting Started',
        description: 'Complete your onboarding process',
        canAccessJobs: false,
        canSubmitTasks: false,
        nextSteps: ['Upload required documents']
      };
  }
};

/**
 * Check if worker can access jobs based on their status
 */
export const canWorkerAccessJobs = (workerStatus?: string | null): boolean => {
  return ['interview_pending', 'interview_scheduled', 'active_employee'].includes(workerStatus || '');
};

/**
 * Check if worker can submit tasks based on their status
 */
export const canWorkerSubmitTasks = (workerStatus?: string | null): boolean => {
  return workerStatus === 'active_employee';
};

/**
 * Update worker status manually (for admin/employer actions)
 */
export const updateWorkerStatus = async (workerId: string, newStatus: WorkerStatus, notes?: string) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        worker_status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', workerId);

    if (error) throw error;

    // Log the status change for audit purposes
    const { error: logError } = await supabase
      .from('worker_status_logs')
      .insert({
        worker_id: workerId,
        old_status: null, // We could fetch this if needed
        new_status: newStatus,
        notes: notes || null,
        changed_by: (await supabase.auth.getUser()).data.user?.id || null,
        created_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Error logging status change:', logError);
      // Don't throw here as the main operation succeeded
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating worker status:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get worker's current onboarding progress
 */
export const getWorkerOnboardingProgress = async (workerId: string) => {
  try {
    // Get worker profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('worker_status, created_at')
      .eq('user_id', workerId)
      .single();

    if (profileError) throw profileError;

    // Get document status
    const { data: documents, error: documentsError } = await supabase
      .from('worker_documents')
      .select('document_type, verification_status')
      .eq('worker_id', workerId);

    if (documentsError) throw documentsError;

    // Get interview status
    const { data: interview, error: interviewError } = await supabase
      .from('worker_interviews')
      .select('status, result, scheduled_date')
      .eq('worker_id', workerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Interview error is expected if no interview exists
    const interviewData = interviewError ? null : interview;

    const requiredDocuments = ['10th_certificate', '12th_certificate', 'graduation_certificate', 'resume', 'kyc_document'];
    
    const documentStats = {
      total: requiredDocuments.length,
      uploaded: requiredDocuments.filter(type => 
        documents.some(doc => doc.document_type === type)
      ).length,
      approved: requiredDocuments.filter(type => 
        documents.some(doc => doc.document_type === type && doc.verification_status === 'approved')
      ).length,
      rejected: documents.filter(doc => doc.verification_status === 'rejected').length
    };

    const statusInfo = getWorkerStatusInfo(profile.worker_status as WorkerStatus);

    return {
      success: true,
      data: {
        status: profile.worker_status,
        statusInfo,
        documentStats,
        interview: interviewData,
        registrationDate: profile.created_at
      }
    };

  } catch (error: any) {
    console.error('Error getting worker onboarding progress:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if all required documents are uploaded and approved
 */
export const areAllDocumentsApproved = async (workerId: string): Promise<boolean> => {
  try {
    const { data: documents, error } = await supabase
      .from('worker_documents')
      .select('document_type, verification_status')
      .eq('worker_id', workerId)
      .eq('verification_status', 'approved');

    if (error) throw error;

    const requiredDocuments = ['10th_certificate', '12th_certificate', 'graduation_certificate', 'resume', 'kyc_document'];
    const approvedTypes = documents.map(doc => doc.document_type);
    
    return requiredDocuments.every(type => approvedTypes.includes(type));
  } catch (error) {
    console.error('Error checking document approval status:', error);
    return false;
  }
};

/**
 * Manually trigger status update based on current state
 * This can be used to fix any inconsistencies
 */
export const recalculateWorkerStatus = async (workerId: string) => {
  try {
    const progress = await getWorkerOnboardingProgress(workerId);
    
    if (!progress.success || !progress.data) {
      return { success: false, error: 'Failed to get worker progress' };
    }

    const { documentStats, interview } = progress.data;
    let newStatus: WorkerStatus = 'document_upload_pending';

    // Determine correct status based on current state
    if (documentStats.uploaded < documentStats.total) {
      newStatus = 'document_upload_pending';
    } else if (documentStats.approved < documentStats.total && documentStats.rejected === 0) {
      newStatus = 'verification_pending';
    } else if (documentStats.rejected > 0) {
      newStatus = 'verification_pending'; // Stay in verification pending until re-upload
    } else if (documentStats.approved === documentStats.total) {
      if (!interview) {
        newStatus = 'interview_pending';
      } else if (interview.result === 'selected') {
        newStatus = 'active_employee';
      } else if (interview.result === 'rejected') {
        newStatus = 'rejected';
      } else {
        newStatus = 'interview_pending';
      }
    }

    // Update status if it's different from current
    if (newStatus !== progress.data.status) {
      return await updateWorkerStatus(workerId, newStatus, 'Status recalculated automatically');
    }

    return { success: true, message: 'Status is already correct' };

  } catch (error: any) {
    console.error('Error recalculating worker status:', error);
    return { success: false, error: error.message };
  }
};
