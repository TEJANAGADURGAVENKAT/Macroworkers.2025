import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const AdminUsers = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        setProfiles(data || []);
      } catch (e: any) {
        setError(e?.message || "Failed to load users");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Button variant="outline" asChild>
          <Link to="/admin">← Back to Admin</Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Loading users...</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!isLoading && !error && (
            <div className="space-y-3">
              {profiles.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{p.full_name || 'Unnamed'}</p>
                    <p className="text-xs text-muted-foreground">{p.user_id}</p>
                  </div>
                  <div className="capitalize text-sm">{p.role}</div>
                </div>
              ))}
              {profiles.length === 0 && (
                <p className="text-sm text-muted-foreground">No users found.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;