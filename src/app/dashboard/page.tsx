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
import { LogOut } from 'lucide-react';

const subscribe = () => () => {};

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

  // Read auth token, session role, and query parameters on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('sunpower_auth_token');
    const storedRole = localStorage.getItem('sunpower_user_role') as UserRole | null;
    const storedName = localStorage.getItem('sunpower_user_name');

    if (storedName) setUserName(storedName);

    // Parse URL query parameters if redirected from /login
    const params = new URLSearchParams(window.location.search);
    const paramRole = params.get('role') as UserRole | null;
    const paramView = params.get('view');

    if (paramRole) {
      setCurrentRole(paramRole);
    } else if (storedRole) {
      setCurrentRole(storedRole);
    }

    if (paramView) {
      setActiveView(paramView);
    } else if (storedRole) {
      // Route to default role view
      if (storedRole === 'TECHNICIAN') setActiveView('technician-signoff');
      else if (storedRole === 'WAREHOUSE') setActiveView('warehouse-dispatch');
      else if (storedRole === 'SURVEYOR') setActiveView('surveyor-form');
      else if (storedRole === 'DIRECTOR') setActiveView('director-margins');
      else setActiveView('sales-leads');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('sunpower_auth_token');
    localStorage.removeItem('sunpower_user_role');
    localStorage.removeItem('sunpower_user_name');
    router.push('/login');
  };

  const handleSelectProject = (project: ProjectLead) => {
    setActiveProject(project);

    switch (project.status) {
      case 'SURVEY_PENDING':
        setCurrentRole('SURVEYOR');
        setActiveView('surveyor-form');
        break;
      case 'SURVEY_APPROVED':
        setCurrentRole('SALES');
        setActiveView('sales-quotes');
        break;
      case 'ORDER_CONFIRMED':
        setCurrentRole('WAREHOUSE');
        setActiveView('warehouse-dispatch');
        break;
      case 'COMMISSIONED':
      case 'COMPLETED':
        setCurrentRole('TECHNICIAN');
        setActiveView('technician-signoff');
        break;
      default:
        setActiveView('sales-leads');
        break;
    }
  };

  if (!isMounted) {
    return <div className="h-screen bg-enterprise-bg" />;
  }

  return (
    <div className="flex h-screen bg-enterprise-bg overflow-hidden font-sans antialiased text-enterprise-charcoal">
      <Sidebar
        currentRole={currentRole}
        onRoleSelect={(role) => setCurrentRole(role)}
        activeView={activeView}
        onViewChange={(view) => setActiveView(view)}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="h-16 bg-enterprise-surface border-b border-enterprise-border px-8 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-enterprise-smoke">
              Active Context:
            </span>
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-enterprise-charcoal border border-enterprise-border">
              {currentRole} WORKSPACE
            </span>
            {activeProject && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-50 text-enterprise-blue border border-blue-200">
                {activeProject.projectCode} ({activeProject.customerName})
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* User Profile Pill */}
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-enterprise-border text-xs">
              <span className="w-2 h-2 rounded-full bg-enterprise-forest" />
              <span className="font-semibold text-enterprise-charcoal capitalize">
                {userName && userName !== 'undefined' ? userName : 'Operations User'}
              </span>
            </div>

            {/* Explicit Sign Out Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:text-enterprise-brick hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl w-full mx-auto">
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
  );
}