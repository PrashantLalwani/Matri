export const MATRI_MOMENTS = {
    6:  { question: "A tiny heart started beating this week. Before you knew, before any scan — it was already there. What does that feel like to sit with?", pause: "Take 10 seconds with that." },
    7:  { question: "Your baby's brain is forming 100 new neurons every minute right now. What do you hope fills that mind someday?", pause: "Let yourself imagine it." },
    8:  { question: "Your baby's heart has been beating for two weeks without stopping. Through your nausea, your exhaustion, your fears — it just keeps going. What do you want them to know, right now?", pause: "Take a breath. Write anything." },
    9:  { question: "All the essential organs have begun forming. Your body is doing something extraordinary without you having to think about it. When did you last trust yourself this completely?", pause: "Sit with that for a moment." },
    10: { question: "Your baby can now move — tiny movements you can't feel yet. They're in there, responding to their world. What would you say to them if they could hear you?", pause: "They can't yet. But soon." },
    20: { question: "You're halfway. The person you were before pregnancy and the mother you're becoming — what's the biggest difference you notice?", pause: "Be honest with yourself." },
    28: { question: "Your baby can recognise sounds they've heard repeatedly. What song, what phrase, what sound do you want them to carry with them into the world?", pause: "Hum it, if you want." },
    36: { question: "Almost time. If you could whisper one thing to your baby before they arrive — just one thing — what would it be?", pause: "Write it down. They'll read it someday." },
  };
  
export const getMatriMoment = (week) =>
    MATRI_MOMENTS[week] || MATRI_MOMENTS[8];