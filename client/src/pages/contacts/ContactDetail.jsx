import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactService, activityService } from '../../services/index';
import { formatDate, formatDateTime, getInitials, getErrorMessage } from '../../utils/index';
import { TableSkeleton } from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import { ConfirmDialog } from '../../components/common/Modal';
import { toast } from 'sonner';
import {
  ArrowLeft, Edit, Trash2, Mail, Phone, Building2, Briefcase, Calendar, Plus, Clock, MessageSquare
} from 'lucide-react';

export default function ContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteModal, setDeleteModal] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['contact', id],
    queryFn: () => contactService.getContact(id),
  });

  const { data: activitiesData } = useQuery({
    queryKey: ['contact-activities', id],
    queryFn: () => activityService.getActivities({ contact: id }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => contactService.deleteContact(id),
    onSuccess: () => {
      toast.success('Contact deleted');
      navigate('/contacts');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isLoading) return <TableSkeleton rows={8} cols={4} />;
  if (error || !data?.data?.data) return <ErrorState message="Contact not found" onRetry={refetch} />;

  const contact = data.data.data;
  const activities = activitiesData?.data?.data || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/contacts')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base">
              {getInitials(contact.firstName, contact.lastName)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{contact.firstName} {contact.lastName}</h1>
              <p className="text-sm text-gray-500">
                {contact.jobTitle ? `${contact.jobTitle} • ` : ''}
                {contact.department || 'Contact'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/ai/email?contactId=${contact._id}`} className="btn-secondary text-indigo-600">
            <MessageSquare size={14} /> AI Email Draft
          </Link>
          <button onClick={() => setDeleteModal(true)} className="btn-secondary text-red-600 hover:bg-red-50">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3 text-gray-600">
                <Mail size={16} className="text-gray-400" />
                <span>{contact.email || 'No email specified'}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Phone size={16} className="text-gray-400" />
                <span>{contact.phone || 'No phone specified'}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Building2 size={16} className="text-gray-400" />
                {contact.company ? (
                  <Link to={`/companies/${contact.company._id}`} className="text-primary-600 hover:underline">
                    {contact.company.name}
                  </Link>
                ) : (
                  <span>No company associated</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Briefcase size={16} className="text-gray-400" />
                <span>{contact.department || 'General'}</span>
              </div>
            </div>

            {contact.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-medium mb-1">Notes</p>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{contact.notes}</p>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Communication & Activities</h3>
            {activities.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No logged activities for this contact.</p>
            ) : (
              <div className="space-y-3">
                {activities.map((act) => (
                  <div key={act._id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Clock size={15} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{act.subject}</p>
                        <p className="text-xs text-gray-500">{act.type} • {formatDate(act.dueAt || act.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Associated Details</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                <span className="text-xs text-gray-400 block">Record Owner</span>
                <span className="font-medium text-gray-800">
                  {contact.owner ? `${contact.owner.firstName} ${contact.owner.lastName}` : 'System Admin'}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block">Created On</span>
                <span>{formatDateTime(contact.createdAt)}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block">Last Updated</span>
                <span>{formatDateTime(contact.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Contact"
        message={`Are you sure you want to delete ${contact.firstName} ${contact.lastName}?`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
