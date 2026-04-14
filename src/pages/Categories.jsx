import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Trash2, X, AlertCircle, Edit2 } from 'lucide-react'
import Layout from '../components/Layout'

// ── WARNA PREMIUM ─────────────────────────────────────────────
const C = {
  primary:     '#10b981',     // Emerald modern
  primaryPale: 'rgba(16,185,129,0.12)',
  danger:      '#ef4444',
  dangerPale:  'rgba(239,68,68,0.09)',
  text: {
    primary:   '#0f172a',
    secondary: '#475569',
    muted:     '#64748b',
  },
  bg: {
    page:   '#f8fafc',
    card:   '#ffffff',
    subtle: '#f1f5f9',
    border: '#e2e8f0',
  },
}

// ── 50+ ICON YANG LEBIH KEREN & BERAGAM ───────────────────────
const ICON_OPTIONS = [
  // Makanan & Minuman
  { id: 'utensils', label: 'Makanan', path: 'M3 6h18M3 12h18M3 18h18' },
  { id: 'coffee', label: 'Kopi/Teh', path: 'M17 8h1a4 4 0 010 8h-1M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z' },
  { id: 'pizza', label: 'Pizza/Fastfood', path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z' },
  { id: 'restaurant', label: 'Restoran', path: 'M8 2v4M16 2v4M3 10h18M5 22h14' },
  { id: 'snack', label: 'Snack', path: 'M12 2L2 7l10 5 10-5-10-5z' },

  // Transport
  { id: 'car', label: 'Mobil', path: 'M19 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H3a2 2 0 00-2 2v4a2 2 0 002 2h2' },
  { id: 'motorcycle', label: 'Motor', path: 'M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v9a2 2 0 01-2 2h-2' },
  { id: 'fuel', label: 'BBM', path: 'M3 22V8l7-6 7 6v14M9 22V12h4v10' },
  { id: 'taxi', label: 'GoRide/Grab', path: 'M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z' },
  { id: 'bus', label: 'Bus/Angkot', path: 'M4 19h16M4 15h16M4 11h16M6 7h12' },

  // Belanja & Gaya Hidup
  { id: 'shopping', label: 'Belanja', path: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18' },
  { id: 'shirt', label: 'Pakaian', path: 'M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z' },
  { id: 'beauty', label: 'Kosmetik', path: 'M12 2L2 7l10 5 10-5-10-5z' },
  { id: 'gift', label: 'Hadiah', path: 'M20 12v10H4V12M22 7H2v5h20V7z' },

  // Keuangan
  { id: 'wallet', label: 'Dompet', path: 'M21 12V7H5a2 2 0 010-4h14v4M3 5v14a2 2 0 002 2h16v-5M21 12a2 2 0 00-2-2H5a2 2 0 010-4' },
  { id: 'salary', label: 'Gaji', path: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
  { id: 'bonus', label: 'Bonus/THR', path: 'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3' },
  { id: 'invest', label: 'Investasi', path: 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6' },
  { id: 'bill', label: 'Tagihan', path: 'M9 19l-6-6 6-6M15 5l6 6-6 6' },

  // Kesehatan & Rumah
  { id: 'health', label: 'Kesehatan', path: 'M22 12h-4l-3 9L9 3l-3 9H2' },
  { id: 'pill', label: 'Obat', path: 'M10.5 20.5L3.5 13.5a5 5 0 017-7l7 7a5 5 0 01-7 7z' },
  { id: 'heart', label: 'Asuransi', path: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z' },
  { id: 'home', label: 'Rumah', path: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10' },
  { id: 'electric', label: 'Listrik', path: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
  { id: 'water', label: 'Air/PDAM', path: 'M12 2v20M6 6h12M6 18h12' },

  // Edukasi & Hiburan
  { id: 'book', label: 'Pendidikan', path: 'M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 014 17V5c0-1.1.9-2 2-2h14v14H6.5A2.5 2.5 0 004 19.5z' },
  { id: 'laptop', label: 'Laptop/HP', path: 'M2 20h20M4 20V7a2 2 0 012-2h12a2 2 0 012 2v13' },
  { id: 'gamepad', label: 'Game/Hiburan', path: 'M6 12h4m-2-2v4M17 12h.01M15 10h.01' },
  { id: 'movie', label: 'Netflix/Film', path: 'M18 4l-6 6-6-6M4 20h16M4 8h16' },

  // Lainnya
  { id: 'star', label: 'Lainnya', path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
  { id: 'tag', label: 'Diskon/Promo', path: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01' },
  { id: 'freelance', label: 'Freelance', path: 'M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z' },
  { id: 'pet', label: 'Hewan Peliharaan', path: 'M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5' },
]

function CategoryIcon({ id, size = 26, color = '#64748b' }) {
  const found = ICON_OPTIONS.find(i => i.id === id) || ICON_OPTIONS[0]
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={found.path} />
    </svg>
  )
}

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({ name: '', type: 'expense', icon: 'utensils' })
  const [error, setError] = useState(null)

  useEffect(() => { fetchCategories() }, [])

  async function fetchCategories() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return setLoading(false)

    const { data } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.eq.${user.id},is_default.eq.true`)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true })

    setCategories(data || [])
    setLoading(false)
  }

  const openAddModal = () => {
    setEditingCategory(null)
    setFormData({ name: '', type: 'expense', icon: 'utensils' })
    setError(null)
    setShowModal(true)
  }

  const openEditModal = (cat) => {
    setEditingCategory(cat)
    setFormData({ name: cat.name, type: cat.type, icon: cat.icon || 'star' })
    setError(null)
    setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!formData.name.trim()) return setError('Nama kategori wajib diisi')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (editingCategory) {
      const { error } = await supabase
        .from('categories')
        .update({ name: formData.name.trim(), icon: formData.icon })
        .eq('id', editingCategory.id)

      if (error) setError(error.message)
      else { setShowModal(false); fetchCategories() }
    } else {
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
        setFormData({ name: '', type: 'expense', icon: 'utensils' })
        fetchCategories()
      }
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Hapus kategori "${name}"?`)) return
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) alert('Gagal menghapus')
    else fetchCategories()
  }

  const income = categories.filter(c => c.type === 'income')
  const expense = categories.filter(c => c.type === 'expense')

  if (loading) return <Layout><div style={{ padding: '100px 20px', textAlign: 'center', color: '#64748b' }}>Memuat kategori...</div></Layout>

  return (
    <Layout>
      <div style={s.page}>
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.pageTitle}>Kategori</h1>
            <p style={s.pageSubtitle}>{categories.length} kategori tersimpan</p>
          </div>
          <button onClick={openAddModal} style={s.addBtn}>
            <Plus size={19} /> Tambah Kategori
          </button>
        </div>

        <div style={s.content}>
          <CategorySection title="Pemasukan" color={C.primary} items={income} onEdit={openEditModal} onDelete={handleDelete} />
          <CategorySection title="Pengeluaran" color={C.danger} items={expense} onEdit={openEditModal} onDelete={handleDelete} />
        </div>

        {/* Modal Tambah / Edit */}
        {showModal && (
          <div style={s.overlay} onClick={() => setShowModal(false)}>
            <div style={s.modal} onClick={e => e.stopPropagation()}>
              <div style={s.modalHeader}>
                <h2 style={s.modalTitle}>
                  {editingCategory ? `Edit "${editingCategory.name}"` : 'Tambah Kategori Baru'}
                </h2>
                <button onClick={() => setShowModal(false)} style={s.closeBtn}><X size={22} /></button>
              </div>

              {error && <div style={s.errorBox}><AlertCircle size={18} /> {error}</div>}

              <form onSubmit={handleSave} style={s.form}>
                <div style={s.field}>
                  <label style={s.label}>Nama Kategori</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    style={s.input}
                    placeholder="Contoh: Gojek, Listrik, Makan Siang"
                    required
                  />
                </div>

                <div style={s.field}>
                  <label style={s.label}>Pilih Ikon</label>
                  <div style={s.iconGrid}>
                    {ICON_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: opt.id })}
                        style={{
                          ...s.iconPickBtn,
                          background: formData.icon === opt.id ? C.primaryPale : 'transparent',
                          border: formData.icon === opt.id ? `3px solid ${C.primary}` : `1px solid ${C.bg.border}`,
                        }}
                        title={opt.label}
                      >
                        <CategoryIcon id={opt.id} size={28} color={formData.icon === opt.id ? C.primary : C.text.muted} />
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" style={s.submitBtn}>
                  {editingCategory ? 'Simpan Perubahan' : 'Tambah Kategori'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

// ── SECTION & CARD (Tampilan Premium) ───────────────────────
function CategorySection({ title, color, items, onEdit, onDelete }) {
  return (
    <div style={s.section}>
      <div style={s.sectionHead}>
        <div style={{ ...s.sectionAccent, background: color }} />
        <h2 style={{ ...s.sectionTitle, color }}>{title}</h2>
        <span style={s.countBadge}>{items.length}</span>
      </div>

      {items.length === 0 ? (
        <div style={s.emptyState}>Belum ada kategori {title.toLowerCase()}</div>
      ) : (
        <div style={s.grid}>
          {items.map(cat => (
            <CategoryCard key={cat.id} cat={cat} accentColor={color} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

function CategoryCard({ cat, accentColor, onEdit, onDelete }) {
  return (
    <div style={s.card}>
      <div style={{ ...s.iconBox, background: accentColor === C.primary ? C.primaryPale : C.dangerPale }}>
        <CategoryIcon id={cat.icon || 'star'} size={30} color={accentColor} />
      </div>
      <div style={s.cardBody}>
        <p style={s.cardName}>{cat.name}</p>
        {cat.is_default && <span style={s.defaultBadge}>Default</span>}
      </div>
      <div style={s.cardActions}>
        <button onClick={() => onEdit(cat)} style={s.editBtn} title="Edit Icon & Nama">
          <Edit2 size={18} />
        </button>
        {!cat.is_default && (
          <button onClick={() => onDelete(cat.id, cat.name)} style={s.deleteBtn} title="Hapus">
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  )
}

// ── STYLES TOTAL MAKEOVER (Premium Look) ─────────────────────
const s = {
  page: { minHeight: '100vh', background: C.bg.page, fontFamily: 'system-ui, -apple-system, sans-serif' },

  pageHeader: {
    background: '#fff',
    padding: '28px 20px 22px',
    borderBottom: `1px solid ${C.bg.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 20,
  },
  pageTitle: { fontSize: '21px', fontWeight: '700', color: C.text.primary, margin: 0 },
  pageSubtitle: { fontSize: '14px', color: C.text.muted, margin: '4px 0 0' },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    padding: '12px 22px',
    background: C.primary,
    color: '#fff',
    border: 'none',
    borderRadius: '16px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 6px 16px rgba(16,185,129,0.3)',
  },

  content: { padding: '28px 18px', maxWidth: '920px', margin: '0 auto' },

  section: { marginBottom: '44px' },
  sectionHead: { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' },
  sectionAccent: { width: '6px', height: '26px', borderRadius: '6px' },
  sectionTitle: { fontSize: '17px', fontWeight: '700', margin: 0 },
  countBadge: {
    fontSize: '13px',
    background: C.bg.subtle,
    padding: '4px 12px',
    borderRadius: '999px',
    color: C.text.muted,
    fontWeight: '600',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))',
    gap: '16px',
  },

  card: {
    background: '#fff',
    borderRadius: '20px',
    padding: '20px 18px',
    border: `1px solid ${C.bg.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    transition: 'all 0.25s ease',
  },
  iconBox: {
    width: '58px',
    height: '58px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardName: {
    fontSize: '15.5px',
    fontWeight: '600',
    color: C.text.primary,
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  defaultBadge: {
    fontSize: '11px',
    color: C.text.muted,
    background: C.bg.subtle,
    padding: '3px 9px',
    borderRadius: '8px',
    marginTop: '4px',
    display: 'inline-block',
  },
  cardActions: { display: 'flex', gap: '10px' },
  editBtn: {
    width: '40px',
    height: '40px',
    background: C.primaryPale,
    color: C.primary,
    border: 'none',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  deleteBtn: {
    width: '40px',
    height: '40px',
    background: C.dangerPale,
    color: C.danger,
    border: 'none',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },

  emptyState: {
    padding: '60px 20px',
    background: '#fff',
    borderRadius: '20px',
    border: `2px dashed ${C.bg.border}`,
    textAlign: 'center',
    color: C.text.muted,
    fontSize: '14.5px',
  },

  // Modal
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,42,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
    backdropFilter: 'blur(10px)',
  },
  modal: {
    background: '#fff',
    borderRadius: '24px',
    width: '100%',
    maxWidth: '460px',
    padding: '32px',
    boxShadow: '0 35px 90px rgba(0,0,0,0.22)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '26px',
  },
  modalTitle: { fontSize: '19px', fontWeight: '700', margin: 0, color: C.text.primary },
  closeBtn: { background: 'none', border: 'none', fontSize: '26px', cursor: 'pointer', color: C.text.muted },

  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: C.dangerPale,
    color: C.danger,
    padding: '13px 16px',
    borderRadius: '14px',
    fontSize: '14px',
    marginBottom: '22px',
  },

  form: { display: 'flex', flexDirection: 'column', gap: '24px' },
  field: { display: 'flex', flexDirection: 'column', gap: '9px' },
  label: { fontSize: '13.5px', fontWeight: '600', color: C.text.secondary },
  input: {
    padding: '15px 17px',
    borderRadius: '14px',
    border: `1.5px solid ${C.bg.border}`,
    fontSize: '16px',
    outline: 'none',
    background: C.bg.subtle,
  },

  iconGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(58px, 1fr))',
    gap: '14px',
    padding: '18px',
    background: C.bg.subtle,
    borderRadius: '18px',
    border: `1px solid ${C.bg.border}`,
    maxHeight: '280px',
    overflowY: 'auto',
  },
  iconPickBtn: {
    width: '58px',
    height: '58px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },

  submitBtn: {
    marginTop: '12px',
    padding: '16px',
    background: C.primary,
    color: '#fff',
    border: 'none',
    borderRadius: '16px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
}