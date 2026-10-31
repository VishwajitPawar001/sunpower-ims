'use client';

import React from 'react';
import { 
  TrendingUp, 
  Layers, 
  ShieldAlert, 
  DollarSign, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';

export const MarginDashboard: React.FC = () => {
  const financialSummary = {
    totalRevenue: 2845000,
    totalBomCost: 1620000,
    laborCost: 280000,
    overheadCost: 140000,
    grossProfit: 805000,
    grossMarginPercent: 28.3,
    activeProjectsCount: 18,
    openWarrantyTickets: 3,
  };

  const projectMargins = [
    {
      code: 'PRJ-2026-088',
      customer: 'Kaveri Industrial Mills',
      capacity: '5.0 kW',
      invoice: 285000,
      bom: 165000,
      labor: 28000,
      overhead: 14000,
      profit: 78000,
      marginPct: 27.3,
      status: 'SURVEY_APPROVED',
    },
    {
      code: 'PRJ-2026-089',
      customer: 'Dr. Aris Thorne',
      capacity: '3.5 kW',
      invoice: 240000,
      bom: 135000,
      labor: 22000,
      overhead: 12000,
      profit: 71000,
      marginPct: 29.5,
      status: 'COMMISSIONED',
    },
    {
      code: 'PRJ-2026-090',
      customer: 'Vertex Logistics Hub',
      capacity: '5.0 kW',
      invoice: 295000,
      bom: 170000,
      labor: 30000,
      overhead: 15000,
      profit: 80000,
      marginPct: 27.1,
      status: 'ORDER_CONFIRMED',
    },
    {
      code: 'PRJ-2026-085',
      customer: 'Sita Rama Estates',
      capacity: '3.0 kW',
      invoice: 195000,
      bom: 110000,
      labor: 20000,
      overhead: 10000,
      profit: 55000,
      marginPct: 28.2,
      status: 'COMPLETED',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div>
        <h2 className="text-xl font-bold text-enterprise-charcoal">
          Director Financial & Operational Oversight
        </h2>
        <p className="text-xs text-enterprise-smoke">
          Real-time unit economics, net project margins, and SLA compliance
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-enterprise-surface p-4 rounded-lg border border-enterprise-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-enterprise-smoke uppercase tracking-wider">
              Total Gross Profit
            </span>
            <div className="w-8 h-8 rounded bg-green-50 text-enterprise-forest flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-enterprise-charcoal font-mono mt-2">
            ₹{financialSummary.grossProfit.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-enterprise-forest font-semibold mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            {financialSummary.grossMarginPercent}% blended margin
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-enterprise-surface p-4 rounded-lg border border-enterprise-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-enterprise-smoke uppercase tracking-wider">
              Active Project Pipeline
            </span>
            <div className="w-8 h-8 rounded bg-slate-100 text-enterprise-blue flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-enterprise-charcoal font-mono mt-2">
            {financialSummary.activeProjectsCount}
          </div>
          <div className="text-[11px] text-enterprise-smoke mt-1">
            4 in survey, 8 confirmed, 6 in field install
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-enterprise-surface p-4 rounded-lg border border-enterprise-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-enterprise-smoke uppercase tracking-wider">
              BOM & Labor Outlay
            </span>
            <div className="w-8 h-8 rounded bg-slate-100 text-enterprise-charcoal flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-enterprise-charcoal font-mono mt-2">
            ₹{(financialSummary.totalBomCost + financialSummary.laborCost).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-enterprise-smoke mt-1">
            COGS strictly tracked via inventory registry
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-enterprise-surface p-4 rounded-lg border border-enterprise-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-enterprise-smoke uppercase tracking-wider">
              Warranty Claims
            </span>
            <div className="w-8 h-8 rounded bg-amber-50 text-enterprise-amber flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-enterprise-amber font-mono mt-2">
            {financialSummary.openWarrantyTickets} Active
          </div>
          <div className="text-[11px] text-enterprise-forest font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            100% within 20-year coverage period
          </div>
        </div>
      </div>

      {/* Margin Breakdown Table */}
      <div className="bg-enterprise-surface rounded-lg border border-enterprise-border overflow-hidden shadow-sm">
        <div className="p-4 border-b border-enterprise-border flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-enterprise-charcoal">
              Project Unit Economics & Margin Formula
            </h3>
            <p className="text-[11px] text-enterprise-smoke font-mono">
              Formula: Profit = Invoice - (BOM Cost + Labor + Overhead)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-enterprise-border text-enterprise-smoke font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4 text-right">Invoice (A)</th>
                <th className="py-3 px-4 text-right">BOM (B)</th>
                <th className="py-3 px-4 text-right">Labor (C)</th>
                <th className="py-3 px-4 text-right">Overhead (D)</th>
                <th className="py-3 px-4 text-right">Gross Profit</th>
                <th className="py-3 px-4 text-right">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-enterprise-border">
              {projectMargins.map((prj) => (
                <tr key={prj.code} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-enterprise-charcoal">{prj.customer}</div>
                    <div className="font-mono text-[10px] text-enterprise-smoke">{prj.code}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-enterprise-charcoal">{prj.capacity}</td>
                  <td className="py-3 px-4 text-right font-mono text-enterprise-charcoal">
                    ₹{prj.invoice.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-enterprise-smoke">
                    ₹{prj.bom.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-enterprise-smoke">
                    ₹{prj.labor.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-enterprise-smoke">
                    ₹{prj.overhead.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-enterprise-forest">
                    ₹{prj.profit.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-enterprise-charcoal">
                    {prj.marginPct}%
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