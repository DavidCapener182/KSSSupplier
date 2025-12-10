'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface LazyBookingAlertsProps {
  providerId: string;
}

interface LazyBookingAnalysis {
  riskScore: number;
  patternDescription: string;
  isHighRisk: boolean;
  averageDaysBeforeEventUpload: number;
  lateUploadCount: number;
  totalAnalysed: number;
}

export function LazyBookingAlerts({ providerId }: LazyBookingAlertsProps) {
  const [analysis, setAnalysis] = useState<LazyBookingAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/lazy-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      }
    } catch (error) {
      console.error('Error fetching lazy booking analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (providerId) {
      fetchAnalysis();
    }
  }, [providerId]);

  if (!analysis) return null;

  // Only show if there's enough data or a risk
  if (analysis.totalAnalysed < 3 && !analysis.isHighRisk) return null;

  return (
    <Card className={`border-l-4 ${analysis.isHighRisk ? 'border-l-red-500' : 'border-l-green-500'}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              {analysis.isHighRisk ? (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              Upload Reliability
            </CardTitle>
            <CardDescription>Staff detail submission timeliness</CardDescription>
          </div>
          <Badge variant={analysis.isHighRisk ? 'destructive' : 'outline'}>
            Risk Score: {analysis.riskScore}/100
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground mb-4">{analysis.patternDescription}</p>
        
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded">
            <p className="text-muted-foreground">Late Uploads (&lt;3 days)</p>
            <p className="font-semibold text-lg">{analysis.lateUploadCount} <span className="text-muted-foreground font-normal text-xs">/ {analysis.totalAnalysed} events</span></p>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded">
            <p className="text-muted-foreground">Avg Upload Lead Time</p>
            <p className="font-semibold text-lg">{analysis.averageDaysBeforeEventUpload.toFixed(1)} days</p>
          </div>
        </div>
        
        {analysis.isHighRisk && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 text-xs rounded border border-red-100 dark:border-red-900/50">
            <strong>Action Recommended:</strong> Monitor this provider closely. Consider sending reminders 2 weeks prior to events.
          </div>
        )}
      </CardContent>
    </Card>
  );
}


