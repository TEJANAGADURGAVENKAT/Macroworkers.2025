import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Save, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { createSafeProfileUpdateData } from "@/lib/profile-utils";

const EmployerProfile = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
  });

  useEffect(() => {
    setForm({
      fullName: profile?.full_name || "",
      phone: profile?.phone || "",
    });
  }, [profile]);

  const handleSave = async () => {
    try {
      if (!user) return;
      
      const updateData = createSafeProfileUpdateData({
        full_name: form.fullName,
        phone: form.phone || null
      });
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) {
        toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Saved', description: 'Profile updated.' });
      setIsEditing(false);
    } catch (e: any) {
      toast({ title: 'Update failed', description: e?.message || 'Unexpected error', variant: 'destructive' });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Employer Profile</h1>
          <p className="text-muted-foreground">Manage your company profile</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/employer">← Back to Dashboard</Link>
          </Button>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} disabled={!isEditing} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} disabled={!isEditing} />
          </div>
          <Separator />
                          <p className="text-xs text-muted-foreground">Role: employer</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployerProfile;


