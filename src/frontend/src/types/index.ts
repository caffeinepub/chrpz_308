// Frontend-only types until backend implements them
import { Principal } from '@icp-sdk/core/principal';
import { ExternalBlob } from '../backend';

export interface UserProfile {
  name: string;
  bio: string;
  profilePicture: ExternalBlob | null;
  joinedDate: bigint;
  followerCount: bigint;
  followingCount: bigint;
  averageRating: number;
  totalRatings: bigint;
  accountId: string;
  principalId: string;
  newsletterSubscribed: boolean;
}

export interface Wallet {
  owner: Principal;
  balance: bigint;
  transactionHistory: Tip[];
  accountId: string;
}

export interface Tip {
  sender: Principal;
  recipient: Principal;
  amount: bigint;
  tokenType: string;
  transactionHash: string;
  timestamp: bigint;
}

export interface Post {
  id: bigint;
  author: Principal;
  content: string;
  timestamp: bigint;
  media: ExternalBlob[];
  links: string[];
  tags: string[];
  categories: string[];
  tips: Tip[];
  fileNames: string[];
  likeCount: bigint;
  averageRating: number;
  ratingCount: bigint;
  commentCount: bigint;
  paywallLinks: PaywallLink[];
  publicVideos: ExternalBlob[];
  paywalledVideos: PaywalledVideo[];
  reported: boolean;
  reportCount: bigint;
  flagged: boolean;
}

export interface Comment {
  id: bigint;
  postId: bigint;
  author: Principal;
  content: string;
  timestamp: bigint;
}

export interface PaywallLink {
  url: string;
  price: bigint;
  description: string;
  isActive: boolean;
}

export interface PaywalledVideo {
  blob: ExternalBlob;
  price: bigint;
  description: string;
  isActive: boolean;
}

export interface ImportedToken {
  canisterId: string;
  name: string;
  symbol: string;
  decimals: bigint;
  balance: bigint;
  metadataFetched: boolean;
}

export interface PostReport {
  id: bigint;
  postId: bigint;
  reporter: Principal;
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
  addedBy: Principal;
  timestamp: bigint;
  verified: boolean;
}
