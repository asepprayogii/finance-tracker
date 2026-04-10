import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { SlidersHorizontal, List, TrendingUp, TrendingDown, Pencil, Trash2, FileDown, X, Check } from "lucide-react";
import { exportTransactionsPDF } from "../utils/exportPDF";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const navigate = useNavigate();
  
  // ✅ Filter AKTIF (langsung mempengaruhi data)
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  
  // ✅ Filter SEMENTARA (preview di modal - tidak mengubah data sampai Apply)
  const [tempFilterType, setTempFilterType] = useState("all");
  const [tempFilterCategory, setTempFilterCategory] = useState("all");
  const [tempFilterMonth, setTempFilterMonth] = useState(new Date().toISOString().slice(0, 7));

  // Sync temp filters when modal opens
  useEffect(() => {
    if (showFilter) {
      setTempFilterType(filterType);
      setTempFilterCategory(filterCategory);
      setTempFilterMonth(filterMonth);
    }
  }, [showFilter, filterType, filterCategory, filterMonth]);

  // Fetch data on mount & when filters change
  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { fetchTransactions(); }, [filterType, filterCategory, filterMonth]);

  // ✅ Helper: Get current user (aman & konsisten)
  async function getCurrentUser() {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) return null;
      return data.user;
    } catch {
      return null;
    }
  }

  // ✅ FIX: Fetch categories - User + Default (LOGIKA DARI KODE ANDA)
  async function fetchCategories() {
    try {
      const user = await getCurrentUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, type, icon")
        .or(`user_id.eq.${user.id},is_default.eq.true`)
        .order("is_default", { ascending: false })
        .order("name", { ascending: true });
      
      if (error) {
        console.error('Categories error:', error);
        return;
      }
      setCategories(data || []);
    } catch (err) {
      console.error('Fetch categories failed:', err);
    }
  }

  // ✅ FIX: Fetch transactions dengan filter yang benar (LOGIKA DARI KODE ANDA)
  async function fetchTransactions() {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) return;

      let query = supabase
        .from("transactions")
        .select("*, categories(name, icon)")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      // Filter bulan
      if (filterMonth) {
        const [year, month] = filterMonth.split("-");
        const start = `${filterMonth}-01`;
        const lastDay = new Date(year, parseInt(month), 0).getDate();
        const end = `${filterMonth}-${String(lastDay).padStart(2, '0')}`;
        query = query.gte("date", start).lte("date", end);
      }

      // Filter tipe
      if (filterType !== "all") query = query.eq("type", filterType);
      
      // Filter kategori
      if (filterCategory !== "all") query = query.eq("category_id", filterCategory);

      const { data, error } = await query;
      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Fetch transactions error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Hapus transaksi ini?")) return;
    await supabase.from("transactions").delete().eq("id", id);
    fetchTransactions();
  }

  const formatRupiah = (amt) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(amt);

  // ✅ Smart Date: "Hari ini" jika tanggal = today
  const formatDateDisplay = (dateStr) => {
    const today = new Date();
    const trxDate = new Date(dateStr);
    today.setHours(0, 0, 0, 0);
    trxDate.setHours(0, 0, 0, 0);
    
    if (trxDate.getTime() === today.getTime()) return "Hari ini";
    return trxDate.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });
  };

  // Group transactions by display date
  const groupedByDate = transactions.reduce((acc, t) => {
    const displayDate = formatDateDisplay(t.date);
    if (!acc[displayDate]) acc[displayDate] = [];
    acc[displayDate].push(t);
    return acc;
  }, {});

  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  // Count active filters (for badge)
  const activeFiltersCount = [
    filterType !== "all",
    filterCategory !== "all",
    filterMonth !== new Date().toISOString().slice(0, 7)
  ].filter(Boolean).length;

  // ✅ Apply temp filters to actual filters
  const applyFilters = () => {
    setFilterType(tempFilterType);
    setFilterCategory(tempFilterCategory);
    setFilterMonth(tempFilterMonth);
    setShowFilter(false);
  };

  // ✅ Reset temp filters to match actual
  const resetTempFilters = () => {
    setTempFilterType(filterType);
    setTempFilterCategory(filterCategory);
    setTempFilterMonth(filterMonth);
  };

  // ✅ Clear all actual filters
  const clearAllFilters = () => {
    setFilterType("all");
    setFilterCategory("all");
    setFilterMonth(new Date().toISOString().slice(0, 7));
  };

  return (
    <div style={s.page}>
      {/* HEADER */}
      <div style={s.header}>
        <h2 style={s.title}>Transaksi</h2>
        <div style={s.headerActions}>
          <button onClick={() => exportTransactionsPDF(transactions, filterMonth)} style={s.iconBtn} title="Export PDF">
            <FileDown size={18}/>
          </button>
          <button 
            onClick={() => setShowFilter(true)} 
            style={{
              ...s.iconBtn, 
              background: activeFiltersCount > 0 ? 'var(--green-pale)' : 'var(--gray-100)',
              borderColor: activeFiltersCount > 0 ? 'var(--green)' : 'transparent'
            }}
          >
            <SlidersHorizontal size={18} color={activeFiltersCount > 0 ? 'var(--green)' : 'var(--gray-600)'}/>
            {activeFiltersCount > 0 && <span style={s.filterBadge}>{activeFiltersCount}</span>}
          </button>
        </div>
      </div>

      {/* ✅ CENTERED MODAL - Preview mode, data tidak berubah sampai Apply */}
      {showFilter && (
        <div style={s.overlay} onClick={() => setShowFilter(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div style={s.modalHeader}>
              <div style={s.modalTitleWrapper}>
                <SlidersHorizontal size={18} color="var(--gray-600)"/>
                <span style={s.modalTitle}>Filter Transaksi</span>
              </div>
              <button onClick={() => setShowFilter(false)} style={s.closeBtn}><X size={18}/></button>
            </div>
            
            {/* Content */}
            <div style={s.modalContent}>
              {/* Bulan */}
              <div style={s.fieldGroup}>
                <label style={s.label}>📅 Bulan</label>
                <input 
                  type="month" 
                  value={tempFilterMonth} 
                  onChange={(e) => setTempFilterMonth(e.target.value)} 
                  style={s.input}
                />
              </div>
              
              {/* Tipe */}
              <div style={s.fieldGroup}>
                <label style={s.label}>📊 Tipe</label>
                <div style={s.typeChips}>
                  {[
                    { val: "all", label: "Semua" },
                    { val: "income", label: "Pemasukan", color: "var(--green)" },
                    { val: "expense", label: "Pengeluaran", color: "var(--red)" }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setTempFilterType(opt.val)}
                      style={{
                        ...s.chip,
                        background: tempFilterType === opt.val ? opt.color : 'var(--gray-100)',
                        color: tempFilterType === opt.val ? '#fff' : 'var(--gray-700)',
                        border: tempFilterType === opt.val ? 'none' : '1px solid var(--gray-200)'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Kategori - Menggunakan data categories yang sudah difetch */}
              <div style={s.fieldGroup}>
                <label style={s.label}>🏷️ Kategori</label>
                <select 
                  value={tempFilterCategory} 
                  onChange={(e) => setTempFilterCategory(e.target.value)} 
                  style={s.select}
                >
                  <option value="all">Semua Kategori</option>
                  {categories.length === 0 ? (
                    <option disabled>Memuat kategori...</option>
                  ) : (
                    categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))
                  )}
                </select>
              </div>
              
              {/* Preview indicator */}
              {(tempFilterType !== filterType || tempFilterCategory !== filterCategory || tempFilterMonth !== filterMonth) && (
                <div style={s.previewBadge}>
                  <span style={s.previewDot}/>
                  <span style={s.previewText}>Perubahan belum diterapkan</span>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div style={s.modalFooter}>
              <button onClick={() => { resetTempFilters(); setShowFilter(false); }} style={s.cancelBtn}>Batal</button>
              <button onClick={applyFilters} style={s.applyBtn}>
                <Check size={16}/> Terapkan
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Active Filters Tags - Only show when actual filters applied */}
      {activeFiltersCount > 0 && (
        <div style={s.tagsRow}>
          {filterType !== "all" && (
            <span style={s.tag}>{filterType === "income" ? "Pemasukan" : "Pengeluaran"} <button onClick={()=>setFilterType("all")} style={s.tagClose}>×</button></span>
          )}
          {filterCategory !== "all" && categories.find(c => c.id === filterCategory) && (
            <span style={s.tag}>{categories.find(c => c.id === filterCategory)?.name} <button onClick={()=>setFilterCategory("all")} style={s.tagClose}>×</button></span>
          )}
          {filterMonth !== new Date().toISOString().slice(0, 7) && (
            <span style={s.tag}>{new Date(filterMonth + "-01").toLocaleDateString("id-ID", { month: "short", year: "numeric" })} <button onClick={()=>setFilterMonth(new Date().toISOString().slice(0, 7))} style={s.tagClose}>×</button></span>
          )}
          <button onClick={clearAllFilters} style={s.clearBtn}>Reset</button>
        </div>
      )}

      {/* SUMMARY */}
      <div style={s.summaryRow}>
        <div style={s.summaryCard}>
          <div style={{...s.summaryIcon, background: "var(--green-pale)"}}><TrendingUp size={16} color="var(--green)"/></div>
          <div>
            <p style={s.summaryLabel}>Pemasukan</p>
            <p style={{...s.summaryAmount, color:"var(--green)"}}>{formatRupiah(totalIncome)}</p>
          </div>
        </div>
        <div style={s.summaryCard}>
          <div style={{...s.summaryIcon, background: "var(--red-pale)"}}><TrendingDown size={16} color="var(--red)"/></div>
          <div>
            <p style={s.summaryLabel}>Pengeluaran</p>
            <p style={{...s.summaryAmount, color:"var(--red)"}}>{formatRupiah(totalExpense)}</p>
          </div>
        </div>
      </div>

      {/* LIST */}
      {loading ? (
        <div style={s.loading}>Memuat transaksi...</div>
      ) : transactions.length === 0 ? (
        <div style={s.empty}>
          <List size={40} color="var(--gray-400)"/>
          <p style={s.emptyText}>Tidak ada transaksi</p>
          <button onClick={()=>navigate('/add-transaction')} style={s.emptyBtn}>+ Tambah Transaksi</button>
        </div>
      ) : (
        <div style={s.list}>
          {Object.entries(groupedByDate).map(([dateLabel, trxs]) => (
            <div key={dateLabel} style={s.group}>
              <p style={{...s.groupDate, color: dateLabel === "Hari ini" ? "var(--green)" : "var(--gray-500)"}}>
                {dateLabel === "Hari ini" && "🟢 "}{dateLabel}
              </p>
              <div style={s.trxList}>
                {trxs.map((trx) => (
                  <div key={trx.id} style={s.trxItem}>
                    <div style={s.trxLeft}>
                      <div style={{...s.trxIconBox, background: trx.type==="income" ? "var(--green-pale)" : "var(--red-pale)"}}>
                        {trx.type==="income" ? <TrendingUp size={15} color="var(--green)"/> : <TrendingDown size={15} color="var(--red)"/>}
                      </div>
                      <div>
                        <p style={s.trxCat}>{trx.categories?.name || "Tanpa Kategori"}</p>
                        {trx.description && <p style={s.trxDesc}>{trx.description}</p>}
                      </div>
                    </div>
                    <div style={s.trxRight}>
                      <p style={{...s.trxAmount, color: trx.type==="income" ? "var(--green)" : "var(--red)"}}>
                        {trx.type==="income" ? "+" : "-"}{formatRupiah(trx.amount)}
                      </p>
                      <div style={s.trxActions}>
                        <button onClick={()=>navigate(`/edit-transaction/${trx.id}`)} style={s.editBtn}><Pencil size={13}/></button>
                        <button onClick={()=>handleDelete(trx.id)} style={s.deleteBtn}><Trash2 size={13}/></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Animasi Keyframes */}
      <style>{`
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.95) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ⚠️ Styles - Centered Modal & Clean Design
const s = {
  page: { 
    minHeight: '100vh', 
    background: 'var(--bg, #f8fafc)', 
    padding: '0 20px 40px', 
    fontFamily: 'system-ui, -apple-system, sans-serif',
    position: 'relative'
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', marginBottom: '12px' },
  title: { fontSize: '18px', fontWeight: '700', color: 'var(--gray-900, #0f172a)', margin: 0 },
  headerActions: { display: 'flex', gap: '8px' },
  iconBtn: { 
    padding: '10px', background: 'var(--gray-100, #f1f5f9)', border: '2px solid transparent', 
    borderRadius: '10px', color: 'var(--gray-600, #475569)', display: 'flex', 
    alignItems: 'center', cursor: 'pointer', position: 'relative', transition: 'all 0.2s'
  },
  filterBadge: { 
    position: 'absolute', top: '-5px', right: '-5px', 
    background: 'var(--green, #38a169)', color: '#fff', 
    fontSize: '10px', fontWeight: '700', 
    width: '18px', height: '18px', borderRadius: '50%', 
    display: 'flex', alignItems: 'center', justifyContent: 'center' 
  },

  // ✅ MODAL OVERLAY - CENTERED & FIXED
  overlay: {
    position: 'fixed',
    inset: 0, // top:0, right:0, bottom:0, left:0
    background: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(8px)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modal: {
    background: '#fff',
    width: '100%',
    maxWidth: '400px',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
    border: '1px solid var(--gray-200)',
    animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid var(--gray-100)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'var(--gray-50, #f8fafc)',
  },
  modalTitleWrapper: { display: 'flex', alignItems: 'center', gap: '10px' },
  modalTitle: { fontSize: '15px', fontWeight: '700', color: 'var(--gray-800)' },
  closeBtn: { background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer', padding: '4px' },
  modalContent: { padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '12px', fontWeight: '600', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { 
    padding: '12px 14px', borderRadius: '12px', border: '2px solid var(--gray-200)', 
    fontSize: '14px', background: 'var(--white)', color: 'var(--gray-900)', outline: 'none' 
  },
  select: { 
    padding: '12px 14px', borderRadius: '12px', border: '2px solid var(--gray-200)', 
    fontSize: '14px', background: 'var(--white)', color: 'var(--gray-900)', 
    appearance: 'none', cursor: 'pointer',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px', paddingRight: '36px'
  },
  typeChips: { display: 'flex', gap: '8px' },
  chip: { 
    flex: 1, padding: '10px', borderRadius: '10px', fontSize: '12px', 
    fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' 
  },
  previewBadge: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 14px', background: 'var(--gray-50)',
    borderRadius: '10px', border: '1px dashed var(--gray-300)',
  },
  previewDot: {
    width: '8px', height: '8px', borderRadius: '50%',
    background: 'var(--green)', animation: 'pulse 2s infinite',
  },
  previewText: { fontSize: '12px', color: 'var(--gray-600)' },
  modalFooter: {
    padding: '16px 20px',
    borderTop: '1px solid var(--gray-100)',
    display: 'flex',
    gap: '12px',
    background: 'var(--gray-50, #f8fafc)',
  },
  cancelBtn: { 
    flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: 'var(--white)', 
    color: 'var(--gray-600)', fontWeight: '600', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
  },
  applyBtn: { 
    flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: 'var(--green)', 
    color: '#fff', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    boxShadow: '0 4px 12px rgba(56, 161, 105, 0.3)'
  },

  // Tags Row
  tagsRow: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px', alignItems: 'center' },
  tag: { 
    display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', 
    background: 'var(--white)', borderRadius: '20px', fontSize: '12px', 
    fontWeight: '500', color: 'var(--gray-700)', border: '1px solid var(--gray-200)' 
  },
  tagClose: { background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer', fontSize: '16px', padding: '0 2px' },
  clearBtn: { background: 'none', border: 'none', color: 'var(--red)', fontSize: '12px', fontWeight: '600', cursor: 'pointer', marginLeft: '4px' },

  // Summary & List
  summaryRow: { display: 'flex', gap: '12px', marginBottom: '24px' },
  summaryCard: { 
    flex: 1, background: 'var(--white)', borderRadius: '16px', padding: '16px', 
    display: 'flex', gap: '12px', alignItems: 'center', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' 
  },
  summaryIcon: { width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  summaryLabel: { fontSize: '12px', color: 'var(--gray-500)', marginBottom: '4px' },
  summaryAmount: { fontSize: '16px', fontWeight: '800' },
  loading: { textAlign: 'center', color: 'var(--gray-500)', padding: '60px 0', fontSize: '14px' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 20px', gap: '12px', background: 'var(--white)', borderRadius: '20px', border: '2px dashed var(--gray-200)' },
  emptyText: { fontSize: '15px', color: 'var(--gray-500)' },
  emptyBtn: { padding: '12px 24px', background: 'var(--green)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', marginTop: '8px' },
  list: { display: 'flex', flexDirection: 'column', gap: '20px' },
  group: { display: 'flex', flexDirection: 'column', gap: '12px' },
  groupDate: { fontSize: '13px', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' },
  trxList: { background: 'var(--white)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' },
  trxItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--gray-50)' },
  trxLeft: { display: 'flex', gap: '14px', alignItems: 'center', flex: 1 },
  trxIconBox: { width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  trxCat: { fontSize: '14px', fontWeight: '600', color: 'var(--gray-800)', margin: 0 },
  trxDesc: { fontSize: '12px', color: 'var(--gray-500)', margin: '2px 0 0' },
  trxRight: { textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' },
  trxAmount: { fontSize: '15px', fontWeight: '700', margin: 0 },
  trxActions: { display: 'flex', gap: '8px' },
  editBtn: { padding: '6px', background: 'var(--gray-100)', border: 'none', borderRadius: '8px', color: 'var(--gray-600)', display: 'flex', alignItems: 'center', cursor: 'pointer' },
  deleteBtn: { padding: '6px', background: 'var(--red-pale)', border: 'none', borderRadius: '8px', color: 'var(--red)', display: 'flex', alignItems: 'center', cursor: 'pointer' }
};