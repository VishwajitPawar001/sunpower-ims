'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { LeadsTable } from '@/components/sales/LeadsTable';
import { SurveyorForm } from '@/components/surveyor/SurveyorForm';
import { DispatchScanner } from '@/components/warehouse/DispatchScanner';
import { SignoffCanvas } from '@/components/technician/SignoffCanvas';
import { MarginDashboard } from '@/components/director/MarginDashboard';
import { UserRole } from '@/types/solar';

export default function DashboardPage() {
  const [currentRole, setCurrentRole] = useState<UserRole>('SALES');
  const [activeView, setActiveView] = useState<string>('sales-leads');

  return (
    <div className="flex h-screen bg-enterprise-bg overflow-hidden font-sans antialiased text-enterprise-charcoal">
      {/* Sidebar with Role Switcher */}
      <Sidebar
        currentRole={currentRole}
        onRoleSelect={(role) => setCurrentRole(role)}
        activeView={activeView}
        onViewChange={(view) => setActiveView(view)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-16 bg-enterprise-surface border-b border-enterprise-border px-8 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-enterprise-smoke">
              Active Context:
            </span>
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-enterprise-charcoal border border-enterprise-border">
              {currentRole} WORKSPACE
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="text-enterprise-smoke">Session: Standard TLS 1.3 / Strict RBAC</span>
            <span className="w-2 h-2 rounded-full bg-enterprise-forest" />
          </div>
        </header>

        {/* View Surface Container */}
        <div className="p-8 max-w-7xl w-full mx-auto">
          {activeView === 'sales-leads' && <LeadsTable />}
          {activeView === 'surveyor-form' && <SurveyorForm />}
          {activeView === 'warehouse-dispatch' && <DispatchScanner />}
          {activeView === 'technician-signoff' && <SignoffCanvas />}
          {activeView === 'director-margins' && <MarginDashboard />}
        </div>
      </main>
    </div>
  );
}