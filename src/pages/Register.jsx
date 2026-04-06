import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, User, UserPlus } from 'lucide-react'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleRegister(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    })
    if (error) {
      setError(error.message)
    } else {
      await supabase.from('profiles').insert({ id: data.user.id, full_name: fullName })
      navigate('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>
          <div style={s.logoIcon}>💰</div>
          <h1 style={s.appName}>FinTrack</h1>
        </div>

        <h2 style={s.title}>Daftar</h2>
        <p style={s.sub}>Mulai kelola keuanganmu hari ini</p>

        {error && <div style={s.error}>{error}</div>}

        <form onSubmit={handleRegister} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Nama Lengkap</label>
            <div style={s.inputWrap}>
              <User size={16} color="var(--gray-500)" style={s.inputIcon} />
              <input style={s.input} type="text" placeholder="Nama kamu" value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>
          </div>

          <div style={s.field}>
            <label style={s.label}>Email</label>
            <div style={s.inputWrap}>
              <Mail size={16} color="var(--gray-500)" style={s.inputIcon} />
              <input style={s.input} type="email" placeholder="nama@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>

          <div style={s.field}>
            <label style={s.label}>Password</label>
            <div style={s.inputWrap}>
              <Lock size={16} color="var(--gray-500)" style={s.inputIcon} />
              <input style={s.input} type="password" placeholder="Min. 6 karakter" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required />
            </div>
          </div>

          <button style={s.btn} type="submit" disabled={loading}>
            <UserPlus size={16} />
            {loading ? 'Memproses...' : 'Daftar'}
          </button>
        </form>

        <p style={s.link}>
          Sudah punya akun? <Link to="/login">Masuk</Link>
        </p>
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'var(--gray-50)' },
  card: { background: 'var(--white)', padding: '40px 32px', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '400px', boxShadow: 'var(--shadow-md)' },
  logo: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' },
  logoIcon: { fontSize: '28px' },
  appName: { fontSize: '20px', fontWeight: '700', color: 'var(--green)' },
  title: { fontSize: '22px', fontWeight: '700', marginBottom: '4px' },
  sub: { fontSize: '14px', color: 'var(--gray-600)', marginBottom: '24px' },
  error: { background: 'var(--red-pale)', color: 'var(--red)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '13px', marginBottom: '16px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '500', color: 'var(--gray-700)' },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: '12px' },
  input: { width: '100%', padding: '11px 12px 11px 36px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--gray-200)', fontSize: '14px', outline: 'none', background: 'var(--gray-50)' },
  btn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px', borderRadius: 'var(--radius-sm)', background: 'var(--green)', color: 'var(--white)', border: 'none', fontSize: '15px', fontWeight: '600', marginTop: '4px' },
  link: { textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--gray-600)' }
}