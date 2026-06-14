'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toaster';
import { login } from '@/lib/api/auth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Successfully logged in! Redirecting...', 'Welcome Back');
      router.push(redirectPath);
      router.refresh();
    } catch (error: any) {
      console.error('Login error:', error);
      const detail = error.response?.data?.detail || 'Incorrect email or password. Please try again.';
      toast.error(detail, 'Login Failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 -z-10 size-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/10 blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 size-[350px] translate-x-1/2 translate-y-1/2 rounded-full bg-emerald-600/10 blur-[90px]" />

      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2.5 rounded-2xl bg-white/5 border border-white/10 px-4 py-2 mb-4">
            <div className="size-2.5 rounded-full bg-violet-500 animate-pulse" />
            <span className="text-xs font-semibold text-violet-300 uppercase tracking-widest">ProcessFlow Studio</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to manage and run your workflow automations
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-300">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 border-slate-800 bg-slate-950/60 text-white placeholder-slate-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-300">
                  Password
                </Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 border-slate-800 bg-slate-950/60 text-white placeholder-slate-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl shadow-lg shadow-violet-600/20 transition-all flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          {/* Footer link */}
          <div className="mt-6 text-center text-xs">
            <span className="text-slate-400">Don&apos;t have an account? </span>
            <Link
              href="/register"
              className="font-semibold text-violet-400 hover:text-violet-300 transition-colors"
            >
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white">
        <Loader2 className="size-8 animate-spin text-violet-500 mb-2" />
        <span className="text-xs text-slate-400">Loading auth portal…</span>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
