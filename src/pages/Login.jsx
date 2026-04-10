import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, LogIn, Eye, EyeOff, X } from "lucide-react";

// ✅ Import helper session manager
import { getTimeoutInfo, clearTimeoutFlag } from "../utils/sessionManager";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [timeoutMessage, setTimeoutMessage] = useState("");
  
  const navigate = useNavigate();

  // ✅ 1. CEK SESSION + LISTEN AUTH CHANGES (Cross-Tab Sync)
  useEffect(() => {
    let subscription = null;

    async function checkAuthAndRedirect() {
      try {
        // ✅ SAFE: Cek session awal
        const result = await supabase.auth.getSession();
        const session = result.data?.session || null;
        
        if (session) {
          navigate("/dashboard", { replace: true });
        } else {
          setLoading(false);
          const timeoutInfo = getTimeoutInfo();
          if (timeoutInfo) {
            setTimeoutMessage(timeoutInfo.message);
            setShowTimeoutModal(true);
          }
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setLoading(false);
      }
    }
    
    checkAuthAndRedirect();

    // ✅ 2. LISTEN AUTH STATE CHANGES (Termasuk dari tab lain!)
    // Supabase otomatis sync session via localStorage events
    const authListener = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log('🔄 Auth event:', event);
        
        if (event === 'SIGNED_IN' && newSession) {
          // ✅ User login dari tab lain → redirect tab ini juga
          navigate("/dashboard", { replace: true });
        }
        // Event lain: SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED, dll.
      }
    );
    
    // Simpan subscription untuk cleanup
    subscription = authListener;

    // Cleanup saat component unmount
    return () => {
      if (subscription?.data?.subscription?.unsubscribe) {
        subscription.data.subscription.unsubscribe();
      }
    };
  }, [navigate]);

  // ✅ 3. Load remembered email (hanya jika belum redirect)
  useEffect(() => {
    if (!loading) {
      const remembered = localStorage.getItem("fintrack_remember");
      if (remembered) {
        setEmail(remembered);
        setRememberMe(true);
      }
    }
  }, [loading]);

  // ✅ 4. Handle dismiss modal timeout
  const handleDismissTimeout = () => {
    clearTimeoutFlag();
    setShowTimeoutModal(false);
    setTimeoutMessage("");
  };

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email || !password) {
      setError("Email dan password harus diisi");
      setLoading(false);
      return;
    }

    // ✅ SAFE: Tanpa nested destructuring
    const authResult = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authResult.error) {
      const msg = authResult.error.message;
      if (msg.includes("Invalid login credentials")) {
        setError("Email atau password salah");
      } else if (msg.includes("Email not confirmed")) {
        setError("Silakan konfirmasi email Anda terlebih dahulu");
      } else {
        setError(msg);
      }
    } else {
      if (rememberMe) {
        localStorage.setItem("fintrack_remember", email);
      } else {
        localStorage.removeItem("fintrack_remember");
      }
      // ✅ onAuthStateChange akan handle redirect, tapi kita tetap navigate untuk UX instant
      navigate("/dashboard");
    }
    setLoading(false);
  }

  // ✅ Loading state
  if (loading) {
    return (
      <div style={s.page}>
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          height: "100vh",
          color: "var(--gray-500, #64748b)",
          fontSize: "14px"
        }}>
          Memeriksa sesi...
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* Background decorative elements */}
      <div style={s.bgDecor}>
        <div style={{ ...s.bgBlob, top: "-10%", left: "-10%", background: "var(--green-pale)" }} />
        <div style={{ ...s.bgBlob, bottom: "-10%", right: "-10%", background: "var(--blue-pale)", opacity: 0.6 }} />
      </div>

      <div style={s.card}>
        {/* Logo Section */}
        <div style={s.logoSection}>
          <div style={s.logoWrapper}>
            <img
              src="/icon-192.png"
              alt="FinTrack Logo"
              style={s.logoImg}
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
            <div style={{ ...s.logoFallback, display: "none" }}>💰</div>
          </div>
          <h1 style={s.appName}>FinTrack</h1>
          <p style={s.tagline}>Kelola keuangan dengan lebih cerdas</p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={s.error}>
            <span style={s.errorIcon}>⚠️</span>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} style={s.form}>
          {/* Email Field */}
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <div style={s.inputWrap}>
              <Mail size={18} color="var(--gray-400)" style={s.inputIcon} />
              <input
                style={s.input}
                type="email"
                placeholder="nama@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password Field */}
          <div style={s.field}>
            <label style={s.label}>Password</label>
            <div style={s.inputWrap}>
              <Lock size={18} color="var(--gray-400)" style={s.inputIcon} />
              <input
                style={{ ...s.input, paddingRight: "40px" }}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={s.toggleBtn}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} color="var(--gray-400)" /> : <Eye size={18} color="var(--gray-400)" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <label style={s.rememberWrap}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={s.checkbox}
            />
            <span style={s.rememberText}>Ingat saya</span>
          </label>

          {/* Submit Button */}
          <button
            style={{ ...s.btn, opacity: loading ? 0.8 : 1 }}
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span style={s.spinner} /> Memproses...
              </>
            ) : (
              <>
                <LogIn size={18} /> Masuk ke Akun
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={s.divider}>
          <span style={s.dividerLine} />
          <span style={s.dividerText}>atau</span>
          <span style={s.dividerLine} />
        </div>

        {/* Register Link */}
        <p style={s.footer}>
          Belum punya akun?{" "}
          <Link to="/register" style={s.registerLink}>
            Daftar gratis
          </Link>
        </p>
      </div>

      {/* Footer Copyright */}
      <p style={s.copyright}>© 2026 FinTrack. All rights reserved.</p>

      {/* ✅ TIMEOUT MODAL */}
      {showTimeoutModal && (
        <div style={s.modalOverlay}>
          <div style={s.modalCard}>
            <div style={s.modalHeader}>
              <div style={s.modalIcon}>⏰</div>
              <h3 style={s.modalTitle}>Sesi Berakhir</h3>
              <button onClick={handleDismissTimeout} style={s.modalClose}>
                <X size={18} />
              </button>
            </div>
            <div style={s.modalContent}>
              <p style={s.modalText}>{timeoutMessage}</p>
              <p style={s.modalSubtext}>Silakan login kembali untuk melanjutkan.</p>
            </div>
            <button onClick={handleDismissTimeout} style={s.modalBtn}>
              Mengerti, Lanjutkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ⚠️ Styles (sama seperti sebelumnya)
const s = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)", position: "relative", overflow: "hidden", fontFamily: "system-ui, -apple-system, sans-serif" },
  bgDecor: { position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" },
  bgBlob: { position: "absolute", width: "400px", height: "400px", borderRadius: "50%", filter: "blur(80px)", opacity: 0.5 },
  card: { background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(10px)", padding: "40px 32px", borderRadius: "24px", width: "100%", maxWidth: "420px", boxShadow: "0 20px 60px rgba(0, 0, 0, 0.12)", border: "1px solid rgba(255, 255, 255, 0.5)", position: "relative", zIndex: 1, animation: "slideUp 0.4s ease-out" },
  logoSection: { textAlign: "center", marginBottom: "32px" },
  logoWrapper: { display: "flex", justifyContent: "center", marginBottom: "16px" },
  logoImg: { width: "72px", height: "72px", borderRadius: "18px", objectFit: "cover", boxShadow: "0 8px 24px rgba(56, 161, 105, 0.25)", border: "3px solid var(--white)" },
  logoFallback: { width: "72px", height: "72px", borderRadius: "18px", background: "var(--green)", color: "#fff", fontSize: "32px", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(56, 161, 105, 0.25)", display: "flex" },
  appName: { fontSize: "24px", fontWeight: "800", color: "var(--gray-900)", margin: 0, letterSpacing: "-0.5px" },
  tagline: { fontSize: "14px", color: "var(--gray-500)", marginTop: "4px", margin: 0 },
  error: { display: "flex", alignItems: "center", gap: "8px", background: "var(--red-pale, #fef2f2)", color: "var(--red, #dc2626)", padding: "12px 16px", borderRadius: "12px", fontSize: "13px", marginBottom: "20px", border: "1px solid var(--red, #fecaca)", borderLeftWidth: "4px" },
  errorIcon: { fontSize: "16px" },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  field: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "13px", fontWeight: "600", color: "var(--gray-700)" },
  inputWrap: { position: "relative", display: "flex", alignItems: "center" },
  inputIcon: { position: "absolute", left: "14px", pointerEvents: "none" },
  input: { width: "100%", padding: "13px 14px 13px 42px", borderRadius: "12px", border: "2px solid var(--gray-200)", fontSize: "14px", outline: "none", background: "var(--gray-50)", transition: "all 0.2s", color: "var(--gray-900)", boxSizing: "border-box" },
  toggleBtn: { position: "absolute", right: "12px", background: "none", border: "none", padding: "4px", cursor: "pointer", display: "flex", alignItems: "center", borderRadius: "6px" },
  rememberWrap: { display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", userSelect: "none" },
  checkbox: { width: "18px", height: "18px", borderRadius: "5px", border: "2px solid var(--gray-300)", accentColor: "var(--green)", cursor: "pointer" },
  rememberText: { fontSize: "13px", color: "var(--gray-600)" },
  btn: { display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "14px", borderRadius: "14px", background: "var(--green)", color: "#fff", border: "none", fontSize: "15px", fontWeight: "700", cursor: "pointer", transition: "all 0.2s", marginTop: "8px", boxShadow: "0 4px 14px rgba(56, 161, 105, 0.35)" },
  spinner: { width: "18px", height: "18px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  divider: { display: "flex", alignItems: "center", gap: "12px", margin: "24px 0" },
  dividerLine: { flex: 1, height: "1px", background: "var(--gray-200)" },
  dividerText: { fontSize: "12px", color: "var(--gray-400)", fontWeight: "500" },
  footer: { textAlign: "center", marginTop: "28px", fontSize: "14px", color: "var(--gray-500)", margin: 0 },
  registerLink: { color: "var(--green)", textDecoration: "none", fontWeight: "600" },
  copyright: { position: "absolute", bottom: "20px", fontSize: "12px", color: "var(--gray-400)", margin: 0 },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" },
  modalCard: { background: "#fff", borderRadius: "20px", width: "100%", maxWidth: "360px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "1px solid #e2e8f0", overflow: "hidden", animation: "popIn 0.3s ease-out" },
  modalHeader: { display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px", borderBottom: "1px solid #f1f5f9", background: "#fff7ed" },
  modalIcon: { fontSize: "24px" },
  modalTitle: { fontSize: "16px", fontWeight: "700", color: "#c2410c", margin: 0, flex: 1 },
  modalClose: { background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px", display: "flex", borderRadius: "6px" },
  modalContent: { padding: "20px" },
  modalText: { fontSize: "14px", color: "#334155", marginBottom: "8px", lineHeight: "1.5" },
  modalSubtext: { fontSize: "13px", color: "#64748b", margin: 0 },
  modalBtn: { width: "100%", padding: "14px", background: "#38a169", color: "#fff", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "600", cursor: "pointer", transition: "background 0.2s" },
};

// ✅ Animations
if (typeof document !== "undefined" && !document.getElementById("login-anim")) {
  const style = document.createElement("style");
  style.id = "login-anim";
  style.textContent = `
    @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes popIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    input:focus { border-color: var(--green) !important; background: #fff !important; box-shadow: 0 0 0 4px rgba(56, 161, 105, 0.1) !important; }
    button[type="submit"]:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(56, 161, 105, 0.45) !important; }
    button[type="submit"]:active:not(:disabled) { transform: translateY(0); }
  `;
  document.head.appendChild(style);
}