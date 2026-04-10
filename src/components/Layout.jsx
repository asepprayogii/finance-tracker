import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { LayoutDashboard, ArrowLeftRight, BarChart2, User, Plus, LogOut, Wallet } from "lucide-react";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  // Bottom nav: 4 items (tanpa Profile) + FAB tengah
  const bottomNavItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/transactions", icon: ArrowLeftRight, label: "Transaksi" },
    { path: "/budget", icon: Wallet, label: "Budget" },
    { path: "/analytics", icon: BarChart2, label: "Analytics" },
  ];

  // Sidebar nav: semua halaman + Profile
  const sidebarItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/transactions", icon: ArrowLeftRight, label: "Transaksi" },
    { path: "/analytics", icon: BarChart2, label: "Analytics" },
    { path: "/budget", icon: Wallet, label: "Budget" },
    { path: "/profile", icon: User, label: "Profil" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div style={s.root}>
      {/* ── TOP BAR ── */}
      <header id="fintrack-topbar" style={s.topbar}>
        <div style={s.topbarInner}>
          {/* Brand */}
          <button onClick={() => navigate("/dashboard")} style={s.brand}>
            <img src="/icon-192.png" alt="FinTrack Logo" style={{ width: "32px", height: "32px", borderRadius: "10px", objectFit: "cover" }} />
            <span style={s.brandName}>FinTrack</span>
          </button>

          {/* Right: Profile + Logout + TAMBAH (Desktop) */}
          <div style={s.topbarRight}>
            {/* Tombol Tambah - Desktop Only */}
            <button onClick={() => navigate("/add-transaction")} style={s.addBtnDesktop} className="desktop-only">
              <Plus size={15} /> <span>Tambah</span>
            </button>

            {/* Avatar Profile */}
            <button onClick={() => navigate("/profile")} style={s.avatarBtn} title="Profil">
              <User size={16} color="var(--gray-600)" />
            </button>

            {/* Logout */}
            <button onClick={handleLogout} style={s.logoutBtn} title="Keluar">
              <LogOut size={16} color="var(--gray-500)" />
            </button>
          </div>
        </div>
      </header>

      {/* ── BODY ── */}
      <div style={s.body}>
        {/* Sidebar (Desktop only) */}
        <aside id="fintrack-sidebar" style={s.sidebar}>
          <div style={s.sidebarTop}>
            {/* Profile info */}
            <div style={s.sidebarProfile}>
              <div style={s.sidebarAvatar}>
                <User size={18} color="var(--green)" />
              </div>
              <div style={s.sidebarProfileInfo}>
                <p style={s.sidebarName}>{user?.user_metadata?.full_name || "Pengguna"}</p>
                <p style={s.sidebarEmail}>{user?.email}</p>
              </div>
            </div>

            {/* Nav items */}
            <nav style={s.sidebarNav}>
              {sidebarItems.map(({ path, icon: Icon, label }) => (
                <button key={path} onClick={() => navigate(path)} style={isActive(path) ? s.sidebarItemActive : s.sidebarItem}>
                  <Icon size={18} />
                  <span style={{ flex: 1 }}>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Sidebar Bottom: Tambah + Logout */}
          <div style={s.sidebarBottom}>
            <button onClick={handleLogout} style={s.sidebarLogout}>
              <LogOut size={16} /> Keluar
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main id="fintrack-main" style={s.main}>
          <div className="page-content">{children}</div>
        </main>
      </div>

      {/* ── BOTTOM NAV (Mobile only) ── */}
      <nav id="fintrack-bottomnav" style={s.bottomNav}>
        {bottomNavItems.slice(0, 2).map(({ path, icon: Icon, label }) => (
          <button key={path} onClick={() => navigate(path)} style={isActive(path) ? s.bnItemActive : s.bnItem}>
            <Icon size={22} />
            <span>{label}</span>
          </button>
        ))}

        {/* FAB: Add Transaction - Mobile Only */}
        <button style={s.bnFab} onClick={() => navigate("/add-transaction")}>
          <Plus size={22} color="#fff" />
        </button>

        {bottomNavItems.slice(2).map(({ path, icon: Icon, label }) => (
          <button key={path} onClick={() => navigate(path)} style={isActive(path) ? s.bnItemActive : s.bnItem}>
            <Icon size={22} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Global style untuk hide/show desktop/mobile */}
      <style>{`
        .desktop-only { display: none; }
        @media (min-width: 768px) {
          .desktop-only { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

const s = {
  root: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "var(--bg)",
  },

  // ── TOPBAR ──
  topbar: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: "var(--topbar-h)",
    background: "var(--white)",
    borderBottom: "1px solid var(--border)",
    zIndex: 200,
    display: "flex",
    alignItems: "center",
  },
  topbarInner: {
    width: "100%",
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "0 20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "none",
    border: "none",
    cursor: "pointer",
    flexShrink: 0,
  },
  brandIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "10px",
    background: "var(--green)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: { fontSize: "17px", fontWeight: "800", color: "var(--gray-900)" },

  topbarRight: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginLeft: "auto",
  },

  // Tombol Tambah - Desktop
  addBtnDesktop: {
    display: "none", // Hidden on mobile, shown via media query
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    background: "var(--green)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius-sm)",
    fontSize: "13.5px",
    fontWeight: "600",
    cursor: "pointer",
  },

  avatarBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "var(--gray-100)",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "none",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--gray-500)",
  },

  // ── BODY ──
  body: {
    display: "flex",
    marginTop: "var(--topbar-h)",
    minHeight: "calc(100vh - var(--topbar-h))",
  },

  // ── SIDEBAR (Desktop) ──
  sidebar: {
    display: "none", // Shown via media query
    width: "var(--sidebar-w)",
    flexShrink: 0,
    flexDirection: "column",
    justifyContent: "space-between",
    position: "fixed",
    top: "var(--topbar-h)",
    bottom: 0,
    left: 0,
    background: "var(--white)",
    borderRight: "1px solid var(--border)",
    overflowY: "auto",
    zIndex: 100,
  },
  sidebarTop: { padding: "20px 12px", display: "flex", flexDirection: "column", gap: "24px" },
  sidebarProfile: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    background: "var(--bg)",
    borderRadius: "var(--radius-md)",
  },
  sidebarAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "var(--green-pale)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sidebarProfileInfo: { overflow: "hidden" },
  sidebarName: {
    fontSize: "13.5px",
    fontWeight: "700",
    color: "var(--gray-800)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  sidebarEmail: {
    fontSize: "11.5px",
    color: "var(--gray-400)",
    marginTop: "1px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  sidebarNav: { display: "flex", flexDirection: "column", gap: "2px" },
  sidebarItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "11px 14px",
    background: "none",
    border: "none",
    borderRadius: "var(--radius-sm)",
    fontSize: "14px",
    fontWeight: "500",
    color: "var(--gray-500)",
    width: "100%",
    textAlign: "left",
    cursor: "pointer",
  },
  sidebarItemActive: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "11px 14px",
    background: "var(--green-pale)",
    border: "none",
    borderRadius: "var(--radius-sm)",
    fontSize: "14px",
    fontWeight: "700",
    color: "var(--green)",
    width: "100%",
    textAlign: "left",
    cursor: "pointer",
  },
  sidebarBottom: {
    padding: "16px 12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    borderTop: "1px solid var(--border)",
  },
  sidebarAddBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px",
    background: "var(--green)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius-sm)",
    fontSize: "14px",
    fontWeight: "600",
    width: "100%",
    cursor: "pointer",
  },
  sidebarLogout: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "10px",
    background: "none",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    fontSize: "13.5px",
    fontWeight: "500",
    color: "var(--gray-500)",
    width: "100%",
    cursor: "pointer",
  },

  // ── MAIN ──
  main: {
    flex: 1,
    width: "100%",
    // Padding bottom hanya untuk mobile (bottom nav height)
    paddingBottom: "var(--bottomnav-h)",
  },

  // ── BOTTOM NAV (Mobile) ──
  bottomNav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: "var(--bottomnav-h)",
    background: "var(--white)",
    borderTop: "1px solid var(--border)",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    padding: "0 4px 8px",
    zIndex: 200,
  },
  bnItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "3px",
    background: "none",
    border: "none",
    color: "var(--gray-400)",
    fontSize: "10px",
    fontWeight: "500",
    padding: "6px 10px",
    flex: 1,
    cursor: "pointer",
  },
  bnItemActive: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "3px",
    background: "none",
    border: "none",
    color: "var(--green)",
    fontSize: "10px",
    fontWeight: "700",
    padding: "6px 10px",
    flex: 1,
    cursor: "pointer",
  },
  bnFab: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    background: "var(--green)",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 16px rgba(26,158,110,0.35)",
    marginTop: "-16px",
    flexShrink: 0,
    cursor: "pointer",
  },
};
