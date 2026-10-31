'use client';

import React, { useState, useEffect } from 'react';
import { ProjectLead, ProjectStatus } from '@/types/solar';
import { Search, Filter, Plus, ArrowUpRight, Loader2, X, AlertCircle } from 'lucide-react';
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
        // Retains INITIAL_LEADS if backend API is not yet seeded
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

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'SURVEY_APPROVED':
      case 'COMPLETED':
        return 'bg-green-50 text-enterprise-forest border-green-200';
      case 'SURVEY_PENDING':
      case 'QUOTE_ISSUED':
      case 'ORDER_CONFIRMED':
      case 'COMMISSIONED':
        return 'bg-amber-50 text-enterprise-amber border-amber-200';
      case 'REJECTED':
        return 'bg-red-50 text-enterprise-brick border-red-200';
      case 'LEAD_RECEIVED':
      default:
        return 'bg-slate-100 text-enterprise-smoke border-enterprise-border';
    }
  };

  const filtered = leads.filter((lead) => {
    const matchesSearch =
      lead.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.projectCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'ALL' || lead.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-enterprise-charcoal">Customer Leads & Pipeline</h2>
          <p className="text-xs text-enterprise-smoke">
            Connected to GET & POST /api/leads per Section 5.1 RBAC specification
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-enterprise-navy text-white px-4 py-2 rounded text-sm font-medium hover:bg-slate-800 transition-colors self-start sm:self-auto shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Capture New Lead
        </button>
      </div>

      <div className="bg-enterprise-surface p-3 rounded-lg border border-enterprise-border flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-60">
          <Search className="w-4 h-4 text-enterprise-smoke absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search customer, project code, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-enterprise-bg border border-enterprise-border rounded text-enterprise-charcoal focus:border-enterprise-blue focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-enterprise-smoke" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ProjectStatus | 'ALL')}
            className="text-xs bg-enterprise-bg border border-enterprise-border rounded px-2.5 py-1.5 text-enterprise-charcoal focus:border-enterprise-blue focus:outline-none"
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

      <div className="bg-enterprise-surface rounded-lg border border-enterprise-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-enterprise-border text-enterprise-smoke font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Project ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Address / Site</th>
                <th className="py-3 px-4">System Spec</th>
                <th className="py-3 px-4">Price (INR)</th>
                <th className="py-3 px-4">State Machine Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-enterprise-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-enterprise-smoke">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-enterprise-blue" />
                    Loading pipeline records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-enterprise-smoke">
                    No project leads match the criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-enterprise-charcoal">
                      {lead.projectCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-enterprise-charcoal">{lead.customerName}</div>
                      <div className="text-[11px] text-enterprise-smoke">{lead.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-enterprise-smoke max-w-xs truncate">
                      {lead.address}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-enterprise-charcoal">{lead.capacityKw} kW</span>
                      <span className="ml-1 text-[11px] text-enterprise-smoke">
                        ({lead.systemType === 'ON_GRID' ? 'On-Grid' : 'Off-Grid'})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-enterprise-charcoal">
                      ₹{lead.agreedPrice ? lead.agreedPrice.toLocaleString('en-IN') : 'Quote Pending'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold border ${getStatusBadge(
                          lead.status
                        )}`}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectProject && onSelectProject(lead)}
                        className="text-enterprise-blue hover:text-blue-900 inline-flex items-center gap-0.5 font-medium cursor-pointer"
                      >
                        Open Action
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-enterprise-surface border border-enterprise-border rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-enterprise-border pb-3">
              <h3 className="font-bold text-sm text-enterprise-charcoal">Capture New Customer Lead</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-enterprise-smoke hover:text-enterprise-charcoal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-enterprise-brick flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateLead} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-enterprise-charcoal mb-1">Customer / Entity Name *</label>
                <input
                  type="text"
                  required
                  value={newLead.customerName}
                  onChange={(e) => setNewLead({ ...newLead, customerName: e.target.value })}
                  placeholder="e.g. Apex Biotech Godown"
                  className="w-full bg-enterprise-surface border border-enterprise-border rounded px-3 py-1.5 text-xs text-enterprise-charcoal focus:border-enterprise-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-enterprise-charcoal mb-1">Contact Phone *</label>
                <input
                  type="text"
                  required
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  placeholder="+91 98400 12345"
                  className="w-full bg-enterprise-surface border border-enterprise-border rounded px-3 py-1.5 text-xs text-enterprise-charcoal focus:border-enterprise-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-enterprise-charcoal mb-1">Site Installation Address *</label>
                <textarea
                  required
                  rows={2}
                  value={newLead.address}
                  onChange={(e) => setNewLead({ ...newLead, address: e.target.value })}
                  placeholder="Plot/Survey number, Street, City"
                  className="w-full bg-enterprise-surface border border-enterprise-border rounded px-3 py-1.5 text-xs text-enterprise-charcoal focus:border-enterprise-blue focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-enterprise-charcoal mb-1">Target Capacity (kW)</label>
                  <select
                    value={newLead.capacityKw}
                    onChange={(e) => setNewLead({ ...newLead, capacityKw: parseFloat(e.target.value) })}
                    className="w-full bg-enterprise-surface border border-enterprise-border rounded px-2.5 py-1.5 text-xs text-enterprise-charcoal focus:border-enterprise-blue focus:outline-none"
                  >
                    <option value={1.0}>1.0 kW</option>
                    <option value={2.0}>2.0 kW</option>
                    <option value={3.0}>3.0 kW</option>
                    <option value={4.0}>4.0 kW</option>
                    <option value={5.0}>5.0 kW</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-enterprise-charcoal mb-1">Grid Configuration</label>
                  <select
                    value={newLead.systemType}
                    onChange={(e) => setNewLead({ ...newLead, systemType: e.target.value as 'ON_GRID' | 'OFF_GRID' })}
                    className="w-full bg-enterprise-surface border border-enterprise-border rounded px-2.5 py-1.5 text-xs text-enterprise-charcoal focus:border-enterprise-blue focus:outline-none"
                  >
                    <option value="ON_GRID">On-Grid</option>
                    <option value="OFF_GRID">Off-Grid</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-enterprise-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-enterprise-smoke hover:bg-slate-100 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-enterprise-navy hover:bg-slate-800 rounded shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Register Project Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};