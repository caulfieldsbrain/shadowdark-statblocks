var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => ShadowdarkStatblocksPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian8 = require("obsidian");

// src/services/monsterIndexService.ts
var import_obsidian = require("obsidian");
function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  try {
    const parsed = (0, import_obsidian.parseYaml)(match[1]);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch (error) {
    console.error("Shadowdark Statblocks frontmatter parse error:", error);
    return null;
  }
}
async function getSuggestedTags(app, monsterFolder) {
  const folderPath = (0, import_obsidian.normalizePath)(monsterFolder);
  const files = app.vault.getMarkdownFiles().filter(
    (file) => file.path.startsWith(`${folderPath}/`) || file.path === `${folderPath}.md`
  );
  const tags = /* @__PURE__ */ new Set();
  for (const file of files) {
    const content = await app.vault.read(file);
    const frontmatter = extractFrontmatter(content);
    if (!frontmatter || frontmatter.shadowdarkType !== "monster") continue;
    const rawTags = frontmatter.tags;
    if (Array.isArray(rawTags)) {
      for (const tag of rawTags) {
        if (typeof tag === "string" && tag.trim()) {
          tags.add(tag.trim().toLowerCase());
        }
      }
    }
  }
  return [...tags].sort((a, b) => a.localeCompare(b));
}
async function getSuggestedOtherSources(app, monsterFolder) {
  const folderPath = (0, import_obsidian.normalizePath)(monsterFolder);
  const files = app.vault.getMarkdownFiles().filter(
    (file) => file.path.startsWith(`${folderPath}/`) || file.path === `${folderPath}.md`
  );
  const builtInSources = /* @__PURE__ */ new Set([
    "Core Rules",
    "Cursed Scroll 1",
    "Cursed Scroll 2",
    "Cursed Scroll 3",
    "Homebrew",
    "Other"
  ]);
  const sources = /* @__PURE__ */ new Set();
  for (const file of files) {
    const content = await app.vault.read(file);
    const frontmatter = extractFrontmatter(content);
    if (!frontmatter || frontmatter.shadowdarkType !== "monster") continue;
    const rawSource = frontmatter.source;
    if (typeof rawSource === "string") {
      const source = rawSource.trim();
      if (source && !builtInSources.has(source)) {
        sources.add(source);
      }
    }
  }
  return [...sources].sort((a, b) => a.localeCompare(b));
}
function getAllMonsterIndexEntries(app, monsterFolder) {
  const folderPath = (0, import_obsidian.normalizePath)(monsterFolder);
  const files = app.vault.getMarkdownFiles().filter(
    (file) => file.path.startsWith(`${folderPath}/`) || file.path === `${folderPath}.md`
  );
  const results = [];
  for (const file of files) {
    const cache = app.metadataCache.getFileCache(file);
    const frontmatter = cache == null ? void 0 : cache.frontmatter;
    if (!frontmatter || frontmatter.shadowdarkType !== "monster") continue;
    results.push({
      file,
      name: typeof frontmatter.name === "string" ? frontmatter.name : file.basename,
      level: typeof frontmatter.level === "string" || typeof frontmatter.level === "number" ? String(frontmatter.level) : "",
      alignment: typeof frontmatter.alignment === "string" ? frontmatter.alignment : "",
      source: typeof frontmatter.source === "string" ? frontmatter.source : "",
      tags: Array.isArray(frontmatter.tags) ? frontmatter.tags.filter((t) => typeof t === "string") : [],
      frontmatter
    });
  }
  results.sort((a, b) => a.name.localeCompare(b.name));
  return results;
}

// src/settings.ts
var DEFAULT_SETTINGS = {
  compactMode: false,
  showSource: true,
  showTags: true,
  renderFrontmatterMonsters: true,
  monsterFolder: "Shadowdark/Monsters",
  hideMonsterProperties: true,
  lastUsedMonsterSource: ""
};

// src/parsing/parseCodeBlock.ts
var import_obsidian2 = require("obsidian");

// src/parsing/normalizeMonster.ts
function asString(value, fallback = "") {
  if (value === null || value === void 0) {
    return fallback;
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  return fallback;
}
function normalizeModifier(value, fallback = "+0") {
  const raw = asString(value, fallback);
  if (!raw) return fallback;
  if (/^[+-]\d+$/.test(raw)) return raw;
  if (/^\d+$/.test(raw)) return `+${raw}`;
  if (/^-\d+$/.test(raw)) return raw;
  return raw;
}
function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => asString(item)).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split("\n").map((line) => line.trim()).filter(Boolean);
  }
  return [];
}
function normalizeAttack(item) {
  if (typeof item === "string") {
    return {
      name: item.trim(),
      raw: item.trim()
    };
  }
  if (item && typeof item === "object") {
    const obj = item;
    const name = asString(obj.name);
    if (!name) return null;
    return {
      name,
      bonus: asString(obj.bonus),
      damage: asString(obj.damage),
      range: asString(obj.range),
      notes: asString(obj.notes)
    };
  }
  return null;
}
function normalizeAttacks(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeAttack).filter((a) => a !== null);
  }
  if (typeof value === "string" && value.trim()) {
    return [{ name: value.trim(), raw: value.trim() }];
  }
  return [];
}
function normalizeMonster(input) {
  var _a, _b, _c, _d, _e, _f, _g;
  const nestedStats = (_a = input.stats) != null ? _a : {};
  const strValue = (_b = input.str) != null ? _b : nestedStats.str;
  const dexValue = (_c = input.dex) != null ? _c : nestedStats.dex;
  const conValue = (_d = input.con) != null ? _d : nestedStats.con;
  const intValue = (_e = input.int) != null ? _e : nestedStats.int;
  const wisValue = (_f = input.wis) != null ? _f : nestedStats.wis;
  const chaValue = (_g = input.cha) != null ? _g : nestedStats.cha;
  return {
    name: asString(input.name, "Unnamed Monster"),
    level: asString(input.level, "?"),
    alignment: asString(input.alignment, ""),
    type: asString(input.type, ""),
    ac: asString(input.ac, "?"),
    hp: asString(input.hp, "?"),
    mv: asString(input.mv, ""),
    atk: normalizeAttacks(input.atk),
    stats: {
      str: normalizeModifier(strValue, "+0"),
      dex: normalizeModifier(dexValue, "+0"),
      con: normalizeModifier(conValue, "+0"),
      int: normalizeModifier(intValue, "+0"),
      wis: normalizeModifier(wisValue, "+0"),
      cha: normalizeModifier(chaValue, "+0")
    },
    traits: normalizeStringArray(input.traits),
    specials: normalizeStringArray(input.specials),
    spells: normalizeStringArray(input.spells),
    gear: normalizeStringArray(input.gear),
    description: asString(input.description, ""),
    source: asString(input.source, ""),
    tags: normalizeStringArray(input.tags)
  };
}

// src/parsing/parseCodeBlock.ts
function parseCodeBlock(source) {
  const errors = [];
  const warnings = [];
  try {
    const parsed = (0, import_obsidian2.parseYaml)(source);
    if (!parsed || typeof parsed !== "object") {
      return {
        success: false,
        errors: ["Code block did not contain a valid YAML object."],
        warnings
      };
    }
    const monster = normalizeMonster(parsed);
    if (!monster.name || monster.name === "Unnamed Monster") {
      warnings.push("Monster is missing a name.");
    }
    if (!monster.ac || monster.ac === "?") {
      warnings.push("Monster is missing AC.");
    }
    if (!monster.hp || monster.hp === "?") {
      warnings.push("Monster is missing HP.");
    }
    if (monster.atk.length === 0) {
      warnings.push("Monster has no attacks listed.");
    }
    return {
      success: true,
      data: monster,
      errors,
      warnings
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown parse error.";
    return {
      success: false,
      errors: [`YAML parse error: ${message}`],
      warnings
    };
  }
}

// src/parsing/parseFrontmatter.ts
function parseFrontmatter(frontmatter) {
  const errors = [];
  const warnings = [];
  if (!frontmatter || typeof frontmatter !== "object") {
    return {
      success: false,
      errors: ["No valid frontmatter found."],
      warnings
    };
  }
  const monster = normalizeMonster(frontmatter);
  if (!monster.name || monster.name === "Unnamed Monster") {
    warnings.push("Monster is missing a name.");
  }
  if (!monster.ac || monster.ac === "?") {
    warnings.push("Monster is missing AC.");
  }
  if (!monster.hp || monster.hp === "?") {
    warnings.push("Monster is missing HP.");
  }
  if (monster.atk.length === 0) {
    warnings.push("Monster has no attacks listed.");
  }
  return {
    success: true,
    data: monster,
    errors,
    warnings
  };
}

// src/parsing/parseRawShadowdarkText.ts
function normalizePastedText(source) {
  return source.replace(/\r/g, "\n").replace(/[–—]/g, "-").replace(/\u00A0/g, " ").replace(/`([^`]+)`/g, "$1").replace(/(\*\*|__)(.*?)\1/g, "$2").replace(/(\*|_)(.*?)\1/g, "$2").replace(/[ \t]+/g, " ").replace(/\n+/g, "\n").trim();
}
function cleanInline(text) {
  return text.replace(/\s+/g, " ").trim();
}
function extractValue(text, pattern) {
  var _a, _b;
  const match = text.match(pattern);
  return (_b = (_a = match == null ? void 0 : match[1]) == null ? void 0 : _a.trim()) != null ? _b : "";
}
function parseAbilities(text) {
  const result = {};
  const patterns = [
    ["str", /\bS\s*([+-]?\d+)\b/i],
    ["dex", /\bD\s*([+-]?\d+)\b/i],
    ["con", /\bC\s*([+-]?\d+)\b/i],
    ["int", /\bI\s*([+-]?\d+)\b/i],
    ["wis", /\bW\s*([+-]?\d+)\b/i],
    ["cha", /\bCh\s*([+-]?\d+)\b/i]
  ];
  for (const [key, regex] of patterns) {
    const match = text.match(regex);
    if (match == null ? void 0 : match[1]) {
      const raw = match[1].trim();
      result[key] = /^[+-]/.test(raw) ? raw : `+${raw}`;
    }
  }
  return result;
}
function parseAttacks(statText) {
  var _a;
  const inline = cleanInline(statText);
  const atkMatch = inline.match(
    /\bATK\b\s*(.*?)(?=,\s*MV\b|,\s*S\b|,\s*D\b|,\s*C\b|,\s*I\b|,\s*W\b|,\s*Ch\b|,\s*AL\b|,\s*LV\b|$)/i
  );
  if (!(atkMatch == null ? void 0 : atkMatch[1])) return [];
  const atkText = atkMatch[1].trim();
  const parts = atkText.split(/\s+(and|or)\s+/i);
  const attacks = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;
    if (i === 0) {
      attacks.push(part);
      continue;
    }
    if (i % 2 === 1) continue;
    const connector = (_a = parts[i - 1]) == null ? void 0 : _a.trim().toUpperCase();
    if (connector === "AND" || connector === "OR") {
      attacks.push(`${connector} ${part}`);
    } else {
      attacks.push(part);
    }
  }
  return attacks;
}
function splitSections(source) {
  const normalized = normalizePastedText(source);
  const acIndex = normalized.search(/\bAC\b/i);
  if (acIndex < 0) return null;
  const leadText = normalized.slice(0, acIndex).trim();
  const afterLead = normalized.slice(acIndex).trim();
  const lvMatch = afterLead.match(/\bLV\b\s*([^\s,.;]+)/i);
  if (!lvMatch || lvMatch.index === void 0) {
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
function looksLikeTrailingNameLine(line) {
  const cleaned = cleanInline(line);
  if (!cleaned) return false;
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 5) return false;
  return words.every((word) => /^[A-Z][A-Z,'-]*$/.test(word));
}
function splitLeadText(leadText) {
  const originalLines = leadText.split(/\n+/).map((line) => cleanInline(line)).filter(Boolean);
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
function splitTrailingName(trailingText) {
  const lines = trailingText.split(/\n+/).map((line) => cleanInline(line)).filter(Boolean);
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
function parseAbilityEntries(trailingText) {
  var _a, _b, _c;
  const cleaned = cleanInline(trailingText);
  if (!cleaned) return [];
  const forbiddenLabels = /* @__PURE__ */ new Set([
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
  function isAbilityLabel(label) {
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
  const starts = [];
  let match;
  while ((match = labelRegex.exec(cleaned)) !== null) {
    const fullMatchIndex = (_a = match.index) != null ? _a : 0;
    const prefix = (_b = match[1]) != null ? _b : "";
    const label = (_c = match[2]) != null ? _c : "";
    if (!isAbilityLabel(label)) continue;
    const labelStart = fullMatchIndex + prefix.length;
    starts.push(labelStart);
  }
  if (starts.length === 0) {
    return [cleaned];
  }
  const entries = [];
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
function classifyAbilityEntry(entry) {
  var _a, _b;
  const lower = entry.toLowerCase();
  if (/$begin:math:text$\(int\|wis\|cha\)\\s\+spell$end:math:text$/i.test(entry)) {
    return "spell";
  }
  const label = (_b = (_a = entry.split(/[.:!?]/, 1)[0]) == null ? void 0 : _a.trim().toLowerCase()) != null ? _b : "";
  if (label === "charm" || /\bspell\b/i.test(entry)) {
    return "spell";
  }
  if (/\bin place of attacks\b/i.test(entry) || /\buse turn\b/i.test(entry) || /\b1\/day\b/i.test(entry) || /\btarget takes\b/i.test(entry) || /\btarget permanently loses\b/i.test(entry) || /\bheals\b/i.test(entry) || /\brises as\b/i.test(entry) || /\bsummon\b/i.test(entry) || /\bdc\s*\d+\b/i.test(entry)) {
    return "special";
  }
  return "trait";
}
function parseRawShadowdarkText(source) {
  var _a, _b;
  const errors = [];
  const warnings = [];
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
  const description = trailingName ? cleanInline(leadText) : leadParsed.description;
  const ac = extractValue(statInline, /\bAC\b\s*([^,]+)/i);
  const hp = extractValue(statInline, /\bHP\b\s*([^,]+)/i);
  const alignment = extractValue(statInline, /\bAL\b\s*([^,]+)/i);
  const level = extractValue(statInline, /\bLV\b\s*([^\s,.;]+)/i);
  const mvMatch = statInline.match(
    /\bMV\b\s*(.*?)(?=,\s*S\b|,\s*D\b|,\s*C\b|,\s*I\b|,\s*W\b|,\s*Ch\b|,\s*AL\b|,\s*LV\b|$)/i
  );
  const mv = (_b = (_a = mvMatch == null ? void 0 : mvMatch[1]) == null ? void 0 : _a.trim()) != null ? _b : "";
  const attacks = parseAttacks(statInline);
  if (attacks.length === 0) {
    warnings.push("No attacks could be parsed. You may need to add them manually.");
  }
  const abilities = parseAbilities(statInline);
  const entries = parseAbilityEntries(trailingBody);
  const traits = [];
  const specials = [];
  const spells = [];
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
    data: errors.length === 0 ? monster : void 0,
    errors,
    warnings
  };
}

// src/render/renderMonsterBlock.ts
function createDiv(className, text) {
  const el = document.createElement("div");
  if (className) el.className = className;
  if (text !== void 0) el.textContent = text;
  return el;
}
function createSpan(className, text) {
  const el = document.createElement("span");
  if (className) el.className = className;
  if (text !== void 0) el.textContent = text;
  return el;
}
function createList(className) {
  const el = document.createElement("ul");
  if (className) el.className = className;
  return el;
}
function createListItem(className) {
  const el = document.createElement("li");
  if (className) el.className = className;
  return el;
}
function renderAttackText(attack) {
  if (attack.raw) return attack.raw;
  const parts = [attack.name];
  if (attack.bonus) parts.push(attack.bonus);
  if (attack.damage) parts.push(`(${attack.damage})`);
  if (attack.range) parts.push(`[${attack.range}]`);
  if (attack.notes) parts.push(`- ${attack.notes}`);
  return parts.join(" ").trim();
}
function getAlignmentLabel(alignment) {
  const normalized = alignment.trim().toUpperCase();
  switch (normalized) {
    case "L":
      return "Lawful";
    case "N":
      return "Neutral";
    case "C":
      return "Chaotic";
    default:
      return "";
  }
}
function splitAttackConnector(text) {
  const trimmed = text.trim();
  const match = trimmed.match(/^(AND|OR)\s+(.+)$/i);
  if (!match) {
    return { connector: null, body: trimmed };
  }
  return {
    connector: match[1].toUpperCase(),
    body: match[2].trim()
  };
}
function appendRenderedAttack(li, attackText) {
  const { connector, body } = splitAttackConnector(attackText);
  if (connector) {
    li.appendChild(createSpan("sd-monster-attack-connector", `${connector} `));
  }
  li.appendChild(createSpan("sd-monster-attack-text", body));
}
function splitLabelAndBody(text) {
  const trimmed = text.trim();
  if (!trimmed) {
    return { label: "", body: "" };
  }
  let match = null;
  match = trimmed.match(/^(.{1,100}?\([^)]{1,40}\)\.)\s*(.+)$/);
  if (match) {
    return {
      label: match[1].trim(),
      body: match[2].trim()
    };
  }
  match = trimmed.match(/^([^.!?:]{1,80}[.!?])\s*(.+)$/);
  if (match) {
    return {
      label: match[1].trim(),
      body: match[2].trim()
    };
  }
  match = trimmed.match(/^([^:]{1,80}:)\s*(.+)$/);
  if (match) {
    return {
      label: match[1].trim(),
      body: match[2].trim()
    };
  }
  match = trimmed.match(/^(.{1,80}?\s[-—])\s*(.+)$/);
  if (match) {
    return {
      label: match[1].trim(),
      body: match[2].trim()
    };
  }
  return { label: "", body: trimmed };
}
function addSection(parent, title, items, className) {
  if (items.length === 0) return;
  const section = createDiv("sd-monster-section");
  section.appendChild(createDiv("sd-monster-section-title", title));
  const list = createList(className);
  for (const item of items) {
    const li = createListItem();
    const { label, body } = splitLabelAndBody(item);
    if (label) {
      li.appendChild(createSpan("sd-monster-ability-label", label));
    }
    if (body) {
      if (label) {
        li.appendChild(document.createTextNode(" "));
      }
      li.appendChild(createSpan("sd-monster-ability-text", body));
    }
    if (!label) {
      li.textContent = item;
    }
    list.appendChild(li);
  }
  section.appendChild(list);
  parent.appendChild(section);
}
function renderMonsterBlock(container, monster, settings, warnings = []) {
  container.innerHTML = "";
  const card = createDiv(
    [
      "sd-monster-card",
      settings.compactMode ? "is-compact" : ""
    ].filter(Boolean).join(" ")
  );
  const header = createDiv("sd-monster-header");
  header.appendChild(createDiv("sd-monster-name", monster.name));
  const meta = createDiv("sd-monster-meta");
  const metaParts = [];
  if (monster.level) {
    metaParts.push(createSpan(void 0, `Level ${monster.level}`));
  }
  if (monster.alignment) {
    const alignmentSpan = createSpan(void 0, `AL ${monster.alignment}`);
    const tooltip = getAlignmentLabel(monster.alignment);
    if (tooltip) {
      alignmentSpan.title = tooltip;
    }
    metaParts.push(alignmentSpan);
  }
  metaParts.forEach((part, index) => {
    meta.appendChild(part);
    if (index < metaParts.length - 1) {
      meta.appendChild(createSpan(void 0, " \u2022 "));
    }
  });
  header.appendChild(meta);
  card.appendChild(header);
  const core = createDiv("sd-monster-core");
  core.appendChild(createDiv("sd-monster-core-item", `AC ${monster.ac}`));
  core.appendChild(createDiv("sd-monster-core-item", `HP ${monster.hp}`));
  if (monster.mv) {
    core.appendChild(createDiv("sd-monster-core-item", `MV ${monster.mv}`));
  }
  card.appendChild(core);
  if (monster.atk.length > 0) {
    const atkSection = createDiv("sd-monster-section");
    atkSection.appendChild(createDiv("sd-monster-section-title", "ATTACKS"));
    const atkList = createList("sd-monster-attacks");
    for (const attack of monster.atk) {
      const li = createListItem("sd-monster-attack");
      appendRenderedAttack(li, renderAttackText(attack));
      atkList.appendChild(li);
    }
    atkSection.appendChild(atkList);
    card.appendChild(atkSection);
  }
  const abilities = createDiv("sd-monster-section");
  abilities.appendChild(createDiv("sd-monster-section-title", "ABILITIES"));
  const grid = createDiv("sd-monster-abilities");
  grid.appendChild(createDiv("sd-monster-ability", `STR ${monster.stats.str}`));
  grid.appendChild(createDiv("sd-monster-ability", `DEX ${monster.stats.dex}`));
  grid.appendChild(createDiv("sd-monster-ability", `CON ${monster.stats.con}`));
  grid.appendChild(createDiv("sd-monster-ability", `INT ${monster.stats.int}`));
  grid.appendChild(createDiv("sd-monster-ability", `WIS ${monster.stats.wis}`));
  grid.appendChild(createDiv("sd-monster-ability", `CHA ${monster.stats.cha}`));
  abilities.appendChild(grid);
  card.appendChild(abilities);
  addSection(card, "TRAITS", monster.traits, "sd-monster-list");
  addSection(card, "SPECIALS", monster.specials, "sd-monster-list");
  addSection(card, "SPELLS", monster.spells, "sd-monster-list");
  addSection(card, "GEAR", monster.gear, "sd-monster-list");
  if (monster.description) {
    const desc = createDiv("sd-monster-section");
    desc.appendChild(createDiv("sd-monster-description", monster.description));
    card.appendChild(desc);
  }
  if (settings.showSource && monster.source) {
    const source = createDiv("sd-monster-footer");
    source.appendChild(createSpan("sd-monster-source", `Source: ${monster.source}`));
    card.appendChild(source);
  }
  if (settings.showTags && monster.tags.length > 0) {
    const tags = createDiv("sd-monster-tags");
    for (const tag of monster.tags) {
      tags.appendChild(createSpan("sd-monster-tag", tag));
    }
    card.appendChild(tags);
  }
  if (warnings.length > 0) {
    const warningBox = createDiv("sd-monster-warning-box");
    for (const warning of warnings) {
      warningBox.appendChild(createDiv("sd-monster-warning", warning));
    }
    card.appendChild(warningBox);
  }
  container.appendChild(card);
}

// src/templates/monsterTemplate.ts
function buildMonsterTemplate(name = "New Monster") {
  return `---
shadowdarkType: monster
name: ${name}
level: 1
alignment: N
type: Humanoid
ac: 10
hp: 4
mv: near
atk:
  - Club +0 (1d4)
str: +0
dex: +0
con: +0
int: +0
wis: +0
cha: +0
traits:
  - Example trait
specials: []
spells: []
gear: []
description: Add a short description here.
source: Homebrew
tags:
  - shadowdark
---

## Notes

## Tactics

## Encounter Ideas
`;
}

// src/utils/monsterNoteContent.ts
function yamlString(value) {
  if (!value) return '""';
  if (/[:[\]{}#,&*!|>'"%@`]/.test(value) || value.includes('"')) {
    return JSON.stringify(value);
  }
  return value;
}
function yamlList(items, indent = 0) {
  const pad = " ".repeat(indent);
  if (items.length === 0) {
    return `${pad}[]`;
  }
  return items.map((item) => `${pad}- ${yamlString(item)}`).join("\n");
}
function buildMonsterFrontmatter(monster) {
  return `---
shadowdarkType: monster
name: ${yamlString(monster.name)}
level: ${yamlString(monster.level)}
alignment: ${yamlString(monster.alignment)}
type: ${yamlString(monster.type)}
ac: ${yamlString(monster.ac)}
hp: ${yamlString(monster.hp)}
mv: ${yamlString(monster.mv)}
atk:
${yamlList(monster.atk.map((a) => a.raw || a.name), 2)}
str: ${yamlString(monster.stats.str)}
dex: ${yamlString(monster.stats.dex)}
con: ${yamlString(monster.stats.con)}
int: ${yamlString(monster.stats.int)}
wis: ${yamlString(monster.stats.wis)}
cha: ${yamlString(monster.stats.cha)}
traits:
${yamlList(monster.traits, 2)}
specials:
${yamlList(monster.specials, 2)}
spells:
${yamlList(monster.spells, 2)}
gear:
${yamlList(monster.gear, 2)}
description: ${yamlString(monster.description)}
source: ${yamlString(monster.source)}
tags:
${yamlList(monster.tags, 2)}
---`;
}
function buildMonsterNoteContent(monster, body) {
  const frontmatter = buildMonsterFrontmatter(monster);
  if (body && body.trim()) {
    return `${frontmatter}

${body.replace(/^\s+/, "")}
`;
  }
  return `${frontmatter}

## Notes

## Tactics

## Encounter Ideas
`;
}

// src/settingsTab.ts
var import_obsidian3 = require("obsidian");
var ShadowdarkStatblocksSettingTab = class extends import_obsidian3.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian3.Setting(containerEl).setName("Shadowdark statblocks settings").setHeading();
    new import_obsidian3.Setting(containerEl).setName("Display").setHeading();
    new import_obsidian3.Setting(containerEl).setName("Compact statblock mode").setDesc("Render monster statblocks with tighter spacing.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.compactMode).onChange(async (value) => {
        this.plugin.settings.compactMode = value;
        await this.plugin.savePluginSettings();
        void this.plugin.refreshMonsterView();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Show source").setDesc("Display the source field in rendered statblocks.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.showSource).onChange(async (value) => {
        this.plugin.settings.showSource = value;
        await this.plugin.savePluginSettings();
        void this.plugin.refreshMonsterView();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Show tags").setDesc("Display tag pills in rendered statblocks.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.showTags).onChange(async (value) => {
        this.plugin.settings.showTags = value;
        await this.plugin.savePluginSettings();
        void this.plugin.refreshMonsterView();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Render frontmatter monsters").setDesc("Render statblocks from monster note frontmatter in reading view.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.renderFrontmatterMonsters).onChange(async (value) => {
        this.plugin.settings.renderFrontmatterMonsters = value;
        await this.plugin.savePluginSettings();
        void this.plugin.refreshMonsterView();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Hide monster properties").setDesc("Hide Obsidian's native properties section in reading view for monster notes.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.hideMonsterProperties).onChange(async (value) => {
        this.plugin.settings.hideMonsterProperties = value;
        await this.plugin.savePluginSettings();
        void this.plugin.refreshMonsterView();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Files").setHeading();
    new import_obsidian3.Setting(containerEl).setName("Monster folder").setDesc("Folder used when creating new monster notes.").addText(
      (text) => text.setPlaceholder("Shadowdark/Monsters").setValue(this.plugin.settings.monsterFolder).onChange(async (value) => {
        this.plugin.settings.monsterFolder = value.trim() || "Shadowdark/Monsters";
        await this.plugin.savePluginSettings();
      })
    );
  }
};

// src/modals/ImportPreviewModal.ts
var import_obsidian4 = require("obsidian");

// src/utils/fixMonsterCommonIssues.ts
function cleanText(value) {
  return value.replace(/[–—]/g, "-").replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim();
}
function normalizeModifier2(value) {
  const cleaned = cleanText(value);
  if (!cleaned) return "";
  if (/^[+-]\d+$/.test(cleaned)) return cleaned;
  if (/^\d+$/.test(cleaned)) return `+${cleaned}`;
  if (/^-\d+$/.test(cleaned)) return cleaned;
  return cleaned;
}
function toSmartTitleCase(text) {
  const smallWords = /* @__PURE__ */ new Set([
    "of",
    "in",
    "and",
    "the",
    "to",
    "for",
    "on",
    "at",
    "by",
    "from",
    "with",
    "a",
    "an"
  ]);
  const words = text.toLowerCase().split(/\s+/);
  return words.map((word, index) => {
    if (!word) return word;
    const isFirst = index === 0;
    const isLast = index === words.length - 1;
    if (!isFirst && !isLast && smallWords.has(word)) {
      return word;
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(" ");
}
function normalizeDiceTypos(text) {
  return text.replace(/\b(\d+)dd(\d+)\b/gi, "$1d$2").replace(/\b(\d+)d+d(\d+)\b/gi, "$1d$2");
}
function normalizePunctuationSpacing(text) {
  return text.replace(/\s*:\s*/g, ": ").replace(/\s*\.\s*/g, ". ").replace(/\s*,\s*/g, ", ").replace(/\s{2,}/g, " ").trim();
}
function normalizeLabelStyle(text) {
  const cleaned = normalizePunctuationSpacing(normalizeDiceTypos(cleanText(text)));
  if (!cleaned) return "";
  const capitalizeBody = (body) => {
    if (!body) return "";
    return body.charAt(0).toUpperCase() + body.slice(1);
  };
  let match = cleaned.match(/^([^:]{1,80}):\s*(.+)$/);
  if (match) {
    const label = toSmartTitleCase(match[1].trim());
    const body = capitalizeBody(match[2].trim());
    return `${label}: ${body}`;
  }
  match = cleaned.match(/^([^.!?]{1,80}[.!?])\s*(.+)$/);
  if (match) {
    const rawLabel = match[1].trim();
    const punctuation = rawLabel.slice(-1);
    const labelCore = rawLabel.slice(0, -1).trim();
    const body = capitalizeBody(match[2].trim());
    return `${toSmartTitleCase(labelCore)}${punctuation} ${body}`;
  }
  if (/^[a-z]/.test(cleaned)) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return cleaned;
}
function cleanMultilineItems(items) {
  return items.map((item) => normalizeLabelStyle(item)).filter(Boolean);
}
function normalizeAttackText(text) {
  let cleaned = normalizePunctuationSpacing(normalizeDiceTypos(cleanText(text)));
  const connectorMatch = cleaned.match(/^(AND|OR)\s+(.+)$/i);
  if (connectorMatch) {
    const connector = connectorMatch[1].toUpperCase();
    const body = connectorMatch[2].trim();
    return `${connector} ${body}`;
  }
  return cleaned;
}
function normalizeAttack2(attack) {
  const raw = normalizeAttackText(attack.raw || "");
  const name = normalizeAttackText(attack.name || "");
  return {
    ...attack,
    name: raw || name,
    raw: raw || name
  };
}
function normalizeDescription(text) {
  const cleaned = normalizePunctuationSpacing(normalizeDiceTypos(cleanText(text)));
  if (!cleaned) return "";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
function fixMonsterCommonIssues(monster) {
  return {
    ...monster,
    name: cleanText(monster.name),
    level: cleanText(monster.level),
    alignment: cleanText(monster.alignment).toUpperCase(),
    type: cleanText(monster.type),
    ac: cleanText(monster.ac),
    hp: cleanText(monster.hp),
    mv: cleanText(monster.mv),
    atk: monster.atk.map(normalizeAttack2).filter((attack) => Boolean((attack.raw || attack.name).trim())),
    stats: {
      str: normalizeModifier2(monster.stats.str),
      dex: normalizeModifier2(monster.stats.dex),
      con: normalizeModifier2(monster.stats.con),
      int: normalizeModifier2(monster.stats.int),
      wis: normalizeModifier2(monster.stats.wis),
      cha: normalizeModifier2(monster.stats.cha)
    },
    traits: cleanMultilineItems(monster.traits),
    specials: cleanMultilineItems(monster.specials),
    spells: cleanMultilineItems(monster.spells),
    gear: cleanMultilineItems(monster.gear),
    description: normalizeDescription(monster.description),
    source: cleanText(monster.source),
    tags: cleanTags(monster.tags)
  };
  function cleanTags(tags) {
    return tags.map(
      (tag) => tag.toLowerCase().replace(/[–—]/g, "-").replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim()
    ).filter(Boolean);
  }
}

// src/modals/ImportPreviewModal.ts
var SOURCE_OPTIONS = [
  "Core Rules",
  "Cursed Scroll 1",
  "Cursed Scroll 2",
  "Cursed Scroll 3",
  "Homebrew",
  "Other"
];
function getNavAction(evt) {
  const key = evt.key;
  const code = evt.code;
  if (key === "ArrowDown" || key === "Down" || code === "ArrowDown" || key === "ArrowRight" || key === "Right" || code === "ArrowRight") {
    return "next";
  }
  if (key === "ArrowUp" || key === "Up" || code === "ArrowUp" || key === "ArrowLeft" || key === "Left" || code === "ArrowLeft") {
    return "prev";
  }
  if (key === "Enter" || code === "Enter" || code === "NumpadEnter") {
    return "enter";
  }
  if (key === "Escape" || key === "Esc" || code === "Escape") {
    return "escape";
  }
  return null;
}
function stopKeyEvent(evt) {
  evt.preventDefault();
  evt.stopPropagation();
  if ("stopImmediatePropagation" in evt) {
    evt.stopImmediatePropagation();
  }
}
function normalizeLines(value) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}
function joinAttackLines(monster) {
  return monster.atk.map((a) => a.raw || a.name).join("\n");
}
function splitTags(value) {
  return value.split(",").map((tag) => tag.trim()).filter(Boolean);
}
function joinTags(tags) {
  return tags.join(", ");
}
function normalizeSourceForDropdown(source) {
  const trimmed = source.trim();
  if (!trimmed) return "Core Rules";
  return SOURCE_OPTIONS.includes(trimmed) ? trimmed : "Other";
}
function getCurrentTagFragment(rawValue) {
  var _a;
  const parts = rawValue.split(",");
  return ((_a = parts[parts.length - 1]) != null ? _a : "").trim().toLowerCase();
}
function replaceCurrentTagFragment(rawValue, selectedTag) {
  const parts = rawValue.split(",");
  const committed = parts.slice(0, -1).map((part) => part.trim()).filter(Boolean);
  return committed.length > 0 ? `${committed.join(", ")}, ${selectedTag}` : selectedTag;
}
function getCurrentSourceFragment(value) {
  return value.trim().toLowerCase();
}
var ImportPreviewModal = class extends import_obsidian4.Modal {
  constructor(app, options) {
    var _a, _b, _c;
    super(app);
    this.filteredTagSuggestions = [];
    this.highlightedTagSuggestionIndex = -1;
    this.filteredOtherSourceSuggestions = [];
    this.highlightedOtherSourceSuggestionIndex = -1;
    this.monster = structuredClone(options.monster);
    this.warnings = options.warnings;
    this.onConfirmCallback = options.onConfirm;
    this.onSkipCallback = options.onSkip;
    this.mode = (_a = options.mode) != null ? _a : "import";
    this.progressLabel = options.progressLabel;
    this.suggestedTags = [...(_b = options.suggestedTags) != null ? _b : []].sort(
      (a, b) => a.localeCompare(b)
    );
    this.suggestedOtherSources = [...(_c = options.suggestedOtherSources) != null ? _c : []].sort(
      (a, b) => a.localeCompare(b)
    );
  }
  getMatchingTagSuggestions(rawValue) {
    var _a, _b;
    const value = (_b = rawValue != null ? rawValue : (_a = this.tagsInput) == null ? void 0 : _a.getValue()) != null ? _b : "";
    const fragment = getCurrentTagFragment(value);
    const currentTags = new Set(splitTags(value).map((tag) => tag.toLowerCase()));
    if (!fragment) return [];
    return this.suggestedTags.filter((tag) => !currentTags.has(tag.toLowerCase())).filter((tag) => tag.toLowerCase().includes(fragment)).slice(0, 8);
  }
  getMatchingOtherSourceSuggestions(rawValue) {
    var _a, _b, _c;
    if (((_a = this.sourceDropdown) == null ? void 0 : _a.getValue()) !== "Other") return [];
    const value = ((_c = rawValue != null ? rawValue : (_b = this.otherSourceInput) == null ? void 0 : _b.getValue()) != null ? _c : "").trim();
    const fragment = getCurrentSourceFragment(value);
    if (!fragment) return [];
    return this.suggestedOtherSources.filter((source) => source.toLowerCase() !== value.toLowerCase()).filter((source) => source.toLowerCase().includes(fragment)).slice(0, 8);
  }
  refreshPreview() {
    if (!this.previewEl) return;
    this.previewEl.empty();
    renderMonsterBlock(
      this.previewEl,
      this.monster,
      {
        ...DEFAULT_SETTINGS,
        compactMode: false,
        showSource: true,
        showTags: true
      },
      this.warnings
    );
  }
  refreshSourceVisibility() {
    var _a, _b;
    if (!this.otherSourceSettingEl) return;
    const dropdownValue = (_b = (_a = this.sourceDropdown) == null ? void 0 : _a.getValue()) != null ? _b : "Core Rules";
    const visible = dropdownValue === "Other";
    this.otherSourceSettingEl.style.display = visible ? "" : "none";
    if (this.otherSourceSuggestionsEl) {
      this.otherSourceSuggestionsEl.style.display = visible ? "" : "none";
    }
    this.refreshOtherSourceSuggestions();
  }
  refreshTagSuggestions() {
    if (!this.tagSuggestionsEl || !this.tagsInput) return;
    this.tagSuggestionsEl.innerHTML = "";
    const rawValue = this.tagsInput.getValue();
    this.filteredTagSuggestions = this.getMatchingTagSuggestions(rawValue);
    if (this.filteredTagSuggestions.length === 0) {
      this.highlightedTagSuggestionIndex = -1;
      return;
    }
    if (this.highlightedTagSuggestionIndex < 0) {
      this.highlightedTagSuggestionIndex = 0;
    } else if (this.highlightedTagSuggestionIndex >= this.filteredTagSuggestions.length) {
      this.highlightedTagSuggestionIndex = this.filteredTagSuggestions.length - 1;
    }
    const label = document.createElement("div");
    label.className = "sd-tag-suggestions-label";
    label.textContent = "Matching tags";
    this.tagSuggestionsEl.appendChild(label);
    const chips = document.createElement("div");
    chips.className = "sd-tag-suggestions-chips";
    this.filteredTagSuggestions.forEach((tag, index) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "sd-tag-suggestion-chip";
      if (index === this.highlightedTagSuggestionIndex) {
        chip.classList.add("is-active");
      }
      chip.textContent = tag;
      chip.addEventListener("click", () => {
        const updatedValue = replaceCurrentTagFragment(rawValue, tag);
        this.monster.tags = splitTags(updatedValue);
        this.tagsInput.setValue(joinTags(this.monster.tags));
        this.highlightedTagSuggestionIndex = -1;
        this.refreshTagSuggestions();
        this.refreshPreview();
      });
      chips.appendChild(chip);
    });
    this.tagSuggestionsEl.appendChild(chips);
  }
  refreshOtherSourceSuggestions() {
    var _a;
    if (!this.otherSourceSuggestionsEl || !this.otherSourceInput) return;
    this.otherSourceSuggestionsEl.innerHTML = "";
    if (((_a = this.sourceDropdown) == null ? void 0 : _a.getValue()) !== "Other") {
      this.filteredOtherSourceSuggestions = [];
      this.highlightedOtherSourceSuggestionIndex = -1;
      return;
    }
    const rawValue = this.otherSourceInput.getValue().trim();
    this.filteredOtherSourceSuggestions = this.getMatchingOtherSourceSuggestions(rawValue);
    if (this.filteredOtherSourceSuggestions.length === 0) {
      this.highlightedOtherSourceSuggestionIndex = -1;
      const empty = document.createElement("div");
      empty.className = "sd-tag-suggestions-empty";
      empty.textContent = "No matching sources";
      this.otherSourceSuggestionsEl.appendChild(empty);
      return;
    }
    if (this.highlightedOtherSourceSuggestionIndex < 0) {
      this.highlightedOtherSourceSuggestionIndex = 0;
    } else if (this.highlightedOtherSourceSuggestionIndex >= this.filteredOtherSourceSuggestions.length) {
      this.highlightedOtherSourceSuggestionIndex = this.filteredOtherSourceSuggestions.length - 1;
    }
    const label = document.createElement("div");
    label.className = "sd-tag-suggestions-label";
    label.textContent = "Matching sources";
    this.otherSourceSuggestionsEl.appendChild(label);
    const chips = document.createElement("div");
    chips.className = "sd-tag-suggestions-chips";
    this.filteredOtherSourceSuggestions.forEach((source, index) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "sd-tag-suggestion-chip";
      if (index === this.highlightedOtherSourceSuggestionIndex) {
        chip.classList.add("is-active");
      }
      chip.textContent = source;
      chip.addEventListener("click", () => {
        this.monster.source = source;
        this.otherSourceInput.setValue(source);
        this.highlightedOtherSourceSuggestionIndex = -1;
        this.refreshOtherSourceSuggestions();
        this.refreshPreview();
      });
      chips.appendChild(chip);
    });
    this.otherSourceSuggestionsEl.appendChild(chips);
  }
  moveTagSuggestionSelection(direction) {
    if (this.filteredTagSuggestions.length === 0) return;
    if (this.highlightedTagSuggestionIndex < 0) {
      this.highlightedTagSuggestionIndex = direction === 1 ? 0 : this.filteredTagSuggestions.length - 1;
    } else {
      this.highlightedTagSuggestionIndex = (this.highlightedTagSuggestionIndex + direction + this.filteredTagSuggestions.length) % this.filteredTagSuggestions.length;
    }
    this.refreshTagSuggestions();
  }
  applyHighlightedTagSuggestion() {
    if (this.highlightedTagSuggestionIndex < 0 || this.highlightedTagSuggestionIndex >= this.filteredTagSuggestions.length || !this.tagsInput) {
      return;
    }
    const selectedTag = this.filteredTagSuggestions[this.highlightedTagSuggestionIndex];
    const rawValue = this.tagsInput.getValue();
    const updatedValue = replaceCurrentTagFragment(rawValue, selectedTag);
    this.monster.tags = splitTags(updatedValue);
    this.tagsInput.setValue(joinTags(this.monster.tags));
    this.highlightedTagSuggestionIndex = -1;
    this.refreshTagSuggestions();
    this.refreshPreview();
  }
  clearTagSuggestionSelection() {
    this.highlightedTagSuggestionIndex = -1;
    this.filteredTagSuggestions = [];
    this.refreshTagSuggestions();
  }
  moveOtherSourceSuggestionSelection(direction) {
    if (this.filteredOtherSourceSuggestions.length === 0) return;
    if (this.highlightedOtherSourceSuggestionIndex < 0) {
      this.highlightedOtherSourceSuggestionIndex = direction === 1 ? 0 : this.filteredOtherSourceSuggestions.length - 1;
    } else {
      this.highlightedOtherSourceSuggestionIndex = (this.highlightedOtherSourceSuggestionIndex + direction + this.filteredOtherSourceSuggestions.length) % this.filteredOtherSourceSuggestions.length;
    }
    this.refreshOtherSourceSuggestions();
  }
  applyHighlightedOtherSourceSuggestion() {
    if (this.highlightedOtherSourceSuggestionIndex < 0 || this.highlightedOtherSourceSuggestionIndex >= this.filteredOtherSourceSuggestions.length || !this.otherSourceInput) {
      return;
    }
    const selectedSource = this.filteredOtherSourceSuggestions[this.highlightedOtherSourceSuggestionIndex];
    this.monster.source = selectedSource;
    this.otherSourceInput.setValue(selectedSource);
    this.highlightedOtherSourceSuggestionIndex = -1;
    this.refreshOtherSourceSuggestions();
    this.refreshPreview();
  }
  clearOtherSourceSuggestionSelection() {
    this.highlightedOtherSourceSuggestionIndex = -1;
    this.filteredOtherSourceSuggestions = [];
    this.refreshOtherSourceSuggestions();
  }
  refreshFormFields() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v;
    (_a = this.nameInput) == null ? void 0 : _a.setValue(this.monster.name);
    (_b = this.descriptionInput) == null ? void 0 : _b.setValue(this.monster.description);
    const dropdownValue = normalizeSourceForDropdown(this.monster.source);
    (_c = this.sourceDropdown) == null ? void 0 : _c.setValue(dropdownValue);
    if (dropdownValue === "Other") {
      (_d = this.otherSourceInput) == null ? void 0 : _d.setValue(this.monster.source);
    } else {
      (_e = this.otherSourceInput) == null ? void 0 : _e.setValue("");
    }
    (_f = this.tagsInput) == null ? void 0 : _f.setValue(joinTags(this.monster.tags));
    (_g = this.levelInput) == null ? void 0 : _g.setValue(this.monster.level);
    (_h = this.alignmentInput) == null ? void 0 : _h.setValue(this.monster.alignment);
    (_i = this.acInput) == null ? void 0 : _i.setValue(this.monster.ac);
    (_j = this.hpInput) == null ? void 0 : _j.setValue(this.monster.hp);
    (_k = this.mvInput) == null ? void 0 : _k.setValue(this.monster.mv);
    (_l = this.strInput) == null ? void 0 : _l.setValue(this.monster.stats.str);
    (_m = this.dexInput) == null ? void 0 : _m.setValue(this.monster.stats.dex);
    (_n = this.conInput) == null ? void 0 : _n.setValue(this.monster.stats.con);
    (_o = this.intInput) == null ? void 0 : _o.setValue(this.monster.stats.int);
    (_p = this.wisInput) == null ? void 0 : _p.setValue(this.monster.stats.wis);
    (_q = this.chaInput) == null ? void 0 : _q.setValue(this.monster.stats.cha);
    (_r = this.attacksInput) == null ? void 0 : _r.setValue(joinAttackLines(this.monster));
    (_s = this.traitsInput) == null ? void 0 : _s.setValue(this.monster.traits.join("\n"));
    (_t = this.spellsInput) == null ? void 0 : _t.setValue(this.monster.spells.join("\n"));
    (_u = this.specialsInput) == null ? void 0 : _u.setValue(this.monster.specials.join("\n"));
    (_v = this.gearInput) == null ? void 0 : _v.setValue(this.monster.gear.join("\n"));
    this.refreshSourceVisibility();
    this.refreshTagSuggestions();
    this.refreshOtherSourceSuggestions();
  }
  fixCommonIssues() {
    this.monster = fixMonsterCommonIssues(this.monster);
    this.refreshFormFields();
    this.refreshPreview();
    new import_obsidian4.Notice("Common issues cleaned up.");
  }
  onOpen() {
    const { contentEl, titleEl } = this;
    titleEl.setText(
      this.mode === "edit" ? "Edit Shadowdark monster" : "Import Shadowdark monster"
    );
    contentEl.empty();
    contentEl.addClass("sd-import-preview-modal");
    this.modalEl.addClass("sd-import-preview-modal-shell");
    const intro = document.createElement("p");
    intro.className = "sd-import-preview-description";
    intro.textContent = this.mode === "edit" ? "Review and edit the monster, then update the note." : "Review and edit the imported monster before creating the note.";
    contentEl.appendChild(intro);
    if (this.progressLabel) {
      const progressEl = document.createElement("div");
      progressEl.className = "sd-import-preview-progress";
      progressEl.textContent = this.progressLabel;
      contentEl.appendChild(progressEl);
    }
    if (this.warnings.length > 0) {
      const warningBox = document.createElement("div");
      warningBox.className = "sd-import-preview-warnings";
      const warningTitle = document.createElement("h4");
      warningTitle.textContent = "Warnings";
      warningBox.appendChild(warningTitle);
      const warningList = document.createElement("ul");
      for (const warning of this.warnings) {
        const li = document.createElement("li");
        li.textContent = warning;
        warningList.appendChild(li);
      }
      warningBox.appendChild(warningList);
      contentEl.appendChild(warningBox);
    }
    const layout = document.createElement("div");
    layout.className = "sd-import-preview-layout";
    contentEl.appendChild(layout);
    const formCol = document.createElement("div");
    formCol.className = "sd-import-preview-form";
    layout.appendChild(formCol);
    const previewCol = document.createElement("div");
    previewCol.className = "sd-import-preview-panel";
    layout.appendChild(previewCol);
    const previewHeading = document.createElement("h3");
    previewHeading.textContent = "Live preview";
    previewCol.appendChild(previewHeading);
    this.previewEl = document.createElement("div");
    this.previewEl.className = "sd-import-preview-statblock";
    previewCol.appendChild(this.previewEl);
    formCol.createEl("h3", { text: "Core" });
    new import_obsidian4.Setting(formCol).setName("Name").addText((text) => {
      this.nameInput = text;
      text.setValue(this.monster.name).onChange((value) => {
        this.monster.name = value.trim();
        this.refreshPreview();
      });
    });
    new import_obsidian4.Setting(formCol).setName("Description").addTextArea((text) => {
      this.descriptionInput = text;
      text.setValue(this.monster.description).onChange((value) => {
        this.monster.description = value.trim();
        this.refreshPreview();
      });
      text.inputEl.rows = 4;
      text.inputEl.addClass("sd-import-preview-textarea");
    });
    formCol.createEl("h3", { text: "Metadata" });
    new import_obsidian4.Setting(formCol).setName("Source").setDesc("Choose a source for this monster").addDropdown((dropdown) => {
      this.sourceDropdown = dropdown;
      SOURCE_OPTIONS.forEach((option) => {
        dropdown.addOption(option, option);
      });
      dropdown.setValue(normalizeSourceForDropdown(this.monster.source)).onChange((value) => {
        var _a;
        if (value === "Other") {
          this.monster.source = ((_a = this.otherSourceInput) == null ? void 0 : _a.getValue().trim()) || "";
        } else {
          this.monster.source = value;
        }
        this.highlightedOtherSourceSuggestionIndex = -1;
        this.refreshSourceVisibility();
        this.refreshPreview();
      });
    });
    const otherSourceSetting = new import_obsidian4.Setting(formCol).setName("Other Source").setDesc("Type a custom source name").addText((text) => {
      this.otherSourceInput = text;
      text.setValue(
        normalizeSourceForDropdown(this.monster.source) === "Other" ? this.monster.source : ""
      ).onChange((value) => {
        var _a;
        if (((_a = this.sourceDropdown) == null ? void 0 : _a.getValue()) === "Other") {
          this.monster.source = value.trim();
          this.highlightedOtherSourceSuggestionIndex = -1;
          this.refreshOtherSourceSuggestions();
          this.refreshPreview();
        }
      });
      text.inputEl.onkeydown = (evt) => {
        const action = getNavAction(evt);
        this.filteredOtherSourceSuggestions = this.getMatchingOtherSourceSuggestions(text.getValue());
        const hasSuggestions = this.filteredOtherSourceSuggestions.length > 0;
        if (!action || !hasSuggestions) return;
        if (action === "next") {
          stopKeyEvent(evt);
          this.moveOtherSourceSuggestionSelection(1);
          return false;
        }
        if (action === "prev") {
          stopKeyEvent(evt);
          this.moveOtherSourceSuggestionSelection(-1);
          return false;
        }
        if (action === "enter") {
          stopKeyEvent(evt);
          if (this.highlightedOtherSourceSuggestionIndex < 0) {
            this.highlightedOtherSourceSuggestionIndex = 0;
          }
          this.applyHighlightedOtherSourceSuggestion();
          return false;
        }
        if (action === "escape") {
          stopKeyEvent(evt);
          this.clearOtherSourceSuggestionSelection();
          return false;
        }
        return;
      };
    });
    this.otherSourceSettingEl = otherSourceSetting.settingEl;
    this.otherSourceSuggestionsEl = document.createElement("div");
    this.otherSourceSuggestionsEl.className = "sd-tag-suggestions";
    formCol.appendChild(this.otherSourceSuggestionsEl);
    new import_obsidian4.Setting(formCol).setName("Tags").setDesc("Comma-separated tags").addText((text) => {
      this.tagsInput = text;
      text.setValue(joinTags(this.monster.tags)).onChange((value) => {
        this.monster.tags = splitTags(value);
        this.highlightedTagSuggestionIndex = -1;
        this.refreshTagSuggestions();
        this.refreshPreview();
      });
      text.inputEl.onkeydown = (evt) => {
        const action = getNavAction(evt);
        this.filteredTagSuggestions = this.getMatchingTagSuggestions(text.getValue());
        const hasSuggestions = this.filteredTagSuggestions.length > 0;
        if (!action || !hasSuggestions) return;
        if (action === "next") {
          stopKeyEvent(evt);
          this.moveTagSuggestionSelection(1);
          return false;
        }
        if (action === "prev") {
          stopKeyEvent(evt);
          this.moveTagSuggestionSelection(-1);
          return false;
        }
        if (action === "enter") {
          stopKeyEvent(evt);
          if (this.highlightedTagSuggestionIndex < 0) {
            this.highlightedTagSuggestionIndex = 0;
          }
          this.applyHighlightedTagSuggestion();
          return false;
        }
        if (action === "escape") {
          stopKeyEvent(evt);
          this.clearTagSuggestionSelection();
          return false;
        }
        return;
      };
    });
    this.tagSuggestionsEl = document.createElement("div");
    this.tagSuggestionsEl.className = "sd-tag-suggestions";
    formCol.appendChild(this.tagSuggestionsEl);
    formCol.createEl("h3", { text: "Stats" });
    new import_obsidian4.Setting(formCol).setName("Level").addText((text) => {
      this.levelInput = text;
      text.setValue(this.monster.level).onChange((value) => {
        this.monster.level = value.trim();
        this.refreshPreview();
      });
    });
    new import_obsidian4.Setting(formCol).setName("Alignment").setDesc("Usually L, N, or C").addText((text) => {
      this.alignmentInput = text;
      text.setValue(this.monster.alignment).onChange((value) => {
        this.monster.alignment = value.trim().toUpperCase();
        this.refreshPreview();
      });
    });
    new import_obsidian4.Setting(formCol).setName("AC").addText((text) => {
      this.acInput = text;
      text.setValue(this.monster.ac).onChange((value) => {
        this.monster.ac = value.trim();
        this.refreshPreview();
      });
    });
    new import_obsidian4.Setting(formCol).setName("HP").addText((text) => {
      this.hpInput = text;
      text.setValue(this.monster.hp).onChange((value) => {
        this.monster.hp = value.trim();
        this.refreshPreview();
      });
    });
    new import_obsidian4.Setting(formCol).setName("MV").addText((text) => {
      this.mvInput = text;
      text.setValue(this.monster.mv).onChange((value) => {
        this.monster.mv = value.trim();
        this.refreshPreview();
      });
    });
    formCol.createEl("h3", { text: "Abilities" });
    new import_obsidian4.Setting(formCol).setName("STR").addText((text) => {
      this.strInput = text;
      text.setValue(this.monster.stats.str).onChange((value) => {
        this.monster.stats.str = value.trim();
        this.refreshPreview();
      });
    });
    new import_obsidian4.Setting(formCol).setName("DEX").addText((text) => {
      this.dexInput = text;
      text.setValue(this.monster.stats.dex).onChange((value) => {
        this.monster.stats.dex = value.trim();
        this.refreshPreview();
      });
    });
    new import_obsidian4.Setting(formCol).setName("CON").addText((text) => {
      this.conInput = text;
      text.setValue(this.monster.stats.con).onChange((value) => {
        this.monster.stats.con = value.trim();
        this.refreshPreview();
      });
    });
    new import_obsidian4.Setting(formCol).setName("INT").addText((text) => {
      this.intInput = text;
      text.setValue(this.monster.stats.int).onChange((value) => {
        this.monster.stats.int = value.trim();
        this.refreshPreview();
      });
    });
    new import_obsidian4.Setting(formCol).setName("WIS").addText((text) => {
      this.wisInput = text;
      text.setValue(this.monster.stats.wis).onChange((value) => {
        this.monster.stats.wis = value.trim();
        this.refreshPreview();
      });
    });
    new import_obsidian4.Setting(formCol).setName("CHA").addText((text) => {
      this.chaInput = text;
      text.setValue(this.monster.stats.cha).onChange((value) => {
        this.monster.stats.cha = value.trim();
        this.refreshPreview();
      });
    });
    formCol.createEl("h3", { text: "Lists" });
    new import_obsidian4.Setting(formCol).setName("Attacks").setDesc("One attack per line").addTextArea((text) => {
      this.attacksInput = text;
      text.setValue(joinAttackLines(this.monster)).onChange((value) => {
        this.monster.atk = normalizeLines(value).map((line) => ({
          name: line,
          raw: line
        }));
        this.refreshPreview();
      });
      text.inputEl.rows = 5;
      text.inputEl.addClass("sd-import-preview-textarea");
    });
    new import_obsidian4.Setting(formCol).setName("Traits").setDesc(
      'Passive or always-on abilities. One trait per line. Good formats: "Devour. Use turn to..." or "Devour: Use turn to..."'
    ).addTextArea((text) => {
      this.traitsInput = text;
      text.setValue(this.monster.traits.join("\n")).onChange((value) => {
        this.monster.traits = normalizeLines(value);
        this.refreshPreview();
      });
      text.inputEl.rows = 5;
      text.inputEl.addClass("sd-import-preview-textarea");
    });
    new import_obsidian4.Setting(formCol).setName("Spells").setDesc(
      'Spell-like or magical abilities. One spell per line. Good formats: "Ray of Frost (INT Spell). ..." or "Ray of Frost: ..."'
    ).addTextArea((text) => {
      this.spellsInput = text;
      text.setValue(this.monster.spells.join("\n")).onChange((value) => {
        this.monster.spells = normalizeLines(value);
        this.refreshPreview();
      });
      text.inputEl.rows = 5;
      text.inputEl.addClass("sd-import-preview-textarea");
    });
    new import_obsidian4.Setting(formCol).setName("Specials").setDesc("Active or triggered non-spell abilities. One special entry per line").addTextArea((text) => {
      this.specialsInput = text;
      text.setValue(this.monster.specials.join("\n")).onChange((value) => {
        this.monster.specials = normalizeLines(value);
        this.refreshPreview();
      });
      text.inputEl.rows = 4;
      text.inputEl.addClass("sd-import-preview-textarea");
    });
    new import_obsidian4.Setting(formCol).setName("Gear").setDesc("One gear entry per line").addTextArea((text) => {
      this.gearInput = text;
      text.setValue(this.monster.gear.join("\n")).onChange((value) => {
        this.monster.gear = normalizeLines(value);
        this.refreshPreview();
      });
      text.inputEl.rows = 3;
      text.inputEl.addClass("sd-import-preview-textarea");
    });
    new import_obsidian4.Setting(formCol).addButton(
      (button) => button.setButtonText("Fix common issues").setTooltip(
        "Cleans formatting: fixes spacing, dice typos (1dd8 \u2192 1d8), capitalizes names/descriptions, and normalizes traits, spells, and attacks."
      ).onClick(() => {
        this.fixCommonIssues();
      })
    ).addButton(
      (button) => button.setButtonText(this.mode === "edit" ? "Update note" : "Create note").setCta().onClick(async () => {
        if (!this.monster.name.trim()) {
          new import_obsidian4.Notice("Monster needs a name before saving.");
          return;
        }
        try {
          await this.onConfirmCallback(this.monster);
          this.close();
        } catch (error) {
          console.error("Shadowdark Statblocks modal confirm error:", error);
          new import_obsidian4.Notice("Failed to save monster note.");
        }
      })
    );
    if (this.onSkipCallback) {
      new import_obsidian4.Setting(formCol).addButton(
        (button) => button.setButtonText("Skip").onClick(() => {
          var _a;
          (_a = this.onSkipCallback) == null ? void 0 : _a.call(this);
          this.close();
        })
      );
    }
    new import_obsidian4.Setting(formCol).addButton(
      (button) => button.setButtonText("Cancel").onClick(() => {
        this.close();
      })
    );
    this.refreshFormFields();
    this.refreshPreview();
  }
  onClose() {
    this.contentEl.empty();
    this.modalEl.removeClass("sd-import-preview-modal-shell");
  }
};

// src/modals/DuplicateMonsterModal.ts
var import_obsidian5 = require("obsidian");
var DuplicateMonsterModal = class extends import_obsidian5.Modal {
  constructor(app, options) {
    super(app);
    this.monsterName = options.monsterName;
    this.existingFileName = options.existingFileName;
    this.canOverwrite = options.canOverwrite;
    this.onOverwriteCallback = options.onOverwrite;
    this.onCreateCopyCallback = options.onCreateCopy;
  }
  onOpen() {
    const { contentEl, titleEl } = this;
    titleEl.setText("Duplicate monster note");
    contentEl.empty();
    const message = document.createElement("p");
    message.textContent = this.canOverwrite ? `A Shadowdark monster note named "${this.existingFileName}" already exists.` : `A file named "${this.existingFileName}" already exists, but it is not a Shadowdark monster note.`;
    contentEl.appendChild(message);
    const subMessage = document.createElement("p");
    subMessage.textContent = this.canOverwrite ? "Choose whether to update the existing note, create a copy, or cancel." : "To avoid overwriting a non-monster note, you can create a copy or cancel.";
    contentEl.appendChild(subMessage);
    new import_obsidian5.Setting(contentEl).addButton((button) => {
      if (this.canOverwrite && this.onOverwriteCallback) {
        button.setButtonText("Update existing note").setCta().onClick(async () => {
          var _a;
          await ((_a = this.onOverwriteCallback) == null ? void 0 : _a.call(this));
          this.close();
        });
      }
    }).addButton(
      (button) => button.setButtonText("Create copy").onClick(async () => {
        await this.onCreateCopyCallback();
        this.close();
      })
    ).addButton(
      (button) => button.setButtonText("Cancel").onClick(() => {
        this.close();
      })
    );
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/utils/splitRawShadowdarkBlocks.ts
var UPPERCASE_NON_NAME_WORDS = /* @__PURE__ */ new Set([
  "AC",
  "HP",
  "ATK",
  "MV",
  "AL",
  "LV",
  "STR",
  "DEX",
  "CON",
  "INT",
  "WIS",
  "CHA",
  "DC",
  "ADV",
  "DISADV"
]);
function cleanNameToken(word) {
  return word.replace(/[,'’-]/g, "");
}
function isUppercaseNameToken(word) {
  const cleaned = cleanNameToken(word);
  if (!cleaned) return false;
  if (UPPERCASE_NON_NAME_WORDS.has(cleaned)) return false;
  return /^[A-Z0-9]+$/.test(cleaned);
}
function looksLikeMonsterNameInline(candidate, minWords = 1) {
  const words = candidate.trim().split(/\s+/).filter(Boolean);
  if (words.length < minWords || words.length > 4) return false;
  return words.every((word) => isUppercaseNameToken(word));
}
function normalizeEmbeddedMonsterNames(input) {
  let text = input;
  text = text.replace(
    /([.!?])\s+([A-Z][A-Z0-9,'’-]*(?:\s+[A-Z][A-Z0-9,'’-]*){0,3})\s+([A-Z][a-z][^\r\n]*)/g,
    (match, punct, maybeName, descriptionStart) => {
      if (!looksLikeMonsterNameInline(maybeName, 1)) {
        return match;
      }
      return `${punct}
${maybeName}
${descriptionStart}`;
    }
  );
  text = text.replace(
    /([a-z0-9)\]])\s+([A-Z][A-Z0-9,'’-]*(?:\s+[A-Z][A-Z0-9,'’-]+){1,3})\s+([a-z][^.\r\n]{0,30}[.)]?)/g,
    (match, prefixEnd, maybeName, suffix) => {
      if (!looksLikeMonsterNameInline(maybeName, 2)) {
        return match;
      }
      return `${prefixEnd} ${suffix}
${maybeName}`;
    }
  );
  text = text.replace(
    /([.!?])\s+([A-Z][A-Z0-9,'’-]*(?:\s+[A-Z][A-Z0-9,'’-]*){0,3})$/gm,
    (match, punct, maybeName) => {
      if (!looksLikeMonsterNameInline(maybeName, 1)) {
        return match;
      }
      return `${punct}
${maybeName}`;
    }
  );
  return text;
}
function splitRawShadowdarkBlocks(input) {
  const normalizedInput = normalizeEmbeddedMonsterNames(input);
  const lines = normalizedInput.split(/\r\n|\n|\r/).map((line) => line.trim()).filter((line) => line.length > 0);
  const blocks = [];
  let currentBlock = [];
  const hasStatAnchor = (text) => /\bAC\b/i.test(text) && /\bHP\b/i.test(text) && /\bATK\b/i.test(text) && /\bLV\b/i.test(text);
  const isLikelyMonsterName = (line) => {
    if (line.length < 3 || line.length > 40) return false;
    return looksLikeMonsterNameInline(line, 1);
  };
  const isAbilityLead = (line) => {
    return /^[A-Z][A-Za-z0-9'’-]{0,40}\./.test(line);
  };
  const isDescriptionLike = (line) => {
    if (isLikelyMonsterName(line)) return false;
    if (isAbilityLead(line)) return false;
    if (/\bAC\b|\bHP\b|\bATK\b|\bAL\b|\bLV\b|\bMV\b/.test(line)) return false;
    return /^[A-Z]/.test(line) && /[a-z]/.test(line);
  };
  const upcomingHasStatAnchor = (startIndex, lookahead = 6) => {
    const text = lines.slice(startIndex, startIndex + lookahead).join(" ");
    return hasStatAnchor(text);
  };
  const blockStartsWithName = (block) => {
    if (block.length === 0) return false;
    return isLikelyMonsterName(block[0]);
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (currentBlock.length === 0) {
      currentBlock.push(line);
      continue;
    }
    const currentText = currentBlock.join(" ");
    const currentHasStat = hasStatAnchor(currentText);
    const currentStartedWithName = blockStartsWithName(currentBlock);
    const shouldStartNewByLeadingName = currentHasStat && currentStartedWithName && isLikelyMonsterName(line);
    const shouldStartNewByDescription = currentHasStat && isDescriptionLike(line) && upcomingHasStatAnchor(i, 6);
    if (shouldStartNewByLeadingName || shouldStartNewByDescription) {
      blocks.push(currentBlock.join("\n"));
      currentBlock = [line];
      continue;
    }
    currentBlock.push(line);
  }
  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join("\n"));
  }
  return blocks;
}

// src/modals/MonsterBrowserModal.ts
var import_obsidian6 = require("obsidian");
var import_obsidian7 = require("obsidian");
var MonsterBrowserModal = class extends import_obsidian6.Modal {
  constructor(app, plugin) {
    super(app);
    this.allMonsters = [];
    this.filteredMonsters = [];
    this.searchText = "";
    this.selectedSource = "";
    this.selectedTag = "";
    this.selectedMaxLevel = "";
    this.hoverHideTimeout = null;
    this.hoverMouseX = 0;
    this.hoverMouseY = 0;
    this.hoverShowTimeout = null;
    this.plugin = plugin;
  }
  async onOpen() {
    const { contentEl, titleEl } = this;
    this.modalEl.addClass("sd-monster-browser-modal-shell");
    titleEl.setText("Monster browser");
    contentEl.empty();
    contentEl.addClass("sd-monster-browser-modal");
    this.allMonsters = await this.plugin.getAllMonsterIndexEntries();
    this.filteredMonsters = [...this.allMonsters];
    const controlsEl = contentEl.createDiv({ cls: "sd-monster-browser-controls" });
    const createFilterCard = (labelText) => {
      const card = controlsEl.createDiv({ cls: "sd-monster-browser-filter" });
      card.createEl("label", {
        cls: "sd-monster-browser-filter-label",
        text: labelText
      });
      return card;
    };
    const searchCard = createFilterCard("Search");
    const searchInputEl = searchCard.createEl("input", {
      type: "text",
      placeholder: "Search by name...",
      cls: "sd-monster-browser-input"
    });
    searchInputEl.value = this.searchText;
    searchInputEl.addEventListener("input", () => {
      this.searchText = searchInputEl.value.trim().toLowerCase();
      this.applyFilters();
    });
    const sourceCard = createFilterCard("Source");
    const sourceSelectEl = sourceCard.createEl("select", {
      cls: "sd-monster-browser-select"
    });
    const allSources = Array.from(
      new Set(this.allMonsters.map((m) => m.source).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
    sourceSelectEl.appendChild(new Option("All", ""));
    for (const source of allSources) {
      sourceSelectEl.appendChild(new Option(source, source));
    }
    sourceSelectEl.value = this.selectedSource;
    sourceSelectEl.addEventListener("change", () => {
      this.selectedSource = sourceSelectEl.value;
      this.applyFilters();
    });
    const tagCard = createFilterCard("Tag");
    const tagSelectEl = tagCard.createEl("select", {
      cls: "sd-monster-browser-select"
    });
    const allTagsSet = /* @__PURE__ */ new Set();
    for (const monster of this.allMonsters) {
      for (const tag of monster.tags) {
        if (tag) allTagsSet.add(tag);
      }
    }
    const allTags = Array.from(allTagsSet).sort(
      (a, b) => a.localeCompare(b)
    );
    tagSelectEl.appendChild(new Option("All", ""));
    for (const tag of allTags) {
      tagSelectEl.appendChild(new Option(tag, tag));
    }
    tagSelectEl.value = this.selectedTag;
    tagSelectEl.addEventListener("change", () => {
      this.selectedTag = tagSelectEl.value;
      this.applyFilters();
    });
    const maxLevelCard = createFilterCard("Max Level");
    const maxLevelSelectEl = maxLevelCard.createEl("select", {
      cls: "sd-monster-browser-select"
    });
    maxLevelSelectEl.appendChild(new Option("Any", ""));
    for (let i = 0; i <= 20; i++) {
      maxLevelSelectEl.appendChild(new Option(String(i), String(i)));
    }
    maxLevelSelectEl.value = this.selectedMaxLevel;
    maxLevelSelectEl.addEventListener("change", () => {
      this.selectedMaxLevel = maxLevelSelectEl.value;
      this.applyFilters();
    });
    const actionsEl = contentEl.createDiv({ cls: "sd-monster-browser-actions" });
    const clearButton = actionsEl.createEl("button", {
      cls: "mod-cta sd-monster-browser-clear-button",
      text: "Clear filters"
    });
    clearButton.addEventListener("click", () => {
      this.searchText = "";
      this.selectedSource = "";
      this.selectedTag = "";
      this.selectedMaxLevel = "";
      searchInputEl.value = "";
      sourceSelectEl.value = "";
      tagSelectEl.value = "";
      maxLevelSelectEl.value = "";
      this.applyFilters();
    });
    this.resultsEl = contentEl.createDiv({ cls: "sd-monster-browser-results" });
    this.resultsEl.addEventListener("scroll", () => {
      this.hideHoverCard();
    });
    this.hoverCardEl = contentEl.createDiv({ cls: "sd-monster-browser-hover-card" });
    this.hoverPreviewEl = this.hoverCardEl.createDiv({
      cls: "sd-monster-browser-hover-card-inner"
    });
    this.hoverCardEl.addEventListener("mouseenter", () => {
      this.clearHoverHideTimeout();
    });
    this.hoverCardEl.addEventListener("mouseleave", () => {
      this.scheduleHideHoverCard();
    });
    this.renderResults();
  }
  onClose() {
    this.clearHoverHideTimeout();
    this.modalEl.removeClass("sd-monster-browser-modal-shell");
    this.contentEl.empty();
  }
  clearHoverHideTimeout() {
    if (this.hoverHideTimeout !== null) {
      window.clearTimeout(this.hoverHideTimeout);
      this.hoverHideTimeout = null;
    }
  }
  scheduleHideHoverCard() {
    this.clearHoverHideTimeout();
    this.hoverHideTimeout = window.setTimeout(() => {
      this.hideHoverCard();
    }, 120);
  }
  hideHoverCard() {
    if (this.hoverCardEl) {
      this.hoverCardEl.classList.remove("is-visible");
    }
  }
  showHoverCard(monster) {
    const result = parseFrontmatter(monster.frontmatter);
    if (!result.success || !result.data) return;
    this.hoverPreviewEl.empty();
    renderMonsterBlock(
      this.hoverPreviewEl,
      result.data,
      this.plugin.settings,
      result.warnings
    );
    this.hoverCardEl.classList.add("is-visible");
    this.positionHoverCard();
  }
  applyFilters() {
    this.filteredMonsters = this.allMonsters.filter((monster) => {
      const matchesSearch = !this.searchText || monster.name.toLowerCase().includes(this.searchText);
      const matchesSource = !this.selectedSource || monster.source === this.selectedSource;
      const matchesTag = !this.selectedTag || monster.tags.includes(this.selectedTag);
      const matchesLevel = !this.selectedMaxLevel || (Number(monster.level) || 0) <= Number(this.selectedMaxLevel);
      return matchesSearch && matchesSource && matchesTag && matchesLevel;
    });
    this.renderResults();
  }
  positionHoverCard() {
    if (!this.hoverCardEl.classList.contains("is-visible")) return;
    const offset = 16;
    const cardWidth = Math.min(420, Math.floor(window.innerWidth * 0.42));
    const cardHeight = Math.min(520, Math.floor(window.innerHeight * 0.7));
    let left = this.hoverMouseX + offset;
    let top = this.hoverMouseY + offset;
    if (left + cardWidth > window.innerWidth - 12) {
      left = this.hoverMouseX - cardWidth - offset;
    }
    if (left < 12) {
      left = 12;
    }
    if (top + cardHeight > window.innerHeight - 12) {
      top = window.innerHeight - cardHeight - 12;
    }
    if (top < 12) {
      top = 12;
    }
    this.hoverCardEl.style.left = `${left}px`;
    this.hoverCardEl.style.top = `${top}px`;
  }
  renderResults() {
    this.resultsEl.empty();
    this.hideHoverCard();
    const summary = this.resultsEl.createDiv({ cls: "sd-monster-browser-summary" });
    summary.setText(`${this.filteredMonsters.length} monster(s)`);
    if (this.filteredMonsters.length === 0) {
      this.resultsEl.createDiv({
        cls: "sd-monster-browser-empty",
        text: "No monsters match those filters."
      });
      return;
    }
    for (const monster of this.filteredMonsters) {
      const row = this.resultsEl.createDiv({ cls: "sd-monster-browser-row" });
      row.addEventListener("mouseenter", (evt) => {
        this.clearHoverHideTimeout();
        this.hoverMouseX = evt.clientX;
        this.hoverMouseY = evt.clientY;
        if (this.hoverShowTimeout) {
          window.clearTimeout(this.hoverShowTimeout);
        }
        this.hoverShowTimeout = window.setTimeout(() => {
          this.showHoverCard(monster);
        }, 120);
      });
      row.addEventListener("mousemove", (evt) => {
        this.hoverMouseX = evt.clientX;
        this.hoverMouseY = evt.clientY;
        this.positionHoverCard();
      });
      row.addEventListener("mouseleave", () => {
        if (this.hoverShowTimeout) {
          window.clearTimeout(this.hoverShowTimeout);
          this.hoverShowTimeout = null;
        }
        this.scheduleHideHoverCard();
      });
      row.createDiv({
        cls: "sd-monster-browser-name",
        text: monster.name
      });
      const metaParts = [
        monster.level ? `LV ${monster.level}` : "",
        monster.alignment ? `AL ${monster.alignment}` : "",
        monster.source || ""
      ].filter(Boolean);
      row.createDiv({
        cls: "sd-monster-browser-meta",
        text: metaParts.join(" \u2022 ")
      });
      if (monster.tags.length > 0) {
        const tagsEl = row.createDiv({ cls: "sd-monster-browser-tags" });
        for (const tag of monster.tags) {
          tagsEl.createDiv({
            cls: "sd-monster-browser-tag",
            text: tag
          });
        }
      }
      row.addEventListener("click", async () => {
        await this.app.workspace.getLeaf(true).openFile(monster.file);
        this.close();
      });
      row.addEventListener("contextmenu", (evt) => {
        evt.preventDefault();
        const menu = new import_obsidian7.Menu();
        menu.addItem(
          (item) => item.setTitle("Open").onClick(async () => {
            await this.app.workspace.getLeaf(true).openFile(monster.file);
            this.close();
          })
        );
        menu.addItem(
          (item) => item.setTitle("Open to the right").onClick(async () => {
            const leaf = this.app.workspace.getLeaf("split", "vertical");
            await leaf.openFile(monster.file);
          })
        );
        menu.addItem(
          (item) => item.setTitle("Copy link").onClick(async () => {
            const link = `[[${monster.file.basename}]]`;
            await navigator.clipboard.writeText(link);
          })
        );
        menu.addItem(
          (item) => item.setTitle("Copy embed").onClick(async () => {
            const embed = `![[${monster.file.basename}]]`;
            await navigator.clipboard.writeText(embed);
          })
        );
        menu.showAtMouseEvent(evt);
      });
    }
  }
};

// src/main.ts
var ShadowdarkStatblocksPlugin = class extends import_obsidian8.Plugin {
  constructor() {
    super(...arguments);
    this.renderGeneration = 0;
    this.autoPreviewedLeafFiles = /* @__PURE__ */ new WeakMap();
    this.parsedMonsterCache = /* @__PURE__ */ new Map();
  }
  renderMonsterInProcessedPreview(el, ctx) {
    if (!this.settings.renderFrontmatterMonsters) return;
    if (!el.classList.contains("mod-frontmatter")) {
      return;
    }
    if (el.getAttribute("data-sd-processed-preview") === "true") {
      return;
    }
    const sourcePath = ctx.sourcePath;
    if (!sourcePath) return;
    const file = this.app.vault.getAbstractFileByPath(sourcePath);
    if (!(file instanceof import_obsidian8.TFile)) return;
    const cache = this.app.metadataCache.getFileCache(file);
    const frontmatter = cache == null ? void 0 : cache.frontmatter;
    if (!frontmatter || frontmatter.shadowdarkType !== "monster") {
      return;
    }
    const result = this.getCachedMonsterParse(file, frontmatter);
    if (!result.success || !result.data) return;
    el.setAttribute("data-sd-processed-preview", "true");
    el.innerHTML = "";
    el.classList.remove("mod-frontmatter", "mod-ui", "el-pre");
    el.classList.add("sd-monster-embed-host");
    const wrapper = document.createElement("div");
    wrapper.className = "sd-monster-embed-wrapper";
    wrapper.setAttribute("data-source-path", file.path);
    renderMonsterBlock(wrapper, result.data, this.settings, result.warnings);
    el.appendChild(wrapper);
  }
  getCachedMonsterParse(file, frontmatter) {
    const cached = this.parsedMonsterCache.get(file.path);
    if (cached && cached.mtime === file.stat.mtime) {
      return cached.result;
    }
    const result = parseFrontmatter(frontmatter);
    this.parsedMonsterCache.set(file.path, {
      mtime: file.stat.mtime,
      result
    });
    return result;
  }
  applyLastUsedSource(monster) {
    var _a, _b, _c;
    if (!((_a = this.settings.lastUsedMonsterSource) == null ? void 0 : _a.trim())) {
      return monster;
    }
    const currentSource = (_c = (_b = monster.source) == null ? void 0 : _b.trim()) != null ? _c : "";
    if (!currentSource || currentSource === "Imported from clipboard" || currentSource === "Core Rules") {
      return {
        ...monster,
        source: this.settings.lastUsedMonsterSource
      };
    }
    return monster;
  }
  countStatAnchors(text) {
    const matches = text.match(/\bAC\b[\s\S]{0,120}?\bHP\b[\s\S]{0,120}?\bATK\b/gi);
    return matches ? matches.length : 0;
  }
  async rememberLastUsedSource(source) {
    const trimmed = source.trim();
    if (!trimmed) return;
    if (this.settings.lastUsedMonsterSource === trimmed) return;
    this.settings.lastUsedMonsterSource = trimmed;
    await this.savePluginSettings();
  }
  async importMultipleFromClipboard() {
    let clipboardText = "";
    try {
      clipboardText = await navigator.clipboard.readText();
    } catch (error) {
      console.error("Clipboard read error:", error);
      new import_obsidian8.Notice("Could not read clipboard.");
      return;
    }
    const blocks = splitRawShadowdarkBlocks(clipboardText);
    if (blocks.length === 0) {
      new import_obsidian8.Notice("No monster blocks detected.");
      return;
    }
    new import_obsidian8.Notice(`Detected ${blocks.length} potential monsters...`);
    await this.runBulkImportFlow(blocks);
  }
  async runBulkImportFlow(blocks) {
    let cancelled = false;
    const importedNames = [];
    const skippedNames = [];
    const parseFailedNames = [];
    const combinedSkippedNames = [];
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const statAnchorCount = this.countStatAnchors(block);
      if (statAnchorCount > 1) {
        combinedSkippedNames.push(`Block ${i + 1}`);
        new import_obsidian8.Notice(`Skipping block ${i + 1}: looks like multiple monsters were combined.`);
        continue;
      }
      const result = parseRawShadowdarkText(block);
      if (!result.success || !result.data) {
        parseFailedNames.push(`Block ${i + 1}`);
        new import_obsidian8.Notice(`Skipping block ${i + 1}: parse failed`);
        continue;
      }
      const suggestedTags = await this.getSuggestedTags();
      const suggestedOtherSources = await this.getSuggestedOtherSources();
      const monsterWithLastSource = this.applyLastUsedSource(result.data);
      const monsterWithSmartTags = this.applySmartDefaultTags(monsterWithLastSource);
      const monsterName = monsterWithSmartTags.name || `Block ${i + 1}`;
      const action = await new Promise((resolve) => {
        let finalAction = "cancel";
        const modal = new ImportPreviewModal(this.app, {
          monster: monsterWithSmartTags,
          warnings: result.warnings,
          mode: "import",
          progressLabel: `Reviewing ${i + 1} of ${blocks.length}: ${monsterWithSmartTags.name}`,
          suggestedTags,
          suggestedOtherSources,
          onConfirm: async (monster) => {
            finalAction = "confirm";
            await this.rememberLastUsedSource(monster.source);
            await this.createImportedMonsterCopy(monster, result.warnings);
          },
          onSkip: () => {
            finalAction = "skip";
          }
        });
        const originalOnClose = modal.onClose.bind(modal);
        modal.onClose = () => {
          originalOnClose();
          resolve(finalAction);
        };
        modal.open();
      });
      if (action === "confirm") {
        importedNames.push(monsterName);
      } else if (action === "skip") {
        skippedNames.push(monsterName);
      } else if (action === "cancel") {
        cancelled = true;
        new import_obsidian8.Notice("Bulk import cancelled.");
        break;
      }
    }
    const formatList = (label, items) => {
      if (items.length === 0) return null;
      const preview = items.slice(0, 4).join(", ");
      const extra = items.length > 4 ? ` +${items.length - 4} more` : "";
      return `${label}: ${items.length} (${preview}${extra})`;
    };
    const summaryParts = [
      formatList("Imported", importedNames),
      formatList("Skipped", skippedNames),
      formatList("Parse failed", parseFailedNames),
      formatList("Combined-block skips", combinedSkippedNames)
    ].filter(Boolean);
    const summaryPrefix = cancelled ? "Bulk import stopped." : "Bulk import complete.";
    new import_obsidian8.Notice(`${summaryPrefix} ${summaryParts.join(" | ")}`, 1e4);
  }
  async onload() {
    await this.loadPluginSettings();
    this.addSettingTab(new ShadowdarkStatblocksSettingTab(this.app, this));
    this.registerMarkdownCodeBlockProcessor(
      "shadowdark-monster",
      (source, el, _ctx) => {
        const result = parseCodeBlock(source);
        if (!result.success || !result.data) {
          const errorBox = el.createDiv({ cls: "sd-monster-error-box" });
          errorBox.createDiv({
            text: "Shadowdark monster parse error",
            cls: "sd-monster-error-title"
          });
          for (const error of result.errors) {
            errorBox.createDiv({
              text: error,
              cls: "sd-monster-error"
            });
          }
          return;
        }
        renderMonsterBlock(el, result.data, this.settings, result.warnings);
      }
    );
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        void this.renderAllMonsterViews();
      })
    );
    this.registerMarkdownPostProcessor((el, ctx) => {
      this.renderMonsterInProcessedPreview(el, ctx);
    });
    this.registerEvent(
      this.app.workspace.on("file-open", () => {
        void this.ensureMonsterViewsInPreview();
        void this.renderAllMonsterViews();
      })
    );
    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        void this.renderAllMonsterViews();
      })
    );
    this.registerEvent(
      this.app.metadataCache.on("changed", () => {
        void this.renderAllMonsterViews();
      })
    );
    this.addCommand({
      id: "insert-shadowdark-monster-block",
      name: "Insert Shadowdark monster block",
      editorCallback: (editor) => {
        const template = [
          "```shadowdark-monster",
          "name: Goblin Sneak",
          "level: 1",
          "alignment: C",
          "ac: 13",
          "hp: 5",
          "mv: near",
          "atk:",
          "  - 1 Dagger +2 (1d4)",
          "str: -1",
          "dex: +2",
          "con: +0",
          "int: +0",
          "wis: -1",
          "cha: -1",
          "traits:",
          "  - Sneaky",
          "  - Dark-adapted",
          "description: A wiry goblin that stalks the edges of torchlight.",
          "source: Homebrew",
          "tags:",
          "  - shadowdark",
          "  - goblin",
          "```"
        ].join("\n");
        editor.replaceSelection(template);
      }
    });
    this.addCommand({
      id: "create-shadowdark-monster-note",
      name: "Create Shadowdark monster note",
      callback: async () => {
        await this.createMonsterNote();
      }
    });
    this.addCommand({
      id: "import-shadowdark-monster-from-clipboard",
      name: "Import Shadowdark monster from clipboard",
      callback: async () => {
        await this.importMonsterFromClipboard();
      }
    });
    this.addCommand({
      id: "import-shadowdark-monster-from-selection",
      name: "Import Shadowdark monster from selected text",
      editorCallback: async (editor) => {
        await this.importMonsterFromSelection(editor);
      }
    });
    this.addCommand({
      id: "edit-current-shadowdark-monster",
      name: "Edit current Shadowdark monster",
      callback: async () => {
        await this.editCurrentMonsterNote();
      }
    });
    this.addCommand({
      id: "import-multiple-shadowdark-monsters",
      name: "Import multiple Shadowdark monsters from clipboard",
      callback: async () => {
        await this.importMultipleFromClipboard();
      }
    });
    this.addCommand({
      id: "open-monster-browser",
      name: "Open monster browser",
      callback: () => {
        new MonsterBrowserModal(this.app, this).open();
      }
    });
    window.setTimeout(() => {
      void this.ensureMonsterViewsInPreview();
      void this.renderAllMonsterViews();
    }, 100);
  }
  onunload() {
    const leaves = this.app.workspace.getLeavesOfType("markdown");
    for (const leaf of leaves) {
      const view = leaf.view;
      if (view instanceof import_obsidian8.MarkdownView) {
        this.removeExistingFrontmatterRender(view);
        this.showProperties(view);
      }
    }
    this.parsedMonsterCache.clear();
  }
  async loadPluginSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async savePluginSettings() {
    await this.saveData(this.settings);
  }
  async refreshMonsterView() {
    await this.renderAllMonsterViews();
  }
  async createMonsterNote() {
    const folderPath = (0, import_obsidian8.normalizePath)(this.settings.monsterFolder);
    await this.ensureFolderExists(folderPath);
    const baseName = "New Monster";
    const filePath = this.getUniqueFilePath(folderPath, `${baseName}.md`);
    const content = buildMonsterTemplate(baseName);
    const file = await this.app.vault.create(filePath, content);
    await this.app.workspace.getLeaf(true).openFile(file);
    new import_obsidian8.Notice(`Created monster note: ${file.basename}`);
  }
  async importMonsterFromClipboard() {
    let clipboardText = "";
    try {
      clipboardText = await navigator.clipboard.readText();
    } catch (error) {
      console.error("Shadowdark Statblocks clipboard read error:", error);
      new import_obsidian8.Notice("Could not read clipboard.");
      return;
    }
    await this.openImportPreviewFromText(clipboardText);
  }
  getSuggestedOtherSources() {
    return getSuggestedOtherSources(this.app, this.settings.monsterFolder);
  }
  applySmartDefaultTags(monster) {
    var _a, _b, _c, _d, _e, _f;
    const existingTags = new Set(
      ((_a = monster.tags) != null ? _a : []).map((tag) => tag.trim().toLowerCase()).filter(Boolean)
    );
    const textBlob = [
      monster.name,
      monster.description,
      ...(_b = monster.traits) != null ? _b : [],
      ...(_c = monster.specials) != null ? _c : [],
      ...(_d = monster.spells) != null ? _d : []
    ].join(" ").toLowerCase();
    const mv = ((_e = monster.mv) != null ? _e : "").toLowerCase();
    const addTag = (tag) => {
      existingTags.add(tag);
    };
    const addIfMatch = (tag, patterns) => {
      if (patterns.some((pattern) => pattern.test(textBlob))) {
        addTag(tag);
      }
    };
    addIfMatch("undead", [
      /\bundead\b/,
      /\bskeleton\b/,
      /\bzombie\b/,
      /\bghoul\b/,
      /\bvampire\b/,
      /\blich\b/,
      /\bwight\b/
    ]);
    addIfMatch("dragon", [/\bdragon\b/, /\bdrake\b/, /\bwyrm\b/]);
    addIfMatch("demon", [/\bdemon\b/]);
    addIfMatch("devil", [/\bdevil\b/]);
    addIfMatch("construct", [
      /\bconstruct\b/,
      /\bgolem\b/,
      /\banimated armor\b/,
      /\bclockwork\b/
    ]);
    addIfMatch("ooze", [/\booze\b/, /\bslime\b/, /\bjelly\b/, /\bpudding\b/, /\bichor\b/]);
    addIfMatch("goblin", [/\bgoblin\b/]);
    addIfMatch("orc", [/\borc\b/]);
    addIfMatch("troll", [/\btroll\b/]);
    addIfMatch("wolf", [/\bwolf\b/]);
    addIfMatch("giant", [/\bgiant\b/]);
    if (/\bfly\b/.test(mv)) {
      addTag("flying");
    }
    if (/\bswim\b/.test(mv) || /\baquatic\b/.test(textBlob) || /\bwater\b/.test(textBlob)) {
      addTag("aquatic");
    }
    if (((_f = monster.spells) != null ? _f : []).length > 0) {
      addTag("spellcaster");
    }
    return {
      ...monster,
      tags: [...existingTags].sort((a, b) => a.localeCompare(b))
    };
  }
  async importMonsterFromSelection(editor) {
    const selectedText = editor.getSelection().trim();
    if (!selectedText) {
      new import_obsidian8.Notice("No text selected.");
      return;
    }
    await this.openImportPreviewFromText(selectedText);
  }
  async openImportPreviewFromText(sourceText) {
    const result = parseRawShadowdarkText(sourceText);
    if (!result.success || !result.data) {
      const message = result.errors.length > 0 ? result.errors[0] : "Could not parse monster text.";
      new import_obsidian8.Notice(message, 6e3);
      return;
    }
    const suggestedTags = await this.getSuggestedTags();
    const suggestedOtherSources = await this.getSuggestedOtherSources();
    const monsterWithLastSource = this.applyLastUsedSource(result.data);
    const monsterWithSmartTags = this.applySmartDefaultTags(monsterWithLastSource);
    const modal = new ImportPreviewModal(this.app, {
      monster: monsterWithSmartTags,
      warnings: result.warnings,
      mode: "import",
      suggestedTags,
      suggestedOtherSources,
      onConfirm: async (monster) => {
        await this.rememberLastUsedSource(monster.source);
        await this.createImportedMonsterNote(monster, result.warnings);
      }
    });
    modal.open();
  }
  getSuggestedTags() {
    return getSuggestedTags(this.app, this.settings.monsterFolder);
  }
  getAllMonsterIndexEntries() {
    return getAllMonsterIndexEntries(this.app, this.settings.monsterFolder);
  }
  async createImportedMonsterNote(monster, warnings) {
    const folderPath = (0, import_obsidian8.normalizePath)(this.settings.monsterFolder);
    await this.ensureFolderExists(folderPath);
    const safeName = (monster.name || "Imported Monster").trim();
    const existingMonsterFile = this.app.vault.getMarkdownFiles().find((file) => {
      const inMonsterFolder = file.path.startsWith(`${folderPath}/`) || file.path === `${folderPath}.md`;
      if (!inMonsterFolder) return false;
      return file.basename.trim().toLowerCase() === safeName.toLowerCase();
    });
    if (existingMonsterFile instanceof import_obsidian8.TFile) {
      const existingContent = await this.app.vault.read(existingMonsterFile);
      const existingFrontmatter = this.extractFrontmatter(existingContent);
      const canOverwrite = (existingFrontmatter == null ? void 0 : existingFrontmatter.shadowdarkType) === "monster";
      const modal = new DuplicateMonsterModal(this.app, {
        monsterName: safeName,
        existingFileName: existingMonsterFile.basename,
        canOverwrite,
        onOverwrite: canOverwrite ? async () => {
          await this.updateExistingMonsterNote(existingMonsterFile, monster);
          if (warnings.length > 0) {
            new import_obsidian8.Notice(
              `Updated ${existingMonsterFile.basename} with ${warnings.length} warning(s). Review the note.`,
              7e3
            );
          } else {
            new import_obsidian8.Notice(`Updated monster: ${existingMonsterFile.basename}`);
          }
        } : void 0,
        onCreateCopy: async () => {
          await this.createImportedMonsterCopy(monster, warnings);
        }
      });
      modal.open();
      return;
    }
    await this.createImportedMonsterCopy(monster, warnings);
  }
  async createImportedMonsterCopy(monster, warnings) {
    const folderPath = (0, import_obsidian8.normalizePath)(this.settings.monsterFolder);
    await this.ensureFolderExists(folderPath);
    const safeName = monster.name || "Imported Monster";
    const filePath = this.getUniqueFilePath(folderPath, `${safeName}.md`);
    const content = buildMonsterNoteContent(monster);
    const file = await this.app.vault.create(filePath, content);
    await this.app.workspace.getLeaf(true).openFile(file);
    if (warnings.length > 0) {
      new import_obsidian8.Notice(
        `Imported ${file.basename} with ${warnings.length} warning(s). Review the note.`,
        7e3
      );
    } else {
      new import_obsidian8.Notice(`Imported monster: ${file.basename}`);
    }
  }
  async editCurrentMonsterNote() {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian8.MarkdownView);
    if (!view) {
      new import_obsidian8.Notice("No active markdown note.");
      return;
    }
    const file = view.file;
    if (!(file instanceof import_obsidian8.TFile)) {
      new import_obsidian8.Notice("No active file to edit.");
      return;
    }
    const content = await this.app.vault.read(file);
    const parsedFrontmatter = this.extractFrontmatter(content);
    if (!parsedFrontmatter || parsedFrontmatter.shadowdarkType !== "monster") {
      new import_obsidian8.Notice("Current note is not a Shadowdark monster.");
      return;
    }
    const result = this.getCachedMonsterParse(file, parsedFrontmatter);
    if (!result.success || !result.data) {
      new import_obsidian8.Notice("Could not parse current monster note.");
      return;
    }
    const suggestedTags = await this.getSuggestedTags();
    const suggestedOtherSources = await this.getSuggestedOtherSources();
    const modal = new ImportPreviewModal(this.app, {
      monster: result.data,
      warnings: [],
      mode: "edit",
      suggestedTags,
      suggestedOtherSources,
      onConfirm: async (monster) => {
        await this.rememberLastUsedSource(monster.source);
        await this.updateExistingMonsterNote(file, monster);
      }
    });
    modal.open();
  }
  async updateExistingMonsterNote(file, monster) {
    const existingContent = await this.app.vault.read(file);
    const body = this.extractBodyAfterFrontmatter(existingContent);
    const updatedContent = buildMonsterNoteContent(monster, body);
    await this.app.vault.modify(file, updatedContent);
    this.parsedMonsterCache.delete(file.path);
    await this.forceReloadOpenMarkdownFile(file);
    await this.refreshMonsterView();
    new import_obsidian8.Notice(`Updated monster: ${file.basename}`);
  }
  extractBodyAfterFrontmatter(content) {
    var _a;
    const match = content.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)$/);
    return (_a = match == null ? void 0 : match[1]) != null ? _a : "";
  }
  async ensureFolderExists(folderPath) {
    const parts = folderPath.split("/").filter(Boolean);
    let currentPath = "";
    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const existing = this.app.vault.getAbstractFileByPath(currentPath);
      if (!existing) {
        await this.app.vault.createFolder(currentPath);
      }
    }
  }
  getUniqueFilePath(folderPath, fileName) {
    const dotIndex = fileName.lastIndexOf(".");
    const base = dotIndex >= 0 ? fileName.slice(0, dotIndex) : fileName;
    const ext = dotIndex >= 0 ? fileName.slice(dotIndex) : "";
    let candidate = `${folderPath}/${base}${ext}`;
    let counter = 2;
    while (this.app.vault.getAbstractFileByPath(candidate)) {
      candidate = `${folderPath}/${base} ${counter}${ext}`;
      counter++;
    }
    return candidate;
  }
  async renderAllMonsterViews() {
    const myGeneration = ++this.renderGeneration;
    const leaves = this.app.workspace.getLeavesOfType("markdown");
    const views = leaves.map((leaf) => leaf.view).filter((view) => view instanceof import_obsidian8.MarkdownView);
    for (const view of views) {
      await this.renderMonsterView(view, myGeneration);
    }
  }
  async renderMonsterView(view, generation) {
    this.removeExistingFrontmatterRender(view);
    this.showProperties(view);
    if (!this.settings.renderFrontmatterMonsters) return;
    if (view.getMode() !== "preview") return;
    const file = view.file;
    if (!(file instanceof import_obsidian8.TFile)) return;
    const content = await this.app.vault.read(file);
    if (generation !== this.renderGeneration) return;
    const parsedFrontmatter = this.extractFrontmatter(content);
    if (!parsedFrontmatter) return;
    if (parsedFrontmatter.shadowdarkType !== "monster") return;
    if (this.settings.hideMonsterProperties) {
      this.hideProperties(view);
    }
  }
  async ensureMonsterViewInPreview(view) {
    const file = view.file;
    if (!(file instanceof import_obsidian8.TFile)) return;
    const content = await this.app.vault.read(file);
    const parsedFrontmatter = this.extractFrontmatter(content);
    if (!parsedFrontmatter || parsedFrontmatter.shadowdarkType !== "monster") {
      return;
    }
    const alreadyAutoPreviewedForThisFile = this.autoPreviewedLeafFiles.get(view) === file.path;
    if (alreadyAutoPreviewedForThisFile) {
      return;
    }
    if (view.getMode() === "preview") {
      this.autoPreviewedLeafFiles.set(view, file.path);
      return;
    }
    window.setTimeout(() => {
      try {
        const leaf = this.app.workspace.getLeavesOfType("markdown").find((l) => l.view === view);
        if (!leaf) return;
        const state = view.getState();
        void leaf.setViewState({
          type: "markdown",
          state: {
            ...state,
            mode: "preview",
            file: file.path
          }
        });
        this.autoPreviewedLeafFiles.set(view, file.path);
      } catch (err) {
        console.error("Failed to switch to preview mode:", err);
      }
    }, 50);
  }
  async ensureMonsterViewsInPreview() {
    const leaves = this.app.workspace.getLeavesOfType("markdown");
    const views = leaves.map((leaf) => leaf.view).filter((view) => view instanceof import_obsidian8.MarkdownView);
    for (const view of views) {
      await this.ensureMonsterViewInPreview(view);
    }
  }
  async forceReloadOpenMarkdownFile(file) {
    var _a;
    const leaves = this.app.workspace.getLeavesOfType("markdown");
    for (const leaf of leaves) {
      const view = leaf.view;
      if (!(view instanceof import_obsidian8.MarkdownView)) {
        continue;
      }
      if (((_a = view.file) == null ? void 0 : _a.path) !== file.path) {
        continue;
      }
      const state = view.getState();
      await leaf.setViewState({
        type: "markdown",
        state: {
          ...state,
          file: file.path,
          mode: view.getMode()
        }
      });
    }
  }
  hideProperties(view) {
    const propertiesEl = view.containerEl.querySelector(".metadata-container");
    if (propertiesEl instanceof HTMLElement) {
      propertiesEl.classList.add("sd-monster-hide-properties");
    }
  }
  showProperties(view) {
    const hiddenProperties = view.containerEl.querySelectorAll(".sd-monster-hide-properties");
    hiddenProperties.forEach((el) => {
      el.classList.remove("sd-monster-hide-properties");
    });
  }
  removeExistingFrontmatterRender(view) {
    const existing = view.containerEl.querySelectorAll(".sd-monster-frontmatter-wrapper");
    existing.forEach((el) => {
      el.remove();
    });
  }
  extractFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return null;
    try {
      const parsed = (0, import_obsidian8.parseYaml)(match[1]);
      if (!parsed || typeof parsed !== "object") return null;
      return parsed;
    } catch (error) {
      console.error("Shadowdark Statblocks frontmatter parse error:", error);
      return null;
    }
  }
};
