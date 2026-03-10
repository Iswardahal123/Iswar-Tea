import React, { useEffect, useState, useCallback } from "react";
import { auth, db } from "../firebase/config";
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { useLang } from "../LanguageContext";

const txt = {
  en: {
    loading: "Please wait...", monthLabel: "📅 Month:", clearBtn: "Clear",
    countTotal: (n) => `${n} entries total`, countMonth: (n) => `${n} entries this month`,
    noData: "No entries found", noDataSub: "Add new entry from Entry tab",
    pending: "Rate Pending", baaki: "Bal: Rs",
    editBtn: "✏️ Edit / Details", deleteTitle: "Delete Entry?",
    deleteMsg: "This entry will be permanently deleted!",
    cancelBtn: "Cancel", deleteBtn: "Yes, Delete",
    editTitle: "✏️ Edit Entry",
    fDate: "Date", fWeight: "Weight (kg)", fRate: "Rate (Rs/kg)",
    fTotal: "Total Amount", fAdvCut: "Advance Cut (Rs)", fReceived: "Amount Received (Rs)",
    fBalance: "Balance Amount", fNotes: "Notes", fNotesPh: "Any special note...",
    calcHint: (w,r,t) => `${w} x ${r} = ${t}`,
    balHint: (t,a,r,b) => `${t} - ${a} - ${r} = ${b}`,
    currency: "Rs", unit: "kg", per: "/kg",
    saveBtn: "✅ Save", saving: "⏳ Saving...",
    locale: "en-IN",
  },
  hi: {
    loading: "कृपया प्रतीक्षा करें...", monthLabel: "📅 महिना:", clearBtn: "हटाएं",
    countTotal: (n) => `${n} प्रविष्टियां कुल`, countMonth: (n) => `${n} इस महीने`,
    noData: "कोई प्रविष्टि नहीं मिली", noDataSub: "प्रविष्टि टैब से नई प्रविष्टि जोड़ें",
    pending: "दर बाकी", baaki: "बाकी: Rs",
    editBtn: "✏️ एडिट / विवरण", deleteTitle: "प्रविष्टि हटाएं?",
    deleteMsg: "यह प्रविष्टि हमेशा के लिए हट जाएगी!",
    cancelBtn: "रद्द करें", deleteBtn: "हां, हटाएं",
    editTitle: "✏️ प्रविष्टि एडिट करें",
    fDate: "तारीख", fWeight: "वजन (कि.ग्रा.)", fRate: "दर (Rs/कि.ग्रा.)",
    fTotal: "कुल राशि", fAdvCut: "अग्रिम काटा (Rs)", fReceived: "मिली राशि (Rs)",
    fBalance: "बाकी राशि", fNotes: "नोट्स", fNotesPh: "कोई खास बात...",
    calcHint: (w,r,t) => `${w} x ${r} = ${t}`,
    balHint: (t,a,r,b) => `${t} - ${a} - ${r} = ${b}`,
    currency: "Rs", unit: "कि.ग्रा.", per: "/कि.ग्रा.",
    saveBtn: "✅ सेव करें", saving: "⏳ सेव हो रहा है...",
    locale: "hi-IN",
  },
  ne: {
    loading: "कृपया प्रतीक्षा गर्नुस्...", monthLabel: "📅 महिना:", clearBtn: "हटाउनुस्",
    countTotal: (n) => `${n} वटा प्रविष्टि जम्मा`, countMonth: (n) => `${n} यो महिना`,
    noData: "कुनै प्रविष्टि फेला परेन", noDataSub: "प्रविष्टि ट्याबबाट थप्नुस्",
    pending: "दर बाँकी", baaki: "बाँकी: Rs",
    editBtn: "✏️ सम्पादन / विवरण", deleteTitle: "प्रविष्टि मेट्ने?",
    deleteMsg: "यो प्रविष्टि सधैंका लागि मेटिनेछ!",
    cancelBtn: "रद्द गर्नुस्", deleteBtn: "हो, मेट्नुस्",
    editTitle: "✏️ प्रविष्टि सम्पादन गर्नुस्",
    fDate: "मिति", fWeight: "तौल (कि.ग्रा.)", fRate: "दर (Rs/कि.ग्रा.)",
    fTotal: "कुल रकम", fAdvCut: "अग्रिम काटिएको (Rs)", fReceived: "पाएको रकम (Rs)",
    fBalance: "बाँकी रकम", fNotes: "टिप्पणी", fNotesPh: "कुनै विशेष कुरा...",
    calcHint: (w,r,t) => `${w} x ${r} = ${t}`,
    balHint: (t,a,r,b) => `${t} - ${a} - ${r} = ${b}`,
    currency: "Rs", unit: "कि.ग्रा.", per: "/कि.ग्रा.",
    saveBtn: "✅ सुरक्षित गर्नुस्", saving: "⏳ सुरक्षित हुँदैछ...",
    locale: "ne-NP",
  },
  as: {
    loading: "অনুগ্ৰহ কৰি অপেক্ষা কৰক...", monthLabel: "📅 মাহ:", clearBtn: "বাতিল",
    countTotal: (n) => `${n} টা তথ্য মুঠ`, countMonth: (n) => `${n} টা তথ্য এই মাহত`,
    noData: "কোনো তথ্য পোৱা নগ'ল", noDataSub: "তথ্য টেবৰ পৰা নতুন তথ্য যোগ কৰক",
    pending: "হিচাব কৰা হোৱা নাই", baaki: "বাকী: Rs",
    editBtn: "✏️ সম্পাদনা / বিৱৰণ", deleteTitle: "তথ্য মচি পেলাব নে?",
    deleteMsg: "এই তথ্য মচি দিয়াৰ পাছত ঘূৰাই নাপাব!",
    cancelBtn: "বাতিল কৰক", deleteBtn: "হয়, মচক",
    editTitle: "✏️ তথ্য সম্পাদনা কৰক",
    fDate: "তাৰিখ", fWeight: "ওজন (কি:গ্ৰা:)", fRate: "হাৰ (টকা/কি:গ্ৰা:)",
    fTotal: "মুঠ পৰিমাণ", fAdvCut: "এডভান্স কটা (টকা)", fReceived: "পোৱা পৰিমাণ (টকা)",
    fBalance: "বাকী পৰিমাণ", fNotes: "টোকা", fNotesPh: "কোনো বিশেষ কথা...",
    calcHint: (w,r,t) => `${w} x ${r} = ${t} টকা`,
    balHint: (t,a,r,b) => `${t} - ${a} - ${r} = ${b} টকা`,
    currency: "টকা", unit: "কি:গ্ৰা:", per: "/কি:গ্ৰা:",
    saveBtn: "✅ সংৰক্ষণ কৰক", saving: "⏳ সংৰক্ষণ হৈ আছে...",
    locale: "as-IN",
  },
};

export default function EntryViewPage({ user }) {
  const { lang } = useLang();
  const T = txt[lang] || txt.as;

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState("");
  const [editEntry, setEditEntry] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = user || auth.currentUser;
      if (!currentUser) { setLoading(false); return; }
      const snap = await getDocs(query(collection(db, "entries"), where("uid", "==", currentUser.uid)));
      setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const filtered = filterMonth ? entries.filter(e => e.date?.startsWith(filterMonth)) : entries;

  const handleDelete = async () => {
    await deleteDoc(doc(db, "entries", deleteId));
    setDeleteId(null); fetchEntries();
  };

  const openEdit = (entry) => {
    setEditEntry(entry);
    setEditForm({
      date: entry.date || "", weight: entry.weight || "", rate: entry.rate || "",
      advanceCut: entry.advanceCut || "", amountReceived: entry.amountReceived || "",
      notes: entry.notes || "",
    });
  };

  const handleEditChange = (e) => setEditForm(p => ({ ...p, [e.target.name]: e.target.value }));

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
        date: editForm.date, weight: eWeight, rate: eRate,
        totalAmount: eTotalAmount, advanceCut: eAdvance,
        amountReceived: eReceived, balanceAmount: eBalance, notes: editForm.notes,
      });
      setEditEntry(null); fetchEntries();
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: "60px", color: "#6b7280", fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ fontSize: "36px" }}>🍃</div>
      <p>{T.loading}</p>
    </div>
  );

  return (
    <div style={styles.container}>

      {/* Filter */}
      <div style={styles.filterRow}>
        <label style={styles.filterLabel}>{T.monthLabel}</label>
        <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={styles.filterInput} />
        {filterMonth && <button onClick={() => setFilterMonth("")} style={styles.clearBtn}>{T.clearBtn}</button>}
      </div>

      {/* Count */}
      <div style={styles.countRow}>
        {filterMonth ? T.countMonth(filtered.length) : T.countTotal(filtered.length)}
      </div>

      {/* Entries */}
      {filtered.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: "40px" }}>🍃</div>
          <p>{T.noData}</p>
          <p style={{ fontSize: "13px", color: "#9ca3af", marginTop: "6px" }}>{T.noDataSub}</p>
        </div>
      ) : (
        filtered.map(entry => (
          <div key={entry.id} style={styles.entryCard}>
            <div style={styles.cardTop}>
              <div>
                <div style={styles.cardDate}>
                  {new Date(entry.date + "T00:00:00").toLocaleDateString(T.locale, { day: "numeric", month: "long", year: "numeric" })}
                </div>
                <div style={styles.cardWeight}>
                  {entry.weight} {T.unit}{entry.rate > 0 ? ` @ Rs${entry.rate}${T.per}` : ""}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                {entry.totalAmount > 0
                  ? <div style={styles.cardTotal}>Rs {entry.totalAmount.toFixed(0)}</div>
                  : <div style={styles.pendingBadge}>{T.pending}</div>
                }
                {entry.balanceAmount !== undefined && entry.balanceAmount !== 0 && (
                  <div style={{
                    ...styles.balanceBadge,
                    color: (entry.balanceAmount || 0) >= 0 ? "#16a34a" : "#dc2626",
                    background: (entry.balanceAmount || 0) >= 0 ? "#f0fdf4" : "#fef2f2",
                  }}>
                    {T.baaki} {(entry.balanceAmount || 0).toFixed(0)}
                  </div>
                )}
              </div>
            </div>
            <div style={styles.actionRow}>
              <button onClick={() => openEdit(entry)} style={styles.editBtn}>{T.editBtn}</button>
              <button onClick={() => setDeleteId(entry.id)} style={styles.deleteBtn}>🗑️</button>
            </div>
          </div>
        ))
      )}

      {/* DELETE CONFIRM */}
      {deleteId && (
        <div style={styles.overlay} onClick={() => setDeleteId(null)}>
          <div style={styles.confirmBox} onClick={e => e.stopPropagation()}>
            <div style={styles.confirmIcon}>🗑️</div>
            <div style={styles.confirmTitle}>{T.deleteTitle}</div>
            <div style={styles.confirmMsg}>{T.deleteMsg}</div>
            <div style={styles.confirmBtns}>
              <button onClick={() => setDeleteId(null)} style={styles.cancelBtn}>{T.cancelBtn}</button>
              <button onClick={handleDelete} style={styles.confirmDeleteBtn}>{T.deleteBtn}</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editEntry && (
        <div style={styles.overlay} onClick={() => setEditEntry(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{T.editTitle}</h3>
              <button onClick={() => setEditEntry(null)} style={styles.closeBtn}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.field}>
                <label style={styles.fieldLabel}>{T.fDate}</label>
                <input type="date" name="date" value={editForm.date} onChange={handleEditChange} style={styles.fieldInput} />
              </div>
              <div style={styles.field}>
                <label style={styles.fieldLabel}>{T.fWeight}</label>
                <input type="number" name="weight" value={editForm.weight} onChange={handleEditChange} placeholder="150" style={styles.fieldInput} />
              </div>
              <div style={styles.field}>
                <label style={styles.fieldLabel}>{T.fRate}</label>
                <input type="number" name="rate" value={editForm.rate} onChange={handleEditChange} placeholder="18" style={styles.fieldInput} />
              </div>
              {eTotalAmount > 0 && (
                <div style={styles.calcBox}>
                  <div style={styles.calcRow}>
                    <span>{T.fTotal}</span>
                    <span style={styles.calcVal}>{eTotalAmount.toFixed(2)} {T.currency}</span>
                  </div>
                  <div style={styles.calcHint}>{T.calcHint(eWeight, eRate, eTotalAmount.toFixed(2))}</div>
                </div>
              )}
              <div style={styles.field}>
                <label style={styles.fieldLabel}>{T.fAdvCut}</label>
                <input type="number" name="advanceCut" value={editForm.advanceCut} onChange={handleEditChange} placeholder="0" style={styles.fieldInput} />
              </div>
              <div style={styles.field}>
                <label style={styles.fieldLabel}>{T.fReceived}</label>
                <input type="number" name="amountReceived" value={editForm.amountReceived} onChange={handleEditChange} placeholder="0" style={styles.fieldInput} />
              </div>
              {eTotalAmount > 0 && (
                <div style={{ ...styles.calcBox, background: eBalance >= 0 ? "#f0fdf4" : "#fef2f2", borderColor: eBalance >= 0 ? "#86efac" : "#fca5a5" }}>
                  <div style={styles.calcRow}>
                    <span style={{ fontWeight: "800" }}>{T.fBalance}</span>
                    <span style={{ fontSize: "22px", fontWeight: "900", color: eBalance >= 0 ? "#16a34a" : "#dc2626" }}>
                      {eBalance.toFixed(2)} {T.currency}
                    </span>
                  </div>
                  <div style={styles.calcHint}>{T.balHint(eTotalAmount.toFixed(0), eAdvance, eReceived, eBalance.toFixed(2))}</div>
                </div>
              )}
              <div style={styles.field}>
                <label style={styles.fieldLabel}>{T.fNotes}</label>
                <textarea name="notes" value={editForm.notes} onChange={handleEditChange} placeholder={T.fNotesPh} rows={2} style={{ ...styles.fieldInput, resize: "none" }} />
              </div>
              <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
                {saving ? T.saving : T.saveBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { minHeight: "calc(100vh - 120px)", background: "#f8faf8", padding: "16px", paddingBottom: "90px", fontFamily: "'Segoe UI', sans-serif" },
  filterRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", background: "white", padding: "12px 16px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
  filterLabel: { fontSize: "13px", fontWeight: "700", whiteSpace: "nowrap" },
  filterInput: { border: "2px solid #e5e7eb", borderRadius: "8px", padding: "6px 10px", fontSize: "14px", flex: 1, outline: "none", fontFamily: "inherit" },
  clearBtn: { background: "#fee2e2", color: "#dc2626", border: "none", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontFamily: "inherit" },
  countRow: { fontSize: "12px", color: "#6b7280", fontWeight: "600", marginBottom: "12px", paddingLeft: "4px" },
  empty: { textAlign: "center", padding: "50px 20px", color: "#6b7280", fontSize: "15px" },
  entryCard: { background: "white", borderRadius: "14px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: "10px", overflow: "hidden" },
  cardTop: { padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  cardDate: { fontSize: "14px", fontWeight: "800", color: "#1a3a1a" },
  cardWeight: { fontSize: "12px", color: "#6b7280", marginTop: "3px" },
  cardTotal: { fontSize: "20px", fontWeight: "900", color: "#1a3a1a" },
  pendingBadge: { fontSize: "12px", color: "#d97706", background: "#fef3c7", padding: "3px 8px", borderRadius: "6px", fontWeight: "700" },
  balanceBadge: { fontSize: "12px", fontWeight: "700", padding: "2px 8px", borderRadius: "6px", display: "inline-block", marginTop: "3px" },
  actionRow: { display: "flex", gap: "8px", padding: "0 14px 14px" },
  editBtn: { flex: 1, background: "#f0fdf4", color: "#166534", border: "2px solid #86efac", padding: "10px", borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "700", fontFamily: "inherit" },
  deleteBtn: { background: "#fee2e2", color: "#dc2626", border: "2px solid #fca5a5", padding: "10px 16px", borderRadius: "10px", cursor: "pointer", fontSize: "16px", fontFamily: "inherit" },
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.55)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" },
  confirmBox: { background: "white", borderRadius: "20px", padding: "28px 24px", width: "100%", maxWidth: "320px", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" },
  confirmIcon: { fontSize: "44px", marginBottom: "12px" },
  confirmTitle: { fontSize: "18px", fontWeight: "900", color: "#1a1a1a", marginBottom: "8px" },
  confirmMsg: { fontSize: "13px", color: "#6b7280", marginBottom: "24px", lineHeight: "1.5" },
  confirmBtns: { display: "flex", gap: "10px" },
  cancelBtn: { flex: 1, padding: "13px", borderRadius: "12px", border: "2px solid #e5e7eb", background: "white", color: "#374151", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" },
  confirmDeleteBtn: { flex: 1, padding: "13px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#7f1d1d,#dc2626)", color: "white", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" },
  modal: { background: "white", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)" },
  modalHeader: { padding: "20px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #f3f4f6", flexShrink: 0 },
  modalTitle: { fontSize: "18px", fontWeight: "800", color: "#1a3a1a", margin: 0 },
  closeBtn: { background: "#f3f4f6", border: "none", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", fontSize: "14px", fontWeight: "700", fontFamily: "inherit" },
  modalBody: { padding: "16px 20px 30px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  fieldLabel: { fontSize: "13px", fontWeight: "700", color: "#374151" },
  fieldInput: { padding: "12px 14px", borderRadius: "10px", border: "2px solid #e5e7eb", fontSize: "15px", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" },
  calcBox: { background: "#f0fdf4", border: "2px solid #86efac", borderRadius: "12px", padding: "12px 14px" },
  calcRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  calcVal: { fontSize: "20px", fontWeight: "800", color: "#16a34a" },
  calcHint: { fontSize: "11px", color: "#6b7280", marginTop: "3px" },
  saveBtn: { background: "linear-gradient(135deg,#1a3a1a,#2d5a27)", color: "white", border: "none", padding: "15px", borderRadius: "12px", fontSize: "16px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit", marginTop: "4px" },
};
