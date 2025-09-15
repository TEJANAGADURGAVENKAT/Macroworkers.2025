import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  Upload,
  Star,
  ArrowLeft,
  ExternalLink,
  File,
  X
} from "lucide-react";
import { IndianRupee } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { uploadSubmissionFile, validateSubmissionProof, isAllowedFileType, isFileSizeValid, MAX_FILE_SIZE } from "@/lib/submission-utils";

const TaskDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [proofText, setProofText] = useState("");
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [task, setTask] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setLoadError(null);
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        setTask(data);

        // Track task view
        if (user) {
          try {
            await supabase
              .from('task_views')
              .insert({
                task_id: id,
                viewer_id: user.id,
                user_agent: navigator.userAgent
              });
          } catch (viewError) {
            console.error('Failed to track task view:', viewError);
          }
        }
      } catch (e: any) {
        setLoadError(e?.message || 'Failed to load task');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate files
    for (const file of files) {
      if (!isAllowedFileType(file.name)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type.`,
          variant: "destructive"
        });
        return;
      }
      
      if (!isFileSizeValid(file)) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the maximum file size of ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
          variant: "destructive"
        });
        return;
      }
    }
    
    setProofFiles(prev => [...prev, ...files]);
    event.target.value = ''; // Reset input
  };

  const removeFile = (index: number) => {
    setProofFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to submit tasks.",
        variant: "destructive"
      });
      return;
    }

    if (!task) {
      toast({
        title: "Task not found",
        description: "The task you're trying to submit could not be found.",
        variant: "destructive"
      });
      return;
    }

    // Validate proof
    const validation = validateSubmissionProof({
      text: proofText,
      files: proofFiles
    });

    if (!validation.isValid) {
      toast({
        title: "Invalid proof",
        description: validation.errors.join(', '),
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      let uploadedFiles: string[] = [];
      
      // Upload files to Supabase Storage if provided
      if (proofFiles.length > 0) {
        for (const file of proofFiles) {
          try {
            const result = await uploadSubmissionFile(file, user.id);
            uploadedFiles.push(result.fileName);
            
            // Update progress
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: 100
            }));
          } catch (uploadError: any) {
            console.error('File upload error:', uploadError);
            throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
          }
        }
      }

      // Create the task submission
      const { data: submission, error } = await supabase
        .from('task_submissions')
        .insert({
          task_id: task.id,
          worker_id: user.id,
          employer_id: task.created_by, // Set employer_id manually
          proof_text: proofText.trim() || null,
          proof_files: uploadedFiles.length > 0 ? uploadedFiles : null,
          proof_type: uploadedFiles.length > 0 && proofText.trim() ? 'both' : 
                     uploadedFiles.length > 0 ? 'file' : 'text', // Set proof_type manually
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Submission error:', error);
        throw error;
      }

      toast({
        title: "Task submitted successfully!",
        description: "Your task submission is under review. You'll be notified once approved.",
      });

      // Navigate back to worker tasks page
      navigate('/worker/tasks');
    } catch (error: any) {
      console.error('Submission failed:', error);
      toast({
        title: "Submission failed",
        description: error?.message || "Failed to submit task. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
      setUploadProgress({});
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/worker/jobs">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Link>
          </Button>
          {task && (
            <>
              <Badge className="bg-success/10 text-success">{(task.requirements || '').toLowerCase().includes('hard') ? 'Hard' : (task.requirements || '').toLowerCase().includes('medium') ? 'Medium' : 'Easy'}</Badge>
              {task.category && <Badge variant="outline">{task.category}</Badge>}
            </>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Task Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{task?.title || (loading ? 'Loading...' : 'Task')}</CardTitle>
                {loadError && <p className="text-sm text-destructive">{loadError}</p>}
                {task && (
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <IndianRupee className="h-4 w-4 mr-1 text-success" />
                      <span className="font-semibold text-success">{formatINR(Number(task.budget) || 0)}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>Flexible</span>
                    </div>
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      <span>{task.expires_at ? new Date(task.expires_at).toLocaleString() : 'Flexible'}</span>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {task && (
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-muted-foreground">{task.description || 'No description provided.'}</p>
                  </div>
                )}

                <Separator />

                {(task?.requirements || '').length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Requirements</h4>
                    <ul className="space-y-2">
                      {(task?.requirements || '')
                        .split(/\n|,/) 
                        .map((s: string) => s.trim())
                        .filter(Boolean)
                        .map((req: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                            <span>{req}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                <Separator />

                <div>
                  <h4 className="font-semibold mb-3">Step-by-Step Instructions</h4>
                  <p className="text-sm text-muted-foreground">No specific steps provided by employer.</p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {task?.category && (
                      <Badge variant="outline" className="text-xs">{task.category}</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Proof Section */}
            <Card>
              <CardHeader>
                <CardTitle>Submit Your Work</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="proof-text">Proof of Completion (Optional)</Label>
                  <Textarea
                    id="proof-text"
                    placeholder="Describe how you completed the task..."
                    value={proofText}
                    onChange={(e) => setProofText(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proof-files">Upload Screenshots/Files (Max 5 files, 10MB each)</Label>
                  <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Supported: Images, PDFs, Documents, Videos, Audio
                    </p>
                    <Input
                      id="proof-files"
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.txt,.mp4,.avi,.mov,.wmv,.mp3,.wav,.ogg"
                      onChange={handleFileSelect}
                      className="max-w-xs mx-auto"
                    />
                  </div>
                  
                  {/* Selected Files */}
                  {proofFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Selected Files:</p>
                      {proofFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <File className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleSubmit}
                  className="w-full bg-gradient-primary"
                  size="lg"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Task for Review"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Employer Info */}
            <Card>
              <CardHeader>
                <CardTitle>Employer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">Task Creator</p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Star className="h-3 w-3 text-yellow-500 mr-1" />
                      <span>—</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Tasks</span>
                    <span className="font-medium">—</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Member Since</span>
                    <span className="font-medium">—</span>
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Profile
                </Button>
              </CardContent>
            </Card>

            {/* Task Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Task Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="font-semibold text-success">{formatINR(Number(task?.budget) || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Time Required</span>
                  <span className="font-medium">Flexible</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Slots Remaining</span>
                  <span className="font-medium">{Math.max(0, (task?.slots ?? 0) - (task?.completed_slots ?? 0))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Deadline</span>
                  <span className="font-medium">{task?.expires_at ? new Date(task.expires_at).toLocaleString() : 'Flexible'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="sm" className="w-full">
                  Report Issue
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  Contact Employer
                </Button>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/worker/jobs">
                    Find Similar Tasks
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;