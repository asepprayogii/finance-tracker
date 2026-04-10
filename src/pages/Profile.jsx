import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  LogOut, Calendar, TrendingUp, TrendingDown, Award,
  Edit, Check, X, ChevronRight, Shield, Heart,
  AlertTriangle, CircleAlert, Lock, Mail
} from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'

const C = {
  primary:      '#188e63',
  primaryLight: 'rgba(24,142,99,0.15)',
  warning:      '#ef9f27',
  warningLight: 'rgba(239,159,39,0.12)',
  danger:       '#e24b4a',
  dangerLight:  'rgba(226,75,74,0.12)',
  text: {
    primary:   '#0f172a',
    secondary: '#64748b',
    muted:     '#94a3b8',
  },
  bg: {
    page:   '#f1f5f9',
    card:   '#ffffff',
    subtle: '#f8fafc',
    border: '#e2e8f0',
  },
}

async function getCurrentUser() {
  try {
    const res = await supabase.auth.getUser()
    return res.data?.user || null
  } catch { return null }
}

async function updateUserMetadata(metadata) {
  try {
    const res = await supabase.auth.updateUser({ user_metadata: metadata })
    return { success: !res.error, error: res.error }
  } catch (err) { return { success: false, error: err } }
}

async function updateUserPassword(password) {
  try {
    const res = await supabase.auth.updateUser({ password })
    return { success: !res.error, error: res.error }
  } catch (err) { return { success: false, error: err } }
}

function getFinancialStatus(income, expense, savingRate) {
  if (income === 0 && expense === 0)
    return { label: 'Belum Ada Data', Icon: CircleAlert, color: C.text.muted, bg: C.bg.subtle, desc: 'Mulai catat transaksi untuk melihat status' }
  if (savingRate >= 20)
    return { label: 'Sehat',   Icon: Heart,        color: C.primary, bg: C.primaryLight, desc: 'Pengeluaran terkendali, tabungan konsisten' }
  if (savingRate >= 0)
    return { label: 'Waspada', Icon: AlertTriangle, color: C.warning, bg: C.warningLight, desc: 'Pengeluaran mendekati pemasukan, evaluasi budget' }
  return   { label: 'Kritis',  Icon: CircleAlert,   color: C.danger,  bg: C.dangerLight,  desc: 'Pengeluaran melebihi pemasukan, segera atur ulang' }
}

const formatRp = (v) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)

export default function Profile() {
  const [user,            setUser]            = useState(null)
  const [fullName,        setFullName]        = useState('')
  const [originalName,    setOriginalName]    = useState('')
  const [newPassword,     setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading,         setLoading]         = useState(false)
  const [notification,    setNotification]    = useState(null)
  const [editingName,     setEditingName]     = useState(false)
  const [stats,           setStats]           = useState({ total: 0, income: 0, expense: 0, since: '-', savingRate: 0 })

  const navigate = useNavigate()

  useEffect(() => { loadProfileData() }, [])

  async function loadProfileData() {
    const u = await getCurrentUser()
    if (!u) return
    setUser(u)
    const name = u.user_metadata?.full_name || ''
    setFullName(name)
    setOriginalName(name)
    await fetchStats(u.id)
  }

  async function fetchStats(userId) {
    const { data } = await supabase
      .from('transactions')
      .select('type, amount, created_at')
      .eq('user_id', userId)

    if (data?.length) {
      const income     = data.filter(t => t.type === 'income') .reduce((s, t) => s + t.amount, 0)
      const expense    = data.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      const savingRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0
      const firstDate  = new Date(Math.min(...data.map(t => new Date(t.created_at))))
      const since      = firstDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      setStats({ total: data.length, income, expense, since, savingRate })
    }
  }

  function notify(type, message) {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 4000)
  }

  async function handleUpdateName(e) {
    e.preventDefault()
    if (!fullName.trim() || fullName === originalName) { setEditingName(false); return }
    setLoading(true)
    const res = await updateUserMetadata({ full_name: fullName.trim() })
    if (res.success) { notify('success', 'Nama berhasil diperbarui'); setOriginalName(fullName); setEditingName(false) }
    else notify('error', res.error?.message || 'Gagal memperbarui nama')
    setLoading(false)
  }

  async function handleUpdatePassword(e) {
    e.preventDefault()
    if (newPassword !== confirmPassword) { notify('error', 'Password tidak cocok'); return }
    if (newPassword.length < 6)          { notify('error', 'Password minimal 6 karakter'); return }
    setLoading(true)
    const res = await updateUserPassword(newPassword)
    if (res.success) { notify('success', 'Password berhasil diperbarui'); setNewPassword(''); setConfirmPassword('') }
    else notify('error', res.error?.message || 'Gagal memperbarui password')
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const joinDate       = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    : '-'
  const avatarInitial  = fullName?.trim().charAt(0)?.toUpperCase() || 'U'
  const fs             = getFinancialStatus(stats.income, stats.expense, stats.savingRate)

  return (
    <div style={s.page}>

      {/* TOAST */}
      {notification && (
        <div style={{ ...s.toast, background: notification.type === 'success' ? C.primary : C.danger }}>
          {notification.type === 'success' ? <Check size={15} /> : <X size={15} />}
          <span>{notification.message}</span>
        </div>
      )}

      <main style={s.content}>

        {/* ── CARD PROFIL HIJAU ── */}
        <div style={s.profileCard}>
          <div style={s.avatar}>
            <span style={s.avatarText}>{avatarInitial}</span>
          </div>

          {editingName ? (
            <form onSubmit={handleUpdateName} style={s.editForm}>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                style={s.nameInput}
                autoFocus
                placeholder="Nama lengkap"
              />
              <button type="submit" disabled={loading} style={s.iconBtn}><Check size={15} /></button>
              <button type="button" onClick={() => { setEditingName(false); setFullName(originalName) }} style={s.iconBtn}><X size={15} /></button>
            </form>
          ) : (
            <div style={s.nameRow}>
              <h1 style={s.name}>{fullName || 'Pengguna'}</h1>
              <button onClick={() => setEditingName(true)} style={s.editBtn} title="Edit nama">
                <Edit size={13} />
              </button>
            </div>
          )}

          <p style={s.metaLine}><Mail size={13} /><span>{user?.email}</span></p>
          <p style={s.metaLine}><Calendar size={12} /><span>Anggota sejak {joinDate}</span></p>
        </div>

        {/* ── STATUS KEUANGAN ── */}
        <div style={{ ...s.statusCard, borderLeftColor: fs.color }}>
          <div style={{ ...s.statusBadge, background: fs.bg, color: fs.color }}>
            <fs.Icon size={14} />
            <span>{fs.label}</span>
          </div>
          <p style={s.statusDesc}>{fs.desc}</p>
          <div style={s.metrics}>
            <div style={s.metric}>
              <span style={s.metricLabel}>Pemasukan</span>
              <span style={{ ...s.metricValue, color: C.primary }}>{formatRp(stats.income)}</span>
            </div>
            <div style={s.metricDivider} />
            <div style={s.metric}>
              <span style={s.metricLabel}>Pengeluaran</span>
              <span style={{ ...s.metricValue, color: C.danger }}>{formatRp(stats.expense)}</span>
            </div>
            <div style={s.metricDivider} />
            <div style={s.metric}>
              <span style={s.metricLabel}>Saving rate</span>
              <span style={{ ...s.metricValue, color: fs.color }}>{stats.savingRate}%</span>
            </div>
          </div>
        </div>

        {/* ── RINGKASAN ── */}
        <p style={s.sectionLabel}>Ringkasan keuangan</p>
        <div style={s.statsGrid}>
          <StatCard icon={<TrendingUp size={16} />}  label="Total pemasukan"   value={formatRp(stats.income)}  valueColor={C.primary} />
          <StatCard icon={<TrendingDown size={16} />} label="Total pengeluaran" value={formatRp(stats.expense)} valueColor={C.danger}  />
          <StatCard
            icon={<Award size={16} />}
            label="Saving rate"
            value={`${stats.savingRate}%`}
            valueColor={stats.savingRate >= 20 ? C.primary : stats.savingRate >= 0 ? C.warning : C.danger}
          />
          <StatCard icon={<Shield size={16} />} label="Total transaksi" value={String(stats.total)} valueColor={C.text.primary} />
        </div>

        {/* ── KEAMANAN ── */}
        <p style={s.sectionLabel}>Keamanan akun</p>
        <div style={s.card}>
          <div style={s.cardHead}>
            <div style={s.cardIcon}><Lock size={16} color={C.text.secondary} /></div>
            <div>
              <p style={s.cardTitle}>Ganti password</p>
              <p style={s.cardDesc}>Gunakan password yang kuat dan unik</p>
            </div>
          </div>
          <form onSubmit={handleUpdatePassword} style={s.form}>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Password baru (min. 6 karakter)"
              style={s.input}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Konfirmasi password"
              style={s.input}
            />
            <button type="submit" disabled={loading} style={s.btnPrimary}>
              {loading ? 'Memproses...' : 'Perbarui password'}
            </button>
          </form>
        </div>

        {/* ── AKSES CEPAT ── */}
        <p style={s.sectionLabel}>Akses cepat</p>
        <div style={s.linkGroup}>
          <ActionLink to="/categories" icon={<Shield size={16} />}     title="Kelola kategori" desc="Tambah, edit, atau hapus kategori" />
          <ActionLink to="/budget"     icon={<Award size={16} />}      title="Atur budget"     desc="Tetapkan limit pengeluaran bulanan" border />
          <ActionLink to="/analytics"  icon={<TrendingUp size={16} />} title="Lihat analitik"  desc="Pantau tren keuangan Anda" />
        </div>

        {/* ── LOGOUT ── */}
        <button onClick={handleLogout} style={s.logoutBtn}>
          <LogOut size={15} />
          Keluar dari akun
        </button>

        <p style={s.footer}>FinTrack &copy; 2024</p>
      </main>
    </div>
  )
}

// ── SUB-COMPONENTS ─────────────────────────────────────────────

function StatCard({ icon, label, value, valueColor }) {
  return (
    <div style={s.statCard}>
      <div style={s.statIcon}>{icon}</div>
      <p style={s.statLabel}>{label}</p>
      <p style={{ ...s.statValue, color: valueColor }}>{value}</p>
    </div>
  )
}

function ActionLink({ to, icon, title, desc, border }) {
  return (
    <Link to={to} style={{ ...s.linkItem, ...(border ? s.linkItemBorder : {}) }}>
      <div style={s.linkIcon}>{icon}</div>
      <div style={s.linkText}>
        <p style={s.linkTitle}>{title}</p>
        <p style={s.linkDesc}>{desc}</p>
      </div>
      <ChevronRight size={15} color={C.text.muted} />
    </Link>
  )
}

// ── STYLES ──────────────────────────────────────────────────────
const s = {
  page: {
    minHeight: '100vh',
    background: C.bg.page,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: C.text.primary,
  },

  toast: {
    position: 'fixed', top: '20px', right: '20px',
    color: '#fff', padding: '12px 18px', borderRadius: '12px',
    fontSize: '14px', fontWeight: '500',
    display: 'flex', alignItems: 'center', gap: '9px',
    boxShadow: '0 6px 20px rgba(0,0,0,0.18)', zIndex: 100,
  },

  content: {
    maxWidth: '640px',
    margin: '0 auto',
    padding: '24px 20px 48px',
  },

  // ── Card profil — hijau, sudut melengkung ──
  profileCard: {
    background: `linear-gradient(135deg, ${C.primary} 0%, #0d7a55 100%)`,
    borderRadius: '28px',          // sudut melengkung
    padding: '32px 24px 28px',
    marginBottom: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  avatar: {
    width: '76px', height: '76px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    border: '3px solid rgba(255,255,255,0.55)',
    display: 'flex', alignItems: 'center',
    justifyContent: 'center', marginBottom: '16px',
    flexShrink: 0,
  },
  avatarText: { fontSize: '30px', fontWeight: '700', color: '#fff' },

  nameRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' },
  name: { fontSize: '20px', fontWeight: '700', color: '#fff', margin: 0 },
  editBtn: {
    background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px',
    padding: '5px', display: 'flex', alignItems: 'center',
    cursor: 'pointer', color: '#fff',
  },
  editForm: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' },
  nameInput: {
    padding: '8px 14px', borderRadius: '10px', border: 'none',
    fontSize: '15px', fontWeight: '600', outline: 'none',
    background: 'rgba(255,255,255,0.97)', color: C.text.primary,
    minWidth: '180px',
  },
  iconBtn: {
    background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px',
    padding: '6px', display: 'flex', alignItems: 'center',
    cursor: 'pointer', color: '#fff',
  },
  metaLine: {
    display: 'flex', alignItems: 'center', gap: '7px',
    fontSize: '13px', color: 'rgba(255,255,255,0.85)',
    margin: '4px 0 0', justifyContent: 'center',
  },

  // Status card
  statusCard: {
    background: C.bg.card,
    borderRadius: '16px',
    padding: '18px',
    borderLeft: '4px solid',
    border: `1px solid ${C.bg.border}`,
    marginBottom: '20px',
  },
  statusBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '4px 10px', borderRadius: '20px',
    fontSize: '12px', fontWeight: '600', marginBottom: '8px',
  },
  statusDesc: { fontSize: '13px', color: C.text.secondary, margin: '0 0 14px' },
  metrics: {
    display: 'flex', alignItems: 'center',
    borderTop: `1px dashed ${C.bg.border}`, paddingTop: '14px',
  },
  metric: { flex: 1, textAlign: 'center' },
  metricLabel: { display: 'block', fontSize: '11px', color: C.text.muted, marginBottom: '4px' },
  metricValue: { fontSize: '14px', fontWeight: '700' },
  metricDivider: { width: '1px', height: '28px', background: C.bg.border },

  sectionLabel: {
    fontSize: '12px', fontWeight: '600', color: C.text.muted,
    textTransform: 'uppercase', letterSpacing: '0.06em',
    margin: '0 0 12px',
  },

  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px', marginBottom: '20px',
  },
  statCard: {
    background: C.bg.card, borderRadius: '14px',
    padding: '16px', border: `1px solid ${C.bg.border}`,
  },
  statIcon: {
    width: '34px', height: '34px', borderRadius: '10px',
    background: C.bg.subtle, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: '10px', color: C.text.secondary,
  },
  statLabel: { fontSize: '12px', color: C.text.secondary, margin: '0 0 4px' },
  statValue: { fontSize: '15px', fontWeight: '700', margin: 0 },

  card: {
    background: C.bg.card, borderRadius: '16px',
    padding: '20px', border: `1px solid ${C.bg.border}`,
    marginBottom: '20px',
  },
  cardHead: { display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '18px' },
  cardIcon: {
    width: '40px', height: '40px', borderRadius: '12px',
    background: C.bg.subtle, display: 'flex',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardTitle: { fontSize: '14px', fontWeight: '600', margin: '0 0 3px' },
  cardDesc:  { fontSize: '12px', color: C.text.secondary, margin: 0 },

  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  input: {
    width: '100%', padding: '12px 16px', borderRadius: '12px',
    border: `1.5px solid ${C.bg.border}`, fontSize: '14px',
    outline: 'none', background: C.bg.subtle,
    color: C.text.primary, boxSizing: 'border-box',
  },
  btnPrimary: {
    width: '100%', padding: '13px', borderRadius: '12px',
    background: C.primary, color: '#fff', border: 'none',
    fontSize: '14px', fontWeight: '600', cursor: 'pointer',
  },

  linkGroup: {
    background: C.bg.card, borderRadius: '16px',
    border: `1px solid ${C.bg.border}`, overflow: 'hidden',
    marginBottom: '16px',
  },
  linkItem: {
    display: 'flex', alignItems: 'center', gap: '14px',
    padding: '16px 18px', textDecoration: 'none', color: 'inherit',
  },
  linkItemBorder: {
    borderTop:    `1px solid ${C.bg.border}`,
    borderBottom: `1px solid ${C.bg.border}`,
  },
  linkIcon: {
    width: '38px', height: '38px', borderRadius: '10px',
    background: C.bg.subtle, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    color: C.text.secondary, flexShrink: 0,
  },
  linkText: { flex: 1 },
  linkTitle: { fontSize: '14px', fontWeight: '600', margin: '0 0 3px' },
  linkDesc:  { fontSize: '12px', color: C.text.secondary, margin: 0 },

  logoutBtn: {
    width: '100%', padding: '14px', borderRadius: '12px',
    background: C.bg.card, border: `1.5px solid ${C.danger}`,
    color: C.danger, fontSize: '14px', fontWeight: '600',
    cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', gap: '8px',
  },

  footer: { textAlign: 'center', fontSize: '12px', color: C.text.muted, marginTop: '28px' },
}