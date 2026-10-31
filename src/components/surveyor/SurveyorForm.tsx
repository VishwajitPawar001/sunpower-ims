'use client';

import React, { useState } from 'react';
import { 
  Compass, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  SunMedium, 
  Gauge, 
  ShieldAlert, 
  FileText,
  Check
} from 'lucide-react';
import { submitSurveyApi, SiteSurveyPayload } from '@/lib/api';
import { ProjectLead, ProjectStatus } from '@/types/solar';

interface SurveyorFormProps {
  project?: ProjectLead | null;
  onProjectUpdated?: (updatedProject: ProjectLead) => void;
}

export const SurveyorForm: React.FC<SurveyorFormProps> = ({
  project,
  onProjectUpdated,
}) => {
  const currentProjectId = project?.id || '';

  const [formData, setFormData] = useState<SiteSurveyPayload>({
    projectId: currentProjectId,
    usableAreaSqm: project ? Number(project.capacityKw) * 10 : 35.0,
    tiltDegrees: 18.0,
    azimuthDegrees: 185.0,
    cableRunMeters: 28.0,
    sanctionedLoadKw: project ? Number(project.capacityKw) : 5.0,
    isShadowFree: true,
    isViable: true,
    notes: 'South-facing RCC slab. Parapet shadow-free from 09:00 to 16:00.',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string } | null>(null);

  const usableArea = formData.usableAreaSqm ?? 35.0;
  const estimatedCapacityKw = (usableArea / 10).toFixed(1);
  const azimuthDrift = Math.abs(formData.azimuthDegrees - 180);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId) {
      setStatusMessage({ type: 'ERROR', text: 'Please select an assigned customer dossier to submit survey.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await submitSurveyApi(formData);
      const nextStatus = (res.projectStatus as ProjectStatus) || 'SURVEY_APPROVED';
      setStatusMessage({
        type: 'SUCCESS',
        text: `Survey validated successfully. Project transitioned to [${nextStatus}].`,
      });
      if (project && onProjectUpdated) {
        onProjectUpdated({
          ...project,
          status: nextStatus,
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'ERROR',
        text: err instanceof Error ? err.message : 'Failed to record site survey.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!formData.projectId) {
      setStatusMessage({ type: 'ERROR', text: 'Please select an assigned customer dossier to reject survey.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    const rejectedData = { ...formData, isViable: false };
    setFormData(rejectedData);

    try {
      const res = await submitSurveyApi(rejectedData);
      const nextStatus = (res.projectStatus as ProjectStatus) || 'REJECTED';
      setStatusMessage({
        type: 'SUCCESS',
        text: `Roof marked structurally unviable. State transitioned to [${nextStatus}].`,
      });
      if (project && onProjectUpdated) {
        onProjectUpdated({
          ...project,
          status: nextStatus,
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'ERROR',
        text: err instanceof Error ? err.message : 'Failed to record site survey rejection.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-slate-200">
      <div className="bg-[#0B111E]/90 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Compass className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                  {project ? `${project.projectCode} • ${project.customerName}` : 'SELECT DOSSIER'}
                </span>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-normal">
                  STAGE 02
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1.5 tracking-tight flex items-center gap-2">
                Rooftop Solar Feasibility & 3D Azimuth Assessment
              </h2>
              {project && (
                <p className="text-xs text-slate-400 mt-0.5">
                  Address: <span className="text-slate-200">{project.address}</span> (Target Capacity: {project.capacityKw} kWp)
                </p>
              )}
            </div>
          </div>

          <div className="sm:text-right">
            <div className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5">
              <SunMedium className="w-4 h-4 text-amber-400 animate-pulse" />
              SOLAR WINDOW: OPTIMAL
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 my-6">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="text-[11px] font-mono text-slate-400">PV Generation Potential</div>
            <div className="text-xl font-bold font-mono text-amber-400 mt-1">~{estimatedCapacityKw} kWp</div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-mono">10 m² / kWp standard</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="text-[11px] font-mono text-slate-400">Azimuth True South</div>
            <div className="text-xl font-bold font-mono text-white mt-1">{formData.azimuthDegrees}°</div>
            <div className="text-[10px] text-emerald-400 mt-0.5 font-mono">{azimuthDrift}° drift from 180°</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="text-[11px] font-mono text-slate-400">Racking Tilt Angle</div>
            <div className="text-xl font-bold font-mono text-white mt-1">{formData.tiltDegrees}°</div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-mono">Latitude matched</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="text-[11px] font-mono text-slate-400">DC Drop Risk</div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {formData.cableRunMeters > 40 ? 'COMPENSATED' : '< 1.5%'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{formData.cableRunMeters}m to Inverter</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold mb-3 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5" />
              Section 1: Rooftop Surface Geometry
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Usable Shadow-Free Roof Area (m²) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10000"
                    value={formData.usableAreaSqm || 35}
                    onChange={(e) =>
                      setFormData({ ...formData, usableAreaSqm: parseFloat(e.target.value) || 0 })
                    }
                    required
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3.5 py-2 text-xs font-mono text-white focus:border-amber-400 focus:outline-none transition-colors"
                  />
                  <span className="absolute right-3 top-2 text-xs font-mono text-slate-500 pointer-events-none">m²</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">Rule: 10 m² per kWp required</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Roof Slope Tilt Angle (0° - 90°) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="90"
                    value={formData.tiltDegrees}
                    onChange={(e) =>
                      setFormData({ ...formData, tiltDegrees: parseFloat(e.target.value) || 0 })
                    }
                    required
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3.5 py-2 text-xs font-mono text-white focus:border-amber-400 focus:outline-none transition-colors"
                  />
                  <span className="absolute right-3 top-2 text-xs font-mono text-slate-500 pointer-events-none">deg</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">Optimal latitude slope: 15° - 20°</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Azimuth Direction Angle (0° - 360°) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="360"
                    value={formData.azimuthDegrees}
                    onChange={(e) =>
                      setFormData({ ...formData, azimuthDegrees: parseFloat(e.target.value) || 0 })
                    }
                    required
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3.5 py-2 text-xs font-mono text-white focus:border-amber-400 focus:outline-none transition-colors"
                  />
                  <span className="absolute right-3 top-2 text-xs font-mono text-slate-500 pointer-events-none">deg</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">True South: 180° (Zero drift)</span>
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold mb-3 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5" />
              Section 2: Discom Interconnect & Cable Run
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Sanctioned Grid Connected Load (kW) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="100"
                    value={formData.sanctionedLoadKw}
                    onChange={(e) =>
                      setFormData({ ...formData, sanctionedLoadKw: parseFloat(e.target.value) || 0 })
                    }
                    required
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:border-amber-400 focus:outline-none transition-colors"
                  />
                  <span className="absolute right-3 top-2 text-xs font-mono text-slate-500 pointer-events-none">kW</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">Discom bi-directional meter rating</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Estimated Cable Run to Inverter (Meters) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="500"
                    value={formData.cableRunMeters}
                    onChange={(e) =>
                      setFormData({ ...formData, cableRunMeters: parseFloat(e.target.value) || 0 })
                    }
                    required
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:border-amber-400 focus:outline-none transition-colors"
                  />
                  <span className="absolute right-3 top-2 text-xs font-mono text-slate-500 pointer-events-none">m</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">Runs &gt; 40m auto-apply drop compensation</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold mb-2">
              Section 3: Environmental & Structural Sign-Off
            </div>

            <label className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
              formData.isShadowFree 
                ? 'bg-slate-950/80 border-slate-700/80' 
                : 'bg-slate-950/40 border-slate-800/80 opacity-60'
            }`}>
              <input
                type="checkbox"
                checked={formData.isShadowFree}
                onChange={(e) => setFormData({ ...formData, isShadowFree: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded text-amber-500 border-slate-700 focus:ring-amber-500 bg-slate-900"
              />
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Shadow-Free Solar Window Verified</span>
                  {formData.isShadowFree && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Confirmed no physical shading from parapets, overhead tanks, or adjacent trees between 09:00 - 16:00.
                </p>
              </div>
            </label>

            <label className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
              formData.isViable 
                ? 'bg-slate-950/80 border-slate-700/80' 
                : 'bg-rose-500/10 border-rose-500/30'
            }`}>
              <input
                type="checkbox"
                checked={formData.isViable}
                onChange={(e) => setFormData({ ...formData, isViable: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded text-amber-500 border-slate-700 focus:ring-amber-500 bg-slate-900"
              />
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Roof Structurally Viable for MMS Racking</span>
                  {formData.isViable ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Slab load-bearing capacity rated for 150 km/h wind gusts. Unchecking marks site as [REJECTED].
                </p>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Field Surveyor Observation Log
            </label>
            <textarea
              rows={3}
              value={formData.notes ?? ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Record structural observations, parapet heights, RCC anchor specifications..."
              className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none transition-colors"
            />
          </div>

          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 font-medium ${
                statusMessage.type === 'SUCCESS'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              }`}
            >
              {statusMessage.type === 'SUCCESS' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              disabled={isLoading}
              onClick={handleReject}
              className="px-4 py-2.5 text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg border border-rose-500/30 disabled:opacity-50 cursor-pointer transition-colors"
            >
              Reject Site Feasibility
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-lg shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer transition-all active:scale-95"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-950" />}
              Submit Feasibility Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
