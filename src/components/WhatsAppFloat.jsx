import React, { useState, useRef, useEffect } from "react";
import { useLang } from "../LanguageContext";

const WHATSAPP_NUMBER = "919365374458";

const waMsg = {
  en: "Hello Ishwar! I am contacting you from the Chai Bagan app.",
  hi: "नमस्ते ईश्वर! मैं Chai Bagan ऐप से संपर्क कर रहा हूं।",
  as: "নমস্কাৰ ঈশ্বৰ! মই Chai Bagan এপৰ পৰা সম্পৰ্ক কৰিছো।",
  ne: "नमस्ते ईश्वर! म Chai Bagan एपबाट सम्पर्क गर्दैछु।",
};

const toastMsg = {
  en: "Contact me!",
  hi: "संपर्क करें!",
  as: "মোক সম্পৰ্ক কৰক!",
  ne: "सम्पर्क गर्नुस्!",
};

export default function WhatsAppFloat({ isAdmin }) {
  const { lang } = useLang();
  const [pos, setPos] = useState({ x: null, y: null });
  const [dragging, setDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [showToast, setShowToast] = useState(true);
  const btnRef = useRef(null);
  const dragStart = useRef(null);
  const posRef = useRef(pos);

  useEffect(() => {
    const x = window.innerWidth - 70;
    const y = window.innerHeight - 160;
    setPos({ x, y });
    posRef.current = { x, y };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setShowToast(false), 4000);
    return () => clearTimeout(t);
  }, []);

  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

  const onTouchStart = (e) => {
    const touch = e.touches[0];
    dragStart.current = { startX: touch.clientX, startY: touch.clientY, posX: posRef.current.x, posY: posRef.current.y };
    setHasMoved(false); setDragging(true);
  };

  const onTouchMove = (e) => {
    if (!dragStart.current) return;
    e.preventDefault();
    const touch = e.touches[0];
    const dx = touch.clientX - dragStart.current.startX;
    const dy = touch.clientY - dragStart.current.startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) setHasMoved(true);
    const newX = clamp(dragStart.current.posX + dx, 10, window.innerWidth - 60);
    const newY = clamp(dragStart.current.posY + dy, 10, window.innerHeight - 60);
    posRef.current = { x: newX, y: newY };
    setPos({ x: newX, y: newY });
  };

  const onTouchEnd = () => {
    setDragging(false); dragStart.current = null;
    const newX = posRef.current.x < window.innerWidth / 2 ? 10 : window.innerWidth - 60;
    posRef.current = { ...posRef.current, x: newX };
    setPos(p => ({ ...p, x: newX }));
  };

  const onMouseDown = (e) => {
    dragStart.current = { startX: e.clientX, startY: e.clientY, posX: posRef.current.x, posY: posRef.current.y };
    setHasMoved(false); setDragging(true);
    const onMouseMove = (ev) => {
      const dx = ev.clientX - dragStart.current.startX;
      const dy = ev.clientY - dragStart.current.startY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) setHasMoved(true);
      const newX = clamp(dragStart.current.posX + dx, 10, window.innerWidth - 60);
      const newY = clamp(dragStart.current.posY + dy, 10, window.innerHeight - 60);
      posRef.current = { x: newX, y: newY };
      setPos({ x: newX, y: newY });
    };
    const onMouseUp = () => {
      setDragging(false); dragStart.current = null;
      const newX = posRef.current.x < window.innerWidth / 2 ? 10 : window.innerWidth - 60;
      posRef.current = { ...posRef.current, x: newX };
      setPos(p => ({ ...p, x: newX }));
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleClick = () => {
    if (hasMoved) return;
    const msg = waMsg[lang] || waMsg.as;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // All hooks above — safe to return null here
  if (pos.x === null || isAdmin) return null;

  const toastOnLeft = pos.x > window.innerWidth / 2;

  return (
    <>
      {showToast && (
        <div style={{
          position: "fixed",
          left: toastOnLeft ? "auto" : pos.x + 60,
          right: toastOnLeft ? window.innerWidth - pos.x + 10 : "auto",
          top: pos.y + 4,
          background: "#1a1a1a", color: "white",
          padding: "8px 14px", borderRadius: "20px",
          fontSize: "12px", fontWeight: "600", whiteSpace: "nowrap",
          zIndex: 9998, boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          animation: "toastIn 0.3s ease, toastOut 0.5s ease 3.5s forwards",
          fontFamily: "'Segoe UI', sans-serif",
          display: "flex", alignItems: "center", gap: "6px",
        }}>
          <span style={{ fontSize: "14px" }}>💬</span>
          {toastMsg[lang] || toastMsg.as}
          <div style={{
            position: "absolute",
            right: toastOnLeft ? "auto" : "-6px",
            left: toastOnLeft ? "-6px" : "auto",
            top: "50%", transform: "translateY(-50%)",
            width: 0, height: 0,
            borderTop: "6px solid transparent",
            borderBottom: "6px solid transparent",
            borderLeft: toastOnLeft ? "6px solid #1a1a1a" : "none",
            borderRight: toastOnLeft ? "none" : "6px solid #1a1a1a",
          }} />
        </div>
      )}
      <div
        ref={btnRef}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown} onClick={handleClick}
        style={{
          position: "fixed", left: pos.x, top: pos.y,
          width: 52, height: 52, borderRadius: "50%",
          background: "linear-gradient(135deg,#25D366,#128C7E)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: dragging ? "grabbing" : "pointer",
          zIndex: 9999,
          boxShadow: dragging ? "0 8px 32px rgba(37,211,102,0.5)" : "0 4px 20px rgba(37,211,102,0.4)",
          transition: dragging ? "none" : "box-shadow 0.2s, left 0.2s ease",
          userSelect: "none", touchAction: "none",
        }}
      >
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <path d="M16 3C9.373 3 4 8.373 4 15c0 2.385.668 4.61 1.83 6.5L4 29l7.7-1.81A11.94 11.94 0 0016 28c6.627 0 12-5.373 12-12S22.627 3 16 3z" fill="white" />
          <path d="M22.5 19.5c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.76-1.66-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.68-1.63-.93-2.23-.24-.58-.49-.5-.68-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.27.49 1.7.63.72.23 1.37.2 1.89.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35z" fill="#25D366" />
        </svg>
        {!dragging && (
          <div style={{ position: "absolute", width: "100%", height: "100%", borderRadius: "50%", border: "2px solid #25D366", animation: "waPulse 2s ease-out infinite", opacity: 0.6 }} />
        )}
        <style>{`
          @keyframes waPulse { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.8);opacity:0} }
          @keyframes toastIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
          @keyframes toastOut { from{opacity:1} to{opacity:0} }
        `}</style>
      </div>
    </>
  );
}
