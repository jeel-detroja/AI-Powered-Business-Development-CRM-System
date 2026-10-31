import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dealService, activityService } from '../../services/index';
import { formatDate, formatDateTime, formatCurrency, getErrorMessage } from '../../utils/index';
import { DEAL_STAGES, STAGE_COLORS, PRIORITY_COLORS } from '../../constants/index';
import { TableSkeleton } from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import { ConfirmDialog } from '../../components/common/Modal';
import { toast } from 'sonner';
import {
  ArrowLeft, Building2, User, Calendar, DollarSign, Target, Trash2, Edit, Clock, CheckCircle2, TrendingUp
} from 'lucide-react';

export default function DealDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteModal, setDeleteModal] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['deal', id],
    queryFn: () => dealService.getDeal(id),
  });

  const { data: activitiesData } = useQuery({
    queryKey: ['deal-activities', id],
    queryFn: () => activityService.getActivities({ deal: id }),
  });

  const moveStageMutation = useMutation({
    mutationFn: (stage) => dealService.moveDealStage(id, stage),
    onSuccess: () => {
      toast.success('Stage updated');
      queryClient.invalidateQueries({ queryKey: ['deal', id] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => dealService.deleteDeal(id),
    onSuccess: () => {
      toast.success('Deal deleted');
      navigate('/pipeline');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isLoading) return <TableSkeleton rows={8} cols={4} />;
  if (error || !data?.data?.data) return <ErrorState message="Deal not found" onRetry={refetch} />;

  const deal = data.data.data;
  const activities = activitiesData?.data?.data || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pipeline')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{deal.title}</h1>
              <span className={`badge ${STAGE_COLORS[deal.stage] || 'bg-gray-100'}`}>{deal.stage}</span>
              <span className={`badge ${PRIORITY_COLORS[deal.priority] || 'bg-gray-100'}`}>{deal.priority}</span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {deal.company ? `Company: ${deal.company.name}` : 'No associated company'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setDeleteModal(true)} className="btn-secondary text-red-600 hover:bg-red-50">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* Stage Progression Bar */}
      <div className="card p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Pipeline Progression</p>
        <div className="grid grid-cols-6 gap-2">
          {DEAL_STAGES.map((stg) => {
            const isCurrent = deal.stage === stg;
            return (
              <button
                key={stg}
                onClick={() => moveStageMutation.mutate(stg)}
                disabled={moveStageMutation.isPending}
                className={`p-2.5 rounded-lg text-xs font-semibold text-center transition-all ${
                  isCurrent
                    ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {stg}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Deal Metrics & Economics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-400 block">Total Value</span>
                <span className="text-xl font-bold text-gray-900">{formatCurrency(deal.value)}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-400 block">Win Probability</span>
                <span className="text-xl font-bold text-indigo-600">{deal.probability || 0}%</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-400 block">Expected Revenue</span>
                <span className="text-xl font-bold text-emerald-600">
                  {formatCurrency((deal.value || 0) * ((deal.probability || 0) / 100))}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-sm">
              <div>
                <span className="text-xs text-gray-400 block">Target Closing Date</span>
                <span className="font-medium text-gray-800">{formatDate(deal.expectedCloseDate)}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block">Deal Owner</span>
                <span className="font-medium text-gray-800">
                  {deal.owner ? `${deal.owner.firstName} ${deal.owner.lastName}` : 'Unassigned'}
                </span>
              </div>
            </div>

            {deal.notes && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-medium mb-1">Deal Notes</p>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg leading-relaxed">{deal.notes}</p>
              </div>
            )}
          </div>

          {/* Stage History */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Stage History</h3>
            {deal.stageHistory && deal.stageHistory.length > 0 ? (
              <div className="space-y-3">
                {deal.stageHistory.map((sh, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-2 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <span className={`badge ${STAGE_COLORS[sh.stage] || 'bg-gray-100'}`}>{sh.stage}</span>
                      <span className="text-gray-500">
                        {sh.changedBy ? `by ${sh.changedBy.firstName || ''} ${sh.changedBy.lastName || ''}` : ''}
                      </span>
                    </div>
                    <span className="text-gray-400">{formatDateTime(sh.changedAt)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No stage history recorded yet.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Associated Entities</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-gray-400 block">Company</span>
                {deal.company ? (
                  <Link to={`/companies/${deal.company._id}`} className="text-primary-600 font-medium hover:underline">
                    {deal.company.name}
                  </Link>
                ) : (
                  <span className="text-gray-500">None</span>
                )}
              </div>
              <div>
                <span className="text-xs text-gray-400 block">Contact</span>
                {deal.contact ? (
                  <Link to={`/contacts/${deal.contact._id}`} className="text-primary-600 font-medium hover:underline">
                    {deal.contact.firstName} {deal.contact.lastName}
                  </Link>
                ) : (
                  <span className="text-gray-500">None</span>
                )}
              </div>
              <div>
                <span className="text-xs text-gray-400 block">Originating Lead</span>
                {deal.lead ? (
                  <Link to={`/leads/${deal.lead._id}`} className="text-primary-600 font-medium hover:underline">
                    {deal.lead.firstName} {deal.lead.lastName}
                  </Link>
                ) : (
                  <span className="text-gray-500">None</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Deal"
        message={`Are you sure you want to delete ${deal.title}?`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
