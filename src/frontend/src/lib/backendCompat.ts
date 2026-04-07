// Compatibility exports for legacy components
// These were previously expected to come from the backend module

export enum ApprovalStatus {
  pending = "pending",
  approved = "approved",
  rejected = "rejected",
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
