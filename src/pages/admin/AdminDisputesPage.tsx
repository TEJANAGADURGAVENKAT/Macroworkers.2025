import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  FileText,
  User,
  Calendar,
  ChevronRight,
  Home,
  Download
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
  raised_by: string;
  against?: string;
  related_task_id?: string;
  related_submission_id?: string;
  raised_by_profile?: {
    full_name: string;
    email: string;
    role: string;
  };
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

const AdminDisputesPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [resolutionDecision, setResolutionDecision] = useState<'resolved' | 'rejected' | 'under_review'>('resolved');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const filteredDisputes = disputes.filter(dispute => {
    const matchesStatus = statusFilter === 'all' || dispute.status === statusFilter;
    const matchesSearch = searchQuery === '' || 
      dispute.raised_by_profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.against_profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.dispute_id.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  useEffect(() => {
    loadDisputes();
  }, []);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('disputes')
        .select(`
          *,
          raised_by_profile:profiles!disputes_raised_by_fkey(full_name, email, role),
          against_profile:profiles!disputes_against_fkey(full_name, email, role)
        `)
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
        description: "Failed to load disputes. Please try again.",
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

  const handleStatusUpdate = async (disputeId: string, newStatus: 'under_review' | 'resolved' | 'rejected') => {
    if (!user) return;
    
    setIsProcessing(disputeId);
    
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'resolved' || newStatus === 'rejected') {
        updateData.resolved_by = user.id;
        updateData.resolved_at = new Date().toISOString();
        if (resolutionNotes.trim()) {
          updateData.resolution_notes = resolutionNotes;
        }
      }

      if (adminNotes.trim()) {
        updateData.admin_notes = adminNotes;
      }

      const { error } = await supabase
        .from('disputes')
        .update(updateData)
        .eq('id', disputeId);

      if (error) throw error;

      // Update local state
      setDisputes(prev => prev.map(dispute => 
        dispute.id === disputeId 
          ? { 
              ...dispute, 
              status: newStatus, 
              admin_notes: adminNotes || dispute.admin_notes,
              resolution_notes: resolutionNotes || dispute.resolution_notes,
              resolved_by: (newStatus === 'resolved' || newStatus === 'rejected') ? user.id : dispute.resolved_by,
              resolved_at: (newStatus === 'resolved' || newStatus === 'rejected') ? new Date().toISOString() : dispute.resolved_at
            }
          : dispute
      ));

      const statusLabels = {
        under_review: 'Under Review',
        resolved: 'Resolved',
        rejected: 'Rejected'
      };

      toast({
        title: "Status Updated",
        description: `Dispute ${selectedDispute?.dispute_id} marked as ${statusLabels[newStatus]}`,
      });

      setIsModalOpen(false);
      setIsResolveModalOpen(false);
      setAdminNotes('');
      setResolutionNotes('');
    } catch (error: any) {
      console.error('Error updating dispute status:', error);
      toast({
        title: "Error",
        description: "Failed to update dispute status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleResolveDispute = async () => {
    if (!selectedDispute) return;
    await handleStatusUpdate(selectedDispute.id, resolutionDecision);
  };

  const openResolveModal = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setAdminNotes(dispute.admin_notes || '');
    setResolutionNotes(dispute.resolution_notes || '');
    setResolutionDecision('resolved');
    setIsResolveModalOpen(true);
  };

  const openDisputeModal = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setAdminNotes(dispute.admin_notes || '');
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
          <span className="text-gray-900 font-medium">Disputes</span>
        </motion.div>

        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dispute Management</h1>
          <p className="text-gray-600">Manage and resolve platform disputes between workers and employers</p>
        </motion.div>

        {/* Filters and Search */}
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
                placeholder="Search by user name, task title, or dispute ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
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

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">Raised by:</span>
                              <span className="font-medium">{dispute.raised_by_profile?.full_name || 'Unknown'}</span>
                              <Badge variant="outline" className="text-xs">
                                {dispute.raised_by_profile?.role || 'unknown'}
                              </Badge>
                            </div>
                            {dispute.against_profile && (
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">Against:</span>
                                <span className="font-medium">{dispute.against_profile.full_name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {dispute.against_profile.role}
                                </Badge>
                              </div>
                            )}
                          </div>

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
                            <span>View</span>
                          </Button>
                          
                          {dispute.status === 'open' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusUpdate(dispute.id, 'under_review')}
                              className="flex items-center space-x-2 text-amber-600 hover:text-amber-700"
                            >
                              <Clock className="w-4 h-4" />
                              <span>Review</span>
                            </Button>
                          )}
                          
                          {dispute.status === 'under_review' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openResolveModal(dispute)}
                              className="flex items-center space-x-2 text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Resolve</span>
                            </Button>
                          )}
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
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No disputes found</h3>
            <p className="text-gray-600">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'No disputes have been reported yet.'
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
                Detailed information and management options for this dispute.
              </DialogDescription>
            </DialogHeader>

            {selectedDispute && (
              <div className="space-y-6">
                {/* Dispute Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Raised By</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="font-medium">{selectedDispute.raised_by_profile?.full_name || 'Unknown'}</span>
                        <Badge variant="outline">{selectedDispute.raised_by_profile?.role || 'unknown'}</Badge>
                      </div>
                    </div>
                    {selectedDispute.against_profile && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Against</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="font-medium">{selectedDispute.against_profile.full_name}</span>
                          <Badge variant="outline">{selectedDispute.against_profile.role}</Badge>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Title</Label>
                      <p className="mt-1 font-medium">{selectedDispute.title}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Created</Label>
                      <p className="mt-1 text-sm text-gray-600">{formatDate(selectedDispute.created_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Description</Label>
                  <p className="mt-2 p-4 bg-gray-50 rounded-lg text-sm">{selectedDispute.description}</p>
                </div>

                {/* Attachments */}
                {selectedDispute.attachments && selectedDispute.attachments.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Supporting Documents</Label>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3">
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

                {/* Admin Notes */}
                <div>
                  <Label htmlFor="adminNotes" className="text-sm font-medium text-gray-700">
                    Admin Notes
                  </Label>
                  <Textarea
                    id="adminNotes"
                    placeholder="Add notes about this dispute..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t">
                  {selectedDispute.status === 'open' && (
                    <Button
                      onClick={() => handleStatusUpdate(selectedDispute.id, 'under_review')}
                      className="flex items-center space-x-2"
                    >
                      <Clock className="w-4 h-4" />
                      <span>Mark as Under Review</span>
                    </Button>
                  )}
                  
                  {selectedDispute.status === 'under_review' && (
                    <Button
                      onClick={() => openResolveModal(selectedDispute)}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Resolve Dispute</span>
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="ml-auto"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Resolve Dispute Modal */}
        <Dialog open={isResolveModalOpen} onOpenChange={setIsResolveModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Resolve Dispute #{selectedDispute?.dispute_id}</span>
              </DialogTitle>
              <DialogDescription>
                Provide resolution details and make a final decision on this dispute.
              </DialogDescription>
            </DialogHeader>

            {selectedDispute && (
              <div className="space-y-6">
                {/* Dispute Summary */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Dispute Summary</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Type:</span> {getTypeLabel(selectedDispute.dispute_type)}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Raised by:</span> {selectedDispute.raised_by_profile?.full_name || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Description:</span> {truncateText(selectedDispute.description, 150)}
                  </p>
                </div>

                {/* Decision Selection */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">
                    Decision
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        resolutionDecision === 'resolved'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                      onClick={() => setResolutionDecision('resolved')}
                    >
                      <div className="flex items-center space-x-2">
                        <CheckCircle className={`w-5 h-5 ${
                          resolutionDecision === 'resolved' ? 'text-green-600' : 'text-gray-400'
                        }`} />
                        <span className={`font-medium ${
                          resolutionDecision === 'resolved' ? 'text-green-700' : 'text-gray-700'
                        }`}>
                          Resolved
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Dispute has been resolved in favor of the complainant
                      </p>
                    </div>

                    <div
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        resolutionDecision === 'rejected'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-red-300'
                      }`}
                      onClick={() => setResolutionDecision('rejected')}
                    >
                      <div className="flex items-center space-x-2">
                        <XCircle className={`w-5 h-5 ${
                          resolutionDecision === 'rejected' ? 'text-red-600' : 'text-gray-400'
                        }`} />
                        <span className={`font-medium ${
                          resolutionDecision === 'rejected' ? 'text-red-700' : 'text-gray-700'
                        }`}>
                          Rejected
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Dispute has been reviewed and rejected
                      </p>
                    </div>

                    <div
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        resolutionDecision === 'under_review'
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-gray-200 hover:border-amber-300'
                      }`}
                      onClick={() => setResolutionDecision('under_review')}
                    >
                      <div className="flex items-center space-x-2">
                        <Clock className={`w-5 h-5 ${
                          resolutionDecision === 'under_review' ? 'text-amber-600' : 'text-gray-400'
                        }`} />
                        <span className={`font-medium ${
                          resolutionDecision === 'under_review' ? 'text-amber-700' : 'text-gray-700'
                        }`}>
                          Under Review
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Keep dispute under review for further investigation
                      </p>
                    </div>
                  </div>
                </div>

                {/* Resolution Notes */}
                <div>
                  <Label htmlFor="resolutionNotes" className="text-sm font-medium text-gray-700">
                    Resolution Notes
                  </Label>
                  <Textarea
                    id="resolutionNotes"
                    placeholder="Provide detailed resolution notes that will be visible to both parties..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    These notes will be visible to both the worker and employer involved in the dispute.
                  </p>
                </div>

                {/* Admin Notes (Internal) */}
                <div>
                  <Label htmlFor="adminNotes" className="text-sm font-medium text-gray-700">
                    Internal Admin Notes (Optional)
                  </Label>
                  <Textarea
                    id="adminNotes"
                    placeholder="Add internal notes for admin reference only..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="mt-2"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    These notes are for admin reference only and will not be visible to users.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setIsResolveModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleResolveDispute}
                    disabled={isProcessing === selectedDispute.id}
                    className={`flex items-center space-x-2 ${
                      resolutionDecision === 'resolved' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : resolutionDecision === 'rejected'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-amber-600 hover:bg-amber-700'
                    }`}
                  >
                    {isProcessing === selectedDispute.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        {resolutionDecision === 'resolved' && <CheckCircle className="w-4 h-4" />}
                        {resolutionDecision === 'rejected' && <XCircle className="w-4 h-4" />}
                        {resolutionDecision === 'under_review' && <Clock className="w-4 h-4" />}
                      </>
                    )}
                    <span>
                      {isProcessing === selectedDispute.id 
                        ? 'Processing...' 
                        : `Mark as ${resolutionDecision === 'resolved' ? 'Resolved' : resolutionDecision === 'rejected' ? 'Rejected' : 'Under Review'}`
                      }
                    </span>
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

export default AdminDisputesPage;
