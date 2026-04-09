import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, useParams } from "react-router-dom";
import { TrendingUp, TrendingDown, ChevronLeft } from "lucide-react";

export default function EditTransaction() {
  const { id } = useParams();
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchTransaction();
  }, []);

  useEffect(() => {
    if (!fetching) fetchCategories();
  }, [type, fetching]); // ← tambah 'fetching' sebagai dependency
  async function fetchTransaction() {
    const { data } = await supabase.from("transactions").select("*").eq("id", id).single();
    if (data) {
      setType(data.type);
      setAmount(data.amount);
      setDescription(data.description || "");
      setDate(data.date);
      setCategoryId(data.category_id);
    }
    setFetching(false);
  }

  async function fetchCategories() {
    const { data: userData } = await supabase.auth.getUser();
    const { data } = await supabase.from("categories").select("*").or(`user_id.eq.${userData.user.id},is_default.eq.true`).eq("type", type).order("is_default", { ascending: false }).order("name", { ascending: true });
    setCategories(data || []);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase
      .from("transactions")
      .update({
        type,
        amount: parseFloat(amount),
        description,
        date,
        category_id: categoryId,
      })
      .eq("id", id);
    if (error) {
      setError(error.message);
    } else {
      navigate("/transactions");
    }
    setLoading(false);
  }

  if (fetching) {
    return (
      <div className="page-content" style={{ textAlign: "center", padding: "40px", color: "var(--gray-500)" }}>
        Memuat...
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Header dengan back button */}
      <div style={s.header}>
        <button onClick={() => navigate(-1)} style={s.backBtn}>
          <ChevronLeft size={20} />
        </button>
        <h2 style={s.headerTitle}>Edit Transaksi</h2>
        <div style={{ width: 36 }} />
      </div>

      <div style={s.typeToggle}>
        <button type="button" onClick={() => setType("expense")} style={type === "expense" ? s.typeActive("expense") : s.typeInactive}>
          <TrendingDown size={16} /> Pengeluaran
        </button>
        <button type="button" onClick={() => setType("income")} style={type === "income" ? s.typeActive("income") : s.typeInactive}>
          <TrendingUp size={16} /> Pemasukan
        </button>
      </div>

      {error && <div style={s.error}>{error}</div>}

      <form onSubmit={handleSubmit} style={s.form}>
        <div style={s.amountBox}>
          <span style={s.currency}>Rp</span>
          <input style={s.amountInput} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required min="1" />
        </div>

        <div style={s.card}>
          <div style={s.field}>
            <label style={s.label}>Kategori</label>
            <select style={s.input} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div style={s.divider} />
          <div style={s.field}>
            <label style={s.label}>Tanggal</label>
            <input style={s.input} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div style={s.divider} />
          <div style={s.field}>
            <label style={s.label}>Keterangan</label>
            <input style={s.input} type="text" placeholder="Opsional" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            ...s.submitBtn,
            background: type === "expense" ? "var(--red)" : "var(--green)",
          }}
        >
          {loading ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </form>
    </div>
  );
}

// ⚠️ Styles object — JANGAN DIHAPUS!
const s = {
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 0",
    marginBottom: "20px",
  },
  backBtn: {
    padding: "8px",
    background: "var(--gray-100)",
    border: "none",
    borderRadius: "var(--radius-sm)",
    display: "flex",
    alignItems: "center",
    color: "var(--gray-700)",
    cursor: "pointer",
  },
  headerTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "var(--gray-800)",
    margin: 0,
  },
  typeToggle: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
  },
  typeActive: (type) => ({
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "12px",
    borderRadius: "var(--radius-md)",
    border: "none",
    background: type === "expense" ? "var(--red)" : "var(--green)",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  }),
  typeInactive: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "12px",
    borderRadius: "var(--radius-md)",
    border: "1.5px solid var(--gray-200)",
    background: "var(--white)",
    color: "var(--gray-500)",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
  },
  error: {
    background: "var(--red-pale)",
    color: "var(--red)",
    padding: "12px",
    borderRadius: "var(--radius-sm)",
    fontSize: "13px",
    marginBottom: "16px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  amountBox: {
    background: "var(--white)",
    borderRadius: "var(--radius-md)",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "var(--shadow-sm)",
    border: "1px solid var(--border)",
  },
  currency: {
    fontSize: "24px",
    fontWeight: "700",
    color: "var(--gray-400)",
  },
  amountInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "32px",
    fontWeight: "700",
    color: "var(--gray-900)",
    background: "transparent",
    width: "100%",
  },
  card: {
    background: "var(--white)",
    borderRadius: "var(--radius-md)",
    boxShadow: "var(--shadow-sm)",
    overflow: "hidden",
    border: "1px solid var(--border)",
  },
  field: {
    padding: "14px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: "14px",
    color: "var(--gray-600)",
    fontWeight: "500",
  },
  input: {
    border: "none",
    outline: "none",
    fontSize: "14px",
    color: "var(--gray-900)",
    textAlign: "right",
    background: "transparent",
    maxWidth: "200px",
    padding: "4px 0",
  },
  divider: {
    height: "1px",
    background: "var(--gray-100)",
    margin: "0 16px",
  },
  submitBtn: {
    padding: "16px",
    borderRadius: "var(--radius-md)",
    border: "none",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "700",
    marginTop: "8px",
    cursor: "pointer",
    opacity: 1,
    transition: "opacity 0.2s",
  },
};
