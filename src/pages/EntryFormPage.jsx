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
    if (!form.date || !form.weight) {
      setError("Date aur Weight daalna zaroori hai!");
      return;
    }
    if (parseFloat(form.weight) <= 0) {
      setError("Wajan sahi daalo!");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await addDoc(collection(db, "entries"), {
        uid: (user || auth.currentUser).uid,
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
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError("Save nahi hua: " + err.message);
    }
    setLoading(false);
  };

  const displayDate = form.date
    ? new Date(form.date + "T00:00:00").toLocaleDateString("hi-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <div style={styles.page}>

      {/* Top Banner */}
      <div style={styles.banner}>
        <div style={styles.bannerIcon}>🍃</div>
        <div>
          <div style={styles.bannerTitle}>Nayi Patta Entry</div>
          <div style={styles.bannerSub}>Aaj ka patta record karo</div>
        </div>
      </div>

      <div style={styles.container}>

        {/* Success */}
        {success && (
          <div style={styles.successBanner}>
            <span style={{ fontSize: "22px" }}>✅</span>
            <div>
              <div style={{ fontWeight: "800", fontSize: "15px" }}>Entry Save Ho Gayi!</div>
              <div style={{ fontSize: "12px", opacity: 0.85, marginTop: "2px" }}>Records tab mein jaake rate aur details edit karo</div>
            </div>
          </div>
        )}

        {/* Date Field */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardIcon}>📅</span>
            <div>
              <div style={styles.cardLabel}>Tarikh</div>
              <div style={styles.cardSub}>Aaj se pehle ki date chuniye</div>
            </div>
          </div>
          <input
            type="date"
            name="date"
            value={form.date}
            max={today}
            onChange={handleChange}
            style={styles.input}
          />
          {form.date && (
            <div style={styles.datePreview}>
              📅 {displayDate}
            </div>
          )}
        </div>

        {/* Weight Field */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardIcon}>⚖️</span>
            <div>
              <div style={styles.cardLabel}>Patta Wajan</div>
              <div style={styles.cardSub}>Kilogram mein daalo</div>
            </div>
          </div>
          <div style={styles.weightInputRow}>
            <input
              type="number"
              name="weight"
              value={form.weight}
              onChange={handleChange}
              placeholder="0"
              min="0"
              style={{ ...styles.input, fontSize: "28px", fontWeight: "800", textAlign: "center", letterSpacing: "-1px" }}
            />
            <div style={styles.kgBadge}>kg</div>
          </div>
          {form.weight > 0 && (
            <div style={styles.weightPreview}>
              <span>⚖️ {parseFloat(form.weight).toFixed(1)} kilogram patta</span>
            </div>
          )}
        </div>

        {/* Summary Preview */}
        {form.weight > 0 && form.date && (
          <div style={styles.summaryCard}>
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>Tarikh</span>
              <span style={styles.summaryVal}>{displayDate}</span>
            </div>
            <div style={styles.summaryDivider} />
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>Wajan</span>
              <span style={{ ...styles.summaryVal, fontSize: "20px", color: "#1a3a1a" }}>{parseFloat(form.weight).toFixed(1)} kg</span>
            </div>
            <div style={styles.summaryNote}>
              💡 Rate baad mein Records mein add karo
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={styles.errorBox}>
            <span style={{ fontSize: "18px" }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || !form.weight}
          style={{
            ...styles.submitBtn,
            opacity: loading || !form.weight ? 0.6 : 1,
            cursor: loading || !form.weight ? "not-allowed" : "pointer",
          }}
        >
          {loading ? (
            <span>⏳ Save ho raha hai...</span>
          ) : (
            <span>💾 Entry Save Karo</span>
          )}
        </button>

        <div style={styles.footerNote}>
          Rate, advance aur baaki details Records tab mein edit kar sakte ho
        </div>

      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "calc(100vh - 60px)", background: "#f0f4f0", fontFamily: "'Segoe UI', sans-serif", paddingBottom: "90px" },
  banner: {
    background: "linear-gradient(135deg, #1a3a1a, #2d5a27, #4a7c3f)",
    padding: "24px 20px 28px",
    display: "flex", alignItems: "center", gap: "14px", color: "white",
  },
  bannerIcon: { fontSize: "44px" },
  bannerTitle: { fontSize: "22px", fontWeight: "900", letterSpacing: "-0.5px" },
  bannerSub: { fontSize: "13px", opacity: 0.8, marginTop: "2px" },
  container: { padding: "16px", display: "flex", flexDirection: "column", gap: "14px", marginTop: "-12px" },
  successBanner: {
    background: "linear-gradient(135deg, #14532d, #16a34a)",
    color: "white", borderRadius: "16px", padding: "16px 18px",
    display: "flex", alignItems: "center", gap: "14px",
    boxShadow: "0 4px 16px rgba(22,163,74,0.3)",
  },
  card: {
    background: "white", borderRadius: "16px", padding: "18px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    display: "flex", flexDirection: "column", gap: "12px",
  },
  cardHeader: { display: "flex", alignItems: "center", gap: "12px" },
  cardIcon: { fontSize: "28px" },
  cardLabel: { fontSize: "15px", fontWeight: "800", color: "#1a3a1a" },
  cardSub: { fontSize: "11px", color: "#9ca3af", marginTop: "1px" },
  input: {
    padding: "14px 16px", borderRadius: "12px",
    border: "2px solid #e5e7eb", fontSize: "16px",
    outline: "none", fontFamily: "inherit",
    width: "100%", boxSizing: "border-box",
    color: "#1a1a1a",
  },
  datePreview: { fontSize: "13px", color: "#166534", fontWeight: "600", background: "#f0fdf4", padding: "8px 12px", borderRadius: "8px" },
  weightInputRow: { position: "relative" },
  kgBadge: {
    position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)",
    fontSize: "18px", fontWeight: "800", color: "#9ca3af",
  },
  weightPreview: { fontSize: "13px", color: "#166534", fontWeight: "600", background: "#f0fdf4", padding: "8px 12px", borderRadius: "8px" },
  summaryCard: {
    background: "white", borderRadius: "16px", padding: "18px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "2px solid #86efac",
  },
  summaryRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" },
  summaryLabel: { fontSize: "13px", color: "#6b7280", fontWeight: "600" },
  summaryVal: { fontSize: "14px", fontWeight: "700", color: "#374151", textAlign: "right", maxWidth: "200px" },
  summaryDivider: { height: "1px", background: "#f3f4f6", margin: "8px 0" },
  summaryNote: { fontSize: "12px", color: "#d97706", marginTop: "10px", fontWeight: "600" },
  errorBox: {
    background: "#fef2f2", color: "#dc2626", padding: "14px 16px",
    borderRadius: "12px", fontSize: "14px", fontWeight: "600",
    display: "flex", alignItems: "center", gap: "10px",
    borderLeft: "4px solid #dc2626",
  },
  submitBtn: {
    background: "linear-gradient(135deg, #1a3a1a, #2d5a27)",
    color: "white", border: "none", padding: "18px",
    borderRadius: "14px", fontSize: "17px", fontWeight: "800",
    fontFamily: "inherit", width: "100%",
    boxShadow: "0 4px 16px rgba(26,58,26,0.3)",
  },
  footerNote: { textAlign: "center", fontSize: "12px", color: "#9ca3af", paddingBottom: "8px" },
};
