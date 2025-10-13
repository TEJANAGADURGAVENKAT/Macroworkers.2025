import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import WorkerPaymentSection from "@/components/employer/WorkerPaymentSection";

const WorkerPayments = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Worker Payments</h1>
            <p className="text-muted-foreground mt-1">
              Manage and process payments for approved tasks
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/employer">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Payment Section */}
        <WorkerPaymentSection />
      </motion.div>
    </div>
  );
};

export default WorkerPayments;


