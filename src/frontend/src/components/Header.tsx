import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { LogOut, Shield, User } from "lucide-react";
import React, { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile, useIsCallerAdmin } from "../hooks/useQueries";
import AdminPanel from "./AdminPanel";
import AuthModal from "./AuthModal";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

export default function Header() {
  const { identity, clear, loginStatus } = useInternetIdentity();
  useGetCallerUserProfile();
  const { data: isAdmin = false } = useIsCallerAdmin();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const isAuthenticated = !!identity;
  const isLoggingOut = loginStatus === "logging-in";

  const handleSignOut = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: "/" });
  };

  const handleProfileClick = () => {
    if (isAuthenticated) {
      navigate({ to: "/profile" });
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <button
            type="button"
            className="flex items-center gap-2 cursor-pointer bg-transparent border-0 p-0"
            onClick={() => navigate({ to: "/" })}
          >
            <div className="w-10 h-10 rounded-full bg-[#B22234] flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <h1 className="text-2xl font-bold text-[#B22234]">Chrpz</h1>
          </button>

          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleProfileClick}
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Profile</span>
                </Button>

                {isAdmin && (
                  <Dialog
                    open={showAdminPanel}
                    onOpenChange={setShowAdminPanel}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                      >
                        <Shield className="w-4 h-4" />
                        <span className="hidden sm:inline">Admin</span>
                        <Badge
                          variant="destructive"
                          className="ml-1 px-1 py-0 text-xs"
                        >
                          !
                        </Badge>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Admin Panel</DialogTitle>
                      </DialogHeader>
                      <AdminPanel />
                    </DialogContent>
                  </Dialog>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  className="gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </>
            )}

            {!isAuthenticated && (
              <Button
                onClick={() => setShowAuthModal(true)}
                className="bg-[#B22234] hover:bg-red-800 text-white"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
      />
    </>
  );
}
