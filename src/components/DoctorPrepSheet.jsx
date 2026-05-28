import React, { useEffect, useState } from "react";

export default function DoctorPrepSheet({
  healthContext,
  profileData,
  onClose,
}) {
  const [vis, setVis] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVis(true));
  }, []);

  const close = () => {
    setVis(false);
    setTimeout(onClose, 350);
  };

  const items =
    healthContext?.doctorPrep || [];

  const appt =
    profileData?.next_appointment_date;

  const daysLeft = appt
    ? Math.ceil(
        (new Date(appt) - new Date()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <>
      <div
        className={`pedit-backdrop${
          vis ? " open" : ""
        }`}
        onClick={close}
      />

      <div
        className={`doc-prep-sheet${
          vis ? " open" : ""
        }`}
      >
        <div className="pedit-handle" />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            marginBottom: 4,
          }}
        >
          <div
            style={{
              fontFamily:
                "'Lora',serif",
              fontSize: 22,
              color: "var(--ink)",
            }}
          >
            Doctor{" "}
            <em
              style={{
                fontStyle: "italic",
                color: "var(--navy)",
              }}
            >
              prep list
            </em>
          </div>

          {appt && (
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "var(--navy)",
                background:
                  "var(--navy-pale)",
                border:
                  "1px solid var(--navy-bdr)",
                borderRadius: 100,
                padding:
                  "4px 12px",
              }}
            >
              {daysLeft === 0
                ? "Today!"
                : daysLeft === 1
                ? "Tomorrow"
                : daysLeft > 0
                ? `in ${daysLeft} days`
                : "Past"}
            </div>
          )}
        </div>

        <div
          style={{
            fontSize: 12,
            color: "var(--muted)",
            marginBottom: 20,
          }}
        >
          Things worth discussing
          at your next visit
        </div>

        {items.length > 0 ? (
          items.map((item, i) => (
            <div
              key={i}
              className="doc-prep-item"
            >
              <div
                className="doc-prep-priority"
                style={{
                  background:
                    item.priority ===
                    "high"
                      ? "var(--rose)"
                      : item.priority ===
                        "medium"
                      ? "var(--amber)"
                      : "var(--muted)",
                }}
              />

              <div className="doc-prep-text">
                {item.text}
              </div>
            </div>
          ))
        ) : (
          <div
            style={{
              fontSize: 13,
              color:
                "var(--muted)",
              fontStyle: "italic",
              padding:
                "16px 0",
            }}
          >
            No items yet —
            add lab results,
            medicines and
            visit notes to
            build your prep
            list automatically.
          </div>
        )}

        <button
          onClick={close}
          style={{
            width: "100%",
            marginTop: 20,
            padding: "14px",
            background:
              "var(--teal)",
            border: "none",
            borderRadius: 100,
            fontSize: 15,
            fontWeight: 600,
            color: "#fff",
            cursor: "pointer",
            fontFamily:
              "inherit",
          }}
        >
          Got it
        </button>
      </div>
    </>
  );
}