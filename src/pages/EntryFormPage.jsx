// 📝 EntryFormPage.jsx - Sirf Date + Weight
import React, { useState } from "react";
import { auth, db } from "../firebase/config";
import { collection, addDoc, Timestamp } from "firebase/firestore";

export default function EntryFormPage() {
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
    if (!form.date || !form.weight) {
      setError("Date aur Weight zaroori hai!");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await addDoc(collection(db, "entries"), {
        uid: auth.currentUser.uid,
        date: form.date,
        weight: parseFloat(form.weight),
        rate: 0,
        totalAmount: 0,
        advanceCut: 0,
        amountReceived: 0,
        balanceAmount: 0,
        notes: "",
        createdAt: Timestamp.now(),
      });
      setSuccess(true);
      setForm({ date: today, weight: "" });
    } catch (err) {
      setError("Save nahi hua: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.heading}>🍃 Nayi Patta Entry</h2>
        <p style={styles.hint}>💡 Sirf date aur wajan daalo — baaki details baad mein Records mein edit karo</p>

        {/* Date */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>📅 Tarikh</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            style={styles.input}
          />
        </div>

        {/* Weight */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>⚖️ Patta Wajan (kg)</label>
          <input
            type="number"
            name="weight"
            value={form.weight}
            onChange={handleChange}
            placeholder="Jaise: 150"
            style={styles.input}
          />
        </div>

        {form.weight && (
          <div style={styles.previewBox}>
            <span>⚖️ {parseFloat(form.weight) || 0} kg patta</span>
            <span style={styles.previewDate}>{new Date(form.date).toLocaleDateString("hi-IN", { day: "numeric", month: "long" })}</span>
          </div>
        )}

        {error && <div style={styles.error}>⚠️ {error}</div>}
        {success && <div style={styles.successMsg}>✅ Entry save ho gayi! Records mein jaake edit karo.</div>}

        <button onClick={handleSubmit} disabled={loading} style={styles.submitBtn}>
          {loading ? "⏳ Save ho raha hai..." : "💾 Entry Save Karo"}
        </button>
      </div>
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
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    background: "white",
    borderRadius: "20px",
    padding: "28px 24px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    width: "100%",
    maxWidth: "420px",
  },
  heading: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#1a3a1a",
    margin: 0,
    textAlign: "center",
  },
  hint: {
    fontSize: "12px",
    color: "#6b7280",
    background: "#f9fafb",
    padding: "10px 14px",
    borderRadius: "10px",
    margin: 0,
    lineHeight: "1.5",
    borderLeft: "3px solid #86efac",
  },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "14px", fontWeight: "700", color: "#374151" },
  input: {
    padding: "14px 16px",
    borderRadius: "12px",
    border: "2px solid #e5e7eb",
    fontSize: "16px",
    outline: "none",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  previewBox: {
    background: "#f0fdf4",
    border: "2px solid #86efac",
    borderRadius: "12px",
    padding: "14px 18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "15px",
    fontWeight: "700",
    color: "#166534",
  },
  previewDate: { fontSize: "13px", color: "#6b7280", fontWeight: "600" },
  submitBtn: {
    background: "linear-gradient(135deg, #1a3a1a, #2d5a27)",
    color: "white",
    border: "none",
    padding: "16px",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  error: {
    background: "#fef2f2",
    color: "#dc2626",
    padding: "12px 14px",
    borderRadius: "10px",
    fontSize: "14px",
    borderLeft: "3px solid #dc2626",
  },
  successMsg: {
    background: "#f0fdf4",
    color: "#16a34a",
    padding: "12px 14px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    borderLeft: "3px solid #16a34a",
  },
};
