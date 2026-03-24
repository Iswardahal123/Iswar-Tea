import React, { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import { collection, getDocs, query, where, deleteDoc, doc, updateDoc, setDoc } from "firebase/firestore";
import { useLang } from "../../LanguageContext";

const txt = {
  en: {
    title: "👑 Admin Dashboard", loading: "Loading admin data...",
    totalUsers: "Total", active: "Active", disabled: "Disabled", admins: "Admins",
    registeredUsers: "👥 Registered Users", noUsers: "No users found",
    you: "You", admin: "👑 Admin", user: "👤 User",
    tester: "🧪 Tester", disabledBadge: "🚫 Disabled",
    details: "👁 Details", enable: "✅ Enable", disable: "⛔ Disable",
    addTester: "＋ Tester", removeTester: "🧪 Tester",
    deleteUser: "Delete User?",
    deleteMsg: "This will permanently delete the user and all their entries. Cannot be undone!",
    cancel: "Cancel", confirmDelete: "Yes, Delete", deleting: "Deleting...",
    // Detail modal
    totalEntries: "Total Entries", totalPaat: "Total Paat", totalEarning: "Total Earning",
    balanceDue: "Balance Due", totalEarned: "💰 Total Earned",
    totalReceived: "💵 Total Received", advCut: "✂️ Advance Cut",
    advTaken: "🏦 Advance Taken", balance: "🟢 Balance", joined: "📅 Joined",
    recentEntries: "📋 Recent Entries", ratePending: "— rate pending",
    enableUser: "✅ Enable User", disableUser: "⛔ Disable User",
    makeTester: "🧪 Make Tester", removeTesterBtn: "🧪 Remove Tester",
    delete: "🗑️ Delete", loadingUser: "Loading...",
  },
  hi: {
    title: "👑 एडमिन डैशबोर्ड", loading: "एडमिन डेटा लोड हो रहा है...",
    totalUsers: "कुल", active: "सक्रिय", disabled: "अक्षम", admins: "एडमिन",
    registeredUsers: "👥 पंजीकृत यूजर", noUsers: "कोई यूजर नहीं मिला",
    you: "आप", admin: "👑 एडमिन", user: "👤 यूजर",
    tester: "🧪 टेस्टर", disabledBadge: "🚫 अक्षम",
    details: "👁 विवरण", enable: "✅ सक्षम", disable: "⛔ अक्षम",
    addTester: "＋ टेस्टर", removeTester: "🧪 टेस्टर",
    deleteUser: "यूजर हटाएं?",
    deleteMsg: "यह यूजर और उनकी सभी प्रविष्टियां हमेशा के लिए हट जाएंगी!",
    cancel: "रद्द करें", confirmDelete: "हां, हटाएं", deleting: "हटाया जा रहा है...",
    totalEntries: "कुल प्रविष्टि", totalPaat: "कुल पत्ता", totalEarning: "कुल कमाई",
    balanceDue: "बाकी राशि", totalEarned: "💰 कुल कमाई",
    totalReceived: "💵 मिली राशि", advCut: "✂️ अग्रिम कटा",
    advTaken: "🏦 अग्रिम लिया", balance: "🟢 बाकी", joined: "📅 जॉइन",
    recentEntries: "📋 हाल की प्रविष्टियां", ratePending: "— दर बाकी",
    enableUser: "✅ सक्षम करें", disableUser: "⛔ अक्षम करें",
    makeTester: "🧪 टेस्टर बनाएं", removeTesterBtn: "🧪 टेस्टर हटाएं",
    delete: "🗑️ हटाएं", loadingUser: "लोड हो रहा है...",
  },
  ne: {
    title: "👑 एडमिन ड्यासबोर्ड", loading: "एडमिन डेटा लोड हुँदैछ...",
    totalUsers: "जम्मा", active: "सक्रिय", disabled: "अक्षम", admins: "एडमिन",
    registeredUsers: "👥 दर्ता प्रयोगकर्ता", noUsers: "कुनै प्रयोगकर्ता फेला परेन",
    you: "तपाईं", admin: "👑 एडमिन", user: "👤 प्रयोगकर्ता",
    tester: "🧪 टेस्टर", disabledBadge: "🚫 अक्षम",
    details: "👁 विवरण", enable: "✅ सक्षम", disable: "⛔ अक्षम",
    addTester: "＋ टेस्टर", removeTester: "🧪 टेस्टर",
    deleteUser: "प्रयोगकर्ता मेट्ने?",
    deleteMsg: "यसले प्रयोगकर्ता र सबै प्रविष्टि सधैंका लागि मेट्नेछ!",
    cancel: "रद्द गर्नुस्", confirmDelete: "हो, मेट्नुस्", deleting: "मेटिँदैछ...",
    totalEntries: "कुल प्रविष्टि", totalPaat: "कुल पात", totalEarning: "कुल आम्दानी",
    balanceDue: "बाँकी रकम", totalEarned: "💰 कुल आम्दानी",
    totalReceived: "💵 पाएको रकम", advCut: "✂️ अग्रिम काटिएको",
    advTaken: "🏦 अग्रिम लिएको", balance: "🟢 बाँकी", joined: "📅 सामेल",
    recentEntries: "📋 भर्खरका प्रविष्टि", ratePending: "— दर बाँकी",
    enableUser: "✅ सक्षम गर्नुस्", disableUser: "⛔ अक्षम गर्नुस्",
    makeTester: "🧪 टेस्टर बनाउनुस्", removeTesterBtn: "🧪 टेस्टर हटाउनुस्",
    delete: "🗑️ मेट्नुस्", loadingUser: "लोड हुँदैछ...",
  },
  as: {
    title: "👑 এডমিন ড্যাশব'ৰ্ড", loading: "এডমিন ডেটা লোড হৈ আছে...",
    totalUsers: "মুঠ", active: "সক্ৰিয়", disabled: "নিষ্ক্ৰিয়", admins: "এডমিন",
    registeredUsers: "👥 পঞ্জীভুক্ত ব্যৱহাৰকাৰী", noUsers: "কোনো ব্যৱহাৰকাৰী পোৱা নগ'ল",
    you: "আপুনি", admin: "👑 এডমিন", user: "👤 ব্যৱহাৰকাৰী",
    tester: "🧪 পৰীক্ষক", disabledBadge: "🚫 নিষ্ক্ৰিয়",
    details: "👁 বিৱৰণ", enable: "✅ সক্ৰিয়", disable: "⛔ নিষ্ক্ৰিয়",
    addTester: "＋ পৰীক্ষক", removeTester: "🧪 পৰীক্ষক",
    deleteUser: "ব্যৱহাৰকাৰী মচিব নে?",
    deleteMsg: "এই কামে ব্যৱহাৰকাৰী আৰু তেওঁৰ সকলো তথ্য চিৰতৰে মচি পেলাব!",
    cancel: "বাতিল কৰক", confirmDelete: "হয়, মচক", deleting: "মচা হৈ আছে...",
    totalEntries: "মুঠ তথ্য", totalPaat: "মুঠ পাত", totalEarning: "মুঠ উপাৰ্জন",
    balanceDue: "বাকী পৰিমাণ", totalEarned: "💰 মুঠ উপাৰ্জন",
    totalReceived: "💵 পোৱা পৰিমাণ", advCut: "✂️ এডভান্স কটা",
    advTaken: "🏦 লোৱা এডভান্স", balance: "🟢 বাকী", joined: "📅 যোগদান",
    recentEntries: "📋 শেহতীয়া তথ্য", ratePending: "— হাৰ বাকী",
    enableUser: "✅ সক্ৰিয় কৰক", disableUser: "⛔ নিষ্ক্ৰিয় কৰক",
    makeTester: "🧪 পৰীক্ষক কৰক", removeTesterBtn: "🧪 পৰীক্ষক আঁতৰাওক",
    delete: "🗑️ মচক", loadingUser: "লোড হৈ আছে...",
  },
};

export default function AdminDashboard({ user }) {
  const { lang } = useLang();
  const T = txt[lang] || txt.as;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userEntries, setUserEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [showAnnPanel, setShowAnnPanel] = useState(false);
  const [annMsg, setAnnMsg] = useState("");
  const [annLoading, setAnnLoading] = useState(false);
  const [annResult, setAnnResult] = useState("");


  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []); // eslint-disable-line react-hooks/exhaustive-deps


  const openUserDetail = async (u) => {
    setSelectedUser(u);
    setLoadingEntries(true);
    try {
      const snap = await getDocs(query(collection(db, "entries"), where("uid", "==", u.uid)));
      const entries = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      entries.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      setUserEntries(entries);
    } catch (err) { console.error(err); }
    setLoadingEntries(false);
  };

  const toggleDisable = async (u) => {
    setActionLoading(true);
    try {
      await updateDoc(doc(db, "users", u.uid), { disabled: !u.disabled });
      await fetchUsers();
      setSelectedUser(prev => prev ? { ...prev, disabled: !prev.disabled } : null);
    } catch (err) { console.error(err); }
    setActionLoading(false);
  };

  const toggleTestUser = async (u) => {
    setActionLoading(true);
    try {
      await updateDoc(doc(db, "users", u.uid), { isTestUser: !u.isTestUser });
      await fetchUsers();
      setSelectedUser(prev => prev ? { ...prev, isTestUser: !prev.isTestUser } : null);
    } catch (err) { console.error(err); }
    setActionLoading(false);
  };

  const deleteUser = async (uid) => {
    setActionLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "entries"), where("uid", "==", uid)));
      await Promise.all(snap.docs.map(d => deleteDoc(doc(db, "entries", d.id))));
      await deleteDoc(doc(db, "users", uid));
      setConfirmDelete(null); setSelectedUser(null);
      await fetchUsers();
    } catch (err) { console.error(err); }
    setActionLoading(false);
  };

  const totalUsers = users.length;
  const disabledCount = users.filter(u => u.disabled).length;
  const adminCount = users.filter(u => u.isAdmin).length;

  const handleSendAnnouncement = async () => {
    if (!annMsg.trim()) { setAnnResult("❌ Message likhein!"); return; }
    setAnnLoading(true); setAnnResult("");
    try {
      await setDoc(doc(db, "config", "announcement"), {
        active: true, icon: "📢",
        message: { en: annMsg, hi: annMsg, ne: annMsg, as: annMsg },
        createdAt: { seconds: Math.floor(Date.now() / 1000) },
        sentBy: user?.email || "admin",
      }, { merge: false });
      setAnnResult("✅ Bhej diya!");
      setTimeout(() => setAnnResult(""), 3000);
    } catch (e) { setAnnResult("❌ " + e.message); }
    setAnnLoading(false);
  };

  const handleClearAnnouncement = async () => {
    setAnnLoading(true);
    try {
      await setDoc(doc(db, "config", "announcement"), { active: false }, { merge: true });
      setAnnResult("✅ Announcement cleared.");
      setTimeout(() => setAnnResult(""), 2000);
    } catch (e) { setAnnResult("❌ " + e.message); }
    setAnnLoading(false);
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: "60px", color: "#6b7280", fontFamily: "'Segoe UI',sans-serif" }}>
      <div style={{ fontSize: "40px" }}>👑</div>
      <p>{T.loading}</p>
    </div>
  );

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.headerTitle}>{T.title}</div>
          <div style={styles.headerSub}>{user.email}</div>
        </div>
        <button onClick={fetchUsers} style={styles.refreshBtn}>🔄</button>
      </div>

      {/* Announcement Panel */}
      <div style={{ background: "linear-gradient(135deg,#1e293b,#0f172a)", borderRadius: "16px", marginBottom: "14px", overflow: "hidden" }}>
        <button onClick={() => setShowAnnPanel(s => !s)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
          <span style={{ fontSize: "15px", fontWeight: "800", color: "white" }}>📢 Announcement</span>
          <span style={{ color: "white", fontSize: "18px" }}>{showAnnPanel ? "▲" : "▼"}</span>
        </button>
        {showAnnPanel && (
          <div style={{ padding: "0 16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <textarea value={annMsg} onChange={e => setAnnMsg(e.target.value)} placeholder="Message likho..." rows={3} style={{ padding: "12px 14px", borderRadius: "12px", border: "2px solid #334155", background: "#0f172a", color: "white", fontSize: "14px", fontFamily: "inherit", outline: "none", resize: "none" }} />
            {annResult && <div style={{ background: annResult.startsWith("❌") ? "#fef2f2" : "#f0fdf4", color: annResult.startsWith("❌") ? "#dc2626" : "#16a34a", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: "700" }}>{annResult}</div>}
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={handleSendAnnouncement} disabled={annLoading} style={{ flex: 1, padding: "12px", background: "linear-gradient(135deg,#1a3a1a,#2d5a27)", color: "white", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "800", cursor: "pointer", fontFamily: "inherit" }}>
                {annLoading ? "⏳..." : "📢 Send to All"}
              </button>
              <button onClick={handleClearAnnouncement} disabled={annLoading} style={{ padding: "12px 16px", background: "#7f1d1d", color: "white", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "800", cursor: "pointer", fontFamily: "inherit" }}>
                🗑️ Clear
              </button>
            </div>
          </div>
        )}
      </div>




      {/* Stats */}
      <div style={styles.statsRow}>
        {[
          { num: totalUsers, label: T.totalUsers, bg: "linear-gradient(135deg,#1a3a1a,#2d5a27)" },
          { num: totalUsers - disabledCount, label: T.active, bg: "linear-gradient(135deg,#1e40af,#3b82f6)" },
          { num: disabledCount, label: T.disabled, bg: "linear-gradient(135deg,#7f1d1d,#dc2626)" },
          { num: adminCount, label: T.admins, bg: "linear-gradient(135deg,#92400e,#d97706)" },
        ].map(s => (
          <div key={s.label} style={{ ...styles.statCard, background: s.bg }}>
            <div style={styles.statNum}>{s.num}</div>
            <div style={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={styles.sectionTitle}>{T.registeredUsers}</div>

      {users.length === 0 ? <div style={styles.empty}>{T.noUsers}</div> : users.map(u => {
        const isMe = u.uid === user.uid;
        return (
          <div key={u.uid} style={{ ...styles.userCard, opacity: u.disabled ? 0.7 : 1 }}>
            <div style={styles.userLeft}>
              <div style={styles.avatarWrap}>
                {u.photo
                  ? <img src={u.photo} alt="" style={styles.avatarImg} />
                  : <div style={styles.avatarText}>{(u.name || u.email || "U")[0].toUpperCase()}</div>
                }
                {u.disabled && <div style={styles.disabledDot} />}
              </div>
              <div>
                <div style={styles.userName}>
                  {u.name || "No Name"}
                  {isMe && <span style={styles.meBadge}>{T.you}</span>}
                </div>
                <div style={styles.userEmail}>{u.email}</div>
                <div style={{ display: "flex", gap: "5px", marginTop: "4px", flexWrap: "wrap" }}>
                  <span style={{ ...styles.badge, background: u.isAdmin ? "#fef3c7" : "#f0fdf4", color: u.isAdmin ? "#92400e" : "#166534" }}>
                    {u.isAdmin ? T.admin : T.user}
                  </span>
                  {u.isTestUser && <span style={{ ...styles.badge, background: "#ede9fe", color: "#6d28d9" }}>{T.tester}</span>}
                  {u.disabled && <span style={{ ...styles.badge, background: "#fef2f2", color: "#dc2626" }}>{T.disabledBadge}</span>}
                </div>
              </div>
            </div>
            {!isMe && (
              <div style={styles.actionCol}>
                <button onClick={() => openUserDetail(u)} style={styles.detailBtn}>{T.details}</button>
                <button onClick={() => toggleDisable(u)} disabled={actionLoading}
                  style={{ ...styles.toggleBtn, background: u.disabled ? "#f0fdf4" : "#fef3c7", color: u.disabled ? "#16a34a" : "#d97706" }}>
                  {u.disabled ? T.enable : T.disable}
                </button>
                <button onClick={() => toggleTestUser(u)} disabled={actionLoading}
                  style={{ ...styles.toggleBtn, background: u.isTestUser ? "#ede9fe" : "#f5f3ff", color: u.isTestUser ? "#6d28d9" : "#8b5cf6" }}>
                  {u.isTestUser ? T.removeTester : T.addTester}
                </button>
                <button onClick={() => setConfirmDelete(u.uid)} style={styles.deleteBtn}>🗑️</button>
              </div>
            )}
          </div>
        );
      })}

      {/* USER DETAIL MODAL */}
      {selectedUser && (
        <div style={styles.overlay} onClick={() => setSelectedUser(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={styles.modalAvatar}>
                  {selectedUser.photo
                    ? <img src={selectedUser.photo} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                    : <span style={{ fontSize: "22px", fontWeight: "900", color: "white" }}>{(selectedUser.name || selectedUser.email || "U")[0].toUpperCase()}</span>
                  }
                </div>
                <div>
                  <div style={styles.modalName}>{selectedUser.name || "No Name"}</div>
                  <div style={styles.modalEmail}>{selectedUser.email}</div>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} style={styles.closeBtn}>✕</button>
            </div>
            <div style={styles.modalBody}>
              {loadingEntries ? (
                <div style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}>🍃 {T.loadingUser}</div>
              ) : (() => {
                const totalWeight = userEntries.reduce((s, e) => s + (e.weight || 0), 0);
                const totalAmount = userEntries.reduce((s, e) => s + (e.totalAmount || 0), 0);
                const totalReceived = userEntries.reduce((s, e) => s + (e.amountReceived || 0), 0);
                const totalBalance = userEntries.reduce((s, e) => s + (e.balanceAmount || 0), 0);
                const totalAdvanceCut = userEntries.reduce((s, e) => s + (e.advanceCut || 0), 0);
                const advanceTaken = selectedUser.totalAdvanceTaken || 0;
                return (<>
                  <div style={styles.detailGrid}>
                    {[
                      { num: userEntries.length, label: T.totalEntries, bg: "linear-gradient(135deg,#1a3a1a,#2d5a27)" },
                      { num: `${totalWeight.toFixed(0)} kg`, label: T.totalPaat, bg: "linear-gradient(135deg,#1e3a5f,#2563eb)" },
                      { num: `Rs ${totalAmount.toFixed(0)}`, label: T.totalEarning, bg: "linear-gradient(135deg,#14532d,#16a34a)" },
                      { num: `Rs ${totalBalance.toFixed(0)}`, label: T.balanceDue, bg: totalBalance >= 0 ? "linear-gradient(135deg,#4c1d95,#7c3aed)" : "linear-gradient(135deg,#7f1d1d,#dc2626)" },
                    ].map(s => (
                      <div key={s.label} style={{ ...styles.detailStat, background: s.bg }}>
                        <div style={styles.detailStatNum}>{s.num}</div>
                        <div style={styles.detailStatLabel}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={styles.breakdown}>
                    {[
                      [T.totalEarned, `Rs ${totalAmount.toFixed(0)}`],
                      [T.totalReceived, `Rs ${totalReceived.toFixed(0)}`],
                      [T.advCut, `Rs ${totalAdvanceCut.toFixed(0)}`],
                      [T.advTaken, `Rs ${advanceTaken.toFixed(0)}`],
                      [T.balance, `Rs ${totalBalance.toFixed(0)}`],
                      [T.joined, selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : "—"],
                    ].map(([label, val]) => (
                      <div key={label} style={styles.breakdownRow}>
                        <span style={styles.breakdownLabel}>{label}</span>
                        <span style={styles.breakdownVal}>{val}</span>
                      </div>
                    ))}
                  </div>
                  {userEntries.length > 0 && (<>
                    <div style={styles.recentTitle}>{T.recentEntries}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "200px", overflowY: "auto" }}>
                      {userEntries.slice(0, 8).map(e => (
                        <div key={e.id} style={styles.entryRow}>
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: "800", color: "#1a3a1a" }}>
                              {new Date(e.date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </div>
                            <div style={{ fontSize: "11px", color: "#6b7280" }}>
                              {e.weight} kg {e.rate > 0 ? `@ Rs${e.rate}` : T.ratePending}
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "14px", fontWeight: "800" }}>{e.totalAmount > 0 ? `Rs ${e.totalAmount.toFixed(0)}` : "—"}</div>
                            {e.balanceAmount !== 0 && <div style={{ fontSize: "11px", color: e.balanceAmount >= 0 ? "#16a34a" : "#dc2626", fontWeight: "700" }}>Bal: Rs {(e.balanceAmount || 0).toFixed(0)}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>)}
                  <div style={{ display: "flex", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
                    <button onClick={() => toggleDisable(selectedUser)} disabled={actionLoading}
                      style={{ flex: 1, padding: "11px", borderRadius: "10px", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: "700", fontSize: "12px", background: selectedUser.disabled ? "#f0fdf4" : "#fef3c7", color: selectedUser.disabled ? "#16a34a" : "#d97706" }}>
                      {selectedUser.disabled ? T.enableUser : T.disableUser}
                    </button>
                    <button onClick={() => toggleTestUser(selectedUser)} disabled={actionLoading}
                      style={{ flex: 1, padding: "11px", borderRadius: "10px", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: "700", fontSize: "12px", background: selectedUser.isTestUser ? "#ede9fe" : "#f5f3ff", color: selectedUser.isTestUser ? "#6d28d9" : "#8b5cf6" }}>
                      {selectedUser.isTestUser ? T.removeTesterBtn : T.makeTester}
                    </button>
                    <button onClick={() => { setSelectedUser(null); setConfirmDelete(selectedUser.uid); }}
                      style={{ flex: 1, padding: "11px", borderRadius: "10px", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: "700", fontSize: "12px", background: "#fef2f2", color: "#dc2626" }}>
                      {T.delete}
                    </button>
                  </div>
                </>);
              })()}
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {confirmDelete && (
        <div style={styles.overlay} onClick={() => setConfirmDelete(null)}>
          <div style={styles.confirmBox} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🗑️</div>
            <div style={{ fontSize: "18px", fontWeight: "900", color: "#1a1a1a", marginBottom: "8px" }}>{T.deleteUser}</div>
            <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "24px", lineHeight: "1.6" }}>{T.deleteMsg}</div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setConfirmDelete(null)} style={styles.cancelBtn}>{T.cancel}</button>
              <button onClick={() => deleteUser(confirmDelete)} disabled={actionLoading}
                style={styles.confirmDeleteBtn}>{actionLoading ? T.deleting : T.confirmDelete}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: "16px", paddingBottom: "30px", background: "#f8faf8", minHeight: "calc(100vh - 60px)", fontFamily: "'Segoe UI',sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(135deg,#92400e,#d97706)", borderRadius: "16px", padding: "16px 18px", marginBottom: "16px", color: "white" },
  headerTitle: { fontSize: "18px", fontWeight: "900" },
  headerSub: { fontSize: "11px", opacity: 0.8, marginTop: "2px" },
  refreshBtn: { background: "rgba(255,255,255,0.2)", border: "none", color: "white", width: 36, height: 36, borderRadius: "50%", fontSize: "16px", cursor: "pointer" },
  statsRow: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px", marginBottom: "18px" },
  statCard: { borderRadius: "12px", padding: "12px 10px", color: "white", textAlign: "center" },
  statNum: { fontSize: "22px", fontWeight: "900" },
  statLabel: { fontSize: "9px", opacity: 0.85, fontWeight: "700", textTransform: "uppercase", marginTop: "2px" },
  sectionTitle: { fontSize: "14px", fontWeight: "800", color: "#1a3a1a", marginBottom: "10px" },
  empty: { textAlign: "center", padding: "40px", color: "#6b7280" },
  userCard: { background: "white", borderRadius: "14px", padding: "14px", marginBottom: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" },
  userLeft: { display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 },
  avatarWrap: { position: "relative", flexShrink: 0 },
  avatarImg: { width: 44, height: 44, borderRadius: "50%", objectFit: "cover" },
  avatarText: { width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#1a3a1a,#2d5a27)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "900", color: "white" },
  disabledDot: { position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderRadius: "50%", background: "#dc2626", border: "2px solid white" },
  userName: { fontSize: "14px", fontWeight: "800", color: "#1a3a1a", display: "flex", alignItems: "center", gap: "6px" },
  userEmail: { fontSize: "11px", color: "#6b7280", marginTop: "2px" },
  meBadge: { fontSize: "9px", background: "#dbeafe", color: "#1d4ed8", padding: "1px 6px", borderRadius: "10px", fontWeight: "800" },
  badge: { fontSize: "10px", fontWeight: "700", padding: "2px 7px", borderRadius: "8px" },
  actionCol: { display: "flex", flexDirection: "column", gap: "5px", flexShrink: 0 },
  detailBtn: { background: "#eff6ff", color: "#2563eb", border: "none", padding: "7px 10px", borderRadius: "8px", cursor: "pointer", fontSize: "11px", fontWeight: "700", fontFamily: "inherit", whiteSpace: "nowrap" },
  toggleBtn: { border: "none", padding: "7px 10px", borderRadius: "8px", cursor: "pointer", fontSize: "11px", fontWeight: "700", fontFamily: "inherit", whiteSpace: "nowrap" },
  deleteBtn: { background: "#fef2f2", color: "#dc2626", border: "none", padding: "7px 10px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontFamily: "inherit" },
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.55)", zIndex: 999, display: "flex", alignItems: "flex-end", justifyContent: "center" },
  modal: { background: "white", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: "500px", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" },
  modalHeader: { padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #f3f4f6", flexShrink: 0 },
  modalAvatar: { width: 50, height: 50, borderRadius: "50%", background: "linear-gradient(135deg,#1a3a1a,#2d5a27)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 },
  modalName: { fontSize: "17px", fontWeight: "900", color: "#1a3a1a" },
  modalEmail: { fontSize: "12px", color: "#6b7280", marginTop: "2px" },
  closeBtn: { background: "#f3f4f6", border: "none", width: 30, height: 30, borderRadius: "50%", cursor: "pointer", fontSize: "14px", fontWeight: "700", fontFamily: "inherit", flexShrink: 0 },
  modalBody: { padding: "16px 20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px" },
  detailGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" },
  detailStat: { borderRadius: "12px", padding: "12px", color: "white" },
  detailStatNum: { fontSize: "18px", fontWeight: "900" },
  detailStatLabel: { fontSize: "10px", opacity: 0.85, marginTop: "3px", fontWeight: "700" },
  breakdown: { background: "#f9fafb", borderRadius: "12px", padding: "14px", display: "flex", flexDirection: "column", gap: "8px" },
  breakdownRow: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" },
  breakdownLabel: { color: "#6b7280", fontWeight: "600" },
  breakdownVal: { color: "#1a3a1a", fontWeight: "800" },
  recentTitle: { fontSize: "13px", fontWeight: "800", color: "#374151" },
  entryRow: { background: "#f9fafb", borderRadius: "10px", padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  confirmBox: { background: "white", borderRadius: "20px", padding: "28px 24px", width: "calc(100% - 48px)", maxWidth: "320px", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", margin: "auto", marginBottom: "24px" },
  cancelBtn: { flex: 1, padding: "13px", borderRadius: "12px", border: "2px solid #e5e7eb", background: "white", color: "#374151", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" },
  confirmDeleteBtn: { flex: 1, padding: "13px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#7f1d1d,#dc2626)", color: "white", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" },
};
