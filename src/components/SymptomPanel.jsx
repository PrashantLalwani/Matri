import React, { useState, useEffect, useRef } from "react";

export default function SymptomPanel({
  initialQuery,
  analytics,
  authFetch,
  COMMON_SYMPTOMS,
  week = 8,
}) {
  const [query, setQuery] = useState(initialQuery || "");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const QUICK = [
    "stomach tightening",
    "headache",
    "no movement felt",
    "leg cramps",
    "can't sleep",
    "spotting",
    "breathless",
  ];

  const ask = async (q) => {
    const trimmed = (q || query).trim();
    if (!trimmed) return;

    analytics.symptomAsked(trimmed);

    setQuery(trimmed);
    setLoading(true);
    setResult(null);

    try {
      const resp = await authFetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 600,
          system: `You are Matri, a compassionate Indian pregnancy companion app. The user is ${week} weeks pregnant. When they describe a symptom or concern, respond in this exact JSON format with no other text:
{
  "symptom": "short name of the symptom",
  "likely": "most probable explanation in 1-2 sentences, reassuring and specific to week 8",
  "watch": "what to monitor or what would warrant a call — 1 sentence",
  "callNow": "specific red flags that mean call doctor immediately — 1 sentence, or null if none",
  "reassurance": "a warm closing sentence"
}`,
          messages: [
            {
              role: "user",
              content: trimmed,
            },
          ],
        }),
      });

      const data = await resp.json();

      const text =
        data.content?.find((b) => b.type === "text")?.text || "";

      const clean = text
        .replace(/```json|```/g, "")
        .trim();

      setResult(JSON.parse(clean));
    } catch {
      setResult({
        symptom: "Couldn't connect right now",
        likely:
          "We weren't able to reach our servers just now. This sometimes happens with a slow connection.",
        watch:
          "Wait a few seconds and tap your question again — it usually works on the second try.",
        callNow:
          "If you're worried about something urgent, always call your doctor directly. That's always the right call.",
        reassurance:
          "We're sorry for the trouble. Your question was heard — just try once more.",
      });
    }

    setLoading(false);
  };

  useEffect(() => {
    if (initialQuery) ask(initialQuery);
  }, []);

  const handleChip = (key) => {
    analytics.quickQuestionClicked(key);

    const s = COMMON_SYMPTOMS[key];
    if (!s) return;

    setQuery(s.label);

    setResult({
      symptom: s.label,
      likely: s.means,
      watch: s.tryThis,
      callNow: s.callIf,
      reassurance:
        "You're not alone in feeling this. Trust your instincts — if something feels wrong, always call your doctor.",
      _structured: true,
    });

    setLoading(false);
  };

  return (
    <>
      <div
        style={{
          fontSize: 13,
          color: "var(--muted)",
          lineHeight: 1.65,
          marginBottom: 12,
          fontStyle: "italic",
        }}
      >
        Tap a common concern or describe what you're feeling.
      </div>

      {!result && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 7,
            marginBottom: 14,
          }}
        >
          {Object.entries(COMMON_SYMPTOMS).map(([key, s]) => (
            <button
              key={key}
              onClick={() => handleChip(key)}
              style={{
                background: "#fff",
                border: "1px solid var(--bdr)",
                borderRadius: 100,
                padding: "6px 13px",
                fontSize: 12,
                color: "var(--ink)",
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: 500,
                transition: "all 0.14s",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      <div
        className="symptom-bar-inner"
        style={{
          marginBottom: 12,
          borderRadius: 14,
        }}
      >
        <span className="symptom-bar-icon">
          🔍
        </span>

        <input
          ref={inputRef}
          className="symptom-bar-input"
          placeholder="e.g. stomach tightening, can't sleep, spotting..."
          value={query}
          onChange={(e) =>
            setQuery(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") ask();
          }}
        />

        <button
          className="symptom-bar-btn"
          onClick={() => ask()}
        >
          Ask
        </button>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          marginBottom: 16,
        }}
      >
        {QUICK.map((q) => (
          <div
            key={q}
            onClick={() => ask(q)}
            style={{
              background: "var(--cream2)",
              border: "1px solid var(--bdr)",
              borderRadius: 100,
              padding: "5px 12px",
              fontSize: 11,
              color: "var(--muted)",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {q}
          </div>
        ))}
      </div>

      {loading && (
        <div className="symptom-loading">
          Thinking through this for you…
        </div>
      )}

      {result && !loading && (
        <div className="symptom-result">
          <div className="symptom-result-q">
            You asked about:{" "}
            <strong>{result.symptom}</strong>
          </div>

          <div className="symptom-tier">
            <div
              className="symptom-tier-dot"
              style={{
                background: "var(--forest)",
              }}
            />

            <div>
              <div
                className="symptom-tier-label"
                style={{
                  color: "var(--forest)",
                }}
              >
                Most likely
              </div>

              <div className="symptom-tier-text">
                {result.likely}
              </div>
            </div>
          </div>

          {result.watch && (
            <div className="symptom-tier">
              <div
                className="symptom-tier-dot"
                style={{
                  background: "var(--amber)",
                }}
              />

              <div>
                <div
                  className="symptom-tier-label"
                  style={{
                    color: "var(--amber)",
                  }}
                >
                  Watch for
                </div>

                <div className="symptom-tier-text">
                  {result.watch}
                </div>
              </div>
            </div>
          )}

          {result.callNow && (
            <div className="symptom-tier">
              <div
                className="symptom-tier-dot"
                style={{
                  background: "var(--rose)",
                }}
              />

              <div>
                <div
                  className="symptom-tier-label"
                  style={{
                    color: "var(--rose)",
                  }}
                >
                  Call doctor now
                </div>

                <div className="symptom-tier-text">
                  {result.callNow}
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: 12,
              fontSize: 13,
              fontStyle: "italic",
              color: "var(--muted)",
            }}
          >
            {result.reassurance}
          </div>
        </div>
      )}
    </>
  );
}