import React, { useEffect, useState, useCallback } from "react";
import { auth, db } from "../firebase/config";
import {
  collection, query, where, getDocs,
  deleteDoc, doc, updateDoc
} from "firebase/firestore";

export default function EntryViewPage({ user }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState("");
  const [editEntry, setEditEntry] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = user || auth.currentUser;
      if (!currentUser) { setLoading(false); return; }
      const q = query(
        collection(db, "entries"),
        where("uid", "==", currentUser.uid)
      );
      const snap = await getDocs(q);
      setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Fetch error:", err);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const filtered = filterMonth
    ? entries.filter((e) => e.date && e.date.startsWith(filterMonth))
    : entries;

  const totalWeight   = filtered.reduce((s, e) => s + (e.weight || 0), 0);
  const totalEarned   = filtered.reduce((s, e) => s + (e.totalAmount || 0), 0);
  const totalReceived = filtered.reduce((s, e) => s + (e.amountReceived || 0), 0);
  const totalBalance  = filtered.reduce((s, e) => s + (e.balanceAmount || 0), 0);

  const handleDelete = async (id) => {
    if (!window.confirm("Yeh entry delete karni hai?")) return;
    await deleteDoc(doc(db, "entries", id));
    fetchEntries();
  };

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
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const eWeight = parseFloat(editForm.weight) || 0;
  const eRate = parseFloat(editForm.rate) || 0;
  const eTotalAmount = eWeight * eRate;
  const eAdvance = parseFloat(editForm.advanceCut) || 0;
  const eReceived = parseFloat(editForm.amountReceived) || 0;
  const eBalance = eTotalAmount - eAdvance - eReceived;

  const handleSave = async () => {
    if (!editEntry) return;
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
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px", color: "#6b7280", fontFamily: "Segoe UI, sans-serif" }}>
        <div style={{ fontSize: "36px" }}>🍃</div>
        <p>Load ho raha hai...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Summary */}
      <div style={styles.summaryGrid}>
        <div style={{ ...styles.sCard, background: "linear-gradient(135deg,#1a3a1a,#2d5a27)" }}>
          <div style={styles.sLabel}>Kul Wajan</div>
          <div style={styles.sVal}>{totalWeight.toFixed(1)} kg</div>
        </div>
        <div style={{ ...styles.sCard, background: "linear-gradient(135deg,#1e40af,#3b82f6)" }}>
          <div style={styles.sLabel}>Kul Kamai</div>
          <div style={styles.sVal}>Rs{totalEarned.toFixed(0)}</div>
        </div>
        <div style={{ ...styles.sCard, background: "linear-gradient(135deg,#92400e,#d97706)" }}>
          <div style={styles.sLabel}>Mili Raqam</div>
          <div style={styles.sVal}>Rs{totalReceived.toFixed(0)}</div>
        </div>
        <div style={{ ...styles.sCard, background: totalBalance >= 0 ? "linear-gradient(135deg,#14532d,#16a34a)" : "linear-gradient(135deg,#7f1d1d,#dc2626)" }}>
          <div style={styles.sLabel}>Baaki Bacha</div>
          <div style={styles.sVal}>Rs{totalBalance.toFixed(0)}</div>
        </div>
      </div>

      {/* Filter */}
      <div style={styles.filterRow}>
        <label style={styles.filterLabel}>Month:</label>
        <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} style={styles.filterInput} />
        {filterMonth && <button onClick={() => setFilterMonth("")} style={styles.clearBtn}>Clear</button>}
      </div>

      {/* Entries */}
      {filtered.length === 0 ? (
        <div style={styles.empty}>
          <p>Koi entry nahi mili</p>
          <p style={{ fontSize: "13px", color: "#9ca3af", marginTop: "6px" }}>Entry tab se patta add karo</p>
        </div>
      ) : (
        <div>
          {filtered.map((entry) => (
            <div key={entry.id} style={styles.entryCard}>
              <div style={styles.cardTop}>
                <div>
                  <div style={styles.cardDate}>
                    {new Date(entry.date).toLocaleDateString("hi-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                  <div style={styles.cardWeight}>
                    {entry.weight} kg{entry.rate > 0 ? " @ Rs" + entry.rate + "/kg" : ""}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {entry.totalAmount > 0 ? (
                    <div style={styles.cardTotal}>Rs{entry.totalAmount.toFixed(0)}</div>
                  ) : (
                    <div style={styles.pendingBadge}>Rate pending</div>
                  )}
                  {entry.balanceAmount !== 0 && (
                    <div style={{
                      ...styles.balanceBadge,
                      color: (entry.balanceAmount || 0) >= 0 ? "#16a34a" : "#dc2626",
                      background: (entry.balanceAmount || 0) >= 0 ? "#f0fdf4" : "#fef2f2",
                    }}>
                      Baaki: Rs{(entry.balanceAmount || 0).toFixed(0)}
                    </div>
                  )}
                </div>
              </div>
              <div style={styles.actionRow}>
                <button onClick={() => openEdit(entry)} style={styles.editBtn}>Edit / Details</button>
                <button onClick={() => handleDelete(entry.id)} style={styles.deleteBtn}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editEntry && (
        <div style={styles.modalOverlay} onClick={() => setEditEntry(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Entry Edit Karo</h3>
              <button onClick={() => setEditEntry(null)} style={styles.closeBtn}>X</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.field}>
                <label style={styles.fieldLabel}>Tarikh</label>
                <input type="date" name="date" value={editForm.date} onChange={handleEditChange} style={styles.fieldInput} />
              </div>
              <div style={styles.field}>
                <label style={styles.fieldLabel}>Wajan (kg)</label>
                <input type="number" name="weight" value={editForm.weight} onChange={handleEditChange} placeholder="150" style={styles.fieldInput} />
              </div>
              <div style={styles.field}>
                <label style={styles.fieldLabel}>Rate (Rs/kg)</label>
                <input type="number" name="rate" value={editForm.rate} onChange={handleEditChange} placeholder="18" style={styles.fieldInput} />
              </div>
              {eTotalAmount > 0 && (
                <div style={styles.calcBox}>
                  <div style={styles.calcRow}>
                    <span>Kul Raqam</span>
                    <span style={styles.calcVal}>Rs {eTotalAmount.toFixed(2)}</span>
                  </div>
                  <div style={styles.calcHint}>{eWeight} x Rs{eRate} = Rs{eTotalAmount.toFixed(2)}</div>
                </div>
              )}
              <div style={styles.field}>
                <label style={styles.fieldLabel}>Advance Kata (Rs)</label>
                <input type="number" name="advanceCut" value={editForm.advanceCut} onChange={handleEditChange} placeholder="0" style={styles.fieldInput} />
              </div>
              <div style={styles.field}>
                <label style={styles.fieldLabel}>Mili Raqam (Rs)</label>
                <input type="number" name="amountReceived" value={editForm.amountReceived} onChange={handleEditChange} placeholder="0" style={styles.fieldInput} />
              </div>
              {eTotalAmount > 0 && (
                <div style={{ ...styles.calcBox, background: eBalance >= 0 ? "#f0fdf4" : "#fef2f2", borderColor: eBalance >= 0 ? "#86efac" : "#fca5a5" }}>
                  <div style={styles.calcRow}>
                    <span style={{ fontWeight: "800" }}>Baaki Raqam</span>
                    <span style={{ fontSize: "22px", fontWeight: "900", color: eBalance >= 0 ? "#16a34a" : "#dc2626" }}>
                      Rs {eBalance.toFixed(2)}
                    </span>
                  </div>
                  <div style={styles.calcHint}>Rs{eTotalAmount.toFixed(0)} - Rs{eAdvance} - Rs{eReceived} = Rs{eBalance.toFixed(2)}</div>
                </div>
              )}
              <div style={styles.field}>
                <label style={styles.fieldLabel}>Notes</label>
                <textarea name="notes" value={editForm.notes} onChange={handleEditChange} placeholder="Koi khas baat..." rows={2} style={{ ...styles.fieldInput, resize: "none" }} />
              </div>
              <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
                {saving ? "Save ho raha hai..." : "Save Karo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { minHeight: "calc(100vh - 120px)", background: "#f8faf8", padding: "16px", paddingBottom: "90px", fontFamily: "Segoe UI, sans-serif" },
  summaryGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" },
  sCard: { borderRadius: "14px", padding: "14px", color: "white" },
  sLabel: { fontSize: "10px", opacity: 0.85, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" },
  sVal: { fontSize: "20px", fontWeight: "900", letterSpacing: "-0.5px" },
  filterRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px", background: "white", padding: "12px 16px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
  filterLabel: { fontSize: "13px", fontWeight: "700", whiteSpace: "nowrap" },
  filterInput: { border: "2px solid #e5e7eb", borderRadius: "8px", padding: "6px 10px", fontSize: "14px", flex: 1, outline: "none", fontFamily: "inherit" },
  clearBtn: { background: "#fee2e2", color: "#dc2626", border: "none", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontFamily: "inherit" },
  empty: { textAlign: "center", padding: "50px 20px", color: "#6b7280", fontSize: "16px" },
  entryCard: { background: "white", borderRadius: "14px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: "10px", overflow: "hidden" },
  cardTop: { padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  cardDate: { fontSize: "14px", fontWeight: "800", color: "#1a3a1a" },
  cardWeight: { fontSize: "12px", color: "#6b7280", marginTop: "3px" },
  cardTotal: { fontSize: "20px", fontWeight: "900", color: "#1a3a1a" },
  pendingBadge: { fontSize: "12px", color: "#d97706", background: "#fef3c7", padding: "3px 8px", borderRadius: "6px", fontWeight: "700" },
  balanceBadge: { fontSize: "12px", fontWeight: "700", padding: "2px 8px", borderRadius: "6px", display: "inline-block", marginTop: "3px" },
  actionRow: { display: "flex", gap: "8px", padding: "0 14px 14px" },
  editBtn: { flex: 1, background: "#f0fdf4", color: "#166534", border: "2px solid #86efac", padding: "10px", borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "700", fontFamily: "inherit" },
  deleteBtn: { background: "#fee2e2", color: "#dc2626", border: "2px solid #fca5a5", padding: "10px 16px", borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "700", fontFamily: "inherit" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.55)", zIndex: 999, display: "flex", alignItems: "flex-end", justifyContent: "center" },
  modal: { background: "white", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" },
  modalHeader: { padding: "20px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #f3f4f6", flexShrink: 0 },
  modalTitle: { fontSize: "18px", fontWeight: "800", color: "#1a3a1a" },
  closeBtn: { background: "#f3f4f6", border: "none", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", fontSize: "14px", fontWeight: "700", fontFamily: "inherit" },
  modalBody: { padding: "16px 20px 30px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  fieldLabel: { fontSize: "13px", fontWeight: "700", color: "#374151" },
  fieldInput: { padding: "12px 14px", borderRadius: "10px", border: "2px solid #e5e7eb", fontSize: "15px", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" },
  calcBox: { background: "#f0fdf4", border: "2px solid #86efac", borderRadius: "12px", padding: "12px 14px" },
  calcRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  calcVal: { fontSize: "20px", fontWeight: "800", color: "#16a34a" },
  calcHint: { fontSize: "11px", color: "#6b7280", marginTop: "3px" },
  saveBtn: { background: "linear-gradient(135deg, #1a3a1a, #2d5a27)", color: "white", border: "none", padding: "15px", borderRadius: "12px", fontSize: "16px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit", marginTop: "4px" },
};
