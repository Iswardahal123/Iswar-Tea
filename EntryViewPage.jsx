// 📋 EntryViewPage.jsx
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase/config";
import {
  collection, query, where, orderBy, getDocs, deleteDoc, doc
} from "firebase/firestore";

export default function EntryViewPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "entries"),
        where("uid", "==", auth.currentUser.uid),
        orderBy("date", "desc")
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setEntries(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Yeh entry delete karna chahte ho?")) return;
    await deleteDoc(doc(db, "entries", id));
    fetchEntries();
  };

  const filtered = filterMonth
    ? entries.filter((e) => e.date?.startsWith(filterMonth))
    : entries;

  // Summary calculations
  const totalWeight = filtered.reduce((s, e) => s + (e.weight || 0), 0);
  const totalEarned = filtered.reduce((s, e) => s + (e.totalAmount || 0), 0);
  const totalBalance = filtered.reduce((s, e) => s + (e.balanceAmount || 0), 0);
  const totalReceived = filtered.reduce((s, e) => s + (e.amountReceived || 0), 0);

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}>🍃</div>
        <p>Data load ho raha hai...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={{ ...styles.summaryCard, background: "linear-gradient(135deg, #1a3a1a, #2d5a27)" }}>
          <div style={styles.summaryLabel}>Kul Wajan</div>
          <div style={styles.summaryValue}>{totalWeight.toFixed(1)} kg</div>
        </div>
        <div style={{ ...styles.summaryCard, background: "linear-gradient(135deg, #1e40af, #3b82f6)" }}>
          <div style={styles.summaryLabel}>Kul Kamai</div>
          <div style={styles.summaryValue}>₹{totalEarned.toFixed(0)}</div>
        </div>
        <div style={{ ...styles.summaryCard, background: "linear-gradient(135deg, #92400e, #d97706)" }}>
          <div style={styles.summaryLabel}>Mili Raqam</div>
          <div style={styles.summaryValue}>₹{totalReceived.toFixed(0)}</div>
        </div>
        <div style={{
          ...styles.summaryCard,
          background: totalBalance >= 0
            ? "linear-gradient(135deg, #14532d, #16a34a)"
            : "linear-gradient(135deg, #7f1d1d, #dc2626)"
        }}>
          <div style={styles.summaryLabel}>Baaki Bacha</div>
          <div style={styles.summaryValue}>₹{totalBalance.toFixed(0)}</div>
        </div>
      </div>

      {/* Month Filter */}
      <div style={styles.filterRow}>
        <label style={styles.filterLabel}>📅 Month Filter:</label>
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          style={styles.filterInput}
        />
        {filterMonth && (
          <button onClick={() => setFilterMonth("")} style={styles.clearBtn}>
            Clear
          </button>
        )}
      </div>

      {/* Entries */}
      {filtered.length === 0 ? (
        <div style={styles.empty}>
          <p>🍃 Koi entry nahi mili</p>
          <p style={{ fontSize: "13px", color: "#9ca3af" }}>Pehle Entry tab se data daalo</p>
        </div>
      ) : (
        <div style={styles.entryList}>
          {filtered.map((entry) => (
            <div key={entry.id} style={styles.entryCard}>
              {/* Header */}
              <div
                style={styles.cardHeader}
                onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
              >
                <div style={styles.cardLeft}>
                  <div style={styles.dateLabel}>
                    {new Date(entry.date).toLocaleDateString("hi-IN", {
                      day: "numeric", month: "long", year: "numeric"
                    })}
                  </div>
                  <div style={styles.weightLabel}>⚖️ {entry.weight} kg @ ₹{entry.rate}/kg</div>
                </div>
                <div style={styles.cardRight}>
                  <div style={styles.totalBadge}>₹{entry.totalAmount?.toFixed(0)}</div>
                  <div style={{
                    ...styles.balanceBadge,
                    color: entry.balanceAmount >= 0 ? "#16a34a" : "#dc2626",
                    background: entry.balanceAmount >= 0 ? "#f0fdf4" : "#fef2f2",
                  }}>
                    Baaki: ₹{entry.balanceAmount?.toFixed(0)}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === entry.id && (
                <div style={styles.details}>
                  <div style={styles.detailRow}>
                    <span>Kul Raqam</span>
                    <span>₹ {entry.totalAmount?.toFixed(2)}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span>Advance Kata</span>
                    <span style={{ color: "#dc2626" }}>- ₹ {entry.advanceCut?.toFixed(2)}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span>Mili Raqam</span>
                    <span style={{ color: "#2563eb" }}>- ₹ {entry.amountReceived?.toFixed(2)}</span>
                  </div>
                  <div style={{ ...styles.detailRow, fontWeight: "800", borderTop: "2px solid #e5e7eb", paddingTop: "8px", marginTop: "4px" }}>
                    <span>Baaki Raqam</span>
                    <span style={{ color: entry.balanceAmount >= 0 ? "#16a34a" : "#dc2626" }}>
                      ₹ {entry.balanceAmount?.toFixed(2)}
                    </span>
                  </div>
                  {entry.notes && (
                    <div style={styles.notes}>📝 {entry.notes}</div>
                  )}
                  <button
                    onClick={() => handleDelete(entry.id)}
                    style={styles.deleteBtn}
                  >
                    🗑️ Delete Entry
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: "calc(100vh - 120px)",
    background: "#f8faf8",
    padding: "16px",
    paddingBottom: "80px",
    fontFamily: "'Segoe UI', sans-serif",
  },
  loading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "40vh",
    color: "#6b7280",
  },
  spinner: { fontSize: "40px", animation: "spin 2s linear infinite" },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginBottom: "16px",
  },
  summaryCard: {
    borderRadius: "14px",
    padding: "14px",
    color: "white",
  },
  summaryLabel: { fontSize: "11px", opacity: 0.8, fontWeight: "600", marginBottom: "4px" },
  summaryValue: { fontSize: "20px", fontWeight: "800" },
  filterRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "14px",
    background: "white",
    padding: "12px 16px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  filterLabel: { fontSize: "13px", fontWeight: "700", whiteSpace: "nowrap" },
  filterInput: {
    border: "2px solid #e5e7eb",
    borderRadius: "8px",
    padding: "6px 10px",
    fontSize: "14px",
    flex: 1,
  },
  clearBtn: {
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    padding: "6px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "700",
  },
  empty: {
    textAlign: "center",
    padding: "40px",
    color: "#6b7280",
    fontSize: "16px",
  },
  entryList: { display: "flex", flexDirection: "column", gap: "10px" },
  entryCard: {
    background: "white",
    borderRadius: "14px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    overflow: "hidden",
  },
  cardHeader: {
    padding: "14px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    cursor: "pointer",
  },
  cardLeft: { flex: 1 },
  dateLabel: { fontSize: "14px", fontWeight: "700", color: "#1a3a1a" },
  weightLabel: { fontSize: "12px", color: "#6b7280", marginTop: "2px" },
  cardRight: { textAlign: "right" },
  totalBadge: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#1a3a1a",
  },
  balanceBadge: {
    fontSize: "12px",
    fontWeight: "700",
    padding: "2px 8px",
    borderRadius: "6px",
    marginTop: "4px",
    display: "inline-block",
  },
  details: {
    padding: "0 16px 16px",
    borderTop: "1px solid #f3f4f6",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    paddingTop: "12px",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
    color: "#374151",
  },
  notes: {
    fontSize: "13px",
    color: "#6b7280",
    background: "#f9fafb",
    padding: "8px 12px",
    borderRadius: "8px",
    marginTop: "4px",
  },
  deleteBtn: {
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    padding: "10px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "700",
    marginTop: "8px",
    width: "100%",
  },
};
