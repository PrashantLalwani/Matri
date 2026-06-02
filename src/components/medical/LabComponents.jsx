import React, { useState, useEffect, useRef } from 'react';
import { authFetch } from '../../utils/auth';
import { supabase } from '../../supabase';
import { isCoreLabAlias } from '../../utils/medical';

/* ─── LAB TIMELINE ROW ────────────────────────────────────────────────────── */
export function LabTimelineRow({ name, unit, entries=[], normalRange, onAdd, onRemove }) {
  const [adding, setAdding] = useState(false);
  const [newVal, setNewVal] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);

  const isLow  = (v) => normalRange && v < normalRange[0];
  const isHigh = (v) => normalRange && v > normalRange[1];
  const statusColor = (v) => isLow(v)||isHigh(v) ? "var(--rose)" : "var(--forest)";
  const dotBg = (v) => isLow(v)||isHigh(v) ? "var(--rose-pale)" : "var(--teal-pale)";
  const dotBorder = (v) => isLow(v)||isHigh(v) ? "var(--rose)" : "var(--teal)";

  const latest = entries[entries.length-1];
  const trend = entries.length >= 2
    ? entries[entries.length-1].value > entries[entries.length-2].value ? "↑" : entries[entries.length-1].value < entries[entries.length-2].value ? "↓" : "→"
    : null;

  const confirm = () => {
    if (!newVal) return;
    onAdd({ value: parseFloat(newVal), date: newDate });
    setNewVal(""); setAdding(false);
  };

  return (
    <div className="lab-timeline-row">
      <div className="lab-timeline-header">
        <span>
          <span className="lab-timeline-name">{name}</span>
          {unit && <span className="lab-timeline-unit">({unit})</span>}
        </span>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          {latest && normalRange && (
            <span className="lab-timeline-status" style={{
              background: isLow(latest.value)||isHigh(latest.value) ? "var(--rose-pale)" : "var(--teal-pale)",
              color: statusColor(latest.value)
            }}>
              {isLow(latest.value) ? "⚠️ Low" : isHigh(latest.value) ? "⚠️ High" : "✓ Normal"}
            </span>
          )}
          {trend && <span style={{fontSize:14,color:latest&&(isLow(latest.value)||isHigh(latest.value))?"var(--rose)":"var(--teal)"}}>{trend}</span>}
        </div>
      </div>

      {/* Timeline dots */}
      <div className="lab-timeline-scroll">
        {entries.map((e, i) => (
          <div key={i} className="lab-timeline-entry" style={{position:"relative"}}>
            <div className="lab-timeline-dot" style={{background:dotBg(e.value),borderColor:dotBorder(e.value),color:statusColor(e.value)}}>
              <span>{e.value}</span>
            </div>
            <div className="lab-timeline-val">{e.value}</div>
            <div className="lab-timeline-date">{new Date(e.date).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</div>
            <button
              onClick={() => onRemove(i)}
              title="Remove this reading"
              style={{position:"absolute",top:-6,right:-4,width:16,height:16,borderRadius:"50%",background:"var(--rose-pale)",border:"1px solid var(--rose-bdr)",color:"var(--rose)",fontSize:9,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1,padding:0,fontFamily:"inherit"}}
            >×</button>
          </div>
        ))}
        {/* Add button inline */}
        <div style={{display:"flex",alignItems:"flex-start",paddingLeft:entries.length?12:0,paddingTop:4}}>
          <button className="lab-timeline-add" onClick={()=>setAdding(a=>!a)} title="Add new reading">
            {adding?"×":"+"}
          </button>
        </div>
      </div>

      {/* Inline add form */}
      {adding && (
        <div className="lab-add-form">
          <input type="number" placeholder="Value" value={newVal} onChange={e=>setNewVal(e.target.value)} style={{maxWidth:80}}/>
          <input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)}/>
          <button className="lab-add-confirm" onClick={confirm}>Add</button>
        </div>
      )}
    </div>
  );
}

/* ─── TEST ORDERS ────────────────────────────────────────────────────────── */

export function TestOrderRow({ order, uploading, checking, onUpload, onMarkDone, onViewDetail, onDelete }) {
  const fileRef = useRef();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const done      = order.status === "completed";
  const hasReport = done && !!order.file_url;
  const dueDate   = order.due_date
    ? new Date(order.due_date).toLocaleDateString("en-IN", {day:"numeric", month:"short"})
    : null;

  if (confirmDelete) {
    return (
      <div style={{background:"var(--rose-pale)",border:"1px solid var(--rose-bdr)",borderRadius:13,padding:"11px 14px",marginBottom:8}}>
        <div style={{fontSize:13,color:"var(--ink)",marginBottom:10}}>Remove <strong>{order.test_name}</strong>?</div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setConfirmDelete(false)}
            style={{flex:1,padding:"8px",background:"transparent",border:"1.5px solid var(--bdr)",borderRadius:100,fontSize:12,cursor:"pointer",fontFamily:"inherit",color:"var(--muted)"}}>
            Cancel
          </button>
          <button onClick={()=>{setConfirmDelete(false);onDelete();}}
            style={{flex:2,padding:"8px",background:"var(--rose)",border:"none",borderRadius:100,fontSize:12,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>
            Yes, remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{background:"var(--teal-pale)",border:"1px solid var(--teal-bdr)",borderRadius:13,padding:"11px 14px",marginBottom:8}}>
      <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{display:"none"}}
        onChange={e=>{const f=e.target.files?.[0];if(f)onUpload(f);e.target.value="";}}/>

      <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
        <span style={{fontSize:20,flexShrink:0,marginTop:1}}>🧪</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:2}}>
            <span style={{fontSize:13,fontWeight:600,color:"var(--ink)"}}>{order.test_name}</span>
            <span style={{
              fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:100,textTransform:"uppercase",letterSpacing:"0.1em",
              background: done ? "var(--teal-pale)" : "rgba(200,160,60,0.12)",
              color:       done ? "var(--teal)"      : "#8a6800",
              border:     `1px solid ${done ? "var(--teal-bdr)" : "rgba(200,160,60,0.3)"}`,
            }}>
              {done ? "Done" : "Ordered"}
            </span>
          </div>
          {dueDate && <div style={{fontSize:10,color:"var(--teal)",fontWeight:500,marginBottom:3}}>Due: {dueDate}</div>}
          {done && order.report_summary && (
            <div style={{fontSize:11,color:"var(--muted)",fontStyle:"italic",lineHeight:1.5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
              "{order.report_summary}"
            </div>
          )}
          {!done && order.notes && (
            <div style={{fontSize:11,color:"var(--muted)",fontStyle:"italic",lineHeight:1.45}}>{order.notes}</div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {(uploading || checking) ? (
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10,padding:"6px 0"}}>
          <div style={{width:14,height:14,border:`2px solid ${checking?"var(--amber-pale)":"var(--teal-pale)"}`,borderTopColor:checking?"var(--amber)":"var(--teal)",borderRadius:"50%",animation:"spin 0.8s linear infinite",flexShrink:0}}/>
          <span style={{fontSize:11,color:"var(--muted)"}}>{checking?"Validating report…":"Reading report…"}</span>
        </div>
      ) : !done ? (
        <div style={{display:"flex",gap:8,marginTop:10}}>
          <button onClick={()=>fileRef.current?.click()}
            style={{flex:1,padding:"8px",background:"var(--teal)",border:"none",borderRadius:100,fontSize:11,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>
            Upload
          </button>
          <button onClick={onMarkDone}
            style={{flex:1,padding:"8px",background:"transparent",border:"1.5px solid var(--teal-bdr)",borderRadius:100,fontSize:11,color:"var(--teal)",cursor:"pointer",fontFamily:"inherit"}}>
            Mark done
          </button>
          <button onClick={()=>setConfirmDelete(true)}
            style={{flex:1,padding:"8px",background:"var(--rose-pale)",border:"1px solid var(--rose-bdr)",borderRadius:100,fontSize:11,fontWeight:600,color:"var(--rose)",cursor:"pointer",fontFamily:"inherit"}}>
            Remove
          </button>
        </div>
      ) : !hasReport ? (
        <div style={{display:"flex",gap:8,marginTop:10}}>
          <button onClick={()=>fileRef.current?.click()}
            style={{flex:2,padding:"8px",background:"var(--teal)",border:"none",borderRadius:100,fontSize:11,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>
            Upload report
          </button>
          <button onClick={()=>setConfirmDelete(true)}
            style={{flex:1,padding:"8px",background:"var(--rose-pale)",border:"1px solid var(--rose-bdr)",borderRadius:100,fontSize:11,fontWeight:600,color:"var(--rose)",cursor:"pointer",fontFamily:"inherit"}}>
            Remove
          </button>
        </div>
      ) : (
        <div style={{display:"flex",gap:8,marginTop:10}}>
          <button onClick={onViewDetail}
            style={{flex:2,padding:"8px",background:"transparent",border:"1.5px solid var(--teal-bdr)",borderRadius:100,fontSize:11,fontWeight:600,color:"var(--teal)",cursor:"pointer",fontFamily:"inherit"}}>
            View report →
          </button>
          <button onClick={()=>setConfirmDelete(true)}
            style={{flex:1,padding:"8px",background:"var(--rose-pale)",border:"1px solid var(--rose-bdr)",borderRadius:100,fontSize:11,fontWeight:600,color:"var(--rose)",cursor:"pointer",fontFamily:"inherit"}}>
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

export function TestOrdersSection({ onViewDetail, reloadKey = 0 }) {
  const [orders,         setOrders]         = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [loadError,      setLoadError]      = useState(null);
  const [uploadingId,    setUploadingId]    = useState(null);
  const [checkingId,     setCheckingId]     = useState(null);
  const [mismatchPrompt, setMismatchPrompt] = useState(null);

  const load = async () => {
    setLoadError(null);
    try {
      const resp = await authFetch("/api/test-orders");
      if (resp.ok) {
        const body = await resp.json();
        setOrders(body.orders || []);
      } else {
        const body = await resp.json().catch(() => ({}));
        setLoadError(`Error ${resp.status}: ${body.error || resp.statusText}`);
      }
    } catch (e) {
      setLoadError(e.message || "Network error");
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, [reloadKey]);

  const handleDelete = async (order) => {
    try {
      const resp = await authFetch("/api/test-orders", {
        method: "DELETE",
        body: JSON.stringify({ id: order.id }),
      });
      if (!resp.ok) throw new Error("Delete failed");
      setOrders(prev => prev.filter(o => o.id !== order.id));
    } catch {
      alert("Could not remove test. Please try again.");
    }
  };

  const handleMarkDone = async (order) => {
    try {
      await supabase.from("test_orders").update({ status: "completed" }).eq("id", order.id);
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: "completed" } : o));
    } catch {
      alert("Could not update test status. Please try again.");
    }
  };

  // Saves the report after user has confirmed (or validation passed)
  const saveReport = async (order, file, base64) => {
    setUploadingId(order.id);
    try {
      const resp = await authFetch("/api/infer", {
        method: "POST",
        body: JSON.stringify({ type:"lab_report", fileBase64:base64, mimeType:file.type, fileName:file.name, test_order_id:order.id }),
      });
      if (!resp.ok) throw new Error("Failed");
      await load();
    } catch {
      alert("Could not process report. Please try a clearer photo or PDF.");
    }
    setUploadingId(null);
  };

  const handleUpload = async (order, file) => {
    // Read file once — reused for both validation and save
    const base64 = await new Promise((res, rej) => {
      const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.onerror = rej; r.readAsDataURL(file);
    });

    // AI pre-check: does this report match the expected test?
    setCheckingId(order.id);
    let mismatch = null;
    try {
      const isImage = file.type.startsWith("image/");
      const content = isImage
        ? [{ type:"image", source:{ type:"base64", media_type:file.type, data:base64 } }, { type:"text", text:`The doctor ordered a test called: "${order.test_name}". Does this uploaded report match that test? Return ONLY JSON: {"match": true/false, "detected": "what test this report actually is", "confidence": "high/medium/low"}. If you cannot read the report clearly, set confidence to "low".` }]
        : [{ type:"document", source:{ type:"base64", media_type:"application/pdf", data:base64 } }, { type:"text", text:`The doctor ordered a test called: "${order.test_name}". Does this uploaded report match that test? Return ONLY JSON: {"match": true/false, "detected": "what test this report actually is", "confidence": "high/medium/low"}. If you cannot read the report clearly, set confidence to "low".` }];
      const resp = await authFetch("/api/chat", { method:"POST", body:JSON.stringify({ messages:[{ role:"user", content }], max_tokens:120 }) });
      if (resp.ok) {
        const data = await resp.json();
        const parsed = JSON.parse((data.content?.[0]?.text || "{}").replace(/```json|```/g,"").trim());
        // Only warn when AI is confident there's a real mismatch
        if (parsed.match === false && parsed.confidence === "high") {
          mismatch = parsed.detected || "a different test";
        }
      }
    } catch { /* validation failed silently — proceed with upload */ }
    setCheckingId(null);

    if (mismatch) {
      setMismatchPrompt({ order, file, base64, detected: mismatch });
    } else {
      await saveReport(order, file, base64);
    }
  };

  if (loading) return <div style={{textAlign:"center",padding:"14px 0",color:"var(--muted)",fontSize:12}}>Loading tests…</div>;

  if (loadError) return (
    <div style={{background:"var(--rose-pale)",border:"1px solid var(--rose-bdr)",borderRadius:14,padding:"14px 16px"}}>
      <div style={{fontSize:12,color:"var(--rose)",marginBottom:8}}>Could not load tests: <strong>{loadError}</strong></div>
      <button onClick={load} style={{fontSize:11,fontWeight:600,color:"var(--rose)",background:"#fff",border:"1px solid var(--rose-bdr)",borderRadius:100,padding:"4px 12px",cursor:"pointer",fontFamily:"inherit"}}>Retry</button>
    </div>
  );

  if (!orders.length) return (
    <div style={{background:"var(--teal-pale)",border:"1px solid var(--teal-bdr)",borderRadius:14,padding:"14px 16px",textAlign:"center"}}>
      <div style={{fontSize:22,opacity:0.4,marginBottom:6}}>🧪</div>
      <div style={{fontSize:12,color:"var(--muted)",lineHeight:1.6}}>Tests ordered by your doctor will appear here automatically when you upload a prescription.</div>
    </div>
  );

  return (
    <>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {orders.map(order => (
          <TestOrderRow key={order.id} order={order}
            uploading={uploadingId === order.id}
            checking={checkingId === order.id}
            onUpload={file => handleUpload(order, file)}
            onMarkDone={() => handleMarkDone(order)}
            onViewDetail={() => onViewDetail(order)}
            onDelete={() => handleDelete(order)}/>
        ))}
      </div>

      {/* ── Mismatch confirmation sheet ── */}
      {mismatchPrompt && (
        <>
          <div style={{position:"fixed",inset:0,zIndex:800,background:"rgba(16,10,8,0.65)"}} onClick={()=>setMismatchPrompt(null)}/>
          <div style={{position:"fixed",bottom:0,left:0,right:0,width:"100%",maxWidth:430,margin:"0 auto",zIndex:801,background:"#fff",borderRadius:"24px 24px 0 0",padding:"24px 20px 40px"}}>
            <div style={{fontSize:22,marginBottom:10,textAlign:"center"}}>🤔</div>
            <div style={{fontFamily:"'Lora',serif",fontSize:18,color:"var(--ink)",marginBottom:10,textAlign:"center"}}>
              Report <em>mismatch?</em>
            </div>
            <div style={{background:"var(--amber-pale)",border:"1px solid var(--amber-bdr)",borderRadius:14,padding:"13px 16px",fontSize:13,color:"var(--ink)",lineHeight:1.7,marginBottom:20}}>
              This looks like a <strong>{mismatchPrompt.detected}</strong> report, but you're uploading for <strong>{mismatchPrompt.order.test_name}</strong>.<br/>
              <span style={{fontSize:12,color:"var(--muted)"}}>Are you sure you want to upload this report here?</span>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button
                onClick={()=>setMismatchPrompt(null)}
                style={{flex:1,padding:"13px",background:"transparent",border:"1.5px solid var(--bdr)",borderRadius:100,fontSize:14,cursor:"pointer",fontFamily:"inherit",color:"var(--muted)"}}>
                Cancel
              </button>
              <button
                onClick={async ()=>{ const p=mismatchPrompt; setMismatchPrompt(null); await saveReport(p.order, p.file, p.base64); }}
                style={{flex:2,padding:"13px",background:"var(--amber)",border:"none",borderRadius:100,fontSize:14,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>
                Upload anyway
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

/* ─── TEST REPORT DETAIL SHEET ──────────────────────────────────────────── */
export function TestReportSheet({ order, onClose, onReportDeleted }) {
  const [vis,             setVis]             = useState(false);
  const [signedUrl,       setSignedUrl]       = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting,         setDeleting]         = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVis(true));
    if (order.file_url) {
      authFetch("/api/storage/signed-url", { method:"POST", body:JSON.stringify({ file_url: order.file_url }) })
        .then(r => r.ok ? r.json() : null).then(d => { if (d?.signedUrl) setSignedUrl(d.signedUrl); }).catch(() => {});
    }
  }, [order.id]);

  const close = () => { setVis(false); setTimeout(onClose, 350); };

  const downloadFile = async () => {
    if (!signedUrl) return;
    try {
      const blob = await fetch(signedUrl).then(r => r.blob());
      const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `lab-report-${order.test_name||"report"}` });
      a.click(); URL.revokeObjectURL(a.href);
    } catch { window.open(signedUrl, "_blank"); }
  };

  const ev = order.extracted_values || {};
  const CORE = [
    { key:"hemoglobin",          label:"Haemoglobin",     unit:"g/dL",  range:[11,14]   },
    { key:"tsh",                 label:"TSH",              unit:"mIU/L", range:[0.1,4]   },
    { key:"blood_sugar_fasting", label:"Blood Sugar (F)",  unit:"mg/dL", range:[70,95]   },
    { key:"blood_sugar_pp",      label:"Blood Sugar (PP)", unit:"mg/dL", range:[70,140]  },
    { key:"blood_group",         label:"Blood Group",      unit:"",      range:null      },
  ];
  const dueDate    = order.due_date   ? new Date(order.due_date).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"}) : null;
  const reportDate = ev.report_date   ? new Date(ev.report_date).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"}) : null;
  const hasValues  = CORE.some(c => ev[c.key] != null) || (ev.extras||[]).length > 0;

  return (
    <>
      <div style={{position:"fixed",inset:0,zIndex:700,background:vis?"rgba(16,10,8,0.78)":"rgba(16,10,8,0)",transition:"background 0.3s",pointerEvents:vis?"all":"none"}} onClick={close}/>
      <div onClick={e=>e.stopPropagation()} style={{position:"fixed",bottom:0,left:0,right:0,width:"100%",maxWidth:430,margin:"0 auto",zIndex:701,background:"var(--cream)",borderRadius:"28px 28px 0 0",transform:`translateY(${vis?0:102}%)`,transition:"transform 0.36s cubic-bezier(0.3,0.72,0,1)",maxHeight:"88vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Header */}
        <div style={{padding:"20px 20px 14px",display:"flex",alignItems:"flex-start",justifyContent:"space-between",borderBottom:"1px solid var(--bdr)",flexShrink:0}}>
          <div>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color:"var(--teal)",marginBottom:4}}>Lab Report</div>
            <div style={{fontFamily:"'Lora',serif",fontSize:20,color:"var(--ink)",lineHeight:1.2}}>{order.test_name}</div>
            {dueDate && <div style={{fontSize:10,color:"var(--muted)",marginTop:2}}>Due: {dueDate}</div>}
          </div>
          <button onClick={close} style={{width:34,height:34,borderRadius:"50%",background:"var(--cream2)",border:"none",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--muted)",fontFamily:"inherit"}}>✕</button>
        </div>

        {/* Body */}
        <div style={{overflowY:"auto",padding:"18px 20px 40px",scrollbarWidth:"none",flex:1}}>
          {order.report_summary && (
            <div style={{background:"var(--teal-pale)",border:"1px solid var(--teal-bdr)",borderRadius:14,padding:"13px 16px",fontSize:13,color:"var(--ink)",lineHeight:1.65,marginBottom:14,fontStyle:"italic"}}>
              "{order.report_summary}"
            </div>
          )}
          {reportDate && (
            <div style={{fontSize:11,color:"var(--muted)",marginBottom:14}}>Report date: <strong style={{color:"var(--ink)"}}>{reportDate}</strong></div>
          )}

          {/* View / Download / Delete */}
          {signedUrl && (
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              <a href={signedUrl} target="_blank" rel="noopener noreferrer"
                style={{flex:1,padding:"11px",background:"var(--teal-pale)",border:"1px solid var(--teal-bdr)",borderRadius:14,fontSize:12,fontWeight:600,color:"var(--teal)",display:"flex",alignItems:"center",justifyContent:"center",gap:6,textDecoration:"none"}}>
                👁 View
              </a>
              <button onClick={downloadFile}
                style={{flex:1,padding:"11px",background:"var(--teal)",border:"none",borderRadius:14,fontSize:12,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                ⬇ Download
              </button>
              <button onClick={()=>setConfirmingDelete(true)}
                style={{flex:1,padding:"11px",background:"var(--rose-pale)",border:"1px solid var(--rose-bdr)",borderRadius:14,fontSize:12,fontWeight:600,color:"var(--rose)",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                🗑 Delete
              </button>
            </div>
          )}

          {/* Extracted values */}
          {hasValues && (
            <>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:"var(--muted)",marginBottom:10}}>Extracted values</div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
                {CORE.map(({key,label,unit,range}) => {
                  const val = ev[key]; if (val == null) return null;
                  const low  = range && typeof val==="number" && val < range[0];
                  const high = range && typeof val==="number" && val > range[1];
                  const status = !range ? null : low ? "Low" : high ? "High" : "Normal";
                  return (
                    <div key={key} style={{background:"#fff",border:"1px solid var(--bdr)",borderRadius:14,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div>
                        <div style={{fontSize:11,color:"var(--muted)",marginBottom:3}}>{label}</div>
                        <div style={{fontFamily:"'Lora',serif",fontSize:22,color:"var(--ink)"}}>
                          {val}{unit && <span style={{fontSize:11,color:"var(--muted)",fontFamily:"inherit",marginLeft:4}}>{unit}</span>}
                        </div>
                      </div>
                      {status && (
                        <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",
                          color:status==="Normal"?"var(--teal)":"var(--rose)",background:status==="Normal"?"var(--teal-pale)":"var(--rose-pale)",
                          border:`1px solid ${status==="Normal"?"var(--teal-bdr)":"var(--rose-bdr)"}`,borderRadius:100,padding:"3px 10px"}}>
                          {status==="Normal"?"✓ Normal":"⚠️ "+status}
                        </span>
                      )}
                    </div>
                  );
                })}
                {(ev.extras||[]).map((ex,i) => (
                  <div key={i} style={{background:"#fff",border:"1px solid var(--bdr)",borderRadius:14,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div>
                      <div style={{fontSize:11,color:"var(--muted)",marginBottom:3}}>{ex.name}</div>
                      <div style={{fontFamily:"'Lora',serif",fontSize:22,color:"var(--ink)"}}>
                        {ex.value}{ex.unit && <span style={{fontSize:11,color:"var(--muted)",fontFamily:"inherit",marginLeft:4}}>{ex.unit}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {order.notes && (
            <div style={{background:"var(--amber-pale)",border:"1px solid var(--amber-bdr)",borderRadius:12,padding:"12px 14px",fontSize:12,color:"var(--amber)",lineHeight:1.6}}>
              📋 <strong>Doctor's note:</strong> {order.notes}
            </div>
          )}

          {/* Schedule / Book — future features */}
          <div style={{marginTop:16}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",color:"var(--muted)",marginBottom:8}}>Future features</div>
            <div style={{display:"flex",gap:8,opacity:0.35,pointerEvents:"none",filter:"blur(0.8px)"}}>
              <div style={{flex:1,padding:"12px",background:"var(--navy-pale)",border:"1px solid var(--navy-bdr)",borderRadius:14,textAlign:"center",fontSize:12,fontWeight:600,color:"var(--navy)"}}>📅 Schedule</div>
              <div style={{flex:1,padding:"12px",background:"var(--forest-pale)",border:"1px solid var(--forest-bdr)",borderRadius:14,textAlign:"center",fontSize:12,fontWeight:600,color:"var(--forest)"}}>🏥 Book lab</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Delete report confirmation sheet ── */}
      {confirmingDelete && (
        <>
          <div style={{position:"fixed",inset:0,zIndex:702,background:"rgba(16,10,8,0.5)"}}
            onClick={()=>{ if(!deleting) setConfirmingDelete(false); }}/>
          <div style={{position:"fixed",bottom:0,left:0,right:0,width:"100%",maxWidth:430,margin:"0 auto",zIndex:703,background:"#fff",borderRadius:"24px 24px 0 0",padding:"24px 20px 40px"}}>
            <div style={{fontFamily:"'Lora',serif",fontSize:20,color:"var(--ink)",marginBottom:8}}>Delete this <em>report?</em></div>
            <div style={{background:"var(--rose-pale)",border:"1px solid var(--rose-bdr)",borderRadius:12,padding:"12px 14px",fontSize:12,color:"var(--rose)",marginBottom:20,lineHeight:1.65}}>
              This will remove the uploaded file and all extracted values from your history. The test will go back to <strong>Ordered</strong> status. <strong>This cannot be undone.</strong>
            </div>
            {deleting ? (
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,padding:"14px 0",color:"var(--muted)",fontSize:13,fontStyle:"italic"}}>
                <div style={{width:18,height:18,border:"2px solid var(--rose-pale)",borderTopColor:"var(--rose)",borderRadius:"50%",animation:"spin 0.8s linear infinite",flexShrink:0}}/>
                Deleting report and clearing values…
              </div>
            ) : (
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>setConfirmingDelete(false)}
                  style={{flex:1,padding:"13px",background:"transparent",border:"1.5px solid var(--bdr)",borderRadius:100,fontSize:14,cursor:"pointer",fontFamily:"inherit",color:"var(--muted)"}}>
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setDeleting(true);
                    try {
                      const resp = await authFetch("/api/test-orders/delete-report", {
                        method: "DELETE",
                        body: JSON.stringify({ test_order_id: order.id }),
                      });
                      if (!resp.ok) throw new Error("Delete failed");
                      setConfirmingDelete(false);
                      onReportDeleted && onReportDeleted();
                      close();
                    } catch {
                      alert("Could not delete report. Please try again.");
                    }
                    setDeleting(false);
                  }}
                  style={{flex:2,padding:"13px",background:"var(--rose)",border:"none",borderRadius:100,fontSize:14,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>
                  Yes, delete
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

/* ─── LABS EDITOR ─────────────────────────────────────────────────────────── */
export function LabsEditor({ editData, setEditData, hideTitle = false }) {
  const [file,       setFile]       = useState(null);
  const [inferring,  setInferring]  = useState(false);
  const [inferred,   setInferred]   = useState(null);
  const [inferError, setInferError] = useState(null);
  const [showAddExtra, setShowAddExtra] = useState(false);
  const [newExtraName, setNewExtraName] = useState("");
  const [newExtraUnit, setNewExtraUnit] = useState("");
  const fileRef = useRef();

  // Lab data is now stored as { key: [{value, date},...] }
  // and extras as { "TestName": { unit, entries:[{value,date}] } }
  const labData   = editData.lab_data   || {};
  const labExtras = editData.lab_extras_v2 || {};

  const updateLabData = (key, entries) => {
    setEditData(d => ({ ...d, lab_data: { ...d.lab_data||{}, [key]: entries } }));
  };
  const addEntry = (key, entry) => {
    const current = labData[key] || [];
    updateLabData(key, [...current, entry].sort((a,b)=>a.date.localeCompare(b.date)));
  };
  const removeEntry = (key, idx) => {
    const current = labData[key] || [];
    updateLabData(key, current.filter((_,i)=>i!==idx));
  };

  const updateExtra = (name, entries) => {
    setEditData(d => ({
      ...d,
      lab_extras_v2: { ...d.lab_extras_v2||{}, [name]: { ...d.lab_extras_v2?.[name], entries } }
    }));
  };
  const addExtraEntry = (name, entry) => {
    const current = (labExtras[name]?.entries) || [];
    updateExtra(name, [...current, entry].sort((a,b)=>a.date.localeCompare(b.date)));
  };
  const removeExtraEntry = (name, idx) => {
    const remaining = (labExtras[name]?.entries || []).filter((_,i)=>i!==idx);
    if (remaining.length === 0) {
      // Drop the key entirely — no ghost rows
      setEditData(d => {
        const { [name]: _, ...rest } = d.lab_extras_v2 || {};
        return { ...d, lab_extras_v2: rest };
      });
    } else {
      updateExtra(name, remaining);
    }
  };
  const addNewExtra = () => {
    if (!newExtraName.trim()) return;
    setEditData(d => ({
      ...d,
      lab_extras_v2: { ...d.lab_extras_v2||{}, [newExtraName.trim()]: { unit: newExtraUnit.trim(), entries: [] } }
    }));
    setNewExtraName(""); setNewExtraUnit(""); setShowAddExtra(false);
  };

  const handleFile = e => { const f = e.target.files?.[0]; if (f) { setFile(f); setInferred(null); setInferError(null); } };

  const inferFromReport = async () => {
    if (!file) return;
    setInferring(true); setInferError(null);
    const today = new Date().toISOString().split("T")[0];
    try {
      const base64 = await new Promise((res,rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const isImage = file.type.startsWith("image/");
      const prompt = `This is a pregnancy lab report. Extract ALL lab values including any report date. Return ONLY a JSON object with: hemoglobin (number g/dL or null), tsh (number mIU/L or null), blood_sugar_fasting (number mg/dL or null), blood_sugar_pp (number mg/dL or null), blood_group (string or null), report_date (string YYYY-MM-DD or today if not found), extras (array of {name, value (number), unit} for ALL other values), summary (2-3 plain-language sentences for a pregnant woman). No markdown, pure JSON.`;
      const content = isImage
        ? [{ type:"image", source:{ type:"base64", media_type:file.type, data:base64 } }, { type:"text", text:prompt }]
        : [{ type:"document", source:{ type:"base64", media_type:"application/pdf", data:base64 } }, { type:"text", text:prompt }];

      const resp = await authFetch("/api/chat", { method:"POST",
        body:JSON.stringify({ system:"Extract lab values and return pure JSON only.", messages:[{ role:"user", content }] }) });
      if (!resp.ok) throw new Error("Server error");
      const data = await resp.json();
      const parsed = JSON.parse((data.content?.[0]?.text||"").replace(/```json|```/g,"").trim());
      const rDate = parsed.report_date || today;
      setInferred(parsed);

      // Merge into timeline arrays
      const CORE = [["hemoglobin","hemoglobin"],["tsh","tsh"],["blood_sugar_fasting","blood_sugar_fasting"],["blood_sugar_pp","blood_sugar_pp"]];
      const updates = {};
      CORE.forEach(([pk]) => {
        if (parsed[pk] != null) {
          const existing = labData[pk] || [];
          const alreadyHas = existing.some(e => e.date === rDate);
          updates[pk] = alreadyHas ? existing : [...existing, { value: parsed[pk], date: rDate }].sort((a,b)=>a.date.localeCompare(b.date));
        }
      });

      // Extras — skip anything that's just a renamed version of a core test
      const newExtras = { ...labExtras };
      (parsed.extras||[]).forEach(ex => {
        if (isCoreLabAlias(ex.name)) return;
        const existing = newExtras[ex.name]?.entries || [];
        const alreadyHas = existing.some(e => e.date === rDate);
        newExtras[ex.name] = {
          unit: ex.unit || newExtras[ex.name]?.unit || "",
          entries: alreadyHas ? existing : [...existing, { value: ex.value, date: rDate }].sort((a,b)=>a.date.localeCompare(b.date))
        };
      });

      if (parsed.blood_group) updates.blood_group = parsed.blood_group;

      setEditData(d => ({
        ...d,
        lab_data: { ...(d.lab_data||{}), ...updates },
        lab_extras_v2: newExtras,
        ...(parsed.blood_group && { blood_group: parsed.blood_group }),
      }));
    } catch(e) {
      setInferError("Couldn't read the report. Try a clearer image.");
    }
    setInferring(false);
  };

  const CORE_TESTS = [
    { key:"hemoglobin",          label:"Haemoglobin",    unit:"g/dL",  range:[11,14] },
    { key:"tsh",                 label:"TSH",            unit:"mIU/L", range:[0.1,4] },
    { key:"blood_sugar_fasting", label:"Blood Sugar (F)", unit:"mg/dL", range:[70,95] },
    { key:"blood_sugar_pp",      label:"Blood Sugar (PP)",unit:"mg/dL", range:[70,140] },
  ];

  return (
    <>
      {!hideTitle && <div className="pedit-title">Lab <em>results</em></div>}

      {/* ── PREMIUM AI CARD ── */}
      <div className="lab-premium-card">
        <div className="lab-premium-glow"/>
        <div className="lab-premium-glow2"/>
        <div className="lab-premium-badge">✦ Smart read</div>
        <div className="lab-premium-title">Let Matri <em>read</em> your report</div>
        <div className="lab-premium-sub">Upload a photo or PDF — values get added to your test history automatically.</div>

        <div className={`lab-upload-zone-dark${file?" has-file":""}`} onClick={() => fileRef.current?.click()}>
          <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{display:"none"}} onChange={handleFile}/>
          {file
            ? <><div style={{fontSize:18,marginBottom:3}}>📄</div><div style={{fontSize:12,fontWeight:600,color:"rgba(200,160,255,0.9)"}}>{file.name}</div><div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:2}}>Tap to change</div></>
            : <><div style={{fontSize:18,marginBottom:3}}>📎</div><div style={{fontSize:12,fontWeight:500,color:"rgba(255,255,255,0.5)"}}>Attach lab report</div><div style={{fontSize:10,color:"rgba(255,255,255,0.28)",marginTop:2}}>Photo or PDF</div></>
          }
        </div>

        <button className="lab-infer-btn" onClick={inferFromReport} disabled={inferring || !file}>
          {inferring ? <><span>⏳</span> Reading your report…</> : <><span>✦</span> Read & add to history</>}
        </button>

        {inferError && <div style={{fontSize:11,color:"#ff9090",marginTop:10,textAlign:"center"}}>{inferError}</div>}
        {inferred?.summary && (
          <div className="lab-infer-result">
            <div className="lab-infer-title">✦ Matri's read</div>
            {inferred.summary}
          </div>
        )}
      </div>

      {/* ── CORE TEST TIMELINES ── */}
      <div className="lab-divider">
        <div className="lab-divider-line"/>
        <div className="lab-divider-text">test history</div>
        <div className="lab-divider-line"/>
      </div>

      {CORE_TESTS.map(t => (
        <LabTimelineRow
          key={t.key}
          name={t.label}
          unit={t.unit}
          entries={labData[t.key] || []}
          normalRange={t.range}
          onAdd={entry => addEntry(t.key, entry)}
          onRemove={idx => removeEntry(t.key, idx)}
        />
      ))}

      {/* ── EXTRA TESTS ── */}
      {Object.entries(labExtras).filter(([,d]) => d?.entries?.length > 0).map(([name, data]) => (
        <LabTimelineRow
          key={name}
          name={name}
          unit={data.unit}
          entries={data.entries || []}
          normalRange={null}
          onAdd={entry => addExtraEntry(name, entry)}
          onRemove={idx => removeExtraEntry(name, idx)}
        />
      ))}

      {/* Add new extra test */}
      {showAddExtra ? (
        <div style={{background:"var(--amber-pale)",border:"1px solid var(--amber-bdr)",borderRadius:14,padding:14,marginTop:4}}>
          <div className="pedit-label" style={{marginBottom:8}}>New test</div>
          <div style={{display:"flex",gap:8,marginBottom:8}}>
            <input className="pedit-input" placeholder="Test name (e.g. Ferritin)" value={newExtraName} onChange={e=>setNewExtraName(e.target.value)} style={{flex:2}}/>
            <input className="pedit-input" placeholder="Unit" value={newExtraUnit} onChange={e=>setNewExtraUnit(e.target.value)} style={{flex:1}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="lab-add-confirm" style={{flex:1,borderRadius:100,padding:"10px"}} onClick={addNewExtra}>Add test</button>
            <button onClick={()=>setShowAddExtra(false)} style={{flex:1,background:"transparent",border:"1.5px solid var(--bdr)",borderRadius:100,padding:"10px",fontSize:12,cursor:"pointer",fontFamily:"inherit",color:"var(--muted)"}}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={()=>setShowAddExtra(true)} style={{width:"100%",padding:"10px",background:"transparent",border:"1.5px dashed var(--bdr)",borderRadius:12,fontSize:12,fontWeight:600,color:"var(--muted)",cursor:"pointer",fontFamily:"inherit",marginTop:4}}>
          + Add another test
        </button>
      )}
    </>
  );
}

/* ─── TEST SUGGESTIONS STRIP ─────────────────────────────────────────────── */
export const TRIMESTER_TESTS = {
  1: [
    { id:"hb",    icon:"🩸", name:"HB test",      week:"Wk 8-10",  urgent:true,
      what:"A complete blood count to check haemoglobin levels.", why:"Anaemia is common in early pregnancy and can cause fatigue and affect the baby's growth.", normal:"HB should be above 11 g/dL in pregnancy.", expect:"A simple blood draw, usually at a lab. Results within 24 hours.", ifAbnormal:"Low HB means iron supplements and diet changes. Very low levels may need IV iron." },
    { id:"tsh",   icon:"🦋", name:"TSH",           week:"Wk 8-10",  urgent:true,
      what:"Thyroid stimulating hormone test.", why:"Thyroid disorders are common and can affect baby's brain development if untreated.", normal:"TSH should be between 0.1–2.5 mIU/L in first trimester.", expect:"Blood draw, results within 24–48 hours.", ifAbnormal:"Hypothyroidism is managed with Thyronorm. Hyperthyroidism needs specialist care." },
    { id:"urine", icon:"🧫", name:"Urine test",    week:"Wk 8-12",  urgent:false,
      what:"Checks for UTI, protein, and glucose in urine.", why:"UTIs are very common in pregnancy and can cause premature labour if untreated.", normal:"Should show no significant bacteria, protein, or glucose.", expect:"Simple urine sample, results within a day.", ifAbnormal:"If UTI found, antibiotics safe in pregnancy are prescribed." },
    { id:"blood_grp", icon:"🩺", name:"Blood group", week:"First visit", urgent:true,
      what:"Blood group and Rh factor test.", why:"Critical if you are Rh negative — you may need anti-D injections during pregnancy.", normal:"Any blood group is normal. Rh factor is either positive or negative.", expect:"Simple blood draw, usually done at first antenatal visit.", ifAbnormal:"If Rh negative, your doctor will monitor antibody levels and give anti-D at key points." },
    { id:"double", icon:"🧬", name:"Double marker", week:"Wk 11-13",  urgent:false,
      what:"Blood test screening for chromosomal conditions.", why:"Along with NT scan, helps assess risk of Down syndrome and other conditions.", normal:"Risk ratio below 1:250 is generally considered low risk.", expect:"A blood draw, combined with NT scan measurements for final risk score.", ifAbnormal:"A high risk result leads to further testing like NIPT — it is not a diagnosis." },
  ],
  2: [
    { id:"gdm",   icon:"🍬", name:"GDM test",      week:"Wk 24-28", urgent:true,
      what:"Glucose challenge test to screen for gestational diabetes.", why:"GDM affects 10–14% of Indian pregnancies and can cause large baby, difficult birth, and complications.", normal:"Fasting glucose below 92 mg/dL; 1-hour below 180 mg/dL.", expect:"Usually a fasting blood draw, then drink a glucose solution, then another blood draw after 1–2 hours.", ifAbnormal:"Diet, exercise, and sometimes insulin. Managed carefully for rest of pregnancy." },
    { id:"hb2",   icon:"🩸", name:"HB repeat",     week:"Wk 24-28", urgent:false,
      what:"Repeat haemoglobin check mid-pregnancy.", why:"Iron deficiency often worsens in the second trimester as baby's demands increase.", normal:"Should be above 11 g/dL.", expect:"Simple blood draw.", ifAbnormal:"Iron supplements dosage may be increased. IV iron occasionally needed." },
    { id:"urine2",icon:"🧫", name:"Urine test",     week:"Wk 24-28", urgent:false,
      what:"Repeat urine test for protein and glucose.", why:"Protein in urine mid-pregnancy can be an early sign of pre-eclampsia.", normal:"No significant protein or glucose.", expect:"Simple urine sample.", ifAbnormal:"Protein detected triggers further monitoring for pre-eclampsia risk." },
  ],
  3: [
    { id:"gbs",   icon:"🧬", name:"GBS swab",      week:"Wk 35-37", urgent:false,
      what:"Group B Streptococcus swab test.", why:"GBS can be passed to baby during birth and cause serious infection.", normal:"Most women are GBS negative.", expect:"Vaginal and rectal swab, quick and painless.", ifAbnormal:"If positive, IV antibiotics given during labour — protects the baby effectively." },
    { id:"hb3",   icon:"🩸", name:"HB repeat",     week:"Wk 34-36", urgent:true,
      what:"Final haemoglobin check before delivery.", why:"Low HB before birth increases risk of complications during delivery.", normal:"Should be above 11 g/dL.", expect:"Simple blood draw.", ifAbnormal:"May need IV iron or in severe cases, blood transfusion before delivery." },
    { id:"urine3",icon:"🧫", name:"Urine test",     week:"Wk 36-40", urgent:false,
      what:"Final urine check for protein.", why:"Pre-eclampsia can develop late in pregnancy — protein in urine is a key warning sign.", normal:"No significant protein.", expect:"Simple urine sample at each antenatal visit.", ifAbnormal:"Immediate monitoring and possible early delivery may be recommended." },
  ],
};

export function TestDetailPanel({ test, onClose, isDone, onMarkComplete }) {
  const [vis, setVis] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDetail, setAiDetail]   = useState(null);

  useEffect(() => { requestAnimationFrame(() => setVis(true)); }, []);
  const close = () => { setVis(false); setTimeout(onClose, 350); };

  const askAI = async () => {
    setAiLoading(true);
    try {
      const resp = await authFetch("/api/chat", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          system:"You are Matri, a warm pregnancy companion. Answer in simple, reassuring language. Be concise — 3-4 sentences max per point.",
          messages:[{ role:"user", content:`Tell me more about the ${test.name} test during pregnancy in the Indian context. Include: what to eat/avoid before the test, which types of labs in India offer it, approximate cost range, and one thing most women worry about that is actually fine. Keep it warm and practical.` }]
        })
      });
      const data = await resp.json();
      setAiDetail(data.content?.[0]?.text || "");
    } catch(e) { setAiDetail("Couldn't load extra details right now. Try again in a moment."); }
    setAiLoading(false);
  };

  return (
    <>
      <div className={`test-detail-backdrop${vis?" open":""}`} onClick={close}/>
      <div className={`test-detail-sheet${vis?" open":""}`}>
        <div className="pedit-handle" style={{margin:"16px auto 0"}}/>
        <div className="test-detail-hero">
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:4}}>
            <div style={{width:48,height:48,borderRadius:14,background:"var(--amber-pale)",border:"1px solid var(--amber-bdr)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{test.icon}</div>
            <div>
              <div style={{fontFamily:"'Lora',serif",fontSize:20,color:"var(--ink)",lineHeight:1.2}}>{test.name}</div>
              <div style={{fontSize:11,color:"var(--muted)",marginTop:3}}>{test.week} · {test.urgent?"⚡ Recommended now":"Upcoming"}</div>
            </div>
          </div>
        </div>
        <div className="test-detail-body">
          {[["What is this?",test.what],["Why it matters",test.why],["Normal range",test.normal],["What to expect",test.expect],["If results are abnormal",test.ifAbnormal]].map(([title,text])=>(
            <div className="test-detail-section" key={title}>
              <div className="test-detail-section-title">{title}</div>
              <div className="test-detail-text">{text}</div>
            </div>
          ))}
          {!aiDetail ? (
            <button onClick={askAI} disabled={aiLoading} style={{width:"100%",padding:"13px",background:"var(--teal-pale)",border:"1px solid var(--teal-bdr)",borderRadius:16,fontSize:13,fontWeight:600,color:"var(--teal)",cursor:"pointer",fontFamily:"inherit",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              {aiLoading?"✨ Loading…":"✨ Ask Matri for more details"}
            </button>
          ) : (
            <div style={{background:"var(--teal-pale)",border:"1px solid var(--teal-bdr)",borderRadius:16,padding:16,marginBottom:16}}>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:"var(--teal)",marginBottom:8}}>✨ Matri's tips</div>
              <div style={{fontSize:13,color:"var(--ink)",lineHeight:1.65}}>{aiDetail}</div>
            </div>
          )}
          {/* Mark done / Book */}
          <div style={{display:"flex",gap:10,marginTop:4}}>
            {!isDone && onMarkComplete && (
              <button
                onClick={() => { onMarkComplete(test.id); close(); }}
                style={{flex:1,padding:"13px",background:"var(--teal)",border:"none",borderRadius:100,fontSize:13,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}
              >✓ Mark as done</button>
            )}
            <div className="test-book-soon" style={{flex:1}}>📅 Book — coming soon</div>
          </div>
        </div>
      </div>
    </>
  );
}

export function TestSuggestionsStrip({ week = 8, completedTests = {}, onMarkComplete }) {
  const trimester = week <= 13 ? 1 : week <= 26 ? 2 : 3;
  const tests = TRIMESTER_TESTS[trimester] || [];
  const [selected, setSelected] = useState(null);
  return (
    <>
      <div className="test-strip">
        {tests.map(t => {
          const done = !!completedTests[t.id];
          return (
            <div key={t.id} className={`test-chip${t.urgent&&!done?" due":""}`}
              style={done?{opacity:0.5,background:"var(--cream2)"}:{}}
              onClick={() => setSelected(t)}>
              <div className="test-chip-icon">{done?"✓":t.icon}</div>
              <div className="test-chip-name">{t.name}</div>
              <div className="test-chip-week">{done?"Done":t.week}</div>
            </div>
          );
        })}
      </div>
      {selected && (
        <TestDetailPanel
          test={selected}
          isDone={!!completedTests[selected.id]}
          onMarkComplete={onMarkComplete}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

/* ─── DOCTOR INSIGHT ─────────────────────────────────────────────────────── */
export function DoctorInsight({ profile }) {
  const p = profile || {};
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);

  // Build a cache key from health data so we re-generate if data changes
  const cacheKey = JSON.stringify({
    rx: (p.prescriptions||[]).map(r=>r.name),
    cond: p.conditions,
    bg: p.blood_group,
    hb: p.lab_data?.hemoglobin?.slice(-1),
    tsh: p.lab_data?.tsh?.slice(-1),
    notes: p.visit_notes?.slice(0,50),
  });

  useEffect(() => {
    // Only generate if there's something to work with
    const hasData = (p.prescriptions||[]).length > 0
      || (p.conditions||[]).length > 0
      || p.lab_data?.hemoglobin?.length
      || p.visit_notes;
    if (!hasData) return;

    // Check sessionStorage cache first
    const cached = sessionStorage.getItem("matri_doc_insight_" + cacheKey);
    if (cached) { setInsight(JSON.parse(cached)); return; }

    setLoading(true);
    const context = [
      p.conditions?.length ? `Conditions: ${p.conditions.join(", ")}` : null,
      p.blood_group ? `Blood group: ${p.blood_group}` : null,
      (p.prescriptions||[]).length ? `Prescribed medicines: ${p.prescriptions.map(r=>`${r.name}${r.dosage?" "+r.dosage:""}`).join(", ")}` : null,
      p.lab_data?.hemoglobin?.length ? `HB: ${p.lab_data.hemoglobin.slice(-1)[0]?.value} g/dL` : null,
      p.lab_data?.tsh?.length ? `TSH: ${p.lab_data.tsh.slice(-1)[0]?.value} mIU/L` : null,
      p.visit_notes ? `Doctor's notes: "${p.visit_notes}"` : null,
    ].filter(Boolean).join(". ");

    authFetch("/api/chat", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        system: "You are Matri, a pregnancy wellness companion. Return ONLY a JSON array of 2-3 short insight strings (max 5 words each) summarising the woman's health status from her medical data. Focus on overall wellbeing, not medicine names. Examples: 'Iron levels low', 'Thyroid being monitored', 'Blood pressure normal'. No markdown, pure JSON array.",
        messages:[{ role:"user", content:`Health data for week ${p.week||8} pregnancy: ${context}` }]
      })
    })
    .then(r=>r.json())
    .then(data => {
      const text = data.content?.[0]?.text || "[]";
      const bullets = JSON.parse(text.replace(/```json|```/g,"").trim());
      setInsight(bullets);
      sessionStorage.setItem("matri_doc_insight_" + cacheKey, JSON.stringify(bullets));
    })
    .catch(() => setInsight(null))
    .finally(() => setLoading(false));
  }, [cacheKey]);

  if (loading) return (
    <div style={{fontSize:9,color:"var(--muted)",fontStyle:"italic"}}>✨ Generating insight…</div>
  );

  if (!insight?.length) {
    // Fallback — show visit notes trimmed if no AI insight
    return p.visit_notes ? (
      <div style={{fontSize:10,color:"var(--muted)",fontStyle:"italic",lineHeight:1.4,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
        "{p.visit_notes}"
      </div>
    ) : null;
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:3,maxHeight:54,overflow:"hidden"}}>
      {insight.map((b, i) => (
        <div key={i} style={{display:"flex",alignItems:"center",gap:5}}>
          <div style={{width:3,height:3,borderRadius:"50%",background:"var(--navy)",flexShrink:0,marginTop:1}}/>
          <span style={{fontSize:10,color:"var(--navy)",fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{b}</span>
        </div>
      ))}
    </div>
  );
}
