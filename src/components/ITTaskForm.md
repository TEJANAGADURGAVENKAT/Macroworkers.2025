# ITTaskForm Component

A React component for creating IT Department tasks with role-based skill selection.

## Features

- **Role Selection**: Dropdown to select from 6 IT Department roles
- **Dynamic Skills**: Skills dropdown updates based on selected role
- **Multi-select Skills**: Users can select multiple required skills
- **Form Validation**: Complete form validation with visual feedback
- **Clean UI**: Built with Tailwind CSS and shadcn/ui components
- **Responsive Design**: Works on desktop and mobile devices

## Supported IT Roles

1. **Frontend Developer**
   - HTML, CSS, JavaScript, React.js, UI/UX Basics

2. **Backend Developer**
   - Node.js, Express.js, Python, Databases, API Development

3. **Full Stack Developer**
   - React.js, Node.js, MongoDB, REST APIs, Version Control

4. **Mobile App Developer**
   - Flutter, React Native, iOS, Android, App Store Deployment

5. **Database Administrator (DBA)**
   - SQL, Database Optimization, Backups, Security, Performance Tuning

6. **Cloud Engineer / DevOps**
   - AWS, Azure, CI/CD, Docker, Kubernetes

## Usage

### Basic Usage

```tsx
import { ITTaskForm } from '@/components/ITTaskForm';

function MyPage() {
  const handleSubmit = (formData) => {
    console.log('Task created:', formData);
    // Handle form submission
  };

  const handleCancel = () => {
    // Handle form cancellation
  };

  return (
    <ITTaskForm 
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
  title: string;           // Task title
  description: string;     // Detailed description
  selectedRole: string;    // Selected IT role
  selectedSkills: string[]; // Array of selected skills
  budget: string;          // Budget amount
  deadline: string;        // Deadline date (YYYY-MM-DD)
  difficulty: string;      // 'easy' | 'medium' | 'hard'
}
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `onSubmit` | `(formData: TaskFormData) => void` | Optional callback when form is submitted |
| `onCancel` | `() => void` | Optional callback when form is cancelled |

## Demo

Visit `/demo/it-task-form` to see the component in action.

## Dependencies

- React 18+
- Tailwind CSS
- shadcn/ui components:
  - Card, CardContent, CardHeader, CardTitle
  - Label, Select, Checkbox, Badge, Button
  - Input, Textarea
- Lucide React icons

## Styling

The component uses Tailwind CSS classes and follows a blue color scheme:
- Primary: `blue-600` / `blue-700`
- Accent: `blue-50` / `blue-100`
- Text: Various gray shades
- Interactive states with hover and focus effects

## Accessibility

- Proper ARIA labels and form associations
- Keyboard navigation support
- Screen reader friendly
- Focus management and visual indicators
- Semantic HTML structure

## Customization

The component can be customized by:
1. Modifying the `skillsByRole` object to add/remove roles or skills
2. Adjusting Tailwind classes for different styling
3. Adding additional form fields as needed
4. Extending the `TaskFormData` interface for more data

## Example Integration

```tsx
// In your task creation page
import { ITTaskForm } from '@/components/ITTaskForm';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export default function CreateITTask() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (formData) => {
    try {
      // Submit to your API
      const response = await createTask({
        ...formData,
        category: 'IT',
        role_category: 'IT'
      });
      
      toast({
        title: "Task Created!",
        description: `${formData.selectedRole} task created successfully.`
      });
      
      navigate('/employer/campaigns');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task.",
        variant: "destructive"
      });
    }
  };

  return <ITTaskForm onSubmit={handleSubmit} />;
}
```
