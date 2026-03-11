import React, { useEffect, useState, useCallback } from "react";
import { auth, db } from "../firebase/config";
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { useLang } from "../LanguageContext";
import { useDark } from "../DarkModeContext";

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
    saveBtn: "✅ Save", saving: "⏳ Saving...", locale: "en-IN",
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
    saveBtn: "✅ सेव करें", saving: "⏳ सेव हो रहा है...", locale: "hi-IN",
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
    saveBtn: "✅ सुरक्षित गर्नुस्", saving: "⏳ सुरक्षित हुँदैछ...", locale: "ne-NP",
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
    saveBtn: "✅ সংৰক্ষণ কৰক", saving: "⏳ সংৰক্ষণ হৈ আছে...", locale: "as-IN",
  },
};

export default function EntryViewPage({ user }) {
  const { lang } = useLang();
  const { dark } = useDark();
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

  // Dark mode palette
  const d = {
    bg: dark ? "#0f172a" : "#f8faf8",
    card: dark ? "#1e293b" : "white",
    cardBorder: dark ? "1px solid #334155" : "none",
    shadow: dark ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.06)",
    text: dark ? "#f1f5f9" : "#1a3a1a",
    subtext: dark ? "#94a3b8" : "#6b7280",
    filterBg: dark ? "#1e293b" : "white",
    filterBorder: dark ? "#475569" : "#e5e7eb",
    input: dark ? "#0f172a" : "white",
    inputBorder: dark ? "#475569" : "#e5e7eb",
    inputText: dark ? "#f1f5f9" : "#1a1a1a",
    label: dark ? "#cbd5e1" : "#374151",
    pendingBg: dark ? "#78350f" : "#fef3c7",
    pendingColor: dark ? "#fde68a" : "#d97706",
    editBtnBg: dark ? "#14532d" : "#f0fdf4",
    editBtnColor: dark ? "#86efac" : "#166534",
    editBtnBorder: dark ? "#16a34a" : "#86efac",
    modalBg: dark ? "#1e293b" : "white",
    modalHeader: dark ? "#0f172a" : "#f3f4f6",
    confirmBg: dark ? "#1e293b" : "white",
    cancelBg: dark ? "#334155" : "white",
    cancelColor: dark ? "#f1f5f9" : "#374151",
    cancelBorder: dark ? "#475569" : "#e5e7eb",
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: "60px", color: d.subtext, fontFamily: "'Segoe UI', sans-serif", background: d.bg, minHeight: "100vh" }}>
      <div style={{ fontSize: "36px" }}>🍃</div>
      <p>{T.loading}</p>
    </div>
  );

  return (
    <div style={{ minHeight: "calc(100vh - 120px)", background: d.bg, padding: "16px", paddingBottom: "90px", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Filter */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", background: d.filterBg, padding: "12px 16px", borderRadius: "12px", boxShadow: d.shadow, border: d.cardBorder }}>
        <label style={{ fontSize: "13px", fontWeight: "700", whiteSpace: "nowrap", color: d.text }}>{T.monthLabel}</label>
        <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
          style={{ border: `2px solid ${d.filterBorder}`, borderRadius: "8px", padding: "6px 10px", fontSize: "14px", flex: 1, outline: "none", fontFamily: "inherit", background: d.input, color: d.inputText }} />
        {filterMonth && <button onClick={() => setFilterMonth("")}
          style={{ background: "#fee2e2", color: "#dc2626", border: "none", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontFamily: "inherit" }}>{T.clearBtn}</button>}
      </div>

      {/* Count */}
      <div style={{ fontSize: "12px", color: d.subtext, fontWeight: "600", marginBottom: "12px", paddingLeft: "4px" }}>
        {filterMonth ? T.countMonth(filtered.length) : T.countTotal(filtered.length)}
      </div>

      {/* Entries */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 20px", color: d.subtext, fontSize: "15px" }}>
          <div style={{ fontSize: "40px" }}>🍃</div>
          <p>{T.noData}</p>
          <p style={{ fontSize: "13px", marginTop: "6px" }}>{T.noDataSub}</p>
        </div>
      ) : filtered.map(entry => (
        <div key={entry.id} style={{ background: d.card, borderRadius: "14px", boxShadow: d.shadow, marginBottom: "10px", overflow: "hidden", border: d.cardBorder }}>
          <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "800", color: d.text }}>
                {new Date(entry.date + "T00:00:00").toLocaleDateString(T.locale, { day: "numeric", month: "long", year: "numeric" })}
              </div>
              <div style={{ fontSize: "12px", color: d.subtext, marginTop: "3px" }}>
                {entry.weight} {T.unit}{entry.rate > 0 ? ` @ Rs${entry.rate}${T.per}` : ""}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              {entry.totalAmount > 0
                ? <div style={{ fontSize: "20px", fontWeight: "900", color: d.text }}>Rs {entry.totalAmount.toFixed(0)}</div>
                : <div style={{ fontSize: "12px", color: d.pendingColor, background: d.pendingBg, padding: "3px 8px", borderRadius: "6px", fontWeight: "700" }}>{T.pending}</div>
              }
              {entry.balanceAmount !== undefined && entry.balanceAmount !== 0 && (
                <div style={{ fontSize: "12px", fontWeight: "700", padding: "2px 8px", borderRadius: "6px", display: "inline-block", marginTop: "3px", color: (entry.balanceAmount || 0) >= 0 ? "#16a34a" : "#dc2626", background: (entry.balanceAmount || 0) >= 0 ? (dark ? "#14532d" : "#f0fdf4") : (dark ? "#7f1d1d" : "#fef2f2") }}>
                  {T.baaki} {(entry.balanceAmount || 0).toFixed(0)}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", padding: "0 14px 14px" }}>
            <button onClick={() => openEdit(entry)}
              style={{ flex: 1, background: d.editBtnBg, color: d.editBtnColor, border: `2px solid ${d.editBtnBorder}`, padding: "10px", borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "700", fontFamily: "inherit" }}>
              {T.editBtn}
            </button>
            <button onClick={() => setDeleteId(entry.id)}
              style={{ background: dark ? "#7f1d1d" : "#fee2e2", color: "#dc2626", border: `2px solid ${dark ? "#dc2626" : "#fca5a5"}`, padding: "10px 16px", borderRadius: "10px", cursor: "pointer", fontSize: "16px", fontFamily: "inherit" }}>
              🗑️
            </button>
          </div>
        </div>
      ))}

      {/* DELETE CONFIRM */}
      {deleteId && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.55)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }} onClick={() => setDeleteId(null)}>
          <div style={{ background: d.confirmBg, borderRadius: "20px", padding: "28px 24px", width: "100%", maxWidth: "320px", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.35)", border: d.cardBorder }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: "44px", marginBottom: "12px" }}>🗑️</div>
            <div style={{ fontSize: "18px", fontWeight: "900", color: d.text, marginBottom: "8px" }}>{T.deleteTitle}</div>
            <div style={{ fontSize: "13px", color: d.subtext, marginBottom: "24px", lineHeight: "1.5" }}>{T.deleteMsg}</div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: "13px", borderRadius: "12px", border: `2px solid ${d.cancelBorder}`, background: d.cancelBg, color: d.cancelColor, fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>{T.cancelBtn}</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: "13px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#7f1d1d,#dc2626)", color: "white", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>{T.deleteBtn}</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editEntry && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.55)", zIndex: 999, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setEditEntry(null)}>
          <div style={{ background: d.modalBg, borderRadius: "24px 24px 0 0", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", border: dark ? "1px solid #334155" : "none" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "20px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `2px solid ${dark ? "#334155" : "#f3f4f6"}`, flexShrink: 0 }}>
              <h3 style={{ fontSize: "18px", fontWeight: "800", color: d.text, margin: 0 }}>{T.editTitle}</h3>
              <button onClick={() => setEditEntry(null)} style={{ background: dark ? "#334155" : "#f3f4f6", border: "none", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", fontSize: "14px", fontWeight: "700", fontFamily: "inherit", color: d.text }}>✕</button>
            </div>
            <div style={{ padding: "16px 20px 30px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                { label: T.fDate, name: "date", type: "date" },
                { label: T.fWeight, name: "weight", type: "number", ph: "150" },
                { label: T.fRate, name: "rate", type: "number", ph: "18" },
              ].map(f => (
                <div key={f.name} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "700", color: d.label }}>{f.label}</label>
                  <input type={f.type} name={f.name} value={editForm[f.name]} onChange={handleEditChange} placeholder={f.ph}
                    style={{ padding: "12px 14px", borderRadius: "10px", border: `2px solid ${d.inputBorder}`, fontSize: "15px", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box", background: d.input, color: d.inputText }} />
                </div>
              ))}

              {eTotalAmount > 0 && (
                <div style={{ background: dark ? "#14532d" : "#f0fdf4", border: `2px solid ${dark ? "#16a34a" : "#86efac"}`, borderRadius: "12px", padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: d.label }}>{T.fTotal}</span>
                    <span style={{ fontSize: "20px", fontWeight: "800", color: dark ? "#86efac" : "#16a34a" }}>{eTotalAmount.toFixed(2)} {T.currency}</span>
                  </div>
                  <div style={{ fontSize: "11px", color: d.subtext, marginTop: "3px" }}>{T.calcHint(eWeight, eRate, eTotalAmount.toFixed(2))}</div>
                </div>
              )}

              {[
                { label: T.fAdvCut, name: "advanceCut", ph: "0" },
                { label: T.fReceived, name: "amountReceived", ph: "0" },
              ].map(f => (
                <div key={f.name} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "700", color: d.label }}>{f.label}</label>
                  <input type="number" name={f.name} value={editForm[f.name]} onChange={handleEditChange} placeholder={f.ph}
                    style={{ padding: "12px 14px", borderRadius: "10px", border: `2px solid ${d.inputBorder}`, fontSize: "15px", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box", background: d.input, color: d.inputText }} />
                </div>
              ))}

              {eTotalAmount > 0 && (
                <div style={{ background: eBalance >= 0 ? (dark ? "#14532d" : "#f0fdf4") : (dark ? "#7f1d1d" : "#fef2f2"), border: `2px solid ${eBalance >= 0 ? (dark ? "#16a34a" : "#86efac") : "#fca5a5"}`, borderRadius: "12px", padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: "800", color: d.text }}>{T.fBalance}</span>
                    <span style={{ fontSize: "22px", fontWeight: "900", color: eBalance >= 0 ? "#16a34a" : "#dc2626" }}>{eBalance.toFixed(2)} {T.currency}</span>
                  </div>
                  <div style={{ fontSize: "11px", color: d.subtext, marginTop: "3px" }}>{T.balHint(eTotalAmount.toFixed(0), eAdvance, eReceived, eBalance.toFixed(2))}</div>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: d.label }}>{T.fNotes}</label>
                <textarea name="notes" value={editForm.notes} onChange={handleEditChange} placeholder={T.fNotesPh} rows={2}
                  style={{ padding: "12px 14px", borderRadius: "10px", border: `2px solid ${d.inputBorder}`, fontSize: "15px", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box", resize: "none", background: d.input, color: d.inputText }} />
              </div>

              <button onClick={handleSave} disabled={saving}
                style={{ background: "linear-gradient(135deg,#1a3a1a,#2d5a27)", color: "white", border: "none", padding: "15px", borderRadius: "12px", fontSize: "16px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit", marginTop: "4px" }}>
                {saving ? T.saving : T.saveBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
