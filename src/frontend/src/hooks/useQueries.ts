import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { Principal } from '@icp-sdk/core/principal';
import type { 
  UserProfile, 
  Wallet, 
  Post, 
  Tip, 
  PaywallLink, 
  PaywalledVideo, 
  PostReport, 
  TokenRegistryEntry,
  Comment,
  UserApprovalInfo,
  ApprovalStatus,
  UserRole,
  PostUpdatePayload
} from '../types';
import { ExternalBlob } from '../backend';

// ============================================================================
// USER REGISTRATION HOOKS (Backend Not Implemented)
// ============================================================================

export function useRegisterUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      bio,
      referrerPrincipal,
      subscribeToNewsletter,
    }: {
      name: string;
      bio: string;
      referrerPrincipal: Principal | null;
      subscribeToNewsletter: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Backend method registerUser not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingRegistrations'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ============================================================================
// USER PROFILE HOOKS
// ============================================================================

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
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

export function useGetUserProfile() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (principal: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.getUserProfile(principal);
    },
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ============================================================================
// WALLET HOOKS
// ============================================================================

export function useEnsureWalletExists() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      await actor.ensureWalletExists();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetCallerWallet() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Wallet | null>({
    queryKey: ['wallet'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getWallet();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetWallet() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (owner: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.getWallet();
    },
  });
}

// ============================================================================
// TOKEN IMPORT HOOKS
// ============================================================================

export function useGetCallerImportedTokens() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['importedTokens'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getImportedTokens();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useAddToken() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (canisterId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addToken(canisterId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['importedTokens'] });
    },
  });
}

export function useRemoveToken() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (canisterId: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.removeToken(canisterId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['importedTokens'] });
    },
  });
}

// Legacy aliases for backward compatibility
export const useImportToken = useAddToken;
export const useRemoveImportedToken = useRemoveToken;

// ============================================================================
// TOKEN REGISTRY HOOKS (Backend Not Implemented)
// ============================================================================

export function useGetTokenRegistry() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<TokenRegistryEntry[]>({
    queryKey: ['tokenRegistry'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Backend method getTokenRegistry not implemented');
    },
    enabled: false, // Disabled until backend implements
  });
}

export function useAddTokenToRegistry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      canisterId,
      name,
      symbol,
      decimals,
    }: {
      canisterId: string;
      name: string;
      symbol: string;
      decimals: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Backend method addTokenToRegistry not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokenRegistry'] });
    },
  });
}

export function useVerifyTokenInRegistry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (canisterId: string) => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Backend method verifyTokenInRegistry not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokenRegistry'] });
    },
  });
}

export function useRemoveTokenFromRegistry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (canisterId: string) => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Backend method removeTokenFromRegistry not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokenRegistry'] });
    },
  });
}

// ============================================================================
// POST HOOKS
// ============================================================================

export function useGetAllPosts() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ['posts'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAllPosts();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetPost() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.getPost(postId);
    },
  });
}

export function useCreatePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      content,
      media,
      links,
      tags,
      categories,
      fileNames,
    }: {
      content: string;
      media: ExternalBlob[];
      links: string[];
      tags: string[];
      categories: string[];
      fileNames: string[];
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createPost(content, media, links, tags, categories, fileNames);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['adminPosts'] });
    },
  });
}

export function useUpdatePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, payload }: { postId: bigint; payload: PostUpdatePayload }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updatePost(postId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['adminPosts'] });
    },
  });
}

export function useDeletePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deletePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['adminPosts'] });
    },
  });
}

// ============================================================================
// TIPPING HOOKS (Backend Not Implemented)
// ============================================================================

export function useTipPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      postId, 
      amount, 
      tokenType 
    }: { 
      postId: bigint; 
      amount: bigint; 
      tokenType: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Backend method tipPost not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['adminPosts'] });
      queryClient.invalidateQueries({ queryKey: ['importedTokens'] });
      queryClient.invalidateQueries({ queryKey: ['userTips'] });
    },
  });
}

export function useGetPostTips() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Backend method getPostTips not implemented');
    },
  });
}

export function useGetUserTips() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Tip[]>({
    queryKey: ['userTips'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Backend method getUserTips not implemented');
    },
    enabled: false, // Disabled until backend implements
  });
}

// ============================================================================
// SOCIAL INTERACTION HOOKS (Backend Not Implemented)
// ============================================================================

export function useLikePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Backend method likePost not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['adminPosts'] });
    },
  });
}

export function useUnlikePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Backend method unlikePost not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['adminPosts'] });
    },
  });
}

export function useRatePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, stars }: { postId: bigint; stars: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Backend method ratePost not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['adminPosts'] });
    },
  });
}

export function useAddComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: bigint; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Backend method addComment not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['adminPosts'] });
    },
  });
}

export function useGetCommentsForPost() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Backend method getCommentsForPost not implemented');
    },
  });
}

export function useDeleteComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Backend method deleteComment not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['adminPosts'] });
    },
  });
}

export function useFollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userToFollow: Principal) => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Backend method followUser not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['isFollowing'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
}

export function useUnfollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userToUnfollow: Principal) => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Backend method unfollowUser not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['isFollowing'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
}

export function useIsFollowing() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (userToCheck: Principal) => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Backend method isFollowing not implemented');
    },
  });
}

// ============================================================================
// PAYWALL HOOKS (Backend Not Implemented)
// ============================================================================

export function useUnlockPaywallContent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      contentType,
      contentIndex,
    }: {
      postId: bigint;
      contentType: string;
      contentIndex: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Backend method unlockPaywallContent not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['paywallAccess'] });
      queryClient.invalidateQueries({ queryKey: ['adminPosts'] });
    },
  });
}

export function useHasPaywallAccess() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({
      postId,
      contentType,
      contentIndex,
    }: {
      postId: bigint;
      contentType: string;
      contentIndex: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Backend method hasPaywallAccess not implemented');
    },
  });
}

// ============================================================================
// ADMIN HOOKS
// ============================================================================

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useListApprovals() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserApprovalInfo[]>({
    queryKey: ['approvals'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listApprovals();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSetApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, status }: { user: Principal; status: ApprovalStatus }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.setApproval(user, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}

export function useGetAdminPosts() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAdminPosts();
    },
  });
}

export function useGetReportedPosts() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getReportedPosts();
    },
  });
}

export function useFlagPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      await actor.flagPost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['adminPosts'] });
    },
  });
}

export function useUnflagPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      await actor.unflagPost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['adminPosts'] });
    },
  });
}

export function useReportPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, category, reason }: { postId: bigint; category: string; reason: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.reportPost(postId, category, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['adminPosts'] });
    },
  });
}

export function useCleanUpReports() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      await actor.cleanUpReports();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['adminPosts'] });
    },
  });
}

// Helper hook for wallet balance (derived from wallet)
export function useGetWalletBalance() {
  const { data: wallet } = useGetCallerWallet();
  return { data: wallet?.balance || BigInt(0) };
}
