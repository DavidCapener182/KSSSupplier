import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { HeartPulse, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { HealthReport } from '@/lib/ai/relationship-health-monitor';
import { supabase } from '@/lib/supabase/client';

interface ProviderSentimentMonitorProps {
  providerId: string;
}

export function ProviderSentimentMonitor({ providerId }: ProviderSentimentMonitorProps) {
  const [data, setData] = useState<HealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHealth() {
      try {
        setError(null);
        // Get session token for authentication
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
          setData(await res.json());
        } else {
          const errorData = await res.json().catch(() => ({}));
          setError(errorData.error || 'Failed to load relationship health data');
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to load relationship health data');
      } finally {
        setLoading(false);
      }
    }
    fetchHealth();
  }, [providerId]);

  // Calculate health percentage from sentiment score (-1 to 1) and risk factor
  // Convert sentiment to 0-100 scale, then reduce by risk factor
  const calculateHealthPercentage = (score: number, riskFactor: number): number => {
    // Convert sentiment score (-1 to 1) to base health (0 to 100)
    const baseHealth = ((score + 1) / 2) * 100;
    // Reduce health by risk factor (riskFactor is 0-100)
    const health = Math.max(0, Math.min(100, baseHealth - (riskFactor * 0.5)));
    return Math.round(health);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-pink-500" />
            Relationship Health
          </CardTitle>
          <CardDescription>AI analysis of communication sentiment</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-pink-500" />
            Relationship Health
          </CardTitle>
          <CardDescription>AI analysis of communication sentiment</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            {error || 'No relationship data available yet. Health monitoring will appear once messages are analyzed.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const healthPercentage = calculateHealthPercentage(data.currentScore, data.riskFactor);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-pink-500" />
            Relationship Health
          </CardTitle>
          <Badge className={
            data.alertLevel === 'green' ? 'bg-green-100 text-green-800' :
            data.alertLevel === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }>
            {data.alertLevel.toUpperCase()}
          </Badge>
        </div>
        <CardDescription>AI analysis of communication sentiment</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <div className="text-3xl font-bold">
            {healthPercentage}%
          </div>
          <div className="flex items-center text-sm text-gray-500">
            {data.trend === 'improving' && <TrendingUp className="h-4 w-4 text-green-500 mr-1" />}
            {data.trend === 'declining' && <TrendingDown className="h-4 w-4 text-red-500 mr-1" />}
            {data.trend === 'stable' && <Minus className="h-4 w-4 text-gray-400 mr-1" />}
            {data.trend.charAt(0).toUpperCase() + data.trend.slice(1)} Trend
          </div>
        </div>

        {data.recentTopics.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase">Recent Topics</p>
            <div className="flex flex-wrap gap-2">
              {data.recentTopics.map((topic, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
