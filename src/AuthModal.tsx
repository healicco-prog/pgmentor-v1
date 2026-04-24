import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@supabase/supabase-js';
import {
  Eye, EyeOff, X, Mail, Lock, User, Stethoscope,
  ChevronRight, Loader2, CheckCircle, AlertCircle, Home,
  KeyRound, ArrowLeft, ShieldCheck, BookOpen, MailCheck, RefreshCw
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


const COURSE_OPTIONS = [
  'Anatomy', 'Physiology', 'Biochemistry',
  'Pharmacology', 'Pathology', 'Microbiology',
  'Forensic Medicine & Toxicology', 'PSM / Community Medicine',
  'General Medicine', 'General Surgery',
  'Obstetrics & Gynecology', 'Pediatrics',
  'ENT', 'Ophthalmology', 'Orthopaedics',
  'Dermatology (DVL)', 'Psychiatry', 'Anaesthesiology',
  'Radio Diagnosis'
];

// ─── Component ────────────────────────────────────────────────────────────────
export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess, onGoHome }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationName, setVerificationName] = useState('');
  const [verificationUserId, setVerificationUserId] = useState('');
    const [resendingVerification, setResendingVerification] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend confirmation email (Supabase native) — when sign-in fails with "Email not confirmed"
  const [confirmEmail, setConfirmEmail] = useState('');
  const [resendingConfirm, setResendingConfirm] = useState(false);
  const [confirmResent, setConfirmResent] = useState(false);

  // Sign In fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up fields
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
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
        .catch((err) => { console.error('Referral lookup failed:', err); });
    }

    // Check for email verification result from URL params
    const verification = params.get('verification');
    if (verification === 'success') {
      setSuccess('✅ Email verified successfully! You can now sign in.');
      setMode('signin');
      // Clean the URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (verification === 'expired') {
      setError('Verification link has expired. Please request a new one.');
      setMode('signin');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (verification === 'error') {
      setError('Email verification failed. Please try again.');
      setMode('signin');
      window.history.replaceState({}, '', window.location.pathname);
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
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup cooldown timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  const resetForm = () => {
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
    setFullName('');
    setMobile('');
    setSelectedCourse('');
    setDisclaimerAccepted(false);
    setResetStep('email');
    setResetEmail('');
    setOtpCode('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
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
      // Start 60s cooldown for resend (clear any existing timer first)
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
      setCooldown(60);
      cooldownTimerRef.current = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) {
            if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
            cooldownTimerRef.current = null;
            return 0;
          }
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
  const handleSignIn = async (e?: React.FormEvent, force: boolean = true) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Always proceed with sign in without prompting for session override

      // Step 2: Proceed with sign in
            const { data: authData, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        // Detect "Email not confirmed" error from Supabase and offer resend option
        const msg = err.message?.toLowerCase() || '';
        if (msg.includes('email not confirmed') || msg.includes('email_not_confirmed') || msg.includes('unconfirmed')) {
          setConfirmEmail(email);
          setError(err.message);
          setLoading(false);
          return;
        }
        setError(err.message);
        return;
      }

      // Step 2.5: Check email verification status
      const userId = authData.user?.id;
      if (userId) {
        // If Supabase natively recognizes the email as confirmed, we can skip the manual DB check.
        // We also gracefully fall back to the custom DB check if email_confirmed_at isn't set yet.
        const isSupabaseConfirmed = !!authData.user?.email_confirmed_at;
        
        if (!isSupabaseConfirmed) {
          try {
            const verifyRes = await fetch(`/api/auth/verification-status/${userId}`);
            const verifyData = await verifyRes.json();
            if (!verifyData.verified) {
              // Email not verified — show verification screen
              await supabase.auth.signOut(); // Sign them out
              setVerificationEmail(email);
              setVerificationName(authData.user?.user_metadata?.full_name || '');
              setVerificationUserId(userId);
              setVerificationSent(true);
              setError('Please verify your email before signing in. Check your inbox for the verification link.');
              setLoading(false);
              return;
            }
          } catch (verifyErr) {
            console.warn('Could not check verification status:', verifyErr);
            // Allow sign-in if verification check fails (graceful degradation)
          }
        }
      }

      // Step 3: Register the new session exclusively for this device
      const sessionId = crypto.randomUUID();
      localStorage.setItem('PGMentor_session_id', sessionId);
      
      await fetch('/api/auth/session/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userId: authData.user?.id, sessionId, deviceId: navigator.userAgent })
      });
      
      setSuccess(force 
        ? 'You have been logged in on this device. Your previous session has been securely logged out.' 
        : 'Signed in successfully! Redirecting...'
      );
      setTimeout(onSuccess, force ? 2000 : 800);
    } catch (err: any) {
      // TypeError with "fetch" in the message = server is not running
      const msg = err?.message || '';
      if (msg.includes('fetch') || msg.includes('network') || msg.includes('connect') || err instanceof TypeError) {
        setError('Cannot reach the server. Please make sure the app server is running (npm run dev), then try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };



  // ── Resend verification email handler ────────────────────────────────────────
  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    setResendingVerification(true);
    setError('');
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail, name: verificationName, userId: verificationUserId })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to resend verification email.'); return; }
      setSuccess('Verification email resent! Please check your inbox.');
      // Start 60s cooldown
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setError('Failed to resend. Please try again.');
        } finally {
      setResendingVerification(false);
    }
  };

  // ✅ Resend Supabase confirmation email (called when sign-in fails with "Email not confirmed")
  const handleResendConfirmation = async () => {
    if (resendingConfirm) return;
    setResendingConfirm(true);
    setError('');
    setConfirmResent(false);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: confirmEmail || email
      });
      if (resendError) {
        setError(resendError.message || 'Failed to resend confirmation email.');
        return;
      }
      setConfirmResent(true);
      setSuccess('✅ Confirmation email has been resent. Please check your inbox and spam folder.');
    } catch {
      setError('Failed to resend confirmation email. Please try again.');
    } finally {
      setResendingConfirm(false);
    }
  };

  // ── Sign Up → create account (single page) ────────────────────────────────
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      setError('Please fill in Name, Email and Password.');
      return;
    }
    if (!isPasswordValid(password)) {
      setError(getPasswordError(password));
      return;
    }
    if (!disclaimerAccepted) { setError('Please accept the disclaimer to continue.'); return; }
    setError('');
    setLoading(true);
    try {
      // Create account via server-side API
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          fullName,
          mobile,
          selectedCourse: selectedCourse || null,
          disclaimerAccepted,
          refReferrerId,
          refCode,
        })
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setError('An account with this email already exists. Please sign in instead.');
        } else if (res.status === 429) {
          setError('Too many registration attempts. Please wait a few minutes and try again.');
        } else {
          setError(data.error || 'Failed to create account. Please try again.');
        }
        return;
      }

      const userId = data.userId;

      if (selectedCourse) {
        localStorage.setItem('PGMentor_selected_course', selectedCourse);
      }

      setVerificationEmail(email);
      setVerificationName(fullName);
      setVerificationUserId(userId || '');
      setVerificationSent(true);
    } catch (err) {
      console.error('Signup fetch error:', err);
      setError('Unable to connect to the server. Please check your internet connection and try again.');
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
        className="w-full max-w-md bg-white border border-[#dfe6f0] rounded-3xl shadow-2xl overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Subtle glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-[#1e3a6e]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-60 h-40 bg-[#c9a84c]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-[#f5f7fa] hover:bg-[#eef2f8] text-[#6b7e99] hover:text-[#1e3a6e] transition-colors z-50"
        >
          <X size={16} />
        </button>

        <div className="relative z-10 p-8">
          {/* ── Email Verification Sent Screen ────────────────────────────── */}
          {verificationSent ? (
            <div className="text-center">
              <div className="relative mx-auto w-20 h-20 mb-6">
                <div className="absolute inset-0 bg-[#27ae60]/20 rounded-full animate-ping" />
                <div className="relative w-20 h-20 bg-gradient-to-br from-[#27ae60] to-[#1e9448] rounded-full flex items-center justify-center shadow-lg shadow-[#27ae60]/30">
                  <MailCheck size={36} style={{color:'#ffffff'}} />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-[#1e3a6e] mb-2">Check Your Email</h2>
              <p className="text-[#6b7e99] text-sm mb-6 leading-relaxed">
                We've sent a verification link to<br />
                <span className="text-[#27ae60] font-semibold">{verificationEmail}</span>
              </p>

              <div className="bg-[#f5f7fa] border border-[#dfe6f0] rounded-2xl p-5 mb-6 text-left">
                <div className="flex items-start gap-3 mb-3">
                  <Mail size={18} className="text-[#2f80ed] mt-0.5 flex-shrink-0" />
                  <p className="text-[#4a5568] text-sm leading-relaxed">
                    Click the <strong className="text-[#1e3a6e]">Verify My Email</strong> button in the email to activate your account.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck size={18} className="text-[#c9a84c] mt-0.5 flex-shrink-0" />
                  <p className="text-[#4a5568] text-sm leading-relaxed">
                    The link expires in <strong className="text-[#1e3a6e]">24 hours</strong>. Check your spam folder if you don't see it.
                  </p>
                </div>
              </div>

              {/* Error/Success messages */}
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mb-4">
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 bg-[#27ae60]/10 border border-[#27ae60]/20 rounded-xl px-4 py-2.5 mb-4">
                  <CheckCircle size={16} className="text-[#27ae60] flex-shrink-0" />
                  <p className="text-[#27ae60] text-sm">{success}</p>
                </div>
              )}

              {/* Resend Button */}
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendingVerification || resendCooldown > 0}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#eef2f8] border border-[#dfe6f0] text-[#1e3a6e] hover:bg-[#dfe6f0] transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed mb-3"
              >
                {resendingVerification ? (
                  <><Loader2 size={16} className="animate-spin" /> Sending...</>
                ) : resendCooldown > 0 ? (
                  <><RefreshCw size={16} /> Resend in {resendCooldown}s</>
                ) : (
                  <><RefreshCw size={16} /> Resend Verification Email</>
                )}
              </button>

              {/* Back to Sign In */}
              <button
                type="button"
                onClick={() => {
                  setVerificationSent(false);
                  setError('');
                  setSuccess('');
                  switchMode('signin');
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[#6b7e99] hover:text-[#1e3a6e] hover:bg-[#f5f7fa] transition-all text-sm font-medium"
              >
                <ArrowLeft size={16} />
                Back to Sign In
              </button>
            </div>
          ) : (
          <>
          {/* Logo + Header */}
          <div className="text-center mb-8">
            <img src="/logo.svg" alt="PGMentor" className="w-14 h-14 rounded-2xl mx-auto mb-4 shadow-lg" />
            <h2 className="text-2xl font-bold text-[#1e3a6e]">
              {mode === 'forgotPassword'
                ? resetStep === 'done' ? 'All Done!' : 'Reset Password'
                : mode === 'signin' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-[#6b7e99] text-sm mt-1">
              {mode === 'forgotPassword'
                ? resetStep === 'email' ? 'Enter your email to receive a reset code'
                  : resetStep === 'code' ? 'Enter the 6-digit code sent to your email'
                  : resetStep === 'newPassword' ? 'Choose a strong new password'
                  : 'Your password has been updated'
                : mode === 'signin'
                  ? 'Sign in to your PGMentor account'
                  : 'Join thousands of medical professionals'}
            </p>
          </div>

          {/* Mode Tabs */}
          {mode !== 'forgotPassword' && (
          <div className="flex bg-[#f0f4f9] rounded-xl p-1 mb-6">
            {(['signin', 'signup'] as AuthMode[]).map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                  mode === m
                    ? 'bg-[#1e3a6e] text-white shadow-sm'
                    : 'text-[#6b7e99] hover:text-[#1e3a6e]'
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
              className="flex items-center gap-1.5 text-[#6b7e99] hover:text-[#1e3a6e] text-sm font-medium mb-4 transition-colors"
            >
              <ArrowLeft size={14} /> Back
            </button>
          )}

          {/* Alerts */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-[#27ae60]/10 border border-[#27ae60]/30 text-[#27ae60] text-sm rounded-xl px-4 py-3 mb-4">
                <CheckCircle size={16} className="shrink-0" />
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── SIGN IN FORM ──────────────────────────────────── */}
          {mode === 'signin' && (
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
                  className="text-xs text-[#2f80ed] hover:text-[#1e3a6e] font-semibold transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <button
                type="submit" disabled={loading || !!success}
                className="w-full mt-2 bg-[#1e3a6e] hover:bg-[#2347a0] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-[#1e3a6e]/20 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 size={18} className="animate-spin" /> Signing In...</> : <>Sign In <ChevronRight size={18} /></>}
              </button>




                            {/* Resend confirmation button — shown when sign-in fails with "Email not confirmed" */}
              {error && confirmEmail && (
                <div className="mt-2 space-y-2">
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={resendingConfirm}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-[#1e3a6e]/20 text-[#1e3a6e] hover:bg-[#1e3a6e]/5 disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm font-semibold"
                  >
                    {resendingConfirm ? (
                      <><Loader2 size={16} className="animate-spin" /> Sending...</>
                    ) : confirmResent ? (
                      <><CheckCircle size={16} className="text-[#27ae60]" /> Resent! Check your inbox</>
                    ) : (
                      <><Mail size={16} /> Resend confirmation email</>
                    )}
                  </button>
                </div>
              )}

              <p className="text-center text-xs text-[#8a9ab4] pt-2">
                Don't have an account?{' '}
                <button type="button" onClick={() => switchMode('signup')} className="text-[#2f80ed] hover:text-[#1e3a6e] font-semibold">
                  Create one free
                </button>
              </p>
            </form>
          )}

          {/* ── FORGOT PASSWORD FLOW ──────────────────────────── */}
          {mode === 'forgotPassword' && resetStep === 'email' && (
            <form onSubmit={handleSendResetCode} className="space-y-4">
              <div className="w-16 h-16 bg-[#1e3a6e]/10 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-[#1e3a6e]/20">
                <KeyRound size={28} className="text-[#1e3a6e]" />
              </div>
              <InputField
                label="Email Address" type="email" value={resetEmail}
                onChange={setResetEmail} icon={<Mail size={16} />}
                placeholder="Enter your registered email" required
              />
              <button
                type="submit" disabled={loading}
                className="w-full bg-[#1e3a6e] hover:bg-[#2347a0] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-[#1e3a6e]/20 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 size={18} className="animate-spin" /> Sending Code...</> : <>Send Reset Code <ChevronRight size={18} /></>}
              </button>
              <p className="text-center text-xs text-[#8a9ab4] pt-1">
                Remember your password?{' '}
                <button type="button" onClick={() => switchMode('signin')} className="text-[#2f80ed] hover:text-[#1e3a6e] font-semibold">Sign In</button>
              </p>
            </form>
          )}

          {mode === 'forgotPassword' && resetStep === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-amber-500/20">
                <ShieldCheck size={28} className="text-amber-700" />
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
                  className={`font-semibold transition-colors ${cooldown > 0 ? 'text-slate-600 cursor-not-allowed' : 'text-blue-700 hover:text-blue-800'}`}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                </button>
              </p>
            </form>
          )}

          {mode === 'forgotPassword' && resetStep === 'newPassword' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-emerald-500/20">
                <Lock size={28} className="text-emerald-700" />
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
                      <div key={key} className={`flex items-center gap-1.5 text-[11px] font-medium ${ok ? 'text-emerald-700' : 'text-slate-500'}`}>
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
                <CheckCircle size={36} className="text-emerald-700" />
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

          {/* ── SIGN UP (Single Page) ──────────────────────────── */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <InputField
                label="Full Name" type="text" value={fullName}
                onChange={setFullName} icon={<User size={16} />}
                placeholder="Dr. First Last" required
              />
              <InputField
                label="Mobile Number" type="tel" value={mobile}
                onChange={setMobile} icon={<Stethoscope size={16} />}
                placeholder="+91 9876543210"
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
                      <div key={key} className={`flex items-center gap-1.5 text-[11px] font-medium ${ok ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {ok ? <CheckCircle size={11} /> : <span className="w-[11px] h-[11px] rounded-full border border-slate-600 inline-block" />}
                        {label}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Select Course */}
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

              {/* Disclaimer */}
              <label className="flex items-start gap-3 bg-slate-800/60 border border-white/10 rounded-xl p-3 cursor-pointer hover:border-blue-500/30 transition-colors">
                <input
                  type="checkbox" checked={disclaimerAccepted}
                  onChange={e => setDisclaimerAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-blue-500 bg-slate-700 border-slate-600 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-400 leading-relaxed">
                  I understand that AI-generated content is for <strong className="text-slate-300">educational purposes only</strong> and should not replace clinical judgment or professional medical advice.
                </span>
              </label>

              {/* Create Account button */}
              <button
                type="submit" disabled={loading || !!success}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /> Creating Account...</>
                  : <><CheckCircle size={16} /> Create Account</>
                }
              </button>
              <p className="text-center text-xs text-slate-500 pt-1">
                Already have an account?{' '}
                <button type="button" onClick={() => switchMode('signin')} className="text-blue-700 hover:text-blue-800 font-semibold">
                  Sign In
                </button>
              </p>
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
          </>
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

export default AuthModal;
