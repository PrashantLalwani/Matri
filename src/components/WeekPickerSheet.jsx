import { useEffect, useRef, useState } from "react";

const TRIMESTER_LABEL = (w) =>
  w <= 13 ? "T1" : w <= 26 ? "T2" : "T3";

const TRIMESTER_COLOR = (w) =>
  w <= 13 ? "var(--rose)" : w <= 26 ? "var(--forest)" : "var(--plum)";

/**
 * WeekPickerSheet
 *
 * Props:
 *   open        — boolean, controls visibility
 *   onClose     — () => void
 *   currentWeek — the real computed week from due_date (may be null)
 *   browseWeek  — the currently selected browse week (null = live)
 *   onSelect    — (week: number | null) => void
 *                 called with null when user taps "Back to current week"
 */
export default function WeekPickerSheet({ open, onClose, currentWeek, browseWeek, onSelect }) {
  const [vis, setVis] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVis(true));
    } else {
      setVis(false);
    }
  }, [open]);

  // Scroll the selected / current week into view when opening
  useEffect(() => {
    if (!vis || !listRef.current) return;
    const target = browseWeek ?? currentWeek;
    if (!target) return;
    const el = listRef.current.querySelector(`[data-week="${target}"]`);
    if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [vis, browseWeek, currentWeek]);

  if (!open) return null;

  const effectiveWeek = browseWeek ?? currentWeek;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: vis ? "rgba(16,10,8,0.72)" : "rgba(16,10,8,0)",
          transition: "background 0.3s",
          pointerEvents: vis ? "all" : "none",
        }}
      />

      {/* Sheet */}
      <div style={{
        position: "fixed", left: "50%", bottom: 0, zIndex: 201,
        width: "100%", maxWidth: 430,
        transform: `translateX(-50%) translateY(${vis ? "0%" : "100%"})`,
        transition: "transform 0.38s cubic-bezier(0.3,0.72,0,1)",
        background: "var(--cream)",
        borderRadius: "28px 28px 0 0",
        display: "flex", flexDirection: "column",
        maxHeight: "80vh",
        overflow: "hidden",
      }}>
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 100, background: "var(--bdr)" }} />
        </div>

        {/* Header */}
        <div style={{
          padding: "12px 20px 14px",
          borderBottom: "1px solid var(--bdr)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 4 }}>
              Browse weeks
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 400, color: "var(--ink)" }}>
              Your pregnancy journey
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent", border: "none", fontSize: 18, color: "var(--muted)",
              cursor: "pointer", fontFamily: "inherit", padding: "4px 8px",
              WebkitTapHighlightColor: "transparent",
            }}>
            ✕
          </button>
        </div>

        {/* Week list */}
        <div
          ref={listRef}
          style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", padding: "8px 0" }}
        >
          {/* T1 */}
          <TrimesterSection label="First Trimester" weeks={range(4, 13)} currentWeek={currentWeek} effectiveWeek={effectiveWeek} onSelect={onSelect} />
          {/* T2 */}
          <TrimesterSection label="Second Trimester" weeks={range(14, 26)} currentWeek={currentWeek} effectiveWeek={effectiveWeek} onSelect={onSelect} />
          {/* T3 */}
          <TrimesterSection label="Third Trimester" weeks={range(27, 40)} currentWeek={currentWeek} effectiveWeek={effectiveWeek} onSelect={onSelect} />
        </div>

        {/* Footer — "back to current" button, shown only when browsing */}
        {browseWeek !== null && currentWeek && (
          <div style={{
            padding: "12px 16px 28px",
            borderTop: "1px solid var(--bdr)",
            flexShrink: 0,
            background: "var(--cream)",
          }}>
            <button
              onClick={() => { onSelect(null); onClose(); }}
              style={{
                width: "100%", padding: "13px 20px",
                background: "var(--ink)", color: "#fff",
                border: "none", borderRadius: 14,
                fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
                WebkitTapHighlightColor: "transparent",
              }}>
              ← Back to Week {currentWeek}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function TrimesterSection({ label, weeks, currentWeek, effectiveWeek, onSelect }) {
  const color = TRIMESTER_COLOR(weeks[0]);
  return (
    <div>
      <div style={{
        padding: "10px 20px 6px",
        fontSize: 9, fontWeight: 700, letterSpacing: "0.2em",
        textTransform: "uppercase", color,
      }}>
        {label}
      </div>
      {weeks.map(w => (
        <WeekRow
          key={w}
          week={w}
          isCurrent={w === currentWeek}
          isSelected={w === effectiveWeek}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function WeekRow({ week, isCurrent, isSelected, onSelect }) {
  const trimLabel = TRIMESTER_LABEL(week);
  const trimColor = TRIMESTER_COLOR(week);

  return (
    <button
      data-week={week}
      onClick={() => onSelect(week)}
      style={{
        width: "100%", display: "flex", alignItems: "center",
        gap: 14, padding: "11px 20px",
        background: isSelected ? "rgba(0,0,0,0.04)" : "transparent",
        border: "none", cursor: "pointer",
        fontFamily: "inherit", textAlign: "left",
        WebkitTapHighlightColor: "transparent",
        transition: "background 0.1s",
      }}>

      {/* Week number */}
      <div style={{
        width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: isSelected ? "var(--ink)" : "var(--cream2)",
        border: isCurrent && !isSelected ? `2px solid ${trimColor}` : "2px solid transparent",
        fontSize: 13, fontWeight: 700,
        color: isSelected ? "#fff" : "var(--ink)",
        transition: "all 0.15s",
      }}>
        {week}
      </div>

      {/* Label */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", lineHeight: 1.2 }}>
          Week {week}
        </div>
        <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
          {isCurrent ? (
            <span style={{ color: trimColor, fontWeight: 700 }}>← You are here</span>
          ) : (
            trimLabel
          )}
        </div>
      </div>

      {/* Check when selected */}
      {isSelected && (
        <div style={{
          width: 18, height: 18, borderRadius: "50%",
          background: "var(--ink)", display: "flex",
          alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>✓</span>
        </div>
      )}
    </button>
  );
}

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}
