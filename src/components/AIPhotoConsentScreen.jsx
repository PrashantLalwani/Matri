import { useState, useEffect } from "react";
import matriLogo from "../assets/matri.png";

const DELAYS = [0, 180, 360, 560, 860]; // logo, line1, line2, para, arrow
const ANIM_DURATION = 500;

export default function AIPhotoConsentScreen({ onConsent }) {
  const [step, setStep] = useState(0);           // 0 = intro, 1 = consent
  const [cardVisible, setCardVisible] = useState(false);
  const [animPhase, setAnimPhase] = useState(0); // 0 = hidden, 1 = animating, 2 = done

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => setCardVisible(true));
    const t = setTimeout(() => setAnimPhase(1), 80);
    return () => { document.body.style.overflow = prev; clearTimeout(t); };
  }, []);

  // Auto-complete after all staggered items have settled
  useEffect(() => {
    if (animPhase !== 1) return;
    const t = setTimeout(() => setAnimPhase(2), DELAYS[4] + ANIM_DURATION + 60);
    return () => clearTimeout(t);
  }, [animPhase]);

  const skipAnim = () => { if (animPhase < 2) setAnimPhase(2); };

  const goToConsent = () => {
    setCardVisible(false);
    setTimeout(() => {
      setStep(1);
      requestAnimationFrame(() => setCardVisible(true));
    }, 280);
  };

  // Returns opacity/transform/transition for each staggered intro element
  const el = (i) => {
    if (animPhase === 0) return { opacity: 0, transform: "translateY(16px)" };
    if (animPhase === 1) return {
      opacity: 1, transform: "translateY(0)",
      transition: `opacity ${ANIM_DURATION}ms ease ${DELAYS[i]}ms, transform ${ANIM_DURATION}ms ease ${DELAYS[i]}ms`,
    };
    return { opacity: 1, transform: "translateY(0)", transition: "opacity 0.12s, transform 0.12s" };
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(10,4,14,0.72)",
      backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "48px 20px",
    }}>
      <div
        onClick={step === 0 ? skipAnim : undefined}
        style={{
          width: "100%", maxWidth: 400,
          borderRadius: 28,
          background: "linear-gradient(160deg,#200c18 0%,#2c1428 55%,#1a3838 100%)",
          border: "1px solid rgba(255,255,255,0.09)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
          position: "relative",
          padding: "32px 28px 36px",
          minHeight: 560,
          opacity: cardVisible ? 1 : 0,
          transition: "opacity 0.3s",
        }}
      >
        {/* Decorative glows */}
        <div style={{position:"absolute",top:-40,right:-40,width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle,rgba(232,184,200,0.1),transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:60,left:-60,width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle,rgba(24,96,104,0.15),transparent 70%)",pointerEvents:"none"}}/>

        {step === 0 ? (
          /* ── STEP 1: INTRO ── */
          <div style={{display:"flex", flexDirection:"column"}}>

            <div style={{...el(0), display:"flex", justifyContent:"center", marginBottom:36}}>
              <img src={matriLogo} alt="Matri" style={{width:120, display:"block"}}/>
            </div>

            <div style={{...el(1), fontFamily:"'Cormorant Garamond',serif", fontSize:34, fontWeight:400, lineHeight:1.15, color:"#fff"}}>
              Smarter answers.
            </div>
            <div style={{...el(2), fontFamily:"'Cormorant Garamond',serif", fontSize:34, fontWeight:400, fontStyle:"italic", lineHeight:1.15, color:"#e8b8a8", marginBottom:24}}>
              Built around you.
            </div>

            <p style={{...el(3), fontSize:14, lineHeight:1.8, color:"rgba(255,255,255,0.45)", margin:0}}>
              Matri is built to make your pregnancy feel personal. Every insight, every answer — shaped by your week, your medicines, your prescriptions. Not a one-size-fits-all guide. Your companion.
            </p>

            <div style={{display:"flex", justifyContent:"center", paddingTop:48}}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (animPhase < 2) setAnimPhase(2);
                  else goToConsent();
                }}
                style={{
                  ...el(4),
                  width: 52, height: 52, borderRadius: "50%",
                  background: "rgba(232,184,200,0.1)",
                  border: "1.5px solid rgba(232,184,200,0.35)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", fontFamily: "inherit",
                  WebkitTapHighlightColor: "transparent",
                  color: "rgba(232,184,200,0.85)", fontSize: 20,
                  flexShrink: 0,
                }}
              >
                →
              </button>
            </div>
          </div>

        ) : (
          /* ── STEP 2: CONSENT ── */
          <div style={{display:"flex", flexDirection:"column", flex:1}}>
            <div style={{display:"flex", justifyContent:"center", marginBottom:36}}>
              <img src={matriLogo} alt="Matri" style={{width:120, display:"block"}}/>
            </div>
            <div style={{display:"flex",flexDirection:"column",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,overflow:"hidden",marginBottom:14}}>
              <p style={{fontSize:10,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:"rgba(232,184,200,0.55)",padding:"12px 14px 6px",margin:0}}>
                Your data. Our commitment.
              </p>
              {[
                ["🔒", "Encrypted in transit and at rest"],
                ["👤", "Only you can access your health records"],
                ["🚫", "Never sold or used for advertising"],
                ["🤖", "AI requests are processed by a certified provider that does not train on your data"],
              ].map(([icon, text], i) => (
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 14px",borderTop:i>0?"1px solid rgba(255,255,255,0.05)":"none"}}>
                  <span style={{fontSize:13,flexShrink:0,opacity:0.7}}>{icon}</span>
                  <span style={{fontSize:11.5,color:"rgba(255,255,255,0.35)",lineHeight:1.45}}>{text}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => onConsent(true)}
              style={{
                width:"100%", padding:"15px",
                background:"var(--rose)", border:"none", borderRadius:100,
                fontSize:15, fontWeight:600, letterSpacing:"0.02em",
                color:"#fff", cursor:"pointer", fontFamily:"inherit",
                marginTop:"auto",
                boxShadow:"0 4px 20px rgba(200,80,100,0.3)",
              }}
            >
              Continue →
            </button>

            <div style={{textAlign:"center", marginTop:14}}>
              <button
                onClick={() => onConsent(false)}
                style={{
                  background:"none", border:"none", cursor:"pointer",
                  fontSize:11, color:"rgba(255,255,255,0.2)",
                  fontFamily:"inherit", padding:0,
                  WebkitTapHighlightColor:"transparent",
                }}
              >
                Skip personalisation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
