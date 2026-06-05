import React, { useState, useEffect } from 'react';
import { NUTR_KEY } from '../../utils/storage';
import { istDate } from '../../utils/date';

export const BABY_SIZES = {
  6:{compare:"a grain of rice",cm:"6mm",fact:"Heart beating for the first time.",icon:"🌾"},
  7:{compare:"your little fingernail",cm:"1cm",fact:"Brain developing at extraordinary speed.",icon:"🤏"},
  8:{compare:"the tip of your thumb",cm:"1.6cm",fact:"Fingers forming. Heart beats 160 bpm.",icon:"👍"},
  9:{compare:"a shirt button",cm:"2.3cm",fact:"All essential organs forming.",icon:"🔘"},
  10:{compare:"a large shirt button",cm:"3cm",fact:"Tiny movements. Unmistakably human.",icon:"🔘"},
  11:{compare:"a 5-rupee coin",cm:"4cm",fact:"Fingers and toes fully separated.",icon:"🪙"},
  12:{compare:"a AA battery's width",cm:"5.4cm",fact:"Can open and close fists.",icon:"🔋"},
  13:{compare:"half a pencil",cm:"7.4cm",fact:"Fingerprints are forming.",icon:"✏️"},
  14:{compare:"a house key",cm:"8.7cm",fact:"Can make facial expressions.",icon:"🗝️"},
  16:{compare:"an avocado",cm:"11.6cm",fact:"Hears sounds inside the womb.",icon:"🥑"},
  18:{compare:"a bell pepper",cm:"14.2cm",fact:"You may start to feel movement.",icon:"🫑"},
  20:{compare:"a banana",cm:"16.4cm",fact:"Halfway there. Fully formed.",icon:"🍌"},
  24:{compare:"a ruler",cm:"30cm",fact:"Can recognise your voice.",icon:"📏"},
  28:{compare:"a 500ml water bottle",cm:"37.6cm",fact:"Eyes open for the first time.",icon:"💧"},
  32:{compare:"a large coconut",cm:"42.4cm",fact:"Gaining weight fast — fat and muscle.",icon:"🥥"},
  36:{compare:"a rolled-up dupatta",cm:"47.4cm",fact:"Almost ready. Turning head-down.",icon:"🧣"},
  40:{compare:"a newborn",cm:"50cm",fact:"Ready to meet you.",icon:"👶"},
};

export const MOODS = ["😊","😴","🤢","😭","😤","🥰"];

export function BabyPanel({ week, weeklyContent }) {
  const [tab, setTab] = useState("size");

  // Resolve size data: Supabase weekly_content first, then static BABY_SIZES, then week-8 fallback
  const staticSize = BABY_SIZES[week] || BABY_SIZES[8];
  const wc = weeklyContent?.baby_size;
  const size = {
    cm:      wc?.cm      || staticSize.cm,
    compare: wc?.compare || staticSize.compare,
    fact:    wc?.fact    || staticSize.fact,
    icon:    wc?.icon    || staticSize.icon,
    hand_mm: wc?.hand_mm ?? null,
    foot_mm: wc?.foot_mm ?? null,
    bpm:     wc?.bpm     ?? null,
  };

  const education = weeklyContent?.education;

  const statCards = [
    {icon:"✋",label:"Hand length",val:size.hand_mm ? `${size.hand_mm} mm` : "—",note:"Fingers forming"},
    {icon:"🦶",label:"Foot length",val:size.foot_mm ? `${size.foot_mm} mm` : "—",note:"Tiny toes developing"},
    {icon:"❤️",label:"Heart rate",val:size.bpm ? `~${size.bpm} bpm` : "~160 bpm",note:"Never stopped since week 6"},
    {icon:"🧠",label:"Neurons/min",val:"~100",note:"New brain cells forming every minute"},
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      {/* Tab bar */}
      <div style={{display:"flex",borderBottom:"1px solid var(--bdr)",background:"var(--cream)",flexShrink:0}}>
        {[["size","🫶 Size & body"],["senses","✨ Senses"]].map(([id,lbl])=>(
          <button key={id}
            onClick={()=>setTab(id)}
            style={{flex:1,padding:"11px 8px 9px",fontSize:12,fontWeight:600,
              color:tab===id?"var(--rose)":"var(--muted)",
              borderBottom:tab===id?"2px solid var(--rose)":"2px solid transparent",
              background:"none",border:"none",
              cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>
            {lbl}
          </button>
        ))}
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"20px 20px 48px",scrollbarWidth:"none"}}>
        {tab==="size" && <>
          {/* Hero size card */}
          <div style={{background:"linear-gradient(140deg,#1a1210,#2e1a14)",borderRadius:16,padding:"18px 20px",marginBottom:16,display:"flex",gap:16,alignItems:"center"}}>
            <div style={{flexShrink:0}}>
              <svg width="72" height="88" viewBox="0 0 72 88" fill="none">
                <ellipse cx="36" cy="26" rx="18" ry="21" fill="#f0cfc8"/>
                <ellipse cx="36" cy="24" rx="12" ry="15" fill="#fde8e4"/>
                <circle cx="30" cy="21" r="2" fill="#d4948a"/>
                <circle cx="42" cy="21" r="2" fill="#d4948a"/>
                <path d="M31 28 Q36 33 41 28" stroke="#d4948a" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                <ellipse cx="17" cy="40" rx="5" ry="6" fill="#f0cfc8" transform="rotate(-18 17 40)"/>
                <ellipse cx="55" cy="40" rx="5" ry="6" fill="#f0cfc8" transform="rotate(18 55 40)"/>
                <ellipse cx="36" cy="58" rx="13" ry="17" fill="#f0cfc8"/>
                <ellipse cx="27" cy="72" rx="4" ry="7" fill="#f0cfc8" transform="rotate(8 27 72)"/>
                <ellipse cx="45" cy="72" rx="4" ry="7" fill="#f0cfc8" transform="rotate(-8 45 72)"/>
              </svg>
            </div>
            <div>
              <div style={{fontSize:11,color:"rgba(240,160,122,0.7)",fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:6}}>Week {week || 8}</div>
              <div style={{fontFamily:"'Lora',serif",fontSize:28,color:"#fff",lineHeight:1,marginBottom:6}}>{size.cm}</div>
              <div style={{fontSize:13,color:"rgba(255,255,255,0.55)",lineHeight:1.5}}>
                {education?.baby_card_text || `About the size of ${size.compare}. Hold your thumb up — that's your baby right now.`}
              </div>
            </div>
          </div>

          {/* Size comparison cards */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:16}}>
            {statCards.map((c,i)=>(
              <div key={i} style={{background:"var(--cream2)",borderRadius:14,padding:"14px 13px",display:"flex",flexDirection:"column",gap:6}}>
                <div style={{fontSize:22}}>{c.icon}</div>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"var(--muted)"}}>{c.label}</div>
                <div style={{fontFamily:"'Lora',serif",fontSize:18,color:"var(--ink)",fontWeight:400}}>{c.val}</div>
                <div style={{fontSize:10,color:"var(--muted)",lineHeight:1.5}}>{c.note}</div>
              </div>
            ))}
          </div>

          {/* What's happening */}
          <div className="p-lbl" style={{color:"var(--rose)"}}>What's happening right now</div>
          {(education?.facts_list || [
            "Heart beating 150–170 bpm — nearly twice yours. Started at week 6, never paused.",
            "Fingers and toes forming — still slightly webbed, like tiny paddles.",
            "Eyelids formed and fused shut. Won't open until week 27.",
            "The tail is almost completely gone. Looks unmistakably human.",
            "Tiny spontaneous movements already happening — too small to feel yet.",
          ]).map((t,i)=>(
            <div key={i} className="p-fact"><div className="p-dot" style={{background:"var(--rose)"}}/><div style={{fontSize:13,lineHeight:1.6}}>{t}</div></div>
          ))}

          <div className="p-card pc-white" style={{fontFamily:"'Lora',serif",fontSize:14,fontStyle:"italic",color:"var(--muted)",lineHeight:1.7,marginTop:8}}>
            {education?.key_quote || "That heart started beating and hasn't stopped once since. Through your nausea, your exhaustion, your fears — it just keeps going."}
          </div>
        </>}

        {tab==="senses" && <>
          <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.65,marginBottom:16}}>At week {week || 8} your baby's sensory world is forming. Some are already active, others are wiring up.</div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:16}}>
            {[
              {ico:"🤚",name:"Touch",status:"active",col:"var(--rose)",bg:"var(--rose-pale)",bdr:"var(--rose-bdr)",desc:"Skin receptors forming. Already curls away from stimulation."},
              {ico:"👁",name:"Sight",status:"forming",col:"var(--navy)",bg:"var(--navy-pale)",bdr:"var(--navy-bdr)",desc:"Eyes forming but fused shut. Can sense light by week 22."},
              {ico:"👂",name:"Hearing",status:"forming",col:"var(--navy)",bg:"var(--navy-pale)",bdr:"var(--navy-bdr)",desc:"Inner ear forming now. Will hear your voice from week 18–20."},
              {ico:"👅",name:"Taste",status:"later",col:"var(--muted)",bg:"var(--cream2)",bdr:"var(--bdr)",desc:"Taste buds form week 13–15. Will taste what you eat."},
            ].map((s,i)=>(
              <div key={i} style={{background:s.bg,border:`1px solid ${s.bdr}`,borderRadius:14,padding:"14px 12px"}}>
                <div style={{fontSize:22,marginBottom:8}}>{s.ico}</div>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                  <div style={{fontSize:12,fontWeight:600,color:"var(--ink)"}}>{s.name}</div>
                  <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:s.col,background:"rgba(255,255,255,0.6)",borderRadius:100,padding:"2px 7px"}}>{s.status}</div>
                </div>
                <div style={{fontSize:11,color:"var(--muted)",lineHeight:1.55}}>{s.desc}</div>
              </div>
            ))}
          </div>

          {/* Womb connection */}
          <div style={{background:"linear-gradient(135deg,#0a2020,#183535)",borderRadius:16,padding:"16px 18px",marginBottom:12}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color:"rgba(112,200,184,0.7)",marginBottom:8}}>Womb connection</div>
            <div style={{fontFamily:"'Lora',serif",fontSize:14,fontStyle:"italic",color:"rgba(255,255,255,0.82)",lineHeight:1.75}}>"Your baby can feel you moving. Your heartbeat is already their lullaby. The rhythm you've had all your life is the first sound they'll ever know."</div>
          </div>

          <div className="p-card pc-white" style={{fontSize:12,color:"var(--muted)",lineHeight:1.65}}>
            <strong style={{color:"var(--ink)",fontWeight:600}}>Something to start now:</strong> From around week 18, your baby will recognise sounds they've heard repeatedly. If you or your partner speak the same phrase, hum the same tune, or play the same song every day — baby may recognise it after birth. That's not superstition. That's memory beginning.
          </div>
        </>}
      </div>
    </div>
  );
}

export function BodyPanel({ onLogMood }) {
  const [logged, setLogged] = useState({});
  const logMood = (emoji) => {
    const key = emoji.split(" ")[0]; // just the emoji char
    setLogged(p=>({...p,[key]:true}));
    if (onLogMood) onLogMood(key);
  };
  return <>
    <div className="p-story">
      <div className="p-story-tag">✦ First-hand</div>
      <div className="p-story-meta"><div className="p-story-av">👩</div><div className="p-story-name">Priya · Bengaluru · First pregnancy</div></div>
      <div className="p-story-q">Early pregnancy was the hardest stretch for me. The nausea wasn't just morning — it was 3pm, 9pm, 2am. I couldn't stand the smell of my own kitchen. My MIL kept pushing khichdi. Some days it helped. Most days, plain toast was all I could manage. And I felt guilty about that. Nobody told me the guilt was part of it too.</div>
      <div className="p-story-foot">You are not alone in this. Not even a little bit.</div>
    </div>
    <div className="india-chip" style={{marginTop:16}}>🇮🇳 The Indian pregnancy experience</div>
    <div className="p-card pc-amber" style={{marginBottom:16}}><strong>The gap between how you feel and how you look is real.</strong> You're exhausted and sick but nobody can see it yet. That isolation is one of the hardest parts of the first trimester.</div>
    <div className="p-lbl" style={{color:"var(--rose)"}}>What your body is doing</div>
    {["Nausea peaks this week — eases after week 12 for 80% of women.",
      "Breasts tender and may have grown a full size. A good bra is relief, not luxury.",
      "Fatigue unlike anything before. Your body is building a placenta from scratch.",
      "Heightened smell — biology protecting baby from toxins. It's real.",
      "Frequent urination — kidneys working 30–50% harder than usual."].map((t,i)=>(
      <div key={i} className="p-fact"><div className="p-dot" style={{background:"var(--rose)"}}/><div style={{fontSize:13,lineHeight:1.6}}>{t}</div></div>
    ))}
    <div className="p-lbl" style={{color:"var(--muted)",marginTop:20}}>What you're feeling inside</div>
    <div className="em-wrap">
      {["😰 Anxious every day","😴 Bone-tired","🤢 Constantly nauseous","😭 Randomly teary","😤 Nobody understands","🤍 Quietly excited","😕 Guilty for resting","🌀 Overwhelmed"].map(e=>{
        const key = e.split(" ")[0];
        return <div key={e} className={`em-pill${logged[key]?" logged":""}`} onClick={()=>logMood(e)}>{e}{logged[key]?" ✓":""}</div>;
      })}
    </div>
    <div style={{fontSize:12,color:"var(--muted)",marginTop:10,fontStyle:"italic",lineHeight:1.6}}>All of these can live in you simultaneously. None of them make you a bad mother.</div>
    <div className="p-lbl" style={{color:"var(--teal)",marginTop:20}}>For your partner</div>
    <div className="p-card pc-teal">
      <div style={{fontSize:12,fontWeight:700,color:"var(--teal)",marginBottom:8}}>Show this to your partner 👇</div>
      <div style={{fontSize:13,lineHeight:1.7}}><strong>What she's going through:</strong> She feels sick most of the day and is carrying enormous anxiety — all while looking completely normal.<br/><br/><strong>What actually helps:</strong> Keep ginger biscuits stocked. Take over cooking. Let her sleep without guilt. Tell her she's doing amazingly.</div>
    </div>
  </>;
}

export function ThreeAmPanel({ week, weeklyContent }) {
  const staticFaq = [
    {q:`Is it normal to feel this way at week ${week ?? "…"}?`,a:"Yes — symptoms are often most intense in the first trimester and ease significantly after week 12. You're not sicker than others."},
    {q:"I haven't felt nauseous at all — should I be worried?",a:"No. About 20–30% of women have little to no nausea and have completely healthy pregnancies."},
    {q:"Is it safe to eat only toast and crackers for days?",a:"Yes. Surviving on bland food in the first trimester is fine. The baby takes what it needs."},
    {q:"Why do I cry for no reason?",a:"Progesterone and hCG are surging to levels your body has never experienced. Completely hormonal."},
    {q:"Can I eat paneer / curd / ghee?",a:"Yes, yes, and yes. These are excellent protein sources. The old advice to avoid dairy is not evidence-based."},
    {q:"I haven't told anyone and I feel so alone",a:"One of the hardest parts of early pregnancy. Consider telling one trusted person."},
  ];
  const faq = weeklyContent?.education?.faq?.length
    ? weeklyContent.education.faq
    : staticFaq;

  return <>
    <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.65,marginBottom:18,fontStyle:"italic"}}>The searches everyone makes at 2am. You're not alone in any of these.</div>
    {faq.map((item,i)=>(
      <div key={i} className="p-card pc-white" style={{marginBottom:10}}>
        <div style={{fontSize:13,fontWeight:600,color:"var(--ink)",marginBottom:6,display:"flex",gap:8}}><span style={{color:"var(--rose)",flexShrink:0}}>?</span>{item.q}</div>
        <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.65,paddingLeft:20}}>{item.a}</div>
      </div>
    ))}
  </>;
}

export function NobodyTellsPanel() {
  return <>
    {[{ico:"😶",t:"Nobody tells you about the nausea trap",b:"Worse on empty stomach — eat tiny amounts every 90 minutes before you feel hungry."},
      {ico:"🌙",t:"Nobody tells you about 3am hunger",b:"Many women wake up ravenous at 3am. Keep something on your bedside table."},
      {ico:"💭",t:"Nobody tells you about the fear of attachment",b:"Many women hold back from getting excited. The fear of loss is real. This doesn't mean you're not bonded."},
      {ico:"👃",t:"Nobody tells you smell works differently",b:"You can smell things others can't detect. Your body's ancient protection system working as designed."},
      {ico:"😤",t:"Nobody tells you how lonely the secret is",b:"You're exhausted and sick while pretending everything is normal at family events, office meetings, everything."},
      {ico:"🤝",t:"Nobody tells you that your relationship shifts",b:"Your partner may not know how to help. The couples who do best talk about this explicitly."},
    ].map((item,i)=>(
      <div key={i} className="p-card pc-plum" style={{marginBottom:10}}>
        <div style={{fontSize:20,marginBottom:6}}>{item.ico}</div>
        <div style={{fontSize:13,fontWeight:600,color:"var(--plum)",marginBottom:5}}>{item.t}</div>
        <div style={{fontSize:13,color:"var(--ink)",lineHeight:1.65}}>{item.b}</div>
      </div>
    ))}
  </>;
}

export function PartnerPanel({ week }) {
  const [done, setDone] = useState({});
  const toggle = id => setDone(p=>({...p,[id]:!p[id]}));
  const missions = [
    {id:1,title:"Stock ginger biscuits and coconut water at home",why:"Nausea is intense in the first trimester. Having these without being asked is worth more than you know.",tag:"Essential",col:"#c04040"},
    {id:2,title:"Take over one meal this week — don't ask, just do it",why:"The smell of cooking is often unbearable right now. Doing this once, without prompting, feels enormous to her.",tag:"High impact",col:"#8a5010"},
    {id:3,title:"Ask her one real question tonight",why:"Not 'how are you?' Try: 'What's the scariest thing on your mind right now?' Then just listen. Don't fix.",tag:"Emotional",col:"var(--navy)"},
    {id:4,title:"Book the TVS dating scan if she hasn't already",why:"Should happen between weeks 7–10. Offer to make the call and come along.",tag:"Action",col:"var(--plum)"},
  ];
  const doneCount = Object.values(done).filter(Boolean).length;

  return <>
    <div style={{background:"linear-gradient(135deg,#eaf2f8,#d8e8f5)",borderRadius:16,padding:"16px 18px",marginBottom:16}}>
      <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color:"var(--navy)",marginBottom:6}}>Week {week ?? 8} · For partners</div>
      <div style={{fontFamily:"'Lora',serif",fontSize:16,color:"#1a2a40",lineHeight:1.6,fontWeight:400}}>She's doing something extraordinary. Here's what actually matters this week — specific, not generic.</div>
    </div>

    <div className="p-card pc-white" style={{marginBottom:16}}>
      <div style={{fontSize:13,fontWeight:600,color:"var(--ink)",marginBottom:8}}>What she's going through right now</div>
      <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.7}}>She feels sick most of the day — not just morning. She's more exhausted than she's let on. She's carrying enormous anxiety about whether everything is okay, all while looking completely normal to everyone around her.<br/><br/>She doesn't need solutions. She needs presence.</div>
    </div>

    <div className="p-lbl" style={{color:"var(--navy)"}}>Your missions this week</div>

    {missions.map(m=>(
      <div key={m.id}
        onClick={()=>toggle(m.id)}
        style={{display:"flex",gap:12,alignItems:"flex-start",background:done[m.id]?"var(--cream2)":"#fff",border:"1px solid var(--bdr)",borderRadius:14,padding:"14px 15px",marginBottom:9,cursor:"pointer",opacity:done[m.id]?0.7:1,transition:"all 0.15s"}}>
        <div style={{width:22,height:22,borderRadius:"50%",border:`1.5px solid ${done[m.id]?"var(--navy)":"var(--bdr)"}`,background:done[m.id]?"var(--navy)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,transition:"all 0.15s"}}>
          {done[m.id]&&<span style={{color:"#fff",fontSize:10,fontWeight:700}}>✓</span>}
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:500,color:"var(--ink)",lineHeight:1.35,marginBottom:4,textDecoration:done[m.id]?"line-through":"none"}}>{m.title}</div>
          <div style={{fontSize:11,color:"var(--muted)",lineHeight:1.55,marginBottom:5}}>{m.why}</div>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:m.col}}>{m.tag}</div>
        </div>
      </div>
    ))}

    {/* Progress */}
    <div style={{background:"var(--navy-pale)",border:"1px solid var(--navy-bdr)",borderRadius:14,padding:"13px 16px",display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
      <div style={{fontFamily:"'Lora',serif",fontSize:18,color:"var(--navy)",fontWeight:400,flexShrink:0}}>{doneCount}/4</div>
      <div style={{flex:1,height:6,background:"rgba(42,74,112,0.12)",borderRadius:100,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${doneCount/4*100}%`,background:"var(--navy)",borderRadius:100,transition:"width 0.3s"}}/>
      </div>
      <div style={{fontSize:11,color:"var(--navy)",fontWeight:600,flexShrink:0}}>
        {["Partner points","Keep going","Halfway!","Almost!","Week done 🎉"][doneCount]}
      </div>
    </div>

    <div className="p-card pc-teal">
      <div style={{fontSize:12,fontWeight:700,color:"var(--teal)",marginBottom:6}}>What not to say this week</div>
      {["\"You're overthinking this.\"","\"Other women manage fine.\"","\"Just eat something.\"","\"You don't look sick.\""].map((s,i)=>(
        <div key={i} style={{fontSize:12,color:"var(--teal)",lineHeight:1.6,display:"flex",gap:8,marginBottom:3}}>
          <span style={{opacity:0.5,flexShrink:0}}>✗</span>{s}
        </div>
      ))}
    </div>
  </>;
}

export function WinsPanel({ week, weeklyContent }) {
  const wc = weeklyContent?.wins_copy;
  const subtitle = wc?.subtitle || "That heartbeat hasn't stopped once. Neither have you.";
  const genericBullets = [
    "You showed up for yourself and your baby today",
    "You rested when your body asked you to, even if it felt lazy",
    "You got through another day — and that counts more than you know",
    "Your body is doing something extraordinary, quietly, every single minute",
    "You are further along than you were last week",
  ];
  return <>
    <div className="p-card pc-wins" style={{textAlign:"center",padding:"24px 20px",marginBottom:16}}>
      <div style={{fontSize:36,marginBottom:10}}>🎉</div>
      <div style={{fontFamily:"'Lora',serif",fontSize:20,fontStyle:"italic",color:"#fff",lineHeight:1.5,marginBottom:8}}>
        You made it to week {week ?? "…"}.
      </div>
      <div style={{fontSize:13,color:"rgba(255,255,255,0.6)",lineHeight:1.7}}>{subtitle}</div>
    </div>
    <div className="p-lbl" style={{color:"var(--plum)"}}>This week's wins — however small</div>
    {genericBullets.map((t,i)=>(
      <div key={i} className="p-fact"><div className="p-dot" style={{background:"var(--plum)"}}/><div style={{fontSize:13,lineHeight:1.6}}>{t}</div></div>
    ))}
    <div className="p-card pc-white" style={{marginTop:8,fontFamily:"'Lora',serif",fontSize:14,fontStyle:"italic",color:"var(--muted)",lineHeight:1.7}}>
      On the hardest days: you don't have to feel good about this. You just have to get through it. That's enough.
    </div>
  </>;
}

export function FoodPanel({ week, weeklyContent }) {
  const today = istDate();

  const loadNutr = () => {
    try {
      const raw = localStorage.getItem(NUTR_KEY);
      const data = raw ? JSON.parse(raw) : {};
      // Reset if new day OR if old format (stored numbers instead of null/true/false)
      if (data.date !== today || typeof data.protein === "number" || typeof data.water === "number") {
        return { date: today, protein: null, water: null };
      }
      return data;
    } catch { return { date: today, protein: null, water: null }; }
  };
  const saveNutr = (data) => {
    try { localStorage.setItem(NUTR_KEY, JSON.stringify(data)); } catch {}
  };

  const [nutr, setNutr] = useState(loadNutr);

  const log = (key, val) => {
    setNutr(p => {
      const next = { ...p, [key]: val };
      saveNutr(next);
      return next;
    });
  };

  const METERS = [
    {
      key: "protein",
      icon: "🥚",
      name: "Protein",
      target: "60g / day",
      color: "var(--forest)",
      note: "Most under-consumed nutrient in Indian pregnancies. Dal, curd, paneer, or eggs at every meal.",
    },
    {
      key: "water",
      icon: "💧",
      name: "Water",
      target: "3L / day",
      color: "var(--navy)",
      note: "Dehydration worsens nausea. Sip constantly rather than large amounts at once.",
    },
  ];

  return <>
    <div className="p-lbl" style={{color:"var(--forest)"}}>Today's targets</div>
    <div className="nutr-meters">
      {METERS.map(m => {
        const val = nutr[m.key]; // null = not logged, true = yes, false = no
        return (
          <div key={m.key} className="nutr-meter">
            <div className="nutr-meter-top">
              <div className="nutr-meter-left">
                <div className="nutr-meter-icon">{m.icon}</div>
                <div>
                  <div className="nutr-meter-name">{m.name}</div>
                  <div className="nutr-meter-target">Week {week ?? 8} · {m.target}</div>
                </div>
              </div>
              {/* Status indicator */}
              {val === true  && <div style={{fontSize:11,fontWeight:600,color:"var(--forest)",display:"flex",alignItems:"center",gap:4}}>✓ Done today</div>}
              {val === false && <div style={{fontSize:11,fontWeight:600,color:"var(--rose)",display:"flex",alignItems:"center",gap:4}}>Not yet</div>}
            </div>

            {/* Progress bar */}
            <div className="nutr-track" style={{marginBottom:10}}>
              <div className="nutr-fill" style={{
                width: val === true ? "100%" : val === false ? "0%" : "0%",
                background: val === true ? m.color : "var(--rose)"
              }}/>
            </div>

            {/* Yes / No buttons — show when not logged OR when said not yet */}
            {(val === null || val === false) && (
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>log(m.key, true)}
                  style={{flex:1,background:m.color,color:"#fff",border:"none",borderRadius:100,padding:"9px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                  ✓ Yes, I did
                </button>
                <button onClick={()=>log(m.key, false)}
                  style={{flex:1,background:val===false?"var(--rose-pale)":"var(--cream2)",color:val===false?"var(--rose)":"var(--muted)",border:`1px solid ${val===false?"var(--rose-bdr)":"var(--bdr)"}`,borderRadius:100,padding:"9px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                  Not yet
                </button>
              </div>
            )}

            {/* Change answer */}
            {val !== null && (
              <button onClick={()=>log(m.key, null)}
                style={{background:"none",border:"none",fontSize:10,color:"var(--muted)",cursor:"pointer",fontFamily:"inherit",padding:0,opacity:0.7}}>
                Change
              </button>
            )}

            <div className="nutr-note">{m.note}</div>
          </div>
        );
      })}
    </div>

    <div className="p-card pc-sage" style={{marginBottom:16}}><strong>Keeping something down matters more than eating perfectly.</strong> Small amounts constantly beats three perfect meals. Don't let anyone make you feel guilty about surviving on crackers.</div>
    <div className="india-chip">🇮🇳 Indian kitchen guide</div>
    <div className="p-lbl" style={{color:"var(--forest)",marginTop:10}}>Your best friends right now</div>
    {[
      {ico:"🌰",nm:"Almonds & walnuts soaked overnight",note:"Best absorbed when soaked. A handful is enough — protein, omega-3, healthy fats."},
      {ico:"🍚",nm:"Poha, idli, dhokla, fresh paneer, vermicelli, avocado",note:"Mild, easy to digest. Excellent sources of protein and complex carbs."},
      {ico:"🥥",nm:"Coconut water",note:"Natural electrolytes, relieves nausea. 1–2 tender coconuts a day."},
      {ico:"🍶",nm:"Curd, yogurt, buttermilk",note:"Probiotics support gut health. Room temperature is better than cold."},
      {ico:"🍎",nm:"Apple, orange, pear",note:"Gentle on the stomach. Vitamin C helps iron absorption — eat with iron-rich foods."},
      {ico:"🥗",nm:"Moong dal, khichdi, green vegetables, salad",note:"Complete protein and fibre. Add ghee to khichdi — it helps nutrient absorption."},
    ].map((f,i)=>(
      <div key={i} className="f-row"><div className="f-ico">{f.ico}</div><div><div className="f-name">{f.nm}</div><div className="f-note">{f.note}</div></div></div>
    ))}
    <div className="p-lbl" style={{color:"#c04040",marginTop:18}}>Avoid right now</div>
    {[
      {ico:"🍈",nm:"Raw / unripe papaya",note:"Known uterine stimulant. Avoid entirely."},
      {ico:"🍍",nm:"Pineapple in large amounts",note:"Bromelain can cause contractions."},
      {ico:"🥛",nm:"Unpasteurised milk",note:"Listeria risk."},
      {ico:"🥗",nm:"Street chaat, raw salads",note:"Infection risk is significantly higher now."},
      {ico:"☕",nm:"More than 1 cup coffee/tea",note:"200mg caffeine limit per day."},
    ].map((f,i)=>(
      <div key={i} className="f-row"><div className="f-ico">{f.ico}</div><div><div className="f-name">{f.nm}</div><div className="f-note">{f.note}</div></div></div>
    ))}
  </>;
}
