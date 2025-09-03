import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search,
  Filter,
  Clock,
  IndianRupee,
  Users,
  Star,
  Briefcase,
  Timer,
  Calendar,
  AlertCircle,
  TrendingUp,
  Award,
  Zap
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const WorkerJobs = () => {
  const { user, profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [workerRating, setWorkerRating] = useState<number>(3.0);
  const [showRatingInfo, setShowRatingInfo] = useState(false);

  useEffect(() => {
    const loadTasks = async () => {
      if (!user || !profile) return;
      setIsLoading(true);
      setLoadError(null);
      try {
        // Load worker's current rating
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("rating, total_tasks_completed, total_earnings")
          .eq("user_id", user.id)
          .single();

        if (profileError) {
          console.error('Profile error:', profileError);
        } else if (profileData) {
          setWorkerRating(profileData.rating || 3.0);
        }

        // Load tasks that the worker is qualified for based on rating
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .gte("required_rating", profileData?.rating || 1.0)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setTasks(data || []);
      } catch (e: any) {
        setLoadError(e?.message || "Failed to load tasks");
      } finally {
        setIsLoading(false);
      }
    };
    loadTasks();
  }, [user, profile]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => t.category && set.add(t.category));
    return [{ value: "all", label: "All Categories" }, ...Array.from(set).map((c) => ({ value: c, label: c }))];
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const q = searchQuery.toLowerCase();
    
    return tasks.filter((task) => {
      const matchesSearch = task.title?.toLowerCase().includes(q) || 
                           task.description?.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === "all" || task.category === selectedCategory;
      const meetsRating = (task.required_rating || 1.0) <= workerRating;
      
      return matchesSearch && matchesCategory && meetsRating;
    });
  }, [tasks, searchQuery, selectedCategory, workerRating]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-800 border-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "hard":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-muted text-muted-foreground border-muted";
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return <Zap className="h-3 w-3" />;
      case "medium":
        return <TrendingUp className="h-3 w-3" />;
      case "hard":
        return <Award className="h-3 w-3" />;
      default:
        return <Star className="h-3 w-3" />;
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    if (rating >= 4.0) return "text-yellow-500 bg-yellow-50 border-yellow-200";
    if (rating >= 3.0) return "text-blue-500 bg-blue-50 border-blue-200";
    if (rating >= 2.0) return "text-orange-500 bg-orange-50 border-orange-200";
    return "text-red-500 bg-red-50 border-red-200";
  };

  const formatTimeSlot = (task: any) => {
    if (!task.is_time_sensitive || !task.time_slot_date) return null;
    
    const date = new Date(task.time_slot_date).toLocaleDateString();
    const startTime = task.time_slot_start;
    const endTime = task.time_slot_end;
    
    return `${date} ${startTime} - ${endTime}`;
  };

  const isTimeSlotActive = (task: any) => {
    if (!task.is_time_sensitive || !task.time_slot_date) return true;
    
    const now = new Date();
    const taskDate = new Date(task.time_slot_date);
    const currentTime = now.toTimeString().slice(0, 5);
    
    // Check if current date matches task date
    if (now.toDateString() !== taskDate.toDateString()) {
      return false;
    }
    
    // Check if current time is within the slot
    return currentTime >= task.time_slot_start && currentTime <= task.time_slot_end;
  };

  const getTimeProgress = (task: any) => {
    if (!task.is_time_sensitive || !task.time_slot_date || !task.time_slot_start || !task.time_slot_end) {
      return null;
    }

    const now = new Date();
    const taskDate = new Date(task.time_slot_date);
    
    // If not today, return null
    if (now.toDateString() !== taskDate.toDateString()) {
      return null;
    }

    const startTime = new Date(`${taskDate.toDateString()} ${task.time_slot_start}`);
    const endTime = new Date(`${taskDate.toDateString()} ${task.time_slot_end}`);
    
    if (now < startTime) {
      return { progress: 0, status: "upcoming" };
    } else if (now > endTime) {
      return { progress: 100, status: "expired" };
    } else {
      const totalDuration = endTime.getTime() - startTime.getTime();
      const elapsed = now.getTime() - startTime.getTime();
      const progress = Math.min((elapsed / totalDuration) * 100, 100);
      return { progress, status: "active" };
    }
  };

  const canAccessTask = (task: any) => {
    return (task.required_rating || 1.0) <= workerRating;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Star key="half" className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />);
    }
    
    return stars;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Available Tasks</h1>
            <p className="text-muted-foreground">Find tasks that match your skills and rating level</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/worker">← Back to Dashboard</Link>
          </Button>
        </div>

        {/* Worker Rating Info */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="font-semibold text-lg">{workerRating.toFixed(1)}</span>
                </div>
                <div>
                  <p className="font-medium">Your Current Rating</p>
                  <p className="text-sm text-muted-foreground">
                    {profile?.total_tasks_completed || 0} tasks completed
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRatingInfo(!showRatingInfo)}
              >
                {showRatingInfo ? "Hide" : "Show"} Rating Info
              </Button>
            </div>
            
            {showRatingInfo && (
              <div className="mt-4 p-3 bg-white rounded-lg border">
                <h4 className="font-medium mb-2">Rating System:</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-medium">1★</div>
                    <div className="text-xs text-muted-foreground">Basic</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-medium">2★</div>
                    <div className="text-xs text-muted-foreground">Beginner</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-medium">3★</div>
                    <div className="text-xs text-muted-foreground">Intermediate</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-medium">4★</div>
                    <div className="text-xs text-muted-foreground">Advanced</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-medium">5★</div>
                    <div className="text-xs text-muted-foreground">Expert</div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  You can only see and apply for tasks that match your rating level or lower.
                </p>
                <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                  <p className="text-xs text-green-800">
                    <strong>New:</strong> Employers can now pre-select workers based on skills and ratings!
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search tasks..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="md:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            {isLoading ? "Loading tasks..." : `Showing ${filteredTasks.length} of ${tasks.length} available tasks`}
          </p>
        </div>

        {loadError && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-destructive">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>{loadError}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && filteredTasks.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Tasks Available</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedCategory !== "all" 
                  ? "No tasks match your current filters."
                  : "No tasks are currently available for your rating level."
                }
              </p>
              {workerRating < 3.0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-sm text-yellow-800">
                    <strong>Tip:</strong> Complete more tasks to improve your rating and unlock higher-level opportunities!
                  </p>
                </div>
              )}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 max-w-md mx-auto">
                <p className="text-sm text-blue-800">
                  <strong>Pro Tip:</strong> Keep your skills and languages updated in your profile to increase your chances of being selected for tasks!
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {filteredTasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              >
              <Card className={`hover:shadow-md transition-shadow ${
                !canAccessTask(task) ? 'opacity-60' : ''
              }`}>
                  <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">{task.title}</h3>
                          <p className="text-muted-foreground mb-3 line-clamp-2">
                            {task.description}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Badge variant="secondary" className={`${getDifficultyColor(task.difficulty)} flex items-center space-x-1`}>
                            {getDifficultyIcon(task.difficulty)}
                            <span>{task.difficulty || "Not specified"}</span>
                          </Badge>
                          <Badge variant="outline" className={`${getRatingColor(task.required_rating || 1.0)} flex items-center space-x-1`}>
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span>{task.required_rating || 1.0}★</span>
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <IndianRupee className="h-4 w-4" />
                          <span className="font-medium text-foreground">{formatINR(task.budget || 0)}</span>
                          </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{task.slots || 1} slot{task.slots !== 1 ? 's' : ''}</span>
                            </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{task.category || "General"}</span>
                        </div>
                        {task.is_time_sensitive && (
                          <div className="flex items-center space-x-1">
                            <Timer className="h-4 w-4" />
                            <span className={isTimeSlotActive(task) ? "text-green-600" : "text-red-600"}>
                              {isTimeSlotActive(task) ? "Active Now" : "Time Restricted"}
                            </span>
                          </div>
                        )}
                          </div>

                      {/* Time Slot Information with Progress Bar */}
                      {task.is_time_sensitive && formatTimeSlot(task) && (
                        <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-blue-800 font-medium">
                              Time Slot: {formatTimeSlot(task)}
                            </span>
                          </div>
                          
                          {/* Progress Bar for Time-Sensitive Tasks */}
                          {(() => {
                            const timeProgress = getTimeProgress(task);
                            if (!timeProgress) return null;
                            
                            return (
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-blue-700">
                                  <span>
                                    {timeProgress.status === "upcoming" && "Starting soon..."}
                                    {timeProgress.status === "active" && "In progress..."}
                                    {timeProgress.status === "expired" && "Time expired"}
                                  </span>
                                  <span>{Math.round(timeProgress.progress)}%</span>
                                </div>
                                <Progress value={timeProgress.progress} className="h-2" />
                                <div className="flex justify-between text-xs text-blue-600">
                                  <span>{task.time_slot_start}</span>
                                  <span>{task.time_slot_end}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Rating Requirements Display */}
                      <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-gray-700">
                          <strong>Required Rating:</strong> {task.required_rating || 1.0}★ 
                          {task.required_rating > workerRating && (
                            <span className="text-red-600 ml-2">(Your rating: {workerRating.toFixed(1)}★)</span>
                          )}
                        </span>
                      </div>

                      {/* Star Rating Display */}
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Task Level:</span>
                        <div className="flex items-center space-x-1">
                          {renderStars(task.required_rating || 1.0)}
                        </div>
                        <span className="text-xs text-gray-500 ml-2">
                          {task.required_rating >= 4.5 ? "Expert Level" :
                           task.required_rating >= 4.0 ? "Advanced Level" :
                           task.required_rating >= 3.0 ? "Intermediate Level" :
                           task.required_rating >= 2.0 ? "Beginner Level" : "Basic Level"}
                        </span>
                      </div>

                      {!canAccessTask(task) && (
                        <div className="flex items-center space-x-2 p-2 bg-red-50 rounded-lg border border-red-200">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <span className="text-sm text-red-800">
                            Requires {task.required_rating}★ rating. Your rating: {workerRating.toFixed(1)}★
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 md:w-32">
                      <Button 
                        className="w-full" 
                        disabled={!canAccessTask(task)}
                        asChild
                      >
                        <Link to={`/worker/task/${task.id}`}>
                          {canAccessTask(task) ? "View Details" : "Rating Too Low"}
                        </Link>
                      </Button>
                      
                      {task.requirements && (
                        <p className="text-xs text-muted-foreground text-center">
                          {task.requirements}
                        </p>
                      )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkerJobs;