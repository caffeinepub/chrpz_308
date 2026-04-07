import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  FileText,
  Flag,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Layout from "../components/Layout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useDeletePost,
  useDeleteUser,
  useGetAllPostsAdmin,
  useGetFlaggedPosts,
  useGetUsers,
  useIsAdmin,
  useUnflagPost,
} from "../hooks/useQueries";
import { formatRelativeTime, truncatePrincipal } from "../lib/utils";
import type { Post, UserProfile } from "../types";

export default function AdminPage() {
  const { identity } = useInternetIdentity();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();

  if (!identity) {
    navigate({ to: "/" });
    return null;
  }

  if (adminLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-16">
          <Skeleton className="h-8 w-48" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="admin-denied"
        >
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Access Denied</p>
          <p className="text-sm mt-1">You don't have admin privileges.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6 flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
      </div>

      <Tabs defaultValue="flagged" data-ocid="admin-tabs">
        <TabsList className="mb-5 w-full">
          <TabsTrigger value="flagged" className="flex-1 gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Flagged
          </TabsTrigger>
          <TabsTrigger value="all-posts" className="flex-1 gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            All Posts
          </TabsTrigger>
          <TabsTrigger value="users" className="flex-1 gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flagged">
          <FlaggedPostsPanel />
        </TabsContent>
        <TabsContent value="all-posts">
          <AllPostsPanel />
        </TabsContent>
        <TabsContent value="users">
          <UsersPanel />
        </TabsContent>
      </Tabs>
    </Layout>
  );
}

function FlaggedPostsPanel() {
  const { data: posts = [], isLoading } = useGetFlaggedPosts();
  const deletePost = useDeletePost();
  const unflagPost = useUnflagPost();

  const handleDelete = async (postId: bigint) => {
    try {
      await deletePost.mutateAsync(postId);
      toast.success("Post deleted.");
    } catch {
      toast.error("Failed to delete post.");
    }
  };

  const handleUnflag = async (postId: bigint) => {
    try {
      await unflagPost.mutateAsync(postId);
      toast.success("Post unflagged.");
    } catch {
      toast.error("Failed to unflag post.");
    }
  };

  if (isLoading) return <PostsLoadingSkeleton />;

  if (posts.length === 0) {
    return (
      <div
        className="text-center py-12 text-muted-foreground"
        data-ocid="flagged-empty"
      >
        <Flag className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="font-medium">No flagged posts</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-ocid="flagged-list">
      {posts.map((post) => (
        <AdminPostRow
          key={String(post.id)}
          post={post}
          onDelete={() => handleDelete(post.id)}
          onUnflag={() => handleUnflag(post.id)}
          showUnflag
        />
      ))}
    </div>
  );
}

function AllPostsPanel() {
  const { data: posts = [], isLoading } = useGetAllPostsAdmin();
  const deletePost = useDeletePost();

  const handleDelete = async (postId: bigint) => {
    try {
      await deletePost.mutateAsync(postId);
      toast.success("Post deleted.");
    } catch {
      toast.error("Failed to delete post.");
    }
  };

  if (isLoading) return <PostsLoadingSkeleton />;

  if (posts.length === 0) {
    return (
      <div
        className="text-center py-12 text-muted-foreground"
        data-ocid="allposts-empty"
      >
        <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="font-medium">No posts yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-ocid="allposts-list">
      {posts.map((post) => (
        <AdminPostRow
          key={String(post.id)}
          post={post}
          onDelete={() => handleDelete(post.id)}
        />
      ))}
    </div>
  );
}

function UsersPanel() {
  const { data: users = [], isLoading } = useGetUsers();
  const deleteUser = useDeleteUser();

  const handleDelete = async (principalId: string) => {
    try {
      await deleteUser.mutateAsync(principalId);
      toast.success("User deleted.");
    } catch {
      toast.error("Failed to delete user.");
    }
  };

  if (isLoading) return <PostsLoadingSkeleton />;

  if (users.length === 0) {
    return (
      <div
        className="text-center py-12 text-muted-foreground"
        data-ocid="users-empty"
      >
        <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="font-medium">No users yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-ocid="users-list">
      {users.map((user) => (
        <UserRow
          key={user.principalId}
          user={user}
          onDelete={() => handleDelete(user.principalId)}
        />
      ))}
    </div>
  );
}

interface AdminPostRowProps {
  post: Post;
  onDelete: () => void;
  onUnflag?: () => void;
  showUnflag?: boolean;
}

function AdminPostRow({
  post,
  onDelete,
  onUnflag,
  showUnflag,
}: AdminPostRowProps) {
  return (
    <div
      className="bg-card border border-border rounded-lg p-4"
      data-ocid="admin-post-row"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono text-muted-foreground truncate">
              {truncatePrincipal(post.authorId)}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(post.createdAt)}
            </span>
            {post.flagged && (
              <Badge variant="destructive" className="text-xs">
                Flagged
              </Badge>
            )}
          </div>
          <p className="text-sm text-foreground line-clamp-2">{post.content}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {showUnflag && onUnflag && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onUnflag}
              data-ocid="admin-unflag"
            >
              <Flag className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            data-ocid="admin-delete-post"
          >
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface UserRowProps {
  user: UserProfile;
  onDelete: () => void;
}

function UserRow({ user, onDelete }: UserRowProps) {
  return (
    <div
      className="bg-card border border-border rounded-lg p-4 flex items-center justify-between gap-3"
      data-ocid="admin-user-row"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-sm shrink-0">
          {(user.username || "U").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {user.username || "Anonymous"}
          </p>
          <p className="text-xs text-muted-foreground font-mono truncate">
            {truncatePrincipal(user.principalId)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {user.role === "admin" && (
          <Badge className="text-xs bg-secondary/10 text-secondary border-secondary/20">
            Admin
          </Badge>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          data-ocid="admin-delete-user"
        >
          <Trash2 className="w-3.5 h-3.5 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

function PostsLoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-card border border-border rounded-lg p-4">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-10 w-full mt-2" />
        </div>
      ))}
    </div>
  );
}
