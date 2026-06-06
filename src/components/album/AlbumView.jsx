import React, { useState, useEffect, useRef } from 'react';
import { compressImageFile, buildAlbumPages, photoSquare, photoAlbum } from '../../utils/albumUtils';
import { COVER_PHOTO_KEY } from '../../utils/storage';

export function PgCover({ userName }) {
  const [coverPhoto, setCoverPhoto] = useState(() => {
    try { return localStorage.getItem(COVER_PHOTO_KEY) || null; } catch { return null; }
  });
  const fileRef = useRef(null);

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    compressImageFile(file, 1200, 0.82).then(url => {
      try { localStorage.setItem(COVER_PHOTO_KEY, url); } catch {}
      setCoverPhoto(url);
    });
  };

  return (
    <div className="page pg-cover">
      <div className="pg-cover-dots"/>
      <div className="pg-cover-photo"
        style={{background:"linear-gradient(160deg,#faeae0,#f5d5c8 50%,#eeddd8 100%)",cursor:"pointer"}}
        onClick={e=>{e.stopPropagation();fileRef.current?.click();}}>
        {coverPhoto ? (
          <img src={coverPhoto} alt="Cover" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
        ) : (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10,position:"relative",zIndex:1}}>
            <div className="pg-cover-photo-emoji">🤰</div>
            <div style={{fontSize:11,fontWeight:600,color:"var(--rose)",letterSpacing:"0.1em",
              textTransform:"uppercase",background:"rgba(255,255,255,0.7)",
              borderRadius:100,padding:"5px 14px",backdropFilter:"blur(4px)"}}>
              + Add cover photo
            </div>
          </div>
        )}
        <div className="pg-cover-photo-fade"/>
        {/* Edit hint when photo set */}
        {coverPhoto && (
          <div style={{position:"absolute",bottom:16,right:16,zIndex:2,
            background:"rgba(255,255,255,0.85)",borderRadius:100,padding:"4px 12px",
            fontSize:10,fontWeight:600,color:"var(--rose)",backdropFilter:"blur(4px)"}}>
            ✎ Change
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePhoto}/>
      </div>
      <div className="pg-cover-body">
        <div className="pg-cover-series">A Matri Story · Your pregnancy</div>
        <div className="pg-cover-title">The Wait.</div>
        <div className="pg-cover-name">{userName ? `${userName}'s pregnancy` : "My pregnancy"}</div>
        <div className="pg-cover-chips">
          <span className="pg-cover-chip">📅 March 2025</span>
          <span className="pg-cover-chip">🏥 Due Nov 2025</span>
          <span className="pg-cover-chip">👶 First baby</span>
        </div>
        <div className="pg-cover-tagline">"The most ordinary extraordinary thing — growing a human being."</div>
      </div>
    </div>
  );
}

export function PgChapter({ data }) {
  return (
    <div className="page">
      <div className="pg-chapter-top" style={{background:`linear-gradient(160deg,${data.bgColor},${data.bgAccent})`}}>
        <div className="pg-chapter-photo">🤰</div>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.5),transparent)"}}/>
        <div style={{position:"relative",zIndex:2}}>
          <div className="pg-chapter-num" style={{color:"rgba(255,255,255,0.5)"}}>Chapter {data.num}</div>
          <div className="pg-chapter-title" style={{color:"#fff"}}>{data.title}</div>
        </div>
      </div>
      <div className="pg-chapter-body">
        <div className="pg-chapter-desc">"{data.desc}"</div>
        <div className="pg-chapter-meta">{data.count} memories · Weeks 6–40</div>
      </div>
    </div>
  );
}

export function PgWeekHeader({ data }) {
  const col = data.week<=12 ? "var(--rose)" : data.week<=27 ? "var(--navy)" : "var(--teal)";
  const bg  = data.week<=12
    ? "linear-gradient(140deg,#fdf0ec,#f8ddd5)"
    : data.week<=27
    ? "linear-gradient(140deg,#eaf2f8,#d8e8f5)"
    : "linear-gradient(140deg,#e4f5f5,#c8ecec)";
  return (
    <div className="page">
      <div className="pg-wk-photo" style={{background:bg}}>
        <div style={{fontSize:90,opacity:0.55}}>{data.baby.emoji}</div>
        <div className="pg-wk-photo-fade" style={{background:`linear-gradient(to top,var(--paper),transparent)`}}/>
      </div>
      <div className="pg-wk-body">
        <div className="pg-wk-num" style={{color:col}}>{data.week}</div>
        <div className="pg-wk-label" style={{color:"var(--muted)"}}>
          Week of pregnancy · {data.week<=12?"First":data.week<=27?"Second":"Third"} Trimester
        </div>
        <div className="pg-wk-divider"/>
        <div className="pg-wk-baby">
          <div className="pg-wk-baby-emoji">{data.baby.icon}</div>
          <div>
            <div className="pg-wk-baby-size">About the size of <em>{data.baby.compare}</em> · {data.baby.cm}</div>
            <div className="pg-wk-baby-fact">{data.baby.fact}</div>
          </div>
        </div>
        {data.date && <div className="pg-wk-date">{data.date}</div>}
        {data.mood && <div className="pg-wk-mood"><span>Feeling</span><span style={{fontSize:20,marginLeft:4}}>{data.mood}</span></div>}
      </div>
    </div>
  );
}

export function PgEntry({ data }) {
  const { entry, week, pg } = data;
  const heroPhoto = entry.photos.map(photoAlbum).find(Boolean);
  return (
    <div className="page pg-entry">
      {/* ── LARGE HERO PHOTO ── */}
      <div className="pg-entry-hero" style={{background:entry.heroBg, height: entry.text?.trim() ? 300 : "70%", minHeight:280}}>
        <div className="pg-entry-hero-inner">
          {heroPhoto ? (
            <img src={heroPhoto} alt="" className="pg-entry-hero-img"/>
          ) : (
            <div className="pg-entry-hero-emoji">{entry.heroEmoji || "📷"}</div>
          )}
        </div>
        <div className="pg-entry-hero-fade" style={{background:`linear-gradient(to top,var(--paper),transparent)`}}/>
        <div className="pg-entry-hero-wk">Week {week}</div>
        <div className="pg-entry-hero-mood">{entry.mood}</div>
      </div>

      {/* ── POLAROID STRIP ── */}
      {entry.photos.length > 0 && (
        <div className="pg-entry-photos">
          {entry.photos.slice(0,3).map((p,i) => (
            <div key={i} className="pg-entry-polaroid" style={{background:entry.heroBgColor||"#f8f4ee"}}>
              <div className="pg-polaroid-tape"/>
              {photoSquare(p) ? <img src={photoSquare(p)} alt=""/> : (typeof p === "string" ? p : "📷")}
            </div>
          ))}
        </div>
      )}

      {/* ── TEXT — only if written ── */}
      <div className="pg-entry-content">
        <div className="pg-entry-date">{entry.date}</div>
        {entry.text?.trim() && (
          <div className="pg-entry-text">{entry.text}</div>
        )}
        <div className="pg-entry-footer">
          <div className="pg-entry-footer-wk">Pregnancy · Week {week}</div>
          <div className="pg-entry-footer-pg">{pg}</div>
        </div>
      </div>
    </div>
  );
}

export function PgClosing({ data }) {
  return (
    <div className="page pg-closing">
      <div className="pg-closing-icon">🌿</div>
      <div className="pg-closing-title">Your story so far.</div>
      <div className="pg-closing-body">
        {data.count} {data.count===1?"memory":"memories"} across {data.weeks} {data.weeks===1?"week":"weeks"}.<br/>
        Each one preserved, exactly as you felt it.
      </div>
      <div className="pg-closing-div"/>
      <div className="pg-closing-cta">The story continues</div>
      <div className="pg-closing-cont">Every week you add becomes a new page.<br/>This book is never finished — it just keeps growing.</div>
      <div className="pg-closing-dots">
        <div className="pg-closing-dot"/><div className="pg-closing-dot"/><div className="pg-closing-dot"/>
      </div>
    </div>
  );
}

/* ─── ALBUM VIEW ──────────────────────────────────────────────────────── */
export function AlbumView({ entries, onClose, userName }) {
  const [pg, setPg]       = useState(0);
  const [k,  setK]        = useState(0);
  const [print, setPrint] = useState(false);
  const touchRef          = useRef(null);
  const pages = buildAlbumPages(entries);
  const total = pages.length;
  const page  = pages[pg];

  const go = (n) => {
    if (n < 0 || n >= total) return;
    setK(x => x + 1);
    setPg(n);
  };

  useEffect(()=>{
    const h=e=>{if(e.key==="ArrowRight")go(pg+1);if(e.key==="ArrowLeft")go(pg-1);};
    window.addEventListener("keydown",h);
    return()=>window.removeEventListener("keydown",h);
  },[pg]);

  // Swipe detection
  const onTouchStart = (e) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
  };
  const onTouchEnd = (e) => {
    if (!touchRef.current) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = e.changedTouches[0].clientY - touchRef.current.y;
    const dt = Date.now() - touchRef.current.t;
    // Must be mostly horizontal, fast enough, and long enough
    if (Math.abs(dx) > Math.abs(dy) * 1.5 && Math.abs(dx) > 40 && dt < 500) {
      if (dx < 0) go(pg + 1, 1);   // swipe left → next page
      else         go(pg - 1, -1);  // swipe right → prev page
    }
    touchRef.current = null;
  };

  const pgLabel = () => {
    switch(page.type){
      case "cover":       return "Cover";
      case "entry":       return `Week ${page.week} · Entry`;
      case "closing":     return "The end, for now";
      default: return "";
    }
  };

  const renderPage = () => {
    switch(page.type){
      case "cover":       return <PgCover key={k} userName={userName}/>;
      case "entry":       return <PgEntry key={k} data={page}/>;
      case "closing":     return <PgClosing key={k} data={page}/>;
      default: return null;
    }
  };

  return (
    <>
      {/* BAR */}
      <div className="album-bar">
        <div className="album-bar-left">
          <div className="album-bar-title">{userName ? `${userName}'s Pregnancy Story` : "My Pregnancy Story"}</div>
          <div className="album-bar-sub">{entries.length} memories</div>
        </div>
        <div className="album-bar-right">
          <button className="album-print" onClick={()=>setPrint(true)}>📖 Print</button>
          <button className="album-x" onClick={onClose}>✕</button>
        </div>
      </div>

      {/* PAGE LABEL */}
      <div className="album-pg-label">{pgLabel()} · {pg+1}/{total}</div>

      {/* BOOK — swipe or tap halves */}
      <div className="book"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={e=>{ if(!touchRef.current) { if(e.clientX > window.innerWidth/2) go(pg+1); else go(pg-1); } }}
        style={{overflow:"hidden"}}>
        <div key={k} style={{width:"100%", height:"100%", display:"flex", flexDirection:"column"}}>
          {renderPage()}
        </div>
      </div>

      {/* NAV */}
      <div className="album-nav">
        <button className="anav-btn" onClick={()=>go(pg-1)} disabled={pg===0}>←</button>
        <div className="anav-center">
          <div className="anav-dots">
            {pages.map((_,i)=>(
              <div key={i} className="anav-dot" onClick={()=>go(i)}
                style={{width:i===pg?16:4,background:i===pg?"var(--rose)":"rgba(255,255,255,0.2)"}}/>
            ))}
          </div>
          <div className="anav-total">{pg+1} / {total}</div>
        </div>
        <button className={"anav-btn"+(pg<total-1?" next":"")} onClick={()=>go(pg+1)} disabled={pg===total-1}>→</button>
      </div>

      {/* PRINT MODAL */}
      {print && (
        <div className="print-back" onClick={()=>setPrint(false)}>
          <div className="print-sheet" onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:36,textAlign:"center",marginBottom:10}}>📖</div>
            <div className="print-title">Print your album</div>
            <div className="print-sub">Your pregnancy story, printed and bound as a beautiful keepsake book.</div>
            {[
              {ico:"📄",title:"Download PDF",sub:"Print-ready · A5 size · Print at home",col:"var(--navy)",btn:"Download"},
              {ico:"📦",title:"Order printed book",sub:"Delivered to your door · Premium print · ₹799",col:"var(--rose)",btn:"Order now"},
            ].map((o,i)=>(
              <div key={i} className="print-opt">
                <span style={{fontSize:28}}>{o.ico}</span>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:"var(--ink)",marginBottom:2}}>{o.title}</div><div style={{fontSize:11,color:"var(--muted)"}}>{o.sub}</div></div>
                <button className="print-opt-btn" style={{background:o.col}}>{o.btn}</button>
              </div>
            ))}
            <button className="print-cancel" onClick={()=>setPrint(false)}>Not now</button>
          </div>
        </div>
      )}
    </>
  );
}
