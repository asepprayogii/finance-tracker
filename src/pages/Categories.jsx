import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Trash2, X, AlertCircle } from 'lucide-react'
import Layout from '../components/Layout'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', type: 'expense', icon: '📦' })
  const [error, setError] = useState(null)

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
    if (error) { setError('Gagal memuat kategori') }
    else { setCategories(data || []) }
    setLoading(false)
  }

  async function handleAdd(e) {
    e.preventDefault()
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!formData.name.trim()) { setError('Nama kategori wajib diisi'); return }
    const { error } = await supabase.from('categories').insert({
      user_id: user.id, name: formData.name.trim(),
      type: formData.type, icon: formData.icon, is_default: false
    })
    if (error) { setError(error.message) }
    else { setShowModal(false); setFormData({ name: '', type: 'expense', icon: '📦' }); fetchCategories() }
  }

  async function handleDelete(id, isDefault, name) {
    if (isDefault) { alert('Kategori default tidak bisa dihapus!'); return }
    if (!confirm(`Hapus kategori "${name}"?`)) return
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) { alert('Gagal: ' + error.message) }
    else { fetchCategories() }
  }

  const icons = ['📦','💰','🍜','🚗','🛍️','📄','🎮','💊','📚','💻','📈','🏋️','🎬','🏥','☕','🍕','🥗','🚕','⛽','🏠','🐶','👕','💡','🎓','✈️','🎁']
  const income  = categories.filter(c => c.type === 'income')
  const expense = categories.filter(c => c.type === 'expense')

  if (loading) return (
    <Layout>
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--gray-400)' }}>Memuat...</div>
    </Layout>
  )

  return (
    <Layout>
      <div style={s.page}>

        {/* Header */}
        <div style={s.pageHeader}>
          <h1 style={s.pageTitle}>Kategori</h1>
          <button onClick={() => setShowModal(true)} style={s.addBtn}>
            <Plus size={16} /> Tambah
          </button>
        </div>

        <div style={s.content}>

          {/* Pemasukan */}
          <div style={s.section}>
            <div style={s.sectionHead}>
              <div style={{ ...s.dot, background: 'var(--green)' }} />
              <h2 style={{ ...s.sectionTitle, color: 'var(--green)' }}>Pemasukan</h2>
              <span style={s.count}>{income.length}</span>
            </div>
            <div style={s.grid}>
              {income.length === 0 ? (
                <div style={s.empty}>Belum ada kategori pemasukan</div>
              ) : income.map(cat => (
                <div key={cat.id} style={s.card}>
                  <div style={s.cardLeft}>
                    <span style={s.cardIcon}>{cat.icon || '📦'}</span>
                    <div>
                      <p style={s.cardName}>{cat.name}</p>
                      {cat.is_default && <span style={s.badge}>Default</span>}
                    </div>
                  </div>
                  {!cat.is_default && (
                    <button onClick={() => handleDelete(cat.id, cat.is_default, cat.name)} style={s.deleteBtn}>
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pengeluaran */}
          <div style={s.section}>
            <div style={s.sectionHead}>
              <div style={{ ...s.dot, background: 'var(--red)' }} />
              <h2 style={{ ...s.sectionTitle, color: 'var(--red)' }}>Pengeluaran</h2>
              <span style={s.count}>{expense.length}</span>
            </div>
            <div style={s.grid}>
              {expense.length === 0 ? (
                <div style={s.empty}>Belum ada kategori pengeluaran</div>
              ) : expense.map(cat => (
                <div key={cat.id} style={s.card}>
                  <div style={s.cardLeft}>
                    <span style={s.cardIcon}>{cat.icon || '📦'}</span>
                    <div>
                      <p style={s.cardName}>{cat.name}</p>
                      {cat.is_default && <span style={s.badge}>Default</span>}
                    </div>
                  </div>
                  {!cat.is_default && (
                    <button onClick={() => handleDelete(cat.id, cat.is_default, cat.name)} style={s.deleteBtn}>
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal */}
        {showModal && (
          <div style={s.overlay}>
            <div style={s.modal}>
              <div style={s.modalHeader}>
                <h2 style={s.modalTitle}>Tambah Kategori</h2>
                <button onClick={() => { setShowModal(false); setError(null) }} style={s.closeBtn}>
                  <X size={20} />
                </button>
              </div>

              {error && (
                <div style={s.errorBox}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <form onSubmit={handleAdd} style={s.form}>
                <div style={s.field}>
                  <label style={s.label}>Nama Kategori</label>
                  <input
                    type="text" required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    style={s.input}
                    placeholder="cth: Netflix, Olahraga..."
                  />
                </div>

                <div style={s.field}>
                  <label style={s.label}>Tipe</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    style={s.input}
                  >
                    <option value="expense">Pengeluaran</option>
                    <option value="income">Pemasukan</option>
                  </select>
                </div>

                <div style={s.field}>
                  <label style={s.label}>Icon</label>
                  <div style={s.iconGrid}>
                    {icons.map(icon => (
                      <button
                        key={icon} type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        style={{ ...s.iconBtn, background: formData.icon === icon ? 'var(--green-pale)' : 'none', border: formData.icon === icon ? '2px solid var(--green)' : '2px solid transparent' }}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" style={s.submitBtn}>Simpan Kategori</button>
              </form>
            </div>
          </div>
        )}

      </div>
    </Layout>
  )
}

const s = {
  page: { minHeight: '100vh', background: 'var(--bg)' },
  pageHeader: { background: 'var(--white)', padding: '20px 16px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { fontSize: '18px', fontWeight: '800', color: 'var(--gray-900)' },
  addBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 'var(--radius-xs)', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer' },
  content: { padding: '20px 16px', maxWidth: '800px', margin: '0 auto' },
  section: { marginBottom: '28px' },
  sectionHead: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' },
  dot: { width: '4px', height: '18px', borderRadius: '4px' },
  sectionTitle: { fontSize: '16px', fontWeight: '700', margin: 0 },
  count: { fontSize: '12px', color: 'var(--gray-400)', background: 'var(--gray-100)', padding: '2px 8px', borderRadius: '99px', fontWeight: '600' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' },
  empty: { gridColumn: '1/-1', textAlign: 'center', color: 'var(--gray-400)', padding: '28px', background: 'var(--white)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '13px' },
  card: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: '12px 14px', border: '1px solid var(--border)' },
  cardLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  cardIcon: { fontSize: '24px' },
  cardName: { fontSize: '14px', fontWeight: '600', color: 'var(--gray-800)', margin: 0 },
  badge: { fontSize: '10px', padding: '2px 7px', background: 'var(--gray-100)', borderRadius: '99px', color: 'var(--gray-500)', marginTop: '2px', display: 'inline-block' },
  deleteBtn: { width: '30px', height: '30px', background: 'var(--red-pale)', border: 'none', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--red)', flexShrink: 0 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal: { background: 'var(--white)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflow: 'auto', padding: '24px' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  modalTitle: { fontSize: '18px', fontWeight: '700', color: 'var(--gray-800)', margin: 0 },
  closeBtn: { width: '32px', height: '32px', background: 'var(--gray-100)', border: 'none', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--gray-500)' },
  errorBox: { display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--red-pale)', color: 'var(--red)', padding: '10px 12px', borderRadius: 'var(--radius-xs)', fontSize: '13px', marginBottom: '16px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12.5px', fontWeight: '600', color: 'var(--gray-600)' },
  input: { padding: '10px 12px', borderRadius: 'var(--radius-xs)', border: '1.5px solid var(--border)', fontSize: '14px', outline: 'none', background: 'var(--gray-50)', width: '100%' },
  iconGrid: { display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px', padding: '10px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-xs)', background: 'var(--gray-50)', maxHeight: '150px', overflowY: 'auto' },
  iconBtn: { fontSize: '20px', padding: '6px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s' },
  submitBtn: { padding: '13px', borderRadius: 'var(--radius-xs)', background: 'var(--green)', color: '#fff', border: 'none', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
}