// Core types for Chrpz — minimal, no wallet/tipping/paywall

export type UserRole = "admin" | "user";

export interface UserProfile {
  principalId: string;
  username: string;
  bio: string;
  avatarUrl: string;
  role: UserRole;
  createdAt: bigint;
  // Legacy compat fields
  name?: string;
  joinedDate?: bigint;
  followerCount: bigint;
  followingCount: bigint;
  averageRating: number;
  totalRatings: bigint;
  accountId?: string;
  newsletterSubscribed?: boolean;
}

export interface Post {
  id: bigint;
  authorId: string;
  authorName: string;
  content: string;
  imageUrl?: string;
  createdAt: bigint;
  flagged: boolean;
  deleted: boolean;
  // Legacy compat fields used by old components
  author: import("@icp-sdk/core/principal").Principal;
  timestamp: bigint;
  likeCount: bigint;
  commentCount: bigint;
  ratingCount: bigint;
  averageRating: number;
  reported: boolean;
  reportCount: bigint;
  tags: string[];
  categories: string[];
  links: string[];
  fileNames: string[];
  publicVideos: import("../backend").ExternalBlob[];
  media: import("../backend").ExternalBlob[];
}
