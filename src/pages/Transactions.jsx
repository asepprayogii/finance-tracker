import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { 
  SlidersHorizontal, List, TrendingUp, TrendingDown, Pencil, Trash2, 
  FileDown, X, Check, Calendar, ChevronDown, ChevronUp, Filter, 
  ArrowLeft, ArrowRight, RefreshCw, Clock
} from "lucide-react";
import { exportTransactionsPDF } from "../utils/exportPDF";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const navigate = useNavigate();
  
  // ✅ Filter AKTIF
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  
  // ✅ Date Range (max 30 days)
  const today = new Date();
  const defaultEndDate = today.toISOString().split('T')[0];
  const defaultStartDate = new Date(today.setDate(today.getDate() - 29)).toISOString().split('T')[0];
  
  const [filterStartDate, setFilterStartDate] = useState(defaultStartDate);
  const [filterEndDate, setFilterEndDate] = useState(defaultEndDate);
  
  // ✅ Filter SEMENTARA (preview)
  const [tempFilterType, setTempFilterType] = useState("all");
  const [tempFilterCategory, setTempFilterCategory] = useState("all");
  const [tempFilterStartDate, setTempFilterStartDate] = useState(defaultStartDate);
  const [tempFilterEndDate, setTempFilterEndDate] = useState(defaultEndDate);

  // Sync temp filters when modal opens
  useEffect(() => {
    if (showFilter) {
      setTempFilterType(filterType);
      setTempFilterCategory(filterCategory);
      setTempFilterStartDate(filterStartDate);
      setTempFilterEndDate(filterEndDate);
    }
  }, [showFilter, filterType, filterCategory, filterStartDate, filterEndDate]);

  useEffect(() => { fetchCategories(); }, [tempFilterType]);
  useEffect(() => { fetchTransactions(); }, [filterType, filterCategory, filterStartDate, filterEndDate]);

  async function getCurrentUser() {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) return null;
      return data.user;
    } catch { return null; }
  }

  async function fetchCategories() {
    try {
      const user = await getCurrentUser();
      if (!user) return;
      
      let query = supabase
        .from("categories")
        .select("id, name, type, icon")
        .or(`user_id.eq.${user.id},is_default.eq.true`);
      
      if (tempFilterType !== "all") query = query.eq("type", tempFilterType);
      
      const { data, error } = await query
        .order("is_default", { ascending: false })
        .order("name", { ascending: true });
      
      if (error) { console.error('Categories error:', error); return; }
      setCategories(data || []);
      
      if (tempFilterCategory !== "all") {
        const selectedCat = (data || []).find(c => c.id === tempFilterCategory);
        if (!selectedCat) setTempFilterCategory("all");
      }
    } catch (err) { console.error('Fetch categories failed:', err); }
  }

  async function fetchTransactions() {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) return;

      let query = supabase
        .from("transactions")
        .select("*, categories(name, icon), created_at")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (filterStartDate && filterEndDate) {
        const start = new Date(filterStartDate);
        const end = new Date(filterEndDate);
        const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
        
        if (diffDays <= 31) {
          query = query.gte("date", filterStartDate).lte("date", filterEndDate);
        } else {
          query = query.gte("date", defaultStartDate).lte("date", defaultEndDate);
        }
      }

      if (filterType !== "all") query = query.eq("type", filterType);
      if (filterCategory !== "all") query = query.eq("category_id", filterCategory);

      const { data, error } = await query;
      if (error) throw error;
      setTransactions(data || []);
    } catch (err) { console.error('Fetch transactions error:', err); }
    finally { setLoading(false); }
  }

  async function handleDelete(id) {
    if (!confirm("Hapus transaksi ini?")) return;
    await supabase.from("transactions").delete().eq("id", id);
    fetchTransactions();
  }

  const formatRupiah = (amt) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amt);

  const formatDateRange = (start, end) => {
    const startFmt = new Date(start).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    const endFmt = new Date(end).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    return `${startFmt} - ${endFmt}`;
  };

  const formatDateDisplay = (dateStr) => {
    const today = new Date();
    const trxDate = new Date(dateStr);
    today.setHours(0, 0, 0, 0);
    trxDate.setHours(0, 0, 0, 0);
    if (trxDate.getTime() === today.getTime()) return "Hari ini";
    return trxDate.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
  };

  const groupedByDate = transactions.reduce((acc, t) => {
    const displayDate = formatDateDisplay(t.date);
    if (!acc[displayDate]) acc[displayDate] = [];
    acc[displayDate].push(t);
    return acc;
  }, {});

  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const activeFiltersCount = [
    filterType !== "all",
    filterCategory !== "all",
    filterStartDate !== defaultStartDate,
    filterEndDate !== defaultEndDate
  ].filter(Boolean).length;

  const applyFilters = () => {
    const start = new Date(tempFilterStartDate);
    const end = new Date(tempFilterEndDate);
    const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    if (diffDays > 31) {
      alert("Rentang tanggal maksimal 30 hari.");
      return;
    }
    
    setFilterType(tempFilterType);
    setFilterCategory(tempFilterCategory);
    setFilterStartDate(tempFilterStartDate);
    setFilterEndDate(tempFilterEndDate);
    setShowFilter(false);
  };

  const resetTempFilters = () => {
    setTempFilterType(filterType);
    setTempFilterCategory(filterCategory);
    setTempFilterStartDate(filterStartDate);
    setTempFilterEndDate(filterEndDate);
  };

  const clearAllFilters = () => {
    setFilterType("all");
    setFilterCategory("all");
    setFilterStartDate(defaultStartDate);
    setFilterEndDate(defaultEndDate);
  };

  const handleDateChange = (setter, otherSetter, isStart) => (e) => {
    const newValue = e.target.value;
    setter(newValue);
    
    const start = isStart ? newValue : tempFilterStartDate;
    const end = isStart ? tempFilterEndDate : newValue;
    
    if (start && end) {
      const s = new Date(start);
      const en = new Date(end);
      const diffDays = Math.ceil(Math.abs(en - s) / (1000 * 60 * 60 * 24)) + 1;
      
      if (diffDays > 31) {
        if (isStart) {
          const newEnd = new Date(s);
          newEnd.setDate(newEnd.getDate() + 29);
          otherSetter(newEnd.toISOString().split('T')[0]);
        } else {
          const newStart = new Date(en);
          newStart.setDate(newStart.getDate() - 29);
          otherSetter(newStart.toISOString().split('T')[0]);
        }
      }
    }
  };

  // Quick date presets
  const datePresets = [
    { label: "7 Hari", days: 6 },
    { label: "14 Hari", days: 13 },
    { label: "30 Hari", days: 29 },
  ];

  const applyPreset = (days) => {
    const end = new Date(defaultEndDate);
    const start = new Date(end);
    start.setDate(start.getDate() - days);
    setTempFilterStartDate(start.toISOString().split('T')[0]);
    setTempFilterEndDate(end.toISOString().split('T')[0]);
  };

  return (
    <div style={s.page}>
      {/* HEADER */}
      <div style={s.header}>
        <h2 style={s.title}>Transaksi</h2>
        <div style={s.headerActions}>
          <button onClick={() => exportTransactionsPDF(transactions, `${filterStartDate}_${filterEndDate}`)} style={s.iconBtn} title="Export PDF">
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
            <Filter size={18} color={activeFiltersCount > 0 ? 'var(--green)' : 'var(--gray-600)'}/>
            {activeFiltersCount > 0 && <span style={s.filterBadge}>{activeFiltersCount}</span>}
          </button>
        </div>
      </div>

      {/* Date Range Display */}
      <div style={s.dateRangeBar}>
        <Calendar size={14} color="var(--gray-500)" />
        <span style={s.dateRangeText}>{formatDateRange(filterStartDate, filterEndDate)}</span>
        {(filterStartDate !== defaultStartDate || filterEndDate !== defaultEndDate) && (
          <button onClick={clearAllFilters} style={s.dateRangeReset} title="Reset tanggal">
            <RefreshCw size={12} />
          </button>
        )}
      </div>

      {/* ✅ REDESIGNED FILTER MODAL - Clean & Intuitive */}
      {showFilter && (
        <div style={s.overlay} onClick={() => setShowFilter(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={s.modalHeader}>
              <div style={s.modalTitleWrapper}>
                <SlidersHorizontal size={18} color="var(--gray-600)"/>
                <span style={s.modalTitle}>Filter Transaksi</span>
              </div>
              <button onClick={() => setShowFilter(false)} style={s.closeBtn}><X size={18}/></button>
            </div>
            
            {/* Modal Content */}
            <div style={s.modalContent}>
              
              {/* Date Range Section */}
              <div style={s.section}>
                <div style={s.sectionHeader}>
                  <Calendar size={14} color="var(--gray-500)" />
                  <span style={s.sectionTitle}>Rentang Tanggal</span>
                </div>
                
                {/* Quick Presets */}
                <div style={s.presets}>
                  {datePresets.map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyPreset(preset.days)}
                      style={{
                        ...s.presetBtn,
                        background: (tempFilterStartDate === new Date(new Date(defaultEndDate).setDate(new Date(defaultEndDate).getDate() - preset.days)).toISOString().split('T')[0]) 
                          ? 'var(--green)' : 'var(--gray-100)',
                        color: (tempFilterStartDate === new Date(new Date(defaultEndDate).setDate(new Date(defaultEndDate).getDate() - preset.days)).toISOString().split('T')[0])
                          ? '#fff' : 'var(--gray-700)'
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                
                {/* Custom Date Inputs */}
                <div style={s.dateInputs}>
                  <div style={s.dateField}>
                    <label style={s.dateLabel}>Dari</label>
                    <input 
                      type="date" 
                      value={tempFilterStartDate} 
                      onChange={handleDateChange(setTempFilterStartDate, setTempFilterEndDate, true)}
                      style={s.dateInput}
                      max={tempFilterEndDate}
                    />
                  </div>
                  <div style={s.dateSeparator}><ArrowRight size={14} color="var(--gray-400)" /></div>
                  <div style={s.dateField}>
                    <label style={s.dateLabel}>Sampai</label>
                    <input 
                      type="date" 
                      value={tempFilterEndDate} 
                      onChange={handleDateChange(setTempFilterEndDate, setTempFilterStartDate, false)}
                      style={s.dateInput}
                      min={tempFilterStartDate}
                      max={defaultEndDate}
                    />
                  </div>
                </div>
                
                {/* Days Remaining Hint */}
                <div style={s.daysHint}>
                  <Clock size={12} color="var(--gray-400)" style={{ marginRight: 4 }} />
                  <span>
                    Maks 30 hari • Tersisa: {Math.max(0, 30 - (Math.ceil(Math.abs(new Date(tempFilterEndDate) - new Date(tempFilterStartDate)) / (1000 * 60 * 60 * 24)) + 1))} hari
                  </span>
                </div>
              </div>
              
              {/* Type Filter */}
              <div style={s.section}>
                <div style={s.sectionHeader}>
                  <SlidersHorizontal size={14} color="var(--gray-500)" />
                  <span style={s.sectionTitle}>Tipe Transaksi</span>
                </div>
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
              
              {/* Category Filter */}
              <div style={s.section}>
                <div style={s.sectionHeader}>
                  <List size={14} color="var(--gray-500)" />
                  <span style={s.sectionTitle}>Kategori</span>
                </div>
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
              
              {/* Changes Indicator */}
              {(tempFilterType !== filterType || tempFilterCategory !== filterCategory || tempFilterStartDate !== filterStartDate || tempFilterEndDate !== filterEndDate) && (
                <div style={s.changesBadge}>
                  <span style={s.changesDot}/>
                  <span style={s.changesText}>Ada perubahan yang belum diterapkan</span>
                </div>
              )}
            </div>
            
            {/* Modal Actions */}
            <div style={s.modalFooter}>
              <button onClick={() => { resetTempFilters(); setShowFilter(false); }} style={s.cancelBtn}>
                Batal
              </button>
              <button onClick={applyFilters} style={s.applyBtn}>
                <Check size={16}/> Terapkan
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Active Filters Tags */}
      {activeFiltersCount > 0 && (
        <div style={s.tagsRow}>
          {filterType !== "all" && (
            <span style={s.tag}>
              {filterType === "income" ? "Pemasukan" : "Pengeluaran"} 
              <button onClick={()=>setFilterType("all")} style={s.tagClose}><X size={12}/></button>
            </span>
          )}
          {filterCategory !== "all" && categories.find(c => c.id === filterCategory) && (
            <span style={s.tag}>
              {categories.find(c => c.id === filterCategory)?.name} 
              <button onClick={()=>setFilterCategory("all")} style={s.tagClose}><X size={12}/></button>
            </span>
          )}
          {(filterStartDate !== defaultStartDate || filterEndDate !== defaultEndDate) && (
            <span style={s.tag}>
              {formatDateRange(filterStartDate, filterEndDate)} 
              <button onClick={clearAllFilters} style={s.tagClose}><X size={12}/></button>
            </span>
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
          <p style={{...s.emptyText, fontSize: '13px', marginTop: '4px'}}>
            Coba ubah rentang tanggal atau filter lainnya
          </p>
          <button onClick={()=>navigate('/add-transaction')} style={s.emptyBtn}>
            <Plus size={15} style={{ marginRight: 6 }} /> Tambah Transaksi
          </button>
        </div>
      ) : (
        <div style={s.list}>
          {Object.entries(groupedByDate).map(([dateLabel, trxs]) => (
            <div key={dateLabel} style={s.group}>
              <p style={{...s.groupDate, color: dateLabel === "Hari ini" ? "var(--green)" : "var(--gray-500)"}}>
                {dateLabel === "Hari ini" && <span style={s.todayDot}/>} {dateLabel}
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
                        <p style={s.trxDesc}>{trx.description || ''}</p>
                        {dateLabel === "Hari ini" && trx.created_at && (
                          <p style={s.trxTime}>
                            {new Date(trx.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        )}
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
      
      {/* Animasi */}
      <style>{`
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.95) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

// ⚠️ Styles - Clean & Professional
const s = {
  page: { 
    minHeight: '100vh', 
    background: 'var(--bg, #f8fafc)', 
    padding: '0 20px 40px', 
    fontFamily: 'system-ui, -apple-system, sans-serif',
    position: 'relative'
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', marginBottom: '8px' },
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
  
  // Date Range Bar
  dateRangeBar: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 16px', background: 'var(--white)',
    borderRadius: '12px', border: '1px solid var(--border)',
    marginBottom: '16px', boxShadow: 'var(--shadow-sm)',
    maxWidth: '320px',
  },
  dateRangeText: { fontSize: '13px', fontWeight: '500', color: 'var(--gray-700)' },
  dateRangeReset: {
    marginLeft: 'auto', padding: '4px', background: 'none', border: 'none',
    color: 'var(--gray-400)', cursor: 'pointer', borderRadius: '4px',
    display: 'flex', alignItems: 'center',
  },
  
  // ✅ MODAL - Redesigned
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(8px)', zIndex: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
  },
  modal: {
    background: '#fff', width: '100%', maxWidth: '420px',
    borderRadius: '20px', overflow: 'hidden',
    boxShadow: '0 25px 60px rgba(0,0,0,0.4)', border: '1px solid var(--gray-200)',
    animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    display: 'flex', flexDirection: 'column',
  },
  modalHeader: {
    padding: '16px 20px', borderBottom: '1px solid var(--gray-100)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: 'var(--gray-50, #f8fafc)',
  },
  modalTitleWrapper: { display: 'flex', alignItems: 'center', gap: '10px' },
  modalTitle: { fontSize: '15px', fontWeight: '700', color: 'var(--gray-800)' },
  closeBtn: { background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer', padding: '4px' },
  
  modalContent: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' },
  
  // Section styling
  section: { display: 'flex', flexDirection: 'column', gap: '12px' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: '8px' },
  sectionTitle: { fontSize: '13px', fontWeight: '600', color: 'var(--gray-700)' },
  
  // Date presets
  presets: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  presetBtn: {
    padding: '8px 14px', borderRadius: '8px', fontSize: '12px',
    fontWeight: '500', cursor: 'pointer', border: 'none',
    transition: 'all 0.15s',
  },
  
  // Date inputs
  dateInputs: { display: 'flex', alignItems: 'center', gap: '12px' },
  dateField: { display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 },
  dateLabel: { fontSize: '11px', fontWeight: '500', color: 'var(--gray-500)' },
  dateInput: {
    padding: '10px 12px', borderRadius: '10px', border: '2px solid var(--gray-200)',
    fontSize: '13px', background: 'var(--white)', color: 'var(--gray-900)',
    outline: 'none', cursor: 'pointer',
  },
  dateSeparator: { display: 'flex', alignItems: 'center', padding: '0 4px' },
  daysHint: {
    display: 'flex', alignItems: 'center', fontSize: '11px',
    color: 'var(--gray-400)', fontStyle: 'italic',
  },
  
  // Type chips
  typeChips: { display: 'flex', gap: '8px' },
  chip: {
    flex: 1, padding: '10px', borderRadius: '10px', fontSize: '12px',
    fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center',
  },
  
  // Select
  select: {
    padding: '12px 14px', borderRadius: '12px', border: '2px solid var(--gray-200)',
    fontSize: '14px', background: 'var(--white)', color: 'var(--gray-900)',
    appearance: 'none', cursor: 'pointer',
    backgroundImage: `url("image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px', paddingRight: '36px'
  },
  
  // Changes indicator
  changesBadge: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 14px', background: 'var(--gray-50)',
    borderRadius: '10px', border: '1px dashed var(--gray-300)',
  },
  changesDot: {
    width: '8px', height: '8px', borderRadius: '50%',
    background: 'var(--green)', animation: 'pulse 2s infinite',
  },
  changesText: { fontSize: '12px', color: 'var(--gray-600)' },
  
  // Modal footer
  modalFooter: {
    padding: '16px 20px', borderTop: '1px solid var(--gray-100)',
    display: 'flex', gap: '12px', background: 'var(--gray-50, #f8fafc)',
  },
  cancelBtn: {
    flex: 1, padding: '12px', borderRadius: '12px', border: 'none',
    background: 'var(--white)', color: 'var(--gray-600)',
    fontWeight: '600', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  applyBtn: {
    flex: 1, padding: '12px', borderRadius: '12px', border: 'none',
    background: 'var(--green)', color: '#fff', fontWeight: '700',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    boxShadow: '0 4px 12px rgba(56, 161, 105, 0.3)',
  },

  // Tags Row
  tagsRow: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px', alignItems: 'center' },
  tag: {
    display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px',
    background: 'var(--white)', borderRadius: '20px', fontSize: '12px',
    fontWeight: '500', color: 'var(--gray-700)', border: '1px solid var(--gray-200)',
  },
  tagClose: {
    background: 'none', border: 'none', color: 'var(--gray-400)',
    cursor: 'pointer', padding: '2px', display: 'flex', borderRadius: '50%',
  },
  clearBtn: {
    background: 'none', border: 'none', color: 'var(--red)',
    fontSize: '12px', fontWeight: '600', cursor: 'pointer', marginLeft: '4px',
  },

  // Summary & List
  summaryRow: { display: 'flex', gap: '12px', marginBottom: '24px' },
  summaryCard: {
    flex: 1, background: 'var(--white)', borderRadius: '16px', padding: '16px',
    display: 'flex', gap: '12px', alignItems: 'center',
    boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)',
  },
  summaryIcon: { width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  summaryLabel: { fontSize: '12px', color: 'var(--gray-500)', marginBottom: '4px' },
  summaryAmount: { fontSize: '16px', fontWeight: '800' },
  loading: { textAlign: 'center', color: 'var(--gray-500)', padding: '60px 0', fontSize: '14px' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 20px', gap: '12px', background: 'var(--white)', borderRadius: '20px', border: '2px dashed var(--gray-200)' },
  emptyText: { fontSize: '15px', color: 'var(--gray-500)' },
  emptyBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginTop: '16px', padding: '12px 24px', background: 'var(--green)',
    color: '#fff', border: 'none', borderRadius: '12px',
    fontSize: '14px', fontWeight: '600', cursor: 'pointer',
  },
  list: { display: 'flex', flexDirection: 'column', gap: '20px' },
  group: { display: 'flex', flexDirection: 'column', gap: '12px' },
  groupDate: { fontSize: '13px', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' },
  todayDot: {
    width: '8px', height: '8px', borderRadius: '50%',
    background: 'var(--green)', display: 'inline-block',
  },
  trxList: { background: 'var(--white)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' },
  trxItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--gray-50)' },
  trxLeft: { display: 'flex', gap: '14px', alignItems: 'center', flex: 1 },
  trxIconBox: { width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  trxCat: { fontSize: '14px', fontWeight: '600', color: 'var(--gray-800)', margin: 0 },
  trxDesc: { fontSize: '12px', color: 'var(--gray-500)', margin: '2px 0 0' },
  trxTime: { fontSize: '10px', color: 'var(--gray-400)', marginTop: '2px', fontWeight: '500' },
  trxRight: { textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' },
  trxAmount: { fontSize: '15px', fontWeight: '700', margin: 0 },
  trxActions: { display: 'flex', gap: '8px' },
  editBtn: { padding: '6px', background: 'var(--gray-100)', border: 'none', borderRadius: '8px', color: 'var(--gray-600)', display: 'flex', alignItems: 'center', cursor: 'pointer' },
  deleteBtn: { padding: '6px', background: 'var(--red-pale)', border: 'none', borderRadius: '8px', color: 'var(--red)', display: 'flex', alignItems: 'center', cursor: 'pointer' }
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