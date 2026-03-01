import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface PaywallLink {
    url: string;
    description: string;
    isActive: boolean;
    price: bigint;
}
export interface http_header {
    value: string;
    name: string;
}
export interface Tip {
    transactionHash: string;
    recipient: Principal;
    sender: Principal;
    timestamp: Time;
    tokenType: string;
    amount: bigint;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export interface Wallet {
    balance: bigint;
    accountId: string;
    owner: Principal;
    transactionHistory: Array<Tip>;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface Post {
    id: bigint;
    categories: Array<string>;
    media: Array<ExternalBlob>;
    likeCount: bigint;
    content: string;
    reportCount: bigint;
    ratingCount: bigint;
    tags: Array<string>;
    tips: Array<Tip>;
    paywalledVideos: Array<PaywalledVideo>;
    author: Principal;
    links: Array<string>;
    averageRating: number;
    fileNames: Array<string>;
    timestamp: Time;
    commentCount: bigint;
    reported: boolean;
    flagged: boolean;
    publicVideos: Array<ExternalBlob>;
    paywallLinks: Array<PaywallLink>;
}
export interface PaywalledVideo {
    blob: ExternalBlob;
    description: string;
    isActive: boolean;
    price: bigint;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface PostUpdatePayload {
    categories?: Array<string>;
    removeMedia?: Array<ExternalBlob>;
    updatePaywalledVideos?: Array<{
        paywalledVideos: Array<PaywalledVideo>;
        description?: string;
        isActive?: boolean;
        price?: bigint;
    }>;
    content?: string;
    removePublicVideos?: Array<ExternalBlob>;
    reportReason?: string;
    removePaywallLinks?: Array<string>;
    removePaywalledVideos?: Array<ExternalBlob>;
    tags?: Array<string>;
    addPublicVideos?: Array<ExternalBlob>;
    updatePaywallLinks?: Array<{
        description?: string;
        isActive?: boolean;
        price?: bigint;
        paywallLinks: Array<PaywallLink>;
    }>;
    removeLinks?: Array<string>;
    addPaywallLinks?: Array<PaywallLink>;
    addMedia?: Array<ExternalBlob>;
    reportCategory?: string;
    addFileNames?: Array<string>;
    flagPost?: boolean;
    addPaywalledVideos?: Array<PaywalledVideo>;
    removeFileNames?: Array<string>;
    addLinks?: Array<string>;
}
export interface UserProfile {
    bio: string;
    totalRatings: bigint;
    newsletterSubscribed: boolean;
    accountId: string;
    name: string;
    averageRating: number;
    joinedDate: Time;
    followerCount: bigint;
    followingCount: bigint;
    profilePicture?: ExternalBlob;
    principalId: string;
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addToken(canisterId: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    cleanUpReports(): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createPost(content: string, media: Array<ExternalBlob>, links: Array<string>, tags: Array<string>, categories: Array<string>, fileNames: Array<string>): Promise<Post>;
    deletePost(postId: bigint): Promise<void>;
    ensureWalletExists(): Promise<void>;
    flagPost(postId: bigint): Promise<void>;
    getAccountId(): Promise<string>;
    getAdminPosts(): Promise<Array<Post>>;
    getAllPosts(): Promise<Array<Post>>;
    getBlob(blob: ExternalBlob): Promise<Uint8Array | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getImportedTokens(): Promise<Array<string>>;
    getPost(postId: bigint): Promise<Post>;
    getPostById(postId: bigint): Promise<Post>;
    getPostsByAuthor(author: Principal): Promise<Array<Post>>;
    getPostsByCategory(category: string): Promise<Array<Post>>;
    getPostsByMediaType(mediaType: string): Promise<Array<Post>>;
    getPostsByPaywallStatus(hasPaywall: boolean): Promise<Array<Post>>;
    getPostsByTags(tags: Array<string>): Promise<Array<Post>>;
    getReportedPosts(): Promise<Array<Post>>;
    getSortedReportedPosts(): Promise<Array<Post>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWallet(): Promise<Wallet>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    removeToken(canisterId: string): Promise<void>;
    reportPost(postId: bigint, category: string, reason: string): Promise<void>;
    requestApproval(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchPosts(searchTerm: string, includeFlagged: boolean, includeReported: boolean): Promise<Array<Post>>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    unflagPost(postId: bigint): Promise<void>;
    updatePost(postId: bigint, payload: PostUpdatePayload): Promise<Post>;
    uploadBlob(data: Uint8Array): Promise<ExternalBlob>;
    uploadBlobWithName(data: Uint8Array, fileName: string): Promise<ExternalBlob>;
}
