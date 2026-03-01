export const idlFactory = ({ IDL }) => {
  const Time = IDL.Int;
  const Post = IDL.Record({
    'id' : IDL.Nat,
    'content' : IDL.Text,
    'authorName' : IDL.Opt(IDL.Text),
    'likedBy' : IDL.Vec(IDL.Principal),
    'author' : IDL.Principal,
    'timestamp' : Time,
    'authorProfilePicture' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'isLikedByCurrentUser' : IDL.Bool,
  });
  const Comment = IDL.Record({
    'id' : IDL.Nat,
    'content' : IDL.Text,
    'authorName' : IDL.Opt(IDL.Text),
    'likedBy' : IDL.Vec(IDL.Principal),
    'author' : IDL.Principal,
    'timestamp' : Time,
    'authorProfilePicture' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'isLikedByCurrentUser' : IDL.Bool,
    'postId' : IDL.Nat,
  });
  const Username = IDL.Text;
  const UserProfile = IDL.Record({
    'bio' : IDL.Opt(IDL.Text),
    'username' : Username,
    'displayName' : IDL.Text,
    'followersCount' : IDL.Nat,
    'name' : IDL.Opt(IDL.Text),
    'createdAt' : Time,
    'updatedAt' : Time,
    'followingCount' : IDL.Nat,
    'isFollowedByCurrentUser' : IDL.Bool,
    'postsCount' : IDL.Nat,
  });
  const UserProfileInput = IDL.Record({
    'bio' : IDL.Opt(IDL.Text),
    'username' : Username,
    'name' : IDL.Opt(IDL.Text),
    'profilePictureBlob' : IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  return IDL.Service({
    'checkUsernameAvailability' : IDL.Func([IDL.Text], [IDL.Bool], ['query']),
    'createComment' : IDL.Func([IDL.Nat, IDL.Text], [], []),
    'createPost' : IDL.Func([IDL.Text], [], []),
    'deleteComment' : IDL.Func([IDL.Nat], [], []),
    'deletePost' : IDL.Func([IDL.Nat], [], []),
    'followUser' : IDL.Func([IDL.Principal], [], []),
    'getAllPosts' : IDL.Func([], [IDL.Vec(Post)], ['query']),
    'getFollowersList' : IDL.Func(
        [IDL.Principal],
        [IDL.Vec(IDL.Principal)],
        ['query'],
      ),
    'getFollowingFeed' : IDL.Func([], [IDL.Vec(Post)], ['query']),
    'getFollowingList' : IDL.Func(
        [IDL.Principal],
        [IDL.Vec(IDL.Principal)],
        ['query'],
      ),
    'getPost' : IDL.Func([IDL.Nat], [IDL.Opt(Post)], ['query']),
    'getPostComments' : IDL.Func([IDL.Nat], [IDL.Vec(Comment)], ['query']),
    'getProfilePictureBlob' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(IDL.Vec(IDL.Nat8))],
        ['query'],
      ),
    'getUserByUsername' : IDL.Func(
        [IDL.Text],
        [IDL.Opt(UserProfile)],
        ['query'],
      ),
    'getUserPrincipalByUsername' : IDL.Func(
        [IDL.Text],
        [IDL.Opt(IDL.Principal)],
        ['query'],
      ),
    'getUserProfile' : IDL.Func([], [IDL.Opt(UserProfile)], ['query']),
    'getUserProfileWithStats' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(UserProfile)],
        ['query'],
      ),
    'likeComment' : IDL.Func([IDL.Nat], [], []),
    'likePost' : IDL.Func([IDL.Nat], [], []),
    'needsProfileSetup' : IDL.Func([], [IDL.Bool], ['query']),
    'saveUserProfile' : IDL.Func([UserProfileInput], [], []),
    'unfollowUser' : IDL.Func([IDL.Principal], [], []),
    'unlikeComment' : IDL.Func([IDL.Nat], [], []),
    'unlikePost' : IDL.Func([IDL.Nat], [], []),
  });
};
export const init = ({ IDL }) => { return []; };
