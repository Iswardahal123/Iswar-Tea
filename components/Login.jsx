// 🍵 Login.jsx
import React, { useState } from "react";
import { auth } from "../firebase/config";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLogin();
    } catch (err) {
      setError(err.message.replace("Firebase:", "").trim());
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.leaf}>🍃</span>
          <h1 style={styles.title}>Chai Bagan</h1>
          <p style={styles.subtitle}>Tea Farm Management</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={styles.input}
              required
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
              required
            />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? "Please wait..." : isRegister ? "Register" : "Login"}
          </button>
        </form>

        <p style={styles.toggle}>
          {isRegister ? "Already have account?" : "New here?"}{" "}
          <span style={styles.link} onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? "Login" : "Register"}
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #1a3a1a 0%, #2d5a27 50%, #4a7c3f 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "'Segoe UI', sans-serif",
  },
  card: {
    background: "rgba(255,255,255,0.97)",
    borderRadius: "24px",
    padding: "40px 36px",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  header: { textAlign: "center", marginBottom: "32px" },
  leaf: { fontSize: "48px" },
  title: { fontSize: "28px", fontWeight: "800", color: "#1a3a1a", margin: "8px 0 4px" },
  subtitle: { color: "#6b7280", fontSize: "14px" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#374151" },
  input: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "2px solid #e5e7eb",
    fontSize: "15px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  btn: {
    background: "linear-gradient(135deg, #2d5a27, #4a7c3f)",
    color: "white",
    border: "none",
    padding: "14px",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "8px",
  },
  error: { color: "#dc2626", fontSize: "13px", background: "#fef2f2", padding: "10px", borderRadius: "8px" },
  toggle: { textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#6b7280" },
  link: { color: "#2d5a27", fontWeight: "700", cursor: "pointer" },
};
