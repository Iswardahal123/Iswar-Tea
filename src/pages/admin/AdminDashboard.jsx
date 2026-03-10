import React, { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import { collection, getDocs, query, where, deleteDoc, doc, updateDoc } from "firebase/firestore";

export default function AdminDashboard({ user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null); // user detail modal
  const [userEntries, setUserEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // uid to delete
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

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
      // Update selected user too
      setSelectedUser(prev => prev ? { ...prev, disabled: !prev.disabled } : null);
    } catch (err) { console.error(err); }
    setActionLoading(false);
  };

  const deleteUser = async (uid) => {
    setActionLoading(true);
    try {
      // Delete all entries
      const snap = await getDocs(query(collection(db, "entries"), where("uid", "==", uid)));
      await Promise.all(snap.docs.map(d => deleteDoc(doc(db, "entries", d.id))));
      // Delete user doc
      await deleteDoc(doc(db, "users", uid));
      setConfirmDelete(null);
      setSelectedUser(null);
      await fetchUsers();
    } catch (err) { console.error(err); }
    setActionLoading(false);
  };

  // Stats summary across all users
  const totalUsers = users.length;
  const disabledUsers = users.filter(u => u.disabled).length;
  const adminUsers = users.filter(u => u.isAdmin).length;

  if (loading) return (
    <div style={{ textAlign: "center", padding: "60px", color: "#6b7280", fontFamily: "'Segoe UI',sans-serif" }}>
      <div style={{ fontSize: "40px" }}>👑</div>
      <p>Loading admin data...</p>
    </div>
  );

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.headerTitle}>👑 Admin Dashboard</div>
          <div style={styles.headerSub}>{user.email}</div>
        </div>
        <button onClick={fetchUsers} style={styles.refreshBtn}>🔄</button>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        <div style={{ ...styles.statCard, background: "linear-gradient(135deg,#1a3a1a,#2d5a27)" }}>
          <div style={styles.statNum}>{totalUsers}</div>
          <div style={styles.statLabel}>Total Users</div>
        </div>
        <div style={{ ...styles.statCard, background: "linear-gradient(135deg,#1e40af,#3b82f6)" }}>
          <div style={styles.statNum}>{totalUsers - disabledUsers}</div>
          <div style={styles.statLabel}>Active</div>
        </div>
        <div style={{ ...styles.statCard, background: "linear-gradient(135deg,#7f1d1d,#dc2626)" }}>
          <div style={styles.statNum}>{disabledUsers}</div>
          <div style={styles.statLabel}>Disabled</div>
        </div>
        <div style={{ ...styles.statCard, background: "linear-gradient(135deg,#92400e,#d97706)" }}>
          <div style={styles.statNum}>{adminUsers}</div>
          <div style={styles.statLabel}>Admins</div>
        </div>
      </div>

      {/* Section title */}
      <div style={styles.sectionTitle}>👥 Registered Users</div>

      {/* Users List */}
      {users.length === 0 ? (
        <div style={styles.empty}>No users found</div>
      ) : (
        users.map(u => {
          const isMe = u.uid === user.uid;
          return (
            <div key={u.uid} style={{ ...styles.userCard, opacity: u.disabled ? 0.7 : 1 }}>
              <div style={styles.userLeft}>
                {/* Avatar */}
                <div style={styles.avatarWrap}>
                  {u.photo
                    ? <img src={u.photo} alt="" style={styles.avatarImg} />
                    : <div style={styles.avatarText}>{(u.name || u.email || "U")[0].toUpperCase()}</div>
                  }
                  {u.disabled && <div style={styles.disabledDot} />}
                </div>
                {/* Info */}
                <div>
                  <div style={styles.userName}>
                    {u.name || "No Name"}
                    {isMe && <span style={styles.meBadge}>You</span>}
                  </div>
                  <div style={styles.userEmail}>{u.email}</div>
                  <div style={{ display: "flex", gap: "5px", marginTop: "4px", flexWrap: "wrap" }}>
                    <span style={{ ...styles.badge, background: u.isAdmin ? "#fef3c7" : "#f0fdf4", color: u.isAdmin ? "#92400e" : "#166534" }}>
                      {u.isAdmin ? "👑 Admin" : "👤 User"}
                    </span>
                    {u.disabled && <span style={{ ...styles.badge, background: "#fef2f2", color: "#dc2626" }}>🚫 Disabled</span>}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              {!isMe && (
                <div style={styles.actionCol}>
                  <button onClick={() => openUserDetail(u)} style={styles.detailBtn}>
                    👁 Details
                  </button>
                  <button
                    onClick={() => toggleDisable(u)}
                    disabled={actionLoading}
                    style={{ ...styles.toggleBtn, background: u.disabled ? "#f0fdf4" : "#fef3c7", color: u.disabled ? "#16a34a" : "#d97706" }}>
                    {u.disabled ? "✅ Enable" : "⛔ Disable"}
                  </button>
                  <button onClick={() => setConfirmDelete(u.uid)} style={styles.deleteBtn}>🗑️</button>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* ── USER DETAIL MODAL ── */}
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
              {/* User Stats */}
              {loadingEntries ? (
                <div style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}>🍃 Loading...</div>
              ) : (() => {
                const totalWeight = userEntries.reduce((s, e) => s + (e.weight || 0), 0);
                const totalAmount = userEntries.reduce((s, e) => s + (e.totalAmount || 0), 0);
                const totalReceived = userEntries.reduce((s, e) => s + (e.amountReceived || 0), 0);
                const totalBalance = userEntries.reduce((s, e) => s + (e.balanceAmount || 0), 0);
                const totalAdvanceCut = userEntries.reduce((s, e) => s + (e.advanceCut || 0), 0);
                const advanceTaken = selectedUser.totalAdvanceTaken || 0;

                return (
                  <>
                    {/* Stats grid */}
                    <div style={styles.detailGrid}>
                      <div style={{ ...styles.detailStat, background: "linear-gradient(135deg,#1a3a1a,#2d5a27)" }}>
                        <div style={styles.detailStatNum}>{userEntries.length}</div>
                        <div style={styles.detailStatLabel}>Total Entries</div>
                      </div>
                      <div style={{ ...styles.detailStat, background: "linear-gradient(135deg,#1e3a5f,#2563eb)" }}>
                        <div style={styles.detailStatNum}>{totalWeight.toFixed(0)} kg</div>
                        <div style={styles.detailStatLabel}>Total Paat</div>
                      </div>
                      <div style={{ ...styles.detailStat, background: "linear-gradient(135deg,#14532d,#16a34a)" }}>
                        <div style={styles.detailStatNum}>Rs {totalAmount.toFixed(0)}</div>
                        <div style={styles.detailStatLabel}>Total Earning</div>
                      </div>
                      <div style={{ ...styles.detailStat, background: totalBalance >= 0 ? "linear-gradient(135deg,#4c1d95,#7c3aed)" : "linear-gradient(135deg,#7f1d1d,#dc2626)" }}>
                        <div style={styles.detailStatNum}>Rs {totalBalance.toFixed(0)}</div>
                        <div style={styles.detailStatLabel}>Balance Due</div>
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div style={styles.breakdown}>
                      {[
                        ["💰 Total Earned", `Rs ${totalAmount.toFixed(0)}`],
                        ["💵 Total Received", `Rs ${totalReceived.toFixed(0)}`],
                        ["✂️ Advance Cut", `Rs ${totalAdvanceCut.toFixed(0)}`],
                        ["🏦 Advance Taken", `Rs ${advanceTaken.toFixed(0)}`],
                        ["🟢 Balance", `Rs ${totalBalance.toFixed(0)}`],
                        ["📅 Joined", selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString("en-IN") : "—"],
                      ].map(([label, val]) => (
                        <div key={label} style={styles.breakdownRow}>
                          <span style={styles.breakdownLabel}>{label}</span>
                          <span style={styles.breakdownVal}>{val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Recent entries */}
                    {userEntries.length > 0 && (
                      <>
                        <div style={styles.recentTitle}>📋 Recent Entries</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "200px", overflowY: "auto" }}>
                          {userEntries.slice(0, 8).map(e => (
                            <div key={e.id} style={styles.entryRow}>
                              <div>
                                <div style={{ fontSize: "13px", fontWeight: "800", color: "#1a3a1a" }}>
                                  {new Date(e.date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                </div>
                                <div style={{ fontSize: "11px", color: "#6b7280" }}>{e.weight} kg {e.rate > 0 ? `@ Rs${e.rate}` : "— rate pending"}</div>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: "14px", fontWeight: "800" }}>{e.totalAmount > 0 ? `Rs ${e.totalAmount.toFixed(0)}` : "—"}</div>
                                {e.balanceAmount !== 0 && <div style={{ fontSize: "11px", color: e.balanceAmount >= 0 ? "#16a34a" : "#dc2626", fontWeight: "700" }}>Bal: Rs {(e.balanceAmount || 0).toFixed(0)}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                      <button onClick={() => toggleDisable(selectedUser)} disabled={actionLoading}
                        style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: "700", fontSize: "13px", background: selectedUser.disabled ? "#f0fdf4" : "#fef3c7", color: selectedUser.disabled ? "#16a34a" : "#d97706" }}>
                        {selectedUser.disabled ? "✅ Enable User" : "⛔ Disable User"}
                      </button>
                      <button onClick={() => { setSelectedUser(null); setConfirmDelete(selectedUser.uid); }}
                        style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: "700", fontSize: "13px", background: "#fef2f2", color: "#dc2626" }}>
                        🗑️ Delete User
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM ── */}
      {confirmDelete && (
        <div style={styles.overlay} onClick={() => setConfirmDelete(null)}>
          <div style={styles.confirmBox} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🗑️</div>
            <div style={{ fontSize: "18px", fontWeight: "900", color: "#1a1a1a", marginBottom: "8px" }}>Delete User?</div>
            <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "24px", lineHeight: "1.6" }}>
              This will permanently delete the user and <strong>all their entries</strong>. Cannot be undone!
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setConfirmDelete(null)} style={styles.cancelBtn}>Cancel</button>
              <button onClick={() => deleteUser(confirmDelete)} disabled={actionLoading}
                style={styles.confirmDeleteBtn}>{actionLoading ? "Deleting..." : "Yes, Delete"}</button>
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
