import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../services/index';
import { getInitials, formatDate, getErrorMessage } from '../../utils/index';
import { TableSkeleton } from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import { toast } from 'sonner';
import { Users, Shield, UserCheck, CheckCircle2, XCircle } from 'lucide-react';

export default function TeamManagement() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => userService.getUsers({ limit: 50 }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id) => userService.toggleUserActive(id),
    onSuccess: () => {
      toast.success('User status updated');
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isLoading) return <TableSkeleton rows={6} cols={5} />;
  if (error) return <ErrorState message="Failed to load team members" onRetry={refetch} />;

  const members = data?.data?.data || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team & Role Management</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage permissions and team members within your organization</p>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-sm">Active Members ({members.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="table-th">User</th>
                <th className="table-th">Role</th>
                <th className="table-th">Job Title</th>
                <th className="table-th">Status</th>
                <th className="table-th">Joined</th>
                <th className="table-th w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {members.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: u.avatarColor || '#6366f1' }}
                      >
                        {getInitials(u.firstName, u.lastName)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-td">
                    <span className={`badge ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      u.role === 'manager' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    } capitalize`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="table-td text-gray-600">{u.jobTitle || 'Representative'}</td>
                  <td className="table-td">
                    {u.isActive ? (
                      <span className="badge bg-emerald-100 text-emerald-700">Active</span>
                    ) : (
                      <span className="badge bg-red-100 text-red-700">Inactive</span>
                    )}
                  </td>
                  <td className="table-td text-xs text-gray-500">{formatDate(u.createdAt)}</td>
                  <td className="table-td">
                    <button
                      onClick={() => toggleActiveMutation.mutate(u._id)}
                      className="text-xs text-gray-400 hover:text-gray-700"
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
