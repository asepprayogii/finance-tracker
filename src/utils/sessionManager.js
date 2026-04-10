// src/utils/sessionManager.js
import { supabase } from "../lib/supabase";

const INACTIVE_TIMEOUT = 5 * 60 * 1000; // 5 menit dalam ms
const STORAGE_KEY = "fintrack_session_timeout";
let timerId = null;

export function resetSessionTimer() {
  clearTimeout(timerId);

  timerId = setTimeout(async () => {
    console.log("🔒 Auto-logout: Tidak ada aktivitas selama 5 menit");

    // ✅ SIMPAN KE LOCALSTORAGE (persisten, tidak hilang saat tab ditutup)
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        reason: "timeout",
        timestamp: new Date().toISOString(),
        message: "Sesi Anda telah berakhir karena tidak ada aktivitas selama 5 menit.",
      }),
    );

    // Logout dari Supabase
    await supabase.auth.signOut();

    // Redirect ke login
    window.location.href = "/login";
  }, INACTIVE_TIMEOUT);
}

export function startSessionMonitoring() {
  const events = ["mousedown", "keydown", "scroll", "touchstart", "mousemove", "click"];
  const handleActivity = () => resetSessionTimer();

  events.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }));

  resetSessionTimer();

  return () => {
    clearTimeout(timerId);
    events.forEach((event) => window.removeEventListener(event, handleActivity));
  };
}

// ✅ Helper: Cek & ambil info timeout (untuk dipakai di Login.jsx)
export function getTimeoutInfo() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw);

    // Optional: Hapus otomatis jika sudah >24 jam (agar tidak nyangkut forever)
    const expiryTime = new Date(data.timestamp);
    expiryTime.setHours(expiryTime.getHours() + 24);

    if (new Date() > expiryTime) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

// ✅ Helper: Hapus flag timeout setelah user acknowledge
export function clearTimeoutFlag() {
  localStorage.removeItem(STORAGE_KEY);
}
