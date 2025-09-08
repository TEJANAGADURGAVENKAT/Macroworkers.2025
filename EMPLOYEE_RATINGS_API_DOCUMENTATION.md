# Employee Ratings API Documentation

## Overview

The Employee Ratings API provides comprehensive functionality for managing and retrieving employee rating data. It implements the correct business logic where only approved submissions count towards average ratings, while rejected submissions are visible in history but excluded from calculations.

## Key Features

### ✅ **Correct Rating Logic**
- **Approved submissions only** count towards average rating
- **Rejected submissions** are visible in history but excluded from calculations
- **Individual ratings** for each employee (no more same ratings for everyone)
- **Proper designation levels** (L1, L2, L3) based on rating ranges

### ✅ **Comprehensive Data**
- **Rating history** with task details and status
- **Designation information** with color coding
- **Statistics and analytics** for dashboard views
- **Real-time updates** when ratings are submitted

## API Functions

### 1. `getEmployeeRating(employeeId: string)`

**Purpose**: Get comprehensive rating data for a specific employee

**Returns**: `EmployeeRating | null`

**Features**:
- Complete employee profile with rating information
- Full rating history with task details
- Statistics (approved vs total submissions)
- Proper designation calculation

**Example Usage**:
```typescript
import { getEmployeeRating } from '@/lib/employee-ratings-api';

const employeeData = await getEmployeeRating('user-uuid-here');
if (employeeData) {
  console.log(`Employee: ${employeeData.full_name}`);
  console.log(`Rating: ${employeeData.rating}`);
  console.log(`Designation: ${employeeData.designation}`);
  console.log(`Approved Ratings: ${employeeData.approved_ratings_count}`);
}
```

### 2. `getEmployeeRatingSummary(employeeId: string)`

**Purpose**: Get lighter rating summary for a specific employee

**Returns**: `EmployeeRatingSummary | null`

**Features**:
- Calculated average rating from approved submissions only
- Designation based on current rating
- Rating counts by status (approved, rejected, pending)
- Complete rating history

**Example Usage**:
```typescript
import { getEmployeeRatingSummary } from '@/lib/employee-ratings-api';

const summary = await getEmployeeRatingSummary('user-uuid-here');
if (summary) {
  console.log(`Average Rating: ${summary.average_rating}`);
  console.log(`Designation: ${summary.designation}`);
  console.log(`Total Approved: ${summary.approved_ratings_count}`);
  console.log(`Total Rejected: ${summary.rejected_ratings_count}`);
}
```

### 3. `getAllEmployeeRatings()`

**Purpose**: Get rating data for all employees

**Returns**: `EmployeeRating[]`

**Features**:
- All workers with their rating information
- Sorted by rating (highest first)
- Complete rating history for each employee
- Efficient batch processing

**Example Usage**:
```typescript
import { getAllEmployeeRatings } from '@/lib/employee-ratings-api';

const allEmployees = await getAllEmployeeRatings();
allEmployees.forEach(emp => {
  console.log(`${emp.full_name}: ${emp.rating} (${emp.designation})`);
});
```

### 4. `updateEmployeeRating(submissionId: string, rating: number, feedback?: string)`

**Purpose**: Update employee rating (for employers)

**Returns**: `{ success: boolean; error?: string }`

**Features**:
- Validates rating range (1-5)
- Only allows rating approved submissions
- Automatically triggers database updates
- Returns success/error status

**Example Usage**:
```typescript
import { updateEmployeeRating } from '@/lib/employee-ratings-api';

const result = await updateEmployeeRating(
  'submission-uuid-here',
  4.5,
  'Great work on this task!'
);

if (result.success) {
  console.log('Rating updated successfully');
} else {
  console.error('Error:', result.error);
}
```

### 5. `getRatingStatistics()`

**Purpose**: Get overall rating statistics for dashboard

**Returns**: Rating statistics object

**Features**:
- Total workers count
- Average rating across all workers
- Designation distribution (L1, L2, L3 counts)
- Top performers list
- Recent ratings activity

**Example Usage**:
```typescript
import { getRatingStatistics } from '@/lib/employee-ratings-api';

const stats = await getRatingStatistics();
console.log(`Total Workers: ${stats.total_workers}`);
console.log(`Average Rating: ${stats.average_rating}`);
console.log(`L3 Experts: ${stats.designation_distribution.L3}`);
```

## Data Types

### `EmployeeRating`
```typescript
interface EmployeeRating {
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
```

### `RatingHistoryItem`
```typescript
interface RatingHistoryItem {
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
```

### `EmployeeRatingSummary`
```typescript
interface EmployeeRatingSummary {
  average_rating: number;
  designation: 'L1' | 'L2' | 'L3';
  total_ratings: number;
  approved_ratings_count: number;
  rejected_ratings_count: number;
  pending_ratings_count: number;
  rating_history: RatingHistoryItem[];
}
```

## Designation Rules

| Level | Rating Range | Label | Color | Description |
|-------|-------------|-------|-------|-------------|
| **L1** | 1.0 – 2.9 | Beginner | Red | New or struggling workers |
| **L2** | 3.0 – 3.9 | Intermediate | Yellow | Average performing workers |
| **L3** | 4.0 – 5.0 | Expert | Green | High-performing workers |

## Helper Functions

### `getDesignationFromRating(rating: number)`
Returns the appropriate designation based on rating value.

### `getDesignationColor(designation: string)`
Returns Tailwind CSS classes for designation color coding.

### `getDesignationLabel(designation: string)`
Returns human-readable label for designation.

## Integration Examples

### Worker Dashboard Integration
```typescript
// In WorkerDashboard.tsx
import { getEmployeeRatingSummary } from '@/lib/employee-ratings-api';

const loadRatingData = async () => {
  const ratingSummary = await getEmployeeRatingSummary(user.id);
  if (ratingSummary) {
    setRatingData({
      averageRating: ratingSummary.average_rating,
      designation: ratingSummary.designation,
      totalRatings: ratingSummary.approved_ratings_count,
      ratingHistory: ratingSummary.rating_history
    });
  }
};
```

### Employer Dashboard Integration
```typescript
// In EmployerDashboard.tsx
import { updateEmployeeRating } from '@/lib/employee-ratings-api';

const handleSubmitRating = async (submissionId: string) => {
  const result = await updateEmployeeRating(submissionId, rating, feedback);
  if (result.success) {
    // Handle success
  } else {
    // Handle error
  }
};
```

## Error Handling

All API functions include comprehensive error handling:

- **Database errors** are caught and logged
- **Validation errors** return descriptive messages
- **Network errors** are handled gracefully
- **Fallback values** are provided when data is unavailable

## Performance Considerations

- **Efficient queries** with proper indexing
- **Batch processing** for multiple employees
- **Caching-friendly** data structures
- **Minimal database calls** through optimized joins

## Security Features

- **Row Level Security (RLS)** enforced
- **User authentication** required
- **Input validation** on all parameters
- **SQL injection protection** through parameterized queries

## Future Enhancements

- **Rating trends** over time
- **Performance analytics** and insights
- **Bulk rating operations** for employers
- **Rating notifications** and alerts
- **Advanced filtering** and search capabilities




