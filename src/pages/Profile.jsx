import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { User, Mail, Lock, Save, LogOut, Calendar, TrendingUp, TrendingDown, Award, Edit2, CheckCircle, Shield, Clock, Grid3x3, ChevronRight, Plus } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'  // ← Tambah Link

export default function Profile() {
  const [user, setUser] = useState(null)
  const [fullName, setFullName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [stats, setStats] = useState({ total: 0, income: 0, expense: 0, since: '', savingRate: 0 })
  const [previewCategories, setPreviewCategories] = useState([])  // ← Tambah
  const navigate = useNavigate()

  useEffect(() => { 
    fetchUser()
    fetchStats()
    fetchPreviewCategories()  // ← Tambah
  }, [])

  async function fetchUser() { 
    const { data } = await supabase.auth.getUser()
    setUser(data.user)
    setFullName(data.user?.user_metadata?.full_name || '') 
  }

  async function fetchStats() {
    const { data: userData } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('transactions')
      .select('type, amount, created_at')
      .eq('user_id', userData.user?.id)

    if (data && data.length > 0) {
      const income = data.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const expense = data.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      const savingRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0
      const since = new Date(Math.min(...data.map(t => new Date(t.created_at))))
        .toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      setStats({ total: data.length, income, expense, since, savingRate })
    } else {
      setStats({ total: 0, income: 0, expense: 0, since: '-', savingRate: 0 })
    }
  }

  // ← Tambah function ini
  async function fetchPreviewCategories() {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    const { data } = await supabase
      .from('categories')
      .select('id, name, icon, is_default')
      .or(`user_id.eq.${userData.user.id},is_default.eq.true`)
      .limit(6)
      .order('is_default', { ascending: false })

    if (data) {
      setPreviewCategories(data)
    }
  }

  async function handleUpdateName(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')
    const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } })
    if (error) {
      setError(error.message)
    } else {
      setMessage('Nama berhasil diperbarui!')
      setEditingName(false)
      setTimeout(() => setMessage(''), 3000)
    }
    setLoading(false)
  }

  async function handleUpdatePassword(e) {
    e.preventDefault()
    setMessage('')
    setError('')
    if (newPassword !== confirmPassword) {
      setError('Password tidak cocok!')
      return
    }
    if (newPassword.length < 6) {
      setError('Password minimal 6 karakter!')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setError(error.message)
    } else {
      setMessage('Password berhasil diperbarui!')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setMessage(''), 3000)
    }
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const formatRp = (v) => new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(v)

  const joinDate = user?.created_at 
    ? new Date(user.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    : '-'

  return (
    <div style={s.page}>
      {/* Hero Section with Cover */}
      <div style={s.coverSection}>
        <div style={s.coverOverlay}></div>
        <div style={s.profileHeader}>
          <div style={s.avatarContainer}>
            <div style={s.avatar}>
              <span style={s.avatarEmoji}>{fullName ? fullName.charAt(0).toUpperCase() : '👤'}</span>
            </div>
          </div>
          <div style={s.profileInfo}>
            {editingName ? (
              <form onSubmit={handleUpdateName} style={s.editNameForm}>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  style={s.editNameInput}
                  autoFocus
                  placeholder="Nama lengkap"
                />
                <button type="submit" disabled={loading} style={s.saveNameBtn}>
                  <CheckCircle size={18} />
                </button>
                <button type="button" onClick={() => setEditingName(false)} style={s.cancelEditBtn}>
                  ✕
                </button>
              </form>
            ) : (
              <div style={s.nameRow}>
                <h1 style={s.userName}>{fullName || 'Pengguna'}</h1>
                <button onClick={() => setEditingName(true)} style={s.editIconBtn}>
                  <Edit2 size={14} />
                </button>
              </div>
            )}
            <div style={s.userEmail}>
              <Mail size={14} />
              <span>{user?.email}</span>
            </div>
            <div style={s.userSince}>
              <Calendar size={12} />
              <span>Bergabung {joinDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div style={s.toastSuccess}>
          <CheckCircle size={18} />
          {message}
        </div>
      )}
      {error && (
        <div style={s.toastError}>
          <span>⚠️</span>
          {error}
        </div>
      )}

      <div style={s.content}>
        {/* Stats Grid */}
        <div style={s.statsGrid}>
          <div style={s.statCard}>
            <div style={{ ...s.statIcon, background: 'var(--green-pale)' }}>
              <TrendingUp size={18} color="var(--green)" />
            </div>
            <div>
              <p style={s.statLabel}>Total Pemasukan</p>
              <p style={{ ...s.statValue, color: 'var(--green)' }}>{formatRp(stats.income)}</p>
            </div>
          </div>
          <div style={s.statCard}>
            <div style={{ ...s.statIcon, background: 'var(--red-pale)' }}>
              <TrendingDown size={18} color="var(--red)" />
            </div>
            <div>
              <p style={s.statLabel}>Total Pengeluaran</p>
              <p style={{ ...s.statValue, color: 'var(--red)' }}>{formatRp(stats.expense)}</p>
            </div>
          </div>
          <div style={s.statCard}>
            <div style={{ ...s.statIcon, background: '#fff8e1' }}>
              <Award size={18} color="#f59e0b" />
            </div>
            <div>
              <p style={s.statLabel}>Saving Rate</p>
              <p style={{ ...s.statValue, color: stats.savingRate >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {stats.savingRate >= 0 ? '+' : ''}{stats.savingRate}%
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={s.quickStats}>
          <div style={s.quickStatItem}>
            <span style={s.quickStatNumber}>{stats.total}</span>
            <span style={s.quickStatLabel}>Total Transaksi</span>
          </div>
          <div style={s.quickStatDivider} />
          <div style={s.quickStatItem}>
            <span style={s.quickStatNumber}>{stats.since !== '-' ? stats.since.split(' ')[0] : '-'}</span>
            <span style={s.quickStatLabel}>Mulai Aktif</span>
          </div>
          <div style={s.quickStatDivider} />
          <div style={s.quickStatItem}>
            <span style={s.quickStatNumber}>{stats.savingRate >= 0 ? 'Sehat' : 'Waspada'}</span>
            <span style={s.quickStatLabel}>Status Keuangan</span>
          </div>
        </div>

        {/* ========== KATEGORI SECTION (BARU) ========== */}
        <div style={s.categoriesSection}>
          <div style={s.categoriesHeader}>
            <h3 style={s.sectionTitle}>
              <Grid3x3 size={18} />
              Kelola Kategori
            </h3>
            <Link to="/categories" style={s.seeAllLink}>
              Lihat Semua <ChevronRight size={14} />
            </Link>
          </div>
          
          {/* Preview Categories */}
          <div style={s.categoriesPreview}>
            {previewCategories.length === 0 ? (
              <div style={s.emptyCategories}>
                <p style={s.emptyText}>Belum ada kategori</p>
                <Link to="/categories" style={s.addCategoryLink}>
                  <Plus size={14} /> Tambah kategori
                </Link>
              </div>
            ) : (
              <div style={s.categoryChips}>
                {previewCategories.map(cat => (
                  <div key={cat.id} style={s.categoryChip}>
                    <span style={s.categoryChipIcon}>{cat.icon || '📦'}</span>
                    <span style={s.categoryChipName}>{cat.name}</span>
                    {cat.is_default && <span style={s.defaultBadge}>Default</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Settings Cards */}
        <div style={s.settingsSection}>
          <h3 style={s.sectionTitle}>
            <Shield size={18} />
            Pengaturan Akun
          </h3>

          {/* Change Password Card */}
          <div style={s.settingCard}>
            <div style={s.settingCardHeader}>
              <div style={{ ...s.settingIcon, background: 'var(--green-pale)' }}>
                <Lock size={18} color="var(--green)" />
              </div>
              <div>
                <p style={s.settingTitle}>Ganti Password</p>
                <p style={s.settingDesc}>Perbarui kata sandi untuk keamanan akun</p>
              </div>
            </div>
            <form onSubmit={handleUpdatePassword} style={s.passwordForm}>
              <div style={s.inputGroup}>
                <input
                  style={s.input}
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Password baru (min. 6 karakter)"
                  minLength={6}
                />
              </div>
              <div style={s.inputGroup}>
                <input
                  style={s.input}
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Konfirmasi password baru"
                />
              </div>
              <button style={s.updateBtn} type="submit" disabled={loading}>
                <Lock size={14} />
                {loading ? 'Memproses...' : 'Perbarui Password'}
              </button>
            </form>
          </div>

          {/* Account Info Card */}
          <div style={s.settingCard}>
            <div style={s.settingCardHeader}>
              <div style={{ ...s.settingIcon, background: '#f1f5f9' }}>
                <Mail size={18} color="var(--gray-600)" />
              </div>
              <div>
                <p style={s.settingTitle}>Informasi Akun</p>
                <p style={s.settingDesc}>Detail akun FinTrack Anda</p>
              </div>
            </div>
            <div style={s.infoList}>
              <div style={s.infoItem}>
                <span style={s.infoLabel}>Email</span>
                <span style={s.infoValue}>{user?.email}</span>
              </div>
              <div style={s.infoDivider} />
              <div style={s.infoItem}>
                <span style={s.infoLabel}>Transaksi Pertama</span>
                <span style={s.infoValue}>{stats.since}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button onClick={handleLogout} style={s.logoutBtn}>
          <LogOut size={16} />
          Keluar dari FinTrack
        </button>

        {/* Version Footer */}
        <p style={s.versionText}>FinTrack v1.0 — Kelola keuanganmu lebih cerdas</p>
      </div>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
  },

  // Cover Section
  coverSection: {
    background: 'linear-gradient(135deg, #1a9e6e 0%, #0d6e4a 100%)',
    position: 'relative',
    padding: '32px 20px 48px',
  },
  coverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.1) 0%, transparent 70%)',
  },
  profileHeader: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    alignItems: 'flex-end',
    gap: '20px',
    flexWrap: 'wrap',
    maxWidth: '800px',
    margin: '0 auto',
  },

  // Avatar
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #fff 0%, #f0fdf4 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    border: '4px solid rgba(255,255,255,0.8)',
  },
  avatarEmoji: {
    fontSize: '48px',
    fontWeight: '700',
    color: 'var(--green)',
  },

  // Profile Info
  profileInfo: {
    marginBottom: '8px',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#fff',
    letterSpacing: '-0.5px',
  },
  editIconBtn: {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    borderRadius: '8px',
    padding: '6px',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    color: '#fff',
    transition: 'all 0.2s',
  },
  editNameForm: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  editNameInput: {
    padding: '10px 14px',
    borderRadius: '12px',
    border: 'none',
    fontSize: '16px',
    fontWeight: '600',
    width: '200px',
    outline: 'none',
  },
  saveNameBtn: {
    background: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    color: 'var(--green)',
  },
  cancelEditBtn: {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    borderRadius: '10px',
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    color: '#fff',
  },
  userEmail: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.7)',
    marginTop: '8px',
  },
  userSince: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
    marginTop: '4px',
  },

  // Toast Notifications
  toastSuccess: {
    position: 'fixed',
    top: '80px',
    right: '20px',
    background: 'var(--green)',
    color: '#fff',
    padding: '12px 20px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 100,
    animation: 'slideIn 0.3s ease',
  },
  toastError: {
    position: 'fixed',
    top: '80px',
    right: '20px',
    background: 'var(--red)',
    color: '#fff',
    padding: '12px 20px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 100,
    animation: 'slideIn 0.3s ease',
  },

  // Content
  content: {
    maxWidth: '800px',
    margin: '-30px auto 0',
    padding: '0 20px 40px',
    position: 'relative',
    zIndex: 3,
  },

  // Stats Grid
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
    marginBottom: '20px',
  },
  statCard: {
    background: 'var(--white)',
    borderRadius: 'var(--radius-md)',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border)',
  },
  statIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: '11px',
    color: 'var(--gray-500)',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '16px',
    fontWeight: '700',
  },

  // Quick Stats
  quickStats: {
    background: 'var(--white)',
    borderRadius: 'var(--radius-md)',
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
    border: '1px solid var(--border)',
  },
  quickStatItem: {
    textAlign: 'center',
    flex: 1,
  },
  quickStatNumber: {
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--gray-800)',
    display: 'block',
  },
  quickStatLabel: {
    fontSize: '11px',
    color: 'var(--gray-400)',
    marginTop: '4px',
  },
  quickStatDivider: {
    width: '1px',
    height: '30px',
    background: 'var(--border)',
  },

  // ========== KATEGORI SECTION STYLES (BARU) ==========
  categoriesSection: {
    background: 'var(--white)',
    borderRadius: 'var(--radius-md)',
    padding: '18px 20px',
    marginBottom: '28px',
    border: '1px solid var(--border)',
  },
  categoriesHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  seeAllLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    color: 'var(--green)',
    textDecoration: 'none',
  },
  categoriesPreview: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  categoryChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  categoryChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: 'var(--gray-100)',
    borderRadius: '20px',
    fontSize: '13px',
  },
  categoryChipIcon: {
    fontSize: '14px',
  },
  categoryChipName: {
    color: 'var(--gray-700)',
  },
  defaultBadge: {
    fontSize: '9px',
    padding: '2px 6px',
    background: '#e2e8f0',
    borderRadius: '10px',
    color: 'var(--gray-500)',
  },
  emptyCategories: {
    textAlign: 'center',
    padding: '16px',
    width: '100%',
  },
  emptyText: {
    fontSize: '13px',
    color: 'var(--gray-400)',
    marginBottom: '8px',
  },
  addCategoryLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: 'var(--green)',
    textDecoration: 'none',
  },

  // Settings Section
  settingsSection: {
    marginBottom: '24px',
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--gray-800)',
    marginBottom: '16px',
  },

  settingCard: {
    background: 'var(--white)',
    borderRadius: 'var(--radius-md)',
    padding: '20px',
    marginBottom: '16px',
    border: '1px solid var(--border)',
    transition: 'all 0.2s',
  },
  settingCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '16px',
  },
  settingIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: 'var(--gray-800)',
  },
  settingDesc: {
    fontSize: '12px',
    color: 'var(--gray-400)',
    marginTop: '2px',
  },

  // Password Form
  passwordForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  inputGroup: {
    width: '100%',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 'var(--radius-sm)',
    border: '1.5px solid var(--border)',
    fontSize: '14px',
    outline: 'none',
    background: 'var(--gray-50)',
    transition: 'border 0.2s',
  },
  updateBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--green)',
    color: '#fff',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '4px',
  },

  // Info List
  infoList: {
    marginTop: '4px',
  },
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
  },
  infoDivider: {
    height: '1px',
    background: 'var(--border)',
  },
  infoLabel: {
    fontSize: '13px',
    color: 'var(--gray-500)',
  },
  infoValue: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--gray-800)',
  },

  // Logout Button
  logoutBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px',
    borderRadius: 'var(--radius-md)',
    background: '#fff',
    border: '1.5px solid var(--border)',
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--red)',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'all 0.2s',
  },

  // Version
  versionText: {
    textAlign: 'center',
    fontSize: '11px',
    color: 'var(--gray-400)',
    marginTop: '24px',
  },
}

// Add animations
const styleSheet = document.createElement('style')
styleSheet.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  input:focus {
    border-color: var(--green) !important;
  }
  
  button:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`
document.head.appendChild(styleSheet)