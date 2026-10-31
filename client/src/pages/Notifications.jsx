import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/index';
import { formatRelativeTime, formatDateTime, getErrorMessage } from '../utils/index';
import { TableSkeleton } from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { toast } from 'sonner';
import {
  Bell, Check, Trash2, CheckCheck, Clock, AlertTriangle, UserCheck, TrendingUp
} from 'lucide-react';

const NOTIF_ICONS = {
  lead_assigned: UserCheck,
  followup_due: Clock,
  activity_overdue: AlertTriangle,
  deal_updated: TrendingUp,
  task_assigned: CheckCheck,
  reminder: Bell,
};

export default function Notifications() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notifications', { limit: 50 }],
    queryFn: () => notificationService.getNotifications({ limit: 50 }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      toast.success('All marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => notificationService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (error) return <ErrorState message="Failed to load notifications" onRetry={refetch} />;

  const notifications = data?.data?.data || [];
  const unreadCount = data?.data?.meta?.unreadCount || 0;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="btn-secondary text-xs"
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      <div className="card">
        {isLoading ? (
          <TableSkeleton rows={8} cols={4} />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications"
            message="You will receive alerts here when leads are assigned, follow-ups are due, or deals progress."
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((n) => {
              const IconComp = NOTIF_ICONS[n.type] || Bell;

              return (
                <div
                  key={n._id}
                  className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                    n.isRead ? 'bg-white hover:bg-gray-50/50' : 'bg-indigo-50/30 hover:bg-indigo-50/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg mt-0.5 ${
                      n.isRead ? 'bg-gray-100 text-gray-500' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      <IconComp size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-semibold ${n.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600" />
                        )}
                      </div>
                      {n.message && (
                        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{n.message}</p>
                      )}
                      <span className="text-[11px] text-gray-400 mt-1 block">
                        {formatRelativeTime(n.createdAt)} • {formatDateTime(n.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {!n.isRead && (
                      <button
                        onClick={() => markReadMutation.mutate(n._id)}
                        className="p-1 rounded text-gray-400 hover:text-indigo-600"
                        title="Mark as read"
                      >
                        <Check size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteMutation.mutate(n._id)}
                      className="p-1 rounded text-gray-400 hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
