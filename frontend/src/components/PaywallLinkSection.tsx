import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Lock, ExternalLink, Loader2 } from 'lucide-react';
import { useUnlockPaywallContent, useHasPaywallAccess } from '../hooks/useQueries';
import type { PaywallLink } from '../types';
import { toast } from 'sonner';

interface PaywallLinkSectionProps {
  postId: bigint;
  links: PaywallLink[];
}

export default function PaywallLinkSection({ postId, links }: PaywallLinkSectionProps) {
  const unlockContent = useUnlockPaywallContent();
  const checkAccess = useHasPaywallAccess();

  const handleUnlock = async (index: number, price: bigint) => {
    try {
      await unlockContent.mutateAsync({
        postId,
        contentType: 'link',
        contentIndex: BigInt(index),
      });
      toast.success('Link unlocked!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to unlock link');
    }
  };

  const checkLinkAccess = async (index: number): Promise<boolean> => {
    try {
      return await checkAccess.mutateAsync({
        postId,
        contentType: 'link',
        contentIndex: BigInt(index),
      });
    } catch (error) {
      return false;
    }
  };

  if (links.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Lock className="w-4 h-4 text-amber-500" />
        Premium Links
      </h3>
      {links.map((link, index) => (
        <Card key={index} className="glass-dark border-2 border-amber-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{link.description || 'Premium Link'}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Price: {(Number(link.price) / 100000000).toFixed(8)} ICP
                </p>
              </div>
              <Button
                onClick={() => handleUnlock(index, link.price)}
                disabled={unlockContent.isPending}
                size="sm"
                className="bg-gradient-to-r from-amber-600 to-orange-600"
              >
                {unlockContent.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Unlock
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
