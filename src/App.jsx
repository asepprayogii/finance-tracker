import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

// ✅ Import session manager untuk auto-logout
import { startSessionMonitoring } from "./utils/sessionManager";

// ✅ Import semua halaman
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AddTransaction from "./pages/AddTransaction";
import Transactions from "./pages/Transactions";
import EditTransaction from "./pages/EditTransaction";
import Analytics from "./pages/Analytics";
import Budget from "./pages/Budget";
import Profile from "./pages/Profile";
import Categories from "./pages/Categories";

// ✅ Import Layout wrapper
import Layout from "./components/Layout";

// ─────────────────────────────────────────────────────────────
// 🔐 ProtectedRoute Component - CROSS-TAB SYNC READY
// ─────────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // 1. ✅ Cek session awal saat component mount
    async function checkInitialSession() {
      try {
        // ✅ SAFE: Simpan result dulu, jangan nested destructuring
        const result = await supabase.auth.getSession();
        const currentSession = result.data?.session || null;
        setSession(currentSession);
      } catch (err) {
        console.error("Session check error:", err);
        setSession(null);
      } finally {
        setLoading(false);
      }
    }

    checkInitialSession();

    // 2. ✅ Listen auth changes (Cross-Tab Sync)
    // Supabase otomatis sync session via localStorage events antar tab
    const {  subscription } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("🔄 Auth event detected:", event);
        
        // Update state session
        setSession(newSession);
        setLoading(false);

        // Handle event spesifik
        if (event === "SIGNED_OUT") {
          // Jika user logout dari tab lain, redirect tab ini ke login
          console.log("🔒 User signed out from another tab, redirecting...");
          window.location.href = "/login?signed_out=true";
        }
        
        // Event lain yang bisa di-handle:
        // - 'SIGNED_IN': User login dari tab lain
        // - 'TOKEN_REFRESHED': Token diperbarui
        // - 'USER_UPDATED': Data user berubah
      }
    );

    // 3. ✅ Cleanup subscription saat component unmount
    return () => {
      if (subscription && typeof subscription.unsubscribe === "function") {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Tampilkan loading spinner saat cek session
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "var(--bg, #f8fafc)",
          color: "var(--gray-500, #64748b)",
          fontSize: "14px",
        }}
      >
        Memuat...
      </div>
    );
  }

  // Jika tidak ada session, redirect ke login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Jika ada session, render children dengan Layout
  return <Layout>{children}</Layout>;
}

// ─────────────────────────────────────────────────────────────
// 🚀 Main App Component
// ─────────────────────────────────────────────────────────────
export default function App() {
  
  // ✅ START SESSION MONITORING saat aplikasi pertama kali dimuat
  // Fitur ini untuk auto-logout jika user idle > 5 menit
  useEffect(() => {
    const cleanup = startSessionMonitoring();
    return cleanup; // Cleanup listener saat app unmount
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* 🔓 PUBLIC ROUTES - Bisa diakses tanpa login */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 🏠 DEFAULT REDIRECT */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 🔐 PROTECTED ROUTES - Harus login dulu */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/add-transaction"
          element={
            <ProtectedRoute>
              <AddTransaction />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <Transactions />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/edit-transaction/:id"
          element={
            <ProtectedRoute>
              <EditTransaction />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/budget"
          element={
            <ProtectedRoute>
              <Budget />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <Categories />
            </ProtectedRoute>
          }
        />

        {/* ❌ 404 - Catch all undefined routes */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}