'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User as UserIcon, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toaster';
import { register, login } from '@/lib/api/auth';

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields.');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Call register API
      await register(email, password, fullName);
      toast.success('Account registered successfully! Logging you in...', 'Success');

      // 2. Perform auto-login
      await login(email, password);
      toast.success('Successfully logged in!', 'Welcome');
      
      router.push('/');
      router.refresh();
    } catch (error: any) {
      console.error('Registration error:', error);
      const detail = error.response?.data?.detail || 'Registration failed. Email might already be in use.';
      toast.error(detail, 'Registration Failed');
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
            Create an account
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Start automating your workflows and business tasks
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name Field */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-xs font-semibold text-slate-300">
                Full Name
              </Label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10 h-11 border-slate-800 bg-slate-950/60 text-white placeholder-slate-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl"
                  disabled={isLoading}
                />
              </div>
            </div>

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
              <Label htmlFor="password" className="text-xs font-semibold text-slate-300">
                Password (min 8 chars)
              </Label>
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

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-300">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 h-11 border-slate-800 bg-slate-950/60 text-white placeholder-slate-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl shadow-lg shadow-violet-600/20 transition-all flex items-center justify-center gap-2 mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          {/* Footer link */}
          <div className="mt-6 text-center text-xs">
            <span className="text-slate-400">Already have an account? </span>
            <Link
              href="/login"
              className="font-semibold text-violet-400 hover:text-violet-300 transition-colors"
            >
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
