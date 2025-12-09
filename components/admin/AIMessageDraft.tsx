'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Wand2, Copy, Check } from 'lucide-react';

interface AIMessageDraftProps {
  onDraftUsed: (draft: string) => void;
  context?: {
    recipientName?: string;
    senderName?: string;
  };
}

export function AIMessageDraft({ onDraftUsed, context }: AIMessageDraftProps) {
  const [open, setOpen] = useState(false);
  const [purpose, setPurpose] = useState('');
  const [tone, setTone] = useState('professional');
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState('');

  const handleGenerate = async () => {
    if (!purpose) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/ai/communication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'draft',
          purpose,
          context: {
            ...context,
            tone
          }
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setDraft(data.draft);
      }
    } catch (error) {
      console.error('Failed to generate draft', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUseDraft = () => {
    onDraftUsed(draft);
    setOpen(false);
    // Reset state after use
    setDraft('');
    setPurpose('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" title="Draft with AI">
          <Wand2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            AI Message Drafter
          </DialogTitle>
          <DialogDescription>
            Describe what you want to say, and AI will write a professional message for you.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Message Purpose / Key Points</Label>
            <Textarea 
              placeholder="e.g., Remind provider about missing SIA details for Glastonbury event next week."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="h-24 resize-none"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="firm">Firm</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {draft && (
            <div className="bg-gray-50 p-4 rounded-md border text-sm relative group">
              <p className="whitespace-pre-wrap">{draft}</p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => navigator.clipboard.writeText(draft)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          {draft ? (
            <>
               <Button variant="outline" onClick={() => setDraft('')}>Back</Button>
               <Button onClick={handleUseDraft} className="bg-indigo-600 hover:bg-indigo-700">
                 <Check className="h-4 w-4 mr-2" />
                 Use Draft
               </Button>
            </>
          ) : (
            <Button onClick={handleGenerate} disabled={!purpose || loading} className="bg-indigo-600 hover:bg-indigo-700">
              {loading ? (
                <>Generating...</>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Draft
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
