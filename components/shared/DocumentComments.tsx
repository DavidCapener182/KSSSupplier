'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send } from 'lucide-react';
import { format } from 'date-fns';
import type { DocumentComment } from '@/lib/types';

interface DocumentCommentsProps {
  documentId: string;
  comments: DocumentComment[];
  onAddComment: (documentId: string, content: string) => void;
}

export function DocumentComments({ documentId, comments, onAddComment }: DocumentCommentsProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() && user) {
      onAddComment(documentId, newComment.trim());
      setNewComment('');
    }
  };

  const documentComments = comments.filter((c) => c.document_id === documentId);

  return (
    <div className="mt-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full justify-start"
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        {documentComments.length} Comment{documentComments.length !== 1 ? 's' : ''}
      </Button>

      {isExpanded && (
        <Card className="mt-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Comments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {documentComments.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {documentComments.map((comment) => (
                  <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="secondary" className="text-xs">
                        {comment.user_id === user?.id ? 'You' : 'Admin'}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {format(new Date(comment.created_at), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>
            )}

            <form onSubmit={handleSubmit} className="space-y-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={2}
                className="resize-none"
              />
              <Button type="submit" size="sm" disabled={!newComment.trim()}>
                <Send className="h-3 w-3 mr-2" />
                Post Comment
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


