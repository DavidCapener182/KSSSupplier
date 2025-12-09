import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CloudRain, CloudSun, Wind, AlertTriangle, RefreshCw, Thermometer } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface WeatherAttendancePredictionProps {
  eventId: string;
}

export function WeatherAttendancePrediction({ eventId }: WeatherAttendancePredictionProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/weather-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      });
      if (!res.ok) throw new Error('Failed to fetch prediction');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Optionally fetch on mount, or wait for user interaction?
    // Let's fetch on mount if not already done, but handle gracefully.
    // For now, let's require manual trigger or fetch once.
    fetchData();
  }, [eventId]);

  if (loading && !data) return <Skeleton className="h-48 w-full" />;

  if (!data && !loading) {
    return (
      <Card>
         <CardHeader>
           <CardTitle className="text-lg">Weather & Attendance Insight</CardTitle>
         </CardHeader>
         <CardContent>
           <Button onClick={fetchData}>Analyze Weather Impact</Button>
         </CardContent>
      </Card>
    );
  }

  const { weather, predictedAttrition, recommendedOverbooking, reasoning } = data;

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <CloudSun className="h-5 w-5 text-blue-600" />
              Context-Aware Predictions
            </CardTitle>
            <CardDescription>Weather & Travel Impact Analysis</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {weather ? (
          <div className="flex items-center gap-4 bg-white/60 p-3 rounded-lg">
            {weather.icon && (
               <img 
                 src={`http://openweathermap.org/img/w/${weather.icon}.png`} 
                 alt={weather.condition} 
                 className="w-12 h-12"
               />
            )}
            <div>
              <div className="font-medium text-lg capitalize">{weather.description}</div>
              <div className="text-sm text-gray-600 flex gap-3">
                <span className="flex items-center gap-1"><Thermometer className="h-3 w-3" /> {weather.temp.toFixed(1)}°C</span>
                <span className="flex items-center gap-1"><CloudRain className="h-3 w-3" /> {(weather.precipitation_prob * 100).toFixed(0)}% Rain</span>
                <span className="flex items-center gap-1"><Wind className="h-3 w-3" /> {weather.wind_speed} m/s</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic">Weather forecast unavailable</div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-3 rounded-lg border shadow-sm">
            <div className="text-xs text-gray-500 uppercase font-semibold">Predicted Attrition</div>
            <div className="text-2xl font-bold text-orange-600">{predictedAttrition.toFixed(1)}%</div>
          </div>
          <div className="bg-white p-3 rounded-lg border shadow-sm">
            <div className="text-xs text-gray-500 uppercase font-semibold">Recommended Buffer</div>
            <div className="text-2xl font-bold text-green-600">+{recommendedOverbooking} Staff</div>
          </div>
        </div>

        {reasoning && reasoning.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Risk Factors
            </h4>
            <ul className="text-sm text-gray-700 space-y-1 pl-1">
              {reasoning.map((r: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-500 mt-1">•</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
