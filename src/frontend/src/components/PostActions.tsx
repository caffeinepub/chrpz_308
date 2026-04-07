import { DollarSign, Heart, MessageCircle } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useLikePost, useUnlikePost } from "../hooks/useQueries";
import TipModal from "./TipModal";
import { Button } from "./ui/button";

interface PostActionsProps {
  postId: bigint;
  likeCount: number;
  commentCount: number;
  tipCount: number;
  onCommentClick: () => void;
}

export default function PostActions({
  postId,
  likeCount,
  commentCount,
  tipCount,
  onCommentClick,
}: PostActionsProps) {
  const { identity } = useInternetIdentity();
  const likePost = useLikePost();
  const unlikePost = useUnlikePost();
  const [showTipModal, setShowTipModal] = React.useState(false);
  const [isLiked, setIsLiked] = React.useState(false);

  const isAuthenticated = !!identity;

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to like posts");
      return;
    }

    try {
      if (isLiked) {
        await unlikePost.mutateAsync(postId);
        setIsLiked(false);
      } else {
        await likePost.mutateAsync(postId);
        setIsLiked(true);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update like");
    }
  };

  const handleComment = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to comment");
      return;
    }
    onCommentClick();
  };

  const handleTip = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to send tips");
      return;
    }
    setShowTipModal(true);
  };

  return (
    <>
      <div className="flex items-center gap-2 pt-4 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          disabled={likePost.isPending || unlikePost.isPending}
          className={isLiked ? "text-red-500" : ""}
        >
          <Heart className={`w-4 h-4 mr-1 ${isLiked ? "fill-current" : ""}`} />
          {likeCount}
        </Button>

        <Button variant="ghost" size="sm" onClick={handleComment}>
          <MessageCircle className="w-4 h-4 mr-1" />
          {commentCount}
        </Button>

        <Button variant="ghost" size="sm" onClick={handleTip}>
          <DollarSign className="w-4 h-4 mr-1" />
          {tipCount}
        </Button>
      </div>

      {showTipModal && (
        <TipModal
          isOpen={showTipModal}
          onClose={() => setShowTipModal(false)}
          postId={postId}
        />
      )}
    </>
  );
}
