import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Loader2, Mail } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import EmailAuthModal from './EmailAuthModal';
import { Principal } from '@icp-sdk/core/principal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { login, loginStatus } = useInternetIdentity();
  const [error, setError] = useState('');
  const [showEmailAuth, setShowEmailAuth] = useState(false);

  const handleInternetIdentityLogin = async () => {
    try {
      setError('');
      await login();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
    }
  };

  const handleEmailAuthSuccess = (principal: Principal) => {
    setShowEmailAuth(false);
    onSuccess();
  };

  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md glass-dark border-2">
          <DialogHeader>
            <DialogTitle className="text-foreground">Sign In</DialogTitle>
            <DialogDescription>
              Choose your authentication method
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive" className="glass-dark border-2 border-destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleInternetIdentityLogin}
              disabled={isLoggingIn}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Sign In with Internet Identity'
              )}
            </Button>

            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                OR
              </span>
            </div>

            <Button
              onClick={() => setShowEmailAuth(true)}
              variant="outline"
              className="w-full"
            >
              <Mail className="w-4 h-4 mr-2" />
              Sign In with Email
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Both methods share the same ICP wallet and platform features
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <EmailAuthModal
        isOpen={showEmailAuth}
        onClose={() => setShowEmailAuth(false)}
        onSuccess={handleEmailAuthSuccess}
      />
    </>
  );
}
