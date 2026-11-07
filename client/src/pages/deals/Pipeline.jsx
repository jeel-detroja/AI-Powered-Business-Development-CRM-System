import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { dealService, companyService, contactService } from '../../services/index';
import { formatCurrency, formatDate, getErrorMessage, getInitials } from '../../utils/index';
import { DEAL_STAGES, STAGE_COLORS, LEAD_PRIORITIES, PRIORITY_COLORS } from '../../constants/index';
import { TableSkeleton } from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import Modal from '../../components/common/Modal';
import { toast } from 'sonner';
import {
  Plus, TrendingUp, DollarSign, Award, Target, Building2, User, Clock, ChevronRight
} from 'lucide-react';

export default function Pipeline() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    value: 0,
    stage: 'Qualification',
    probability: 20,
    priority: 'Medium',
    expectedCloseDate: '',
    company: '',
    notes: '',
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['deals-pipeline'],
    queryFn: () => dealService.getPipeline(),
  });

  const { data: companiesData } = useQuery({
    queryKey: ['companies-dropdown'],
    queryFn: () => companyService.getCompanies({ limit: 100 }),
  });

  const moveStageMutation = useMutation({
    mutationFn: ({ id, stage }) => dealService.moveDealStage(id, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals-pipeline'] });
      toast.success('Deal stage updated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const createDealMutation = useMutation({
    mutationFn: (payload) => dealService.createDeal(payload),
    onSuccess: () => {
      toast.success('Deal created');
      queryClient.invalidateQueries({ queryKey: ['deals-pipeline'] });
      setModalOpen(false);
      setForm({ title: '', value: 0, stage: 'Qualification', probability: 20, priority: 'Medium', expectedCloseDate: '', company: '', notes: '' });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isLoading) return <TableSkeleton rows={6} cols={6} />;
  if (error) return <ErrorState message="Failed to load pipeline" onRetry={refetch} />;

  const pipeline = data?.data?.data?.pipeline || {};
  const metrics = data?.data?.data?.metrics || {};
  const companies = companiesData?.data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deals & Sales Pipeline</h1>
          <p className="text-gray-500 text-sm mt-0.5">Visualize deal velocity and revenue forecasts</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus size={14} /> New Deal
        </button>
      </div>

      {/* Pipeline Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="card p-3">
          <p className="text-xs text-gray-500">Pipeline Value</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(metrics.totalPipelineValue)}</p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-gray-500">Weighted Forecast</p>
          <p className="text-lg font-bold text-indigo-600">{formatCurrency(metrics.weightedPipelineValue)}</p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-gray-500">Won Revenue</p>
          <p className="text-lg font-bold text-emerald-600">{formatCurrency(metrics.wonRevenue)}</p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-gray-500">Win Rate</p>
          <p className="text-lg font-bold text-gray-900">{metrics.winRate || 0}%</p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-gray-500">Avg Deal Size</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(metrics.avgDealSize)}</p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-gray-500">Active Deals</p>
          <p className="text-lg font-bold text-gray-900">{metrics.activeDeals || 0}</p>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-6">
        {DEAL_STAGES.map((stage) => {
          const stageDeals = pipeline[stage] || [];
          const stageTotal = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);

          return (
            <div key={stage} className="w-80 flex-shrink-0 flex flex-col bg-gray-100/70 rounded-xl p-3 border border-gray-200">
              <div className="flex items-center justify-between mb-3 px-1">
                <div>
                  <h3 className="font-semibold text-sm text-gray-900">{stage}</h3>
                  <span className="text-xs text-gray-500">{stageDeals.length} deals • {formatCurrency(stageTotal)}</span>
                </div>
                <span className={`badge text-[11px] ${STAGE_COLORS[stage] || 'bg-gray-200'}`}>
                  {stageDeals.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
                {stageDeals.map((deal) => (
                  <div
                    key={deal._id}
                    className="card p-3.5 hover:shadow-md transition-shadow cursor-pointer bg-white"
                    onClick={() => navigate(`/deals/${deal._id}`)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-semibold text-sm text-gray-900 line-clamp-1 hover:text-primary-600">
                        {deal.title}
                      </p>
                      <span className={`badge text-[10px] ${PRIORITY_COLORS[deal.priority] || 'bg-gray-100'}`}>
                        {deal.priority}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span className="font-bold text-sm text-gray-900">{formatCurrency(deal.value)}</span>
                      <span>{deal.probability || 0}% prob</span>
                    </div>

                    {deal.company && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                        <Building2 size={12} className="text-gray-400" />
                        <span className="truncate">{deal.company.name}</span>
                      </p>
                    )}

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                      <span>{deal.expectedCloseDate ? formatDate(deal.expectedCloseDate) : 'No close date'}</span>
                      {/* Quick stage mover */}
                      <select
                        className="text-[11px] bg-gray-50 border border-gray-200 rounded px-1 py-0.5"
                        value={deal.stage}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          moveStageMutation.mutate({ id: deal._id, stage: e.target.value });
                        }}
                      >
                        {DEAL_STAGES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}

                {stageDeals.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg text-xs text-gray-400">
                    No deals in {stage}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Deal Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create New Deal">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createDealMutation.mutate({
              ...form,
              value: Number(form.value) || 0,
              probability: Number(form.probability) || 10,
              company: form.company || undefined,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="label">Deal Title *</label>
            <input
              className="input"
              required
              placeholder="e.g. Acme Corp Enterprise Platform"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Deal Value (₹) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">₹</span>
                <input
                  type="number"
                  min="0"
                  className="input pl-7"
                  placeholder="0"
                  required
                  value={form.value || ''}
                  onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div>
              <label className="label">Probability (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="input"
                value={form.probability}
                onChange={(e) => setForm({ ...form, probability: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Pipeline Stage</label>
              <select
                className="input"
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value })}
              >
                {DEAL_STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select
                className="input"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                {LEAD_PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Associated Company</label>
              <select
                className="input"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              >
                <option value="">None</option>
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Target Close Date</label>
              <input
                type="date"
                className="input"
                value={form.expectedCloseDate}
                onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label">Deal Notes</label>
            <textarea
              className="input h-20"
              placeholder="Scope, decision makers, key milestones..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createDealMutation.isPending} className="btn-primary">
              {createDealMutation.isPending ? 'Creating...' : 'Create Deal'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
