# DigitalMarketingTaskForm Component

A React component for creating Digital Marketing tasks with role-based skill selection and marketing-specific features.

## Features

- **Role Selection**: Dropdown to select from 5 Digital Marketing roles
- **Dynamic Skills**: Skills update based on selected role (only relevant skills shown)
- **Multi-select Skills**: Users can select multiple required skills with checkboxes
- **Campaign Goals**: Multi-select campaign objectives
- **Marketing-Specific Fields**: Target audience, campaign complexity, deadline
- **Form Validation**: Complete validation with visual feedback
- **Clean UI**: Built with Tailwind CSS and green marketing theme
- **Responsive Design**: Works on desktop and mobile devices

## Supported Digital Marketing Roles

### 1. **SEO Specialist**
- Keyword Research
- On-page SEO
- Off-page SEO
- Technical SEO
- Content Optimization

### 2. **Content Marketing Specialist**
- Content Writing
- Copywriting
- Blog Management
- Storytelling
- Editing

### 3. **Social Media Manager**
- Social Media Strategy
- Content Scheduling
- Analytics & Insights
- Community Engagement
- Paid Campaigns

### 4. **PPC Specialist**
- Google Ads
- Facebook Ads
- Campaign Optimization
- A/B Testing
- Conversion Tracking

### 5. **Email Marketing Specialist**
- Email Campaigns
- Automation Tools
- A/B Testing
- Copywriting
- List Segmentation

## Usage

### Basic Usage

```tsx
import { DigitalMarketingTaskForm } from '@/components/DigitalMarketingTaskForm';

function MyPage() {
  const handleSubmit = (formData) => {
    console.log('Marketing task created:', formData);
    // Handle form submission
  };

  const handleCancel = () => {
    // Handle form cancellation
  };

  return (
    <DigitalMarketingTaskForm 
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}
```

### Form Data Structure

The component returns the following data structure when submitted:

```typescript
interface TaskFormData {
  title: string;              // Task title
  description: string;        // Detailed description
  selectedRole: string;       // Selected marketing role
  selectedSkills: string[];   // Array of selected skills
  budget: string;             // Budget amount
  deadline: string;           // Deadline date (YYYY-MM-DD)
  difficulty: string;         // 'easy' | 'medium' | 'hard'
  targetAudience: string;     // Target audience description
  campaignGoals: string[];    // Array of campaign goals
}
```

### Campaign Goals Options

- Brand Awareness
- Lead Generation
- Sales Conversion
- Website Traffic
- Engagement
- Customer Retention

## Role-Based Skill Filtering

### How It Works

1. **Select Role**: Choose "SEO Specialist"
2. **Skills Update**: Only SEO-related skills appear
3. **No Clutter**: Social media or PPC skills are hidden
4. **Smart Reset**: Skills clear when role changes

### Example Flow

```
Select "SEO Specialist" → Shows:
┌─────────────────────────┐
│ ☐ Keyword Research     │
│ ☐ On-page SEO          │
│ ☐ Off-page SEO         │
│ ☐ Technical SEO        │
│ ☐ Content Optimization │
└─────────────────────────┘

Select "Social Media Manager" → Shows:
┌─────────────────────────────┐
│ ☐ Social Media Strategy    │
│ ☐ Content Scheduling       │
│ ☐ Analytics & Insights     │
│ ☐ Community Engagement     │
│ ☐ Paid Campaigns           │
└─────────────────────────────┘
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `onSubmit` | `(formData: TaskFormData) => void` | Optional callback when form is submitted |
| `onCancel` | `() => void` | Optional callback when form is cancelled |

## Demo

Visit `/demo/digital-marketing-task-form` to see the component in action.

## Styling

The component uses a **green marketing theme**:
- Primary: `green-600` / `green-700`
- Accent: `green-50` / `green-100`
- Icons: TrendingUp for marketing focus
- Interactive states with hover and focus effects

## Key Features

### 1. **Role-Specific Skills**
Only shows skills relevant to the selected marketing role.

### 2. **Marketing Focus**
- Target Audience field
- Campaign Goals multi-select
- Campaign Complexity levels
- Marketing-themed icons and colors

### 3. **Smart UX**
- Skills reset when role changes
- Visual skill counter
- Selected skills with remove buttons
- Form validation indicators

### 4. **Professional Design**
- Clean card-based layout
- Consistent spacing and typography
- Responsive grid layouts
- Marketing-appropriate color scheme

## Integration Example

```tsx
// In your marketing task creation page
import { DigitalMarketingTaskForm } from '@/components/DigitalMarketingTaskForm';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export default function CreateMarketingTask() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (formData) => {
    try {
      // Submit to your API
      const response = await createMarketingTask({
        ...formData,
        category: 'Digital Marketing',
        role_category: 'Digital Marketing'
      });
      
      toast({
        title: "Marketing Task Created!",
        description: `${formData.selectedRole} task created with ${formData.selectedSkills.length} skills.`
      });
      
      navigate('/employer/campaigns');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create marketing task.",
        variant: "destructive"
      });
    }
  };

  return <DigitalMarketingTaskForm onSubmit={handleSubmit} />;
}
```

## Accessibility

- Proper ARIA labels and form associations
- Keyboard navigation support
- Screen reader friendly
- Focus management and visual indicators
- Semantic HTML structure

## Customization

The component can be customized by:
1. Modifying the `skillsByRole` object to add/remove roles or skills
2. Adjusting campaign goals in `campaignGoalOptions`
3. Changing Tailwind classes for different styling
4. Adding additional marketing-specific fields
5. Extending the `TaskFormData` interface

The component is designed to be a comprehensive solution for digital marketing task creation with role-specific skill filtering! 🎯
