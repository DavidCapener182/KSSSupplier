'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Activity, MessageSquare, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface ProviderEngagementScoreProps {
  providerId: string;
}

interface EngagementMetrics {
  engagement_score: number;
  time_to_open_hours: number;
  login_frequency_days: number;
  chat_latency_hours: number;
  calculated_at: string;
}

export function ProviderEngagementScore({ providerId }: ProviderEngagementScoreProps) {
  const [metrics, setMetrics] = useState<EngagementMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const fetchScore = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('provider_engagement_scores')
        .select('*')
        .eq('provider_id', providerId)
        .single();

      if (data) {
        setMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching score:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateScore = async () => {
    setCalculating(true);
    try {
      const response = await fetch('/api/ai/engagement-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ providerId }),
      });

      if (response.ok) {
        // Refresh local data after calculation
        await fetchScore();
      }
    } catch (error) {
      console.error('Error calculating score:', error);
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    if (providerId) {
      fetchScore();
    }
  }, [providerId]);

  if (loading && !metrics) {
    return <div className="h-32 flex items-center justify-center">Loading engagement data...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-medium">Provider Engagement Score</CardTitle>
          <CardDescription>Behavioral analytics & responsiveness</CardDescription>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={calculateScore} 
          disabled={calculating}
          title="Recalculate Score"
        >
          <RefreshCw className={`h-4 w-4 ${calculating ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {!metrics ? (
          <div className="text-center py-6 text-muted-foreground">
            <p className="mb-4">No engagement data available.</p>
            <Button onClick={calculateScore} disabled={calculating}>
              Calculate Score
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Engagement</span>
              <span className={`text-2xl font-bold ${
                metrics.engagement_score >= 80 ? 'text-green-600' :
                metrics.engagement_score >= 50 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {metrics.engagement_score}/100
              </span>
            </div>
            <Progress 
              value={metrics.engagement_score} 
              className="h-2" 
              indicatorClassName={
                metrics.engagement_score >= 80 ? 'bg-green-600' :
                metrics.engagement_score >= 50 ? 'bg-yellow-600' : 'bg-red-600'
              }
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="flex flex-col items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-center">
                <Activity className="h-5 w-5 mb-2 text-blue-500" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Login Freq</span>
                <span className="font-semibold text-lg">
                  {metrics.login_frequency_days < 1 
                    ? '< 1 day' 
                    : `${metrics.login_frequency_days.toFixed(1)} days`}
                </span>
                <Badge variant={metrics.login_frequency_days <= 3 ? 'success' : 'secondary'} className="mt-1 h-5 text-[10px]">
                  {metrics.login_frequency_days <= 3 ? 'Active' : 'Passive'}
                </Badge>
              </div>

              <div className="flex flex-col items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-center">
                <Clock className="h-5 w-5 mb-2 text-purple-500" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Time to Open</span>
                <span className="font-semibold text-lg">
                  {metrics.time_to_open_hours.toFixed(1)} hrs
                </span>
                <Badge variant={metrics.time_to_open_hours <= 4 ? 'success' : 'secondary'} className="mt-1 h-5 text-[10px]">
                  {metrics.time_to_open_hours <= 4 ? 'Fast' : 'Slow'}
                </Badge>
              </div>

              <div className="flex flex-col items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-center">
                <MessageSquare className="h-5 w-5 mb-2 text-orange-500" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Chat Reply</span>
                <span className="font-semibold text-lg">
                  {metrics.chat_latency_hours.toFixed(1)} hrs
                </span>
                <Badge variant={metrics.chat_latency_hours <= 4 ? 'success' : 'secondary'} className="mt-1 h-5 text-[10px]">
                  {metrics.chat_latency_hours <= 4 ? 'Responsive' : 'Delayed'}
                </Badge>
              </div>
            </div>
            
            <div className="text-xs text-right text-muted-foreground">
              Last updated: {new Date(metrics.calculated_at).toLocaleDateString()}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

