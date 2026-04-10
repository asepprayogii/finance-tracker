import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, useParams } from 'react-router-dom'
import { TrendingUp, TrendingDown, ChevronLeft } from 'lucide-react'

export default function EditTransaction() {
  const { id } = useParams()
  const [type, setType] = useState('expense')
  const [rawAmount, setRawAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categories, setCategories] = useState([])
  const [isCatLoading, setIsCatLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [showKeypad, setShowKeypad] = useState(false)
  const navigate = useNavigate()

  const quickAmounts = [10000, 20000, 50000, 100000, 200000, 500000]

  const formatRupiah = (val) => {
    if (!val) return '0'
    const num = String(val).replace(/\D/g, '')
    return new Intl.NumberFormat('id-ID').format(num)
  }

  const displayAmount = formatRupiah(rawAmount)

  // 1. Fetch data transaksi saat mount
  useEffect(() => {
    async function fetchTransaction() {
      try {
        const { data, error } = await supabase.from('transactions').select('*').eq('id', id).single()
        if (error) throw error
        if (data) {
          setType(data.type)
          setRawAmount(String(data.amount))
          setDescription(data.description || '')
          setDate(data.date)
          setCategoryId(data.category_id)
        }
      } catch (err) {
        console.error('Fetch transaction error:', err)
        setError('Gagal memuat data transaksi')
      } finally {
        setFetching(false)
      }
    }
    fetchTransaction()
  }, [id])

  // 2. Fetch categories saat type berubah (setelah data transaksi selesai)
  useEffect(() => {
    if (!fetching) fetchCategories()
  }, [type, fetching])
  
  async function fetchCategories() {
    setIsCatLoading(true)
    try {
      // ✅ FIX: Destructuring yang benar untuk Supabase auth
      const { data: authData, error: authErr } = await supabase.auth.getUser()
      if (authErr || !authData?.user) {
        setCategories([])
        setIsCatLoading(false)
        return
      }
      const user = authData.user
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .or(`user_id.eq.${user.id},is_default.eq.true`)
        .eq('type', type)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true })
      
      if (error) throw error
      setCategories(data || [])
      setCategoryId(prev => {
        const exists = (data || []).find(c => c.id === prev)
        return exists ? prev : (data?.[0]?.id || '')
      })
    } catch (err) {
      console.error('Fetch categories error:', err)
      setError('Gagal memuat kategori')
      setCategories([])
    } finally {
      setIsCatLoading(false)
    }
  }

  const handleKey = (key) => {
    if (key === 'clear') setRawAmount('')
    else if (key === 'backspace') setRawAmount(prev => prev.slice(0, -1))
    else if (key === 'done') setShowKeypad(false)
    else {
      if (rawAmount === '0' && key === '0') return
      setRawAmount(prev => (prev === '0' ? key : prev + key))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!rawAmount || parseFloat(rawAmount) <= 0) {
      setError('Masukkan jumlah yang valid')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.from('transactions').update({
        type,
        amount: parseFloat(rawAmount),
        description,
        date,
        category_id: categoryId,
      }).eq('id', id)
      
      if (error) throw error
      navigate('/transactions')
    } catch (err) {
      console.error('Update error:', err)
      setError(err.message || 'Gagal memperbarui transaksi')
    } finally {
      setLoading(false)
    }
  }

  const keypadKeys = [
    ['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['clear', '0', 'backspace']
  ]

  if (fetching) {
    return <div style={{...s.page, display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh'}}>Memuat data...</div>
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button onClick={() => navigate(-1)} style={s.iconBtn}><ChevronLeft size={20} /></button>
        <h2 style={s.title}>Edit Transaksi</h2>
        <div style={{ width: 36 }} />
      </div>

      <div style={s.typeToggle}>
        <button type="button" onClick={() => setType('expense')} style={type === 'expense' ? s.typeActive('expense') : s.typeInactive}>
          <TrendingDown size={14} /> Keluar
        </button>
        <button type="button" onClick={() => setType('income')} style={type === 'income' ? s.typeActive('income') : s.typeInactive}>
          <TrendingUp size={14} /> Masuk
        </button>
      </div>

      {error && <div style={s.error}>{error}</div>}

      <form onSubmit={handleSubmit} style={s.form}>
        <div style={s.amountDisplay} onClick={() => setShowKeypad(true)} role="button" tabIndex={0}>
          <span style={s.currency}>Rp</span>
          <span style={s.amountValue}>{displayAmount}</span>
          <span style={s.amountHint}>Ketuk untuk custom</span>
        </div>

        <div style={s.quickAmounts}>
          {quickAmounts.map(amt => (
            <button
              key={amt}
              type="button"
              onClick={() => setRawAmount(String(amt))}
              style={{...s.quickAmountBtn, background: rawAmount === String(amt) ? 'var(--gray-200)' : 'var(--gray-50)'}}
            >
              {formatRupiah(String(amt))}
            </button>
          ))}
        </div>

        <div style={s.fields}>
          <div style={s.field}>
            <label style={s.label}>Kategori</label>
            <select style={s.select} value={categoryId} onChange={e => setCategoryId(e.target.value)} required disabled={isCatLoading}>
              {isCatLoading ? (
                <option value="">Memuat kategori...</option>
              ) : categories.length === 0 ? (
                <option value="">Tidak ada kategori</option>
              ) : (
                categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)
              )}
            </select>
          </div>
          <div style={s.field}>
            <label style={s.label}>Tanggal</label>
            <input style={s.input} type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div style={s.field}>
            <label style={s.label}>Keterangan</label>
            <input style={s.input} type="text" placeholder="Opsional" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
        </div>

        <button type="submit" disabled={loading || !rawAmount} style={{...s.submitBtn, background: type === 'expense' ? 'var(--red)' : 'var(--green)', opacity: (loading || !rawAmount) ? 0.6 : 1}}>
          {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </form>

      {showKeypad && (
        <div style={s.keypadOverlay} onClick={() => setShowKeypad(false)}>
          <div style={s.keypad} onClick={e => e.stopPropagation()}>
            <div style={s.keypadHeader}>
              <span style={s.keypadTitle}>Edit Jumlah</span>
              <button onClick={() => setShowKeypad(false)} style={s.keypadClose}>✕</button>
            </div>
            <div style={s.keypadDisplay}>
              <span style={s.keypadCurrency}>Rp</span>
              <span style={s.keypadValue}>{displayAmount || '0'}</span>
            </div>
            <div style={s.keypadGrid}>
              {keypadKeys.map((row, i) => (
                <div key={i} style={s.keypadRow}>
                  {row.map(key => (
                    <button key={key} type="button" onClick={() => handleKey(key)} style={{...s.keypadBtn, background: key==='clear'||key==='backspace'?'var(--gray-100)':key==='0'?'var(--gray-50)':'var(--white)', color: key==='clear'||key==='backspace'?'var(--gray-600)':'var(--gray-900)', fontWeight: key==='0'?'600':'500'}}>
                      {key === 'backspace' ? '⌫' : key === 'clear' ? 'Hapus' : key}
                    </button>
                  ))}
                </div>
              ))}
              <button type="button" onClick={() => handleKey('done')} style={{...s.keypadBtn, ...s.keypadDone}}>Selesai</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ⚠️ Styles (Sama persis dengan AddTransaction)
const s = {
  page: { minHeight: '100vh', background: 'var(--bg, #f8fafc)', padding: '0 20px 40px', fontFamily: 'system-ui, -apple-system, sans-serif', boxSizing: 'border-box' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' },
  iconBtn: { padding: '8px', background: 'none', border: 'none', color: 'var(--gray-700, #334155)', cursor: 'pointer', display: 'flex', alignItems: 'center', borderRadius: '8px' },
  title: { fontSize: '18px', fontWeight: '700', color: 'var(--gray-900, #0f172a)', margin: 0 },
  typeToggle: { display: 'flex', gap: '8px', marginBottom: '24px' },
  typeActive: (type) => ({ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 12px', borderRadius: '10px', border: 'none', background: type === 'expense' ? 'var(--red, #e53e3e)' : 'var(--green, #38a169)', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }),
  typeInactive: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid var(--gray-200, #e2e8f0)', background: 'var(--white, #ffffff)', color: 'var(--gray-500, #64748b)', fontSize: '13px', fontWeight: '500', cursor: 'pointer' },
  error: { background: 'var(--red-pale, rgba(229,62,62,0.1))', color: 'var(--red, #e53e3e)', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  amountDisplay: { background: 'var(--white, #ffffff)', borderRadius: '16px', padding: '24px 20px', display: 'flex', alignItems: 'baseline', gap: '8px', boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))', border: '1px solid var(--border, #e2e8f0)', cursor: 'pointer', transition: 'all 0.2s' },
  currency: { fontSize: '18px', fontWeight: '600', color: 'var(--gray-400, #94a3b8)' },
  amountValue: { fontSize: '36px', fontWeight: '700', color: 'var(--gray-900, #0f172a)', letterSpacing: '-0.5px' },
  amountHint: { fontSize: '12px', color: 'var(--gray-400, #94a3b8)', marginLeft: 'auto' },
  quickAmounts: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' },
  quickAmountBtn: { padding: '10px', borderRadius: '10px', border: '1px solid var(--border, #e2e8f0)', background: 'var(--gray-50, #f8fafc)', color: 'var(--gray-800, #1e293b)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s' },
  fields: { background: 'var(--white, #ffffff)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border, #e2e8f0)' },
  field: { padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--gray-100, #f1f5f9)' },
  label: { fontSize: '14px', color: 'var(--gray-600, #475569)', fontWeight: '500' },
  select: { border: 'none', outline: 'none', fontSize: '14px', color: 'var(--gray-900, #0f172a)', textAlign: 'right', background: 'transparent', maxWidth: '180px', padding: '4px 0', cursor: 'pointer' },
  input: { border: 'none', outline: 'none', fontSize: '14px', color: 'var(--gray-900, #0f172a)', textAlign: 'right', background: 'transparent', maxWidth: '180px', padding: '4px 0' },
  submitBtn: { padding: '16px', borderRadius: '14px', border: 'none', color: '#fff', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'opacity 0.2s' },
  keypadOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 },
  keypad: { background: 'var(--white, #ffffff)', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: '400px', padding: '20px', boxShadow: '0 -4px 24px rgba(0,0,0,0.1)' },
  keypadHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  keypadTitle: { fontSize: '15px', fontWeight: '600', color: 'var(--gray-800, #1e293b)' },
  keypadClose: { background: 'var(--gray-100, #f1f5f9)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-600, #475569)', cursor: 'pointer', fontSize: '14px' },
  keypadDisplay: { background: 'var(--gray-50, #f8fafc)', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'baseline', gap: '6px' },
  keypadCurrency: { fontSize: '16px', fontWeight: '600', color: 'var(--gray-400, #94a3b8)' },
  keypadValue: { fontSize: '28px', fontWeight: '700', color: 'var(--gray-900, #0f172a)' },
  keypadGrid: { display: 'flex', flexDirection: 'column', gap: '10px' },
  keypadRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  keypadBtn: { padding: '16px', borderRadius: '14px', border: 'none', fontSize: '18px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' },
  keypadDone: { marginTop: '8px', background: 'var(--green, #38a169)', color: '#fff', fontWeight: '600', fontSize: '15px', padding: '14px' }
}