import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase/config";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

export default function DashboardPage({ user }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState("");
  const [totalAdvanceTaken, setTotalAdvanceTaken] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const currentUser = user || auth.currentUser;
        if (!currentUser) { setLoading(false); return; }
        const q = query(
          collection(db, "entries"),
          where("uid", "==", currentUser.uid)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setEntries(data);
        // Fetch total advance taken from user doc
        if (currentUser.uid) {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setTotalAdvanceTaken(userDoc.data().totalAdvanceTaken || 0);
          }
        }
      } catch (err) {
        console.error("Fetch error:", err);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const filtered = filterMonth
    ? entries.filter((e) => e.date && e.date.startsWith(filterMonth))
    : entries;

  const totalWeight      = filtered.reduce((s, e) => s + (e.weight || 0), 0);
  const totalAmount      = filtered.reduce((s, e) => s + (e.totalAmount || 0), 0);
  const totalReceived    = filtered.reduce((s, e) => s + (e.amountReceived || 0), 0);
  const totalAdvanceCut  = filtered.reduce((s, e) => s + (e.advanceCut || 0), 0);
  const totalBalance     = filtered.reduce((s, e) => s + (e.balanceAmount || 0), 0);

  // Advance Balance = Total Advance Liya - Total Advance Kata (entries mein)
  const advanceBalance = totalAdvanceTaken - totalAdvanceCut;

  const currentUserObj = user || auth.currentUser;
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "ৰাতিপুৱাৰ চাহ";
    if (h < 17) return "দুপৰীয়া";
    return "সন্ধিয়াৰ চাহ";
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px", color: "#6b7280", fontFamily: "'Segoe UI', sans-serif" }}>
        <div style={{ fontSize: "40px" }}>🍃</div>
        <p>তথ্য সংগ্ৰহ হৈ আছে অপেক্ষা কৰক...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>

      {/* Greeting */}
      <div style={styles.greetingCard}>
        <div style={styles.greetingTop}>
          <div>
            <div style={styles.greetingText}>{greeting()} ☕</div>
            <div style={styles.greetingName}>{currentUserObj ? (currentUserObj.displayName || currentUserObj.email.split("@")[0]) : ""}</div>
          </div>
          <div style={styles.leafBig}>🍃</div>
        </div>
        <div style={styles.totalEntries}>{filtered.length} টা তথ্য পোৱা গৈছে • মুঠ: {totalWeight.toFixed(1)} কি:গ্ৰা: চাহ</div>
      </div>

      {/* Month Filter */}
      <div style={styles.filterRow}>
        <label style={styles.filterLabel}>📅 মাহ:</label>
        <input
          type="month" value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          style={styles.filterInput}
        />
        {filterMonth && (
          <button onClick={() => setFilterMonth("")} style={styles.clearBtn}>Clear</button>
        )}
      </div>

      {/* Main Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={{ ...styles.statCard, background: "linear-gradient(135deg, #1a3a1a, #2d5a27)", gridColumn: "span 2" }}>
          <div style={styles.statLabel}>মুঠ উপাৰ্জন</div>
          <div style={styles.statValueBig}>টকা {totalAmount.toFixed(2)}</div>
          <div style={styles.statSub}>মুঠ: {totalWeight.toFixed(1)} কি:গ্ৰা:</div>
        </div>

        <div style={{ ...styles.statCard, background: "linear-gradient(135deg, #1e40af, #3b82f6)" }}>
          <div style={styles.statLabel}>প্ৰাপ্ত টকা</div>
          <div style={styles.statValue}>টকা {totalReceived.toFixed(0)}</div>
        </div>

        <div style={{ ...styles.statCard, background: totalBalance >= 0 ? "linear-gradient(135deg, #14532d, #16a34a)" : "linear-gradient(135deg, #7f1d1d, #dc2626)" }}>
          <div style={styles.statLabel}>পাবলগীয়া টকা</div>
          <div style={styles.statValue}>টকা {totalBalance.toFixed(0)}</div>
        </div>

        <div style={{ ...styles.statCard, background: "linear-gradient(135deg, #92400e, #d97706)" }}>
          <div style={styles.statLabel}>এডভান্স লোৱা(মুঠ)</div>
          <div style={styles.statValue}>টকা {totalAdvanceTaken.toFixed(0)}</div>
          <div style={styles.statSub}>কটা হ'ল: Rs {totalAdvanceCut.toFixed(0)}</div>
        </div>

        <div style={{ ...styles.statCard, background: advanceBalance >= 0 ? "linear-gradient(135deg, #4c1d95, #7c3aed)" : "linear-gradient(135deg, #7f1d1d, #dc2626)" }}>
          <div style={styles.statLabel}>এডভান্স বাকী </div>
          <div style={styles.statValue}>টকা {advanceBalance.toFixed(0)}</div>
          <div style={styles.statSub}>{advanceBalance >= 0 ? "বৰ্তমান বাকী আছে" : "বেছি কাটিলে!"}</div>
        </div>
      </div>

      {/* Recent Entries */}
      <div style={styles.sectionTitle}>📋 নতুনকৈ অন্তৰ্ভুক্ত কিছু তথ্য👇</div>

      {filtered.length === 0 ? (
        <div style={styles.empty}>
          <p>তথ্য অন্তৰ্ভুক্ত কৰা হোৱা নাই</p>
          <p style={{ fontSize: "13px", color: "#9ca3af", marginTop: "6px" }}>Entry ত গৈ তথ্য অন্তৰ্ভুক্ত কৰক</p>
        </div>
      ) : (
        filtered.slice(0, 10).map((entry) => (
          <div key={entry.id} style={styles.entryRow}>
            <div style={styles.entryLeft}>
              <div style={styles.entryDate}>
                {new Date(entry.date).toLocaleDateString("hi-IN", { day: "numeric", month: "short" })}
              </div>
              <div style={styles.entryWeight}>{entry.weight} কি:গ্ৰা:</div>
            </div>
            <div style={styles.entryMid}>
              {entry.rate > 0
                ? <span style={styles.rateTag}>টকা {entry.rate}/কি:গ্ৰা:</span>
                : <span style={styles.pendingTag}>দাম অন্তৰ্ভুক্ত নাই</span>
              }
            </div>
            <div style={styles.entryRight}>
              {entry.totalAmount > 0 && (
                <div style={styles.entryTotal}>টকা{entry.totalAmount.toFixed(0)}</div>
              )}
              <div style={{
                ...styles.entryBalance,
                color: (entry.balanceAmount || 0) >= 0 ? "#16a34a" : "#dc2626",
              }}>
                Baaki: Rs{(entry.balanceAmount || 0).toFixed(0)}
              </div>
            </div>
          </div>
        ))
      )}

      {filtered.length > 10 && (
        <div style={styles.moreText}>+ {filtered.length - 10} অধিক তথ্যৰ বাবে— Recordsত যাওঁক</div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: "16px", paddingBottom: "90px", background: "#f8faf8", minHeight: "calc(100vh - 60px)", fontFamily: "'Segoe UI', sans-serif" },
  greetingCard: {
    background: "linear-gradient(135deg, #1a3a1a, #2d5a27, #4a7c3f)",
    borderRadius: "20px", padding: "20px", marginBottom: "16px", color: "white",
  },
  greetingTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" },
  greetingText: { fontSize: "13px", opacity: 0.8, marginBottom: "4px" },
  greetingName: { fontSize: "22px", fontWeight: "900", letterSpacing: "-0.5px" },
  leafBig: { fontSize: "40px" },
  totalEntries: { fontSize: "12px", opacity: 0.75, marginTop: "4px" },
  filterRow: {
    display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px",
    background: "white", padding: "12px 16px", borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  filterLabel: { fontSize: "13px", fontWeight: "700", whiteSpace: "nowrap" },
  filterInput: { border: "2px solid #e5e7eb", borderRadius: "8px", padding: "6px 10px", fontSize: "14px", flex: 1, outline: "none", fontFamily: "inherit" },
  clearBtn: { background: "#fee2e2", color: "#dc2626", border: "none", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontFamily: "inherit" },
  statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" },
  statCard: { borderRadius: "16px", padding: "16px", color: "white" },
  statLabel: { fontSize: "11px", opacity: 0.85, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" },
  statValueBig: { fontSize: "26px", fontWeight: "900", letterSpacing: "-0.5px" },
  statValue: { fontSize: "20px", fontWeight: "900", letterSpacing: "-0.5px" },
  statSub: { fontSize: "11px", opacity: 0.75, marginTop: "4px" },
  sectionTitle: { fontSize: "15px", fontWeight: "800", color: "#1a3a1a", marginBottom: "10px" },
  empty: { textAlign: "center", padding: "40px", color: "#6b7280", fontSize: "15px", background: "white", borderRadius: "14px" },
  entryRow: {
    background: "white", borderRadius: "12px", padding: "12px 14px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: "8px", boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
  },
  entryLeft: { minWidth: "60px" },
  entryDate: { fontSize: "13px", fontWeight: "800", color: "#1a3a1a" },
  entryWeight: { fontSize: "12px", color: "#6b7280", marginTop: "2px" },
  entryMid: { flex: 1, paddingLeft: "10px" },
  rateTag: { fontSize: "12px", background: "#f0fdf4", color: "#166534", padding: "3px 8px", borderRadius: "6px", fontWeight: "700" },
  pendingTag: { fontSize: "11px", background: "#fef3c7", color: "#92400e", padding: "3px 8px", borderRadius: "6px", fontWeight: "700" },
  entryRight: { textAlign: "right" },
  entryTotal: { fontSize: "15px", fontWeight: "800", color: "#1a3a1a" },
  entryBalance: { fontSize: "11px", fontWeight: "700", marginTop: "2px" },
  moreText: { textAlign: "center", fontSize: "13px", color: "#6b7280", padding: "12px", background: "white", borderRadius: "10px", marginTop: "4px" },
};
