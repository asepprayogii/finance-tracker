import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { Pie, Bar } from 'react-chartjs-2'
import { Plus, List, LogOut, TrendingUp, TrendingDown, Wallet } from 'lucide-react'

Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    fetchTransactions()
  }, [])

  async function fetchTransactions() {
    const { data: userData } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('transactions')
      .select('*, categories(name, icon)')
      .eq('user_id', userData.user.id)
    setTransactions(data || [])
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const balance = totalIncome - totalExpense

  const expenseByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const name = t.categories?.name || 'Lainnya'
      acc[name] = (acc[name] || 0) + t.amount
      return acc
    }, {})

  const pieData = {
    labels: Object.keys(expenseByCategory),
    datasets: [{
      data: Object.values(expenseByCategory),
      backgroundColor: ['#2d6a4f','#52b788','#74c69d','#95d5b2','#b7e4c7','#40916c','#1b4332','#081c15'],
      borderWidth: 0
    }]
  }

  const monthlyData = transactions.reduce((acc, t) => {
    const month = t.date?.slice(0, 7)
    if (!acc[month]) acc[month] = { income: 0, expense: 0 }
    acc[month][t.type] += t.amount
    return acc
  }, {})

  const months = Object.keys(monthlyData).sort()
  const barData = {
    labels: months,
    datasets: [
      { label: 'Pemasukan', data: months.map(m => monthlyData[m].income), backgroundColor: '#52b788', borderRadius: 6 },
      { label: 'Pengeluaran', data: months.map(m => monthlyData[m].expense), backgroundColor: '#e63946', borderRadius: 6 }
    ]
  }

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>Memuat...</div>

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.logoText}>FinTrack</span>
          <span style={s.greeting}>Halo, {user?.user_metadata?.full_name || user?.email} 👋</span>
        </div>
        <button onClick={handleLogout} style={s.logoutBtn}>
          <LogOut size={16} />
        </button>
      </div>

      <div style={s.container}>

        {/* Balance Card */}
        <div style={s.balanceCard}>
          <p style={s.balanceLabel}>Total Saldo</p>
          <p style={{ ...s.balanceAmount, color: balance >= 0 ? '#fff' : 'var(--red-pale)' }}>
            {formatRupiah(balance)}
          </p>
          <div style={s.balanceRow}>
            <div style={s.balanceItem}>
              <TrendingUp size={14} color="rgba(255,255,255,0.8)" />
              <span style={s.balanceItemLabel}>Pemasukan</span>
              <span style={s.balanceItemAmount}>{formatRupiah(totalIncome)}</span>
            </div>
            <div style={s.balanceDivider} />
            <div style={s.balanceItem}>
              <TrendingDown size={14} color="rgba(255,255,255,0.8)" />
              <span style={s.balanceItemLabel}>Pengeluaran</span>
              <span style={s.balanceItemAmount}>{formatRupiah(totalExpense)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={s.actionRow}>
          <button onClick={() => navigate('/add-transaction')} style={s.actionBtn}>
            <Plus size={18} />
            <span>Tambah</span>
          </button>
          <button onClick={() => navigate('/transactions')} style={s.actionBtnOutline}>
            <List size={18} />
            <span>Transaksi</span>
          </button>
        </div>

        {transactions.length === 0 ? (
          <div style={s.empty}>
            <Wallet size={40} color="var(--gray-400)" />
            <p style={s.emptyText}>Belum ada transaksi</p>
            <p style={s.emptySubText}>Mulai tambahkan transaksi pertamamu</p>
          </div>
        ) : (
          <>
            {/* Recent Transactions */}
            <div style={s.section}>
              <div style={s.sectionHeader}>
                <h3 style={s.sectionTitle}>Transaksi Terbaru</h3>
                <button onClick={() => navigate('/transactions')} style={s.seeAll}>Lihat semua</button>
              </div>
              <div style={s.trxList}>
                {recentTransactions.map(trx => (
                  <div key={trx.id} style={s.trxItem}>
                    <div style={s.trxLeft}>
                      <div style={{
                        ...s.trxIconBox,
                        background: trx.type === 'income' ? 'var(--green-pale)' : 'var(--red-pale)'
                      }}>
                        {trx.type === 'income'
                          ? <TrendingUp size={16} color="var(--green)" />
                          : <TrendingDown size={16} color="var(--red)" />
                        }
                      </div>
                      <div>
                        <p style={s.trxCat}>{trx.categories?.name}</p>
                        <p style={s.trxDesc}>{trx.description || trx.date}</p>
                      </div>
                    </div>
                    <span style={{
                      ...s.trxAmount,
                      color: trx.type === 'income' ? 'var(--green)' : 'var(--red)'
                    }}>
                      {trx.type === 'income' ? '+' : '-'}{formatRupiah(trx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Charts */}
            <div style={s.section}>
              <h3 style={s.sectionTitle}>Pengeluaran per Kategori</h3>
              <div style={s.chartCard}>
                <div style={{ maxWidth: '260px', margin: '0 auto' }}>
                  <Pie data={pieData} options={{ plugins: { legend: { position: 'bottom', labels: { font: { size: 12 } } } } }} />
                </div>
              </div>
            </div>

            <div style={s.section}>
              <h3 style={s.sectionTitle}>Pemasukan vs Pengeluaran</h3>
              <div style={s.chartCard}>
                <Bar data={barData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={s.bottomNav}>
        <button style={s.navItemActive} onClick={() => navigate('/dashboard')}>
          <Wallet size={20} />
          <span>Dashboard</span>
        </button>
        <button style={s.navItem} onClick={() => navigate('/transactions')}>
          <List size={20} />
          <span>Transaksi</span>
        </button>
        <button style={s.navFab} onClick={() => navigate('/add-transaction')}>
          <Plus size={22} color="#fff" />
        </button>
      </div>

    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: 'var(--gray-50)', paddingBottom: '80px' },
  header: { background: 'var(--white)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)', position: 'sticky', top: 0, zIndex: 10 },
  headerLeft: { display: 'flex', flexDirection: 'column' },
  logoText: { fontSize: '16px', fontWeight: '700', color: 'var(--green)' },
  greeting: { fontSize: '12px', color: 'var(--gray-500)', marginTop: '1px' },
  logoutBtn: { padding: '8px', background: 'var(--gray-100)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'var(--gray-600)', display: 'flex', alignItems: 'center' },
  container: { padding: '20px 16px', maxWidth: '480px', margin: '0 auto' },
  balanceCard: { background: 'linear-gradient(135deg, var(--green) 0%, #40916c 100%)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '16px', color: '#fff' },
  balanceLabel: { fontSize: '13px', opacity: 0.8, marginBottom: '6px' },
  balanceAmount: { fontSize: '32px', fontWeight: '700', marginBottom: '20px' },
  balanceRow: { display: 'flex', gap: '16px' },
  balanceItem: { display: 'flex', alignItems: 'center', gap: '6px', flex: 1 },
  balanceDivider: { width: '1px', background: 'rgba(255,255,255,0.2)' },
  balanceItemLabel: { fontSize: '11px', opacity: 0.8 },
  balanceItemAmount: { fontSize: '13px', fontWeight: '600', marginLeft: 'auto' },
  actionRow: { display: 'flex', gap: '10px', marginBottom: '20px' },
  actionBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px', background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontSize: '14px', fontWeight: '600' },
  actionBtnOutline: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px', background: 'var(--white)', color: 'var(--gray-700)', border: '1.5px solid var(--gray-200)', borderRadius: 'var(--radius-md)', fontSize: '14px', fontWeight: '600' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: '8px' },
  emptyText: { fontSize: '16px', fontWeight: '600', color: 'var(--gray-700)' },
  emptySubText: { fontSize: '13px', color: 'var(--gray-500)' },
  section: { marginBottom: '20px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  sectionTitle: { fontSize: '15px', fontWeight: '700', color: 'var(--gray-800)' },
  seeAll: { fontSize: '13px', color: 'var(--green)', background: 'none', border: 'none', fontWeight: '500' },
  trxList: { background: 'var(--white)', borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' },
  trxItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--gray-100)' },
  trxLeft: { display: 'flex', gap: '12px', alignItems: 'center' },
  trxIconBox: { width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  trxCat: { fontSize: '14px', fontWeight: '600', color: 'var(--gray-800)' },
  trxDesc: { fontSize: '12px', color: 'var(--gray-500)', marginTop: '2px' },
  trxAmount: { fontSize: '14px', fontWeight: '700', whiteSpace: 'nowrap' },
  chartCard: { background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: '20px', boxShadow: 'var(--shadow-sm)' },
  bottomNav: { position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--white)', borderTop: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '8px 20px 12px', zIndex: 10 },
  navItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', background: 'none', border: 'none', color: 'var(--gray-400)', fontSize: '11px', padding: '4px 20px' },
  navItemActive: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', background: 'none', border: 'none', color: 'var(--green)', fontSize: '11px', fontWeight: '600', padding: '4px 20px' },
  navFab: { width: '52px', height: '52px', borderRadius: '50%', background: 'var(--green)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(45,106,79,0.4)', marginTop: '-20px' },
}