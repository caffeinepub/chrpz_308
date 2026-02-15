import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Comment {
  'id' : bigint,
  'content' : string,
  'authorName' : [] | [string],
  'likedBy' : Array<Principal>,
  'author' : Principal,
  'timestamp' : Time,
  'authorProfilePicture' : [] | [Uint8Array | number[]],
  'isLikedByCurrentUser' : boolean,
  'postId' : bigint,
}
export interface Post {
  'id' : bigint,
  'content' : string,
  'authorName' : [] | [string],
  'likedBy' : Array<Principal>,
  'author' : Principal,
  'timestamp' : Time,
  'authorProfilePicture' : [] | [Uint8Array | number[]],
  'isLikedByCurrentUser' : boolean,
}
export type Time = bigint;
export interface UserProfile {
  'bio' : [] | [string],
  'username' : Username,
  'displayName' : string,
  'followersCount' : bigint,
  'name' : [] | [string],
  'createdAt' : Time,
  'updatedAt' : Time,
  'followingCount' : bigint,
  'isFollowedByCurrentUser' : boolean,
  'postsCount' : bigint,
}
export interface UserProfileInput {
  'bio' : [] | [string],
  'username' : Username,
  'name' : [] | [string],
  'profilePictureBlob' : [] | [Uint8Array | number[]],
}
export type Username = string;
export interface _SERVICE {
  'checkUsernameAvailability' : ActorMethod<[string], boolean>,
  'createComment' : ActorMethod<[bigint, string], undefined>,
  'createPost' : ActorMethod<[string], undefined>,
  'deleteComment' : ActorMethod<[bigint], undefined>,
  'deletePost' : ActorMethod<[bigint], undefined>,
  'followUser' : ActorMethod<[Principal], undefined>,
  'getAllPosts' : ActorMethod<[], Array<Post>>,
  'getFollowersList' : ActorMethod<[Principal], Array<Principal>>,
  'getFollowingFeed' : ActorMethod<[], Array<Post>>,
  'getFollowingList' : ActorMethod<[Principal], Array<Principal>>,
  'getPost' : ActorMethod<[bigint], [] | [Post]>,
  'getPostComments' : ActorMethod<[bigint], Array<Comment>>,
  'getProfilePictureBlob' : ActorMethod<
    [Principal],
    [] | [Uint8Array | number[]]
  >,
  'getUserByUsername' : ActorMethod<[string], [] | [UserProfile]>,
  'getUserPrincipalByUsername' : ActorMethod<[string], [] | [Principal]>,
  'getUserProfile' : ActorMethod<[], [] | [UserProfile]>,
  'getUserProfileWithStats' : ActorMethod<[Principal], [] | [UserProfile]>,
  'likeComment' : ActorMethod<[bigint], undefined>,
  'likePost' : ActorMethod<[bigint], undefined>,
  'needsProfileSetup' : ActorMethod<[], boolean>,
  'saveUserProfile' : ActorMethod<[UserProfileInput], undefined>,
  'unfollowUser' : ActorMethod<[Principal], undefined>,
  'unlikeComment' : ActorMethod<[bigint], undefined>,
  'unlikePost' : ActorMethod<[bigint], undefined>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
