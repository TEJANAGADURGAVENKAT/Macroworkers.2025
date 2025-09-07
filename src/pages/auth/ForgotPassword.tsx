import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Mail, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { error } = await resetPassword(email);
    
    if (!error) {
      setIsSubmitted(true);
    }
    
    setIsSubmitting(false);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="bg-gradient-card border-0 shadow-lg">
            <CardHeader className="text-center space-y-4">
              <div className="p-2 bg-success/10 rounded-lg w-fit mx-auto">
                <Mail className="h-8 w-8 text-success" />
              </div>
              <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
              <p className="text-muted-foreground">
                We've sent password reset instructions to your email address.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full bg-gradient-primary">
                <Link to="/signin">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="bg-gradient-card border-0 shadow-lg">
          <CardHeader className="text-center space-y-4">
            <Link to="/" className="flex items-center justify-center space-x-2 mb-2">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Macroworkers
              </span>
            </Link>
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <p className="text-muted-foreground">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:bg-primary-dark"
                size="lg"
                disabled={isSubmitting || !email}
              >
                {isSubmitting ? "Sending..." : "Send Reset Instructions"}
              </Button>
            </form>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Remember your password? </span>
              <Link to="/signin" className="text-primary hover:underline font-medium">
                Sign in here
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;