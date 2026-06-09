import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabase';
import { authFetch } from '../../utils/auth';
import { PrescriptionUploadFlow, PrescriptionDetailSheet } from './PrescriptionComponents';
import { TestOrdersSection, TestReportSheet, LabTimelineRow } from './LabComponents';

/* ─── SUMMARY PARSER ─────────────────────────────────────────────────────── */
function parseSummaryPoints(text) {
  if (!text) return [];
  return text
    .split(/\.\s+/)
    .map(s => s.trim().replace(/\.$/, ''))
    .filter(Boolean)
    .map(s => {
      const lower = s.toLowerCase();
      if (lower.startsWith('medicines:')) {
        const count = s.substring('medicines:'.length).trim().split(',').length;
        return { icon: '💊', text: `${count} medicine${count !== 1 ? 's' : ''}` };
      }
      if (/^week \d+/i.test(s))      return { icon: '🗓', text: s };
      if (/diet/i.test(s))           return { icon: '🥗', text: s };
      if (/blood group/i.test(s))    return { icon: '🩸', text: s };
      if (/appointment/i.test(s))    return { icon: '📅', text: s };
      if (/condition|diabetes|thyroid|hypertension/i.test(s)) return { icon: '⚕️', text: s };
      return { icon: '·', text: s };
    });
}

/* ─── COLOUR PALETTES ────────────────────────────────────────────────────── */
const PAL = {
  rose:  { pale:"var(--rose-pale)",  bdr:"var(--rose-bdr)",  col:"var(--rose)"  },
  navy:  { pale:"var(--navy-pale)",  bdr:"var(--navy-bdr)",  col:"var(--navy)"  },
  teal:  { pale:"var(--teal-pale)",  bdr:"var(--teal-bdr)",  col:"var(--teal)"  },
  slate: { pale:"var(--slate-pale)", bdr:"var(--slate-bdr)", col:"var(--slate)" },
};

/* ─── MED CARD ───────────────────────────────────────────────────────────── */
function parseFreqSlots(freq) {
  if (!freq) return null;
  const lower = freq.toLowerCase();
  const match = freq.match(/(\d+)-(\d+)-(\d+)/);
  if (match) return [+match[1], +match[2], +match[3]];
  if (lower.includes("once") || /\bod\b/.test(lower)) {
    if (lower.includes("night") || lower.includes("bedtime") || lower.includes("evening")) return [0, 0, 1];
    if (lower.includes("afternoon") || lower.includes("noon")) return [0, 1, 0];
    return [1, 0, 0];
  }
  if (lower.includes("twice") || /\bbd\b/.test(lower) || /\bbid\b/.test(lower)) return [1, 0, 1];
  if (lower.includes("three") || lower.includes("thrice") || /\btds\b/.test(lower) || /\btid\b/.test(lower)) return [1, 1, 1];
  if (lower.includes("four") || /\bqid\b/.test(lower)) return [1, 1, 1];
  return null;
}

function parseMealNote(freq, notes) {
  const text = `${freq || ""} ${notes || ""}`.toLowerCase();
  if (text.includes("empty stomach") || text.includes("before food") || text.includes("before meal")) return "Empty stomach";
  if (text.includes("after food") || text.includes("after meal") || text.includes("with food")) return "After meals";
  if (text.includes("with milk")) return "With milk";
  if (text.includes("with water")) return "With water";
  return null;
}

function MedCard({ med, onEdit, onRemove, onRanOut, onRestock }) {
  const isRanOut = !!med.ran_out;
  const slots    = parseFreqSlots(med.frequency);
  const mealNote = parseMealNote(med.frequency, med.notes);

  return (
    <div style={{background:isRanOut?"var(--cream2)":"var(--rose-pale)",border:`1px solid ${isRanOut?"var(--bdr)":"var(--rose-bdr)"}`,borderRadius:13,padding:"11px 14px",marginBottom:8,opacity:isRanOut?0.75:1}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:18,flexShrink:0}}>💊</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
            <span style={{fontSize:13,fontWeight:600,color:"var(--ink)",lineHeight:1.3}}>{med.name}</span>
            {isRanOut && (
              <span style={{fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:100,textTransform:"uppercase",letterSpacing:"0.1em",background:"rgba(200,80,60,0.1)",color:"var(--rose)",border:"1px solid var(--rose-bdr)",flexShrink:0}}>
                Ran out
              </span>
            )}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5,marginTop:2,flexWrap:"wrap"}}>
            {med.dosage && <span style={{fontSize:10,color:"var(--muted)"}}>{med.dosage}</span>}
            {mealNote && (
              <span style={{fontSize:9,fontWeight:600,color:"var(--muted)",background:"rgba(0,0,0,0.05)",borderRadius:100,padding:"1px 7px"}}>
                {mealNote}
              </span>
            )}
          </div>
        </div>
        {slots ? (
          <div style={{display:"flex",gap:3,flexShrink:0}}>
            {[["M",slots[0]],["A",slots[1]],["N",slots[2]]].map(([label,val]) => (
              <div key={label} style={{display:"flex",flexDirection:"column",alignItems:"center",background:val>0?"#fff":"rgba(0,0,0,0.05)",border:`1px solid ${val>0?"var(--rose-bdr)":"var(--bdr)"}`,borderRadius:7,padding:"3px 7px",minWidth:28}}>
                <span style={{fontSize:13,fontWeight:700,color:val>0?"var(--rose)":"var(--muted)",lineHeight:1.1}}>{val}</span>
                <span style={{fontSize:7,color:"var(--muted)",letterSpacing:"0.04em",marginTop:1}}>{label}</span>
              </div>
            ))}
          </div>
        ) : med.frequency ? (
          <div style={{fontSize:9,color:"var(--rose)",fontWeight:500,flexShrink:0,maxWidth:72,textAlign:"right",lineHeight:1.35}}>{med.frequency}</div>
        ) : null}
      </div>

      {isRanOut ? (
        <div style={{display:"flex",gap:8,marginTop:10}}>
          <button onClick={onRestock} style={{flex:2,padding:"8px",background:"var(--teal)",border:"none",borderRadius:100,fontSize:11,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>Restock ✓</button>
          <button onClick={onRemove}  style={{flex:1,padding:"8px",background:"var(--rose-pale)",border:"1px solid var(--rose-bdr)",borderRadius:100,fontSize:11,fontWeight:600,color:"var(--rose)",cursor:"pointer",fontFamily:"inherit"}}>Remove</button>
        </div>
      ) : (
        <div style={{display:"flex",gap:8,marginTop:10}}>
          <button onClick={onEdit}   style={{flex:1,padding:"8px",background:"transparent",border:"1.5px solid var(--rose-bdr)",borderRadius:100,fontSize:11,color:"var(--rose)",cursor:"pointer",fontFamily:"inherit"}}>Edit</button>
          <button onClick={onRemove} style={{flex:1,padding:"8px",background:"var(--rose-pale)",border:"1px solid var(--rose-bdr)",borderRadius:100,fontSize:11,fontWeight:600,color:"var(--rose)",cursor:"pointer",fontFamily:"inherit"}}>Remove</button>
          <button onClick={onRanOut} style={{flex:1,padding:"8px",background:"rgba(200,150,0,0.1)",border:"1px solid rgba(200,150,0,0.25)",borderRadius:100,fontSize:11,fontWeight:600,color:"#8a6800",cursor:"pointer",fontFamily:"inherit"}}>Ran out</button>
        </div>
      )}
    </div>
  );
}

/* ─── MED EDIT SHEET ─────────────────────────────────────────────────────── */
function MedEditSheet({ med, onSave, onClose }) {
  const [vis,    setVis]    = useState(false);
  const [name,   setName]   = useState(med.name || "");
  const [saving, setSaving] = useState(false);
  const initSlots = () => {
    const m = (med.frequency || "").match(/(\d+)-(\d+)-(\d+)/);
    return m ? [+m[1], +m[2], +m[3]] : [1, 0, 1];
  };
  const [slots, setSlots] = useState(initSlots);

  useEffect(() => { requestAnimationFrame(() => setVis(true)); }, []);
  const close = () => { setVis(false); setTimeout(onClose, 350); };

  const step = (idx, delta) => setSlots(s => s.map((v, i) => i === idx ? Math.max(0, Math.min(4, v + delta)) : v));

  const handleSave = async () => {
    setSaving(true);
    await onSave({ name: name.trim(), frequency: `${slots[0]}-${slots[1]}-${slots[2]}` });
  };

  return (
    <>
      <div className={`pedit-backdrop${vis?" open":""}`} onClick={close}/>
      <div className={`pedit-sheet${vis?" open":""}`} style={{maxHeight:"80vh",overflowY:"auto"}}>
        <div className="pedit-handle"/>
        <div className="pedit-title">Edit <em>medicine</em></div>

        <div className="pedit-label">Medicine name</div>
        <input className="pedit-input" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Folic Acid 5mg"/>

        <div className="pedit-label" style={{marginTop:18,marginBottom:10}}>Frequency (doses per slot)</div>
        <div style={{display:"flex",gap:10,marginBottom:8}}>
          {[["Morning",0],["Afternoon",1],["Night",2]].map(([label,idx]) => (
            <div key={label} style={{flex:1,textAlign:"center",background:"var(--cream2)",borderRadius:12,padding:"10px 6px"}}>
              <div style={{fontSize:9,color:"var(--muted)",marginBottom:8,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em"}}>{label}</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                <button onClick={()=>step(idx,-1)} style={{width:26,height:26,borderRadius:"50%",background:"#fff",border:"1px solid var(--bdr)",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1,color:"var(--muted)"}}>−</button>
                <span style={{fontSize:22,fontWeight:700,color:"var(--rose)",minWidth:20,textAlign:"center"}}>{slots[idx]}</span>
                <button onClick={()=>step(idx,+1)} style={{width:26,height:26,borderRadius:"50%",background:"var(--rose-pale)",border:"1px solid var(--rose-bdr)",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--rose)",lineHeight:1}}>+</button>
              </div>
            </div>
          ))}
        </div>
        <div style={{textAlign:"center",fontSize:13,fontWeight:600,color:"var(--muted)",marginBottom:20,letterSpacing:"0.08em"}}>
          {slots[0]}–{slots[1]}–{slots[2]}
        </div>

        <button onClick={handleSave} disabled={saving||!name.trim()}
          style={{width:"100%",padding:"14px",background:"var(--rose)",border:"none",borderRadius:100,fontSize:15,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit",opacity:saving||!name.trim()?0.5:1}}>
          {saving?"Saving…":"Save changes"}
        </button>
      </div>
    </>
  );
}

/* ─── SECTION CARD (collapsible) ─────────────────────────────────────────── */
function SectionCard({ icon, title, color = "rose", summary, expanded, onTap, children }) {
  const p = PAL[color] || PAL.rose;
  return (
    <div style={{border:`1px solid ${expanded ? p.bdr : "var(--bdr)"}`,borderRadius:18,overflow:"hidden",marginBottom:12,background:"#fff",transition:"border-color 0.2s"}}>
      <div onClick={onTap} style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",background:expanded ? p.pale : "#fff",transition:"background 0.2s"}}>
        <div style={{width:38,height:38,borderRadius:11,background:p.pale,border:`1px solid ${p.bdr}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,flexShrink:0}}>
          {icon}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:700,color:"var(--ink)"}}>{title}</div>
          <div style={{fontSize:11,color:"var(--muted)",marginTop:1}}>{summary}</div>
        </div>
        <span style={{fontSize:16,color:"var(--muted)",transform:expanded ? "rotate(90deg)" : "none",transition:"transform 0.2s",display:"block"}}>›</span>
      </div>
      {expanded && (
        <div style={{padding:"12px 16px 16px",borderTop:`1px solid ${p.bdr}`}}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── GHOST SECTION (empty-state preview) ────────────────────────────────── */
function GhostSection({ icon, title, color, hint, items }) {
  const p = PAL[color] || PAL.rose;
  return (
    <div style={{border:`1px solid ${p.bdr}`,borderRadius:18,overflow:"hidden",marginBottom:12,background:"#fff"}}>
      <div style={{padding:"13px 16px",display:"flex",alignItems:"center",gap:10,background:p.pale}}>
        <span style={{fontSize:18}}>{icon}</span>
        <span style={{fontSize:13,fontWeight:700,color:p.col,flex:1}}>{title}</span>
        <span style={{fontSize:10,fontWeight:600,color:p.col,background:"rgba(255,255,255,0.65)",borderRadius:100,padding:"2px 9px",border:`1px solid ${p.bdr}`}}>AI-powered</span>
      </div>
      <div style={{padding:"10px 14px 4px"}}>
        {items.map((item, i) => (
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:i<items.length-1?"1px solid var(--bdr)":"none"}}>
            <span style={{fontSize:15,flexShrink:0}}>{icon}</span>
            <span style={{fontSize:12,color:"var(--ink)",filter:"blur(4px)",userSelect:"none",flex:1,whiteSpace:"nowrap",overflow:"hidden"}}>{item}</span>
          </div>
        ))}
      </div>
      <div style={{padding:"8px 14px 13px",fontSize:11,color:"var(--muted)",fontStyle:"italic",lineHeight:1.55}}>{hint}</div>
    </div>
  );
}

/* ─── EMPTY STATE ────────────────────────────────────────────────────────── */
function EmptyHealthState({ onUpload }) {
  return (
    <>
      <div style={{background:"linear-gradient(135deg,var(--slate-pale),#e8ecf4)",border:"1px solid var(--slate-bdr)",borderRadius:20,padding:"22px 18px 20px",marginBottom:20,textAlign:"center"}}>
        <div style={{fontSize:32,marginBottom:10,opacity:0.85}}>✦</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"var(--ink)",lineHeight:1.3,marginBottom:8}}>
          Your health, <em>organized by AI.</em>
        </div>
        <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.75,marginBottom:20}}>
          Upload one prescription. Matri reads the handwriting — medicines, scan dates, and tests appear automatically in the right places.
        </div>
        <button
          onClick={onUpload}
          style={{width:"100%",padding:"14px",background:"var(--slate)",border:"none",borderRadius:100,fontSize:14,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          ✦ Upload prescription
        </button>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:18,overflowX:"auto",paddingBottom:2,scrollbarWidth:"none"}}>
        {[
          { icon:"⚡", text:"Reads any handwriting" },
          { icon:"💊", text:"Medicines auto-added" },
          { icon:"🔬", text:"Scan dates extracted" },
          { icon:"📈", text:"Tracks trends over time" },
        ].map(({ icon, text }) => (
          <div key={text} style={{flexShrink:0,background:"#fff",border:"1px solid var(--bdr)",borderRadius:100,padding:"6px 12px",display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:13}}>{icon}</span>
            <span style={{fontSize:11,fontWeight:600,color:"var(--ink)",whiteSpace:"nowrap"}}>{text}</span>
          </div>
        ))}
      </div>

      <GhostSection
        icon="💊" title="Medicines" color="rose"
        hint="Reads dosage, timing & meal instructions from any handwriting"
        items={["Tab Folic Acid 5mg · Once daily · After meals", "Cap Iron + Vitamin C · Twice daily", "Syp DHA 200mg · Bedtime"]}
      />
      <GhostSection
        icon="🔬" title="Scans" color="navy"
        hint="Detects scan names and timing from your prescription — advises what to book"
        items={["NT Scan · Week 11–14", "Anomaly Scan · Week 18–20", "Growth Scan · Week 28–30"]}
      />
      <GhostSection
        icon="🧪" title="Tests" color="teal"
        hint="Tracks CBC, TSH, HbA1c over time — flags what's outside normal range"
        items={["CBC (Blood Count) · Ordered · Pending", "TSH (Thyroid) · Ordered", "Blood Sugar + HbA1c · Ordered"]}
      />
    </>
  );
}

/* ─── DOCTOR NOTES ROW ───────────────────────────────────────────────────── */
function DoctorNotesRow({ prescriptions, onViewDetail, onUpload }) {
  return (
    <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4,scrollbarWidth:"none",WebkitOverflowScrolling:"touch"}}>
      {prescriptions.map((rx, i) => {
        const date = rx.prescribed_date
          ? new Date(rx.prescribed_date).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"2-digit" })
          : null;
        const chips = [
          rx.medicine_count && `${rx.medicine_count} 💊`,
          rx.test_count     && `${rx.test_count} 🧪`,
          rx.scan_count     && `${rx.scan_count} 🔬`,
        ].filter(Boolean).join("  ·  ");

        return (
          <div
            key={rx.id || i}
            onClick={() => onViewDetail(rx)}
            style={{flexShrink:0,width:165,background:"var(--navy-pale)",border:"1px solid var(--navy-bdr)",borderRadius:16,padding:"14px",cursor:"pointer"}}>
            <div style={{fontSize:9,fontWeight:700,color:"var(--navy)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:5}}>Prescription</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:13,color:"var(--ink)",lineHeight:1.35,marginBottom:5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
              {rx.doctor_name || (date ? `Doctor · ${date}` : "Uploaded prescription")}
            </div>
            {rx.clinic_name && <div style={{fontSize:10,color:"var(--muted)",marginBottom:4}}>{rx.clinic_name}</div>}
            {date && <div style={{fontSize:10,color:"var(--muted)",marginBottom:6}}>{date}</div>}
            {chips && <div style={{fontSize:11,color:"var(--navy)",marginBottom:6}}>{chips}</div>}
            <div style={{fontSize:10,fontWeight:600,color:"var(--navy)"}}>View ↗</div>
          </div>
        );
      })}

      <div
        onClick={onUpload}
        style={{flexShrink:0,width:110,background:"transparent",border:"2px dashed var(--slate-bdr)",borderRadius:16,padding:"14px 10px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:7,color:"var(--slate)"}}>
        <span style={{fontSize:26,fontWeight:300,lineHeight:1}}>+</span>
        <span style={{fontSize:11,fontWeight:600,textAlign:"center",lineHeight:1.35}}>Add prescription</span>
      </div>
    </div>
  );
}

/* ─── SCAN CARD ──────────────────────────────────────────────────────────── */
function ScanCard({ scan, onAction }) {
  const isCompleted = scan.status === "completed";
  const hasReport   = isCompleted && !!scan.image_url;
  const f = scan.findings || {};
  const dateLabel = scan.date
    ? new Date(scan.date).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })
    : scan.week || null;

  const findingChips = [
    f.heartbeat_bpm && `${f.heartbeat_bpm} bpm`,
    f.position,
    f.fluid_level && f.fluid_level !== "normal" && `Fluid: ${f.fluid_level}`,
    f.nt_measurement != null && `NT: ${f.nt_measurement}mm`,
    f.weight_grams && `${Math.round(f.weight_grams)}g`,
    f.crl_mm && `CRL: ${f.crl_mm}mm`,
  ].filter(Boolean);

  return (
    <div style={{background:"var(--navy-pale)",border:"1px solid var(--navy-bdr)",borderRadius:13,padding:"11px 14px",marginBottom:8}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
        <span style={{fontSize:20,flexShrink:0,marginTop:1}}>🔬</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:2}}>
            <span style={{fontSize:13,fontWeight:600,color:"var(--ink)"}}>{scan.type || "Scan"}</span>
            <span style={{
              fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:100,textTransform:"uppercase",letterSpacing:"0.1em",
              background: isCompleted ? "var(--teal-pale)" : "rgba(200,160,60,0.12)",
              color:       isCompleted ? "var(--teal)"      : "#8a6800",
              border:     `1px solid ${isCompleted ? "var(--teal-bdr)" : "rgba(200,160,60,0.3)"}`,
            }}>
              {isCompleted ? "Done" : "Scheduled"}
            </span>
          </div>
          {dateLabel && <div style={{fontSize:10,color:"var(--navy)",fontWeight:500,marginBottom:3}}>{dateLabel}</div>}
          {hasReport && findingChips.length > 0 && (
            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:4}}>
              {findingChips.map((c, i) => (
                <span key={i} style={{fontSize:10,background:"rgba(255,255,255,0.7)",border:"1px solid var(--navy-bdr)",borderRadius:100,padding:"2px 8px",color:"var(--navy)",fontWeight:500}}>{c}</span>
              ))}
            </div>
          )}
          {!isCompleted && scan.notes && (
            <div style={{fontSize:11,color:"var(--muted)",fontStyle:"italic",marginTop:2,lineHeight:1.45}}>{scan.notes}</div>
          )}
          {scan.low_confidence && <div style={{fontSize:9,color:"var(--amber)",marginTop:3}}>⚠️ Verify with your doctor</div>}
        </div>
        {scan._rxDoctor && (
          <div style={{fontSize:9,color:"var(--muted)",flexShrink:0,textAlign:"right",lineHeight:1.4,maxWidth:70,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
            {scan._rxDoctor}
          </div>
        )}
      </div>

      {/* Scheduled: upload + mark done + remove */}
      {!isCompleted && (
        <div style={{display:"flex",gap:8,marginTop:10}}>
          <button onClick={() => onAction(scan, "upload")}
            style={{flex:1,padding:"8px",background:"var(--navy)",border:"none",borderRadius:100,fontSize:11,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>
            Upload
          </button>
          <button onClick={() => onAction(scan, "markDone")}
            style={{flex:1,padding:"8px",background:"transparent",border:"1.5px solid var(--navy-bdr)",borderRadius:100,fontSize:11,color:"var(--navy)",cursor:"pointer",fontFamily:"inherit"}}>
            Mark done
          </button>
          <button onClick={() => onAction(scan, "remove")}
            style={{flex:1,padding:"8px",background:"var(--rose-pale)",border:"1px solid var(--rose-bdr)",borderRadius:100,fontSize:11,fontWeight:600,color:"var(--rose)",cursor:"pointer",fontFamily:"inherit"}}>
            Remove
          </button>
        </div>
      )}

      {/* Done but no report yet: upload + remove */}
      {isCompleted && !hasReport && (
        <div style={{display:"flex",gap:8,marginTop:10}}>
          <button onClick={() => onAction(scan, "upload")}
            style={{flex:2,padding:"8px",background:"var(--navy)",border:"none",borderRadius:100,fontSize:11,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>
            Upload report
          </button>
          <button onClick={() => onAction(scan, "remove")}
            style={{flex:1,padding:"8px",background:"var(--rose-pale)",border:"1px solid var(--rose-bdr)",borderRadius:100,fontSize:11,fontWeight:600,color:"var(--rose)",cursor:"pointer",fontFamily:"inherit"}}>
            Remove
          </button>
        </div>
      )}

      {/* Report uploaded: view report + remove */}
      {hasReport && (
        <div style={{display:"flex",gap:8,marginTop:10}}>
          <button onClick={() => onAction(scan, "viewReport")}
            style={{flex:2,padding:"8px",background:"transparent",border:"1.5px solid var(--navy-bdr)",borderRadius:100,fontSize:11,fontWeight:600,color:"var(--navy)",cursor:"pointer",fontFamily:"inherit"}}>
            View report →
          </button>
          <button onClick={() => onAction(scan, "remove")}
            style={{flex:1,padding:"8px",background:"var(--rose-pale)",border:"1px solid var(--rose-bdr)",borderRadius:100,fontSize:11,fontWeight:600,color:"var(--rose)",cursor:"pointer",fontFamily:"inherit"}}>
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── SCAN REPORT SHEET ──────────────────────────────────────────────────── */
function ScanReportSheet({ scan, onClose }) {
  const [vis,       setVis]       = useState(false);
  const [signedUrl, setSignedUrl] = useState(null);

  useEffect(() => {
    requestAnimationFrame(() => setVis(true));
    if (scan.image_url) {
      authFetch("/api/storage/signed-url", {
        method: "POST",
        body: JSON.stringify({ file_url: scan.image_url }),
      }).then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.signedUrl) setSignedUrl(d.signedUrl); })
        .catch(() => {});
    }
  }, [scan.image_url]);

  const close = () => { setVis(false); setTimeout(onClose, 350); };

  const f = scan.findings || {};
  const dateLabel = scan.date
    ? new Date(scan.date).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })
    : scan.week || null;

  const metrics = [
    f.heartbeat_bpm    && { label:"Heartbeat",  value:`${f.heartbeat_bpm} bpm` },
    f.position         && { label:"Position",   value:f.position },
    f.fluid_level      && { label:"Fluid",      value:f.fluid_level },
    f.nt_measurement != null && { label:"NT",   value:`${f.nt_measurement} mm` },
    f.weight_grams     && { label:"Weight",     value:`${Math.round(f.weight_grams)} g` },
    f.crl_mm           && { label:"CRL",        value:`${f.crl_mm} mm` },
    f.placenta_position && { label:"Placenta",  value:f.placenta_position },
  ].filter(Boolean);

  const downloadFile = async () => {
    if (!signedUrl) return;
    try {
      const resp  = await fetch(signedUrl);
      const blob  = await resp.blob();
      const burl  = URL.createObjectURL(blob);
      const a     = document.createElement("a");
      a.href      = burl;
      a.download  = `scan-${(scan.type || "report").replace(/\s+/g, "-")}-${scan.date || "unknown"}`;
      a.click();
      URL.revokeObjectURL(burl);
    } catch { window.open(signedUrl, "_blank"); }
  };

  return (
    <>
      <div style={{position:"fixed",inset:0,zIndex:700,background:vis?"rgba(16,10,8,0.78)":"rgba(16,10,8,0)",transition:"background 0.3s",pointerEvents:vis?"all":"none"}} onClick={close}/>
      <div onClick={e=>e.stopPropagation()} style={{position:"fixed",bottom:0,left:0,right:0,width:"100%",maxWidth:430,margin:"0 auto",zIndex:701,background:"var(--cream)",borderRadius:"28px 28px 0 0",transform:`translateY(${vis?0:102}%)`,transition:"transform 0.36s cubic-bezier(0.3,0.72,0,1)",maxHeight:"88vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>

        {/* Header */}
        <div style={{padding:"20px 20px 14px",display:"flex",alignItems:"flex-start",justifyContent:"space-between",borderBottom:"1px solid var(--bdr)",flexShrink:0}}>
          <div>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color:"var(--navy)",marginBottom:4}}>Scan Report</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"var(--ink)",lineHeight:1.2}}>{scan.type || "Scan"}</div>
            {dateLabel && <div style={{fontSize:11,color:"var(--muted)",marginTop:3}}>{dateLabel}</div>}
          </div>
          <button onClick={close} style={{width:34,height:34,borderRadius:"50%",background:"var(--cream2)",border:"none",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--muted)",fontFamily:"inherit"}}>✕</button>
        </div>

        {/* Body */}
        <div style={{overflowY:"auto",padding:"18px 20px 40px",scrollbarWidth:"none",flex:1}}>

          {/* AI summary */}
          {scan.ai_summary && (
            <div style={{background:"var(--navy-pale)",border:"1px solid var(--navy-bdr)",borderRadius:14,padding:"14px 16px",fontSize:13,color:"var(--ink)",lineHeight:1.65,marginBottom:16,fontStyle:"italic"}}>
              "{scan.ai_summary}"
            </div>
          )}

          {/* View / download */}
          {signedUrl && (
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              <a href={signedUrl} target="_blank" rel="noopener noreferrer"
                style={{flex:1,padding:"11px",background:"var(--navy-pale)",border:"1px solid var(--navy-bdr)",borderRadius:14,fontSize:12,fontWeight:600,color:"var(--navy)",display:"flex",alignItems:"center",justifyContent:"center",gap:6,textDecoration:"none"}}>
                👁 View original
              </a>
              <button onClick={downloadFile}
                style={{flex:1,padding:"11px",background:"var(--navy)",border:"none",borderRadius:14,fontSize:12,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                ⬇ Download
              </button>
            </div>
          )}

          {/* Key metrics */}
          {metrics.length > 0 && (
            <div style={{marginBottom:16}}>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:"var(--navy)",marginBottom:10}}>Key measurements</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {metrics.map((m, i) => (
                  <div key={i} style={{background:"var(--navy-pale)",border:"1px solid var(--navy-bdr)",borderRadius:12,padding:"10px 14px"}}>
                    <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--navy)",opacity:0.7,marginBottom:3}}>{m.label}</div>
                    <div style={{fontSize:14,fontWeight:600,color:"var(--ink)",textTransform:"capitalize"}}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Doctor notes from report */}
          {f.notes && (
            <div style={{background:"var(--slate-pale)",border:"1px solid var(--slate-bdr)",borderRadius:12,padding:"12px 14px",fontSize:12,color:"var(--ink)",lineHeight:1.65}}>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",color:"var(--muted)",marginBottom:6}}>Notes</div>
              {f.notes}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── SCAN INSIGHTS SHEET ────────────────────────────────────────────────── */
function ScanInsightsSheet({ scans, onClose, onUpload }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setVis(true)); }, []);
  const close = () => { setVis(false); setTimeout(onClose, 350); };

  const completed = [...scans.filter(s => s.status === "completed")]
    .sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date) - new Date(b.date);
    });

  const latest = completed[completed.length - 1];

  const timeline = key => completed
    .filter(s => s.findings?.[key] != null)
    .map(s => ({
      value: s.findings[key],
      label: s.date
        ? new Date(s.date).toLocaleDateString("en-IN", { day:"numeric", month:"short" })
        : (s.week || s.type?.split(" ")[0] || "—"),
    }));

  const heartbeats  = timeline("heartbeat_bpm");
  const weights     = timeline("weight_grams").map(d => ({ ...d, value: Math.round(d.value) }));
  const crls        = timeline("crl_mm");
  const nts         = timeline("nt_measurement");
  const fluids      = timeline("fluid_level");
  const positions   = timeline("position");

  // Read-only timeline row for scan metrics (reuses lab-timeline CSS classes)
  const ScanMetricTimeline = ({ name, unit, data, range }) => {
    if (!data.length) return null;
    const latest = data.at(-1);
    const isLow  = range && latest.value < range[0];
    const isHigh = range && latest.value > range[1];
    const status = !range ? null : isLow ? "low" : isHigh ? "high" : "normal";
    const trend  = data.length >= 2
      ? data.at(-1).value > data.at(-2).value ? "↑"
      : data.at(-1).value < data.at(-2).value ? "↓" : "→"
      : null;
    return (
      <div className="lab-timeline-row">
        <div className="lab-timeline-header">
          <span>
            <span className="lab-timeline-name">{name}</span>
            {unit && <span className="lab-timeline-unit">({unit})</span>}
          </span>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            {status && (
              <span className="lab-timeline-status" style={{
                background: status==="normal" ? "var(--teal-pale)" : "var(--rose-pale)",
                color:      status==="normal" ? "var(--forest)"    : "var(--rose)",
              }}>
                {status==="normal" ? "✓ Normal" : `⚠️ ${status==="low"?"Low":"High"}`}
              </span>
            )}
            {trend && <span style={{fontSize:14,color:!status||status==="normal"?"var(--navy)":"var(--rose)"}}>{trend}</span>}
          </div>
        </div>
        <div className="lab-timeline-scroll">
          {data.map((d, i) => {
            const lo = range && d.value < range[0];
            const hi = range && d.value > range[1];
            return (
              <div key={i} className="lab-timeline-entry">
                <div className="lab-timeline-dot" style={{
                  background:   lo||hi ? "var(--rose-pale)" : "var(--navy-pale)",
                  borderColor:  lo||hi ? "var(--rose)"      : "var(--navy)",
                  color:        lo||hi ? "var(--rose)"      : "var(--navy)",
                }}>
                  <span style={{fontSize:8,textTransform:"capitalize"}}>{typeof d.value === "number" ? d.value : d.value?.slice(0,3)}</span>
                </div>
                <div className="lab-timeline-val" style={{textTransform:"capitalize"}}>{d.value}</div>
                <div className="lab-timeline-date">{d.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const hasAnyData = heartbeats.length || weights.length || positions.length || fluids.length || nts.length || crls.length;

  return (
    <>
      <div style={{position:"fixed",inset:0,zIndex:700,background:vis?"rgba(16,10,8,0.78)":"rgba(16,10,8,0)",transition:"background 0.3s",pointerEvents:vis?"all":"none"}} onClick={close}/>
      <div onClick={e=>e.stopPropagation()} style={{position:"fixed",bottom:0,left:0,right:0,width:"100%",maxWidth:430,margin:"0 auto",zIndex:701,background:"var(--cream)",borderRadius:"28px 28px 0 0",transform:`translateY(${vis?0:102}%)`,transition:"transform 0.36s cubic-bezier(0.3,0.72,0,1)",maxHeight:"88vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>

        <div style={{padding:"20px 20px 14px",display:"flex",alignItems:"flex-start",justifyContent:"space-between",borderBottom:"1px solid var(--bdr)",flexShrink:0}}>
          <div>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color:"var(--navy)",marginBottom:4}}>Scan Insights</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"var(--ink)",lineHeight:1.2}}>Across all <em>scans</em></div>
            <div style={{fontSize:11,color:"var(--muted)",marginTop:3}}>{completed.length} scan{completed.length !== 1 ? "s" : ""} completed</div>
          </div>
          <button onClick={close} style={{width:34,height:34,borderRadius:"50%",background:"var(--cream2)",border:"none",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--muted)",fontFamily:"inherit"}}>✕</button>
        </div>

        <div style={{overflowY:"auto",padding:"18px 20px 40px",scrollbarWidth:"none",flex:1}}>

          {/* Upload button */}
          <button onClick={() => { close(); setTimeout(onUpload, 380); }}
            style={{width:"100%",padding:"12px 16px",background:"rgba(96,144,200,0.08)",border:"1px solid rgba(96,144,200,0.18)",borderRadius:14,fontSize:13,fontWeight:600,color:"rgba(96,144,200,0.85)",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
            <span style={{fontSize:17}}>📎</span>
            <span style={{flex:1,textAlign:"left"}}>Upload more scans</span>
            <span style={{opacity:0.5,fontSize:14}}>→</span>
          </button>

          {/* ── LATEST RESULTS ── */}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",color:"var(--muted)",marginBottom:10}}>Latest results</div>
            {hasAnyData ? (
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {[
                  { key:"heartbeat_bpm", label:"Heartbeat",    unit:"bpm",  range:null },
                  { key:"weight_grams",  label:"Baby weight",  unit:"g",    range:null, fmt: v => Math.round(v) },
                  { key:"nt_measurement",label:"NT",           unit:"mm",   range:[0,3.5] },
                  { key:"crl_mm",        label:"CRL",          unit:"mm",   range:null },
                ].map(({ key, label, unit, range, fmt }) => {
                  const entries = completed.filter(s => s.findings?.[key] != null);
                  if (!entries.length) return null;
                  const latest = entries.at(-1);
                  const raw    = latest.findings[key];
                  const val    = fmt ? fmt(raw) : raw;
                  const isLow  = range && raw < range[0];
                  const isHigh = range && raw > range[1];
                  const status = !range ? null : isLow ? "low" : isHigh ? "high" : "normal";
                  const prev   = entries.length >= 2 ? entries.at(-2).findings[key] : null;
                  const trend  = prev != null ? (raw > prev ? "↑" : raw < prev ? "↓" : "→") : null;
                  return (
                    <div key={key} style={{background:"#fff",border:"1px solid var(--bdr)",borderRadius:14,padding:"11px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div>
                        <div style={{fontSize:10,color:"var(--muted)",marginBottom:2}}>{label}</div>
                        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"var(--ink)"}}>
                          {val}<span style={{fontSize:10,color:"var(--muted)",fontFamily:"inherit",marginLeft:3}}>{unit}</span>
                        </div>
                        <div style={{fontSize:9,color:"var(--muted)",marginTop:1}}>
                          {latest.date ? new Date(latest.date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : latest.week || latest.type}
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        {trend && <span style={{fontSize:16,color:status==="normal"||!status?"var(--navy)":"var(--rose)"}}>{trend}</span>}
                        {status && (
                          <span style={{fontSize:9,fontWeight:700,padding:"3px 8px",borderRadius:100,textTransform:"uppercase",letterSpacing:"0.1em",
                            background:status==="normal"?"var(--teal-pale)":"var(--rose-pale)",
                            color:status==="normal"?"var(--teal)":"var(--rose)",
                            border:`1px solid ${status==="normal"?"var(--teal-bdr)":"var(--rose-bdr)"}`}}>
                            {status==="normal"?"✓ Normal":`⚠️ ${status==="low"?"Low":"High"}`}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {latest?.ai_summary && (
                  <div style={{background:"var(--navy-pale)",border:"1px solid var(--navy-bdr)",borderRadius:14,padding:"12px 14px",fontSize:12,color:"var(--ink)",lineHeight:1.65,fontStyle:"italic"}}>
                    "{latest.ai_summary}"
                    {latest.type && <div style={{fontSize:9,color:"var(--muted)",fontStyle:"normal",marginTop:4,fontWeight:500}}>— {latest.type}</div>}
                  </div>
                )}
              </div>
            ) : (
              <div style={{background:"linear-gradient(135deg,#0d1e2d,#1a2d3a,#0f1e28)",borderRadius:16,padding:"20px 18px 22px",position:"relative",overflow:"hidden"}}>
                <svg style={{position:"absolute",right:-10,bottom:-15,width:150,height:150,opacity:0.07,transform:"rotate(10deg)",color:"#fff"}} viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <ellipse cx="50" cy="50" rx="42" ry="30" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <ellipse cx="50" cy="50" rx="28" ry="18" stroke="currentColor" strokeWidth="3" fill="none"/>
                  <ellipse cx="50" cy="50" rx="14" ry="8" stroke="currentColor" strokeWidth="2.5" fill="none"/>
                  <circle cx="50" cy="50" r="4"/>
                  <path d="M15 50 Q30 20 50 50 Q70 80 85 50" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                </svg>
                <div style={{position:"relative",zIndex:1}}>
                  <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:"rgba(100,180,255,0.7)",marginBottom:7}}>Tracked over time</div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:"#fff",lineHeight:1.3,marginBottom:8}}>
                    See baby's <em style={{color:"rgba(100,180,255,0.85)"}}>growth.</em>
                  </div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,0.45)",lineHeight:1.75,marginBottom:12}}>
                    Upload scan reports and Matri tracks heartbeat, weight, position and fluid level across every scan.
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {["💓 Heartbeat","⚖️ Baby weight","📍 Position","💧 Fluid level"].map(t => (
                      <span key={t} style={{fontSize:10,fontWeight:600,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:100,padding:"3px 10px",color:"rgba(255,255,255,0.55)"}}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── KEY VARIABLES ── */}
          <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",color:"var(--muted)",marginBottom:10}}>Key variables</div>
          {hasAnyData ? (
            <>
              <ScanMetricTimeline name="Heartbeat"     unit="bpm" data={heartbeats} />
              <ScanMetricTimeline name="Baby weight"   unit="g"   data={weights} />
              <ScanMetricTimeline name="CRL"           unit="mm"  data={crls} />
              <ScanMetricTimeline name="NT measurement" unit="mm" data={nts} range={[0, 3.5]} />
              <ScanMetricTimeline name="Baby position"            data={positions} />
              <ScanMetricTimeline name="Fluid level"              data={fluids} warn={v => v === "low" || v === "high"} />
            </>
          ) : (
            <div style={{background:"var(--navy-pale)",border:"1px solid var(--navy-bdr)",borderRadius:14,padding:"14px 16px"}}>
              <div style={{fontSize:11,color:"var(--muted)",lineHeight:1.65}}>Upload scan reports to see heartbeat, weight, position and fluid level tracked as timelines here.</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── SCANS CONTENT ──────────────────────────────────────────────────────── */
function ScansContent({ scans, onAction, onViewInsights }) {
  const hasCompleted = scans.some(s => s.status === "completed");

  if (!scans.length) {
    return (
      <div style={{background:"var(--navy-pale)",border:"1px solid var(--navy-bdr)",borderRadius:12,padding:"14px 16px",textAlign:"center"}}>
        <div style={{fontSize:22,opacity:0.4,marginBottom:6}}>🔬</div>
        <div style={{fontSize:12,color:"var(--muted)",lineHeight:1.65}}>Scan dates advised by your doctor will appear here when you upload a prescription.</div>
      </div>
    );
  }
  return (
    <div>
      {hasCompleted && (
        <button onClick={onViewInsights}
          style={{width:"100%",padding:"12px 16px",background:"rgba(96,144,200,0.08)",border:"1px solid rgba(96,144,200,0.18)",borderRadius:16,fontSize:13,fontWeight:600,color:"rgba(96,144,200,0.85)",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
          <span style={{fontSize:17}}>📊</span>
          <div style={{flex:1,textAlign:"left"}}>
            <div>View scan insights</div>
            <div style={{fontSize:11,fontWeight:400,color:"rgba(96,144,200,0.6)",marginTop:1}}>
              {scans.filter(s=>s.status==="completed").length} done · trends &amp; measurements
            </div>
          </div>
          <span style={{opacity:0.5,fontSize:14}}>→</span>
        </button>
      )}
      {scans.map((scan, i) => <ScanCard key={scan.id || i} scan={scan} onAction={onAction} />)}
    </div>
  );
}

/* ─── SCAN ACTION SHEET ──────────────────────────────────────────────────── */
function ScanActionSheet({ scan, onComplete, onClose }) {
  const [vis,     setVis]     = useState(false);
  const [file,    setFile]    = useState(null);
  const [step,    setStep]    = useState("upload"); // upload | confirm
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState(null);
  const fileRef = useRef();

  useEffect(() => { requestAnimationFrame(() => setVis(true)); }, []);
  const close = () => { setVis(false); setTimeout(onClose, 350); };

  const upload = async () => {
    if (!file) return;
    setLoading(true); setError(null);
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const resp = await authFetch("/api/infer", {
        method: "POST",
        body: JSON.stringify({ type:"scan", fileBase64:base64, mimeType:file.type, fileName:file.name, scan_id:scan.id }),
      });
      if (!resp.ok) throw new Error("Server error");
      const data = await resp.json();
      setResult(data.parsed);
      setStep("confirm");
    } catch {
      setError("Couldn't read the scan report. Try a clearer photo.");
    }
    setLoading(false);
  };

  const f = result?.findings || {};
  const dateLabel = scan.date
    ? new Date(scan.date).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })
    : scan.week || null;
  const findingChips = [
    f.heartbeat_bpm && `Heartbeat: ${f.heartbeat_bpm} bpm`,
    f.position       && `Baby: ${f.position}`,
    f.fluid_level    && `Fluid: ${f.fluid_level}`,
    f.nt_measurement != null && `NT: ${f.nt_measurement}mm`,
    f.weight_grams   && `Weight: ${Math.round(f.weight_grams)}g`,
    f.crl_mm         && `CRL: ${f.crl_mm}mm`,
    f.placenta_position && `Placenta: ${f.placenta_position}`,
  ].filter(Boolean);

  return (
    <>
      <div className={`pedit-backdrop${vis?" open":""}`} onClick={close}/>
      <div className={`pedit-sheet${vis?" open":""}`} style={{maxHeight:"88vh",overflowY:"auto"}}>
        <div className="pedit-handle"/>

        {step === "upload" && <>
          <div className="pedit-title">Upload <em>scan report</em></div>
          <div style={{fontSize:12,color:"var(--muted)",marginBottom:16,lineHeight:1.6}}>
            {scan.type || "Scan"}{dateLabel ? ` · ${dateLabel}` : ""}
          </div>

          <div
            style={{border:`2px dashed ${file?"var(--navy)":"var(--bdr)"}`,borderRadius:16,padding:24,textAlign:"center",cursor:"pointer",background:file?"var(--navy-pale)":"#fff",marginBottom:16,transition:"all 0.2s"}}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{display:"none"}} onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); }}/>
            {file ? <>
              <div style={{fontSize:24,marginBottom:6}}>📄</div>
              <div style={{fontSize:13,fontWeight:600,color:"var(--navy)"}}>{file.name}</div>
              <div style={{fontSize:11,color:"var(--muted)",marginTop:4}}>Tap to change</div>
            </> : <>
              <div style={{fontSize:24,marginBottom:6}}>🔬</div>
              <div style={{fontSize:13,fontWeight:600,color:"var(--ink)"}}>Attach scan report</div>
              <div style={{fontSize:11,color:"var(--muted)",marginTop:4}}>Photo or PDF</div>
            </>}
          </div>

          {error && <div style={{fontSize:12,color:"var(--rose)",marginBottom:12,textAlign:"center"}}>{error}</div>}

          {loading ? (
            <div style={{textAlign:"center",padding:"18px 0 6px"}}>
              <div style={{width:36,height:36,border:"3px solid var(--navy-pale)",borderTopColor:"var(--navy)",borderRadius:"50%",animation:"spin 0.85s linear infinite",margin:"0 auto 14px"}}/>
              <div style={{fontSize:14,fontWeight:600,color:"var(--ink)",marginBottom:6}}>Reading scan report…</div>
              <div style={{fontSize:12,color:"var(--muted)"}}>Extracting findings and measurements.</div>
            </div>
          ) : (
            <button onClick={upload} disabled={!file}
              style={{width:"100%",padding:"14px",background:"var(--navy)",border:"none",borderRadius:100,fontSize:15,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit",opacity:!file?0.5:1}}>
              🔬 Read scan report
            </button>
          )}
        </>}

        {step === "confirm" && result && <>
          <div className="pedit-title">Scan <em>findings</em></div>
          {result.summary && (
            <div style={{background:"var(--navy-pale)",border:"1px solid var(--navy-bdr)",borderRadius:14,padding:"14px 16px",fontSize:13,color:"var(--ink)",lineHeight:1.65,marginBottom:16,fontStyle:"italic"}}>
              "{result.summary}"
            </div>
          )}
          {findingChips.length > 0 && (
            <div style={{marginBottom:16}}>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",color:"var(--navy)",marginBottom:8}}>Key findings</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {findingChips.map((c, i) => (
                  <span key={i} style={{fontSize:11,background:"var(--navy-pale)",border:"1px solid var(--navy-bdr)",borderRadius:100,padding:"5px 12px",color:"var(--navy)",fontWeight:500}}>{c}</span>
                ))}
              </div>
            </div>
          )}
          {f.notes && (
            <div style={{background:"var(--slate-pale)",border:"1px solid var(--slate-bdr)",borderRadius:12,padding:"12px 14px",fontSize:12,color:"var(--ink)",lineHeight:1.6,marginBottom:16}}>
              {f.notes}
            </div>
          )}
          <div style={{display:"flex",gap:10,marginTop:8}}>
            <button onClick={() => setStep("upload")} style={{flex:1,padding:"13px",background:"transparent",border:"1.5px solid var(--bdr)",borderRadius:100,fontSize:14,cursor:"pointer",fontFamily:"inherit",color:"var(--muted)"}}>Re-upload</button>
            <button onClick={() => { onComplete(); close(); }} style={{flex:2,padding:"13px",background:"var(--teal)",border:"none",borderRadius:100,fontSize:14,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>Save ✓</button>
          </div>
        </>}
      </div>
    </>
  );
}

/* ─── LAB INSIGHTS SHEET ─────────────────────────────────────────────────── */
function LabInsightsSheet({ labData: initLabData = {}, labExtras: initLabExtras = {}, onClose, onDataChange }) {
  const [vis,        setVis]        = useState(false);
  const [labData,    setLabData]    = useState(initLabData);
  const [extras,     setExtras]     = useState(initLabExtras);
  const [uploading,  setUploading]  = useState(false);
  const [inferred,   setInferred]   = useState(null);
  const [inferError, setInferError] = useState(null);
  const fileRef = useRef();

  // Always load fresh lab data from Supabase on mount — props may be stale.
  // Also trigger a context rebuild so health_insights reflects current lab values.
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase.from("profiles").select("lab_data, lab_extras_v2").eq("id", user.id).single();
      if (prof?.lab_data)      setLabData(prof.lab_data);
      if (prof?.lab_extras_v2) setExtras(prof.lab_extras_v2);
      onDataChange?.();
    })();
  }, []);

  useEffect(() => { requestAnimationFrame(() => setVis(true)); }, []);
  const close = () => { setVis(false); setTimeout(onClose, 350); };

  const CORE = [
    { key:"hemoglobin",          label:"Haemoglobin",     unit:"g/dL",  range:[11,14]  },
    { key:"tsh",                 label:"TSH",              unit:"mIU/L", range:[0.1,4]  },
    { key:"blood_sugar_fasting", label:"Blood Sugar (F)",  unit:"mg/dL", range:[70,95]  },
    { key:"blood_sugar_pp",      label:"Blood Sugar (PP)", unit:"mg/dL", range:[70,140] },
  ];

  const persist = async (newLabData, newExtras) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({ lab_data: newLabData, lab_extras_v2: newExtras }).eq("id", user.id);
  };

  const addEntry = (key, entry) => {
    const updated = { ...labData, [key]: [...(labData[key]||[]), entry].sort((a,b)=>a.date.localeCompare(b.date)) };
    setLabData(updated);
    persist(updated, extras);
  };

  const removeEntry = (key, idx) => {
    const updated = { ...labData, [key]: (labData[key]||[]).filter((_,i)=>i!==idx) };
    setLabData(updated);
    persist(updated, extras).then(() => onDataChange?.());
  };

  const addExtraEntry = (name, entry) => {
    const newExtras = { ...extras, [name]: { ...extras[name], entries: [...(extras[name]?.entries||[]), entry].sort((a,b)=>a.date.localeCompare(b.date)) } };
    setExtras(newExtras);
    persist(labData, newExtras);
  };

  const removeExtraEntry = (name, idx) => {
    const remaining = (extras[name]?.entries||[]).filter((_,i)=>i!==idx);
    const newExtras = remaining.length
      ? { ...extras, [name]: { ...extras[name], entries: remaining } }
      : (() => { const { [name]: _, ...rest } = extras; return rest; })();
    setExtras(newExtras);
    persist(labData, newExtras).then(() => onDataChange?.());
  };

  const handleUpload = async (file) => {
    setUploading(true); setInferError(null); setInferred(null);
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.onerror = rej; r.readAsDataURL(file);
      });
      const resp = await authFetch("/api/infer", {
        method: "POST",
        body: JSON.stringify({ type:"lab_report", fileBase64:base64, mimeType:file.type, fileName:file.name }),
      });
      if (!resp.ok) throw new Error("Failed");
      const data = await resp.json();
      setInferred(data.parsed?.summary || null);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: prof } = await supabase.from("profiles").select("lab_data, lab_extras_v2").eq("id", user.id).single();
        if (prof?.lab_data)      setLabData(prof.lab_data);
        if (prof?.lab_extras_v2) setExtras(prof.lab_extras_v2);
      }
    } catch { setInferError("Couldn't read the report. Try a clearer photo."); }
    setUploading(false);
  };

  return (
    <>
      <div style={{position:"fixed",inset:0,zIndex:700,background:vis?"rgba(16,10,8,0.78)":"rgba(16,10,8,0)",transition:"background 0.3s",pointerEvents:vis?"all":"none"}} onClick={close}/>
      <div onClick={e=>e.stopPropagation()} style={{position:"fixed",bottom:0,left:0,right:0,width:"100%",maxWidth:430,margin:"0 auto",zIndex:701,background:"var(--cream)",borderRadius:"28px 28px 0 0",transform:`translateY(${vis?0:102}%)`,transition:"transform 0.36s cubic-bezier(0.3,0.72,0,1)",maxHeight:"88vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>

        <div style={{padding:"20px 20px 14px",display:"flex",alignItems:"flex-start",justifyContent:"space-between",borderBottom:"1px solid var(--bdr)",flexShrink:0}}>
          <div>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color:"var(--teal)",marginBottom:4}}>Lab Insights</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"var(--ink)",lineHeight:1.2}}>Across all <em>results</em></div>
            <div style={{fontSize:11,color:"var(--muted)",marginTop:3}}>
              {CORE.filter(c=>(labData[c.key]||[]).length>0).length} tests tracked
            </div>
          </div>
          <button onClick={close} style={{width:34,height:34,borderRadius:"50%",background:"var(--cream2)",border:"none",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--muted)",fontFamily:"inherit"}}>✕</button>
        </div>

        <div style={{overflowY:"auto",padding:"18px 20px 40px",scrollbarWidth:"none",flex:1}}>

          {/* Upload section */}
          <div style={{marginBottom:20}}>
            <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{display:"none"}}
              onChange={e=>{const f=e.target.files?.[0];if(f)handleUpload(f);e.target.value="";}}/>
            {uploading ? (
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",background:"var(--teal-pale)",border:"1px solid var(--teal-bdr)",borderRadius:14}}>
                <div style={{width:16,height:16,border:"2px solid var(--teal-pale)",borderTopColor:"var(--teal)",borderRadius:"50%",animation:"spin 0.85s linear infinite",flexShrink:0}}/>
                <span style={{fontSize:12,color:"var(--teal)"}}>Reading your lab report…</span>
              </div>
            ) : (
              <button onClick={()=>fileRef.current?.click()}
                style={{width:"100%",padding:"12px 16px",background:"rgba(96,144,200,0.08)",border:"1px solid rgba(96,144,200,0.18)",borderRadius:14,fontSize:13,fontWeight:600,color:"rgba(96,144,200,0.85)",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:17}}>📎</span>
                <span style={{flex:1,textAlign:"left"}}>Upload lab report</span>
                <span style={{opacity:0.5,fontSize:14}}>→</span>
              </button>
            )}
            {inferred && (
              <div style={{marginTop:8,background:"var(--teal-pale)",border:"1px solid var(--teal-bdr)",borderRadius:12,padding:"10px 14px",fontSize:12,color:"var(--ink)",lineHeight:1.6,fontStyle:"italic"}}>
                "{inferred}"
              </div>
            )}
            {inferError && <div style={{marginTop:6,fontSize:11,color:"var(--rose)",textAlign:"center"}}>{inferError}</div>}
          </div>

          {/* Insights overview */}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",color:"var(--muted)",marginBottom:10}}>Latest results</div>
            {CORE.some(c => (labData[c.key]||[]).length > 0) ? (
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {CORE.filter(c => (labData[c.key]||[]).length > 0).map(c => {
                  const entries = labData[c.key] || [];
                  const latest  = entries.at(-1);
                  const isLow   = c.range && latest.value < c.range[0];
                  const isHigh  = c.range && latest.value > c.range[1];
                  const status  = isLow ? "low" : isHigh ? "high" : "normal";
                  const trend   = entries.length >= 2
                    ? entries.at(-1).value > entries.at(-2).value ? "↑"
                    : entries.at(-1).value < entries.at(-2).value ? "↓" : "→"
                    : null;
                  return (
                    <div key={c.key} style={{background:"#fff",border:"1px solid var(--bdr)",borderRadius:14,padding:"11px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div>
                        <div style={{fontSize:10,color:"var(--muted)",marginBottom:2}}>{c.label}</div>
                        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"var(--ink)"}}>
                          {latest.value}<span style={{fontSize:10,color:"var(--muted)",fontFamily:"inherit",marginLeft:3}}>{c.unit}</span>
                        </div>
                        <div style={{fontSize:9,color:"var(--muted)",marginTop:1}}>{new Date(latest.date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        {trend && <span style={{fontSize:16,color:status==="normal"?"var(--teal)":"var(--rose)"}}>{trend}</span>}
                        <span style={{fontSize:9,fontWeight:700,padding:"3px 8px",borderRadius:100,textTransform:"uppercase",letterSpacing:"0.1em",
                          background:status==="normal"?"var(--teal-pale)":"var(--rose-pale)",
                          color:status==="normal"?"var(--teal)":"var(--rose)",
                          border:`1px solid ${status==="normal"?"var(--teal-bdr)":"var(--rose-bdr)"}`}}>
                          {status==="normal"?"✓ Normal":`⚠️ ${status==="low"?"Low":"High"}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{background:"linear-gradient(135deg,#0d2d2a,#1a3d38,#0f2820)",borderRadius:16,padding:"20px 18px 22px",position:"relative",overflow:"hidden"}}>
                {/* Syringe watermark */}
                <svg style={{position:"absolute",right:-18,bottom:-22,width:170,height:170,opacity:0.07,transform:"rotate(-25deg)",color:"#fff"}} viewBox="0 0 80 200" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="40,0 44,28 36,28"/>
                  <rect x="29" y="28" width="22" height="9" rx="3"/>
                  <rect x="24" y="37" width="32" height="102" rx="7"/>
                  <rect x="24" y="50" width="9" height="3" rx="1"/>
                  <rect x="24" y="63" width="6" height="3" rx="1"/>
                  <rect x="24" y="76" width="9" height="3" rx="1"/>
                  <rect x="24" y="89" width="6" height="3" rx="1"/>
                  <rect x="24" y="102" width="9" height="3" rx="1"/>
                  <rect x="24" y="115" width="6" height="3" rx="1"/>
                  <rect x="21" y="139" width="38" height="11" rx="5"/>
                  <rect x="36" y="150" width="8" height="32" rx="2"/>
                  <rect x="21" y="182" width="38" height="9" rx="4"/>
                  <rect x="25" y="175" width="8" height="9" rx="2"/>
                  <rect x="47" y="175" width="8" height="9" rx="2"/>
                </svg>

                <div style={{position:"relative",zIndex:1}}>
                  <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:"rgba(80,220,190,0.7)",marginBottom:7}}>AI-powered tracking</div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:19,color:"#fff",lineHeight:1.25,marginBottom:8}}>
                    Know your <em style={{color:"rgba(80,220,190,0.85)"}}>numbers.</em>
                  </div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,0.45)",lineHeight:1.75,marginBottom:14}}>
                    Upload a report — Matri reads HB, TSH, and blood sugar automatically, then tracks them across every visit.
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {["📈 Trends over time","⚠️ Flags abnormals","🤰 Pregnancy ranges"].map(t => (
                      <span key={t} style={{fontSize:10,fontWeight:600,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:100,padding:"3px 10px",color:"rgba(255,255,255,0.55)"}}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Key variables */}
          <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",color:"var(--muted)",marginBottom:10}}>Key variables</div>
          {CORE.map(c => (
            <LabTimelineRow
              key={c.key}
              name={c.label}
              unit={c.unit}
              entries={labData[c.key] || []}
              normalRange={c.range}
              onAdd={entry => addEntry(c.key, entry)}
              onRemove={idx => removeEntry(c.key, idx)}
            />
          ))}
          {Object.entries(extras).filter(([,d])=>d?.entries?.length>0).map(([name,d]) => (
            <LabTimelineRow
              key={name}
              name={name}
              unit={d.unit||""}
              entries={d.entries||[]}
              normalRange={null}
              onAdd={entry => addExtraEntry(name, entry)}
              onRemove={idx => removeExtraEntry(name, idx)}
            />
          ))}
        </div>
      </div>
    </>
  );
}

/* ─── PMSMA FOOTER ───────────────────────────────────────────────────────── */
function PmsmaFooter() {
  return (
    <>
      <div className="india-chip" style={{marginTop:22}}>🇮🇳 PMSMA Scheme</div>
      <div style={{fontSize:13,lineHeight:1.65,marginBottom:14}}>
        Under <strong>Pradhan Mantri Surakshit Matritva Abhiyan</strong>, free antenatal checkups on the <strong>9th of every month</strong> at government health centres.
      </div>
      <div className="p-card pc-rose">
        <strong>Call your doctor immediately if:</strong> Heavy bleeding, severe abdominal pain, fever above 100.4°F, burning urination, or anything that feels wrong.
      </div>
    </>
  );
}

/* ─── MAIN HEALTH TAB ────────────────────────────────────────────────────── */
export default function HealthTab({ profileData, healthContext, onOpenProfile, onOpenLabsEditor, onUploadComplete, onRanOutChange, onDataChange, onCountsChange, requireConsent }) {
  const [loading,       setLoading]       = useState(true);
  const [prescriptions, setPrescriptions] = useState([]);
  const [medicines,     setMedicines]     = useState([]);
  const [scans,         setScans]         = useState([]);
  const [testReloadKey, setTestReloadKey] = useState(0);

  const [expanded,        setExpanded]        = useState(null); // "meds" | "scans" | "tests"
  const [showUpload,      setShowUpload]      = useState(false);
  const [detailRx,        setDetailRx]        = useState(null);
  const [testDetail,      setTestDetail]      = useState(null);
  const [editingMed,        setEditingMed]        = useState(null);
  const [activeScanUpload,  setActiveScanUpload]  = useState(null);
  const [activeReportView,  setActiveReportView]  = useState(null);
  const [showScanInsights,  setShowScanInsights]  = useState(false);
  const [showLabInsights,   setShowLabInsights]   = useState(false);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const SCAN_TYPE_LABELS = { nt:"NT Scan", anomaly:"Anomaly Scan", dating:"Dating Scan", growth:"Growth Scan", doppler:"Doppler Scan" };
      const normScanKey = t => {
        const l = (t || "").toLowerCase();
        if (l.includes("nt") || l.includes("nuchal")) return "nt";
        if (l.includes("anomaly") || l.includes("anatomy")) return "anomaly";
        if (l.includes("dating")) return "dating";
        if (l.includes("growth")) return "growth";
        if (l.includes("doppler")) return "doppler";
        return l.trim();
      };

      const [rxRes, medsRes, profRes, scansRes, testOrdersRes] = await Promise.all([
        supabase.from("prescriptions")
          .select("id, doctor_name, clinic_name, prescribed_date, follow_up_date, summary, medicine_count, test_count, scan_count, scan_dates, file_url")
          .eq("user_id", user.id)
          .order("prescribed_date", { ascending: false }),
        supabase.from("medicines")
          .select("*")
          .eq("user_id", user.id),
        supabase.from("profiles")
          .select("prescriptions")
          .eq("id", user.id)
          .single(),
        supabase.from("scans")
          .select("id, scan_type, scan_name, scan_date, week_number, ai_summary, findings, status, image_url, prescription_id")
          .eq("user_id", user.id)
          .order("scan_date", { ascending: true }),
        supabase.from("test_orders")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "ordered"),
      ]);

      const tableRx = rxRes.data || [];
      const profRx  = profRes.data?.prescriptions || [];

      // Merge: include JSONB entries not already present in the prescriptions table
      const tableIds = new Set(tableRx.map(r => r.id).filter(Boolean));
      const profOnlyRx = profRx.filter(rx => !rx.id || !tableIds.has(rx.id));
      const rxList = [...tableRx, ...profOnlyRx];

      setPrescriptions(rxList);
      const fetchedMeds = medsRes.data || [];
      setMedicines(fetchedMeds);
      onRanOutChange?.(fetchedMeds.filter(m => m.ran_out));

      // Primary: scans table (has id, status, findings for upload feature)
      const rxMap = new Map(tableRx.map(rx => [rx.id, rx]));
      const tableScans = (scansRes.data || []).map(s => ({
        id: s.id,
        type: s.scan_name || SCAN_TYPE_LABELS[s.scan_type] || "Scan",
        scan_type: s.scan_type,
        date: s.scan_date || null,
        week: s.week_number ? `Week ${s.week_number}` : null,
        notes: s.findings?.notes || null,
        ai_summary: s.ai_summary || null,
        status: s.status || "scheduled",
        findings: s.findings || {},
        image_url: s.image_url || null,
        _rxDoctor: s.prescription_id ? rxMap.get(s.prescription_id)?.doctor_name || null : null,
      }));

      // Legacy fallback: prescription scan_dates with no scans table row yet
      const tableScanKeys = new Set((scansRes.data || []).map(s => `${s.scan_type}_${s.scan_date || ""}`));
      const legacyScans = rxList.flatMap(rx =>
        (rx.scan_dates || [])
          .filter(s => !tableScanKeys.has(`${normScanKey(s.type)}_${s.date || ""}`))
          .map(s => ({
            type: s.type,
            scan_type: normScanKey(s.type),
            date: s.date || null,
            week: s.week || null,
            notes: s.notes || null,
            status: "scheduled",
            findings: {},
            _rxDoctor: rx.doctor_name || null,
          }))
      );

      const allScans = [...tableScans, ...legacyScans];
      setScans(allScans);

      const activeMedCount = (medsRes.data || []).filter(m => m.active !== false && !m.paused && !m.ran_out).length;
      onCountsChange?.({
        medicines: activeMedCount,
        tests:     (testOrdersRes.data || []).length,
        scans:     allScans.filter(s => s.status !== "completed").length,
      });
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const toggle = (section) => setExpanded(prev => prev === section ? null : section);

  const updateMedInProfile = async (userId, updater) => {
    const { data: prof } = await supabase.from("profiles").select("medications").eq("id", userId).single();
    const updated = (prof?.medications || []).map(m => {
      const pm = typeof m === "object" ? m : {};
      return updater(pm);
    });
    await supabase.from("profiles").update({ medications: updated }).eq("id", userId);
  };

  const handleMedRemove = async (med) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (med.id) await supabase.from("medicines").delete().eq("id", med.id).eq("user_id", user.id);
    await updateMedInProfile(user.id, pm =>
      pm.name?.toLowerCase() === med.name?.toLowerCase() ? null : pm
    ).catch(() => {});
    const { data: prof } = await supabase.from("profiles").select("medications").eq("id", user.id).single();
    const filtered = (prof?.medications || []).filter(m => (typeof m==="object"?m:{}).name?.toLowerCase() !== med.name?.toLowerCase());
    await supabase.from("profiles").update({ medications: filtered }).eq("id", user.id);
    fetchData();
  };

  const handleMedRanOut = async (med) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (med.id) await supabase.from("medicines").update({ ran_out: true, active: false }).eq("id", med.id).eq("user_id", user.id);
    const { data: prof } = await supabase.from("profiles").select("medications").eq("id", user.id).single();
    const updated = (prof?.medications || []).map(m => {
      const pm = typeof m === "object" ? m : {};
      return pm.name?.toLowerCase() === med.name?.toLowerCase() ? { ...pm, ran_out: true, active: false } : m;
    });
    await supabase.from("profiles").update({ medications: updated }).eq("id", user.id);
    onUploadComplete?.();
    fetchData();
  };

  const handleMedRestock = async (med) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (med.id) await supabase.from("medicines").update({ ran_out: false, active: true }).eq("id", med.id).eq("user_id", user.id);
    const { data: prof } = await supabase.from("profiles").select("medications").eq("id", user.id).single();
    const updated = (prof?.medications || []).map(m => {
      const pm = typeof m === "object" ? m : {};
      return pm.name?.toLowerCase() === med.name?.toLowerCase() ? { ...pm, ran_out: false, active: true } : m;
    });
    await supabase.from("profiles").update({ medications: updated }).eq("id", user.id);
    onUploadComplete?.();
    fetchData();
  };

  const handleMedSave = async ({ name, frequency }) => {
    const med = editingMed;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (med.id) await supabase.from("medicines").update({ name, frequency }).eq("id", med.id).eq("user_id", user.id);
    const { data: prof } = await supabase.from("profiles").select("medications").eq("id", user.id).single();
    const updated = (prof?.medications || []).map(m => {
      const pm = typeof m === "object" ? m : {};
      return pm.name?.toLowerCase() === med.name?.toLowerCase() ? { ...pm, name, frequency } : m;
    });
    await supabase.from("profiles").update({ medications: updated }).eq("id", user.id);
    setEditingMed(null);
    fetchData();
  };

  const handleScanAction = async (scan, action) => {
    let resolvedScan = scan;

    // Legacy scan (no DB row yet) — create a row first so we have an id
    if (!scan.id) {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: newRow, error: insertErr } = await supabase.from("scans").insert({
        user_id: user.id,
        scan_type: scan.scan_type || "other",
        scan_name: scan.type || null,
        scan_date: scan.date || null,
        status: "scheduled",
      }).select().single();
      if (insertErr) console.error("[scan insert]", insertErr.message);
      if (newRow) resolvedScan = { ...scan, id: newRow.id };
    }

    if (!resolvedScan.id) return; // migration not yet run — columns missing

    if (action === "upload") {
      const doUpload = () => setActiveScanUpload(resolvedScan);
      requireConsent ? requireConsent(doUpload) : doUpload();
    } else if (action === "markDone") {
      await supabase.from("scans").update({ status: "completed" }).eq("id", resolvedScan.id);
      fetchData();
    } else if (action === "viewReport") {
      setActiveReportView(resolvedScan);
    } else if (action === "remove") {
      await supabase.from("scans").delete().eq("id", resolvedScan.id);
      fetchData();
      onDataChange?.();
    }
  };

  const handleDeleteRx = async (rx) => {
    try {
      if (rx.id) {
        const resp = await authFetch("/api/prescription/delete", {
          method: "DELETE",
          body: JSON.stringify({ prescription_id: rx.id }),
        });
        if (!resp.ok) throw new Error("Delete failed");
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not logged in");
        const { data: prof } = await supabase.from("profiles").select("prescriptions").eq("id", user.id).single();
        const existing = prof?.prescriptions || [];
        const updated = existing.filter(p =>
          !(p.doctor === rx.doctor && p.date === rx.date && p.summary === rx.summary)
        );
        await supabase.from("profiles").update({ prescriptions: updated }).eq("id", user.id);
      }
      setDetailRx(null);
      fetchData();
      setTestReloadKey(k => k + 1);
      onUploadComplete?.();
    } catch {
      alert("Could not delete prescription. Please try again.");
    }
  };

  const hasPrescriptions = prescriptions.length > 0;
  const activeMeds  = medicines.filter(m => m.active !== false && !m.paused && !m.ran_out);
  const pausedMeds  = medicines.filter(m => m.paused && !m.ran_out);
  const ranOutMeds  = medicines.filter(m => m.ran_out);

  const medSummary = activeMeds.length
    ? `${activeMeds.length} active${ranOutMeds.length ? ` · ${ranOutMeds.length} ran out` : ""}${pausedMeds.length ? ` · ${pausedMeds.length} paused` : ""}`
    : "No medicines added yet";

  const doneScans = scans.filter(s => s.status === "completed");
  const scanSummary = scans.length
    ? `${scans.length} scan${scans.length !== 1 ? "s" : ""}${doneScans.length ? ` · ${doneScans.length} done` : ""}`
    : "No scans recorded yet";

  return (
    <div style={{display:"flex",flexDirection:"column",minHeight:"calc(100vh - 64px)"}}>

      {/* ── HERO ── */}
      <div style={{background:"linear-gradient(150deg,#1a1228,#241838,#2e1e48)",flexShrink:0,position:"relative",overflow:"hidden",margin:"12px 12px 0",borderRadius:20}}>
        <span style={{position:"absolute",fontSize:220,right:-20,bottom:-30,opacity:0.06,pointerEvents:"none",userSelect:"none",transform:"rotate(-12deg)"}}>🧬</span>
        <div style={{position:"relative",zIndex:2,padding:"18px 20px 0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:"rgba(232,184,200,0.6)",flexShrink:0}}/>
            <span style={{fontSize:11,fontWeight:700,letterSpacing:"0.22em",textTransform:"uppercase",color:"rgba(255,255,255,0.4)"}}>My Health</span>
          </div>
          <div className="profile-chip" onClick={e=>{e.stopPropagation();onOpenProfile?.();}}>
            <div className="profile-chip-avatar" style={{fontSize:14}}>🤰</div>
            {profileData?.name && <span className="profile-chip-name">{profileData.name.split(" ")[0]}</span>}
          </div>
        </div>
        <div style={{position:"relative",zIndex:2,padding:"18px 20px 24px"}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:400,color:"#fff",lineHeight:1.05,marginBottom:8}}>
            Everything Matri<br/><em style={{fontStyle:"italic",color:"rgba(232,184,200,0.85)"}}>knows about you.</em>
          </div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.36)",lineHeight:1.65,marginBottom:healthContext?.summary?14:0}}>
            Prescriptions, medicines, tests — all remembered.
          </div>
          {healthContext?.summary && (() => {
            const points = parseSummaryPoints(healthContext.summary);
            return (
              <div style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(232,184,200,0.12)",borderRadius:14,padding:"10px 14px"}}>
                <div style={{fontSize:8,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",color:"rgba(232,184,200,0.5)",marginBottom:8}}>Matri's current understanding</div>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  {points.map((pt, i) => (
                    <div key={i} style={{display:"flex",alignItems:"center",gap:7}}>
                      <span style={{fontSize:pt.icon==='·'?16:12,flexShrink:0,lineHeight:1,color:"rgba(232,184,200,0.5)"}}>{pt.icon}</span>
                      <span style={{fontSize:11,color:"rgba(255,255,255,0.55)",lineHeight:1.3,textTransform:"capitalize"}}>{pt.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div style={{flex:1,overflowY:"auto",padding:"16px 16px 110px",scrollbarWidth:"none"}}>

        {loading ? (
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"48px 0"}}>
            <div style={{width:30,height:30,border:"3px solid var(--slate-pale)",borderTopColor:"var(--slate)",borderRadius:"50%",animation:"spin 0.85s linear infinite"}}/>
          </div>
        ) : !hasPrescriptions ? (
          <>
            <EmptyHealthState onUpload={() => requireConsent ? requireConsent(() => setShowUpload(true)) : setShowUpload(true)} />
            <PmsmaFooter />
          </>
        ) : (
          <>
            {/* Doctor's Notes */}
            <div style={{marginBottom:20}}>
              <div className="p-lbl" style={{color:"var(--navy)"}}>Doctor's Notes</div>
              <DoctorNotesRow
                prescriptions={prescriptions}
                onViewDetail={setDetailRx}
                onUpload={() => requireConsent ? requireConsent(() => setShowUpload(true)) : setShowUpload(true)}
              />
            </div>

            {/* Medicines */}
            <SectionCard
              icon="💊" title="Medicines" color="rose"
              summary={medSummary}
              expanded={expanded === "meds"}
              onTap={() => toggle("meds")}
            >
              {medicines.length > 0 ? (
                <div>
                  {activeMeds.map((m, i) => (
                    <MedCard key={m.id||i} med={m}
                      onEdit={()=>setEditingMed(m)}
                      onRemove={()=>handleMedRemove(m)}
                      onRanOut={()=>handleMedRanOut(m)}
                      onRestock={()=>handleMedRestock(m)}
                    />
                  ))}
                  {ranOutMeds.length > 0 && <>
                    <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",color:"var(--muted)",margin:"10px 0 6px"}}>Ran out</div>
                    {ranOutMeds.map((m, i) => (
                      <MedCard key={m.id||i} med={m}
                        onEdit={()=>setEditingMed(m)}
                        onRemove={()=>handleMedRemove(m)}
                        onRanOut={()=>handleMedRanOut(m)}
                        onRestock={()=>handleMedRestock(m)}
                      />
                    ))}
                  </>}
                  {pausedMeds.length > 0 && <>
                    <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",color:"var(--muted)",margin:"10px 0 6px"}}>Paused</div>
                    {pausedMeds.map((m, i) => (
                      <MedCard key={m.id||i} med={m}
                        onEdit={()=>setEditingMed(m)}
                        onRemove={()=>handleMedRemove(m)}
                        onRanOut={()=>handleMedRanOut(m)}
                        onRestock={()=>handleMedRestock(m)}
                      />
                    ))}
                  </>}
                </div>
              ) : (
                <div style={{fontSize:12,color:"var(--muted)",fontStyle:"italic",lineHeight:1.65,textAlign:"center",padding:"8px 0"}}>
                  Medicines from your prescription appear here automatically.
                </div>
              )}
            </SectionCard>

            {/* Scans */}
            <SectionCard
              icon="🔬" title="Scans" color="navy"
              summary={scanSummary}
              expanded={expanded === "scans"}
              onTap={() => toggle("scans")}
            >
              <ScansContent scans={scans} onAction={handleScanAction} onViewInsights={() => setShowScanInsights(true)} />
            </SectionCard>

            {/* Tests */}
            <SectionCard
              icon="🧪" title="Tests" color="teal"
              summary="Tests ordered by your doctor"
              expanded={expanded === "tests"}
              onTap={() => toggle("tests")}
            >
              {/* Lab insights */}
              <button onClick={() => setShowLabInsights(true)}
                style={{width:"100%",padding:"12px 16px",background:"rgba(96,144,200,0.08)",border:"1px solid rgba(96,144,200,0.18)",borderRadius:16,fontSize:13,fontWeight:600,color:"rgba(96,144,200,0.85)",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                <span style={{fontSize:17}}>📊</span>
                <div style={{flex:1,textAlign:"left"}}>
                  <div>View lab insights</div>
                  <div style={{fontSize:11,fontWeight:400,color:"rgba(96,144,200,0.6)",marginTop:1}}>trends &amp; values across all tests</div>
                </div>
                <span style={{opacity:0.5,fontSize:14}}>→</span>
              </button>

              <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",color:"var(--muted)",marginBottom:10}}>Tests ordered by your doctor</div>
              <TestOrdersSection
                onViewDetail={setTestDetail}
                reloadKey={testReloadKey}
              />
            </SectionCard>

            <PmsmaFooter />
          </>
        )}
      </div>

      {/* ── OVERLAYS ── */}
      {showUpload && (
        <PrescriptionUploadFlow
          onComplete={async (result) => {
            setShowUpload(false);
            fetchData();
            setTestReloadKey(k => k + 1);
            onUploadComplete?.(result);
          }}
          onClose={() => setShowUpload(false)}
        />
      )}
      {detailRx && (
        <PrescriptionDetailSheet
          rx={detailRx}
          onClose={() => setDetailRx(null)}
          onDelete={handleDeleteRx}
        />
      )}
      {testDetail && (
        <TestReportSheet
          order={testDetail}
          onClose={() => setTestDetail(null)}
          onReportDeleted={() => { setTestDetail(null); setTestReloadKey(k => k + 1); }}
        />
      )}
      {activeScanUpload && (
        <ScanActionSheet
          scan={activeScanUpload}
          onComplete={() => { fetchData(); }}
          onClose={() => setActiveScanUpload(null)}
        />
      )}
      {editingMed && (
        <MedEditSheet
          med={editingMed}
          onSave={handleMedSave}
          onClose={() => setEditingMed(null)}
        />
      )}
      {activeReportView && (
        <ScanReportSheet
          scan={activeReportView}
          onClose={() => setActiveReportView(null)}
        />
      )}
      {showScanInsights && (
        <ScanInsightsSheet
          scans={scans}
          onClose={() => setShowScanInsights(false)}
          onUpload={() => setActiveScanUpload(scans.find(s => s.status !== "completed" && s.id) || null)}
        />
      )}
      {showLabInsights && (
        <LabInsightsSheet
          labData={profileData?.lab_data || {}}
          labExtras={profileData?.lab_extras_v2 || {}}
          onClose={() => setShowLabInsights(false)}
          onDataChange={onDataChange}
        />
      )}
    </div>
  );
}
