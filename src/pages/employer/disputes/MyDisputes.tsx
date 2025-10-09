import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  FileText,
  Calendar,
  ChevronRight,
  Home,
  Download,
  MessageSquare,
  User
} from 'lucide-react';

interface Dispute {
  id: string;
  dispute_id: string;
  dispute_type: string;
  title: string;
  description: string;
  status: 'open' | 'under_review' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  admin_notes?: string;
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  against?: string;
  related_task_id?: string;
  related_submission_id?: string;
  against_profile?: {
    full_name: string;
    email: string;
    role: string;
  };
  attachments?: Array<{
    id: string;
    file_name: string;
    file_path: string;
    file_size: number;
  }>;
}

const MyDisputes = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredDisputes = disputes.filter(dispute => {
    const matchesSearch = searchQuery === '' || 
      dispute.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.dispute_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  useEffect(() => {
    if (user) {
      loadMyDisputes();
    }
  }, [user]);

  const loadMyDisputes = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('disputes')
        .select(`
          *,
          against_profile:profiles!disputes_against_fkey(full_name, email, role)
        `)
        .eq('raised_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load attachments for each dispute
      const disputesWithAttachments = await Promise.all(
        (data || []).map(async (dispute) => {
          const { data: attachments } = await supabase
            .from('dispute_attachments')
            .select('id, file_name, file_path, file_size')
            .eq('dispute_id', dispute.id);

          return {
            ...dispute,
            attachments: attachments || []
          };
        })
      );

      setDisputes(disputesWithAttachments);
    } catch (error: any) {
      console.error('Error loading disputes:', error);
      toast({
        title: "Error",
        description: "Failed to load your disputes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { label: 'Open', variant: 'default' as const, className: 'bg-blue-100 text-blue-800 border-blue-200' },
      under_review: { label: 'Under Review', variant: 'secondary' as const, className: 'bg-amber-100 text-amber-800 border-amber-200' },
      resolved: { label: 'Resolved', variant: 'secondary' as const, className: 'bg-green-100 text-green-800 border-green-200' },
      rejected: { label: 'Rejected', variant: 'destructive' as const, className: 'bg-red-100 text-red-800 border-red-200' }
    };
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
  };

  const getTypeIcon = (type: string) => {
    const typeIcons = {
      payment: '💰',
      quality: '⭐',
      rejection: '❌',
      behavior: '👤',
      contract: '📋',
      other: '📋'
    };
    return typeIcons[type as keyof typeof typeIcons] || '📋';
  };

  const getTypeLabel = (type: string) => {
    const typeLabels = {
      payment: 'Payment',
      quality: 'Quality',
      rejection: 'Rejection',
      behavior: 'Behavior',
      contract: 'Contract',
      other: 'Other'
    };
    return typeLabels[type as keyof typeof typeLabels] || 'Other';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const openDisputeModal = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setIsModalOpen(true);
  };

  const handleDownloadAttachment = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('dispute-attachments')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: `${fileName} is being downloaded.`,
      });
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download file. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusBanner = (status: string) => {
    switch (status) {
      case 'resolved':
        return (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">Your dispute has been resolved by the admin.</span>
            </div>
          </div>
        );
      case 'rejected':
        return (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-800">Your dispute was reviewed and rejected by the admin.</span>
            </div>
          </div>
        );
      case 'under_review':
        return (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span className="font-medium text-amber-800">Your dispute is currently under admin review.</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-2 text-sm text-gray-600 mb-6"
        >
          <Home className="w-4 h-4" />
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">My Disputes</span>
        </motion.div>

        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Disputes</h1>
          <p className="text-gray-600">Track the status of disputes you have raised</p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by dispute ID, title, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </motion.div>

        {/* Disputes Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid gap-6"
        >
          <AnimatePresence>
            {filteredDisputes.map((dispute, index) => {
              const statusBadge = getStatusBadge(dispute.status);
              return (
                <motion.div
                  key={dispute.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow duration-200">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* Left Section - Dispute Info */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{getTypeIcon(dispute.dispute_type)}</span>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-lg">#{dispute.dispute_id}</h3>
                                <Badge variant={statusBadge.variant} className={statusBadge.className}>
                                  {statusBadge.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">{getTypeLabel(dispute.dispute_type)} Dispute</p>
                            </div>
                          </div>

                          {dispute.against_profile && (
                            <div className="flex items-center space-x-2 text-sm">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">Against:</span>
                              <span className="font-medium">{dispute.against_profile.full_name}</span>
                              <Badge variant="outline" className="text-xs">
                                {dispute.against_profile.role}
                              </Badge>
                            </div>
                          )}

                          <div className="space-y-2">
                            <p className="font-medium text-gray-900">{dispute.title}</p>
                            <p className="text-gray-600 text-sm">{truncateText(dispute.description)}</p>
                          </div>

                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>Created {formatDate(dispute.created_at)}</span>
                            {dispute.attachments && dispute.attachments.length > 0 && (
                              <>
                                <span>•</span>
                                <FileText className="w-4 h-4" />
                                <span>{dispute.attachments.length} attachment(s)</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Right Section - Actions */}
                        <div className="flex flex-col sm:flex-row gap-2 lg:flex-col">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDisputeModal(dispute)}
                            className="flex items-center space-x-2"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Details</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filteredDisputes.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No disputes found</h3>
            <p className="text-gray-600">
              {searchQuery 
                ? 'Try adjusting your search criteria.'
                : 'You haven\'t raised any disputes yet.'
              }
            </p>
          </motion.div>
        )}

        {/* Dispute Detail Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <span className="text-2xl">{selectedDispute && getTypeIcon(selectedDispute.dispute_type)}</span>
                <span>Dispute #{selectedDispute?.dispute_id}</span>
                {selectedDispute && (
                  <Badge 
                    variant={getStatusBadge(selectedDispute.status).variant} 
                    className={getStatusBadge(selectedDispute.status).className}
                  >
                    {getStatusBadge(selectedDispute.status).label}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                Detailed information about your dispute and its current status.
              </DialogDescription>
            </DialogHeader>

            {selectedDispute && (
              <div className="space-y-6">
                {/* Status Banner */}
                {getStatusBanner(selectedDispute.status)}

                {/* Dispute Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Dispute Type</h4>
                      <p className="text-sm text-gray-900">{getTypeLabel(selectedDispute.dispute_type)}</p>
                    </div>
                    {selectedDispute.against_profile && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Against</h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{selectedDispute.against_profile.full_name}</span>
                          <Badge variant="outline" className="text-xs">
                            {selectedDispute.against_profile.role}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Created</h4>
                      <p className="text-sm text-gray-600">{formatDate(selectedDispute.created_at)}</p>
                    </div>
                    {selectedDispute.resolved_at && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Resolved</h4>
                        <p className="text-sm text-gray-600">{formatDate(selectedDispute.resolved_at)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                  <p className="p-4 bg-gray-50 rounded-lg text-sm">{selectedDispute.description}</p>
                </div>

                {/* Attachments */}
                {selectedDispute.attachments && selectedDispute.attachments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Supporting Documents</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedDispute.attachments.map((attachment, index) => (
                        <div key={index} className="p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <FileText className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium truncate">{attachment.file_name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadAttachment(attachment.file_path, attachment.file_name)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Resolution Notes */}
                {selectedDispute.resolution_notes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Admin Resolution</h4>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-gray-900">{selectedDispute.resolution_notes}</p>
                    </div>
                  </div>
                )}

                {/* Close Button */}
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MyDisputes;
