import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadService, activityService } from '../../services/index';
import { formatDate, formatDateTime, formatCurrency, getErrorMessage, getInitials } from '../../utils/index';
import { LEAD_STATUS_COLORS, PRIORITY_COLORS, CATEGORY_COLORS } from '../../constants/index';
import { TableSkeleton } from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import Modal, { ConfirmDialog } from '../../components/common/Modal';
import { toast } from 'sonner';
import {
  ArrowLeft, Edit, Trash2, Sparkles, Building2, Mail, Phone, MapPin, Globe,
  Briefcase, Calendar, CheckCircle2, Clock, Plus, Tag, RefreshCw
} from 'lucide-react';

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteModal, setDeleteModal] = useState(false);
  const [activityModal, setActivityModal] = useState(false);
  const [actForm, setActForm] = useState({ type: 'Call', subject: '', dueAt: '', priority: 'Medium', description: '' });

  const { data: leadData, isLoading, error, refetch } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadService.getLead(id),
  });

  const { data: analysisData, isLoading: analysisLoading } = useQuery({
    queryKey: ['lead-analysis', id],
    queryFn: () => leadService.getLeadAnalysis(id),
  });

  const { data: activitiesData } = useQuery({
    queryKey: ['lead-activities', id],
    queryFn: () => activityService.getActivities({ lead: id }),
  });

  const analyzeMutation = useMutation({
    mutationFn: () => leadService.analyzeLead(id),
    onSuccess: () => {
      toast.success('AI Lead Analysis completed');
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      queryClient.invalidateQueries({ queryKey: ['lead-analysis', id] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => leadService.deleteLead(id),
    onSuccess: () => {
      toast.success('Lead deleted');
      navigate('/leads');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const createActivityMutation = useMutation({
    mutationFn: (data) => activityService.createActivity({ ...data, lead: id }),
    onSuccess: () => {
      toast.success('Activity added');
      queryClient.invalidateQueries({ queryKey: ['lead-activities', id] });
      setActivityModal(false);
      setActForm({ type: 'Call', subject: '', dueAt: '', priority: 'Medium', description: '' });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isLoading) return <TableSkeleton rows={10} cols={4} />;
  if (error || !leadData?.data?.data) return <ErrorState message="Lead not found" onRetry={refetch} />;

  const lead = leadData.data.data;
  const analysis = analysisData?.data?.data;
  const activities = activitiesData?.data?.data || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/leads')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{lead.firstName} {lead.lastName}</h1>
              <span className={`badge ${LEAD_STATUS_COLORS[lead.status] || 'bg-gray-100'}`}>{lead.status}</span>
              <span className={`badge ${PRIORITY_COLORS[lead.priority] || 'bg-gray-100'}`}>{lead.priority} Priority</span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{lead.jobTitle ? `${lead.jobTitle} at ` : ''}{lead.companyName || 'No Company'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending}
            className="btn-primary bg-indigo-600 hover:bg-indigo-700"
          >
            <Sparkles size={16} className={analyzeMutation.isPending ? 'animate-spin' : ''} />
            {analyzeMutation.isPending ? 'Analyzing with Gemini...' : 'Analyze with AI'}
          </button>
          <Link to={`/leads/${id}/edit`} className="btn-secondary">
            <Edit size={14} /> Edit
          </Link>
          <button onClick={() => setDeleteModal(true)} className="btn-secondary text-red-600 hover:bg-red-50">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Intelligence Box */}
          <div className="card p-6 border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Gemini AI Lead Assessment</h3>
                  <p className="text-xs text-gray-500">Real-time analysis and conversion strategy</p>
                </div>
              </div>
              {lead.score > 0 && (
                <div className="flex items-center gap-2">
                  <span className={`badge text-xs ${CATEGORY_COLORS[lead.category] || 'bg-gray-100'}`}>
                    {lead.category || 'Warm'} Lead
                  </span>
                  <span className="text-sm font-bold text-indigo-600">{lead.score}/100</span>
                </div>
              )}
            </div>

            {analysis ? (
              <div className="space-y-4 text-sm text-gray-700">
                <div className="p-3 bg-white rounded-lg border border-indigo-50 shadow-xs">
                  <p className="font-medium text-gray-900 mb-1">Executive Summary</p>
                  <p className="text-gray-600 leading-relaxed">{analysis.summary || 'Lead summary not available.'}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-lg border border-gray-100">
                    <p className="font-medium text-gray-900 mb-1">Potential Opportunity</p>
                    <p className="text-gray-600 text-xs">{analysis.opportunity || 'Standard potential'}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-gray-100">
                    <p className="font-medium text-gray-900 mb-1">Buying Intent</p>
                    <p className="text-gray-600 text-xs">{analysis.buyingIntent || 'Moderate signals'}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-gray-100">
                    <p className="font-medium text-gray-900 mb-1">Recommended Strategy</p>
                    <p className="text-gray-600 text-xs">{analysis.strategy || 'Follow up with demo'}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-gray-100">
                    <p className="font-medium text-gray-900 mb-1">Suggested Next Action</p>
                    <p className="text-gray-600 text-xs">{analysis.nextAction || 'Schedule discovery meeting'}</p>
                  </div>
                </div>

                {analysis.followUpMessage && (
                  <div className="p-3 bg-white rounded-lg border border-indigo-100">
                    <p className="font-medium text-indigo-900 mb-1 flex items-center justify-between">
                      <span>Suggested Follow-up Script / Opener</span>
                      <Link to={`/ai/email?leadId=${lead._id}`} className="text-xs text-indigo-600 hover:underline">Draft Full Email →</Link>
                    </p>
                    <p className="text-xs text-gray-600 italic bg-gray-50 p-2 rounded border border-gray-100">
                      "{analysis.followUpMessage}"
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 mb-3">No AI analysis generated yet for this lead.</p>
                <button
                  onClick={() => analyzeMutation.mutate()}
                  disabled={analyzeMutation.isPending}
                  className="btn-secondary text-indigo-600 border-indigo-200"
                >
                  <Sparkles size={14} /> Run Gemini Intelligence
                </button>
              </div>
            )}
          </div>

          {/* Lead Information Card */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Lead Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3 text-gray-600">
                <Mail size={16} className="text-gray-400" />
                <span>{lead.email || 'No email provided'}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Phone size={16} className="text-gray-400" />
                <span>{lead.phone || 'No phone provided'}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Building2 size={16} className="text-gray-400" />
                <span>{lead.companyName || 'Independent / Unknown'}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Briefcase size={16} className="text-gray-400" />
                <span>{lead.industry || 'General Industry'}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <MapPin size={16} className="text-gray-400" />
                <span>{lead.location || 'Global / Unspecified'}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Globe size={16} className="text-gray-400" />
                <span>{lead.website || 'No website link'}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 font-medium">Estimated Budget</p>
                <p className="text-base font-semibold text-gray-900 mt-0.5">{formatCurrency(lead.estimatedBudget)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Lead Source</p>
                <p className="text-base font-semibold text-gray-900 mt-0.5">{lead.source}</p>
              </div>
            </div>

            {lead.requirements && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-medium mb-1">Business Requirements</p>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{lead.requirements}</p>
              </div>
            )}

            {lead.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-medium mb-1">Internal Notes</p>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{lead.notes}</p>
              </div>
            )}
          </div>

          {/* Activities & Timeline */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Activity Timeline</h3>
              <button onClick={() => setActivityModal(true)} className="btn-secondary text-xs">
                <Plus size={14} /> Log Activity
              </button>
            </div>

            {activities.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">No activities recorded for this lead yet.</p>
            ) : (
              <div className="space-y-4">
                {activities.map((act) => (
                  <div key={act._id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Clock size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{act.subject}</p>
                        <span className="text-xs text-gray-400">{formatDate(act.dueAt || act.createdAt)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{act.type} · {act.priority} priority</p>
                      {act.description && <p className="text-xs text-gray-600 mt-1">{act.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Score breakdown & metadata */}
        <div className="space-y-6">
          {/* Score Breakdown Card */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Lead Score Breakdown</h3>
            <div className="text-center py-4 bg-gray-50 rounded-xl mb-4">
              <span className="text-4xl font-extrabold text-indigo-600">{lead.score || 0}</span>
              <span className="text-sm text-gray-400"> / 100</span>
              <p className="text-xs text-gray-500 mt-1">Status: {lead.category || 'Cold'} Lead</p>
            </div>

            {lead.scoreBreakdown && lead.scoreBreakdown.length > 0 ? (
              <div className="space-y-3">
                {lead.scoreBreakdown.map((item, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600 font-medium">{item.label}</span>
                      <span className="font-semibold text-gray-800">{item.points} / {item.max}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, (item.points / item.max) * 100)}%` }}
                      />
                    </div>
                    {item.reason && <p className="text-[10px] text-gray-400 mt-0.5">{item.reason}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center">Score computed by backend rules.</p>
            )}
          </div>

          {/* Assigned Rep Card */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Assignment</h3>
            {lead.assignedTo ? (
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: lead.assignedTo.avatarColor || '#6366f1' }}
                >
                  {getInitials(lead.assignedTo.firstName, lead.assignedTo.lastName)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {lead.assignedTo.firstName} {lead.assignedTo.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{lead.assignedTo.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Unassigned lead</p>
            )}
            <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400 space-y-1">
              <p>Created: {formatDateTime(lead.createdAt)}</p>
              <p>Last Contact: {lead.lastContactedAt ? formatDate(lead.lastContactedAt) : 'Never'}</p>
              <p>Next Follow-up: {lead.nextFollowUpAt ? formatDate(lead.nextFollowUpAt) : 'None scheduled'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Lead"
        message={`Are you sure you want to delete ${lead.firstName} ${lead.lastName}?`}
        loading={deleteMutation.isPending}
      />

      {/* Log Activity Modal */}
      <Modal isOpen={activityModal} onClose={() => setActivityModal(false)} title="Log Lead Activity">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createActivityMutation.mutate(actForm);
          }}
          className="space-y-4"
        >
          <div>
            <label className="label">Activity Type</label>
            <select
              className="input"
              value={actForm.type}
              onChange={(e) => setActForm({ ...actForm, type: e.target.value })}
            >
              <option value="Call">Phone Call</option>
              <option value="Email">Email</option>
              <option value="Meeting">Meeting</option>
              <option value="Demo">Demo</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Note">Note</option>
            </select>
          </div>
          <div>
            <label className="label">Subject</label>
            <input
              className="input"
              required
              placeholder="e.g., Discovery call regarding cloud budget"
              value={actForm.subject}
              onChange={(e) => setActForm({ ...actForm, subject: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Due / Scheduled At</label>
              <input
                type="datetime-local"
                className="input"
                value={actForm.dueAt}
                onChange={(e) => setActForm({ ...actForm, dueAt: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Priority</label>
              <select
                className="input"
                value={actForm.priority}
                onChange={(e) => setActForm({ ...actForm, priority: e.target.value })}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Description / Notes</label>
            <textarea
              className="input h-24"
              placeholder="Summary of conversation, key pain points, commitments..."
              value={actForm.description}
              onChange={(e) => setActForm({ ...actForm, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setActivityModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createActivityMutation.isPending} className="btn-primary">
              {createActivityMutation.isPending ? 'Saving...' : 'Save Activity'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
