import { supabase } from '@/integrations/supabase/client';

// Types for the API responses
export interface EmployeeRating {
  id: string;
  full_name: string;
  email: string;
  rating: number;
  designation: 'L1' | 'L2' | 'L3';
  total_tasks_completed: number;
  total_earnings: number;
  last_rating_update: string;
  approved_ratings_count: number;
  total_submissions_count: number;
  rating_history: RatingHistoryItem[];
}

export interface RatingHistoryItem {
  id: string;
  task_id: string;
  task_title: string;
  task_budget: number;
  employer_rating_given: number | null;
  rating_feedback: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'assigned';
  submitted_at: string;
  reviewed_at: string | null;
  is_counted_in_average: boolean; // true for approved, false for rejected/pending
}

export interface EmployeeRatingSummary {
  average_rating: number;
  designation: 'L1' | 'L2' | 'L3';
  total_ratings: number;
  approved_ratings_count: number;
  rejected_ratings_count: number;
  pending_ratings_count: number;
  rating_history: RatingHistoryItem[];
}

// Helper function to determine designation based on rating
export const getDesignationFromRating = (rating: number): 'L1' | 'L2' | 'L3' => {
  if (rating < 3.0) return 'L1';
  if (rating >= 3.0 && rating < 4.0) return 'L2';
  return 'L3';
};

// Helper function to get designation color
export const getDesignationColor = (designation: string): string => {
  switch (designation) {
    case 'L1': return 'text-red-600 bg-red-50 border-red-200';
    case 'L2': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'L3': return 'text-green-600 bg-green-50 border-green-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

// Helper function to get designation label
export const getDesignationLabel = (designation: string): string => {
  switch (designation) {
    case 'L1': return 'Beginner';
    case 'L2': return 'Intermediate';
    case 'L3': return 'Expert';
    default: return 'Unknown';
  }
};

/**
 * Get comprehensive rating data for a specific employee
 */
export const getEmployeeRating = async (employeeId: string): Promise<EmployeeRating | null> => {
  try {
    // Get employee profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        user_id,
        full_name,
        email,
        rating,
        designation,
        total_tasks_completed,
        total_earnings,
        last_rating_update
      `)
      .eq('user_id', employeeId)
      .eq('role', 'worker')
      .single();

    if (profileError) {
      console.error('Error fetching employee profile:', profileError);
      return null;
    }

    if (!profileData) {
      return null;
    }

    // Get rating history with task details
    const { data: ratingHistoryData, error: historyError } = await supabase
      .from('task_submissions')
      .select(`
        id,
        task_id,
        employer_rating_given,
        rating_feedback,
        status,
        submitted_at,
        reviewed_at,
        task:tasks(
          id,
          title,
          budget
        )
      `)
      .eq('worker_id', employeeId)
      .order('submitted_at', { ascending: false });

    if (historyError) {
      console.error('Error fetching rating history:', historyError);
      return null;
    }

    // Process rating history
    const ratingHistory: RatingHistoryItem[] = (ratingHistoryData || []).map(item => ({
      id: item.id,
      task_id: item.task_id,
      task_title: item.task?.title || 'Unknown Task',
      task_budget: item.task?.budget || 0,
      employer_rating_given: item.employer_rating_given,
      rating_feedback: item.rating_feedback,
      status: item.status,
      submitted_at: item.submitted_at,
      reviewed_at: item.reviewed_at,
      is_counted_in_average: item.status === 'approved' && item.employer_rating_given !== null
    }));

    // Calculate statistics
    const approvedRatings = ratingHistory.filter(item => item.is_counted_in_average);
    const approvedRatingsCount = approvedRatings.length;
    const totalSubmissionsCount = ratingHistory.length;

    return {
      id: profileData.id,
      full_name: profileData.full_name,
      email: profileData.email,
      rating: profileData.rating || 1.0,
      designation: profileData.designation || 'L1',
      total_tasks_completed: profileData.total_tasks_completed || 0,
      total_earnings: profileData.total_earnings || 0,
      last_rating_update: profileData.last_rating_update,
      approved_ratings_count: approvedRatingsCount,
      total_submissions_count: totalSubmissionsCount,
      rating_history: ratingHistory
    };

  } catch (error) {
    console.error('Error in getEmployeeRating:', error);
    return null;
  }
};

/**
 * Get rating summary for a specific employee (lighter version)
 */
export const getEmployeeRatingSummary = async (employeeId: string): Promise<EmployeeRatingSummary | null> => {
  try {
    // Get rating history with task details
    const { data: ratingHistoryData, error: historyError } = await supabase
      .from('task_submissions')
      .select(`
        id,
        task_id,
        employer_rating_given,
        rating_feedback,
        status,
        submitted_at,
        reviewed_at,
        task:tasks(
          id,
          title,
          budget
        )
      `)
      .eq('worker_id', employeeId)
      .order('submitted_at', { ascending: false });

    if (historyError) {
      console.error('Error fetching rating history:', historyError);
      return null;
    }

    // Process rating history
    const ratingHistory: RatingHistoryItem[] = (ratingHistoryData || []).map(item => ({
      id: item.id,
      task_id: item.task_id,
      task_title: item.task?.title || 'Unknown Task',
      task_budget: item.task?.budget || 0,
      employer_rating_given: item.employer_rating_given,
      rating_feedback: item.rating_feedback,
      status: item.status,
      submitted_at: item.submitted_at,
      reviewed_at: item.reviewed_at,
      is_counted_in_average: item.status === 'approved' && item.employer_rating_given !== null
    }));

    // Calculate statistics
    const approvedRatings = ratingHistory.filter(item => item.is_counted_in_average);
    const rejectedRatings = ratingHistory.filter(item => item.status === 'rejected');
    const pendingRatings = ratingHistory.filter(item => item.status === 'pending');

    const approvedRatingsCount = approvedRatings.length;
    const rejectedRatingsCount = rejectedRatings.length;
    const pendingRatingsCount = pendingRatings.length;

    // Calculate average rating from approved submissions only
    const averageRating = approvedRatingsCount > 0 
      ? approvedRatings.reduce((sum, item) => sum + (item.employer_rating_given || 0), 0) / approvedRatingsCount
      : 1.0; // Default to 1.0 if no approved ratings

    const designation = getDesignationFromRating(averageRating);

    return {
      average_rating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
      designation,
      total_ratings: approvedRatingsCount,
      approved_ratings_count: approvedRatingsCount,
      rejected_ratings_count: rejectedRatingsCount,
      pending_ratings_count: pendingRatingsCount,
      rating_history: ratingHistory
    };

  } catch (error) {
    console.error('Error in getEmployeeRatingSummary:', error);
    return null;
  }
};

/**
 * Get all employees with their rating data
 */
export const getAllEmployeeRatings = async (): Promise<EmployeeRating[]> => {
  try {
    // Get all worker profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        user_id,
        full_name,
        email,
        rating,
        designation,
        total_tasks_completed,
        total_earnings,
        last_rating_update
      `)
      .eq('role', 'worker')
      .order('rating', { ascending: false });

    if (profilesError) {
      console.error('Error fetching worker profiles:', profilesError);
      return [];
    }

    if (!profilesData || profilesData.length === 0) {
      return [];
    }

    // Get rating history for all workers
    const { data: ratingHistoryData, error: historyError } = await supabase
      .from('task_submissions')
      .select(`
        id,
        worker_id,
        task_id,
        employer_rating_given,
        rating_feedback,
        status,
        submitted_at,
        reviewed_at,
        task:tasks(
          id,
          title,
          budget
        )
      `)
      .in('worker_id', profilesData.map(p => p.user_id))
      .order('submitted_at', { ascending: false });

    if (historyError) {
      console.error('Error fetching rating history:', historyError);
      return [];
    }

    // Group rating history by worker
    const ratingHistoryByWorker = (ratingHistoryData || []).reduce((acc, item) => {
      if (!acc[item.worker_id]) {
        acc[item.worker_id] = [];
      }
      acc[item.worker_id].push({
        id: item.id,
        task_id: item.task_id,
        task_title: item.task?.title || 'Unknown Task',
        task_budget: item.task?.budget || 0,
        employer_rating_given: item.employer_rating_given,
        rating_feedback: item.rating_feedback,
        status: item.status,
        submitted_at: item.submitted_at,
        reviewed_at: item.reviewed_at,
        is_counted_in_average: item.status === 'approved' && item.employer_rating_given !== null
      });
      return acc;
    }, {} as Record<string, RatingHistoryItem[]>);

    // Build employee rating objects
    const employeeRatings: EmployeeRating[] = profilesData.map(profile => {
      const ratingHistory = ratingHistoryByWorker[profile.user_id] || [];
      const approvedRatings = ratingHistory.filter(item => item.is_counted_in_average);
      const approvedRatingsCount = approvedRatings.length;
      const totalSubmissionsCount = ratingHistory.length;

      return {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        rating: profile.rating || 1.0,
        designation: profile.designation || 'L1',
        total_tasks_completed: profile.total_tasks_completed || 0,
        total_earnings: profile.total_earnings || 0,
        last_rating_update: profile.last_rating_update,
        approved_ratings_count: approvedRatingsCount,
        total_submissions_count: totalSubmissionsCount,
        rating_history: ratingHistory
      };
    });

    return employeeRatings;

  } catch (error) {
    console.error('Error in getAllEmployeeRatings:', error);
    return [];
  }
};

/**
 * Update employee rating (for employers to rate workers)
 */
export const updateEmployeeRating = async (
  submissionId: string,
  rating: number,
  feedback?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Validate rating
    if (rating < 1 || rating > 5) {
      return { success: false, error: 'Rating must be between 1 and 5' };
    }

    // Get the submission to check its status
    const { data: submissionData, error: submissionError } = await supabase
      .from('task_submissions')
      .select('id, status, worker_id')
      .eq('id', submissionId)
      .single();

    if (submissionError || !submissionData) {
      return { success: false, error: 'Submission not found' };
    }

    // Only allow rating approved submissions
    if (submissionData.status !== 'approved') {
      return { success: false, error: 'Can only rate approved submissions' };
    }

    // Update the submission with the rating
    const { error: updateError } = await supabase
      .from('task_submissions')
      .update({
        employer_rating_given: rating,
        rating_feedback: feedback || null,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', submissionId);

    if (updateError) {
      console.error('Error updating submission rating:', updateError);
      return { success: false, error: 'Failed to update rating' };
    }

    // The database trigger will automatically update the worker's average rating
    return { success: true };

  } catch (error) {
    console.error('Error in updateEmployeeRating:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Get rating statistics for dashboard
 */
export const getRatingStatistics = async (): Promise<{
  total_workers: number;
  average_rating: number;
  designation_distribution: Record<string, number>;
  top_performers: EmployeeRating[];
  recent_ratings: RatingHistoryItem[];
}> => {
  try {
    const employeeRatings = await getAllEmployeeRatings();
    
    if (employeeRatings.length === 0) {
      return {
        total_workers: 0,
        average_rating: 0,
        designation_distribution: { L1: 0, L2: 0, L3: 0 },
        top_performers: [],
        recent_ratings: []
      };
    }

    // Calculate statistics
    const totalWorkers = employeeRatings.length;
    const averageRating = employeeRatings.reduce((sum, emp) => sum + emp.rating, 0) / totalWorkers;
    
    const designationDistribution = employeeRatings.reduce((acc, emp) => {
      acc[emp.designation] = (acc[emp.designation] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topPerformers = employeeRatings
      .filter(emp => emp.approved_ratings_count > 0)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);

    // Get recent ratings from all workers
    const allRecentRatings = employeeRatings
      .flatMap(emp => emp.rating_history)
      .filter(item => item.employer_rating_given !== null)
      .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
      .slice(0, 10);

    return {
      total_workers: totalWorkers,
      average_rating: Math.round(averageRating * 100) / 100,
      designation_distribution: designationDistribution,
      top_performers: topPerformers,
      recent_ratings: allRecentRatings
    };

  } catch (error) {
    console.error('Error in getRatingStatistics:', error);
    return {
      total_workers: 0,
      average_rating: 0,
      designation_distribution: { L1: 0, L2: 0, L3: 0 },
      top_performers: [],
      recent_ratings: []
    };
  }
};


