import React, { useState, useRef, useEffect, useCallback } from "react";
import { auth, db } from "../firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";

const generateReply = (msg, entries) => {
  const m = msg.toLowerCase().trim();

  if (entries.length === 0) {
    return "Bhai abhi koi entry nahi hai! Pehle Entry tab se patta add karo 🍃";
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

  const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("hi-IN", { day: "numeric", month: "long", year: "numeric" }) : "N/A";
  const fmtRs = (n) => "Rs " + (n || 0).toFixed(0);

  // ── Greetings ──
  if (m.match(/^(hi|hello|hii|hey|helo|namaste|namaskar|hola|kya haal|kaise ho|kya chal)/)) {
    const h = new Date().getHours();
    const greet = h < 12 ? "Subah ki chai ☕" : h < 17 ? "Dopahar ka waqt 🌞" : "Shaam ka waqt 🌆";
    return `${greet}\n\nNameste! 🙏 Main aapka Chai Bagan assistant hoon.\n\nAap kuch bhi pooch sakte ho:\n• Kamaai, balance, advance\n• Is mahine ka haal\n• Patta wajan ya rate\n• Poora hisaab\n• Koi bhi entry details`;
  }

  // ── Last / Aakhri entry ──
  if (m.match(/aakhri|last|latest|recent|pichli|naya|nai|abhi|kal|aaj ki|recent/)) {
    return `📌 Aakhri Entry\n\n📅 Tarikh: ${fmtDate(latest.date)}\n⚖️ Wajan: ${latest.weight} kg\n💲 Rate: ${latest.rate ? fmtRs(latest.rate) + "/kg" : "Set nahi"}\n💰 Kul Raqam: ${fmtRs(latest.totalAmount)}\n✂️ Advance Kata: ${fmtRs(latest.advanceCut)}\n💵 Mili Raqam: ${fmtRs(latest.amountReceived)}\n🟢 Baaki: ${fmtRs(latest.balanceAmount)}\n${latest.notes ? "📝 Note: " + latest.notes : ""}`;
  }

  // ── Balance ──
  if (m.match(/baaki|balance|baki|kitna milna|remaining|bcha|bacha/)) {
    return `💳 Baaki Balance\n\n${fmtRs(totalBalance)}\n\n• Kul kamaai: ${fmtRs(totalAmount)}\n• Mili raqam: ${fmtRs(totalReceived)}\n• Advance kata: ${fmtRs(totalAdvance)}\n\n${totalBalance > 0 ? "✅ Paisa milna baaki hai" : totalBalance < 0 ? "⚠️ Zyada paise mil gaye!" : "✅ Hisaab barabar hai"}`;
  }

  // ── Advance ──
  if (m.match(/advance|peshgi|udhar|udhaar/)) {
    return `💵 Advance Details\n\nKul advance kata: ${fmtRs(totalAdvance)}\n\n${entries.filter(e => e.advanceCut > 0).slice(0, 5).map(e =>
      `• ${fmtDate(e.date)}: ${fmtRs(e.advanceCut)}`
    ).join("\n")}\n\n${entries.filter(e => e.advanceCut > 0).length > 5 ? `...aur ${entries.filter(e => e.advanceCut > 0).length - 5} aur entries` : ""}`;
  }

  // ── Is mahine ──
  if (m.match(/mahine|month|is baar|aaj kal|current|abhi tak/)) {
    const mName = new Date().toLocaleString("hi-IN", { month: "long", year: "numeric" });
    if (monthEntries.length === 0) return `📅 ${mName} mein abhi tak koi entry nahi hai.\n\nEntry tab se nayi entry add karo!`;
    return `📅 ${mName}\n\n⚖️ Kul wajan: ${monthWeight.toFixed(1)} kg\n💰 Kamaai: ${fmtRs(monthAmount)}\n🟢 Baaki: ${fmtRs(monthBalance)}\n📋 Entries: ${monthEntries.length}\n\nSabse recent: ${fmtDate(sorted.find(e => e.date && e.date.startsWith(thisMonth))?.date)}`;
  }

  // ── Rate ──
  if (m.match(/rate|bhav|dam|kitne ka|kilo/)) {
    if (!latestWithRate) return "Abhi kisi entry mein rate set nahi hai.\nRecords tab se entry edit karke rate daalo!";
    return `📊 Rate Details\n\n• Recent rate: ${fmtRs(latestWithRate.rate)}/kg\n• Average rate: Rs ${avgRate.toFixed(1)}/kg\n• Sabse zyada: Rs ${Math.max(...withRate.map(e => e.rate))}/kg\n• Sabse kam: Rs ${Math.min(...withRate.map(e => e.rate))}/kg\n• Rate wali entries: ${withRate.length}/${entries.length}`;
  }

  // ── Wajan / Patta ──
  if (m.match(/wajan|weight|kg|patta|kitna patta|bika/)) {
    const best = sorted.reduce((a, b) => (b.weight || 0) > (a.weight || 0) ? b : a, sorted[0]);
    return `⚖️ Patta Wajan\n\n• Kul wajan: ${totalWeight.toFixed(1)} kg\n• Total entries: ${entries.length}\n• Avg per entry: ${(totalWeight / entries.length).toFixed(1)} kg\n• Sabse badi entry: ${best.weight} kg (${fmtDate(best.date)})\n• Is mahine: ${monthWeight.toFixed(1)} kg`;
  }

  // ── Kamaai ──
  if (m.match(/kamai|kamaai|kamaya|paisa|paise|kitna mila|income|earning|raqam/)) {
    return `💰 Kamaai Ka Hisaab\n\n• Kul kamaai: ${fmtRs(totalAmount)}\n• Mili raqam: ${fmtRs(totalReceived)}\n• Baaki balance: ${fmtRs(totalBalance)}\n• Advance kata: ${fmtRs(totalAdvance)}\n\n📅 Is mahine: ${fmtRs(monthAmount)}`;
  }

  // ── Entries count ──
  if (m.match(/kitni entry|entries|record|log|kitni baar|count/)) {
    return `📋 Entry Details\n\n• Total entries: ${entries.length}\n• Is mahine: ${monthEntries.length}\n• Rate wali entries: ${withRate.length}\n• Pehli entry: ${fmtDate(sorted[sorted.length - 1]?.date)}\n• Aakhri entry: ${fmtDate(latest.date)}`;
  }

  // ── Summary / Poora hisaab ──
  if (m.match(/summary|sab|poora|report|hisaab|detail|sab kuch|bata|batao/)) {
    return `📊 Poora Hisaab\n\n🍃 Patta\n• Kul wajan: ${totalWeight.toFixed(1)} kg\n• Total entries: ${entries.length}\n• Average: ${(totalWeight / entries.length).toFixed(1)} kg/entry\n\n💰 Paisa\n• Kul kamaai: ${fmtRs(totalAmount)}\n• Mili raqam: ${fmtRs(totalReceived)}\n• Advance kata: ${fmtRs(totalAdvance)}\n• 🟢 Baaki: ${fmtRs(totalBalance)}\n\n📅 Is Mahine\n• ${monthEntries.length} entries\n• ${monthWeight.toFixed(1)} kg\n• ${fmtRs(monthAmount)} kamaai`;
  }

  // ── Sabse badi / best ──
  if (m.match(/sabse|best|badi|bada|zyada|max|highest/)) {
    const best = sorted.reduce((a, b) => (b.totalAmount || 0) > (a.totalAmount || 0) ? b : a, sorted[0]);
    const heaviest = sorted.reduce((a, b) => (b.weight || 0) > (a.weight || 0) ? b : a, sorted[0]);
    return `🏆 Sabse Badi Entries\n\n💰 Sabse zyada kamaai:\n• ${fmtDate(best.date)}\n• ${best.weight} kg @ Rs${best.rate}/kg\n• ${fmtRs(best.totalAmount)}\n\n⚖️ Sabse zyada wajan:\n• ${fmtDate(heaviest.date)}\n• ${heaviest.weight} kg`;
  }

  // ── Help ──
  if (m.match(/help|kya kar|madad|kya pooch|options|menu/)) {
    return `🤖 Main yeh sab bata sakta hoon:\n\n• "Aakhri entry dikhao"\n• "Baaki balance kitna hai"\n• "Is mahine ka haal"\n• "Kul kamaai"\n• "Advance details"\n• "Patta wajan"\n• "Rate kya hai"\n• "Poora hisaab"\n• "Sabse badi entry"`;
  }

  // ── Shukriya ──
  if (m.match(/shukriya|thanks|thank|dhanyawad|theek|great|acha|accha|badiya|wah/)) {
    return `Khushi hui kaam aaya! 😊🍃\n\nAur kuch poochna ho toh batao!`;
  }

  // ── Default smart fallback ──
  const keywords = m.split(/\s+/);
  for (const word of keywords) {
    if (word.match(/paisa|paise|rs|rupee/)) return generateReply("kamaai", entries);
    if (word.match(/patta|chai|tea/)) return generateReply("wajan", entries);
    if (word.match(/din|date|tarikh/)) return generateReply("aakhri entry", entries);
  }

  return `Samajh nahi aaya! 😅\n\nYeh try karo:\n• "Poora hisaab batao"\n• "Baaki balance"\n• "Aakhri entry"\n• "Is mahine ka data"\n\nYa "help" likho!`;
};

export default function AIChatPage({ user }) {
  const [messages, setMessages] = useState([{
    role: "bot",
    text: "Namaste! 🍃 Main aapka Chai Bagan assistant hoon.\n\nApni entries ke baare mein kuch bhi poochho!\n\n• Kamaai, balance, advance\n• Is mahine ka haal\n• Aakhri entry details\n• Poora summary",
  }]);
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

  const quickBtns = ["Poora hisaab", "Baaki balance", "Aakhri entry", "Is mahine", "Advance", "Kamaai"];

  return (
    <div style={styles.page}>
      <div style={styles.quickScroll}>
        {quickBtns.map(q => (
          <button key={q} onClick={() => sendMessage(q)} style={styles.quickBtn}>{q}</button>
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
          placeholder="Kuch bhi poochho..."
          style={styles.textInput}
        />
        <button onClick={() => sendMessage()} disabled={!input.trim()} style={{ ...styles.sendBtn, opacity: input.trim() ? 1 : 0.5 }}>➤</button>
      </div>
      <style>{`@keyframes blink{0%,80%,100%{opacity:.2;transform:scale(0.8)}40%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

const styles = {
  page: { display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", background: "#f0f4f0", fontFamily: "'Segoe UI', sans-serif" },
  quickScroll: { display: "flex", gap: "8px", padding: "10px 12px", overflowX: "auto", background: "white", borderBottom: "1px solid #e5e7eb", flexShrink: 0 },
  quickBtn: { background: "#f0fdf4", border: "1.5px solid #86efac", color: "#166534", padding: "7px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" },
  messages: { flex: 1, overflowY: "auto", padding: "16px 12px" },
  avatar: { width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#1a3a1a,#2d5a27)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", flexShrink: 0, marginRight: "8px", alignSelf: "flex-end" },
  bubble: { maxWidth: "82%", padding: "12px 16px", borderRadius: "18px", fontSize: "14px", lineHeight: "1.7" },
  inputRow: { padding: "10px 12px", background: "white", borderTop: "1px solid #e5e7eb", display: "flex", gap: "10px", flexShrink: 0 },
  textInput: { flex: 1, padding: "12px 16px", borderRadius: "24px", border: "2px solid #e5e7eb", fontSize: "15px", outline: "none", fontFamily: "inherit" },
  sendBtn: { width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#1a3a1a,#2d5a27)", color: "white", border: "none", fontSize: "18px", cursor: "pointer", flexShrink: 0 },
};
