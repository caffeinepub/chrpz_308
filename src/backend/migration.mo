// migration.mo — drops all old state, preserves only nextPostId to avoid ID collisions
// OldActor types are derived from .old/src/backend/dist/backend.most
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

module {
  // ── Old internal Tree type from mo:base/OrderedMap ──────────────────────
  type Tree<K, V> = {
    #black : (Tree<K, V>, K, V, Tree<K, V>);
    #leaf;
    #red : (Tree<K, V>, K, V, Tree<K, V>);
  };

  type OldMap<K, V> = { root : Tree<K, V>; size : Nat };

  // ── Old record types ─────────────────────────────────────────────────────
  type ExternalBlob = Blob;

  type Tip = {
    amount : Nat;
    recipient : Principal;
    sender : Principal;
    timestamp : Int;
    tokenType : Text;
    transactionHash : Text;
  };

  type PaywallLink = {
    description : Text;
    isActive : Bool;
    price : Nat;
    url : Text;
  };

  type PaywalledVideo = {
    blob : ExternalBlob;
    description : Text;
    isActive : Bool;
    price : Nat;
  };

  type OldPost = {
    author : Principal;
    averageRating : Float;
    categories : [Text];
    commentCount : Nat;
    content : Text;
    fileNames : [Text];
    flagged : Bool;
    id : Nat;
    likeCount : Nat;
    links : [Text];
    media : [ExternalBlob];
    paywallLinks : [PaywallLink];
    paywalledVideos : [PaywalledVideo];
    publicVideos : [ExternalBlob];
    ratingCount : Nat;
    reportCount : Nat;
    reported : Bool;
    tags : [Text];
    timestamp : Int;
    tips : [Tip];
  };

  type OldUserProfile = {
    accountId : Text;
    averageRating : Float;
    bio : Text;
    followerCount : Nat;
    followingCount : Nat;
    joinedDate : Int;
    name : Text;
    newsletterSubscribed : Bool;
    principalId : Text;
    profilePicture : ?ExternalBlob;
    totalRatings : Nat;
  };

  type OldUserRole = { #admin; #guest; #user };

  type OldAccessControlState = {
    var adminAssigned : Bool;
    var userRoles : OldMap<Principal, OldUserRole>;
  };

  type ApprovalStatus = { #approved; #pending; #rejected };

  type OldApprovalState = {
    var approvalStatus : OldMap<Principal, ApprovalStatus>;
  };

  type PostReport = {
    category : Text;
    id : Nat;
    postId : Nat;
    reason : Text;
    reporter : Principal;
    status : Text;
    timestamp : Int;
  };

  type Activity = {
    action : Text;
    contentPreview : Text;
    id : Nat;
    targetId : Nat;
    timestamp : Int;
    user : Principal;
  };

  type Comment = {
    author : Principal;
    content : Text;
    id : Nat;
    postId : Nat;
    timestamp : Int;
  };

  type EmailAccount = {
    createdAt : Int;
    email : Text;
    nonce : Text;
    passwordHash : Text;
    principal : Principal;
  };

  type EmailVerification = { email : Text; timestamp : Int; verificationCode : Text };

  type Follow = { follower : Principal; following : Principal; timestamp : Int };

  type ImportedToken = {
    balance : Nat;
    canisterId : Text;
    decimals : Nat;
    metadataFetched : Bool;
    name : Text;
    symbol : Text;
  };

  type Like = { postId : Nat; timestamp : Int; user : Principal };

  type Newsletter = {
    content : Text;
    id : Nat;
    sentCount : Nat;
    subject : Text;
    timestamp : Int;
  };

  type PaywallAccess = {
    amountPaid : Nat;
    contentIndex : Nat;
    contentType : Text;
    postId : Nat;
    timestamp : Int;
    user : Principal;
  };

  type Rating = { postId : Nat; stars : Nat; timestamp : Int; user : Principal };

  type Referral = {
    referredUser : Principal;
    referrer : Principal;
    rewardVideoCount : Nat;
    timestamp : Int;
  };

  type StripeConfiguration = { allowedCountries : [Text]; secretKey : Text };

  type TokenCanister = { canisterId : Text; lastChecked : Int };

  type TokenRegistryEntry = {
    addedBy : Principal;
    canisterId : Text;
    decimals : Nat;
    name : Text;
    symbol : Text;
    timestamp : Int;
    verified : Bool;
  };

  type Wallet = {
    accountId : Text;
    balance : Nat;
    owner : Principal;
    transactionHistory : [Tip];
  };

  type VerifiedEmail = { principal : Principal; timestamp : Int };

  type OldStorage = {
    var authorizedPrincipals : [Principal];
    var blobTodeletete : [Blob];
  };

  // ── New types ────────────────────────────────────────────────────────────
  type Role = { #admin; #user };

  type User = {
    principalId : Principal;
    var username : Text;
    var bio : Text;
    var avatarUrl : Text;
    role : Role;
    createdAt : Time.Time;
  };

  type Post = {
    id : Nat;
    authorId : Principal;
    var authorName : Text;
    var content : Text;
    var imageUrl : ?Text;
    createdAt : Time.Time;
    var flagged : Bool;
    var deleted : Bool;
  };

  // ── OldActor — must exactly match .most file ──────────────────────────────
  public type OldActor = {
    var accessControlState : OldAccessControlState;
    var activities : OldMap<Nat, Activity>;
    var adminMessages : OldMap<Nat, Text>;
    var adminWalletPrincipal : ?Principal;
    var approvalState : OldApprovalState;
    var blobFileNames : OldMap<Text, Text>;
    var blobOwnership : OldMap<Text, Principal>;
    var comments : OldMap<Nat, Comment>;
    var emailAccounts : OldMap<Text, EmailAccount>;
    var emailVerifications : OldMap<Text, EmailVerification>;
    var follows : OldMap<Nat, Follow>;
    var importedTokensByUser : OldMap<Principal, [ImportedToken]>;
    var likes : OldMap<Nat, Like>;
    var newsletters : OldMap<Nat, Newsletter>;
    var nextActivityId : Nat;
    var nextAdminMessageId : Nat;
    var nextCommentId : Nat;
    var nextFollowId : Nat;
    var nextLikeId : Nat;
    var nextNewsletterId : Nat;
    var nextNotificationId : Nat;
    var nextPaywallAccessId : Nat;
    var nextPostId : Nat;
    var nextPostReportId : Nat;
    var nextRatingId : Nat;
    var nextReferralId : Nat;
    var notifications : OldMap<Nat, Text>;
    var paywallAccesses : OldMap<Nat, PaywallAccess>;
    var pendingRegistrations : OldMap<Principal, (Text, Text, ?Principal, Bool, Int)>;
    var postReports : OldMap<Nat, PostReport>;
    var posts : OldMap<Nat, OldPost>;
    var ratings : OldMap<Nat, Rating>;
    var referrals : OldMap<Nat, Referral>;
    storage : OldStorage;
    var stripeConfiguration : ?StripeConfiguration;
    var tokenCanisters : OldMap<Principal, [TokenCanister]>;
    var tokenRegistry : OldMap<Text, TokenRegistryEntry>;
    var userProfiles : OldMap<Principal, OldUserProfile>;
    var verifiedEmails : OldMap<Text, VerifiedEmail>;
    var wallets : OldMap<Principal, Wallet>;
  };

  // ── NewActor — new lean state ─────────────────────────────────────────────
  public type NewActor = {
    users : Map.Map<Principal, User>;
    posts : Map.Map<Nat, Post>;
    var nextPostId : Nat;
  };

  // ── Migration: drop everything, preserve nextPostId ────────────────────
  public func run(old : OldActor) : NewActor {
    {
      users = Map.empty<Principal, User>();
      posts = Map.empty<Nat, Post>();
      var nextPostId = old.nextPostId;
    };
  };
};
