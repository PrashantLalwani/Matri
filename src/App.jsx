import "./styles/app.css";
import { useState, useEffect, useRef, useCallback } from "react";
import { analytics } from "./analytics";
import { supabase } from "./supabase";
import OnboardingFlow from "./components/OnboardingFlow";
import SymptomDetailPanel from "./components/SymptomDetailPanel";
import SymptomPanel from "./components/SymptomPanel";
import DoctorPrepSheet from "./components/DoctorPrepSheet";
import { COMMON_SYMPTOMS } from "./constants/symptoms";
import {
  WEEKLY_PROMPTS,
  getWeekPrompt
} from "./constants/journalPrompts";
import {
  MATRI_MOMENTS,
  getMatriMoment
} from "./constants/matriMoments";
import { myths } from "./constants/myths";
import {
  isPhotoUrl,
  isPhotoCrop,
  photoSquare,
  photoAlbum,
  photoThumb,
  compressImageFile,
  buildAlbumPages
} from "./utils/albumUtils";

// Matri v2.1 — build 2026-05-24

/* ─── AUTH FETCH HELPER ─────────────────────────────────────────────────── */
// Wraps fetch to always include the Supabase auth token
async function authFetch(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
}

/* ─── useHealthContext HOOK ──────────────────────────────────────────────── */
function useHealthContext() {
  const [healthContext, setHealthContext] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const resp = await authFetch("/api/health-context");
      if (resp.ok) {
        const data = await resp.json();
        setHealthContext(data);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { healthContext, refreshContext: refresh };
}

/* ─── DATA ───────────────────────────────────────────────────────────────── */

// All dates in IST (Asia/Kolkata, UTC+5:30)
const istDate = (d = new Date()) =>
  d.toLocaleDateString("en-IN", {day:"numeric", month:"short", year:"numeric", timeZone:"Asia/Kolkata"});
const istTime = (d = new Date()) =>
  d.toLocaleTimeString("en-IN", {hour:"2-digit", minute:"2-digit", timeZone:"Asia/Kolkata"});
const CHECKS = [
  {id:1,text:"Finalize your doctor",pri:"Today",col:"#c04040"},
  {id:2,text:"Tell your parents and close ones",pri:"Today",col:"#c04040"},
  {id:3,text:"Schedule scan",pri:"Today",col:"#c04040"},
  {id:4,text:"Start folic acid daily",pri:"This week",col:"#8a5010"},
  {id:5,text:"Tell your partner what you need",pri:"This week",col:"#8a5010"},
  {id:6,text:"Stock nausea foods: crackers, curd, coconut water",pri:"This week",col:"#8a5010"},
  {id:7,text:"Create a folder for all scans and reports",pri:"Soon",col:"#3d6b4a"},
];

const CHECKLIST_STORAGE_KEY = "matri-checklist-week-8";

function loadChecked() {
  try {
    const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveChecked(checked) {
  try {
    localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(checked));
  } catch { /* quota */ }
}

const STORIES = [
  {id:1,init:"P",name:"Priya M.",city:"Bengaluru",wk:"Wk 8 · First pregnancy",bg:"linear-gradient(135deg,#f5ddd0,#e8c5b0)",aCol:"#c05040",aBg:"#f5ddd0",ico:"🌸",title:"I thought something was wrong with me. It wasn't.",excerpt:"The nausea wasn't just morning — it was 3pm, 9pm, 2am. Nobody told me 80% of women feel exactly like I did.",tags:["Morning sickness","Family pressure"],body:"Week 8 was the hardest week for me. The nausea wasn't just morning — it was 3pm, 9pm, 2am. I couldn't stand the smell of my own kitchen.\n\nMy MIL kept pushing khichdi. Some days it helped. Most days, plain toast was all I could manage. And I felt guilty about that — like I was already failing at something I hadn't been taught how to do.\n\nNobody told me 80% of women feel exactly like I did. I spent three nights Googling 'is constant nausea normal week 8' before I believed it.\n\nYou are not alone in this. Not even a little bit."},
  {id:2,init:"A",name:"Ananya R.",city:"Mumbai",wk:"Wk 8 · Second pregnancy",bg:"linear-gradient(135deg,#d8e5f5,#c0d2ec)",aCol:"#2a4a70",aBg:"#d8e5f5",ico:"🌙",title:"The second time, I finally stopped apologising for resting.",excerpt:"With my first I kept saying yes to everything. By week 8 of my second I had one rule: if it costs energy I don't have, I say no.",tags:["Second pregnancy","Rest"],body:"With my first pregnancy I said yes to every family visit, every function, every 'just come for an hour.' I was exhausted and told myself that was normal.\n\nBy week 8 of my second, I had one rule: if it costs energy I don't have, I say no. No explanation beyond 'I need to rest.'\n\nThe guilt doesn't disappear — but it gets quieter when you stop negotiating with it.\n\nRest is not laziness. It is the work of growing a human."},
  {id:3,init:"D",name:"Divya S.",city:"Chennai",wk:"Wk 8 · IVF",bg:"linear-gradient(135deg,#d8f0e4,#bce0d0)",aCol:"#1a6060",aBg:"#d8f0e4",ico:"🌿",title:"Three IVF cycles and I'm still scared to be happy.",excerpt:"Joy and fear live together in a way nobody warned me about.",tags:["IVF","Anxiety","Hope"],body:"After three IVF cycles, week 8 felt like I should be nothing but grateful. And I am — deeply. But I'm also terrified every single day.\n\nEvery cramp makes me freeze. Every good scan makes me cry, and then I feel guilty for crying because I should just be happy.\n\nJoy and fear live together in a way nobody warned me about. Allowing both to exist doesn't mean you're ungrateful. It means you're human."},
];

const STORY_TAG_SUGGESTIONS = [
  "Morning sickness", "Family pressure", "Second pregnancy", "Rest", "IVF",
  "Anxiety", "Hope", "Partner", "Work", "Food", "Scans", "Loneliness",
];

const USER_STORIES_KEY = "matri-user-stories";

function loadUserStories() {
  try {
    const raw = localStorage.getItem(USER_STORIES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveUserStories(stories) {
  try {
    localStorage.setItem(USER_STORIES_KEY, JSON.stringify(stories));
  } catch { /* quota */ }
}

const MOODS = ["😊","😴","🤢","😭","😤","🥰"];

// Journal entries — with rich photo placeholder data
const JOURNAL_ENTRIES = [
  {id:1,week:6,date:"March 3, 2025",mood:"😊",
    text:"Found out today. Told only Rahul. We made chai and sat quietly together. That silence was the most beautiful thing.",
    photos:["✨","🩷"],
    heroBg:"linear-gradient(135deg,#fff7f0,#ffe8dc)",heroEmoji:"✨",heroBgColor:"#fff0e8"},
  {id:2,week:7,date:"March 10, 2025",mood:"🥰",
    text:"Heard the heartbeat for the first time. I wasn't prepared for how completely it would undo me. I cried the entire drive home.",
    photos:["💓","🌸"],
    heroBg:"linear-gradient(135deg,#fff0f4,#ffdde6)",heroEmoji:"💓",heroBgColor:"#ffeef2"},
  {id:3,week:8,date:"March 17, 2025",mood:"🤢",
    text:"Couldn't eat breakfast again. Managed half a banana and coconut water. Baby, you better be worth all this. (You already are.)",
    photos:["🌿","💧"],
    heroBg:"linear-gradient(135deg,#edf8f4,#d8f2ea)",heroEmoji:"🌿",heroBgColor:"#e8f8f2"},
  {id:4,week:8,date:"March 19, 2025",mood:"😴",
    text:"Slept 11 hours and still woke up exhausted. Rahul made poha without asking. The smallest kindnesses feel enormous right now.",
    photos:[],
    heroBg:"linear-gradient(135deg,#f0f0f8,#e0e0f2)",heroEmoji:"🌙",heroBgColor:"#ebebf8"},
  {id:5,week:10,date:"March 31, 2025",mood:"😌",
    text:"NT scan today. Everything looks good. We saw it move — this tiny wriggle, like it knew we were watching. I keep replaying it.",
    photos:["🩺","💫"],
    heroBg:"linear-gradient(135deg,#eaf2f8,#d5e8f5)",heroEmoji:"🩺",heroBgColor:"#e4f0f8"},
];


const CROP_ASPECTS = {
  square: { key: "square", exportW: 960, exportH: 960, label: "Memory", hint: "Square — for your timeline & polaroids" },
  album: { key: "album", exportW: 1280, exportH: 720, label: "Album", hint: "16:9 landscape — for pregnancy album pages" },
};

const MOOD_LOG_KEY = "matri-mood-log";
const NUTR_KEY     = "matri-nutrition-log";

function loadMoodLog() {
  try {
    const raw = localStorage.getItem(MOOD_LOG_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function saveMoodLog(log) {
  try { localStorage.setItem(MOOD_LOG_KEY, JSON.stringify(log)); } catch {}
}

const JOURNAL_STORAGE_KEY = "matri-journal-entries";
const JOURNAL_IDS_KEY = "matri-journal-ids";
const journalEntryKey = (id) => `matri-journal-entry-${id}`;



function loadJournalEntries() {
  try {
    const idsRaw = localStorage.getItem(JOURNAL_IDS_KEY);
    if (idsRaw) {
      const ids = JSON.parse(idsRaw);
      if (Array.isArray(ids) && ids.length) {
        const entries = ids
          .map((id) => {
            const raw = localStorage.getItem(journalEntryKey(id));
            return raw ? JSON.parse(raw) : null;
          })
          .filter(Boolean);
        if (entries.length) return entries;
      }
    }
    const legacy = localStorage.getItem(JOURNAL_STORAGE_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed) && parsed.length) {
        saveJournalEntries(parsed);
        localStorage.removeItem(JOURNAL_STORAGE_KEY);
        return parsed;
      }
    }
  } catch { /* fall through */ }
  return [];
}

function saveJournalEntry(entry) {
  const slim = {
    ...entry,
    photos: entry.photos.map((p) => {
      if (isPhotoCrop(p)) {
        const slim = { ...p };
        if (slim.square?.length > 120000) slim.square = null;
        if (slim.album?.length > 120000) slim.album = null;
        return slim.square || slim.album ? slim : null;
      }
      return isPhotoUrl(p) && p.length > 120000 ? null : p;
    }).filter(Boolean),
  };
  try {
    localStorage.setItem(journalEntryKey(entry.id), JSON.stringify(entry));
    return true;
  } catch {
    try {
      localStorage.setItem(journalEntryKey(entry.id), JSON.stringify(slim));
      return true;
    } catch {
      return false;
    }
  }
}

function saveJournalEntries(entries) {
  const ids = entries.map((e) => e.id);
  const savedIds = [];
  for (const entry of entries) {
    if (saveJournalEntry(entry)) savedIds.push(entry.id);
  }
  try {
    const prevRaw = localStorage.getItem(JOURNAL_IDS_KEY);
    const prevIds = prevRaw ? JSON.parse(prevRaw) : [];
    if (Array.isArray(prevIds)) {
      prevIds.forEach((id) => {
        if (!savedIds.includes(id)) localStorage.removeItem(journalEntryKey(id));
      });
    }
    localStorage.setItem(JOURNAL_IDS_KEY, JSON.stringify(savedIds));
  } catch { /* ids list failed */ }
  return savedIds.length;
}

const BABY_SIZES = {
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


/* ─── ALBUM PAGE COMPONENTS ───────────────────────────────────────────── */
const COVER_PHOTO_KEY = "matri-cover-photo";

// Extras whose names are variants of a core lab test should not be saved as separate rows
const CORE_LAB_ALIASES = [
  ["hemoglobin","haemoglobin","hb","hgb","hb level"],
  ["tsh","thyroid stimulating hormone","thyroid"],
  ["blood sugar fasting","blood sugar (f)","blood glucose fasting","fbs","fasting blood sugar",
   "fasting blood glucose","blood glucose fasting (fbs)","fasting sugar","fasting glucose","fbg","blood sugar f","glucose fasting"],
  ["blood sugar pp","blood sugar (pp)","postprandial blood sugar","pp blood sugar","post prandial",
   "ppbs","blood sugar post prandial","2hr pp","2 hr pp","post-prandial glucose","blood glucose pp"],
];
function isCoreLabAlias(name) {
  const n = (name || "").toLowerCase().trim();
  return CORE_LAB_ALIASES.some(group => group.some(a => n.includes(a) || a.includes(n)));
}

function PgCover() {
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
        <div className="pg-cover-name">Priya's pregnancy</div>
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

function PgChapter({ data }) {
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

function PgWeekHeader({ data }) {
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

function PgEntry({ data }) {
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

function PgClosing({ data }) {
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
function AlbumView({ entries, onClose }) {
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
      case "cover":       return <PgCover key={k}/>;
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
          <div className="album-bar-title">Priya's Pregnancy Story</div>
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

/* ─── PANEL CONTENT COMPONENTS ────────────────────────────────────────── */
function BabyPanel() {
  const [tab, setTab] = useState("size");
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
              <div style={{fontSize:11,color:"rgba(240,160,122,0.7)",fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:6}}>Week 8</div>
              <div style={{fontFamily:"'Lora',serif",fontSize:28,color:"#fff",lineHeight:1,marginBottom:6}}>1.6 cm</div>
              <div style={{fontSize:13,color:"rgba(255,255,255,0.55)",lineHeight:1.5}}>About the size of the tip of your thumb. Hold your thumb up — that's your baby right now.</div>
            </div>
          </div>

          {/* Size comparison cards */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:16}}>
            {[
              {icon:"✋",label:"Hand length",val:"6 mm",note:"Fingers forming, still slightly webbed"},
              {icon:"🦶",label:"Foot length",val:"5 mm",note:"Tiny toes just beginning to bud"},
              {icon:"❤️",label:"Heart rate",val:"~160 bpm",note:"Nearly twice yours. Never stopped since week 6"},
              {icon:"🧠",label:"Neurons/min",val:"~100",note:"New brain cells forming every minute"},
            ].map((c,i)=>(
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
          {["Heart beating 150–170 bpm — nearly twice yours. Started at week 6, never paused.",
            "Fingers and toes forming — still slightly webbed, like tiny paddles.",
            "Eyelids formed and fused shut. Won't open until week 27.",
            "The tail is almost completely gone. Looks unmistakably human.",
            "Tiny spontaneous movements already happening — too small to feel yet."].map((t,i)=>(
            <div key={i} className="p-fact"><div className="p-dot" style={{background:"var(--rose)"}}/><div style={{fontSize:13,lineHeight:1.6}}>{t}</div></div>
          ))}

          <div className="p-card pc-white" style={{fontFamily:"'Lora',serif",fontSize:14,fontStyle:"italic",color:"var(--muted)",lineHeight:1.7,marginTop:8}}>
            That heart started beating at week 6 and hasn't stopped once since. Through your nausea, your exhaustion, your fears — it just keeps going.
          </div>
        </>}

        {tab==="senses" && <>
          <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.65,marginBottom:16}}>At week 8 your baby's sensory world is just beginning to form. Some are already active, others are wiring up.</div>

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

function BodyPanel({ onLogMood }) {
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
      <div className="p-story-q">Week 8 was the hardest week for me. The nausea wasn't just morning — it was 3pm, 9pm, 2am. I couldn't stand the smell of my own kitchen. My MIL kept pushing khichdi. Some days it helped. Most days, plain toast was all I could manage. And I felt guilty about that. Nobody told me the guilt was part of it too.</div>
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

function ThreeAmPanel() {
  return <>
    <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.65,marginBottom:18,fontStyle:"italic"}}>The searches everyone makes at 2am. You're not alone in any of these.</div>
    {[{q:"Is it normal to feel this nauseous at week 8?",a:"Yes — this is peak nausea week. It typically eases significantly after week 12. You're not sicker than others."},
      {q:"I haven't felt nauseous at all — should I be worried?",a:"No. About 20–30% of women have little to no nausea and have completely healthy pregnancies."},
      {q:"Is it safe to eat only toast and crackers for days?",a:"Yes. Surviving on bland food in the first trimester is fine. The baby takes what it needs."},
      {q:"Why do I cry for no reason?",a:"Progesterone and hCG are surging to levels your body has never experienced. Completely hormonal."},
      {q:"Can I eat paneer / curd / ghee?",a:"Yes, yes, and yes. These are excellent protein sources. The old advice to avoid dairy is not evidence-based."},
      {q:"I haven't told anyone and I feel so alone",a:"One of the hardest parts of the first trimester. Consider telling one trusted person."},
    ].map((item,i)=>(
      <div key={i} className="p-card pc-white" style={{marginBottom:10}}>
        <div style={{fontSize:13,fontWeight:600,color:"var(--ink)",marginBottom:6,display:"flex",gap:8}}><span style={{color:"var(--rose)",flexShrink:0}}>?</span>{item.q}</div>
        <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.65,paddingLeft:20}}>{item.a}</div>
      </div>
    ))}
  </>;
}

function NobodyTellsPanel() {
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

function PartnerPanel() {
  const [done, setDone] = useState({});
  const toggle = id => setDone(p=>({...p,[id]:!p[id]}));
  const missions = [
    {id:1,title:"Stock ginger biscuits and coconut water at home",why:"Nausea peaks at week 8. Having these without being asked is worth more than you know.",tag:"Essential",col:"#c04040"},
    {id:2,title:"Take over one meal this week — don't ask, just do it",why:"The smell of cooking is often unbearable right now. Doing this once, without prompting, feels enormous to her.",tag:"High impact",col:"#8a5010"},
    {id:3,title:"Ask her one real question tonight",why:"Not 'how are you?' Try: 'What's the scariest thing on your mind right now?' Then just listen. Don't fix.",tag:"Emotional",col:"var(--navy)"},
    {id:4,title:"Book the TVS dating scan if she hasn't already",why:"Should happen between weeks 7–10. Offer to make the call and come along.",tag:"Action",col:"var(--plum)"},
  ];
  const doneCount = Object.values(done).filter(Boolean).length;

  return <>
    <div style={{background:"linear-gradient(135deg,#eaf2f8,#d8e8f5)",borderRadius:16,padding:"16px 18px",marginBottom:16}}>
      <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color:"var(--navy)",marginBottom:6}}>Week 8 · For partners</div>
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

function WinsPanel() {
  return <>
    <div className="p-card pc-wins" style={{textAlign:"center",padding:"24px 20px",marginBottom:16}}>
      <div style={{fontSize:36,marginBottom:10}}>🎉</div>
      <div style={{fontFamily:"'Lora',serif",fontSize:20,fontStyle:"italic",color:"#fff",lineHeight:1.5,marginBottom:8}}>You made it to week 8.</div>
      <div style={{fontSize:13,color:"rgba(255,255,255,0.6)",lineHeight:1.7}}>That heart has been beating for two weeks without stopping. Through your nausea, your exhaustion, your 3am fears — it just keeps going. So do you.</div>
    </div>
    <div className="p-lbl" style={{color:"var(--plum)"}}>This week's wins — however small</div>
    {["You kept something down today, even if it was just crackers",
      "You rested when your body asked you to, even if it felt lazy",
      "You got through another day of feeling terrible without anyone knowing",
      "Your baby grew actual fingers this week — you did that",
      "You are 20% through your first trimester"].map((t,i)=>(
      <div key={i} className="p-fact"><div className="p-dot" style={{background:"var(--plum)"}}/><div style={{fontSize:13,lineHeight:1.6}}>{t}</div></div>
    ))}
    <div className="p-card pc-white" style={{marginTop:8,fontFamily:"'Lora',serif",fontSize:14,fontStyle:"italic",color:"var(--muted)",lineHeight:1.7}}>
      On the hardest days: you don't have to feel good about this. You just have to get through it. That's enough.
    </div>
  </>;
}

function FoodPanel() {
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
                  <div className="nutr-meter-target">Week 8 · {m.target}</div>
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

/* ─── MEDICINE UTILITIES ─────────────────────────────────────────────────── */
// Safely parse a medicine entry regardless of whether it's a string or object
function parseMed(m) {
  if (!m) return { name: "Unknown", dosage: "", frequency: "", duration: "", notes: "", active: true, paused: false, pause_reason: null };
  if (typeof m === "string") {
    try { return parseMed(JSON.parse(m)); } catch {}
    return { name: m, dosage: "", frequency: "", duration: "", notes: "", active: true, paused: false, pause_reason: null };
  }
  return {
    name:         m.name         || m.medicine || m.drug || "Unknown",
    dosage:       m.dosage       || m.dose     || "",
    frequency:    m.frequency    || m.freq     || "",
    duration:     m.duration     || m.days     || "",
    notes:        m.notes        || m.instruction || "",
    active:       m.active !== false,
    paused:       m.paused === true,
    pause_reason: m.pause_reason || null,
  };
}

// Convert pharmacy notation to human schedule
// "1-0-0" → "Once daily · Morning"
// "1-1-1" → "Three times daily · Morning, Afternoon & Night"
// "1-0-1" → "Twice daily · Morning & Night"
// "0-0-1" → "Once daily · Night"
function humanSchedule(frequency) {
  if (!frequency) return null;

  // Parse X-X-X pattern
  const match = frequency.match(/(\d+)-(\d+)-(\d+)/);
  if (match) {
    const [, m, a, n] = match.map(Number);
    const slots = [];
    if (m) slots.push("Morning");
    if (a) slots.push("Afternoon");
    if (n) slots.push("Night");
    const total = m + a + n;
    const timesLabel = total === 1 ? "Once daily" : total === 2 ? "Twice daily" : total === 3 ? "Three times daily" : `${total}x daily`;
    const when = slots.length === 1 ? slots[0] : slots.slice(0, -1).join(", ") + " & " + slots[slots.length - 1];
    return { times: timesLabel, when };
  }

  // Already human readable — just clean it up
  const lower = frequency.toLowerCase();
  if (lower.includes("once") || lower.includes("od") || lower.includes("1-0-0") || lower.includes("0-0-1"))
    return { times: "Once daily", when: lower.includes("night") || lower.includes("0-0-1") ? "Night" : "Morning" };
  if (lower.includes("twice") || lower.includes("bd") || lower.includes("bid"))
    return { times: "Twice daily", when: "Morning & Night" };
  if (lower.includes("three") || lower.includes("tds") || lower.includes("tid"))
    return { times: "Three times daily", when: "Morning, Afternoon & Night" };
  if (lower.includes("four") || lower.includes("qid"))
    return { times: "Four times daily", when: "Every 6 hours" };

  // Return as-is if we can't parse
  return { times: frequency, when: null };
}

// Meal timing extraction
function mealTiming(med) {
  const text = `${med.frequency || ""} ${med.notes || ""}`.toLowerCase();
  if (text.includes("before food") || text.includes("empty stomach")) return "Before meals";
  if (text.includes("after food") || text.includes("with food")) return "After meals";
  if (text.includes("with milk")) return "With milk";
  return null;
}


// Used on both home (This Week) and profile page — same component, same data
/* ─── MEDICINE CARD ──────────────────────────────────────────────────────── */
function MedicineCard({ med: rawMed, compact = false, onEdit, onPause, onDelete }) {
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

function MedHealthWidget({ profile, onEditHealth, compact = false, onMedsUpdate, onPause, onEdit, onDelete }) {
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
function MedDialogs({ pauseMed, setPauseMed, confirmPause, editMed, setEditMed, confirmEdit, deleteMed, setDeleteMed, confirmDelete }) {
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
function MedHealthWidgetFull({ profile, onEditHealth, onClose, onPause, onEdit, onDelete }) {
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



function MedPanel({ profileData, completedTests = {}, onMarkTestComplete, onRxUpload, onPause, onEdit, onDelete }) {
  const p = profileData || {};
  const allMeds = (p.medications || []).map(parseMed).filter(m => m.active !== false);
  const activeMeds = allMeds.filter(m => !m.paused);
  const pausedMeds = allMeds.filter(m => m.paused);

  return <>
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

    {(p.blood_group || (p.conditions||[]).length > 0) && <>
      <div className="p-lbl" style={{color:"var(--rose)"}}>Health info</div>
      <div className="p-card pc-white" style={{padding:"10px 16px",marginBottom:16}}>
        {p.blood_group && <div style={{fontSize:13,marginBottom:4}}>Blood group · <strong>{p.blood_group}</strong></div>}
        {(p.conditions||[]).map(c=><span key={c} className="chip" style={{background:"var(--rose-pale)",color:"var(--rose)",border:"1px solid var(--rose-bdr)",margin:"2px"}}>{c}</span>)}
      </div>
    </>}
    <div className="doc-row">
      <div className="doc-av">✨</div>
      <div><div className="doc-lbl">Matri's note</div><div className="doc-txt">Your first dating scan (TVS) should happen between weeks 7–10. Confirms heartbeat, gestational age, rules out ectopic pregnancy. Book it today — not this week. Today.</div></div>
    </div>
    <div className="p-lbl" style={{color:"var(--navy)",marginTop:8}}>Tests to do this trimester</div>
    <div style={{marginBottom:16}} onClick={e=>e.stopPropagation()}>
      <TestSuggestionsStrip week={8} completedTests={completedTests} onMarkComplete={onMarkTestComplete}/>
    </div>
    <div className="india-chip" style={{marginTop:4}}>🇮🇳 PMSMA Scheme</div>
    <div style={{fontSize:13,lineHeight:1.65,marginBottom:14}}>Under <strong>Pradhan Mantri Surakshit Matritva Abhiyan</strong>, free antenatal checkups on the <strong>9th of every month</strong> at government health centres.</div>
    <div className="p-card pc-rose"><strong>Call your doctor immediately if:</strong> Heavy bleeding, severe abdominal pain, fever above 100.4°F, burning urination, or anything that feels wrong.</div>
  </>;
}

function CheckPanel({ checked, toggle }) {
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

function StoriesPanel() {
  const [screen, setScreen] = useState("list");
  const [selected, setSelected] = useState(null);
  const [userStories, setUserStories] = useState(() => loadUserStories());
  const [shareTitle, setShareTitle] = useState("");
  const [shareText, setShareText] = useState("");
  const [shareTags, setShareTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [shareDone, setShareDone] = useState(false);

  const allStories = [...userStories, ...STORIES];

  const openDetail = (story) => {
    analytics.storyOpened(
      story.id,
      story.title,
      story.tags
    );
  
    setSelected(story);
    setScreen("detail");
  };

  const openShare = () => {
    setShareTitle("");
    setShareText("");
    setShareTags([]);
    setTagInput("");
    setShareDone(false);
    setScreen("share");
  };

  const backToList = () => {
    setScreen("list");
    setSelected(null);
    setShareDone(false);
  };

  const toggleTag = (tag) => {
    setShareTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const tag = tagInput.trim();
    if (!tag || shareTags.includes(tag)) return;
    setShareTags((prev) => [...prev, tag]);
    setTagInput("");
  };

  const submitStory = () => {
    if (!shareText.trim()) return;
    const title = shareTitle.trim() || shareText.trim().slice(0, 72) + (shareText.trim().length > 72 ? "…" : "");
    const entry = {
      id: Date.now(),
      init: "Y",
      name: "You",
      city: "Shared anonymously",
      wk: "Wk 8 · Submitted",
      bg: "linear-gradient(135deg,#ede8f5,#d8cce8)",
      aCol: "#622070",
      aBg: "#ede8f5",
      ico: "✍️",
      title,
      excerpt: shareText.trim().slice(0, 140) + (shareText.trim().length > 140 ? "…" : ""),
      body: shareText.trim(),
      tags: shareTags.length ? shareTags : ["Week 8"],
      pending: true,
    };
    const next = [entry, ...userStories];
    setUserStories(next);
    saveUserStories(next);
    setShareDone(true);
  };

  if (screen === "detail" && selected) {
    return (
      <>
        <button type="button" className="st-back" onClick={backToList}>← Back to stories</button>
        <div className="st-detail">
          <div className="st-detail-hero" style={{background:selected.bg}}>{selected.ico}</div>
          <div className="st-detail-body">
            {selected.pending && <div className="st-pending">Pending review</div>}
            <div className="st-detail-author">
              <div className="sc-av" style={{background:selected.aBg,color:selected.aCol}}>{selected.init}</div>
              <div>
                <div className="sc-name">{selected.name}{selected.city ? ` · ${selected.city}` : ""}</div>
                <div className="sc-meta">{selected.wk}</div>
              </div>
              <div className="sc-wk">Wk 8</div>
            </div>
            <div className="st-detail-title">{selected.title}</div>
            <div className="st-detail-text">{selected.body || selected.excerpt}</div>
            <div className="st-detail-tags">
              {(selected.tags || []).map((t) => <div key={t} className="sc-chip">{t}</div>)}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (screen === "share") {
    return (
      <>
        <button type="button" className="st-back" onClick={backToList}>← Cancel</button>
        {shareDone ? (
          <div className="st-success">
            <div className="st-success-title">Thank you for sharing</div>
            <div className="st-success-sub">
              Your story has been submitted. We read every submission personally before it appears for other women. You can see it in your list marked as pending review.
            </div>
            <button type="button" className="sub-btn" style={{marginTop:14}} onClick={backToList}>Back to stories</button>
          </div>
        ) : (
          <div className="st-form">
            <div className="st-form-lbl">Title (optional)</div>
            <input
              className="st-form-input"
              value={shareTitle}
              onChange={(e) => setShareTitle(e.target.value)}
              placeholder="A few words that capture your story"
            />
            <div className="st-form-lbl">Your story</div>
            <textarea
              className="st-form-textarea"
              rows={6}
              value={shareText}
              onChange={(e) => setShareText(e.target.value)}
              placeholder="What happened this week? What do you wish someone had told you?"
            />
            <div className="st-form-lbl">Tags (optional)</div>
            <div className="st-tag-pick">
              {STORY_TAG_SUGGESTIONS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`st-tag-opt${shareTags.includes(tag) ? " on" : ""}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="st-tag-add">
              <input
                className="st-form-input"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomTag())}
                placeholder="Add your own tag"
              />
              <button type="button" className="st-tag-add-btn" onClick={addCustomTag}>Add</button>
            </div>
            {shareTags.length > 0 && (
              <div className="st-detail-tags" style={{marginBottom:14}}>
                {shareTags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="sc-chip"
                    style={{cursor:"pointer"}}
                    onClick={() => toggleTag(t)}
                  >
                    {t} ×
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              className="st-submit"
              disabled={!shareText.trim()}
              onClick={submitStory}
            >
              Submit story
            </button>
            <div className="sub-note" style={{marginTop:12,textAlign:"center"}}>
              Personally read + approved · First name only · Full anonymity available
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.65,marginBottom:18}}>
        Real experiences. Every story personally read and approved before appearing here.
      </div>
      {allStories.map((s) => (
        <div key={s.id} className="sc" onClick={() => openDetail(s)}>
          <div className="sc-img" style={{background:s.bg}}>{s.ico}</div>
          <div className="sc-body">
            <div className="sc-author">
              <div className="sc-av" style={{background:s.aBg,color:s.aCol}}>{s.init}</div>
              <div>
                <div className="sc-name">{s.name} · {s.city}</div>
                <div className="sc-meta">{s.wk}</div>
              </div>
              <div className="sc-wk">{s.pending ? "Pending" : "Wk 8"}</div>
            </div>
            <div className="sc-title">{s.title}</div>
            <div className="sc-excerpt">{s.excerpt}</div>
            <div className="sc-foot">
              {(s.tags || []).map((t) => <div key={t} className="sc-chip">{t}</div>)}
              <button
                type="button"
                className="sc-read"
                onClick={(e) => { e.stopPropagation(); openDetail(s); }}
              >
                Read →
              </button>
            </div>
          </div>
        </div>
      ))}
      <div className="sub-box">
        <div style={{fontSize:28,marginBottom:8}}>✍️</div>
        <div className="sub-title">Share your week 8 story</div>
        <div className="sub-sub">Your experience could be exactly what another woman needs at 2am.</div>
        <button type="button" className="sub-btn" onClick={openShare}>Share your story</button>
        <div className="sub-note">Personally read + approved · First name only · Full anonymity available</div>
      </div>
    </>
  );
}

function clampCropPos(pos, scale, imgW, imgH, cropW, cropH) {
  const dw = imgW * scale;
  const dh = imgH * scale;
  return {
    x: Math.min(0, Math.max(cropW - dw, pos.x)),
    y: Math.min(0, Math.max(cropH - dh, pos.y)),
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function JournalCameraCapture({ facingMode, title, onCapture, onCancel }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(true);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: facingMode } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode },
            audio: false,
          });
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            setReady(true);
          }
        } catch {
          if (!cancelled) setError(true);
        }
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facingMode]);

  const capture = () => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    onCapture(canvas.toDataURL("image/jpeg", 0.9));
  };

  return (
    <div className="j-camera-screen">
      <div className="j-camera-title">{title}</div>
      <div className="j-camera-sub">
        {facingMode === "environment" ? "Rear camera for scans and documents" : "Front camera for selfies"}
      </div>
      <div className="j-camera-video-wrap">
        {error ? (
          <div style={{color:"rgba(255,255,255,0.5)",fontSize:13,textAlign:"center",padding:20}}>
            Camera not available. Try Photo to pick from your gallery.
          </div>
        ) : (
          <video ref={videoRef} className="j-camera-video" playsInline muted />
        )}
      </div>
      <div className="j-camera-actions">
        <button type="button" className="j-camera-cancel" onClick={onCancel}>Cancel</button>
        <button type="button" className="j-camera-shutter" onClick={capture} disabled={!ready || error}>
          Capture
        </button>
      </div>
    </div>
  );
}

function JournalPhotoCrop({ src, remaining, onConfirm, onCancel }) {
  const [aspect, setAspect] = useState("square");
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [savedCrops, setSavedCrops] = useState({ square: null, album: null });
  const [showAlbumPrompt, setShowAlbumPrompt] = useState(false);
  const [pendingSquare, setPendingSquare] = useState(null);
  const minScaleRef = useRef(1);
  const layoutRef = useRef({ square: null, album: null });
  const imgRef = useRef(null);
  const dragRef = useRef(null);
  const viewportRef = useRef(null);
  const [cropBox, setCropBox] = useState({ w: 300, h: 300 });

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const sync = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) setCropBox({ w, h });
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [aspect]);

  const fitImageToCrop = (w, h, cw, ch, layout) => {
    const minS = Math.max(cw / w, ch / h);
    minScaleRef.current = minS;
    const nextScale = layout?.scale ?? minS;
    const nextPos = layout?.pos ?? clampCropPos(
      { x: (cw - w * nextScale) / 2, y: (ch - h * nextScale) / 2 },
      nextScale, w, h, cw, ch
    );
    setScale(nextScale);
    setPos(clampCropPos(nextPos, nextScale, w, h, cw, ch));
  };

  useEffect(() => {
    if (!imgSize.w) return;
    fitImageToCrop(imgSize.w, imgSize.h, cropBox.w, cropBox.h, layoutRef.current[aspect]);
  }, [cropBox.w, cropBox.h, imgSize.w, imgSize.h, aspect]);

  const exportCrop = (aspectKey, s, p, box) => {
    const img = imgRef.current;
    const preset = CROP_ASPECTS[aspectKey];
    if (!img || !imgSize.w || !preset) return null;
    const { w: cw, h: ch } = box;
    const sx = -p.x / s;
    const sy = -p.y / s;
    const sw = cw / s;
    const sh = ch / s;
    const canvas = document.createElement("canvas");
    canvas.width = preset.exportW;
    canvas.height = preset.exportH;
    canvas.getContext("2d").drawImage(img, sx, sy, sw, sh, 0, 0, preset.exportW, preset.exportH);
    return canvas.toDataURL("image/jpeg", 0.72);
  };

  const persistAspect = (aspectKey) => {
    if (!imgSize.w) return;
    layoutRef.current[aspectKey] = { scale, pos: { ...pos } };
    const url = exportCrop(aspectKey, scale, pos, cropBox);
    if (url) setSavedCrops((s) => ({ ...s, [aspectKey]: url }));
  };

  const switchAspect = (next) => {
    if (next === aspect) return;
    persistAspect(aspect);
    setAspect(next);
  };

  const onImgLoad = (e) => {
    const w = e.target.naturalWidth;
    const h = e.target.naturalHeight;
    setImgSize({ w, h });
    layoutRef.current = { square: null, album: null };
    setSavedCrops({ square: null, album: null });
    fitImageToCrop(w, h, cropBox.w, cropBox.h, null);
  };

  const setScaleClamped = (nextScale) => {
    setScale(nextScale);
    setPos((p) => clampCropPos(p, nextScale, imgSize.w, imgSize.h, cropBox.w, cropBox.h));
  };

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPos: { ...pos } };
  };

  const onPointerMove = (e) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPos(clampCropPos(
      { x: dragRef.current.startPos.x + dx, y: dragRef.current.startPos.y + dy },
      scale, imgSize.w, imgSize.h, cropBox.w, cropBox.h
    ));
  };

  const onPointerUp = () => { dragRef.current = null; };

  const confirm = () => {
    persistAspect(aspect);
    if (aspect === "square" && !savedCrops.album) {
      // Square done — ask about album
      const squareUrl = exportCrop("square", scale, pos, cropBox);
      if (!squareUrl) return;
      setPendingSquare(squareUrl);
      setShowAlbumPrompt(true);
    } else {
      // Album done or skipped — finalize
      const square = aspect === "square" ? exportCrop("square", scale, pos, cropBox) : savedCrops.square;
      const album  = aspect === "album"  ? exportCrop("album",  scale, pos, cropBox) : savedCrops.album;
      const finalSquare = square || savedCrops.square;
      if (!finalSquare) return;
      onConfirm({ square: finalSquare, album: album || savedCrops.album || null });
    }
  };

  const skipAlbum = () => {
    // User said No to album — finalize with square only
    onConfirm({ square: pendingSquare, album: null });
  };

  const goToAlbum = () => {
    // User said Yes to album — switch to album crop
    setSavedCrops(s => ({ ...s, square: pendingSquare }));
    setShowAlbumPrompt(false);
    switchAspect("album");
  };

  // Ready as soon as square is cropped — album is optional
  const readyBoth = Boolean(
    aspect === "square"
      ? (imgSize.w > 0)
      : savedCrops.square
  );

  const minS = minScaleRef.current;
  const maxS = minS * 3;
  const preset = CROP_ASPECTS[aspect];

  return (
    <div className="j-crop-screen">
      <div className="j-crop-title">Crop your photo</div>
      <div className="j-crop-sub">
        Memory crop is required. Album crop is optional.{remaining > 0 ? ` (${remaining} more after this)` : ""}
      </div>

      {/* Album prompt — shown after square crop done */}
      {showAlbumPrompt && (
        <div style={{position:"absolute",inset:0,background:"rgba(253,246,240,0.97)",
          zIndex:10,display:"flex",flexDirection:"column",alignItems:"center",
          justifyContent:"center",padding:28,gap:16,borderRadius:"inherit"}}>
          <div style={{fontSize:32}}>📖</div>
          <div style={{fontFamily:"'Lora',serif",fontSize:18,color:"var(--ink)",
            textAlign:"center",lineHeight:1.4,fontWeight:400}}>
            Add to your<br/><em style={{color:"var(--teal)"}}>pregnancy album</em> too?
          </div>
          <div style={{fontSize:13,color:"var(--muted)",textAlign:"center",lineHeight:1.6}}>
            Album photos are wider format — great for the book view.
          </div>
          <div style={{display:"flex",gap:10,width:"100%",marginTop:8}}>
            <button onClick={skipAlbum} style={{flex:1,background:"var(--cream2)",
              border:"1px solid var(--bdr)",borderRadius:14,padding:"13px",
              fontSize:13,fontWeight:600,color:"var(--muted)",cursor:"pointer",fontFamily:"inherit"}}>
              No, continue
            </button>
            <button onClick={goToAlbum} style={{flex:1,background:"var(--teal)",
              border:"none",borderRadius:14,padding:"13px",
              fontSize:13,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>
              Yes, crop album
            </button>
          </div>
        </div>
      )}

      <div style={{flex:1,overflowY:"auto",padding:"0 18px",display:"flex",flexDirection:"column",scrollbarWidth:"none"}}>
      <div className="j-crop-aspects">
        {Object.values(CROP_ASPECTS).map((a) => (
          <button
            key={a.key}
            type="button"
            className={`j-crop-aspect${aspect === a.key ? " on" : ""}${savedCrops[a.key] ? " done" : ""}`}
            onClick={() => switchAspect(a.key)}
          >
            {a.label}{savedCrops[a.key] ? " ✓" : ""}
          </button>
        ))}
      </div>
      <div className="j-crop-hint">{preset.hint}</div>
      <div
        ref={viewportRef}
        className={`j-crop-viewport ${aspect}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <img
          ref={imgRef}
          src={src}
          alt=""
          onLoad={onImgLoad}
          style={{ width: imgSize.w * scale, height: imgSize.h * scale, left: pos.x, top: pos.y }}
        />
        <div className="j-crop-frame"/>
      </div>
      <div className="j-crop-zoom-lbl">Zoom</div>
      <input
        type="range"
        className="j-crop-zoom"
        min={minS}
        max={maxS}
        step={minS * 0.02}
        value={scale}
        disabled={!imgSize.w}
        onChange={(e) => setScaleClamped(Number(e.target.value))}
      />
      </div>
            <div className="j-crop-actions">
        <button type="button" className="j-crop-cancel" onClick={onCancel}>Cancel</button>
        <button type="button" className="j-crop-save" onClick={confirm} disabled={!readyBoth} style={{ opacity: readyBoth ? 1 : 0.45 }}>
          {aspect === "album" ? "Save & done" : "Use photo"}
        </button>
      </div>
    </div>
  );
}

function JournalPanel({ entries, setEntries, initialTab, moodLog }) {
  const [tab,       setTab]       = useState(initialTab || "write");
  const [text,      setText]      = useState("");
  const [mood,      setMood]      = useState(null);
  const [isShared,  setIsShared]  = useState(false);
  const [freeform,  setFreeform]  = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState([]);
  const [albumOpen, setAlbumOpen] = useState(false);
  const [albumVis,  setAlbumVis]  = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [cropDraft, setCropDraft] = useState(null);
  const [cameraMode, setCameraMode] = useState(null);
  const fileGalleryRef = useRef();
  const fileSelfieRef = useRef();
  const fileScanRef = useRef();
  const pendingRef = useRef(pendingPhotos);
  pendingRef.current = pendingPhotos;
  const today = istDate();

  useEffect(() => () => {
    pendingRef.current.forEach((p) => {
      [photoSquare(p), photoAlbum(p)].forEach((url) => {
        if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    });
  }, []);

  const startPhotoReview = async (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    try {
      const src = await readFileAsDataUrl(files[0]);
      setCropDraft({ src, queue: files.slice(1) });
    } catch { /* unreadable file */ }
  };

  const handlePhotoInput = (e) => {
    startPhotoReview(e.target.files);
    e.target.value = "";
  };

  const openCamera = (mode) => {
    if (navigator.mediaDevices?.getUserMedia) {
      setCameraMode(mode);
      return;
    }
    (mode === "environment" ? fileScanRef : fileSelfieRef).current?.click();
  };

  const onCameraCapture = (src) => {
    setCameraMode(null);
    setCropDraft({ src, queue: [] });
  };

  const cancelCrop = () => setCropDraft(null);

  const confirmCrop = async (crops) => {
    setPendingPhotos((p) => [...p, crops]);
    if (!cropDraft?.queue?.length) {
      setCropDraft(null);
      return;
    }
    try {
      const src = await readFileAsDataUrl(cropDraft.queue[0]);
      setCropDraft({ src, queue: cropDraft.queue.slice(1) });
    } catch {
      setCropDraft(null);
    }
  };

  const save = () => {
    if (!text.trim() && pendingPhotos.length === 0) return;
    const photos = [...pendingPhotos];
    setEntries(p => [{id:Date.now(),week:8,date:today,mood:mood||"😊",text:text.trim(),photos,isShared,heroBg:"linear-gradient(135deg,#e8f5f5,#d0ecec)",heroEmoji:"📝",heroBgColor:"#e0f5f5"},...p]);
    setText(""); setMood(null); setPendingPhotos([]); setIsShared(false); setTab("timeline");
  };

  const deleteEntry = (id) => {
    setEntries((prev) => {
      const entry = prev.find((e) => e.id === id);
      entry?.photos.forEach((p) => {
        [photoSquare(p), photoAlbum(p)].forEach((url) => {
          if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
        });
      });
      return prev.filter((e) => e.id !== id);
    });
    setConfirmId(null);
  };

  const openAlbum  = () => { setAlbumOpen(true);  requestAnimationFrame(()=>setAlbumVis(true)); };
  const closeAlbum = () => { setAlbumVis(false); setTimeout(()=>setAlbumOpen(false), 370); };

  const grouped = entries.reduce((acc,e)=>{ const k=`Week ${e.week}`; if(!acc[k])acc[k]=[]; acc[k].push(e); return acc; },{});

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",position:"relative",overflow:"hidden"}}>
      {cameraMode && (
        <JournalCameraCapture
          key={cameraMode}
          facingMode={cameraMode}
          title={cameraMode === "environment" ? "Scan" : "Selfie"}
          onCapture={onCameraCapture}
          onCancel={() => setCameraMode(null)}
        />
      )}
      {cropDraft && !cameraMode && (
        <JournalPhotoCrop
          key={cropDraft.src}
          src={cropDraft.src}
          remaining={cropDraft.queue.length}
          onConfirm={confirmCrop}
          onCancel={cancelCrop}
        />
      )}
      <div className="j-tabs">
        {[["write","✏️ Write"],["timeline","📅 Timeline"]].map(([id,lbl])=>(
          <button key={id} className={`j-tab${tab===id?" on":""}`} onClick={()=>setTab(id)}>{lbl}</button>
        ))}
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"18px 20px 48px",scrollbarWidth:"none"}}>
        {/* OPEN ALBUM */}
        <button className="album-btn" onClick={openAlbum}>
          <span style={{fontSize:18}}>📖</span>
          View pregnancy album
          <span style={{fontSize:12,opacity:0.55}}>({entries.length} memories)</span>
        </button>

        {tab==="write" && (
          <div className="j-add-prompt">
            <div className="j-prompt-top">
              <div className="j-prompt-week">Week 8</div>
              <div className="j-prompt-date">{today}</div>
            </div>

            {/* GUIDED PROMPT — primary */}
            {!freeform && (
              <div style={{marginBottom:14}}>
                <div style={{background:"var(--teal-pale)",border:"1px solid var(--teal-bdr)",
                  borderRadius:14,padding:"14px 16px",marginBottom:12}}>
                  <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.18em",
                    textTransform:"uppercase",color:"var(--teal)",marginBottom:6}}>This week's prompt</div>
                  <div style={{fontFamily:"'Lora',serif",fontSize:15,fontStyle:"italic",
                    color:"var(--ink)",lineHeight:1.65}}>
                    {getWeekPrompt(8)}
                  </div>
                </div>
                <textarea className="j-textarea" rows={5} value={text}
                  onChange={e=>setText(e.target.value)}
                  placeholder="Write whatever comes to mind…"/>
                <button onClick={()=>setFreeform(true)}
                  style={{background:"none",border:"none",fontSize:11,color:"var(--muted)",
                    cursor:"pointer",fontFamily:"inherit",padding:"6px 0",fontStyle:"italic"}}>
                  Write freely instead →
                </button>
              </div>
            )}

            {/* FREEFORM — secondary */}
            {freeform && (
              <div style={{marginBottom:14}}>
                <textarea className="j-textarea" rows={5} value={text}
                  onChange={e=>setText(e.target.value)}
                  placeholder="Write anything… a fear, a hope, what the nausea feels like today, what you want to remember…"/>
                <button onClick={()=>setFreeform(false)}
                  style={{background:"none",border:"none",fontSize:11,color:"var(--teal)",
                    cursor:"pointer",fontFamily:"inherit",padding:"6px 0",fontStyle:"italic"}}>
                  ← Use this week's prompt
                </button>
              </div>
            )}

            <div className="j-photo-row">
              <div className="j-photo-add" onClick={()=>fileGalleryRef.current?.click()}>
                <div className="j-photo-add-icon">📷</div><div className="j-photo-add-lbl">Photo</div>
              </div>
              <div className="j-photo-add" onClick={()=>openCamera("user")}>
                <div className="j-photo-add-icon">🤳</div><div className="j-photo-add-lbl">Selfie</div>
              </div>
              <div className="j-photo-add" onClick={()=>openCamera("environment")}>
                <div className="j-photo-add-icon">🔍</div><div className="j-photo-add-lbl">Scan</div>
              </div>
              {pendingPhotos.map((p, i) => (
                <div key={i} className="j-entry-photo">
                  {photoThumb(p) ? <img src={photoThumb(p)} alt=""/> : null}
                </div>
              ))}
              <input ref={fileGalleryRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={handlePhotoInput}/>
              <input ref={fileSelfieRef} type="file" accept="image/*" capture="user" style={{display:"none"}} onChange={handlePhotoInput}/>
              <input ref={fileScanRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={handlePhotoInput}/>
            </div>
            <div className="j-save-row" style={{flexWrap:"wrap",gap:8}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:10,color:"var(--muted)",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:600}}>Mood</div>
                <div className="j-mood-row">{MOODS.map(m=><span key={m} className={`j-mood${mood===m?" on":""}`} onClick={()=>setMood(m)}>{m}</span>)}</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,flexShrink:0}}>
                <div className="privacy-toggle">
                  <button className={`privacy-btn${!isShared?" on":""}`} onClick={()=>setIsShared(false)}>🔒<span className="pb-label"> Only me</span></button>
                  <button className={`privacy-btn${isShared?" on":""}`} onClick={()=>setIsShared(true)}>👭<span className="pb-label"> Friends</span></button>
                </div>
                <button className="j-save-btn" onClick={save} disabled={!text.trim() && pendingPhotos.length === 0} style={{opacity:(!text.trim() && pendingPhotos.length === 0)?0.4:1}}>Save ✓</button>
              </div>
            </div>
          </div>
        )}

        {tab==="timeline" && (
          <div>
            {/* RECENT MOODS — compact */}
            {(moodLog||[]).length > 0 && (
              <div style={{padding:"0 16px 14px"}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color:"var(--rose)",marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
                  Recent moods<div style={{flex:1,height:1,background:"var(--bdr)"}}/>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {(moodLog||[]).slice(0,6).map((m,i)=>(
                    <div key={m.id||i} style={{display:"flex",alignItems:"center",gap:6,background:"#fff",border:"1px solid var(--bdr)",borderRadius:100,padding:"5px 11px 5px 7px"}}>
                      <span style={{fontSize:16}}>{m.emoji}</span>
                      <div>
                        <div style={{fontSize:11,fontWeight:600,color:"var(--ink)",lineHeight:1.2}}>
                          {m.emoji==="😰"?"Anxious":m.emoji==="😴"?"Tired":m.emoji==="🤢"?"Nauseous":m.emoji==="😭"?"Teary":m.emoji==="😤"?"Frustrated":m.emoji==="🤍"?"Excited":m.emoji==="😕"?"Guilty":m.emoji==="🌀"?"Overwhelmed":"Feeling "+m.emoji}
                        </div>
                        <div style={{fontSize:9,color:"var(--muted)",lineHeight:1}}>{m.date}</div>
                      </div>
                    </div>
                  ))}
                  {(moodLog||[]).length > 6 && (
                    <div style={{display:"flex",alignItems:"center",padding:"5px 11px",background:"var(--cream2)",border:"1px solid var(--bdr)",borderRadius:100,fontSize:10,color:"var(--muted)",fontStyle:"italic"}}>
                      +{(moodLog||[]).length-6} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SHAREABLE STRIP */}
            <ShareableStrip entries={entries}/>
            {/* FRIENDS CARD */}
            <div style={{padding:"0 16px 16px"}}><FriendsCard/></div>

            {/* ── RICH TIMELINE — descending ── */}
            {Object.entries(grouped).sort(([a],[b])=>{
              const wa = Number(a.replace("Week ","")), wb = Number(b.replace("Week ",""));
              return wb - wa; // most recent week first
            }).map(([week, wentries], gi) => {
              const baby = BABY_SIZES[Number(week.replace("Week ",""))] || null;
              // Most recent entry first within each week
              const sortedEntries = [...wentries].sort((a,b)=>b.id-a.id);
              return (
                <div key={week} className="tl-week-group">
                  {/* Week header */}
                  <div className="tl-week-header">
                    <div className="tl-week-num">{week.replace("Week ","")}</div>
                    <div className="tl-week-meta">
                      <div className="tl-week-label">
                        {Number(week.replace("Week ",""))<=12?"First Trimester":Number(week.replace("Week ",""))<=27?"Second Trimester":"Third Trimester"}
                      </div>
                      {baby && <div className="tl-week-baby">{baby.emoji} About the size of {baby.compare} · {baby.cm}</div>}
                    </div>
                  </div>

                  {sortedEntries.map((entry, ei) => {
                    const themes = ["tl-card-rose","tl-card-teal","tl-card-plum","tl-card-navy","tl-card-amber","tl-card-forest"];
                    const accents = ["var(--rose-bdr)","var(--teal-bdr)","var(--plum-bdr)","var(--navy-bdr)","var(--amber-bdr)","var(--forest-bdr)"];
                    const theme  = themes[(gi * 3 + ei) % themes.length];
                    const accent = accents[(gi * 3 + ei) % accents.length];

                    // Format date: "10 Mar 2025" → split nicely
                    const dateParts = entry.date ? entry.date.split(" ") : [];
                    const dayStr   = dateParts[0] || "";
                    const restStr  = dateParts.slice(1).join(" ") || "";

                    return (
                      <div key={entry.id} className={`tl-card ${theme}`}>
                        <div className="tl-card-inner">
                          {/* Top row: date + mood */}
                          <div className="tl-card-top">
                            <div className="tl-card-date">
                              <span className="tl-card-date-day">{dayStr}</span>
                              <span className="tl-card-date-month">{restStr}</span>
                            </div>
                            <div className="tl-card-badges">
                              {entry.isShared && <span className="tl-card-public">Friends</span>}
                              <div className="tl-card-mood">{entry.mood}</div>
                            </div>
                          </div>

                          {/* Entry text */}
                          <div className="tl-card-text" style={{borderLeftColor:accent}}>
                            {entry.text}
                          </div>

                          {/* Photos */}
                          {entry.photos?.length > 0 && (
                            <div className="tl-card-photos">
                              {entry.photos.map((p,pi)=>(
                                <div key={pi} className="tl-card-photo" style={{background:"rgba(255,255,255,0.5)"}}>
                                  {photoThumb(p)
                                    ? <img src={photoThumb(p)} alt=""/>
                                    : <span style={{fontSize:26}}>{typeof p==="string"?p:"📷"}</span>}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Footer */}
                          <div className="tl-card-foot">
                            {confirmId === entry.id ? (
                              <div className="tl-confirm" style={{width:"100%"}}>
                                <div className="tl-confirm-msg">Remove this memory? It cannot be undone.</div>
                                <div className="tl-confirm-btns">
                                  <button className="tl-confirm-no" onClick={()=>setConfirmId(null)}>Cancel</button>
                                  <button className="tl-confirm-yes" onClick={()=>deleteEntry(entry.id)}>Delete</button>
                                </div>
                              </div>
                            ) : (
                              <button className="tl-del-btn" onClick={()=>setConfirmId(entry.id)}>Delete memory</button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── ALBUM OVERLAY (scoped inside journal panel) ── */}
      {albumOpen && (
        <div className={`album-screen${albumVis?" open":""}`}>
          <AlbumView entries={entries} onClose={closeAlbum}/>
        </div>
      )}
    </div>
  );
}


/* ─── MATRI MOMENTS (one per week) ──────────────────────────────────────── */

const MOMENT_STORAGE_KEY = "matri-moments";

function loadMoments() {
  try { return JSON.parse(localStorage.getItem(MOMENT_STORAGE_KEY) || "{}"); } catch { return {}; }
}
function saveMoment(week, text) {
  try {
    const all = loadMoments();
    all[week] = { text, date: new Date().toLocaleDateString("en-IN", { timeZone:"Asia/Kolkata", day:"numeric", month:"short", year:"numeric" }) };
    localStorage.setItem(MOMENT_STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

/* ─── PANEL CONFIG ───────────────────────────────────────────────────── */
function MythPanel() {
  
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

function PlanningPanel() {
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
      intro:"Week 8 is one of the hardest weeks to be in an office. You're exhausted, nauseated, and keeping the biggest secret of your life.",
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

function FearsPanel() {
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

const PANELS = {
  baby:      { label:"Your baby",        title:<>1.6cm · <em>tip of your thumb</em></>,         headBg:"#1a1210",           lblCol:"#f0a07a",       titleCol:"#fff",        dark:true,  Panel:BabyPanel,    noScroll:true },
  body:      { label:"Your body",        title:<>What you're feeling is <em>real</em></>,        headBg:"var(--rose-pale)",  lblCol:"var(--rose)",   titleCol:"var(--ink)",  dark:false, Panel:BodyPanel },
  "3am":     { label:"3am searches",     title:<>What everyone <em>Googles</em></>,               headBg:"#1a1210",           lblCol:"#f0a07a",       titleCol:"#fff",        dark:true,  Panel:ThreeAmPanel },
  ntty:      { label:"Nobody tells you", title:<>What nobody <em>tells you</em></>,               headBg:"var(--plum-pale)",  lblCol:"var(--plum)",   titleCol:"var(--ink)",  dark:false, Panel:NobodyTellsPanel },
  wins:      { label:"This week's win",  title:<>You made it to <em>week 8</em></>,               headBg:"#181830",           lblCol:"#b0a0f0",       titleCol:"#fff",        dark:true,  Panel:WinsPanel },
  partner:   { label:"For your partner", title:<>What your partner <em>should know</em></>,           headBg:"var(--navy-pale)",  lblCol:"var(--navy)",   titleCol:"var(--ink)",  dark:false, Panel:PartnerPanel },
  food:      { label:"Nutrition",        title:<>Food when nothing <em>appeals</em></>,           headBg:"var(--forest-pale)",lblCol:"var(--forest)", titleCol:"var(--ink)",  dark:false, Panel:FoodPanel },
  medical:   { label:"Medical",          title:<>What needs to happen <em>now</em></>,            headBg:"var(--slate-pale)", lblCol:"var(--slate)",  titleCol:"var(--ink)",  dark:false, Panel:MedPanel },
  checklist: { label:"Checklist this week", title:<>Seven things. <em>That's it.</em></>,            headBg:"var(--amber-pale)", lblCol:"var(--amber)",  titleCol:"var(--ink)",  dark:false, Panel:null },
  journal:   { label:"Journal",          title:<>Your pregnancy <em>story</em></>,                headBg:"#0a2020",           lblCol:"#70c8b8",       titleCol:"#fff",        dark:true,  Panel:JournalPanel, noScroll:true },
  stories:   { label:"Stories",          title:<>Women who've been <em>right here</em></>,        headBg:"#1e1030",           lblCol:"#c8a0f0",       titleCol:"#fff",        dark:true,  Panel:StoriesPanel },
  symptom:      { label:"How are you feeling?", title:<>Is this <em>normal</em>?</>,               headBg:"var(--cream2)",     lblCol:"var(--rose)",   titleCol:"var(--ink)",  dark:false, Panel:null },
  symptomDetail:{ label:"",                    title:<></>,                                         headBg:"var(--cream2)",     lblCol:"var(--rose)",   titleCol:"var(--ink)",  dark:false, Panel:null, noScroll:true },
  myth:      { label:"Myth busting",         title:<>True, false, or <em>complicated</em></>,       headBg:"var(--amber-pale)", lblCol:"var(--amber)",  titleCol:"var(--ink)",  dark:false, Panel:MythPanel },
  planning:  { label:"Life planning",        title:<>Pregnancy and <em>your daily life</em></>,     headBg:"var(--navy-pale)",  lblCol:"var(--navy)",   titleCol:"var(--ink)",  dark:false, Panel:PlanningPanel },
  fears:     { label:"Real fears",           title:<>The things nobody <em>admits</em></>,          headBg:"var(--ink)",        lblCol:"rgba(255,200,180,0.7)", titleCol:"#fff", dark:true, Panel:FearsPanel },
  moment:    { label:"Matri moment",         title:<>A pause. <em>Just for you.</em></>,            headBg:"#0a1a10",           lblCol:"#80d0a0",       titleCol:"#fff",  dark:true, Panel:null, noScroll:false },
};

/* ─── QUICK ADD ENTRY ─────────────────────────────────────────────────── */
function QuickAddEntry({ entries, setEntries, onClose }) {
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

/* ─── LIBRARY VIEW ────────────────────────────────────────────────────── */
const MILESTONES = [
  {wk:6,name:"Heartbeat",done:true},{wk:7,name:"Dating scan",done:true},{wk:8,name:"You are here",current:true},
  {wk:10,name:"Blood tests",done:false},{wk:12,name:"12-wk scan",done:false},{wk:14,name:"T2 begins",done:false},
  {wk:16,name:"Movements",done:false},{wk:20,name:"Anomaly scan",done:false},{wk:24,name:"GTT test",done:false},
  {wk:28,name:"T3 begins",done:false},{wk:32,name:"Growth scan",done:false},{wk:36,name:"Final prep",done:false},
  {wk:40,name:"Due date",done:false},
];

/* ─── SHAREABLE WEEK STRIP ──────────────────────────────────────────────── */
function ShareableStrip({ entries }) {
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

function FriendsCard() {
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

function MoodSummary({ entries, moodLog, onDeleteMood, dark }) {
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

function LibraryView({ onOpen, journalEntries, moodLog, onDeleteMood, onViewAlbum, onViewTimeline, onOpenProfile, profileData }) {
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
function JournalTab({ entries, setEntries, onOpenAlbum, moodLog, onOpenProfile, profileData }) {
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
function MatriMomentWidget({ onOpen, week }) {
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
function MatriMomentPanel({ week, entries, setEntries }) {
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
function StorybookPreviewWidget({ entries, onOpenAlbum, onOpenJournal }) {
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
function HeroMoodStrip({ journalEntries, moodLog, onTap }) {
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

/* ─── PRESCRIPTION EDITOR ─────────────────────────────────────────────────── */
/* ─── INSIGHT FEED WIDGET ────────────────────────────────────────────────── */
function InsightFeedWidget({ healthContext, profileData, onOpenDoctorPrep }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!healthContext?.summary && !profileData) return;
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
  }, [healthContext?.summary]);

  const dotColor = (type) => type === "prep" ? "var(--rose)" : type === "nudge" ? "var(--amber)" : "#c8a0ff";

  const hasDoctorPrep = (healthContext?.doctorPrep || []).length > 0;
  const daysLeft = profileData?.next_appointment_date
    ? Math.ceil((new Date(profileData.next_appointment_date) - new Date()) / (1000*60*60*24))
    : null;

  return (
    <div className="w w-full insight-feed" onClick={hasDoctorPrep ? onOpenDoctorPrep : undefined}>
      <div className="insight-feed-inner">
        <div className="insight-feed-lbl">
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
          <div className="insight-empty">
            Add your health details to get personalised insights
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── PRESCRIPTION UPLOAD FLOW ───────────────────────────────────────────── */
// The full fan-out upload — prescription → medicines + tests + scans + summary
function PrescriptionUploadFlow({ onComplete, onClose }) {
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
      setResult({ ...data.parsed, _debug: data._debug });
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

          {/* Debug info — shows what the backend actually extracted and saved */}
          {result._debug && (
            <div style={{background:"var(--cream2)",border:"1px solid var(--bdr)",borderRadius:10,padding:"10px 12px",fontSize:10,color:"var(--muted)",marginBottom:8,lineHeight:1.7}}>
              <strong style={{color:"var(--ink)"}}>Backend saved:</strong> {result._debug.tests_extracted} test{result._debug.tests_extracted!==1?"s":""} found by AI
              {result._debug.tests_extracted > 0 && <> · {result._debug.tests_inserted} inserted into DB</>}
              {result._debug.tests_names?.length > 0 && <div>Tests: {result._debug.tests_names.join(", ")}</div>}
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
function PrescriptionsList({ prescriptions = [], onViewDetail, onDeleted }) {
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
                  <div style={{fontFamily:"'Lora',serif",fontSize:14,color:"var(--ink)",lineHeight:1.2,marginBottom:3}}>
                    {rx.doctor || (rx.date ? `Prescription · ${new Date(rx.date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}` : "Uploaded prescription")}
                    {rx.clinic && <span style={{fontSize:11,color:"var(--muted)",fontFamily:"'Inter',sans-serif",fontStyle:"normal"}}> · {rx.clinic}</span>}
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
            <div style={{fontFamily:"'Lora',serif",fontSize:20,color:"var(--ink)",marginBottom:8}}>Remove this <em>prescription?</em></div>
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
function PrescriptionDetailSheet({ rx, onClose, onDelete }) {
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
            <div style={{fontFamily:"'Lora',serif",fontSize:20,color:"var(--ink)",lineHeight:1.2}}>
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
            <div style={{fontFamily:"'Lora',serif",fontSize:20,color:"var(--ink)",marginBottom:8}}>Remove this <em>prescription?</em></div>
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

function PrescriptionEditor({ editData, setEditData }) {
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

/* ─── LAB TIMELINE ROW ────────────────────────────────────────────────────── */
function LabTimelineRow({ name, unit, entries=[], normalRange, onAdd, onRemove }) {
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
          <div key={i} className="lab-timeline-entry" onDoubleClick={()=>onRemove(i)} title="Double tap to remove">
            <div className="lab-timeline-dot" style={{background:dotBg(e.value),borderColor:dotBorder(e.value),color:statusColor(e.value)}}>
              <span>{e.value}</span>
            </div>
            <div className="lab-timeline-val">{e.value}</div>
            <div className="lab-timeline-date">{new Date(e.date).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</div>
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

function TestOrderRow({ order, uploading, checking, onUpload, onViewDetail, onDelete }) {
  const fileRef = useRef();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const done = order.status === "completed";
  const dueDate = order.due_date
    ? new Date(order.due_date).toLocaleDateString("en-IN",{day:"numeric",month:"short"})
    : null;
  return (
    <div
      onClick={done && !confirmDelete ? onViewDetail : undefined}
      style={{background:"#fff",border:`1px solid ${confirmDelete?"var(--rose-bdr)":done?"var(--teal-bdr)":"var(--bdr)"}`,borderRadius:16,padding:"13px 16px",cursor:done&&!confirmDelete?"pointer":"default",transition:"border-color 0.2s"}}>
      <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{display:"none"}}
        onChange={e=>{const f=e.target.files?.[0];if(f)onUpload(f);e.target.value="";}}/>

      {confirmDelete ? (
        /* ── Inline delete confirmation ── */
        <div onClick={e=>e.stopPropagation()}>
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
      ) : (
        <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap",marginBottom:3}}>
              <span style={{fontFamily:"'Lora',serif",fontSize:15,color:"var(--ink)"}}>{order.test_name}</span>
              <span style={{fontSize:9,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",
                color:done?"var(--teal)":"var(--amber)",background:done?"var(--teal-pale)":"var(--amber-pale)",
                border:`1px solid ${done?"var(--teal-bdr)":"var(--amber-bdr)"}`,borderRadius:100,padding:"2px 7px",flexShrink:0}}>
                {done ? "✓ Done" : "Ordered"}
              </span>
            </div>
            {dueDate && <div style={{fontSize:10,color:"var(--muted)",marginBottom:2}}>Due: {dueDate}</div>}
            {order.notes && <div style={{fontSize:11,color:"var(--muted)",fontStyle:"italic",lineHeight:1.5}}>{order.notes}</div>}
            {done && order.report_summary && (
              <div style={{fontSize:11,color:"var(--teal)",marginTop:5,lineHeight:1.5,fontStyle:"italic",overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
                "{order.report_summary}"
              </div>
            )}
            {/* Schedule / Book — future features */}
            {!done && (
              <div style={{marginTop:8}}>
                <div style={{display:"flex",gap:6,opacity:0.35,pointerEvents:"none",filter:"blur(0.6px)"}}>
                  <div style={{fontSize:10,fontWeight:600,color:"var(--navy)",background:"var(--navy-pale)",border:"1px solid var(--navy-bdr)",borderRadius:100,padding:"3px 9px"}}>📅 Schedule</div>
                  <div style={{fontSize:10,fontWeight:600,color:"var(--forest)",background:"var(--forest-pale)",border:"1px solid var(--forest-bdr)",borderRadius:100,padding:"3px 9px"}}>🏥 Book lab</div>
                </div>
                <div style={{fontSize:9,color:"var(--muted)",marginTop:4,letterSpacing:"0.04em"}}>Future features</div>
              </div>
            )}
          </div>
          <div style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,paddingTop:2}}>
            {checking ? (
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:14,height:14,border:"2px solid var(--amber-pale)",borderTopColor:"var(--amber)",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                <span style={{fontSize:10,color:"var(--amber)"}}>Validating…</span>
              </div>
            ) : uploading ? (
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:14,height:14,border:"2px solid var(--teal-pale)",borderTopColor:"var(--teal)",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                <span style={{fontSize:10,color:"var(--muted)"}}>Reading…</span>
              </div>
            ) : done ? (
              <span style={{fontSize:11,color:"var(--teal)",fontWeight:600}}>View ↗</span>
            ) : (
              <button onClick={e=>{e.stopPropagation();fileRef.current?.click();}}
                style={{fontSize:10,fontWeight:600,color:"var(--navy)",background:"var(--navy-pale)",border:"1px solid var(--navy-bdr)",borderRadius:100,padding:"4px 10px",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
                ⬆ Upload
              </button>
            )}
            <button onClick={e=>{e.stopPropagation();setConfirmDelete(true);}}
              style={{fontSize:10,fontWeight:600,color:"var(--rose)",background:"var(--rose-pale)",border:"none",borderRadius:100,padding:"3px 9px",cursor:"pointer",fontFamily:"inherit"}}>
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TestOrdersSection({ onViewDetail, reloadKey = 0 }) {
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
function TestReportSheet({ order, onClose, onReportDeleted }) {
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
function LabsEditor({ editData, setEditData, hideTitle = false }) {
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
const TRIMESTER_TESTS = {
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

function TestDetailPanel({ test, onClose, isDone, onMarkComplete }) {
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

function TestSuggestionsStrip({ week = 8, completedTests = {}, onMarkComplete }) {
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
function DoctorInsight({ profile }) {
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

function ProfilePage({ profile, onClose, onProfileUpdate, weekProp = 8, onOpenMedical, completedTests = {}, onMarkTestComplete, appMedHandlers = {}, onRxUpload }) {
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

            {/* ── HEALTH & MEDICINES — compact summary tile ── */}
            <div className="pg-full" style={{gridColumn:"1/-1"}}>
              <MedHealthWidget
                profile={p}
                compact={true}
                onEditHealth={() => onOpenMedical && onOpenMedical()}
                onMedsUpdate={newMeds => onProfileUpdate && onProfileUpdate({...p, medications: newMeds})}
                {...appMedHandlers}
              />
            </div>

            {/* ── LAB RESULTS — full width with suggestions ── */}
            <div className="w pg-full wc-amber" style={{minHeight:140}} onClick={()=>openEdit("labs",{lab_data:p.lab_data||{},lab_extras_v2:Object.fromEntries(Object.entries(p.lab_extras_v2||{}).filter(([,v])=>v?.entries?.length)),blood_group:p.blood_group||""})}>
              <span className="w-bg-e" style={{color:"var(--amber)",fontSize:110}}>🧪</span>
              <div className="win-lg">
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                  <div className="w-lbl" style={{color:"var(--amber)",marginBottom:0}}><div className="w-lbl-dot" style={{background:"var(--amber)"}}/>Lab results</div>
                  <EditBtn onClick={()=>openEdit("labs",{lab_data:p.lab_data||{},lab_extras_v2:Object.fromEntries(Object.entries(p.lab_extras_v2||{}).filter(([,v])=>v?.entries?.length)),blood_group:p.blood_group||""})} isEmpty={!p.lab_data?.hemoglobin?.length}/>
                </div>
                {(() => {
                  const ld = p.lab_data || {};
                  const latest = arr => arr?.[arr.length-1];
                  const hb  = latest(ld.hemoglobin);
                  const tsh = latest(ld.tsh);
                  const sugar = latest(ld.blood_sugar_fasting);
                  const totalTests = Object.keys(ld).filter(k=>ld[k]?.length).length + Object.values(p.lab_extras_v2||{}).filter(v=>v?.entries?.length).length;
                  return hb ? (
                    <div style={{display:"flex",gap:16,marginBottom:12,flexWrap:"wrap"}}>
                      <div>
                        <span style={{fontFamily:"'Lora',serif",fontSize:22,color:hb.value<11?"var(--rose)":"var(--ink)"}}>{hb.value}</span>
                        <span style={{fontSize:10,color:"var(--muted)",marginLeft:4}}>g/dL HB {hb.value<11?"⚠️":"✓"}</span>
                        {(ld.hemoglobin||[]).length>1&&<div style={{fontSize:9,color:"var(--amber)",marginTop:1}}>{ld.hemoglobin.length} readings</div>}
                      </div>
                      {tsh&&<div style={{borderLeft:"1px solid var(--bdr)",paddingLeft:16}}>
                        <span style={{fontFamily:"'Lora',serif",fontSize:22,color:(tsh.value<0.1||tsh.value>4)?"var(--rose)":"var(--ink)"}}>{tsh.value}</span>
                        <span style={{fontSize:10,color:"var(--muted)",marginLeft:4}}>mIU/L TSH</span>
                      </div>}
                      {sugar&&<div style={{borderLeft:"1px solid var(--bdr)",paddingLeft:16}}>
                        <span style={{fontFamily:"'Lora',serif",fontSize:22,color:"var(--ink)"}}>{sugar.value}</span>
                        <span style={{fontSize:10,color:"var(--muted)",marginLeft:4}}>mg/dL sugar</span>
                      </div>}
                      <div style={{marginLeft:"auto",fontSize:10,color:"var(--muted)",alignSelf:"center"}}>{totalTests} test{totalTests!==1?"s":""} tracked · ✨ AI reads reports</div>
                    </div>
                  ) : (
                    <div style={{marginBottom:12}}>
                      <div style={{fontFamily:"'Lora',serif",fontSize:15,color:"var(--ink)",marginBottom:4}}>Track your tests over time</div>
                      <div style={{fontSize:11,fontWeight:600,color:"var(--amber)"}}>✨ Upload a report — Matri reads & fills values automatically</div>
                    </div>
                  );
                })()}
                {/* Compact test suggestions strip */}
                <div style={{borderTop:"1px solid var(--amber-bdr)",paddingTop:10,marginTop:2}} onClick={e=>e.stopPropagation()}>
                  <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",color:"var(--amber)",marginBottom:8}}>Recommended this trimester</div>
                  <TestSuggestionsStrip week={week||8} completedTests={completedTests} onMarkComplete={onMarkTestComplete}/>
                </div>
              </div>
            </div>

            {/* ── SCANS — left ── */}
            <div className="w pg-full wc-plum" style={{minHeight:110}}>
              <span className="w-bg-e" style={{color:"var(--plum)",fontSize:90}}>🔬</span>
              <div className="win-lg">
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                  <div className="w-lbl" style={{color:"var(--plum)",marginBottom:0}}><div className="w-lbl-dot" style={{background:"var(--plum)"}}/>Scans</div>
                  <span style={{fontSize:9,fontWeight:600,color:"var(--muted)",background:"var(--cream2)",border:"1px dashed var(--bdr)",borderRadius:100,padding:"2px 8px"}}>Soon</span>
                </div>
                <EmptyState icon="🤱" text={"NT, anomaly, growth scans — tracked automatically from your prescriptions"} cta="Coming soon"/>
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

/* ─── PREGNANT ICON ─────────────────────────────────────────────────────── */
function PregnantIcon({ size = 20, opacity = 1 }) {
  // Clean minimal line-art style — works at small and large sizes
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{opacity, flexShrink:0}}>
      {/* Head */}
      <circle cx="12" cy="5.5" r="2.5" fill="currentColor"/>
      {/* Body */}
      <path d="M9 9.5C7.5 9.5 7 10.5 7 12V18H9.5V14C9.5 14 10 17 12.5 17C15 17 16.5 15 16.5 12.5C16.5 10.5 15 9.5 13 9.5H9Z" fill="currentColor"/>
      {/* Arm resting on bump */}
      <path d="M7 11.5C5.5 12 5 13.5 5.5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Legs */}
      <rect x="7" y="17.5" width="3" height="5" rx="1.5" fill="currentColor"/>
      <rect x="10.5" y="17.5" width="3" height="5" rx="1.5" fill="currentColor" opacity="0.7"/>
    </svg>
  );
}

/* ─── AUTH SCREEN ─────────────────────────────────────────────────────────── */
function AuthScreen() {
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  };

  return (
    <div className="auth-screen">

      {/* Top wordmark */}
      <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:0}}>
        <div style={{width:7,height:7,borderRadius:"50%",background:"#f0a07a"}}/>
        <span style={{fontSize:12,fontWeight:700,letterSpacing:"0.28em",textTransform:"uppercase",color:"rgba(255,255,255,0.55)"}}>matri</span>
      </div>

      {/* Centre — illustration + copy */}
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",width:"100%"}}>

        {/* Pregnant lady hero illustration */}
        <div style={{position:"relative",marginBottom:32}}>
          <div style={{position:"absolute",inset:-28,borderRadius:"50%",background:"radial-gradient(circle,rgba(240,160,122,0.15),transparent 70%)",pointerEvents:"none"}}/>
          <div style={{width:100,height:100,borderRadius:"50%",background:"linear-gradient(145deg,rgba(255,255,255,0.1),rgba(255,255,255,0.05))",border:"1.5px solid rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:50}}>
            🤰
          </div>
          <div style={{position:"absolute",top:-4,right:-4,width:22,height:22,borderRadius:"50%",background:"rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>🌸</div>
          <div style={{position:"absolute",bottom:2,left:-6,width:18,height:18,borderRadius:"50%",background:"rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10}}>✨</div>
        </div>

        <div className="auth-headline">
          Hello, <em>mama.</em><br/>We've been waiting.
        </div>
        <div className="auth-sub">
          Your pregnancy companion.<br/>Week by week. Feeling by feeling.
        </div>

        <button className="auth-google-btn" onClick={handleGoogle} disabled={loading}>
          <svg className="auth-google-icon" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? "Signing in…" : "Continue with Google"}
        </button>
      </div>

      <div className="auth-footer">
        By continuing, you agree to Matri's terms.<br/>
        Your data is private and encrypted.
      </div>
    </div>
  );
}


/* ─── AUTH GATE — wraps the whole app ────────────────────────────────────── */
function AuthGate() {
  const [session,    setSession]    = useState(undefined); // undefined = loading
  const [profile,    setProfile]    = useState(null);
  const [needsOnboard, setNeedsOnboard] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user);
    });
    // Listen for auth changes (e.g. after Google redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadProfile(session.user);
      else { setProfile(null); setNeedsOnboard(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (user) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (!data || !data.onboarding_complete) {
      // Pass whatever we have (name from Google metadata as fallback)
      setProfile(data || { name: user.user_metadata?.full_name || "" });
      setNeedsOnboard(true);
    } else {
      setProfile(data);
      setNeedsOnboard(false);
    }
  };

  const handleOnboardComplete = (profileData) => {
    setProfile(profileData);
    setNeedsOnboard(false);
  };

  // Loading state
  if (session === undefined) {
    return (
      <div style={{position:"fixed",inset:0,background:"linear-gradient(160deg,#6a2e20,#1a6060)",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:"#f0a07a"}}/>
          <span style={{fontSize:13,fontWeight:700,letterSpacing:"0.28em",textTransform:"uppercase",color:"rgba(255,255,255,0.5)"}}>matri</span>
        </div>
      </div>
    );
  }

  if (!session) return <AuthScreen />;
  if (needsOnboard) return <OnboardingFlow user={session.user} onComplete={handleOnboardComplete} />;
  return <App profile={profile} />;
}

/* ─── MAIN APP ───────────────────────────────────────────────────────── */
function App({ profile: initialProfile }) {
  const [profileData,    setProfileData]    = useState(initialProfile);
  const [profileOpen,    setProfileOpen]    = useState(false);
  const [profileVis,     setProfileVis]     = useState(false);
  const { healthContext, refreshContext }   = useHealthContext();

  // Keep profileData in sync if initialProfile changes (e.g. after onboarding)
  useEffect(() => { if (initialProfile) setProfileData(initialProfile); }, [initialProfile]);
  const [active,  setActive]  = useState(null);
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState(() => loadChecked());
  const [journalEntries, setJournalEntries] = useState(() => loadJournalEntries());
  const [moodLog, setMoodLog] = useState(() => loadMoodLog());
  const [toast, setToast] = useState(null);
  const [symptomQuery, setSymptomQuery] = useState("");
  const [symptomInput, setSymptomInput] = useState("");
  const [symptomKey, setSymptomKey] = useState(null);
  const [mainTab, setMainTab] = useState("week");
  const [quickAdd, setQuickAdd] = useState(false);
  const [quickAddVis, setQuickAddVis] = useState(false);
  const [completedTests, setCompletedTests] = useState(
    () => JSON.parse(localStorage.getItem("matri-completed-tests") || "{}")
  );
  const [doctorPrepOpen, setDoctorPrepOpen] = useState(false);
  const [rxUploadOpen,   setRxUploadOpen]   = useState(false);

  // ── Medicine dialog state — lives here so MedDialogs renders at app root, escaping all stacking contexts ──
  const [medPauseMed,  setMedPauseMed]  = useState(null);
  const [medEditMed,   setMedEditMed]   = useState(null);
  const [medDeleteMed, setMedDeleteMed] = useState(null);

  const updateMedsFromApp = async (newMeds) => {
    setProfileData(p => ({...p, medications: newMeds}));
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await supabase.from("profiles").update({ medications: newMeds }).eq("id", user.id);
    } catch {}
  };

  // Keeps medicines table in sync with profile.medications changes made from the UI.
  // Fire-and-forget — never blocks the UI. Pass updates=null to delete the row.
  const syncMedicineTable = (name, updates) => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      if (updates === null) {
        supabase.from("medicines").delete().eq("user_id", user.id).ilike("name", name).then(() => {});
      } else {
        supabase.from("medicines").update(updates).eq("user_id", user.id).ilike("name", name).then(() => {});
      }
    }).catch(() => {});
  };

  const appMedHandlers = {
    onPause: (med) => {
      if (med.paused) {
        const newMeds = (profileData?.medications||[]).map(m =>
          parseMed(m).name===med.name ? {...(typeof m==="object"?m:parseMed(m)), paused:false, pause_reason:null} : m
        );
        updateMedsFromApp(newMeds);
        syncMedicineTable(med.name, { active: true });
      } else {
        setMedPauseMed({...med, reason:""});
      }
    },
    onEdit:   (med) => setMedEditMed({...med, _origName: med.name}),
    onDelete: (med) => setMedDeleteMed(med),
  };

  const appConfirmPause = async () => {
    const newMeds = (profileData?.medications||[]).map(m =>
      parseMed(m).name===medPauseMed.name
        ? {...(typeof m==="object"?m:parseMed(m)), paused:true, pause_reason:medPauseMed.reason}
        : m
    );
    await updateMedsFromApp(newMeds);
    syncMedicineTable(medPauseMed.name, { active: false });
    setMedPauseMed(null);
  };

  const appConfirmEdit = async () => {
    const { dosage, frequency, duration, notes, _origName } = medEditMed;
    const newMeds = (profileData?.medications||[]).map(m =>
      parseMed(m).name===_origName
        ? {...(typeof m==="object"?m:parseMed(m)), dosage, frequency, duration, notes}
        : m
    );
    await updateMedsFromApp(newMeds);
    syncMedicineTable(_origName, { dosage, frequency, duration, notes });
    setMedEditMed(null);
  };

  const appConfirmDelete = async () => {
    const newMeds = (profileData?.medications||[]).filter(m => parseMed(m).name !== medDeleteMed.name);
    await updateMedsFromApp(newMeds);
    syncMedicineTable(medDeleteMed.name, null);
    setMedDeleteMed(null);
  };

  const setJournalEntriesPersist = (updater) => {
    setJournalEntries((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveJournalEntries(next);
      return next;
    });
  };

  const markTestComplete = async (testId) => {
    const updated = { ...completedTests, [testId]: new Date().toISOString().split("T")[0] };
    setCompletedTests(updated);
    localStorage.setItem("matri-completed-tests", JSON.stringify(updated));
    // Also save to Supabase
    await supabase.from("profiles").update({ completed_tests: updated })
      .eq("id", profileData?.id);
  };

  // open/close helpers
  const open  = id => { analytics.panelOpened(id); setActive(id); requestAnimationFrame(() => setVisible(true)); };
  const close = ()  => { setVisible(false); setTimeout(() => setActive(null), 390); };
  const openSymptom = (q) => { setSymptomQuery(q||""); setSymptomInput(q||""); open("symptom"); };

  const openProfile  = () => {
    // Re-fetch latest profile from Supabase every time we open
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from("profiles").select("*").eq("id", user.id).single()
          .then(({ data }) => { if (data) setProfileData(data); });
      }
    });
    setProfileOpen(true);
    requestAnimationFrame(() => setProfileVis(true));
  };
  const closeProfile = () => { setProfileVis(false); setTimeout(() => setProfileOpen(false), 390); };

  // Mood log helpers
  const logMood = (emoji) => {
    const entry = { id: Date.now(), emoji, week: 8, source: "body-panel", date: istDate() };
    setMoodLog(p => {
      const next = [entry, ...p];
      saveMoodLog(next);
      return next;
    });
    setToast(emoji);
    setTimeout(() => setToast(null), 2000);
  };
  const deleteMood = (id) => {
    setMoodLog(p => {
      const next = p.filter(m => m.id !== id);
      saveMoodLog(next);
      return next;
    });
  };

  // Quick add sheet
  const openQuickAdd  = () => { setQuickAdd(true);  requestAnimationFrame(()=>setQuickAddVis(true)); };
  const closeQuickAdd = () => { setQuickAddVis(false); setTimeout(()=>setQuickAdd(false), 370); };

  // Library → album / timeline navigation
  const [libAlbumOpen, setLibAlbumOpen] = useState(false);
  const [libAlbumVis,  setLibAlbumVis]  = useState(false);
  const openLibAlbum  = () => { setLibAlbumOpen(true);  requestAnimationFrame(()=>setLibAlbumVis(true)); };
  const closeLibAlbum = () => { setLibAlbumVis(false); setTimeout(()=>setLibAlbumOpen(false), 370); };
  const goToJournalTimeline = () => { setMainTab("journal"); };
  const toggleCheck = (id) => {
    analytics.milestoneChecked(id);
    setChecked((p) => {
      const next = { ...p, [id]: !p[id] };
      saveChecked(next);
      return next;
    });
  };

  const checksDone = Object.values(checked).filter(Boolean).length;

  useEffect(()=>{
    document.body.style.overflow = active ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  },[active]);

  const pd = active ? PANELS[active] : null;

  return (
    <div className="app" style={{display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden"}}>

      {/* ── SCROLLABLE CONTENT AREA ── */}
      <div style={{flex:1,overflowY:"auto",scrollbarWidth:"none",WebkitOverflowScrolling:"touch"}}>

        {/* ══ THIS WEEK TAB ══ */}
        {mainTab==="week" && <>
          {/* HERO */}
          <div className="hero" onClick={() => open("baby")}>
            <div className="blob" style={{width:260,height:260,background:"#9a3020",top:-90,right:-70,opacity:0.4}}/>
            <div className="blob" style={{width:160,height:160,background:"#c05840",bottom:30,left:-20,opacity:0.22}}/>
            <span className="hero-bg-emoji">🤱</span>
            <div className="hero-grad"/>

            {/* Matri wordmark — top left, before content */}
            <div style={{position:"relative",zIndex:2,padding:"18px 22px 0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:"#f0a07a",flexShrink:0}}/>
                <span style={{fontSize:11,fontWeight:700,letterSpacing:"0.22em",textTransform:"uppercase",color:"rgba(255,255,255,0.55)"}}>matri</span>
              </div>
              {/* Profile chip — always show if logged in */}
              <div className="profile-chip" onClick={e => { e.stopPropagation(); openProfile(); }}>
                <div className="profile-chip-avatar" style={{fontSize:16}}>
                  🤰
                </div>
                {profileData?.name && (
                  <span className="profile-chip-name">{profileData.name.split(" ")[0]}</span>
                )}
              </div>
            </div>

            <div className="hero-inner" style={{paddingTop:14}}>
              {/* Week + Trimester chip */}
              <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:6}}>
                <div className="hero-week">Week <em>8.</em></div>
                <div style={{fontSize:10,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(255,255,255,0.38)",paddingBottom:6}}>First Trimester</div>
              </div>

              <div className="hero-tagline">The nausea is real. The exhaustion is real.<br/>So is that heartbeat.</div>

              <div className="hero-stats">
                <div className="hero-stat">
                  <span className="hero-stat-val">1.6cm</span>
                  <span className="hero-stat-lbl">tip of your thumb</span>
                </div>
                <div style={{position:"relative",padding:"10px 12px",minWidth:52,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:44,lineHeight:1,userSelect:"none"}}>🫘</span>
                </div>
                <div className="hero-stat"><span className="hero-stat-val">~160 bpm</span><span className="hero-stat-lbl">heart rate</span></div>
              </div>
            </div>
            <div className="hero-tap">Tap to explore your baby ↗</div>
            {(journalEntries.length > 0 || moodLog.length > 0) && <HeroMoodStrip journalEntries={journalEntries} moodLog={moodLog} onTap={()=>open("journal")}/>}
            <div className="prog-row">
              <div className="prog-lbl">Wk 8</div>
              <div className="prog-track"><div className="prog-fill"/></div>
              <div className="prog-lbl">40</div>
              <div className="t1-badge">T1</div>
            </div>
          </div>

          {/* WEEK NAV */}
          <div className="week-nav">
            <button className="week-nav-btn">← Wk 7</button>
            <div className="week-nav-mid">
              <span className="week-nav-label">Week 8</span>
              <span className="week-nav-sub">of 40 · First trimester</span>
            </div>
            <button className="week-nav-btn">Wk 9 →</button>
          </div>

          {/* PAUSED MEDICINE REMINDER STRIP */}
          {(() => {
            const pausedMeds = (profileData?.medications || [])
              .map(parseMed)
              .filter(m => m.paused && (m.pause_reason === "Ran out" || m.pause_reason === "About to run out"));
            if (!pausedMeds.length) return null;
            return (
              <div style={{margin:"8px 12px 0",background:"linear-gradient(135deg,var(--amber-pale),#fff8e4)",border:"1px solid var(--amber-bdr)",borderRadius:16,padding:"12px 16px"}}>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:"var(--amber)",marginBottom:8}}>⚠️ Medicines needing attention</div>
                {pausedMeds.map((m, i) => (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,paddingBottom:i<pausedMeds.length-1?8:0,marginBottom:i<pausedMeds.length-1?8:0,borderBottom:i<pausedMeds.length-1?"1px solid var(--amber-bdr)":"none"}}>
                    <div style={{width:30,height:30,borderRadius:9,background:"var(--amber-pale)",border:"1px solid var(--amber-bdr)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>💊</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:600,color:"var(--ink)"}}>{m.name}</div>
                      <div style={{fontSize:10,color:"var(--amber)"}}>{m.pause_reason} — let your doctor know</div>
                    </div>
                    <button
                      onClick={()=>open("medical")}
                      style={{fontSize:10,fontWeight:600,color:"var(--amber)",background:"transparent",border:"1px solid var(--amber-bdr)",borderRadius:100,padding:"3px 10px",cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>
                      View
                    </button>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* SYMPTOM CHIP GRID */}
          <div className="symptom-section">
            <div className="symptom-section-hdr">
              <span className="symptom-section-title">What are you feeling?</span>
            </div>
            <div style={{fontSize:12,color:"var(--muted)",marginBottom:10,lineHeight:1.5}}>
              Something bothering you? Let's talk about it!
            </div>
            <div className="symptom-chip-grid">
              {[
                {key:"nausea",     emoji:"🤢", label:"Nausea",       bg:"#edf7ee", border:"#b8debb", col:"#2a6030"},
                {key:"cramping",   emoji:"😖", label:"Cramping",     bg:"#fdf0ec", border:"#f0cfc8", col:"#8a2a20"},
                {key:"spotting",   emoji:"🩸", label:"Spotting",     bg:"#fef0f0", border:"#f5c0c0", col:"#9a2020"},
                {key:"headache",   emoji:"🤕", label:"Headache",     bg:"#fdf6e4", border:"#ddc080", col:"#7a5010"},
                {key:"no movement",emoji:"👶", label:"Movement",     bg:"#eaf0f8", border:"#b5cae0", col:"#2a4a70"},
                {key:"acidity",    emoji:"🔥", label:"Acidity",      bg:"#fff1e8", border:"#f0c898", col:"#8a4010"},
                {key:"constipation",emoji:"😣",label:"Constipation", bg:"#f5eefb", border:"#d8a8e8", col:"#622070"},
                {key:"swelling",   emoji:"🦶", label:"Swelling",     bg:"#e8f5f5", border:"#90ccc8", col:"#1a6060"},
                {key:"discharge",  emoji:"💧", label:"Discharge",    bg:"#eaf0f8", border:"#9ab8d8", col:"#2a4870"},
                {key:"sleep",      emoji:"🌙", label:"Sleep",        bg:"#eeecf8", border:"#b8b0e0", col:"#3a3070"},
                {key:"mood swings",emoji:"🎭", label:"Mood swings",  bg:"#fef0f8", border:"#e8b0d8", col:"#822060"},
              ].map(s=>(
                <button key={s.key} className="symptom-chip"
                  style={{background:s.bg, borderColor:s.border, position:"relative"}}
                  onClick={()=>{ setSymptomKey(s.key); open("symptomDetail"); }}>
                  <span className="symptom-chip-emoji">{s.emoji}</span>
                  <span className="symptom-chip-lbl" style={{color:s.col}}>{s.label}</span>
                  <span style={{position:"absolute",bottom:5,right:6,fontSize:8,color:s.col,opacity:0.4,fontWeight:700,lineHeight:1}}>↗</span>
                </button>
              ))}
            </div>
            {/* Search bar — coming soon */}
            <div className="symptom-search-soon">
              <span className="symptom-search-soon-icon">🔍</span>
              <span className="symptom-search-soon-txt">Describe what you're feeling…</span>
              <span className="symptom-search-soon-badge">Coming soon</span>
            </div>
          </div>

          {/* ── WIDGET GRID ── */}
          <div className="grid">

            {/* BODY — combined with Matri Moment — warm cream/rose */}
            <div className="w w-full w-tall" onClick={()=>open("body")}
              style={{background:"linear-gradient(145deg,#fdf6f0,#faeae0)",border:"1px solid #f0d8c8"}}>
              <span className="w-bg-e" style={{color:"#c05040",fontSize:120}}>🌿</span>
              <div className="win-lg">
                <div className="w-lbl" style={{color:"var(--rose)"}}><div className="w-lbl-dot" style={{background:"var(--rose)"}}/>How are you feeling?</div>
                <div style={{fontFamily:"'Lora',serif",fontSize:14,fontStyle:"italic",color:"var(--ink)",lineHeight:1.65,marginBottom:12}}>{getMatriMoment(8).question}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                  {["😰","😴","🤢","😭","🤍","😤","😕","🌀"].map(e=>(
                    <span key={e} onClick={ev=>{ev.stopPropagation();logMood(e);}}
                      style={{fontSize:22,cursor:"pointer",transition:"transform 0.15s",display:"inline-block"}}
                      onPointerDown={ev=>ev.currentTarget.style.transform="scale(1.3)"}
                      onPointerUp={ev=>ev.currentTarget.style.transform="scale(1)"}>
                      {e}
                    </span>
                  ))}
                </div>
                <button onClick={ev=>{ev.stopPropagation();setMainTab("journal");}}
                  style={{background:"rgba(191,82,64,0.1)",border:"1px solid rgba(191,82,64,0.2)",
                    borderRadius:100,padding:"6px 14px",fontSize:11,fontWeight:600,
                    color:"var(--rose)",cursor:"pointer",fontFamily:"inherit"}}>
                  ✍️ Write about this
                </button>
              </div>
              <div className="w-tap w-tap-dk">Tap to explore ↗</div>
            </div>

            {/* MATRI INSIGHTS FEED */}
            <InsightFeedWidget
              healthContext={healthContext}
              profileData={profileData}
              onOpenDoctorPrep={() => setDoctorPrepOpen(true)}
            />

            {/* STORYBOOK PREVIEW — second, high visibility */}
            <StorybookPreviewWidget entries={journalEntries} onOpenAlbum={openLibAlbum} onOpenJournal={()=>setMainTab("journal")}/>

            {/* 3AM — left + WINS — right */}
            {/* 3AM — Google search theme */}
            <div className="w w-left w-sm" onClick={()=>open("3am")}
              style={{background:"#fff",border:"1px solid #e8e0d8"}}>
              <div className="win">
                <div className="w-lbl" style={{color:"#5f6368",marginBottom:6}}>
                  <div style={{display:"flex",gap:3,marginBottom:6}}>
                    {["#4285F4","#EA4335","#FBBC05","#34A853"].map((c,i)=>(
                      <div key={i} style={{width:6,height:6,borderRadius:"50%",background:c}}/>
                    ))}
                  </div>
                  <span style={{fontSize:9,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:"#5f6368"}}>3am searches</span>
                </div>
                <div style={{fontFamily:"'Lora',serif",fontSize:14,color:"var(--ink)",lineHeight:1.3,marginBottom:8}}>What everyone <em style={{fontStyle:"italic",color:"#4285F4"}}>Googles.</em></div>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  {["Is this normal?","Can I eat paneer?","Why so tired?"].map(q=>(
                    <div key={q} style={{fontSize:10,color:"#5f6368",display:"flex",gap:5,alignItems:"center",
                      background:"#f8f9fa",borderRadius:100,padding:"3px 8px"}}>
                      <span style={{color:"#4285F4",fontSize:9,fontWeight:700}}>🔍</span>{q}
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-tap w-tap-dk">Tap to explore ↗</div>
            </div>

            {/* WINS — explicit dark indigo */}
            <div className="w w-right wc-dark2 w-sm" onClick={()=>open("wins")}>
              <span className="w-bg-e" style={{color:"#b0a0f0",fontSize:80}}>🏆</span>
              <div className="win">
                <div className="w-lbl" style={{color:"#b0a0f0"}}><div className="w-lbl-dot" style={{background:"#b0a0f0"}}/>This week's win</div>
                <div style={{fontFamily:"'Lora',serif",fontSize:15,color:"#fff",lineHeight:1.3,marginBottom:6}}>You made it to <em style={{fontStyle:"italic",color:"#b0a0f0"}}>week 8.</em></div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",lineHeight:1.5}}>That heart hasn't stopped once.</div>
              </div>
              <div className="w-tap w-tap-lt">Tap to explore ↗</div>
            </div>

            {/* CHECKLIST */}
            <div className="w w-full wc-amber" onClick={()=>open("checklist")}>
              <span className="w-bg-e" style={{color:"var(--amber)",fontSize:90}}>✅</span>
              <div className="win-lg">
                <div className="w-lbl" style={{color:"var(--amber)"}}><div className="w-lbl-dot" style={{background:"var(--amber)"}}/>Checklist this week</div>
                <div className="wt-md">7 things. <em style={{color:"var(--amber)"}}>That's it.</em></div>
                <div style={{fontSize:11,color:"var(--muted)",marginTop:6,marginBottom:4}}>
                  {checksDone} of {CHECKS.length} done{checksDone===CHECKS.length?" 🎉":""}
                </div>
                <div style={{marginTop:6,columns:2,columnGap:16}}>
                  {CHECKS.slice(0,4).map(c=>(
                    <div key={c.id} role="button" tabIndex={0}
                      onClick={e=>{e.stopPropagation();toggleCheck(c.id);}}
                      onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();e.stopPropagation();toggleCheck(c.id);}}}
                      style={{display:"flex",alignItems:"flex-start",gap:7,fontSize:11,marginBottom:5,color:"var(--amber)",cursor:"pointer"}}>
                      <div style={{width:14,height:14,borderRadius:"50%",border:`1.5px solid ${checked[c.id]?"var(--forest)":"currentColor"}`,background:checked[c.id]?"var(--forest)":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:checked[c.id]?"#fff":"inherit",marginTop:1}}>{checked[c.id]&&"✓"}</div>
                      <span style={{color:checked[c.id]?"var(--forest)":"inherit",opacity:checked[c.id]?0.55:1,fontWeight:checked[c.id]?600:400,lineHeight:1.35}}>{c.text}</span>
                    </div>
                  ))}
                </div>
                {CHECKS.length>4&&<div style={{fontSize:10,color:"var(--muted)",marginTop:4,fontStyle:"italic"}}>+{CHECKS.length-4} more in full list</div>}
              </div>
              <div className="w-tap w-tap-dk">Tap to explore ↗</div>
            </div>

            {/* NOBODY TELLS YOU — left + PARTNER — right */}
            <div className="w w-left wc-plum w-sm" onClick={()=>open("ntty")}>
              <span className="w-bg-e" style={{color:"var(--plum)",fontSize:60}}>🤫</span>
              <div className="win">
                <div className="w-lbl" style={{color:"var(--plum)"}}><div className="w-lbl-dot" style={{background:"var(--plum)"}}/>Nobody tells you</div>
                <div style={{fontFamily:"'Lora',serif",fontSize:14,color:"var(--ink)",lineHeight:1.3}}>The things no one <em style={{color:"var(--plum)"}}>warns you about.</em></div>
              </div>
              <div className="w-tap w-tap-dk">Tap to explore ↗</div>
            </div>

            <div className="w w-right wc-teal w-sm" onClick={()=>open("partner")}>
              <span className="w-bg-e" style={{color:"var(--teal)",fontSize:60}}>🤝</span>
              <div className="win">
                <div className="w-lbl" style={{color:"var(--teal)"}}><div className="w-lbl-dot" style={{background:"var(--teal)"}}/>For your partner</div>
                <div style={{fontFamily:"'Lora',serif",fontSize:14,color:"var(--ink)",lineHeight:1.3}}>What your partner <em style={{color:"var(--teal)"}}>should know.</em></div>
              </div>
              <div className="w-tap w-tap-dk">Tap to explore ↗</div>
            </div>

            {/* MEDICAL — left + NUTRITION — right */}
            <MedHealthWidget
              profile={profileData}
              compact={true}
              onEditHealth={() => open("medical")}
              onMedsUpdate={newMeds => setProfileData(p => ({...p, medications: newMeds}))}
              {...appMedHandlers}
            />

            <div className="w w-right wc-forest w-sm" onClick={()=>open("food")}>
              <span className="w-bg-e" style={{color:"var(--forest)",fontSize:60}}>🥥</span>
              <div className="win">
                <div className="w-lbl" style={{color:"var(--forest)"}}><div className="w-lbl-dot" style={{background:"var(--forest)"}}/>Nutrition</div>
                <div style={{fontFamily:"'Lora',serif",fontSize:14,color:"var(--ink)",lineHeight:1.3}}>Food when nothing <em style={{color:"var(--forest)"}}>appeals.</em></div>
              </div>
              <div className="w-tap w-tap-dk">Tap to explore ↗</div>
            </div>

            {/* STORIES */}
            <div className="w w-full wc-dark4" onClick={()=>open("stories")}>
              <span style={{position:"absolute",fontSize:160,right:-20,bottom:-20,opacity:0.07,transform:"rotate(-10deg)",pointerEvents:"none",color:"#c8a0f0",userSelect:"none"}}>💬</span>
              <div className="win-lg">
                <div className="w-lbl" style={{color:"#c8a0f0"}}><div className="w-lbl-dot" style={{background:"#c8a0f0"}}/>Stories from week 8</div>
                <div style={{fontFamily:"'Lora',serif",fontSize:22,color:"#fff",lineHeight:1.2,marginBottom:12}}>Women who've been <em style={{fontStyle:"italic",color:"#c8a0f0"}}>right here.</em></div>
                <div style={{display:"flex",alignItems:"center"}}>
                  {STORIES.map(s=>(
                    <div key={s.id} style={{width:28,height:28,borderRadius:"50%",background:s.aBg,color:s.aCol,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,border:"2px solid rgba(0,0,0,0.3)",marginRight:-6,flexShrink:0}}>{s.init}</div>
                  ))}
                  <span style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginLeft:14}}>{STORIES.length} stories this week</span>
                </div>
              </div>
              <div className="w-tap w-tap-lt">Tap to explore ↗</div>
            </div>
          </div>
        </>}

        {/* ══ LIBRARY TAB ══ */}
        {mainTab==="library" && (
          <LibraryView
            onOpen={open}
            journalEntries={journalEntries}
            moodLog={moodLog}
            onDeleteMood={deleteMood}
            onViewAlbum={openLibAlbum}
            onViewTimeline={goToJournalTimeline}
            onOpenProfile={openProfile}
            profileData={profileData}
          />
        )}

        {/* ══ JOURNAL TAB ══ */}
        {mainTab==="journal" && (
          <div style={{minHeight:"calc(100vh - 64px)",display:"flex",flexDirection:"column"}}>
            <JournalTab entries={journalEntries} setEntries={setJournalEntriesPersist} onOpenAlbum={openLibAlbum} moodLog={moodLog} onOpenProfile={openProfile} profileData={profileData}/>
          </div>
        )}
      </div>

      {/* ── MOOD TOAST ── */}
      <div className={`mood-toast${toast?" show":""}`}>
        <span style={{fontSize:18}}>{toast}</span> logged to your mood
      </div>

      {/* ── BACKDROP (panels) ── */}
      <div className={`backdrop${visible?" open":""}`} onClick={close}/>

      {/* ── PANEL ── */}
      {active && pd && (
        <div className={`panel${visible?" open":""}`}>
          <div className="panel-inner">
            <div className="panel-head" style={{background:pd.headBg}}>
              <div>
                {active==="symptomDetail" && symptomKey && COMMON_SYMPTOMS[symptomKey] ? (
                  <>
                    <div className="panel-head-lbl" style={{color:"var(--rose)"}}>Week 8 · {COMMON_SYMPTOMS[symptomKey].label}</div>
                    <div className="panel-head-title" style={{color:"var(--ink)"}}>Ask me anything <em>about this</em></div>
                  </>
                ) : (
                  <>
                    <div className="panel-head-lbl" style={{color:pd.lblCol}}>{pd.label}</div>
                    <div className="panel-head-title" style={{color:pd.titleCol}}>{pd.title}</div>
                  </>
                )}
              </div>
              <button className={`close-btn${pd.dark?" close-dk":""}`} onClick={close}>✕</button>
            </div>
            {pd.noScroll ? (
              <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
                {active==="baby"
                  ? <BabyPanel/>
                  : active==="journal"
                  ? <JournalPanel entries={journalEntries} setEntries={setJournalEntriesPersist} initialTab="timeline" moodLog={moodLog}/>
                  : active==="symptomDetail"
                  ? <SymptomDetailPanel
                  symptomKey={symptomKey}
                  week={8}
                  COMMON_SYMPTOMS={COMMON_SYMPTOMS}
                  analytics={analytics}
                  authFetch={authFetch}
                />
                  : pd.Panel ? <pd.Panel/> : null}
              </div>
            ) : (
              <div className="panel-scroll">
                {active==="checklist" ? <CheckPanel checked={checked} toggle={toggleCheck}/>
                  : active==="symptom" ? <SymptomPanel
                  initialQuery={symptomQuery}
                  analytics={analytics}
                  authFetch={authFetch}
                  COMMON_SYMPTOMS={COMMON_SYMPTOMS}
                  week={profileData?.due_date ? Math.round(40-(new Date(profileData.due_date)-new Date())/(7*24*60*60*1000)) : 8}
                />
                  : active==="body" ? <BodyPanel onLogMood={logMood}/>
                  : active==="food" ? <FoodPanel/>
                  : active==="moment" ? <MatriMomentPanel week={8} entries={journalEntries} setEntries={setJournalEntriesPersist}/>
                  : active==="medical" ? <MedPanel profileData={profileData} completedTests={completedTests} onMarkTestComplete={markTestComplete} onRxUpload={()=>setRxUploadOpen(true)} {...appMedHandlers}/>
                  : pd.Panel ? <pd.Panel/> : null}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── LIBRARY ALBUM OVERLAY ── */}
      {libAlbumOpen && (
        <div className={`album-screen${libAlbumVis?" open":""}`} style={{position:"fixed",inset:0,zIndex:200}}>
          <AlbumView entries={journalEntries} onClose={closeLibAlbum}/>
        </div>
      )}

      {/* ── QUICK ADD FAB (week + library tabs only) ── */}
      {mainTab!=="journal" && (
        <button className="fab" onClick={openQuickAdd} aria-label="Add journal entry">+</button>
      )}

      {/* ── QUICK ADD SHEET ── */}
      {quickAdd && (
        <div className={`quick-add-sheet${quickAddVis?" open":""}`}>
          <div className="quick-add-backdrop" onClick={closeQuickAdd}/>
          <div className="quick-add-card">
            <div className="quick-add-title">Add to your <em>story</em></div>
            <QuickAddEntry
              entries={journalEntries}
              setEntries={setJournalEntriesPersist}
              onClose={closeQuickAdd}
            />
          </div>
        </div>
      )}

      {/* ── THREE-TAB BOTTOM NAV ── */}
      <div className="tab-nav">
        <div className="tab-nav-inner">
          {[
            {id:"week",  icon:"🌸", label:"This Week"},
            {id:"library",icon:"📚",label:"Journey"},
            {id:"journal",icon:"✍️",label:"Memories"},
          ].map(t=>(
            <button key={t.id} className={"tab-btn"+(mainTab===t.id?" on":"")} onClick={()=>setMainTab(t.id)}>
              <span className="tab-btn-icon">{t.icon}</span>
              <span className="tab-btn-lbl">{t.label}</span>
              <div className="tab-btn-dot"/>
            </button>
          ))}
        </div>
      </div>
      {/* ── DOCTOR PREP SHEET ── */}
      {doctorPrepOpen && (
        <DoctorPrepSheet
          healthContext={healthContext}
          profileData={profileData}
          onClose={() => setDoctorPrepOpen(false)}
        />
      )}

      {/* ── PRESCRIPTION UPLOAD FLOW ── */}
      {rxUploadOpen && (
        <PrescriptionUploadFlow
          onComplete={async (result) => {
            refreshContext();
            setRxUploadOpen(false);
            // If prescription has a follow-up date, save it as next appointment
            if (result?.follow_up_date) {
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  await supabase.from("profiles")
                    .update({ next_appointment_date: result.follow_up_date })
                    .eq("id", user.id);
                  setProfileData(p => ({...p, next_appointment_date: result.follow_up_date}));
                }
              } catch {}
            }
            // Re-fetch profile to pick up new prescriptions list saved by infer.js
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
                if (data) setProfileData(data);
              }
            } catch {}
          }}
          onClose={() => setRxUploadOpen(false)}
        />
      )}

      {/* ── PROFILE PAGE ── */}
      {profileOpen && (
        <ProfilePage
          profile={profileData}
          onClose={closeProfile}
          onProfileUpdate={setProfileData}
          weekProp={8}
          onOpenMedical={() => { closeProfile(); setTimeout(() => open("medical"), 400); }}
          completedTests={completedTests}
          onMarkTestComplete={markTestComplete}
          appMedHandlers={appMedHandlers}
          onRxUpload={() => { closeProfile(); setTimeout(() => setRxUploadOpen(true), 400); }}
        />
      )}

      {/* ── MED DIALOGS — at app root, outside all transforms/stacking contexts ── */}
      <MedDialogs
        pauseMed={medPauseMed}   setPauseMed={setMedPauseMed}   confirmPause={appConfirmPause}
        editMed={medEditMed}     setEditMed={setMedEditMed}     confirmEdit={appConfirmEdit}
        deleteMed={medDeleteMed} setDeleteMed={setMedDeleteMed} confirmDelete={appConfirmDelete}
      />

    </div>
  );
}

export default AuthGate;
