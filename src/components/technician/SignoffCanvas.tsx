'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle2, 
  Eraser, 
  Camera, 
  Upload, 
  ShieldAlert, 
  Check 
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export const SignoffCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Electrical Generation Measurements
  const [voc, setVoc] = useState<string>('382.4');
  const [isc, setIsc] = useState<string>('9.8');
  const [earthingOhms, setEarthingOhms] = useState<string>('2.1');

  // Inspection Checklist
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: '1', label: 'DC and AC Surge Protection Devices (SPD) locked', done: true },
    { id: '2', label: 'Array racking torqued to spec & flashed watertight', done: true },
    { id: '3', label: 'Earthing electrode pit tested (< 5.0 Ohms)', done: true },
    { id: '4', label: 'Inverter grid sync & anti-islanding relay verified', done: false },
    { id: '5', label: 'Customer briefed on emergency disconnect procedure', done: false },
  ]);

  const [photoSelected, setPhotoSelected] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');

  // Initialize responsive canvas
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#020617';
  }, []);

  useEffect(() => {
    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    return () => window.removeEventListener('resize', setupCanvas);
  }, [setupCanvas]);

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    const mouseEvent = e as React.MouseEvent<HTMLCanvasElement>;
    return {
      x: mouseEvent.clientX - rect.left,
      y: mouseEvent.clientY - rect.top,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#020617';
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const toggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const allChecksPassed = checklist.every((item) => item.done);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSignature || !allChecksPassed || !photoSelected) {
      setSubmitStatus('ERROR');
      return;
    }
    setSubmitStatus('SUCCESS');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-enterprise-surface p-6 rounded-lg border border-enterprise-border shadow-sm">
        <div className="flex items-center justify-between border-b border-enterprise-border pb-4">
          <div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-enterprise-smoke border border-enterprise-border uppercase tracking-wider">
              PRJ-2026-089
            </span>
            <h2 className="text-lg font-bold text-enterprise-charcoal mt-1">
              Field Commissioning & Customer Signoff
            </h2>
            <p className="text-xs text-enterprise-smoke">
              Lead Technician: Marcus Vance (Tech ID: TC-841)
            </p>
          </div>
          <span className="px-3 py-1 rounded text-xs font-medium bg-amber-50 text-enterprise-amber border border-amber-200">
            COMMISSIONING DUE
          </span>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Step 1: Electrical Generation Tests */}
          <div>
            <h3 className="text-sm font-semibold text-enterprise-charcoal uppercase tracking-wider mb-3">
              1. Generation Test Diagnostics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-enterprise-smoke mb-1">
                  Voc (Measured Volts)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={voc}
                    onChange={(e) => setVoc(e.target.value)}
                    required
                    className="w-full bg-enterprise-surface border border-enterprise-border rounded px-3 py-2 text-sm text-enterprise-charcoal focus:border-enterprise-blue focus:outline-none"
                  />
                  <span className="absolute right-3 top-2 text-xs text-enterprise-smoke">V</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-enterprise-smoke mb-1">
                  Isc (Measured Amps)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={isc}
                    onChange={(e) => setIsc(e.target.value)}
                    required
                    className="w-full bg-enterprise-surface border border-enterprise-border rounded px-3 py-2 text-sm text-enterprise-charcoal focus:border-enterprise-blue focus:outline-none"
                  />
                  <span className="absolute right-3 top-2 text-xs text-enterprise-smoke">A</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-enterprise-smoke mb-1">
                  Earthing Resistance
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={earthingOhms}
                    onChange={(e) => setEarthingOhms(e.target.value)}
                    required
                    className="w-full bg-enterprise-surface border border-enterprise-border rounded px-3 py-2 text-sm text-enterprise-charcoal focus:border-enterprise-blue focus:outline-none"
                  />
                  <span className="absolute right-3 top-2 text-xs text-enterprise-smoke">Ω</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Verification Checklist */}
          <div>
            <h3 className="text-sm font-semibold text-enterprise-charcoal uppercase tracking-wider mb-3">
              2. On-Roof Physical Checklist
            </h3>
            <div className="space-y-2 border border-enterprise-border rounded-lg p-3 bg-enterprise-bg">
              {checklist.map((item) => (
                <label
                  key={item.id}
                  onClick={() => toggleChecklist(item.id)}
                  className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-white transition-colors"
                >
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                      item.done
                        ? 'bg-enterprise-forest border-enterprise-forest text-white'
                        : 'border-enterprise-border bg-white'
                    }`}
                  >
                    {item.done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span
                    className={`text-sm ${
                      item.done
                        ? 'text-enterprise-charcoal font-medium'
                        : 'text-enterprise-smoke'
                    }`}
                  >
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Step 3: Commissioning Photo */}
          <div>
            <h3 className="text-sm font-semibold text-enterprise-charcoal uppercase tracking-wider mb-3">
              3. Array & Inverter Proof Photo
            </h3>
            <div
              onClick={() => setPhotoSelected(!photoSelected)}
              className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
                photoSelected
                  ? 'border-enterprise-forest bg-green-50/50'
                  : 'border-enterprise-border bg-enterprise-bg hover:border-enterprise-blue'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                {photoSelected ? (
                  <>
                    <CheckCircle2 className="w-8 h-8 text-enterprise-forest" />
                    <span className="text-xs font-semibold text-enterprise-forest">
                      site_commissioning_roof_089.jpg (Attached - 4.2 MB)
                    </span>
                    <span className="text-[11px] text-enterprise-smoke">Tap to replace</span>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-slate-200/70 flex items-center justify-center text-enterprise-smoke">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-enterprise-charcoal">
                      Upload or take installation site photo
                    </span>
                    <span className="text-[11px] text-enterprise-smoke">
                      PNG, JPG up to 10MB (Must show inverter status LEDs & PV array)
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Step 4: Customer Signature Canvas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-enterprise-charcoal uppercase tracking-wider">
                4. Customer Sign-on-Glass Proof
              </h3>
              <button
                type="button"
                onClick={clearCanvas}
                className="flex items-center gap-1 text-xs text-enterprise-smoke hover:text-enterprise-brick font-medium"
              >
                <Eraser className="w-3.5 h-3.5" />
                Clear Signature
              </button>
            </div>
            <div className="border border-enterprise-border rounded-lg bg-white overflow-hidden shadow-inner">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-44 touch-none cursor-crosshair bg-white block"
              />
            </div>
            <p className="text-[11px] text-enterprise-smoke mt-1.5">
              By signing above, the customer confirms electrical energization and warranty certificate initiation.
            </p>
          </div>

          {/* Feedback Alerts */}
          {submitStatus === 'ERROR' && (
            <div className="p-3 rounded bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-enterprise-brick font-medium">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              Complete all checklist items, attach proof photo, and capture signature before submission.
            </div>
          )}

          {submitStatus === 'SUCCESS' && (
            <div className="p-3 rounded bg-green-50 border border-green-200 flex items-center gap-2 text-xs text-enterprise-forest font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Commissioning record confirmed. Serial warranties initialized in registry. Status transitioned to COMPLETED.
            </div>
          )}

          {/* Action CTA */}
          <button
            type="submit"
            className="w-full bg-enterprise-navy hover:bg-slate-800 text-white font-medium py-3 rounded-lg text-sm transition-colors shadow flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Submit Final Commissioning & Lock Record
          </button>
        </form>
      </div>
    </div>
  );
};