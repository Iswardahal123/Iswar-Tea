import React, { useState } from "react";
import { auth, db } from "../firebase/config";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useLang } from "../LanguageContext";

const txt = {
  en: {
    title: "🍃 Add New Entry 🍃",
    hint: "Add date and weight — edit rate later in Records",
    dateLabel: "📅 Date", weightLabel: "⚖️ Weight (kg)",
    weightPh: "e.g. 50 kg", submitBtn: "💾 Save Entry",
    submitting: "⏳ Saving...", successMsg: "✅ Entry saved successfully!",
    errRequired: "Date and weight are required!", errWeight: "Enter a valid weight!",
    errSave: "Could not save: ",
  },
  hi: {
    title: "🍃 नई प्रविष्टि जोड़ें 🍃",
    hint: "तारीख और वजन डालें — दर बाद में रिकॉर्ड में एडिट करें",
    dateLabel: "📅 तारीख", weightLabel: "⚖️ वजन (कि.ग्रा.)",
    weightPh: "जैसे: 50 कि.ग्रा.", submitBtn: "💾 प्रविष्टि सेव करें",
    submitting: "⏳ सेव हो रहा है...", successMsg: "✅ प्रविष्टि सफलतापूर्वक सेव हुई!",
    errRequired: "तारीख और वजन जरूरी है!", errWeight: "सही वजन डालें!",
    errSave: "सेव नहीं हो सका: ",
  },
  ne: {
    title: "🍃 नयाँ प्रविष्टि थप्नुस् 🍃",
    hint: "मिति र तौल दिनुस् — दर पछि रेकर्डमा सम्पादन गर्नुस्",
    dateLabel: "📅 मिति", weightLabel: "⚖️ तौल (कि.ग्रा.)",
    weightPh: "जस्तै: ५० कि.ग्रा.", submitBtn: "💾 प्रविष्टि सुरक्षित गर्नुस्",
    submitting: "⏳ सुरक्षित हुँदैछ...", successMsg: "✅ प्रविष्टि सफलतापूर्वक सुरक्षित भयो!",
    errRequired: "मिति र तौल आवश्यक छ!", errWeight: "सही तौल लेख्नुस्!",
    errSave: "सुरक्षित गर्न सकिएन: ",
  },
  as: {
    title: "🍃 নতুন তথ্য অন্তৰ্ভুক্ত কৰক 🍃",
    hint: "তাৰিখ আৰু ওজন অন্তৰ্ভুক্ত কৰক — হাৰ পিছত তথ্যত সম্পাদনা কৰক",
    dateLabel: "📅 তাৰিখ", weightLabel: "⚖️ ওজন লিখক (কি:গ্ৰা:)",
    weightPh: "যেনে: ৫০ কি:গ্ৰা:", submitBtn: "💾 তথ্য অন্তৰ্ভুক্ত কৰক",
    submitting: "⏳ তথ্য অন্তৰ্ভুক্ত হৈ আছে...", successMsg: "✅ তথ্য সফলভাৱে অন্তৰ্ভুক্ত কৰা হ'ল!",
    errRequired: "তাৰিখ আৰু ওজন লিখা বাধ্যতামূলক!", errWeight: "সঠিক ওজন লিখক!",
    errSave: "অন্তৰ্ভুক্ত কৰিব পৰা নাই: ",
  },
};

export default function EntryFormPage({ user }) {
  const { lang } = useLang();
  const T = txt[lang] || txt.as;
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({ date: today, weight: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSuccess(false); setError("");
  };

  const handleSubmit = async () => {
    if (!form.date || !form.weight) { setError(T.errRequired); return; }
    if (parseFloat(form.weight) <= 0) { setError(T.errWeight); return; }
    setLoading(true); setError("");
    try {
      await addDoc(collection(db, "entries"), {
        uid: (user || auth.currentUser).uid,
        date: form.date, weight: parseFloat(form.weight),
        rate: 0, totalAmount: 0, advanceCut: 0,
        amountReceived: 0, balanceAmount: 0, notes: "",
        createdAt: Timestamp.now(),
      });
      setSuccess(true);
      setForm({ date: today, weight: "" });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) { setError(T.errSave + err.message); }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>{T.title}</h2>
        <p style={styles.hint}>{T.hint}</p>
        {success && <div style={styles.success}>{T.successMsg}</div>}
        {error && <div style={styles.error}>⚠️ {error}</div>}
        <div style={styles.field}>
          <label style={styles.label}>{T.dateLabel}</label>
          <input type="date" name="date" value={form.date} max={today} onChange={handleChange} style={styles.input} />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>{T.weightLabel}</label>
          <input type="number" name="weight" value={form.weight} onChange={handleChange} placeholder={T.weightPh} min="0" style={styles.input} />
        </div>
        <button onClick={handleSubmit} disabled={loading || !form.weight} style={{ ...styles.btn, opacity: loading || !form.weight ? 0.6 : 1 }}>
          {loading ? T.submitting : T.submitBtn}
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "calc(100vh - 120px)", background: "#f0f4f0", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", paddingBottom: "90px", fontFamily: "'Segoe UI', sans-serif" },
  card: { background: "white", borderRadius: "20px", padding: "28px 24px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: "18px" },
  title: { fontSize: "20px", fontWeight: "900", color: "#1a3a1a", margin: 0, textAlign: "center" },
  hint: { fontSize: "12px", color: "#6b7280", background: "#f9fafb", padding: "10px 14px", borderRadius: "10px", margin: 0, lineHeight: "1.5", borderLeft: "3px solid #86efac" },
  success: { background: "#f0fdf4", color: "#16a34a", padding: "12px 14px", borderRadius: "10px", fontSize: "14px", fontWeight: "700", borderLeft: "3px solid #16a34a" },
  error: { background: "#fef2f2", color: "#dc2626", padding: "12px 14px", borderRadius: "10px", fontSize: "14px", fontWeight: "600", borderLeft: "3px solid #dc2626" },
  field: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "14px", fontWeight: "700", color: "#374151" },
  input: { padding: "14px 16px", borderRadius: "12px", border: "2px solid #e5e7eb", fontSize: "16px", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" },
  btn: { background: "linear-gradient(135deg,#1a3a1a,#2d5a27)", color: "white", border: "none", padding: "16px", borderRadius: "12px", fontSize: "16px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit", width: "100%" },
};
