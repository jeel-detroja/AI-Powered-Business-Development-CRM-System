import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/index';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import { getErrorMessage } from '../../utils/index';
import { UserPlus } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ organizationName: '', firstName: '', lastName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authService.register(form);
      setAuth(res.data.data.user, res.data.data.token);
      toast.success('Account created!');
      navigate('/');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">N</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 mt-1">Start your free Nexora CRM workspace</p>
        </div>
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Organization Name</label>
              <input className="input" placeholder="Your Company Inc." required
                value={form.organizationName} onChange={(e) => setForm({ ...form, organizationName: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">First Name</label>
                <input className="input" placeholder="Alex" required
                  value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input className="input" placeholder="Johnson" required
                  value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="alex@company.com" required
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="At least 8 characters" required minLength={8}
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              <UserPlus size={16} /> {loading ? 'Creating…' : 'Create Account'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

