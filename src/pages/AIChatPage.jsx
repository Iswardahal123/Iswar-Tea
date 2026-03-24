import React, { useState, useRef, useEffect, useCallback } from "react";
import { auth, db } from "../firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useLang } from "../LanguageContext";
import { useDark } from "../DarkModeContext";

// ─── FERTILIZER PLAN ENGINE ────────────────────────────────────────────────
const getFertilizerPlan = (bigha) => {
  const b = parseFloat(bigha) || 1;
  // Base rates per bigha per application
  const ureaPerApp = 7.5;   // kg
  const dapPerApp  = 10;
  const mopPerApp  = 4;
  const mgso4Per   = 2.5;
  const zincPer    = 1;
  const neemPer    = 2.5;

  return {
    urea:  +(ureaPerApp * b).toFixed(1),
    dap:   +(dapPerApp  * b).toFixed(1),
    mop:   +(mopPerApp  * b).toFixed(1),
    mgso4: +(mgso4Per   * b).toFixed(1),
    zinc:  +(zincPer    * b).toFixed(1),
    neem:  +(neemPer    * b).toFixed(1),
    vermi: b <= 1 ? "1 trolley" : b <= 2 ? "2 trolley" : `${Math.ceil(b)} trolley`,
  };
};

// Weekly schedule — which week of which month gets what
const weeklySchedule = [
  { month: 1, week: 1, items: [], note_hi: "कोई खाद नहीं - मिट्टी की हल्की गुड़ाई करें", note_as: "কোনো সাৰ নাই - মাটি পাতলকৈ খান্দিব" },
  { month: 1, week: 2, items: [], note_hi: "ड्रेनेज सिस्टम चेक करें", note_as: "পানী নিষ্কাশন পৰীক্ষা কৰিব" },
  { month: 1, week: 3, items: [], note_hi: "खराब पत्ते हटाएं", note_as: "বেয়া পাত আতৰাব" },
  { month: 1, week: 4, items: [], note_hi: "अगले सीज़न की तैयारी करें", note_as: "পৰৱৰ্তী মৌসুমৰ প্ৰস্তুতি কৰিব" },
  { month: 2, week: 1, items: [], note_hi: "पुरानी शाखाओं की हल्की छंटाई करें", note_as: "পুৰণি ডালৰ পাতল ছাঁটনি কৰিব" },
  { month: 2, week: 2, items: [], note_hi: "मिट्टी परीक्षण करवाएं", note_as: "মাটি পৰীক্ষা কৰাব" },
  { month: 2, week: 3, items: [], note_hi: "कोई खाद नहीं - आराम का समय", note_as: "কোনো সাৰ নাই - জিৰণিৰ সময়" },
  { month: 2, week: 4, items: [], note_hi: "मार्च के लिए वर्मीकम्पोस्ट तैयार रखें", note_as: "মাৰ্চৰ বাবে কেঁচুসাৰ সাজু কৰিব" },
  { month: 3, week: 1, items: ["mitti"], note_hi: "मिट्टी की गहरी गुड़ाई करें", note_as: "মাটি গভীৰকৈ খান্দিব" },
  { month: 3, week: 2, items: ["vermi"], note_hi: "वर्मीकम्पोस्ट / गोबर खाद डालें", note_as: "কেঁচুসাৰ / গোবৰ সাৰ দিব" },
  { month: 3, week: 3, items: ["dap"],   note_hi: "DAP डालें - शाम को, पानी दें", note_as: "DAP দিব - গধুলি, পানী দিব" },
  { month: 3, week: 4, items: ["zinc"],  note_hi: "जिंक सल्फेट डालें", note_as: "জিংক ছালফেট দিব" },
  { month: 4, week: 1, items: [],        note_hi: "DAP absorb होने दें - कुछ नहीं", note_as: "DAP শোষণ হ'বলৈ দিব" },
  { month: 4, week: 2, items: ["pest"],  note_hi: "कीट जांच + नीम ऑयल स्प्रे 5ml/ltr", note_as: "পোক পৰীক্ষা + নিম তেল স্প্ৰে ৫মিলি/লিটাৰ" },
  { month: 4, week: 3, items: ["urea","mop"], note_hi: "यूरिया + MOP मिलाकर डालें (शाम को)", note_as: "ইউৰিয়া + MOP মিহলাই দিব (গধুলি)" },
  { month: 4, week: 4, items: ["mgso4"], note_hi: "MgSO4 डालें - पत्ते हरे होंगे", note_as: "MgSO4 দিব - পাত সেউজীয়া হ'ব" },
  { month: 5, week: 1, items: [],        note_hi: "खराब पत्तों की कटाई करें", note_as: "বেয়া পাত কাটিব" },
  { month: 5, week: 2, items: ["urea"],  note_hi: "यूरिया डालें - गर्मी में शाम को", note_as: "ইউৰিয়া দিব - গৰমত গধুলি দিব" },
  { month: 5, week: 3, items: ["neem"],  note_hi: "नीम केक डालें", note_as: "নিম কেক দিব" },
  { month: 5, week: 4, items: [],        note_hi: "पानी का ख्याल रखें - गर्मी ज्यादा है", note_as: "পানীৰ যত্ন লওক - গৰম বেছি" },
  { month: 6, week: 1, items: ["dap"],   note_hi: "DAP डालें - बारिश से पहले", note_as: "DAP দিব - বৰষুণৰ আগতে" },
  { month: 6, week: 2, items: ["zinc"],  note_hi: "जिंक सल्फेट डालें", note_as: "জিংক ছালফেট দিব" },
  { month: 6, week: 3, items: [],        note_hi: "ड्रेनेज ठीक करें - बारिश आने वाली है", note_as: "পানী নিষ্কাশন ঠিক কৰিব - বৰষুণ আহিব" },
  { month: 6, week: 4, items: ["urea","mop"], note_hi: "यूरिया + MOP मिलाकर डालें", note_as: "ইউৰিয়া + MOP মিহলাই দিব" },
  { month: 7, week: 1, items: ["mgso4"], note_hi: "MgSO4 डालें", note_as: "MgSO4 দিব" },
  { month: 7, week: 2, items: ["fungicide"], note_hi: "फंगीसाइड स्प्रे करें - बरसात में जरूरी", note_as: "ভেঁকুৰনাশক স্প্ৰে কৰিব - বৰষুণত জৰুৰী" },
  { month: 7, week: 3, items: ["urea"],  note_hi: "यूरिया डालें", note_as: "ইউৰিয়া দিব" },
  { month: 7, week: 4, items: [],        note_hi: "खराब शाखाएं हटाएं", note_as: "বেয়া ডাল আতৰাব" },
  { month: 8, week: 1, items: ["dap"],   note_hi: "DAP डालें - सबसे अच्छा महीना", note_as: "DAP দিব - সৰ্বোত্তম মাহ" },
  { month: 8, week: 2, items: ["mop"],   note_hi: "MOP डालें", note_as: "MOP দিব" },
  { month: 8, week: 3, items: ["urea"],  note_hi: "यूरिया डालें - अधिकतम उत्पादन", note_as: "ইউৰিয়া দিব - সৰ্বাধিক উৎপাদন" },
  { month: 8, week: 4, items: ["mgso4"], note_hi: "MgSO4 डालें + कटाई का समय", note_as: "MgSO4 দিব + চপোৱাৰ সময়" },
  { month: 9, week: 1, items: ["urea","mop"], note_hi: "यूरिया + MOP मिलाकर डालें", note_as: "ইউৰিয়া + MOP মিহলাই দিব" },
  { month: 9, week: 2, items: [],        note_hi: "मिट्टी परीक्षण करवाएं", note_as: "মাটি পৰীক্ষা কৰাব" },
  { month: 9, week: 3, items: ["zinc"],  note_hi: "जिंक सल्फेट डालें", note_as: "জিংক ছালফেট দিব" },
  { month: 9, week: 4, items: [],        note_hi: "हल्की छंटाई करें", note_as: "পাতল ছাঁটনি কৰিব" },
  { month: 10, week: 1, items: ["dap"],  note_hi: "DAP - आखिरी डोज़", note_as: "DAP - শেষ মাত্ৰা" },
  { month: 10, week: 2, items: ["neem"], note_hi: "नीम केक डालें", note_as: "নিম কেক দিব" },
  { month: 10, week: 3, items: ["mgso4"],note_hi: "MgSO4 - आखिरी बूस्ट", note_as: "MgSO4 - শেষ বৃদ্ধি" },
  { month: 10, week: 4, items: [],       note_hi: "कोई खाद नहीं - आराम शुरू", note_as: "কোনো সাৰ নাই - জিৰণি আৰম্ভ" },
  { month: 11, week: 1, items: ["vermi"],note_hi: "गोबर खाद / वर्मीकम्पोस्ट डालें", note_as: "গোবৰ সাৰ / কেঁচুসাৰ দিব" },
  { month: 11, week: 2, items: [],       note_hi: "गहरी गुड़ाई करें", note_as: "গভীৰকৈ মাটি খান্দিব" },
  { month: 11, week: 3, items: [],       note_hi: "पुरानी शाखाएं काटें", note_as: "পুৰণি ডালবোৰ কাটিব" },
  { month: 11, week: 4, items: [],       note_hi: "अगले साल की योजना बनाएं", note_as: "পৰৱৰ্তী বছৰৰ পৰিকল্পনা কৰিব" },
  { month: 12, week: 1, items: [],       note_hi: "कोई रासायनिक खाद नहीं", note_as: "কোনো ৰাসায়নিক সাৰ নাই" },
  { month: 12, week: 2, items: [],       note_hi: "मिट्टी स्वास्थ्य जांच करें", note_as: "মাটিৰ স্বাস্থ্য পৰীক্ষা কৰিব" },
  { month: 12, week: 3, items: [],       note_hi: "ड्रेनेज सुधारें", note_as: "পানী নিষ্কাশন উন্নত কৰিব" },
  { month: 12, week: 4, items: [],       note_hi: "मार्च के लिए तैयारी शुरू करें", note_as: "মাৰ্চৰ বাবে প্ৰস্তুতি আৰম্ভ কৰিব" },
];

const MONTH_NAMES_HI = ["","जनवरी","फरवरी","मार्च","अप्रैल","मई","जून","जुलाई","अगस्त","सितंबर","अक्टूबर","नवंबर","दिसंबर"];
const MONTH_NAMES_AS = ["","জানুৱাৰী","ফেব্ৰুৱাৰী","মাৰ্চ","এপ্ৰিল","মে'","জুন","জুলাই","আগষ্ট","ছেপ্টেম্বৰ","অক্টোবৰ","নৱেম্বৰ","ডিচেম্বৰ"];

const getWeekOfMonth = () => {
  const now = new Date();
  const day = now.getDate();
  return Math.ceil(day / 7);
};

const getCurrentWeekSchedule = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const week = Math.min(getWeekOfMonth(), 4);
  return weeklySchedule.find(s => s.month === month && s.week === week) || null;
};

const getNextWeekSchedule = () => {
  const now = new Date();
  let month = now.getMonth() + 1;
  let week = Math.min(getWeekOfMonth(), 4) + 1;
  if (week > 4) { week = 1; month = month === 12 ? 1 : month + 1; }
  return weeklySchedule.find(s => s.month === month && s.week === week) || null;
};

const itemLabel = (item, lang, qty) => {
  const labels = {
    urea:      { hi: `यूरिया`, as: `ইউৰিয়া` },
    dap:       { hi: `DAP`, as: `DAP` },
    mop:       { hi: `MOP`, as: `MOP` },
    mgso4:     { hi: `MgSO4 (मैग्नीशियम सल्फेट)`, as: `MgSO4 (মেগনেছিয়াম ছালফেট)` },
    zinc:      { hi: `जिंक सल्फेट`, as: `জিংক ছালফেট` },
    neem:      { hi: `नीम केक`, as: `নিম কেক` },
    vermi:     { hi: `वर्मीकम्पोस्ट / गोबर खाद`, as: `কেঁচুসাৰ / গোবৰ সাৰ` },
    fungicide: { hi: `फंगीसाइड`, as: `ভেঁকুৰনাশক` },
    pest:      { hi: `नीम ऑयल (5ml/लीटर पानी)`, as: `নিম তেল (৫মিলি/লিটাৰ পানী)` },
    mitti:     { hi: `गहरी गुड़ाई`, as: `গভীৰকৈ মাটি খান্দিব` },
  };
  const name = labels[item]?.[lang] || item;
  if (qty && !["fungicide","pest","mitti"].includes(item)) {
    return `${name} — ${qty}`;
  }
  return name;
};

// ─── REPLY ENGINE ─────────────────────────────────────────────────────────
const generateReply = (msg, entries, lang, bigha, setBigha, setMode) => {
  const m = msg.toLowerCase().trim();
  const L = lang === "hi" ? "hi" : "as";

  // ── BIGHA DETECTION ──
  const bighaMatch = msg.match(/(\d+(\.\d+)?)\s*(बिघा|bigha|বিঘা)/i);
  if (bighaMatch) {
    const b = parseFloat(bighaMatch[1]);
    setBigha(b);
    const plan = getFertilizerPlan(b);
    if (L === "hi") {
      return `✅ ${b} बिघा के लिए plan तैयार!\n\nआपका साल भर का खाद:\n🟡 यूरिया: ${plan.urea} kg (हर बार)\n🔵 DAP: ${plan.dap} kg (हर बार)\n🟣 MOP: ${plan.mop} kg (हर बार)\n🟢 MgSO4: ${plan.mgso4} kg\n⚪ जिंक सल्फेट: ${plan.zinc} kg\n🌿 नीम केक: ${plan.neem} kg\n🌱 वर्मीकम्पोस्ट: ${plan.vermi}\n\nअभी पूछो:\n• "इस हफ्ते क्या करें"\n• "अगले हफ्ते क्या खरीदें"\n• "पूरा plan दिखाओ"\n• "इस महीने का plan"`;
    }
    return `✅ ${b} বিঘাৰ বাবে পৰিকল্পনা সাজু!\n\nআপোনাৰ গোটেই বছৰৰ সাৰ:\n🟡 ইউৰিয়া: ${plan.urea} কি.গ্ৰা. (প্ৰতিবাৰ)\n🔵 DAP: ${plan.dap} কি.গ্ৰা. (প্ৰতিবাৰ)\n🟣 MOP: ${plan.mop} কি.গ্ৰা. (প্ৰতিবাৰ)\n🟢 MgSO4: ${plan.mgso4} কি.গ্ৰা.\n⚪ জিংক ছালফেট: ${plan.zinc} কি.গ্ৰা.\n🌿 নিম কেক: ${plan.neem} কি.গ্ৰা.\n🌱 কেঁচুসাৰ: ${plan.vermi}\n\nএতিয়া সুধিব:\n• "এই সপ্তাহত কি কৰিব"\n• "পৰৱৰ্তী সপ্তাহত কি কিনিব"\n• "সম্পূৰ্ণ পৰিকল্পনা দেখুৱাওক"\n• "এই মাহৰ পৰিকল্পনা"`;
  }

  // ── THIS WEEK ──
  if (m.match(/this week|is hafte|इस हफ्ते|इस सप्ताह|এই সপ্তাহ|ইস হপ্তে/)) {
    const sched = getCurrentWeekSchedule();
    if (!sched) return L === "hi" ? "इस हफ्ते का डेटा नहीं मिला।" : "এই সপ্তাহৰ তথ্য পোৱা নগ'ল।";
    const now = new Date();
    const mName = L === "hi" ? MONTH_NAMES_HI[now.getMonth()+1] : MONTH_NAMES_AS[now.getMonth()+1];
    const plan = bigha ? getFertilizerPlan(bigha) : null;

    let itemsText = "";
    if (sched.items.length === 0) {
      itemsText = L === "hi" ? "❌ कोई खाद नहीं" : "❌ কোনো সাৰ নাই";
    } else {
      itemsText = sched.items.map(item => {
        const qty = plan ? plan[item] ? `${plan[item]} kg` : plan.vermi : (bigha ? "?" : "bigha batao");
        return `✅ ${itemLabel(item, L, item === "vermi" ? plan?.vermi : qty)}`;
      }).join("\n");
    }

    if (L === "hi") {
      return `📅 ${mName} - सप्ताह ${sched.week}\n\n${itemsText}\n\n📝 ${sched.note_hi}\n\n⚠️ याद रखें:\n• हमेशा शाम को डालें\n• डालने के बाद पानी दें\n• यूरिया + DAP कभी नहीं मिलाएं`;
    }
    return `📅 ${mName} - সপ্তাহ ${sched.week}\n\n${itemsText}\n\n📝 ${sched.note_as}\n\n⚠️ মনত ৰাখিব:\n• সদায় গধুলি দিব\n• দিয়াৰ পিছত পানী দিব\n• ইউৰিয়া + DAP কেতিয়াও নিমিহলাব`;
  }

  // ── NEXT WEEK / WHAT TO BUY ──
  if (m.match(/next week|agla|अगला|अगले|পৰৱৰ্তী সপ্তাহ|khareedo|kharido|खरीदो|কিনিব/)) {
    const sched = getNextWeekSchedule();
    if (!sched) return L === "hi" ? "अगले हफ्ते का डेटा नहीं मिला।" : "পৰৱৰ্তী সপ্তাহৰ তথ্য পোৱা নগ'ল।";
    const plan = bigha ? getFertilizerPlan(bigha) : null;
    const mName = L === "hi" ? MONTH_NAMES_HI[sched.month] : MONTH_NAMES_AS[sched.month];

    let buyList = "";
    if (sched.items.length === 0) {
      buyList = L === "hi" ? "❌ कुछ खरीदने की जरूरत नहीं" : "❌ একো কিনিব নালাগে";
    } else {
      buyList = sched.items
        .filter(i => !["pest","mitti","fungicide"].includes(i))
        .map(item => {
          const qty = plan?.[item] ? `${plan[item]} kg` : plan?.vermi || "?";
          return `🛒 ${itemLabel(item, L, item === "vermi" ? plan?.vermi : qty)}`;
        }).join("\n");
      if (!buyList) buyList = L === "hi" ? "स्प्रे / गुड़ाई का काम है" : "স্প্ৰে / খান্দাৰ কাম আছে";
    }

    if (L === "hi") {
      return `🛒 ${mName} - सप्ताह ${sched.week} के लिए खरीदें:\n\n${buyList}\n\n📝 काम: ${sched.note_hi}\n\n💡 बाज़ार जाने से पहले यह list लें!`;
    }
    return `🛒 ${mName} - সপ্তাহ ${sched.week}ৰ বাবে কিনিব:\n\n${buyList}\n\n📝 কাম: ${sched.note_as}\n\n💡 বজাৰ যোৱাৰ আগতে এই তালিকা লওক!`;
  }

  // ── THIS MONTH PLAN ──
  if (m.match(/this month|is mahine|इस महीने|এই মাহ|month plan|মাহৰ পৰিকল্পনা/)) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const mName = L === "hi" ? MONTH_NAMES_HI[month] : MONTH_NAMES_AS[month];
    const monthSchedule = weeklySchedule.filter(s => s.month === month);
    const plan = bigha ? getFertilizerPlan(bigha) : null;

    let result = L === "hi" ? `📅 ${mName} का पूरा plan:\n\n` : `📅 ${mName}ৰ সম্পূৰ্ণ পৰিকল্পনা:\n\n`;

    monthSchedule.forEach(s => {
      const weekLabel = L === "hi" ? `सप्ताह ${s.week}` : `সপ্তাহ ${s.week}`;
      if (s.items.length === 0) {
        result += `${weekLabel}: ${L === "hi" ? s.note_hi : s.note_as}\n`;
      } else {
        const itemStr = s.items.map(item => {
          const qty = plan?.[item] ? `${plan[item]}kg` : plan?.vermi || "";
          return itemLabel(item, L, item === "vermi" ? plan?.vermi : qty);
        }).join(" + ");
        result += `${weekLabel}: ${itemStr}\n📝 ${L === "hi" ? s.note_hi : s.note_as}\n`;
      }
      result += "\n";
    });
    return result.trim();
  }

  // ── FULL YEAR PLAN ──
  if (m.match(/full plan|pura plan|poora|पूरा plan|সম্পূৰ্ণ পৰিকল্পনা|saal bhar|साल भर/)) {
    const plan = bigha ? getFertilizerPlan(bigha) : null;
    const bText = bigha ? ` (${bigha} बिघा)` : "";
    const bTextAs = bigha ? ` (${bigha} বিঘা)` : "";

    if (L === "hi") {
      return `📊 साल भर का plan${bText}:\n\n❄️ जन-फर: आराम + तैयारी\n🌸 मार्च: गुड़ाई → वर्मीकम्पोस्ट → DAP${plan ? ` ${plan.dap}kg` : ""} → जिंक${plan ? ` ${plan.zinc}kg` : ""}\n🌱 अप्रैल: कीट जांच → यूरिया${plan ? ` ${plan.urea}kg` : ""}+MOP${plan ? ` ${plan.mop}kg` : ""} → MgSO4${plan ? ` ${plan.mgso4}kg` : ""}\n☀️ मई: कटाई → यूरिया${plan ? ` ${plan.urea}kg` : ""} → नीम केक${plan ? ` ${plan.neem}kg` : ""}\n🌧️ जून: DAP${plan ? ` ${plan.dap}kg` : ""} → जिंक → ड्रेनेज → यूरिया+MOP\n🌧️ जुलाई: MgSO4 → फंगीसाइड → यूरिया\n🌿 अगस्त: DAP → MOP → यूरिया → MgSO4 (सबसे अच्छा महीना!)\n🍂 सितंबर: यूरिया+MOP → मिट्टी जांच → जिंक\n🍁 अक्टूबर: DAP${plan ? ` ${plan.dap}kg` : ""} → नीम → MgSO4\n❄️ नव-दिस: गोबर खाद + आराम\n\n${bigha ? `💰 अनुमानित खर्च: Rs. ${Math.round(bigha * 2200)} - ${Math.round(bigha * 2500)}/साल` : "💡 bigha बताओ for exact cost"}`;
    }
    return `📊 গোটেই বছৰৰ পৰিকল্পনা${bTextAs}:\n\n❄️ জান-ফেব: জিৰণি + প্ৰস্তুতি\n🌸 মাৰ্চ: খান্দা → কেঁচুসাৰ → DAP${plan ? ` ${plan.dap}কি.গ্ৰা.` : ""} → জিংক${plan ? ` ${plan.zinc}কি.গ্ৰা.` : ""}\n🌱 এপ্ৰিল: পোক পৰীক্ষা → ইউৰিয়া${plan ? ` ${plan.urea}কি.গ্ৰা.` : ""}+MOP${plan ? ` ${plan.mop}কি.গ্ৰা.` : ""} → MgSO4${plan ? ` ${plan.mgso4}কি.গ্ৰা.` : ""}\n☀️ মে': কটা → ইউৰিয়া${plan ? ` ${plan.urea}কি.গ্ৰা.` : ""} → নিম কেক${plan ? ` ${plan.neem}কি.গ্ৰা.` : ""}\n🌧️ জুন: DAP${plan ? ` ${plan.dap}কি.গ্ৰা.` : ""} → জিংক → পানী নিষ্কাশন → ইউৰিয়া+MOP\n🌧️ জুলাই: MgSO4 → ভেঁকুৰনাশক → ইউৰিয়া\n🌿 আগষ্ট: DAP → MOP → ইউৰিয়া → MgSO4 (সৰ্বোত্তম মাহ!)\n🍂 ছেপ্টেম্বৰ: ইউৰিয়া+MOP → মাটি পৰীক্ষা → জিংক\n🍁 অক্টোবৰ: DAP${plan ? ` ${plan.dap}কি.গ্ৰা.` : ""} → নিম → MgSO4\n❄️ নভ-ডিচ: গোবৰ সাৰ + জিৰণি\n\n${bigha ? `💰 আনুমানিক খৰচ: Rs. ${Math.round(bigha * 2200)} - ${Math.round(bigha * 2500)}/বছৰ` : "💡 বিঘা সংখ্যা জনাওক exact খৰচ জানিবলৈ"}`;
  }

  // ── MIXING RULES ──
  if (m.match(/mix|मिलाएं|মিহলাওক|milao|urea dap|dap urea/)) {
    if (L === "hi") {
      return `🧪 खाद मिलाने के नियम:\n\n✅ यूरिया + MOP = सुरक्षित\n❌ यूरिया + DAP = कभी नहीं!\n   (अमोनिया गैस बनती है - 30-40% नाइट्रोजन बर्बाद)\n✅ DAP + MOP = सुरक्षित\n✅ MgSO4 + जिंक = सुरक्षित\n\n💡 टिप: DAP और यूरिया के बीच कम से कम 15-20 दिन का gap रखें`;
    }
    return `🧪 সাৰ মিহলোৱাৰ নিয়ম:\n\n✅ ইউৰিয়া + MOP = নিৰাপদ\n❌ ইউৰিয়া + DAP = কেতিয়াও নহয়!\n   (এমোনিয়া গেছ ওলায় - ৩০-৪০% নাইট্ৰজেন নষ্ট হয়)\n✅ DAP + MOP = নিৰাপদ\n✅ MgSO4 + জিংক = নিৰাপদ\n\n💡 টিপ: DAP আৰু ইউৰিয়াৰ মাজত কমেও ১৫-২০ দিনৰ ব্যৱধান ৰাখিব`;
  }

  // ── GOLDEN RULES ──
  if (m.match(/rules|नियम|নিয়ম|tips|golden/)) {
    if (L === "hi") {
      return `⚠️ Golden Rules:\n\n❌ कभी नहीं:\n• यूरिया + DAP एक साथ\n• तेज धूप में खाद डालना\n• ज्यादा खाद देना\n• पानी दिए बिना छोड़ना\n\n✅ हमेशा:\n• शाम को डालें\n• डालने के बाद पानी दें\n• बारिश से 1 दिन पहले डालें\n• हर 6 महीने में मिट्टी जांच\n• खाली जगह में जिंक + MgSO4 ज्यादा दें`;
    }
    return `⚠️ সোণালী নিয়ম:\n\n❌ কেতিয়াও নকৰিব:\n• ইউৰিয়া + DAP একেলগে\n• তীব্ৰ ৰ'দত সাৰ দিব\n• অতিৰিক্ত সাৰ দিব\n• পানী নিদিয়াকৈ এৰি থ'ব\n\n✅ সদায় কৰিব:\n• গধুলি দিব\n• দিয়াৰ পিছত পানী দিব\n• বৰষুণৰ ১ দিন আগতে দিব\n• প্ৰতি ৬ মাহত মাটি পৰীক্ষা\n• খালী ঠাইত জিংক + MgSO4 বেছি দিব`;
  }

  // ── YIELD ESTIMATE ──
  if (m.match(/patta|patte|पत्ता|পাত|yield|kitna niklega|কিমান ওলাব/)) {
    const b = bigha || 1;
    const currentYield = Math.round(b * 25);
    const after3m = Math.round(b * 55);
    const after1y = Math.round(b * 100);
    if (L === "hi") {
      return `🌿 ${b} बिघा से पत्ता उत्पादन:\n\nअभी (patchy condition):\n• ~${currentYield}-${currentYield+10} kg/हफ्ते\n\n3-6 महीने plan follow करने के बाद:\n• ~${after3m}-${after3m+20} kg/हफ्ते\n\n1 साल बाद (पूरी recovery):\n• ~${after1y}-${after1y+25} kg/हफ्ते\n\n🍵 Note: 4-5 kg ताज़े पत्ते = 1 kg सूखी चाय`;
    }
    return `🌿 ${b} বিঘাৰ পৰা পাত উৎপাদন:\n\nএতিয়া (patchy):\n• ~${currentYield}-${currentYield+10} কি.গ্ৰা./সপ্তাহ\n\n৩-৬ মাহ পৰিকল্পনা অনুসৰণ কৰাৰ পিছত:\n• ~${after3m}-${after3m+20} কি.গ্ৰা./সপ্তাহ\n\n১ বছৰ পিছত (সম্পূৰ্ণ পুনৰুদ্ধাৰ):\n• ~${after1y}-${after1y+25} কি.গ্ৰা./সপ্তাহ\n\n🍵 মনত ৰাখিব: ৪-৫ কি.গ্ৰা. তাজা পাত = ১ কি.গ্ৰা. শুকান চাহ`;
  }

  // ── ENTRIES DATA (original functionality) ──
  const sorted = [...entries].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const totalWeight = entries.reduce((s, e) => s + (e.weight || 0), 0);
  const totalAmount = entries.reduce((s, e) => s + (e.totalAmount || 0), 0);
  const totalBalance = entries.reduce((s, e) => s + (e.balanceAmount || 0), 0);
  const totalAdvance = entries.reduce((s, e) => s + (e.advanceCut || 0), 0);
  const totalReceived = entries.reduce((s, e) => s + (e.amountReceived || 0), 0);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthEntries = entries.filter(e => e.date?.startsWith(thisMonth));
  const monthWeight = monthEntries.reduce((s, e) => s + (e.weight || 0), 0);
  const monthAmount = monthEntries.reduce((s, e) => s + (e.totalAmount || 0), 0);
  const monthBalance = monthEntries.reduce((s, e) => s + (e.balanceAmount || 0), 0);
  const latest = sorted[0];

  if (entries.length === 0) {
    return L === "hi"
      ? "कोई entry नहीं है अभी!\n\nलेकिन खाद के बारे में पूछ सकते हैं:\n• \"इस हफ्ते क्या करें\"\n• \"2 बिघा का plan\"\n• \"अगले हफ्ते क्या खरीदें\""
      : "এতিয়ালৈ কোনো তথ্য নাই!\n\nকিন্তু সাৰৰ বিষয়ে সুধিব পাৰে:\n• \"এই সপ্তাহত কি কৰিব\"\n• \"২ বিঘাৰ পৰিকল্পনা\"\n• \"পৰৱৰ্তী সপ্তাহত কি কিনিব\"";
  }

  if (m.match(/last|latest|recent|শেষ|আখৰী|aakhri|अन्तिम|आखिरी/)) {
    if (!latest) return L === "hi" ? "कोई entry नहीं।" : "কোনো তথ্য নাই।";
    return L === "hi"
      ? `📌 आखिरी Entry\n\n📅 ${latest.date}\n⚖️ वजन: ${latest.weight} kg\n💲 दर: ${latest.rate || "N/A"}\n💰 कुल: Rs ${latest.totalAmount}\n✂️ अग्रिम: Rs ${latest.advanceCut}\n💵 मिली: Rs ${latest.amountReceived}\n🟢 बाकी: Rs ${latest.balanceAmount}`
      : `📌 শেষ তথ্য\n\n📅 ${latest.date}\n⚖️ ওজন: ${latest.weight} কি.গ্ৰা.\n💲 হাৰ: ${latest.rate || "N/A"}\n💰 মুঠ: ${latest.totalAmount} টকা\n✂️ এডভান্স: ${latest.advanceCut} টকা\n💵 পোৱা: ${latest.amountReceived} টকা\n🟢 বাকী: ${latest.balanceAmount} টকা`;
  }

  if (m.match(/balance|বাকী|baaki|बाकी|remaining/)) {
    return L === "hi"
      ? `💳 बाकी राशि: Rs ${totalBalance}\n\n• कुल कमाई: Rs ${totalAmount}\n• मिली राशि: Rs ${totalReceived}\n• अग्रिम कटा: Rs ${totalAdvance}\n\n${totalBalance > 0 ? "✅ पैसा लेना बाकी है" : totalBalance < 0 ? "⚠️ ज्यादा मिल गया!" : "✅ हिसाब बराबर"}`
      : `💳 বাকী পৰিমাণ: ${totalBalance} টকা\n\n• মুঠ উপাৰ্জন: ${totalAmount} টকা\n• পোৱা পৰিমাণ: ${totalReceived} টকা\n• এডভান্স কটা: ${totalAdvance} টকা\n\n${totalBalance > 0 ? "✅ টকা পোৱা বাকী আছে" : totalBalance < 0 ? "⚠️ অতিৰিক্ত পোৱা হৈছে!" : "✅ হিচাব সমান"}`;
  }

  if (m.match(/month|মাহ|महिना|महीने/)) {
    if (!monthEntries.length) return L === "hi" ? "इस महीने कोई entry नहीं।" : "এই মাহত কোনো তথ্য নাই।";
    return L === "hi"
      ? `📅 इस महीने\n\n⚖️ ${monthWeight.toFixed(1)} kg\n💰 Rs ${monthAmount}\n🟢 Rs ${monthBalance}\n📋 ${monthEntries.length} प्रविष्टियां`
      : `📅 এই মাহত\n\n⚖️ ${monthWeight.toFixed(1)} কি.গ্ৰা.\n💰 ${monthAmount} টকা\n🟢 ${monthBalance} টকা\n📋 ${monthEntries.length} টা তথ্য`;
  }

  if (m.match(/report|full|poora|पूरा|সম্পূৰ্ণ হিচাব/)) {
    return L === "hi"
      ? `📊 पूरा हिसाब\n\n🍃 कुल वजन: ${totalWeight.toFixed(1)} kg\n📋 कुल entries: ${entries.length}\n\n💰 कुल कमाई: Rs ${totalAmount}\n• मिली: Rs ${totalReceived}\n• अग्रिम: Rs ${totalAdvance}\n• 🟢 बाकी: Rs ${totalBalance}\n\n📅 इस महीने: ${monthEntries.length} • ${monthWeight.toFixed(1)} kg • Rs ${monthAmount}`
      : `📊 সম্পূৰ্ণ হিচাব\n\n🍃 মুঠ ওজন: ${totalWeight.toFixed(1)} কি.গ্ৰা.\n📋 মুঠ তথ্য: ${entries.length}\n\n💰 মুঠ উপাৰ্জন: ${totalAmount} টকা\n• পোৱা: ${totalReceived} টকা\n• এডভান্স: ${totalAdvance} টকা\n• 🟢 বাকী: ${totalBalance} টকা\n\n📅 এই মাহত: ${monthEntries.length} • ${monthWeight.toFixed(1)} কি.গ্ৰা. • ${monthAmount} টকা`;
  }

  // Default not found
  return L === "hi"
    ? `समझ नहीं आया 😅\n\nये try करें:\n🌿 खाद के बारे में:\n• "2 बिघा का plan"\n• "इस हफ्ते क्या करें"\n• "अगले हफ्ते क्या खरीदें"\n• "पूरा plan दिखाओ"\n• "मिलाने के नियम"\n\n💰 पैसे के बारे में:\n• आखिरी entry\n• बाकी राशि\n• इस महीने\n• पूरा हिसाब`
    : `বুজিব পৰা নাই 😅\n\nএইবোৰ চেষ্টা কৰক:\n🌿 সাৰৰ বিষয়ে:\n• "২ বিঘাৰ পৰিকল্পনা"\n• "এই সপ্তাহত কি কৰিব"\n• "পৰৱৰ্তী সপ্তাহত কি কিনিব"\n• "সম্পূৰ্ণ পৰিকল্পনা দেখুৱাওক"\n• "মিহলোৱাৰ নিয়ম"\n\n💰 টকাৰ বিষয়ে:\n• শেষ তথ্য\n• বাকী পৰিমাণ\n• এই মাহ\n• সম্পূৰ্ণ হিচাব`;
};

// ─── COMPONENT ─────────────────────────────────────────────────────────────
export default function AIChatPage({ user }) {
  const { lang } = useLang();
  const { dark } = useDark();
  const L = (lang === "hi" || lang === "en") ? "hi" : "as";

  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [entries, setEntries] = useState([]);
  const [typing, setTyping] = useState(false);
  const [bigha, setBigha] = useState(null);
  const [showWeeklyAlert, setShowWeeklyAlert] = useState(true);
  const bottomRef = useRef(null);

  // Load entries from Firebase
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

  // Current week reminder
  const currSched = getCurrentWeekSchedule();
  const nextSched = getNextWeekSchedule();
  const now = new Date();
  const currMonthName = L === "hi" ? MONTH_NAMES_HI[now.getMonth()+1] : MONTH_NAMES_AS[now.getMonth()+1];

  const sendMessage = (text) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput("");
    setStarted(true);
    setMessages(p => [...p, { role: "user", text: msg }]);
    setTyping(true);
    setTimeout(() => {
      const reply = generateReply(msg, entries, L, bigha, setBigha);
      setMessages(p => [...p, { role: "bot", text: reply }]);
      setTyping(false);
    }, 600);
  };

  // Dark palette
  const d = {
    bg: dark ? "#0f172a" : "#f0f4f0",
    card: dark ? "#1e293b" : "white",
    cardBorder: dark ? "1px solid #334155" : "1px solid #e5e7eb",
    text: dark ? "#f1f5f9" : "#1a3a1a",
    subtext: dark ? "#94a3b8" : "#6b7280",
    quickBar: dark ? "#1e293b" : "white",
    quickBarBorder: dark ? "#334155" : "#e5e7eb",
    backBtn: dark ? "#334155" : "#f3f4f6",
    backBtnColor: dark ? "#f1f5f9" : "#374151",
    quickBtn: dark ? "#14532d" : "#f0fdf4",
    quickBtnBorder: dark ? "#16a34a" : "#86efac",
    quickBtnColor: dark ? "#86efac" : "#166534",
    botBubble: dark ? "#1e293b" : "white",
    botBubbleText: dark ? "#f1f5f9" : "#1a1a1a",
    botShadow: dark ? "0 2px 10px rgba(0,0,0,0.4)" : "0 2px 10px rgba(0,0,0,0.08)",
    inputBar: dark ? "#1e293b" : "white",
    inputBarBorder: dark ? "#334155" : "#e5e7eb",
    input: dark ? "#0f172a" : "white",
    inputBorder: dark ? "#475569" : "#e5e7eb",
    inputText: dark ? "#f1f5f9" : "#1a1a1a",
    alertBg: dark ? "#1c2f1c" : "#f0fdf4",
    alertBorder: dark ? "#16a34a" : "#86efac",
    alertText: dark ? "#86efac" : "#166534",
    alertSubText: dark ? "#4ade80" : "#15803d",
    nextBg: dark ? "#1e1a2e" : "#faf5ff",
    nextBorder: dark ? "#7c3aed" : "#c4b5fd",
    nextText: dark ? "#c4b5fd" : "#6d28d9",
  };

  const quickBtns = L === "hi" ? [
    { label: "📅 इस हफ्ते", msg: "इस हफ्ते क्या करें" },
    { label: "🛒 खरीदारी", msg: "अगले हफ्ते क्या खरीदें" },
    { label: "📊 साल का plan", msg: "पूरा plan दिखाओ" },
    { label: "🌿 पत्ता yield", msg: "पत्ता कितना निकलेगा" },
    { label: "🧪 मिलाने के नियम", msg: "मिलाने के नियम" },
    { label: "⚠️ Golden Rules", msg: "rules" },
    { label: "💰 बाकी राशि", msg: "balance" },
    { label: "📋 पूरा हिसाब", msg: "report" },
  ] : [
    { label: "📅 এই সপ্তাহ", msg: "এই সপ্তাহত কি কৰিব" },
    { label: "🛒 কিনাকাটা", msg: "পৰৱৰ্তী সপ্তাহত কি কিনিব" },
    { label: "📊 বছৰৰ পৰিকল্পনা", msg: "সম্পূৰ্ণ পৰিকল্পনা দেখুৱাওক" },
    { label: "🌿 পাত yield", msg: "পাত কিমান ওলাব" },
    { label: "🧪 মিহলোৱাৰ নিয়ম", msg: "মিহলোৱাৰ নিয়ম" },
    { label: "⚠️ নিয়মসমূহ", msg: "নিয়ম" },
    { label: "💰 বাকী পৰিমাণ", msg: "বাকী" },
    { label: "📋 সম্পূৰ্ণ হিচাব", msg: "report" },
  ];

  // ── WEEKLY ALERT BANNER ──
  const WeeklyAlert = () => {
    if (!showWeeklyAlert || !currSched) return null;
    const hasItems = currSched.items.length > 0;
    const plan = bigha ? getFertilizerPlan(bigha) : null;
    const itemsPreview = hasItems
      ? currSched.items.slice(0,2).map(i => {
          const qty = plan?.[i] ? ` ${plan[i]}kg` : plan?.vermi ? ` ${plan.vermi}` : "";
          return itemLabel(i, L, qty);
        }).join(", ")
      : (L === "hi" ? "कोई खाद नहीं" : "কোনো সাৰ নাই");

    return (
      <div style={{ margin: "12px 16px 0", borderRadius: "14px", background: hasItems ? d.alertBg : d.bg, border: `1.5px solid ${hasItems ? d.alertBorder : d.quickBtnBorder}`, padding: "12px 14px", position: "relative" }}>
        <button onClick={() => setShowWeeklyAlert(false)} style={{ position: "absolute", top: 8, right: 10, background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: d.subtext }}>✕</button>
        <div style={{ fontSize: "11px", fontWeight: "800", color: d.alertText, marginBottom: "4px" }}>
          {L === "hi" ? `🔔 इस हफ्ते का काम (${currMonthName})` : `🔔 এই সপ্তাহৰ কাম (${currMonthName})`}
        </div>
        <div style={{ fontSize: "13px", fontWeight: "700", color: d.alertSubText }}>
          {hasItems ? (L === "hi" ? `✅ ${itemsPreview} डालें` : `✅ ${itemsPreview} দিব`) : itemsPreview}
        </div>
        {bigha ? null : (
          <div style={{ fontSize: "11px", color: d.subtext, marginTop: "4px" }}>
            {L === "hi" ? `💡 "${2} बिघा का plan" लिखें exact मात्रा के लिए` : `💡 "${2} বিঘাৰ পৰিকল্পনা" লিখক exact পৰিমাণৰ বাবে`}
          </div>
        )}
        <button onClick={() => sendMessage(L === "hi" ? "इस हफ्ते क्या करें" : "এই সপ্তাহত কি কৰিব")}
          style={{ marginTop: "8px", background: "linear-gradient(135deg,#1a3a1a,#2d5a27)", color: "white", border: "none", borderRadius: "20px", padding: "6px 14px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>
          {L === "hi" ? "पूरी जानकारी →" : "বিস্তাৰিত →"}
        </button>
      </div>
    );
  };

  // ── NEXT WEEK BANNER ──
  const NextWeekTeaser = () => {
    if (!nextSched || nextSched.items.length === 0) return null;
    const plan = bigha ? getFertilizerPlan(bigha) : null;
    const itemsPreview = nextSched.items.slice(0,2).map(i => {
      const qty = plan?.[i] ? ` ${plan[i]}kg` : plan?.vermi ? ` ${plan.vermi}` : "";
      return itemLabel(i, L, qty);
    }).join(", ");
    const nextMName = L === "hi" ? MONTH_NAMES_HI[nextSched.month] : MONTH_NAMES_AS[nextSched.month];
    return (
      <div style={{ margin: "8px 16px 0", borderRadius: "12px", background: d.nextBg, border: `1px dashed ${d.nextBorder}`, padding: "10px 14px" }}>
        <div style={{ fontSize: "11px", fontWeight: "700", color: d.nextText }}>
          {L === "hi" ? `🛒 अगले हफ्ते (${nextMName}) तैयार रखें: ${itemsPreview}` : `🛒 পৰৱৰ্তী সপ্তাহ (${nextMName}): ${itemsPreview} সাজু ৰাখিব`}
        </div>
      </div>
    );
  };

  // ── BIGHA INPUT CARD ──
  const BighaCard = () => (
    <div style={{ margin: "12px 16px", borderRadius: "16px", background: d.card, border: d.cardBorder, padding: "16px", boxShadow: d.botShadow }}>
      <div style={{ fontSize: "28px", textAlign: "center", marginBottom: "6px" }}>🌿</div>
      <div style={{ fontSize: "15px", fontWeight: "800", color: d.text, textAlign: "center", marginBottom: "4px" }}>
        {L === "hi" ? "आपकी चाय बागान AI सहायक" : "আপোনাৰ চাহ বাগান AI সহায়ক"}
      </div>
      <div style={{ fontSize: "12px", color: d.subtext, textAlign: "center", marginBottom: "16px" }}>
        {L === "hi" ? "बिघा बताएं → खाद का पूरा plan पाएं" : "বিঘা জনাওক → সাৰৰ সম্পূৰ্ণ পৰিকল্পনা পাওক"}
      </div>

      {/* Bigha input */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
        <input
          type="number"
          placeholder={L === "hi" ? "बिघा लिखें (जैसे 2)" : "বিঘা লিখক (যেনে ২)"}
          style={{ flex: 1, padding: "12px 14px", borderRadius: "12px", border: `2px solid ${d.inputBorder}`, fontSize: "14px", fontFamily: "inherit", background: d.input, color: d.inputText, outline: "none" }}
          onKeyDown={e => { if (e.key === "Enter" && e.target.value) sendMessage(`${e.target.value} bigha`); }}
          id="bigha-input"
        />
        <button
          onClick={() => { const v = document.getElementById("bigha-input").value; if (v) sendMessage(`${v} bigha`); }}
          style={{ background: "linear-gradient(135deg,#1a3a1a,#2d5a27)", color: "white", border: "none", borderRadius: "12px", padding: "12px 18px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
          {L === "hi" ? "Plan लें" : "Plan লওক"}
        </button>
      </div>

      {/* Quick action buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        {[
          { label: L === "hi" ? "📅 इस हफ्ते क्या करें" : "📅 এই সপ্তাহত কি কৰিব", msg: L === "hi" ? "इस हफ्ते क्या करें" : "এই সপ্তাহত কি কৰিব" },
          { label: L === "hi" ? "🛒 अगले हफ्ते खरीदारी" : "🛒 পৰৱৰ্তী সপ্তাহ কিনাকাটা", msg: L === "hi" ? "अगले हफ्ते क्या खरीदें" : "পৰৱৰ্তী সপ্তাহত কি কিনিব" },
          { label: L === "hi" ? "📊 साल का पूरा plan" : "📊 বছৰৰ সম্পূৰ্ণ পৰিকল্পনা", msg: L === "hi" ? "पूरा plan दिखाओ" : "সম্পূৰ্ণ পৰিকল্পনা দেখুৱাওক" },
          { label: L === "hi" ? "🌿 पत्ता कितना निकलेगा" : "🌿 পাত কিমান ওলাব", msg: L === "hi" ? "पत्ता कितना निकलेगा" : "পাত কিমান ওলাব" },
          { label: L === "hi" ? "⚠️ Golden Rules" : "⚠️ সোণালী নিয়ম", msg: "rules" },
          { label: L === "hi" ? "💰 बाकी राशि" : "💰 বাকী পৰিমাণ", msg: L === "hi" ? "balance" : "বাকী" },
        ].map(btn => (
          <button key={btn.label} onClick={() => sendMessage(btn.msg)}
            style={{ background: d.quickBtn, border: `1.5px solid ${d.quickBtnBorder}`, color: d.quickBtnColor, padding: "10px 12px", borderRadius: "12px", fontSize: "11.5px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit", textAlign: "left", lineHeight: "1.3" }}>
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", background: d.bg, fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Weekly Alert + Next Week teaser (shown on home screen) */}
      {!started && (
        <div style={{ overflowY: "auto", flex: 1, paddingBottom: "16px" }}>
          <WeeklyAlert />
          <NextWeekTeaser />
          <BighaCard />
        </div>
      )}

      {/* Chat area */}
      {started && (
        <>
          {/* Quick buttons bar */}
          <div style={{ display: "flex", gap: "6px", padding: "8px 10px", overflowX: "auto", background: d.quickBar, borderBottom: `1px solid ${d.quickBarBorder}`, flexShrink: 0 }}>
            <button onClick={() => { setStarted(false); setMessages([]); }}
              style={{ background: d.backBtn, border: "none", color: d.backBtnColor, padding: "6px 11px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
              ← {L === "hi" ? "वापस" : "ঘূৰিব"}
            </button>
            {quickBtns.map(q => (
              <button key={q.label} onClick={() => sendMessage(q.msg)}
                style={{ background: d.quickBtn, border: `1.5px solid ${d.quickBtnBorder}`, color: d.quickBtnColor, padding: "6px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
                {q.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: "10px" }}>
                {msg.role === "bot" && (
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#1a3a1a,#2d5a27)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0, marginRight: "8px", alignSelf: "flex-end" }}>🍃</div>
                )}
                <div style={{
                  maxWidth: "82%", padding: "11px 14px", borderRadius: "18px", fontSize: "13.5px", lineHeight: "1.7",
                  background: msg.role === "user" ? "linear-gradient(135deg,#1a3a1a,#2d5a27)" : d.botBubble,
                  color: msg.role === "user" ? "white" : d.botBubbleText,
                  borderBottomRightRadius: msg.role === "user" ? "4px" : "18px",
                  borderBottomLeftRadius: msg.role === "bot" ? "4px" : "18px",
                  boxShadow: msg.role === "bot" ? d.botShadow : "none",
                  border: msg.role === "bot" ? d.cardBorder : "none",
                }}>
                  {msg.text.split("\n").map((line, j) => (
                    <span key={j}>{line}{j < msg.text.split("\n").length - 1 && <br />}</span>
                  ))}
                </div>
              </div>
            ))}
            {typing && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#1a3a1a,#2d5a27)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0, marginRight: "8px" }}>🍃</div>
                <div style={{ padding: "12px 16px", borderRadius: "18px", background: d.botBubble, boxShadow: d.botShadow, border: d.cardBorder }}>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: d.subtext, animation: `blink 1.2s ${i*0.2}s infinite` }} />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </>
      )}

      {/* Input bar */}
      <div style={{ padding: "8px 12px 10px", background: d.inputBar, borderTop: `1px solid ${d.inputBarBorder}`, display: "flex", gap: "8px", flexShrink: 0 }}>
        <input type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder={L === "hi" ? "जैसे: 2 बिघा का plan, इस हफ्ते क्या करें..." : "যেনে: ২ বিঘাৰ পৰিকল্পনা, এই সপ্তাহত কি কৰিব..."}
          style={{ flex: 1, padding: "11px 15px", borderRadius: "24px", border: `2px solid ${d.inputBorder}`, fontSize: "14px", outline: "none", fontFamily: "inherit", background: d.input, color: d.inputText }} />
        <button onClick={() => sendMessage()} disabled={!input.trim()}
          style={{ width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(135deg,#1a3a1a,#2d5a27)", color: "white", border: "none", fontSize: "17px", cursor: "pointer", flexShrink: 0, opacity: input.trim() ? 1 : 0.5 }}>➤</button>
      </div>
      <style>{`@keyframes blink{0%,80%,100%{opacity:.2;transform:scale(0.8)}40%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}
