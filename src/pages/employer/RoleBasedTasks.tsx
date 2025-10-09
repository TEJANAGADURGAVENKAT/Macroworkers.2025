import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatINR } from '@/lib/utils';
import { useSkillsByCategory } from '@/hooks/useSubcategories';
import { 
  ChevronDown, 
  ChevronRight, 
  Code, 
  TrendingUp, 
  Link, 
  Plus,
  Calendar,
  DollarSign,
  FileText,
  Users,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Target,
  Globe,
  Clock,
  IndianRupee,
  Star,
  Timer,
  Search,
  UserPlus,
  X,
  User
} from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  roles: Role[];
}

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

interface TaskFormData {
  // Step 1: Task Details
  title: string;
  description: string;
  category: string;
  difficulty: string;
  instructions: string[];
  requirements: string[];
  
  // Step 2: Rating & Access Control
  requiredRating: string;
  isTimeSensitive: boolean;
  
  // Step 3: Targeting
  targetCountries: string[];
  minAge: string;
  maxAge: string;
  languages: string[];
  deviceTypes: string[];
  
  // Step 4: Payment & Worker Selection
  paymentPerTask: string;
  budget: string;
  duration: string;
  autoApproval: boolean;
  deadline: string;
  maxSlots: string;
}

const categories: Category[] = [
  {
    id: 'it',
    name: 'IT Department',
    description: 'Technical roles for software development and IT infrastructure',
    icon: <Code className="w-6 h-6" />,
    color: 'bg-blue-500',
    roles: [
      { id: 'frontend', name: 'Frontend Developer', description: 'Build user interfaces and client-side applications', icon: <Code className="w-4 h-4" /> },
      { id: 'backend', name: 'Backend Developer', description: 'Develop server-side logic and APIs', icon: <Code className="w-4 h-4" /> },
      { id: 'fullstack', name: 'Full Stack Developer', description: 'Handle both frontend and backend development', icon: <Code className="w-4 h-4" /> },
      { id: 'mobile', name: 'Mobile App Developer', description: 'Create mobile applications for iOS and Android', icon: <Code className="w-4 h-4" /> },
      { id: 'dba', name: 'Database Administrator (DBA)', description: 'Manage and optimize database systems', icon: <Code className="w-4 h-4" /> },
      { id: 'devops', name: 'Cloud Engineer / DevOps', description: 'Manage cloud infrastructure and deployment pipelines', icon: <Code className="w-4 h-4" /> },
      { id: 'cybersecurity', name: 'Cybersecurity Specialist', description: 'Protect systems and data from security threats', icon: <Code className="w-4 h-4" /> },
      { id: 'qa', name: 'QA / Software Tester', description: 'Test software quality and ensure bug-free releases', icon: <Code className="w-4 h-4" /> },
      { id: 'sysadmin', name: 'System Administrator', description: 'Maintain and configure computer systems', icon: <Code className="w-4 h-4" /> },
      { id: 'uiux', name: 'UI/UX Designer', description: 'Design user interfaces and user experiences', icon: <Code className="w-4 h-4" /> },
      { id: 'aiml', name: 'AI/ML Engineer', description: 'Develop artificial intelligence and machine learning solutions', icon: <Code className="w-4 h-4" /> }
    ]
  },
  {
    id: 'marketing',
    name: 'Digital Marketing',
    description: 'Roles focused on digital marketing and content creation',
    icon: <TrendingUp className="w-6 h-6" />,
    color: 'bg-green-500',
    roles: [
      { id: 'seo', name: 'SEO Specialist', description: 'Optimize websites for search engines', icon: <TrendingUp className="w-4 h-4" /> },
      { id: 'content', name: 'Content Writer / Copywriter', description: 'Create engaging written content and copy', icon: <FileText className="w-4 h-4" /> },
      { id: 'social', name: 'Social Media Manager', description: 'Manage social media presence and campaigns', icon: <Users className="w-4 h-4" /> },
      { id: 'ppc', name: 'Performance Marketer (PPC/Ads)', description: 'Run and optimize paid advertising campaigns', icon: <TrendingUp className="w-4 h-4" /> },
      { id: 'email', name: 'Email Marketing Specialist', description: 'Create and manage email marketing campaigns', icon: <FileText className="w-4 h-4" /> },
      { id: 'graphic', name: 'Graphic Designer', description: 'Create visual designs and graphics', icon: <FileText className="w-4 h-4" /> },
      { id: 'video', name: 'Video Editor / Motion Graphics', description: 'Edit videos and create motion graphics', icon: <FileText className="w-4 h-4" /> },
      { id: 'influencer', name: 'Influencer Marketing Manager', description: 'Manage influencer partnerships and campaigns', icon: <Users className="w-4 h-4" /> },
      { id: 'analytics', name: 'Analytics Specialist', description: 'Analyze marketing data and performance metrics', icon: <TrendingUp className="w-4 h-4" /> }
    ]
  },
  {
    id: 'blockchain',
    name: 'Blockchain',
    description: 'Specialized roles in blockchain and Web3 technologies',
    icon: <Link className="w-6 h-6" />,
    color: 'bg-purple-500',
    roles: [
      { id: 'blockchain-dev', name: 'Blockchain Developer', description: 'Develop blockchain applications and protocols', icon: <Link className="w-4 h-4" /> },
      { id: 'smart-contract', name: 'Smart Contract Auditor', description: 'Audit and secure smart contracts', icon: <Link className="w-4 h-4" /> },
      { id: 'web3', name: 'Web3 Developer', description: 'Build decentralized applications (dApps)', icon: <Link className="w-4 h-4" /> },
      { id: 'crypto-analyst', name: 'Crypto Analyst', description: 'Analyze cryptocurrency markets and trends', icon: <TrendingUp className="w-4 h-4" /> },
      { id: 'blockchain-architect', name: 'Blockchain Architect', description: 'Design blockchain system architecture', icon: <Link className="w-4 h-4" /> },
      { id: 'nft-token', name: 'NFT/Token Developer', description: 'Develop NFT and token contracts', icon: <Link className="w-4 h-4" /> }
    ]
  }
];

const RoleBasedTasks = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  
  // Check if employer is approved - redirect if not
  useEffect(() => {
    if (profile && profile.worker_status !== 'active_employee') {
      toast({
        title: "Access Restricted",
        description: "Please complete document verification to access role-based tasks.",
        variant: "destructive"
      });
      navigate('/employer/verify');
    }
  }, [profile, navigate, toast]);
  
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [availableWorkers, setAvailableWorkers] = useState<Worker[]>([]);
  const [selectedWorkers, setSelectedWorkers] = useState<Worker[]>([]);
  const [workerSearchQuery, setWorkerSearchQuery] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(1.0);
  
  // Dynamic subcategory fetching based on selected category
  const categoryNameForSkills = selectedCategory?.name === 'IT Department' ? 'IT' : 
                               selectedCategory?.name === 'Digital Marketing' ? 'Digital Marketing' :
                               selectedCategory?.name === 'Blockchain' ? 'Blockchain/AI' : '';
  
  const { skillsBySubcategory, allSkills, loading: skillsLoading, error: skillsError } = useSkillsByCategory(categoryNameForSkills);
  const [formData, setFormData] = useState<TaskFormData>({
    // Step 1: Task Details
    title: '',
    description: '',
    category: '',
    difficulty: '',
    instructions: [''],
    requirements: [''],
    
    // Step 2: Rating & Access Control
    requiredRating: '1.00',
    isTimeSensitive: false,
    
    // Step 3: Targeting
    targetCountries: [],
    minAge: '',
    maxAge: '',
    languages: [],
    deviceTypes: [],
    
    // Step 4: Payment & Worker Selection
    paymentPerTask: '',
    budget: '',
    duration: '',
    autoApproval: false,
    deadline: '',
    maxSlots: '1'
  });

  const [timeSlotData, setTimeSlotData] = useState({
    date: '',
    startTime: '',
    endTime: ''
  });

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

  // Map roles to their specific skill categories
  const roleToSkillsMapping = {
    "Frontend Developer": ["Frontend Development"],
    "Backend Developer": ["Backend Development"],
    "Full Stack Developer": ["Frontend Development", "Backend Development", "Full Stack Development"],
    "Mobile App Developer": ["Mobile Development"],
    "Database Administrator (DBA)": ["Database Administration"],
    "Cloud Engineer / DevOps": ["Cloud & DevOps"],
    "Cybersecurity Specialist": ["Database Administration", "Cloud & DevOps"], // Security related
    "QA / Software Tester": ["Frontend Development", "Backend Development"], // Testing both
    "System Administrator": ["Cloud & DevOps", "Database Administration"],
    "UI/UX Designer": ["Frontend Development"],
    "AI/ML Engineer": ["Backend Development", "Cloud & DevOps"],
    "SEO Specialist": ["SEO Specialist"],
    "Content Writer / Copywriter": ["Content Marketing"],
    "Social Media Manager": ["Social Media Management"],
    "Performance Marketer (PPC/Ads)": ["PPC Advertising"],
    "Email Marketing Specialist": ["Email Marketing"],
    "Graphic Designer": ["Content Marketing", "Social Media Management"],
    "Video Editor / Motion Graphics": ["Content Marketing", "Social Media Management"],
    "Influencer Marketing Manager": ["Social Media Management"],
    "Analytics Specialist": ["SEO Specialist", "PPC Advertising", "Email Marketing"],
    "Blockchain Developer": ["Blockchain Development"],
    "Smart Contract Auditor": ["Smart Contract Auditing"],
    "Web3 Developer": ["Web3 Development"],
    "Crypto Analyst": ["Crypto Analysis"],
    "Blockchain Architect": ["Blockchain Architecture"],
    "NFT/Token Developer": ["NFT/Token Development"]
  };

  // Get skills for the selected role
  const getSkillsForRole = (roleName: string) => {
    const relevantCategories = roleToSkillsMapping[roleName] || [];
    const roleSkills: Record<string, string[]> = {};
    
    relevantCategories.forEach(category => {
      if (skillsByCategory[category]) {
        roleSkills[category] = skillsByCategory[category];
      }
    });
    
    return roleSkills;
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

  // Flatten all skills for the dropdown (fallback)
  const skillOptions = Object.values(skillsByCategory).flat();

  useEffect(() => {
    if (isDialogOpen) {
      loadAvailableWorkers();
    }
  }, [minRating, selectedSkills, selectedLanguages, isDialogOpen, selectedCategory]);

  const loadAvailableWorkers = async () => {
    try {
      console.log('Loading workers for role-based task:', {
        selectedCategory: selectedCategory?.name,
        minRating,
        selectedSkills,
        selectedLanguages
      });

      let query = supabase
        .from('profiles')
        .select('user_id, full_name, rating, total_tasks_completed, skills, languages, location, category')
        .eq('role', 'worker')
        .gte('rating', minRating);

      // Filter by worker category if selectedCategory is set
      if (selectedCategory?.name) {
        // Map role-based category names to worker category names
        let workerCategory = selectedCategory.name;
        if (selectedCategory.name === 'IT Department') {
          workerCategory = 'IT';
        } else if (selectedCategory.name === 'Digital Marketing') {
          workerCategory = 'Digital Marketing';
        } else if (selectedCategory.name === 'Blockchain') {
          workerCategory = 'Blockchain/AI';
        }
        
        console.log('Adding category filter for role-based task:', selectedCategory.name, '->', workerCategory);
        query = query.eq('category', workerCategory);
      }

      if (selectedSkills.length > 0) {
        query = query.contains('skills', selectedSkills);
      }

      if (selectedLanguages.length > 0) {
        query = query.contains('languages', selectedLanguages);
      }

      console.log('Final query filters applied for role-based task');
      const { data, error } = await query.order('rating', { ascending: false });

      if (error) {
        console.error('Error loading workers:', error);
        return;
      }

      console.log('Loaded workers for role-based task:', data?.length || 0, 'workers');
      console.log('Workers data with categories:', data?.map(w => ({ name: w.full_name, category: w.category, rating: w.rating })));
      
      // Debug: Show all workers in database for troubleshooting
      if (data?.length === 0) {
        console.log('No workers found. Checking all workers in database...');
        const { data: allWorkers } = await supabase
          .from('profiles')
          .select('user_id, full_name, category, rating')
          .eq('role', 'worker');
        console.log('All workers in database:', allWorkers?.map(w => ({ name: w.full_name, category: w.category, rating: w.rating })));
      }

      const workers = (data || []).map(worker => ({
        ...worker,
        skills: Array.isArray(worker.skills) ? worker.skills : [],
        languages: Array.isArray(worker.languages) ? worker.languages : []
      }));

      setAvailableWorkers(workers);
    } catch (error) {
      console.error('Error loading workers:', error);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const handleCreateTask = (role: Role, category: Category) => {
    setSelectedRole(role);
    setSelectedCategory(category);
    setSelectedSkills([]); // Clear skills when role changes
    setFormData(prev => ({
      ...prev,
      category: category.name,
      title: `${role.name} Task`,
      description: `Looking for a skilled ${role.name} to help with this project. ${role.description}`
    }));
    setCurrentStep(1);
    setIsDialogOpen(true);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    return matchesSearch;
  });

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
      // Create task data matching your database schema
      const taskData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        difficulty: formData.difficulty || 'medium',
        requirements: formData.requirements.filter(Boolean).join(", "),
        budget: Number(formData.paymentPerTask) || 0,
        status: "active",
        created_by: user.id, // This should match auth.users.id
        user_id: user.id, // Required field with auth.uid() default
        required_rating: Number(formData.requiredRating) || 1.0,
        max_workers: Number(formData.maxSlots) || 1,
        assigned_count: 0,
        role_category: selectedCategory?.name === 'IT Department' ? 'IT' : 
                      selectedCategory?.name === 'Digital Marketing' ? 'Digital Marketing' :
                      selectedCategory?.name === 'Blockchain' ? 'Blockchain/AI' :
                      'General',
        slots: Number(formData.maxSlots) || 1,
        completed_slots: 0
      };

      console.log('Creating task with data:', taskData);
      console.log('User ID:', user.id);
      console.log('Profile ID:', profile?.id);
      
      let { data, error } = await supabase.from("tasks").insert(taskData);
      
      console.log('Task creation result:', { data, error });
      
      if (error) {
        console.error('Task creation error details:', error);
        
        // Try with profile.user_id if there's a foreign key constraint error
        if (String(error.message || "").includes("fkey") || String(error.message || "").includes("constraint")) {
          console.log('Trying alternative approach...');
          
          // Try without user_id field (let it use default auth.uid())
          const { user_id, ...taskDataWithoutUserId } = taskData;
          
          const retry = await supabase.from("tasks").insert(taskDataWithoutUserId);
          console.log('Retry without user_id result:', retry);
          
          if (retry.error) {
            console.error('Retry also failed:', retry.error);
            throw retry.error;
          }
        } else {
          throw error;
        }
      }

      toast({
        title: "Task created successfully!",
        description: `Your ${formData.requiredRating}-star ${selectedRole?.name} task is now available for workers to assign themselves. Max slots: ${formData.maxSlots}`,
      });
      
      // Reset form and close dialog
      setFormData({
        title: '', description: '', category: '', difficulty: '', instructions: [''], requirements: [''],
        requiredRating: '1.00', isTimeSensitive: false,
        targetCountries: [], minAge: '', maxAge: '', languages: [], deviceTypes: [],
        paymentPerTask: '', budget: '', duration: '', autoApproval: false, deadline: ''
      });
      setSelectedWorkers([]);
      setCurrentStep(1);
      setIsDialogOpen(false);
      setSelectedRole(null);
      setSelectedCategory(null);
      
      navigate("/employer/campaigns");
    } catch (e: any) {
      toast({ title: "Failed to create task", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

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
                placeholder="e.g., Frontend Developer - React Component Development"
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
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    {selectedCategory?.icon}
                    <span>{selectedCategory?.name}</span>
                  </Badge>
                </div>
              </div>

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
                  {selectedCategory?.name && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Showing workers from <strong>{selectedCategory.name}</strong> category
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
                  <strong>Debug Info (Role-Based):</strong><br/>
                  Selected Category: {selectedCategory?.name || 'None'}<br/>
                  Mapped to Worker Category: {
                    selectedCategory?.name === 'IT Department' ? 'IT' :
                    selectedCategory?.name === 'Digital Marketing' ? 'Digital Marketing' :
                    selectedCategory?.name === 'Blockchain' ? 'Blockchain/AI' : 'None'
                  }<br/>
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
                  {selectedRole && (
                    <p className="text-sm text-muted-foreground">
                      Select required skills for <strong>{selectedRole.name}</strong>
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
                        // Show ONLY selected role's skills
                        (() => {
                          let skillsToShow: string[] = [];
                          
                          // If specific role is selected, show ONLY that role's skills
                          if (selectedRole?.name && skillsByRole[selectedRole.name as keyof typeof skillsByRole]) {
                            skillsToShow = skillsByRole[selectedRole.name as keyof typeof skillsByRole];
                          } else {
                            // If no role selected, show empty or message
                            return (
                              <div className="p-4 text-center text-gray-500">
                                Please select a specific role to see required skills
                              </div>
                            );
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
                      No workers found matching your criteria
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredWorkers.map((worker) => (
                        <div key={worker.user_id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-2">
                          <div className="flex items-center">
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
                        Workers shown above can assign themselves to this task. 
                        They will see this task in their Browse Jobs page and can assign themselves up to the slot limit.
                      </p>
                      <div className="mt-2 text-xs text-green-600">
                        <strong>Available Workers:</strong> {filteredWorkers.length} workers match your criteria
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Old Selected Workers Section - Remove this */}
              {false && selectedWorkers.length > 0 && (
                <div className="space-y-3">
                  <Label>Selected Workers ({selectedWorkers.length})</Label>
                  <div className="space-y-2">
                    {selectedWorkers.map((worker) => (
                      <div key={worker.user_id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <span className="font-medium">{worker.full_name}</span>
                            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span>{worker.rating.toFixed(1)}</span>
                              <span>•</span>
                              <span>{worker.total_tasks_completed} tasks completed</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeWorker(worker.user_id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-100"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg">Campaign Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Role:</span>
                  <span className="font-semibold">{selectedRole?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Category:</span>
                  <span className="font-semibold">{selectedCategory?.name}</span>
                </div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Create Role-Based Tasks
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Select a category and role to create specialized tasks for your team. 
            Find the perfect match for your project needs.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {categories.map((category) => (
            <Card 
              key={category.id} 
              className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
              onClick={() => toggleCategory(category.id)}
            >
              <CardHeader className={`${category.color} text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {category.icon}
                    <CardTitle className="text-xl">{category.name}</CardTitle>
                  </div>
                  {expandedCategory === category.id ? (
                    <ChevronDown className="w-5 h-5 transition-transform duration-200" />
                  ) : (
                    <ChevronRight className="w-5 h-5 transition-transform duration-200" />
                  )}
                </div>
                <p className="text-white/90 text-sm mt-2">{category.description}</p>
              </CardHeader>
              
              <CardContent className="p-0">
                <div 
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    expandedCategory === category.id ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="p-6 space-y-3">
                    {category.roles.map((role) => (
                      <div 
                        key={role.id}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors duration-200"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            {role.icon}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{role.name}</h3>
                            <p className="text-sm text-slate-600">{role.description}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateTask(role, category);
                          }}
                          className="bg-slate-900 hover:bg-slate-800"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create Task
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Task Creation Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Create {selectedRole?.name} Task</span>
              </DialogTitle>
              <DialogDescription>
                Create a specialized task for {selectedRole?.name} role. Fill in the details and requirements for this position.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Role and Category Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary" className="flex items-center space-x-1">
                      {selectedCategory?.icon}
                      <span>{selectedCategory?.name}</span>
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Role</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className="flex items-center space-x-1">
                      {selectedRole?.icon}
                      <span>{selectedRole?.name}</span>
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Step Progress */}
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

              {/* Step Content */}
              <Card>
                <CardContent className="p-6">
                  {renderStepContent()}
                </CardContent>
              </Card>

              {/* Navigation Buttons */}
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
                      currentStep === 1 ? (!formData.title || !formData.description || !formData.category) :
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
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default RoleBasedTasks;

