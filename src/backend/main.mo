import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Migration "migration";

(with migration = Migration.run)
actor {
    // ── Types ──────────────────────────────────────────────────────────────

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

    // Shared (serializable) versions for API boundaries
    type UserPublic = {
        principalId : Text;
        username : Text;
        bio : Text;
        avatarUrl : Text;
        isAdmin : Bool;
        createdAt : Int;
    };

    type PostPublic = {
        id : Nat;
        authorId : Text;
        authorName : Text;
        content : Text;
        imageUrl : ?Text;
        createdAt : Int;
        flagged : Bool;
        deleted : Bool;
    };

    // ── State ──────────────────────────────────────────────────────────────

    let users = Map.empty<Principal, User>();
    let posts = Map.empty<Nat, Post>();
    var nextPostId : Nat = 0;

    // ── Helpers ────────────────────────────────────────────────────────────

    func userIsAdmin(u : User) : Bool {
        switch (u.role) {
            case (#admin) true;
            case (_) false;
        };
    };

    func toUserPublic(u : User) : UserPublic {
        {
            principalId = u.principalId.toText();
            username    = u.username;
            bio         = u.bio;
            avatarUrl   = u.avatarUrl;
            isAdmin     = userIsAdmin(u);
            createdAt   = u.createdAt;
        };
    };

    func toPostPublic(p : Post) : PostPublic {
        {
            id         = p.id;
            authorId   = p.authorId.toText();
            authorName = p.authorName;
            content    = p.content;
            imageUrl   = p.imageUrl;
            createdAt  = p.createdAt;
            flagged    = p.flagged;
            deleted    = p.deleted;
        };
    };

    func isAdminPrincipal(caller : Principal) : Bool {
        switch (users.get(caller)) {
            case (?u) userIsAdmin(u);
            case null false;
        };
    };

    func requireAdmin(caller : Principal) {
        if (not isAdminPrincipal(caller)) {
            Runtime.trap("Unauthorized: admin only");
        };
    };

    func requireAuthenticated(caller : Principal) {
        if (caller.isAnonymous()) {
            Runtime.trap("Unauthorized: must be authenticated");
        };
    };

    // ── Auth / Profile ─────────────────────────────────────────────────────

    // Auto-register on first call; return existing profile on subsequent calls.
    // First registered user becomes admin.
    public shared ({ caller }) func registerOrGetUser() : async UserPublic {
        requireAuthenticated(caller);
        switch (users.get(caller)) {
            case (?u) { toUserPublic(u) };
            case null {
                let role : Role = if (users.isEmpty()) #admin else #user;
                let u : User = {
                    principalId = caller;
                    var username = "User_" # caller.toText();
                    var bio = "";
                    var avatarUrl = "";
                    role;
                    createdAt = Time.now();
                };
                users.add(caller, u);
                toUserPublic(u);
            };
        };
    };

    public shared ({ caller }) func updateProfile(username : Text, bio : Text, avatarUrl : Text) : async UserPublic {
        requireAuthenticated(caller);
        switch (users.get(caller)) {
            case null { Runtime.trap("User not found — call registerOrGetUser first") };
            case (?u) {
                u.username  := username;
                u.bio       := bio;
                u.avatarUrl := avatarUrl;
                toUserPublic(u);
            };
        };
    };

    public query func getUserProfile(principalId : Text) : async ?UserPublic {
        let p = Principal.fromText(principalId);
        switch (users.get(p)) {
            case (?u) ?toUserPublic(u);
            case null null;
        };
    };

    // ── Admin checks ────────────────────────────────────────────────────────

    public query ({ caller }) func isAdmin() : async Bool {
        isAdminPrincipal(caller);
    };

    // ── Posts ───────────────────────────────────────────────────────────────

    public shared ({ caller }) func createPost(content : Text, imageUrl : ?Text) : async PostPublic {
        requireAuthenticated(caller);
        let author = switch (users.get(caller)) {
            case (?u) u;
            case null { Runtime.trap("Must call registerOrGetUser before posting") };
        };

        let id = nextPostId;
        nextPostId += 1;

        let p : Post = {
            id;
            authorId    = caller;
            var authorName = author.username;
            var content = content;
            var imageUrl = imageUrl;
            createdAt   = Time.now();
            var flagged = false;
            var deleted = false;
        };
        posts.add(id, p);
        toPostPublic(p);
    };

    public shared ({ caller }) func editPost(postId : Nat, content : Text, imageUrl : ?Text) : async PostPublic {
        requireAuthenticated(caller);
        switch (posts.get(postId)) {
            case null { Runtime.trap("Post not found") };
            case (?p) {
                if (p.deleted) { Runtime.trap("Post is deleted") };
                if (p.authorId != caller and not isAdminPrincipal(caller)) {
                    Runtime.trap("Unauthorized: not the author");
                };
                p.content  := content;
                p.imageUrl := imageUrl;
                toPostPublic(p);
            };
        };
    };

    public shared ({ caller }) func deletePost(postId : Nat) : async () {
        requireAuthenticated(caller);
        switch (posts.get(postId)) {
            case null { Runtime.trap("Post not found") };
            case (?p) {
                if (p.authorId != caller and not isAdminPrincipal(caller)) {
                    Runtime.trap("Unauthorized: not the author or admin");
                };
                p.deleted := true;
            };
        };
    };

    public query func getPost(postId : Nat) : async ?PostPublic {
        switch (posts.get(postId)) {
            case null null;
            case (?p) {
                if (p.deleted or p.flagged) null else ?toPostPublic(p);
            };
        };
    };

    // Paginated feed — returns non-deleted, non-flagged posts sorted newest first.
    public query func getPosts(page : Nat, pageSize : Nat) : async [PostPublic] {
        let all : [PostPublic] = posts.values()
            .filter(func(p : Post) : Bool { not p.deleted and not p.flagged })
            .map(func(p : Post) : PostPublic { toPostPublic(p) })
            .toArray();

        // Sort descending by createdAt
        let sorted = all.sort(func(a : PostPublic, b : PostPublic) : Order.Order {
            if (a.createdAt > b.createdAt) #less
            else if (a.createdAt < b.createdAt) #greater
            else #equal
        });

        let start = page * pageSize;
        if (start >= sorted.size()) { return [] };
        let end = Nat.min(start + pageSize, sorted.size());
        sorted.sliceToArray(start, end);
    };

    // ── Admin Moderation ────────────────────────────────────────────────────

    public shared ({ caller }) func flagPost(postId : Nat) : async () {
        requireAdmin(caller);
        switch (posts.get(postId)) {
            case null { Runtime.trap("Post not found") };
            case (?p) { p.flagged := true };
        };
    };

    public shared ({ caller }) func unflagPost(postId : Nat) : async () {
        requireAdmin(caller);
        switch (posts.get(postId)) {
            case null { Runtime.trap("Post not found") };
            case (?p) { p.flagged := false };
        };
    };

    public shared query ({ caller }) func getFlaggedPosts() : async [PostPublic] {
        requireAdmin(caller);
        posts.values()
            .filter(func(p : Post) : Bool { p.flagged and not p.deleted })
            .map(func(p : Post) : PostPublic { toPostPublic(p) })
            .toArray();
    };

    // Admin: all posts including flagged/deleted
    public shared query ({ caller }) func getAllPostsAdmin() : async [PostPublic] {
        requireAdmin(caller);
        posts.values()
            .map(func(p : Post) : PostPublic { toPostPublic(p) })
            .toArray();
    };

    public shared query ({ caller }) func getUsers() : async [UserPublic] {
        requireAdmin(caller);
        users.values()
            .map(func(u : User) : UserPublic { toUserPublic(u) })
            .toArray();
    };

    public shared ({ caller }) func deleteUser(principalId : Text) : async () {
        requireAdmin(caller);
        let target = Principal.fromText(principalId);
        if (not users.containsKey(target)) {
            Runtime.trap("User not found");
        };
        users.remove(target);
        // Soft-delete their posts
        posts.values().forEach(func(p : Post) {
            if (p.authorId == target) { p.deleted := true };
        });
    };
};
