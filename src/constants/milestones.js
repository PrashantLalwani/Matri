export const MILESTONES = [
  {wk:6,name:"Heartbeat"},{wk:7,name:"Dating scan"},{wk:8,name:"8-wk check"},
  {wk:10,name:"Blood tests"},{wk:12,name:"12-wk scan"},{wk:14,name:"T2 begins"},
  {wk:16,name:"Movements"},{wk:20,name:"Anomaly scan"},{wk:24,name:"GTT test"},
  {wk:28,name:"T3 begins"},{wk:32,name:"Growth scan"},{wk:36,name:"Final prep"},
  {wk:40,name:"Due date"},
];

/**
 * Returns MILESTONES with `done` and `current` computed from the given week.
 * Always use this instead of reading MILESTONES directly when rendering.
 */
export function getMilestones(week) {
  if (!week) return MILESTONES.map(m => ({ ...m, done: false, current: false }));
  return MILESTONES.map(m => ({
    ...m,
    done:    m.wk < week,
    current: m.wk === week,
  }));
}
