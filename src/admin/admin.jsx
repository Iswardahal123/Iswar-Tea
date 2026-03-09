// 👑 AdminDashboard.jsx - Saare users ka data
import React, { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import {
  collection, getDocs, query, orderBy, deleteDoc, doc, updateDoc
} from "firebase/firestore";

export default function AdminDashboard({ user }) {
  const [entries, setEntries] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("entries");
  const [filterUser, setFilterUser] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all entries
      const entriesSnap = await getDocs(
        query(collection(db, "entries"), orderBy("date", "desc"))
      );
      const allEntries = entriesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setEntries(allEntries);

      // Fetch all users
      const usersSnap = await getDocs(collection(db, "users"));
      const allUsers = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(allUsers);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleDeleteEntry = async (id) => {
    if (!window.confirm("Yeh entry delete karna chahte ho?")) return;
    await deleteDoc(doc(db, "entries", id));
    fetchData();
  };

  const toggleAdmin = async (userId, currentStatus) => {
    if (!window.confirm(`Is user ko ${currentStatus ? "normal user" : "admin"} banana chahte ho?`)) return;
    await updateDoc(doc(db, "users", userId), { isAdmin: !currentStatus });
    fetchData();
  };

  const getUserName = (uid) => {
    const u = users.find((u) => u.uid === uid);
    return u ? (u.name || u.email) : uid.slice(0, 8) + "...";
  };

  const filtered = filterUser === "all"
    ? entries
    : entries.filter((e) => e.uid === filterUser);

  // Summary
  const totalWeight = filtered.reduce((s, e) => s + (e.weight || 0), 0);
  const totalEarned = filtered.reduce((s, e) => s + (e.totalAmount || 0), 0);
  const totalBalance = filtered.reduce((s, e) => s + (e.balanceAmount || 0), 0);

  if (loading) return (
    <div style={{ textAlign: "center", padding: "60px", color: "#6b7280" }}>
      <div style={{ fontSize: "40px" }}>🍃</div>
      <p>Loading admin data...</p>
    </div>
  );

  return (
    <div style={styles.container}>

      {/* Admin Badge */}
      <div style={styles.adminBadge}>
        <span>👑 Admin Dashboard</span>
        <span style={styles.adminEmail}>{user.email}</span>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab("entries")}
          style={{ ...styles.tab, ...(activeTab === "entries" ? styles.activeTab : {}) }}
        >
          📋 Entries ({entries.length})
        </button>
        <button
          onClick={() => setActiveTab("users")}
          style={{ ...styles.tab, ...(activeTab === "users" ? styles.activeTab : {}) }}
        >
          👥 Users ({users.length})
        </button>
      </div>

      {/* ENTRIES TAB */}
      {activeTab === "entries" && (
        <>
          {/* Summary */}
          <div style={styles.summaryGrid}>
            <div style={{ ...styles.sCard, background: "linear-gradient(135deg,#1a3a1a,#2d5a27)" }}>
              <div style={styles.sLabel}>Kul Wajan</div>
              <div style={styles.sVal}>{totalWeight.toFixed(0)} kg</div>
            </div>
            <div style={{ ...styles.sCard, background: "linear-gradient(135deg,#1e40af,#3b82f6)" }}>
              <div style={styles.sLabel}>Kul Kamai</div>
              <div style={styles.sVal}>₹{totalEarned.toFixed(0)}</div>
            </div>
            <div style={{ ...styles.sCard, background: "linear-gradient(135deg,#92400e,#d97706)" }}>
              <div style={styles.sLabel}>Total Entries</div>
              <div style={styles.sVal}>{filtered.length}</div>
            </div>
            <div style={{ ...styles.sCard, background: "linear-gradient(135deg,#14532d,#16a34a)" }}>
              <div style={styles.sLabel}>Kul Baaki</div>
              <div style={styles.sVal}>₹{totalBalance.toFixed(0)}</div>
            </div>
          </div>

          {/* User Filter */}
          <div style={styles.filterBox}>
            <label style={styles.filterLabel}>👤 User Filter:</label>
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              style={styles.select}
            >
              <option value="all">Saare Users</option>
              {users.map((u) => (
                <option key={u.uid} value={u.uid}>
                  {u.name || u.email}
                </option>
              ))}
            </select>
          </div>

          {/* Entries List */}
          {filtered.length === 0 ? (
            <div style={styles.empty}>Koi entry nahi mili 🍃</div>
          ) : (
            filtered.map((entry) => (
              <div key={entry.id} style={styles.entryCard}>
                <div
                  style={styles.cardHeader}
                  onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                >
                  <div>
                    <div style={styles.cardDate}>
                      {new Date(entry.date).toLocaleDateString("hi-IN", {
                        day: "numeric", month: "long", year: "numeric"
                      })}
                    </div>
                    <div style={styles.cardUser}>👤 {getUserName(entry.uid)}</div>
                    <div style={styles.cardWeight}>⚖️ {entry.weight}kg @ ₹{entry.rate}/kg</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={styles.cardTotal}>₹{entry.totalAmount?.toFixed(0)}</div>
                    <div style={{
                      ...styles.badge,
                      color: entry.balanceAmount >= 0 ? "#16a34a" : "#dc2626",
                      background: entry.balanceAmount >= 0 ? "#f0fdf4" : "#fef2f2",
                    }}>
                      Baaki: ₹{entry.balanceAmount?.toFixed(0)}
                    </div>
                  </div>
                </div>

                {expandedId === entry.id && (
                  <div style={styles.details}>
                    <div style={styles.detailRow}>
                      <span>Kul Raqam</span><span>₹{entry.totalAmount?.toFixed(2)}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span>Advance Kata</span>
                      <span style={{ color: "#dc2626" }}>-₹{entry.advanceCut?.toFixed(2)}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span>Mili Raqam</span>
                      <span style={{ color: "#2563eb" }}>-₹{entry.amountReceived?.toFixed(2)}</span>
                    </div>
                    <div style={{ ...styles.detailRow, fontWeight: "800", borderTop: "2px solid #e5e7eb", paddingTop: "8px" }}>
                      <span>Baaki</span>
                      <span style={{ color: entry.balanceAmount >= 0 ? "#16a34a" : "#dc2626" }}>
                        ₹{entry.balanceAmount?.toFixed(2)}
                      </span>
                    </div>
                    {entry.notes && <div style={styles.notes}>📝 {entry.notes}</div>}
                    <button onClick={() => handleDeleteEntry(entry.id)} style={styles.deleteBtn}>
                      🗑️ Delete Entry
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </>
      )}

      {/* USERS TAB */}
      {activeTab === "users" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {users.map((u) => (
            <div key={u.uid} style={styles.userCard}>
              <div style={styles.userLeft}>
                <div style={styles.userAvatar}>
                  {u.photo
                    ? <img src={u.photo} alt="" style={{ width: 44, height: 44, borderRadius: "50%" }} />
                    : <span style={{ fontSize: "22px" }}>{u.isAdmin ? "👑" : "👤"}</span>
                  }
                </div>
                <div>
                  <div style={styles.userName}>{u.name || "No Name"}</div>
                  <div style={styles.userEmail}>{u.email}</div>
                  <div style={{
                    ...styles.roleBadge,
                    background: u.isAdmin ? "#fef3c7" : "#f0fdf4",
                    color: u.isAdmin ? "#92400e" : "#166534",
                  }}>
                    {u.isAdmin ? "👑 Admin" : "👤 User"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => toggleAdmin(u.uid, u.isAdmin)}
                style={{
                  ...styles.toggleBtn,
                  background: u.isAdmin ? "#fee2e2" : "#f0fdf4",
                  color: u.isAdmin ? "#dc2626" : "#16a34a",
                }}
              >
                {u.isAdmin ? "Remove Admin" : "Make Admin"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "16px",
    paddingBottom: "30px",
    background: "#f8faf8",
    minHeight: "calc(100vh - 60px)",
    fontFamily: "'Segoe UI', sans-serif",
  },
  adminBadge: {
    background: "linear-gradient(135deg, #92400e, #d97706)",
    color: "white",
    padding: "12px 16px",
    borderRadius: "12px",
    marginBottom: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: "700",
    fontSize: "14px",
  },
  adminEmail: { fontSize: "11px", opacity: 0.85 },
  tabs: {
    display: "flex",
    background: "white",
    borderRadius: "12px",
    padding: "4px",
    marginBottom: "16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  tab: {
    flex: 1,
    padding: "10px",
    border: "none",
    background: "none",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    color: "#6b7280",
    fontFamily: "inherit",
  },
  activeTab: {
    background: "linear-gradient(135deg, #1a3a1a, #2d5a27)",
    color: "white",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginBottom: "14px",
  },
  sCard: { borderRadius: "14px", padding: "13px", color: "white" },
  sLabel: { fontSize: "10px", opacity: 0.85, fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" },
  sVal: { fontSize: "20px", fontWeight: "900" },
  filterBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "white",
    padding: "12px 16px",
    borderRadius: "12px",
    marginBottom: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  filterLabel: { fontSize: "13px", fontWeight: "700", whiteSpace: "nowrap" },
  select: {
    flex: 1,
    border: "2px solid #e5e7eb",
    borderRadius: "8px",
    padding: "7px 10px",
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
  },
  empty: { textAlign: "center", padding: "40px", color: "#6b7280" },
  entryCard: {
    background: "white",
    borderRadius: "14px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    overflow: "hidden",
    marginBottom: "10px",
  },
  cardHeader: {
    padding: "13px 15px",
    display: "flex",
    justifyContent: "space-between",
    cursor: "pointer",
  },
  cardDate: { fontSize: "14px", fontWeight: "800", color: "#1a3a1a" },
  cardUser: { fontSize: "11px", color: "#2563eb", fontWeight: "700", marginTop: "2px" },
  cardWeight: { fontSize: "12px", color: "#6b7280", marginTop: "1px" },
  cardTotal: { fontSize: "18px", fontWeight: "900", color: "#1a3a1a" },
  badge: { fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "6px", display: "inline-block", marginTop: "3px" },
  details: { padding: "12px 15px 15px", borderTop: "1px solid #f3f4f6", display: "flex", flexDirection: "column", gap: "6px" },
  detailRow: { display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#374151" },
  notes: { fontSize: "12px", color: "#6b7280", background: "#f9fafb", padding: "8px", borderRadius: "8px" },
  deleteBtn: {
    background: "#fee2e2", color: "#dc2626", border: "none",
    padding: "10px", borderRadius: "8px", cursor: "pointer",
    fontSize: "13px", fontWeight: "700", width: "100%", fontFamily: "inherit",
  },
  userCard: {
    background: "white",
    borderRadius: "14px",
    padding: "14px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  userLeft: { display: "flex", alignItems: "center", gap: "12px" },
  userAvatar: {
    width: 44, height: 44, borderRadius: "50%",
    background: "#f0fdf4", display: "flex",
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  },
  userName: { fontSize: "14px", fontWeight: "800", color: "#1a3a1a" },
  userEmail: { fontSize: "11px", color: "#6b7280", marginTop: "2px" },
  roleBadge: { fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "6px", display: "inline-block", marginTop: "4px" },
  toggleBtn: {
    border: "none", padding: "8px 12px", borderRadius: "8px",
    cursor: "pointer", fontSize: "12px", fontWeight: "700",
    fontFamily: "inherit", whiteSpace: "nowrap",
  },
};

