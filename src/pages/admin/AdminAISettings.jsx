import React, { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useDark } from "../../DarkModeContext";

const FREE_MODELS = [
  { id: "google/gemma-3-27b-it:free",              label: "Gemma 3 27B",       tag: "Google • Free" },
  { id: "mistralai/mistral-7b-instruct:free",       label: "Mistral 7B",        tag: "Mistral • Free" },
  { id: "meta-llama/llama-3.1-8b-instruct:free",   label: "Llama 3.1 8B",      tag: "Meta • Free" },
  { id: "deepseek/deepseek-r1:free",                label: "DeepSeek R1",       tag: "DeepSeek • Free" },
  { id: "qwen/qwen3-8b:free",                       label: "Qwen3 8B",          tag: "Alibaba • Free" },
];

export default function AdminAISettings({ user }) {
  const { dark } = useDark();

  const [apiKey, setApiKey] = useState("");
  const [modelId, setModelId] = useState("google/gemma-3-27b-it:free");
  const [keyVisible, setKeyVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null); // { type: "success"|"error", msg }
  const [testResult, setTestResult] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "config", "ai_settings"));
        if (snap.exists()) {
          const d = snap.data();
          setApiKey(d.apiKey || "");
          setModelId(d.modelId || "google/gemma-3-27b-it:free");
          setLastSaved(d.updatedAt ? new Date(d.updatedAt.seconds * 1000).toLocaleString("en-IN") : null);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!apiKey.trim()) { setResult({ type: "error", msg: "❌ API key daalo pehle!" }); return; }
    if (!modelId.trim()) { setResult({ type: "error", msg: "❌ Model ID daalo!" }); return; }
    setSaving(true); setResult(null);
    try {
      const now = { seconds: Math.floor(Date.now() / 1000) };
      await setDoc(doc(db, "config", "ai_settings"), {
        apiKey: apiKey.trim(),
        modelId: modelId.trim(),
        updatedAt: now,
        updatedBy: user?.email || "admin",
      });
      setLastSaved(new Date(now.seconds * 1000).toLocaleString("en-IN"));
      setResult({ type: "success", msg: "✅ AI settings save ho gayi!" });
      setTimeout(() => setResult(null), 4000);
    } catch (e) { setResult({ type: "error", msg: "❌ " + e.message }); }
    setSaving(false);
  };

  const handleTest = async () => {
    if (!apiKey.trim()) { setTestResult({ type: "error", msg: "❌ API key daalo pehle!" }); return; }
    setTesting(true); setTestResult(null);
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey.trim()}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "Iswar Tea Garden AI",
        },
        body: JSON.stringify({
          model: modelId.trim(),
          messages: [{ role: "user", content: "Reply in one sentence: Are you working?" }],
          max_tokens: 50,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
      const reply = data.choices?.[0]?.message?.content || "No response";
      setTestResult({ type: "success", msg: `✅ Connected! AI bola: "${reply.slice(0, 120)}"` });
    } catch (e) {
      setTestResult({ type: "error", msg: `❌ Failed: ${e.message}` });
    }
    setTesting(false);
  };

  const bg = dark ? "#0f172a" : "#f0f4f0";
  const card = dark ? "#1e293b" : "white";
  const border = dark ? "#334155" : "#e5e7eb";
  const text = dark ? "#f1f5f9" : "#1a3a1a";
  const sub = dark ? "#94a3b8" : "#6b7280";
  const inputBg = dark ? "#0f172a" : "#f9fafb";
  const inputText = dark ? "#f1f5f9" : "#1a1a1a";

  if (loading) return (
    <div style={{ textAlign: "center", padding: "60px", color: sub, fontFamily: "'Segoe UI',sans-serif" }}>
      <div style={{ fontSize: "36px", marginBottom: "12px" }}>🤖</div>
      <div>Loading AI Settings...</div>
    </div>
  );

  return (
    <div style={{ padding: "16px", paddingBottom: "40px", background: bg, minHeight: "calc(100vh - 60px)", fontFamily: "'Segoe UI',sans-serif" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1e3a5f,#1d4ed8)", borderRadius: "16px", padding: "18px", marginBottom: "18px", color: "white" }}>
        <div style={{ fontSize: "28px", marginBottom: "6px" }}>🤖</div>
        <div style={{ fontSize: "20px", fontWeight: "900" }}>AI Settings</div>
        <div style={{ fontSize: "12px", opacity: 0.75, marginTop: "4px" }}>OpenRouter API ke through AI configure karo</div>
        {lastSaved && <div style={{ fontSize: "10px", opacity: 0.6, marginTop: "6px" }}>Last saved: {lastSaved}</div>}
      </div>

      {/* Current Status */}
      <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "14px", padding: "14px 16px", marginBottom: "14px" }}>
        <div style={{ fontSize: "12px", fontWeight: "800", color: sub, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Current Status</div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: apiKey ? "#16a34a" : "#dc2626", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: text }}>{apiKey ? "API Key Set ✓" : "API Key Not Set"}</div>
            <div style={{ fontSize: "11px", color: sub, marginTop: "2px" }}>
              {apiKey ? `Key: ****${apiKey.slice(-8)}` : "Set karo neeche"}
            </div>
          </div>
        </div>
        {apiKey && (
          <div style={{ marginTop: "10px", background: dark ? "#14532d22" : "#f0fdf4", borderRadius: "10px", padding: "8px 12px" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#16a34a" }}>Active Model</div>
            <div style={{ fontSize: "13px", fontWeight: "800", color: text, marginTop: "2px" }}>{modelId.split("/").pop()?.split(":")[0]}</div>
            <div style={{ fontSize: "10px", color: sub }}>{modelId}</div>
          </div>
        )}
      </div>

      {/* API Key Section */}
      <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "14px", padding: "16px", marginBottom: "14px" }}>
        <div style={{ fontSize: "13px", fontWeight: "800", color: text, marginBottom: "12px" }}>🔑 OpenRouter API Key</div>
        <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
          <input
            type={keyVisible ? "text" : "password"}
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-or-v1-..."
            style={{ flex: 1, padding: "12px 14px", borderRadius: "12px", border: `1.5px solid ${border}`, background: inputBg, color: inputText, fontSize: "14px", fontFamily: "inherit", outline: "none" }}
          />
          <button onClick={() => setKeyVisible(p => !p)}
            style={{ padding: "12px 14px", borderRadius: "12px", border: `1.5px solid ${border}`, background: inputBg, color: sub, cursor: "pointer", fontSize: "16px" }}>
            {keyVisible ? "🙈" : "👁️"}
          </button>
        </div>
        <div style={{ fontSize: "11px", color: sub }}>
          📍 openrouter.ai → Sign in → API Keys → Create Key (free account chalega)
        </div>
      </div>

      {/* Model Selection */}
      <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "14px", padding: "16px", marginBottom: "14px" }}>
        <div style={{ fontSize: "13px", fontWeight: "800", color: text, marginBottom: "12px" }}>🧠 Model Select Karo</div>

        {/* Preset cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
          {FREE_MODELS.map(m => (
            <button key={m.id} onClick={() => setModelId(m.id)}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 14px", borderRadius: "12px", cursor: "pointer", fontFamily: "inherit",
                border: modelId === m.id ? "2px solid #2563eb" : `1.5px solid ${border}`,
                background: modelId === m.id ? (dark ? "#1e3a5f" : "#eff6ff") : inputBg,
                transition: "all 0.15s",
              }}>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "13px", fontWeight: "800", color: modelId === m.id ? "#2563eb" : text }}>{m.label}</div>
                <div style={{ fontSize: "10px", color: sub, marginTop: "2px" }}>{m.id}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "10px", fontWeight: "700", background: "#dcfce7", color: "#16a34a", padding: "2px 8px", borderRadius: "20px" }}>{m.tag}</span>
                {modelId === m.id && <span style={{ fontSize: "16px" }}>✓</span>}
              </div>
            </button>
          ))}
        </div>

        {/* Custom model */}
        <div style={{ fontSize: "11px", fontWeight: "700", color: sub, marginBottom: "6px" }}>Ya custom model ID daalo:</div>
        <input
          type="text"
          value={modelId}
          onChange={e => setModelId(e.target.value)}
          placeholder="provider/model-name:variant"
          style={{ width: "100%", padding: "11px 14px", borderRadius: "12px", border: `1.5px solid ${border}`, background: inputBg, color: inputText, fontSize: "13px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
        />
      </div>

      {/* Test Connection */}
      <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "14px", padding: "16px", marginBottom: "14px" }}>
        <div style={{ fontSize: "13px", fontWeight: "800", color: text, marginBottom: "10px" }}>🧪 Connection Test</div>
        <button onClick={handleTest} disabled={testing || !apiKey.trim()}
          style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "none", background: testing ? "#94a3b8" : "linear-gradient(135deg,#7c3aed,#a855f7)", color: "white", fontSize: "14px", fontWeight: "800", cursor: "pointer", fontFamily: "inherit", opacity: !apiKey.trim() ? 0.5 : 1 }}>
          {testing ? "🔄 Testing..." : "⚡ Test Connection"}
        </button>
        {testResult && (
          <div style={{ marginTop: "10px", background: testResult.type === "success" ? (dark ? "#14532d22" : "#f0fdf4") : (dark ? "#7f1d1d22" : "#fef2f2"), border: `1px solid ${testResult.type === "success" ? "#86efac" : "#fca5a5"}`, borderRadius: "10px", padding: "10px 12px", fontSize: "12px", fontWeight: "700", color: testResult.type === "success" ? "#16a34a" : "#dc2626", lineHeight: "1.5" }}>
            {testResult.msg}
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div style={{ background: result.type === "success" ? "#f0fdf4" : "#fef2f2", border: `1px solid ${result.type === "success" ? "#86efac" : "#fca5a5"}`, borderRadius: "12px", padding: "12px 16px", marginBottom: "14px", fontSize: "13px", fontWeight: "700", color: result.type === "success" ? "#16a34a" : "#dc2626" }}>
          {result.msg}
        </div>
      )}

      {/* Save Button */}
      <button onClick={handleSave} disabled={saving}
        style={{ width: "100%", padding: "16px", borderRadius: "14px", border: "none", background: saving ? "#94a3b8" : "linear-gradient(135deg,#059669,#10b981)", color: "white", fontSize: "16px", fontWeight: "900", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 20px rgba(16,185,129,0.4)" }}>
        {saving ? "💾 Saving..." : "💾 Save Settings"}
      </button>

      {/* Help */}
      <div style={{ marginTop: "20px", background: card, border: `1px solid ${border}`, borderRadius: "14px", padding: "14px 16px" }}>
        <div style={{ fontSize: "12px", fontWeight: "800", color: text, marginBottom: "8px" }}>📖 Setup Guide</div>
        {[
          "1. openrouter.ai pe free account banao",
          "2. API Keys section mein Create Key karo",
          "3. Key yahan paste karo",
          "4. Free model select karo (Gemma 3 recommended)",
          "5. Test karo → Save karo → Done!",
        ].map(s => (
          <div key={s} style={{ fontSize: "12px", color: sub, marginBottom: "4px" }}>{s}</div>
        ))}
      </div>
    </div>
  );
}
