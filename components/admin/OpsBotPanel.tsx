'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Search, Check, X, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface OpsBotPanelProps {
  eventId: string;
  providerId?: string; // Optional for admin to simulate provider
  onUseAnswer: (answer: string) => void;
  onClose: () => void;
}

export function OpsBotPanel({ eventId, providerId, onUseAnswer, onClose }: OpsBotPanelProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setAnswer(null);
    setSources([]);

    try {
      const response = await fetch('/api/ai/ops-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          eventId,
          providerId
        })
      });

      const data = await response.json();
      
      if (data.answer) {
        setAnswer(data.answer);
        setSources(data.sources || []);
      }
    } catch (error) {
      console.error('Ops Bot error:', error);
      setAnswer("I'm sorry, I couldn't process your request right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-blue-200 shadow-lg animate-in slide-in-from-right-10">
      <CardHeader className="bg-blue-50/50 pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-sm font-medium">Ops Bot (RAG)</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {!answer ? (
          <div className="space-y-3">
            <div className="text-sm text-gray-500">
              Ask a question about the event briefing documents.
            </div>
            <Textarea 
              value={question} 
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., Where is the staff parking? What is the uniform?"
              className="min-h-[100px]"
            />
            <Button 
              onClick={handleAsk} 
              disabled={!question.trim() || loading} 
              className="w-full"
            >
              {loading ? (
                <>Thinking...</>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Find Answer
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-md text-sm">
              <div className="font-medium text-blue-800 mb-1">Answer:</div>
              {answer}
            </div>

            {sources.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-2">Sources:</div>
                <div className="h-24 rounded border p-2 overflow-y-auto custom-scrollbar">
                  <div className="space-y-2">
                    {sources.map((source, idx) => (
                      <div key={idx} className="text-xs text-gray-600">
                        <Badge variant="outline" className="mb-1 text-[10px] h-4">
                          <FileText className="mr-1 h-3 w-3" />
                          {source.documentName}
                        </Badge>
                        <p className="line-clamp-2 italic opacity-80">"{source.text}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => {
                  setAnswer(null);
                  setQuestion('');
                }}
              >
                Ask Another
              </Button>
              <Button 
                size="sm" 
                className="flex-1"
                onClick={() => onUseAnswer(answer)}
              >
                <Check className="mr-2 h-4 w-4" />
                Use Answer
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


