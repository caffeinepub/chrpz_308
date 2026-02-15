import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CheckCircle, XCircle, Clock, AlertTriangle, Trash2, Flag, Shield, Eye, Loader2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';
import { Principal } from '@icp-sdk/core/principal';
import { 
  useListApprovals,
  useSetApproval,
  useGetAdminPosts,
  useDeletePost,
  useFlagPost,
  useUnflagPost,
  useGetReportedPosts
} from '../hooks/useQueries';
import type { Post, UserApprovalInfo } from '../types';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ApprovalStatus } from '../backend';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPosts, setSelectedPosts] = useState<Set<bigint>>(new Set());
  const [filterType, setFilterType] = useState<'all' | 'reported' | 'flagged'>('all');
  const [posts, setPosts] = useState<Post[]>([]);

  // Approvals
  const { data: approvals = [] } = useListApprovals();
  const setApproval = useSetApproval();

  // Post moderation
  const getAdminPosts = useGetAdminPosts();
  const getReportedPosts = useGetReportedPosts();
  const deletePost = useDeletePost();
  const flagPost = useFlagPost();
  const unflagPost = useUnflagPost();

  const pendingApprovals = approvals.filter(a => a.status === ApprovalStatus.pending);

  // Load posts based on filter
  useEffect(() => {
    const loadPosts = async () => {
      try {
        let result: Post[];
        if (filterType === 'reported') {
          result = await getReportedPosts.mutateAsync();
        } else {
          result = await getAdminPosts.mutateAsync();
        }
        
        // Apply additional filtering
        if (filterType === 'flagged') {
          result = result.filter(p => p.flagged);
        }
        
        setPosts(result);
      } catch (error: any) {
        console.error('Failed to load posts:', error);
        toast.error(error.message || 'Failed to load posts');
      }
    };

    if (activeTab === 'posts') {
      loadPosts();
    }
  }, [activeTab, filterType]);

  const handleApproveRegistration = async (principal: Principal) => {
    try {
      await setApproval.mutateAsync({ user: principal, status: ApprovalStatus.approved });
      toast.success('Registration approved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve registration');
    }
  };

  const handleRejectRegistration = async (principal: Principal) => {
    try {
      await setApproval.mutateAsync({ user: principal, status: ApprovalStatus.rejected });
      toast.success('Registration rejected');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject registration');
    }
  };

  const handleDeletePost = async (postId: bigint) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await deletePost.mutateAsync(postId);
      toast.success('Post deleted successfully');
      setPosts(posts.filter(p => p.id !== postId));
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete post');
    }
  };

  const handleFlagPost = async (postId: bigint, currentlyFlagged: boolean) => {
    try {
      if (currentlyFlagged) {
        await unflagPost.mutateAsync(postId);
        toast.success('Post unflagged');
      } else {
        await flagPost.mutateAsync(postId);
        toast.success('Post flagged');
      }
      setPosts(posts.map(p => p.id === postId ? { ...p, flagged: !currentlyFlagged } : p));
    } catch (error: any) {
      toast.error(error.message || 'Failed to update flag status');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPosts.size === 0) {
      toast.error('No posts selected');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedPosts.size} post(s)?`)) return;

    try {
      for (const postId of Array.from(selectedPosts)) {
        await deletePost.mutateAsync(postId);
      }
      toast.success(`${selectedPosts.size} post(s) deleted successfully`);
      setPosts(posts.filter(p => !selectedPosts.has(p.id)));
      setSelectedPosts(new Set());
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete posts');
    }
  };

  const togglePostSelection = (postId: bigint) => {
    const newSelection = new Set(selectedPosts);
    if (newSelection.has(postId)) {
      newSelection.delete(postId);
    } else {
      newSelection.add(postId);
    }
    setSelectedPosts(newSelection);
  };

  const selectAllPosts = () => {
    if (selectedPosts.size === posts.length) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(posts.map(p => p.id)));
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Admin Panel
        </h1>
        <p className="text-muted-foreground">Manage users, posts, and platform settings</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="registrations">
            Registrations
            {pendingApprovals.length > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingApprovals.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="posts">
            Posts
            {posts.filter(p => p.reported || p.flagged).length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {posts.filter(p => p.reported || p.flagged).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Registrations</CardTitle>
                <Clock className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-500">{pendingApprovals.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reported Posts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  {posts.filter(p => p.reported).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Flagged Posts</CardTitle>
                <Flag className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">
                  {posts.filter(p => p.flagged).length}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pending Registrations Tab */}
        <TabsContent value="registrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Pending User Registrations
              </CardTitle>
              <CardDescription>
                Review and approve or reject user registration requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {pendingApprovals.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <p className="text-lg font-semibold text-foreground">All caught up!</p>
                      <p className="text-muted-foreground">No pending registrations to review</p>
                    </div>
                  ) : (
                    pendingApprovals.map((approval: UserApprovalInfo) => (
                      <Card key={approval.principal.toString()} className="border-2 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="border-amber-500 text-amber-700">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Pending
                                  </Badge>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">
                                    <strong>Principal ID:</strong>
                                  </p>
                                  <code className="text-xs bg-background/50 p-2 rounded block break-all font-mono">
                                    {approval.principal.toString()}
                                  </code>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleApproveRegistration(approval.principal)}
                                disabled={setApproval.isPending}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                {setApproval.isPending ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                )}
                                Approve
                              </Button>
                              <Button
                                onClick={() => handleRejectRegistration(approval.principal)}
                                disabled={setApproval.isPending}
                                variant="destructive"
                                className="flex-1"
                              >
                                {setApproval.isPending ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <XCircle className="w-4 h-4 mr-2" />
                                )}
                                Reject
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Posts Moderation Tab */}
        <TabsContent value="posts" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Post Moderation
                  </CardTitle>
                  <CardDescription>
                    View, flag, and delete posts. Filter by reported or flagged content.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter posts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Posts</SelectItem>
                      <SelectItem value="reported">Reported Only</SelectItem>
                      <SelectItem value="flagged">Flagged Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedPosts.size > 0 && (
                <div className="mb-4 p-4 bg-primary/10 rounded-lg flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedPosts.size} post(s) selected
                  </span>
                  <Button
                    onClick={handleBulkDelete}
                    variant="destructive"
                    size="sm"
                    disabled={deletePost.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </Button>
                </div>
              )}

              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {posts.length === 0 ? (
                    <div className="text-center py-12">
                      <Eye className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-semibold text-foreground">No posts to moderate</p>
                      <p className="text-muted-foreground">
                        {filterType === 'all' ? 'No posts found' : `No ${filterType} posts found`}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-4">
                        <Checkbox
                          checked={selectedPosts.size === posts.length && posts.length > 0}
                          onCheckedChange={selectAllPosts}
                        />
                        <span className="text-sm text-muted-foreground">Select All</span>
                      </div>
                      {posts.map((post) => (
                        <Card key={post.id.toString()} className={`border-2 ${post.reported ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20' : post.flagged ? 'border-orange-300 bg-orange-50/50 dark:bg-orange-950/20' : ''}`}>
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              <div className="flex items-start gap-4">
                                <Checkbox
                                  checked={selectedPosts.has(post.id)}
                                  onCheckedChange={() => togglePostSelection(post.id)}
                                />
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline">ID: {post.id.toString()}</Badge>
                                    {post.reported && (
                                      <Badge variant="destructive">
                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                        Reported ({post.reportCount.toString()})
                                      </Badge>
                                    )}
                                    {post.flagged && (
                                      <Badge className="bg-orange-500">
                                        <Flag className="w-3 h-3 mr-1" />
                                        Flagged
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-foreground line-clamp-3">{post.content}</p>
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>Author: {post.author.toString().slice(0, 12)}...</span>
                                    <span>Likes: {post.likeCount.toString()}</span>
                                    <span>Comments: {post.commentCount.toString()}</span>
                                    <span>{new Date(Number(post.timestamp) / 1000000).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleFlagPost(post.id, post.flagged)}
                                  variant="outline"
                                  size="sm"
                                  disabled={flagPost.isPending || unflagPost.isPending}
                                >
                                  <Flag className="w-4 h-4 mr-2" />
                                  {post.flagged ? 'Unflag' : 'Flag'}
                                </Button>
                                <Button
                                  onClick={() => handleDeletePost(post.id)}
                                  variant="destructive"
                                  size="sm"
                                  disabled={deletePost.isPending}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
