import { Loader2, Lock } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetCallerWallet,
  useUnlockPaywallContent,
} from "../hooks/useQueries";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

interface LockedVideoOverlayProps {
  postId: bigint;
  contentIndex: number;
  price: bigint;
  description: string;
  onUnlocked: () => void;
}

export default function LockedVideoOverlay({
  postId,
  contentIndex,
  price,
  description,
  onUnlocked,
}: LockedVideoOverlayProps) {
  const { identity } = useInternetIdentity();
  const unlockContent = useUnlockPaywallContent();
  const { data: wallet } = useGetCallerWallet();

  const isAuthenticated = !!identity;
  const priceICP = Number(price) / 100000000;
  const balance = wallet?.balance || BigInt(0);
  const balanceICP = Number(balance) / 100000000;

  const handleUnlock = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to unlock content");
      return;
    }

    if (balance < price) {
      toast.error(
        `Insufficient balance. You need ${priceICP.toFixed(4)} ICP but have ${balanceICP.toFixed(4)} ICP`,
      );
      return;
    }

    try {
      await unlockContent.mutateAsync({
        postId,
        contentType: "video",
        contentIndex: BigInt(contentIndex),
      });
      toast.success("Video unlocked!");
      onUnlocked();
    } catch (error: any) {
      toast.error(error.message || "Failed to unlock video");
    }
  };

  return (
    <Card className="border-2 border-amber-500/50 bg-amber-950/20">
      <CardContent className="p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Lock className="w-10 h-10 text-amber-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-foreground">Premium Video</h3>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
          <p className="text-3xl font-bold text-amber-500 mt-4">
            {priceICP.toFixed(4)} ICP
          </p>
        </div>

        {isAuthenticated && (
          <div className="text-sm text-muted-foreground">
            Your balance: {balanceICP.toFixed(4)} ICP
          </div>
        )}

        <Button
          onClick={handleUnlock}
          disabled={unlockContent.isPending || !isAuthenticated}
          className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 px-8 py-6 text-lg"
        >
          {unlockContent.isPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Unlocking...
            </>
          ) : (
            <>
              <Lock className="w-5 h-5 mr-2" />
              Unlock Video
            </>
          )}
        </Button>

        {!isAuthenticated && (
          <p className="text-sm text-muted-foreground">
            Please sign in to unlock this content
          </p>
        )}
      </CardContent>
    </Card>
  );
}
