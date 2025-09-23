import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Zap, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  Users, 
  Briefcase,
  ArrowLeft
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Register = () => {
  const navigate = useNavigate();
  const { signUp, user, profile, loading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    userType: "" as 'employer' | 'worker' | '',
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    category: "",
    agreeToTerms: false
  });
  const [errors, setErrors] = useState({
    passwordMatch: "",
    phone: "",
    required: ""
  });

  // Redirect authenticated users
  useEffect(() => {
    if (user && profile && !loading) {
      const dashboardRoute = profile.role === 'admin' ? '/admin' : 
                            profile.role === 'employer' ? '/employer' : '/worker';
      navigate(dashboardRoute, { replace: true });
    }
  }, [user, profile, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentStep === 1) {
      if (!formData.userType) {
        return;
      }
      setCurrentStep(2);
    } else {
      // Validate form
      if (!validateForm()) {
        return;
      }

      if (!formData.userType || (formData.userType !== 'employer' && formData.userType !== 'worker')) {
        return;
      }

      setIsSubmitting(true);
      
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const { error } = await signUp(
        formData.email, 
        formData.password, 
        fullName, 
        formData.userType,
        formData.phone,
        formData.category
      );

      if (!error) {
<<<<<<< HEAD
        // Registration successful - redirect based on user type
        if (formData.userType === 'worker') {
          navigate('/worker/onboarding/documents');
        } else {
          navigate('/signin');
        }
=======
        // Registration successful - user will be redirected automatically after email verification
        navigate('/signin');
>>>>>>> 22b8ef5c22a983643de0cfb17e170083bc49eaa6
      }
      
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear errors when user starts typing
    if (field === 'password' || field === 'confirmPassword') {
      setErrors(prev => ({ ...prev, passwordMatch: "" }));
    }
    if (field === 'phone') {
      setErrors(prev => ({ ...prev, phone: "" }));
    }
    if (field !== 'agreeToTerms') {
      setErrors(prev => ({ ...prev, required: "" }));
    }
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[0-9]{0,10}$/;
    return phoneRegex.test(phone);
  };

  const validateForm = () => {
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'password', 'confirmPassword'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    // Category is mandatory for workers
    if (formData.userType === 'worker' && !formData.category) {
      missingFields.push('category');
    }
    
    if (missingFields.length > 0) {
      setErrors(prev => ({ ...prev, required: "Please fill in all mandatory fields" }));
      return false;
    }

    if (!validatePhone(formData.phone)) {
      setErrors(prev => ({ ...prev, phone: "Phone number must contain only digits and be maximum 10 digits" }));
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrors(prev => ({ ...prev, passwordMatch: "Passwords do not match" }));
      return false;
    }

    if (!formData.agreeToTerms) {
      setErrors(prev => ({ ...prev, required: "Please agree to the terms and conditions" }));
      return false;
    }

    return true;
  };

  const handlePhoneChange = (value: string) => {
    // Only allow numeric input and limit to 10 digits
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 10);
    handleInputChange('phone', numericValue);
  };

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
            
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold">
                {currentStep === 1 ? "Choose Your Path" : "Create Account"}
              </CardTitle>
              <p className="text-muted-foreground">
                {currentStep === 1 
                  ? "Select how you'd like to use Macroworkers"
                  : "Complete your registration to get started"
                }
              </p>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center justify-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${currentStep >= 1 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`w-8 h-0.5 ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`w-3 h-3 rounded-full ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {currentStep === 1 ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <RadioGroup
                    value={formData.userType}
                    onValueChange={(value) => handleInputChange('userType', value)}
                    className="space-y-4"
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                        className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.userType === 'worker' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-muted hover:border-muted-foreground/30'
                      }`}
                    >
                      <RadioGroupItem value="worker" id="worker" />
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="p-2 bg-success/10 rounded-lg">
                          <Users className="h-6 w-6 text-success" />
                        </div>
                        <div>
                          <Label htmlFor="worker" className="text-base font-medium cursor-pointer">
                            I want to work and earn money
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Complete tasks and get paid
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                        className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.userType === 'employer' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-muted hover:border-muted-foreground/30'
                      }`}
                    >
                      <RadioGroupItem value="employer" id="employer" />
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Briefcase className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                                          <Label htmlFor="employer" className="text-base font-medium cursor-pointer">
                  I want to post tasks (Employer)
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Create and manage tasks for employees/workers
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </RadioGroup>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">
                        First Name <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="firstName"
                          placeholder="John"
                          className="pl-10"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">
                        Last Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        className="pl-10"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="1234567890"
                      value={formData.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      maxLength={10}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500">{errors.phone}</p>
                    )}
                  </div>

                  {formData.userType === 'worker' && (
                    <div className="space-y-2">
                      <Label htmlFor="category">
                        Category <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => handleInputChange('category', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IT">IT</SelectItem>
                          <SelectItem value="Digital Marketing">Digital Marketing</SelectItem>
                          <SelectItem value="Blockchain/AI">Blockchain/AI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Create Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        className="pl-10 pr-10"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirm Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        className="pl-10"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        required
                      />
                    </div>
                    {errors.passwordMatch && (
                      <p className="text-sm text-red-500">{errors.passwordMatch}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={formData.agreeToTerms}
                      onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked)}
                    />
                    <label htmlFor="terms" className="text-sm text-muted-foreground">
                      I agree to the{" "}
                      <Link to="/terms" className="text-primary hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link to="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>

                  {/* Error Messages */}
                  {errors.required && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{errors.required}</p>
                    </div>
                  )}
                </motion.div>
              )}

              <div className="flex gap-3">
                {currentStep === 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                )}
                
                <Button 
                  type="submit" 
                  className="flex-1 bg-gradient-primary hover:bg-primary-dark"
                  size="lg"
                  disabled={isSubmitting || (currentStep === 2 && (!formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.phone || (formData.userType === 'worker' && !formData.category)))}
                >
                  {isSubmitting ? "Creating Account..." : currentStep === 1 ? "Continue" : "Create Account"}
                </Button>
              </div>
            </form>

            {currentStep === 2 && (
              <>
                <div className="relative">
                  <Separator />
                  <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                    OR
                  </span>
                </div>

                <div className="space-y-3">
                  <Button variant="outline" className="w-full" size="lg">
                    Continue with Google
                  </Button>
                  <Button variant="outline" className="w-full" size="lg">
                    Continue with Facebook
                  </Button>
                </div>
              </>
            )}

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
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

export default Register;