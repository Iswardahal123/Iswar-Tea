import React, { useState, useRef, useEffect, useCallback } from "react";
import { auth, db } from "../firebase/config";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
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

export default function AIChatPage({ user }) {
  const { lang } = useLang();
  const { dark } = useDark();
  const L = (lang === "hi" || lang === "en") ? "hi" : "as";

  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [input, setInput] = useState("");
  const [entries, setEntries] = useState([]);
  const [typing, setTyping] = useState(false);
  const [bigha, setBigha] = useState(null);
  const [showWeeklyAlert, setShowWeeklyAlert] = useState(true);
  const [aiConfig, setAiConfig] = useState({ apiKey: "", modelId: DEFAULT_MODEL });
  const bottomRef = useRef(null);

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

  useEffect(() => { loadEntries(); loadAiConfig(); }, [loadEntries, loadAiConfig]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  const currSched = getCurrentWeekSchedule();
  const nextSched = getNextWeekSchedule();
  const now = new Date();
  const currMonthName = L === "hi" ? MONTH_NAMES_HI[now.getMonth()+1] : MONTH_NAMES_AS[now.getMonth()+1];

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || typing) return;
    setInput("");
    setStarted(true);

    const bighaMatch = msg.match(/(\d+(\.\d+)?)\s*(बिघा|bigha|বিঘা)/i);
    let curBigha = bigha;
    if (bighaMatch) { curBigha = parseFloat(bighaMatch[1]); setBigha(curBigha); }

    setMessages(p => [...p, { role: "user", text: msg }]);
    setTyping(true);

    try {
      if (!aiConfig.apiKey) throw new Error("NO_KEY");

      const systemPrompt = buildSystemPrompt(entries, curBigha, L);
      // chatHistory = already saved turns [user, assistant, user, assistant...]
      // Current msg is NEW, not yet in chatHistory
      let apiMsgs;
      if (chatHistory.length === 0) {
        // Very first message — inject system prompt
        apiMsgs = [
          { role: "user", content: `[INSTRUCTIONS]\n${systemPrompt}\n\n---\n${msg}` },
        ];
      } else {
        // Multi-turn: system prompt in first msg, then rest of history, then current msg
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

      if (!res.ok) {
        const errDetail = JSON.stringify(data?.error || data).slice(0, 300);
        throw new Error(`HTTP ${res.status}: ${errDetail}`);
      }

      const reply = data.choices?.[0]?.message?.content || "";

      setChatHistory(prev => [...prev, { role: "user", content: msg }, { role: "assistant", content: reply }]);
      setMessages(p => [...p, { role: "bot", text: reply }]);
    } catch (err) {
      let errMsg = "";
      if (err.message === "NO_KEY") {
        errMsg = L === "hi"
          ? "⚠️ OpenRouter API key सेट नहीं है। Admin Panel में जाकर AI Settings में key डालें।"
          : "⚠️ OpenRouter API key সেট কৰা হোৱা নাই। Admin Panel ৰ AI Settings ত key দিয়ক।";
      } else {
        errMsg = L === "hi"
          ? `⚠️ AI से जवाब नहीं मिला।\n${err.message}\n\nदोबारा कोशिश करें।`
          : `⚠️ AI ৰ পৰা উত্তৰ পোৱা নগ'ল।\n${err.message}\n\nপুনৰ চেষ্টা কৰক।`;
      }
      setMessages(p => [...p, { role: "bot", text: errMsg, isError: true }]);
    } finally {
      setTyping(false);
    }
  };

  const d = {
    bg: dark ? "#0f172a" : "#f0f4f0",
    card: dark ? "#1e293b" : "white",
    cardBorder: dark ? "1px solid #334155" : "1px solid #e5e7eb",
    text: dark ? "#f1f5f9" : "#1a3a1a",
    subtext: dark ? "#94a3b8" : "#6b7280",
    quickBar: dark ? "#1e293b" : "white",
    quickBarBorder: dark ? "#334155" : "#e5e7eb",
    backBtn: dark ? "#334155" : "#f3f4f6",
    backBtnColor: dark ? "#f1f5f9" : "#374151",
    quickBtn: dark ? "#14532d" : "#f0fdf4",
    quickBtnBorder: dark ? "#16a34a" : "#86efac",
    quickBtnColor: dark ? "#86efac" : "#166534",
    botBubble: dark ? "#1e293b" : "white",
    botBubbleText: dark ? "#f1f5f9" : "#1a1a1a",
    botShadow: dark ? "0 2px 10px rgba(0,0,0,0.4)" : "0 2px 10px rgba(0,0,0,0.08)",
    inputBar: dark ? "#1e293b" : "white",
    inputBarBorder: dark ? "#334155" : "#e5e7eb",
    input: dark ? "#0f172a" : "white",
    inputBorder: dark ? "#475569" : "#e5e7eb",
    inputText: dark ? "#f1f5f9" : "#1a1a1a",
    alertBg: dark ? "#1c2f1c" : "#f0fdf4",
    alertBorder: dark ? "#16a34a" : "#86efac",
    alertText: dark ? "#86efac" : "#166534",
    alertSubText: dark ? "#4ade80" : "#15803d",
    nextBg: dark ? "#1e1a2e" : "#faf5ff",
    nextBorder: dark ? "#7c3aed" : "#c4b5fd",
    nextText: dark ? "#c4b5fd" : "#6d28d9",
    aiBadgeBg: dark ? "#1e3a5f" : "#eff6ff",
    aiBadgeText: dark ? "#93c5fd" : "#1d4ed8",
  };

  const quickBtns = L === "hi" ? [
    { label: "📅 इस हफ्ते", msg: "इस हफ्ते क्या करें?" },
    { label: "🛒 खरीदारी", msg: "अगले हफ्ते क्या खरीदें?" },
    { label: "📊 साल का plan", msg: "पूरा साल भर का plan बताओ" },
    { label: "🌿 पत्ता yield", msg: "पत्ता कितना निकलेगा?" },
    { label: "🧪 मिलाने के नियम", msg: "खाद मिलाने के नियम बताओ" },
    { label: "⚠️ Golden Rules", msg: "चाय बागान के golden rules बताओ" },
    { label: "💰 बाकी राशि", msg: "मेरा बाकी balance कितना है?" },
    { label: "📋 पूरा हिसाब", msg: "पूरा financial report दो" },
  ] : [
    { label: "📅 এই সপ্তাহ", msg: "এই সপ্তাহত কি কৰিব?" },
    { label: "🛒 কিনাকাটা", msg: "পৰৱৰ্তী সপ্তাহত কি কিনিব?" },
    { label: "📊 বছৰৰ পৰিকল্পনা", msg: "গোটেই বছৰৰ সম্পূৰ্ণ পৰিকল্পনা কওক" },
    { label: "🌿 পাত yield", msg: "পাত কিমান ওলাব?" },
    { label: "🧪 মিহলোৱাৰ নিয়ম", msg: "সাৰ মিহলোৱাৰ নিয়ম কওক" },
    { label: "⚠️ সোণালী নিয়ম", msg: "চাহ বাগানৰ সোণালী নিয়ম কওক" },
    { label: "💰 বাকী পৰিমাণ", msg: "মোৰ বাকী balance কিমান?" },
    { label: "📋 সম্পূৰ্ণ হিচাব", msg: "সম্পূৰ্ণ financial report দিয়ক" },
  ];

  const modelShort = aiConfig.modelId ? aiConfig.modelId.split("/").pop()?.split(":")[0] || "AI" : "Not set";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", background: d.bg, fontFamily: "'Segoe UI', sans-serif" }}>

      {!started && (
        <div style={{ overflowY: "auto", flex: 1, paddingBottom: "16px" }}>
          {/* Weekly Alert */}
          {showWeeklyAlert && currSched && (() => {
            const hasItems = currSched.items.length > 0;
            const plan = bigha ? getFertilizerPlan(bigha) : null;
            const preview = hasItems
              ? currSched.items.slice(0,2).map(i => itemLabel(i, L, plan?.[i] ? `${plan[i]}kg` : plan?.vermi || "")).join(", ")
              : (L === "hi" ? "कोई खाद नहीं" : "কোনো সাৰ নাই");
            return (
              <div style={{ margin: "12px 16px 0", borderRadius: "14px", background: d.alertBg, border: `1.5px solid ${d.alertBorder}`, padding: "12px 14px", position: "relative" }}>
                <button onClick={() => setShowWeeklyAlert(false)} style={{ position: "absolute", top: 8, right: 10, background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: d.subtext }}>✕</button>
                <div style={{ fontSize: "11px", fontWeight: "800", color: d.alertText, marginBottom: "4px" }}>
                  {L === "hi" ? `🔔 इस हफ्ते का काम (${currMonthName})` : `🔔 এই সপ্তাহৰ কাম (${currMonthName})`}
                </div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: d.alertSubText }}>
                  {hasItems ? (L === "hi" ? `✅ ${preview} डालें` : `✅ ${preview} দিব`) : preview}
                </div>
                <button onClick={() => sendMessage(L === "hi" ? "इस हफ्ते क्या करें?" : "এই সপ্তাহত কি কৰিব?")}
                  style={{ marginTop: "8px", background: "linear-gradient(135deg,#1a3a1a,#2d5a27)", color: "white", border: "none", borderRadius: "20px", padding: "6px 14px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>
                  {L === "hi" ? "AI से पूछो →" : "AI ক সোধক →"}
                </button>
              </div>
            );
          })()}

          {/* Next Week Teaser */}
          {nextSched && nextSched.items.length > 0 && (() => {
            const plan = bigha ? getFertilizerPlan(bigha) : null;
            const preview = nextSched.items.slice(0,2).map(i => itemLabel(i, L, plan?.[i] ? `${plan[i]}kg` : plan?.vermi || "")).join(", ");
            const mName = L === "hi" ? MONTH_NAMES_HI[nextSched.month] : MONTH_NAMES_AS[nextSched.month];
            return (
              <div style={{ margin: "8px 16px 0", borderRadius: "12px", background: d.nextBg, border: `1px dashed ${d.nextBorder}`, padding: "10px 14px" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: d.nextText }}>
                  {L === "hi" ? `🛒 अगले हफ्ते (${mName}): ${preview}` : `🛒 পৰৱৰ্তী সপ্তাহ (${mName}): ${preview}`}
                </div>
              </div>
            );
          })()}

          {/* Main Card */}
          <div style={{ margin: "12px 16px", borderRadius: "16px", background: d.card, border: d.cardBorder, padding: "16px", boxShadow: d.botShadow }}>
            <div style={{ fontSize: "28px", textAlign: "center", marginBottom: "6px" }}>🍃</div>
            <div style={{ fontSize: "15px", fontWeight: "800", color: d.text, textAlign: "center", marginBottom: "4px" }}>
              {L === "hi" ? "Iswar Tea Garden AI सहायक" : "Iswar Tea Garden AI সহায়ক"}
            </div>
            <div style={{ textAlign: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "10px", fontWeight: "700", background: aiConfig.apiKey ? d.aiBadgeBg : "#fef2f2", color: aiConfig.apiKey ? d.aiBadgeText : "#dc2626", padding: "3px 10px", borderRadius: "20px" }}>
                {aiConfig.apiKey ? `✨ AI: ${modelShort}` : (L === "hi" ? "⚠️ AI key नहीं है" : "⚠️ AI key নাই")}
              </span>
            </div>
            <div style={{ fontSize: "12px", color: d.subtext, textAlign: "center", marginBottom: "16px" }}>
              {L === "hi" ? "बिघा बताएं → AI से exact plan पाएं" : "বিঘা জনাওক → AI ৰ পৰা exact plan লওক"}
            </div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
              <input type="number" id="bigha-input"
                placeholder={L === "hi" ? "बिघा लिखें (जैसे 2)" : "বিঘা লিখক (যেনে ২)"}
                style={{ flex: 1, padding: "12px 14px", borderRadius: "12px", border: `2px solid ${d.inputBorder}`, fontSize: "14px", fontFamily: "inherit", background: d.input, color: d.inputText, outline: "none" }}
                onKeyDown={e => { if (e.key === "Enter" && e.target.value) sendMessage(`${e.target.value} bigha`); }}
              />
              <button onClick={() => { const v = document.getElementById("bigha-input").value; if (v) sendMessage(`${v} bigha`); }}
                style={{ background: "linear-gradient(135deg,#1a3a1a,#2d5a27)", color: "white", border: "none", borderRadius: "12px", padding: "12px 18px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
                {L === "hi" ? "Plan लें" : "Plan লওক"}
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {[
                [L === "hi" ? "📅 इस हफ्ते क्या करें" : "📅 এই সপ্তাহত কি কৰিব", L === "hi" ? "इस हफ्ते क्या करें?" : "এই সপ্তাহত কি কৰিব?"],
                [L === "hi" ? "🛒 अगले हफ्ते खरीदारी" : "🛒 পৰৱৰ্তী সপ্তাহ কিনাকাটা", L === "hi" ? "अगले हफ्ते क्या खरीदें?" : "পৰৱৰ্তী সপ্তাহত কি কিনিব?"],
                [L === "hi" ? "📊 साल का पूरा plan" : "📊 বছৰৰ সম্পূৰ্ণ পৰিকল্পনা", L === "hi" ? "पूरा साल भर का plan बताओ" : "গোটেই বছৰৰ সম্পূৰ্ণ পৰিকল্পনা কওক"],
                [L === "hi" ? "🌿 पत्ता कितना निकलेगा" : "🌿 পাত কিমান ওলাব", L === "hi" ? "पत्ता कितना निकलेगा?" : "পাত কিমান ওলাব?"],
                [L === "hi" ? "⚠️ Golden Rules" : "⚠️ সোণালী নিয়ম", L === "hi" ? "golden rules बताओ" : "সোণালী নিয়ম কওক"],
                [L === "hi" ? "💰 बाकी राशि" : "💰 বাকী পৰিমাণ", L === "hi" ? "बाकी balance कितना है?" : "বাকী balance কিমান?"],
              ].map(([label, msg]) => (
                <button key={label} onClick={() => sendMessage(msg)}
                  style={{ background: d.quickBtn, border: `1.5px solid ${d.quickBtnBorder}`, color: d.quickBtnColor, padding: "10px 12px", borderRadius: "12px", fontSize: "11.5px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit", textAlign: "left", lineHeight: "1.3" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {started && (
        <>
          <div style={{ display: "flex", gap: "6px", padding: "8px 10px", overflowX: "auto", background: d.quickBar, borderBottom: `1px solid ${d.quickBarBorder}`, flexShrink: 0 }}>
            <button onClick={() => { setStarted(false); setMessages([]); setChatHistory([]); }}
              style={{ background: d.backBtn, border: "none", color: d.backBtnColor, padding: "6px 11px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
              ← {L === "hi" ? "वापस" : "ঘূৰিব"}
            </button>
            {quickBtns.map(q => (
              <button key={q.label} onClick={() => sendMessage(q.msg)}
                style={{ background: d.quickBtn, border: `1.5px solid ${d.quickBtnBorder}`, color: d.quickBtnColor, padding: "6px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
                {q.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: "10px" }}>
                {msg.role === "bot" && (
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: msg.isError ? "#dc2626" : "linear-gradient(135deg,#1a3a1a,#2d5a27)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0, marginRight: "8px", alignSelf: "flex-end" }}>
                    {msg.isError ? "⚠️" : "🍃"}
                  </div>
                )}
                <div style={{
                  maxWidth: "82%", padding: "11px 14px", borderRadius: "18px", fontSize: "13.5px", lineHeight: "1.7",
                  background: msg.role === "user" ? "linear-gradient(135deg,#1a3a1a,#2d5a27)" : (msg.isError ? (dark ? "#2d1a1a" : "#fef2f2") : d.botBubble),
                  color: msg.role === "user" ? "white" : (msg.isError ? "#dc2626" : d.botBubbleText),
                  borderBottomRightRadius: msg.role === "user" ? "4px" : "18px",
                  borderBottomLeftRadius: msg.role === "bot" ? "4px" : "18px",
                  boxShadow: msg.role === "bot" ? d.botShadow : "none",
                  border: msg.role === "bot" ? (msg.isError ? "1px solid #fca5a5" : d.cardBorder) : "none",
                }}>
                  {msg.text.split("\n").map((line, j) => (
                    <span key={j}>{line}{j < msg.text.split("\n").length - 1 && <br />}</span>
                  ))}
                </div>
              </div>
            ))}
            {typing && (
              <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#1a3a1a,#2d5a27)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0, marginRight: "8px" }}>🍃</div>
                <div style={{ padding: "12px 16px", borderRadius: "18px", background: d.botBubble, boxShadow: d.botShadow, border: d.cardBorder }}>
                  <div style={{ fontSize: "10px", color: d.subtext, marginBottom: "5px", fontWeight: "600" }}>
                    {L === "hi" ? `AI (${modelShort}) सोच रहा है...` : `AI (${modelShort}) ভাবি আছে...`}
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: d.subtext, animation: `blink 1.2s ${i*0.2}s infinite` }} />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </>
      )}

      <div style={{ padding: "8px 12px 10px", background: d.inputBar, borderTop: `1px solid ${d.inputBarBorder}`, display: "flex", gap: "8px", flexShrink: 0 }}>
        <input type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !typing && sendMessage()}
          placeholder={L === "hi" ? "AI से कुछ भी पूछो..." : "AI ক যিকোনো কথা সোধক..."}
          disabled={typing}
          style={{ flex: 1, padding: "11px 15px", borderRadius: "24px", border: `2px solid ${d.inputBorder}`, fontSize: "14px", outline: "none", fontFamily: "inherit", background: d.input, color: d.inputText, opacity: typing ? 0.6 : 1 }} />
        <button onClick={() => !typing && sendMessage()} disabled={!input.trim() || typing}
          style={{ width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(135deg,#1a3a1a,#2d5a27)", color: "white", border: "none", fontSize: "17px", cursor: "pointer", flexShrink: 0, opacity: (input.trim() && !typing) ? 1 : 0.5 }}>➤</button>
      </div>
      <style>{`@keyframes blink{0%,80%,100%{opacity:.2;transform:scale(0.8)}40%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}
