import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase/config";
import { collection, query, where, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { useDark } from "../DarkModeContext";

// ── Tea Bagan Guide 2026 data (Joysiddhi/Naduar, 2 Bigha) ──────────────────
const DISEASES = [
  { key: "redrust",     icon: "🟠", name: "Lal Syahi (Red Rust)",       symptom: "Patte pe narangi-lal powder jaisa daag",     dawa: "Blitox 50 (Copper Oxychloride)",      dose: "3 gm / litre paani",   phi: 6, type: "spray" },
  { key: "heliopeltis", icon: "🦟", name: "Heliopeltis (Machhar Poka)", symptom: "Patte pe brown/black daag, tips sukh jaati", dawa: "Confidor (Imidacloprid 17.8%)",       dose: "0.3 ml / litre paani", phi: 8, type: "spray" },
  { key: "looper",      icon: "🐛", name: "Looper (Caterpillar)",       symptom: "Patta kha jaata hai, sirf nass bacha rehta", dawa: "Coragen (Chlorantraniliprole 18.5%)", dose: "0.3 ml / litre paani", phi: 3, type: "spray" },
  { key: "thrips",      icon: "🍃", name: "Thrips",                    symptom: "Patte ke kinare mude, silver/white streaks", dawa: "Tracer (Spinosad 45%)",               dose: "0.3 ml / litre paani", phi: 4, type: "spray" },
];

const FERT_PLAN = [
  { key: "urea",     icon: "🌾", name: "Urea",  months: "March, June, Aug",  qty: "16-20 kg (2 Bigha)", type: "fertilizer" },
  { key: "mop",      icon: "🌾", name: "MOP (Potash)", months: "April, Sept", qty: "10 kg (2 Bigha)", type: "fertilizer" },
  { key: "ssp",      icon: "🌾", name: "SSP (Phosphate)", months: "Feb (pruning ke baad)", qty: "10 kg (2 Bigha)", type: "fertilizer" },
  { key: "npk",      icon: "💧", name: "NPK 19:19:19 (Foliar)", months: "Har 15 din, March-Oct", qty: "5 gm/litre", type: "fertilizer" },
  { key: "zincboron",icon: "💧", name: "Zinc + Boron", months: "Month mein 1 baar", qty: "2 gm/litre", type: "fertilizer" },
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

  const fetchAll = async () => {
    setLoading(true);
    try {
      const currentUser = user || auth.currentUser;
      if (!currentUser) { setLoading(false); return; }

      const entrySnap = await getDocs(query(collection(db, "entries"), where("uid", "==", currentUser.uid)));
      setEntries(entrySnap.docs.map(d => ({ id: d.id, ...d.data() })));

      try {
        const treatSnap = await getDocs(query(collection(db, "treatments"), where("uid", "==", currentUser.uid)));
        setTreatments(treatSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.date || "").localeCompare(a.date || "")));
      } catch (e) {
        // treatments collection ke Firestore rules abhi missing — entries data fir bhi dikhega
        console.error("treatments fetch failed:", e.message);
        setTreatments([]);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const markTreated = async (item) => {
    setMarking(true);
    try {
      const currentUser = user || auth.currentUser;
      const today = new Date().toISOString().split("T")[0];
      await addDoc(collection(db, "treatments"), {
        uid: currentUser.uid,
        date: today,
        type: item.type || "spray",
        diseaseKey: item.key,
        diseaseName: item.name,
        dawa: item.dawa || item.name,
        dose: item.dose || item.qty || "",
        phi: item.phi || 0,
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

  // Saare spray treatments jinka PHI abhi clear nahi hua (multiple ho sakte hain)
  const todayStr = today.toISOString().split("T")[0];
  const activeSprayTreatments = treatments
    .filter(t => (t.type || "spray") === "spray")
    .map(t => ({ ...t, daysSince: daysBetween(t.date, todayStr) }))
    .filter(t => t.daysSince < t.phi);
  const recentFertilizerLogs = treatments.filter(t => t.type === "fertilizer").slice(0, 3);

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

      {/* PHI STATUS — multiple sprays ek saath track ho sakte hain */}
      {activeSprayTreatments.length > 0 && (
        <div style={{ ...card, borderLeft: "4px solid #d97706" }}>
          <div style={sectionTitle}>⏱️ Dawa PHI Status</div>
          {activeSprayTreatments.map(t => (
            <div key={t.id} style={{ marginBottom: "8px" }}>
              <div style={{ fontSize: "13px", color: d.text }}>
                <b>{t.dawa}</b> — {t.date} ko maara ({t.diseaseName})
              </div>
              <div style={{ marginTop: "4px", background: dark ? "#78350f" : "#fef3c7", color: dark ? "#fde68a" : "#92400e", padding: "8px 12px", borderRadius: "10px", fontSize: "12px", fontWeight: "700" }}>
                ⚠️ {t.phi - t.daysSince} din baaki PHI complete hone mein (todne se pehle wait karo)
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSprayTreatments.length === 0 && treatments.some(t => (t.type || "spray") === "spray") && (
        <div style={{ ...card, borderLeft: "4px solid #16a34a" }}>
          <div style={{ fontSize: "13px", color: dark ? "#86efac" : "#16a34a", fontWeight: "700" }}>
            ✅ Saari dawaiyon ka PHI complete — ab patte tod sakte ho.
          </div>
        </div>
      )}

      {recentFertilizerLogs.length > 0 && (
        <div style={card}>
          <div style={sectionTitle}>💧 Recent Fertilizer/Vitamin Log</div>
          {recentFertilizerLogs.map(t => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "5px 0", borderBottom: `1px solid ${d.border}` }}>
              <span style={{ color: d.sub }}>{t.diseaseName}</span>
              <span style={{ color: d.text, fontWeight: "700" }}>{t.date}</span>
            </div>
          ))}
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

      {/* SUGGESTION POPUP — disease ya fertilizer, dono ke liye */}
      {pickedDisease && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.55)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={() => setPickedDisease(null)}>
          <div style={{ background: d.card, borderRadius: "18px", padding: "22px", width: "100%", maxWidth: "340px" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: "32px", textAlign: "center", marginBottom: "8px" }}>{pickedDisease.icon}</div>
            <div style={{ fontSize: "16px", fontWeight: "900", color: d.text, textAlign: "center", marginBottom: "12px" }}>{pickedDisease.name}</div>
            <div style={{ background: dark ? "#0f172a" : "#f9fafb", borderRadius: "12px", padding: "14px", marginBottom: "16px" }}>
              {pickedDisease.dawa && <div style={{ fontSize: "13px", color: d.text, marginBottom: "6px" }}>💊 <b>{pickedDisease.dawa}</b></div>}
              <div style={{ fontSize: "13px", color: d.text, marginBottom: "6px" }}>📏 {pickedDisease.dose || pickedDisease.qty}</div>
              {pickedDisease.phi > 0 ? (
                <div style={{ fontSize: "13px", color: d.text }}>⏱️ PHI: {pickedDisease.phi} din (todne se pehle wait)</div>
              ) : (
                <div style={{ fontSize: "13px", color: d.text }}>✅ Koi wait nahi — patte tod sakte ho</div>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setPickedDisease(null)}
                style={{ flex: 1, padding: "12px", borderRadius: "10px", border: `2px solid ${d.border}`, background: "none", color: d.text, fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>
                Band Karo
              </button>
              <button onClick={() => markTreated(pickedDisease)} disabled={marking}
                style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: "#16a34a", color: "white", fontWeight: "800", cursor: "pointer", fontFamily: "inherit", opacity: marking ? 0.6 : 1 }}>
                {marking ? "Saving..." : pickedDisease.type === "fertilizer" ? "✅ Daal Diya" : "✅ Dawa Maar Diya"}
              </button>
            </div>
          </div>
        </div>
      )}

      {marked && (
        <div style={{ position: "fixed", bottom: "100px", left: "16px", right: "16px", background: "#16a34a", color: "white", padding: "12px 16px", borderRadius: "12px", fontSize: "13px", fontWeight: "700", textAlign: "center", zIndex: 998 }}>
          ✅ Mark ho gaya
        </div>
      )}

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

      {/* FERTILIZER PLAN — tap karke mark karo */}
      <div style={card}>
        <div style={sectionTitle}>🌿 Fertilizer / Vitamin Plan (2 Bigha)</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {FERT_PLAN.map(f => (
            <button key={f.key} onClick={() => setPickedDisease(f)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", textAlign: "left",
                background: dark ? "#0f172a" : "#f9fafb", border: `1px solid ${d.border}`,
                borderRadius: "12px", padding: "12px", cursor: "pointer", fontFamily: "inherit", width: "100%",
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "20px" }}>{f.icon}</span>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "800", color: d.text }}>{f.name}</div>
                  <div style={{ fontSize: "11px", color: d.sub }}>{f.months}</div>
                </div>
              </div>
              <div style={{ fontSize: "11px", fontWeight: "700", color: d.text }}>{f.qty}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ textAlign: "center", fontSize: "11px", color: d.sub, marginTop: "8px" }}>
        🍵 Bagan mein mehnat karo — fal zaroor milega!
      </div>
    </div>
  );
}
