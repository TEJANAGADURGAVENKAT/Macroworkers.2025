import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useWorkerInterview } from '@/hooks/useWorkerInterview';
import { CalendarIcon, Clock, MapPin, Video, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface InterviewSchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  workerId: string;
  workerName: string;
}

export const InterviewSchedulingModal = ({
  isOpen,
  onClose,
  workerId,
  workerName
}: InterviewSchedulingModalProps) => {
  const { toast } = useToast();
  const { scheduleInterview } = useWorkerInterview();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    scheduled_date: '',
    mode: 'online' as 'online' | 'offline',
    meeting_link: '',
    location: '',
    notes: ''
  });
  const [isDateValid, setIsDateValid] = useState(false);
  const timeInputRef = useRef<HTMLInputElement>(null);
  const [localTimeValue, setLocalTimeValue] = useState('16:00');
  const [localMeetingLink, setLocalMeetingLink] = useState('');
  const [localLocation, setLocalLocation] = useState('');
  const [localNotes, setLocalNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.scheduled_date) {
      toast({
        title: "Validation Error",
        description: "Please select a date for the interview",
        variant: "destructive"
      });
      return;
    }

    if (formData.mode === 'online' && !formData.meeting_link) {
      toast({
        title: "Validation Error",
        description: "Please provide a meeting link for online interviews",
        variant: "destructive"
      });
      return;
    }

    if (formData.mode === 'offline' && !formData.location) {
      toast({
        title: "Validation Error",
        description: "Please provide a location for offline interviews",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const interviewData = {
        worker_id: workerId,
        scheduled_date: formData.scheduled_date,
        mode: formData.mode,
        meeting_link: formData.mode === 'online' ? formData.meeting_link : undefined,
        location: formData.mode === 'offline' ? formData.location : undefined,
        notes: formData.notes || undefined
      };

      await scheduleInterview(interviewData);

      toast({
        title: "Interview Scheduled",
        description: `Interview has been scheduled for ${workerName}`,
      });

      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error scheduling interview:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to schedule interview",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      scheduled_date: '',
      mode: 'online',
      meeting_link: '',
      location: '',
      notes: ''
    });
    setIsDateValid(false);
    setLocalTimeValue('16:00');
    setLocalMeetingLink('');
    setLocalLocation('');
    setLocalNotes('');
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      resetForm();
    }
  };

  const handleInputChange = useCallback((field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleModeChange = useCallback((value: 'online' | 'offline') => {
    setFormData(prev => ({ 
      ...prev, 
      mode: value,
      meeting_link: value === 'online' ? prev.meeting_link : '',
      location: value === 'offline' ? prev.location : ''
    }));
    
    // Reset local states when switching modes
    if (value === 'online') {
      setLocalLocation('');
    } else {
      setLocalMeetingLink('');
    }
  }, []);

  // Debounced update functions for smooth typing
  const debouncedUpdateTime = useCallback((time: string) => {
    if (time && formData.scheduled_date) {
      const [hours, minutes] = time.split(':');
      const date = new Date(formData.scheduled_date);
      date.setHours(parseInt(hours) || 16, parseInt(minutes) || 0, 0, 0);
      setFormData(prev => ({
        ...prev,
        scheduled_date: date.toISOString()
      }));
    }
  }, [formData.scheduled_date]);

  const debouncedUpdateMeetingLink = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, meeting_link: value }));
  }, []);

  const debouncedUpdateLocation = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, location: value }));
  }, []);

  const debouncedUpdateNotes = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, notes: value }));
  }, []);

  // Sync time input when date changes
  useEffect(() => {
    if (formData.scheduled_date) {
      const date = new Date(formData.scheduled_date);
      const timeString = date.toTimeString().slice(0, 5);
      setLocalTimeValue(timeString);
    }
  }, [formData.scheduled_date]);

  // Debounced effects for smooth updates
  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedUpdateTime(localTimeValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [localTimeValue, debouncedUpdateTime]);

  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedUpdateMeetingLink(localMeetingLink);
    }, 300);
    return () => clearTimeout(timer);
  }, [localMeetingLink, debouncedUpdateMeetingLink]);

  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedUpdateLocation(localLocation);
    }, 300);
    return () => clearTimeout(timer);
  }, [localLocation, debouncedUpdateLocation]);

  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedUpdateNotes(localNotes);
    }, 300);
    return () => clearTimeout(timer);
  }, [localNotes, debouncedUpdateNotes]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Schedule Interview
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Interviewing: <span className="text-foreground font-semibold">{workerName}</span>
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Interview Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  disabled={loading}
                  type="button"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.scheduled_date ? format(new Date(formData.scheduled_date), 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.scheduled_date ? new Date(formData.scheduled_date) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      const newDate = new Date(date);
                      newDate.setHours(16, 0, 0, 0); // Set default time to 4 PM
                      setFormData(prev => ({
                        ...prev,
                        scheduled_date: newDate.toISOString()
                      }));
                      setIsDateValid(true);
                    }
                  }}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Interview Time *</Label>
            <Input
              id="time"
              type="time"
              value={localTimeValue}
              onChange={(e) => {
                setLocalTimeValue(e.target.value);
              }}
              disabled={loading}
              required
              className="transition-none"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mode">Interview Mode *</Label>
            <Select
              value={formData.mode}
              onValueChange={handleModeChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select interview mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Online
                  </div>
                </SelectItem>
                <SelectItem value="offline">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Offline
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.mode === 'online' && (
            <div className="space-y-2">
              <Label htmlFor="meeting_link">Meeting Link *</Label>
              <Input
                id="meeting_link"
                type="url"
                placeholder="https://meet.google.com/abc-defg-hij"
                value={localMeetingLink}
                onChange={(e) => setLocalMeetingLink(e.target.value)}
                disabled={loading}
                required
                className="transition-none"
                autoComplete="off"
              />
            </div>
          )}

          {formData.mode === 'offline' && (
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                type="text"
                placeholder="Office address or meeting location"
                value={localLocation}
                onChange={(e) => setLocalLocation(e.target.value)}
                disabled={loading}
                required
                className="transition-none"
                autoComplete="off"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any special instructions or notes for the candidate..."
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              disabled={loading}
              rows={3}
              className="transition-none resize-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-primary hover:bg-primary-dark"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Schedule Interview
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
