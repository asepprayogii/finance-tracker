import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { Wallet, List, Plus, BarChart2, ArrowLeft, Pencil, Check, X } from "lucide-react";

export default function Budget() {
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const navigate = useNavigate();

  useEffect(() => {
    fetchAll();
  }, [selectedMonth]);

  async function fetchAll() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user.id;

    // Hitung hari terakhir bulan yang dipilih dengan benar
    const [year, month] = selectedMonth.split("-");
    const lastDay = new Date(year, month, 0).getDate();
    const startDate = `${selectedMonth}-01`;
    const endDate = `${selectedMonth}-${String(lastDay).padStart(2, "0")}`;

    const [catRes, budgetRes, trxRes] = await Promise.all([
      supabase.from("categories").select("*").eq("user_id", uid).eq("type", "expense"),
      supabase.from("budgets").select("*").eq("user_id", uid).eq("month", selectedMonth),
      supabase.from("transactions").select("id, amount, category_id, type, date").eq("user_id", uid).eq("type", "expense").gte("date", startDate).lte("date", endDate),
    ]);

    setCategories(catRes.data || []);
    setBudgets(budgetRes.data || []);
    setTransactions(trxRes.data || []);
    setLoading(false);
  }

  async function saveBudget(categoryId) {
    if (!editAmount || parseFloat(editAmount) <= 0) return;
    const { data: userData } = await supabase.auth.getUser();

    const existing = budgets.find((b) => b.category_id === categoryId);

    if (existing) {
      await supabase
        .from("budgets")
        .update({ amount: parseFloat(editAmount) })
        .eq("id", existing.id);
    } else {
      await supabase.from("budgets").insert({
        user_id: userData.user.id,
        category_id: categoryId,
        amount: parseFloat(editAmount),
        month: selectedMonth,
      });
    }

    setEditingId(null);
    setEditAmount("");
    fetchAll();
  }

  async function deleteBudget(categoryId) {
    const existing = budgets.find((b) => b.category_id === categoryId);
    if (!existing) return;
    await supabase.from("budgets").delete().eq("id", existing.id);
    fetchAll();
  }

  function formatRupiah(amount) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  function getSpent(categoryId) {
    return transactions.filter((t) => t.category_id === categoryId).reduce((s, t) => s + t.amount, 0);
  }

  function getBudget(categoryId) {
    return budgets.find((b) => b.category_id === categoryId)?.amount || 0;
  }

  function getStatus(spent, budget) {
    if (budget === 0) return "none";
    const pct = (spent / budget) * 100;
    if (pct >= 100) return "over";
    if (pct >= 80) return "warning";
    return "safe";
  }

  const statusColor = { safe: "var(--green)", warning: "#f59e0b", over: "var(--red)", none: "var(--gray-300)" };
  const statusBg = { safe: "var(--green-pale)", warning: "#fff8e1", over: "var(--red-pale)", none: "var(--gray-100)" };
  const statusLabel = { safe: "Aman", warning: "Hampir Limit", over: "Melebihi Budget", none: "Belum diset" };

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Memuat...</div>;

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = categories.reduce((s, c) => s + getSpent(c.id), 0);
  const overBudgetCount = categories.filter((c) => {
    const b = getBudget(c.id);
    return b > 0 && getSpent(c.id) > b;
  }).length;

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <button onClick={() => navigate("/dashboard")} style={s.backBtn}>
          <ArrowLeft size={18} />
        </button>
        <span style={s.headerTitle}>Budget & Limit</span>
        <div style={{ width: 36 }} />
      </div>

      <div style={s.container}>
        {/* Pilih Bulan */}
        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={s.monthSelect}>
          {Array.from({ length: 6 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const val = d.toISOString().slice(0, 7);
            const label = d.toLocaleString("id-ID", { month: "long", year: "numeric" });
            return (
              <option key={val} value={val}>
                {label}
              </option>
            );
          })}
        </select>

        {/* Overview */}
        <div style={s.overviewCard}>
          <div style={s.overviewItem}>
            <p style={s.overviewLabel}>Total Budget</p>
            <p style={s.overviewAmount}>{formatRupiah(totalBudget)}</p>
          </div>
          <div style={s.overviewDivider} />
          <div style={s.overviewItem}>
            <p style={s.overviewLabel}>Total Dipakai</p>
            <p style={{ ...s.overviewAmount, color: totalSpent > totalBudget && totalBudget > 0 ? "var(--red)" : "var(--gray-800)" }}>{formatRupiah(totalSpent)}</p>
          </div>
          <div style={s.overviewDivider} />
          <div style={s.overviewItem}>
            <p style={s.overviewLabel}>Over Budget</p>
            <p style={{ ...s.overviewAmount, color: overBudgetCount > 0 ? "var(--red)" : "var(--green)" }}>{overBudgetCount} kategori</p>
          </div>
        </div>

        {/* Budget per Kategori */}
        <h3 style={s.sectionTitle}>Limit per Kategori</h3>
        <div style={s.catList}>
          {categories.map((cat) => {
            const spent = getSpent(cat.id);
            const budget = getBudget(cat.id);
            const status = getStatus(spent, budget);
            const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
            const isEditing = editingId === cat.id;

            return (
              <div key={cat.id} style={s.catCard}>
                <div style={s.catHeader}>
                  <div style={s.catLeft}>
                    <span style={s.catIcon}>{cat.icon}</span>
                    <span style={s.catName}>{cat.name}</span>
                  </div>
                  <div
                    style={{
                      ...s.statusBadge,
                      background: statusBg[status],
                      color: statusColor[status],
                    }}
                  >
                    {statusLabel[status]}
                  </div>
                </div>

                {/* Progress Bar */}
                {budget > 0 && (
                  <div style={s.progressBg}>
                    <div
                      style={{
                        ...s.progressFill,
                        width: `${pct}%`,
                        background: statusColor[status],
                      }}
                    />
                  </div>
                )}

                {/* Amount Info */}
                <div style={s.amountRow}>
                  <span style={s.spentText}>
                    Dipakai: <strong>{formatRupiah(spent)}</strong>
                  </span>
                  {budget > 0 && <span style={s.budgetText}>Limit: {formatRupiah(budget)}</span>}
                </div>

                {/* Edit Form */}
                {isEditing ? (
                  <div style={s.editRow}>
                    <input type="number" placeholder="Masukkan limit (Rp)" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} style={s.editInput} autoFocus />
                    <button onClick={() => saveBudget(cat.id)} style={s.saveBtn}>
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditAmount("");
                      }}
                      style={s.cancelBtn}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div style={s.actionRow}>
                    <button
                      onClick={() => {
                        setEditingId(cat.id);
                        setEditAmount(budget > 0 ? String(budget) : "");
                      }}
                      style={s.editBtn}
                    >
                      <Pencil size={13} />
                      {budget > 0 ? "Ubah Limit" : "Set Limit"}
                    </button>
                    {budget > 0 && (
                      <button onClick={() => deleteBudget(cat.id)} style={s.removeBtn}>
                        Hapus
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {categories.length === 0 && (
          <div style={s.empty}>
            <p style={s.emptyText}>Belum ada kategori pengeluaran</p>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={s.bottomNav}>
        <button style={s.navItem} onClick={() => navigate("/dashboard")}>
          <Wallet size={20} />
          <span>Dashboard</span>
        </button>
        <button style={s.navItem} onClick={() => navigate("/transactions")}>
          <List size={20} />
          <span>Transaksi</span>
        </button>
        <button style={s.navFab} onClick={() => navigate("/add-transaction")}>
          <Plus size={22} color="#fff" />
        </button>
        <button style={s.navItem} onClick={() => navigate("/analytics")}>
          <BarChart2 size={20} />
          <span>Analytics</span>
        </button>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "var(--gray-50)", paddingBottom: "80px" },
  header: { background: "var(--white)", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "var(--shadow-sm)", position: "sticky", top: 0, zIndex: 10 },
  backBtn: { width: 36, height: 36, background: "var(--gray-100)", border: "none", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gray-700)", cursor: "pointer" },
  headerTitle: { fontSize: "16px", fontWeight: "700", color: "var(--gray-800)" },
  container: { padding: "20px 16px", maxWidth: "480px", margin: "0 auto" },
  monthSelect: { width: "100%", padding: "12px", borderRadius: "var(--radius-md)", border: "1.5px solid var(--gray-200)", fontSize: "14px", fontWeight: "600", color: "var(--gray-800)", background: "var(--white)", marginBottom: "16px" },
  overviewCard: { background: "var(--white)", borderRadius: "var(--radius-md)", padding: "16px", display: "flex", justifyContent: "space-between", boxShadow: "var(--shadow-sm)", marginBottom: "24px" },
  overviewItem: { flex: 1, textAlign: "center" },
  overviewDivider: { width: "1px", background: "var(--gray-200)" },
  overviewLabel: { fontSize: "11px", color: "var(--gray-500)", marginBottom: "4px" },
  overviewAmount: { fontSize: "13px", fontWeight: "700", color: "var(--gray-800)" },
  sectionTitle: { fontSize: "15px", fontWeight: "700", color: "var(--gray-800)", marginBottom: "12px" },
  catList: { display: "flex", flexDirection: "column", gap: "12px" },
  catCard: { background: "var(--white)", borderRadius: "var(--radius-md)", padding: "16px", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: "10px" },
  catHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  catLeft: { display: "flex", alignItems: "center", gap: "8px" },
  catIcon: { fontSize: "20px" },
  catName: { fontSize: "15px", fontWeight: "600", color: "var(--gray-800)" },
  statusBadge: { fontSize: "11px", fontWeight: "600", padding: "3px 8px", borderRadius: "99px" },
  progressBg: { height: "6px", background: "var(--gray-100)", borderRadius: "99px", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: "99px", transition: "width 0.5s ease" },
  amountRow: { display: "flex", justifyContent: "space-between" },
  spentText: { fontSize: "13px", color: "var(--gray-600)" },
  budgetText: { fontSize: "13px", color: "var(--gray-500)" },
  editRow: { display: "flex", gap: "8px", alignItems: "center" },
  editInput: { flex: 1, padding: "10px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--gray-200)", fontSize: "14px" },
  saveBtn: { padding: "10px", background: "var(--green)", border: "none", borderRadius: "var(--radius-sm)", color: "#fff", display: "flex", alignItems: "center", cursor: "pointer" },
  cancelBtn: { padding: "10px", background: "var(--gray-100)", border: "none", borderRadius: "var(--radius-sm)", color: "var(--gray-600)", display: "flex", alignItems: "center", cursor: "pointer" },
  actionRow: { display: "flex", gap: "8px" },
  editBtn: { display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", background: "var(--gray-100)", border: "none", borderRadius: "var(--radius-sm)", fontSize: "13px", color: "var(--gray-700)", cursor: "pointer" },
  removeBtn: { padding: "8px 12px", background: "var(--red-pale)", border: "none", borderRadius: "var(--radius-sm)", fontSize: "13px", color: "var(--red)", cursor: "pointer" },
  empty: { textAlign: "center", padding: "40px 0" },
  emptyText: { color: "var(--gray-500)" },
  bottomNav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: "var(--white)",
    borderTop: "1px solid var(--gray-200)",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    padding: "8px 20px 12px",
    zIndex: 10,
  },
  navItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", background: "none", border: "none", color: "var(--gray-400)", fontSize: "11px", padding: "4px 16px" },
  navFab: { width: "52px", height: "52px", borderRadius: "50%", background: "var(--green)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(45,106,79,0.4)", marginTop: "-20px" },
};
