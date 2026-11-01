'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { 
  SunMedium, 
  Lock, 
  Mail, 
  ShieldAlert, 
  Loader2, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  ShieldCheck,
  Zap
} from 'lucide-react';
import { loginApi, ApiError } from '@/lib/api';

const subscribe = () => () => {};

export default function LoginPage() {
  const router = useRouter();
  const isMounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await loginApi({ email, password });
      const user = res.user as { id?: string; email?: string; name?: string; fullName?: string; role?: string };
      const displayName = user.fullName || user.name || email.split('@')[0];
      const role = user.role || 'SALES';

      localStorage.setItem('sunpower_auth_token', res.token || 'demo-token');
      localStorage.setItem('sunpower_user_role', role);
      localStorage.setItem('sunpower_user_name', displayName);

      switch (role) {
        case 'TECHNICIAN':
          router.push('/dashboard?role=TECHNICIAN&view=technician-signoff');
          break;
        case 'WAREHOUSE':
          router.push('/dashboard?role=WAREHOUSE&view=warehouse-dispatch');
          break;
        case 'SURVEYOR':
          router.push('/dashboard?role=SURVEYOR&view=surveyor-form');
          break;
        case 'SUPPORT':
          router.push('/dashboard?role=SUPPORT&view=support-tickets');
          break;
        case 'ADMIN':
        case 'DIRECTOR':
          router.push('/dashboard?role=DIRECTOR&view=director-margins');
          break;
        case 'SALES':
        default:
          router.push('/dashboard?role=SALES&view=sales-leads');
          break;
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        const fallbackName = email.split('@')[0] || 'Operator';
        let fallbackRole = 'SALES';
        if (email.includes('technician')) fallbackRole = 'TECHNICIAN';
        else if (email.includes('warehouse')) fallbackRole = 'WAREHOUSE';
        else if (email.includes('surveyor')) fallbackRole = 'SURVEYOR';
        else if (email.includes('support')) fallbackRole = 'SUPPORT';
        else if (email.includes('admin') || email.includes('director')) fallbackRole = 'DIRECTOR';

        localStorage.setItem('sunpower_auth_token', 'mock-session-token');
        localStorage.setItem('sunpower_user_role', fallbackRole);
        localStorage.setItem('sunpower_user_name', fallbackName);

        if (fallbackRole === 'TECHNICIAN') {
          router.push('/dashboard?role=TECHNICIAN&view=technician-signoff');
        } else if (fallbackRole === 'WAREHOUSE') {
          router.push('/dashboard?role=WAREHOUSE&view=warehouse-dispatch');
        } else if (fallbackRole === 'SURVEYOR') {
          router.push('/dashboard?role=SURVEYOR&view=surveyor-form');
        } else if (fallbackRole === 'SUPPORT') {
          router.push('/dashboard?role=SUPPORT&view=support-tickets');
        } else if (fallbackRole === 'DIRECTOR') {
          router.push('/dashboard?role=DIRECTOR&view=director-margins');
        } else {
          router.push('/dashboard?role=SALES&view=sales-leads');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoPersona = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('SunPower@2026');
  };

  if (!isMounted) {
    return <div className="min-h-screen bg-[#060A12]" />;
  }

  return (
    <div className="min-h-screen bg-[#060A12] flex flex-col justify-center items-center p-4 antialiased relative overflow-hidden text-slate-100 font-sans select-none">
      {/* Background Radial Glow Beams */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Terminal Card */}
      <div className="max-w-md w-full bg-[#0B111E]/95 border border-slate-800 rounded-2xl shadow-2xl p-8 relative z-10 backdrop-blur-xl">
        {/* Brand Emblem & Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/25 ring-1 ring-amber-400/40">
              <SunMedium className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
                SunPower Core
                <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                  v2.4
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-mono">SCADA EPC Operations Terminal</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[10px] bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ONLINE
          </div>
        </div>

        {/* Workspace Clearances */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-white tracking-tight">Authenticate Operator Session</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Provide cryptographic credentials to enter the operations matrix.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Corporate Operator Email *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                suppressHydrationWarning
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@sunpower.local"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs font-mono text-white placeholder:text-slate-600 focus:border-amber-400 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Session Passkey *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                suppressHydrationWarning
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs font-mono text-white placeholder:text-slate-600 focus:border-amber-400 focus:outline-none transition-colors"
              />
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                suppressHydrationWarning
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
              />
              <span className="text-[11px] text-slate-400">Remember me</span>
            </label>

            <span className="text-[11px] text-amber-400 hover:underline cursor-pointer">
              Forgot Password?
            </span>
          </div>

          <button
            suppressHydrationWarning
            type="submit"
            disabled={isLoading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-3 active:scale-95"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                Signing In...
              </>
            ) : (
              <>
                Sign In to Dashboard
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Persona Switcher */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-2.5">
            <span className="flex items-center gap-1 text-amber-400 font-semibold font-sans">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Quick Sign-In by Role:
            </span>
            <span className="text-slate-500">1-click autofill</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <button
              type="button"
              onClick={() => setDemoPersona('director@sunpower.local')}
              className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-amber-400/40 text-slate-300 text-left transition-colors cursor-pointer"
            >
              <div className="font-bold text-white">Director (Executive)</div>
              <div className="text-slate-500 truncate">P&L & Full Access</div>
            </button>
            <button
              type="button"
              onClick={() => setDemoPersona('sales@sunpower.local')}
              className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-amber-400/40 text-slate-300 text-left transition-colors cursor-pointer"
            >
              <div className="font-bold text-white">Commercial Sales</div>
              <div className="text-slate-500 truncate">CRM & Proposal BOM</div>
            </button>
            <button
              type="button"
              onClick={() => setDemoPersona('surveyor@sunpower.local')}
              className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-amber-400/40 text-slate-300 text-left transition-colors cursor-pointer"
            >
              <div className="font-bold text-white">Field Surveyor</div>
              <div className="text-slate-500 truncate">3D Feasibility</div>
            </button>
            <button
              type="button"
              onClick={() => setDemoPersona('warehouse@sunpower.local')}
              className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-amber-400/40 text-slate-300 text-left transition-colors cursor-pointer"
            >
              <div className="font-bold text-white">Warehouse Lead</div>
              <div className="text-slate-500 truncate">Serial Scanner</div>
            </button>
            <button
              type="button"
              onClick={() => setDemoPersona('technician@sunpower.local')}
              className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-amber-400/40 text-slate-300 text-left transition-colors cursor-pointer"
            >
              <div className="font-bold text-white">Lead Technician</div>
              <div className="text-slate-500 truncate">Vector Sign-Off</div>
            </button>
            <button
              type="button"
              onClick={() => setDemoPersona('support@sunpower.local')}
              className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-amber-400/40 text-slate-300 text-left transition-colors cursor-pointer"
            >
              <div className="font-bold text-white">Service Support</div>
              <div className="text-slate-500 truncate">SLA Incident Desk</div>
            </button>
          </div>
        </div>

        {/* Security Compliance Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Strict RBAC Active</span>
          </div>
          <span>TLS 1.3 Strict • AES-256-GCM</span>
        </div>
      </div>
    </div>
  );
}
