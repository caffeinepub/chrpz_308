import type { Principal } from "@icp-sdk/core/principal";
import { AlertCircle, Loader2, Lock, Mail, User } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { hashPassword, isStrongPassword } from "../lib/passwordHash";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface EmailAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (principal: Principal) => void;
}

export default function EmailAuthModal({
  isOpen,
  onClose,
  onSuccess: _onSuccess,
}: EmailAuthModalProps) {
  const { actor } = useActor();
  const [activeTab, setActiveTab] = useState<"signin" | "register">("signin");
  const [isLoading, setIsLoading] = useState(false);

  // Sign In State
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Registration State
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regBio, setRegBio] = useState("");
  const [regNewsletter, setRegNewsletter] = useState(false);

  const handleSignIn = async () => {
    if (!signInEmail || !signInPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      if (!actor) throw new Error("Actor not available");

      toast.error("Email authentication not implemented in backend");
      // Backend implementation required
    } catch (error: any) {
      toast.error(error.message || "Sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!regEmail || !regPassword || !regConfirmPassword || !regName) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!isStrongPassword(regPassword)) {
      toast.error(
        "Password must be at least 8 characters with uppercase, lowercase, and number",
      );
      return;
    }

    setIsLoading(true);
    try {
      if (!actor) throw new Error("Actor not available");

      toast.error("Email registration not implemented in backend");
      // Backend implementation required
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glass-dark border-2">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Email Authentication
          </DialogTitle>
          <DialogDescription>
            Sign in or register with your email
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-amber-500/50 bg-amber-950/20">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <AlertDescription className="text-amber-200">
            Email authentication requires backend implementation. The UI is
            ready but backend methods are not yet available.
          </AlertDescription>
        </Alert>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "signin" | "register")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email" className="text-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="signin-email"
                  type="email"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="pl-10 bg-card border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signin-password" className="text-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="signin-password"
                  type="password"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 bg-card border-border"
                />
              </div>
            </div>

            <Button
              onClick={handleSignIn}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reg-email" className="text-foreground">
                Email *
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="reg-email"
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="pl-10 bg-card border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-name" className="text-foreground">
                Display Name *
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="reg-name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Your Name"
                  className="pl-10 bg-card border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-password" className="text-foreground">
                Password *
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="reg-password"
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 bg-card border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-confirm-password" className="text-foreground">
                Confirm Password *
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="reg-confirm-password"
                  type="password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 bg-card border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-bio" className="text-foreground">
                Bio (Optional)
              </Label>
              <Input
                id="reg-bio"
                value={regBio}
                onChange={(e) => setRegBio(e.target.value)}
                placeholder="Tell us about yourself"
                className="bg-card border-border"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="reg-newsletter"
                checked={regNewsletter}
                onCheckedChange={(checked) =>
                  setRegNewsletter(checked as boolean)
                }
              />
              <Label
                htmlFor="reg-newsletter"
                className="text-sm text-foreground cursor-pointer"
              >
                Subscribe to newsletter
              </Label>
            </div>

            <Button
              onClick={handleRegister}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                "Register"
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
