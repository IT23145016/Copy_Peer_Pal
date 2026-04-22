import { useMemo } from "react";

const CHRISTMAS_FLAKE_COUNT = 16;
const HALLOWEEN_BAT_COUNT = 8;

const getSeason = (date = new Date()) => {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if ((month === 12 && day >= 15) || (month === 1 && day <= 5)) return "christmas";
  if ((month === 10 && day >= 20) || (month === 11 && day <= 2)) return "halloween";
  return null;
};
//const getSeason = () => "christmas";
//const getSeason = () => "halloween";



const makeItems = (count, seed) =>
  Array.from({ length: count }, (_, index) => ({
    id: `${seed}-${index}`,
    left: `${2 + ((index * 6.35) % 96)}%`,
    delay: `${(index * 0.7).toFixed(2)}s`,
    duration: `${8.5 + (index % 5) * 1.3}s`,
    scale: 0.75 + (index % 4) * 0.12,
    opacity: 0.28 + (index % 3) * 0.12,
  }));

export default function SeasonalOverlay() {
  const season = getSeason();

  const items = useMemo(() => {
    if (season === "christmas") return makeItems(CHRISTMAS_FLAKE_COUNT, "flake");
    if (season === "halloween") return makeItems(HALLOWEEN_BAT_COUNT, "bat");
    return [];
  }, [season]);

  if (!season) return null;

  return (
    <div className={`seasonal-overlay seasonal-overlay-${season}`} aria-hidden="true">
      {items.map((item) =>
        season === "christmas" ? (
          <span
            key={item.id}
            className="seasonal-flake"
            style={{
              left: item.left,
              animationDelay: item.delay,
              animationDuration: item.duration,
              opacity: item.opacity,
              transform: `scale(${item.scale})`,
            }}
          >
            *
          </span>
        ) : (
          <span
            key={item.id}
            className="seasonal-bat"
            style={{
              left: item.left,
              animationDelay: item.delay,
              animationDuration: item.duration,
              opacity: item.opacity,
              transform: `scale(${item.scale})`,
            }}
          >
            <svg viewBox="0 0 64 32" role="presentation">
              <path d="M2 18c4-8 10-12 16-12 3 0 6 1 8 4l6 8 6-8c2-3 5-4 8-4 6 0 12 4 16 12-5-2-8-2-11-1 1 3 1 6 0 9-4-3-8-5-11-5-3 0-6 1-8 3-2-2-5-3-8-3-3 0-7 2-11 5-1-3-1-6 0-9-3-1-6-1-11 1Z" />
            </svg>
          </span>
        )
      )}
    </div>
  );
}
