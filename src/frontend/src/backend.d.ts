import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserPublic {
    bio: string;
    username: string;
    createdAt: bigint;
    avatarUrl: string;
    isAdmin: boolean;
    principalId: string;
}
export interface PostPublic {
    id: bigint;
    deleted: boolean;
    content: string;
    authorId: string;
    createdAt: bigint;
    authorName: string;
    imageUrl?: string;
    flagged: boolean;
}
export interface backendInterface {
    createPost(content: string, imageUrl: string | null): Promise<PostPublic>;
    deletePost(postId: bigint): Promise<void>;
    deleteUser(principalId: string): Promise<void>;
    editPost(postId: bigint, content: string, imageUrl: string | null): Promise<PostPublic>;
    flagPost(postId: bigint): Promise<void>;
    getAllPostsAdmin(): Promise<Array<PostPublic>>;
    getFlaggedPosts(): Promise<Array<PostPublic>>;
    getPost(postId: bigint): Promise<PostPublic | null>;
    getPosts(page: bigint, pageSize: bigint): Promise<Array<PostPublic>>;
    getUserProfile(principalId: string): Promise<UserPublic | null>;
    getUsers(): Promise<Array<UserPublic>>;
    isAdmin(): Promise<boolean>;
    registerOrGetUser(): Promise<UserPublic>;
    unflagPost(postId: bigint): Promise<void>;
    updateProfile(username: string, bio: string, avatarUrl: string): Promise<UserPublic>;
}
