import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Lock, Play, AlertCircle } from 'lucide-react';
import { useUnlockPaywallContent, useHasPaywallAccess, useGetCallerWallet } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import type { ExternalBlob } from '../backend';
import { toast } from 'sonner';

interface VideoSectionProps {
  video: ExternalBlob;
  postId: bigint;
  isPaywalled: boolean;
  price: bigint;
  description: string;
  contentIndex: number;
}

export default function VideoSection({ video, postId, isPaywalled, price, description, contentIndex }: VideoSectionProps) {
  const { identity } = useInternetIdentity();
  const [hasAccess, setHasAccess] = useState(!isPaywalled);
  const [isPlaying, setIsPlaying] = useState(false);
  const unlockContent = useUnlockPaywallContent();
  const checkAccess = useHasPaywallAccess();
  const { data: wallet } = useGetCallerWallet();

  const isAuthenticated = !!identity;
  const priceICP = Number(price) / 100000000;
  const balance = wallet?.balance || BigInt(0);

  React.useEffect(() => {
    if (isPaywalled && isAuthenticated) {
      checkAccess.mutateAsync({
        postId,
        contentType: 'video',
        contentIndex: BigInt(contentIndex),
      }).then(setHasAccess).catch(() => setHasAccess(false));
    }
  }, [isPaywalled, isAuthenticated, postId, contentIndex]);

  const handleUnlock = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to unlock content');
      return;
    }

    if (balance < price) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      await unlockContent.mutateAsync({
        postId,
        contentType: 'video',
        contentIndex: BigInt(contentIndex),
      });
      setHasAccess(true);
      toast.success('Video unlocked!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to unlock video');
    }
  };

  if (isPaywalled && !hasAccess) {
    return (
      <Card className="border-2 border-amber-500/50 bg-amber-950/20">
        <CardContent className="p-6 text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Lock className="w-8 h-8 text-amber-500" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Premium Video</h3>
            {description && <p className="text-sm text-muted-foreground mb-3">{description}</p>}
            <p className="text-2xl font-bold text-amber-500">{priceICP.toFixed(4)} ICP</p>
          </div>
          <Button
            onClick={handleUnlock}
            disabled={unlockContent.isPending}
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
          >
            {unlockContent.isPending ? 'Unlocking...' : 'Unlock Video'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
      <video
        src={video.getDirectURL()}
        controls
        className="w-full h-full"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={(e) => {
          toast.error('Failed to load video');
        }}
      >
        Your browser does not support the video tag.
      </video>
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Play className="w-16 h-16 text-white" />
        </div>
      )}
    </div>
  );
}
