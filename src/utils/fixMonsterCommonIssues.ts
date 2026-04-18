import { ShadowdarkMonster, ShadowdarkAttack } from "../types";

function cleanText(value: string): string {
  return value
    .replace(/[–—]/g, "-")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeModifier(value: string): string {
  const cleaned = cleanText(value);

  if (!cleaned) return "";

  if (/^[+-]\d+$/.test(cleaned)) return cleaned;
  if (/^\d+$/.test(cleaned)) return `+${cleaned}`;
  if (/^-\d+$/.test(cleaned)) return cleaned;

  return cleaned;
}

function toSmartTitleCase(text: string): string {
  const smallWords = new Set([
    "of", "in", "and", "the", "to", "for", "on", "at", "by", "from", "with", "a", "an"
  ]);

  const words = text.toLowerCase().split(/\s+/);

  return words
    .map((word, index) => {
      if (!word) return word;

      const isFirst = index === 0;
      const isLast = index === words.length - 1;

      if (!isFirst && !isLast && smallWords.has(word)) {
        return word;
      }

      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function normalizeDiceTypos(text: string): string {
  return text
    .replace(/\b(\d+)dd(\d+)\b/gi, "$1d$2")
    .replace(/\b(\d+)d+d(\d+)\b/gi, "$1d$2");
}

function normalizePunctuationSpacing(text: string): string {
  return text
    .replace(/\s*:\s*/g, ": ")
    .replace(/\s*\.\s*/g, ". ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function normalizeLabelStyle(text: string): string {
  const cleaned = normalizePunctuationSpacing(normalizeDiceTypos(cleanText(text)));
  if (!cleaned) return "";

  // Helper to capitalize first letter of body text
  const capitalizeBody = (body: string): string => {
    if (!body) return "";
    return body.charAt(0).toUpperCase() + body.slice(1);
  };

  // 1) Label before colon
  let match = cleaned.match(/^([^:]{1,80}):\s*(.+)$/);
  if (match) {
    const label = toSmartTitleCase(match[1].trim());
    const body = capitalizeBody(match[2].trim());
    return `${label}: ${body}`;
  }

  // 2) Label before sentence break
  match = cleaned.match(/^([^.!?]{1,80}[.!?])\s*(.+)$/);
  if (match) {
    const rawLabel = match[1].trim();
    const punctuation = rawLabel.slice(-1);
    const labelCore = rawLabel.slice(0, -1).trim();
    const body = capitalizeBody(match[2].trim());

    return `${toSmartTitleCase(labelCore)}${punctuation} ${body}`;
  }

  // 3) No clear label → just clean + capitalize first letter
  if (/^[a-z]/.test(cleaned)) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned;
}

function cleanMultilineItems(items: string[]): string[] {
  return items
    .map((item) => normalizeLabelStyle(item))
    .filter(Boolean);
}

function normalizeAttackText(text: string): string {
  let cleaned = normalizePunctuationSpacing(normalizeDiceTypos(cleanText(text)));

  const connectorMatch = cleaned.match(/^(AND|OR)\s+(.+)$/i);
  if (connectorMatch) {
    const connector = connectorMatch[1].toUpperCase();
    const body = connectorMatch[2].trim();
    return `${connector} ${body}`;
  }

  return cleaned;
}

function normalizeAttack(attack: ShadowdarkAttack): ShadowdarkAttack {
  const raw = normalizeAttackText(attack.raw || "");
  const name = normalizeAttackText(attack.name || "");

  return {
    ...attack,
    name: raw || name,
    raw: raw || name
  };
}

function normalizeDescription(text: string): string {
  const cleaned = normalizePunctuationSpacing(normalizeDiceTypos(cleanText(text)));
  if (!cleaned) return "";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function fixMonsterCommonIssues(monster: ShadowdarkMonster): ShadowdarkMonster {
  return {
    ...monster,
    name: cleanText(monster.name),
    level: cleanText(monster.level),
    alignment: cleanText(monster.alignment).toUpperCase(),
    type: cleanText(monster.type),
    ac: cleanText(monster.ac),
    hp: cleanText(monster.hp),
    mv: cleanText(monster.mv),
    atk: monster.atk
      .map(normalizeAttack)
      .filter((attack) => Boolean((attack.raw || attack.name).trim())),
    stats: {
      str: normalizeModifier(monster.stats.str),
      dex: normalizeModifier(monster.stats.dex),
      con: normalizeModifier(monster.stats.con),
      int: normalizeModifier(monster.stats.int),
      wis: normalizeModifier(monster.stats.wis),
      cha: normalizeModifier(monster.stats.cha)
    },
    traits: cleanMultilineItems(monster.traits),
    specials: cleanMultilineItems(monster.specials),
    spells: cleanMultilineItems(monster.spells),
    gear: cleanMultilineItems(monster.gear),
    description: normalizeDescription(monster.description),
    source: cleanText(monster.source),
    tags: cleanTags(monster.tags)
  };

  function cleanTags(tags: string[]): string[] {
  return tags
    .map((tag) =>
      tag
        .toLowerCase()
        .replace(/[–—]/g, "-")
        .replace(/\u00A0/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean);
}
}