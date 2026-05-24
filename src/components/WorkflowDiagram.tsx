import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Circle } from 'lucide-react';

interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  icon?: React.ReactNode;
}

interface WorkflowDiagramProps {
  steps: WorkflowStep[];
  currentStep?: number;
}

export function WorkflowDiagram({ steps, currentStep }: WorkflowDiagramProps) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={step.id}>
          <Card
            className={`transition-all ${
              step.completed
                ? 'bg-green-50 border-green-200'
                : currentStep === step.id
                  ? 'border-primary bg-primary/5'
                  : ''
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {step.completed ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{step.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {step.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {index < steps.length - 1 && (
            <div className="flex justify-center py-2">
              <div className="w-0.5 h-4 bg-muted"></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
