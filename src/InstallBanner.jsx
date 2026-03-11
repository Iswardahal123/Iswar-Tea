import React, { useEffect, useState } from "react";
import { useLang } from "../LanguageContext";

const txt = {
  en: { msg: "Install Chai Bagan as an app!", btn: "Install", dismiss: "Not now" },
  hi: { msg: "Chai Bagan को ऐप की तरह इंस्टॉल करें!", btn: "इंस्टॉल", dismiss: "अभी नहीं" },
  ne: { msg: "Chai Bagan एपको रूपमा इन्स्टल गर्नुस्!", btn: "इन्स्टल", dismiss: "अहिले होइन" },
  as: { msg: "Chai Bagan এপ হিচাপে ইনষ্টল কৰক!", btn: "ইনষ্টল", dismiss: "এতিয়া নহয়" },
};

export default function InstallBanner() {
  const { lang } = useLang();
  const T = txt[lang] || txt.en;
  const [prompt, setPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      const dismissed = sessionStorage.getItem("installDismissed");
      if (!dismissed) setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setShow(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem("installDismissed", "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div style={{
      position: "fixed", bottom: 70, left: 12, right: 12, zIndex: 490,
      background: "linear-gradient(135deg,#1a3a1a,#2d5a27)",
      borderRadius: "16px", padding: "12px 16px",
      display: "flex", alignItems: "center", gap: "12px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
      fontFamily: "'Segoe UI', sans-serif",
      animation: "slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)",
    }}>
      <style>{`@keyframes slideUp { from{transform:translateY(80px);opacity:0} to{transform:translateY(0);opacity:1} }`}</style>
      <span style={{ fontSize: "28px" }}>🍃</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "12px", fontWeight: "800", color: "white" }}>{T.msg}</div>
      </div>
      <button onClick={handleDismiss} style={{
        background: "rgba(255,255,255,0.15)", border: "none", color: "rgba(255,255,255,0.8)",
        padding: "6px 10px", borderRadius: "8px", fontSize: "11px",
        cursor: "pointer", fontFamily: "inherit", fontWeight: "700",
      }}>{T.dismiss}</button>
      <button onClick={handleInstall} style={{
        background: "white", border: "none", color: "#1a3a1a",
        padding: "8px 14px", borderRadius: "8px", fontSize: "12px",
        cursor: "pointer", fontFamily: "inherit", fontWeight: "800",
      }}>{T.btn}</button>
    </div>
  );
}
