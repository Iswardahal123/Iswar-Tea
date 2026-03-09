import React, { useEffect, useState } from "react";
import "./App.css";
import { auth, db } from "./firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

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
    <div style={{ fontSize: "22px", fontWeight: "800" }}>চাহ তথ্য সংগ্ৰাহক</div>
    <div style={{ fontSize: "14px", opacity: 0.7, marginTop: "8px" }}>অপেক্ষা কৰক...</div>
  </div>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentPage, setCurrentPage] = useState("dashboard");

  const checkUserRole = async (u) => {
    try {
      const userRef = doc(db, "users", u.uid);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        // Auto create user doc if missing
        await setDoc(userRef, {
          uid: u.uid,
          email: u.email,
          name: u.displayName || "",
          photo: u.photoURL || "",
          isAdmin: false,
          createdAt: new Date().toISOString(),
        });
        return false;
      }
      return userDoc.data().isAdmin === true;
    } catch (err) {
      console.error("Role check error:", err);
      return false;
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const admin = await checkUserRole(u);
        setIsAdmin(admin);
        setCurrentPage(admin ? "admin" : "dashboard");
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
    const admin = await checkUserRole(u);
    setIsAdmin(admin);
    setCurrentPage(admin ? "admin" : "dashboard");
  };

  if (checkingAuth) return <Loader />;
  if (!user) return <Login onLogin={handleLogin} />;

  const renderPage = () => {
    if (isAdmin) return <AdminDashboard user={user} />;
    switch (currentPage) {
      case "dashboard": return <DashboardPage user={user} />;
      case "entry":     return <EntryFormPage user={user} />;
      case "view":      return <EntryViewPage user={user} />;
      case "chat":      return <AIChatPage user={user} />;
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
