import React, { useState, useRef, useEffect, useCallback } from "react";
import { auth, db } from "../firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";

const generateReply = (msg, entries) => {
  const m = msg.toLowerCase().trim();

  if (entries.length === 0) {
    return "এতিয়া কোনো তথ্য নাই! প্ৰথমে তথ্য অন্তৰ্ভূক্ত কৰক 🍃";
  }

  const sorted = [...entries].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const totalWeight   = entries.reduce((s, e) => s + (e.weight || 0), 0);
  const totalAmount   = entries.reduce((s, e) => s + (e.totalAmount || 0), 0);
  const totalReceived = entries.reduce((s, e) => s + (e.amountReceived || 0), 0);
  const totalAdvance  = entries.reduce((s, e) => s + (e.advanceCut || 0), 0);
  const totalBalance  = entries.reduce((s, e) => s + (e.balanceAmount || 0), 0);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthEntries = entries.filter(e => e.date && e.date.startsWith(thisMonth));
  const monthWeight  = monthEntries.reduce((s, e) => s + (e.weight || 0), 0);
  const monthAmount  = monthEntries.reduce((s, e) => s + (e.totalAmount || 0), 0);
  const monthBalance = monthEntries.reduce((s, e) => s + (e.balanceAmount || 0), 0);

  const latest = sorted[0];
  const withRate = entries.filter(e => e.rate > 0);
  const avgRate  = withRate.length ? withRate.reduce((s, e) => s + e.rate, 0) / withRate.length : 0;
  const latestWithRate = sorted.find(e => e.rate > 0);

  const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("as-IN", { day: "numeric", month: "long", year: "numeric" }) : "N/A";
  const fmtTk = (n) => (n || 0).toFixed(0) + " টকা";

  // ── অভিনন্দন ──
  if (m.match(/^(hi|hello|hii|hey|namaste|namaskar|নমস্কাৰ|হেলো|কেনে আছে|ভাল আছে)/)) {
    const h = new Date().getHours();
    const greet = h < 12 ? "শুভ পুৱা ☕" : h < 17 ? "শুভ অপৰাহ্ন 🌞" : "শুভ সন্ধিয়া 🌆";
    return `${greet}\n\nনমস্কাৰ! 🙏 মই আপোনাৰ চাহ বাগান সহায়ক।\n\nআপুনি যিকোনো কথা সুধিব পাৰে:\n• উপাৰ্জন, বাকী, এডভান্স\n• এই মাহৰ তথ্য\n• পাতৰ ওজন বা হাৰ\n• সম্পূৰ্ণ হিচাব`;
  }

  // ── শেষ তথ্য ──
  if (m.match(/শেষ|last|latest|recent|আখৰী|নতুন|শেহতীয়া/)) {
    return `📌 শেষ তথ্য\n\n📅 তাৰিখ: ${fmtDate(latest.date)}\n⚖️ ওজন: ${latest.weight} কি:গ্ৰা:\n💲 হাৰ: ${latest.rate ? latest.rate + " টকা/কি:গ্ৰা:" : "নিৰ্ধাৰণ কৰা হোৱা নাই"}\n💰 মুঠ পৰিমাণ: ${fmtTk(latest.totalAmount)}\n✂️ এডভান্স কটা: ${fmtTk(latest.advanceCut)}\n💵 পোৱা পৰিমাণ: ${fmtTk(latest.amountReceived)}\n🟢 বাকী: ${fmtTk(latest.balanceAmount)}${latest.notes ? "\n📝 টোকা: " + latest.notes : ""}`;
  }

  // ── বাকী ──
  if (m.match(/বাকী|balance|বাকি|কিমান পাম|remaining/)) {
    return `💳 বাকী পৰিমাণ\n\n${fmtTk(totalBalance)} .}`;
  }

  // ── এডভান্স ──
  if (m.match(/এডভান্স|advance|পেশগী|ধাৰ/)) {
    const advEntries = entries.filter(e => e.advanceCut > 0);
    return `💵 এডভান্স বিৱৰণ\n\nমুঠ এডভান্স কটা: ${fmtTk(totalAdvance)}\n\n${advEntries.slice(0, 5).map(e => `• ${fmtDate(e.date)}: ${fmtTk(e.advanceCut)}`).join("\n")}${advEntries.length > 5 ? `\n\n...আৰু ${advEntries.length - 5} টা তথ্য` : ""}`;
  }

  // ── এই মাহ ──
  if (m.match(/মাহ|month|এই বাৰ|বৰ্তমান|এতিয়া/)) {
    const mName = new Date().toLocaleString("as-IN", { month: "long", year: "numeric" });
    if (monthEntries.length === 0) return `📅 ${mName}ত এতিয়ালৈ কোনো তথ্য নাই।\n\nতথ্য টেবৰ পৰা নতুন তথ্য যোগ কৰক!`;
    return `📅 ${mName}\n\n⚖️ মুঠ ওজন: ${monthWeight.toFixed(1)} কি:গ্ৰা:\n💰 উপাৰ্জন: ${fmtTk(monthAmount)}\n🟢 বাকী: ${fmtTk(monthBalance)}\n📋 তথ্য সংখ্যা: ${monthEntries.length}`;
  }

  // ── হাৰ ──
  if (m.match(/হাৰ|rate|ভাৱ|দাম|কিলো/)) {
    if (!latestWithRate) return "এতিয়ালৈ কোনো তথ্যত হাৰ নিৰ্ধাৰণ কৰা হোৱা নাই।\n অন্তৰ্ভূক্ত তথ্য টেবৰ পৰা সম্পাদনা কৰি হাৰ দিয়ক!";
    return `📊 হাৰৰ বিৱৰণ\n\n• শেষ হাৰ: ${latestWithRate.rate} টকা/কি:গ্ৰা:\n• গড় হাৰ: ${avgRate.toFixed(1)} টকা/কি:গ্ৰা:\n• সৰ্বাধিক: ${Math.max(...withRate.map(e => e.rate))} টকা/কি:গ্ৰা:\n• সৰ্বনিম্ন: ${Math.min(...withRate.map(e => e.rate))} টকা/কি:গ্ৰা:\n• হাৰ থকা তথ্য: ${withRate.length}/${entries.length}`;
  }

  // ── ওজন / পাত ──
  if (m.match(/ওজন|weight|কি:গ্ৰা|পাত|চাহ/)) {
    const best = sorted.reduce((a, b) => (b.weight || 0) > (a.weight || 0) ? b : a, sorted[0]);
    return `⚖️ পাতৰ ওজন\n\n• মুঠ ওজন: ${totalWeight.toFixed(1)} কি:গ্ৰা:\n• মুঠ তথ্য: ${entries.length} টা\n• গড় প্ৰতি তথ্য: ${(totalWeight / entries.length).toFixed(1)} কি:গ্ৰা:\n• সৰ্বাধিক: ${best.weight} কি:গ্ৰা: (${fmtDate(best.date)})\n• এই মাহত: ${monthWeight.toFixed(1)} কি:গ্ৰা:`;
  }

  // ── উপাৰ্জন ──
  if (m.match(/উপাৰ্জন|টকা|কিমান পালোঁ|আয়|earning|income/)) {
    return `💰 উপাৰ্জনৰ হিচাব\n\n• মুঠ উপাৰ্জন: ${fmtTk(totalAmount)}\n• পোৱা পৰিমাণ: ${fmtTk(totalReceived)}\n• বাকী পৰিমাণ: ${fmtTk(totalBalance)}\n• এডভান্স কটা: ${fmtTk(totalAdvance)}\n\n📅 এই মাহত: ${fmtTk(monthAmount)}`;
  }

  // ── সম্পূৰ্ণ হিচাব ──
  if (m.match(/সম্পূৰ্ণ|সকলো|পূৰ্ণ|report|হিচাব|বিৱৰণ/)) {
    return `📊 সম্পূৰ্ণ হিচাব\n\n🍃 পাত\n• মুঠ ওজন: ${totalWeight.toFixed(1)} কি:গ্ৰা:\n• মুঠ তথ্য: ${entries.length} টা\n• গড়: ${(totalWeight / entries.length).toFixed(1)} কি:গ্ৰা:/তথ্য\n\n💰 টকা\n• মুঠ উপাৰ্জন: ${fmtTk(totalAmount)}\n• পোৱা পৰিমাণ: ${fmtTk(totalReceived)}\n• এডভান্স কটা: ${fmtTk(totalAdvance)}\n• 🟢 বাকী: ${fmtTk(totalBalance)}\n\n📅 এই মাহত\n• ${monthEntries.length} টা তথ্য\n• ${monthWeight.toFixed(1)} কি:গ্ৰা:\n• ${fmtTk(monthAmount)} উপাৰ্জন`;
  }

  // ── সৰ্বাধিক ──
  if (m.match(/সৰ্বাধিক|সেৰা|বেছি|max|highest|সৰ্বোচ্চ/)) {
    const best = sorted.reduce((a, b) => (b.totalAmount || 0) > (a.totalAmount || 0) ? b : a, sorted[0]);
    const heaviest = sorted.reduce((a, b) => (b.weight || 0) > (a.weight || 0) ? b : a, sorted[0]);
    return `🏆 সৰ্বাধিক তথ্য\n\n💰 সৰ্বাধিক উপাৰ্জন:\n• ${fmtDate(best.date)}\n• ${best.weight} কি:গ্ৰা: @ ${best.rate} টকা/কি:গ্ৰা:\n• ${fmtTk(best.totalAmount)}\n\n⚖️ সৰ্বাধিক ওজন:\n• ${fmtDate(heaviest.date)}\n• ${heaviest.weight} কি:গ্ৰা:`;
  }

  // ── ধন্যবাদ ──
  if (m.match(/ধন্যবাদ|thanks|thank|ভাল|সুন্দৰ|বাঢ়িয়া/)) {
    return `কামত আহিলে ভাল লাগিল! 😊🍃\n\nআন কিবা জানিব বিচাৰিলে সুধিব!`;
  }

  // ── সহায় ──
  if (m.match(/help|সহায়|কি কৰিব|কি সুধিব|menu/)) {
    return `🤖 মই এইবোৰ ক'ব পাৰোঁ:\n\n• "শেষ তথ্য দেখুৱাওক"\n• "বাকী কিমান আছে"\n• "এই মাহৰ তথ্য"\n• "মুঠ উপাৰ্জন"\n• "এডভান্স বিৱৰণ"\n• "পাতৰ ওজন"\n• "হাৰ কিমান"\n• "সম্পূৰ্ণ হিচাব"`;
  }

  // ── default fallback ──
  return `বুজিব পৰা নাই! 😅\n\nএইবোৰ চেষ্টা কৰক:\n• "সম্পূৰ্ণ হিচাব"\n• "বাকী পৰিমাণ"\n• "শেষ তথ্য"\n• "এই মাহৰ তথ্য"\n\nবা "সহায়" লিখক!`;
};

export default function AIChatPage({ user }) {
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

  const quickBtns = [
    { label: "শেষ তথ্য", msg: "শেষ তথ্য" },
    { label: "বাকী পৰিমাণ", msg: "বাকী" },
    { label: "এই মাহ", msg: "এই মাহ" },
    { label: "মুঠ উপাৰ্জন", msg: "উপাৰ্জন" },
    { label: "এডভান্স", msg: "এডভান্স" },
    { label: "সম্পূৰ্ণ হিচাব", msg: "সম্পূৰ্ণ হিচাব" },
  ];

  const startChat = (msg) => {
    setStarted(true);
    setMessages([{ role: "user", text: msg }]);
    setTyping(true);
    setTimeout(() => {
      setMessages(p => [...p, { role: "bot", text: generateReply(msg, entries) }]);
      setTyping(false);
    }, 500);
  };

  const sendMessage = (text) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput("");
    setMessages(p => [...p, { role: "user", text: msg }]);
    setTyping(true);
    setTimeout(() => {
      setMessages(p => [...p, { role: "bot", text: generateReply(msg, entries) }]);
      setTyping(false);
    }, 500);
  };

  // ── WELCOME SCREEN (before chat starts) ──
  if (!started) {
    return (
      <div style={styles.welcomePage}>
        <div style={styles.welcomeTop}>
          <div style={styles.welcomeIcon}>🍃</div>
          <h2 style={styles.welcomeTitle}>চাহ বাগান সহায়ক</h2>
          <p style={styles.welcomeSub}>আপোনাৰ তথ্যৰ বিষয়ে যিকোনো কথা সুধিব পাৰে</p>
        </div>

        <div style={styles.helpCard}>
          <div style={styles.helpTitle}>📋 কি কি সুধিব পাৰে?</div>
          {[
            ["📌", "শেষ তথ্য", "শেষবাৰ কিমান পাত দিছিল"],
            ["💰", "উপাৰ্জন", "মুঠ কিমান টকা পালোঁ"],
            ["💳", "বাকী পৰিমাণ", "কিমান টকা পোৱা বাকী"],
            ["📅", "এই মাহ", "এই মাহৰ সম্পূৰ্ণ তথ্য"],
            ["💵", "এডভান্স", "কিমান এডভান্স কটা হৈছে"],
            ["📊", "সম্পূৰ্ণ হিচাব", "সকলো তথ্যৰ সাৰাংশ"],
          ].map(([icon, title, desc]) => (
            <button key={title} onClick={() => startChat(title)} style={styles.helpRow}>
              <span style={styles.helpRowIcon}>{icon}</span>
              <div style={styles.helpRowText}>
                <div style={styles.helpRowTitle}>{title}</div>
                <div style={styles.helpRowDesc}>{desc}</div>
              </div>
              <span style={styles.helpRowArrow}>›</span>
            </button>
          ))}
        </div>


        <style>{`@keyframes blink{0%,80%,100%{opacity:.2;transform:scale(0.8)}40%{opacity:1;transform:scale(1)}}`}</style>
      </div>
    );
  }

  // ── CHAT SCREEN ──
  return (
    <div style={styles.page}>
      {/* Quick buttons */}
      <div style={styles.quickScroll}>
        <button onClick={() => { setStarted(false); setMessages([]); }} style={styles.backBtn}>← ঘূৰি যাওক</button>
        {quickBtns.map(q => (
          <button key={q.label} onClick={() => sendMessage(q.msg)} style={styles.quickBtn}>{q.label}</button>
        ))}
      </div>

      <div style={styles.messages}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: "10px" }}>
            {msg.role === "bot" && <div style={styles.avatar}>🍃</div>}
            <div style={{
              ...styles.bubble,
              background: msg.role === "user" ? "linear-gradient(135deg,#1a3a1a,#2d5a27)" : "white",
              color: msg.role === "user" ? "white" : "#1a1a1a",
              borderBottomRightRadius: msg.role === "user" ? "4px" : "18px",
              borderBottomLeftRadius: msg.role === "bot" ? "4px" : "18px",
              boxShadow: msg.role === "bot" ? "0 2px 10px rgba(0,0,0,0.08)" : "none",
            }}>
              {msg.text.split("\n").map((line, j) => (
                <span key={j}>{line}{j < msg.text.split("\n").length - 1 && <br />}</span>
              ))}
            </div>
          </div>
        ))}
        {typing && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <div style={styles.avatar}>🍃</div>
            <div style={{ ...styles.bubble, background: "white", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}>
              <div style={{ display: "flex", gap: "4px", padding: "2px 0" }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#9ca3af", animation: `blink 1.2s ${i*0.2}s infinite` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={styles.inputRow}>
        <input
          type="text" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="যিকোনো প্ৰশ্ন লিখক..."
          style={styles.textInput}
        />
        <button onClick={() => sendMessage()} disabled={!input.trim()} style={{ ...styles.sendBtn, opacity: input.trim() ? 1 : 0.5 }}>➤</button>
      </div>
      <style>{`@keyframes blink{0%,80%,100%{opacity:.2;transform:scale(0.8)}40%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

const styles = {
  // Welcome screen
  welcomePage: { minHeight: "calc(100vh - 120px)", background: "#f0f4f0", padding: "20px 16px 100px", fontFamily: "'Segoe UI', sans-serif", display: "flex", flexDirection: "column", gap: "16px" },
  welcomeTop: { textAlign: "center", padding: "24px 0 8px" },
  welcomeIcon: { fontSize: "56px", marginBottom: "10px" },
  welcomeTitle: { fontSize: "22px", fontWeight: "900", color: "#1a3a1a", margin: "0 0 6px" },
  welcomeSub: { fontSize: "13px", color: "#6b7280", margin: 0 },
  helpCard: { background: "white", borderRadius: "18px", boxShadow: "0 4px 20px rgba(0,0,0,0.07)", overflow: "hidden" },
  helpTitle: { fontSize: "13px", fontWeight: "800", color: "#6b7280", padding: "14px 16px 10px", borderBottom: "1px solid #f3f4f6" },
  helpRow: { display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", background: "white", border: "none", borderBottom: "1px solid #f9fafb", width: "100%", cursor: "pointer", fontFamily: "inherit", textAlign: "left" },
  helpRowIcon: { fontSize: "22px", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "#f0fdf4", borderRadius: "10px", flexShrink: 0 },
  helpRowText: { flex: 1 },
  helpRowTitle: { fontSize: "14px", fontWeight: "800", color: "#1a3a1a" },
  helpRowDesc: { fontSize: "12px", color: "#9ca3af", marginTop: "2px" },
  helpRowArrow: { fontSize: "22px", color: "#d1d5db", fontWeight: "300" },
  orDivider: { textAlign: "center", fontSize: "12px", color: "#9ca3af", fontWeight: "600" },
  welcomeInput: { display: "flex", gap: "10px" },
  // Chat screen
  page: { display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", background: "#f0f4f0", fontFamily: "'Segoe UI', sans-serif" },
  quickScroll: { display: "flex", gap: "8px", padding: "10px 12px", overflowX: "auto", background: "white", borderBottom: "1px solid #e5e7eb", flexShrink: 0 },
  backBtn: { background: "#f3f4f6", border: "none", color: "#374151", padding: "7px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" },
  quickBtn: { background: "#f0fdf4", border: "1.5px solid #86efac", color: "#166534", padding: "7px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" },
  messages: { flex: 1, overflowY: "auto", padding: "16px 12px" },
  avatar: { width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#1a3a1a,#2d5a27)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", flexShrink: 0, marginRight: "8px", alignSelf: "flex-end" },
  bubble: { maxWidth: "82%", padding: "12px 16px", borderRadius: "18px", fontSize: "14px", lineHeight: "1.7" },
  inputRow: { padding: "10px 12px", background: "white", borderTop: "1px solid #e5e7eb", display: "flex", gap: "10px", flexShrink: 0 },
  textInput: { flex: 1, padding: "12px 16px", borderRadius: "24px", border: "2px solid #e5e7eb", fontSize: "15px", outline: "none", fontFamily: "inherit" },
  sendBtn: { width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#1a3a1a,#2d5a27)", color: "white", border: "none", fontSize: "18px", cursor: "pointer", flexShrink: 0 },
};
