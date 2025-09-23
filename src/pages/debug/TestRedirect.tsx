import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const TestRedirect = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workerId, setWorkerId] = useState('');
  const [loading, setLoading] = useState(false);

  const testStatusUpdate = async () => {
    if (!workerId) {
      toast({
        title: "Error",
        description: "Please enter a worker ID",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Update worker status to interview_pending
      const { error } = await supabase
        .from('profiles')
        .update({
          worker_status: 'interview_pending',
          status: 'interview_pending',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', workerId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Worker ${workerId} status updated to interview_pending`,
      });

      console.log('Status updated for worker:', workerId);
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUser = () => {
    if (user) {
      setWorkerId(user.id);
      toast({
        title: "User ID Set",
        description: `Current user ID: ${user.id}`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Test Auto-Redirect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workerId">Worker ID</Label>
              <div className="flex space-x-2">
                <Input
                  id="workerId"
                  value={workerId}
                  onChange={(e) => setWorkerId(e.target.value)}
                  placeholder="Enter worker user ID"
                />
                <Button onClick={getCurrentUser} variant="outline">
                  Use Current User
                </Button>
              </div>
            </div>

            <Button 
              onClick={testStatusUpdate} 
              disabled={loading || !workerId}
              className="w-full"
            >
              {loading ? 'Updating...' : 'Update Status to interview_pending'}
            </Button>

            <div className="text-sm text-muted-foreground">
              <p><strong>Instructions:</strong></p>
              <ol className="list-decimal list-inside space-y-1 mt-2">
                <li>Enter a worker's user ID (or click "Use Current User")</li>
                <li>Click the button to update their status to interview_pending</li>
                <li>If the worker is logged in, they should see the redirect toast and be redirected</li>
                <li>Check the browser console for debug messages</li>
              </ol>
            </div>

            <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
              <p><strong>Debug Info:</strong></p>
              <p>Current User ID: {user?.id || 'Not logged in'}</p>
              <p>Target Worker ID: {workerId || 'Not set'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestRedirect;

