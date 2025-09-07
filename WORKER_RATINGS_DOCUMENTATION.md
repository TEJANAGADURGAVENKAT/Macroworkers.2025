# Worker Dashboard - My Ratings Tab

## Overview

The Worker Dashboard now includes a comprehensive "My Ratings" tab that displays worker performance metrics, designation levels, and detailed rating history.

## Features

### 🎯 **Rating Overview Section**

**Average Rating Display:**
- ⭐ **Visual Star Rating**: Shows current average rating with filled/empty stars
- 📊 **Numeric Rating**: Displays precise rating (e.g., "4.2")
- 🏆 **Designation Badge**: Color-coded level indicator

**Designation Levels:**
- 🔴 **L1 - Beginner**: Rating < 3.0 (Red badge)
- 🟡 **L2 - Intermediate**: Rating 3.0-3.9 (Yellow badge)  
- 🟢 **L3 - Expert**: Rating ≥ 4.0 (Green badge)

**Statistics:**
- Total number of ratings received
- Total tasks completed
- Current designation level

### 📈 **Rating History Section**

**Individual Rating Cards Show:**
- **Task Title**: Name of the completed task
- **Star Rating**: Visual representation of employer's rating
- **Numeric Rating**: Exact rating given (e.g., "4/5")
- **Employer Feedback**: Written feedback from employer (if provided)
- **Task Budget**: Payment amount for the task
- **Submission Date**: When the task was submitted
- **Status**: Current status of the submission

## Data Sources

### **Profile Data** (`profiles` table):
- `rating`: Average rating from all employer ratings
- `designation`: Current level designation (L1, L2, L3)
- `total_tasks_completed`: Number of completed tasks

### **Rating History** (`task_submissions` table):
- `employer_rating_given`: Individual rating from employer (1-5)
- `rating_feedback`: Written feedback from employer
- `submitted_at`: When the task was submitted
- `status`: Current submission status
- `task`: Related task information (title, budget)

## UI Components

### **Tab Navigation:**
- **Overview Tab**: Original dashboard with tasks and earnings
- **My Ratings Tab**: New rating-focused interface

### **Rating Overview Card:**
- Large star display for average rating
- Designation badge with color coding
- Statistics summary

### **Rating History Cards:**
- Individual cards for each rated task
- Star rating visualization
- Feedback display with blue accent
- Task details and metadata

## User Experience

### **For New Workers:**
- Shows "No ratings yet" message
- Encourages task completion
- Displays L1 designation by default

### **For Experienced Workers:**
- Comprehensive rating history
- Clear progression tracking
- Detailed feedback from employers

## Technical Implementation

### **Data Fetching:**
```typescript
// Profile data with rating information
const { data: profileData } = await supabase
  .from('profiles')
  .select('rating, designation, total_tasks_completed')
  .eq('user_id', user.id)
  .eq('role', 'worker')
  .single();

// Rating history from submissions
const { data: ratingHistoryData } = await supabase
  .from('task_submissions')
  .select(`
    id, employer_rating_given, rating_feedback, submitted_at, status,
    task:tasks(id, title, budget)
  `)
  .eq('worker_id', user.id)
  .not('employer_rating_given', 'is', null)
  .order('submitted_at', { ascending: false });
```

### **State Management:**
```typescript
const [ratingData, setRatingData] = useState({
  averageRating: 0,
  designation: 'L1',
  totalRatings: 0,
  ratingHistory: [] as any[]
});
```

## Benefits

### **For Workers:**
- **Transparency**: See all ratings and feedback
- **Motivation**: Track progress and improvement
- **Recognition**: Clear designation levels
- **Learning**: Read employer feedback for improvement

### **For Employers:**
- **Quality Assurance**: Workers can see their performance
- **Feedback Loop**: Encourages better work quality
- **Trust Building**: Transparent rating system

## Future Enhancements

- **Rating Trends**: Chart showing rating improvement over time
- **Performance Analytics**: Detailed performance metrics
- **Goal Setting**: Set rating targets and track progress
- **Achievement Badges**: Special badges for milestones
- **Rating Categories**: Different rating types (quality, speed, communication)

## Access

Workers can access the "My Ratings" tab by:
1. Logging into their worker account
2. Going to the Worker Dashboard
3. Clicking on the "My Ratings" tab

The tab is automatically available to all workers and updates in real-time as new ratings are received.


