import React, { useState } from 'react';
import { analytics } from '../../analytics';
import { loadUserStories, saveUserStories } from '../../utils/storage';

export const STORIES = [
  {id:1,init:"P",name:"Priya M.",city:"Bengaluru",wk:"Wk 8 · First pregnancy",bg:"linear-gradient(135deg,#f5ddd0,#e8c5b0)",aCol:"#c05040",aBg:"#f5ddd0",ico:"🌸",title:"I thought something was wrong with me. It wasn't.",excerpt:"The nausea wasn't just morning — it was 3pm, 9pm, 2am. Nobody told me 80% of women feel exactly like I did.",tags:["Morning sickness","Family pressure"],body:"Week 8 was the hardest week for me. The nausea wasn't just morning — it was 3pm, 9pm, 2am. I couldn't stand the smell of my own kitchen.\n\nMy MIL kept pushing khichdi. Some days it helped. Most days, plain toast was all I could manage. And I felt guilty about that — like I was already failing at something I hadn't been taught how to do.\n\nNobody told me 80% of women feel exactly like I did. I spent three nights Googling 'is constant nausea normal week 8' before I believed it.\n\nYou are not alone in this. Not even a little bit."},
  {id:2,init:"A",name:"Ananya R.",city:"Mumbai",wk:"Wk 8 · Second pregnancy",bg:"linear-gradient(135deg,#d8e5f5,#c0d2ec)",aCol:"#2a4a70",aBg:"#d8e5f5",ico:"🌙",title:"The second time, I finally stopped apologising for resting.",excerpt:"With my first I kept saying yes to everything. By week 8 of my second I had one rule: if it costs energy I don't have, I say no.",tags:["Second pregnancy","Rest"],body:"With my first pregnancy I said yes to every family visit, every function, every 'just come for an hour.' I was exhausted and told myself that was normal.\n\nBy week 8 of my second, I had one rule: if it costs energy I don't have, I say no. No explanation beyond 'I need to rest.'\n\nThe guilt doesn't disappear — but it gets quieter when you stop negotiating with it.\n\nRest is not laziness. It is the work of growing a human."},
  {id:3,init:"D",name:"Divya S.",city:"Chennai",wk:"Wk 8 · IVF",bg:"linear-gradient(135deg,#d8f0e4,#bce0d0)",aCol:"#1a6060",aBg:"#d8f0e4",ico:"🌿",title:"Three IVF cycles and I'm still scared to be happy.",excerpt:"Joy and fear live together in a way nobody warned me about.",tags:["IVF","Anxiety","Hope"],body:"After three IVF cycles, week 8 felt like I should be nothing but grateful. And I am — deeply. But I'm also terrified every single day.\n\nEvery cramp makes me freeze. Every good scan makes me cry, and then I feel guilty for crying because I should just be happy.\n\nJoy and fear live together in a way nobody warned me about. Allowing both to exist doesn't mean you're ungrateful. It means you're human."},
];

export const STORY_TAG_SUGGESTIONS = [
  "Morning sickness", "Family pressure", "Second pregnancy", "Rest", "IVF",
  "Anxiety", "Hope", "Partner", "Work", "Food", "Scans", "Loneliness",
];

export function StoriesPanel() {
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
