import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, Filter, ChevronDown, ChevronRight, MoreVertical,
  Shield, Coins, BarChart3, FileText, CheckCircle, XCircle, AlertTriangle,
  Clock, ArrowUpRight, ArrowDownRight, RefreshCw, Edit3, Eye,
  UserX, UserCheck, Sliders, BookOpen, Activity, Download, Mail,
  Phone, MapPin, Calendar, TrendingUp, Settings, X, Save, Plus, Minus,
  AlertCircle, Info, CreditCard, RotateCcw
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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
  email_verified: boolean;
  created_at: string;
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

const TABS = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'tokens', label: 'Token Policy', icon: Coins },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  { id: 'audit', label: 'Audit Logs', icon: FileText },
];

// ─── Helper Components ────────────────────────────────────────────────────────

const StatCard = ({ label, value, sub, icon: Icon, color }: any) => (
  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-start gap-4">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + '20' }}>
      <Icon size={20} style={{ color }} />
    </div>
    <div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const TokenMeter = ({ used, total, size = 'md' }: { used: number; total: number; size?: 'sm' | 'md' }) => {
  const pct = total > 0 ? Math.min(Math.round((used / total) * 100), 100) : 0;
  const color = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#10b981';
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-slate-500">{used.toLocaleString()} / {total.toLocaleString()} tokens</span>
        <span className="text-xs font-bold" style={{ color }}>{pct}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full" style={{ height: size === 'sm' ? 4 : 6 }}>
        <div className="rounded-full transition-all" style={{ width: `${pct}%`, height: '100%', background: color }} />
      </div>
    </div>
  );
};

const Badge = ({ text, style }: { text: string; style: { bg: string; text: string } }) => (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
    style={{ background: style.bg, color: style.text }}>
    {text}
  </span>
);

const PlanBadge = ({ planId }: { planId: string }) => {
  const c = PLAN_COLORS[planId] || { bg: '#f1f5f9', text: '#64748b', border: '#cbd5e1' };
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize border"
      style={{ background: c.bg, color: c.text, borderColor: c.border }}>
      {planId}
    </span>
  );
};

// ─── User Detail Modal ─────────────────────────────────────────────────────────

const UserDetailModal = ({ user, plans, onClose, onUpdate }: {
  user: UserRow; plans: Plan[]; onClose: () => void; onUpdate: () => void;
}) => {
  const [editingPlan, setEditingPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(user.subscription?.plan_id || 'trial');
  const [tokenOverride, setTokenOverride] = useState<number | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [tokenLogs, setTokenLogs] = useState<any[]>([]);
  const [subjectHistory, setSubjectHistory] = useState<any[]>([]);
  const [activeInnerTab, setActiveInnerTab] = useState<'profile' | 'tokens' | 'history'>('profile');

  useEffect(() => {
    // Load token logs for this user
    supabase.from('token_usage_logs').select('*, modules(name)').eq('user_id', user.id)
      .order('used_at', { ascending: false }).limit(20)
      .then(({ data }) => setTokenLogs(data || []));
    // Load subject change history
    supabase.from('subject_change_history').select('*, old_subject:course_subjects!old_subject_id(name), new_subject:course_subjects!new_subject_id(name)')
      .eq('user_id', user.id).order('changed_at', { ascending: false })
      .then(({ data }) => setSubjectHistory(data || []));
    // Load token override
    supabase.from('user_token_overrides').select('token_limit, override_reason').eq('user_id', user.id).eq('is_active', true).single()
      .then(({ data }) => { if (data) { setTokenOverride(data.token_limit); setOverrideReason(data.override_reason || ''); } });
  }, [user.id]);

  const handlePlanChange = async () => {
    setSaving(true);
    await supabase.from('subscriptions').upsert({ user_id: user.id, plan_id: selectedPlan, status: 'active', is_trial: selectedPlan === 'trial' });
    await supabase.from('admin_audit_logs').insert({ action_type: 'plan_change', performed_by: 'Super Admin', target_user_id: user.id, target_user_email: user.email, details: { old_plan: user.subscription?.plan_id, new_plan: selectedPlan } });
    setSaving(false);
    setEditingPlan(false);
    onUpdate();
  };

  const handleTokenOverride = async () => {
    if (!tokenOverride) return;
    setSaving(true);
    await supabase.from('user_token_overrides').upsert({ user_id: user.id, token_limit: tokenOverride, override_reason: overrideReason, overridden_by: 'Super Admin', is_active: true });
    await supabase.from('admin_audit_logs').insert({ action_type: 'token_override', performed_by: 'Super Admin', target_user_id: user.id, target_user_email: user.email, details: { token_limit: tokenOverride, reason: overrideReason } });
    setSaving(false);
    onUpdate();
  };

  const handleStatusChange = async (status: string) => {
    setSaving(true);
    await supabase.from('user_profiles').update({ account_status: status }).eq('user_id', user.id);
    await supabase.from('admin_audit_logs').insert({ action_type: 'status_change', performed_by: 'Super Admin', target_user_id: user.id, target_user_email: user.email, details: { status } });
    setSaving(false);
    onUpdate();
  };

  const p = user.profile;
  const pct = user.token_limit > 0 ? Math.round((user.token_used / user.token_limit) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-xl font-bold shadow">
              {(p?.full_name || user.email || 'U')[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{p?.full_name || 'Unknown'}</h2>
              <p className="text-sm text-slate-500">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <PlanBadge planId={user.subscription?.plan_id || 'trial'} />
                {p?.account_status && <Badge text={p.account_status} style={STATUS_COLORS[p.account_status] || STATUS_COLORS.active} />}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"><X size={20} /></button>
        </div>

        {/* Inner Tabs */}
        <div className="flex gap-1 px-6 pt-4">
          {(['profile', 'tokens', 'history'] as const).map(t => (
            <button key={t} onClick={() => setActiveInnerTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${activeInnerTab === t ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeInnerTab === 'profile' && (
            <div className="space-y-4">
              {/* Profile fields */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Profession', value: p?.profession },
                  { label: 'Specialty', value: p?.specialty },
                  { label: 'Qualification', value: p?.highest_qualification },
                  { label: 'Stage', value: p?.current_stage },
                  { label: 'Country', value: p?.country },
                  { label: 'City', value: p?.city },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-2xl p-4">
                    <p className="text-xs text-slate-400 font-medium mb-1">{label}</p>
                    <p className="text-sm font-semibold text-slate-800">{value || '—'}</p>
                  </div>
                ))}
              </div>

              {/* Plan Management */}
              <div className="bg-slate-50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-slate-700">Subscription Plan</p>
                  <button onClick={() => setEditingPlan(!editingPlan)} className="text-xs text-emerald-600 font-bold hover:text-emerald-700">
                    {editingPlan ? 'Cancel' : 'Change Plan'}
                  </button>
                </div>
                {editingPlan ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {plans.map(plan => (
                        <button key={plan.id} onClick={() => setSelectedPlan(plan.id)}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${selectedPlan === plan.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                          <p className="text-sm font-bold text-slate-800">{plan.name}</p>
                          <p className="text-xs text-slate-500">₹{plan.price_monthly}/mo</p>
                        </button>
                      ))}
                    </div>
                    <button onClick={handlePlanChange} disabled={saving}
                      className="w-full py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 disabled:opacity-60 transition-colors">
                      {saving ? 'Saving…' : 'Confirm Plan Change'}
                    </button>
                  </div>
                ) : (
                  <PlanBadge planId={user.subscription?.plan_id || 'trial'} />
                )}
              </div>

              {/* Account Actions */}
              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-sm font-bold text-slate-700 mb-3">Account Actions</p>
                <div className="flex flex-wrap gap-2">
                  {p?.account_status !== 'active' && (
                    <button onClick={() => handleStatusChange('active')} disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold hover:bg-emerald-200 transition-colors">
                      <UserCheck size={13} /> Reactivate
                    </button>
                  )}
                  {p?.account_status !== 'suspended' && (
                    <button onClick={() => handleStatusChange('suspended')} disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold hover:bg-amber-200 transition-colors">
                      <AlertTriangle size={13} /> Suspend
                    </button>
                  )}
                  {p?.account_status !== 'blocked' && (
                    <button onClick={() => handleStatusChange('blocked')} disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-bold hover:bg-red-200 transition-colors">
                      <UserX size={13} /> Block
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeInnerTab === 'tokens' && (
            <div className="space-y-4">
              {/* Token Usage */}
              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-sm font-bold text-slate-700 mb-3">Token Usage</p>
                <TokenMeter used={user.token_used} total={user.token_limit} />
                <p className="text-xs text-slate-400 mt-2">{pct >= 90 ? '⚠️ Critical – near limit' : pct >= 70 ? '⚡ Warning – 70% used' : '✅ Healthy'}</p>
              </div>
              {/* Override */}
              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-sm font-bold text-slate-700 mb-3">Override Token Limit</p>
                <input type="number" value={tokenOverride || ''} onChange={e => setTokenOverride(Number(e.target.value))} placeholder="e.g. 5000"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-400 mb-2" />
                <input value={overrideReason} onChange={e => setOverrideReason(e.target.value)} placeholder="Reason for override…"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-400 mb-3" />
                <button onClick={handleTokenOverride} disabled={saving || !tokenOverride}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 disabled:opacity-60 transition-colors">
                  {saving ? 'Saving…' : 'Apply Override'}
                </button>
              </div>
              {/* Token logs */}
              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-sm font-bold text-slate-700 mb-3">Recent Usage</p>
                {tokenLogs.length === 0 ? <p className="text-xs text-slate-400">No usage recorded yet.</p> : (
                  <div className="space-y-2">
                    {tokenLogs.map(log => (
                      <div key={log.id} className="flex justify-between items-center text-xs">
                        <span className="text-slate-600">{(log.modules as any)?.name || log.module_id}</span>
                        <span className="font-bold text-slate-800">−{log.tokens_used}</span>
                        <span className="text-slate-400">{new Date(log.used_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeInnerTab === 'history' && (
            <div className="space-y-3">
              <p className="text-sm font-bold text-slate-700">Subject Change History</p>
              {subjectHistory.length === 0 ? (
                <p className="text-sm text-slate-400 bg-slate-50 rounded-2xl p-6 text-center">No subject changes recorded.</p>
              ) : (
                subjectHistory.map(h => (
                  <div key={h.id} className="bg-slate-50 rounded-2xl p-4 flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold text-slate-800">{(h.old_subject as any)?.name || '—'}</span>
                        <span className="mx-2 text-slate-400">→</span>
                        <span className="font-semibold text-emerald-700">{(h.new_subject as any)?.name || '—'}</span>
                      </p>
                    </div>
                    <p className="text-xs text-slate-400">{new Date(h.changed_at).toLocaleDateString()}</p>
                  </div>
                ))
              )}
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
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [savingPolicies, setSavingPolicies] = useState(false);
  const [editedPolicies, setEditedPolicies] = useState<Record<string, number>>({});

  // Stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.profile?.account_status === 'active').length;
  const trialUsers = users.filter(u => u.subscription?.plan_id === 'trial').length;
  const premiumUsers = users.filter(u => u.subscription?.plan_id === 'premium').length;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Use server-side admin routes that bypass RLS
      const [profilesRes, subsRes, overridesRes, usageRes, policiesRes] = await Promise.all([
        fetch('/api/admin/all-users').then(r => r.json()),
        fetch('/api/admin/all-subscriptions').then(r => r.json()),
        fetch('/api/admin/all-token-overrides').then(r => r.json()),
        fetch('/api/admin/token-usage-summary').then(r => r.json()),
        fetch('/api/admin/all-token-policies').then(r => r.json()),
      ]);

      const profiles = profilesRes || [];
      const subs = subsRes || [];
      const tokenOverrides = overridesRes || [];
      const tokenUsage = usageRes || [];
      const policies = policiesRes || [];

      const usageByUser: Record<string, number> = {};
      tokenUsage.forEach((t: any) => {
        usageByUser[t.user_id] = Number(t.total_used) || 0;
      });

      const policyByPlan: Record<string, number> = {};
      policies.forEach((p: any) => { policyByPlan[p.plan_id] = p.monthly_tokens || p.trial_tokens; });

      const overrideByUser: Record<string, number> = {};
      tokenOverrides.forEach((o: any) => { overrideByUser[o.user_id] = o.token_limit; });

      const rows: UserRow[] = profiles.map((p: any) => {
        const sub = subs.find((s: any) => s.user_id === p.user_id) || null;
        const planLimit = policyByPlan[sub?.plan_id || 'trial'] || 1000;
        const tokenLimit = overrideByUser[p.user_id] ?? planLimit;
        return {
          id: p.user_id,
          email: p.email || p.user_id, // email now comes from auth.users via RPC
          created_at: p.created_at,
          profile: p,
          subscription: sub,
          token_used: usageByUser[p.user_id] || 0,
          token_limit: tokenLimit,
        };
      });
      setUsers(rows);
    } catch (err: any) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPlans = useCallback(async () => {
    try {
      const data = await fetch('/api/admin/all-plans').then(r => r.json());
      setPlans(data || []);
    } catch (err) {
      console.error("Failed to fetch plans:", err);
    }
  }, []);

  const fetchTokenPolicies = useCallback(async () => {
    try {
      const data = await fetch('/api/admin/all-token-policies').then(r => r.json());
      setTokenPolicies(data || []);
      const edited: Record<string, number> = {};
      (data || []).forEach((p: any) => { edited[p.plan_id] = p.plan_id === 'trial' ? p.trial_tokens : p.monthly_tokens; });
      setEditedPolicies(edited);
    } catch (err) {
      console.error("Failed to fetch token policies:", err);
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const data = await fetch('/api/admin/audit-logs').then(r => r.json());
      setAuditLogs(data || []);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    }
  }, []);

  const fetchSubscriptions = useCallback(async () => {
    try {
      const data = await fetch('/api/admin/all-subscriptions').then(r => r.json());
      setSubscriptions(data || []);
    } catch (err) {
      console.error("Failed to fetch subscriptions:", err);
    }
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
    for (const plan of plans) {
      const tokens = editedPolicies[plan.id] || 0;
      const update = plan.id === 'trial'
        ? { trial_tokens: tokens }
        : { monthly_tokens: tokens };
      await supabase.from('token_policies').update(update).eq('plan_id', plan.id);
    }
    await supabase.from('admin_audit_logs').insert({ action_type: 'token_policy_update', performed_by: 'Super Admin', target_user_id: null, details: editedPolicies });
    setSavingPolicies(false);
    fetchTokenPolicies();
  };

  // Filtered users
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
    plan_change: 'Plan Changed',
    token_override: 'Token Override',
    status_change: 'Status Changed',
    token_policy_update: 'Token Policy Updated',
    trial_extend: 'Trial Extended',
    subject_change: 'Subject Changed',
  };

  return (
    <div className="w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-800 mb-2">User Management</h1>
        <p className="text-slate-500 text-lg">Manage healthcare professional users, subscriptions, and token allocations.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Users" value={totalUsers} icon={Users} color="#10b981" />
        <StatCard label="Active Users" value={activeUsers} sub={`${totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0}% of total`} icon={UserCheck} color="#3b82f6" />
        <StatCard label="On Free Trial" value={trialUsers} icon={Clock} color="#f59e0b" />
        <StatCard label="Premium Users" value={premiumUsers} icon={Shield} color="#8b5cf6" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-2xl w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── USERS TAB ─────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Search & Filters */}
          <div className="p-6 border-b border-slate-100 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, email, specialty, user ID…"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
            </div>
            <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-emerald-400 bg-white">
              <option value="all">All Plans</option>
              {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-emerald-400 bg-white">
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
            <div className="flex justify-center items-center py-20">
              <RefreshCw size={28} className="animate-spin text-emerald-400" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No users found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                    <th className="text-left px-6 py-3">User</th>
                    <th className="text-left px-4 py-3">Plan</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Specialty</th>
                    <th className="text-left px-4 py-3 min-w-[160px]">Token Usage</th>
                    <th className="text-left px-4 py-3">Joined</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
                            {(user.profile?.full_name || user.email || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 leading-tight">{user.profile?.full_name || 'Unnamed'}</p>
                            <p className="text-xs text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4"><PlanBadge planId={user.subscription?.plan_id || 'trial'} /></td>
                      <td className="px-4 py-4">
                        <Badge text={user.profile?.account_status || 'active'} style={STATUS_COLORS[user.profile?.account_status || 'active'] || STATUS_COLORS.active} />
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">{user.profile?.specialty || '—'}</td>
                      <td className="px-4 py-4 min-w-[160px]">
                        <TokenMeter used={user.token_used} total={user.token_limit} size="sm" />
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-400">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-4">
                        <button onClick={() => setSelectedUser(user)}
                          className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer count */}
          <div className="px-6 py-3 border-t border-slate-50 text-xs text-slate-400">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>
      )}

      {/* ── TOKEN POLICY TAB ───────────────────────────────────── */}
      {activeTab === 'tokens' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">Token policies set the <strong>default monthly token allocation</strong> for each plan. You can also override tokens for individual users from the Users tab.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {plans.map(plan => {
              const policy = tokenPolicies.find(p => p.plan_id === plan.id);
              const current = editedPolicies[plan.id] ?? (plan.id === 'trial' ? policy?.trial_tokens : policy?.monthly_tokens) ?? 0;
              const c = PLAN_COLORS[plan.id] || PLAN_COLORS.trial;
              return (
                <div key={plan.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <PlanBadge planId={plan.id} />
                        {plan.is_trial && (
                          <span className="text-xs text-slate-400">15-day trial</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{plan.description}</p>
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
                      <button onClick={() => setEditedPolicies(p => ({ ...p, [plan.id]: Math.max(0, (p[plan.id] ?? current) - 500) }))}
                        className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
                        <Minus size={14} />
                      </button>
                      <input type="number" value={current} onChange={e => setEditedPolicies(p => ({ ...p, [plan.id]: Number(e.target.value) }))}
                        className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 text-center focus:outline-none focus:border-emerald-400" />
                      <button onClick={() => setEditedPolicies(p => ({ ...p, [plan.id]: (p[plan.id] ?? current) + 500 }))}
                        className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
                        <Plus size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400">Current: {policy?.monthly_tokens || policy?.trial_tokens || 0} tokens</p>
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
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">All Subscriptions</h2>
            <button onClick={fetchSubscriptions} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50">
              <RefreshCw size={16} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="text-left px-6 py-3">User ID</th>
                  <th className="text-left px-4 py-3">Plan</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Trial</th>
                  <th className="text-left px-4 py-3">Start Date</th>
                  <th className="text-left px-4 py-3">End / Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {subscriptions.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3 text-xs text-slate-500 font-mono">{sub.user_id?.substring(0, 8)}…</td>
                    <td className="px-4 py-3"><PlanBadge planId={sub.plan_id} /></td>
                    <td className="px-4 py-3"><Badge text={sub.status} style={sub.status === 'active' ? STATUS_COLORS.active : STATUS_COLORS.suspended} /></td>
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
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Audit Logs</h2>
            <button onClick={fetchAuditLogs} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50">
              <RefreshCw size={16} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="text-left px-6 py-3">Action</th>
                  <th className="text-left px-4 py-3">Target User</th>
                  <th className="text-left px-4 py-3">Performed By</th>
                  <th className="text-left px-4 py-3">Details</th>
                  <th className="text-left px-4 py-3">Date</th>
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
                    <td className="px-4 py-3 text-xs text-slate-500">{log.target_user_email || '—'}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">{log.performed_by}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 max-w-[200px] truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
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

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          plans={plans}
          onClose={() => setSelectedUser(null)}
          onUpdate={() => { setSelectedUser(null); fetchUsers(); }}
        />
      )}
    </div>
  );
};

export default UserManagementSystem;
