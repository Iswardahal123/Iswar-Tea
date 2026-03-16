import React, { useState } from "react";
import { auth, db } from "../firebase/config";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useLang } from "../LanguageContext";
import { useDark } from "../DarkModeContext";

const txt = {
  en: {
    title: "🍃 Add New Entry 🍃",
    hint: "Add date and weight — edit rate later in Records",
    dateLabel: "📅 Date", weightLabel: "⚖️ Weight (kg)",
    weightPh: "e.g. 50 kg", submitBtn: "💾 Save Entry",
    submitting: "⏳ Saving...", successMsg: "✅ Entry saved successfully!",
    errRequired: "Date and weight are required!", errWeight: "Enter a valid weight!",
    errSave: "Could not save: ",
    waterLabel: "💧 Water in leaves?",
    waterYes: "💧 Yes", waterNo: "🌿 No",
  },
  hi: {
    title: "🍃 नई प्रविष्टि जोड़ें 🍃",
    hint: "तारीख और वजन डालें — दर बाद में रिकॉर्ड में एडिट करें",
    dateLabel: "📅 तारीख", weightLabel: "⚖️ वजन (कि.ग्रा.)",
    weightPh: "जैसे: 50 कि.ग्रा.", submitBtn: "💾 प्रविष्टि सेव करें",
    submitting: "⏳ सेव हो रहा है...", successMsg: "✅ प्रविष्टि सफलतापूर्वक सेव हुई!",
    errRequired: "तारीख और वजन जरूरी है!", errWeight: "सही वजन डालें!",
    errSave: "सेव नहीं हो सका: ",
    waterLabel: "💧 पत्तियों में पानी?",
    waterYes: "💧 है", waterNo: "🌿 नहीं",
  },
  ne: {
    title: "🍃 नयाँ प्रविष्टि थप्नुस् 🍃",
    hint: "मिति र तौल दिनुस् — दर पछि रेकर्डमा सम्पादन गर्नुस्",
    dateLabel: "📅 मिति", weightLabel: "⚖️ तौल (कि.ग्रा.)",
    weightPh: "जस्तै: ५० कि.ग्रा.", submitBtn: "💾 प्रविष्टि सुरक्षित गर्नुस्",
    submitting: "⏳ सुरक्षित हुँदैछ...", successMsg: "✅ प्रविष्टि सफलतापूर्वक सुरक्षित भयो!",
    errRequired: "मिति र तौल आवश्यक छ!", errWeight: "सही तौल लेख्नुस्!",
    errSave: "सुरक्षित गर्न सकिएन: ",
    waterLabel: "💧 पातमा पानी?",
    waterYes: "💧 छ", waterNo: "🌿 छैन",
  },
  as: {
    title: "🍃 নতুন তথ্য অন্তৰ্ভুক্ত কৰক 🍃",
    hint: "তাৰিখ আৰু ওজন অন্তৰ্ভুক্ত কৰক — হাৰ পিছত তথ্যত সম্পাদনা কৰক",
    dateLabel: "📅 তাৰিখ", weightLabel: "⚖️ ওজন লিখক (কি:গ্ৰা:)",
    weightPh: "যেনে: ৫০ কি:গ্ৰা:", submitBtn: "💾 তথ্য অন্তৰ্ভুক্ত কৰক",
    submitting: "⏳ তথ্য অন্তৰ্ভুক্ত হৈ আছে...", successMsg: "✅ তথ্য সফলভাৱে অন্তৰ্ভুক্ত কৰা হ'ল!",
    errRequired: "তাৰিখ আৰু ওজন লিখা বাধ্যতামূলক!", errWeight: "সঠিক ওজন লিখক!",
    errSave: "অন্তৰ্ভুক্ত কৰিব পৰা নাই: ",
    waterLabel: "💧 পাতত পানী?",
    waterYes: "💧 আছে", waterNo: "🌿 নাই",
  },
};

export default function EntryFormPage({ user }) {
  const { lang } = useLang();
  const { dark } = useDark();
  const T = txt[lang] || txt.as;
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({ date: today, weight: "", waterStatus: "" });
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
        waterStatus: form.waterStatus || "none",
        createdAt: Timestamp.now(),
      });
      setSuccess(true);
      setForm({ date: today, weight: "", waterStatus: "" });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) { setError(T.errSave + err.message); }
    setLoading(false);
  };

  const d = {
    bg: dark ? "#0f172a" : "#f0f4f0",
    card: dark ? "#1e293b" : "white",
    cardShadow: dark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.08)",
    text: dark ? "#f1f5f9" : "#1a3a1a",
    label: dark ? "#cbd5e1" : "#374151",
    hint: dark ? "#475569" : "#f9fafb",
    hintText: dark ? "#94a3b8" : "#6b7280",
    input: dark ? "#0f172a" : "white",
    inputBorder: dark ? "#475569" : "#e5e7eb",
    inputText: dark ? "#f1f5f9" : "#1a1a1a",
  };

  return (
    <div style={{ minHeight: "calc(100vh - 120px)", background: d.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", paddingBottom: "90px", fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ background: d.card, borderRadius: "20px", padding: "28px 24px", boxShadow: d.cardShadow, width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: "18px" }}>

        <h2 style={{ fontSize: "20px", fontWeight: "900", color: d.text, margin: 0, textAlign: "center" }}>{T.title}</h2>

        <p style={{ fontSize: "12px", color: d.hintText, background: d.hint, padding: "10px 14px", borderRadius: "10px", margin: 0, lineHeight: "1.5", borderLeft: "3px solid #86efac" }}>
          {T.hint}
        </p>

        {success && <div style={{ background: dark ? "#14532d" : "#f0fdf4", color: dark ? "#86efac" : "#16a34a", padding: "12px 14px", borderRadius: "10px", fontSize: "14px", fontWeight: "700", borderLeft: "3px solid #16a34a" }}>{T.successMsg}</div>}
        {error && <div style={{ background: dark ? "#7f1d1d" : "#fef2f2", color: dark ? "#fca5a5" : "#dc2626", padding: "12px 14px", borderRadius: "10px", fontSize: "14px", fontWeight: "600", borderLeft: "3px solid #dc2626" }}>⚠️ {error}</div>}

        {/* DATE */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ fontSize: "14px", fontWeight: "700", color: d.label }}>{T.dateLabel}</label>
          <input type="date" name="date" value={form.date} max={today} onChange={handleChange}
            style={{ padding: "14px 16px", borderRadius: "12px", border: `2px solid ${d.inputBorder}`, fontSize: "16px", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box", background: d.input, color: d.inputText }} />
        </div>

        {/* WATER — 2 big toggle buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ fontSize: "14px", fontWeight: "700", color: d.label }}>{T.waterLabel}</label>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => { setForm(f => ({ ...f, waterStatus: form.waterStatus === "yes" ? "" : "yes" })); setSuccess(false); }}
              style={{
                flex: 1, padding: "14px", borderRadius: "12px", fontSize: "16px", fontWeight: "800",
                fontFamily: "inherit", cursor: "pointer", transition: "all 0.15s",
                border: form.waterStatus === "yes" ? "2.5px solid #0ea5e9" : `2px solid ${d.inputBorder}`,
                background: form.waterStatus === "yes"
                  ? (dark ? "#0c4a6e" : "#e0f2fe")
                  : (dark ? "#0f172a" : "#f9fafb"),
                color: form.waterStatus === "yes"
                  ? (dark ? "#7dd3fa" : "#0369a1")
                  : d.hintText,
                transform: form.waterStatus === "yes" ? "scale(1.03)" : "scale(1)",
              }}>
              {T.waterYes}
            </button>
            <button
              onClick={() => { setForm(f => ({ ...f, waterStatus: form.waterStatus === "no" ? "" : "no" })); setSuccess(false); }}
              style={{
                flex: 1, padding: "14px", borderRadius: "12px", fontSize: "16px", fontWeight: "800",
                fontFamily: "inherit", cursor: "pointer", transition: "all 0.15s",
                border: form.waterStatus === "no" ? "2.5px solid #16a34a" : `2px solid ${d.inputBorder}`,
                background: form.waterStatus === "no"
                  ? (dark ? "#14532d" : "#f0fdf4")
                  : (dark ? "#0f172a" : "#f9fafb"),
                color: form.waterStatus === "no"
                  ? (dark ? "#86efac" : "#16a34a")
                  : d.hintText,
                transform: form.waterStatus === "no" ? "scale(1.03)" : "scale(1)",
              }}>
              {T.waterNo}
            </button>
          </div>
        </div>

        {/* WEIGHT */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ fontSize: "14px", fontWeight: "700", color: d.label }}>{T.weightLabel}</label>
          <input type="number" name="weight" value={form.weight} onChange={handleChange} placeholder={T.weightPh} min="0"
            style={{ padding: "14px 16px", borderRadius: "12px", border: `2px solid ${d.inputBorder}`, fontSize: "16px", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box", background: d.input, color: d.inputText }} />
        </div>

        <button onClick={handleSubmit} disabled={loading || !form.weight}
          style={{ background: "linear-gradient(135deg,#1a3a1a,#2d5a27)", color: "white", border: "none", padding: "16px", borderRadius: "12px", fontSize: "16px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit", width: "100%", opacity: loading || !form.weight ? 0.6 : 1 }}>
          {loading ? T.submitting : T.submitBtn}
        </button>
      </div>
    </div>
  );
}
