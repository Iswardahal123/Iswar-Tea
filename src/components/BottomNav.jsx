import React from "react";

export default function BottomNav({ currentPage, setCurrentPage }) {
  const tabs = [
    { id: "dashboard", icon: "🏠", label: "Dashboard" },
    { id: "entry",     icon: "➕", label: "Entry" },
    { id: "view",      icon: "📋", label: "Records" },
    { id: "chat",      icon: "🤖", label: "AI Chat" },
  ];

  return (
    <div style={styles.nav}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setCurrentPage(tab.id)}
          style={{ ...styles.tab, color: currentPage === tab.id ? "#2d5a27" : "#9ca3af" }}
        >
          {currentPage === tab.id && <div style={styles.indicator} />}
          <span style={styles.icon}>{tab.icon}</span>
          <span style={styles.label}>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

const styles = {
  nav: {
    position: "fixed", bottom: 0, left: 0, right: 0,
    background: "white", display: "flex",
    borderTop: "1px solid #e5e7eb",
    boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
    zIndex: 100, maxWidth: "480px", margin: "0 auto",
    paddingBottom: "env(safe-area-inset-bottom, 0px)",
  },
  tab: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: "10px 4px", background: "none", border: "none",
    cursor: "pointer", position: "relative", gap: "2px",
    fontFamily: "inherit", transition: "color 0.2s",
  },
  indicator: {
    position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
    width: "28px", height: "3px", background: "#2d5a27",
    borderRadius: "0 0 4px 4px",
  },
  icon: { fontSize: "20px", lineHeight: 1 },
  label: { fontSize: "10px", fontWeight: "700" },
};
