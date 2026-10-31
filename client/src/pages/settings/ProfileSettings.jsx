import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { userService } from '../../services/index';
import { getInitials, getErrorMessage } from '../../utils/index';
import { toast } from 'sonner';
import { User, Lock, Save, Shield } from 'lucide-react';

export default function ProfileSettings() {
  const { user, setUser } = useAuthStore();
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    jobTitle: user?.jobTitle || '',
  });

  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await userService.updateProfile(profileForm);
      setUser(res.data.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setSavingPw(true);
    try {
      await userService.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Profile Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your personal credentials, identity, and security</p>
      </div>

      {/* Profile Overview */}
      <div className="card p-6 flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-xs"
          style={{ backgroundColor: user?.avatarColor || '#6366f1' }}
        >
          {getInitials(user?.firstName, user?.lastName)}
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">{user?.firstName} {user?.lastName}</h2>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="badge bg-indigo-100 text-indigo-700 capitalize">{user?.role}</span>
            <span className="text-xs text-gray-400">Workspace Member</span>
          </div>
        </div>
      </div>

      {/* Edit Profile Details */}
      <form onSubmit={handleProfileSubmit} className="card p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 text-base flex items-center gap-2">
          <User size={18} className="text-indigo-600" /> Personal Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">First Name</label>
            <input
              className="input"
              required
              value={profileForm.firstName}
              onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Last Name</label>
            <input
              className="input"
              value={profileForm.lastName}
              onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Phone</label>
            <input
              className="input"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Job Title</label>
            <input
              className="input"
              value={profileForm.jobTitle}
              onChange={(e) => setProfileForm({ ...profileForm, jobTitle: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={savingProfile} className="btn-primary">
            <Save size={14} /> {savingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>

      {/* Password Change */}
      <form onSubmit={handlePasswordSubmit} className="card p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 text-base flex items-center gap-2">
          <Lock size={18} className="text-indigo-600" /> Change Security Password
        </h3>

        <div className="space-y-3 max-w-md">
          <div>
            <label className="label">Current Password</label>
            <input
              type="password"
              className="input"
              required
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
            />
          </div>
          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              className="input"
              required
              minLength={8}
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              className="input"
              required
              minLength={8}
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={savingPw} className="btn-primary">
            <Lock size={14} /> {savingPw ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
}
