import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TrendingUp, CheckCircle, X, Users, IndianRupee, Calendar } from 'lucide-react';

const skillsByRole = {
  "SEO Specialist": ["Keyword Research", "On-page SEO", "Off-page SEO", "Technical SEO", "Content Optimization"],
  "Content Marketing Specialist": ["Content Writing", "Copywriting", "Blog Management", "Storytelling", "Editing"],
  "Social Media Manager": ["Social Media Strategy", "Content Scheduling", "Analytics & Insights", "Community Engagement", "Paid Campaigns"],
  "PPC Specialist": ["Google Ads", "Facebook Ads", "Campaign Optimization", "A/B Testing", "Conversion Tracking"],
  "Email Marketing Specialist": ["Email Campaigns", "Automation Tools", "A/B Testing", "Copywriting", "List Segmentation"]
};

interface DigitalMarketingTaskFormProps {
  onSubmit?: (formData: TaskFormData) => void;
  onCancel?: () => void;
}

interface TaskFormData {
  title: string;
  description: string;
  selectedRole: string;
  selectedSkills: string[];
  budget: string;
  deadline: string;
  difficulty: string;
  targetAudience: string;
  campaignGoals: string[];
}

const campaignGoalOptions = [
  "Brand Awareness",
  "Lead Generation",
  "Sales Conversion",
  "Website Traffic",
  "Engagement",
  "Customer Retention"
];

export const DigitalMarketingTaskForm: React.FC<DigitalMarketingTaskFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    selectedRole: '',
    selectedSkills: [],
    budget: '',
    deadline: '',
    difficulty: 'medium',
    targetAudience: '',
    campaignGoals: []
  });

  const handleRoleChange = (role: string) => {
    setFormData(prev => ({
      ...prev,
      selectedRole: role,
      selectedSkills: [], // Reset skills when role changes
      title: `${role} - Digital Marketing Task`
    }));
  };

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      selectedSkills: prev.selectedSkills.includes(skill)
        ? prev.selectedSkills.filter(s => s !== skill)
        : [...prev.selectedSkills, skill]
    }));
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      selectedSkills: prev.selectedSkills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleGoalToggle = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      campaignGoals: prev.campaignGoals.includes(goal)
        ? prev.campaignGoals.filter(g => g !== goal)
        : [...prev.campaignGoals, goal]
    }));
  };

  const handleInputChange = (field: keyof TaskFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  const isFormValid = formData.title && formData.description && formData.selectedRole && 
                     formData.selectedSkills.length > 0 && formData.budget && formData.targetAudience;

  const availableSkills = formData.selectedRole ? skillsByRole[formData.selectedRole as keyof typeof skillsByRole] || [] : [];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-6 w-6" />
            <CardTitle className="text-2xl">Create Digital Marketing Task</CardTitle>
          </div>
          <p className="text-green-100 mt-2">
            Create a specialized digital marketing task with role-specific skill requirements
          </p>
        </CardHeader>
        
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Basic Task Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold text-gray-700">
                  Task Title *
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., SEO Specialist - Website Optimization"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget" className="text-sm font-semibold text-gray-700">
                  Budget (₹) *
                </Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="budget"
                    type="number"
                    placeholder="5000"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                Task Description *
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the digital marketing task requirements in detail..."
                rows={4}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                required
              />
            </div>

            {/* Role Selection */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Select Digital Marketing Role *</span>
              </Label>
              
              <Select value={formData.selectedRole} onValueChange={handleRoleChange}>
                <SelectTrigger className="w-full border-gray-300 focus:border-green-500 focus:ring-green-500">
                  <SelectValue placeholder="Choose a digital marketing role for this task" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(skillsByRole).map((role) => (
                    <SelectItem key={role} value={role} className="cursor-pointer hover:bg-green-50">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span>{role}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Skills Selection */}
            {formData.selectedRole && (
              <div className="space-y-4 bg-green-50 p-6 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold text-gray-800">
                    Required Skills for {formData.selectedRole} *
                  </Label>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {formData.selectedSkills.length} selected
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Select the specific skills required for this {formData.selectedRole.toLowerCase()} task.
                </p>
                
                {/* Available Skills */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableSkills.map((skill) => (
                    <div key={skill} className="flex items-center space-x-3 bg-white p-3 rounded-lg border border-gray-200 hover:border-green-300 transition-colors">
                      <Checkbox
                        id={skill}
                        checked={formData.selectedSkills.includes(skill)}
                        onCheckedChange={() => handleSkillToggle(skill)}
                        className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                      />
                      <Label htmlFor={skill} className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                        {skill}
                      </Label>
                    </div>
                  ))}
                </div>

                {/* Selected Skills Display */}
                {formData.selectedSkills.length > 0 && (
                  <div className="mt-6">
                    <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                      Selected Skills ({formData.selectedSkills.length})
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.selectedSkills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="bg-green-100 text-green-800 border border-green-300 px-3 py-1 flex items-center space-x-2"
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="ml-2 text-green-600 hover:text-green-800 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Campaign Goals */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold text-gray-800">
                Campaign Goals
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {campaignGoalOptions.map((goal) => (
                  <div key={goal} className="flex items-center space-x-2">
                    <Checkbox
                      id={goal}
                      checked={formData.campaignGoals.includes(goal)}
                      onCheckedChange={() => handleGoalToggle(goal)}
                      className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                    />
                    <Label htmlFor={goal} className="text-sm font-medium text-gray-700 cursor-pointer">
                      {goal}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="targetAudience" className="text-sm font-semibold text-gray-700">
                  Target Audience *
                </Label>
                <Input
                  id="targetAudience"
                  placeholder="e.g., Young professionals, 25-35 years"
                  value={formData.targetAudience}
                  onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                  className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty" className="text-sm font-semibold text-gray-700">
                  Campaign Complexity
                </Label>
                <Select value={formData.difficulty} onValueChange={(value) => handleInputChange('difficulty', value)}>
                  <SelectTrigger className="border-gray-300 focus:border-green-500 focus:ring-green-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Simple (1-2 days)</SelectItem>
                    <SelectItem value="medium">Moderate (1 week)</SelectItem>
                    <SelectItem value="hard">Complex (2-4 weeks)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline" className="text-sm font-semibold text-gray-700">
                  Deadline
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => handleInputChange('deadline', e.target.value)}
                    className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                {isFormValid ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Form is ready to submit</span>
                  </>
                ) : (
                  <>
                    <div className="h-4 w-4 rounded-full bg-orange-400" />
                    <span>Please fill all required fields</span>
                  </>
                )}
              </div>
              
              <div className="flex space-x-4">
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={!isFormValid}
                  className="px-8 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Create Marketing Task
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DigitalMarketingTaskForm;
