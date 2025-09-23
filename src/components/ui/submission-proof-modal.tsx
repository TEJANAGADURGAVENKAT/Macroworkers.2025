import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Image, 
  File, 
  Download, 
  ExternalLink, 
  Loader2,
  X,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/utils";

interface SubmissionProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: {
    id: string;
    task_id: string;
    worker_id: string;
    proof_text: string | null;
    proof_files: string[] | null;
    proof_type?: 'text' | 'file' | 'both';
    status: 'pending' | 'approved' | 'rejected';
    submitted_at: string;
    reviewed_at: string | null;
    reviewer_notes: string | null;
    task: {
      id: string;
      title: string;
      budget: number;
      created_by: string;
    };
  } | null;
}

interface FileWithUrl {
  name: string;
  url: string;
  type: string;
  size?: number;
}

export function SubmissionProofModal({ isOpen, onClose, submission }: SubmissionProofModalProps) {
  const [files, setFiles] = useState<FileWithUrl[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && submission?.proof_files?.length) {
      loadFileUrls();
    } else {
      setFiles([]);
      setError(null);
    }
  }, [isOpen, submission]);

  const loadFileUrls = async () => {
    if (!submission?.proof_files?.length) return;

    setLoading(true);
    setError(null);

    try {
      const filePromises = submission.proof_files.map(async (fileName) => {
        try {
          console.log(`Attempting to get signed URL for: ${submission.worker_id}/${fileName}`);
          
          const { data, error } = await supabase.storage
            .from('submission-files')
            .createSignedUrl(`${submission.worker_id}/${fileName}`, 3600); // 1 hour expiry

          if (error) {
            console.error(`Error getting signed URL for ${fileName}:`, error);
            return {
              name: fileName,
              url: '',
              type: 'unknown',
              error: error.message
            };
          }

          console.log(`Successfully got signed URL for ${fileName}:`, data.signedUrl);
          return {
            name: fileName,
            url: data.signedUrl,
            type: getFileType(fileName),
            size: 0 // We don't have size info in the current setup
          };
        } catch (err) {
          console.error(`Error processing file ${fileName}:`, err);
          return {
            name: fileName,
            url: '',
            type: 'unknown',
            error: 'Failed to load file'
          };
        }
      });

      const fileResults = await Promise.all(filePromises);
      console.log('File results:', fileResults);
      setFiles(fileResults);
    } catch (err: any) {
      console.error('Error loading files:', err);
      setError(err?.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const getFileType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) return 'image';
    if (['pdf'].includes(extension || '')) return 'pdf';
    if (['doc', 'docx'].includes(extension || '')) return 'document';
    if (['txt'].includes(extension || '')) return 'text';
    return 'file';
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'pdf': return <File className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'text': return <FileText className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <X className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  if (!submission) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon(submission.status)}
            Submission Proof - {submission.task?.title || 'Unknown Task'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* Submission Info */}
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Task:</span> {submission.task?.title || 'Unknown Task'}
              </div>
              <div>
                <span className="font-medium">Budget:</span> {formatINR(submission.task?.budget || 0)}
              </div>
              <div>
                <span className="font-medium">Submitted:</span> {formatTimeAgo(submission.submitted_at)}
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <Badge 
                  variant="secondary" 
                  className={`ml-2 ${
                    submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                    submission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {submission.status}
                </Badge>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-6">
              {/* Text Proof */}
              {submission.proof_text && (
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Text Proof
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-4 border">
                    <p className="whitespace-pre-wrap">{submission.proof_text}</p>
                  </div>
                </div>
              )}

              {/* File Proofs */}
              {submission.proof_files && submission.proof_files.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <File className="h-4 w-4" />
                    File Proofs ({submission.proof_files.length})
                  </h3>
                  
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading files...</span>
                    </div>
                  ) : error ? (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                      <p className="text-destructive text-sm">{error}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {files.map((file, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getFileIcon(file.type)}
                              <div>
                                <p className="font-medium">{file.name}</p>
                                <p className="text-sm text-muted-foreground capitalize">
                                  {file.type} file
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {file.url && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(file.url, '_blank')}
                                  >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = file.url;
                                      link.download = file.name;
                                      link.click();
                                    }}
                                  >
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                  </Button>
                                </>
                              )}
                              {file.error && (
                                <Badge variant="destructive" className="text-xs">
                                  {file.error}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {/* Preview for images */}
                          {file.type === 'image' && file.url && (
                            <div className="mt-3">
                              <img 
                                src={file.url} 
                                alt={file.name}
                                className="max-w-full h-auto max-h-64 rounded border"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reviewer Notes */}
              {submission.reviewer_notes && (
                <div>
                  <h3 className="font-semibold mb-2">Reviewer Notes</h3>
                  <div className="bg-muted/30 rounded-lg p-4 border">
                    <p className="text-sm">{submission.reviewer_notes}</p>
                    {submission.reviewed_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Reviewed: {formatTimeAgo(submission.reviewed_at)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* No Proof Warning */}
              {!submission.proof_text && (!submission.proof_files || submission.proof_files.length === 0) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    No proof provided for this submission.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          <Separator className="my-4" />
          
          <div className="flex justify-end">
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
