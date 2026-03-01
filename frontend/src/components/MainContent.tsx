import React, { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetAllPosts } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, Plus, TrendingUp, MessageSquare, Heart, Clock, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import CreatePostModal from './CreatePostModal';
import PostCard from './PostCard';

type SortOption = 'latest' | 'mostLiked' | 'mostCommented';

export default function MainContent() {
  const { identity } = useInternetIdentity();
  const { data: posts = [], isLoading: postsLoading } = useGetAllPosts();
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [showCreatePost, setShowCreatePost] = useState(false);

  const isAuthenticated = !!identity;

  // Sort posts based on selected option
  const sortedPosts = [...posts].sort((a, b) => {
    switch (sortBy) {
      case 'latest':
        return Number(b.timestamp - a.timestamp);
      case 'mostLiked':
        return Number(b.likeCount - a.likeCount);
      case 'mostCommented':
        return Number(b.commentCount - a.commentCount);
      default:
        return 0;
    }
  });

  const getSortIcon = (option: SortOption) => {
    switch (option) {
      case 'latest':
        return <Clock className="w-4 h-4" />;
      case 'mostLiked':
        return <Heart className="w-4 h-4" />;
      case 'mostCommented':
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Welcome to Chrpz
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            A decentralized social platform on the Internet Computer
          </p>
        </div>

        {/* Create Post Section */}
        {isAuthenticated && (
          <Card className="glass-dark border-2">
            <CardContent className="pt-6">
              <Button
                onClick={() => setShowCreatePost(true)}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Post
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Sort Controls */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Content Feed</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-[180px] bg-card border-border">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {getSortIcon(sortBy)}
                    <span>
                      {sortBy === 'latest' && 'Latest'}
                      {sortBy === 'mostLiked' && 'Most Liked'}
                      {sortBy === 'mostCommented' && 'Most Commented'}
                    </span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Latest
                  </div>
                </SelectItem>
                <SelectItem value="mostLiked">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Most Liked
                  </div>
                </SelectItem>
                <SelectItem value="mostCommented">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Most Commented
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Posts Feed */}
        {postsLoading ? (
          <Card className="glass-dark border-2">
            <CardContent className="py-12 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading posts...</p>
            </CardContent>
          </Card>
        ) : sortedPosts.length === 0 ? (
          <Card className="glass-dark border-2">
            <CardHeader>
              <CardTitle className="text-center text-foreground">No Posts Yet</CardTitle>
              <CardDescription className="text-center">
                {isAuthenticated
                  ? 'Be the first to create a post!'
                  : 'Sign in to view and create posts'}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {isAuthenticated
                  ? 'Share your thoughts, media, and premium content with the community.'
                  : 'Join the platform to access exclusive content and interact with creators.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {sortedPosts.map((post) => (
              <PostCard key={post.id.toString()} post={post} />
            ))}
          </div>
        )}

        {/* Getting Started for Non-Authenticated Users */}
        {!isAuthenticated && (
          <Card className="glass-dark border-2 border-primary/50">
            <CardHeader>
              <CardTitle className="text-foreground">Get Started</CardTitle>
              <CardDescription>Join the Chrpz community</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Sign in with Internet Identity or Email to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Create and share posts with media</li>
                <li>Interact with content through likes, comments, and ratings</li>
                <li>Send and receive ICP and token tips</li>
                <li>Access premium paywalled content</li>
                <li>Build your profile and follow other users</li>
              </ul>
              <Alert className="border-primary/50 bg-primary/10">
                <AlertCircle className="w-4 h-4 text-primary" />
                <AlertDescription>
                  Your registration will require admin approval. An ICP wallet will be automatically 
                  generated for you upon approval.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePostModal
          isOpen={showCreatePost}
          onClose={() => setShowCreatePost(false)}
          onPostCreated={() => {
            setShowCreatePost(false);
          }}
        />
      )}
    </div>
  );
}
