'use client';

import React, { useState } from 'react';
import { ProjectLead, ProjectStatus } from '@/types/solar';
import { Search, Filter, Plus, ArrowUpRight } from 'lucide-react';

const INITIAL_LEADS: ProjectLead[] = [
  {
    id: '1',
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
    id: '2',
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
    id: '3',
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
    id: '4',
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
  {
    id: '5',
    projectCode: 'PRJ-2026-092',
    customerName: 'Anand Agritech Godown',
    phone: '+91 93450 77123',
    address: 'NH 44, Shamshabad Rural',
    capacityKw: 4.0,
    systemType: 'OFF_GRID',
    status: 'REJECTED',
    agreedPrice: 260000,
    createdAt: '2026-10-31',
  },
];

export const LeadsTable: React.FC = () => {
  const [leads] = useState<ProjectLead[]>(INITIAL_LEADS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'ALL'>('ALL');

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
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-enterprise-charcoal">Customer Leads & Pipeline</h2>
          <p className="text-xs text-enterprise-smoke">
            Manage stage progression from initial inquiry to contract signoff
          </p>
        </div>
        <button className="flex items-center gap-2 bg-enterprise-navy text-white px-4 py-2 rounded text-sm font-medium hover:bg-slate-800 transition-colors self-start sm:self-auto shadow-sm">
          <Plus className="w-4 h-4" />
          Capture New Lead
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-enterprise-surface p-3 rounded-lg border border-enterprise-border flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
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

      {/* Leads Data Table */}
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
              {filtered.map((lead) => (
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
                    ₹{lead.agreedPrice.toLocaleString('en-IN')}
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
                    <button className="text-enterprise-blue hover:text-blue-900 inline-flex items-center gap-0.5 font-medium">
                      View
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};