// 🍃 TopBar.jsx
import React from "react";
import { auth } from "../firebase/config";
import { signOut } from "firebase/auth";

export default function TopBar({ user, currentPage, isAdmin }) {
  const handleLogout = () => signOut(auth);

  const pageNames = {
    entry: "Patta Entry",
    view: "Meri Entries",
    chat: "AI Sahayak",
    admin: "Admin Dashboard",
  };

  return (
    <div style={styles.bar}>
      <div style={styles.left}>
        <span style={styles.logo}>🍃</span>
        <div>
          <div style={styles.appName}>Chai Bagan</div>
          <div style={styles.pageName}>{pageNames[currentPage] || "Home"}</div>
        </div>
      </div>
      <div style={styles.right}>
        {isAdmin && <span style={styles.adminBadge}>👑 Admin</span>}
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>
    </div>
  );
}

const styles = {
  bar: {
    background: "linear-gradient(135deg, #1a3a1a, #2d5a27)",
    color: "white",
    padding: "14px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 100,
    boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
  },
  left: { display: "flex", alignItems: "center", gap: "12px" },
  logo: { fontSize: "28px" },
  appName: { fontSize: "18px", fontWeight: "800", letterSpacing: "-0.5px" },
  pageName: { fontSize: "12px", opacity: 0.75, marginTop: "1px" },
  right: { display: "flex", alignItems: "center", gap: "8px" },
  adminBadge: {
    background: "#d97706",
    color: "white",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
  },
  logoutBtn: {
    background: "rgba(255,255,255,0.15)",
    border: "1px solid rgba(255,255,255,0.3)",
    color: "white",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    fontFamily: "inherit",
  },
};
