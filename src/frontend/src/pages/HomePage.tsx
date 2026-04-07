import { AlertCircle, Flag, LogIn, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import Layout from "../components/Layout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { Textarea } from "../components/ui/textarea";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreatePost,
  useDeletePost,
  useFlagPost,
  useGetPosts,
  useIsAdmin,
  useRegisterOrGetUser,
} from "../hooks/useQueries";
import { formatRelativeTime, truncatePrincipal } from "../lib/utils";
import type { Post } from "../types";

export default function HomePage() {
  const { identity, login } = useInternetIdentity();
  const { data: posts = [], isLoading } = useGetPosts();
  const { data: isAdmin } = useIsAdmin();
  const createPost = useCreatePost();
  const deletePost = useDeletePost();
  const flagPost = useFlagPost();
  const registerOrGetUser = useRegisterOrGetUser();

  const [showCompose, setShowCompose] = useState(false);
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const isAuthenticated = !!identity;

  const handleLogin = async () => {
    try {
      await login();
      await registerOrGetUser.mutateAsync();
    } catch {
      toast.error("Login failed. Please try again.");
    }
  };

  const handleSubmitPost = async () => {
    if (!content.trim()) return;
    try {
      await createPost.mutateAsync({
        content: content.trim(),
        imageUrl: imageUrl.trim() || undefined,
      });
      setContent("");
      setImageUrl("");
      setShowCompose(false);
      toast.success("Post published!");
    } catch {
      toast.error("Failed to publish post.");
    }
  };

  const handleDelete = async (postId: bigint) => {
    try {
      await deletePost.mutateAsync(postId);
      toast.success("Post deleted.");
    } catch {
      toast.error("Failed to delete post.");
    }
  };

  const handleFlag = async (postId: bigint) => {
    try {
      await flagPost.mutateAsync(postId);
      toast.success("Post flagged for review.");
    } catch {
      toast.error("Failed to flag post.");
    }
  };

  return (
    <Layout>
      {/* Login CTA */}
      {!isAuthenticated && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-lg p-6 text-center mb-6"
          data-ocid="login-cta"
        >
          <Flag className="w-10 h-10 text-primary mx-auto mb-3" />
          <h2 className="text-xl font-bold text-foreground mb-1">
            Welcome to Chrpz
          </h2>
          <p className="text-muted-foreground text-sm mb-4">
            A patriotic social platform built on the Internet Computer.
          </p>
          <Button
            onClick={handleLogin}
            className="bg-primary hover:bg-primary/90"
            data-ocid="login-btn"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign in with Internet Identity
          </Button>
        </motion.div>
      )}

      {/* Compose */}
      {isAuthenticated && (
        <div className="mb-5">
          {!showCompose ? (
            <Button
              onClick={() => setShowCompose(true)}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              data-ocid="new-post-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-lg p-4 space-y-3"
              data-ocid="compose-form"
            >
              <Textarea
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                className="resize-none border-input focus:border-primary"
                data-ocid="compose-content"
              />
              <input
                type="url"
                placeholder="Image URL (optional)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
                data-ocid="compose-image-url"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCompose(false);
                    setContent("");
                    setImageUrl("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={!content.trim() || createPost.isPending}
                  onClick={handleSubmitPost}
                  className="bg-primary hover:bg-primary/90"
                  data-ocid="compose-submit"
                >
                  {createPost.isPending ? "Publishing..." : "Publish"}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Feed */}
      {isLoading ? (
        <div className="space-y-4" data-ocid="feed-loading">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 text-muted-foreground"
          data-ocid="feed-empty"
        >
          <Flag className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No posts yet</p>
          <p className="text-sm mt-1">Be the first to share something!</p>
        </motion.div>
      ) : (
        <AnimatePresence>
          <div className="space-y-4" data-ocid="feed-list">
            {posts.map((post, i) => (
              <PostCard
                key={String(post.id)}
                post={post}
                index={i}
                isAdmin={!!isAdmin}
                currentPrincipal={identity?.getPrincipal().toString()}
                onDelete={handleDelete}
                onFlag={handleFlag}
              />
            ))}
          </div>
        </AnimatePresence>
      )}
    </Layout>
  );
}

interface PostCardProps {
  post: Post;
  index: number;
  isAdmin: boolean;
  currentPrincipal?: string;
  onDelete: (id: bigint) => void;
  onFlag: (id: bigint) => void;
}

function PostCard({
  post,
  index,
  isAdmin,
  currentPrincipal,
  onDelete,
  onFlag,
}: PostCardProps) {
  const isOwner = currentPrincipal === post.authorId;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
      data-ocid="post-card"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary font-bold text-sm">
            {(post.authorName || "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">
              {post.authorName || truncatePrincipal(post.authorId)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatRelativeTime(post.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {post.flagged && (
            <Badge variant="destructive" className="text-xs">
              Flagged
            </Badge>
          )}
          {(isAdmin || isOwner) && (
            <button
              type="button"
              onClick={() => onDelete(post.id)}
              className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              aria-label="Delete post"
              data-ocid="post-delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {isAdmin && !post.flagged && (
            <button
              type="button"
              onClick={() => onFlag(post.id)}
              className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              aria-label="Flag post"
              data-ocid="post-flag"
            >
              <AlertCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
        {post.content}
      </p>

      {/* Image */}
      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt="Post media"
          className="mt-3 rounded-md w-full object-cover max-h-80 border border-border"
          loading="lazy"
        />
      )}
    </motion.article>
  );
}
