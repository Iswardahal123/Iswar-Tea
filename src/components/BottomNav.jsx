import React from "react";
import { useLang } from "../LanguageContext";

export default function BottomNav({ currentPage, setCurrentPage }) {
  const { lang } = useLang();

  const tabs = {
    en: [
      { id: "dashboard", icon: "🏠", label: "Dashboard" },
      { id: "entry",     icon: "➕", label: "Entry" },
      { id: "view",      icon: "📋", label: "Records" },
      { id: "chat",      icon: "🤖", label: "AI Chat" },
    ],
    hi: [
      { id: "dashboard", icon: "🏠", label: "डैशबोर्ड" },
      { id: "entry",     icon: "➕", label: "प्रविष्टि" },
      { id: "view",      icon: "📋", label: "रिकॉर्ड" },
      { id: "chat",      icon: "🤖", label: "AI चैट" },
    ],
    as: [
      { id: "dashboard", icon: "🏠", label: "ড্যাশব'ৰ্ড" },
      { id: "entry",     icon: "➕", label: "তথ্য" },
      { id: "view",      icon: "📋", label: "ৰেকৰ্ড" },
      { id: "chat",      icon: "🤖", label: "AI চেট" },
    ],
    ne: [
      { id: "dashboard", icon: "🏠", label: "ड्यासबोर्ड" },
      { id: "entry",     icon: "➕", label: "प्रविष्टि" },
      { id: "view",      icon: "📋", label: "रेकर्ड" },
      { id: "chat",      icon: "🤖", label: "AI च्याट" },
    ],
  };

  const currentTabs = tabs[lang] || tabs.as;

  return (
    <div style={styles.nav}>
      {currentTabs.map(tab => (
        <button key={tab.id} onClick={() => setCurrentPage(tab.id)}
          style={{ ...styles.tab, color: currentPage === tab.id ? "#1a3a1a" : "#9ca3af" }}>
          {currentPage === tab.id && <div style={styles.activeBar} />}
          <span style={styles.icon}>{tab.icon}</span>
          <span style={{ ...styles.label, fontWeight: currentPage === tab.id ? "800" : "600" }}>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

const styles = {
  nav: { position: "fixed", bottom: 0, left: 0, right: 0, background: "white", display: "flex", borderTop: "1px solid #e5e7eb", boxShadow: "0 -4px 16px rgba(0,0,0,0.06)", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom)" },
  tab: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px 4px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", position: "relative", gap: "3px" },
  activeBar: { position: "absolute", top: 0, left: "20%", right: "20%", height: "3px", background: "linear-gradient(90deg,#1a3a1a,#2d5a27)", borderRadius: "0 0 3px 3px" },
  icon: { fontSize: "20px" },
  label: { fontSize: "10px" },
};
