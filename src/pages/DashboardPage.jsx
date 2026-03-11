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
  const [calDate, setCalDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
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

  const filtered = entries;
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
      
      earning: "Total Earning", received: "Received",
      balance: "Balance", advTaken: "Advance Taken",
      advCut: "Cut:", advLeft: "Advance Left",
      stillLeft: "Still pending", overCut: "Over cut!",
      recent: "📋 Recent Entries",
      noEntry: "No entries yet", noEntrySub: "Add entry from Entry tab",
      calTitle: "📅 Entry Calendar", noEntryDay: "No entry", kg: "kg",
      prevMonth: "‹", nextMonth: "›",
      ratePending: "Rate pending", baaki: "Bal:",
      more: (n) => `+ ${n} more — see Records tab`,
      loading: "Loading...",
    },
    hi: {
      greet: () => { const h = new Date().getHours(); return h < 12 ? "शुभ प्रभात ☕" : h < 17 ? "नमस्ते 🌞" : "शुभ संध्या 🌆"; },
      entries: (n, kg) => `${n} प्रविष्टियां • ${kg} कि.ग्रा.`,
      
      earning: "कुल कमाई", received: "मिली राशि",
      balance: "बाकी राशि", advTaken: "लिया अग्रिम",
      advCut: "कटा:", advLeft: "बचा अग्रिम",
      stillLeft: "अभी बाकी", overCut: "ज्यादा कटा!",
      recent: "📋 हाल की प्रविष्टियां",
      noEntry: "कोई प्रविष्टि नहीं", noEntrySub: "प्रविष्टि टैब से जोड़ें",
      calTitle: "📅 एंट्री कैलेंडर", noEntryDay: "कोई प्रविष्टि नहीं", kg: "कि.ग्रा.",
      prevMonth: "‹", nextMonth: "›",
      ratePending: "हाॅर बाकी", baaki: "बाकी:",
      more: (n) => `+ ${n} और — रिकॉर्ड टैब देखें`,
      loading: "लोड हो रहा है...",
    },
    ne: {
      greet: () => { const h = new Date().getHours(); return h < 12 ? "शुभ बिहान ☕" : h < 17 ? "शुभ दिउँसो 🌞" : "शुभ साँझ 🌆"; },
      entries: (n, kg) => `${n} वटा प्रविष्टि • ${kg} कि.ग्रा.`,
      
      earning: "कुल आम्दानी", received: "पाएको रकम",
      balance: "बाँकी रकम", advTaken: "लिएको अग्रिम",
      advCut: "काटिएको:", advLeft: "बाँकी अग्रिम",
      stillLeft: "अझै बाँकी", overCut: "बढी काटियो!",
      recent: "📋 भर्खरका प्रविष्टि",
      noEntry: "कुनै प्रविष्टि छैन", noEntrySub: "प्रविष्टि ट्याबबाट थप्नुस्",
      calTitle: "📅 प्रविष्टि क्यालेन्डर", noEntryDay: "कुनै प्रविष्टि छैन", kg: "कि.ग्रा.",
      prevMonth: "‹", nextMonth: "›",
      ratePending: "दर बाँकी", baaki: "बाँकी:",
      more: (n) => `+ ${n} वटा — रेकर्ड ट्याब हेर्नुस्`,
      loading: "कृपया प्रतीक्षा गर्नुस्...",
    },
    as: {
      greet: () => { const h = new Date().getHours(); return h < 12 ? "শুভ পুৱা ☕" : h < 17 ? "শুভ অপৰাহ্ন 🌞" : "শুভ সন্ধিয়া 🌆"; },
      entries: (n, kg) => `${n} টা তথ্য • ${kg} কি:গ্ৰা:`,
      year: "📅 চন:", clear: "বাতিল",
      earning: "মুঠ উপাৰ্জন", received: "পোৱা পৰিমাণ",
      balance: "বাকী পৰিমাণ", advTaken: "লোৱা এডভান্স",
      advCut: "কটা:", advLeft: "বাকী এডভান্স",
      stillLeft: "এতিয়াও বাকী", overCut: "বেছি কটা হৈছে!",
      recent: "📋 শেহতীয়া তথ্য",
      noEntry: "কোনো তথ্য নাই", noEntrySub: "তথ্য টেবৰ পৰা যোগ কৰক",
      calTitle: "📅 তথ্য কেলেণ্ডাৰ", noEntryDay: "কোনো তথ্য নাই", kg: "কি:গ্ৰা:",
      prevMonth: "‹", nextMonth: "›",
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

      {/* Calendar */}
      {(() => {
        const year = calDate.getFullYear();
        const month = calDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const monthKey = `${year}-${String(month+1).padStart(2,"0")}`;
        
        // Build entry map for this month
        const entryMap = {};
        entries.forEach(e => {
          if (e.date?.startsWith(monthKey)) {
            const day = parseInt(e.date.split("-")[2]);
            if (!entryMap[day]) entryMap[day] = [];
            entryMap[day].push(e);
          }
        });

        const monthName = calDate.toLocaleString(locale, { month: "long", year: "numeric" });
        const dayNames = lang === "en" ? ["Su","Mo","Tu","We","Th","Fr","Sa"]
          : lang === "hi" ? ["रवि","सोम","मंगल","बुध","गुरु","शुक्र","शनि"]
          : lang === "ne" ? ["आइत","सोम","मंगल","बुध","बिहि","शुक्र","शनि"]
          : ["ৰবি","সোম","মঙল","বুধ","বৃহ","শুক্র","শনি"];

        const today = new Date();
        const isToday = (d) => today.getFullYear()===year && today.getMonth()===month && today.getDate()===d;

        const prevMonth = () => setCalDate(new Date(year, month-1, 1));
        const nextMonth = () => setCalDate(new Date(year, month+1, 1));

        // Build grid
        const cells = [];
        for (let i = 0; i < firstDay; i++) cells.push(null);
        for (let d2 = 1; d2 <= daysInMonth; d2++) cells.push(d2);

        

        return (
          <>
            <div style={{ background: d.card, borderRadius: "16px", padding: "14px", border: `1px solid ${d.cardBorder}`, boxShadow: d.shadow }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <button onClick={prevMonth} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: d.text, padding: "4px 8px" }}>‹</button>
                <div style={{ fontSize: "14px", fontWeight: "800", color: d.text }}>{monthName}</div>
                <button onClick={nextMonth} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: d.text, padding: "4px 8px" }}>›</button>
              </div>

              {/* Day names */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "2px", marginBottom: "6px" }}>
                {dayNames.map(dn => (
                  <div key={dn} style={{ textAlign: "center", fontSize: "10px", fontWeight: "700", color: d.subtext, padding: "2px 0" }}>{dn}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "3px" }}>
                {cells.map((day, idx) => {
                  if (!day) return <div key={idx} />;
                  const hasEntry = !!entryMap[day];
                  const isSel = selectedDay === day;
                  const itToday = isToday(day);
                  return (
                    <div key={day} onClick={() => setSelectedDay(isSel ? null : day)}
                      style={{
                        aspectRatio: "1", display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        borderRadius: "10px", cursor: "pointer",
                        background: isSel ? "#1a3a1a" : itToday ? (dark ? "#1e3a5f" : "#dbeafe") : hasEntry ? (dark ? "#14532d" : "#f0fdf4") : "transparent",
                        border: isSel ? "2px solid #2d5a27" : itToday ? "2px solid #3b82f6" : "2px solid transparent",
                        position: "relative",
                        transition: "all 0.15s",
                      }}>
                      {/* Tooltip above date */}
                      {isSel && hasEntry && (
                        <div style={{
                          position: "absolute", bottom: "calc(100% + 7px)", left: "50%",
                          transform: "translateX(-50%)",
                          background: "#1a3a1a", color: "white",
                          padding: "4px 8px", borderRadius: "8px",
                          fontSize: "11px", fontWeight: "800",
                          whiteSpace: "nowrap", zIndex: 10,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                        }}>
                          {entryMap[day].map(e => `🍃 ${e.weight} ${T.kg}`).join(" · ")}
                          {/* Arrow */}
                          <div style={{
                            position: "absolute", top: "100%", left: "50%",
                            transform: "translateX(-50%)",
                            width: 0, height: 0,
                            borderLeft: "5px solid transparent",
                            borderRight: "5px solid transparent",
                            borderTop: "5px solid #1a3a1a",
                          }} />
                        </div>
                      )}
                      <span style={{ fontSize: "12px", fontWeight: itToday || isSel ? "900" : "600", color: isSel ? "white" : itToday ? "#1d4ed8" : d.text }}>
                        {day}
                      </span>
                      {hasEntry && (
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: isSel ? "white" : "#16a34a", marginTop: "1px" }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>


          </>
        );
      })()}
    </div>
  );
}
