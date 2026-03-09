import React, { useState } from "react";
import { auth, db } from "../firebase/config";
import { signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { doc, getDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";

export default function TopBar({ user, currentPage, isAdmin }) {
  const [showProfile, setShowProfile] = useState(false);
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [newPwd, setNewPwd] = useState("");
  const [currentPwd, setCurrentPwd] = useState("");
  const [clearPwd, setClearPwd] = useState("");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("success");
  const [loading, setLoading] = useState(false);

  const pageNames = {
    dashboard: "Dashboard",
    entry: "Patta Entry",
    view: "Meri Entries",
    chat: "AI Sahayak",
    admin: "Admin Dashboard",
  };

  const handleLogout = () => signOut(auth);

  const handleUpdatePassword = async () => {
    if (!currentPwd || !newPwd) { setMsg("Dono fields bharo!"); setMsgType("error"); return; }
    if (newPwd.length < 6) { setMsg("Password kam se kam 6 characters ka hona chahiye!"); setMsgType("error"); return; }
    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPwd);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPwd);
      setMsg("Password update ho gaya!"); setMsgType("success");
      setCurrentPwd(""); setNewPwd("");
      setTimeout(() => { setShowPwdModal(false); setMsg(""); }, 2000);
    } catch (err) {
      if (err.code === "auth/wrong-password") setMsg("Purana password galat hai!");
      else setMsg("Error: " + err.message);
      setMsgType("error");
    }
    setLoading(false);
  };

  const handleClearData = async () => {
    if (!clearPwd) { setMsg("Password daalo!"); setMsgType("error"); return; }
    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, clearPwd);
      await reauthenticateWithCredential(auth.currentUser, credential);
      const q = query(collection(db, "entries"), where("uid", "==", user.uid));
      const snap = await getDocs(q);
      const delPromises = snap.docs.map((d) => deleteDoc(doc(db, "entries", d.id)));
      await Promise.all(delPromises);
      setMsg("Saara data delete ho gaya!"); setMsgType("success");
      setClearPwd("");
      setTimeout(() => { setShowClearModal(false); setMsg(""); window.location.reload(); }, 2000);
    } catch (err) {
      if (err.code === "auth/wrong-password") setMsg("Password galat hai!");
      else setMsg("Error: " + err.message);
      setMsgType("error");
    }
    setLoading(false);
  };

  const isGoogleUser = user.providerData?.[0]?.providerId === "google.com";

  return (
    <>
      <div style={styles.bar}>
        <div style={styles.left}>
          <span style={styles.logo}>🍃</span>
          <div>
            <div style={styles.appName}>Chai Bagan</div>
            <div style={styles.pageName}>{pageNames[currentPage] || "Home"}</div>
          </div>
        </div>
        <div style={styles.right}>
          {isAdmin && <span style={styles.adminBadge}>👑 Admin</span>}
          <div onClick={() => setShowProfile(true)} style={styles.avatarBtn}>
            {user.photoURL
              ? <img src={user.photoURL} alt="" style={styles.avatarImg} />
              : <div style={styles.avatarText}>{(user.email || "U")[0].toUpperCase()}</div>
            }
          </div>
        </div>
      </div>

      {/* PROFILE MODAL */}
      {showProfile && (
        <div style={styles.overlay} onClick={() => { setShowProfile(false); setMsg(""); }}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>👤 Profile</h3>
              <button onClick={() => setShowProfile(false)} style={styles.closeBtn}>✕</button>
            </div>
            <div style={styles.modalBody}>
              {/* User Info */}
              <div style={styles.profileCard}>
                {user.photoURL
                  ? <img src={user.photoURL} alt="" style={styles.profileImg} />
                  : <div style={styles.profileAvatar}>{(user.email || "U")[0].toUpperCase()}</div>
                }
                <div>
                  <div style={styles.profileName}>{user.displayName || "User"}</div>
                  <div style={styles.profileEmail}>{user.email}</div>
                  <div style={{
                    ...styles.rolePill,
                    background: isAdmin ? "#fef3c7" : "#f0fdf4",
                    color: isAdmin ? "#92400e" : "#166534",
                  }}>
                    {isAdmin ? "👑 Admin" : "👤 Normal User"}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {!isGoogleUser && (
                <button onClick={() => { setShowPwdModal(true); setShowProfile(false); }} style={styles.actionBtn}>
                  🔑 Password Update Karo
                </button>
              )}
              <button onClick={() => { setShowClearModal(true); setShowProfile(false); }} style={styles.dangerBtn}>
                🗑️ Apna Data Clear Karo
              </button>
              <button onClick={handleLogout} style={styles.logoutBtn}>
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PASSWORD UPDATE MODAL */}
      {showPwdModal && (
        <div style={styles.overlay} onClick={() => { setShowPwdModal(false); setMsg(""); }}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>🔑 Password Update</h3>
              <button onClick={() => { setShowPwdModal(false); setMsg(""); }} style={styles.closeBtn}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.field}>
                <label style={styles.fieldLabel}>Purana Password</label>
                <input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} placeholder="Current password" style={styles.fieldInput} />
              </div>
              <div style={styles.field}>
                <label style={styles.fieldLabel}>Naya Password</label>
                <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="New password (min 6)" style={styles.fieldInput} />
              </div>
              {msg && <div style={{ ...styles.msgBox, background: msgType === "success" ? "#f0fdf4" : "#fef2f2", color: msgType === "success" ? "#16a34a" : "#dc2626", borderLeft: "3px solid " + (msgType === "success" ? "#16a34a" : "#dc2626") }}>{msg}</div>}
              <button onClick={handleUpdatePassword} disabled={loading} style={styles.saveBtn}>
                {loading ? "Update ho raha hai..." : "Update Karo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR DATA MODAL */}
      {showClearModal && (
        <div style={styles.overlay} onClick={() => { setShowClearModal(false); setMsg(""); }}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ ...styles.modalTitle, color: "#dc2626" }}>⚠️ Data Clear Karo</h3>
              <button onClick={() => { setShowClearModal(false); setMsg(""); }} style={styles.closeBtn}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.warningBox}>
                ⚠️ Yeh action saari entries permanently delete kar dega! Wapas nahi aayega.
              </div>
              <div style={styles.field}>
                <label style={styles.fieldLabel}>Password confirm karo</label>
                <input type="password" value={clearPwd} onChange={(e) => setClearPwd(e.target.value)} placeholder="Apna password daalo" style={{ ...styles.fieldInput, borderColor: "#fca5a5" }} />
              </div>
              {msg && <div style={{ ...styles.msgBox, background: msgType === "success" ? "#f0fdf4" : "#fef2f2", color: msgType === "success" ? "#16a34a" : "#dc2626", borderLeft: "3px solid " + (msgType === "success" ? "#16a34a" : "#dc2626") }}>{msg}</div>}
              <button onClick={handleClearData} disabled={loading} style={{ ...styles.saveBtn, background: "linear-gradient(135deg, #7f1d1d, #dc2626)" }}>
                {loading ? "Delete ho raha hai..." : "Haan, Saara Data Delete Karo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  bar: {
    background: "linear-gradient(135deg, #1a3a1a, #2d5a27)",
    color: "white", padding: "14px 20px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    position: "sticky", top: 0, zIndex: 100,
    boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
  },
  left: { display: "flex", alignItems: "center", gap: "12px" },
  logo: { fontSize: "28px" },
  appName: { fontSize: "18px", fontWeight: "800", letterSpacing: "-0.5px" },
  pageName: { fontSize: "12px", opacity: 0.75, marginTop: "1px" },
  right: { display: "flex", alignItems: "center", gap: "10px" },
  adminBadge: { background: "#d97706", color: "white", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" },
  avatarBtn: { width: 38, height: 38, borderRadius: "50%", overflow: "hidden", cursor: "pointer", border: "2px solid rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center" },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  avatarText: { fontSize: "16px", fontWeight: "800", color: "white" },
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.55)", zIndex: 999, display: "flex", alignItems: "flex-end", justifyContent: "center" },
  modal: { background: "white", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: "480px", maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column" },
  modalHeader: { padding: "20px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #f3f4f6", flexShrink: 0 },
  modalTitle: { fontSize: "18px", fontWeight: "800", color: "#1a3a1a", margin: 0 },
  closeBtn: { background: "#f3f4f6", border: "none", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", fontSize: "14px", fontWeight: "700", fontFamily: "inherit" },
  modalBody: { padding: "16px 20px 30px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px" },
  profileCard: { display: "flex", alignItems: "center", gap: "14px", background: "#f9fafb", padding: "14px", borderRadius: "14px" },
  profileImg: { width: 56, height: 56, borderRadius: "50%", objectFit: "cover" },
  profileAvatar: { width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#1a3a1a,#2d5a27)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "800", color: "white" },
  profileName: { fontSize: "16px", fontWeight: "800", color: "#1a3a1a" },
  profileEmail: { fontSize: "12px", color: "#6b7280", marginTop: "2px" },
  rolePill: { fontSize: "11px", fontWeight: "700", padding: "3px 10px", borderRadius: "20px", display: "inline-block", marginTop: "6px" },
  actionBtn: { background: "#f0fdf4", color: "#166534", border: "2px solid #86efac", padding: "13px", borderRadius: "12px", cursor: "pointer", fontSize: "14px", fontWeight: "700", fontFamily: "inherit", textAlign: "left" },
  dangerBtn: { background: "#fef2f2", color: "#dc2626", border: "2px solid #fca5a5", padding: "13px", borderRadius: "12px", cursor: "pointer", fontSize: "14px", fontWeight: "700", fontFamily: "inherit", textAlign: "left" },
  logoutBtn: { background: "#f3f4f6", color: "#374151", border: "none", padding: "13px", borderRadius: "12px", cursor: "pointer", fontSize: "14px", fontWeight: "700", fontFamily: "inherit", textAlign: "left" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  fieldLabel: { fontSize: "13px", fontWeight: "700", color: "#374151" },
  fieldInput: { padding: "12px 14px", borderRadius: "10px", border: "2px solid #e5e7eb", fontSize: "15px", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" },
  msgBox: { padding: "10px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "600" },
  saveBtn: { background: "linear-gradient(135deg, #1a3a1a, #2d5a27)", color: "white", border: "none", padding: "14px", borderRadius: "12px", fontSize: "15px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" },
  warningBox: { background: "#fef3c7", color: "#92400e", padding: "12px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: "600", borderLeft: "3px solid #d97706" },
};
