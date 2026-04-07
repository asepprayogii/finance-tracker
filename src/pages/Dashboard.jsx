import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import { TrendingUp, TrendingDown, ArrowRight, Plus } from "lucide-react";

Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    const { data: userData } = await supabase.auth.getUser();
    const { data } = await supabase.from("transactions").select("*, categories(name, icon)").eq("user_id", userData.user.id);
    setTransactions(data || []);
    setLoading(false);
  }

  const formatRupiah = (amt) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amt);

  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const expenseByCategory = transactions.filter(t => t.type === "expense").reduce((acc, t) => {
    acc[t.categories?.name || "Lainnya"] = (acc[t.categories?.name || "Lainnya"] || 0) + t.amount;
    return acc;
  }, {});

  const pieData = {
    labels: Object.keys(expenseByCategory),
    datasets: [{ data: Object.values(expenseByCategory), backgroundColor: ["#1a9e6e","#52b788","#74c69d","#95d5b2","#2d6a4f","#40916c","#b7e4c7","#081c15"], borderWidth: 0 }]
  };

  const monthlyData = transactions.reduce((acc, t) => {
    const m = t.date?.slice(0,7);
    if(!acc[m]) acc[m]={income:0, expense:0};
    acc[m][t.type]+=t.amount;
    return acc;
  },{});
  const months = Object.keys(monthlyData).sort();
  const barData = {
    labels: months.map(m=>{const[y,mo]=m.split("-");return new Date(y,mo-1).toLocaleString("id-ID",{month:"short"})}),
    datasets:[
      {label:"Pemasukan", data:months.map(m=>monthlyData[m].income), backgroundColor:"#1a9e6e", borderRadius:6},
      {label:"Pengeluaran", data:months.map(m=>monthlyData[m].expense), backgroundColor:"#e53e3e", borderRadius:6}
    ]
  };

  const recent = [...transactions].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);

  if(loading) return <div className="page-content" style={{textAlign:'center',padding:'40px',color:'var(--gray-400)'}}>Memuat...</div>;

  return (
    <div className="page-content">
      <div style={s.hero}>
        <div style={s.heroInner}>
          <p style={s.heroGreeting}>Selamat datang, {user?.user_metadata?.full_name || "Pengguna"} 👋</p>
          <div style={s.heroBody}>
            <div><p style={s.heroLabel}>Total Saldo</p><p style={{...s.heroAmount, color: balance>=0?"#fff":"#fca5a5"}}>{formatRupiah(balance)}</p></div>
            <div style={s.heroStats}>
              <div style={s.heroStat}><div style={s.heroStatIcon}><TrendingUp size={14} color="var(--green)"/></div><div><p style={s.heroStatLabel}>Pemasukan</p><p style={s.heroStatVal}>{formatRupiah(totalIncome)}</p></div></div>
              <div style={s.heroStat}><div style={{...s.heroStatIcon, background:"var(--red-pale)"}}><TrendingDown size={14} color="var(--red)"/></div><div><p style={s.heroStatLabel}>Pengeluaran</p><p style={s.heroStatVal}>{formatRupiah(totalExpense)}</p></div></div>
            </div>
          </div>
        </div>
      </div>

      <div style={s.content}>
        {transactions.length===0 ? (
          <div style={s.empty}><div style={s.emptyIcon}>💸</div><p style={s.emptyTitle}>Belum ada transaksi</p><p style={s.emptySubtitle}>Mulai catat pemasukan atau pengeluaran pertamamu</p><button onClick={()=>navigate("/add-transaction")} style={s.emptyBtn}><Plus size={15}/> Tambah Transaksi</button></div>
        ):(
          <div className="dash-grid" style={s.grid}>
            <div style={s.card}>
              <div style={s.cardHeader}><h3 style={s.cardTitle}>Transaksi Terbaru</h3><button onClick={()=>navigate("/transactions")} style={s.seeAllBtn}>Lihat semua <ArrowRight size={13}/></button></div>
              <div style={s.trxList}>{recent.map((trx,i)=>(<div key={trx.id} style={{...s.trxItem, borderBottom: i<recent.length-1?"1px solid var(--border)":"none"}}><div style={s.trxLeft}><div style={{...s.trxIcon, background:trx.type==="income"?"var(--green-pale)":"var(--red-pale)"}}>{trx.type==="income"?<TrendingUp size={15} color="var(--green)"/>:<TrendingDown size={15} color="var(--red)"/>}</div><div><p style={s.trxCat}>{trx.categories?.name}</p><p style={s.trxMeta}>{trx.description||trx.date}</p></div></div><p style={{...s.trxAmt, color:trx.type==="income"?"var(--green)":"var(--red)"}}>{trx.type==="income"?"+":"−"}{formatRupiah(trx.amount)}</p></div>))}</div>
            </div>
            <div style={s.card}>
              <h3 style={s.cardTitle}>Pengeluaran per Kategori</h3>
              {Object.keys(expenseByCategory).length===0?<p style={s.noData}>Belum ada pengeluaran</p>:<div className="chart-wrapper" style={{maxWidth:"280px",margin:"20px auto 0"}}><Pie data={pieData} options={{plugins:{legend:{position:"bottom",labels:{font:{size:12,family:"Plus Jakarta Sans"},padding:12}}}}}/></div>}
            </div>
            <div className="dash-wide" style={s.wideCard}>
              <h3 style={s.cardTitle}>Tren Pemasukan & Pengeluaran</h3>
              <div className="chart-wrapper" style={{marginTop:"16px"}}><Bar data={barData} options={{responsive:true,plugins:{legend:{position:"bottom",labels:{font:{size:12,family:"Plus Jakarta Sans"}}}},scales:{y:{grid:{color:"var(--border)"},ticks:{font:{size:11},callback:v=>v>=1e6?`Rp ${(v/1e6).toFixed(1)}jt`:`Rp ${(v/1e3).toFixed(0)}rb`}},x:{grid:{display:false},ticks:{font:{size:11}}}}}}/></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  hero:{background:"linear-gradient(135deg, #1a9e6e 0%, #157a56 100%)",padding:"24px 20px 28px",borderRadius:"var(--radius-lg)",marginBottom:"24px"},
  heroInner:{},heroGreeting:{fontSize:"13px",color:"rgba(255,255,255,0.65)",marginBottom:"12px",fontWeight:"500"},
  heroBody:{display:"flex",flexWrap:"wrap",justifyContent:"space-between",alignItems:"flex-end",gap:"16px"},
  heroLabel:{fontSize:"12px",color:"rgba(255,255,255,0.6)",marginBottom:"4px",fontWeight:"500"},heroAmount:{fontSize:"32px",fontWeight:"800",letterSpacing:"-0.5px"},
  heroStats:{display:"flex",gap:"12px",flexWrap:"wrap"},heroStat:{display:"flex",alignItems:"center",gap:"8px",background:"rgba(255,255,255,0.12)",borderRadius:"var(--radius-sm)",padding:"8px 12px",backdropFilter:"blur(4px)"},
  heroStatIcon:{width:"26px",height:"26px",borderRadius:"8px",background:"var(--green-pale)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},
  heroStatLabel:{fontSize:"10px",color:"rgba(255,255,255,0.6)",marginBottom:"2px"},heroStatVal:{fontSize:"12px",fontWeight:"700",color:"#fff"},
  content:{},grid:{display:"grid",gridTemplateColumns:"1fr",gap:"16px"},
  card:{background:"var(--white)",borderRadius:"var(--radius-lg)",padding:"20px",boxShadow:"var(--shadow-sm)",border:"1px solid var(--border)"},
  wideCard:{...{}},cardHeader:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"},
  cardTitle:{fontSize:"15px",fontWeight:"700",color:"var(--gray-800)"},seeAllBtn:{display:"flex",alignItems:"center",gap:"4px",fontSize:"12.5px",color:"var(--green)",background:"none",border:"none",fontWeight:"600",cursor:"pointer"},
  noData:{fontSize:"13px",color:"var(--gray-400)",textAlign:"center",padding:"24px 0"},trxList:{},trxItem:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0"},
  trxLeft:{display:"flex",gap:"10px",alignItems:"center"},trxIcon:{width:"36px",height:"36px",borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},
  trxCat:{fontSize:"13.5px",fontWeight:"600",color:"var(--gray-800)"},trxMeta:{fontSize:"11.5px",color:"var(--gray-400)",marginTop:"1px"},trxAmt:{fontSize:"14px",fontWeight:"700",whiteSpace:"nowrap"},
  empty:{display:"flex",flexDirection:"column",alignItems:"center",padding:"60px 20px",gap:"10px",textAlign:"center"},emptyIcon:{fontSize:"42px",marginBottom:"4px"},emptyTitle:{fontSize:"18px",fontWeight:"700",color:"var(--gray-700)"},emptySubtitle:{fontSize:"14px",color:"var(--gray-400)",maxWidth:"260px"},emptyBtn:{display:"flex",alignItems:"center",gap:"6px",marginTop:"16px",padding:"12px 24px",background:"var(--green)",color:"#fff",border:"none",borderRadius:"var(--radius-sm)",fontSize:"14px",fontWeight:"600",cursor:"pointer"}
};