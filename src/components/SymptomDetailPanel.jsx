import React, { useState, useRef, useEffect } from "react";

export default function SymptomDetailPanel({
    symptomKey,
    week = 8,
    COMMON_SYMPTOMS,
    analytics,
    authFetch,
  }) {
    const s = COMMON_SYMPTOMS[symptomKey];
    const [messages, setMessages] = useState([]); // {role:"user"|"assistant"|"scope", text}
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [askedQs, setAskedQs] = useState(new Set());
    const chatRef = useRef(null);
  
    const OUT_OF_SCOPE = `I'm focused on ${s?.label?.toLowerCase() || "this symptom"} right now. For other concerns, go back and tap the relevant symptom from the home screen.`;
  
    const buildSystemPrompt = () => `You are Matri, a warm and knowledgeable pregnancy companion for Indian women in Week ${week}, First Trimester.
  
  The user is asking about: ${s?.label} during pregnancy.
  
  Grounding facts you must use:
  ${s?.context || ""}
  
  Your rules:
  1. ONLY answer questions directly related to ${s?.label} during pregnancy. 
  2. If the question is about anything else, respond with exactly: "OUT_OF_SCOPE"
  3. Keep answers to 2-3 sentences maximum. Warm, honest, never alarming.
  4. Never diagnose. For severe symptoms, suggest consulting a doctor.
  5. Use Indian context where relevant (food, medicines, lifestyle).
  6. Do not repeat information already given in previous answers.
  7. Never say you are an AI or mention Claude/Anthropic.`;
  
    const ask = async (question) => {
      if (!question.trim() || loading) return;
      analytics.aiChatStarted(s.label);
      const userMsg = question.trim();
      setInput("");
      setMessages(p => [...p, { role:"user", text: userMsg }]);
      setLoading(true);
  
      // Scroll to bottom
      setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior:"smooth" }), 100);
  
      try {
        const history = messages.map(m => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.role === "scope" ? OUT_OF_SCOPE : m.text,
        }));
  
        const resp = await authFetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-5",
            max_tokens: 300,
            system: buildSystemPrompt(),
            messages: [
              ...history,
              { role: "user", content: userMsg },
            ],
          }),
        });
  
        if (!resp.ok) throw new Error(`Server error ${resp.status}`);
        const data = await resp.json();
        const text = data.content?.[0]?.text || "";
        if (!text) throw new Error("Empty response");
  
        if (text.includes("OUT_OF_SCOPE")) {
          setMessages(p => [...p, { role:"scope", text: OUT_OF_SCOPE }]);
        } else {
          setMessages(p => [...p, { role:"assistant", text }]);
        }
      } catch {
        setMessages(p => [...p, { role:"scope", text: "Something didn't go through on our end. Give it a moment and try again — we're here." }]);
      }
  
      setLoading(false);
      setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior:"smooth" }), 100);
    };
  
    if (!s) return null;
  
    const statusColor = s.status.includes("⚠️") ? "var(--amber)" :
      s.status.includes("✅") ? "var(--forest)" : "var(--muted)";
    const statusBg = s.status.includes("⚠️") ? "var(--amber-pale)" :
      s.status.includes("✅") ? "var(--forest-pale)" : "var(--cream2)";
    const statusBdr = s.status.includes("⚠️") ? "var(--amber-bdr)" :
      s.status.includes("✅") ? "var(--forest-bdr)" : "var(--bdr)";
  
    return (
      <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
        {/* Scrollable content */}
        <div ref={chatRef} style={{flex:1,overflowY:"auto",padding:"16px 16px 0",scrollbarWidth:"none"}}>
  
          {/* Topic header */}
          <div className="sdp-topic">
            <span className="sdp-topic-emoji">{s.emoji}</span>
            <div>
              <div className="sdp-topic-label">{s.label}</div>
              <span className="sdp-status" style={{color:statusColor,background:statusBg,border:`1px solid ${statusBdr}`}}>{s.status}</span>
            </div>
          </div>
  
          {/* Structured anchor cards */}
          <div className="sdp-card">
            <div className="sdp-card-lbl" style={{color:"var(--teal)"}}>What this usually means</div>
            <div className="sdp-card-txt">{s.means}</div>
          </div>
          <div className="sdp-card">
            <div className="sdp-card-lbl" style={{color:"var(--forest)"}}>Try this</div>
            <div className="sdp-card-txt">{s.tryThis}</div>
          </div>
          <div className="sdp-call-card">
            <div className="sdp-card-lbl" style={{color:"var(--rose)"}}>Call your doctor if</div>
            <div className="sdp-card-txt" style={{color:"var(--rose)"}}>{s.callIf}</div>
          </div>
  
          {/* Suggested questions */}
          {messages.length === 0 && (
            <>
              <div className="sdp-divider">Ask more about {s.label.toLowerCase()}</div>
              <div className="sdp-suggestions">
                {s.questions.filter((_,i) => !askedQs.has(i)).map((q,i) => {
                  const origIdx = s.questions.indexOf(q);
                  return (
                    <button key={origIdx} className="sdp-suggestion" onClick={() => {
                      setAskedQs(prev => new Set([...prev, origIdx]));
                      ask(q);
                    }}>
                      {q} →
                    </button>
                  );
                })}
              </div>
            </>
          )}
  
          {/* Chat thread */}
          {messages.length > 0 && (
            <div className="sdp-chat">
              {messages.map((m,i) => (
                <div key={i} className={
                  m.role === "user" ? "sdp-msg-q" :
                  m.role === "scope" ? "sdp-msg-scope" : "sdp-msg-a"
                }>{m.text}</div>
              ))}
              {loading && (
                <div className="sdp-msg-a" style={{display:"flex",alignItems:"center",gap:10}}>
                  <div className="symptom-spinner" style={{width:18,height:18,borderWidth:2}}/>
                  <span style={{fontSize:12,color:"var(--muted)",fontStyle:"italic"}}>Thinking about week {week} specifically…</span>
                </div>
              )}
            </div>
          )}
  
            {messages.length > 0 && !loading && (
              <div style={{marginTop:8,marginBottom:8}}>
                {s.questions.filter((_,i) => !askedQs.has(i)).length > 0 && (
                  <>
                    <div style={{fontSize:10,color:"var(--muted)",marginBottom:6,fontStyle:"italic"}}>More questions</div>
                    {s.questions.filter((_,i) => !askedQs.has(i)).map((q,i) => {
                      const origIdx = s.questions.indexOf(q);
                      return (
                        <button key={origIdx} className="sdp-suggestion" style={{marginBottom:6}} onClick={() => {
                          setAskedQs(prev => new Set([...prev, origIdx]));
                          ask(q);
                        }}>
                          {q} →
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            )}
  
          <div style={{height:16}}/>
        </div>
  
        {/* Input row — fixed at bottom */}
        <div style={{padding:"10px 16px",background:"var(--cream)",borderTop:"1px solid var(--bdr)"}}>
          <div className="sdp-input-row">
            <textarea className="sdp-input" rows={1} value={input}
              placeholder={`Ask anything about ${s.label.toLowerCase()}…`}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input); }}}
            />
            <button className="sdp-send" disabled={!input.trim() || loading} onClick={() => ask(input)}>
              Send
            </button>
          </div>
          <div style={{fontSize:10,color:"var(--muted)",marginTop:6,textAlign:"center",fontStyle:"italic"}}>
            Focused on {s.label.toLowerCase()} · Week {week}
          </div>
        </div>
      </div>
    );
  }