import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Heart, MessageCircle, Star, Trash2, Flag, AlertTriangle, User, Edit } from 'lucide-react';
import PostMedia from './PostMedia';
import PostMetadata from './PostMetadata';
import CommentSection from './CommentSection';
import TipButton from './TipButton';
import RatingDisplay from './RatingDisplay';
import PaywallLinkSection from './PaywallLinkSection';
import VideoSection from './VideoSection';
import EditPostModal from './EditPostModal';
import type { Post } from '../types';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useLikePost, useUnlikePost, useDeletePost, useReportPost, useIsCallerAdmin } from '../hooks/useQueries';
import { toast } from 'sonner';
import UserProfilePage from './UserProfilePage';

interface PostCardProps {
  post: Post;
  onPostDeleted?: () => void;
}

export default function PostCard({ post, onPostDeleted }: PostCardProps) {
  const { identity } = useInternetIdentity();
  const [showComments, setShowComments] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  const likePost = useLikePost();
  const unlikePost = useUnlikePost();
  const deletePost = useDeletePost();
  const reportPost = useReportPost();
  const { data: isAdmin } = useIsCallerAdmin();

  const isAuthor = identity && post.author.toString() === identity.getPrincipal().toString();

  const handleLike = async () => {
    if (!identity) {
      toast.error('Please sign in to like posts');
      return;
    }

    try {
      if (isLiked) {
        await unlikePost.mutateAsync(post.id);
        setIsLiked(false);
      } else {
        await likePost.mutateAsync(post.id);
        setIsLiked(true);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update like');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await deletePost.mutateAsync(post.id);
      toast.success('Post deleted');
      onPostDeleted?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete post');
    }
  };

  const handleReport = async () => {
    if (!identity) {
      toast.error('Please sign in to report posts');
      return;
    }

    const category = prompt('Report category (spam/inappropriate/other):');
    if (!category) return;

    const reason = prompt('Please provide a reason for reporting:');
    if (!reason) return;

    try {
      await reportPost.mutateAsync({ postId: post.id, category, reason });
      toast.success('Post reported');
    } catch (error: any) {
      toast.error(error.message || 'Failed to report post');
    }
  };

  return (
    <>
      <Card className={`glass-dark border-2 ${post.reported ? 'border-red-500/50' : post.flagged ? 'border-orange-500/50' : ''}`}>
        <CardContent className="pt-6 space-y-4">
          {/* Author Info */}
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setShowUserProfile(true)}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {post.author.toString().slice(0, 8)}...
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(Number(post.timestamp) / 1000000).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {post.reported && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Reported
                </Badge>
              )}
              {post.flagged && (
                <Badge className="bg-orange-500 text-xs">
                  <Flag className="w-3 h-3 mr-1" />
                  Flagged
                </Badge>
              )}
              {isAuthor && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditModal(true)}
                >
                  <Edit className="w-4 h-4 text-blue-500" />
                </Button>
              )}
              {(isAuthor || isAdmin) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deletePost.isPending}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          <p className="text-foreground whitespace-pre-wrap">{post.content}</p>

          {/* Media */}
          {(post.media.length > 0 || post.publicVideos.length > 0) && (
            <PostMedia media={post.media} videos={post.publicVideos} />
          )}

          {/* Paywalled Videos */}
          {post.paywalledVideos.length > 0 && (
            <div className="space-y-3">
              {post.paywalledVideos.map((video, index) => (
                <VideoSection
                  key={index}
                  video={video.blob}
                  postId={post.id}
                  isPaywalled={true}
                  price={video.price}
                  description={video.description}
                  contentIndex={index}
                />
              ))}
            </div>
          )}

          {/* Metadata */}
          {(post.links.length > 0 || post.tags.length > 0) && (
            <PostMetadata links={post.links} tags={post.tags} />
          )}

          {/* Paywall Links */}
          {post.paywallLinks.length > 0 && (
            <PaywallLinkSection postId={post.id} links={post.paywallLinks} />
          )}

          {/* Rating */}
          <RatingDisplay postId={post.id} averageRating={post.averageRating} ratingCount={Number(post.ratingCount)} />

          {/* Actions */}
          <div className="flex items-center gap-4 pt-2 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={!identity || likePost.isPending || unlikePost.isPending}
              className={isLiked ? 'text-red-500' : ''}
            >
              <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
              {post.likeCount.toString()}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {post.commentCount.toString()}
            </Button>

            <TipButton postId={post.id} tipCount={post.tips.length} />

            {identity && !isAuthor && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReport}
                disabled={reportPost.isPending}
              >
                <Flag className="w-4 h-4 mr-2" />
                Report
              </Button>
            )}
          </div>

          {/* Comments */}
          {showComments && <CommentSection postId={post.id} />}
        </CardContent>
      </Card>

      {showUserProfile && (
        <UserProfilePage
          isOpen={showUserProfile}
          onClose={() => setShowUserProfile(false)}
          userPrincipal={post.author}
        />
      )}

      {showEditModal && (
        <EditPostModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          post={post}
          onPostUpdated={() => {
            setShowEditModal(false);
            window.location.reload();
          }}
        />
      )}
    </>
  );
}
