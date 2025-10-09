import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
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
  Home
} from 'lucide-react';

interface Dispute {
  id: string;
  disputeId: string;
  type: 'payment' | 'quality' | 'rejection' | 'other';
  raisedBy: {
    id: string;
    name: string;
    role: 'worker' | 'employer';
  };
  against: {
    id: string;
    name: string;
    role: 'worker' | 'employer';
  };
  taskTitle: string;
  description: string;
  status: 'open' | 'under_review' | 'resolved' | 'rejected';
  createdDate: string;
  proofAttachments: string[];
  adminNotes?: string;
}

const mockDisputes: Dispute[] = [
  {
    id: '1',
    disputeId: 'A12B3',
    type: 'payment',
    raisedBy: { id: 'w1', name: 'Sarah Chen', role: 'worker' },
    against: { id: 'e1', name: 'TechStart Inc', role: 'employer' },
    taskTitle: 'Website Redesign Project',
    description: 'Payment was promised within 3 days but it has been 2 weeks. The employer is not responding to messages.',
    status: 'open',
    createdDate: '2024-01-15T10:30:00Z',
    proofAttachments: ['payment_screenshot.png', 'chat_logs.pdf']
  },
  {
    id: '2',
    disputeId: 'B45C6',
    type: 'quality',
    raisedBy: { id: 'e2', name: 'Digital Agency', role: 'employer' },
    against: { id: 'w2', name: 'Mike Johnson', role: 'worker' },
    taskTitle: 'Logo Design Task',
    description: 'The delivered logo does not match the requirements. The colors are wrong and the design is not professional.',
    status: 'under_review',
    createdDate: '2024-01-14T14:20:00Z',
    proofAttachments: ['requirements.pdf', 'delivered_logo.png', 'feedback_email.pdf'],
    adminNotes: 'Reviewing the original requirements and delivered work. Need to check if specifications were clear.'
  },
  {
    id: '3',
    disputeId: 'C78D9',
    type: 'rejection',
    raisedBy: { id: 'w3', name: 'Emma Wilson', role: 'worker' },
    against: { id: 'e3', name: 'StartupXYZ', role: 'employer' },
    taskTitle: 'Content Writing Assignment',
    description: 'My submission was rejected without proper feedback. The employer said the work was good initially but then rejected it.',
    status: 'resolved',
    createdDate: '2024-01-13T09:15:00Z',
    proofAttachments: ['submission.docx', 'approval_email.png'],
    adminNotes: 'Resolved in favor of worker. Employer provided unclear feedback. Payment processed.'
  },
  {
    id: '4',
    disputeId: 'D01E2',
    type: 'other',
    raisedBy: { id: 'e4', name: 'Marketing Pro', role: 'employer' },
    against: { id: 'w4', name: 'Alex Rodriguez', role: 'worker' },
    taskTitle: 'Social Media Campaign',
    description: 'Worker shared confidential campaign details with competitors. This is a serious breach of contract.',
    status: 'rejected',
    createdDate: '2024-01-12T16:45:00Z',
    proofAttachments: ['confidential_agreement.pdf', 'evidence_screenshots.png'],
    adminNotes: 'Investigation completed. No evidence of breach found. Dispute rejected.'
  },
  {
    id: '5',
    disputeId: 'E34F5',
    type: 'payment',
    raisedBy: { id: 'w5', name: 'David Kim', role: 'worker' },
    against: { id: 'e5', name: 'E-commerce Solutions', role: 'employer' },
    taskTitle: 'Mobile App Development',
    description: 'Partial payment received but remaining amount is overdue. Need assistance to recover the balance.',
    status: 'open',
    createdDate: '2024-01-11T11:30:00Z',
    proofAttachments: ['partial_payment_receipt.png', 'contract.pdf']
  }
];

const DisputeManagement = () => {
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<Dispute[]>(mockDisputes);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState<string>('');

  const filteredDisputes = useMemo(() => {
    return disputes.filter(dispute => {
      const matchesStatus = statusFilter === 'all' || dispute.status === statusFilter;
      const matchesSearch = searchQuery === '' || 
        dispute.raisedBy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dispute.against.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dispute.taskTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dispute.disputeId.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesStatus && matchesSearch;
    });
  }, [disputes, statusFilter, searchQuery]);

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
      other: '📋'
    };
    return typeIcons[type as keyof typeof typeIcons] || '📋';
  };

  const getTypeLabel = (type: string) => {
    const typeLabels = {
      payment: 'Payment',
      quality: 'Quality',
      rejection: 'Rejection',
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

  const handleStatusUpdate = (disputeId: string, newStatus: 'under_review' | 'resolved' | 'rejected') => {
    setDisputes(prev => prev.map(dispute => 
      dispute.id === disputeId 
        ? { ...dispute, status: newStatus, adminNotes: adminNotes || dispute.adminNotes }
        : dispute
    ));

    const statusLabels = {
      under_review: 'Under Review',
      resolved: 'Resolved',
      rejected: 'Rejected'
    };

    toast({
      title: "Status Updated",
      description: `Dispute ${selectedDispute?.disputeId} marked as ${statusLabels[newStatus]}`,
    });

    setIsModalOpen(false);
    setAdminNotes('');
  };

  const openDisputeModal = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setAdminNotes(dispute.adminNotes || '');
    setIsModalOpen(true);
  };

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
                            <span className="text-2xl">{getTypeIcon(dispute.type)}</span>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-lg">#{dispute.disputeId}</h3>
                                <Badge variant={statusBadge.variant} className={statusBadge.className}>
                                  {statusBadge.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">{getTypeLabel(dispute.type)} Dispute</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">Raised by:</span>
                              <span className="font-medium">{dispute.raisedBy.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {dispute.raisedBy.role}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">Against:</span>
                              <span className="font-medium">{dispute.against.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {dispute.against.role}
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="font-medium text-gray-900">{dispute.taskTitle}</p>
                            <p className="text-gray-600 text-sm">{truncateText(dispute.description)}</p>
                          </div>

                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>Created {formatDate(dispute.createdDate)}</span>
                            {dispute.proofAttachments.length > 0 && (
                              <>
                                <span>•</span>
                                <FileText className="w-4 h-4" />
                                <span>{dispute.proofAttachments.length} attachment(s)</span>
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
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusUpdate(dispute.id, 'resolved')}
                                className="flex items-center space-x-2 text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="w-4 h-4" />
                                <span>Resolve</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusUpdate(dispute.id, 'rejected')}
                                className="flex items-center space-x-2 text-red-600 hover:text-red-700"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>Reject</span>
                              </Button>
                            </>
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
        {filteredDisputes.length === 0 && (
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
                <span className="text-2xl">{selectedDispute && getTypeIcon(selectedDispute.type)}</span>
                <span>Dispute #{selectedDispute?.disputeId}</span>
                {selectedDispute && (
                  <Badge 
                    variant={getStatusBadge(selectedDispute.status).variant} 
                    className={getStatusBadge(selectedDispute.status).className}
                  >
                    {getStatusBadge(selectedDispute.status).label}
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>

            {selectedDispute && (
              <div className="space-y-6">
                {/* Dispute Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Raised By</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="font-medium">{selectedDispute.raisedBy.name}</span>
                        <Badge variant="outline">{selectedDispute.raisedBy.role}</Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Against</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="font-medium">{selectedDispute.against.name}</span>
                        <Badge variant="outline">{selectedDispute.against.role}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Task</Label>
                      <p className="mt-1 font-medium">{selectedDispute.taskTitle}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Created</Label>
                      <p className="mt-1 text-sm text-gray-600">{formatDate(selectedDispute.createdDate)}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Description</Label>
                  <p className="mt-2 p-4 bg-gray-50 rounded-lg text-sm">{selectedDispute.description}</p>
                </div>

                {/* Proof Attachments */}
                {selectedDispute.proofAttachments.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Proof Attachments</Label>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedDispute.proofAttachments.map((attachment, index) => (
                        <div key={index} className="p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium truncate">{attachment}</span>
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
                    <>
                      <Button
                        onClick={() => handleStatusUpdate(selectedDispute.id, 'resolved')}
                        className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Mark as Resolved</span>
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleStatusUpdate(selectedDispute.id, 'rejected')}
                        className="flex items-center space-x-2"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject Dispute</span>
                      </Button>
                    </>
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
      </div>
    </div>
  );
};

export default DisputeManagement;


