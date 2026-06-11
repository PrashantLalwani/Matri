import { useState, useEffect } from "react";

const PROMISES = [
  { icon: "🔒", text: "Your data is encrypted and secure" },
  { icon: "👤", text: "Only you can see your health records" },
  { icon: "🗑️", text: "Delete everything, anytime, in one tap" },
];

export default function ConsentScreen({ onConsent, onDismiss }) {
  const [agreed, setAgreed] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(10,4,14,0.72)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "48px 20px",
      }}
      onTouchMove={e => e.stopPropagation()}
      onClick={onDismiss}
    >
      {/* Card — explicit height so flex children can fill it */}
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%",
        maxWidth: 400,
        height: "calc(100vh - 96px)",
        maxHeight: 680,
        borderRadius: 28,
        background: "linear-gradient(160deg,#200c18 0%,#2c1428 55%,#1a3838 100%)",
        border: "1px solid rgba(255,255,255,0.09)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
        position: "relative",
      }}>

        {/* Decorative glows */}
        <div style={{position:"absolute",top:-40,right:-40,width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle,rgba(232,184,200,0.1),transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:120,left:-60,width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle,rgba(24,96,104,0.15),transparent 70%)",pointerEvents:"none"}}/>

        {/* Logo + close */}
        <div style={{padding:"28px 28px 0", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0}}>
          <div style={{display:"flex", alignItems:"center", gap:7}}>
            <div style={{width:6, height:6, borderRadius:"50%", background:"rgba(232,184,200,0.8)"}}/>
            <span style={{fontSize:11, fontWeight:700, letterSpacing:"0.26em", textTransform:"uppercase", color:"rgba(232,184,200,0.6)"}}>Matri</span>
          </div>
          <button
            onClick={onDismiss}
            style={{
              width:30, height:30, borderRadius:"50%",
              background:"rgba(255,255,255,0.08)",
              border:"none", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
              color:"rgba(255,255,255,0.45)", fontSize:16, lineHeight:1,
              fontFamily:"inherit",
            }}
          >×</button>
        </div>

        {/* Scroll area — direct flex item, fade via mask */}
        <div style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: "24px 28px 16px",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
          maskImage: "linear-gradient(to bottom, black calc(100% - 52px), transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black calc(100% - 52px), transparent 100%)",
        }}>

          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 30, fontWeight: 400, lineHeight: 1.2,
            color: "#fff", marginBottom: 14,
          }}>
            Your pregnancy.<br/>
            Your data.<br/>
            <em style={{fontStyle:"italic", color:"#e8b8a8"}}>Your control.</em>
          </h1>

          <p style={{fontSize:13, lineHeight:1.7, color:"rgba(255,255,255,0.55)", marginBottom:22}}>
            Matri stores your health records, prescriptions, and lab reports to give you personalised guidance through every week of your pregnancy. When you upload a prescription, AI reads it to extract your medicines automatically.
          </p>

          <div style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14, padding: "4px 0", marginBottom: 20,
          }}>
            <p style={{fontSize:10, fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase", color:"rgba(232,184,200,0.55)", padding:"12px 18px 6px"}}>
              Here's our promise to you
            </p>
            {PROMISES.map((p, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 18px",
                borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
              }}>
                <span style={{fontSize: 16, flexShrink: 0, lineHeight: 1}}>{p.icon}</span>
                <span style={{fontSize: 12.5, color: "rgba(255,255,255,0.75)", lineHeight: 1.45}}>{p.text}</span>
              </div>
            ))}
          </div>

          <div style={{display:"flex", flexDirection:"column", gap:10, marginBottom:32}}>
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              style={{fontSize:12.5, color:"#e8b8a8", fontWeight:600, textDecoration:"none", display:"inline-flex", alignItems:"center", gap:4}}
            >
              Read our full Privacy Policy →
            </a>
            <a
              href="/tos"
              target="_blank"
              rel="noopener noreferrer"
              style={{fontSize:12.5, color:"#e8b8a8", fontWeight:600, textDecoration:"none", display:"inline-flex", alignItems:"center", gap:4}}
            >
              Read our Terms of Service →
            </a>
          </div>

        </div>

        {/* Checkbox + button — always visible */}
        <div style={{padding:"16px 28px 28px", flexShrink:0}}>

          <label style={{
            display: "flex", alignItems: "flex-start", gap: 12,
            cursor: "pointer", marginBottom: 16,
            WebkitTapHighlightColor: "transparent",
          }}>
            <div
              onClick={() => setAgreed(a => !a)}
              style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                border: agreed ? "none" : "1.5px solid rgba(255,255,255,0.3)",
                background: agreed ? "var(--rose)" : "rgba(255,255,255,0.07)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}
            >
              {agreed && <span style={{color:"#fff", fontSize:11, fontWeight:700, lineHeight:1}}>✓</span>}
            </div>
            <span style={{fontSize:12.5, color:"rgba(255,255,255,0.55)", lineHeight:1.6}}>
              I have read and agree to Matri's{" "}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{color:"#e8b8a8", fontWeight:600, textDecoration:"none"}}
              >
                Privacy Policy
              </a>
              {" "}and{" "}
              <a
                href="/tos"
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{color:"#e8b8a8", fontWeight:600, textDecoration:"none"}}
              >
                Terms of Service
              </a>
              , and consent to the collection and use of my data as described.
            </span>
          </label>

          <label style={{
            display: "flex", alignItems: "flex-start", gap: 12,
            cursor: "pointer", marginBottom: 16,
            WebkitTapHighlightColor: "transparent",
          }}>
            <div
              onClick={() => setAgeConfirmed(a => !a)}
              style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                border: ageConfirmed ? "none" : "1.5px solid rgba(255,255,255,0.3)",
                background: ageConfirmed ? "var(--rose)" : "rgba(255,255,255,0.07)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}
            >
              {ageConfirmed && <span style={{color:"#fff", fontSize:11, fontWeight:700, lineHeight:1}}>✓</span>}
            </div>
            <span style={{fontSize:12.5, color:"rgba(255,255,255,0.55)", lineHeight:1.6}}>
              I confirm that I am 18 years of age or older.
            </span>
          </label>

          <button
            disabled={!agreed || !ageConfirmed}
            onClick={onConsent}
            style={{
              width: "100%", padding: "15px",
              background: agreed && ageConfirmed ? "var(--rose)" : "rgba(255,255,255,0.08)",
              border: "none", borderRadius: 100,
              fontSize: 15, fontWeight: 600, letterSpacing: "0.02em",
              color: agreed && ageConfirmed ? "#fff" : "rgba(255,255,255,0.25)",
              cursor: agreed && ageConfirmed ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              transition: "all 0.2s",
            }}
          >
            Continue →
          </button>

        </div>
      </div>
    </div>
  );
}
