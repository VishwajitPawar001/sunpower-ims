'use client';

import React, { useState, useEffect } from 'react';
import { ProjectLead, ProjectStatus } from '@/types/solar';
import { 
  Building2, 
  Search, 
  Filter, 
  Plus, 
  ArrowRight, 
  Loader2, 
  X, 
  AlertCircle,
  Zap,
  Activity,
  MapPin,
  Phone,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { getLeadsApi, createLeadApi, ApiError } from '@/lib/api';

export const INITIAL_LEADS: ProjectLead[] = [
  {
    id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    projectCode: 'PRJ-2026-088',
    customerName: 'Kaveri Industrial Mills',
    phone: '+91 98401 22345',
    address: 'Plot 41, Nacharam IDA, Hyderabad',
    capacityKw: 5.0,
    systemType: 'ON_GRID',
    status: 'SURVEY_APPROVED',
    agreedPrice: 285000,
    createdAt: '2026-10-28',
  },
  {
    id: '8cb3897b-9442-45e0-9988-bb31f79f2910',
    projectCode: 'PRJ-2026-089',
    customerName: 'Dr. Aris Thorne',
    phone: '+91 97110 44521',
    address: 'Bungalow 14, Jubilee Hills, Hyderabad',
    capacityKw: 3.5,
    systemType: 'OFF_GRID',
    status: 'COMMISSIONED',
    agreedPrice: 240000,
    createdAt: '2026-10-29',
  },
  {
    id: 'b6f04f2d-0b1a-4710-85f0-619f7004f280',
    projectCode: 'PRJ-2026-090',
    customerName: 'Vertex Logistics Hub',
    phone: '+91 99882 11029',
    address: 'Sector 3, Gachibowli, Hyderabad',
    capacityKw: 5.0,
    systemType: 'ON_GRID',
    status: 'ORDER_CONFIRMED',
    agreedPrice: 295000,
    createdAt: '2026-10-30',
  },
  {
    id: 'f726cb72-46a2-4a55-8947-cc59ffbe2162',
    projectCode: 'PRJ-2026-091',
    customerName: 'Radha Krishna Residency',
    phone: '+91 94401 88320',
    address: 'Street 4, Habsiguda, Hyderabad',
    capacityKw: 2.0,
    systemType: 'ON_GRID',
    status: 'SURVEY_PENDING',
    agreedPrice: 135000,
    createdAt: '2026-10-31',
  },
];

interface LeadsTableProps {
  onSelectProject?: (project: ProjectLead) => void;
}

export const LeadsTable: React.FC<LeadsTableProps> = ({ onSelectProject }) => {
  const [leads, setLeads] = useState<ProjectLead[]>(INITIAL_LEADS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'ALL'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [newLead, setNewLead] = useState({
    customerName: '',
    phone: '',
    address: '',
    capacityKw: 5.0,
    systemType: 'ON_GRID' as 'ON_GRID' | 'OFF_GRID',
  });

  useEffect(() => {
    let ignore = false;

    getLeadsApi()
      .then((data) => {
        if (!ignore && Array.isArray(data) && data.length > 0) {
          setLeads(data);
        }
      })
      .catch(() => {
        // Fallback to INITIAL_LEADS if backend API is not yet running
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);

    try {
      const created = await createLeadApi(newLead);
      setLeads((prev) => [created, ...prev]);
      setIsModalOpen(false);
      setNewLead({ customerName: '', phone: '', address: '', capacityKw: 5.0, systemType: 'ON_GRID' });
    } catch (err) {
      if (err instanceof ApiError) {
        setModalError(err.message);
      } else {
        setModalError('Failed to capture lead. Check server connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // High-contrast industrial LED badges
  const renderStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'SURVEY_APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            SURVEY_APPROVED
          </span>
        );
      case 'COMMISSIONED':
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <CheckCircle2 className="w-3 h-3 text-cyan-400" />
            COMMISSIONED
          </span>
        );
      case 'ORDER_CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            ORDER_CONFIRMED
          </span>
        );
      case 'SURVEY_PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            SURVEY_PENDING
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            REJECTED
          </span>
        );
      case 'LEAD_RECEIVED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            LEAD_RECEIVED
          </span>
        );
    }
  };

  const filtered = leads.filter((lead) => {
    const matchesSearch =
      lead.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.projectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'ALL' || lead.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Calculate telemetry metrics
  const totalCapacity = leads.reduce((acc, l) => acc + (l.capacityKw || 0), 0);
  const totalValuation = leads.reduce((acc, l) => acc + (l.agreedPrice || 0), 0);
  const completedCount = leads.filter((l) => l.status === 'COMMISSIONED' || l.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      {/* Top Header & Intake Trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Commercial CRM & Project Pipeline
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-normal">
                  STAGE 01
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Centralized discovery terminal and dynamic EPC contract management
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-lg text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer self-start md:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Intake New Commercial Lead
        </button>
      </div>

      {/* Engineering KPI Telemetry Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[#0B111E]/90 border border-slate-800 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Pipeline</span>
            <Activity className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1.5">{leads.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Commercial Dossiers</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0B111E]/90 border border-slate-800 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Generation Cap</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1.5">{totalCapacity.toFixed(1)} kWp</div>
          <div className="text-[11px] text-emerald-400 mt-0.5">Commercial & Industrial</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0B111E]/90 border border-slate-800 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Contracted Valuation</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1.5">₹{(totalValuation / 100000).toFixed(2)}L</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Verified Purchase Orders</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0B111E]/90 border border-slate-800 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Commissioned Systems</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1.5">{completedCount} Units</div>
          <div className="text-[11px] text-cyan-400/80 mt-0.5">Active Grid Synchronization</div>
        </div>
      </div>

      {/* Control Strip: Search & Filter */}
      <div className="p-3 rounded-xl bg-[#0B111E]/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search dossier code, corporate client, city sector..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 text-xs bg-slate-950/70 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ProjectStatus | 'ALL')}
            className="text-xs bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-amber-400 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Lifecycle Stages</option>
            <option value="LEAD_RECEIVED">LEAD_RECEIVED</option>
            <option value="SURVEY_PENDING">SURVEY_PENDING</option>
            <option value="SURVEY_APPROVED">SURVEY_APPROVED</option>
            <option value="ORDER_CONFIRMED">ORDER_CONFIRMED</option>
            <option value="COMMISSIONED">COMMISSIONED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
      </div>

      {/* SCADA Telemetry Matrix Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0B111E]/90 overflow-hidden shadow-xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#070B14]/80 border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px] tracking-wider">
                <th className="py-3.5 px-5">Dossier ID</th>
                <th className="py-3.5 px-5">Corporate Entity</th>
                <th className="py-3.5 px-5">Site Coordinates / Address</th>
                <th className="py-3.5 px-5">System Architecture</th>
                <th className="py-3.5 px-5">Contract Value</th>
                <th className="py-3.5 px-5">State Machine Status</th>
                <th className="py-3.5 px-5 text-right">Workflow Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
                    <span className="font-mono text-xs">Synchronizing pipeline telemetry...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-300">No project dossiers match query.</p>
                    <p className="text-xs text-slate-500 mt-1">Adjust search parameters or register a new commercial lead.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => (
                  <tr 
                    key={lead.id} 
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Project Code */}
                    <td className="py-4 px-5">
                      <span className="font-mono text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded border border-amber-400/20">
                        {lead.projectCode}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="py-4 px-5">
                      <div className="font-semibold text-white tracking-tight text-sm">
                        {lead.customerName}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                        <Phone className="w-3 h-3 text-slate-500" />
                        {lead.phone}
                      </div>
                    </td>

                    {/* Address */}
                    <td className="py-4 px-5 max-w-xs">
                      <div className="text-slate-300 flex items-start gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <span className="truncate">{lead.address}</span>
                      </div>
                    </td>

                    {/* Capacity & System Spec */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                          {lead.capacityKw} kWp
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {lead.systemType === 'ON_GRID' ? 'On-Grid' : 'Off-Grid'}
                        </span>
                      </div>
                    </td>

                    {/* Valuation */}
                    <td className="py-4 px-5 font-mono font-bold text-slate-200">
                      {lead.agreedPrice ? `₹${lead.agreedPrice.toLocaleString('en-IN')}` : 'Quote Pending'}
                    </td>

                    {/* Status Beacon */}
                    <td className="py-4 px-5">
                      {renderStatusBadge(lead.status)}
                    </td>

                    {/* Trigger Action */}
                    <td className="py-4 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectProject && onSelectProject(lead)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-700 text-slate-200 hover:text-amber-400 hover:border-amber-400/50 hover:bg-slate-800 transition-all cursor-pointer group-hover:border-slate-600 shadow-sm"
                      >
                        Launch Dossier
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

      {/* EPC Commercial Intake Terminal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-[#0B111E] border border-slate-700/80 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 text-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </div>
                <h3 className="font-bold text-sm text-white">Commercial Lead Intake</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateLead} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Corporate Client / Entity Name *
                </label>
                <input
                  type="text"
                  required
                  value={newLead.customerName}
                  onChange={(e) => setNewLead({ ...newLead, customerName: e.target.value })}
                  placeholder="e.g. Hyderabad Cold Storage Ltd"
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Primary Contact Phone *
                </label>
                <input
                  type="text"
                  required
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  placeholder="+91 98400 12345"
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Installation Site Address *
                </label>
                <textarea
                  required
                  rows={2}
                  value={newLead.address}
                  onChange={(e) => setNewLead({ ...newLead, address: e.target.value })}
                  placeholder="Plot/Survey number, Industrial Area, City"
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    System Sizing (kWp)
                  </label>
                  <select
                    value={newLead.capacityKw}
                    onChange={(e) => setNewLead({ ...newLead, capacityKw: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none cursor-pointer"
                  >
                    <option value={1.0}>1.0 kWp</option>
                    <option value={2.0}>2.0 kWp</option>
                    <option value={3.0}>3.0 kWp</option>
                    <option value={4.0}>4.0 kWp</option>
                    <option value={5.0}>5.0 kWp</option>
                    <option value={10.0}>10.0 kWp</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Grid Architecture
                  </label>
                  <select
                    value={newLead.systemType}
                    onChange={(e) => setNewLead({ ...newLead, systemType: e.target.value as 'ON_GRID' | 'OFF_GRID' })}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none cursor-pointer"
                  >
                    <option value="ON_GRID">On-Grid Sync</option>
                    <option value="OFF_GRID">Off-Grid Battery</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-md shadow-amber-500/20 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer transition-all active:scale-95"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Register Commercial Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};