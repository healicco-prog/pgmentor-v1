import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, Shield, Coins, FileText, CheckCircle, XCircle, AlertTriangle,
  Clock, RefreshCw, Edit3, Eye, UserX, UserCheck, X, Save, Plus, Minus,
  Info, CreditCard, Key, ChevronDown, MoreHorizontal, Activity
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  description: string;
  is_trial: boolean;
  trial_days: number;
}

interface UserProfile {
  user_id: string;
  full_name: string;
  mobile: string;
  profession: string;
  specialty: string;
  highest_qualification: string;
  current_stage: string;
  country: string;
  state: string;
  city: string;
  account_status: string;
  role?: string;
  email_verified: boolean;
  created_at: string;
  email?: string;
}

interface Subscription {
  id: number;
  user_id: string;
  plan_id: string;
  status: string;
  is_trial: boolean;
  trial_end_date: string;
  start_date: string;
  end_date: string;
}

interface TokenPolicy {
  plan_id: string;
  monthly_tokens: number;
  trial_tokens: number;
  reset_monthly: boolean;
  hard_stop_on_exhaustion: boolean;
}

interface UserRow {
  id: string;
  email: string;
  created_at: string;
  profile: UserProfile | null;
  subscription: Subscription | null;
  token_used: number;
  token_limit: number;
}

interface AuditLog {
  id: number;
  action_type: string;
  performed_by: string;
  target_user_email: string;
  details: any;
  created_at: string;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

const ADMIN_SECRET = 'PGMentor-SuperAdmin-SecretKey-2026';

const adminFetch = async (path: string, options?: RequestInit) => {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Secret ${ADMIN_SECRET}`,
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
};

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAN_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  trial:    { bg: '#f0fdf4', text: '#16a34a', border: '#86efac' },
  free:     { bg: '#f1f5f9', text: '#64748b', border: '#cbd5e1' },
  starter:  { bg: '#eff6ff', text: '#2563eb', border: '#93c5fd' },
  standard: { bg: '#fdf4ff', text: '#9333ea', border: '#d8b4fe' },
  premium:  { bg: '#fffbeb', text: '#d97706', border: '#fcd34d' },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active:    { bg: '#dcfce7', text: '#16a34a' },
  suspended: { bg: '#fef3c7', text: '#d97706' },
  blocked:   { bg: '#fee2e2', text: '#dc2626' },
  pending:   { bg: '#f0f9ff', text: '#0284c7' },
};

const ROLES = ['student', 'teacher', 'dept_admin', 'institution_admin', 'master_admin', 'super_admin'];
const TABS = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'tokens', label: 'Token Policy', icon: Coins },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  { id: 'audit', label: 'Audit Logs', icon: FileText },
];

// ─── Small Components ─────────────────────────────────────────────────────────

const Badge = ({ text, style }: { text: string; style: { bg: string; text: string } }) => (
  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold capitalize"
    style={{ background: style.bg, color: style.text }}>
    {text}
  </span>
);

const PlanBadge = ({ planId }: { planId: string }) => {
  const c = PLAN_COLORS[planId] || PLAN_COLORS.trial;
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold capitalize"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {planId}
    </span>
  );
};

const TokenMeter = ({ used, total, size = 'md' }: { used: number; total: number; size?: 'sm' | 'md' }) => {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const color = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#10b981';
  const h = size === 'sm' ? 'h-1.5' : 'h-2';
  return (
    <div>
      <div className={`w-full bg-slate-100 rounded-full ${h} overflow-hidden`}>
        <div className={`${h} rounded-full transition-all`} style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="text-[11px] text-slate-400 mt-0.5">
        {used.toLocaleString()} / {total.toLocaleString()} tokens ({pct}%)
      </p>
    </div>
  );
};

const StatCard = ({ label, value, sub, icon: Icon, color }: { label: string; value: number; sub?: string; icon: any; color: string }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + '18' }}>
      <Icon size={22} style={{ color }} />
    </div>
    <div>
      <p className="text-2xl font-extrabold text-slate-900 leading-none">{value}</p>
      <p className="text-sm text-slate-500 font-medium mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─── Edit Modal ───────────────────────────────────────────────────────────────

const EditUserModal = ({ user, plans, onClose, onSaved }: {
  user: UserRow; plans: Plan[]; onClose: () => void; onSaved: () => void;
}) => {
  const [plan, setPlan] = useState(user.subscription?.plan_id || 'trial');
  const [status, setStatus] = useState(user.profile?.account_status || 'active');
  const [role, setRole] = useState(user.profile?.role || 'student');
  const [tokenLimit, setTokenLimit] = useState(user.token_limit);
  const [tokenReason, setTokenReason] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [activeSection, setActiveSection] = useState<'plan' | 'status' | 'role' | 'tokens' | 'password'>('plan');

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const saveField = async (field: string, body: any) => {
    setSaving(true);
    try {
      await adminFetch(`/api/admin/${field}`, { method: 'POST', body: JSON.stringify(body) });
      showToast('Saved successfully!', true);
      onSaved();
    } catch (e: any) {
      showToast(e.message || 'Failed to save', false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow">
              {(user.profile?.full_name || user.email || 'U')[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{user.profile?.full_name || 'Unknown'}</h2>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X size={18} /></button>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`mx-5 mt-3 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 ${toast.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {toast.ok ? <CheckCircle size={15} /> : <XCircle size={15} />} {toast.msg}
          </div>
        )}

        {/* Section nav pills */}
        <div className="px-5 pt-4 flex gap-1.5 overflow-x-auto">
          {(['plan', 'status', 'role', 'tokens', 'password'] as const).map(s => (
            <button key={s} onClick={() => setActiveSection(s)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${activeSection === s ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {s === 'password' ? '🔑 Password' : s === 'plan' ? '💳 Plan' : s === 'status' ? '🔵 Status' : s === 'role' ? '🎭 Role' : '🪙 Tokens'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Plan */}
          {activeSection === 'plan' && (
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Subscription Plan</label>
              <div className="grid grid-cols-3 gap-2">
                {plans.length === 0 ? (
                  <p className="col-span-3 text-sm text-slate-400 text-center py-4">Loading plans…</p>
                ) : plans.map(p => {
                  const c = PLAN_COLORS[p.id] || PLAN_COLORS.trial;
                  return (
                    <button key={p.id} onClick={() => setPlan(p.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${plan === p.id ? 'shadow-md' : 'opacity-70 hover:opacity-100'}`}
                      style={{ borderColor: plan === p.id ? c.text : '#e2e8f0', background: plan === p.id ? c.bg : 'white' }}>
                      <p className="text-sm font-bold capitalize" style={{ color: c.text }}>{p.id}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{p.price_monthly === 0 ? 'Free' : `₹${p.price_monthly}/mo`}</p>
                    </button>
                  );
                })}
              </div>
              <button onClick={() => saveField('update-plan', { userId: user.id, planId: plan, userEmail: user.email })}
                disabled={saving} className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {saving ? 'Saving…' : 'Save Plan Change'}
              </button>
            </div>
          )}

          {/* Status */}
          {activeSection === 'status' && (
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Account Status</label>
              <div className="grid grid-cols-2 gap-2">
                {(['active', 'suspended', 'blocked', 'pending'] as const).map(s => {
                  const c = STATUS_COLORS[s];
                  return (
                    <button key={s} onClick={() => setStatus(s)}
                      className={`p-3 rounded-xl border-2 text-sm font-bold capitalize transition-all flex items-center gap-2 ${status === s ? 'shadow-md' : 'opacity-70 hover:opacity-100'}`}
                      style={{ borderColor: status === s ? c.text : '#e2e8f0', background: status === s ? c.bg : 'white', color: c.text }}>
                      {s === 'active' && <UserCheck size={15} />}
                      {s === 'suspended' && <AlertTriangle size={15} />}
                      {s === 'blocked' && <UserX size={15} />}
                      {s === 'pending' && <Clock size={15} />}
                      {s}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => saveField('update-status', { userId: user.id, status, userEmail: user.email })}
                disabled={saving} className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {saving ? 'Saving…' : 'Save Status Change'}
              </button>
            </div>
          )}

          {/* Role */}
          {activeSection === 'role' && (
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">User Role</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map(r => (
                  <button key={r} onClick={() => setRole(r)}
                    className={`p-3 rounded-xl border-2 text-sm font-semibold text-left transition-all ${role === r ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}>
                    {r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </button>
                ))}
              </div>
              <button onClick={() => saveField('update-role', { userId: user.id, role, userEmail: user.email })}
                disabled={saving} className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {saving ? 'Saving…' : 'Save Role Change'}
              </button>
            </div>
          )}

          {/* Tokens */}
          {activeSection === 'tokens' && (
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Token Limit Override</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setTokenLimit(Math.max(0, tokenLimit - 10000))}
                  className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 text-lg font-bold">−</button>
                <input type="number" value={tokenLimit} onChange={e => setTokenLimit(Number(e.target.value))}
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 text-center focus:outline-none focus:border-blue-400" />
                <button onClick={() => setTokenLimit(tokenLimit + 10000)}
                  className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 text-lg font-bold">+</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {[10000, 50000, 100000, 200000, 500000, 1000000].map(v => (
                  <button key={v} onClick={() => setTokenLimit(v)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${tokenLimit === v ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'}`}>
                    {v >= 1000000 ? `${v / 1000000}M` : `${v / 1000}K`}
                  </button>
                ))}
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">Current usage:</p>
                <TokenMeter used={user.token_used} total={tokenLimit} />
              </div>
              <input value={tokenReason} onChange={e => setTokenReason(e.target.value)}
                placeholder="Reason for override (optional)…"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-400" />
              <button onClick={() => saveField('override-tokens', { userId: user.id, tokenLimit, reason: tokenReason, userEmail: user.email })}
                disabled={saving} className="w-full py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 disabled:opacity-50 transition-colors">
                {saving ? 'Saving…' : 'Apply Token Override'}
              </button>
            </div>
          )}

          {/* Password */}
          {activeSection === 'password' && (
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Reset Password</label>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 flex items-start gap-2">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                This will immediately change the user's password. They will need to use the new password to log in.
              </div>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 characters)…"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50" />
              <button
                onClick={() => {
                  if (newPassword.length < 8) { showToast('Password must be at least 8 characters', false); return; }
                  if (!window.confirm(`Are you sure you want to reset the password for ${user.email}?`)) return;
                  saveField('reset-password', { userId: user.id, newPassword });
                }}
                disabled={saving || newPassword.length < 8}
                className="w-full py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                <Key size={15} /> {saving ? 'Resetting…' : 'Reset Password'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

export const UserManagementSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [tokenPolicies, setTokenPolicies] = useState<TokenPolicy[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [savingPolicies, setSavingPolicies] = useState(false);
  const [editedPolicies, setEditedPolicies] = useState<Record<string, number>>({});

  // Stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.profile?.account_status === 'active').length;
  const trialUsers = users.filter(u => u.subscription?.plan_id === 'trial').length;
  const premiumUsers = users.filter(u => u.subscription?.plan_id === 'premium').length;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profiles, subs, overrides, usage, policies] = await Promise.all([
        adminFetch('/api/admin/all-users').catch(() => []),
        adminFetch('/api/admin/all-subscriptions').catch(() => []),
        adminFetch('/api/admin/all-token-overrides').catch(() => []),
        adminFetch('/api/admin/token-usage-summary').catch(() => []),
        adminFetch('/api/admin/all-token-policies').catch(() => []),
      ]);

      const usageByUser: Record<string, number> = {};
      (usage || []).forEach((t: any) => { usageByUser[t.user_id] = Number(t.total_used) || 0; });

      const policyByPlan: Record<string, number> = {};
      (policies || []).forEach((p: any) => { policyByPlan[p.plan_id] = p.plan_id === 'trial' ? (p.trial_tokens || 1000) : (p.monthly_tokens || 1000); });

      const overrideByUser: Record<string, number> = {};
      (overrides || []).forEach((o: any) => { overrideByUser[o.user_id] = o.token_limit; });

      const rows: UserRow[] = (profiles || []).map((p: any) => {
        const sub = (subs || []).find((s: any) => s.user_id === p.user_id) || null;
        const planLimit = policyByPlan[sub?.plan_id || 'trial'] || 1000;
        const tokenLimit = overrideByUser[p.user_id] ?? planLimit;
        return {
          id: p.user_id,
          email: p.email || p.user_id,
          created_at: p.created_at,
          profile: p,
          subscription: sub,
          token_used: usageByUser[p.user_id] || 0,
          token_limit: tokenLimit,
        };
      });
      setUsers(rows);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPlans = useCallback(async () => {
    try {
      const data = await adminFetch('/api/admin/all-plans');
      setPlans(data || []);
      const edited: Record<string, number> = {};
      (data || []).forEach((p: any) => { edited[p.id] = p.id === 'trial' ? (p.trial_tokens || 1000) : (p.price_monthly || 0); });
      setEditedPolicies(edited);
    } catch (err) { console.error('Failed to fetch plans:', err); }
  }, []);

  const fetchTokenPolicies = useCallback(async () => {
    try {
      const data = await adminFetch('/api/admin/all-token-policies');
      setTokenPolicies(data || []);
      const edited: Record<string, number> = {};
      (data || []).forEach((p: any) => { edited[p.plan_id] = p.plan_id === 'trial' ? p.trial_tokens : p.monthly_tokens; });
      setEditedPolicies(edited);
    } catch (err) { console.error('Failed to fetch token policies:', err); }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const data = await adminFetch('/api/admin/audit-logs');
      setAuditLogs(data || []);
    } catch (err) { console.error('Failed to fetch audit logs:', err); }
  }, []);

  const fetchSubscriptions = useCallback(async () => {
    try {
      const data = await adminFetch('/api/admin/all-subscriptions');
      setSubscriptions(data || []);
    } catch (err) { console.error('Failed to fetch subscriptions:', err); }
  }, []);

  useEffect(() => {
    fetchPlans();
    fetchTokenPolicies();
  }, [fetchPlans, fetchTokenPolicies]);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'audit') fetchAuditLogs();
    if (activeTab === 'subscriptions') fetchSubscriptions();
  }, [activeTab, fetchUsers, fetchAuditLogs, fetchSubscriptions]);

  const saveTokenPolicies = async () => {
    setSavingPolicies(true);
    try {
      await adminFetch('/api/admin/save-token-policies', {
        method: 'POST',
        body: JSON.stringify({ policies: editedPolicies }),
      });
      fetchTokenPolicies();
      alert('Token policies saved successfully!');
    } catch (err: any) {
      alert('Failed to save: ' + err.message);
    } finally {
      setSavingPolicies(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      u.email.toLowerCase().includes(q) ||
      u.profile?.full_name?.toLowerCase().includes(q) ||
      u.profile?.specialty?.toLowerCase().includes(q) ||
      u.id.includes(q);
    const matchPlan = filterPlan === 'all' || u.subscription?.plan_id === filterPlan;
    const matchStatus = filterStatus === 'all' || u.profile?.account_status === filterStatus;
    return matchSearch && matchPlan && matchStatus;
  });

  const ACTION_LABELS: Record<string, string> = {
    plan_change: '💳 Plan Changed',
    token_override: '🪙 Token Override',
    status_change: '🔵 Status Changed',
    role_change: '🎭 Role Changed',
    token_policy_update: '📋 Policy Updated',
    password_reset: '🔑 Password Reset',
    trial_extend: '⏳ Trial Extended',
  };

  return (
    <div className="w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-1 tracking-tight">User Management</h1>
        <p className="text-slate-500">Manage all users — plans, roles, tokens, and passwords.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Users" value={totalUsers} icon={Users} color="#10b981" />
        <StatCard label="Active Users" value={activeUsers}
          sub={`${totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0}% of total`}
          icon={UserCheck} color="#3b82f6" />
        <StatCard label="On Free Trial" value={trialUsers} icon={Clock} color="#f59e0b" />
        <StatCard label="Premium Users" value={premiumUsers} icon={Shield} color="#8b5cf6" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-2xl w-fit overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-center gap-3 text-red-700 text-sm font-medium">
          <XCircle size={18} className="shrink-0" />
          <div>
            <p className="font-bold">Failed to load data</p>
            <p className="text-red-500 text-xs mt-0.5">{error}</p>
            <p className="text-red-400 text-xs">Check: Are you logged in as Super Admin? Is the backend running?</p>
          </div>
          <button onClick={fetchUsers} className="ml-auto px-3 py-1.5 bg-red-100 hover:bg-red-200 rounded-lg text-xs font-bold transition-colors">Retry</button>
        </div>
      )}

      {/* ── USERS TAB ─────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Search & Filters */}
          <div className="p-5 border-b border-slate-100 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, email, specialty, user ID…"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50" />
            </div>
            <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400 bg-white">
              <option value="all">All Plans</option>
              {plans.map(p => <option key={p.id} value={p.id}>{p.name || p.id}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400 bg-white">
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="blocked">Blocked</option>
            </select>
            <button onClick={fetchUsers} className="p-2.5 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex flex-col justify-center items-center py-24 gap-3">
              <RefreshCw size={32} className="animate-spin text-blue-400" />
              <p className="text-slate-400 text-sm font-medium">Loading users from the database…</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-24 text-slate-400">
              <Users size={48} className="mx-auto mb-3 opacity-20" />
              <p className="font-semibold text-lg">No users found</p>
              <p className="text-sm mt-1 max-w-xs mx-auto">
                {users.length === 0
                  ? 'No users loaded yet. Check that you are authenticated as Super Admin and the backend is running.'
                  : 'Try adjusting your search or filters'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80">
                    <th className="text-left px-6 py-3.5">User</th>
                    <th className="text-left px-4 py-3.5">Plan</th>
                    <th className="text-left px-4 py-3.5">Status</th>
                    <th className="text-left px-4 py-3.5">Role</th>
                    <th className="text-left px-4 py-3.5">Specialty</th>
                    <th className="text-left px-4 py-3.5 min-w-[180px]">Token Usage</th>
                    <th className="text-left px-4 py-3.5">Joined</th>
                    <th className="px-4 py-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
                            {(user.profile?.full_name || user.email || 'U')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 leading-tight truncate max-w-[140px]">
                              {user.profile?.full_name || 'Unnamed'}
                            </p>
                            <p className="text-xs text-slate-400 truncate max-w-[140px]">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4"><PlanBadge planId={user.subscription?.plan_id || 'trial'} /></td>
                      <td className="px-4 py-4">
                        <Badge text={user.profile?.account_status || 'active'}
                          style={STATUS_COLORS[user.profile?.account_status || 'active'] || STATUS_COLORS.active} />
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-lg capitalize">
                          {(user.profile?.role || 'student').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600 max-w-[120px] truncate">{user.profile?.specialty || '—'}</td>
                      <td className="px-4 py-4 min-w-[180px]">
                        <TokenMeter used={user.token_used} total={user.token_limit} size="sm" />
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-400 whitespace-nowrap">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button onClick={() => setEditingUser(user)} title="Edit user"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold transition-colors">
                          <Edit3 size={13} /> Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer count */}
          <div className="px-6 py-3 border-t border-slate-50 text-xs text-slate-400 flex items-center justify-between">
            <span>Showing <strong className="text-slate-600">{filteredUsers.length}</strong> of <strong className="text-slate-600">{users.length}</strong> users</span>
            {users.length === 0 && !loading && (
              <span className="text-amber-500 font-medium">⚠️ 0 users loaded — check admin auth & backend connectivity</span>
            )}
          </div>
        </div>
      )}

      {/* ── TOKEN POLICY TAB ───────────────────────────────────── */}
      {activeTab === 'tokens' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Token policies set the <strong>default monthly token allocation</strong> for each plan.
              You can also override tokens for individual users from the Users tab.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.length === 0 ? (
              <div className="col-span-3 bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-100">
                <Coins size={40} className="mx-auto mb-3 opacity-30" />
                <p>No plans loaded. Check backend connectivity.</p>
              </div>
            ) : plans.map(plan => {
              const policy = tokenPolicies.find(p => p.plan_id === plan.id);
              const current = editedPolicies[plan.id] ?? (plan.id === 'trial' ? (policy?.trial_tokens ?? 0) : (policy?.monthly_tokens ?? 0));
              const c = PLAN_COLORS[plan.id] || PLAN_COLORS.trial;
              return (
                <div key={plan.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <PlanBadge planId={plan.id} />
                        {plan.is_trial && <span className="text-xs text-slate-400">15-day trial</span>}
                      </div>
                      <p className="text-xs text-slate-400">{plan.description || plan.name}</p>
                    </div>
                    <span className="text-lg font-bold text-slate-700">
                      {plan.price_monthly === 0 ? 'Free' : `₹${plan.price_monthly}/mo`}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600">
                      {plan.id === 'trial' ? 'Trial Token Allocation' : 'Monthly Token Allocation'}
                    </label>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditedPolicies(p => ({ ...p, [plan.id]: Math.max(0, (p[plan.id] ?? current) - 1000) }))}
                        className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
                        <Minus size={14} />
                      </button>
                      <input type="number" value={current}
                        onChange={e => setEditedPolicies(p => ({ ...p, [plan.id]: Number(e.target.value) }))}
                        className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 text-center focus:outline-none focus:border-emerald-400" />
                      <button onClick={() => setEditedPolicies(p => ({ ...p, [plan.id]: (p[plan.id] ?? current) + 1000 }))}
                        className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
                        <Plus size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400">
                      Saved: {policy?.monthly_tokens || policy?.trial_tokens || '—'} tokens
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={saveTokenPolicies} disabled={savingPolicies}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 disabled:opacity-60 transition-colors shadow-sm">
            <Save size={16} /> {savingPolicies ? 'Saving…' : 'Save Token Policies'}
          </button>
        </div>
      )}

      {/* ── SUBSCRIPTIONS TAB ─────────────────────────────────── */}
      {activeTab === 'subscriptions' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">All Subscriptions ({subscriptions.length})</h2>
            <button onClick={fetchSubscriptions} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50">
              <RefreshCw size={16} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="text-left px-6 py-3.5">User ID</th>
                  <th className="text-left px-4 py-3.5">Plan</th>
                  <th className="text-left px-4 py-3.5">Status</th>
                  <th className="text-left px-4 py-3.5">Trial</th>
                  <th className="text-left px-4 py-3.5">Start Date</th>
                  <th className="text-left px-4 py-3.5">End / Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {subscriptions.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3 text-xs text-slate-500 font-mono">{sub.user_id?.substring(0, 12)}…</td>
                    <td className="px-4 py-3"><PlanBadge planId={sub.plan_id} /></td>
                    <td className="px-4 py-3">
                      <Badge text={sub.status} style={sub.status === 'active' ? STATUS_COLORS.active : STATUS_COLORS.suspended} />
                    </td>
                    <td className="px-4 py-3">
                      {sub.is_trial ? (
                        <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                          <Clock size={12} /> {sub.trial_end_date ? `Ends ${new Date(sub.trial_end_date).toLocaleDateString()}` : 'Trial'}
                        </span>
                      ) : <span className="text-xs text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{sub.start_date ? new Date(sub.start_date).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{sub.end_date ? new Date(sub.end_date).toLocaleDateString() : 'Ongoing'}</td>
                  </tr>
                ))}
                {subscriptions.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-16 text-slate-400">No subscriptions found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── AUDIT LOGS TAB ────────────────────────────────────── */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Audit Logs ({auditLogs.length})</h2>
            <button onClick={fetchAuditLogs} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50">
              <RefreshCw size={16} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="text-left px-6 py-3.5">Action</th>
                  <th className="text-left px-4 py-3.5">Target User</th>
                  <th className="text-left px-4 py-3.5">Performed By</th>
                  <th className="text-left px-4 py-3.5">Details</th>
                  <th className="text-left px-4 py-3.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
                        {ACTION_LABELS[log.action_type] || log.action_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{log.target_user_email || '—'}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">{log.performed_by}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 max-w-[200px] truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-16 text-slate-400">No audit logs yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          plans={plans}
          onClose={() => setEditingUser(null)}
          onSaved={() => { fetchUsers(); }}
        />
      )}
    </div>
  );
};

export default UserManagementSystem;
