import React, { useState, useEffect, useRef, useCallback } from 'react';
import { compressImageFile, isPhotoUrl, isPhotoCrop, photoSquare, photoAlbum, photoThumb } from '../../utils/albumUtils';
import { clampCropPos, readFileAsDataUrl } from '../../utils/imageUtils';
import { JOURNAL_STORAGE_KEY, JOURNAL_IDS_KEY, journalEntryKey, loadJournalEntries, saveJournalEntry, saveJournalEntries, MOOD_LOG_KEY } from '../../utils/storage';
import { istDate, istTime } from '../../utils/date';
import { AlbumView } from '../album/AlbumView';
import { MOODS } from '../panels/EducationPanels';
import { BABY_SIZES } from '../panels/EducationPanels';
import { ShareableStrip, FriendsCard } from '../dashboard/Widgets';
import { getWeekPrompt } from '../../constants/journalPrompts';

const CROP_ASPECTS = {
  square: { key: "square", exportW: 960, exportH: 960, label: "Memory", hint: "Square — for your timeline & polaroids" },
  album: { key: "album", exportW: 1280, exportH: 720, label: "Album", hint: "16:9 landscape — for pregnancy album pages" },
};

export function JournalCameraCapture({ facingMode, title, onCapture, onCancel }) {
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

export function JournalPhotoCrop({ src, remaining, onConfirm, onCancel }) {
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

export function JournalPanel({ entries, setEntries, initialTab, moodLog }) {
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
