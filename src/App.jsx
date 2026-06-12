import "./styles/app.css";
import matriLogo from "./assets/matri.png";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { analytics } from "./analytics";
import { supabase } from "./supabase";
import OnboardingFlow from "./components/OnboardingFlow";
import SymptomDetailPanel from "./components/SymptomDetailPanel";
import SymptomPanel from "./components/SymptomPanel";
import DoctorPrepSheet from "./components/DoctorPrepSheet";
import WeekPickerSheet from "./components/WeekPickerSheet";
import { COMMON_SYMPTOMS } from "./constants/symptoms";
import { useWeeklyContent, mergeSymptomContexts } from "./utils/useWeeklyContent";
import {
  WEEKLY_PROMPTS,
  getWeekPrompt
} from "./constants/journalPrompts";
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

// Phase 1: Utility imports
import { istDate, istTime } from "./utils/date";
import { authFetch, useHealthContext } from "./utils/auth";
import {
  CHECKLIST_STORAGE_KEY, loadChecked, saveChecked, loadUserChecklist, saveUserChecklist,
  USER_STORIES_KEY, loadUserStories, saveUserStories,
  MOOD_LOG_KEY, NUTR_KEY, loadMoodLog, saveMoodLog,
  JOURNAL_STORAGE_KEY, JOURNAL_IDS_KEY, journalEntryKey, loadJournalEntries, saveJournalEntry, saveJournalEntries,
  MOMENT_STORAGE_KEY, loadMoments, saveMoment,
  COVER_PHOTO_KEY
} from "./utils/storage";
import { CORE_LAB_ALIASES, isCoreLabAlias, parseMed, humanSchedule, mealTiming } from "./utils/medical";
import { clampCropPos, readFileAsDataUrl } from "./utils/imageUtils";

// Phase 2: Component imports
import { AlbumView, PgCover, PgChapter, PgWeekHeader, PgEntry, PgClosing } from "./components/album/AlbumView";
import { BabyPanel, BodyPanel, ThreeAmPanel, NobodyTellsPanel, PartnerPanel, WinsPanel, FoodPanel, BABY_SIZES, MOODS } from "./components/panels/EducationPanels";
import { MythPanel, PlanningPanel, FearsPanel, CheckPanel, CHECKS } from "./components/panels/ContentPanels";
import { JournalCameraCapture, JournalPhotoCrop, JournalPanel } from "./components/journal/JournalPanel";
import { StoriesPanel, STORIES, STORY_TAG_SUGGESTIONS } from "./components/journal/StoriesPanel";
import { MedicineCard, MedHealthWidget, MedHealthWidgetFull, MedDialogs, MedPanel } from "./components/medical/MedicineComponents";
import { PrescriptionUploadFlow, PrescriptionsList, PrescriptionDetailSheet, PrescriptionEditor } from "./components/medical/PrescriptionComponents";
import { LabTimelineRow, TestOrderRow, TestOrdersSection, TestReportSheet, LabsEditor, TestDetailPanel, TestSuggestionsStrip, DoctorInsight } from "./components/medical/LabComponents";
import ProfilePage from "./components/profile/ProfilePage";
import HealthTab from "./components/medical/HealthTab";
import { PregnantIcon, AuthScreen } from "./components/auth/AuthGate";
import ConsentScreen from "./components/ConsentScreen";
import AIPhotoConsentScreen from "./components/AIPhotoConsentScreen";
import { StorybookPreviewWidget, HeroMoodStrip, InsightFeedWidget, QuickAddEntry, FriendsCard, MoodSummary, MatriMomentWidget, MatriMomentPanel, ShareableStrip, LibraryView, JournalTab } from "./components/dashboard/Widgets";

// Matri v2.1 — build 2026-05-24

/* ─── DATA ───────────────────────────────────────────────────────────────── */

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

/* ─── PANEL CONFIG ───────────────────────────────────────────────────── */
const PANELS = {
  baby:      { label:"Your baby",        title:<>1.6cm · <em>tip of your thumb</em></>,         headBg:"#1a1210",           lblCol:"#e8b8a8",       titleCol:"#fff",        dark:true,  Panel:BabyPanel,    noScroll:true },
  body:      { label:"Your body",        title:<>What you're feeling is <em>real</em></>,        headBg:"var(--rose-pale)",  lblCol:"var(--rose)",   titleCol:"var(--ink)",  dark:false, Panel:BodyPanel },
  "3am":     { label:"3am searches",     title:<>What everyone <em>Googles</em></>,               headBg:"#1a1210",           lblCol:"#e8b8a8",       titleCol:"#fff",        dark:true,  Panel:ThreeAmPanel },
  ntty:      { label:"Nobody tells you", title:<>What nobody <em>tells you</em></>,               headBg:"var(--plum-pale)",  lblCol:"var(--plum)",   titleCol:"var(--ink)",  dark:false, Panel:NobodyTellsPanel },
  wins:      { label:"This week's win",  title:<>You made it to <em>week 8</em></>,               headBg:"#181a32",           lblCol:"#e8b8c8",       titleCol:"#fff",        dark:true,  Panel:WinsPanel },
  partner:   { label:"For your partner", title:<>What your partner <em>should know</em></>,           headBg:"var(--navy-pale)",  lblCol:"var(--navy)",   titleCol:"var(--ink)",  dark:false, Panel:PartnerPanel },
  food:      { label:"Nutrition",        title:<>Food when nothing <em>appeals</em></>,           headBg:"var(--forest-pale)",lblCol:"var(--forest)", titleCol:"var(--ink)",  dark:false, Panel:FoodPanel },
  medical:   { label:"Medical",          title:<>What needs to happen <em>now</em></>,            headBg:"var(--slate-pale)", lblCol:"var(--slate)",  titleCol:"var(--ink)",  dark:false, Panel:MedPanel },
  checklist: { label:"Checklist this week", title:<>Seven things. <em>That's it.</em></>,            headBg:"var(--amber-pale)", lblCol:"var(--amber)",  titleCol:"var(--ink)",  dark:false, Panel:null },
  journal:   { label:"Journal",          title:<>Your pregnancy <em>story</em></>,                headBg:"#0a2020",           lblCol:"#70c8b8",       titleCol:"#fff",        dark:true,  Panel:JournalPanel, noScroll:true },
  stories:   { label:"Stories",          title:<>Women who've been <em>right here</em></>,        headBg:"#241038",           lblCol:"#e8b8c8",       titleCol:"#fff",        dark:true,  Panel:StoriesPanel },
  symptom:      { label:"How are you feeling?", title:<>Is this <em>normal</em>?</>,               headBg:"var(--cream2)",     lblCol:"var(--rose)",   titleCol:"var(--ink)",  dark:false, Panel:null },
  symptomDetail:{ label:"",                    title:<></>,                                         headBg:"#200c18",           lblCol:"#e8b8a8",       titleCol:"#fff",        dark:true,  Panel:null, noScroll:true },
  myth:      { label:"Myth busting",         title:<>True, false, or <em>complicated</em></>,       headBg:"var(--amber-pale)", lblCol:"var(--amber)",  titleCol:"var(--ink)",  dark:false, Panel:MythPanel },
  planning:  { label:"Life planning",        title:<>Pregnancy and <em>your daily life</em></>,     headBg:"var(--navy-pale)",  lblCol:"var(--navy)",   titleCol:"var(--ink)",  dark:false, Panel:PlanningPanel },
  fears:     { label:"Real fears",           title:<>The things nobody <em>admits</em></>,          headBg:"var(--ink)",        lblCol:"rgba(255,200,180,0.7)", titleCol:"#fff", dark:true, Panel:FearsPanel },
  moment:    { label:"Matri moment",         title:<>A pause. <em>Just for you.</em></>,            headBg:"#0a1a10",           lblCol:"#80d0a0",       titleCol:"#fff",  dark:true, Panel:null, noScroll:false },
};

/* ─── MAIN APP ───────────────────────────────────────────────────────── */
function App({ profile: initialProfile }) {
  const [profileData,    setProfileData]    = useState(initialProfile);
  const [profileOpen,    setProfileOpen]    = useState(false);
  const [profileVis,     setProfileVis]     = useState(false);
  const [ranOutMeds,     setRanOutMeds]     = useState([]);
  const [healthTabCounts, setHealthTabCounts] = useState(null);
  const { healthContext, refreshContext, forceRefresh } = useHealthContext();

  // Keep profileData in sync if initialProfile changes (e.g. after onboarding)
  useEffect(() => { if (initialProfile) setProfileData(initialProfile); }, [initialProfile]);

  // Fetch health counts on mount so the Today tab card doesn't wait for HealthTab to mount.
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const [medsRes, testRes, scansRes] = await Promise.all([
          supabase.from("medicines").select("*").eq("user_id", user.id),
          supabase.from("test_orders").select("id").eq("user_id", user.id).eq("status", "ordered"),
          supabase.from("scans").select("id,status").eq("user_id", user.id),
        ]);
        const allMeds = medsRes.data || [];
        setHealthTabCounts({
          medicines: allMeds.filter(m => m.active !== false && !m.paused && !m.ran_out).length,
          tests:     (testRes.data  || []).length,
          scans:     (scansRes.data || []).filter(s => s.status !== "completed").length,
        });
        setRanOutMeds(allMeds.filter(m => m.ran_out && m.name));
      } catch {}
    })();
  }, []);

  // ── Week computation ──────────────────────────────────────────────────────
  const currentWeek = useMemo(() => {
    if (!profileData?.due_date) return null;
    const w = Math.round(40 - (new Date(profileData.due_date) - new Date()) / (7 * 24 * 60 * 60 * 1000));
    return Math.max(4, Math.min(42, w));
  }, [profileData?.due_date]);

  const [browseWeek, setBrowseWeek] = useState(null); // null = live (follow currentWeek)
  const effectiveWeek = browseWeek ?? currentWeek;

  useEffect(() => {
    if (effectiveWeek) setChecked(loadChecked(effectiveWeek));
  }, [effectiveWeek]);

  const weeklyContent  = useWeeklyContent(effectiveWeek);
  const enrichedSymptoms = useMemo(
    () => mergeSymptomContexts(COMMON_SYMPTOMS, weeklyContent),
    [weeklyContent]
  );

  const [weekPickerOpen, setWeekPickerOpen] = useState(false);

  const trimester = !effectiveWeek ? null
    : effectiveWeek <= 13 ? "First Trimester"
    : effectiveWeek <= 26 ? "Second Trimester"
    : "Third Trimester";

  const [active,  setActive]  = useState(null);
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState({});
  const [userChecklist, setUserChecklist] = useState(() => loadUserChecklist());
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
  const [labsOpen,       setLabsOpen]       = useState(false);
  const [consentOpen,    setConsentOpen]    = useState(false);
  const [aiConsentOpen,  setAiConsentOpen]  = useState(
    initialProfile != null && initialProfile.ai_consent_given == null
  );
  useEffect(() => {
    if (initialProfile == null) return;
    setAiConsentOpen(initialProfile.ai_consent_given == null);
  }, [initialProfile]);
  const [pendingAction,  setPendingAction]  = useState(null);
  const [labsVis,        setLabsVis]        = useState(false);
  const [labsEditData,   setLabsEditData]   = useState({});
  const [labsSaving,     setLabsSaving]     = useState(false);
  const [testOrderDetail,  setTestOrderDetail]  = useState(null);
  const [testOrdersReload, setTestOrdersReload] = useState(0);

  // Checklist bubble drag state
  const [bubblePos,      setBubblePos]      = useState(null); // null = default bottom-right
  const [bubbleTabbed,   setBubbleTabbed]   = useState(false);
  const [bubbleSide,     setBubbleSide]     = useState("right");
  const [bubbleDragging, setBubbleDragging] = useState(false);
  const bubbleDrag = useRef({ active:false, sx:0, sy:0, bx:0, by:0, moved:false });
  const BUBBLE_W = 170;
  const getBubblePos = useCallback(() =>
    bubblePos || { x: window.innerWidth - BUBBLE_W - 14, y: window.innerHeight - 140 }
  , [bubblePos]);

  const onBubblePD = useCallback((e) => {
    e.stopPropagation();
    const p = bubblePos || { x: window.innerWidth - BUBBLE_W - 14, y: window.innerHeight - 160 };
    bubbleDrag.current = { active:true, sx:e.clientX, sy:e.clientY, bx:p.x, by:p.y, moved:false };
    setBubbleDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [bubblePos]);

  const onBubblePM = useCallback((e) => {
    if (!bubbleDrag.current.active) return;
    const dx = e.clientX - bubbleDrag.current.sx;
    const dy = e.clientY - bubbleDrag.current.sy;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) bubbleDrag.current.moved = true;
    if (!bubbleDrag.current.moved) return;
    setBubblePos({ x: bubbleDrag.current.bx + dx, y: bubbleDrag.current.by + dy });
  }, []);

  const onBubblePU = useCallback((e) => {
    if (!bubbleDrag.current.active) return;
    bubbleDrag.current.active = false;
    setBubbleDragging(false);
    if (!bubbleDrag.current.moved) {
      // tap — open checklist using stable state setters directly
      setActive("checklist");
      requestAnimationFrame(() => setVisible(true));
      return;
    }
    const sw = window.innerWidth, sh = window.innerHeight;
    const p  = bubbleDrag.current;
    const cx = p.bx + (e.clientX - p.sx);
    const cy = p.by + (e.clientY - p.sy);
    const clampY = (y) => Math.max(60, Math.min(sh - 130, y));
    if (cx < -50) {
      setBubbleTabbed(true); setBubbleSide("left");
      setBubblePos({ x: -(BUBBLE_W - 14), y: clampY(cy) });
    } else if (cx + BUBBLE_W > sw + 50) {
      setBubbleTabbed(true); setBubbleSide("right");
      setBubblePos({ x: sw - 14, y: clampY(cy) });
    } else {
      setBubbleTabbed(false);
      const snapLeft = cx + BUBBLE_W / 2 < sw / 2;
      setBubblePos({ x: snapLeft ? 14 : sw - BUBBLE_W - 14, y: clampY(cy) });
    }
  }, []);

  const restoreBubble = useCallback(() => {
    const sw = window.innerWidth;
    const p  = getBubblePos();
    setBubbleTabbed(false);
    setBubblePos({ x: bubbleSide === "left" ? 14 : sw - BUBBLE_W - 14, y: p.y });
  }, [bubbleSide, getBubblePos]);

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
    const entry = { id: Date.now(), emoji, week: effectiveWeek ?? 0, source: "body-panel", date: istDate() };
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

  // Consent gate — shows ConsentScreen before any upload if not yet consented
  const withConsent = (action) => {
    if (profileData?.consent_given) { action(); return; }
    setPendingAction(() => action);
    setConsentOpen(true);
  };

  const handleConsentDismiss = () => {
    setConsentOpen(false);
    setPendingAction(null);
  };
  const handleAIConsent = async (aiEnabled) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const now = new Date().toISOString();
        await supabase.from("profiles").update({ ai_consent_given: aiEnabled, ai_consent_date: now }).eq("id", user.id);
        setProfileData(p => ({ ...p, ai_consent_given: aiEnabled }));
      }
    } catch {}
    setAiConsentOpen(false);
  };
  const handleConsent = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const now = new Date().toISOString();
        await supabase.from("profiles").update({ consent_given: true, consent_date: now }).eq("id", user.id);
        setProfileData(p => ({ ...p, consent_given: true, consent_date: now }));
      }
    } catch {}
    setConsentOpen(false);
    const action = pendingAction;
    setPendingAction(null);
    action?.();
  };

  // Labs editor sheet
  const openLabsEditor  = () => {
    setLabsEditData({ lab_data: profileData?.lab_data||{}, lab_extras_v2: profileData?.lab_extras_v2||{} });
    setLabsOpen(true);
    requestAnimationFrame(() => setLabsVis(true));
  };
  const closeLabsEditor = () => { setLabsVis(false); setTimeout(() => setLabsOpen(false), 370); };
  const saveLabsEdit = async () => {
    setLabsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ lab_data: labsEditData.lab_data, lab_extras_v2: labsEditData.lab_extras_v2 }).eq("id", user.id);
        setProfileData(p => ({...p, lab_data: labsEditData.lab_data, lab_extras_v2: labsEditData.lab_extras_v2}));
      }
    } catch {}
    setLabsSaving(false);
    closeLabsEditor();
  };

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
      saveChecked(next, effectiveWeek);
      return next;
    });
  };

  const weekChecksItems = weeklyContent?.checklist ?? CHECKS;
  const checksTotal = weekChecksItems.length + userChecklist.length;
  const checksDone  = weekChecksItems.filter(c => checked[c.id]).length
                    + userChecklist.filter(u => checked[`u_${u.id}`]).length;

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
          <div className="hero" style={{margin:"12px 12px 0",borderRadius:20}} onClick={() => open("baby")}>
            <span className="hero-bg-emoji">🤰</span>
            <div className="hero-grad"/>

            {/* Wordmark + profile chip */}
            <div style={{position:"relative",zIndex:2,padding:"18px 20px 0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <img src={matriLogo} alt="Matri" style={{width:72,display:"block"}}/>
              <div className="profile-chip" onClick={e=>{e.stopPropagation();openProfile();}}>
                <div className="profile-chip-avatar" style={{fontSize:16}}>🤰</div>
                {profileData?.name && <span className="profile-chip-name">{profileData.name.split(" ")[0]}</span>}
              </div>
            </div>

            {/* ── ZONE 1: Week + dimensions ── */}
            <div className="hero-inner" style={{paddingBottom:10}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <button
                  onPointerDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); setWeekPickerOpen(true); }}
                  style={{background:"transparent",border:"none",padding:0,cursor:"pointer",fontFamily:"inherit",WebkitTapHighlightColor:"transparent",textAlign:"left"}}>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:400,lineHeight:1,letterSpacing:"-0.02em",color:"#fff",marginBottom:5}}>
                    Week{" "}<em style={{fontStyle:"italic",color:"#e8b8a8",borderBottom:"1.5px dotted rgba(232,184,168,0.45)",paddingBottom:1}}>{effectiveWeek ?? "…"}</em>
                  </div>
                  <span style={{fontSize:9,fontWeight:600,letterSpacing:"0.14em",textTransform:"uppercase",color:"rgba(255,255,255,0.3)"}}>{trimester || "…"}</span>
                </button>
                <div style={{display:"flex",gap:5}}>
                  {(() => {
                    const bs = weeklyContent?.baby_size;
                    const staticBs = BABY_SIZES[effectiveWeek] || BABY_SIZES[8];
                    const cm  = bs?.cm  || staticBs?.cm  || "…";
                    const bpm = bs?.bpm || 160;
                    return <>
                      <span style={{fontSize:9,color:"rgba(232,184,168,0.55)",background:"rgba(232,184,168,0.09)",border:"1px solid rgba(232,184,168,0.12)",borderRadius:100,padding:"2px 8px",display:"inline-flex",alignItems:"center",gap:3}}>
                        <span style={{fontSize:10}}>🫘</span> {cm}
                      </span>
                      <span style={{fontSize:9,color:"rgba(255,255,255,0.3)",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:100,padding:"2px 8px"}}>~{bpm}bpm</span>
                    </>;
                  })()}
                </div>
              </div>
            </div>

            {/* ── MOOD STRIP ── */}
            <div style={{padding:"0 20px 14px",position:"relative",zIndex:2}} onClick={e=>e.stopPropagation()}>
              <div style={{fontSize:8,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",color:"rgba(255,255,255,0.2)",marginBottom:9}}>How are you today?</div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                {["😰","😴","🤢","😭","🤍","😤","😕","🌀"].map(e=>(
                  <span key={e} onClick={()=>logMood(e)}
                    style={{fontSize:20,cursor:"pointer",display:"inline-block",transition:"transform 0.12s",userSelect:"none"}}
                    onPointerDown={ev=>ev.currentTarget.style.transform="scale(1.35)"}
                    onPointerUp={ev=>ev.currentTarget.style.transform="scale(1)"}>
                    {e}
                  </span>
                ))}
                <button onClick={()=>setMainTab("journal")}
                  style={{marginLeft:"auto",background:"transparent",border:"none",padding:0,fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.25)",cursor:"pointer",fontFamily:"inherit",flexShrink:0,whiteSpace:"nowrap"}}>
                  ✍️ Write →
                </button>
              </div>
            </div>

            {/* ── PROGRESS + TAP ── */}
            <div className="hero-tap">Tap to explore your baby ↗</div>
            <div className="prog-row">
              <div className="prog-lbl">Wk {effectiveWeek ?? "…"}</div>
              <div className="prog-track">
                <div className="prog-fill" style={{width: effectiveWeek ? `${Math.min(100,(effectiveWeek/40)*100)}%` : "20%"}}/>
              </div>
              <div className="prog-lbl">40</div>
              <div className="t1-badge">{effectiveWeek ? (effectiveWeek<=13?"T1":effectiveWeek<=26?"T2":"T3") : "T1"}</div>
            </div>
          </div>

          {/* ── BROWSE MODE BANNER ── */}
          {browseWeek !== null && currentWeek && (
            <div style={{margin:"8px 12px 0",background:"linear-gradient(135deg,#231432,#311840)",borderRadius:14,padding:"10px 16px",display:"flex",alignItems:"center",gap:12,border:"1px solid rgba(232,184,200,0.18)"}}>
              <div style={{fontSize:10,color:"rgba(232,184,200,0.6)",flex:1,lineHeight:1.5}}>
                Browsing <strong style={{color:"rgba(232,184,200,0.95)",fontWeight:600}}>Week {browseWeek}</strong>
                <span style={{color:"rgba(232,184,200,0.35)"}}> · tap to return</span>
              </div>
              <button
                onClick={() => setBrowseWeek(null)}
                style={{
                  background:"transparent",
                  border:"1px solid rgba(232,184,200,0.22)",
                  borderRadius:100,padding:"5px 14px",
                  fontSize:10,fontWeight:600,
                  color:"rgba(232,184,200,0.75)",
                  cursor:"pointer",fontFamily:"inherit",
                  WebkitTapHighlightColor:"transparent",
                  whiteSpace:"nowrap",flexShrink:0,
                  letterSpacing:"0.04em",
                }}>
                Wk {currentWeek}
              </button>
            </div>
          )}

          {/* ══ MATRI AI CARD (My Health + Insights) ══ */}
          {(() => {
            const activeMeds = (profileData?.medications||[]).map(parseMed).filter(m=>!m.paused);
            const conditions = (profileData?.conditions||[]).filter(c => c && c.toLowerCase() !== "unknown" && c.trim());
            const hbReadings = profileData?.lab_data?.hemoglobin||[];
            const hasHealthData = !!(activeMeds.length||conditions.length||hbReadings.length||profileData?.prescriptions?.length);

            // Build subline for My Health header
            const facts = [];
            const namedMeds = activeMeds.filter(m => m.name && m.name.toLowerCase() !== "unknown");
            if (conditions.length) facts.push(conditions[0]);
            if (namedMeds.length===1) facts.push(namedMeds[0].name);
            else if (namedMeds.length>1) facts.push(`your ${namedMeds.length} medicines`);
            if (hbReadings.length) { const l=hbReadings[hbReadings.length-1]; facts.push(`HB ${l.value}`); }
            const factStr = facts.length===0 ? "your health history"
              : facts.length===1 ? facts[0]
              : facts.length===2 ? `${facts[0]} & ${facts[1]}`
              : `${facts.slice(0,-1).join(", ")} & ${facts[facts.length-1]}`;
            const healthSubline = hasHealthData ? `Matri remembers ${factStr} — so you don't have to.` : null;

            const conds  = conditions;
            const counts = {
              medicines: healthTabCounts?.medicines ?? 0,
              tests:     healthTabCounts?.tests     ?? 0,
              scans:     healthTabCounts?.scans     ?? 0,
            };
            const hasHealthSummary = counts.medicines > 0 || counts.tests > 0 || counts.scans > 0 || conds.length > 0
              || !!(profileData?.prescriptions?.length);

            return (
              <div style={{margin:"8px 12px 0",background:"linear-gradient(160deg,#2c1438 0%,#3c1c4c 50%,#2e1440 100%)",borderRadius:20,overflow:"hidden",border:"1px solid rgba(232,184,200,0.1)",position:"relative"}}>

                {/* My Health stat tiles — top of card now */}
                <div style={{cursor:"pointer",position:"relative",zIndex:1}} onClick={()=>setMainTab("library")}>
                  <div style={{padding:"14px 20px 10px"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom: healthSubline ? 4 : 0}}>
                      <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:"rgba(232,184,200,0.6)",display:"flex",alignItems:"center",gap:5}}>
                        <span>✦</span> My Health
                      </div>
                      <div style={{width:26,height:26,borderRadius:"50%",background:"rgba(232,184,200,0.08)",border:"1px solid rgba(232,184,200,0.14)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <span style={{fontSize:11,color:"rgba(232,184,200,0.6)"}}>→</span>
                      </div>
                    </div>
                    {healthSubline && (
                      <div style={{fontSize:10,color:"rgba(255,255,255,0.32)",lineHeight:1.5,paddingRight:36}}>
                        {healthSubline}
                      </div>
                    )}
                  </div>
                  {hasHealthSummary ? (
                    <div style={{padding:"0 16px 14px"}}>
                      <div style={{display:"flex",gap:8}}>
                        {counts.medicines > 0 && (
                          <div style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(232,184,200,0.12)",borderRadius:12,padding:"8px 10px",display:"flex",alignItems:"center",gap:8}}>
                            <div style={{fontSize:16,lineHeight:1,flexShrink:0}}>💊</div>
                            <div>
                              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:400,color:"#fff",lineHeight:1,marginBottom:2}}>{counts.medicines}</div>
                              <div style={{fontSize:8,color:"rgba(255,255,255,0.35)",letterSpacing:"0.06em",textTransform:"uppercase"}}>med{counts.medicines>1?"s":""}</div>
                            </div>
                          </div>
                        )}
                        {counts.tests > 0 && (
                          <div style={{flex:1,background:"rgba(255,180,80,0.08)",border:"1px solid rgba(255,180,80,0.2)",borderRadius:12,padding:"8px 10px",display:"flex",alignItems:"center",gap:8}}>
                            <div style={{fontSize:16,lineHeight:1,flexShrink:0}}>🧪</div>
                            <div>
                              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:400,color:"rgba(255,195,90,0.95)",lineHeight:1,marginBottom:2}}>{counts.tests}</div>
                              <div style={{fontSize:8,color:"rgba(255,180,80,0.6)",letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:700}}>tests due</div>
                            </div>
                          </div>
                        )}
                        {counts.scans > 0 && (
                          <div style={{flex:1,background:"rgba(120,170,255,0.06)",border:"1px solid rgba(120,170,255,0.15)",borderRadius:12,padding:"8px 10px",display:"flex",alignItems:"center",gap:8}}>
                            <div style={{fontSize:16,lineHeight:1,flexShrink:0}}>📄</div>
                            <div>
                              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:400,color:"rgba(140,190,255,0.85)",lineHeight:1,marginBottom:2}}>{counts.scans}</div>
                              <div style={{fontSize:8,color:"rgba(120,170,255,0.45)",letterSpacing:"0.06em",textTransform:"uppercase"}}>scan{counts.scans>1?"s":""}</div>
                            </div>
                          </div>
                        )}
                      </div>
                      {conds.length > 0 && (
                        <div style={{marginTop:8,display:"flex",flexWrap:"wrap",gap:5}}>
                          {conds.slice(0,2).map((c,i) => (
                            <span key={i} style={{fontSize:10,fontWeight:600,color:"rgba(240,200,210,0.85)",background:"rgba(232,184,200,0.1)",border:"1px solid rgba(232,184,200,0.15)",borderRadius:100,padding:"3px 10px"}}>{c}</span>
                          ))}
                        </div>
                      )}
                      {ranOutMeds.filter(m=>m.name).length > 0 && (
                        <div style={{marginTop:10,display:"flex",alignItems:"center",gap:8,background:"rgba(255,180,80,0.08)",border:"1px solid rgba(255,180,80,0.2)",borderRadius:10,padding:"7px 12px",cursor:"pointer"}}
                          onClick={()=>setMainTab("library")}>
                          <span style={{fontSize:13,flexShrink:0}}>⚠️</span>
                          <span style={{fontSize:11,color:"rgba(255,195,90,0.9)",flex:1,lineHeight:1.4}}>
                            {ranOutMeds.filter(m=>m.name).slice(0,2).map(m=>m.name).join(", ")}
                            {ranOutMeds.filter(m=>m.name).length > 2 ? ` +${ranOutMeds.filter(m=>m.name).length - 2} more` : ""} ran out
                          </span>
                          <span style={{fontSize:10,fontWeight:700,color:"rgba(255,195,90,0.6)",flexShrink:0}}>Restock →</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{padding:"0 20px 16px"}}>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,fontStyle:"italic",color:"rgba(255,255,255,0.55)",lineHeight:1.45}}>
                        Upload a prescription to get started →
                      </div>
                    </div>
                  )}
                </div>

                {/* Insights — always shown; widget handles no-health-data state */}
                <div style={{height:1,background:"rgba(255,255,255,0.08)"}}/>
                <InsightFeedWidget
                  healthContext={healthContext}
                  profileData={profileData}
                  currentWeek={currentWeek}
                  hasRealHealthData={hasHealthSummary}
                  onOpenDoctorPrep={()=>setDoctorPrepOpen(true)}
                  onRxUpload={()=>withConsent(()=>setRxUploadOpen(true))}
                  embedded
                />

              </div>
            );
          })()}


          {/* SYMPTOM SECTION — Matri AI branded */}
          <div style={{padding:"20px 20px 0",display:"flex",alignItems:"center",gap:10}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:5,background:"var(--rose-pale)",border:"1px solid var(--rose-bdr)",borderRadius:100,padding:"3px 10px 3px 7px",flexShrink:0}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:"var(--rose)",boxShadow:"0 0 6px rgba(181,88,112,0.5)",flexShrink:0}}/>
                <span style={{fontSize:9,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:"var(--rose)"}}>Matri AI</span>
              </div>
              <span style={{fontSize:9,fontWeight:700,letterSpacing:"0.22em",textTransform:"uppercase",color:"var(--muted)"}}>What are you feeling?</span>
            </div>
            <div style={{flex:1,height:1,background:"var(--bdr)"}}/>
          </div>

          {/* SYMPTOM CHIP GRID */}
          <div className="symptom-section" style={{paddingBottom:0,marginBottom:0}}>
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

          {/* YOUR PREGNANCY STORY CARD */}
          <div style={{margin:"10px 12px 0"}}>
            <StorybookPreviewWidget entries={journalEntries} onOpenAlbum={openLibAlbum} onOpenJournal={()=>setMainTab("journal")}/>
          </div>



          {/* ══ SECTION: WHAT TO KNOW ══ */}
          <div style={{padding:"20px 20px 0",display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:9,fontWeight:700,letterSpacing:"0.22em",textTransform:"uppercase",color:"var(--muted)",flexShrink:0}}>What to know</span>
            <div style={{flex:1,height:1,background:"var(--bdr)"}}/>
          </div>

          {/* HORIZONTAL SCROLL — secondary content */}
          <div style={{position:"relative"}}>
          <div className="know-scroll" style={{paddingTop:14}}>

            {/* 3AM — Google search theme */}
            <div className="w w-sm" onClick={()=>open("3am")}
              style={{width:180,minHeight:320,flexShrink:0,background:"#fff",border:"1px solid #e8e0d8"}}>
              <div className="win">
                <div className="w-lbl" style={{color:"#5f6368",marginBottom:6}}>
                  <div style={{display:"flex",gap:3,marginBottom:6}}>
                    {["#4285F4","#EA4335","#FBBC05","#34A853"].map((c,i)=>(
                      <div key={i} style={{width:6,height:6,borderRadius:"50%",background:c}}/>
                    ))}
                  </div>
                  <span style={{fontSize:9,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:"#5f6368"}}>3am searches</span>
                </div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,color:"var(--ink)",lineHeight:1.3,marginBottom:8}}>What everyone <em style={{fontStyle:"italic",color:"#4285F4"}}>Googles.</em></div>
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

            {/* WINS */}
            <div className="w w-sm wc-dark2" style={{width:180,minHeight:320,flexShrink:0}} onClick={()=>open("wins")}>
              <span className="w-bg-e" style={{color:"#e8b8c8",fontSize:80}}>🏆</span>
              <div className="win">
                <div className="w-lbl" style={{color:"#e8b8c8"}}><div className="w-lbl-dot" style={{background:"#e8b8c8"}}/>This week's win</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:"#fff",lineHeight:1.3,marginBottom:6}}>
                  {weeklyContent?.wins_copy?.title_em
                    ? <span dangerouslySetInnerHTML={{__html: weeklyContent.wins_copy.title_em}}/>
                    : <>You made it to <em style={{fontStyle:"italic",color:"#e8b8c8"}}>week {effectiveWeek ?? 8}.</em></>
                  }
                </div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",lineHeight:1.5}}>
                  {weeklyContent?.wins_copy?.subtitle || "That heart hasn't stopped once."}
                </div>
              </div>
              <div className="w-tap w-tap-lt">Tap to explore ↗</div>
            </div>

            {/* NOBODY TELLS YOU */}
            <div className="w w-sm wc-plum" style={{width:180,minHeight:320,flexShrink:0}} onClick={()=>open("ntty")}>
              <span className="w-bg-e" style={{color:"var(--plum)",fontSize:60}}>🤫</span>
              <div className="win">
                <div className="w-lbl" style={{color:"var(--plum)"}}><div className="w-lbl-dot" style={{background:"var(--plum)"}}/>Nobody tells you</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,color:"var(--ink)",lineHeight:1.3}}>The things no one <em style={{color:"var(--plum)"}}>warns you about.</em></div>
              </div>
              <div className="w-tap w-tap-dk">Tap to explore ↗</div>
            </div>

            {/* FOR YOUR PARTNER */}
            <div className="w w-sm wc-teal" style={{width:180,minHeight:320,flexShrink:0}} onClick={()=>open("partner")}>
              <span className="w-bg-e" style={{color:"var(--teal)",fontSize:60}}>🤝</span>
              <div className="win">
                <div className="w-lbl" style={{color:"var(--teal)"}}><div className="w-lbl-dot" style={{background:"var(--teal)"}}/>For your partner</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,color:"var(--ink)",lineHeight:1.3}}>What your partner <em style={{color:"var(--teal)"}}>should know.</em></div>
              </div>
              <div className="w-tap w-tap-dk">Tap to explore ↗</div>
            </div>

            {/* NUTRITION */}
            <div className="w w-sm wc-forest" style={{width:180,minHeight:320,flexShrink:0}} onClick={()=>open("food")}>
              <span className="w-bg-e" style={{color:"var(--forest)",fontSize:60}}>🥥</span>
              <div className="win">
                <div className="w-lbl" style={{color:"var(--forest)"}}><div className="w-lbl-dot" style={{background:"var(--forest)"}}/>Nutrition</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,color:"var(--ink)",lineHeight:1.3}}>Food when nothing <em style={{color:"var(--forest)"}}>appeals.</em></div>
              </div>
              <div className="w-tap w-tap-dk">Tap to explore ↗</div>
            </div>

          </div>
          {/* right-edge fade — signals scrollability */}
          <div style={{position:"absolute",top:0,right:0,bottom:0,width:56,background:"linear-gradient(to left,#fdfaf5 20%,transparent 100%)",pointerEvents:"none"}}/>
          </div>

          {/* ══ SECTION: SOCIALIZE & ACTIVITY ══ */}
          <div style={{padding:"20px 20px 0",display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:9,fontWeight:700,letterSpacing:"0.22em",textTransform:"uppercase",color:"var(--muted)",flexShrink:0}}>Socialize &amp; activity</span>
            <div style={{flex:1,height:1,background:"var(--bdr)"}}/>
          </div>

          <div style={{padding:"14px 12px 0"}}>
            <div className="w wc-dark4" style={{minHeight:200,cursor:"pointer"}} onClick={()=>open("stories")}>
              <span style={{position:"absolute",fontSize:140,right:-10,bottom:-10,opacity:0.07,transform:"rotate(-10deg)",pointerEvents:"none",color:"#e8b8c8",userSelect:"none"}}>💬</span>
              <div className="win-lg">
                <div className="w-lbl" style={{color:"#e8b8c8"}}><div className="w-lbl-dot" style={{background:"#e8b8c8"}}/>Stories from week {effectiveWeek ?? 8}</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:"#fff",lineHeight:1.2,marginBottom:14}}>Women who've been <em style={{fontStyle:"italic",color:"#e8b8c8"}}>right here.</em></div>
                <div style={{display:"flex",alignItems:"center"}}>
                  {STORIES.map(s=>(
                    <div key={s.id} style={{width:28,height:28,borderRadius:"50%",background:s.aBg,color:s.aCol,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,border:"2px solid rgba(0,0,0,0.3)",marginRight:-5,flexShrink:0}}>{s.init}</div>
                  ))}
                  <span style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginLeft:14}}>{STORIES.length} stories this week</span>
                </div>
              </div>
              <div className="w-tap w-tap-lt">Tap to read ↗</div>
            </div>
          </div>

          <div style={{height:96}}/>
        </>}

        {/* ══ MY HEALTH TAB ══ */}
        {mainTab==="library" && (
          <HealthTab
            profileData={profileData}
            healthContext={healthContext}
            onOpenProfile={openProfile}
            onOpenLabsEditor={()=>withConsent(openLabsEditor)}
            requireConsent={withConsent}
            onRanOutChange={setRanOutMeds}
            onCountsChange={setHealthTabCounts}
            onDataChange={async () => {
              forceRefresh();
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
                  if (data) setProfileData(data);
                }
              } catch {}
            }}
            onUploadComplete={async (result) => {
              forceRefresh();
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
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
                  if (data) setProfileData(data);
                }
              } catch {}
            }}
          />
        )}

        {/* ══ JOURNAL TAB ══ */}
        {mainTab==="journal" && (
          <div style={{minHeight:"calc(100vh - 64px)",display:"flex",flexDirection:"column"}}>
            <JournalTab entries={journalEntries} setEntries={setJournalEntriesPersist} onOpenAlbum={openLibAlbum} moodLog={moodLog} onOpenProfile={openProfile} profileData={profileData} week={effectiveWeek}/>
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
                {active==="symptomDetail" && symptomKey && enrichedSymptoms[symptomKey] ? (
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"nowrap",minWidth:0}}>
                    <span style={{fontSize:20,lineHeight:1,flexShrink:0,display:"flex",alignItems:"center"}}>{enrichedSymptoms[symptomKey].emoji}</span>
                    <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:400,color:"#fff",whiteSpace:"nowrap",lineHeight:1,display:"flex",alignItems:"center"}}>{enrichedSymptoms[symptomKey].label}</span>
                    <span style={{fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.5)",background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:100,padding:"3px 9px",whiteSpace:"nowrap",flexShrink:0,lineHeight:1,display:"flex",alignItems:"center"}}>
                      {enrichedSymptoms[symptomKey].status}
                    </span>
                    <span style={{fontSize:10,color:"rgba(255,255,255,0.35)",whiteSpace:"nowrap",flexShrink:0,lineHeight:1,display:"flex",alignItems:"center"}}>· Wk {effectiveWeek ?? week}</span>
                  </div>
                ) : (
                  <>
                    <div className="panel-head-lbl" style={{color:pd.lblCol}}>{pd.label}</div>
                    <div className="panel-head-title" style={{color:pd.titleCol}}>
                      {active==="wins"
                        ? <>You made it to <em>week {effectiveWeek ?? 8}</em></>
                        : active==="baby" && weeklyContent?.baby_size
                        ? <>{weeklyContent.baby_size.cm} · <em>{weeklyContent.baby_size.compare}</em></>
                        : active==="checklist"
                        ? <>{weekChecksItems.length} things. <em>That's it.</em></>
                        : pd.title}
                    </div>
                  </>
                )}
              </div>
              <button className={`close-btn${pd.dark?" close-dk":""}`} onClick={close}>✕</button>
            </div>
            {pd.noScroll ? (
              <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
                {active==="baby"
                  ? <BabyPanel week={effectiveWeek} weeklyContent={weeklyContent}/>
                  : active==="journal"
                  ? <JournalPanel entries={journalEntries} setEntries={setJournalEntriesPersist} initialTab="timeline" moodLog={moodLog} week={effectiveWeek} userName={profileData?.name}/>
                  : active==="symptomDetail"
                  ? <SymptomDetailPanel
                  symptomKey={symptomKey}
                  week={effectiveWeek ?? 8}
                  COMMON_SYMPTOMS={enrichedSymptoms}
                  analytics={analytics}
                  authFetch={authFetch}
                />
                  : pd.Panel ? <pd.Panel week={effectiveWeek} weeklyContent={weeklyContent}/> : null}
              </div>
            ) : (
              <div className="panel-scroll">
                {active==="checklist" ? <CheckPanel checked={checked} toggle={toggleCheck} userItems={userChecklist} onUserItemsChange={(items)=>{ setUserChecklist(items); saveUserChecklist(items); }} weeklyContent={weeklyContent}/>
                  : active==="symptom" ? <SymptomPanel
                  initialQuery={symptomQuery}
                  analytics={analytics}
                  authFetch={authFetch}
                  COMMON_SYMPTOMS={enrichedSymptoms}
                  week={effectiveWeek ?? 8}
                />
                  : active==="body" ? <BodyPanel onLogMood={logMood} week={effectiveWeek}/>
                  : active==="food" ? <FoodPanel week={effectiveWeek} weeklyContent={weeklyContent}/>
                  : active==="moment" ? <MatriMomentPanel week={effectiveWeek ?? 8} weeklyMoment={weeklyContent?.matri_moment} entries={journalEntries} setEntries={setJournalEntriesPersist}/>
                  : active==="medical" ? <MedPanel profileData={profileData} completedTests={completedTests} onMarkTestComplete={markTestComplete} onRxUpload={()=>withConsent(()=>setRxUploadOpen(true))} {...appMedHandlers}/>
                  : pd.Panel ? <pd.Panel week={effectiveWeek} weeklyContent={weeklyContent}/> : null}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── LIBRARY ALBUM OVERLAY ── */}
      {libAlbumOpen && (
        <div className={`album-screen${libAlbumVis?" open":""}`} style={{position:"fixed",inset:0,zIndex:200}}>
          <AlbumView entries={journalEntries} onClose={closeLibAlbum} userName={profileData?.name}/>
        </div>
      )}

      {/* ── CHECKLIST BUBBLE (draggable) ── */}
      {mainTab!=="journal" && (bubbleTabbed ? (

        /* ── EDGE TAB (slid off screen) ── */
        <button onClick={restoreBubble} aria-label="Restore checklist"
          style={{position:"fixed",
            top: getBubblePos().y + 6,
            [bubbleSide==="left" ? "left" : "right"]: 0,
            zIndex:60, cursor:"pointer",
            background:"linear-gradient(145deg,#1e1530,#281940)",
            border:"1px solid rgba(210,165,55,0.28)",
            borderRadius: bubbleSide==="left" ? "0 10px 10px 0" : "10px 0 0 10px",
            padding:"10px 5px",
            display:"flex",flexDirection:"column",alignItems:"center",gap:4,
            boxShadow:"0 4px 20px rgba(0,0,0,0.5)",
            fontFamily:"inherit",WebkitTapHighlightColor:"transparent",
            transition:"transform 0.3s ease"}}>
          <span style={{fontSize:10,color:"rgba(230,175,55,0.8)"}}>
            {bubbleSide==="left" ? "›" : "‹"}
          </span>
          <span style={{fontSize:8,fontWeight:700,letterSpacing:"0.08em",
            textTransform:"uppercase",color:"rgba(255,255,255,0.3)",
            writingMode:"vertical-rl",lineHeight:1.2}}>list</span>
        </button>

      ) : (

        /* ── FLOATING PILL ── */
        <button
          onPointerDown={onBubblePD}
          onPointerMove={onBubblePM}
          onPointerUp={onBubblePU}
          aria-label="Weekly checklist"
          style={{position:"fixed",
            left: getBubblePos().x,
            top:  getBubblePos().y,
            zIndex:60, cursor:"grab",
            background:"linear-gradient(145deg,#1e1530,#281940)",
            border:"1px solid rgba(210,165,55,0.22)",
            borderRadius:100, padding:"10px 16px 10px 10px",
            display:"flex", alignItems:"center", gap:10,
            boxShadow:"0 8px 28px rgba(0,0,0,0.55),0 1px 0 rgba(255,255,255,0.05) inset",
            fontFamily:"inherit", WebkitTapHighlightColor:"transparent",
            touchAction:"none", userSelect:"none",
            transition: bubbleDragging ? "none" : "left 0.35s cubic-bezier(0.25,0.8,0.25,1),top 0.35s cubic-bezier(0.25,0.8,0.25,1)"}}>

          <div style={{width:32,height:32,borderRadius:"50%",flexShrink:0,
            background: checksDone===checksTotal ? "rgba(70,190,120,0.18)" : "rgba(210,165,50,0.16)",
            border:`1.5px solid ${checksDone===checksTotal ? "rgba(70,190,120,0.4)" : "rgba(210,165,50,0.35)"}`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:15, pointerEvents:"none",
            color: checksDone===checksTotal ? "rgba(80,210,130,0.95)" : "rgba(230,175,55,0.95)"}}>
            ✓
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:3,alignItems:"flex-start",pointerEvents:"none"}}>
            <span style={{fontSize:9,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",
              color:"rgba(255,255,255,0.38)",lineHeight:1}}>Your checklist</span>
            <span style={{fontSize:13,fontWeight:700,lineHeight:1,
              color: checksDone===checksTotal ? "rgba(80,210,130,0.9)" : "rgba(230,175,55,0.95)"}}>
              {checksDone===checksTotal
                ? "All done ✓"
                : <>{checksDone}<span style={{fontWeight:400,color:"rgba(255,255,255,0.28)"}}> of {checksTotal}</span></>}
            </span>
          </div>
        </button>

      ))}

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
              week={effectiveWeek}
            />
          </div>
        </div>
      )}

      {/* ── THREE-TAB BOTTOM NAV ── */}
      <div className="tab-nav">
        <div className="tab-nav-inner">
          {[
            {id:"week",  icon:"🌸", label:"Home"},
            {id:"library",icon:"🏥",label:"My Health"},
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

      {/* ── CONSENT SCREEN ── */}
      {consentOpen && <ConsentScreen onConsent={handleConsent} onDismiss={handleConsentDismiss}/>}
      {aiConsentOpen && <AIPhotoConsentScreen onConsent={handleAIConsent}/>}

      {/* ── PRESCRIPTION UPLOAD FLOW ── */}
      {rxUploadOpen && (
        <PrescriptionUploadFlow
          onComplete={async (result) => {
            forceRefresh();
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

      {/* ── LABS EDITOR SHEET ── */}
      {labsOpen && (
        <div className={`quick-add-sheet${labsVis?" open":""}`} style={{zIndex:220}}>
          <div className="quick-add-backdrop" onClick={closeLabsEditor}/>
          <div className="quick-add-card" style={{maxHeight:"88vh",display:"flex",flexDirection:"column",padding:"20px 18px 0"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexShrink:0}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:19,color:"var(--ink)"}}>Tests &amp; <em>lab values</em></div>
              <button onClick={closeLabsEditor} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:16,color:"var(--muted)",padding:0,lineHeight:1}}>✕</button>
            </div>
            <div style={{flex:1,overflowY:"auto",scrollbarWidth:"none",paddingBottom:4}}>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",color:"var(--teal)",marginBottom:10}}>Tests from your doctor</div>
              <TestOrdersSection onViewDetail={order=>setTestOrderDetail(order)} reloadKey={testOrdersReload}/>
              <div className="lab-divider" style={{margin:"16px 0 4px"}}>
                <div className="lab-divider-line"/><div className="lab-divider-text">lab values</div><div className="lab-divider-line"/>
              </div>
              <LabsEditor editData={labsEditData} setEditData={setLabsEditData} hideTitle/>
            </div>
            <div style={{padding:"14px 0 20px",flexShrink:0}}>
              <button onClick={saveLabsEdit} disabled={labsSaving}
                style={{width:"100%",padding:"13px",background:"var(--rose)",color:"#fff",border:"none",borderRadius:14,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",opacity:labsSaving?0.6:1}}>
                {labsSaving?"Saving…":"Save ✓"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TEST REPORT SHEET ── */}
      {testOrderDetail && (
        <TestReportSheet
          order={testOrderDetail}
          onClose={() => setTestOrderDetail(null)}
          onReportDeleted={() => {
            setTestOrderDetail(null);
            setTestOrdersReload(k => k + 1);
          }}
        />
      )}

      {/* ── PROFILE PAGE ── */}
      {profileOpen && (
        <ProfilePage
          profile={profileData}
          onClose={closeProfile}
          onProfileUpdate={setProfileData}
          weekProp={effectiveWeek ?? 8}
          onOpenMedical={() => { closeProfile(); setTimeout(() => setMainTab("library"), 400); }}
          completedTests={completedTests}
          onMarkTestComplete={markTestComplete}
          appMedHandlers={appMedHandlers}
          onRxUpload={() => withConsent(() => { closeProfile(); setTimeout(() => setRxUploadOpen(true), 400); })}
        />
      )}

      {/* ── WEEK PICKER SHEET ── */}
      <WeekPickerSheet
        open={weekPickerOpen}
        onClose={() => setWeekPickerOpen(false)}
        currentWeek={currentWeek}
        browseWeek={browseWeek}
        onSelect={(w) => {
          setBrowseWeek(w);
          setWeekPickerOpen(false);
        }}
      />

      {/* ── MED DIALOGS — at app root, outside all transforms/stacking contexts ── */}
      <MedDialogs
        pauseMed={medPauseMed}   setPauseMed={setMedPauseMed}   confirmPause={appConfirmPause}
        editMed={medEditMed}     setEditMed={setMedEditMed}     confirmEdit={appConfirmEdit}
        deleteMed={medDeleteMed} setDeleteMed={setMedDeleteMed} confirmDelete={appConfirmDelete}
      />

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

  useEffect(() => {
    // Handle Capacitor deep link callback after Google OAuth on Android
    const listener = CapApp.addListener('appUrlOpen', async ({ url }) => {
      if (url.includes('login-callback')) {
        try {
          await Browser.close();
          // PKCE flow: extract code from URL and exchange for session
          const urlObj = new URL(url);
          const code = urlObj.searchParams.get('code');
          if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) console.error('exchangeCodeForSession error:', error.message);
            // onAuthStateChange fires automatically on success
          }
        } catch (e) {
          console.error('Deep link handler error:', e);
        }
      }
    });
    return () => { listener.then(l => l.remove()); };
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
      <div style={{position:"fixed",inset:0,background:"linear-gradient(160deg,#200c18,#186068)",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <img src={matriLogo} alt="Matri" style={{width:220}}/>
      </div>
    );
  }

  if (!session) return <AuthScreen />;
  if (needsOnboard) return <OnboardingFlow user={session.user} onComplete={handleOnboardComplete} />;
  return <App profile={profile} />;
}

export default AuthGate;