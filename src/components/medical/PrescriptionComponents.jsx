import React, { useState, useEffect, useRef } from 'react';
import { authFetch } from '../../utils/auth';
import { supabase } from '../../supabase';
import { compressImageFile } from '../../utils/albumUtils';

/* ─── PRESCRIPTION UPLOAD FLOW ───────────────────────────────────────────── */
// The full fan-out upload — prescription → medicines + tests + scans + summary
export function PrescriptionUploadFlow({ onComplete, onClose }) {
  const [vis,      setVis]      = useState(false);
  const [file,     setFile]     = useState(null);
  const [step,     setStep]     = useState("upload"); // upload → confirm → done
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState(null);
  const fileRef = useRef();

  useEffect(() => { requestAnimationFrame(() => setVis(true)); }, []);
  const close = () => { setVis(false); setTimeout(onClose, 350); };

  const handleFile = e => { const f = e.target.files?.[0]; if (f) setFile(f); };

  const infer = async () => {
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
        body: JSON.stringify({
          type: "prescription",
          fileBase64: base64,
          mimeType: file.type,
          fileName: file.name,
          week: 8,
        })
      });

      if (!resp.ok) throw new Error("Server error");
      const data = await resp.json();
      setResult(data.parsed);
      setStep("confirm");
    } catch(e) {
      setError("Couldn't read the prescription. Try a clearer photo.");
    }
    setLoading(false);
  };

  const confirm = async () => {
    // Data is already saved by api/infer — just close and refresh
    onComplete(result);
    close();
  };

  return (
    <>
      <div className={`pedit-backdrop${vis?" open":""}`} onClick={close}/>
      <div className={`pedit-sheet${vis?" open":""}`} style={{maxHeight:"90vh",overflowY:"auto"}}>
        <div className="pedit-handle"/>

        {step === "upload" && <>
          <div className="pedit-title">Upload <em>prescription</em></div>
          <div style={{fontSize:12,color:"var(--muted)",marginBottom:16,lineHeight:1.6}}>
            Matri will read the prescription and automatically add medicines, tests, and scan dates to the right places.
          </div>

          {/* Upload zone */}
          <div
            style={{border:`2px dashed ${file?"var(--rose)":"var(--bdr)"}`,borderRadius:16,padding:24,textAlign:"center",cursor:"pointer",background:file?"var(--rose-pale)":"#fff",marginBottom:16,transition:"all 0.2s"}}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{display:"none"}} onChange={handleFile}/>
            {file ? <>
              <div style={{fontSize:24,marginBottom:6}}>📄</div>
              <div style={{fontSize:13,fontWeight:600,color:"var(--rose)"}}>{file.name}</div>
              <div style={{fontSize:11,color:"var(--muted)",marginTop:4}}>Tap to change</div>
            </> : <>
              <div style={{fontSize:24,marginBottom:6}}>💊</div>
              <div style={{fontSize:13,fontWeight:600,color:"var(--ink)"}}>Attach prescription</div>
              <div style={{fontSize:11,color:"var(--muted)",marginTop:4}}>Photo or PDF</div>
            </>}
          </div>

          {error && <div style={{fontSize:12,color:"var(--rose)",marginBottom:12,textAlign:"center"}}>{error}</div>}

          {loading ? (
            <div style={{textAlign:"center",padding:"18px 0 6px"}}>
              <div style={{width:36,height:36,border:"3px solid var(--rose-pale)",borderTopColor:"var(--rose)",borderRadius:"50%",animation:"spin 0.85s linear infinite",margin:"0 auto 14px"}}/>
              <div style={{fontSize:14,fontWeight:600,color:"var(--ink)",marginBottom:6}}>Reading your prescription…</div>
              <div style={{fontSize:12,color:"var(--muted)",lineHeight:1.7}}>This usually takes about a minute.<br/>Matri is finding every medicine, test &amp; scan date.</div>
            </div>
          ) : (
            <button
              onClick={infer} disabled={!file}
              style={{width:"100%",padding:"14px",background:"var(--rose)",border:"none",borderRadius:100,fontSize:15,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}
            >
              ✦ Read prescription
            </button>
          )}
        </>}

        {step === "confirm" && result && <>
          <div className="pedit-title">Matri <em>found</em></div>
          <div style={{fontSize:12,color:"var(--muted)",marginBottom:16,lineHeight:1.6}}>
            {result.summary || "Review what Matri found and confirm to save."}
          </div>

          {/* Medicines */}
          {(result.medicines || []).length > 0 && (
            <div className="rx-confirm-section">
              <div className="rx-confirm-title">💊 Medicines ({result.medicines.length})</div>
              {result.medicines.map((m, i) => (
                <div key={i} className="rx-confirm-item">
                  <span className="rx-confirm-icon">💊</span>
                  <div>
                    <div className="rx-confirm-text">{m.name} {m.dosage && `· ${m.dosage}`}</div>
                    <div className="rx-confirm-sub">{m.frequency}{m.duration?` · ${m.duration}`:""}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tests ordered */}
          {(result.tests_ordered || []).length > 0 && (
            <div className="rx-confirm-section">
              <div className="rx-confirm-title">🧪 Tests ordered ({result.tests_ordered.length})</div>
              {result.tests_ordered.map((t, i) => (
                <div key={i} className="rx-confirm-item">
                  <span className="rx-confirm-icon">🧪</span>
                  <div>
                    <div className="rx-confirm-text">{t.name}</div>
                    {t.notes && <div className="rx-confirm-sub">{t.notes}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Scan dates */}
          {(result.scans_advised || result.scan_dates || []).length > 0 && (
            <div className="rx-confirm-section">
              <div className="rx-confirm-title">🔬 Scans scheduled ({(result.scans_advised||result.scan_dates||[]).length})</div>
              {(result.scans_advised||result.scan_dates||[]).map((s, i) => (
                <div key={i} className="rx-confirm-item">
                  <span className="rx-confirm-icon">🔬</span>
                  <div>
                    <div className="rx-confirm-text">{s.type}</div>
                    <div className="rx-confirm-sub">{s.date || s.week || s.notes}</div>
                    {s.low_confidence && <div style={{fontSize:9,color:"var(--amber)"}}>⚠️ Low confidence</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Diet instructions */}
          {(result.diet_instructions || []).length > 0 && (
            <div className="rx-confirm-section">
              <div className="rx-confirm-title">🥗 Diet instructions ({result.diet_instructions.length})</div>
              {result.diet_instructions.map((d, i) => (
                <div key={i} className="rx-confirm-item">
                  <span className="rx-confirm-icon">🥗</span>
                  <div className="rx-confirm-text">{d}</div>
                </div>
              ))}
            </div>
          )}

          {/* Monitoring instructions */}
          {(result.monitoring_instructions || []).length > 0 && (
            <div className="rx-confirm-section">
              <div className="rx-confirm-title">📊 Monitoring ({result.monitoring_instructions.length})</div>
              {result.monitoring_instructions.map((m, i) => (
                <div key={i} className="rx-confirm-item">
                  <span className="rx-confirm-icon">📊</span>
                  <div className="rx-confirm-text">{m}</div>
                </div>
              ))}
            </div>
          )}

<div style={{display:"flex",gap:10,marginTop:8}}>
            <button onClick={() => setStep("upload")} style={{flex:1,padding:"13px",background:"transparent",border:"1.5px solid var(--bdr)",borderRadius:100,fontSize:14,cursor:"pointer",fontFamily:"inherit",color:"var(--muted)"}}>
              Re-upload
            </button>
            <button onClick={confirm} style={{flex:2,padding:"13px",background:"var(--teal)",border:"none",borderRadius:100,fontSize:14,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>
              Save all ✓
            </button>
          </div>
        </>}
      </div>
    </>
  );
}

/* ─── PRESCRIPTIONS LIST (Doctor's Area) ─────────────────────────────────── */
export function PrescriptionsList({ prescriptions = [], onViewDetail, onDeleted }) {
  const [deleteRx, setDeleteRx] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteRx) return;
    setDeleting(true);
    try {
      if (deleteRx.id) {
        // Full cascade delete via API
        const resp = await authFetch("/api/prescription/delete", {
          method: "DELETE",
          body: JSON.stringify({ prescription_id: deleteRx.id }),
        });
        if (!resp.ok) throw new Error("Delete failed");
      } else {
        // Old entry with no id — remove from profile.prescriptions jsonb directly
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not logged in");
        const { data: profile } = await supabase.from("profiles").select("prescriptions").eq("id", user.id).single();
        // Match by index since there's no id — filter out the one we want to remove
        const existing = profile?.prescriptions || [];
        // Remove by matching all available fields
        const updated = existing.filter(rx =>
          !(rx.doctor === deleteRx.doctor &&
            rx.date === deleteRx.date &&
            rx.summary === deleteRx.summary)
        );
        await supabase.from("profiles").update({ prescriptions: updated }).eq("id", user.id);
      }
      setDeleteRx(null);
      onDeleted && onDeleted();
    } catch (e) {
      alert("Could not delete prescription. Please try again.");
    }
    setDeleting(false);
  };

  if (!prescriptions.length) {
    return (
      <div style={{background:"var(--navy-pale)",border:"1px solid var(--navy-bdr)",borderRadius:14,padding:"16px",textAlign:"center"}}>
        <div style={{fontSize:24,marginBottom:8,opacity:0.4}}>📋</div>
        <div style={{fontSize:12,color:"var(--muted)",lineHeight:1.6}}>No prescriptions uploaded yet.<br/>Use the button below to upload one.</div>
      </div>
    );
  }

  return (
    <>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {prescriptions.map((rx, i) => {
          const date = rx.date ? new Date(rx.date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : null;
          const counts = [
            rx.medicine_count && `${rx.medicine_count} medicine${rx.medicine_count!==1?"s":""}`,
            rx.test_count && `${rx.test_count} test${rx.test_count!==1?"s":""}`,
            rx.scan_count && `${rx.scan_count} scan${rx.scan_count!==1?"s":""}`,
          ].filter(Boolean).join(" · ");

          return (
            <div key={rx.id || i}
              style={{background:"#fff",border:"1px solid var(--navy-bdr)",borderRadius:16,padding:"14px 16px",cursor:"pointer"}}
              onClick={() => onViewDetail && onViewDetail(rx)}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,color:"var(--ink)",lineHeight:1.2,marginBottom:3}}>
                    {rx.doctor || (rx.date ? `Prescription · ${new Date(rx.date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}` : "Uploaded prescription")}
                    {rx.clinic && <span style={{fontSize:11,color:"var(--muted)",fontFamily:"'DM Sans',sans-serif",fontStyle:"normal"}}> · {rx.clinic}</span>}
                  </div>
                  {date && <div style={{fontSize:10,color:"var(--muted)",marginBottom:4}}>{date}</div>}
                  {counts && <div style={{fontSize:11,color:"var(--navy)",fontWeight:500,marginBottom:4}}>{counts}</div>}
                  {rx.summary && (
                    <div style={{fontSize:11,color:"var(--muted)",fontStyle:"italic",lineHeight:1.5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
                      "{rx.summary}"
                    </div>
                  )}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0,alignItems:"flex-end"}}>
                  <div style={{fontSize:10,color:"var(--navy)",fontWeight:600}}>View ↗</div>
                  <button
                    onClick={e=>{e.stopPropagation();setDeleteRx(rx);}}
                    style={{fontSize:10,color:"var(--rose)",background:"var(--rose-pale)",border:"none",borderRadius:100,padding:"3px 9px",cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>
                    Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── DELETE CONFIRM DIALOG ── */}
      {deleteRx && (
        <>
          <div style={{position:"fixed",inset:0,zIndex:600,background:"rgba(16,10,8,0.7)"}} onClick={()=>setDeleteRx(null)}/>
          <div style={{position:"fixed",bottom:0,left:0,right:0,width:"100%",maxWidth:430,margin:"0 auto",zIndex:601,background:"#fff",borderRadius:"24px 24px 0 0",padding:"24px 20px 40px"}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"var(--ink)",marginBottom:8}}>Remove this <em>prescription?</em></div>
            <div style={{background:"var(--rose-pale)",border:"1px solid var(--rose-bdr)",borderRadius:12,padding:"12px 14px",fontSize:12,color:"var(--rose)",marginBottom:16,lineHeight:1.65}}>
              This will permanently remove this prescription and all medicines, tests, and scan dates linked to it. The AI health context derived from it will also be cleared and rebuilt. <strong>This cannot be undone.</strong>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setDeleteRx(null)} disabled={deleting} style={{flex:1,padding:"13px",background:"transparent",border:"1.5px solid var(--bdr)",borderRadius:100,fontSize:14,cursor:"pointer",fontFamily:"inherit",color:"var(--muted)"}}>Cancel</button>
              <button onClick={confirmDelete} disabled={deleting} style={{flex:2,padding:"13px",background:"var(--rose)",border:"none",borderRadius:100,fontSize:14,fontWeight:600,color:"#fff",cursor:deleting?"default":"pointer",fontFamily:"inherit",opacity:deleting?0.6:1}}>
                {deleting?"Removing…":"Yes, remove"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

/* ─── PRESCRIPTION DETAIL SHEET ──────────────────────────────────────────── */
export function PrescriptionDetailSheet({ rx, onClose, onDelete }) {
  const [vis, setVis] = useState(false);
  const [fullRx, setFullRx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signedUrl, setSignedUrl] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    requestAnimationFrame(()=>setVis(true));

    // Fetch full prescription record from Supabase if we have an id
    const load = async () => {
      setLoading(true);
      try {
        if (rx.id) {
          const { data } = await supabase
            .from("prescriptions")
            .select("*")
            .eq("id", rx.id)
            .single();
          if (data) {
            setFullRx(data);
            // Generate signed URL via backend (service role key — anon key can't sign private buckets)
            if (data.file_url) {
              try {
                const resp = await authFetch("/api/storage/signed-url", {
                  method: "POST",
                  body: JSON.stringify({ file_url: data.file_url }),
                });
                if (resp.ok) {
                  const { signedUrl } = await resp.json();
                  if (signedUrl) setSignedUrl(signedUrl);
                }
              } catch { /* leave signedUrl null — view button will be hidden */ }
            }
          }
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, [rx.id]);

  const close = () => { setVis(false); setTimeout(onClose, 350); };

  // Merge: fullRx has the arrays, rx has the summary fields
  const data = fullRx ? { ...rx, ...fullRx } : rx;

  const date = data.prescribed_date || data.date
    ? new Date(data.prescribed_date || data.date).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})
    : null;
  const followUp = data.follow_up_date
    ? new Date(data.follow_up_date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})
    : null;

  const downloadFile = async () => {
    const url = signedUrl;
    if (!url) return;
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `prescription-${data.doctor_name||data.doctor||"doc"}-${data.prescribed_date||data.date||"unknown"}`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  const Section = ({title, items}) => {
    if (!items?.length) return null;
    return (
      <div style={{marginBottom:16}}>
        <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:"var(--navy)",marginBottom:8}}>{title}</div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {items.map((item, i) => (
            <div key={i} style={{background:"var(--navy-pale)",border:"1px solid var(--navy-bdr)",borderRadius:12,padding:"10px 12px",fontSize:12,color:"var(--ink)",lineHeight:1.5}}>
              {typeof item === "string" ? item : (
                <>
                  <div style={{fontWeight:600}}>{item.name || item.type || item.test_name}</div>
                  {item.dosage && <div style={{color:"var(--muted)"}}>{item.dosage}</div>}
                  {item.frequency && <div style={{color:"var(--muted)"}}>{item.frequency}{item.duration?` · ${item.duration}`:""}</div>}
                  {item.notes && <div style={{color:"var(--muted)",fontStyle:"italic",marginTop:2}}>{item.notes}</div>}
                  {item.due_date && <div style={{color:"var(--navy)",fontSize:10,marginTop:2}}>Due: {new Date(item.due_date).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</div>}
                  {(item.date || item.week) && <div style={{color:"var(--navy)",fontSize:10,marginTop:2}}>{item.date||""}{item.week?` · ${item.week}`:""}</div>}
                  {item.low_confidence && <div style={{fontSize:9,color:"var(--amber)",marginTop:2}}>⚠️ Low confidence — verify with doctor</div>}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const hasFileUrl = !!signedUrl;

  return (
    <>
      <div style={{position:"fixed",inset:0,zIndex:700,background:vis?"rgba(16,10,8,0.78)":"rgba(16,10,8,0)",transition:"background 0.3s",pointerEvents:vis?"all":"none"}} onClick={close}/>
      <div onClick={e=>e.stopPropagation()} style={{position:"fixed",bottom:0,left:0,right:0,width:"100%",maxWidth:430,margin:"0 auto",zIndex:701,background:"var(--cream)",borderRadius:"28px 28px 0 0",transform:`translateY(${vis?0:102}%)`,transition:"transform 0.36s cubic-bezier(0.3,0.72,0,1)",maxHeight:"88vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Header */}
        <div style={{padding:"20px 20px 14px",display:"flex",alignItems:"flex-start",justifyContent:"space-between",borderBottom:"1px solid var(--bdr)",flexShrink:0}}>
          <div>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color:"var(--navy)",marginBottom:4}}>Prescription</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"var(--ink)",lineHeight:1.2}}>
              {data.doctor_name || data.doctor || "Doctor's prescription"}
            </div>
            {(data.clinic_name || data.clinic) && <div style={{fontSize:11,color:"var(--muted)",marginTop:3}}>{data.clinic_name || data.clinic}</div>}
            {date && <div style={{fontSize:10,color:"var(--muted)",marginTop:2}}>{date}</div>}
          </div>
          <button onClick={close} style={{width:34,height:34,borderRadius:"50%",background:"var(--cream2)",border:"none",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--muted)",fontFamily:"inherit"}}>✕</button>
        </div>

        {/* Body */}
        <div style={{overflowY:"auto",padding:"18px 20px 40px",scrollbarWidth:"none",flex:1}}>
          {loading ? (
            <div style={{textAlign:"center",padding:"32px 0",color:"var(--muted)",fontSize:13}}>Loading prescription details…</div>
          ) : (
            <>
              {/* Summary */}
              {data.summary && (
                <div style={{background:"var(--teal-pale)",border:"1px solid var(--teal-bdr)",borderRadius:14,padding:"14px 16px",fontSize:13,color:"var(--ink)",lineHeight:1.65,marginBottom:16,fontStyle:"italic"}}>
                  "{data.summary}"
                </div>
              )}

              {/* File actions */}
              {hasFileUrl && (
                <div style={{display:"flex",gap:8,marginBottom:16}}>
                  <a href={signedUrl} target="_blank" rel="noopener noreferrer"
                    style={{flex:1,padding:"11px",background:"var(--navy-pale)",border:"1px solid var(--navy-bdr)",borderRadius:14,fontSize:12,fontWeight:600,color:"var(--navy)",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6,textDecoration:"none"}}>
                    👁 View original
                  </a>
                  <button onClick={downloadFile}
                    style={{flex:1,padding:"11px",background:"var(--navy)",border:"none",borderRadius:14,fontSize:12,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                    ⬇ Download
                  </button>
                </div>
              )}

              {followUp && (
                <div style={{background:"var(--amber-pale)",border:"1px solid var(--amber-bdr)",borderRadius:12,padding:"10px 14px",fontSize:12,color:"var(--amber)",marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
                  📅 <span>Follow-up: <strong>{followUp}</strong></span>
                </div>
              )}

              <Section title="💊 Medicines" items={data.medicines}/>
              <Section title="🧪 Tests ordered" items={data.tests_ordered}/>
              <Section title="🔬 Scans advised" items={data.scan_dates || data.scans_advised}/>
              <Section title="🥗 Diet instructions" items={data.diet_instructions}/>
              <Section title="📊 Monitoring" items={data.monitoring_instructions}/>
              <Section title="📝 Doctor's advice" items={data.doctor_advice}/>

              {!data.medicines?.length && !data.tests_ordered?.length && !data.diet_instructions?.length && (
                <div style={{fontSize:12,color:"var(--muted)",fontStyle:"italic",textAlign:"center",padding:"8px 0"}}>
                  Detailed breakdown not available for this prescription.
                </div>
              )}

              <button onClick={() => setConfirmingDelete(true)}
                style={{width:"100%",padding:"12px",background:"transparent",border:"1.5px solid var(--rose-bdr)",borderRadius:14,fontSize:13,fontWeight:600,color:"var(--rose)",cursor:"pointer",fontFamily:"inherit",marginTop:16}}>
                Remove this prescription
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── DELETE CONFIRMATION SHEET ── */}
      {confirmingDelete && (
        <>
          <div
            style={{position:"fixed",inset:0,zIndex:702,background:"rgba(16,10,8,0.5)"}}
            onClick={() => { if (!deleting) setConfirmingDelete(false); }}
          />
          <div style={{position:"fixed",bottom:0,left:0,right:0,width:"100%",maxWidth:430,margin:"0 auto",zIndex:703,background:"#fff",borderRadius:"24px 24px 0 0",padding:"24px 20px 40px"}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"var(--ink)",marginBottom:8}}>Remove this <em>prescription?</em></div>
            <div style={{background:"var(--rose-pale)",border:"1px solid var(--rose-bdr)",borderRadius:12,padding:"12px 14px",fontSize:12,color:"var(--rose)",marginBottom:20,lineHeight:1.65}}>
              This will permanently remove this prescription and all medicines, tests, and scan dates linked to it. <strong>This cannot be undone.</strong>
            </div>
            {deleting ? (
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,padding:"14px 0",color:"var(--muted)",fontSize:13,fontStyle:"italic"}}>
                <div style={{width:18,height:18,border:"2px solid var(--rose-pale)",borderTopColor:"var(--rose)",borderRadius:"50%",animation:"spin 0.8s linear infinite",flexShrink:0}}/>
                Removing prescription and linked data…
              </div>
            ) : (
              <div style={{display:"flex",gap:10}}>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  style={{flex:1,padding:"13px",background:"transparent",border:"1.5px solid var(--bdr)",borderRadius:100,fontSize:14,cursor:"pointer",fontFamily:"inherit",color:"var(--muted)"}}>
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setDeleting(true);
                    try { await onDelete(rx); } finally { setDeleting(false); }
                  }}
                  style={{flex:2,padding:"13px",background:"var(--rose)",border:"none",borderRadius:100,fontSize:14,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>
                  Yes, remove
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

export function PrescriptionEditor({ editData, setEditData }) {
  const [file,      setFile]      = useState(null);
  const [inferring, setInferring] = useState(false);
  const [meds,      setMeds]      = useState(editData.prescriptions || []);
  const [error,     setError]     = useState(null);
  const fileRef = useRef();

  // Sync meds back to editData
  useEffect(() => { setEditData(d => ({ ...d, prescriptions: meds })); }, [meds]);

  const handleFile = e => { const f = e.target.files?.[0]; if (f) { setFile(f); setError(null); } };

  const inferRx = async () => {
    if (!file) return;
    setInferring(true); setError(null);
    try {
      const base64 = await new Promise((res,rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const isImage = file.type.startsWith("image/");
      const content = isImage ? [
        { type:"image", source:{ type:"base64", media_type:file.type, data:base64 } },
        { type:"text", text:`This is a doctor's prescription for a pregnant woman. Extract every medicine mentioned. Return ONLY a JSON array of objects, each with: name (string), dosage (string, e.g. "500mg"), frequency (string, e.g. "twice daily"), duration (string, e.g. "2 weeks"), notes (string, any special instructions, empty string if none). No markdown, no extra text, pure JSON array.` }
      ] : [
        { type:"document", source:{ type:"base64", media_type:"application/pdf", data:base64 } },
        { type:"text", text:`This is a doctor's prescription PDF for a pregnant woman. Extract every medicine mentioned. Return ONLY a JSON array of objects, each with: name (string), dosage (string), frequency (string), duration (string), notes (string). No markdown, pure JSON array.` }
      ];

      const resp = await authFetch("/api/chat", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ system:"Extract prescription data and return pure JSON array only.", messages:[{ role:"user", content }] })
      });
      if (!resp.ok) throw new Error("Server error");
      const data = await resp.json();
      const text = data.content?.[0]?.text || "";
      const parsed = JSON.parse(text.replace(/```json|```/g,"").trim());
      setMeds(parsed);
    } catch(e) {
      setError("Couldn't read the prescription. Try a clearer photo.");
    }
    setInferring(false);
  };

  return (
    <>
      {/* Premium AI card */}
      <div className="rx-premium-card">
        <div className="rx-premium-glow"/>
        <div className="rx-premium-badge">✦ Smart read</div>
        <div className="rx-premium-title">Let Matri <em>read</em> your prescription</div>
        <div className="rx-premium-sub">Photo or PDF of a handwritten or printed prescription — Matri will list every medicine clearly.</div>

        <div className={`rx-upload-zone${file?" has-file":""}`} onClick={() => fileRef.current?.click()}>
          <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{display:"none"}} onChange={handleFile}/>
          {file ? <>
            <div style={{fontSize:18,marginBottom:3}}>📄</div>
            <div style={{fontSize:12,fontWeight:600,color:"rgba(120,190,255,0.9)"}}>{file.name}</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.28)",marginTop:2}}>Tap to change</div>
          </> : <>
            <div style={{fontSize:18,marginBottom:3}}>💊</div>
            <div style={{fontSize:12,fontWeight:500,color:"rgba(255,255,255,0.5)"}}>Attach prescription</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.26)",marginTop:2}}>Photo or PDF</div>
          </>}
        </div>

        <button className="rx-infer-btn" onClick={inferRx} disabled={inferring || !file}>
          {inferring ? <><span>⏳</span> Reading prescription…</> : <><span>✦</span> Read prescription</>}
        </button>

        {error && <div style={{fontSize:11,color:"#ff9090",marginTop:10,textAlign:"center"}}>{error}</div>}

        {meds.length > 0 && (
          <div className="rx-result">
            <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",color:"rgba(120,190,255,0.7)",marginBottom:8}}>✦ Medicines found</div>
            {meds.map((m, i) => (
              <div key={i} className="rx-med-row">
                <div className="rx-med-name">{m.name} {m.dosage && <span style={{fontWeight:400,color:"rgba(255,255,255,0.5)"}}>· {m.dosage}</span>}</div>
                <div className="rx-med-detail">
                  {m.frequency && `${m.frequency}`}{m.duration && ` · ${m.duration}`}
                  {m.notes && <span style={{display:"block",color:"rgba(255,255,255,0.3)"}}>{m.notes}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
