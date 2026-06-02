import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { authFetch } from '../../utils/auth';
import { PrescriptionUploadFlow, PrescriptionDetailSheet } from './PrescriptionComponents';
import { MedicineCard } from './MedicineComponents';
import { TestOrdersSection, TestReportSheet } from './LabComponents';

/* ─── COLOUR PALETTES ────────────────────────────────────────────────────── */
const PAL = {
  rose:  { pale:"var(--rose-pale)",  bdr:"var(--rose-bdr)",  col:"var(--rose)"  },
  navy:  { pale:"var(--navy-pale)",  bdr:"var(--navy-bdr)",  col:"var(--navy)"  },
  teal:  { pale:"var(--teal-pale)",  bdr:"var(--teal-bdr)",  col:"var(--teal)"  },
  slate: { pale:"var(--slate-pale)", bdr:"var(--slate-bdr)", col:"var(--slate)" },
};

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
      {/* Hero pitch */}
      <div style={{background:"linear-gradient(135deg,var(--slate-pale),#e8ecf4)",border:"1px solid var(--slate-bdr)",borderRadius:20,padding:"22px 18px 20px",marginBottom:20,textAlign:"center"}}>
        <div style={{fontSize:32,marginBottom:10,opacity:0.85}}>✦</div>
        <div style={{fontFamily:"'Lora',serif",fontSize:20,color:"var(--ink)",lineHeight:1.3,marginBottom:8}}>
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

      {/* Feature proof-points row */}
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
            <div style={{fontFamily:"'Lora',serif",fontSize:13,color:"var(--ink)",lineHeight:1.35,marginBottom:5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
              {rx.doctor_name || (date ? `Doctor · ${date}` : "Uploaded prescription")}
            </div>
            {rx.clinic_name && <div style={{fontSize:10,color:"var(--muted)",marginBottom:4}}>{rx.clinic_name}</div>}
            {date && <div style={{fontSize:10,color:"var(--muted)",marginBottom:6}}>{date}</div>}
            {chips && <div style={{fontSize:11,color:"var(--navy)",marginBottom:6}}>{chips}</div>}
            <div style={{fontSize:10,fontWeight:600,color:"var(--navy)"}}>View ↗</div>
          </div>
        );
      })}

      {/* Upload CTA card */}
      <div
        onClick={onUpload}
        style={{flexShrink:0,width:110,background:"transparent",border:"2px dashed var(--slate-bdr)",borderRadius:16,padding:"14px 10px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:7,color:"var(--slate)"}}>
        <span style={{fontSize:26,fontWeight:300,lineHeight:1}}>+</span>
        <span style={{fontSize:11,fontWeight:600,textAlign:"center",lineHeight:1.35}}>Add prescription</span>
      </div>
    </div>
  );
}

/* ─── SCANS CONTENT ──────────────────────────────────────────────────────── */
function ScansContent({ scans }) {
  if (!scans.length) {
    return (
      <div style={{background:"var(--navy-pale)",border:"1px solid var(--navy-bdr)",borderRadius:12,padding:"14px 16px",textAlign:"center"}}>
        <div style={{fontSize:22,opacity:0.4,marginBottom:6}}>🔬</div>
        <div style={{fontSize:12,color:"var(--muted)",lineHeight:1.65}}>Scan dates advised by your doctor will appear here when you upload a prescription.</div>
      </div>
    );
  }
  return (
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {scans.map((scan, i) => {
        const dateLabel = scan.date
          ? new Date(scan.date).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })
          : scan.week || null;
        return (
          <div key={i} style={{background:"var(--navy-pale)",border:"1px solid var(--navy-bdr)",borderRadius:13,padding:"11px 14px",display:"flex",alignItems:"flex-start",gap:10}}>
            <span style={{fontSize:20,flexShrink:0,marginTop:1}}>🔬</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,color:"var(--ink)"}}>{scan.type || scan.name || "Scan"}</div>
              {dateLabel && <div style={{fontSize:10,color:"var(--navy)",marginTop:2,fontWeight:500}}>{dateLabel}</div>}
              {scan.notes && scan.notes !== dateLabel && <div style={{fontSize:11,color:"var(--muted)",fontStyle:"italic",marginTop:2,lineHeight:1.45}}>{scan.notes}</div>}
              {scan.low_confidence && <div style={{fontSize:9,color:"var(--amber)",marginTop:3}}>⚠️ Verify with your doctor</div>}
            </div>
            {scan._rxDoctor && (
              <div style={{fontSize:9,color:"var(--muted)",flexShrink:0,textAlign:"right",lineHeight:1.4,maxWidth:70,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                {scan._rxDoctor}
              </div>
            )}
          </div>
        );
      })}
    </div>
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
export default function HealthTab() {
  const [loading,       setLoading]       = useState(true);
  const [prescriptions, setPrescriptions] = useState([]);
  const [medicines,     setMedicines]     = useState([]);
  const [scans,         setScans]         = useState([]);
  const [testReloadKey, setTestReloadKey] = useState(0);

  const [expanded,   setExpanded]   = useState(null); // "meds" | "scans" | "tests"
  const [showUpload, setShowUpload] = useState(false);
  const [detailRx,   setDetailRx]   = useState(null);
  const [testDetail, setTestDetail] = useState(null);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [rxRes, medsRes] = await Promise.all([
        supabase.from("prescriptions")
          .select("id, doctor_name, clinic_name, prescribed_date, follow_up_date, summary, medicine_count, test_count, scan_count, scan_dates, scans_advised, file_url")
          .eq("user_id", user.id)
          .order("prescribed_date", { ascending: false }),
        supabase.from("medicines")
          .select("*")
          .eq("user_id", user.id),
      ]);

      const rxList = rxRes.data || [];
      setPrescriptions(rxList);
      setMedicines(medsRes.data || []);

      // Aggregate scans across all prescriptions
      const allScans = rxList.flatMap(rx =>
        (rx.scan_dates || rx.scans_advised || []).map(s => ({
          ...s,
          _rxDoctor: rx.doctor_name || null,
        }))
      );
      setScans(allScans);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const toggle = (section) => setExpanded(prev => prev === section ? null : section);

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
    } catch {
      alert("Could not delete prescription. Please try again.");
    }
  };

  const activeMeds = medicines.filter(m => m.active !== false && !m.paused);
  const pausedMeds = medicines.filter(m => m.paused);

  if (loading) {
    return (
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"48px 0"}}>
        <div style={{width:30,height:30,border:"3px solid var(--slate-pale)",borderTopColor:"var(--slate)",borderRadius:"50%",animation:"spin 0.85s linear infinite"}}/>
      </div>
    );
  }

  const hasPrescriptions = prescriptions.length > 0;

  /* ── NO PRESCRIPTIONS: pitch screen ── */
  if (!hasPrescriptions) {
    return (
      <>
        <EmptyHealthState onUpload={() => setShowUpload(true)} />
        <PmsmaFooter />
        {showUpload && (
          <PrescriptionUploadFlow
            onComplete={() => { setShowUpload(false); fetchData(); setTestReloadKey(k => k + 1); }}
            onClose={() => setShowUpload(false)}
          />
        )}
      </>
    );
  }

  /* ── HAS PRESCRIPTIONS: full dashboard ── */
  const medSummary = activeMeds.length
    ? `${activeMeds.length} active${pausedMeds.length ? ` · ${pausedMeds.length} paused` : ""}`
    : "No medicines added yet";

  const scanSummary = scans.length
    ? `${scans.length} scan${scans.length !== 1 ? "s" : ""} advised by your doctor`
    : "No scans recorded yet";

  return (
    <>
      {/* ── SECTION 1: DOCTOR'S NOTES ── */}
      <div style={{marginBottom:20}}>
        <div className="p-lbl" style={{color:"var(--navy)"}}>Doctor's Notes</div>
        <DoctorNotesRow
          prescriptions={prescriptions}
          onViewDetail={setDetailRx}
          onUpload={() => setShowUpload(true)}
        />
      </div>

      {/* ── SECTION 2: MEDICINES ── */}
      <SectionCard
        icon="💊" title="Medicines" color="rose"
        summary={medSummary}
        expanded={expanded === "meds"}
        onTap={() => toggle("meds")}
      >
        {medicines.length > 0 ? (
          <div style={{display:"flex",flexDirection:"column",gap:0}}>
            {activeMeds.map((m, i) => <MedicineCard key={m.id || i} med={m} compact />)}
            {pausedMeds.length > 0 && <>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",color:"var(--muted)",margin:"10px 0 4px"}}>Paused</div>
              {pausedMeds.map((m, i) => <MedicineCard key={m.id || i} med={m} compact />)}
            </>}
          </div>
        ) : (
          <div style={{fontSize:12,color:"var(--muted)",fontStyle:"italic",lineHeight:1.65,textAlign:"center",padding:"8px 0"}}>
            Medicines from your prescription appear here automatically.
          </div>
        )}
      </SectionCard>

      {/* ── SECTION 3: SCANS ── */}
      <SectionCard
        icon="🔬" title="Scans" color="navy"
        summary={scanSummary}
        expanded={expanded === "scans"}
        onTap={() => toggle("scans")}
      >
        <ScansContent scans={scans} />
      </SectionCard>

      {/* ── SECTION 4: TESTS ── */}
      <SectionCard
        icon="🧪" title="Tests" color="teal"
        summary="Tests ordered by your doctor"
        expanded={expanded === "tests"}
        onTap={() => toggle("tests")}
      >
        <TestOrdersSection
          onViewDetail={setTestDetail}
          reloadKey={testReloadKey}
        />
      </SectionCard>

      <PmsmaFooter />

      {/* ── OVERLAYS ── */}
      {showUpload && (
        <PrescriptionUploadFlow
          onComplete={() => { setShowUpload(false); fetchData(); setTestReloadKey(k => k + 1); }}
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
    </>
  );
}
