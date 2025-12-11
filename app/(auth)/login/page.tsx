'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login, user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Redirect if already logged in (but only once, not in a loop)
  useEffect(() => {
    if (!authLoading && user && typeof window !== 'undefined') {
      const targetPath = user.role === 'admin' ? '/admin/dashboard' : '/provider/dashboard';
      // Use replace to avoid adding to history
      window.location.replace(targetPath);
    }
  }, [user, authLoading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Attempting login with:', email);
      await login(email, password);
    } catch (error: any) {
      console.error('Login error:', error);
      setIsLoading(false);
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid email or password. Please check your credentials.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#2C2C2C] p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />
      
      <Card className="w-full max-w-md border border-white/10 shadow-2xl bg-black/40 backdrop-blur-xl relative z-10">
        <CardHeader className="space-y-1 text-center pb-8">
          <div className="mx-auto bg-rose-500/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(225,29,72,0.3)] border border-rose-500/20">
            <Lock className="h-8 w-8 text-rose-500" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-white/70">
            Sign in to KSS NW UK Labour Provider Portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/90 font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  disabled={isLoading}
                  autoComplete="email"
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40 transition-all duration-200"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-white/90 font-medium">Password</Label>
                <a href="#" className="text-xs text-rose-400 hover:text-rose-300 font-medium">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40 transition-all duration-200"
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/20 h-11" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-4 pb-8 text-center border-t border-white/10 bg-white/5 rounded-b-xl">
          <p className="text-xs text-white/60">
            Please enter your credentials to access the KSS NW UK Labour Provider Portal.
          </p>
        </CardFooter>
      </Card>
      
      <div className="absolute bottom-6 text-center w-full text-white/20 text-xs">
        &copy; 2026 KSS NW UK Labour Provider Portal. All rights reserved.
      </div>
    </div>
  );
}
