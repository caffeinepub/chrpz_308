import { Loader2 } from "lucide-react";
import React, { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
}: AuthModalProps) {
  const { login, loginStatus } = useInternetIdentity();
  const [error, setError] = useState("");

  const handleInternetIdentityLogin = async () => {
    try {
      setError("");
      await login();
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to authenticate");
    }
  };

  const isLoggingIn = loginStatus === "logging-in";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-2">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Sign In to Chrpz
          </DialogTitle>
          <DialogDescription>
            Use Internet Identity to securely sign in
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert
              variant="destructive"
              className="border-2 border-destructive"
            >
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleInternetIdentityLogin}
            disabled={isLoggingIn}
            className="w-full bg-[#B22234] hover:bg-red-800 text-white"
            data-ocid="auth-ii-login"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              "Sign In with Internet Identity"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
