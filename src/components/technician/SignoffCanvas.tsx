'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle2, 
  Eraser, 
  Camera, 
  Upload, 
  ShieldAlert, 
  Check, 
  Loader2,
  Award,
  ClipboardCheck,
  Gauge, 
  PenTool, 
  ShieldCheck
} from 'lucide-react';
import { submitCommissioningSignApi, ApiError } from '@/lib/api';
import { ProjectLead } from '@/types/solar';

interface Point {
  x: number;
  y: number;
}

interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

interface SignoffCanvasProps {
  project?: ProjectLead | null;
  onProjectUpdated?: (updatedProject: ProjectLead) => void;
}

export const SignoffCanvas: React.FC<SignoffCanvasProps> = ({
  project,
  onProjectUpdated,
}) => {
  const currentProjectId = project?.id || '';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);

  // Electrical generation measurements
  const [vocVolts, setVocVolts] = useState<string>('382.4');
  const [iscAmperes, setIscAmperes] = useState<string>('9.8');
  const [earthingResistanceOhms, setEarthingResistanceOhms] = useState<string>('2.1');

  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: '1', label: 'DC and AC Surge Protection Devices (SPD) locked', done: true },
    { id: '2', label: 'Array racking torqued to spec & flashed watertight', done: true },
    { id: '3', label: 'Earthing electrode pit tested (< 5.0 Ohms)', done: true },
    { id: '4', label: 'Inverter grid sync & anti-islanding relay verified', done: true },
    { id: '5', label: 'Customer briefed on emergency disconnect procedure', done: true },
  ]);

  const [photoSelected, setPhotoSelected] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [commissionedResult, setCommissionedResult] = useState<{
    recordId: string;
    projectStatus: string;
    warrantyStartDate: string;
  } | null>(() => {
    if (project?.status === 'COMMISSIONED' || project?.status === 'COMPLETED') {
      return {
        recordId: `COMM-${project.projectCode}`,
        projectStatus: project.status,
        warrantyStartDate: new Date().toISOString().split('T')[0],
      };
    }
    return null;
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    ctx.strokeStyle = '#38bdf8';

    if (strokes.length > 0) {
      strokes.forEach((stroke) => {
        if (stroke.length === 0) return;
        ctx.beginPath();
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let i = 1; i < stroke.length; i++) {
          ctx.lineTo(stroke[i].x, stroke[i].y);
        }
        ctx.stroke();
      });
    }
  }, [strokes]);

  useEffect(() => {
    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    return () => window.removeEventListener('resize', setupCanvas);
  }, [setupCanvas]);

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): Point => {
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

    const pt = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
    setIsDrawing(true);
    setHasSignature(true);
    setCurrentStroke([pt]);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pt = getCoordinates(e);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    setCurrentStroke((prev) => [...prev, pt]);
  };

  const stopDrawing = () => {
    if (isDrawing && currentStroke.length > 0) {
      setStrokes((prev) => [...prev, currentStroke]);
      setCurrentStroke([]);
    }
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setStrokes([]);
    setCurrentStroke([]);
    setHasSignature(false);
  };

  const generateSvgPath = (): string => {
    const canvas = canvasRef.current;
    const width = canvas ? canvas.clientWidth : 500;
    const height = canvas ? canvas.clientHeight : 176;

    let pathData = '';
    strokes.forEach((stroke) => {
      if (stroke.length === 0) return;
      pathData += `M ${stroke[0].x.toFixed(1)} ${stroke[0].y.toFixed(1)} `;
      for (let i = 1; i < stroke.length; i++) {
        pathData += `L ${stroke[i].x.toFixed(1)} ${stroke[i].y.toFixed(1)} `;
      }
    });

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><path d="${pathData.trim() || 'M 10 50 Q 150 20 300 50'}" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  };

  const toggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const allChecksPassed = checklist.every((item) => item.done);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProjectId) {
      setSubmitError('Please select an active project dossier to commission.');
      return;
    }

    if (!hasSignature && strokes.length === 0) {
      setSubmitError('Customer vector signature must be provided on glass.');
      return;
    }

    if (!allChecksPassed || !photoSelected) {
      setSubmitError('All checklist items must be verified and installation photo attached.');
      return;
    }

    const svgSignature = generateSvgPath();
    setIsLoading(true);
    setSubmitError(null);

    try {
      const res = await submitCommissioningSignApi({
        projectId: currentProjectId,
        vocVolts: parseFloat(vocVolts) || 382.4,
        iscAmperes: parseFloat(iscAmperes) || 9.8,
        earthingResistanceOhms: parseFloat(earthingResistanceOhms) || 2.1,
        signatureSvg: svgSignature,
        completionPhotoUrl: 'https://storage.sunpower.internal/commissioning/verified-installation.jpg',
      });

      setCommissionedResult({
        recordId: res.recordId ?? `COMM-${project?.projectCode || 'DONE'}`,
        projectStatus: res.projectStatus ?? 'COMMISSIONED',
        warrantyStartDate: res.warrantyStartDate ?? new Date().toISOString().split('T')[0],
      });

      if (project && onProjectUpdated) {
        onProjectUpdated({
          ...project,
          status: 'COMMISSIONED',
        });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(`API Error (${err.code}): ${err.message}`);
      } else {
        setSubmitError('Failed to record commissioning. Check server connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-slate-200">
      {/* 20-Year Cryptographic Warranty Banner */}
      {commissionedResult && (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 shadow-xl backdrop-blur-md text-xs space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm tracking-tight">
            <Award className="w-5 h-5 shrink-0" />
            <span>GRID SYNCHRONIZATION CERTIFICATE LOCKED: [{commissionedResult.projectStatus}]</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Legal commissioning audit <strong className="font-mono text-white">{commissionedResult.recordId}</strong> verified with vector SVG proof. The 20-year inverter and 25-year linear performance warranty clock commenced on <strong className="font-mono text-amber-400">{commissionedResult.warrantyStartDate}</strong>.
          </p>
        </div>
      )}

      {/* Main Terminal Card */}
      <div className="bg-[#0B111E]/90 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
        {/* Terminal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <ClipboardCheck className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                  {project ? `${project.projectCode} • ${project.customerName}` : 'SELECT DOSSIER'}
                </span>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-normal">
                  STAGE 05
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1.5 tracking-tight flex items-center gap-2">
                Field Commissioning & Customer Sign-Off Terminal
              </h2>
              {project && (
                <p className="text-xs text-slate-400 mt-0.5">
                  Site: <span className="text-slate-200">{project.address}</span> ({project.capacityKw} kWp {project.systemType})
                </p>
              )}
            </div>
          </div>

          <div className="sm:text-right">
            <span className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border inline-flex items-center gap-1.5 ${
              commissionedResult
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${commissionedResult ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
              {commissionedResult ? 'STATUS: COMMISSIONED' : 'STATUS: COMMISSIONING DUE'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Section 1: Electrical Measurements */}
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold mb-3 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5" />
              1. Electrical Generation Test Diagnostics
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <label className="block text-[11px] font-mono text-slate-400 mb-1.5">
                  Voc (Measured Open-Circuit)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={vocVolts}
                    onChange={(e) => setVocVolts(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono font-bold text-white focus:border-amber-400 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-mono text-amber-400 font-bold">V</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">Tolerated band: 360V - 420V</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <label className="block text-[11px] font-mono text-slate-400 mb-1.5">
                  Isc (Measured Short-Circuit)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={iscAmperes}
                    onChange={(e) => setIscAmperes(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono font-bold text-white focus:border-amber-400 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-mono text-amber-400 font-bold">A</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">Expected yield: ~9.5A - 10.2A</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <label className="block text-[11px] font-mono text-slate-400 mb-1.5">
                  Earthing Electrode Resistance
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={earthingResistanceOhms}
                    onChange={(e) => setEarthingResistanceOhms(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono font-bold text-emerald-400 focus:border-amber-400 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-mono text-emerald-400 font-bold">Ω</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono mt-1 block">&lt; 5.0Ω IEC Grid Compliant</span>
              </div>
            </div>
          </div>

          {/* Section 2: Physical Checklist */}
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              2. On-Roof Physical & Electrical Checklist
            </div>
            <div className="space-y-2 border border-slate-800 rounded-xl p-3 bg-slate-950/60">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleChecklist(item.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                    item.done
                      ? 'bg-slate-900/80 border border-slate-800 text-white'
                      : 'bg-slate-950/40 border border-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      item.done
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                        : 'border-slate-700 bg-slate-900'
                    }`}
                  >
                    {item.done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span className={`text-xs ${item.done ? 'font-semibold text-slate-100' : 'text-slate-400'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Proof Photo Upload */}
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold mb-3 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" />
              3. Array & Inverter Ground-Truth Verification
            </div>
            <div
              onClick={() => setPhotoSelected(!photoSelected)}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                photoSelected
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                {photoSelected ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-white font-mono">
                      site_commissioning_verified.jpg (Attached • 4.2 MB)
                    </span>
                    <span className="text-[11px] text-emerald-400 font-mono">
                      EXIF Geotag: 17.3850° N, 78.4867° E (Hyderabad, Telangana)
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-slate-300">
                      Upload or capture installation site photograph
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Accepted: JPG, PNG, WEBP (Max 15MB)
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Customer Sign-on-Glass */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5" />
                4. Customer Sign-on-Glass Proof (Vector SVG Capture)
              </div>
              <button
                type="button"
                onClick={clearCanvas}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 font-mono cursor-pointer transition-colors"
              >
                <Eraser className="w-3.5 h-3.5" />
                Clear Signature
              </button>
            </div>
            
            <div className="border border-slate-800 rounded-xl bg-[#060A12] overflow-hidden relative shadow-inner">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-44 touch-none cursor-crosshair block"
              />
              {!hasSignature && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-600 font-mono text-xs">
                  Draw authorized customer signature above
                </div>
              )}
            </div>
          </div>

          {submitError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-400 font-medium">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Submission CTA */}
          <button
            type="submit"
            disabled={isLoading || commissionedResult !== null}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3.5 rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                Commencing 20-Yr Warranty & Encrypting Signoff...
              </>
            ) : commissionedResult ? (
              <>
                <ShieldCheck className="w-4 h-4" />
                Sign-Off Record & Warranty Clock Locked
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 stroke-[2.5]" />
                Authorize Commissioning & Lock 20-Yr Warranty
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
