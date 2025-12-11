'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Copy, Check, Loader2 } from 'lucide-react';

interface StaffBriefingProps {
  eventId: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
}

export function StaffBriefing({ eventId, eventName, eventDate, eventLocation }: StaffBriefingProps) {
  const [bullets, setBullets] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateBriefing = async () => {
    setLoading(true);
    setBullets(null);
    
    try {
      // Get session token for authentication
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/ai/briefing-summarizer', {
        method: 'POST',
        headers,
        body: JSON.stringify({ eventId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to generate briefing');
      }

      const data = await res.json();
      setBullets(data.bullets || []);
      
      toast({
        title: 'Briefing Generated',
        description: 'Staff briefing summary is ready to copy.',
        variant: 'success',
      });
    } catch (error: any) {
      console.error('Error generating briefing:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate briefing summary',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!bullets) return;

    const text = bullets.join('\n');
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Briefing summary copied to clipboard',
        variant: 'success',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Staff Briefing
        </CardTitle>
        <CardDescription>
          Generate a WhatsApp-friendly summary from event briefing documents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!bullets ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Click the button below to generate a 5-bullet point summary from the briefing documents uploaded by the admin.
            </p>
            <Button 
              onClick={generateBriefing} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Staff Briefing
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 border">
              {bullets.map((bullet, index) => (
                <p key={index} className="text-sm">
                  {bullet}
                </p>
              ))}
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={copyToClipboard}
                variant="outline"
                className="flex-1"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
              <Button 
                onClick={generateBriefing}
                variant="outline"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Regenerate'
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


