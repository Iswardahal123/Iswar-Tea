import React, { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useLang } from "../LanguageContext";
import { useDark } from "../DarkModeContext";

const btnTxt = {
  en: "Got it! 👍", hi: "समझ गया! 👍", ne: "बुझें! 👍", as: "বুজিলোঁ! 👍",
};

export default function AnnouncementPopup({ user, isAdmin }) {
  const { lang } = useLang();
  const { dark } = useDark();
  const [announcement, setAnnouncement] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isAdmin) return;
    const fetchAnnouncement = async () => {
      try {
        const snap = await getDoc(doc(db, "config", "announcement"));
        if (!snap.exists()) return;
        const data = snap.data();
        if (!data.active || !data.message) return;
        // Show only once per announcement (using its id/timestamp)
        const key = "announcement_seen_" + (data.createdAt?.seconds || "0");
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, "1");
        setAnnouncement(data);
        setShow(true);
      } catch (e) { console.error(e); }
    };
    fetchAnnouncement();
  }, [isAdmin, user]);

  if (!show || !announcement) return null;

  const icon = announcement.icon || "📢";
  const title = announcement.title?.[lang] || announcement.title?.en || announcement.title || "";
  const message = announcement.message?.[lang] || announcement.message?.en || announcement.message || "";

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.6)", zIndex: 995,
      display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
    }}>
      <div style={{
        background: dark ? "#1e293b" : "white",
        borderRadius: "24px", width: "100%", maxWidth: "360px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
        border: dark ? "1px solid #334155" : "none",
        overflow: "hidden",
        animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        <style>{`@keyframes popIn{from{transform:scale(0.7);opacity:0}to{transform:scale(1);opacity:1}}`}</style>

        {/* Top banner */}
        <div style={{
          background: "linear-gradient(135deg,#1a3a1a,#2d5a27)",
          padding: "24px 20px 20px", textAlign: "center",
        }}>
          <div style={{ fontSize: "52px", marginBottom: "8px" }}>{icon}</div>
          {title && <div style={{ fontSize: "18px", fontWeight: "900", color: "white", lineHeight: 1.3 }}>{title}</div>}
        </div>

        {/* Message */}
        <div style={{ padding: "20px 22px 24px", fontFamily: "'Segoe UI', sans-serif" }}>
          <p style={{
            fontSize: "15px", lineHeight: "1.7",
            color: dark ? "#e2e8f0" : "#374151",
            margin: "0 0 20px", textAlign: "center",
          }}>{message}</p>

          <button onClick={() => setShow(false)} style={{
            width: "100%", padding: "14px",
            background: "linear-gradient(135deg,#1a3a1a,#2d5a27)",
            color: "white", border: "none", borderRadius: "14px",
            fontSize: "15px", fontWeight: "800",
            cursor: "pointer", fontFamily: "inherit",
          }}>
            {btnTxt[lang] || btnTxt.en}
          </button>
        </div>
      </div>
    </div>
  );
}
