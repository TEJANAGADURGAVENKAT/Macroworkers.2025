import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/layout/Navigation";
import Footer from "./components/layout/Footer";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import WorkerStatusGuard from "@/components/auth/WorkerStatusGuard";
import InterviewStatusGuard from "@/components/auth/InterviewStatusGuard";

// Auth pages
import SignIn from "./pages/auth/SignIn";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";

// Public pages
import Index from "./pages/Index";
import Employers from "./pages/Employers";
import Workers from "./pages/Workers";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Cookies from "./pages/Cookies";
import NotFound from "./pages/NotFound";

// Worker pages
import WorkerDashboard from "./pages/worker/WorkerDashboard";
import WorkerJobs from "./pages/worker/WorkerJobs";
import WorkerTasks from "./pages/worker/WorkerTasks";
import WorkerEarnings from "./pages/worker/WorkerEarnings";
import WorkerProfile from "./pages/worker/WorkerProfile";
import DocumentUpload from "./pages/worker/onboarding/DocumentUpload";
import TaskDetail from "./pages/worker/TaskDetail";
import InterviewSchedule from "./pages/worker/InterviewSchedule";

// Employer pages
import EmployerDashboard from "./pages/employer/EmployerDashboard";
import EmployerCampaigns from "./pages/employer/EmployerCampaigns";
import CreateTask from "./pages/employer/CreateTask";
import WorkerVerification from "./pages/employer/WorkerVerification";
import InterviewScheduling from "./pages/employer/InterviewScheduling";
import SubmissionsReview from "./pages/employer/SubmissionsReview";
import EmployerPayments from "./pages/employer/EmployerPayments";
import EmployerTaskDetail from "./pages/employer/EmployerTaskDetail";

// Blog pages
import BlogList from "./pages/blog/BlogList";
import BlogDetail from "./pages/blog/BlogDetail";

// Payment pages
import Payments from "./pages/Payments";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCampaigns from "./pages/admin/AdminCampaigns";
import AdminTaskDetail from "./pages/admin/AdminTaskDetail";
import AdminTaskSubmissions from "./pages/admin/AdminTaskSubmissions";
import AdminDisputes from "./pages/admin/AdminDisputes";
import AdminFinancials from "./pages/admin/AdminFinancials";
import AdminProfile from "./pages/admin/AdminProfile";
import EmployerProfile from "./pages/employer/EmployerProfile";
import TaskDetails from "./pages/employer/TaskDetails";
import SubmissionDetail from "./pages/employer/SubmissionDetail";
import RoleBasedTasks from "./pages/employer/RoleBasedTasks";
import ITTaskFormDemo from "./pages/demo/ITTaskFormDemo";
import DigitalMarketingTaskFormDemo from "./pages/demo/DigitalMarketingTaskFormDemo";
import BlockchainTaskFormDemo from "./pages/demo/BlockchainTaskFormDemo";
import SubcategoryDemo from "./pages/demo/SubcategoryDemo";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <AuthProvider>
            <div className="min-h-screen bg-background">
              <Navigation />
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Index />} />
                <Route path="/employers" element={<Employers />} />
                <Route path="/workers" element={<Workers />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/cookies" element={<Cookies />} />
                <Route path="/payments" element={<Payments />} />

                {/* Auth Routes */}
                <Route path="/signin" element={<SignIn />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* Worker Routes */}
                <Route path="/worker/onboarding/documents" element={<DocumentUpload />} />
                <Route path="/worker" element={
                  <ProtectedRoute allowedRoles={['worker']}>
                    <WorkerDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/worker/jobs" element={
                  <ProtectedRoute allowedRoles={['worker']}>
                    <WorkerStatusGuard requiresJobAccess={true}>
                      <WorkerJobs />
                    </WorkerStatusGuard>
                  </ProtectedRoute>
                } />
                <Route path="/worker/tasks" element={
                  <ProtectedRoute allowedRoles={['worker']}>
                    <WorkerStatusGuard requiresTaskSubmission={true}>
                      <WorkerTasks />
                    </WorkerStatusGuard>
                  </ProtectedRoute>
                } />
                <Route path="/worker/earnings" element={
                  <ProtectedRoute allowedRoles={['worker']}>
                    <WorkerStatusGuard requiresTaskSubmission={true}>
                      <WorkerEarnings />
                    </WorkerStatusGuard>
                  </ProtectedRoute>
                } />
                <Route path="/worker/profile" element={
                  <ProtectedRoute allowedRoles={['worker']}>
                    <WorkerProfile />
                  </ProtectedRoute>
                } />
                <Route path="/worker/task/:id" element={
                  <ProtectedRoute allowedRoles={['worker']}>
                    <WorkerStatusGuard requiresTaskSubmission={true}>
                      <TaskDetail />
                    </WorkerStatusGuard>
                  </ProtectedRoute>
                } />
                <Route path="/interview-schedule" element={
                  <ProtectedRoute allowedRoles={['worker']}>
                    <InterviewStatusGuard>
                      <InterviewSchedule />
                    </InterviewStatusGuard>
                  </ProtectedRoute>
                } />

                {/* Employer Routes */}
                <Route path="/employer" element={
                  <ProtectedRoute allowedRoles={['employer']}>
                    <EmployerDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/employer/campaigns" element={
                  <ProtectedRoute allowedRoles={['employer']}>
                    <EmployerCampaigns />
                  </ProtectedRoute>
                } />
                <Route path="/employer/create-task" element={
                  <ProtectedRoute allowedRoles={['employer']}>
                    <CreateTask />
                  </ProtectedRoute>
                } />
                <Route path="/employer/role-based-tasks" element={
                  <ProtectedRoute allowedRoles={['employer']}>
                    <RoleBasedTasks />
                  </ProtectedRoute>
                } />
                <Route path="/employer/worker-verification" element={
                  <ProtectedRoute allowedRoles={['employer']}>
                    <WorkerVerification />
                  </ProtectedRoute>
                } />
                <Route path="/employer/interview-scheduling" element={
                  <ProtectedRoute allowedRoles={['employer']}>
                    <InterviewScheduling />
                  </ProtectedRoute>
                } />
                <Route path="/employer/submissions" element={
                  <ProtectedRoute allowedRoles={['employer']}>
                    <SubmissionsReview />
                  </ProtectedRoute>
                } />
                <Route path="/employer/submissions/:id" element={
                  <ProtectedRoute allowedRoles={['employer']}>
                    <SubmissionDetail />
                  </ProtectedRoute>
                } />
                <Route path="/employer/payments" element={
                  <ProtectedRoute allowedRoles={['employer']}>
                    <EmployerPayments />
                  </ProtectedRoute>
                } />
                <Route path="/employer/task/:id" element={
                  <ProtectedRoute allowedRoles={['employer']}>
                    <TaskDetails />
                  </ProtectedRoute>
                } />
                <Route path="/employer/profile" element={
                  <ProtectedRoute allowedRoles={['employer']}>
                    <EmployerProfile />
                  </ProtectedRoute>
                } />

                {/* Blog Routes */}
                <Route path="/blogs" element={<BlogList />} />
                <Route path="/blogs/:id" element={<BlogDetail />} />

                {/* Admin Routes */}
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/users" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminUsers />
                  </ProtectedRoute>
                } />
                <Route path="/admin/campaigns" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminCampaigns />
                  </ProtectedRoute>
                } />
                <Route path="/admin/task/:id" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminTaskDetail />
                  </ProtectedRoute>
                } />
                <Route path="/admin/task/:id/submissions" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminTaskSubmissions />
                  </ProtectedRoute>
                } />
                <Route path="/admin/disputes" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDisputes />
                  </ProtectedRoute>
                } />
                <Route path="/admin/financials" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminFinancials />
                  </ProtectedRoute>
                } />
                <Route path="/admin/profile" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminProfile />
                  </ProtectedRoute>
                } />

                {/* Demo Routes */}
                <Route path="/demo/it-task-form" element={<ITTaskFormDemo />} />
                <Route path="/demo/digital-marketing-task-form" element={<DigitalMarketingTaskFormDemo />} />
                <Route path="/demo/blockchain-task-form" element={<BlockchainTaskFormDemo />} />
                <Route path="/demo/subcategories" element={<SubcategoryDemo />} />

                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Footer />
            </div>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;