# Star Rating Components

This directory contains reusable star rating components for the application.

## Components Available

### 1. StarRating (Simple)
**File:** `star-rating-simple.tsx`

A clean, simple star rating component perfect for tables and compact spaces.

**Props:**
- `currentRating: number` - Current rating value (0-5)
- `onRatingChange: (rating: number) => void` - Callback when rating changes
- `maxRating?: number` - Maximum rating (default: 5)
- `size?: 'sm' | 'md' | 'lg'` - Size of stars (default: 'md')
- `readonly?: boolean` - Make component read-only (default: false)
- `className?: string` - Additional CSS classes

**Example:**
```tsx
import StarRating from '@/components/ui/star-rating-simple';

const TaskSubmission = () => {
  const [rating, setRating] = useState(0);
  
  return (
    <StarRating
      currentRating={rating}
      onRatingChange={setRating}
      size="sm"
    />
  );
};
```

### 2. StarRatingAdvanced
**File:** `star-rating-advanced.tsx`

A feature-rich star rating component with labels, half-stars, and more options.

**Props:**
- All props from simple version, plus:
- `showLabel?: boolean` - Show rating description (default: false)
- `showValue?: boolean` - Show numeric value (default: false)
- `allowHalfStars?: boolean` - Allow half-star ratings (default: false)
- `label?: string` - Label text above the rating
- `error?: string` - Error message to display

**Example:**
```tsx
import StarRatingAdvanced from '@/components/ui/star-rating-advanced';

const TaskReview = () => {
  const [rating, setRating] = useState(0);
  
  return (
    <StarRatingAdvanced
      currentRating={rating}
      onRatingChange={setRating}
      label="Rate this submission"
      showValue={true}
      showLabel={true}
      allowHalfStars={true}
      size="lg"
    />
  );
};
```

## Usage in Submitted Tasks

The star rating is already integrated into the Employer Dashboard's "Submitted Tasks" section:

```tsx
// In EmployerDashboard.tsx
<StarRating
  currentRating={submissionRatings[submission.id] || 0}
  onRatingChange={(rating) => handleRatingChange(submission.id, rating)}
  size="sm"
/>
```

## Features

- ✅ **Interactive**: Click to set rating
- ✅ **Hover Effects**: Visual feedback on hover
- ✅ **Accessible**: Proper ARIA labels and keyboard support
- ✅ **Responsive**: Different sizes for different contexts
- ✅ **Customizable**: Multiple props for different use cases
- ✅ **Smooth Animations**: CSS transitions for better UX

## Styling

The components use TailwindCSS classes and can be customized with:
- Size variants (sm, md, lg, xl)
- Color schemes (yellow stars, gray empty)
- Hover effects and focus states
- Custom CSS classes via className prop

## Database Integration

To save ratings to the database, implement the `onRatingChange` callback:

```tsx
const handleRatingChange = async (submissionId: string, rating: number) => {
  try {
    await supabase
      .from('task_submissions')
      .update({ employer_rating_given: rating })
      .eq('id', submissionId);
    
    // Update local state
    setSubmissionRatings(prev => ({
      ...prev,
      [submissionId]: rating
    }));
  } catch (error) {
    console.error('Failed to save rating:', error);
  }
};
```

