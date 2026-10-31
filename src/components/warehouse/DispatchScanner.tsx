"use client";

import React, { useState } from "react";
import {
  Barcode,
  Scan,
  CheckCircle,
  AlertOctagon,
  Check,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { SerialVerificationItem } from "@/types/solar";
import { submitDispatchScanApi, ApiError } from "@/lib/api";

const INITIAL_BOM: SerialVerificationItem[] = [
  {
    sku: "INV-HYB-5K-01",
    category: "INVERTER",
    modelName: "SunPower Solax 5kW Hybrid Inverter IP65",
    requiredQty: 1,
    scannedSerials: ["INV-9028-X5"],
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
    scannedSerials: ["PAN-550-001", "PAN-550-002"],
  },
];

export const DispatchScanner: React.FC = () => {
  const [projectId] = useState<string>("3fa85f64-5717-4562-b3fc-2c963f66afa6");
  const [items, setItems] = useState<SerialVerificationItem[]>(INITIAL_BOM);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [isDispatched, setIsDispatched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stateTransitionError, setStateTransitionError] = useState<
    string | null
  >(null);
  const [scanMessage, setScanMessage] = useState<{
    type: "SUCCESS" | "ERROR" | "INFO";
    text: string;
  }>({
    type: "INFO",
    text: "Awaiting serial scan. Ready for POST /api/dispatch integration.",
  });

  const totalRequired = items.reduce((acc, curr) => acc + curr.requiredQty, 0);
  const totalScanned = items.reduce(
    (acc, curr) => acc + curr.scannedSerials.length,
    0,
  );
  const isFullyDispatched = totalRequired === totalScanned;

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    const serial = barcodeInput.trim().toUpperCase();
    if (!serial) return;

    const isDuplicate = items.some((item) =>
      item.scannedSerials.includes(serial),
    );
    if (isDuplicate) {
      setScanMessage({
        type: "ERROR",
        text: `SERIAL DUPLICATION: Hardware item [${serial}] is already assigned to this project.`,
      });
      setBarcodeInput("");
      return;
    }

    let matchedIndex = -1;
    if (serial.startsWith("INV-")) {
      matchedIndex = items.findIndex((i) => i.category === "INVERTER");
    } else if (serial.startsWith("BAT-")) {
      matchedIndex = items.findIndex((i) => i.category === "BATTERY");
    } else if (serial.startsWith("PAN-")) {
      matchedIndex = items.findIndex((i) => i.category === "PANEL");
    }

    if (matchedIndex === -1) {
      setScanMessage({
        type: "ERROR",
        text: `REJECTED: Serial ${serial} does not match any required BOM SKU category.`,
      });
      return;
    }

    const targetItem = items[matchedIndex];
    if (targetItem.scannedSerials.length >= targetItem.requiredQty) {
      setScanMessage({
        type: "ERROR",
        text: `OVERFILL REJECTED: Required quantity (${targetItem.requiredQty}) for ${targetItem.category} already reached.`,
      });
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item, idx) =>
        idx === matchedIndex
          ? { ...item, scannedSerials: [...item.scannedSerials, serial] }
          : item,
      ),
    );

    setScanMessage({
      type: "SUCCESS",
      text: `VALIDATED: Verified ${targetItem.modelName} (Serial: ${serial}).`,
    });
    setBarcodeInput("");
  };

  const handleDispatchCommit = async () => {
    if (!isFullyDispatched) return;
    setIsLoading(true);
    setStateTransitionError(null);

    const allSerials = items.flatMap((i) => i.scannedSerials);

    try {
      const res = await submitDispatchScanApi({
        projectId,
        serialNumbers: allSerials,
      });

      setIsDispatched(true);
      setScanMessage({
        type: "SUCCESS",
        text: `DISPATCH COMMITTED: Deducted ${res.dispatchedCount ?? allSerials.length} units. Transitioned to [${res.projectStatus ?? "DISPATCHED"}].`,
      });
    } catch (err) {
      if (err instanceof ApiError && err.code === "INVALID_STATE_TRANSITION") {
        setStateTransitionError(
          "INVALID_STATE_TRANSITION: Project must be in ORDER_CONFIRMED status with advance payment recorded before dispatch can be locked.",
        );
      } else {
        setScanMessage({
          type: "ERROR",
          text:
            err instanceof Error
              ? err.message
              : "Stock transaction rolled back by database.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Alert for Invalid State Transitions */}
      {stateTransitionError && (
        <div className="p-4 rounded-lg bg-red-50 border-2 border-enterprise-brick text-enterprise-brick text-xs flex items-start gap-3 shadow-sm">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">
              Finite State Machine Guardrail Triggered
            </h4>
            <p className="mt-0.5">{stateTransitionError}</p>
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
                  isDispatched
                    ? "text-enterprise-forest bg-green-50 border-green-200"
                    : "text-enterprise-amber bg-amber-50 border-amber-200"
                }`}
              >
                STATUS: {isDispatched ? "DISPATCHED" : "ORDER_CONFIRMED"}
              </span>
            </div>
            <h2 className="text-lg font-bold text-enterprise-charcoal mt-1">
              Warehouse Serial Registry & Dispatch Terminal
            </h2>
            <p className="text-xs text-enterprise-smoke">
              Atomic transaction via POST /api/dispatch (Section 4 & 5.1 RBAC)
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
                placeholder="Scan hardware serial or simulate (e.g. BAT-LFP-099, PAN-550-003)..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                disabled={isDispatched || isLoading}
                className="w-full pl-10 pr-4 py-2 bg-enterprise-bg border border-enterprise-border rounded font-mono text-xs text-enterprise-charcoal focus:border-enterprise-blue focus:outline-none disabled:opacity-60"
              />
            </div>
            <button
              type="submit"
              disabled={isDispatched || isLoading}
              className="bg-enterprise-navy hover:bg-slate-800 text-white px-4 py-2 rounded text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-60"
            >
              <Scan className="w-4 h-4" />
              Register Scan
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
            <span className="text-enterprise-smoke font-medium">
              Quick Sim:
            </span>
            <button
              type="button"
              disabled={isDispatched || isLoading}
              onClick={() => setBarcodeInput("BAT-LFP-099")}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 font-mono text-slate-700 border border-enterprise-border disabled:opacity-60"
            >
              + BAT-LFP-099
            </button>
            <button
              type="button"
              disabled={isDispatched || isLoading}
              onClick={() => setBarcodeInput("PAN-550-003")}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 font-mono text-slate-700 border border-enterprise-border disabled:opacity-60"
            >
              + PAN-550-003
            </button>
            <button
              type="button"
              disabled={isDispatched || isLoading}
              onClick={() => setBarcodeInput("PAN-550-004")}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 font-mono text-slate-700 border border-enterprise-border disabled:opacity-60"
            >
              + PAN-550-004
            </button>
          </div>

          <div
            className={`p-3 rounded text-xs border font-medium flex items-center gap-2 ${
              scanMessage.type === "SUCCESS"
                ? "bg-green-50 text-enterprise-forest border-green-200"
                : scanMessage.type === "ERROR"
                  ? "bg-red-50 text-enterprise-brick border-red-200"
                  : "bg-slate-50 text-enterprise-smoke border-enterprise-border"
            }`}
          >
            {scanMessage.type === "SUCCESS" && (
              <CheckCircle className="w-4 h-4 shrink-0" />
            )}
            {scanMessage.type === "ERROR" && (
              <AlertOctagon className="w-4 h-4 shrink-0" />
            )}
            {scanMessage.text}
          </div>
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
                          No serials locked
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {item.scannedSerials.map((s) => (
                            <span
                              key={s}
                              className="font-mono text-[10px] bg-slate-100 text-slate-800 border border-slate-300 px-1.5 py-0.5 rounded"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {complete ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-enterprise-forest">
                          {/* Line 298 */}
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

        <div className="mt-6 pt-4 border-t border-enterprise-border flex items-center justify-between">
          <div className="text-xs text-enterprise-smoke">
            {isDispatched
              ? "Transaction locked. Hardware units assigned to field operations crew."
              : isFullyDispatched
                ? "All BOM components satisfied. Ready for atomic dispatch commit."
                : "Cannot dispatch: all serial numbers must be verified first."}
          </div>
          <button
            type="button"
            disabled={!isFullyDispatched || isDispatched || isLoading}
            onClick={handleDispatchCommit}
            className={`px-5 py-2.5 rounded text-xs font-semibold text-white transition-colors flex items-center gap-2 ${
              isDispatched
                ? "bg-slate-400 cursor-default"
                : isFullyDispatched
                  ? "bg-enterprise-forest hover:bg-green-800 shadow cursor-pointer"
                  : "bg-slate-400 cursor-not-allowed"
            } disabled:opacity-50`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isDispatched
              ? "Dispatched Successfully"
              : "Lock Transaction & Dispatch Hardware"}
          </button>
        </div>
      </div>
    </div>
  );
};
