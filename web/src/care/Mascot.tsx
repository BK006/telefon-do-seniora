// "Słuchawka" — the brand mascot (from Maskotka.dc.html), four moods + optional sparkles.
export type Mood = "radosc" | "zamyslenie" | "troska" | "czeka";

const ring = (x: number, y: number, r: number) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

const FACE: Record<Mood, { eyesFill: string; eyesStroke: string; brows: string; mouth: string; fill: string; aria: string }> = {
  radosc: { eyesFill: "M0 0", eyesStroke: "M-16 -2Q-10 -10 -4 -2M4 -2Q10 -10 16 -2", brows: "M0 0", mouth: "M-8 6Q0 18 8 6Z", fill: "#FFFFFF", aria: "Maskotka Słuchawka, radosna" },
  zamyslenie: { eyesFill: ring(-12, -4, 4.5) + ring(8, -4, 4.5), eyesStroke: "M0 0", brows: "M4 -14Q10 -18 16 -13", mouth: "M-4 10Q2 8 7 11", fill: "none", aria: "Maskotka Słuchawka, zamyślona" },
  troska: { eyesFill: ring(-10, 0, 4.5) + ring(10, 0, 4.5), eyesStroke: "M0 0", brows: "M-17 -9L-6 -13M17 -9L6 -13", mouth: "M-6 13Q0 8 6 13", fill: "none", aria: "Maskotka Słuchawka, zatroskana" },
  czeka: { eyesFill: ring(-8, -1, 4.5) + ring(12, -1, 4.5), eyesStroke: "M0 0", brows: "M0 0", mouth: "M-4 10Q2 13 8 10", fill: "none", aria: "Maskotka Słuchawka czeka" },
};

export function Mascot({ mood = "radosc", size = 120, sparks = false, decorative = false, className }: { mood?: Mood; size?: number; sparks?: boolean; decorative?: boolean; className?: string }) {
  const f = FACE[mood];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : f.aria}
      className={className}
      style={{ display: "block", overflow: "visible" }}
    >
      <ellipse cx="56" cy="115" rx="30" ry="4" fill="#2B2140" opacity="0.1" />
      <path d="M72 96q10 2 12-6t10-6 10-6 8 4" fill="none" stroke="#3DDC97" strokeWidth="4" strokeLinecap="round" />
      <g transform="rotate(-12 56 60)">
        <rect x="26" y="8" width="60" height="30" rx="15" fill="#5A3FD6" />
        <rect x="26" y="82" width="60" height="30" rx="15" fill="#5A3FD6" />
        <rect x="32" y="20" width="48" height="80" rx="24" fill="#7C5CFF" />
        <path d="M40 34Q42 26 50 24" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
        <circle cx="40" cy="70" r="4.5" fill="#FF7AA2" />
        <circle cx="72" cy="70" r="4.5" fill="#FF7AA2" />
        <g transform="translate(56 60) scale(0.95)">
          <path d={f.eyesFill} fill="#FFFFFF" />
          <path d={f.eyesStroke} fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
          <path d={f.brows} fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
          <path d={f.mouth} fill={f.fill} stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
      {sparks && (
        <path d="M104 14l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5zM10 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2zM112 62l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" fill="#FFC53D" />
      )}
      {mood === "zamyslenie" && (
        <>
          <circle cx="96" cy="22" r="3.5" fill="#9C84FF" />
          <circle cx="106" cy="12" r="5" fill="#9C84FF" />
        </>
      )}
      {mood === "czeka" && <path d="M98 30h.01M106 30h.01M114 30h.01" stroke="#9C84FF" strokeWidth="6" strokeLinecap="round" />}
    </svg>
  );
}
