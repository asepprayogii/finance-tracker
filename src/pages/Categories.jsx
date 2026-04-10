import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Trash2, X, AlertCircle, ChevronRight } from 'lucide-react'
import Layout from '../components/Layout'

// ── WARNA ─────────────────────────────────────────────────────
const C = {
  primary:     '#188e63',
  primaryPale: 'rgba(24,142,99,0.1)',
  danger:      '#e24b4a',
  dangerPale:  'rgba(226,75,74,0.08)',
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

// ── SVG ICON CATEGORIES ───────────────────────────────────────
// Setiap kategori punya SVG path sendiri — tidak ada emoji
const ICON_OPTIONS = [
  // Makanan & Minuman
  { id: 'food',       label: 'Makanan',     path: 'M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3' },
  { id: 'coffee',     label: 'Kopi',        path: 'M17 8h1a4 4 0 010 8h-1M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z' },
  { id: 'pizza',      label: 'Pizza',       path: 'M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z' },

  // Transport
  { id: 'car',        label: 'Kendaraan',   path: 'M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v9a2 2 0 01-2 2h-2M9 17a2 2 0 11-4 0 2 2 0 014 0zM21 17a2 2 0 11-4 0 2 2 0 014 0zM3 9h18' },
  { id: 'fuel',       label: 'BBM',         path: 'M3 22V8l7-6 7 6v14M9 22V12h4v10M1 22h20' },
  { id: 'plane',      label: 'Travel',      path: 'M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z' },

  // Belanja
  { id: 'shopping',   label: 'Belanja',     path: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0' },
  { id: 'shirt',      label: 'Pakaian',     path: 'M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z' },
  { id: 'gift',       label: 'Hadiah',      path: 'M20 12v10H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z' },

  // Keuangan
  { id: 'wallet',     label: 'Dompet',      path: 'M21 12V7H5a2 2 0 010-4h14v4M3 5v14a2 2 0 002 2h16v-5M21 12a2 2 0 00-2-2H5a2 2 0 010-4' },
  { id: 'salary',     label: 'Gaji',        path: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
  { id: 'invest',     label: 'Investasi',   path: 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6' },

  // Kesehatan
  { id: 'health',     label: 'Kesehatan',   path: 'M22 12h-4l-3 9L9 3l-3 9H2' },
  { id: 'pill',       label: 'Obat',        path: 'M10.5 20.5L3.5 13.5a5 5 0 017-7l7 7a5 5 0 01-7 7zM8.5 8.5l7 7' },
  { id: 'heart',      label: 'Asuransi',    path: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z' },

  // Edukasi & Hiburan
  { id: 'book',       label: 'Pendidikan',  path: 'M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 014 17V5c0-1.1.9-2 2-2h14v14H6.5A2.5 2.5 0 004 19.5z' },
  { id: 'laptop',     label: 'Teknologi',   path: 'M2 20h20M4 20V7a2 2 0 012-2h12a2 2 0 012 2v13' },
  { id: 'gamepad',    label: 'Hiburan',     path: 'M6 12h4m-2-2v4M17 12h.01M15 10h.01M4.9 19.1A10 10 0 1019 5M17 9h2a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2h2' },

  // Rumah
  { id: 'home',       label: 'Rumah',       path: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10' },
  { id: 'electric',   label: 'Listrik',     path: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
  { id: 'pet',        label: 'Hewan',       path: 'M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.96-1.45-2.344-2.5M8 14v.5M16 14v.5M11.25 16.25h1.5L12 17l-.75-.75zM4.42 20h15.16S18 14 12 14 4.42 20 4.42 20z' },

  // Lainnya
  { id: 'star',       label: 'Lainnya',     path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
  { id: 'tag',        label: 'Tag',         path: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01' },
  { id: 'freelance',  label: 'Freelance',   path: 'M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z' },
  { id: 'bonus',      label: 'Bonus',       path: 'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3' },
]

function CategoryIcon({ id, size = 18, color = C.text.secondary }) {
  const found = ICON_OPTIONS.find(i => i.id === id) || ICON_OPTIONS[0]
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={found.path} />
    </svg>
  )
}

// ── MAIN ──────────────────────────────────────────────────────
export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showModal,  setShowModal]  = useState(false)
  const [formData,   setFormData]   = useState({ name: '', type: 'expense', icon: 'food' })
  const [error,      setError]      = useState(null)

  useEffect(() => { fetchCategories() }, [])

  async function fetchCategories() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.eq.${user.id},is_default.eq.true`)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true })
    if (error) setError('Gagal memuat kategori')
    else setCategories(data || [])
    setLoading(false)
  }

  async function handleAdd(e) {
    e.preventDefault()
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!formData.name.trim()) { setError('Nama kategori wajib diisi'); return }
    const { error } = await supabase.from('categories').insert({
      user_id: user.id,
      name: formData.name.trim(),
      type: formData.type,
      icon: formData.icon,
      is_default: false,
    })
    if (error) setError(error.message)
    else {
      setShowModal(false)
      setFormData({ name: '', type: 'expense', icon: 'food' })
      fetchCategories()
    }
  }

  async function handleDelete(id, isDefault, name) {
    if (isDefault) { alert('Kategori default tidak bisa dihapus!'); return }
    if (!confirm(`Hapus kategori "${name}"?`)) return
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) alert('Gagal: ' + error.message)
    else fetchCategories()
  }

  const income  = categories.filter(c => c.type === 'income')
  const expense = categories.filter(c => c.type === 'expense')

  if (loading) return (
    <Layout>
      <div style={{ padding: '80px', textAlign: 'center', color: C.text.muted, fontSize: '14px' }}>
        Memuat kategori...
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div style={s.page}>

        {/* ── PAGE HEADER ── */}
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.pageTitle}>Kategori</h1>
            <p style={s.pageSubtitle}>{categories.length} kategori tersimpan</p>
          </div>
          <button onClick={() => setShowModal(true)} style={s.addBtn}>
            <Plus size={15} strokeWidth={2.5} />
            <span>Tambah</span>
          </button>
        </div>

        {/* ── CONTENT ── */}
        <div style={s.content}>

          {/* Pemasukan */}
          <CategorySection
            title="Pemasukan"
            color={C.primary}
            items={income}
            onDelete={handleDelete}
          />

          {/* Pengeluaran */}
          <CategorySection
            title="Pengeluaran"
            color={C.danger}
            items={expense}
            onDelete={handleDelete}
          />

        </div>

        {/* ── MODAL ── */}
        {showModal && (
          <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) { setShowModal(false); setError(null) } }}>
            <div style={s.modal}>

              <div style={s.modalHeader}>
                <h2 style={s.modalTitle}>Tambah Kategori</h2>
                <button onClick={() => { setShowModal(false); setError(null) }} style={s.closeBtn}>
                  <X size={16} />
                </button>
              </div>

              {error && (
                <div style={s.errorBox}>
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleAdd} style={s.form}>

                {/* Nama */}
                <div style={s.field}>
                  <label style={s.label}>Nama kategori</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    style={s.input}
                    placeholder="cth: Netflix, Gaji, Olahraga..."
                  />
                </div>

                {/* Tipe */}
                <div style={s.field}>
                  <label style={s.label}>Tipe</label>
                  <div style={s.typeToggle}>
                    {['expense', 'income'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: t })}
                        style={{
                          ...s.typeBtn,
                          background: formData.type === t
                            ? (t === 'income' ? C.primary : C.danger)
                            : 'transparent',
                          color: formData.type === t ? '#fff' : C.text.secondary,
                          border: formData.type === t ? 'none' : `1.5px solid ${C.bg.border}`,
                        }}
                      >
                        {t === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Icon picker */}
                <div style={s.field}>
                  <label style={s.label}>Ikon</label>
                  <div style={s.iconGrid}>
                    {ICON_OPTIONS.map(opt => {
                      const selected = formData.icon === opt.id
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          title={opt.label}
                          onClick={() => setFormData({ ...formData, icon: opt.id })}
                          style={{
                            ...s.iconPickBtn,
                            background:   selected ? C.primaryPale : 'transparent',
                            border:       selected ? `1.5px solid ${C.primary}` : `1.5px solid transparent`,
                            borderRadius: '10px',
                          }}
                        >
                          <CategoryIcon
                            id={opt.id}
                            size={18}
                            color={selected ? C.primary : C.text.muted}
                          />
                        </button>
                      )
                    })}
                  </div>
                  {/* Label ikon terpilih */}
                  <p style={{ fontSize: '12px', color: C.text.muted, marginTop: '6px' }}>
                    Terpilih: {ICON_OPTIONS.find(o => o.id === formData.icon)?.label}
                  </p>
                </div>

                <button type="submit" style={s.submitBtn}>Simpan kategori</button>
              </form>
            </div>
          </div>
        )}

      </div>
    </Layout>
  )
}

// ── SECTION COMPONENT ─────────────────────────────────────────
function CategorySection({ title, color, items, onDelete }) {
  return (
    <div style={s.section}>
      <div style={s.sectionHead}>
        <div style={{ ...s.sectionAccent, background: color }} />
        <h2 style={{ ...s.sectionTitle, color }}>{title}</h2>
        <span style={s.countBadge}>{items.length}</span>
      </div>

      {items.length === 0 ? (
        <div style={s.emptyState}>
          <p style={s.emptyText}>Belum ada kategori {title.toLowerCase()}</p>
        </div>
      ) : (
        <div style={s.grid}>
          {items.map(cat => (
            <CategoryCard key={cat.id} cat={cat} onDelete={onDelete} accentColor={color} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── CARD COMPONENT ────────────────────────────────────────────
function CategoryCard({ cat, onDelete, accentColor }) {
  return (
    <div style={s.card}>
      {/* Icon box */}
      <div style={{ ...s.iconBox, background: accentColor === C.primary ? C.primaryPale : 'rgba(226,75,74,0.08)' }}>
        <CategoryIcon
          id={cat.icon}
          size={18}
          color={accentColor}
        />
      </div>

      {/* Label */}
      <div style={s.cardBody}>
        <p style={s.cardName}>{cat.name}</p>
        {cat.is_default && <span style={s.defaultBadge}>Default</span>}
      </div>

      {/* Delete */}
      {!cat.is_default && (
        <button
          onClick={() => onDelete(cat.id, cat.is_default, cat.name)}
          style={s.deleteBtn}
          title="Hapus"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  )
}

// ── STYLES ────────────────────────────────────────────────────
const s = {
  page: {
    minHeight: '100vh',
    background: C.bg.page,
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },

  pageHeader: {
    background: C.bg.card,
    padding: '20px 20px 18px',
    borderBottom: `1px solid ${C.bg.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: '17px',
    fontWeight: '700',
    color: C.text.primary,
    margin: '0 0 2px',
  },
  pageSubtitle: {
    fontSize: '12px',
    color: C.text.muted,
    margin: 0,
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 16px',
    background: C.primary,
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },

  content: {
    padding: '20px 16px',
    maxWidth: '760px',
    margin: '0 auto',
  },

  section: { marginBottom: '32px' },
  sectionHead: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  sectionAccent: {
    width: '3px',
    height: '16px',
    borderRadius: '2px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '700',
    margin: 0,
    letterSpacing: '-0.1px',
  },
  countBadge: {
    fontSize: '11px',
    color: C.text.muted,
    background: C.bg.subtle,
    border: `1px solid ${C.bg.border}`,
    padding: '1px 8px',
    borderRadius: '99px',
    fontWeight: '600',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '8px',
  },

  emptyState: {
    padding: '28px',
    background: C.bg.card,
    borderRadius: '12px',
    border: `1px dashed ${C.bg.border}`,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: '13px',
    color: C.text.muted,
    margin: 0,
  },

  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: C.bg.card,
    borderRadius: '12px',
    padding: '12px 14px',
    border: `1px solid ${C.bg.border}`,
  },
  iconBox: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardName: {
    fontSize: '13.5px',
    fontWeight: '600',
    color: C.text.primary,
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  defaultBadge: {
    fontSize: '10px',
    color: C.text.muted,
    background: C.bg.subtle,
    border: `1px solid ${C.bg.border}`,
    padding: '1px 6px',
    borderRadius: '4px',
    display: 'inline-block',
    marginTop: '2px',
  },
  deleteBtn: {
    width: '30px',
    height: '30px',
    background: 'rgba(226,75,74,0.07)',
    border: 'none',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: C.danger,
    flexShrink: 0,
  },

  // Modal
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,42,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
    backdropFilter: 'blur(2px)',
  },
  modal: {
    background: C.bg.card,
    borderRadius: '20px',
    width: '100%',
    maxWidth: '420px',
    maxHeight: '90vh',
    overflow: 'auto',
    padding: '24px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: C.text.primary,
    margin: 0,
  },
  closeBtn: {
    width: '32px',
    height: '32px',
    background: C.bg.subtle,
    border: `1px solid ${C.bg.border}`,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: C.text.secondary,
  },

  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(226,75,74,0.08)',
    color: C.danger,
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '13px',
    marginBottom: '16px',
  },

  form: { display: 'flex', flexDirection: 'column', gap: '18px' },
  field: { display: 'flex', flexDirection: 'column', gap: '7px' },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: C.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    padding: '11px 14px',
    borderRadius: '10px',
    border: `1.5px solid ${C.bg.border}`,
    fontSize: '14px',
    outline: 'none',
    background: C.bg.subtle,
    color: C.text.primary,
    width: '100%',
    boxSizing: 'border-box',
  },

  typeToggle: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  typeBtn: {
    padding: '10px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },

  iconGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '6px',
    padding: '12px',
    background: C.bg.subtle,
    border: `1.5px solid ${C.bg.border}`,
    borderRadius: '12px',
    maxHeight: '180px',
    overflowY: 'auto',
  },
  iconPickBtn: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
  },

  submitBtn: {
    padding: '13px',
    borderRadius: '12px',
    background: C.primary,
    color: '#fff',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '4px',
  },
}