# Rating System Documentation

## Overview

The rating system automatically calculates worker performance levels and designations based on employer ratings. When an employer rates a worker's submission, the system automatically updates the worker's average rating and designation level.

## Database Structure

### Tables Modified

#### `profiles` table
- **`rating`**: DECIMAL(3,2) - Worker's average rating (1.00-5.00)
- **`designation`**: TEXT - Worker's level designation (L1, L2, L3)
- **`last_rating_update`**: TIMESTAMP - When rating was last updated

#### `task_submissions` table
- **`employer_rating_given`**: DECIMAL(3,2) - Rating given by employer (1.00-5.00)
- **`rating_feedback`**: TEXT - Optional feedback from employer

## Designation Levels

| Level | Rating Range | Label | Color | Description |
|-------|-------------|-------|-------|-------------|
| **L1** | < 3.0 | Beginner | Red | New or struggling workers |
| **L2** | 3.0 - 3.9 | Intermediate | Yellow | Average performing workers |
| **L3** | ≥ 4.0 | Expert | Green | High-performing workers |

## Database Trigger

### Function: `update_worker_rating_and_designation()`

**Triggered when:**
- `employer_rating_given` is updated in `task_submissions` table
- Only processes approved submissions
- Recalculates average rating from all employer ratings

**Actions:**
1. Calculates new average rating for the worker
2. Determines appropriate designation level
3. Updates worker's profile with new rating and designation
4. Updates `last_rating_update` timestamp

### Trigger: `update_worker_rating_trigger`

```sql
CREATE TRIGGER update_worker_rating_trigger
  AFTER UPDATE ON public.task_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_worker_rating_and_designation();
```

## Setup Instructions

### 1. Run the Database Setup Script

Execute `fix_rating_trigger_simple.sql` in your Supabase SQL editor:

```sql
-- Add designation field
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS designation TEXT CHECK (designation IN ('L1', 'L2', 'L3')) DEFAULT 'L1';

-- Create trigger function
CREATE OR REPLACE FUNCTION update_worker_rating_and_designation()
RETURNS TRIGGER AS $$
-- Function implementation
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_worker_rating_trigger
  AFTER UPDATE ON public.task_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_worker_rating_and_designation();
```

### 2. Verify Setup

Run `test_rating_trigger.sql` to verify everything is working:

```sql
-- Check if designation column exists
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'designation';

-- Check if trigger exists
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name = 'update_worker_rating_trigger';
```

## Usage in Application

### Employer Dashboard

The Submitted Tasks section now displays:
- Worker's current rating (⭐ 4.2)
- Worker's designation level (L3 - Expert)
- Color-coded badges for easy identification

### Rating Interface

When employers rate submissions:
1. Select star rating (1-5 stars)
2. Optionally add feedback text
3. Click "Submit Rating"
4. System automatically:
   - Saves rating to database
   - Triggers rating recalculation
   - Updates worker's designation
   - Shows success notification

## Monitoring

### Worker Rating Summary View

A database view `worker_rating_summary` provides easy monitoring:

```sql
SELECT 
  full_name,
  rating,
  designation,
  total_tasks_completed,
  total_submissions,
  rated_submissions,
  avg_employer_rating
FROM worker_rating_summary
ORDER BY rating DESC;
```

## Example Workflow

1. **Worker submits task** → Status: "pending"
2. **Employer reviews submission** → Sees worker's current L2 designation
3. **Employer rates 4.5 stars** → Clicks "Submit Rating"
4. **Database trigger fires** → Recalculates worker's average rating
5. **Worker's profile updated** → Rating: 4.1, Designation: L3 (Expert)
6. **UI updates** → Shows new designation in future submissions

## Benefits

- **Automatic**: No manual intervention required
- **Real-time**: Updates happen immediately after rating
- **Transparent**: Workers can see their progression
- **Fair**: Based on actual performance data
- **Scalable**: Works with any number of workers and ratings

## Troubleshooting

### Common Issues

1. **Trigger not firing**: Check if trigger exists in `information_schema.triggers`
2. **Designation not updating**: Verify `employer_rating_given` is not NULL
3. **Rating calculation wrong**: Check if submissions have `status = 'approved'`

### Debug Queries

```sql
-- Check worker's current rating
SELECT user_id, full_name, rating, designation 
FROM profiles 
WHERE user_id = 'worker-id-here';

-- Check all ratings for a worker
SELECT employer_rating_given, status, submitted_at
FROM task_submissions 
WHERE worker_id = 'worker-id-here'
ORDER BY submitted_at DESC;

-- Check trigger function
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'update_worker_rating_and_designation';
```

## Future Enhancements

- **Rating History**: Track rating changes over time
- **Performance Analytics**: Detailed performance metrics
- **Automated Promotions**: Automatic level changes based on criteria
- **Rating Categories**: Different rating types (quality, speed, communication)
- **Peer Ratings**: Allow workers to rate each other


