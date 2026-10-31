'use client';

import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  FileCheck, 
  ShieldCheck, 
  Sun, 
  Battery, 
  Layers, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import { SystemType } from '@/types/solar';
import { generateQuoteApi } from '@/lib/api';

interface BOMItem {
  sku: string;
  category: 'PANEL' | 'INVERTER' | 'BATTERY' | 'STRUCTURE' | 'BOS';
  name: string;
  qty: number;
  unitCost: number;
}

export const QuoteGenerator: React.FC = () => {
  const [projectId] = useState<string>('3fa85f64-5717-4562-b3fc-2c963f66afa6');
  const [selectedCapacity, setSelectedCapacity] = useState<number>(5.0);
  const [systemType, setSystemType] = useState<SystemType>('ON_GRID');
  const [cableRunMeters, setCableRunMeters] = useState<number>(28);
  const [isLocked, setIsLocked] = useState<boolean>(false);
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
        name: `Mono PERC Bifacial 550W Module (Tier 1)`,
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
        name: `4 sq mm Solar DC Cable (${cableRunMeters * 2}m) + AC/DC DB + MC4 Connectors`,
        qty: 1,
        unitCost: 12000 + (cableRunMeters > 30 ? (cableRunMeters - 30) * 250 : 0),
      },
    ];

    if (systemType === 'OFF_GRID') {
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
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await generateQuoteApi({
        projectId,
        capacityKw: selectedCapacity,
        systemType,
        agreedPrice: quotePrice,
      });
      setIsLocked(true);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to issue quote via API');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-enterprise-surface p-6 rounded-lg border border-enterprise-border shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-enterprise-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-slate-100 text-enterprise-blue flex items-center justify-center">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-enterprise-smoke border border-enterprise-border">
                  PRJ-2026-088
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-50 text-enterprise-forest border border-green-200">
                  SURVEY_APPROVED
                </span>
              </div>
              <h2 className="text-lg font-bold text-enterprise-charcoal mt-1">
                Quote & Dynamic Bill of Materials (BOM) Engine
              </h2>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold font-mono text-enterprise-charcoal">
              ₹{quotePrice.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-enterprise-smoke font-medium">Estimated Client Price (Excl. GST)</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-5">
          <div>
            <label className="block text-xs font-semibold text-enterprise-charcoal mb-1">
              System Sizing (1.0 kW - 5.0 kW) *
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[1.0, 2.0, 3.0, 4.0, 5.0].map((kw) => (
                <button
                  key={kw}
                  type="button"
                  disabled={isLocked || isLoading}
                  onClick={() => setSelectedCapacity(kw)}
                  className={`py-2 rounded text-xs font-mono font-bold border transition-colors ${
                    selectedCapacity === kw
                      ? 'bg-enterprise-blue text-white border-enterprise-blue'
                      : 'bg-enterprise-bg border-enterprise-border text-enterprise-charcoal hover:bg-slate-100'
                  }`}
                >
                  {kw}k
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-enterprise-charcoal mb-1">
              Grid Configuration *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isLocked || isLoading}
                onClick={() => setSystemType('ON_GRID')}
                className={`py-2 rounded text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                  systemType === 'ON_GRID'
                    ? 'bg-enterprise-blue text-white border-enterprise-blue'
                    : 'bg-enterprise-bg border-enterprise-border text-enterprise-charcoal hover:bg-slate-100'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                On-Grid
              </button>
              <button
                type="button"
                disabled={isLocked || isLoading}
                onClick={() => setSystemType('OFF_GRID')}
                className={`py-2 rounded text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                  systemType === 'OFF_GRID'
                    ? 'bg-enterprise-blue text-white border-enterprise-blue'
                    : 'bg-enterprise-bg border-enterprise-border text-enterprise-charcoal hover:bg-slate-100'
                }`}
              >
                <Battery className="w-3.5 h-3.5" />
                Off-Grid
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-enterprise-charcoal mb-1">
              Survey Cable Length (Meters)
            </label>
            <input
              type="number"
              min="5"
              max="200"
              disabled={isLocked || isLoading}
              value={cableRunMeters}
              onChange={(e) => setCableRunMeters(parseInt(e.target.value) || 10)}
              className="w-full bg-enterprise-surface border border-enterprise-border rounded px-3 py-1.5 text-xs font-mono text-enterprise-charcoal focus:border-enterprise-blue focus:outline-none"
            />
            <span className="text-[11px] text-enterprise-smoke">Imported from site survey</span>
          </div>
        </div>

        <div className="mt-6 border border-enterprise-border rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-enterprise-border flex items-center justify-between">
            <span className="text-xs font-semibold text-enterprise-charcoal uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-enterprise-blue" />
              Dynamic Bill of Materials (BOM)
            </span>
            <span className="text-[11px] text-enterprise-smoke font-mono">
              Auto-generated per Section 1 & Section 2
            </span>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/50 border-b border-enterprise-border text-enterprise-smoke font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-4">Component</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4 text-center">Qty</th>
                <th className="py-2.5 px-4 text-right">Unit Rate</th>
                <th className="py-2.5 px-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-enterprise-border font-mono">
              {bomItems.map((item) => (
                <tr key={item.sku} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-sans font-medium text-enterprise-charcoal">
                    {item.name}
                    <div className="text-[10px] text-enterprise-smoke font-mono">{item.sku}</div>
                  </td>
                  <td className="py-3 px-4 font-sans text-enterprise-smoke">
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-medium">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-enterprise-charcoal font-semibold">
                    {item.qty}
                  </td>
                  <td className="py-3 px-4 text-right text-enterprise-smoke">
                    ₹{item.unitCost.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-enterprise-charcoal">
                    ₹{(item.qty * item.unitCost).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 p-4 rounded-lg bg-enterprise-bg border border-enterprise-border grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <div className="text-enterprise-smoke font-sans">Hardware BOM:</div>
            <div className="font-bold text-enterprise-charcoal mt-0.5">₹{hardwareCost.toLocaleString('en-IN')}</div>
          </div>
          <div>
            <div className="text-enterprise-smoke font-sans">Labor & Racking:</div>
            <div className="font-bold text-enterprise-charcoal mt-0.5">₹{laborCost.toLocaleString('en-IN')}</div>
          </div>
          <div>
            <div className="text-enterprise-smoke font-sans">Overhead Allocation:</div>
            <div className="font-bold text-enterprise-charcoal mt-0.5">₹{overheadCost.toLocaleString('en-IN')}</div>
          </div>
          <div>
            <div className="text-enterprise-smoke font-sans">Projected Margin:</div>
            <div className="font-bold text-enterprise-forest mt-0.5">{marginPercent}% (₹{projectedProfit.toLocaleString('en-IN')})</div>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 rounded bg-red-50 border border-red-200 text-xs text-enterprise-brick flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMessage}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-enterprise-border flex items-center justify-between">
          <div className="text-xs text-enterprise-smoke">
            {isLocked
              ? 'BOM locked in database. State transitioned to [QUOTE_ISSUED].'
              : 'Locking generates official proposal and activates customer confirmation step.'}
          </div>

          <button
            type="button"
            disabled={isLocked || isLoading}
            onClick={handleIssueQuote}
            className={`px-5 py-2.5 rounded text-xs font-semibold text-white transition-colors flex items-center gap-2 ${
              isLocked
                ? 'bg-enterprise-forest cursor-default'
                : 'bg-enterprise-navy hover:bg-slate-800 shadow cursor-pointer'
            } disabled:opacity-50`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing Transaction...
              </>
            ) : isLocked ? (
              <>
                <ShieldCheck className="w-4 h-4" />
                Quote Issued & BOM Locked
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                Lock BOM & Issue Quote
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};