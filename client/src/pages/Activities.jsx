import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activityService } from '../services/index';
import { formatDate, formatDateTime, getErrorMessage } from '../utils/index';
import { ACTIVITY_TYPES, LEAD_PRIORITIES, PRIORITY_COLORS } from '../constants/index';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { TableSkeleton } from '../components/common/Skeleton';
import Modal, { ConfirmDialog } from '../components/common/Modal';
import { toast } from 'sonner';
import {
  Plus, CheckCircle2, Clock, Calendar, Trash2, Phone, Mail, Users, FileText, CheckSquare, AlertTriangle
} from 'lucide-react';

const TYPE_ICONS = {
  'Phone Call': Phone,
  'Email': Mail,
  'Meeting': Users,
  'Demo': Calendar,
  'Follow-up': Clock,
  'Note': FileText,
  'Other': CheckSquare,
};

export default function Activities() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState('');
  const [filterOverdue, setFilterOverdue] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [form, setForm] = useState({
    type: 'Follow-up',
    subject: '',
    description: '',
    dueAt: '',
    priority: 'Medium',
  });

  const params = useMemo(() => {
    const p = { page, limit: 15 };
    if (filterType) p.type = filterType;
    if (filterOverdue) p.overdue = 'true';
    return p;
  }, [page, filterType, filterOverdue]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['activities', params],
    queryFn: () => activityService.getActivities(params),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => activityService.createActivity(payload),
    onSuccess: () => {
      toast.success('Activity logged');
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setModalOpen(false);
      setForm({ type: 'Follow-up', subject: '', description: '', dueAt: '', priority: 'Medium' });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const completeMutation = useMutation({
    mutationFn: (id) => activityService.completeActivity(id),
    onSuccess: () => {
      toast.success('Activity marked complete');
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => activityService.deleteActivity(id),
    onSuccess: () => {
      toast.success('Activity deleted');
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setDeleteId(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (error) return <ErrorState message="Failed to load activities" onRetry={refetch} />;

  const activities = data?.data?.data || [];
  const meta = data?.data?.meta;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activities & Follow-ups</h1>
          <p className="text-gray-500 text-sm mt-0.5">Track calls, meetings, demos, and critical follow-ups</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus size={14} /> Log Activity
        </button>
      </div>

      <div className="card">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <select
              className="input w-auto text-xs py-1.5"
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            >
              <option value="">All Activity Types</option>
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <button
              onClick={() => { setFilterOverdue(!filterOverdue); setPage(1); }}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                filterOverdue ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-gray-600 border-gray-300'
              }`}
            >
              <AlertTriangle size={12} className="inline mr-1" />
              Overdue Only
            </button>
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton rows={8} cols={5} />
        ) : activities.length === 0 ? (
          <EmptyState
            title="No activities recorded"
            message="Schedule calls, demos, or email tasks to stay on top of your customer pipeline"
            action={<button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={14} /> Log Activity</button>}
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {activities.map((act) => {
              const IconComp = TYPE_ICONS[act.type] || CheckSquare;
              const isOverdue = !act.isCompleted && act.dueAt && new Date(act.dueAt) < new Date();

              return (
                <div key={act._id} className="p-4 flex items-start justify-between gap-4 hover:bg-gray-50/80 transition-colors">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => !act.isCompleted && completeMutation.mutate(act._id)}
                      disabled={act.isCompleted}
                      className={`mt-1 p-1 rounded-full transition-colors ${
                        act.isCompleted ? 'text-emerald-500' : 'text-gray-300 hover:text-emerald-500'
                      }`}
                      title={act.isCompleted ? 'Completed' : 'Mark as complete'}
                    >
                      <CheckCircle2 size={18} />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`p-1 rounded text-xs ${
                          act.type === 'Meeting' ? 'bg-purple-100 text-purple-700' :
                          act.type === 'Phone Call' ? 'bg-blue-100 text-blue-700' :
                          act.type === 'Email' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          <IconComp size={12} className="inline mr-1" />
                          {act.type}
                        </span>
                        <h4 className={`text-sm font-semibold ${act.isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                          {act.subject}
                        </h4>
                        <span className={`badge text-[10px] ${PRIORITY_COLORS[act.priority] || 'bg-gray-100'}`}>
                          {act.priority}
                        </span>
                        {isOverdue && (
                          <span className="badge bg-red-100 text-red-700 text-[10px]">Overdue</span>
                        )}
                      </div>

                      {act.description && (
                        <p className="text-xs text-gray-600 mt-1">{act.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-2">
                        {act.lead && (
                          <span>Lead: <strong className="text-gray-600">{act.lead.firstName} {act.lead.lastName}</strong></span>
                        )}
                        {act.company && (
                          <span>Company: <strong className="text-gray-600">{act.company.name}</strong></span>
                        )}
                        {act.deal && (
                          <span>Deal: <strong className="text-gray-600">{act.deal.title}</strong></span>
                        )}
                        {act.dueAt && (
                          <span>Due: <strong className={isOverdue ? 'text-red-600' : 'text-gray-600'}>{formatDateTime(act.dueAt)}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setDeleteId(act._id)}
                    className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        <Pagination meta={meta} onPageChange={setPage} />
      </div>

      {/* Modal: New Activity */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Log New Activity">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(form);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Activity Type</label>
              <select
                className="input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
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
          <div>
            <label className="label">Subject *</label>
            <input
              className="input"
              required
              placeholder="e.g. Follow-up demo call"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Scheduled / Due Date</label>
            <input
              type="datetime-local"
              className="input"
              value={form.dueAt}
              onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Notes / Description</label>
            <textarea
              className="input h-20"
              placeholder="Key notes, talking points, agenda..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Logging...' : 'Log Activity'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Delete Activity"
        message="Are you sure you want to delete this activity record?"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
