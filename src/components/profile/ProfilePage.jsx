import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../supabase';
import { authFetch } from '../../utils/auth';
import { MedHealthWidget } from '../medical/MedicineComponents';
import { PrescriptionsList, PrescriptionDetailSheet } from '../medical/PrescriptionComponents';
import { LabsEditor, TestOrdersSection, TestReportSheet, TestSuggestionsStrip, DoctorInsight } from '../medical/LabComponents';
import { parseMed } from '../../utils/medical';

export default function ProfilePage({ profile, onClose, onProfileUpdate, weekProp = 8, onOpenMedical, completedTests = {}, onMarkTestComplete, appMedHandlers = {}, onRxUpload }) {
  const [editSection, setEditSection] = useState(null);
  const [editVis,     setEditVis]     = useState(false);
  const [editData,    setEditData]    = useState({});
  const [saving,      setSaving]      = useState(false);
  const [detailRx,        setDetailRx]        = useState(null);
  const [testOrderDetail,   setTestOrderDetail]   = useState(null);
  const [testOrdersReload,  setTestOrdersReload]  = useState(0);
  const [showAboutSheet,  setShowAboutSheet]  = useState(false);
  const [aboutSheetVis,   setAboutSheetVis]   = useState(false);

  const p = profile || {};
  const firstName = (p.name||"").split(" ")[0] || "Mama";
  const initial   = firstName[0]?.toUpperCase() || "M";

  const getWeek = () => {
    if (!p.due_date) return weekProp;
    const weeksLeft = Math.round((new Date(p.due_date) - new Date()) / (7*24*60*60*1000));
    const w = 40 - weeksLeft;
    return w > 0 && w <= 42 ? w : weekProp;
  };
  const week = getWeek();
  const trimester = !week ? null : week <= 13 ? "First Trimester" : week <= 26 ? "Second Trimester" : "Third Trimester";

  const fields = [p.name, p.due_date, p.diet_type, p.age, p.city, p.doctor_name, p.blood_group, p.conception_type];
  const pct = Math.round((fields.filter(Boolean).length / fields.length) * 100);

  const openEdit = (section, data) => { setEditData(data); setEditSection(section); requestAnimationFrame(() => setEditVis(true)); };

  // Special handler for doctor section — syncs next_appointment_date from latest prescription follow_up_date
  const openDoctorEdit = async () => {
    const baseData = {doctor_name:p.doctor_name||"",clinic_name:p.clinic_name||"",clinic_city:p.clinic_city||"",next_appointment_date:p.next_appointment_date||"",visit_notes:p.visit_notes||"",prescriptions:p.prescriptions||[]};
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: rxRows } = await supabase
          .from("prescriptions")
          .select("follow_up_date")
          .eq("user_id", user.id)
          .not("follow_up_date", "is", null)
          .order("follow_up_date", { ascending: false })
          .limit(1);
        if (rxRows?.[0]?.follow_up_date) {
          const latestFollowUp = rxRows[0].follow_up_date;
          // Always prefer prescription follow_up_date — authoritative source
          baseData.next_appointment_date = latestFollowUp;
          await supabase.from("profiles").update({ next_appointment_date: latestFollowUp }).eq("id", user.id);
          onProfileUpdate && onProfileUpdate({...p, next_appointment_date: latestFollowUp});
        }
      }
    } catch {}
    openEdit("doctor", baseData);
  };
  const closeEdit = () => { setEditVis(false); setTimeout(() => setEditSection(null), 350); };
  const saveEdit = async (updates) => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    // Strip internal UI state flags before saving
    const { _editingDetails, _editing, ...cleanUpdates } = updates;
    let medsToInsert = [];
    if (cleanUpdates.prescriptions?.length) {
      const existingMeds = p.medications || [];
      const existingNames = existingMeds.map(m => (typeof m==="object"?m.name:m).toLowerCase());
      medsToInsert = cleanUpdates.prescriptions
        .filter(rx => !existingNames.includes(rx.name?.toLowerCase()))
        .map(rx => ({ name: rx.name, dosage: rx.dosage||"", frequency: rx.frequency||"", duration: rx.duration||"", notes: rx.notes||"", active: true, source:"prescription", added_date: new Date().toISOString().split("T")[0] }));
      cleanUpdates.medications = [...existingMeds, ...medsToInsert];
    }

    await supabase.from("profiles").update(cleanUpdates).eq("id", user.id);

    // Mirror manually-added medicines into the medicines table
    if (medsToInsert.length) {
      await supabase.from("medicines").insert(
        medsToInsert.map(m => ({
          user_id: user.id,
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          notes: m.notes,
          active: true,
          low_confidence: false,
          start_date: m.added_date,
        }))
      );
    }

    onProfileUpdate({ ...p, ...cleanUpdates });
    setSaving(false);
    closeEdit();
  };

  const dietLabel = { veg:"Vegetarian 🥦", nonveg:"Non-veg 🍗", vegan:"Vegan 🌱", eggetarian:"Eggetarian 🥚" };
  const workLabel = { wfh:"Work from home 💻", office:"Office 🏢", not_working:"Not working 🌿" };
  const conceptionLabel = { natural:"Natural ✨", ivf:"IVF 💉", iui:"IUI 🌱" };

  // Helper: empty state for a widget
  const EmptyState = ({icon, text, cta}) => (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"10px 4px 4px",gap:5}}>
      <div style={{fontSize:26,opacity:0.3}}>{icon}</div>
      <div style={{fontSize:11,color:"var(--muted)",textAlign:"center",lineHeight:1.5}}>{text}</div>
      <div style={{fontSize:11,fontWeight:600,color:"var(--rose)",marginTop:2}}>{cta}</div>
    </div>
  );

  // Helper: edit pill button
  const EditBtn = ({onClick, isEmpty}) => (
    <button
      style={{fontSize:10,fontWeight:600,color:isEmpty?"var(--muted)":"var(--rose)",background:isEmpty?"var(--cream2)":"var(--rose-pale)",border:isEmpty?"1px dashed var(--bdr)":"none",borderRadius:100,padding:"3px 10px",cursor:"pointer",fontFamily:"inherit",flexShrink:0}}
      onClick={e=>{e.stopPropagation();onClick();}}
    >{isEmpty?"+ Add":"Edit"}</button>
  );

  return (
    <>
      <div className="profile-screen open">

        {/* ── HERO ── */}
        <div className="profile-hero">
          <div style={{position:"absolute",width:220,height:220,borderRadius:"50%",background:"#9a3020",top:-90,right:-60,opacity:0.28,filter:"blur(50px)",pointerEvents:"none"}}/>
          <div style={{position:"absolute",width:130,height:130,borderRadius:"50%",background:"#c05840",bottom:10,left:-30,opacity:0.18,filter:"blur(40px)",pointerEvents:"none"}}/>
          <button className="profile-hero-close" onClick={onClose}>✕</button>

          {/* Avatar with ring */}
          <div className="profile-avatar-wrap">
            <div className="profile-avatar-circle" style={{fontSize:40}}>
              🤰
            </div>
            <svg className="profile-ring-svg" viewBox="0 0 90 90" fill="none">
              <circle cx="45" cy="45" r="41" stroke="rgba(255,255,255,0.1)" strokeWidth="3"/>
              <circle cx="45" cy="45" r="41" stroke="#f0a07a" strokeWidth="3"
                strokeDasharray={`${2.576*pct} 257.6`}
                strokeLinecap="round" transform="rotate(-90 45 45)"
                style={{transition:"stroke-dasharray 0.7s ease"}}/>
            </svg>
          </div>

          <div className="profile-name">{p.name || "Your Profile"}</div>
          {week
            ? <div className="profile-week-line">Week {week} · {trimester}</div>
            : <div className="profile-week-line">Add your due date to see your week</div>
          }

          <div className="profile-badges">
            {p.due_date && <div className="profile-badge">Due {new Date(p.due_date).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</div>}
            {p.diet_type && <div className="profile-badge">{dietLabel[p.diet_type]}</div>}
            {p.is_first_pregnancy === true  && <div className="profile-badge">First pregnancy 🌱</div>}
            {p.is_first_pregnancy === false && <div className="profile-badge">Experienced mama ⭐</div>}
            {p.conception_type === "ivf"    && <div className="profile-badge">IVF journey 💪</div>}
          </div>

          {pct < 100 && (
          <div className="profile-complete-row">
            <span className="profile-complete-label">Profile {pct}% complete</span>
            <div className="profile-complete-track">
              <div className="profile-complete-fill" style={{width:`${pct}%`}}/>
            </div>
            <span className="profile-complete-pct">{pct}%</span>
          </div>
          )}
        </div>

        {/* ── WIDGET GRID ── */}
        <div className="profile-scroll">
          <div className="profile-grid">

            {/* ── COMBINED: About you ── */}
            <div className="w w-full wc-dark3" style={{minHeight:150,cursor:"pointer"}} onClick={()=>{setShowAboutSheet(true);requestAnimationFrame(()=>setAboutSheetVis(true));}}>
              <span className="w-bg-e" style={{color:"#60cccc",fontSize:110}}>🤰</span>
              <div className="win-lg">
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                  <div className="w-lbl" style={{color:"#60cccc",marginBottom:0}}><div className="w-lbl-dot" style={{background:"#60cccc"}}/>About you</div>
                  <span style={{fontSize:10,color:"rgba(96,204,204,0.65)",fontWeight:600,letterSpacing:"0.05em"}}>View all →</span>
                </div>
                {(p.name||p.due_date) ? <>
                  <div style={{fontFamily:"'Lora',serif",fontSize:19,color:"#fff",lineHeight:1.25,marginBottom:8}}>
                    {p.name ? p.name.split(" ")[0] : ""}
                    {week ? <> · Week <em style={{color:"#60cccc",fontStyle:"italic"}}>{week}</em></> : null}
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {trimester && <span className="chip" style={{background:"rgba(96,204,204,0.15)",color:"#60cccc",fontSize:10}}>{trimester}</span>}
                    {p.diet_type && <span className="chip" style={{background:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.5)",fontSize:10}}>{dietLabel[p.diet_type]}</span>}
                    {p.baby_nickname && <span className="chip" style={{background:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.5)",fontSize:10}}>🍼 "{p.baby_nickname}"</span>}
                    {p.partner_name && <span className="chip" style={{background:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.5)",fontSize:10}}>🤝 {p.partner_name.split(" ")[0]}</span>}
                  </div>
                </> : <div style={{fontFamily:"'Lora',serif",fontSize:15,color:"rgba(255,255,255,0.4)",fontStyle:"italic",marginTop:4}}>Tell Matri about yourself →</div>}
              </div>
            </div>

            {/* ── DOCTOR'S AREA — navy full width ── */}
            <div className="w pg-full wc-navy" style={{minHeight:130}} onClick={()=>openDoctorEdit()}>
              <span className="w-bg-e" style={{color:"var(--navy)",fontSize:90}}>👩‍⚕️</span>
              <div className="win-lg">
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                  <div className="w-lbl" style={{color:"var(--navy)",marginBottom:0}}><div className="w-lbl-dot" style={{background:"var(--navy)"}}/>Doctor's area</div>
                  <EditBtn onClick={()=>openDoctorEdit()} isEmpty={!p.doctor_name}/>
                </div>
                {p.doctor_name ? (
                  <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>

                    {/* Left — doctor details + AI health insight */}
                    <div style={{flex:1,minWidth:0,overflow:"hidden"}}>
                      <div style={{fontFamily:"'Lora',serif",fontSize:17,color:"var(--ink)",lineHeight:1.2,marginBottom:5,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.doctor_name}</div>
                      {p.clinic_name && (
                        <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6}}>
                          <span style={{fontSize:10}}>🏥</span>
                          <span style={{fontSize:11,color:"var(--muted)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.clinic_name}{p.clinic_city?`, ${p.clinic_city}`:""}</span>
                        </div>
                      )}
                      <DoctorInsight profile={p}/>
                    </div>

                    {/* Right — next appointment big display */}
                    {p.next_appointment_date && (() => {
                      const d = new Date(p.next_appointment_date);
                      const day   = d.toLocaleDateString("en-IN", { day:"numeric" });
                      const month = d.toLocaleDateString("en-IN", { month:"short" });
                      const year  = d.toLocaleDateString("en-IN", { year:"numeric" });
                      const daysLeft = Math.ceil((d - new Date()) / (1000*60*60*24));
                      const isClose  = daysLeft >= 0 && daysLeft <= 7;
                      const isPast   = daysLeft < 0;
                      return (
                        <div style={{flexShrink:0,background:isClose?"var(--rose-pale)":isPast?"var(--cream2)":"var(--navy-pale)",border:`1px solid ${isClose?"var(--rose-bdr)":isPast?"var(--bdr)":"var(--navy-bdr)"}`,borderRadius:16,padding:"12px 14px",textAlign:"center",minWidth:72}}>
                          <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",color:isClose?"var(--rose)":isPast?"var(--muted)":"var(--navy)",marginBottom:4}}>
                            {isPast ? "Appointment" : "Next visit"}
                          </div>
                          <div style={{fontFamily:"'Lora',serif",fontSize:28,fontWeight:400,color:isClose?"var(--rose)":isPast?"var(--muted)":"var(--navy)",lineHeight:1}}>{day}</div>
                          <div style={{fontSize:11,fontWeight:600,color:isClose?"var(--rose)":isPast?"var(--muted)":"var(--navy)",marginTop:2}}>{month}</div>
                          <div style={{fontSize:10,color:"var(--muted)",marginTop:1}}>{year}</div>
                          {!isPast && daysLeft <= 30 && (
                            <div style={{
                              fontSize: daysLeft<=3?11:9,
                              fontWeight: 700,
                              color: isClose ? "#fff" : "var(--navy)",
                              marginTop:6,
                              background: isClose ? "var(--rose)" : "transparent",
                              borderRadius: isClose ? 100 : 0,
                              padding: isClose ? "2px 8px" : "0",
                              display:"inline-block",
                            }}>
                              {daysLeft === 0 ? "Today! 🎯" : daysLeft === 1 ? "Tomorrow!" : `in ${daysLeft} days`}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                  </div>
                ) : <EmptyState icon="🏥" text={"Add your doctor, prescriptions\n& appointment details"} cta="+ Add doctor"/>}
              </div>
            </div>

            {/* ── MY HEALTH BRIDGE — links to the My Health tab ── */}
            <div className="w pg-full" style={{background:"linear-gradient(135deg,#1a1228,#241838)",border:"1px solid rgba(200,160,255,0.15)",cursor:"pointer",minHeight:0}}
              onClick={()=>{ onOpenMedical && onOpenMedical(); }}>
              <div style={{padding:"16px 18px",display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:18,color:"rgba(200,160,255,0.7)",flexShrink:0}}>✦</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(200,160,255,0.8)",marginBottom:3}}>My Health</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,0.38)",lineHeight:1.5}}>Prescriptions, medicines, labs and tests</div>
                </div>
                <span style={{fontSize:16,color:"rgba(200,160,255,0.35)",flexShrink:0}}>→</span>
              </div>
            </div>

            {/* ── SIGN OUT — full width ── */}
            <div className="w pg-full" style={{background:"#fff",minHeight:0}}>
              <div style={{padding:"16px 18px"}}>
                <button
                  style={{width:"100%",padding:"13px",background:"transparent",border:"1.5px solid var(--bdr)",borderRadius:100,fontSize:14,fontWeight:500,color:"var(--muted)",cursor:"pointer",fontFamily:"inherit"}}
                  onClick={async()=>{ await supabase.auth.signOut(); }}
                >Sign out</button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── ABOUT YOU SHEET ── */}
      {showAboutSheet && (
        <>
          <div
            style={{position:"fixed",inset:0,zIndex:300,background:aboutSheetVis?"rgba(16,10,8,0.6)":"rgba(16,10,8,0)",transition:"background 0.3s",pointerEvents:aboutSheetVis?"all":"none"}}
            onClick={()=>{setAboutSheetVis(false);setTimeout(()=>setShowAboutSheet(false),350);}}
          />
          <div style={{position:"fixed",bottom:0,left:0,right:0,width:"100%",maxWidth:430,margin:"0 auto",zIndex:301,background:"var(--cream)",borderRadius:"28px 28px 0 0",transform:`translateY(${aboutSheetVis?0:102}%)`,transition:"transform 0.36s cubic-bezier(0.3,0.72,0,1)",maxHeight:"88vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
            {/* Handle + header */}
            <div style={{padding:"14px 20px 16px",borderBottom:"1px solid var(--bdr)",flexShrink:0}}>
              <div style={{width:36,height:4,borderRadius:100,background:"var(--bdr)",margin:"0 auto 16px"}}/>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{fontFamily:"'Lora',serif",fontSize:22,color:"var(--ink)",fontWeight:400}}>About <em style={{color:"var(--rose)"}}>you</em></div>
                <button onClick={()=>{setAboutSheetVis(false);setTimeout(()=>setShowAboutSheet(false),350);}} style={{width:32,height:32,borderRadius:"50%",background:"var(--cream2)",border:"none",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--muted)",fontFamily:"inherit"}}>✕</button>
              </div>
            </div>

            {/* Scrollable sections */}
            <div style={{overflowY:"auto",padding:"16px 18px 48px",scrollbarWidth:"none",flex:1,display:"flex",flexDirection:"column",gap:12}}>

              {/* ── My Pregnancy ── */}
              <div style={{background:"linear-gradient(135deg,var(--teal-pale),#f0fafa)",border:"1px solid var(--teal-bdr)",borderRadius:20,padding:"16px 18px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:p.due_date?14:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <span style={{fontSize:16}}>🤰</span>
                    <span style={{fontSize:9,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:"var(--teal)"}}>My Pregnancy</span>
                  </div>
                  <button onClick={()=>openEdit("pregnancy",{due_date:p.due_date||"",is_first_pregnancy:p.is_first_pregnancy,conception_type:p.conception_type||"",baby_nickname:p.baby_nickname||""})} style={{fontSize:10,fontWeight:600,color:"var(--teal)",background:"#fff",border:"1px solid var(--teal-bdr)",borderRadius:100,padding:"3px 10px",cursor:"pointer",fontFamily:"inherit"}}>{p.due_date?"Edit":"+ Add"}</button>
                </div>
                {p.due_date ? <>
                  <div style={{fontFamily:"'Lora',serif",fontSize:26,color:"var(--teal)",lineHeight:1,marginBottom:4}}>Week <em style={{fontStyle:"italic"}}>{week}</em></div>
                  {trimester && <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--teal)",opacity:0.6,marginBottom:12}}>{trimester}</div>}
                  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                    {[
                      {icon:"📅",label:"Due date",value:new Date(p.due_date).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})},
                      p.conception_type && {icon:p.conception_type==="ivf"?"💉":"🌱",label:"Conception",value:conceptionLabel[p.conception_type]},
                      p.is_first_pregnancy!=null && {icon:p.is_first_pregnancy?"🌱":"⭐",label:"Pregnancy",value:p.is_first_pregnancy?"First time":"Been here before"},
                    ].filter(Boolean).map((c,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:8,background:"#fff",borderRadius:12,padding:"8px 12px"}}>
                        <span style={{fontSize:16}}>{c.icon}</span>
                        <div>
                          <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--muted)"}}>{c.label}</div>
                          <div style={{fontSize:12,fontWeight:600,color:"var(--ink)"}}>{c.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </> : <div style={{fontSize:12,color:"var(--muted)",fontStyle:"italic",marginTop:6}}>Not added yet</div>}
              </div>

              {/* ── About me ── */}
              <div style={{background:"linear-gradient(135deg,var(--rose-pale),#fff9f8)",border:"1px solid var(--rose-bdr)",borderRadius:20,padding:"16px 18px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:p.name?14:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <span style={{fontSize:16}}>👤</span>
                    <span style={{fontSize:9,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:"var(--rose)"}}>About me</span>
                  </div>
                  <button onClick={()=>openEdit("about",{name:p.name||"",age:p.age||"",city:p.city||""})} style={{fontSize:10,fontWeight:600,color:"var(--rose)",background:"#fff",border:"1px solid var(--rose-bdr)",borderRadius:100,padding:"3px 10px",cursor:"pointer",fontFamily:"inherit"}}>{p.name?"Edit":"+ Add"}</button>
                </div>
                {p.name ? <>
                  <div style={{fontFamily:"'Lora',serif",fontSize:22,color:"var(--ink)",lineHeight:1.2,marginBottom:10}}>{p.name}</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                    {p.age && <div style={{display:"flex",alignItems:"center",gap:8,background:"#fff",borderRadius:12,padding:"8px 12px"}}>
                      <span style={{fontSize:16}}>🎂</span>
                      <div><div style={{fontSize:9,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--muted)"}}>Age</div><div style={{fontSize:12,fontWeight:600,color:"var(--ink)"}}>{p.age} years</div></div>
                    </div>}
                    {p.city && <div style={{display:"flex",alignItems:"center",gap:8,background:"#fff",borderRadius:12,padding:"8px 12px"}}>
                      <span style={{fontSize:16}}>📍</span>
                      <div><div style={{fontSize:9,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--muted)"}}>City</div><div style={{fontSize:12,fontWeight:600,color:"var(--ink)"}}>{p.city}</div></div>
                    </div>}
                  </div>
                </> : <div style={{fontSize:12,color:"var(--muted)",fontStyle:"italic",marginTop:6}}>Not added yet</div>}
              </div>

              {/* ── Lifestyle ── */}
              <div style={{background:"linear-gradient(135deg,var(--forest-pale),#f8fdf8)",border:"1px solid var(--forest-bdr)",borderRadius:20,padding:"16px 18px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:(p.diet_type||p.work_type)?14:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <span style={{fontSize:16}}>🥗</span>
                    <span style={{fontSize:9,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:"var(--forest)"}}>Lifestyle</span>
                  </div>
                  <button onClick={()=>openEdit("lifestyle",{diet_type:p.diet_type||"",work_type:p.work_type||""})} style={{fontSize:10,fontWeight:600,color:"var(--forest)",background:"#fff",border:"1px solid var(--forest-bdr)",borderRadius:100,padding:"3px 10px",cursor:"pointer",fontFamily:"inherit"}}>{p.diet_type?"Edit":"+ Add"}</button>
                </div>
                {(p.diet_type||p.work_type) ? <>
                  {p.diet_type && <div style={{fontFamily:"'Lora',serif",fontSize:20,color:"var(--ink)",lineHeight:1.2,marginBottom:p.work_type?10:0}}>{dietLabel[p.diet_type]}</div>}
                  {p.work_type && <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"#fff",borderRadius:12,padding:"8px 12px"}}>
                    <span style={{fontSize:16}}>💼</span>
                    <div><div style={{fontSize:9,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--muted)"}}>Work</div><div style={{fontSize:12,fontWeight:600,color:"var(--ink)"}}>{workLabel[p.work_type]}</div></div>
                  </div>}
                </> : <div style={{fontSize:12,color:"var(--muted)",fontStyle:"italic",marginTop:6}}>Not added yet</div>}
              </div>

              {/* ── Partner ── */}
              <div style={{background:"linear-gradient(135deg,var(--slate-pale),#f5f7fa)",border:"1px solid var(--slate-bdr)",borderRadius:20,padding:"16px 18px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:p.partner_name?14:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <span style={{fontSize:16}}>🤝</span>
                    <span style={{fontSize:9,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:"var(--slate)"}}>Partner</span>
                  </div>
                  <button onClick={()=>openEdit("partner",{partner_name:p.partner_name||"",has_partner:p.has_partner})} style={{fontSize:10,fontWeight:600,color:"var(--slate)",background:"#fff",border:"1px solid var(--slate-bdr)",borderRadius:100,padding:"3px 10px",cursor:"pointer",fontFamily:"inherit"}}>{p.partner_name?"Edit":"+ Add"}</button>
                </div>
                {p.partner_name
                  ? <div style={{fontFamily:"'Lora',serif",fontSize:20,color:"var(--ink)",lineHeight:1.2}}>{p.partner_name}</div>
                  : <div style={{fontSize:12,color:"var(--muted)",fontStyle:"italic",marginTop:6}}>Not added yet</div>}
              </div>

              {/* ── Baby's nickname ── */}
              <div style={{background:"linear-gradient(135deg,var(--plum-pale),#fdf5ff)",border:"1px solid var(--plum-bdr)",borderRadius:20,padding:"16px 18px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:p.baby_nickname?14:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <span style={{fontSize:16}}>🍼</span>
                    <span style={{fontSize:9,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:"var(--plum)"}}>Baby's nickname</span>
                  </div>
                  <button onClick={()=>openEdit("pregnancy",{due_date:p.due_date||"",is_first_pregnancy:p.is_first_pregnancy,conception_type:p.conception_type||"",baby_nickname:p.baby_nickname||""})} style={{fontSize:10,fontWeight:600,color:"var(--plum)",background:"#fff",border:"1px solid var(--plum-bdr)",borderRadius:100,padding:"3px 10px",cursor:"pointer",fontFamily:"inherit"}}>{p.baby_nickname?"Edit":"+ Add"}</button>
                </div>
                {p.baby_nickname
                  ? <div style={{fontFamily:"'Lora',serif",fontSize:24,color:"var(--plum)",lineHeight:1.2}}>"{p.baby_nickname}"</div>
                  : <div style={{fontSize:12,color:"var(--muted)",fontStyle:"italic",marginTop:6}}>What are you calling them?</div>}
              </div>

            </div>
          </div>
        </>
      )}

      {/* ── EDIT SHEET ── */}
      <div className={`pedit-backdrop${editVis?" open":""}`} onClick={closeEdit}/>
      {editSection && (
        <div className={`pedit-sheet${editVis?" open":""}`}>
          <div className="pedit-handle"/>

          {editSection === "about" && <>
            <div className="pedit-title">About <em>you</em></div>
            {(editData.name || editData.age || editData.city) && !editData._editing ? (
              <div style={{background:"linear-gradient(135deg,var(--rose-pale),#fff9f8)",border:"1px solid var(--rose-bdr)",borderRadius:20,padding:"20px 18px 16px",marginBottom:16,position:"relative"}}>
                <button
                  onClick={() => setEditData(d => ({...d, _editing:true}))}
                  style={{position:"absolute",top:14,right:14,fontSize:10,fontWeight:600,color:"var(--rose)",background:"#fff",border:"1px solid var(--rose-bdr)",borderRadius:100,padding:"3px 10px",cursor:"pointer",fontFamily:"inherit"}}>
                  Edit
                </button>
                {editData.name && <div style={{fontFamily:"'Lora',serif",fontSize:24,color:"var(--ink)",lineHeight:1.2,marginBottom:12,paddingRight:52}}>{editData.name}</div>}
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {editData.age && (
                    <div style={{display:"flex",alignItems:"center",gap:8,background:"#fff",borderRadius:12,padding:"8px 12px"}}>
                      <span style={{fontSize:18}}>🎂</span>
                      <div>
                        <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--muted)"}}>Age</div>
                        <div style={{fontSize:13,fontWeight:600,color:"var(--ink)"}}>{editData.age} years</div>
                      </div>
                    </div>
                  )}
                  {editData.city && (
                    <div style={{display:"flex",alignItems:"center",gap:8,background:"#fff",borderRadius:12,padding:"8px 12px"}}>
                      <span style={{fontSize:18}}>📍</span>
                      <div>
                        <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--muted)"}}>City</div>
                        <div style={{fontSize:13,fontWeight:600,color:"var(--ink)"}}>{editData.city}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                {editData._editing && (
                  <button onClick={() => setEditData(d => ({...d, _editing:false}))}
                    style={{display:"flex",alignItems:"center",gap:4,background:"none",border:"none",fontSize:11,fontWeight:600,color:"var(--muted)",cursor:"pointer",fontFamily:"inherit",marginBottom:12,padding:0}}>
                    ← Back to summary
                  </button>
                )}
                {[["Name","name","text","Priya"],["Age","age","number","28"],["City","city","text","Mumbai"]].map(([lbl,key,type,ph])=>(
                  <div className="pedit-field" key={key}>
                    <div className="pedit-label">{lbl}</div>
                    <input className="pedit-input" type={type} placeholder={ph} value={editData[key]||""} onChange={e=>setEditData(d=>({...d,[key]:e.target.value}))}/>
                  </div>
                ))}
              </>
            )}
          </>}

          {editSection === "pregnancy" && <>
            <div className="pedit-title">Your <em>pregnancy</em></div>
            {editData.due_date && !editData._editing ? (
              <div style={{background:"linear-gradient(135deg,var(--teal-pale),#f8fffe)",border:"1px solid var(--teal-bdr)",borderRadius:20,padding:"20px 18px 16px",marginBottom:16,position:"relative"}}>
                <button
                  onClick={() => setEditData(d => ({...d, _editing:true}))}
                  style={{position:"absolute",top:14,right:14,fontSize:10,fontWeight:600,color:"var(--teal)",background:"#fff",border:"1px solid var(--teal-bdr)",borderRadius:100,padding:"3px 10px",cursor:"pointer",fontFamily:"inherit"}}>
                  Edit
                </button>
                {(() => {
                  const weeksLeft = Math.round((new Date(editData.due_date) - new Date()) / (7*24*60*60*1000));
                  const w = 40 - weeksLeft;
                  const validWeek = w > 0 && w <= 42 ? w : null;
                  const tri = !validWeek ? null : validWeek <= 13 ? "First Trimester" : validWeek <= 26 ? "Second Trimester" : "Third Trimester";
                  return <>
                    <div style={{fontFamily:"'Lora',serif",fontSize:30,color:"var(--teal)",lineHeight:1,marginBottom:4,paddingRight:52}}>
                      {validWeek ? <>Week <em style={{fontStyle:"italic"}}>{validWeek}</em></> : "Due soon"}
                    </div>
                    {tri && <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.13em",textTransform:"uppercase",color:"var(--teal)",opacity:0.65,marginBottom:14}}>{tri}</div>}
                  </>;
                })()}
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,background:"#fff",borderRadius:12,padding:"8px 12px"}}>
                    <span style={{fontSize:18}}>📅</span>
                    <div>
                      <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--muted)"}}>Due date</div>
                      <div style={{fontSize:13,fontWeight:600,color:"var(--ink)"}}>{new Date(editData.due_date).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}</div>
                    </div>
                  </div>
                  {editData.conception_type && (
                    <div style={{display:"flex",alignItems:"center",gap:8,background:"#fff",borderRadius:12,padding:"8px 12px"}}>
                      <span style={{fontSize:18}}>{editData.conception_type==="ivf"?"💉":"🌱"}</span>
                      <div>
                        <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--muted)"}}>Conception</div>
                        <div style={{fontSize:13,fontWeight:600,color:"var(--ink)"}}>{conceptionLabel[editData.conception_type]}</div>
                      </div>
                    </div>
                  )}
                  {editData.is_first_pregnancy != null && (
                    <div style={{display:"flex",alignItems:"center",gap:8,background:"#fff",borderRadius:12,padding:"8px 12px"}}>
                      <span style={{fontSize:18}}>{editData.is_first_pregnancy ? "🌱" : "⭐"}</span>
                      <div>
                        <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--muted)"}}>Pregnancy</div>
                        <div style={{fontSize:13,fontWeight:600,color:"var(--ink)"}}>{editData.is_first_pregnancy ? "First time" : "Been here before"}</div>
                      </div>
                    </div>
                  )}
                  {editData.baby_nickname && (
                    <div style={{display:"flex",alignItems:"center",gap:8,background:"#fff",borderRadius:12,padding:"8px 12px"}}>
                      <span style={{fontSize:18}}>🍼</span>
                      <div>
                        <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--muted)"}}>Nickname</div>
                        <div style={{fontSize:13,fontWeight:600,color:"var(--ink)"}}>"{editData.baby_nickname}"</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                {editData._editing && (
                  <button onClick={() => setEditData(d => ({...d, _editing:false}))}
                    style={{display:"flex",alignItems:"center",gap:4,background:"none",border:"none",fontSize:11,fontWeight:600,color:"var(--muted)",cursor:"pointer",fontFamily:"inherit",marginBottom:12,padding:0}}>
                    ← Back to summary
                  </button>
                )}
                <div className="pedit-field">
                  <div className="pedit-label">Due date</div>
                  <input className="pedit-input" type="date" value={editData.due_date||""} onChange={e=>setEditData(d=>({...d,due_date:e.target.value}))}/>
                </div>
                <div className="pedit-field">
                  <div className="pedit-label">Baby's nickname</div>
                  <input className="pedit-input" type="text" placeholder="Peanut, Little one…" value={editData.baby_nickname||""} onChange={e=>setEditData(d=>({...d,baby_nickname:e.target.value}))}/>
                </div>
                <div className="pedit-field">
                  <div className="pedit-label">Conception type</div>
                  <select className="pedit-input" value={editData.conception_type||""} onChange={e=>setEditData(d=>({...d,conception_type:e.target.value}))}>
                    <option value="">Select…</option>
                    <option value="natural">Natural</option>
                    <option value="ivf">IVF</option>
                    <option value="iui">IUI</option>
                  </select>
                </div>
                <div className="pedit-field">
                  <div className="pedit-label">First pregnancy?</div>
                  <select className="pedit-input" value={editData.is_first_pregnancy===true?"yes":editData.is_first_pregnancy===false?"no":""} onChange={e=>setEditData(d=>({...d,is_first_pregnancy:e.target.value==="yes"?true:e.target.value==="no"?false:null}))}>
                    <option value="">Select…</option>
                    <option value="yes">Yes, first time 🌱</option>
                    <option value="no">No, been here before ⭐</option>
                  </select>
                </div>
              </>
            )}
          </>}

          {editSection === "doctor" && <>
            <div className="pedit-title">Doctor's <em>area</em></div>

            {/* Visual doctor card — shows when data exists, tapping Edit switches to inputs */}
            {(editData.doctor_name || editData.clinic_name) && !editData._editingDetails ? (
              <div style={{background:"linear-gradient(135deg,var(--navy-pale),#f0f4ff)",border:"1px solid var(--navy-bdr)",borderRadius:20,padding:"18px 18px 14px",marginBottom:16,position:"relative"}}>
                {/* Edit details button */}
                <button
                  onClick={()=>setEditData(d=>({...d,_editingDetails:true}))}
                  style={{position:"absolute",top:14,right:14,fontSize:10,fontWeight:600,color:"var(--navy)",background:"var(--navy-pale)",border:"1px solid var(--navy-bdr)",borderRadius:100,padding:"3px 10px",cursor:"pointer",fontFamily:"inherit"}}>
                  Edit
                </button>
                {/* Doctor name */}
                <div style={{fontFamily:"'Lora',serif",fontSize:20,color:"var(--ink)",lineHeight:1.2,marginBottom:4,paddingRight:48}}>
                  {editData.doctor_name}
                </div>
                {/* Clinic + city */}
                {(editData.clinic_name || editData.clinic_city) && (
                  <div style={{fontSize:12,color:"var(--muted)",marginBottom:12,lineHeight:1.5}}>
                    {[editData.clinic_name, editData.clinic_city].filter(Boolean).join(" · ")}
                  </div>
                )}
                {/* Next appointment */}
                {editData.next_appointment_date && (() => {
                  const d = new Date(editData.next_appointment_date);
                  const today = new Date(); today.setHours(0,0,0,0);
                  const days = Math.ceil((d - today) / (1000*60*60*24));
                  const label = days === 0 ? "Today! 🎯" : days === 1 ? "Tomorrow" : days > 0 ? `in ${days} days` : "Past";
                  return (
                    <div style={{display:"flex",alignItems:"center",gap:10,background:"#fff",borderRadius:12,padding:"10px 14px",marginBottom:8}}>
                      <div style={{fontSize:22}}>📅</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",color:"var(--muted)",marginBottom:2}}>Next appointment</div>
                        <div style={{fontSize:13,fontWeight:600,color:"var(--ink)"}}>
                          {d.toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}
                        </div>
                      </div>
                      <div style={{fontSize:11,fontWeight:700,color:days<=3&&days>=0?"var(--rose)":"var(--navy)",background:days<=3&&days>=0?"var(--rose-pale)":"var(--navy-pale)",border:`1px solid ${days<=3&&days>=0?"var(--rose-bdr)":"var(--navy-bdr)"}`,borderRadius:100,padding:"3px 10px",flexShrink:0}}>
                        {label}
                      </div>
                    </div>
                  );
                })()}
                {/* Visit notes preview */}
                {editData.visit_notes && (
                  <div style={{fontSize:12,color:"var(--muted)",fontStyle:"italic",lineHeight:1.6,marginTop:4,borderTop:"1px solid var(--bdr)",paddingTop:10}}>
                    "{editData.visit_notes.slice(0,120)}{editData.visit_notes.length>120?"…":""}"
                  </div>
                )}
              </div>
            ) : (
              // Input form — shown when no data yet, or when editing
              <>
                {editData._editingDetails && (
                  <button onClick={()=>setEditData(d=>({...d,_editingDetails:false}))}
                    style={{display:"flex",alignItems:"center",gap:4,background:"none",border:"none",fontSize:11,fontWeight:600,color:"var(--muted)",cursor:"pointer",fontFamily:"inherit",marginBottom:12,padding:0}}>
                    ← Back to summary
                  </button>
                )}
                {[["Doctor's name","doctor_name","text","Dr. Sharma"],["Clinic / Hospital","clinic_name","text","Apollo Clinic"],["City","clinic_city","text","Mumbai"]].map(([lbl,key,type,ph])=>(
                  <div className="pedit-field" key={key}>
                    <div className="pedit-label">{lbl}</div>
                    <input className="pedit-input" type={type} placeholder={ph} value={editData[key]||""} onChange={e=>setEditData(d=>({...d,[key]:e.target.value}))}/>
                  </div>
                ))}
                <div className="pedit-field">
                  <div className="pedit-label">Next appointment</div>
                  <input className="pedit-input" type="date" value={editData.next_appointment_date||""} onChange={e=>setEditData(d=>({...d,next_appointment_date:e.target.value}))}/>
                </div>
                <div className="pedit-field">
                  <div className="pedit-label">Visit notes</div>
                  <textarea className="pedit-input" placeholder="What did the doctor say this visit…" rows={3} value={editData.visit_notes||""} onChange={e=>setEditData(d=>({...d,visit_notes:e.target.value}))} style={{resize:"none",lineHeight:1.5}}/>
                </div>
              </>
            )}

            {/* Prescriptions list */}
            <div className="lab-divider">
              <div className="lab-divider-line"/>
              <div className="lab-divider-text">prescriptions</div>
              <div className="lab-divider-line"/>
            </div>
            <PrescriptionsList
              prescriptions={editData.prescriptions || []}
              onViewDetail={rx=>setDetailRx(rx)}
              onDeleted={async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
                if (data) {
                  setEditData(d => ({...d, prescriptions: data.prescriptions || []}));
                  onProfileUpdate && onProfileUpdate(data);
                }
              }}
            />
            <button
              onClick={()=>{ closeEdit(); setTimeout(()=> onRxUpload && onRxUpload(), 400); }}
              style={{width:"100%",padding:"11px",background:"var(--navy-pale)",border:"1.5px dashed var(--navy-bdr)",borderRadius:14,fontSize:12,fontWeight:600,color:"var(--navy)",cursor:"pointer",fontFamily:"inherit",marginTop:10,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              + Upload new prescription
            </button>
          </>}

          {editSection === "lifestyle" && <>
            <div className="pedit-title">Your <em>lifestyle</em></div>
            {(editData.diet_type || editData.work_type) && !editData._editing ? (
              <div style={{background:"linear-gradient(135deg,var(--forest-pale),#f8fdf8)",border:"1px solid var(--forest-bdr)",borderRadius:20,padding:"20px 18px 16px",marginBottom:16,position:"relative"}}>
                <button
                  onClick={() => setEditData(d => ({...d, _editing:true}))}
                  style={{position:"absolute",top:14,right:14,fontSize:10,fontWeight:600,color:"var(--forest)",background:"#fff",border:"1px solid var(--forest-bdr)",borderRadius:100,padding:"3px 10px",cursor:"pointer",fontFamily:"inherit"}}>
                  Edit
                </button>
                {editData.diet_type && (
                  <div style={{fontFamily:"'Lora',serif",fontSize:22,color:"var(--ink)",lineHeight:1.2,marginBottom:12,paddingRight:52}}>
                    {dietLabel[editData.diet_type]}
                  </div>
                )}
                {editData.work_type && (
                  <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"#fff",borderRadius:12,padding:"8px 14px"}}>
                    <div>
                      <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--muted)"}}>Work</div>
                      <div style={{fontSize:13,fontWeight:600,color:"var(--ink)"}}>{workLabel[editData.work_type]}</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {editData._editing && (
                  <button onClick={() => setEditData(d => ({...d, _editing:false}))}
                    style={{display:"flex",alignItems:"center",gap:4,background:"none",border:"none",fontSize:11,fontWeight:600,color:"var(--muted)",cursor:"pointer",fontFamily:"inherit",marginBottom:12,padding:0}}>
                    ← Back to summary
                  </button>
                )}
                <div className="pedit-field">
                  <div className="pedit-label">Diet type</div>
                  <select className="pedit-input" value={editData.diet_type||""} onChange={e=>setEditData(d=>({...d,diet_type:e.target.value}))}>
                    <option value="">Select…</option>
                    <option value="veg">Vegetarian 🥦</option>
                    <option value="nonveg">Non-veg 🍗</option>
                    <option value="vegan">Vegan 🌱</option>
                    <option value="eggetarian">Eggetarian 🥚</option>
                  </select>
                </div>
                <div className="pedit-field">
                  <div className="pedit-label">Work situation</div>
                  <select className="pedit-input" value={editData.work_type||""} onChange={e=>setEditData(d=>({...d,work_type:e.target.value}))}>
                    <option value="">Select…</option>
                    <option value="wfh">Work from home 💻</option>
                    <option value="office">Office 🏢</option>
                    <option value="not_working">Not working 🌿</option>
                  </select>
                </div>
              </>
            )}
          </>}

          {editSection === "health" && <>
            <div className="pedit-title">Your <em>health</em></div>
            <div className="pedit-field">
              <div className="pedit-label">Blood group</div>
              <select className="pedit-input" value={editData.blood_group||""} onChange={e=>setEditData(d=>({...d,blood_group:e.target.value}))}>
                <option value="">Select…</option>
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(g=><option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </>}

          {editSection === "labs" && <>
            <div className="pedit-title">Tests &amp; <em>results</em></div>

            {/* Tests ordered by your doctor */}
            <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",color:"var(--teal)",marginBottom:10}}>Tests from your doctor</div>
            <TestOrdersSection onViewDetail={order => setTestOrderDetail(order)} reloadKey={testOrdersReload} />

            <div className="lab-divider" style={{margin:"20px 0 4px"}}>
              <div className="lab-divider-line"/>
              <div className="lab-divider-text">lab values</div>
              <div className="lab-divider-line"/>
            </div>

            <LabsEditor editData={editData} setEditData={setEditData} hideTitle />
          </>}

          {editSection === "partner" && <>
            <div className="pedit-title">Your <em>partner</em></div>
            <div className="pedit-field">
              <div className="pedit-label">Partner's name</div>
              <input className="pedit-input" type="text" placeholder="Rahul" value={editData.partner_name||""} onChange={e=>setEditData(d=>({...d,partner_name:e.target.value,has_partner:true}))}/>
            </div>
          </>}

          <button className="pedit-save" onClick={() => saveEdit(editData)} disabled={saving}>
            {saving ? "Saving…" : "Save ✓"}
          </button>
          <button className="pedit-cancel" onClick={closeEdit}>Cancel</button>
        </div>
      )}

      {/* ── TEST REPORT SHEET — root level to escape pedit-sheet stacking context ── */}
      {testOrderDetail && (
        <TestReportSheet
          order={testOrderDetail}
          onClose={() => setTestOrderDetail(null)}
          onReportDeleted={async () => {
            setTestOrderDetail(null);
            setTestOrdersReload(k => k + 1);
            // Re-fetch profile so LabsEditor shows the cleared values immediately
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                const { data } = await supabase.from("profiles").select("lab_data, lab_extras_v2, blood_group").eq("id", user.id).single();
                if (data) {
                  // Strip empty extra keys so LabsEditor doesn't show ghost rows
                  const cleanExtras = Object.fromEntries(
                    Object.entries(data.lab_extras_v2 || {}).filter(([, v]) => v?.entries?.length)
                  );
                  setEditData(d => ({ ...d, lab_data: data.lab_data || {}, lab_extras_v2: cleanExtras }));
                  onProfileUpdate && onProfileUpdate({ ...p, lab_data: data.lab_data, lab_extras_v2: cleanExtras });
                }
              }
            } catch {}
          }}
        />
      )}

      {/* ── PRESCRIPTION DETAIL SHEET — rendered here (root level) to escape pedit-sheet stacking context ── */}
      {detailRx && (
        <PrescriptionDetailSheet
          rx={detailRx}
          onClose={() => setDetailRx(null)}
          onDelete={async (rx) => {
            try {
              if (rx.id) {
                const resp = await authFetch("/api/prescription/delete", {
                  method: "DELETE",
                  body: JSON.stringify({ prescription_id: rx.id }),
                });
                if (!resp.ok) throw new Error("Delete failed");
              } else {
                const { data: { user: u } } = await supabase.auth.getUser();
                if (!u) throw new Error("Not logged in");
                const { data: prof } = await supabase.from("profiles").select("prescriptions").eq("id", u.id).single();
                const existing = prof?.prescriptions || [];
                const updated = existing.filter(p =>
                  !(p.doctor === rx.doctor && p.date === rx.date && p.summary === rx.summary)
                );
                await supabase.from("profiles").update({ prescriptions: updated }).eq("id", u.id);
              }
              setDetailRx(null);
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
                if (data) {
                  setEditData(d => ({ ...d, prescriptions: data.prescriptions || [] }));
                  onProfileUpdate && onProfileUpdate(data);
                }
              }
            } catch {
              alert("Could not delete prescription. Please try again.");
            }
          }}
        />
      )}
    </>
  );
}
