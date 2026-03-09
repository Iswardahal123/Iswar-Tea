import React, { useState, useRef, useEffect, useCallback } from "react";
import { auth, db } from "../firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";

// Smart local chatbot - no API needed
const generateReply = (msg, entries) => {
  const m = msg.toLowerCase();
  const totalWeight    = entries.reduce((s, e) => s + (e.weight || 0), 0);
  const totalAmount    = entries.reduce((s, e) => s + (e.totalAmount || 0), 0);
  const totalReceived  = entries.reduce((s, e) => s + (e.amountReceived || 0), 0);
  const totalAdvance   = entries.reduce((s, e) => s + (e.advanceCut || 0), 0);
  const totalBalance   = entries.reduce((s, e) => s + (e.balanceAmount || 0), 0);

  // Sort by date
  const sorted = [...entries].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const latest = sorted[0];
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthEntries = entries.filter(e => e.date && e.date.startsWith(thisMonth));
  const monthWeight = monthEntries.reduce((s, e) => s + (e.weight || 0), 0);
  const monthAmount = monthEntries.reduce((s, e) => s + (e.totalAmount || 0), 0);

  if (entries.length === 0) {
    return "Bhai abhi koi entry nahi hai! Pehle Entry tab se patta add karo 🍃";
  }

  // Greetings
  if (m.match(/^(hi|hello|hii|helo|namaste|namaskar|hey|hola)/)) {
    return `Namaste! 🙏 Main aapka Chai Bagan assistant hoon.\n\nAap mujhse pooch sakte ho:\n• Kul kamaai kitni hai?\n• Is mahine kitna patta bika?\n• Baaki balance kitna hai?\n• Kitni entries hain?\n• Aakhri entry kab thi?`;
  }

  // Total earnings
  if (m.match(/kul|total|poori|sabse|kamai|kamaai|kamaya|kitna mila|kitna hua/)) {
    if (m.match(/kamai|kamaai|kamaya|mila|amount|raqam|paisa|paise/)) {
      return `💰 Aapki kul kamaai:\n\nRs ${totalAmount.toFixed(0)}\n\n• Mili raqam: Rs ${totalReceived.toFixed(0)}\n• Baaki balance: Rs ${totalBalance.toFixed(0)}\n• Total advance kata: Rs ${totalAdvance.toFixed(0)}`;
    }
    if (m.match(/wajan|weight|patta|kg/)) {
      return `⚖️ Kul patta wajan:\n\n${totalWeight.toFixed(1)} kg\n\n${entries.length} entries mein total`;
    }
  }

  // Balance
  if (m.match(/baaki|balance|baki|remaining|bachha|bacha/)) {
    return `💳 Aapka baaki balance:\n\nRs ${totalBalance.toFixed(0)}\n\n• Kul kamaai: Rs ${totalAmount.toFixed(0)}\n• Mili raqam: Rs ${totalReceived.toFixed(0)}\n• Advance kata: Rs ${totalAdvance.toFixed(0)}`;
  }

  // This month
  if (m.match(/mahine|month|is baar|aaj kal|abhi|current/)) {
    const mName = new Date().toLocaleString("hi-IN", { month: "long" });
    if (monthEntries.length === 0) {
      return `📅 Is mahine (${mName}) abhi tak koi entry nahi hai.`;
    }
    return `📅 Is mahine (${mName}):\n\n• Entries: ${monthEntries.length}\n• Wajan: ${monthWeight.toFixed(1)} kg\n• Kamaai: Rs ${monthAmount.toFixed(0)}`;
  }

  // Weight / patta
  if (m.match(/wajan|weight|kg|patta/)) {
    return `⚖️ Patta wajan summary:\n\n• Kul wajan: ${totalWeight.toFixed(1)} kg\n• Total entries: ${entries.length}\n• Average per entry: ${(totalWeight / entries.length).toFixed(1)} kg`;
  }

  // Advance
  if (m.match(/advance|peshgi|udhar/)) {
    return `💵 Advance details:\n\n• Total advance kata: Rs ${totalAdvance.toFixed(0)}\n• Baaki balance: Rs ${totalBalance.toFixed(0)}`;
  }

  // Entries count
  if (m.match(/kitni|kitna|entry|entries|record|log/)) {
    return `📋 Aapki entries:\n\n• Total entries: ${entries.length}\n• Is mahine: ${monthEntries.length} entries\n• Kul wajan: ${totalWeight.toFixed(1)} kg`;
  }

  // Latest entry
  if (m.match(/aakhri|last|latest|recent|pichli|abhi|naya/)) {
    if (!latest) return "Koi entry nahi mili!";
    return `📌 Aakhri entry:\n\n• Tarikh: ${new Date(latest.date).toLocaleDateString("hi-IN", { day: "numeric", month: "long", year: "numeric" })}\n• Wajan: ${latest.weight} kg\n• Rate: Rs ${latest.rate || "N/A"}/kg\n• Kamaai: Rs ${(latest.totalAmount || 0).toFixed(0)}\n• Baaki: Rs ${(latest.balanceAmount || 0).toFixed(0)}`;
  }

  // Rate
  if (m.match(/rate|bhav|dam/)) {
    const withRate = entries.filter(e => e.rate > 0);
    if (withRate.length === 0) return "Abhi kisi entry mein rate set nahi hai. Records tab se edit karo!";
    const avgRate = withRate.reduce((s, e) => s + e.rate, 0) / withRate.length;
    const latestRate = sorted.find(e => e.rate > 0);
    return `📊 Rate details:\n\n• Sabse recent rate: Rs ${latestRate ? latestRate.rate : "N/A"}/kg\n• Average rate: Rs ${avgRate.toFixed(1)}/kg\n• Rate wali entries: ${withRate.length}`;
  }

  // Summary / sab kuch
  if (m.match(/summary|sab|poora|report|hisaab|detail/)) {
    return `📊 Poora Hisaab:\n\n🍃 Patta\n• Kul wajan: ${totalWeight.toFixed(1)} kg\n• Total entries: ${entries.length}\n\n💰 Paisa\n• Kul kamaai: Rs ${totalAmount.toFixed(0)}\n• Mili raqam: Rs ${totalReceived.toFixed(0)}\n• Advance kata: Rs ${totalAdvance.toFixed(0)}\n• Baaki balance: Rs ${totalBalance.toFixed(0)}\n\n📅 Is mahine\n• ${monthEntries.length} entries • ${monthWeight.toFixed(1)} kg`;
  }

  // Help
  if (m.match(/help|kya|madad|pooch|sakt/)) {
    return `🤖 Main yeh poochhe ka jawab de sakta hoon:\n\n• Kul kamaai\n• Baaki balance\n• Is mahine ka data\n• Advance details\n• Patta wajan\n• Aakhri entry\n• Rate details\n• Poora summary`;
  }

  // Default
  return `Samajh nahi aaya bhai! 😅\n\nYeh try karo:\n• "Kul kamaai kitni hai?"\n• "Baaki balance batao"\n• "Is mahine kitna patta bika?"\n• "Poora summary do"`;
};

export default function AIChatPage({ user }) {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Namaste! 🍃 Main aapka Chai Bagan assistant hoon.\n\nAap mujhse apni entries ke baare mein kuch bhi pooch sakte ho!\n\n• Kul kamaai\n• Baaki balance\n• Is mahine ka data\n• Advance details\n• Poora summary",
    },
  ]);
  const [input, setInput] = useState("");
  const [entries, setEntries] = useState([]);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const loadEntries = useCallback(async () => {
    try {
      const currentUser = user || auth.currentUser;
      if (!currentUser) return;
      const q = query(collection(db, "entries"), where("uid", "==", currentUser.uid));
      const snap = await getDocs(q);
      setEntries(snap.docs.map(d => d.data()));
    } catch (err) { console.error(err); }
  }, [user]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput("");

    // Add user message
    setMessages(prev => [...prev, { role: "user", text: msg }]);
    setTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const reply = generateReply(msg, entries);
      setMessages(prev => [...prev, { role: "bot", text: reply }]);
      setTyping(false);
    }, 600);
  };

  const quickBtns = [
    "Kul kamaai", "Baaki balance", "Is mahine", "Poora summary", "Aakhri entry", "Advance"
  ];

  return (
    <div style={styles.page}>

      {/* Quick Buttons */}
      <div style={styles.quickScroll}>
        {quickBtns.map(q => (
          <button key={q} onClick={() => sendMessage(q)} style={styles.quickBtn}>{q}</button>
        ))}
      </div>

      {/* Messages */}
      <div style={styles.messages}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: "10px" }}>
            {msg.role === "bot" && <div style={styles.botAvatar}>🍃</div>}
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
            <div style={styles.botAvatar}>🍃</div>
            <div style={{ ...styles.bubble, background: "white", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}>
              <div style={styles.typingDots}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ ...styles.dot, animationDelay: i * 0.2 + "s" }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={styles.inputRow}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Kuch bhi poochho..."
          style={styles.textInput}
        />
        <button onClick={() => sendMessage()} disabled={!input.trim()} style={{ ...styles.sendBtn, opacity: input.trim() ? 1 : 0.5 }}>
          ➤
        </button>
      </div>

      <style>{`
        @keyframes blink { 0%,80%,100%{opacity:.2;transform:scale(0.8)} 40%{opacity:1;transform:scale(1)} }
      `}</style>
    </div>
  );
}

const styles = {
  page: { display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", background: "#f0f4f0", fontFamily: "'Segoe UI', sans-serif" },
  quickScroll: { display: "flex", gap: "8px", padding: "10px 12px", overflowX: "auto", background: "white", borderBottom: "1px solid #e5e7eb", flexShrink: 0 },
  quickBtn: { background: "#f0fdf4", border: "1.5px solid #86efac", color: "#166534", padding: "7px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" },
  messages: { flex: 1, overflowY: "auto", padding: "16px 12px", paddingBottom: "10px" },
  botAvatar: { width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#1a3a1a,#2d5a27)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0, marginRight: "8px", alignSelf: "flex-end" },
  bubble: { maxWidth: "80%", padding: "12px 16px", borderRadius: "18px", fontSize: "14px", lineHeight: "1.7", whiteSpace: "pre-wrap" },
  typingDots: { display: "flex", gap: "4px", padding: "2px 4px" },
  dot: { width: 8, height: 8, borderRadius: "50%", background: "#9ca3af", animation: "blink 1.2s ease-in-out infinite" },
  inputRow: { padding: "10px 12px", background: "white", borderTop: "1px solid #e5e7eb", display: "flex", gap: "10px", flexShrink: 0 },
  textInput: { flex: 1, padding: "12px 16px", borderRadius: "24px", border: "2px solid #e5e7eb", fontSize: "15px", outline: "none", fontFamily: "inherit" },
  sendBtn: { width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#1a3a1a,#2d5a27)", color: "white", border: "none", fontSize: "18px", cursor: "pointer", flexShrink: 0 },
};
