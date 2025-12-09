'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { HeartPulse, RefreshCw, Activity, MessageSquare, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { HealthReport } from '@/lib/ai/relationship-health-monitor';

interface ProviderHealthAndEngagementProps {
  providerId: string;
}

interface EngagementMetrics {
  engagement_score: number;
  time_to_open_hours: number;
  login_frequency_days: number;
  chat_latency_hours: number;
  calculated_at: string;
}

export function ProviderHealthAndEngagement({ providerId }: ProviderHealthAndEngagementProps) {
  // Relationship Health State
  const [healthData, setHealthData] = useState<HealthReport | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  // Engagement Score State
  const [engagementMetrics, setEngagementMetrics] = useState<EngagementMetrics | null>(null);
  const [engagementLoading, setEngagementLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  // Fetch Relationship Health
  useEffect(() => {
    async function fetchHealth() {
      try {
        setHealthError(null);
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const res = await fetch('/api/ai/relationship-health', {
          method: 'POST',
          headers,
          body: JSON.stringify({ providerId })
        });
        
        if (res.ok) {
          const data = await res.json();
          setHealthData(data);
          setHealthError(null);
        } else {
          const errorData = await res.json().catch(() => ({}));
          const errorMsg = errorData.error || `Failed to load (${res.status})`;
          console.error('Relationship health API error:', errorMsg);
          setHealthError(errorMsg);
          // Still set a default healthData so UI can render
          setHealthData({
            providerId,
            currentScore: 0,
            trend: 'stable',
            alertLevel: 'green',
            recentTopics: [],
            riskFactor: 0
          });
        }
      } catch (err: any) {
        console.error('Relationship health fetch error:', err);
        setHealthError(err.message || 'Failed to load relationship health data');
        // Set default data on error so UI can still render
        setHealthData({
          providerId,
          currentScore: 0,
          trend: 'stable',
          alertLevel: 'green',
          recentTopics: [],
          riskFactor: 0
        });
      } finally {
        setHealthLoading(false);
      }
    }
    fetchHealth();
  }, [providerId]);

  // Fetch Engagement Score
  const fetchEngagementScore = async () => {
    setEngagementLoading(true);
    try {
      const { data, error } = await supabase
        .from('provider_engagement_scores')
        .select('*')
        .eq('provider_id', providerId)
        .single();

      if (data) {
        setEngagementMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching score:', error);
    } finally {
      setEngagementLoading(false);
    }
  };

  const calculateEngagementScore = async () => {
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
        await fetchEngagementScore();
      }
    } catch (error) {
      console.error('Error calculating score:', error);
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    if (providerId) {
      fetchEngagementScore();
    }
  }, [providerId]);

  const calculateHealthPercentage = (score: number, riskFactor: number): number => {
    const baseHealth = ((score + 1) / 2) * 100;
    const health = Math.max(0, Math.min(100, baseHealth - (riskFactor * 0.5)));
    return Math.round(health);
  };

  const healthPercentage = healthData ? calculateHealthPercentage(healthData.currentScore, healthData.riskFactor) : 0;
  const isLoading = healthLoading || (engagementLoading && !engagementMetrics);

  // Determine health color based on percentage
  const getHealthColor = (percentage: number) => {
    if (percentage >= 70) {
      return {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-900/50',
        text: 'text-green-900 dark:text-green-200',
        icon: 'text-green-600'
      };
    } else if (percentage >= 40) {
      return {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'border-orange-200 dark:border-orange-900/50',
        text: 'text-orange-900 dark:text-orange-200',
        icon: 'text-orange-600'
      };
    } else {
      return {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-900/50',
        text: 'text-red-900 dark:text-red-200',
        icon: 'text-red-600'
      };
    }
  };

  const healthColors = getHealthColor(healthPercentage);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-pink-500" />
            Provider Health & Engagement
          </CardTitle>
          <CardDescription>Relationship sentiment & behavioral analytics</CardDescription>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={calculateEngagementScore} 
          disabled={calculating}
          title="Recalculate Engagement Score"
        >
          <RefreshCw className={`h-4 w-4 ${calculating ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <>
            {/* Relationship Health - Stacked on top */}
            <div className={`p-5 rounded-lg border-2 ${healthColors.bg} ${healthColors.border}`}>
              <div className="flex items-center gap-2 mb-3">
                <HeartPulse className={`h-5 w-5 ${healthColors.icon}`} />
                <span className={`text-base font-semibold ${healthColors.text}`}>Relationship Health</span>
              </div>
              {!healthData ? (
                <p className="text-sm text-gray-500">Loading health data...</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <span className={`text-4xl font-bold ${healthColors.text}`}>
                      {healthPercentage}%
                    </span>
                    <div className="flex items-center text-sm text-gray-600">
                      {healthData.trend === 'improving' && <TrendingUp className="h-4 w-4 text-green-500 mr-1" />}
                      {healthData.trend === 'declining' && <TrendingDown className="h-4 w-4 text-red-500 mr-1" />}
                      {healthData.trend === 'stable' && <Minus className="h-4 w-4 text-gray-400 mr-1" />}
                      <span>{healthData.trend.charAt(0).toUpperCase() + healthData.trend.slice(1)} Trend</span>
                    </div>
                  </div>
                  {healthData.recentTopics.length > 0 ? (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 uppercase">Recent Topics</p>
                      <div className="flex flex-wrap gap-2">
                        {healthData.recentTopics.map((topic, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">
                      {healthError?.includes('schema cache') || healthError?.includes('does not exist')
                        ? 'Please apply migration 014_sentiment_analysis.sql to enable sentiment analysis.'
                        : 'No topics identified yet. Sentiment analysis will appear after messages are analyzed.'}
                    </p>
                  )}
                  {healthError && !healthError.includes('schema cache') && !healthError.includes('does not exist') && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 italic mt-2">
                      Note: {healthError}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Engagement Score - Stacked below */}
            <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-900/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  <span className="text-base font-semibold text-blue-900 dark:text-blue-200">Engagement Score</span>
                </div>
              </div>
              {!engagementMetrics ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-3">No engagement data available</p>
                  <Button onClick={calculateEngagementScore} disabled={calculating} size="sm" variant="outline">
                    Calculate Score
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-200">Overall Engagement</span>
                    <span className={`text-3xl font-bold ${
                      engagementMetrics.engagement_score >= 80 ? 'text-green-600' :
                      engagementMetrics.engagement_score >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {engagementMetrics.engagement_score}/100
                    </span>
                  </div>
                  <Progress 
                    value={engagementMetrics.engagement_score} 
                    className="h-3" 
                    indicatorClassName={
                      engagementMetrics.engagement_score >= 80 ? 'bg-green-600' :
                      engagementMetrics.engagement_score >= 50 ? 'bg-yellow-600' : 'bg-red-600'
                    }
                  />
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="text-center p-2 bg-white dark:bg-slate-800 rounded">
                      <Activity className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                      <p className="text-xs text-muted-foreground mb-1">Login Freq</p>
                      <p className="text-sm font-semibold">
                        {engagementMetrics.login_frequency_days < 1 
                          ? '< 1 day' 
                          : `${engagementMetrics.login_frequency_days.toFixed(1)} days`}
                      </p>
                      <Badge variant={engagementMetrics.login_frequency_days <= 3 ? 'success' : 'secondary'} className="mt-1 h-4 text-[10px]">
                        {engagementMetrics.login_frequency_days <= 3 ? 'Active' : 'Passive'}
                      </Badge>
                    </div>
                    <div className="text-center p-2 bg-white dark:bg-slate-800 rounded">
                      <Clock className="h-4 w-4 mx-auto mb-1 text-purple-500" />
                      <p className="text-xs text-muted-foreground mb-1">Time to Open</p>
                      <p className="text-sm font-semibold">
                        {engagementMetrics.time_to_open_hours.toFixed(1)} hrs
                      </p>
                      <Badge variant={engagementMetrics.time_to_open_hours <= 4 ? 'success' : 'secondary'} className="mt-1 h-4 text-[10px]">
                        {engagementMetrics.time_to_open_hours <= 4 ? 'Fast' : 'Slow'}
                      </Badge>
                    </div>
                    <div className="text-center p-2 bg-white dark:bg-slate-800 rounded">
                      <MessageSquare className="h-4 w-4 mx-auto mb-1 text-orange-500" />
                      <p className="text-xs text-muted-foreground mb-1">Chat Reply</p>
                      <p className="text-sm font-semibold">
                        {engagementMetrics.chat_latency_hours.toFixed(1)} hrs
                      </p>
                      <Badge variant={engagementMetrics.chat_latency_hours <= 4 ? 'success' : 'secondary'} className="mt-1 h-4 text-[10px]">
                        {engagementMetrics.chat_latency_hours <= 4 ? 'Responsive' : 'Delayed'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-xs text-right text-muted-foreground pt-2 border-t">
                    Last updated: {new Date(engagementMetrics.calculated_at).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>

          </>
        )}
      </CardContent>
    </Card>
  );
}
