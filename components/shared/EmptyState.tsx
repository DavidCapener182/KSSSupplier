'use client';

import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/5 animate-in fade-in-50">
      <div className="bg-background p-4 rounded-full shadow-sm mb-4 ring-1 ring-border">
        <Icon className="h-8 w-8 text-muted-foreground/80" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">{description}</p>
      
      {(action || secondaryAction) && (
        <div className="flex gap-3">
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick} className="h-9">
              {secondaryAction.label}
            </Button>
          )}
          {action && (
            <Button onClick={action.onClick} className="h-9 shadow-sm">
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}


