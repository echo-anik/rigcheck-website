'use client';

import { useState, useCallback, useEffect } from 'react';
import { Heart, MessageSquare, Edit2, Trash2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { InteractionsService, BuildComment } from '@/lib/interactions-service';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface BuildInteractionsProps {
  buildId: number;
  canClone?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onClone?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  initialLikeCount?: number;
}

export function BuildInteractions({
  buildId,
  canClone = false,
  canEdit = false,
  canDelete = false,
  onClone,
  onEdit,
  onDelete,
  initialLikeCount = 0,
}: BuildInteractionsProps) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [comments, setComments] = useState<BuildComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load comments
  const loadComments = useCallback(async () => {
    try {
      const fetchedComments = await InteractionsService.getBuildComments(buildId);
      setComments(fetchedComments);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  }, [buildId]);

  // Check if user liked the build
  useEffect(() => {
    if (isAuthenticated && user) {
      const checkLike = async () => {
        const token = localStorage.getItem('token');
        if (token) {
          const userLiked = await InteractionsService.checkUserLike(buildId, token);
          setLiked(userLiked);
        }
      };
      checkLike();
    }
  }, [buildId, isAuthenticated, user]);

  // Load comments when toggled
  useEffect(() => {
    if (showComments && comments.length === 0) {
      loadComments();
    }
  }, [showComments, comments.length, loadComments]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/builds');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Not authenticated');
        return;
      }

      const result = await InteractionsService.toggleLikeBuild(buildId, token);
      setLiked(result.liked);
      setLikeCount(prev => result.liked ? prev + 1 : Math.max(0, prev - 1));
      toast.success(result.liked ? 'Build liked!' : 'Build unliked');
    } catch (error) {
      toast.error('Failed to like build');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      router.push('/login?redirect=/builds');
      return;
    }

    if (!commentText.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Not authenticated');
        return;
      }

      const newComment = await InteractionsService.addComment(buildId, commentText, token);
      setComments(prev => [newComment, ...prev]);
      setCommentText('');
      toast.success('Comment added!');
    } catch (error) {
      toast.error('Failed to add comment');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Delete this comment?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Not authenticated');
        return;
      }

      await InteractionsService.deleteComment(buildId, commentId, token);
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comment deleted');
    } catch (error) {
      toast.error('Failed to delete comment');
      console.error(error);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link copied!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleLike}
          disabled={loading}
          className={liked ? 'bg-red-50 border-red-200' : ''}
        >
          <Heart className={`h-4 w-4 mr-2 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
          <span>{likeCount} Likes</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          <span>{comments.length} Comments</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Share
            </>
          )}
        </Button>

        {canClone && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (onClone) {
                onClone();
              } else {
                // Navigate to build detail page where clone can be done
                router.push(`/builds/${buildId}`);
              }
            }}
          >
            <Copy className="h-4 w-4 mr-2" />
            Clone Build
          </Button>
        )}

        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}

        {canDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        )}
      </div>

      {/* Comments Section */}
      {showComments && (
        <Card>
          <CardContent className="pt-6">
            {/* Comment Form */}
            {isAuthenticated && user && (
              <form onSubmit={handleAddComment} className="mb-6">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    disabled={loading}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={loading || !commentText.trim()}
                  >
                    Post
                  </Button>
                </div>
              </form>
            )}

            {!isAuthenticated && (
              <p className="text-sm text-muted-foreground mb-4">
                <button
                  onClick={() => router.push('/login?redirect=/builds')}
                  className="text-blue-600 hover:underline"
                >
                  Sign in
                </button>
                {' '}to comment on this build
              </p>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="border-l-2 border-gray-200 pl-4 py-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{comment.user?.name || 'Anonymous'}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {isAuthenticated && user?.id === comment.user_id && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-red-600 hover:text-red-700 text-xs"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mt-2">{comment.content}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
