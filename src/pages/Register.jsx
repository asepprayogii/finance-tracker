import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, User, UserPlus, Eye, EyeOff, Check, X } from 'lucide-react'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  // Password requirements checker
  const checkPassword = (pwd) => {
    return {
      length: pwd.length >= 6,
      hasLetter: /[a-zA-Z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
    }
  }
  const pwdRequirements = checkPassword(password)
  const isPasswordValid = Object.values(pwdRequirements).every(Boolean)

  async function handleRegister(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Validasi
    if (!fullName.trim()) {
      setError('Nama lengkap harus diisi')
      setLoading(false)
      return
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Format email tidak valid')
      setLoading(false)
      return
    }
    if (!isPasswordValid) {
      setError('Password tidak memenuhi persyaratan')
      setLoading(false)
      return
    }
    if (!agreeTerms) {
      setError('Anda harus menyetujui syarat & ketentuan')
      setLoading(false)
      return
    }

    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } }
    })

    if (authError) {
      // Pesan error yang lebih ramah
      const msg = authError.message
      if (msg.includes('User already registered')) {
        setError('Email ini sudah terdaftar. Silakan login.')
      } else if (msg.includes('Password should be at least')) {
        setError('Password minimal 6 karakter')
      } else {
        setError(msg)
      }
    } else {
      // Simpan ke tabel profiles
      if (data?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({ 
            id: data.user.id, 
            full_name: fullName.trim(),
            email: email.trim(),
            created_at: new Date().toISOString()
          })
        
        if (profileError) {
          console.error('Profile insert error:', profileError)
          // Lanjutkan saja, user sudah terdaftar di auth
        }
      }
      
      setSuccess('✅ Registrasi berhasil! Silakan cek email untuk verifikasi.')
      
      // Redirect setelah 2 detik
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    }
    setLoading(false)
  }

  return (
    <div style={s.page}>
      {/* Background decorative elements */}
      <div style={s.bgDecor}>
        <div style={{...s.bgBlob, top: '-10%', left: '-10%', background: 'var(--green-pale)'}} />
        <div style={{...s.bgBlob, bottom: '-10%', right: '-10%', background: 'var(--blue-pale)', opacity: 0.6}} />
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
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
            <div style={{...s.logoFallback, display: 'none'}}>💰</div>
          </div>
          <h1 style={s.appName}>FinTrack</h1>
          <p style={s.tagline}>Mulai kelola keuanganmu hari ini</p>
        </div>

        {/* Messages */}
        {error && (
          <div style={s.error}>
            <span style={s.errorIcon}>⚠️</span>
            {error}
          </div>
        )}
        {success && (
          <div style={s.success}>
            <span style={s.successIcon}>✅</span>
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRegister} style={s.form}>
          {/* Full Name */}
          <div style={s.field}>
            <label style={s.label}>Nama Lengkap</label>
            <div style={s.inputWrap}>
              <User size={18} color="var(--gray-400)" style={s.inputIcon} />
              <input
                style={s.input}
                type="text"
                placeholder="Nama kamu"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                autoComplete="name"
                disabled={loading}
              />
            </div>
          </div>

          {/* Email */}
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <div style={s.inputWrap}>
              <Mail size={18} color="var(--gray-400)" style={s.inputIcon} />
              <input
                style={s.input}
                type="email"
                placeholder="nama@contoh.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div style={s.field}>
            <label style={s.label}>Password</label>
            <div style={s.inputWrap}>
              <Lock size={18} color="var(--gray-400)" style={s.inputIcon} />
              <input
                style={{...s.input, paddingRight: '40px'}}
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 6 karakter"
                value={password}
                onChange={e => setPassword(e.target.value)}
                minLength={6}
                required
                autoComplete="new-password"
                disabled={loading}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={s.toggleBtn}
                tabIndex={-1}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} color="var(--gray-400)"/> : <Eye size={18} color="var(--gray-400)"/>}
              </button>
            </div>
            
            {/* Password Requirements */}
            {password && (
              <div style={s.pwdRequirements}>
                <div style={{...s.reqItem, color: pwdRequirements.length ? 'var(--green)' : 'var(--gray-400)'}}>
                  {pwdRequirements.length ? <Check size={12}/> : <X size={12}/>} Minimal 6 karakter
                </div>
                <div style={{...s.reqItem, color: pwdRequirements.hasLetter ? 'var(--green)' : 'var(--gray-400)'}}>
                  {pwdRequirements.hasLetter ? <Check size={12}/> : <X size={12}/>} Mengandung huruf
                </div>
                <div style={{...s.reqItem, color: pwdRequirements.hasNumber ? 'var(--green)' : 'var(--gray-400)'}}>
                  {pwdRequirements.hasNumber ? <Check size={12}/> : <X size={12}/>} Mengandung angka
                </div>
              </div>
            )}
          </div>

          {/* Terms & Conditions */}
          <label style={s.termsWrap}>
            <input 
              type="checkbox" 
              checked={agreeTerms} 
              onChange={e => setAgreeTerms(e.target.checked)}
              style={s.checkbox}
              disabled={loading}
            />
            <span style={s.termsText}>
              Saya setuju dengan <a href="/terms" style={s.termsLink}>Syarat & Ketentuan</a> serta <a href="/privacy" style={s.termsLink}>Kebijakan Privasi</a>
            </span>
          </label>

          {/* Submit Button */}
          <button style={{...s.btn, opacity: loading || !isPasswordValid || !agreeTerms ? 0.7 : 1}} type="submit" disabled={loading || !isPasswordValid || !agreeTerms}>
            {loading ? (
              <>
                <span style={s.spinner}/> Memproses...
              </>
            ) : (
              <>
                <UserPlus size={18} /> Daftar Sekarang
              </>
            )}
          </button>
        </form>

        {/* Login Link */}
        <p style={s.footer}>
          Sudah punya akun?{' '}
          <Link to="/login" style={s.loginLink}>Masuk disini</Link>
        </p>
      </div>

      {/* Footer Copyright */}
      <p style={s.copyright}>© 2026 FinTrack. All rights reserved.</p>
    </div>
  )
}

// ⚠️ Styles - Same as Login for consistency
const s = {
  // Page & Background
  page: { 
    minHeight: '100vh', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: '20px', 
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  bgDecor: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
  },
  bgBlob: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    filter: 'blur(80px)',
    opacity: 0.5,
  },
  
  // Card
  card: { 
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    padding: '40px 32px', 
    borderRadius: '24px', 
    width: '100%', 
    maxWidth: '420px', 
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.12)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    position: 'relative',
    zIndex: 1,
    animation: 'slideUp 0.4s ease-out',
  },
  
  // Logo Section
  logoSection: { textAlign: 'center', marginBottom: '32px' },
  logoWrapper: { display: 'flex', justifyContent: 'center', marginBottom: '16px' },
  logoImg: {
    width: '72px', height: '72px', borderRadius: '18px', objectFit: 'cover',
    boxShadow: '0 8px 24px rgba(56, 161, 105, 0.25)', border: '3px solid var(--white)',
  },
  logoFallback: {
    width: '72px', height: '72px', borderRadius: '18px', background: 'var(--green)',
    color: '#fff', fontSize: '32px', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(56, 161, 105, 0.25)',
  },
  appName: { fontSize: '24px', fontWeight: '800', color: 'var(--gray-900)', margin: 0, letterSpacing: '-0.5px' },
  tagline: { fontSize: '14px', color: 'var(--gray-500)', marginTop: '4px', margin: 0 },
  
  // Messages
  error: { 
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'var(--red-pale)', color: 'var(--red)', padding: '12px 16px', 
    borderRadius: '12px', fontSize: '13px', marginBottom: '20px',
    border: '1px solid var(--red)', borderLeftWidth: '4px',
  },
  success: { 
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'var(--green-pale)', color: 'var(--green)', padding: '12px 16px', 
    borderRadius: '12px', fontSize: '13px', marginBottom: '20px',
    border: '1px solid var(--green)', borderLeftWidth: '4px',
  },
  errorIcon: { fontSize: '16px' },
  successIcon: { fontSize: '16px' },
  
  // Form
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: '600', color: 'var(--gray-700)' },
  
  // Input
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: '14px', pointerEvents: 'none' },
  input: { 
    width: '100%', padding: '13px 14px 13px 42px', borderRadius: '12px', 
    border: '2px solid var(--gray-200)', fontSize: '14px', outline: 'none', 
    background: 'var(--gray-50)', transition: 'all 0.2s', color: 'var(--gray-900)',
  },
  toggleBtn: {
    position: 'absolute', right: '12px', background: 'none', border: 'none',
    padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', borderRadius: '6px',
  },
  
  // Password Requirements
  pwdRequirements: {
    display: 'flex', flexDirection: 'column', gap: '6px',
    padding: '10px 12px', background: 'var(--gray-50)', borderRadius: '10px',
    border: '1px dashed var(--gray-200)', marginTop: '4px',
  },
  reqItem: {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '11px', color: 'var(--gray-500)', fontWeight: '500',
  },
  
  // Terms Checkbox
  termsWrap: {
    display: 'flex', alignItems: 'flex-start', gap: '10px',
    cursor: 'pointer', userSelect: 'none',
  },
  checkbox: {
    width: '18px', height: '18px', borderRadius: '5px',
    border: '2px solid var(--gray-300)', accentColor: 'var(--green)',
    cursor: 'pointer', marginTop: '2px', flexShrink: 0,
  },
  termsText: {
    fontSize: '12px', color: 'var(--gray-600)', lineHeight: '1.4',
  },
  termsLink: {
    color: 'var(--green)', textDecoration: 'none', fontWeight: '500',
  },
  
  // Button
  btn: { 
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', 
    padding: '14px', borderRadius: '14px', background: 'var(--green)', color: '#fff', 
    border: 'none', fontSize: '15px', fontWeight: '700', cursor: 'pointer',
    transition: 'all 0.2s', marginTop: '8px',
    boxShadow: '0 4px 14px rgba(56, 161, 105, 0.35)',
  },
  spinner: {
    width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite',
  },
  
  // Footer
  footer: { textAlign: 'center', marginTop: '28px', fontSize: '14px', color: 'var(--gray-500)', margin: 0 },
  loginLink: { color: 'var(--green)', textDecoration: 'none', fontWeight: '600' },
  copyright: {
    position: 'absolute', bottom: '20px', fontSize: '12px', color: 'var(--gray-400)', margin: 0,
  },
}

// ✅ Animations & Interactions
if (typeof document !== 'undefined' && !document.getElementById('register-anim')) {
  const style = document.createElement('style')
  style.id = 'register-anim'
  style.textContent = `
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    input:focus {
      border-color: var(--green) !important;
      background: #fff !important;
      box-shadow: 0 0 0 4px rgba(56, 161, 105, 0.1) !important;
    }
    input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    button[type="submit"]:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(56, 161, 105, 0.45) !important;
    }
    button[type="submit"]:active:not(:disabled) {
      transform: translateY(0);
    }
    .termsWrap:hover .termsText {
      color: var(--gray-700);
    }
  `
  document.head.appendChild(style)
}