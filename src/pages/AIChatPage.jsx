// 🤖 AIChatPage.jsx - AI Sahayak with OpenAI + Firebase data context
import React, { useState, useRef, useEffect } from "react";
import { auth, db } from "../firebase/config";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_KEY;
export default function AIChatPage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Namaste! 🍃 Main aapka Chai Bagan AI Sahayak hoon. Aap mujhse apni tea entries ke baare mein kuch bhi pooch sakte hain. Jaise:\n\n• Is mahine kitna patta bika?\n• Kul kamaai kitni hai?\n• Sabse zyada wajan kab tha?\n• Advance kata ke baad kitna milega?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [entriesLoaded, setEntriesLoaded] = useState(false);
  const [allEntries, setAllEntries] = useState([]);
  const bottomRef = useRef(null);

  // Load user's tea entries for AI context
  useEffect(() => {
    const loadEntries = async () => {
      try {
        const q = query(
          collection(db, "entries"),
          where("uid", "==", auth.currentUser.uid),
          orderBy("date", "desc")
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => d.data());
        setAllEntries(data);
        setEntriesLoaded(true);
      } catch (err) {
        console.error("Entries load error:", err);
        setEntriesLoaded(true);
      }
    };
    loadEntries();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const buildSystemPrompt = () => {
    const entrySummary = allEntries.map((e) =>
      `Date: ${e.date}, Weight: ${e.weight}kg, Rate: ₹${e.rate}/kg, Total: ₹${e.totalAmount?.toFixed(2)}, Advance Cut: ₹${e.advanceCut || 0}, Received: ₹${e.amountReceived || 0}, Balance: ₹${e.balanceAmount?.toFixed(2)}`
    ).join("\n");

    const totalWeight = allEntries.reduce((s, e) => s + (e.weight || 0), 0);
    const totalEarned = allEntries.reduce((s, e) => s + (e.totalAmount || 0), 0);
    const totalBalance = allEntries.reduce((s, e) => s + (e.balanceAmount || 0), 0);

    return `Tu ek chai bagan (tea farm) management assistant hai. Tujhe Hinglish mein (Hindi + English mix) baat karni hai - simple aur friendly.

USER KA DATA:
Total Entries: ${allEntries.length}
Kul Wajan: ${totalWeight.toFixed(1)} kg
Kul Kamaai: ₹${totalEarned.toFixed(2)}
Kul Baaki Raqam: ₹${totalBalance.toFixed(2)}

SABHI ENTRIES:
${entrySummary || "Abhi koi entry nahi hai"}

RULES:
- Hamesha Hinglish mein jawab do (Hindi + thodi English)
- Numbers ke saath ₹ symbol use karo
- Simple aur clear jawab do
- Agar calculation chahiye toh step by step batao
- Friendly aur helpful raho
- Agar koi baat data mein nahi hai toh seedha batao`;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: buildSystemPrompt() },
            ...newMessages.map((m) => ({ role: m.role, content: m.content })),
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      const aiReply = data.choices[0].message.content;
      setMessages((prev) => [...prev, { role: "assistant", content: aiReply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `❌ Error: ${err.message}\n\nCheck karo ki OpenAI API key sahi hai.`,
        },
      ]);
    }
    setLoading(false);
  };

  const quickQuestions = [
    "Is mahine kitna patta bika?",
    "Kul kamaai kitni hai?",
    "Sabse badi entry kaunsi hai?",
    "Total baaki raqam kitni hai?",
  ];

  return (
    <div style={styles.container}>
      {/* Chat Header */}
      <div style={styles.chatHeader}>
        <span style={styles.botIcon}>🤖</span>
        <div>
          <div style={styles.botName}>AI Sahayak</div>
          <div style={styles.botStatus}>
            {entriesLoaded ? `✅ ${allEntries.length} entries loaded` : "⏳ Data load ho raha hai..."}
          </div>
        </div>
      </div>

      {/* Quick Questions */}
      <div style={styles.quickRow}>
        {quickQuestions.map((q) => (
          <button
            key={q}
            onClick={() => { setInput(q); }}
            style={styles.quickBtn}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={styles.messagesArea}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              ...styles.messageBubble,
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              background: msg.role === "user"
                ? "linear-gradient(135deg, #1a3a1a, #2d5a27)"
                : "white",
              color: msg.role === "user" ? "white" : "#1a1a1a",
              borderBottomRightRadius: msg.role === "user" ? "4px" : "18px",
              borderBottomLeftRadius: msg.role === "assistant" ? "4px" : "18px",
            }}
          >
            {msg.role === "assistant" && <span style={styles.aiLabel}>🍃 AI</span>}
            <p style={styles.messageText}>{msg.content}</p>
          </div>
        ))}

        {loading && (
          <div style={{ ...styles.messageBubble, alignSelf: "flex-start", background: "white" }}>
            <span style={styles.aiLabel}>🍃 AI</span>
            <div style={styles.typing}>
              <span>•</span><span>•</span><span>•</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div style={styles.inputArea}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Kuch poochho apni chai ke baare mein..."
          style={styles.textInput}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={styles.sendBtn}
        >
          {loading ? "⏳" : "➤"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "calc(100vh - 120px)",
    background: "#f0f4f0",
    fontFamily: "'Segoe UI', sans-serif",
    position: "relative",
  },
  chatHeader: {
    background: "linear-gradient(135deg, #1a3a1a, #2d5a27)",
    color: "white",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  botIcon: { fontSize: "32px" },
  botName: { fontSize: "16px", fontWeight: "800" },
  botStatus: { fontSize: "11px", opacity: 0.8 },
  quickRow: {
    display: "flex",
    gap: "8px",
    padding: "10px 12px",
    overflowX: "auto",
    background: "white",
    borderBottom: "1px solid #e5e7eb",
  },
  quickBtn: {
    background: "#f0fdf4",
    border: "1px solid #86efac",
    color: "#166534",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  messagesArea: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    paddingBottom: "80px",
  },
  messageBubble: {
    maxWidth: "85%",
    padding: "12px 16px",
    borderRadius: "18px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  aiLabel: { fontSize: "11px", fontWeight: "700", opacity: 0.6, display: "block", marginBottom: "4px" },
  messageText: { margin: 0, fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap" },
  typing: {
    display: "flex",
    gap: "4px",
    padding: "4px 0",
    "& span": {
      width: "8px",
      height: "8px",
      background: "#9ca3af",
      borderRadius: "50%",
      display: "inline-block",
    }
  },
  inputArea: {
    position: "fixed",
    bottom: "60px",
    left: 0,
    right: 0,
    padding: "10px 12px",
    background: "white",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    gap: "10px",
    boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
  },
  textInput: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: "24px",
    border: "2px solid #e5e7eb",
    fontSize: "15px",
    outline: "none",
    fontFamily: "inherit",
  },
  sendBtn: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #1a3a1a, #2d5a27)",
    color: "white",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
};

      const aiReply = data.choices[0].message.content;
      setMessages((prev) => [...prev, { role: "assistant", content: aiReply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `❌ Error: ${err.message}\n\nCheck karo ki OpenAI API key sahi hai.`,
        },
      ]);
    }
    setLoading(false);
  };

  const quickQuestions = [
    "Is mahine kitna patta bika?",
    "Kul kamaai kitni hai?",
    "Sabse badi entry kaunsi hai?",
    "Total baaki raqam kitni hai?",
  ];

  return (
    <div style={styles.container}>
      {/* Chat Header */}
      <div style={styles.chatHeader}>
        <span style={styles.botIcon}>🤖</span>
        <div>
          <div style={styles.botName}>AI Sahayak</div>
          <div style={styles.botStatus}>
            {entriesLoaded ? `✅ ${allEntries.length} entries loaded` : "⏳ Data load ho raha hai..."}
          </div>
        </div>
      </div>

      {/* Quick Questions */}
      <div style={styles.quickRow}>
        {quickQuestions.map((q) => (
          <button
            key={q}
            onClick={() => { setInput(q); }}
            style={styles.quickBtn}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={styles.messagesArea}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              ...styles.messageBubble,
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              background: msg.role === "user"
                ? "linear-gradient(135deg, #1a3a1a, #2d5a27)"
                : "white",
              color: msg.role === "user" ? "white" : "#1a1a1a",
              borderBottomRightRadius: msg.role === "user" ? "4px" : "18px",
              borderBottomLeftRadius: msg.role === "assistant" ? "4px" : "18px",
            }}
          >
            {msg.role === "assistant" && <span style={styles.aiLabel}>🍃 AI</span>}
            <p style={styles.messageText}>{msg.content}</p>
          </div>
        ))}

        {loading && (
          <div style={{ ...styles.messageBubble, alignSelf: "flex-start", background: "white" }}>
            <span style={styles.aiLabel}>🍃 AI</span>
            <div style={styles.typing}>
              <span>•</span><span>•</span><span>•</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div style={styles.inputArea}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Kuch poochho apni chai ke baare mein..."
          style={styles.textInput}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={styles.sendBtn}
        >
          {loading ? "⏳" : "➤"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "calc(100vh - 120px)",
    background: "#f0f4f0",
    fontFamily: "'Segoe UI', sans-serif",
    position: "relative",
  },
  chatHeader: {
    background: "linear-gradient(135deg, #1a3a1a, #2d5a27)",
    color: "white",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  botIcon: { fontSize: "32px" },
  botName: { fontSize: "16px", fontWeight: "800" },
  botStatus: { fontSize: "11px", opacity: 0.8 },
  quickRow: {
    display: "flex",
    gap: "8px",
    padding: "10px 12px",
    overflowX: "auto",
    background: "white",
    borderBottom: "1px solid #e5e7eb",
  },
  quickBtn: {
    background: "#f0fdf4",
    border: "1px solid #86efac",
    color: "#166534",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  messagesArea: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    paddingBottom: "80px",
  },
  messageBubble: {
    maxWidth: "85%",
    padding: "12px 16px",
    borderRadius: "18px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  aiLabel: { fontSize: "11px", fontWeight: "700", opacity: 0.6, display: "block", marginBottom: "4px" },
  messageText: { margin: 0, fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap" },
  typing: {
    display: "flex",
    gap: "4px",
    padding: "4px 0",
    "& span": {
      width: "8px",
      height: "8px",
      background: "#9ca3af",
      borderRadius: "50%",
      display: "inline-block",
    }
  },
  inputArea: {
    position: "fixed",
    bottom: "60px",
    left: 0,
    right: 0,
    padding: "10px 12px",
    background: "white",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    gap: "10px",
    boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
  },
  textInput: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: "24px",
    border: "2px solid #e5e7eb",
    fontSize: "15px",
    outline: "none",
    fontFamily: "inherit",
  },
  sendBtn: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #1a3a1a, #2d5a27)",
    color: "white",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
};
