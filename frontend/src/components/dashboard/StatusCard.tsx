'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatNumber, getRiskColor, getAlertLevel } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatusCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  description?: string;
  trend?: 'up' | 'down' | 'stable';
  alert?: string;
  riskLevel?: number;
}

export function StatusCard({ 
  title, 
  value, 
  unit, 
  icon: Icon, 
  description, 
  trend, 
  alert,
  riskLevel 
}: StatusCardProps) {
  const getRiskLevelColor = (level?: number) => {
    if (!level) return '';
    return getRiskColor(level);
  };

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'up': return 'text-red-600';
      case 'down': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-gray-600" />
      </CardHeader>
      
      <CardContent>
        <div className="flex items-baseline space-x-2">
          <div 
            className={cn(
              "text-2xl font-bold",
              riskLevel ? getRiskLevelColor(riskLevel) : "text-gray-900"
            )}
          >
            {typeof value === 'number' ? formatNumber(value, 1) : value}
          </div>
          {unit && (
            <span className="text-sm text-gray-500">{unit}</span>
          )}
        </div>
        
        {description && (
          <p className={cn(
            "text-xs mt-1",
            getTrendColor(trend)
          )}>
            {description}
          </p>
        )}
        
        {alert && (
          <Badge 
            variant="secondary" 
            className={cn("mt-2", getAlertLevel(alert))}
          >
            {alert}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}