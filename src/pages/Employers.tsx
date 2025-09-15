import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users, Target, DollarSign, Clock } from "lucide-react";

const Employers = () => {
  const features = [
    {
      icon: Target,
      title: "Create Task Templates",
      description: "Build campaigns with details, targeting, and payment slots through our intuitive wizard."
    },
    {
      icon: Users,
      title: "Quality Moderation",
      description: "Our system ensures quality control before your tasks go live to employees/workers."
    },
    {
      icon: DollarSign,
      title: "Transparent Pricing",
      description: "Clear fee structure with bulk review and approve/reject actions for efficiency."
    },
    {
      icon: Clock,
      title: "Fast Turnaround",
      description: "Get your tasks completed quickly with our global network of skilled employees/workers."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold mb-4">For Employers</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Launch campaigns, review submissions, and pay employees/workers with transparent fees and streamlined workflows.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-primary rounded-lg">
                    <feature.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-center"
      >
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Ready to Get Started?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Join thousands of employers who trust Macroworkers to get their micro-jobs completed efficiently.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link to="/employer/create-task">Post Your First Task</Link>
              </Button>
              <Button variant="outline" asChild size="lg">
                <Link to="/register">Create Account</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Employers;