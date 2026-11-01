'use client';

import React from 'react';
import { 
  Building2, 
  Compass, 
  Cpu, 
  Boxes, 
  ClipboardCheck, 
  TrendingUp, 
  Headphones, 
  SunMedium, 
  ShieldCheck, 
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

interface CommandRailItem {
  id: string;
  label: string;
  code: string;
  allowedRoles: UserRole[];
  icon: LucideIcon;
  subtext: string;
  hasLivePulse?: boolean;
}

const COMMAND_ITEMS: CommandRailItem[] = [
  { 
    id: 'sales-leads', 
    label: 'Leads & CRM', 
    code: '01',
    allowedRoles: ['SALES', 'DIRECTOR', 'ADMIN'], 
    icon: Building2, 
    subtext: 'Customer Pipeline' 
  },
  { 
    id: 'surveyor-form', 
    label: 'Site Survey', 
    code: '02',
    allowedRoles: ['SURVEYOR', 'DIRECTOR', 'ADMIN'], 
    icon: Compass, 
    subtext: 'Rooftop Feasibility' 
  },
  { 
    id: 'sales-quotes', 
    label: 'Quote & BOM', 
    code: '03',
    allowedRoles: ['SALES', 'DIRECTOR', 'ADMIN'], 
    icon: Cpu, 
    subtext: 'Sizing & Pricing' 
  },
  { 
    id: 'warehouse-dispatch', 
    label: 'Inventory Dispatch', 
    code: '04',
    allowedRoles: ['WAREHOUSE', 'DIRECTOR', 'ADMIN'], 
    icon: Boxes, 
    subtext: 'Hardware Serials',
    hasLivePulse: true
  },
  { 
    id: 'technician-signoff', 
    label: 'Commissioning', 
    code: '05',
    allowedRoles: ['TECHNICIAN', 'DIRECTOR', 'ADMIN'], 
    icon: ClipboardCheck, 
    subtext: 'Electrical Sign-off' 
  },
  { 
    id: 'director-margins', 
    label: 'Margins & P&L', 
    code: '06',
    allowedRoles: ['DIRECTOR', 'ADMIN'], 
    icon: TrendingUp, 
    subtext: 'Executive Financials' 
  },
  { 
    id: 'support-tickets', 
    label: 'Support Desk', 
    code: '07',
    allowedRoles: ['SUPPORT', 'SALES', 'DIRECTOR', 'ADMIN'], 
    icon: Headphones, 
    subtext: 'Warranty & Tickets' 
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  activeView,
  onViewChange,
  onLogout,
  enforceRbac = true,
}) => {
  const isPrivileged = currentRole === 'DIRECTOR' || currentRole === 'ADMIN';

  return (
    <aside className="w-[72px] bg-[#060A12] border-r border-slate-800/80 flex flex-col items-center justify-between py-4 select-none shrink-0 z-30 shadow-2xl">
      {/* Brand Emblem */}
      <div className="flex flex-col items-center gap-4 w-full">
        <div className="relative group cursor-pointer">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/25 ring-1 ring-amber-400/40 transition-transform active:scale-95">
            <SunMedium className="w-6 h-6 stroke-[2.4]" />
          </div>

          {/* Hover Flyout */}
          <div className="absolute left-16 top-1 hidden group-hover:flex items-center gap-2.5 whitespace-nowrap bg-slate-900/95 border border-slate-700/80 text-white text-xs px-3.5 py-2 rounded-lg shadow-2xl backdrop-blur-md z-50">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <p className="font-bold text-white leading-tight">SunPower Core</p>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider">EPC SCADA v2.4</p>
            </div>
          </div>
        </div>

        <div className="w-8 h-[1px] bg-slate-800" />

        {/* Role Pill */}
        <div className="relative group">
          <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-mono font-bold text-amber-400 tracking-wider">
            {currentRole.substring(0, 2)}
          </div>
          <div className="absolute left-16 top-0 hidden group-hover:flex flex-col whitespace-nowrap bg-slate-900 border border-slate-700 text-xs px-3.5 py-2 rounded-lg shadow-2xl z-50">
            <span className="text-white font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              {currentRole} WORKSPACE
            </span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">
              {isPrivileged ? 'Executive Clearance: Full Matrix Access' : 'Strict Role-Based Access Enforced'}
            </span>
          </div>
        </div>

        {/* Aerospace Command Rail */}
        <nav className="flex flex-col gap-2 mt-1">
          {COMMAND_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            const isPermitted = isPrivileged || item.allowedRoles.includes(currentRole);

            if (enforceRbac && !isPermitted) return null;

            return (
              <div key={item.id} className="relative group">
                <button
                  type="button"
                  suppressHydrationWarning
                  disabled={!isPermitted}
                  onClick={() => onViewChange(item.id)}
                  className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 border border-transparent'
                  }`}
                >
                  <Icon className="w-5 h-5 stroke-[1.8]" />

                  {/* Active Indicator Strip */}
                  {isActive && (
                    <span className="absolute -left-1 top-2.5 bottom-2.5 w-1 bg-amber-400 rounded-r shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                  )}

                  {/* Hardware Live Beacon */}
                  {item.hasLivePulse && !isActive && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse ring-2 ring-[#060A12]" />
                  )}
                </button>

                {/* Tactile Flyout Card */}
                <div className="absolute left-16 top-1 hidden group-hover:flex flex-col whitespace-nowrap bg-[#0B111E]/95 border border-slate-700/80 text-white text-xs px-3.5 py-2.5 rounded-lg shadow-2xl backdrop-blur-md z-50">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white tracking-tight">{item.label}</span>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 font-bold">
                      {item.code}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-0.5 font-normal">
                    {item.subtext}
                  </span>
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Sign Out Action */}
      <div className="flex flex-col items-center gap-3 w-full">
        <div className="w-8 h-[1px] bg-slate-800" />

        {onLogout && (
          <div className="relative group">
            <button
              type="button"
              onClick={onLogout}
              className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4 stroke-[2]" />
            </button>
            <div className="absolute left-16 bottom-2 hidden group-hover:flex whitespace-nowrap bg-slate-900 border border-slate-700 text-xs text-rose-400 px-3 py-1.5 rounded-lg shadow-2xl z-50">
              Sign Out
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
