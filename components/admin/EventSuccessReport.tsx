'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, RefreshCw, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { format } from 'date-fns';

interface EventSuccessReportProps {
  eventId: string;
}

interface ReportData {
  id: string;
  report_text: string;
  report_pdf_path: string | null;
  performance_attendance_rate: number;
  financial_total_cost: number;
  financial_budget: number;
  financial_variance: number;
  issues_count: number;
  generated_at: string;
}

export function EventSuccessReport({ eventId }: EventSuccessReportProps) {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('event_success_reports')
        .select('*')
        .eq('event_id', eventId)
        .single();

      if (data) {
        setReport(data);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/ai/post-event-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      });

      if (response.ok) {
        await fetchReport();
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const downloadPDF = async () => {
    if (!report?.report_pdf_path) return;

    try {
      const parts = report.report_pdf_path.split('/');
      const bucket = parts[0];
      const filePath = parts.slice(1).join('/');
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 60);
        
      if (error) throw error;
      
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchReport();
    }
  }, [eventId]);

  if (loading && !report) {
    return <div className="h-32 flex items-center justify-center">Loading report...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-medium">Post-Event Success Report</CardTitle>
          <CardDescription>Automated performance summary</CardDescription>
        </div>
        {!report && (
          <Button onClick={generateReport} disabled={generating} size="sm">
            {generating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </>
            )}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {!report ? (
          <div className="text-center py-6 text-muted-foreground">
            <p className="mb-4">No report available yet.</p>
            <p className="text-sm">Reports are automatically generated 1 day after the event date.</p>
          </div>
        ) : (
          <>
            {report.report_text && (
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{report.report_text}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                <TrendingUp className="h-5 w-5 mb-2 text-blue-500" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Attendance</span>
                <span className="font-semibold text-lg">
                  {report.performance_attendance_rate.toFixed(1)}%
                </span>
                <Badge 
                  variant={report.performance_attendance_rate >= 95 ? 'success' : 'secondary'} 
                  className="mt-1 h-5 text-[10px]"
                >
                  {report.performance_attendance_rate >= 95 ? 'Excellent' : 'Good'}
                </Badge>
              </div>

              <div className="flex flex-col items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                <DollarSign className="h-5 w-5 mb-2 text-green-500" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Total Cost</span>
                <span className="font-semibold text-lg">
                  £{report.financial_total_cost.toLocaleString()}
                </span>
                <Badge 
                  variant={report.financial_variance > 0 ? 'destructive' : 'outline'} 
                  className="mt-1 h-5 text-[10px]"
                >
                  {report.financial_variance > 0 ? `+£${report.financial_variance.toLocaleString()}` : 'On Budget'}
                </Badge>
              </div>

              <div className="flex flex-col items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center">
                <AlertCircle className="h-5 w-5 mb-2 text-orange-500" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Issues</span>
                <span className="font-semibold text-lg">
                  {report.issues_count}
                </span>
                <Badge 
                  variant={report.issues_count === 0 ? 'success' : 'secondary'} 
                  className="mt-1 h-5 text-[10px]"
                >
                  {report.issues_count === 0 ? 'None' : 'Reported'}
                </Badge>
              </div>
            </div>

            {report.report_pdf_path && (
              <div className="flex justify-end pt-2">
                <Button onClick={downloadPDF} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            )}
            
            <div className="text-xs text-right text-muted-foreground">
              Generated: {format(new Date(report.generated_at), 'MMM dd, yyyy HH:mm')}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

