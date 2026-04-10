import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { 
  Wallet, Pencil, Check, X, TrendingUp, TrendingDown, 
  Settings, AlertCircle, CheckCircle, ArrowUp, ArrowDown,
  Calendar
} from "lucide-react";

export default function Budget() {
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const navigate = useNavigate();

  useEffect(() => { fetchAll(); }, [selectedMonth]);

  // ✅ Helper: Get current user dengan cara aman
  async function getCurrentUser() {
    try {
      const result = await supabase.auth.getUser();
      return result.data?.user || null;
    } catch {
      return null;
    }
  }

  async function fetchAll() {
    setLoading(true);
    const user = await getCurrentUser();
    if (!user) { setLoading(false); return; }
    
    const uid = user.id;
    const [year, month] = selectedMonth.split("-");
    const lastDay = new Date(year, month, 0).getDate();
    const startDate = `${selectedMonth}-01`;
    const endDate = `${selectedMonth}-${String(lastDay).padStart(2, "0")}`;

    const [catRes, budgetRes, trxRes] = await Promise.all([
      supabase.from("categories")
        .select("*")
        .or(`user_id.eq.${uid},is_default.eq.true`)
        .eq("type", "expense")
        .order("is_default", { ascending: false })
        .order("name", { ascending: true }),
      
      supabase.from("budgets").select("*").eq("user_id", uid).eq("month", selectedMonth),
      
      supabase.from("transactions")
        .select("id, amount, category_id, type, date")
        .eq("user_id", uid)
        .eq("type", "expense")
        .gte("date", startDate)
        .lte("date", endDate),
    ]);
    
    setCategories(catRes.data || []);
    setBudgets(budgetRes.data || []);
    setTransactions(trxRes.data || []);
    setLoading(false);
  }

  async function saveBudget(categoryId) {
    if (!editAmount || parseFloat(editAmount) <= 0) return;
    const user = await getCurrentUser();
    if (!user) return;
    
    const existing = budgets.find((b) => b.category_id === categoryId);
    
    if (existing) {
      await supabase.from("budgets")
        .update({ amount: parseFloat(editAmount) })
        .eq("id", existing.id);
    } else {
      await supabase.from("budgets").insert({ 
        user_id: user.id, 
        category_id: categoryId, 
        amount: parseFloat(editAmount), 
        month: selectedMonth 
      });
    }
    setEditingId(null); 
    setEditAmount(""); 
    fetchAll();
  }

  const cancelEdit = () => { setEditingId(null); setEditAmount(""); };

  const formatRupiah = (amt) => new Intl.NumberFormat("id-ID", { 
    style: "currency", 
    currency: "IDR", 
    minimumFractionDigits: 0 
  }).format(amt);
  
  const getSpent = (id) => transactions
    .filter((t) => t.category_id === id)
    .reduce((s, t) => s + t.amount, 0);
  
  const getBudget = (id) => budgets.find((b) => b.category_id === id)?.amount || 0;
  
  const getStatus = (spent, budget) => {
    if (budget === 0) return "none";
    const pct = (spent / budget) * 100;
    if (pct >= 100) return "over";
    if (pct >= 80) return "warning";
    return "safe";
  };
  
  const statusConfig = { 
    safe: { color: "var(--green)", bg: "rgba(82,183,136,0.1)", icon: CheckCircle },
    warning: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", icon: AlertCircle },
    over: { color: "var(--red)", bg: "rgba(229,62,62,0.1)", icon: AlertCircle },
    none: { color: "var(--gray-400)", bg: "rgba(148,163,184,0.05)", icon: Settings }
  };

  if (loading) return <div style={s.loading}>Memuat...</div>;
  
  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = categories.reduce((s, c) => s + getSpent(c.id), 0);
  const remaining = totalBudget - totalSpent;

  // ✅ FIX: Sorting - Budget yang sudah diset di atas, belum diset di bawah
  const sortedCategories = [...categories].sort((a, b) => {
    const budgetA = getBudget(a.id);
    const budgetB = getBudget(b.id);
    
    // Prioritas 1: Yang sudah ada budget-nya di atas
    if (budgetA > 0 && budgetB === 0) return -1;
    if (budgetA === 0 && budgetB > 0) return 1;
    
    // Prioritas 2: Jika sama-sama ada budget, urutkan by % usage (yang hampir habis di atas)
    if (budgetA > 0 && budgetB > 0) {
      const pctA = getSpent(a.id) / budgetA;
      const pctB = getSpent(b.id) / budgetB;
      return pctB - pctA; // Descending: yang % lebih tinggi di atas
    }
    
    // Prioritas 3: Jika sama-sama tidak ada budget, urutkan alfabetis
    return a.name.localeCompare(b.name);
  });

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.pageTitle}>Anggaran</h1>
          <p style={s.pageSubtitle}>Kelola limit pengeluaran per kategori</p>
        </div>
        <div style={s.headerActions}>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={s.monthSelect}>
            {Array.from({ length: 6 }, (_, i) => {
              const d = new Date();
              d.setMonth(d.getMonth() - i);
              const val = d.toISOString().slice(0, 7);
              const label = d.toLocaleString("id-ID", { month: "long", year: "numeric" });
              return <option key={val} value={val}>{label}</option>;
            })}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={s.summaryGrid}>
        <div style={s.summaryCard}>
          <div style={s.summaryIcon}>
            <Wallet size={18} color="var(--green)" />
          </div>
          <div>
            <p style={s.summaryLabel}>Total Anggaran</p>
            <p style={s.summaryAmount}>{totalBudget > 0 ? formatRupiah(totalBudget) : "Belum diset"}</p>
          </div>
        </div>
        <div style={s.summaryCard}>
          <div style={{...s.summaryIcon, background: "var(--red-pale)"}}>
            <TrendingDown size={18} color="var(--red)" />
          </div>
          <div>
            <p style={s.summaryLabel}>Total Terpakai</p>
            <p style={s.summaryAmount}>{formatRupiah(totalSpent)}</p>
          </div>
        </div>
        <div style={s.summaryCard}>
          <div style={{...s.summaryIcon, background: remaining >= 0 ? "var(--green-pale)" : "var(--red-pale)"}}>
            {remaining >= 0 
              ? <ArrowUp size={18} color="var(--green)" /> 
              : <ArrowDown size={18} color="var(--red)" />
            }
          </div>
          <div>
            <p style={s.summaryLabel}>Sisa Anggaran</p>
            <p style={{...s.summaryAmount, color: remaining >= 0 ? "var(--green)" : "var(--red)"}}>
              {formatRupiah(remaining)}
            </p>
          </div>
        </div>
      </div>

      {/* Category List */}
      <div style={s.categorySection}>
        <div style={s.sectionHeader}>
          <h3 style={s.sectionTitle}>Kategori Pengeluaran</h3>
          <span style={s.sectionCount}>{sortedCategories.length} kategori</span>
        </div>
        
        <div style={s.categoryList}>
          {sortedCategories.length === 0 ? (
            <div style={s.empty}>
              <Settings size={40} color="var(--gray-300)" />
              <p style={s.emptyText}>Belum ada kategori pengeluaran</p>
            </div>
          ) : (
            sortedCategories.map((cat) => {
              const spent = getSpent(cat.id);
              const budget = getBudget(cat.id);
              const status = getStatus(spent, budget);
              const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
              const isEditing = editingId === cat.id;
              const config = statusConfig[status];
              const StatusIcon = config.icon;

              return (
                <div key={cat.id} style={s.categoryCard}>
                  {/* Category Header */}
                  <div style={s.categoryHeader}>
                    <div style={s.categoryInfo}>
                      <div style={{...s.categoryIconBox, background: config.bg}}>
                        <StatusIcon size={16} color={config.color} />
                      </div>
                      <span style={s.categoryName}>{cat.name}</span>
                    </div>
                    {budget > 0 ? (
                      <span style={{...s.statusBadge, background: config.bg, color: config.color}}>
                        {pct.toFixed(0)}%
                      </span>
                    ) : (
                      <span style={{...s.statusBadge, background: config.bg, color: config.color}}>
                        Belum diset
                      </span>
                    )}
                  </div>

                  {/* Amount Row */}
                  {budget > 0 && (
                    <div style={s.amountRow}>
                      <div style={s.amountItem}>
                        <p style={s.amountLabel}>Terpakai</p>
                        <p style={s.amountValue}>{formatRupiah(spent)}</p>
                      </div>
                      <div style={s.amountDivider} />
                      <div style={s.amountItem}>
                        <p style={s.amountLabel}>Limit</p>
                        <p style={s.amountValue}>{formatRupiah(budget)}</p>
                      </div>
                      <div style={s.amountDivider} />
                      <div style={s.amountItem}>
                        <p style={s.amountLabel}>Sisa</p>
                        <p style={{...s.amountValue, color: budget - spent >= 0 ? "var(--green)" : "var(--red)"}}>
                          {formatRupiah(Math.max(budget - spent, 0))}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Progress Bar */}
                  {budget > 0 && (
                    <div style={s.progressWrapper}>
                      <div style={s.progressBg}>
                        <div style={{...s.progressFill, width: `${pct}%`, background: config.color}} />
                      </div>
                      <div style={s.progressLabel}>
                        <span style={s.progressText}>{spent.toLocaleString("id-ID")} / {budget.toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={s.actionWrapper}>
                    {isEditing ? (
                      <div style={s.editForm}>
                        <div style={s.editInputGroup}>
                          <span style={s.inputPrefix}>Rp</span>
                          <input 
                            type="number" 
                            placeholder="Masukkan limit" 
                            value={editAmount} 
                            onChange={(e) => setEditAmount(e.target.value)} 
                            style={s.editInput} 
                            autoFocus 
                            min="0"
                            step="1000"
                          />
                        </div>
                        <div style={s.editButtons}>
                          <button onClick={() => saveBudget(cat.id)} style={s.saveBtn}>
                            <Check size={14} /> Simpan
                          </button>
                          <button onClick={cancelEdit} style={s.cancelBtn}>
                            <X size={14} /> Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => { 
                          setEditingId(cat.id); 
                          setEditAmount(budget > 0 ? String(budget) : ""); 
                        }} 
                        style={s.editBtn}
                      >
                        <Pencil size={14} /> {budget > 0 ? "Ubah Limit" : "Atur Budget"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ⚠️ Styles - Clean & Professional
const s = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg, #f8fafc)',
    paddingBottom: '40px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  loading: {
    textAlign: 'center',
    padding: '60px',
    color: 'var(--gray-400)',
    fontSize: '14px',
  },
  
  // Header
  header: {
    background: 'var(--white, #ffffff)',
    padding: '24px 20px',
    borderBottom: '1px solid var(--border, #e2e8f0)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: 'var(--gray-900, #0f172a)',
    margin: 0,
  },
  pageSubtitle: {
    fontSize: '13px',
    color: 'var(--gray-500, #64748b)',
    marginTop: '4px',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  monthSelect: {
    padding: '10px 16px',
    borderRadius: '12px',
    border: '1.5px solid var(--border, #e2e8f0)',
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--gray-700, #334155)',
    background: 'var(--white, #ffffff)',
    cursor: 'pointer',
    outline: 'none',
  },

  // Summary Grid
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  summaryCard: {
    background: 'var(--white, #ffffff)',
    borderRadius: '16px',
    padding: '16px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
    border: '1px solid var(--border, #e2e8f0)',
  },
  summaryIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '14px',
    background: 'var(--green-pale, rgba(82,183,136,0.1))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  summaryLabel: {
    fontSize: '12px',
    color: 'var(--gray-500, #64748b)',
    marginBottom: '4px',
  },
  summaryAmount: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--gray-800, #1e293b)',
  },

  // Category Section
  categorySection: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '0 20px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 0 16px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--gray-800, #1e293b)',
    margin: 0,
  },
  sectionCount: {
    fontSize: '13px',
    color: 'var(--gray-400, #94a3b8)',
    fontWeight: '500',
  },
  categoryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },

  // Category Card
  categoryCard: {
    background: 'var(--white, #ffffff)',
    borderRadius: '16px',
    padding: '18px',
    boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
    border: '1px solid var(--border, #e2e8f0)',
    transition: 'all 0.2s ease',
  },
  categoryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  categoryInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  categoryIconBox: {
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  categoryName: {
    fontSize: '15px',
    fontWeight: '600',
    color: 'var(--gray-800, #1e293b)',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },

  // Amount Row
  amountRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderTop: '1px solid var(--border, #e2e8f0)',
    borderBottom: '1px solid var(--border, #e2e8f0)',
    marginBottom: '12px',
  },
  amountItem: {
    flex: 1,
    textAlign: 'center',
  },
  amountDivider: {
    width: '1px',
    height: '30px',
    background: 'var(--border, #e2e8f0)',
  },
  amountLabel: {
    fontSize: '11px',
    color: 'var(--gray-400, #94a3b8)',
    marginBottom: '4px',
  },
  amountValue: {
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--gray-800, #1e293b)',
  },

  // Progress Bar
  progressWrapper: {
    marginBottom: '16px',
  },
  progressBg: {
    height: '8px',
    background: 'var(--gray-100, #f1f5f9)',
    borderRadius: '99px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '99px',
    transition: 'width 0.4s ease',
  },
  progressLabel: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '6px',
  },
  progressText: {
    fontSize: '11px',
    color: 'var(--gray-400, #94a3b8)',
  },

  // Action Buttons
  actionWrapper: {
    marginTop: '4px',
  },
  editForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  editInputGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'var(--gray-50, #f8fafc)',
    border: '1.5px solid var(--border, #e2e8f0)',
    borderRadius: '12px',
    padding: '0 14px',
  },
  inputPrefix: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--gray-500, #64748b)',
  },
  editInput: {
    flex: 1,
    padding: '12px 0',
    border: 'none',
    outline: 'none',
    fontSize: '15px',
    fontWeight: '500',
    background: 'transparent',
    color: 'var(--gray-900, #0f172a)',
  },
  editButtons: {
    display: 'flex',
    gap: '10px',
  },
  saveBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px',
    background: 'var(--green, #38a169)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  cancelBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px',
    background: 'var(--gray-100, #f1f5f9)',
    border: 'none',
    borderRadius: '12px',
    color: 'var(--gray-600, #475569)',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  editBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    background: 'none',
    border: '1.5px dashed var(--border, #e2e8f0)',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--gray-500, #64748b)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  // Empty State
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    background: 'var(--white, #ffffff)',
    borderRadius: '16px',
    border: '1px solid var(--border, #e2e8f0)',
  },
  emptyText: {
    fontSize: '14px',
    color: 'var(--gray-500, #64748b)',
    marginTop: '12px',
  },
};