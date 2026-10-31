import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Mail } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // The password reset endpoint requires an email transport (Nodemailer).
    // For now, display a configuration message.
    setSent(true);
    toast.info('Password reset requires email server configuration. Please contact your administrator.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">N</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
          <p className="text-gray-500 mt-1">Enter your email and we'll send you instructions</p>
        </div>
        <div className="card p-6">
          {sent ? (
            <div className="text-center py-4">
              <Mail size={40} className="mx-auto text-primary-500 mb-3" />
              <p className="text-gray-700 font-medium">Check your email</p>
              <p className="text-sm text-gray-500 mt-1">
                If an account exists for <strong>{email}</strong>, you will receive reset instructions.
              </p>
              <p className="text-xs text-amber-600 mt-3 bg-amber-50 p-3 rounded-lg">
                Note: Email delivery requires server-side SMTP configuration. Contact your admin for assistance.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email Address</label>
                <input type="email" className="input" placeholder="you@company.com" required
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <button type="submit" className="btn-primary w-full justify-center py-2.5">
                Send Reset Link
              </button>
            </form>
          )}
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}

