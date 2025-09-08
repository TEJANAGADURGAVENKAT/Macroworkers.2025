// Test script for Employee Ratings API
// This file demonstrates how to use the new API functions

import { 
  getEmployeeRating, 
  getEmployeeRatingSummary, 
  getAllEmployeeRatings,
  updateEmployeeRating,
  getRatingStatistics,
  getDesignationFromRating,
  getDesignationColor,
  getDesignationLabel
} from './src/lib/employee-ratings-api';

// Example usage functions (these would be called from your components)

export const testEmployeeRatingAPI = async () => {
  console.log('🧪 Testing Employee Ratings API...\n');

  // Test 1: Get rating statistics
  console.log('📊 Getting rating statistics...');
  const stats = await getRatingStatistics();
  console.log('Statistics:', {
    totalWorkers: stats.total_workers,
    averageRating: stats.average_rating,
    designationDistribution: stats.designation_distribution,
    topPerformers: stats.top_performers.map(p => ({
      name: p.full_name,
      rating: p.rating,
      designation: p.designation
    }))
  });

  // Test 2: Get all employee ratings
  console.log('\n👥 Getting all employee ratings...');
  const allEmployees = await getAllEmployeeRatings();
  console.log(`Found ${allEmployees.length} employees:`);
  allEmployees.forEach(emp => {
    console.log(`- ${emp.full_name}: ${emp.rating} (${emp.designation}) - ${emp.approved_ratings_count} approved ratings`);
  });

  // Test 3: Get specific employee rating (if any employees exist)
  if (allEmployees.length > 0) {
    const firstEmployee = allEmployees[0];
    console.log(`\n👤 Getting detailed rating for ${firstEmployee.full_name}...`);
    
    const employeeDetail = await getEmployeeRating(firstEmployee.id);
    if (employeeDetail) {
      console.log('Employee Details:', {
        name: employeeDetail.full_name,
        email: employeeDetail.email,
        rating: employeeDetail.rating,
        designation: employeeDetail.designation,
        totalTasks: employeeDetail.total_tasks_completed,
        totalEarnings: employeeDetail.total_earnings,
        approvedRatings: employeeDetail.approved_ratings_count,
        totalSubmissions: employeeDetail.total_submissions_count,
        ratingHistory: employeeDetail.rating_history.map(h => ({
          task: h.task_title,
          rating: h.employer_rating_given,
          status: h.status,
          isCounted: h.is_counted_in_average
        }))
      });
    }

    // Test 4: Get rating summary for the same employee
    console.log(`\n📋 Getting rating summary for ${firstEmployee.full_name}...`);
    const summary = await getEmployeeRatingSummary(firstEmployee.id);
    if (summary) {
      console.log('Rating Summary:', {
        averageRating: summary.average_rating,
        designation: summary.designation,
        totalRatings: summary.total_ratings,
        approvedCount: summary.approved_ratings_count,
        rejectedCount: summary.rejected_ratings_count,
        pendingCount: summary.pending_ratings_count
      });
    }
  }

  // Test 5: Test helper functions
  console.log('\n🔧 Testing helper functions...');
  const testRatings = [1.5, 2.9, 3.0, 3.5, 4.0, 4.5, 5.0];
  testRatings.forEach(rating => {
    const designation = getDesignationFromRating(rating);
    const color = getDesignationColor(designation);
    const label = getDesignationLabel(designation);
    console.log(`Rating ${rating} → ${designation} (${label}) - Color: ${color}`);
  });

  console.log('\n✅ API testing completed!');
};

// Example of how to use the API in a React component
export const exampleUsageInComponent = () => {
  return `
// Example usage in a React component:

import { useState, useEffect } from 'react';
import { getEmployeeRatingSummary, updateEmployeeRating } from '@/lib/employee-ratings-api';

const WorkerRatingComponent = ({ workerId }) => {
  const [ratingData, setRatingData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRatingData = async () => {
      try {
        const summary = await getEmployeeRatingSummary(workerId);
        setRatingData(summary);
      } catch (error) {
        console.error('Error loading rating data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRatingData();
  }, [workerId]);

  const handleRatingUpdate = async (submissionId, rating, feedback) => {
    try {
      const result = await updateEmployeeRating(submissionId, rating, feedback);
      if (result.success) {
        // Reload data or update local state
        const updatedSummary = await getEmployeeRatingSummary(workerId);
        setRatingData(updatedSummary);
      } else {
        console.error('Rating update failed:', result.error);
      }
    } catch (error) {
      console.error('Error updating rating:', error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!ratingData) return <div>No rating data found</div>;

  return (
    <div>
      <h2>Employee Rating: {ratingData.average_rating}</h2>
      <p>Designation: {ratingData.designation}</p>
      <p>Approved Ratings: {ratingData.approved_ratings_count}</p>
      <p>Rejected Ratings: {ratingData.rejected_ratings_count}</p>
      
      <h3>Rating History:</h3>
      {ratingData.rating_history.map(item => (
        <div key={item.id}>
          <p>Task: {item.task_title}</p>
          <p>Rating: {item.employer_rating_given || 'Not rated'}</p>
          <p>Status: {item.status}</p>
          <p>Counted in Average: {item.is_counted_in_average ? 'Yes' : 'No'}</p>
        </div>
      ))}
    </div>
  );
};
  `;
};

// Export the test function for use
export default testEmployeeRatingAPI;



