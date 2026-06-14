'use client';

import Link from 'next/link';
import { 
  Zap, 
  ArrowRight, 
  Play, 
  Layers, 
  Bot, 
  Cpu, 
  Activity, 
  ArrowUpRight, 
  Workflow,
  Sparkles,
  CheckCircle2,
  Terminal,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

// ============================================================
// Premium Landing Page for ProcessFlow Studio
// ============================================================
export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans selection:bg-violet-500/30 selection:text-violet-200">
      
      {/* -------------------------------------------------- */}
      {/* Background Gradients (Aesthetics)                   */}
      {/* -------------------------------------------------- */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Glow Top Left */}
        <div className="absolute -top-40 -left-40 size-[600px] rounded-full bg-violet-600/10 blur-[120px] dark:bg-violet-600/15" />
        
        {/* Glow Bottom Right */}
        <div className="absolute top-[60%] -right-40 size-[600px] rounded-full bg-emerald-600/5 blur-[120px] dark:bg-emerald-600/10" />

        {/* Subtle Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />
      </div>

      {/* -------------------------------------------------- */}
      {/* Premium Header                                     */}
      {/* -------------------------------------------------- */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-500/25">
              <Zap className="size-4.5 animate-pulse" />
            </div>
            <span className="text-base font-extrabold tracking-tight text-white">
              ProcessFlow <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent font-medium">Studio</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="transition-colors hover:text-white">Features</a>
            <a href="#architecture" className="transition-colors hover:text-white">Workflow Design</a>
            <a href="#integrations" className="transition-colors hover:text-white">Integrations</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button className="group relative overflow-hidden rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:bg-violet-500 hover:shadow-violet-500/30">
                <span className="relative z-10 flex items-center gap-1.5">
                  Launch Studio
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 transition-transform duration-500 group-hover:translate-x-0" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------- */}
      {/* Hero Section                                       */}
      {/* -------------------------------------------------- */}
      <section className="relative mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 lg:px-8 lg:pb-28">
        <div className="flex flex-col items-center text-center">
          
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1 text-xs font-semibold text-violet-300 transition-all duration-700 ${mounted ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
            <Sparkles className="size-3.5 text-violet-400" />
            Next-Gen Workflow Automation
          </div>

          {/* Heading */}
          <h1 className={`mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl max-w-3xl transition-all duration-700 delay-100 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            Orchestrate Your Operations
            <span className="block mt-2 bg-gradient-to-r from-violet-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              Without Writing Code.
            </span>
          </h1>

          {/* Subheading */}
          <p className={`mt-6 max-w-2xl text-base text-zinc-400 sm:text-lg transition-all duration-700 delay-200 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            Design, execute, and monitor complex business logic in a visual builder. Build webhook listeners, data mappers, and custom integrations to speed up your automation timeline.
          </p>

          {/* CTAs */}
          <div className={`mt-10 flex flex-wrap justify-center gap-4 transition-all duration-700 delay-300 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <Link href="/dashboard">
              <Button size="lg" className="rounded-xl bg-violet-600 px-8 text-white shadow-lg shadow-violet-500/25 hover:bg-violet-500">
                Create First Workflow
                <Play className="ml-2 size-4 fill-current" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="rounded-xl border-zinc-800 bg-zinc-900/50 px-8 text-zinc-300 hover:bg-zinc-900 hover:text-white">
                Learn More
              </Button>
            </a>
          </div>

          {/* -------------------------------------------------- */}
          {/* Interactive Mock visual builder (Wow factor)       */}
          {/* -------------------------------------------------- */}
          <div className={`relative mt-16 w-full max-w-5xl rounded-2xl border border-zinc-800 bg-zinc-900/30 p-2 shadow-2xl backdrop-blur-sm transition-all duration-1000 delay-500 ${mounted ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
            <div className="absolute -top-12 left-1/2 h-px w-80 -translate-x-1/2 bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-80" />
            <div className="absolute -bottom-px left-1/4 h-px w-1/2 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />
            
            {/* Window bar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-900 bg-zinc-950/80 rounded-t-xl">
              <div className="flex items-center gap-1.5">
                <span className="size-3 rounded-full bg-rose-500/40" />
                <span className="size-3 rounded-full bg-amber-500/40" />
                <span className="size-3 rounded-full bg-emerald-500/40" />
              </div>
              <span className="text-xs text-zinc-500 font-mono">ProcessFlow Studio - Visual Editor</span>
              <span className="size-4 text-zinc-600" />
            </div>

            {/* Mock Editor Canvas Grid */}
            <div className="relative min-h-[360px] bg-zinc-950/50 p-6 rounded-b-xl flex flex-col md:flex-row items-center justify-center gap-8 overflow-hidden">
              
              {/* Trigger Node */}
              <div className="z-10 w-64 rounded-xl border border-amber-500/30 bg-zinc-900/80 p-4 shadow-lg hover:border-amber-400/50 transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                      <Zap className="size-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Webhook Trigger</h4>
                      <p className="text-[10px] text-zinc-500">Inbound REST request</p>
                    </div>
                  </div>
                  <span className="size-2.5 rounded-full bg-amber-500 animate-ping" />
                </div>
                <div className="mt-3 border-t border-zinc-800/80 pt-2 text-[10px] text-zinc-400 font-mono">
                  POST /webhooks/auth-events
                </div>
              </div>

              {/* Connector line 1 */}
              <div className="hidden md:block w-16 h-0.5 bg-gradient-to-r from-amber-500/60 to-violet-500/60 relative">
                <div className="absolute top-1/2 left-0 -translate-y-1/2 size-2 rounded-full bg-violet-400 animate-[moveRight_2s_infinite]" />
              </div>

              {/* Logic Transform Node */}
              <div className="z-10 w-64 rounded-xl border border-violet-500/30 bg-zinc-900/80 p-4 shadow-lg hover:border-violet-400/50 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                      <Cpu className="size-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Condition Filter</h4>
                      <p className="text-[10px] text-zinc-500">IP failed‑login count</p>
                    </div>
                  </div>
                  <span className="size-2 rounded-full bg-zinc-600" />
                </div>
                <div className="mt-3 border-t border-zinc-800/80 pt-2 text-[10px] text-zinc-400 font-mono">
                  if failed_count &gt;= 5
                </div>
              </div>

              {/* Connector line 2 */}
              <div className="hidden md:block w-16 h-0.5 bg-gradient-to-r from-violet-500/60 to-emerald-500/60 relative">
                <div className="absolute top-1/2 left-0 -translate-y-1/2 size-2 rounded-full bg-emerald-400 animate-[moveRight_2s_infinite_delay-1000]" />
              </div>

              {/* Action Output Node */}
              <div className="z-10 w-64 rounded-xl border border-emerald-500/30 bg-zinc-900/80 p-4 shadow-lg hover:border-emerald-400/50 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Bot className="size-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Slack Notify</h4>
                      <p className="text-[10px] text-zinc-500">Slack SOC Channel</p>
                    </div>
                  </div>
                  <div className="flex size-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="size-3" />
                  </div>
                </div>
                <div className="mt-3 border-t border-zinc-800/80 pt-2 text-[10px] text-zinc-400 font-mono">
                  Payload: SOC security warning
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* -------------------------------------------------- */}
      {/* Features Grid                                      */}
      {/* -------------------------------------------------- */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 border-t border-zinc-900">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Streamline Complex Workflows
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-zinc-400">
            A comprehensive visual studio for building automated process pipelines. Integrate APIs, monitor data flows, and design complex systems easily.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          
          {/* Card 1 */}
          <div className="group rounded-2xl border border-zinc-800/80 bg-zinc-900/20 p-8 hover:border-zinc-700/80 transition-all duration-300">
            <div className="flex size-12 items-center justify-center rounded-xl bg-violet-600/10 text-violet-400 group-hover:scale-110 transition-transform">
              <Layers className="size-6" />
            </div>
            <h3 className="mt-6 text-lg font-bold text-white">Visual Flow Designer</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Drag-and-drop nodes to structure integrations. Easily create conditional branches, transform objects, and trigger events instantly.
            </p>
          </div>

          {/* Card 2 */}
          <div className="group rounded-2xl border border-zinc-800/80 bg-zinc-900/20 p-8 hover:border-zinc-700/80 transition-all duration-300">
            <div className="flex size-12 items-center justify-center rounded-xl bg-amber-600/10 text-amber-400 group-hover:scale-110 transition-transform">
              <Zap className="size-6" />
            </div>
            <h3 className="mt-6 text-lg font-bold text-white">Event-Driven Triggers</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Trigger processes based on incoming HTTP webhooks, cron-based schedules, or internal data model updates. Zero polling needed.
            </p>
          </div>

          {/* Card 3 */}
          <div className="group rounded-2xl border border-zinc-800/80 bg-zinc-900/20 p-8 hover:border-zinc-700/80 transition-all duration-300">
            <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <Activity className="size-6" />
            </div>
            <h3 className="mt-6 text-lg font-bold text-white">Execution Monitoring</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Track the exact input, execution duration, and output of every single node in your workflow runs. Perfect for logging and audit traces.
            </p>
          </div>

        </div>
      </section>

      {/* -------------------------------------------------- */}
      {/* Info / Callout Section (Architecture)              */}
      {/* -------------------------------------------------- */}
      <section id="architecture" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-t border-zinc-900">
        <div className="rounded-3xl border border-zinc-850 bg-gradient-to-b from-zinc-900/40 to-zinc-950/40 p-8 md:p-12 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="max-w-xl">
            <div className="inline-flex size-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Terminal className="size-5" />
            </div>
            <h2 className="mt-4 text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              Engineered for absolute reliability
            </h2>
            <p className="mt-4 text-base text-zinc-400 leading-relaxed">
              Every workflow step runs in an isolated, transactional context. The designer handles schema mapping, data filters, HTTP integrations, and notifications natively.
            </p>

            <ul className="mt-8 space-y-3.5">
              {[
                "Supabase data store for instant backups",
                "Advanced JSON mapping syntax (e.g., {{data.node_id.value}})",
                "Soft-delete mechanics to protect automated processes",
                "Built-in templates for finance audits & cyber alerts"
              ].map((text, idx) => (
                <li key={idx} className="flex items-center gap-3 text-sm text-zinc-300">
                  <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Graphical Representation */}
          <div className="w-full lg:w-96 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 flex flex-col gap-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Built-in templates</h4>
            
            <div className="rounded-xl border border-zinc-900 bg-zinc-900/30 p-4 hover:bg-zinc-900/50 transition-colors cursor-pointer flex items-center justify-between">
              <div>
                <h5 className="text-sm font-semibold text-white">Finance Audit Flow</h5>
                <p className="text-xs text-zinc-500">Cron Trigger + Data Filter + Mailer</p>
              </div>
              <ArrowUpRight className="size-4 text-zinc-500" />
            </div>

            <div className="rounded-xl border border-zinc-900 bg-zinc-900/30 p-4 hover:bg-zinc-900/50 transition-colors cursor-pointer flex items-center justify-between">
              <div>
                <h5 className="text-sm font-semibold text-white">SOC Incident Response</h5>
                <p className="text-xs text-zinc-500">Webhook + IP Threshold + Slack bot</p>
              </div>
              <ArrowUpRight className="size-4 text-zinc-500" />
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- */}
      {/* Bottom CTA                                         */}
      {/* -------------------------------------------------- */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 text-center border-t border-zinc-900">
        <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          Ready to scale your automation?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-zinc-400">
          Start visually constructing your processes. No credit card required, instant access.
        </p>
        <div className="mt-10 flex justify-center">
          <Link href="/dashboard">
            <Button size="lg" className="rounded-xl bg-violet-600 px-10 text-white shadow-lg shadow-violet-500/25 hover:bg-violet-500">
              Open Studio Now
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* -------------------------------------------------- */}
      {/* Footer                                             */}
      {/* -------------------------------------------------- */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div>
            &copy; {new Date().getFullYear()} ProcessFlow Studio. All rights reserved.
          </div>
          <div className="flex gap-6">
            <span className="flex items-center gap-1">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              Supabase Backend Active
            </span>
          </div>
        </div>
      </footer>

      {/* Custom Keyframe Animations (Tailwind arbitrary stylesheet injection fallback) */}
      <style jsx global>{`
        @keyframes moveRight {
          0% { left: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
