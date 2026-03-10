import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase/config";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useLang } from "../LanguageContext";

export default function DashboardPage({ user }) {
  const { lang } = useLang();
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

  const currentUserObj = user || auth.currentUser;

  // ── Translations ──
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

  if (loading) return (
    <div style={{ textAlign: "center", padding: "60px", color: "#6b7280", fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ fontSize: "40px" }}>🍃</div>
      <p>{T.loading}</p>
    </div>
  );

  return (
    <div style={styles.container}>

      {/* Greeting */}
      <div style={styles.greetingCard}>
        <div style={styles.greetingTop}>
          <div>
            <div style={styles.greetingText}>{T.greet()}</div>
            <div style={styles.greetingName}>{currentUserObj?.displayName || currentUserObj?.email?.split("@")[0] || ""}</div>
          </div>
          <div style={styles.leafBig}>🍃</div>
        </div>
        <div style={styles.totalEntries}>{T.entries(filtered.length, totalWeight.toFixed(1))}</div>
      </div>

      {/* Month Filter */}
      <div style={styles.filterRow}>
        <label style={styles.filterLabel}>{T.month}</label>
        <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={styles.filterInput} />
        {filterMonth && <button onClick={() => setFilterMonth("")} style={styles.clearBtn}>{T.clear}</button>}
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={{ ...styles.statCard, background: "linear-gradient(135deg,#1a3a1a,#2d5a27)", gridColumn: "span 2" }}>
          <div style={styles.statLabel}>{T.earning}</div>
          <div style={styles.statValueBig}>Rs {totalAmount.toFixed(2)}</div>
          <div style={styles.statSub}>{totalWeight.toFixed(1)} kg</div>
        </div>
        <div style={{ ...styles.statCard, background: "linear-gradient(135deg,#1e40af,#3b82f6)" }}>
          <div style={styles.statLabel}>{T.received}</div>
          <div style={styles.statValue}>Rs {totalReceived.toFixed(0)}</div>
        </div>
        <div style={{ ...styles.statCard, background: totalBalance >= 0 ? "linear-gradient(135deg,#14532d,#16a34a)" : "linear-gradient(135deg,#7f1d1d,#dc2626)" }}>
          <div style={styles.statLabel}>{T.balance}</div>
          <div style={styles.statValue}>Rs {totalBalance.toFixed(0)}</div>
        </div>
        <div style={{ ...styles.statCard, background: "linear-gradient(135deg,#92400e,#d97706)" }}>
          <div style={styles.statLabel}>{T.advTaken}</div>
          <div style={styles.statValue}>Rs {totalAdvanceTaken.toFixed(0)}</div>
          <div style={styles.statSub}>{T.advCut} Rs {totalAdvanceCut.toFixed(0)}</div>
        </div>
        <div style={{ ...styles.statCard, background: advanceBalance >= 0 ? "linear-gradient(135deg,#4c1d95,#7c3aed)" : "linear-gradient(135deg,#7f1d1d,#dc2626)" }}>
          <div style={styles.statLabel}>{T.advLeft}</div>
          <div style={styles.statValue}>Rs {advanceBalance.toFixed(0)}</div>
          <div style={styles.statSub}>{advanceBalance >= 0 ? T.stillLeft : T.overCut}</div>
        </div>
      </div>

      {/* Recent Entries */}
      <div style={styles.sectionTitle}>{T.recent}</div>
      {filtered.length === 0 ? (
        <div style={styles.empty}>
          <p>{T.noEntry}</p>
          <p style={{ fontSize: "13px", color: "#9ca3af", marginTop: "6px" }}>{T.noEntrySub}</p>
        </div>
      ) : (
        filtered.slice(0, 10).map(entry => (
          <div key={entry.id} style={styles.entryRow}>
            <div style={styles.entryLeft}>
              <div style={styles.entryDate}>
                {new Date(entry.date + "T00:00:00").toLocaleDateString(locale, { day: "numeric", month: "short" })}
              </div>
              <div style={styles.entryWeight}>{entry.weight} {lang === "en" ? "kg" : "কি:গ্ৰা:"}</div>
            </div>
            <div style={styles.entryMid}>
              {entry.rate > 0
                ? <span style={styles.rateTag}>Rs{entry.rate}/kg</span>
                : <span style={styles.pendingTag}>{T.ratePending}</span>
              }
            </div>
            <div style={styles.entryRight}>
              {entry.totalAmount > 0 && <div style={styles.entryTotal}>Rs{entry.totalAmount.toFixed(0)}</div>}
              <div style={{ ...styles.entryBalance, color: (entry.balanceAmount || 0) >= 0 ? "#16a34a" : "#dc2626" }}>
                {T.baaki} Rs{(entry.balanceAmount || 0).toFixed(0)}
              </div>
            </div>
          </div>
        ))
      )}
      {filtered.length > 10 && (
        <div style={styles.moreText}>{T.more(filtered.length - 10)}</div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: "16px", paddingBottom: "90px", background: "#f8faf8", minHeight: "calc(100vh - 60px)", fontFamily: "'Segoe UI', sans-serif" },
  greetingCard: { background: "linear-gradient(135deg,#1a3a1a,#2d5a27,#4a7c3f)", borderRadius: "20px", padding: "20px", marginBottom: "16px", color: "white" },
  greetingTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" },
  greetingText: { fontSize: "13px", opacity: 0.8, marginBottom: "4px" },
  greetingName: { fontSize: "22px", fontWeight: "900", letterSpacing: "-0.5px" },
  leafBig: { fontSize: "40px" },
  totalEntries: { fontSize: "12px", opacity: 0.75, marginTop: "4px" },
  filterRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", background: "white", padding: "12px 16px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
  filterLabel: { fontSize: "13px", fontWeight: "700", whiteSpace: "nowrap" },
  filterInput: { border: "2px solid #e5e7eb", borderRadius: "8px", padding: "6px 10px", fontSize: "14px", flex: 1, outline: "none", fontFamily: "inherit" },
  clearBtn: { background: "#fee2e2", color: "#dc2626", border: "none", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontFamily: "inherit" },
  statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" },
  statCard: { borderRadius: "16px", padding: "16px", color: "white" },
  statLabel: { fontSize: "11px", opacity: 0.85, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" },
  statValueBig: { fontSize: "26px", fontWeight: "900", letterSpacing: "-0.5px" },
  statValue: { fontSize: "20px", fontWeight: "900", letterSpacing: "-0.5px" },
  statSub: { fontSize: "11px", opacity: 0.75, marginTop: "4px" },
  sectionTitle: { fontSize: "15px", fontWeight: "800", color: "#1a3a1a", marginBottom: "10px" },
  empty: { textAlign: "center", padding: "40px", color: "#6b7280", fontSize: "15px", background: "white", borderRadius: "14px" },
  entryRow: { background: "white", borderRadius: "12px", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" },
  entryLeft: { minWidth: "60px" },
  entryDate: { fontSize: "13px", fontWeight: "800", color: "#1a3a1a" },
  entryWeight: { fontSize: "12px", color: "#6b7280", marginTop: "2px" },
  entryMid: { flex: 1, paddingLeft: "10px" },
  rateTag: { fontSize: "12px", background: "#f0fdf4", color: "#166534", padding: "3px 8px", borderRadius: "6px", fontWeight: "700" },
  pendingTag: { fontSize: "11px", background: "#fef3c7", color: "#92400e", padding: "3px 8px", borderRadius: "6px", fontWeight: "700" },
  entryRight: { textAlign: "right" },
  entryTotal: { fontSize: "15px", fontWeight: "800", color: "#1a3a1a" },
  entryBalance: { fontSize: "11px", fontWeight: "700", marginTop: "2px" },
  moreText: { textAlign: "center", fontSize: "13px", color: "#6b7280", padding: "12px", background: "white", borderRadius: "10px", marginTop: "4px" },
};
