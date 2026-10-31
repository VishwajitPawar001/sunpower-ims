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
  ChevronRight,
  type LucideIcon
} from 'lucide-react';
import { UserRole } from '@/types/solar';

interface SidebarProps {
  currentRole: UserRole;
  onRoleSelect: (role: UserRole) => void;
  activeView: string;
  onViewChange: (view: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  role: UserRole;
  icon: LucideIcon;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'sales-leads', label: 'Sales CRM & Leads', role: 'SALES', icon: Users, description: 'Pipeline & Quotes' },
  { id: 'surveyor-form', label: 'Field Site Survey', role: 'SURVEYOR', icon: Compass, description: 'Roof Azimuth & Viability' },
  { id: 'warehouse-dispatch', label: 'Hardware Dispatch', role: 'WAREHOUSE', icon: Warehouse, description: 'Serial Number Scanner' },
  { id: 'technician-signoff', label: 'Field Ops Sign-Off', role: 'TECHNICIAN', icon: Wrench, description: 'Electrical Test & Glass Sign' },
  { id: 'director-margins', label: 'Executive Margins', role: 'DIRECTOR', icon: LineChart, description: 'Profit & Warranty Health' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  onRoleSelect,
  activeView,
  onViewChange,
}) => {
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

      {/* Role Emulation Switcher */}
      <div className="p-4 border-b border-slate-800">
        <label className="block text-[11px] uppercase tracking-wider text-enterprise-smoke font-semibold mb-2">
          Switch Operator Role
        </label>
        <select
          value={currentRole}
          onChange={(e) => {
            const role = e.target.value as UserRole;
            onRoleSelect(role);
            const targetNav = NAV_ITEMS.find((item) => item.role === role);
            if (targetNav) onViewChange(targetNav.id);
          }}
          className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-enterprise-blue"
        >
          <option value="SALES">Sales Representative</option>
          <option value="SURVEYOR">Field Surveyor</option>
          <option value="WAREHOUSE">Warehouse Dispatcher</option>
          <option value="TECHNICIAN">Installation Technician</option>
          <option value="DIRECTOR">Business Director</option>
        </select>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
        <div className="text-[11px] uppercase tracking-wider text-enterprise-smoke font-semibold px-3 mb-2">
          Role Views
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          const isRoleMatched = currentRole === item.role;

          return (
            <button
              key={item.id}
              onClick={() => {
                onRoleSelect(item.role);
                onViewChange(item.id);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded text-left transition-colors ${
                isActive
                  ? 'bg-enterprise-blue text-white shadow-sm font-medium'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-enterprise-smoke'}`} />
                <div>
                  <div className="text-sm leading-tight flex items-center gap-2">
                    {item.label}
                    {isRoleMatched && (
                      <span className="w-1.5 h-1.5 rounded-full bg-enterprise-forest" />
                    )}
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

      {/* User Session Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200">
            {currentRole.substring(0, 2)}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">Authorized Station</p>
            <p className="text-xs text-enterprise-smoke truncate">Node: worker-edge-01</p>
          </div>
        </div>
      </div>
    </aside>
  );
};