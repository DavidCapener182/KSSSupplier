'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface ConversationSummaryProps {
  senderId: string;
  receiverId: string;
}

export function ConversationSummary({ senderId, receiverId }: ConversationSummaryProps) {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchSummary = async () => {
    setLoading(true);
    setExpanded(true);
    try {
      const response = await fetch('/api/ai/communication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'summarize',
          senderId,
          receiverId
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
        setFetched(true);
      }
    } catch (error) {
      console.error('Failed to fetch summary', error);
    } finally {
      setLoading(false);
    }
  };

  if (!fetched && !loading) {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={fetchSummary}
        className="w-full justify-between text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700"
      >
        <span className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Summarize Conversation
        </span>
        <Badge variant="outline" className="bg-white text-indigo-600 border-indigo-200">AI</Badge>
      </Button>
    );
  }

  return (
    <Card className="bg-indigo-50/50 border-indigo-100 mb-4">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-indigo-600" />
            <CardTitle className="text-sm font-medium text-indigo-900">Conversation Summary</CardTitle>
        </div>
        <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={fetchSummary} disabled={loading}>
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent className="px-4 pb-4 pt-0">
            {loading ? (
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
            ) : summary ? (
                <div className="space-y-3 text-sm">
                    <p className="text-gray-700">{summary.summary}</p>
                    
                    {summary.keyPoints && summary.keyPoints.length > 0 && (
                        <div>
                            <p className="font-semibold text-xs text-gray-500 uppercase mb-1">Key Points</p>
                            <ul className="list-disc pl-4 space-y-0.5 text-gray-600">
                                {summary.keyPoints.map((point: string, i: number) => (
                                    <li key={i}>{point}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    {summary.actionItems && summary.actionItems.length > 0 && (
                        <div>
                            <p className="font-semibold text-xs text-gray-500 uppercase mb-1">Action Items</p>
                            <ul className="list-disc pl-4 space-y-0.5 text-gray-600">
                                {summary.actionItems.map((item: string, i: number) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            ) : (
                <p className="text-sm text-gray-500">Could not generate summary.</p>
            )}
        </CardContent>
      )}
    </Card>
  );
}
