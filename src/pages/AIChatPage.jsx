// 🤖 AIChatPage.jsx - Multi Gemini API with auto rotation
import React, { useState, useRef, useEffect } from "react";
import { db } from "../firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";

// 🔑 Multiple Gemini API Keys - ek khatam toh dusra use hoga
const GEMINI_KEYS = [
  process.env.REACT_APP_GEMINI_KEY_1,
  process.env.REACT_APP_GEMINI_KEY_2,
  process.env.REACT_APP_GEMINI_KEY_3,
].filter(k => k && k.length > 10);

// Debug: console mein keys ka status dikhao
console.log("Gemini keys loaded:", GEMINI_KEYS.length, GEMINI_KEYS.map(k => k ? k.slice(0,8)+"..." : "MISSING"));

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// Key rotation - exhausted keys track karo
let currentKeyIndex = 0;

const callGeminiWithRotation = async (prompt) => {
  const totalKeys = GEMINI_KEYS.length;
  if (totalKeys === 0) {
    throw new Error("Koi Gemini API key nahi mili! Vercel pe REACT_APP_GEMINI_KEY_1 set karo aur redeploy karo.");
  }
  let attempts = 0;

  while (attempts < totalKeys) {
    const key = GEMINI_KEYS[currentKeyIndex];
    try {
      const res = await fetch(`${GEMINI_URL}?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 250, temperature: 0.7 },
        }),
      });

      const data = await res.json();

      // Rate limit ya quota khatam
      if (res.status === 429 || res.status === 503 || data.error?.code === 429) {
        console.log(`Key ${currentKeyIndex + 1} ka limit khatam, next key try kar raha hoon...`);
        currentKeyIndex = (currentKeyIndex + 1) % totalKeys;
        attempts++;
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      if (data.error) {
        throw new Error(data.error.message);
      }

      return data.candidates?.[0]?.content?.parts?.[0]?.text || "Koi jawab nahi mila.";
    } catch (err) {
      if (err.message.includes("quota") || err.message.includes("limit")) {
        currentKeyIndex = (currentKeyIndex + 1) % totalKeys;
        attempts++;
        continue;
      }
      throw err;
    }
  }
  throw new Error("Saari API keys ka limit khatam ho gaya! Thodi der baad try karo.");
};

export default function AIChatPage({ user }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Namaste! Main aapka Chai Bagan AI Sahayak hoon. Apni tea entries ke baare mein kuch bhi poochho!\n\nJaise:\n- Is mahine kitna patta bika?\n- Kul kamaai kitni hai?\n- Total baaki raqam?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [allEntries, setAllEntries] = useState([]);
  const [entriesLoaded, setEntriesLoaded] = useState(false);
  const [activeKey, setActiveKey] = useState(1);
  const bottomRef = useRef(null);

  useEffect(() => {
    const loadEntries = async () => {
      try {
        const currentUser = user || { uid: null };
        if (!currentUser.uid) return;
        const q = query(
          collection(db, "entries"),
          where("uid", "==", currentUser.uid)
        );
        const snap = await getDocs(q);
        setAllEntries(snap.docs.map((d) => d.data()));
        setEntriesLoaded(true);
      } catch (err) {
        console.error(err);
        setEntriesLoaded(true);
      }
    };
    loadEntries();
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const buildPrompt = (userMessage) => {
    // Only last 10 entries to keep prompt small
    const recentEntries = [...allEntries].sort((a,b) => (b.date||"").localeCompare(a.date||"")).slice(0, 10);
    const entrySummary = recentEntries.map((e) =>
      `${e.date}: ${e.weight}kg @Rs${e.rate}, Total:Rs${(e.totalAmount||0).toFixed(0)}, Bal:Rs${(e.balanceAmount||0).toFixed(0)}`
    ).join("\n");

    const totalWeight = allEntries.reduce((s, e) => s + (e.weight || 0), 0);
    const totalEarned = allEntries.reduce((s, e) => s + (e.totalAmount || 0), 0);
    const totalBalance = allEntries.reduce((s, e) => s + (e.balanceAmount || 0), 0);
    const totalAdvance = allEntries.reduce((s, e) => s + (e.advanceCut || 0), 0);

    return `Tu ek chai bagan (tea farm) ka AI assistant hai. Hinglish mein jawab de (Hindi+English mix), simple aur friendly.

USER KA DATA SUMMARY:
- Total Entries: ${allEntries.length}
- Kul Wajan: ${totalWeight.toFixed(1)} kg
- Kul Kamaai: Rs${totalEarned.toFixed(2)}
- Total Advance: Rs${totalAdvance.toFixed(2)}
- Kul Baaki: Rs${totalBalance.toFixed(2)}

SABHI ENTRIES:
${entrySummary || "Koi entry nahi hai abhi"}

USER KA SAWAAL: ${userMessage}

RULES:
- Hinglish mein jawab do
- Rs symbol use karo
- Numbers clearly batao
- Short aur helpful raho`;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const prompt = buildPrompt(input.trim());
      const reply = await callGeminiWithRotation(prompt);
      setActiveKey(currentKeyIndex + 1);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Maafi chahta hoon! " + err.message,
      }]);
    }
    setLoading(false);
  };

  const quickQuestions = [
    "Is mahine kitna patta bika?",
    "Kul kamaai kitni hai?",
    "Total baaki raqam?",
    "Sabse badi entry?",
  ];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.chatHeader}>
        <span style={{ fontSize: "30px" }}>🤖</span>
        <div>
          <div style={styles.botName}>AI Sahayak</div>
          <div style={styles.botStatus}>
            {entriesLoaded
              ? `✅ ${allEntries.length} entries • Key ${activeKey}/${GEMINI_KEYS.length} active`
              : "⏳ Data load ho raha hai..."}
          </div>
        </div>
      </div>

      {/* Quick Questions */}
      <div style={styles.quickRow}>
        {quickQuestions.map((q) => (
          <button key={q} onClick={() => setInput(q)} style={styles.quickBtn}>{q}</button>
        ))}
      </div>

      {/* Messages */}
      <div style={styles.messagesArea}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{
            ...styles.bubble,
            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
            background: msg.role === "user"
              ? "linear-gradient(135deg,#1a3a1a,#2d5a27)"
              : "white",
            color: msg.role === "user" ? "white" : "#1a1a1a",
            borderBottomRightRadius: msg.role === "user" ? "4px" : "18px",
            borderBottomLeftRadius: msg.role === "assistant" ? "4px" : "18px",
          }}>
            {msg.role === "assistant" && <span style={styles.aiLabel}>🍃 AI</span>}
            <p style={styles.msgText}>{msg.content}</p>
          </div>
        ))}

        {loading && (
          <div style={{ ...styles.bubble, alignSelf: "flex-start", background: "white" }}>
            <span style={styles.aiLabel}>🍃 AI</span>
            <div style={{ display: "flex", gap: "4px", padding: "4px 0" }}>
              {[0,1,2].map((i) => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: "50%", background: "#9ca3af",
                  animation: "bounce 1.2s ease-in-out " + (i*0.2) + "s infinite",
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={styles.inputArea}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Chai ke baare mein poochho..."
          style={styles.textInput}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()} style={styles.sendBtn}>
          {loading ? "⏳" : "➤"}
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}} />
    </div>
  );
}

const styles = {
  container: { display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", background: "#f0f4f0", fontFamily: "'Segoe UI', sans-serif" },
  chatHeader: { background: "linear-gradient(135deg,#1a3a1a,#2d5a27)", color: "white", padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px" },
  botName: { fontSize: "16px", fontWeight: "800" },
  botStatus: { fontSize: "11px", opacity: 0.8, marginTop: "1px" },
  quickRow: { display: "flex", gap: "8px", padding: "10px 12px", overflowX: "auto", background: "white", borderBottom: "1px solid #e5e7eb" },
  quickBtn: { background: "#f0fdf4", border: "1px solid #86efac", color: "#166534", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, fontFamily: "inherit" },
  messagesArea: { flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "10px", paddingBottom: "80px" },
  bubble: { maxWidth: "85%", padding: "12px 16px", borderRadius: "18px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  aiLabel: { fontSize: "11px", fontWeight: "700", opacity: 0.6, display: "block", marginBottom: "4px" },
  msgText: { margin: 0, fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap" },
  inputArea: { position: "fixed", bottom: "60px", left: 0, right: 0, padding: "10px 12px", background: "white", borderTop: "1px solid #e5e7eb", display: "flex", gap: "10px", boxShadow: "0 -2px 10px rgba(0,0,0,0.05)", maxWidth: "480px", margin: "0 auto" },
  textInput: { flex: 1, padding: "12px 16px", borderRadius: "24px", border: "2px solid #e5e7eb", fontSize: "15px", outline: "none", fontFamily: "inherit" },
  sendBtn: { width: "48px", height: "48px", borderRadius: "50%", background: "linear-gradient(135deg,#1a3a1a,#2d5a27)", color: "white", border: "none", fontSize: "18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
};
