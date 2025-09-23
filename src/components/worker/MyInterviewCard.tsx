import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Video, Users, CheckCircle, XCircle } from 'lucide-react';
import { useWorkerInterview } from '@/hooks/useWorkerInterview';
import { useAuth } from '@/hooks/useAuth';

interface MyInterviewCardProps {
  className?: string;
}

export const MyInterviewCard: React.FC<MyInterviewCardProps> = ({ className }) => {
  const { user } = useAuth();
  const { interview, loading, error } = useWorkerInterview(user?.id);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!interview?.scheduled_date) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const interviewTime = new Date(interview.scheduled_date).getTime();
      const difference = interviewTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        } else if (minutes > 0) {
          setTimeLeft(`${minutes}m ${seconds}s`);
        } else {
          setTimeLeft(`${seconds}s`);
        }
      } else {
        setTimeLeft('Interview time reached');
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [interview?.scheduled_date]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !interview) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Scheduled</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      case 'rescheduled':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Rescheduled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'selected':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Selected</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Not Selected</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">My Interview</CardTitle>
          <div className="flex gap-2">
            {getStatusBadge(interview.status)}
            {interview.result && getResultBadge(interview.result)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {formatDate(interview.scheduled_date)}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {formatTime(interview.scheduled_date)}
            </span>
          </div>

          {interview.mode === 'online' ? (
            <div className="flex items-center space-x-2">
              <Video className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Online Interview</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">{interview.location}</span>
            </div>
          )}
        </div>

        {interview.meeting_link && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-1">Meeting Link:</p>
            <a 
              href={interview.meeting_link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
            >
              {interview.meeting_link}
            </a>
          </div>
        )}

        {interview.notes && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-900 mb-1">Notes:</p>
            <p className="text-sm text-gray-600">{interview.notes}</p>
          </div>
        )}

        {interview.feedback && (
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-900 mb-1">Feedback:</p>
            <p className="text-sm text-green-700">{interview.feedback}</p>
          </div>
        )}

        {interview.status === 'scheduled' && timeLeft && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="text-lg font-semibold text-blue-900">
                {timeLeft === 'Interview time reached' ? 'Interview Time!' : `Time until interview: ${timeLeft}`}
              </span>
            </div>
          </div>
        )}

        {interview.status === 'completed' && interview.result === 'selected' && (
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-lg font-semibold text-green-900">
                Congratulations! You've been selected!
              </span>
            </div>
          </div>
        )}

        {interview.status === 'completed' && interview.result === 'rejected' && (
          <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-lg border border-red-200">
            <div className="flex items-center justify-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="text-lg font-semibold text-red-900">
                Thank you for your interest. Keep applying for other opportunities!
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyInterviewCard;
