import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Lock, ExternalLink, Loader2, Plus } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetAllPosts } from '../hooks/useQueries';
import { toast } from 'sonner';
import PaywallLinkSection from './PaywallLinkSection';

export default function PaywallTab() {
  const { identity } = useInternetIdentity();
  const { data: posts = [] } = useGetAllPosts();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkPrice, setLinkPrice] = useState('0.01');
  const [linkDescription, setLinkDescription] = useState('');

  const isAuthenticated = !!identity;

  // Get all posts with paywall links
  const postsWithPaywallLinks = posts.filter(post => post.paywallLinks.length > 0);

  const handleCreatePaywallLink = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to create paywall links');
      return;
    }

    if (!linkUrl.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    const priceNum = parseFloat(linkPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    toast.info('To create a paywall link, please create a new post with paywall content');
    setShowCreateForm(false);
    setLinkUrl('');
    setLinkPrice('0.01');
    setLinkDescription('');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Paywall Links
          </h1>
          <p className="text-muted-foreground mt-1">
            Premium content protected by crypto payments
          </p>
        </div>
        {isAuthenticated && (
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-gradient-to-r from-amber-600 to-orange-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Link
          </Button>
        )}
      </div>

      {!isAuthenticated && (
        <Card className="border-amber-500/30 bg-amber-950/10">
          <CardContent className="pt-6 text-center">
            <Lock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <p className="text-foreground font-medium mb-2">Sign in to access paywall features</p>
            <p className="text-sm text-muted-foreground">
              Create and unlock premium content with crypto payments
            </p>
          </CardContent>
        </Card>
      )}

      {showCreateForm && isAuthenticated && (
        <Card className="border-2 border-amber-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-500" />
              Create Paywall Link
            </CardTitle>
            <CardDescription>
              Add a premium link that requires payment to access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Link URL *</Label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com/premium-content"
                className="bg-card border-border"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (ICP) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={linkPrice}
                  onChange={(e) => setLinkPrice(e.target.value)}
                  placeholder="0.01"
                  className="bg-card border-border"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={linkDescription}
                  onChange={(e) => setLinkDescription(e.target.value)}
                  placeholder="Premium content"
                  className="bg-card border-border"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCreatePaywallLink}
                className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600"
              >
                Create Paywall Link
              </Button>
              <Button
                onClick={() => setShowCreateForm(false)}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Available Paywall Links</h2>
        {postsWithPaywallLinks.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-semibold text-foreground">No paywall links yet</p>
              <p className="text-muted-foreground">
                {isAuthenticated
                  ? 'Create a post with paywall content to get started'
                  : 'Sign in to view and unlock premium content'}
              </p>
            </CardContent>
          </Card>
        ) : (
          postsWithPaywallLinks.map((post) => (
            <Card key={post.id.toString()} className="glass-dark">
              <CardContent className="pt-6 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Posted by {post.author.toString().slice(0, 12)}... on{' '}
                    {new Date(Number(post.timestamp) / 1000000).toLocaleDateString()}
                  </p>
                  <p className="text-foreground">{post.content}</p>
                </div>
                <PaywallLinkSection postId={post.id} links={post.paywallLinks} />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
