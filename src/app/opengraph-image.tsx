import { ImageResponse } from "next/og";

export const alt = "StudyTool — turn your PDFs into a day-by-day study plan";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Social share card (Open Graph + Twitter). Rendered at build time by Satori.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 50%, #fdf4ff 100%)",
          padding: 80,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              width: 104,
              height: 104,
              borderRadius: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 55%, #d946ef 100%)",
            }}
          >
            <svg
              width="60"
              height="60"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <span style={{ fontSize: 72, fontWeight: 700, color: "#0f172a" }}>StudyTool</span>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 48,
            fontSize: 52,
            fontWeight: 700,
            color: "#1e293b",
            textAlign: "center",
            maxWidth: 960,
            lineHeight: 1.2,
          }}
        >
          Turn your PDFs into a day-by-day study plan
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 30,
            color: "#64748b",
            textAlign: "center",
            maxWidth: 820,
          }}
        >
          AI summaries, flashcards, and quizzes for every topic
        </div>
      </div>
    ),
    { ...size }
  );
}
