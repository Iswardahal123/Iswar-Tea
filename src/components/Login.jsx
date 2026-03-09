import React, { useState } from "react";
import { auth, db, googleProvider } from "../firebase/config";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const saveUserIfNew = async (user) => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        name: user.displayName || "",
        photo: user.photoURL || "",
        isAdmin: false,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (isRegister) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await saveUserIfNew(cred.user);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLogin();
    } catch (err) {
      let msg = err.message;
      if (err.code === "auth/operation-not-allowed") msg = "Firebase mein Email/Password enable karo!";
      else if (err.code === "auth/user-not-found") msg = "Email nahi mila, pehle register karo";
      else if (err.code === "auth/wrong-password") msg = "Password galat hai";
      else if (err.code === "auth/email-already-in-use") msg = "Yeh email pehle se registered hai";
      setError(msg);
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await saveUserIfNew(result.user);
      onLogin();
    } catch (err) {
      setError("Google login failed: " + err.message);
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

        <form onSubmit={handleEmailAuth} style={styles.form}>
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
              placeholder="password"
              style={styles.input}
              required
            />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? "Please wait..." : isRegister ? "Register" : "Login"}
          </button>
        </form>

        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>ya phir</span>
          <div style={styles.dividerLine} />
        </div>

        <button onClick={handleGoogle} disabled={loading} style={styles.googleBtn}>
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            style={{ width: 20, height: 20 }}
          />
          Google se Login Karo
        </button>

        <p style={styles.toggle}>
          {isRegister ? "Pehle se account hai?" : "Naya account?"}{" "}
          <span
            style={styles.link}
            onClick={() => { setIsRegister(!isRegister); setError(""); }}
          >
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
  header: { textAlign: "center", marginBottom: "28px" },
  leaf: { fontSize: "48px" },
  title: { fontSize: "28px", fontWeight: "800", color: "#1a3a1a", margin: "8px 0 4px" },
  subtitle: { color: "#6b7280", fontSize: "14px", margin: 0 },
  form: { display: "flex", flexDirection: "column", gap: "14px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: "700", color: "#374151" },
  input: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "2px solid #e5e7eb",
    fontSize: "15px",
    outline: "none",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
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
    marginTop: "4px",
    fontFamily: "inherit",
    width: "100%",
  },
  error: {
    color: "#dc2626",
    fontSize: "13px",
    background: "#fef2f2",
    padding: "10px 14px",
    borderRadius: "8px",
    borderLeft: "3px solid #dc2626",
    margin: 0,
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: "20px 0",
  },
  dividerLine: { flex: 1, height: "1px", background: "#e5e7eb" },
  dividerText: { fontSize: "12px", color: "#9ca3af", fontWeight: "600", whiteSpace: "nowrap" },
  googleBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    width: "100%",
    padding: "13px",
    borderRadius: "10px",
    border: "2px solid #e5e7eb",
    background: "white",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    fontFamily: "inherit",
    color: "#374151",
  },
  toggle: { textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#6b7280" },
  link: { color: "#2d5a27", fontWeight: "700", cursor: "pointer" },
};
          </button>
        </form>

        {/* Divider */}
        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>ya phir</span>
          <div style={styles.dividerLine} />
        </div>

        {/* Google Login */}
        <button onClick={handleGoogle} disabled={loading} style={styles.googleBtn}>
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            style={{ width: 20, height: 20 }}
          />
          Google se Login Karo
        </button>

        <p style={styles.toggle}>
          {isRegister ? "Pehle se account hai?" : "Naya account?"}{" "}
          <span style={styles.link} onClick={() => { setIsRegister(!isRegister); setError(""); }}>
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
  header: { textAlign: "center", marginBottom: "28px" },
  leaf: { fontSize: "48px" },
  title: { fontSize: "28px", fontWeight: "800", color: "#1a3a1a", margin: "8px 0 4px" },
  subtitle: { color: "#6b7280", fontSize: "14px" },
  form: { display: "flex", flexDirection: "column", gap: "14px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: "700", color: "#374151" },
  input: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "2px solid #e5e7eb",
    fontSize: "15px",
    outline: "none",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
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
    marginTop: "4px",
    fontFamily: "inherit",
  },
  error: {
    color: "#dc2626",
    fontSize: "13px",
    background: "#fef2f2",
    padding: "10px 14px",
    borderRadius: "8px",
    borderLeft: "3px solid #dc2626",
    margin: 0,
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: "20px 0",
  },
  dividerLine: { flex: 1, height: "1px", background: "#e5e7eb" },
  dividerText: { fontSize: "12px", color: "#9ca3af", fontWeight: "600", whiteSpace: "nowrap" },
  googleBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    width: "100%",
    padding: "13px",
    borderRadius: "10px",
    border: "2px solid #e5e7eb",
    background: "white",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    fontFamily: "inherit",
    color: "#374151",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  toggle: { textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#6b7280" },
  link: { color: "#2d5a27", fontWeight: "700", cursor: "pointer" },
};
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

