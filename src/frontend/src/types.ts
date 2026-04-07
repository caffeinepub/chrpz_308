// Re-export all types from types/index.ts
export type { UserProfile, Post, UserRole } from "./types/index";

// Legacy types for backward compatibility with old components
export type { Principal } from "@icp-sdk/core/principal";

export interface Comment {
  id: bigint;
  postId: bigint;
  author: import("@icp-sdk/core/principal").Principal;
  content: string;
  timestamp: bigint;
}

export interface PostReport {
  id: bigint;
  postId: bigint;
  reporter: import("@icp-sdk/core/principal").Principal;
  category: string;
  reason: string;
  timestamp: bigint;
  status: string;
}

export interface TokenRegistryEntry {
  canisterId: string;
  name: string;
  symbol: string;
  decimals: bigint;
  addedBy: import("@icp-sdk/core/principal").Principal;
  timestamp: bigint;
  verified: boolean;
}

export interface ImportedToken {
  canisterId: string;
  name: string;
  symbol: string;
  decimals: bigint;
  balance: bigint;
  metadataFetched: boolean;
}

export interface Wallet {
  owner: import("@icp-sdk/core/principal").Principal;
  balance: bigint;
  accountId: string;
  transactionHistory: Tip[];
}

export interface Tip {
  sender: import("@icp-sdk/core/principal").Principal;
  recipient: import("@icp-sdk/core/principal").Principal;
  amount: bigint;
  tokenType: string;
  transactionHash: string;
  timestamp: bigint;
}

export interface PaywallLink {
  url: string;
  price: bigint;
  description: string;
  isActive: boolean;
}

export interface PaywalledVideo {
  price: bigint;
  description: string;
  isActive: boolean;
}

export interface UserApprovalInfo {
  principal: import("@icp-sdk/core/principal").Principal;
  status: string;
}

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface PostUpdatePayload {
  content?: string;
  imageUrl?: string;
}
