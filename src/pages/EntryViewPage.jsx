// 📋 EntryViewPage.jsx - View + Edit with all fields
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase/config";
import {
  collection, query, where, orderBy, getDocs,
  deleteDoc, doc, updateDoc
} from "firebase/firestore";

export default function EntryViewPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState("");
  const [editEntry, setEditEntry] = useState(null); // Jo entry edit ho rahi hai
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "entries"),
        where("uid", "==", auth.currentUser.uid),
        orderBy("date", "desc")
      );
      const snap = await getDocs(q);
      setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchEntries(); }, []);

  const openEdit = (entry) => {
    setEditEntry(entry);
    setEditForm({
      date: entry.date || "",
      weight: entry.weight || "",
      rate: entry.rate || "",
      advanceCut: entry.advanceCut || "",
      amountReceived: entry.amountReceived || "",
      notes: entry.notes || "",
    });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  // Live calculations in edit form
  const eWeight = parseFloat(editForm.weight) || 0;
  const eRate = parseFloat(editForm.rate) || 0;
  const eAdvance = parseFloat(editForm.advanceCut) || 0;
  const eReceived = parseFloat(editForm.amountReceived) || 0;
  const eTotalAmount = eWeight * eRate;
  const eBalance = eTotalAmount - eAdvance - eReceived;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "entries", editEntry.id), {
        date: editForm.date,
        weight: eWeight,
        rate: eRate,
        totalAmount: eTotalAmount,
        advanceCut: eAdvance,
        amountReceived: eReceived,
        balanceAmount: eBalance,
        notes: editForm.notes,
      });
      setEditEntry(null);
      fetchEntries();
    } catch (err) { alert("Save nahi hua: " + err.message); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yeh entry delete karna chahte ho?")) return;
    await deleteDoc(doc(db, "entries", id));
    fetchEntries();
  };

  const filtered = filterMonth
    ? entries.filter((e) => e.date?.startsWith(filterMonth))
    : entries;

  const totalWeight   = filtered.reduce((s, e) => s + (e.weight || 0), 0);
  const totalEarned   = filtered.reduce((s, e) => s + (e.totalAmount || 0), 0);
  const totalBalance  = filtered.reduce((s, e) => s + (e.balanceAmount || 0), 0);
  const totalReceived = filtered.reduce((s, e) => s + (e.amountReceived || 0), 0);

  if (loading) return (
    <div style={{ textAlign: "center", padding: "60px", color: "#6b7280" }}>
      <div style={{ fontSize: "40px" }}>🍃</div>
      <p>Load ho raha hai...</p>
    </div>
  );

  return (
    <div style={styles.container}>

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        {[
          { label: "Kul Wajan", value: totalWeight.toFixed(1) + " kg", bg: "linear-gradient(135deg,#1a3a1a,#2d5a27)" },
          { label: "Kul Kamai", value: "₹" + totalEarned.toFixed(0), bg: "linear-gradient(135deg,#1e40af,#3b82f6)" },
          { label: "Mili Raqam", value: "₹" + totalReceived.toFixed(0), bg: "linear-gradient(135deg,#92400e,#d97706)" },
          { label: "Baaki Bacha", value: "₹" + totalBalance.toFixed(0), bg: totalBalance >= 0 ? "linear-gradient(135deg,#14532d,#16a34a)" : "linear-gradient(135deg,#7f1d1d,#dc2626)" },
        ].map((c) => (
          <div key={c.label} style={{ ...styles.sCard, background: c.bg }}>
            <div style={styles.sLabel}>{c.label}</div>
            <div style={styles.sVal}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Month Filter */}
      <div style={styles.filterRow}>
        <label style={styles.filterLabel}>📅 Month:</label>
        <input
          type="month" value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          style={styles.filterInput}
        />
        {filterMonth && (
          <button onClick={() => setFilterMonth("")} style={styles.clearBtn}>✕</button>
        )}
      </div>

      {/* Entry List */}
      {filtered.length === 0 ? (
        <div style={styles.empty}>
          <p>🍃 Koi entry nahi mili</p>
          <p style={{ fontSize: "13px", color: "#9ca3af", marginTop: "6px" }}>Entry tab se patta add karo</p>
        </div>
      ) : filtered.map((entry) => (
        <div key={entry.id} style={styles.entryCard}>
          <div style={styles.cardTop}>
            <div>
              <div style={styles.cardDate}>
                {new Date(entry.date).toLocaleDateString("hi-IN", { day: "numeric", month: "long", year: "numeric" })}
              </div>
              <div style={styles.cardWeight}>⚖️ {entry.weight} kg
                {entry.rate > 0 && <span> @ ₹{entry.rate}/kg</span>}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              {entry.totalAmount > 0
                ? <div style={styles.cardTotal}>₹{entry.totalAmount.toFixed(0)}</div>
                : <div style={styles.pendingBadge}>⏳ Rate pending</div>
              }
              {entry.balanceAmount !== 0 && (
                <div style={{
                  ...styles.balanceBadge,
                  color: entry.balanceAmount >= 0 ? "#16a34a" : "#dc2626",
                  background: entry.balanceAmount >= 0 ? "#f0fdf4" : "#fef2f2",
                }}>
                  Baaki: ₹{entry.balanceAmount?.toFixed(0)}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={styles.actionRow}>
            <button onClick={() => openEdit(entry)} style={styles.editBtn}>
              ✏️ Edit / Details
            </button>
            <button onClick={() => handleDelete(entry.id)} style={styles.deleteBtn}>
              🗑️
            </button>
          </div>
        </div>
      ))}

      {/* ===== EDIT MODAL ===== */}
      {editEntry && (
        <div style={styles.modalOverlay} onClick={() => setEditEntry(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>✏️ Entry Edit Karo</h3>
              <button onClick={() => setEditEntry(null)} style={styles.closeBtn}>✕</button>
            </div>

            <div style={styles.modalBody}>
              {/* Date */}
              <div style={styles.field}>
                <label style={styles.fieldLabel}>📅 Tarikh</label>
                <input type="date" name="date" value={editForm.date} onChange={handleEditChange} style={styles.fieldInput} />
              </div>

              {/* Weight */}
              <div style={styles.field}>
                <label style={styles.fieldLabel}>⚖️ Wajan (kg)</label>
                <input type="number" name="weight" value={editForm.weight} onChange={handleEditChange} placeholder="150" style={styles.fieldInput} />
              </div>

              {/* Rate */}
              <div style={styles.field}>
                <label style={styles.fieldLabel}>💰 Rate (₹/kg)</label>
                <input type="number" name="rate" value={editForm.rate} onChange={handleEditChange} placeholder="18" style={styles.fieldInput} />
              </div>

              {/* Total Amount (auto) */}
              {eTotalAmount > 0 && (
                <div style={styles.calcBox}>
                  <div style={styles.calcRow}>
                    <span>Kul Raqam</span>
                    <span style={styles.calcVal}>₹ {eTotalAmount.toFixed(2)}</span>
                  </div>
                  <div style={styles.calcHint}>{eWeight} kg × ₹{eRate} = ₹{eTotalAmount.toFixed(2)}</div>
                </div>
              )}

              {/* Advance Cut */}
              <div style={styles.field}>
                <label style={styles.fieldLabel}>✂️ Advance Kata (₹)</label>
                <input type="number" name="advanceCut" value={editForm.advanceCut} onChange={handleEditChange} placeholder="0" style={styles.fieldInput} />
              </div>

              {/* Amount Received */}
              <div style={styles.field}>
                <label style={styles.fieldLabel}>💵 Mili Raqam (₹)</label>
                <input type="number" name="amountReceived" value={editForm.amountReceived} onChange={handleEditChange} placeholder="0" style={styles.fieldInput} />
              </div>

              {/* Balance (auto) */}
              {eTotalAmount > 0 && (
                <div style={{
                  ...styles.calcBox,
                  background: eBalance >= 0 ? "#f0fdf4" : "#fef2f2",
                  borderColor: eBalance >= 0 ? "#86efac" : "#fca5a5",
                }}>
                  <div style={styles.calcRow}>
                    <span style={{ fontWeight: "800" }}>💳 Baaki Raqam</span>
                    <span style={{ fontSize: "22px", fontWeight: "900", color: eBalance >= 0 ? "#16a34a" : "#dc2626" }}>
                      ₹ {eBalance.toFixed(2)}
                    </span>
                  </div>
                  <div style={styles.calcHint}>
                    ₹{eTotalAmount.toFixed(0)} - ₹{eAdvance} - ₹{eReceived} = ₹{eBalance.toFixed(2)}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div style={styles.field}>
                <label style={styles.fieldLabel}>📝 Notes</label>
                <textarea
                  name="notes" value={editForm.notes} onChange={handleEditChange}
                  placeholder="Koi khas baat..." rows={2}
                  style={{ ...styles.fieldInput, resize: "none" }}
                />
              </div>

              <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
                {saving ? "⏳ Save ho raha hai..." : "💾 Save Karo"}
              </button>
            </div>
          </div>
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
    paddingBottom: "90px",
    fontFamily: "'Segoe UI', sans-serif",
  },
  summaryGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" },
  sCard: { borderRadius: "14px", padding: "14px", color: "white" },
  sLabel: { fontSize: "10px", opacity: 0.85, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" },
  sVal: { fontSize: "20px", fontWeight: "900", letterSpacing: "-0.5px" },
  filterRow: {
    display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px",
    background: "white", padding: "12px 16px", borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  filterLabel: { fontSize: "13px", fontWeight: "700", whiteSpace: "nowrap" },
  filterInput: { border: "2px solid #e5e7eb", borderRadius: "8px", padding: "6px 10px", fontSize: "14px", flex: 1, outline: "none", fontFamily: "inherit" },
  clearBtn: { background: "#fee2e2", color: "#dc2626", border: "none", padding: "6px 10px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontFamily: "inherit" },
  empty: { textAlign: "center", padding: "50px 20px", color: "#6b7280", fontSize: "16px" },
  entryCard: {
    background: "white", borderRadius: "14px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    marginBottom: "10px", overflow: "hidden",
  },
  cardTop: { padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  cardDate: { fontSize: "14px", fontWeight: "800", color: "#1a3a1a" },
  cardWeight: { fontSize: "12px", color: "#6b7280", marginTop: "3px" },
  cardTotal: { fontSize: "20px", fontWeight: "900", color: "#1a3a1a" },
  pendingBadge: { fontSize: "12px", color: "#d97706", background: "#fef3c7", padding: "3px 8px", borderRadius: "6px", fontWeight: "700" },
  balanceBadge: { fontSize: "12px", fontWeight: "700", padding: "2px 8px", borderRadius: "6px", display: "inline-block", marginTop: "3px" },
  actionRow: { display: "flex", gap: "8px", padding: "0 14px 14px" },
  editBtn: {
    flex: 1, background: "#f0fdf4", color: "#166534", border: "2px solid #86efac",
    padding: "10px", borderRadius: "10px", cursor: "pointer",
    fontSize: "13px", fontWeight: "700", fontFamily: "inherit",
  },
  deleteBtn: {
    background: "#fee2e2", color: "#dc2626", border: "2px solid #fca5a5",
    padding: "10px 14px", borderRadius: "10px", cursor: "pointer",
    fontSize: "16px", fontFamily: "inherit",
  },
  // Modal
  modalOverlay: {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.55)", zIndex: 999,
    display: "flex", alignItems: "flex-end", justifyContent: "center",
    backdropFilter: "blur(2px)",
  },
  modal: {
    background: "white", borderRadius: "24px 24px 0 0",
    width: "100%", maxWidth: "480px",
    maxHeight: "90vh", overflow: "hidden",
    display: "flex", flexDirection: "column",
  },
  modalHeader: {
    padding: "20px 20px 16px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    borderBottom: "2px solid #f3f4f6",
    flexShrink: 0,
  },
  modalTitle: { fontSize: "18px", fontWeight: "800", color: "#1a3a1a" },
  closeBtn: {
    background: "#f3f4f6", border: "none", width: "32px", height: "32px",
    borderRadius: "50%", cursor: "pointer", fontSize: "16px", fontFamily: "inherit",
  },
  modalBody: { padding: "16px 20px 30px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  fieldLabel: { fontSize: "13px", fontWeight: "700", color: "#374151" },
  fieldInput: {
    padding: "12px 14px", borderRadius: "10px", border: "2px solid #e5e7eb",
    fontSize: "15px", outline: "none", fontFamily: "inherit",
    width: "100%", boxSizing: "border-box",
  },
  calcBox: {
    background: "#f0fdf4", border: "2px solid #86efac",
    borderRadius: "12px", padding: "12px 14px",
  },
  calcRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  calcVal: { fontSize: "20px", fontWeight: "800", color: "#16a34a" },
  calcHint: { fontSize: "11px", color: "#6b7280", marginTop: "3px" },
  saveBtn: {
    background: "linear-gradient(135deg, #1a3a1a, #2d5a27)",
    color: "white", border: "none", padding: "15px",
    borderRadius: "12px", fontSize: "16px", fontWeight: "700",
    cursor: "pointer", fontFamily: "inherit", marginTop: "4px",
  },
};
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
