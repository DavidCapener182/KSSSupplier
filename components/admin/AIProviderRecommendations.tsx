'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, MapPin, TrendingUp, Users, Check, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Recommendation {
  providerId: string;
  company_name: string;
  totalScore: number;
  components: {
    performanceScore: number;
    distanceScore: number;
    capacityScore: number;
    reliabilityScore: number;
  };
  details: {
    distanceText: string;
    acceptanceRate: number;
    attendanceRate: number;
    totalAssignments: number;
  };
  reasoning: string[];
}

interface AIProviderRecommendationsProps {
  eventId: string;
  onAssign: (providerId: string) => void;
}

export function AIProviderRecommendations({ eventId, onAssign }: AIProviderRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [aiReasoning, setAiReasoning] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const { toast } = useToast();

  const getRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/provider-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });

      if (!response.ok) throw new Error('Failed to fetch recommendations');

      const data = await response.json();
      setRecommendations(data.recommendations);
      setAiReasoning(data.aiReasoning);
      setFetched(true);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate AI recommendations.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount
  useEffect(() => {
    if (!fetched && !loading) {
      getRecommendations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  if (!fetched && !loading) {
    return (
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-lg text-indigo-900">AI Provider Matching</CardTitle>
          </div>
          <CardDescription>
            Get smart recommendations for the best providers for this event.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={getRecommendations} 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Recommendations
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="border-indigo-100">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600 animate-pulse" />
            <CardTitle className="text-lg">Analyzing Providers...</CardTitle>
          </div>
          <CardDescription>AI is analyzing performance, location, and capacity data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-indigo-200 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-lg text-indigo-900">Top Recommendations</CardTitle>
          </div>
          <Badge variant="outline" className="bg-white text-indigo-700 border-indigo-200">
            AI Powered
          </Badge>
        </div>
        {aiReasoning && (
          <p className="text-sm text-indigo-800 mt-2 italic">
            "{aiReasoning}"
          </p>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {recommendations.map((rec, index) => (
            <div key={rec.providerId} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{index + 1}. {rec.company_name}</span>
                    <Badge className={
                      rec.totalScore >= 90 ? 'bg-green-100 text-green-800' : 
                      rec.totalScore >= 80 ? 'bg-blue-100 text-blue-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {rec.totalScore.toFixed(0)}% Match
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {rec.details.distanceText}
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {rec.details.attendanceRate.toFixed(0)}% attendance
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {rec.details.totalAssignments} past events
                    </div>
                  </div>
                </div>
                <Button size="sm" onClick={() => onAssign(rec.providerId)}>
                  Assign
                </Button>
              </div>
              
              <div className="space-y-1">
                {rec.reasoning.map((reason, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                    <Check className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {recommendations.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No suitable providers found based on the criteria.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
