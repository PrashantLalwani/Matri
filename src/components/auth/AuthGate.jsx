import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

/* ─── PREGNANT ICON ─────────────────────────────────────────────────────── */
export function PregnantIcon({ size = 20, opacity = 1 }) {
  // Clean minimal line-art style — works at small and large sizes
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{opacity, flexShrink:0}}>
      {/* Head */}
      <circle cx="12" cy="5.5" r="2.5" fill="currentColor"/>
      {/* Body */}
      <path d="M9 9.5C7.5 9.5 7 10.5 7 12V18H9.5V14C9.5 14 10 17 12.5 17C15 17 16.5 15 16.5 12.5C16.5 10.5 15 9.5 13 9.5H9Z" fill="currentColor"/>
      {/* Arm resting on bump */}
      <path d="M7 11.5C5.5 12 5 13.5 5.5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Legs */}
      <rect x="7" y="17.5" width="3" height="5" rx="1.5" fill="currentColor"/>
      <rect x="10.5" y="17.5" width="3" height="5" rx="1.5" fill="currentColor" opacity="0.7"/>
    </svg>
  );
}

/* ─── AUTH SCREEN ─────────────────────────────────────────────────────────── */
export function AuthScreen() {
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  };

  return (
    <div className="auth-screen">

      {/* Top wordmark */}
      <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:0}}>
        <div style={{width:7,height:7,borderRadius:"50%",background:"#e8b8a8"}}/>
        <span style={{fontSize:12,fontWeight:700,letterSpacing:"0.28em",textTransform:"uppercase",color:"rgba(255,255,255,0.55)"}}>matri</span>
      </div>

      {/* Centre — illustration + copy */}
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",width:"100%"}}>

        {/* Pregnant lady hero illustration */}
        <div style={{position:"relative",marginBottom:32}}>
          <div style={{position:"absolute",inset:-28,borderRadius:"50%",background:"radial-gradient(circle,rgba(232,184,168,0.15),transparent 70%)",pointerEvents:"none"}}/>
          <div style={{width:100,height:100,borderRadius:"50%",background:"linear-gradient(145deg,rgba(255,255,255,0.1),rgba(255,255,255,0.05))",border:"1.5px solid rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:50}}>
            🤰
          </div>
          <div style={{position:"absolute",top:-4,right:-4,width:22,height:22,borderRadius:"50%",background:"rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>🌸</div>
          <div style={{position:"absolute",bottom:2,left:-6,width:18,height:18,borderRadius:"50%",background:"rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10}}>✨</div>
        </div>

        <div className="auth-headline">
          Hello, <em>mama.</em><br/>We've been waiting.
        </div>
        <div className="auth-sub">
          Your pregnancy companion.<br/>Week by week. Feeling by feeling.
        </div>

        <button className="auth-google-btn" onClick={handleGoogle} disabled={loading}>
          <svg className="auth-google-icon" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? "Signing in…" : "Continue with Google"}
        </button>
      </div>

      <div className="auth-footer">
        By continuing, you agree to Matri's terms.<br/>
        Your data is private and encrypted.
      </div>
    </div>
  );
}
