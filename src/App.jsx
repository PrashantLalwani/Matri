import { useState, useEffect, useRef } from "react";

/* ─── FONTS + BASE CSS ─────────────────────────────────────────────────── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Inter:wght@300;400;500;600;700&family=Dancing+Script:wght@400;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --ink:#1a1210;
  --rose:#bf5240;--rose-pale:#fdf0ec;--rose-bdr:#f0cfc8;
  --plum:#622070;--plum-pale:#f8eefb;--plum-bdr:#d8a8e8;
  --navy:#2a4a70;--navy-pale:#eaf0f8;--navy-bdr:#b5cae0;
  --amber:#8a5010;--amber-pale:#fdf3e4;--amber-bdr:#ddc080;
  --teal:#1a6060;--teal-pale:#e8f5f5;--teal-bdr:#90cccc;
  --forest:#2a4a2a;--forest-pale:#edf5ed;--forest-bdr:#a8cca8;
  --slate:#2a3850;--slate-pale:#edf0f5;--slate-bdr:#a8b8cc;
  --cream:#fdfaf5;--cream2:#f7f1ea;--muted:#937870;--bdr:#ece3da;
  --paper:#fefcf6;--paper2:#faf4e8;
}
body{background:var(--cream);}
.app{font-family:'Inter',sans-serif;background:var(--cream);min-height:100vh;max-width:430px;margin:0 auto;color:var(--ink);}

/* HERO */
.hero{position:relative;overflow:hidden;cursor:pointer;background:linear-gradient(150deg,#140e0c 0%,#2e120c 45%,#6a2418 80%,#9a4030 100%);-webkit-tap-highlight-color:transparent;display:flex;flex-direction:column;}
.hero:active{filter:brightness(0.92);}
.blob{position:absolute;border-radius:50%;filter:blur(60px);pointer-events:none;}
.hero-bg-emoji{position:absolute;font-size:240px;line-height:1;right:-30px;bottom:-30px;opacity:0.12;pointer-events:none;transform:rotate(-14deg);user-select:none;}
.hero-grad{position:absolute;inset:0;background:linear-gradient(to top,rgba(20,14,12,0.9) 0%,rgba(20,14,12,0.2) 55%,transparent 100%);pointer-events:none;}
.hero-inner{position:relative;z-index:2;padding:48px 22px 22px;}
.hero-eyebrow{display:flex;align-items:center;gap:7px;font-size:10px;font-weight:600;letter-spacing:0.26em;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:10px;}
.hero-dot{width:4px;height:4px;border-radius:50%;background:#e88060;}
.hero-week{font-family:'Lora',serif;font-size:64px;font-weight:400;line-height:0.92;color:#fff;letter-spacing:-0.025em;margin-bottom:8px;}
.hero-week em{font-style:italic;color:#f0a07a;}
.hero-tagline{font-family:'Lora',serif;font-size:15px;font-style:italic;color:rgba(255,255,255,0.5);line-height:1.5;margin-bottom:22px;}
.hero-stats{display:flex;gap:8px;flex-wrap:wrap;}
.hero-stat{display:flex;flex-direction:column;gap:2px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:10px 14px;}
.hero-stat-val{font-family:'Lora',serif;font-size:17px;color:#f0a07a;line-height:1;}
.hero-stat-lbl{font-size:10px;color:rgba(255,255,255,0.35);margin-top:2px;}
.hero-tap{position:relative;z-index:2;text-align:right;padding:4px 18px 10px;font-size:10px;color:rgba(255,255,255,0.28);font-weight:600;letter-spacing:0.05em;}
.prog-row{display:flex;align-items:center;gap:10px;padding:11px 20px 12px;background:rgba(255,255,255,0.04);border-top:1px solid rgba(255,255,255,0.06);position:relative;z-index:2;flex-shrink:0;}
.prog-lbl{font-size:10px;color:rgba(255,255,255,0.3);font-weight:500;white-space:nowrap;}
.prog-track{flex:1;height:3px;background:rgba(255,255,255,0.08);border-radius:100px;overflow:hidden;}
.prog-fill{height:100%;width:20%;background:linear-gradient(90deg,#bf5240,#e88060);border-radius:100px;}
.t1-badge{background:rgba(191,82,64,0.2);border:1px solid rgba(191,82,64,0.28);border-radius:100px;padding:3px 10px;font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#e88060;white-space:nowrap;}

/* WIDGET GRID */
.grid{padding:12px 12px 110px;display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.w{border-radius:22px;overflow:hidden;cursor:pointer;position:relative;border:1px solid var(--bdr);background:#fff;transition:transform 0.14s,box-shadow 0.14s;-webkit-tap-highlight-color:transparent;}
.w:active{transform:scale(0.97);}
.w:hover{box-shadow:0 6px 24px rgba(0,0,0,0.1);}
.w-full{grid-column:1/-1;}.w-left{grid-column:1;}.w-right{grid-column:2;}
.w-tall{min-height:220px;}.w-med{min-height:170px;}.w-sm{min-height:140px;}
.w-tap{position:absolute;bottom:13px;right:15px;font-size:10px;font-weight:500;pointer-events:none;}
.w-tap-dk{color:rgba(0,0,0,0.18);}.w-tap-lt{color:rgba(255,255,255,0.22);}
.w-lbl{font-size:9px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;display:flex;align-items:center;gap:6px;margin-bottom:8px;}
.w-lbl-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0;}
.w-bg-e{position:absolute;font-size:100px;line-height:1;opacity:0.07;pointer-events:none;bottom:-8px;right:-8px;transform:rotate(-10deg);user-select:none;}
.wt-lg{font-family:'Lora',serif;font-size:24px;font-weight:400;line-height:1.2;color:var(--ink);margin-bottom:8px;}
.wt-lg em{font-style:italic;}
.wt-md{font-family:'Lora',serif;font-size:20px;font-weight:400;line-height:1.2;color:var(--ink);margin-bottom:8px;}
.wt-md em{font-style:italic;}
.wt-sm{font-family:'Lora',serif;font-size:17px;font-weight:400;line-height:1.2;color:var(--ink);margin-bottom:6px;}
.wt-sm em{font-style:italic;}
.chip{display:inline-block;border-radius:100px;padding:3px 9px;font-size:10px;font-weight:500;margin:3px 3px 0 0;}
.win{padding:18px 18px 48px;position:relative;z-index:1;}
.win-lg{padding:20px 20px 52px;position:relative;z-index:1;}

/* WIDGET BACKGROUND COLORS — each distinctly different */
.wc-rose   {background:var(--rose-pale);   border-color:var(--rose-bdr);}
.wc-dark1  {background:linear-gradient(145deg,#1a1210,#2e1a14);border-color:#2a1410;}
.wc-plum   {background:var(--plum-pale);   border-color:var(--plum-bdr);}
.wc-dark2  {background:linear-gradient(145deg,#181830,#28285a);border-color:#181840;}
.wc-teal   {background:var(--teal-pale);   border-color:var(--teal-bdr);}
.wc-forest {background:var(--forest-pale); border-color:var(--forest-bdr);}
.wc-slate  {background:var(--slate-pale);  border-color:var(--slate-bdr);}
.wc-amber  {background:var(--amber-pale);  border-color:var(--amber-bdr);}
.wc-dark3  {background:linear-gradient(145deg,#0a2020,#183535);border-color:#0a2828;}
.wc-dark4  {background:linear-gradient(145deg,#1e1030,#342050);border-color:#200e38;}
.wc-navy   {background:var(--navy-pale);   border-color:var(--navy-bdr);}

/* PANEL / OVERLAY */
.backdrop{position:fixed;inset:0;z-index:100;background:rgba(16,10,8,0);transition:background 0.3s;pointer-events:none;}
.backdrop.open{background:rgba(16,10,8,0.78);pointer-events:all;}
.panel{position:fixed;inset:0;z-index:101;display:flex;flex-direction:column;transform:translateY(102%);transition:transform 0.38s cubic-bezier(0.3,0.72,0,1);pointer-events:none;max-width:430px;left:50%;margin-left:-215px;}
@media(max-width:430px){.panel{left:0;margin-left:0;}}
.panel.open{transform:translateY(0);pointer-events:all;}
.panel-inner{flex:1;display:flex;flex-direction:column;overflow:hidden;margin-top:52px;border-radius:28px 28px 0 0;background:var(--cream);}
.panel-head{padding:20px 20px 16px;display:flex;align-items:flex-start;justify-content:space-between;flex-shrink:0;border-bottom:1px solid var(--bdr);}
.panel-head-lbl{font-size:9px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;margin-bottom:5px;}
.panel-head-title{font-family:'Lora',serif;font-size:24px;font-weight:400;line-height:1.2;}
.panel-head-title em{font-style:italic;}
.close-btn{width:34px;height:34px;border-radius:50%;background:var(--cream2);border:none;display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;flex-shrink:0;color:var(--muted);font-family:inherit;}
.close-dk{background:rgba(255,255,255,0.1)!important;color:rgba(255,255,255,0.55)!important;}
.panel-scroll{flex:1;overflow-y:auto;padding:22px 20px 48px;scrollbar-width:none;}
.panel-scroll::-webkit-scrollbar{display:none;}

/* PANEL CONTENT ATOMS */
.p-lbl{font-size:9px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:8px;}
.p-lbl::after{content:'';flex:1;height:1px;background:var(--bdr);}
.p-card{border-radius:16px;padding:15px 16px;font-size:13px;line-height:1.65;margin-bottom:10px;}
.pc-dark {background:var(--ink);color:rgba(255,255,255,0.82);}
.pc-rose {background:var(--rose-pale);border:1px solid var(--rose-bdr);}
.pc-plum {background:var(--plum-pale);border:1px solid var(--plum-bdr);}
.pc-teal {background:var(--teal-pale);border:1px solid var(--teal-bdr);}
.pc-navy {background:var(--navy-pale);border:1px solid var(--navy-bdr);}
.pc-amber{background:var(--amber-pale);border:1px solid var(--amber-bdr);}
.pc-sage {background:var(--forest-pale);border:1px solid var(--forest-bdr);}
.pc-white{background:#fff;border:1px solid var(--bdr);}
.pc-wins {background:linear-gradient(135deg,#181830,#28285a);color:rgba(255,255,255,0.85);}
.p-fact{display:flex;gap:9px;margin-bottom:9px;font-size:13px;line-height:1.6;align-items:flex-start;}
.p-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;margin-top:6px;}
.india-chip{display:inline-flex;align-items:center;gap:5px;background:var(--amber-pale);border:1px solid var(--amber-bdr);border-radius:100px;padding:4px 11px;font-size:10px;font-weight:600;color:var(--amber);margin-bottom:10px;}
.p-story{background:var(--ink);border-radius:18px;padding:18px;margin-bottom:10px;position:relative;overflow:hidden;}
.p-story::before{content:'"';font-family:'Lora',serif;position:absolute;top:-14px;left:12px;font-size:90px;color:rgba(255,255,255,0.04);line-height:1;}
.p-story-tag{display:inline-flex;align-items:center;background:rgba(240,160,122,0.12);border:1px solid rgba(240,160,122,0.2);border-radius:100px;padding:3px 10px;font-size:9px;font-weight:700;color:#f0a07a;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:10px;}
.p-story-meta{display:flex;align-items:center;gap:8px;margin-bottom:12px;}
.p-story-av{width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-size:12px;}
.p-story-name{font-size:11px;color:rgba(255,255,255,0.35);}
.p-story-q{font-family:'Lora',serif;font-size:15px;font-style:italic;color:rgba(255,255,255,0.84);line-height:1.7;}
.p-story-foot{font-size:11px;color:rgba(255,255,255,0.22);margin-top:10px;font-style:italic;}
.em-wrap{display:flex;flex-wrap:wrap;gap:7px;}
.em-pill{background:#fff;border:1px solid var(--bdr);border-radius:100px;padding:6px 12px;font-size:12px;color:var(--ink);}
.f-row{display:flex;gap:11px;align-items:flex-start;margin-bottom:11px;}
.f-ico{font-size:22px;flex-shrink:0;margin-top:1px;}
.f-name{font-size:13px;font-weight:600;color:var(--ink);}
.f-note{font-size:11px;color:var(--muted);margin-top:2px;}
.m-row{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--bdr);}
.m-row:last-child{border-bottom:none;}
.m-name{font-size:13px;font-weight:600;}
.m-why{font-size:11px;color:var(--muted);margin-top:2px;}
.m-when{font-size:10px;font-weight:600;color:var(--navy);background:var(--navy-pale);border-radius:100px;padding:2px 9px;white-space:nowrap;flex-shrink:0;margin-top:3px;}
.doc-row{display:flex;gap:12px;align-items:flex-start;background:var(--navy-pale);border:1px solid var(--navy-bdr);border-radius:14px;padding:14px;margin-bottom:14px;}
.doc-av{width:36px;height:36px;border-radius:50%;background:var(--navy);display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;}
.doc-lbl{font-size:9px;font-weight:700;color:var(--navy);letter-spacing:0.15em;text-transform:uppercase;margin-bottom:4px;}
.doc-txt{font-size:13px;color:#1e3050;line-height:1.6;}
.cl-item{display:flex;gap:11px;align-items:flex-start;padding:11px 0;border-bottom:1px solid var(--cream2);cursor:pointer;}
.cl-item:last-child{border-bottom:none;}
.cl-ring{width:22px;height:22px;border-radius:50%;border:1.5px solid var(--bdr);flex-shrink:0;display:flex;align-items:center;justify-content:center;margin-top:1px;transition:all 0.15s;}
.cl-ring.on{background:var(--forest);border-color:var(--forest);}
.cl-txt{font-size:13px;line-height:1.55;flex:1;padding-top:2px;}
.cl-txt.on{color:var(--forest);opacity:0.55;font-weight:600;}
.cl-tag{font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;margin-top:3px;}
.shop-row{display:flex;gap:9px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none;margin:0 -20px;padding-left:20px;padding-right:20px;}
.shop-row::-webkit-scrollbar{display:none;}
.shop-tile{flex-shrink:0;width:105px;background:#fff;border:1px solid var(--bdr);border-radius:16px;padding:14px 11px;text-align:center;}
.shop-ico{font-size:24px;margin-bottom:7px;}
.shop-nm{font-size:11px;font-weight:600;color:var(--ink);margin-bottom:3px;line-height:1.3;}
.shop-wy{font-size:10px;color:var(--muted);line-height:1.4;margin-bottom:5px;}
.shop-pr{font-size:10px;font-weight:700;color:var(--rose);}
.sc{background:#fff;border:1px solid var(--bdr);border-radius:20px;overflow:hidden;margin-bottom:13px;cursor:pointer;}
.sc-img{height:120px;display:flex;align-items:center;justify-content:center;font-size:52px;}
.sc-body{padding:15px;}
.sc-av{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;flex-shrink:0;}
.sc-author{display:flex;align-items:center;gap:9px;margin-bottom:10px;}
.sc-name{font-size:12px;font-weight:600;}
.sc-meta{font-size:10px;color:var(--muted);}
.sc-wk{background:var(--rose-pale);border:1px solid var(--rose-bdr);border-radius:100px;padding:2px 9px;font-size:9px;font-weight:700;color:var(--rose);margin-left:auto;}
.sc-title{font-family:'Lora',serif;font-size:16px;font-weight:400;line-height:1.3;color:var(--ink);margin-bottom:7px;}
.sc-excerpt{font-size:12px;color:var(--muted);line-height:1.65;margin-bottom:11px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
.sc-foot{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
.sc-chip{background:var(--cream2);border:1px solid var(--bdr);border-radius:100px;padding:3px 9px;font-size:10px;color:var(--muted);}
.sc-read{background:none;border:none;font-size:12px;font-weight:600;color:var(--rose);cursor:pointer;font-family:inherit;margin-left:auto;}
.sub-box{border:1.5px dashed var(--rose-bdr);border-radius:20px;padding:22px 18px;text-align:center;background:var(--rose-pale);margin-bottom:12px;}
.sub-title{font-family:'Lora',serif;font-size:20px;color:var(--ink);margin-bottom:6px;}
.sub-sub{font-size:12px;color:var(--muted);line-height:1.65;margin-bottom:14px;}
.sub-btn{background:var(--rose);color:#fff;border:none;border-radius:100px;padding:10px 22px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;}
.sub-note{font-size:10px;color:var(--muted);margin-top:8px;line-height:1.5;}
.st-back{display:inline-flex;align-items:center;gap:6px;background:none;border:none;padding:0 0 16px;font-size:12px;font-weight:600;color:var(--plum);cursor:pointer;font-family:inherit;}
.st-back:hover{color:var(--ink);}
.st-detail{background:#fff;border:1px solid var(--bdr);border-radius:22px;overflow:hidden;margin-bottom:16px;}
.st-detail-hero{height:140px;display:flex;align-items:center;justify-content:center;font-size:56px;}
.st-detail-body{padding:18px;}
.st-detail-author{display:flex;align-items:center;gap:10px;margin-bottom:14px;}
.st-detail-title{font-family:'Lora',serif;font-size:22px;font-weight:400;line-height:1.25;color:var(--ink);margin-bottom:12px;}
.st-detail-text{font-size:14px;color:var(--ink);line-height:1.75;margin-bottom:14px;white-space:pre-wrap;}
.st-detail-tags{display:flex;flex-wrap:wrap;gap:6px;}
.st-pending{display:inline-block;background:var(--amber-pale);border:1px solid var(--amber-bdr);border-radius:100px;padding:3px 10px;font-size:9px;font-weight:700;color:var(--amber);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:12px;}
.st-form{background:#fff;border:1px solid var(--bdr);border-radius:22px;padding:18px;margin-bottom:16px;}
.st-form-lbl{font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--muted);margin-bottom:6px;}
.st-form-input,.st-form-textarea{width:100%;background:var(--cream);border:1px solid var(--bdr);border-radius:14px;padding:12px 14px;font-size:13px;font-family:inherit;color:var(--ink);line-height:1.6;outline:none;margin-bottom:14px;}
.st-form-textarea{resize:none;min-height:140px;}
.st-form-input:focus,.st-form-textarea:focus{border-color:var(--plum);}
.st-tag-pick{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;}
.st-tag-opt{border:1px solid var(--bdr);border-radius:100px;padding:5px 11px;font-size:11px;font-weight:500;color:var(--muted);background:#fff;cursor:pointer;font-family:inherit;}
.st-tag-opt.on{background:var(--plum-pale);border-color:var(--plum-bdr);color:var(--plum);}
.st-tag-add{display:flex;gap:8px;margin-bottom:14px;}
.st-tag-add .st-form-input{margin-bottom:0;flex:1;}
.st-tag-add-btn{background:var(--plum-pale);border:1px solid var(--plum-bdr);color:var(--plum);border-radius:100px;padding:8px 14px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;flex-shrink:0;}
.st-submit{width:100%;background:var(--rose);color:#fff;border:none;border-radius:100px;padding:12px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;}
.st-submit:disabled{opacity:0.4;cursor:not-allowed;}
.st-success{background:var(--forest-pale);border:1px solid var(--forest-bdr);border-radius:18px;padding:18px;text-align:center;margin-bottom:16px;}
.st-success-title{font-family:'Lora',serif;font-size:18px;color:var(--forest);margin-bottom:6px;}
.st-success-sub{font-size:12px;color:var(--muted);line-height:1.6;}
.sc-read{-webkit-tap-highlight-color:transparent;}

/* JOURNAL */
.j-tabs{display:flex;border-bottom:1px solid var(--bdr);background:#fff;flex-shrink:0;}
.j-tab{flex:1;padding:12px 8px 10px;font-size:12px;font-weight:600;color:var(--muted);cursor:pointer;border-bottom:2px solid transparent;background:none;border-top:none;border-left:none;border-right:none;font-family:inherit;text-align:center;transition:all 0.15s;}
.j-tab.on{color:var(--teal);border-bottom-color:var(--teal);}
.j-add-prompt{background:var(--teal-pale);border:1.5px dashed var(--teal-bdr);border-radius:20px;padding:18px;margin-bottom:16px;}
.j-prompt-top{display:flex;align-items:center;gap:10px;margin-bottom:12px;}
.j-prompt-week{background:var(--teal);color:#fff;border-radius:100px;padding:4px 12px;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;}
.j-prompt-date{font-size:11px;color:var(--muted);}
.j-textarea{width:100%;background:#fff;border:1px solid var(--bdr);border-radius:14px;padding:13px 14px;font-size:13px;font-family:inherit;color:var(--ink);line-height:1.6;resize:none;outline:none;min-height:80px;transition:border-color 0.15s;}
.j-textarea:focus{border-color:var(--teal);}
.j-textarea::placeholder{color:var(--muted);font-style:italic;}
.j-photo-row{display:flex;gap:8px;margin-top:12px;overflow-x:auto;scrollbar-width:none;padding-bottom:4px;}
.j-photo-row::-webkit-scrollbar{display:none;}
.j-photo-add{width:68px;height:68px;border-radius:14px;border:1.5px dashed var(--teal-bdr);background:rgba(26,96,96,0.05);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;gap:3px;}
.j-photo-add-icon{font-size:20px;}
.j-photo-add-lbl{font-size:9px;font-weight:600;color:var(--teal);letter-spacing:0.1em;text-transform:uppercase;}
.j-save-row{display:flex;justify-content:space-between;align-items:center;margin-top:12px;}
.j-mood-row{display:flex;gap:6px;}
.j-mood{font-size:18px;cursor:pointer;opacity:0.5;transition:all 0.15s;}
.j-mood.on,.j-mood:hover{opacity:1;transform:scale(1.2);}
.j-save-btn{background:var(--teal);color:#fff;border:none;border-radius:100px;padding:9px 20px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;}
.j-entry{background:#fff;border:1px solid var(--bdr);border-radius:18px;margin-bottom:10px;overflow:hidden;}
.j-entry-head{padding:12px 14px;display:flex;align-items:center;gap:9px;border-bottom:1px solid var(--cream2);}
.j-entry-wk{background:var(--teal-pale);border:1px solid var(--teal-bdr);border-radius:100px;padding:2px 9px;font-size:9px;font-weight:700;color:var(--teal);text-transform:uppercase;letter-spacing:0.1em;}
.j-entry-date{font-size:11px;color:var(--muted);}
.j-entry-mood{margin-left:auto;font-size:16px;}
.j-entry-body{padding:12px 14px;}
.j-entry-text{font-size:13px;color:var(--ink);line-height:1.65;margin-bottom:8px;font-style:italic;}
.j-entry-photos{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;}
.j-entry-photos::-webkit-scrollbar{display:none;}
.j-entry-photo{width:72px;height:72px;border-radius:12px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:28px;border:1px solid var(--bdr);background:var(--cream2);overflow:hidden;}
.j-entry-photo img{width:100%;height:100%;object-fit:cover;display:block;}
.j-entry-foot{margin-top:10px;padding-top:10px;border-top:1px solid var(--cream2);}
.j-entry-del{background:none;border:none;padding:0;font-size:11px;font-weight:600;color:var(--muted);cursor:pointer;font-family:inherit;text-decoration:underline;text-underline-offset:3px;}
.j-entry-del:hover{color:var(--rose);}
.j-entry-confirm{display:flex;flex-direction:column;gap:8px;}
.j-entry-confirm-msg{font-size:12px;color:var(--ink);line-height:1.4;}
.j-entry-confirm-btns{display:flex;gap:8px;}
.j-entry-confirm-no,.j-entry-confirm-yes{flex:1;border-radius:100px;padding:8px 12px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;border:1px solid var(--bdr);}
.j-entry-confirm-no{background:#fff;color:var(--muted);}
.j-entry-confirm-yes{background:var(--rose-pale);border-color:var(--rose-bdr);color:var(--rose);}
.j-crop-screen{position:absolute;inset:0;z-index:80;background:var(--cream);display:flex;flex-direction:column;padding:16px 18px 22px;overflow:hidden;}
.j-crop-title{font-family:'Lora',serif;font-size:18px;color:var(--ink);margin-bottom:4px;}
.j-crop-sub{font-size:12px;color:var(--muted);margin-bottom:14px;line-height:1.5;}
.j-crop-aspects{display:flex;gap:8px;margin-bottom:12px;}
.j-crop-aspect{flex:1;padding:9px 8px;border-radius:100px;border:1px solid var(--bdr);background:#fff;font-size:11px;font-weight:600;color:var(--muted);cursor:pointer;font-family:inherit;text-align:center;}
.j-crop-aspect.on{background:var(--teal-pale);border-color:var(--teal-bdr);color:var(--teal);}
.j-crop-aspect.done.on::after{content:' ✓';}
.j-crop-viewport{width:100%;max-width:320px;margin:0 auto 12px;border-radius:16px;overflow:hidden;position:relative;background:#1a1210;touch-action:none;cursor:grab;flex-shrink:0;}
.j-crop-viewport.square{aspect-ratio:1;}
.j-crop-viewport.album{aspect-ratio:16/9;}
.j-crop-hint{font-size:11px;color:var(--teal);margin-bottom:10px;font-weight:500;}
.j-camera-screen{position:absolute;inset:0;z-index:85;background:#0c0c0c;display:flex;flex-direction:column;padding:16px 18px 22px;}
.j-camera-title{font-family:'Lora',serif;font-size:18px;color:#fff;margin-bottom:4px;}
.j-camera-sub{font-size:12px;color:rgba(255,255,255,0.45);margin-bottom:12px;}
.j-camera-video-wrap{flex:1;display:flex;align-items:center;justify-content:center;min-height:0;margin-bottom:14px;}
.j-camera-video{width:100%;max-height:100%;border-radius:16px;object-fit:cover;background:#000;}
.j-camera-actions{display:flex;gap:10px;}
.j-camera-cancel,.j-camera-shutter{flex:1;border-radius:100px;padding:12px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;border:none;}
.j-camera-cancel{background:rgba(255,255,255,0.12);color:rgba(255,255,255,0.7);}
.j-camera-shutter{background:var(--teal);color:#fff;}
.j-crop-viewport:active{cursor:grabbing;}
.j-crop-viewport img{position:absolute;top:0;left:0;pointer-events:none;user-select:none;max-width:none;}
.j-crop-frame{position:absolute;inset:0;pointer-events:none;border:2px solid rgba(255,255,255,0.85);border-radius:16px;box-shadow:0 0 0 999px rgba(0,0,0,0.45);}
.j-crop-zoom-lbl{font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--muted);margin-bottom:6px;}
.j-crop-zoom{width:100%;margin-bottom:16px;accent-color:var(--teal);}
.j-crop-actions{display:flex;gap:10px;margin-top:auto;}
.j-crop-cancel,.j-crop-save{flex:1;border-radius:100px;padding:12px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;border:1px solid var(--bdr);}
.j-crop-cancel{background:#fff;color:var(--muted);}
.j-crop-save{background:var(--teal);color:#fff;border-color:var(--teal);}

/* ALBUM TRIGGER BUTTON */
.album-btn{width:100%;background:linear-gradient(135deg,#0a2020,#183535);color:#fff;border:none;border-radius:16px;padding:14px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:16px;}

/* ALBUM FULL-SCREEN */
.album-screen{position:absolute;inset:0;z-index:200;background:#0c0c0c;display:flex;flex-direction:column;transform:translateY(102%);transition:transform 0.36s cubic-bezier(0.3,0.72,0,1);}
.album-screen.open{transform:translateY(0);}
.album-bar{padding:18px 20px 10px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
.album-bar-left{display:flex;flex-direction:column;}
.album-bar-title{font-family:'Dancing Script',cursive;font-size:26px;color:#fff;font-weight:600;line-height:1.1;}
.album-bar-sub{font-size:10px;color:rgba(255,255,255,0.28);letter-spacing:0.1em;text-transform:uppercase;margin-top:2px;}
.album-bar-right{display:flex;align-items:center;gap:8px;}
.album-print{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:100px;padding:7px 14px;font-size:11px;font-weight:600;color:rgba(255,255,255,0.6);cursor:pointer;font-family:inherit;}
.album-x{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,0.1);border:none;color:rgba(255,255,255,0.6);font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:inherit;}
.album-pg-label{text-align:center;font-size:10px;color:rgba(255,255,255,0.2);letter-spacing:0.1em;text-transform:uppercase;flex-shrink:0;padding-bottom:6px;}

/* THE BOOK PAGE */
.book{flex:1;overflow:hidden;display:flex;align-items:stretch;padding:0 14px 4px;}
.page{background:var(--paper);border-radius:14px;overflow:hidden;box-shadow:0 6px 40px rgba(0,0,0,0.55);display:flex;flex-direction:column;flex:1;position:relative;}
/* spine shadow */
.page::before{content:'';position:absolute;left:0;top:0;bottom:0;width:14px;background:linear-gradient(to right,rgba(0,0,0,0.08),transparent);z-index:3;pointer-events:none;}

/* PAGE TYPES */

/* ── COVER ── */
.pg-cover{background:linear-gradient(160deg,#3a1a14,#6a2a20 45%,#9a4030 80%,#c06040 100%);}
.pg-cover-dots{position:absolute;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,0.04) 1px,transparent 1px);background-size:20px 20px;pointer-events:none;}
.pg-cover-photo{width:100%;height:250px;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.pg-cover-photo-emoji{font-size:130px;opacity:0.5;position:relative;z-index:1;}
.pg-cover-photo-overlay{position:absolute;inset:0;background:linear-gradient(160deg,rgba(120,40,20,0.3),rgba(50,15,5,0.55));}
.pg-cover-photo-fade{position:absolute;bottom:0;left:0;right:0;height:130px;background:linear-gradient(to top,#3a1a14,transparent);}
.pg-cover-body{padding:16px 22px 24px;position:relative;z-index:2;flex:1;display:flex;flex-direction:column;}
.pg-cover-series{font-size:9px;font-weight:600;letter-spacing:0.3em;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:8px;}
.pg-cover-title{font-family:'Dancing Script',cursive;font-size:36px;font-weight:700;color:#fff;line-height:1;margin-bottom:4px;}
.pg-cover-name{font-family:'Dancing Script',cursive;font-size:21px;color:rgba(255,255,255,0.55);margin-bottom:14px;}
.pg-cover-chips{display:flex;gap:6px;flex-wrap:wrap;}
.pg-cover-chip{background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);border-radius:100px;padding:4px 12px;font-size:10px;color:rgba(255,255,255,0.6);}
.pg-cover-tagline{font-family:'Lora',serif;font-size:12px;font-style:italic;color:rgba(255,255,255,0.32);margin-top:auto;line-height:1.65;}

/* ── CHAPTER ── */
.pg-chapter-top{height:190px;position:relative;overflow:hidden;display:flex;align-items:flex-end;padding:0 22px 20px;flex-shrink:0;}
.pg-chapter-photo{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:90px;opacity:0.25;}
.pg-chapter-body{padding:18px 22px 22px;flex:1;}
.pg-chapter-num{font-size:9px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;margin-bottom:5px;}
.pg-chapter-title{font-family:'Dancing Script',cursive;font-size:32px;font-weight:600;}
.pg-chapter-desc{font-family:'Lora',serif;font-size:13px;font-style:italic;line-height:1.75;color:var(--muted);margin-bottom:10px;margin-top:10px;}
.pg-chapter-meta{font-size:11px;color:var(--muted);}

/* ── WEEK HEADER ── */
.pg-wk-photo{height:200px;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.pg-wk-photo-fade{position:absolute;bottom:0;left:0;right:0;height:90px;}
.pg-wk-body{padding:16px 22px 20px;flex:1;}
.pg-wk-num{font-family:'Dancing Script',cursive;font-size:60px;font-weight:600;line-height:0.9;margin-bottom:4px;}
.pg-wk-label{font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:10px;}
.pg-wk-divider{height:1px;background:var(--cream2);margin-bottom:12px;}
.pg-wk-baby{display:flex;align-items:center;gap:12px;background:var(--paper2);border-radius:12px;padding:12px;margin-bottom:10px;}
.pg-wk-baby-emoji{font-size:34px;}
.pg-wk-baby-size{font-family:'Lora',serif;font-size:16px;color:var(--ink);}
.pg-wk-baby-size em{font-style:italic;color:var(--rose);}
.pg-wk-baby-fact{font-size:11px;color:var(--muted);line-height:1.5;margin-top:2px;}
.pg-wk-date{font-family:'Lora',serif;font-size:13px;font-style:italic;color:var(--muted);}
.pg-wk-mood{display:flex;align-items:center;gap:8px;margin-top:6px;font-size:11px;color:var(--muted);}

/* ── ENTRY — PHOTO FIRST ── */
.pg-entry{display:flex;flex-direction:column;}

/* big hero photo — takes most of the page */
.pg-entry-hero{height:230px;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.pg-entry-hero-inner{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;}
.pg-entry-hero-emoji{font-size:130px;opacity:0.52;}
.pg-entry-hero-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.pg-entry-hero-fade{position:absolute;bottom:0;left:0;right:0;height:110px;}
.pg-entry-hero-wk{position:absolute;top:14px;left:16px;background:rgba(255,255,255,0.85);border-radius:100px;padding:3px 11px;font-size:9px;font-weight:700;color:var(--rose);letter-spacing:0.1em;text-transform:uppercase;}
.pg-entry-hero-mood{position:absolute;top:12px;right:16px;font-size:28px;}

/* small photo strip — polaroids */
.pg-entry-photos{display:flex;gap:8px;padding:10px 18px 4px;flex-shrink:0;}
.pg-entry-polaroid{flex:1;max-width:90px;background:#fff;padding:5px 5px 14px;border-radius:4px;box-shadow:2px 3px 10px rgba(0,0,0,0.14);position:relative;display:flex;align-items:center;justify-content:center;aspect-ratio:1;font-size:32px;overflow:hidden;}
.pg-entry-polaroid img{width:100%;height:100%;object-fit:cover;display:block;}
.pg-entry-polaroid:nth-child(odd){transform:rotate(-1.5deg);}
.pg-entry-polaroid:nth-child(even){transform:rotate(1.2deg);}
.pg-polaroid-tape{position:absolute;top:-5px;left:50%;transform:translateX(-50%) rotate(-1.5deg);width:34px;height:12px;background:rgba(255,220,155,0.65);border-radius:2px;}

/* minimal text area */
.pg-entry-content{padding:10px 18px 14px;flex:1;display:flex;flex-direction:column;}
.pg-entry-date{font-family:'Dancing Script',cursive;font-size:18px;color:var(--muted);margin-bottom:5px;}
.pg-entry-text{font-family:'Lora',serif;font-size:12.5px;font-style:italic;color:var(--ink);line-height:1.75;flex:1;padding-left:11px;border-left:2px solid var(--rose-bdr);}
.pg-entry-footer{display:flex;justify-content:space-between;border-top:1px solid var(--cream2);padding-top:8px;margin-top:8px;}
.pg-entry-footer-wk{font-size:10px;color:var(--muted);font-style:italic;}
.pg-entry-footer-pg{font-size:10px;color:rgba(26,18,16,0.18);font-style:italic;}

/* ── CLOSING ── */
.pg-closing{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:36px 28px;text-align:center;background:linear-gradient(160deg,var(--paper2),var(--paper));flex:1;}
.pg-closing-icon{font-size:54px;margin-bottom:18px;opacity:0.7;}
.pg-closing-title{font-family:'Dancing Script',cursive;font-size:32px;font-weight:600;color:var(--rose);margin-bottom:12px;line-height:1.2;}
.pg-closing-body{font-family:'Lora',serif;font-size:13px;font-style:italic;color:var(--muted);line-height:1.85;margin-bottom:18px;}
.pg-closing-div{width:50px;height:1px;background:var(--cream2);margin:0 auto 14px;}
.pg-closing-cta{font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:var(--rose);}
.pg-closing-cont{font-size:12px;color:var(--muted);margin-top:6px;line-height:1.6;font-style:italic;}
.pg-closing-dots{display:flex;gap:5px;justify-content:center;margin-top:14px;}
.pg-closing-dot{width:5px;height:5px;border-radius:50%;background:var(--cream2);}

/* ALBUM NAV */
.album-nav{display:flex;align-items:center;justify-content:space-between;padding:8px 20px 20px;flex-shrink:0;}
.anav-btn{width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.08);border:none;color:rgba(255,255,255,0.55);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.15s;}
.anav-btn:hover{background:rgba(255,255,255,0.14);}
.anav-btn:disabled{opacity:0.18;cursor:default;}
.anav-btn.next{background:rgba(255,255,255,0.16);color:#fff;}
.anav-center{text-align:center;}
.anav-dots{display:flex;gap:4px;justify-content:center;margin-bottom:4px;}
.anav-dot{height:4px;border-radius:100px;cursor:pointer;transition:all 0.2s;}
.anav-total{font-size:10px;color:rgba(255,255,255,0.28);}

/* PRINT MODAL */
.print-back{position:absolute;inset:0;z-index:300;background:rgba(0,0,0,0.65);display:flex;align-items:flex-end;}
.print-sheet{background:#fff;border-radius:28px 28px 0 0;padding:26px 22px 32px;width:100%;}
.print-title{font-family:'Dancing Script',cursive;font-size:26px;color:var(--ink);margin-bottom:6px;text-align:center;}
.print-sub{font-size:13px;color:var(--muted);text-align:center;margin-bottom:18px;line-height:1.6;}
.print-opt{display:flex;gap:14px;align-items:center;background:var(--cream);border:1px solid var(--bdr);border-radius:16px;padding:13px 15px;margin-bottom:10px;}
.print-opt-btn{border:none;border-radius:100px;padding:8px 14px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;font-family:inherit;color:#fff;}
.print-cancel{width:100%;background:none;border:1.5px solid var(--bdr);border-radius:100px;padding:11px;font-size:13px;color:var(--muted);cursor:pointer;margin-top:8px;font-family:inherit;}

/* BOTTOM NAV */
.bnav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;background:rgba(253,250,245,0.96);backdrop-filter:blur(18px);border-top:1px solid var(--bdr);padding:10px 20px 18px;display:flex;justify-content:space-between;align-items:center;z-index:50;}
.bnav-btn{display:flex;align-items:center;gap:6px;background:none;border:1.5px solid var(--bdr);border-radius:100px;padding:9px 16px;font-size:12px;font-weight:500;color:var(--muted);cursor:pointer;font-family:inherit;transition:all 0.14s;}
.bnav-btn:hover{border-color:var(--rose);color:var(--rose);}
.bnav-btn.next{background:var(--ink);border-color:var(--ink);color:#fff;font-weight:600;}
.bnav-mid{text-align:center;}
.bnav-wk{font-family:'Lora',serif;font-size:22px;color:var(--ink);display:block;line-height:1;}
.bnav-of{font-size:10px;color:var(--muted);}

@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.hero{animation:fadeUp 0.3s ease both;}
.w:nth-child(1){animation:fadeUp 0.35s 0.05s ease both;}
.w:nth-child(2){animation:fadeUp 0.35s 0.09s ease both;}
.w:nth-child(3){animation:fadeUp 0.35s 0.13s ease both;}
.w:nth-child(4){animation:fadeUp 0.35s 0.17s ease both;}
.w:nth-child(5){animation:fadeUp 0.35s 0.21s ease both;}
.w:nth-child(6){animation:fadeUp 0.35s 0.25s ease both;}
.w:nth-child(7){animation:fadeUp 0.35s 0.29s ease both;}
.w:nth-child(8){animation:fadeUp 0.35s 0.33s ease both;}
.w:nth-child(9){animation:fadeUp 0.35s 0.37s ease both;}
.w:nth-child(10){animation:fadeUp 0.35s 0.41s ease both;}
`;

/* ─── DATA ───────────────────────────────────────────────────────────────── */
const CHECKS = [
  {id:1,text:"Book first OB/GYN appointment",pri:"Today",col:"#c04040"},
  {id:2,text:"Schedule TVS dating scan",pri:"Today",col:"#c04040"},
  {id:3,text:"Start folic acid 400mcg daily",pri:"Today",col:"#c04040"},
  {id:4,text:"Tell your partner what you need",pri:"This week",col:"#8a5010"},
  {id:5,text:"Stock nausea foods: crackers, curd, coconut water",pri:"This week",col:"#8a5010"},
  {id:6,text:"Check company maternity leave policy",pri:"Soon",col:"#3d6b4a"},
  {id:7,text:"Create a folder for all scans and reports",pri:"Soon",col:"#3d6b4a"},
];

const CHECKLIST_STORAGE_KEY = "matri-checklist-week-8";

function loadChecked() {
  try {
    const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveChecked(checked) {
  try {
    localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(checked));
  } catch { /* quota */ }
}

const STORIES = [
  {id:1,init:"P",name:"Priya M.",city:"Bengaluru",wk:"Wk 8 · First pregnancy",bg:"linear-gradient(135deg,#f5ddd0,#e8c5b0)",aCol:"#c05040",aBg:"#f5ddd0",ico:"🌸",title:"I thought something was wrong with me. It wasn't.",excerpt:"The nausea wasn't just morning — it was 3pm, 9pm, 2am. Nobody told me 80% of women feel exactly like I did.",tags:["Morning sickness","Family pressure"],body:"Week 8 was the hardest week for me. The nausea wasn't just morning — it was 3pm, 9pm, 2am. I couldn't stand the smell of my own kitchen.\n\nMy MIL kept pushing khichdi. Some days it helped. Most days, plain toast was all I could manage. And I felt guilty about that — like I was already failing at something I hadn't been taught how to do.\n\nNobody told me 80% of women feel exactly like I did. I spent three nights Googling 'is constant nausea normal week 8' before I believed it.\n\nYou are not alone in this. Not even a little bit."},
  {id:2,init:"A",name:"Ananya R.",city:"Mumbai",wk:"Wk 8 · Second pregnancy",bg:"linear-gradient(135deg,#d8e5f5,#c0d2ec)",aCol:"#2a4a70",aBg:"#d8e5f5",ico:"🌙",title:"The second time, I finally stopped apologising for resting.",excerpt:"With my first I kept saying yes to everything. By week 8 of my second I had one rule: if it costs energy I don't have, I say no.",tags:["Second pregnancy","Rest"],body:"With my first pregnancy I said yes to every family visit, every function, every 'just come for an hour.' I was exhausted and told myself that was normal.\n\nBy week 8 of my second, I had one rule: if it costs energy I don't have, I say no. No explanation beyond 'I need to rest.'\n\nThe guilt doesn't disappear — but it gets quieter when you stop negotiating with it.\n\nRest is not laziness. It is the work of growing a human."},
  {id:3,init:"D",name:"Divya S.",city:"Chennai",wk:"Wk 8 · IVF",bg:"linear-gradient(135deg,#d8f0e4,#bce0d0)",aCol:"#1a6060",aBg:"#d8f0e4",ico:"🌿",title:"Three IVF cycles and I'm still scared to be happy.",excerpt:"Joy and fear live together in a way nobody warned me about.",tags:["IVF","Anxiety","Hope"],body:"After three IVF cycles, week 8 felt like I should be nothing but grateful. And I am — deeply. But I'm also terrified every single day.\n\nEvery cramp makes me freeze. Every good scan makes me cry, and then I feel guilty for crying because I should just be happy.\n\nJoy and fear live together in a way nobody warned me about. Allowing both to exist doesn't mean you're ungrateful. It means you're human."},
];

const STORY_TAG_SUGGESTIONS = [
  "Morning sickness", "Family pressure", "Second pregnancy", "Rest", "IVF",
  "Anxiety", "Hope", "Partner", "Work", "Food", "Scans", "Loneliness",
];

const USER_STORIES_KEY = "matri-user-stories";

function loadUserStories() {
  try {
    const raw = localStorage.getItem(USER_STORIES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveUserStories(stories) {
  try {
    localStorage.setItem(USER_STORIES_KEY, JSON.stringify(stories));
  } catch { /* quota */ }
}

const MOODS = ["😊","😴","🤢","😭","😤","🥰"];

// Journal entries — with rich photo placeholder data
const JOURNAL_ENTRIES = [
  {id:1,week:6,date:"March 3, 2025",mood:"😊",
    text:"Found out today. Told only Rahul. We made chai and sat quietly together. That silence was the most beautiful thing.",
    photos:["✨","🩷"],
    heroBg:"linear-gradient(135deg,#fff7f0,#ffe8dc)",heroEmoji:"✨",heroBgColor:"#fff0e8"},
  {id:2,week:7,date:"March 10, 2025",mood:"🥰",
    text:"Heard the heartbeat for the first time. I wasn't prepared for how completely it would undo me. I cried the entire drive home.",
    photos:["💓","🌸"],
    heroBg:"linear-gradient(135deg,#fff0f4,#ffdde6)",heroEmoji:"💓",heroBgColor:"#ffeef2"},
  {id:3,week:8,date:"March 17, 2025",mood:"🤢",
    text:"Couldn't eat breakfast again. Managed half a banana and coconut water. Baby, you better be worth all this. (You already are.)",
    photos:["🫘","🌿"],
    heroBg:"linear-gradient(135deg,#edf8f4,#d8f2ea)",heroEmoji:"🫘",heroBgColor:"#e8f8f2"},
  {id:4,week:8,date:"March 19, 2025",mood:"😴",
    text:"Slept 11 hours and still woke up exhausted. Rahul made poha without asking. The smallest kindnesses feel enormous right now.",
    photos:[],
    heroBg:"linear-gradient(135deg,#f0f0f8,#e0e0f2)",heroEmoji:"🌙",heroBgColor:"#ebebf8"},
  {id:5,week:10,date:"March 31, 2025",mood:"😌",
    text:"NT scan today. Everything looks good. We saw it move — this tiny wriggle, like it knew we were watching. I keep replaying it.",
    photos:["🩺","💫"],
    heroBg:"linear-gradient(135deg,#eaf2f8,#d5e8f5)",heroEmoji:"🩺",heroBgColor:"#e4f0f8"},
];

const isPhotoUrl = (p) =>
  typeof p === "string" && (p.startsWith("blob:") || p.startsWith("data:") || p.startsWith("http"));

const isPhotoCrop = (p) => p && typeof p === "object" && (p.square || p.album);

const photoSquare = (p) => {
  if (isPhotoCrop(p)) return p.square || null;
  if (isPhotoUrl(p)) return p;
  return null;
};

const photoAlbum = (p) => {
  if (isPhotoCrop(p)) return p.album || null;
  if (isPhotoUrl(p)) return p;
  return null;
};

const photoThumb = (p) => photoSquare(p) || photoAlbum(p);

const CROP_ASPECTS = {
  square: { key: "square", exportW: 960, exportH: 960, label: "Memory", hint: "Square — for your timeline & polaroids" },
  album: { key: "album", exportW: 1280, exportH: 720, label: "Album", hint: "16:9 landscape — for pregnancy album pages" },
};

const JOURNAL_STORAGE_KEY = "matri-journal-entries";
const JOURNAL_IDS_KEY = "matri-journal-ids";
const journalEntryKey = (id) => `matri-journal-entry-${id}`;

function compressImageFile(file, maxSide = 960, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadJournalEntries() {
  try {
    const idsRaw = localStorage.getItem(JOURNAL_IDS_KEY);
    if (idsRaw) {
      const ids = JSON.parse(idsRaw);
      if (Array.isArray(ids) && ids.length) {
        const entries = ids
          .map((id) => {
            const raw = localStorage.getItem(journalEntryKey(id));
            return raw ? JSON.parse(raw) : null;
          })
          .filter(Boolean);
        if (entries.length) return entries;
      }
    }
    const legacy = localStorage.getItem(JOURNAL_STORAGE_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed) && parsed.length) {
        saveJournalEntries(parsed);
        localStorage.removeItem(JOURNAL_STORAGE_KEY);
        return parsed;
      }
    }
  } catch { /* fall through */ }
  return JOURNAL_ENTRIES;
}

function saveJournalEntry(entry) {
  const slim = {
    ...entry,
    photos: entry.photos.map((p) => {
      if (isPhotoCrop(p)) {
        const slim = { ...p };
        if (slim.square?.length > 120000) slim.square = null;
        if (slim.album?.length > 120000) slim.album = null;
        return slim.square || slim.album ? slim : null;
      }
      return isPhotoUrl(p) && p.length > 120000 ? null : p;
    }).filter(Boolean),
  };
  try {
    localStorage.setItem(journalEntryKey(entry.id), JSON.stringify(entry));
    return true;
  } catch {
    try {
      localStorage.setItem(journalEntryKey(entry.id), JSON.stringify(slim));
      return true;
    } catch {
      return false;
    }
  }
}

function saveJournalEntries(entries) {
  const ids = entries.map((e) => e.id);
  const savedIds = [];
  for (const entry of entries) {
    if (saveJournalEntry(entry)) savedIds.push(entry.id);
  }
  try {
    const prevRaw = localStorage.getItem(JOURNAL_IDS_KEY);
    const prevIds = prevRaw ? JSON.parse(prevRaw) : [];
    if (Array.isArray(prevIds)) {
      prevIds.forEach((id) => {
        if (!savedIds.includes(id)) localStorage.removeItem(journalEntryKey(id));
      });
    }
    localStorage.setItem(JOURNAL_IDS_KEY, JSON.stringify(savedIds));
  } catch { /* ids list failed */ }
  return savedIds.length;
}

const BABY_SIZES = {
  6:{emoji:"🫐",size:"Blueberry",cm:"6mm",fact:"Heart beating for the first time."},
  7:{emoji:"🫑",size:"Small pepper",cm:"1cm",fact:"Brain developing at extraordinary speed."},
  8:{emoji:"🫘",size:"Kidney bean",cm:"1.6cm",fact:"Fingers forming. Heart beats 160 bpm."},
  9:{emoji:"🍇",size:"Grape",cm:"2.3cm",fact:"All essential organs forming."},
  10:{emoji:"🍓",size:"Strawberry",cm:"3cm",fact:"Tiny movements. Unmistakably human."},
  11:{emoji:"🫒",size:"Lime",cm:"4cm",fact:"Fingers and toes fully separated."},
  12:{emoji:"🍋",size:"Lemon",cm:"5.4cm",fact:"Can open and close fists."},
};

/* ─── ALBUM PAGE BUILDER ──────────────────────────────────────────────── */
function buildAlbumPages(entries) {
  const pages = [];
  pages.push({ type:"cover", id:"cover" });
  pages.push({ type:"chapter", id:"ch1", num:1, title:"The Wait",
    subtitle:"A pregnancy story",
    bgColor:"#6a2418", bgAccent:"#9a4030",
    desc:"The weeks before you arrived. The nausea, the scans, the hope, the fear. The ordinary days that were anything but.",
    count:entries.length });
  const byWeek = entries.reduce((a,e)=>{ if(!a[e.week])a[e.week]=[]; a[e.week].push(e); return a; },{});
  let pg = 3;
  Object.entries(byWeek).sort(([a],[b])=>Number(a)-Number(b)).forEach(([week,wentries])=>{
    const baby = BABY_SIZES[week] || {emoji:"🤰",size:"Growing",cm:"",fact:"Growing beautifully."};
    pages.push({ type:"week-header", id:`wh-${week}`, week:Number(week), baby, mood:wentries[0]?.mood, date:wentries[0]?.date, pg:pg++ });
    wentries.forEach(entry => pages.push({ type:"entry", id:`e-${entry.id}`, entry, week:Number(week), pg:pg++ }));
  });
  pages.push({ type:"closing", id:"closing", count:entries.length, weeks:Object.keys(byWeek).length });
  return pages;
}

/* ─── ALBUM PAGE COMPONENTS ───────────────────────────────────────────── */
function PgCover() {
  return (
    <div className="page pg-cover">
      <div className="pg-cover-dots"/>
      <div style={{position:"absolute",width:280,height:280,borderRadius:"50%",filter:"blur(80px)",background:"rgba(255,120,80,0.18)",top:-90,right:-70,pointerEvents:"none"}}/>
      <div className="pg-cover-photo">
        <div style={{position:"absolute",inset:0,background:"linear-gradient(160deg,rgba(160,50,20,0.35),rgba(50,12,4,0.6))"}}/>
        <div className="pg-cover-photo-emoji">🌸</div>
        <div className="pg-cover-photo-fade"/>
      </div>
      <div className="pg-cover-body">
        <div className="pg-cover-series">A Matri Story · Chapter One</div>
        <div className="pg-cover-title">The Wait</div>
        <div className="pg-cover-name">Priya's Pregnancy</div>
        <div className="pg-cover-chips">
          <span className="pg-cover-chip">📅 March 2025</span>
          <span className="pg-cover-chip">🏥 Due Nov 2025</span>
          <span className="pg-cover-chip">👶 First baby</span>
        </div>
        <div className="pg-cover-tagline">"The most ordinary extraordinary thing — growing a human being."</div>
      </div>
    </div>
  );
}

function PgChapter({ data }) {
  return (
    <div className="page">
      <div className="pg-chapter-top" style={{background:`linear-gradient(160deg,${data.bgColor},${data.bgAccent})`}}>
        <div className="pg-chapter-photo">🤰</div>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.5),transparent)"}}/>
        <div style={{position:"relative",zIndex:2}}>
          <div className="pg-chapter-num" style={{color:"rgba(255,255,255,0.5)"}}>Chapter {data.num}</div>
          <div className="pg-chapter-title" style={{color:"#fff"}}>{data.title}</div>
        </div>
      </div>
      <div className="pg-chapter-body">
        <div className="pg-chapter-desc">"{data.desc}"</div>
        <div className="pg-chapter-meta">{data.count} memories · Weeks 6–40</div>
      </div>
    </div>
  );
}

function PgWeekHeader({ data }) {
  const col = data.week<=12 ? "var(--rose)" : data.week<=27 ? "var(--navy)" : "var(--teal)";
  const bg  = data.week<=12
    ? "linear-gradient(140deg,#fdf0ec,#f8ddd5)"
    : data.week<=27
    ? "linear-gradient(140deg,#eaf2f8,#d8e8f5)"
    : "linear-gradient(140deg,#e4f5f5,#c8ecec)";
  return (
    <div className="page">
      <div className="pg-wk-photo" style={{background:bg}}>
        <div style={{fontSize:90,opacity:0.55}}>{data.baby.emoji}</div>
        <div className="pg-wk-photo-fade" style={{background:`linear-gradient(to top,var(--paper),transparent)`}}/>
      </div>
      <div className="pg-wk-body">
        <div className="pg-wk-num" style={{color:col}}>{data.week}</div>
        <div className="pg-wk-label" style={{color:"var(--muted)"}}>
          Week of pregnancy · {data.week<=12?"First":data.week<=27?"Second":"Third"} Trimester
        </div>
        <div className="pg-wk-divider"/>
        <div className="pg-wk-baby">
          <div className="pg-wk-baby-emoji">{data.baby.emoji}</div>
          <div>
            <div className="pg-wk-baby-size">Size of a <em>{data.baby.size}</em> · {data.baby.cm}</div>
            <div className="pg-wk-baby-fact">{data.baby.fact}</div>
          </div>
        </div>
        {data.date && <div className="pg-wk-date">{data.date}</div>}
        {data.mood && <div className="pg-wk-mood"><span>Feeling</span><span style={{fontSize:20,marginLeft:4}}>{data.mood}</span></div>}
      </div>
    </div>
  );
}

function PgEntry({ data }) {
  const { entry, week, pg } = data;
  const heroPhoto = entry.photos.map(photoAlbum).find(Boolean);
  return (
    <div className="page pg-entry">
      {/* ── LARGE HERO PHOTO ── */}
      <div className="pg-entry-hero" style={{background:entry.heroBg}}>
        <div className="pg-entry-hero-inner">
          {heroPhoto ? (
            <img src={heroPhoto} alt="" className="pg-entry-hero-img"/>
          ) : (
            <div className="pg-entry-hero-emoji">{entry.heroEmoji || "📷"}</div>
          )}
        </div>
        <div className="pg-entry-hero-fade" style={{background:`linear-gradient(to top,var(--paper),transparent)`}}/>
        <div className="pg-entry-hero-wk">Week {week}</div>
        <div className="pg-entry-hero-mood">{entry.mood}</div>
      </div>

      {/* ── POLAROID STRIP ── */}
      {entry.photos.length > 0 && (
        <div className="pg-entry-photos">
          {entry.photos.slice(0,3).map((p,i) => (
            <div key={i} className="pg-entry-polaroid" style={{background:entry.heroBgColor||"#f8f4ee"}}>
              <div className="pg-polaroid-tape"/>
              {photoSquare(p) ? <img src={photoSquare(p)} alt=""/> : (typeof p === "string" ? p : "📷")}
            </div>
          ))}
        </div>
      )}

      {/* ── MINIMAL TEXT ── */}
      <div className="pg-entry-content">
        <div className="pg-entry-date">{entry.date}</div>
        <div className="pg-entry-text">{entry.text}</div>
        <div className="pg-entry-footer">
          <div className="pg-entry-footer-wk">Pregnancy · Week {week}</div>
          <div className="pg-entry-footer-pg">{pg}</div>
        </div>
      </div>
    </div>
  );
}

function PgClosing({ data }) {
  return (
    <div className="page pg-closing">
      <div className="pg-closing-icon">🌿</div>
      <div className="pg-closing-title">Your story so far.</div>
      <div className="pg-closing-body">
        {data.count} {data.count===1?"memory":"memories"} across {data.weeks} {data.weeks===1?"week":"weeks"}.<br/>
        Each one preserved, exactly as you felt it.
      </div>
      <div className="pg-closing-div"/>
      <div className="pg-closing-cta">The story continues</div>
      <div className="pg-closing-cont">Every week you add becomes a new page.<br/>This book is never finished — it just keeps growing.</div>
      <div className="pg-closing-dots">
        <div className="pg-closing-dot"/><div className="pg-closing-dot"/><div className="pg-closing-dot"/>
      </div>
    </div>
  );
}

/* ─── ALBUM VIEW ──────────────────────────────────────────────────────── */
function AlbumView({ entries, onClose }) {
  const [pg, setPg]       = useState(0);
  const [k,  setK]        = useState(0);
  const [print, setPrint] = useState(false);
  const pages = buildAlbumPages(entries);
  const total = pages.length;
  const page  = pages[pg];

  const go = n => { if(n>=0&&n<total){setK(x=>x+1);setPg(n);} };

  useEffect(()=>{
    const h=e=>{if(e.key==="ArrowRight")go(pg+1);if(e.key==="ArrowLeft")go(pg-1);};
    window.addEventListener("keydown",h);
    return()=>window.removeEventListener("keydown",h);
  },[pg]);

  const pgLabel = () => {
    switch(page.type){
      case "cover":       return "Cover";
      case "chapter":     return `Chapter ${page.num}`;
      case "week-header": return `Week ${page.week}`;
      case "entry":       return `Week ${page.week} · Entry`;
      case "closing":     return "The end, for now";
      default: return "";
    }
  };

  const renderPage = () => {
    switch(page.type){
      case "cover":       return <PgCover key={k}/>;
      case "chapter":     return <PgChapter key={k} data={page}/>;
      case "week-header": return <PgWeekHeader key={k} data={page}/>;
      case "entry":       return <PgEntry key={k} data={page}/>;
      case "closing":     return <PgClosing key={k} data={page}/>;
      default: return null;
    }
  };

  return (
    <>
      {/* BAR */}
      <div className="album-bar">
        <div className="album-bar-left">
          <div className="album-bar-title">Priya's Pregnancy Story</div>
          <div className="album-bar-sub">{entries.length} memories</div>
        </div>
        <div className="album-bar-right">
          <button className="album-print" onClick={()=>setPrint(true)}>📖 Print</button>
          <button className="album-x" onClick={onClose}>✕</button>
        </div>
      </div>

      {/* PAGE LABEL */}
      <div className="album-pg-label">{pgLabel()} · {pg+1}/{total}</div>

      {/* BOOK — tap left/right half to navigate */}
      <div className="book" onClick={e=>{if(e.clientX > window.innerWidth/2) go(pg+1); else go(pg-1);}}>
        {renderPage()}
      </div>

      {/* NAV */}
      <div className="album-nav">
        <button className="anav-btn" onClick={()=>go(pg-1)} disabled={pg===0}>←</button>
        <div className="anav-center">
          <div className="anav-dots">
            {pages.map((_,i)=>(
              <div key={i} className="anav-dot" onClick={()=>go(i)}
                style={{width:i===pg?16:4,background:i===pg?"var(--rose)":"rgba(255,255,255,0.2)"}}/>
            ))}
          </div>
          <div className="anav-total">{pg+1} / {total}</div>
        </div>
        <button className={`anav-btn${pg<total-1?" next":""}`} onClick={()=>go(pg+1)} disabled={pg===total-1}>→</button>
      </div>

      {/* PRINT MODAL */}
      {print && (
        <div className="print-back" onClick={()=>setPrint(false)}>
          <div className="print-sheet" onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:36,textAlign:"center",marginBottom:10}}>📖</div>
            <div className="print-title">Print your album</div>
            <div className="print-sub">Your pregnancy story, printed and bound as a beautiful keepsake book.</div>
            {[
              {ico:"📄",title:"Download PDF",sub:"Print-ready · A5 size · Print at home",col:"var(--navy)",btn:"Download"},
              {ico:"📦",title:"Order printed book",sub:"Delivered to your door · Premium print · ₹799",col:"var(--rose)",btn:"Order now"},
            ].map((o,i)=>(
              <div key={i} className="print-opt">
                <span style={{fontSize:28}}>{o.ico}</span>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:"var(--ink)",marginBottom:2}}>{o.title}</div><div style={{fontSize:11,color:"var(--muted)"}}>{o.sub}</div></div>
                <button className="print-opt-btn" style={{background:o.col}}>{o.btn}</button>
              </div>
            ))}
            <button className="print-cancel" onClick={()=>setPrint(false)}>Not now</button>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── PANEL CONTENT COMPONENTS ────────────────────────────────────────── */
function BabyPanel() {
  return <>
    <div className="p-card pc-dark" style={{display:"flex",gap:16,alignItems:"center",marginBottom:20}}>
      <div style={{width:80,height:80,borderRadius:"50%",background:"rgba(255,255,255,0.06)",border:"1.5px solid rgba(255,255,255,0.1)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <span style={{fontSize:32}}>🫘</span>
        <span style={{fontSize:13,fontWeight:600,color:"#f0a07a",marginTop:3,fontFamily:"'Lora',serif"}}>1.6cm</span>
      </div>
      <div>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.42)",fontStyle:"italic",fontFamily:"'Lora',serif",marginBottom:4}}>Kidney bean · rajma.</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.75)",lineHeight:1.6}}>Growing fast — nearly doubling in size every week. 100 new neurons every minute.</div>
      </div>
    </div>
    <div className="p-lbl" style={{color:"var(--rose)"}}>What's happening right now</div>
    {["Heart beating 150–170 bpm — nearly twice yours. Started at week 6, never paused.",
      "Fingers and toes forming — still slightly webbed, like tiny paddles.",
      "Eyelids formed and fused shut. Won't open until week 27.",
      "The tail is almost completely gone. Looks unmistakably human.",
      "Tiny spontaneous movements already happening — too small to feel yet."].map((t,i)=>(
      <div key={i} className="p-fact"><div className="p-dot" style={{background:"var(--rose)"}}/><div style={{fontSize:13,lineHeight:1.6}}>{t}</div></div>
    ))}
    <div className="p-card pc-white" style={{fontFamily:"'Lora',serif",fontSize:14,fontStyle:"italic",color:"var(--muted)",lineHeight:1.7,marginTop:8}}>
      That heart started beating at week 6 and hasn't stopped once since. Through your nausea, your exhaustion, your fears — it just keeps going.
    </div>
  </>;
}

function BodyPanel() {
  return <>
    <div className="p-story">
      <div className="p-story-tag">✦ First-hand</div>
      <div className="p-story-meta"><div className="p-story-av">👩</div><div className="p-story-name">Priya · Bengaluru · First pregnancy</div></div>
      <div className="p-story-q">Week 8 was the hardest week for me. The nausea wasn't just morning — it was 3pm, 9pm, 2am. I couldn't stand the smell of my own kitchen. My MIL kept pushing khichdi. Some days it helped. Most days, plain toast was all I could manage. And I felt guilty about that. Nobody told me the guilt was part of it too.</div>
      <div className="p-story-foot">You are not alone in this. Not even a little bit.</div>
    </div>
    <div className="india-chip" style={{marginTop:16}}>🇮🇳 The Indian pregnancy experience</div>
    <div className="p-card pc-amber" style={{marginBottom:16}}><strong>The gap between how you feel and how you look is real.</strong> You're exhausted and sick but nobody can see it yet. That isolation is one of the hardest parts of the first trimester.</div>
    <div className="p-lbl" style={{color:"var(--rose)"}}>What your body is doing</div>
    {["Nausea peaks this week — eases after week 12 for 80% of women.",
      "Breasts tender and may have grown a full size. A good bra is relief, not luxury.",
      "Fatigue unlike anything before. Your body is building a placenta from scratch.",
      "Heightened smell — biology protecting baby from toxins. It's real.",
      "Frequent urination — kidneys working 30–50% harder than usual."].map((t,i)=>(
      <div key={i} className="p-fact"><div className="p-dot" style={{background:"var(--rose)"}}/><div style={{fontSize:13,lineHeight:1.6}}>{t}</div></div>
    ))}
    <div className="p-lbl" style={{color:"var(--muted)",marginTop:20}}>What you're feeling inside</div>
    <div className="em-wrap">
      {["😰 Anxious every day","😴 Bone-tired","🤢 Constantly nauseous","😭 Randomly teary","😤 Nobody understands","🤍 Quietly excited","😕 Guilty for resting","🌀 Overwhelmed"].map(e=>(
        <div key={e} className="em-pill">{e}</div>
      ))}
    </div>
    <div style={{fontSize:12,color:"var(--muted)",marginTop:10,fontStyle:"italic",lineHeight:1.6}}>All of these can live in you simultaneously. None of them make you a bad mother.</div>
    <div className="p-lbl" style={{color:"var(--teal)",marginTop:20}}>For your partner</div>
    <div className="p-card pc-teal">
      <div style={{fontSize:12,fontWeight:700,color:"var(--teal)",marginBottom:8}}>Show this to your partner 👇</div>
      <div style={{fontSize:13,lineHeight:1.7}}><strong>What she's going through:</strong> She feels sick most of the day and is carrying enormous anxiety — all while looking completely normal.<br/><br/><strong>What actually helps:</strong> Keep ginger biscuits stocked. Take over cooking. Let her sleep without guilt. Tell her she's doing amazingly.</div>
    </div>
  </>;
}

function ThreeAmPanel() {
  return <>
    <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.65,marginBottom:18,fontStyle:"italic"}}>The searches everyone makes at 2am. You're not alone in any of these.</div>
    {[{q:"Is it normal to feel this nauseous at week 8?",a:"Yes — this is peak nausea week. It typically eases significantly after week 12. You're not sicker than others."},
      {q:"I haven't felt nauseous at all — should I be worried?",a:"No. About 20–30% of women have little to no nausea and have completely healthy pregnancies."},
      {q:"Is it safe to eat only toast and crackers for days?",a:"Yes. Surviving on bland food in the first trimester is fine. The baby takes what it needs."},
      {q:"Why do I cry for no reason?",a:"Progesterone and hCG are surging to levels your body has never experienced. Completely hormonal."},
      {q:"Can I eat paneer / curd / ghee?",a:"Yes, yes, and yes. These are excellent protein sources. The old advice to avoid dairy is not evidence-based."},
      {q:"I haven't told anyone and I feel so alone",a:"One of the hardest parts of the first trimester. Consider telling one trusted person."},
    ].map((item,i)=>(
      <div key={i} className="p-card pc-white" style={{marginBottom:10}}>
        <div style={{fontSize:13,fontWeight:600,color:"var(--ink)",marginBottom:6,display:"flex",gap:8}}><span style={{color:"var(--rose)",flexShrink:0}}>?</span>{item.q}</div>
        <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.65,paddingLeft:20}}>{item.a}</div>
      </div>
    ))}
  </>;
}

function NobodyTellsPanel() {
  return <>
    {[{ico:"😶",t:"Nobody tells you about the nausea trap",b:"Worse on empty stomach — eat tiny amounts every 90 minutes before you feel hungry."},
      {ico:"🌙",t:"Nobody tells you about 3am hunger",b:"Many women wake up ravenous at 3am. Keep something on your bedside table."},
      {ico:"💭",t:"Nobody tells you about the fear of attachment",b:"Many women hold back from getting excited. The fear of loss is real. This doesn't mean you're not bonded."},
      {ico:"👃",t:"Nobody tells you smell works differently",b:"You can smell things others can't detect. Your body's ancient protection system working as designed."},
      {ico:"😤",t:"Nobody tells you how lonely the secret is",b:"You're exhausted and sick while pretending everything is normal at family events, office meetings, everything."},
      {ico:"🤝",t:"Nobody tells you that your relationship shifts",b:"Your partner may not know how to help. The couples who do best talk about this explicitly."},
    ].map((item,i)=>(
      <div key={i} className="p-card pc-plum" style={{marginBottom:10}}>
        <div style={{fontSize:20,marginBottom:6}}>{item.ico}</div>
        <div style={{fontSize:13,fontWeight:600,color:"var(--plum)",marginBottom:5}}>{item.t}</div>
        <div style={{fontSize:13,color:"var(--ink)",lineHeight:1.65}}>{item.b}</div>
      </div>
    ))}
  </>;
}

function WinsPanel() {
  return <>
    <div className="p-card pc-wins" style={{textAlign:"center",padding:"24px 20px",marginBottom:16}}>
      <div style={{fontSize:36,marginBottom:10}}>🎉</div>
      <div style={{fontFamily:"'Lora',serif",fontSize:20,fontStyle:"italic",color:"#fff",lineHeight:1.5,marginBottom:8}}>You made it to week 8.</div>
      <div style={{fontSize:13,color:"rgba(255,255,255,0.6)",lineHeight:1.7}}>That heart has been beating for two weeks without stopping. Through your nausea, your exhaustion, your 3am fears — it just keeps going. So do you.</div>
    </div>
    <div className="p-lbl" style={{color:"var(--plum)"}}>This week's wins — however small</div>
    {["You kept something down today, even if it was just crackers",
      "You rested when your body asked you to, even if it felt lazy",
      "You got through another day of feeling terrible without anyone knowing",
      "Your baby grew actual fingers this week — you did that",
      "You are 20% through your first trimester"].map((t,i)=>(
      <div key={i} className="p-fact"><div className="p-dot" style={{background:"var(--plum)"}}/><div style={{fontSize:13,lineHeight:1.6}}>{t}</div></div>
    ))}
    <div className="p-card pc-white" style={{marginTop:8,fontFamily:"'Lora',serif",fontSize:14,fontStyle:"italic",color:"var(--muted)",lineHeight:1.7}}>
      On the hardest days: you don't have to feel good about this. You just have to get through it. That's enough.
    </div>
  </>;
}

function FoodPanel() {
  return <>
    <div className="p-card pc-sage" style={{marginBottom:16}}><strong>Keeping something down matters more than eating perfectly.</strong> Small amounts constantly beats three perfect meals. Don't let anyone make you feel guilty about surviving on crackers.</div>
    <div className="india-chip">🇮🇳 Indian kitchen guide</div>
    <div className="p-lbl" style={{color:"var(--forest)",marginTop:10}}>Your best friends right now</div>
    {[{ico:"🍚",nm:"Poha, upma, idli, dhokla",note:"Mild, easy to digest. Best eaten before getting up if possible."},
      {ico:"🥥",nm:"Coconut water",note:"Natural electrolytes, relieves nausea. 1–2 a day."},
      {ico:"🍶",nm:"Curd, chaas, lassi",note:"Probiotics. Room temperature is better than cold."},
      {ico:"🍌",nm:"Banana",note:"Potassium helps leg cramps, B6 reduces nausea. Keep on bedside table."},
      {ico:"🫚",nm:"Moong dal, khichdi",note:"Complete protein. Add ghee — it helps nutrient absorption."},
    ].map((f,i)=>(
      <div key={i} className="f-row"><div className="f-ico">{f.ico}</div><div><div className="f-name">{f.nm}</div><div className="f-note">{f.note}</div></div></div>
    ))}
    <div className="p-lbl" style={{color:"#c04040",marginTop:18}}>Avoid right now</div>
    {[{ico:"🍈",nm:"Raw / unripe papaya",note:"Known uterine stimulant. Avoid entirely."},
      {ico:"🍍",nm:"Pineapple in large amounts",note:"Bromelain can cause contractions."},
      {ico:"🥛",nm:"Unpasteurised milk",note:"Listeria risk."},
      {ico:"🥗",nm:"Street chaat, raw salads",note:"Infection risk is significantly higher now."},
      {ico:"☕",nm:"More than 1 cup coffee/tea",note:"200mg caffeine limit per day."},
    ].map((f,i)=>(
      <div key={i} className="f-row"><div className="f-ico">{f.ico}</div><div><div className="f-name">{f.nm}</div><div className="f-note">{f.note}</div></div></div>
    ))}
  </>;
}

function MedPanel() {
  return <>
    <div className="doc-row">
      <div className="doc-av">👩‍⚕️</div>
      <div><div className="doc-lbl">Doctor's note</div><div className="doc-txt">Your first dating scan (TVS) should happen between weeks 7–10. Confirms heartbeat, gestational age, rules out ectopic pregnancy. Book it today — not this week. Today.</div></div>
    </div>
    <div className="p-lbl" style={{color:"var(--navy)"}}>Tests this trimester</div>
    <div className="p-card pc-white" style={{padding:"4px 16px 8px"}}>
      {[{nm:"TVS / Dating Scan",why:"Heartbeat + gestational age",wh:"Wk 7–10"},
        {nm:"Blood Group + Rh Factor",why:"Critical if Rh negative",wh:"First visit"},
        {nm:"CBC (Blood count)",why:"Anaemia — very common in Indian women",wh:"Wk 8–10"},
        {nm:"TSH (Thyroid)",why:"Directly affects fetal brain development",wh:"Wk 8–10"},
        {nm:"Blood Sugar / HbA1c",why:"Gestational diabetes screening",wh:"Wk 8–10"},
        {nm:"NT Scan + Double Marker",why:"Chromosomal screening",wh:"Wk 11–14"},
      ].map((t,i)=>(
        <div key={i} className="m-row"><div style={{flex:1}}><div className="m-name">{t.nm}</div><div className="m-why">{t.why}</div></div><div className="m-when">{t.wh}</div></div>
      ))}
    </div>
    <div className="india-chip" style={{marginTop:16}}>🇮🇳 PMSMA Scheme</div>
    <div style={{fontSize:13,lineHeight:1.65,marginBottom:14}}>Under <strong>Pradhan Mantri Surakshit Matritva Abhiyan</strong>, free antenatal checkups on the <strong>9th of every month</strong> at government health centres.</div>
    <div className="p-card pc-rose"><strong>Call your doctor immediately if:</strong> Heavy bleeding, severe abdominal pain, fever above 100.4°F, burning urination, or anything that feels wrong.</div>
  </>;
}

function CheckPanel({ checked, toggle }) {
  return <>
    <div className="p-card pc-white" style={{padding:"4px 16px 12px",marginBottom:16}}>
      {CHECKS.map(c=>(
        <div key={c.id} className="cl-item" onClick={()=>toggle(c.id)}>
          <div className={`cl-ring${checked[c.id]?" on":""}`}>{checked[c.id]&&<span style={{color:"#fff",fontSize:10,fontWeight:700}}>✓</span>}</div>
          <div style={{flex:1}}><div className={`cl-txt${checked[c.id]?" on":""}`}>{c.text}</div><div className="cl-tag" style={{color:c.col}}>{c.pri}</div></div>
        </div>
      ))}
      <div style={{textAlign:"center",paddingTop:10,fontSize:12,color:"var(--muted)"}}>
        {Object.values(checked).filter(Boolean).length} of {CHECKS.length} done {Object.values(checked).filter(Boolean).length===CHECKS.length?"🎉":""}
      </div>
    </div>
    <div className="p-lbl" style={{color:"var(--amber)"}}>Worth buying this week</div>
    <div className="shop-row">
      {[{ico:"💊",nm:"Folic Acid + Iron",wy:"Neural development",pr:"₹120–300/mo"},
        {ico:"🩱",nm:"Supportive Bra",wy:"Non-negotiable now",pr:"₹400–800"},
        {ico:"💧",nm:"Water Bottle",wy:"3L/day — nice one helps",pr:"₹300–600"},
        {ico:"🍪",nm:"Ginger Biscuits",wy:"Best natural nausea fix",pr:"₹40–80"},
      ].map((s,i)=>(
        <div key={i} className="shop-tile"><div className="shop-ico">{s.ico}</div><div className="shop-nm">{s.nm}</div><div className="shop-wy">{s.wy}</div><div className="shop-pr">{s.pr}</div></div>
      ))}
    </div>
  </>;
}

function StoriesPanel() {
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

function clampCropPos(pos, scale, imgW, imgH, cropW, cropH) {
  const dw = imgW * scale;
  const dh = imgH * scale;
  return {
    x: Math.min(0, Math.max(cropW - dw, pos.x)),
    y: Math.min(0, Math.max(cropH - dh, pos.y)),
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function JournalCameraCapture({ facingMode, title, onCapture, onCancel }) {
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

function JournalPhotoCrop({ src, remaining, onConfirm, onCancel }) {
  const [aspect, setAspect] = useState("square");
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [savedCrops, setSavedCrops] = useState({ square: null, album: null });
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
    const square = aspect === "square" ? exportCrop("square", scale, pos, cropBox) : savedCrops.square;
    const album = aspect === "album" ? exportCrop("album", scale, pos, cropBox) : savedCrops.album;
    const crops = {
      square: square || savedCrops.square,
      album: album || savedCrops.album,
    };
    if (!crops.square || !crops.album) return;
    onConfirm(crops);
  };

  const readyBoth = Boolean(
    (aspect === "square" ? exportCrop("square", scale, pos, cropBox) : savedCrops.square) &&
    (aspect === "album" ? exportCrop("album", scale, pos, cropBox) : savedCrops.album)
  ) || (savedCrops.square && savedCrops.album);

  const minS = minScaleRef.current;
  const maxS = minS * 3;
  const preset = CROP_ASPECTS[aspect];

  return (
    <div className="j-crop-screen">
      <div className="j-crop-title">Review your photo</div>
      <div className="j-crop-sub">
        Crop for both memory and album.{remaining > 0 ? ` (${remaining} more after this)` : ""}
      </div>
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
      <div className="j-crop-actions">
        <button type="button" className="j-crop-cancel" onClick={onCancel}>Cancel</button>
        <button type="button" className="j-crop-save" onClick={confirm} disabled={!readyBoth} style={{ opacity: readyBoth ? 1 : 0.45 }}>
          Use photo
        </button>
      </div>
    </div>
  );
}

function JournalPanel({ entries, setEntries }) {
  const [tab,  setTab]    = useState("write");
  const [text, setText]   = useState("");
  const [mood, setMood]   = useState(null);
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
  const today = new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});

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
    if (!text.trim()) return;
    const photos = [...pendingPhotos];
    setEntries(p => [{id:Date.now(),week:8,date:today,mood:mood||"😊",text:text.trim(),photos,heroBg:"linear-gradient(135deg,#e8f5f5,#d0ecec)",heroEmoji:"📝",heroBgColor:"#e0f5f5"},...p]);
    setText(""); setMood(null); setPendingPhotos([]); setTab("timeline");
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
            <div style={{fontSize:12,color:"var(--muted)",marginBottom:10,fontStyle:"italic"}}>
              Today's prompt: <strong style={{color:"var(--teal)",fontStyle:"normal"}}>How are you feeling right now, honestly?</strong>
            </div>
            <textarea className="j-textarea" rows={4} value={text} onChange={e=>setText(e.target.value)}
              placeholder="Write anything... a fear, a hope, what the nausea feels like today, what you want to remember..."/>
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
            <div className="j-save-row">
              <div>
                <div style={{fontSize:10,color:"var(--muted)",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:600}}>Mood</div>
                <div className="j-mood-row">{MOODS.map(m=><span key={m} className={`j-mood${mood===m?" on":""}`} onClick={()=>setMood(m)}>{m}</span>)}</div>
              </div>
              <button className="j-save-btn" onClick={save} disabled={!text.trim()} style={{opacity:text.trim()?1:0.4}}>Save ✓</button>
            </div>
          </div>
        )}

        {tab==="timeline" && (
          <div>
            {Object.entries(grouped).map(([week,wentries])=>(
              <div key={week} style={{marginBottom:20}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color:"var(--teal)",marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
                  {week}<div style={{flex:1,height:1,background:"var(--bdr)"}}/>
                </div>
                {wentries.map(entry=>(
                  <div key={entry.id} className="j-entry">
                    <div className="j-entry-head">
                      <div className="j-entry-wk">Week {entry.week}</div>
                      <div className="j-entry-date">{entry.date}</div>
                      <div className="j-entry-mood">{entry.mood}</div>
                    </div>
                    <div className="j-entry-body">
                      <div className="j-entry-text">"{entry.text}"</div>
                      {entry.photos.length>0 && (
                        <div className="j-entry-photos">
                          {entry.photos.map((p,i)=>(
                            <div key={i} className="j-entry-photo">
                              {photoThumb(p) ? <img src={photoThumb(p)} alt=""/> : (typeof p === "string" ? p : "📷")}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="j-entry-foot">
                        {confirmId === entry.id ? (
                          <div className="j-entry-confirm">
                            <div className="j-entry-confirm-msg">Remove this memory? It will be deleted from your timeline and album.</div>
                            <div className="j-entry-confirm-btns">
                              <button type="button" className="j-entry-confirm-no" onClick={()=>setConfirmId(null)}>Cancel</button>
                              <button type="button" className="j-entry-confirm-yes" onClick={()=>deleteEntry(entry.id)}>Delete</button>
                            </div>
                          </div>
                        ) : (
                          <button type="button" className="j-entry-del" onClick={()=>setConfirmId(entry.id)}>Delete memory</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
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

/* ─── PANEL CONFIG ───────────────────────────────────────────────────── */
const PANELS = {
  baby:      { label:"Your baby",        title:<>The size of a <em>kidney bean</em></>,      headBg:"var(--ink)",        lblCol:"#f0a07a",       titleCol:"#fff",        dark:true,  Panel:BabyPanel },
  body:      { label:"Your body",        title:<>What you're feeling is <em>real</em></>,    headBg:"var(--rose-pale)",  lblCol:"var(--rose)",   titleCol:"var(--ink)",  dark:false, Panel:BodyPanel },
  "3am":     { label:"3am searches",     title:<>What everyone <em>Googles</em></>,           headBg:"#1a1210",           lblCol:"#f0a07a",       titleCol:"#fff",        dark:true,  Panel:ThreeAmPanel },
  ntty:      { label:"Nobody tells you", title:<>What nobody <em>tells you</em></>,           headBg:"var(--plum-pale)",  lblCol:"var(--plum)",   titleCol:"var(--ink)",  dark:false, Panel:NobodyTellsPanel },
  wins:      { label:"This week's win",  title:<>You made it to <em>week 8</em></>,           headBg:"#181830",           lblCol:"#b0a0f0",       titleCol:"#fff",        dark:true,  Panel:WinsPanel },
  partner:   { label:"For your partner", title:<>What she needs you to <em>know</em></>,     headBg:"var(--teal-pale)",  lblCol:"var(--teal)",   titleCol:"var(--ink)",  dark:false, Panel:BodyPanel },
  food:      { label:"Nutrition",        title:<>Food when nothing <em>appeals</em></>,      headBg:"var(--forest-pale)",lblCol:"var(--forest)", titleCol:"var(--ink)",  dark:false, Panel:FoodPanel },
  medical:   { label:"Medical",          title:<>What needs to happen <em>now</em></>,       headBg:"var(--slate-pale)", lblCol:"var(--slate)",  titleCol:"var(--ink)",  dark:false, Panel:MedPanel },
  checklist: { label:"This week",        title:<>Seven things. <em>That's it.</em></>,       headBg:"var(--amber-pale)", lblCol:"var(--amber)",  titleCol:"var(--ink)",  dark:false, Panel:null },
  journal:   { label:"Journal",          title:<>Your pregnancy <em>story</em></>,           headBg:"#0a2020",           lblCol:"#70c8b8",       titleCol:"#fff",        dark:true,  Panel:JournalPanel, noScroll:true },
  stories:   { label:"Stories",          title:<>Women who've been <em>right here</em></>,   headBg:"#1e1030",           lblCol:"#c8a0f0",       titleCol:"#fff",        dark:true,  Panel:StoriesPanel },
};

/* ─── MAIN APP ───────────────────────────────────────────────────────── */
export default function App() {
  const [active,  setActive]  = useState(null);
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState(() => loadChecked());
  const [journalEntries, setJournalEntries] = useState(() => loadJournalEntries());

  const setJournalEntriesPersist = (updater) => {
    setJournalEntries((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveJournalEntries(next);
      return next;
    });
  };

  // open/close helpers
  const open  = id => { setActive(id); requestAnimationFrame(() => setVisible(true)); };
  const close = ()  => { setVisible(false); setTimeout(() => setActive(null), 390); };
  const toggleCheck = (id) => {
    setChecked((p) => {
      const next = { ...p, [id]: !p[id] };
      saveChecked(next);
      return next;
    });
  };

  const checksDone = Object.values(checked).filter(Boolean).length;

  useEffect(()=>{
    document.body.style.overflow = active ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  },[active]);

  const pd = active ? PANELS[active] : null;

  return (
    <div className="app">
      <style>{css}</style>

      {/* ── HERO — opens baby panel ── */}
      <div className="hero" onClick={() => open("baby")}>
        <div className="blob" style={{width:260,height:260,background:"#9a3020",top:-90,right:-70,opacity:0.4}}/>
        <div className="blob" style={{width:160,height:160,background:"#c05840",bottom:30,left:-20,opacity:0.22}}/>
        <span className="hero-bg-emoji">🫘</span>
        <div className="hero-grad"/>
        <div className="hero-inner">
          <div className="hero-eyebrow"><div className="hero-dot"/>Matri · First Trimester</div>
          <div className="hero-week">Week <em>8.</em></div>
          <div className="hero-tagline">You're growing a human.<br/>Be gentler with yourself.</div>
          <div className="hero-stats">
            <div className="hero-stat"><span className="hero-stat-val">🫘 1.6cm</span><span className="hero-stat-lbl">kidney bean</span></div>
            <div className="hero-stat"><span className="hero-stat-val">~160 bpm</span><span className="hero-stat-lbl">heart rate</span></div>
            <div className="hero-stat"><span className="hero-stat-val">Wk 8/40</span><span className="hero-stat-lbl">first trimester</span></div>
          </div>
        </div>
        <div className="hero-tap">Tap to explore your baby ↗</div>
        <div className="prog-row">
          <div className="prog-lbl">Wk 8</div>
          <div className="prog-track"><div className="prog-fill"/></div>
          <div className="prog-lbl">40</div>
          <div className="t1-badge">T1</div>
        </div>
      </div>

      {/* ── WIDGET GRID ── */}
      <div className="grid">

        {/* BODY — warm rose, full, tall */}
        <div className="w w-full wc-rose w-tall" onClick={()=>open("body")}>
          <span className="w-bg-e" style={{color:"var(--rose)",fontSize:120}}>🌿</span>
          <div className="win-lg">
            <div className="w-lbl" style={{color:"var(--rose)"}}><div className="w-lbl-dot" style={{background:"var(--rose)"}}/>Your body</div>
            <div className="wt-lg">What you're feeling is <em style={{color:"var(--rose)"}}>real.</em></div>
            <div style={{fontSize:13,color:"var(--muted)",marginBottom:10,lineHeight:1.55}}>The nausea, the exhaustion, the guilt. All of it.</div>
            <div>
              <span className="chip" style={{background:"rgba(191,82,64,0.1)",color:"var(--rose)"}}>🤢 Nausea</span>
              <span className="chip" style={{background:"rgba(191,82,64,0.1)",color:"var(--rose)"}}>😴 Exhausted</span>
              <span className="chip" style={{background:"rgba(191,82,64,0.1)",color:"var(--rose)"}}>👫 Partner</span>
            </div>
          </div>
          <div className="w-tap w-tap-dk">Tap to read ↗</div>
        </div>

        {/* 3AM — dark charcoal */}
        <div className="w w-left wc-dark1 w-med" onClick={()=>open("3am")}>
          <div className="win">
            <div className="w-lbl" style={{color:"#f0a07a"}}><div className="w-lbl-dot" style={{background:"#f0a07a"}}/>3am searches</div>
            <div style={{fontFamily:"'Lora',serif",fontSize:17,color:"#fff",lineHeight:1.2,marginBottom:10}}>What everyone <em style={{fontStyle:"italic",color:"#f0a07a"}}>Googles</em></div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",lineHeight:1.6,marginBottom:4,display:"flex",gap:6}}><span style={{color:"#f0a07a",fontWeight:700}}>?</span>Is it normal to feel this sick?</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",lineHeight:1.6,marginBottom:4,display:"flex",gap:6}}><span style={{color:"#f0a07a",fontWeight:700}}>?</span>Can I eat paneer?</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",lineHeight:1.6,display:"flex",gap:6}}><span style={{color:"#f0a07a",fontWeight:700}}>?</span>Why do I cry randomly?</div>
          </div>
          <div className="w-tap w-tap-lt">Tap ↗</div>
        </div>

        {/* NOBODY TELLS YOU — soft plum */}
        <div className="w w-right wc-plum w-med" onClick={()=>open("ntty")}>
          <span className="w-bg-e" style={{color:"var(--plum)"}}>🤫</span>
          <div className="win">
            <div className="w-lbl" style={{color:"var(--plum)"}}><div className="w-lbl-dot" style={{background:"var(--plum)"}}/>Nobody tells you</div>
            <div className="wt-md">The things no one <em style={{color:"var(--plum)"}}>warns you about.</em></div>
          </div>
          <div className="w-tap w-tap-dk">Tap ↗</div>
        </div>

        {/* WINS — dark indigo */}
        <div className="w w-left wc-dark2 w-sm" onClick={()=>open("wins")}>
          <div className="win">
            <div className="w-lbl" style={{color:"#b0a0f0"}}><div className="w-lbl-dot" style={{background:"#b0a0f0"}}/>This week's win</div>
            <div style={{fontFamily:"'Lora',serif",fontSize:18,color:"#fff",lineHeight:1.2,marginBottom:6}}>You made it to <em style={{fontStyle:"italic",color:"#b0a0f0"}}>week 8.</em></div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",lineHeight:1.55}}>That heart hasn't stopped once.</div>
          </div>
          <div className="w-tap w-tap-lt">Tap ↗</div>
        </div>

        {/* PARTNER — teal */}
        <div className="w w-right wc-teal w-sm" onClick={()=>open("partner")}>
          <span className="w-bg-e" style={{color:"var(--teal)"}}>🤝</span>
          <div className="win">
            <div className="w-lbl" style={{color:"var(--teal)"}}><div className="w-lbl-dot" style={{background:"var(--teal)"}}/>For your partner</div>
            <div className="wt-sm">What she needs you to <em style={{color:"var(--teal)"}}>know.</em></div>
            <div style={{fontSize:11,color:"var(--muted)",marginTop:4}}>Share this. It helps.</div>
          </div>
          <div className="w-tap w-tap-dk">Tap ↗</div>
        </div>

        {/* FOOD — forest green */}
        <div className="w w-left wc-forest w-tall" onClick={()=>open("food")}>
          <span className="w-bg-e" style={{color:"var(--forest)"}}>🥥</span>
          <div className="win">
            <div className="w-lbl" style={{color:"var(--forest)"}}><div className="w-lbl-dot" style={{background:"var(--forest)"}}/>Nutrition</div>
            <div className="wt-md">Food when nothing <em style={{color:"var(--forest)"}}>appeals.</em></div>
            <div style={{marginTop:10}}>
              <span className="chip" style={{background:"rgba(42,74,42,0.1)",color:"var(--forest)"}}>Poha</span>
              <span className="chip" style={{background:"rgba(42,74,42,0.1)",color:"var(--forest)"}}>Curd</span>
              <span className="chip" style={{background:"rgba(42,74,42,0.1)",color:"var(--forest)"}}>Coconut water</span>
            </div>
          </div>
          <div className="w-tap w-tap-dk">Tap ↗</div>
        </div>

        {/* MEDICAL — slate blue */}
        <div className="w w-right wc-slate w-tall" onClick={()=>open("medical")}>
          <span className="w-bg-e" style={{color:"var(--slate)"}}>🩺</span>
          <div className="win">
            <div className="w-lbl" style={{color:"var(--slate)"}}><div className="w-lbl-dot" style={{background:"var(--slate)"}}/>Medical</div>
            <div className="wt-md">What needs to happen <em style={{color:"var(--slate)"}}>now.</em></div>
            <div style={{marginTop:10}}>
              {["Book TVS scan","CBC + TSH","PMSMA scheme","NT scan wk 11"].map(t=>(
                <div key={t} style={{fontSize:11,color:"var(--slate)",display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                  <div style={{width:4,height:4,borderRadius:"50%",background:"var(--slate)",flexShrink:0}}/>{t}
                </div>
              ))}
            </div>
          </div>
          <div className="w-tap w-tap-dk">Tap ↗</div>
        </div>

        {/* CHECKLIST — warm amber */}
        <div className="w w-full wc-amber" onClick={()=>open("checklist")}>
          <span className="w-bg-e" style={{color:"var(--amber)",fontSize:90}}>✅</span>
          <div className="win-lg">
            <div className="w-lbl" style={{color:"var(--amber)"}}><div className="w-lbl-dot" style={{background:"var(--amber)"}}/>This week</div>
            <div className="wt-md">7 things. <em style={{color:"var(--amber)"}}>That's it.</em></div>
            <div style={{fontSize:11,color:"var(--muted)",marginTop:6,marginBottom:4}}>
              {checksDone} of {CHECKS.length} done{checksDone === CHECKS.length ? " 🎉" : ""}
            </div>
            <div style={{marginTop:6,columns:2,columnGap:16}}>
              {CHECKS.slice(0,4).map(c=>(
                <div
                  key={c.id}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); toggleCheck(c.id); }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); toggleCheck(c.id); } }}
                  style={{display:"flex",alignItems:"flex-start",gap:7,fontSize:11,marginBottom:5,color:"var(--amber)",cursor:"pointer"}}
                >
                  <div style={{width:14,height:14,borderRadius:"50%",border:`1.5px solid ${checked[c.id]?"var(--forest)":"currentColor"}`,background:checked[c.id]?"var(--forest)":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:checked[c.id]?"#fff":"inherit",marginTop:1}}>{checked[c.id]&&"✓"}</div>
                  <span style={{color:checked[c.id]?"var(--forest)":"inherit",opacity:checked[c.id]?0.55:1,fontWeight:checked[c.id]?600:400,lineHeight:1.35}}>{c.text}</span>
                </div>
              ))}
            </div>
            {CHECKS.length > 4 && (
              <div style={{fontSize:10,color:"var(--muted)",marginTop:4,fontStyle:"italic"}}>
                +{CHECKS.length - 4} more in full list
              </div>
            )}
          </div>
          <div className="w-tap w-tap-dk">Open full list ↗</div>
        </div>

        {/* JOURNAL — dark teal */}
        <div className="w w-full wc-dark3 w-tall" onClick={()=>open("journal")}>
          <span style={{position:"absolute",fontSize:180,right:-20,bottom:-20,opacity:0.07,transform:"rotate(-12deg)",pointerEvents:"none",userSelect:"none"}}>📖</span>
          <div className="win-lg">
            <div className="w-lbl" style={{color:"#70c8b8"}}><div className="w-lbl-dot" style={{background:"#70c8b8"}}/>Journal & memories</div>
            <div style={{fontFamily:"'Lora',serif",fontSize:22,color:"#fff",lineHeight:1.2,marginBottom:8}}>Your pregnancy <em style={{fontStyle:"italic",color:"#70c8b8"}}>story.</em></div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",lineHeight:1.65,marginBottom:14}}>Write, add photos, track your mood. Build your storybook as you go.</div>
            <div style={{display:"flex",gap:8,marginTop:12}}>
              <div style={{width:52,height:52,borderRadius:12,background:"rgba(112,200,184,0.15)",border:"1.5px dashed rgba(112,200,184,0.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,color:"#70c8b8",flexShrink:0}}>+</div>
              {journalEntries.slice(0,3).map(e=>(
                <div key={e.id} style={{width:52,height:52,borderRadius:12,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0,overflow:"hidden"}}>
                  {photoThumb(e.photos[0])
                    ? <img src={photoThumb(e.photos[0])} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    : (typeof e.photos[0] === "string" ? e.photos[0] : "📝")}
                </div>
              ))}
              <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",alignSelf:"center",marginLeft:4}}>{journalEntries.length} memories</div>
            </div>
          </div>
          <div className="w-tap w-tap-lt">Open journal ↗</div>
        </div>

        {/* STORIES — deep purple-black */}
        <div className="w w-full wc-dark4" onClick={()=>open("stories")}>
          <span style={{position:"absolute",fontSize:160,right:-20,bottom:-20,opacity:0.07,transform:"rotate(-10deg)",pointerEvents:"none",color:"#c8a0f0",userSelect:"none"}}>💬</span>
          <div className="win-lg">
            <div className="w-lbl" style={{color:"#c8a0f0"}}><div className="w-lbl-dot" style={{background:"#c8a0f0"}}/>Stories from week 8</div>
            <div style={{fontFamily:"'Lora',serif",fontSize:22,color:"#fff",lineHeight:1.2,marginBottom:12}}>Women who've been <em style={{fontStyle:"italic",color:"#c8a0f0"}}>right here.</em></div>
            <div style={{display:"flex",alignItems:"center"}}>
              {STORIES.map(s=>(
                <div key={s.id} style={{width:28,height:28,borderRadius:"50%",background:s.aBg,color:s.aCol,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,border:"2px solid rgba(0,0,0,0.3)",marginRight:-6,flexShrink:0}}>{s.init}</div>
              ))}
              <span style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginLeft:14}}>{STORIES.length} stories this week</span>
            </div>
          </div>
          <div className="w-tap w-tap-lt">Read their stories ↗</div>
        </div>

      </div>

      {/* ── BACKDROP ── */}
      <div className={`backdrop${visible?" open":""}`} onClick={close}/>

      {/* ── PANEL ── */}
      {active && pd && (
        <div className={`panel${visible?" open":""}`}>
          <div className="panel-inner">
            <div className="panel-head" style={{background:pd.headBg}}>
              <div>
                <div className="panel-head-lbl" style={{color:pd.lblCol}}>{pd.label}</div>
                <div className="panel-head-title" style={{color:pd.titleCol}}>{pd.title}</div>
              </div>
              <button className={`close-btn${pd.dark?" close-dk":""}`} onClick={close}>✕</button>
            </div>
            {pd.noScroll ? (
              <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
                {active==="journal"
                  ? <JournalPanel entries={journalEntries} setEntries={setJournalEntriesPersist}/>
                  : pd.Panel ? <pd.Panel/> : null}
              </div>
            ) : (
              <div className="panel-scroll">
                {active==="checklist"
                  ? <CheckPanel checked={checked} toggle={toggleCheck}/>
                  : pd.Panel ? <pd.Panel/> : null}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── BOTTOM NAV ── */}
      <div className="bnav">
        <button className="bnav-btn">← Wk 7</button>
        <div className="bnav-mid"><span className="bnav-wk">Week 8</span><span className="bnav-of">of 40</span></div>
        <button className="bnav-btn next">Wk 9 →</button>
      </div>
    </div>
  );
}
