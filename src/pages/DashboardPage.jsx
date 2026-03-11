import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase/config";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useLang } from "../LanguageContext";
import { useDark } from "../DarkModeContext";

export default function DashboardPage({ user }) {
  const { lang } = useLang();
  const { dark } = useDark();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState("");
  const [totalAdvanceTaken, setTotalAdvanceTaken] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const currentUser = user || auth.currentUser;
        if (!currentUser) { setLoading(false); return; }
        const snap = await getDocs(query(collection(db, "entries"), where("uid", "==", currentUser.uid)));
        setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) setTotalAdvanceTaken(userDoc.data().totalAdvanceTaken || 0);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const filtered = filterMonth ? entries.filter(e => e.date?.startsWith(filterMonth)) : entries;
  const totalWeight     = filtered.reduce((s, e) => s + (e.weight || 0), 0);
  const totalAmount     = filtered.reduce((s, e) => s + (e.totalAmount || 0), 0);
  const totalReceived   = filtered.reduce((s, e) => s + (e.amountReceived || 0), 0);
  const totalAdvanceCut = filtered.reduce((s, e) => s + (e.advanceCut || 0), 0);
  const totalBalance    = filtered.reduce((s, e) => s + (e.balanceAmount || 0), 0);
  const advanceBalance  = totalAdvanceTaken - totalAdvanceCut;
  const currentUserObj  = user || auth.currentUser;

  const txt = {
    en: {
      greet: () => { const h = new Date().getHours(); return h < 12 ? "Good Morning ☕" : h < 17 ? "Good Afternoon 🌞" : "Good Evening 🌆"; },
      entries: (n, kg) => `${n} entries • ${kg} kg`,
      month: "📅 Month:", clear: "Clear",
      earning: "Total Earning", received: "Received",
      balance: "Balance", advTaken: "Advance Taken",
      advCut: "Cut:", advLeft: "Advance Left",
      stillLeft: "Still pending", overCut: "Over cut!",
      recent: "📋 Recent Entries",
      noEntry: "No entries yet", noEntrySub: "Add entry from Entry tab",
      ratePending: "Rate pending", baaki: "Bal:",
      more: (n) => `+ ${n} more — see Records tab`,
      loading: "Loading...",
    },
    hi: {
      greet: () => { const h = new Date().getHours(); return h < 12 ? "शुभ प्रभात ☕" : h < 17 ? "नमस्ते 🌞" : "शुभ संध्या 🌆"; },
      entries: (n, kg) => `${n} प्रविष्टियां • ${kg} कि.ग्रा.`,
      month: "📅 महीना:", clear: "हटाएं",
      earning: "कुल कमाई", received: "मिली राशि",
      balance: "बाकी राशि", advTaken: "लिया अग्रिम",
      advCut: "कटा:", advLeft: "बचा अग्रिम",
      stillLeft: "अभी बाकी", overCut: "ज्यादा कटा!",
      recent: "📋 हाल की प्रविष्टियां",
      noEntry: "कोई प्रविष्टि नहीं", noEntrySub: "प्रविष्टि टैब से जोड़ें",
      ratePending: "हाॅर बाकी", baaki: "बाकी:",
      more: (n) => `+ ${n} और — रिकॉर्ड टैब देखें`,
      loading: "लोड हो रहा है...",
    },
    ne: {
      greet: () => { const h = new Date().getHours(); return h < 12 ? "शुभ बिहान ☕" : h < 17 ? "शुभ दिउँसो 🌞" : "शुभ साँझ 🌆"; },
      entries: (n, kg) => `${n} वटा प्रविष्टि • ${kg} कि.ग्रा.`,
      month: "📅 महिना:", clear: "हटाउनुस्",
      earning: "कुल आम्दानी", received: "पाएको रकम",
      balance: "बाँकी रकम", advTaken: "लिएको अग्रिम",
      advCut: "काटिएको:", advLeft: "बाँकी अग्रिम",
      stillLeft: "अझै बाँकी", overCut: "बढी काटियो!",
      recent: "📋 भर्खरका प्रविष्टि",
      noEntry: "कुनै प्रविष्टि छैन", noEntrySub: "प्रविष्टि ट्याबबाट थप्नुस्",
      ratePending: "दर बाँकी", baaki: "बाँकी:",
      more: (n) => `+ ${n} वटा — रेकर्ड ट्याब हेर्नुस्`,
      loading: "कृपया प्रतीक्षा गर्नुस्...",
    },
    as: {
      greet: () => { const h = new Date().getHours(); return h < 12 ? "শুভ পুৱা ☕" : h < 17 ? "শুভ অপৰাহ্ন 🌞" : "শুভ সন্ধিয়া 🌆"; },
      entries: (n, kg) => `${n} টা তথ্য • ${kg} কি:গ্ৰা:`,
      month: "📅 মাহ:", clear: "বাতিল",
      earning: "মুঠ উপাৰ্জন", received: "পোৱা পৰিমাণ",
      balance: "বাকী পৰিমাণ", advTaken: "লোৱা এডভান্স",
      advCut: "কটা:", advLeft: "বাকী এডভান্স",
      stillLeft: "এতিয়াও বাকী", overCut: "বেছি কটা হৈছে!",
      recent: "📋 শেহতীয়া তথ্য",
      noEntry: "কোনো তথ্য নাই", noEntrySub: "তথ্য টেবৰ পৰা যোগ কৰক",
      ratePending: "হাৰ বাকী", baaki: "বাকী:",
      more: (n) => `+ ${n} টা — ৰেকৰ্ড টেব চাওক`,
      loading: "অনুগ্ৰহ কৰি অপেক্ষা কৰক...",
    },
  };

  const T = txt[lang] || txt.as;
  const locale = lang === "en" ? "en-IN" : lang === "hi" ? "hi-IN" : lang === "ne" ? "ne-NP" : "as-IN";

  // Dark mode colors
  const d = {
    bg: dark ? "#0f172a" : "#f8faf8",
    card: dark ? "#1e293b" : "white",
    cardBorder: dark ? "#334155" : "transparent",
    text: dark ? "#f1f5f9" : "#1a3a1a",
    subtext: dark ? "#94a3b8" : "#6b7280",
    filterBg: dark ? "#1e293b" : "white",
    filterBorder: dark ? "#475569" : "#e5e7eb",
    rateTag: dark ? { bg: "#14532d", color: "#86efac" } : { bg: "#f0fdf4", color: "#166534" },
    pendingTag: dark ? { bg: "#78350f", color: "#fde68a" } : { bg: "#fef3c7", color: "#92400e" },
    shadow: dark ? "0 2px 8px rgba(0,0,0,0.4)" : "0 1px 6px rgba(0,0,0,0.05)",
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: "60px", color: d.subtext, fontFamily: "'Segoe UI', sans-serif", background: d.bg, minHeight: "100vh" }}>
      <div style={{ fontSize: "40px" }}>🍃</div>
      <p>{T.loading}</p>
    </div>
  );

  return (
    <div style={{ padding: "16px", paddingBottom: "90px", background: d.bg, minHeight: "calc(100vh - 60px)", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Greeting */}
      <div style={{ background: "linear-gradient(135deg,#1a3a1a,#2d5a27,#4a7c3f)", borderRadius: "20px", padding: "20px", marginBottom: "16px", color: "white" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
          <div>
            <div style={{ fontSize: "13px", opacity: 0.8, marginBottom: "4px" }}>{T.greet()}</div>
            <div style={{ fontSize: "22px", fontWeight: "900", letterSpacing: "-0.5px" }}>{currentUserObj?.displayName || currentUserObj?.email?.split("@")[0] || ""}</div>
          </div>
          <div style={{ fontSize: "40px" }}>🍃</div>
        </div>
        <div style={{ fontSize: "12px", opacity: 0.75, marginTop: "4px" }}>{T.entries(filtered.length, totalWeight.toFixed(1))}</div>
      </div>

      {/* Month Filter */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", background: d.filterBg, padding: "12px 16px", borderRadius: "12px", boxShadow: d.shadow, border: `1px solid ${d.cardBorder}` }}>
        <label style={{ fontSize: "13px", fontWeight: "700", whiteSpace: "nowrap", color: d.text }}>{T.month}</label>
        <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
          style={{ border: `2px solid ${d.filterBorder}`, borderRadius: "8px", padding: "6px 10px", fontSize: "14px", flex: 1, outline: "none", fontFamily: "inherit", background: d.filterBg, color: d.text }} />
        {filterMonth && <button onClick={() => setFilterMonth("")}
          style={{ background: "#fee2e2", color: "#dc2626", border: "none", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontFamily: "inherit" }}>{T.clear}</button>}
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
        <div style={{ background: "linear-gradient(135deg,#1a3a1a,#2d5a27)", borderRadius: "16px", padding: "16px", color: "white", gridColumn: "span 2" }}>
          <div style={{ fontSize: "11px", opacity: 0.85, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>{T.earning}</div>
          <div style={{ fontSize: "26px", fontWeight: "900", letterSpacing: "-0.5px" }}>Rs {totalAmount.toFixed(2)}</div>
          <div style={{ fontSize: "11px", opacity: 0.75, marginTop: "4px" }}>{totalWeight.toFixed(1)} kg</div>
        </div>
        {[
          { label: T.received, value: `Rs ${totalReceived.toFixed(0)}`, bg: "linear-gradient(135deg,#1e40af,#3b82f6)" },
          { label: T.balance, value: `Rs ${totalBalance.toFixed(0)}`, bg: totalBalance >= 0 ? "linear-gradient(135deg,#14532d,#16a34a)" : "linear-gradient(135deg,#7f1d1d,#dc2626)" },
          { label: T.advTaken, value: `Rs ${totalAdvanceTaken.toFixed(0)}`, sub: `${T.advCut} Rs ${totalAdvanceCut.toFixed(0)}`, bg: "linear-gradient(135deg,#92400e,#d97706)" },
          { label: T.advLeft, value: `Rs ${advanceBalance.toFixed(0)}`, sub: advanceBalance >= 0 ? T.stillLeft : T.overCut, bg: advanceBalance >= 0 ? "linear-gradient(135deg,#4c1d95,#7c3aed)" : "linear-gradient(135deg,#7f1d1d,#dc2626)" },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, borderRadius: "16px", padding: "16px", color: "white" }}>
            <div style={{ fontSize: "11px", opacity: 0.85, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>{s.label}</div>
            <div style={{ fontSize: "20px", fontWeight: "900", letterSpacing: "-0.5px" }}>{s.value}</div>
            {s.sub && <div style={{ fontSize: "11px", opacity: 0.75, marginTop: "4px" }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Recent Entries */}
      <div style={{ fontSize: "15px", fontWeight: "800", color: d.text, marginBottom: "10px" }}>{T.recent}</div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: d.subtext, fontSize: "15px", background: d.card, borderRadius: "14px", border: `1px solid ${d.cardBorder}` }}>
          <p>{T.noEntry}</p>
          <p style={{ fontSize: "13px", marginTop: "6px" }}>{T.noEntrySub}</p>
        </div>
      ) : (
        filtered.slice(0, 10).map(entry => (
          <div key={entry.id} style={{ background: d.card, borderRadius: "12px", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", boxShadow: d.shadow, border: `1px solid ${d.cardBorder}` }}>
            <div style={{ minWidth: "60px" }}>
              <div style={{ fontSize: "13px", fontWeight: "800", color: d.text }}>
                {new Date(entry.date + "T00:00:00").toLocaleDateString(locale, { day: "numeric", month: "short" })}
              </div>
              <div style={{ fontSize: "12px", color: d.subtext, marginTop: "2px" }}>{entry.weight} {lang === "en" ? "kg" : "কি:গ্ৰা:"}</div>
            </div>
            <div style={{ flex: 1, paddingLeft: "10px" }}>
              {entry.rate > 0
                ? <span style={{ fontSize: "12px", background: d.rateTag.bg, color: d.rateTag.color, padding: "3px 8px", borderRadius: "6px", fontWeight: "700" }}>Rs{entry.rate}/kg</span>
                : <span style={{ fontSize: "11px", background: d.pendingTag.bg, color: d.pendingTag.color, padding: "3px 8px", borderRadius: "6px", fontWeight: "700" }}>{T.ratePending}</span>
              }
            </div>
            <div style={{ textAlign: "right" }}>
              {entry.totalAmount > 0 && <div style={{ fontSize: "15px", fontWeight: "800", color: d.text }}>Rs{entry.totalAmount.toFixed(0)}</div>}
              <div style={{ fontSize: "11px", fontWeight: "700", marginTop: "2px", color: (entry.balanceAmount || 0) >= 0 ? "#16a34a" : "#dc2626" }}>
                {T.baaki} Rs{(entry.balanceAmount || 0).toFixed(0)}
              </div>
            </div>
          </div>
        ))
      )}

      {filtered.length > 10 && (
        <div style={{ textAlign: "center", fontSize: "13px", color: d.subtext, padding: "12px", background: d.card, borderRadius: "10px", marginTop: "4px", border: `1px solid ${d.cardBorder}` }}>
          {T.more(filtered.length - 10)}
        </div>
      )}
    </div>
  );
}
