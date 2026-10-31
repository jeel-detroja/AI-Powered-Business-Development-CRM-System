import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../../services/index';
import { getErrorMessage } from '../../utils/index';
import { TableSkeleton } from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import { toast } from 'sonner';
import { Building2, Save, Shield } from 'lucide-react';

export default function OrgSettings() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    industry: '',
    website: '',
    size: '',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['org-settings'],
    queryFn: () => settingsService.getOrgSettings(),
  });

  useEffect(() => {
    if (data?.data?.data) {
      const o = data.data.data;
      setForm({
        name: o.name || '',
        industry: o.industry || '',
        website: o.website || '',
        size: o.size || '',
      });
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (payload) => settingsService.updateOrgSettings(payload),
    onSuccess: () => {
      toast.success('Organization settings updated');
      queryClient.invalidateQueries({ queryKey: ['org-settings'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isLoading) return <TableSkeleton rows={6} cols={3} />;
  if (error) return <ErrorState message="Failed to load organization settings" />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Workspace & Organization Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Control tenant configurations and company parameters</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateMutation.mutate(form);
        }}
        className="card p-6 space-y-4"
      >
        <h3 className="font-semibold text-gray-900 text-base flex items-center gap-2">
          <Building2 size={18} className="text-indigo-600" /> Organization Profile
        </h3>

        <div className="space-y-4 max-w-lg">
          <div>
            <label className="label">Organization Name *</label>
            <input
              className="input"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Primary Industry</label>
            <input
              className="input"
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Company Website</label>
            <input
              className="input"
              placeholder="https://company.com"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Team Size</label>
            <select
              className="input"
              value={form.size}
              onChange={(e) => setForm({ ...form, size: e.target.value })}
            >
              <option value="">Select size</option>
              <option value="1-10">1-10 employees</option>
              <option value="10-50">10-50 employees</option>
              <option value="50-200">50-200 employees</option>
              <option value="200-500">200-500 employees</option>
              <option value="500+">500+ employees</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button type="submit" disabled={updateMutation.isPending} className="btn-primary">
            <Save size={14} /> {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
