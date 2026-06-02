import React, { useState, useRef } from 'react';
import { parseMed, humanSchedule, mealTiming } from '../../utils/medical';
import { TestSuggestionsStrip } from './LabComponents';
import { MILESTONES } from '../../constants/milestones';

// Used on both home (This Week) and profile page — same component, same data
/* ─── MEDICINE CARD ──────────────────────────────────────────────────────── */
export function MedicineCard({ med: rawMed, compact = false, onEdit, onPause, onDelete }) {
  const med      = parseMed(rawMed);
  const schedule = humanSchedule(med.frequency);
  const meal     = mealTiming(med);
  const [menuOpen, setMenuOpen] = useState(false);
  const isPaused = med.paused === true;

  if (compact) {
    return (
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:"1px solid var(--bdr)"}}>
        <div style={{width:26,height:26,borderRadius:8,background:isPaused?"var(--cream2)":"var(--rose-pale)",border:`1px solid ${isPaused?"var(--bdr)":"var(--rose-bdr)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0,opacity:isPaused?0.5:1}}>💊</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:11,fontWeight:600,color:isPaused?"var(--muted)":"var(--ink)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textDecoration:isPaused?"line-through":undefined}}>{med.name}</div>
          {isPaused
            ? <div style={{fontSize:9,color:"var(--muted)"}}>Paused{med.pause_reason?` · ${med.pause_reason}`:""}</div>
            : med.dosage && <div style={{fontSize:9,color:"var(--muted)"}}>{med.dosage}</div>
          }
        </div>
        {isPaused
          ? <div style={{fontSize:9,fontWeight:600,color:"var(--muted)",background:"var(--cream2)",borderRadius:100,padding:"2px 7px",flexShrink:0}}>Paused</div>
          : schedule && <div style={{fontSize:9,fontWeight:600,color:"var(--rose)",background:"var(--rose-pale)",borderRadius:100,padding:"2px 7px",flexShrink:0}}>{schedule.times}</div>
        }
      </div>
    );
  }

  return (
    <div style={{background:isPaused?"var(--cream2)":"#fff",border:`1px solid ${isPaused?"var(--bdr)":"var(--bdr)"}`,borderRadius:16,padding:"14px 16px",marginBottom:10,opacity:isPaused?0.75:1,position:"relative",zIndex:menuOpen?10:1}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:schedule&&!isPaused?10:0}}>
        <div style={{width:36,height:36,borderRadius:10,background:isPaused?"var(--cream2)":"var(--rose-pale)",border:`1px solid ${isPaused?"var(--bdr)":"var(--rose-bdr)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>💊</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:600,color:"var(--ink)",lineHeight:1.2,marginBottom:2,textDecoration:isPaused?"line-through":undefined}}>{med.name}</div>
          {med.dosage && <div style={{fontSize:11,color:"var(--muted)"}}>{med.dosage}</div>}
          {isPaused && med.pause_reason && (
            <div style={{fontSize:11,color:"var(--amber)",marginTop:2,fontStyle:"italic"}}>{med.pause_reason}</div>
          )}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          {isPaused
            ? <div style={{fontSize:9,fontWeight:700,color:"var(--muted)",background:"var(--cream2)",border:"1px solid var(--bdr)",borderRadius:100,padding:"3px 10px"}}>Paused</div>
            : <div style={{fontSize:9,fontWeight:700,color:"var(--teal)",background:"var(--teal-pale)",border:"1px solid var(--teal-bdr)",borderRadius:100,padding:"3px 10px"}}>Active</div>
          }
          {/* ••• menu */}
          {(onEdit || onPause || onDelete) && (
            <div style={{position:"relative"}}>
              <button
                onClick={e=>{e.stopPropagation();setMenuOpen(o=>!o);}}
                style={{width:28,height:28,borderRadius:"50%",background:"transparent",border:"none",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--muted)",fontFamily:"inherit",letterSpacing:2}}
              >•••</button>
              {menuOpen && (
                <>
                  {/* click-outside trap */}
                  <div style={{position:"fixed",inset:0,zIndex:10}} onClick={()=>setMenuOpen(false)}/>
                  <div style={{position:"absolute",right:0,top:32,zIndex:50,background:"#fff",border:"1px solid var(--bdr)",borderRadius:14,boxShadow:"0 8px 24px rgba(0,0,0,0.12)",overflow:"hidden",minWidth:140}}>
                    {onEdit && (
                      <button onClick={e=>{e.stopPropagation();setMenuOpen(false);onEdit(med);}}
                        style={{width:"100%",padding:"11px 16px",background:"none",border:"none",textAlign:"left",fontSize:13,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:8,color:"var(--ink)"}}>
                        ✏️ Edit details
                      </button>
                    )}
                    {onPause && (
                      <button onClick={e=>{e.stopPropagation();setMenuOpen(false);onPause(med);}}
                        style={{width:"100%",padding:"11px 16px",background:"none",border:"none",textAlign:"left",fontSize:13,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:8,color:isPaused?"var(--teal)":"var(--amber)",borderTop:"1px solid var(--bdr)"}}>
                        {isPaused?"▶ Resume medicine":"⏸ Pause medicine"}
                      </button>
                    )}
                    {onDelete && (
                      <button onClick={e=>{e.stopPropagation();setMenuOpen(false);onDelete(med);}}
                        style={{width:"100%",padding:"11px 16px",background:"none",border:"none",textAlign:"left",fontSize:13,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:8,color:"var(--rose)",borderTop:"1px solid var(--bdr)"}}>
                        🗑 Remove
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      {!isPaused && schedule && (
        <div style={{background:"var(--cream2)",borderRadius:12,padding:"10px 12px",display:"flex",gap:0,flexWrap:"wrap"}}>
          {[
            ["Frequency", schedule.times],
            schedule.when ? ["When", schedule.when] : null,
            meal ? ["With meals", meal] : null,
            med.duration ? ["Duration", med.duration] : null,
          ].filter(Boolean).map(([label, val], i) => (
            <div key={label} style={{display:"flex",flexDirection:"column",gap:1,paddingLeft:i>0?12:0,marginLeft:i>0?12:0,borderLeft:i>0?"1px solid var(--bdr)":"none",marginBottom:4}}>
              <span style={{fontSize:9,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--muted)"}}>{label}</span>
              <span style={{fontSize:12,fontWeight:600,color:"var(--ink)"}}>{val}</span>
            </div>
          ))}
        </div>
      )}
      {!isPaused && med.notes && (
        <div style={{fontSize:11,color:"var(--muted)",marginTop:8,fontStyle:"italic",lineHeight:1.5}}>{med.notes}</div>
      )}
      {/* Reminder toggle — coming soon */}
      {!isPaused && (
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10,paddingTop:10,borderTop:"1px solid var(--cream2)"}}>
          <div style={{fontSize:10,color:"var(--muted)",flex:1}}>🔔 Reminders</div>
          <div style={{fontSize:9,fontWeight:600,color:"var(--muted)",background:"var(--cream2)",border:"1px solid var(--bdr)",borderRadius:100,padding:"2px 8px"}}>Coming soon</div>
        </div>
      )}
    </div>
  );
}

export function MedHealthWidget({ profile, onEditHealth, compact = false, onMedsUpdate, onPause, onEdit, onDelete }) {
  const p = profile || {};
  const allMeds = (p.medications || []).map(parseMed);
  const activeMeds = allMeds.filter(m => m.active !== false && !m.paused);
  const pausedMeds = allMeds.filter(m => m.paused === true);
  const hasMeds = allMeds.filter(m => m.active !== false).length > 0;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetVis,  setSheetVis]  = useState(false);
  const openSheet  = (e) => { e?.stopPropagation(); setSheetOpen(true);  requestAnimationFrame(()=>setSheetVis(true)); };
  const closeSheet = () => { setSheetVis(false); setTimeout(()=>setSheetOpen(false), 350); };

  // liveProfile uses the prop directly — mutations are handled by App via appMedHandlers
  const liveProfile = p;

  if (compact) {
    return (
      <>
        <div className="w w-left wc-rose w-sm" style={{cursor:"pointer"}} onClick={openSheet}>
          <span className="w-bg-e" style={{color:"var(--rose)",fontSize:60}}>💊</span>
          <div className="win">
            <div className="w-lbl" style={{color:"var(--rose)",marginBottom:6}}>
              <div className="w-lbl-dot" style={{background:"var(--rose)"}}/>Health &amp; Meds
            </div>
            {p.blood_group && (
              <div style={{fontFamily:"'Lora',serif",fontSize:18,color:"var(--rose)",lineHeight:1,marginBottom:4}}>{p.blood_group}</div>
            )}
            {hasMeds ? (
              <div style={{fontSize:11,color:"var(--ink)",fontWeight:600}}>
                {activeMeds.length} medicine{activeMeds.length!==1?"s":""}
                {pausedMeds.length>0&&<span style={{color:"var(--muted)",fontWeight:400}}> · {pausedMeds.length} paused</span>}
              </div>
            ) : (
              <div style={{fontSize:10,color:"var(--muted)",lineHeight:1.4}}>Add prescriptions in profile</div>
            )}
            {(p.conditions||[]).length > 0 && (
              <div style={{marginTop:5,display:"flex",flexWrap:"wrap",gap:3}}>
                {p.conditions.slice(0,2).map(c=>(
                  <span key={c} style={{fontSize:9,background:"var(--rose-pale)",color:"var(--rose)",border:"1px solid var(--rose-bdr)",borderRadius:100,padding:"1px 6px"}}>{c}</span>
                ))}
              </div>
            )}
          </div>
          <div className="w-tap w-tap-dk">View ↗</div>
        </div>

        {sheetOpen && (
          <>
            <div style={{position:"fixed",inset:0,zIndex:200,background:sheetVis?"rgba(16,10,8,0.78)":"rgba(16,10,8,0)",transition:"background 0.3s",pointerEvents:sheetVis?"all":"none"}} onClick={closeSheet}/>
            <div style={{position:"fixed",bottom:0,left:0,right:0,width:"100%",maxWidth:430,margin:"0 auto",zIndex:201,background:"var(--cream)",borderRadius:"28px 28px 0 0",transform:`translateY(${sheetVis?0:102}%)`,transition:"transform 0.36s cubic-bezier(0.3,0.72,0,1)",maxHeight:"85vh",display:"flex",flexDirection:"column"}}>
              <div style={{padding:"20px 20px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid var(--bdr)",flexShrink:0}}>
                <div>
                  <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color:"var(--rose)",marginBottom:4}}>Health &amp; Medicines</div>
                  <div style={{fontFamily:"'Lora',serif",fontSize:20,color:"var(--ink)"}}>Your <em style={{fontStyle:"italic"}}>health snapshot</em></div>
                </div>
                <button onClick={closeSheet} style={{width:34,height:34,borderRadius:"50%",background:"var(--cream2)",border:"none",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--muted)",fontFamily:"inherit"}}>✕</button>
              </div>
              <div style={{overflowY:"auto",padding:"18px 20px 48px",scrollbarWidth:"none",flex:1}}>
                <MedHealthWidgetFull
                  profile={liveProfile}
                  onEditHealth={onEditHealth}
                  onClose={closeSheet}
                  onPause={onPause}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </div>
            </div>
          </>
        )}
      </>
    );
  }

  return (
    <MedHealthWidgetFull
      profile={liveProfile}
      onEditHealth={onEditHealth}
      onPause={onPause}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}

/* ── MedDialogs — rendered outside any sheet/stacking context ─────────────── */
export function MedDialogs({ pauseMed, setPauseMed, confirmPause, editMed, setEditMed, confirmEdit, deleteMed, setDeleteMed, confirmDelete }) {
  if (!pauseMed && !editMed && !deleteMed) return null;
  return (
    <>
      {pauseMed && (
        <>
          <div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(16,10,8,0.6)"}} onClick={()=>setPauseMed(null)}/>
          <div style={{position:"fixed",bottom:0,left:0,right:0,width:"100%",maxWidth:430,margin:"0 auto",zIndex:501,background:"#fff",borderRadius:"24px 24px 0 0",padding:"24px 20px 40px"}}>
            <div style={{fontFamily:"'Lora',serif",fontSize:20,color:"var(--ink)",marginBottom:6}}>Pause <em>{pauseMed.name}?</em></div>
            <div style={{fontSize:12,color:"var(--muted)",marginBottom:16,lineHeight:1.6}}>The medicine will be marked as paused. Your doctor can resume it when ready.</div>
            <div style={{fontSize:11,fontWeight:700,color:"var(--ink)",marginBottom:8}}>Reason (optional)</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:14}}>
              {["Ran out","About to run out","Travelling","Doctor said stop","Side effects","Other"].map(r=>(
                <button key={r} onClick={()=>setPauseMed(m=>({...m,reason:r}))}
                  style={{borderRadius:100,padding:"6px 13px",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",border:`1.5px solid ${pauseMed.reason===r?"var(--rose)":"var(--bdr)"}`,background:pauseMed.reason===r?"var(--rose-pale)":"#fff",color:pauseMed.reason===r?"var(--rose)":"var(--muted)"}}>
                  {r}
                </button>
              ))}
            </div>
            {(pauseMed.reason==="Ran out"||pauseMed.reason==="About to run out") && (
              <div style={{background:"var(--amber-pale)",border:"1px solid var(--amber-bdr)",borderRadius:12,padding:"10px 14px",fontSize:11,color:"var(--amber)",marginBottom:14,lineHeight:1.5}}>
                ⚠️ A reminder will show on your home screen so you don't forget to let your doctor know.
              </div>
            )}
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setPauseMed(null)} style={{flex:1,padding:"13px",background:"transparent",border:"1.5px solid var(--bdr)",borderRadius:100,fontSize:14,cursor:"pointer",fontFamily:"inherit",color:"var(--muted)"}}>Cancel</button>
              <button onClick={confirmPause} style={{flex:2,padding:"13px",background:"var(--amber)",border:"none",borderRadius:100,fontSize:14,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>
                Pause {pauseMed.name.split(" ")[0]}
              </button>
            </div>
          </div>
        </>
      )}
      {editMed && (
        <>
          <div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(16,10,8,0.6)"}} onClick={()=>setEditMed(null)}/>
          <div style={{position:"fixed",bottom:0,left:0,right:0,width:"100%",maxWidth:430,margin:"0 auto",zIndex:501,background:"#fff",borderRadius:"24px 24px 0 0",padding:"24px 20px 40px"}}>
            <div style={{fontFamily:"'Lora',serif",fontSize:20,color:"var(--ink)",marginBottom:16}}>Edit <em>{editMed._origName}</em></div>
            {[["Dosage","dosage","e.g. 500mg"],["Frequency","frequency","e.g. twice daily"],["Duration","duration","e.g. 30 days"]].map(([lbl,key,ph])=>(
              <div key={key} style={{marginBottom:12}}>
                <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",color:"var(--muted)",marginBottom:5}}>{lbl}</div>
                <input className="pedit-input" value={editMed[key]||""} placeholder={ph} onChange={e=>setEditMed(m=>({...m,[key]:e.target.value}))}/>
              </div>
            ))}
            <div style={{marginBottom:16}}>
              <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",color:"var(--muted)",marginBottom:5}}>Notes</div>
              <textarea className="pedit-input" rows={2} value={editMed.notes||""} placeholder="Special instructions…" onChange={e=>setEditMed(m=>({...m,notes:e.target.value}))} style={{resize:"none"}}/>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setEditMed(null)} style={{flex:1,padding:"13px",background:"transparent",border:"1.5px solid var(--bdr)",borderRadius:100,fontSize:14,cursor:"pointer",fontFamily:"inherit",color:"var(--muted)"}}>Cancel</button>
              <button onClick={confirmEdit} style={{flex:2,padding:"13px",background:"var(--teal)",border:"none",borderRadius:100,fontSize:14,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>Save changes ✓</button>
            </div>
          </div>
        </>
      )}
      {deleteMed && (
        <>
          <div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(16,10,8,0.6)"}} onClick={()=>setDeleteMed(null)}/>
          <div style={{position:"fixed",bottom:0,left:0,right:0,width:"100%",maxWidth:430,margin:"0 auto",zIndex:501,background:"#fff",borderRadius:"24px 24px 0 0",padding:"24px 20px 40px"}}>
            <div style={{fontFamily:"'Lora',serif",fontSize:20,color:"var(--ink)",marginBottom:8}}>Remove <em>{deleteMed.name}?</em></div>
            <div style={{fontSize:12,color:"var(--muted)",marginBottom:20,lineHeight:1.65}}>This will remove the medicine from your tracker. This cannot be undone.</div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setDeleteMed(null)} style={{flex:1,padding:"13px",background:"transparent",border:"1.5px solid var(--bdr)",borderRadius:100,fontSize:14,cursor:"pointer",fontFamily:"inherit",color:"var(--muted)"}}>Cancel</button>
              <button onClick={confirmDelete} style={{flex:2,padding:"13px",background:"var(--rose)",border:"none",borderRadius:100,fontSize:14,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>Yes, remove</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// The actual full content — pure display, no dialog state
export function MedHealthWidgetFull({ profile, onEditHealth, onClose, onPause, onEdit, onDelete }) {
  const p = profile || {};
  const activeMeds = (p.medications || []).map(parseMed).filter(m => m.active !== false && !m.paused);
  const pausedMeds = (p.medications || []).map(parseMed).filter(m => m.paused === true);
  const hasMeds    = (p.medications || []).map(parseMed).filter(m => m.active !== false).length > 0;
  const hasHealth  = p.blood_group || (p.conditions||[]).length > 0;

  return (
    <div>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div className="w-lbl" style={{color:"var(--rose)",marginBottom:0}}>
          <div className="w-lbl-dot" style={{background:"var(--rose)"}}/>Health &amp; Medicines
        </div>
        {onEditHealth && (
          <button style={{fontSize:10,fontWeight:600,color:"var(--rose)",background:"var(--rose-pale)",border:"none",borderRadius:100,padding:"3px 10px",cursor:"pointer",fontFamily:"inherit"}}
            onClick={onEditHealth}>{hasHealth||hasMeds?"Edit":"+ Add"}</button>
        )}
      </div>

      {/* Blood group + conditions */}
      {hasHealth && (
        <div style={{marginBottom:hasMeds?10:0}}>
          {p.blood_group && (
            <div style={{display:"flex",alignItems:"baseline",gap:5,marginBottom:4}}>
              <span style={{fontFamily:"'Lora',serif",fontSize:17,color:"var(--ink)"}}>
                Blood group <em style={{fontStyle:"italic",color:"var(--rose)"}}>{p.blood_group}</em>
              </span>
            </div>
          )}
          {(p.conditions||[]).length > 0 && (
            <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:4}}>
              {p.conditions.map(c => (
                <span key={c} className="chip" style={{background:"var(--rose-pale)",color:"var(--rose)",border:"1px solid var(--rose-bdr)"}}>{c}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active medicines */}
      {activeMeds.length > 0 && (
        <div style={{marginBottom:8}}>
          {activeMeds.map((med, i) => (
            <MedicineCard key={i} med={med} compact={false}
              onEdit={onEdit}
              onPause={onPause}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* Paused medicines */}
      {pausedMeds.length > 0 && (
        <div>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",color:"var(--muted)",marginBottom:6,marginTop:4}}>Paused</div>
          {pausedMeds.map((med, i) => (
            <MedicineCard key={i} med={med} compact={false}
              onEdit={onEdit}
              onPause={onPause}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {!hasMeds && !hasHealth && (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"8px 0"}}>
          <div style={{fontSize:12,color:"var(--muted)",lineHeight:1.5,textAlign:"center"}}>
            Add your blood group, conditions and prescriptions for personalised health tracking
          </div>
          <div style={{fontSize:11,fontWeight:600,color:"var(--rose)",marginTop:2}}>+ Add health info</div>
        </div>
      )}
      {!hasMeds && hasHealth && (
        <div style={{fontSize:11,color:"var(--muted)",marginTop:6,fontStyle:"italic"}}>Upload a prescription in profile to track medicines here</div>
      )}
    </div>
  );
}



export function MedPanel({ profileData, completedTests = {}, onMarkTestComplete, onRxUpload, onPause, onEdit, onDelete }) {
  const p = profileData || {};
  const allMeds = (p.medications || []).map(parseMed).filter(m => m.active !== false);
  const activeMeds = allMeds.filter(m => !m.paused);
  const pausedMeds = allMeds.filter(m => m.paused);

  const upcomingScans = MILESTONES.filter(m => !m.done && !m.current && (m.name||"").toLowerCase().includes("scan"));

  return <>

    {/* ── TESTS THIS TRIMESTER ── */}
    <div className="p-lbl" style={{color:"var(--navy)"}}>Tests this trimester</div>
    <div style={{marginBottom:16}} onClick={e=>e.stopPropagation()}>
      <TestSuggestionsStrip week={8} completedTests={completedTests} onMarkComplete={onMarkTestComplete}/>
    </div>

    {/* ── UPCOMING SCANS ── */}
    {upcomingScans.length > 0 && <>
      <div className="p-lbl" style={{color:"#6090c8"}}>Upcoming scans</div>
      <div style={{marginBottom:16}}>
        {upcomingScans.map((scan, i) => (
          <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",background:"rgba(96,144,200,0.07)",border:"1px solid rgba(96,144,200,0.15)",borderRadius:14,marginBottom:8}}>
            <span style={{fontSize:22,flexShrink:0}}>🔬</span>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:"var(--ink)"}}>{scan.name}</div>
              <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>Week {scan.wk}</div>
            </div>
            <div style={{fontSize:10,color:"rgba(96,144,200,0.7)",fontWeight:600,background:"rgba(96,144,200,0.1)",borderRadius:100,padding:"3px 9px",flexShrink:0}}>Upcoming</div>
          </div>
        ))}
      </div>
    </>}

    {/* ── MEDICINES ── */}
    {allMeds.length > 0 ? <>
      <div className="p-lbl" style={{color:"var(--rose)"}}>Your medicines</div>
      <div style={{marginBottom:16}}>
        {activeMeds.map((med, i) => (
          <MedicineCard key={i} med={med} compact={false}
            onEdit={onEdit}
            onPause={onPause}
            onDelete={onDelete}
          />
        ))}
        {pausedMeds.length > 0 && <>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",color:"var(--muted)",margin:"8px 0 6px"}}>Paused</div>
          {pausedMeds.map((med, i) => (
            <MedicineCard key={i} med={med} compact={false}
              onEdit={onEdit}
              onPause={onPause}
              onDelete={onDelete}
            />
          ))}
        </>}
      </div>
    </> : (
      <div className="doc-row" style={{marginBottom:8}}>
        <div className="doc-av">💊</div>
        <div>
          <div className="doc-lbl">No medicines yet</div>
          <div className="doc-txt">Upload a prescription and Matri will track your medicines here automatically.</div>
        </div>
      </div>
    )}

    {onRxUpload && (
      <button onClick={onRxUpload} style={{width:"100%",padding:"11px",background:"var(--rose-pale)",border:"1px solid var(--rose-bdr)",borderRadius:14,fontSize:13,fontWeight:600,color:"var(--rose)",cursor:"pointer",fontFamily:"inherit",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        ✦ Upload prescription
      </button>
    )}

    {/* ── HEALTH INFO ── */}
    {(p.blood_group || (p.conditions||[]).filter(c=>c&&c.toLowerCase()!=="unknown").length > 0) && <>
      <div className="p-lbl" style={{color:"var(--rose)"}}>Health info</div>
      <div className="p-card pc-white" style={{padding:"10px 16px",marginBottom:16}}>
        {p.blood_group && <div style={{fontSize:13,marginBottom:4}}>Blood group · <strong>{p.blood_group}</strong></div>}
        {(p.conditions||[]).filter(c=>c&&c.toLowerCase()!=="unknown").map(c=><span key={c} className="chip" style={{background:"var(--rose-pale)",color:"var(--rose)",border:"1px solid var(--rose-bdr)",margin:"2px"}}>{c}</span>)}
      </div>
    </>}

    <div className="india-chip" style={{marginTop:4}}>🇮🇳 PMSMA Scheme</div>
    <div style={{fontSize:13,lineHeight:1.65,marginBottom:14}}>Under <strong>Pradhan Mantri Surakshit Matritva Abhiyan</strong>, free antenatal checkups on the <strong>9th of every month</strong> at government health centres.</div>
    <div className="p-card pc-rose"><strong>Call your doctor immediately if:</strong> Heavy bleeding, severe abdominal pain, fever above 100.4°F, burning urination, or anything that feels wrong.</div>
  </>;
}
