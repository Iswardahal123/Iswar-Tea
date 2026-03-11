import React, { useState } from "react";
import { auth, db, googleProvider } from "../firebase/config";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useLang } from "../LanguageContext";

const txt = {
  en: {
    title: "Tea Data Management", sub: "Manage your tea data easily",
    name: "Full Name", namePh: "Your name",
    email: "Email", emailPh: "your@email.com",
    pass: "Password", passPh: "Password",
    lang: "Language",
    loginBtn: "Login", registerBtn: "Create Account",
    waiting: "Please wait...",
    googleBtn: "Continue with Google",
    haveAcc: "Already have an account?", loginLink: "Login",
    noAcc: "Don't have an account?", regLink: "Register",
    or: "or",
    errNotAllowed: "Enable Email/Password in Firebase!",
    errNotFound: "Email not found, please register",
    errWrongPwd: "Wrong password",
    errInUse: "This email is already registered",
    errGoogle: "Google login failed: ",
  },
  hi: {
    title: "चाय बागान", sub: "चाय बाग प्रबंधन",
    name: "पूरा नाम", namePh: "आपका नाम",
    email: "ईमेल", emailPh: "your@email.com",
    pass: "पासवर्ड", passPh: "पासवर्ड",
    lang: "भाषा",
    loginBtn: "लॉगिन करें", registerBtn: "खाता बनाएं",
    waiting: "कृपया प्रतीक्षा करें...",
    googleBtn: "Google से जारी रखें",
    haveAcc: "पहले से खाता है?", loginLink: "लॉगिन करें",
    noAcc: "नया खाता?", regLink: "रजिस्टर करें",
    or: "या",
    errNotAllowed: "Firebase में Email/Password चालू करें!",
    errNotFound: "ईमेल नहीं मिला, पहले रजिस्टर करें",
    errWrongPwd: "पासवर्ड गलत है",
    errInUse: "यह ईमेल पहले से रजिस्टर है",
    errGoogle: "Google लॉगिन विफल: ",
  },
  ne: {
    title: "चिया बगान", sub: "चिया बगान व्यवस्थापन",
    name: "पूरा नाम", namePh: "तपाईंको नाम",
    email: "इमेल", emailPh: "your@email.com",
    pass: "पासवर्ड", passPh: "पासवर्ड",
    lang: "भाषा",
    loginBtn: "लगइन गर्नुस्", registerBtn: "खाता बनाउनुस्",
    waiting: "कृपया प्रतीक्षा गर्नुस्...",
    googleBtn: "Google बाट जारी राख्नुस्",
    haveAcc: "खाता छ?", loginLink: "लगइन गर्नुस्",
    noAcc: "नयाँ खाता?", regLink: "दर्ता गर्नुस्",
    or: "वा",
    errNotAllowed: "Firebase मा Email/Password सक्रिय गर्नुस्!",
    errNotFound: "इमेल फेला परेन, दर्ता गर्नुस्",
    errWrongPwd: "पासवर्ड गलत छ",
    errInUse: "यो इमेल पहिले नै दर्ता भएको छ",
    errGoogle: "Google लगइन असफल: ",
  },
  as: {
    title: "চাহ বাগান", sub: "চাহ বাগান ব্যৱস্থাপনা",
    name: "সম্পূৰ্ণ নাম", namePh: "আপোনাৰ নাম",
    email: "ইমেইল", emailPh: "your@email.com",
    pass: "পাছৱৰ্ড", passPh: "পাছৱৰ্ড",
    lang: "ভাষা",
    loginBtn: "লগইন কৰক", registerBtn: "একাউণ্ট তৈয়াৰ কৰক",
    waiting: "অনুগ্ৰহ কৰি অপেক্ষা কৰক...",
    googleBtn: "Google ৰে অব্যাহত ৰাখক",
    haveAcc: "একাউণ্ট আছে?", loginLink: "লগইন কৰক",
    noAcc: "নতুন একাউণ্ট?", regLink: "পঞ্জীয়ন কৰক",
    or: "অথবা",
    errNotAllowed: "Firebase ত Email/Password সক্ৰিয় কৰক!",
    errNotFound: "ইমেইল পোৱা নগ'ল, পঞ্জীয়ন কৰক",
    errWrongPwd: "পাছৱৰ্ড ভুল হৈছে",
    errInUse: "এই ইমেইল আগতেই পঞ্জীয়িত হৈছে",
    errGoogle: "Google লগইন বিফল: ",
  },
};

export default function Login({ onLogin }) {
  const { setLang } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const selectedLang = "en";
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const T = txt[selectedLang] || txt.as;

  const saveUserIfNew = async (firebaseUser, overrideLang) => {
    const userRef = doc(db, "users", firebaseUser.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || name || "",
        photo: firebaseUser.photoURL || "",
        isAdmin: false,
        language: overrideLang || selectedLang || "as",
        createdAt: new Date().toISOString(),
      });
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      if (isRegister) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        // Save display name
        if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
        await saveUserIfNew(cred.user);
        setLang(selectedLang);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setLang(selectedLang);
      }
      onLogin();
    } catch (err) {
      let msg = err.message;
      if (err.code === "auth/operation-not-allowed") msg = T.errNotAllowed;
      else if (err.code === "auth/user-not-found") msg = T.errNotFound;
      else if (err.code === "auth/wrong-password") msg = T.errWrongPwd;
      else if (err.code === "auth/email-already-in-use") msg = T.errInUse;
      setError(msg);
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true); setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await saveUserIfNew(result.user, "en"); // Google → default English
      setLang("en");
      onLogin();
    } catch (err) {
      setError(T.errGoogle + err.message);
    }
    setLoading(false);
  };

  const switchMode = () => { setIsRegister(!isRegister); setError(""); setName(""); };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        {/* Header */}
        <div style={styles.header}>
          <span style={styles.leaf}>🍃</span>
          <h1 style={styles.title}>{T.title}</h1>
          <p style={styles.subtitle}>{T.sub}</p>
        </div>

        <form onSubmit={handleEmailAuth} style={styles.form}>
          {/* Name — only on register */}
          {isRegister && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>{T.name}</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder={T.namePh} style={styles.input} required />
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>{T.email}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder={T.emailPh} style={styles.input} required />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>{T.pass}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder={T.passPh} style={styles.input} required />
          </div>

          {error && <p style={styles.error}>⚠️ {error}</p>}

          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? T.waiting : isRegister ? T.registerBtn : T.loginBtn}
          </button>
        </form>

        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>{T.or}</span>
          <div style={styles.dividerLine} />
        </div>

        <button onClick={handleGoogle} disabled={loading} style={styles.googleBtn}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: 20, height: 20 }} />
          {T.googleBtn}
        </button>

        <p style={styles.toggle}>
          {isRegister ? T.haveAcc : T.noAcc}{" "}
          <span style={styles.link} onClick={switchMode}>
            {isRegister ? T.loginLink : T.regLink}
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "linear-gradient(135deg,#1a3a1a,#2d5a27,#4a7c3f)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "'Segoe UI', sans-serif" },
  card: { background: "rgba(255,255,255,0.97)", borderRadius: "24px", padding: "36px 28px", width: "100%", maxWidth: "400px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" },
  header: { textAlign: "center", marginBottom: "20px" },
  leaf: { fontSize: "44px" },
  title: { fontSize: "26px", fontWeight: "900", color: "#1a3a1a", margin: "6px 0 2px" },
  subtitle: { color: "#6b7280", fontSize: "13px", margin: 0 },
  form: { display: "flex", flexDirection: "column", gap: "14px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: "700", color: "#374151" },
  input: { padding: "12px 16px", borderRadius: "10px", border: "2px solid #e5e7eb", fontSize: "15px", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" },
  btn: { background: "linear-gradient(135deg,#1a3a1a,#2d5a27)", color: "white", border: "none", padding: "14px", borderRadius: "10px", fontSize: "16px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit", width: "100%" },
  error: { color: "#dc2626", fontSize: "13px", background: "#fef2f2", padding: "10px 14px", borderRadius: "8px", borderLeft: "3px solid #dc2626", margin: 0 },
  divider: { display: "flex", alignItems: "center", gap: "12px", margin: "18px 0" },
  dividerLine: { flex: 1, height: "1px", background: "#e5e7eb" },
  dividerText: { fontSize: "12px", color: "#9ca3af", fontWeight: "600" },
  googleBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", width: "100%", padding: "13px", borderRadius: "10px", border: "2px solid #e5e7eb", background: "white", fontSize: "15px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit", color: "#374151" },
  toggle: { textAlign: "center", marginTop: "18px", fontSize: "14px", color: "#6b7280" },
  link: { color: "#2d5a27", fontWeight: "700", cursor: "pointer" },
};
