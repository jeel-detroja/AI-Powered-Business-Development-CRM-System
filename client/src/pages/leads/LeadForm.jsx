import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadService, userService } from '../../services/index';
import { LEAD_STATUS, LEAD_SOURCES, LEAD_PRIORITIES } from '../../constants/index';
import { getErrorMessage } from '../../utils/index';
import { toast } from 'sonner';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';

export default function LeadForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    jobTitle: '',
    industry: '',
    location: '',
    website: '',
    source: 'Website',
    status: 'New',
    priority: 'Medium',
    estimatedBudget: 0,
    requirements: '',
    interestedIn: '',
    assignedTo: '',
    notes: '',
  });

  const { data: leadData, isLoading: leadLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadService.getLead(id),
    enabled: isEdit,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => userService.getUsers({ limit: 50 }),
  });

  useEffect(() => {
    if (leadData?.data?.data) {
      const l = leadData.data.data;
      setForm({
        firstName: l.firstName || '',
        lastName: l.lastName || '',
        email: l.email || '',
        phone: l.phone || '',
        companyName: l.companyName || '',
        jobTitle: l.jobTitle || '',
        industry: l.industry || '',
        location: l.location || '',
        website: l.website || '',
        source: l.source || 'Website',
        status: l.status || 'New',
        priority: l.priority || 'Medium',
        estimatedBudget: l.estimatedBudget || 0,
        requirements: l.requirements || '',
        interestedIn: l.interestedIn || '',
        assignedTo: l.assignedTo?._id || l.assignedTo || '',
        notes: l.notes || '',
      });
    }
  }, [leadData]);

  const mutation = useMutation({
    mutationFn: (data) => (isEdit ? leadService.updateLead(id, data) : leadService.createLead(data)),
    onSuccess: (res) => {
      const savedLead = res.data.data;
      toast.success(isEdit ? 'Lead updated' : 'Lead created');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      navigate(isEdit ? `/leads/${id}` : `/leads/${savedLead._id}`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      estimatedBudget: Number(form.estimatedBudget) || 0,
      assignedTo: form.assignedTo || undefined,
    };
    mutation.mutate(payload);
  };

  const users = usersData?.data?.data || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Lead' : 'Create New Lead'}</h1>
          <p className="text-sm text-gray-500">Fill in the lead information and business requirements</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Contact Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">First Name *</label>
              <input
                className="input"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input
                className="input"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input
                className="input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3">Company & Professional Info</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Company Name</label>
              <input
                className="input"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Job Title</label>
              <input
                className="input"
                value={form.jobTitle}
                onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Industry</label>
              <input
                className="input"
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Location / City</label>
              <input
                className="input"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Website</label>
              <input
                className="input"
                placeholder="https://example.com"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3">CRM & Qualification Pipeline</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {LEAD_STATUS.map((s) => (
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
            <div>
              <label className="label">Source</label>
              <select
                className="input"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              >
                {LEAD_SOURCES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Estimated Budget ($)</label>
              <input
                type="number"
                min="0"
                className="input"
                value={form.estimatedBudget}
                onChange={(e) => setForm({ ...form, estimatedBudget: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Interested In Product/Service</label>
              <input
                className="input"
                placeholder="e.g. Enterprise Cloud Suite"
                value={form.interestedIn}
                onChange={(e) => setForm({ ...form, interestedIn: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Assigned Representative</label>
              <select
                className="input"
                value={form.assignedTo}
                onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>{u.firstName} {u.lastName} ({u.role})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 space-y-4">
          <h3 className="font-semibold text-gray-900">Requirements & Notes</h3>
          <div>
            <label className="label">Business Requirements</label>
            <textarea
              className="input h-20"
              placeholder="What are the lead's main pain points, goals, technical requirements?"
              value={form.requirements}
              onChange={(e) => setForm({ ...form, requirements: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Internal Notes</label>
            <textarea
              className="input h-20"
              placeholder="Internal reminders, communication notes..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            <Save size={16} />
            {mutation.isPending ? 'Saving...' : isEdit ? 'Update Lead' : 'Create Lead'}
          </button>
        </div>
      </form>
    </div>
  );
}
