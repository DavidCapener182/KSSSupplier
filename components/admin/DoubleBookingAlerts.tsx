import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { DoubleBookingAlert } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';

interface DoubleBookingAlertsProps {
  eventId: string;
  initialAlerts?: DoubleBookingAlert[];
}

export function DoubleBookingAlerts({ eventId, initialAlerts = [] }: DoubleBookingAlertsProps) {
  const [alerts, setAlerts] = useState<DoubleBookingAlert[]>(initialAlerts);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const runDetection = async (showToast = true) => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/double-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Double-booking API error:', response.status, errorText);
        // Don't throw error, just set empty alerts and continue silently
        setAlerts([]);
        if (showToast) {
          toast({
            title: "Error",
            description: "Failed to check for double bookings.",
            variant: "destructive"
          });
        }
        return;
      }

      const data = await response.json();
      setAlerts(data.conflicts || []);
      
      if (showToast) {
        if (data.count > 0) {
          toast({
            title: "Conflicts Detected",
            description: `Found ${data.count} potential double bookings.`,
            variant: "destructive"
          });
        } else {
          toast({
            title: "All Clear",
            description: "No double bookings detected.",
            variant: "success"
          });
        }
      }
    } catch (error) {
      console.error('Double-booking detection error:', error);
      // Set empty alerts on error so component doesn't break
      setAlerts([]);
      if (showToast) {
        toast({
          title: "Error",
          description: "Failed to check for double bookings.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-run detection on mount (silently, no toast)
  useEffect(() => {
    if (initialAlerts.length === 0) {
      runDetection(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const updateAlertStatus = async (alertId: string, status: 'resolved' | 'ignored') => {
    try {
      const { error } = await supabase
        .from('double_booking_alerts')
        .update({ status })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status } : a));
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update alert status.",
        variant: "destructive"
      });
    }
  };

  // Only show if there are alerts (hide when no conflicts found)
  if (alerts.length === 0 && !loading) {
    return null;
  }

  return (
    <Card className="border-red-200 bg-red-50/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Double-Booking Alerts
            <Badge variant="destructive" className="ml-2">{alerts.filter(a => a.status === 'pending').length}</Badge>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => runDetection(true)} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Re-scan
          </Button>
        </div>
        <CardDescription>
          Potential conflicts detected across different providers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.filter(a => a.status === 'pending').map((alert, idx) => (
          <div key={idx} className="bg-white p-4 rounded-lg border border-red-100 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-red-900 flex items-center gap-2">
                  {alert.staff_name}
                  {alert.match_type === 'name_fuzzy' && (
                    <Badge variant="outline" className="text-xs">Fuzzy Match ({(alert.similarity_score * 100).toFixed(0)}%)</Badge>
                  )}
                </h4>
                <div className="text-sm text-gray-600 mt-1">
                  SIA: <span className="font-mono">{alert.sia_number || 'N/A'}</span>
                </div>
                <div className="text-sm mt-2 grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="text-xs text-gray-500 uppercase">Submitted By</span>
                    <div className="font-medium">{alert.provider1_name || 'Provider A'}</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="text-xs text-gray-500 uppercase">Also By</span>
                    <div className="font-medium">{alert.provider2_name || 'Provider B'}</div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                  onClick={() => updateAlertStatus(alert.id, 'resolved')}
                >
                  Resolve
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-gray-500"
                  onClick={() => updateAlertStatus(alert.id, 'ignored')}
                >
                  Ignore
                </Button>
              </div>
            </div>
          </div>
        ))}
        {alerts.every(a => a.status !== 'pending') && (
          <div className="text-center py-4 text-gray-500">
            All alerts resolved or ignored.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

