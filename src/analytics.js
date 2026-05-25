export const analytics = {
    track: async (event, props = {}) => {
      try {
        await fetch("/api/analytics", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event,
            props,
            ts: Date.now(),
          }),
        });
      } catch (err) {
        console.error("analytics failed", err);
      }
    },
  
    symptomAsked: (symptom) =>
      analytics.track("symptom_asked", { symptom }),
  
    panelOpened: (panel) =>
      analytics.track("panel_opened", { panel }),
  
    journalCreated: (source) =>
      analytics.track("journal_created", { source }),
  
    storyOpened: (id, title, tags) =>
      analytics.track("story_opened", {
        id,
        title,
        tags,
      }),
  
    milestoneChecked: (id) =>
      analytics.track("milestone_checked", { id }),
  
    quickQuestionClicked: (question) =>
      analytics.track("quick_question_clicked", {
        question,
      }),
  
    aiChatStarted: (symptom) =>
      analytics.track("ai_chat_started", {
        symptom,
      }),
  };