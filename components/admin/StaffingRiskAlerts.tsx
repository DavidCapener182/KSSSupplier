'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, Users, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface StaffingRiskAlertsProps {
  eventId: string;
}

export function StaffingRiskAlerts({ eventId }: StaffingRiskAlertsProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/predictive-staffing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
        setFetched(true);
      }
    } catch (error) {
      console.error('Failed to fetch risk analysis', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount
  useEffect(() => {
    if (!fetched && !loading) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  if (!fetched && !loading) {
    return (
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={fetchData}
          className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 w-full justify-between"
        >
          <span className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Check Staffing Risks & Attrition Prediction
          </span>
          <span className="text-xs">AI Powered</span>
        </Button>
      </div>
    );
  }

  if (loading) {
    return <Skeleton className="h-24 w-full mb-6" />;
  }

  if (!data) return null;

  const { analysis, recommendation, riskAnalysis } = data;
  const isHighRisk = riskAnalysis.riskLevel === 'High';

  return (
    <Card className={`mb-6 border-l-4 ${isHighRisk ? 'border-l-red-500' : 'border-l-orange-500'}`}>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={`h-5 w-5 ${isHighRisk ? 'text-red-600' : 'text-orange-600'}`} />
              <h3 className="font-semibold text-lg">Predictive Staffing Analysis</h3>
              <Badge variant={isHighRisk ? "destructive" : "default"} className={!isHighRisk ? "bg-orange-500" : ""}>
                {riskAnalysis.riskLevel} Risk
              </Badge>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              {riskAnalysis.factors.map((factor: string, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" />
                  <span>{factor}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="w-px bg-gray-200 hidden md:block" />

          <div className="flex-1 space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Projected Attrition</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{analysis.predictedRate.toFixed(1)}%</span>
                <span className="text-sm text-gray-500">
                  (Based on {analysis.sampleSize} similar events)
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Recommendation</p>
              <Alert className="bg-blue-50 border-blue-200">
                <Users className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-900 ml-2">Overbook by {recommendation.overbookingAmount} staff</AlertTitle>
                <AlertDescription className="text-blue-800 ml-2 text-xs mt-1">
                  Book total {recommendation.recommendedTotal} to ensure attendance.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
