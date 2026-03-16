import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase/config";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useLang } from "../LanguageContext";
import { useDark } from "../DarkModeContext";

// 🔑 Apna OpenWeatherMap API key yahan paste karo
const WEATHER_API_KEY = "YOUR_API_KEY_HERE";

// Rain/drizzle/thunderstorm weather codes
const RAIN_CODES = [200,201,202,210,211,212,221,230,231,232,300,301,302,310,311,312,313,314,321,500,501,502,503,504,511,520,521,522,531];

const txt = {
  en: {
    title: "🍃 Add New Entry 🍃",
    hint: "Add date and weight — edit rate later in Records",
    dateLabel: "📅 Date", weightLabel: "⚖️ Weight (kg)",
    weightPh: "e.g. 50 kg", submitBtn: "💾 Save Entry",
    submitting: "⏳ Saving...", successMsg: "✅ Entry saved successfully!",
    errRequired: "Date and weight are required!", errWeight: "Enter a valid weight!",
    errSave: "Could not save: ",
    waterLabel: "💧 Was there water in the leaves?",
    waterNone: "— Select —",
    waterYes: "💧 Yes, water was present",
    waterNo: "🌿 No, leaves were dry",
    weatherChecking: "🌦️ Checking weather...",
    weatherRainAuto: "🌧️ Rain detected! Auto-selected.",
    weatherDryAuto: "☀️ No rain detected.",
    weatherErr: "Could not detect weather — select manually.",
    weatherBtn: "🌦️ Auto-detect Rain",
  },
  hi: {
    title: "🍃 नई प्रविष्टि जोड़ें 🍃",
    hint: "तारीख और वजन डालें — दर बाद में रिकॉर्ड में एडिट करें",
    dateLabel: "📅 तारीख", weightLabel: "⚖️ वजन (कि.ग्रा.)",
    weightPh: "जैसे: 50 कि.ग्रा.", submitBtn: "💾 प्रविष्टि सेव करें",
    submitting: "⏳ सेव हो रहा है...", successMsg: "✅ प्रविष्टि सफलतापूर्वक सेव हुई!",
    errRequired: "तारीख और वजन जरूरी है!", errWeight: "सही वजन डालें!",
    errSave: "सेव नहीं हो सका: ",
    waterLabel: "💧 पत्तियों में पानी था?",
    waterNone: "— चुनें —",
    waterYes: "💧 हाँ, पानी था",
    waterNo: "🌿 नहीं, सूखा था",
    weatherChecking: "🌦️ मौसम जाँच रहे हैं...",
    weatherRainAuto: "🌧️ बारिश मिली! अपने आप चुना।",
    weatherDryAuto: "☀️ बारिश नहीं है।",
    weatherErr: "मौसम पता नहीं चला — खुद चुनें।",
    weatherBtn: "🌦️ बारिश अपने आप पहचानें",
  },
  ne: {
    title: "🍃 नयाँ प्रविष्टि थप्नुस् 🍃",
    hint: "मिति र तौल दिनुस् — दर पछि रेकर्डमा सम्पादन गर्नुस्",
    dateLabel: "📅 मिति", weightLabel: "⚖️ तौल (कि.ग्रा.)",
    weightPh: "जस्तै: ५० कि.ग्रा.", submitBtn: "💾 प्रविष्टि सुरक्षित गर्नुस्",
    submitting: "⏳ सुरक्षित हुँदैछ...", successMsg: "✅ प्रविष्टि सफलतापूर्वक सुरक्षित भयो!",
    errRequired: "मिति र तौल आवश्यक छ!", errWeight: "सही तौल लेख्नुस्!",
    errSave: "सुरक्षित गर्न सकिएन: ",
    waterLabel: "💧 पातमा पानी थियो?",
    waterNone: "— छान्नुस् —",
    waterYes: "💧 हो, पानी थियो",
    waterNo: "🌿 थिएन, सुक्खा थियो",
    weatherChecking: "🌦️ मौसम जाँच्दैछ...",
    weatherRainAuto: "🌧️ वर्षा भेटियो! स्वतः चयन।",
    weatherDryAuto: "☀️ वर्षा छैन।",
    weatherErr: "मौसम थाहा भएन — आफैं छान्नुस्।",
    weatherBtn: "🌦️ वर्षा स्वतः पहिचान",
  },
  as: {
    title: "🍃 নতুন তথ্য অন্তৰ্ভুক্ত কৰক 🍃",
    hint: "তাৰিখ আৰু ওজন অন্তৰ্ভুক্ত কৰক — হাৰ পিছত তথ্যত সম্পাদনা কৰক",
    dateLabel: "📅 তাৰিখ", weightLabel: "⚖️ ওজন লিখক (কি:গ্ৰা:)",
    weightPh: "যেনে: ৫০ কি:গ্ৰা:", submitBtn: "💾 তথ্য অন্তৰ্ভুক্ত কৰক",
    submitting: "⏳ তথ্য অন্তৰ্ভুক্ত হৈ আছে...", successMsg: "✅ তথ্য সফলভাৱে অন্তৰ্ভুক্ত কৰা হ'ল!",
    errRequired: "তাৰিখ আৰু ওজন লিখা বাধ্যতামূলক!", errWeight: "সঠিক ওজন লিখক!",
    errSave: "অন্তৰ্ভুক্ত কৰিব পৰা নাই: ",
    waterLabel: "💧 পাতত পানী আছিল নে?",
    waterNone: "— বাছক —",
    waterYes: "💧 হয়, পানী আছিল",
    waterNo: "🌿 নাই, শুকান আছিল",
    weatherChecking: "🌦️ বতৰ পৰীক্ষা কৰা হৈছে...",
    weatherRainAuto: "🌧️ বৰষুণ ধৰা পৰিল! স্বয়ংক্ৰিয়ভাৱে বাছনি।",
    weatherDryAuto: "☀️ বৰষুণ নাই।",
    weatherErr: "বতৰ ধৰা নগ'ল — নিজে বাছক।",
    weatherBtn: "🌦️ বৰষুণ স্বয়ংক্ৰিয় চিনাক্ত",
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

  // Weather detection states
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherMsg, setWeatherMsg] = useState("");
  const [weatherMsgType, setWeatherMsgType] = useState("info"); // "rain" | "dry" | "error" | "info"

  // Auto-detect on mount
  useEffect(() => {
    detectWeather();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const detectWeather = () => {
    if (!navigator.geolocation) {
      setWeatherMsg(T.weatherErr);
      setWeatherMsgType("error");
      return;
    }
    setWeatherLoading(true);
    setWeatherMsg(T.weatherChecking);
    setWeatherMsgType("info");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}`
          );
          const data = await res.json();
          const code = data.weather?.[0]?.id;
          const isRaining = RAIN_CODES.includes(code);

          if (isRaining) {
            setForm(f => ({ ...f, waterStatus: "yes" }));
            setWeatherMsg(`🌧️ ${data.weather[0].description} — ${T.weatherRainAuto}`);
            setWeatherMsgType("rain");
          } else {
            setForm(f => ({ ...f, waterStatus: "no" }));
            setWeatherMsg(`☀️ ${data.weather[0].description} — ${T.weatherDryAuto}`);
            setWeatherMsgType("dry");
          }
        } catch (e) {
          setWeatherMsg(T.weatherErr);
          setWeatherMsgType("error");
        }
        setWeatherLoading(false);
      },
      () => {
        setWeatherMsg(T.weatherErr);
        setWeatherMsgType("error");
        setWeatherLoading(false);
      },
      { timeout: 8000 }
    );
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSuccess(false); setError("");
    // If user manually changes waterStatus, clear weather msg
    if (e.target.name === "waterStatus") setWeatherMsg("");
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
      setWeatherMsg("");
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

  const waterBorder = form.waterStatus === "yes"
    ? "#38bdf8"
    : form.waterStatus === "no"
    ? "#86efac"
    : d.inputBorder;

  // Weather message box colors
  const weatherColors = {
    rain:  { bg: dark ? "#0c4a6e" : "#e0f2fe", color: dark ? "#7dd3fa" : "#0369a1", border: "#38bdf8" },
    dry:   { bg: dark ? "#14532d" : "#f0fdf4", color: dark ? "#86efac" : "#16a34a", border: "#86efac" },
    error: { bg: dark ? "#7f1d1d" : "#fef2f2", color: dark ? "#fca5a5" : "#dc2626", border: "#fca5a5" },
    info:  { bg: dark ? "#1e293b" : "#f8fafc", color: dark ? "#94a3b8" : "#64748b",  border: "#cbd5e1" },
  };
  const wc = weatherColors[weatherMsgType] || weatherColors.info;

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

        {/* WATER STATUS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label style={{ fontSize: "14px", fontWeight: "700", color: d.label }}>{T.waterLabel}</label>
            {/* Re-detect button */}
            <button onClick={detectWeather} disabled={weatherLoading}
              style={{ fontSize: "11px", fontWeight: "700", background: dark ? "#0c4a6e" : "#e0f2fe", color: dark ? "#7dd3fa" : "#0369a1", border: "none", borderRadius: "8px", padding: "4px 10px", cursor: "pointer", fontFamily: "inherit", opacity: weatherLoading ? 0.6 : 1 }}>
              {weatherLoading ? "..." : T.weatherBtn}
            </button>
          </div>

          {/* Weather status message */}
          {weatherMsg && (
            <div style={{ background: wc.bg, color: wc.color, fontSize: "12px", fontWeight: "700", padding: "8px 12px", borderRadius: "8px", borderLeft: `3px solid ${wc.border}` }}>
              {weatherMsg}
            </div>
          )}

          <select name="waterStatus" value={form.waterStatus} onChange={handleChange}
            style={{ padding: "14px 16px", borderRadius: "12px", border: `2px solid ${waterBorder}`, fontSize: "15px", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box", background: d.input, color: form.waterStatus ? d.inputText : d.hintText, cursor: "pointer", transition: "border-color 0.2s" }}>
            <option value="">{T.waterNone}</option>
            <option value="yes">{T.waterYes}</option>
            <option value="no">{T.waterNo}</option>
          </select>
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
