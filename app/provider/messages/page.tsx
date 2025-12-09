'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useDataStore } from '@/lib/data-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Send, Paperclip } from 'lucide-react';
import * as supabaseData from '@/lib/supabase/data';
import { supabase } from '@/lib/supabase/client';

export default function ProviderMessagesPage() {
  const { user } = useAuth();
  const { messages, sendMessage, getMessages, loadMessages, markConversationRead, loadUnreadMessageCount } = useDataStore();
  const [messageText, setMessageText] = useState('');
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Find admin user ID
  useEffect(() => {
    async function findAdminUser() {
      if (!user) return;
      
      setIsLoading(true);
      try {
        // Get session token for authentication
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        // First, try to get admin user ID from API endpoint
        const res = await fetch('/api/admin-user-id', {
          method: 'GET',
          headers,
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.adminUserId) {
            setAdminUserId(data.adminUserId);
            // Load messages once we have admin ID
            await loadMessages(user.id, data.adminUserId);
            setIsLoading(false);
            return;
          }
        } else {
          console.error('Failed to get admin user ID from API:', res.status, await res.text());
        }
        
        // Fallback: Try to get admin user ID from existing messages
        const adminId = await supabaseData.getAdminUserId(user.id);
        if (adminId) {
          setAdminUserId(adminId);
          // Load messages once we have admin ID
          await loadMessages(user.id, adminId);
        }
      } catch (error) {
        console.error('Error finding admin user:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    findAdminUser();
  }, [user, loadMessages]);

  const conversationMessages = user && adminUserId
    ? getMessages(user.id, adminUserId).sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
    : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (adminUserId && conversationMessages.length > 0) {
      markConversationRead(adminUserId).finally(() => {
        loadUnreadMessageCount();
      });
    }
  }, [conversationMessages, adminUserId, markConversationRead, loadUnreadMessageCount]);

  const handleDownload = async (path: string, filename: string) => {
    try {
      // Extract bucket and path
      // path is like 'documents/assignments/...'
      const parts = path.split('/');
      const bucket = parts[0];
      const filePath = parts.slice(1).join('/');
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 60); // 1 minute expiry
        
      if (error) throw error;
      
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !user || !adminUserId) return;

    const messageToSend = messageText;
    setMessageText(''); // Clear input immediately

    try {
      await sendMessage({
        sender_id: user.id,
        receiver_id: adminUserId,
        content: messageToSend,
      });
      
      // Reload messages after sending
      await loadMessages(user.id, adminUserId);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessageText(messageToSend); // Restore on error
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground mt-1">Chat with KSS NW UK Admin</p>
      </div>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Chat with Admin</CardTitle>
          <CardDescription className="text-muted-foreground">Send and receive messages in real-time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-96 overflow-y-auto border border-border rounded-lg p-4 space-y-4 bg-muted/20">
              {!adminUserId ? (
                <p className="text-center text-muted-foreground py-8">Finding admin user...</p>
              ) : isLoading ? (
                <p className="text-center text-muted-foreground py-8">Loading messages...</p>
              ) : conversationMessages.length > 0 ? (
                conversationMessages.map((message) => {
                  const isSender = message.sender_id === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isSender
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted/50 text-foreground border border-border'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.attachment_path && (
                          <div className={`mt-2 pt-2 border-t ${isSender ? 'border-primary-foreground/20' : 'border-border'}`}>
                            <button 
                              onClick={() => handleDownload(message.attachment_path!, message.attachment_name || 'Attachment')}
                              className={`text-sm underline flex items-center gap-1 ${isSender ? 'text-primary-foreground' : 'text-primary'} hover:opacity-80`}
                            >
                              <Paperclip className="h-3 w-3" />
                              {message.attachment_name || 'View Attachment'}
                            </button>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-1">
                          <p
                            className={`text-xs ${
                              isSender ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}
                          >
                            {format(new Date(message.timestamp), 'HH:mm')}
                          </p>
                          {isSender && (
                            <span className="text-xs text-primary-foreground/70">
                              {message.read ? '✓✓ Read' : '✓ Sent'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground py-8">No messages yet</p>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="flex space-x-2">
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage();
                  }
                }}
                placeholder="Type a message..."
                className="bg-background border-border text-foreground"
              />
              <Button onClick={handleSendMessage} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

