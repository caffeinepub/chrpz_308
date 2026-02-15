// Import all types from the backend interface
import type { 
  Post, 
  UserProfile, 
  Wallet, 
  Tip, 
  PaywallLink, 
  PaywalledVideo,
  PostUpdatePayload,
  UserApprovalInfo,
  ApprovalStatus,
  UserRole
} from './backend';

// Re-export for convenience
export type { 
  Post, 
  UserProfile, 
  Wallet, 
  Tip, 
  PaywallLink, 
  PaywalledVideo,
  PostUpdatePayload,
  UserApprovalInfo,
  ApprovalStatus,
  UserRole
};

// Additional types not in backend
export interface Comment {
  id: bigint;
  postId: bigint;
  author: import('@icp-sdk/core/principal').Principal;
  content: string;
  timestamp: bigint;
}

export interface PostReport {
  id: bigint;
  postId: bigint;
  reporter: import('@icp-sdk/core/principal').Principal;
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
  addedBy: import('@icp-sdk/core/principal').Principal;
  timestamp: bigint;
  verified: boolean;
}

// ImportedToken type for frontend use (backend returns string[])
export interface ImportedToken {
  canisterId: string;
  name: string;
  symbol: string;
  decimals: bigint;
  balance: bigint;
  metadataFetched: boolean;
}
