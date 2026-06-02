import React, { useState } from 'react';
import { analytics } from '../../analytics';
import { authFetch } from '../../utils/auth';
import { photoThumb, photoSquare, photoAlbum } from '../../utils/albumUtils';
import { loadMoments, saveMoment } from '../../utils/storage';
import { istDate } from '../../utils/date';
import { getMatriMoment } from '../../constants/matriMoments';
import { BABY_SIZES, MOODS } from '../panels/EducationPanels';
import { MILESTONES } from '../../constants/milestones';
import { JournalPanel } from '../journal/JournalPanel';

/* ─── SHAREABLE WEEK STRIP ──────────────────────────────────────────────── */
export function ShareableStrip({ entries }) {
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const byWeek = entries.reduce((a,e)=>{ if(!a[e.week])a[e.week]=[]; a[e.week].push(e); return a; },{});
  const weeks  = Object.entries(byWeek).sort(([a],[b])=>Number(a)-Number(b));

  // Load any photo src → base64 data URL
  const loadImg = (src) => new Promise(resolve => {
    if (!src || typeof src !== "string") return resolve(null);
    if (src.startsWith("data:")) return resolve(src);
    if (src.startsWith("blob:")) {
      fetch(src).then(r=>r.blob()).then(blob=>{
        const rd = new FileReader();
        rd.onload = ()=>resolve(rd.result);
        rd.onerror = ()=>resolve(null);
        rd.readAsDataURL(blob);
      }).catch(()=>resolve(null));
    } else resolve(null);
  });

  // Draw an image with rounded corners onto a canvas, return data URL
  const roundedImageDataUrl = (imgEl, w, h, r) => {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(r, 0); ctx.lineTo(w-r, 0);
    ctx.quadraticCurveTo(w, 0, w, r);
    ctx.lineTo(w, h-r); ctx.quadraticCurveTo(w, h, w-r, h);
    ctx.lineTo(r, h); ctx.quadraticCurveTo(0, h, 0, h-r);
    ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath(); ctx.clip();
    ctx.drawImage(imgEl, 0, 0, w, h);
    return c.toDataURL("image/jpeg", 0.85);
  };

  // Load and round an image from a data/blob URL
  const loadRoundedImg = (src, w, h, r=20) => new Promise(async resolve => {
    const data = await loadImg(src);
    if (!data) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(roundedImageDataUrl(img, w, h, r));
    img.onerror = () => resolve(null);
    img.src = data;
  });

  const generatePDF = async () => {
    setGenerating(true);
    try {
      if (!window.jspdf) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
          s.onload = resolve; s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      const { jsPDF } = window.jspdf;

      // A4 portrait, mm units
      const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
      const W = 210, H = 297, M = 12, CW = W - M*2;

      // ─── COLOUR PALETTE ───────────────────────────────────────────────
      const BG       = [10,  32,  32];   // dark teal
      const BG2      = [18,  50,  50];
      const CARD_BG  = [20,  44,  44];
      const ACCENT   = [112,200,184];    // teal highlight
      const ROSE     = [191, 82,  64];
      const ROSE_L   = [253,240,236];    // rose pale
      const TEAL_L   = [232,245,245];
      const PLUM_L   = [248,238,251];
      const NAVY_L   = [234,240,248];
      const AMBER_L  = [253,243,228];
      const WHITE    = [255,255,255];
      const MUTED    = [180,160,155];
      const INK      = [26,  18,  16];
      const DIVIDER  = [40,  70,  70];

      const CARD_COLORS = [ROSE_L, TEAL_L, PLUM_L, NAVY_L, AMBER_L];
      const CARD_ACCENTS= [
        [191,82,64],[26,96,96],[98,32,112],[42,74,112],[138,80,16]
      ];

      // ─── HELPERS ──────────────────────────────────────────────────────
      const fill  = (col) => doc.setFillColor(...col);
      const draw  = (col) => doc.setDrawColor(...col);
      const txt   = (col) => doc.setTextColor(...col);
      const font  = (sz, st="normal") => { doc.setFont("helvetica", st); doc.setFontSize(sz); };
      const lw    = (w)   => doc.setLineWidth(w);

      // Rounded rect helper
      const rr = (x,y,w,h,r,style="F") => doc.roundedRect(x,y,w,h,r,r,style);

      // Wrap text and return y after drawing
      const drawWrapped = (text, x, y, maxW, lineH) => {
        const lines = doc.splitTextToSize(text, maxW);
        doc.text(lines, x, y);
        return y + lines.length * lineH;
      };

      // Page background fill
      const fillPage = () => {
        fill(BG); doc.rect(0,0,W,H,"F");
        // subtle gradient-like overlay at bottom
        fill(BG2); doc.rect(0, H*0.6, W, H*0.4, "F");
      };

      let page = 1;
      const newPage = () => {
        doc.addPage(); page++;
        fillPage();
        return M + 6;
      };
      const checkY = (y, need) => y + need > H - M ? newPage() : y;

      // ─── COVER PAGE ───────────────────────────────────────────────────
      fillPage();

      // Matri wordmark area
      fill(ACCENT); rr(M, 22, 26, 8, 2);
      font(7,"bold"); txt(BG);
      doc.text("M", M+9, 27.5);
      font(8,"bold"); txt(ACCENT);
      doc.text("MATRI", M+14, 27.5);
      font(7,"normal"); txt([...ACCENT,160]);
      doc.text("Pregnancy Journal", M+36, 27.5);

      // Big title
      font(38,"bold"); txt(WHITE);
      doc.text("The", M, 72);
      font(38,"bold"); txt(ACCENT);
      doc.text("Wait.", M+28, 72);

      font(16,"italic"); txt(MUTED);
      doc.text("A pregnancy story.", M, 84);

      // Horizontal divider
      lw(0.3); draw(DIVIDER);
      doc.line(M, 92, W-M, 92);

      // Stats cards
      const stats = [
        { val: String(entries.length), sub: entries.length===1?"memory":"memories", col: ACCENT },
        { val: String(weeks.length),   sub: weeks.length===1?"week":"weeks",         col: ROSE },
        { val: weeks[0]?.[0] ? `Wk ${weeks[0][0]}–${weeks[weeks.length-1][0]}` : "—",
          sub: "documented", col: ACCENT },
      ];
      stats.forEach((s, i) => {
        const sx = M + i * 60;
        fill(CARD_BG); rr(sx, 98, 54, 22, 3);
        font(15,"bold"); txt(s.col);
        doc.text(s.val, sx+5, 110);
        font(7,"normal"); txt(MUTED);
        doc.text(s.sub, sx+5, 116);
      });

      // Date range
      if (entries.length) {
        font(9,"italic"); txt(MUTED);
        const last = entries[entries.length-1];
        doc.text(`${last.date} — ${entries[0].date}`, M, 134);
      }

      // Quote
      font(11,"italic"); txt(WHITE);
      doc.text('"The most ordinary extraordinary', M, 152);
      doc.text(' thing — growing a human being."', M, 162);

      // Decorative rose dot
      fill(ROSE); doc.circle(W-M-8, 48, 28, "F");
      fill(BG); doc.circle(W-M-8, 48, 22, "F");
      fill(ROSE); doc.circle(W-M-8, 48, 14, "F");

      // Footer
      lw(0.2); draw(DIVIDER); doc.line(M, H-18, W-M, H-18);
      font(7,"normal"); txt(ACCENT);
      doc.text("Made with Matri  ·  matri.care", M, H-10);
      font(7,"normal"); txt(MUTED);
      doc.text(`${entries.length} ${entries.length===1?"memory":"memories"}`, W-M, H-10, {align:"right"});

      // ─── TIMELINE PAGES ───────────────────────────────────────────────
      let y = newPage();

      // Page header
      const pageHeader = (y) => {
        font(7,"bold"); txt(ACCENT);
        doc.text("MATRI · PREGNANCY TIMELINE", M, y);
        font(7,"normal"); txt(MUTED);
        doc.text(`Page ${page}`, W-M, y, {align:"right"});
        lw(0.2); draw(DIVIDER);
        doc.line(M, y+3, W-M, y+3);
        return y + 10;
      };
      y = pageHeader(y);

      for (let wi = 0; wi < weeks.length; wi++) {
        const [wk, wentries] = weeks[wi];
        const baby = BABY_SIZES[Number(wk)] || null;
        const allMoods = [...new Set(wentries.map(e=>e.mood))].join(" ");
        const weekNum = Number(wk);
        const tri = weekNum<=12?"T1 · First Trimester":weekNum<=27?"T2 · Second Trimester":"T3 · Third Trimester";

        // ── Week banner ──
        y = checkY(y, 24);
        fill(CARD_BG); rr(M, y, CW, 20, 3);
        // left rose bar
        fill(ROSE); rr(M, y, 3, 20, 1.5);

        font(18,"bold"); txt(ACCENT);
        doc.text(String(wk), M+7, y+13);

        font(8,"bold"); txt(WHITE);
        doc.text(`Week of Pregnancy`, M+22, y+7);
        font(7,"normal"); txt(MUTED);
        doc.text(tri, M+22, y+13);
        if (baby) { doc.text(`${baby.compare} · ${baby.cm}`, M+22, y+18.5); }

        font(9,"normal"); txt(WHITE);
        doc.text(allMoods, W-M-3, y+11, {align:"right"});

        y += 24;

        // ── Entries ──
        for (let ei = 0; ei < wentries.length; ei++) {
          const entry = wentries[ei];
          const ci = (wi*3 + ei) % CARD_COLORS.length;
          const cardCol   = CARD_COLORS[ci];
          const accentCol = CARD_ACCENTS[ci];

          // Load photos (up to 2) with rounded corners
          const photoCandidates = (entry.photos||[])
            .map(p => photoSquare(p)||photoAlbum(p)||(typeof p==="string"&&(p.startsWith("data:")||p.startsWith("blob:"))?p:null))
            .filter(Boolean).slice(0,2);
          const photoDataUrls = await Promise.all(
            photoCandidates.map(src => loadRoundedImg(src, 400, 400, 48))
          );
          const validPhotos = photoDataUrls.filter(Boolean);

          // Estimate card height
          const textLines = doc.splitTextToSize(`"${entry.text}"`, CW-10).length;
          const photoH    = validPhotos.length ? 50 + 4 : 0;
          const cardH     = 10 + textLines*5 + photoH + 16;

          y = checkY(y, cardH + 4);
          if (y <= M+10) { y = pageHeader(y); }

          // Card background
          fill(cardCol); rr(M, y, CW, cardH, 4);
          // Left accent bar
          fill(accentCol); rr(M, y, 2.5, cardH, 1.5);

          // Date + mood on same line
          font(8,"bold"); txt(INK);
          const dp = (entry.date||"").split(" ");
          doc.text(dp[0]||"", M+6, y+7);
          font(8,"normal"); txt([...accentCol]);
          doc.text((dp.slice(1).join(" "))||"", M+13, y+7);

          if (entry.isShared) {
            font(6,"bold"); txt([26,96,96]);
            doc.text("PUBLIC", W-M-22, y+7);
          }
          font(10,"normal"); txt(INK);
          doc.text(entry.mood||"", W-M-6, y+7, {align:"right"});

          // Thin divider under date
          lw(0.15); draw([...accentCol, 60]);
          doc.line(M+6, y+9, W-M-6, y+9);

          // Entry text
          font(9,"italic"); txt(INK);
          const textY = y + 15;
          const afterTextY = drawWrapped(`"${entry.text}"`, M+6, textY, CW-10, 5);

          // Photos
          if (validPhotos.length) {
            let px = M+6;
            const photoW = validPhotos.length === 1 ? 60 : 52;
            const photoHpx = 44;
            validPhotos.forEach(imgData => {
              try {
                doc.addImage(imgData, "JPEG", px, afterTextY+2, photoW, photoHpx);
              } catch {}
              px += photoW + 4;
            });
          }

          y += cardH + 4;
        }

        // Spacing between weeks
        y += 4;

        // Week separator
        if (wi < weeks.length-1) {
          lw(0.15); draw(DIVIDER);
          doc.line(M+10, y, W-M-10, y);
          y += 6;
        }
      }

      // ─── CLOSING PAGE ─────────────────────────────────────────────────
      doc.addPage(); fillPage();

      fill(ROSE); doc.circle(W/2, 80, 30, "F");
      fill(BG); doc.circle(W/2, 80, 24, "F");
      fill(ROSE); doc.circle(W/2, 80, 14, "F");
      fill(BG); doc.circle(W/2, 80, 6, "F");

      font(26,"bold"); txt(ACCENT);
      doc.text("Your story so far.", M, 130, {align:"left"});

      font(10,"italic"); txt(WHITE);
      doc.text(
        `${entries.length} ${entries.length===1?"memory":"memories"} across ${weeks.length} ${weeks.length===1?"week":"weeks"}.`,
        M, 144
      );
      doc.text("Each one preserved, exactly as you felt it.", M, 153);

      lw(0.2); draw(DIVIDER); doc.line(M, 165, W-M, 165);

      font(9,"normal"); txt(ACCENT);
      doc.text("Every week you add becomes a new page.", M, 175);
      doc.text("This book is never finished — it just keeps growing.", M, 183);

      font(7,"normal"); txt(MUTED);
      doc.text("Made with Matri  ·  matri.care", M, H-10);

      // ─── SAVE ─────────────────────────────────────────────────────────
      doc.save("matri-pregnancy-journey.pdf");
      setDone(true);
      setTimeout(()=>setDone(false), 5000);
    } catch(e) {
      console.error("PDF error:", e);
      alert("Could not generate PDF: " + e.message);
    }
    setGenerating(false);
  };

  if (!weeks.length) return (
    <div style={{padding:"16px",fontSize:12,color:"var(--muted)",fontStyle:"italic",textAlign:"center"}}>
      Write your first journal entry to create a shareable PDF.
    </div>
  );

  return (
    <div className="share-strip-wrap">
      <div className="share-card">
        <div className="share-card-header">
          <div className="share-card-title">Priya's Pregnancy Journey 🌸</div>
          <div className="share-card-sub">
            Week {weeks[0][0]}–{weeks[weeks.length-1][0]} · {entries.length} {entries.length===1?"memory":"memories"} · {weeks.length} {weeks.length===1?"week":"weeks"}
          </div>
        </div>

        {/* Preview strip */}
        <div className="share-week-row">
          {weeks.map(([wk,wentries],i)=>{
            const baby = BABY_SIZES[Number(wk)]||BABY_SIZES[wk];
            const moods = [...new Set(wentries.map(e=>e.mood))];
            const hasMultiple = wentries.length > 1;
            return (
              <div key={wk} style={{display:"flex",alignItems:"stretch"}}>
                <div className="share-week-item">
                  <div className="share-week-num">WK {wk}</div>
                  {baby && <div className="share-week-size">{baby.compare}</div>}
                  <div className="share-week-moods">{moods.map((m,j)=><span key={j}>{m}</span>)}</div>
                  {hasMultiple
                    ? <div className="share-week-snippet" style={{color:"rgba(112,200,184,0.8)"}}>{wentries.length} entries</div>
                    : <div className="share-week-snippet">"{wentries[0]?.text?.slice(0,45)}…"</div>}
                </div>
                {i<weeks.length-1&&<div className="share-week-divider"/>}
              </div>
            );
          })}
        </div>

        <div className="share-btn-row">
          <div style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:100,padding:"11px 16px",display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:16}}>📄</span>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.6)"}}>Download PDF to share</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:1}}>Beautiful timeline PDF · coming soon</div>
            </div>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.08em",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:100,padding:"3px 10px",color:"rgba(255,255,255,0.4)"}}>Soon</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FriendsCard() {
  const [open, setOpen] = useState(false);
  const [vis,  setVis]  = useState(false);

  const openOverlay  = () => { setOpen(true);  requestAnimationFrame(()=>setVis(true)); };
  const closeOverlay = () => { setVis(false); setTimeout(()=>setOpen(false), 360); };

  // Ghost avatar placeholders
  const ghosts = ["A","B","C"];

  return (
    <>
      {/* ── WIDGET CARD ── */}
      <div onClick={openOverlay} style={{
        background:"linear-gradient(145deg,#181830,#242448)",
        border:"1px solid rgba(180,170,240,0.12)",
        borderRadius:16, padding:"16px 18px", cursor:"pointer",
        marginBottom:10, position:"relative", overflow:"hidden"
      }}>
        {/* bg emoji */}
        <span style={{position:"absolute",fontSize:100,right:-10,bottom:-14,opacity:0.06,pointerEvents:"none",userSelect:"none"}}>👯</span>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color:"rgba(180,170,240,0.6)",marginBottom:4}}>Friend's journals</div>
            <div style={{fontFamily:"'Lora',serif",fontSize:18,color:"#fff",lineHeight:1.2}}>
              See what your people <em style={{fontStyle:"italic",color:"#b0a0f0"}}>are feeling.</em>
            </div>
          </div>
          <div style={{background:"rgba(176,160,240,0.15)",border:"1px solid rgba(176,160,240,0.2)",borderRadius:100,padding:"3px 10px",fontSize:10,fontWeight:700,color:"#b0a0f0",whiteSpace:"nowrap",flexShrink:0}}>
            0 friends
          </div>
        </div>

        {/* Ghost avatars row */}
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}>
          {ghosts.map((g,i)=>(
            <div key={i} style={{
              width:36,height:36,borderRadius:"50%",
              background:"rgba(255,255,255,0.05)",
              border:"1.5px dashed rgba(255,255,255,0.12)",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:14,color:"rgba(255,255,255,0.15)",fontWeight:600,
              flexShrink:0
            }}>?</div>
          ))}
          <div style={{
            width:36,height:36,borderRadius:"50%",
            background:"rgba(176,160,240,0.12)",
            border:"1.5px solid rgba(176,160,240,0.25)",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:18,color:"#b0a0f0",flexShrink:0
          }}>+</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.28)",marginLeft:6,lineHeight:1.4}}>
            Add friends to see their<br/>public entries here
          </div>
        </div>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.28)",fontStyle:"italic"}}>
            Public entries only · you control what you share
          </div>
          <div style={{fontSize:11,color:"#b0a0f0",fontWeight:600}}>Open ↗</div>
        </div>
      </div>

      {/* ── OVERLAY ── */}
      {open && (
        <div style={{
          position:"fixed",inset:0,zIndex:300,
          background:`rgba(16,10,8,${vis?0.78:0})`,
          transition:"background 0.3s",
          display:"flex",flexDirection:"column",justifyContent:"flex-end",
          pointerEvents: vis ? "all" : "none"
        }} onClick={closeOverlay}>
          <div onClick={e=>e.stopPropagation()} style={{
            background:"var(--cream)",
            borderRadius:"28px 28px 0 0",
            transform:`translateY(${vis?0:102}%)`,
            transition:"transform 0.36s cubic-bezier(0.3,0.72,0,1)",
            maxHeight:"80vh",
            display:"flex",flexDirection:"column",
            overflow:"hidden"
          }}>
            {/* overlay header */}
            <div style={{padding:"20px 20px 16px",display:"flex",alignItems:"flex-start",justifyContent:"space-between",borderBottom:"1px solid var(--bdr)",flexShrink:0}}>
              <div>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color:"var(--plum)",marginBottom:5}}>Friend's journals</div>
                <div style={{fontFamily:"'Lora',serif",fontSize:22,color:"var(--ink)",lineHeight:1.2}}>
                  Your people's <em style={{fontStyle:"italic",color:"var(--plum)"}}>stories.</em>
                </div>
              </div>
              <button onClick={closeOverlay} style={{width:34,height:34,borderRadius:"50%",background:"var(--cream2)",border:"none",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--muted)",fontFamily:"inherit"}}>✕</button>
            </div>

            {/* overlay body */}
            <div style={{overflowY:"auto",padding:"24px 20px 48px",scrollbarWidth:"none",flex:1}}>
              {/* empty state illustration */}
              <div style={{textAlign:"center",padding:"20px 0 28px"}}>
                <div style={{fontSize:64,marginBottom:16,opacity:0.7}}>👯</div>
                <div style={{fontFamily:"'Lora',serif",fontSize:20,color:"var(--ink)",marginBottom:8,lineHeight:1.3}}>
                  No friends added yet.
                </div>
                <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.7,marginBottom:24,maxWidth:280,margin:"0 auto 24px"}}>
                  When you connect with someone on Matri, their public journal entries will appear here — weeks, moods, moments they chose to share.
                </div>
                <div style={{background:"var(--plum-pale)",border:"1px solid var(--plum-bdr)",borderRadius:14,padding:"14px 16px",marginBottom:16,textAlign:"left"}}>
                  <div style={{fontSize:12,fontWeight:600,color:"var(--plum)",marginBottom:4}}>How it works</div>
                  <div style={{fontSize:12,color:"var(--muted)",lineHeight:1.65}}>
                    Each journal entry you write can be set to <strong>Private</strong> (only you) or <strong>Public</strong> (visible to friends you approve). You stay in control — always.
                  </div>
                </div>
                <button style={{
                  width:"100%",background:"var(--plum)",color:"#fff",
                  border:"none",borderRadius:100,padding:"13px",
                  fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",
                  marginBottom:10
                }}>
                  Add a friend · coming soon
                </button>
                <div style={{fontSize:11,color:"var(--muted)",fontStyle:"italic"}}>
                  Requires a Matri account · phone sign-in coming soon
                </div>
              </div>

              {/* what it'll look like — teaser */}
              <div style={{marginTop:8}}>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color:"var(--muted)",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                  A sneak peek
                  <div style={{flex:1,height:1,background:"var(--bdr)"}}/>
                </div>
                {/* mock friend card */}
                {[
                  {init:"P",name:"Priya S.",week:9,mood:"🥰",text:"Heard the heartbeat today. Nothing can prepare you for that sound.",color:"#c05040",bg:"#fdf0ec"},
                  {init:"A",name:"Ananya K.",week:8,mood:"🤢",text:"Week 8 and the nausea is real. Toast and coconut water only.",color:"#2a4a70",bg:"#eaf0f8"},
                ].map((f,i)=>(
                  <div key={i} style={{background:"#fff",border:"1px solid var(--bdr)",borderRadius:14,padding:"13px 15px",marginBottom:9,opacity:0.55}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                      <div style={{width:32,height:32,borderRadius:"50%",background:f.bg,color:f.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0}}>{f.init}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:600,color:"var(--ink)"}}>{f.name}</div>
                        <div style={{fontSize:10,color:"var(--muted)"}}>Week {f.week} · public entry</div>
                      </div>
                      <div style={{fontSize:18}}>{f.mood}</div>
                    </div>
                    <div style={{fontSize:12,color:"var(--muted)",fontStyle:"italic",lineHeight:1.6}}>"{f.text}"</div>
                  </div>
                ))}
                <div style={{textAlign:"center",fontSize:11,color:"var(--muted)",fontStyle:"italic",marginTop:4}}>
                  This is what your feed will look like when friends join.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function MoodSummary({ entries, moodLog, onDeleteMood, dark }) {
  // Merge journal moods and standalone mood log entries by week
  const byWeek = {};
  // From journal entries (source: "journal")
  entries.forEach(e => {
    const k = `Wk ${e.week}`;
    if (!byWeek[k]) byWeek[k] = [];
    byWeek[k].push({ emoji: e.mood, source: "journal", id: null });
  });
  // From mood log (source: "body-panel" etc)
  (moodLog||[]).forEach(m => {
    const k = `Wk ${m.week||8}`;
    if (!byWeek[k]) byWeek[k] = [];
    byWeek[k].push({ emoji: m.emoji, source: m.source, id: m.id });
  });
  const weeks = Object.entries(byWeek).sort(([a],[b])=>parseInt(a.slice(2))-parseInt(b.slice(2)));
  if (!weeks.length) return (
    <div style={{padding:"14px 16px",fontSize:12,color:dark?"rgba(255,255,255,0.35)":"var(--muted)",fontStyle:"italic"}}>
      No entries yet. Tap an emotion in Your Body, or write in the journal.
    </div>
  );
  return (
    <div className="mood-chart">
      {weeks.map(([wk, moods])=>(
        <div key={wk} className="mood-chart-week">
          <div className="mood-chart-wk" style={{color:dark?"rgba(255,255,255,0.35)":"var(--muted)"}}>{wk}</div>
          <div className="mood-chart-dots">
            {moods.map((m,i)=>(
              <span key={i} className="mood-chart-dot"
                title={m.source === "journal" ? "From journal" : "Quick log · tap to remove"}
                onClick={()=>{ if(m.id && onDeleteMood) { if(window.confirm("Remove this mood?")) onDeleteMood(m.id); } }}
                style={{
                  cursor: m.id ? "pointer" : "default",
                  fontSize: m.source === "journal" ? 15 : 13,
                  opacity: m.source === "journal" ? 1 : 0.75,
                }}>
                {m.emoji}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function LibraryView({ onOpen, journalEntries, moodLog, onDeleteMood, onViewAlbum, onViewTimeline, onOpenProfile, profileData }) {
  const entryCount = journalEntries.length;
  const weeksTracked = new Set(journalEntries.map(e=>e.week)).size;
  const lastMood = journalEntries[0]?.mood || "🤍";
  return (
    <div className="library">

      {/* ── JOURNEY HERO with embedded milestone timeline ── */}
      <div className="lib-hero">
        <span className="lib-hero-bg-emoji">🤰</span>
        <div className="lib-hero-grad"/>
        <div style={{position:"relative",zIndex:2,padding:"18px 0 0",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div className="lib-hero-eyebrow" style={{marginBottom:0}}><div className="lib-hero-dot"/>Matri · Journey</div>
          {onOpenProfile && (
            <div className="profile-chip" onClick={e=>{e.stopPropagation();onOpenProfile();}}>
              <div className="profile-chip-avatar" style={{fontSize:14}}>🤰</div>
              {profileData?.name && <span className="profile-chip-name">{profileData.name.split(" ")[0]}</span>}
            </div>
          )}
        </div>
        <div className="lib-hero-inner">
          <div/>
          <div className="lib-hero-title">Always <em>with you.</em></div>
          <div className="lib-hero-sub">The things that matter all the way through.</div>
          <div className="lib-hero-stats">
            <div className="lib-hero-stat"><span className="lib-hero-stat-val">{entryCount}</span><span className="lib-hero-stat-lbl">memories</span></div>
            <div className="lib-hero-stat"><span className="lib-hero-stat-val">{weeksTracked} wks</span><span className="lib-hero-stat-lbl">documented</span></div>
            <div className="lib-hero-stat"><span className="lib-hero-stat-val">{lastMood}</span><span className="lib-hero-stat-lbl">last mood</span></div>
          </div>
          {/* ── MILESTONE STRIP embedded in hero ── */}
          <div style={{marginTop:16,paddingBottom:4}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:10}}>Your pregnancy milestones</div>
            <div style={{overflowX:"auto",scrollbarWidth:"none",marginLeft:-4}}>
              <div style={{display:"flex",alignItems:"flex-start",paddingBottom:8,minWidth:"max-content"}}>
                {MILESTONES.map((m,i)=>(
                  <div key={m.wk} style={{display:"flex",alignItems:"center"}}>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:56}}>
                      <div style={{
                        width:9,height:9,borderRadius:"50%",flexShrink:0,
                        background:m.done?"rgba(144,184,240,0.9)":m.current?"#90b8f0":"transparent",
                        border:`1.5px solid ${m.done?"rgba(144,184,240,0.9)":m.current?"#90b8f0":"rgba(255,255,255,0.2)"}`,
                        boxShadow:m.current?"0 0 0 3px rgba(144,184,240,0.15)":undefined
                      }}/>
                      <div style={{fontSize:8,color:"rgba(255,255,255,0.35)",marginTop:4,textAlign:"center"}}>{m.wk}</div>
                      <div style={{fontSize:8,color:m.current?"#90b8f0":m.done?"rgba(255,255,255,0.5)":"rgba(255,255,255,0.22)",textAlign:"center",lineHeight:1.3,maxWidth:52,fontWeight:m.current?600:400}}>{m.name}</div>
                    </div>
                    {i<MILESTONES.length-1&&<div style={{height:1.5,minWidth:16,background:m.done?"rgba(144,184,240,0.3)":"rgba(255,255,255,0.08)",marginBottom:20,flexShrink:0}}/>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TRACK ── */}
      <div className="lib-section" style={{marginTop:6}}>
        <div className="lib-section-lbl">Track</div>
        <div className="lib-grid">
          {/* MOOD SUMMARY — dark teal data viz */}
          <div className="lw lw-left lw-tall"
            style={{background:"linear-gradient(145deg,#0a2020,#142e2e)",border:"1px solid #102828"}}>
            <div style={{padding:"14px 16px 0"}}>
              <div className="w-lbl" style={{color:"#70c8a0"}}><div className="w-lbl-dot" style={{background:"#70c8a0"}}/>Mood over time</div>
            </div>
            <MoodSummary entries={journalEntries} moodLog={moodLog} onDeleteMood={onDeleteMood} dark/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {/* HEALTH LOG — slate pale */}
            <div className="lw lw-sm wc-slate" style={{opacity:0.8}}>
              <div className="win" style={{paddingBottom:14}}>
                <div className="w-lbl" style={{color:"var(--slate)"}}><div className="w-lbl-dot" style={{background:"var(--slate)"}}/>Health log</div>
                <div style={{fontSize:12,color:"var(--slate)",lineHeight:1.4,marginBottom:8}}>BP, weight, symptoms over time.</div>
                <div style={{fontSize:9,background:"var(--slate-pale)",border:"1px solid var(--slate-bdr)",borderRadius:100,padding:"3px 10px",color:"var(--slate)",fontWeight:700,letterSpacing:"0.08em",display:"inline-block"}}>Coming soon</div>
              </div>
            </div>
            {/* SUPPLEMENTS — forest pale */}
            <div className="lw lw-sm wc-forest" style={{opacity:0.8}}>
              <div className="win" style={{paddingBottom:14}}>
                <div className="w-lbl" style={{color:"var(--forest)"}}><div className="w-lbl-dot" style={{background:"var(--forest)"}}/>Supplements</div>
                <div style={{fontSize:12,color:"var(--forest)",lineHeight:1.4,marginBottom:8}}>Folic acid, iron, timing reminders.</div>
                <div style={{fontSize:9,background:"var(--forest-pale)",border:"1px solid var(--forest-bdr)",borderRadius:100,padding:"3px 10px",color:"var(--forest)",fontWeight:700,letterSpacing:"0.08em",display:"inline-block"}}>Coming soon</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── KNOW YOURSELF — Real Fears only ── */}
      <div className="lib-section">
        <div className="lib-section-lbl">Know yourself</div>
        <div className="lw lw-full lw-tall" onClick={()=>onOpen("fears")}
          style={{background:"linear-gradient(145deg,#1a1210,#2e1a14)",border:"1px solid #2a1410",marginBottom:10}}>
          <span style={{position:"absolute",fontSize:140,right:-10,bottom:-10,opacity:0.07,transform:"rotate(-10deg)",pointerEvents:"none",userSelect:"none"}}>🤍</span>
          <div className="win-lg">
            <div className="w-lbl" style={{color:"rgba(255,200,180,0.7)"}}><div className="w-lbl-dot" style={{background:"rgba(255,200,180,0.7)"}}/>Real fears</div>
            <div style={{fontFamily:"'Lora',serif",fontSize:22,color:"#fff",lineHeight:1.2,marginBottom:8}}>The things nobody <em style={{fontStyle:"italic",color:"#f0c0a0"}}>admits out loud.</em></div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.38)",lineHeight:1.6}}>Miscarriage. Labour. Your body. Your career. Honest, not dismissive.</div>
          </div>
          <div className="w-tap w-tap-lt">Tap to explore ↗</div>
        </div>
        <div className="lib-grid">
          {/* NOBODY TELLS YOU */}
          <div className="lw lw-left lw-med" onClick={()=>onOpen("ntty")}
            style={{background:"linear-gradient(145deg,#2a1040,#3a1852)",border:"1px solid #301048"}}>
            <span className="w-bg-e" style={{color:"#d0a0f0"}}>🤫</span>
            <div className="win">
              <div className="w-lbl" style={{color:"#c8a0f0"}}><div className="w-lbl-dot" style={{background:"#c8a0f0"}}/>Nobody tells you</div>
              <div style={{fontFamily:"'Lora',serif",fontSize:16,color:"#fff",lineHeight:1.3}}>The things no one <em style={{fontStyle:"italic",color:"#c8a0f0"}}>warns you about.</em></div>
            </div>
            <div className="w-tap w-tap-lt">Tap to explore ↗</div>
          </div>
          {/* MYTH BUSTING */}
          <div className="lw lw-right lw-med" onClick={()=>onOpen("myth")}
            style={{background:"linear-gradient(145deg,#2a1a04,#3a2808)",border:"1px solid #382008"}}>
            <span className="w-bg-e" style={{color:"#f0b860"}}>🔍</span>
            <div className="win">
              <div className="w-lbl" style={{color:"#f0b860"}}><div className="w-lbl-dot" style={{background:"#f0b860"}}/>Myth busting</div>
              <div style={{fontFamily:"'Lora',serif",fontSize:16,color:"#fff",lineHeight:1.3}}>What your family <em style={{fontStyle:"italic",color:"#f0b860"}}>got wrong.</em></div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.35)",marginTop:5}}>Papaya · Saffron · Eclipses · Ghee</div>
            </div>
            <div className="w-tap w-tap-lt">Tap to explore ↗</div>
          </div>
        </div>
      </div>

      {/* ── DAILY LIFE ── */}
      <div className="lib-section" style={{marginTop:6}}>
        <div className="lib-section-lbl">Daily life</div>
        <div className="lw lw-full lw-med wc-navy" onClick={()=>onOpen("planning")}>
          <span className="w-bg-e" style={{color:"var(--navy)",fontSize:90}}>📅</span>
          <div className="win-lg">
            <div className="w-lbl" style={{color:"var(--navy)"}}><div className="w-lbl-dot" style={{background:"var(--navy)"}}/>Life planning</div>
            <div className="wt-md">Pregnancy and your <em style={{color:"var(--navy)"}}>daily life.</em></div>
            <div style={{fontSize:12,color:"var(--muted)",marginTop:6,lineHeight:1.5}}>Working full-time · WFH · Managing home · Freelancing</div>
          </div>
          <div className="w-tap w-tap-dk">Tap to explore ↗</div>
        </div>
      </div>

      {/* ── STORIES ── */}
      <div className="lib-section" style={{marginTop:6}}>
        <div className="lib-section-lbl">Stories</div>
        <div className="lw lw-full lw-med" onClick={()=>onOpen("stories")}
          style={{background:"linear-gradient(145deg,#1e1030,#342050)",border:"1px solid #200e38"}}>
          <span style={{position:"absolute",fontSize:130,right:-10,bottom:-10,opacity:0.07,transform:"rotate(-10deg)",pointerEvents:"none",color:"#c8a0f0",userSelect:"none"}}>💬</span>
          <div className="win-lg">
            <div className="w-lbl" style={{color:"#c8a0f0"}}><div className="w-lbl-dot" style={{background:"#c8a0f0"}}/>Stories</div>
            <div style={{fontFamily:"'Lora',serif",fontSize:20,color:"#fff",lineHeight:1.2,marginBottom:8}}>Women who've been <em style={{fontStyle:"italic",color:"#c8a0f0"}}>right here.</em></div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.35)"}}>Real experiences. Read, share, feel less alone.</div>
          </div>
          <div className="w-tap w-tap-lt">Tap to explore ↗</div>
        </div>
      </div>

      {/* ── YOUR STORY ── */}
      <div className="lib-section" style={{marginTop:6,paddingBottom:16}}>
        <div className="lib-section-lbl">Your story</div>
        <div className="lib-grid">
          <div className="lw lw-left lw-sm" onClick={onViewAlbum}
            style={{background:"linear-gradient(145deg,#0a2020,#183535)",border:"1px solid #0a2828"}}>
            <div className="win" style={{paddingBottom:14}}>
              <div className="w-lbl" style={{color:"#70c8b8"}}><div className="w-lbl-dot" style={{background:"#70c8b8"}}/>Album</div>
              <div style={{fontFamily:"'Lora',serif",fontSize:16,color:"#fff",lineHeight:1.2}}>View your <em style={{fontStyle:"italic",color:"#70c8b8"}}>pregnancy book.</em></div>
            </div>
            <div className="w-tap w-tap-lt">Tap to explore ↗</div>
          </div>
          <div className="lw lw-right lw-sm" onClick={onViewTimeline}
            style={{background:"linear-gradient(145deg,#1a1a30,#282850)",border:"1px solid #202048"}}>
            <div className="win" style={{paddingBottom:14}}>
              <div className="w-lbl" style={{color:"#b0a0f0"}}><div className="w-lbl-dot" style={{background:"#b0a0f0"}}/>Timeline</div>
              <div style={{fontFamily:"'Lora',serif",fontSize:16,color:"#fff",lineHeight:1.2}}>All your <em style={{fontStyle:"italic",color:"#b0a0f0"}}>memories.</em></div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:4}}>{journalEntries.length} entries</div>
            </div>
            <div className="w-tap w-tap-lt">Tap to explore ↗</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function JournalTab({ entries, setEntries, onOpenAlbum, moodLog, onOpenProfile, profileData }) {
  const latest = entries[0];

  // Collect all photos across all entries for the thumbnail row
  const allPhotos = entries.flatMap(e =>
    (e.photos||[]).map(p => photoThumb(p)).filter(Boolean)
  ).slice(0, 6);

  const totalWeeks  = new Set(entries.map(e => e.week)).size;
  const totalPhotos = entries.reduce((a, e) => a + (e.photos?.length || 0), 0);

  return (
    <div className="journal-tab">
      {/* JOURNAL HERO */}
      <div className="jh">
        <span className="jh-bg">🤱</span>
        <div className="jh-grad"/>
        {/* Top row — eyebrow + profile chip at same height as home */}
        <div style={{position:"relative",zIndex:2,padding:"18px 22px 0",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div className="jh-eyebrow" style={{marginBottom:0}}><div className="jh-dot"/>Matri · Your journey</div>
          {onOpenProfile && (
            <div className="profile-chip" onClick={e=>{e.stopPropagation();onOpenProfile();}}>
              <div className="profile-chip-avatar" style={{fontSize:14}}>🤰</div>
              {profileData?.name && <span className="profile-chip-name">{profileData.name.split(" ")[0]}</span>}
            </div>
          )}
        </div>
        <div className="jh-inner">
          <div className="jh-title">Journal & <em>Memories.</em></div>

          {/* Photo thumbnail row — like pregnancy story widget */}
          {allPhotos.length > 0 && (
            <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"nowrap",overflowX:"auto",scrollbarWidth:"none",paddingBottom:2}}>
              {allPhotos.map((src,i)=>(
                <div key={i} style={{width:52,height:52,borderRadius:12,overflow:"hidden",flexShrink:0,
                  border:"1.5px solid rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.08)"}}>
                  <img src={src} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                </div>
              ))}
              {/* placeholder thumbs if fewer than 3 real photos */}
              {allPhotos.length < 3 && Array.from({length:3-allPhotos.length}).map((_,i)=>(
                <div key={"ph"+i} style={{width:52,height:52,borderRadius:12,flexShrink:0,
                  background:"rgba(255,255,255,0.06)",border:"1.5px dashed rgba(112,200,184,0.3)",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,opacity:0.5}}>📷</div>
              ))}
            </div>
          )}

          {/* No photos yet — show placeholder row */}
          {allPhotos.length === 0 && (
            <div style={{display:"flex",gap:8,marginBottom:14}}>
              {[0,1,2].map(i=>(
                <div key={i} style={{width:52,height:52,borderRadius:12,flexShrink:0,
                  background:"rgba(255,255,255,0.06)",border:"1.5px dashed rgba(112,200,184,0.3)",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,opacity:0.5}}>📷</div>
              ))}
            </div>
          )}

          {/* Compact latest entry snippet */}
          {latest && (
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,
              background:"rgba(255,255,255,0.07)",borderRadius:12,padding:"8px 12px"}}>
              <span style={{fontSize:16,flexShrink:0}}>{latest.mood}</span>
              <span style={{fontSize:12,color:"rgba(255,255,255,0.6)",fontStyle:"italic",
                fontFamily:"'Lora',serif",lineHeight:1.4,overflow:"hidden",
                display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
                "{latest.text}"
              </span>
            </div>
          )}

          <div className="jh-stats">
            <div className="jh-stat"><span className="jh-stat-val">{entries.length}</span><span className="jh-stat-lbl">memories</span></div>
            <div className="jh-stat"><span className="jh-stat-val">{totalWeeks} wks</span><span className="jh-stat-lbl">documented</span></div>
            <div className="jh-stat"><span className="jh-stat-val">{totalPhotos}</span><span className="jh-stat-lbl">photos</span></div>
          </div>
        </div>
      </div>
      {/* Full JournalPanel below hero */}
      <JournalPanel entries={entries} setEntries={setEntries} moodLog={moodLog}/>
    </div>
  );
}

/* ─── MATRI MOMENT WIDGET ────────────────────────────────────────────────── */
export function MatriMomentWidget({ onOpen, week }) {
  const moment = getMatriMoment(week);
  const saved  = loadMoments()[week];
  return (
    <div className="w w-full wc-dark1 w-med" onClick={onOpen}
      style={{background:"linear-gradient(145deg,#0a1a10,#142810)",border:"1px solid #0a2010"}}>
      <span style={{position:"absolute",fontSize:140,right:-10,bottom:-10,opacity:0.08,
        transform:"rotate(-10deg)",pointerEvents:"none",userSelect:"none"}}>🌙</span>
      <div className="win-lg">
        <div className="w-lbl" style={{color:"#80d0a0"}}>
          <div className="w-lbl-dot" style={{background:"#80d0a0"}}/>Matri moment
        </div>
        <div style={{fontFamily:"'Lora',serif",fontSize:18,color:"#fff",lineHeight:1.35,
          marginBottom:10,fontStyle:"italic"}}>
          "{moment.question.slice(0,80)}…"
        </div>
        {saved ? (
          <div style={{background:"rgba(255,255,255,0.07)",borderRadius:12,padding:"8px 12px",
            fontSize:12,color:"rgba(255,255,255,0.55)",fontStyle:"italic",lineHeight:1.5}}>
            ✓ You answered this week
          </div>
        ) : (
          <div style={{fontSize:12,color:"rgba(128,208,160,0.6)"}}>
            {moment.pause}
          </div>
        )}
      </div>
      <div className="w-tap w-tap-lt">Tap to explore ↗</div>
    </div>
  );
}

/* ─── MATRI MOMENT PANEL ────────────────────────────────────────────────── */
export function MatriMomentPanel({ week, entries, setEntries }) {
  const moment  = getMatriMoment(week);
  const saved   = loadMoments()[week];
  const [text,  setText]  = useState(saved?.text || "");
  const [saved2, setSaved] = useState(!!saved);
  const today   = istDate();

  const save = () => {
    if (!text.trim()) return;
    analytics.journalCreated("matri_moment");
    saveMoment(week, text.trim());
    // Also save to journal entries with moment flag
    setEntries(p => [{
      id: Date.now(), week, date: today, mood:"🌙",
      text: text.trim(), photos:[], isShared:false,
      type:"moment",
      heroBg:"linear-gradient(135deg,#0a1a10,#142810)",
      heroEmoji:"🌙", heroBgColor:"#0a2010"
    }, ...p]);
    setSaved(true);
  };

  return (
    <div>
      {/* Pause label */}
      <div style={{textAlign:"center",fontSize:12,fontWeight:600,letterSpacing:"0.2em",
        textTransform:"uppercase",color:"var(--teal)",marginBottom:16}}>{moment.pause}</div>

      {/* The question */}
      <div style={{fontFamily:"'Lora',serif",fontSize:19,color:"var(--ink)",lineHeight:1.65,
        fontStyle:"italic",marginBottom:20,padding:"0 4px"}}>
        "{moment.question}"
      </div>

      {saved2 ? (
        <div>
          <div style={{background:"var(--teal-pale)",border:"1px solid var(--teal-bdr)",
            borderRadius:14,padding:"14px 16px",marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:700,color:"var(--teal)",
              marginBottom:6,textTransform:"uppercase",letterSpacing:"0.1em"}}>You wrote</div>
            <div style={{fontFamily:"'Lora',serif",fontSize:14,fontStyle:"italic",
              color:"var(--ink)",lineHeight:1.7}}>"{text}"</div>
          </div>
          <div style={{fontSize:11,color:"var(--muted)",textAlign:"center",fontStyle:"italic"}}>
            Saved to your journal ✓
          </div>
        </div>
      ) : (
        <>
          <textarea
            className="j-textarea"
            rows={5}
            value={text}
            onChange={e=>setText(e.target.value)}
            placeholder="Write anything. There are no wrong answers here."
          />
          <button
            onClick={save}
            disabled={!text.trim()}
            style={{width:"100%",marginTop:10,background:"linear-gradient(135deg,#142810,#0a2010)",
              color:"#80d0a0",border:"1px solid #204020",borderRadius:14,padding:"13px",
              fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",
              opacity:text.trim()?1:0.4}}>
            Save this moment ✓
          </button>
        </>
      )}
    </div>
  );
}

/* ─── STORYBOOK PREVIEW WIDGET ──────────────────────────────────────────── */
export function StorybookPreviewWidget({ entries, onOpenAlbum, onOpenJournal }) {
  const photos = entries.flatMap(e=>(e.photos||[]).map(p=>photoThumb(p)).filter(Boolean)).slice(0,5);
  const latest = entries[0];
  const count  = entries.length;
  const isEmpty = count === 0;

  return (
    <div className="w w-full wc-dark3 w-tall" onClick={onOpenJournal}
      style={{position:"relative",cursor:"pointer",
      background:"linear-gradient(145deg,#0a2828,#183535)",
      border:"1px solid #102828",
      display:"flex",flexDirection:"column",padding:0,overflow:"hidden"}}>

      {isEmpty ? (
        <>
          {/* Journal illustration — right side, aligned with text */}
          <div style={{position:"absolute",right:16,top:"50%",transform:"translateY(-70%)",
            width:110,height:140,opacity:0.18,pointerEvents:"none",userSelect:"none",zIndex:0}}>
            <svg viewBox="0 0 110 140" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="18" y="4" width="84" height="132" rx="6" fill="#70c8b8"/>
              <rect x="22" y="10" width="76" height="120" rx="4" fill="#0a2828"/>
              {[18,30,42,54,66,78,90,102].map((y,i)=>(
                <g key={i}>
                  <circle cx="22" cy={y} r="4" fill="#70c8b8" opacity="0.8"/>
                  <circle cx="22" cy={y} r="2.5" fill="#0a2828"/>
                </g>
              ))}
              <rect x="32" y="22" width="56" height="2.5" rx="1" fill="#70c8b8" opacity="0.4"/>
              <rect x="32" y="32" width="48" height="2" rx="1" fill="#70c8b8" opacity="0.25"/>
              <rect x="32" y="40" width="52" height="2" rx="1" fill="#70c8b8" opacity="0.25"/>
              <rect x="32" y="48" width="40" height="2" rx="1" fill="#70c8b8" opacity="0.2"/>
              <rect x="68" y="20" width="30" height="36" rx="3" fill="#70c8b8" opacity="0.25"/>
              <rect x="72" y="24" width="22" height="16" rx="2" fill="#70c8b8" opacity="0.2"/>
              <path d="M79 44 C79 42 76 40 75 42 C74 40 71 42 71 44 C71 47 75 50 75 50 C75 50 79 47 79 44Z" fill="#70c8b8" opacity="0.4"/>
              <rect x="32" y="68" width="62" height="40" rx="3" fill="#70c8b8" opacity="0.15"/>
              <rect x="34" y="70" width="28" height="36" rx="2" fill="#70c8b8" opacity="0.2"/>
              <rect x="66" y="70" width="26" height="36" rx="2" fill="#70c8b8" opacity="0.18"/>
              <rect x="32" y="114" width="40" height="2" rx="1" fill="#70c8b8" opacity="0.2"/>
              <rect x="32" y="120" width="30" height="2" rx="1" fill="#70c8b8" opacity="0.15"/>
            </svg>
          </div>
          <div style={{flex:1,padding:"22px 20px 16px",position:"relative",zIndex:1}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.22em",textTransform:"uppercase",
              color:"#70c8b8",marginBottom:12}}>Your pregnancy story</div>
            <div style={{fontFamily:"'Lora',serif",fontSize:28,fontWeight:400,lineHeight:1.1,
              color:"#fff",marginBottom:14}}>
              Your pregnancy,<br/><em style={{fontStyle:"italic",color:"#70c8b8"}}>preserved forever.</em>
            </div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.5)",lineHeight:1.8,marginBottom:20,maxWidth:"70%"}}>
              Every week you write becomes a page.<br/>
              Every photo, a memory your child<br/>
              will read someday.
            </div>
          </div>
          <div style={{padding:"0 16px 18px",position:"relative",zIndex:1}}>
            <button onClick={onOpenJournal} style={{
              width:"100%",background:"#70c8b8",color:"#0a2828",border:"none",
              borderRadius:14,padding:"15px 20px",fontSize:14,fontWeight:700,
              cursor:"pointer",fontFamily:"inherit",display:"flex",
              alignItems:"center",justifyContent:"space-between",
              WebkitTapHighlightColor:"transparent"}}>
              <span>Start your first memory</span>
              <span style={{fontSize:18}}>→</span>
            </button>
          </div>
        </>
      ) : (
        <>
          <span style={{position:"absolute",fontSize:160,right:-10,bottom:40,opacity:0.07,
            transform:"rotate(-12deg)",pointerEvents:"none",userSelect:"none"}}>📖</span>
          <div style={{flex:1,padding:"16px 16px 14px",position:"relative",zIndex:1}}>
            <div className="w-lbl" style={{color:"#70c8b8",marginBottom:6}}>
              <div className="w-lbl-dot" style={{background:"#70c8b8"}}/>Your pregnancy story
            </div>
            <div style={{fontFamily:"'Lora',serif",fontSize:20,color:"#fff",lineHeight:1.2,marginBottom:4}}>
              {count} {count===1?"memory":"memories"} saved.
            </div>
            <div style={{fontFamily:"'Lora',serif",fontSize:12,fontStyle:"italic",
              color:"rgba(255,255,255,0.35)",marginBottom:14}}>A book is quietly forming…</div>
            <div style={{display:"flex",gap:7,marginBottom:12}}>
              {photos.map((src,i)=>(
                <div key={i} style={{width:48,height:48,borderRadius:10,overflow:"hidden",
                  flexShrink:0,border:"1.5px solid rgba(255,255,255,0.15)"}}>
                  <img src={src} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                </div>
              ))}
              {photos.length === 0 && [0,1,2].map(i=>(
                <div key={i} style={{width:48,height:48,borderRadius:10,flexShrink:0,
                  background:"rgba(255,255,255,0.05)",
                  border:"1.5px dashed rgba(112,200,184,0.25)",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,opacity:0.5}}>📷</div>
              ))}
              <div onClick={onOpenJournal} style={{width:48,height:48,borderRadius:10,flexShrink:0,
                background:"rgba(112,200,184,0.1)",border:"1.5px dashed rgba(112,200,184,0.35)",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:20,color:"#70c8b8",cursor:"pointer"}}>+</div>
            </div>
            {latest && (
              <div style={{fontSize:12,color:"rgba(255,255,255,0.38)",fontStyle:"italic",
                fontFamily:"'Lora',serif",lineHeight:1.55,
                display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
                "{latest.text}"
              </div>
            )}
          </div>
          <div className="book-open-bar" onClick={e=>{e.stopPropagation();onOpenAlbum();}}>
            <span className="book-open-icon">📖</span>
            <span className="book-open-txt">Open your pregnancy book</span>
            <span className="book-open-arr">→</span>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── HERO MOOD STRIP ──────────────────────────────────────────────────── */
export function HeroMoodStrip({ journalEntries, moodLog, onTap }) {
  // Pick the most recent signal — journal entry or standalone mood log
  const latestJournal = journalEntries[0];
  const latestMood    = (moodLog||[])[0];

  // Compare by id (both use Date.now() as id/timestamp)
  const showMoodLog = latestMood && (!latestJournal || latestMood.id > latestJournal.id);

  if (!latestJournal && !latestMood) return null;

  const emoji   = showMoodLog ? latestMood.emoji : latestJournal.mood;
  const text    = showMoodLog
    ? "You felt this today"
    : (latestJournal.text.slice(0, 48) + (latestJournal.text.length > 48 ? "…" : ""));
  const dateStr = showMoodLog ? "today" : latestJournal.date;

  return (
    <div className="hero-mood-strip" onClick={e=>{e.stopPropagation();onTap();}} style={{cursor:"pointer"}}>
      <div className="hero-mood-entry">
        <span className="hero-mood-emoji">{emoji}</span>
        <span className="hero-mood-text">{text}</span>
        <span className="hero-mood-ago">{dateStr}</span>
      </div>
    </div>
  );
}

/* ─── INSIGHT FEED WIDGET ────────────────────────────────────────────────── */
export function InsightFeedWidget({ healthContext, profileData, onOpenDoctorPrep, onRxUpload, embedded = false }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading]   = useState(false);

  const activeMeds = (profileData?.medications || []).filter(m => !(typeof m === "object" ? m.paused : false));
  const hasHealthData = !!(
    activeMeds.length ||
    (profileData?.conditions || []).length ||
    (profileData?.lab_data?.hemoglobin || []).length ||
    (profileData?.prescriptions || []).length
  );

  React.useEffect(() => {
    if (!hasHealthData) return;
    const cacheKey = "matri_insights_" + (healthContext?.summary || "").slice(0, 40);
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) { setInsights(JSON.parse(cached)); return; }

    setLoading(true);
    authFetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        system: "You are Matri, a warm pregnancy companion. Based on the woman's health data, generate 2-3 personalised proactive insights. Return ONLY a JSON array of objects: [{text: string, type: 'info'|'nudge'|'prep', priority: 'high'|'medium'|'low'}]. Each text max 12 words. Warm, never alarming, never a verdict. No markdown.",
        messages: [{ role: "user", content: `Health context: ${healthContext?.summary || "Week 8 pregnancy, first trimester"}. Generate 2-3 insights.` }],
        max_tokens: 300,
      })
    })
    .then(r => r.json())
    .then(data => {
      const text = data.content?.[0]?.text || "[]";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setInsights(parsed);
      sessionStorage.setItem(cacheKey, JSON.stringify(parsed));
    })
    .catch(() => setInsights([]))
    .finally(() => setLoading(false));
  }, [healthContext?.summary, hasHealthData]);

  const dotColor = (type) => type === "prep" ? "var(--rose)" : type === "nudge" ? "var(--amber)" : "#c8a0ff";

  const hasDoctorPrep = (healthContext?.doctorPrep || []).length > 0;
  const daysLeft = profileData?.next_appointment_date
    ? Math.ceil((new Date(profileData.next_appointment_date) - new Date()) / (1000*60*60*24))
    : null;

  const pitchContent = (
    <div style={{padding: embedded ? "16px 20px 20px" : undefined, cursor:"pointer"}} onClick={onRxUpload}>

      {/* label */}
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
        <span style={{fontSize:9,fontWeight:700,letterSpacing:"0.22em",textTransform:"uppercase",color:"rgba(200,160,255,0.65)"}}>✦ Matri AI</span>
        <span style={{fontSize:9,color:"rgba(255,255,255,0.2)",letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:600}}>— get personal</span>
      </div>

      {/* headline — italic serif, clearly the display text */}
      <div style={{fontFamily:"'Lora',serif",fontSize:20,fontStyle:"italic",color:"rgba(255,255,255,0.92)",lineHeight:1.25,marginBottom:18,fontWeight:400}}>
        Let Matri carry the medical load.
      </div>

      {/* feature bullets — emoji + text, no tiles */}
      <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:20}}>
        {[
          {e:"💊", t:"Track your medicines & send reminders"},
          {e:"🔬", t:"Know your upcoming tests & results"},
          {e:"💬", t:"Answer your questions based on your health"},
          {e:"📋", t:"Build your complete health timeline"},
        ].map((item,i) => (
          <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:15,flexShrink:0,lineHeight:1}}>{item.e}</span>
            <span style={{fontSize:13,color:"rgba(255,255,255,0.7)",lineHeight:1.4,fontWeight:400}}>{item.t}</span>
          </div>
        ))}
      </div>

      {/* CTA button */}
      <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"linear-gradient(135deg,rgba(200,160,255,0.2),rgba(180,130,255,0.12))",border:"1px solid rgba(200,160,255,0.26)",borderRadius:100,padding:"10px 20px",fontSize:13,fontWeight:600,color:"rgba(220,190,255,0.95)"}}>
        Upload a prescription →
      </div>
    </div>
  );

  const insightsContent = (
    <div style={{padding: embedded ? "14px 18px 18px" : undefined}} onClick={hasDoctorPrep ? onOpenDoctorPrep : undefined}>
      <div className="insight-feed-lbl" style={{marginBottom: insights?.length ? 0 : 0}}>
        <span>✦</span> Matri's insights
        {hasDoctorPrep && daysLeft !== null && daysLeft <= 7 && daysLeft >= 0 && (
          <span style={{marginLeft:"auto",fontSize:9,background:"var(--rose)",color:"#fff",borderRadius:100,padding:"2px 8px",fontWeight:700}}>
            Appt in {daysLeft}d →
          </span>
        )}
      </div>
      {loading ? (
        <div className="insight-empty">Thinking about your week…</div>
      ) : insights?.length ? (
        insights.map((ins, i) => (
          <div key={i} className="insight-item">
            <div className="insight-dot" style={{background: dotColor(ins.type)}}/>
            <div className="insight-text">{ins.text}</div>
          </div>
        ))
      ) : (
        <div className="insight-empty">Personalised insights on the way…</div>
      )}
    </div>
  );

  if (!hasHealthData) {
    if (embedded) return pitchContent;
    return (
      <div className="insight-feed" style={{borderRadius:20,cursor:"pointer"}}>
        <div className="insight-feed-inner">{pitchContent}</div>
      </div>
    );
  }

  if (embedded) return insightsContent;
  return (
    <div className="w w-full insight-feed">
      <div className="insight-feed-inner">{insightsContent}</div>
    </div>
  );
}

/* ─── QUICK ADD ENTRY ─────────────────────────────────────────────────── */
export function QuickAddEntry({ entries, setEntries, onClose }) {
  const [text, setText] = useState("");
  const [mood, setMood] = useState(null);
  const today = istDate();
  const save = () => {
    if (!text.trim()) return;
    analytics.journalCreated("quick_add");
    setEntries(p => [{id:Date.now(),week:8,date:today,mood:mood||"😊",text:text.trim(),photos:[],heroBg:"linear-gradient(135deg,#e8f5f5,#d0ecec)",heroEmoji:"📝",heroBgColor:"#e0f5f5"},...p]);
    onClose();
  };
  return (
    <div>
      <textarea className="j-textarea" rows={4} value={text} onChange={e=>setText(e.target.value)}
        placeholder="Write anything... a fear, a hope, what you want to remember today..."/>
      <div className="j-save-row" style={{marginTop:10}}>
        <div>
          <div style={{fontSize:10,color:"var(--muted)",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:600}}>Mood</div>
          <div className="j-mood-row">{MOODS.map(m=><span key={m} className={`j-mood${mood===m?" on":""}`} onClick={()=>setMood(m)}>{m}</span>)}</div>
        </div>
        <button className="j-save-btn" onClick={save} disabled={!text.trim()} style={{opacity:text.trim()?1:0.4}}>Save ✓</button>
      </div>
    </div>
  );
}
