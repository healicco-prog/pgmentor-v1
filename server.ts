import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ Missing Supabase credentials in .env. Integration may fail.");
}

const supabase = createClient(supabaseUrl || "http://localhost", supabaseKey || "anon_key");

// Admin client with service role key (bypasses RLS)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl || "http://localhost", supabaseServiceKey)
  : supabase;
if (supabaseServiceKey) {
  console.log("✅ Supabase admin client initialized (service role).");
}

// Resend Email Service
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
if (!resendApiKey) {
  console.warn("⚠️ Missing RESEND_API_KEY in .env. Email features will be disabled.");
} else {
  console.log("✅ Resend email service initialized.");
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json({ limit: '50mb' }));

  // ═══════════════════════════════════════════════════════════════════════════
  // PASSWORD RESET OTP SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════
  
  // In-memory OTP store: Map<email, { code, expiresAt, attempts, resetToken? }>
  const otpStore = new Map<string, { code: string; expiresAt: number; attempts: number; resetToken?: string }>();

  // Cleanup expired OTPs every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [email, entry] of otpStore) {
      if (now > entry.expiresAt) otpStore.delete(email);
    }
  }, 5 * 60 * 1000);

  // Generate a random 6-digit OTP
  const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Generate a reset token (random hex string)
  const generateResetToken = (): string => {
    return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  };

  // 1. Send Reset Code
  app.post("/api/auth/send-reset-code", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    // Rate limit: max 3 OTPs per email within 10 minutes
    const existing = otpStore.get(email);
    if (existing && existing.attempts >= 3 && Date.now() < existing.expiresAt) {
      return res.status(429).json({ error: "Too many attempts. Please try again later." });
    }

    const code = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    otpStore.set(email, { code, expiresAt, attempts: (existing?.attempts || 0) + 1 });

    console.log(`🔑 OTP generated for ${email}: ${code}`);

    // Send OTP email via Resend
    if (resend) {
      try {
        await resend.emails.send({
          from: "Medimentr <onboarding@resend.dev>",
          to: [email],
          subject: "Password Reset Code – Medimentr",
          html: emailWrapper("Password Reset", `
            <h2 style="color:#0f172a;font-size:22px;margin:0 0 16px 0;">Password Reset Request 🔐</h2>
            <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px 0;">
              We received a request to reset your Medimentr account password. Use the code below to verify your identity:
            </p>
            
            <div style="background:linear-gradient(135deg,#1e293b,#0f172a);border-radius:16px;padding:32px;text-align:center;margin:0 0 24px 0;">
              <p style="color:#94a3b8;font-size:12px;font-weight:600;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:2px;">Your Verification Code</p>
              <p style="color:#ffffff;font-size:42px;font-weight:800;letter-spacing:12px;margin:0;font-family:'Courier New',monospace;">${code}</p>
            </div>
            
            <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:12px;padding:16px 20px;margin:0 0 20px 0;">
              <p style="color:#92400e;font-size:13px;margin:0;line-height:1.5;">
                ⚠️ This code expires in <strong>10 minutes</strong>. If you didn't request this, please ignore this email — your account is safe.
              </p>
            </div>
            
            <p style="color:#94a3b8;font-size:13px;margin:0;text-align:center;">
              For security, never share this code with anyone.
            </p>
          `)
        });
        console.log("📧 Reset code email sent to:", email);
      } catch (err: any) {
        console.error("❌ Failed to send reset code email:", err.message);
        // Still return success – the OTP is stored, log it for dev purposes
      }
    }

    res.json({ success: true, message: "Reset code sent to your email" });
  });

  // 2. Verify Reset Code
  app.post("/api/auth/verify-reset-code", async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: "Email and code are required" });

    const entry = otpStore.get(email);
    if (!entry) {
      return res.status(400).json({ error: "No reset code was sent for this email. Please request a new one." });
    }

    if (Date.now() > entry.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ error: "Code has expired. Please request a new one." });
    }

    if (entry.code !== code.trim()) {
      return res.status(400).json({ error: "Invalid code. Please check and try again." });
    }

    // Code is valid — generate a reset token
    const resetToken = generateResetToken();
    otpStore.set(email, { ...entry, resetToken, expiresAt: Date.now() + 5 * 60 * 1000 }); // 5 min to set new password
    
    console.log(`✅ OTP verified for ${email}, reset token issued`);
    res.json({ success: true, resetToken });
  });

  // 3. Reset Password (after OTP verification)
  app.post("/api/auth/reset-password", async (req, res) => {
    const { email, resetToken, newPassword } = req.body;
    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ error: "Email, reset token, and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const entry = otpStore.get(email);
    if (!entry || entry.resetToken !== resetToken) {
      return res.status(400).json({ error: "Invalid or expired reset session. Please start over." });
    }

    if (Date.now() > entry.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ error: "Reset session expired. Please start over." });
    }

    try {
      // Call our Supabase RPC function to securely update the password
      const { data, error } = await supabase.rpc('admin_reset_password', {
        target_email: email,
        new_password: newPassword
      });

      if (error) {
        console.error("❌ Password reset RPC error:", error);
        return res.status(500).json({ error: "Failed to reset password. Please try again." });
      }

      if (data && !data.success) {
        return res.status(404).json({ error: data.error || "User not found" });
      }

      // Clean up the OTP entry
      otpStore.delete(email);
      
      console.log(`🔑 Password reset successful for ${email}`);
      
      // Send confirmation email
      if (resend) {
        resend.emails.send({
          from: "Medimentr <onboarding@resend.dev>",
          to: [email],
          subject: "Password Changed Successfully – Medimentr",
          html: emailWrapper("Password Changed", `
            <h2 style="color:#0f172a;font-size:22px;margin:0 0 16px 0;">Password Changed Successfully ✅</h2>
            <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px 0;">
              Your Medimentr account password has been updated. You can now sign in with your new password.
            </p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin:0 0 24px 0;">
              <p style="color:#166534;font-size:13px;margin:0;">
                🔒 If you didn't make this change, please contact us immediately.
              </p>
            </div>
            <div style="text-align:center;">
              <a href="http://localhost:3005" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;text-decoration:none;padding:12px 32px;border-radius:10px;font-weight:600;font-size:14px;">
                Sign In Now
              </a>
            </div>
          `)
        }).catch(err => console.error("Confirmation email failed:", err));
      }

      res.json({ success: true, message: "Password reset successfully" });
    } catch (error: any) {
      console.error("❌ Password reset failed:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN API ROUTES (bypass RLS via SECURITY DEFINER functions)
  // ═══════════════════════════════════════════════════════════════════════════

  app.get("/api/admin/all-users", async (req, res) => {
    try {
      const { data, error } = await supabase.rpc('admin_get_all_users');
      if (error) throw error;
      res.json(data || []);
    } catch (error: any) {
      console.error("❌ admin_get_all_users error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/all-subscriptions", async (req, res) => {
    try {
      const { data, error } = await supabase.rpc('admin_get_all_subscriptions');
      if (error) throw error;
      res.json(data || []);
    } catch (error: any) {
      console.error("❌ admin_get_all_subscriptions error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/all-token-overrides", async (req, res) => {
    try {
      const { data, error } = await supabase.rpc('admin_get_all_token_overrides');
      if (error) throw error;
      res.json(data || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/token-usage-summary", async (req, res) => {
    try {
      const { data, error } = await supabase.rpc('admin_get_token_usage_summary');
      if (error) throw error;
      res.json(data || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/all-token-policies", async (req, res) => {
    try {
      const { data, error } = await supabase.rpc('admin_get_token_policies');
      if (error) throw error;
      res.json(data || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/all-plans", async (req, res) => {
    try {
      const { data, error } = await supabase.rpc('admin_get_all_plans');
      if (error) throw error;
      res.json(data || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/audit-logs", async (req, res) => {
    try {
      const { data, error } = await supabase.rpc('admin_get_audit_logs');
      if (error) throw error;
      res.json(data || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // USER PROFILE & COURSE SELECTION
  // ═══════════════════════════════════════════════════════════════════════════

  // Get user profile (for dashboard course display)
  app.get("/api/user/profile/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { data, error } = await supabaseAdmin
        .from("user_profiles")
        .select("full_name, specialty, selected_course, profession, current_stage")
        .eq("user_id", userId)
        .single();
      if (error) return res.status(400).json({ error: error.message });
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get user profile by email (for dashboard when using custom auth)
  app.get("/api/user/profile-by-email", async (req, res) => {
    try {
      const email = req.query.email as string;
      if (!email) return res.status(400).json({ error: "email is required" });
      
      // Look up user_id from auth.users via email
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      if (authError) return res.status(400).json({ error: authError.message });
      
      const authUser = authData?.users?.find((u: any) => u.email === email);
      if (!authUser) return res.status(404).json({ error: "User not found" });
      
      const { data, error } = await supabaseAdmin
        .from("user_profiles")
        .select("user_id, full_name, specialty, selected_course, profession, current_stage")
        .eq("user_id", authUser.id)
        .single();
      if (error) return res.status(400).json({ error: error.message });
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update selected course
  app.put("/api/user/course", async (req, res) => {
    try {
      const { userId, email, selectedCourse } = req.body;
      if ((!userId && !email) || !selectedCourse) {
        return res.status(400).json({ error: "userId or email, and selectedCourse are required" });
      }
      
      let targetUserId = userId;
      
      // If email provided, look up user_id from auth.users
      if (email && !userId) {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
        if (authError) return res.status(400).json({ error: authError.message });
        
        const authUser = authData?.users?.find((u: any) => u.email === email);
        if (!authUser) return res.status(404).json({ error: "User not found for email" });
        targetUserId = authUser.id;
      }
      
      const { error } = await supabaseAdmin
        .from("user_profiles")
        .update({ selected_course: selectedCourse })
        .eq("user_id", targetUserId);
      if (error) return res.status(400).json({ error: error.message });
      res.json({ success: true, selected_course: selectedCourse });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SESSION MANAGEMENT (Single Device Login Enforcement)
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Check if a user has an active session before login
  app.get("/api/auth/session-status", async (req, res) => {
    try {
      const email = req.query.email as string;
      if (!email) return res.status(400).json({ error: "email is required" });
      
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      if (authError || !authData.users) return res.json({ hasActiveSession: false });
      
      const authUser = authData.users.find((u: any) => u.email === email);
      if (!authUser) return res.json({ hasActiveSession: false });
      
      const { data, error } = await supabaseAdmin
        .from("user_profiles")
        .select("active_session_id")
        .eq("user_id", authUser.id)
        .single();
        
      if (error || !data) return res.json({ hasActiveSession: false });
      
      res.json({ hasActiveSession: !!data.active_session_id, activeSessionId: data.active_session_id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Register a new session after successful login
  app.post("/api/auth/session/register", async (req, res) => {
    try {
      const { email, sessionId, deviceId } = req.body;
      if (!email || !sessionId) return res.status(400).json({ error: "email and sessionId required" });
      
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
      const authUser = authData?.users?.find((u: any) => u.email === email);
      if (!authUser) return res.status(404).json({ error: "User not found" });
      
      const { error } = await supabaseAdmin
        .from("user_profiles")
        .update({ 
          active_session_id: sessionId,
          device_id: deviceId || "unknown",
          last_login_at: new Date().toISOString()
        })
        .eq("user_id", authUser.id);
        
      if (error) return res.status(500).json({ error: error.message });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Validate current session against DB
  app.post("/api/auth/session/validate", async (req, res) => {
    try {
      const { email, sessionId } = req.body;
      if (!email || !sessionId) return res.status(400).json({ error: "email and sessionId required" });
      
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
      const authUser = authData?.users?.find((u: any) => u.email === email);
      if (!authUser) return res.json({ valid: false });
      
      const { data } = await supabaseAdmin
        .from("user_profiles")
        .select("active_session_id")
        .eq("user_id", authUser.id)
        .single();
        
      if (!data) return res.json({ valid: false });
      
      res.json({ valid: data.active_session_id === sessionId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Logout by clearing the active session
  app.post("/api/auth/session/logout", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "email is required" });
      
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
      const authUser = authData?.users?.find((u: any) => u.email === email);
      if (!authUser) return res.json({ success: true });
      
      await supabaseAdmin
        .from("user_profiles")
        .update({ active_session_id: null })
        .eq("user_id", authUser.id);
        
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REFERRAL / AFFILIATE SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════

  // Get a user's referral stats (for dashboard card)
  app.get("/api/referral/stats/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      // Get referral code
      const { data: profile } = await supabase
        .from('user_profiles').select('referral_code').eq('user_id', userId).single();
      
      // If no code, generate one
      let referralCode = profile?.referral_code;
      if (!referralCode) {
        const { data: codeData } = await supabase.rpc('generate_referral_code');
        referralCode = codeData;
        await supabase.from('user_profiles').update({ referral_code: referralCode }).eq('user_id', userId);
      }

      // Count referrals
      const { count: totalReferred } = await supabase
        .from('referrals').select('*', { count: 'exact', head: true }).eq('referrer_user_id', userId);
      
      const { count: totalSubscribed } = await supabase
        .from('referrals').select('*', { count: 'exact', head: true })
        .eq('referrer_user_id', userId).eq('status', 'subscribed');

      // Get rewards
      const { data: rewards } = await supabase
        .from('referral_rewards').select('*').eq('user_id', userId).eq('status', 'active');

      res.json({
        referral_code: referralCode,
        total_referred: totalReferred || 0,
        total_subscribed: totalSubscribed || 0,
        rewards: rewards || []
      });
    } catch (error: any) {
      console.error("❌ referral stats error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Lookup referral code → get referrer user_id
  app.get("/api/referral/lookup/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const { data, error } = await supabase
        .from('user_profiles').select('user_id, full_name').eq('referral_code', code.toUpperCase()).single();
      if (error || !data) return res.json({ found: false });
      res.json({ found: true, referrer_user_id: data.user_id, referrer_name: data.full_name });
    } catch (error: any) {
      res.json({ found: false });
    }
  });

  // Record a new referral (called during sign-up)
  app.post("/api/referral/record", async (req, res) => {
    try {
      const { referrer_user_id, referred_user_id, referral_code, referred_user_email } = req.body;
      const { error } = await supabase.from('referrals').insert({
        referrer_user_id,
        referred_user_id,
        referral_code,
        referred_user_email,
        status: 'signed_up'
      });
      if (error) throw error;
      // Also mark referred_by on the new user's profile
      await supabase.from('user_profiles').update({ referred_by: referrer_user_id }).eq('user_id', referred_user_id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("❌ referral record error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get all affiliate partners (sorted by referral count)
  app.get("/api/admin/referral/all-partners", async (req, res) => {
    try {
      const { data, error } = await supabase.rpc('admin_get_all_referral_partners');
      if (error) throw error;
      res.json(data || []);
    } catch (error: any) {
      console.error("❌ admin referral partners error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get referral summary stats
  app.get("/api/admin/referral/summary", async (req, res) => {
    try {
      const { data, error } = await supabase.rpc('admin_get_referral_summary');
      if (error) throw error;
      res.json(data || {});
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get detailed referrals for a specific user
  app.get("/api/admin/referral/user/:userId", async (req, res) => {
    try {
      const { data, error } = await supabase.rpc('admin_get_user_referrals', { p_user_id: req.params.userId });
      if (error) throw error;
      res.json(data || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Check and grant rewards for a user based on referral thresholds
  app.post("/api/referral/check-rewards/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      const { count: totalSubscribed } = await supabase
        .from('referrals').select('*', { count: 'exact', head: true })
        .eq('referrer_user_id', userId).eq('status', 'subscribed');

      const subs = totalSubscribed || 0;
      const rewards: string[] = [];

      // Check 100 threshold → 1 month premium
      if (subs >= 100) {
        const { data: existing } = await supabase
          .from('referral_rewards').select('id').eq('user_id', userId).eq('threshold_reached', 100);
        if (!existing || existing.length === 0) {
          const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          await supabase.from('referral_rewards').insert({
            user_id: userId, reward_type: 'premium_1_month', threshold_reached: 100, expires_at: expiresAt
          });
          // Upgrade to premium
          await supabase.from('subscriptions')
            .update({ plan_id: 'premium', status: 'active' })
            .eq('user_id', userId);
          rewards.push('premium_1_month');
        }
      }

      // Check 1000 threshold → 1 year premium
      if (subs >= 1000) {
        const { data: existing } = await supabase
          .from('referral_rewards').select('id').eq('user_id', userId).eq('threshold_reached', 1000);
        if (!existing || existing.length === 0) {
          const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
          await supabase.from('referral_rewards').insert({
            user_id: userId, reward_type: 'premium_1_year', threshold_reached: 1000, expires_at: expiresAt
          });
          await supabase.from('subscriptions')
            .update({ plan_id: 'premium', status: 'active' })
            .eq('user_id', userId);
          rewards.push('premium_1_year');
        }
      }

      res.json({ total_subscribed: subs, rewards_granted: rewards });
    } catch (error: any) {
      console.error("❌ reward check error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // API Routes
  app.get("/api/saved", async (req, res) => {
    try {
      const { data, error } = await supabase.from('saved_items').select('*').order('date', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/saved", async (req, res) => {
    const { id, title, content, featureId } = req.body;
    try {
      const { error } = await supabase.from('saved_items').upsert({
        id,
        title,
        content,
        feature_id: featureId
      });
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/saved/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('saved_items').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    const { email, password } = req.body;
    try {
      // For simplicity, mimicking the SQLite insert which stores clear text password for now
      // A better practice is using supabase.auth.signUp() but requires modifying frontend flow
      const { data, error } = await supabase.from('users').insert({ email, password }).select('id').single();
      if (error) throw error;
      res.json({ success: true, userId: data.id });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const { data: user, error } = await supabase.from('users').select('*').eq('email', email).eq('password', password).single();
      if (error || !user) {
        res.status(401).json({ error: "Invalid credentials" });
      } else {
        res.json({ success: true, user });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    try {
      const { data, error } = await supabase.from('users').select('id, email, role, created_at');
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/analytics", async (req, res) => {
    try {
      // In Supabase SQL we'd use grouping or an RPC.
      // Easiest is to fetch all and group in JS, or use a view/rpc.
      // Let's just group in JS for simplicity since it's a small app
      const { data, error } = await supabase.from('usage_logs').select('feature');
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach((log: any) => {
        counts[log.feature] = (counts[log.feature] || 0) + 1;
      });
      const logs = Object.keys(counts).map(feature => ({ feature, count: counts[feature] }));
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/logs", async (req, res) => {
    const { userId, feature } = req.body;
    try {
      const { error } = await supabase.from('usage_logs').insert({ user_id: userId, feature });
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Knowledge & Learning Resources Routes
  app.get("/api/knowledge", async (req, res) => {
    try {
      const { data, error } = await supabase.from('knowledge_library').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/knowledge", async (req, res) => {
    const { id, user_id, title, content, course, paper, section, topic } = req.body;
    try {
      const { error } = await supabase.from('knowledge_library').upsert({
        id, user_id: user_id || 'default', title, content, course, paper, section, topic
      });
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/essays", async (req, res) => {
    try {
      const { data, error } = await supabase.from('essay_library').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/essays", async (req, res) => {
    const { id, user_id, title, content, course, paper, section, topic } = req.body;
    try {
      const { error } = await supabase.from('essay_library').upsert({
        id, user_id: user_id || 'default', title, content, course, paper, section, topic
      });
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/essays/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('essay_library').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/mcqs", async (req, res) => {
    try {
      const { data, error } = await supabase.from('mcq_library').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/mcqs", async (req, res) => {
    const { id, user_id, title, question, options, correct_answer, course, paper, section, topic } = req.body;
    try {
      const { error } = await supabase.from('mcq_library').upsert({
        id, user_id: user_id || 'default', title, question, options, correct_answer, course, paper, section, topic
      });
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/flashcards", async (req, res) => {
    try {
      const { data, error } = await supabase.from('flash_cards').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/flashcards", async (req, res) => {
    const { id, user_id, title, front_content, back_content, course, paper, section, topic } = req.body;
    try {
      const { error } = await supabase.from('flash_cards').upsert({
        id, user_id: user_id || 'default', title, front_content, back_content, course, paper, section, topic
      });
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });



  app.post("/api/question-paper", async (req, res) => {
    const { id, user_id, paper_number, topic, content, date, reference_content } = req.body;
    try {
      // Save to specialized table
      const { error } = await supabase.from('question_paper_generator').upsert({
        id, 
        user_id: user_id || 'default', 
        paper_number, 
        topic, 
        generated_question_paper: content, 
        model_question_paper: reference_content,
        date: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on question_paper_generator upsert:", error);
        throw error;
      }

      // Also save to generic saved_items table so it appears in the Dashboard Library
      const titleText = topic === 'Reference Paper' ? `Reference Paper: ${paper_number || 'N/A'}` : `Question Paper: ${topic || 'Generated'}`;
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: titleText,
        content: content,
        feature_id: 'question-paper',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- STATE MANAGEMENT ROUTES (Replacing LocalStorage) ---

  // Curriculum State
  app.get("/api/state/curriculum/:userId", async (req, res) => {
    try {
      const { data, error } = await supabase.from('user_curriculum')
        .select('*').eq('user_id', req.params.userId).single();
      
      if (error && error.code !== 'PGRST116') throw error; // ignore no-row error
      res.json({ data: data?.data || null });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/state/curriculum", async (req, res) => {
    try {
      const { user_id, data } = req.body;
      const { error } = await supabase.from('user_curriculum').upsert({
        user_id: user_id || 'default',
        data,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Contacts State
  app.get("/api/state/contacts/:userId", async (req, res) => {
    try {
      const { data, error } = await supabase.from('user_contacts')
        .select('*').eq('user_id', req.params.userId).single();
      
      if (error && error.code !== 'PGRST116') throw error;
      res.json({ contacts: data?.contacts || [], personal_card: data?.personal_card || null });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/state/contacts", async (req, res) => {
    try {
      const { user_id, contacts, personal_card } = req.body;
      // Save as JSON blob to user_contacts (original behavior)
      const { error } = await supabase.from('user_contacts').upsert({
        user_id: user_id || 'default',
        contacts: contacts || [],
        personal_card: personal_card || null,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;

      // Also sync each contact to the contacts_management table
      if (contacts && Array.isArray(contacts)) {
        for (const contact of contacts) {
          const contactId = contact.id || `contact-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          const { error: cmError } = await supabase.from('contacts_management').upsert({
            id: contactId,
            user_id: user_id || 'default',
            name: contact.name || '',
            designation: contact.designation || '',
            organization: contact.organization || '',
            email: contact.email || '',
            phone: contact.phone || '',
            website: contact.website || '',
            address: contact.address || '',
            created_at: contact.created_at || new Date().toISOString()
          });
          if (cmError) console.error("Error syncing contact to contacts_management:", cmError);
        }
      }

      // Save personal card to contacts_management as well
      if (personal_card) {
        const { error: pcError } = await supabase.from('contacts_management').upsert({
          id: `personal-card-${user_id || 'default'}`,
          user_id: user_id || 'default',
          name: personal_card.name || 'Your Name',
          designation: personal_card.designation || '',
          organization: personal_card.organization || '',
          email: personal_card.email || '',
          phone: personal_card.phone || '',
          website: personal_card.website || '',
          address: personal_card.address || '',
          created_at: new Date().toISOString()
        });
        if (pcError) console.error("Error syncing personal card to contacts_management:", pcError);
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Thesis Notes Manager State
  app.get("/api/state/thesis-manager/:userId", async (req, res) => {
    try {
      const { data, error } = await supabase.from('user_thesis_data')
        .select('*').eq('user_id', req.params.userId).single();
      
      if (error && error.code !== 'PGRST116') throw error;
      res.json({ 
        projects: data?.projects || [], 
        participants: data?.participants || [],
        collections: data?.collections || [],
        notes: data?.notes || [],
        logs: data?.logs || []
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/state/thesis-manager", async (req, res) => {
    try {
      const { user_id, projects, participants, collections, notes, logs } = req.body;
      const { error } = await supabase.from('user_thesis_data').upsert({
        user_id: user_id || 'default',
        projects: projects || [],
        participants: participants || [],
        collections: collections || [],
        notes: notes || [],
        logs: logs || [],
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/essay-generator", async (req, res) => {
    try {
      const { data, error } = await supabase.from('essay_generator').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/essay-generator", async (req, res) => {
    const { id, user_id, topic, type, content, date } = req.body;
    try {
      // Save to specialized table
      const { error } = await supabase.from('essay_generator').upsert({
        id, 
        user_id: user_id || 'default', 
        topic, 
        type: type || 'long', 
        content, 
        created_at: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on essay_generator upsert:", error);
        throw error;
      }

      // Also save to generic saved_items table so it appears in the Dashboard Library
      const titleText = topic ? `Essay: ${topic}` : `Generated Essay`;
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: titleText,
        content: content,
        feature_id: 'essay-generator',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/seminar-builder", async (req, res) => {
    try {
      const { data, error } = await supabase.from('seminar_builder').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/seminar-builder/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { data, error } = await supabase.from('seminar_builder').select('*').eq('id', id).single();
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/seminar-builder", async (req, res) => {
    const { id, user_id, discipline, topic, ppt_structure, detailed_notes, date, title, content } = req.body;
    try {
      // Save directly to specialized table
      // seminar_builder table has: id, user_id, discipline, topic, ppt_slides (JSONB), detailed_notes, created_at
      const { error } = await supabase.from('seminar_builder').upsert({
        id, 
        user_id: user_id || 'default', 
        discipline, 
        topic,
        ppt_slides: ppt_structure ? JSON.parse(ppt_structure) : null,
        detailed_notes,
        created_at: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on seminar_builder upsert:", error);
        throw error;
      }

      // Also save to generic saved_items table so it appears in the existing generic dashboards
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: title,
        content: content,
        feature_id: 'seminar-builder',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/seminar-builder/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('seminar_builder').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/journal-club", async (req, res) => {
    try {
      const { data, error } = await supabase.from('journal_club').select('*').order('date', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/journal-club/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { data, error } = await supabase.from('journal_club').select('*').eq('id', id).single();
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/journal-club", async (req, res) => {
    const { id, user_id, discipline, topic, criteria, ppt_structure, detailed_notes, date, title, content } = req.body;
    try {
      // Save directly to specialized table
      // journal_club table has: id, user_id, discipline, topic, criteria, ppt_structure (TEXT), detailed_notes, date
      const { error } = await supabase.from('journal_club').upsert({
        id, 
        user_id: user_id || 'default', 
        discipline, 
        topic, 
        criteria, 
        ppt_structure, 
        detailed_notes,
        date: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on journal_club upsert:", error);
        throw error;
      }

      // Also save to generic saved_items table so it appears in the existing generic dashboards
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: title,
        content: content,
        feature_id: 'journal-club',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/journal-club/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('journal_club').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Protocol Generator Routes
  app.get("/api/protocol-generator", async (req, res) => {
    try {
      const { data, error } = await supabase.from('protocol_generator').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/protocol-generator", async (req, res) => {
    const { id, user_id, topic, content, date } = req.body;
    try {
      // Save to specialized protocol_generator table
      const { error } = await supabase.from('protocol_generator').upsert({
        id, 
        user_id: user_id || 'default', 
        topic, 
        content, 
        created_at: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on protocol_generator upsert:", error);
        throw error;
      }

      // Also save to generic saved_items table so it appears in the Dashboard Library
      const titleText = topic ? `Protocol: ${topic}` : `Generated Protocol`;
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: titleText,
        content: content,
        feature_id: 'protocol-generator',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/protocol-generator/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('protocol_generator').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Manuscript Generator Routes
  app.get("/api/manuscript-generator", async (req, res) => {
    try {
      const { data, error } = await supabase.from('manuscript_generator').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/manuscript-generator", async (req, res) => {
    const { id, user_id, topic, content, date } = req.body;
    try {
      const { error } = await supabase.from('manuscript_generator').upsert({
        id, 
        user_id: user_id || 'default', 
        topic, 
        content, 
        created_at: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on manuscript_generator upsert:", error);
        throw error;
      }

      const titleText = topic ? `Manuscript: ${topic}` : `Generated Manuscript`;
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: titleText,
        content: content,
        feature_id: 'manuscript-generator',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/manuscript-generator/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('manuscript_generator').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // StatAssist Routes
  app.get("/api/statassist", async (req, res) => {
    try {
      const { data, error } = await supabase.from('statassist').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/statassist", async (req, res) => {
    const { id, user_id, study_title, methods, results, content, date } = req.body;
    try {
      const { error } = await supabase.from('statassist').upsert({
        id, 
        user_id: user_id || 'default', 
        study_title,
        methods,
        results,
        content,
        created_at: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on statassist upsert:", error);
        throw error;
      }

      const titleText = study_title ? `StatAssist: ${study_title}` : `Statistical Analysis`;
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: titleText,
        content: content,
        feature_id: 'stat-assist',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/statassist/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('statassist').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // AI Exam Preparation System Routes
  app.get("/api/ai-exam-prep", async (req, res) => {
    try {
      const { data, error } = await supabase.from('ai_exam_preparation_system').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai-exam-prep", async (req, res) => {
    const { id, user_id, course_id, analytics, content, date } = req.body;
    try {
      const { error } = await supabase.from('ai_exam_preparation_system').upsert({
        id, 
        user_id: user_id || 'default', 
        course_id,
        analytics: analytics || null,
        created_at: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on ai_exam_preparation_system upsert:", error);
        throw error;
      }

      // Also save to generic saved_items table so it appears in the Dashboard Library
      const titleText = course_id ? `Exam Prep: ${course_id}` : `Exam Preparation System`;
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: titleText,
        content: content || JSON.stringify(analytics),
        feature_id: 'ai-exam-prep',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/ai-exam-prep/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('ai_exam_preparation_system').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Resume Builder Routes
  app.get("/api/resume-builder", async (req, res) => {
    try {
      const { data, error } = await supabase.from('resume_builder').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/resume-builder", async (req, res) => {
    const { 
      id, user_id, full_name, professional_title, email, phone, location, linkedin, summary,
      education, experience, skills, publications, certifications, awards, memberships, conferences,
      selected_template, date, title, content 
    } = req.body;
    try {
      const { error } = await supabase.from('resume_builder').upsert({
        id, 
        user_id: user_id || 'default', 
        full_name,
        professional_title,
        email,
        phone,
        location,
        linkedin,
        summary,
        education,
        experience,
        skills,
        publications,
        certifications,
        awards,
        memberships,
        conferences,
        selected_template,
        created_at: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on resume_builder upsert:", error);
        throw error;
      }

      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: title || `Resume: ${full_name}`,
        content: content,
        feature_id: 'resume-builder',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/resume-builder/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('resume_builder').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reflection Generator Routes
  app.get("/api/reflection-generator", async (req, res) => {
    try {
      const { data, error } = await supabase.from('reflection_generator').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/reflection-generator", async (req, res) => {
    const { id, user_id, subject, topic, content, date } = req.body;
    try {
      const { error } = await supabase.from('reflection_generator').upsert({
        id, 
        user_id: user_id || 'default', 
        subject,
        topic, 
        content, 
        created_at: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on reflection_generator upsert:", error);
        throw error;
      }

      // Also save to generic saved_items table so it appears in the Dashboard Library
      const titleText = topic ? `Reflection: ${topic}` : `Generated Reflection`;
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: titleText,
        content: content,
        feature_id: 'reflection-generator',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/reflection-generator/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('reflection_generator').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Clinical Decision Support System Routes
  app.get("/api/clinical-decision-support", async (req, res) => {
    try {
      const { data, error } = await supabase.from('clinical_decision_support_system').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/clinical-decision-support", async (req, res) => {
    const { id, user_id, patient_data, recommendations, date } = req.body;
    try {
      const { error } = await supabase.from('clinical_decision_support_system').upsert({
        id,
        user_id: user_id || 'default',
        patient_data,
        recommendations,
        created_at: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on clinical_decision_support_system upsert:", error);
        throw error;
      }

      // Also save to generic saved_items table
      const titleText = `Clinical Decision Support`;
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: titleText,
        content: recommendations,
        feature_id: 'clinical-decision-support',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/clinical-decision-support/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('clinical_decision_support_system').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Blog Publications Routes
  app.get("/api/blog-publications", async (req, res) => {
    try {
      const { data, error } = await supabase.from('blog_publications').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/blog-publications", async (req, res) => {
    const { id, user_id, title, category, excerpt, content, hashtags, date, views, image_src, status } = req.body;
    try {
      const { error } = await supabase.from('blog_publications').upsert({
        id: id || `blog-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        user_id: user_id || 'default',
        title,
        category: category || 'Education',
        excerpt: excerpt || '',
        content: content || '',
        hashtags: hashtags || '',
        date: date || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        views: views || 0,
        image_src: image_src || '',
        status: status || 'published',
        updated_at: new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on blog_publications upsert:", error);
        throw error;
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/blog-publications/:id", async (req, res) => {
    const { id } = req.params;
    const { title, category, excerpt, content, hashtags, date, views, image_src, status } = req.body;
    try {
      const { error } = await supabase.from('blog_publications').update({
        title, category, excerpt, content, hashtags, date, views, image_src, status,
        updated_at: new Date().toISOString()
      }).eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/blog-publications/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('blog_publications').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Doubt Solver Routes
  app.get("/api/doubt-solver", async (req, res) => {
    try {
      const { data, error } = await supabase.from('doubt_solver').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/doubt-solver", async (req, res) => {
    const { id, user_id, topic, style, depth, explanation, date } = req.body;
    try {
      const { error } = await supabase.from('doubt_solver').upsert({
        id,
        user_id: user_id || 'default',
        topic,
        style,
        depth,
        explanation,
        title: `Doubt: ${(topic || '').slice(0, 60)}`,
        content: explanation,
        feature_id: 'doubt-solver',
        created_at: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on doubt_solver upsert:", error);
        throw error;
      }

      // Also save to generic saved_items table so it appears in the Dashboard Library
      const titleText = topic ? `Doubt: ${topic.slice(0, 60)}` : `Doubt Solver`;
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: titleText,
        content: explanation,
        feature_id: 'doubt-solver',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/doubt-solver/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('doubt_solver').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Resume Builder Routes
  app.get("/api/resume-builder", async (req, res) => {
    try {
      const { data, error } = await supabase.from('resume_builder').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/resume-builder", async (req, res) => {
    const { id, user_id, full_name, professional_title, email, phone, location, linkedin, summary,
            education, experience, skills, publications, certifications, awards, memberships, conferences,
            selected_template, title, content, feature_id, date } = req.body;
    try {
      // Save to dedicated resume_builder table
      const { error } = await supabase.from('resume_builder').upsert({
        id,
        user_id: user_id || 'default',
        full_name: full_name || '',
        professional_title: professional_title || '',
        email: email || '',
        phone: phone || '',
        location: location || '',
        linkedin: linkedin || '',
        summary: summary || '',
        education: education || [],
        experience: experience || [],
        skills: skills || [],
        publications: publications || [],
        certifications: certifications || [],
        awards: awards || [],
        memberships: memberships || [],
        conferences: conferences || [],
        selected_template: selected_template || 'classic',
        title: title || `Resume: ${full_name}`,
        content: content || '',
        feature_id: feature_id || 'resume-builder',
        created_at: date || new Date().toISOString()
      });
      if (error) throw error;

      // Also save to saved_items for dashboard library
      await supabase.from('saved_items').upsert({
        id,
        title: title || `Resume: ${full_name}`,
        content: content || '',
        feature_id: feature_id || 'resume-builder',
        date: date || new Date().toISOString()
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/resume-builder/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('resume_builder').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Scientific Session Search Routes
  app.get("/api/scientific-session-search", async (req, res) => {
    try {
      const { data, error } = await supabase.from('scientific_session_search').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/scientific-session-search", async (req, res) => {
    const { id, user_id, subject, topic, region, month, results, date, title, content, featureId } = req.body;
    try {
      // Save to dedicated table
      const { error } = await supabase.from('scientific_session_search').upsert({
        id,
        user_id: user_id || 'default',
        subject: subject || '',
        topic: topic || '',
        region: region || '',
        month: month || '',
        results: typeof results === 'string' ? results : JSON.stringify(results),
        created_at: date || new Date().toISOString()
      });
      if (error) throw error;

      // Also save to saved_items for dashboard library
      await supabase.from('saved_items').upsert({
        id,
        title: title || `Session Search: ${subject}`,
        content: content || (typeof results === 'string' ? results : JSON.stringify(results)),
        feature_id: featureId || 'session-search',
        date: date || new Date().toISOString()
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/scientific-session-search/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('scientific_session_search').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Contacts Management Routes
  app.get("/api/contacts-management", async (req, res) => {
    try {
      const { data, error } = await supabase.from('contacts_management').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/contacts-management", async (req, res) => {
    const { id, user_id, name, designation, organization, email, phone, website, address } = req.body;
    try {
      const { error } = await supabase.from('contacts_management').upsert({
        id,
        user_id: user_id || 'default',
        name,
        designation,
        organization,
        email,
        phone,
        website,
        address,
        created_at: new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on contacts_management upsert:", error);
        throw error;
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/contacts-management/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('contacts_management').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // State route for contacts (saves all contacts + personal card, and syncs to contacts_management table)
  app.get("/api/state/contacts/:userId", async (req, res) => {
    try {
      const { data, error } = await supabase.from('contacts_management').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      // Return contacts in the shape the frontend expects
      const contacts = (data || []).filter((c: any) => c.designation !== '__personal_card__');
      const personalCardRow = (data || []).find((c: any) => c.designation === '__personal_card__');
      const personal_card = personalCardRow ? {
        name: personalCardRow.name,
        designation: personalCardRow.organization ? personalCardRow.name : 'Medical Professional',
        organization: personalCardRow.organization,
        email: personalCardRow.email,
        phone: personalCardRow.phone,
        website: personalCardRow.website,
        address: personalCardRow.address
      } : null;
      res.json({ contacts, personal_card });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/state/contacts", async (req, res) => {
    const { user_id, contacts, personal_card } = req.body;
    try {
      // Save each contact individually to contacts_management table
      if (contacts && Array.isArray(contacts)) {
        for (const contact of contacts) {
          const contactId = contact.id || `contact-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          const { error } = await supabase.from('contacts_management').upsert({
            id: contactId,
            user_id: user_id || 'default',
            name: contact.name || '',
            designation: contact.designation || '',
            organization: contact.organization || '',
            email: contact.email || '',
            phone: contact.phone || '',
            website: contact.website || '',
            address: contact.address || '',
            created_at: contact.created_at || new Date().toISOString()
          });
          if (error) {
            console.error("Error upserting contact:", contactId, error);
          } else {
            console.log("Contact saved:", contactId, contact.name);
          }
        }
      }

      // Save personal card as a special entry
      if (personal_card) {
        const { error } = await supabase.from('contacts_management').upsert({
          id: `personal-card-${user_id || 'default'}`,
          user_id: user_id || 'default',
          name: personal_card.name || 'Your Name',
          designation: '__personal_card__',
          organization: personal_card.organization || '',
          email: personal_card.email || '',
          phone: personal_card.phone || '',
          website: personal_card.website || '',
          address: personal_card.address || '',
          created_at: new Date().toISOString()
        });
        if (error) {
          console.error("Error upserting personal card:", error);
        } else {
          console.log("Personal card saved");
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error saving contacts state:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Digital Diary Routes
  app.get("/api/digital-diary", async (req, res) => {
    try {
      const { data, error } = await supabase.from('digital_diary').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/digital-diary", async (req, res) => {
    const { id, user_id, entry_date, content, action_items, date } = req.body;
    try {
      const { error } = await supabase.from('digital_diary').upsert({
        id,
        user_id: user_id || 'default',
        entry_date: entry_date || new Date().toISOString(),
        content,
        action_items,
        created_at: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on digital_diary upsert:", error);
        throw error;
      }

      // Also save to generic saved_items table so it appears in the Dashboard Library
      const titleText = `Diary: ${new Date(entry_date || date || Date.now()).toLocaleDateString()}`;
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: titleText,
        content,
        feature_id: 'digital-diary',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/digital-diary/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('digital_diary').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Drug Treatment Assistant Routes
  app.get("/api/drug-treatment-assistant", async (req, res) => {
    try {
      const { data, error } = await supabase.from('drug_treatment_assistant').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/drug-treatment-assistant", async (req, res) => {
    const { id, user_id, query, drug_name, condition, patient_context, mode, style, response, date } = req.body;
    try {
      const titleText = `Drug: ${(query || drug_name || 'Untitled').slice(0, 60)}`;
      const { error } = await supabase.from('drug_treatment_assistant').upsert({
        id,
        user_id: user_id || 'default',
        query,
        drug_name,
        condition,
        patient_context,
        mode,
        style,
        response,
        title: titleText,
        content: response,
        feature_id: 'drug-treatment-assistant',
        created_at: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on drug_treatment_assistant upsert:", error);
        throw error;
      }

      // Also save to generic saved_items table so it appears in the Dashboard Library
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: titleText,
        content: response,
        feature_id: 'drug-treatment-assistant',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/drug-treatment-assistant/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('drug_treatment_assistant').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Saved Guidelines Routes
  app.get("/api/guidelines/saved", async (req, res) => {
    try {
      const { data, error } = await supabase.from('saved_guidelines').select('*').order('savedAt', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/guidelines/saved", async (req, res) => {
    const { id, userId, conditionName, title, organization, publicationYear, sourceUrl, category, summary, notes } = req.body;
    try {
      const { error } = await supabase.from('saved_guidelines').upsert({
        id,
        userId: userId || 'default',
        conditionName,
        title,
        organization,
        publicationYear,
        sourceUrl,
        category,
        summary,
        notes
      });
      if (error) {
        console.error("Supabase Error on saved_guidelines upsert:", error);
        throw error;
      }

      // Also save to generic saved_items table
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: `Guideline: ${title}`,
        content: summary || '',
        feature_id: 'guidelines-generator',
        date: new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/guidelines/saved/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('saved_guidelines').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Prescription Analyser Routes
  app.get("/api/prescription-analyser", async (req, res) => {
    try {
      const { data, error } = await supabase.from('prescription_analyser').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/prescription-analyser", async (req, res) => {
    const { id, user_id, prescription_data, analysis, date } = req.body;
    try {
      const { error } = await supabase.from('prescription_analyser').upsert({
        id,
        user_id: user_id || 'default',
        prescription_data,
        analysis,
        created_at: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on prescription_analyser upsert:", error);
        throw error;
      }

      // Also save to generic saved_items table so it appears in the Dashboard Library
      const titleText = `Prescription Analysis`;
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: titleText,
        content: analysis,
        feature_id: 'prescription-analyser',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/prescription-analyser/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('prescription_analyser').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Knowledge Analyser (Essay) Routes
  app.get("/api/knowledge-analyser-essay", async (req, res) => {
    try {
      const { data, error } = await supabase.from('knowledge_analyser_essay').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/knowledge-analyser-essay", async (req, res) => {
    const { id, user_id, subject, topic, questions, evaluation, content, date } = req.body;
    try {
      const { error } = await supabase.from('knowledge_analyser_essay').upsert({
        id,
        user_id: user_id || 'default',
        subject,
        topic,
        questions: questions || null,
        evaluation: evaluation || null,
        created_at: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on knowledge_analyser_essay upsert:", error);
        throw error;
      }

      // Also save to generic saved_items table
      const titleText = subject ? `Essay Analysis: ${subject}` : `Essay Analysis`;
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: titleText,
        content: content || `Analysis for ${subject} - ${topic}`,
        feature_id: 'answer-analyser',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/knowledge-analyser-essay/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('knowledge_analyser_essay').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Knowledge Analyser (MCQs) Routes
  app.get("/api/knowledge-analyser-mcqs", async (req, res) => {
    try {
      const { data, error } = await supabase.from('knowledge_analyser_mcqs').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/knowledge-analyser-mcqs", async (req, res) => {
    const { id, user_id, subject, topic, mcqs, evaluation, content, date } = req.body;
    try {
      const { error } = await supabase.from('knowledge_analyser_mcqs').upsert({
        id,
        user_id: user_id || 'default',
        subject,
        topic,
        mcqs: mcqs || null,
        evaluation: evaluation || null,
        created_at: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on knowledge_analyser_mcqs upsert:", error);
        throw error;
      }

      // Also save to generic saved_items table
      const titleText = subject ? `MCQ Analysis: ${subject} - ${topic}` : `MCQ Analysis`;
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: titleText,
        content: content || `MCQ Analysis for ${subject} - ${topic}`,
        feature_id: 'mcqs-analyser',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/knowledge-analyser-mcqs/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('knowledge_analyser_mcqs').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // AI Exam Simulator Routes
  app.get("/api/ai-exam-simulator", async (req, res) => {
    try {
      const { data, error } = await supabase.from('ai_exam_simulator').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai-exam-simulator", async (req, res) => {
    const { id, user_id, subject, paper, topics, questions, evaluation, content, date } = req.body;
    try {
      const { error } = await supabase.from('ai_exam_simulator').upsert({
        id,
        user_id: user_id || 'default',
        subject,
        paper: paper || null,
        topics: topics || null,
        questions: questions || null,
        evaluation: evaluation || null,
        created_at: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on ai_exam_simulator upsert:", error);
        throw error;
      }

      // Also save to generic saved_items table
      const titleText = subject ? `Exam Simulation: ${subject}${paper ? ' - ' + paper : ''}` : `Exam Simulation`;
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: titleText,
        content: content || `Exam Simulation for ${subject} - ${topics}`,
        feature_id: 'ai-exam-simulator',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/ai-exam-simulator/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('ai_exam_simulator').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Guidelines Generator Routes
  app.get("/api/guidelines/saved", async (req, res) => {
    try {
      const { data, error } = await supabase.from('saved_guidelines').select('*').order('savedAt', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/guidelines/saved", async (req, res) => {
    const { 
      id, userId, conditionName, title, organization, 
      publicationYear, sourceUrl, category, summary, notes 
    } = req.body;
    try {
      const { error } = await supabase.from('saved_guidelines').upsert({
        id, 
        userId: userId || 'default', 
        conditionName, 
        title, 
        organization, 
        publicationYear, 
        sourceUrl, 
        category, 
        summary, 
        notes
      });
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/guidelines/saved/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('saved_guidelines').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Clinical Examination System Routes
  app.post("/api/clinical-exam/start", async (req, res) => {
    const { id, userId, specialty, subspecialty, examType, caseData } = req.body;
    try {
      const { error } = await supabase.from('clinical_exam_sessions').insert({
        id, 
        user_id: userId || 'default', 
        specialty, 
        subspecialty, 
        exam_type: examType, 
        case_data: JSON.stringify(caseData), 
        status: 'in_progress'
      });
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/clinical-exam/interact", async (req, res) => {
    const { id, sessionId, step, userInput, aiResponse } = req.body;
    try {
      const { error } = await supabase.from('clinical_exam_interactions').insert({
        id, 
        session_id: sessionId, 
        step, 
        user_input: userInput, 
        ai_response: aiResponse
      });
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/clinical-exam/submit", async (req, res) => {
    const { sessionId, scores, totalScore, feedback, recommendations } = req.body;
    try {
      const { error: sessionError } = await supabase.from('clinical_exam_sessions')
        .update({ status: 'completed', end_time: new Date().toISOString() })
        .eq('id', sessionId);
      if (sessionError) throw sessionError;
      
      const { error: evalError } = await supabase.from('clinical_exam_evaluations').insert({
        id: `eval_${sessionId}`, 
        session_id: sessionId, 
        scores: JSON.stringify(scores), 
        total_score: totalScore, 
        feedback: JSON.stringify(feedback), 
        recommendations: JSON.stringify(recommendations)
      });
      if (evalError) throw evalError;
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/clinical-exam/results/:sessionId", async (req, res) => {
    const { sessionId } = req.params;
    try {
      const { data: evaluation } = await supabase.from('clinical_exam_evaluations').select('*').eq('session_id', sessionId).single();
      const { data: session } = await supabase.from('clinical_exam_sessions').select('*').eq('id', sessionId).single();
      const { data: interactions } = await supabase.from('clinical_exam_interactions').select('*').eq('session_id', sessionId).order('timestamp', { ascending: true });
      
      res.json({ 
        success: true, 
        session,
        evaluation: evaluation ? {
          ...evaluation,
          scores: JSON.parse(evaluation.scores),
          feedback: JSON.parse(evaluation.feedback),
          recommendations: JSON.parse(evaluation.recommendations)
        } : null,
        interactions 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Clinical Examination System Routes
  app.get("/api/clinical-examination-system", async (req, res) => {
    try {
      const { data, error } = await supabase.from('clinical_examination_system').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/clinical-examination-system", async (req, res) => {
    const { id, user_id, specialty, exam_type, case_data, history_log, examination_log, investigation_log, diagnosis_text, management_text, viva_qas, final_report, total_score, content, date } = req.body;
    try {
      const { error } = await supabase.from('clinical_examination_system').upsert({
        id,
        user_id: user_id || 'default',
        specialty,
        exam_type,
        case_data: case_data || null,
        history_log: history_log || null,
        examination_log: examination_log || null,
        investigation_log: investigation_log || null,
        diagnosis_text: diagnosis_text || null,
        management_text: management_text || null,
        viva_qas: viva_qas || null,
        final_report: final_report || null,
        total_score: total_score || null,
        created_at: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on clinical_examination_system upsert:", error);
        throw error;
      }

      // Also save to generic saved_items table
      const titleText = `Clinical Exam: ${specialty || 'General'} - ${exam_type || 'OSCE'}`;
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: titleText,
        content: content || `Clinical Examination for ${specialty} - Score: ${total_score || 'N/A'}`,
        feature_id: 'clinical-examination',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/clinical-examination-system/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('clinical_examination_system').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== Blog Publications API ==========
  // GET all blog posts
  app.get("/api/blog-publications", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('blog_publications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data || []);
    } catch (error: any) {
      console.error('Error fetching blog publications:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // POST create a new blog post
  app.post("/api/blog-publications", async (req, res) => {
    try {
      const { id, title, category, excerpt, content, hashtags, date, views, image_src, imageSrc, status } = req.body;
      const postData = {
        id: id || `blog-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title,
        category: category || 'Education',
        excerpt: excerpt || '',
        content: content || '',
        hashtags: hashtags || '',
        date: date || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        views: views || 0,
        image_src: image_src || imageSrc || '',
        status: status || 'published',
      };
      const { data, error } = await supabase
        .from('blog_publications')
        .upsert(postData, { onConflict: 'id' })
        .select()
        .single();
      if (error) throw error;
      console.log('✅ Blog post saved to Supabase:', postData.title);
      res.json(data);
    } catch (error: any) {
      console.error('Error saving blog post:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // PUT update an existing blog post
  app.put("/api/blog-publications/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { title, category, excerpt, content, hashtags, date, views, image_src, imageSrc, status } = req.body;
      const updateData: any = { updated_at: new Date().toISOString() };
      if (title !== undefined) updateData.title = title;
      if (category !== undefined) updateData.category = category;
      if (excerpt !== undefined) updateData.excerpt = excerpt;
      if (content !== undefined) updateData.content = content;
      if (hashtags !== undefined) updateData.hashtags = hashtags;
      if (date !== undefined) updateData.date = date;
      if (views !== undefined) updateData.views = views;
      if (image_src !== undefined) updateData.image_src = image_src;
      else if (imageSrc !== undefined) updateData.image_src = imageSrc;
      if (status !== undefined) updateData.status = status;
      
      const { data, error } = await supabase
        .from('blog_publications')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      console.log('✅ Blog post updated in Supabase:', id);
      res.json(data);
    } catch (error: any) {
      console.error('Error updating blog post:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE a blog post
  app.delete("/api/blog-publications/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase
        .from('blog_publications')
        .delete()
        .eq('id', id);
      if (error) throw error;
      console.log('🗑️ Blog post deleted from Supabase:', id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting blog post:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // EMAIL ROUTES (Resend)
  // ═══════════════════════════════════════════════════════════════════════════

  // Helper: Medimentr branded email HTML wrapper
  const emailWrapper = (title: string, bodyContent: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;font-size:28px;margin:0 0 4px 0;font-weight:800;letter-spacing:-0.5px;">Medimentr</h1>
              <p style="color:#94a3b8;font-size:13px;margin:0;letter-spacing:1px;text-transform:uppercase;">AI-Powered Medical Education</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${bodyContent}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="color:#94a3b8;font-size:12px;margin:0 0 4px 0;">© ${new Date().getFullYear()} Medimentr. All rights reserved.</p>
              <p style="color:#cbd5e1;font-size:11px;margin:0;">AI-generated content is for educational purposes only and should not replace clinical judgment.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // 1. Welcome Email - sent on new user registration
  app.post("/api/email/welcome", async (req, res) => {
    if (!resend) return res.status(503).json({ error: "Email service not configured" });
    
    const { to, name } = req.body;
    if (!to) return res.status(400).json({ error: "Recipient email is required" });

    const userName = name || "Doctor";
    
    try {
      const { data, error } = await resend.emails.send({
        from: "Medimentr <onboarding@resend.dev>",
        to: [to],
        subject: `Welcome to Medimentr, ${userName}! 🎓`,
        html: emailWrapper("Welcome to Medimentr", `
          <h2 style="color:#0f172a;font-size:22px;margin:0 0 16px 0;">Welcome aboard, ${userName}! 🎉</h2>
          <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px 0;">
            Thank you for joining <strong>Medimentr</strong> — your AI-powered companion for medical education and clinical excellence.
          </p>
          
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin:0 0 24px 0;">
            <p style="color:#166534;font-size:14px;font-weight:700;margin:0 0 8px 0;">🎁 Your Free Trial is Active!</p>
            <p style="color:#15803d;font-size:13px;margin:0;line-height:1.6;">
              You have <strong>15 days</strong> of full access to explore all premium features including AI-powered study notes, exam prep, clinical tools, and more.
            </p>
          </div>

          <p style="color:#475569;font-size:14px;font-weight:600;margin:0 0 12px 0;">Here's what you can do:</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
            ${[
              ["📚", "LMS Notes & Flashcards", "AI-generated study materials for any medical topic"],
              ["🧠", "AI Exam Preparation", "Practice MCQs with intelligent feedback"],
              ["📝", "Thesis & Research Tools", "Protocol generator, manuscript builder, statistical analysis"],
              ["💊", "Clinical Decision Support", "Evidence-based guidelines and drug interaction checks"],
              ["🎯", "Seminar & Journal Club", "AI-powered presentation builder with detailed notes"]
            ].map(([icon, title, desc]) => `
              <tr>
                <td style="padding:8px 0;vertical-align:top;width:32px;">
                  <span style="font-size:18px;">${icon}</span>
                </td>
                <td style="padding:8px 0 8px 12px;">
                  <p style="color:#1e293b;font-size:14px;font-weight:600;margin:0;">${title}</p>
                  <p style="color:#64748b;font-size:13px;margin:2px 0 0 0;">${desc}</p>
                </td>
              </tr>
            `).join("")}
          </table>

          <div style="text-align:center;margin:32px 0 16px 0;">
            <a href="http://localhost:3005" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;text-decoration:none;padding:14px 40px;border-radius:12px;font-weight:700;font-size:15px;box-shadow:0 4px 14px rgba(59,130,246,0.3);">
              Start Exploring Medimentr →
            </a>
          </div>
          
          <p style="color:#94a3b8;font-size:13px;text-align:center;margin:24px 0 0 0;">
            Need help? Simply reply to this email or use the AI Mentor chat in the app.
          </p>
        `)
      });

      if (error) {
        console.error("❌ Resend welcome email error:", error);
        return res.status(500).json({ error: error.message });
      }
      console.log("📧 Welcome email sent to:", to, "| ID:", data?.id);
      res.json({ success: true, emailId: data?.id });
    } catch (error: any) {
      console.error("❌ Email send failed:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // 2. Share Content via Email
  app.post("/api/email/share", async (req, res) => {
    if (!resend) return res.status(503).json({ error: "Email service not configured" });

    const { to, subject, contentTitle, contentBody, senderName } = req.body;
    if (!to || !contentTitle) return res.status(400).json({ error: "Recipient and content are required" });

    try {
      const { data, error } = await resend.emails.send({
        from: "Medimentr <onboarding@resend.dev>",
        to: Array.isArray(to) ? to : [to],
        subject: subject || `${senderName || "A colleague"} shared "${contentTitle}" with you`,
        html: emailWrapper("Shared Content", `
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px 20px;margin:0 0 20px 0;">
            <p style="color:#1e40af;font-size:13px;margin:0;">
              📤 <strong>${senderName || "A colleague"}</strong> shared this with you via Medimentr
            </p>
          </div>
          
          <h2 style="color:#0f172a;font-size:20px;margin:0 0 16px 0;">${contentTitle}</h2>
          
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin:0 0 24px 0;">
            <div style="color:#334155;font-size:14px;line-height:1.8;white-space:pre-line;">${contentBody || "No content preview available."}</div>
          </div>
          
          <div style="text-align:center;">
            <a href="http://localhost:3005" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:12px 32px;border-radius:10px;font-weight:600;font-size:14px;">
              Open in Medimentr
            </a>
          </div>
        `)
      });

      if (error) {
        console.error("❌ Resend share email error:", error);
        return res.status(500).json({ error: error.message });
      }
      console.log("📧 Content shared via email to:", to, "| ID:", data?.id);
      res.json({ success: true, emailId: data?.id });
    } catch (error: any) {
      console.error("❌ Share email failed:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // 3. Contact / Feedback Form Email
  app.post("/api/email/contact", async (req, res) => {
    if (!resend) return res.status(503).json({ error: "Email service not configured" });

    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: "Name, email, and message are required" });

    try {
      // Send notification to admin
      const { data, error } = await resend.emails.send({
        from: "Medimentr Contact <onboarding@resend.dev>",
        to: ["onboarding@resend.dev"], // Replace with your own admin email once domain is verified
        replyTo: email,
        subject: subject || `Contact Form: ${name}`,
        html: emailWrapper("Contact Form Submission", `
          <h2 style="color:#0f172a;font-size:20px;margin:0 0 20px 0;">📩 New Contact Form Submission</h2>
          
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
            ${[
              ["Name", name],
              ["Email", email],
              ["Subject", subject || "General Inquiry"]
            ].map(([label, value]) => `
              <tr>
                <td style="padding:8px 0;color:#64748b;font-size:13px;font-weight:600;width:100px;vertical-align:top;">${label}:</td>
                <td style="padding:8px 0;color:#1e293b;font-size:14px;">${value}</td>
              </tr>
            `).join("")}
          </table>
          
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:0 0 16px 0;">
            <p style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px 0;">Message</p>
            <p style="color:#334155;font-size:14px;line-height:1.7;margin:0;white-space:pre-line;">${message}</p>
          </div>
        `)
      });

      if (error) {
        console.error("❌ Resend contact email error:", error);
        return res.status(500).json({ error: error.message });
      }

      // Send confirmation to user
      await resend.emails.send({
        from: "Medimentr <onboarding@resend.dev>",
        to: [email],
        subject: "We received your message – Medimentr",
        html: emailWrapper("Message Received", `
          <h2 style="color:#0f172a;font-size:20px;margin:0 0 16px 0;">Thanks for reaching out, ${name}! 👋</h2>
          <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 16px 0;">
            We've received your message and will get back to you as soon as possible.
          </p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin:0 0 16px 0;">
            <p style="color:#166534;font-size:13px;margin:0;">Your message: "${message.substring(0, 200)}${message.length > 200 ? '...' : ''}"</p>
          </div>
          <p style="color:#94a3b8;font-size:13px;margin:0;">
            In the meantime, feel free to explore the AI Mentor chat in the app for immediate assistance.
          </p>
        `)
      });

      console.log("📧 Contact email processed from:", email, "| ID:", data?.id);
      res.json({ success: true, emailId: data?.id });
    } catch (error: any) {
      console.error("❌ Contact email failed:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // 4. Generic Send Email (for custom use cases)
  app.post("/api/email/send", async (req, res) => {
    if (!resend) return res.status(503).json({ error: "Email service not configured" });

    const { to, subject, html, text } = req.body;
    if (!to || !subject) return res.status(400).json({ error: "Recipient and subject are required" });

    try {
      const { data, error } = await resend.emails.send({
        from: "Medimentr <onboarding@resend.dev>",
        to: Array.isArray(to) ? to : [to],
        subject,
        html: html || emailWrapper(subject, `<p style="color:#334155;font-size:14px;line-height:1.7;">${text || ""}</p>`),
      });

      if (error) {
        console.error("❌ Resend email error:", error);
        return res.status(500).json({ error: error.message });
      }
      console.log("📧 Email sent to:", to, "| ID:", data?.id);
      res.json({ success: true, emailId: data?.id });
    } catch (error: any) {
      console.error("❌ Email send failed:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // 5. Trial Expiry Reminder Email
  app.post("/api/email/trial-reminder", async (req, res) => {
    if (!resend) return res.status(503).json({ error: "Email service not configured" });

    const { to, name, daysLeft } = req.body;
    if (!to) return res.status(400).json({ error: "Recipient email is required" });

    const userName = name || "Doctor";
    const days = daysLeft || 3;

    try {
      const { data, error } = await resend.emails.send({
        from: "Medimentr <onboarding@resend.dev>",
        to: [to],
        subject: `⏰ Your Medimentr trial expires in ${days} day${days > 1 ? 's' : ''}`,
        html: emailWrapper("Trial Expiring Soon", `
          <h2 style="color:#0f172a;font-size:22px;margin:0 0 16px 0;">Hi ${userName}, your trial is ending soon ⏰</h2>
          <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px 0;">
            Your free trial of Medimentr will expire in <strong>${days} day${days > 1 ? 's' : ''}</strong>. 
            Upgrade now to keep access to all your saved content and premium AI features.
          </p>
          
          <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:12px;padding:20px;margin:0 0 24px 0;">
            <p style="color:#92400e;font-size:14px;font-weight:600;margin:0 0 8px 0;">⚡ What you'll lose without upgrading:</p>
            <ul style="color:#78350f;font-size:13px;margin:0;padding:0 0 0 20px;line-height:1.8;">
              <li>AI-powered study note generation</li>
              <li>Exam preparation with smart MCQs</li>
              <li>Research tools (thesis, protocol, manuscript)</li>
              <li>Clinical decision support & guidelines</li>
            </ul>
          </div>

          <div style="text-align:center;margin:32px 0 16px 0;">
            <a href="http://localhost:3005" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;text-decoration:none;padding:14px 40px;border-radius:12px;font-weight:700;font-size:15px;box-shadow:0 4px 14px rgba(245,158,11,0.3);">
              Upgrade Now →
            </a>
          </div>
        `)
      });

      if (error) {
        console.error("❌ Resend trial reminder error:", error);
        return res.status(500).json({ error: error.message });
      }
      console.log("📧 Trial reminder sent to:", to, "| ID:", data?.id);
      res.json({ success: true, emailId: data?.id });
    } catch (error: any) {
      console.error("❌ Trial reminder failed:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BLOG OG META TAGS ROUTE (for Social Media Sharing)
  // ═══════════════════════════════════════════════════════════════════════════
  app.get("/blog/:id", async (req, res) => {
    const { id } = req.params;
    const siteUrl = "https://www.medimentr.com";
    
    try {
      // Fetch the blog post from Supabase
      const { data: post, error } = await supabase
        .from('blog_publications')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !post) {
        // Fallback: redirect to blog page
        return res.redirect(`${siteUrl}/blog`);
      }

      const title = post.title || "MediMentr Blog";
      const description = (post.excerpt || post.title || "Read the latest on MediMentr").substring(0, 200);
      const image = post.image_src || post.imageSrc || `${siteUrl}/og-default.png`;
      const blogUrl = `${siteUrl}/blog/${id}`;
      const hashtags = (post.hashtags || '').split(/\s+/).filter(Boolean).slice(0, 5).join(' ');

      // Serve an HTML page with OG meta tags for social media crawlers
      // Humans get auto-redirected to the SPA
      res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} | MediMentr</title>
  <meta name="description" content="${description} — Explore MediMentr: AI-Powered Medical Education" />

  <!-- Open Graph / Facebook / LinkedIn / WhatsApp -->
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${blogUrl}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description} — Explore MediMentr: AI-Powered Medical Education Platform for Medical Professionals" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="MediMentr" />
  <meta property="article:published_time" content="${post.created_at || new Date().toISOString()}" />
  <meta property="article:section" content="${post.category || 'Medical Education'}" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${blogUrl}" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description} — Explore MediMentr" />
  <meta name="twitter:image" content="${image}" />
  <meta name="twitter:site" content="@medimentr" />

  <!-- Auto redirect for humans (crawlers will read the meta tags above) -->
  <meta http-equiv="refresh" content="0;url=${siteUrl}/#/blog/${id}" />
  <link rel="canonical" href="${blogUrl}" />
  <link rel="icon" type="image/png" href="${siteUrl}/favicon.png" />
  
  <style>
    body { margin:0; font-family:'Segoe UI',system-ui,sans-serif; background:#0a0f1c; color:#fff; display:flex; align-items:center; justify-content:center; min-height:100vh; }
    .card { max-width:620px; background:#1e293b; border-radius:20px; overflow:hidden; box-shadow:0 25px 50px rgba(0,0,0,.4); }
    .card img { width:100%; height:280px; object-fit:cover; }
    .body { padding:32px; }
    .cat { color:#3b82f6; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:2px; margin-bottom:12px; }
    h1 { font-size:24px; line-height:1.3; margin:0 0 16px; }
    p { color:#94a3b8; font-size:14px; line-height:1.6; margin:0 0 24px; }
    .cta { display:inline-block; background:linear-gradient(135deg,#3b82f6,#1d4ed8); color:#fff; text-decoration:none; padding:14px 32px; border-radius:12px; font-weight:700; font-size:14px; }
    .brand { text-align:center; padding:20px; color:#64748b; font-size:12px; }
  </style>
</head>
<body>
  <div class="card">
    <img src="${image}" alt="${title}" />
    <div class="body">
      <div class="cat">${post.category || 'Medical Education'}</div>
      <h1>${title}</h1>
      <p>${description}</p>
      <a href="${siteUrl}" class="cta">🔬 Explore MediMentr →</a>
    </div>
    <div class="brand">MediMentr — AI-Powered Medical Education Platform</div>
  </div>
</body>
</html>`);
    } catch (err) {
      console.error('Error serving blog OG page:', err);
      res.redirect(`${siteUrl}`);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Medimentr Server running on http://localhost:${PORT}`);
  });
}

startServer();
