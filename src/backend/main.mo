import Map "mo:base/OrderedMap";
import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Nat "mo:base/Nat";
import Time "mo:base/Time";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Order "mo:base/Order";
import Text "mo:base/Text";
import Option "mo:base/Option";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import Float "mo:base/Float";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";
import UserApproval "user-approval/approval";

actor {
    let storage = Storage.new();
    include MixinStorage(storage);

    var accessControlState = AccessControl.initState();
    var approvalState = UserApproval.initState(accessControlState);

    type Post = {
        id : Nat;
        author : Principal;
        content : Text;
        timestamp : Time.Time;
        media : [Storage.ExternalBlob];
        links : [Text];
        tags : [Text];
        categories : [Text];
        tips : [Tip];
        fileNames : [Text];
        likeCount : Nat;
        averageRating : Float;
        ratingCount : Nat;
        commentCount : Nat;
        paywallLinks : [PaywallLink];
        publicVideos : [Storage.ExternalBlob];
        paywalledVideos : [PaywalledVideo];
        reported : Bool;
        reportCount : Nat;
        flagged : Bool;
    };

    type PostReport = {
        id : Nat;
        postId : Nat;
        reporter : Principal;
        category : Text;
        reason : Text;
        timestamp : Time.Time;
        status : Text;
    };

    type Tip = {
        sender : Principal;
        recipient : Principal;
        amount : Nat;
        tokenType : Text;
        transactionHash : Text;
        timestamp : Time.Time;
    };

    type Wallet = {
        owner : Principal;
        balance : Nat;
        transactionHistory : [Tip];
        accountId : Text;
    };

    type UserProfile = {
        name : Text;
        bio : Text;
        profilePicture : ?Storage.ExternalBlob;
        joinedDate : Time.Time;
        followerCount : Nat;
        followingCount : Nat;
        averageRating : Float;
        totalRatings : Nat;
        accountId : Text;
        principalId : Text;
        newsletterSubscribed : Bool;
    };

    type ImportedToken = {
        canisterId : Text;
        name : Text;
        symbol : Text;
        decimals : Nat;
        balance : Nat;
        metadataFetched : Bool;
    };

    type Comment = {
        id : Nat;
        postId : Nat;
        author : Principal;
        content : Text;
        timestamp : Time.Time;
    };

    type Like = {
        user : Principal;
        postId : Nat;
        timestamp : Time.Time;
    };

    type Rating = {
        user : Principal;
        postId : Nat;
        stars : Nat;
        timestamp : Time.Time;
    };

    type Follow = {
        follower : Principal;
        following : Principal;
        timestamp : Time.Time;
    };

    type Activity = {
        id : Nat;
        user : Principal;
        action : Text;
        targetId : Nat;
        timestamp : Time.Time;
        contentPreview : Text;
    };

    type PaywallLink = {
        url : Text;
        price : Nat;
        description : Text;
        isActive : Bool;
    };

    type PaywalledVideo = {
        blob : Storage.ExternalBlob;
        price : Nat;
        description : Text;
        isActive : Bool;
    };

    type PaywallAccess = {
        user : Principal;
        postId : Nat;
        contentType : Text;
        contentIndex : Nat;
        timestamp : Time.Time;
        amountPaid : Nat;
    };

    type Referral = {
        referrer : Principal;
        referredUser : Principal;
        timestamp : Time.Time;
        rewardVideoCount : Nat;
    };

    type Newsletter = {
        id : Nat;
        subject : Text;
        content : Text;
        timestamp : Time.Time;
        sentCount : Nat;
    };

    type EmailAccount = {
        email : Text;
        passwordHash : Text;
        principal : Principal;
        createdAt : Time.Time;
        nonce : Text;
    };

    type VerifiedEmail = {
        principal : Principal;
        timestamp : Time.Time;
    };

    type EmailVerification = {
        email : Text;
        verificationCode : Text;
        timestamp : Time.Time;
    };

    type TokenRegistryEntry = {
        canisterId : Text;
        name : Text;
        symbol : Text;
        decimals : Nat;
        addedBy : Principal;
        timestamp : Time.Time;
        verified : Bool;
    };

    type PostUpdatePayload = {
        content : ?Text;
        tags : ?[Text];
        categories : ?[Text];
        addMedia : ?[Storage.ExternalBlob];
        removeMedia : ?[Storage.ExternalBlob];
        addLinks : ?[Text];
        removeLinks : ?[Text];
        addFileNames : ?[Text];
        removeFileNames : ?[Text];
        addPaywallLinks : ?[PaywallLink];
        updatePaywallLinks : ?[{
            paywallLinks : [PaywallLink];
            price : ?Nat;
            isActive : ?Bool;
            description : ?Text;
        }];
        removePaywallLinks : ?[Text];
        addPublicVideos : ?[Storage.ExternalBlob];
        removePublicVideos : ?[Storage.ExternalBlob];
        addPaywalledVideos : ?[PaywalledVideo];
        updatePaywalledVideos : ?[{
            paywalledVideos : [PaywalledVideo];
            price : ?Nat;
            isActive : ?Bool;
            description : ?Text;
        }];
        removePaywalledVideos : ?[Storage.ExternalBlob];
        flagPost : ?Bool;
        reportCategory : ?Text;
        reportReason : ?Text;
    };

    type TokenMetadata = {
        name : Text;
        symbol : Text;
        decimals : Nat;
    };

    transient let postsMap = Map.Make<Nat>(Nat.compare);
    var posts : Map.Map<Nat, Post> = postsMap.empty<Post>();
    var nextPostId : Nat = 0;

    transient let postReportsMap = Map.Make<Nat>(Nat.compare);
    var postReports : Map.Map<Nat, PostReport> = postReportsMap.empty<PostReport>();
    var nextPostReportId : Nat = 0;

    transient let walletsMap = Map.Make<Principal>(Principal.compare);
    var wallets : Map.Map<Principal, Wallet> = walletsMap.empty<Wallet>();

    transient let profilesMap = Map.Make<Principal>(Principal.compare);
    var userProfiles : Map.Map<Principal, UserProfile> = profilesMap.empty<UserProfile>();

    transient let importedTokensMap = Map.Make<Principal>(Principal.compare);
    var importedTokensByUser : Map.Map<Principal, [ImportedToken]> = importedTokensMap.empty<[ImportedToken]>();

    transient let tokenRegistryMap = Map.Make<Text>(Text.compare);
    var tokenRegistry : Map.Map<Text, TokenRegistryEntry> = tokenRegistryMap.empty<TokenRegistryEntry>();

    transient let blobOwnershipMap = Map.Make<Text>(Text.compare);
    var blobOwnership : Map.Map<Text, Principal> = blobOwnershipMap.empty<Principal>();

    transient let blobFileNamesMap = Map.Make<Text>(Text.compare);
    var blobFileNames : Map.Map<Text, Text> = blobFileNamesMap.empty<Text>();

    transient let commentsMap = Map.Make<Nat>(Nat.compare);
    var comments : Map.Map<Nat, Comment> = commentsMap.empty<Comment>();
    var nextCommentId : Nat = 0;

    transient let likesMap = Map.Make<Nat>(Nat.compare);
    var likes : Map.Map<Nat, Like> = likesMap.empty<Like>();
    var nextLikeId : Nat = 0;

    transient let ratingsMap = Map.Make<Nat>(Nat.compare);
    var ratings : Map.Map<Nat, Rating> = ratingsMap.empty<Rating>();
    var nextRatingId : Nat = 0;

    transient let followsMap = Map.Make<Nat>(Nat.compare);
    var follows : Map.Map<Nat, Follow> = followsMap.empty<Follow>();
    var nextFollowId : Nat = 0;

    transient let activityMap = Map.Make<Nat>(Nat.compare);
    var activities : Map.Map<Nat, Activity> = activityMap.empty<Activity>();
    var nextActivityId : Nat = 0;

    transient let paywallAccessMap = Map.Make<Nat>(Nat.compare);
    var paywallAccesses : Map.Map<Nat, PaywallAccess> = paywallAccessMap.empty<PaywallAccess>();
    var nextPaywallAccessId : Nat = 0;

    transient let referralsMap = Map.Make<Nat>(Nat.compare);
    var referrals : Map.Map<Nat, Referral> = referralsMap.empty<Referral>();
    var nextReferralId : Nat = 0;

    transient let newsletterMap = Map.Make<Nat>(Nat.compare);
    var newsletters : Map.Map<Nat, Newsletter> = newsletterMap.empty<Newsletter>();
    var nextNewsletterId : Nat = 0;

    transient let emailAccountsMap = Map.Make<Text>(Text.compare);
    var emailAccounts : Map.Map<Text, EmailAccount> = emailAccountsMap.empty<EmailAccount>();

    var stripeConfiguration : ?Stripe.StripeConfiguration = null;
    var adminWalletPrincipal : ?Principal = null;

    transient let pendingRegistrationsMap = Map.Make<Principal>(Principal.compare);
    var pendingRegistrations : Map.Map<Principal, (Text, Text, ?Principal, Bool, Time.Time)> = pendingRegistrationsMap.empty<(Text, Text, ?Principal, Bool, Time.Time)>();

    transient let verifiedEmailsMap = Map.Make<Text>(Text.compare);
    var verifiedEmails : Map.Map<Text, VerifiedEmail> = verifiedEmailsMap.empty<VerifiedEmail>();

    transient let emailVerificationsMap = Map.Make<Text>(Text.compare);
    var emailVerifications : Map.Map<Text, EmailVerification> = emailVerificationsMap.empty<EmailVerification>();

    transient let notificationsMap = Map.Make<Nat>(Nat.compare);
    var notifications : Map.Map<Nat, Text> = notificationsMap.empty<Text>();
    var nextNotificationId : Nat = 0;

    transient let adminMessagesMap = Map.Make<Nat>(Nat.compare);
    var adminMessages : Map.Map<Nat, Text> = adminMessagesMap.empty<Text>();
    var nextAdminMessageId : Nat = 0;

    // TokenCanister type for tracking imported tokens
    type TokenCanister = {
        canisterId : Text;
        lastChecked : Time.Time;
    };

    // TokenCanisters map for tracking imported tokens by user
    transient let tokenCanistersMap = Map.Make<Principal>(Principal.compare);
    var tokenCanisters : Map.Map<Principal, [TokenCanister]> = tokenCanistersMap.empty<[TokenCanister]>();

    func addVerifiedEmail(email : Text, principal : Principal) : () {
        verifiedEmails := verifiedEmailsMap.put(verifiedEmails, email, {
            principal;
            timestamp = Time.now();
        });
    };

    // Stripe integration - Admin only
    public query func isStripeConfigured() : async Bool {
        stripeConfiguration != null;
    };

    public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can perform this action");
        };
        stripeConfiguration := ?config;
    };

    func getStripeConfiguration() : Stripe.StripeConfiguration {
        switch (stripeConfiguration) {
            case (null) { Debug.trap("Stripe needs to be first configured") };
            case (?value) { value };
        };
    };

    public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
        await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
    };

    public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can create checkout sessions");
        };

        await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
    };

    public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
        OutCall.transform(input);
    };

    func verifyBlobOwnership(caller : Principal, blob : Storage.ExternalBlob) : Bool {
        let blobKey = debug_show(blob);
        switch (blobOwnershipMap.get(blobOwnership, blobKey)) {
            case (?owner) owner == caller;
            case (null) false;
        };
    };

    func trackBlobOwnership(owner : Principal, blob : Storage.ExternalBlob, fileName : Text) : () {
        let blobKey = debug_show(blob);
        blobOwnership := blobOwnershipMap.put(blobOwnership, blobKey, owner);
        blobFileNames := blobFileNamesMap.put(blobFileNames, blobKey, fileName);
    };

    func getAdminWallet() : Principal {
        switch (adminWalletPrincipal) {
            case (?admin) admin;
            case (null) Debug.trap("Admin wallet not configured");
        };
    };

    func ensureAdminWalletConfigured() : () {
        switch (adminWalletPrincipal) {
            case (null) Debug.trap("Admin wallet not configured. Please initialize access control first.");
            case (?admin) {
                switch (walletsMap.get(wallets, admin)) {
                    case (null) Debug.trap("Admin wallet not found. Please ensure admin has registered.");
                    case (?_) {};
                };
            };
        };
    };

    func hasUserProfile(principal : Principal) : Bool {
        profilesMap.get(userProfiles, principal) != null;
    };

    func verifyUserPermissionAsAuthor(caller : Principal, author : Principal) : () {
        if (caller != author) {
            if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
                Debug.trap("You do not have permission to update posts that you do not own");
            };
        };
    };

    func verifyUserProfileOwnership(caller : Principal, profilePrincipal : Principal) : () {
        if (caller != profilePrincipal) {
            if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
                Debug.trap("You do not have permission to update profiles owned by someone else");
            };
        };
    };

    func shouldFilterPost(post : Post, caller : Principal) : Bool {
        // Admins can see all posts
        if (AccessControl.isAdmin(accessControlState, caller)) {
            return false;
        };

        // Authors can see their own posts even if flagged/reported
        if (post.author == caller) {
            return false;
        };

        // Filter out flagged posts for non-admins and non-authors
        if (post.flagged) {
            return true;
        };

        // Filter out reported posts for non-admins and non-authors
        if (post.reported) {
            return true;
        };

        false;
    };

    func canAccessBlob(caller : Principal, blob : Storage.ExternalBlob) : Bool {
        // Admins can access all blobs
        if (AccessControl.isAdmin(accessControlState, caller)) {
            return true;
        };

        let blobKey = debug_show(blob);

        // Owner can access their own blobs
        switch (blobOwnershipMap.get(blobOwnership, blobKey)) {
            case (?owner) {
                if (owner == caller) {
                    return true;
                };
            };
            case (null) {};
        };

        // Check if blob is in a public post (not paywalled)
        for (post in postsMap.vals(posts)) {
            // Skip filtered posts
            if (not shouldFilterPost(post, caller)) {
                // Check public media
                for (mediaBlob in post.media.vals()) {
                    if (debug_show(mediaBlob) == blobKey) {
                        return true;
                    };
                };

                // Check public videos
                for (videoBlob in post.publicVideos.vals()) {
                    if (debug_show(videoBlob) == blobKey) {
                        return true;
                    };
                };

                // Check paywalled videos - require payment
                for (i in Iter.range(0, post.paywalledVideos.size() - 1)) {
                    if (debug_show(post.paywalledVideos[i].blob) == blobKey) {
                        // Check if user has paid for access
                        for (access in paywallAccessMap.vals(paywallAccesses)) {
                            if (access.user == caller and access.postId == post.id and access.contentType == "video" and access.contentIndex == i) {
                                return true;
                            };
                        };
                        return false;
                    };
                };
            };
        };

        // Check profile pictures for all users - profile pictures are public
        for ((_, profile) in profilesMap.entries(userProfiles)) {
            switch (profile.profilePicture) {
                case (?picBlob) {
                    if (debug_show(picBlob) == blobKey) {
                        return true;
                    };
                };
                case (null) {};
            };
        };

        false;
    };

    // Override blob query functions to add authorization.
    public shared query ({ caller }) func getBlob(blob : Storage.ExternalBlob) : async ?Blob {
        if (not canAccessBlob(caller, blob)) {
            Debug.trap("Unauthorized: You do not have permission to access this blob");
        };

        // Note: This should call the parent implementation, but since we can't directly
        // call the mixed-in function, we need to ensure the mixin handles authorization
        // or we need to implement the blob retrieval here
        null; // Placeholder - actual implementation would retrieve the blob
    };

    // Override blob upload functions to add authorization - User only
    public shared ({ caller }) func uploadBlob(data : Blob) : async Storage.ExternalBlob {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can upload blobs");
        };
        let blob = await uploadBlob(data);
        trackBlobOwnership(caller, blob, "");
        blob;
    };

    public shared ({ caller }) func uploadBlobWithName(data : Blob, fileName : Text) : async Storage.ExternalBlob {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can upload blobs");
        };
        let blob = await uploadBlob(data);
        trackBlobOwnership(caller, blob, fileName);
        blob;
    };

    // Ensure wallet exists for registered users - User only
    public shared ({ caller }) func ensureWalletExists() : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only registered users can have wallets");
        };

        switch (profilesMap.get(userProfiles, caller)) {
            case (null) { Debug.trap("Profile not found. Please register first.") };
            case (?profile) {
                switch (walletsMap.get(wallets, caller)) {
                    case (?_) { return };
                    case (null) {
                        let accountId = Principal.toText(caller);

                        let newWallet : Wallet = {
                            owner = caller;
                            balance = 0;
                            transactionHistory = [];
                            accountId;
                        };
                        wallets := walletsMap.put(wallets, caller, newWallet);

                        let updatedProfile = {
                            profile with
                            accountId;
                        };
                        userProfiles := profilesMap.put(userProfiles, caller, updatedProfile);
                    };
                };
            };
        };
    };

    // Post management functions

    // Create post - User only
    public shared ({ caller }) func createPost(content : Text, media : [Storage.ExternalBlob], links : [Text], tags : [Text], categories : [Text], fileNames : [Text]) : async Post {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can create posts");
        };

        if (not hasUserProfile(caller)) {
            Debug.trap("You must have a profile to create a post");
        };

        // Verify ownership of all media blobs
        for (blob in media.vals()) {
            if (not verifyBlobOwnership(caller, blob)) {
                Debug.trap("Unauthorized: You do not own one or more of the media blobs");
            };
        };

        let postId = nextPostId;
        nextPostId += 1;

        let newPost : Post = {
            id = postId;
            author = caller;
            content;
            timestamp = Time.now();
            media;
            links;
            tags;
            categories;
            tips = [];
            fileNames;
            likeCount = 0;
            averageRating = 0.0;
            ratingCount = 0;
            commentCount = 0;
            paywallLinks = [];
            publicVideos = [];
            paywalledVideos = [];
            reported = false;
            reportCount = 0;
            flagged = false;
        };

        posts := postsMap.put(posts, postId, newPost);

        newPost;
    };

    // Update post with granular changes - Author or Admin only
    public shared ({ caller }) func updatePost(postId : Nat, payload : PostUpdatePayload) : async Post {
        switch (postsMap.get(posts, postId)) {
            case (null) { Debug.trap("Post not found") };
            case (?post) {
                verifyUserPermissionAsAuthor(caller, post.author);

                // Verify ownership of any new media blobs being added
                switch (payload.addMedia) {
                    case (?newMedia) {
                        for (blob in newMedia.vals()) {
                            if (not verifyBlobOwnership(caller, blob)) {
                                Debug.trap("Unauthorized: You do not own one or more of the new media blobs");
                            };
                        };
                    };
                    case (null) {};
                };

                // Verify ownership of any new public videos being added
                switch (payload.addPublicVideos) {
                    case (?newVideos) {
                        for (blob in newVideos.vals()) {
                            if (not verifyBlobOwnership(caller, blob)) {
                                Debug.trap("Unauthorized: You do not own one or more of the new video blobs");
                            };
                        };
                    };
                    case (null) {};
                };

                // Verify ownership of any new paywalled videos being added
                switch (payload.addPaywalledVideos) {
                    case (?newPaywalledVideos) {
                        for (paywalledVideo in newPaywalledVideos.vals()) {
                            if (not verifyBlobOwnership(caller, paywalledVideo.blob)) {
                                Debug.trap("Unauthorized: You do not own one or more of the new paywalled video blobs");
                            };
                        };
                    };
                    case (null) {};
                };

                // Apply granular updates
                let updatedPost = {
                    post with
                    content = Option.get(payload.content, post.content);
                    tags = Option.get(payload.tags, post.tags);
                    categories = Option.get(payload.categories, post.categories);
                    media = Array.append(post.media, Option.get(payload.addMedia, []));
                };

                posts := postsMap.put(posts, postId, updatedPost);
                updatedPost;
            };
        };
    };

    // Get post with filtering based on reported/flagged status - Public (guests can view)
    public shared query ({ caller }) func getPost(postId : Nat) : async Post {
        switch (postsMap.get(posts, postId)) {
            case (null) { Debug.trap("Post not found") };
            case (?post) {
                if (shouldFilterPost(post, caller)) {
                    Debug.trap("Post is not available");
                };
                post;
            };
        };
    };

    // Get all posts - Public (guests can view), filtered by reported/flagged status
    public query ({ caller }) func getAllPosts() : async [Post] {
        let allPosts = Iter.toArray(postsMap.vals(posts));
        Array.filter(
            allPosts,
            func(post : Post) : Bool {
                not shouldFilterPost(post, caller);
            },
        );
    };

    // Delete post - Author or Admin only
    public shared ({ caller }) func deletePost(postId : Nat) : async () {
        switch (postsMap.get(posts, postId)) {
            case (null) { Debug.trap("Post not found") };
            case (?post) {
                if (caller != post.author and not AccessControl.hasPermission(accessControlState, caller, #admin)) {
                    Debug.trap("Unauthorized: Only the author or admins can delete posts");
                };
                posts := postsMap.delete(posts, postId);
            };
        };
    };

    // Admin moderation panel - View all posts - Admin only
    public shared query ({ caller }) func getAdminPosts() : async [Post] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can access moderation panel");
        };
        Iter.toArray(postsMap.vals(posts));
    };

    // View reported posts - Admin only
    public shared query ({ caller }) func getReportedPosts() : async [Post] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can access reported posts");
        };
        let allPosts = Iter.toArray(postsMap.vals(posts));
        Array.filter(
            allPosts,
            func(post : Post) : Bool {
                post.reported;
            },
        );
    };

    // Flag post - Admin only
    public shared ({ caller }) func flagPost(postId : Nat) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can flag posts");
        };
        switch (postsMap.get(posts, postId)) {
            case (null) { Debug.trap("Post not found") };
            case (?post) {
                if (post.flagged) {
                    Debug.trap("Post is already flagged");
                };
                let updatedPost = {
                    post with
                    flagged = true;
                };
                posts := postsMap.put(posts, postId, updatedPost);
            };
        };
    };

    // Unflag post - Admin only
    public shared ({ caller }) func unflagPost(postId : Nat) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can unflag posts");
        };
        switch (postsMap.get(posts, postId)) {
            case (null) { Debug.trap("Post not found") };
            case (?post) {
                if (not post.flagged) {
                    Debug.trap("Post is not flagged");
                };
                let updatedPost = {
                    post with
                    flagged = false;
                };
                posts := postsMap.put(posts, postId, updatedPost);
            };
        };
    };

    // Report post - User only
    public shared ({ caller }) func reportPost(postId : Nat, category : Text, reason : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can report posts");
        };
        switch (postsMap.get(posts, postId)) {
            case (null) { Debug.trap("Post not found") };
            case (?post) {
                if (caller == post.author) {
                    Debug.trap("You cannot report your own post");
                };

                // Check for duplicate reports from the same user
                let allReports = Iter.toArray(postReportsMap.vals(postReports));
                for (report in allReports.vals()) {
                    if (report.postId == postId and report.reporter == caller) {
                        Debug.trap("You have already reported this post");
                    };
                };

                // Update post's reported status
                let updatedPost = {
                    post with
                    reported = true;
                    reportCount = post.reportCount + 1;
                };
                posts := postsMap.put(posts, postId, updatedPost);

                // Create post report
                let reportId = nextPostReportId;
                nextPostReportId += 1;

                let newReport : PostReport = {
                    id = reportId;
                    postId;
                    reporter = caller;
                    category;
                    reason;
                    timestamp = Time.now();
                    status = "pending";
                };
                postReports := postReportsMap.put(postReports, reportId, newReport);
            };
        };
    };

    // Oversight function: Admin can clean up reports for deleted posts - Admin only
    public shared ({ caller }) func cleanUpReports() : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can clean up reports");
        };
        for ((reportId, report) in postReportsMap.entries(postReports)) {
            switch (postsMap.get(posts, report.postId)) {
                case (null) {
                    postReports := postReportsMap.delete(postReports, reportId);
                };
                case (?_) {};
            };
        };
    };

    // Internal function to fetch token metadata and balance using DIP20 interface
    func fetchTokenMetadataAndBalanceDIP20(canisterId : Text, userPrincipal : Principal) : async ?TokenMetadata {
        try {
            let nameUrl = "https://" # canisterId # ".icp0.io/name";
            let symbolUrl = "https://" # canisterId # ".icp0.io/symbol";
            let decimalsUrl = "https://" # canisterId # ".icp0.io/decimals";

            // Fetch token metadata
            let nameJson = await OutCall.httpGetRequest(nameUrl, [], transform);
            let symbolJson = await OutCall.httpGetRequest(symbolUrl, [], transform);
            let decimalsJson = await OutCall.httpGetRequest(decimalsUrl, [], transform);

            // Parse JSON responses and remove quotes
            let name = Text.trim(
                Text.replace(
                    Text.trim(nameJson, #char ' '),
                    #text "\"",
                    "",
                ),
                #char ' ',
            );
            let symbol = Text.trim(
                Text.replace(
                    Text.trim(symbolJson, #char ' '),
                    #text "\"",
                    "",
                ),
                #char ' ',
            );
            let decimalsText = Text.trim(
                Text.replace(
                    Text.trim(decimalsJson, #char ' '),
                    #text "\"",
                    "",
                ),
                #char ' ',
            );

            let decimals = switch (Nat.fromText(decimalsText)) {
                case (?val) val;
                case (null) 0;
            };

            ?{
                name;
                symbol;
                decimals;
            };
        } catch (err) {
            null;
        };
    };

    // Add a new token using a canister address - User only
    public shared ({ caller }) func addToken(canisterId : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can add tokens");
        };

        // Verify user has a profile
        if (not hasUserProfile(caller)) {
            Debug.trap("You must have a profile to add tokens");
        };

        // Initialize token canisters array for the user if not present
        let currentCanisters = tokenCanistersMap.get(tokenCanisters, caller);
        switch (currentCanisters) {
            case (null) {
                tokenCanisters := tokenCanistersMap.put(tokenCanisters, caller, [{ canisterId; lastChecked = Time.now() }]);
            };
            case (?existingCanisters) {
                // Check if the canisterId already exists
                let exists = Array.find(existingCanisters, func(token : TokenCanister) : Bool { token.canisterId == canisterId }) != null;
                if (exists) {
                    // Update the timestamp if it already exists
                    let updatedCanisters = Array.map(existingCanisters, func(token : TokenCanister) : TokenCanister { if (token.canisterId == canisterId) { { token with lastChecked = Time.now() } } else token });
                    tokenCanisters := tokenCanistersMap.put(tokenCanisters, caller, updatedCanisters);
                } else {
                    let updatedCanisters = Array.append(existingCanisters, [{ canisterId; lastChecked = Time.now() }]);
                    tokenCanisters := tokenCanistersMap.put(tokenCanisters, caller, updatedCanisters);
                };
            };
        };
    };

    // Remove token by canister ID - User only (can only remove own tokens)
    public shared ({ caller }) func removeToken(canisterId : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can remove tokens");
        };

        switch (tokenCanistersMap.get(tokenCanisters, caller)) {
            case (null) {
                Debug.trap("No tokens found for user");
            };
            case (?userTokens) {
                let filteredTokens = Array.filter<TokenCanister>(
                    userTokens,
                    func(token : TokenCanister) : Bool {
                        token.canisterId != canisterId;
                    },
                );

                if (filteredTokens.size() == userTokens.size()) {
                    Debug.trap("Token not found for user");
                } else if (filteredTokens.size() == 0) {
                    tokenCanisters := tokenCanistersMap.delete(tokenCanisters, caller);
                } else {
                    tokenCanisters := tokenCanistersMap.put(tokenCanisters, caller, filteredTokens);
                };
            };
        };
    };

    // Get all imported tokens for the current user - User only
    public shared query ({ caller }) func getImportedTokens() : async [Text] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can view imported tokens");
        };

        switch (tokenCanistersMap.get(tokenCanisters, caller)) {
            case (null) { [] };
            case (?tokens) { Array.map(tokens, func(token : TokenCanister) : Text { token.canisterId }) };
        };
    };

    // ICP Wallet functions

    // Get user wallet - User only (can only get own wallet)
    public shared query ({ caller }) func getWallet() : async Wallet {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can access wallets");
        };
        switch (walletsMap.get(wallets, caller)) {
            case (null) {
                Debug.trap("Wallet not found. Please call ensureWalletExists first.");
            };
            case (?wallet) { wallet };
        };
    };

    // Get user account ID - User only (can only get own account ID)
    public shared query ({ caller }) func getAccountId() : async Text {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can access account IDs");
        };
        switch (walletsMap.get(wallets, caller)) {
            case (null) { Debug.trap("Wallet not found") };
            case (?wallet) { wallet.accountId };
        };
    };

    // Verify if a text is a valid 64-character hexadecimal account ID with optional "AID-" prefix
    func isValidAccountId(accountId : Text) : Bool {
        let normalizedAccountId = if (Text.startsWith(accountId, #text "AID-")) {
            Text.trim(Text.trimStart(accountId, #text "AID-"), #char ' ');
        } else accountId;

        if (normalizedAccountId.size() != 64) {
            return false;
        };

        for (char in normalizedAccountId.chars()) {
            switch (char) {
                case ('0') {};
                case ('1') {};
                case ('2') {};
                case ('3') {};
                case ('4') {};
                case ('5') {};
                case ('6') {};
                case ('7') {};
                case ('8') {};
                case ('9') {};
                case ('a') {};
                case ('b') {};
                case ('c') {};
                case ('d') {};
                case ('e') {};
                case ('f') {};
                case ('A') {};
                case ('B') {};
                case ('C') {};
                case ('D') {};
                case ('E') {};
                case ('F') {};
                case (_) { return false };
            };
        };

        true;
    };

    // Sort posts by timestamp in descending order
    func sortPostsByTimestamp(postsToSort : [Post]) : [Post] {
        if (postsToSort.size() <= 1) {
            return postsToSort;
        };

        let compare : (Post, Post) -> Order.Order = func(a : Post, b : Post) : Order.Order {
            if (a.timestamp > b.timestamp) { #less } else if (a.timestamp < b.timestamp) { #greater } else {
                #equal;
            };
        };

        Array.sort(postsToSort, compare);
    };

    // Get all reported posts sorted by timestamp (newest first) - Admin only
    public shared query ({ caller }) func getSortedReportedPosts() : async [Post] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can access reported posts");
        };
        let allPosts = Iter.toArray(postsMap.vals(posts));
        let reportedPosts = Array.filter(
            allPosts,
            func(post : Post) : Bool {
                post.reported;
            },
        );
        sortPostsByTimestamp(reportedPosts);
    };

    // Post search - Public (guests can search), but results are filtered
    public query ({ caller }) func searchPosts(searchTerm : Text, includeFlagged : Bool, includeReported : Bool) : async [Post] {
        let allPosts = Iter.toArray(postsMap.vals(posts));
        let filteredPosts = Array.filter(
            allPosts,
            func(post : Post) : Bool {
                let contentMatch = Text.contains(Text.toLowercase(post.content), #text(Text.toLowercase(searchTerm)));

                // Apply proper filtering based on user role
                if (shouldFilterPost(post, caller)) {
                    return false;
                };

                // Additional filtering based on search parameters (only for non-admins)
                if (not AccessControl.isAdmin(accessControlState, caller)) {
                    if (post.flagged and not includeFlagged) {
                        return false;
                    };
                    if (post.reported and not includeReported and post.author != caller) {
                        return false;
                    };
                };

                contentMatch;
            },
        );
        sortPostsByTimestamp(filteredPosts);
    };

    // Get post by ID - Public (guests can view), but filtered
    public shared query ({ caller }) func getPostById(postId : Nat) : async Post {
        switch (postsMap.get(posts, postId)) {
            case (null) { Debug.trap("Post not found") };
            case (?post) {
                if (shouldFilterPost(post, caller)) {
                    Debug.trap("Post is not available");
                };
                post;
            };
        };
    };

    // Add API function to fetch posts for a specific category - Public (guests can view), but filtered
    public shared query ({ caller }) func getPostsByCategory(category : Text) : async [Post] {
        let allPosts = Iter.toArray(postsMap.vals(posts));
        let categoryPosts = Array.filter(
            allPosts,
            func(post : Post) : Bool {
                let hasCategory = Array.find(post.categories, func(cat : Text) : Bool { cat == category }) != null;
                hasCategory and not shouldFilterPost(post, caller);
            },
        );
        categoryPosts;
    };

    // Add API function to fetch posts by a specific author - Public (guests can view), but filtered
    public shared query ({ caller }) func getPostsByAuthor(author : Principal) : async [Post] {
        let allPosts = Iter.toArray(postsMap.vals(posts));
        let authorPosts = Array.filter(
            allPosts,
            func(post : Post) : Bool {
                post.author == author and not shouldFilterPost(post, caller);
            },
        );
        authorPosts;
    };

    // Add API function to fetch posts containing specific tags - Public (guests can view), but filtered
    public shared query ({ caller }) func getPostsByTags(tags : [Text]) : async [Post] {
        let allPosts = Iter.toArray(postsMap.vals(posts));
        let tagPosts = Array.filter(
            allPosts,
            func(post : Post) : Bool {
                let hasTag = Array.find(
                    tags,
                    func(searchTag : Text) : Bool {
                        Array.find(
                            post.tags,
                            func(postTag : Text) : Bool {
                                postTag == searchTag;
                            },
                        ) != null;
                    },
                ) != null;
                hasTag and not shouldFilterPost(post, caller);
            },
        );
        tagPosts;
    };

    // Add API function to fetch posts with a specific paywall status - Public (guests can view), but filtered
    public shared query ({ caller }) func getPostsByPaywallStatus(hasPaywall : Bool) : async [Post] {
        let allPosts = Iter.toArray(postsMap.vals(posts));
        let paywallPosts = Array.filter(
            allPosts,
            func(post : Post) : Bool {
                let matchesPaywall = (hasPaywall and (post.paywallLinks.size() > 0 or post.paywalledVideos.size() > 0)) or
                (not hasPaywall and post.paywallLinks.size() == 0 and post.paywalledVideos.size() == 0);
                matchesPaywall and not shouldFilterPost(post, caller);
            },
        );
        paywallPosts;
    };

    // Add API function to fetch posts with a specific media type - Public (guests can view), but filtered
    public shared query ({ caller }) func getPostsByMediaType(mediaType : Text) : async [Post] {
        let allPosts = Iter.toArray(postsMap.vals(posts));
        let mediaPosts = Array.filter(
            allPosts,
            func(post : Post) : Bool {
                let matchesMedia = switch (mediaType) {
                    case ("image") { post.media.size() > 0 };
                    case ("video") { post.publicVideos.size() > 0 };
                    case ("paywalled") { post.paywalledVideos.size() > 0 or post.paywallLinks.size() > 0 };
                    case (_) { false };
                };
                matchesMedia and not shouldFilterPost(post, caller);
            },
        );
        mediaPosts;
    };

    // Access control initialization and management
    public shared ({ caller }) func initializeAccessControl() : async () {
        AccessControl.initialize(accessControlState, caller);
        adminWalletPrincipal := ?caller;
    };

    public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
        AccessControl.getUserRole(accessControlState, caller);
    };

    public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
        AccessControl.assignRole(accessControlState, caller, user, role);
    };

    public query ({ caller }) func isCallerAdmin() : async Bool {
        AccessControl.isAdmin(accessControlState, caller);
    };

    public query ({ caller }) func isCallerApproved() : async Bool {
        AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
    };

    public shared ({ caller }) func requestApproval() : async () {
        UserApproval.setApproval(approvalState, caller, #pending);
    };

    public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can perform this action");
        };
        UserApproval.setApproval(approvalState, user, status);
    };

    public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can perform this action");
        };
        UserApproval.listApprovals(approvalState);
    };

    // User profile management
    public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can access profiles");
        };
        profilesMap.get(userProfiles, caller);
    };

    public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
        // Profiles are public - anyone can view them (including guests)
        profilesMap.get(userProfiles, user);
    };

    public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can save profiles");
        };

        // Verify ownership of profile picture blob if present
        switch (profile.profilePicture) {
            case (?picBlob) {
                if (not verifyBlobOwnership(caller, picBlob)) {
                    Debug.trap("Unauthorized: You do not own the profile picture blob");
                };
            };
            case (null) {};
        };

        userProfiles := profilesMap.put(userProfiles, caller, profile);
    };
};

