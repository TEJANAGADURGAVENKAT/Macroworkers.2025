import React from 'react';
import { ITTaskForm } from '@/components/ITTaskForm';
import { useToast } from '@/hooks/use-toast';

const ITTaskFormDemo = () => {
  const { toast } = useToast();

  const handleSubmit = (formData: any) => {
    console.log('Form submitted with data:', formData);
    toast({
      title: "Task Created Successfully!",
      description: `Created ${formData.selectedRole} task with ${formData.selectedSkills.length} required skills.`,
    });
  };

  const handleCancel = () => {
    console.log('Form cancelled');
    toast({
      title: "Task Creation Cancelled",
      description: "No changes were saved.",
      variant: "destructive"
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            IT Task Creation Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            This demo showcases the IT Task Form component with role-based skill selection.
            Select a role to see the relevant skills mapped to that position.
          </p>
        </div>
        
        <ITTaskForm 
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default ITTaskFormDemo;
