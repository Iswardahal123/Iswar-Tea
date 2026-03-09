import React, { useState } from "react";
import { auth, db } from "../firebase/config";
import { collection, addDoc, Timestamp } from "firebase/firestore";

export default function EntryFormPage({ user }) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({ date: today, weight: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSuccess(false);
    setError("");
  };

  const handleSubmit = async () => {
    if (!form.date || !form.weight) { setError("তাৰিখ আৰু ওজন লিখা বাধ্যতামূলক!"); return; }
    if (parseFloat(form.weight) <= 0) { setError("সঠিক ওজন লিখক!"); return; }
    setLoading(true);
    setError("");
    try {
      await addDoc(collection(db, "entries"), {
        uid: (user || auth.currentUser).uid,
        date: form.date,
        weight: parseFloat(form.weight),
        rate: 0, totalAmount: 0, advanceCut: 0,
        amountReceived: 0, balanceAmount: 0, notes: "",
        createdAt: Timestamp.now(),
      });
      setSuccess(true);
      setForm({ date: today, weight: "" });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError("অন্তৰ্ভুক্ত কৰিব পৰা নাই: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>🍃 নতুন তথ্য অন্তৰ্ভুক্ত কৰক 🍃</h2>
        <p style={styles.hint}>তাৰিখ আৰু ওজন অন্তৰ্ভুক্ত কৰক </p>

        {success && (
          <div style={styles.success}>✅ তথ্য সফলভাৱে অন্তৰ্ভুক্ত কৰা হ'ল!</div>
        )}
        {error && (
          <div style={styles.error}>⚠️ {error}</div>
        )}

        <div style={styles.field}>
          <label style={styles.label}>📅 তাৰিখ</label>
          <input
            type="date"
            name="date"
            value={form.date}
            max={today}
            onChange={handleChange}
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>⚖️ ওজন লিখক (কি:গ্ৰা:)</label>
          <input
            type="number"
            name="weight"
            value={form.weight}
            onChange={handleChange}
            placeholder="যেনে: ৫০ কি:গ্ৰা:"
            min="0"
            style={styles.input}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !form.weight}
          style={{ ...styles.btn, opacity: loading || !form.weight ? 0.6 : 1 }}
        >
          {loading ? "⏳ তথ্য অন্তৰ্ভুক্ত হৈ আছে..." : "💾 তথ্য অন্তৰ্ভুক্ত কৰক"}
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
  btn: { background: "linear-gradient(135deg, #1a3a1a, #2d5a27)", color: "white", border: "none", padding: "16px", borderRadius: "12px", fontSize: "16px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit", width: "100%" },
};
