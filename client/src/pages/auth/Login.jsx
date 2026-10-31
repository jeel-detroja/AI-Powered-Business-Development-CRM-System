import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import { getErrorMessage } from '../../utils/index';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form);
      toast.success('Welcome back!');
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
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Nexora CRM</h1>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="you@company.com" required
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input pr-10" placeholder="••••••••" required
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300" />
                <span className="text-gray-600">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-primary-600 hover:text-primary-700">Forgot password?</Link>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              <LogIn size={16} /> {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account? <Link to="/register" className="text-primary-600 font-medium hover:text-primary-700">Create one</Link>
        </p>

        <div className="mt-6 p-4 bg-primary-50 rounded-xl border border-primary-100">
          <p className="text-xs font-semibold text-primary-700 mb-2">Demo Credentials</p>
          <div className="space-y-1 text-xs text-primary-600">
            <p><strong>Admin:</strong> admin@nexora.dev / Password123!</p>
            <p><strong>Manager:</strong> manager@nexora.dev / Password123!</p>
            <p><strong>Sales Rep:</strong> rep@nexora.dev / Password123!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

