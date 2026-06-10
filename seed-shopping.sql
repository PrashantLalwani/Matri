-- Seed week-specific "Worth buying" items for all 40 weeks.
-- Run AFTER seed-checklists.sql (or run both in sequence).
-- Safe to re-run — ON CONFLICT only updates the shopping column.
--
-- Format: [{ico, nm, wy, pr}] — 4 items per week.

INSERT INTO weekly_content (week, shopping) VALUES

(1,  '[{"ico":"💊","nm":"Folic Acid 400mcg","wy":"Start before you confirm","pr":"₹80–150/mo"},
       {"ico":"🧪","nm":"Ovulation Test Strips","wy":"Know your fertile window","pr":"₹200–400"},
       {"ico":"🫐","nm":"Prenatal Multivitamin","wy":"Covers all baseline gaps","pr":"₹300–600/mo"},
       {"ico":"🚫","nm":"Alcohol-free toner","wy":"Safe skincare swap","pr":"₹200–500"}]'),

(2,  '[{"ico":"💊","nm":"Folic Acid 400mcg","wy":"Continue daily without fail","pr":"₹80–150/mo"},
       {"ico":"🥗","nm":"Iron-rich snack mix","wy":"Spinach, til, dried apricots","pr":"₹100–200"},
       {"ico":"💧","nm":"Large Water Bottle (1L)","wy":"Hydration matters now","pr":"₹300–600"},
       {"ico":"🌿","nm":"Ginger Tea","wy":"Helps with early nausea","pr":"₹80–150"}]'),

(3,  '[{"ico":"💊","nm":"Folic Acid + B12","wy":"Implantation support","pr":"₹120–250/mo"},
       {"ico":"💧","nm":"Electrolyte sachets","wy":"Stay hydrated safely","pr":"₹100–200"},
       {"ico":"🌿","nm":"Ginger chews","wy":"Nausea prep for coming weeks","pr":"₹80–160"},
       {"ico":"🛌","nm":"Body pillow","wy":"Start side-sleeping now","pr":"₹600–1,200"}]'),

(4,  '[{"ico":"🧪","nm":"Home Pregnancy Tests (2-pack)","wy":"Confirm with a second test","pr":"₹100–250"},
       {"ico":"💊","nm":"Prenatal Multivitamin","wy":"Start immediately","pr":"₹300–600/mo"},
       {"ico":"🌿","nm":"Ginger Tea","wy":"Nausea is coming","pr":"₹80–150"},
       {"ico":"📁","nm":"Accordion file folder","wy":"Organise all scans and reports","pr":"₹150–300"}]'),

(5,  '[{"ico":"💊","nm":"Vitamin B6 supplement","wy":"Clinically reduces nausea","pr":"₹150–300/mo"},
       {"ico":"🍪","nm":"Cream Crackers (bulk)","wy":"Small meals every 2 hours","pr":"₹60–120"},
       {"ico":"💧","nm":"Large Insulated Water Bottle","wy":"3L daily — make it easy","pr":"₹400–800"},
       {"ico":"🌿","nm":"Ginger Candies","wy":"Portable nausea relief","pr":"₹80–150"}]'),

(6,  '[{"ico":"💊","nm":"Iron + Folic Acid","wy":"Blood panel likely shows need","pr":"₹120–300/mo"},
       {"ico":"🩱","nm":"Soft Cup Maternity Bra","wy":"Underwire is uncomfortable now","pr":"₹400–700"},
       {"ico":"🎗️","nm":"Sea-Bands (anti-nausea)","wy":"Acupressure wristbands, safe","pr":"₹300–500"},
       {"ico":"🌿","nm":"Ginger Biscuits","wy":"Best natural nausea fix","pr":"₹40–80"}]'),

(7,  '[{"ico":"💊","nm":"Vitamin B6 + B12","wy":"Reduces nausea and fatigue","pr":"₹150–300/mo"},
       {"ico":"🍪","nm":"Dry snacks in bulk","wy":"Keep on nightstand, desk, bag","pr":"₹100–200"},
       {"ico":"🎗️","nm":"Sea-Bands","wy":"Acupressure wristbands","pr":"₹300–500"},
       {"ico":"💧","nm":"Insulated Flask","wy":"Cold water helps nausea","pr":"₹400–800"}]'),

(8,  '[{"ico":"💊","nm":"Folic Acid + Iron","wy":"Neural development essentials","pr":"₹120–300/mo"},
       {"ico":"🩱","nm":"Supportive Bra","wy":"Non-negotiable now","pr":"₹400–800"},
       {"ico":"💧","nm":"Water Bottle","wy":"3L/day — a nice one helps","pr":"₹300–600"},
       {"ico":"🍪","nm":"Ginger Biscuits","wy":"Best natural nausea fix","pr":"₹40–80"}]'),

(9,  '[{"ico":"🎗️","nm":"Sea-Bands","wy":"Peak nausea week — these help","pr":"₹300–500"},
       {"ico":"👗","nm":"Loose Kurtas / Loungewear","wy":"Waistbands are the enemy now","pr":"₹400–900"},
       {"ico":"💊","nm":"Magnesium supplement","wy":"Helps cramps and sleep","pr":"₹200–400/mo"},
       {"ico":"🌿","nm":"Peppermint tea","wy":"Calms nausea and bloating","pr":"₹80–150"}]'),

(10, '[{"ico":"👟","nm":"Comfortable Walking Shoes","wy":"Daily walks, no heels","pr":"₹800–2,000"},
       {"ico":"🧴","nm":"Pregnancy-safe sunscreen SPF50","wy":"Skin darkens easily now","pr":"₹300–600"},
       {"ico":"💊","nm":"Iron supplement (standalone)","wy":"Most women need extra by wk10","pr":"₹100–200/mo"},
       {"ico":"🥜","nm":"Protein snack bars","wy":"Easy protein on nauseous days","pr":"₹150–300"}]'),

(11, '[{"ico":"🩱","nm":"Underwire-free Maternity Bra","wy":"You need at least two now","pr":"₹500–900"},
       {"ico":"🧴","nm":"Belly Oil or Butter","wy":"Start now — earlier is better","pr":"₹300–700"},
       {"ico":"👗","nm":"Stretchy maternity leggings","wy":"Your comfort layer","pr":"₹400–800"},
       {"ico":"🌿","nm":"Ginger-lemon herbal tea","wy":"Eases nausea, tastes good","pr":"₹80–150"}]'),

(12, '[{"ico":"👗","nm":"First maternity clothes","wy":"Regular waistbands are done","pr":"₹600–1,500"},
       {"ico":"🧴","nm":"Stretch Mark Cream","wy":"Best prevention is early","pr":"₹300–700"},
       {"ico":"👟","nm":"Slip-on shoes","wy":"Bending to lace gets harder","pr":"₹600–1,200"},
       {"ico":"📖","nm":"Pregnancy reference book","wy":"One good one is enough","pr":"₹400–700"}]'),

(13, '[{"ico":"🧘","nm":"Prenatal Yoga Mat","wy":"Second trimester — move more","pr":"₹600–1,500"},
       {"ico":"🧴","nm":"Belly Oil (large bottle)","wy":"Daily use from here on","pr":"₹300–700"},
       {"ico":"👗","nm":"Maternity leggings (2 pairs)","wy":"You will live in these","pr":"₹400–800 each"},
       {"ico":"💊","nm":"Calcium + Vitamin D","wy":"Baby bones forming fast now","pr":"₹150–300/mo"}]'),

(14, '[{"ico":"👗","nm":"Maternity Jeans or Trousers","wy":"Work-appropriate now","pr":"₹800–2,000"},
       {"ico":"💊","nm":"Calcium + Vitamin D","wy":"Increase daily intake now","pr":"₹150–300/mo"},
       {"ico":"🧴","nm":"Belly Support Band (light)","wy":"Reduces back strain early","pr":"₹400–800"},
       {"ico":"🌾","nm":"Ragi-based snacks","wy":"Best Indian calcium source","pr":"₹100–250"}]'),

(15, '[{"ico":"🛌","nm":"U-shaped Pregnancy Pillow","wy":"Side sleeping is essential now","pr":"₹1,200–2,500"},
       {"ico":"🧴","nm":"Stretch mark oil","wy":"Belly growing fast now","pr":"₹300–700"},
       {"ico":"🧦","nm":"Compression Socks (light)","wy":"Prevent early leg swelling","pr":"₹300–600"},
       {"ico":"💊","nm":"Omega-3 (DHA) supplement","wy":"Brain development peak period","pr":"₹400–800/mo"}]'),

(16, '[{"ico":"🩱","nm":"Maternity support bra","wy":"Your size has changed again","pr":"₹500–900"},
       {"ico":"📓","nm":"Pregnancy Planner / Journal","wy":"Document this trimester","pr":"₹300–600"},
       {"ico":"🧦","nm":"Compression socks","wy":"Standing gets harder now","pr":"₹300–600"},
       {"ico":"💊","nm":"Calcium + Iron combo","wy":"Take separately, 2hr apart","pr":"₹200–400/mo"}]'),

(17, '[{"ico":"🛌","nm":"Pregnancy pillow","wy":"If you do not have one — now","pr":"₹1,200–2,500"},
       {"ico":"🧴","nm":"Belly massage oil","wy":"Daily ritual, prevents dryness","pr":"₹300–700"},
       {"ico":"👗","nm":"Maternity support shorts","wy":"Comfortable under dresses","pr":"₹300–600"},
       {"ico":"💊","nm":"Omega-3 DHA","wy":"Baby brain development","pr":"₹400–800/mo"}]'),

(18, '[{"ico":"🛌","nm":"Full-body pregnancy pillow","wy":"Sleep quality drops without it","pr":"₹1,200–2,500"},
       {"ico":"🧦","nm":"Compression stockings","wy":"Swelling in ankles starts","pr":"₹400–700"},
       {"ico":"👙","nm":"Maternity swimsuit","wy":"Swimming is the best exercise","pr":"₹800–1,500"},
       {"ico":"💊","nm":"Calcium + Vitamin D","wy":"Baby skeleton forming daily","pr":"₹150–300/mo"}]'),

(19, '[{"ico":"🧦","nm":"Compression socks (2 pairs)","wy":"Wear daily to reduce swelling","pr":"₹300–600 each"},
       {"ico":"🧴","nm":"Belly oil (refill)","wy":"Skin stretching rapidly now","pr":"₹300–700"},
       {"ico":"💊","nm":"Iron + Vitamin C","wy":"Vitamin C doubles absorption","pr":"₹150–300/mo"},
       {"ico":"🥛","nm":"Protein powder (unflavoured)","wy":"Easy protein boost in milk","pr":"₹600–1,200"}]'),

(20, '[{"ico":"📸","nm":"Maternity photoshoot outfit","wy":"Halfway — document it","pr":"₹1,000–3,000"},
       {"ico":"🧦","nm":"Compression stockings","wy":"Half of pregnancy done on feet","pr":"₹400–700"},
       {"ico":"🧴","nm":"Belly butter (large size)","wy":"Itching means skin is stretching","pr":"₹400–800"},
       {"ico":"💊","nm":"Omega-3 DHA","wy":"Brain development milestone week","pr":"₹400–800/mo"}]'),

(21, '[{"ico":"🎒","nm":"Hospital bag (buy it now)","wy":"Start filling early, no rush","pr":"₹800–2,000"},
       {"ico":"👡","nm":"Comfortable slip-on sandals","wy":"Feet swell in heat — plan ahead","pr":"₹600–1,200"},
       {"ico":"🧦","nm":"Compression socks","wy":"Standing or sitting long periods","pr":"₹300–600"},
       {"ico":"🧴","nm":"Belly massage oil","wy":"Skin stretching accelerates","pr":"₹300–700"}]'),

(22, '[{"ico":"🛌","nm":"Pregnancy pillow (if not yet)","wy":"Left-side sleeping is essential","pr":"₹1,200–2,500"},
       {"ico":"🧦","nm":"Compression socks","wy":"Ankle swelling starts around now","pr":"₹300–600"},
       {"ico":"🩱","nm":"Maternity support belt","wy":"Back pain relief — wear daily","pr":"₹600–1,200"},
       {"ico":"🧴","nm":"Stretch mark cream","wy":"Belly at peak growth rate","pr":"₹300–700"}]'),

(23, '[{"ico":"🩱","nm":"Maternity support belt","wy":"Belly weight on your back now","pr":"₹600–1,200"},
       {"ico":"👟","nm":"Wide-fit walking shoes","wy":"Feet swell — buy half size up","pr":"₹800–2,000"},
       {"ico":"💊","nm":"Iron + Vitamin C combo","wy":"Anaemia risk highest now","pr":"₹150–300/mo"},
       {"ico":"🧦","nm":"Compression socks","wy":"Daily wear from here","pr":"₹300–600"}]'),

(24, '[{"ico":"💧","nm":"Glucose drink (for GTT)","wy":"Get it before the test","pr":"₹50–100"},
       {"ico":"🧦","nm":"Anti-swelling compression socks","wy":"Swelling peaks mid-second tri","pr":"₹400–700"},
       {"ico":"🩱","nm":"Maternity support belt","wy":"Distribute belly weight","pr":"₹600–1,200"},
       {"ico":"🥜","nm":"Healthy Indian snack mix","wy":"Blood sugar stable = less GTD risk","pr":"₹150–300"}]'),

(25, '[{"ico":"🎒","nm":"Hospital bag (if not bought)","wy":"Third trimester starts soon","pr":"₹800–2,000"},
       {"ico":"🩱","nm":"Nursing bra (first one)","wy":"Get fitted now, not later","pr":"₹500–900"},
       {"ico":"🧴","nm":"Nipple cream (Lansinoh)","wy":"Start using before birth","pr":"₹400–700"},
       {"ico":"💊","nm":"Calcium + Vitamin D","wy":"Baby bones hardening now","pr":"₹150–300/mo"}]'),

(26, '[{"ico":"🩱","nm":"Nursing bra (2 pack)","wy":"You will wear these constantly","pr":"₹500–900 each"},
       {"ico":"🎒","nm":"Hospital bag","wy":"Should be bought and started","pr":"₹800–2,000"},
       {"ico":"🧴","nm":"Belly oil (large bottle)","wy":"Skin very tight now","pr":"₹400–800"},
       {"ico":"🩺","nm":"BP monitor (home use)","wy":"Track for preeclampsia signs","pr":"₹1,200–2,500"}]'),

(27, '[{"ico":"🩺","nm":"Home BP monitor","wy":"Third trimester — track weekly","pr":"₹1,200–2,500"},
       {"ico":"🛁","nm":"Comfortable hospital robe","wy":"Pack it in hospital bag now","pr":"₹500–1,000"},
       {"ico":"🩲","nm":"Disposable underwear (pack)","wy":"For hospital stay","pr":"₹200–400"},
       {"ico":"👶","nm":"Newborn onesies (3 pack)","wy":"Gender-neutral, 0-3 months","pr":"₹400–800"}]'),

(28, '[{"ico":"🩺","nm":"Kick counter app or clicker","wy":"Daily counting starts now","pr":"₹0–200"},
       {"ico":"🧴","nm":"Nipple cream","wy":"Prep before birth — less pain","pr":"₹400–700"},
       {"ico":"🩲","nm":"Maternity pads (pack)","wy":"Buy now, use after birth","pr":"₹150–300"},
       {"ico":"👶","nm":"Swaddle cloths (2-pack)","wy":"Newborn essential","pr":"₹300–600"}]'),

(29, '[{"ico":"🩱","nm":"Nursing bra (extra)","wy":"You need 3–4 total","pr":"₹500–900"},
       {"ico":"👶","nm":"Newborn clothing pack","wy":"0–3 months, wash before use","pr":"₹500–1,200"},
       {"ico":"🛏️","nm":"Baby bassinet or Moses basket","wy":"Order now — delivery takes time","pr":"₹2,000–5,000"},
       {"ico":"🧴","nm":"Nipple cream in bulk","wy":"You will go through it fast","pr":"₹400–700"}]'),

(30, '[{"ico":"🧴","nm":"Maternity pads (bulk pack)","wy":"Buy 3–4 packs before birth","pr":"₹150–300 each"},
       {"ico":"🩱","nm":"Nursing pads (washable)","wy":"Leaking starts before birth","pr":"₹300–600"},
       {"ico":"👘","nm":"Button-front nightwear","wy":"Easy for feeding, hospital-ready","pr":"₹600–1,200"},
       {"ico":"🧊","nm":"Perineal ice packs","wy":"Recovery essential post-birth","pr":"₹200–400"}]'),

(31, '[{"ico":"🤱","nm":"Breast pump","wy":"Research and buy before birth","pr":"₹2,000–6,000"},
       {"ico":"🩱","nm":"Nursing bras (top up to 4)","wy":"One for each day between washes","pr":"₹500–900 each"},
       {"ico":"🛏️","nm":"Baby sleeping bag","wy":"Safer than blankets for newborns","pr":"₹600–1,500"},
       {"ico":"🍱","nm":"Freezer containers (bulk)","wy":"Prep meals now for after birth","pr":"₹300–600"}]'),

(32, '[{"ico":"👶","nm":"Nappies pack (Newborn size)","wy":"Get one pack, buy more after","pr":"₹400–700"},
       {"ico":"🛁","nm":"Baby bath tub","wy":"Order now — large item","pr":"₹800–2,000"},
       {"ico":"🪑","nm":"Feeding pillow (Boppy style)","wy":"Supports latch — worth it","pr":"₹800–1,500"},
       {"ico":"🧴","nm":"Baby body wash and oil","wy":"Test brand before baby arrives","pr":"₹300–600"}]'),

(33, '[{"ico":"🚗","nm":"Car seat (install this week)","wy":"Get it checked by a professional","pr":"₹3,000–8,000"},
       {"ico":"🎽","nm":"Baby carrier or wrap","wy":"Hands-free carry from day 1","pr":"₹1,500–4,000"},
       {"ico":"🍼","nm":"Bottle steriliser","wy":"Even if breastfeeding, have one","pr":"₹1,500–3,500"},
       {"ico":"🧴","nm":"Baby-safe laundry detergent","wy":"Wash all newborn clothes now","pr":"₹200–400"}]'),

(34, '[{"ico":"🍱","nm":"Freezer meal containers","wy":"Cook and freeze this week","pr":"₹300–600"},
       {"ico":"🩲","nm":"Postpartum recovery shorts","wy":"Compression helps healing","pr":"₹600–1,200"},
       {"ico":"🪑","nm":"Nursing stool / footrest","wy":"Posture while feeding","pr":"₹400–800"},
       {"ico":"🧴","nm":"Heavy-duty maternity pads","wy":"First 48h are intense","pr":"₹200–400 per pack"}]'),

(35, '[{"ico":"🧴","nm":"Postpartum recovery kit","wy":"Peri bottle, pads, ice packs","pr":"₹500–1,000"},
       {"ico":"🩲","nm":"Postpartum underwear (high-waist)","wy":"Comfortable over section scar","pr":"₹300–600"},
       {"ico":"🤱","nm":"Nipple cream (stock up)","wy":"You will use a lot post-birth","pr":"₹400–700"},
       {"ico":"🍱","nm":"Batch-cook and freeze now","wy":"You will not cook for 2 weeks","pr":"₹500–1,000 in ingredients"}]'),

(36, '[{"ico":"🚿","nm":"Peri bottle","wy":"Essential for post-birth comfort","pr":"₹150–300"},
       {"ico":"👶","nm":"Extra newborn nappies","wy":"Never enough in first weeks","pr":"₹400–700"},
       {"ico":"📱","nm":"Baby monitor","wy":"Order now, test before birth","pr":"₹2,000–5,000"},
       {"ico":"👘","nm":"Button-front pyjamas","wy":"Hospital + feeding from day 1","pr":"₹600–1,200"}]'),

(37, '[{"ico":"💋","nm":"Lip balm for labour bag","wy":"Breathing dries lips fast","pr":"₹80–200"},
       {"ico":"🍫","nm":"High-energy snacks","wy":"For labour bag — dates, nuts, bars","pr":"₹200–400"},
       {"ico":"🧦","nm":"Warm socks for hospital","wy":"Labour rooms are cold","pr":"₹100–200"},
       {"ico":"🔌","nm":"Extra phone charger","wy":"Labour is long — keep it charged","pr":"₹300–600"}]'),

(38, '[{"ico":"🌙","nm":"Dates (Medjool)","wy":"Evidence suggests ripening effect","pr":"₹400–800"},
       {"ico":"🔥","nm":"Hot water bottle","wy":"Back labour pain relief","pr":"₹300–600"},
       {"ico":"🎧","nm":"Headphones + playlist","wy":"Music during early labour","pr":"₹500–2,000"},
       {"ico":"🧦","nm":"Non-slip socks","wy":"For hospital floor walking","pr":"₹100–200"}]'),

(39, '[{"ico":"🌙","nm":"Dates (keep stocked)","wy":"Natural induction support","pr":"₹400–800"},
       {"ico":"💆","nm":"Massage oil for partner","wy":"Back massage during labour","pr":"₹200–400"},
       {"ico":"🎧","nm":"Downloaded entertainment","wy":"Early labour can be slow","pr":"₹0 (Netflix download)"},
       {"ico":"🧃","nm":"Electrolyte drinks","wy":"Energy during early labour","pr":"₹100–200"}]'),

(40, '[{"ico":"🌙","nm":"Dates (final stock)","wy":"Eat 6 daily near term","pr":"₹400–800"},
       {"ico":"🌿","nm":"Raspberry leaf tea (ask doctor)","wy":"Traditional uterine toner","pr":"₹150–300"},
       {"ico":"🎧","nm":"Labour playlist ready","wy":"Distraction during contractions","pr":"₹0"},
       {"ico":"🧃","nm":"Electrolyte drinks (stock)","wy":"Labour hydration","pr":"₹100–200"}]')

ON CONFLICT (week) DO UPDATE SET shopping = EXCLUDED.shopping;
