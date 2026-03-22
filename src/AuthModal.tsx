import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@supabase/supabase-js';
import {
  Eye, EyeOff, X, Mail, Lock, User, Stethoscope,
  GraduationCap, ChevronRight, Loader2, CheckCircle, AlertCircle, Home,
  KeyRound, ArrowLeft, ShieldCheck, BookOpen
} from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ─── Types ────────────────────────────────────────────────────────────────────
type AuthMode = 'signin' | 'signup' | 'forgotPassword';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
  onGoHome?: () => void;
}

// ─── Field config ─────────────────────────────────────────────────────────────
const PROFESSION_OPTIONS = [
  'MBBS Doctor', 'MD/MS Resident', 'DM/MCh Fellow', 'Nursing', 'Pharmacy',
  'Physiotherapy', 'Dentistry', 'Ayurveda / BAMS', 'Medical Student', 'Other'
];

const SPECIALTY_OPTIONS = [
  'General Medicine', 'General Surgery', 'Paediatrics', 'Obstetrics & Gynaecology',
  'Orthopaedics', 'Pharmacology', 'Pathology', 'Microbiology', 'Anatomy', 'Physiology',
  'Biochemistry', 'Community Medicine', 'Forensic Medicine', 'Cardiology', 'Neurology',
  'Pulmonology', 'Nephrology', 'Gastroenterology', 'Oncology', 'Psychiatry',
  'Dermatology & Venereology', 'Radiodiagnosis', 'Anaesthesiology', 'ENT', 'Ophthalmology',
  'Emergency Medicine', 'Critical Care Medicine', 'Nursing', 'Pharmacy', 'Physiotherapy',
  'Dentistry', 'Ayurveda', 'Other'
];

const COURSE_OPTIONS = [
  'Mastering Anatomy', 'Mastering Physiology', 'Mastering Biochemistry',
  'Mastering Pharmacology', 'Mastering Pathology', 'Mastering Microbiology',
  'Mastering Forensic Medicine', 'Mastering Community Medicine / PSM',
  'Mastering General Medicine', 'Mastering General Surgery',
  'Mastering Obstetrics & Gynaecology', 'Mastering Paediatrics',
  'Mastering ENT', 'Mastering Ophthalmology', 'Mastering Orthopaedics',
  'Mastering Dermatology', 'Mastering Psychiatry', 'Mastering Anaesthesiology',
  'Mastering Radiodiagnosis'
];

// ─── Component ────────────────────────────────────────────────────────────────
export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess, onGoHome }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState<1 | 2>(1); // signup has 2 steps
  const [showOverrideConfirm, setShowOverrideConfirm] = useState(false);

  // Sign In fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up extra fields
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [profession, setProfession] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [qualification, setQualification] = useState('');
  const [country, setCountry] = useState('India');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [currentStage, setCurrentStage] = useState<'studying' | 'practicing' | 'both'>('studying');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  // Referral code from URL
  const [refCode, setRefCode] = useState<string | null>(null);
  const [refReferrerId, setRefReferrerId] = useState<string | null>(null);

  // On mount, check URL for ?ref=CODE
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('ref');
    if (code) {
      setRefCode(code.toUpperCase());
      // Look up the referrer
      fetch(`/api/referral/lookup/${code}`)
        .then(r => r.json())
        .then(data => {
          if (data.found) setRefReferrerId(data.referrer_user_id);
        })
        .catch(() => {});
    }
  }, []);

  // Forgot Password fields
  const [resetStep, setResetStep] = useState<'email' | 'code' | 'newPassword' | 'done'>('email');
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const resetForm = () => {
    setError('');
    setSuccess('');
    setStep(1);
    setEmail('');
    setPassword('');
    setFullName('');
    setMobile('');
    setProfession('');
    setSpecialty('');
    setQualification('');
    setCountry('India');
    setState('');
    setCity('');
    setCurrentStage('studying');
    setDisclaimerAccepted(false);
    setResetStep('email');
    setResetEmail('');
    setOtpCode('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowOverrideConfirm(false);
  };

  const switchMode = (m: AuthMode) => {
    resetForm();
    setMode(m);
  };

  // ── Password Strength Validation ─────────────────────────────────────────
  const passwordChecks = (pw: string) => ({
    length: pw.length >= 8 && pw.length <= 16,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  });
  const isPasswordValid = (pw: string) => {
    const c = passwordChecks(pw);
    return c.length && c.upper && c.lower && c.number && c.symbol;
  };
  const getPasswordError = (pw: string) => {
    const c = passwordChecks(pw);
    if (!c.length) return 'Password must be 8–16 characters.';
    if (!c.upper) return 'Password needs at least one uppercase letter.';
    if (!c.lower) return 'Password needs at least one lowercase letter.';
    if (!c.number) return 'Password needs at least one number.';
    if (!c.symbol) return 'Password needs at least one symbol (!@#$%...).';
    return '';
  };

  // ── Forgot Password Handlers ────────────────────────────────────────────────
  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) { setError('Please enter your email address.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to send code.'); return; }
      setSuccess('Verification code sent! Check your email.');
      setResetStep('code');
      // Start 60s cooldown for resend
      setCooldown(60);
      const timer = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setError('Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) { setError('Please enter the 6-digit code.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, code: otpCode })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Invalid code.'); return; }
      setResetToken(data.resetToken);
      setSuccess('Code verified! Set your new password.');
      setResetStep('newPassword');
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !isPasswordValid(newPassword)) { setError(getPasswordError(newPassword || '')); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, resetToken, newPassword })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Reset failed.'); return; }
      setSuccess('Password reset successful! You can now sign in.');
      setResetStep('done');
    } catch {
      setError('Password reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Sign In ─────────────────────────────────────────────────────────────────
  const handleSignIn = async (e?: React.FormEvent, force: boolean = false) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);
    let overrideTriggered = false;
    
    try {
      if (!force) {
        // Step 1: Check if there's an active session
        const res = await fetch(`/api/auth/session-status?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (data.hasActiveSession) {
          setShowOverrideConfirm(true);
          setLoading(false); // Reset loading so OK button is clickable
          overrideTriggered = true;
          return; // Stop here, wait for manual override click
        }
      }

      // Step 2: Proceed with sign in
      const { data: authData, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) { setError(err.message); setShowOverrideConfirm(false); return; }

      // Step 3: Register the new session exclusively for this device
      const sessionId = crypto.randomUUID();
      localStorage.setItem('medimentr_session_id', sessionId);
      
      await fetch('/api/auth/session/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, sessionId, deviceId: navigator.userAgent })
      });
      
      setSuccess(force 
        ? 'You have been logged in on this device. Your previous session has been securely logged out.' 
        : 'Signed in successfully! Redirecting...'
      );
      setTimeout(onSuccess, force ? 2000 : 800);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      if (!overrideTriggered) {
        setLoading(false);
      }
    }
  };

  // ── Sign Up step 1 → step 2 ─────────────────────────────────────────────────
  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      setError('Please fill in Name, Email and Password.');
      return;
    }
    if (!isPasswordValid(password)) {
      setError(getPasswordError(password));
      return;
    }
    setError('');
    setStep(2);
  };

  // ── Sign Up step 2 → create account ────────────────────────────────────────
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disclaimerAccepted) { setError('Please accept the disclaimer to continue.'); return; }
    setError('');
    setLoading(true);
    try {
      // 1. Create auth user
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
      });
      if (signUpErr) { setError(signUpErr.message); return; }

      const userId = data.user?.id;
      if (userId) {
        // 2. Insert user_profile (via server API to bypass RLS)
        try {
          await fetch('/api/user/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              full_name: fullName,
              mobile,
              profession,
              specialty,
              selected_course: selectedCourse || null,
              highest_qualification: qualification,
              current_stage: currentStage,
              country,
              state,
              city,
              account_status: 'active',
              email_verified: false,
              disclaimer_accepted: disclaimerAccepted,
              terms_accepted: true,
            })
          });
        } catch (profileErr) {
          console.error('Failed to create user profile:', profileErr);
        }

        // 3. Assign free trial subscription (via server API to bypass RLS)
        try {
          const subRes = await fetch('/api/user/subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              planId: 'trial',
              isTrial: true,
              trialStartDate: new Date().toISOString(),
              trialEndDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            })
          });
          if (!subRes.ok) {
            console.error('Subscription API error:', await subRes.text());
          } else {
            console.log('✅ Trial subscription created via server API');
          }
        } catch (subErr) {
          console.error('Failed to create trial subscription:', subErr);
        }

        // 4. Generate referral code for the new user
        try {
          const codeRes = await fetch(`/api/referral/stats/${userId}`);
          await codeRes.json(); // This auto-generates a code if missing
        } catch {} 

        // 5. Record referral if they came via a referral link
        if (refReferrerId && refCode) {
          fetch('/api/referral/record', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              referrer_user_id: refReferrerId,
              referred_user_id: userId,
              referral_code: refCode,
              referred_user_email: email
            })
          }).catch(err => console.error('Referral record failed:', err));
        }

        // 6. Send welcome email (fire-and-forget, don't block sign-up)
        fetch('/api/email/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: email, name: fullName })
        }).catch(err => console.error('Welcome email failed:', err));
      }

      setSuccess('Account created! Signing you in...');
      setTimeout(onSuccess, 800);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-60 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors z-50"
        >
          <X size={16} />
        </button>

        <div className="relative z-10 p-8">
          {/* Logo + Header */}
          <div className="text-center mb-8">
            <img src="/logo.jpg" alt="MediMentr" className="w-14 h-14 rounded-2xl mx-auto mb-4 shadow-lg" />
            <h2 className="text-2xl font-bold text-white">
              {mode === 'forgotPassword'
                ? resetStep === 'done' ? 'All Done!' : 'Reset Password'
                : mode === 'signin' ? 'Welcome Back' : step === 1 ? 'Create Account' : 'Complete Profile'}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {mode === 'forgotPassword'
                ? resetStep === 'email' ? 'Enter your email to receive a reset code'
                  : resetStep === 'code' ? 'Enter the 6-digit code sent to your email'
                  : resetStep === 'newPassword' ? 'Choose a strong new password'
                  : 'Your password has been updated'
                : mode === 'signin'
                  ? 'Sign in to your Medimentr account'
                  : step === 1
                    ? 'Join thousands of medical professionals'
                    : 'Tell us about your medical background'}
            </p>
          </div>

          {/* Mode Tabs */}
          {mode !== 'forgotPassword' && (
          <div className="flex bg-slate-800/60 rounded-xl p-1 mb-6">
            {(['signin', 'signup'] as AuthMode[]).map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                  mode === m
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>
          )}

          {/* Forgot Password: Back button */}
          {mode === 'forgotPassword' && resetStep !== 'done' && (
            <button
              type="button"
              onClick={() => {
                if (resetStep === 'email') { switchMode('signin'); }
                else if (resetStep === 'code') { setResetStep('email'); setError(''); setSuccess(''); }
                else if (resetStep === 'newPassword') { setResetStep('code'); setError(''); setSuccess(''); }
              }}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-medium mb-4 transition-colors"
            >
              <ArrowLeft size={14} /> Back
            </button>
          )}

          {/* Alerts */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-xl px-4 py-3 mb-4">
                <CheckCircle size={16} className="shrink-0" />
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── SIGN IN FORM ──────────────────────────────────── */}
          {mode === 'signin' && (
            showOverrideConfirm ? (
              <div className="space-y-4 text-center">
                <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-amber-500/20">
                  <AlertCircle size={28} className="text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Active Session Detected</h3>
                <p className="text-slate-300 text-sm leading-relaxed px-4">
                  You are already logged in on another device. Logging in here will log you out from the previous session.
                </p>
                <p className="text-slate-400 text-xs leading-relaxed px-4">
                  If it is OK, click <strong className="text-white">"OK"</strong> to continue.
                </p>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowOverrideConfirm(false); setLoading(false); setError(''); }}
                    className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 font-semibold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={loading || !!success}
                    onClick={() => handleSignIn(undefined, true)}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm"
                  >
                    {loading ? <><Loader2 size={16} className="animate-spin" /> Logging in...</> : 'OK'}
                  </button>
                </div>
              </div>
            ) : (
            <form onSubmit={handleSignIn} className="space-y-4">
              <InputField
                label="Email Address" type="email" value={email}
                onChange={setEmail} icon={<Mail size={16} />}
                placeholder="doctor@hospital.com" required
              />
              <PasswordField
                label="Password" value={password} onChange={setPassword}
                show={showPassword} setShow={setShowPassword}
                placeholder="Enter your password"
              />
              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  onClick={() => { switchMode('forgotPassword'); setResetEmail(email); }}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <button
                type="submit" disabled={loading || !!success}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 size={18} className="animate-spin" /> Signing In...</> : <>Sign In <ChevronRight size={18} /></>}
              </button>
              <p className="text-center text-xs text-slate-500 pt-2">
                Don't have an account?{' '}
                <button type="button" onClick={() => switchMode('signup')} className="text-blue-400 hover:text-blue-300 font-semibold">
                  Create one free
                </button>
              </p>
            </form>
            )
          )}

          {/* ── FORGOT PASSWORD FLOW ──────────────────────────── */}
          {mode === 'forgotPassword' && resetStep === 'email' && (
            <form onSubmit={handleSendResetCode} className="space-y-4">
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-blue-500/20">
                <KeyRound size={28} className="text-blue-400" />
              </div>
              <InputField
                label="Email Address" type="email" value={resetEmail}
                onChange={setResetEmail} icon={<Mail size={16} />}
                placeholder="Enter your registered email" required
              />
              <button
                type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 size={18} className="animate-spin" /> Sending Code...</> : <>Send Reset Code <ChevronRight size={18} /></>}
              </button>
              <p className="text-center text-xs text-slate-500 pt-1">
                Remember your password?{' '}
                <button type="button" onClick={() => switchMode('signin')} className="text-blue-400 hover:text-blue-300 font-semibold">Sign In</button>
              </p>
            </form>
          )}

          {mode === 'forgotPassword' && resetStep === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-amber-500/20">
                <ShieldCheck size={28} className="text-amber-400" />
              </div>
              <p className="text-center text-slate-400 text-sm -mt-1 mb-2">
                Code sent to <strong className="text-white">{resetEmail}</strong>
              </p>
              <div className="space-y-1.5">
                <label className="block text-slate-300 text-sm font-medium">6-Digit Code</label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtpCode(val);
                  }}
                  placeholder="● ● ● ● ● ●"
                  maxLength={6}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-4 text-white text-center text-2xl font-bold tracking-[0.5em] placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                  autoFocus
                />
              </div>
              <button
                type="submit" disabled={loading || otpCode.length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 size={18} className="animate-spin" /> Verifying...</> : <>Verify Code <ChevronRight size={18} /></>}
              </button>
              <p className="text-center text-xs text-slate-500 pt-1">
                Didn't receive the code?{' '}
                <button
                  type="button"
                  disabled={cooldown > 0}
                  onClick={() => { setError(''); setSuccess(''); handleSendResetCode({ preventDefault: () => {} } as any); }}
                  className={`font-semibold transition-colors ${cooldown > 0 ? 'text-slate-600 cursor-not-allowed' : 'text-blue-400 hover:text-blue-300'}`}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                </button>
              </p>
            </form>
          )}

          {mode === 'forgotPassword' && resetStep === 'newPassword' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-emerald-500/20">
                <Lock size={28} className="text-emerald-400" />
              </div>
              <PasswordField
                label="New Password" value={newPassword} onChange={setNewPassword}
                show={showNewPassword} setShow={setShowNewPassword}
                placeholder="8–16 chars, Aa, 1, !@#"
              />
              {newPassword && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 px-1 -mt-1">
                  {[
                    ['length', '8–16 characters'],
                    ['upper', 'Uppercase letter'],
                    ['lower', 'Lowercase letter'],
                    ['number', 'Number'],
                    ['symbol', 'Symbol (!@#$...)']
                  ].map(([key, label]) => {
                    const ok = passwordChecks(newPassword)[key as keyof ReturnType<typeof passwordChecks>];
                    return (
                      <div key={key} className={`flex items-center gap-1.5 text-[11px] font-medium ${ok ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {ok ? <CheckCircle size={11} /> : <span className="w-[11px] h-[11px] rounded-full border border-slate-600 inline-block" />}
                        {label}
                      </div>
                    );
                  })}
                </div>
              )}
              <PasswordField
                label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword}
                show={showNewPassword} setShow={setShowNewPassword}
                placeholder="Re-enter new password"
              />
              <button
                type="submit" disabled={loading || !newPassword || !confirmPassword}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 size={18} className="animate-spin" /> Resetting...</> : <>Reset Password <CheckCircle size={18} /></>}
              </button>
            </form>
          )}

          {mode === 'forgotPassword' && resetStep === 'done' && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/30">
                <CheckCircle size={36} className="text-emerald-400" />
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                Your password has been reset successfully.<br />You can now sign in with your new password.
              </p>
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                Sign In Now <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* ── SIGN UP STEP 1 ───────────────────────────────── */}
          {mode === 'signup' && step === 1 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <InputField
                label="Full Name" type="text" value={fullName}
                onChange={setFullName} icon={<User size={16} />}
                placeholder="Dr. First Last" required
              />
              <InputField
                label="Email Address" type="email" value={email}
                onChange={setEmail} icon={<Mail size={16} />}
                placeholder="doctor@hospital.com" required
              />
              <PasswordField
                label="Password" value={password} onChange={setPassword}
                show={showPassword} setShow={setShowPassword}
                placeholder="8–16 chars, Aa, 1, !@#"
              />
              {password && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 px-1 -mt-1">
                  {[
                    ['length', '8–16 characters'],
                    ['upper', 'Uppercase letter'],
                    ['lower', 'Lowercase letter'],
                    ['number', 'Number'],
                    ['symbol', 'Symbol (!@#$...)']
                  ].map(([key, label]) => {
                    const ok = passwordChecks(password)[key as keyof ReturnType<typeof passwordChecks>];
                    return (
                      <div key={key} className={`flex items-center gap-1.5 text-[11px] font-medium ${ok ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {ok ? <CheckCircle size={11} /> : <span className="w-[11px] h-[11px] rounded-full border border-slate-600 inline-block" />}
                        {label}
                      </div>
                    );
                  })}
                  <div className="col-span-2 mt-1 text-[10px] text-slate-600 flex items-center gap-1">
                    <ShieldCheck size={10} /> Tip: Use a password manager for best security
                  </div>
                </div>
              )}
              <button
                type="submit"
                className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                Continue <ChevronRight size={18} />
              </button>
              <p className="text-center text-xs text-slate-500 pt-2">
                Already have an account?{' '}
                <button type="button" onClick={() => switchMode('signin')} className="text-blue-400 hover:text-blue-300 font-semibold">
                  Sign In
                </button>
              </p>
            </form>
          )}

          {/* ── SIGN UP STEP 2 ───────────────────────────────── */}
          {mode === 'signup' && step === 2 && (
            <form onSubmit={handleSignUp} className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
              {/* Mobile */}
              <InputField
                label="Mobile Number" type="tel" value={mobile}
                onChange={setMobile} icon={<Mail size={16} />}
                placeholder="+91 9876543210"
              />

              {/* Profession */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 text-sm font-medium">Profession</label>
                <div className="relative">
                  <Stethoscope size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <select
                    value={profession} onChange={e => setProfession(e.target.value)}
                    className="w-full appearance-none bg-slate-800 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="">-- Select Profession --</option>
                    {PROFESSION_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              {/* Select Your Course */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 text-sm font-medium">Select Your Course</label>
                <div className="relative">
                  <BookOpen size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <select
                    value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
                    className="w-full appearance-none bg-slate-800 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="">-- Select Course --</option>
                    {COURSE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              {/* Qualification */}
              <InputField
                label="Highest Qualification" type="text" value={qualification}
                onChange={setQualification} icon={<GraduationCap size={16} />}
                placeholder="e.g. MBBS, MD Pharmacology"
              />

              {/* Stage */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 text-sm font-medium">Current Stage</label>
                <div className="grid grid-cols-3 gap-2">
                  {([['studying', 'Studying'], ['practicing', 'Practicing'], ['both', 'Both']] as const).map(([val, lbl]) => (
                    <button
                      key={val} type="button"
                      onClick={() => setCurrentStage(val)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        currentStage === val
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-slate-800 border-white/10 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="State" type="text" value={state}
                  onChange={setState} placeholder="e.g. Karnataka"
                />
                <InputField
                  label="City" type="text" value={city}
                  onChange={setCity} placeholder="e.g. Bangalore"
                />
              </div>

              {/* Disclaimer */}
              <label className="flex items-start gap-3 bg-slate-800/60 border border-white/10 rounded-xl p-3 cursor-pointer hover:border-blue-500/30 transition-colors mt-2">
                <input
                  type="checkbox" checked={disclaimerAccepted}
                  onChange={e => setDisclaimerAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-blue-500 bg-slate-700 border-slate-600 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-400 leading-relaxed">
                  I understand that AI-generated content is for <strong className="text-slate-300">educational purposes only</strong> and should not replace clinical judgment or professional medical advice.
                </span>
              </label>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button" onClick={() => { setStep(1); setError(''); }}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 font-semibold text-sm transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit" disabled={loading || !!success}
                  className="flex-[2] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 text-sm"
                >
                  {loading
                    ? <><Loader2 size={16} className="animate-spin" /> Creating Account...</>
                    : <><CheckCircle size={16} /> Create Account</>
                  }
                </button>
              </div>
            </form>
          )}

          {/* Return to Home */}
          {onGoHome && (
            <div className="pt-4 mt-2 border-t border-white/5">
              <button
                type="button"
                onClick={onGoHome}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
              >
                <Home size={16} />
                Return to Home Page
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ─── Reusable sub-components ─────────────────────────────────────────────────

const InputField = ({
  label, type, value, onChange, icon, placeholder, required
}: {
  label: string; type: string; value: string; onChange: (v: string) => void;
  icon?: React.ReactNode; placeholder?: string; required?: boolean;
}) => (
  <div className="space-y-1.5">
    <label className="block text-slate-300 text-sm font-medium">{label}</label>
    <div className="relative">
      {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>}
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required}
        className={`w-full bg-slate-800 border border-white/10 rounded-xl ${icon ? 'pl-10' : 'pl-4'} pr-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors`}
      />
    </div>
  </div>
);

const PasswordField = ({
  label, value, onChange, show, setShow, placeholder
}: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; setShow: (v: boolean) => void; placeholder?: string;
}) => (
  <div className="space-y-1.5">
    <label className="block text-slate-300 text-sm font-medium">{label}</label>
    <div className="relative">
      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
      <input
        type={show ? 'text' : 'password'} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-800 border border-white/10 rounded-xl pl-10 pr-11 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
      />
      <button
        type="button" onClick={() => setShow(!show)}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  </div>
);
