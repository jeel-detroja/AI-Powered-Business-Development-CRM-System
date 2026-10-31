import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import AppLayout from './components/layout/AppLayout';
import PageLoader from './components/common/PageLoader';

// Auth pages
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));

// App pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Leads = lazy(() => import('./pages/leads/Leads'));
const LeadDetail = lazy(() => import('./pages/leads/LeadDetail'));
const LeadForm = lazy(() => import('./pages/leads/LeadForm'));
const Contacts = lazy(() => import('./pages/contacts/Contacts'));
const ContactDetail = lazy(() => import('./pages/contacts/ContactDetail'));
const Companies = lazy(() => import('./pages/companies/Companies'));
const CompanyDetail = lazy(() => import('./pages/companies/CompanyDetail'));
const Pipeline = lazy(() => import('./pages/deals/Pipeline'));
const DealDetail = lazy(() => import('./pages/deals/DealDetail'));
const Activities = lazy(() => import('./pages/Activities'));
const Tasks = lazy(() => import('./pages/Tasks'));
const AIAssistant = lazy(() => import('./pages/ai/AIAssistant'));
const EmailGenerator = lazy(() => import('./pages/ai/EmailGenerator'));
const BusinessInsights = lazy(() => import('./pages/ai/BusinessInsights'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Reports = lazy(() => import('./pages/Reports'));
const Notifications = lazy(() => import('./pages/Notifications'));
const ProfileSettings = lazy(() => import('./pages/settings/ProfileSettings'));
const OrgSettings = lazy(() => import('./pages/settings/OrgSettings'));
const TeamManagement = lazy(() => import('./pages/settings/TeamManagement'));
const AISettings = lazy(() => import('./pages/settings/AISettings'));
const NotFound = lazy(() => import('./pages/NotFound'));

function RequireAuth({ children }) {
  const { user, isHydrated } = useAuthStore();
  if (!isHydrated) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireGuest({ children }) {
  const { user, isHydrated } = useAuthStore();
  if (!isHydrated) return <PageLoader />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user, token, fetchMe } = useAuthStore();

  useEffect(() => {
    // Gracefully verify stored session on mount if credentials exist
    if (user || token) {
      fetchMe();
    }
  }, []);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Guest routes */}
        <Route path="/login" element={<RequireGuest><Login /></RequireGuest>} />
        <Route path="/register" element={<RequireGuest><Register /></RequireGuest>} />
        <Route path="/forgot-password" element={<RequireGuest><ForgotPassword /></RequireGuest>} />

        {/* Protected app routes */}
        <Route path="/" element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route index element={<Dashboard />} />
          <Route path="leads" element={<Leads />} />
          <Route path="leads/new" element={<LeadForm />} />
          <Route path="leads/:id" element={<LeadDetail />} />
          <Route path="leads/:id/edit" element={<LeadForm />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="contacts/:id" element={<ContactDetail />} />
          <Route path="companies" element={<Companies />} />
          <Route path="companies/:id" element={<CompanyDetail />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="deals/:id" element={<DealDetail />} />
          <Route path="activities" element={<Activities />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="ai/assistant" element={<AIAssistant />} />
          <Route path="ai/email" element={<EmailGenerator />} />
          <Route path="ai/insights" element={<BusinessInsights />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="reports" element={<Reports />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings/profile" element={<ProfileSettings />} />
          <Route path="settings/organization" element={<OrgSettings />} />
          <Route path="settings/team" element={<TeamManagement />} />
          <Route path="settings/ai" element={<AISettings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

