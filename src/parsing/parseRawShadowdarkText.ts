import { ParseResult, ShadowdarkMonster } from "../types";
import { normalizeMonster } from "./normalizeMonster";

function normalizePastedText(source: string): string {
  return source
    .replace(/\r/g, "\n")
    .replace(/[–—]/g, "-")
    .replace(/\u00A0/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/[ \t]+/g, " ")
    .replace(/\n+/g, "\n")
    .trim();
}

function cleanInline(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function extractValue(text: string, pattern: RegExp): string {
  const match = text.match(pattern);
  return match?.[1]?.trim() ?? "";
}

function parseAbilities(text: string): Record<string, string> {
  const result: Record<string, string> = {};

  const patterns: Array<[string, RegExp]> = [
    ["str", /\bS\s*([+-]?\d+)\b/i],
    ["dex", /\bD\s*([+-]?\d+)\b/i],
    ["con", /\bC\s*([+-]?\d+)\b/i],
    ["int", /\bI\s*([+-]?\d+)\b/i],
    ["wis", /\bW\s*([+-]?\d+)\b/i],
    ["cha", /\bCh\s*([+-]?\d+)\b/i]
  ];

  for (const [key, regex] of patterns) {
    const match = text.match(regex);
    if (match?.[1]) {
      const raw = match[1].trim();
      result[key] = /^[+-]/.test(raw) ? raw : `+${raw}`;
    }
  }

  return result;
}

function parseAttacks(statText: string): string[] {
  const inline = cleanInline(statText);

  const atkMatch = inline.match(
    /\bATK\b\s*(.*?)(?=,\s*MV\b|,\s*S\b|,\s*D\b|,\s*C\b|,\s*I\b|,\s*W\b|,\s*Ch\b|,\s*AL\b|,\s*LV\b|$)/i
  );
  if (!atkMatch?.[1]) return [];

  const atkText = atkMatch[1].trim();
  const parts = atkText.split(/\s+(and|or)\s+/i);

  const attacks: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    if (i === 0) {
      attacks.push(part);
      continue;
    }

    if (i % 2 === 1) continue;

    const connector = parts[i - 1]?.trim().toUpperCase();
    if (connector === "AND" || connector === "OR") {
      attacks.push(`${connector} ${part}`);
    } else {
      attacks.push(part);
    }
  }

  return attacks;
}

function splitSections(source: string): {
  leadText: string;
  statText: string;
  trailingText: string;
} | null {
  const normalized = normalizePastedText(source);

  const acIndex = normalized.search(/\bAC\b/i);
  if (acIndex < 0) return null;

  const leadText = normalized.slice(0, acIndex).trim();
  const afterLead = normalized.slice(acIndex).trim();

  const lvMatch = afterLead.match(/\bLV\b\s*([^\s,.;]+)/i);
  if (!lvMatch || lvMatch.index === undefined) {
    return {
      leadText,
      statText: afterLead,
      trailingText: ""
    };
  }

  const lvStart = lvMatch.index;
  const lvFull = lvMatch[0];
  const lvEnd = lvStart + lvFull.length;

  return {
    leadText,
    statText: afterLead.slice(0, lvEnd).trim(),
    trailingText: afterLead.slice(lvEnd).trim()
  };
}

function looksLikeTrailingNameLine(line: string): boolean {
  const cleaned = cleanInline(line);
  if (!cleaned) return false;

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 5) return false;

  return words.every((word) => /^[A-Z][A-Z,'-]*$/.test(word));
}

function splitLeadText(leadText: string): { name: string; description: string } {
  const originalLines = leadText
    .split(/\n+/)
    .map((line) => cleanInline(line))
    .filter(Boolean);

  if (originalLines.length >= 2) {
    return {
      name: originalLines[0],
      description: cleanInline(originalLines.slice(1).join(" "))
    };
  }

  const lead = cleanInline(leadText);
  if (!lead) {
    return { name: "", description: "" };
  }

  const capsMatch = lead.match(/^([A-Z][A-Z0-9' -]{2,}?)(?=\s+[A-Z]?[a-z])/);
  if (capsMatch) {
    const name = capsMatch[1].trim();
    const description = lead.slice(capsMatch[0].length).trim();
    return { name, description };
  }

  return { name: "", description: lead };
}

function splitTrailingName(trailingText: string): { trailingBody: string; trailingName: string } {
  const lines = trailingText
    .split(/\n+/)
    .map((line) => cleanInline(line))
    .filter(Boolean);

  if (lines.length === 0) {
    return { trailingBody: "", trailingName: "" };
  }

  const lastLine = lines[lines.length - 1];
  if (!looksLikeTrailingNameLine(lastLine)) {
    return { trailingBody: trailingText, trailingName: "" };
  }

  return {
    trailingBody: lines.slice(0, -1).join("\n"),
    trailingName: lastLine
  };
}

function parseAbilityEntries(trailingText: string): string[] {
  const cleaned = cleanInline(trailingText);
  if (!cleaned) return [];

  const forbiddenLabels = new Set([
    "AC",
    "HP",
    "MV",
    "AL",
    "LV",
    "STR",
    "DEX",
    "CON",
    "INT",
    "WIS",
    "CHA",
    "DC"
  ]);

  function isAbilityLabel(label: string): boolean {
    const stripped = label.replace(/[.?!]+$/, "").trim();
    if (!stripped) return false;

    const words = stripped.split(/\s+/).filter(Boolean);
    if (words.length === 0 || words.length > 4) return false;

    if (words.length === 1 && forbiddenLabels.has(words[0].toUpperCase())) {
      return false;
    }

    return words.every((word) => /^[A-Z][a-z0-9'-]*$/.test(word));
  }

  const labelRegex = /(^|\s)([A-Z][A-Za-z0-9'-]*(?:\s+[A-Z][A-Za-z0-9'-]*){0,3}[.?!])(?=\s|$)/g;

  const starts: number[] = [];
  let match: RegExpExecArray | null;

  while ((match = labelRegex.exec(cleaned)) !== null) {
    const fullMatchIndex = match.index ?? 0;
    const prefix = match[1] ?? "";
    const label = match[2] ?? "";

    if (!isAbilityLabel(label)) continue;

    const labelStart = fullMatchIndex + prefix.length;
    starts.push(labelStart);
  }

  if (starts.length === 0) {
    return [cleaned];
  }

  const entries: string[] = [];

  for (let i = 0; i < starts.length; i++) {
    const start = starts[i];
    const end = i + 1 < starts.length ? starts[i + 1] : cleaned.length;

    const chunk = cleaned.slice(start, end).trim();
    if (chunk) {
      entries.push(chunk);
    }
  }

  return entries;
}

function classifyAbilityEntry(entry: string): "trait" | "special" | "spell" {
  const lower = entry.toLowerCase();

  if (/$begin:math:text$\(int\|wis\|cha\)\\s\+spell$end:math:text$/i.test(entry)) {
    return "spell";
  }

  const label = entry.split(/[.:!?]/, 1)[0]?.trim().toLowerCase() ?? "";

  // Spell-like, even if not explicitly marked as Spell
  if (
    label === "charm" ||
    /\bspell\b/i.test(entry)
  ) {
    return "spell";
  }

  if (
    /\bin place of attacks\b/i.test(entry) ||
    /\buse turn\b/i.test(entry) ||
    /\b1\/day\b/i.test(entry) ||
    /\btarget takes\b/i.test(entry) ||
    /\btarget permanently loses\b/i.test(entry) ||
    /\bheals\b/i.test(entry) ||
    /\brises as\b/i.test(entry) ||
    /\bsummon\b/i.test(entry) ||
    /\bdc\s*\d+\b/i.test(entry)
  ) {
    return "special";
  }

  return "trait";
}

export function parseRawShadowdarkText(source: string): ParseResult<ShadowdarkMonster> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const normalized = normalizePastedText(source);
  if (!normalized) {
    return {
      success: false,
      errors: ["Clipboard is empty."],
      warnings
    };
  }

  const sections = splitSections(normalized);
  if (!sections) {
    return {
      success: false,
      errors: ["Could not find a stat block beginning with AC."],
      warnings
    };
  }

  const { leadText, statText, trailingText } = sections;
  const statInline = cleanInline(statText);

  const trailingSplit = splitTrailingName(trailingText);
  const { trailingBody, trailingName } = trailingSplit;

  const leadParsed = splitLeadText(leadText);

  const name = trailingName || leadParsed.name;
  const description = trailingName
    ? cleanInline(leadText)
    : leadParsed.description;

  const ac = extractValue(statInline, /\bAC\b\s*([^,]+)/i);
  const hp = extractValue(statInline, /\bHP\b\s*([^,]+)/i);
  const alignment = extractValue(statInline, /\bAL\b\s*([^,]+)/i);
  const level = extractValue(statInline, /\bLV\b\s*([^\s,.;]+)/i);

  const mvMatch = statInline.match(
    /\bMV\b\s*(.*?)(?=,\s*S\b|,\s*D\b|,\s*C\b|,\s*I\b|,\s*W\b|,\s*Ch\b|,\s*AL\b|,\s*LV\b|$)/i
  );
  const mv = mvMatch?.[1]?.trim() ?? "";

  const attacks = parseAttacks(statInline);
  if (attacks.length === 0) {
    warnings.push("No attacks could be parsed. You may need to add them manually.");
  }

  const abilities = parseAbilities(statInline);

  const entries = parseAbilityEntries(trailingBody);

  const traits: string[] = [];
  const specials: string[] = [];
  const spells: string[] = [];

  for (const entry of entries) {
    const kind = classifyAbilityEntry(entry);
    if (kind === "spell") {
      spells.push(entry);
    } else if (kind === "special") {
      specials.push(entry);
    } else {
      traits.push(entry);
    }
  }

  const monster = normalizeMonster({
    name,
    level,
    alignment,
    ac,
    hp,
    mv,
    atk: attacks,
    str: abilities.str,
    dex: abilities.dex,
    con: abilities.con,
    int: abilities.int,
    wis: abilities.wis,
    cha: abilities.cha,
    traits,
    specials,
    spells,
    description,
    source: "Imported from clipboard",
    tags: ["shadowdark", "imported"]
  });

  if (!monster.name || monster.name === "Unnamed Monster") {
    errors.push("Could not determine monster name.");
  }

  if (!monster.ac || monster.ac === "?") {
    warnings.push("Could not confidently parse AC.");
  }

  if (!monster.hp || monster.hp === "?") {
    warnings.push("Could not confidently parse HP.");
  }

  if (!monster.level || monster.level === "?") {
    warnings.push("Could not confidently parse level.");
  }

  return {
    success: errors.length === 0,
    data: errors.length === 0 ? monster : undefined,
    errors,
    warnings
  };
}