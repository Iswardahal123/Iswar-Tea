import React, { useState, useRef, useEffect, useCallback } from "react";
import { auth, db } from "../firebase/config";
import { collection, query, where, getDocs, doc, getDoc, orderBy, serverTimestamp, addDoc, deleteDoc } from "firebase/firestore";
import { useLang } from "../LanguageContext";
import { useDark } from "../DarkModeContext";

const DEFAULT_MODEL = "google/gemma-3-27b-it:free";

const getFertilizerPlan = (bigha) => {
  const b = parseFloat(bigha) || 1;
  return {
    urea:  +(7.5 * b).toFixed(1),
    dap:   +(10  * b).toFixed(1),
    mop:   +(4   * b).toFixed(1),
    mgso4: +(2.5 * b).toFixed(1),
    zinc:  +(1   * b).toFixed(1),
    neem:  +(2.5 * b).toFixed(1),
    vermi: b <= 1 ? "1 trolley" : b <= 2 ? "2 trolley" : `${Math.ceil(b)} trolley`,
  };
};

const weeklySchedule = [
  { month: 1, week: 1, items: [], note_hi: "कोई खाद नहीं - मिट्टी की हल्की गुड़ाई करें", note_as: "কোনো সাৰ নাই - মাটি পাতলকৈ খান্দিব" },
  { month: 1, week: 2, items: [], note_hi: "ड्रेनेज सिस्टम चेक करें", note_as: "পানী নিষ্কাশন পৰীক্ষা কৰিব" },
  { month: 1, week: 3, items: [], note_hi: "खराब पत्ते हटाएं", note_as: "বেয়া পাত আতৰাব" },
  { month: 1, week: 4, items: [], note_hi: "अगले सीज़न की तैयारी करें", note_as: "পৰৱৰ্তী মৌসুমৰ প্ৰস্তুতি কৰিব" },
  { month: 2, week: 1, items: [], note_hi: "पुरानी शाखाओं की हल्की छंटाई करें", note_as: "পুৰণি ডালৰ পাতল ছাঁটনি কৰিব" },
  { month: 2, week: 2, items: [], note_hi: "मिट्टी परीक्षण करवाएं", note_as: "মাটি পৰীক্ষা কৰাব" },
  { month: 2, week: 3, items: [], note_hi: "कोई खाद नहीं - आराम का समय", note_as: "কোনো সাৰ নাই - জিৰণিৰ সময়" },
  { month: 2, week: 4, items: [], note_hi: "मार्च के लिए वर्मीकम्पोस्ट तैयार रखें", note_as: "মাৰ্চৰ বাবে কেঁচুসাৰ সাজু কৰিব" },
  { month: 3, week: 1, items: ["mitti"], note_hi: "मिट्टी की गहरी गुड़ाई करें", note_as: "মাটি গভীৰকৈ খান্দিব" },
  { month: 3, week: 2, items: ["vermi"], note_hi: "वर्मीकम्पोस्ट / गोबर खाद डालें", note_as: "কেঁচুসাৰ / গোবৰ সাৰ দিব" },
  { month: 3, week: 3, items: ["dap"],   note_hi: "DAP डालें - शाम को, पानी दें", note_as: "DAP দিব - গধুলি, পানী দিব" },
  { month: 3, week: 4, items: ["zinc"],  note_hi: "जिंक सल्फेट डालें", note_as: "জিংক ছালফেট দিব" },
  { month: 4, week: 1, items: [],        note_hi: "DAP absorb होने दें - कुछ नहीं", note_as: "DAP শোষণ হবলৈ দিব" },
  { month: 4, week: 2, items: ["pest"],  note_hi: "कीट जांच + नीम ऑयल स्प्रे 5ml/ltr", note_as: "পোক পৰীক্ষা + নিম তেল স্প্ৰে ৫মিলি/লিটাৰ" },
  { month: 4, week: 3, items: ["urea","mop"], note_hi: "यूरिया + MOP मिलाकर डालें (शाम को)", note_as: "ইউৰিয়া + MOP মিহলাই দিব (গধুলি)" },
  { month: 4, week: 4, items: ["mgso4"], note_hi: "MgSO4 डालें - पत्ते हरे होंगे", note_as: "MgSO4 দিব - পাত সেউজীয়া হব" },
  { month: 5, week: 1, items: [],        note_hi: "खराब पत्तों की कटाई करें", note_as: "বেয়া পাত কাটিব" },
  { month: 5, week: 2, items: ["urea"],  note_hi: "यूरिया डालें - गर्मी में शाम को", note_as: "ইউৰিয়া দিব - গৰমত গধুলি দিব" },
  { month: 5, week: 3, items: ["neem"],  note_hi: "नीम केक डालें", note_as: "নিম কেক দিব" },
  { month: 5, week: 4, items: [],        note_hi: "पानी का ख्याल रखें - गर्मी ज्यादा है", note_as: "পানীৰ যত্ন লওক - গৰম বেছি" },
  { month: 6, week: 1, items: ["dap"],   note_hi: "DAP डालें - बारिश से पहले", note_as: "DAP দিব - বৰষুণৰ আগতে" },
  { month: 6, week: 2, items: ["zinc"],  note_hi: "जिंक सल्फेट डालें", note_as: "জিংক ছালফেট দিব" },
  { month: 6, week: 3, items: [],        note_hi: "ड्रेनेज ठीक करें - बारिश आने वाली है", note_as: "পানী নিষ্কাশন ঠিক কৰিব - বৰষুণ আহিব" },
  { month: 6, week: 4, items: ["urea","mop"], note_hi: "यूरिया + MOP मिलाकर डालें", note_as: "ইউৰিয়া + MOP মিহলাই দিব" },
  { month: 7, week: 1, items: ["mgso4"], note_hi: "MgSO4 डालें", note_as: "MgSO4 দিব" },
  { month: 7, week: 2, items: ["fungicide"], note_hi: "फंगीसाइड स्प्रे करें - बरसात में जरूरी", note_as: "ভেঁকুৰনাশক স্প্ৰে কৰিব - বৰষুণত জৰুৰী" },
  { month: 7, week: 3, items: ["urea"],  note_hi: "यूरिया डालें", note_as: "ইউৰিয়া দিব" },
  { month: 7, week: 4, items: [],        note_hi: "खराब शाखाएं हटाएं", note_as: "বেয়া ডাল আতৰাব" },
  { month: 8, week: 1, items: ["dap"],   note_hi: "DAP डालें - सबसे अच्छा महीना", note_as: "DAP দিব - সৰ্বোত্তম মাহ" },
  { month: 8, week: 2, items: ["mop"],   note_hi: "MOP डालें", note_as: "MOP দিব" },
  { month: 8, week: 3, items: ["urea"],  note_hi: "यूरिया डालें - अधिकतम उत्पादन", note_as: "ইউৰিয়া দিব - সৰ্বাধিক উৎপাদন" },
  { month: 8, week: 4, items: ["mgso4"], note_hi: "MgSO4 डालें + कटाई का समय", note_as: "MgSO4 দিব + চপোৱাৰ সময়" },
  { month: 9, week: 1, items: ["urea","mop"], note_hi: "यूरिया + MOP मिलाकर डालें", note_as: "ইউৰিয়া + MOP মিহলাই দিব" },
  { month: 9, week: 2, items: [],        note_hi: "मिट्टी परीक्षण करवाएं", note_as: "মাটি পৰীক্ষা কৰাব" },
  { month: 9, week: 3, items: ["zinc"],  note_hi: "जिंक सल्फेट डालें", note_as: "জিংক ছালফেট দিব" },
  { month: 9, week: 4, items: [],        note_hi: "हल्की छंटाई करें", note_as: "পাতল ছাঁটনি কৰিব" },
  { month: 10, week: 1, items: ["dap"],  note_hi: "DAP - आखिरी डोज़", note_as: "DAP - শেষ মাত্ৰা" },
  { month: 10, week: 2, items: ["neem"], note_hi: "नीम केक डालें", note_as: "নিম কেক দিব" },
  { month: 10, week: 3, items: ["mgso4"],note_hi: "MgSO4 - आखिरी बूस्ट", note_as: "MgSO4 - শেষ বৃদ্ধি" },
  { month: 10, week: 4, items: [],       note_hi: "कोई खाद नहीं - आराम शुरू", note_as: "কোনো সাৰ নাই - জিৰণি আৰম্ভ" },
  { month: 11, week: 1, items: ["vermi"],note_hi: "गोबर खाद / वर्मीकम्पोस्ट डालें", note_as: "গোবৰ সাৰ / কেঁচুসাৰ দিব" },
  { month: 11, week: 2, items: [],       note_hi: "गहरी गुड़ाई करें", note_as: "গভীৰকৈ মাটি খান্দিব" },
  { month: 11, week: 3, items: [],       note_hi: "पुरानी शाखाएं काटें", note_as: "পুৰণি ডালবোৰ কাটিব" },
  { month: 11, week: 4, items: [],       note_hi: "अगले साल की योजना बनाएं", note_as: "পৰৱৰ্তী বছৰৰ পৰিকল্পনা কৰিব" },
  { month: 12, week: 1, items: [],       note_hi: "कोई रासायनिक खाद नहीं", note_as: "কোনো ৰাসায়নিক সাৰ নাই" },
  { month: 12, week: 2, items: [],       note_hi: "मिट्टी स्वास्थ्य जांच करें", note_as: "মাটিৰ স্বাস্থ্য পৰীক্ষা কৰিব" },
  { month: 12, week: 3, items: [],       note_hi: "ड्रेनेज सुधारें", note_as: "পানী নিষ্কাশন উন্নত কৰিব" },
  { month: 12, week: 4, items: [],       note_hi: "मार्च के लिए तैयारी शुरू करें", note_as: "মাৰ্চৰ বাবে প্ৰস্তুতি আৰম্ভ কৰিব" },
];

const MONTH_NAMES_HI = ["","जनवरी","फरवरी","मार्च","अप्रैल","मई","जून","जुलाई","अगस्त","सितंबर","अक्टूबर","नवंबर","दिसंबर"];
const MONTH_NAMES_AS = ["","জানুৱাৰী","ফেব্ৰুৱাৰী","মাৰ্চ","এপ্ৰিল","মে'","জুন","জুলাই","আগষ্ট","ছেপ্টেম্বৰ","অক্টোবৰ","নৱেম্বৰ","ডিচেম্বৰ"];

const getWeekOfMonth = () => Math.ceil(new Date().getDate() / 7);
const getCurrentWeekSchedule = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const week = Math.min(getWeekOfMonth(), 4);
  return weeklySchedule.find(s => s.month === month && s.week === week) || null;
};
const getNextWeekSchedule = () => {
  const now = new Date();
  let month = now.getMonth() + 1;
  let week = Math.min(getWeekOfMonth(), 4) + 1;
  if (week > 4) { week = 1; month = month === 12 ? 1 : month + 1; }
  return weeklySchedule.find(s => s.month === month && s.week === week) || null;
};

const itemLabel = (item, lang, qty) => {
  const labels = {
    urea: { hi: "यूरिया", as: "ইউৰিয়া" },
    dap:  { hi: "DAP", as: "DAP" },
    mop:  { hi: "MOP", as: "MOP" },
    mgso4:{ hi: "MgSO4", as: "MgSO4" },
    zinc: { hi: "जिंक सल्फेट", as: "জিংক ছালফেট" },
    neem: { hi: "नीम केक", as: "নিম কেক" },
    vermi:{ hi: "वर्मीकम्पोस्ट", as: "কেঁচুসাৰ" },
    fungicide: { hi: "फंगीसाइड", as: "ভেঁকুৰনাশক" },
    pest: { hi: "नीम ऑयल", as: "নিম তেল" },
    mitti:{ hi: "गहरी गुड़ाई", as: "গভীৰকৈ মাটি খান্দিব" },
  };
  const name = labels[item]?.[lang] || item;
  if (qty && !["fungicide","pest","mitti"].includes(item)) return `${name} ${qty}`;
  return name;
};

const buildSystemPrompt = (entries, bigha, L) => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const week = Math.min(getWeekOfMonth(), 4);
  const currSched = getCurrentWeekSchedule();
  const nextSched = getNextWeekSchedule();
  const plan = bigha ? getFertilizerPlan(bigha) : null;
  const totalWeight = entries.reduce((s, e) => s + (e.weight || 0), 0);
  const totalAmount = entries.reduce((s, e) => s + (e.totalAmount || 0), 0);
  const totalBalance = entries.reduce((s, e) => s + (e.balanceAmount || 0), 0);
  const totalReceived = entries.reduce((s, e) => s + (e.amountReceived || 0), 0);
  const thisMonthStr = now.toISOString().slice(0, 7);
  const monthEntries = entries.filter(e => e.date && e.date.startsWith(thisMonthStr));
  const monthWeight = monthEntries.reduce((s, e) => s + (e.weight || 0), 0);
  const monthAmount = monthEntries.reduce((s, e) => s + (e.totalAmount || 0), 0);
  const sorted = [...entries].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const recent = sorted.slice(0, 5).map(e =>
    `${e.date}: ${e.weight}kg @ Rs${e.rate || "?"}, Total=Rs${e.totalAmount}, Received=Rs${e.amountReceived}, Balance=Rs${e.balanceAmount}`
  ).join("; ");

  return `You are an expert AI assistant for Iswar Tea Garden app, helping Assam tea farmers.
You assist with: fertilizer planning, financial tracking, garden care, pest management.

DATE: ${now.toLocaleDateString("en-IN", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
MONTH: ${month}, WEEK: ${week}

RESPOND IN: ${L === "hi" ? "Hindi" : "Assamese"} (use emojis for readability, keep answers concise)

FARM: ${bigha ? `${bigha} bigha` : "Not set (ask if needed for exact qty)"}
${plan ? `FERTILIZER PER APPLICATION: Urea=${plan.urea}kg, DAP=${plan.dap}kg, MOP=${plan.mop}kg, MgSO4=${plan.mgso4}kg, Zinc=${plan.zinc}kg, Neem=${plan.neem}kg, Vermi=${plan.vermi}` : ""}

THIS WEEK: ${currSched ? (L === "hi" ? currSched.note_hi : currSched.note_as) : "N/A"} | Items: ${currSched?.items?.join(", ") || "none"}
NEXT WEEK: ${nextSched ? (L === "hi" ? nextSched.note_hi : nextSched.note_as) : "N/A"} | Items: ${nextSched?.items?.join(", ") || "none"}

FINANCIALS: Entries=${entries.length}, Weight=${totalWeight.toFixed(1)}kg, Earned=Rs${totalAmount}, Received=Rs${totalReceived}, Balance=Rs${totalBalance}
THIS MONTH: ${monthEntries.length} entries, ${monthWeight.toFixed(1)}kg, Rs${monthAmount}
RECENT: ${recent || "none"}

RULES: Never mix Urea+DAP. Apply evening only. Water after fertilizer. 15-20 days gap between DAP and Urea.`;
};

// ── Time format helper ──────────────────────────────────────────────────────
const formatTime = (ts) => {
  if (!ts) return "";
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
};

// ── Date separator helper ───────────────────────────────────────────────────
const formatDateLabel = (ts) => {
  if (!ts) return "";
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

// ── Render formatted AI reply (bold, bullet points) ─────────────────────────
const FormattedText = ({ text, color }) => {
  const lines = text.split("\n");
  return (
    <div style={{ fontSize: "13.5px", lineHeight: "1.75", color }}>
      {lines.map((line, i) => {
        // Bold: **text**
        const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={j}>{part.slice(2, -2)}</strong>;
          }
          return part;
        });
        // Bullet: lines starting with - or •
        const isBullet = /^[-•]\s/.test(line.trim());
        return (
          <div key={i} style={{
            marginBottom: lines.length > 1 ? "3px" : 0,
            paddingLeft: isBullet ? "4px" : 0,
            display: "flex",
            gap: isBullet ? "6px" : 0,
          }}>
            {isBullet && <span style={{ color: "#4ade80", flexShrink: 0, marginTop: "1px" }}>●</span>}
            <span>{parts}</span>
          </div>
        );
      })}
    </div>
  );
};

export default function AIChatPage({ user }) {
  const { lang } = useLang();
  const { dark } = useDark();
  const L = (lang === "hi" || lang === "en") ? "hi" : "as";

  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [input, setInput] = useState("");
  const [entries, setEntries] = useState([]);
  const [typing, setTyping] = useState(false);
  const [bigha, setBigha] = useState(null);
  const [aiConfig, setAiConfig] = useState({ apiKey: "", modelId: DEFAULT_MODEL });
  const [loadingChat, setLoadingChat] = useState(true);
  const [showQuickBtns, setShowQuickBtns] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // ── Colors ─────────────────────────────────────────────────────────────────
  const c = {
    // WhatsApp-like wallpaper bg
    bg:           dark ? "#0b141a" : "#e5ddd5",
    // Header bar
    header:       dark ? "#1f2c34" : "#075e54",
    headerText:   "#ffffff",
    // Chat bubbles
    userBubble:   dark ? "#005c4b" : "#dcf8c6",
    userText:     dark ? "#e9edef" : "#111b21",
    botBubble:    dark ? "#1f2c34" : "#ffffff",
    botText:      dark ? "#e9edef" : "#111b21",
    timeTxt:      dark ? "#8696a0" : "#667781",
    // Input bar
    inputBar:     dark ? "#1f2c34" : "#f0f2f5",
    inputBg:      dark ? "#2a3942" : "#ffffff",
    inputText:    dark ? "#d1d7db" : "#111b21",
    inputBorder:  "transparent",
    sendBtn:      "#00a884",
    // Quick buttons bar
    quickBar:     dark ? "#1f2c34" : "#f0f2f5",
    quickBtn:     dark ? "#2a3942" : "#ffffff",
    quickBtnBorder: dark ? "#3b4a54" : "#d1d7db",
    quickBtnText: dark ? "#00a884" : "#075e54",
    // Date separator
    dateSep:      dark ? "#182229" : "#e1f3fb",
    dateSepText:  dark ? "#8696a0" : "#667781",
    // Error
    errBubble:    dark ? "#3d1a1a" : "#fef2f2",
    errText:      "#ef4444",
    // Weekly alert
    alertBg:      dark ? "#1a2f1a" : "#dcf8c6",
    alertBorder:  dark ? "#25d366" : "#128c7e",
    alertText:    dark ? "#25d366" : "#075e54",
  };

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadAiConfig = useCallback(async () => {
    try {
      const snap = await getDoc(doc(db, "config", "ai_settings"));
      if (snap.exists()) {
        const d = snap.data();
        setAiConfig({ apiKey: d.apiKey || "", modelId: d.modelId || DEFAULT_MODEL });
      }
    } catch (e) { console.error(e); }
  }, []);

  const loadEntries = useCallback(async () => {
    try {
      const cu = user || auth.currentUser;
      if (!cu) return;
      const snap = await getDocs(query(collection(db, "entries"), where("uid", "==", cu.uid)));
      setEntries(snap.docs.map(d => d.data()));
    } catch (e) { console.error(e); }
  }, [user]);

  const loadChatHistory = useCallback(async () => {
    try {
      const cu = user || auth.currentUser;
      if (!cu) { setLoadingChat(false); return; }

      let snap;
      try {
        snap = await getDocs(
          query(collection(db, "ai_chats"), where("uid", "==", cu.uid), orderBy("createdAt", "asc"))
        );
      } catch {
        snap = await getDocs(
          query(collection(db, "ai_chats"), where("uid", "==", cu.uid))
        );
      }

      if (!snap.empty) {
        const savedMsgs = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const aT = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
            const bT = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
            return aT - bT;
          });

        const uiMsgs = savedMsgs.map(m => ({
          role: m.role === "assistant" ? "bot" : m.role,
          text: m.text,
          isError: false,
          ts: m.createdAt,
        }));

        const apiHist = savedMsgs.map(m => ({
          role: m.role,
          content: m.text,
        }));

        setMessages(uiMsgs);
        setChatHistory(apiHist);

        const bighaMsg = savedMsgs.find(m => m.bigha);
        if (bighaMsg) setBigha(bighaMsg.bigha);
      }
    } catch (e) {
      console.error("Chat load error:", e);
    }
    setLoadingChat(false);
  }, [user]);

  const saveMsgToDb = useCallback(async (role, text, extraData = {}) => {
    try {
      const cu = user || auth.currentUser;
      if (!cu) return;
      await addDoc(collection(db, "ai_chats"), {
        uid: cu.uid,
        role,
        text,
        createdAt: serverTimestamp(),
        ...extraData,
      });
    } catch (e) { console.error("Chat save error:", e); }
  }, [user]);

  const clearChat = useCallback(async () => {
    if (!window.confirm(L === "hi" ? "पूरी chat delete करें?" : "সম্পূৰ্ণ chat মচিব?")) return;
    try {
      const cu = user || auth.currentUser;
      if (!cu) return;
      const snap = await getDocs(query(collection(db, "ai_chats"), where("uid", "==", cu.uid)));
      await Promise.all(snap.docs.map(d => deleteDoc(doc(db, "ai_chats", d.id))));
    } catch (e) { console.error(e); }
    setMessages([]);
    setChatHistory([]);
    setBigha(null);
  }, [user, L]);

  useEffect(() => { loadEntries(); loadAiConfig(); loadChatHistory(); }, [loadEntries, loadAiConfig, loadChatHistory]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (loadingChat) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "calc(100vh - 120px)", background: c.bg }}>
      <div style={{ fontSize: "40px", marginBottom: "12px" }}>🍃</div>
      <div style={{ fontSize: "14px", color: c.timeTxt, fontFamily: "'Segoe UI', sans-serif" }}>
        {L === "hi" ? "Chat load हो रहा है..." : "Chat লোড হৈ আছে..."}
      </div>
    </div>
  );

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || typing) return;
    setInput("");
    setShowQuickBtns(false);
    inputRef.current?.focus();

    const bighaMatch = msg.match(/(\d+(\.\d+)?)\s*(बिघा|bigha|বিঘা)/i);
    let curBigha = bigha;
    if (bighaMatch) { curBigha = parseFloat(bighaMatch[1]); setBigha(curBigha); }

    const now = new Date();
    const newUserMsg = { role: "user", text: msg, ts: now };
    setMessages(p => [...p, newUserMsg]);
    setTyping(true);

    saveMsgToDb("user", msg, curBigha ? { bigha: curBigha } : {});

    try {
      if (!aiConfig.apiKey) throw new Error("NO_KEY");

      const systemPrompt = buildSystemPrompt(entries, curBigha, L);
      let apiMsgs;
      if (chatHistory.length === 0) {
        apiMsgs = [{ role: "user", content: `[INSTRUCTIONS]\n${systemPrompt}\n\n---\n${msg}` }];
      } else {
        const [firstMsg, ...rest] = chatHistory;
        apiMsgs = [
          { role: "user", content: `[INSTRUCTIONS]\n${systemPrompt}\n\n---\n${firstMsg.content}` },
          ...rest,
          { role: "user", content: msg },
        ];
      }

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${aiConfig.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "Iswar Tea Garden AI",
        },
        body: JSON.stringify({
          model: aiConfig.modelId || DEFAULT_MODEL,
          messages: apiMsgs,
          max_tokens: 800,
          temperature: 0.7,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(data?.error || data).slice(0, 200)}`);

      const reply = data.choices?.[0]?.message?.content || "";
      const replyTs = new Date();

      setChatHistory(prev => [...prev,
        { role: "user", content: msg },
        { role: "assistant", content: reply }
      ]);
      saveMsgToDb("assistant", reply);
      setMessages(p => [...p, { role: "bot", text: reply, ts: replyTs }]);

    } catch (err) {
      let errMsg = "";
      if (err.message === "NO_KEY") {
        errMsg = L === "hi"
          ? "⚠️ OpenRouter API key सेट नहीं है। Admin Panel में AI Settings में key डालें।"
          : "⚠️ OpenRouter API key সেট কৰা হোৱা নাই। Admin ৰ AI Settings ত key দিয়ক।";
      } else {
        errMsg = L === "hi"
          ? `⚠️ AI से जवाब नहीं मिला।\n${err.message}\n\nदोबारा कोशिश करें।`
          : `⚠️ AI ৰ পৰা উত্তৰ পোৱা নগ'ল।\n${err.message}\n\nপুনৰ চেষ্টা কৰক।`;
      }
      setMessages(p => [...p, { role: "bot", text: errMsg, isError: true, ts: new Date() }]);
    } finally {
      setTyping(false);
    }
  };

  // ── Quick buttons ──────────────────────────────────────────────────────────
  const quickBtns = L === "hi" ? [
    { label: "📅 इस हफ्ते क्या करें", msg: "इस हफ्ते क्या करें?" },
    { label: "🛒 अगले हफ्ते खरीदारी", msg: "अगले हफ्ते क्या खरीदें?" },
    { label: "📊 साल का पूरा plan", msg: "पूरा साल भर का plan बताओ" },
    { label: "🌿 पत्ता कितना निकलेगा", msg: "पत्ता कितना निकलेगा?" },
    { label: "🧪 खाद मिलाने के नियम", msg: "खाद मिलाने के नियम बताओ" },
    { label: "⚠️ Golden Rules", msg: "चाय बागान के golden rules बताओ" },
    { label: "💰 बाकी balance", msg: "मेरा बाकी balance कितना है?" },
    { label: "📋 पूरा financial report", msg: "पूरा financial report दो" },
  ] : [
    { label: "📅 এই সপ্তাহত কি কৰিব", msg: "এই সপ্তাহত কি কৰিব?" },
    { label: "🛒 পৰৱৰ্তী সপ্তাহ কিনাকাটা", msg: "পৰৱৰ্তী সপ্তাহত কি কিনিব?" },
    { label: "📊 বছৰৰ সম্পূৰ্ণ পৰিকল্পনা", msg: "গোটেই বছৰৰ সম্পূৰ্ণ পৰিকল্পনা কওক" },
    { label: "🌿 পাত কিমান ওলাব", msg: "পাত কিমান ওলাব?" },
    { label: "🧪 সাৰ মিহলোৱাৰ নিয়ম", msg: "সাৰ মিহলোৱাৰ নিয়ম কওক" },
    { label: "⚠️ সোণালী নিয়ম", msg: "চাহ বাগানৰ সোণালী নিয়ম কওক" },
    { label: "💰 বাকী balance", msg: "মোৰ বাকী balance কিমান?" },
    { label: "📋 সম্পূৰ্ণ হিচাব", msg: "সম্পূৰ্ণ financial report দিয়ক" },
  ];

  // ── Weekly alert (only if no chat yet) ────────────────────────────────────
  const currSched = getCurrentWeekSchedule();
  const now2 = new Date();
  const currMonthName = L === "hi" ? MONTH_NAMES_HI[now2.getMonth()+1] : MONTH_NAMES_AS[now2.getMonth()+1];
  const modelShort = aiConfig.modelId ? aiConfig.modelId.split("/").pop()?.split(":")[0] || "AI" : "AI";
  const hasMessages = messages.length > 0;

  // ── Date separators in message list ───────────────────────────────────────
  const msgsWithSeparators = [];
  let lastDateLabel = "";
  messages.forEach((msg, i) => {
    const label = formatDateLabel(msg.ts);
    if (label && label !== lastDateLabel) {
      msgsWithSeparators.push({ type: "separator", label, key: "sep_" + i });
      lastDateLabel = label;
    }
    msgsWithSeparators.push({ type: "message", msg, key: "msg_" + i });
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 56px)", background: c.bg, fontFamily: "'Segoe UI', sans-serif", position: "relative" }}>

      {/* ── WhatsApp Header ── */}
      <div style={{ background: c.header, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#1a3a1a,#25d366)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🍃</div>
          <div>
            <div style={{ fontSize: "15px", fontWeight: "700", color: "#ffffff" }}>
              {L === "hi" ? "Iswar Tea AI" : "Iswar Tea AI"}
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)" }}>
              {aiConfig.apiKey ? `✨ ${modelShort}` : (L === "hi" ? "⚠️ key नहीं" : "⚠️ key নাই")}
            </div>
          </div>
        </div>
        <button onClick={clearChat} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", padding: "6px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>
          🗑️ {L === "hi" ? "Clear" : "মচক"}
        </button>
      </div>

      {/* ── Chat area ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 10px", paddingBottom: "8px" }}
        onClick={() => setShowQuickBtns(false)}>

        {/* Weekly alert — only when no messages */}
        {!hasMessages && currSched && (() => {
          const hasItems = currSched.items.length > 0;
          const plan = bigha ? getFertilizerPlan(bigha) : null;
          const preview = hasItems
            ? currSched.items.slice(0,2).map(i => itemLabel(i, L, plan?.[i] ? `${plan[i]}kg` : plan?.vermi || "")).join(", ")
            : (L === "hi" ? "कोई खाद नहीं" : "কোনো সাৰ নাই");
          return (
            <div style={{ margin: "0 4px 14px", borderRadius: "12px", background: c.alertBg, border: `1.5px solid ${c.alertBorder}`, padding: "12px 14px" }}>
              <div style={{ fontSize: "12px", fontWeight: "800", color: c.alertText, marginBottom: "4px" }}>
                🔔 {L === "hi" ? `इस हफ्ते का काम (${currMonthName})` : `এই সপ্তাহৰ কাম (${currMonthName})`}
              </div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: c.alertText, marginBottom: "10px" }}>
                {hasItems ? (L === "hi" ? `✅ ${preview} डालें` : `✅ ${preview} দিব`) : preview}
              </div>
              <button onClick={() => sendMessage(L === "hi" ? "इस हफ्ते क्या करें?" : "এই সপ্তাহত কি কৰিব?")}
                style={{ background: c.sendBtn, color: "white", border: "none", borderRadius: "20px", padding: "7px 16px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
                {L === "hi" ? "AI से पूछो →" : "AI ক সোধক →"}
              </button>
            </div>
          );
        })()}

        {/* Empty state */}
        {!hasMessages && (
          <div style={{ textAlign: "center", padding: "20px 16px", color: c.timeTxt }}>
            <div style={{ fontSize: "48px", marginBottom: "10px" }}>🍃</div>
            <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "4px", color: dark ? "#e9edef" : "#111b21" }}>
              {L === "hi" ? "Iswar Tea Garden AI सहायक" : "Iswar Tea Garden AI সহায়ক"}
            </div>
            <div style={{ fontSize: "12px" }}>
              {L === "hi" ? "नीचे लिखें या quick buttons दबाएं" : "তলত লিখক বা quick buttons টিপক"}
            </div>
          </div>
        )}

        {/* Messages with date separators */}
        {msgsWithSeparators.map(item => {
          if (item.type === "separator") return (
            <div key={item.key} style={{ display: "flex", justifyContent: "center", margin: "10px 0" }}>
              <span style={{ background: c.dateSep, color: c.dateSepText, fontSize: "11px", fontWeight: "600", padding: "3px 12px", borderRadius: "20px" }}>
                {item.label}
              </span>
            </div>
          );

          const { msg } = item;
          const isUser = msg.role === "user";

          return (
            <div key={item.key} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: "4px", alignItems: "flex-end", gap: "6px" }}>
              {/* Bot avatar */}
              {!isUser && (
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: msg.isError ? "#ef4444" : "linear-gradient(135deg,#1a3a1a,#25d366)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", flexShrink: 0, marginBottom: "2px" }}>
                  {msg.isError ? "⚠️" : "🍃"}
                </div>
              )}

              {/* Bubble */}
              <div style={{
                maxWidth: "78%",
                background: isUser ? c.userBubble : (msg.isError ? c.errBubble : c.botBubble),
                color: isUser ? c.userText : (msg.isError ? c.errText : c.botText),
                padding: "8px 10px 6px 10px",
                borderRadius: isUser ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                position: "relative",
              }}>
                <FormattedText text={msg.text} color={isUser ? c.userText : (msg.isError ? c.errText : c.botText)} />
                {/* Time + tick */}
                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "3px", marginTop: "3px" }}>
                  <span style={{ fontSize: "10px", color: c.timeTxt }}>{formatTime(msg.ts)}</span>
                  {isUser && <span style={{ fontSize: "11px", color: "#53bdeb" }}>✓✓</span>}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typing && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", marginBottom: "4px" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#1a3a1a,#25d366)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px" }}>🍃</div>
            <div style={{ background: c.botBubble, padding: "12px 14px", borderRadius: "12px 12px 12px 2px", boxShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: c.timeTxt, animation: `waTyping 1.2s ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Quick buttons panel (pops up above input) ── */}
      {showQuickBtns && (
        <div style={{ background: c.quickBar, borderTop: `1px solid ${c.quickBtnBorder}`, padding: "8px 10px", maxHeight: "200px", overflowY: "auto", flexShrink: 0 }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: c.timeTxt, marginBottom: "6px", paddingLeft: "2px" }}>
            {L === "hi" ? "⚡ Quick Questions" : "⚡ দ্ৰুত প্ৰশ্ন"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {quickBtns.map(q => (
              <button key={q.label} onClick={() => sendMessage(q.msg)}
                style={{ background: c.quickBtn, border: `1px solid ${c.quickBtnBorder}`, color: c.quickBtnText, padding: "9px 12px", borderRadius: "10px", fontSize: "12.5px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                {q.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input bar ── */}
      <div style={{ background: c.inputBar, padding: "8px 10px", display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        {/* Quick button toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowQuickBtns(p => !p); }}
          style={{ width: 40, height: 40, borderRadius: "50%", background: showQuickBtns ? c.sendBtn : c.quickBtn, border: `1px solid ${c.quickBtnBorder}`, fontSize: "18px", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
          ⚡
        </button>

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !typing && sendMessage()}
          placeholder={L === "hi" ? "Message..." : "Message..."}
          disabled={typing}
          style={{ flex: 1, padding: "10px 16px", borderRadius: "24px", border: "none", fontSize: "14px", outline: "none", fontFamily: "inherit", background: c.inputBg, color: c.inputText, opacity: typing ? 0.6 : 1 }}
        />

        {/* Send button */}
        <button
          onClick={() => !typing && sendMessage()}
          disabled={!input.trim() || typing}
          style={{ width: 40, height: 40, borderRadius: "50%", background: (input.trim() && !typing) ? c.sendBtn : c.quickBtn, border: "none", color: (input.trim() && !typing) ? "white" : c.timeTxt, fontSize: "18px", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
          ➤
        </button>
      </div>

      <style>{`
        @keyframes waTyping {
          0%, 60%, 100% { opacity: 0.2; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
