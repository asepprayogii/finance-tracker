import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { Plus, Wallet, TrendingUp, TrendingDown, Pencil, Trash2, List, SlidersHorizontal, X, BarChart2, FileDown} from "lucide-react";
import { exportTransactionsPDF } from "../utils/exportPDF";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const navigate = useNavigate();

  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    fetchCategories();
  }, []);
  useEffect(() => {
    fetchTransactions();
  }, [filterType, filterCategory, filterMonth]);

  async function fetchCategories() {
    const { data: userData } = await supabase.auth.getUser();
    const { data } = await supabase.from("categories").select("*").eq("user_id", userData.user.id);
    setCategories(data || []);
  }

  async function fetchTransactions() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    let query = supabase.from("transactions").select("*, categories(name, icon)").eq("user_id", userData.user.id).order("date", { ascending: false });

    if (filterMonth) {
      const [year, month] = filterMonth.split("-");
      const start = `${filterMonth}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const end = `${filterMonth}-${lastDay}`;
      query = query.gte("date", start).lte("date", end);
    }
    if (filterType !== "all") query = query.eq("type", filterType);
    if (filterCategory !== "all") query = query.eq("category_id", filterCategory);

    const { data } = await query;
    setTransactions(data || []);
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!confirm("Hapus transaksi ini?")) return;
    await supabase.from("transactions").delete().eq("id", id);
    fetchTransactions();
  }

  function formatRupiah(amount) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);

  const groupedByDate = transactions.reduce((acc, t) => {
    if (!acc[t.date]) acc[t.date] = [];
    acc[t.date].push(t);
    return acc;
  }, {});

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <h2 style={s.headerTitle}>Transaksi</h2>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => exportTransactionsPDF(transactions, filterMonth)} style={s.filterToggleBtn} title="Export PDF">
            <FileDown size={18} />
          </button>
          <button onClick={() => setShowFilter(!showFilter)} style={s.filterToggleBtn}>
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilter && (
        <div style={s.filterPanel}>
          <div style={s.filterRow}>
            <div style={s.filterField}>
              <label style={s.filterLabel}>Bulan</label>
              <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} style={s.filterInput} />
            </div>
            <div style={s.filterField}>
              <label style={s.filterLabel}>Tipe</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={s.filterInput}>
                <option value="all">Semua</option>
                <option value="income">Pemasukan</option>
                <option value="expense">Pengeluaran</option>
              </select>
            </div>
          </div>
          <div style={s.filterField}>
            <label style={s.filterLabel}>Kategori</label>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={s.filterInput}>
              <option value="all">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div style={s.container}>
        {/* Summary */}
        <div style={s.summaryRow}>
          <div style={s.summaryCard}>
            <TrendingUp size={16} color="var(--green)" />
            <div>
              <p style={s.summaryLabel}>Pemasukan</p>
              <p style={{ ...s.summaryAmount, color: "var(--green)" }}>{formatRupiah(totalIncome)}</p>
            </div>
          </div>
          <div style={s.summaryCard}>
            <TrendingDown size={16} color="var(--red)" />
            <div>
              <p style={s.summaryLabel}>Pengeluaran</p>
              <p style={{ ...s.summaryAmount, color: "var(--red)" }}>{formatRupiah(totalExpense)}</p>
            </div>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <p style={s.loadingText}>Memuat...</p>
        ) : transactions.length === 0 ? (
          <div style={s.empty}>
            <List size={40} color="var(--gray-400)" />
            <p style={s.emptyText}>Tidak ada transaksi</p>
          </div>
        ) : (
          Object.entries(groupedByDate).map(([date, trxs]) => (
            <div key={date} style={s.group}>
              <p style={s.groupDate}>{new Date(date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}</p>
              <div style={s.trxList}>
                {trxs.map((trx) => (
                  <div key={trx.id} style={s.trxItem}>
                    <div style={s.trxLeft}>
                      <div
                        style={{
                          ...s.trxIconBox,
                          background: trx.type === "income" ? "var(--green-pale)" : "var(--red-pale)",
                        }}
                      >
                        {trx.type === "income" ? <TrendingUp size={15} color="var(--green)" /> : <TrendingDown size={15} color="var(--red)" />}
                      </div>
                      <div>
                        <p style={s.trxCat}>{trx.categories?.name}</p>
                        {trx.description && <p style={s.trxDesc}>{trx.description}</p>}
                      </div>
                    </div>
                    <div style={s.trxRight}>
                      <p style={{ ...s.trxAmount, color: trx.type === "income" ? "var(--green)" : "var(--red)" }}>
                        {trx.type === "income" ? "+" : "-"}
                        {formatRupiah(trx.amount)}
                      </p>
                      <div style={s.trxActions}>
                        <button onClick={() => navigate(`/edit-transaction/${trx.id}`)} style={s.editBtn}>
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(trx.id)} style={s.deleteBtn}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Nav */}
      <div style={s.bottomNav}>
        <button style={s.navItem} onClick={() => navigate("/dashboard")}>
          <Wallet size={20} />
          <span>Dashboard</span>
        </button>
        <button style={s.navItemActive} onClick={() => navigate("/transactions")}>
          <List size={20} />
          <span>Transaksi</span>
        </button>
        <button style={s.navItem} onClick={() => navigate("/analytics")}>
          <BarChart2 size={20} />
          <span>Analytics</span>
        </button>
        <button style={s.navFab} onClick={() => navigate("/add-transaction")}>
          <Plus size={22} color="#fff" />
        </button>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "var(--gray-50)", paddingBottom: "80px" },
  header: { background: "var(--white)", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "var(--shadow-sm)", position: "sticky", top: 0, zIndex: 10 },
  headerTitle: { fontSize: "18px", fontWeight: "700" },
  filterToggleBtn: { padding: "8px", background: "var(--gray-100)", border: "none", borderRadius: "var(--radius-sm)", color: "var(--gray-600)", display: "flex", alignItems: "center" },
  filterPanel: { background: "var(--white)", padding: "16px 20px", borderBottom: "1px solid var(--gray-200)", display: "flex", flexDirection: "column", gap: "12px" },
  filterRow: { display: "flex", gap: "12px" },
  filterField: { display: "flex", flexDirection: "column", gap: "4px", flex: 1 },
  filterLabel: { fontSize: "12px", fontWeight: "500", color: "var(--gray-600)" },
  filterInput: { padding: "8px 10px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--gray-200)", fontSize: "13px", background: "var(--gray-50)", width: "100%" },
  container: { padding: "16px", maxWidth: "480px", margin: "0 auto" },
  summaryRow: { display: "flex", gap: "10px", marginBottom: "16px" },
  summaryCard: { flex: 1, background: "var(--white)", borderRadius: "var(--radius-md)", padding: "14px", display: "flex", gap: "10px", alignItems: "center", boxShadow: "var(--shadow-sm)" },
  summaryLabel: { fontSize: "11px", color: "var(--gray-500)", marginBottom: "2px" },
  summaryAmount: { fontSize: "14px", fontWeight: "700" },
  loadingText: { textAlign: "center", color: "var(--gray-500)", padding: "40px 0" },
  empty: { display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0", gap: "8px" },
  emptyText: { fontSize: "15px", color: "var(--gray-500)" },
  group: { marginBottom: "16px" },
  groupDate: { fontSize: "12px", fontWeight: "600", color: "var(--gray-500)", marginBottom: "8px", textTransform: "capitalize" },
  trxList: { background: "var(--white)", borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-sm)" },
  trxItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid var(--gray-100)" },
  trxLeft: { display: "flex", gap: "12px", alignItems: "center" },
  trxIconBox: { width: "36px", height: "36px", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  trxCat: { fontSize: "14px", fontWeight: "600", color: "var(--gray-800)" },
  trxDesc: { fontSize: "12px", color: "var(--gray-500)", marginTop: "2px" },
  trxRight: { textAlign: "right" },
  trxAmount: { fontSize: "14px", fontWeight: "700" },
  trxActions: { display: "flex", gap: "4px", marginTop: "6px", justifyContent: "flex-end" },
  editBtn: { padding: "5px", background: "var(--gray-100)", border: "none", borderRadius: "6px", color: "var(--gray-600)", display: "flex", alignItems: "center" },
  deleteBtn: { padding: "5px", background: "var(--red-pale)", border: "none", borderRadius: "6px", color: "var(--red)", display: "flex", alignItems: "center" },
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
  navItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", background: "none", border: "none", color: "var(--gray-400)", fontSize: "11px", padding: "4px 20px" },
  navItemActive: { display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", background: "none", border: "none", color: "var(--green)", fontSize: "11px", fontWeight: "600", padding: "4px 20px" },
  navFab: { width: "52px", height: "52px", borderRadius: "50%", background: "var(--green)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(45,106,79,0.4)", marginTop: "-20px" },
};
