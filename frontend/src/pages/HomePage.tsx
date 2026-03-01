import React from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import Header from '../components/Header';
import UserProfileSetup from '../components/UserProfileSetup';
import MainContent from '../components/MainContent';

export default function HomePage() {
  const { identity } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && profile === null;

  if (showProfileSetup) {
    return <UserProfileSetup />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <MainContent />
    </div>
  );
}
