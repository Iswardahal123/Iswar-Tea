import React, { useEffect, useState } from "react";
import { useLang } from "../LanguageContext";
import { useDark } from "../DarkModeContext";

const txt = {
  en: { msg: "Install Chai Bagan app on your phone!", btn: "Install", dismiss: "Not now", iosMsg: "Tap Share → 'Add to Home Screen'", iosTitle: "Install App 🍃" },
  hi: { msg: "Chai Bagan ऐप अपने फोन में इंस्टॉल करें!", btn: "इंस्टॉल", dismiss: "अभी नहीं", iosMsg: "Share बटन दबाएं → 'Add to Home Screen' चुनें", iosTitle: "ऐप इंस्टॉल करें 🍃" },
  ne: { msg: "Chai Bagan एप आफ्नो फोनमा इन्स्टल गर्नुस्!", btn: "इन्स्टल", dismiss: "अहिले होइन", iosMsg: "Share थिच्नुस् → 'Add to Home Screen' छान्नुस्", iosTitle: "एप इन्स्टल गर्नुस् 🍃" },
  as: { msg: "Chai Bagan এপ আপোনাৰ ফোনত ইনষ্টল কৰক!", btn: "ইনষ্টল", dismiss: "এতিয়া নহয়", iosMsg: "Share টিপক → 'Add to Home Screen' বাছক", iosTitle: "এপ ইনষ্টল কৰক 🍃" },
};

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

export default function InstallBanner() {
  const { lang } = useLang();
  const { dark } = useDark();
  const T = txt[lang] || txt.en;

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Already installed
    if (isInStandaloneMode()) return;
    // Already dismissed this session
    if (sessionStorage.getItem("installDismissed")) return;

    if (isIOS()) {
      // iOS: show manual guide after 3s
      const t = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(t);
    }

    // Android/Chrome: listen for prompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Fallback: show manual banner after 5s even if no prompt
    const fallback = setTimeout(() => {
      setShowBanner(true);
    }, 5000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(fallback);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") { setShowBanner(false); return; }
    }
    if (isIOS()) {
      setShowIOSGuide(true);
      setShowBanner(false);
      return;
    }
    // Android fallback — show guide
    setShowIOSGuide(true);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem("installDismissed", "1");
    setShowBanner(false);
    setShowIOSGuide(false);
  };

  // iOS / manual guide modal
  if (showIOSGuide) {
    return (
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 996, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ background: dark ? "#1e293b" : "white", borderRadius: "20px", padding: "28px 22px", width: "100%", maxWidth: "340px", textAlign: "center", fontFamily: "'Segoe UI', sans-serif" }}>
          <div style={{ fontSize: "50px", marginBottom: "12px" }}>🍃</div>
          <div style={{ fontSize: "17px", fontWeight: "900", color: dark ? "#f1f5f9" : "#1a3a1a", marginBottom: "12px" }}>{T.iosTitle}</div>
          <div style={{ fontSize: "14px", color: dark ? "#94a3b8" : "#6b7280", lineHeight: "1.7", marginBottom: "8px" }}>
            {isIOS() ? (
              <>
                1. Safari mein open karo<br />
                2. Niche <b>Share</b> (📤) button dabaao<br />
                3. <b>"Add to Home Screen"</b> choose karo<br />
                4. <b>Add</b> dabaao ✅
              </>
            ) : (
              <>
                Chrome mein:<br />
                1. Upar <b>⋮ menu</b> dabaao<br />
                2. <b>"Add to Home Screen"</b> choose karo<br />
                3. <b>Add</b> dabaao ✅
              </>
            )}
          </div>
          <button onClick={handleDismiss} style={{ marginTop: "16px", width: "100%", padding: "13px", background: "linear-gradient(135deg,#1a3a1a,#2d5a27)", color: "white", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: "800", cursor: "pointer", fontFamily: "inherit" }}>
            {lang === "en" ? "Got it!" : lang === "hi" ? "समझ गया!" : lang === "ne" ? "बुझें!" : "বুজিলোঁ!"}
          </button>
        </div>
      </div>
    );
  }

  if (!showBanner) return null;

  return (
    <div style={{
      position: "fixed", bottom: 74, left: 10, right: 10, zIndex: 490,
      background: "linear-gradient(135deg,#1a3a1a,#2d5a27)",
      borderRadius: "16px", padding: "12px 14px",
      display: "flex", alignItems: "center", gap: "10px",
      boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
      fontFamily: "'Segoe UI', sans-serif",
      animation: "slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)",
    }}>
      <style>{`@keyframes slideUp{from{transform:translateY(100px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
      <span style={{ fontSize: "26px", flexShrink: 0 }}>🍃</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "12px", fontWeight: "800", color: "white", lineHeight: 1.3 }}>{T.msg}</div>
      </div>
      <button onClick={handleDismiss} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "rgba(255,255,255,0.85)", padding: "6px 9px", borderRadius: "8px", fontSize: "11px", cursor: "pointer", fontFamily: "inherit", fontWeight: "700", whiteSpace: "nowrap", flexShrink: 0 }}>
        {T.dismiss}
      </button>
      <button onClick={handleInstall} style={{ background: "white", border: "none", color: "#1a3a1a", padding: "8px 13px", borderRadius: "8px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", fontWeight: "900", whiteSpace: "nowrap", flexShrink: 0 }}>
        {T.btn}
      </button>
    </div>
  );
}
