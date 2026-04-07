import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ApprovalStatus,
  Post,
  Tip,
  TokenRegistryEntry,
  UserApprovalInfo,
  UserProfile,
  Wallet,
} from "../types";
import { useActor } from "./useActor";

// Helper: safely call actor method if it exists
function actorCall<T>(
  actor: unknown,
  method: string,
  ...args: unknown[]
): Promise<T> {
  const a = actor as Record<string, (...a: unknown[]) => Promise<T>>;
  if (typeof a[method] !== "function") {
    throw new Error(`Backend method ${method} not available`);
  }
  return a[method](...args);
}

// ─── User ───────────────────────────────────────────────────────────────────

export function useRegisterOrGetUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actorCall<UserProfile>(actor, "registerOrGetUser");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
    },
  });
}

export function useGetUserProfile(principalId?: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ["userProfile", principalId],
    queryFn: async () => {
      if (!actor || !principalId) return null;
      return actorCall<UserProfile | null>(
        actor,
        "getUserProfile",
        principalId,
      );
    },
    enabled: !!actor && !actorFetching && !!principalId,
  });
}

// Mutation version used by legacy UserProfilePage component
export function useGetUserProfileMutation() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (principalId: string) => {
      if (!actor) return null;
      try {
        return await actorCall<UserProfile | null>(
          actor,
          "getUserProfile",
          principalId,
        );
      } catch {
        return null;
      }
    },
  });
}

export function useUpdateProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: {
      username: string;
      bio: string;
      avatarUrl: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actorCall<UserProfile>(actor, "updateProfile", profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}

export function useIsAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actorCall<boolean>(actor, "isAdmin");
      } catch {
        return false;
      }
    },
    enabled: !!actor && !actorFetching,
  });
}

// ─── Posts ──────────────────────────────────────────────────────────────────

export function useGetPosts() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ["posts"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actorCall<Post[]>(actor, "getPosts");
      } catch {
        return [];
      }
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useCreatePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { content: string; imageUrl?: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actorCall<Post>(actor, "createPost", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["adminPosts"] });
    },
  });
}

export function useEditPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { id: bigint; content: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actorCall<Post>(actor, "editPost", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["adminPosts"] });
    },
  });
}

export function useDeletePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      await actorCall<void>(actor, "deletePost", postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["adminPosts"] });
      queryClient.invalidateQueries({ queryKey: ["flaggedPosts"] });
    },
  });
}

// ─── Moderation ─────────────────────────────────────────────────────────────

export function useFlagPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      await actorCall<void>(actor, "flagPost", postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["adminPosts"] });
      queryClient.invalidateQueries({ queryKey: ["flaggedPosts"] });
    },
  });
}

export function useUnflagPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      await actorCall<void>(actor, "unflagPost", postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["adminPosts"] });
      queryClient.invalidateQueries({ queryKey: ["flaggedPosts"] });
    },
  });
}

export function useGetFlaggedPosts() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ["flaggedPosts"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actorCall<Post[]>(actor, "getFlaggedPosts");
      } catch {
        return [];
      }
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetAllPostsAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ["adminPosts"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actorCall<Post[]>(actor, "getAllPostsAdmin");
      } catch {
        return [];
      }
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetUsers() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserProfile[]>({
    queryKey: ["users"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actorCall<UserProfile[]>(actor, "getUsers");
      } catch {
        return [];
      }
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useDeleteUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (principalId: string) => {
      if (!actor) throw new Error("Actor not available");
      await actorCall<void>(actor, "deleteUser", principalId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

// ─── Compatibility stubs for legacy components ───────────────────────────────
// These are no-ops that prevent type errors in old components that haven't been removed yet.

const notImplemented = () => {
  throw new Error("Not implemented");
};

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actorCall<UserProfile | null>(actor, "getUserProfile");
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetAllPosts() {
  return useGetPosts();
}
export function useIsCallerAdmin() {
  return useIsAdmin();
}
export function useRegisterUser() {
  return useMutation({
    mutationFn: async (_args: unknown) => notImplemented(),
  });
}
export function useGetCallerWallet() {
  const { actor, isFetching } = useActor();
  return useQuery<Wallet | null>({
    queryKey: ["wallet"],
    queryFn: async () => null,
    enabled: !!actor && !isFetching,
  });
}
export function useEnsureWalletExists() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
    },
  });
}
export function useGetCallerImportedTokens() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["importedTokens"],
    queryFn: async () => [],
    enabled: !!actor && !isFetching,
  });
}
export function useAddToken() {
  return useMutation({ mutationFn: async (_id: string) => notImplemented() });
}
export function useRemoveToken() {
  return useMutation({ mutationFn: async (_id: string) => notImplemented() });
}
export function useLikePost() {
  return useMutation({ mutationFn: async (_id: bigint) => notImplemented() });
}
export function useUnlikePost() {
  return useMutation({ mutationFn: async (_id: bigint) => notImplemented() });
}
export function useRatePost() {
  return useMutation({
    mutationFn: async (_args: { postId: bigint; stars: bigint }) =>
      notImplemented(),
  });
}
export function useAddComment() {
  return useMutation({
    mutationFn: async (_args: { postId: bigint; content: string }) =>
      notImplemented(),
  });
}
export function useGetCommentsForPost() {
  return useMutation({ mutationFn: async (_id: bigint) => notImplemented() });
}
export function useDeleteComment() {
  return useMutation({ mutationFn: async (_id: bigint) => notImplemented() });
}
export function useFollowUser() {
  return useMutation({ mutationFn: async (_p: Principal) => notImplemented() });
}
export function useUnfollowUser() {
  return useMutation({ mutationFn: async (_p: Principal) => notImplemented() });
}
export function useIsFollowing() {
  return useMutation({ mutationFn: async (_p: Principal) => notImplemented() });
}
export function useTipPost() {
  return useMutation({
    mutationFn: async (_args: {
      postId: bigint;
      amount: bigint;
      tokenType: string;
    }) => notImplemented(),
  });
}
export function useUnlockPaywallContent() {
  return useMutation({
    mutationFn: async (_args: {
      postId: bigint;
      contentType: string;
      contentIndex: bigint;
    }) => notImplemented(),
  });
}
export function useHasPaywallAccess() {
  return useMutation({
    mutationFn: async (_args: {
      postId: bigint;
      contentType: string;
      contentIndex: bigint;
    }) => notImplemented(),
  });
}
export function useReportPost() {
  return useMutation({
    mutationFn: async (_args: {
      postId: bigint;
      category: string;
      reason: string;
    }) => notImplemented(),
  });
}
export function useGetAdminPosts() {
  return useMutation({ mutationFn: async () => notImplemented() });
}
export function useGetReportedPosts() {
  return useMutation({ mutationFn: async () => notImplemented() });
}
export function useListApprovals() {
  const { actor, isFetching } = useActor();
  return useQuery<UserApprovalInfo[]>({
    queryKey: ["approvals"],
    queryFn: async () => [],
    enabled: !!actor && !isFetching,
  });
}
export function useSetApproval() {
  return useMutation({
    mutationFn: async (_args: { user: Principal; status: ApprovalStatus }) =>
      notImplemented(),
  });
}
export function useCleanUpReports() {
  return useMutation({ mutationFn: async () => notImplemented() });
}
export function useGetTokenRegistry() {
  const { actor: _actor, isFetching: _isFetching } = useActor();
  return useQuery<TokenRegistryEntry[]>({
    queryKey: ["tokenRegistry"],
    queryFn: async () => [],
    enabled: false,
  });
}
export function useUpdatePost() {
  return useMutation({
    mutationFn: async (_args: { postId: bigint; payload: unknown }) =>
      notImplemented(),
  });
}
export function useGetPost() {
  return useMutation({ mutationFn: async (_id: bigint) => notImplemented() });
}
export function useGetWallet() {
  return useMutation({
    mutationFn: async (_owner: Principal) => notImplemented(),
  });
}
export function useGetWalletBalance() {
  return { data: BigInt(0) };
}
export function useSaveCallerUserProfile() {
  return useMutation({
    mutationFn: async (_profile: UserProfile) => notImplemented(),
  });
}
