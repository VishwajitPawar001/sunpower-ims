'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Layers, 
  DollarSign, 
  Clock, 
  Loader2,
  PieChart
} from 'lucide-react';
import { fetchAnalyticsMarginsApi, AnalyticsMarginsData } from '@/lib/api';

const FALLBACK_DATA: AnalyticsMarginsData = {
  totalRevenue: 2845000,
  totalEstimatedBOMCost: 1620000,
  totalLaborCost: 280000,
  totalOverheadCost: 140000,
  grossMarginPercent: 28.3,
  pipelineDistribution: {
    leadReceived: 12,
    surveyPending: 4,
    surveyApproved: 6,
    quoteIssued: 8,
    orderConfirmed: 5,
    dispatched: 3,
    commissioned: 7,
    completed: 24,
    rejected: 2,
  },
  projects: [
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
  ],
};

export const MarginDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsMarginsData>(FALLBACK_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLiveApi, setIsLiveApi] = useState<boolean>(false);

  useEffect(() => {
    let ignore = false;

    fetchAnalyticsMarginsApi()
      .then((liveData) => {
        if (!ignore && liveData && liveData.projects) {
          setData(liveData);
          setIsLiveApi(true);
        }
      })
      .catch(() => {
        // Retain fallback data if endpoint is not seeded yet
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const totalActivePipeline = Object.values(data.pipelineDistribution).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-enterprise-charcoal">
            Executive Margin & Operations Analytics
          </h2>
          <p className="text-xs text-enterprise-smoke">
            Real-time telemetry from GET /api/analytics/margins
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading ? (
            <span className="text-xs text-enterprise-smoke flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-enterprise-blue" />
              Syncing Ledger...
            </span>
          ) : (
            <span
              className={`text-xs px-2.5 py-1 rounded border font-mono font-medium ${
                isLiveApi
                  ? 'bg-green-50 text-enterprise-forest border-green-200'
                  : 'bg-slate-100 text-enterprise-smoke border-enterprise-border'
              }`}
            >
              {isLiveApi ? '● Live /api/analytics/margins' : '○ Fallback Simulation'}
            </span>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-enterprise-surface p-4 rounded-lg border border-enterprise-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-enterprise-smoke uppercase tracking-wider">
              Total Contract Revenue
            </span>
            <div className="w-8 h-8 rounded bg-green-50 text-enterprise-forest flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-enterprise-charcoal font-mono mt-2">
            ₹{data.totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-enterprise-forest font-semibold mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            {data.grossMarginPercent}% gross margin target
          </div>
        </div>

        <div className="bg-enterprise-surface p-4 rounded-lg border border-enterprise-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-enterprise-smoke uppercase tracking-wider">
              Estimated BOM Outlay
            </span>
            <div className="w-8 h-8 rounded bg-slate-100 text-enterprise-blue flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-enterprise-charcoal font-mono mt-2">
            ₹{data.totalEstimatedBOMCost.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-enterprise-smoke mt-1">
            Calculated via package BOM engine
          </div>
        </div>

        <div className="bg-enterprise-surface p-4 rounded-lg border border-enterprise-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-enterprise-smoke uppercase tracking-wider">
              Gross Margin %
            </span>
            <div className="w-8 h-8 rounded bg-slate-100 text-enterprise-charcoal flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-enterprise-forest" />
            </div>
          </div>
          <div className="text-2xl font-bold text-enterprise-forest font-mono mt-2">
            {data.grossMarginPercent}%
          </div>
          <div className="text-[11px] text-enterprise-smoke mt-1">
            Target benchmark: &ge; 28.0%
          </div>
        </div>

        <div className="bg-enterprise-surface p-4 rounded-lg border border-enterprise-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-enterprise-smoke uppercase tracking-wider">
              Pipeline Volume
            </span>
            <div className="w-8 h-8 rounded bg-slate-100 text-enterprise-smoke flex items-center justify-center">
              <Layers className="w-4 h-4 text-enterprise-blue" />
            </div>
          </div>
          <div className="text-2xl font-bold text-enterprise-charcoal font-mono mt-2">
            {totalActivePipeline} Projects
          </div>
          <div className="text-[11px] text-enterprise-smoke mt-1">
            Across 9 finite lifecycle states
          </div>
        </div>
      </div>

      {/* Pipeline Distribution Counters */}
      <div className="bg-enterprise-surface p-5 rounded-lg border border-enterprise-border shadow-sm">
        <h3 className="text-xs font-bold text-enterprise-charcoal uppercase tracking-wider mb-4 flex items-center gap-2">
          <PieChart className="w-4 h-4 text-enterprise-blue" />
          Pipeline Distribution Counters
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3 text-center">
          {Object.entries(data.pipelineDistribution).map(([stateKey, count]) => (
            <div key={stateKey} className="p-2.5 rounded bg-enterprise-bg border border-enterprise-border">
              <div className="font-mono text-base font-bold text-enterprise-charcoal">{count}</div>
              <div className="text-[10px] text-enterprise-smoke uppercase font-medium mt-1 truncate">
                {stateKey.replace(/([A-Z])/g, '_$1')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};