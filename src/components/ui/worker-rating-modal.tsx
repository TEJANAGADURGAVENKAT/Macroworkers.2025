import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, CheckCircle, AlertCircle, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface WorkerRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: any;
  task: any;
  worker: any;
  onRatingComplete: () => void;
}

const WorkerRatingModal = ({
  isOpen,
  onClose,
  submission,
  task,
  worker,
  onRatingComplete
}: WorkerRatingModalProps) => {
  const { toast } = useToast();
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState<number>(0);

  const ratingDescriptions = {
    1: "Poor - Work quality was below expectations",
    2: "Fair - Work quality was acceptable but needs improvement",
    3: "Good - Work quality met basic requirements",
    4: "Very Good - Work quality exceeded expectations",
    5: "Excellent - Outstanding work quality and professionalism"
  };

  const handleRatingSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Update the submission with the rating
      const { error: submissionError } = await supabase
        .from("task_submissions")
        .update({
          employer_rating_given: rating,
          rating_feedback: feedback,
          reviewed_at: new Date().toISOString(),
          status: "approved"
        })
        .eq("id", submission.id);

      if (submissionError) throw submissionError;

      // Update worker's rating using the database function
      const { error: ratingError } = await supabase.rpc("update_worker_rating", {
        worker_id_param: worker.user_id,
        new_rating: rating,
        task_id_param: task.id
      });

      if (ratingError) {
        console.error("Rating update error:", ratingError);
        // Continue even if rating update fails
      }

      // Update worker's total earnings
      const { error: earningsError } = await supabase
        .from("profiles")
        .update({
          total_earnings: (worker.total_earnings || 0) + (task.budget || 0)
        })
        .eq("user_id", worker.user_id);

      if (earningsError) {
        console.error("Earnings update error:", earningsError);
      }

      toast({
        title: "Rating Submitted Successfully!",
        description: `Worker rated ${rating} stars. Their overall rating has been updated.`,
      });

      onRatingComplete();
      onClose();
    } catch (error: any) {
      console.error("Rating submission error:", error);
      toast({
        title: "Rating Submission Failed",
        description: error?.message || "An error occurred while submitting the rating.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <Card className="relative">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Rate Worker Performance</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Task and Worker Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Task Completed
                  </h4>
                  <p className="text-sm font-medium">{task?.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Budget: ₹{task?.budget || 0}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <User className="h-4 w-4 mr-2 text-blue-600" />
                    Worker
                  </h4>
                  <p className="text-sm font-medium">{worker?.full_name || "Unknown Worker"}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs text-muted-foreground">
                      Current Rating: {worker?.rating?.toFixed(1) || "3.0"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submission Details */}
              {submission?.proof_text && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium mb-2 text-blue-900">Worker's Submission</h4>
                  <p className="text-sm text-blue-800">{submission.proof_text}</p>
                </div>
              )}

              {/* Rating Section */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Rate the worker's performance *</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your rating will affect the worker's overall score and future task access
                  </p>
                </div>

                <div className="flex items-center justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="p-2 transition-all duration-200 hover:scale-110"
                      disabled={isSubmitting}
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= (hoveredRating || rating)
                            ? "text-yellow-500 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {rating > 0 && (
                  <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800 font-medium">
                      {rating} Star{rating !== 1 ? 's' : ''} - {ratingDescriptions[rating as keyof typeof ratingDescriptions]}
                    </p>
                  </div>
                )}
              </div>

              {/* Feedback Section */}
              <div className="space-y-3">
                <Label htmlFor="feedback">Additional Feedback (Optional)</Label>
                <Textarea
                  id="feedback"
                  placeholder="Provide specific feedback about the worker's performance, quality of work, timeliness, etc."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Constructive feedback helps workers improve and maintain quality standards.
                </p>
              </div>

              {/* Rating Impact Info */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <Star className="h-3 w-3 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-green-900 text-sm">Rating Impact</h4>
                    <ul className="text-xs text-green-700 mt-1 space-y-1">
                      <li>• 4-5 stars: Worker can access higher-level tasks</li>
                      <li>• 3 stars: Worker maintains current access level</li>
                      <li>• 1-2 stars: Worker's access may be restricted</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRatingSubmit}
                  disabled={isSubmitting || rating === 0}
                  className="bg-gradient-primary"
                >
                  {isSubmitting ? "Submitting..." : "Submit Rating"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WorkerRatingModal; 