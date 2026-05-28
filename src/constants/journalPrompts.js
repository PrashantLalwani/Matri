export const WEEKLY_PROMPTS = {
    6:  "You just found out. Before the world knows — what are you feeling, right now, in this moment?",
    7:  "What's the first thing you'll tell your baby about this week?",
    8:  "Week 8 is one of the hardest weeks to keep a secret. What's the biggest thing you're carrying alone?",
    9:  "The nausea is real. So is the love. What's keeping you going today?",
    10: "You're through the hardest part of the first trimester. What do you want to remember about these weeks?",
    11: "Your baby can now make facial expressions. What face do you imagine?",
    12: "Almost at the end of T1. What has surprised you most about yourself these past 12 weeks?",
    16: "You might start to feel movement soon. What will you do the first moment you feel it?",
    20: "Halfway. What are you secretly most excited about?",
    24: "Your baby can recognise your voice now. What song or phrase do you say most that they might already know?",
    28: "Third trimester begins. What feels different now compared to week 8?",
    32: "You're getting closer. What's the one thing you want your baby to know about the person carrying them?",
    36: "Almost there. Write a letter to the version of you from week 6 who had just found out.",
    40: "Today could be the day. What do you want to remember about being pregnant?",
  };

export const getWeekPrompt = (week) =>
    WEEKLY_PROMPTS[week] || `Week ${week}. What's on your mind today?`;