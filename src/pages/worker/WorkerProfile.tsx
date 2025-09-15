import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  User,
  Star,
  MapPin,
  Calendar,
  Camera,
  Save,
  Settings,
  Award,
  Target,
  TrendingUp,
  CheckCircle,
  Wallet
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { createSafeProfileUpdateData } from "@/lib/profile-utils";

const WorkerProfile = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    category: "",
    skills: ["Social Media", "Content Writing", "App Testing", "Surveys"],
    languages: ["English", "Spanish"],
    timezone: "EST",
    availability: "Full-time"
  });

  useEffect(() => {
    // Initialize profile data from Supabase profile and auth user
    const fullName = profile?.full_name || "";
    const [firstName, ...rest] = fullName.split(" ");
    const lastName = rest.join(" ");
    setProfileData((prev) => ({
      ...prev,
      firstName: firstName || "",
      lastName: lastName || "",
      email: user?.email || "",
      phone: profile?.phone || "",
      category: profile?.category || "",
    }));
  }, [profile, user]);

  const workerStats = {
    rating: profile?.rating || 1.0, // New workers start with 1.0 rating
    totalTasks: profile?.total_tasks_completed || 0,
    successRate: profile?.total_tasks_completed > 0 ? 95 : 0, // Placeholder for now
    memberSince: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "Recently",
    totalEarned: profile?.total_earnings || 0,
    badges: [
      { name: "Top Performer", icon: Award, color: "text-yellow-500", condition: (profile?.rating || 0) >= 4.5 },
      { name: "Fast Completer", icon: Target, color: "text-blue-500", condition: (profile?.total_tasks_completed || 0) >= 10 },
      { name: "Quality Worker", icon: Star, color: "text-purple-500", condition: (profile?.rating || 0) >= 4.0 },
      { name: "New Worker", icon: User, color: "text-green-500", condition: (profile?.total_tasks_completed || 0) < 5 }
    ].filter(badge => badge.condition)
  };

  const skillOptions = [
    "Social Media", "Content Writing", "App Testing", "Surveys", 
    "Data Entry", "Translation", "Voice Recording", "Product Reviews",
    "Website Testing", "Email Marketing", "SEO", "Graphic Design"
  ];

  const languageOptions = [
    "English", "Spanish", "French", "German", "Italian", "Portuguese",
    "Chinese", "Japanese", "Korean", "Arabic", "Hindi", "Russian"
  ];

  const handleSave = async () => {
    if (!user) return;
    
    setIsEditing(false);
    try {
      // Update profile with new data
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: `${profileData.firstName} ${profileData.lastName}`.trim(),
          phone: profileData.phone,
          category: profileData.category,
          skills: profileData.skills,
          languages: profileData.languages,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Profile updated successfully!",
        description: "Your profile information has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to update profile",
        description: error?.message || "An error occurred while updating your profile.",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSkill = (skill: string) => {
    const updatedSkills = profileData.skills.includes(skill)
      ? profileData.skills.filter(s => s !== skill)
      : [...profileData.skills, skill];
    handleInputChange('skills', updatedSkills);
  };

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Worker Profile</h1>
            <p className="text-muted-foreground">Manage your profile and preferences</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" asChild>
              <Link to="/worker">← Back to Dashboard</Link>
            </Button>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mx-auto mb-4">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{workerStats.rating.toFixed(1)}</h3>
              <p className="text-muted-foreground">Current Rating</p>
              <div className="flex items-center justify-center mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(workerStats.rating)
                        ? "text-yellow-500 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{workerStats.totalTasks}</h3>
              <p className="text-muted-foreground">Tasks Completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-4">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{workerStats.successRate}%</h3>
              <p className="text-muted-foreground">Success Rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-4">
                <Wallet className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{formatINR(workerStats.totalEarned)}</h3>
              <p className="text-muted-foreground">Total Earned</p>
            </CardContent>
          </Card>
        </div>

        {/* Rating Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span>Rating System & Task Access</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Your Current Status</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm">Current Rating:</span>
                    <div className="flex items-center space-x-1">
                      <span className="font-semibold">{workerStats.rating.toFixed(1)}</span>
                      <Star className="h-4 w-4 text-yellow-500" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm">Tasks Completed:</span>
                    <span className="font-semibold">{workerStats.totalTasks}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm">Total Earnings:</span>
                    <span className="font-semibold">{formatINR(workerStats.totalEarned)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Task Access Levels</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>1★ Tasks:</span>
                    <span className="text-green-600">✓ Always Accessible</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>2★ Tasks:</span>
                    <span className={workerStats.rating >= 2.0 ? "text-green-600" : "text-red-600"}>
                      {workerStats.rating >= 2.0 ? "✓ Accessible" : "✗ Requires 2.0★ rating"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>3★ Tasks:</span>
                    <span className={workerStats.rating >= 3.0 ? "text-green-600" : "text-red-600"}>
                      {workerStats.rating >= 3.0 ? "✓ Accessible" : "✗ Requires 3.0★ rating"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>4★ Tasks:</span>
                    <span className={workerStats.rating >= 4.0 ? "text-green-600" : "text-red-600"}>
                      {workerStats.rating >= 4.0 ? "✓ Accessible" : "✗ Requires 4.0★ rating"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>5★ Tasks:</span>
                    <span className={workerStats.rating >= 5.0 ? "text-green-600" : "text-red-600"}>
                      {workerStats.rating >= 5.0 ? "✓ Accessible" : "✗ Requires 5.0★ rating"}
                    </span>
                  </div>
                </div>
                
                {workerStats.rating < 4.0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>Tip:</strong> Complete more tasks with high ratings to unlock access to premium 4★ and 5★ tasks!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skills & Languages Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-500" />
              <span>Skills & Languages</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Your Skills</Label>
                  {isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newSkill = prompt("Enter a new skill:");
                        if (newSkill && !profileData.skills.includes(newSkill)) {
                          setProfileData(prev => ({
                            ...prev,
                            skills: [...prev.skills, newSkill]
                          }));
                        }
                      }}
                    >
                      Add Skill
                    </Button>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {profileData.skills.map((skill, index) => (
                    <Badge key={skill} variant="secondary" className="text-sm">
                      {skill}
                      {isEditing && (
                        <button
                          onClick={() => {
                            setProfileData(prev => ({
                              ...prev,
                              skills: prev.skills.filter((_, i) => i !== index)
                            }));
                          }}
                          className="ml-2 hover:text-destructive"
                        >
                          ×
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  These skills help employers find you for relevant tasks. Add skills that match your expertise.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Languages You Know</Label>
                  {isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newLanguage = prompt("Enter a new language:");
                        if (newLanguage && !profileData.languages.includes(newLanguage)) {
                          setProfileData(prev => ({
                            ...prev,
                            languages: [...prev.languages, newLanguage]
                          }));
                        }
                      }}
                    >
                      Add Language
                    </Button>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {profileData.languages.map((language, index) => (
                    <Badge key={language} variant="outline" className="text-sm">
                      {language}
                      {isEditing && (
                        <button
                          onClick={() => {
                            setProfileData(prev => ({
                              ...prev,
                              languages: prev.languages.filter((_, i) => i !== index)
                            }));
                          }}
                          className="ml-2 hover:text-destructive"
                        >
                          ×
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Language skills increase your chances of being selected for multilingual tasks.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Overview */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="relative inline-block">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src="/placeholder-avatar.jpg" alt="Profile" />
                    <AvatarFallback className="text-2xl bg-gradient-primary text-primary-foreground">
                      {profileData.firstName[0]}{profileData.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button size="sm" variant="outline" className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0">
                      <Camera className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold">
                    {profileData.firstName} {profileData.lastName}
                  </h3>
                  <p className="text-muted-foreground flex items-center justify-center mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    {profileData.location}
                  </p>
                </div>

                <div className="flex items-center justify-center space-x-1">
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  <span className="font-semibold">{workerStats.rating}</span>
                  <span className="text-muted-foreground">({workerStats.totalTasks} tasks)</span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-success">{workerStats.successRate}%</p>
                    <p className="text-xs text-muted-foreground">Success Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">₹{workerStats.totalEarned}</p>
                    <p className="text-xs text-muted-foreground">Total Earned</p>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-center space-x-1">
                  {workerStats.badges.map((badge, index) => (
                    <div key={badge.name} className="text-center">
                      <badge.icon className={`h-6 w-6 mx-auto ${badge.color}`} />
                      <p className="text-xs mt-1">{badge.name}</p>
                    </div>
                  ))}
                </div>

                <div className="text-center pt-2">
                  <p className="text-sm text-muted-foreground flex items-center justify-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Member since {workerStats.memberSince}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    disabled
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={profileData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={profileData.category}
                    onValueChange={(value) => handleInputChange('category', value)}
                    disabled={!isEditing}
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

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    disabled={!isEditing}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Skills & Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Skills & Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Skills</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {skillOptions.map((skill) => (
                      <div key={skill} className="flex items-center space-x-2">
                        <Checkbox
                          id={skill}
                          checked={profileData.skills.includes(skill)}
                          onCheckedChange={() => toggleSkill(skill)}
                          disabled={!isEditing}
                        />
                        <Label htmlFor={skill} className="text-sm">{skill}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select 
                      value={profileData.timezone} 
                      onValueChange={(value) => handleInputChange('timezone', value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EST">Eastern Time (EST)</SelectItem>
                        <SelectItem value="PST">Pacific Time (PST)</SelectItem>
                        <SelectItem value="CST">Central Time (CST)</SelectItem>
                        <SelectItem value="MST">Mountain Time (MST)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="availability">Availability</Label>
                    <Select 
                      value={profileData.availability} 
                      onValueChange={(value) => handleInputChange('availability', value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Weekends">Weekends only</SelectItem>
                        <SelectItem value="Evenings">Evenings only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Languages</Label>
                  <div className="flex flex-wrap gap-2">
                    {profileData.languages.map((lang) => (
                      <Badge key={lang} variant="secondary">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerProfile;