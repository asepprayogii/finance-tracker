import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { Wallet, Pencil, Check, X, TrendingUp, TrendingDown } from "lucide-react";

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

  async function fetchAll() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user.id;
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
    if (existing) await supabase.from("budgets").update({ amount: parseFloat(editAmount) }).eq("id", existing.id);
    else await supabase.from("budgets").insert({ user_id: userData.user.id, category_id: categoryId, amount: parseFloat(editAmount), month: selectedMonth });
    setEditingId(null); setEditAmount(""); fetchAll();
  }

  const cancelEdit = () => { setEditingId(null); setEditAmount(""); };

  const formatRupiah = (amt) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amt);
  const getSpent = (id) => transactions.filter((t) => t.category_id === id).reduce((s, t) => s + t.amount, 0);
  const getBudget = (id) => budgets.find((b) => b.category_id === id)?.amount || 0;
  const getStatus = (spent, budget) => budget === 0 ? "none" : (spent / budget) * 100 >= 100 ? "over" : (spent / budget) * 100 >= 80 ? "warning" : "safe";
  
  const statusColor = { safe: "var(--green)", warning: "#f59e0b", over: "var(--red)", none: "var(--gray-300)" };
  const statusBg = { safe: "rgba(82,183,136,0.1)", warning: "rgba(245,158,11,0.1)", over: "rgba(229,62,62,0.1)", none: "rgba(148,163,184,0.05)" };

  if (loading) return <div style={s.loading}>Memuat...</div>;
  
  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = categories.reduce((s, c) => s + getSpent(c.id), 0);
  const remaining = totalBudget - totalSpent;

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.pageTitle}>Anggaran</h1>
          <p style={s.pageSubtitle}>Atur limit pengeluaran per kategori</p>
        </div>
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

      {/* Summary Cards */}
      <div style={s.summaryGrid}>
        <div style={s.summaryCard}>
          <div style={s.summaryIcon}><Wallet size={18} color="var(--green)" /></div>
          <div>
            <p style={s.summaryLabel}>Total Anggaran</p>
            <p style={s.summaryAmount}>{totalBudget > 0 ? formatRupiah(totalBudget) : "Belum diset"}</p>
          </div>
        </div>
        <div style={s.summaryCard}>
          <div style={{...s.summaryIcon, background: "var(--red-pale)"}}><TrendingDown size={18} color="var(--red)" /></div>
          <div>
            <p style={s.summaryLabel}>Total Terpakai</p>
            <p style={s.summaryAmount}>{formatRupiah(totalSpent)}</p>
          </div>
        </div>
        <div style={s.summaryCard}>
          <div style={{...s.summaryIcon, background: remaining >= 0 ? "var(--green-pale)" : "var(--red-pale)"}}>
            <TrendingUp size={18} color={remaining >= 0 ? "var(--green)" : "var(--red)"} />
          </div>
          <div>
            <p style={s.summaryLabel}>Sisa Anggaran</p>
            <p style={{...s.summaryAmount, color: remaining >= 0 ? "var(--green)" : "var(--red)"}}>{formatRupiah(remaining)}</p>
          </div>
        </div>
      </div>

      {/* Category List */}
      <div style={s.categorySection}>
        <h3 style={s.sectionTitle}>Detail Kategori</h3>
        <div style={s.categoryList}>
          {categories.length === 0 ? (
            <div style={s.empty}><Wallet size={40} color="var(--gray-300)" /><p style={s.emptyText}>Belum ada kategori pengeluaran</p></div>
          ) : (
            categories.map((cat) => {
              const spent = getSpent(cat.id);
              const budget = getBudget(cat.id);
              const status = getStatus(spent, budget);
              const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
              const isEditing = editingId === cat.id;
              const barColor = statusColor[status];

              return (
                <div key={cat.id} style={s.categoryCard}>
                  {/* Category Header */}
                  <div style={s.categoryHeader}>
                    <div style={s.categoryInfo}>
                      <span style={s.categoryIcon}>{cat.icon}</span>
                      <span style={s.categoryName}>{cat.name}</span>
                    </div>
                    <span style={{...s.statusBadge, background: statusBg[status], color: barColor}}>
                      {budget > 0 ? `${pct.toFixed(0)}%` : "Belum diset"}
                    </span>
                  </div>

                  {/* Amount Row */}
                  <div style={s.amountRow}>
                    <div style={s.amountItem}>
                      <p style={s.amountLabel}>Terpakai</p>
                      <p style={s.amountValue}>{formatRupiah(spent)}</p>
                    </div>
                    {budget > 0 && (
                      <>
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
                      </>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {budget > 0 && (
                    <div style={s.progressWrapper}>
                      <div style={s.progressBg}>
                        <div style={{...s.progressFill, width: `${pct}%`, background: barColor}} />
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
                          />
                        </div>
                        <div style={s.editButtons}>
                          <button onClick={() => saveBudget(cat.id)} style={s.saveBtn}><Check size={16} /><span>Simpan</span></button>
                          <button onClick={cancelEdit} style={s.cancelBtn}><X size={16} /><span>Batal</span></button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingId(cat.id); setEditAmount(budget > 0 ? String(budget) : ""); }} style={s.editBtn}>
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

const s = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
    paddingBottom: '40px',
  },
  loading: {
    textAlign: 'center',
    padding: '60px',
    color: 'var(--gray-400)',
    fontSize: '14px',
  },
  
  // Header
  header: {
    background: 'var(--white)',
    padding: '24px 20px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: 'var(--gray-900)',
    margin: 0,
  },
  pageSubtitle: {
    fontSize: '13px',
    color: 'var(--gray-500)',
    marginTop: '4px',
  },
  monthSelect: {
    padding: '10px 16px',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--border)',
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--gray-700)',
    background: 'var(--white)',
    cursor: 'pointer',
  },

  // Summary Grid
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
    padding: '20px 20px 0',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  summaryCard: {
    background: 'var(--white)',
    borderRadius: 'var(--radius-lg)',
    padding: '16px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border)',
  },
  summaryIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '14px',
    background: 'var(--green-pale)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: '12px',
    color: 'var(--gray-500)',
    marginBottom: '4px',
  },
  summaryAmount: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--gray-800)',
  },

  // Category Section
  categorySection: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--gray-800)',
    marginBottom: '16px',
  },
  categoryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },

  // Category Card
  categoryCard: {
    background: 'var(--white)',
    borderRadius: 'var(--radius-lg)',
    padding: '18px',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border)',
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
  categoryIcon: {
    fontSize: '24px',
    width: '36px',
    textAlign: 'center',
  },
  categoryName: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--gray-800)',
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
    borderTop: '1px solid var(--border)',
    borderBottom: '1px solid var(--border)',
    marginBottom: '12px',
  },
  amountItem: {
    flex: 1,
    textAlign: 'center',
  },
  amountDivider: {
    width: '1px',
    height: '30px',
    background: 'var(--border)',
  },
  amountLabel: {
    fontSize: '11px',
    color: 'var(--gray-400)',
    marginBottom: '4px',
  },
  amountValue: {
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--gray-800)',
  },

  // Progress Bar
  progressWrapper: {
    marginBottom: '16px',
  },
  progressBg: {
    height: '8px',
    background: 'var(--gray-100)',
    borderRadius: '99px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '99px',
    transition: 'width 0.4s ease',
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
    background: 'var(--gray-50)',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '0 14px',
  },
  inputPrefix: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--gray-500)',
  },
  editInput: {
    flex: 1,
    padding: '12px 0',
    border: 'none',
    outline: 'none',
    fontSize: '15px',
    fontWeight: '500',
    background: 'transparent',
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
    background: 'var(--green)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  cancelBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px',
    background: 'var(--gray-100)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    color: 'var(--gray-600)',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  editBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    background: 'none',
    border: '1.5px dashed var(--border)',
    borderRadius: 'var(--radius-md)',
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--gray-500)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  // Empty State
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    background: 'var(--white)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
  },
  emptyText: {
    fontSize: '14px',
    color: 'var(--gray-500)',
    marginTop: '12px',
  },
};