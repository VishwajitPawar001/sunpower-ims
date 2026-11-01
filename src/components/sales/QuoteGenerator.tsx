'use client';

import React, { useState, useMemo } from 'react';
import { 
  FileCheck, 
  ShieldCheck, 
  Sun, 
  Battery, 
  Layers, 
  Loader2, 
  AlertCircle,
  TrendingUp,
  Cpu,
  CheckCircle2
} from 'lucide-react';
import { SystemType, ProjectLead } from '@/types/solar';
import { generateQuoteApi } from '@/lib/api';

interface BOMItem {
  sku: string;
  category: 'PANEL' | 'INVERTER' | 'BATTERY' | 'STRUCTURE' | 'BOS';
  name: string;
  qty: number;
  unitCost: number;
}

interface QuoteGeneratorProps {
  project?: ProjectLead | null;
  onProjectUpdated?: (updatedProject: ProjectLead) => void;
}

export const QuoteGenerator: React.FC<QuoteGeneratorProps> = ({
  project,
  onProjectUpdated,
}) => {
  const currentProjectId = project?.id || '';
  const [selectedCapacity, setSelectedCapacity] = useState<number>(project?.capacityKw || 5.0);
  const [systemType, setSystemType] = useState<SystemType>(project?.systemType || 'ON_GRID');
  const [cableRunMeters, setCableRunMeters] = useState<number>(28);
  const [isLocked, setIsLocked] = useState<boolean>(
    project?.status === 'QUOTE_ISSUED' ||
    project?.status === 'ORDER_CONFIRMED' ||
    project?.status === 'DISPATCHED' ||
    project?.status === 'COMMISSIONED'
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dynamic Bill of Materials sizing calculation
  const bomItems = useMemo<BOMItem[]>(() => {
    const panelWatts = 550;
    const totalWattsNeeded = selectedCapacity * 1000;
    const panelCount = Math.ceil(totalWattsNeeded / panelWatts);

    const items: BOMItem[] = [
      {
        sku: 'PV-TOP-550-BIF',
        category: 'PANEL',
        name: 'Mono PERC Bifacial 550W Module (Tier 1)',
        qty: panelCount,
        unitCost: 11500,
      },
      {
        sku: `INV-${systemType === 'ON_GRID' ? 'GRID' : 'HYB'}-${selectedCapacity}K`,
        category: 'INVERTER',
        name: `SunPower ${selectedCapacity}kW ${systemType === 'ON_GRID' ? 'Grid-Tied' : 'Hybrid IP65'} String Inverter`,
        qty: 1,
        unitCost: systemType === 'ON_GRID' ? 38000 : 54000,
      },
      {
        sku: 'STR-ALUM-ELEV',
        category: 'STRUCTURE',
        name: 'Anodized Aluminum HD Elevated Racking (Wind load 150 km/h)',
        qty: panelCount,
        unitCost: 1800,
      },
      {
        sku: 'BOS-SOLAR-KIT',
        category: 'BOS',
        name: `4 sq mm Solar DC Cable (${cableRunMeters}m) + AC/DC DB + MC4 Connectors`,
        qty: 1,
        unitCost: 12000 + (cableRunMeters > 30 ? (cableRunMeters - 30) * 250 : 0),
      },
    ];

    if (systemType === 'OFF_GRID' || systemType === 'HYBRID') {
      const batteryCount = selectedCapacity >= 4 ? 2 : 1;
      items.push({
        sku: 'BAT-LFP-48-100',
        category: 'BATTERY',
        name: 'SunPower LiFePO4 5.12kWh 48V Storage Pack',
        qty: batteryCount,
        unitCost: 68000,
      });
    }

    return items;
  }, [selectedCapacity, systemType, cableRunMeters]);

  // Unit economics breakdown
  const hardwareCost = bomItems.reduce((acc, item) => acc + item.qty * item.unitCost, 0);
  const laborCost = Math.round(selectedCapacity * 5500);
  const overheadCost = Math.round(hardwareCost * 0.08);
  const totalCost = hardwareCost + laborCost + overheadCost;
  
  // 28% Target Gross Margin
  const quotePrice = Math.round(totalCost / (1 - 0.28));
  const projectedProfit = quotePrice - totalCost;
  const marginPercent = ((projectedProfit / quotePrice) * 100).toFixed(1);

  const handleIssueQuote = async () => {
    if (!currentProjectId) {
      setErrorMessage('No project dossier selected to issue quote.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await generateQuoteApi({
        projectId: currentProjectId,
        capacityKw: selectedCapacity,
        systemType,
        agreedPrice: quotePrice,
      });
      setIsLocked(true);
      if (project && onProjectUpdated) {
        onProjectUpdated({
          ...project,
          capacityKw: selectedCapacity,
          systemType,
          status: 'QUOTE_ISSUED',
          agreedPrice: quotePrice,
        });
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to issue quote via API');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-slate-200">
      {/* Top Header Card */}
      <div className="bg-[#0B111E]/90 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Cpu className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                  {project?.projectCode || 'PROJECT DOSSIER'}
                </span>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {project?.status || 'FEASIBILITY_VERIFIED'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1.5 tracking-tight flex items-center gap-2">
                System Sizing & Quotation Generator
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-normal">
                  STAGE 03
                </span>
              </h2>
              {project?.customerName && (
                <p className="text-xs text-slate-400 mt-0.5">
                  Client: <span className="text-slate-200 font-semibold">{project.customerName}</span> ({project.address})
                </p>
              )}
            </div>
          </div>

          <div className="sm:text-right">
            <div className="text-3xl font-extrabold font-mono text-amber-400 tracking-tight">
              ₹{quotePrice.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              Total Project Quote (Excl. 18% GST)
            </div>
          </div>
        </div>

        {/* Configuration Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-6">
          {/* Sizing Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Array Sizing (1.0 kWp - 10.0 kWp) *
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[1.0, 2.0, 3.0, 5.0, 10.0].map((kw) => (
                <button
                  key={kw}
                  type="button"
                  disabled={isLocked || isLoading}
                  onClick={() => setSelectedCapacity(kw)}
                  className={`py-2 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                    selectedCapacity === kw
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/25 ring-1 ring-amber-400'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {kw}k
                </button>
              ))}
            </div>
          </div>

          {/* Grid Topology Switcher */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Inverter & Storage Topology *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={isLocked || isLoading}
                onClick={() => setSystemType('ON_GRID')}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  systemType === 'ON_GRID'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/25'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Sun className={`w-3.5 h-3.5 ${systemType === 'ON_GRID' ? 'text-slate-950' : 'text-amber-400'}`} />
                On-Grid
              </button>
              <button
                type="button"
                disabled={isLocked || isLoading}
                onClick={() => setSystemType('HYBRID')}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  systemType === 'HYBRID'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/25'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Layers className={`w-3.5 h-3.5 ${systemType === 'HYBRID' ? 'text-slate-950' : 'text-cyan-400'}`} />
                Grid Hybrid
              </button>
              <button
                type="button"
                disabled={isLocked || isLoading}
                onClick={() => setSystemType('OFF_GRID')}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  systemType === 'OFF_GRID'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/25'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Battery className={`w-3.5 h-3.5 ${systemType === 'OFF_GRID' ? 'text-slate-950' : 'text-emerald-400'}`} />
                Off-Grid
              </button>
            </div>
          </div>

          {/* Cable Run */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Survey DC Cable Length (Meters)
            </label>
            <input
              type="number"
              min="5"
              max="200"
              disabled={isLocked || isLoading}
              value={cableRunMeters}
              onChange={(e) => setCableRunMeters(parseInt(e.target.value) || 10)}
              className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:border-amber-400 focus:outline-none"
            />
            <span className="text-[10px] text-slate-500 font-mono mt-1 block">
              Survey telemetry input (drop &gt;30m surcharge applied)
            </span>
          </div>
        </div>

        {/* Dynamic Bill of Materials Table */}
        <div className="mt-6 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
          <div className="px-4 py-3 bg-[#070B14]/80 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              Dynamic Bill of Materials (BOM) Matrix
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Auto-calculated per IEC 62548 Specs
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#070B14]/40 border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">Component Specification</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Quantity</th>
                  <th className="py-3 px-4 text-right">Unit Rate</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {bomItems.map((item) => (
                  <tr key={item.sku} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-sans font-medium text-white">
                      {item.name}
                      <div className="text-[10px] text-amber-400/80 font-mono mt-0.5">{item.sku}</div>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-white font-bold">
                      {item.qty}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400">
                      ₹{item.unitCost.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-200">
                      ₹{(item.qty * item.unitCost).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Unit Economics Telemetry HUD */}
        <div className="mt-5 p-4 rounded-xl bg-slate-950/80 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-[#0B111E] border border-slate-800">
            <div className="text-slate-400 font-sans text-[11px]">Hardware COGS:</div>
            <div className="text-sm font-bold text-white mt-1">₹{hardwareCost.toLocaleString('en-IN')}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-[#0B111E] border border-slate-800">
            <div className="text-slate-400 font-sans text-[11px]">Labor & Racking:</div>
            <div className="text-sm font-bold text-white mt-1">₹{laborCost.toLocaleString('en-IN')}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-[#0B111E] border border-slate-800">
            <div className="text-slate-400 font-sans text-[11px]">Overhead Allocation:</div>
            <div className="text-sm font-bold text-white mt-1">₹{overheadCost.toLocaleString('en-IN')}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-[#0B111E] border border-slate-800">
            <div className="text-slate-400 font-sans text-[11px]">Gross Margin:</div>
            <div className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              {marginPercent}% (₹{projectedProfit.toLocaleString('en-IN')})
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              {isLocked
                ? 'Quote approved in database. Project transitioned to [QUOTE_ISSUED].'
                : 'Issuing this quote updates project state and advances workflow to Hardware Dispatch.'}
            </span>
          </div>

          <button
            type="button"
            disabled={isLocked || isLoading}
            onClick={handleIssueQuote}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-lg ${
              isLocked
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20 cursor-default'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 cursor-pointer active:scale-95'
            } disabled:opacity-50`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Quote...
              </>
            ) : isLocked ? (
              <>
                <ShieldCheck className="w-4 h-4" />
                Quote Issued
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                Approve & Issue Quote
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
