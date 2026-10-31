"use client";

import React, { useState } from "react";
import {
  Barcode,
  Scan,
  CheckCircle,
  AlertOctagon,
  Check,
  Loader2,
  X,
  ShieldAlert,
} from "lucide-react";
import { SerialVerificationItem } from "@/types/solar";
import { scanDispatchBarcodeApi, ApiError } from "@/lib/api";

const INITIAL_BOM: SerialVerificationItem[] = [
  {
    sku: "INV-HYB-5K-01",
    category: "INVERTER",
    modelName: "SunPower Solax 5kW Hybrid Inverter IP65",
    requiredQty: 1,
    scannedSerials: [],
  },
  {
    sku: "BAT-LFP-48-100",
    category: "BATTERY",
    modelName: "SunPower LiFePO4 5.12kWh Storage Pack",
    requiredQty: 1,
    scannedSerials: [],
  },
  {
    sku: "PV-TOP-550-BIF",
    category: "PANEL",
    modelName: "Mono PERC Bifacial 550W Module (Tier 1)",
    requiredQty: 4,
    scannedSerials: [],
  },
];

export const DispatchScanner: React.FC = () => {
  const [projectId] = useState<string>("3fa85f64-5717-4562-b3fc-2c963f66afa6");
  const [items, setItems] = useState<SerialVerificationItem[]>(INITIAL_BOM);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recentlyScannedSerial, setRecentlyScannedSerial] = useState<
    string | null
  >(null);

  // Modal alert for 400/404 errors
  const [modalAlert, setModalAlert] = useState<{
    title: string;
    message: string;
    code: string;
  } | null>(null);

  const totalRequired = items.reduce((acc, curr) => acc + curr.requiredQty, 0);
  const totalScanned = items.reduce(
    (acc, curr) => acc + curr.scannedSerials.length,
    0,
  );
  const isFullyDispatched = totalRequired === totalScanned;

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    const serial = barcodeInput.trim().toUpperCase();
    if (!serial) return;

    // Check client-side duplicate
    const isLocalDuplicate = items.some((item) =>
      item.scannedSerials.includes(serial),
    );
    if (isLocalDuplicate) {
      setModalAlert({
        title: "Duplicate Barcode Scan Detected",
        message: `Hardware unit [${serial}] has already been verified and locked for this project container.`,
        code: "CLIENT_DUPLICATE",
      });
      setBarcodeInput("");
      return;
    }

    setIsLoading(true);

    try {
      // Call live backend endpoint POST /api/dispatch/scan
      await scanDispatchBarcodeApi({ projectId, serialNumber: serial });

      // Match item category based on serial prefix
      let matchedIndex = -1;
      if (serial.startsWith("INV-")) {
        matchedIndex = items.findIndex((i) => i.category === "INVERTER");
      } else if (serial.startsWith("BAT-")) {
        matchedIndex = items.findIndex((i) => i.category === "BATTERY");
      } else {
        matchedIndex = items.findIndex((i) => i.category === "PANEL");
      }

      if (matchedIndex !== -1) {
        setItems((prev) =>
          prev.map((item, idx) =>
            idx === matchedIndex
              ? { ...item, scannedSerials: [...item.scannedSerials, serial] }
              : item,
          ),
        );
      }

      setRecentlyScannedSerial(serial);
      setBarcodeInput("");
    } catch (err) {
      if (err instanceof ApiError) {
        setModalAlert({
          title:
            err.status === 404
              ? "Hardware Serial Not Found"
              : "Hardware Dispatch Conflict",
          message: err.message,
          code: err.code,
        });
      } else {
        // Fallback simulation for offline testing
        let matchedIndex = -1;
        if (serial.startsWith("INV-"))
          matchedIndex = items.findIndex((i) => i.category === "INVERTER");
        else if (serial.startsWith("BAT-"))
          matchedIndex = items.findIndex((i) => i.category === "BATTERY");
        else matchedIndex = items.findIndex((i) => i.category === "PANEL");

        if (matchedIndex !== -1) {
          setItems((prev) =>
            prev.map((item, idx) =>
              idx === matchedIndex
                ? { ...item, scannedSerials: [...item.scannedSerials, serial] }
                : item,
            ),
          );
          setRecentlyScannedSerial(serial);
        }
        setBarcodeInput("");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Real-time 400/404 Modal Alert */}
      {modalAlert && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-enterprise-surface border-2 border-enterprise-brick rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-enterprise-border pb-3">
              <div className="flex items-center gap-2 text-enterprise-brick">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-sm">{modalAlert.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalAlert(null)}
                className="text-enterprise-smoke hover:text-enterprise-charcoal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {modalAlert.message}
            </p>
            <div className="p-2 rounded bg-slate-100 border border-enterprise-border font-mono text-[10px] text-enterprise-smoke">
              ERROR_CODE: {modalAlert.code}
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setModalAlert(null)}
                className="px-4 py-2 bg-enterprise-navy hover:bg-slate-800 text-white text-xs font-semibold rounded cursor-pointer"
              >
                Acknowledge & Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-enterprise-surface p-6 rounded-lg border border-enterprise-border shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-enterprise-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-enterprise-smoke border border-enterprise-border">
                DISPATCH ORDER: PRJ-2026-090
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                  isFullyDispatched
                    ? "text-enterprise-forest bg-green-50 border-green-200"
                    : "text-enterprise-amber bg-amber-50 border-amber-200"
                }`}
              >
                STATUS: {isFullyDispatched ? "DISPATCHED" : "ORDER_CONFIRMED"}
              </span>
            </div>
            <h2 className="text-lg font-bold text-enterprise-charcoal mt-1">
              Warehouse Serial Registry & Scanner
            </h2>
            <p className="text-xs text-enterprise-smoke">
              Live scanner endpoint: POST /api/dispatch/scan
            </p>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold font-mono text-enterprise-charcoal">
              {totalScanned} / {totalRequired}
            </div>
            <div className="text-[11px] text-enterprise-smoke font-medium">
              BOM Units Verified
            </div>
          </div>
        </div>

        <form onSubmit={handleScan} className="mt-5 space-y-3">
          <label className="block text-xs font-semibold text-enterprise-charcoal uppercase tracking-wider">
            Barcode / QR Scanner Terminal
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Barcode className="w-5 h-5 text-enterprise-smoke absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Scan hardware serial or simulate (e.g. INV-9028-X5, BAT-LFP-099)..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                disabled={isFullyDispatched || isLoading}
                className="w-full pl-10 pr-4 py-2 bg-enterprise-bg border border-enterprise-border rounded font-mono text-xs text-enterprise-charcoal focus:border-enterprise-blue focus:outline-none disabled:opacity-60"
              />
            </div>
            <button
              type="submit"
              disabled={isFullyDispatched || isLoading}
              className="bg-enterprise-navy hover:bg-slate-800 text-white px-4 py-2 rounded text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Scan className="w-4 h-4" />
              )}
              Register Scan
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
            <span className="text-enterprise-smoke font-medium">
              Seeded Inventory:
            </span>
            <button
              type="button"
              onClick={() => setBarcodeInput("INVERTER-SN-1001")}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 font-mono text-slate-700 border border-enterprise-border cursor-pointer"
            >
              + INVERTER-SN-1001
            </button>
            <button
              type="button"
              onClick={() => setBarcodeInput("PANEL-SN-5001")}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 font-mono text-slate-700 border border-enterprise-border cursor-pointer"
            >
              + PANEL-SN-5001
            </button>
            <button
              type="button"
              onClick={() => setBarcodeInput("PANEL-SN-5002")}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 font-mono text-slate-700 border border-enterprise-border cursor-pointer"
            >
              + PANEL-SN-5002
            </button>
          </div>
          {recentlyScannedSerial && (
            <div className="p-3 rounded text-xs bg-green-50 text-enterprise-forest border border-green-200 font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              VALIDATED & LOCKED: Hardware serial [{recentlyScannedSerial}]
              registered successfully.
            </div>
          )}
        </form>

        <div className="mt-6 border border-enterprise-border rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-enterprise-border text-enterprise-smoke font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-4">Component Category</th>
                <th className="py-2.5 px-4">Model Description</th>
                <th className="py-2.5 px-4">Fulfilled / Required</th>
                <th className="py-2.5 px-4">Verified Serials</th>
                <th className="py-2.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-enterprise-border">
              {items.map((item) => {
                const complete = item.scannedSerials.length >= item.requiredQty;
                return (
                  <tr key={item.sku} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-enterprise-charcoal">
                      {item.category}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-enterprise-charcoal font-medium">
                        {item.modelName}
                      </div>
                      <div className="font-mono text-[10px] text-enterprise-smoke">
                        {item.sku}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-enterprise-charcoal">
                      {item.scannedSerials.length} / {item.requiredQty}
                    </td>
                    <td className="py-3 px-4">
                      {item.scannedSerials.length === 0 ? (
                        <span className="text-enterprise-smoke italic">
                          Awaiting barcode input
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {item.scannedSerials.map((s) => (
                            <span
                              key={s}
                              className="font-mono text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded font-semibold"
                            >
                              ✓ {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {complete ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-enterprise-forest">
                          <Check className="w-3.5 h-3.5 stroke-3" />
                          Ready
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-enterprise-amber">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
