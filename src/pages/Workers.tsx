import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Search, CheckCircle, DollarSign, Star } from "lucide-react";

const Workers = () => {
  const steps = [
    {
      icon: Search,
      title: "Find Tasks",
      description: "Browse available micro-jobs that match your skills and interests."
    },
    {
      icon: CheckCircle,
      title: "Complete Work",
      description: "Follow instructions carefully and submit clear proof of completion."
    },
    {
      icon: DollarSign,
      title: "Get Paid",
      description: "Earn money quickly once your work is approved by employers."
    },
    {
      icon: Star,
      title: "Build Reputation",
      description: "Quality work leads to higher ratings and access to better-paying tasks."
    }
  ];

  const tips = [
    "Read task requirements carefully before starting",
    "Upload clear screenshots as proof of completion",
    "Maintain high quality standards for better ratings",
    "Complete tasks promptly to build a good reputation"
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold mb-4">For Employees/Workers</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Find quick tasks, submit proof, and track your progress while earning money from anywhere.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {steps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            <Card className="h-full text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto p-3 bg-gradient-primary rounded-lg w-fit mb-4">
                  <step.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle className="text-lg">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>How to Start</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Getting started is simple. Sign up, pick a task that interests you, follow the instructions carefully, and submit proof of completion.
              </p>
              <Button asChild>
                <Link to="/worker/jobs">Browse Available Tasks</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Best Practices</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {tips.map((tip, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="text-center"
      >
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Ready to Start Earning?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Join our community of employees/workers and start earning money by completing simple tasks today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link to="/register">Sign Up Now</Link>
              </Button>
              <Button variant="outline" asChild size="lg">
                <Link to="/worker/jobs">View Tasks</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Workers;