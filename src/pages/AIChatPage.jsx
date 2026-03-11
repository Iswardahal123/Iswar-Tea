import React, { useState, useRef, useEffect, useCallback } from "react";
import { auth, db } from "../firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useLang } from "../LanguageContext";
import { useDark } from "../DarkModeContext";

const generateReply = (msg, entries, lang) => {
  const m = msg.toLowerCase().trim();
  const replies = {
    noData: { en: "No entries yet! Add leaf data from the Entry tab first 🍃", hi: "अभी कोई प्रविष्टि नहीं! पहले Entry टैब से पत्ता डेटा जोड़ें 🍃", ne: "अहिले कुनै प्रविष्टि छैन! पहिले Entry ट्याबबाट पात डेटा थप्नुस् 🍃", as: "এতিয়া কোনো তথ্য নাই! প্ৰথমে তথ্য টেবৰ পৰা পাত যোগ কৰক 🍃" },
    notFound: { en: "Didn't understand 😅\n\nTry these:\n• last entry\n• balance\n• this month\n• full report", hi: "समझ नहीं आया 😅\n\nये try करें:\n• आखिरी प्रविष्टि\n• बाकी राशि\n• इस महीने\n• पूरा हिसाब", ne: "बुझिएन 😅\n\nयी try गर्नुस्:\n• अन्तिम प्रविष्टि\n• बाँकी रकम\n• यो महिना\n• पूरा हिसाब", as: "বুজিব পৰা নাই 😅\n\nএইবোৰ চেষ্টা কৰক:\n• শেষ তথ্য\n• বাকী পৰিমাণ\n• এই মাহ\n• সম্পূৰ্ণ হিচাব" },
  };
  const L = lang || "as";
  const t = (obj) => obj[L] || obj.as;
  if (entries.length === 0) return t(replies.noData);
  const sorted = [...entries].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const totalWeight = entries.reduce((s, e) => s + (e.weight || 0), 0);
  const totalAmount = entries.reduce((s, e) => s + (e.totalAmount || 0), 0);
  const totalReceived = entries.reduce((s, e) => s + (e.amountReceived || 0), 0);
  const totalAdvance = entries.reduce((s, e) => s + (e.advanceCut || 0), 0);
  const totalBalance = entries.reduce((s, e) => s + (e.balanceAmount || 0), 0);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthEntries = entries.filter(e => e.date?.startsWith(thisMonth));
  const monthWeight = monthEntries.reduce((s, e) => s + (e.weight || 0), 0);
  const monthAmount = monthEntries.reduce((s, e) => s + (e.totalAmount || 0), 0);
  const monthBalance = monthEntries.reduce((s, e) => s + (e.balanceAmount || 0), 0);
  const latest = sorted[0];
  const withRate = entries.filter(e => e.rate > 0);
  const avgRate = withRate.length ? withRate.reduce((s, e) => s + e.rate, 0) / withRate.length : 0;
  const latestWithRate = sorted.find(e => e.rate > 0);
  const locales = { en: "en-IN", hi: "hi-IN", ne: "ne-NP", as: "as-IN" };
  const fmtDate = (d) => { try { return d ? new Date(d + "T00:00:00").toLocaleDateString(locales[L], { day: "numeric", month: "long", year: "numeric" }) : "N/A"; } catch(e) { return d || "N/A"; } };
  const curr = { en: (n) => `Rs ${(n||0).toFixed(0)}`, hi: (n) => `Rs ${(n||0).toFixed(0)}`, ne: (n) => `Rs ${(n||0).toFixed(0)}`, as: (n) => `${(n||0).toFixed(0)} টকা` };
  const wt = { en: (n) => `${n} kg`, hi: (n) => `${n} कि.ग्रा.`, ne: (n) => `${n} कि.ग्रा.`, as: (n) => `${n} কি:গ্ৰা:` };
  const fmtC = (n) => curr[L](n);
  const fmtW = (n) => wt[L](n);
  if (m.match(/last|latest|recent|শেষ|আখৰী|aakhri|अन्तिम|आखिरी/)) {
    const labels = { en: ["📌 Last Entry","Date","Weight","Rate","Total","Advance","Received","Balance"], hi: ["📌 आखिरी प्रविष्टि","तारीख","वजन","दर","कुल","अग्रिम","मिली","बाकी"], ne: ["📌 अन्तिम प्रविष्टि","मिति","तौल","दर","कुल","अग्रिम","पाएको","बाँकी"], as: ["📌 শেষ তথ্য","তাৰিখ","ওজন","হাৰ","মুঠ","এডভান্স","পোৱা","বাকী"] };
    const lb = labels[L]; const noRate = { en:"Not set", hi:"निर्धारित नहीं", ne:"निर्धारित छैन", as:"নিৰ্ধাৰণ হোৱা নাই" };
    return `${lb[0]}\n\n📅 ${fmtDate(latest.date)}\n⚖️ ${lb[1]}: ${fmtW(latest.weight)}\n💲 ${lb[2]}: ${latest.rate ? fmtC(latest.rate) : t(noRate)}\n💰 ${lb[3]}: ${fmtC(latest.totalAmount)}\n✂️ ${lb[4]}: ${fmtC(latest.advanceCut)}\n💵 ${lb[5]}: ${fmtC(latest.amountReceived)}\n🟢 ${lb[6]}: ${fmtC(latest.balanceAmount)}${latest.notes ? "\n📝 " + latest.notes : ""}`;
  }
  if (m.match(/balance|বাকী|baaki|बाँकी|बाकी|remaining/)) {
    const labels = { en: ["💳 Balance","Total Earning","Received","Advance Cut","Pending","Overpaid","Settled"], hi: ["💳 बाकी राशि","कुल कमाई","मिली राशि","अग्रिम कटा","बाकी बचा है","ज्यादा मिल गया!","हिसाब बराबर"], ne: ["💳 बाँकी रकम","कुल आम्दानी","पाएको","अग्रिम काटिएको","अझै बाँकी","बढी पाइयो!","हिसाब बराबर"], as: ["💳 বাকী পৰিমাণ","মুঠ উপাৰ্জন","পোৱা পৰিমাণ","এডভান্স কটা","টকা পোৱা বাকী","অতিৰিক্ত পোৱা হৈছে!","হিচাব সমান"] };
    const lb = labels[L];
    return `${lb[0]}\n\n${fmtC(totalBalance)}\n\n• ${lb[1]}: ${fmtC(totalAmount)}\n• ${lb[2]}: ${fmtC(totalReceived)}\n• ${lb[3]}: ${fmtC(totalAdvance)}\n\n${totalBalance > 0 ? "✅ " + lb[4] : totalBalance < 0 ? "⚠️ " + lb[5] : "✅ " + lb[6]}`;
  }
  if (m.match(/advance|এডভান্স|अग्रिम/)) {
    const labels = { en: ["💵 Advance","Total Cut"], hi: ["💵 अग्रिम","कुल कटा"], ne: ["💵 अग्रिम","कुल काटिएको"], as: ["💵 এডভান্স","মুঠ কটা"] };
    const lb = labels[L]; const advE = entries.filter(e => e.advanceCut > 0);
    return `${lb[0]}\n\n${lb[1]}: ${fmtC(totalAdvance)}\n\n${advE.slice(0,5).map(e => `• ${fmtDate(e.date)}: ${fmtC(e.advanceCut)}`).join("\n")}${advE.length > 5 ? `\n...+${advE.length-5}` : ""}`;
  }
  if (m.match(/month|মাহ|महिना|महीने|this month|এই মাহ|यो महिना/)) {
    const mName = new Date().toLocaleString(locales[L], { month: "long", year: "numeric" });
    const noEntry = { en: `No entries yet in ${mName}.`, hi: `${mName} में अभी कोई प्रविष्टि नहीं।`, ne: `${mName} मा अहिले कुनै प्रविष्टि छैन।`, as: `${mName}ত এতিয়ালৈ কোনো তথ্য নাই।` };
    if (!monthEntries.length) return t(noEntry);
    const labels = { en:["📅","entries"], hi:["📅","प्रविष्टियां"], ne:["📅","वटा प्रविष्टि"], as:["📅","টা তথ্য"] };
    const lb = labels[L];
    return `${lb[0]} ${mName}\n\n⚖️ ${fmtW(monthWeight.toFixed(1))}\n💰 ${fmtC(monthAmount)}\n🟢 ${fmtC(monthBalance)}\n📋 ${monthEntries.length} ${lb[1]}`;
  }
  if (m.match(/earning|উপাৰ্জন|kamaai|आम्दानी|कमाई|income/)) {
    const labels = { en: ["💰 Earning","Total","Received","Balance","Advance","This Month"], hi: ["💰 कमाई","कुल","मिली","बाकी","अग्रिम","इस महीने"], ne: ["💰 आम्दानी","कुल","पाएको","बाँकी","अग्रिम","यो महिना"], as: ["💰 উপাৰ্জন","মুঠ","পোৱা","বাকী","এডভান্স","এই মাহত"] };
    const lb = labels[L];
    return `${lb[0]}\n\n• ${lb[1]}: ${fmtC(totalAmount)}\n• ${lb[2]}: ${fmtC(totalReceived)}\n• ${lb[3]}: ${fmtC(totalBalance)}\n• ${lb[4]}: ${fmtC(totalAdvance)}\n\n📅 ${lb[5]}: ${fmtC(monthAmount)}`;
  }
  if (m.match(/rate|হাৰ|दर/)) {
    const labels = { en: ["📊 Rate","Latest","Average","Max","Min","per kg","No rate data found."], hi: ["📊 दर","आखिरी","औसत","अधिकतम","न्यूनतम","प्रति कि.ग्रा.","कोई दर डेटा नहीं।"], ne: ["📊 दर","अन्तिम","औसत","अधिकतम","न्यूनतम","प्रति कि.ग्रा.","कुनै दर डेटा छैन।"], as: ["📊 হাৰ","শেষ হাৰ","গড়","সৰ্বাধিক","সৰ্বনিম্ন","টকা/কি:গ্ৰা:","কোনো তথ্যত হাৰ নাই।"] };
    const lb = labels[L];
    if (!latestWithRate) return lb[6];
    return `${lb[0]}\n\n• ${lb[1]}: ${latestWithRate.rate} ${lb[5]}\n• ${lb[2]}: ${avgRate.toFixed(1)}\n• ${lb[3]}: ${Math.max(...withRate.map(e=>e.rate))}\n• ${lb[4]}: ${Math.min(...withRate.map(e=>e.rate))}`;
  }
  if (m.match(/report|summary|সম্পূৰ্ণ|full|poora|pura|puro|पूरा|पूरो/)) {
    const labels = { en: ["📊 Full Report","Leaf","Total Weight","Total Entries","Money","Total Earning","Received","Advance","Balance","This Month"], hi: ["📊 पूरा हिसाब","पत्ता","कुल वजन","कुल प्रविष्टियां","पैसा","कुल कमाई","मिली","अग्रिम","बाकी","इस महीने"], ne: ["📊 पूरा हिसाब","पात","कुल तौल","कुल प्रविष्टि","पैसा","कुल आम्दानी","पाएको","अग्रिम","बाँकी","यो महिना"], as: ["📊 সম্পূৰ্ণ হিচাব","পাত","মুঠ ওজন","মুঠ তথ্য","টকা","মুঠ উপাৰ্জন","পোৱা","এডভান্স","বাকী","এই মাহত"] };
    const lb = labels[L];
    return `${lb[0]}\n\n🍃 ${lb[1]}\n• ${lb[2]}: ${fmtW(totalWeight.toFixed(1))}\n• ${lb[3]}: ${entries.length}\n\n💰 ${lb[4]}\n• ${lb[5]}: ${fmtC(totalAmount)}\n• ${lb[6]}: ${fmtC(totalReceived)}\n• ${lb[7]}: ${fmtC(totalAdvance)}\n• 🟢 ${lb[8]}: ${fmtC(totalBalance)}\n\n📅 ${lb[9]}\n• ${monthEntries.length} • ${fmtW(monthWeight.toFixed(1))} • ${fmtC(monthAmount)}`;
  }
  return t(replies.notFound);
};

const chatConfig = {
  en: { title: "Chai Bagan Assistant", sub: "Ask anything about your entries", helpTitle: "📋 What can you ask?", helpRows: [["📌","Last Entry","Last time how much leaf given"],["💰","Total Earning","How much money received total"],["💳","Balance","How much money still pending"],["📅","This Month","Complete this month data"],["💵","Advance","How much advance deducted"],["📊","Full Report","Summary of all entries"]], btns: [{label:"Last Entry",msg:"last"},{label:"Balance",msg:"balance"},{label:"This Month",msg:"month"},{label:"Earning",msg:"earning"},{label:"Advance",msg:"advance"},{label:"Full Report",msg:"report"}], back: "← Back", placeholder: "Type your question..." },
  hi: { title: "चाय बागान सहायक", sub: "अपनी प्रविष्टियों के बारे में कुछ भी पूछें", helpTitle: "📋 क्या पूछ सकते हैं?", helpRows: [["📌","आखिरी प्रविष्टि","पिछली बार कितना पत्ता दिया"],["💰","कुल कमाई","कुल कितना पैसा मिला"],["💳","बाकी राशि","कितना पैसा अभी बाकी है"],["📅","इस महीने","इस महीने का पूरा डेटा"],["💵","अग्रिम","कितना अग्रिम काटा गया"],["📊","पूरा हिसाब","सभी प्रविष्टियों का सारांश"]], btns: [{label:"आखिरी",msg:"aakhri"},{label:"बाकी",msg:"balance"},{label:"इस महीने",msg:"month"},{label:"कमाई",msg:"earning"},{label:"अग्रिम",msg:"advance"},{label:"पूरा हिसाब",msg:"report"}], back: "← वापस", placeholder: "प्रश्न लिखें..." },
  ne: { title: "चिया बगान सहायक", sub: "आफ्नो प्रविष्टिबारे जे सोध्नुस्", helpTitle: "📋 के सोध्न सकिन्छ?", helpRows: [["📌","अन्तिम प्रविष्टि","अन्तिम पटक कति पात दियो"],["💰","कुल आम्दानी","जम्मा कति पैसा पाइयो"],["💳","बाँकी रकम","कति पैसा अझै बाँकी छ"],["📅","यो महिना","यो महिनाको पूरा डेटा"],["💵","अग्रिम","कति अग्रिम काटिएको छ"],["📊","पूरा हिसाब","सबै प्रविष्टिको सारांश"]], btns: [{label:"अन्तिम",msg:"last"},{label:"बाँकी",msg:"balance"},{label:"यो महिना",msg:"month"},{label:"आम्दानी",msg:"earning"},{label:"अग्रिम",msg:"advance"},{label:"पूरा हिसाब",msg:"report"}], back: "← फर्कनुस्", placeholder: "प्रश्न लेख्नुस्..." },
  as: { title: "চাহ বাগান সহায়ক", sub: "আপোনাৰ তথ্যৰ বিষয়ে যিকোনো কথা সুধিব পাৰে", helpTitle: "📋 কি কি সুধিব পাৰে?", helpRows: [["📌","শেষ তথ্য","শেষবাৰ কিমান পাত দিছিল"],["💰","মুঠ উপাৰ্জন","মুঠ কিমান টকা পালোঁ"],["💳","বাকী পৰিমাণ","কিমান টকা পোৱা বাকী"],["📅","এই মাহ","এই মাহৰ সম্পূৰ্ণ তথ্য"],["💵","এডভান্স","কিমান এডভান্স কটা হৈছে"],["📊","সম্পূৰ্ণ হিচাব","সকলো তথ্যৰ সাৰাংশ"]], btns: [{label:"শেষ তথ্য",msg:"শেষ"},{label:"বাকী",msg:"বাকী"},{label:"এই মাহ",msg:"মাহ"},{label:"উপাৰ্জন",msg:"উপাৰ্জন"},{label:"এডভান্স",msg:"এডভান্স"},{label:"সম্পূৰ্ণ",msg:"report"}], back: "← ঘূৰি যাওক", placeholder: "যিকোনো প্ৰশ্ন লিখক..." },
};

export default function AIChatPage({ user }) {
  const { lang } = useLang();
  const { dark } = useDark();
  const C = chatConfig[lang] || chatConfig.as;

  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [entries, setEntries] = useState([]);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  const loadEntries = useCallback(async () => {
    try {
      const cu = user || auth.currentUser;
      if (!cu) return;
      const snap = await getDocs(query(collection(db, "entries"), where("uid", "==", cu.uid)));
      setEntries(snap.docs.map(d => d.data()));
    } catch (err) { console.error(err); }
  }, [user]);

  useEffect(() => { loadEntries(); }, [loadEntries]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  const startChat = (msg) => {
    setStarted(true);
    setMessages([{ role: "user", text: msg }]);
    setTyping(true);
    setTimeout(() => { setMessages(p => [...p, { role: "bot", text: generateReply(msg, entries, lang) }]); setTyping(false); }, 500);
  };

  const sendMessage = (text) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput("");
    setMessages(p => [...p, { role: "user", text: msg }]);
    setTyping(true);
    setTimeout(() => { setMessages(p => [...p, { role: "bot", text: generateReply(msg, entries, lang) }]); setTyping(false); }, 500);
  };

  // Dark palette
  const d = {
    bg: dark ? "#0f172a" : "#f0f4f0",
    card: dark ? "#1e293b" : "white",
    cardBorder: dark ? "1px solid #334155" : "none",
    text: dark ? "#f1f5f9" : "#1a3a1a",
    subtext: dark ? "#94a3b8" : "#6b7280",
    helpTitle: dark ? "#64748b" : "#6b7280",
    helpRow: dark ? "#1e293b" : "white",
    helpRowBorder: dark ? "#334155" : "#f9fafb",
    helpIconBg: dark ? "#14532d" : "#f0fdf4",
    arrow: dark ? "#475569" : "#d1d5db",
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
    typingDot: dark ? "#475569" : "#9ca3af",
  };

  if (!started) {
    return (
      <div style={{ minHeight: "calc(100vh - 120px)", background: d.bg, padding: "20px 16px 100px", fontFamily: "'Segoe UI', sans-serif", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ textAlign: "center", padding: "24px 0 8px" }}>
          <div style={{ fontSize: "56px", marginBottom: "10px" }}>🍃</div>
          <h2 style={{ fontSize: "22px", fontWeight: "900", color: d.text, margin: "0 0 6px" }}>{C.title}</h2>
          <p style={{ fontSize: "13px", color: d.subtext, margin: 0 }}>{C.sub}</p>
        </div>
        <div style={{ background: d.card, borderRadius: "18px", boxShadow: dark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.07)", overflow: "hidden", border: d.cardBorder }}>
          <div style={{ fontSize: "13px", fontWeight: "800", color: d.helpTitle, padding: "14px 16px 10px", borderBottom: `1px solid ${d.helpRowBorder}` }}>{C.helpTitle}</div>
          {C.helpRows.map(([icon, title, desc]) => (
            <button key={title} onClick={() => startChat(title)}
              style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", background: d.helpRow, border: "none", borderBottom: `1px solid ${d.helpRowBorder}`, width: "100%", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
              <span style={{ fontSize: "22px", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: d.helpIconBg, borderRadius: "10px", flexShrink: 0 }}>{icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: "800", color: d.text }}>{title}</div>
                <div style={{ fontSize: "12px", color: d.subtext, marginTop: "2px" }}>{desc}</div>
              </div>
              <span style={{ fontSize: "22px", color: d.arrow }}>›</span>
            </button>
          ))}
        </div>
        <style>{`@keyframes blink{0%,80%,100%{opacity:.2;transform:scale(0.8)}40%{opacity:1;transform:scale(1)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", background: d.bg, fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Quick buttons */}
      <div style={{ display: "flex", gap: "8px", padding: "10px 12px", overflowX: "auto", background: d.quickBar, borderBottom: `1px solid ${d.quickBarBorder}`, flexShrink: 0 }}>
        <button onClick={() => { setStarted(false); setMessages([]); }}
          style={{ background: d.backBtn, border: "none", color: d.backBtnColor, padding: "7px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
          {C.back}
        </button>
        {C.btns.map(q => (
          <button key={q.label} onClick={() => sendMessage(q.msg)}
            style={{ background: d.quickBtn, border: `1.5px solid ${d.quickBtnBorder}`, color: d.quickBtnColor, padding: "7px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
            {q.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 12px" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: "10px" }}>
            {msg.role === "bot" && (
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#1a3a1a,#2d5a27)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", flexShrink: 0, marginRight: "8px", alignSelf: "flex-end" }}>🍃</div>
            )}
            <div style={{
              maxWidth: "82%", padding: "12px 16px", borderRadius: "18px", fontSize: "14px", lineHeight: "1.7",
              background: msg.role === "user" ? "linear-gradient(135deg,#1a3a1a,#2d5a27)" : d.botBubble,
              color: msg.role === "user" ? "white" : d.botBubbleText,
              borderBottomRightRadius: msg.role === "user" ? "4px" : "18px",
              borderBottomLeftRadius: msg.role === "bot" ? "4px" : "18px",
              boxShadow: msg.role === "bot" ? d.botShadow : "none",
              border: msg.role === "bot" ? d.cardBorder : "none",
            }}>
              {msg.text.split("\n").map((line, j) => (
                <span key={j}>{line}{j < msg.text.split("\n").length - 1 && <br />}</span>
              ))}
            </div>
          </div>
        ))}
        {typing && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#1a3a1a,#2d5a27)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", flexShrink: 0, marginRight: "8px" }}>🍃</div>
            <div style={{ padding: "12px 16px", borderRadius: "18px", background: d.botBubble, boxShadow: d.botShadow, border: d.cardBorder }}>
              <div style={{ display: "flex", gap: "4px", padding: "2px 0" }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: d.typingDot, animation: `blink 1.2s ${i*0.2}s infinite` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "10px 12px", background: d.inputBar, borderTop: `1px solid ${d.inputBarBorder}`, display: "flex", gap: "10px", flexShrink: 0 }}>
        <input type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder={C.placeholder}
          style={{ flex: 1, padding: "12px 16px", borderRadius: "24px", border: `2px solid ${d.inputBorder}`, fontSize: "15px", outline: "none", fontFamily: "inherit", background: d.input, color: d.inputText }} />
        <button onClick={() => sendMessage()} disabled={!input.trim()}
          style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#1a3a1a,#2d5a27)", color: "white", border: "none", fontSize: "18px", cursor: "pointer", flexShrink: 0, opacity: input.trim() ? 1 : 0.5 }}>➤</button>
      </div>
      <style>{`@keyframes blink{0%,80%,100%{opacity:.2;transform:scale(0.8)}40%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}
