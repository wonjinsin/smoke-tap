export type ElapsedUnits = {
  d: (n: number) => string;
  h: (n: number) => string;
  m: (n: number) => string;
  s: (n: number) => string;
};

export function formatElapsed(ms: number, units: ElapsedUnits): string {
  const clamped = Math.max(0, ms);
  const totalSec = Math.floor(clamped / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  const parts: Array<[keyof ElapsedUnits, number]> = [
    ['d', d],
    ['h', h],
    ['m', m],
    ['s', s],
  ];

  const firstIdx = parts.findIndex(([, n]) => n > 0);
  if (firstIdx === -1) return units.s(0);

  return parts
    .slice(firstIdx)
    .map(([key, n]) => units[key](n))
    .join(' ');
}
