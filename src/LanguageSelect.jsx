import React from "react";
import { useLang } from "../LanguageContext";
import { langNames } from "../languages";

const flags = { en: "🇬🇧", hi: "🇮🇳", as: "🌿" };
const desc = {
  en: "Continue in English",
  hi: "हिंदी में जारी रखें",
  as: "অসমীয়াত আগবাঢ়ক",
};

export default function LanguageSelect({ onSelect }) {
  const { setLang } = useLang();

  const choose = (l) => {
    setLang(l);
    onSelect && onSelect(l);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.leaf}>🍃</div>
        <h2 style={styles.title}>Chai Bagan</h2>
        <p style={styles.sub}>Select your language / भाषा चुनें / ভাষা বাছক</p>
        <div style={styles.btnGroup}>
          {Object.keys(langNames).map(l => (
            <button key={l} onClick={() => choose(l)} style={styles.btn}>
              <span style={styles.flag}>{flags[l]}</span>
              <div style={styles.btnText}>
                <div style={styles.btnName}>{langNames[l]}</div>
                <div style={styles.btnDesc}>{desc[l]}</div>
              </div>
              <span style={styles.arrow}>›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg,#1a3a1a,#2d5a27,#4a7c3f)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'Segoe UI', sans-serif" },
  card: { background: "white", borderRadius: "24px", padding: "36px 28px", width: "100%", maxWidth: "380px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", textAlign: "center" },
  leaf: { fontSize: "56px", marginBottom: "8px" },
  title: { fontSize: "28px", fontWeight: "900", color: "#1a3a1a", margin: "0 0 6px" },
  sub: { fontSize: "12px", color: "#9ca3af", margin: "0 0 28px", lineHeight: "1.6" },
  btnGroup: { display: "flex", flexDirection: "column", gap: "12px" },
  btn: { display: "flex", alignItems: "center", gap: "14px", padding: "16px 18px", background: "#f9fafb", border: "2px solid #e5e7eb", borderRadius: "14px", cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "all 0.15s" },
  flag: { fontSize: "28px", flexShrink: 0 },
  btnText: { flex: 1 },
  btnName: { fontSize: "16px", fontWeight: "800", color: "#1a3a1a" },
  btnDesc: { fontSize: "12px", color: "#9ca3af", marginTop: "2px" },
  arrow: { fontSize: "24px", color: "#d1d5db" },
};
