import React, { useEffect, useState } from "react";
import "./App.css";
import { auth, db } from "./firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

import { useLang } from "./LanguageContext";
import Login from "./components/Login";
import TopBar from "./components/TopBar";
import BottomNav from "./components/BottomNav";
import WhatsAppFloat from "./components/WhatsAppFloat";

import DashboardPage from "./pages/DashboardPage";
import EntryFormPage from "./pages/EntryFormPage";
import EntryViewPage from "./pages/EntryViewPage";
import AIChatPage from "./pages/AIChatPage";
import AdminDashboard from "./pages/admin/AdminDashboard";

const Loader = ({ t }) => (
  <div style={{
    display: "flex", height: "100vh", alignItems: "center",
    justifyContent: "center", flexDirection: "column",
    background: "linear-gradient(135deg, #1a3a1a 0%, #2d5a27 50%, #4a7c3f 100%)",
    color: "white", fontFamily: "'Segoe UI', sans-serif",
  }}>
    <div style={{ fontSize: "60px", marginBottom: "16px" }}>🍃</div>
    <div style={{ fontSize: "22px", fontWeight: "800" }}>{t?.welcome || "Welcome 🙏"}</div>
    <div style={{ fontSize: "14px", opacity: 0.7, marginTop: "8px" }}>{t?.loading || "Please wait..."}</div>
  </div>
);

export default function App() {
  const { lang, setLang, t } = useLang();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentPage, setCurrentPage] = useState("dashboard");


  useEffect(() => {
    const checkRole = async (u) => {
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
          return false;
        }
        const data = userDoc.data();
        if (data.language && data.language !== lang) setLang(data.language);
        return data.isAdmin === true;
      } catch (err) { console.error(err); return false; }
    };

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const admin = await checkRole(u);
        setIsAdmin(admin);
        setCurrentPage(admin ? "admin" : "dashboard");
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
    const admin = await checkUserRole(u);
    setIsAdmin(admin);
    setCurrentPage(admin ? "admin" : "dashboard");
  };

  // Save language to Firestore when changed (if logged in)
  const handleLangChange = async (newLang) => {
    setLang(newLang);
    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), { language: newLang });
      } catch (e) { console.error(e); }
    }
  };

  // Step 1: Checking auth
  if (checkingAuth) return <Loader t={t} />;

  // Step 3: Not logged in
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
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: "#f8faf8", minHeight: "100vh" }}>
      <TopBar user={user} currentPage={isAdmin ? "admin" : currentPage} isAdmin={isAdmin} onLangChange={handleLangChange} />
      <main>{renderPage()}</main>
      {!isAdmin && <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} />}
      <WhatsAppFloat />
    </div>
  );
}
