import { useEffect } from "react";

const POINTS = [
  { icon: "✨", text: "Your medicines, lab results, and pregnancy stage inform AI answers" },
  { icon: "🔒", text: "Processed securely — never stored by the AI, never shared" },
  { icon: "🙋", text: "Answers are guidance only, not a substitute for your doctor" },
];

export default function AIConsentSheet({ onAccept, onDecline }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1100,
        background: "rgba(10,4,14,0.78)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        padding: "0 0 0 0",
      }}
      onClick={onDecline}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          borderRadius: "24px 24px 0 0",
          background: "linear-gradient(160deg,#200c18 0%,#2c1428 60%,#1a3838 100%)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderBottom: "none",
          padding: "28px 24px 40px",
          boxShadow: "0 -16px 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Pull handle */}
        <div style={{ display:"flex", justifyContent:"center", marginBottom:22 }}>
          <div style={{ width:32, height:3, borderRadius:2, background:"rgba(255,255,255,0.15)" }}/>
        </div>

        {/* Label */}
        <div style={{
          fontSize: 9, fontWeight: 700, letterSpacing: "0.2em",
          textTransform: "uppercase", color: "rgba(232,184,200,0.5)",
          marginBottom: 10,
        }}>
          Before you ask
        </div>

        {/* Headline */}
        <h2 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 26, fontWeight: 400, lineHeight: 1.25,
          color: "#fff", marginBottom: 8,
        }}>
          Answers personalised<br/>
          <em style={{ fontStyle: "italic", color: "#e8b8a8" }}>to your pregnancy.</em>
        </h2>

        <p style={{
          fontSize: 13, lineHeight: 1.65,
          color: "rgba(255,255,255,0.5)",
          marginBottom: 22,
        }}>
          To give you relevant answers, Matri shares relevant parts of your health profile with AI. Here is what that means.
        </p>

        {/* Points */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14, padding: "4px 0", marginBottom: 24,
        }}>
          {POINTS.map((p, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "flex-start", gap: 12,
              padding: "11px 16px",
              borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
            }}>
              <span style={{ fontSize: 15, flexShrink: 0, lineHeight: 1, marginTop: 1 }}>{p.icon}</span>
              <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>{p.text}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <button
          onClick={onAccept}
          style={{
            width: "100%", padding: "15px",
            background: "var(--rose)", border: "none", borderRadius: 100,
            fontSize: 15, fontWeight: 600, letterSpacing: "0.02em",
            color: "#fff", cursor: "pointer", fontFamily: "inherit",
            marginBottom: 10,
            boxShadow: "0 4px 20px rgba(200,80,100,0.35)",
          }}
        >
          Got it, personalise my answers
        </button>

        <button
          onClick={onDecline}
          style={{
            width: "100%", padding: "13px",
            background: "none", border: "none",
            fontSize: 13, color: "rgba(255,255,255,0.3)",
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Use without personalisation
        </button>
      </div>
    </div>
  );
}
