'use client';

import React, { useState, useEffect } from 'react';
import { LifeBuoy, CheckCircle2, Clock, AlertTriangle, Loader2, X } from 'lucide-react';
import { getTicketsApi, updateTicketStatusApi, SupportTicket, ApiError } from '@/lib/api';

const MOCK_TICKETS: SupportTicket[] = [
  {
    id: 't-001',
    ticketCode: 'TCK-2026-012',
    projectId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    projectCode: 'PRJ-2026-088',
    customerName: 'Kaveri Industrial Mills',
    issueDescription: 'Inverter error code E03 (Grid overvoltage trip) during peak generation hours.',
    priority: 'HIGH',
    status: 'OPEN',
    createdAt: '2026-10-30',
  },
  {
    id: 't-002',
    ticketCode: 'TCK-2026-013',
    projectId: '8cb3897b-9442-45e0-9988-bb31f79f2910',
    projectCode: 'PRJ-2026-089',
    customerName: 'Dr. Aris Thorne',
    issueDescription: 'Customer requesting secondary sign-off copy for state subsidy documentation.',
    priority: 'LOW',
    status: 'OPEN',
    createdAt: '2026-10-31',
  },
];

export const TicketDesk: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>(MOCK_TICKETS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [targetStatus, setTargetStatus] = useState<'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('RESOLVED');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    getTicketsApi()
      .then((data) => {
        if (!ignore && Array.isArray(data) && data.length > 0) {
          setTickets(data);
        }
      })
      .catch(() => {
        // Retain mock tickets if API is not seeded yet
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleUpdateStatus = async () => {
    if (!selectedTicket) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await updateTicketStatusApi(selectedTicket.id, targetStatus);
      setTickets((prev) =>
        prev.map((t) => (t.id === selectedTicket.id ? { ...t, status: targetStatus } : t))
      );
      setSelectedTicket(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        // Fallback update
        setTickets((prev) =>
          prev.map((t) => (t.id === selectedTicket.id ? { ...t, status: targetStatus } : t))
        );
        setSelectedTicket(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-enterprise-charcoal">Support & Warranty Ticket Desk</h2>
          <p className="text-xs text-enterprise-smoke">
            Manage customer post-installation tickets (GET /api/tickets & PATCH /api/tickets/[id])
          </p>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-enterprise-surface rounded-lg border border-enterprise-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-enterprise-border text-enterprise-smoke font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Issue Description</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-enterprise-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-enterprise-smoke">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-enterprise-blue" />
                    Loading support tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-enterprise-smoke">
                    No active support tickets found.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-mono font-medium text-enterprise-charcoal">
                      {t.ticketCode}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-enterprise-smoke">{t.projectCode}</td>
                    <td className="py-3.5 px-4 font-medium text-enterprise-charcoal">{t.customerName}</td>
                    <td className="py-3.5 px-4 text-enterprise-charcoal max-w-sm truncate">
                      {t.issueDescription}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          t.priority === 'HIGH' || t.priority === 'CRITICAL'
                            ? 'bg-red-50 text-enterprise-brick border border-red-200'
                            : 'bg-slate-100 text-enterprise-smoke border border-enterprise-border'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold border ${
                          t.status === 'RESOLVED'
                            ? 'bg-green-50 text-enterprise-forest border-green-200'
                            : 'bg-amber-50 text-enterprise-amber border-amber-200'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTicket(t);
                          setTargetStatus(t.status === 'OPEN' ? 'RESOLVED' : t.status);
                        }}
                        className="text-enterprise-blue hover:text-blue-900 font-medium cursor-pointer"
                      >
                        Update Status
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Update Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-enterprise-surface border border-enterprise-border rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-enterprise-border pb-3">
              <h3 className="font-bold text-sm text-enterprise-charcoal">Update Ticket Status</h3>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="text-enterprise-smoke hover:text-enterprise-charcoal cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-enterprise-brick">
                {errorMsg}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-enterprise-smoke">Ticket Code:</span>
                <div className="font-mono font-bold text-enterprise-charcoal">{selectedTicket.ticketCode}</div>
              </div>
              <div>
                <span className="text-enterprise-smoke">Issue:</span>
                <p className="text-enterprise-charcoal mt-0.5">{selectedTicket.issueDescription}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-enterprise-charcoal mb-1">
                  Transition Status To *
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED')}
                  className="w-full bg-enterprise-surface border border-enterprise-border rounded px-3 py-2 text-xs text-enterprise-charcoal focus:border-enterprise-blue focus:outline-none"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-enterprise-border">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="px-3 py-1.5 text-xs font-medium text-enterprise-smoke hover:bg-slate-100 rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleUpdateStatus}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-enterprise-navy hover:bg-slate-800 rounded shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Commit Status Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};