import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetCallerWallet } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { ArrowLeft, Wallet, User, Copy, CheckCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import Header from './Header';
import { toast } from 'sonner';
import { ensureValidAccountId } from '../lib/accountId';

export default function ProfileEditPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: wallet, isLoading: walletLoading } = useGetCallerWallet();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [validAccountId, setValidAccountId] = useState<string>('');

  // Ensure account ID is valid
  useEffect(() => {
    if (wallet?.accountId && identity) {
      ensureValidAccountId(wallet.accountId, identity.getPrincipal()).then(setValidAccountId);
    }
  }, [wallet?.accountId, identity]);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(`${fieldName} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  if (!identity) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-6 max-w-4xl">
          <Alert className="glass-dark border-2">
            <AlertDescription>Please sign in to view your profile</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const isLoading = profileLoading || walletLoading;
  const displayAccountId = validAccountId || wallet?.accountId || '';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/' })} className="hover:bg-primary/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Profile & Wallet
          </h1>
        </div>

        {isLoading ? (
          <Card className="glass-dark border-2">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Loading profile...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Profile Information */}
            <Card className="glass-dark border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Display Name</label>
                      <p className="text-lg font-semibold text-foreground">{profile.name}</p>
                    </div>
                    {profile.bio && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Bio</label>
                        <p className="text-foreground">{profile.bio}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Followers</p>
                        <p className="text-2xl font-bold text-foreground">{Number(profile.followerCount)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Following</p>
                        <p className="text-2xl font-bold text-foreground">{Number(profile.followingCount)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Average Rating</p>
                        <p className="text-2xl font-bold text-foreground">{profile.averageRating.toFixed(1)} ⭐</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Member since: {new Date(Number(profile.joinedDate) / 1000000).toLocaleDateString()}
                      </p>
                      {profile.newsletterSubscribed && (
                        <Badge variant="outline" className="mt-2">
                          Newsletter Subscriber
                        </Badge>
                      )}
                    </div>
                  </>
                ) : (
                  <Alert>
                    <AlertDescription>Profile not found</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* ICP Wallet Information */}
            <Card className="glass-dark border-2 border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Wallet className="w-5 h-5 text-primary" />
                  ICP Wallet
                </CardTitle>
                <CardDescription>Your Internet Computer wallet details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {wallet ? (
                  <>
                    {/* Balance */}
                    <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-primary/20">
                      <p className="text-sm text-muted-foreground mb-1">Balance</p>
                      <p className="text-3xl font-bold text-foreground">
                        {(Number(wallet.balance) / 100000000).toFixed(8)} ICP
                      </p>
                    </div>

                    {/* Account ID (AID) */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Account ID (AID)</label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs bg-background/50 p-3 rounded border border-border font-mono break-all">
                          {displayAccountId}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(displayAccountId, 'Account ID')}
                          className="shrink-0"
                        >
                          {copiedField === 'Account ID' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        64-character hexadecimal ICP account identifier
                      </p>
                    </div>

                    {/* Principal ID (PID) */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Principal ID (PID)</label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs bg-background/50 p-3 rounded border border-border font-mono break-all">
                          {profile?.principalId || identity.getPrincipal().toString()}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(profile?.principalId || identity.getPrincipal().toString(), 'Principal ID')}
                          className="shrink-0"
                        >
                          {copiedField === 'Principal ID' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Your unique Internet Computer identity
                      </p>
                    </div>

                    {/* Transaction History */}
                    {wallet.transactionHistory.length > 0 && (
                      <div className="pt-4 border-t border-border">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Recent Transactions</p>
                        <p className="text-sm text-foreground">
                          {wallet.transactionHistory.length} transaction(s)
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <Alert>
                    <AlertDescription>
                      Wallet not found. Your ICP wallet is automatically created upon registration approval.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

