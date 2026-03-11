import React, { useState, useRef, useEffect } from "react";
import { auth, db } from "../firebase/config";
import { signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { doc, deleteDoc, collection, query, where, getDocs, getDoc, updateDoc } from "firebase/firestore";
import { useLang } from "../LanguageContext";
import { useDark } from "../DarkModeContext";
import { langNames } from "../languages";

const langFlags = { en: "🇬🇧", hi: "🇮🇳", as: "🌿", ne: "🇳🇵" };

export default function TopBar({ user, currentPage, isAdmin, onLangChange }) {
  const { lang } = useLang();
  const { dark, toggleDark } = useDark();
  const [showSettings, setShowSettings] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'lang' | 'password' | 'advance' | 'clear' | 'logout'
  const [currentAdvance, setCurrentAdvance] = useState(0);
  const [newAdvanceAmt, setNewAdvanceAmt] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [currentPwd, setCurrentPwd] = useState("");
  const [clearPwd, setClearPwd] = useState("");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("success");
  const [loading, setLoading] = useState(false);
  const settingsRef = useRef(null);

  const pageNames = {
    en: { dashboard: "Dashboard", entry: "Entry", view: "Records", chat: "AI Chat", admin: "Admin" },
    hi: { dashboard: "डैशबोर्ड", entry: "प्रविष्टि", view: "रिकॉर्ड", chat: "AI चैट", admin: "एडमिन" },
    ne: { dashboard: "ड्यासबोर्ड", entry: "प्रविष्टि", view: "रेकर्ड", chat: "AI च्याट", admin: "एडमिन" },
    as: { dashboard: "ড্যাশব'ৰ্ড", entry: "তথ্য", view: "ৰেকৰ্ড", chat: "AI চেট", admin: "এডমিন" },
  };
  const pn = pageNames[lang] || pageNames.as;

  useEffect(() => {
    const handleClick = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setShowSettings(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const openModal = async (type) => {
    setShowSettings(false);
    setMsg(""); setNewPwd(""); setCurrentPwd(""); setClearPwd(""); setNewAdvanceAmt("");
    if (type === "advance") {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) setCurrentAdvance(userDoc.data().totalAdvanceTaken || 0);
      } catch (e) { console.error(e); }
    }
    setActiveModal(type);
  };

  const closeModal = () => { setActiveModal(null); setMsg(""); };

  const handleLogout = () => { sessionStorage.removeItem("welcomed"); signOut(auth); };

  const handleAdvanceSave = async () => {
    const amt = parseFloat(newAdvanceAmt) || 0;
    if (amt <= 0) { setMsg("❌ Enter valid amount!"); setMsgType("error"); return; }
    setLoading(true);
    try {
      const updated = currentAdvance + amt;
      await updateDoc(doc(db, "users", user.uid), { totalAdvanceTaken: updated });
      setCurrentAdvance(updated);
      setMsg("✅ Updated! Total: Rs " + updated.toFixed(0)); setMsgType("success");
      setNewAdvanceAmt("");
      setTimeout(closeModal, 1500);
    } catch (err) { setMsg("❌ " + err.message); setMsgType("error"); }
    setLoading(false);
  };

  const handleUpdatePassword = async () => {
    if (!currentPwd || !newPwd) { setMsg("❌ Fill both fields!"); setMsgType("error"); return; }
    if (newPwd.length < 6) { setMsg("❌ Min 6 characters!"); setMsgType("error"); return; }
    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPwd);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPwd);
      setMsg("✅ Password updated!"); setMsgType("success");
      setCurrentPwd(""); setNewPwd("");
      setTimeout(closeModal, 2000);
    } catch (err) {
      setMsg("❌ " + (err.code === "auth/wrong-password" ? "Wrong password!" : err.message));
      setMsgType("error");
    }
    setLoading(false);
  };

  const handleClearData = async () => {
    if (!clearPwd) { setMsg("❌ Enter password!"); setMsgType("error"); return; }
    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, clearPwd);
      await reauthenticateWithCredential(auth.currentUser, credential);
      const snap = await getDocs(query(collection(db, "entries"), where("uid", "==", user.uid)));
      await Promise.all(snap.docs.map(d => deleteDoc(doc(db, "entries", d.id))));
      await updateDoc(doc(db, "users", user.uid), { totalAdvanceTaken: 0 });
      setMsg("✅ All data deleted!"); setMsgType("success");
      setClearPwd("");
      setTimeout(() => { closeModal(); window.location.reload(); }, 2000);
    } catch (err) {
      setMsg("❌ " + (err.code === "auth/wrong-password" ? "Wrong password!" : err.message));
      setMsgType("error");
    }
    setLoading(false);
  };

  const isGoogleUser = user.providerData?.[0]?.providerId === "google.com";
  

  const settingsItems = isAdmin ? [
    { icon: "🚪", label: lang === "en" ? "Logout" : lang === "hi" ? "लॉगआउट" : lang === "ne" ? "लगआउट" : "লগআউট", sub: null, danger: true, action: handleLogout },
  ] : [
    { icon: "🌐", label: lang === "en" ? "Language" : lang === "hi" ? "भाषा" : lang === "ne" ? "भाषा" : "ভাষা", sub: langNames[lang], action: () => openModal("lang") },
    { icon: "💰", label: lang === "en" ? "Update Advance" : lang === "hi" ? "अग्रिम अपडेट" : lang === "ne" ? "अग्रिम अपडेट" : "এডভান্স আপডেট", sub: null, action: () => openModal("advance") },
    ...(!isGoogleUser ? [{ icon: "🔑", label: lang === "en" ? "Change Password" : lang === "hi" ? "पासवर्ड बदलें" : lang === "ne" ? "पासवर्ड परिवर्तन" : "পাছৱৰ্ড সলনি", sub: null, action: () => openModal("password") }] : []),
    { icon: "🗑️", label: lang === "en" ? "Clear All Data" : lang === "hi" ? "सारा डेटा हटाएं" : lang === "ne" ? "सबै डेटा मेट्नुस्" : "সকলো তথ্য মচক", sub: null, danger: true, action: () => openModal("clear") },
    { icon: "🚪", label: lang === "en" ? "Logout" : lang === "hi" ? "लॉगआउट" : lang === "ne" ? "लगआउट" : "লগআউট", sub: null, danger: true, action: handleLogout },
  ];

  return (
    <>
      {/* ── TOP BAR ── */}
      <div style={{ ...styles.bar, background: dark ? "linear-gradient(135deg,#0f172a,#1e293b)" : "linear-gradient(135deg,#1a3a1a,#2d5a27)" }}>
        {/* Left: App name + page */}
        <div style={styles.left}>
          <span style={styles.logo}>🍃</span>
          <div>
            <div style={styles.appName}>চাহ হিচাব</div>
            <div style={styles.pageName}>{pn[currentPage] || "Home"}</div>
          </div>
        </div>

        {/* Right: Profile pill + dark toggle + gear */}
        <div style={styles.right}>
          {/* Dark mode toggle */}
          <button onClick={toggleDark} style={{
            background: dark ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: "20px", width: 52, height: 28,
            cursor: "pointer", position: "relative",
            display: "flex", alignItems: "center",
            padding: "0 4px", flexShrink: 0,
            transition: "background 0.3s",
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: "50%",
              background: "white",
              position: "absolute",
              left: dark ? "calc(100% - 24px)" : "4px",
              transition: "left 0.3s cubic-bezier(0.34,1.56,0.64,1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "11px",
            }}>
              {dark ? "🌙" : "☀️"}
            </div>
          </button>

          {/* Settings gear button */}
          <div ref={settingsRef} style={{ position: "relative" }}>
            <button onClick={() => setShowSettings(s => !s)} style={styles.gearBtn}>
              ⚙️
            </button>

            {/* Settings dropdown */}
            {showSettings && (
              <div style={styles.settingsDropdown}>
                <div style={styles.settingsHeader}>
                  <div style={styles.settingsTitle}>
                    {lang === "en" ? "Settings" : lang === "hi" ? "सेटिंग्स" : lang === "ne" ? "सेटिङ" : "ছেটিংছ"}
                  </div>
                </div>
                {settingsItems.map((item, i) => (
                  <button key={i} onClick={item.action}
                    style={{ ...styles.settingsItem, color: item.danger ? "#dc2626" : "#1a1a1a" }}>
                    <span style={styles.settingsIcon}>{item.icon}</span>
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <div style={{ fontSize: "13px", fontWeight: "700" }}>{item.label}</div>
                      {item.sub && <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "1px" }}>{item.sub}</div>}
                    </div>
                    <span style={{ color: "#d1d5db", fontSize: "16px" }}>›</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODALS ── */}
      {activeModal && (
        <div style={styles.overlay} onClick={closeModal}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>

            {/* LANGUAGE */}
            {activeModal === "lang" && (<>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>🌐 {lang === "en" ? "Language" : lang === "hi" ? "भाषा" : lang === "ne" ? "भाषा" : "ভাষা"}</h3>
                <button onClick={closeModal} style={styles.closeBtn}>✕</button>
              </div>
              <div style={{ padding: "16px 20px 24px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {Object.keys(langNames).map(l => (
                  <button key={l} onClick={() => { onLangChange && onLangChange(l); closeModal(); }}
                    style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", background: lang === l ? "#f0fdf4" : "#f9fafb", border: lang === l ? "2px solid #86efac" : "2px solid #e5e7eb", borderRadius: "12px", cursor: "pointer", fontFamily: "inherit" }}>
                    <span style={{ fontSize: "26px" }}>{langFlags[l]}</span>
                    <span style={{ fontSize: "15px", fontWeight: "700", color: "#1a3a1a", flex: 1 }}>{langNames[l]}</span>
                    {lang === l && <span style={{ color: "#16a34a", fontSize: "18px", fontWeight: "900" }}>✓</span>}
                  </button>
                ))}
              </div>
            </>)}

            {/* ADVANCE */}
            {activeModal === "advance" && (<>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>💰 {lang === "en" ? "Update Advance" : lang === "hi" ? "अग्रिम अपडेट" : lang === "ne" ? "अग्रिम अपडेट" : "এডভান্স আপডেট"}</h3>
                <button onClick={closeModal} style={styles.closeBtn}>✕</button>
              </div>
              <div style={styles.modalBody}>
                <div style={styles.infoBox}>
                  <div style={{ fontSize: "12px", color: "#92400e", fontWeight: "700" }}>
                    {lang === "en" ? "Total Advance So Far" : lang === "hi" ? "अब तक कुल अग्रिम" : lang === "ne" ? "अहिलेसम्म कुल अग्रिम" : "এতিয়ালৈকে মুঠ এডভান্স"}
                  </div>
                  <div style={{ fontSize: "30px", fontWeight: "900", color: "#d97706", marginTop: "4px" }}>Rs {currentAdvance.toFixed(0)}</div>
                </div>
                <div style={styles.field}>
                  <label style={styles.fieldLabel}>{lang === "en" ? "New Advance Amount (Rs)" : lang === "hi" ? "नया अग्रिम (Rs)" : lang === "ne" ? "नयाँ अग्रिम (Rs)" : "নতুন এডভান্স (টকা)"}</label>
                  <input type="number" value={newAdvanceAmt} onChange={e => setNewAdvanceAmt(e.target.value)} placeholder="0" style={styles.fieldInput} />
                </div>
                {parseFloat(newAdvanceAmt) > 0 && (
                  <div style={{ background: "#f0fdf4", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#166534", fontWeight: "700" }}>
                    → Rs {(currentAdvance + parseFloat(newAdvanceAmt)).toFixed(0)}
                  </div>
                )}
                {msg && <div style={{ ...styles.msgBox, background: msgType === "success" ? "#f0fdf4" : "#fef2f2", color: msgType === "success" ? "#16a34a" : "#dc2626" }}>{msg}</div>}
                <button onClick={handleAdvanceSave} disabled={loading} style={styles.saveBtn}>
                  {loading ? "..." : (lang === "en" ? "Add Advance" : lang === "hi" ? "जोड़ें" : lang === "ne" ? "थप्नुस्" : "যোগ কৰক")}
                </button>
              </div>
            </>)}

            {/* PASSWORD */}
            {activeModal === "password" && (<>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>🔑 {lang === "en" ? "Change Password" : lang === "hi" ? "पासवर्ड बदलें" : lang === "ne" ? "पासवर्ड परिवर्तन" : "পাছৱৰ্ড সলনি"}</h3>
                <button onClick={closeModal} style={styles.closeBtn}>✕</button>
              </div>
              <div style={styles.modalBody}>
                <div style={styles.field}>
                  <label style={styles.fieldLabel}>{lang === "en" ? "Current Password" : lang === "hi" ? "पुराना पासवर्ड" : lang === "ne" ? "पुरानो पासवर्ड" : "পুৰণা পাছৱৰ্ড"}</label>
                  <input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} style={styles.fieldInput} />
                </div>
                <div style={styles.field}>
                  <label style={styles.fieldLabel}>{lang === "en" ? "New Password" : lang === "hi" ? "नया पासवर्ड" : lang === "ne" ? "नयाँ पासवर्ड" : "নতুন পাছৱৰ্ড"}</label>
                  <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Min 6 chars" style={styles.fieldInput} />
                </div>
                {msg && <div style={{ ...styles.msgBox, background: msgType === "success" ? "#f0fdf4" : "#fef2f2", color: msgType === "success" ? "#16a34a" : "#dc2626" }}>{msg}</div>}
                <button onClick={handleUpdatePassword} disabled={loading} style={styles.saveBtn}>
                  {loading ? "..." : (lang === "en" ? "Update" : lang === "hi" ? "अपडेट करें" : lang === "ne" ? "अपडेट गर्नुस्" : "আপডেট কৰক")}
                </button>
              </div>
            </>)}

            {/* CLEAR DATA */}
            {activeModal === "clear" && (<>
              <div style={styles.modalHeader}>
                <h3 style={{ ...styles.modalTitle, color: "#dc2626" }}>⚠️ {lang === "en" ? "Clear All Data" : lang === "hi" ? "सारा डेटा हटाएं" : lang === "ne" ? "सबै डेटा मेट्नुस्" : "সকলো তথ্য মচক"}</h3>
                <button onClick={closeModal} style={styles.closeBtn}>✕</button>
              </div>
              <div style={styles.modalBody}>
                <div style={styles.warningBox}>
                  {lang === "en" ? "⚠️ This will permanently delete all your entries!" : lang === "hi" ? "⚠️ यह सभी प्रविष्टियां हमेशा के लिए हटा देगा!" : lang === "ne" ? "⚠️ यसले सबै प्रविष्टि सधैंका लागि मेट्नेछ!" : "⚠️ এই কামে সকলো তথ্য চিৰতৰে মচি পেলাব!"}
                </div>
                <div style={styles.field}>
                  <label style={styles.fieldLabel}>{lang === "en" ? "Enter password to confirm" : lang === "hi" ? "पुष्टि के लिए पासवर्ड डालें" : lang === "ne" ? "पुष्टि गर्न पासवर्ड दिनुस्" : "নিশ্চিত কৰিবলৈ পাছৱৰ্ড দিয়ক"}</label>
                  <input type="password" value={clearPwd} onChange={e => setClearPwd(e.target.value)} style={{ ...styles.fieldInput, borderColor: "#fca5a5" }} />
                </div>
                {msg && <div style={{ ...styles.msgBox, background: msgType === "success" ? "#f0fdf4" : "#fef2f2", color: msgType === "success" ? "#16a34a" : "#dc2626" }}>{msg}</div>}
                <button onClick={handleClearData} disabled={loading} style={{ ...styles.saveBtn, background: "linear-gradient(135deg,#7f1d1d,#dc2626)" }}>
                  {loading ? "..." : (lang === "en" ? "Delete All" : lang === "hi" ? "सब हटाएं" : lang === "ne" ? "सबै मेट्नुस्" : "সকলো মচক")}
                </button>
              </div>
            </>)}

          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  bar: { background: "linear-gradient(135deg,#1a3a1a,#2d5a27)", color: "white", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 200, boxShadow: "0 2px 16px rgba(0,0,0,0.25)" },
  left: { display: "flex", alignItems: "center", gap: "10px" },
  logo: { fontSize: "24px" },
  appName: { fontSize: "16px", fontWeight: "900", letterSpacing: "-0.3px" },
  pageName: { fontSize: "10px", opacity: 0.7, marginTop: "1px" },
  right: { display: "flex", alignItems: "center", gap: "8px" },

  profilePill: { display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "40px", padding: "5px 10px 5px 5px", backdropFilter: "blur(8px)" },
  avatar: { width: 30, height: 30, borderRadius: "50%", overflow: "hidden", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  avatarInitial: { fontSize: "13px", fontWeight: "900", color: "white" },
  profileInfo: { display: "flex", flexDirection: "column" },
  profileName: { fontSize: "12px", fontWeight: "800", color: "white", lineHeight: 1.2, maxWidth: "90px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  profileEmail: { fontSize: "9px", opacity: 0.7, color: "white", maxWidth: "90px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  adminBadge: { background: "#d97706", color: "white", padding: "2px 7px", borderRadius: "20px", fontSize: "9px", fontWeight: "800", marginLeft: "2px" },

  gearBtn: { background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "50%", width: 36, height: 36, fontSize: "17px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" },

  settingsDropdown: { position: "absolute", top: "calc(100% + 10px)", right: 0, width: "240px", background: "white", borderRadius: "16px", boxShadow: "0 12px 40px rgba(0,0,0,0.2)", zIndex: 999, overflow: "hidden", border: "1px solid #e5e7eb" },
  settingsHeader: { padding: "14px 16px 10px", borderBottom: "1px solid #f3f4f6" },
  settingsTitle: { fontSize: "13px", fontWeight: "900", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" },
  settingsItem: { display: "flex", alignItems: "center", gap: "12px", padding: "13px 16px", background: "white", border: "none", borderBottom: "1px solid #f9fafb", width: "100%", cursor: "pointer", fontFamily: "inherit" },
  settingsIcon: { fontSize: "18px", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb", borderRadius: "8px", flexShrink: 0 },

  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 998, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" },
  modal: { background: "white", borderRadius: "20px", width: "100%", maxWidth: "400px", boxShadow: "0 20px 60px rgba(0,0,0,0.25)", overflow: "hidden" },
  modalHeader: { padding: "18px 20px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #f3f4f6" },
  modalTitle: { fontSize: "17px", fontWeight: "800", color: "#1a3a1a", margin: 0 },
  closeBtn: { background: "#f3f4f6", border: "none", width: "30px", height: "30px", borderRadius: "50%", cursor: "pointer", fontSize: "14px", fontWeight: "700", fontFamily: "inherit" },
  modalBody: { padding: "16px 20px 24px", display: "flex", flexDirection: "column", gap: "14px" },
  infoBox: { background: "#fef3c7", borderRadius: "12px", padding: "16px", textAlign: "center" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  fieldLabel: { fontSize: "13px", fontWeight: "700", color: "#374151" },
  fieldInput: { padding: "11px 14px", borderRadius: "10px", border: "2px solid #e5e7eb", fontSize: "15px", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" },
  msgBox: { padding: "10px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "600" },
  saveBtn: { background: "linear-gradient(135deg,#1a3a1a,#2d5a27)", color: "white", border: "none", padding: "13px", borderRadius: "12px", fontSize: "15px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" },
  warningBox: { background: "#fef3c7", color: "#92400e", padding: "12px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: "600", borderLeft: "3px solid #d97706" },
};
