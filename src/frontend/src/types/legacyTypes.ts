import type { Principal } from "@icp-sdk/core/principal";
// Legacy type interfaces used by old components
import type { ExternalBlob } from "../backend";

export interface ExternalBlobLike {
  directURL: string;
  getDirectURL(): string;
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

export interface TipLike {
  sender: Principal;
  recipient: Principal;
  amount: bigint;
  tokenType: string;
  timestamp: bigint;
}
