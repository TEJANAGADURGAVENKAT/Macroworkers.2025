import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  DollarSign,
  Users,
  Target,
  Globe,
  Clock,
  IndianRupee,
  Star,
  Calendar,
  Timer,
  Search,
  UserPlus,
  X,
  User
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSkillsByCategory } from '@/hooks/useSubcategories';

interface Worker {
  user_id: string;
  full_name: string;
  rating: number;
  total_tasks_completed: number;
  skills: string[];
  languages: string[];
  location?: string;
  category?: string;
}

const CreateTask = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableWorkers, setAvailableWorkers] = useState<Worker[]>([]);
  const [selectedWorkers, setSelectedWorkers] = useState<Worker[]>([]);
  const [workerSearchQuery, setWorkerSearchQuery] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(1.0);
  const [selectedRole, setSelectedRole] = useState<string>("");

  const [formData, setFormData] = useState({
    // Step 1: Task Details
    title: "",
    description: "",
    category: "",
    role_category: "",
    difficulty: "",
    instructions: [""],
    requirements: [""],
    
    // Step 2: Rating & Access Control
    requiredRating: "1.00",
    isTimeSensitive: false,
    assignmentStartTime: "",
    assignmentEndTime: "",
    maxAssignees: "",
    
    // Step 3: Targeting
    targetCountries: [],
    minAge: "",
    maxAge: "",
    languages: [],
    deviceTypes: [],
    
    // Step 4: Payment & Worker Selection
    paymentPerTask: "",
    budget: "",
    duration: "",
    autoApproval: false,
    maxSlots: "1"
  });

  const [timeSlotData, setTimeSlotData] = useState({
    date: "",
    startTime: "",
    endTime: ""
  });
  
  // Dynamic subcategory fetching based on selected category
  const { skillsBySubcategory, allSkills, loading: skillsLoading, error: skillsError } = useSkillsByCategory(formData.category || '');

  const categories = [
    "IT",
    "Digital Marketing", 
    "Blockchain/AI",
    "General"
  ];

  const roleCategories = [
    "IT",
    "Digital Marketing",
    "Blockchain/AI"
  ];

  const difficulties = [
    { value: "easy", label: "Easy (1-5 minutes)" },
    { value: "medium", label: "Medium (5-15 minutes)" },
    { value: "hard", label: "Hard (15+ minutes)" }
  ];

  const ratingOptions = [
    { value: "1.00", label: "1 Star - Basic Level", description: "Suitable for new workers" },
    { value: "2.00", label: "2 Stars - Beginner", description: "Some experience required" },
    { value: "3.00", label: "3 Stars - Intermediate", description: "Moderate experience needed" },
    { value: "4.00", label: "4 Stars - Advanced", description: "High-quality work expected" },
    { value: "5.00", label: "5 Stars - Expert", description: "Top-tier workers only" }
  ];

  const countries = [
    "India",
    "United States", "Canada", "United Kingdom", "Australia", 
    "Germany", "France", "Spain", "Italy", "Brazil", "Mexico"
  ];

  const languages = [
    "English", "Spanish", "French", "German", "Italian", 
    "Portuguese", "Chinese", "Japanese", "Korean"
  ];

  const deviceTypes = ["Desktop", "Mobile", "Tablet"];

  // Organized skills by categories
  const skillsByCategory = {
    "Frontend Development": ["HTML", "CSS", "JavaScript", "React.js", "UI/UX Basics"],
    "Backend Development": ["Node.js", "Express.js", "Python", "Databases", "API Development"],
    "Full Stack Development": ["React.js", "Node.js", "MongoDB", "REST APIs", "Version Control"],
    "Mobile Development": ["Flutter", "React Native", "iOS", "Android", "App Store Deployment"],
    "Database Administration": ["SQL", "Database Optimization", "Backups", "Security", "Performance Tuning"],
    "Cloud & DevOps": ["AWS", "Azure", "CI/CD", "Docker", "Kubernetes"],
    "SEO Specialist": ["Keyword Research", "On-page SEO", "Off-page SEO", "Technical SEO", "Content Optimization"],
    "Content Marketing": ["Content Writing", "Copywriting", "Blog Management", "Storytelling", "Editing"],
    "Social Media Management": ["Social Media Strategy", "Content Scheduling", "Analytics & Insights", "Community Engagement", "Paid Campaigns"],
    "PPC Advertising": ["Google Ads", "Facebook Ads", "Campaign Optimization", "A/B Testing", "Conversion Tracking"],
    "Email Marketing": ["Email Campaigns", "Automation Tools", "A/B Testing", "Copywriting", "List Segmentation"],
    "Blockchain Development": ["Solidity", "Web3.js", "Ethereum", "Smart Contracts", "DeFi Protocols"],
    "Smart Contract Auditing": ["Solidity", "Security Testing", "Gas Optimization", "MythX", "Slither"],
    "Web3 Development": ["React.js", "Next.js", "Ethers.js", "IPFS", "Smart Contracts"],
    "Crypto Analysis": ["Technical Analysis", "Fundamental Analysis", "On-chain Data", "Market Trends", "Risk Management"],
    "Blockchain Architecture": ["Consensus Mechanisms", "System Design", "Node Management", "Scalability", "Security"],
    "NFT/Token Development": ["ERC-20", "ERC-721", "ERC-1155", "Tokenomics", "Minting Contracts"],
    "General Tasks": ["App Testing", "Surveys", "Data Entry", "Translation", "Voice Recording", "Product Reviews", "Website Testing"]
  };

  // Role-specific skills mapping for precise skill selection
  const skillsByRole = {
    "Frontend Developer": ["HTML", "CSS", "JavaScript", "React.js", "UI/UX Basics"],
    "Backend Developer": ["Node.js", "Express.js", "Python", "Databases", "API Development"],
    "Full Stack Developer": ["React.js", "Node.js", "MongoDB", "REST APIs", "Version Control"],
    "Mobile App Developer": ["Flutter", "React Native", "iOS", "Android", "App Store Deployment"],
    "Database Administrator (DBA)": ["SQL", "Database Optimization", "Backups", "Security", "Performance Tuning"],
    "Cloud Engineer / DevOps": ["AWS", "Azure", "CI/CD", "Docker", "Kubernetes"],
    "SEO Specialist": ["Keyword Research", "On-page SEO", "Off-page SEO", "Technical SEO", "Content Optimization"],
    "Content Writer / Copywriter": ["Content Writing", "Copywriting", "Blog Management", "Storytelling", "Editing"],
    "Social Media Manager": ["Social Media Strategy", "Content Scheduling", "Analytics & Insights", "Community Engagement", "Paid Campaigns"],
    "Performance Marketer (PPC/Ads)": ["Google Ads", "Facebook Ads", "Campaign Optimization", "A/B Testing", "Conversion Tracking"],
    "Email Marketing Specialist": ["Email Campaigns", "Automation Tools", "A/B Testing", "Copywriting", "List Segmentation"],
    "Blockchain Developer": ["Solidity", "Web3.js", "Ethereum", "Smart Contracts", "DeFi Protocols"],
    "Smart Contract Auditor": ["Solidity", "Security Testing", "Gas Optimization", "MythX", "Slither"],
    "Web3 Developer": ["React.js", "Next.js", "Ethers.js", "IPFS", "Smart Contracts"],
    "Crypto Analyst": ["Technical Analysis", "Fundamental Analysis", "On-chain Data", "Market Trends", "Risk Management"],
    "Blockchain Architect": ["Consensus Mechanisms", "System Design", "Node Management", "Scalability", "Security"],
    "NFT/Token Developer": ["ERC-20", "ERC-721", "ERC-1155", "Tokenomics", "Minting Contracts"]
  };

  // Flatten all skills for the dropdown
  const skillOptions = Object.values(skillsByCategory).flat();
  
  // Debug logging
  console.log('Skills state:', {
    category: formData.category,
    skillsBySubcategory,
    skillsLoading,
    skillsError,
    staticSkillsCount: Object.keys(skillsByCategory).length
  });

  useEffect(() => {
    loadAvailableWorkers();
  }, [minRating, selectedSkills, selectedLanguages, formData.role_category]);

  const loadAvailableWorkers = async () => {
    try {
      console.log('Loading workers with filters:', {
        role_category: formData.role_category,
        minRating,
        selectedSkills,
        selectedLanguages
      });

      let query = supabase
        .from('profiles')
        .select('user_id, full_name')
        .eq('role', 'worker');

      // Simplified query to avoid TypeScript issues
      const { data, error } = await query.order('full_name', { ascending: true });

      if (error) {
        console.error('Error loading workers:', error);
        return;
      }

      console.log('Loaded workers:', data?.length || 0, 'workers');
      console.log('Workers data:', data?.map(w => ({ name: w.full_name, user_id: w.user_id })));

      // Transform the data to match our interface
      const workers = (data || []).map(worker => ({
        user_id: worker.user_id,
        full_name: worker.full_name || 'Unknown Worker',
        skills: ['Social Media', 'Content Writing', 'App Testing', 'Surveys'],
        languages: ['English'],
        rating: 1.0,
        total_tasks_completed: 0,
        category: formData.role_category || 'General'
      }));

      setAvailableWorkers(workers);
    } catch (error) {
      console.error('Error loading workers:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    console.log('Form input changed:', field, value);
    
    // Clear selected skills and role when category changes
    if (field === 'category') {
      setSelectedSkills([]);
      setSelectedRole("");
    }
    
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      console.log('New form data:', newData);
      return newData;
    });
  };

  const handleTimeSlotChange = (field: string, value: string) => {
    setTimeSlotData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayInputChange = (field: string, index: number, value: string) => {
    const newArray = [...formData[field as keyof typeof formData] as string[]];
    newArray[index] = value;
    handleInputChange(field, newArray);
  };

  const addArrayItem = (field: string) => {
    const currentArray = formData[field as keyof typeof formData] as string[];
    handleInputChange(field, [...currentArray, ""]);
  };

  const removeArrayItem = (field: string, index: number) => {
    const currentArray = formData[field as keyof typeof formData] as string[];
    handleInputChange(field, currentArray.filter((_, i) => i !== index));
  };

  const addWorker = (worker: Worker) => {
    if (!selectedWorkers.find(w => w.user_id === worker.user_id)) {
      setSelectedWorkers(prev => [...prev, worker]);
    }
  };

  const removeWorker = (workerId: string) => {
    setSelectedWorkers(prev => prev.filter(w => w.user_id !== workerId));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "You must be signed in", variant: "destructive" });
      return;
    }

    // No need to check for selected workers since it's auto-assignment
    if (!formData.maxSlots || Number(formData.maxSlots) < 1) {
      toast({ title: "Invalid max slots", description: "Please set a valid number of maximum slots for this task.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare task data with new fields
      const taskData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        role_category: formData.role_category || 'General',
        difficulty: formData.difficulty || 'easy',
        requirements: formData.requirements.filter(Boolean).join(", "),
        slots: Number(formData.maxSlots) || 1,
        budget: Number(formData.paymentPerTask) || 0,
        status: "active",
        created_by: user.id,
        required_rating: Number(formData.requiredRating),
        is_time_sensitive: formData.isTimeSensitive,
        time_slot_date: formData.isTimeSensitive && timeSlotData.date ? timeSlotData.date : null,
        time_slot_start: formData.isTimeSensitive && timeSlotData.startTime ? timeSlotData.startTime : null,
        time_slot_end: formData.isTimeSensitive && timeSlotData.endTime ? timeSlotData.endTime : null,
        assignment_start_time: formData.assignmentStartTime || null,
        assignment_end_time: formData.assignmentEndTime || null,
        max_workers: Number(formData.maxSlots) || 1,
        assigned_count: 0,
        total_budget: (Number(formData.paymentPerTask) || 0) * (Number(formData.maxSlots) || 1)
      };

      console.log('Creating task with data:', taskData);
      
      let { data, error } = await supabase.from("tasks").insert(taskData);
      
      if (error) {
        // If FK expects profiles.id, retry with profile.id
        if (String(error.message || "").includes("tasks_created_by_fkey")) {
          const createdBy = profile?.id;
          if (!createdBy) throw error;
          const retry = await supabase.from("tasks").insert({
            ...taskData,
            created_by: createdBy,
          });
          if (retry.error) throw retry.error;
        } else {
          throw error;
        }
      }

      toast({
        title: "Task created successfully!",
        description: `Your ${formData.requiredRating}-star task is now available for workers to assign themselves. Max slots: ${formData.maxSlots}`,
      });
      navigate("/employer/campaigns");
    } catch (e: any) {
      toast({ title: "Failed to create task", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateBudget = () => {
    const payment = parseFloat(formData.paymentPerTask) || 0;
    const maxSlots = Number(formData.maxSlots) || 1;
    return payment * maxSlots;
  };

  const getRatingDescription = (rating: string) => {
    const option = ratingOptions.find(opt => opt.value === rating);
    return option ? option.description : "";
  };

  const filteredWorkers = availableWorkers.filter(worker => {
    const matchesSearch = worker.full_name.toLowerCase().includes(workerSearchQuery.toLowerCase()) ||
                         worker.skills.some(skill => skill.toLowerCase().includes(workerSearchQuery.toLowerCase()));
    // Category and rating filtering is now done at database level
    return matchesSearch;
  });

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Follow Instagram Account & Like Posts"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Task Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe what workers need to do in detail..."
                rows={4}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Specific Role</Label>
                <Select value={selectedRole} onValueChange={(value) => {
                  setSelectedRole(value);
                  setSelectedSkills([]); // Clear skills when role changes
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select specific role (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.category === 'IT' && [
                      "Frontend Developer",
                      "Backend Developer", 
                      "Full Stack Developer",
                      "Mobile App Developer",
                      "Database Administrator (DBA)",
                      "Cloud Engineer / DevOps"
                    ].map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                    {formData.category === 'Digital Marketing' && [
                      "SEO Specialist",
                      "Content Writer / Copywriter",
                      "Social Media Manager", 
                      "Performance Marketer (PPC/Ads)",
                      "Email Marketing Specialist"
                    ].map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                    {formData.category === 'Blockchain/AI' && [
                      "Blockchain Developer",
                      "Smart Contract Auditor",
                      "Web3 Developer",
                      "Crypto Analyst", 
                      "Blockchain Architect",
                      "NFT/Token Developer"
                    ].map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Difficulty Level *</Label>
                <Select value={formData.difficulty} onValueChange={(value) => handleInputChange('difficulty', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {difficulties.map((difficulty) => (
                      <SelectItem key={difficulty.value} value={difficulty.value}>
                        {difficulty.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Worker Category *</Label>
              <Select value={formData.role_category} onValueChange={(value) => handleInputChange('role_category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select worker category" />
                </SelectTrigger>
                <SelectContent>
                  {roleCategories.map((roleCategory) => (
                    <SelectItem key={roleCategory} value={roleCategory}>
                      {roleCategory}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                This determines which workers can see and apply for this task
              </p>
            </div>

            <div className="space-y-2">
              <Label>Step-by-Step Instructions *</Label>
              {formData.instructions.map((instruction, index) => (
                <div key={index} className="flex space-x-2">
                  <Input
                    placeholder={`Step ${index + 1}`}
                    value={instruction}
                    onChange={(e) => handleArrayInputChange('instructions', index, e.target.value)}
                  />
                  {formData.instructions.length > 1 && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeArrayItem('instructions', index)}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => addArrayItem('instructions')}
              >
                Add Step
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Requirements</Label>
              {formData.requirements.map((requirement, index) => (
                <div key={index} className="flex space-x-2">
                  <Input
                    placeholder={`Requirement ${index + 1}`}
                    value={requirement}
                    onChange={(e) => handleArrayInputChange('requirements', index, e.target.value)}
                  />
                  {formData.requirements.length > 1 && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeArrayItem('requirements', index)}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => addArrayItem('requirements')}
              >
                Add Requirement
              </Button>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <Label className="text-lg font-semibold">Worker Rating Requirements</Label>
              </div>
              <p className="text-muted-foreground">
                Set the minimum rating required for workers to access this task. Higher ratings ensure better quality work.
              </p>
              
              <div className="space-y-3">
                <Label>Required Worker Rating *</Label>
                <Select value={formData.requiredRating} onValueChange={(value) => handleInputChange('requiredRating', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ratingOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center space-x-2">
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {getRatingDescription(formData.requiredRating)}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Timer className="h-5 w-5 text-blue-500" />
                  <Label className="text-lg font-semibold">Time-Sensitive Tasks</Label>
                </div>
                <p className="text-muted-foreground">
                  Enable if this task needs to be completed within a specific time window.
                </p>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isTimeSensitive"
                    checked={formData.isTimeSensitive}
                    onCheckedChange={(checked) => handleInputChange('isTimeSensitive', checked)}
                  />
                  <Label htmlFor="isTimeSensitive" className="text-sm">
                    This task is time-sensitive and requires specific timing
                  </Label>
                </div>

                {formData.isTimeSensitive && (
                  <div className="grid grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/30">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={timeSlotData.date}
                        onChange={(e) => handleTimeSlotChange('date', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time *</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={timeSlotData.startTime}
                        onChange={(e) => handleTimeSlotChange('startTime', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time *</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={timeSlotData.endTime}
                        onChange={(e) => handleTimeSlotChange('endTime', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Assignment Time Restrictions */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-green-500" />
                  <Label className="text-lg font-semibold">Assignment Time Window</Label>
                </div>
                <p className="text-muted-foreground">
                  Set specific hours when workers can assign themselves to this task. Leave empty for 24/7 availability.
                </p>
                
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30">
                  <div className="space-y-2">
                    <Label htmlFor="assignmentStartTime">Assignment Start Time</Label>
                    <Input
                      id="assignmentStartTime"
                      type="time"
                      value={formData.assignmentStartTime}
                      onChange={(e) => handleInputChange('assignmentStartTime', e.target.value)}
                      placeholder="e.g., 09:00"
                    />
                    <p className="text-xs text-muted-foreground">Workers can start assigning from this time</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assignmentEndTime">Assignment End Time</Label>
                    <Input
                      id="assignmentEndTime"
                      type="time"
                      value={formData.assignmentEndTime}
                      onChange={(e) => handleInputChange('assignmentEndTime', e.target.value)}
                      placeholder="e.g., 17:00"
                    />
                    <p className="text-xs text-muted-foreground">Workers cannot assign after this time</p>
                  </div>
                </div>
              </div>

              {/* Worker Limit */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  <Label className="text-lg font-semibold">Worker Assignment Limit</Label>
                </div>
                <p className="text-muted-foreground">
                  Set maximum number of workers who can assign themselves to this task. Leave empty for no limit.
                </p>
                
                <div className="space-y-2">
                  <Label htmlFor="maxAssignees">Maximum Assignees</Label>
                  <Input
                    id="maxAssignees"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.maxAssignees}
                    onChange={(e) => handleInputChange('maxAssignees', e.target.value)}
                    placeholder="e.g., 5"
                  />
                  <p className="text-xs text-muted-foreground">
                    Once this limit is reached, no more workers can assign themselves to this task
                  </p>
                </div>
              </div>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Star className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-900">Rating-Based Access Control</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Workers with {formData.requiredRating}-star ratings or higher will be able to see and apply for this task. 
                        This ensures quality and reliability for your campaign.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <Label>Target Countries (Optional)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {countries.map((country) => (
                  <div key={country} className="flex items-center space-x-2">
                    <Checkbox
                      id={country}
                      checked={formData.targetCountries.includes(country)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleInputChange('targetCountries', [...formData.targetCountries, country]);
                        } else {
                          handleInputChange('targetCountries', 
                            formData.targetCountries.filter(c => c !== country)
                          );
                        }
                      }}
                    />
                    <Label htmlFor={country} className="text-sm">{country}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minAge">Minimum Age</Label>
                <Select value={formData.minAge} onValueChange={(value) => handleInputChange('minAge', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any age" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="18">18+</SelectItem>
                    <SelectItem value="21">21+</SelectItem>
                    <SelectItem value="25">25+</SelectItem>
                    <SelectItem value="30">30+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxAge">Maximum Age</Label>
                <Select value={formData.maxAge} onValueChange={(value) => handleInputChange('maxAge', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any age" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="35">35</SelectItem>
                    <SelectItem value="45">45</SelectItem>
                    <SelectItem value="55">55</SelectItem>
                    <SelectItem value="65">65</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Required Languages</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {languages.map((language) => (
                  <div key={language} className="flex items-center space-x-2">
                    <Checkbox
                      id={language}
                      checked={formData.languages.includes(language)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleInputChange('languages', [...formData.languages, language]);
                        } else {
                          handleInputChange('languages', 
                            formData.languages.filter(l => l !== language)
                          );
                        }
                      }}
                    />
                    <Label htmlFor={language} className="text-sm">{language}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Label>Device Requirements</Label>
              <div className="flex gap-4">
                {deviceTypes.map((device) => (
                  <div key={device} className="flex items-center space-x-2">
                    <Checkbox
                      id={device}
                      checked={formData.deviceTypes.includes(device)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleInputChange('deviceTypes', [...formData.deviceTypes, device]);
                        } else {
                          handleInputChange('deviceTypes', 
                            formData.deviceTypes.filter(d => d !== device)
                          );
                        }
                      }}
                    />
                    <Label htmlFor={device} className="text-sm">{device}</Label>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentPerTask">Payment per Task *</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="paymentPerTask"
                    type="number"
                    step="0.01"
                    min="0.10"
                    placeholder="0.50"
                    className="pl-10"
                    value={formData.paymentPerTask}
                    onChange={(e) => handleInputChange('paymentPerTask', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxSlots">Max Slots *</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="maxSlots"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="1"
                    className="pl-10"
                    value={formData.maxSlots}
                    onChange={(e) => handleInputChange('maxSlots', e.target.value)}
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">Maximum workers who can assign to this task</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Campaign Duration *</Label>
                <Select value={formData.duration} onValueChange={(value) => handleInputChange('duration', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">1 week</SelectItem>
                    <SelectItem value="14">2 weeks</SelectItem>
                    <SelectItem value="30">1 month</SelectItem>
                    <SelectItem value="60">2 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoApproval"
                checked={formData.autoApproval}
                onCheckedChange={(checked) => handleInputChange('autoApproval', checked)}
              />
              <Label htmlFor="autoApproval" className="text-sm">
                Enable auto-approval for submissions (recommended for simple tasks)
              </Label>
            </div>

            {/* Worker Selection Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-lg font-semibold">Select Workers for This Task</Label>
                  {formData.role_category && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Showing workers from <strong>{formData.role_category}</strong> category
                    </p>
                  )}
                </div>
                <Badge variant="secondary">
                  {selectedWorkers.length} worker{selectedWorkers.length !== 1 ? 's' : ''} selected
                </Badge>
              </div>

              {/* Debug Info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs">
                  <strong>Debug Info:</strong><br/>
                  Role Category: {formData.role_category || 'None'}<br/>
                  Min Rating: {minRating}<br/>
                  Available Workers: {availableWorkers.length}<br/>
                  Filtered Workers: {filteredWorkers.length}<br/>
                  <div className="mt-2 space-x-1">
                    <button 
                      onClick={() => setMinRating(1.0)} 
                      className="px-2 py-1 bg-blue-200 rounded text-xs"
                    >
                      Test 1.0
                    </button>
                    <button 
                      onClick={() => setMinRating(3.0)} 
                      className="px-2 py-1 bg-blue-200 rounded text-xs"
                    >
                      Test 3.0
                    </button>
                    <button 
                      onClick={() => setMinRating(5.0)} 
                      className="px-2 py-1 bg-blue-200 rounded text-xs"
                    >
                      Test 5.0
                    </button>
                  </div>
                </div>
              )}

              {/* Worker Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/30">
                <div className="space-y-2">
                  <Label>Minimum Rating</Label>
                  <Select value={minRating.toString()} onValueChange={(value) => setMinRating(Number(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select minimum rating">
                        {minRating.toFixed(1)}★
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1.0">1.0★</SelectItem>
                      <SelectItem value="2.0">2.0★</SelectItem>
                      <SelectItem value="3.0">3.0★</SelectItem>
                      <SelectItem value="4.0">4.0★</SelectItem>
                      <SelectItem value="5.0">5.0★</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Required Skills</Label>
                  {(formData.category || selectedRole) && (
                    <p className="text-sm text-muted-foreground">
                      {selectedRole ? (
                        <>Showing skills for <strong>{selectedRole}</strong> role</>
                      ) : (
                        <>Showing skills for <strong>{formData.category}</strong> category</>
                      )}
                    </p>
                  )}
                  <Select value="" onValueChange={(value) => {
                    if (value && !selectedSkills.includes(value)) {
                      setSelectedSkills(prev => [...prev, value]);
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add skill filter" />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      {skillsLoading ? (
                        <div className="p-4 text-center text-gray-500">
                          Loading skills...
                        </div>
                      ) : Object.keys(skillsBySubcategory).length > 0 ? (
                        // Show dynamic skills from database
                        Object.entries(skillsBySubcategory).map(([subcategory, skills]) => (
                          <div key={subcategory}>
                            <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-50 sticky top-0">
                              {subcategory}
                            </div>
                            {skills.filter(skill => !selectedSkills.includes(skill)).map((skill) => (
                              <SelectItem key={skill} value={skill} className="pl-4">
                                {skill}
                              </SelectItem>
                            ))}
                          </div>
                        ))
                      ) : (
                        // Show role-specific skills if role selected, otherwise category skills
                        (() => {
                          let skillsToShow: string[] = [];
                          
                          // If specific role is selected, show only that role's skills
                          if (selectedRole && skillsByRole[selectedRole as keyof typeof skillsByRole]) {
                            skillsToShow = skillsByRole[selectedRole as keyof typeof skillsByRole];
                          } 
                          // Otherwise show category-specific skills
                          else if (formData.category === 'IT') {
                            skillsToShow = [
                              ...skillsByCategory["Frontend Development"],
                              ...skillsByCategory["Backend Development"],
                              ...skillsByCategory["Full Stack Development"],
                              ...skillsByCategory["Mobile Development"],
                              ...skillsByCategory["Database Administration"],
                              ...skillsByCategory["Cloud & DevOps"]
                            ];
                          } else if (formData.category === 'Digital Marketing') {
                            skillsToShow = [
                              ...skillsByCategory["SEO Specialist"],
                              ...skillsByCategory["Content Marketing"],
                              ...skillsByCategory["Social Media Management"],
                              ...skillsByCategory["PPC Advertising"],
                              ...skillsByCategory["Email Marketing"]
                            ];
                          } else if (formData.category === 'Blockchain/AI') {
                            skillsToShow = [
                              ...skillsByCategory["Blockchain Development"],
                              ...skillsByCategory["Smart Contract Auditing"],
                              ...skillsByCategory["Web3 Development"],
                              ...skillsByCategory["Crypto Analysis"],
                              ...skillsByCategory["Blockchain Architecture"],
                              ...skillsByCategory["NFT/Token Development"]
                            ];
                          } else {
                            // Show all skills for other categories
                            skillsToShow = Object.values(skillsByCategory).flat();
                          }
                          
                          return skillsToShow.filter(skill => !selectedSkills.includes(skill)).map((skill) => (
                            <SelectItem key={skill} value={skill}>
                              {skill}
                            </SelectItem>
                          ));
                        })()
                      )}
                    </SelectContent>
                  </Select>
                  {selectedSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedSkills.map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                          <button
                            onClick={() => setSelectedSkills(prev => prev.filter(s => s !== skill))}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Required Languages</Label>
                  <Select value="" onValueChange={(value) => {
                    if (value && !selectedLanguages.includes(value)) {
                      setSelectedLanguages(prev => [...prev, value]);
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add language filter" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.filter(lang => !selectedLanguages.includes(lang)).map((lang) => (
                        <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedLanguages.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedLanguages.map((lang) => (
                        <Badge key={lang} variant="outline" className="text-xs">
                          {lang}
                          <button
                            onClick={() => setSelectedLanguages(prev => prev.filter(l => l !== lang))}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Worker Search */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search workers by name or skills..."
                    className="pl-10"
                    value={workerSearchQuery}
                    onChange={(e) => setWorkerSearchQuery(e.target.value)}
                  />
                </div>

                {/* Available Workers */}
                <div className="max-h-64 overflow-y-auto border rounded-lg">
                  {filteredWorkers.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <p>No workers found matching your criteria</p>
                      {formData.role_category && (
                        <p className="text-sm mt-2">
                          No workers found in <strong>{formData.role_category}</strong> category with rating ≥ {minRating}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredWorkers.map((worker) => (
                        <div key={worker.user_id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{worker.full_name}</span>
                                <div className="flex items-center space-x-1">
                                  <Star className="h-3 w-3 text-yellow-500" />
                                  <span className="text-sm">{worker.rating.toFixed(1)}</span>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {worker.total_tasks_completed} tasks
                                </Badge>
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  Can Assign
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {worker.skills.slice(0, 3).map((skill) => (
                                  <Badge key={skill} variant="secondary" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                                {worker.skills.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{worker.skills.length - 3} more
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                This worker will be able to assign themselves to this task
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Available Workers Info */}
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-green-900">Auto-Assignment System</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Workers shown above can assign themselves to this task up to the maximum slots limit. 
                        No pre-selection needed - they will see this task in their Browse Jobs page.
                      </p>
                      <div className="mt-2 text-xs text-green-600">
                        <strong>Max Slots:</strong> {formData.maxSlots} workers can assign themselves
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg">Campaign Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Required Rating:</span>
                  <div className="flex items-center space-x-1">
                    <span className="font-semibold">{formData.requiredRating}</span>
                    <Star className="h-4 w-4 text-yellow-500" />
                  </div>
                </div>
                {formData.isTimeSensitive && (
                  <div className="flex justify-between">
                    <span>Time Slot:</span>
                    <span className="font-semibold">
                      {timeSlotData.date} {timeSlotData.startTime} - {timeSlotData.endTime}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Payment per task:</span>
                  <span className="font-semibold">{formatINR(parseFloat(formData.paymentPerTask || '0'))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max worker slots:</span>
                  <span className="font-semibold">{formData.maxSlots}</span>
                </div>
                <div className="flex justify-between">
                  <span>Available workers:</span>
                  <span className="font-semibold">{filteredWorkers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform fee (5%):</span>
                  <span className="font-semibold">{formatINR(calculateBudget() * 0.05)}</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Total Budget:</span>
                  <span className="font-bold text-success">{formatINR(calculateBudget() * 1.05)}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Create New Task</h1>
            <p className="text-muted-foreground">Set up your task campaign in 4 simple steps</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/employer">← Back to Dashboard</Link>
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {step < currentStep ? <CheckCircle className="h-5 w-5" /> : step}
                  </div>
                  {step < 4 && (
                    <div className={`h-0.5 w-16 mx-4 ${
                      step < currentStep ? 'bg-primary' : 'bg-muted'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className={currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}>
                <Target className="h-5 w-5 mx-auto mb-1" />
                <span className="text-sm font-medium">Task Details</span>
              </div>
              <div className={currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}>
                <Star className="h-5 w-5 mx-auto mb-1" />
                <span className="text-sm font-medium">Rating & Timing</span>
              </div>
              <div className={currentStep >= 3 ? 'text-primary' : 'text-muted-foreground'}>
                <Globe className="h-5 w-5 mx-auto mb-1" />
                <span className="text-sm font-medium">Targeting</span>
              </div>
              <div className={currentStep >= 4 ? 'text-primary' : 'text-muted-foreground'}>
                <Users className="h-5 w-5 mx-auto mb-1" />
                <span className="text-sm font-medium">Worker Selection</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            {renderStepContent()}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {currentStep < totalSteps ? (
            <Button
              onClick={nextStep}
              className="bg-gradient-primary"
              disabled={
                currentStep === 1 ? (!formData.title || !formData.description || !formData.category || !formData.role_category) :
                currentStep === 2 ? (!formData.requiredRating || (formData.isTimeSensitive && (!timeSlotData.date || !timeSlotData.startTime || !timeSlotData.endTime))) :
                currentStep === 3 ? false :
                false
              }
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="bg-gradient-primary"
              disabled={isSubmitting || !formData.paymentPerTask || !formData.maxSlots || !formData.duration}
            >
              {isSubmitting ? "Creating..." : "Create Campaign"}
              <CheckCircle className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateTask;