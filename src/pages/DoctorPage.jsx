import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase/config";
import { collection, query, where, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { useDark } from "../DarkModeContext";

// ── Tea Bagan Guide 2026 data (Joysiddhi/Naduar, 2 Bigha) ──────────────────
const DISEASES = [
  { key: "redrust",     icon: "🟠", name: "Lal Syahi (Red Rust)",       symptom: "Patte pe narangi-lal powder jaisa daag",     dawa: "Blitox 50 (Copper Oxychloride)",      dose: "3 gm / litre paani",   phi: 6 },
  { key: "heliopeltis", icon: "🦟", name: "Heliopeltis (Machhar Poka)", symptom: "Patte pe brown/black daag, tips sukh jaati", dawa: "Confidor (Imidacloprid 17.8%)",       dose: "0.3 ml / litre paani", phi: 8 },
  { key: "looper",      icon: "🐛", name: "Looper (Caterpillar)",       symptom: "Patta kha jaata hai, sirf nass bacha rehta", dawa: "Coragen (Chlorantraniliprole 18.5%)", dose: "0.3 ml / litre paani", phi: 3 },
  { key: "thrips",      icon: "🍃", name: "Thrips",                    symptom: "Patte ke kinare mude, silver/white streaks", dawa: "Tracer (Spinosad 45%)",               dose: "0.3 ml / litre paani", phi: 4 },
];

const FERT_PLAN = [
  { name: "Urea",  months: "March, June, Aug",  qty: "16-20 kg (2 Bigha)" },
  { name: "MOP (Potash)", months: "April, Sept", qty: "10 kg (2 Bigha)" },
  { name: "SSP (Phosphate)", months: "Feb (pruning ke baad)", qty: "10 kg (2 Bigha)" },
  { name: "NPK 19:19:19 (Foliar)", months: "Har 15 din, March-Oct", qty: "5 gm/litre" },
  { name: "Zinc + Boron", months: "Month mein 1 baar", qty: "2 gm/litre" },
];

const SPRAY_SCHEDULE = [
  { months: [0,1],   label: "Jan-Feb",            note: "Bordeaux Mixture 1% (pruning ke baad)", risk: ["redrust"] },
  { months: [2],     label: "March (1st Flush)",   note: "Confidor + Blitox 50",                  risk: ["heliopeltis", "redrust"] },
  { months: [3],     label: "April",               note: "Tracer (Thrips)",                       risk: ["thrips"] },
  { months: [4,5],   label: "May-June (2nd Flush)",note: "Coragen + Blitox 50 (alag din)",         risk: ["looper", "redrust"] },
  { months: [6,7],   label: "July-Aug (Monsoon)",  note: "Blitox 50 — baarish mein fungus zyada",  risk: ["redrust"] },
  { months: [8,9],   label: "Sept-Oct",            note: "Confidor + Tracer",                      risk: ["heliopeltis", "thrips"] },
  { months: [10,11], label: "Nov-Dec",             note: "Bordeaux Mixture 1% (season end)",       risk: ["redrust"] },
];

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const GAP_DAYS = 8; // entries ke beech itne din se zyada gap = naya plucking session

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24));
}

// Entries (date-sorted) ko consecutive plucking sessions mein todta hai — fully automatic.
function deriveSessions(entries) {
  const sorted = [...entries].filter(e => e.date).sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) return [];
  const sessions = [];
  let cur = { startDate: sorted[0].date, endDate: sorted[0].date, entries: [sorted[0]] };
  for (let i = 1; i < sorted.length; i++) {
    const prev = cur.endDate;
    const curDate = sorted[i].date;
    if (daysBetween(prev, curDate) <= GAP_DAYS) {
      cur.endDate = curDate;
      cur.entries.push(sorted[i]);
    } else {
      sessions.push(cur);
      cur = { startDate: curDate, endDate: curDate, entries: [sorted[i]] };
    }
  }
  sessions.push(cur);
  return sessions.map((s, i) => ({
    sessionNumber: i + 1,
    startDate: s.startDate,
    endDate: s.endDate,
    totalKg: s.entries.reduce((sum, e) => sum + (e.weight || 0), 0),
    count: s.entries.length,
    wetCount: s.entries.filter(e => e.waterStatus === "yes").length,
    isOpen: i === sessions.length - 1 && daysBetween(s.endDate, new Date().toISOString().split("T")[0]) <= GAP_DAYS,
  }));
}

function getSeasonForMonth(m) {
  return SPRAY_SCHEDULE.find(s => s.months.includes(m)) || SPRAY_SCHEDULE[0];
}

export default function DoctorPage({ user }) {
  const { dark } = useDark();
  const [entries, setEntries] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pickedDisease, setPickedDisease] = useState(null);
  const [marking, setMarking] = useState(false);
  const [marked, setMarked] = useState(false);
  const [allEntriesDebug, setAllEntriesDebug] = useState([]);
  const [debugError, setDebugError] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    setDebugError("");
    try {
      const currentUser = user || auth.currentUser;
      if (!currentUser) { setLoading(false); setDebugError("currentUser is null"); return; }

      try {
        const entrySnap = await getDocs(query(collection(db, "entries"), where("uid", "==", currentUser.uid)));
        setEntries(entrySnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e1) { setDebugError(prev => prev + "FILTERED QUERY ERROR: " + e1.message + " | "); }

      try {
        const treatSnap = await getDocs(query(collection(db, "treatments"), where("uid", "==", currentUser.uid)));
        setTreatments(treatSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.date || "").localeCompare(a.date || "")));
      } catch (e2) { setDebugError(prev => prev + "TREATMENTS ERROR: " + e2.message + " | "); }

      try {
        const allSnap = await getDocs(collection(db, "entries"));
        setAllEntriesDebug(allSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e3) { setDebugError(prev => prev + "UNFILTERED QUERY ERROR: " + e3.message + " | "); }

    } catch (err) { setDebugError("OUTER ERROR: " + err.message); }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const markTreated = async (disease) => {
    setMarking(true);
    try {
      const currentUser = user || auth.currentUser;
      const today = new Date().toISOString().split("T")[0];
      await addDoc(collection(db, "treatments"), {
        uid: currentUser.uid,
        date: today,
        diseaseKey: disease.key,
        diseaseName: disease.name,
        dawa: disease.dawa,
        dose: disease.dose,
        phi: disease.phi,
        createdAt: Timestamp.now(),
      });
      setMarked(true);
      setPickedDisease(null);
      fetchAll();
      setTimeout(() => setMarked(false), 3000);
    } catch (err) { console.error(err); }
    setMarking(false);
  };

  const d = {
    bg: dark ? "#0f172a" : "#f0f4f0",
    card: dark ? "#1e293b" : "white",
    text: dark ? "#f1f5f9" : "#1a3a1a",
    sub: dark ? "#94a3b8" : "#6b7280",
    border: dark ? "#334155" : "#e5e7eb",
    shadow: dark ? "0 2px 10px rgba(0,0,0,0.4)" : "0 2px 10px rgba(0,0,0,0.06)",
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "60px", color: d.sub, background: d.bg, minHeight: "100vh", fontFamily: "'Segoe UI',sans-serif" }}>
      <div style={{ fontSize: "40px" }}>🌱</div><p>Loading...</p>
    </div>;
  }

  const today = new Date();
  const curMonth = today.getMonth();
  const curSeason = getSeasonForMonth(curMonth);

  const sessions = deriveSessions(entries);
  const currentSession = sessions[sessions.length - 1];
  const prevSession = sessions[sessions.length - 2];

  const lastTreatment = treatments[0];
  const daysSinceTreatment = lastTreatment ? daysBetween(lastTreatment.date, today.toISOString().split("T")[0]) : null;
  const phiClear = lastTreatment ? daysSinceTreatment >= lastTreatment.phi : true;

  const card = { background: d.card, borderRadius: "16px", padding: "16px", marginBottom: "16px", boxShadow: d.shadow, border: `1px solid ${d.border}` };
  const sectionTitle = { fontSize: "15px", fontWeight: "900", color: d.text, marginBottom: "10px" };

  const diff = currentSession && prevSession ? currentSession.totalKg - prevSession.totalKg : null;
  const diffPct = currentSession && prevSession && prevSession.totalKg > 0 ? (diff / prevSession.totalKg) * 100 : null;

  return (
    <div style={{ padding: "16px", paddingBottom: "90px", background: d.bg, minHeight: "calc(100vh - 60px)", fontFamily: "'Segoe UI',sans-serif" }}>

      <div style={{ background: "linear-gradient(135deg,#0d4d1c,#1a8a3a)", borderRadius: "18px", padding: "18px", marginBottom: "16px", color: "white" }}>
        <div style={{ fontSize: "20px", fontWeight: "900" }}>🌱 Bagan Doctor</div>
        <div style={{ fontSize: "12px", opacity: 0.85, marginTop: "2px" }}>{MONTH_NAMES[curMonth]} — Tea Bagan Guide 2026 ke hisaab se</div>
      </div>

      {/* PHI STATUS */}
      {lastTreatment && (
        <div style={{ ...card, borderLeft: phiClear ? "4px solid #16a34a" : "4px solid #d97706" }}>
          <div style={sectionTitle}>⏱️ Last Dawa Status</div>
          <div style={{ fontSize: "13px", color: d.text }}>
            <b>{lastTreatment.dawa}</b> — {lastTreatment.date} ko maara tha ({lastTreatment.diseaseName})
          </div>
          {phiClear ? (
            <div style={{ marginTop: "8px", background: dark ? "#14532d" : "#f0fdf4", color: dark ? "#86efac" : "#16a34a", padding: "10px 12px", borderRadius: "10px", fontSize: "12px", fontWeight: "700" }}>
              ✅ PHI complete ({daysSinceTreatment} din ho gaye) — ab patte tod sakte ho.
            </div>
          ) : (
            <div style={{ marginTop: "8px", background: dark ? "#78350f" : "#fef3c7", color: dark ? "#fde68a" : "#92400e", padding: "10px 12px", borderRadius: "10px", fontSize: "12px", fontWeight: "700" }}>
              ⚠️ Abhi {daysSinceTreatment} din hue, {lastTreatment.phi} din wait karo todne se pehle. {lastTreatment.phi - daysSinceTreatment} din baaki.
            </div>
          )}
        </div>
      )}

      {/* BIMARI PUCHO */}
      <div style={card}>
        <div style={sectionTitle}>🩺 Patton mein kya dikh raha hai?</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {DISEASES.map(dz => (
            <button key={dz.key} onClick={() => setPickedDisease(dz)}
              style={{
                display: "flex", alignItems: "center", gap: "10px", textAlign: "left",
                background: dark ? "#0f172a" : "#f9fafb", border: `1px solid ${d.border}`,
                borderRadius: "12px", padding: "12px", cursor: "pointer", fontFamily: "inherit",
              }}>
              <span style={{ fontSize: "24px" }}>{dz.icon}</span>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "800", color: d.text }}>{dz.name}</div>
                <div style={{ fontSize: "11px", color: d.sub }}>{dz.symptom}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* SUGGESTION POPUP */}
      {pickedDisease && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.55)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={() => setPickedDisease(null)}>
          <div style={{ background: d.card, borderRadius: "18px", padding: "22px", width: "100%", maxWidth: "340px" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: "32px", textAlign: "center", marginBottom: "8px" }}>{pickedDisease.icon}</div>
            <div style={{ fontSize: "16px", fontWeight: "900", color: d.text, textAlign: "center", marginBottom: "12px" }}>{pickedDisease.name}</div>
            <div style={{ background: dark ? "#0f172a" : "#f9fafb", borderRadius: "12px", padding: "14px", marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", color: d.text, marginBottom: "6px" }}>💊 <b>{pickedDisease.dawa}</b></div>
              <div style={{ fontSize: "13px", color: d.text, marginBottom: "6px" }}>📏 {pickedDisease.dose}</div>
              <div style={{ fontSize: "13px", color: d.text }}>⏱️ PHI: {pickedDisease.phi} din (todne se pehle wait)</div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setPickedDisease(null)}
                style={{ flex: 1, padding: "12px", borderRadius: "10px", border: `2px solid ${d.border}`, background: "none", color: d.text, fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>
                Band Karo
              </button>
              <button onClick={() => markTreated(pickedDisease)} disabled={marking}
                style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: "#16a34a", color: "white", fontWeight: "800", cursor: "pointer", fontFamily: "inherit", opacity: marking ? 0.6 : 1 }}>
                {marking ? "Saving..." : "✅ Dawa Maar Diya"}
              </button>
            </div>
          </div>
        </div>
      )}

      {marked && (
        <div style={{ position: "fixed", bottom: "100px", left: "16px", right: "16px", background: "#16a34a", color: "white", padding: "12px 16px", borderRadius: "12px", fontSize: "13px", fontWeight: "700", textAlign: "center", zIndex: 998 }}>
          ✅ Mark ho gaya — PHI countdown shuru
        </div>
      )}

      {/* TEMP DEBUG — batayega exact kya data aa raha hai */}
      <div style={{ ...card, border: "2px dashed #f59e0b" }}>
        <div style={{ fontSize: "12px", fontWeight: "900", color: "#f59e0b", marginBottom: "6px" }}>🔧 DEBUG INFO</div>
        {debugError && (
          <div style={{ fontSize: "11px", color: "#dc2626", fontWeight: "800", marginBottom: "6px", wordBreak: "break-word" }}>
            ❌ {debugError}
          </div>
        )}
        <div style={{ fontSize: "11px", color: d.text }}>Logged-in UID: {(user || auth.currentUser)?.uid || "NULL"}</div>
        <div style={{ fontSize: "11px", color: d.text }}>Logged-in Email: {(user || auth.currentUser)?.email || "NULL"}</div>
        <div style={{ fontSize: "11px", color: d.text }}>Entries fetched: {entries.length}</div>
        {entries[0] && (
          <div style={{ fontSize: "11px", color: d.text, marginTop: "4px" }}>
            Sample entry: date="{String(entries[0].date)}" uid="{String(entries[0].uid)}" weight={String(entries[0].weight)}
          </div>
        )}
        <div style={{ fontSize: "11px", color: d.text, marginTop: "8px", fontWeight: "800" }}>
          Total docs in "entries" collection: {allEntriesDebug.length}
        </div>
        {allEntriesDebug.length > 0 && (
          <div style={{ fontSize: "10px", color: d.sub, marginTop: "4px", fontFamily: "monospace" }}>
            Field names in 1st doc: {Object.keys(allEntriesDebug[0]).join(", ")}
            <br />uid value: "{String(allEntriesDebug[0].uid).slice(0, 8)}..." (matches mine: {String(allEntriesDebug[0].uid) === ((user || auth.currentUser)?.uid) ? "YES" : "NO"})
            <br />My uid starts with: {((user || auth.currentUser)?.uid || "").slice(0, 8)}...
          </div>
        )}
      </div>

      {/* CURRENT SEASON SUGGESTION */}
      <div style={card}>
        <div style={sectionTitle}>📅 Iss Mahine ka Schedule</div>
        <div style={{ fontSize: "13px", color: d.sub }}>{curSeason.label}: <b style={{ color: d.text }}>{curSeason.note}</b></div>
      </div>

      {/* AUTO SESSION COMPARE — current vs last plucking, fully derived from entries */}
      <div style={card}>
        <div style={sectionTitle}>📊 Last Plucking se Compare</div>
        {!currentSession ? (
          <div style={{ fontSize: "13px", color: d.sub }}>Abhi entries nahi hain.</div>
        ) : (
          <>
            <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
              <div style={{ flex: 1, background: dark ? "#0c4a6e" : "#e0f2fe", borderRadius: "12px", padding: "12px" }}>
                <div style={{ fontSize: "10px", fontWeight: "800", color: dark ? "#7dd3fa" : "#0369a1", textTransform: "uppercase" }}>
                  {currentSession.isOpen ? "Abhi Chal Raha" : "Aakhri"} (#{currentSession.sessionNumber})
                </div>
                <div style={{ fontSize: "18px", fontWeight: "900", color: d.text, marginTop: "4px" }}>{currentSession.totalKg.toFixed(1)} kg</div>
                <div style={{ fontSize: "11px", color: d.sub }}>{currentSession.startDate} → {currentSession.endDate}</div>
              </div>
              {prevSession && (
                <div style={{ flex: 1, background: dark ? "#0f172a" : "#f9fafb", borderRadius: "12px", padding: "12px" }}>
                  <div style={{ fontSize: "10px", fontWeight: "800", color: d.sub, textTransform: "uppercase" }}>Pichla (#{prevSession.sessionNumber})</div>
                  <div style={{ fontSize: "18px", fontWeight: "900", color: d.text, marginTop: "4px" }}>{prevSession.totalKg.toFixed(1)} kg</div>
                  <div style={{ fontSize: "11px", color: d.sub }}>{prevSession.startDate} → {prevSession.endDate}</div>
                </div>
              )}
            </div>

            {diff !== null && (
              <div style={{
                background: diff >= 0 ? (dark ? "#14532d" : "#f0fdf4") : (dark ? "#7f1d1d" : "#fef2f2"),
                color: diff >= 0 ? (dark ? "#86efac" : "#16a34a") : (dark ? "#fca5a5" : "#dc2626"),
                padding: "10px 12px", borderRadius: "10px", fontSize: "13px", fontWeight: "800", marginBottom: "10px",
              }}>
                {diff >= 0 ? "📈" : "📉"} {diff >= 0 ? "+" : ""}{diff.toFixed(1)} kg ({diffPct !== null ? `${diffPct >= 0 ? "+" : ""}${diffPct.toFixed(0)}%` : ""}) pichle session se
              </div>
            )}

            {currentSession.wetCount > 0 && currentSession.count > 0 && (currentSession.wetCount / currentSession.count) >= 0.4 && (
              <div style={{ background: dark ? "#7f1d1d" : "#fef2f2", color: dark ? "#fca5a5" : "#b91c1c", padding: "10px 12px", borderRadius: "10px", fontSize: "12px", fontWeight: "700" }}>
                ⚠️ Is session mein {currentSession.wetCount}/{currentSession.count} din patton mein paani tha — fungus (Lal Syahi) risk hai.
              </div>
            )}

            {sessions.length > 2 && (
              <div style={{ marginTop: "12px" }}>
                <div style={{ fontSize: "12px", fontWeight: "800", color: d.sub, marginBottom: "6px" }}>Sab Sessions</div>
                {sessions.slice().reverse().map(s => (
                  <div key={s.sessionNumber} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "5px 0", borderBottom: `1px solid ${d.border}` }}>
                    <span style={{ color: d.sub }}>#{s.sessionNumber} • {s.startDate} → {s.endDate}</span>
                    <span style={{ fontWeight: "800", color: d.text }}>{s.totalKg.toFixed(1)} kg</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* FERTILIZER PLAN */}
      <div style={card}>
        <div style={sectionTitle}>🌿 Fertilizer Plan (2 Bigha)</div>
        {FERT_PLAN.map((f, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < FERT_PLAN.length - 1 ? `1px solid ${d.border}` : "none" }}>
            <div>
              <div style={{ fontSize: "12px", fontWeight: "800", color: d.text }}>{f.name}</div>
              <div style={{ fontSize: "11px", color: d.sub }}>{f.months}</div>
            </div>
            <div style={{ fontSize: "12px", fontWeight: "700", color: d.text, alignSelf: "center" }}>{f.qty}</div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", fontSize: "11px", color: d.sub, marginTop: "8px" }}>
        🍵 Bagan mein mehnat karo — fal zaroor milega!
      </div>
    </div>
  );
}
