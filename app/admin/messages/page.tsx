'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useDataStore } from '@/lib/data-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Send, Trash, User, MessageSquare, Paperclip, Users, CheckSquare, Square } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { AIMessageDraft } from '@/components/admin/AIMessageDraft';
import { ConversationSummary } from '@/components/admin/ConversationSummary';
import { OpsBotPanel } from '@/components/admin/OpsBotPanel';
import { Bot } from 'lucide-react';

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
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [showOpsBot, setShowOpsBot] = useState(false);
  const [activeEventId, setActiveEventId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedProvider = providers.find((p) => p.id === selectedProviderId);

  useEffect(() => {
    if (selectedProviderId) {
      // Fetch the most recent or upcoming assignment's event ID
      const fetchActiveEvent = async () => {
        const { data } = await supabase
          .from('assignments')
          .select('event_id, events(date)')
          .eq('provider_id', selectedProviderId)
          .gte('events.date', new Date().toISOString().split('T')[0])
          .order('events(date)', { ascending: true })
          .limit(1)
          .single();
        
        if (data && data.event_id) {
          setActiveEventId(data.event_id);
        }
      };
      fetchActiveEvent();
    }
  }, [selectedProviderId]);
  
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

  const handleToggleProvider = (providerId: string) => {
    const newSelected = new Set(selectedProviders);
    if (newSelected.has(providerId)) {
      newSelected.delete(providerId);
    } else {
      newSelected.add(providerId);
    }
    setSelectedProviders(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProviders.size === providers.length) {
      setSelectedProviders(new Set());
    } else {
      setSelectedProviders(new Set(providers.map(p => p.id)));
    }
  };

  const handleSendBulkMessage = async () => {
    if (!messageText.trim() || selectedProviders.size === 0 || !user) return;

    if (isMockAuth) {
      alert('Messages are not available with mock authentication. Please log in with Supabase authentication to use the messaging feature.');
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user.id)) {
      alert('Invalid user ID. Please log in with Supabase authentication to use the messaging feature.');
      return;
    }

    const messageToSend = messageText;
    setMessageText('');
    setIsSendingBulk(true);

    try {
      const selectedProviderObjects = providers.filter(p => selectedProviders.has(p.id));
      let successCount = 0;
      let errorCount = 0;

      for (const provider of selectedProviderObjects) {
        if (!uuidRegex.test(provider.user_id)) {
          errorCount++;
          continue;
        }

        try {
          await sendMessage({
            sender_id: user.id,
            receiver_id: provider.user_id,
            content: messageToSend,
          });
          successCount++;
        } catch (error) {
          console.error(`Error sending message to ${provider.company_name}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        alert(`Message sent to ${successCount} provider${successCount > 1 ? 's' : ''}${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
      } else {
        alert(`Failed to send message to any providers. Please try again.`);
        setMessageText(messageToSend);
      }

      // Clear selection after sending
      setSelectedProviders(new Set());
    } catch (error) {
      console.error('Error sending bulk messages:', error);
      setMessageText(messageToSend);
    } finally {
      setIsSendingBulk(false);
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-foreground">Providers</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {bulkMode ? 'Select providers to message' : 'Select a provider to message'}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBulkMode(!bulkMode);
                  if (!bulkMode) {
                    setSelectedProviderId('');
                    setSelectedProviders(new Set());
                  }
                }}
                className={bulkMode ? 'bg-primary/10 border-primary' : ''}
              >
                <Users className="h-4 w-4 mr-2" />
                {bulkMode ? 'Single' : 'Bulk'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4">
            {bulkMode && (
              <div className="mb-3 pb-3 border-b">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="w-full justify-start text-sm"
                >
                  {selectedProviders.size === providers.length ? (
                    <>
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Select All ({providers.length})
                    </>
                  )}
                </Button>
                {selectedProviders.size > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {selectedProviders.size} provider{selectedProviders.size > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            )}
            <div className="space-y-2">
              {providers.map((provider) => {
                const isSelected = bulkMode ? selectedProviders.has(provider.id) : selectedProviderId === provider.id;
                return (
                  <div
                    key={provider.id}
                    className={`w-full text-left p-3 rounded-lg transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                        : 'hover:bg-muted/50 text-foreground'
                    }`}
                  >
                    {bulkMode && (
                      <Checkbox
                        checked={selectedProviders.has(provider.id)}
                        onCheckedChange={() => handleToggleProvider(provider.id)}
                        className="mr-1"
                      />
                    )}
                    {!bulkMode && (
                      <button
                        onClick={() => setSelectedProviderId(provider.id)}
                        className="flex-1 flex items-center gap-3"
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          <User className="h-5 w-5" />
                        </div>
                        <div className="flex-1 overflow-hidden text-left">
                          <p className="font-medium truncate">{provider.company_name}</p>
                          <p className="text-xs opacity-70 truncate">{provider.contact_email}</p>
                        </div>
                      </button>
                    )}
                    {bulkMode && (
                      <>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          <User className="h-5 w-5" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="font-medium truncate">{provider.company_name}</p>
                          <p className="text-xs opacity-70 truncate">{provider.contact_email}</p>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-none shadow-md flex flex-col h-full bg-card">
          <CardHeader className="border-b border-border flex flex-row items-center justify-between py-4">
            <div className="flex items-center gap-3">
              {bulkMode ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-foreground">
                      Bulk Message
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {selectedProviders.size > 0 
                        ? `Message ${selectedProviders.size} provider${selectedProviders.size > 1 ? 's' : ''}`
                        : 'Select providers to message'}
                    </CardDescription>
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
            {selectedProvider && !isMockAuth && !bulkMode && (
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
            {bulkMode ? (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 bg-muted/30">
                  {selectedProviders.size === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <Users className="h-12 w-12 mb-3 opacity-20" />
                      <p className="font-medium">No providers selected</p>
                      <p className="text-sm">Select providers from the list to send a bulk message</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-900/40 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-indigo-900 dark:text-indigo-400">
                              Sending to {selectedProviders.size} provider{selectedProviders.size > 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-indigo-700 dark:text-indigo-500/90 mt-1">
                              {providers
                                .filter(p => selectedProviders.has(p.id))
                                .map(p => p.company_name)
                                .join(', ')}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-card border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-2">
                          This message will be sent to all selected providers. Each provider will receive it as an individual message.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-card border-t border-border space-y-3">
                  {selectedProviders.size > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Quick Messages:</p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMessageText('Please check your portal for any pending actions or updates.')}
                          className="text-xs h-8"
                        >
                          Check Portal
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMessageText('Please ensure all required documents and staff details have been submitted.')}
                          className="text-xs h-8"
                        >
                          Submit Documents
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMessageText('Please verify that all SIA license details are up to date and valid.')}
                          className="text-xs h-8"
                        >
                          Verify SIA Licenses
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMessageText('Please confirm your availability and staffing numbers for upcoming events.')}
                          className="text-xs h-8"
                        >
                          Confirm Availability
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMessageText('Please review and accept any pending assignments in your portal.')}
                          className="text-xs h-8"
                        >
                          Review Assignments
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMessageText('Please submit your timesheets for completed events as soon as possible.')}
                          className="text-xs h-8"
                        >
                          Submit Timesheets
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <AIMessageDraft 
                      onDraftUsed={(draft) => setMessageText(draft)} 
                      context={{
                        recipientName: selectedProviders.size > 0 
                          ? `${selectedProviders.size} provider${selectedProviders.size > 1 ? 's' : ''}`
                          : 'Multiple providers',
                        senderName: 'Admin'
                      }}
                    />
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type a message to send to all selected providers..."
                      className="flex-1 bg-background border-border focus:bg-background"
                      disabled={isMockAuth || selectedProviders.size === 0}
                    />
                    <Button 
                      onClick={handleSendBulkMessage} 
                      disabled={!messageText.trim() || isMockAuth || selectedProviders.size === 0 || isSendingBulk}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm px-4"
                    >
                      {isSendingBulk ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send to {selectedProviders.size}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : selectedProvider ? (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30 relative">
                  {showOpsBot && (
                    <div className="absolute right-4 top-4 z-10 w-80">
                      <OpsBotPanel 
                        eventId={activeEventId} 
                        providerId={selectedProviderId}
                        onUseAnswer={(answer) => {
                          setMessageText(answer);
                          setShowOpsBot(false);
                        }}
                        onClose={() => setShowOpsBot(false)}
                      />
                    </div>
                  )}
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
                    <>
                      {!isMockAuth && user && selectedProvider && (
                        <ConversationSummary 
                          senderId={user.id} 
                          receiverId={selectedProvider.user_id} 
                        />
                      )}
                      {conversationMessages.map((message) => {
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
                      })}
                    </>
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
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowOpsBot(!showOpsBot)}
                      title="Ask Ops Bot (RAG)"
                      className={showOpsBot ? 'bg-blue-50 text-blue-600 border-blue-200' : ''}
                    >
                      <Bot className="h-4 w-4" />
                    </Button>
                    <AIMessageDraft 
                      onDraftUsed={(draft) => setMessageText(draft)} 
                      context={{
                        recipientName: selectedProvider?.company_name,
                        senderName: 'Admin'
                      }}
                    />
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
