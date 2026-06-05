import React, { useState } from 'react';
import { myths } from '../../constants/myths';
import { CHECKLIST_STORAGE_KEY, loadChecked, saveChecked } from '../../utils/storage';

export const CHECKS = [
  {id:1,text:"Finalize your doctor",pri:"Today",col:"#c04040"},
  {id:2,text:"Tell your parents and close ones",pri:"Today",col:"#c04040"},
  {id:3,text:"Schedule scan",pri:"Today",col:"#c04040"},
  {id:4,text:"Start folic acid daily",pri:"This week",col:"#8a5010"},
  {id:5,text:"Tell your partner what you need",pri:"This week",col:"#8a5010"},
  {id:6,text:"Stock nausea foods: crackers, curd, coconut water",pri:"This week",col:"#8a5010"},
  {id:7,text:"Create a folder for all scans and reports",pri:"Soon",col:"#3d6b4a"},
];

export function MythPanel() {

  return <>
    <div style={{background:"var(--amber-pale)",border:"1px solid var(--amber-bdr)",borderRadius:14,padding:"14px 16px",marginBottom:16,fontSize:13,lineHeight:1.65}}>
      <strong>The rule:</strong> If advice comes from a relative but not your doctor, question it. Most pregnancy myths in India are well-meaning but wrong — and some cause unnecessary anxiety or harmful behaviour.
    </div>
    {myths.map((m,i)=>(
      <div key={i} style={{background:m.bg,border:`1px solid ${m.bdr}`,borderRadius:16,padding:"14px 16px",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,marginBottom:8}}>
          <div style={{fontSize:13,fontWeight:600,color:"var(--ink)",lineHeight:1.35,flex:1}}>"{m.claim}"</div>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:m.col,background:"rgba(255,255,255,0.7)",borderRadius:100,padding:"3px 10px",flexShrink:0,whiteSpace:"nowrap"}}>{m.verdict}</div>
        </div>
        <div style={{fontSize:12,color:"var(--muted)",lineHeight:1.65}}>{m.explanation}</div>
      </div>
    ))}
    <div className="p-card pc-white" style={{fontFamily:"'Lora',serif",fontSize:13,fontStyle:"italic",color:"var(--muted)",lineHeight:1.7,marginTop:4}}>
      You are allowed to say "that's not what my doctor said" to anyone — including your mother-in-law.
    </div>
  </>;
}

export function PlanningPanel({ week }) {
  const [profile, setProfile] = useState(null);
  const profiles = [
    {id:"working",label:"Working full-time",icon:"💼"},
    {id:"wfh",label:"Working from home",icon:"🏠"},
    {id:"housewife",label:"Managing home full-time",icon:"🏡"},
    {id:"freelance",label:"Freelancer / self-employed",icon:"💻"},
  ];
  const content = {
    working: {
      title:"You're working full-time",
      intro:`Week ${week ?? 8} is one of the hardest weeks to be in an office. You're exhausted, nauseated, and keeping the biggest secret of your life.`,
      sections:[
        {head:"This week at work",col:"var(--navy)",items:[
          "Keep crackers in your desk drawer. Eating every 90 minutes reduces nausea significantly.",
          "Identify the nearest private space to rest or feel sick — a quiet bathroom, an empty room.",
          "You don't have to tell your manager yet. Most women wait until after the 12-week scan.",
          "If you have a trusted colleague, consider telling one person so you're not completely alone.",
        ]},
        {head:"Your legal rights (India)",col:"var(--forest)",items:[
          "Maternity Benefit Act: 26 weeks paid leave for the first two children.",
          "Your employer cannot terminate or reduce your pay due to pregnancy.",
          "You're entitled to medical leave for pregnancy-related illness.",
          "Start reviewing your company policy now — leave applications often need advance notice.",
        ]},
        {head:"The mental load",col:"var(--rose)",items:[
          "Pregnancy brain is real — progesterone affects concentration and memory.",
          "Consider keeping a work notebook for tasks you'd normally remember easily.",
          "This is not incompetence. It is biology. It passes.",
        ]},
      ]
    },
    wfh: {
      title:"You're working from home",
      intro:"WFH during early pregnancy feels like a gift — until you realise the bathroom is 10 steps away and the kitchen smells are inescapable.",
      sections:[
        {head:"This week",col:"var(--navy)",items:[
          "Give yourself permission to lie down between calls. A 15-minute rest matters.",
          "Keep your camera off during nausea waves — you don't owe anyone an explanation.",
          "Eat before your first meeting. Empty stomach = worse nausea.",
          "Set a firm end time to your day. WFH boundaries matter more when you're exhausted.",
        ]},
        {head:"The hidden challenge",col:"var(--amber)",items:[
          "WFH can feel isolating even without pregnancy. With it, the silence can amplify anxiety.",
          "Schedule at least one real conversation per day — with a colleague, friend, or your partner.",
          "Getting dressed and sitting at a proper desk helps more than it sounds.",
        ]},
      ]
    },
    housewife: {
      title:"You're managing the home full-time",
      intro:"You're doing invisible work every day — and now you're doing it while growing a human. That deserves to be said out loud.",
      sections:[
        {head:"What needs to change this week",col:"var(--rose)",items:[
          "Heavy lifting, bending repeatedly, and standing for long periods should be minimised.",
          "Cooking smells are a known nausea trigger. Ask your partner or family to cook when possible.",
          "You are not lazy for resting. Rest is work right now.",
          "If you have household help, this is the time to use them more, not less.",
        ]},
        {head:"The things nobody acknowledges",col:"var(--plum)",items:[
          "Managing a home full-time while pregnant gets very little acknowledgement. It should.",
          "The expectation to 'keep the house running' doesn't pause for first trimester nausea.",
          "You're allowed to set a lower standard for yourself right now. The house will be fine.",
          "If family pressure is real — 'you should be fine, you're at home all day' — know this is wrong.",
        ]},
      ]
    },
    freelance: {
      title:"You're freelancing or self-employed",
      intro:"No paid leave. No HR department. No colleagues who notice when you're struggling. The freedom of freelancing cuts both ways during pregnancy.",
      sections:[
        {head:"Practical this week",col:"var(--navy)",items:[
          "Review your project pipeline — identify which deadlines fall in weeks 10–14 when nausea often peaks.",
          "Consider telling one or two trusted clients early — it buys goodwill and flexibility later.",
          "Start building a small financial buffer now if possible. Even ₹5,000 a month matters.",
          "Look into group health insurance plans — several are available for self-employed women.",
        ]},
        {head:"The mental weight",col:"var(--amber)",items:[
          "No maternity benefit. No guaranteed income during leave. This anxiety is completely rational.",
          "Planning now reduces it. Even a rough financial plan for 3 months post-delivery helps.",
          "Your clients don't own your body or your timeline. You are allowed to take time off.",
        ]},
      ]
    },
  };
  const plan = profile ? content[profile] : null;
  return <>
    {!profile ? <>
      <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.65,marginBottom:16}}>Pregnancy looks different depending on your daily life. Select what fits you best for guidance that's actually relevant.</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
        {profiles.map(p=>(
          <div key={p.id} onClick={()=>setProfile(p.id)}
            style={{background:"#fff",border:"1px solid var(--bdr)",borderRadius:16,padding:"18px 16px",cursor:"pointer",textAlign:"center",transition:"all 0.15s"}}>
            <div style={{fontSize:28,marginBottom:8}}>{p.icon}</div>
            <div style={{fontSize:12,fontWeight:600,color:"var(--ink)",lineHeight:1.35}}>{p.label}</div>
          </div>
        ))}
      </div>
    </> : <>
      <button onClick={()=>setProfile(null)} style={{background:"none",border:"none",padding:"0 0 14px",fontSize:12,fontWeight:600,color:"var(--muted)",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>← Change</button>
      <div style={{background:"var(--navy-pale)",border:"1px solid var(--navy-bdr)",borderRadius:14,padding:"14px 16px",marginBottom:16}}>
        <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"var(--navy)",marginBottom:5}}>{plan.title}</div>
        <div style={{fontFamily:"'Lora',serif",fontSize:14,fontStyle:"italic",color:"#1a2a40",lineHeight:1.65}}>{plan.intro}</div>
      </div>
      {plan.sections.map((s,i)=>(
        <div key={i} style={{marginBottom:16}}>
          <div className="p-lbl" style={{color:s.col}}>{s.head}</div>
          {s.items.map((item,j)=>(
            <div key={j} className="p-fact"><div className="p-dot" style={{background:s.col}}/><div style={{fontSize:13,lineHeight:1.65}}>{item}</div></div>
          ))}
        </div>
      ))}
    </>}
  </>;
}

export function FearsPanel() {
  const [open, setOpen] = useState(null);
  const fears = [
    {id:"miscarriage",label:"Fear of miscarriage",icon:"💔",
      intro:"This fear is so common it's almost universal in the first trimester — and almost nobody talks about it.",
      body:"About 10–15% of known pregnancies end in miscarriage, mostly in the first 12 weeks. This statistic, which is meant to be reassuring, can feel terrifying when you're the one pregnant.\n\nThe hard truth: most miscarriages happen because of chromosomal issues in the embryo — not because of anything you did or didn't do. Not because you exercised, felt stressed, had an argument, didn't eat perfectly, or didn't want it enough at first.\n\nThe fear is real. Sitting with it — not suppressing it — is healthier than pretending it away. Let yourself feel it, talk to someone you trust, and know that reaching the heartbeat milestone at week 6–8 significantly reduces the risk.",
      note:"If you've had a previous miscarriage, this fear is even more acute. That's not anxiety — it's experience. Tell your doctor. Extra early monitoring is available and valid to ask for."},
    {id:"stillbirth",label:"Fear of stillbirth",icon:"🌧️",
      intro:"A fear most women have but feel they can't say out loud.",
      body:"Stillbirth (loss after 20 weeks) affects about 1 in 200 pregnancies — rarer than miscarriage, but the fear of it can be consuming, especially as the pregnancy progresses and you have more to lose.\n\nThe thing about this fear is that it often intensifies precisely when things are going well — because the more real the baby becomes, the more there is to be afraid of losing.\n\nKick counting from week 28 onward is the most practical thing you can do — not because it prevents anything, but because it gives you information and agency. Any significant change in movement is a reason to call your doctor immediately.",
      note:"This fear is especially intense for women who have experienced loss before, or who have family members who have. You are not catastrophising. You are loving someone you haven't met yet."},
    {id:"deformities",label:"Worry about the baby's health",icon:"🧬",
      intro:"The scan anxiety nobody prepares you for.",
      body:"The worry that something might be wrong with your baby is one of the most universal and least discussed fears in pregnancy. Most women Google symptoms obsessively, dread every scan, and feel a particular kind of suspended dread in the days between a scan and its results.\n\nThe NT scan at 11–14 weeks and the anomaly scan at 18–20 weeks screen for the most common chromosomal and structural concerns. Most of the time, everything is fine. But \"most of the time\" doesn't feel comforting when you're the one waiting.\n\nWhat helps: knowing what each scan does and doesn't show, having a support person at appointments, and having a plan for how you'd handle different results — not because the worst is likely, but because having thought about it reduces its power.",
      note:"If you have a family history of genetic conditions or are over 35, talk to your doctor about genetic counselling. Knowledge is less frightening than uncertainty."},
    {id:"labour",label:"Fear of labour pain",icon:"😨",
      intro:"The fear everyone has but many feel embarrassed to admit.",
      body:"Labour is painful. There is no gentle way to say this, and pretending otherwise doesn't help. But there is a large difference between pain with no end and pain with a known purpose and timeline.\n\nWhat actually helps: understanding what's happening at each stage (your body knows what to do — this is not an emergency, it's a physiological process), learning about pain management options well before the due date, and choosing a birth environment where you feel safe.\n\nEpidurals are not failure. Pain relief is not weakness. Natural birth is not morally superior. You get to decide what feels right for you — and that decision should be made without guilt from anyone.\n\nWomen who prepare — who understand what's coming, who have practiced breathing, who know their options — consistently report more positive birth experiences.",
      note:"A birth preferences document (not a rigid birth plan) that you discuss with your doctor around week 30–32 is one of the best ways to reduce birth-related anxiety."},
    {id:"csection",label:"Fear of C-section",icon:"🏥",
      intro:"Whether you want one or are afraid of having one — both fears are valid.",
      body:"Some women fear being forced into a C-section. Others fear vaginal birth and want a C-section but feel judged for it. Both are legitimate positions.\n\nC-section is major abdominal surgery. Recovery takes 6–8 weeks and is genuinely harder than most people are told. It is not the 'easy way out' — that phrase should never be used.\n\nAt the same time, when medically indicated, C-sections save lives. India has both too-high C-section rates in some private hospitals and dangerously low access in others.\n\nThe most useful thing you can do: understand your hospital's C-section rate, understand what conditions typically warrant one, and make your preferences known early — while remaining open to medical reality.",
      note:"If you've had a previous C-section, discuss VBAC (vaginal birth after caesarean) options with your doctor early. It's a valid option for many women."},
    {id:"badmom",label:"Fear of being a bad mother",icon:"🤍",
      intro:"This fear usually starts the moment you see the positive test.",
      body:"The fear that you won't be good enough — patient enough, present enough, loving enough, natural enough — is so universal that its absence would be more remarkable.\n\nHere is what the research consistently shows: the fact that you're worried about being a good mother is one of the strongest predictors that you will be one. Neglectful or harmful parents typically don't lie awake worrying about this.\n\nYou don't have to feel instant, overwhelming love the moment you give birth. Bonding is a process, not an event. Many women feel disconnected from their newborn at first — and then fall completely in love over days or weeks. This is normal.\n\nYou are allowed to be imperfect. Your child doesn't need a perfect mother. They need a present one.",
      note:"Postnatal depression affects 10–15% of new mothers in India and is vastly underdiagnosed. If you feel persistently low, disconnected, or anxious after birth — please talk to your doctor. It is treatable and asking for help is not weakness."},
    {id:"body",label:"Fear about your body changing",icon:"🪞",
      intro:"A fear that gets dismissed too easily.",
      body:"Worrying about your body changing during pregnancy is treated as something shallow — something you should feel ashamed of feeling. You shouldn't.\n\nYour body is going to change significantly. Some of it is temporary. Some of it is permanent. Stretch marks, abdominal muscle separation (diastasis recti), changes to your breasts, your core strength, your weight distribution — these are real, and pretending they don't matter doesn't help.\n\nWhat does help: understanding what changes are temporary and which are permanent, knowing which physical changes can be addressed postnatally with appropriate physiotherapy, and accepting that growing and birthing a human being has physical consequences — and that this is not a failure of your body but evidence of what it did.\n\nYou are allowed to grieve the body you had before while simultaneously being grateful for what your body is doing.",
      note:"Diastasis recti (abdominal separation) affects most pregnant women and can persist postnatally. A women's health physiotherapist, not just any gym trainer, should assess this before you return to core exercise after birth."},
    {id:"career",label:"Fear about career impact",icon:"📊",
      intro:"The fear that's entirely rational — because the impact is real.",
      body:"The career penalty for motherhood is documented and real. Women's earnings typically dip after having a child. Promotions slow. Professional networks shrink during leave. Re-entry after a career break is harder than employers like to admit.\n\nFeeling afraid of this is not selfish. It is sensible. You are allowed to want both a child and a career, and to grieve the trade-offs that exist between them.\n\nWhat helps: knowing your legal rights (maternity leave, protection from discriminatory termination), having an explicit conversation with your manager about return-to-work plans before you leave, keeping your professional network warm during leave, and — where possible — choosing an employer who has demonstrably supported mothers' careers.\n\nYou do not have to pretend the sacrifice isn't real. And you do not have to sacrifice more than is necessary.",
      note:"India's Maternity Benefit Act (2017) applies to establishments with 10+ employees. It provides 26 weeks paid leave for the first two children and mandates crèche facilities for certain employers. Know your rights."},
  ];

  return <>
    <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.65,marginBottom:16,fontStyle:"italic"}}>
      The fears most women have but rarely say out loud. You are not alone in any of these.
    </div>
    {fears.map(f=>(
      <div key={f.id} style={{marginBottom:9}}>
        <div onClick={()=>setOpen(open===f.id?null:f.id)}
          style={{background:open===f.id?"var(--ink)":"#fff",border:"1px solid var(--bdr)",borderRadius:open===f.id?"16px 16px 0 0":16,padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,transition:"all 0.15s"}}>
          <span style={{fontSize:20,flexShrink:0}}>{f.icon}</span>
          <div style={{flex:1,fontSize:13,fontWeight:600,color:open===f.id?"#fff":"var(--ink)",lineHeight:1.3}}>{f.label}</div>
          <span style={{fontSize:12,color:open===f.id?"rgba(255,255,255,0.4)":"var(--muted)",flexShrink:0}}>{open===f.id?"▲":"▼"}</span>
        </div>
        {open===f.id&&(
          <div style={{background:"var(--ink)",borderRadius:"0 0 16px 16px",padding:"0 16px 18px",border:"1px solid #2a1a14",borderTop:"none"}}>
            <div style={{fontFamily:"'Lora',serif",fontSize:13,fontStyle:"italic",color:"rgba(255,255,255,0.65)",lineHeight:1.65,marginBottom:12,paddingTop:4}}>{f.intro}</div>
            {f.body.split("\n\n").map((para,i)=>(
              <div key={i} style={{fontSize:13,color:"rgba(255,255,255,0.78)",lineHeight:1.75,marginBottom:10}}>{para}</div>
            ))}
            {f.note&&<div style={{background:"rgba(255,255,255,0.06)",borderRadius:12,padding:"11px 14px",fontSize:12,color:"rgba(255,255,255,0.5)",lineHeight:1.65,marginTop:6,fontStyle:"italic"}}>{f.note}</div>}
          </div>
        )}
      </div>
    ))}
  </>;
}

export function CheckPanel({ checked, toggle }) {
  return <>
    <div className="p-card pc-white" style={{padding:"4px 16px 12px",marginBottom:16}}>
      {CHECKS.map(c=>(
        <div key={c.id} className="cl-item" onClick={()=>toggle(c.id)}>
          <div className={`cl-ring${checked[c.id]?" on":""}`}>{checked[c.id]&&<span style={{color:"#fff",fontSize:10,fontWeight:700}}>✓</span>}</div>
          <div style={{flex:1}}><div className={`cl-txt${checked[c.id]?" on":""}`}>{c.text}</div><div className="cl-tag" style={{color:c.col}}>{c.pri}</div></div>
        </div>
      ))}
      <div style={{textAlign:"center",paddingTop:10,fontSize:12,color:"var(--muted)"}}>
        {Object.values(checked).filter(Boolean).length} of {CHECKS.length} done {Object.values(checked).filter(Boolean).length===CHECKS.length?"🎉":""}
      </div>
    </div>
    <div className="p-lbl" style={{color:"var(--amber)"}}>Worth buying this week</div>
    <div className="shop-row">
      {[{ico:"💊",nm:"Folic Acid + Iron",wy:"Neural development",pr:"₹120–300/mo"},
        {ico:"🩱",nm:"Supportive Bra",wy:"Non-negotiable now",pr:"₹400–800"},
        {ico:"💧",nm:"Water Bottle",wy:"3L/day — nice one helps",pr:"₹300–600"},
        {ico:"🍪",nm:"Ginger Biscuits",wy:"Best natural nausea fix",pr:"₹40–80"},
      ].map((s,i)=>(
        <div key={i} className="shop-tile"><div className="shop-ico">{s.ico}</div><div className="shop-nm">{s.nm}</div><div className="shop-wy">{s.wy}</div><div className="shop-pr">{s.pr}</div></div>
      ))}
    </div>
  </>;
}
