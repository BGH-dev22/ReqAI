import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, Clock, Shield } from 'lucide-react';
import type { ReactNode } from 'react';

interface ObjectiveCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  metrics?: {
    current: number;
    target: number;
    unit: string;
  };
  highlighted?: boolean;
}

export function ObjectiveCard({
  icon,
  title,
  description,
  metrics,
  highlighted = false,
}: ObjectiveCardProps) {
  return (
    <Card className={`transition-all hover:shadow-lg ${highlighted ? 'border-primary bg-primary/5' : ''}`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            {icon}
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{description}</p>

        {metrics && (
          <div className="space-y-2">
            <Progress value={(metrics.current / metrics.target) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {metrics.current} / {metrics.target} {metrics.unit}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const objectiveCardsData = [
  {
    icon: <Target className="h-6 w-6" />,
    title: 'Objectif Principal',
    description: 'Automatiser l\'analyse de spécifications techniques et la génération de plans de tests',
    highlighted: true,
  },
  {
    icon: <Clock className="h-6 w-6" />,
    title: 'Gain de Temps',
    description: 'Réduction de 80% du temps d\'analyse des documents',
    metrics: {
      current: 80,
      target: 100,
      unit: '%',
    },
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: 'Confidentialité',
    description: '100% local - Vos données ne quittent jamais votre infrastructure',
  },
];
