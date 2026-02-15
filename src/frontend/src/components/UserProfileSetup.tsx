import React, { useState } from 'react';
import { useRegisterUser } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, AlertCircle, Clock } from 'lucide-react';

export default function UserProfileSetup() {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [subscribeToNewsletter, setSubscribeToNewsletter] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const registerUser = useRegisterUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    try {
      await registerUser.mutateAsync({
        name: name.trim(),
        bio: bio.trim(),
        referrerPrincipal: null,
        subscribeToNewsletter,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit registration');
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-dark border-2 border-amber-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Clock className="w-6 h-6 text-amber-500" />
              Registration Pending
            </CardTitle>
            <CardDescription>Your registration is awaiting admin approval</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-amber-500/50 bg-amber-950/20">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <AlertDescription className="text-amber-200">
                Thank you for registering! An administrator will review your registration request shortly.
                You will be able to access the platform once your registration is approved.
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground">
              Your ICP wallet will be automatically generated upon approval.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-dark border-2">
        <CardHeader>
          <CardTitle className="text-foreground">Complete Your Profile</CardTitle>
          <CardDescription>Set up your profile to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="glass-dark border-2 border-destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">Display Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className="bg-card border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-foreground">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself"
                rows={3}
                className="bg-card border-border"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="newsletter"
                checked={subscribeToNewsletter}
                onCheckedChange={(checked) => setSubscribeToNewsletter(checked as boolean)}
              />
              <Label htmlFor="newsletter" className="text-sm text-foreground cursor-pointer">
                Subscribe to newsletter
              </Label>
            </div>

            <Alert className="glass-dark border-2 border-primary/50">
              <AlertCircle className="w-4 h-4 text-primary" />
              <AlertDescription className="text-sm">
                Your registration will be pending admin approval. Once approved, an ICP wallet will be automatically generated for you.
              </AlertDescription>
            </Alert>

            <Button
              type="submit"
              disabled={registerUser.isPending}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {registerUser.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Registration'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
