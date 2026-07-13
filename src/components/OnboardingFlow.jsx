import { useState } from "react";
import { supabase } from "../supabase";

const DIET_OPTIONS = [
  { key:"veg",        emoji:"🥦", label:"Vegetarian",  sub:"No meat or fish" },
  { key:"nonveg",     emoji:"🍗", label:"Non-veg",     sub:"All foods" },
  { key:"vegan",      emoji:"🌱", label:"Vegan",       sub:"No animal products" },
  { key:"eggetarian", emoji:"🥚", label:"Eggetarian",  sub:"Veg + eggs" },
];

const STEP_META = [
  { kicker:"Your pregnancy",      em:"due date?" },
  { kicker:"Welcome to Matri",    em:"call you?" },
  { kicker:"One last thing",      em:"preference?" },
];

export default function OnboardingFlow({ user, onComplete }) {
  const [step,    setStep]    = useState(0);
  const [name,    setName]    = useState(user.user_metadata?.full_name || user.user_metadata?.name || "");
  const [dueDate, setDueDate] = useState("");
  const [weekNum, setWeekNum] = useState("");
  const [diet,    setDiet]    = useState(null);
  const [saving,  setSaving]  = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const dueDateInPast = dueDate && dueDate < today;

  const canNext = [
    !!(dueDate || weekNum) && !dueDateInPast,
    true,
    diet !== null,
  ][step];

  const computeDue = () => {
    if (dueDate) return dueDate;
    if (weekNum) {
      const d = new Date();
      d.setDate(d.getDate() + (40 - parseInt(weekNum)) * 7);
      return d.toISOString().split("T")[0];
    }
    return null;
  };

  const resolvedName = () => name.trim() || user.user_metadata?.full_name || user.user_metadata?.name || "there";

  const next = async () => {
    if (step < 2) { setStep(s => s + 1); return; }
    setSaving(true);
    const due = computeDue();
    const finalName = resolvedName();
    await supabase.from("profiles").upsert({
      id: user.id, name: finalName, due_date: due,
      diet_type: diet, onboarding_complete: true,
    });
    setSaving(false);
    onComplete({ name: finalName, due_date: due, diet_type: diet });
  };

  const skip = async () => {
    setSaving(true);
    const due = computeDue();
    const finalName = resolvedName();
    await supabase.from("profiles").upsert({
      id: user.id,
      name: finalName,
      due_date: due,
      diet_type: diet,
      onboarding_complete: true,
    });
    setSaving(false);
    onComplete({ name: finalName, due_date: due, diet_type: diet });
  };

  const inp = {
    background:"rgba(255,255,255,0.07)",
    border:"1.5px solid rgba(232,184,200,0.25)",
    color:"rgba(255,255,255,0.9)",
    borderRadius:14,
  };

  return (
    <div className="ob-screen" style={{background:"linear-gradient(160deg,#200c18 0%,#2c1428 55%,#1a3838 100%)"}}>

      {/* Decorative glows */}
      <div style={{position:"absolute",top:-60,right:-60,width:220,height:220,borderRadius:"50%",background:"radial-gradient(circle,rgba(232,184,200,0.1),transparent 70%)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:100,left:-60,width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle,rgba(24,96,104,0.18),transparent 70%)",pointerEvents:"none"}}/>

      <div className="ob-top">

        {/* Progress dots */}
        <div className="ob-dots" style={{marginBottom:36}}>
          {[0,1,2].map(i => (
            <div key={i} className={"ob-dot"+(step===i?" on":"")}
              style={step===i
                ? {background:"#e8b8a8",width:22}
                : {background:"rgba(255,255,255,0.18)"}}
            />
          ))}
        </div>

        {/* Kicker */}
        <div className="ob-step" style={{color:"rgba(232,184,200,0.6)",marginBottom:12}}>
          {STEP_META[step].kicker}
        </div>

        {/* Question */}
        {step === 0 && (
          <div className="ob-q" style={{color:"#fff",fontSize:36,marginBottom:8}}>
            When is your<br/>
            <em style={{color:"#e8b8a8"}}>due date?</em>
          </div>
        )}
        {step === 1 && (
          <div className="ob-q" style={{color:"#fff",fontSize:36,marginBottom:8}}>
            What should we<br/>
            <em style={{color:"#e8b8a8"}}>call you?</em>
          </div>
        )}
        {step === 2 && (
          <div className="ob-q" style={{color:"#fff",fontSize:36,marginBottom:8}}>
            Your food<br/>
            <em style={{color:"#e8b8a8"}}>preference?</em>
          </div>
        )}

        {/* Hint */}
        <div className="ob-hint" style={{color:"rgba(255,255,255,0.42)",marginBottom:40}}>
          {[
            "Or tell us your current week — we'll work out the rest.",
            "Pregnancy feels more personal when it feels like yours.",
            "Helps us personalise meals and nutrition tips.",
          ][step]}
        </div>

        {/* Step 0 — Due date */}
        {step === 0 && (
          <>
            <div className="ob-date-row">
              <input
                type="date"
                className="ob-date-input"
                value={dueDate}
                min={today}
                autoFocus
                onChange={e => { setDueDate(e.target.value); if (e.target.value) setWeekNum(""); }}
                style={{...inp, padding:"13px 14px", flex:1, fontSize:15, ...(dueDateInPast ? {borderColor:"rgba(232,120,120,0.6)"} : {})}}
              />
              <span className="ob-or" style={{color:"rgba(255,255,255,0.3)"}}>or</span>
              <input
                type="number"
                min={4} max={42}
                className="ob-week-input"
                placeholder="Week"
                value={weekNum}
                onChange={e => { setWeekNum(e.target.value); if (e.target.value) setDueDate(""); }}
                style={{...inp, padding:"13px 12px", width:78, textAlign:"center", fontSize:15}}
              />
            </div>
            {dueDateInPast && (
              <div style={{color:"rgba(232,120,120,0.9)", fontSize:13, marginTop:10}}>
                That date's in the past — pick your actual due date.
              </div>
            )}
          </>
        )}

        {/* Step 1 — Name */}
        {step === 1 && (
          <input
            className="ob-input"
            placeholder="Your name…"
            value={name}
            autoFocus
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && canNext && next()}
            style={{...inp, padding:"14px 16px", fontSize:22, fontFamily:"'Cormorant Garamond',serif"}}
          />
        )}

        {/* Step 2 — Diet */}
        {step === 2 && (
          <div className="ob-diet-grid">
            {DIET_OPTIONS.map(opt => (
              <button
                key={opt.key}
                className={"ob-diet-card" + (diet === opt.key ? " sel" : "")}
                onClick={() => setDiet(opt.key)}
                style={diet === opt.key
                  ? {background:"rgba(232,184,200,0.15)", borderColor:"rgba(232,184,200,0.5)", color:"#fff"}
                  : {background:"rgba(255,255,255,0.07)", borderColor:"rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.75)"}
                }
              >
                <div className="ob-diet-emoji">{opt.emoji}</div>
                <div className="ob-diet-label" style={{color:"inherit"}}>{opt.label}</div>
                <div className="ob-diet-sub" style={{color:"inherit", opacity:0.55}}>{opt.sub}</div>
              </button>
            ))}
          </div>
        )}

      </div>

      <div className="ob-bottom" style={{paddingBottom:52}}>
        <button
          className="ob-next-btn"
          disabled={!canNext || saving}
          onClick={next}
          style={{fontSize:15, letterSpacing:"0.03em"}}
        >
          {saving ? "Saving…" : step === 2 ? "Let's go →" : "Next →"}
        </button>
        {step > 0 && (
          <div
            className="ob-skip"
            onClick={skip}
            style={{color:"rgba(255,255,255,0.3)", marginTop:14}}
          >
            Skip for now
          </div>
        )}
      </div>

    </div>
  );
}
