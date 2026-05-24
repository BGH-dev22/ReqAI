import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface MetricCardProps {
  value: string;
  label: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
}

export function MetricCard({ value, label, icon, trend }: MetricCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-primary">{value}</p>
            <p className="text-sm text-muted-foreground mt-1">{label}</p>
          </div>
          {icon && (
            <div className="p-3 bg-primary/10 rounded-lg text-primary">
              {icon}
            </div>
          )}
        </div>
        {trend && (
          <p className={`text-xs mt-3 font-medium ${trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}% vs dernier mois
          </p>
        )}
      </CardContent>
    </Card>
  );
}
