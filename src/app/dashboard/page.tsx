'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { LeadsTable, INITIAL_LEADS } from '@/components/sales/LeadsTable';
import { QuoteGenerator } from '@/components/sales/QuoteGenerator';
import { SurveyorForm } from '@/components/surveyor/SurveyorForm';
import { DispatchScanner } from '@/components/warehouse/DispatchScanner';
import { SignoffCanvas } from '@/components/technician/SignoffCanvas';
import { MarginDashboard } from '@/components/director/MarginDashboard';
import { UserRole, ProjectLead } from '@/types/solar';

const subscribe = () => () => {};

export default function DashboardPage() {
  const isMounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const [currentRole, setCurrentRole] = useState<UserRole>('SALES');
  const [activeView, setActiveView] = useState<string>('sales-leads');
  const [activeProject, setActiveProject] = useState<ProjectLead>(INITIAL_LEADS[0]);

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

          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="text-enterprise-smoke">Session: Standard TLS 1.3 / Strict RBAC</span>
            <span className="w-2 h-2 rounded-full bg-enterprise-forest" />
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
        </div>
      </main>
    </div>
  );
}