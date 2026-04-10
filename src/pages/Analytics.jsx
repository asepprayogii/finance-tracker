import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { Line } from "react-chartjs-2";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  Target,
  Award,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Info
} from "lucide-react";

// ✅ Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// 🎨 Minimal Color Palette (Hanya 2 warna utama + netral)
const COLORS = {
  income: "#14b8a6",
  incomeLight: "rgba(20, 184, 166, 0.1)",
  expense: "#f43f5e",
  expenseLight: "rgba(244, 63, 94, 0.1)",
  text: {
    primary: "#0f172a",
    secondary: "#64748b",
    muted: "#94a3b8",
  },
  bg: {
    card: "#ffffff",
    page: "#f8fafc",
    border: "#e2e8f0",
  },
};

export default function Analytics() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const navigate = useNavigate();

  // ✅ Helper: Get current user dengan cara aman
  async function getCurrentUser() {
    try {
      const result = await supabase.auth.getUser();
      return result.data?.user || null;
    } catch {
      return null;
    }
  }

  useEffect(() => { fetchTransactions(); }, []);

  async function fetchTransactions() {
    const user = await getCurrentUser();
    if (!user) return;
    
    const { data } = await supabase
      .from("transactions")
      .select("*, categories(name, icon)")
      .eq("user_id", user.id)
      .order("date", { ascending: true });
    
    setTransactions(data || []);
    setLoading(false);
  }

  const formatRupiah = (amt) => 
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amt);

  const monthlyTrx = transactions.filter((t) => t.date?.slice(0, 7) === selectedMonth);
  const monthIncome = monthlyTrx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthlyTrx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const savingRate = monthIncome > 0 ? Math.round(((monthIncome - monthExpense) / monthIncome) * 100) : 0;

  const daysInMonth = new Date(selectedMonth.split("-")[0], selectedMonth.split("-")[1], 0).getDate();
  const activeDays = new Set(monthlyTrx.map(t => t.date)).size;
  const avgDailyExpense = monthExpense > 0 && activeDays > 0 ? Math.round(monthExpense / activeDays) : 0;

  const expByCat = monthlyTrx
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => {
      const name = t.categories?.name || "Lainnya";
      acc[name] = (acc[name] || 0) + t.amount;
      return acc;
    }, {});
  
  const sortedCats = Object.entries(expByCat).sort((a, b) => b[1] - a[1]);
  const topExpenseCategory = sortedCats[0]?.[0] || null;
  const topExpenseAmount = sortedCats[0]?.[1] || 0;

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return d.toISOString().slice(0, 7);
  });
  
  const trendData = last6Months.map((month) => {
    const trx = transactions.filter((t) => t.date?.slice(0, 7) === month);
    return {
      month,
      income: trx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
      expense: trx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    };
  });

  // ✅ FIX: Tambah key "data:" sebelum trendData.map()
  const lineData = {
    labels: last6Months.map((m) => {
      const [y, mo] = m.split("-");
      return new Date(y, mo - 1).toLocaleString("id-ID", { month: "short" });
    }),
    datasets: [
      {
        label: "Pemasukan",
        data: trendData.map((d) => d.income),  // ← ✅ FIX: Tambah "data:"
        borderColor: COLORS.income,
        backgroundColor: COLORS.incomeLight,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: COLORS.income,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: "Pengeluaran",
        data: trendData.map((d) => d.expense),  // ← ✅ FIX: Tambah "data:"
        borderColor: COLORS.expense,
        backgroundColor: COLORS.expenseLight,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: COLORS.expense,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthStr = lastMonth.toISOString().slice(0, 7);
  const lastMonthTrx = transactions.filter((t) => t.date?.slice(0, 7) === lastMonthStr);
  const lastMonthExpense = lastMonthTrx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  
  const expenseDiff = monthExpense - lastMonthExpense;
  const expenseDiffPct = lastMonthExpense > 0 ? Math.round((expenseDiff / lastMonthExpense) * 100) : 0;
  const isExpenseDown = expenseDiff <= 0;

  const availableMonths = [...new Set(transactions.map((t) => t.date?.slice(0, 7)))].sort().reverse();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { font: { size: 11, family: "system-ui, sans-serif" }, padding: 12, color: COLORS.text.secondary },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        titleColor: "#fff",
        bodyColor: "#e2e8f0",
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => ` ${formatRupiah(ctx.parsed.y || ctx.parsed)}`,
        },
      },
    },
    scales: {
      y: {
        grid: { color: "rgba(148, 163, 184, 0.2)" },
        ticks: {
          font: { size: 10 },
          color: COLORS.text.secondary,
          callback: (v) => {
            if (v >= 1e6) return `${(v / 1e6).toFixed(1)}jt`;
            if (v >= 1e3) return `${(v / 1e3).toFixed(0)}rb`;
            return v;
          },
        },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, color: COLORS.text.secondary },
        border: { display: false },
      },
    },
  };

  if (loading) {
    return (
      <div className="page-content" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", color: COLORS.text.muted }}>
        Memuat analitik...
      </div>
    );
  }

  return (
    <div className="page-content" style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.pageTitle}>Analitik</h1>
          <p style={s.pageSubtitle}>Pantau kinerja keuangan Anda</p>
        </div>
        <div style={s.headerActions}>
          <Calendar size={16} color={COLORS.text.muted} style={{ marginRight: 8 }} />
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={s.monthSelect}>
            {availableMonths.map((m) => {
              const [y, mo] = m.split("-");
              const label = new Date(y, mo - 1).toLocaleString("id-ID", { month: "long", year: "numeric" });
              return (
                <option key={m} value={m}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={s.summaryGrid}>
        <div style={{ ...s.summaryCard, borderLeft: `4px solid ${COLORS.income}` }}>
          <div style={{ ...s.summaryIcon, background: COLORS.incomeLight }}>
            <TrendingUp size={18} color={COLORS.income} />
          </div>
          <div>
            <p style={s.summaryLabel}>Pemasukan</p>
            <p style={{ ...s.summaryAmount, color: COLORS.income }}>{formatRupiah(monthIncome)}</p>
          </div>
        </div>
        <div style={{ ...s.summaryCard, borderLeft: `4px solid ${COLORS.expense}` }}>
          <div style={{ ...s.summaryIcon, background: COLORS.expenseLight }}>
            <TrendingDown size={18} color={COLORS.expense} />
          </div>
          <div>
            <p style={s.summaryLabel}>Pengeluaran</p>
            <p style={{ ...s.summaryAmount, color: COLORS.expense }}>{formatRupiah(monthExpense)}</p>
          </div>
        </div>
        <div style={{ ...s.summaryCard, borderLeft: `4px solid ${savingRate >= 20 ? COLORS.income : savingRate >= 0 ? COLORS.text.muted : COLORS.expense}` }}>
          <div style={{ ...s.summaryIcon, background: savingRate >= 20 ? COLORS.incomeLight : savingRate >= 0 ? "rgba(148,163,184,0.1)" : COLORS.expenseLight }}>
            <Target size={18} color={savingRate >= 20 ? COLORS.income : savingRate >= 0 ? COLORS.text.muted : COLORS.expense} />
          </div>
          <div>
            <p style={s.summaryLabel}>Saving Rate</p>
            <p style={{ ...s.summaryAmount, color: savingRate >= 20 ? COLORS.income : savingRate >= 0 ? COLORS.text.secondary : COLORS.expense }}>
              {savingRate}%
            </p>
          </div>
        </div>
        <div style={{ ...s.summaryCard, borderLeft: `4px solid ${COLORS.text.muted}` }}>
          <div style={{ ...s.summaryIcon, background: "rgba(148,163,184,0.1)" }}>
            <Clock size={18} color={COLORS.text.muted} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <p style={s.summaryLabel}>Hari Aktif</p>
            <Info size={12} color={COLORS.text.muted} title="Hari di mana Anda mencatat transaksi" style={{ cursor: "help" }} />
          </div>
          <p style={{ ...s.summaryAmount, color: COLORS.text.primary }}>
            {activeDays} dari {daysInMonth} hari
          </p>
        </div>
      </div>

      {/* Insight Cards */}
      <div style={s.insightGrid}>
        <div style={s.insightCard}>
          <div style={s.insightHeader}>
            <Wallet size={14} color={COLORS.text.muted} />
            <span style={s.insightTitle}>Rata-rata Harian</span>
          </div>
          <p style={s.insightValue}>{formatRupiah(avgDailyExpense)}</p>
          <p style={s.insightDesc}>Pengeluaran per hari aktif</p>
        </div>
        <div style={s.insightCard}>
          <div style={s.insightHeader}>
            <Award size={14} color={COLORS.text.muted} />
            <span style={s.insightTitle}>Pengeluaran Terbesar</span>
          </div>
          <p style={s.insightValue}>{topExpenseCategory || "-"}</p>
          <p style={s.insightDesc}>
            {topExpenseAmount > 0 ? formatRupiah(topExpenseAmount) : "Belum ada pengeluaran"}
          </p>
        </div>
        {lastMonthExpense > 0 && (
          <div style={s.insightCard}>
            <div style={s.insightHeader}>
              {isExpenseDown ? <ArrowDownRight size={14} color={COLORS.income} /> : <ArrowUpRight size={14} color={COLORS.expense} />}
              <span style={s.insightTitle}>Trend Pengeluaran</span>
            </div>
            <p style={{ ...s.insightValue, color: isExpenseDown ? COLORS.income : COLORS.expense }}>
              {isExpenseDown ? "▼" : "▲"} {Math.abs(expenseDiffPct)}%
            </p>
            <p style={s.insightDesc}>
              {isExpenseDown ? "Lebih hemat" : "Lebih boros"} dari bulan lalu
            </p>
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div style={s.chartsSection}>
        <div style={s.chartCard}>
          <div style={s.chartHeader}>
            <BarChart3 size={16} color={COLORS.text.muted} style={{ marginRight: 8 }} />
            <h3 style={s.chartTitle}>Trend 6 Bulan</h3>
          </div>
          <div style={s.chartContainer}>
            <Line data={lineData} options={chartOptions} />
          </div>
        </div>
        {(monthIncome > 0 || monthExpense > 0) && (
          <div style={s.chartCard}>
            <div style={s.chartHeader}>
              <Target size={16} color={COLORS.text.muted} style={{ marginRight: 8 }} />
              <h3 style={s.chartTitle}>Proporsi Keuangan</h3>
            </div>
            <div style={s.ratioContainer}>
              <div style={s.ratioBar}>
                <div style={{
                  ...s.ratioFill,
                  width: `${monthIncome + monthExpense > 0 ? (monthIncome / (monthIncome + monthExpense)) * 100 : 50}%`,
                  background: COLORS.income,
                }} />
                <div style={{
                  ...s.ratioFill,
                  width: `${monthIncome + monthExpense > 0 ? (monthExpense / (monthIncome + monthExpense)) * 100 : 50}%`,
                  background: COLORS.expense,
                }} />
              </div>
              <div style={s.ratioLabels}>
                <span style={{ color: COLORS.income, fontWeight: 600 }}>
                  {monthIncome + monthExpense > 0 ? Math.round((monthIncome / (monthIncome + monthExpense)) * 100) : 0}% Pemasukan
                </span>
                <span style={{ color: COLORS.expense, fontWeight: 600 }}>
                  {monthIncome + monthExpense > 0 ? Math.round((monthExpense / (monthIncome + monthExpense)) * 100) : 0}% Pengeluaran
                </span>
              </div>
              <p style={s.ratioSummary}>
                {savingRate >= 20 
                  ? "🎯 Bagus! Anda menabung lebih dari 20% dari pemasukan." 
                  : savingRate >= 0 
                    ? "💡 Tip: Coba kurangi pengeluaran non-esensial untuk menabung lebih banyak." 
                    : "⚠️ Pengeluaran melebihi pemasukan. Evaluasi budget bulan depan."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      {sortedCats.length > 0 && (
        <div style={s.section}>
          <div style={s.sectionHeader}>
            <h3 style={s.sectionTitle}>Detail Pengeluaran per Kategori</h3>
            <span style={s.sectionCount}>{sortedCats.length} kategori</span>
          </div>
          <div style={s.catList}>
            {sortedCats.map(([name, amount], index) => {
              const pct = monthExpense > 0 ? Math.round((amount / monthExpense) * 100) : 0;
              const barWidth = `${(amount / (sortedCats[0]?.[1] || 1)) * 100}%`;
              const barColor = index === 0 ? COLORS.expense : COLORS.text.muted;
              
              return (
                <div key={name} style={s.catItem}>
                  <div style={s.catHeader}>
                    <div style={s.catInfo}>
                      <span style={{ ...s.catRank, background: index === 0 ? COLORS.expense : COLORS.bg.border, color: index === 0 ? "#fff" : COLORS.text.muted }}>
                        #{index + 1}
                      </span>
                      <span style={s.catName}>{name}</span>
                    </div>
                    <span style={{ ...s.catAmount, color: barColor }}>{formatRupiah(amount)}</span>
                  </div>
                  <div style={s.progressBg}>
                    <div style={{ ...s.progressFill, width: barWidth, background: barColor }} />
                  </div>
                  <span style={s.catPct}>{pct}% dari total pengeluaran</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {transactions.length === 0 && (
        <div style={s.empty}>
          <BarChart3 size={40} color={COLORS.text.muted} />
          <p style={s.emptyTitle}>Belum ada data untuk dianalisis</p>
          <p style={s.emptyDesc}>Mulai catat transaksi untuk melihat analitik keuangan Anda</p>
          <button onClick={() => navigate("/add-transaction")} style={s.emptyBtn}>
            + Tambah Transaksi Pertama
          </button>
        </div>
      )}
    </div>
  );
}

// ⚠️ Styles - Minimal & Clean
const s = {
  page: {
    minHeight: "100vh",
    background: COLORS.bg.page,
    padding: "0 20px 40px",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 0",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "12px",
  },
  pageTitle: { fontSize: "22px", fontWeight: "700", color: COLORS.text.primary, margin: 0 },
  pageSubtitle: { fontSize: "13px", color: COLORS.text.secondary, marginTop: "4px" },
  headerActions: { display: "flex", alignItems: "center", gap: "8px" },
  monthSelect: {
    padding: "10px 14px", borderRadius: "12px", border: `1.5px solid ${COLORS.bg.border}`,
    fontSize: "14px", fontWeight: "500", color: COLORS.text.primary,
    background: COLORS.bg.card, cursor: "pointer", outline: "none",
  },
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "20px" },
  summaryCard: {
    background: COLORS.bg.card, borderRadius: "16px", padding: "16px",
    display: "flex", alignItems: "center", gap: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: `1px solid ${COLORS.bg.border}`,
  },
  summaryIcon: { width: "40px", height: "40px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  summaryLabel: { fontSize: "11px", color: COLORS.text.secondary, marginBottom: "2px" },
  summaryAmount: { fontSize: "16px", fontWeight: "700" },
  insightGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "24px" },
  insightCard: { background: COLORS.bg.card, borderRadius: "16px", padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: `1px solid ${COLORS.bg.border}` },
  insightHeader: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" },
  insightTitle: { fontSize: "12px", fontWeight: "500", color: COLORS.text.secondary },
  insightValue: { fontSize: "18px", fontWeight: "700", color: COLORS.text.primary, marginBottom: "4px" },
  insightDesc: { fontSize: "11px", color: COLORS.text.muted },
  chartsSection: { display: "grid", gridTemplateColumns: "1fr", gap: "16px", marginBottom: "24px" },
  chartCard: { background: COLORS.bg.card, borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: `1px solid ${COLORS.bg.border}` },
  chartHeader: { display: "flex", alignItems: "center", marginBottom: "16px" },
  chartTitle: { fontSize: "15px", fontWeight: "600", color: COLORS.text.primary, margin: 0 },
  chartContainer: { position: "relative", height: "220px", width: "100%" },
  ratioContainer: { display: "flex", flexDirection: "column", gap: "12px" },
  ratioBar: { display: "flex", height: "12px", borderRadius: "99px", overflow: "hidden", background: COLORS.bg.border },
  ratioFill: { height: "100%", transition: "width 0.4s ease" },
  ratioLabels: { display: "flex", justifyContent: "space-between", fontSize: "11px" },
  ratioSummary: { 
    fontSize: "12px", 
    color: COLORS.text.secondary, 
    paddingTop: "8px", 
    borderTop: `1px dashed ${COLORS.bg.border}`,
    lineHeight: "1.4",
  },
  section: { marginBottom: "20px" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  sectionTitle: { fontSize: "15px", fontWeight: "600", color: COLORS.text.primary, margin: 0 },
  sectionCount: { fontSize: "12px", color: COLORS.text.muted, fontWeight: "500" },
  catList: { background: COLORS.bg.card, borderRadius: "16px", padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: `1px solid ${COLORS.bg.border}`, display: "flex", flexDirection: "column", gap: "14px" },
  catItem: { display: "flex", flexDirection: "column", gap: "6px" },
  catHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  catInfo: { display: "flex", alignItems: "center", gap: "10px" },
  catRank: { width: "24px", height: "24px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "600", flexShrink: 0 },
  catName: { fontSize: "14px", fontWeight: "500", color: COLORS.text.primary },
  catAmount: { fontSize: "14px", fontWeight: "700" },
  progressBg: { height: "6px", background: COLORS.bg.border, borderRadius: "99px", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: "99px", transition: "width 0.4s ease" },
  catPct: { fontSize: "11px", color: COLORS.text.muted },
  empty: { display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 20px", gap: "12px", textAlign: "center", background: COLORS.bg.card, borderRadius: "16px", border: `1px dashed ${COLORS.bg.border}` },
  emptyTitle: { fontSize: "16px", fontWeight: "600", color: COLORS.text.primary },
  emptyDesc: { fontSize: "13px", color: COLORS.text.secondary, maxWidth: "280px" },
  emptyBtn: { marginTop: "8px", padding: "10px 20px", background: COLORS.income, color: "#fff", border: "none", borderRadius: "12px", fontSize: "13px", fontWeight: "600", cursor: "pointer" },
};

// Responsive adjustments
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @media (min-width: 768px) {
      .chartsSection { grid-template-columns: repeat(2, 1fr); }
    }
  `;
  document.head.appendChild(style);
}