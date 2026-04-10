import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  Title, Filler
} from "chart.js";
import { Pie, Bar, Line } from "react-chartjs-2";
import { 
  TrendingUp, TrendingDown, ArrowRight, Plus, 
  Clock, Banknote, Activity, PieChart, BarChart3, 
  Lightbulb, Sun, Receipt, ArrowUpCircle, ArrowDownCircle
} from "lucide-react";

// ✅ Register Chart.js components
ChartJS.register(
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  Title, Filler
);

// 🎨 Harmonious Color Palette
const CHART_COLORS = {
  pie: {
    expense: ["#63b3ed", "#9ae6b4", "#fbd38d", "#f6ad55", "#fc8181", "#9f7aea", "#7f9cf5", "#68d391"],
    income: ["#48bb78", "#68d391", "#9ae6b4", "#c6f6d5", "#38a169", "#2f855a", "#276749", "#22543d"]
  },
  bar: {
    income: "#48bb78",
    expense: "#f56565",
    incomeHover: "#38a169",
    expenseHover: "#e53e3e"
  },
  line: {
    stroke: "#4299e1",
    fill: "rgba(66, 153, 225, 0.1)",
    point: "#3182ce"
  },
  grid: "rgba(148, 163, 184, 0.2)",
  text: "#64748b"
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [incomeCategoryView, setIncomeCategoryView] = useState(false); // Toggle for category chart
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;
    
    const { data } = await supabase
      .from("transactions")
      .select("*, categories(name, icon), created_at")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });
    
    setTransactions(data || []);
    setLoading(false);
  }

  const formatRupiah = (amt) => 
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amt);

  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // ✅ A. Trend 7 Hari (Expense only)
  const get7DayExpenseData = () => {
    const today = new Date();
    const labels = [];
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      labels.push(date.toLocaleDateString("id-ID", { weekday: "short" }));
      
      const dayTotal = transactions
        .filter(t => t.type === "expense" && t.date === dateStr)
        .reduce((s, t) => s + t.amount, 0);
      data.push(dayTotal);
    }
    
    return {
      labels,
      datasets: [{
        label: "Pengeluaran",
        data,
        borderColor: CHART_COLORS.line.stroke,
        backgroundColor: CHART_COLORS.line.fill,
        pointBackgroundColor: CHART_COLORS.line.point,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
        borderWidth: 2
      }]
    };
  };

  // ✅ B. Expense by Category
  const expenseByCategory = transactions
    .filter(t => t.type === "expense")
    .reduce((acc, t) => {
      const name = t.categories?.name || "Lainnya";
      acc[name] = (acc[name] || 0) + t.amount;
      return acc;
    }, {});

  // ✅ NEW: Income by Category
  const incomeByCategory = transactions
    .filter(t => t.type === "income")
    .reduce((acc, t) => {
      const name = t.categories?.name || "Lainnya";
      acc[name] = (acc[name] || 0) + t.amount;
      return acc;
    }, {});

  const pieData = {
    labels: Object.keys(incomeCategoryView ? incomeByCategory : expenseByCategory),
    datasets: [{
      data: Object.values(incomeCategoryView ? incomeByCategory : expenseByCategory),
      backgroundColor: incomeCategoryView ? CHART_COLORS.pie.income : CHART_COLORS.pie.expense,
      borderWidth: 0,
      hoverOffset: 8
    }]
  };

  // ✅ C. Perbandingan Bulanan
  const monthlyData = transactions.reduce((acc, t) => {
    const m = t.date?.slice(0, 7);
    if (!m) return acc;
    if (!acc[m]) acc[m] = { income: 0, expense: 0 };
    acc[m][t.type] += t.amount;
    return acc;
  }, {});
  
  const months = Object.keys(monthlyData).sort().slice(-6);
  
  const barData = {
    labels: months.map(m => {
      const [y, mo] = m.split("-");
      return new Date(y, mo - 1).toLocaleDateString("id-ID", { month: "short" });
    }),
    datasets: [
      {
        label: "Pemasukan",
        data: months.map(m => monthlyData[m].income),
        backgroundColor: CHART_COLORS.bar.income,
        hoverBackgroundColor: CHART_COLORS.bar.incomeHover,
        borderRadius: 6,
        borderSkipped: false
      },
      {
        label: "Pengeluaran",
        data: months.map(m => monthlyData[m].expense),
        backgroundColor: CHART_COLORS.bar.expense,
        hoverBackgroundColor: CHART_COLORS.bar.expenseHover,
        borderRadius: 6,
        borderSkipped: false
      }
    ]
  };

  // ✅ FIX: Sorting logic - Date first, then timestamp
  const recent = [...transactions]
    .sort((a, b) => {
      // 1. Compare by transaction DATE first (YYYY-MM-DD string comparison works)
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateA !== dateB) {
        return dateB.localeCompare(dateA); // Newest date first
      }
      // 2. Same date: Compare by created_at timestamp
      const timeA = new Date(a.created_at || a.date || 0).getTime();
      const timeB = new Date(b.created_at || b.date || 0).getTime();
      return timeB - timeA; // Newest time first
    })
    .slice(0, 5);

  // Shared Chart Options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { font: { size: 11, family: "system-ui, sans-serif" }, padding: 12, color: CHART_COLORS.text }
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        titleColor: "#fff",
        bodyColor: "#e2e8f0",
        padding: 12,
        cornerRadius: 8,
        callbacks: { label: (ctx) => ` ${formatRupiah(ctx.parsed.y || ctx.parsed)}` }
      }
    },
    scales: {
      y: {
        grid: { color: CHART_COLORS.grid },
        ticks: {
          font: { size: 10 },
          color: CHART_COLORS.text,
          callback: (v) => v >= 1e6 ? `${(v/1e6).toFixed(1)}jt` : v >= 1e3 ? `${(v/1e3).toFixed(0)}rb` : v
        },
        border: { display: false }
      },
      x: { grid: { display: false }, ticks: { font: { size: 10 }, color: CHART_COLORS.text }, border: { display: false } }
    }
  };

  const lineOptions = {
    ...chartOptions,
    plugins: { ...chartOptions.plugins, legend: { display: false } }
  };

  const pieOptions = {
    ...chartOptions,
    cutout: "60%",
    plugins: {
      ...chartOptions.plugins,
      legend: {
        ...chartOptions.plugins.legend,
        position: "bottom",
        labels: { ...chartOptions.plugins.legend.labels, boxWidth: 12, padding: 10 }
      }
    }
  };

  if (loading) {
    return <div className="page-content" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", color: "var(--gray-400)" }}>Memuat dashboard...</div>;
  }

  return (
    <div className="page-content">
      {/* Hero Section */}
      <div style={s.hero}>
        <div style={s.heroInner}>
          <p style={s.heroGreeting}>
            <Sun size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
            Selamat datang, {user?.user_metadata?.full_name || "Pengguna"}
          </p>
          <div style={s.heroBody}>
            <div>
              <p style={s.heroLabel}>Total Saldo</p>
              <p style={{ ...s.heroAmount, color: balance >= 0 ? "#fff" : "#fca5a5" }}>{formatRupiah(balance)}</p>
            </div>
            <div style={s.heroStats}>
              <div style={s.heroStat}>
                <div style={s.heroStatIcon}><TrendingUp size={14} color="var(--green)" /></div>
                <div>
                  <p style={s.heroStatLabel}>Pemasukan</p>
                  <p style={s.heroStatVal}>{formatRupiah(totalIncome)}</p>
                </div>
              </div>
              <div style={s.heroStat}>
                <div style={{...s.heroStatIcon, background: "var(--red-pale)"}}><TrendingDown size={14} color="var(--red)" /></div>
                <div>
                  <p style={s.heroStatLabel}>Pengeluaran</p>
                  <p style={s.heroStatVal}>{formatRupiah(totalExpense)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div style={s.content}>
        {transactions.length === 0 ? (
          <div style={s.empty}>
            <Banknote size={40} color="var(--gray-300)" style={{ marginBottom: 8 }} />
            <p style={s.emptyTitle}>Belum ada transaksi</p>
            <p style={s.emptySubtitle}>Mulai catat pemasukan atau pengeluaran pertamamu</p>
            <button onClick={() => navigate("/add-transaction")} style={s.emptyBtn}>
              <Plus size={15} /> Tambah Transaksi
            </button>
          </div>
        ) : (
          <div className="dash-grid" style={s.grid}>
            
            {/* ✅ Card 1: Transaksi Terbaru (Date-first sorting) */}
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}><Clock size={16} style={{ marginRight: 8 }} />Transaksi Terbaru</h3>
                <button onClick={() => navigate("/transactions")} style={s.seeAllBtn}>Lihat semua <ArrowRight size={13} /></button>
              </div>
              <div style={s.trxList}>
                {recent.map((trx, i) => (
                  <div key={trx.id} style={{ ...s.trxItem, borderBottom: i < recent.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <div style={s.trxLeft}>
                      <div style={{ ...s.trxIcon, background: trx.type === "income" ? "var(--green-pale)" : "var(--red-pale)" }}>
                        {trx.type === "income" ? <TrendingUp size={15} color="var(--green)" /> : <TrendingDown size={15} color="var(--red)" />}
                      </div>
                      <div>
                        <p style={s.trxCat}>{trx.categories?.name || "Tanpa Kategori"}</p>
                        <p style={s.trxMeta}>
                          {trx.description || new Date(trx.created_at || trx.date).toLocaleString("id-ID", {
                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                          })}
                        </p>
                      </div>
                    </div>
                    <p style={{ ...s.trxAmt, color: trx.type === "income" ? "var(--green)" : "var(--red)" }}>
                      {trx.type === "income" ? "+" : "−"}{formatRupiah(trx.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ✅ Card 2: Trend 7 Hari */}
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}><Activity size={16} style={{ marginRight: 8 }} />Trend 7 Hari</h3>
              </div>
              <div style={s.chartContainer}>
                <Line data={get7DayExpenseData()} options={lineOptions} />
              </div>
              <p style={s.chartNote}>
                <Lightbulb size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                Tip: Lihat pola pengeluaran harianmu
              </p>
            </div>

            {/* ✅ Card 3: Kategori (Expense/Income Toggle) */}
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>
                  <PieChart size={16} style={{ marginRight: 8 }} />
                  {incomeCategoryView ? "Kategori Pemasukan" : "Kategori Pengeluaran"}
                </h3>
                {/* Toggle Switch */}
                <div style={s.toggleGroup}>
                  <button 
                    onClick={() => setIncomeCategoryView(false)}
                    style={{
                      ...s.toggleBtn,
                      background: !incomeCategoryView ? "var(--red)" : "var(--gray-100)",
                      color: !incomeCategoryView ? "#fff" : "var(--gray-600)"
                    }}
                  >
                    <ArrowDownCircle size={12} style={{ marginRight: 4 }} /> Keluar
                  </button>
                  <button 
                    onClick={() => setIncomeCategoryView(true)}
                    style={{
                      ...s.toggleBtn,
                      background: incomeCategoryView ? "var(--green)" : "var(--gray-100)",
                      color: incomeCategoryView ? "#fff" : "var(--gray-600)"
                    }}
                  >
                    <ArrowUpCircle size={12} style={{ marginRight: 4 }} /> Masuk
                  </button>
                </div>
              </div>
              {(incomeCategoryView ? Object.keys(incomeByCategory) : Object.keys(expenseByCategory)).length === 0 ? (
                <p style={s.noData}>
                  Belum ada {incomeCategoryView ? "pemasukan" : "pengeluaran"}
                </p>
              ) : (
                <div style={s.chartContainer}>
                  <Pie data={pieData} options={pieOptions} />
                </div>
              )}
            </div>

            {/* ✅ Card 4: Perbandingan Bulanan */}
            <div className="dash-wide" style={s.wideCard}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}><BarChart3 size={16} style={{ marginRight: 8 }} />Pemasukan vs Pengeluaran</h3>
              </div>
              <div style={{...s.chartContainer, minHeight: "280px"}}>
                <Bar data={barData} options={{ ...chartOptions, scales: { ...chartOptions.scales, x: { ...chartOptions.scales.x, stacked: false }, y: { ...chartOptions.scales.y, stacked: false } } }} />
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

// ⚠️ Styles
const s = {
  hero: { background: "linear-gradient(135deg, #1a9e6e 0%, #157a56 100%)", padding: "24px 20px 28px", borderRadius: "var(--radius-lg)", marginBottom: "24px" },
  heroInner: {},
  heroGreeting: { fontSize: "13px", color: "rgba(255,255,255,0.65)", marginBottom: "12px", fontWeight: "500" },
  heroBody: { display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "16px" },
  heroLabel: { fontSize: "12px", color: "rgba(255,255,255,0.6)", marginBottom: "4px", fontWeight: "500" },
  heroAmount: { fontSize: "32px", fontWeight: "800", letterSpacing: "-0.5px" },
  heroStats: { display: "flex", gap: "12px", flexWrap: "wrap" },
  heroStat: { display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.12)", borderRadius: "var(--radius-sm)", padding: "8px 12px", backdropFilter: "blur(4px)" },
  heroStatIcon: { width: "26px", height: "26px", borderRadius: "8px", background: "var(--green-pale)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  heroStatLabel: { fontSize: "10px", color: "rgba(255,255,255,0.6)", marginBottom: "2px" },
  heroStatVal: { fontSize: "12px", fontWeight: "700", color: "#fff" },
  content: {},
  grid: { display: "grid", gridTemplateColumns: "1fr", gap: "16px" },
  card: { background: "var(--white)", borderRadius: "var(--radius-lg)", padding: "20px", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" },
  wideCard: { background: "var(--white)", borderRadius: "var(--radius-lg)", padding: "20px", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" },
  cardTitle: { fontSize: "15px", fontWeight: "700", color: "var(--gray-800)", margin: 0, display: "flex", alignItems: "center" },
  seeAllBtn: { display: "flex", alignItems: "center", gap: "4px", fontSize: "12.5px", color: "var(--green)", background: "none", border: "none", fontWeight: "600", cursor: "pointer" },
  toggleGroup: { display: "flex", gap: "4px", background: "var(--gray-100)", padding: "3px", borderRadius: "8px" },
  toggleBtn: { 
    display: "flex", alignItems: "center", fontSize: "11px", fontWeight: "600", 
    padding: "6px 10px", borderRadius: "6px", border: "none", cursor: "pointer",
    transition: "all 0.15s"
  },
  chartContainer: { position: "relative", height: "200px", width: "100%" },
  chartNote: { fontSize: "11px", color: "var(--gray-400)", textAlign: "center", marginTop: "8px", fontStyle: "italic", display: "flex", alignItems: "center", justifyContent: "center" },
  noData: { fontSize: "13px", color: "var(--gray-400)", textAlign: "center", padding: "24px 0" },
  trxList: {},
  trxItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" },
  trxLeft: { display: "flex", gap: "10px", alignItems: "center" },
  trxIcon: { width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  trxCat: { fontSize: "13.5px", fontWeight: "600", color: "var(--gray-800)", margin: 0 },
  trxMeta: { fontSize: "11.5px", color: "var(--gray-400)", marginTop: "2px", margin: 0 },
  trxAmt: { fontSize: "14px", fontWeight: "700", whiteSpace: "nowrap" },
  empty: { display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 20px", gap: "10px", textAlign: "center" },
  emptyTitle: { fontSize: "18px", fontWeight: "700", color: "var(--gray-700)" },
  emptySubtitle: { fontSize: "14px", color: "var(--gray-400)", maxWidth: "260px" },
  emptyBtn: { display: "flex", alignItems: "center", gap: "6px", marginTop: "16px", padding: "12px 24px", background: "var(--green)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", fontSize: "14px", fontWeight: "600", cursor: "pointer" }
};

// Responsive Grid
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @media (min-width: 768px) {
      .dash-grid { grid-template-columns: repeat(2, 1fr); }
      .dash-wide { grid-column: 1 / -1; }
    }
  `;
  document.head.appendChild(style);
}