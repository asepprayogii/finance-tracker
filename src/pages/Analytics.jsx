import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement } from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { TrendingUp, TrendingDown, BarChart2 } from "lucide-react";

Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement);

export default function Analytics() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const navigate = useNavigate();

  useEffect(() => {
    fetchTransactions();
  }, []);
  async function fetchTransactions() {
    const { data: userData } = await supabase.auth.getUser();
    const { data } = await supabase.from("transactions").select("*, categories(name, icon)").eq("user_id", userData.user.id).order("date", { ascending: true });
    setTransactions(data || []);
    setLoading(false);
  }

  const formatRupiah = (amt) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amt);
  const monthlyTrx = transactions.filter((t) => t.date?.slice(0, 7) === selectedMonth);
  const monthIncome = monthlyTrx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthlyTrx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const savingRate = monthIncome > 0 ? Math.round(((monthIncome - monthExpense) / monthIncome) * 100) : 0;

  const expByCat = monthlyTrx
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => {
      acc[t.categories?.name || "Lainnya"] = (acc[t.categories?.name || "Lainnya"] || 0) + t.amount;
      return acc;
    }, {});
  const sortedCats = Object.entries(expByCat).sort((a, b) => b[1] - a[1]);
  const maxCatAmount = sortedCats[0]?.[1] || 1;

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return d.toISOString().slice(0, 7);
  });
  const trendData = last6Months.map((month) => {
    const trx = transactions.filter((t) => t.date?.slice(0, 7) === month);
    return { month, income: trx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0), expense: trx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0) };
  });
  const lineData = {
    labels: last6Months.map((m) => {
      const [y, mo] = m.split("-");
      return new Date(y, mo - 1).toLocaleString("id-ID", { month: "short" });
    }),
    datasets: [
      { label: "Pemasukan", data: trendData.map((d) => d.income), borderColor: "#52b788", backgroundColor: "rgba(82,183,136,0.1)", tension: 0.4, fill: true, pointBackgroundColor: "#52b788" },
      { label: "Pengeluaran", data: trendData.map((d) => d.expense), borderColor: "#e63946", backgroundColor: "rgba(230,57,70,0.1)", tension: 0.4, fill: true, pointBackgroundColor: "#e63946" },
    ],
  };

  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthStr = lastMonth.toISOString().slice(0, 7);
  const lastMonthTrx = transactions.filter((t) => t.date?.slice(0, 7) === lastMonthStr);
  const lastMonthExpense = lastMonthTrx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const expenseDiff = monthExpense - lastMonthExpense;
  const expenseDiffPct = lastMonthExpense > 0 ? Math.round((expenseDiff / lastMonthExpense) * 100) : 0;
  const availableMonths = [...new Set(transactions.map((t) => t.date?.slice(0, 7)))].sort().reverse();

  if (loading)
    return (
      <div className="page-content" style={{ textAlign: "center", padding: "40px", color: "var(--gray-400)" }}>
        Memuat...
      </div>
    );

  return (
    <div className="page-content">
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

      <div style={s.cardRow}>
        <div style={{ ...s.summaryCard, background: "var(--green)" }}>
          <TrendingUp size={16} color="rgba(255,255,255,0.8)" />
          <p style={s.cardLabel}>Pemasukan</p>
          <p style={s.cardAmount}>{formatRupiah(monthIncome)}</p>
        </div>
        <div style={{ ...s.summaryCard, background: "#e63946" }}>
          <TrendingDown size={16} color="rgba(255,255,255,0.8)" />
          <p style={s.cardLabel}>Pengeluaran</p>
          <p style={s.cardAmount}>{formatRupiah(monthExpense)}</p>
        </div>
      </div>

      <div style={s.savingCard}>
        <div style={s.savingLeft}>
          <p style={s.savingLabel}>Saving Rate Bulan Ini</p>
          <p style={s.savingDesc}>Persentase pemasukan yang berhasil ditabung</p>
        </div>
        <div style={{ ...s.savingBadge, background: savingRate >= 20 ? "var(--green-pale)" : savingRate >= 0 ? "#fff8e1" : "var(--red-pale)", color: savingRate >= 20 ? "var(--green)" : savingRate >= 0 ? "#f59e0b" : "var(--red)" }}>
          {savingRate}%
        </div>
      </div>

      {lastMonthExpense > 0 && (
        <div style={s.compareCard}>
          <p style={s.compareLabel}>vs Bulan Lalu</p>
          <p style={{ ...s.compareDiff, color: expenseDiff <= 0 ? "var(--green)" : "var(--red)" }}>
            {expenseDiff <= 0 ? "▼" : "▲"} {Math.abs(expenseDiffPct)}% pengeluaran
          </p>
          <p style={s.compareDesc}>{expenseDiff <= 0 ? `Hemat ${formatRupiah(Math.abs(expenseDiff))} dari bulan lalu` : `Lebih boros ${formatRupiah(expenseDiff)} dari bulan lalu`}</p>
        </div>
      )}

      <div style={s.section}>
        <h3 style={s.sectionTitle}>Trend 6 Bulan Terakhir</h3>
        <div className="chart-wrapper" style={s.chartCard}>
          {/* Trend 6 Bulan */}
          <div style={s.section}>
            <h3 style={s.sectionTitle}>Trend 6 Bulan Terakhir</h3>
            <div className="chart-wrapper" style={s.chartCard}>
              <Line
                data={lineData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: "bottom", labels: { font: { size: 12 } } },
                  },
                  scales: {
                    y: {
                      ticks: {
                        callback: function (value) {
                          return "Rp " + (value / 1000000).toFixed(1) + "jt";
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {sortedCats.length > 0 && (
        <div style={s.section}>
          <h3 style={s.sectionTitle}>Pengeluaran per Kategori</h3>
          <div style={s.catList}>
            {sortedCats.map(([name, amount]) => (
              <div key={name} style={s.catItem}>
                <div style={s.catTop}>
                  <span style={s.catName}>{name}</span>
                  <span style={s.catAmount}>{formatRupiah(amount)}</span>
                </div>
                <div style={s.progressBg}>
                  <div style={{ ...s.progressFill, width: `${(amount / maxCatAmount) * 100}%` }} />
                </div>
                <span style={s.catPct}>{monthExpense > 0 ? Math.round((amount / monthExpense) * 100) : 0}% dari total pengeluaran</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {transactions.length === 0 && (
        <div style={s.empty}>
          <BarChart2 size={40} color="var(--gray-400)" />
          <p style={s.emptyText}>Belum ada data untuk dianalisis</p>
        </div>
      )}
    </div>
  );
}

const s = {
  monthSelect: { width: "100%", padding: "12px", borderRadius: "var(--radius-md)", border: "1.5px solid var(--gray-200)", fontSize: "14px", fontWeight: "600", color: "var(--gray-800)", background: "var(--white)", marginBottom: "16px" },
  cardRow: { display: "flex", gap: "10px", marginBottom: "12px" },
  summaryCard: { flex: 1, borderRadius: "var(--radius-md)", padding: "16px", color: "#fff", display: "flex", flexDirection: "column", gap: "6px" },
  cardLabel: { fontSize: "12px", opacity: 0.85 },
  cardAmount: { fontSize: "16px", fontWeight: "700" },
  savingCard: {
    background: "var(--white)",
    borderRadius: "var(--radius-md)",
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "var(--shadow-sm)",
    marginBottom: "12px",
    border: "1px solid var(--border)",
  },
  savingLeft: { flex: 1 },
  savingLabel: { fontSize: "14px", fontWeight: "600", color: "var(--gray-800)" },
  savingDesc: { fontSize: "12px", color: "var(--gray-500)", marginTop: "2px" },
  savingBadge: { fontSize: "20px", fontWeight: "700", padding: "8px 14px", borderRadius: "var(--radius-md)" },
  compareCard: { background: "var(--white)", borderRadius: "var(--radius-md)", padding: "16px", boxShadow: "var(--shadow-sm)", marginBottom: "20px", border: "1px solid var(--border)" },
  compareLabel: { fontSize: "12px", color: "var(--gray-500)", marginBottom: "4px" },
  compareDiff: { fontSize: "18px", fontWeight: "700", marginBottom: "4px" },
  compareDesc: { fontSize: "13px", color: "var(--gray-600)" },
  section: { marginBottom: "20px" },
  sectionTitle: { fontSize: "15px", fontWeight: "700", color: "var(--gray-800)", marginBottom: "12px" },
  chartCard: { background: "var(--white)", borderRadius: "var(--radius-md)", padding: "20px", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" },
  catList: { background: "var(--white)", borderRadius: "var(--radius-md)", padding: "16px", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: "16px", border: "1px solid var(--border)" },
  catItem: { display: "flex", flexDirection: "column", gap: "6px" },
  catTop: { display: "flex", justifyContent: "space-between" },
  catName: { fontSize: "14px", fontWeight: "600", color: "var(--gray-800)" },
  catAmount: { fontSize: "14px", fontWeight: "700", color: "var(--red)" },
  progressBg: { height: "6px", background: "var(--gray-100)", borderRadius: "99px", overflow: "hidden" },
  progressFill: { height: "100%", background: "var(--green)", borderRadius: "99px", transition: "width 0.5s ease" },
  catPct: { fontSize: "11px", color: "var(--gray-400)" },
  empty: { display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0", gap: "8px" },
  emptyText: { fontSize: "15px", color: "var(--gray-500)" },
};
