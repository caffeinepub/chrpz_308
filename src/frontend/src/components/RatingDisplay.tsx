import { Star } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useRatePost } from "../hooks/useQueries";

interface RatingDisplayProps {
  postId: bigint;
  averageRating: number;
  ratingCount: number;
}

export default function RatingDisplay({
  postId,
  averageRating,
  ratingCount,
}: RatingDisplayProps) {
  const { identity } = useInternetIdentity();
  const ratePost = useRatePost();
  const [hoveredStar, setHoveredStar] = useState(0);
  const [userRating, setUserRating] = useState(0);

  const isAuthenticated = !!identity;

  const handleRate = async (stars: number) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to rate posts");
      return;
    }

    try {
      await ratePost.mutateAsync({ postId, stars: BigInt(stars) });
      setUserRating(stars);
      toast.success(stars === 0 ? "Rating removed" : `Rated ${stars} stars`);
    } catch (error: any) {
      toast.error(error.message || "Failed to rate post");
    }
  };

  const displayRating = userRating || averageRating;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            type="button"
            key={star}
            onClick={() => handleRate(star)}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            disabled={ratePost.isPending}
            className="transition-transform hover:scale-110 disabled:opacity-50"
          >
            <Star
              className={`w-5 h-5 ${
                star <= (hoveredStar || displayRating)
                  ? "fill-amber-500 text-amber-500"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>
      <div className="text-sm text-muted-foreground">
        {averageRating > 0 ? (
          <>
            {averageRating.toFixed(1)} ({ratingCount}{" "}
            {ratingCount === 1 ? "rating" : "ratings"})
          </>
        ) : (
          "No ratings yet"
        )}
      </div>
    </div>
  );
}
