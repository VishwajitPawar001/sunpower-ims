'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { LeadsTable, INITIAL_LEADS } from '@/components/sales/LeadsTable';
import { QuoteGenerator } from '@/components/sales/QuoteGenerator';
import { SurveyorForm } from '@/components/surveyor/SurveyorForm';
import { DispatchScanner } from '@/components/warehouse/DispatchScanner';
import { SignoffCanvas } from '@/components/technician/SignoffCanvas';
import { MarginDashboard } from '@/components/director/MarginDashboard';
import { TicketDesk } from '@/components/support/TicketDesk';
import { UserRole, ProjectLead } from '@/types/solar';
import { 
  Building2, 
  Compass, 
  Cpu, 
  Boxes, 
  ClipboardCheck, 
  TrendingUp, 
  Sun, 
  Moon, 
  Play, 
  Pause, 
  Zap 
} from 'lucide-react';

const subscribe = () => () => {};

function mapToUserRole(roleStr: string | null): UserRole {
  if (!roleStr) return 'SALES';
  if (roleStr === 'ADMIN' || roleStr === 'DIRECTOR') return 'DIRECTOR';
  if (roleStr === 'SURVEYOR') return 'SURVEYOR';
  if (roleStr === 'WAREHOUSE') return 'WAREHOUSE';
  if (roleStr === 'TECHNICIAN') return 'TECHNICIAN';
  return 'SALES';
}

const STAGES = [
  { id: 'sales-leads', label: '1. Commercial CRM', code: 'CRM', icon: Building2 },
  { id: 'surveyor-form', label: '2. Site Feasibility', code: 'SRV', icon: Compass },
  { id: 'sales-quotes', label: '3. Engineering BOM', code: 'BOM', icon: Cpu },
  { id: 'warehouse-dispatch', label: '4. Warehouse Dispatch', code: 'DSP', icon: Boxes },
  { id: 'technician-signoff', label: '5. Field Commissioning', code: 'SIG', icon: ClipboardCheck },
  { id: 'director-margins', label: '6. Margin & P&L Audit', code: 'FIN', icon: TrendingUp },
];

export default function DashboardPage() {
  const router = useRouter();
  const isMounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const [currentRole, setCurrentRole] = useState<UserRole>('SALES');
  const [activeView, setActiveView] = useState<string>('sales-leads');
  const [activeProject, setActiveProject] = useState<ProjectLead>(INITIAL_LEADS[0]);
  const [userName, setUserName] = useState<string>('Operations User');

  const [theme, setTheme] = useState<'cockpit' | 'daylight'>('cockpit');
  const [generationKw, setGenerationKw] = useState(14.82);
  const [isAutoTouring, setIsAutoTouring] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGenerationKw((prev) => {
        const delta = (Math.random() - 0.48) * 0.08;
        return Number(Math.max(12.4, Math.min(18.5, prev + delta)).toFixed(2));
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isAutoTouring) return;
    const interval = setInterval(() => {
      setActiveView((prev) => {
        const currentIndex = STAGES.findIndex((s) => s.id === prev);
        const nextIndex = (currentIndex + 1) % STAGES.length;
        return STAGES[nextIndex].id;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [isAutoTouring]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window === 'undefined') return;

      const token = localStorage.getItem('sunpower_auth_token');
      if (!token) {
        router.replace('/login');
        return;
      }

      const storedRole = localStorage.getItem('sunpower_user_role');
      const storedName = localStorage.getItem('sunpower_user_name');

      if (storedName && storedName !== 'undefined') {
        setUserName(storedName);
      }

      const params = new URLSearchParams(window.location.search);
      const paramRole = params.get('role');
      const paramView = params.get('view');

      const rawRole = paramRole || storedRole;
      const effectiveRole = mapToUserRole(rawRole);
      setCurrentRole(effectiveRole);

      if (paramView) {
        setActiveView(paramView);
      } else {
        switch (effectiveRole) {
          case 'TECHNICIAN':
            setActiveView('technician-signoff');
            break;
          case 'WAREHOUSE':
            setActiveView('warehouse-dispatch');
            break;
          case 'SURVEYOR':
            setActiveView('surveyor-form');
            break;
          case 'DIRECTOR':
            setActiveView('director-margins');
            break;
          default:
            setActiveView(rawRole === 'SUPPORT' ? 'support-tickets' : 'sales-leads');
            break;
        }
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('sunpower_auth_token');
    localStorage.removeItem('sunpower_user_role');
    localStorage.removeItem('sunpower_user_name');
    router.replace('/login');
  };

  const handleSelectProject = (project: ProjectLead) => {
    setActiveProject(project);

    const canSwitchRoles = currentRole === 'DIRECTOR';

    switch (project.status) {
      case 'SURVEY_PENDING':
        if (canSwitchRoles) setCurrentRole('SURVEYOR');
        setActiveView('surveyor-form');
        break;
      case 'SURVEY_APPROVED':
        if (canSwitchRoles) setCurrentRole('SALES');
        setActiveView('sales-quotes');
        break;
      case 'ORDER_CONFIRMED':
        if (canSwitchRoles) setCurrentRole('WAREHOUSE');
        setActiveView('warehouse-dispatch');
        break;
      case 'COMMISSIONED':
      case 'COMPLETED':
        if (canSwitchRoles) setCurrentRole('TECHNICIAN');
        setActiveView('technician-signoff');
        break;
      default:
        setActiveView('sales-leads');
        break;
    }
  };

  if (!isMounted) {
    return <div className="h-screen bg-[#060A12]" />;
  }

  const isDark = theme === 'cockpit';

  return (
    <div className={`flex h-screen overflow-hidden font-sans antialiased transition-colors duration-200 ${
      isDark ? 'bg-[#060A12] text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* 72px Aerospace Command Rail */}
      <Sidebar
        currentRole={currentRole}
        onRoleSelect={(role) => setCurrentRole(role)}
        activeView={activeView}
        onViewChange={(view) => setActiveView(view)}
        onLogout={handleLogout}
        enforceRbac={currentRole !== 'DIRECTOR'}
      />

      {/* Main SCADA Operations Canvas */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mission-Control EPC Telemetry Header */}
        <header className={`border-b select-none transition-colors duration-200 z-10 sticky top-0 shadow-lg ${
          isDark ? 'bg-[#0B111E] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          {/* Micro Telemetry Strip */}
          <div className={`px-6 py-2 border-b flex items-center justify-between text-[11px] font-mono transition-colors ${
            isDark ? 'bg-[#060A12]/80 border-slate-800/60' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <div className="flex items-center gap-6">
              {/* Grid Interconnect Status */}
              <div className="flex items-center gap-2 text-emerald-400 font-semibold tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>GRID INTERCONNECT: 50.02 Hz</span>
              </div>

              {/* Sine Waveform */}
              <div className="hidden lg:flex items-center gap-2 text-slate-400">
                <span className="text-[10px] tracking-wider">INVERTER SINE:</span>
                <svg className="w-16 h-3 text-amber-500" viewBox="0 0 100 20">
                  <path
                    d="M0 10 Q 12.5 0, 25 10 T 50 10 T 75 10 T 100 10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="animate-pulse"
                  />
                </svg>
              </div>

              {/* Live Yield Counter */}
              <div className="hidden sm:flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-400">Array Yield:</span>
                <span className="font-bold text-amber-400">{generationKw} kWp</span>
              </div>
            </div>

            {/* Right HUD Controls */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsAutoTouring(!isAutoTouring)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-sans font-bold tracking-wider transition-all cursor-pointer ${
                  isAutoTouring
                    ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                    : isDark
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                    : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                {isAutoTouring ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
                {isAutoTouring ? 'PAUSE AUTO-TOUR' : 'DEMO AUTO-TOUR'}
              </button>

              <button
                type="button"
                onClick={() => setTheme(isDark ? 'daylight' : 'cockpit')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded border text-[11px] font-sans font-medium transition-colors cursor-pointer ${
                  isDark 
                    ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800' 
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {isDark ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Daylight Field</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Cockpit Dark</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
                <span className="text-slate-400 font-sans text-xs">Operator:</span>
                <span className="font-semibold font-sans text-xs text-amber-400">{userName}</span>
              </div>
            </div>
          </div>

          {/* Interactive 6-Stage EPC Pipeline Stepper */}
          <div className="px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <div className={`px-3.5 py-1.5 rounded-lg border flex flex-col ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Active Dossier</span>
                <span className="text-xs font-bold font-mono flex items-center gap-2">
                  <span className={isDark ? 'text-white' : 'text-slate-900'}>
                    {activeProject?.projectCode || 'SP-2026-001'}
                  </span>
                  <span className="text-slate-500 font-normal">•</span>
                  <span className="text-amber-500 font-sans font-semibold">
                    {activeProject?.customerName || 'Industrial Lead'}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {STAGES.map((step, idx) => {
                const Icon = step.icon;
                const isCurrent = activeView === step.id;

                return (
                  <React.Fragment key={step.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAutoTouring(false);
                        setActiveView(step.id);
                      }}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        isCurrent
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/25 ring-1 ring-amber-400'
                          : isDark
                          ? 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800/80 hover:text-white'
                          : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-slate-950' : 'text-slate-400'}`} />
                      <span>{step.label}</span>
                    </button>

                    {idx < STAGES.length - 1 && (
                      <div className={`w-3 h-[2px] shrink-0 ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </header>

        {/* Dynamic Canvas */}
        <main className={`flex-1 overflow-y-auto p-6 md:p-8 relative transition-colors duration-200 ${
          isDark ? 'bg-[#080D1A]' : 'bg-slate-50'
        }`}>
          {isDark && (
            <>
              <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
            </>
          )}

          <div className="max-w-7xl mx-auto relative z-10">
            {activeView === 'sales-leads' && (
              <LeadsTable onSelectProject={handleSelectProject} />
            )}
            {activeView === 'sales-quotes' && <QuoteGenerator />}
            {activeView === 'surveyor-form' && <SurveyorForm />}
            {activeView === 'warehouse-dispatch' && <DispatchScanner />}
            {activeView === 'technician-signoff' && <SignoffCanvas />}
            {activeView === 'director-margins' && <MarginDashboard />}
            {activeView === 'support-tickets' && <TicketDesk />}
          </div>
        </main>
      </div>
    </div>
  );
}