import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Payments = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Payments</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Payment Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Manage your payments and withdrawal methods</p>
          <Button disabled>Configure Payments (Coming Soon)</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Payments;