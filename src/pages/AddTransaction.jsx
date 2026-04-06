import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, ChevronLeft } from 'lucide-react'

export default function AddTransaction() {
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [categoryId, setCategoryId] = useState('')
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => { fetchCategories() }, [type])

  async function fetchCategories() {
    const { data: userData } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('categories').select('*')
      .eq('user_id', userData.user.id).eq('type', type)
    setCategories(data || [])
    setCategoryId(data?.[0]?.id || '')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data: userData } = await supabase.auth.getUser()
    const { error } = await supabase.from('transactions').insert({
      user_id: userData.user.id,
      category_id: categoryId,
      type, amount: parseFloat(amount), description, date
    })
    if (error) { setError(error.message) } else { navigate('/transactions') }
    setLoading(false)
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button onClick={() => navigate(-1)} style={s.backBtn}><ChevronLeft size={20} /></button>
        <h2 style={s.headerTitle}>Tambah Transaksi</h2>
        <div style={{ width: 36 }} />
      </div>

      <div style={s.container}>
        <div style={s.typeToggle}>
          <button type="button" onClick={() => setType('expense')}
            style={type === 'expense' ? s.typeActive('expense') : s.typeInactive}>
            <TrendingDown size={16} />Pengeluaran
          </button>
          <button type="button" onClick={() => setType('income')}
            style={type === 'income' ? s.typeActive('income') : s.typeInactive}>
            <TrendingUp size={16} />Pemasukan
          </button>
        </div>

        {error && <div style={s.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.amountBox}>
            <span style={s.currency}>Rp</span>
            <input
              style={s.amountInput}
              type="number" placeholder="0"
              value={amount} onChange={e => setAmount(e.target.value)}
              required min="1"
            />
          </div>

          <div style={s.card}>
            <div style={s.field}>
              <label style={s.label}>Kategori</label>
              <select style={s.input} value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div style={s.divider} />
            <div style={s.field}>
              <label style={s.label}>Tanggal</label>
              <input style={s.input} type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div style={s.divider} />
            <div style={s.field}>
              <label style={s.label}>Keterangan</label>
              <input style={s.input} type="text" placeholder="Opsional" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{ ...s.submitBtn, background: type === 'expense' ? 'var(--red)' : 'var(--green)' }}>
            {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
          </button>
        </form>
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: 'var(--gray-50)' },
  header: { background: 'var(--white)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)' },
  backBtn: { padding: '6px', background: 'var(--gray-100)', border: 'none', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', color: 'var(--gray-700)' },
  headerTitle: { fontSize: '16px', fontWeight: '700' },
  container: { padding: '20px 16px', maxWidth: '480px', margin: '0 auto' },
  typeToggle: { display: 'flex', gap: '10px', marginBottom: '20px' },
  typeActive: (type) => ({ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '12px', borderRadius: 'var(--radius-md)', border: 'none', background: type === 'expense' ? 'var(--red)' : 'var(--green)', color: '#fff', fontSize: '14px', fontWeight: '600' }),
  typeInactive: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--gray-200)', background: 'var(--white)', color: 'var(--gray-500)', fontSize: '14px', fontWeight: '500' },
  error: { background: 'var(--red-pale)', color: 'var(--red)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '13px', marginBottom: '16px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  amountBox: { background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: '20px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-sm)' },
  currency: { fontSize: '24px', fontWeight: '700', color: 'var(--gray-400)' },
  amountInput: { flex: 1, border: 'none', outline: 'none', fontSize: '32px', fontWeight: '700', color: 'var(--gray-900)', background: 'transparent', width: '100%' },
  card: { background: 'var(--white)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' },
  field: { padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: '14px', color: 'var(--gray-600)', fontWeight: '500' },
  input: { border: 'none', outline: 'none', fontSize: '14px', color: 'var(--gray-900)', textAlign: 'right', background: 'transparent', maxWidth: '200px' },
  divider: { height: '1px', background: 'var(--gray-100)', margin: '0 16px' },
  submitBtn: { padding: '16px', borderRadius: 'var(--radius-md)', border: 'none', color: '#fff', fontSize: '16px', fontWeight: '700', marginTop: '8px' },
}