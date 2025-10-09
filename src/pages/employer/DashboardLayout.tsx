import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { 
  Home,
  Plus,
  FileText,
  Briefcase,
  CreditCard,
  User,
  Upload,
  Clock,
  XCircle,
  CheckCircle,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { profile, user } = useAuth();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Get employer status from profile
  const employerStatus = profile?.worker_status || 'verification_pending';
  const isApproved = employerStatus === 'active_employee';
  const isPending = employerStatus === 'verification_pending' || employerStatus === 'document_upload_pending';
  const isRejected = employerStatus === 'rejected';

  // Full sidebar items for approved employers
  const fullSidebarItems = [
    { 
      title: "Home", 
      url: "/employer", 
      icon: Home,
      description: "Dashboard overview"
    },
    { 
      title: "Create Task", 
      url: "/employer/create-task", 
      icon: Plus,
      description: "Post new tasks"
    },
    { 
      title: "My Tasks", 
      url: "/employer/campaigns", 
      icon: FileText,
      description: "Manage your tasks"
    },
    { 
      title: "Payments", 
      url: "/employer/payments", 
      icon: CreditCard,
      description: "Payment history"
    },
    { 
      title: "Raise Dispute", 
      url: "/employer/disputes/raise", 
      icon: AlertTriangle,
      description: "Submit a complaint"
    },
    { 
      title: "My Disputes", 
      url: "/employer/disputes", 
      icon: MessageSquare,
      description: "View dispute status"
    },
    { 
      title: "Profile", 
      url: "/employer/profile", 
      icon: User,
      description: "Account settings"
    }
  ];

  // Limited sidebar items for pending/rejected employers
  const limitedSidebarItems = [
    { 
      title: "Home", 
      url: "/employer", 
      icon: Home,
      description: "Dashboard overview"
    },
    { 
      title: "Documents Upload", 
      url: "/employer/verify", 
      icon: Upload,
      description: "Submit verification documents"
    },
    { 
      title: "Raise Dispute", 
      url: "/employer/disputes/raise", 
      icon: AlertTriangle,
      description: "Submit a complaint"
    },
    { 
      title: "My Disputes", 
      url: "/employer/disputes", 
      icon: MessageSquare,
      description: "View dispute status"
    },
    { 
      title: "Profile", 
      url: "/employer/profile", 
      icon: User,
      description: "Account settings"
    }
  ];

  const sidebarItems = isApproved ? fullSidebarItems : limitedSidebarItems;

  const getStatusBadge = () => {
    switch (employerStatus) {
      case 'active_employee':
        return {
          label: 'Verified',
          variant: 'secondary' as const,
          className: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle
        };
      case 'verification_pending':
      case 'document_upload_pending':
        return {
          label: 'Under Review',
          variant: 'secondary' as const,
          className: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: Clock
        };
      case 'rejected':
        return {
          label: 'Rejected',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-200',
          icon: XCircle
        };
      default:
        return {
          label: 'Unknown',
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: AlertTriangle
        };
    }
  };

  const getStatusMessage = () => {
    if (isPending) {
      return {
        title: "Verification Under Review",
        description: "Your verification is under review. You'll get full access once approved.",
        icon: Clock,
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200"
      };
    }
    
    if (isRejected) {
      return {
        title: "Verification Rejected",
        description: "Your documents were rejected. Please re-upload and await approval.",
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200"
      };
    }

    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar className="border-r bg-white min-w-[280px]">
          <SidebarContent>
            {/* Header */}
            <div className="p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Macroworkers</h2>
                  <p className="text-sm text-gray-500">Employer Portal</p>
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Status</span>
                {(() => {
                  const badge = getStatusBadge();
                  const BadgeIcon = badge.icon;
                  return (
                    <Badge variant={badge.variant} className={badge.className}>
                      <BadgeIcon className="w-3 h-3 mr-1" />
                      {badge.label}
                    </Badge>
                  );
                })()}
              </div>
            </div>

            {/* Navigation Menu */}
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.url;
                    
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={isActive}
                          className="w-full justify-start"
                        >
                          <Link to={item.url} className="flex items-center space-x-3 p-3 min-w-0">
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="font-medium text-sm text-gray-900 truncate">{item.title}</div>
                              <div className="text-xs text-gray-500 mt-0.5 truncate">{item.description}</div>
                            </div>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Access Level Info */}
            {!isApproved && (
              <SidebarGroup>
                <SidebarGroupContent>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mx-4 mb-4">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">Limited Access</p>
                        <p className="text-xs text-amber-700 mt-1">
                          Complete verification to unlock all features
                        </p>
                      </div>
                    </div>
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <header className="bg-white border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {location.pathname === '/employer' ? 'Dashboard' : 
                     location.pathname.includes('/create-task') ? 'Create Task' :
                     location.pathname.includes('/tasks') ? 'My Tasks' :
                     location.pathname.includes('/campaigns') ? 'Campaigns' :
                     location.pathname.includes('/payments') ? 'Payments' :
                     location.pathname.includes('/profile') ? 'Profile' :
                     location.pathname.includes('/verify') ? 'Document Upload' :
                     'Dashboard'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Welcome back, {profile?.full_name || user?.email || 'Employer'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {!isApproved && (
                  <Button 
                    asChild 
                    variant="outline" 
                    size="sm"
                    className="text-amber-600 border-amber-200 hover:bg-amber-50"
                  >
                    <Link to="/employer/verify">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Documents
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-6">
            <AnimatePresence mode="wait">
              {!isApproved && location.pathname === '/employer' ? (
                <motion.div
                  key="status-message"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {(() => {
                    const message = getStatusMessage();
                    if (!message) return null;
                    
                    const MessageIcon = message.icon;
                    
                    return (
                      <Card className={`${message.bgColor} ${message.borderColor} border-2`}>
                        <CardHeader className="text-center">
                          <div className="mx-auto w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
                            <MessageIcon className={`w-8 h-8 ${message.color}`} />
                          </div>
                          <CardTitle className={message.color}>
                            {message.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-center space-y-4">
                          <p className="text-gray-700 max-w-md mx-auto">
                            {message.description}
                          </p>
                          
                          {isRejected && (
                            <Button asChild className="mt-4">
                              <Link to="/employer/verify">
                                <Upload className="w-4 h-4 mr-2" />
                                Re-upload Documents
                              </Link>
                            </Button>
                          )}
                          
                          {isPending && (
                            <div className="mt-4 p-4 bg-white rounded-lg border">
                              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                                <Clock className="w-4 h-4" />
                                <span>Review typically takes 1-2 business days</span>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })()}
                </motion.div>
              ) : (
                <motion.div
                  key="dashboard-content"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {children || <Outlet />}
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
