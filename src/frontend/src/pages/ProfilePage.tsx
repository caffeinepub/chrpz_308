import { Copy, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useUpdateProfile } from "../hooks/useQueries";
import { truncatePrincipal } from "../lib/utils";

export default function ProfilePage() {
  const { identity } = useInternetIdentity();
  const updateProfile = useUpdateProfile();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const principalId = identity?.getPrincipal().toString() ?? "";

  const handleCopyPrincipal = () => {
    navigator.clipboard.writeText(principalId);
    toast.success("Principal ID copied!");
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({ username, bio, avatarUrl });
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile.");
    }
  };

  if (!identity) {
    return (
      <Layout>
        <div className="text-center py-16 text-muted-foreground">
          <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sign in to view your profile</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">
          Your Profile
        </h1>

        {/* Principal ID */}
        <div
          className="bg-muted/40 border border-border rounded-lg p-4 mb-6"
          data-ocid="principal-display"
        >
          <p className="text-xs text-muted-foreground mb-1">Principal ID</p>
          <div className="flex items-center gap-2">
            <code className="text-xs text-foreground font-mono flex-1 truncate">
              {truncatePrincipal(principalId, 12)}
            </code>
            <button
              type="button"
              onClick={handleCopyPrincipal}
              className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Copy principal ID"
              data-ocid="copy-principal"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Edit Form */}
        <div
          className="bg-card border border-border rounded-lg p-5 space-y-4"
          data-ocid="profile-form"
        >
          <div>
            <Label
              htmlFor="username"
              className="text-sm font-medium text-foreground"
            >
              Username
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your display name"
              className="mt-1.5"
              data-ocid="profile-username"
            />
          </div>
          <div>
            <Label
              htmlFor="bio"
              className="text-sm font-medium text-foreground"
            >
              Bio
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the community about yourself"
              rows={3}
              className="mt-1.5 resize-none"
              data-ocid="profile-bio"
            />
          </div>
          <div>
            <Label
              htmlFor="avatarUrl"
              className="text-sm font-medium text-foreground"
            >
              Avatar URL
            </Label>
            <Input
              id="avatarUrl"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="mt-1.5"
              data-ocid="profile-avatar-url"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={updateProfile.isPending}
            className="w-full bg-primary hover:bg-primary/90"
            data-ocid="profile-save"
          >
            {updateProfile.isPending ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
