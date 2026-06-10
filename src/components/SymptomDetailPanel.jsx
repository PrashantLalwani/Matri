import React, { useState, useRef, useCallback } from "react";

const TILE_BG   = "rgba(255,255,255,0.07)";
const TILE_BDR  = "rgba(255,255,255,0.09)";
const BODY_TXT  = "rgba(255,255,255,0.58)";
const MUTED_TXT = "rgba(255,255,255,0.32)";
const LABEL_CLR = "rgba(232,184,200,0.6)";

export default function SymptomDetailPanel({ symptomKey, week = 8, COMMON_SYMPTOMS, analytics, authFetch }) {
  const s = COMMON_SYMPTOMS[symptomKey];
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [askedQs, setAskedQs] = useState(new Set());
  const [popover, setPopover] = useState(null); // null | "means" | "tryThis"
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [upperHeight, setUpperHeight] = useState(null); // null = CSS default (44%), else px
  const chatRef = useRef(null);
  const containerRef = useRef(null);
  const dragStartY = useRef(null);
  const dragStartH = useRef(null);

  const onDragStart = useCallback((e) => {
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragStartY.current = clientY;
    const container = containerRef.current;
    const upper = container?.querySelector("[data-upper]");
    dragStartH.current = upper ? upper.getBoundingClientRect().height : 0;
    e.preventDefault();
  }, []);

  const onDragMove = useCallback((e) => {
    if (dragStartY.current == null) return;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const delta = clientY - dragStartY.current;
    const containerH = containerRef.current?.getBoundingClientRect().height || 600;
    const newH = Math.min(Math.max(dragStartH.current + delta, 80), containerH * 0.65);
    setUpperHeight(newH);
    e.preventDefault();
  }, []);

  const onDragEnd = useCallback(() => {
    dragStartY.current = null;
    dragStartH.current = null;
  }, []);

  const openPopover = (which) => {
    setPopover(which);
    requestAnimationFrame(() => setPopoverVisible(true));
  };
  const closePopover = () => {
    setPopoverVisible(false);
    setTimeout(() => setPopover(null), 180);
  };

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
    setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior:"smooth" }), 100);

    try {
      const history = messages.map(m => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.role === "scope" ? OUT_OF_SCOPE : m.text,
      }));

      const resp = await authFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 300,
          system: buildSystemPrompt(),
          messages: [...history, { role: "user", content: userMsg }],
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

  return (
    <div ref={containerRef} style={{display:"flex",flexDirection:"column",height:"100%",background:"linear-gradient(160deg,#200c18 0%,#2c1428 60%,#1a3838 100%)",position:"relative"}}>


      {/* Upper section — outer wrapper is positioning context (no overflow clip) */}
      <div data-upper style={{flexShrink:0,position:"relative",
        ...(upperHeight != null ? {height: upperHeight, maxHeight:"none"} : {maxHeight:"44%"})}}>

        {/* Inner scroll */}
        <div style={{overflowY:"auto",padding:"12px 14px 10px",scrollbarWidth:"none",height:"100%"}}>

          {/* Alert strip — call your doctor + disclaimer combined */}
          <div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 14px 10px 12px",background:"rgba(220,80,100,0.12)",borderLeft:"3px solid var(--rose)",borderRadius:"0 10px 10px 0",marginBottom:10}}>
            <span style={{fontSize:15,flexShrink:0,marginTop:1}}>📞</span>
            <div>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",color:"#e8b8a8",marginBottom:3}}>Call your doctor if</div>
              <div style={{fontSize:12.5,color:"#e8b8a8",lineHeight:1.55,marginBottom:8}}>{s.callIf}</div>
              <div style={{height:1,background:"rgba(232,184,200,0.15)",marginBottom:8}}/>
              <div style={{fontSize:11,color:"rgba(232,184,200,0.5)",lineHeight:1.5}}>Matri's guidance is informational only and not a substitute for professional medical advice.</div>
            </div>
          </div>

          {/* Info tile — single card, two tappable columns */}
          <div style={{display:"flex",background:TILE_BG,border:`1px solid ${TILE_BDR}`,borderRadius:14,height:96,overflow:"hidden"}}>
            {[["means","💡 What this means",s.means],["tryThis","🌿 Try this",s.tryThis]].map(([key,label,text],i) => (
              <div key={key} onClick={() => openPopover(key)}
                style={{flex:1,padding:"10px 12px",display:"flex",flexDirection:"column",overflow:"hidden",cursor:"pointer",WebkitTapHighlightColor:"transparent",borderRight:i===0?`1px solid ${TILE_BDR}`:"none"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4,flexShrink:0}}>
                  <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",color:LABEL_CLR}}>{label}</div>
                  <span style={{fontSize:9,color:MUTED_TXT,lineHeight:1}}>↗</span>
                </div>
                <div style={{flex:1,overflow:"hidden",fontSize:12,color:BODY_TXT,lineHeight:1.5,maskImage:"linear-gradient(to bottom,black 55%,transparent 100%)",WebkitMaskImage:"linear-gradient(to bottom,black 55%,transparent 100%)"}}>{text}</div>
              </div>
            ))}
          </div>

        </div>{/* end inner scroll */}

        {/* Popover — sibling of inner scroll, not clipped by overflow:auto */}
        {popover && (
          <div onClick={closePopover} style={{position:"absolute",inset:0,zIndex:20}}>
            <div onClick={e => e.stopPropagation()} style={{
              position:"absolute", bottom:10, left:24, right:24,
              background:"linear-gradient(160deg,#2c1428,#1e1030)",
              border:"1px solid rgba(255,255,255,0.14)",
              borderRadius:14,
              padding:"16px 16px 14px",
              boxShadow:"0 8px 32px rgba(0,0,0,0.7)",
              opacity: popoverVisible ? 1 : 0,
              transform: popoverVisible ? "scale(1)" : "scale(0.95)",
              transformOrigin:"bottom center",
              transition:"opacity 0.18s ease, transform 0.18s cubic-bezier(0.34,1.56,0.64,1)",
            }}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",color:LABEL_CLR}}>
                  {popover === "means" ? "💡 What this means" : "🌿 Try this"}
                </div>
                <button onClick={closePopover} style={{background:"rgba(255,255,255,0.08)",border:"none",borderRadius:"50%",width:22,height:22,cursor:"pointer",color:MUTED_TXT,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>×</button>
              </div>
              <div style={{fontSize:13,color:"rgba(255,255,255,0.72)",lineHeight:1.7}}>
                {popover === "means" ? s.means : s.tryThis}
              </div>
            </div>
          </div>
        )}


      </div>

      {/* Messaging zone — fixed bottom, internal scroll + input anchored */}
      <div style={{flex:1,minHeight:0,margin:"0 12px 14px",background:"rgba(255,255,255,0.04)",border:`1px solid ${TILE_BDR}`,borderRadius:20,display:"flex",flexDirection:"column",overflow:"hidden"}}>

        {/* Drag handle */}
        <div
          onTouchStart={onDragStart} onTouchMove={onDragMove} onTouchEnd={onDragEnd}
          onMouseDown={onDragStart} onMouseMove={onDragMove} onMouseUp={onDragEnd}
          style={{flexShrink:0,display:"flex",justifyContent:"center",alignItems:"center",padding:"8px 0 4px",cursor:"ns-resize",touchAction:"none"}}>
          <div style={{width:32,height:3,borderRadius:2,background:"rgba(255,255,255,0.18)"}}/>
        </div>

        {/* Divider label */}
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"12px 14px 10px",fontSize:9,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:MUTED_TXT,flexShrink:0}}>
          <span style={{flex:1,height:1,background:TILE_BDR}}/>
          Ask more about {s.label.toLowerCase()}
          <span style={{flex:1,height:1,background:TILE_BDR}}/>
        </div>

        {/* Scrollable chat area */}
        <div ref={chatRef} style={{flex:1,minHeight:0,overflowY:"auto",padding:"0 14px 8px",scrollbarWidth:"none"}}>

          {/* Suggested questions */}
          {messages.length === 0 && (
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {s.questions.filter((_,i) => !askedQs.has(i)).map((q,i) => {
                const origIdx = s.questions.indexOf(q);
                return (
                  <button key={origIdx}
                    style={{background:TILE_BG,border:`1px solid ${TILE_BDR}`,borderRadius:100,padding:"9px 14px",fontSize:12,fontWeight:500,color:BODY_TXT,cursor:"pointer",textAlign:"left",fontFamily:"inherit",WebkitTapHighlightColor:"transparent"}}
                    onClick={() => { setAskedQs(prev => new Set([...prev, origIdx])); ask(q); }}>
                    {q} →
                  </button>
                );
              })}
            </div>
          )}

          {/* Chat thread */}
          {messages.length > 0 && (
            <div className="sdp-chat">
              {messages.map((m,i) => (
                <div key={i} className={m.role === "user" ? "sdp-msg-q" : "sdp-msg-a"}
                  style={m.role === "assistant" ? {background:TILE_BG,border:`1px solid ${TILE_BDR}`,color:BODY_TXT} :
                         m.role === "scope"     ? {background:"rgba(255,200,80,0.1)",border:"1px solid rgba(255,200,80,0.2)",color:"rgba(255,210,120,0.85)",borderRadius:14} : {}}>
                  {m.text}
                </div>
              ))}
              {loading && (
                <div style={{display:"flex",alignItems:"center",gap:10,background:TILE_BG,border:`1px solid ${TILE_BDR}`,borderRadius:"18px 18px 18px 4px",padding:"10px 14px",alignSelf:"flex-start"}}>
                  <div className="symptom-spinner" style={{width:18,height:18,borderWidth:2,borderColor:"rgba(255,255,255,0.12)",borderTopColor:"#e8b8a8"}}/>
                  <span style={{fontSize:12,color:MUTED_TXT,fontStyle:"italic"}}>Thinking about week {week} specifically…</span>
                </div>
              )}
            </div>
          )}

          {/* Follow-up questions */}
          {messages.length > 0 && !loading && s.questions.filter((_,i) => !askedQs.has(i)).length > 0 && (
            <div style={{marginTop:8}}>
              <div style={{fontSize:10,color:MUTED_TXT,marginBottom:6,fontStyle:"italic"}}>More questions</div>
              {s.questions.filter((_,i) => !askedQs.has(i)).map((q,i) => {
                const origIdx = s.questions.indexOf(q);
                return (
                  <button key={origIdx}
                    style={{display:"block",width:"100%",marginBottom:6,background:TILE_BG,border:`1px solid ${TILE_BDR}`,borderRadius:100,padding:"9px 14px",fontSize:12,fontWeight:500,color:BODY_TXT,cursor:"pointer",textAlign:"left",fontFamily:"inherit",WebkitTapHighlightColor:"transparent"}}
                    onClick={() => { setAskedQs(prev => new Set([...prev, origIdx])); ask(q); }}>
                    {q} →
                  </button>
                );
              })}
            </div>
          )}

        </div>

        {/* Input — anchored at bottom of zone */}
        <div style={{padding:"12px 14px 16px",borderTop:"1px solid rgba(255,255,255,0.12)",flexShrink:0,background:"rgba(255,255,255,0.05)"}}>
          <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
            <textarea rows={1} value={input}
              placeholder={`Ask anything about ${s.label.toLowerCase()}…`}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input); }}}
              className="sdp-chat-input"
              style={{flex:1,border:"1.5px solid rgba(255,255,255,0.55)",borderRadius:12,padding:"10px 13px",fontSize:13,fontFamily:"inherit",color:"#fff",background:"rgba(255,255,255,0.28)",outline:"none",resize:"none",lineHeight:1.5,boxShadow:"0 2px 12px rgba(0,0,0,0.3)"}}
            />
            <button disabled={!input.trim() || loading} onClick={() => ask(input)}
              style={{background:input.trim()&&!loading?"var(--rose)":"rgba(180,80,100,0.55)",border:"none",borderRadius:10,padding:"10px 16px",color:"#fff",fontSize:13,fontWeight:700,cursor:input.trim()&&!loading?"pointer":"default",fontFamily:"inherit",flexShrink:0,letterSpacing:"0.02em",boxShadow:input.trim()&&!loading?"0 4px 16px rgba(200,80,100,0.5)":"none",transition:"all 0.15s"}}>
              Send
            </button>
          </div>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:6,textAlign:"center",fontStyle:"italic"}}>
            Focused on {s.label.toLowerCase()} · Week {week}
          </div>
        </div>

      </div>

    </div>
  );
}
