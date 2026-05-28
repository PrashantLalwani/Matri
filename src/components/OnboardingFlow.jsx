import { useState } from "react";
import { supabase } from "../supabase";

const DIET_OPTIONS = [
  { key:"veg",         emoji:"🥦", label:"Vegetarian",  sub:"No meat or fish" },
  { key:"nonveg",      emoji:"🍗", label:"Non-veg",     sub:"All foods" },
  { key:"vegan",       emoji:"🌱", label:"Vegan",       sub:"No animal products" },
  { key:"eggetarian",  emoji:"🥚", label:"Eggetarian",  sub:"Veg + eggs" },
];

export default function OnboardingFlow({
  user,
  onComplete,
  css
}) {
  const [step, setStep]       = useState(0); // 0=name, 1=duedate, 2=diet
  const [name, setName]       = useState("");
  const [dueDate, setDueDate] = useState("");
  const [weekNum, setWeekNum] = useState("");
  const [diet, setDiet]       = useState(null);
  const [saving, setSaving]   = useState(false);

  const canNext = [
    name.trim().length > 0,
    dueDate || weekNum,
    diet !== null,
  ][step];

  const next = async () => {
    if (step < 2) {
      setStep(s => s + 1);
      return;
    }

    // Final step — save profile
    setSaving(true);

    let due = dueDate || null;

    // If only week number given, calculate approximate due date
    if (!due && weekNum) {
      const weeksLeft = 40 - parseInt(weekNum);
      const d = new Date();
      d.setDate(d.getDate() + weeksLeft * 7);
      due = d.toISOString().split("T")[0];
    }

    await supabase.from("profiles").upsert({
      id: user.id,
      name: name.trim(),
      due_date: due,
      diet_type: diet,
      onboarding_complete: true,
    });

    setSaving(false);

    onComplete({
      name: name.trim(),
      due_date: due,
      diet_type: diet,
    });
  };

  const skip = async () => {
    await supabase.from("profiles").upsert({
      id: user.id,
      name: name.trim() || user.user_metadata?.full_name || "there",
      onboarding_complete: true,
    });

    onComplete({
      name: name.trim() || user.user_metadata?.full_name || "there"
    });
  };

  return (
    <div className="ob-screen">
      <style>{css}</style>

      <div className="ob-top">
        {/* Progress dots */}
        <div className="ob-dots">
          {[0,1,2].map(i => (
            <div
              key={i}
              className={"ob-dot" + (step === i ? " on" : "")}
            />
          ))}
        </div>

        {step === 0 && (
          <>
            <div className="ob-kicker">
              Welcome to Matri
            </div>

            <h1 className="ob-title">
              What should we call you?
            </h1>

            <div className="ob-sub">
              Pregnancy feels more personal when it feels like yours.
            </div>

            <input
              className="ob-input"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </>
        )}

        {step === 1 && (
          <>
            <div className="ob-kicker">
              Tell us where you are
            </div>

            <h1 className="ob-title">
              When is your due date?
            </h1>

            <div className="ob-sub">
              Or tell us your current week — we'll estimate it.
            </div>

            <input
              type="date"
              className="ob-input"
              value={dueDate}
              onChange={e => {
                setDueDate(e.target.value);
                if (e.target.value) setWeekNum("");
              }}
            />

            <div className="ob-or">or</div>

            <input
              type="number"
              className="ob-input"
              placeholder="Current pregnancy week"
              value={weekNum}
              onChange={e => {
                setWeekNum(e.target.value);
                if (e.target.value) setDueDate("");
              }}
            />
          </>
        )}

        {step === 2 && (
          <>
            <div className="ob-kicker">
              One last thing
            </div>

            <h1 className="ob-title">
              Your food preference?
            </h1>

            <div className="ob-sub">
              Helps us personalise meals and nutrition tips.
            </div>

            <div className="diet-grid">
              {DIET_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  className={
                    "diet-card" +
                    (diet === opt.key ? " active" : "")
                  }
                  onClick={() => setDiet(opt.key)}
                >
                  <div className="diet-emoji">
                    {opt.emoji}
                  </div>

                  <div className="diet-label">
                    {opt.label}
                  </div>

                  <div className="diet-sub">
                    {opt.sub}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="ob-bottom">
        <button
          className="ob-skip"
          onClick={skip}
        >
          Skip
        </button>

        <button
          className="ob-next"
          disabled={!canNext || saving}
          onClick={next}
        >
          {saving
            ? "Saving..."
            : step === 2
            ? "Continue"
            : "Next"}
        </button>
      </div>
    </div>
  );
}