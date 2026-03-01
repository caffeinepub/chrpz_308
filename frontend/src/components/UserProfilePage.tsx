import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { User, Calendar, Star, Users, Loader2 } from 'lucide-react';
import { Principal } from '@icp-sdk/core/principal';
import { useGetUserProfile, useFollowUser, useUnfollowUser, useIsFollowing } from '../hooks/useQueries';
import type { UserProfile } from '../types';
import { toast } from 'sonner';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

interface UserProfilePageProps {
  isOpen: boolean;
  onClose: () => void;
  userPrincipal: Principal;
}

export default function UserProfilePage({ isOpen, onClose, userPrincipal }: UserProfilePageProps) {
  const { identity } = useInternetIdentity();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const getUserProfile = useGetUserProfile();
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();
  const checkFollowing = useIsFollowing();

  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen, userPrincipal]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const profileData = await getUserProfile.mutateAsync(userPrincipal);
      setProfile(profileData);

      if (identity) {
        const following = await checkFollowing.mutateAsync(userPrincipal);
        setIsFollowing(following);
      }
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      toast.error(error.message || 'Backend not implemented');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!identity) {
      toast.error('Please sign in to follow users');
      return;
    }

    try {
      if (isFollowing) {
        await unfollowUser.mutateAsync(userPrincipal);
        setIsFollowing(false);
        toast.success('Unfollowed user');
      } else {
        await followUser.mutateAsync(userPrincipal);
        setIsFollowing(true);
        toast.success('Following user');
      }
      await loadProfile();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update follow status');
    }
  };

  const isOwnProfile = identity && userPrincipal.toString() === identity.getPrincipal().toString();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl glass-dark border-2">
        <DialogHeader>
          <DialogTitle className="text-foreground">User Profile</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground">{profile.name}</h2>
                {profile.bio && (
                  <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>
                )}
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">{profile.followerCount.toString()}</span>
                    <span className="text-muted-foreground">followers</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <span className="font-medium text-foreground">{profile.followingCount.toString()}</span>
                    <span className="text-muted-foreground">following</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 text-amber-500" />
                    <span className="font-medium text-foreground">{profile.averageRating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
              {!isOwnProfile && identity && (
                <Button
                  onClick={handleFollow}
                  disabled={followUser.isPending || unfollowUser.isPending}
                  variant={isFollowing ? 'outline' : 'default'}
                  className={!isFollowing ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : ''}
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </Button>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="glass-dark border">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Joined</p>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(Number(profile.joinedDate) / 1000000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-dark border">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Total Ratings</p>
                      <p className="text-sm font-medium text-foreground">
                        {profile.totalRatings.toString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Wallet Info */}
            <Card className="glass-dark border-2 border-primary/30">
              <CardContent className="pt-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Account ID (AID)</p>
                <code className="text-xs bg-background/50 p-2 rounded block break-all font-mono">
                  {profile.accountId}
                </code>
                <p className="text-xs font-medium text-muted-foreground mt-3">Principal ID (PID)</p>
                <code className="text-xs bg-background/50 p-2 rounded block break-all font-mono">
                  {profile.principalId}
                </code>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Profile not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
