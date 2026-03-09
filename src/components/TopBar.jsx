import React, { useState, useRef, useEffect } from "react";
import { auth, db } from "../firebase/config";
import { signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { doc, deleteDoc, collection, query, where, getDocs, getDoc, updateDoc } from "firebase/firestore";

export default function TopBar({ user, currentPage, isAdmin }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [currentAdvance, setCurrentAdvance] = useState(0);
  const [newAdvanceAmt, setNewAdvanceAmt] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [currentPwd, setCurrentPwd] = useState("");
  const [clearPwd, setClearPwd] = useState("");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("success");
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const pageNames = {
    dashboard: "Dashboard",
    entry: "Patta Entry",
    view: "Meri Entries",
    chat: "AI Sahayak",
    admin: "Admin Dashboard",
  };

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => { signOut(auth); setShowDropdown(false); };

  const openAdvanceModal = async () => {
    setShowAdvanceModal(true);
    setShowDropdown(false);
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setCurrentAdvance(userDoc.data().totalAdvanceTaken || 0);
      }
    } catch (err) { console.error(err); }
  };

  const handleAdvanceSave = async () => {
    const amt = parseFloat(newAdvanceAmt) || 0;
    if (amt <= 0) { setMsg("Sahi amount daalo!"); setMsgType("error"); return; }
    setLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const updated = currentAdvance + amt;
      await updateDoc(userRef, { totalAdvanceTaken: updated });
      setCurrentAdvance(updated);
      setMsg("Advance update ho gaya! Rs " + updated.toFixed(0));
      setMsgType("success");
      setNewAdvanceAmt("");
      setTimeout(() => { setShowAdvanceModal(false); setMsg(""); }, 1500);
    } catch (err) {
      setMsg("Error: " + err.message); setMsgType("error");
    }
    setLoading(false);
  };

  const handleUpdatePassword = async () => {
    if (!currentPwd || !newPwd) { setMsg("Dono fields bharo!"); setMsgType("error"); return; }
    if (newPwd.length < 6) { setMsg("Password kam se kam 6 characters!"); setMsgType("error"); return; }
    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPwd);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPwd);
      setMsg("Password update ho gaya!"); setMsgType("success");
      setCurrentPwd(""); setNewPwd("");
      setTimeout(() => { setShowPwdModal(false); setMsg(""); }, 2000);
    } catch (err) {
      setMsg(err.code === "auth/wrong-password" ? "Purana password galat hai!" : "Error: " + err.message);
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
      await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, "entries", d.id))));
      setMsg("Saara data delete ho gaya!"); setMsgType("success");
      setClearPwd("");
      setTimeout(() => { setShowClearModal(false); setMsg(""); window.location.reload(); }, 2000);
    } catch (err) {
      setMsg(err.code === "auth/wrong-password" ? "Password galat hai!" : "Error: " + err.message);
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
            <div style={styles.appName}>চাহ হিচাব (ঈশ্বৰ)</div>
            <div style={styles.pageName}>{pageNames[currentPage] || "Home"}</div>
          </div>
        </div>
        <div style={styles.right}>
          {isAdmin && <span style={styles.adminBadge}>Admin</span>}
          <div ref={dropdownRef} style={styles.avatarWrapper}>
            <div onClick={() => setShowDropdown(!showDropdown)} style={styles.avatarBtn}>
              {user.photoURL
                ? <img src={user.photoURL} alt="" style={styles.avatarImg} />
                : <div style={styles.avatarText}>{(user.email || "U")[0].toUpperCase()}</div>
              }
            </div>
            {showDropdown && (
              <div style={styles.dropdown}>
                <div style={styles.dropUserInfo}>
                  {user.photoURL
                    ? <img src={user.photoURL} alt="" style={styles.dropAvatar} />
                    : <div style={styles.dropAvatarText}>{(user.email || "U")[0].toUpperCase()}</div>
                  }
                  <div style={styles.dropInfo}>
                    <div style={styles.dropName}>{user.displayName || "User"}</div>
                    <div style={styles.dropEmail}>{user.email}</div>
                    <div style={{ ...styles.dropRole, background: isAdmin ? "#fef3c7" : "#f0fdf4", color: isAdmin ? "#92400e" : "#166534" }}>
                      {isAdmin ? "Admin" : "User"}
                    </div>
                  </div>
                </div>
                <div style={styles.dropDivider} />
                {!isGoogleUser && (
                  <div style={styles.dropItem} onClick={() => { setShowPwdModal(true); setShowDropdown(false); }}>
                    <span style={styles.dropIcon}>🔑</span> Password Update
                  </div>
                )}
                <div style={styles.dropItem} onClick={openAdvanceModal}>
                  <span style={styles.dropIcon}>💰</span> Advance Update Karo
                </div>
                <div style={{ ...styles.dropItem, color: "#dc2626" }} onClick={() => { setShowClearModal(true); setShowDropdown(false); }}>
                  <span style={styles.dropIcon}>🗑️</span> Data Clear Karo
                </div>
                <div style={styles.dropDivider} />
                <div style={styles.dropItem} onClick={handleLogout}>
                  <span style={styles.dropIcon}>🚪</span> Logout
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ADVANCE MODAL */}
      {showAdvanceModal && (
        <div style={styles.overlay} onClick={() => { setShowAdvanceModal(false); setMsg(""); }}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>💰 Advance Update</h3>
              <button onClick={() => { setShowAdvanceModal(false); setMsg(""); }} style={styles.closeBtn}>X</button>
            </div>
            <div style={styles.modalBody}>
              <div style={{ background: "#fef3c7", borderRadius: "12px", padding: "14px", textAlign: "center" }}>
                <div style={{ fontSize: "12px", color: "#92400e", fontWeight: "700" }}>Abhi Tak Total Advance Liya</div>
                <div style={{ fontSize: "28px", fontWeight: "900", color: "#d97706" }}>Rs {currentAdvance.toFixed(0)}</div>
              </div>
              <div style={styles.field}>
                <label style={styles.fieldLabel}>Kitna naya advance liya? (Rs)</label>
                <input type="number" value={newAdvanceAmt} onChange={(e) => setNewAdvanceAmt(e.target.value)} placeholder="Amount daalo" style={styles.fieldInput} />
              </div>
              {parseFloat(newAdvanceAmt) > 0 && (
                <div style={{ background: "#f0fdf4", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#166534", fontWeight: "700" }}>
                  Naya total: Rs {(currentAdvance + parseFloat(newAdvanceAmt)).toFixed(0)}
                </div>
              )}
              {msg && <div style={{ ...styles.msgBox, background: msgType === "success" ? "#f0fdf4" : "#fef2f2", color: msgType === "success" ? "#16a34a" : "#dc2626" }}>{msg}</div>}
              <button onClick={handleAdvanceSave} disabled={loading} style={styles.saveBtn}>
                {loading ? "Save ho raha hai..." : "Update Karo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PASSWORD MODAL */}
      {showPwdModal && (
        <div style={styles.overlay} onClick={() => { setShowPwdModal(false); setMsg(""); }}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>🔑 Password Update</h3>
              <button onClick={() => { setShowPwdModal(false); setMsg(""); }} style={styles.closeBtn}>X</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.field}>
                <label style={styles.fieldLabel}>Purana Password</label>
                <input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} placeholder="Current password" style={styles.fieldInput} />
              </div>
              <div style={styles.field}>
                <label style={styles.fieldLabel}>Naya Password</label>
                <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="Min 6 characters" style={styles.fieldInput} />
              </div>
              {msg && <div style={{ ...styles.msgBox, background: msgType === "success" ? "#f0fdf4" : "#fef2f2", color: msgType === "success" ? "#16a34a" : "#dc2626" }}>{msg}</div>}
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
              <button onClick={() => { setShowClearModal(false); setMsg(""); }} style={styles.closeBtn}>X</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.warningBox}>Yeh action saari entries permanently delete kar dega!</div>
              <div style={styles.field}>
                <label style={styles.fieldLabel}>Password confirm karo</label>
                <input type="password" value={clearPwd} onChange={(e) => setClearPwd(e.target.value)} placeholder="Apna password daalo" style={{ ...styles.fieldInput, borderColor: "#fca5a5" }} />
              </div>
              {msg && <div style={{ ...styles.msgBox, background: msgType === "success" ? "#f0fdf4" : "#fef2f2", color: msgType === "success" ? "#16a34a" : "#dc2626" }}>{msg}</div>}
              <button onClick={handleClearData} disabled={loading} style={{ ...styles.saveBtn, background: "linear-gradient(135deg,#7f1d1d,#dc2626)" }}>
                {loading ? "Delete ho raha hai..." : "Saara Data Delete Karo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  bar: { background: "linear-gradient(135deg, #1a3a1a, #2d5a27)", color: "white", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 200, boxShadow: "0 2px 12px rgba(0,0,0,0.2)" },
  left: { display: "flex", alignItems: "center", gap: "10px" },
  logo: { fontSize: "26px" },
  appName: { fontSize: "17px", fontWeight: "800", letterSpacing: "-0.5px" },
  pageName: { fontSize: "11px", opacity: 0.75 },
  right: { display: "flex", alignItems: "center", gap: "8px" },
  adminBadge: { background: "#d97706", color: "white", padding: "3px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" },
  avatarWrapper: { position: "relative" },
  avatarBtn: { width: 36, height: 36, borderRadius: "50%", overflow: "hidden", cursor: "pointer", border: "2px solid rgba(255,255,255,0.6)", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.15)" },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  avatarText: { fontSize: "15px", fontWeight: "800", color: "white" },
  dropdown: { position: "absolute", top: "calc(100% + 10px)", right: 0, width: "260px", background: "white", borderRadius: "16px", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", zIndex: 999, overflow: "hidden", border: "1px solid #e5e7eb" },
  dropUserInfo: { display: "flex", alignItems: "center", gap: "12px", padding: "16px", background: "#f9fafb" },
  dropAvatar: { width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0 },
  dropAvatarText: { width: 44, height: 44, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,#1a3a1a,#2d5a27)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "800", color: "white" },
  dropInfo: { flex: 1, minWidth: 0 },
  dropName: { fontSize: "14px", fontWeight: "800", color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  dropEmail: { fontSize: "11px", color: "#6b7280", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  dropRole: { fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "20px", display: "inline-block", marginTop: "5px" },
  dropDivider: { height: "1px", background: "#f3f4f6" },
  dropItem: { display: "flex", alignItems: "center", gap: "10px", padding: "13px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer", color: "#374151" },
  dropIcon: { fontSize: "16px" },
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 998, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" },
  modal: { background: "white", borderRadius: "20px", width: "100%", maxWidth: "400px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden" },
  modalHeader: { padding: "18px 20px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #f3f4f6" },
  modalTitle: { fontSize: "17px", fontWeight: "800", color: "#1a3a1a", margin: 0 },
  closeBtn: { background: "#f3f4f6", border: "none", width: "30px", height: "30px", borderRadius: "50%", cursor: "pointer", fontSize: "12px", fontWeight: "700", fontFamily: "inherit" },
  modalBody: { padding: "16px 20px 24px", display: "flex", flexDirection: "column", gap: "14px" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  fieldLabel: { fontSize: "13px", fontWeight: "700", color: "#374151" },
  fieldInput: { padding: "11px 14px", borderRadius: "10px", border: "2px solid #e5e7eb", fontSize: "15px", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" },
  msgBox: { padding: "10px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "600" },
  saveBtn: { background: "linear-gradient(135deg, #1a3a1a, #2d5a27)", color: "white", border: "none", padding: "13px", borderRadius: "12px", fontSize: "15px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" },
  warningBox: { background: "#fef3c7", color: "#92400e", padding: "12px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: "600", borderLeft: "3px solid #d97706" },
};
