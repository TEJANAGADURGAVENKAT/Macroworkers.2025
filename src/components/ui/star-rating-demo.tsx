import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StarRating from './star-rating-simple';
import StarRatingAdvanced from './star-rating-advanced';

const StarRatingDemo = () => {
  const [rating1, setRating1] = useState(0);
  const [rating2, setRating2] = useState(3);
  const [rating3, setRating3] = useState(4.5);
  const [readonlyRating, setReadonlyRating] = useState(4);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Star Rating Components</h1>
        <p className="text-muted-foreground">Interactive star rating components for your application</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Simple Star Rating */}
        <Card>
          <CardHeader>
            <CardTitle>Simple Star Rating</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium mb-3">Interactive Rating</h4>
              <StarRating
                currentRating={rating1}
                onRatingChange={setRating1}
                size="md"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Current rating: {rating1}/5
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-3">Read-only Rating</h4>
              <StarRating
                currentRating={readonlyRating}
                onRatingChange={() => {}}
                readonly={true}
                size="md"
              />
            </div>

            <div>
              <h4 className="font-medium mb-3">Small Size</h4>
              <StarRating
                currentRating={rating2}
                onRatingChange={setRating2}
                size="sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Advanced Star Rating */}
        <Card>
          <CardHeader>
            <CardTitle>Advanced Star Rating</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium mb-3">With Label & Value</h4>
              <StarRatingAdvanced
                currentRating={rating3}
                onRatingChange={setRating3}
                label="Rate this task"
                showValue={true}
                showLabel={true}
                allowHalfStars={true}
                size="md"
              />
            </div>

            <div>
              <h4 className="font-medium mb-3">Large Size</h4>
              <StarRatingAdvanced
                currentRating={rating2}
                onRatingChange={setRating2}
                showValue={true}
                size="lg"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">In Submitted Tasks Table:</h4>
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Task: Create a landing page</p>
                  <p className="text-sm text-muted-foreground">Worker: John Doe</p>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary">Pending</Badge>
                  <StarRating
                    currentRating={0}
                    onRatingChange={(rating) => console.log('Rating:', rating)}
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Code Example:</h4>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`import StarRating from '@/components/ui/star-rating-simple';

const TaskSubmission = () => {
  const [rating, setRating] = useState(0);
  
  return (
    <StarRating
      currentRating={rating}
      onRatingChange={setRating}
      size="sm"
    />
  );
};`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StarRatingDemo;

