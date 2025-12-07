'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useDataStore } from '@/lib/data-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Send, Trash, User, MessageSquare, Paperclip } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function MessagesPage() {
  const { user } = useAuth();
  const {
    providers,
    messages,
    sendMessage,
    getMessages,
    loadProviders,
    loadMessages,
    deleteMessage,
    deleteConversation,
    markConversationRead,
    loadUnreadMessageCount,
  } = useDataStore();
  
  // Check if using mock auth (messages require real Supabase UUIDs)
  const isMockAuth = user?.id?.startsWith('admin-') || user?.id?.startsWith('user-');
  
  const searchParams = useSearchParams();

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  // Preselect provider from query param when available
  useEffect(() => {
    const providerId = searchParams.get('providerId');
    if (providerId && providers.length > 0) {
      const providerExists = providers.some((p) => p.id === providerId);
      if (providerExists) {
        setSelectedProviderId(providerId);
      }
    }
  }, [searchParams, providers]);
  
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedProvider = providers.find((p) => p.id === selectedProviderId);
  
  // Load messages when provider is selected (only if not using mock auth)
  useEffect(() => {
    if (selectedProviderId && user && selectedProvider && !isMockAuth) {
      setIsLoading(true);
      loadMessages(user.id, selectedProvider.user_id)
        .catch((error) => {
          console.error('Error loading messages:', error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [selectedProviderId, user, selectedProvider, isMockAuth, loadMessages]);
  
  const conversationMessages = selectedProviderId && user && selectedProvider && !isMockAuth
    ? getMessages(user.id, selectedProvider.user_id).sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
    : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (selectedProvider && conversationMessages.length > 0 && !isMockAuth) {
      markConversationRead(selectedProvider.user_id).finally(() => {
        loadUnreadMessageCount();
      });
    }
  }, [conversationMessages, selectedProvider, markConversationRead, isMockAuth, loadUnreadMessageCount]);

  const handleDownload = async (path: string, filename: string) => {
    try {
      const parts = path.split('/');
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
      console.error('Error downloading file:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedProvider || !user) return;

    // Check if using mock auth - messages require real Supabase UUIDs
    if (isMockAuth) {
      alert('Messages are not available with mock authentication. Please log in with Supabase authentication to use the messaging feature.');
      return;
    }

    // Validate UUIDs before sending
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user.id) || !uuidRegex.test(selectedProvider.user_id)) {
      alert('Invalid user IDs. Please log in with Supabase authentication to use the messaging feature.');
      return;
    }

    const messageToSend = messageText;
    setMessageText(''); // Clear input immediately for better UX

    try {
      await sendMessage({
        sender_id: user.id,
        receiver_id: selectedProvider.user_id,
        content: messageToSend,
      });
      
      // Reload messages after sending to get the latest
      if (selectedProvider) {
        await loadMessages(user.id, selectedProvider.user_id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessageText(messageToSend); // Restore message on error
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!user || isMockAuth) return;
    const confirmed = window.confirm('Delete this message?');
    if (!confirmed) return;
    try {
      await deleteMessage(messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleClearConversation = async () => {
    if (!user || !selectedProvider || isMockAuth) return;
    const confirmed = window.confirm('Clear all messages in this chat?');
    if (!confirmed) return;
    setIsClearing(true);
    try {
      await deleteConversation(user.id, selectedProvider.user_id);
    } catch (error) {
      console.error('Error clearing conversation:', error);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6 p-2">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Messages</h1>
        <p className="text-muted-foreground mt-2">Communicate directly with providers</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 h-[calc(100vh-200px)]">
        <Card className="border-none shadow-md flex flex-col h-full bg-card">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-lg text-foreground">Providers</CardTitle>
            <CardDescription className="text-muted-foreground">Select a provider to message</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => setSelectedProviderId(provider.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all flex items-center gap-3 ${
                    selectedProviderId === provider.id
                      ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                      : 'hover:bg-muted/50 text-foreground'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedProviderId === provider.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-medium truncate">{provider.company_name}</p>
                    <p className="text-xs opacity-70 truncate">{provider.contact_email}</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-none shadow-md flex flex-col h-full bg-card">
          <CardHeader className="border-b border-border flex flex-row items-center justify-between py-4">
            <div className="flex items-center gap-3">
              {selectedProvider && (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <User className="h-5 w-5" />
                </div>
              )}
              <div>
                <CardTitle className="text-lg text-foreground">
                  {selectedProvider ? selectedProvider.company_name : 'Select a provider'}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {selectedProvider ? 'Direct message history' : 'Start a conversation'}
                </CardDescription>
              </div>
            </div>
            {selectedProvider && !isMockAuth && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearConversation}
                disabled={isClearing}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash className="h-4 w-4 mr-2" />
                {isClearing ? 'Clearing...' : 'Clear Chat'}
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {selectedProvider ? (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
                  {isMockAuth && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-lg p-4 mb-4 flex items-start gap-3">
                      <div className="p-1 bg-amber-100 dark:bg-amber-900/40 rounded-full text-amber-600 dark:text-amber-400 mt-0.5">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-400">Mock Authentication Active</p>
                        <p className="text-xs text-amber-700 dark:text-amber-500/90 mt-1">
                          Messages are not available with mock authentication. Please log in with Supabase authentication to use this feature.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : conversationMessages.length > 0 ? (
                    conversationMessages.map((message) => {
                      const isSender = message.sender_id === user?.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                              isSender
                                ? 'bg-primary text-primary-foreground rounded-tr-none'
                                : 'bg-card border border-border text-foreground rounded-tl-none'
                            }`}
                          >
                            <div className="flex flex-col gap-2">
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                              {message.attachment_path && (
                                <div className={`pt-2 border-t ${isSender ? 'border-primary-foreground/20' : 'border-border'}`}>
                                  <button 
                                    onClick={() => handleDownload(message.attachment_path!, message.attachment_name || 'Attachment')}
                                    className={`text-sm underline flex items-center gap-1 ${isSender ? 'text-primary-foreground' : 'text-primary'} hover:opacity-80`}
                                  >
                                    <Paperclip className="h-3 w-3" />
                                    {message.attachment_name || 'View Attachment'}
                                  </button>
                                </div>
                              )}
                            </div>
                            <div className={`flex items-center justify-end mt-1 gap-1 text-[10px] ${
                              isSender ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}>
                              <span>{format(new Date(message.timestamp), 'HH:mm')}</span>
                              {isSender && (
                                <span>{message.read ? '• Read' : '• Sent'}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mb-3 opacity-20" />
                      <p>No messages yet</p>
                      <p className="text-sm">Start the conversation below</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-4 bg-card border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type a message..."
                      className="flex-1 bg-background border-border focus:bg-background"
                      disabled={isMockAuth}
                    />
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={!messageText.trim() || isMockAuth}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm px-4"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-muted/30">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium text-muted-foreground">Select a provider to start chatting</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
