import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  AlertTriangle,
  Home,
  ChevronRight,
  X,
  User
} from 'lucide-react';

interface DisputeForm {
  type: string;
  relatedId: string;
  workerName: string;
  workerId: string;
  description: string;
  files: File[];
}

interface Worker {
  user_id: string;
  full_name: string;
  email: string;
}

const RaiseDispute = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [form, setForm] = useState<DisputeForm>({
    type: '',
    relatedId: '',
    workerName: '',
    workerId: '',
    description: '',
    files: []
  });
  const [errors, setErrors] = useState<Partial<DisputeForm>>({});

  const disputeTypes = [
    { value: 'payment', label: 'Payment Issue', description: 'Problems with payment processing or worker payment disputes' },
    { value: 'quality', label: 'Quality Issue', description: 'Poor work quality or incomplete task submissions' },
    { value: 'behavior', label: 'Worker Behavior', description: 'Inappropriate behavior or communication issues' },
    { value: 'contract', label: 'Contract Violation', description: 'Worker not following task requirements or deadlines' },
    { value: 'other', label: 'Other', description: 'Any other issue not covered above' }
  ];

  // Load workers for the dropdown
  useEffect(() => {
    const loadWorkers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .eq('role', 'worker')
          .order('full_name');

        if (error) throw error;
        setWorkers(data || []);
      } catch (error: any) {
        console.error('Error loading workers:', error);
        toast({
          title: "Error",
          description: "Failed to load workers. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoadingWorkers(false);
      }
    };

    loadWorkers();
  }, [toast]);

  const validateForm = (): boolean => {
    const newErrors: Partial<DisputeForm> = {};

    if (!form.type) {
      newErrors.type = 'Please select a dispute type';
    }

    if (!form.workerId) {
      newErrors.workerId = 'Please select a worker';
    }

    if (!form.description.trim()) {
      newErrors.description = 'Please provide a description of the issue';
    }

    if (form.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof DisputeForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setForm(prev => ({ ...prev, files: [...prev.files, ...files] }));
  };

  const removeFile = (index: number) => {
    setForm(prev => ({ ...prev, files: prev.files.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to submit a dispute.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create dispute record
      const disputeData = {
        dispute_type: form.type,
        title: `${form.type.charAt(0).toUpperCase() + form.type.slice(1)} Dispute`,
        description: form.description,
        raised_by: user.id,
        against: form.workerId, // Add the worker ID as the against field
        status: 'open',
        priority: 'medium'
      };

      // Add related_id if provided
      if (form.relatedId && form.relatedId.trim()) {
        disputeData.related_id = form.relatedId.trim();
      }

      const { data: disputeResult, error: disputeError } = await supabase
        .from('disputes')
        .insert(disputeData)
        .select()
        .single();

      if (disputeError) throw disputeError;

      // Upload files if any
      if (form.files.length > 0) {
        const uploadPromises = form.files.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `${user.id}/${disputeResult.id}/${fileName}`;

          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from('dispute-attachments')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          // Save attachment record
          const { error: attachmentError } = await supabase
            .from('dispute_attachments')
            .insert({
              dispute_id: disputeResult.id,
              file_name: file.name,
              file_path: filePath,
              file_size: file.size,
              mime_type: file.type,
              uploaded_by: user.id
            });

          if (attachmentError) throw attachmentError;
        });

        await Promise.all(uploadPromises);
      }

      toast({
        title: "Dispute Submitted Successfully!",
        description: `Your dispute #${disputeResult.dispute_id} has been submitted. Our team will review it and get back to you shortly.`,
      });

      // Reset form
      setForm({
        type: '',
        relatedId: '',
        workerName: '',
        description: '',
        files: []
      });
      setErrors({});

    } catch (error: any) {
      console.error('Error submitting dispute:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit dispute. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-2 text-sm text-gray-600 mb-6"
        >
          <Home className="w-4 h-4" />
          <ChevronRight className="w-4 h-4" />
          <span>Disputes</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Raise Dispute</span>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </Button>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Raise a Dispute</h1>
          <p className="text-gray-600">Submit a complaint regarding a worker, task, or quality issue.</p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>Dispute Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Dispute Type */}
                <div className="space-y-2">
                  <Label htmlFor="type">Dispute Type *</Label>
                  <Select value={form.type} onValueChange={(value) => handleInputChange('type', value)}>
                    <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select the type of dispute" />
                    </SelectTrigger>
                    <SelectContent>
                      {disputeTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-gray-500">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-sm text-red-600">{errors.type}</p>
                  )}
                </div>

                {/* Worker Selection */}
                <div className="space-y-2">
                  <Label htmlFor="workerId">Select Worker</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Select 
                      value={form.workerId} 
                      onValueChange={(value) => {
                        handleInputChange('workerId', value);
                        // Also set workerName for display purposes
                        const selectedWorker = workers.find(w => w.user_id === value);
                        if (selectedWorker) {
                          setForm(prev => ({ ...prev, workerName: selectedWorker.full_name }));
                        }
                      }}
                    >
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder={loadingWorkers ? "Loading workers..." : "Select a worker"} />
                      </SelectTrigger>
                      <SelectContent>
                        {workers.map((worker) => (
                          <SelectItem key={worker.user_id} value={worker.user_id}>
                            {worker.full_name} ({worker.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.workerId && (
                    <p className="text-xs text-red-500">{errors.workerId}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Select the worker involved in the dispute
                  </p>
                </div>

                {/* Related Task/Payment ID */}
                <div className="space-y-2">
                  <Label htmlFor="relatedId">Related Task or Payment ID</Label>
                  <Input
                    id="relatedId"
                    placeholder="e.g., TASK-12345 or PAY-67890 (optional)"
                    value={form.relatedId}
                    onChange={(e) => handleInputChange('relatedId', e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Help us locate the specific task or payment related to your dispute
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide details about the worker, task, and issue you're reporting."
                    value={form.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className={errors.description ? 'border-red-500' : ''}
                    rows={6}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600">{errors.description}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Minimum 20 characters. Be as detailed as possible to help us resolve your issue quickly.
                  </p>
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label>Supporting Documents</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF, JPG, PNG, DOC, DOCX (Max 10MB each)
                      </p>
                    </label>
                  </div>
                  
                  {/* Uploaded Files */}
                  {form.files.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Uploaded Files:</p>
                      {form.files.map((file, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{file.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="min-w-[120px]"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Submitting...</span>
                      </div>
                    ) : (
                      'Submit Dispute'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900 mb-1">Need Help?</h3>
                  <p className="text-sm text-blue-800">
                    Our support team typically responds to disputes within 24-48 hours. 
                    For urgent matters, please contact our support team directly.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Employer-Specific Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <User className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-amber-900 mb-1">Tips for Employers</h3>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• Include specific examples of the issue with dates and times</li>
                    <li>• Attach screenshots or documents that support your claim</li>
                    <li>• Be clear about what resolution you're seeking</li>
                    <li>• Provide worker communication history if relevant</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default RaiseDispute;
