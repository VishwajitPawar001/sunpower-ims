'use client';

import React, { useState, useEffect } from 'react';
import { 
  Headphones, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Loader2, 
  X, 
  ShieldAlert, 
  Activity, 
  Zap, 
  Search, 
  Filter, 
  ArrowRight,
  Wrench,
  AlertOctagon
} from 'lucide-react';
import { getTicketsApi, updateTicketStatusApi, SupportTicket, ApiError } from '@/lib/api';

const MOCK_TICKETS: SupportTicket[] = [
  {
    id: 't-001',
    ticketCode: 'TCK-2026-012',
    projectId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    projectCode: 'PRJ-2026-088',
    customerName: 'Kaveri Industrial Mills',
    issueDescription: 'Inverter error code E03 (Grid overvoltage trip) during peak generation hours.',
    priority: 'HIGH',
    status: 'OPEN',
    createdAt: '2026-10-30',
  },
  {
    id: 't-002',
    ticketCode: 'TCK-2026-013',
    projectId: '8cb3897b-9442-45e0-9988-bb31f79f2910',
    projectCode: 'PRJ-2026-089',
    customerName: 'Dr. Aris Thorne',
    issueDescription: 'Customer requesting secondary sign-off copy for state subsidy documentation.',
    priority: 'LOW',
    status: 'OPEN',
    createdAt: '2026-10-31',
  },
];

export const TicketDesk: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>(MOCK_TICKETS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');

  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [targetStatus, setTargetStatus] = useState<'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('RESOLVED');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    getTicketsApi()
      .then((data) => {
        if (!ignore && Array.isArray(data) && data.length > 0) {
          setTickets(data);
        }
      })
      .catch(() => {
        // Fallback to initial mock tickets
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleUpdateStatus = async () => {
    if (!selectedTicket) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await updateTicketStatusApi(selectedTicket.id, targetStatus);
      setTickets((prev) =>
        prev.map((t) => (t.id === selectedTicket.id ? { ...t, status: targetStatus } : t))
      );
      setSelectedTicket(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setTickets((prev) =>
          prev.map((t) => (t.id === selectedTicket.id ? { ...t, status: targetStatus } : t))
        );
        setSelectedTicket(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            {priority}
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            MEDIUM
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            LOW
          </span>
        );
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            RESOLVED
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3 text-amber-400 animate-spin" />
            IN_PROGRESS
          </span>
        );
      case 'OPEN':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            OPEN
          </span>
        );
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.ticketCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.issueDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.projectCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openCount = tickets.filter((t) => t.status === 'OPEN').length;
  const highPriorityCount = tickets.filter((t) => t.priority === 'HIGH' || t.priority === 'CRITICAL').length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED').length;

  return (
    <div className="space-y-6 text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Service Desk & 20-Year SLA Incident Terminal
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-normal">
                  STAGE 07
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Post-commissioning warranty lifecycle, inverter telemetry faults, and dispatch tickets
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[#0B111E]/90 border border-slate-800 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Incident Queue</span>
            <Activity className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1.5">{openCount} Active</div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">Awaiting Field Mitigation</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0B111E]/90 border border-slate-800 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Critical Grid Trips</span>
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1.5">{highPriorityCount} Faults</div>
          <div className="text-[11px] text-rose-400/80 mt-0.5 font-mono">Inverter E03 / Voltage Surge</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0B111E]/90 border border-slate-800 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>20-Yr SLA Uptime</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1.5">99.4%</div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">Contractual Benchmark: &gt;98%</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0B111E]/90 border border-slate-800 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Resolved Incidents</span>
            <Wrench className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1.5">{resolvedCount} Units</div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">Mean MTTR: 2.4 Hours</div>
        </div>
      </div>

      {/* Control Strip: Search & Filter */}
      <div className="p-3 rounded-xl bg-[#0B111E]/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search incident code, customer, inverter diagnostic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 text-xs bg-slate-950/70 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED')}
            className="text-xs bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-amber-400 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Incident States</option>
            <option value="OPEN">OPEN</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </div>
      </div>

      {/* Incident Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0B111E]/90 overflow-hidden shadow-xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#070B14]/80 border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px] tracking-wider">
                <th className="py-3.5 px-5">Incident Code</th>
                <th className="py-3.5 px-5">Project Dossier</th>
                <th className="py-3.5 px-5">Customer Account</th>
                <th className="py-3.5 px-5">Fault Diagnostics / Inverter Log</th>
                <th className="py-3.5 px-5">Severity</th>
                <th className="py-3.5 px-5">SLA Status</th>
                <th className="py-3.5 px-5 text-right">Mitigation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
                    <span className="font-mono text-xs">Synchronizing SLA service desk records...</span>
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-300">No active SLA incidents match query.</p>
                    <p className="text-xs text-slate-500 mt-1">All commissioned micro-grids operating within tolerance.</p>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-4 px-5">
                      <span className="font-mono text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded border border-amber-400/20">
                        {t.ticketCode}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-mono font-medium text-slate-300">
                      {t.projectCode}
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-semibold text-white tracking-tight">{t.customerName}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{t.createdAt}</div>
                    </td>
                    <td className="py-4 px-5 text-slate-300 max-w-sm">
                      <p className="line-clamp-2">{t.issueDescription}</p>
                    </td>
                    <td className="py-4 px-5">
                      {renderPriorityBadge(t.priority)}
                    </td>
                    <td className="py-4 px-5">
                      {renderStatusBadge(t.status)}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTicket(t);
                          setTargetStatus(t.status === 'OPEN' ? 'RESOLVED' : (t.status as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'));
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-700 text-slate-200 hover:text-amber-400 hover:border-amber-400/50 hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
                      >
                        Mitigate
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-colors" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident Status Update Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-[#0B111E] border border-slate-700/80 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Wrench className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-white">SLA Mitigation Terminal</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-400 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-[11px] font-mono text-slate-400">Target Ticket</div>
                <div className="font-mono font-bold text-amber-400 text-sm mt-0.5">
                  {selectedTicket.ticketCode} • {selectedTicket.projectCode}
                </div>
                <div className="text-slate-300 font-medium mt-1">{selectedTicket.customerName}</div>
              </div>

              <div>
                <span className="text-slate-400 font-mono text-[11px]">Reported Telemetry Fault:</span>
                <p className="text-slate-200 mt-1 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 leading-relaxed">
                  {selectedTicket.issueDescription}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Transition SLA State To *
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED')}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none cursor-pointer"
                >
                  <option value="OPEN">OPEN (Queue Awaiting Dispatch)</option>
                  <option value="IN_PROGRESS">IN_PROGRESS (Technician On-Site)</option>
                  <option value="RESOLVED">RESOLVED (Telemetry Normalized)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleUpdateStatus}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-md shadow-amber-500/20 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer transition-all active:scale-95"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Commit Status Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};