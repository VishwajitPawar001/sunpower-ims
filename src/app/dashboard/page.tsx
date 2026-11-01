'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { LeadsTable } from '@/components/sales/LeadsTable';
import { QuoteGenerator } from '@/components/sales/QuoteGenerator';
import { SurveyorForm } from '@/components/surveyor/SurveyorForm';
import { DispatchScanner } from '@/components/warehouse/DispatchScanner';
import { SignoffCanvas } from '@/components/technician/SignoffCanvas';
import { MarginDashboard } from '@/components/director/MarginDashboard';
import { TicketDesk } from '@/components/support/TicketDesk';
import { UserRole, ProjectLead } from '@/types/solar';
import { getLeadsApi } from '@/lib/api';
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
  Zap,
  LogOut,
  FolderOpen,
  Headphones
} from 'lucide-react';

const subscribe = () => () => {};

function mapToUserRole(roleStr: string | null): UserRole {
  if (!roleStr) return 'SALES';
  if (roleStr === 'ADMIN' || roleStr === 'DIRECTOR') return 'DIRECTOR';
  if (roleStr === 'SURVEYOR') return 'SURVEYOR';
  if (roleStr === 'WAREHOUSE') return 'WAREHOUSE';
  if (roleStr === 'TECHNICIAN') return 'TECHNICIAN';
  if (roleStr === 'SUPPORT') return 'SUPPORT';
  return 'SALES';
}

const STAGES = [
  { id: 'sales-leads', label: '1. Leads & CRM', allowedRoles: ['SALES', 'DIRECTOR'], icon: Building2 },
  { id: 'surveyor-form', label: '2. Site Survey', allowedRoles: ['SURVEYOR', 'DIRECTOR'], icon: Compass },
  { id: 'sales-quotes', label: '3. Quote & BOM', allowedRoles: ['SALES', 'DIRECTOR'], icon: Cpu },
  { id: 'warehouse-dispatch', label: '4. Dispatch', allowedRoles: ['WAREHOUSE', 'DIRECTOR'], icon: Boxes },
  { id: 'technician-signoff', label: '5. Commissioning', allowedRoles: ['TECHNICIAN', 'DIRECTOR'], icon: ClipboardCheck },
  { id: 'director-margins', label: '6. Margins & P&L', allowedRoles: ['DIRECTOR'], icon: TrendingUp },
  { id: 'support-tickets', label: '7. Service Desk', allowedRoles: ['SUPPORT', 'SALES', 'DIRECTOR'], icon: Headphones },
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
  const [projects, setProjects] = useState<ProjectLead[]>([]);
  const [activeProject, setActiveProject] = useState<ProjectLead | null>(null);
  const [userName, setUserName] = useState<string>('Operations User');

  const [theme, setTheme] = useState<'cockpit' | 'daylight'>('cockpit');
  const [generationKw, setGenerationKw] = useState(14.82);
  const [isAutoTouring, setIsAutoTouring] = useState(false);

  // Load real projects from database API
  useEffect(() => {
    let ignore = false;
    getLeadsApi()
      .then((data) => {
        if (!ignore && Array.isArray(data) && data.length > 0) {
          setProjects(data);
          setActiveProject((prev) => {
            if (!prev) return data[0];
            const updated = data.find((p) => p.id === prev.id);
            return updated || data[0];
          });
        }
      })
      .catch((err) => {
        console.error('Failed to load project dossiers from API:', err);
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Filter pipeline stepper stages based on operator permissions
  const authorizedStages = STAGES.filter(
    (step) => currentRole === 'DIRECTOR' || step.allowedRoles.includes(currentRole)
  );

  // Live IoT telemetry: Subtle array yield variation
  useEffect(() => {
    const interval = setInterval(() => {
      setGenerationKw((prev) => {
        const delta = (Math.random() - 0.48) * 0.08;
        return Number(Math.max(12.4, Math.min(18.5, prev + delta)).toFixed(2));
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Demo auto-tour: Cycles through authorized stages
  useEffect(() => {
    if (!isAutoTouring || authorizedStages.length <= 1) return;
    const interval = setInterval(() => {
      setActiveView((prev) => {
        const currentIndex = authorizedStages.findIndex((s) => s.id === prev);
        const nextIndex = (currentIndex + 1) % authorizedStages.length;
        return authorizedStages[nextIndex].id;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [isAutoTouring, authorizedStages]);

  // Session hydration
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
      case 'QUOTE_ISSUED':
      case 'ORDER_CONFIRMED':
        if (canSwitchRoles) setCurrentRole('WAREHOUSE');
        setActiveView('warehouse-dispatch');
        break;
      case 'DISPATCHED':
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

  const handleProjectUpdated = (updated: ProjectLead) => {
    setActiveProject(updated);
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleLeadCreated = (newLead: ProjectLead) => {
    setProjects((prev) => [newLead, ...prev]);
    setActiveProject(newLead);
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
              <div className="flex items-center gap-2 text-emerald-400 font-semibold tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>GRID INTERCONNECT: 50.02 Hz</span>
              </div>

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

              <div className="hidden sm:flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-400">Array Yield:</span>
                <span className="font-bold text-amber-400">{generationKw} kWp</span>
              </div>
            </div>

            {/* Right Controls: Auto-Tour, Theme, Profile & Logout */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsAutoTouring(!isAutoTouring)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-sans font-semibold tracking-wide transition-all cursor-pointer ${
                  isAutoTouring
                    ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                    : isDark
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                    : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                {isAutoTouring ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
                {isAutoTouring ? 'Pause Tour' : 'Auto Tour'}
              </button>

              <button
                type="button"
                onClick={() => setTheme(isDark ? 'daylight' : 'cockpit')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md border text-[11px] font-sans font-medium transition-colors cursor-pointer ${
                  isDark 
                    ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800' 
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {isDark ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
                <div className="text-right hidden sm:block">
                  <span className="text-slate-400 font-sans text-[10px] block leading-none">Signed in as</span>
                  <span className="font-semibold font-sans text-xs text-amber-400">{userName}</span>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sign out"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-sans font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>

          {/* EPC Pipeline & Assigned Project Selector */}
          <div className="px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Customer Project Selector */}
            <div className="flex items-center gap-3 shrink-0">
              <div className={`px-3.5 py-1.5 rounded-lg border flex flex-col ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase tracking-wider font-sans font-semibold">
                  <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>Selected Project:</span>
                </div>
                
                <select
                  value={activeProject?.id || ''}
                  onChange={(e) => {
                    const selected = projects.find((lead) => lead.id === e.target.value);
                    if (selected) handleSelectProject(selected);
                  }}
                  className={`text-xs font-bold font-mono outline-none cursor-pointer mt-0.5 ${
                    isDark ? 'bg-transparent text-amber-400' : 'bg-transparent text-slate-900'
                  }`}
                >
                  {projects.length === 0 ? (
                    <option value="">Loading projects...</option>
                  ) : (
                    projects.map((lead) => (
                      <option 
                        key={lead.id} 
                        value={lead.id}
                        className={isDark ? 'bg-[#0B111E] text-white font-sans' : 'bg-white text-slate-800 font-sans'}
                      >
                        {lead.projectCode} • {lead.customerName} ({lead.capacityKw} kW - {lead.status})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Stepper Buttons: Filtered by Operator Role Clearance */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {authorizedStages.map((step, idx) => {
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

                    {idx < authorizedStages.length - 1 && (
                      <div className={`w-3 h-[2px] shrink-0 ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </header>

        {/* Dynamic Canvas with Radial Lighting */}
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
              <LeadsTable
                onSelectProject={handleSelectProject}
                leads={projects}
                onLeadCreated={handleLeadCreated}
              />
            )}
            {activeView === 'sales-quotes' && (
              <QuoteGenerator
                key={activeProject?.id || 'empty-quote'}
                project={activeProject}
                onProjectUpdated={handleProjectUpdated}
              />
            )}
            {activeView === 'surveyor-form' && (
              <SurveyorForm
                key={activeProject?.id || 'empty-survey'}
                project={activeProject}
                onProjectUpdated={handleProjectUpdated}
              />
            )}
            {activeView === 'warehouse-dispatch' && (
              <DispatchScanner
                key={activeProject?.id || 'empty-dispatch'}
                project={activeProject}
                onProjectUpdated={handleProjectUpdated}
              />
            )}
            {activeView === 'technician-signoff' && (
              <SignoffCanvas
                key={activeProject?.id || 'empty-signoff'}
                project={activeProject}
                onProjectUpdated={handleProjectUpdated}
              />
            )}
            {activeView === 'director-margins' && <MarginDashboard />}
            {activeView === 'support-tickets' && (
              <TicketDesk
                key={activeProject?.id || 'empty-ticket'}
                project={activeProject}
                onProjectUpdated={handleProjectUpdated}
              />
            )}
          </div>
        </main>
      </div>
    </div>

);
}
