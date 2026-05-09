const FILLERS = ["um", "uh", "like", "basically", "literally", "you know", "i mean", "sort of", "kind of", "actually", "honestly"];
const STRUCTURE_WORDS = ["because", "therefore", "however", "first", "second", "finally", "for example", "specifically", "additionally", "furthermore"];
const DATA_PATTERN = /\d+(%|x|k|m|b|\s*(million|billion|percent|times|users|customers|months|years|days))/i;

export function scoreConfidence(text) {
  if (!text || text.trim().length === 0) return null;

  const words = text.trim().split(/\s+/);
  const wc = words.length;
  const lower = text.toLowerCase();

  // Word count score (0-30)
  const wcScore = wc < 10 ? 5 : wc < 25 ? 15 : wc < 50 ? 25 : wc < 100 ? 30 : 28;

  // Filler penalty (0-20)
  const fillerCount = FILLERS.filter((f) => lower.includes(f)).length;
  const fillerScore = Math.max(0, 20 - fillerCount * 5);

  // Structure words bonus (0-25)
  const structureCount = STRUCTURE_WORDS.filter((w) => lower.includes(w)).length;
  const structureScore = Math.min(25, structureCount * 8);

  // Data/numbers bonus (0-25)
  const dataScore = DATA_PATTERN.test(text) ? 25 : 0;

  const total = Math.min(100, wcScore + fillerScore + structureScore + dataScore);

  let label, color;
  if (total >= 70) { label = "Strong"; color = "var(--accent-green)"; }
  else if (total >= 40) { label = "Okay"; color = "var(--accent-amber)"; }
  else { label = "Weak"; color = "var(--accent-red)"; }

  return { score: total, label, color };
}
