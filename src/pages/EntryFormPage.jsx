// 📝 EntryFormPage.jsx
import React, { useState } from "react";
import { auth, db } from "../firebase/config";
import { collection, addDoc, Timestamp } from "firebase/firestore";

export default function EntryFormPage() {
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    date: today,
    weight: "",
    rate: "",
    advanceCut: "",
    amountReceived: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Auto calculations
  const weight = parseFloat(form.weight) || 0;
  const rate = parseFloat(form.rate) || 0;
  const advanceCut = parseFloat(form.advanceCut) || 0;
  const amountReceived = parseFloat(form.amountReceived) || 0;

  const totalAmount = weight * rate;
  const balanceAmount = totalAmount - advanceCut - amountReceived;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSuccess(false);
  };

  const handleSubmit = async () => {
    if (!form.date || !form.weight || !form.rate) {
      setError("Date, Weight aur Rate zaroori hai!");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await addDoc(collection(db, "entries"), {
        uid: auth.currentUser.uid,
        date: form.date,
        weight: weight,
        rate: rate,
        totalAmount: totalAmount,
        advanceCut: advanceCut,
        amountReceived: amountReceived,
        balanceAmount: balanceAmount,
        notes: form.notes,
        createdAt: Timestamp.now(),
      });
      setSuccess(true);
      setForm({
        date: today,
        weight: "",
        rate: "",
        advanceCut: "",
        amountReceived: "",
        notes: "",
      });
    } catch (err) {
      setError("Save nahi hua: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.formCard}>
        <h2 style={styles.heading}>🍃 Nayi Patta Entry</h2>

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

        {/* Rate */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>💰 Rate (₹ per kg)</label>
          <input
            type="number"
            name="rate"
            value={form.rate}
            onChange={handleChange}
            placeholder="Jaise: 18"
            style={styles.input}
          />
        </div>

        {/* Auto-calculated Total */}
        {totalAmount > 0 && (
          <div style={styles.calcBox}>
            <div style={styles.calcRow}>
              <span>Kul Raqam</span>
              <span style={styles.calcValue}>₹ {totalAmount.toFixed(2)}</span>
            </div>
            <div style={styles.calcHint}>{weight} kg × ₹{rate} = ₹{totalAmount.toFixed(2)}</div>
          </div>
        )}

        {/* Advance Cut */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>✂️ Advance Kata (₹)</label>
          <input
            type="number"
            name="advanceCut"
            value={form.advanceCut}
            onChange={handleChange}
            placeholder="0"
            style={styles.input}
          />
        </div>

        {/* Amount Received */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>💵 Milī Raqam (₹)</label>
          <input
            type="number"
            name="amountReceived"
            value={form.amountReceived}
            onChange={handleChange}
            placeholder="0"
            style={styles.input}
          />
        </div>

        {/* Balance */}
        {totalAmount > 0 && (
          <div style={{
            ...styles.calcBox,
            background: balanceAmount >= 0 ? "#f0fdf4" : "#fef2f2",
            borderColor: balanceAmount >= 0 ? "#86efac" : "#fca5a5",
          }}>
            <div style={styles.calcRow}>
              <span style={{ fontWeight: "800" }}>💳 Baaki Raqam</span>
              <span style={{
                ...styles.calcValue,
                color: balanceAmount >= 0 ? "#16a34a" : "#dc2626",
                fontSize: "22px",
              }}>
                ₹ {balanceAmount.toFixed(2)}
              </span>
            </div>
            <div style={styles.calcHint}>
              ₹{totalAmount.toFixed(2)} - ₹{advanceCut} (advance) - ₹{amountReceived} (mila) = ₹{balanceAmount.toFixed(2)}
            </div>
          </div>
        )}

        {/* Notes */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>📝 Notes (optional)</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Kuch khas baat..."
            rows={3}
            style={{ ...styles.input, resize: "none" }}
          />
        </div>

        {error && <div style={styles.error}>{error}</div>}
        {success && (
          <div style={styles.successMsg}>
            ✅ Entry safaltapoorvak save ho gayi!
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={styles.submitBtn}
        >
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
    paddingBottom: "80px",
    fontFamily: "'Segoe UI', sans-serif",
  },
  formCard: {
    background: "white",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  heading: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#1a3a1a",
    margin: 0,
    textAlign: "center",
    paddingBottom: "12px",
    borderBottom: "2px solid #f0fdf4",
  },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: "700", color: "#374151" },
  input: {
    padding: "12px 14px",
    borderRadius: "10px",
    border: "2px solid #e5e7eb",
    fontSize: "16px",
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.2s",
    width: "100%",
    boxSizing: "border-box",
  },
  calcBox: {
    background: "#f0fdf4",
    border: "2px solid #86efac",
    borderRadius: "12px",
    padding: "14px 16px",
  },
  calcRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  calcValue: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#16a34a",
  },
  calcHint: {
    fontSize: "11px",
    color: "#6b7280",
    marginTop: "4px",
  },
  submitBtn: {
    background: "linear-gradient(135deg, #1a3a1a, #2d5a27)",
    color: "white",
    border: "none",
    padding: "16px",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "8px",
  },
  error: {
    background: "#fef2f2",
    color: "#dc2626",
    padding: "12px",
    borderRadius: "10px",
    fontSize: "14px",
  },
  successMsg: {
    background: "#f0fdf4",
    color: "#16a34a",
    padding: "12px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    textAlign: "center",
  },
};
