'use client';

import React, { useState } from 'react';
import { Compass, CheckCircle2 } from 'lucide-react';
import { SiteSurveyInput } from '@/types/solar';

export const SurveyorForm: React.FC = () => {
  const [formData, setFormData] = useState<SiteSurveyInput>({
    projectId: 'PRJ-2026-091',
    usableAreaSqm: 42.5,
    tiltDegrees: 18.0,
    azimuthDegrees: 185.0,
    cableRunMeters: 28.0,
    sanctionedLoadKw: 5.0,
    isShadowFree: true,
    isViable: true,
    notes: 'South-facing RCC slab. Zero parapet shadow between 9 AM and 4 PM.',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleReject = () => {
    setFormData((prev) => ({ ...prev, isViable: false }));
    setSubmitted(true);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-enterprise-surface rounded-lg border border-enterprise-border p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-enterprise-border pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-enterprise-blue">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-enterprise-charcoal">
                Rooftop Solar Site Survey & Feasibility
              </h2>
              <p className="text-xs text-enterprise-smoke">
                Schema-enforced input per Zod specification (Section 5.2)
              </p>
            </div>
          </div>
          <span className="text-xs font-mono bg-slate-100 text-enterprise-smoke px-2.5 py-1 rounded border border-enterprise-border">
            {formData.projectId}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Usable Area */}
            <div>
              <label className="block text-xs font-semibold text-enterprise-charcoal mb-1">
                Usable Roof Area (m²) *
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="10000"
                value={formData.usableAreaSqm}
                onChange={(e) =>
                  setFormData({ ...formData, usableAreaSqm: parseFloat(e.target.value) || 0 })
                }
                required
                className="w-full bg-enterprise-surface border border-enterprise-border rounded px-3 py-2 text-sm text-enterprise-charcoal focus:border-enterprise-blue focus:outline-none"
              />
              <span className="text-[11px] text-enterprise-smoke">Required: &gt; 10 m² per kWp</span>
            </div>

            {/* Sanctioned Grid Load */}
            <div>
              <label className="block text-xs font-semibold text-enterprise-charcoal mb-1">
                Sanctioned Grid Load (kW) *
              </label>
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
                className="w-full bg-enterprise-surface border border-enterprise-border rounded px-3 py-2 text-sm text-enterprise-charcoal focus:border-enterprise-blue focus:outline-none"
              />
              <span className="text-[11px] text-enterprise-smoke">Discom electricity connection capacity</span>
            </div>

            {/* Roof Tilt */}
            <div>
              <label className="block text-xs font-semibold text-enterprise-charcoal mb-1">
                Roof Tilt Angle (Degrees 0° - 90°) *
              </label>
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
                className="w-full bg-enterprise-surface border border-enterprise-border rounded px-3 py-2 text-sm text-enterprise-charcoal focus:border-enterprise-blue focus:outline-none"
              />
              <span className="text-[11px] text-enterprise-smoke">Optimal for latitude: 15° - 20°</span>
            </div>

            {/* Azimuth */}
            <div>
              <label className="block text-xs font-semibold text-enterprise-charcoal mb-1">
                Azimuth Angle (Degrees 0° - 360°) *
              </label>
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
                className="w-full bg-enterprise-surface border border-enterprise-border rounded px-3 py-2 text-sm text-enterprise-charcoal focus:border-enterprise-blue focus:outline-none"
              />
              <span className="text-[11px] text-enterprise-smoke">True South is 180° (Ideal)</span>
            </div>

            {/* Cable Run */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-enterprise-charcoal mb-1">
                Estimated Cable Run to Inverter / Meter (Meters) *
              </label>
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
                className="w-full bg-enterprise-surface border border-enterprise-border rounded px-3 py-2 text-sm text-enterprise-charcoal focus:border-enterprise-blue focus:outline-none"
              />
              <span className="text-[11px] text-enterprise-smoke">
                Runs &gt; 40m trigger DC voltage drop gauge expansion
              </span>
            </div>
          </div>

          {/* Shadow & Viability Toggles */}
          <div className="pt-2 border-t border-enterprise-border space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isShadowFree}
                onChange={(e) => setFormData({ ...formData, isShadowFree: e.target.checked })}
                className="w-4 h-4 rounded text-enterprise-blue border-enterprise-border focus:ring-enterprise-blue"
              />
              <div>
                <span className="text-xs font-semibold text-enterprise-charcoal">
                  Shadow-Free Solar Window Verified
                </span>
                <p className="text-[11px] text-enterprise-smoke">
                  No obstruction from parapets, water tanks, or adjacent trees between 09:00 - 16:00.
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isViable}
                onChange={(e) => setFormData({ ...formData, isViable: e.target.checked })}
                className="w-4 h-4 rounded text-enterprise-blue border-enterprise-border focus:ring-enterprise-blue"
              />
              <div>
                <span className="text-xs font-semibold text-enterprise-charcoal">
                  Roof Structurally Viable for Module Mounting Structures (MMS)
                </span>
                <p className="text-[11px] text-enterprise-smoke">
                  Unchecking this automatically transitions project to [REJECTED] state.
                </p>
              </div>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-enterprise-charcoal mb-1">
              Field Surveyor Notes & Observations
            </label>
            <textarea
              rows={3}
              value={formData.notes ?? ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-enterprise-surface border border-enterprise-border rounded px-3 py-2 text-sm text-enterprise-charcoal focus:border-enterprise-blue focus:outline-none"
            />
          </div>

          {submitted && (
            <div
              className={`p-3 rounded text-xs flex items-center gap-2 font-medium ${
                formData.isViable
                  ? 'bg-green-50 border border-green-200 text-enterprise-forest'
                  : 'bg-red-50 border border-red-200 text-enterprise-brick'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {formData.isViable
                ? 'Survey validated and recorded. Project state updated to SURVEY_APPROVED.'
                : 'Site marked structurally non-viable. Project transitioned to REJECTED.'}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-enterprise-border">
            <button
              type="button"
              onClick={handleReject}
              className="px-4 py-2 text-xs font-semibold text-enterprise-brick bg-red-50 hover:bg-red-100 rounded border border-red-200"
            >
              Reject Site
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-enterprise-navy hover:bg-slate-800 rounded shadow-sm"
            >
              Submit Feasibility Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};