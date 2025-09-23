import React from 'react';
import { DigitalMarketingTaskForm } from '@/components/DigitalMarketingTaskForm';
import { useToast } from '@/hooks/use-toast';

const DigitalMarketingTaskFormDemo = () => {
  const { toast } = useToast();

  const handleSubmit = (formData: any) => {
    console.log('Digital Marketing Task submitted:', formData);
    toast({
      title: "Marketing Task Created Successfully!",
      description: `Created ${formData.selectedRole} task with ${formData.selectedSkills.length} required skills and ${formData.campaignGoals.length} campaign goals.`,
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
            Digital Marketing Task Creation Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            This demo showcases the Digital Marketing Task Form component with role-based skill selection.
            Select a digital marketing role to see the relevant skills mapped to that specialization.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-8 max-w-4xl mx-auto">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="font-semibold text-green-700 mb-2">SEO Specialist</h3>
              <p className="text-xs text-gray-600">5 specialized skills</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="font-semibold text-green-700 mb-2">Content Marketing</h3>
              <p className="text-xs text-gray-600">5 content skills</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="font-semibold text-green-700 mb-2">Social Media</h3>
              <p className="text-xs text-gray-600">5 social skills</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="font-semibold text-green-700 mb-2">PPC Specialist</h3>
              <p className="text-xs text-gray-600">5 advertising skills</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="font-semibold text-green-700 mb-2">Email Marketing</h3>
              <p className="text-xs text-gray-600">5 email skills</p>
            </div>
          </div>
        </div>
        
        <DigitalMarketingTaskForm 
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default DigitalMarketingTaskFormDemo;
