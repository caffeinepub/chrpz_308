import React, { useEffect, useState } from 'react';
import { useActor } from '../hooks/useActor';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useEnsureWalletExists } from '../hooks/useQueries';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';

interface AppInitializerProps {
  children: React.ReactNode;
}

export default function AppInitializer({ children }: AppInitializerProps) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity, isInitializing: iiInitializing } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();
  const ensureWallet = useEnsureWalletExists();

  const [initError, setInitError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

  const initTimeoutMs = 8000; // 8 seconds - faster timeout for better UX
  const isAuthenticated = !!identity;

  useEffect(() => {
    // Set timeout for initialization - show content anyway after timeout
    const timeoutId = setTimeout(() => {
      if (!isReady) {
        console.warn('Initialization timeout - showing content with warning');
        setShowTimeoutWarning(true);
        setIsReady(true);
      }
    }, initTimeoutMs);

    return () => clearTimeout(timeoutId);
  }, [isReady]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Wait for Internet Identity to finish initializing
        if (iiInitializing) {
          return;
        }

        // Wait for actor to be ready - but don't block forever
        if (!actor) {
          if (!actorFetching) {
            // Actor failed to initialize but not fetching anymore
            console.warn('Actor initialization failed, continuing anyway');
            setInitError('Connection issues detected. Some features may be limited.');
            setIsReady(true);
          }
          return;
        }

        // If authenticated, ensure wallet exists (but don't block on it)
        if (isAuthenticated && profile && profileFetched) {
          try {
            await ensureWallet.mutateAsync();
          } catch (error) {
            console.warn('Wallet check failed, continuing anyway:', error);
            // Don't block initialization if wallet check fails
          }
        }

        // Initialization complete - show the app
        setIsReady(true);
        setInitError(null);
      } catch (error: any) {
        console.error('App initialization error:', error);
        // On error, still show the app but with a warning
        setInitError('Some features may be limited due to connection issues.');
        setIsReady(true);
      }
    };

    initializeApp();
  }, [actor, actorFetching, iiInitializing, isAuthenticated, profile, profileFetched]);

  const handleRetry = () => {
    window.location.reload();
  };

  // Show loading screen only briefly while initializing
  if (!isReady && (actorFetching || iiInitializing)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-indigo-600" />
          <div className="space-y-2">
            <p className="text-lg font-semibold text-gray-900">Connecting to Chrpz...</p>
            <p className="text-sm text-gray-600">Initializing backend connection</p>
          </div>
        </div>
      </div>
    );
  }

  // Show warning banner if there was a timeout or error, but still render the app
  if ((showTimeoutWarning || initError) && isReady) {
    return (
      <>
        <div className="bg-yellow-50 border-b border-yellow-200 p-3 sticky top-0 z-50">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-800" />
              <p className="text-sm text-yellow-800">
                {initError || 'Connection slow - some features may be limited. You can continue browsing.'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRetry}>
              Retry
            </Button>
          </div>
        </div>
        {children}
      </>
    );
  }

  // App is ready - render children
  return <>{children}</>;
}
