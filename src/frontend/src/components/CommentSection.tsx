import { Loader2, MessageSquare, Trash2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddComment,
  useDeleteComment,
  useGetCommentsForPost,
} from "../hooks/useQueries";
import type { Comment } from "../types";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Textarea } from "./ui/textarea";

interface CommentSectionProps {
  postId: bigint;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const { identity } = useInternetIdentity();

  const addComment = useAddComment();
  const getComments = useGetCommentsForPost();
  const deleteComment = useDeleteComment();

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadComments = async () => {
    try {
      const result = await getComments.mutateAsync(postId);
      setComments(result);
    } catch (error: any) {
      console.error("Failed to load comments:", error);
      // Backend not implemented yet
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    if (!identity) {
      toast.error("Please sign in to comment");
      return;
    }

    try {
      await addComment.mutateAsync({ postId, content: newComment.trim() });
      setNewComment("");
      await loadComments();
      toast.success("Comment added");
    } catch (error: any) {
      toast.error(error.message || "Failed to add comment");
    }
  };

  const handleDeleteComment = async (commentId: bigint) => {
    if (!confirm("Delete this comment?")) return;

    try {
      await deleteComment.mutateAsync(commentId);
      await loadComments();
      toast.success("Comment deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete comment");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <MessageSquare className="w-4 h-4" />
        <span>{comments.length} Comments</span>
      </div>

      {identity && (
        <div className="space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            className="bg-card border-border"
          />
          <Button
            onClick={handleAddComment}
            disabled={addComment.isPending || !newComment.trim()}
            size="sm"
            className="bg-gradient-to-r from-indigo-600 to-purple-600"
          >
            {addComment.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              "Post Comment"
            )}
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {comments.map((comment) => (
          <Card key={comment.id.toString()} className="glass-dark border">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-foreground">{comment.content}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span>{comment.author.toString().slice(0, 8)}...</span>
                    <span>•</span>
                    <span>
                      {new Date(
                        Number(comment.timestamp) / 1000000,
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
                {identity &&
                  comment.author.toString() ===
                    identity.getPrincipal().toString() && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={deleteComment.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
