import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Code, CheckCircle, X } from 'lucide-react';

const skillsByRole = {
  "Frontend Developer": ["HTML", "CSS", "JavaScript", "React.js", "UI/UX Basics"],
  "Backend Developer": ["Node.js", "Express.js", "Python", "Databases", "API Development"],
  "Full Stack Developer": ["React.js", "Node.js", "MongoDB", "REST APIs", "Version Control"],
  "Mobile App Developer": ["Flutter", "React Native", "iOS", "Android", "App Store Deployment"],
  "Database Administrator (DBA)": ["SQL", "Database Optimization", "Backups", "Security", "Performance Tuning"],
  "Cloud Engineer / DevOps": ["AWS", "Azure", "CI/CD", "Docker", "Kubernetes"]
};

interface ITTaskFormProps {
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
}

export const ITTaskForm: React.FC<ITTaskFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    selectedRole: '',
    selectedSkills: [],
    budget: '',
    deadline: '',
    difficulty: 'medium'
  });

  const handleRoleChange = (role: string) => {
    setFormData(prev => ({
      ...prev,
      selectedRole: role,
      selectedSkills: [], // Reset skills when role changes
      title: `${role} - IT Task`
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
                     formData.selectedSkills.length > 0 && formData.budget;

  const availableSkills = formData.selectedRole ? skillsByRole[formData.selectedRole as keyof typeof skillsByRole] || [] : [];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center space-x-3">
            <Code className="h-6 w-6" />
            <CardTitle className="text-2xl">Create IT Department Task</CardTitle>
          </div>
          <p className="text-blue-100 mt-2">
            Create a specialized task for IT professionals with role-specific skill requirements
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
                  placeholder="e.g., Frontend Developer - React Component Development"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget" className="text-sm font-semibold text-gray-700">
                  Budget (₹) *
                </Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="5000"
                  value={formData.budget}
                  onChange={(e) => handleInputChange('budget', e.target.value)}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                Task Description *
              </Label>
              <Textarea
                id="description"
                placeholder="Describe what the developer needs to do in detail..."
                rows={4}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            {/* Role Selection */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                <Code className="h-5 w-5 text-blue-600" />
                <span>Select IT Department Role *</span>
              </Label>
              
              <Select value={formData.selectedRole} onValueChange={handleRoleChange}>
                <SelectTrigger className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Choose an IT role for this task" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(skillsByRole).map((role) => (
                    <SelectItem key={role} value={role} className="cursor-pointer hover:bg-blue-50">
                      <div className="flex items-center space-x-2">
                        <Code className="h-4 w-4 text-blue-600" />
                        <span>{role}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Skills Selection */}
            {formData.selectedRole && (
              <div className="space-y-4 bg-blue-50 p-6 rounded-lg border border-blue-200">
                <Label className="text-lg font-semibold text-gray-800">
                  Required Skills for {formData.selectedRole} *
                </Label>
                <p className="text-sm text-gray-600 mb-4">
                  Select the skills required for this task. You can choose multiple skills.
                </p>
                
                {/* Available Skills */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableSkills.map((skill) => (
                    <div key={skill} className="flex items-center space-x-3 bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                      <Checkbox
                        id={skill}
                        checked={formData.selectedSkills.includes(skill)}
                        onCheckedChange={() => handleSkillToggle(skill)}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
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
                          className="bg-blue-100 text-blue-800 border border-blue-300 px-3 py-1 flex items-center space-x-2"
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="ml-2 text-blue-600 hover:text-blue-800 transition-colors"
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

            {/* Additional Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="difficulty" className="text-sm font-semibold text-gray-700">
                  Difficulty Level
                </Label>
                <Select value={formData.difficulty} onValueChange={(value) => handleInputChange('difficulty', value)}>
                  <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy (1-2 hours)</SelectItem>
                    <SelectItem value="medium">Medium (3-8 hours)</SelectItem>
                    <SelectItem value="hard">Hard (1-3 days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline" className="text-sm font-semibold text-gray-700">
                  Deadline
                </Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => handleInputChange('deadline', e.target.value)}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  min={new Date().toISOString().split('T')[0]}
                />
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
                  className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Create IT Task
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ITTaskForm;
