import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const EmployerTaskDetail = () => {
  const { id } = useParams();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Task Details</h1>
            <p className="text-muted-foreground">Task #{id}</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/employer/campaigns">← Back to Campaigns</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Instagram Account Followers</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Campaign details and analytics would be displayed here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployerTaskDetail;