const adminFetch = (path: string, options?: RequestInit): Promise<any> => {
  return new Promise((resolve, reject) => {
    let token = '';
    try {
      const lsKey = Object.keys(localStorage).find(k => k.includes('auth-token'));
      if (lsKey) {
        const stored = JSON.parse(localStorage.getItem(lsKey) || '{}');
        token = stored?.access_token || '';
      }
    } catch {}
    if (!token) {
      _adminSupabase.auth.getSession().then(({ data }) => {
        const t = data?.session?.access_token;
        if (t) makeXHR(t);
        else makeXHR('');
      }).catch(() => makeXHR(''));
    } else {
      makeXHR(token);
    }
    function makeXHR(tok) {
      const xhr = new XMLHttpRequest();
      const method = (options?.method || 'GET').toUpperCase();
      xhr.open(method, path, true);
      if (tok) xhr.setRequestHeader('Authorization', `${tok}`);
      if (method !== 'GET' && method !== 'HEAD') {
        xhr.setRequestHeader('Content-Type', 'application/json');
      }
      xhr.timeout = 10000;
      xhr.onload = () => {
        let json;
        try { json = JSON.parse(xhr.responseText); } catch { json = { error: xhr.statusText }; }
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(json);
        } else {
          reject(new Error(json?.error || json?.message || `HTTP ${xhr.status}`));
        }
      };
      xhr.onerror   = () => reject(new Error('Network error'));
      xhr.ontimeout = () => reject(new Error('Server did not respond in 10s'));
      xhr.send(options?.body != null ? String(options.body) : null);
    }
  });
};

// ─── Color Maps ───────────────────────────────────────────────────────────────
const PLAN_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  trial:    { bg: '#f0fdf4', text: '#15803d', border: '#86efac' },
  free:     { bg: '#f8fafc', text: '#475569', border: '#cbd5e1' },
  starter:  { bg: '#eff6ff', text: '#1d4ed8', border: '#93c5fd' },
  standard: { bg: '#fdf4ff', text: '#7e22ce', border: '#d8b4fe' },
  premium:  { bg: '#fffbeb', text: '#b45309', border: '#fcd34d' },
};
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active:    { bg: '#dcfce7', text: '#15803d' },
  suspended: { bg: '#fef9c3', text: '#a16207' },
  blocked:   { bg: '#fee2e2', text: '#b91c1c' },
  pending:   { bg: '#e0f2fe', text: '#0369a1' },
};
const PAYMENT_COLORS = {
  done:     { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
  not_done: { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
};
const ROLES = ['student', 'teacher', 'dept_admin', 'institution_admin', 'master_admin', 'super_admin'];
const TABS = [
  { id: 'users',         label: 'Users',         icon: Users },
  { id: 'tokens',        label: 'Token Policy',  icon: Coins },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  { id: 'audit',         label: 'Audit Logs',    icon: FileText },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Determine if a subscription counts as "paid".
 * Works with OR without the payment_status column:
 *  - Explicit: payment_status === 'done'
 *  - Inferred: subscription is active, non-trial, and on a paid plan
 */
const inferIsPaid = (sub: Subscription | null): boolean => {
  if (!sub) return false;
  if (sub.payment_status === 'done') return true;
  // Infer from subscription state: active + non-trial + not free plan
  if (sub.is_trial === false && sub.status === 'active' && sub.plan_id !== 'free') return true;
  return false;
};

const PlanBadge = ({ planId }: { planId: string }) => {
  const c = PLAN_COLORS[planId] || PLAN_COLORS.free;
  return <span style={{ background: c.bg, color: c.text, borderColor: c.border }} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border capitalize">{planId}</span>;
};
const StatusBadge = ({ status }: { status: string }) => {
  const c = STATUS_COLORS[status] || STATUS_COLORS.active;
  return <span style={{ background: c.bg, color: c.text }} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold capitalize"><span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: c.text }}></span>{status}</span>;
};
const PaymentBadge = ({ sub }: { sub: Subscription | null | undefined }) => {
  const paid = inferIsPaid(sub ?? null);
  const c = PAYMENT_COLORS[paid ? 'done' : 'not_done'];
  return (
    <span style={{ background: c.bg, color: c.text, borderColor: c.border }} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border">
      {paid ? <BadgeCheck size={10} /> : <BadgeX size={10} />}
      {paid ? 'Paid' : 'Unpaid'}
    </span>
  );
};
const TokenBar = ({ used, total }: { used: number; total: number }) => {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const color = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#10b981';
  return (
    <div className="w-full">
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="text-[10px] text-gray-400 mt-0.5">{(used/1000).toFixed(0)}K / {(total/1000).toFixed(0)}K ({pct}%)</p>
    </div>
  );
};

// ─── Inline Password Reset Cell ───────────────────────────────────────────────
const PasswordCell = ({ user, onDone }: { user: UserRow; onDone: () => void }) => {
  const [open, setOpen] = useState(false);
  const [pwd, setPwd] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const reset = async () => {
    if (pwd.length < 8) return;
    setSaving(true);
    try {
      await adminFetch('/api/admin/reset-password', { method: 'POST', body: JSON.stringify({ userId: user.id, newPassword: pwd }) });
      setDone(true);
      setTimeout(() => { setDone(false); setOpen(false); setPwd(''); onDone(); }, 1500);
    } catch (e: any) {
      alert('Failed: ' + e.message);
    } finally { setSaving(false); }
  };

  return (
    <div className="relative">
      {!open ? (
        <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg border border-violet-200 transition-all">
          <Key size={12} /> Reset
        </button>
      ) : (
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={pwd}
              onChange={e => setPwd(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && reset()}
              placeholder="New password…"
              className="w-36 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-50 pr-7"
              autoFocus
            />
            <button onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {show ? <EyeOff size={11} /> : <Eye size={11} />}
            </button>
          </div>
          <button onClick={reset} disabled={saving || pwd.length < 8}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${done ? 'bg-emerald-500 text-white' : 'bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40'}`}>
            {done ? <><Check size={11} /> Done</> : saving ? '…' : <><Key size={11} /> Set</>}
          </button>
          <button onClick={() => { setOpen(false); setPwd(''); }} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Edit Modal ───────────────────────────────────────────────────────────────
const EditUserModal = ({ user, plans, onClose, onSaved }: { user: UserRow; plans: Plan[]; onClose: () => void; onSaved: () => void }) => {
  const [plan, setPlan] = useState(user.subscription?.plan_id || 'trial');
  const [status, setStatus] = useState(user.profile?.account_status || 'active');
  const [role, setRole] = useState(user.profile?.role || 'student');
  const [tokenLimit, setTokenLimit] = useState(user.token_limit);
  const [tokenReason, setTokenReason] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'done' | 'not_done'>(
    inferIsPaid(user.subscription ?? null) ? 'done' : 'not_done'
  );
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [activeSection, setActiveSection] = useState<'plan' | 'payment' | 'status' | 'role' | 'tokens'>('plan');

  // Sync local state whenever the parent refreshes the user prop (after onSaved → fetchUsers)
  useEffect(() => {
    setPlan(user.subscription?.plan_id || 'trial');
    setStatus(user.profile?.account_status || 'active');
    setRole(user.profile?.role || 'student');
    setTokenLimit(user.token_limit);
    setPaymentStatus(inferIsPaid(user.subscription ?? null) ? 'done' : 'not_done');
  }, [user]); // re-run whenever the user object reference changes

  const showToast = (msg: string, ok: boolean, duration?: number) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), duration ?? (ok ? 3000 : 7000));
  };

  const saveField = async (field: string, body: any) => {
    setSaving(true);
    try {
      const result = await adminFetch(`/api/admin/${field}`, { method: 'POST', body: JSON.stringify(body) });
      if (result?.warning) {
        showToast(`⚠️ ${result.warning}`, false);
      } else {
        // Payment saves: remind admin that user must refresh their browser
        const isPayment = body?.paymentStatus != null;
        showToast(
          isPayment ? '✅ Saved! Ask the user to refresh their browser to apply the change.' : 'Saved successfully!',
          true,
          isPayment ? 6000 : 3000
        );
      }
      onSaved();
    } catch (e: any) {
      const msg = e.message || 'Save failed';
      console.error(`❌ saveField [${field}] error:`, msg);
      showToast(`Error: ${msg}`, false);
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: 'plan',    label: '💳 Plan' },
    { id: 'payment', label: '💰 Payment' },
    { id: 'status',  label: '🔵 Status' },
    { id: 'role',    label: '🎭 Role' },
    { id: 'tokens',  label: '🪙 Tokens' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-violet-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {(user.profile?.full_name || user.email || '?')[0].toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">{user.profile?.full_name || 'Unknown'}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <PlanBadge planId={user.subscription?.plan_id || 'free'} />
                <PaymentBadge sub={user.subscription} />
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"><X size={16} /></button>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`mx-4 mt-3 px-4 py-3 rounded-xl font-semibold flex items-start gap-2.5 ${toast.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs' : 'bg-red-50 text-red-700 border border-red-300 text-sm shadow-sm'}`}>
            <span className="shrink-0 mt-0.5">{toast.ok ? <CheckCircle size={14} /> : <XCircle size={16} />}</span>
            <span className="break-all">{toast.msg}</span>
          </div>
        )}

        {/* Section Pills */}
        <div className="flex gap-1.5 px-4 pt-4 overflow-x-auto pb-1">
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeSection === s.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">

          {/* ── Plan ── */}
          {activeSection === 'plan' && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Subscription Plan</p>
              <div className="grid grid-cols-3 gap-2">
                {plans.map(p => {
                  const c = PLAN_COLORS[p.id] || PLAN_COLORS.free;
                  return (
                    <button key={p.id} onClick={() => setPlan(p.id)}
                      className={`p-2.5 rounded-xl border-2 text-center transition-all ${plan === p.id ? 'shadow-md scale-[1.02]' : 'opacity-70 hover:opacity-100'}`}
                      style={{ borderColor: plan === p.id ? c.text : '#e5e7eb', background: plan === p.id ? c.bg : 'white' }}>
                      <p className="text-xs font-bold capitalize" style={{ color: c.text }}>{p.id}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{p.price_monthly === 0 ? 'Free' : `₹${p.price_monthly}/mo`}</p>
                    </button>
                  );
                })}
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
                <strong>Note:</strong> Changing the plan also clears trial expiry and activates the subscription immediately.
              </div>
              <button onClick={() => saveField('update-plan', { userId: user.id, planId: plan, userEmail: user.email })} disabled={saving}
                className="w-full py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all">
                {saving ? 'Saving…' : 'Save Plan'}
              </button>
            </div>
          )}

          {/* ── Payment ── */}
          {activeSection === 'payment' && (
            <div className="space-y-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Status</p>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 leading-relaxed">
                Mark payment as <strong>Done</strong> when the user has paid for their subscription. This will activate their account and clear any trial expiry — so they can continue using the portal without interruption.
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* Done */}
                <button onClick={() => setPaymentStatus('done')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentStatus === 'done' ? 'border-emerald-400 bg-emerald-50 shadow-md scale-[1.02]' : 'border-gray-200 bg-white opacity-60 hover:opacity-100'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentStatus === 'done' ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                    <BadgeCheck size={22} className={paymentStatus === 'done' ? 'text-emerald-600' : 'text-gray-400'} />
                  </div>
                  <p className={`text-sm font-extrabold ${paymentStatus === 'done' ? 'text-emerald-700' : 'text-gray-500'}`}>Payment Done</p>
                  <p className="text-[10px] text-gray-400 text-center">Subscription activated, trial cleared</p>
                </button>
                {/* Not Done */}
                <button onClick={() => setPaymentStatus('not_done')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentStatus === 'not_done' ? 'border-orange-400 bg-orange-50 shadow-md scale-[1.02]' : 'border-gray-200 bg-white opacity-60 hover:opacity-100'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentStatus === 'not_done' ? 'bg-orange-100' : 'bg-gray-100'}`}>
                    <BadgeX size={22} className={paymentStatus === 'not_done' ? 'text-orange-500' : 'text-gray-400'} />
                  </div>
                  <p className={`text-sm font-extrabold ${paymentStatus === 'not_done' ? 'text-orange-600' : 'text-gray-500'}`}>Not Paid</p>
                  <p className="text-[10px] text-gray-400 text-center">No change to subscription</p>
                </button>
              </div>
              <button
                onClick={() => saveField('update-payment-status', {
                  userId: user.id,
                  paymentStatus,
                  planId: user.subscription?.plan_id,
                  userEmail: user.email,
                })}
                disabled={saving}
                className={`w-full py-2.5 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-all ${paymentStatus === 'done' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-500 hover:bg-orange-600'}`}>
                {saving ? 'Saving…' : paymentStatus === 'done' ? '✅ Confirm Payment Done' : '❌ Mark as Not Paid'}
              </button>
            </div>
          )}

          {/* ── Status ── */}
          {activeSection === 'status' && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Account Status</p>
              <div className="grid grid-cols-2 gap-2">
                {(['active', 'suspended', 'blocked', 'pending'] as const).map(s => {
                  const c = STATUS_COLORS[s];
                  return (
                    <button key={s} onClick={() => setStatus(s)}
                      className={`p-3 rounded-xl border-2 text-sm font-bold capitalize transition-all flex items-center gap-2 ${status === s ? 'shadow-md scale-[1.02]' : 'opacity-60 hover:opacity-100'}`}
                      style={{ borderColor: status === s ? c.text : '#e5e7eb', background: status === s ? c.bg : 'white', color: c.text }}>
                      {s === 'active'    && <UserCheck size={14} />}
                      {s === 'suspended' && <AlertTriangle size={14} />}
                      {s === 'blocked'   && <UserX size={14} />}
                      {s === 'pending'   && <Clock size={14} />}
                      {s}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => saveField('update-status', { userId: user.id, status, userEmail: user.email })} disabled={saving}
                className="w-full py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all">
                {saving ? 'Saving…' : 'Save Status'}
              </button>
            </div>
          )}

          {/* ── Role ── */}
          {activeSection === 'role' && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">User Role</p>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map(r => (
                  <button key={r} onClick={() => setRole(r)}
                    className={`p-2.5 rounded-xl border-2 text-xs font-bold text-left transition-all ${role === r ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm scale-[1.02]' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                    {r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </button>
                ))}
              </div>
              <button onClick={() => saveField('update-role', { userId: user.id, role, userEmail: user.email })} disabled={saving}
                className="w-full py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all">
                {saving ? 'Saving…' : 'Save Role'}
              </button>
            </div>
          )}

          {/* ── Tokens ── */}
          {activeSection === 'tokens' && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Token Limit Override</p>
              <div className="bg-gray-50 rounded-xl p-3">
                <TokenBar used={user.token_used} total={tokenLimit} />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setTokenLimit(Math.max(0, tokenLimit - 10000))} className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 font-bold">−</button>
                <input type="number" value={tokenLimit} onChange={e => setTokenLimit(Number(e.target.value))}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-800 text-center focus:outline-none focus:border-indigo-400" />
                <button onClick={() => setTokenLimit(tokenLimit + 10000)} className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 font-bold">+</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[10000, 50000, 100000, 200000, 500000].map(v => (
                  <button key={v} onClick={() => setTokenLimit(v)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${tokenLimit === v ? 'bg-indigo-100 text-indigo-700 border border-indigo-300' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>
                    {v >= 1000 ? `${v / 1000}K` : v}
                  </button>
                ))}
              </div>
              <input value={tokenReason} onChange={e => setTokenReason(e.target.value)} placeholder="Reason (optional)…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-indigo-400" />
              <button onClick={() => saveField('override-tokens', { userId: user.id, tokenLimit, reason: tokenReason, userEmail: user.email })} disabled={saving}
                className="w-full py-2.5 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-all">
                {saving ? 'Saving…' : 'Apply Token Override'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const UserManagementSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [confirmingAll, setConfirmingAll] = useState(false);
  const [confirmAllResult, setConfirmAllResult] = useState<string | null>(null);
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
  const [filterPayment, setFilterPayment] = useState('all');
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [savingPolicies, setSavingPolicies] = useState(false);
  const [editedPolicies, setEditedPolicies] = useState<Record<string, number>>({});

  const totalUsers   = users.length;
  const activeUsers  = users.filter(u => u.profile?.account_status === 'active').length;
  const trialUsers   = users.filter(u => u.subscription?.plan_id === 'trial').length;
  const premiumUsers = users.filter(u => u.subscription?.plan_id === 'premium').length;
  const paidUsers    = users.filter(u => inferIsPaid(u.subscription)).length;

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError(null);
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
        const planLimit = policyByPlan[sub?.plan_id || 'trial'] || 100000;
        return {
          id: p.user_id, email: p.email || p.user_id, created_at: p.created_at,
          profile: p, subscription: sub,
          token_used: usageByUser[p.user_id] || 0,
          token_limit: overrideByUser[p.user_id] ?? planLimit,
          email_confirmed: p.email_confirmed !== false,
        };
      });
      setUsers(rows);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  const fetchPlans = useCallback(async () => {
    try { const d = await adminFetch('/api/admin/all-plans'); setPlans(d || []); } catch {}
  }, []);

  const fetchTokenPolicies = useCallback(async () => {
    try {
      const d = await adminFetch('/api/admin/all-token-policies');
      setTokenPolicies(d || []);
      const ed: Record<string, number> = {};
      (d || []).forEach((p: any) => { ed[p.plan_id] = p.plan_id === 'trial' ? p.trial_tokens : p.monthly_tokens; });
      setEditedPolicies(ed);
    } catch {}
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    try { const d = await adminFetch('/api/admin/audit-logs'); setAuditLogs(d || []); } catch {}
  }, []);

  const fetchSubscriptions = useCallback(async () => {
    try { const d = await adminFetch('/api/admin/all-subscriptions'); setSubscriptions(d || []); } catch {}
  }, []);

  useEffect(() => { fetchPlans(); fetchTokenPolicies(); }, [fetchPlans, fetchTokenPolicies]);
  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'audit') fetchAuditLogs();
    if (activeTab === 'subscriptions') fetchSubscriptions();
  }, [activeTab, fetchUsers, fetchAuditLogs, fetchSubscriptions]);

  // Keep the open edit modal in sync whenever the users list is refreshed
  // (so saving payment/plan/status immediately reflects in the modal header)
  useEffect(() => {
    if (editingUser) {
      const fresh = users.find(u => u.id === editingUser.id);
      if (fresh) setEditingUser(fresh);
    }
  }, [users]); // eslint-disable-line react-hooks/exhaustive-deps

  const confirmAllEmails = async () => {
    setConfirmingAll(true);
    setConfirmAllResult(null);
    try {
      const r = await adminFetch('/api/admin/confirm-all-emails', { method: 'POST', body: '{}' });
      setConfirmAllResult(`✅ Confirmed ${r.confirmed} users${r.failed > 0 ? `, ${r.failed} failed` : ''}`);
      setTimeout(() => setConfirmAllResult(null), 5000);
      fetchUsers();
    } catch (e: any) {
      setConfirmAllResult('❌ Failed: ' + e.message);
    } finally { setConfirmingAll(false); }
  };

  const saveTokenPolicies = async () => {
    setSavingPolicies(true);
    try {
      await adminFetch('/api/admin/save-token-policies', { method: 'POST', body: JSON.stringify({ policies: editedPolicies }) });
      fetchTokenPolicies();
    } catch (err: any) { alert('Failed: ' + err.message); }
    finally { setSavingPolicies(false); }
  };

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.email.toLowerCase().includes(q) || u.profile?.full_name?.toLowerCase().includes(q) || u.profile?.specialty?.toLowerCase().includes(q);
    const matchPlan = filterPlan === 'all' || u.subscription?.plan_id === filterPlan;
    const matchStatus = filterStatus === 'all' || u.profile?.account_status === filterStatus;
    const matchPayment = filterPayment === 'all'
      || (filterPayment === 'done' && inferIsPaid(u.subscription))
      || (filterPayment === 'not_done' && !inferIsPaid(u.subscription));
    return matchSearch && matchPlan && matchStatus && matchPayment;
  });

  const ACTION_LABELS: Record<string, string> = {
    plan_change: '💳 Plan Changed', token_override: '🪙 Token Override', status_change: '🔵 Status Changed',
    role_change: '🎭 Role Changed', token_policy_update: '📋 Policy Updated', password_reset: '🔑 Password Reset',
    payment_status_change: '💰 Payment Updated',
  };

  return (
    <div className="w-full">
      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">User Management</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage all users — plans, payments, roles, tokens, and passwords.</p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total Users',  value: totalUsers,   icon: Users,      color: '#6366f1', bg: '#eef2ff' },
          { label: 'Active',       value: activeUsers,  icon: UserCheck,  color: '#10b981', bg: '#ecfdf5' },
          { label: 'On Trial',     value: trialUsers,   icon: Clock,      color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Premium',      value: premiumUsers, icon: Shield,     color: '#8b5cf6', bg: '#f5f3ff' },
          { label: 'Paid',         value: paidUsers,    icon: IndianRupee, color: '#0ea5e9', bg: '#f0f9ff' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: card.bg }}>
              <card.icon size={20} style={{ color: card.color }} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900 leading-none">{card.value}</p>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3 text-red-700 text-sm">
          <XCircle size={16} className="shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-xs">Failed to load users</p>
            <p className="text-red-500 text-xs">{error}</p>
          </div>
          <button onClick={fetchUsers} className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded-lg text-xs font-bold">Retry</button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          USERS TAB
          ══════════════════════════════════════════════════════════ */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Filters */}
          <div className="px-5 py-4 border-b border-gray-50 flex flex-wrap gap-3 items-center bg-gray-50/50">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, specialty…"
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50" />
            </div>
            <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:border-indigo-400">
              <option value="all">All Plans</option>
              {plans.map(p => <option key={p.id} value={p.id}>{p.name || p.id}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:border-indigo-400">
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="blocked">Blocked</option>
            </select>
            <select value={filterPayment} onChange={e => setFilterPayment(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:border-indigo-400">
              <option value="all">All Payments</option>
              <option value="done">Paid ✅</option>
              <option value="not_done">Unpaid ❌</option>
            </select>
            <button onClick={fetchUsers} className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:bg-gray-50 transition-all">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={confirmAllEmails} disabled={confirmingAll}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all disabled:opacity-60 whitespace-nowrap">
              {confirmingAll ? <><RefreshCw size={12} className="animate-spin" /> Confirming…</> : <><CheckCircle size={12} /> Confirm All Emails</>}
            </button>
          </div>
          {confirmAllResult && (
            <div className={`mx-5 mt-0 mb-2 px-3 py-2 rounded-lg text-xs font-semibold ${confirmAllResult.startsWith('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {confirmAllResult}
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-400 font-medium">Loading users…</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-20">
              <Users size={40} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-500 font-semibold">No users found</p>
              <p className="text-gray-400 text-sm mt-1">
                {users.length === 0 ? 'Ensure you are authenticated and the backend is running.' : 'Adjust your filters.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['User', 'Plan', 'Payment', 'Status', 'Role', 'Specialty', 'Token Usage', 'Password Reset', 'Joined', 'Edit'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, idx) => (
                    <tr key={user.id} className={`border-b border-gray-50 hover:bg-indigo-50/30 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'}`}>
                      {/* User */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {(user.profile?.full_name || user.email || '?')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 text-xs leading-tight truncate max-w-[130px]">
                              {user.profile?.full_name || 'Unnamed'}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <p className="text-[11px] text-gray-400 truncate max-w-[120px]">{user.email}</p>
                              {!user.email_confirmed && (
                                <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                                  Unverified
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Plan */}
                      <td className="px-4 py-3"><PlanBadge planId={user.subscription?.plan_id || 'free'} /></td>
                      {/* Payment */}
                      <td className="px-4 py-3"><PaymentBadge sub={user.subscription} /></td>
                      {/* Status */}
                      <td className="px-4 py-3"><StatusBadge status={user.profile?.account_status || 'active'} /></td>
                      {/* Role */}
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-lg capitalize">
                          {(user.profile?.role || 'student').replace(/_/g, ' ')}
                        </span>
                      </td>
                      {/* Specialty */}
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-[100px] truncate">{user.profile?.specialty || '—'}</td>
                      {/* Tokens */}
                      <td className="px-4 py-3 min-w-[150px]"><TokenBar used={user.token_used} total={user.token_limit} /></td>
                      {/* Password Reset */}
                      <td className="px-4 py-3"><PasswordCell user={user} onDone={fetchUsers} /></td>
                      {/* Joined */}
                      <td className="px-4 py-3 text-[11px] text-gray-400 whitespace-nowrap">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                      </td>
                      {/* Edit */}
                      <td className="px-4 py-3">
                        <button onClick={() => setEditingUser(user)} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-all">
                          <Edit3 size={11} /> Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Footer */}
          <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-50 text-xs text-gray-400 flex items-center justify-between">
            <span>Showing <b className="text-gray-600">{filteredUsers.length}</b> of <b className="text-gray-600">{users.length}</b> users</span>
            {users.length === 0 && !loading && <span className="text-amber-500 font-medium">⚠ 0 users — check backend connection</span>}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TOKEN POLICY TAB
          ══════════════════════════════════════════════════════════ */}
      {activeTab === 'tokens' && (
        <div className="space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-sm text-amber-800">
            <Info size={15} className="shrink-0 mt-0.5 text-amber-600" />
            <span>Token policies set the <strong>default monthly allocation</strong> per plan. Override per-user from the Users tab.</span>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {plans.length === 0 ? (
              <div className="col-span-3 bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
                <Coins size={36} className="mx-auto mb-3 opacity-20" />
                <p className="font-medium">No plans loaded — check backend.</p>
              </div>
            ) : plans.map(plan => {
              const policy = tokenPolicies.find(p => p.plan_id === plan.id);
              const savedVal = plan.id === 'trial' ? (policy?.trial_tokens ?? 0) : (policy?.monthly_tokens ?? 0);
              const current = editedPolicies[plan.id] ?? savedVal;
              return (
                <div key={plan.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <PlanBadge planId={plan.id} />
                    <span className="text-sm font-bold text-gray-600">{plan.price_monthly === 0 ? 'Free' : `₹${plan.price_monthly}/mo`}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">{plan.description || plan.name}</p>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                    {plan.id === 'trial' ? 'Trial Tokens' : 'Monthly Tokens'}
                  </label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditedPolicies(p => ({ ...p, [plan.id]: Math.max(0, (p[plan.id] ?? current) - 1000) }))}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"><Minus size={13} /></button>
                    <input type="number" value={current} onChange={e => setEditedPolicies(p => ({ ...p, [plan.id]: Number(e.target.value) }))}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-bold text-gray-800 text-center focus:outline-none focus:border-indigo-400" />
                    <button onClick={() => setEditedPolicies(p => ({ ...p, [plan.id]: (p[plan.id] ?? current) + 1000 }))}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"><Plus size={13} /></button>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1.5">Currently saved: {savedVal.toLocaleString()}</p>
                </div>
              );
            })}
          </div>
          <button onClick={saveTokenPolicies} disabled={savingPolicies}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-60 transition-all shadow-sm">
            <Save size={15} /> {savingPolicies ? 'Saving…' : 'Save All Token Policies'}
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          SUBSCRIPTIONS TAB
          ══════════════════════════════════════════════════════════ */}
      {activeTab === 'subscriptions' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h2 className="font-bold text-gray-800 text-sm">All Subscriptions ({subscriptions.length})</h2>
            <button onClick={fetchSubscriptions} className="p-2 border border-gray-200 bg-white rounded-lg text-gray-500 hover:bg-gray-50"><RefreshCw size={14} /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['User ID', 'Plan', 'Payment', 'Status', 'Trial', 'Start Date', 'End / Expiry'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub, idx) => (
                  <tr key={sub.id} className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'}`}>
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">{sub.user_id?.substring(0, 12)}…</td>
                    <td className="px-4 py-3"><PlanBadge planId={sub.plan_id} /></td>
                    <td className="px-4 py-3"><PaymentBadge sub={sub} /></td>
                    <td className="px-4 py-3"><StatusBadge status={sub.status} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {sub.is_trial ? <span className="text-amber-600 font-bold flex items-center gap-1"><Clock size={11} />{sub.trial_end_date ? `Ends ${new Date(sub.trial_end_date).toLocaleDateString()}` : 'Trial'}</span> : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{sub.start_date ? new Date(sub.start_date).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{sub.end_date ? new Date(sub.end_date).toLocaleDateString() : 'Ongoing'}</td>
                  </tr>
                ))}
                {subscriptions.length === 0 && <tr><td colSpan={7} className="text-center py-16 text-gray-400 text-sm">No subscriptions found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          AUDIT LOGS TAB
          ══════════════════════════════════════════════════════════ */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h2 className="font-bold text-gray-800 text-sm">Audit Logs ({auditLogs.length})</h2>
            <button onClick={fetchAuditLogs} className="p-2 border border-gray-200 bg-white rounded-lg text-gray-500 hover:bg-gray-50"><RefreshCw size={14} /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Action', 'Target User', 'Performed By', 'Details', 'Date'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log, idx) => (
                  <tr key={log.id} className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'}`}>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {ACTION_LABELS[log.action_type] || log.action_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{log.target_user_email || '—'}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-700">{log.performed_by}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 max-w-[200px] truncate">{log.details ? JSON.stringify(log.details) : '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {auditLogs.length === 0 && <tr><td colSpan={5} className="text-center py-16 text-gray-400 text-sm">No audit logs yet.</td></tr>}
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
