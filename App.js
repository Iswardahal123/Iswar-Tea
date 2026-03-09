// ✅ App.js - Chai Bagan Complete App
import React, { useEffect, useState } from "react";
import { auth } from "./firebase/config";
import { onAuthStateChanged } from "firebase/auth";

// Components
import Login from "./components/Login";
import TopBar from "./components/TopBar";
import BottomNav from "./components/BottomNav";

// Pages
import EntryFormPage from "./pages/EntryFormPage";
import EntryViewPage from "./pages/EntryViewPage";
import AIChatPage from "./pages/AIChatPage";

// 🌀 Loader
const Loader = () => (
  <div style={{
    display: "flex",
    height: "100vh",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    background: "linear-gradient(135deg, #1a3a1a 0%, #2d5a27 50%, #4a7c3f 100%)",
    color: "white",
    fontFamily: "'Segoe UI', sans-serif",
  }}>
    <div style={{ fontSize: "60px", marginBottom: "16px" }}>🍃</div>
    <div style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-0.5px" }}>Chai Bagan</div>
    <div style={{ fontSize: "14px", opacity: 0.7, marginTop: "8px" }}>Loading...</div>
    <div style={{
      width: "40px",
      height: "4px",
      background: "rgba(255,255,255,0.3)",
      borderRadius: "2px",
      marginTop: "20px",
      overflow: "hidden",
    }}>
      <div style={{
        width: "40%",
        height: "100%",
        background: "white",
        borderRadius: "2px",
        animation: "slide 1s ease-in-out infinite alternate",
      }} />
    </div>
    <style>{`@keyframes slide { from { transform: translateX(0); } to { transform: translateX(150%); } }`}</style>
  </div>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentPage, setCurrentPage] = useState("entry");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    setUser(auth.currentUser);
    setCurrentPage("entry");
  };

  if (checkingAuth) return <Loader />;
  if (!user) return <Login onLogin={handleLogin} />;

  const renderPage = () => {
    switch (currentPage) {
      case "entry": return <EntryFormPage />;
      case "view": return <EntryViewPage />;
      case "chat": return <AIChatPage />;
      default: return <EntryFormPage />;
    }
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: "#f8faf8", minHeight: "100vh" }}>
      <TopBar user={user} currentPage={currentPage} />
      <main>{renderPage()}</main>
      <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} />
    </div>
  );
}
