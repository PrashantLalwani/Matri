-- Seed week-specific checklists for all 40 weeks.
-- Run in Supabase SQL Editor (step 1: add the column, step 2: this file).
--
-- Priority colours:
--   #c04040 = red   = "Today"
--   #8a5010 = amber = "This week"
--   #3d6b4a = green = "Soon"

INSERT INTO weekly_content (week, checklist) VALUES

(1, '[
  {"id":1,"text":"Start taking folic acid 400mcg daily","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Stop alcohol, smoking, and recreational drugs","pri":"Today","col":"#c04040"},
  {"id":3,"text":"Review any regular medications with your doctor","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Track your cycle carefully from today","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Schedule a pre-conception check if not done","pri":"Soon","col":"#3d6b4a"}
]'),

(2, '[
  {"id":1,"text":"Continue folic acid daily without missing","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Eat iron-rich foods: spinach, lentils, eggs","pri":"This week","col":"#8a5010"},
  {"id":3,"text":"Avoid high-mercury fish: tuna, swordfish","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Keep stress low — ovulation week","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Sleep 7–8 hours — it matters now","pri":"Soon","col":"#3d6b4a"}
]'),

(3, '[
  {"id":1,"text":"Continue folic acid — implantation may have happened","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Avoid NSAIDs (ibuprofen) — use paracetamol only","pri":"Today","col":"#c04040"},
  {"id":3,"text":"No alcohol this week — err on the side of caution","pri":"Today","col":"#c04040"},
  {"id":4,"text":"Stay well hydrated: 2.5–3L water daily","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"You may feel nothing yet — that is completely normal","pri":"Soon","col":"#3d6b4a"}
]'),

(4, '[
  {"id":1,"text":"Take a home pregnancy test","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Start prenatal vitamins with folic acid immediately","pri":"Today","col":"#c04040"},
  {"id":3,"text":"Book your first OB appointment (aim for week 7–8)","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Stop alcohol completely","pri":"Today","col":"#c04040"},
  {"id":5,"text":"Note your last menstrual period date for due date calculation","pri":"This week","col":"#8a5010"}
]'),

(5, '[
  {"id":1,"text":"Book your first antenatal blood tests","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Manage morning sickness: eat small meals every 2 hours","pri":"This week","col":"#8a5010"},
  {"id":3,"text":"Avoid raw fish, soft cheese, and deli meats","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Tell your partner if you have not already","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Rest without guilt — fatigue is real and necessary","pri":"This week","col":"#8a5010"},
  {"id":6,"text":"Research OB doctors and confirm your choice","pri":"Soon","col":"#3d6b4a"}
]'),

(6, '[
  {"id":1,"text":"Book first ultrasound scan to confirm heartbeat","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Get blood group and Rh factor tested","pri":"Today","col":"#c04040"},
  {"id":3,"text":"Start iron and folic acid supplements if not already","pri":"Today","col":"#c04040"},
  {"id":4,"text":"Identify your nearest maternity hospital","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Tell one trusted person in case of emergency","pri":"This week","col":"#8a5010"}
]'),

(7, '[
  {"id":1,"text":"Confirm your OB or gynecologist choice","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Ask about your estimated due date","pri":"Today","col":"#c04040"},
  {"id":3,"text":"Get complete blood panel: CBC, thyroid, blood sugar","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Avoid self-medicating — check with doctor first","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Stock nausea foods: ginger biscuits, crackers, coconut water","pri":"Soon","col":"#3d6b4a"}
]'),

(8, '[
  {"id":1,"text":"Finalize your doctor","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Tell your parents and close ones","pri":"Today","col":"#c04040"},
  {"id":3,"text":"Book NT scan for weeks 11–14","pri":"Today","col":"#c04040"},
  {"id":4,"text":"Start folic acid and iron daily if not already","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Tell your partner what you need this week","pri":"This week","col":"#8a5010"},
  {"id":6,"text":"Stock nausea foods: crackers, curd, coconut water","pri":"This week","col":"#8a5010"},
  {"id":7,"text":"Create a folder for all scans and reports","pri":"Soon","col":"#3d6b4a"}
]'),

(9, '[
  {"id":1,"text":"Book NT scan — must be done by week 14","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Ask about NIPT (non-invasive prenatal testing)","pri":"This week","col":"#8a5010"},
  {"id":3,"text":"Rest when needed — this is often peak fatigue","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Avoid heavy lifting and high-impact exercise","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Log symptoms to discuss at next appointment","pri":"Soon","col":"#3d6b4a"}
]'),

(10, '[
  {"id":1,"text":"NIPT blood draw this week if opting for it","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Inform your dentist you are pregnant before any treatment","pri":"This week","col":"#8a5010"},
  {"id":3,"text":"Check health insurance coverage for delivery","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Start gentle daily walks — 20 minutes is enough","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Review diet: protein, iron, folate are the priority","pri":"Soon","col":"#3d6b4a"}
]'),

(11, '[
  {"id":1,"text":"NT scan this week or next — do not delay","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Discuss Down syndrome screening results with your doctor","pri":"This week","col":"#8a5010"},
  {"id":3,"text":"Decide when to announce to extended family","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Buy a supportive maternity bra — your size is changing","pri":"Soon","col":"#3d6b4a"},
  {"id":5,"text":"Book follow-up appointment post NT scan","pri":"This week","col":"#8a5010"}
]'),

(12, '[
  {"id":1,"text":"NT scan if not yet done — last good week","pri":"Today","col":"#c04040"},
  {"id":2,"text":"First trimester screening blood tests complete","pri":"Today","col":"#c04040"},
  {"id":3,"text":"Share news with close family if ready","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Check your employer maternity leave policy","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Schedule 16-week OB check","pri":"Soon","col":"#3d6b4a"}
]'),

(13, '[
  {"id":1,"text":"End of first trimester — celebrate this milestone","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Book anatomy scan for weeks 18–22","pri":"This week","col":"#8a5010"},
  {"id":3,"text":"Begin gentle prenatal yoga or swimming","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Start announcing at work if comfortable","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Review diet now that nausea may be easing","pri":"Soon","col":"#3d6b4a"}
]'),

(14, '[
  {"id":1,"text":"Tell your employer officially","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Register with the maternity ward at your hospital","pri":"This week","col":"#8a5010"},
  {"id":3,"text":"Schedule 16-week OB check if not done","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Start moisturising belly daily — stretch marks incoming","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Increase calcium: dairy, ragi, sesame seeds","pri":"Soon","col":"#3d6b4a"}
]'),

(15, '[
  {"id":1,"text":"Quad screen blood test — ask your doctor if opting","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Buy first maternity clothes if needed","pri":"This week","col":"#8a5010"},
  {"id":3,"text":"Prepare questions for the upcoming anatomy scan","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Aim for 2.5–3L water daily","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Start sleeping on your left side","pri":"Soon","col":"#3d6b4a"}
]'),

(16, '[
  {"id":1,"text":"16-week OB visit","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Ask about amniocentesis if screening raised concerns","pri":"This week","col":"#8a5010"},
  {"id":3,"text":"Baby movements coming soon — ask doctor what to expect","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Research prenatal classes near you","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Update health insurance to include maternity cover","pri":"Soon","col":"#3d6b4a"}
]'),

(17, '[
  {"id":1,"text":"Book anatomy scan for weeks 18–20","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Write questions for the anatomy scan","pri":"This week","col":"#8a5010"},
  {"id":3,"text":"Buy a pregnancy pillow if sleep is uncomfortable","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Research pediatricians — good ones get booked early","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Ask your doctor about safe exercise this trimester","pri":"Soon","col":"#3d6b4a"}
]'),

(18, '[
  {"id":1,"text":"Anatomy scan this week or next","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Decide whether to find out the sex","pri":"Today","col":"#c04040"},
  {"id":3,"text":"Begin maternity leave paperwork with employer","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Start thinking about baby sleeping space at home","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Ask about safe travel limits for this trimester","pri":"Soon","col":"#3d6b4a"}
]'),

(19, '[
  {"id":1,"text":"Review anatomy scan results with your doctor","pri":"Today","col":"#c04040"},
  {"id":2,"text":"You may feel first kicks this week — note the time","pri":"This week","col":"#8a5010"},
  {"id":3,"text":"Research cord blood banking options","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Increase calcium and protein in your diet","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Book next OB visit for weeks 20–22","pri":"Soon","col":"#3d6b4a"}
]'),

(20, '[
  {"id":1,"text":"Halfway — confirm anatomy scan results are fully reviewed","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Book a belly photo if you want one","pri":"This week","col":"#8a5010"},
  {"id":3,"text":"Tell everyone — you are halfway there","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Research baby gear: focus on essentials only","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Begin thinking about your birth preferences","pri":"Soon","col":"#3d6b4a"}
]'),

(21, '[
  {"id":1,"text":"Book glucose tolerance test for weeks 24–28","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Look into prenatal classes — they fill up fast","pri":"This week","col":"#8a5010"},
  {"id":3,"text":"Start drafting a hospital bag list","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Discuss birth options with your doctor","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Confirm maternity leave dates with employer","pri":"Soon","col":"#3d6b4a"}
]'),

(22, '[
  {"id":1,"text":"Confirm anatomy scan is done or booked","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Ask your doctor about the glucose tolerance test","pri":"Today","col":"#c04040"},
  {"id":3,"text":"Tell your employer about the pregnancy","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Start sleeping on your left side consistently","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Look into maternity leave paperwork","pri":"This week","col":"#8a5010"},
  {"id":6,"text":"Research birth hospitals near you","pri":"Soon","col":"#3d6b4a"},
  {"id":7,"text":"Look into prenatal classes","pri":"Soon","col":"#3d6b4a"}
]'),

(23, '[
  {"id":1,"text":"Book glucose tolerance test if not scheduled","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Research and shortlist pediatricians","pri":"This week","col":"#8a5010"},
  {"id":3,"text":"Begin writing your birth preferences","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Make a decision on cord blood banking","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Increase iron-rich foods to prevent anaemia","pri":"Soon","col":"#3d6b4a"}
]'),

(24, '[
  {"id":1,"text":"Glucose tolerance test this week","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Watch for preeclampsia signs: persistent headache, swelling","pri":"Today","col":"#c04040"},
  {"id":3,"text":"Start or continue prenatal classes","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Research newborn care: bathing, feeding, settling","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Build your emergency contacts list","pri":"Soon","col":"#3d6b4a"}
]'),

(25, '[
  {"id":1,"text":"GTT results — review with your doctor","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Prepare to start kick counting from week 28","pri":"This week","col":"#8a5010"},
  {"id":3,"text":"Plan baby shower if having one","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Research breastfeeding support and lactation consultants","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Confirm birth hospital choice and register there","pri":"Soon","col":"#3d6b4a"}
]'),

(26, '[
  {"id":1,"text":"Review all upcoming third trimester appointments","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Sign up for antenatal classes now if not done","pri":"Today","col":"#c04040"},
  {"id":3,"text":"Start hospital bag list seriously","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Discuss third trimester monitoring plan with doctor","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Research postnatal support: family, nurse, crèche","pri":"Soon","col":"#3d6b4a"}
]'),

(27, '[
  {"id":1,"text":"Plan your third trimester appointment schedule","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Start kick counting — know your baseline","pri":"Today","col":"#c04040"},
  {"id":3,"text":"Begin packing hospital bag","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Discuss epidural and pain management options with doctor","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Research newborn essentials: what you actually need","pri":"Soon","col":"#3d6b4a"}
]'),

(28, '[
  {"id":1,"text":"Start daily kick counting: 10 movements in 2 hours","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Rh-negative? Get Rhogam injection this week","pri":"Today","col":"#c04040"},
  {"id":3,"text":"Schedule fortnightly OB visits from now","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Finalise and register with your birth hospital","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Hospital bag: start packing essentials","pri":"This week","col":"#8a5010"},
  {"id":6,"text":"Stock up on iron supplements if anaemia flagged","pri":"Soon","col":"#3d6b4a"}
]'),

(29, '[
  {"id":1,"text":"Ask your doctor about Tdap vaccine (whooping cough)","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Kick counting: learn your baby normal movement pattern","pri":"Today","col":"#c04040"},
  {"id":3,"text":"Add documents to hospital bag: ID, insurance card, scans","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Research postnatal care at home options","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Check birth certificate paperwork requirements","pri":"Soon","col":"#3d6b4a"}
]'),

(30, '[
  {"id":1,"text":"Hospital tour and registration if not done","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Write first draft of your birth preferences","pri":"Today","col":"#c04040"},
  {"id":3,"text":"Arrange practical support for first weeks at home","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Discuss pain management options in detail with doctor","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Buy: maternity pads, nursing bras, nipple cream","pri":"Soon","col":"#3d6b4a"}
]'),

(31, '[
  {"id":1,"text":"Share birth preferences with your doctor","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Kick counting: flag any change in pattern immediately","pri":"Today","col":"#c04040"},
  {"id":3,"text":"Hospital bag should be nearly complete","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Start freezer meal prep for after birth","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Submit formal maternity leave paperwork to HR","pri":"Soon","col":"#3d6b4a"}
]'),

(32, '[
  {"id":1,"text":"32-week growth scan","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Ask if baby is in the correct position","pri":"Today","col":"#c04040"},
  {"id":3,"text":"Complete hospital bag today","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Set up baby sleeping space at home","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Discuss pain relief plan in detail with your doctor","pri":"This week","col":"#8a5010"},
  {"id":6,"text":"Brief your birth partner on your preferences","pri":"Soon","col":"#3d6b4a"}
]'),

(33, '[
  {"id":1,"text":"Get Tdap (whooping cough) vaccine if not done","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Install car seat and get it checked for correct fit","pri":"This week","col":"#8a5010"},
  {"id":3,"text":"Finalise childcare and postnatal support plans","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Review maternity leave final dates with HR","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Learn newborn feeding basics: latch, burping, cues","pri":"Soon","col":"#3d6b4a"}
]'),

(34, '[
  {"id":1,"text":"Confirm maternity leave start date with HR","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Hospital bag: verify it is packed and accessible","pri":"Today","col":"#c04040"},
  {"id":3,"text":"Review birth preferences with your birth partner","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Learn the warning signs of preterm labour","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Assign birth partner and brief them on the full plan","pri":"This week","col":"#8a5010"}
]'),

(35, '[
  {"id":1,"text":"Group B Strep (GBS) swab test this week","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Weekly OB visits begin from now","pri":"Today","col":"#c04040"},
  {"id":3,"text":"Finalise your postpartum support plan","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Prepare freezer meals or arrange food support","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Rest as much as possible — save your energy","pri":"Soon","col":"#3d6b4a"}
]'),

(36, '[
  {"id":1,"text":"Ask about baby position at your appointment","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Final review of birth preferences with doctor","pri":"Today","col":"#c04040"},
  {"id":3,"text":"Write down every sign of labour — know them","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Confirm hospital route, parking, and contact number","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Set up newborn essentials at home: nappies, clothes, bassinet","pri":"This week","col":"#8a5010"}
]'),

(37, '[
  {"id":1,"text":"Baby is full term — know every sign of labour","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Hospital bag is packed and in the car","pri":"Today","col":"#c04040"},
  {"id":3,"text":"Brief your birth partner on the complete plan","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Save hospital number and route on your phone","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Rest — you have done everything right","pri":"Soon","col":"#3d6b4a"}
]'),

(38, '[
  {"id":1,"text":"Know the difference: real contractions vs Braxton Hicks","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Go to hospital if contractions are 5 min apart for 1 hour","pri":"Today","col":"#c04040"},
  {"id":3,"text":"Keep phone charged, birth partner reachable at all times","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Light walking is fine but do not over-exert","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Eat light, nutritious meals — you need energy for labour","pri":"This week","col":"#8a5010"}
]'),

(39, '[
  {"id":1,"text":"Stay close to home this week","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Daily short walks to help baby engage","pri":"This week","col":"#8a5010"},
  {"id":3,"text":"Know both routes to hospital (including alternate)","pri":"This week","col":"#8a5010"},
  {"id":4,"text":"Hospital bag accessible — not buried in a cupboard","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Rest deeply whenever you can","pri":"Soon","col":"#3d6b4a"}
]'),

(40, '[
  {"id":1,"text":"Call your doctor today if there are no signs of labour","pri":"Today","col":"#c04040"},
  {"id":2,"text":"Discuss induction timing and options with doctor","pri":"Today","col":"#c04040"},
  {"id":3,"text":"Keep up daily kick counts — report any change","pri":"Today","col":"#c04040"},
  {"id":4,"text":"Eat well and rest — it can start any moment","pri":"This week","col":"#8a5010"},
  {"id":5,"text":"Trust your body — 40 weeks is average, not a deadline","pri":"This week","col":"#8a5010"}
]')

ON CONFLICT (week) DO UPDATE SET checklist = EXCLUDED.checklist;
