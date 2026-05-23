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
.hero{position:relative;overflow:hidden;cursor:pointer;background:linear-gradient(150deg,#6a2e20 0%,#8a3e2e 45%,#a84e3c 80%,#c06050 100%);-webkit-tap-highlight-color:transparent;display:flex;flex-direction:column;}
.hero:active{filter:brightness(0.92);}
.blob{position:absolute;border-radius:50%;filter:blur(60px);pointer-events:none;}
.hero-bg-emoji{position:absolute;font-size:280px;line-height:1;right:-30px;bottom:-30px;opacity:0.16;pointer-events:none;transform:rotate(-14deg);user-select:none;}
.hero-grad{position:absolute;inset:0;background:linear-gradient(to top,rgba(20,6,2,0.70) 0%,rgba(20,6,2,0.0) 45%,transparent 100%);pointer-events:none;}
.hero-inner{position:relative;z-index:2;padding:48px 22px 22px;}
.hero-eyebrow{display:flex;align-items:center;gap:7px;font-size:10px;font-weight:600;letter-spacing:0.26em;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:10px;}
.hero-dot{width:4px;height:4px;border-radius:50%;background:#e88060;}
.hero-week{font-family:'Lora',serif;font-size:64px;font-weight:400;line-height:0.92;color:#fff;letter-spacing:-0.025em;margin-bottom:8px;}
.hero-week em{font-style:italic;color:#f0a07a;}
.hero-tagline{font-family:'Lora',serif;font-size:15px;font-style:italic;color:rgba(255,255,255,0.5);line-height:1.5;margin-bottom:22px;}
.hero-stats{display:flex;gap:7px;flex-wrap:wrap;}
.hero-stat{display:flex;flex-direction:column;gap:2px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:10px 14px;}
.hero-stat-val{font-family:'Lora',serif;font-size:17px;color:#f0a07a;line-height:1;}
.hero-stat-val-sm{font-family:'Lora',serif;font-size:12px;color:#f0a07a;line-height:1;}
.hero-stat-lbl{font-size:10px;color:rgba(255,255,255,0.35);margin-top:2px;}
.hero-stat-sub{font-size:9px;color:rgba(255,255,255,0.2);margin-top:1px;font-style:italic;}
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
.wc-rose   {background:var(--rose-pale)!important;   border-color:var(--rose-bdr)!important;}
.wc-dark1  {background:linear-gradient(145deg,#1a1210,#2e1a14)!important;border-color:#2a1410!important;}
.wc-plum   {background:var(--plum-pale)!important;   border-color:var(--plum-bdr)!important;}
.wc-dark2  {background:linear-gradient(145deg,#181830,#28285a)!important;border-color:#181840!important;}
.wc-teal   {background:var(--teal-pale)!important;   border-color:var(--teal-bdr)!important;}
.wc-forest {background:var(--forest-pale)!important; border-color:var(--forest-bdr)!important;}
.wc-slate  {background:var(--slate-pale)!important;  border-color:var(--slate-bdr)!important;}
.wc-amber  {background:var(--amber-pale)!important;  border-color:var(--amber-bdr)!important;}
.wc-dark3  {background:linear-gradient(145deg,#0a2020,#183535)!important;border-color:#0a2828!important;}
.wc-dark4  {background:linear-gradient(145deg,#1e1030,#342050)!important;border-color:#200e38!important;}
.wc-navy   {background:var(--navy-pale)!important;   border-color:var(--navy-bdr)!important;}

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
.j-save-row{display:flex;justify-content:space-between;align-items:center;margin-top:12px;gap:8px;flex-wrap:wrap;}
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

/* HERO MOOD STRIP */
.hero-mood-strip{position:relative;z-index:2;display:flex;align-items:center;gap:10px;padding:8px 22px 10px;}
.hero-mood-entry{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);border-radius:100px;padding:5px 12px;}
.hero-mood-emoji{font-size:14px;}
.hero-mood-text{font-size:10px;color:rgba(255,255,255,0.45);font-style:italic;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.hero-mood-ago{font-size:10px;color:rgba(255,255,255,0.25);white-space:nowrap;}

/* SYMPTOM SEARCH BAR */
.symptom-bar{padding:10px 12px 0;animation:fadeUp 0.35s ease both;}
.symptom-bar-inner{background:#fff;border:1px solid var(--bdr);border-radius:16px;padding:0;display:flex;align-items:center;overflow:hidden;transition:box-shadow 0.15s;}
.symptom-bar-inner:focus-within{box-shadow:0 0 0 2px var(--rose-bdr);}
.symptom-bar-icon{padding:0 12px 0 14px;font-size:16px;flex-shrink:0;color:var(--muted);}
.symptom-bar-input{flex:1;border:none;outline:none;font-size:13px;font-family:inherit;color:var(--ink);padding:13px 0;background:transparent;}
.symptom-bar-input::placeholder{color:var(--muted);}
.symptom-bar-btn{padding:0 18px;background:var(--rose);border:none;cursor:pointer;font-size:12px;font-weight:600;color:#fff;font-family:inherit;border-radius:0 14px 14px 0;align-self:stretch;min-height:46px;}

/* SYMPTOM PANEL */
.symptom-result{background:#fff;border:1px solid var(--bdr);border-radius:16px;padding:16px;margin-bottom:10px;}
.symptom-result-q{font-size:13px;font-weight:600;color:var(--ink);margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid var(--cream2);}
.symptom-tier{display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--cream2);}
.symptom-tier:last-child{border-bottom:none;}
.symptom-tier-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:5px;}
.symptom-tier-label{font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:3px;}
.symptom-tier-text{font-size:12px;color:var(--muted);line-height:1.6;}
.symptom-loading{text-align:center;padding:24px;font-size:13px;color:var(--muted);font-style:italic;}

/* FOOD SEARCH WIDGET */
.wc-food-search{background:var(--forest-pale);border-color:var(--forest-bdr);}
.food-search-input-wrap{display:flex;align-items:center;background:#fff;border:1px solid var(--forest-bdr);border-radius:100px;padding:0 14px;gap:8px;margin-top:10px;}
.food-search-input{flex:1;border:none;outline:none;font-size:12px;font-family:inherit;color:var(--ink);padding:9px 0;background:transparent;}
.food-search-input::placeholder{color:var(--muted);}

/* ── BOTTOM TAB NAV ── */
.tab-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;z-index:50;padding:0 0 env(safe-area-inset-bottom,0px);}
.tab-nav-inner{margin:0 16px 14px;background:rgba(26,18,16,0.55);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-radius:20px;display:flex;border:1px solid rgba(255,255,255,0.05);}
.tab-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;padding:11px 4px 10px;border:none;background:none;cursor:pointer;font-family:inherit;-webkit-tap-highlight-color:transparent;transition:all 0.2s;position:relative;}
.tab-btn-icon{font-size:18px;line-height:1;opacity:0.5;transition:all 0.2s;}
.tab-btn.on .tab-btn-icon{opacity:1;}
.tab-btn-lbl{font-size:10px;font-weight:600;letter-spacing:0.05em;color:rgba(255,255,255,0.35);transition:color 0.2s;white-space:nowrap;}
.tab-btn.on .tab-btn-lbl{color:rgba(255,255,255,0.9);}
.tab-btn-dot{width:18px;height:2px;border-radius:100px;background:var(--rose);opacity:0;transition:opacity 0.2s;margin-top:1px;}
.tab-btn.on .tab-btn-dot{opacity:1;}

/* ── WEEK NAV STRIP ── */
.week-nav{display:flex;align-items:center;justify-content:space-between;padding:10px 16px 0;}
.week-nav-btn{background:none;border:1.5px solid var(--bdr);border-radius:100px;padding:6px 14px;font-size:11px;font-weight:600;color:var(--muted);cursor:pointer;font-family:inherit;transition:all 0.14s;}
.week-nav-btn:hover{border-color:var(--rose);color:var(--rose);}
.week-nav-mid{text-align:center;}
.week-nav-label{font-family:'Lora',serif;font-size:16px;color:var(--ink);display:block;line-height:1;}
.week-nav-sub{font-size:9px;color:var(--muted);letter-spacing:0.1em;text-transform:uppercase;}

/* ── QUICK ADD FAB ── */
.fab{position:fixed;bottom:100px;right:calc(50% - 215px + 16px);width:52px;height:52px;border-radius:50%;background:var(--rose);border:none;color:#fff;font-size:24px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(191,82,64,0.4);z-index:49;transition:transform 0.15s,box-shadow 0.15s;-webkit-tap-highlight-color:transparent;}
.fab:active{transform:scale(0.92);}
@media(max-width:430px){.fab{right:16px;}}

/* ── QUICK ADD SHEET ── */
.quick-add-sheet{position:fixed;inset:0;z-index:200;display:flex;flex-direction:column;justify-content:flex-end;pointer-events:none;}
.quick-add-sheet.open{pointer-events:all;}
.quick-add-backdrop{position:absolute;inset:0;background:rgba(16,10,8,0);transition:background 0.3s;}
.quick-add-sheet.open .quick-add-backdrop{background:rgba(16,10,8,0.7);}
.quick-add-card{position:relative;background:var(--cream);border-radius:28px 28px 0 0;padding:20px 20px 40px;transform:translateY(102%);transition:transform 0.36s cubic-bezier(0.3,0.72,0,1);}
.quick-add-sheet.open .quick-add-card{transform:translateY(0);}
.quick-add-title{font-family:'Lora',serif;font-size:20px;color:var(--ink);margin-bottom:14px;font-weight:400;}
.quick-add-title em{font-style:italic;color:var(--teal);}

/* ── LIBRARY ── */
.library{padding:0 0 110px;overflow-y:auto;flex:1;}
.lib-header{padding:20px 16px 8px;}
.lib-header-title{font-family:'Lora',serif;font-size:28px;font-weight:400;color:var(--ink);line-height:1.1;margin-bottom:4px;}
.lib-header-title em{font-style:italic;color:var(--rose);}
.lib-header-sub{font-size:13px;color:var(--muted);}
.lib-section{padding:16px 12px 0;}
.lib-section-lbl{font-size:9px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:var(--muted);padding:0 4px;margin-bottom:10px;display:flex;align-items:center;gap:10px;}
.lib-section-lbl::after{content:'';flex:1;height:1px;background:var(--bdr);}
.lib-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.lw{border-radius:22px;overflow:hidden;cursor:pointer;position:relative;border:1px solid var(--bdr);background:#fff;transition:transform 0.14s,box-shadow 0.14s;-webkit-tap-highlight-color:transparent;}
.lw:active{transform:scale(0.97);}
.lw:hover{box-shadow:0 6px 24px rgba(0,0,0,0.1);}
.lw-full{grid-column:1/-1;}
.lw-tall{min-height:200px;}.lw-med{min-height:160px;}.lw-sm{min-height:130px;}

/* ── MOOD CHART ── */
.mood-chart{padding:14px 16px;}
.mood-chart-week{display:flex;align-items:center;gap:8px;margin-bottom:7px;}
.mood-chart-wk{font-size:9px;font-weight:700;color:var(--muted);letter-spacing:0.1em;text-transform:uppercase;width:40px;flex-shrink:0;}
.mood-chart-dots{display:flex;gap:5px;flex-wrap:wrap;}
.mood-chart-dot{font-size:14px;line-height:1;}

/* ── MILESTONE TIMELINE ── */
.milestone-scroll{overflow-x:auto;padding:0 12px 8px;scrollbar-width:none;}
.milestone-scroll::-webkit-scrollbar{display:none;}
.milestone-track{display:flex;gap:0;align-items:flex-start;padding:8px 4px;min-width:max-content;}
.milestone-item{display:flex;flex-direction:column;align-items:center;width:70px;}
.milestone-line{height:2px;flex:1;background:var(--bdr);margin-top:16px;min-width:20px;}
.milestone-dot{width:10px;height:10px;border-radius:50%;border:2px solid var(--bdr);background:#fff;flex-shrink:0;transition:all 0.15s;}
.milestone-dot.done{background:var(--rose);border-color:var(--rose);}
.milestone-dot.current{background:var(--rose);border-color:var(--rose);box-shadow:0 0 0 3px var(--rose-pale);}
.milestone-dot.upcoming{background:#fff;border-color:var(--bdr);}
.milestone-wk{font-size:9px;font-weight:700;color:var(--muted);margin-top:5px;text-align:center;}
.milestone-name{font-size:9px;color:var(--muted);text-align:center;line-height:1.3;margin-top:2px;max-width:65px;}

/* ── JOURNAL TAB (full page) ── */
.journal-tab{display:flex;flex-direction:column;height:100%;position:relative;overflow:hidden;background:var(--cream);}
.journal-tab-header{padding:20px 16px 0;flex-shrink:0;}
.journal-tab-title{font-family:'Lora',serif;font-size:28px;color:var(--ink);font-weight:400;line-height:1.1;margin-bottom:4px;}
.journal-tab-title em{font-style:italic;color:var(--teal);}
.journal-tab-sub{font-size:13px;color:var(--muted);margin-bottom:14px;}

/* ── LIBRARY HERO ── */
.lib-hero{position:relative;overflow:hidden;background:linear-gradient(150deg,#2e4e6e 0%,#3a5e80 45%,#486e90 80%,#5880a4 100%);padding:52px 22px 0;display:flex;flex-direction:column;}
.lib-hero-bg-emoji{position:absolute;font-size:280px;line-height:1;right:-20px;bottom:-20px;opacity:0.16;pointer-events:none;transform:rotate(-12deg);user-select:none;}
.lib-hero-grad{position:absolute;inset:0;background:linear-gradient(to top,rgba(8,18,32,0.65) 0%,rgba(8,18,32,0.0) 45%,transparent 100%);pointer-events:none;}
.lib-hero-inner{position:relative;z-index:2;padding-bottom:20px;}
.lib-hero-eyebrow{display:flex;align-items:center;gap:7px;font-size:10px;font-weight:600;letter-spacing:0.26em;text-transform:uppercase;color:rgba(255,255,255,0.32);margin-bottom:10px;}
.lib-hero-dot{width:4px;height:4px;border-radius:50%;background:#7090c0;}
.lib-hero-title{font-family:'Lora',serif;font-size:42px;font-weight:400;line-height:0.95;color:#fff;letter-spacing:-0.02em;margin-bottom:10px;}
.lib-hero-title em{font-style:italic;color:#90b8f0;}
.lib-hero-sub{font-family:'Lora',serif;font-size:14px;font-style:italic;color:rgba(255,255,255,0.42);line-height:1.55;margin-bottom:20px;}
.lib-hero-stats{display:flex;gap:8px;flex-wrap:wrap;padding-bottom:20px;}
.lib-hero-stat{display:flex;flex-direction:column;gap:2px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:9px 13px;}
.lib-hero-stat-val{font-family:'Lora',serif;font-size:15px;color:#90b8f0;line-height:1;}
.lib-hero-stat-lbl{font-size:10px;color:rgba(255,255,255,0.3);margin-top:2px;}

/* ── JOURNAL HERO ── */
.jh{position:relative;overflow:hidden;cursor:default;background:linear-gradient(150deg,#2e6868 0%,#3a7878 45%,#488888 80%,#569898 100%);}
.jh-bg{position:absolute;font-size:260px;line-height:1;right:-20px;bottom:-20px;opacity:0.16;pointer-events:none;transform:rotate(-12deg);user-select:none;}
.jh-grad{position:absolute;inset:0;background:linear-gradient(to top,rgba(6,22,22,0.65) 0%,rgba(6,22,22,0.0) 45%,transparent 100%);pointer-events:none;}
.jh-photo{position:absolute;inset:0;overflow:hidden;}
.jh-photo img{width:100%;height:100%;object-fit:cover;opacity:0.85;filter:contrast(1.1) saturate(1.15) brightness(0.95);}
.jh-inner{position:relative;z-index:2;padding:52px 22px 20px;}
.jh-eyebrow{display:flex;align-items:center;gap:7px;font-size:10px;font-weight:600;letter-spacing:0.26em;text-transform:uppercase;color:rgba(255,255,255,0.32);margin-bottom:10px;}
.jh-dot{width:4px;height:4px;border-radius:50%;background:#70c8b8;}
.jh-title{font-family:'Lora',serif;font-size:48px;font-weight:400;line-height:0.92;color:#fff;letter-spacing:-0.025em;margin-bottom:8px;}
.jh-title em{font-style:italic;color:#70c8b8;}
.jh-entry-preview{background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:13px 15px;margin-bottom:18px;}
.jh-entry-mood{font-size:18px;margin-bottom:5px;}
.jh-entry-text{font-family:'Lora',serif;font-size:13px;font-style:italic;color:rgba(255,255,255,0.65);line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.jh-entry-date{font-size:10px;color:rgba(255,255,255,0.28);margin-top:5px;}
.jh-stats{display:flex;gap:8px;flex-wrap:wrap;}
.jh-stat{display:flex;flex-direction:column;gap:2px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:9px 13px;}
.jh-stat-val{font-family:'Lora',serif;font-size:15px;color:#70c8b8;line-height:1;}
.jh-stat-lbl{font-size:10px;color:rgba(255,255,255,0.3);margin-top:2px;}

/* ── JOURNAL TAB GRID ── */
.jgrid{padding:10px 12px 100px;display:grid;grid-template-columns:1fr 1fr;gap:10px;}

/* ── MOOD TOAST ── */
.mood-toast{position:fixed;top:60px;left:50%;transform:translateX(-50%) translateY(-80px);z-index:500;background:var(--ink);color:#fff;border-radius:100px;padding:10px 20px;font-size:13px;font-weight:600;display:flex;align-items:center;gap:8px;box-shadow:0 4px 20px rgba(0,0,0,0.3);transition:transform 0.3s cubic-bezier(0.3,0.72,0,1),opacity 0.3s;opacity:0;pointer-events:none;}
.mood-toast.show{transform:translateX(-50%) translateY(0);opacity:1;}

/* ── EMOTION PILLS (interactive) ── */
.em-pill{background:#fff;border:1px solid var(--bdr);border-radius:100px;padding:6px 12px;font-size:12px;color:var(--ink);cursor:pointer;transition:all 0.15s;-webkit-tap-highlight-color:transparent;}
.em-pill:active{transform:scale(0.94);}
.em-pill.logged{background:var(--rose-pale);border-color:var(--rose-bdr);color:var(--rose);}

/* ── PUBLIC/PRIVATE TOGGLE ── */
.privacy-toggle{display:flex;background:var(--cream2);border-radius:100px;padding:3px;gap:2px;border:1px solid var(--bdr);min-width:0;max-width:100%;}
.privacy-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:3px;padding:5px 6px;border:none;background:transparent;border-radius:100px;font-size:clamp(9px,2.2vw,11px);font-weight:600;color:var(--muted);cursor:pointer;font-family:inherit;transition:all 0.15s;white-space:nowrap;min-width:0;overflow:hidden;}
.privacy-btn.on{background:#fff;color:var(--ink);box-shadow:0 1px 4px rgba(0,0,0,0.08);}
.privacy-btn .pb-label{display:inline;}
@media(max-width:360px){.privacy-btn .pb-label{display:none;}.privacy-btn{padding:5px 8px;}}

/* ── SHARE STRIP ── */
.share-strip-wrap{padding:16px;background:var(--cream);}
.share-strip-title{font-family:'Lora',serif;font-size:16px;color:var(--ink);margin-bottom:12px;font-weight:400;}
.share-strip-title em{font-style:italic;color:var(--teal);}
.share-card{background:linear-gradient(135deg,#0a2020,#183535);border-radius:16px;overflow:hidden;margin-bottom:12px;}
.share-card-header{padding:14px 16px 10px;border-bottom:1px solid rgba(255,255,255,0.08);}
.share-card-title{font-family:'Lora',serif;font-size:14px;color:#fff;font-weight:400;margin-bottom:2px;}
.share-card-sub{font-size:10px;color:rgba(255,255,255,0.3);}
.share-week-row{display:flex;gap:0;padding:12px 16px;overflow-x:auto;scrollbar-width:none;}
.share-week-row::-webkit-scrollbar{display:none;}
.share-week-item{flex-shrink:0;width:72px;display:flex;flex-direction:column;align-items:center;gap:4px;padding:0 4px;}
.share-week-num{font-size:9px;font-weight:700;color:rgba(255,255,255,0.4);letter-spacing:0.1em;}
.share-week-size{font-size:9px;color:rgba(255,255,255,0.25);text-align:center;line-height:1.3;}
.share-week-moods{display:flex;flex-wrap:wrap;gap:2px;justify-content:center;font-size:14px;}
.share-week-snippet{font-size:9px;color:rgba(255,255,255,0.4);text-align:center;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.share-week-divider{width:1px;background:rgba(255,255,255,0.06);flex-shrink:0;margin:8px 0;align-self:stretch;}
.share-btn-row{display:flex;gap:8px;padding:0 16px 14px;}
.share-btn-main{flex:1;background:var(--teal);color:#fff;border:none;border-radius:100px;padding:11px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:7px;}
.share-btn-copy{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);border:1px solid rgba(255,255,255,0.12);border-radius:100px;padding:11px 14px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;}

/* ── FRIENDS ── */
.friends-card{background:linear-gradient(135deg,#1a1a30,#282850);border-radius:16px;padding:16px 18px;margin-bottom:10px;}
.friends-label{font-size:9px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(180,170,240,0.6);margin-bottom:8px;}
.friends-title{font-family:'Lora',serif;font-size:18px;color:#fff;line-height:1.2;margin-bottom:6px;}
.friends-title em{font-style:italic;color:#b0a0f0;}
.friends-sub{font-size:12px;color:rgba(255,255,255,0.35);line-height:1.6;margin-bottom:12px;}
.friends-coming{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);border-radius:100px;padding:5px 14px;font-size:10px;font-weight:600;color:rgba(255,255,255,0.4);letter-spacing:0.08em;}

/* ── RICH TIMELINE CARDS ── */
.tl-week-group{margin-bottom:18px;}
.tl-week-header{display:flex;align-items:center;gap:10px;padding:0 16px;margin-bottom:10px;}
.tl-week-num{font-family:'Lora',serif;font-size:36px;font-weight:400;line-height:1;color:var(--rose);opacity:0.9;flex-shrink:0;}
.tl-week-meta{flex:1;}
.tl-week-label{font-size:11px;font-weight:700;color:var(--ink);letter-spacing:0.05em;}
.tl-week-baby{font-size:10px;color:var(--muted);margin-top:2px;}
.tl-week-line{flex:1;height:1px;background:var(--bdr);}

.tl-card{margin:0 12px 8px;border-radius:16px;overflow:hidden;position:relative;box-shadow:0 1px 8px rgba(0,0,0,0.05);}
.tl-card-inner{padding:12px 14px 10px;}
.tl-card-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;}
.tl-card-date{display:flex;align-items:baseline;gap:4px;}
.tl-card-date-day{font-size:13px;font-weight:700;color:var(--ink);}
.tl-card-date-month{font-size:11px;font-weight:500;color:var(--muted);}
.tl-card-badges{display:flex;align-items:center;gap:6px;}
.tl-card-public{font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;background:var(--teal-pale);border:1px solid var(--teal-bdr);border-radius:100px;padding:2px 8px;color:var(--teal);}
.tl-card-mood{font-size:22px;line-height:1;}
.tl-card-text{font-family:'Lora',serif;font-size:13px;font-style:italic;line-height:1.7;color:var(--ink);margin-bottom:10px;padding-left:12px;border-left:2px solid var(--rose-bdr);}
.tl-card-photos{display:flex;gap:7px;margin-bottom:8px;overflow-x:auto;scrollbar-width:none;}
.tl-card-photos::-webkit-scrollbar{display:none;}
.tl-card-photo{width:72px;height:72px;border-radius:10px;flex-shrink:0;overflow:hidden;border:2px solid rgba(255,255,255,0.6);box-shadow:1px 2px 8px rgba(0,0,0,0.1);display:flex;align-items:center;justify-content:center;font-size:26px;}
.tl-card-photo img{width:100%;height:100%;object-fit:cover;}
.tl-card-foot{display:flex;align-items:center;justify-content:flex-end;border-top:1px solid rgba(0,0,0,0.05);padding-top:8px;}
.tl-del-btn{background:none;border:none;font-size:11px;color:var(--muted);cursor:pointer;font-family:inherit;padding:0;opacity:0.6;transition:opacity 0.15s;}
.tl-del-btn:hover{opacity:1;color:var(--rose);}
.tl-confirm{background:var(--rose-pale);border-radius:10px;padding:10px 12px;margin-top:6px;border:1px solid var(--rose-bdr);}
.tl-confirm-msg{font-size:12px;color:var(--rose);margin-bottom:8px;line-height:1.5;}
.tl-confirm-btns{display:flex;gap:8px;}
.tl-confirm-no{flex:1;background:none;border:1px solid var(--bdr);border-radius:100px;padding:6px;font-size:11px;color:var(--muted);cursor:pointer;font-family:inherit;}
.tl-confirm-yes{flex:1;background:var(--rose);border:none;border-radius:100px;padding:6px;font-size:11px;font-weight:600;color:#fff;cursor:pointer;font-family:inherit;}

/* Card color themes — cycling */
.tl-card-rose  {background:var(--rose-pale);  border:1px solid var(--rose-bdr);}
.tl-card-teal  {background:var(--teal-pale);  border:1px solid var(--teal-bdr);}
.tl-card-plum  {background:var(--plum-pale);  border:1px solid var(--plum-bdr);}
.tl-card-navy  {background:var(--navy-pale);  border:1px solid var(--navy-bdr);}
.tl-card-amber {background:var(--amber-pale); border:1px solid var(--amber-bdr);}
.tl-card-forest{background:var(--forest-pale);border:1px solid var(--forest-bdr);}
.tl-card-dark  {background:linear-gradient(135deg,#1a1210,#2e1a14);}

/* ── NUTRITION METERS ── */
.nutr-meters{display:flex;flex-direction:column;gap:12px;margin-bottom:16px;}
.nutr-meter{background:#fff;border:1px solid var(--bdr);border-radius:16px;padding:14px 16px;}
.nutr-meter-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
.nutr-meter-left{display:flex;align-items:center;gap:10px;}
.nutr-meter-icon{font-size:22px;flex-shrink:0;}
.nutr-meter-name{font-size:13px;font-weight:600;color:var(--ink);line-height:1.2;}
.nutr-meter-target{font-size:10px;color:var(--muted);margin-top:2px;}
.nutr-meter-count{font-family:'Lora',serif;font-size:22px;font-weight:400;color:var(--ink);line-height:1;}
.nutr-meter-unit{font-size:9px;color:var(--muted);text-align:right;margin-top:2px;}
.nutr-track{height:8px;background:var(--cream2);border-radius:100px;overflow:hidden;margin-bottom:10px;}
.nutr-fill{height:100%;border-radius:100px;transition:width 0.4s cubic-bezier(0.3,0.72,0,1);}
.nutr-taps{display:flex;gap:6px;}
.nutr-tap-btn{flex:1;border:none;border-radius:100px;padding:7px 4px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.15s;-webkit-tap-highlight-color:transparent;}
.nutr-tap-btn:active{transform:scale(0.95);}
.nutr-note{font-size:11px;color:var(--muted);margin-top:8px;line-height:1.5;font-style:italic;}
`;




/* ─── DATA ───────────────────────────────────────────────────────────────── */

// All dates in IST (Asia/Kolkata, UTC+5:30)
const istDate = (d = new Date()) =>
  d.toLocaleDateString("en-IN", {day:"numeric", month:"short", year:"numeric", timeZone:"Asia/Kolkata"});
const istTime = (d = new Date()) =>
  d.toLocaleTimeString("en-IN", {hour:"2-digit", minute:"2-digit", timeZone:"Asia/Kolkata"});
const CHECKS = [
  {id:1,text:"Finalize your doctor",pri:"Today",col:"#c04040"},
  {id:2,text:"Tell your parents and close ones",pri:"Today",col:"#c04040"},
  {id:3,text:"Schedule scan",pri:"Today",col:"#c04040"},
  {id:4,text:"Start folic acid daily",pri:"This week",col:"#8a5010"},
  {id:5,text:"Tell your partner what you need",pri:"This week",col:"#8a5010"},
  {id:6,text:"Stock nausea foods: crackers, curd, coconut water",pri:"This week",col:"#8a5010"},
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
    photos:["🌿","💧"],
    heroBg:"linear-gradient(135deg,#edf8f4,#d8f2ea)",heroEmoji:"🌿",heroBgColor:"#e8f8f2"},
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

const MOOD_LOG_KEY = "matri-mood-log";
const NUTR_KEY     = "matri-nutrition-log";

function loadMoodLog() {
  try {
    const raw = localStorage.getItem(MOOD_LOG_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function saveMoodLog(log) {
  try { localStorage.setItem(MOOD_LOG_KEY, JSON.stringify(log)); } catch {}
}

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
  6:{compare:"a grain of rice",cm:"6mm",fact:"Heart beating for the first time.",icon:"🌾"},
  7:{compare:"your little fingernail",cm:"1cm",fact:"Brain developing at extraordinary speed.",icon:"🤏"},
  8:{compare:"the tip of your thumb",cm:"1.6cm",fact:"Fingers forming. Heart beats 160 bpm.",icon:"👍"},
  9:{compare:"a shirt button",cm:"2.3cm",fact:"All essential organs forming.",icon:"🔘"},
  10:{compare:"a large shirt button",cm:"3cm",fact:"Tiny movements. Unmistakably human.",icon:"🔘"},
  11:{compare:"a 5-rupee coin",cm:"4cm",fact:"Fingers and toes fully separated.",icon:"🪙"},
  12:{compare:"a AA battery's width",cm:"5.4cm",fact:"Can open and close fists.",icon:"🔋"},
  13:{compare:"half a pencil",cm:"7.4cm",fact:"Fingerprints are forming.",icon:"✏️"},
  14:{compare:"a house key",cm:"8.7cm",fact:"Can make facial expressions.",icon:"🗝️"},
  16:{compare:"an avocado",cm:"11.6cm",fact:"Hears sounds inside the womb.",icon:"🥑"},
  18:{compare:"a bell pepper",cm:"14.2cm",fact:"You may start to feel movement.",icon:"🫑"},
  20:{compare:"a banana",cm:"16.4cm",fact:"Halfway there. Fully formed.",icon:"🍌"},
  24:{compare:"a ruler",cm:"30cm",fact:"Can recognise your voice.",icon:"📏"},
  28:{compare:"a 500ml water bottle",cm:"37.6cm",fact:"Eyes open for the first time.",icon:"💧"},
  32:{compare:"a large coconut",cm:"42.4cm",fact:"Gaining weight fast — fat and muscle.",icon:"🥥"},
  36:{compare:"a rolled-up dupatta",cm:"47.4cm",fact:"Almost ready. Turning head-down.",icon:"🧣"},
  40:{compare:"a newborn",cm:"50cm",fact:"Ready to meet you.",icon:"👶"},
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
    const baby = BABY_SIZES[week] || {compare:"growing",cm:"",fact:"Growing beautifully.",icon:"🤰"};
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
          <div className="pg-wk-baby-emoji">{data.baby.icon}</div>
          <div>
            <div className="pg-wk-baby-size">About the size of <em>{data.baby.compare}</em> · {data.baby.cm}</div>
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
  const [tab, setTab] = useState("size");
  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      {/* Tab bar */}
      <div style={{display:"flex",borderBottom:"1px solid var(--bdr)",background:"var(--cream)",flexShrink:0}}>
        {[["size","🫶 Size & body"],["senses","✨ Senses"]].map(([id,lbl])=>(
          <button key={id}
            onClick={()=>setTab(id)}
            style={{flex:1,padding:"11px 8px 9px",fontSize:12,fontWeight:600,
              color:tab===id?"var(--rose)":"var(--muted)",
              borderBottom:tab===id?"2px solid var(--rose)":"2px solid transparent",
              background:"none",border:"none",
              cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>
            {lbl}
          </button>
        ))}
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"20px 20px 48px",scrollbarWidth:"none"}}>
        {tab==="size" && <>
          {/* Hero size card */}
          <div style={{background:"linear-gradient(140deg,#1a1210,#2e1a14)",borderRadius:16,padding:"18px 20px",marginBottom:16,display:"flex",gap:16,alignItems:"center"}}>
            <div style={{flexShrink:0}}>
              <svg width="72" height="88" viewBox="0 0 72 88" fill="none">
                <ellipse cx="36" cy="26" rx="18" ry="21" fill="#f0cfc8"/>
                <ellipse cx="36" cy="24" rx="12" ry="15" fill="#fde8e4"/>
                <circle cx="30" cy="21" r="2" fill="#d4948a"/>
                <circle cx="42" cy="21" r="2" fill="#d4948a"/>
                <path d="M31 28 Q36 33 41 28" stroke="#d4948a" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                <ellipse cx="17" cy="40" rx="5" ry="6" fill="#f0cfc8" transform="rotate(-18 17 40)"/>
                <ellipse cx="55" cy="40" rx="5" ry="6" fill="#f0cfc8" transform="rotate(18 55 40)"/>
                <ellipse cx="36" cy="58" rx="13" ry="17" fill="#f0cfc8"/>
                <ellipse cx="27" cy="72" rx="4" ry="7" fill="#f0cfc8" transform="rotate(8 27 72)"/>
                <ellipse cx="45" cy="72" rx="4" ry="7" fill="#f0cfc8" transform="rotate(-8 45 72)"/>
              </svg>
            </div>
            <div>
              <div style={{fontSize:11,color:"rgba(240,160,122,0.7)",fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:6}}>Week 8</div>
              <div style={{fontFamily:"'Lora',serif",fontSize:28,color:"#fff",lineHeight:1,marginBottom:6}}>1.6 cm</div>
              <div style={{fontSize:13,color:"rgba(255,255,255,0.55)",lineHeight:1.5}}>About the size of the tip of your thumb. Hold your thumb up — that's your baby right now.</div>
            </div>
          </div>

          {/* Size comparison cards */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:16}}>
            {[
              {icon:"✋",label:"Hand length",val:"6 mm",note:"Fingers forming, still slightly webbed"},
              {icon:"🦶",label:"Foot length",val:"5 mm",note:"Tiny toes just beginning to bud"},
              {icon:"❤️",label:"Heart rate",val:"~160 bpm",note:"Nearly twice yours. Never stopped since week 6"},
              {icon:"🧠",label:"Neurons/min",val:"~100",note:"New brain cells forming every minute"},
            ].map((c,i)=>(
              <div key={i} style={{background:"var(--cream2)",borderRadius:14,padding:"14px 13px",display:"flex",flexDirection:"column",gap:6}}>
                <div style={{fontSize:22}}>{c.icon}</div>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"var(--muted)"}}>{c.label}</div>
                <div style={{fontFamily:"'Lora',serif",fontSize:18,color:"var(--ink)",fontWeight:400}}>{c.val}</div>
                <div style={{fontSize:10,color:"var(--muted)",lineHeight:1.5}}>{c.note}</div>
              </div>
            ))}
          </div>

          {/* What's happening */}
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
        </>}

        {tab==="senses" && <>
          <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.65,marginBottom:16}}>At week 8 your baby's sensory world is just beginning to form. Some are already active, others are wiring up.</div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:16}}>
            {[
              {ico:"🤚",name:"Touch",status:"active",col:"var(--rose)",bg:"var(--rose-pale)",bdr:"var(--rose-bdr)",desc:"Skin receptors forming. Already curls away from stimulation."},
              {ico:"👁",name:"Sight",status:"forming",col:"var(--navy)",bg:"var(--navy-pale)",bdr:"var(--navy-bdr)",desc:"Eyes forming but fused shut. Can sense light by week 22."},
              {ico:"👂",name:"Hearing",status:"forming",col:"var(--navy)",bg:"var(--navy-pale)",bdr:"var(--navy-bdr)",desc:"Inner ear forming now. Will hear your voice from week 18–20."},
              {ico:"👅",name:"Taste",status:"later",col:"var(--muted)",bg:"var(--cream2)",bdr:"var(--bdr)",desc:"Taste buds form week 13–15. Will taste what you eat."},
            ].map((s,i)=>(
              <div key={i} style={{background:s.bg,border:`1px solid ${s.bdr}`,borderRadius:14,padding:"14px 12px"}}>
                <div style={{fontSize:22,marginBottom:8}}>{s.ico}</div>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                  <div style={{fontSize:12,fontWeight:600,color:"var(--ink)"}}>{s.name}</div>
                  <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:s.col,background:"rgba(255,255,255,0.6)",borderRadius:100,padding:"2px 7px"}}>{s.status}</div>
                </div>
                <div style={{fontSize:11,color:"var(--muted)",lineHeight:1.55}}>{s.desc}</div>
              </div>
            ))}
          </div>

          {/* Womb connection */}
          <div style={{background:"linear-gradient(135deg,#0a2020,#183535)",borderRadius:16,padding:"16px 18px",marginBottom:12}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color:"rgba(112,200,184,0.7)",marginBottom:8}}>Womb connection</div>
            <div style={{fontFamily:"'Lora',serif",fontSize:14,fontStyle:"italic",color:"rgba(255,255,255,0.82)",lineHeight:1.75}}>"Your baby can feel you moving. Your heartbeat is already their lullaby. The rhythm you've had all your life is the first sound they'll ever know."</div>
          </div>

          <div className="p-card pc-white" style={{fontSize:12,color:"var(--muted)",lineHeight:1.65}}>
            <strong style={{color:"var(--ink)",fontWeight:600}}>Something to start now:</strong> From around week 18, your baby will recognise sounds they've heard repeatedly. If you or your partner speak the same phrase, hum the same tune, or play the same song every day — baby may recognise it after birth. That's not superstition. That's memory beginning.
          </div>
        </>}
      </div>
    </div>
  );
}

function BodyPanel({ onLogMood }) {
  const [logged, setLogged] = useState({});
  const logMood = (emoji) => {
    const key = emoji.split(" ")[0]; // just the emoji char
    setLogged(p=>({...p,[key]:true}));
    if (onLogMood) onLogMood(key);
  };
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
      {["😰 Anxious every day","😴 Bone-tired","🤢 Constantly nauseous","😭 Randomly teary","😤 Nobody understands","🤍 Quietly excited","😕 Guilty for resting","🌀 Overwhelmed"].map(e=>{
        const key = e.split(" ")[0];
        return <div key={e} className={`em-pill${logged[key]?" logged":""}`} onClick={()=>logMood(e)}>{e}{logged[key]?" ✓":""}</div>;
      })}
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

function PartnerPanel() {
  const [done, setDone] = useState({});
  const toggle = id => setDone(p=>({...p,[id]:!p[id]}));
  const missions = [
    {id:1,title:"Stock ginger biscuits and coconut water at home",why:"Nausea peaks at week 8. Having these without being asked is worth more than you know.",tag:"Essential",col:"#c04040"},
    {id:2,title:"Take over one meal this week — don't ask, just do it",why:"The smell of cooking is often unbearable right now. Doing this once, without prompting, feels enormous to her.",tag:"High impact",col:"#8a5010"},
    {id:3,title:"Ask her one real question tonight",why:"Not 'how are you?' Try: 'What's the scariest thing on your mind right now?' Then just listen. Don't fix.",tag:"Emotional",col:"var(--navy)"},
    {id:4,title:"Book the TVS dating scan if she hasn't already",why:"Should happen between weeks 7–10. Offer to make the call and come along.",tag:"Action",col:"var(--plum)"},
  ];
  const doneCount = Object.values(done).filter(Boolean).length;

  return <>
    <div style={{background:"linear-gradient(135deg,#eaf2f8,#d8e8f5)",borderRadius:16,padding:"16px 18px",marginBottom:16}}>
      <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color:"var(--navy)",marginBottom:6}}>Week 8 · For partners</div>
      <div style={{fontFamily:"'Lora',serif",fontSize:16,color:"#1a2a40",lineHeight:1.6,fontWeight:400}}>She's doing something extraordinary. Here's what actually matters this week — specific, not generic.</div>
    </div>

    <div className="p-card pc-white" style={{marginBottom:16}}>
      <div style={{fontSize:13,fontWeight:600,color:"var(--ink)",marginBottom:8}}>What she's going through right now</div>
      <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.7}}>She feels sick most of the day — not just morning. She's more exhausted than she's let on. She's carrying enormous anxiety about whether everything is okay, all while looking completely normal to everyone around her.<br/><br/>She doesn't need solutions. She needs presence.</div>
    </div>

    <div className="p-lbl" style={{color:"var(--navy)"}}>Your missions this week</div>

    {missions.map(m=>(
      <div key={m.id}
        onClick={()=>toggle(m.id)}
        style={{display:"flex",gap:12,alignItems:"flex-start",background:done[m.id]?"var(--cream2)":"#fff",border:"1px solid var(--bdr)",borderRadius:14,padding:"14px 15px",marginBottom:9,cursor:"pointer",opacity:done[m.id]?0.7:1,transition:"all 0.15s"}}>
        <div style={{width:22,height:22,borderRadius:"50%",border:`1.5px solid ${done[m.id]?"var(--navy)":"var(--bdr)"}`,background:done[m.id]?"var(--navy)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,transition:"all 0.15s"}}>
          {done[m.id]&&<span style={{color:"#fff",fontSize:10,fontWeight:700}}>✓</span>}
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:500,color:"var(--ink)",lineHeight:1.35,marginBottom:4,textDecoration:done[m.id]?"line-through":"none"}}>{m.title}</div>
          <div style={{fontSize:11,color:"var(--muted)",lineHeight:1.55,marginBottom:5}}>{m.why}</div>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:m.col}}>{m.tag}</div>
        </div>
      </div>
    ))}

    {/* Progress */}
    <div style={{background:"var(--navy-pale)",border:"1px solid var(--navy-bdr)",borderRadius:14,padding:"13px 16px",display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
      <div style={{fontFamily:"'Lora',serif",fontSize:18,color:"var(--navy)",fontWeight:400,flexShrink:0}}>{doneCount}/4</div>
      <div style={{flex:1,height:6,background:"rgba(42,74,112,0.12)",borderRadius:100,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${doneCount/4*100}%`,background:"var(--navy)",borderRadius:100,transition:"width 0.3s"}}/>
      </div>
      <div style={{fontSize:11,color:"var(--navy)",fontWeight:600,flexShrink:0}}>
        {["Partner points","Keep going","Halfway!","Almost!","Week done 🎉"][doneCount]}
      </div>
    </div>

    <div className="p-card pc-teal">
      <div style={{fontSize:12,fontWeight:700,color:"var(--teal)",marginBottom:6}}>What not to say this week</div>
      {["\"You're overthinking this.\"","\"Other women manage fine.\"","\"Just eat something.\"","\"You don't look sick.\""].map((s,i)=>(
        <div key={i} style={{fontSize:12,color:"var(--teal)",lineHeight:1.6,display:"flex",gap:8,marginBottom:3}}>
          <span style={{opacity:0.5,flexShrink:0}}>✗</span>{s}
        </div>
      ))}
    </div>
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
  const today = istDate();

  const loadNutr = () => {
    try {
      const raw = localStorage.getItem(NUTR_KEY);
      const data = raw ? JSON.parse(raw) : {};
      // Reset if new day OR if old format (stored numbers instead of null/true/false)
      if (data.date !== today || typeof data.protein === "number" || typeof data.water === "number") {
        return { date: today, protein: null, water: null };
      }
      return data;
    } catch { return { date: today, protein: null, water: null }; }
  };
  const saveNutr = (data) => {
    try { localStorage.setItem(NUTR_KEY, JSON.stringify(data)); } catch {}
  };

  const [nutr, setNutr] = useState(loadNutr);

  const log = (key, val) => {
    setNutr(p => {
      const next = { ...p, [key]: val };
      saveNutr(next);
      return next;
    });
  };

  const METERS = [
    {
      key: "protein",
      icon: "🥚",
      name: "Protein",
      target: "60g / day",
      color: "var(--forest)",
      note: "Most under-consumed nutrient in Indian pregnancies. Dal, curd, paneer, or eggs at every meal.",
    },
    {
      key: "water",
      icon: "💧",
      name: "Water",
      target: "3L / day",
      color: "var(--navy)",
      note: "Dehydration worsens nausea. Sip constantly rather than large amounts at once.",
    },
  ];

  return <>
    <div className="p-lbl" style={{color:"var(--forest)"}}>Today's targets</div>
    <div className="nutr-meters">
      {METERS.map(m => {
        const val = nutr[m.key]; // null = not logged, true = yes, false = no
        return (
          <div key={m.key} className="nutr-meter">
            <div className="nutr-meter-top">
              <div className="nutr-meter-left">
                <div className="nutr-meter-icon">{m.icon}</div>
                <div>
                  <div className="nutr-meter-name">{m.name}</div>
                  <div className="nutr-meter-target">Week 8 · {m.target}</div>
                </div>
              </div>
              {/* Status indicator */}
              {val === true  && <div style={{fontSize:11,fontWeight:600,color:"var(--forest)",display:"flex",alignItems:"center",gap:4}}>✓ Done today</div>}
              {val === false && <div style={{fontSize:11,fontWeight:600,color:"var(--rose)",display:"flex",alignItems:"center",gap:4}}>Not yet</div>}
            </div>

            {/* Progress bar */}
            <div className="nutr-track" style={{marginBottom:10}}>
              <div className="nutr-fill" style={{
                width: val === true ? "100%" : val === false ? "0%" : "0%",
                background: val === true ? m.color : "var(--rose)"
              }}/>
            </div>

            {/* Yes / No buttons — show when not logged OR when said not yet */}
            {(val === null || val === false) && (
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>log(m.key, true)}
                  style={{flex:1,background:m.color,color:"#fff",border:"none",borderRadius:100,padding:"9px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                  ✓ Yes, I did
                </button>
                <button onClick={()=>log(m.key, false)}
                  style={{flex:1,background:val===false?"var(--rose-pale)":"var(--cream2)",color:val===false?"var(--rose)":"var(--muted)",border:`1px solid ${val===false?"var(--rose-bdr)":"var(--bdr)"}`,borderRadius:100,padding:"9px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                  Not yet
                </button>
              </div>
            )}

            {/* Change answer */}
            {val !== null && (
              <button onClick={()=>log(m.key, null)}
                style={{background:"none",border:"none",fontSize:10,color:"var(--muted)",cursor:"pointer",fontFamily:"inherit",padding:0,opacity:0.7}}>
                Change
              </button>
            )}

            <div className="nutr-note">{m.note}</div>
          </div>
        );
      })}
    </div>

    <div className="p-card pc-sage" style={{marginBottom:16}}><strong>Keeping something down matters more than eating perfectly.</strong> Small amounts constantly beats three perfect meals. Don't let anyone make you feel guilty about surviving on crackers.</div>
    <div className="india-chip">🇮🇳 Indian kitchen guide</div>
    <div className="p-lbl" style={{color:"var(--forest)",marginTop:10}}>Your best friends right now</div>
    {[
      {ico:"🌰",nm:"Almonds & walnuts soaked overnight",note:"Best absorbed when soaked. A handful is enough — protein, omega-3, healthy fats."},
      {ico:"🍚",nm:"Poha, idli, dhokla, fresh paneer, vermicelli, avocado",note:"Mild, easy to digest. Excellent sources of protein and complex carbs."},
      {ico:"🥥",nm:"Coconut water",note:"Natural electrolytes, relieves nausea. 1–2 tender coconuts a day."},
      {ico:"🍶",nm:"Curd, yogurt, buttermilk",note:"Probiotics support gut health. Room temperature is better than cold."},
      {ico:"🍎",nm:"Apple, orange, pear",note:"Gentle on the stomach. Vitamin C helps iron absorption — eat with iron-rich foods."},
      {ico:"🥗",nm:"Moong dal, khichdi, green vegetables, salad",note:"Complete protein and fibre. Add ghee to khichdi — it helps nutrient absorption."},
    ].map((f,i)=>(
      <div key={i} className="f-row"><div className="f-ico">{f.ico}</div><div><div className="f-name">{f.nm}</div><div className="f-note">{f.note}</div></div></div>
    ))}
    <div className="p-lbl" style={{color:"#c04040",marginTop:18}}>Avoid right now</div>
    {[
      {ico:"🍈",nm:"Raw / unripe papaya",note:"Known uterine stimulant. Avoid entirely."},
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
    const album  = aspect === "album"  ? exportCrop("album",  scale, pos, cropBox) : savedCrops.album;
    const finalSquare = square || savedCrops.square;
    if (!finalSquare) return;
    onConfirm({ square: finalSquare, album: album || savedCrops.album || null });
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

function JournalPanel({ entries, setEntries, initialTab, moodLog }) {
  const [tab,  setTab]    = useState(initialTab || "write");
  const [text, setText]   = useState("");
  const [mood, setMood]   = useState(null);
  const [isShared, setIsShared] = useState(false);
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
    if (!text.trim()) return;
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
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:7}}>
                {/* PRIVACY TOGGLE */}
                <div className="privacy-toggle">
                  <button className={`privacy-btn${!isShared?" on":""}`} onClick={()=>setIsShared(false)}>🔒<span className="pb-label"> Only me</span></button>
                  <button className={`privacy-btn${isShared?" on":""}`} onClick={()=>setIsShared(true)}>👭<span className="pb-label"> Friends</span></button>
                </div>
                <button className="j-save-btn" onClick={save} disabled={!text.trim()} style={{opacity:text.trim()?1:0.4}}>Save ✓</button>
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

function SymptomPanel({ initialQuery }) {
  const [query, setQuery] = useState(initialQuery || "");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const QUICK = ["stomach tightening","headache","no movement felt","leg cramps","can't sleep","spotting","breathless"];

  const ask = async (q) => {
    const trimmed = (q || query).trim();
    if (!trimmed) return;
    setQuery(trimmed);
    setLoading(true);
    setResult(null);
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "x-api-key": (typeof window !== "undefined" && window.__ANTHROPIC_KEY__) || "",
          "anthropic-version":"2023-06-01",
          "anthropic-dangerous-direct-browser-access":"true",
        },
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:600,
          system:`You are Matri, a compassionate Indian pregnancy companion app. The user is 8 weeks pregnant (first trimester). When they describe a symptom or concern, respond in this exact JSON format with no other text:
{
  "symptom": "short name of the symptom",
  "likely": "most probable explanation in 1-2 sentences, reassuring and specific to week 8",
  "watch": "what to monitor or what would warrant a call — 1 sentence",
  "callNow": "specific red flags that mean call doctor immediately — 1 sentence, or null if none",
  "reassurance": "a warm closing sentence"
}`,
          messages:[{role:"user",content:trimmed}]
        })
      });
      const data = await resp.json();
      const text = data.content?.find(b=>b.type==="text")?.text || "";
      const clean = text.replace(/```json|```/g,"").trim();
      setResult(JSON.parse(clean));
    } catch {
      setResult({symptom:"Something went wrong",likely:"Unable to fetch a response. Please try again.",watch:null,callNow:null,reassurance:"If you're worried, always call your doctor — that's always the right call."});
    }
    setLoading(false);
  };

  useEffect(() => { if (initialQuery) ask(initialQuery); }, []);

  return <>
    <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.65,marginBottom:14,fontStyle:"italic"}}>
      Describe what you're feeling. Get a clear, honest answer — not a search results page.
    </div>

    {/* Search input */}
    <div className="symptom-bar-inner" style={{marginBottom:12,borderRadius:14}}>
      <span className="symptom-bar-icon">🔍</span>
      <input ref={inputRef} className="symptom-bar-input" placeholder="e.g. stomach tightening, can't sleep, spotting..." value={query} onChange={e=>setQuery(e.target.value)}
        onKeyDown={e=>{if(e.key==="Enter")ask();}}/>
      <button className="symptom-bar-btn" onClick={()=>ask()}>Ask</button>
    </div>

    {/* Quick chips */}
    <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
      {QUICK.map(q=>(
        <div key={q} onClick={()=>ask(q)} style={{background:"var(--cream2)",border:"1px solid var(--bdr)",borderRadius:100,padding:"5px 12px",fontSize:11,color:"var(--muted)",cursor:"pointer",transition:"all 0.15s"}}>{q}</div>
      ))}
    </div>

    {loading && <div className="symptom-loading">Thinking about week 8 specifically…</div>}

    {result && !loading && (
      <div className="symptom-result">
        <div className="symptom-result-q">You asked about: <strong>{result.symptom}</strong></div>
        <div className="symptom-tier">
          <div className="symptom-tier-dot" style={{background:"var(--forest)"}}/>
          <div><div className="symptom-tier-label" style={{color:"var(--forest)"}}>Most likely</div><div className="symptom-tier-text">{result.likely}</div></div>
        </div>
        {result.watch && <div className="symptom-tier">
          <div className="symptom-tier-dot" style={{background:"var(--amber)"}}/>
          <div><div className="symptom-tier-label" style={{color:"var(--amber)"}}>Watch for</div><div className="symptom-tier-text">{result.watch}</div></div>
        </div>}
        {result.callNow && <div className="symptom-tier">
          <div className="symptom-tier-dot" style={{background:"var(--rose)"}}/>
          <div><div className="symptom-tier-label" style={{color:"var(--rose)"}}>Call doctor if</div><div className="symptom-tier-text">{result.callNow}</div></div>
        </div>}
        <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid var(--cream2)",fontFamily:"'Lora',serif",fontSize:13,fontStyle:"italic",color:"var(--muted)",lineHeight:1.65}}>{result.reassurance}</div>
      </div>
    )}

    <div className="p-card pc-rose" style={{marginTop:4}}>
      <strong>Important:</strong> This is general guidance for week 8. It does not replace your doctor. If something feels wrong, trust that instinct and call.
    </div>
  </>;
}

/* ─── PANEL CONFIG ───────────────────────────────────────────────────── */
function MythPanel() {
  const myths = [
    {claim:"Eating papaya causes miscarriage",verdict:"Partly true",col:"var(--amber)",bg:"var(--amber-pale)",bdr:"var(--amber-bdr)",explanation:"Raw, unripe papaya contains latex which can trigger uterine contractions. Ripe papaya in small amounts is generally considered safe, but most doctors advise avoiding it entirely in the first trimester — not worth the risk."},
    {claim:"Saffron milk makes the baby fair",verdict:"False",col:"var(--rose)",bg:"var(--rose-pale)",bdr:"var(--rose-bdr)",explanation:"Skin colour is determined entirely by genetics. Saffron has no effect on the baby's complexion. That said, saffron milk in moderation is harmless and may help with sleep — just not for this reason."},
    {claim:"You should eat for two",verdict:"False",col:"var(--rose)",bg:"var(--rose-pale)",bdr:"var(--rose-bdr)",explanation:"In the first trimester you need almost no extra calories. By the third trimester, only about 300–450 extra calories per day — roughly one banana and a small bowl of dal. Overeating increases gestational diabetes risk."},
    {claim:"Sex during pregnancy harms the baby",verdict:"False",col:"var(--forest)",bg:"var(--forest-pale)",bdr:"var(--forest-bdr)",explanation:"For a normal pregnancy with no complications, sex is completely safe throughout. The baby is protected by the amniotic sac and cervical mucus plug. Your doctor will tell you if there are specific reasons to abstain."},
    {claim:"Sitting cross-legged affects the baby's position",verdict:"False",col:"var(--forest)",bg:"var(--forest-pale)",bdr:"var(--forest-bdr)",explanation:"There is no evidence that sitting cross-legged affects fetal positioning. Baby's position is determined by their own movement, the shape of your uterus, and your pelvic anatomy — not how you sit."},
    {claim:"A solar eclipse can cause birth defects",verdict:"False",col:"var(--forest)",bg:"var(--forest-pale)",bdr:"var(--forest-bdr)",explanation:"This is cultural belief with no scientific basis. UV radiation during an eclipse is no different from a regular cloudy day. You can go outside, eat, and carry on normally."},
    {claim:"Coconut water makes the baby's skin fair",verdict:"False",col:"var(--rose)",bg:"var(--rose-pale)",bdr:"var(--rose-bdr)",explanation:"Skin tone is genetic, full stop. Coconut water is genuinely good for hydration and electrolyte balance during pregnancy — drink it for those reasons, not for this one."},
    {claim:"Ghee helps with normal delivery",verdict:"Unproven",col:"var(--amber)",bg:"var(--amber-pale)",bdr:"var(--amber-bdr)",explanation:"There is no clinical evidence that consuming ghee in late pregnancy lubricates the birth canal or makes delivery easier. Ghee is a healthy fat and fine in moderation — but don't eat it for this purpose."},
    {claim:"AC and cold air harms the baby",verdict:"False",col:"var(--forest)",bg:"var(--forest-pale)",bdr:"var(--forest-bdr)",explanation:"Air conditioning is fine during pregnancy. Your body regulates temperature well, and the baby is insulated by amniotic fluid. In fact, overheating (especially in early pregnancy) is the actual concern — staying cool is beneficial."},
    {claim:"You can't exercise during pregnancy",verdict:"False",col:"var(--forest)",bg:"var(--forest-pale)",bdr:"var(--forest-bdr)",explanation:"Moderate exercise is actively recommended during a normal pregnancy. Walking, swimming, and prenatal yoga are excellent. Exercise reduces gestational diabetes risk, improves mood, and can shorten labour. Always check with your doctor first."},
  ];
  return <>
    <div style={{background:"var(--amber-pale)",border:"1px solid var(--amber-bdr)",borderRadius:14,padding:"14px 16px",marginBottom:16,fontSize:13,lineHeight:1.65}}>
      <strong>The rule:</strong> If advice comes from a relative but not your doctor, question it. Most pregnancy myths in India are well-meaning but wrong — and some cause unnecessary anxiety or harmful behaviour.
    </div>
    {myths.map((m,i)=>(
      <div key={i} style={{background:m.bg,border:`1px solid ${m.bdr}`,borderRadius:16,padding:"14px 16px",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,marginBottom:8}}>
          <div style={{fontSize:13,fontWeight:600,color:"var(--ink)",lineHeight:1.35,flex:1}}>"{m.claim}"</div>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:m.col,background:"rgba(255,255,255,0.7)",borderRadius:100,padding:"3px 10px",flexShrink:0,whiteSpace:"nowrap"}}>{m.verdict}</div>
        </div>
        <div style={{fontSize:12,color:"var(--muted)",lineHeight:1.65}}>{m.explanation}</div>
      </div>
    ))}
    <div className="p-card pc-white" style={{fontFamily:"'Lora',serif",fontSize:13,fontStyle:"italic",color:"var(--muted)",lineHeight:1.7,marginTop:4}}>
      You are allowed to say "that's not what my doctor said" to anyone — including your mother-in-law.
    </div>
  </>;
}

function PlanningPanel() {
  const [profile, setProfile] = useState(null);
  const profiles = [
    {id:"working",label:"Working full-time",icon:"💼"},
    {id:"wfh",label:"Working from home",icon:"🏠"},
    {id:"housewife",label:"Managing home full-time",icon:"🏡"},
    {id:"freelance",label:"Freelancer / self-employed",icon:"💻"},
  ];
  const content = {
    working: {
      title:"You're working full-time",
      intro:"Week 8 is one of the hardest weeks to be in an office. You're exhausted, nauseated, and keeping the biggest secret of your life.",
      sections:[
        {head:"This week at work",col:"var(--navy)",items:[
          "Keep crackers in your desk drawer. Eating every 90 minutes reduces nausea significantly.",
          "Identify the nearest private space to rest or feel sick — a quiet bathroom, an empty room.",
          "You don't have to tell your manager yet. Most women wait until after the 12-week scan.",
          "If you have a trusted colleague, consider telling one person so you're not completely alone.",
        ]},
        {head:"Your legal rights (India)",col:"var(--forest)",items:[
          "Maternity Benefit Act: 26 weeks paid leave for the first two children.",
          "Your employer cannot terminate or reduce your pay due to pregnancy.",
          "You're entitled to medical leave for pregnancy-related illness.",
          "Start reviewing your company policy now — leave applications often need advance notice.",
        ]},
        {head:"The mental load",col:"var(--rose)",items:[
          "Pregnancy brain is real — progesterone affects concentration and memory.",
          "Consider keeping a work notebook for tasks you'd normally remember easily.",
          "This is not incompetence. It is biology. It passes.",
        ]},
      ]
    },
    wfh: {
      title:"You're working from home",
      intro:"WFH during early pregnancy feels like a gift — until you realise the bathroom is 10 steps away and the kitchen smells are inescapable.",
      sections:[
        {head:"This week",col:"var(--navy)",items:[
          "Give yourself permission to lie down between calls. A 15-minute rest matters.",
          "Keep your camera off during nausea waves — you don't owe anyone an explanation.",
          "Eat before your first meeting. Empty stomach = worse nausea.",
          "Set a firm end time to your day. WFH boundaries matter more when you're exhausted.",
        ]},
        {head:"The hidden challenge",col:"var(--amber)",items:[
          "WFH can feel isolating even without pregnancy. With it, the silence can amplify anxiety.",
          "Schedule at least one real conversation per day — with a colleague, friend, or your partner.",
          "Getting dressed and sitting at a proper desk helps more than it sounds.",
        ]},
      ]
    },
    housewife: {
      title:"You're managing the home full-time",
      intro:"You're doing invisible work every day — and now you're doing it while growing a human. That deserves to be said out loud.",
      sections:[
        {head:"What needs to change this week",col:"var(--rose)",items:[
          "Heavy lifting, bending repeatedly, and standing for long periods should be minimised.",
          "Cooking smells are a known nausea trigger. Ask your partner or family to cook when possible.",
          "You are not lazy for resting. Rest is work right now.",
          "If you have household help, this is the time to use them more, not less.",
        ]},
        {head:"The things nobody acknowledges",col:"var(--plum)",items:[
          "Managing a home full-time while pregnant gets very little acknowledgement. It should.",
          "The expectation to 'keep the house running' doesn't pause for first trimester nausea.",
          "You're allowed to set a lower standard for yourself right now. The house will be fine.",
          "If family pressure is real — 'you should be fine, you're at home all day' — know this is wrong.",
        ]},
      ]
    },
    freelance: {
      title:"You're freelancing or self-employed",
      intro:"No paid leave. No HR department. No colleagues who notice when you're struggling. The freedom of freelancing cuts both ways during pregnancy.",
      sections:[
        {head:"Practical this week",col:"var(--navy)",items:[
          "Review your project pipeline — identify which deadlines fall in weeks 10–14 when nausea often peaks.",
          "Consider telling one or two trusted clients early — it buys goodwill and flexibility later.",
          "Start building a small financial buffer now if possible. Even ₹5,000 a month matters.",
          "Look into group health insurance plans — several are available for self-employed women.",
        ]},
        {head:"The mental weight",col:"var(--amber)",items:[
          "No maternity benefit. No guaranteed income during leave. This anxiety is completely rational.",
          "Planning now reduces it. Even a rough financial plan for 3 months post-delivery helps.",
          "Your clients don't own your body or your timeline. You are allowed to take time off.",
        ]},
      ]
    },
  };
  const plan = profile ? content[profile] : null;
  return <>
    {!profile ? <>
      <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.65,marginBottom:16}}>Pregnancy looks different depending on your daily life. Select what fits you best for guidance that's actually relevant.</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
        {profiles.map(p=>(
          <div key={p.id} onClick={()=>setProfile(p.id)}
            style={{background:"#fff",border:"1px solid var(--bdr)",borderRadius:16,padding:"18px 16px",cursor:"pointer",textAlign:"center",transition:"all 0.15s"}}>
            <div style={{fontSize:28,marginBottom:8}}>{p.icon}</div>
            <div style={{fontSize:12,fontWeight:600,color:"var(--ink)",lineHeight:1.35}}>{p.label}</div>
          </div>
        ))}
      </div>
    </> : <>
      <button onClick={()=>setProfile(null)} style={{background:"none",border:"none",padding:"0 0 14px",fontSize:12,fontWeight:600,color:"var(--muted)",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>← Change</button>
      <div style={{background:"var(--navy-pale)",border:"1px solid var(--navy-bdr)",borderRadius:14,padding:"14px 16px",marginBottom:16}}>
        <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"var(--navy)",marginBottom:5}}>{plan.title}</div>
        <div style={{fontFamily:"'Lora',serif",fontSize:14,fontStyle:"italic",color:"#1a2a40",lineHeight:1.65}}>{plan.intro}</div>
      </div>
      {plan.sections.map((s,i)=>(
        <div key={i} style={{marginBottom:16}}>
          <div className="p-lbl" style={{color:s.col}}>{s.head}</div>
          {s.items.map((item,j)=>(
            <div key={j} className="p-fact"><div className="p-dot" style={{background:s.col}}/><div style={{fontSize:13,lineHeight:1.65}}>{item}</div></div>
          ))}
        </div>
      ))}
    </>}
  </>;
}

function FearsPanel() {
  const [open, setOpen] = useState(null);
  const fears = [
    {id:"miscarriage",label:"Fear of miscarriage",icon:"💔",
      intro:"This fear is so common it's almost universal in the first trimester — and almost nobody talks about it.",
      body:"About 10–15% of known pregnancies end in miscarriage, mostly in the first 12 weeks. This statistic, which is meant to be reassuring, can feel terrifying when you're the one pregnant.\n\nThe hard truth: most miscarriages happen because of chromosomal issues in the embryo — not because of anything you did or didn't do. Not because you exercised, felt stressed, had an argument, didn't eat perfectly, or didn't want it enough at first.\n\nThe fear is real. Sitting with it — not suppressing it — is healthier than pretending it away. Let yourself feel it, talk to someone you trust, and know that reaching the heartbeat milestone at week 6–8 significantly reduces the risk.",
      note:"If you've had a previous miscarriage, this fear is even more acute. That's not anxiety — it's experience. Tell your doctor. Extra early monitoring is available and valid to ask for."},
    {id:"stillbirth",label:"Fear of stillbirth",icon:"🌧️",
      intro:"A fear most women have but feel they can't say out loud.",
      body:"Stillbirth (loss after 20 weeks) affects about 1 in 200 pregnancies — rarer than miscarriage, but the fear of it can be consuming, especially as the pregnancy progresses and you have more to lose.\n\nThe thing about this fear is that it often intensifies precisely when things are going well — because the more real the baby becomes, the more there is to be afraid of losing.\n\nKick counting from week 28 onward is the most practical thing you can do — not because it prevents anything, but because it gives you information and agency. Any significant change in movement is a reason to call your doctor immediately.",
      note:"This fear is especially intense for women who have experienced loss before, or who have family members who have. You are not catastrophising. You are loving someone you haven't met yet."},
    {id:"deformities",label:"Worry about the baby's health",icon:"🧬",
      intro:"The scan anxiety nobody prepares you for.",
      body:"The worry that something might be wrong with your baby is one of the most universal and least discussed fears in pregnancy. Most women Google symptoms obsessively, dread every scan, and feel a particular kind of suspended dread in the days between a scan and its results.\n\nThe NT scan at 11–14 weeks and the anomaly scan at 18–20 weeks screen for the most common chromosomal and structural concerns. Most of the time, everything is fine. But \"most of the time\" doesn't feel comforting when you're the one waiting.\n\nWhat helps: knowing what each scan does and doesn't show, having a support person at appointments, and having a plan for how you'd handle different results — not because the worst is likely, but because having thought about it reduces its power.",
      note:"If you have a family history of genetic conditions or are over 35, talk to your doctor about genetic counselling. Knowledge is less frightening than uncertainty."},
    {id:"labour",label:"Fear of labour pain",icon:"😨",
      intro:"The fear everyone has but many feel embarrassed to admit.",
      body:"Labour is painful. There is no gentle way to say this, and pretending otherwise doesn't help. But there is a large difference between pain with no end and pain with a known purpose and timeline.\n\nWhat actually helps: understanding what's happening at each stage (your body knows what to do — this is not an emergency, it's a physiological process), learning about pain management options well before the due date, and choosing a birth environment where you feel safe.\n\nEpidurals are not failure. Pain relief is not weakness. Natural birth is not morally superior. You get to decide what feels right for you — and that decision should be made without guilt from anyone.\n\nWomen who prepare — who understand what's coming, who have practiced breathing, who know their options — consistently report more positive birth experiences.",
      note:"A birth preferences document (not a rigid birth plan) that you discuss with your doctor around week 30–32 is one of the best ways to reduce birth-related anxiety."},
    {id:"csection",label:"Fear of C-section",icon:"🏥",
      intro:"Whether you want one or are afraid of having one — both fears are valid.",
      body:"Some women fear being forced into a C-section. Others fear vaginal birth and want a C-section but feel judged for it. Both are legitimate positions.\n\nC-section is major abdominal surgery. Recovery takes 6–8 weeks and is genuinely harder than most people are told. It is not the 'easy way out' — that phrase should never be used.\n\nAt the same time, when medically indicated, C-sections save lives. India has both too-high C-section rates in some private hospitals and dangerously low access in others.\n\nThe most useful thing you can do: understand your hospital's C-section rate, understand what conditions typically warrant one, and make your preferences known early — while remaining open to medical reality.",
      note:"If you've had a previous C-section, discuss VBAC (vaginal birth after caesarean) options with your doctor early. It's a valid option for many women."},
    {id:"badmom",label:"Fear of being a bad mother",icon:"🤍",
      intro:"This fear usually starts the moment you see the positive test.",
      body:"The fear that you won't be good enough — patient enough, present enough, loving enough, natural enough — is so universal that its absence would be more remarkable.\n\nHere is what the research consistently shows: the fact that you're worried about being a good mother is one of the strongest predictors that you will be one. Neglectful or harmful parents typically don't lie awake worrying about this.\n\nYou don't have to feel instant, overwhelming love the moment you give birth. Bonding is a process, not an event. Many women feel disconnected from their newborn at first — and then fall completely in love over days or weeks. This is normal.\n\nYou are allowed to be imperfect. Your child doesn't need a perfect mother. They need a present one.",
      note:"Postnatal depression affects 10–15% of new mothers in India and is vastly underdiagnosed. If you feel persistently low, disconnected, or anxious after birth — please talk to your doctor. It is treatable and asking for help is not weakness."},
    {id:"body",label:"Fear about your body changing",icon:"🪞",
      intro:"A fear that gets dismissed too easily.",
      body:"Worrying about your body changing during pregnancy is treated as something shallow — something you should feel ashamed of feeling. You shouldn't.\n\nYour body is going to change significantly. Some of it is temporary. Some of it is permanent. Stretch marks, abdominal muscle separation (diastasis recti), changes to your breasts, your core strength, your weight distribution — these are real, and pretending they don't matter doesn't help.\n\nWhat does help: understanding what changes are temporary and which are permanent, knowing which physical changes can be addressed postnatally with appropriate physiotherapy, and accepting that growing and birthing a human being has physical consequences — and that this is not a failure of your body but evidence of what it did.\n\nYou are allowed to grieve the body you had before while simultaneously being grateful for what your body is doing.",
      note:"Diastasis recti (abdominal separation) affects most pregnant women and can persist postnatally. A women's health physiotherapist, not just any gym trainer, should assess this before you return to core exercise after birth."},
    {id:"career",label:"Fear about career impact",icon:"📊",
      intro:"The fear that's entirely rational — because the impact is real.",
      body:"The career penalty for motherhood is documented and real. Women's earnings typically dip after having a child. Promotions slow. Professional networks shrink during leave. Re-entry after a career break is harder than employers like to admit.\n\nFeeling afraid of this is not selfish. It is sensible. You are allowed to want both a child and a career, and to grieve the trade-offs that exist between them.\n\nWhat helps: knowing your legal rights (maternity leave, protection from discriminatory termination), having an explicit conversation with your manager about return-to-work plans before you leave, keeping your professional network warm during leave, and — where possible — choosing an employer who has demonstrably supported mothers' careers.\n\nYou do not have to pretend the sacrifice isn't real. And you do not have to sacrifice more than is necessary.",
      note:"India's Maternity Benefit Act (2017) applies to establishments with 10+ employees. It provides 26 weeks paid leave for the first two children and mandates crèche facilities for certain employers. Know your rights."},
  ];

  return <>
    <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.65,marginBottom:16,fontStyle:"italic"}}>
      The fears most women have but rarely say out loud. You are not alone in any of these.
    </div>
    {fears.map(f=>(
      <div key={f.id} style={{marginBottom:9}}>
        <div onClick={()=>setOpen(open===f.id?null:f.id)}
          style={{background:open===f.id?"var(--ink)":"#fff",border:"1px solid var(--bdr)",borderRadius:open===f.id?"16px 16px 0 0":16,padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,transition:"all 0.15s"}}>
          <span style={{fontSize:20,flexShrink:0}}>{f.icon}</span>
          <div style={{flex:1,fontSize:13,fontWeight:600,color:open===f.id?"#fff":"var(--ink)",lineHeight:1.3}}>{f.label}</div>
          <span style={{fontSize:12,color:open===f.id?"rgba(255,255,255,0.4)":"var(--muted)",flexShrink:0}}>{open===f.id?"▲":"▼"}</span>
        </div>
        {open===f.id&&(
          <div style={{background:"var(--ink)",borderRadius:"0 0 16px 16px",padding:"0 16px 18px",border:"1px solid #2a1a14",borderTop:"none"}}>
            <div style={{fontFamily:"'Lora',serif",fontSize:13,fontStyle:"italic",color:"rgba(255,255,255,0.65)",lineHeight:1.65,marginBottom:12,paddingTop:4}}>{f.intro}</div>
            {f.body.split("\n\n").map((para,i)=>(
              <div key={i} style={{fontSize:13,color:"rgba(255,255,255,0.78)",lineHeight:1.75,marginBottom:10}}>{para}</div>
            ))}
            {f.note&&<div style={{background:"rgba(255,255,255,0.06)",borderRadius:12,padding:"11px 14px",fontSize:12,color:"rgba(255,255,255,0.5)",lineHeight:1.65,marginTop:6,fontStyle:"italic"}}>{f.note}</div>}
          </div>
        )}
      </div>
    ))}
  </>;
}

const PANELS = {
  baby:      { label:"Your baby",        title:<>1.6cm · <em>tip of your thumb</em></>,         headBg:"#1a1210",           lblCol:"#f0a07a",       titleCol:"#fff",        dark:true,  Panel:BabyPanel,    noScroll:true },
  body:      { label:"Your body",        title:<>What you're feeling is <em>real</em></>,        headBg:"var(--rose-pale)",  lblCol:"var(--rose)",   titleCol:"var(--ink)",  dark:false, Panel:BodyPanel },
  "3am":     { label:"3am searches",     title:<>What everyone <em>Googles</em></>,               headBg:"#1a1210",           lblCol:"#f0a07a",       titleCol:"#fff",        dark:true,  Panel:ThreeAmPanel },
  ntty:      { label:"Nobody tells you", title:<>What nobody <em>tells you</em></>,               headBg:"var(--plum-pale)",  lblCol:"var(--plum)",   titleCol:"var(--ink)",  dark:false, Panel:NobodyTellsPanel },
  wins:      { label:"This week's win",  title:<>You made it to <em>week 8</em></>,               headBg:"#181830",           lblCol:"#b0a0f0",       titleCol:"#fff",        dark:true,  Panel:WinsPanel },
  partner:   { label:"For your partner", title:<>What your partner <em>should know</em></>,           headBg:"var(--navy-pale)",  lblCol:"var(--navy)",   titleCol:"var(--ink)",  dark:false, Panel:PartnerPanel },
  food:      { label:"Nutrition",        title:<>Food when nothing <em>appeals</em></>,           headBg:"var(--forest-pale)",lblCol:"var(--forest)", titleCol:"var(--ink)",  dark:false, Panel:FoodPanel },
  medical:   { label:"Medical",          title:<>What needs to happen <em>now</em></>,            headBg:"var(--slate-pale)", lblCol:"var(--slate)",  titleCol:"var(--ink)",  dark:false, Panel:MedPanel },
  checklist: { label:"Checklist this week", title:<>Seven things. <em>That's it.</em></>,            headBg:"var(--amber-pale)", lblCol:"var(--amber)",  titleCol:"var(--ink)",  dark:false, Panel:null },
  journal:   { label:"Journal",          title:<>Your pregnancy <em>story</em></>,                headBg:"#0a2020",           lblCol:"#70c8b8",       titleCol:"#fff",        dark:true,  Panel:JournalPanel, noScroll:true },
  stories:   { label:"Stories",          title:<>Women who've been <em>right here</em></>,        headBg:"#1e1030",           lblCol:"#c8a0f0",       titleCol:"#fff",        dark:true,  Panel:StoriesPanel },
  symptom:   { label:"How are you feeling?", title:<>Is this <em>normal</em>?</>,                  headBg:"var(--cream2)",     lblCol:"var(--rose)",   titleCol:"var(--ink)",  dark:false, Panel:null },
  myth:      { label:"Myth busting",         title:<>True, false, or <em>complicated</em></>,       headBg:"var(--amber-pale)", lblCol:"var(--amber)",  titleCol:"var(--ink)",  dark:false, Panel:MythPanel },
  planning:  { label:"Life planning",        title:<>Pregnancy and <em>your daily life</em></>,     headBg:"var(--navy-pale)",  lblCol:"var(--navy)",   titleCol:"var(--ink)",  dark:false, Panel:PlanningPanel },
  fears:     { label:"Real fears",           title:<>The things nobody <em>admits</em></>,          headBg:"var(--ink)",        lblCol:"rgba(255,200,180,0.7)", titleCol:"#fff", dark:true, Panel:FearsPanel },
};

/* ─── QUICK ADD ENTRY ─────────────────────────────────────────────────── */
function QuickAddEntry({ entries, setEntries, onClose }) {
  const [text, setText] = useState("");
  const [mood, setMood] = useState(null);
  const today = istDate();
  const save = () => {
    if (!text.trim()) return;
    setEntries(p => [{id:Date.now(),week:8,date:today,mood:mood||"😊",text:text.trim(),photos:[],heroBg:"linear-gradient(135deg,#e8f5f5,#d0ecec)",heroEmoji:"📝",heroBgColor:"#e0f5f5"},...p]);
    onClose();
  };
  return (
    <div>
      <textarea className="j-textarea" rows={4} value={text} onChange={e=>setText(e.target.value)}
        placeholder="Write anything... a fear, a hope, what you want to remember today..."/>
      <div className="j-save-row" style={{marginTop:10}}>
        <div>
          <div style={{fontSize:10,color:"var(--muted)",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:600}}>Mood</div>
          <div className="j-mood-row">{MOODS.map(m=><span key={m} className={`j-mood${mood===m?" on":""}`} onClick={()=>setMood(m)}>{m}</span>)}</div>
        </div>
        <button className="j-save-btn" onClick={save} disabled={!text.trim()} style={{opacity:text.trim()?1:0.4}}>Save ✓</button>
      </div>
    </div>
  );
}

/* ─── LIBRARY VIEW ────────────────────────────────────────────────────── */
const MILESTONES = [
  {wk:6,name:"Heartbeat",done:true},{wk:7,name:"Dating scan",done:true},{wk:8,name:"You are here",current:true},
  {wk:10,name:"Blood tests",done:false},{wk:12,name:"12-wk scan",done:false},{wk:14,name:"T2 begins",done:false},
  {wk:16,name:"Movements",done:false},{wk:20,name:"Anomaly scan",done:false},{wk:24,name:"GTT test",done:false},
  {wk:28,name:"T3 begins",done:false},{wk:32,name:"Growth scan",done:false},{wk:36,name:"Final prep",done:false},
  {wk:40,name:"Due date",done:false},
];

/* ─── SHAREABLE WEEK STRIP ──────────────────────────────────────────────── */
function ShareableStrip({ entries }) {
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const byWeek = entries.reduce((a,e)=>{ if(!a[e.week])a[e.week]=[]; a[e.week].push(e); return a; },{});
  const weeks  = Object.entries(byWeek).sort(([a],[b])=>Number(a)-Number(b));

  // Load any photo src → base64 data URL
  const loadImg = (src) => new Promise(resolve => {
    if (!src || typeof src !== "string") return resolve(null);
    if (src.startsWith("data:")) return resolve(src);
    if (src.startsWith("blob:")) {
      fetch(src).then(r=>r.blob()).then(blob=>{
        const rd = new FileReader();
        rd.onload = ()=>resolve(rd.result);
        rd.onerror = ()=>resolve(null);
        rd.readAsDataURL(blob);
      }).catch(()=>resolve(null));
    } else resolve(null);
  });

  // Draw an image with rounded corners onto a canvas, return data URL
  const roundedImageDataUrl = (imgEl, w, h, r) => {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(r, 0); ctx.lineTo(w-r, 0);
    ctx.quadraticCurveTo(w, 0, w, r);
    ctx.lineTo(w, h-r); ctx.quadraticCurveTo(w, h, w-r, h);
    ctx.lineTo(r, h); ctx.quadraticCurveTo(0, h, 0, h-r);
    ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath(); ctx.clip();
    ctx.drawImage(imgEl, 0, 0, w, h);
    return c.toDataURL("image/jpeg", 0.85);
  };

  // Load and round an image from a data/blob URL
  const loadRoundedImg = (src, w, h, r=20) => new Promise(async resolve => {
    const data = await loadImg(src);
    if (!data) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(roundedImageDataUrl(img, w, h, r));
    img.onerror = () => resolve(null);
    img.src = data;
  });

  const generatePDF = async () => {
    setGenerating(true);
    try {
      if (!window.jspdf) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
          s.onload = resolve; s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      const { jsPDF } = window.jspdf;

      // A4 portrait, mm units
      const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
      const W = 210, H = 297, M = 12, CW = W - M*2;

      // ─── COLOUR PALETTE ───────────────────────────────────────────────
      const BG       = [10,  32,  32];   // dark teal
      const BG2      = [18,  50,  50];
      const CARD_BG  = [20,  44,  44];
      const ACCENT   = [112,200,184];    // teal highlight
      const ROSE     = [191, 82,  64];
      const ROSE_L   = [253,240,236];    // rose pale
      const TEAL_L   = [232,245,245];
      const PLUM_L   = [248,238,251];
      const NAVY_L   = [234,240,248];
      const AMBER_L  = [253,243,228];
      const WHITE    = [255,255,255];
      const MUTED    = [180,160,155];
      const INK      = [26,  18,  16];
      const DIVIDER  = [40,  70,  70];

      const CARD_COLORS = [ROSE_L, TEAL_L, PLUM_L, NAVY_L, AMBER_L];
      const CARD_ACCENTS= [
        [191,82,64],[26,96,96],[98,32,112],[42,74,112],[138,80,16]
      ];

      // ─── HELPERS ──────────────────────────────────────────────────────
      const fill  = (col) => doc.setFillColor(...col);
      const draw  = (col) => doc.setDrawColor(...col);
      const txt   = (col) => doc.setTextColor(...col);
      const font  = (sz, st="normal") => { doc.setFont("helvetica", st); doc.setFontSize(sz); };
      const lw    = (w)   => doc.setLineWidth(w);

      // Rounded rect helper
      const rr = (x,y,w,h,r,style="F") => doc.roundedRect(x,y,w,h,r,r,style);

      // Wrap text and return y after drawing
      const drawWrapped = (text, x, y, maxW, lineH) => {
        const lines = doc.splitTextToSize(text, maxW);
        doc.text(lines, x, y);
        return y + lines.length * lineH;
      };

      // Page background fill
      const fillPage = () => {
        fill(BG); doc.rect(0,0,W,H,"F");
        // subtle gradient-like overlay at bottom
        fill(BG2); doc.rect(0, H*0.6, W, H*0.4, "F");
      };

      let page = 1;
      const newPage = () => {
        doc.addPage(); page++;
        fillPage();
        return M + 6;
      };
      const checkY = (y, need) => y + need > H - M ? newPage() : y;

      // ─── COVER PAGE ───────────────────────────────────────────────────
      fillPage();

      // Matri wordmark area
      fill(ACCENT); rr(M, 22, 26, 8, 2);
      font(7,"bold"); txt(BG);
      doc.text("M", M+9, 27.5);
      font(8,"bold"); txt(ACCENT);
      doc.text("MATRI", M+14, 27.5);
      font(7,"normal"); txt([...ACCENT,160]);
      doc.text("Pregnancy Journal", M+36, 27.5);

      // Big title
      font(38,"bold"); txt(WHITE);
      doc.text("The", M, 72);
      font(38,"bold"); txt(ACCENT);
      doc.text("Wait.", M+28, 72);

      font(16,"italic"); txt(MUTED);
      doc.text("A pregnancy story.", M, 84);

      // Horizontal divider
      lw(0.3); draw(DIVIDER);
      doc.line(M, 92, W-M, 92);

      // Stats cards
      const stats = [
        { val: String(entries.length), sub: entries.length===1?"memory":"memories", col: ACCENT },
        { val: String(weeks.length),   sub: weeks.length===1?"week":"weeks",         col: ROSE },
        { val: weeks[0]?.[0] ? `Wk ${weeks[0][0]}–${weeks[weeks.length-1][0]}` : "—",
          sub: "documented", col: ACCENT },
      ];
      stats.forEach((s, i) => {
        const sx = M + i * 60;
        fill(CARD_BG); rr(sx, 98, 54, 22, 3);
        font(15,"bold"); txt(s.col);
        doc.text(s.val, sx+5, 110);
        font(7,"normal"); txt(MUTED);
        doc.text(s.sub, sx+5, 116);
      });

      // Date range
      if (entries.length) {
        font(9,"italic"); txt(MUTED);
        const last = entries[entries.length-1];
        doc.text(`${last.date} — ${entries[0].date}`, M, 134);
      }

      // Quote
      font(11,"italic"); txt(WHITE);
      doc.text('"The most ordinary extraordinary', M, 152);
      doc.text(' thing — growing a human being."', M, 162);

      // Decorative rose dot
      fill(ROSE); doc.circle(W-M-8, 48, 28, "F");
      fill(BG); doc.circle(W-M-8, 48, 22, "F");
      fill(ROSE); doc.circle(W-M-8, 48, 14, "F");

      // Footer
      lw(0.2); draw(DIVIDER); doc.line(M, H-18, W-M, H-18);
      font(7,"normal"); txt(ACCENT);
      doc.text("Made with Matri  ·  matri.care", M, H-10);
      font(7,"normal"); txt(MUTED);
      doc.text(`${entries.length} ${entries.length===1?"memory":"memories"}`, W-M, H-10, {align:"right"});

      // ─── TIMELINE PAGES ───────────────────────────────────────────────
      let y = newPage();

      // Page header
      const pageHeader = (y) => {
        font(7,"bold"); txt(ACCENT);
        doc.text("MATRI · PREGNANCY TIMELINE", M, y);
        font(7,"normal"); txt(MUTED);
        doc.text(`Page ${page}`, W-M, y, {align:"right"});
        lw(0.2); draw(DIVIDER);
        doc.line(M, y+3, W-M, y+3);
        return y + 10;
      };
      y = pageHeader(y);

      for (let wi = 0; wi < weeks.length; wi++) {
        const [wk, wentries] = weeks[wi];
        const baby = BABY_SIZES[Number(wk)] || null;
        const allMoods = [...new Set(wentries.map(e=>e.mood))].join(" ");
        const weekNum = Number(wk);
        const tri = weekNum<=12?"T1 · First Trimester":weekNum<=27?"T2 · Second Trimester":"T3 · Third Trimester";

        // ── Week banner ──
        y = checkY(y, 24);
        fill(CARD_BG); rr(M, y, CW, 20, 3);
        // left rose bar
        fill(ROSE); rr(M, y, 3, 20, 1.5);

        font(18,"bold"); txt(ACCENT);
        doc.text(String(wk), M+7, y+13);

        font(8,"bold"); txt(WHITE);
        doc.text(`Week of Pregnancy`, M+22, y+7);
        font(7,"normal"); txt(MUTED);
        doc.text(tri, M+22, y+13);
        if (baby) { doc.text(`${baby.compare} · ${baby.cm}`, M+22, y+18.5); }

        font(9,"normal"); txt(WHITE);
        doc.text(allMoods, W-M-3, y+11, {align:"right"});

        y += 24;

        // ── Entries ──
        for (let ei = 0; ei < wentries.length; ei++) {
          const entry = wentries[ei];
          const ci = (wi*3 + ei) % CARD_COLORS.length;
          const cardCol   = CARD_COLORS[ci];
          const accentCol = CARD_ACCENTS[ci];

          // Load photos (up to 2) with rounded corners
          const photoCandidates = (entry.photos||[])
            .map(p => photoSquare(p)||photoAlbum(p)||(typeof p==="string"&&(p.startsWith("data:")||p.startsWith("blob:"))?p:null))
            .filter(Boolean).slice(0,2);
          const photoDataUrls = await Promise.all(
            photoCandidates.map(src => loadRoundedImg(src, 400, 400, 48))
          );
          const validPhotos = photoDataUrls.filter(Boolean);

          // Estimate card height
          const textLines = doc.splitTextToSize(`"${entry.text}"`, CW-10).length;
          const photoH    = validPhotos.length ? 50 + 4 : 0;
          const cardH     = 10 + textLines*5 + photoH + 16;

          y = checkY(y, cardH + 4);
          if (y <= M+10) { y = pageHeader(y); }

          // Card background
          fill(cardCol); rr(M, y, CW, cardH, 4);
          // Left accent bar
          fill(accentCol); rr(M, y, 2.5, cardH, 1.5);

          // Date + mood on same line
          font(8,"bold"); txt(INK);
          const dp = (entry.date||"").split(" ");
          doc.text(dp[0]||"", M+6, y+7);
          font(8,"normal"); txt([...accentCol]);
          doc.text((dp.slice(1).join(" "))||"", M+13, y+7);

          if (entry.isShared) {
            font(6,"bold"); txt([26,96,96]);
            doc.text("PUBLIC", W-M-22, y+7);
          }
          font(10,"normal"); txt(INK);
          doc.text(entry.mood||"", W-M-6, y+7, {align:"right"});

          // Thin divider under date
          lw(0.15); draw([...accentCol, 60]);
          doc.line(M+6, y+9, W-M-6, y+9);

          // Entry text
          font(9,"italic"); txt(INK);
          const textY = y + 15;
          const afterTextY = drawWrapped(`"${entry.text}"`, M+6, textY, CW-10, 5);

          // Photos
          if (validPhotos.length) {
            let px = M+6;
            const photoW = validPhotos.length === 1 ? 60 : 52;
            const photoHpx = 44;
            validPhotos.forEach(imgData => {
              try {
                doc.addImage(imgData, "JPEG", px, afterTextY+2, photoW, photoHpx);
              } catch {}
              px += photoW + 4;
            });
          }

          y += cardH + 4;
        }

        // Spacing between weeks
        y += 4;

        // Week separator
        if (wi < weeks.length-1) {
          lw(0.15); draw(DIVIDER);
          doc.line(M+10, y, W-M-10, y);
          y += 6;
        }
      }

      // ─── CLOSING PAGE ─────────────────────────────────────────────────
      doc.addPage(); fillPage();

      fill(ROSE); doc.circle(W/2, 80, 30, "F");
      fill(BG); doc.circle(W/2, 80, 24, "F");
      fill(ROSE); doc.circle(W/2, 80, 14, "F");
      fill(BG); doc.circle(W/2, 80, 6, "F");

      font(26,"bold"); txt(ACCENT);
      doc.text("Your story so far.", M, 130, {align:"left"});

      font(10,"italic"); txt(WHITE);
      doc.text(
        `${entries.length} ${entries.length===1?"memory":"memories"} across ${weeks.length} ${weeks.length===1?"week":"weeks"}.`,
        M, 144
      );
      doc.text("Each one preserved, exactly as you felt it.", M, 153);

      lw(0.2); draw(DIVIDER); doc.line(M, 165, W-M, 165);

      font(9,"normal"); txt(ACCENT);
      doc.text("Every week you add becomes a new page.", M, 175);
      doc.text("This book is never finished — it just keeps growing.", M, 183);

      font(7,"normal"); txt(MUTED);
      doc.text("Made with Matri  ·  matri.care", M, H-10);

      // ─── SAVE ─────────────────────────────────────────────────────────
      doc.save("matri-pregnancy-journey.pdf");
      setDone(true);
      setTimeout(()=>setDone(false), 5000);
    } catch(e) {
      console.error("PDF error:", e);
      alert("Could not generate PDF: " + e.message);
    }
    setGenerating(false);
  };

  if (!weeks.length) return (
    <div style={{padding:"16px",fontSize:12,color:"var(--muted)",fontStyle:"italic",textAlign:"center"}}>
      Write your first journal entry to create a shareable PDF.
    </div>
  );

  return (
    <div className="share-strip-wrap">
      <div className="share-card">
        <div className="share-card-header">
          <div className="share-card-title">Priya's Pregnancy Journey 🌸</div>
          <div className="share-card-sub">
            Week {weeks[0][0]}–{weeks[weeks.length-1][0]} · {entries.length} {entries.length===1?"memory":"memories"} · {weeks.length} {weeks.length===1?"week":"weeks"}
          </div>
        </div>

        {/* Preview strip */}
        <div className="share-week-row">
          {weeks.map(([wk,wentries],i)=>{
            const baby = BABY_SIZES[Number(wk)]||BABY_SIZES[wk];
            const moods = [...new Set(wentries.map(e=>e.mood))];
            const hasMultiple = wentries.length > 1;
            return (
              <div key={wk} style={{display:"flex",alignItems:"stretch"}}>
                <div className="share-week-item">
                  <div className="share-week-num">WK {wk}</div>
                  {baby && <div className="share-week-size">{baby.compare}</div>}
                  <div className="share-week-moods">{moods.map((m,j)=><span key={j}>{m}</span>)}</div>
                  {hasMultiple
                    ? <div className="share-week-snippet" style={{color:"rgba(112,200,184,0.8)"}}>{wentries.length} entries</div>
                    : <div className="share-week-snippet">"{wentries[0]?.text?.slice(0,45)}…"</div>}
                </div>
                {i<weeks.length-1&&<div className="share-week-divider"/>}
              </div>
            );
          })}
        </div>

        <div className="share-btn-row">
          <div style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:100,padding:"11px 16px",display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:16}}>📄</span>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.6)"}}>Download PDF to share</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:1}}>Beautiful timeline PDF · coming soon</div>
            </div>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.08em",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:100,padding:"3px 10px",color:"rgba(255,255,255,0.4)"}}>Soon</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FriendsCard() {
  const [open, setOpen] = useState(false);
  const [vis,  setVis]  = useState(false);

  const openOverlay  = () => { setOpen(true);  requestAnimationFrame(()=>setVis(true)); };
  const closeOverlay = () => { setVis(false); setTimeout(()=>setOpen(false), 360); };

  // Ghost avatar placeholders
  const ghosts = ["A","B","C"];

  return (
    <>
      {/* ── WIDGET CARD ── */}
      <div onClick={openOverlay} style={{
        background:"linear-gradient(145deg,#181830,#242448)",
        border:"1px solid rgba(180,170,240,0.12)",
        borderRadius:16, padding:"16px 18px", cursor:"pointer",
        marginBottom:10, position:"relative", overflow:"hidden"
      }}>
        {/* bg emoji */}
        <span style={{position:"absolute",fontSize:100,right:-10,bottom:-14,opacity:0.06,pointerEvents:"none",userSelect:"none"}}>👯</span>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color:"rgba(180,170,240,0.6)",marginBottom:4}}>Friend's journals</div>
            <div style={{fontFamily:"'Lora',serif",fontSize:18,color:"#fff",lineHeight:1.2}}>
              See what your people <em style={{fontStyle:"italic",color:"#b0a0f0"}}>are feeling.</em>
            </div>
          </div>
          <div style={{background:"rgba(176,160,240,0.15)",border:"1px solid rgba(176,160,240,0.2)",borderRadius:100,padding:"3px 10px",fontSize:10,fontWeight:700,color:"#b0a0f0",whiteSpace:"nowrap",flexShrink:0}}>
            0 friends
          </div>
        </div>

        {/* Ghost avatars row */}
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}>
          {ghosts.map((g,i)=>(
            <div key={i} style={{
              width:36,height:36,borderRadius:"50%",
              background:"rgba(255,255,255,0.05)",
              border:"1.5px dashed rgba(255,255,255,0.12)",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:14,color:"rgba(255,255,255,0.15)",fontWeight:600,
              flexShrink:0
            }}>?</div>
          ))}
          <div style={{
            width:36,height:36,borderRadius:"50%",
            background:"rgba(176,160,240,0.12)",
            border:"1.5px solid rgba(176,160,240,0.25)",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:18,color:"#b0a0f0",flexShrink:0
          }}>+</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.28)",marginLeft:6,lineHeight:1.4}}>
            Add friends to see their<br/>public entries here
          </div>
        </div>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.28)",fontStyle:"italic"}}>
            Public entries only · you control what you share
          </div>
          <div style={{fontSize:11,color:"#b0a0f0",fontWeight:600}}>Open ↗</div>
        </div>
      </div>

      {/* ── OVERLAY ── */}
      {open && (
        <div style={{
          position:"fixed",inset:0,zIndex:300,
          background:`rgba(16,10,8,${vis?0.78:0})`,
          transition:"background 0.3s",
          display:"flex",flexDirection:"column",justifyContent:"flex-end",
          maxWidth:430,left:"50%",marginLeft:-215,
          pointerEvents: vis ? "all" : "none"
        }} onClick={closeOverlay}>
          <div onClick={e=>e.stopPropagation()} style={{
            background:"var(--cream)",
            borderRadius:"28px 28px 0 0",
            transform:`translateY(${vis?0:102}%)`,
            transition:"transform 0.36s cubic-bezier(0.3,0.72,0,1)",
            maxHeight:"80vh",
            display:"flex",flexDirection:"column",
            overflow:"hidden"
          }}>
            {/* overlay header */}
            <div style={{padding:"20px 20px 16px",display:"flex",alignItems:"flex-start",justifyContent:"space-between",borderBottom:"1px solid var(--bdr)",flexShrink:0}}>
              <div>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color:"var(--plum)",marginBottom:5}}>Friend's journals</div>
                <div style={{fontFamily:"'Lora',serif",fontSize:22,color:"var(--ink)",lineHeight:1.2}}>
                  Your people's <em style={{fontStyle:"italic",color:"var(--plum)"}}>stories.</em>
                </div>
              </div>
              <button onClick={closeOverlay} style={{width:34,height:34,borderRadius:"50%",background:"var(--cream2)",border:"none",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--muted)",fontFamily:"inherit"}}>✕</button>
            </div>

            {/* overlay body */}
            <div style={{overflowY:"auto",padding:"24px 20px 48px",scrollbarWidth:"none",flex:1}}>
              {/* empty state illustration */}
              <div style={{textAlign:"center",padding:"20px 0 28px"}}>
                <div style={{fontSize:64,marginBottom:16,opacity:0.7}}>👯</div>
                <div style={{fontFamily:"'Lora',serif",fontSize:20,color:"var(--ink)",marginBottom:8,lineHeight:1.3}}>
                  No friends added yet.
                </div>
                <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.7,marginBottom:24,maxWidth:280,margin:"0 auto 24px"}}>
                  When you connect with someone on Matri, their public journal entries will appear here — weeks, moods, moments they chose to share.
                </div>
                <div style={{background:"var(--plum-pale)",border:"1px solid var(--plum-bdr)",borderRadius:14,padding:"14px 16px",marginBottom:16,textAlign:"left"}}>
                  <div style={{fontSize:12,fontWeight:600,color:"var(--plum)",marginBottom:4}}>How it works</div>
                  <div style={{fontSize:12,color:"var(--muted)",lineHeight:1.65}}>
                    Each journal entry you write can be set to <strong>Private</strong> (only you) or <strong>Public</strong> (visible to friends you approve). You stay in control — always.
                  </div>
                </div>
                <button style={{
                  width:"100%",background:"var(--plum)",color:"#fff",
                  border:"none",borderRadius:100,padding:"13px",
                  fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",
                  marginBottom:10
                }}>
                  Add a friend · coming soon
                </button>
                <div style={{fontSize:11,color:"var(--muted)",fontStyle:"italic"}}>
                  Requires a Matri account · phone sign-in coming soon
                </div>
              </div>

              {/* what it'll look like — teaser */}
              <div style={{marginTop:8}}>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color:"var(--muted)",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                  A sneak peek
                  <div style={{flex:1,height:1,background:"var(--bdr)"}}/>
                </div>
                {/* mock friend card */}
                {[
                  {init:"P",name:"Priya S.",week:9,mood:"🥰",text:"Heard the heartbeat today. Nothing can prepare you for that sound.",color:"#c05040",bg:"#fdf0ec"},
                  {init:"A",name:"Ananya K.",week:8,mood:"🤢",text:"Week 8 and the nausea is real. Toast and coconut water only.",color:"#2a4a70",bg:"#eaf0f8"},
                ].map((f,i)=>(
                  <div key={i} style={{background:"#fff",border:"1px solid var(--bdr)",borderRadius:14,padding:"13px 15px",marginBottom:9,opacity:0.55}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                      <div style={{width:32,height:32,borderRadius:"50%",background:f.bg,color:f.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0}}>{f.init}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:600,color:"var(--ink)"}}>{f.name}</div>
                        <div style={{fontSize:10,color:"var(--muted)"}}>Week {f.week} · public entry</div>
                      </div>
                      <div style={{fontSize:18}}>{f.mood}</div>
                    </div>
                    <div style={{fontSize:12,color:"var(--muted)",fontStyle:"italic",lineHeight:1.6}}>"{f.text}"</div>
                  </div>
                ))}
                <div style={{textAlign:"center",fontSize:11,color:"var(--muted)",fontStyle:"italic",marginTop:4}}>
                  This is what your feed will look like when friends join.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MoodSummary({ entries, moodLog, onDeleteMood, dark }) {
  // Merge journal moods and standalone mood log entries by week
  const byWeek = {};
  // From journal entries (source: "journal")
  entries.forEach(e => {
    const k = `Wk ${e.week}`;
    if (!byWeek[k]) byWeek[k] = [];
    byWeek[k].push({ emoji: e.mood, source: "journal", id: null });
  });
  // From mood log (source: "body-panel" etc)
  (moodLog||[]).forEach(m => {
    const k = `Wk ${m.week||8}`;
    if (!byWeek[k]) byWeek[k] = [];
    byWeek[k].push({ emoji: m.emoji, source: m.source, id: m.id });
  });
  const weeks = Object.entries(byWeek).sort(([a],[b])=>parseInt(a.slice(2))-parseInt(b.slice(2)));
  if (!weeks.length) return (
    <div style={{padding:"14px 16px",fontSize:12,color:dark?"rgba(255,255,255,0.35)":"var(--muted)",fontStyle:"italic"}}>
      No entries yet. Tap an emotion in Your Body, or write in the journal.
    </div>
  );
  return (
    <div className="mood-chart">
      {weeks.map(([wk, moods])=>(
        <div key={wk} className="mood-chart-week">
          <div className="mood-chart-wk" style={{color:dark?"rgba(255,255,255,0.35)":"var(--muted)"}}>{wk}</div>
          <div className="mood-chart-dots">
            {moods.map((m,i)=>(
              <span key={i} className="mood-chart-dot"
                title={m.source === "journal" ? "From journal" : "Quick log · tap to remove"}
                onClick={()=>{ if(m.id && onDeleteMood) { if(window.confirm("Remove this mood?")) onDeleteMood(m.id); } }}
                style={{
                  cursor: m.id ? "pointer" : "default",
                  fontSize: m.source === "journal" ? 15 : 13,
                  opacity: m.source === "journal" ? 1 : 0.75,
                }}>
                {m.emoji}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function LibraryView({ onOpen, journalEntries, moodLog, onDeleteMood, onViewAlbum, onViewTimeline }) {
  const entryCount = journalEntries.length;
  const weeksTracked = new Set(journalEntries.map(e=>e.week)).size;
  const lastMood = journalEntries[0]?.mood || "🤍";
  return (
    <div className="library">

      {/* ── JOURNEY HERO with embedded milestone timeline ── */}
      <div className="lib-hero">
        <span className="lib-hero-bg-emoji">🤰</span>
        <div className="lib-hero-grad"/>
        <div className="lib-hero-inner">
          <div className="lib-hero-eyebrow"><div className="lib-hero-dot"/>Matri · Journey</div>
          <div className="lib-hero-title">Always <em>with you.</em></div>
          <div className="lib-hero-sub">The things that matter all the way through.</div>
          <div className="lib-hero-stats">
            <div className="lib-hero-stat"><span className="lib-hero-stat-val">{entryCount}</span><span className="lib-hero-stat-lbl">memories</span></div>
            <div className="lib-hero-stat"><span className="lib-hero-stat-val">{weeksTracked} wks</span><span className="lib-hero-stat-lbl">documented</span></div>
            <div className="lib-hero-stat"><span className="lib-hero-stat-val">{lastMood}</span><span className="lib-hero-stat-lbl">last mood</span></div>
          </div>
          {/* ── MILESTONE STRIP embedded in hero ── */}
          <div style={{marginTop:16,paddingBottom:4}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:10}}>Your pregnancy milestones</div>
            <div style={{overflowX:"auto",scrollbarWidth:"none",marginLeft:-4}}>
              <div style={{display:"flex",alignItems:"flex-start",paddingBottom:8,minWidth:"max-content"}}>
                {MILESTONES.map((m,i)=>(
                  <div key={m.wk} style={{display:"flex",alignItems:"center"}}>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:56}}>
                      <div style={{
                        width:9,height:9,borderRadius:"50%",flexShrink:0,
                        background:m.done?"rgba(144,184,240,0.9)":m.current?"#90b8f0":"transparent",
                        border:`1.5px solid ${m.done?"rgba(144,184,240,0.9)":m.current?"#90b8f0":"rgba(255,255,255,0.2)"}`,
                        boxShadow:m.current?"0 0 0 3px rgba(144,184,240,0.15)":undefined
                      }}/>
                      <div style={{fontSize:8,color:"rgba(255,255,255,0.35)",marginTop:4,textAlign:"center"}}>{m.wk}</div>
                      <div style={{fontSize:8,color:m.current?"#90b8f0":m.done?"rgba(255,255,255,0.5)":"rgba(255,255,255,0.22)",textAlign:"center",lineHeight:1.3,maxWidth:52,fontWeight:m.current?600:400}}>{m.name}</div>
                    </div>
                    {i<MILESTONES.length-1&&<div style={{height:1.5,minWidth:16,background:m.done?"rgba(144,184,240,0.3)":"rgba(255,255,255,0.08)",marginBottom:20,flexShrink:0}}/>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TRACK ── */}
      <div className="lib-section" style={{marginTop:6}}>
        <div className="lib-section-lbl">Track</div>
        <div className="lib-grid">
          {/* MOOD SUMMARY — dark teal data viz */}
          <div className="lw lw-left lw-tall"
            style={{background:"linear-gradient(145deg,#0a2020,#142e2e)",border:"1px solid #102828"}}>
            <div style={{padding:"14px 16px 0"}}>
              <div className="w-lbl" style={{color:"#70c8a0"}}><div className="w-lbl-dot" style={{background:"#70c8a0"}}/>Mood over time</div>
            </div>
            <MoodSummary entries={journalEntries} moodLog={moodLog} onDeleteMood={onDeleteMood} dark/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {/* HEALTH LOG — slate pale */}
            <div className="lw lw-sm wc-slate" style={{opacity:0.8}}>
              <div className="win" style={{paddingBottom:14}}>
                <div className="w-lbl" style={{color:"var(--slate)"}}><div className="w-lbl-dot" style={{background:"var(--slate)"}}/>Health log</div>
                <div style={{fontSize:12,color:"var(--slate)",lineHeight:1.4,marginBottom:8}}>BP, weight, symptoms over time.</div>
                <div style={{fontSize:9,background:"var(--slate-pale)",border:"1px solid var(--slate-bdr)",borderRadius:100,padding:"3px 10px",color:"var(--slate)",fontWeight:700,letterSpacing:"0.08em",display:"inline-block"}}>Coming soon</div>
              </div>
            </div>
            {/* SUPPLEMENTS — forest pale */}
            <div className="lw lw-sm wc-forest" style={{opacity:0.8}}>
              <div className="win" style={{paddingBottom:14}}>
                <div className="w-lbl" style={{color:"var(--forest)"}}><div className="w-lbl-dot" style={{background:"var(--forest)"}}/>Supplements</div>
                <div style={{fontSize:12,color:"var(--forest)",lineHeight:1.4,marginBottom:8}}>Folic acid, iron, timing reminders.</div>
                <div style={{fontSize:9,background:"var(--forest-pale)",border:"1px solid var(--forest-bdr)",borderRadius:100,padding:"3px 10px",color:"var(--forest)",fontWeight:700,letterSpacing:"0.08em",display:"inline-block"}}>Coming soon</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── KNOW YOURSELF — Real Fears only ── */}
      <div className="lib-section">
        <div className="lib-section-lbl">Know yourself</div>
        <div className="lw lw-full lw-tall" onClick={()=>onOpen("fears")}
          style={{background:"linear-gradient(145deg,#1a1210,#2e1a14)",border:"1px solid #2a1410"}}>
          <span style={{position:"absolute",fontSize:140,right:-10,bottom:-10,opacity:0.07,transform:"rotate(-10deg)",pointerEvents:"none",userSelect:"none"}}>🤍</span>
          <div className="win-lg">
            <div className="w-lbl" style={{color:"rgba(255,200,180,0.7)"}}><div className="w-lbl-dot" style={{background:"rgba(255,200,180,0.7)"}}/>Real fears</div>
            <div style={{fontFamily:"'Lora',serif",fontSize:22,color:"#fff",lineHeight:1.2,marginBottom:8}}>The things nobody <em style={{fontStyle:"italic",color:"#f0c0a0"}}>admits out loud.</em></div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.38)",lineHeight:1.6}}>Miscarriage. Labour. Your body. Your career. Honest, not dismissive.</div>
          </div>
          <div className="w-tap w-tap-lt">Read ↗</div>
        </div>
      </div>

      {/* ── DAILY LIFE ── */}
      <div className="lib-section" style={{marginTop:6}}>
        <div className="lib-section-lbl">Daily life</div>
        <div className="lw lw-full lw-med wc-navy" onClick={()=>onOpen("planning")}>
          <span className="w-bg-e" style={{color:"var(--navy)",fontSize:90}}>📅</span>
          <div className="win-lg">
            <div className="w-lbl" style={{color:"var(--navy)"}}><div className="w-lbl-dot" style={{background:"var(--navy)"}}/>Life planning</div>
            <div className="wt-md">Pregnancy and your <em style={{color:"var(--navy)"}}>daily life.</em></div>
            <div style={{fontSize:12,color:"var(--muted)",marginTop:6,lineHeight:1.5}}>Working full-time · WFH · Managing home · Freelancing</div>
          </div>
          <div className="w-tap w-tap-dk">↗</div>
        </div>
      </div>

      {/* ── STORIES ── */}
      <div className="lib-section" style={{marginTop:6}}>
        <div className="lib-section-lbl">Stories</div>
        <div className="lw lw-full lw-med" onClick={()=>onOpen("stories")}
          style={{background:"linear-gradient(145deg,#1e1030,#342050)",border:"1px solid #200e38"}}>
          <span style={{position:"absolute",fontSize:130,right:-10,bottom:-10,opacity:0.07,transform:"rotate(-10deg)",pointerEvents:"none",color:"#c8a0f0",userSelect:"none"}}>💬</span>
          <div className="win-lg">
            <div className="w-lbl" style={{color:"#c8a0f0"}}><div className="w-lbl-dot" style={{background:"#c8a0f0"}}/>Stories</div>
            <div style={{fontFamily:"'Lora',serif",fontSize:20,color:"#fff",lineHeight:1.2,marginBottom:8}}>Women who've been <em style={{fontStyle:"italic",color:"#c8a0f0"}}>right here.</em></div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.35)"}}>Real experiences. Read, share, feel less alone.</div>
          </div>
          <div className="w-tap w-tap-lt">Read ↗</div>
        </div>
      </div>

      {/* ── YOUR STORY ── */}
      <div className="lib-section" style={{marginTop:6,paddingBottom:16}}>
        <div className="lib-section-lbl">Your story</div>
        <div className="lib-grid">
          <div className="lw lw-left lw-sm" onClick={onViewAlbum}
            style={{background:"linear-gradient(145deg,#0a2020,#183535)",border:"1px solid #0a2828"}}>
            <div className="win" style={{paddingBottom:14}}>
              <div className="w-lbl" style={{color:"#70c8b8"}}><div className="w-lbl-dot" style={{background:"#70c8b8"}}/>Album</div>
              <div style={{fontFamily:"'Lora',serif",fontSize:16,color:"#fff",lineHeight:1.2}}>View your <em style={{fontStyle:"italic",color:"#70c8b8"}}>pregnancy book.</em></div>
            </div>
            <div className="w-tap w-tap-lt">Open ↗</div>
          </div>
          <div className="lw lw-right lw-sm" onClick={onViewTimeline}
            style={{background:"linear-gradient(145deg,#1a1a30,#282850)",border:"1px solid #202048"}}>
            <div className="win" style={{paddingBottom:14}}>
              <div className="w-lbl" style={{color:"#b0a0f0"}}><div className="w-lbl-dot" style={{background:"#b0a0f0"}}/>Timeline</div>
              <div style={{fontFamily:"'Lora',serif",fontSize:16,color:"#fff",lineHeight:1.2}}>All your <em style={{fontStyle:"italic",color:"#b0a0f0"}}>memories.</em></div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:4}}>{journalEntries.length} entries</div>
            </div>
            <div className="w-tap w-tap-lt">Open ↗</div>
          </div>
        </div>
      </div>
    </div>
  );
}
function JournalTab({ entries, setEntries, onOpenAlbum, moodLog }) {
  const latest = entries[0];

  // Collect all photos across all entries for the thumbnail row
  const allPhotos = entries.flatMap(e =>
    (e.photos||[]).map(p => photoThumb(p)).filter(Boolean)
  ).slice(0, 6);

  const totalWeeks  = new Set(entries.map(e => e.week)).size;
  const totalPhotos = entries.reduce((a, e) => a + (e.photos?.length || 0), 0);

  return (
    <div className="journal-tab">
      {/* JOURNAL HERO */}
      <div className="jh">
        <span className="jh-bg">🤱</span>
        <div className="jh-grad"/>
        <div className="jh-inner">
          <div className="jh-eyebrow"><div className="jh-dot"/>Matri · Your journey</div>
          <div className="jh-title">Journal & <em>Memories.</em></div>

          {/* Photo thumbnail row — like pregnancy story widget */}
          {allPhotos.length > 0 && (
            <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"nowrap",overflowX:"auto",scrollbarWidth:"none",paddingBottom:2}}>
              {allPhotos.map((src,i)=>(
                <div key={i} style={{width:52,height:52,borderRadius:12,overflow:"hidden",flexShrink:0,
                  border:"1.5px solid rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.08)"}}>
                  <img src={src} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                </div>
              ))}
              {/* placeholder thumbs if fewer than 3 real photos */}
              {allPhotos.length < 3 && Array.from({length:3-allPhotos.length}).map((_,i)=>(
                <div key={"ph"+i} style={{width:52,height:52,borderRadius:12,flexShrink:0,
                  background:"rgba(255,255,255,0.06)",border:"1.5px dashed rgba(112,200,184,0.3)",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,opacity:0.5}}>📷</div>
              ))}
            </div>
          )}

          {/* No photos yet — show placeholder row */}
          {allPhotos.length === 0 && (
            <div style={{display:"flex",gap:8,marginBottom:14}}>
              {[0,1,2].map(i=>(
                <div key={i} style={{width:52,height:52,borderRadius:12,flexShrink:0,
                  background:"rgba(255,255,255,0.06)",border:"1.5px dashed rgba(112,200,184,0.3)",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,opacity:0.5}}>📷</div>
              ))}
            </div>
          )}

          {/* Compact latest entry snippet */}
          {latest && (
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,
              background:"rgba(255,255,255,0.07)",borderRadius:12,padding:"8px 12px"}}>
              <span style={{fontSize:16,flexShrink:0}}>{latest.mood}</span>
              <span style={{fontSize:12,color:"rgba(255,255,255,0.6)",fontStyle:"italic",
                fontFamily:"'Lora',serif",lineHeight:1.4,overflow:"hidden",
                display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
                "{latest.text}"
              </span>
            </div>
          )}

          <div className="jh-stats">
            <div className="jh-stat"><span className="jh-stat-val">{entries.length}</span><span className="jh-stat-lbl">memories</span></div>
            <div className="jh-stat"><span className="jh-stat-val">{totalWeeks} wks</span><span className="jh-stat-lbl">documented</span></div>
            <div className="jh-stat"><span className="jh-stat-val">{totalPhotos}</span><span className="jh-stat-lbl">photos</span></div>
          </div>
        </div>
      </div>
      {/* Full JournalPanel below hero */}
      <JournalPanel entries={entries} setEntries={setEntries} moodLog={moodLog}/>
    </div>
  );
}

/* ─── HERO MOOD STRIP ──────────────────────────────────────────────────── */
function HeroMoodStrip({ journalEntries, moodLog, onTap }) {
  // Pick the most recent signal — journal entry or standalone mood log
  const latestJournal = journalEntries[0];
  const latestMood    = (moodLog||[])[0];

  // Compare by id (both use Date.now() as id/timestamp)
  const showMoodLog = latestMood && (!latestJournal || latestMood.id > latestJournal.id);

  if (!latestJournal && !latestMood) return null;

  const emoji   = showMoodLog ? latestMood.emoji : latestJournal.mood;
  const text    = showMoodLog
    ? "You felt this today"
    : (latestJournal.text.slice(0, 48) + (latestJournal.text.length > 48 ? "…" : ""));
  const dateStr = showMoodLog ? "today" : latestJournal.date;

  return (
    <div className="hero-mood-strip" onClick={e=>{e.stopPropagation();onTap();}} style={{cursor:"pointer"}}>
      <div className="hero-mood-entry">
        <span className="hero-mood-emoji">{emoji}</span>
        <span className="hero-mood-text">{text}</span>
        <span className="hero-mood-ago">{dateStr}</span>
      </div>
    </div>
  );
}

/* ─── MAIN APP ───────────────────────────────────────────────────────── */
export default function App() {
  const [active,  setActive]  = useState(null);
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState(() => loadChecked());
  const [journalEntries, setJournalEntries] = useState(() => loadJournalEntries());
  const [moodLog, setMoodLog] = useState(() => loadMoodLog());
  const [toast, setToast] = useState(null);
  const [symptomQuery, setSymptomQuery] = useState("");
  const [symptomInput, setSymptomInput] = useState("");
  const [mainTab, setMainTab] = useState("week");
  const [quickAdd, setQuickAdd] = useState(false);
  const [quickAddVis, setQuickAddVis] = useState(false);

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
  const openSymptom = (q) => { setSymptomQuery(q||""); setSymptomInput(q||""); open("symptom"); };

  // Mood log helpers
  const logMood = (emoji) => {
    const entry = { id: Date.now(), emoji, week: 8, source: "body-panel", date: istDate() };
    setMoodLog(p => {
      const next = [entry, ...p];
      saveMoodLog(next);
      return next;
    });
    setToast(emoji);
    setTimeout(() => setToast(null), 2000);
  };
  const deleteMood = (id) => {
    setMoodLog(p => {
      const next = p.filter(m => m.id !== id);
      saveMoodLog(next);
      return next;
    });
  };

  // Quick add sheet
  const openQuickAdd  = () => { setQuickAdd(true);  requestAnimationFrame(()=>setQuickAddVis(true)); };
  const closeQuickAdd = () => { setQuickAddVis(false); setTimeout(()=>setQuickAdd(false), 370); };

  // Library → album / timeline navigation
  const [libAlbumOpen, setLibAlbumOpen] = useState(false);
  const [libAlbumVis,  setLibAlbumVis]  = useState(false);
  const openLibAlbum  = () => { setLibAlbumOpen(true);  requestAnimationFrame(()=>setLibAlbumVis(true)); };
  const closeLibAlbum = () => { setLibAlbumVis(false); setTimeout(()=>setLibAlbumOpen(false), 370); };
  const goToJournalTimeline = () => { setMainTab("journal"); };
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
    <div className="app" style={{display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden"}}>
      <style>{css}</style>

      {/* ── SCROLLABLE CONTENT AREA ── */}
      <div style={{flex:1,overflowY:"auto",scrollbarWidth:"none",WebkitOverflowScrolling:"touch"}}>

        {/* ══ THIS WEEK TAB ══ */}
        {mainTab==="week" && <>
          {/* HERO */}
          <div className="hero" onClick={() => open("baby")}>
            <div className="blob" style={{width:260,height:260,background:"#9a3020",top:-90,right:-70,opacity:0.4}}/>
            <div className="blob" style={{width:160,height:160,background:"#c05840",bottom:30,left:-20,opacity:0.22}}/>
            <span className="hero-bg-emoji">🤱</span>
            <div className="hero-grad"/>

            {/* Matri wordmark — top left, before content */}
            <div style={{position:"relative",zIndex:2,padding:"18px 22px 0",display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:"#f0a07a",flexShrink:0}}/>
              <span style={{fontSize:11,fontWeight:700,letterSpacing:"0.22em",textTransform:"uppercase",color:"rgba(255,255,255,0.55)"}}>matri</span>
            </div>

            <div className="hero-inner" style={{paddingTop:14}}>
              {/* Week + Trimester chip */}
              <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:6}}>
                <div className="hero-week">Week <em>8.</em></div>
                <div style={{fontSize:10,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(255,255,255,0.38)",paddingBottom:6}}>First Trimester</div>
              </div>

              <div className="hero-tagline">The nausea is real. The exhaustion is real.<br/>So is that heartbeat.</div>

              <div className="hero-stats">
                <div className="hero-stat">
                  <span className="hero-stat-val">1.6cm</span>
                  <span className="hero-stat-lbl">tip of your thumb</span>
                </div>
                <div style={{position:"relative",padding:"10px 12px",minWidth:52,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:44,lineHeight:1,userSelect:"none"}}>🫘</span>
                </div>
                <div className="hero-stat"><span className="hero-stat-val">~160 bpm</span><span className="hero-stat-lbl">heart rate</span></div>
              </div>
            </div>
            <div className="hero-tap">Tap to explore your baby ↗</div>
            {(journalEntries.length > 0 || moodLog.length > 0) && <HeroMoodStrip journalEntries={journalEntries} moodLog={moodLog} onTap={()=>open("journal")}/>}
            <div className="prog-row">
              <div className="prog-lbl">Wk 8</div>
              <div className="prog-track"><div className="prog-fill"/></div>
              <div className="prog-lbl">40</div>
              <div className="t1-badge">T1</div>
            </div>
          </div>

          {/* WEEK NAV */}
          <div className="week-nav">
            <button className="week-nav-btn">← Wk 7</button>
            <div className="week-nav-mid">
              <span className="week-nav-label">Week 8</span>
              <span className="week-nav-sub">of 40 · First trimester</span>
            </div>
            <button className="week-nav-btn">Wk 9 →</button>
          </div>

          {/* SYMPTOM BAR */}
          <div className="symptom-bar">
            <div className="symptom-bar-inner">
              <span className="symptom-bar-icon">🔍</span>
              <input className="symptom-bar-input"
                placeholder="What are you feeling today?"
                value={symptomInput}
                onChange={e=>setSymptomInput(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&symptomInput.trim())openSymptom(symptomInput);}}/>
              <button className="symptom-bar-btn" onClick={()=>symptomInput.trim()&&openSymptom(symptomInput)}>Ask</button>
            </div>
          </div>

          {/* WIDGET GRID */}
          <div className="grid">
            {/* BODY */}
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

            {/* 3AM */}
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

            {/* NOBODY TELLS YOU */}
            <div className="w w-right wc-plum w-med" onClick={()=>open("ntty")}>
              <span className="w-bg-e" style={{color:"var(--plum)"}}>🤫</span>
              <div className="win">
                <div className="w-lbl" style={{color:"var(--plum)"}}><div className="w-lbl-dot" style={{background:"var(--plum)"}}/>Nobody tells you</div>
                <div className="wt-md">The things no one <em style={{color:"var(--plum)"}}>warns you about.</em></div>
              </div>
              <div className="w-tap w-tap-dk">Tap ↗</div>
            </div>

            {/* WINS */}
            <div className="w w-left wc-dark2 w-sm" onClick={()=>open("wins")}>
              <div className="win">
                <div className="w-lbl" style={{color:"#b0a0f0"}}><div className="w-lbl-dot" style={{background:"#b0a0f0"}}/>This week's win</div>
                <div style={{fontFamily:"'Lora',serif",fontSize:18,color:"#fff",lineHeight:1.2,marginBottom:6}}>You made it to <em style={{fontStyle:"italic",color:"#b0a0f0"}}>week 8.</em></div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",lineHeight:1.55}}>That heart hasn't stopped once.</div>
              </div>
              <div className="w-tap w-tap-lt">Tap ↗</div>
            </div>

            {/* PARTNER */}
            <div className="w w-right wc-teal w-sm" onClick={()=>open("partner")}>
              <span className="w-bg-e" style={{color:"var(--teal)"}}>🤝</span>
              <div className="win">
                <div className="w-lbl" style={{color:"var(--teal)"}}><div className="w-lbl-dot" style={{background:"var(--teal)"}}/>For your partner</div>
                <div className="wt-sm">What your partner <em style={{color:"var(--teal)"}}>should know.</em></div>
                <div style={{fontSize:11,color:"var(--muted)",marginTop:4}}>Share with him. Specific, not generic.</div>
              </div>
              <div className="w-tap w-tap-dk">Tap ↗</div>
            </div>

            {/* FOOD */}
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

            {/* MEDICAL */}
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

            {/* CHECKLIST */}
            <div className="w w-full wc-amber" onClick={()=>open("checklist")}>
              <span className="w-bg-e" style={{color:"var(--amber)",fontSize:90}}>✅</span>
              <div className="win-lg">
                <div className="w-lbl" style={{color:"var(--amber)"}}><div className="w-lbl-dot" style={{background:"var(--amber)"}}/>Checklist this week</div>
                <div className="wt-md">7 things. <em style={{color:"var(--amber)"}}>That's it.</em></div>
                <div style={{fontSize:11,color:"var(--muted)",marginTop:6,marginBottom:4}}>
                  {checksDone} of {CHECKS.length} done{checksDone===CHECKS.length?" 🎉":""}
                </div>
                <div style={{marginTop:6,columns:2,columnGap:16}}>
                  {CHECKS.slice(0,4).map(c=>(
                    <div key={c.id} role="button" tabIndex={0}
                      onClick={e=>{e.stopPropagation();toggleCheck(c.id);}}
                      onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();e.stopPropagation();toggleCheck(c.id);}}}
                      style={{display:"flex",alignItems:"flex-start",gap:7,fontSize:11,marginBottom:5,color:"var(--amber)",cursor:"pointer"}}>
                      <div style={{width:14,height:14,borderRadius:"50%",border:`1.5px solid ${checked[c.id]?"var(--forest)":"currentColor"}`,background:checked[c.id]?"var(--forest)":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:checked[c.id]?"#fff":"inherit",marginTop:1}}>{checked[c.id]&&"✓"}</div>
                      <span style={{color:checked[c.id]?"var(--forest)":"inherit",opacity:checked[c.id]?0.55:1,fontWeight:checked[c.id]?600:400,lineHeight:1.35}}>{c.text}</span>
                    </div>
                  ))}
                </div>
                {CHECKS.length>4&&<div style={{fontSize:10,color:"var(--muted)",marginTop:4,fontStyle:"italic"}}>+{CHECKS.length-4} more in full list</div>}
              </div>
              <div className="w-tap w-tap-dk">Open full list ↗</div>
            </div>

            {/* JOURNAL ENTRY POINT (goes to journal tab) */}
            <div className="w w-full wc-dark3 w-tall" onClick={()=>setMainTab("journal")}>
              <span style={{position:"absolute",fontSize:180,right:-20,bottom:-20,opacity:0.07,transform:"rotate(-12deg)",pointerEvents:"none",userSelect:"none"}}>📖</span>
              <div className="win-lg">
                <div className="w-lbl" style={{color:"#70c8b8"}}><div className="w-lbl-dot" style={{background:"#70c8b8"}}/>Journal & memories</div>
                <div style={{fontFamily:"'Lora',serif",fontSize:22,color:"#fff",lineHeight:1.2,marginBottom:8}}>Your pregnancy <em style={{fontStyle:"italic",color:"#70c8b8"}}>story.</em></div>
                <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",lineHeight:1.65,marginBottom:14}}>Write, add photos, track your mood.</div>
                <div style={{display:"flex",gap:8,marginTop:12}}>
                  <div style={{width:52,height:52,borderRadius:12,background:"rgba(112,200,184,0.15)",border:"1.5px dashed rgba(112,200,184,0.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,color:"#70c8b8",flexShrink:0}}>+</div>
                  {journalEntries.slice(0,3).map(e=>(
                    <div key={e.id} style={{width:52,height:52,borderRadius:12,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0,overflow:"hidden"}}>
                      {photoThumb(e.photos[0]) ? <img src={photoThumb(e.photos[0])} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : (typeof e.photos[0]==="string"?e.photos[0]:"📝")}
                    </div>
                  ))}
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",alignSelf:"center",marginLeft:4}}>{journalEntries.length} memories</div>
                </div>
              </div>
              <div className="w-tap w-tap-lt">Open journal ↗</div>
            </div>
          </div>
        </>}

        {/* ══ LIBRARY TAB ══ */}
        {mainTab==="library" && (
          <LibraryView
            onOpen={open}
            journalEntries={journalEntries}
            moodLog={moodLog}
            onDeleteMood={deleteMood}
            onViewAlbum={openLibAlbum}
            onViewTimeline={goToJournalTimeline}
          />
        )}

        {/* ══ JOURNAL TAB ══ */}
        {mainTab==="journal" && (
          <div style={{minHeight:"calc(100vh - 64px)",display:"flex",flexDirection:"column"}}>
            <JournalTab entries={journalEntries} setEntries={setJournalEntriesPersist} onOpenAlbum={openLibAlbum} moodLog={moodLog}/>
          </div>
        )}
      </div>

      {/* ── MOOD TOAST ── */}
      <div className={`mood-toast${toast?" show":""}`}>
        <span style={{fontSize:18}}>{toast}</span> logged to your mood
      </div>

      {/* ── BACKDROP (panels) ── */}
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
                {active==="baby"
                  ? <BabyPanel/>
                  : active==="journal"
                  ? <JournalPanel entries={journalEntries} setEntries={setJournalEntriesPersist} initialTab="timeline" moodLog={moodLog}/>
                  : pd.Panel ? <pd.Panel/> : null}
              </div>
            ) : (
              <div className="panel-scroll">
                {active==="checklist" ? <CheckPanel checked={checked} toggle={toggleCheck}/>
                  : active==="symptom" ? <SymptomPanel initialQuery={symptomQuery}/>
                  : active==="body" ? <BodyPanel onLogMood={logMood}/>
                  : active==="food" ? <FoodPanel/>
                  : pd.Panel ? <pd.Panel/> : null}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── LIBRARY ALBUM OVERLAY ── */}
      {libAlbumOpen && (
        <div className={`album-screen${libAlbumVis?" open":""}`} style={{position:"fixed",inset:0,zIndex:200,maxWidth:430,left:"50%",marginLeft:-215}}>
          <AlbumView entries={journalEntries} onClose={closeLibAlbum}/>
        </div>
      )}

      {/* ── QUICK ADD FAB (week + library tabs only) ── */}
      {mainTab!=="journal" && (
        <button className="fab" onClick={openQuickAdd} aria-label="Add journal entry">+</button>
      )}

      {/* ── QUICK ADD SHEET ── */}
      {quickAdd && (
        <div className={`quick-add-sheet${quickAddVis?" open":""}`}>
          <div className="quick-add-backdrop" onClick={closeQuickAdd}/>
          <div className="quick-add-card">
            <div className="quick-add-title">Add to your <em>story</em></div>
            <QuickAddEntry
              entries={journalEntries}
              setEntries={setJournalEntriesPersist}
              onClose={closeQuickAdd}
            />
          </div>
        </div>
      )}

      {/* ── THREE-TAB BOTTOM NAV ── */}
      <div className="tab-nav">
        <div className="tab-nav-inner">
          {[
            {id:"week",  icon:"🌸", label:"This Week"},
            {id:"library",icon:"📚",label:"Journey"},
            {id:"journal",icon:"✍️",label:"Memories"},
          ].map(t=>(
            <button key={t.id} className={`tab-btn${mainTab===t.id?" on":""}`} onClick={()=>setMainTab(t.id)}>
              <span className="tab-btn-icon">{t.icon}</span>
              <span className="tab-btn-lbl">{t.label}</span>
              <div className="tab-btn-dot"/>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
