import type { CSSProperties } from "react";

const PETALS = [
  { x: "3%", start: "-8vh", size: 28, dur: "36s", delay: "-12s", drift: "48px", spin: "20s", sway: "12px", tint: "#c45a80" },
  { x: "10%", start: "8vh", size: 18, dur: "44s", delay: "-22s", drift: "-32px", spin: "24s", sway: "9px", tint: "#fff0f3" },
  { x: "17%", start: "22vh", size: 32, dur: "31s", delay: "-9s", drift: "56px", spin: "18s", sway: "16px", tint: "#e890b0" },
  { x: "24%", start: "48vh", size: 20, dur: "40s", delay: "-28s", drift: "-22px", spin: "21s", sway: "10px", tint: "#d56b8f" },
  { x: "32%", start: "4vh", size: 24, dur: "34s", delay: "-6s", drift: "40px", spin: "19s", sway: "14px", tint: "#f3b4c6" },
  { x: "39%", start: "62vh", size: 16, dur: "46s", delay: "-33s", drift: "-38px", spin: "26s", sway: "8px", tint: "#c45a80" },
  { x: "47%", start: "16vh", size: 30, dur: "38s", delay: "-15s", drift: "28px", spin: "22s", sway: "13px", tint: "#fff5f7" },
  { x: "54%", start: "36vh", size: 19, dur: "29s", delay: "-18s", drift: "-46px", spin: "16s", sway: "15px", tint: "#d4789c" },
  { x: "61%", start: "70vh", size: 26, dur: "42s", delay: "-25s", drift: "34px", spin: "23s", sway: "11px", tint: "#e8a0b8" },
  { x: "69%", start: "12vh", size: 22, dur: "35s", delay: "-4s", drift: "-30px", spin: "19s", sway: "12px", tint: "#c45a80" },
  { x: "76%", start: "28vh", size: 34, dur: "48s", delay: "-31s", drift: "22px", spin: "28s", sway: "18px", tint: "#f7c9d6" },
  { x: "83%", start: "52vh", size: 17, dur: "33s", delay: "-11s", drift: "-50px", spin: "17s", sway: "10px", tint: "#d56b8f" },
  { x: "90%", start: "6vh", size: 29, dur: "39s", delay: "-17s", drift: "30px", spin: "21s", sway: "14px", tint: "#fff0f3" },
  { x: "6%", start: "78vh", size: 14, dur: "50s", delay: "-38s", drift: "54px", spin: "30s", sway: "7px", tint: "#e892b0" },
  { x: "94%", start: "18vh", size: 21, dur: "37s", delay: "-8s", drift: "-24px", spin: "20s", sway: "12px", tint: "#c45a80" },
  { x: "50%", start: "84vh", size: 13, dur: "43s", delay: "-26s", drift: "16px", spin: "25s", sway: "6px", tint: "#f3c2ce" },
  { x: "14%", start: "40vh", size: 36, dur: "52s", delay: "-40s", drift: "-18px", spin: "32s", sway: "20px", tint: "#f0b4c4" },
  { x: "72%", start: "88vh", size: 15, dur: "30s", delay: "-13s", drift: "44px", spin: "18s", sway: "9px", tint: "#d56b8f" },
] as const;

export function SakuraField() {
  return (
    <div className="sakura-field" aria-hidden>
      {PETALS.map((p, i) => (
        <span
          key={i}
          className="sakura-item"
          style={
            {
              "--x": p.x,
              "--start": p.start,
              "--size": `${p.size}px`,
              "--dur": p.dur,
              "--delay": p.delay,
              "--drift": p.drift,
              "--spin": p.spin,
              "--sway": p.sway,
              "--tint": p.tint,
            } as CSSProperties
          }
        >
          {i % 3 === 0 ? <Blossom /> : <Petal />}
        </span>
      ))}
    </div>
  );
}

function Petal() {
  return (
    <svg viewBox="0 0 24 32" fill="currentColor">
      <path d="M12 1.2c.6 4.8-2.4 8.8-5.2 12.2C4.2 16.4 2 19.2 2.6 23c.7 4.2 4.4 7 9.4 7s8.7-2.8 9.4-7c.6-3.8-1.6-6.6-4.2-9.6C14.4 10 11.4 6 12 1.2Z" />
      <path
        d="M12 23.5c-1.4 0-2.4-.8-2.4-1.8 0-2.2 2.4-5.6 2.4-5.6s2.4 3.4 2.4 5.6c0 1-.9 1.8-2.4 1.8Z"
        fill="#fff7f5"
        opacity=".55"
      />
    </svg>
  );
}

function Blossom() {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor">
      <circle cx="16" cy="9.2" r="6.1" />
      <circle cx="23.2" cy="14.4" r="6.1" />
      <circle cx="20.4" cy="22.8" r="6.1" />
      <circle cx="11.6" cy="22.8" r="6.1" />
      <circle cx="8.8" cy="14.4" r="6.1" />
      <circle cx="16" cy="16.2" r="3.4" fill="#fff7f5" opacity=".8" />
    </svg>
  );
}
