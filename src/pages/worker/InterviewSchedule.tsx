import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useWorkerInterview } from '@/hooks/useWorkerInterview';
import { 
  Calendar, 
  Clock, 
  Video, 
  MapPin, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  Mail,
  Phone
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

const InterviewSchedule = () => {
  const { profile, user } = useAuth();
  const { interview, loading, error } = useWorkerInterview(user?.id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Loading interview details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading interview details: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-primary/20 text-primary border-primary';
      case 'completed':
        return 'bg-success/20 text-success border-success';
      case 'cancelled':
        return 'bg-destructive/20 text-destructive border-destructive';
      case 'rescheduled':
        return 'bg-warning/20 text-warning border-warning';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'selected':
        return 'bg-success/20 text-success border-success';
      case 'rejected':
        return 'bg-destructive/20 text-destructive border-destructive';
      case 'pending':
        return 'bg-warning/20 text-warning border-warning';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Interview Schedule</h1>
          <p className="text-muted-foreground">
            Your interview details and status
          </p>
        </motion.div>

        {/* Interview Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Calendar className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Interview Details</CardTitle>
                    <p className="text-muted-foreground">
                      {interview ? 'Your interview information' : 'No interview scheduled yet'}
                    </p>
                  </div>
                </div>
                {interview && (
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(interview.status)}>
                      {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                    </Badge>
                    {interview.result && (
                      <Badge className={getResultColor(interview.result)}>
                        {interview.result.charAt(0).toUpperCase() + interview.result.slice(1)}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {!interview ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No interview has been scheduled yet. Please wait for the employer to schedule your interview.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-6">
                  {/* Interview Date & Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Date & Time</span>
                      </div>
                      <p className="text-lg">
                        {format(new Date(interview.scheduled_date), 'EEEE, MMMM do, yyyy')}
                      </p>
                      <p className="text-muted-foreground">
                        {format(new Date(interview.scheduled_date), 'h:mm a')}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Mode</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {interview.mode === 'online' ? (
                          <Video className="h-4 w-4 text-primary" />
                        ) : (
                          <MapPin className="h-4 w-4 text-primary" />
                        )}
                        <span className="capitalize">{interview.mode}</span>
                      </div>
                    </div>
                  </div>

                  {/* Meeting Details */}
                  {interview.mode === 'online' && interview.meeting_link && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Video className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Meeting Link</span>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <a 
                          href={interview.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline break-all"
                        >
                          {interview.meeting_link}
                        </a>
                      </div>
                    </div>
                  )}

                  {interview.mode === 'offline' && interview.location && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Location</span>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p>{interview.location}</p>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {interview.notes && (
                    <div className="space-y-2">
                      <span className="font-semibold">Additional Notes</span>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="whitespace-pre-wrap">{interview.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Feedback */}
                  {interview.feedback && (
                    <div className="space-y-2">
                      <span className="font-semibold">Interview Feedback</span>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="whitespace-pre-wrap">{interview.feedback}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {interview.status === 'scheduled' && (
                    <div className="flex items-center space-x-4 pt-4 border-t">
                      {interview.mode === 'online' && interview.meeting_link && (
                        <Button asChild>
                          <a 
                            href={interview.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2"
                          >
                            <Video className="h-4 w-4" />
                            <span>Join Meeting</span>
                          </a>
                        </Button>
                      )}
                      
                      <Button variant="outline" disabled>
                        <Calendar className="h-4 w-4 mr-2" />
                        Interview Scheduled
                      </Button>
                    </div>
                  )}

                  {interview.status === 'completed' && interview.result === 'selected' && (
                    <Alert className="border-success bg-success/5">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <AlertDescription className="text-success">
                        <strong>Congratulations!</strong> Interview done by {interview.employer_name || 'the employer'}. 
                        You will receive further instructions via email.
                      </AlertDescription>
                    </Alert>
                  )}

                  {interview.status === 'completed' && interview.result === 'rejected' && (
                    <Alert className="border-destructive bg-destructive/5">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <AlertDescription className="text-destructive">
                        Thank you for your interest. {interview.employer_name || 'The employer'} has decided to go with another candidate. 
                        Please keep an eye out for other opportunities.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Profile Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Your Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span>{profile?.email}</span>
                </div>
                {profile?.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Phone:</span>
                    <span>{profile.phone}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant="outline">
                    {profile?.status?.replace('_', ' ').toUpperCase() || 'Unknown'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default InterviewSchedule;

