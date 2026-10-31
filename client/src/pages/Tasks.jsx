import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../services/index';
import { formatDate, getErrorMessage } from '../utils/index';
import { TASK_STATUS, TASK_STATUS_COLORS, TASK_PRIORITIES, PRIORITY_COLORS } from '../constants/index';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { TableSkeleton } from '../components/common/Skeleton';
import Modal, { ConfirmDialog } from '../components/common/Modal';
import { toast } from 'sonner';
import {
  Plus, CheckSquare, Clock, Trash2, CheckCircle2, AlertTriangle, Calendar, LayoutList, Columns
} from 'lucide-react';

export default function Tasks() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban'
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'To Do',
    priority: 'Medium',
    dueDate: '',
  });

  const params = useMemo(() => {
    const p = { page, limit: 20 };
    if (statusFilter) p.status = statusFilter;
    if (priorityFilter) p.priority = priorityFilter;
    return p;
  }, [page, statusFilter, priorityFilter]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tasks', params],
    queryFn: () => taskService.getTasks(params),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => taskService.createTask(payload),
    onSuccess: () => {
      toast.success('Task created');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setModalOpen(false);
      setForm({ title: '', description: '', status: 'To Do', priority: 'Medium', dueDate: '' });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const completeMutation = useMutation({
    mutationFn: (id) => taskService.completeTask(id),
    onSuccess: () => {
      toast.success('Task marked as completed');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => taskService.updateTask(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => taskService.deleteTask(id),
    onSuccess: () => {
      toast.success('Task removed');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setDeleteId(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (error) return <ErrorState message="Failed to load tasks" onRetry={refetch} />;

  const tasks = data?.data?.data || [];
  const meta = data?.data?.meta;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">Organize assignments, follow-ups, and operational action items</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-200 p-0.5 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs font-medium ${
                viewMode === 'list' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500'
              }`}
            >
              <LayoutList size={14} />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs font-medium ${
                viewMode === 'kanban' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500'
              }`}
            >
              <Columns size={14} />
            </button>
          </div>
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus size={14} /> New Task
          </button>
        </div>
      </div>

      <div className="card p-4">
        {/* Filters strip */}
        <div className="flex flex-wrap items-center gap-3 pb-3 border-b border-gray-100">
          <select
            className="input w-auto text-xs py-1.5"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            {TASK_STATUS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            className="input w-auto text-xs py-1.5"
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Priorities</option>
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <TableSkeleton rows={8} cols={5} />
        ) : tasks.length === 0 ? (
          <EmptyState
            title="No tasks found"
            message="Create lightweight tasks to keep your business development pipeline organized"
            action={<button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={14} /> New Task</button>}
          />
        ) : viewMode === 'list' ? (
          <div className="divide-y divide-gray-100 mt-2">
            {tasks.map((task) => {
              const isCompleted = task.status === 'Completed';
              const isOverdue = !isCompleted && task.dueDate && new Date(task.dueDate) < new Date();

              return (
                <div key={task._id} className="py-3 flex items-start justify-between gap-3 hover:bg-gray-50/60 p-2 rounded-lg transition-colors">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => !isCompleted && completeMutation.mutate(task._id)}
                      disabled={isCompleted}
                      className={`mt-0.5 p-1 rounded-full ${
                        isCompleted ? 'text-emerald-500' : 'text-gray-300 hover:text-emerald-500'
                      }`}
                    >
                      <CheckCircle2 size={18} />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                          {task.title}
                        </span>
                        <span className={`badge text-[10px] ${TASK_STATUS_COLORS[task.status] || 'bg-gray-100'}`}>
                          {task.status}
                        </span>
                        <span className={`badge text-[10px] ${PRIORITY_COLORS[task.priority] || 'bg-gray-100'}`}>
                          {task.priority}
                        </span>
                        {isOverdue && (
                          <span className="badge bg-red-100 text-red-700 text-[10px]">Overdue</span>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-1.5">
                        {task.dueDate && (
                          <span>Due: <strong className={isOverdue ? 'text-red-600' : 'text-gray-600'}>{formatDate(task.dueDate)}</strong></span>
                        )}
                        {task.assignedTo && (
                          <span>Assignee: {task.assignedTo.firstName} {task.assignedTo.lastName}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white"
                      value={task.status}
                      onChange={(e) => updateStatusMutation.mutate({ id: task._id, status: e.target.value })}
                    >
                      {TASK_STATUS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setDeleteId(task._id)}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Kanban Board for Tasks */
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            {TASK_STATUS.map((st) => {
              const colTasks = tasks.filter((t) => t.status === st);

              return (
                <div key={st} className="bg-gray-50 rounded-xl p-3 border border-gray-200 flex flex-col">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="font-semibold text-xs text-gray-700 uppercase tracking-wider">{st}</h3>
                    <span className="badge bg-white text-gray-600 border text-xs">{colTasks.length}</span>
                  </div>

                  <div className="space-y-2 flex-1">
                    {colTasks.map((t) => (
                      <div key={t._id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-2xs space-y-2">
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-xs font-medium text-gray-900 leading-snug">{t.title}</p>
                          <button onClick={() => setDeleteId(t._id)} className="text-gray-300 hover:text-red-500">
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-50">
                          <span className={`badge text-[9px] ${PRIORITY_COLORS[t.priority] || 'bg-gray-100'}`}>
                            {t.priority}
                          </span>
                          <span>{t.dueDate ? formatDate(t.dueDate) : 'No date'}</span>
                        </div>
                      </div>
                    ))}
                    {colTasks.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-6">Empty</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <Pagination meta={meta} onPageChange={setPage} />
      </div>

      {/* Create Task Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create New Task">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(form);
          }}
          className="space-y-4"
        >
          <div>
            <label className="label">Task Title *</label>
            <input
              className="input"
              required
              placeholder="e.g. Prepare proposal slides for demo"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {TASK_STATUS.map((s) => (
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
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Due Date</label>
            <input
              type="date"
              className="input"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Description / Instructions</label>
            <textarea
              className="input h-20"
              placeholder="Detailed instructions or reminders..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Delete Task"
        message="Are you sure you want to delete this task?"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
