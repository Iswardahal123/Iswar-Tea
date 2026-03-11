import React, { useEffect, useState } from "react";
import { useLang } from "../LanguageContext";

const txt = {
  en: {
    namaste: (n) => `Namaste, ${n}! 🙏`,
    system: "Tea Management System",
    f1: "📊 Track weight & earnings",
    f2: "💰 Manage advance & balance",
    f3: "🤖 AI assistant for queries",
    f4: "🔒 Safe & secure cloud data",
    regards: "Regards —",
    team: "Team Iswar 🍃",
    btn: "Let's Go! 🚀",
  },
  hi: {
    namaste: (n) => `नमस्ते, ${n}! 🙏`,
    system: "चाय बागान प्रबंधन",
    f1: "📊 वजन और कमाई ट्रैक करें",
    f2: "💰 अग्रिम और बकाया प्रबंधन",
    f3: "🤖 AI सहायक से सवाल पूछें",
    f4: "🔒 सुरक्षित क्लाउड डेटा",
    regards: "शुभकामनाएं —",
    team: "टीम ईश्वर 🍃",
    btn: "चलें! 🚀",
  },
  ne: {
    namaste: (n) => `नमस्ते, ${n}! 🙏`,
    system: "चिया बगान व्यवस्थापन",
    f1: "📊 तौल र आम्दानी ट्र्याक",
    f2: "💰 अग्रिम र बाँकी व्यवस्थापन",
    f3: "🤖 AI सहायकसँग प्रश्न सोध्नुस्",
    f4: "🔒 सुरक्षित क्लाउड डेटा",
    regards: "शुभकामना —",
    team: "टिम ईश्वर 🍃",
    btn: "जाऔं! 🚀",
  },
  as: {
    namaste: (n) => `নমস্কাৰ, ${n}! 🙏`,
    system: "চাহ বাগান ব্যৱস্থাপনা",
    f1: "📊 ওজন আৰু উপাৰ্জন ট্ৰেক",
    f2: "💰 এডভান্স আৰু বাকী পৰিচালনা",
    f3: "🤖 AI সহায়কক প্ৰশ্ন কৰক",
    f4: "🔒 সুৰক্ষিত ক্লাউড ডেটা",
    regards: "ধন্যবাদেৰে —",
    team: "টিম ঈশ্বৰ 🍃",
    btn: "আৰম্ভ কৰোঁ! 🚀",
  },
};

export default function WelcomePopup({ userName, onClose }) {
  const { lang } = useLang();
  const T = txt[lang] || txt.en;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const name = userName ? userName.split(" ")[0] : "";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px",
      opacity: visible ? 1 : 0,
      transition: "opacity 0.3s ease",
    }}>
      <div style={{
        background: "white", borderRadius: "24px",
        width: "100%", maxWidth: "300px",
        padding: "28px 24px 20px",
        textAlign: "center",
        fontFamily: "'Segoe UI', sans-serif",
        transform: visible ? "scale(1)" : "scale(0.85)",
        transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        <div style={{ fontSize: "40px", marginBottom: "10px" }}>🍃</div>
        <div style={{ fontSize: "18px", fontWeight: "900", color: "#1a3a1a", marginBottom: "4px" }}>
          {T.namaste(name)}
        </div>
        <div style={{ fontSize: "12px", fontWeight: "700", color: "#4a7c3f", marginBottom: "14px" }}>
          {T.system}
        </div>
        <div style={{ fontSize: "12px", color: "#6b7280", lineHeight: "1.9", marginBottom: "16px" }}>
          {T.f1}<br />{T.f2}<br />{T.f3}<br />{T.f4}
        </div>
        <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "16px" }}>
          {T.regards} <span style={{ fontWeight: "800", color: "#2d5a27" }}>{T.team}</span>
        </div>
        <button onClick={handleClose} style={{
          width: "100%", padding: "11px",
          background: "linear-gradient(135deg,#1a3a1a,#2d5a27)",
          color: "white", border: "none", borderRadius: "12px",
          fontSize: "14px", fontWeight: "800", cursor: "pointer",
          fontFamily: "inherit",
        }}>
          {T.btn}
        </button>
      </div>
    </div>
  );
}
