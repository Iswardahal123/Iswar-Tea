import React, { useEffect, useState } from "react";
import "./App.css";
import { auth, db } from "./firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

import { useLang } from "./LanguageContext";
import { useDark } from "./DarkModeContext";
import Login from "./components/Login";
import TopBar from "./components/TopBar";
import BottomNav from "./components/BottomNav";
import WhatsAppFloat from "./components/WhatsAppFloat";

import DashboardPage from "./pages/DashboardPage";
import EntryFormPage from "./pages/EntryFormPage";
import EntryViewPage from "./pages/EntryViewPage";
import AIChatPage from "./pages/AIChatPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import WelcomePopup from "./components/WelcomePopup";
import InstallBanner from "./components/InstallBanner";

const Loader = ({ t }) => (
  <div style={{
    display: "flex", height: "100vh", alignItems: "center", justifyContent: "center",
    flexDirection: "column",
    background: "linear-gradient(135deg,#1a3a1a,#2d5a27,#4a7c3f)",
    color: "white", fontFamily: "'Segoe UI',sans-serif",
  }}>
    <div style={{ fontSize: "60px", marginBottom: "16px" }}>🍃</div>
    <div style={{ fontSize: "22px", fontWeight: "800" }}>{t?.welcome || "Welcome 🙏"}</div>
    <div style={{ fontSize: "14px", opacity: 0.7, marginTop: "8px" }}>{t?.loading || "Please wait..."}</div>
  </div>
);

// ── Announcement Ticker ──
const AnnouncementTicker = ({ lang }) => {
  const [msg, setMsg] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const loadAnn = async () => {
      try {
        const snap = await getDoc(doc(db, "config", "announcement"));
        if (!snap.exists()) return;
        const data = snap.data();
        if (!data.active || !data.message) return;
        const key = "ann_ticker_" + (data.createdAt?.seconds || "0");
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, "1");
        const text = data.message?.[lang] || data.message?.en || data.message || "";
        const icon = data.icon || "📢";
        setMsg(icon + "  " + text + "  •  " + icon + "  " + text);
        setVisible(true);
      } catch (e) { console.error(e); }
    };
    loadAnn();
  }, [lang]);

  if (!visible || !msg) return null;

  return (
    <div style={{
      background: "linear-gradient(135deg,#1e293b,#0f172a)",
      overflow: "hidden", height: "34px", display: "flex", alignItems: "center",
      borderBottom: "1px solid rgba(251,191,36,0.3)",
      cursor: "pointer",
    }} onClick={() => setVisible(false)}>
      <style>{`
        @keyframes annTicker {
          0%   { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
      <div style={{
        whiteSpace: "nowrap", fontSize: "12px", fontWeight: "700",
        color: "#fde68a", fontFamily: "'Segoe UI', sans-serif",
        animation: "annTicker 22s linear 1 forwards",
        paddingLeft: "100vw",
      }}>
        {msg}
      </div>
    </div>
  );
};

export default function App() {
  const { lang, setLang, t } = useLang();
  const { dark } = useDark();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [showWelcome, setShowWelcome] = useState(false);

  const triggerWelcome = () => {
    if (!sessionStorage.getItem("welcomed")) {
      sessionStorage.setItem("welcomed", "1");
      setShowWelcome(true);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        try {
          const userRef = doc(db, "users", u.uid);
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            await setDoc(userRef, {
              uid: u.uid, email: u.email,
              name: u.displayName || "", photo: u.photoURL || "",
              isAdmin: false, language: lang || "as",
              createdAt: new Date().toISOString(),
            });
            setIsAdmin(false);
            setCurrentPage("dashboard");
          } else {
            const data = userDoc.data();
            if (data.language) setLang(data.language);
            const admin = data.isAdmin === true;
            setIsAdmin(admin);
            setCurrentPage(admin ? "admin" : "dashboard");
            if (!admin) triggerWelcome();
          }
        } catch (err) {
          console.error("Auth error:", err);
          setIsAdmin(false);
          setCurrentPage("dashboard");
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setCheckingAuth(false);
    });
    return () => unsub();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = async () => {
    const u = auth.currentUser;
    if (!u) return;
    setUser(u);
    try {
      const userDoc = await getDoc(doc(db, "users", u.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.language) setLang(data.language);
        const admin = data.isAdmin === true;
        setIsAdmin(admin);
        setCurrentPage(admin ? "admin" : "dashboard");
      } else {
        setIsAdmin(false);
        setCurrentPage("dashboard");
      }
    } catch (err) { console.error("Login error:", err); }
  };

  const handleLangChange = async (newLang) => {
    setLang(newLang);
    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), { language: newLang });
      } catch (e) { console.error(e); }
    }
  };

  if (checkingAuth) return <Loader t={t} />;
  if (!user) return <Login onLogin={handleLogin} />;

  const renderPage = () => {
    if (isAdmin) return <AdminDashboard user={user} />;
    switch (currentPage) {
      case "dashboard": return <DashboardPage user={user} />;
      case "entry":     return <EntryFormPage user={user} />;
      case "view":      return <EntryViewPage user={user} />;
      case "chat":      return <AIChatPage user={user} />;
      default:          return <DashboardPage user={user} />;
    }
  };

  return (
    <div style={{ fontFamily: "'Segoe UI',sans-serif", background: dark ? "#0f172a" : "#f8faf8", minHeight: "100vh", color: dark ? "#f1f5f9" : "#1a1a1a" }}>
      <TopBar user={user} currentPage={isAdmin ? "admin" : currentPage} isAdmin={isAdmin} onLangChange={handleLangChange} />
      <InstallBanner />
      {!isAdmin && <AnnouncementTicker lang={lang} />}
      {showWelcome && !isAdmin && <WelcomePopup userName={user.displayName || user.email} onClose={() => setShowWelcome(false)} />}
      <main>{renderPage()}</main>
      {!isAdmin && <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} />}
      <WhatsAppFloat isAdmin={isAdmin} />
    </div>
  );
}
