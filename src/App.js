import React, { useEffect, useState } from "react";
import "./App.css";
import { auth, db } from "./firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import Login from "./components/Login";
import TopBar from "./components/TopBar";
import BottomNav from "./components/BottomNav";

import DashboardPage from "./pages/DashboardPage";
import EntryFormPage from "./pages/EntryFormPage";
import EntryViewPage from "./pages/EntryViewPage";
import AIChatPage from "./pages/AIChatPage";
import AdminDashboard from "./pages/admin/AdminDashboard";

const Loader = () => (
  <div style={{
    display: "flex", height: "100vh", alignItems: "center",
    justifyContent: "center", flexDirection: "column",
    background: "linear-gradient(135deg, #1a3a1a 0%, #2d5a27 50%, #4a7c3f 100%)",
    color: "white", fontFamily: "'Segoe UI', sans-serif",
  }}>
    <div style={{ fontSize: "60px", marginBottom: "16px" }}>🍃</div>
    <div style={{ fontSize: "22px", fontWeight: "800" }}>Chai Bagan</div>
    <div style={{ fontSize: "14px", opacity: 0.7, marginTop: "8px" }}>Loading...</div>
    <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}`}</style>
  </div>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentPage, setCurrentPage] = useState("dashboard");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const userDoc = await getDoc(doc(db, "users", u.uid));
        if (userDoc.exists() && userDoc.data().isAdmin === true) {
          setIsAdmin(true);
          setCurrentPage("admin");
        } else {
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
  }, []);

  const handleLogin = async () => {
    const u = auth.currentUser;
    if (!u) return;
    setUser(u);
    const userDoc = await getDoc(doc(db, "users", u.uid));
    if (userDoc.exists() && userDoc.data().isAdmin === true) {
      setIsAdmin(true);
      setCurrentPage("admin");
    } else {
      setIsAdmin(false);
      setCurrentPage("dashboard");
    }
  };

  if (checkingAuth) return <Loader />;
  if (!user) return <Login onLogin={handleLogin} />;

  const renderPage = () => {
    if (isAdmin) return <AdminDashboard user={user} />;
    switch (currentPage) {
      case "dashboard": return <DashboardPage />;
      case "entry":     return <EntryFormPage />;
      case "view":      return <EntryViewPage />;
      case "chat":      return <AIChatPage />;
      default:          return <DashboardPage />;
    }
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: "#f8faf8", minHeight: "100vh" }}>
      <TopBar user={user} currentPage={isAdmin ? "admin" : currentPage} isAdmin={isAdmin} />
      <main>{renderPage()}</main>
      {!isAdmin && <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} />}
    </div>
  );
}
