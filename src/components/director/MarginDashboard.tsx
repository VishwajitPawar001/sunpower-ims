'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Layers, 
  DollarSign, 
  Clock, 
  Loader2,
  PieChart,
  BarChart3,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { fetchAnalyticsMarginsApi, AnalyticsMarginsData } from '@/lib/api';

const FALLBACK_DATA: AnalyticsMarginsData = {
  totalRevenue: 2845000,
  totalEstimatedBOMCost: 1620000,
  totalLaborCost: 280000,
  totalOverheadCost: 140000,
  grossMarginPercent: 28.3,
  pipelineDistribution: {
    leadReceived: 1,
    surveyPending: 1,
    surveyApproved: 1,
    quoteIssued: 1,
    orderConfirmed: 1,
    dispatched: 0,
    commissioned: 1,
    completed: 0,
    rejected: 0,
  },
  projects: [],
};

export const MarginDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsMarginsData>(FALLBACK_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLiveApi, setIsLiveApi] = useState<boolean>(false);

  useEffect(() => {
    let ignore = false;

    fetchAnalyticsMarginsApi()
      .then((liveData) => {
        if (!ignore && liveData && liveData.pipelineDistribution) {
          setData(liveData);
          setIsLiveApi(true);
        }
      })
      .catch((err) => {
        console.error('Failed to load margins telemetry:', err);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const totalActivePipeline = Object.values(data.pipelineDistribution).reduce((a, b) => a + b, 0);
  const netProfitTotal = data.totalRevenue - (data.totalEstimatedBOMCost + data.totalLaborCost + data.totalOverheadCost);

  // Cost stack percentages
  const safeRevenue = data.totalRevenue > 0 ? data.totalRevenue : 1;
  const bomPct = Math.round((data.totalEstimatedBOMCost / safeRevenue) * 100);
  const laborPct = Math.round((data.totalLaborCost / safeRevenue) * 100);
  const overheadPct = Math.round((data.totalOverheadCost / safeRevenue) * 100);

  return (
    <div className="space-y-6 text-slate-200">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Financials & Profit Margins
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-normal">
                  STAGE 06
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Real-time contract revenues, equipment costs, and company profit margins
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {isLoading ? (
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              Syncing Financials...
            </span>
          ) : (
            <span
              className={`text-xs px-3 py-1 rounded-lg border font-mono font-medium flex items-center gap-1.5 ${
                isLiveApi
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isLiveApi ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              {isLiveApi ? 'LIVE DATA SYNC' : 'INITIALIZING'}
            </span>
          )}
        </div>
      </div>

      {/* KPI Financial Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[#0B111E]/90 border border-slate-800 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="uppercase font-mono tracking-wider">Contracted Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono mt-1.5">
            ₹{data.totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono mt-0.5">
            <TrendingUp className="w-3.5 h-3.5" />
            ₹{(netProfitTotal / 100000).toFixed(2)}L Net Retained Profit
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0B111E]/90 border border-slate-800 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="uppercase font-mono tracking-wider">Hardware BOM COGS</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono mt-1.5">
            ₹{data.totalEstimatedBOMCost.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            {bomPct}% of total contract realization
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0B111E]/90 border border-slate-800 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="uppercase font-mono tracking-wider">Blended Gross Margin</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1.5">
            {data.grossMarginPercent}%
          </div>
          <div className="text-[11px] text-emerald-400/80 font-mono mt-0.5">
            Target benchmark: &ge; 28.0% hurdle
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0B111E]/90 border border-slate-800 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="uppercase font-mono tracking-wider">Pipeline Volume</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400 font-mono mt-1.5">
            {totalActivePipeline} Contracts
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            Active EPC lifecycle dossiers
          </div>
        </div>
      </div>

      {/* Capital Allocation Cost Stack */}
      <div className="p-5 rounded-2xl bg-[#0B111E]/90 border border-slate-800 backdrop-blur-md shadow-xl space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-white font-bold uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            Capital Allocation & Unit Cost Breakdown
          </span>
          <span className="text-slate-400">Target Gross Margin: {data.grossMarginPercent}%</span>
        </div>

        {/* Multi-segment cost bar */}
        <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
          <div 
            style={{ width: `${Math.max(5, bomPct)}%` }} 
            className="h-full bg-amber-500" 
            title={`Hardware BOM: ${bomPct}%`} 
          />
          <div 
            style={{ width: `${Math.max(5, laborPct)}%` }} 
            className="h-full bg-blue-500" 
            title={`Labor & Racking: ${laborPct}%`} 
          />
          <div 
            style={{ width: `${Math.max(3, overheadPct)}%` }} 
            className="h-full bg-slate-600" 
            title={`Overhead: ${overheadPct}%`} 
          />
          <div 
            style={{ width: `${Math.max(5, data.grossMarginPercent)}%` }} 
            className="h-full bg-emerald-400" 
            title={`Net Margin: ${data.grossMarginPercent}%`} 
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-1 text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
            <span className="text-slate-300">Hardware BOM:</span>
            <span className="font-bold text-white">₹{data.totalEstimatedBOMCost.toLocaleString('en-IN')} ({bomPct}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
            <span className="text-slate-300">Labor & Racking:</span>
            <span className="font-bold text-white">₹{data.totalLaborCost.toLocaleString('en-IN')} ({laborPct}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-600" />
            <span className="text-slate-300">Overhead:</span>
            <span className="font-bold text-white">₹{data.totalOverheadCost.toLocaleString('en-IN')} ({overheadPct}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
            <span className="text-slate-300">Net Retained Profit:</span>
            <span className="font-bold text-emerald-400">₹{netProfitTotal.toLocaleString('en-IN')} ({data.grossMarginPercent}%)</span>
          </div>
        </div>
      </div>

      {/* 9-Stage Pipeline Distribution Matrix */}
      <div className="p-5 rounded-2xl bg-[#0B111E]/90 border border-slate-800 backdrop-blur-md shadow-xl">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2 font-mono">
          <PieChart className="w-4 h-4 text-amber-400" />
          Finite Lifecycle Pipeline Distribution
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2.5 text-center">
          {Object.entries(data.pipelineDistribution).map(([stateKey, count]) => (
            <div key={stateKey} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="font-mono text-lg font-bold text-white">{count}</div>
              <div className="text-[10px] text-slate-400 uppercase font-mono mt-1 truncate">
                {stateKey.replace(/([A-Z])/g, '_$1')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Project-by-Project Margin Audit Ledger */}
      {data.projects && data.projects.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-[#0B111E]/90 overflow-hidden shadow-xl backdrop-blur-md">
          <div className="px-5 py-3.5 bg-[#070B14]/80 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              Contracted Project Unit Economics Ledger
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Audited per IEC 62548 Realization
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#070B14]/40 border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-5">Project Dossier</th>
                  <th className="py-3 px-5">Corporate Customer</th>
                  <th className="py-3 px-5">Capacity</th>
                  <th className="py-3 px-5">Contract Value</th>
                  <th className="py-3 px-5">Hardware BOM</th>
                  <th className="py-3 px-5">Labor & Rack</th>
                  <th className="py-3 px-5">Net Profit</th>
                  <th className="py-3 px-5 text-right">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {data.projects.map((proj) => {
                  const isHealthy = proj.marginPct >= 28.0;
                  return (
                    <tr key={proj.code} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-amber-400">
                        {proj.code}
                      </td>
                      <td className="py-3.5 px-5 font-sans font-semibold text-white">
                        {proj.customer}
                      </td>
                      <td className="py-3.5 px-5 text-slate-300">
                        {proj.capacity}
                      </td>
                      <td className="py-3.5 px-5 font-bold text-white">
                        ₹{proj.invoice.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-5 text-slate-400">
                        ₹{proj.bom.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-5 text-slate-400">
                        ₹{proj.labor.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-5 font-bold text-emerald-400">
                        ₹{proj.profit.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                          isHealthy
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          <TrendingUp className="w-3 h-3" />
                          {proj.marginPct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
