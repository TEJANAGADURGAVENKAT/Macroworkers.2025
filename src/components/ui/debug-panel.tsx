import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const DebugPanel = () => {
  const { user, profile } = useAuth();
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDebug = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('=== DEBUG START ===');
      console.log('User:', user);
      console.log('Profile:', profile);

      // Test 1: Check user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('Profile from DB:', profileData);
      console.log('Profile error:', profileError);

      // Test 2: Check tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('created_by', user.id);

      console.log('Tasks:', tasksData);
      console.log('Tasks error:', tasksError);

      // Test 3: Check submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('task_submissions')
        .select('*')
        .eq('employer_id', user.id);

      console.log('Submissions:', submissionsData);
      console.log('Submissions error:', submissionsError);

      // Test 4: Check all profiles
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      console.log('All profiles:', allProfiles);
      console.log('Profiles error:', profilesError);

      setDebugData({
        user,
        profile,
        profileFromDB: profileData,
        profileError,
        tasks: tasksData,
        tasksError,
        submissions: submissionsData,
        submissionsError,
        allProfiles,
        profilesError
      });

      console.log('=== DEBUG END ===');
    } catch (error) {
      console.error('Debug error:', error);
      setDebugData({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Debug Panel
          <Button onClick={runDebug} disabled={loading}>
            {loading ? 'Running...' : 'Run Debug'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {debugData && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">User Info</h3>
              <div className="bg-muted p-2 rounded text-sm">
                <p>ID: {debugData.user?.id}</p>
                <p>Email: {debugData.user?.email}</p>
                <p>Role: {debugData.profile?.role}</p>
              </div>
            </div>

            {debugData.profileFromDB && (
              <div>
                <h3 className="font-semibold mb-2">Profile from Database</h3>
                <div className="bg-muted p-2 rounded text-sm">
                  <p>Full Name: {debugData.profileFromDB.full_name}</p>
                  <p>Role: {debugData.profileFromDB.role}</p>
                  <p>Email: {debugData.profileFromDB.email}</p>
                  <p>Phone: {debugData.profileFromDB.phone}</p>
                </div>
              </div>
            )}

            {debugData.tasks && (
              <div>
                <h3 className="font-semibold mb-2">Tasks ({debugData.tasks.length})</h3>
                <div className="space-y-2">
                  {debugData.tasks.map((task: any) => (
                    <div key={task.id} className="bg-muted p-2 rounded text-sm">
                      <p>Title: {task.title}</p>
                      <p>Status: {task.status}</p>
                      <p>Budget: {task.budget}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {debugData.submissions && (
              <div>
                <h3 className="font-semibold mb-2">Submissions ({debugData.submissions.length})</h3>
                <div className="space-y-2">
                  {debugData.submissions.map((submission: any) => (
                    <div key={submission.id} className="bg-muted p-2 rounded text-sm">
                      <p>Task ID: {submission.task_id}</p>
                      <p>Worker ID: {submission.worker_id}</p>
                      <p>Status: {submission.status}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {debugData.error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded p-2">
                <p className="text-destructive">Error: {debugData.error}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
