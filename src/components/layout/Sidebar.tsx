'use client';

import React from 'react';
import { 
  Users, 
  Compass, 
  Warehouse, 
  Wrench, 
  LineChart, 
  SunMedium, 
  ShieldCheck, 
  Lock,
  ChevronRight,
  LifeBuoy,
  LogOut,
  type LucideIcon 
} from 'lucide-react';
import { UserRole } from '@/types/solar';

interface SidebarProps {
  currentRole: UserRole;
  onRoleSelect: (role: UserRole) => void;
  activeView: string;
  onViewChange: (view: string) => void;
  onLogout?: () => void;
  enforceRbac?: boolean;
}

interface NavItem {
  id: string;
  label: string;
  allowedRoles: UserRole[];
  icon: LucideIcon;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  { 
    id: 'sales-leads', 
    label: 'Sales CRM & Leads', 
    allowedRoles: ['SALES', 'DIRECTOR', 'ADMIN'], 
    icon: Users, 
    description: 'Pipeline & Inquiry Entry' 
  },
  { 
    id: 'sales-quotes', 
    label: 'Quote & BOM Engine', 
    allowedRoles: ['SALES', 'DIRECTOR', 'ADMIN'], 
    icon: LineChart, 
    description: 'Package Sizing & Costs' 
  },
  { 
    id: 'surveyor-form', 
    label: 'Field Site Survey', 
    allowedRoles: ['SURVEYOR', 'DIRECTOR', 'ADMIN'], 
    icon: Compass, 
    description: 'Roof Azimuth & Feasibility' 
  },
  { 
    id: 'warehouse-dispatch', 
    label: 'Hardware Dispatch', 
    allowedRoles: ['WAREHOUSE', 'DIRECTOR', 'ADMIN'], 
    icon: Warehouse, 
    description: 'BOM Serial Scanner' 
  },
  { 
    id: 'technician-signoff', 
    label: 'Field Ops Sign-Off', 
    allowedRoles: ['TECHNICIAN', 'DIRECTOR', 'ADMIN'], 
    icon: Wrench, 
    description: 'Electrical & SVG Signature' 
  },
  { 
    id: 'director-margins', 
    label: 'Executive Margins', 
    allowedRoles: ['DIRECTOR', 'ADMIN'], 
    icon: LineChart, 
    description: 'Unit Economics & SLA' 
  },
  { 
    id: 'support-tickets', 
    label: 'Support Ticket Desk', 
    allowedRoles: ['SALES', 'SUPPORT', 'DIRECTOR', 'ADMIN'], 
    icon: LifeBuoy, 
    description: 'Post-Install & Warranty' 
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  onRoleSelect,
  activeView,
  onViewChange,
  onLogout,
  enforceRbac = true, // Default to strict RBAC
}) => {
  // Only Directors/Admins can toggle personas
  const canSwitchRoles = currentRole === 'DIRECTOR' || currentRole === 'ADMIN';

  return (
    <aside className="w-72 bg-enterprise-navy text-enterprise-bg flex flex-col h-screen border-r border-enterprise-navy shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-enterprise-blue flex items-center justify-center text-white shadow-sm">
            <SunMedium className="w-6 h-6 text-slate-100" />
          </div>
          <div>
            <h1 className="font-semibold text-base text-white tracking-tight">SunPower Core</h1>
            <p className="text-xs text-enterprise-smoke font-medium">Enterprise EPC Suite</p>
          </div>
        </div>
        <ShieldCheck className="w-5 h-5 text-enterprise-forest" />
      </div>

      {/* Role Display / Switcher */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-[11px] uppercase tracking-wider text-enterprise-smoke font-semibold">
            Operator Session Role
          </label>
          {!canSwitchRoles && (
            <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
              <Lock className="w-3 h-3 text-slate-500" /> Locked
            </span>
          )}
        </div>

        {canSwitchRoles ? (
          // Admin Context Switcher
          <select
            suppressHydrationWarning
            value={currentRole}
            onChange={(e) => {
              const role = e.target.value as UserRole;
              onRoleSelect(role);
              const firstAllowed = NAV_ITEMS.find((item) => item.allowedRoles.includes(role));
              if (firstAllowed) onViewChange(firstAllowed.id);
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-enterprise-blue cursor-pointer"
          >
            <option value="DIRECTOR">Business Director (Admin)</option>
            <option value="SALES">Sales Representative</option>
            <option value="SURVEYOR">Field Surveyor</option>
            <option value="WAREHOUSE">Warehouse Dispatcher</option>
            <option value="TECHNICIAN">Installation Technician</option>
          </select>
        ) : (
          // Standard User: Locked Role Badge (Cannot Change)
          <div className="w-full bg-slate-900/80 border border-slate-800 rounded px-3 py-2 text-xs font-semibold text-slate-200 flex items-center justify-between">
            <span>{currentRole} WORKSPACE</span>
            <span className="w-2 h-2 rounded-full bg-enterprise-forest" />
          </div>
        )}
      </div>

      {/* Navigation Links with RBAC Enforcement */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
        <div className="text-[11px] uppercase tracking-wider text-enterprise-smoke font-semibold px-3 mb-2">
          Authorized Views
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          const isPermitted = item.allowedRoles.includes(currentRole);

          // Strictly hide non-permitted views if enforceRbac is true
          if (enforceRbac && !isPermitted) return null;

          return (
            <button
              key={item.id}
              suppressHydrationWarning
              disabled={!isPermitted}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded text-left transition-colors cursor-pointer ${
                !isPermitted
                  ? 'opacity-30 cursor-not-allowed hidden'
                  : isActive
                  ? 'bg-enterprise-blue text-white shadow-sm font-medium'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-enterprise-smoke'}`} />
                <div>
                  <div className="text-sm leading-tight flex items-center gap-2">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-enterprise-smoke leading-tight mt-0.5">
                    {item.description}
                  </div>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-600'}`} />
            </button>
          );
        })}
      </nav>

      {/* Footer Node */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200">
            {currentRole.substring(0, 2)}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-medium text-white truncate">Role: {currentRole}</p>
            <p className="text-[10px] text-enterprise-smoke truncate">Session: TLS 1.3 Strict</p>
          </div>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-red-400 rounded hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};