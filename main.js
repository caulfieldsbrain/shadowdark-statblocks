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
async function getAllMonsterIndexEntries(app, monsterFolder) {
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
      level: frontmatter.level != null ? String(frontmatter.level) : "",
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
  if (value === null || value === void 0) return fallback;
  return String(value).trim();
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
    containerEl.createEl("h2", { text: "Shadowdark Statblocks Settings" });
    containerEl.createEl("h3", { text: "Display" });
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
    new import_obsidian3.Setting(containerEl).setName("Render frontmatter monsters").setDesc("Render statblocks from monster note frontmatter in Reading view.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.renderFrontmatterMonsters).onChange(async (value) => {
        this.plugin.settings.renderFrontmatterMonsters = value;
        await this.plugin.savePluginSettings();
        void this.plugin.refreshMonsterView();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Hide monster properties").setDesc("Hide Obsidian's native Properties section in Reading view for monster notes.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.hideMonsterProperties).onChange(async (value) => {
        this.plugin.settings.hideMonsterProperties = value;
        await this.plugin.savePluginSettings();
        void this.plugin.refreshMonsterView();
      })
    );
    containerEl.createEl("h3", { text: "Files" });
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
  var _a;
  evt.preventDefault();
  evt.stopPropagation();
  (_a = evt.stopImmediatePropagation) == null ? void 0 : _a.call(evt);
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
      this.mode === "edit" ? "Edit Shadowdark Monster" : "Import Shadowdark Monster"
    );
    contentEl.empty();
    contentEl.addClass("sd-import-preview-modal");
    this.modalEl.addClass("sd-import-preview-modal-shell");
    this.modalEl.style.width = "min(1280px, 94vw)";
    this.modalEl.style.maxWidth = "94vw";
    this.modalEl.style.height = "min(90vh, 920px)";
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
    previewHeading.textContent = "Live Preview";
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
      (button) => button.setButtonText("Fix Common Issues").setTooltip(
        "Cleans formatting: fixes spacing, dice typos (1dd8 \u2192 1d8), capitalizes names/descriptions, and normalizes traits, spells, and attacks."
      ).onClick(() => {
        this.fixCommonIssues();
      })
    ).addButton(
      (button) => button.setButtonText(this.mode === "edit" ? "Update Note" : "Create Note").setCta().onClick(async () => {
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
    this.modalEl.style.width = "";
    this.modalEl.style.maxWidth = "";
    this.modalEl.style.height = "";
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
    titleEl.setText("Duplicate Monster Note");
    contentEl.empty();
    const message = document.createElement("p");
    message.textContent = this.canOverwrite ? `A Shadowdark monster note named "${this.existingFileName}" already exists.` : `A file named "${this.existingFileName}" already exists, but it is not a Shadowdark monster note.`;
    contentEl.appendChild(message);
    const subMessage = document.createElement("p");
    subMessage.textContent = this.canOverwrite ? "Choose whether to update the existing note, create a copy, or cancel." : "To avoid overwriting a non-monster note, you can create a copy or cancel.";
    contentEl.appendChild(subMessage);
    new import_obsidian5.Setting(contentEl).addButton((button) => {
      if (this.canOverwrite && this.onOverwriteCallback) {
        button.setButtonText("Update Existing Note").setCta().onClick(async () => {
          var _a;
          await ((_a = this.onOverwriteCallback) == null ? void 0 : _a.call(this));
          this.close();
        });
      }
    }).addButton(
      (button) => button.setButtonText("Create Copy").onClick(async () => {
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
  return word.replace(/[,'’\-]/g, "");
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
    /([.!?])\s+([A-Z][A-Z0-9,'’\-]*(?:\s+[A-Z][A-Z0-9,'’\-]*){0,3})\s+([A-Z][a-z][^\r\n]*)/g,
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
    /([a-z0-9)\]])\s+([A-Z][A-Z0-9,'’\-]*(?:\s+[A-Z][A-Z0-9,'’\-]+){1,3})\s+([a-z][^.\r\n]{0,30}[.)]?)/g,
    (match, prefixEnd, maybeName, suffix) => {
      if (!looksLikeMonsterNameInline(maybeName, 2)) {
        return match;
      }
      return `${prefixEnd} ${suffix}
${maybeName}`;
    }
  );
  text = text.replace(
    /([.!?])\s+([A-Z][A-Z0-9,'’\-]*(?:\s+[A-Z][A-Z0-9,'’\-]*){0,3})$/gm,
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
    return /^[A-Z][A-Za-z0-9'’\- ]{0,40}\./.test(line);
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
    titleEl.setText("Monster Browser");
    contentEl.empty();
    contentEl.addClass("sd-monster-browser-modal");
    contentEl.style.minHeight = "0";
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
      text: "Clear Filters"
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
  async renderMonsterInProcessedPreview(el, ctx) {
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
    let importedCount = 0;
    let skippedCount = 0;
    let parseFailedCount = 0;
    let combinedBlockSkippedCount = 0;
    let cancelled = false;
    const importedNames = [];
    const skippedNames = [];
    const parseFailedNames = [];
    const combinedSkippedNames = [];
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const statAnchorCount = this.countStatAnchors(block);
      if (statAnchorCount > 1) {
        combinedBlockSkippedCount++;
        combinedSkippedNames.push(`Block ${i + 1}`);
        new import_obsidian8.Notice(`Skipping block ${i + 1}: looks like multiple monsters were combined.`);
        continue;
      }
      const result = parseRawShadowdarkText(block);
      if (!result.success || !result.data) {
        parseFailedCount++;
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
        importedCount++;
        importedNames.push(monsterName);
      } else if (action === "skip") {
        skippedCount++;
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
    if (parseFailedCount > 0) {
      summaryParts.push(`Parse failed: ${parseFailedCount}`);
    }
    if (combinedBlockSkippedCount > 0) {
      summaryParts.push(`Combined-block skips: ${combinedBlockSkippedCount}`);
    }
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
      void this.renderMonsterInProcessedPreview(el, ctx);
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
      name: "Open Monster Browser",
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
    const filePath = await this.getUniqueFilePath(folderPath, `${baseName}.md`);
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
  async getSuggestedOtherSources() {
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
    addIfMatch("undead", [/\bundead\b/, /\bskeleton\b/, /\bzombie\b/, /\bghoul\b/, /\bvampire\b/, /\blich\b/, /\bwight\b/]);
    addIfMatch("dragon", [/\bdragon\b/, /\bdrake\b/, /\bwyrm\b/]);
    addIfMatch("demon", [/\bdemon\b/]);
    addIfMatch("devil", [/\bdevil\b/]);
    addIfMatch("construct", [/\bconstruct\b/, /\bgolem\b/, /\banimated armor\b/, /\bclockwork\b/]);
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
  async getSuggestedTags() {
    return getSuggestedTags(this.app, this.settings.monsterFolder);
  }
  async getAllMonsterIndexEntries() {
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
    const filePath = await this.getUniqueFilePath(folderPath, `${safeName}.md`);
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
    new import_obsidian8.Notice(`Updated monster: ${file.basename}`);
    await this.refreshMonsterView();
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
  async getUniqueFilePath(folderPath, fileName) {
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
        void leaf.setViewState({
          type: "markdown",
          state: {
            ...view.getState(),
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
  hideProperties(view) {
    const propertiesEl = view.containerEl.querySelector(".metadata-container");
    if (propertiesEl instanceof HTMLElement) {
      propertiesEl.classList.add("sd-monster-hide-properties");
    }
  }
  showProperties(view) {
    const hiddenProperties = view.containerEl.querySelectorAll(".sd-monster-hide-properties");
    for (const el of hiddenProperties) {
      el.classList.remove("sd-monster-hide-properties");
    }
  }
  removeExistingFrontmatterRender(view) {
    const existing = view.containerEl.querySelectorAll(".sd-monster-frontmatter-wrapper");
    for (const el of existing) {
      el.remove();
    }
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
  escapeAttribute(value) {
    return value.replace(/"/g, "&quot;");
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL3NlcnZpY2VzL21vbnN0ZXJJbmRleFNlcnZpY2UudHMiLCAic3JjL3NldHRpbmdzLnRzIiwgInNyYy9wYXJzaW5nL3BhcnNlQ29kZUJsb2NrLnRzIiwgInNyYy9wYXJzaW5nL25vcm1hbGl6ZU1vbnN0ZXIudHMiLCAic3JjL3BhcnNpbmcvcGFyc2VGcm9udG1hdHRlci50cyIsICJzcmMvcGFyc2luZy9wYXJzZVJhd1NoYWRvd2RhcmtUZXh0LnRzIiwgInNyYy9yZW5kZXIvcmVuZGVyTW9uc3RlckJsb2NrLnRzIiwgInNyYy90ZW1wbGF0ZXMvbW9uc3RlclRlbXBsYXRlLnRzIiwgInNyYy91dGlscy9tb25zdGVyTm90ZUNvbnRlbnQudHMiLCAic3JjL3NldHRpbmdzVGFiLnRzIiwgInNyYy9tb2RhbHMvSW1wb3J0UHJldmlld01vZGFsLnRzIiwgInNyYy91dGlscy9maXhNb25zdGVyQ29tbW9uSXNzdWVzLnRzIiwgInNyYy9tb2RhbHMvRHVwbGljYXRlTW9uc3Rlck1vZGFsLnRzIiwgInNyYy91dGlscy9zcGxpdFJhd1NoYWRvd2RhcmtCbG9ja3MudHMiLCAic3JjL21vZGFscy9Nb25zdGVyQnJvd3Nlck1vZGFsLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQge1xuICBFZGl0b3IsXG4gIE1hcmtkb3duUG9zdFByb2Nlc3NvckNvbnRleHQsXG4gIE1hcmtkb3duVmlldyxcbiAgTm90aWNlLFxuICBQbHVnaW4sXG4gIFRGaWxlLFxuICBub3JtYWxpemVQYXRoLFxuICBwYXJzZVlhbWxcbn0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQge1xuICBnZXRBbGxNb25zdGVySW5kZXhFbnRyaWVzLFxuICBnZXRTdWdnZXN0ZWRPdGhlclNvdXJjZXMsXG4gIGdldFN1Z2dlc3RlZFRhZ3Ncbn0gZnJvbSBcIi4vc2VydmljZXMvbW9uc3RlckluZGV4U2VydmljZVwiO1xuaW1wb3J0IHsgREVGQVVMVF9TRVRUSU5HUywgU2hhZG93ZGFya1N0YXRibG9ja3NTZXR0aW5ncyB9IGZyb20gXCIuL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBwYXJzZUNvZGVCbG9jayB9IGZyb20gXCIuL3BhcnNpbmcvcGFyc2VDb2RlQmxvY2tcIjtcbmltcG9ydCB7IHBhcnNlRnJvbnRtYXR0ZXIgfSBmcm9tIFwiLi9wYXJzaW5nL3BhcnNlRnJvbnRtYXR0ZXJcIjtcbmltcG9ydCB7IHBhcnNlUmF3U2hhZG93ZGFya1RleHQgfSBmcm9tIFwiLi9wYXJzaW5nL3BhcnNlUmF3U2hhZG93ZGFya1RleHRcIjtcbmltcG9ydCB7IHJlbmRlck1vbnN0ZXJCbG9jayB9IGZyb20gXCIuL3JlbmRlci9yZW5kZXJNb25zdGVyQmxvY2tcIjtcbmltcG9ydCB7IGJ1aWxkTW9uc3RlclRlbXBsYXRlIH0gZnJvbSBcIi4vdGVtcGxhdGVzL21vbnN0ZXJUZW1wbGF0ZVwiO1xuaW1wb3J0IHsgYnVpbGRNb25zdGVyRnJvbnRtYXR0ZXIsIGJ1aWxkTW9uc3Rlck5vdGVDb250ZW50IH0gZnJvbSBcIi4vdXRpbHMvbW9uc3Rlck5vdGVDb250ZW50XCI7XG5pbXBvcnQgeyBTaGFkb3dkYXJrU3RhdGJsb2Nrc1NldHRpbmdUYWIgfSBmcm9tIFwiLi9zZXR0aW5nc1RhYlwiO1xuaW1wb3J0IHsgSW1wb3J0UHJldmlld01vZGFsIH0gZnJvbSBcIi4vbW9kYWxzL0ltcG9ydFByZXZpZXdNb2RhbFwiO1xuaW1wb3J0IHsgRHVwbGljYXRlTW9uc3Rlck1vZGFsIH0gZnJvbSBcIi4vbW9kYWxzL0R1cGxpY2F0ZU1vbnN0ZXJNb2RhbFwiO1xuaW1wb3J0IHsgU2hhZG93ZGFya01vbnN0ZXIgfSBmcm9tIFwiLi90eXBlc1wiO1xuaW1wb3J0IHsgc3BsaXRSYXdTaGFkb3dkYXJrQmxvY2tzIH0gZnJvbSBcIi4vdXRpbHMvc3BsaXRSYXdTaGFkb3dkYXJrQmxvY2tzXCI7XG5pbXBvcnQgeyBNb25zdGVyQnJvd3Nlck1vZGFsIH0gZnJvbSBcIi4vbW9kYWxzL01vbnN0ZXJCcm93c2VyTW9kYWxcIjtcblxudHlwZSBDYWNoZWRNb25zdGVyRnJvbnRtYXR0ZXJQYXJzZSA9IHtcbiAgbXRpbWU6IG51bWJlcjtcbiAgcmVzdWx0OiBSZXR1cm5UeXBlPHR5cGVvZiBwYXJzZUZyb250bWF0dGVyPjtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNoYWRvd2RhcmtTdGF0YmxvY2tzUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcbiAgc2V0dGluZ3MhOiBTaGFkb3dkYXJrU3RhdGJsb2Nrc1NldHRpbmdzO1xuICBwcml2YXRlIHJlbmRlckdlbmVyYXRpb24gPSAwO1xuICBwcml2YXRlIGF1dG9QcmV2aWV3ZWRMZWFmRmlsZXMgPSBuZXcgV2Vha01hcDxNYXJrZG93blZpZXcsIHN0cmluZz4oKTtcbiAgcHJpdmF0ZSBwYXJzZWRNb25zdGVyQ2FjaGUgPSBuZXcgTWFwPHN0cmluZywgQ2FjaGVkTW9uc3RlckZyb250bWF0dGVyUGFyc2U+KCk7XG4gIHByaXZhdGUgYXN5bmMgcmVuZGVyTW9uc3RlckluUHJvY2Vzc2VkUHJldmlldyhcbiAgICBlbDogSFRNTEVsZW1lbnQsXG4gICAgY3R4OiBNYXJrZG93blBvc3RQcm9jZXNzb3JDb250ZXh0XG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5zZXR0aW5ncy5yZW5kZXJGcm9udG1hdHRlck1vbnN0ZXJzKSByZXR1cm47XG5cbiAgICBpZiAoIWVsLmNsYXNzTGlzdC5jb250YWlucyhcIm1vZC1mcm9udG1hdHRlclwiKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChlbC5nZXRBdHRyaWJ1dGUoXCJkYXRhLXNkLXByb2Nlc3NlZC1wcmV2aWV3XCIpID09PSBcInRydWVcIikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHNvdXJjZVBhdGggPSBjdHguc291cmNlUGF0aDtcbiAgICBpZiAoIXNvdXJjZVBhdGgpIHJldHVybjtcblxuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoc291cmNlUGF0aCk7XG4gICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkgcmV0dXJuO1xuXG4gICAgY29uc3QgY2FjaGUgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmaWxlKTtcbiAgICBjb25zdCBmcm9udG1hdHRlciA9IGNhY2hlPy5mcm9udG1hdHRlciBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHVuZGVmaW5lZDtcblxuICAgIGlmICghZnJvbnRtYXR0ZXIgfHwgZnJvbnRtYXR0ZXIuc2hhZG93ZGFya1R5cGUgIT09IFwibW9uc3RlclwiKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0ID0gdGhpcy5nZXRDYWNoZWRNb25zdGVyUGFyc2UoZmlsZSwgZnJvbnRtYXR0ZXIpO1xuICAgIGlmICghcmVzdWx0LnN1Y2Nlc3MgfHwgIXJlc3VsdC5kYXRhKSByZXR1cm47XG5cbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJkYXRhLXNkLXByb2Nlc3NlZC1wcmV2aWV3XCIsIFwidHJ1ZVwiKTtcbiAgICBlbC5pbm5lckhUTUwgPSBcIlwiO1xuICAgIGVsLmNsYXNzTGlzdC5yZW1vdmUoXCJtb2QtZnJvbnRtYXR0ZXJcIiwgXCJtb2QtdWlcIiwgXCJlbC1wcmVcIik7XG4gICAgZWwuY2xhc3NMaXN0LmFkZChcInNkLW1vbnN0ZXItZW1iZWQtaG9zdFwiKTtcblxuICAgIGNvbnN0IHdyYXBwZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIHdyYXBwZXIuY2xhc3NOYW1lID0gXCJzZC1tb25zdGVyLWVtYmVkLXdyYXBwZXJcIjtcbiAgICB3cmFwcGVyLnNldEF0dHJpYnV0ZShcImRhdGEtc291cmNlLXBhdGhcIiwgZmlsZS5wYXRoKTtcblxuICAgIHJlbmRlck1vbnN0ZXJCbG9jayh3cmFwcGVyLCByZXN1bHQuZGF0YSwgdGhpcy5zZXR0aW5ncywgcmVzdWx0Lndhcm5pbmdzKTtcbiAgICBlbC5hcHBlbmRDaGlsZCh3cmFwcGVyKTtcbiAgfVxuICBwcml2YXRlIGdldENhY2hlZE1vbnN0ZXJQYXJzZShcbiAgICBmaWxlOiBURmlsZSxcbiAgICBmcm9udG1hdHRlcjogUmVjb3JkPHN0cmluZywgdW5rbm93bj5cbiAgKTogUmV0dXJuVHlwZTx0eXBlb2YgcGFyc2VGcm9udG1hdHRlcj4ge1xuICAgIGNvbnN0IGNhY2hlZCA9IHRoaXMucGFyc2VkTW9uc3RlckNhY2hlLmdldChmaWxlLnBhdGgpO1xuXG4gICAgaWYgKGNhY2hlZCAmJiBjYWNoZWQubXRpbWUgPT09IGZpbGUuc3RhdC5tdGltZSkge1xuICAgICAgcmV0dXJuIGNhY2hlZC5yZXN1bHQ7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0ID0gcGFyc2VGcm9udG1hdHRlcihmcm9udG1hdHRlcik7XG4gICAgdGhpcy5wYXJzZWRNb25zdGVyQ2FjaGUuc2V0KGZpbGUucGF0aCwge1xuICAgICAgbXRpbWU6IGZpbGUuc3RhdC5tdGltZSxcbiAgICAgIHJlc3VsdFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBwcml2YXRlIGFwcGx5TGFzdFVzZWRTb3VyY2UobW9uc3RlcjogU2hhZG93ZGFya01vbnN0ZXIpOiBTaGFkb3dkYXJrTW9uc3RlciB7XG4gICAgaWYgKCF0aGlzLnNldHRpbmdzLmxhc3RVc2VkTW9uc3RlclNvdXJjZT8udHJpbSgpKSB7XG4gICAgICByZXR1cm4gbW9uc3RlcjtcbiAgICB9XG5cbiAgICBjb25zdCBjdXJyZW50U291cmNlID0gbW9uc3Rlci5zb3VyY2U/LnRyaW0oKSA/PyBcIlwiO1xuXG4gICAgLy8gT25seSBvdmVycmlkZSBwbGFjZWhvbGRlci9kZWZhdWx0IGltcG9ydCB2YWx1ZXMuXG4gICAgaWYgKFxuICAgICAgIWN1cnJlbnRTb3VyY2UgfHxcbiAgICAgIGN1cnJlbnRTb3VyY2UgPT09IFwiSW1wb3J0ZWQgZnJvbSBjbGlwYm9hcmRcIiB8fFxuICAgICAgY3VycmVudFNvdXJjZSA9PT0gXCJDb3JlIFJ1bGVzXCJcbiAgICApIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIC4uLm1vbnN0ZXIsXG4gICAgICAgIHNvdXJjZTogdGhpcy5zZXR0aW5ncy5sYXN0VXNlZE1vbnN0ZXJTb3VyY2VcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIG1vbnN0ZXI7XG4gIH1cbiAgcHJpdmF0ZSBjb3VudFN0YXRBbmNob3JzKHRleHQ6IHN0cmluZyk6IG51bWJlciB7XG4gICAgY29uc3QgbWF0Y2hlcyA9IHRleHQubWF0Y2goL1xcYkFDXFxiW1xcc1xcU117MCwxMjB9P1xcYkhQXFxiW1xcc1xcU117MCwxMjB9P1xcYkFUS1xcYi9naSk7XG4gICAgcmV0dXJuIG1hdGNoZXMgPyBtYXRjaGVzLmxlbmd0aCA6IDA7XG4gIH1cbiAgcHJpdmF0ZSBhc3luYyByZW1lbWJlckxhc3RVc2VkU291cmNlKHNvdXJjZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgdHJpbW1lZCA9IHNvdXJjZS50cmltKCk7XG4gICAgaWYgKCF0cmltbWVkKSByZXR1cm47XG5cbiAgICBpZiAodGhpcy5zZXR0aW5ncy5sYXN0VXNlZE1vbnN0ZXJTb3VyY2UgPT09IHRyaW1tZWQpIHJldHVybjtcblxuICAgIHRoaXMuc2V0dGluZ3MubGFzdFVzZWRNb25zdGVyU291cmNlID0gdHJpbW1lZDtcbiAgICBhd2FpdCB0aGlzLnNhdmVQbHVnaW5TZXR0aW5ncygpO1xuICB9XG4gIHByaXZhdGUgYXN5bmMgaW1wb3J0TXVsdGlwbGVGcm9tQ2xpcGJvYXJkKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGxldCBjbGlwYm9hcmRUZXh0ID0gXCJcIjtcblxuICAgIHRyeSB7XG4gICAgICBjbGlwYm9hcmRUZXh0ID0gYXdhaXQgbmF2aWdhdG9yLmNsaXBib2FyZC5yZWFkVGV4dCgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiQ2xpcGJvYXJkIHJlYWQgZXJyb3I6XCIsIGVycm9yKTtcbiAgICAgIG5ldyBOb3RpY2UoXCJDb3VsZCBub3QgcmVhZCBjbGlwYm9hcmQuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGJsb2NrcyA9IHNwbGl0UmF3U2hhZG93ZGFya0Jsb2NrcyhjbGlwYm9hcmRUZXh0KTtcblxuICAgIGlmIChibG9ja3MubGVuZ3RoID09PSAwKSB7XG4gICAgICBuZXcgTm90aWNlKFwiTm8gbW9uc3RlciBibG9ja3MgZGV0ZWN0ZWQuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIG5ldyBOb3RpY2UoYERldGVjdGVkICR7YmxvY2tzLmxlbmd0aH0gcG90ZW50aWFsIG1vbnN0ZXJzLi4uYCk7XG5cbiAgICBhd2FpdCB0aGlzLnJ1bkJ1bGtJbXBvcnRGbG93KGJsb2Nrcyk7XG4gIH1cbiAgcHJpdmF0ZSBhc3luYyBydW5CdWxrSW1wb3J0RmxvdyhibG9ja3M6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgbGV0IGltcG9ydGVkQ291bnQgPSAwO1xuICAgIGxldCBza2lwcGVkQ291bnQgPSAwO1xuICAgIGxldCBwYXJzZUZhaWxlZENvdW50ID0gMDtcbiAgICBsZXQgY29tYmluZWRCbG9ja1NraXBwZWRDb3VudCA9IDA7XG4gICAgbGV0IGNhbmNlbGxlZCA9IGZhbHNlO1xuXG4gICAgY29uc3QgaW1wb3J0ZWROYW1lczogc3RyaW5nW10gPSBbXTtcbiAgICBjb25zdCBza2lwcGVkTmFtZXM6IHN0cmluZ1tdID0gW107XG4gICAgY29uc3QgcGFyc2VGYWlsZWROYW1lczogc3RyaW5nW10gPSBbXTtcbiAgICBjb25zdCBjb21iaW5lZFNraXBwZWROYW1lczogc3RyaW5nW10gPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYmxvY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBibG9jayA9IGJsb2Nrc1tpXTtcblxuICAgICAgY29uc3Qgc3RhdEFuY2hvckNvdW50ID0gdGhpcy5jb3VudFN0YXRBbmNob3JzKGJsb2NrKTtcbiAgICAgIGlmIChzdGF0QW5jaG9yQ291bnQgPiAxKSB7XG4gICAgICAgIGNvbWJpbmVkQmxvY2tTa2lwcGVkQ291bnQrKztcbiAgICAgICAgY29tYmluZWRTa2lwcGVkTmFtZXMucHVzaChgQmxvY2sgJHtpICsgMX1gKTtcbiAgICAgICAgbmV3IE5vdGljZShgU2tpcHBpbmcgYmxvY2sgJHtpICsgMX06IGxvb2tzIGxpa2UgbXVsdGlwbGUgbW9uc3RlcnMgd2VyZSBjb21iaW5lZC5gKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IHBhcnNlUmF3U2hhZG93ZGFya1RleHQoYmxvY2spO1xuXG4gICAgICBpZiAoIXJlc3VsdC5zdWNjZXNzIHx8ICFyZXN1bHQuZGF0YSkge1xuICAgICAgICBwYXJzZUZhaWxlZENvdW50Kys7XG4gICAgICAgIHBhcnNlRmFpbGVkTmFtZXMucHVzaChgQmxvY2sgJHtpICsgMX1gKTtcbiAgICAgICAgbmV3IE5vdGljZShgU2tpcHBpbmcgYmxvY2sgJHtpICsgMX06IHBhcnNlIGZhaWxlZGApO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc3VnZ2VzdGVkVGFncyA9IGF3YWl0IHRoaXMuZ2V0U3VnZ2VzdGVkVGFncygpO1xuICAgICAgY29uc3Qgc3VnZ2VzdGVkT3RoZXJTb3VyY2VzID0gYXdhaXQgdGhpcy5nZXRTdWdnZXN0ZWRPdGhlclNvdXJjZXMoKTtcblxuICAgICAgY29uc3QgbW9uc3RlcldpdGhMYXN0U291cmNlID0gdGhpcy5hcHBseUxhc3RVc2VkU291cmNlKHJlc3VsdC5kYXRhKTtcbiAgICAgIGNvbnN0IG1vbnN0ZXJXaXRoU21hcnRUYWdzID0gdGhpcy5hcHBseVNtYXJ0RGVmYXVsdFRhZ3MobW9uc3RlcldpdGhMYXN0U291cmNlKTtcbiAgICAgIGNvbnN0IG1vbnN0ZXJOYW1lID0gbW9uc3RlcldpdGhTbWFydFRhZ3MubmFtZSB8fCBgQmxvY2sgJHtpICsgMX1gO1xuXG4gICAgICBjb25zdCBhY3Rpb24gPSBhd2FpdCBuZXcgUHJvbWlzZTxcImNvbmZpcm1cIiB8IFwic2tpcFwiIHwgXCJjYW5jZWxcIj4oKHJlc29sdmUpID0+IHtcbiAgICAgICAgbGV0IGZpbmFsQWN0aW9uOiBcImNvbmZpcm1cIiB8IFwic2tpcFwiIHwgXCJjYW5jZWxcIiA9IFwiY2FuY2VsXCI7XG5cbiAgICAgICAgY29uc3QgbW9kYWwgPSBuZXcgSW1wb3J0UHJldmlld01vZGFsKHRoaXMuYXBwLCB7XG4gICAgICAgICAgbW9uc3RlcjogbW9uc3RlcldpdGhTbWFydFRhZ3MsXG4gICAgICAgICAgd2FybmluZ3M6IHJlc3VsdC53YXJuaW5ncyxcbiAgICAgICAgICBtb2RlOiBcImltcG9ydFwiLFxuICAgICAgICAgIHByb2dyZXNzTGFiZWw6IGBSZXZpZXdpbmcgJHtpICsgMX0gb2YgJHtibG9ja3MubGVuZ3RofTogJHttb25zdGVyV2l0aFNtYXJ0VGFncy5uYW1lfWAsXG4gICAgICAgICAgc3VnZ2VzdGVkVGFncyxcbiAgICAgICAgICBzdWdnZXN0ZWRPdGhlclNvdXJjZXMsXG4gICAgICAgICAgb25Db25maXJtOiBhc3luYyAobW9uc3RlcikgPT4ge1xuICAgICAgICAgICAgZmluYWxBY3Rpb24gPSBcImNvbmZpcm1cIjtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucmVtZW1iZXJMYXN0VXNlZFNvdXJjZShtb25zdGVyLnNvdXJjZSk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNyZWF0ZUltcG9ydGVkTW9uc3RlckNvcHkobW9uc3RlciwgcmVzdWx0Lndhcm5pbmdzKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uU2tpcDogKCkgPT4ge1xuICAgICAgICAgICAgZmluYWxBY3Rpb24gPSBcInNraXBcIjtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IG9yaWdpbmFsT25DbG9zZSA9IG1vZGFsLm9uQ2xvc2UuYmluZChtb2RhbCk7XG4gICAgICAgIG1vZGFsLm9uQ2xvc2UgPSAoKSA9PiB7XG4gICAgICAgICAgb3JpZ2luYWxPbkNsb3NlKCk7XG4gICAgICAgICAgcmVzb2x2ZShmaW5hbEFjdGlvbik7XG4gICAgICAgIH07XG5cbiAgICAgICAgbW9kYWwub3BlbigpO1xuICAgICAgfSk7XG5cbiAgICAgIGlmIChhY3Rpb24gPT09IFwiY29uZmlybVwiKSB7XG4gICAgICAgIGltcG9ydGVkQ291bnQrKztcbiAgICAgICAgaW1wb3J0ZWROYW1lcy5wdXNoKG1vbnN0ZXJOYW1lKTtcbiAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSBcInNraXBcIikge1xuICAgICAgICBza2lwcGVkQ291bnQrKztcbiAgICAgICAgc2tpcHBlZE5hbWVzLnB1c2gobW9uc3Rlck5hbWUpO1xuICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFwiY2FuY2VsXCIpIHtcbiAgICAgICAgY2FuY2VsbGVkID0gdHJ1ZTtcbiAgICAgICAgbmV3IE5vdGljZShcIkJ1bGsgaW1wb3J0IGNhbmNlbGxlZC5cIik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGZvcm1hdExpc3QgPSAobGFiZWw6IHN0cmluZywgaXRlbXM6IHN0cmluZ1tdKSA9PiB7XG4gICAgICBpZiAoaXRlbXMubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcblxuICAgICAgY29uc3QgcHJldmlldyA9IGl0ZW1zLnNsaWNlKDAsIDQpLmpvaW4oXCIsIFwiKTtcbiAgICAgIGNvbnN0IGV4dHJhID0gaXRlbXMubGVuZ3RoID4gNCA/IGAgKyR7aXRlbXMubGVuZ3RoIC0gNH0gbW9yZWAgOiBcIlwiO1xuXG4gICAgICByZXR1cm4gYCR7bGFiZWx9OiAke2l0ZW1zLmxlbmd0aH0gKCR7cHJldmlld30ke2V4dHJhfSlgO1xuICAgIH07XG4gICAgY29uc3Qgc3VtbWFyeVBhcnRzID0gW1xuICAgICAgZm9ybWF0TGlzdChcIkltcG9ydGVkXCIsIGltcG9ydGVkTmFtZXMpLFxuICAgICAgZm9ybWF0TGlzdChcIlNraXBwZWRcIiwgc2tpcHBlZE5hbWVzKSxcbiAgICAgIGZvcm1hdExpc3QoXCJQYXJzZSBmYWlsZWRcIiwgcGFyc2VGYWlsZWROYW1lcyksXG4gICAgICBmb3JtYXRMaXN0KFwiQ29tYmluZWQtYmxvY2sgc2tpcHNcIiwgY29tYmluZWRTa2lwcGVkTmFtZXMpXG4gICAgXS5maWx0ZXIoQm9vbGVhbik7XG5cbiAgICBpZiAocGFyc2VGYWlsZWRDb3VudCA+IDApIHtcbiAgICAgIHN1bW1hcnlQYXJ0cy5wdXNoKGBQYXJzZSBmYWlsZWQ6ICR7cGFyc2VGYWlsZWRDb3VudH1gKTtcbiAgICB9XG5cbiAgICBpZiAoY29tYmluZWRCbG9ja1NraXBwZWRDb3VudCA+IDApIHtcbiAgICAgIHN1bW1hcnlQYXJ0cy5wdXNoKGBDb21iaW5lZC1ibG9jayBza2lwczogJHtjb21iaW5lZEJsb2NrU2tpcHBlZENvdW50fWApO1xuICAgIH1cblxuICAgIGNvbnN0IHN1bW1hcnlQcmVmaXggPSBjYW5jZWxsZWQgPyBcIkJ1bGsgaW1wb3J0IHN0b3BwZWQuXCIgOiBcIkJ1bGsgaW1wb3J0IGNvbXBsZXRlLlwiO1xuICAgIG5ldyBOb3RpY2UoYCR7c3VtbWFyeVByZWZpeH0gJHtzdW1tYXJ5UGFydHMuam9pbihcIiB8IFwiKX1gLCAxMDAwMCk7XG4gIH1cbiAgYXN5bmMgb25sb2FkKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMubG9hZFBsdWdpblNldHRpbmdzKCk7XG5cbiAgICB0aGlzLmFkZFNldHRpbmdUYWIobmV3IFNoYWRvd2RhcmtTdGF0YmxvY2tzU2V0dGluZ1RhYih0aGlzLmFwcCwgdGhpcykpO1xuXG4gICAgdGhpcy5yZWdpc3Rlck1hcmtkb3duQ29kZUJsb2NrUHJvY2Vzc29yKFxuICAgICAgXCJzaGFkb3dkYXJrLW1vbnN0ZXJcIixcbiAgICAgIChzb3VyY2U6IHN0cmluZywgZWw6IEhUTUxFbGVtZW50LCBfY3R4OiBNYXJrZG93blBvc3RQcm9jZXNzb3JDb250ZXh0KSA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHBhcnNlQ29kZUJsb2NrKHNvdXJjZSk7XG5cbiAgICAgICAgaWYgKCFyZXN1bHQuc3VjY2VzcyB8fCAhcmVzdWx0LmRhdGEpIHtcbiAgICAgICAgICBjb25zdCBlcnJvckJveCA9IGVsLmNyZWF0ZURpdih7IGNsczogXCJzZC1tb25zdGVyLWVycm9yLWJveFwiIH0pO1xuICAgICAgICAgIGVycm9yQm94LmNyZWF0ZURpdih7XG4gICAgICAgICAgICB0ZXh0OiBcIlNoYWRvd2RhcmsgbW9uc3RlciBwYXJzZSBlcnJvclwiLFxuICAgICAgICAgICAgY2xzOiBcInNkLW1vbnN0ZXItZXJyb3ItdGl0bGVcIlxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgZm9yIChjb25zdCBlcnJvciBvZiByZXN1bHQuZXJyb3JzKSB7XG4gICAgICAgICAgICBlcnJvckJveC5jcmVhdGVEaXYoe1xuICAgICAgICAgICAgICB0ZXh0OiBlcnJvcixcbiAgICAgICAgICAgICAgY2xzOiBcInNkLW1vbnN0ZXItZXJyb3JcIlxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVuZGVyTW9uc3RlckJsb2NrKGVsLCByZXN1bHQuZGF0YSwgdGhpcy5zZXR0aW5ncywgcmVzdWx0Lndhcm5pbmdzKTtcbiAgICAgIH1cbiAgICApO1xuXG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgIHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImFjdGl2ZS1sZWFmLWNoYW5nZVwiLCAoKSA9PiB7XG4gICAgdm9pZCB0aGlzLnJlbmRlckFsbE1vbnN0ZXJWaWV3cygpO1xuICB9KVxuKTtcblxudGhpcy5yZWdpc3Rlck1hcmtkb3duUG9zdFByb2Nlc3NvcigoZWwsIGN0eCkgPT4ge1xuICB2b2lkIHRoaXMucmVuZGVyTW9uc3RlckluUHJvY2Vzc2VkUHJldmlldyhlbCwgY3R4KTtcbn0pO1xuXG50aGlzLnJlZ2lzdGVyRXZlbnQoXG4gIHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImZpbGUtb3BlblwiLCAoKSA9PiB7XG4gICAgdm9pZCB0aGlzLmVuc3VyZU1vbnN0ZXJWaWV3c0luUHJldmlldygpO1xuICAgIHZvaWQgdGhpcy5yZW5kZXJBbGxNb25zdGVyVmlld3MoKTtcbiAgfSlcbik7XG5cbnRoaXMucmVnaXN0ZXJFdmVudChcbiAgdGhpcy5hcHAud29ya3NwYWNlLm9uKFwibGF5b3V0LWNoYW5nZVwiLCAoKSA9PiB7XG4gICAgdm9pZCB0aGlzLnJlbmRlckFsbE1vbnN0ZXJWaWV3cygpO1xuICB9KVxuKTtcblxudGhpcy5yZWdpc3RlckV2ZW50KFxuICB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLm9uKFwiY2hhbmdlZFwiLCAoKSA9PiB7XG4gICAgdm9pZCB0aGlzLnJlbmRlckFsbE1vbnN0ZXJWaWV3cygpO1xuICB9KVxuKTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJpbnNlcnQtc2hhZG93ZGFyay1tb25zdGVyLWJsb2NrXCIsXG4gICAgICBuYW1lOiBcIkluc2VydCBTaGFkb3dkYXJrIG1vbnN0ZXIgYmxvY2tcIixcbiAgICAgIGVkaXRvckNhbGxiYWNrOiAoZWRpdG9yKSA9PiB7XG4gICAgICAgIGNvbnN0IHRlbXBsYXRlID0gW1xuICAgICAgICAgIFwiYGBgc2hhZG93ZGFyay1tb25zdGVyXCIsXG4gICAgICAgICAgXCJuYW1lOiBHb2JsaW4gU25lYWtcIixcbiAgICAgICAgICBcImxldmVsOiAxXCIsXG4gICAgICAgICAgXCJhbGlnbm1lbnQ6IENcIixcbiAgICAgICAgICBcImFjOiAxM1wiLFxuICAgICAgICAgIFwiaHA6IDVcIixcbiAgICAgICAgICBcIm12OiBuZWFyXCIsXG4gICAgICAgICAgXCJhdGs6XCIsXG4gICAgICAgICAgXCIgIC0gMSBEYWdnZXIgKzIgKDFkNClcIixcbiAgICAgICAgICBcInN0cjogLTFcIixcbiAgICAgICAgICBcImRleDogKzJcIixcbiAgICAgICAgICBcImNvbjogKzBcIixcbiAgICAgICAgICBcImludDogKzBcIixcbiAgICAgICAgICBcIndpczogLTFcIixcbiAgICAgICAgICBcImNoYTogLTFcIixcbiAgICAgICAgICBcInRyYWl0czpcIixcbiAgICAgICAgICBcIiAgLSBTbmVha3lcIixcbiAgICAgICAgICBcIiAgLSBEYXJrLWFkYXB0ZWRcIixcbiAgICAgICAgICBcImRlc2NyaXB0aW9uOiBBIHdpcnkgZ29ibGluIHRoYXQgc3RhbGtzIHRoZSBlZGdlcyBvZiB0b3JjaGxpZ2h0LlwiLFxuICAgICAgICAgIFwic291cmNlOiBIb21lYnJld1wiLFxuICAgICAgICAgIFwidGFnczpcIixcbiAgICAgICAgICBcIiAgLSBzaGFkb3dkYXJrXCIsXG4gICAgICAgICAgXCIgIC0gZ29ibGluXCIsXG4gICAgICAgICAgXCJgYGBcIlxuICAgICAgICBdLmpvaW4oXCJcXG5cIik7XG5cbiAgICAgICAgZWRpdG9yLnJlcGxhY2VTZWxlY3Rpb24odGVtcGxhdGUpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcImNyZWF0ZS1zaGFkb3dkYXJrLW1vbnN0ZXItbm90ZVwiLFxuICAgICAgbmFtZTogXCJDcmVhdGUgU2hhZG93ZGFyayBtb25zdGVyIG5vdGVcIixcbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IHRoaXMuY3JlYXRlTW9uc3Rlck5vdGUoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJpbXBvcnQtc2hhZG93ZGFyay1tb25zdGVyLWZyb20tY2xpcGJvYXJkXCIsXG4gICAgICBuYW1lOiBcIkltcG9ydCBTaGFkb3dkYXJrIG1vbnN0ZXIgZnJvbSBjbGlwYm9hcmRcIixcbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IHRoaXMuaW1wb3J0TW9uc3RlckZyb21DbGlwYm9hcmQoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJpbXBvcnQtc2hhZG93ZGFyay1tb25zdGVyLWZyb20tc2VsZWN0aW9uXCIsXG4gICAgICBuYW1lOiBcIkltcG9ydCBTaGFkb3dkYXJrIG1vbnN0ZXIgZnJvbSBzZWxlY3RlZCB0ZXh0XCIsXG4gICAgICBlZGl0b3JDYWxsYmFjazogYXN5bmMgKGVkaXRvcjogRWRpdG9yKSA9PiB7XG4gICAgICAgIGF3YWl0IHRoaXMuaW1wb3J0TW9uc3RlckZyb21TZWxlY3Rpb24oZWRpdG9yKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJlZGl0LWN1cnJlbnQtc2hhZG93ZGFyay1tb25zdGVyXCIsXG4gICAgICBuYW1lOiBcIkVkaXQgY3VycmVudCBTaGFkb3dkYXJrIG1vbnN0ZXJcIixcbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IHRoaXMuZWRpdEN1cnJlbnRNb25zdGVyTm90ZSgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcImltcG9ydC1tdWx0aXBsZS1zaGFkb3dkYXJrLW1vbnN0ZXJzXCIsXG4gICAgICBuYW1lOiBcIkltcG9ydCBtdWx0aXBsZSBTaGFkb3dkYXJrIG1vbnN0ZXJzIGZyb20gY2xpcGJvYXJkXCIsXG4gICAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgICBhd2FpdCB0aGlzLmltcG9ydE11bHRpcGxlRnJvbUNsaXBib2FyZCgpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJvcGVuLW1vbnN0ZXItYnJvd3NlclwiLFxuICAgICAgbmFtZTogXCJPcGVuIE1vbnN0ZXIgQnJvd3NlclwiLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IHtcbiAgICAgICAgbmV3IE1vbnN0ZXJCcm93c2VyTW9kYWwodGhpcy5hcHAsIHRoaXMpLm9wZW4oKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHZvaWQgdGhpcy5lbnN1cmVNb25zdGVyVmlld3NJblByZXZpZXcoKTtcbiAgICAgIHZvaWQgdGhpcy5yZW5kZXJBbGxNb25zdGVyVmlld3MoKTtcbiAgICB9LCAxMDApO1xuICB9XG5cbiAgb251bmxvYWQoKTogdm9pZCB7XG4gIGNvbnN0IGxlYXZlcyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoXCJtYXJrZG93blwiKTtcblxuICBmb3IgKGNvbnN0IGxlYWYgb2YgbGVhdmVzKSB7XG4gICAgY29uc3QgdmlldyA9IGxlYWYudmlldztcbiAgICBpZiAodmlldyBpbnN0YW5jZW9mIE1hcmtkb3duVmlldykge1xuICAgICAgdGhpcy5yZW1vdmVFeGlzdGluZ0Zyb250bWF0dGVyUmVuZGVyKHZpZXcpO1xuICAgICAgdGhpcy5zaG93UHJvcGVydGllcyh2aWV3KTtcbiAgICB9XG4gIH1cbiAgdGhpcy5wYXJzZWRNb25zdGVyQ2FjaGUuY2xlYXIoKTtcblxufVxuXG4gIGFzeW5jIGxvYWRQbHVnaW5TZXR0aW5ncygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLnNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7fSwgREVGQVVMVF9TRVRUSU5HUywgYXdhaXQgdGhpcy5sb2FkRGF0YSgpKTtcbiAgfVxuXG4gIGFzeW5jIHNhdmVQbHVnaW5TZXR0aW5ncygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xuICB9XG5cbiAgYXN5bmMgcmVmcmVzaE1vbnN0ZXJWaWV3KCk6IFByb21pc2U8dm9pZD4ge1xuICBhd2FpdCB0aGlzLnJlbmRlckFsbE1vbnN0ZXJWaWV3cygpO1xufVxuXG4gIHByaXZhdGUgYXN5bmMgY3JlYXRlTW9uc3Rlck5vdGUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZm9sZGVyUGF0aCA9IG5vcm1hbGl6ZVBhdGgodGhpcy5zZXR0aW5ncy5tb25zdGVyRm9sZGVyKTtcblxuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyRXhpc3RzKGZvbGRlclBhdGgpO1xuXG4gICAgY29uc3QgYmFzZU5hbWUgPSBcIk5ldyBNb25zdGVyXCI7XG4gICAgY29uc3QgZmlsZVBhdGggPSBhd2FpdCB0aGlzLmdldFVuaXF1ZUZpbGVQYXRoKGZvbGRlclBhdGgsIGAke2Jhc2VOYW1lfS5tZGApO1xuICAgIGNvbnN0IGNvbnRlbnQgPSBidWlsZE1vbnN0ZXJUZW1wbGF0ZShiYXNlTmFtZSk7XG5cbiAgICBjb25zdCBmaWxlID0gYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlKGZpbGVQYXRoLCBjb250ZW50KTtcbiAgICBhd2FpdCB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZih0cnVlKS5vcGVuRmlsZShmaWxlKTtcblxuICAgIG5ldyBOb3RpY2UoYENyZWF0ZWQgbW9uc3RlciBub3RlOiAke2ZpbGUuYmFzZW5hbWV9YCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGltcG9ydE1vbnN0ZXJGcm9tQ2xpcGJvYXJkKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGxldCBjbGlwYm9hcmRUZXh0ID0gXCJcIjtcblxuICAgIHRyeSB7XG4gICAgICBjbGlwYm9hcmRUZXh0ID0gYXdhaXQgbmF2aWdhdG9yLmNsaXBib2FyZC5yZWFkVGV4dCgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiU2hhZG93ZGFyayBTdGF0YmxvY2tzIGNsaXBib2FyZCByZWFkIGVycm9yOlwiLCBlcnJvcik7XG4gICAgICBuZXcgTm90aWNlKFwiQ291bGQgbm90IHJlYWQgY2xpcGJvYXJkLlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5vcGVuSW1wb3J0UHJldmlld0Zyb21UZXh0KGNsaXBib2FyZFRleHQpO1xuICB9XG5cbiAgYXN5bmMgZ2V0U3VnZ2VzdGVkT3RoZXJTb3VyY2VzKCk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICByZXR1cm4gZ2V0U3VnZ2VzdGVkT3RoZXJTb3VyY2VzKHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzLm1vbnN0ZXJGb2xkZXIpO1xuICB9XG5cbnByaXZhdGUgYXBwbHlTbWFydERlZmF1bHRUYWdzKG1vbnN0ZXI6IFNoYWRvd2RhcmtNb25zdGVyKTogU2hhZG93ZGFya01vbnN0ZXIge1xuICBjb25zdCBleGlzdGluZ1RhZ3MgPSBuZXcgU2V0KFxuICAgIChtb25zdGVyLnRhZ3MgPz8gW10pLm1hcCgodGFnKSA9PiB0YWcudHJpbSgpLnRvTG93ZXJDYXNlKCkpLmZpbHRlcihCb29sZWFuKVxuICApO1xuXG4gIGNvbnN0IHRleHRCbG9iID0gW1xuICAgIG1vbnN0ZXIubmFtZSxcbiAgICBtb25zdGVyLmRlc2NyaXB0aW9uLFxuICAgIC4uLihtb25zdGVyLnRyYWl0cyA/PyBbXSksXG4gICAgLi4uKG1vbnN0ZXIuc3BlY2lhbHMgPz8gW10pLFxuICAgIC4uLihtb25zdGVyLnNwZWxscyA/PyBbXSlcbiAgXVxuICAgIC5qb2luKFwiIFwiKVxuICAgIC50b0xvd2VyQ2FzZSgpO1xuXG4gIGNvbnN0IG12ID0gKG1vbnN0ZXIubXYgPz8gXCJcIikudG9Mb3dlckNhc2UoKTtcblxuICBjb25zdCBhZGRUYWcgPSAodGFnOiBzdHJpbmcpID0+IHtcbiAgICBleGlzdGluZ1RhZ3MuYWRkKHRhZyk7XG4gIH07XG5cbiAgY29uc3QgYWRkSWZNYXRjaCA9ICh0YWc6IHN0cmluZywgcGF0dGVybnM6IFJlZ0V4cFtdKSA9PiB7XG4gICAgaWYgKHBhdHRlcm5zLnNvbWUoKHBhdHRlcm4pID0+IHBhdHRlcm4udGVzdCh0ZXh0QmxvYikpKSB7XG4gICAgICBhZGRUYWcodGFnKTtcbiAgICB9XG4gIH07XG5cbiAgYWRkSWZNYXRjaChcInVuZGVhZFwiLCBbL1xcYnVuZGVhZFxcYi8sIC9cXGJza2VsZXRvblxcYi8sIC9cXGJ6b21iaWVcXGIvLCAvXFxiZ2hvdWxcXGIvLCAvXFxidmFtcGlyZVxcYi8sIC9cXGJsaWNoXFxiLywgL1xcYndpZ2h0XFxiL10pO1xuICBhZGRJZk1hdGNoKFwiZHJhZ29uXCIsIFsvXFxiZHJhZ29uXFxiLywgL1xcYmRyYWtlXFxiLywgL1xcYnd5cm1cXGIvXSk7XG4gIGFkZElmTWF0Y2goXCJkZW1vblwiLCBbL1xcYmRlbW9uXFxiL10pO1xuICBhZGRJZk1hdGNoKFwiZGV2aWxcIiwgWy9cXGJkZXZpbFxcYi9dKTtcbiAgYWRkSWZNYXRjaChcImNvbnN0cnVjdFwiLCBbL1xcYmNvbnN0cnVjdFxcYi8sIC9cXGJnb2xlbVxcYi8sIC9cXGJhbmltYXRlZCBhcm1vclxcYi8sIC9cXGJjbG9ja3dvcmtcXGIvXSk7XG4gIGFkZElmTWF0Y2goXCJvb3plXCIsIFsvXFxib296ZVxcYi8sIC9cXGJzbGltZVxcYi8sIC9cXGJqZWxseVxcYi8sIC9cXGJwdWRkaW5nXFxiLywgL1xcYmljaG9yXFxiL10pO1xuICBhZGRJZk1hdGNoKFwiZ29ibGluXCIsIFsvXFxiZ29ibGluXFxiL10pO1xuICBhZGRJZk1hdGNoKFwib3JjXCIsIFsvXFxib3JjXFxiL10pO1xuICBhZGRJZk1hdGNoKFwidHJvbGxcIiwgWy9cXGJ0cm9sbFxcYi9dKTtcbiAgYWRkSWZNYXRjaChcIndvbGZcIiwgWy9cXGJ3b2xmXFxiL10pO1xuICBhZGRJZk1hdGNoKFwiZ2lhbnRcIiwgWy9cXGJnaWFudFxcYi9dKTtcblxuICBpZiAoL1xcYmZseVxcYi8udGVzdChtdikpIHtcbiAgICBhZGRUYWcoXCJmbHlpbmdcIik7XG4gIH1cblxuICBpZiAoL1xcYnN3aW1cXGIvLnRlc3QobXYpIHx8IC9cXGJhcXVhdGljXFxiLy50ZXN0KHRleHRCbG9iKSB8fCAvXFxid2F0ZXJcXGIvLnRlc3QodGV4dEJsb2IpKSB7XG4gICAgYWRkVGFnKFwiYXF1YXRpY1wiKTtcbiAgfVxuXG4gIGlmICgobW9uc3Rlci5zcGVsbHMgPz8gW10pLmxlbmd0aCA+IDApIHtcbiAgICBhZGRUYWcoXCJzcGVsbGNhc3RlclwiKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgLi4ubW9uc3RlcixcbiAgICB0YWdzOiBbLi4uZXhpc3RpbmdUYWdzXS5zb3J0KChhLCBiKSA9PiBhLmxvY2FsZUNvbXBhcmUoYikpXG4gIH07XG59XG5cbiAgcHJpdmF0ZSBhc3luYyBpbXBvcnRNb25zdGVyRnJvbVNlbGVjdGlvbihlZGl0b3I6IEVkaXRvcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHNlbGVjdGVkVGV4dCA9IGVkaXRvci5nZXRTZWxlY3Rpb24oKS50cmltKCk7XG5cbiAgICBpZiAoIXNlbGVjdGVkVGV4dCkge1xuICAgICAgbmV3IE5vdGljZShcIk5vIHRleHQgc2VsZWN0ZWQuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGF3YWl0IHRoaXMub3BlbkltcG9ydFByZXZpZXdGcm9tVGV4dChzZWxlY3RlZFRleHQpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBvcGVuSW1wb3J0UHJldmlld0Zyb21UZXh0KHNvdXJjZVRleHQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IHBhcnNlUmF3U2hhZG93ZGFya1RleHQoc291cmNlVGV4dCk7XG5cbiAgICBpZiAoIXJlc3VsdC5zdWNjZXNzIHx8ICFyZXN1bHQuZGF0YSkge1xuICAgICAgY29uc3QgbWVzc2FnZSA9XG4gICAgICAgIHJlc3VsdC5lcnJvcnMubGVuZ3RoID4gMFxuICAgICAgICAgID8gcmVzdWx0LmVycm9yc1swXVxuICAgICAgICAgIDogXCJDb3VsZCBub3QgcGFyc2UgbW9uc3RlciB0ZXh0LlwiO1xuICAgICAgbmV3IE5vdGljZShtZXNzYWdlLCA2MDAwKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzdWdnZXN0ZWRUYWdzID0gYXdhaXQgdGhpcy5nZXRTdWdnZXN0ZWRUYWdzKCk7XG4gICAgY29uc3Qgc3VnZ2VzdGVkT3RoZXJTb3VyY2VzID0gYXdhaXQgdGhpcy5nZXRTdWdnZXN0ZWRPdGhlclNvdXJjZXMoKTtcblxuICAgIGNvbnN0IG1vbnN0ZXJXaXRoTGFzdFNvdXJjZSA9IHRoaXMuYXBwbHlMYXN0VXNlZFNvdXJjZShyZXN1bHQuZGF0YSk7XG4gICAgY29uc3QgbW9uc3RlcldpdGhTbWFydFRhZ3MgPSB0aGlzLmFwcGx5U21hcnREZWZhdWx0VGFncyhtb25zdGVyV2l0aExhc3RTb3VyY2UpO1xuXG4gICAgY29uc3QgbW9kYWwgPSBuZXcgSW1wb3J0UHJldmlld01vZGFsKHRoaXMuYXBwLCB7XG4gICAgICBtb25zdGVyOiBtb25zdGVyV2l0aFNtYXJ0VGFncyxcbiAgICAgIHdhcm5pbmdzOiByZXN1bHQud2FybmluZ3MsXG4gICAgICBtb2RlOiBcImltcG9ydFwiLFxuICAgICAgc3VnZ2VzdGVkVGFncyxcbiAgICAgIHN1Z2dlc3RlZE90aGVyU291cmNlcyxcbiAgICAgIG9uQ29uZmlybTogYXN5bmMgKG1vbnN0ZXIpID0+IHtcbiAgICAgICAgYXdhaXQgdGhpcy5yZW1lbWJlckxhc3RVc2VkU291cmNlKG1vbnN0ZXIuc291cmNlKTtcbiAgICAgICAgYXdhaXQgdGhpcy5jcmVhdGVJbXBvcnRlZE1vbnN0ZXJOb3RlKG1vbnN0ZXIsIHJlc3VsdC53YXJuaW5ncyk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBtb2RhbC5vcGVuKCk7XG4gIH1cbiAgYXN5bmMgZ2V0U3VnZ2VzdGVkVGFncygpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgcmV0dXJuIGdldFN1Z2dlc3RlZFRhZ3ModGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MubW9uc3RlckZvbGRlcik7XG4gIH1cbiAgYXN5bmMgZ2V0QWxsTW9uc3RlckluZGV4RW50cmllcygpIHtcbiAgICByZXR1cm4gZ2V0QWxsTW9uc3RlckluZGV4RW50cmllcyh0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncy5tb25zdGVyRm9sZGVyKTtcbiAgfVxuICBwcml2YXRlIGFzeW5jIGNyZWF0ZUltcG9ydGVkTW9uc3Rlck5vdGUoXG4gICAgbW9uc3RlcjogU2hhZG93ZGFya01vbnN0ZXIsXG4gICAgd2FybmluZ3M6IHN0cmluZ1tdXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGZvbGRlclBhdGggPSBub3JtYWxpemVQYXRoKHRoaXMuc2V0dGluZ3MubW9uc3RlckZvbGRlcik7XG4gICAgYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXJFeGlzdHMoZm9sZGVyUGF0aCk7XG5cbiAgICBjb25zdCBzYWZlTmFtZSA9IChtb25zdGVyLm5hbWUgfHwgXCJJbXBvcnRlZCBNb25zdGVyXCIpLnRyaW0oKTtcblxuICAgIGNvbnN0IGV4aXN0aW5nTW9uc3RlckZpbGUgPSB0aGlzLmFwcC52YXVsdFxuICAgICAgLmdldE1hcmtkb3duRmlsZXMoKVxuICAgICAgLmZpbmQoKGZpbGUpID0+IHtcbiAgICAgICAgY29uc3QgaW5Nb25zdGVyRm9sZGVyID1cbiAgICAgICAgICBmaWxlLnBhdGguc3RhcnRzV2l0aChgJHtmb2xkZXJQYXRofS9gKSB8fCBmaWxlLnBhdGggPT09IGAke2ZvbGRlclBhdGh9Lm1kYDtcblxuICAgICAgICBpZiAoIWluTW9uc3RlckZvbGRlcikgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgIHJldHVybiBmaWxlLmJhc2VuYW1lLnRyaW0oKS50b0xvd2VyQ2FzZSgpID09PSBzYWZlTmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgfSk7XG5cbiAgICBpZiAoZXhpc3RpbmdNb25zdGVyRmlsZSBpbnN0YW5jZW9mIFRGaWxlKSB7XG4gICAgICBjb25zdCBleGlzdGluZ0NvbnRlbnQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGV4aXN0aW5nTW9uc3RlckZpbGUpO1xuICAgICAgY29uc3QgZXhpc3RpbmdGcm9udG1hdHRlciA9IHRoaXMuZXh0cmFjdEZyb250bWF0dGVyKGV4aXN0aW5nQ29udGVudCk7XG4gICAgICBjb25zdCBjYW5PdmVyd3JpdGUgPSBleGlzdGluZ0Zyb250bWF0dGVyPy5zaGFkb3dkYXJrVHlwZSA9PT0gXCJtb25zdGVyXCI7XG5cbiAgICAgIGNvbnN0IG1vZGFsID0gbmV3IER1cGxpY2F0ZU1vbnN0ZXJNb2RhbCh0aGlzLmFwcCwge1xuICAgICAgICBtb25zdGVyTmFtZTogc2FmZU5hbWUsXG4gICAgICAgIGV4aXN0aW5nRmlsZU5hbWU6IGV4aXN0aW5nTW9uc3RlckZpbGUuYmFzZW5hbWUsXG4gICAgICAgIGNhbk92ZXJ3cml0ZSxcbiAgICAgICAgb25PdmVyd3JpdGU6IGNhbk92ZXJ3cml0ZVxuICAgICAgICAgID8gYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZUV4aXN0aW5nTW9uc3Rlck5vdGUoZXhpc3RpbmdNb25zdGVyRmlsZSwgbW9uc3Rlcik7XG5cbiAgICAgICAgICAgICAgaWYgKHdhcm5pbmdzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBuZXcgTm90aWNlKFxuICAgICAgICAgICAgICAgICAgYFVwZGF0ZWQgJHtleGlzdGluZ01vbnN0ZXJGaWxlLmJhc2VuYW1lfSB3aXRoICR7d2FybmluZ3MubGVuZ3RofSB3YXJuaW5nKHMpLiBSZXZpZXcgdGhlIG5vdGUuYCxcbiAgICAgICAgICAgICAgICAgIDcwMDBcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UoYFVwZGF0ZWQgbW9uc3RlcjogJHtleGlzdGluZ01vbnN0ZXJGaWxlLmJhc2VuYW1lfWApO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgIG9uQ3JlYXRlQ29weTogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMuY3JlYXRlSW1wb3J0ZWRNb25zdGVyQ29weShtb25zdGVyLCB3YXJuaW5ncyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBtb2RhbC5vcGVuKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgYXdhaXQgdGhpcy5jcmVhdGVJbXBvcnRlZE1vbnN0ZXJDb3B5KG1vbnN0ZXIsIHdhcm5pbmdzKTtcbiAgfVxuXG5wcml2YXRlIGFzeW5jIGNyZWF0ZUltcG9ydGVkTW9uc3RlckNvcHkoXG4gIG1vbnN0ZXI6IFNoYWRvd2RhcmtNb25zdGVyLFxuICB3YXJuaW5nczogc3RyaW5nW11cbik6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBmb2xkZXJQYXRoID0gbm9ybWFsaXplUGF0aCh0aGlzLnNldHRpbmdzLm1vbnN0ZXJGb2xkZXIpO1xuICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlckV4aXN0cyhmb2xkZXJQYXRoKTtcblxuICBjb25zdCBzYWZlTmFtZSA9IG1vbnN0ZXIubmFtZSB8fCBcIkltcG9ydGVkIE1vbnN0ZXJcIjtcbiAgY29uc3QgZmlsZVBhdGggPSBhd2FpdCB0aGlzLmdldFVuaXF1ZUZpbGVQYXRoKGZvbGRlclBhdGgsIGAke3NhZmVOYW1lfS5tZGApO1xuICBjb25zdCBjb250ZW50ID0gYnVpbGRNb25zdGVyTm90ZUNvbnRlbnQobW9uc3Rlcik7XG5cbiAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShmaWxlUGF0aCwgY29udGVudCk7XG4gIGF3YWl0IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWFmKHRydWUpLm9wZW5GaWxlKGZpbGUpO1xuXG4gIGlmICh3YXJuaW5ncy5sZW5ndGggPiAwKSB7XG4gICAgbmV3IE5vdGljZShcbiAgICAgIGBJbXBvcnRlZCAke2ZpbGUuYmFzZW5hbWV9IHdpdGggJHt3YXJuaW5ncy5sZW5ndGh9IHdhcm5pbmcocykuIFJldmlldyB0aGUgbm90ZS5gLFxuICAgICAgNzAwMFxuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgbmV3IE5vdGljZShgSW1wb3J0ZWQgbW9uc3RlcjogJHtmaWxlLmJhc2VuYW1lfWApO1xuICB9XG59XG5cbiAgcHJpdmF0ZSBhc3luYyBlZGl0Q3VycmVudE1vbnN0ZXJOb3RlKCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgaWYgKCF2aWV3KSB7XG4gICAgbmV3IE5vdGljZShcIk5vIGFjdGl2ZSBtYXJrZG93biBub3RlLlwiKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBmaWxlID0gdmlldy5maWxlO1xuICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgbmV3IE5vdGljZShcIk5vIGFjdGl2ZSBmaWxlIHRvIGVkaXQuXCIpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICBjb25zdCBwYXJzZWRGcm9udG1hdHRlciA9IHRoaXMuZXh0cmFjdEZyb250bWF0dGVyKGNvbnRlbnQpO1xuXG4gIGlmICghcGFyc2VkRnJvbnRtYXR0ZXIgfHwgcGFyc2VkRnJvbnRtYXR0ZXIuc2hhZG93ZGFya1R5cGUgIT09IFwibW9uc3RlclwiKSB7XG4gICAgbmV3IE5vdGljZShcIkN1cnJlbnQgbm90ZSBpcyBub3QgYSBTaGFkb3dkYXJrIG1vbnN0ZXIuXCIpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHJlc3VsdCA9IHRoaXMuZ2V0Q2FjaGVkTW9uc3RlclBhcnNlKGZpbGUsIHBhcnNlZEZyb250bWF0dGVyKTtcbiAgaWYgKCFyZXN1bHQuc3VjY2VzcyB8fCAhcmVzdWx0LmRhdGEpIHtcbiAgICBuZXcgTm90aWNlKFwiQ291bGQgbm90IHBhcnNlIGN1cnJlbnQgbW9uc3RlciBub3RlLlwiKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBzdWdnZXN0ZWRUYWdzID0gYXdhaXQgdGhpcy5nZXRTdWdnZXN0ZWRUYWdzKCk7XG4gIGNvbnN0IHN1Z2dlc3RlZE90aGVyU291cmNlcyA9IGF3YWl0IHRoaXMuZ2V0U3VnZ2VzdGVkT3RoZXJTb3VyY2VzKCk7XG5cbiAgY29uc3QgbW9kYWwgPSBuZXcgSW1wb3J0UHJldmlld01vZGFsKHRoaXMuYXBwLCB7XG4gICAgbW9uc3RlcjogcmVzdWx0LmRhdGEsXG4gICAgd2FybmluZ3M6IFtdLFxuICAgIG1vZGU6IFwiZWRpdFwiLFxuICAgIHN1Z2dlc3RlZFRhZ3MsXG4gICAgc3VnZ2VzdGVkT3RoZXJTb3VyY2VzLFxuICAgIG9uQ29uZmlybTogYXN5bmMgKG1vbnN0ZXIpID0+IHtcbiAgICAgIGF3YWl0IHRoaXMucmVtZW1iZXJMYXN0VXNlZFNvdXJjZShtb25zdGVyLnNvdXJjZSk7XG4gICAgICBhd2FpdCB0aGlzLnVwZGF0ZUV4aXN0aW5nTW9uc3Rlck5vdGUoZmlsZSwgbW9uc3Rlcik7XG4gICAgfVxuICB9KTtcblxuICBtb2RhbC5vcGVuKCk7XG59XG5cbnByaXZhdGUgYXN5bmMgdXBkYXRlRXhpc3RpbmdNb25zdGVyTm90ZShcbiAgZmlsZTogVEZpbGUsXG4gIG1vbnN0ZXI6IFNoYWRvd2RhcmtNb25zdGVyXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgZXhpc3RpbmdDb250ZW50ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChmaWxlKTtcbiAgY29uc3QgYm9keSA9IHRoaXMuZXh0cmFjdEJvZHlBZnRlckZyb250bWF0dGVyKGV4aXN0aW5nQ29udGVudCk7XG5cbiAgY29uc3QgdXBkYXRlZENvbnRlbnQgPSBidWlsZE1vbnN0ZXJOb3RlQ29udGVudChtb25zdGVyLCBib2R5KTtcbiAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KGZpbGUsIHVwZGF0ZWRDb250ZW50KTtcbiAgdGhpcy5wYXJzZWRNb25zdGVyQ2FjaGUuZGVsZXRlKGZpbGUucGF0aCk7XG5cbiAgbmV3IE5vdGljZShgVXBkYXRlZCBtb25zdGVyOiAke2ZpbGUuYmFzZW5hbWV9YCk7XG4gIGF3YWl0IHRoaXMucmVmcmVzaE1vbnN0ZXJWaWV3KCk7XG59XG5cbnByaXZhdGUgZXh0cmFjdEJvZHlBZnRlckZyb250bWF0dGVyKGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IG1hdGNoID0gY29udGVudC5tYXRjaCgvXi0tLVxcbltcXHNcXFNdKj9cXG4tLS1cXG4/KFtcXHNcXFNdKikkLyk7XG4gIHJldHVybiBtYXRjaD8uWzFdID8/IFwiXCI7XG59XG5cbiAgcHJpdmF0ZSBhc3luYyBlbnN1cmVGb2xkZXJFeGlzdHMoZm9sZGVyUGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgcGFydHMgPSBmb2xkZXJQYXRoLnNwbGl0KFwiL1wiKS5maWx0ZXIoQm9vbGVhbik7XG4gICAgbGV0IGN1cnJlbnRQYXRoID0gXCJcIjtcblxuICAgIGZvciAoY29uc3QgcGFydCBvZiBwYXJ0cykge1xuICAgICAgY3VycmVudFBhdGggPSBjdXJyZW50UGF0aCA/IGAke2N1cnJlbnRQYXRofS8ke3BhcnR9YCA6IHBhcnQ7XG4gICAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChjdXJyZW50UGF0aCk7XG5cbiAgICAgIGlmICghZXhpc3RpbmcpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlRm9sZGVyKGN1cnJlbnRQYXRoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGdldFVuaXF1ZUZpbGVQYXRoKGZvbGRlclBhdGg6IHN0cmluZywgZmlsZU5hbWU6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgZG90SW5kZXggPSBmaWxlTmFtZS5sYXN0SW5kZXhPZihcIi5cIik7XG4gICAgY29uc3QgYmFzZSA9IGRvdEluZGV4ID49IDAgPyBmaWxlTmFtZS5zbGljZSgwLCBkb3RJbmRleCkgOiBmaWxlTmFtZTtcbiAgICBjb25zdCBleHQgPSBkb3RJbmRleCA+PSAwID8gZmlsZU5hbWUuc2xpY2UoZG90SW5kZXgpIDogXCJcIjtcblxuICAgIGxldCBjYW5kaWRhdGUgPSBgJHtmb2xkZXJQYXRofS8ke2Jhc2V9JHtleHR9YDtcbiAgICBsZXQgY291bnRlciA9IDI7XG5cbiAgICB3aGlsZSAodGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGNhbmRpZGF0ZSkpIHtcbiAgICAgIGNhbmRpZGF0ZSA9IGAke2ZvbGRlclBhdGh9LyR7YmFzZX0gJHtjb3VudGVyfSR7ZXh0fWA7XG4gICAgICBjb3VudGVyKys7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNhbmRpZGF0ZTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVuZGVyQWxsTW9uc3RlclZpZXdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG15R2VuZXJhdGlvbiA9ICsrdGhpcy5yZW5kZXJHZW5lcmF0aW9uO1xuXG4gICAgY29uc3QgbGVhdmVzID0gdGhpcy5hcHAud29ya3NwYWNlLmdldExlYXZlc09mVHlwZShcIm1hcmtkb3duXCIpO1xuICAgIGNvbnN0IHZpZXdzID0gbGVhdmVzXG4gICAgICAubWFwKChsZWFmKSA9PiBsZWFmLnZpZXcpXG4gICAgICAuZmlsdGVyKCh2aWV3KTogdmlldyBpcyBNYXJrZG93blZpZXcgPT4gdmlldyBpbnN0YW5jZW9mIE1hcmtkb3duVmlldyk7XG5cbiAgICBmb3IgKGNvbnN0IHZpZXcgb2Ygdmlld3MpIHtcbiAgICAgIGF3YWl0IHRoaXMucmVuZGVyTW9uc3RlclZpZXcodmlldywgbXlHZW5lcmF0aW9uKTtcbiAgICB9XG4gIH1cblxucHJpdmF0ZSBhc3luYyByZW5kZXJNb25zdGVyVmlldyhcbiAgdmlldzogTWFya2Rvd25WaWV3LFxuICBnZW5lcmF0aW9uOiBudW1iZXJcbik6IFByb21pc2U8dm9pZD4ge1xuICB0aGlzLnJlbW92ZUV4aXN0aW5nRnJvbnRtYXR0ZXJSZW5kZXIodmlldyk7XG4gIHRoaXMuc2hvd1Byb3BlcnRpZXModmlldyk7XG5cbiAgaWYgKCF0aGlzLnNldHRpbmdzLnJlbmRlckZyb250bWF0dGVyTW9uc3RlcnMpIHJldHVybjtcbiAgaWYgKHZpZXcuZ2V0TW9kZSgpICE9PSBcInByZXZpZXdcIikgcmV0dXJuO1xuXG4gIGNvbnN0IGZpbGUgPSB2aWV3LmZpbGU7XG4gIGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHJldHVybjtcblxuICBjb25zdCBjb250ZW50ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChmaWxlKTtcblxuICBpZiAoZ2VuZXJhdGlvbiAhPT0gdGhpcy5yZW5kZXJHZW5lcmF0aW9uKSByZXR1cm47XG5cbiAgY29uc3QgcGFyc2VkRnJvbnRtYXR0ZXIgPSB0aGlzLmV4dHJhY3RGcm9udG1hdHRlcihjb250ZW50KTtcbiAgaWYgKCFwYXJzZWRGcm9udG1hdHRlcikgcmV0dXJuO1xuICBpZiAocGFyc2VkRnJvbnRtYXR0ZXIuc2hhZG93ZGFya1R5cGUgIT09IFwibW9uc3RlclwiKSByZXR1cm47XG5cbiAgaWYgKHRoaXMuc2V0dGluZ3MuaGlkZU1vbnN0ZXJQcm9wZXJ0aWVzKSB7XG4gICAgdGhpcy5oaWRlUHJvcGVydGllcyh2aWV3KTtcbiAgfVxufVxuXG5wcml2YXRlIGFzeW5jIGVuc3VyZU1vbnN0ZXJWaWV3SW5QcmV2aWV3KHZpZXc6IE1hcmtkb3duVmlldyk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBmaWxlID0gdmlldy5maWxlO1xuICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSByZXR1cm47XG5cbiAgY29uc3QgY29udGVudCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gIGNvbnN0IHBhcnNlZEZyb250bWF0dGVyID0gdGhpcy5leHRyYWN0RnJvbnRtYXR0ZXIoY29udGVudCk7XG5cbiAgaWYgKCFwYXJzZWRGcm9udG1hdHRlciB8fCBwYXJzZWRGcm9udG1hdHRlci5zaGFkb3dkYXJrVHlwZSAhPT0gXCJtb25zdGVyXCIpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBhbHJlYWR5QXV0b1ByZXZpZXdlZEZvclRoaXNGaWxlID0gdGhpcy5hdXRvUHJldmlld2VkTGVhZkZpbGVzLmdldCh2aWV3KSA9PT0gZmlsZS5wYXRoO1xuICBpZiAoYWxyZWFkeUF1dG9QcmV2aWV3ZWRGb3JUaGlzRmlsZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmICh2aWV3LmdldE1vZGUoKSA9PT0gXCJwcmV2aWV3XCIpIHtcbiAgICB0aGlzLmF1dG9QcmV2aWV3ZWRMZWFmRmlsZXMuc2V0KHZpZXcsIGZpbGUucGF0aCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBsZWFmID0gdGhpcy5hcHAud29ya3NwYWNlXG4gICAgICAgIC5nZXRMZWF2ZXNPZlR5cGUoXCJtYXJrZG93blwiKVxuICAgICAgICAuZmluZCgobCkgPT4gbC52aWV3ID09PSB2aWV3KTtcblxuICAgICAgaWYgKCFsZWFmKSByZXR1cm47XG5cbiAgICAgIHZvaWQgbGVhZi5zZXRWaWV3U3RhdGUoe1xuICAgICAgICB0eXBlOiBcIm1hcmtkb3duXCIsXG4gICAgICAgIHN0YXRlOiB7XG4gICAgICAgICAgLi4uKHZpZXcuZ2V0U3RhdGUoKSBhcyBhbnkpLFxuICAgICAgICAgIG1vZGU6IFwicHJldmlld1wiLFxuICAgICAgICAgIGZpbGU6IGZpbGUucGF0aFxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgdGhpcy5hdXRvUHJldmlld2VkTGVhZkZpbGVzLnNldCh2aWV3LCBmaWxlLnBhdGgpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBzd2l0Y2ggdG8gcHJldmlldyBtb2RlOlwiLCBlcnIpO1xuICAgIH1cbiAgfSwgNTApO1xufVxuXG5wcml2YXRlIGFzeW5jIGVuc3VyZU1vbnN0ZXJWaWV3c0luUHJldmlldygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgbGVhdmVzID0gdGhpcy5hcHAud29ya3NwYWNlLmdldExlYXZlc09mVHlwZShcIm1hcmtkb3duXCIpO1xuICBjb25zdCB2aWV3cyA9IGxlYXZlc1xuICAgIC5tYXAoKGxlYWYpID0+IGxlYWYudmlldylcbiAgICAuZmlsdGVyKCh2aWV3KTogdmlldyBpcyBNYXJrZG93blZpZXcgPT4gdmlldyBpbnN0YW5jZW9mIE1hcmtkb3duVmlldyk7XG5cbiAgZm9yIChjb25zdCB2aWV3IG9mIHZpZXdzKSB7XG4gICAgYXdhaXQgdGhpcy5lbnN1cmVNb25zdGVyVmlld0luUHJldmlldyh2aWV3KTtcbiAgfVxufVxuXG4gIHByaXZhdGUgaGlkZVByb3BlcnRpZXModmlldzogTWFya2Rvd25WaWV3KTogdm9pZCB7XG4gICAgY29uc3QgcHJvcGVydGllc0VsID0gdmlldy5jb250YWluZXJFbC5xdWVyeVNlbGVjdG9yKFwiLm1ldGFkYXRhLWNvbnRhaW5lclwiKTtcbiAgICBpZiAocHJvcGVydGllc0VsIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIHtcbiAgICAgIHByb3BlcnRpZXNFbC5jbGFzc0xpc3QuYWRkKFwic2QtbW9uc3Rlci1oaWRlLXByb3BlcnRpZXNcIik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzaG93UHJvcGVydGllcyh2aWV3OiBNYXJrZG93blZpZXcpOiB2b2lkIHtcbiAgICBjb25zdCBoaWRkZW5Qcm9wZXJ0aWVzID0gdmlldy5jb250YWluZXJFbC5xdWVyeVNlbGVjdG9yQWxsKFwiLnNkLW1vbnN0ZXItaGlkZS1wcm9wZXJ0aWVzXCIpO1xuICAgIGZvciAoY29uc3QgZWwgb2YgaGlkZGVuUHJvcGVydGllcykge1xuICAgICAgZWwuY2xhc3NMaXN0LnJlbW92ZShcInNkLW1vbnN0ZXItaGlkZS1wcm9wZXJ0aWVzXCIpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVtb3ZlRXhpc3RpbmdGcm9udG1hdHRlclJlbmRlcih2aWV3OiBNYXJrZG93blZpZXcpOiB2b2lkIHtcbiAgICBjb25zdCBleGlzdGluZyA9IHZpZXcuY29udGFpbmVyRWwucXVlcnlTZWxlY3RvckFsbChcIi5zZC1tb25zdGVyLWZyb250bWF0dGVyLXdyYXBwZXJcIik7XG4gICAgZm9yIChjb25zdCBlbCBvZiBleGlzdGluZykge1xuICAgICAgZWwucmVtb3ZlKCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBleHRyYWN0RnJvbnRtYXR0ZXIoY29udGVudDogc3RyaW5nKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCBudWxsIHtcbiAgICBjb25zdCBtYXRjaCA9IGNvbnRlbnQubWF0Y2goL14tLS1cXG4oW1xcc1xcU10qPylcXG4tLS0vKTtcbiAgICBpZiAoIW1hdGNoKSByZXR1cm4gbnVsbDtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBwYXJzZWQgPSBwYXJzZVlhbWwobWF0Y2hbMV0pO1xuICAgICAgaWYgKCFwYXJzZWQgfHwgdHlwZW9mIHBhcnNlZCAhPT0gXCJvYmplY3RcIikgcmV0dXJuIG51bGw7XG4gICAgICByZXR1cm4gcGFyc2VkIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiU2hhZG93ZGFyayBTdGF0YmxvY2tzIGZyb250bWF0dGVyIHBhcnNlIGVycm9yOlwiLCBlcnJvcik7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGVzY2FwZUF0dHJpYnV0ZSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdmFsdWUucmVwbGFjZSgvXCIvZywgXCImcXVvdDtcIik7XG4gIH1cbn0iLCAiaW1wb3J0IHsgQXBwLCBURmlsZSwgbm9ybWFsaXplUGF0aCwgcGFyc2VZYW1sIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmV4cG9ydCB0eXBlIE1vbnN0ZXJJbmRleEVudHJ5ID0ge1xuICBmaWxlOiBURmlsZTtcbiAgbmFtZTogc3RyaW5nO1xuICBsZXZlbDogc3RyaW5nO1xuICBhbGlnbm1lbnQ6IHN0cmluZztcbiAgc291cmNlOiBzdHJpbmc7XG4gIHRhZ3M6IHN0cmluZ1tdO1xuICBmcm9udG1hdHRlcjogUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG59O1xuXG5mdW5jdGlvbiBleHRyYWN0RnJvbnRtYXR0ZXIoY29udGVudDogc3RyaW5nKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCBudWxsIHtcbiAgY29uc3QgbWF0Y2ggPSBjb250ZW50Lm1hdGNoKC9eLS0tXFxuKFtcXHNcXFNdKj8pXFxuLS0tLyk7XG4gIGlmICghbWF0Y2gpIHJldHVybiBudWxsO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgcGFyc2VkID0gcGFyc2VZYW1sKG1hdGNoWzFdKTtcbiAgICBpZiAoIXBhcnNlZCB8fCB0eXBlb2YgcGFyc2VkICE9PSBcIm9iamVjdFwiKSByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4gcGFyc2VkIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJTaGFkb3dkYXJrIFN0YXRibG9ja3MgZnJvbnRtYXR0ZXIgcGFyc2UgZXJyb3I6XCIsIGVycm9yKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0U3VnZ2VzdGVkVGFncyhcbiAgYXBwOiBBcHAsXG4gIG1vbnN0ZXJGb2xkZXI6IHN0cmluZ1xuKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICBjb25zdCBmb2xkZXJQYXRoID0gbm9ybWFsaXplUGF0aChtb25zdGVyRm9sZGVyKTtcbiAgY29uc3QgZmlsZXMgPSBhcHAudmF1bHRcbiAgICAuZ2V0TWFya2Rvd25GaWxlcygpXG4gICAgLmZpbHRlcihcbiAgICAgIChmaWxlKSA9PlxuICAgICAgICBmaWxlLnBhdGguc3RhcnRzV2l0aChgJHtmb2xkZXJQYXRofS9gKSB8fCBmaWxlLnBhdGggPT09IGAke2ZvbGRlclBhdGh9Lm1kYFxuICAgICk7XG5cbiAgY29uc3QgdGFncyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xuICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBhcHAudmF1bHQucmVhZChmaWxlKTtcbiAgICBjb25zdCBmcm9udG1hdHRlciA9IGV4dHJhY3RGcm9udG1hdHRlcihjb250ZW50KTtcblxuICAgIGlmICghZnJvbnRtYXR0ZXIgfHwgZnJvbnRtYXR0ZXIuc2hhZG93ZGFya1R5cGUgIT09IFwibW9uc3RlclwiKSBjb250aW51ZTtcblxuICAgIGNvbnN0IHJhd1RhZ3MgPSBmcm9udG1hdHRlci50YWdzO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHJhd1RhZ3MpKSB7XG4gICAgICBmb3IgKGNvbnN0IHRhZyBvZiByYXdUYWdzKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdGFnID09PSBcInN0cmluZ1wiICYmIHRhZy50cmltKCkpIHtcbiAgICAgICAgICB0YWdzLmFkZCh0YWcudHJpbSgpLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFsuLi50YWdzXS5zb3J0KChhLCBiKSA9PiBhLmxvY2FsZUNvbXBhcmUoYikpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0U3VnZ2VzdGVkT3RoZXJTb3VyY2VzKFxuICBhcHA6IEFwcCxcbiAgbW9uc3RlckZvbGRlcjogc3RyaW5nXG4pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gIGNvbnN0IGZvbGRlclBhdGggPSBub3JtYWxpemVQYXRoKG1vbnN0ZXJGb2xkZXIpO1xuICBjb25zdCBmaWxlcyA9IGFwcC52YXVsdFxuICAgIC5nZXRNYXJrZG93bkZpbGVzKClcbiAgICAuZmlsdGVyKFxuICAgICAgKGZpbGUpID0+XG4gICAgICAgIGZpbGUucGF0aC5zdGFydHNXaXRoKGAke2ZvbGRlclBhdGh9L2ApIHx8IGZpbGUucGF0aCA9PT0gYCR7Zm9sZGVyUGF0aH0ubWRgXG4gICAgKTtcblxuICBjb25zdCBidWlsdEluU291cmNlcyA9IG5ldyBTZXQoW1xuICAgIFwiQ29yZSBSdWxlc1wiLFxuICAgIFwiQ3Vyc2VkIFNjcm9sbCAxXCIsXG4gICAgXCJDdXJzZWQgU2Nyb2xsIDJcIixcbiAgICBcIkN1cnNlZCBTY3JvbGwgM1wiLFxuICAgIFwiSG9tZWJyZXdcIixcbiAgICBcIk90aGVyXCJcbiAgXSk7XG5cbiAgY29uc3Qgc291cmNlcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xuICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBhcHAudmF1bHQucmVhZChmaWxlKTtcbiAgICBjb25zdCBmcm9udG1hdHRlciA9IGV4dHJhY3RGcm9udG1hdHRlcihjb250ZW50KTtcblxuICAgIGlmICghZnJvbnRtYXR0ZXIgfHwgZnJvbnRtYXR0ZXIuc2hhZG93ZGFya1R5cGUgIT09IFwibW9uc3RlclwiKSBjb250aW51ZTtcblxuICAgIGNvbnN0IHJhd1NvdXJjZSA9IGZyb250bWF0dGVyLnNvdXJjZTtcbiAgICBpZiAodHlwZW9mIHJhd1NvdXJjZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgY29uc3Qgc291cmNlID0gcmF3U291cmNlLnRyaW0oKTtcbiAgICAgIGlmIChzb3VyY2UgJiYgIWJ1aWx0SW5Tb3VyY2VzLmhhcyhzb3VyY2UpKSB7XG4gICAgICAgIHNvdXJjZXMuYWRkKHNvdXJjZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFsuLi5zb3VyY2VzXS5zb3J0KChhLCBiKSA9PiBhLmxvY2FsZUNvbXBhcmUoYikpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0QWxsTW9uc3RlckluZGV4RW50cmllcyhcbiAgYXBwOiBBcHAsXG4gIG1vbnN0ZXJGb2xkZXI6IHN0cmluZ1xuKTogUHJvbWlzZTxNb25zdGVySW5kZXhFbnRyeVtdPiB7XG4gIGNvbnN0IGZvbGRlclBhdGggPSBub3JtYWxpemVQYXRoKG1vbnN0ZXJGb2xkZXIpO1xuXG4gIGNvbnN0IGZpbGVzID0gYXBwLnZhdWx0XG4gICAgLmdldE1hcmtkb3duRmlsZXMoKVxuICAgIC5maWx0ZXIoXG4gICAgICAoZmlsZSkgPT5cbiAgICAgICAgZmlsZS5wYXRoLnN0YXJ0c1dpdGgoYCR7Zm9sZGVyUGF0aH0vYCkgfHwgZmlsZS5wYXRoID09PSBgJHtmb2xkZXJQYXRofS5tZGBcbiAgICApO1xuXG4gIGNvbnN0IHJlc3VsdHM6IE1vbnN0ZXJJbmRleEVudHJ5W10gPSBbXTtcblxuICBmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZXMpIHtcbiAgICBjb25zdCBjYWNoZSA9IGFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmaWxlKTtcbiAgICBjb25zdCBmcm9udG1hdHRlciA9IGNhY2hlPy5mcm9udG1hdHRlciBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHVuZGVmaW5lZDtcblxuICAgIGlmICghZnJvbnRtYXR0ZXIgfHwgZnJvbnRtYXR0ZXIuc2hhZG93ZGFya1R5cGUgIT09IFwibW9uc3RlclwiKSBjb250aW51ZTtcblxuICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICBmaWxlLFxuICAgICAgbmFtZTogdHlwZW9mIGZyb250bWF0dGVyLm5hbWUgPT09IFwic3RyaW5nXCIgPyBmcm9udG1hdHRlci5uYW1lIDogZmlsZS5iYXNlbmFtZSxcbiAgICAgIGxldmVsOiBmcm9udG1hdHRlci5sZXZlbCAhPSBudWxsID8gU3RyaW5nKGZyb250bWF0dGVyLmxldmVsKSA6IFwiXCIsXG4gICAgICBhbGlnbm1lbnQ6XG4gICAgICAgIHR5cGVvZiBmcm9udG1hdHRlci5hbGlnbm1lbnQgPT09IFwic3RyaW5nXCIgPyBmcm9udG1hdHRlci5hbGlnbm1lbnQgOiBcIlwiLFxuICAgICAgc291cmNlOiB0eXBlb2YgZnJvbnRtYXR0ZXIuc291cmNlID09PSBcInN0cmluZ1wiID8gZnJvbnRtYXR0ZXIuc291cmNlIDogXCJcIixcbiAgICAgIHRhZ3M6IEFycmF5LmlzQXJyYXkoZnJvbnRtYXR0ZXIudGFncylcbiAgICAgICAgPyBmcm9udG1hdHRlci50YWdzLmZpbHRlcigodCk6IHQgaXMgc3RyaW5nID0+IHR5cGVvZiB0ID09PSBcInN0cmluZ1wiKVxuICAgICAgICA6IFtdLFxuICAgICAgZnJvbnRtYXR0ZXJcbiAgICB9KTtcbiAgfVxuXG4gIHJlc3VsdHMuc29ydCgoYSwgYikgPT4gYS5uYW1lLmxvY2FsZUNvbXBhcmUoYi5uYW1lKSk7XG4gIHJldHVybiByZXN1bHRzO1xufSIsICJleHBvcnQgaW50ZXJmYWNlIFNoYWRvd2RhcmtTdGF0YmxvY2tzU2V0dGluZ3Mge1xuICBjb21wYWN0TW9kZTogYm9vbGVhbjtcbiAgc2hvd1NvdXJjZTogYm9vbGVhbjtcbiAgc2hvd1RhZ3M6IGJvb2xlYW47XG4gIHJlbmRlckZyb250bWF0dGVyTW9uc3RlcnM6IGJvb2xlYW47XG4gIG1vbnN0ZXJGb2xkZXI6IHN0cmluZztcbiAgaGlkZU1vbnN0ZXJQcm9wZXJ0aWVzOiBib29sZWFuO1xuICBsYXN0VXNlZE1vbnN0ZXJTb3VyY2U6IHN0cmluZztcbn1cblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfU0VUVElOR1M6IFNoYWRvd2RhcmtTdGF0YmxvY2tzU2V0dGluZ3MgPSB7XG4gIGNvbXBhY3RNb2RlOiBmYWxzZSxcbiAgc2hvd1NvdXJjZTogdHJ1ZSxcbiAgc2hvd1RhZ3M6IHRydWUsXG4gIHJlbmRlckZyb250bWF0dGVyTW9uc3RlcnM6IHRydWUsXG4gIG1vbnN0ZXJGb2xkZXI6IFwiU2hhZG93ZGFyay9Nb25zdGVyc1wiLFxuICBoaWRlTW9uc3RlclByb3BlcnRpZXM6IHRydWUsXG4gIGxhc3RVc2VkTW9uc3RlclNvdXJjZTogXCJcIixcbn07IiwgImltcG9ydCB7IHBhcnNlWWFtbCB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgUGFyc2VSZXN1bHQsIFNoYWRvd2RhcmtNb25zdGVyIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBub3JtYWxpemVNb25zdGVyIH0gZnJvbSBcIi4vbm9ybWFsaXplTW9uc3RlclwiO1xuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VDb2RlQmxvY2soc291cmNlOiBzdHJpbmcpOiBQYXJzZVJlc3VsdDxTaGFkb3dkYXJrTW9uc3Rlcj4ge1xuICBjb25zdCBlcnJvcnM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IHdhcm5pbmdzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgcGFyc2VkID0gcGFyc2VZYW1sKHNvdXJjZSk7XG5cbiAgICBpZiAoIXBhcnNlZCB8fCB0eXBlb2YgcGFyc2VkICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgZXJyb3JzOiBbXCJDb2RlIGJsb2NrIGRpZCBub3QgY29udGFpbiBhIHZhbGlkIFlBTUwgb2JqZWN0LlwiXSxcbiAgICAgICAgd2FybmluZ3NcbiAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc3QgbW9uc3RlciA9IG5vcm1hbGl6ZU1vbnN0ZXIocGFyc2VkIGFzIFBhcnRpYWw8U2hhZG93ZGFya01vbnN0ZXI+KTtcblxuICAgIGlmICghbW9uc3Rlci5uYW1lIHx8IG1vbnN0ZXIubmFtZSA9PT0gXCJVbm5hbWVkIE1vbnN0ZXJcIikge1xuICAgICAgd2FybmluZ3MucHVzaChcIk1vbnN0ZXIgaXMgbWlzc2luZyBhIG5hbWUuXCIpO1xuICAgIH1cblxuICAgIGlmICghbW9uc3Rlci5hYyB8fCBtb25zdGVyLmFjID09PSBcIj9cIikge1xuICAgICAgd2FybmluZ3MucHVzaChcIk1vbnN0ZXIgaXMgbWlzc2luZyBBQy5cIik7XG4gICAgfVxuXG4gICAgaWYgKCFtb25zdGVyLmhwIHx8IG1vbnN0ZXIuaHAgPT09IFwiP1wiKSB7XG4gICAgICB3YXJuaW5ncy5wdXNoKFwiTW9uc3RlciBpcyBtaXNzaW5nIEhQLlwiKTtcbiAgICB9XG5cbiAgICBpZiAobW9uc3Rlci5hdGsubGVuZ3RoID09PSAwKSB7XG4gICAgICB3YXJuaW5ncy5wdXNoKFwiTW9uc3RlciBoYXMgbm8gYXR0YWNrcyBsaXN0ZWQuXCIpO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgZGF0YTogbW9uc3RlcixcbiAgICAgIGVycm9ycyxcbiAgICAgIHdhcm5pbmdzXG4gICAgfTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zdCBtZXNzYWdlID1cbiAgICAgIGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogXCJVbmtub3duIHBhcnNlIGVycm9yLlwiO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgZXJyb3JzOiBbYFlBTUwgcGFyc2UgZXJyb3I6ICR7bWVzc2FnZX1gXSxcbiAgICAgIHdhcm5pbmdzXG4gICAgfTtcbiAgfVxufSIsICJpbXBvcnQgeyBTaGFkb3dkYXJrQXR0YWNrLCBTaGFkb3dkYXJrTW9uc3RlciB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG50eXBlIExvb3NlTW9uc3RlciA9IFJlY29yZDxzdHJpbmcsIHVua25vd24+ICYge1xuICBuYW1lPzogdW5rbm93bjtcbiAgbGV2ZWw/OiB1bmtub3duO1xuICBhbGlnbm1lbnQ/OiB1bmtub3duO1xuICB0eXBlPzogdW5rbm93bjtcbiAgYWM/OiB1bmtub3duO1xuICBocD86IHVua25vd247XG4gIG12PzogdW5rbm93bjtcbiAgYXRrPzogdW5rbm93bjtcbiAgc3RhdHM/OiB1bmtub3duO1xuICBzdHI/OiB1bmtub3duO1xuICBkZXg/OiB1bmtub3duO1xuICBjb24/OiB1bmtub3duO1xuICBpbnQ/OiB1bmtub3duO1xuICB3aXM/OiB1bmtub3duO1xuICBjaGE/OiB1bmtub3duO1xuICB0cmFpdHM/OiB1bmtub3duO1xuICBzcGVjaWFscz86IHVua25vd247XG4gIHNwZWxscz86IHVua25vd247XG4gIGdlYXI/OiB1bmtub3duO1xuICBkZXNjcmlwdGlvbj86IHVua25vd247XG4gIHNvdXJjZT86IHVua25vd247XG4gIHRhZ3M/OiB1bmtub3duO1xufTtcblxuZnVuY3Rpb24gYXNTdHJpbmcodmFsdWU6IHVua25vd24sIGZhbGxiYWNrID0gXCJcIik6IHN0cmluZyB7XG4gIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gZmFsbGJhY2s7XG4gIHJldHVybiBTdHJpbmcodmFsdWUpLnRyaW0oKTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplTW9kaWZpZXIodmFsdWU6IHVua25vd24sIGZhbGxiYWNrID0gXCIrMFwiKTogc3RyaW5nIHtcbiAgY29uc3QgcmF3ID0gYXNTdHJpbmcodmFsdWUsIGZhbGxiYWNrKTtcbiAgaWYgKCFyYXcpIHJldHVybiBmYWxsYmFjaztcbiAgaWYgKC9eWystXVxcZCskLy50ZXN0KHJhdykpIHJldHVybiByYXc7XG4gIGlmICgvXlxcZCskLy50ZXN0KHJhdykpIHJldHVybiBgKyR7cmF3fWA7XG4gIGlmICgvXi1cXGQrJC8udGVzdChyYXcpKSByZXR1cm4gcmF3O1xuICByZXR1cm4gcmF3O1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVTdHJpbmdBcnJheSh2YWx1ZTogdW5rbm93bik6IHN0cmluZ1tdIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlLm1hcCgoaXRlbSkgPT4gYXNTdHJpbmcoaXRlbSkpLmZpbHRlcihCb29sZWFuKTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIpIHtcbiAgICByZXR1cm4gdmFsdWVcbiAgICAgIC5zcGxpdChcIlxcblwiKVxuICAgICAgLm1hcCgobGluZSkgPT4gbGluZS50cmltKCkpXG4gICAgICAuZmlsdGVyKEJvb2xlYW4pO1xuICB9XG5cbiAgcmV0dXJuIFtdO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVBdHRhY2soaXRlbTogdW5rbm93bik6IFNoYWRvd2RhcmtBdHRhY2sgfCBudWxsIHtcbiAgaWYgKHR5cGVvZiBpdGVtID09PSBcInN0cmluZ1wiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWU6IGl0ZW0udHJpbSgpLFxuICAgICAgcmF3OiBpdGVtLnRyaW0oKVxuICAgIH07XG4gIH1cblxuICBpZiAoaXRlbSAmJiB0eXBlb2YgaXRlbSA9PT0gXCJvYmplY3RcIikge1xuICAgIGNvbnN0IG9iaiA9IGl0ZW0gYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG4gICAgY29uc3QgbmFtZSA9IGFzU3RyaW5nKG9iai5uYW1lKTtcbiAgICBpZiAoIW5hbWUpIHJldHVybiBudWxsO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWUsXG4gICAgICBib251czogYXNTdHJpbmcob2JqLmJvbnVzKSxcbiAgICAgIGRhbWFnZTogYXNTdHJpbmcob2JqLmRhbWFnZSksXG4gICAgICByYW5nZTogYXNTdHJpbmcob2JqLnJhbmdlKSxcbiAgICAgIG5vdGVzOiBhc1N0cmluZyhvYmoubm90ZXMpXG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVBdHRhY2tzKHZhbHVlOiB1bmtub3duKTogU2hhZG93ZGFya0F0dGFja1tdIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlXG4gICAgICAubWFwKG5vcm1hbGl6ZUF0dGFjaylcbiAgICAgIC5maWx0ZXIoKGEpOiBhIGlzIFNoYWRvd2RhcmtBdHRhY2sgPT4gYSAhPT0gbnVsbCk7XG4gIH1cblxuICBpZiAodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiICYmIHZhbHVlLnRyaW0oKSkge1xuICAgIHJldHVybiBbeyBuYW1lOiB2YWx1ZS50cmltKCksIHJhdzogdmFsdWUudHJpbSgpIH1dO1xuICB9XG5cbiAgcmV0dXJuIFtdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplTW9uc3RlcihpbnB1dDogTG9vc2VNb25zdGVyKTogU2hhZG93ZGFya01vbnN0ZXIge1xuICBjb25zdCBuZXN0ZWRTdGF0cyA9IChpbnB1dC5zdGF0cyBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHVuZGVmaW5lZCkgPz8ge307XG5cbiAgY29uc3Qgc3RyVmFsdWUgPSBpbnB1dC5zdHIgPz8gbmVzdGVkU3RhdHMuc3RyO1xuICBjb25zdCBkZXhWYWx1ZSA9IGlucHV0LmRleCA/PyBuZXN0ZWRTdGF0cy5kZXg7XG4gIGNvbnN0IGNvblZhbHVlID0gaW5wdXQuY29uID8/IG5lc3RlZFN0YXRzLmNvbjtcbiAgY29uc3QgaW50VmFsdWUgPSBpbnB1dC5pbnQgPz8gbmVzdGVkU3RhdHMuaW50O1xuICBjb25zdCB3aXNWYWx1ZSA9IGlucHV0LndpcyA/PyBuZXN0ZWRTdGF0cy53aXM7XG4gIGNvbnN0IGNoYVZhbHVlID0gaW5wdXQuY2hhID8/IG5lc3RlZFN0YXRzLmNoYTtcblxuICByZXR1cm4ge1xuICAgIG5hbWU6IGFzU3RyaW5nKGlucHV0Lm5hbWUsIFwiVW5uYW1lZCBNb25zdGVyXCIpLFxuICAgIGxldmVsOiBhc1N0cmluZyhpbnB1dC5sZXZlbCwgXCI/XCIpLFxuICAgIGFsaWdubWVudDogYXNTdHJpbmcoaW5wdXQuYWxpZ25tZW50LCBcIlwiKSxcbiAgICB0eXBlOiBhc1N0cmluZyhpbnB1dC50eXBlLCBcIlwiKSxcbiAgICBhYzogYXNTdHJpbmcoaW5wdXQuYWMsIFwiP1wiKSxcbiAgICBocDogYXNTdHJpbmcoaW5wdXQuaHAsIFwiP1wiKSxcbiAgICBtdjogYXNTdHJpbmcoaW5wdXQubXYsIFwiXCIpLFxuICAgIGF0azogbm9ybWFsaXplQXR0YWNrcyhpbnB1dC5hdGspLFxuICAgIHN0YXRzOiB7XG4gICAgICBzdHI6IG5vcm1hbGl6ZU1vZGlmaWVyKHN0clZhbHVlLCBcIiswXCIpLFxuICAgICAgZGV4OiBub3JtYWxpemVNb2RpZmllcihkZXhWYWx1ZSwgXCIrMFwiKSxcbiAgICAgIGNvbjogbm9ybWFsaXplTW9kaWZpZXIoY29uVmFsdWUsIFwiKzBcIiksXG4gICAgICBpbnQ6IG5vcm1hbGl6ZU1vZGlmaWVyKGludFZhbHVlLCBcIiswXCIpLFxuICAgICAgd2lzOiBub3JtYWxpemVNb2RpZmllcih3aXNWYWx1ZSwgXCIrMFwiKSxcbiAgICAgIGNoYTogbm9ybWFsaXplTW9kaWZpZXIoY2hhVmFsdWUsIFwiKzBcIilcbiAgICB9LFxuICAgIHRyYWl0czogbm9ybWFsaXplU3RyaW5nQXJyYXkoaW5wdXQudHJhaXRzKSxcbiAgICBzcGVjaWFsczogbm9ybWFsaXplU3RyaW5nQXJyYXkoaW5wdXQuc3BlY2lhbHMpLFxuICAgIHNwZWxsczogbm9ybWFsaXplU3RyaW5nQXJyYXkoaW5wdXQuc3BlbGxzKSxcbiAgICBnZWFyOiBub3JtYWxpemVTdHJpbmdBcnJheShpbnB1dC5nZWFyKSxcbiAgICBkZXNjcmlwdGlvbjogYXNTdHJpbmcoaW5wdXQuZGVzY3JpcHRpb24sIFwiXCIpLFxuICAgIHNvdXJjZTogYXNTdHJpbmcoaW5wdXQuc291cmNlLCBcIlwiKSxcbiAgICB0YWdzOiBub3JtYWxpemVTdHJpbmdBcnJheShpbnB1dC50YWdzKVxuICB9O1xufSIsICJpbXBvcnQgeyBQYXJzZVJlc3VsdCwgU2hhZG93ZGFya01vbnN0ZXIgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZU1vbnN0ZXIgfSBmcm9tIFwiLi9ub3JtYWxpemVNb25zdGVyXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUZyb250bWF0dGVyKFxuICBmcm9udG1hdHRlcjogUmVjb3JkPHN0cmluZywgdW5rbm93bj5cbik6IFBhcnNlUmVzdWx0PFNoYWRvd2RhcmtNb25zdGVyPiB7XG4gIGNvbnN0IGVycm9yczogc3RyaW5nW10gPSBbXTtcbiAgY29uc3Qgd2FybmluZ3M6IHN0cmluZ1tdID0gW107XG5cbiAgaWYgKCFmcm9udG1hdHRlciB8fCB0eXBlb2YgZnJvbnRtYXR0ZXIgIT09IFwib2JqZWN0XCIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBlcnJvcnM6IFtcIk5vIHZhbGlkIGZyb250bWF0dGVyIGZvdW5kLlwiXSxcbiAgICAgIHdhcm5pbmdzXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IG1vbnN0ZXIgPSBub3JtYWxpemVNb25zdGVyKGZyb250bWF0dGVyIGFzIFBhcnRpYWw8U2hhZG93ZGFya01vbnN0ZXI+KTtcblxuICBpZiAoIW1vbnN0ZXIubmFtZSB8fCBtb25zdGVyLm5hbWUgPT09IFwiVW5uYW1lZCBNb25zdGVyXCIpIHtcbiAgICB3YXJuaW5ncy5wdXNoKFwiTW9uc3RlciBpcyBtaXNzaW5nIGEgbmFtZS5cIik7XG4gIH1cblxuICBpZiAoIW1vbnN0ZXIuYWMgfHwgbW9uc3Rlci5hYyA9PT0gXCI/XCIpIHtcbiAgICB3YXJuaW5ncy5wdXNoKFwiTW9uc3RlciBpcyBtaXNzaW5nIEFDLlwiKTtcbiAgfVxuXG4gIGlmICghbW9uc3Rlci5ocCB8fCBtb25zdGVyLmhwID09PSBcIj9cIikge1xuICAgIHdhcm5pbmdzLnB1c2goXCJNb25zdGVyIGlzIG1pc3NpbmcgSFAuXCIpO1xuICB9XG5cbiAgaWYgKG1vbnN0ZXIuYXRrLmxlbmd0aCA9PT0gMCkge1xuICAgIHdhcm5pbmdzLnB1c2goXCJNb25zdGVyIGhhcyBubyBhdHRhY2tzIGxpc3RlZC5cIik7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgZGF0YTogbW9uc3RlcixcbiAgICBlcnJvcnMsXG4gICAgd2FybmluZ3NcbiAgfTtcbn0iLCAiaW1wb3J0IHsgUGFyc2VSZXN1bHQsIFNoYWRvd2RhcmtNb25zdGVyIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBub3JtYWxpemVNb25zdGVyIH0gZnJvbSBcIi4vbm9ybWFsaXplTW9uc3RlclwiO1xuXG5mdW5jdGlvbiBub3JtYWxpemVQYXN0ZWRUZXh0KHNvdXJjZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHNvdXJjZVxuICAgIC5yZXBsYWNlKC9cXHIvZywgXCJcXG5cIilcbiAgICAucmVwbGFjZSgvW1x1MjAxM1x1MjAxNF0vZywgXCItXCIpXG4gICAgLnJlcGxhY2UoL1xcdTAwQTAvZywgXCIgXCIpXG4gICAgLnJlcGxhY2UoL2AoW15gXSspYC9nLCBcIiQxXCIpXG4gICAgLnJlcGxhY2UoLyhcXCpcXCp8X18pKC4qPylcXDEvZywgXCIkMlwiKVxuICAgIC5yZXBsYWNlKC8oXFwqfF8pKC4qPylcXDEvZywgXCIkMlwiKVxuICAgIC5yZXBsYWNlKC9bIFxcdF0rL2csIFwiIFwiKVxuICAgIC5yZXBsYWNlKC9cXG4rL2csIFwiXFxuXCIpXG4gICAgLnRyaW0oKTtcbn1cblxuZnVuY3Rpb24gY2xlYW5JbmxpbmUodGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRleHQucmVwbGFjZSgvXFxzKy9nLCBcIiBcIikudHJpbSgpO1xufVxuXG5mdW5jdGlvbiBleHRyYWN0VmFsdWUodGV4dDogc3RyaW5nLCBwYXR0ZXJuOiBSZWdFeHApOiBzdHJpbmcge1xuICBjb25zdCBtYXRjaCA9IHRleHQubWF0Y2gocGF0dGVybik7XG4gIHJldHVybiBtYXRjaD8uWzFdPy50cmltKCkgPz8gXCJcIjtcbn1cblxuZnVuY3Rpb24gcGFyc2VBYmlsaXRpZXModGV4dDogc3RyaW5nKTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB7XG4gIGNvbnN0IHJlc3VsdDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuXG4gIGNvbnN0IHBhdHRlcm5zOiBBcnJheTxbc3RyaW5nLCBSZWdFeHBdPiA9IFtcbiAgICBbXCJzdHJcIiwgL1xcYlNcXHMqKFsrLV0/XFxkKylcXGIvaV0sXG4gICAgW1wiZGV4XCIsIC9cXGJEXFxzKihbKy1dP1xcZCspXFxiL2ldLFxuICAgIFtcImNvblwiLCAvXFxiQ1xccyooWystXT9cXGQrKVxcYi9pXSxcbiAgICBbXCJpbnRcIiwgL1xcYklcXHMqKFsrLV0/XFxkKylcXGIvaV0sXG4gICAgW1wid2lzXCIsIC9cXGJXXFxzKihbKy1dP1xcZCspXFxiL2ldLFxuICAgIFtcImNoYVwiLCAvXFxiQ2hcXHMqKFsrLV0/XFxkKylcXGIvaV1cbiAgXTtcblxuICBmb3IgKGNvbnN0IFtrZXksIHJlZ2V4XSBvZiBwYXR0ZXJucykge1xuICAgIGNvbnN0IG1hdGNoID0gdGV4dC5tYXRjaChyZWdleCk7XG4gICAgaWYgKG1hdGNoPy5bMV0pIHtcbiAgICAgIGNvbnN0IHJhdyA9IG1hdGNoWzFdLnRyaW0oKTtcbiAgICAgIHJlc3VsdFtrZXldID0gL15bKy1dLy50ZXN0KHJhdykgPyByYXcgOiBgKyR7cmF3fWA7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gcGFyc2VBdHRhY2tzKHN0YXRUZXh0OiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGlubGluZSA9IGNsZWFuSW5saW5lKHN0YXRUZXh0KTtcblxuICBjb25zdCBhdGtNYXRjaCA9IGlubGluZS5tYXRjaChcbiAgICAvXFxiQVRLXFxiXFxzKiguKj8pKD89LFxccypNVlxcYnwsXFxzKlNcXGJ8LFxccypEXFxifCxcXHMqQ1xcYnwsXFxzKklcXGJ8LFxccypXXFxifCxcXHMqQ2hcXGJ8LFxccypBTFxcYnwsXFxzKkxWXFxifCQpL2lcbiAgKTtcbiAgaWYgKCFhdGtNYXRjaD8uWzFdKSByZXR1cm4gW107XG5cbiAgY29uc3QgYXRrVGV4dCA9IGF0a01hdGNoWzFdLnRyaW0oKTtcbiAgY29uc3QgcGFydHMgPSBhdGtUZXh0LnNwbGl0KC9cXHMrKGFuZHxvcilcXHMrL2kpO1xuXG4gIGNvbnN0IGF0dGFja3M6IHN0cmluZ1tdID0gW107XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHBhcnQgPSBwYXJ0c1tpXS50cmltKCk7XG4gICAgaWYgKCFwYXJ0KSBjb250aW51ZTtcblxuICAgIGlmIChpID09PSAwKSB7XG4gICAgICBhdHRhY2tzLnB1c2gocGFydCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoaSAlIDIgPT09IDEpIGNvbnRpbnVlO1xuXG4gICAgY29uc3QgY29ubmVjdG9yID0gcGFydHNbaSAtIDFdPy50cmltKCkudG9VcHBlckNhc2UoKTtcbiAgICBpZiAoY29ubmVjdG9yID09PSBcIkFORFwiIHx8IGNvbm5lY3RvciA9PT0gXCJPUlwiKSB7XG4gICAgICBhdHRhY2tzLnB1c2goYCR7Y29ubmVjdG9yfSAke3BhcnR9YCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGF0dGFja3MucHVzaChwYXJ0KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYXR0YWNrcztcbn1cblxuZnVuY3Rpb24gc3BsaXRTZWN0aW9ucyhzb3VyY2U6IHN0cmluZyk6IHtcbiAgbGVhZFRleHQ6IHN0cmluZztcbiAgc3RhdFRleHQ6IHN0cmluZztcbiAgdHJhaWxpbmdUZXh0OiBzdHJpbmc7XG59IHwgbnVsbCB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVQYXN0ZWRUZXh0KHNvdXJjZSk7XG5cbiAgY29uc3QgYWNJbmRleCA9IG5vcm1hbGl6ZWQuc2VhcmNoKC9cXGJBQ1xcYi9pKTtcbiAgaWYgKGFjSW5kZXggPCAwKSByZXR1cm4gbnVsbDtcblxuICBjb25zdCBsZWFkVGV4dCA9IG5vcm1hbGl6ZWQuc2xpY2UoMCwgYWNJbmRleCkudHJpbSgpO1xuICBjb25zdCBhZnRlckxlYWQgPSBub3JtYWxpemVkLnNsaWNlKGFjSW5kZXgpLnRyaW0oKTtcblxuICBjb25zdCBsdk1hdGNoID0gYWZ0ZXJMZWFkLm1hdGNoKC9cXGJMVlxcYlxccyooW15cXHMsLjtdKykvaSk7XG4gIGlmICghbHZNYXRjaCB8fCBsdk1hdGNoLmluZGV4ID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbGVhZFRleHQsXG4gICAgICBzdGF0VGV4dDogYWZ0ZXJMZWFkLFxuICAgICAgdHJhaWxpbmdUZXh0OiBcIlwiXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IGx2U3RhcnQgPSBsdk1hdGNoLmluZGV4O1xuICBjb25zdCBsdkZ1bGwgPSBsdk1hdGNoWzBdO1xuICBjb25zdCBsdkVuZCA9IGx2U3RhcnQgKyBsdkZ1bGwubGVuZ3RoO1xuXG4gIHJldHVybiB7XG4gICAgbGVhZFRleHQsXG4gICAgc3RhdFRleHQ6IGFmdGVyTGVhZC5zbGljZSgwLCBsdkVuZCkudHJpbSgpLFxuICAgIHRyYWlsaW5nVGV4dDogYWZ0ZXJMZWFkLnNsaWNlKGx2RW5kKS50cmltKClcbiAgfTtcbn1cblxuZnVuY3Rpb24gbG9va3NMaWtlVHJhaWxpbmdOYW1lTGluZShsaW5lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgY2xlYW5lZCA9IGNsZWFuSW5saW5lKGxpbmUpO1xuICBpZiAoIWNsZWFuZWQpIHJldHVybiBmYWxzZTtcblxuICBjb25zdCB3b3JkcyA9IGNsZWFuZWQuc3BsaXQoL1xccysvKS5maWx0ZXIoQm9vbGVhbik7XG4gIGlmICh3b3Jkcy5sZW5ndGggPT09IDAgfHwgd29yZHMubGVuZ3RoID4gNSkgcmV0dXJuIGZhbHNlO1xuXG4gIHJldHVybiB3b3Jkcy5ldmVyeSgod29yZCkgPT4gL15bQS1aXVtBLVosJy1dKiQvLnRlc3Qod29yZCkpO1xufVxuXG5mdW5jdGlvbiBzcGxpdExlYWRUZXh0KGxlYWRUZXh0OiBzdHJpbmcpOiB7IG5hbWU6IHN0cmluZzsgZGVzY3JpcHRpb246IHN0cmluZyB9IHtcbiAgY29uc3Qgb3JpZ2luYWxMaW5lcyA9IGxlYWRUZXh0XG4gICAgLnNwbGl0KC9cXG4rLylcbiAgICAubWFwKChsaW5lKSA9PiBjbGVhbklubGluZShsaW5lKSlcbiAgICAuZmlsdGVyKEJvb2xlYW4pO1xuXG4gIGlmIChvcmlnaW5hbExpbmVzLmxlbmd0aCA+PSAyKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWU6IG9yaWdpbmFsTGluZXNbMF0sXG4gICAgICBkZXNjcmlwdGlvbjogY2xlYW5JbmxpbmUob3JpZ2luYWxMaW5lcy5zbGljZSgxKS5qb2luKFwiIFwiKSlcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgbGVhZCA9IGNsZWFuSW5saW5lKGxlYWRUZXh0KTtcbiAgaWYgKCFsZWFkKSB7XG4gICAgcmV0dXJuIHsgbmFtZTogXCJcIiwgZGVzY3JpcHRpb246IFwiXCIgfTtcbiAgfVxuXG4gIGNvbnN0IGNhcHNNYXRjaCA9IGxlYWQubWF0Y2goL14oW0EtWl1bQS1aMC05JyAtXXsyLH0/KSg/PVxccytbQS1aXT9bYS16XSkvKTtcbiAgaWYgKGNhcHNNYXRjaCkge1xuICAgIGNvbnN0IG5hbWUgPSBjYXBzTWF0Y2hbMV0udHJpbSgpO1xuICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gbGVhZC5zbGljZShjYXBzTWF0Y2hbMF0ubGVuZ3RoKS50cmltKCk7XG4gICAgcmV0dXJuIHsgbmFtZSwgZGVzY3JpcHRpb24gfTtcbiAgfVxuXG4gIHJldHVybiB7IG5hbWU6IFwiXCIsIGRlc2NyaXB0aW9uOiBsZWFkIH07XG59XG5cbmZ1bmN0aW9uIHNwbGl0VHJhaWxpbmdOYW1lKHRyYWlsaW5nVGV4dDogc3RyaW5nKTogeyB0cmFpbGluZ0JvZHk6IHN0cmluZzsgdHJhaWxpbmdOYW1lOiBzdHJpbmcgfSB7XG4gIGNvbnN0IGxpbmVzID0gdHJhaWxpbmdUZXh0XG4gICAgLnNwbGl0KC9cXG4rLylcbiAgICAubWFwKChsaW5lKSA9PiBjbGVhbklubGluZShsaW5lKSlcbiAgICAuZmlsdGVyKEJvb2xlYW4pO1xuXG4gIGlmIChsaW5lcy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4geyB0cmFpbGluZ0JvZHk6IFwiXCIsIHRyYWlsaW5nTmFtZTogXCJcIiB9O1xuICB9XG5cbiAgY29uc3QgbGFzdExpbmUgPSBsaW5lc1tsaW5lcy5sZW5ndGggLSAxXTtcbiAgaWYgKCFsb29rc0xpa2VUcmFpbGluZ05hbWVMaW5lKGxhc3RMaW5lKSkge1xuICAgIHJldHVybiB7IHRyYWlsaW5nQm9keTogdHJhaWxpbmdUZXh0LCB0cmFpbGluZ05hbWU6IFwiXCIgfTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgdHJhaWxpbmdCb2R5OiBsaW5lcy5zbGljZSgwLCAtMSkuam9pbihcIlxcblwiKSxcbiAgICB0cmFpbGluZ05hbWU6IGxhc3RMaW5lXG4gIH07XG59XG5cbmZ1bmN0aW9uIHBhcnNlQWJpbGl0eUVudHJpZXModHJhaWxpbmdUZXh0OiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGNsZWFuZWQgPSBjbGVhbklubGluZSh0cmFpbGluZ1RleHQpO1xuICBpZiAoIWNsZWFuZWQpIHJldHVybiBbXTtcblxuICBjb25zdCBmb3JiaWRkZW5MYWJlbHMgPSBuZXcgU2V0KFtcbiAgICBcIkFDXCIsXG4gICAgXCJIUFwiLFxuICAgIFwiTVZcIixcbiAgICBcIkFMXCIsXG4gICAgXCJMVlwiLFxuICAgIFwiU1RSXCIsXG4gICAgXCJERVhcIixcbiAgICBcIkNPTlwiLFxuICAgIFwiSU5UXCIsXG4gICAgXCJXSVNcIixcbiAgICBcIkNIQVwiLFxuICAgIFwiRENcIlxuICBdKTtcblxuICBmdW5jdGlvbiBpc0FiaWxpdHlMYWJlbChsYWJlbDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgY29uc3Qgc3RyaXBwZWQgPSBsYWJlbC5yZXBsYWNlKC9bLj8hXSskLywgXCJcIikudHJpbSgpO1xuICAgIGlmICghc3RyaXBwZWQpIHJldHVybiBmYWxzZTtcblxuICAgIGNvbnN0IHdvcmRzID0gc3RyaXBwZWQuc3BsaXQoL1xccysvKS5maWx0ZXIoQm9vbGVhbik7XG4gICAgaWYgKHdvcmRzLmxlbmd0aCA9PT0gMCB8fCB3b3Jkcy5sZW5ndGggPiA0KSByZXR1cm4gZmFsc2U7XG5cbiAgICBpZiAod29yZHMubGVuZ3RoID09PSAxICYmIGZvcmJpZGRlbkxhYmVscy5oYXMod29yZHNbMF0udG9VcHBlckNhc2UoKSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gd29yZHMuZXZlcnkoKHdvcmQpID0+IC9eW0EtWl1bYS16MC05Jy1dKiQvLnRlc3Qod29yZCkpO1xuICB9XG5cbiAgY29uc3QgbGFiZWxSZWdleCA9IC8oXnxcXHMpKFtBLVpdW0EtWmEtejAtOSctXSooPzpcXHMrW0EtWl1bQS1aYS16MC05Jy1dKil7MCwzfVsuPyFdKSg/PVxcc3wkKS9nO1xuXG4gIGNvbnN0IHN0YXJ0czogbnVtYmVyW10gPSBbXTtcbiAgbGV0IG1hdGNoOiBSZWdFeHBFeGVjQXJyYXkgfCBudWxsO1xuXG4gIHdoaWxlICgobWF0Y2ggPSBsYWJlbFJlZ2V4LmV4ZWMoY2xlYW5lZCkpICE9PSBudWxsKSB7XG4gICAgY29uc3QgZnVsbE1hdGNoSW5kZXggPSBtYXRjaC5pbmRleCA/PyAwO1xuICAgIGNvbnN0IHByZWZpeCA9IG1hdGNoWzFdID8/IFwiXCI7XG4gICAgY29uc3QgbGFiZWwgPSBtYXRjaFsyXSA/PyBcIlwiO1xuXG4gICAgaWYgKCFpc0FiaWxpdHlMYWJlbChsYWJlbCkpIGNvbnRpbnVlO1xuXG4gICAgY29uc3QgbGFiZWxTdGFydCA9IGZ1bGxNYXRjaEluZGV4ICsgcHJlZml4Lmxlbmd0aDtcbiAgICBzdGFydHMucHVzaChsYWJlbFN0YXJ0KTtcbiAgfVxuXG4gIGlmIChzdGFydHMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIFtjbGVhbmVkXTtcbiAgfVxuXG4gIGNvbnN0IGVudHJpZXM6IHN0cmluZ1tdID0gW107XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBzdGFydCA9IHN0YXJ0c1tpXTtcbiAgICBjb25zdCBlbmQgPSBpICsgMSA8IHN0YXJ0cy5sZW5ndGggPyBzdGFydHNbaSArIDFdIDogY2xlYW5lZC5sZW5ndGg7XG5cbiAgICBjb25zdCBjaHVuayA9IGNsZWFuZWQuc2xpY2Uoc3RhcnQsIGVuZCkudHJpbSgpO1xuICAgIGlmIChjaHVuaykge1xuICAgICAgZW50cmllcy5wdXNoKGNodW5rKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZW50cmllcztcbn1cblxuZnVuY3Rpb24gY2xhc3NpZnlBYmlsaXR5RW50cnkoZW50cnk6IHN0cmluZyk6IFwidHJhaXRcIiB8IFwic3BlY2lhbFwiIHwgXCJzcGVsbFwiIHtcbiAgY29uc3QgbG93ZXIgPSBlbnRyeS50b0xvd2VyQ2FzZSgpO1xuXG4gIGlmICgvJGJlZ2luOm1hdGg6dGV4dCRcXChpbnRcXHx3aXNcXHxjaGFcXClcXFxcc1xcK3NwZWxsJGVuZDptYXRoOnRleHQkL2kudGVzdChlbnRyeSkpIHtcbiAgICByZXR1cm4gXCJzcGVsbFwiO1xuICB9XG5cbiAgY29uc3QgbGFiZWwgPSBlbnRyeS5zcGxpdCgvWy46IT9dLywgMSlbMF0/LnRyaW0oKS50b0xvd2VyQ2FzZSgpID8/IFwiXCI7XG5cbiAgLy8gU3BlbGwtbGlrZSwgZXZlbiBpZiBub3QgZXhwbGljaXRseSBtYXJrZWQgYXMgU3BlbGxcbiAgaWYgKFxuICAgIGxhYmVsID09PSBcImNoYXJtXCIgfHxcbiAgICAvXFxic3BlbGxcXGIvaS50ZXN0KGVudHJ5KVxuICApIHtcbiAgICByZXR1cm4gXCJzcGVsbFwiO1xuICB9XG5cbiAgaWYgKFxuICAgIC9cXGJpbiBwbGFjZSBvZiBhdHRhY2tzXFxiL2kudGVzdChlbnRyeSkgfHxcbiAgICAvXFxidXNlIHR1cm5cXGIvaS50ZXN0KGVudHJ5KSB8fFxuICAgIC9cXGIxXFwvZGF5XFxiL2kudGVzdChlbnRyeSkgfHxcbiAgICAvXFxidGFyZ2V0IHRha2VzXFxiL2kudGVzdChlbnRyeSkgfHxcbiAgICAvXFxidGFyZ2V0IHBlcm1hbmVudGx5IGxvc2VzXFxiL2kudGVzdChlbnRyeSkgfHxcbiAgICAvXFxiaGVhbHNcXGIvaS50ZXN0KGVudHJ5KSB8fFxuICAgIC9cXGJyaXNlcyBhc1xcYi9pLnRlc3QoZW50cnkpIHx8XG4gICAgL1xcYnN1bW1vblxcYi9pLnRlc3QoZW50cnkpIHx8XG4gICAgL1xcYmRjXFxzKlxcZCtcXGIvaS50ZXN0KGVudHJ5KVxuICApIHtcbiAgICByZXR1cm4gXCJzcGVjaWFsXCI7XG4gIH1cblxuICByZXR1cm4gXCJ0cmFpdFwiO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VSYXdTaGFkb3dkYXJrVGV4dChzb3VyY2U6IHN0cmluZyk6IFBhcnNlUmVzdWx0PFNoYWRvd2RhcmtNb25zdGVyPiB7XG4gIGNvbnN0IGVycm9yczogc3RyaW5nW10gPSBbXTtcbiAgY29uc3Qgd2FybmluZ3M6IHN0cmluZ1tdID0gW107XG5cbiAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhc3RlZFRleHQoc291cmNlKTtcbiAgaWYgKCFub3JtYWxpemVkKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgZXJyb3JzOiBbXCJDbGlwYm9hcmQgaXMgZW1wdHkuXCJdLFxuICAgICAgd2FybmluZ3NcbiAgICB9O1xuICB9XG5cbiAgY29uc3Qgc2VjdGlvbnMgPSBzcGxpdFNlY3Rpb25zKG5vcm1hbGl6ZWQpO1xuICBpZiAoIXNlY3Rpb25zKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgZXJyb3JzOiBbXCJDb3VsZCBub3QgZmluZCBhIHN0YXQgYmxvY2sgYmVnaW5uaW5nIHdpdGggQUMuXCJdLFxuICAgICAgd2FybmluZ3NcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgeyBsZWFkVGV4dCwgc3RhdFRleHQsIHRyYWlsaW5nVGV4dCB9ID0gc2VjdGlvbnM7XG4gIGNvbnN0IHN0YXRJbmxpbmUgPSBjbGVhbklubGluZShzdGF0VGV4dCk7XG5cbiAgY29uc3QgdHJhaWxpbmdTcGxpdCA9IHNwbGl0VHJhaWxpbmdOYW1lKHRyYWlsaW5nVGV4dCk7XG4gIGNvbnN0IHsgdHJhaWxpbmdCb2R5LCB0cmFpbGluZ05hbWUgfSA9IHRyYWlsaW5nU3BsaXQ7XG5cbiAgY29uc3QgbGVhZFBhcnNlZCA9IHNwbGl0TGVhZFRleHQobGVhZFRleHQpO1xuXG4gIGNvbnN0IG5hbWUgPSB0cmFpbGluZ05hbWUgfHwgbGVhZFBhcnNlZC5uYW1lO1xuICBjb25zdCBkZXNjcmlwdGlvbiA9IHRyYWlsaW5nTmFtZVxuICAgID8gY2xlYW5JbmxpbmUobGVhZFRleHQpXG4gICAgOiBsZWFkUGFyc2VkLmRlc2NyaXB0aW9uO1xuXG4gIGNvbnN0IGFjID0gZXh0cmFjdFZhbHVlKHN0YXRJbmxpbmUsIC9cXGJBQ1xcYlxccyooW14sXSspL2kpO1xuICBjb25zdCBocCA9IGV4dHJhY3RWYWx1ZShzdGF0SW5saW5lLCAvXFxiSFBcXGJcXHMqKFteLF0rKS9pKTtcbiAgY29uc3QgYWxpZ25tZW50ID0gZXh0cmFjdFZhbHVlKHN0YXRJbmxpbmUsIC9cXGJBTFxcYlxccyooW14sXSspL2kpO1xuICBjb25zdCBsZXZlbCA9IGV4dHJhY3RWYWx1ZShzdGF0SW5saW5lLCAvXFxiTFZcXGJcXHMqKFteXFxzLC47XSspL2kpO1xuXG4gIGNvbnN0IG12TWF0Y2ggPSBzdGF0SW5saW5lLm1hdGNoKFxuICAgIC9cXGJNVlxcYlxccyooLio/KSg/PSxcXHMqU1xcYnwsXFxzKkRcXGJ8LFxccypDXFxifCxcXHMqSVxcYnwsXFxzKldcXGJ8LFxccypDaFxcYnwsXFxzKkFMXFxifCxcXHMqTFZcXGJ8JCkvaVxuICApO1xuICBjb25zdCBtdiA9IG12TWF0Y2g/LlsxXT8udHJpbSgpID8/IFwiXCI7XG5cbiAgY29uc3QgYXR0YWNrcyA9IHBhcnNlQXR0YWNrcyhzdGF0SW5saW5lKTtcbiAgaWYgKGF0dGFja3MubGVuZ3RoID09PSAwKSB7XG4gICAgd2FybmluZ3MucHVzaChcIk5vIGF0dGFja3MgY291bGQgYmUgcGFyc2VkLiBZb3UgbWF5IG5lZWQgdG8gYWRkIHRoZW0gbWFudWFsbHkuXCIpO1xuICB9XG5cbiAgY29uc3QgYWJpbGl0aWVzID0gcGFyc2VBYmlsaXRpZXMoc3RhdElubGluZSk7XG5cbiAgY29uc3QgZW50cmllcyA9IHBhcnNlQWJpbGl0eUVudHJpZXModHJhaWxpbmdCb2R5KTtcblxuICBjb25zdCB0cmFpdHM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IHNwZWNpYWxzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBzcGVsbHM6IHN0cmluZ1tdID0gW107XG5cbiAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XG4gICAgY29uc3Qga2luZCA9IGNsYXNzaWZ5QWJpbGl0eUVudHJ5KGVudHJ5KTtcbiAgICBpZiAoa2luZCA9PT0gXCJzcGVsbFwiKSB7XG4gICAgICBzcGVsbHMucHVzaChlbnRyeSk7XG4gICAgfSBlbHNlIGlmIChraW5kID09PSBcInNwZWNpYWxcIikge1xuICAgICAgc3BlY2lhbHMucHVzaChlbnRyeSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRyYWl0cy5wdXNoKGVudHJ5KTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBtb25zdGVyID0gbm9ybWFsaXplTW9uc3Rlcih7XG4gICAgbmFtZSxcbiAgICBsZXZlbCxcbiAgICBhbGlnbm1lbnQsXG4gICAgYWMsXG4gICAgaHAsXG4gICAgbXYsXG4gICAgYXRrOiBhdHRhY2tzLFxuICAgIHN0cjogYWJpbGl0aWVzLnN0cixcbiAgICBkZXg6IGFiaWxpdGllcy5kZXgsXG4gICAgY29uOiBhYmlsaXRpZXMuY29uLFxuICAgIGludDogYWJpbGl0aWVzLmludCxcbiAgICB3aXM6IGFiaWxpdGllcy53aXMsXG4gICAgY2hhOiBhYmlsaXRpZXMuY2hhLFxuICAgIHRyYWl0cyxcbiAgICBzcGVjaWFscyxcbiAgICBzcGVsbHMsXG4gICAgZGVzY3JpcHRpb24sXG4gICAgc291cmNlOiBcIkltcG9ydGVkIGZyb20gY2xpcGJvYXJkXCIsXG4gICAgdGFnczogW1wic2hhZG93ZGFya1wiLCBcImltcG9ydGVkXCJdXG4gIH0pO1xuXG4gIGlmICghbW9uc3Rlci5uYW1lIHx8IG1vbnN0ZXIubmFtZSA9PT0gXCJVbm5hbWVkIE1vbnN0ZXJcIikge1xuICAgIGVycm9ycy5wdXNoKFwiQ291bGQgbm90IGRldGVybWluZSBtb25zdGVyIG5hbWUuXCIpO1xuICB9XG5cbiAgaWYgKCFtb25zdGVyLmFjIHx8IG1vbnN0ZXIuYWMgPT09IFwiP1wiKSB7XG4gICAgd2FybmluZ3MucHVzaChcIkNvdWxkIG5vdCBjb25maWRlbnRseSBwYXJzZSBBQy5cIik7XG4gIH1cblxuICBpZiAoIW1vbnN0ZXIuaHAgfHwgbW9uc3Rlci5ocCA9PT0gXCI/XCIpIHtcbiAgICB3YXJuaW5ncy5wdXNoKFwiQ291bGQgbm90IGNvbmZpZGVudGx5IHBhcnNlIEhQLlwiKTtcbiAgfVxuXG4gIGlmICghbW9uc3Rlci5sZXZlbCB8fCBtb25zdGVyLmxldmVsID09PSBcIj9cIikge1xuICAgIHdhcm5pbmdzLnB1c2goXCJDb3VsZCBub3QgY29uZmlkZW50bHkgcGFyc2UgbGV2ZWwuXCIpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBzdWNjZXNzOiBlcnJvcnMubGVuZ3RoID09PSAwLFxuICAgIGRhdGE6IGVycm9ycy5sZW5ndGggPT09IDAgPyBtb25zdGVyIDogdW5kZWZpbmVkLFxuICAgIGVycm9ycyxcbiAgICB3YXJuaW5nc1xuICB9O1xufSIsICJpbXBvcnQgeyBTaGFkb3dkYXJrTW9uc3RlciwgU2hhZG93ZGFya0F0dGFjayB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgU2hhZG93ZGFya1N0YXRibG9ja3NTZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5nc1wiO1xuXG5mdW5jdGlvbiBjcmVhdGVEaXYoY2xhc3NOYW1lPzogc3RyaW5nLCB0ZXh0Pzogc3RyaW5nKTogSFRNTERpdkVsZW1lbnQge1xuICBjb25zdCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGlmIChjbGFzc05hbWUpIGVsLmNsYXNzTmFtZSA9IGNsYXNzTmFtZTtcbiAgaWYgKHRleHQgIT09IHVuZGVmaW5lZCkgZWwudGV4dENvbnRlbnQgPSB0ZXh0O1xuICByZXR1cm4gZWw7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVNwYW4oY2xhc3NOYW1lPzogc3RyaW5nLCB0ZXh0Pzogc3RyaW5nKTogSFRNTFNwYW5FbGVtZW50IHtcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgaWYgKGNsYXNzTmFtZSkgZWwuY2xhc3NOYW1lID0gY2xhc3NOYW1lO1xuICBpZiAodGV4dCAhPT0gdW5kZWZpbmVkKSBlbC50ZXh0Q29udGVudCA9IHRleHQ7XG4gIHJldHVybiBlbDtcbn1cblxuZnVuY3Rpb24gY3JlYXRlTGlzdChjbGFzc05hbWU/OiBzdHJpbmcpOiBIVE1MVUxpc3RFbGVtZW50IHtcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidWxcIik7XG4gIGlmIChjbGFzc05hbWUpIGVsLmNsYXNzTmFtZSA9IGNsYXNzTmFtZTtcbiAgcmV0dXJuIGVsO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVMaXN0SXRlbShjbGFzc05hbWU/OiBzdHJpbmcpOiBIVE1MTElFbGVtZW50IHtcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XG4gIGlmIChjbGFzc05hbWUpIGVsLmNsYXNzTmFtZSA9IGNsYXNzTmFtZTtcbiAgcmV0dXJuIGVsO1xufVxuXG5mdW5jdGlvbiByZW5kZXJBdHRhY2tUZXh0KGF0dGFjazogU2hhZG93ZGFya0F0dGFjayk6IHN0cmluZyB7XG4gIGlmIChhdHRhY2sucmF3KSByZXR1cm4gYXR0YWNrLnJhdztcblxuICBjb25zdCBwYXJ0czogc3RyaW5nW10gPSBbYXR0YWNrLm5hbWVdO1xuXG4gIGlmIChhdHRhY2suYm9udXMpIHBhcnRzLnB1c2goYXR0YWNrLmJvbnVzKTtcbiAgaWYgKGF0dGFjay5kYW1hZ2UpIHBhcnRzLnB1c2goYCgke2F0dGFjay5kYW1hZ2V9KWApO1xuICBpZiAoYXR0YWNrLnJhbmdlKSBwYXJ0cy5wdXNoKGBbJHthdHRhY2sucmFuZ2V9XWApO1xuICBpZiAoYXR0YWNrLm5vdGVzKSBwYXJ0cy5wdXNoKGAtICR7YXR0YWNrLm5vdGVzfWApO1xuXG4gIHJldHVybiBwYXJ0cy5qb2luKFwiIFwiKS50cmltKCk7XG59XG5cbmZ1bmN0aW9uIGdldEFsaWdubWVudExhYmVsKGFsaWdubWVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IGFsaWdubWVudC50cmltKCkudG9VcHBlckNhc2UoKTtcblxuICBzd2l0Y2ggKG5vcm1hbGl6ZWQpIHtcbiAgICBjYXNlIFwiTFwiOlxuICAgICAgcmV0dXJuIFwiTGF3ZnVsXCI7XG4gICAgY2FzZSBcIk5cIjpcbiAgICAgIHJldHVybiBcIk5ldXRyYWxcIjtcbiAgICBjYXNlIFwiQ1wiOlxuICAgICAgcmV0dXJuIFwiQ2hhb3RpY1wiO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gXCJcIjtcbiAgfVxufVxuXG5mdW5jdGlvbiBzcGxpdEF0dGFja0Nvbm5lY3Rvcih0ZXh0OiBzdHJpbmcpOiB7IGNvbm5lY3Rvcjogc3RyaW5nIHwgbnVsbDsgYm9keTogc3RyaW5nIH0ge1xuICBjb25zdCB0cmltbWVkID0gdGV4dC50cmltKCk7XG4gIGNvbnN0IG1hdGNoID0gdHJpbW1lZC5tYXRjaCgvXihBTkR8T1IpXFxzKyguKykkL2kpO1xuXG4gIGlmICghbWF0Y2gpIHtcbiAgICByZXR1cm4geyBjb25uZWN0b3I6IG51bGwsIGJvZHk6IHRyaW1tZWQgfTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgY29ubmVjdG9yOiBtYXRjaFsxXS50b1VwcGVyQ2FzZSgpLFxuICAgIGJvZHk6IG1hdGNoWzJdLnRyaW0oKVxuICB9O1xufVxuXG5mdW5jdGlvbiBhcHBlbmRSZW5kZXJlZEF0dGFjayhsaTogSFRNTExJRWxlbWVudCwgYXR0YWNrVGV4dDogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IHsgY29ubmVjdG9yLCBib2R5IH0gPSBzcGxpdEF0dGFja0Nvbm5lY3RvcihhdHRhY2tUZXh0KTtcblxuICBpZiAoY29ubmVjdG9yKSB7XG4gICAgbGkuYXBwZW5kQ2hpbGQoY3JlYXRlU3BhbihcInNkLW1vbnN0ZXItYXR0YWNrLWNvbm5lY3RvclwiLCBgJHtjb25uZWN0b3J9IGApKTtcbiAgfVxuXG4gIGxpLmFwcGVuZENoaWxkKGNyZWF0ZVNwYW4oXCJzZC1tb25zdGVyLWF0dGFjay10ZXh0XCIsIGJvZHkpKTtcbn1cblxuZnVuY3Rpb24gc3BsaXRMYWJlbEFuZEJvZHkodGV4dDogc3RyaW5nKTogeyBsYWJlbDogc3RyaW5nOyBib2R5OiBzdHJpbmcgfSB7XG4gIGNvbnN0IHRyaW1tZWQgPSB0ZXh0LnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSB7XG4gICAgcmV0dXJuIHsgbGFiZWw6IFwiXCIsIGJvZHk6IFwiXCIgfTtcbiAgfVxuXG4gIGxldCBtYXRjaDogUmVnRXhwTWF0Y2hBcnJheSB8IG51bGwgPSBudWxsO1xuXG4gIC8vIDEpIFBhcmVudGhldGljYWwgc3BlbGwtc3R5bGUgbGFiZWwgdXAgdG8gZmlyc3QgcGVyaW9kXG4gIC8vIEV4YW1wbGU6IFwiUmF5IG9mIEZyb3N0IChJTlQgMTUpLiBUYXJnZXQgdGFrZXMuLi5cIlxuICBtYXRjaCA9IHRyaW1tZWQubWF0Y2goL14oLnsxLDEwMH0/XFwoW14pXXsxLDQwfVxcKVxcLilcXHMqKC4rKSQvKTtcbiAgaWYgKG1hdGNoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGxhYmVsOiBtYXRjaFsxXS50cmltKCksXG4gICAgICBib2R5OiBtYXRjaFsyXS50cmltKClcbiAgICB9O1xuICB9XG5cbiAgLy8gMikgU3RhbmRhcmQgc2VudGVuY2UgbGFiZWxcbiAgLy8gRXhhbXBsZTogXCJEZXZvdXIuIFVzZSB0dXJuIHRvIGRldm91ci4uLlwiXG4gIG1hdGNoID0gdHJpbW1lZC5tYXRjaCgvXihbXi4hPzpdezEsODB9Wy4hP10pXFxzKiguKykkLyk7XG4gIGlmIChtYXRjaCkge1xuICAgIHJldHVybiB7XG4gICAgICBsYWJlbDogbWF0Y2hbMV0udHJpbSgpLFxuICAgICAgYm9keTogbWF0Y2hbMl0udHJpbSgpXG4gICAgfTtcbiAgfVxuXG4gIC8vIDMpIENvbG9uIGxhYmVsXG4gIC8vIEV4YW1wbGU6IFwiRGV2b3VyOiBVc2UgdHVybiB0byBkZXZvdXIuLi5cIlxuICBtYXRjaCA9IHRyaW1tZWQubWF0Y2goL14oW146XXsxLDgwfTopXFxzKiguKykkLyk7XG4gIGlmIChtYXRjaCkge1xuICAgIHJldHVybiB7XG4gICAgICBsYWJlbDogbWF0Y2hbMV0udHJpbSgpLFxuICAgICAgYm9keTogbWF0Y2hbMl0udHJpbSgpXG4gICAgfTtcbiAgfVxuXG4gIC8vIDQpIERhc2ggLyBlbSBkYXNoIGxhYmVsXG4gIC8vIEV4YW1wbGU6IFwiU3Rvcm1ibG9vZCAtIEVsZWN0cmljaXR5IGltbXVuZS5cIlxuICAvLyBFeGFtcGxlOiBcIlN0b3JtYmxvb2QgXHUyMDE0IEVsZWN0cmljaXR5IGltbXVuZS5cIlxuICBtYXRjaCA9IHRyaW1tZWQubWF0Y2goL14oLnsxLDgwfT9cXHNbLVx1MjAxNF0pXFxzKiguKykkLyk7XG4gIGlmIChtYXRjaCkge1xuICAgIHJldHVybiB7XG4gICAgICBsYWJlbDogbWF0Y2hbMV0udHJpbSgpLFxuICAgICAgYm9keTogbWF0Y2hbMl0udHJpbSgpXG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiB7IGxhYmVsOiBcIlwiLCBib2R5OiB0cmltbWVkIH07XG59XG5cbmZ1bmN0aW9uIGFkZFNlY3Rpb24oXG4gIHBhcmVudDogSFRNTEVsZW1lbnQsXG4gIHRpdGxlOiBzdHJpbmcsXG4gIGl0ZW1zOiBzdHJpbmdbXSxcbiAgY2xhc3NOYW1lOiBzdHJpbmdcbik6IHZvaWQge1xuICBpZiAoaXRlbXMubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgY29uc3Qgc2VjdGlvbiA9IGNyZWF0ZURpdihcInNkLW1vbnN0ZXItc2VjdGlvblwiKTtcbiAgc2VjdGlvbi5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLXNlY3Rpb24tdGl0bGVcIiwgdGl0bGUpKTtcblxuICBjb25zdCBsaXN0ID0gY3JlYXRlTGlzdChjbGFzc05hbWUpO1xuXG4gIGZvciAoY29uc3QgaXRlbSBvZiBpdGVtcykge1xuICAgIGNvbnN0IGxpID0gY3JlYXRlTGlzdEl0ZW0oKTtcblxuICAgIGNvbnN0IHsgbGFiZWwsIGJvZHkgfSA9IHNwbGl0TGFiZWxBbmRCb2R5KGl0ZW0pO1xuXG4gICAgaWYgKGxhYmVsKSB7XG4gICAgICBsaS5hcHBlbmRDaGlsZChjcmVhdGVTcGFuKFwic2QtbW9uc3Rlci1hYmlsaXR5LWxhYmVsXCIsIGxhYmVsKSk7XG4gICAgfVxuXG4gICAgaWYgKGJvZHkpIHtcbiAgICAgIGlmIChsYWJlbCkge1xuICAgICAgICBsaS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIiBcIikpO1xuICAgICAgfVxuICAgICAgbGkuYXBwZW5kQ2hpbGQoY3JlYXRlU3BhbihcInNkLW1vbnN0ZXItYWJpbGl0eS10ZXh0XCIsIGJvZHkpKTtcbiAgICB9XG5cbiAgICBpZiAoIWxhYmVsKSB7XG4gICAgICBsaS50ZXh0Q29udGVudCA9IGl0ZW07XG4gICAgfVxuXG4gICAgbGlzdC5hcHBlbmRDaGlsZChsaSk7XG4gIH1cblxuICBzZWN0aW9uLmFwcGVuZENoaWxkKGxpc3QpO1xuICBwYXJlbnQuYXBwZW5kQ2hpbGQoc2VjdGlvbik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJNb25zdGVyQmxvY2soXG4gIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsXG4gIG1vbnN0ZXI6IFNoYWRvd2RhcmtNb25zdGVyLFxuICBzZXR0aW5nczogU2hhZG93ZGFya1N0YXRibG9ja3NTZXR0aW5ncyxcbiAgd2FybmluZ3M6IHN0cmluZ1tdID0gW11cbik6IHZvaWQge1xuICBjb250YWluZXIuaW5uZXJIVE1MID0gXCJcIjtcblxuICBjb25zdCBjYXJkID0gY3JlYXRlRGl2KFxuICAgIFtcbiAgICAgIFwic2QtbW9uc3Rlci1jYXJkXCIsXG4gICAgICBzZXR0aW5ncy5jb21wYWN0TW9kZSA/IFwiaXMtY29tcGFjdFwiIDogXCJcIlxuICAgIF1cbiAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgIC5qb2luKFwiIFwiKVxuICApO1xuXG4gIGNvbnN0IGhlYWRlciA9IGNyZWF0ZURpdihcInNkLW1vbnN0ZXItaGVhZGVyXCIpO1xuICBoZWFkZXIuYXBwZW5kQ2hpbGQoY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1uYW1lXCIsIG1vbnN0ZXIubmFtZSkpO1xuXG4gIGNvbnN0IG1ldGEgPSBjcmVhdGVEaXYoXCJzZC1tb25zdGVyLW1ldGFcIik7XG4gIGNvbnN0IG1ldGFQYXJ0czogSFRNTEVsZW1lbnRbXSA9IFtdO1xuXG4gIGlmIChtb25zdGVyLmxldmVsKSB7XG4gICAgbWV0YVBhcnRzLnB1c2goY3JlYXRlU3Bhbih1bmRlZmluZWQsIGBMZXZlbCAke21vbnN0ZXIubGV2ZWx9YCkpO1xuICB9XG5cbiAgaWYgKG1vbnN0ZXIuYWxpZ25tZW50KSB7XG4gICAgY29uc3QgYWxpZ25tZW50U3BhbiA9IGNyZWF0ZVNwYW4odW5kZWZpbmVkLCBgQUwgJHttb25zdGVyLmFsaWdubWVudH1gKTtcbiAgICBjb25zdCB0b29sdGlwID0gZ2V0QWxpZ25tZW50TGFiZWwobW9uc3Rlci5hbGlnbm1lbnQpO1xuICAgIGlmICh0b29sdGlwKSB7XG4gICAgICBhbGlnbm1lbnRTcGFuLnRpdGxlID0gdG9vbHRpcDtcbiAgICB9XG4gICAgbWV0YVBhcnRzLnB1c2goYWxpZ25tZW50U3Bhbik7XG4gIH1cblxuICBtZXRhUGFydHMuZm9yRWFjaCgocGFydCwgaW5kZXgpID0+IHtcbiAgICBtZXRhLmFwcGVuZENoaWxkKHBhcnQpO1xuXG4gICAgaWYgKGluZGV4IDwgbWV0YVBhcnRzLmxlbmd0aCAtIDEpIHtcbiAgICAgIG1ldGEuYXBwZW5kQ2hpbGQoY3JlYXRlU3Bhbih1bmRlZmluZWQsIFwiIFx1MjAyMiBcIikpO1xuICAgIH1cbiAgfSk7XG5cbiAgaGVhZGVyLmFwcGVuZENoaWxkKG1ldGEpO1xuICBjYXJkLmFwcGVuZENoaWxkKGhlYWRlcik7XG5cbiAgY29uc3QgY29yZSA9IGNyZWF0ZURpdihcInNkLW1vbnN0ZXItY29yZVwiKTtcbiAgY29yZS5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLWNvcmUtaXRlbVwiLCBgQUMgJHttb25zdGVyLmFjfWApKTtcbiAgY29yZS5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLWNvcmUtaXRlbVwiLCBgSFAgJHttb25zdGVyLmhwfWApKTtcblxuICBpZiAobW9uc3Rlci5tdikge1xuICAgIGNvcmUuYXBwZW5kQ2hpbGQoY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1jb3JlLWl0ZW1cIiwgYE1WICR7bW9uc3Rlci5tdn1gKSk7XG4gIH1cblxuICBjYXJkLmFwcGVuZENoaWxkKGNvcmUpO1xuXG4gIGlmIChtb25zdGVyLmF0ay5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgYXRrU2VjdGlvbiA9IGNyZWF0ZURpdihcInNkLW1vbnN0ZXItc2VjdGlvblwiKTtcbiAgICBhdGtTZWN0aW9uLmFwcGVuZENoaWxkKGNyZWF0ZURpdihcInNkLW1vbnN0ZXItc2VjdGlvbi10aXRsZVwiLCBcIkFUVEFDS1NcIikpO1xuXG4gICAgY29uc3QgYXRrTGlzdCA9IGNyZWF0ZUxpc3QoXCJzZC1tb25zdGVyLWF0dGFja3NcIik7XG4gICAgZm9yIChjb25zdCBhdHRhY2sgb2YgbW9uc3Rlci5hdGspIHtcbiAgICAgIGNvbnN0IGxpID0gY3JlYXRlTGlzdEl0ZW0oXCJzZC1tb25zdGVyLWF0dGFja1wiKTtcbiAgICAgIGFwcGVuZFJlbmRlcmVkQXR0YWNrKGxpLCByZW5kZXJBdHRhY2tUZXh0KGF0dGFjaykpO1xuICAgICAgYXRrTGlzdC5hcHBlbmRDaGlsZChsaSk7XG4gICAgfVxuXG4gICAgYXRrU2VjdGlvbi5hcHBlbmRDaGlsZChhdGtMaXN0KTtcbiAgICBjYXJkLmFwcGVuZENoaWxkKGF0a1NlY3Rpb24pO1xuICB9XG5cbiAgY29uc3QgYWJpbGl0aWVzID0gY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1zZWN0aW9uXCIpO1xuICBhYmlsaXRpZXMuYXBwZW5kQ2hpbGQoY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1zZWN0aW9uLXRpdGxlXCIsIFwiQUJJTElUSUVTXCIpKTtcblxuICBjb25zdCBncmlkID0gY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1hYmlsaXRpZXNcIik7XG4gIGdyaWQuYXBwZW5kQ2hpbGQoY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1hYmlsaXR5XCIsIGBTVFIgJHttb25zdGVyLnN0YXRzLnN0cn1gKSk7XG4gIGdyaWQuYXBwZW5kQ2hpbGQoY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1hYmlsaXR5XCIsIGBERVggJHttb25zdGVyLnN0YXRzLmRleH1gKSk7XG4gIGdyaWQuYXBwZW5kQ2hpbGQoY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1hYmlsaXR5XCIsIGBDT04gJHttb25zdGVyLnN0YXRzLmNvbn1gKSk7XG4gIGdyaWQuYXBwZW5kQ2hpbGQoY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1hYmlsaXR5XCIsIGBJTlQgJHttb25zdGVyLnN0YXRzLmludH1gKSk7XG4gIGdyaWQuYXBwZW5kQ2hpbGQoY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1hYmlsaXR5XCIsIGBXSVMgJHttb25zdGVyLnN0YXRzLndpc31gKSk7XG4gIGdyaWQuYXBwZW5kQ2hpbGQoY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1hYmlsaXR5XCIsIGBDSEEgJHttb25zdGVyLnN0YXRzLmNoYX1gKSk7XG5cbiAgYWJpbGl0aWVzLmFwcGVuZENoaWxkKGdyaWQpO1xuICBjYXJkLmFwcGVuZENoaWxkKGFiaWxpdGllcyk7XG5cbiAgYWRkU2VjdGlvbihjYXJkLCBcIlRSQUlUU1wiLCBtb25zdGVyLnRyYWl0cywgXCJzZC1tb25zdGVyLWxpc3RcIik7XG4gIGFkZFNlY3Rpb24oY2FyZCwgXCJTUEVDSUFMU1wiLCBtb25zdGVyLnNwZWNpYWxzLCBcInNkLW1vbnN0ZXItbGlzdFwiKTtcbiAgYWRkU2VjdGlvbihjYXJkLCBcIlNQRUxMU1wiLCBtb25zdGVyLnNwZWxscywgXCJzZC1tb25zdGVyLWxpc3RcIik7XG4gIGFkZFNlY3Rpb24oY2FyZCwgXCJHRUFSXCIsIG1vbnN0ZXIuZ2VhciwgXCJzZC1tb25zdGVyLWxpc3RcIik7XG5cbiAgaWYgKG1vbnN0ZXIuZGVzY3JpcHRpb24pIHtcbiAgICBjb25zdCBkZXNjID0gY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1zZWN0aW9uXCIpO1xuICAgIGRlc2MuYXBwZW5kQ2hpbGQoY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1kZXNjcmlwdGlvblwiLCBtb25zdGVyLmRlc2NyaXB0aW9uKSk7XG4gICAgY2FyZC5hcHBlbmRDaGlsZChkZXNjKTtcbiAgfVxuXG4gIGlmIChzZXR0aW5ncy5zaG93U291cmNlICYmIG1vbnN0ZXIuc291cmNlKSB7XG4gICAgY29uc3Qgc291cmNlID0gY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1mb290ZXJcIik7XG4gICAgc291cmNlLmFwcGVuZENoaWxkKGNyZWF0ZVNwYW4oXCJzZC1tb25zdGVyLXNvdXJjZVwiLCBgU291cmNlOiAke21vbnN0ZXIuc291cmNlfWApKTtcbiAgICBjYXJkLmFwcGVuZENoaWxkKHNvdXJjZSk7XG4gIH1cblxuICBpZiAoc2V0dGluZ3Muc2hvd1RhZ3MgJiYgbW9uc3Rlci50YWdzLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCB0YWdzID0gY3JlYXRlRGl2KFwic2QtbW9uc3Rlci10YWdzXCIpO1xuICAgIGZvciAoY29uc3QgdGFnIG9mIG1vbnN0ZXIudGFncykge1xuICAgICAgdGFncy5hcHBlbmRDaGlsZChjcmVhdGVTcGFuKFwic2QtbW9uc3Rlci10YWdcIiwgdGFnKSk7XG4gICAgfVxuICAgIGNhcmQuYXBwZW5kQ2hpbGQodGFncyk7XG4gIH1cblxuICBpZiAod2FybmluZ3MubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IHdhcm5pbmdCb3ggPSBjcmVhdGVEaXYoXCJzZC1tb25zdGVyLXdhcm5pbmctYm94XCIpO1xuICAgIGZvciAoY29uc3Qgd2FybmluZyBvZiB3YXJuaW5ncykge1xuICAgICAgd2FybmluZ0JveC5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLXdhcm5pbmdcIiwgd2FybmluZykpO1xuICAgIH1cbiAgICBjYXJkLmFwcGVuZENoaWxkKHdhcm5pbmdCb3gpO1xuICB9XG5cbiAgY29udGFpbmVyLmFwcGVuZENoaWxkKGNhcmQpO1xufSIsICJleHBvcnQgZnVuY3Rpb24gYnVpbGRNb25zdGVyVGVtcGxhdGUobmFtZSA9IFwiTmV3IE1vbnN0ZXJcIik6IHN0cmluZyB7XG4gIHJldHVybiBgLS0tXG5zaGFkb3dkYXJrVHlwZTogbW9uc3RlclxubmFtZTogJHtuYW1lfVxubGV2ZWw6IDFcbmFsaWdubWVudDogTlxudHlwZTogSHVtYW5vaWRcbmFjOiAxMFxuaHA6IDRcbm12OiBuZWFyXG5hdGs6XG4gIC0gQ2x1YiArMCAoMWQ0KVxuc3RyOiArMFxuZGV4OiArMFxuY29uOiArMFxuaW50OiArMFxud2lzOiArMFxuY2hhOiArMFxudHJhaXRzOlxuICAtIEV4YW1wbGUgdHJhaXRcbnNwZWNpYWxzOiBbXVxuc3BlbGxzOiBbXVxuZ2VhcjogW11cbmRlc2NyaXB0aW9uOiBBZGQgYSBzaG9ydCBkZXNjcmlwdGlvbiBoZXJlLlxuc291cmNlOiBIb21lYnJld1xudGFnczpcbiAgLSBzaGFkb3dkYXJrXG4tLS1cblxuIyMgTm90ZXNcblxuIyMgVGFjdGljc1xuXG4jIyBFbmNvdW50ZXIgSWRlYXNcbmA7XG59IiwgImltcG9ydCB7IFNoYWRvd2RhcmtNb25zdGVyIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5cbmZ1bmN0aW9uIHlhbWxTdHJpbmcodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICghdmFsdWUpIHJldHVybiAnXCJcIic7XG5cbiAgaWYgKC9bOltcXF17fSMsJiohfD4nXCIlQGBdLy50ZXN0KHZhbHVlKSB8fCB2YWx1ZS5pbmNsdWRlcygnXCInKSkge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG4gIH1cblxuICByZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIHlhbWxMaXN0KGl0ZW1zOiBzdHJpbmdbXSwgaW5kZW50ID0gMCk6IHN0cmluZyB7XG4gIGNvbnN0IHBhZCA9IFwiIFwiLnJlcGVhdChpbmRlbnQpO1xuXG4gIGlmIChpdGVtcy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gYCR7cGFkfVtdYDtcbiAgfVxuXG4gIHJldHVybiBpdGVtcy5tYXAoKGl0ZW0pID0+IGAke3BhZH0tICR7eWFtbFN0cmluZyhpdGVtKX1gKS5qb2luKFwiXFxuXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRNb25zdGVyRnJvbnRtYXR0ZXIobW9uc3RlcjogU2hhZG93ZGFya01vbnN0ZXIpOiBzdHJpbmcge1xuICByZXR1cm4gYC0tLVxuc2hhZG93ZGFya1R5cGU6IG1vbnN0ZXJcbm5hbWU6ICR7eWFtbFN0cmluZyhtb25zdGVyLm5hbWUpfVxubGV2ZWw6ICR7eWFtbFN0cmluZyhtb25zdGVyLmxldmVsKX1cbmFsaWdubWVudDogJHt5YW1sU3RyaW5nKG1vbnN0ZXIuYWxpZ25tZW50KX1cbnR5cGU6ICR7eWFtbFN0cmluZyhtb25zdGVyLnR5cGUpfVxuYWM6ICR7eWFtbFN0cmluZyhtb25zdGVyLmFjKX1cbmhwOiAke3lhbWxTdHJpbmcobW9uc3Rlci5ocCl9XG5tdjogJHt5YW1sU3RyaW5nKG1vbnN0ZXIubXYpfVxuYXRrOlxuJHt5YW1sTGlzdChtb25zdGVyLmF0ay5tYXAoKGEpID0+IGEucmF3IHx8IGEubmFtZSksIDIpfVxuc3RyOiAke3lhbWxTdHJpbmcobW9uc3Rlci5zdGF0cy5zdHIpfVxuZGV4OiAke3lhbWxTdHJpbmcobW9uc3Rlci5zdGF0cy5kZXgpfVxuY29uOiAke3lhbWxTdHJpbmcobW9uc3Rlci5zdGF0cy5jb24pfVxuaW50OiAke3lhbWxTdHJpbmcobW9uc3Rlci5zdGF0cy5pbnQpfVxud2lzOiAke3lhbWxTdHJpbmcobW9uc3Rlci5zdGF0cy53aXMpfVxuY2hhOiAke3lhbWxTdHJpbmcobW9uc3Rlci5zdGF0cy5jaGEpfVxudHJhaXRzOlxuJHt5YW1sTGlzdChtb25zdGVyLnRyYWl0cywgMil9XG5zcGVjaWFsczpcbiR7eWFtbExpc3QobW9uc3Rlci5zcGVjaWFscywgMil9XG5zcGVsbHM6XG4ke3lhbWxMaXN0KG1vbnN0ZXIuc3BlbGxzLCAyKX1cbmdlYXI6XG4ke3lhbWxMaXN0KG1vbnN0ZXIuZ2VhciwgMil9XG5kZXNjcmlwdGlvbjogJHt5YW1sU3RyaW5nKG1vbnN0ZXIuZGVzY3JpcHRpb24pfVxuc291cmNlOiAke3lhbWxTdHJpbmcobW9uc3Rlci5zb3VyY2UpfVxudGFnczpcbiR7eWFtbExpc3QobW9uc3Rlci50YWdzLCAyKX1cbi0tLWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZE1vbnN0ZXJOb3RlQ29udGVudChcbiAgbW9uc3RlcjogU2hhZG93ZGFya01vbnN0ZXIsXG4gIGJvZHk/OiBzdHJpbmdcbik6IHN0cmluZyB7XG4gIGNvbnN0IGZyb250bWF0dGVyID0gYnVpbGRNb25zdGVyRnJvbnRtYXR0ZXIobW9uc3Rlcik7XG5cbiAgaWYgKGJvZHkgJiYgYm9keS50cmltKCkpIHtcbiAgICByZXR1cm4gYCR7ZnJvbnRtYXR0ZXJ9XFxuXFxuJHtib2R5LnJlcGxhY2UoL15cXHMrLywgXCJcIil9XFxuYDtcbiAgfVxuXG4gIHJldHVybiBgJHtmcm9udG1hdHRlcn1cblxuIyMgTm90ZXNcblxuIyMgVGFjdGljc1xuXG4jIyBFbmNvdW50ZXIgSWRlYXNcbmA7XG59IiwgImltcG9ydCB7IEFwcCwgUGx1Z2luU2V0dGluZ1RhYiwgU2V0dGluZyB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IFNoYWRvd2RhcmtTdGF0YmxvY2tzUGx1Z2luIGZyb20gXCIuL21haW5cIjtcblxuZXhwb3J0IGNsYXNzIFNoYWRvd2RhcmtTdGF0YmxvY2tzU2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuICBwbHVnaW46IFNoYWRvd2RhcmtTdGF0YmxvY2tzUGx1Z2luO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IFNoYWRvd2RhcmtTdGF0YmxvY2tzUGx1Z2luKSB7XG4gICAgc3VwZXIoYXBwLCBwbHVnaW4pO1xuICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICB9XG5cbiAgZGlzcGxheSgpOiB2b2lkIHtcbiAgY29uc3QgeyBjb250YWluZXJFbCB9ID0gdGhpcztcbiAgY29udGFpbmVyRWwuZW1wdHkoKTtcblxuICBjb250YWluZXJFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJTaGFkb3dkYXJrIFN0YXRibG9ja3MgU2V0dGluZ3NcIiB9KTtcblxuICAvLyA9PT09PSBESVNQTEFZIFNFQ1RJT04gPT09PT1cbiAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiRGlzcGxheVwiIH0pO1xuXG4gIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgIC5zZXROYW1lKFwiQ29tcGFjdCBzdGF0YmxvY2sgbW9kZVwiKVxuICAgIC5zZXREZXNjKFwiUmVuZGVyIG1vbnN0ZXIgc3RhdGJsb2NrcyB3aXRoIHRpZ2h0ZXIgc3BhY2luZy5cIilcbiAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XG4gICAgICB0b2dnbGVcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmNvbXBhY3RNb2RlKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuY29tcGFjdE1vZGUgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlUGx1Z2luU2V0dGluZ3MoKTtcbiAgICAgICAgICB2b2lkIHRoaXMucGx1Z2luLnJlZnJlc2hNb25zdGVyVmlldygpO1xuICAgICAgICB9KVxuICAgICk7XG5cbiAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgLnNldE5hbWUoXCJTaG93IHNvdXJjZVwiKVxuICAgIC5zZXREZXNjKFwiRGlzcGxheSB0aGUgc291cmNlIGZpZWxkIGluIHJlbmRlcmVkIHN0YXRibG9ja3MuXCIpXG4gICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgdG9nZ2xlXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93U291cmNlKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd1NvdXJjZSA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVQbHVnaW5TZXR0aW5ncygpO1xuICAgICAgICAgIHZvaWQgdGhpcy5wbHVnaW4ucmVmcmVzaE1vbnN0ZXJWaWV3KCk7XG4gICAgICAgIH0pXG4gICAgKTtcblxuICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAuc2V0TmFtZShcIlNob3cgdGFnc1wiKVxuICAgIC5zZXREZXNjKFwiRGlzcGxheSB0YWcgcGlsbHMgaW4gcmVuZGVyZWQgc3RhdGJsb2Nrcy5cIilcbiAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XG4gICAgICB0b2dnbGVcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dUYWdzKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd1RhZ3MgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlUGx1Z2luU2V0dGluZ3MoKTtcbiAgICAgICAgICB2b2lkIHRoaXMucGx1Z2luLnJlZnJlc2hNb25zdGVyVmlldygpO1xuICAgICAgICB9KVxuICAgICk7XG5cbiAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgLnNldE5hbWUoXCJSZW5kZXIgZnJvbnRtYXR0ZXIgbW9uc3RlcnNcIilcbiAgICAuc2V0RGVzYyhcIlJlbmRlciBzdGF0YmxvY2tzIGZyb20gbW9uc3RlciBub3RlIGZyb250bWF0dGVyIGluIFJlYWRpbmcgdmlldy5cIilcbiAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XG4gICAgICB0b2dnbGVcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnJlbmRlckZyb250bWF0dGVyTW9uc3RlcnMpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZW5kZXJGcm9udG1hdHRlck1vbnN0ZXJzID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVBsdWdpblNldHRpbmdzKCk7XG4gICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5yZWZyZXNoTW9uc3RlclZpZXcoKTtcbiAgICAgICAgfSlcbiAgICApO1xuXG4gIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgIC5zZXROYW1lKFwiSGlkZSBtb25zdGVyIHByb3BlcnRpZXNcIilcbiAgICAuc2V0RGVzYyhcIkhpZGUgT2JzaWRpYW4ncyBuYXRpdmUgUHJvcGVydGllcyBzZWN0aW9uIGluIFJlYWRpbmcgdmlldyBmb3IgbW9uc3RlciBub3Rlcy5cIilcbiAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XG4gICAgICB0b2dnbGVcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmhpZGVNb25zdGVyUHJvcGVydGllcylcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmhpZGVNb25zdGVyUHJvcGVydGllcyA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVQbHVnaW5TZXR0aW5ncygpO1xuICAgICAgICAgIHZvaWQgdGhpcy5wbHVnaW4ucmVmcmVzaE1vbnN0ZXJWaWV3KCk7XG4gICAgICAgIH0pXG4gICAgKTtcblxuICAvLyA9PT09PSBGSUxFUyBTRUNUSU9OID09PT09XG4gIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIkZpbGVzXCIgfSk7XG5cbiAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgLnNldE5hbWUoXCJNb25zdGVyIGZvbGRlclwiKVxuICAgIC5zZXREZXNjKFwiRm9sZGVyIHVzZWQgd2hlbiBjcmVhdGluZyBuZXcgbW9uc3RlciBub3Rlcy5cIilcbiAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgIHRleHRcbiAgICAgICAgLnNldFBsYWNlaG9sZGVyKFwiU2hhZG93ZGFyay9Nb25zdGVyc1wiKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MubW9uc3RlckZvbGRlcilcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm1vbnN0ZXJGb2xkZXIgPVxuICAgICAgICAgICAgdmFsdWUudHJpbSgpIHx8IFwiU2hhZG93ZGFyay9Nb25zdGVyc1wiO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVQbHVnaW5TZXR0aW5ncygpO1xuICAgICAgICB9KVxuICAgICk7XG4gIH1cbn0iLCAiaW1wb3J0IHtcbiAgQXBwLFxuICBEcm9wZG93bkNvbXBvbmVudCxcbiAgTW9kYWwsXG4gIE5vdGljZSxcbiAgU2V0dGluZyxcbiAgVGV4dEFyZWFDb21wb25lbnQsXG4gIFRleHRDb21wb25lbnRcbn0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBTaGFkb3dkYXJrTW9uc3RlciB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgcmVuZGVyTW9uc3RlckJsb2NrIH0gZnJvbSBcIi4uL3JlbmRlci9yZW5kZXJNb25zdGVyQmxvY2tcIjtcbmltcG9ydCB7IERFRkFVTFRfU0VUVElOR1MgfSBmcm9tIFwiLi4vc2V0dGluZ3NcIjtcbmltcG9ydCB7IGZpeE1vbnN0ZXJDb21tb25Jc3N1ZXMgfSBmcm9tIFwiLi4vdXRpbHMvZml4TW9uc3RlckNvbW1vbklzc3Vlc1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIEltcG9ydFByZXZpZXdNb2RhbE9wdGlvbnMge1xuICBtb25zdGVyOiBTaGFkb3dkYXJrTW9uc3RlcjtcbiAgd2FybmluZ3M6IHN0cmluZ1tdO1xuICBvbkNvbmZpcm06IChtb25zdGVyOiBTaGFkb3dkYXJrTW9uc3RlcikgPT4gUHJvbWlzZTx2b2lkPjtcbiAgb25Ta2lwPzogKCkgPT4gdm9pZDtcbiAgbW9kZT86IFwiaW1wb3J0XCIgfCBcImVkaXRcIjtcbiAgcHJvZ3Jlc3NMYWJlbD86IHN0cmluZztcbiAgc3VnZ2VzdGVkVGFncz86IHN0cmluZ1tdO1xuICBzdWdnZXN0ZWRPdGhlclNvdXJjZXM/OiBzdHJpbmdbXTtcbn1cblxuY29uc3QgU09VUkNFX09QVElPTlMgPSBbXG4gIFwiQ29yZSBSdWxlc1wiLFxuICBcIkN1cnNlZCBTY3JvbGwgMVwiLFxuICBcIkN1cnNlZCBTY3JvbGwgMlwiLFxuICBcIkN1cnNlZCBTY3JvbGwgM1wiLFxuICBcIkhvbWVicmV3XCIsXG4gIFwiT3RoZXJcIlxuXSBhcyBjb25zdDtcblxuZnVuY3Rpb24gZ2V0TmF2QWN0aW9uKFxuICBldnQ6IEtleWJvYXJkRXZlbnRcbik6IFwibmV4dFwiIHwgXCJwcmV2XCIgfCBcImVudGVyXCIgfCBcImVzY2FwZVwiIHwgbnVsbCB7XG4gIGNvbnN0IGtleSA9IGV2dC5rZXk7XG4gIGNvbnN0IGNvZGUgPSBldnQuY29kZTtcblxuICBpZiAoXG4gICAga2V5ID09PSBcIkFycm93RG93blwiIHx8XG4gICAga2V5ID09PSBcIkRvd25cIiB8fFxuICAgIGNvZGUgPT09IFwiQXJyb3dEb3duXCIgfHxcbiAgICBrZXkgPT09IFwiQXJyb3dSaWdodFwiIHx8XG4gICAga2V5ID09PSBcIlJpZ2h0XCIgfHxcbiAgICBjb2RlID09PSBcIkFycm93UmlnaHRcIlxuICApIHtcbiAgICByZXR1cm4gXCJuZXh0XCI7XG4gIH1cblxuICBpZiAoXG4gICAga2V5ID09PSBcIkFycm93VXBcIiB8fFxuICAgIGtleSA9PT0gXCJVcFwiIHx8XG4gICAgY29kZSA9PT0gXCJBcnJvd1VwXCIgfHxcbiAgICBrZXkgPT09IFwiQXJyb3dMZWZ0XCIgfHxcbiAgICBrZXkgPT09IFwiTGVmdFwiIHx8XG4gICAgY29kZSA9PT0gXCJBcnJvd0xlZnRcIlxuICApIHtcbiAgICByZXR1cm4gXCJwcmV2XCI7XG4gIH1cblxuICBpZiAoa2V5ID09PSBcIkVudGVyXCIgfHwgY29kZSA9PT0gXCJFbnRlclwiIHx8IGNvZGUgPT09IFwiTnVtcGFkRW50ZXJcIikge1xuICAgIHJldHVybiBcImVudGVyXCI7XG4gIH1cblxuICBpZiAoa2V5ID09PSBcIkVzY2FwZVwiIHx8IGtleSA9PT0gXCJFc2NcIiB8fCBjb2RlID09PSBcIkVzY2FwZVwiKSB7XG4gICAgcmV0dXJuIFwiZXNjYXBlXCI7XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gc3RvcEtleUV2ZW50KGV2dDogS2V5Ym9hcmRFdmVudCk6IHZvaWQge1xuICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgZXZ0LnN0b3BQcm9wYWdhdGlvbigpO1xuICAoZXZ0IGFzIGFueSkuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uPy4oKTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplTGluZXModmFsdWU6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgcmV0dXJuIHZhbHVlXG4gICAgLnNwbGl0KC9cXHI/XFxuLylcbiAgICAubWFwKChsaW5lKSA9PiBsaW5lLnRyaW0oKSlcbiAgICAuZmlsdGVyKEJvb2xlYW4pO1xufVxuXG5mdW5jdGlvbiBqb2luQXR0YWNrTGluZXMobW9uc3RlcjogU2hhZG93ZGFya01vbnN0ZXIpOiBzdHJpbmcge1xuICByZXR1cm4gbW9uc3Rlci5hdGsubWFwKChhKSA9PiBhLnJhdyB8fCBhLm5hbWUpLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHNwbGl0VGFncyh2YWx1ZTogc3RyaW5nKTogc3RyaW5nW10ge1xuICByZXR1cm4gdmFsdWVcbiAgICAuc3BsaXQoXCIsXCIpXG4gICAgLm1hcCgodGFnKSA9PiB0YWcudHJpbSgpKVxuICAgIC5maWx0ZXIoQm9vbGVhbik7XG59XG5cbmZ1bmN0aW9uIGpvaW5UYWdzKHRhZ3M6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRhZ3Muam9pbihcIiwgXCIpO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVTb3VyY2VGb3JEcm9wZG93bihzb3VyY2U6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSBzb3VyY2UudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQpIHJldHVybiBcIkNvcmUgUnVsZXNcIjtcblxuICByZXR1cm4gU09VUkNFX09QVElPTlMuaW5jbHVkZXModHJpbW1lZCBhcyAodHlwZW9mIFNPVVJDRV9PUFRJT05TKVtudW1iZXJdKVxuICAgID8gdHJpbW1lZFxuICAgIDogXCJPdGhlclwiO1xufVxuXG5mdW5jdGlvbiBnZXRDdXJyZW50VGFnRnJhZ21lbnQocmF3VmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHBhcnRzID0gcmF3VmFsdWUuc3BsaXQoXCIsXCIpO1xuICByZXR1cm4gKHBhcnRzW3BhcnRzLmxlbmd0aCAtIDFdID8/IFwiXCIpLnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xufVxuXG5mdW5jdGlvbiByZXBsYWNlQ3VycmVudFRhZ0ZyYWdtZW50KHJhd1ZhbHVlOiBzdHJpbmcsIHNlbGVjdGVkVGFnOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBwYXJ0cyA9IHJhd1ZhbHVlLnNwbGl0KFwiLFwiKTtcbiAgY29uc3QgY29tbWl0dGVkID0gcGFydHNcbiAgICAuc2xpY2UoMCwgLTEpXG4gICAgLm1hcCgocGFydCkgPT4gcGFydC50cmltKCkpXG4gICAgLmZpbHRlcihCb29sZWFuKTtcblxuICByZXR1cm4gY29tbWl0dGVkLmxlbmd0aCA+IDBcbiAgICA/IGAke2NvbW1pdHRlZC5qb2luKFwiLCBcIil9LCAke3NlbGVjdGVkVGFnfWBcbiAgICA6IHNlbGVjdGVkVGFnO1xufVxuXG5mdW5jdGlvbiBnZXRDdXJyZW50U291cmNlRnJhZ21lbnQodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB2YWx1ZS50cmltKCkudG9Mb3dlckNhc2UoKTtcbn1cblxuZXhwb3J0IGNsYXNzIEltcG9ydFByZXZpZXdNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSBtb25zdGVyOiBTaGFkb3dkYXJrTW9uc3RlcjtcbiAgcHJpdmF0ZSB3YXJuaW5nczogc3RyaW5nW107XG4gIHByaXZhdGUgb25Db25maXJtQ2FsbGJhY2s6IChtb25zdGVyOiBTaGFkb3dkYXJrTW9uc3RlcikgPT4gUHJvbWlzZTx2b2lkPjtcbiAgcHJpdmF0ZSBwcmV2aWV3RWwhOiBIVE1MRGl2RWxlbWVudDtcbiAgcHJpdmF0ZSBtb2RlOiBcImltcG9ydFwiIHwgXCJlZGl0XCI7XG4gIHByaXZhdGUgc3VnZ2VzdGVkVGFnczogc3RyaW5nW107XG4gIHByaXZhdGUgc3VnZ2VzdGVkT3RoZXJTb3VyY2VzOiBzdHJpbmdbXTtcblxuICBwcml2YXRlIG5hbWVJbnB1dCE6IFRleHRDb21wb25lbnQ7XG4gIHByaXZhdGUgZGVzY3JpcHRpb25JbnB1dCE6IFRleHRBcmVhQ29tcG9uZW50O1xuICBwcml2YXRlIHNvdXJjZURyb3Bkb3duITogRHJvcGRvd25Db21wb25lbnQ7XG4gIHByaXZhdGUgb3RoZXJTb3VyY2VJbnB1dCE6IFRleHRDb21wb25lbnQ7XG4gIHByaXZhdGUgdGFnc0lucHV0ITogVGV4dENvbXBvbmVudDtcblxuICBwcml2YXRlIGxldmVsSW5wdXQhOiBUZXh0Q29tcG9uZW50O1xuICBwcml2YXRlIGFsaWdubWVudElucHV0ITogVGV4dENvbXBvbmVudDtcbiAgcHJpdmF0ZSBhY0lucHV0ITogVGV4dENvbXBvbmVudDtcbiAgcHJpdmF0ZSBocElucHV0ITogVGV4dENvbXBvbmVudDtcbiAgcHJpdmF0ZSBtdklucHV0ITogVGV4dENvbXBvbmVudDtcblxuICBwcml2YXRlIHN0cklucHV0ITogVGV4dENvbXBvbmVudDtcbiAgcHJpdmF0ZSBkZXhJbnB1dCE6IFRleHRDb21wb25lbnQ7XG4gIHByaXZhdGUgY29uSW5wdXQhOiBUZXh0Q29tcG9uZW50O1xuICBwcml2YXRlIGludElucHV0ITogVGV4dENvbXBvbmVudDtcbiAgcHJpdmF0ZSB3aXNJbnB1dCE6IFRleHRDb21wb25lbnQ7XG4gIHByaXZhdGUgY2hhSW5wdXQhOiBUZXh0Q29tcG9uZW50O1xuXG4gIHByaXZhdGUgYXR0YWNrc0lucHV0ITogVGV4dEFyZWFDb21wb25lbnQ7XG4gIHByaXZhdGUgdHJhaXRzSW5wdXQhOiBUZXh0QXJlYUNvbXBvbmVudDtcbiAgcHJpdmF0ZSBzcGVsbHNJbnB1dCE6IFRleHRBcmVhQ29tcG9uZW50O1xuICBwcml2YXRlIHNwZWNpYWxzSW5wdXQhOiBUZXh0QXJlYUNvbXBvbmVudDtcbiAgcHJpdmF0ZSBnZWFySW5wdXQhOiBUZXh0QXJlYUNvbXBvbmVudDtcblxuICBwcml2YXRlIG90aGVyU291cmNlU2V0dGluZ0VsITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgdGFnU3VnZ2VzdGlvbnNFbCE6IEhUTUxEaXZFbGVtZW50O1xuICBwcml2YXRlIG90aGVyU291cmNlU3VnZ2VzdGlvbnNFbCE6IEhUTUxEaXZFbGVtZW50O1xuXG4gIHByaXZhdGUgZmlsdGVyZWRUYWdTdWdnZXN0aW9uczogc3RyaW5nW10gPSBbXTtcbiAgcHJpdmF0ZSBoaWdobGlnaHRlZFRhZ1N1Z2dlc3Rpb25JbmRleCA9IC0xO1xuXG4gIHByaXZhdGUgZmlsdGVyZWRPdGhlclNvdXJjZVN1Z2dlc3Rpb25zOiBzdHJpbmdbXSA9IFtdO1xuICBwcml2YXRlIGhpZ2hsaWdodGVkT3RoZXJTb3VyY2VTdWdnZXN0aW9uSW5kZXggPSAtMTtcblxuICBwcml2YXRlIG9uU2tpcENhbGxiYWNrPzogKCkgPT4gdm9pZDtcblxuICBwcml2YXRlIHByb2dyZXNzTGFiZWw/OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIG9wdGlvbnM6IEltcG9ydFByZXZpZXdNb2RhbE9wdGlvbnMpIHtcbiAgICBzdXBlcihhcHApO1xuICAgIHRoaXMubW9uc3RlciA9IHN0cnVjdHVyZWRDbG9uZShvcHRpb25zLm1vbnN0ZXIpO1xuICAgIHRoaXMud2FybmluZ3MgPSBvcHRpb25zLndhcm5pbmdzO1xuICAgIHRoaXMub25Db25maXJtQ2FsbGJhY2sgPSBvcHRpb25zLm9uQ29uZmlybTtcbiAgICB0aGlzLm9uU2tpcENhbGxiYWNrID0gb3B0aW9ucy5vblNraXA7XG4gICAgdGhpcy5tb2RlID0gb3B0aW9ucy5tb2RlID8/IFwiaW1wb3J0XCI7XG4gICAgdGhpcy5wcm9ncmVzc0xhYmVsID0gb3B0aW9ucy5wcm9ncmVzc0xhYmVsO1xuICAgIHRoaXMuc3VnZ2VzdGVkVGFncyA9IFsuLi4ob3B0aW9ucy5zdWdnZXN0ZWRUYWdzID8/IFtdKV0uc29ydCgoYSwgYikgPT5cbiAgICAgIGEubG9jYWxlQ29tcGFyZShiKVxuICAgICk7XG4gICAgdGhpcy5zdWdnZXN0ZWRPdGhlclNvdXJjZXMgPSBbLi4uKG9wdGlvbnMuc3VnZ2VzdGVkT3RoZXJTb3VyY2VzID8/IFtdKV0uc29ydCgoYSwgYikgPT5cbiAgICAgIGEubG9jYWxlQ29tcGFyZShiKVxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGdldE1hdGNoaW5nVGFnU3VnZ2VzdGlvbnMocmF3VmFsdWU/OiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgdmFsdWUgPSByYXdWYWx1ZSA/PyB0aGlzLnRhZ3NJbnB1dD8uZ2V0VmFsdWUoKSA/PyBcIlwiO1xuICAgIGNvbnN0IGZyYWdtZW50ID0gZ2V0Q3VycmVudFRhZ0ZyYWdtZW50KHZhbHVlKTtcbiAgICBjb25zdCBjdXJyZW50VGFncyA9IG5ldyBTZXQoc3BsaXRUYWdzKHZhbHVlKS5tYXAoKHRhZykgPT4gdGFnLnRvTG93ZXJDYXNlKCkpKTtcblxuICAgIGlmICghZnJhZ21lbnQpIHJldHVybiBbXTtcblxuICAgIHJldHVybiB0aGlzLnN1Z2dlc3RlZFRhZ3NcbiAgICAgIC5maWx0ZXIoKHRhZykgPT4gIWN1cnJlbnRUYWdzLmhhcyh0YWcudG9Mb3dlckNhc2UoKSkpXG4gICAgICAuZmlsdGVyKCh0YWcpID0+IHRhZy50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKGZyYWdtZW50KSlcbiAgICAgIC5zbGljZSgwLCA4KTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0TWF0Y2hpbmdPdGhlclNvdXJjZVN1Z2dlc3Rpb25zKHJhd1ZhbHVlPzogc3RyaW5nKTogc3RyaW5nW10ge1xuICAgIGlmICh0aGlzLnNvdXJjZURyb3Bkb3duPy5nZXRWYWx1ZSgpICE9PSBcIk90aGVyXCIpIHJldHVybiBbXTtcblxuICAgIGNvbnN0IHZhbHVlID0gKHJhd1ZhbHVlID8/IHRoaXMub3RoZXJTb3VyY2VJbnB1dD8uZ2V0VmFsdWUoKSA/PyBcIlwiKS50cmltKCk7XG4gICAgY29uc3QgZnJhZ21lbnQgPSBnZXRDdXJyZW50U291cmNlRnJhZ21lbnQodmFsdWUpO1xuXG4gICAgaWYgKCFmcmFnbWVudCkgcmV0dXJuIFtdO1xuXG4gICAgcmV0dXJuIHRoaXMuc3VnZ2VzdGVkT3RoZXJTb3VyY2VzXG4gICAgICAuZmlsdGVyKChzb3VyY2UpID0+IHNvdXJjZS50b0xvd2VyQ2FzZSgpICE9PSB2YWx1ZS50b0xvd2VyQ2FzZSgpKVxuICAgICAgLmZpbHRlcigoc291cmNlKSA9PiBzb3VyY2UudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhmcmFnbWVudCkpXG4gICAgICAuc2xpY2UoMCwgOCk7XG4gIH1cblxuICBwcml2YXRlIHJlZnJlc2hQcmV2aWV3KCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5wcmV2aWV3RWwpIHJldHVybjtcblxuICAgIHJlbmRlck1vbnN0ZXJCbG9jayhcbiAgICAgIHRoaXMucHJldmlld0VsLFxuICAgICAgdGhpcy5tb25zdGVyLFxuICAgICAge1xuICAgICAgICAuLi5ERUZBVUxUX1NFVFRJTkdTLFxuICAgICAgICBjb21wYWN0TW9kZTogZmFsc2UsXG4gICAgICAgIHNob3dTb3VyY2U6IHRydWUsXG4gICAgICAgIHNob3dUYWdzOiB0cnVlXG4gICAgICB9LFxuICAgICAgdGhpcy53YXJuaW5nc1xuICAgICk7XG4gIH1cblxuICBwcml2YXRlIHJlZnJlc2hTb3VyY2VWaXNpYmlsaXR5KCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5vdGhlclNvdXJjZVNldHRpbmdFbCkgcmV0dXJuO1xuXG4gICAgY29uc3QgZHJvcGRvd25WYWx1ZSA9IHRoaXMuc291cmNlRHJvcGRvd24/LmdldFZhbHVlKCkgPz8gXCJDb3JlIFJ1bGVzXCI7XG4gICAgY29uc3QgdmlzaWJsZSA9IGRyb3Bkb3duVmFsdWUgPT09IFwiT3RoZXJcIjtcblxuICAgIHRoaXMub3RoZXJTb3VyY2VTZXR0aW5nRWwuc3R5bGUuZGlzcGxheSA9IHZpc2libGUgPyBcIlwiIDogXCJub25lXCI7XG5cbiAgICBpZiAodGhpcy5vdGhlclNvdXJjZVN1Z2dlc3Rpb25zRWwpIHtcbiAgICAgIHRoaXMub3RoZXJTb3VyY2VTdWdnZXN0aW9uc0VsLnN0eWxlLmRpc3BsYXkgPSB2aXNpYmxlID8gXCJcIiA6IFwibm9uZVwiO1xuICAgIH1cblxuICAgIHRoaXMucmVmcmVzaE90aGVyU291cmNlU3VnZ2VzdGlvbnMoKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVmcmVzaFRhZ1N1Z2dlc3Rpb25zKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy50YWdTdWdnZXN0aW9uc0VsIHx8ICF0aGlzLnRhZ3NJbnB1dCkgcmV0dXJuO1xuXG4gICAgdGhpcy50YWdTdWdnZXN0aW9uc0VsLmlubmVySFRNTCA9IFwiXCI7XG5cbiAgICBjb25zdCByYXdWYWx1ZSA9IHRoaXMudGFnc0lucHV0LmdldFZhbHVlKCk7XG4gICAgdGhpcy5maWx0ZXJlZFRhZ1N1Z2dlc3Rpb25zID0gdGhpcy5nZXRNYXRjaGluZ1RhZ1N1Z2dlc3Rpb25zKHJhd1ZhbHVlKTtcblxuICAgIGlmICh0aGlzLmZpbHRlcmVkVGFnU3VnZ2VzdGlvbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLmhpZ2hsaWdodGVkVGFnU3VnZ2VzdGlvbkluZGV4ID0gLTE7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaGlnaGxpZ2h0ZWRUYWdTdWdnZXN0aW9uSW5kZXggPCAwKSB7XG4gICAgICB0aGlzLmhpZ2hsaWdodGVkVGFnU3VnZ2VzdGlvbkluZGV4ID0gMDtcbiAgICB9IGVsc2UgaWYgKHRoaXMuaGlnaGxpZ2h0ZWRUYWdTdWdnZXN0aW9uSW5kZXggPj0gdGhpcy5maWx0ZXJlZFRhZ1N1Z2dlc3Rpb25zLmxlbmd0aCkge1xuICAgICAgdGhpcy5oaWdobGlnaHRlZFRhZ1N1Z2dlc3Rpb25JbmRleCA9IHRoaXMuZmlsdGVyZWRUYWdTdWdnZXN0aW9ucy5sZW5ndGggLSAxO1xuICAgIH1cblxuICAgIGNvbnN0IGxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBsYWJlbC5jbGFzc05hbWUgPSBcInNkLXRhZy1zdWdnZXN0aW9ucy1sYWJlbFwiO1xuICAgIGxhYmVsLnRleHRDb250ZW50ID0gXCJNYXRjaGluZyB0YWdzXCI7XG4gICAgdGhpcy50YWdTdWdnZXN0aW9uc0VsLmFwcGVuZENoaWxkKGxhYmVsKTtcblxuICAgIGNvbnN0IGNoaXBzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBjaGlwcy5jbGFzc05hbWUgPSBcInNkLXRhZy1zdWdnZXN0aW9ucy1jaGlwc1wiO1xuXG4gICAgdGhpcy5maWx0ZXJlZFRhZ1N1Z2dlc3Rpb25zLmZvckVhY2goKHRhZywgaW5kZXgpID0+IHtcbiAgICAgIGNvbnN0IGNoaXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICAgICAgY2hpcC50eXBlID0gXCJidXR0b25cIjtcbiAgICAgIGNoaXAuY2xhc3NOYW1lID0gXCJzZC10YWctc3VnZ2VzdGlvbi1jaGlwXCI7XG5cbiAgICAgIGlmIChpbmRleCA9PT0gdGhpcy5oaWdobGlnaHRlZFRhZ1N1Z2dlc3Rpb25JbmRleCkge1xuICAgICAgICBjaGlwLmNsYXNzTGlzdC5hZGQoXCJpcy1hY3RpdmVcIik7XG4gICAgICB9XG5cbiAgICAgIGNoaXAudGV4dENvbnRlbnQgPSB0YWc7XG4gICAgICBjaGlwLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHVwZGF0ZWRWYWx1ZSA9IHJlcGxhY2VDdXJyZW50VGFnRnJhZ21lbnQocmF3VmFsdWUsIHRhZyk7XG4gICAgICAgIHRoaXMubW9uc3Rlci50YWdzID0gc3BsaXRUYWdzKHVwZGF0ZWRWYWx1ZSk7XG4gICAgICAgIHRoaXMudGFnc0lucHV0LnNldFZhbHVlKGpvaW5UYWdzKHRoaXMubW9uc3Rlci50YWdzKSk7XG4gICAgICAgIHRoaXMuaGlnaGxpZ2h0ZWRUYWdTdWdnZXN0aW9uSW5kZXggPSAtMTtcbiAgICAgICAgdGhpcy5yZWZyZXNoVGFnU3VnZ2VzdGlvbnMoKTtcbiAgICAgICAgdGhpcy5yZWZyZXNoUHJldmlldygpO1xuICAgICAgfSk7XG5cbiAgICAgIGNoaXBzLmFwcGVuZENoaWxkKGNoaXApO1xuICAgIH0pO1xuXG4gICAgdGhpcy50YWdTdWdnZXN0aW9uc0VsLmFwcGVuZENoaWxkKGNoaXBzKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVmcmVzaE90aGVyU291cmNlU3VnZ2VzdGlvbnMoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLm90aGVyU291cmNlU3VnZ2VzdGlvbnNFbCB8fCAhdGhpcy5vdGhlclNvdXJjZUlucHV0KSByZXR1cm47XG5cbiAgICB0aGlzLm90aGVyU291cmNlU3VnZ2VzdGlvbnNFbC5pbm5lckhUTUwgPSBcIlwiO1xuXG4gICAgaWYgKHRoaXMuc291cmNlRHJvcGRvd24/LmdldFZhbHVlKCkgIT09IFwiT3RoZXJcIikge1xuICAgICAgdGhpcy5maWx0ZXJlZE90aGVyU291cmNlU3VnZ2VzdGlvbnMgPSBbXTtcbiAgICAgIHRoaXMuaGlnaGxpZ2h0ZWRPdGhlclNvdXJjZVN1Z2dlc3Rpb25JbmRleCA9IC0xO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHJhd1ZhbHVlID0gdGhpcy5vdGhlclNvdXJjZUlucHV0LmdldFZhbHVlKCkudHJpbSgpO1xuICAgIHRoaXMuZmlsdGVyZWRPdGhlclNvdXJjZVN1Z2dlc3Rpb25zID0gdGhpcy5nZXRNYXRjaGluZ090aGVyU291cmNlU3VnZ2VzdGlvbnMocmF3VmFsdWUpO1xuXG4gICAgaWYgKHRoaXMuZmlsdGVyZWRPdGhlclNvdXJjZVN1Z2dlc3Rpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhpcy5oaWdobGlnaHRlZE90aGVyU291cmNlU3VnZ2VzdGlvbkluZGV4ID0gLTE7XG5cbiAgICAgIGNvbnN0IGVtcHR5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgIGVtcHR5LmNsYXNzTmFtZSA9IFwic2QtdGFnLXN1Z2dlc3Rpb25zLWVtcHR5XCI7XG4gICAgICBlbXB0eS50ZXh0Q29udGVudCA9IFwiTm8gbWF0Y2hpbmcgc291cmNlc1wiO1xuICAgICAgdGhpcy5vdGhlclNvdXJjZVN1Z2dlc3Rpb25zRWwuYXBwZW5kQ2hpbGQoZW1wdHkpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhpZ2hsaWdodGVkT3RoZXJTb3VyY2VTdWdnZXN0aW9uSW5kZXggPCAwKSB7XG4gICAgICB0aGlzLmhpZ2hsaWdodGVkT3RoZXJTb3VyY2VTdWdnZXN0aW9uSW5kZXggPSAwO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICB0aGlzLmhpZ2hsaWdodGVkT3RoZXJTb3VyY2VTdWdnZXN0aW9uSW5kZXggPj1cbiAgICAgIHRoaXMuZmlsdGVyZWRPdGhlclNvdXJjZVN1Z2dlc3Rpb25zLmxlbmd0aFxuICAgICkge1xuICAgICAgdGhpcy5oaWdobGlnaHRlZE90aGVyU291cmNlU3VnZ2VzdGlvbkluZGV4ID1cbiAgICAgICAgdGhpcy5maWx0ZXJlZE90aGVyU291cmNlU3VnZ2VzdGlvbnMubGVuZ3RoIC0gMTtcbiAgICB9XG5cbiAgICBjb25zdCBsYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgbGFiZWwuY2xhc3NOYW1lID0gXCJzZC10YWctc3VnZ2VzdGlvbnMtbGFiZWxcIjtcbiAgICBsYWJlbC50ZXh0Q29udGVudCA9IFwiTWF0Y2hpbmcgc291cmNlc1wiO1xuICAgIHRoaXMub3RoZXJTb3VyY2VTdWdnZXN0aW9uc0VsLmFwcGVuZENoaWxkKGxhYmVsKTtcblxuICAgIGNvbnN0IGNoaXBzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBjaGlwcy5jbGFzc05hbWUgPSBcInNkLXRhZy1zdWdnZXN0aW9ucy1jaGlwc1wiO1xuXG4gICAgdGhpcy5maWx0ZXJlZE90aGVyU291cmNlU3VnZ2VzdGlvbnMuZm9yRWFjaCgoc291cmNlLCBpbmRleCkgPT4ge1xuICAgICAgY29uc3QgY2hpcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgICBjaGlwLnR5cGUgPSBcImJ1dHRvblwiO1xuICAgICAgY2hpcC5jbGFzc05hbWUgPSBcInNkLXRhZy1zdWdnZXN0aW9uLWNoaXBcIjtcblxuICAgICAgaWYgKGluZGV4ID09PSB0aGlzLmhpZ2hsaWdodGVkT3RoZXJTb3VyY2VTdWdnZXN0aW9uSW5kZXgpIHtcbiAgICAgICAgY2hpcC5jbGFzc0xpc3QuYWRkKFwiaXMtYWN0aXZlXCIpO1xuICAgICAgfVxuXG4gICAgICBjaGlwLnRleHRDb250ZW50ID0gc291cmNlO1xuICAgICAgY2hpcC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICB0aGlzLm1vbnN0ZXIuc291cmNlID0gc291cmNlO1xuICAgICAgICB0aGlzLm90aGVyU291cmNlSW5wdXQuc2V0VmFsdWUoc291cmNlKTtcbiAgICAgICAgdGhpcy5oaWdobGlnaHRlZE90aGVyU291cmNlU3VnZ2VzdGlvbkluZGV4ID0gLTE7XG4gICAgICAgIHRoaXMucmVmcmVzaE90aGVyU291cmNlU3VnZ2VzdGlvbnMoKTtcbiAgICAgICAgdGhpcy5yZWZyZXNoUHJldmlldygpO1xuICAgICAgfSk7XG5cbiAgICAgIGNoaXBzLmFwcGVuZENoaWxkKGNoaXApO1xuICAgIH0pO1xuXG4gICAgdGhpcy5vdGhlclNvdXJjZVN1Z2dlc3Rpb25zRWwuYXBwZW5kQ2hpbGQoY2hpcHMpO1xuICB9XG5cbiAgcHJpdmF0ZSBtb3ZlVGFnU3VnZ2VzdGlvblNlbGVjdGlvbihkaXJlY3Rpb246IDEgfCAtMSk6IHZvaWQge1xuICAgIGlmICh0aGlzLmZpbHRlcmVkVGFnU3VnZ2VzdGlvbnMubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgICBpZiAodGhpcy5oaWdobGlnaHRlZFRhZ1N1Z2dlc3Rpb25JbmRleCA8IDApIHtcbiAgICAgIHRoaXMuaGlnaGxpZ2h0ZWRUYWdTdWdnZXN0aW9uSW5kZXggPVxuICAgICAgICBkaXJlY3Rpb24gPT09IDEgPyAwIDogdGhpcy5maWx0ZXJlZFRhZ1N1Z2dlc3Rpb25zLmxlbmd0aCAtIDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuaGlnaGxpZ2h0ZWRUYWdTdWdnZXN0aW9uSW5kZXggPVxuICAgICAgICAodGhpcy5oaWdobGlnaHRlZFRhZ1N1Z2dlc3Rpb25JbmRleCArIGRpcmVjdGlvbiArIHRoaXMuZmlsdGVyZWRUYWdTdWdnZXN0aW9ucy5sZW5ndGgpICVcbiAgICAgICAgdGhpcy5maWx0ZXJlZFRhZ1N1Z2dlc3Rpb25zLmxlbmd0aDtcbiAgICB9XG5cbiAgICB0aGlzLnJlZnJlc2hUYWdTdWdnZXN0aW9ucygpO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseUhpZ2hsaWdodGVkVGFnU3VnZ2VzdGlvbigpOiB2b2lkIHtcbiAgICBpZiAoXG4gICAgICB0aGlzLmhpZ2hsaWdodGVkVGFnU3VnZ2VzdGlvbkluZGV4IDwgMCB8fFxuICAgICAgdGhpcy5oaWdobGlnaHRlZFRhZ1N1Z2dlc3Rpb25JbmRleCA+PSB0aGlzLmZpbHRlcmVkVGFnU3VnZ2VzdGlvbnMubGVuZ3RoIHx8XG4gICAgICAhdGhpcy50YWdzSW5wdXRcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzZWxlY3RlZFRhZyA9IHRoaXMuZmlsdGVyZWRUYWdTdWdnZXN0aW9uc1t0aGlzLmhpZ2hsaWdodGVkVGFnU3VnZ2VzdGlvbkluZGV4XTtcbiAgICBjb25zdCByYXdWYWx1ZSA9IHRoaXMudGFnc0lucHV0LmdldFZhbHVlKCk7XG4gICAgY29uc3QgdXBkYXRlZFZhbHVlID0gcmVwbGFjZUN1cnJlbnRUYWdGcmFnbWVudChyYXdWYWx1ZSwgc2VsZWN0ZWRUYWcpO1xuXG4gICAgdGhpcy5tb25zdGVyLnRhZ3MgPSBzcGxpdFRhZ3ModXBkYXRlZFZhbHVlKTtcbiAgICB0aGlzLnRhZ3NJbnB1dC5zZXRWYWx1ZShqb2luVGFncyh0aGlzLm1vbnN0ZXIudGFncykpO1xuICAgIHRoaXMuaGlnaGxpZ2h0ZWRUYWdTdWdnZXN0aW9uSW5kZXggPSAtMTtcbiAgICB0aGlzLnJlZnJlc2hUYWdTdWdnZXN0aW9ucygpO1xuICAgIHRoaXMucmVmcmVzaFByZXZpZXcoKTtcbiAgfVxuXG4gIHByaXZhdGUgY2xlYXJUYWdTdWdnZXN0aW9uU2VsZWN0aW9uKCk6IHZvaWQge1xuICAgIHRoaXMuaGlnaGxpZ2h0ZWRUYWdTdWdnZXN0aW9uSW5kZXggPSAtMTtcbiAgICB0aGlzLmZpbHRlcmVkVGFnU3VnZ2VzdGlvbnMgPSBbXTtcbiAgICB0aGlzLnJlZnJlc2hUYWdTdWdnZXN0aW9ucygpO1xuICB9XG5cbiAgcHJpdmF0ZSBtb3ZlT3RoZXJTb3VyY2VTdWdnZXN0aW9uU2VsZWN0aW9uKGRpcmVjdGlvbjogMSB8IC0xKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuZmlsdGVyZWRPdGhlclNvdXJjZVN1Z2dlc3Rpb25zLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuXG4gICAgaWYgKHRoaXMuaGlnaGxpZ2h0ZWRPdGhlclNvdXJjZVN1Z2dlc3Rpb25JbmRleCA8IDApIHtcbiAgICAgIHRoaXMuaGlnaGxpZ2h0ZWRPdGhlclNvdXJjZVN1Z2dlc3Rpb25JbmRleCA9XG4gICAgICAgIGRpcmVjdGlvbiA9PT0gMSA/IDAgOiB0aGlzLmZpbHRlcmVkT3RoZXJTb3VyY2VTdWdnZXN0aW9ucy5sZW5ndGggLSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmhpZ2hsaWdodGVkT3RoZXJTb3VyY2VTdWdnZXN0aW9uSW5kZXggPVxuICAgICAgICAodGhpcy5oaWdobGlnaHRlZE90aGVyU291cmNlU3VnZ2VzdGlvbkluZGV4ICtcbiAgICAgICAgICBkaXJlY3Rpb24gK1xuICAgICAgICAgIHRoaXMuZmlsdGVyZWRPdGhlclNvdXJjZVN1Z2dlc3Rpb25zLmxlbmd0aCkgJVxuICAgICAgICB0aGlzLmZpbHRlcmVkT3RoZXJTb3VyY2VTdWdnZXN0aW9ucy5sZW5ndGg7XG4gICAgfVxuXG4gICAgdGhpcy5yZWZyZXNoT3RoZXJTb3VyY2VTdWdnZXN0aW9ucygpO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseUhpZ2hsaWdodGVkT3RoZXJTb3VyY2VTdWdnZXN0aW9uKCk6IHZvaWQge1xuICAgIGlmIChcbiAgICAgIHRoaXMuaGlnaGxpZ2h0ZWRPdGhlclNvdXJjZVN1Z2dlc3Rpb25JbmRleCA8IDAgfHxcbiAgICAgIHRoaXMuaGlnaGxpZ2h0ZWRPdGhlclNvdXJjZVN1Z2dlc3Rpb25JbmRleCA+PVxuICAgICAgICB0aGlzLmZpbHRlcmVkT3RoZXJTb3VyY2VTdWdnZXN0aW9ucy5sZW5ndGggfHxcbiAgICAgICF0aGlzLm90aGVyU291cmNlSW5wdXRcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzZWxlY3RlZFNvdXJjZSA9XG4gICAgICB0aGlzLmZpbHRlcmVkT3RoZXJTb3VyY2VTdWdnZXN0aW9uc1t0aGlzLmhpZ2hsaWdodGVkT3RoZXJTb3VyY2VTdWdnZXN0aW9uSW5kZXhdO1xuXG4gICAgdGhpcy5tb25zdGVyLnNvdXJjZSA9IHNlbGVjdGVkU291cmNlO1xuICAgIHRoaXMub3RoZXJTb3VyY2VJbnB1dC5zZXRWYWx1ZShzZWxlY3RlZFNvdXJjZSk7XG4gICAgdGhpcy5oaWdobGlnaHRlZE90aGVyU291cmNlU3VnZ2VzdGlvbkluZGV4ID0gLTE7XG4gICAgdGhpcy5yZWZyZXNoT3RoZXJTb3VyY2VTdWdnZXN0aW9ucygpO1xuICAgIHRoaXMucmVmcmVzaFByZXZpZXcoKTtcbiAgfVxuXG4gIHByaXZhdGUgY2xlYXJPdGhlclNvdXJjZVN1Z2dlc3Rpb25TZWxlY3Rpb24oKTogdm9pZCB7XG4gICAgdGhpcy5oaWdobGlnaHRlZE90aGVyU291cmNlU3VnZ2VzdGlvbkluZGV4ID0gLTE7XG4gICAgdGhpcy5maWx0ZXJlZE90aGVyU291cmNlU3VnZ2VzdGlvbnMgPSBbXTtcbiAgICB0aGlzLnJlZnJlc2hPdGhlclNvdXJjZVN1Z2dlc3Rpb25zKCk7XG4gIH1cblxuICBwcml2YXRlIHJlZnJlc2hGb3JtRmllbGRzKCk6IHZvaWQge1xuICAgIHRoaXMubmFtZUlucHV0Py5zZXRWYWx1ZSh0aGlzLm1vbnN0ZXIubmFtZSk7XG4gICAgdGhpcy5kZXNjcmlwdGlvbklucHV0Py5zZXRWYWx1ZSh0aGlzLm1vbnN0ZXIuZGVzY3JpcHRpb24pO1xuXG4gICAgY29uc3QgZHJvcGRvd25WYWx1ZSA9IG5vcm1hbGl6ZVNvdXJjZUZvckRyb3Bkb3duKHRoaXMubW9uc3Rlci5zb3VyY2UpO1xuICAgIHRoaXMuc291cmNlRHJvcGRvd24/LnNldFZhbHVlKGRyb3Bkb3duVmFsdWUpO1xuXG4gICAgaWYgKGRyb3Bkb3duVmFsdWUgPT09IFwiT3RoZXJcIikge1xuICAgICAgdGhpcy5vdGhlclNvdXJjZUlucHV0Py5zZXRWYWx1ZSh0aGlzLm1vbnN0ZXIuc291cmNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5vdGhlclNvdXJjZUlucHV0Py5zZXRWYWx1ZShcIlwiKTtcbiAgICB9XG5cbiAgICB0aGlzLnRhZ3NJbnB1dD8uc2V0VmFsdWUoam9pblRhZ3ModGhpcy5tb25zdGVyLnRhZ3MpKTtcblxuICAgIHRoaXMubGV2ZWxJbnB1dD8uc2V0VmFsdWUodGhpcy5tb25zdGVyLmxldmVsKTtcbiAgICB0aGlzLmFsaWdubWVudElucHV0Py5zZXRWYWx1ZSh0aGlzLm1vbnN0ZXIuYWxpZ25tZW50KTtcbiAgICB0aGlzLmFjSW5wdXQ/LnNldFZhbHVlKHRoaXMubW9uc3Rlci5hYyk7XG4gICAgdGhpcy5ocElucHV0Py5zZXRWYWx1ZSh0aGlzLm1vbnN0ZXIuaHApO1xuICAgIHRoaXMubXZJbnB1dD8uc2V0VmFsdWUodGhpcy5tb25zdGVyLm12KTtcblxuICAgIHRoaXMuc3RySW5wdXQ/LnNldFZhbHVlKHRoaXMubW9uc3Rlci5zdGF0cy5zdHIpO1xuICAgIHRoaXMuZGV4SW5wdXQ/LnNldFZhbHVlKHRoaXMubW9uc3Rlci5zdGF0cy5kZXgpO1xuICAgIHRoaXMuY29uSW5wdXQ/LnNldFZhbHVlKHRoaXMubW9uc3Rlci5zdGF0cy5jb24pO1xuICAgIHRoaXMuaW50SW5wdXQ/LnNldFZhbHVlKHRoaXMubW9uc3Rlci5zdGF0cy5pbnQpO1xuICAgIHRoaXMud2lzSW5wdXQ/LnNldFZhbHVlKHRoaXMubW9uc3Rlci5zdGF0cy53aXMpO1xuICAgIHRoaXMuY2hhSW5wdXQ/LnNldFZhbHVlKHRoaXMubW9uc3Rlci5zdGF0cy5jaGEpO1xuXG4gICAgdGhpcy5hdHRhY2tzSW5wdXQ/LnNldFZhbHVlKGpvaW5BdHRhY2tMaW5lcyh0aGlzLm1vbnN0ZXIpKTtcbiAgICB0aGlzLnRyYWl0c0lucHV0Py5zZXRWYWx1ZSh0aGlzLm1vbnN0ZXIudHJhaXRzLmpvaW4oXCJcXG5cIikpO1xuICAgIHRoaXMuc3BlbGxzSW5wdXQ/LnNldFZhbHVlKHRoaXMubW9uc3Rlci5zcGVsbHMuam9pbihcIlxcblwiKSk7XG4gICAgdGhpcy5zcGVjaWFsc0lucHV0Py5zZXRWYWx1ZSh0aGlzLm1vbnN0ZXIuc3BlY2lhbHMuam9pbihcIlxcblwiKSk7XG4gICAgdGhpcy5nZWFySW5wdXQ/LnNldFZhbHVlKHRoaXMubW9uc3Rlci5nZWFyLmpvaW4oXCJcXG5cIikpO1xuXG4gICAgdGhpcy5yZWZyZXNoU291cmNlVmlzaWJpbGl0eSgpO1xuICAgIHRoaXMucmVmcmVzaFRhZ1N1Z2dlc3Rpb25zKCk7XG4gICAgdGhpcy5yZWZyZXNoT3RoZXJTb3VyY2VTdWdnZXN0aW9ucygpO1xuICB9XG5cbiAgcHJpdmF0ZSBmaXhDb21tb25Jc3N1ZXMoKTogdm9pZCB7XG4gICAgdGhpcy5tb25zdGVyID0gZml4TW9uc3RlckNvbW1vbklzc3Vlcyh0aGlzLm1vbnN0ZXIpO1xuICAgIHRoaXMucmVmcmVzaEZvcm1GaWVsZHMoKTtcbiAgICB0aGlzLnJlZnJlc2hQcmV2aWV3KCk7XG4gICAgbmV3IE5vdGljZShcIkNvbW1vbiBpc3N1ZXMgY2xlYW5lZCB1cC5cIik7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250ZW50RWwsIHRpdGxlRWwgfSA9IHRoaXM7XG5cbiAgICB0aXRsZUVsLnNldFRleHQoXG4gICAgICB0aGlzLm1vZGUgPT09IFwiZWRpdFwiXG4gICAgICAgID8gXCJFZGl0IFNoYWRvd2RhcmsgTW9uc3RlclwiXG4gICAgICAgIDogXCJJbXBvcnQgU2hhZG93ZGFyayBNb25zdGVyXCJcbiAgICApO1xuXG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgY29udGVudEVsLmFkZENsYXNzKFwic2QtaW1wb3J0LXByZXZpZXctbW9kYWxcIik7XG5cbiAgICB0aGlzLm1vZGFsRWwuYWRkQ2xhc3MoXCJzZC1pbXBvcnQtcHJldmlldy1tb2RhbC1zaGVsbFwiKTtcbiAgICB0aGlzLm1vZGFsRWwuc3R5bGUud2lkdGggPSBcIm1pbigxMjgwcHgsIDk0dncpXCI7XG4gICAgdGhpcy5tb2RhbEVsLnN0eWxlLm1heFdpZHRoID0gXCI5NHZ3XCI7XG4gICAgdGhpcy5tb2RhbEVsLnN0eWxlLmhlaWdodCA9IFwibWluKDkwdmgsIDkyMHB4KVwiO1xuXG4gICAgY29uc3QgaW50cm8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicFwiKTtcbiAgICBpbnRyby5jbGFzc05hbWUgPSBcInNkLWltcG9ydC1wcmV2aWV3LWRlc2NyaXB0aW9uXCI7XG4gICAgaW50cm8udGV4dENvbnRlbnQgPVxuICAgICAgdGhpcy5tb2RlID09PSBcImVkaXRcIlxuICAgICAgICA/IFwiUmV2aWV3IGFuZCBlZGl0IHRoZSBtb25zdGVyLCB0aGVuIHVwZGF0ZSB0aGUgbm90ZS5cIlxuICAgICAgICA6IFwiUmV2aWV3IGFuZCBlZGl0IHRoZSBpbXBvcnRlZCBtb25zdGVyIGJlZm9yZSBjcmVhdGluZyB0aGUgbm90ZS5cIjtcbiAgICBjb250ZW50RWwuYXBwZW5kQ2hpbGQoaW50cm8pO1xuICAgIGlmICh0aGlzLnByb2dyZXNzTGFiZWwpIHtcbiAgICAgIGNvbnN0IHByb2dyZXNzRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgcHJvZ3Jlc3NFbC5jbGFzc05hbWUgPSBcInNkLWltcG9ydC1wcmV2aWV3LXByb2dyZXNzXCI7XG4gICAgICBwcm9ncmVzc0VsLnRleHRDb250ZW50ID0gdGhpcy5wcm9ncmVzc0xhYmVsO1xuICAgICAgY29udGVudEVsLmFwcGVuZENoaWxkKHByb2dyZXNzRWwpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLndhcm5pbmdzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHdhcm5pbmdCb3ggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgd2FybmluZ0JveC5jbGFzc05hbWUgPSBcInNkLWltcG9ydC1wcmV2aWV3LXdhcm5pbmdzXCI7XG5cbiAgICAgIGNvbnN0IHdhcm5pbmdUaXRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJoNFwiKTtcbiAgICAgIHdhcm5pbmdUaXRsZS50ZXh0Q29udGVudCA9IFwiV2FybmluZ3NcIjtcbiAgICAgIHdhcm5pbmdCb3guYXBwZW5kQ2hpbGQod2FybmluZ1RpdGxlKTtcblxuICAgICAgY29uc3Qgd2FybmluZ0xpc3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidWxcIik7XG4gICAgICBmb3IgKGNvbnN0IHdhcm5pbmcgb2YgdGhpcy53YXJuaW5ncykge1xuICAgICAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcbiAgICAgICAgbGkudGV4dENvbnRlbnQgPSB3YXJuaW5nO1xuICAgICAgICB3YXJuaW5nTGlzdC5hcHBlbmRDaGlsZChsaSk7XG4gICAgICB9XG5cbiAgICAgIHdhcm5pbmdCb3guYXBwZW5kQ2hpbGQod2FybmluZ0xpc3QpO1xuICAgICAgY29udGVudEVsLmFwcGVuZENoaWxkKHdhcm5pbmdCb3gpO1xuICAgIH1cblxuICAgIGNvbnN0IGxheW91dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgbGF5b3V0LmNsYXNzTmFtZSA9IFwic2QtaW1wb3J0LXByZXZpZXctbGF5b3V0XCI7XG4gICAgY29udGVudEVsLmFwcGVuZENoaWxkKGxheW91dCk7XG5cbiAgICBjb25zdCBmb3JtQ29sID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBmb3JtQ29sLmNsYXNzTmFtZSA9IFwic2QtaW1wb3J0LXByZXZpZXctZm9ybVwiO1xuICAgIGxheW91dC5hcHBlbmRDaGlsZChmb3JtQ29sKTtcblxuICAgIGNvbnN0IHByZXZpZXdDb2wgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIHByZXZpZXdDb2wuY2xhc3NOYW1lID0gXCJzZC1pbXBvcnQtcHJldmlldy1wYW5lbFwiO1xuICAgIGxheW91dC5hcHBlbmRDaGlsZChwcmV2aWV3Q29sKTtcblxuICAgIGNvbnN0IHByZXZpZXdIZWFkaW5nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImgzXCIpO1xuICAgIHByZXZpZXdIZWFkaW5nLnRleHRDb250ZW50ID0gXCJMaXZlIFByZXZpZXdcIjtcbiAgICBwcmV2aWV3Q29sLmFwcGVuZENoaWxkKHByZXZpZXdIZWFkaW5nKTtcblxuICAgIHRoaXMucHJldmlld0VsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICB0aGlzLnByZXZpZXdFbC5jbGFzc05hbWUgPSBcInNkLWltcG9ydC1wcmV2aWV3LXN0YXRibG9ja1wiO1xuICAgIHByZXZpZXdDb2wuYXBwZW5kQ2hpbGQodGhpcy5wcmV2aWV3RWwpO1xuXG4gICAgZm9ybUNvbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJDb3JlXCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhmb3JtQ29sKVxuICAgICAgLnNldE5hbWUoXCJOYW1lXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICB0aGlzLm5hbWVJbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHRcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5tb25zdGVyLm5hbWUpXG4gICAgICAgICAgLm9uQ2hhbmdlKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tb25zdGVyLm5hbWUgPSB2YWx1ZS50cmltKCk7XG4gICAgICAgICAgICB0aGlzLnJlZnJlc2hQcmV2aWV3KCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGZvcm1Db2wpXG4gICAgICAuc2V0TmFtZShcIkRlc2NyaXB0aW9uXCIpXG4gICAgICAuYWRkVGV4dEFyZWEoKHRleHQpID0+IHtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbklucHV0ID0gdGV4dDtcbiAgICAgICAgdGV4dFxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLm1vbnN0ZXIuZGVzY3JpcHRpb24pXG4gICAgICAgICAgLm9uQ2hhbmdlKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tb25zdGVyLmRlc2NyaXB0aW9uID0gdmFsdWUudHJpbSgpO1xuICAgICAgICAgICAgdGhpcy5yZWZyZXNoUHJldmlldygpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB0ZXh0LmlucHV0RWwucm93cyA9IDQ7XG4gICAgICAgIHRleHQuaW5wdXRFbC5hZGRDbGFzcyhcInNkLWltcG9ydC1wcmV2aWV3LXRleHRhcmVhXCIpO1xuICAgICAgfSk7XG5cbiAgICBmb3JtQ29sLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIk1ldGFkYXRhXCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhmb3JtQ29sKVxuICAgICAgLnNldE5hbWUoXCJTb3VyY2VcIilcbiAgICAgIC5zZXREZXNjKFwiQ2hvb3NlIGEgc291cmNlIGZvciB0aGlzIG1vbnN0ZXJcIilcbiAgICAgIC5hZGREcm9wZG93bigoZHJvcGRvd24pID0+IHtcbiAgICAgICAgdGhpcy5zb3VyY2VEcm9wZG93biA9IGRyb3Bkb3duO1xuXG4gICAgICAgIFNPVVJDRV9PUFRJT05TLmZvckVhY2goKG9wdGlvbjogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgZHJvcGRvd24uYWRkT3B0aW9uKG9wdGlvbiwgb3B0aW9uKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZHJvcGRvd25cbiAgICAgICAgICAuc2V0VmFsdWUobm9ybWFsaXplU291cmNlRm9yRHJvcGRvd24odGhpcy5tb25zdGVyLnNvdXJjZSkpXG4gICAgICAgICAgLm9uQ2hhbmdlKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSBcIk90aGVyXCIpIHtcbiAgICAgICAgICAgICAgdGhpcy5tb25zdGVyLnNvdXJjZSA9IHRoaXMub3RoZXJTb3VyY2VJbnB1dD8uZ2V0VmFsdWUoKS50cmltKCkgfHwgXCJcIjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXMubW9uc3Rlci5zb3VyY2UgPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5oaWdobGlnaHRlZE90aGVyU291cmNlU3VnZ2VzdGlvbkluZGV4ID0gLTE7XG4gICAgICAgICAgICB0aGlzLnJlZnJlc2hTb3VyY2VWaXNpYmlsaXR5KCk7XG4gICAgICAgICAgICB0aGlzLnJlZnJlc2hQcmV2aWV3KCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIGNvbnN0IG90aGVyU291cmNlU2V0dGluZyA9IG5ldyBTZXR0aW5nKGZvcm1Db2wpXG4gICAgICAuc2V0TmFtZShcIk90aGVyIFNvdXJjZVwiKVxuICAgICAgLnNldERlc2MoXCJUeXBlIGEgY3VzdG9tIHNvdXJjZSBuYW1lXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICB0aGlzLm90aGVyU291cmNlSW5wdXQgPSB0ZXh0O1xuICAgICAgICB0ZXh0XG4gICAgICAgICAgLnNldFZhbHVlKFxuICAgICAgICAgICAgbm9ybWFsaXplU291cmNlRm9yRHJvcGRvd24odGhpcy5tb25zdGVyLnNvdXJjZSkgPT09IFwiT3RoZXJcIlxuICAgICAgICAgICAgICA/IHRoaXMubW9uc3Rlci5zb3VyY2VcbiAgICAgICAgICAgICAgOiBcIlwiXG4gICAgICAgICAgKVxuICAgICAgICAgIC5vbkNoYW5nZSgodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLnNvdXJjZURyb3Bkb3duPy5nZXRWYWx1ZSgpID09PSBcIk90aGVyXCIpIHtcbiAgICAgICAgICAgICAgdGhpcy5tb25zdGVyLnNvdXJjZSA9IHZhbHVlLnRyaW0oKTtcbiAgICAgICAgICAgICAgdGhpcy5oaWdobGlnaHRlZE90aGVyU291cmNlU3VnZ2VzdGlvbkluZGV4ID0gLTE7XG4gICAgICAgICAgICAgIHRoaXMucmVmcmVzaE90aGVyU291cmNlU3VnZ2VzdGlvbnMoKTtcbiAgICAgICAgICAgICAgdGhpcy5yZWZyZXNoUHJldmlldygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgIHRleHQuaW5wdXRFbC5vbmtleWRvd24gPSAoZXZ0OiBLZXlib2FyZEV2ZW50KSA9PiB7XG4gICAgICAgICAgY29uc3QgYWN0aW9uID0gZ2V0TmF2QWN0aW9uKGV2dCk7XG4gICAgICAgICAgdGhpcy5maWx0ZXJlZE90aGVyU291cmNlU3VnZ2VzdGlvbnMgPVxuICAgICAgICAgICAgdGhpcy5nZXRNYXRjaGluZ090aGVyU291cmNlU3VnZ2VzdGlvbnModGV4dC5nZXRWYWx1ZSgpKTtcbiAgICAgICAgICBjb25zdCBoYXNTdWdnZXN0aW9ucyA9IHRoaXMuZmlsdGVyZWRPdGhlclNvdXJjZVN1Z2dlc3Rpb25zLmxlbmd0aCA+IDA7XG5cbiAgICAgICAgICBpZiAoIWFjdGlvbiB8fCAhaGFzU3VnZ2VzdGlvbnMpIHJldHVybjtcblxuICAgICAgICAgIGlmIChhY3Rpb24gPT09IFwibmV4dFwiKSB7XG4gICAgICAgICAgICBzdG9wS2V5RXZlbnQoZXZ0KTtcbiAgICAgICAgICAgIHRoaXMubW92ZU90aGVyU291cmNlU3VnZ2VzdGlvblNlbGVjdGlvbigxKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoYWN0aW9uID09PSBcInByZXZcIikge1xuICAgICAgICAgICAgc3RvcEtleUV2ZW50KGV2dCk7XG4gICAgICAgICAgICB0aGlzLm1vdmVPdGhlclNvdXJjZVN1Z2dlc3Rpb25TZWxlY3Rpb24oLTEpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChhY3Rpb24gPT09IFwiZW50ZXJcIikge1xuICAgICAgICAgICAgc3RvcEtleUV2ZW50KGV2dCk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmhpZ2hsaWdodGVkT3RoZXJTb3VyY2VTdWdnZXN0aW9uSW5kZXggPCAwKSB7XG4gICAgICAgICAgICAgIHRoaXMuaGlnaGxpZ2h0ZWRPdGhlclNvdXJjZVN1Z2dlc3Rpb25JbmRleCA9IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuYXBwbHlIaWdobGlnaHRlZE90aGVyU291cmNlU3VnZ2VzdGlvbigpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChhY3Rpb24gPT09IFwiZXNjYXBlXCIpIHtcbiAgICAgICAgICAgIHN0b3BLZXlFdmVudChldnQpO1xuICAgICAgICAgICAgdGhpcy5jbGVhck90aGVyU291cmNlU3VnZ2VzdGlvblNlbGVjdGlvbigpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuXG4gICAgdGhpcy5vdGhlclNvdXJjZVNldHRpbmdFbCA9IG90aGVyU291cmNlU2V0dGluZy5zZXR0aW5nRWw7XG5cbiAgICB0aGlzLm90aGVyU291cmNlU3VnZ2VzdGlvbnNFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgdGhpcy5vdGhlclNvdXJjZVN1Z2dlc3Rpb25zRWwuY2xhc3NOYW1lID0gXCJzZC10YWctc3VnZ2VzdGlvbnNcIjtcbiAgICBmb3JtQ29sLmFwcGVuZENoaWxkKHRoaXMub3RoZXJTb3VyY2VTdWdnZXN0aW9uc0VsKTtcblxuICAgIG5ldyBTZXR0aW5nKGZvcm1Db2wpXG4gICAgICAuc2V0TmFtZShcIlRhZ3NcIilcbiAgICAgIC5zZXREZXNjKFwiQ29tbWEtc2VwYXJhdGVkIHRhZ3NcIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRoaXMudGFnc0lucHV0ID0gdGV4dDtcbiAgICAgICAgdGV4dFxuICAgICAgICAgIC5zZXRWYWx1ZShqb2luVGFncyh0aGlzLm1vbnN0ZXIudGFncykpXG4gICAgICAgICAgLm9uQ2hhbmdlKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tb25zdGVyLnRhZ3MgPSBzcGxpdFRhZ3ModmFsdWUpO1xuICAgICAgICAgICAgdGhpcy5oaWdobGlnaHRlZFRhZ1N1Z2dlc3Rpb25JbmRleCA9IC0xO1xuICAgICAgICAgICAgdGhpcy5yZWZyZXNoVGFnU3VnZ2VzdGlvbnMoKTtcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaFByZXZpZXcoKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICB0ZXh0LmlucHV0RWwub25rZXlkb3duID0gKGV2dDogS2V5Ym9hcmRFdmVudCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGFjdGlvbiA9IGdldE5hdkFjdGlvbihldnQpO1xuICAgICAgICAgIHRoaXMuZmlsdGVyZWRUYWdTdWdnZXN0aW9ucyA9IHRoaXMuZ2V0TWF0Y2hpbmdUYWdTdWdnZXN0aW9ucyh0ZXh0LmdldFZhbHVlKCkpO1xuICAgICAgICAgIGNvbnN0IGhhc1N1Z2dlc3Rpb25zID0gdGhpcy5maWx0ZXJlZFRhZ1N1Z2dlc3Rpb25zLmxlbmd0aCA+IDA7XG5cbiAgICAgICAgICBpZiAoIWFjdGlvbiB8fCAhaGFzU3VnZ2VzdGlvbnMpIHJldHVybjtcblxuICAgICAgICAgIGlmIChhY3Rpb24gPT09IFwibmV4dFwiKSB7XG4gICAgICAgICAgICBzdG9wS2V5RXZlbnQoZXZ0KTtcbiAgICAgICAgICAgIHRoaXMubW92ZVRhZ1N1Z2dlc3Rpb25TZWxlY3Rpb24oMSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGFjdGlvbiA9PT0gXCJwcmV2XCIpIHtcbiAgICAgICAgICAgIHN0b3BLZXlFdmVudChldnQpO1xuICAgICAgICAgICAgdGhpcy5tb3ZlVGFnU3VnZ2VzdGlvblNlbGVjdGlvbigtMSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGFjdGlvbiA9PT0gXCJlbnRlclwiKSB7XG4gICAgICAgICAgICBzdG9wS2V5RXZlbnQoZXZ0KTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuaGlnaGxpZ2h0ZWRUYWdTdWdnZXN0aW9uSW5kZXggPCAwKSB7XG4gICAgICAgICAgICAgIHRoaXMuaGlnaGxpZ2h0ZWRUYWdTdWdnZXN0aW9uSW5kZXggPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmFwcGx5SGlnaGxpZ2h0ZWRUYWdTdWdnZXN0aW9uKCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGFjdGlvbiA9PT0gXCJlc2NhcGVcIikge1xuICAgICAgICAgICAgc3RvcEtleUV2ZW50KGV2dCk7XG4gICAgICAgICAgICB0aGlzLmNsZWFyVGFnU3VnZ2VzdGlvblNlbGVjdGlvbigpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuXG4gICAgdGhpcy50YWdTdWdnZXN0aW9uc0VsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICB0aGlzLnRhZ1N1Z2dlc3Rpb25zRWwuY2xhc3NOYW1lID0gXCJzZC10YWctc3VnZ2VzdGlvbnNcIjtcbiAgICBmb3JtQ29sLmFwcGVuZENoaWxkKHRoaXMudGFnU3VnZ2VzdGlvbnNFbCk7XG5cbiAgICBmb3JtQ29sLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIlN0YXRzXCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhmb3JtQ29sKVxuICAgICAgLnNldE5hbWUoXCJMZXZlbFwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgdGhpcy5sZXZlbElucHV0ID0gdGV4dDtcbiAgICAgICAgdGV4dFxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLm1vbnN0ZXIubGV2ZWwpXG4gICAgICAgICAgLm9uQ2hhbmdlKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tb25zdGVyLmxldmVsID0gdmFsdWUudHJpbSgpO1xuICAgICAgICAgICAgdGhpcy5yZWZyZXNoUHJldmlldygpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhmb3JtQ29sKVxuICAgICAgLnNldE5hbWUoXCJBbGlnbm1lbnRcIilcbiAgICAgIC5zZXREZXNjKFwiVXN1YWxseSBMLCBOLCBvciBDXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICB0aGlzLmFsaWdubWVudElucHV0ID0gdGV4dDtcbiAgICAgICAgdGV4dFxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLm1vbnN0ZXIuYWxpZ25tZW50KVxuICAgICAgICAgIC5vbkNoYW5nZSgodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMubW9uc3Rlci5hbGlnbm1lbnQgPSB2YWx1ZS50cmltKCkudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaFByZXZpZXcoKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoZm9ybUNvbClcbiAgICAgIC5zZXROYW1lKFwiQUNcIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRoaXMuYWNJbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHRcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5tb25zdGVyLmFjKVxuICAgICAgICAgIC5vbkNoYW5nZSgodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMubW9uc3Rlci5hYyA9IHZhbHVlLnRyaW0oKTtcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaFByZXZpZXcoKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoZm9ybUNvbClcbiAgICAgIC5zZXROYW1lKFwiSFBcIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRoaXMuaHBJbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHRcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5tb25zdGVyLmhwKVxuICAgICAgICAgIC5vbkNoYW5nZSgodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMubW9uc3Rlci5ocCA9IHZhbHVlLnRyaW0oKTtcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaFByZXZpZXcoKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoZm9ybUNvbClcbiAgICAgIC5zZXROYW1lKFwiTVZcIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRoaXMubXZJbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHRcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5tb25zdGVyLm12KVxuICAgICAgICAgIC5vbkNoYW5nZSgodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMubW9uc3Rlci5tdiA9IHZhbHVlLnRyaW0oKTtcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaFByZXZpZXcoKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgZm9ybUNvbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJBYmlsaXRpZXNcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGZvcm1Db2wpXG4gICAgICAuc2V0TmFtZShcIlNUUlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgdGhpcy5zdHJJbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHRcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5tb25zdGVyLnN0YXRzLnN0cilcbiAgICAgICAgICAub25DaGFuZ2UoKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1vbnN0ZXIuc3RhdHMuc3RyID0gdmFsdWUudHJpbSgpO1xuICAgICAgICAgICAgdGhpcy5yZWZyZXNoUHJldmlldygpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhmb3JtQ29sKVxuICAgICAgLnNldE5hbWUoXCJERVhcIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRoaXMuZGV4SW5wdXQgPSB0ZXh0O1xuICAgICAgICB0ZXh0XG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMubW9uc3Rlci5zdGF0cy5kZXgpXG4gICAgICAgICAgLm9uQ2hhbmdlKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tb25zdGVyLnN0YXRzLmRleCA9IHZhbHVlLnRyaW0oKTtcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaFByZXZpZXcoKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoZm9ybUNvbClcbiAgICAgIC5zZXROYW1lKFwiQ09OXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICB0aGlzLmNvbklucHV0ID0gdGV4dDtcbiAgICAgICAgdGV4dFxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLm1vbnN0ZXIuc3RhdHMuY29uKVxuICAgICAgICAgIC5vbkNoYW5nZSgodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMubW9uc3Rlci5zdGF0cy5jb24gPSB2YWx1ZS50cmltKCk7XG4gICAgICAgICAgICB0aGlzLnJlZnJlc2hQcmV2aWV3KCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGZvcm1Db2wpXG4gICAgICAuc2V0TmFtZShcIklOVFwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgdGhpcy5pbnRJbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHRcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5tb25zdGVyLnN0YXRzLmludClcbiAgICAgICAgICAub25DaGFuZ2UoKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1vbnN0ZXIuc3RhdHMuaW50ID0gdmFsdWUudHJpbSgpO1xuICAgICAgICAgICAgdGhpcy5yZWZyZXNoUHJldmlldygpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhmb3JtQ29sKVxuICAgICAgLnNldE5hbWUoXCJXSVNcIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRoaXMud2lzSW5wdXQgPSB0ZXh0O1xuICAgICAgICB0ZXh0XG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMubW9uc3Rlci5zdGF0cy53aXMpXG4gICAgICAgICAgLm9uQ2hhbmdlKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tb25zdGVyLnN0YXRzLndpcyA9IHZhbHVlLnRyaW0oKTtcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaFByZXZpZXcoKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoZm9ybUNvbClcbiAgICAgIC5zZXROYW1lKFwiQ0hBXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICB0aGlzLmNoYUlucHV0ID0gdGV4dDtcbiAgICAgICAgdGV4dFxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLm1vbnN0ZXIuc3RhdHMuY2hhKVxuICAgICAgICAgIC5vbkNoYW5nZSgodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMubW9uc3Rlci5zdGF0cy5jaGEgPSB2YWx1ZS50cmltKCk7XG4gICAgICAgICAgICB0aGlzLnJlZnJlc2hQcmV2aWV3KCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIGZvcm1Db2wuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiTGlzdHNcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGZvcm1Db2wpXG4gICAgICAuc2V0TmFtZShcIkF0dGFja3NcIilcbiAgICAgIC5zZXREZXNjKFwiT25lIGF0dGFjayBwZXIgbGluZVwiKVxuICAgICAgLmFkZFRleHRBcmVhKCh0ZXh0KSA9PiB7XG4gICAgICAgIHRoaXMuYXR0YWNrc0lucHV0ID0gdGV4dDtcbiAgICAgICAgdGV4dFxuICAgICAgICAgIC5zZXRWYWx1ZShqb2luQXR0YWNrTGluZXModGhpcy5tb25zdGVyKSlcbiAgICAgICAgICAub25DaGFuZ2UoKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1vbnN0ZXIuYXRrID0gbm9ybWFsaXplTGluZXModmFsdWUpLm1hcCgobGluZSkgPT4gKHtcbiAgICAgICAgICAgICAgbmFtZTogbGluZSxcbiAgICAgICAgICAgICAgcmF3OiBsaW5lXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICB0aGlzLnJlZnJlc2hQcmV2aWV3KCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHRleHQuaW5wdXRFbC5yb3dzID0gNTtcbiAgICAgICAgdGV4dC5pbnB1dEVsLmFkZENsYXNzKFwic2QtaW1wb3J0LXByZXZpZXctdGV4dGFyZWFcIik7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGZvcm1Db2wpXG4gICAgICAuc2V0TmFtZShcIlRyYWl0c1wiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgICdQYXNzaXZlIG9yIGFsd2F5cy1vbiBhYmlsaXRpZXMuIE9uZSB0cmFpdCBwZXIgbGluZS4gR29vZCBmb3JtYXRzOiBcIkRldm91ci4gVXNlIHR1cm4gdG8uLi5cIiBvciBcIkRldm91cjogVXNlIHR1cm4gdG8uLi5cIidcbiAgICAgIClcbiAgICAgIC5hZGRUZXh0QXJlYSgodGV4dCkgPT4ge1xuICAgICAgICB0aGlzLnRyYWl0c0lucHV0ID0gdGV4dDtcbiAgICAgICAgdGV4dFxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLm1vbnN0ZXIudHJhaXRzLmpvaW4oXCJcXG5cIikpXG4gICAgICAgICAgLm9uQ2hhbmdlKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tb25zdGVyLnRyYWl0cyA9IG5vcm1hbGl6ZUxpbmVzKHZhbHVlKTtcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaFByZXZpZXcoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgdGV4dC5pbnB1dEVsLnJvd3MgPSA1O1xuICAgICAgICB0ZXh0LmlucHV0RWwuYWRkQ2xhc3MoXCJzZC1pbXBvcnQtcHJldmlldy10ZXh0YXJlYVwiKTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoZm9ybUNvbClcbiAgICAgIC5zZXROYW1lKFwiU3BlbGxzXCIpXG4gICAgICAuc2V0RGVzYyhcbiAgICAgICAgJ1NwZWxsLWxpa2Ugb3IgbWFnaWNhbCBhYmlsaXRpZXMuIE9uZSBzcGVsbCBwZXIgbGluZS4gR29vZCBmb3JtYXRzOiBcIlJheSBvZiBGcm9zdCAoSU5UIFNwZWxsKS4gLi4uXCIgb3IgXCJSYXkgb2YgRnJvc3Q6IC4uLlwiJ1xuICAgICAgKVxuICAgICAgLmFkZFRleHRBcmVhKCh0ZXh0KSA9PiB7XG4gICAgICAgIHRoaXMuc3BlbGxzSW5wdXQgPSB0ZXh0O1xuICAgICAgICB0ZXh0XG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMubW9uc3Rlci5zcGVsbHMuam9pbihcIlxcblwiKSlcbiAgICAgICAgICAub25DaGFuZ2UoKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1vbnN0ZXIuc3BlbGxzID0gbm9ybWFsaXplTGluZXModmFsdWUpO1xuICAgICAgICAgICAgdGhpcy5yZWZyZXNoUHJldmlldygpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB0ZXh0LmlucHV0RWwucm93cyA9IDU7XG4gICAgICAgIHRleHQuaW5wdXRFbC5hZGRDbGFzcyhcInNkLWltcG9ydC1wcmV2aWV3LXRleHRhcmVhXCIpO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhmb3JtQ29sKVxuICAgICAgLnNldE5hbWUoXCJTcGVjaWFsc1wiKVxuICAgICAgLnNldERlc2MoXCJBY3RpdmUgb3IgdHJpZ2dlcmVkIG5vbi1zcGVsbCBhYmlsaXRpZXMuIE9uZSBzcGVjaWFsIGVudHJ5IHBlciBsaW5lXCIpXG4gICAgICAuYWRkVGV4dEFyZWEoKHRleHQpID0+IHtcbiAgICAgICAgdGhpcy5zcGVjaWFsc0lucHV0ID0gdGV4dDtcbiAgICAgICAgdGV4dFxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLm1vbnN0ZXIuc3BlY2lhbHMuam9pbihcIlxcblwiKSlcbiAgICAgICAgICAub25DaGFuZ2UoKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1vbnN0ZXIuc3BlY2lhbHMgPSBub3JtYWxpemVMaW5lcyh2YWx1ZSk7XG4gICAgICAgICAgICB0aGlzLnJlZnJlc2hQcmV2aWV3KCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHRleHQuaW5wdXRFbC5yb3dzID0gNDtcbiAgICAgICAgdGV4dC5pbnB1dEVsLmFkZENsYXNzKFwic2QtaW1wb3J0LXByZXZpZXctdGV4dGFyZWFcIik7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGZvcm1Db2wpXG4gICAgICAuc2V0TmFtZShcIkdlYXJcIilcbiAgICAgIC5zZXREZXNjKFwiT25lIGdlYXIgZW50cnkgcGVyIGxpbmVcIilcbiAgICAgIC5hZGRUZXh0QXJlYSgodGV4dCkgPT4ge1xuICAgICAgICB0aGlzLmdlYXJJbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHRcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5tb25zdGVyLmdlYXIuam9pbihcIlxcblwiKSlcbiAgICAgICAgICAub25DaGFuZ2UoKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1vbnN0ZXIuZ2VhciA9IG5vcm1hbGl6ZUxpbmVzKHZhbHVlKTtcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaFByZXZpZXcoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgdGV4dC5pbnB1dEVsLnJvd3MgPSAzO1xuICAgICAgICB0ZXh0LmlucHV0RWwuYWRkQ2xhc3MoXCJzZC1pbXBvcnQtcHJldmlldy10ZXh0YXJlYVwiKTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoZm9ybUNvbClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uXG4gICAgICAgICAgLnNldEJ1dHRvblRleHQoXCJGaXggQ29tbW9uIElzc3Vlc1wiKVxuICAgICAgICAgIC5zZXRUb29sdGlwKFxuICAgICAgICAgICAgXCJDbGVhbnMgZm9ybWF0dGluZzogZml4ZXMgc3BhY2luZywgZGljZSB0eXBvcyAoMWRkOCBcdTIxOTIgMWQ4KSwgY2FwaXRhbGl6ZXMgbmFtZXMvZGVzY3JpcHRpb25zLCBhbmQgbm9ybWFsaXplcyB0cmFpdHMsIHNwZWxscywgYW5kIGF0dGFja3MuXCJcbiAgICAgICAgICApXG4gICAgICAgICAgLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5maXhDb21tb25Jc3N1ZXMoKTtcbiAgICAgICAgICB9KVxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b25cbiAgICAgICAgICAuc2V0QnV0dG9uVGV4dCh0aGlzLm1vZGUgPT09IFwiZWRpdFwiID8gXCJVcGRhdGUgTm90ZVwiIDogXCJDcmVhdGUgTm90ZVwiKVxuICAgICAgICAgIC5zZXRDdGEoKVxuICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGlmICghdGhpcy5tb25zdGVyLm5hbWUudHJpbSgpKSB7XG4gICAgICAgICAgICAgIG5ldyBOb3RpY2UoXCJNb25zdGVyIG5lZWRzIGEgbmFtZSBiZWZvcmUgc2F2aW5nLlwiKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBhd2FpdCB0aGlzLm9uQ29uZmlybUNhbGxiYWNrKHRoaXMubW9uc3Rlcik7XG4gICAgICAgICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJTaGFkb3dkYXJrIFN0YXRibG9ja3MgbW9kYWwgY29uZmlybSBlcnJvcjpcIiwgZXJyb3IpO1xuICAgICAgICAgICAgICBuZXcgTm90aWNlKFwiRmFpbGVkIHRvIHNhdmUgbW9uc3RlciBub3RlLlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIGlmICh0aGlzLm9uU2tpcENhbGxiYWNrKSB7XG4gICAgICBuZXcgU2V0dGluZyhmb3JtQ29sKS5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uXG4gICAgICAgICAgLnNldEJ1dHRvblRleHQoXCJTa2lwXCIpXG4gICAgICAgICAgLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5vblNraXBDYWxsYmFjaz8uKCk7XG4gICAgICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgbmV3IFNldHRpbmcoZm9ybUNvbCkuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChcIkNhbmNlbFwiKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgfSlcbiAgICApO1xuXG4gICAgdGhpcy5yZWZyZXNoRm9ybUZpZWxkcygpO1xuICAgIHRoaXMucmVmcmVzaFByZXZpZXcoKTtcbiAgfVxuXG4gIG9uQ2xvc2UoKTogdm9pZCB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgICB0aGlzLm1vZGFsRWwucmVtb3ZlQ2xhc3MoXCJzZC1pbXBvcnQtcHJldmlldy1tb2RhbC1zaGVsbFwiKTtcbiAgICB0aGlzLm1vZGFsRWwuc3R5bGUud2lkdGggPSBcIlwiO1xuICAgIHRoaXMubW9kYWxFbC5zdHlsZS5tYXhXaWR0aCA9IFwiXCI7XG4gICAgdGhpcy5tb2RhbEVsLnN0eWxlLmhlaWdodCA9IFwiXCI7XG4gIH1cbn0iLCAiaW1wb3J0IHsgU2hhZG93ZGFya01vbnN0ZXIsIFNoYWRvd2RhcmtBdHRhY2sgfSBmcm9tIFwiLi4vdHlwZXNcIjtcblxuZnVuY3Rpb24gY2xlYW5UZXh0KHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdmFsdWVcbiAgICAucmVwbGFjZSgvW1x1MjAxM1x1MjAxNF0vZywgXCItXCIpXG4gICAgLnJlcGxhY2UoL1xcdTAwQTAvZywgXCIgXCIpXG4gICAgLnJlcGxhY2UoL1xccysvZywgXCIgXCIpXG4gICAgLnRyaW0oKTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplTW9kaWZpZXIodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGNsZWFuZWQgPSBjbGVhblRleHQodmFsdWUpO1xuXG4gIGlmICghY2xlYW5lZCkgcmV0dXJuIFwiXCI7XG5cbiAgaWYgKC9eWystXVxcZCskLy50ZXN0KGNsZWFuZWQpKSByZXR1cm4gY2xlYW5lZDtcbiAgaWYgKC9eXFxkKyQvLnRlc3QoY2xlYW5lZCkpIHJldHVybiBgKyR7Y2xlYW5lZH1gO1xuICBpZiAoL14tXFxkKyQvLnRlc3QoY2xlYW5lZCkpIHJldHVybiBjbGVhbmVkO1xuXG4gIHJldHVybiBjbGVhbmVkO1xufVxuXG5mdW5jdGlvbiB0b1NtYXJ0VGl0bGVDYXNlKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHNtYWxsV29yZHMgPSBuZXcgU2V0KFtcbiAgICBcIm9mXCIsIFwiaW5cIiwgXCJhbmRcIiwgXCJ0aGVcIiwgXCJ0b1wiLCBcImZvclwiLCBcIm9uXCIsIFwiYXRcIiwgXCJieVwiLCBcImZyb21cIiwgXCJ3aXRoXCIsIFwiYVwiLCBcImFuXCJcbiAgXSk7XG5cbiAgY29uc3Qgd29yZHMgPSB0ZXh0LnRvTG93ZXJDYXNlKCkuc3BsaXQoL1xccysvKTtcblxuICByZXR1cm4gd29yZHNcbiAgICAubWFwKCh3b3JkLCBpbmRleCkgPT4ge1xuICAgICAgaWYgKCF3b3JkKSByZXR1cm4gd29yZDtcblxuICAgICAgY29uc3QgaXNGaXJzdCA9IGluZGV4ID09PSAwO1xuICAgICAgY29uc3QgaXNMYXN0ID0gaW5kZXggPT09IHdvcmRzLmxlbmd0aCAtIDE7XG5cbiAgICAgIGlmICghaXNGaXJzdCAmJiAhaXNMYXN0ICYmIHNtYWxsV29yZHMuaGFzKHdvcmQpKSB7XG4gICAgICAgIHJldHVybiB3b3JkO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gd29yZC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHdvcmQuc2xpY2UoMSk7XG4gICAgfSlcbiAgICAuam9pbihcIiBcIik7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZURpY2VUeXBvcyh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdGV4dFxuICAgIC5yZXBsYWNlKC9cXGIoXFxkKylkZChcXGQrKVxcYi9naSwgXCIkMWQkMlwiKVxuICAgIC5yZXBsYWNlKC9cXGIoXFxkKylkK2QoXFxkKylcXGIvZ2ksIFwiJDFkJDJcIik7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVB1bmN0dWF0aW9uU3BhY2luZyh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdGV4dFxuICAgIC5yZXBsYWNlKC9cXHMqOlxccyovZywgXCI6IFwiKVxuICAgIC5yZXBsYWNlKC9cXHMqXFwuXFxzKi9nLCBcIi4gXCIpXG4gICAgLnJlcGxhY2UoL1xccyosXFxzKi9nLCBcIiwgXCIpXG4gICAgLnJlcGxhY2UoL1xcc3syLH0vZywgXCIgXCIpXG4gICAgLnRyaW0oKTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplTGFiZWxTdHlsZSh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBjbGVhbmVkID0gbm9ybWFsaXplUHVuY3R1YXRpb25TcGFjaW5nKG5vcm1hbGl6ZURpY2VUeXBvcyhjbGVhblRleHQodGV4dCkpKTtcbiAgaWYgKCFjbGVhbmVkKSByZXR1cm4gXCJcIjtcblxuICAvLyBIZWxwZXIgdG8gY2FwaXRhbGl6ZSBmaXJzdCBsZXR0ZXIgb2YgYm9keSB0ZXh0XG4gIGNvbnN0IGNhcGl0YWxpemVCb2R5ID0gKGJvZHk6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4gICAgaWYgKCFib2R5KSByZXR1cm4gXCJcIjtcbiAgICByZXR1cm4gYm9keS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIGJvZHkuc2xpY2UoMSk7XG4gIH07XG5cbiAgLy8gMSkgTGFiZWwgYmVmb3JlIGNvbG9uXG4gIGxldCBtYXRjaCA9IGNsZWFuZWQubWF0Y2goL14oW146XXsxLDgwfSk6XFxzKiguKykkLyk7XG4gIGlmIChtYXRjaCkge1xuICAgIGNvbnN0IGxhYmVsID0gdG9TbWFydFRpdGxlQ2FzZShtYXRjaFsxXS50cmltKCkpO1xuICAgIGNvbnN0IGJvZHkgPSBjYXBpdGFsaXplQm9keShtYXRjaFsyXS50cmltKCkpO1xuICAgIHJldHVybiBgJHtsYWJlbH06ICR7Ym9keX1gO1xuICB9XG5cbiAgLy8gMikgTGFiZWwgYmVmb3JlIHNlbnRlbmNlIGJyZWFrXG4gIG1hdGNoID0gY2xlYW5lZC5tYXRjaCgvXihbXi4hP117MSw4MH1bLiE/XSlcXHMqKC4rKSQvKTtcbiAgaWYgKG1hdGNoKSB7XG4gICAgY29uc3QgcmF3TGFiZWwgPSBtYXRjaFsxXS50cmltKCk7XG4gICAgY29uc3QgcHVuY3R1YXRpb24gPSByYXdMYWJlbC5zbGljZSgtMSk7XG4gICAgY29uc3QgbGFiZWxDb3JlID0gcmF3TGFiZWwuc2xpY2UoMCwgLTEpLnRyaW0oKTtcbiAgICBjb25zdCBib2R5ID0gY2FwaXRhbGl6ZUJvZHkobWF0Y2hbMl0udHJpbSgpKTtcblxuICAgIHJldHVybiBgJHt0b1NtYXJ0VGl0bGVDYXNlKGxhYmVsQ29yZSl9JHtwdW5jdHVhdGlvbn0gJHtib2R5fWA7XG4gIH1cblxuICAvLyAzKSBObyBjbGVhciBsYWJlbCBcdTIxOTIganVzdCBjbGVhbiArIGNhcGl0YWxpemUgZmlyc3QgbGV0dGVyXG4gIGlmICgvXlthLXpdLy50ZXN0KGNsZWFuZWQpKSB7XG4gICAgcmV0dXJuIGNsZWFuZWQuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBjbGVhbmVkLnNsaWNlKDEpO1xuICB9XG5cbiAgcmV0dXJuIGNsZWFuZWQ7XG59XG5cbmZ1bmN0aW9uIGNsZWFuTXVsdGlsaW5lSXRlbXMoaXRlbXM6IHN0cmluZ1tdKTogc3RyaW5nW10ge1xuICByZXR1cm4gaXRlbXNcbiAgICAubWFwKChpdGVtKSA9PiBub3JtYWxpemVMYWJlbFN0eWxlKGl0ZW0pKVxuICAgIC5maWx0ZXIoQm9vbGVhbik7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUF0dGFja1RleHQodGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgbGV0IGNsZWFuZWQgPSBub3JtYWxpemVQdW5jdHVhdGlvblNwYWNpbmcobm9ybWFsaXplRGljZVR5cG9zKGNsZWFuVGV4dCh0ZXh0KSkpO1xuXG4gIGNvbnN0IGNvbm5lY3Rvck1hdGNoID0gY2xlYW5lZC5tYXRjaCgvXihBTkR8T1IpXFxzKyguKykkL2kpO1xuICBpZiAoY29ubmVjdG9yTWF0Y2gpIHtcbiAgICBjb25zdCBjb25uZWN0b3IgPSBjb25uZWN0b3JNYXRjaFsxXS50b1VwcGVyQ2FzZSgpO1xuICAgIGNvbnN0IGJvZHkgPSBjb25uZWN0b3JNYXRjaFsyXS50cmltKCk7XG4gICAgcmV0dXJuIGAke2Nvbm5lY3Rvcn0gJHtib2R5fWA7XG4gIH1cblxuICByZXR1cm4gY2xlYW5lZDtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplQXR0YWNrKGF0dGFjazogU2hhZG93ZGFya0F0dGFjayk6IFNoYWRvd2RhcmtBdHRhY2sge1xuICBjb25zdCByYXcgPSBub3JtYWxpemVBdHRhY2tUZXh0KGF0dGFjay5yYXcgfHwgXCJcIik7XG4gIGNvbnN0IG5hbWUgPSBub3JtYWxpemVBdHRhY2tUZXh0KGF0dGFjay5uYW1lIHx8IFwiXCIpO1xuXG4gIHJldHVybiB7XG4gICAgLi4uYXR0YWNrLFxuICAgIG5hbWU6IHJhdyB8fCBuYW1lLFxuICAgIHJhdzogcmF3IHx8IG5hbWVcbiAgfTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplRGVzY3JpcHRpb24odGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgY2xlYW5lZCA9IG5vcm1hbGl6ZVB1bmN0dWF0aW9uU3BhY2luZyhub3JtYWxpemVEaWNlVHlwb3MoY2xlYW5UZXh0KHRleHQpKSk7XG4gIGlmICghY2xlYW5lZCkgcmV0dXJuIFwiXCI7XG4gIHJldHVybiBjbGVhbmVkLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgY2xlYW5lZC5zbGljZSgxKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpeE1vbnN0ZXJDb21tb25Jc3N1ZXMobW9uc3RlcjogU2hhZG93ZGFya01vbnN0ZXIpOiBTaGFkb3dkYXJrTW9uc3RlciB7XG4gIHJldHVybiB7XG4gICAgLi4ubW9uc3RlcixcbiAgICBuYW1lOiBjbGVhblRleHQobW9uc3Rlci5uYW1lKSxcbiAgICBsZXZlbDogY2xlYW5UZXh0KG1vbnN0ZXIubGV2ZWwpLFxuICAgIGFsaWdubWVudDogY2xlYW5UZXh0KG1vbnN0ZXIuYWxpZ25tZW50KS50b1VwcGVyQ2FzZSgpLFxuICAgIHR5cGU6IGNsZWFuVGV4dChtb25zdGVyLnR5cGUpLFxuICAgIGFjOiBjbGVhblRleHQobW9uc3Rlci5hYyksXG4gICAgaHA6IGNsZWFuVGV4dChtb25zdGVyLmhwKSxcbiAgICBtdjogY2xlYW5UZXh0KG1vbnN0ZXIubXYpLFxuICAgIGF0azogbW9uc3Rlci5hdGtcbiAgICAgIC5tYXAobm9ybWFsaXplQXR0YWNrKVxuICAgICAgLmZpbHRlcigoYXR0YWNrKSA9PiBCb29sZWFuKChhdHRhY2sucmF3IHx8IGF0dGFjay5uYW1lKS50cmltKCkpKSxcbiAgICBzdGF0czoge1xuICAgICAgc3RyOiBub3JtYWxpemVNb2RpZmllcihtb25zdGVyLnN0YXRzLnN0ciksXG4gICAgICBkZXg6IG5vcm1hbGl6ZU1vZGlmaWVyKG1vbnN0ZXIuc3RhdHMuZGV4KSxcbiAgICAgIGNvbjogbm9ybWFsaXplTW9kaWZpZXIobW9uc3Rlci5zdGF0cy5jb24pLFxuICAgICAgaW50OiBub3JtYWxpemVNb2RpZmllcihtb25zdGVyLnN0YXRzLmludCksXG4gICAgICB3aXM6IG5vcm1hbGl6ZU1vZGlmaWVyKG1vbnN0ZXIuc3RhdHMud2lzKSxcbiAgICAgIGNoYTogbm9ybWFsaXplTW9kaWZpZXIobW9uc3Rlci5zdGF0cy5jaGEpXG4gICAgfSxcbiAgICB0cmFpdHM6IGNsZWFuTXVsdGlsaW5lSXRlbXMobW9uc3Rlci50cmFpdHMpLFxuICAgIHNwZWNpYWxzOiBjbGVhbk11bHRpbGluZUl0ZW1zKG1vbnN0ZXIuc3BlY2lhbHMpLFxuICAgIHNwZWxsczogY2xlYW5NdWx0aWxpbmVJdGVtcyhtb25zdGVyLnNwZWxscyksXG4gICAgZ2VhcjogY2xlYW5NdWx0aWxpbmVJdGVtcyhtb25zdGVyLmdlYXIpLFxuICAgIGRlc2NyaXB0aW9uOiBub3JtYWxpemVEZXNjcmlwdGlvbihtb25zdGVyLmRlc2NyaXB0aW9uKSxcbiAgICBzb3VyY2U6IGNsZWFuVGV4dChtb25zdGVyLnNvdXJjZSksXG4gICAgdGFnczogY2xlYW5UYWdzKG1vbnN0ZXIudGFncylcbiAgfTtcblxuICBmdW5jdGlvbiBjbGVhblRhZ3ModGFnczogc3RyaW5nW10pOiBzdHJpbmdbXSB7XG4gIHJldHVybiB0YWdzXG4gICAgLm1hcCgodGFnKSA9PlxuICAgICAgdGFnXG4gICAgICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgICAgIC5yZXBsYWNlKC9bXHUyMDEzXHUyMDE0XS9nLCBcIi1cIilcbiAgICAgICAgLnJlcGxhY2UoL1xcdTAwQTAvZywgXCIgXCIpXG4gICAgICAgIC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKVxuICAgICAgICAudHJpbSgpXG4gICAgKVxuICAgIC5maWx0ZXIoQm9vbGVhbik7XG59XG59IiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuZXhwb3J0IGludGVyZmFjZSBEdXBsaWNhdGVNb25zdGVyTW9kYWxPcHRpb25zIHtcbiAgbW9uc3Rlck5hbWU6IHN0cmluZztcbiAgZXhpc3RpbmdGaWxlTmFtZTogc3RyaW5nO1xuICBjYW5PdmVyd3JpdGU6IGJvb2xlYW47XG4gIG9uT3ZlcndyaXRlPzogKCkgPT4gUHJvbWlzZTx2b2lkPjtcbiAgb25DcmVhdGVDb3B5OiAoKSA9PiBQcm9taXNlPHZvaWQ+O1xufVxuXG5leHBvcnQgY2xhc3MgRHVwbGljYXRlTW9uc3Rlck1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIG1vbnN0ZXJOYW1lOiBzdHJpbmc7XG4gIHByaXZhdGUgZXhpc3RpbmdGaWxlTmFtZTogc3RyaW5nO1xuICBwcml2YXRlIGNhbk92ZXJ3cml0ZTogYm9vbGVhbjtcbiAgcHJpdmF0ZSBvbk92ZXJ3cml0ZUNhbGxiYWNrPzogKCkgPT4gUHJvbWlzZTx2b2lkPjtcbiAgcHJpdmF0ZSBvbkNyZWF0ZUNvcHlDYWxsYmFjazogKCkgPT4gUHJvbWlzZTx2b2lkPjtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgb3B0aW9uczogRHVwbGljYXRlTW9uc3Rlck1vZGFsT3B0aW9ucykge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5tb25zdGVyTmFtZSA9IG9wdGlvbnMubW9uc3Rlck5hbWU7XG4gICAgdGhpcy5leGlzdGluZ0ZpbGVOYW1lID0gb3B0aW9ucy5leGlzdGluZ0ZpbGVOYW1lO1xuICAgIHRoaXMuY2FuT3ZlcndyaXRlID0gb3B0aW9ucy5jYW5PdmVyd3JpdGU7XG4gICAgdGhpcy5vbk92ZXJ3cml0ZUNhbGxiYWNrID0gb3B0aW9ucy5vbk92ZXJ3cml0ZTtcbiAgICB0aGlzLm9uQ3JlYXRlQ29weUNhbGxiYWNrID0gb3B0aW9ucy5vbkNyZWF0ZUNvcHk7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250ZW50RWwsIHRpdGxlRWwgfSA9IHRoaXM7XG5cbiAgICB0aXRsZUVsLnNldFRleHQoXCJEdXBsaWNhdGUgTW9uc3RlciBOb3RlXCIpO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuXG4gICAgY29uc3QgbWVzc2FnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwXCIpO1xuICAgIG1lc3NhZ2UudGV4dENvbnRlbnQgPSB0aGlzLmNhbk92ZXJ3cml0ZVxuICAgICAgPyBgQSBTaGFkb3dkYXJrIG1vbnN0ZXIgbm90ZSBuYW1lZCBcIiR7dGhpcy5leGlzdGluZ0ZpbGVOYW1lfVwiIGFscmVhZHkgZXhpc3RzLmBcbiAgICAgIDogYEEgZmlsZSBuYW1lZCBcIiR7dGhpcy5leGlzdGluZ0ZpbGVOYW1lfVwiIGFscmVhZHkgZXhpc3RzLCBidXQgaXQgaXMgbm90IGEgU2hhZG93ZGFyayBtb25zdGVyIG5vdGUuYDtcbiAgICBjb250ZW50RWwuYXBwZW5kQ2hpbGQobWVzc2FnZSk7XG5cbiAgICBjb25zdCBzdWJNZXNzYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInBcIik7XG4gICAgc3ViTWVzc2FnZS50ZXh0Q29udGVudCA9IHRoaXMuY2FuT3ZlcndyaXRlXG4gICAgICA/IFwiQ2hvb3NlIHdoZXRoZXIgdG8gdXBkYXRlIHRoZSBleGlzdGluZyBub3RlLCBjcmVhdGUgYSBjb3B5LCBvciBjYW5jZWwuXCJcbiAgICAgIDogXCJUbyBhdm9pZCBvdmVyd3JpdGluZyBhIG5vbi1tb25zdGVyIG5vdGUsIHlvdSBjYW4gY3JlYXRlIGEgY29weSBvciBjYW5jZWwuXCI7XG4gICAgY29udGVudEVsLmFwcGVuZENoaWxkKHN1Yk1lc3NhZ2UpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmNhbk92ZXJ3cml0ZSAmJiB0aGlzLm9uT3ZlcndyaXRlQ2FsbGJhY2spIHtcbiAgICAgICAgICBidXR0b25cbiAgICAgICAgICAgIC5zZXRCdXR0b25UZXh0KFwiVXBkYXRlIEV4aXN0aW5nIE5vdGVcIilcbiAgICAgICAgICAgIC5zZXRDdGEoKVxuICAgICAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICBhd2FpdCB0aGlzLm9uT3ZlcndyaXRlQ2FsbGJhY2s/LigpO1xuICAgICAgICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uXG4gICAgICAgICAgLnNldEJ1dHRvblRleHQoXCJDcmVhdGUgQ29weVwiKVxuICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMub25DcmVhdGVDb3B5Q2FsbGJhY2soKTtcbiAgICAgICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgICB9KVxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b25cbiAgICAgICAgICAuc2V0QnV0dG9uVGV4dChcIkNhbmNlbFwiKVxuICAgICAgICAgIC5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgICB9KVxuICAgICAgKTtcbiAgfVxuXG4gIG9uQ2xvc2UoKTogdm9pZCB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgfVxufSIsICJjb25zdCBVUFBFUkNBU0VfTk9OX05BTUVfV09SRFMgPSBuZXcgU2V0KFtcbiAgXCJBQ1wiLFxuICBcIkhQXCIsXG4gIFwiQVRLXCIsXG4gIFwiTVZcIixcbiAgXCJBTFwiLFxuICBcIkxWXCIsXG4gIFwiU1RSXCIsXG4gIFwiREVYXCIsXG4gIFwiQ09OXCIsXG4gIFwiSU5UXCIsXG4gIFwiV0lTXCIsXG4gIFwiQ0hBXCIsXG4gIFwiRENcIixcbiAgXCJBRFZcIixcbiAgXCJESVNBRFZcIlxuXSk7XG5cbmZ1bmN0aW9uIGNsZWFuTmFtZVRva2VuKHdvcmQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB3b3JkLnJlcGxhY2UoL1ssJ1x1MjAxOVxcLV0vZywgXCJcIik7XG59XG5cbmZ1bmN0aW9uIGlzVXBwZXJjYXNlTmFtZVRva2VuKHdvcmQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBjbGVhbmVkID0gY2xlYW5OYW1lVG9rZW4od29yZCk7XG4gIGlmICghY2xlYW5lZCkgcmV0dXJuIGZhbHNlO1xuICBpZiAoVVBQRVJDQVNFX05PTl9OQU1FX1dPUkRTLmhhcyhjbGVhbmVkKSkgcmV0dXJuIGZhbHNlO1xuICByZXR1cm4gL15bQS1aMC05XSskLy50ZXN0KGNsZWFuZWQpO1xufVxuXG5mdW5jdGlvbiBsb29rc0xpa2VNb25zdGVyTmFtZUlubGluZShjYW5kaWRhdGU6IHN0cmluZywgbWluV29yZHMgPSAxKTogYm9vbGVhbiB7XG4gIGNvbnN0IHdvcmRzID0gY2FuZGlkYXRlLnRyaW0oKS5zcGxpdCgvXFxzKy8pLmZpbHRlcihCb29sZWFuKTtcbiAgaWYgKHdvcmRzLmxlbmd0aCA8IG1pbldvcmRzIHx8IHdvcmRzLmxlbmd0aCA+IDQpIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIHdvcmRzLmV2ZXJ5KCh3b3JkKSA9PiBpc1VwcGVyY2FzZU5hbWVUb2tlbih3b3JkKSk7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUVtYmVkZGVkTW9uc3Rlck5hbWVzKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICBsZXQgdGV4dCA9IGlucHV0O1xuXG4gIC8vIENhc2UgMTpcbiAgLy8gU2VudGVuY2UtZW5kaW5nIHB1bmN0dWF0aW9uIGZvbGxvd2VkIGJ5IE5BTUUgdGhlbiBkZXNjcmlwdGlvbi5cbiAgLy9cbiAgLy8gXCIuLi4gZGlyZWN0aW9uLiBEVU5FRklFTkQgRGVtb25zIHRoYXQgYXBwZWFyIC4uLlwiXG4gIC8vID0+IFwiLi4uIGRpcmVjdGlvbi5cXG5EVU5FRklFTkRcXG5EZW1vbnMgdGhhdCBhcHBlYXIgLi4uXCJcbiAgdGV4dCA9IHRleHQucmVwbGFjZShcbiAgICAvKFsuIT9dKVxccysoW0EtWl1bQS1aMC05LCdcdTIwMTlcXC1dKig/OlxccytbQS1aXVtBLVowLTksJ1x1MjAxOVxcLV0qKXswLDN9KVxccysoW0EtWl1bYS16XVteXFxyXFxuXSopL2csXG4gICAgKG1hdGNoLCBwdW5jdCwgbWF5YmVOYW1lLCBkZXNjcmlwdGlvblN0YXJ0KSA9PiB7XG4gICAgICBpZiAoIWxvb2tzTGlrZU1vbnN0ZXJOYW1lSW5saW5lKG1heWJlTmFtZSwgMSkpIHtcbiAgICAgICAgcmV0dXJuIG1hdGNoO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYCR7cHVuY3R9XFxuJHttYXliZU5hbWV9XFxuJHtkZXNjcmlwdGlvblN0YXJ0fWA7XG4gICAgfVxuICApO1xuXG4gIC8vIENhc2UgMjpcbiAgLy8gTWlkLXNlbnRlbmNlIGVtYmVkZGVkIE1VTFRJLVdPUkQgbmFtZSB3aXRoIGEgc2hvcnQgbG93ZXJjYXNlIHRhaWwuXG4gIC8vXG4gIC8vIFwiLi4uIGltbXVuZSAxIGRheSBDQU5ZT04gQVBFIGlmIHBhc3MpLlwiXG4gIC8vID0+IFwiLi4uIGltbXVuZSAxIGRheSBpZiBwYXNzKS5cXG5DQU5ZT04gQVBFXCJcbiAgLy9cbiAgLy8gVGhpcyByZXF1aXJlcyAyKyB1cHBlcmNhc2Ugd29yZHMgc28gd2UgZG8gbm90IGFjY2lkZW50YWxseSByaXAgb3V0XG4gIC8vIERFWCAvIENIQSAvIENPTiAvIGV0Yy5cbiAgdGV4dCA9IHRleHQucmVwbGFjZShcbiAgICAvKFthLXowLTkpXFxdXSlcXHMrKFtBLVpdW0EtWjAtOSwnXHUyMDE5XFwtXSooPzpcXHMrW0EtWl1bQS1aMC05LCdcdTIwMTlcXC1dKyl7MSwzfSlcXHMrKFthLXpdW14uXFxyXFxuXXswLDMwfVsuKV0/KS9nLFxuICAgIChtYXRjaCwgcHJlZml4RW5kLCBtYXliZU5hbWUsIHN1ZmZpeCkgPT4ge1xuICAgICAgaWYgKCFsb29rc0xpa2VNb25zdGVyTmFtZUlubGluZShtYXliZU5hbWUsIDIpKSB7XG4gICAgICAgIHJldHVybiBtYXRjaDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGAke3ByZWZpeEVuZH0gJHtzdWZmaXh9XFxuJHttYXliZU5hbWV9YDtcbiAgICB9XG4gICk7XG5cbiAgLy8gQ2FzZSAzOlxuICAvLyBUcmFpbGluZyBuYW1lIGF0IHRoZSBlbmQgb2YgYSBibG9jay5cbiAgLy9cbiAgLy8gXCIuLi4gd29vZGVuIHN0YWtlIHdoaWxlIGF0IDAgSFAuIFNOQUtFLCBDT0JSQVwiXG4gIC8vID0+IFwiLi4uIHdvb2RlbiBzdGFrZSB3aGlsZSBhdCAwIEhQLlxcblNOQUtFLCBDT0JSQVwiXG4gIHRleHQgPSB0ZXh0LnJlcGxhY2UoXG4gICAgLyhbLiE/XSlcXHMrKFtBLVpdW0EtWjAtOSwnXHUyMDE5XFwtXSooPzpcXHMrW0EtWl1bQS1aMC05LCdcdTIwMTlcXC1dKil7MCwzfSkkL2dtLFxuICAgIChtYXRjaCwgcHVuY3QsIG1heWJlTmFtZSkgPT4ge1xuICAgICAgaWYgKCFsb29rc0xpa2VNb25zdGVyTmFtZUlubGluZShtYXliZU5hbWUsIDEpKSB7XG4gICAgICAgIHJldHVybiBtYXRjaDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGAke3B1bmN0fVxcbiR7bWF5YmVOYW1lfWA7XG4gICAgfVxuICApO1xuXG4gIHJldHVybiB0ZXh0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3BsaXRSYXdTaGFkb3dkYXJrQmxvY2tzKGlucHV0OiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IG5vcm1hbGl6ZWRJbnB1dCA9IG5vcm1hbGl6ZUVtYmVkZGVkTW9uc3Rlck5hbWVzKGlucHV0KTtcblxuICBjb25zdCBsaW5lcyA9IG5vcm1hbGl6ZWRJbnB1dFxuICAgIC5zcGxpdCgvXFxyXFxufFxcbnxcXHIvKVxuICAgIC5tYXAoKGxpbmUpID0+IGxpbmUudHJpbSgpKVxuICAgIC5maWx0ZXIoKGxpbmUpID0+IGxpbmUubGVuZ3RoID4gMCk7XG5cbiAgY29uc3QgYmxvY2tzOiBzdHJpbmdbXSA9IFtdO1xuICBsZXQgY3VycmVudEJsb2NrOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGNvbnN0IGhhc1N0YXRBbmNob3IgPSAodGV4dDogc3RyaW5nKTogYm9vbGVhbiA9PlxuICAgIC9cXGJBQ1xcYi9pLnRlc3QodGV4dCkgJiZcbiAgICAvXFxiSFBcXGIvaS50ZXN0KHRleHQpICYmXG4gICAgL1xcYkFUS1xcYi9pLnRlc3QodGV4dCkgJiZcbiAgICAvXFxiTFZcXGIvaS50ZXN0KHRleHQpO1xuXG4gIGNvbnN0IGlzTGlrZWx5TW9uc3Rlck5hbWUgPSAobGluZTogc3RyaW5nKTogYm9vbGVhbiA9PiB7XG4gICAgaWYgKGxpbmUubGVuZ3RoIDwgMyB8fCBsaW5lLmxlbmd0aCA+IDQwKSByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIGxvb2tzTGlrZU1vbnN0ZXJOYW1lSW5saW5lKGxpbmUsIDEpO1xuICB9O1xuXG4gIGNvbnN0IGlzQWJpbGl0eUxlYWQgPSAobGluZTogc3RyaW5nKTogYm9vbGVhbiA9PiB7XG4gICAgcmV0dXJuIC9eW0EtWl1bQS1aYS16MC05J1x1MjAxOVxcLSBdezAsNDB9XFwuLy50ZXN0KGxpbmUpO1xuICB9O1xuXG4gIGNvbnN0IGlzRGVzY3JpcHRpb25MaWtlID0gKGxpbmU6IHN0cmluZyk6IGJvb2xlYW4gPT4ge1xuICAgIGlmIChpc0xpa2VseU1vbnN0ZXJOYW1lKGxpbmUpKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKGlzQWJpbGl0eUxlYWQobGluZSkpIHJldHVybiBmYWxzZTtcbiAgICBpZiAoL1xcYkFDXFxifFxcYkhQXFxifFxcYkFUS1xcYnxcXGJBTFxcYnxcXGJMVlxcYnxcXGJNVlxcYi8udGVzdChsaW5lKSkgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiAvXltBLVpdLy50ZXN0KGxpbmUpICYmIC9bYS16XS8udGVzdChsaW5lKTtcbiAgfTtcblxuICBjb25zdCB1cGNvbWluZ0hhc1N0YXRBbmNob3IgPSAoc3RhcnRJbmRleDogbnVtYmVyLCBsb29rYWhlYWQgPSA2KTogYm9vbGVhbiA9PiB7XG4gICAgY29uc3QgdGV4dCA9IGxpbmVzLnNsaWNlKHN0YXJ0SW5kZXgsIHN0YXJ0SW5kZXggKyBsb29rYWhlYWQpLmpvaW4oXCIgXCIpO1xuICAgIHJldHVybiBoYXNTdGF0QW5jaG9yKHRleHQpO1xuICB9O1xuXG4gIGNvbnN0IGJsb2NrU3RhcnRzV2l0aE5hbWUgPSAoYmxvY2s6IHN0cmluZ1tdKTogYm9vbGVhbiA9PiB7XG4gICAgaWYgKGJsb2NrLmxlbmd0aCA9PT0gMCkgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiBpc0xpa2VseU1vbnN0ZXJOYW1lKGJsb2NrWzBdKTtcbiAgfTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgbGluZSA9IGxpbmVzW2ldO1xuXG4gICAgaWYgKGN1cnJlbnRCbG9jay5sZW5ndGggPT09IDApIHtcbiAgICAgIGN1cnJlbnRCbG9jay5wdXNoKGxpbmUpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgY3VycmVudFRleHQgPSBjdXJyZW50QmxvY2suam9pbihcIiBcIik7XG4gICAgY29uc3QgY3VycmVudEhhc1N0YXQgPSBoYXNTdGF0QW5jaG9yKGN1cnJlbnRUZXh0KTtcbiAgICBjb25zdCBjdXJyZW50U3RhcnRlZFdpdGhOYW1lID0gYmxvY2tTdGFydHNXaXRoTmFtZShjdXJyZW50QmxvY2spO1xuXG4gICAgY29uc3Qgc2hvdWxkU3RhcnROZXdCeUxlYWRpbmdOYW1lID1cbiAgICAgIGN1cnJlbnRIYXNTdGF0ICYmXG4gICAgICBjdXJyZW50U3RhcnRlZFdpdGhOYW1lICYmXG4gICAgICBpc0xpa2VseU1vbnN0ZXJOYW1lKGxpbmUpO1xuXG4gICAgY29uc3Qgc2hvdWxkU3RhcnROZXdCeURlc2NyaXB0aW9uID1cbiAgICAgIGN1cnJlbnRIYXNTdGF0ICYmXG4gICAgICBpc0Rlc2NyaXB0aW9uTGlrZShsaW5lKSAmJlxuICAgICAgdXBjb21pbmdIYXNTdGF0QW5jaG9yKGksIDYpO1xuXG4gICAgaWYgKHNob3VsZFN0YXJ0TmV3QnlMZWFkaW5nTmFtZSB8fCBzaG91bGRTdGFydE5ld0J5RGVzY3JpcHRpb24pIHtcbiAgICAgIGJsb2Nrcy5wdXNoKGN1cnJlbnRCbG9jay5qb2luKFwiXFxuXCIpKTtcbiAgICAgIGN1cnJlbnRCbG9jayA9IFtsaW5lXTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGN1cnJlbnRCbG9jay5wdXNoKGxpbmUpO1xuICB9XG5cbiAgaWYgKGN1cnJlbnRCbG9jay5sZW5ndGggPiAwKSB7XG4gICAgYmxvY2tzLnB1c2goY3VycmVudEJsb2NrLmpvaW4oXCJcXG5cIikpO1xuICB9XG5cbiAgcmV0dXJuIGJsb2Nrcztcbn0iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCx9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHR5cGUgU2hhZG93ZGFya1N0YXRibG9ja3NQbHVnaW4gZnJvbSBcIi4uL21haW5cIjtcbmltcG9ydCB7IHBhcnNlRnJvbnRtYXR0ZXIgfSBmcm9tIFwiLi4vcGFyc2luZy9wYXJzZUZyb250bWF0dGVyXCI7XG5pbXBvcnQgeyByZW5kZXJNb25zdGVyQmxvY2sgfSBmcm9tIFwiLi4vcmVuZGVyL3JlbmRlck1vbnN0ZXJCbG9ja1wiO1xuaW1wb3J0IHsgTWVudSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgdHlwZSBNb25zdGVySW5kZXhFbnRyeSB9IGZyb20gXCIuLi9zZXJ2aWNlcy9tb25zdGVySW5kZXhTZXJ2aWNlXCI7XG5cbmV4cG9ydCBjbGFzcyBNb25zdGVyQnJvd3Nlck1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICAgIHByaXZhdGUgcGx1Z2luOiBTaGFkb3dkYXJrU3RhdGJsb2Nrc1BsdWdpbjtcbiAgICBwcml2YXRlIGFsbE1vbnN0ZXJzOiBNb25zdGVySW5kZXhFbnRyeVtdID0gW107XG4gICAgcHJpdmF0ZSBmaWx0ZXJlZE1vbnN0ZXJzOiBNb25zdGVySW5kZXhFbnRyeVtdID0gW107XG5cbiAgICBwcml2YXRlIHNlYXJjaFRleHQgPSBcIlwiO1xuICAgIHByaXZhdGUgc2VsZWN0ZWRTb3VyY2UgPSBcIlwiO1xuICAgIHByaXZhdGUgc2VsZWN0ZWRUYWcgPSBcIlwiO1xuICAgIHByaXZhdGUgc2VsZWN0ZWRNYXhMZXZlbCA9IFwiXCI7XG5cbiAgICBwcml2YXRlIHJlc3VsdHNFbCE6IEhUTUxEaXZFbGVtZW50O1xuXG4gICAgcHJpdmF0ZSBob3ZlckNhcmRFbCE6IEhUTUxEaXZFbGVtZW50O1xuICAgIHByaXZhdGUgaG92ZXJQcmV2aWV3RWwhOiBIVE1MRGl2RWxlbWVudDtcbiAgICBwcml2YXRlIGhvdmVySGlkZVRpbWVvdXQ6IG51bWJlciB8IG51bGwgPSBudWxsO1xuICAgIHByaXZhdGUgaG92ZXJNb3VzZVggPSAwO1xuICAgIHByaXZhdGUgaG92ZXJNb3VzZVkgPSAwOyAgICAgICBcbiAgICBwcml2YXRlIGhvdmVyU2hvd1RpbWVvdXQ6IG51bWJlciB8IG51bGwgPSBudWxsOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHBsdWdpbjogU2hhZG93ZGFya1N0YXRibG9ja3NQbHVnaW4pIHtcbiAgICBzdXBlcihhcHApO1xuICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICB9XG5cbiAgYXN5bmMgb25PcGVuKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHsgY29udGVudEVsLCB0aXRsZUVsIH0gPSB0aGlzO1xuICAgIHRpdGxlRWwuc2V0VGV4dChcIk1vbnN0ZXIgQnJvd3NlclwiKTtcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcbiAgICBjb250ZW50RWwuYWRkQ2xhc3MoXCJzZC1tb25zdGVyLWJyb3dzZXItbW9kYWxcIik7XG4gICAgY29udGVudEVsLnN0eWxlLm1pbkhlaWdodCA9IFwiMFwiO1xuXG4gICAgdGhpcy5hbGxNb25zdGVycyA9IGF3YWl0IHRoaXMucGx1Z2luLmdldEFsbE1vbnN0ZXJJbmRleEVudHJpZXMoKTtcbiAgICB0aGlzLmZpbHRlcmVkTW9uc3RlcnMgPSBbLi4udGhpcy5hbGxNb25zdGVyc107XG5cbiAgICBjb25zdCBjb250cm9sc0VsID0gY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogXCJzZC1tb25zdGVyLWJyb3dzZXItY29udHJvbHNcIiB9KTtcblxuICAgIGNvbnN0IGNyZWF0ZUZpbHRlckNhcmQgPSAobGFiZWxUZXh0OiBzdHJpbmcpOiBIVE1MRGl2RWxlbWVudCA9PiB7XG4gICAgICBjb25zdCBjYXJkID0gY29udHJvbHNFbC5jcmVhdGVEaXYoeyBjbHM6IFwic2QtbW9uc3Rlci1icm93c2VyLWZpbHRlclwiIH0pO1xuICAgICAgY2FyZC5jcmVhdGVFbChcImxhYmVsXCIsIHtcbiAgICAgICAgY2xzOiBcInNkLW1vbnN0ZXItYnJvd3Nlci1maWx0ZXItbGFiZWxcIixcbiAgICAgICAgdGV4dDogbGFiZWxUZXh0XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBjYXJkO1xuICAgIH07XG5cbiAgICAvLyBTZWFyY2hcbiAgICBjb25zdCBzZWFyY2hDYXJkID0gY3JlYXRlRmlsdGVyQ2FyZChcIlNlYXJjaFwiKTtcbiAgICBjb25zdCBzZWFyY2hJbnB1dEVsID0gc2VhcmNoQ2FyZC5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLFxuICAgICAgcGxhY2Vob2xkZXI6IFwiU2VhcmNoIGJ5IG5hbWUuLi5cIixcbiAgICAgIGNsczogXCJzZC1tb25zdGVyLWJyb3dzZXItaW5wdXRcIlxuICAgIH0pO1xuICAgIHNlYXJjaElucHV0RWwudmFsdWUgPSB0aGlzLnNlYXJjaFRleHQ7XG4gICAgc2VhcmNoSW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5zZWFyY2hUZXh0ID0gc2VhcmNoSW5wdXRFbC52YWx1ZS50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgICAgIHRoaXMuYXBwbHlGaWx0ZXJzKCk7XG4gICAgfSk7XG5cbiAgICAvLyBTb3VyY2VcbiAgICBjb25zdCBzb3VyY2VDYXJkID0gY3JlYXRlRmlsdGVyQ2FyZChcIlNvdXJjZVwiKTtcbiAgICBjb25zdCBzb3VyY2VTZWxlY3RFbCA9IHNvdXJjZUNhcmQuY3JlYXRlRWwoXCJzZWxlY3RcIiwge1xuICAgICAgY2xzOiBcInNkLW1vbnN0ZXItYnJvd3Nlci1zZWxlY3RcIlxuICAgIH0pO1xuXG4gICAgY29uc3QgYWxsU291cmNlcyA9IEFycmF5LmZyb20oXG4gICAgICBuZXcgU2V0KHRoaXMuYWxsTW9uc3RlcnMubWFwKChtKSA9PiBtLnNvdXJjZSkuZmlsdGVyKEJvb2xlYW4pKVxuICAgICkuc29ydCgoYTogc3RyaW5nLCBiOiBzdHJpbmcpID0+IGEubG9jYWxlQ29tcGFyZShiKSk7XG5cbiAgICBzb3VyY2VTZWxlY3RFbC5hcHBlbmRDaGlsZChuZXcgT3B0aW9uKFwiQWxsXCIsIFwiXCIpKTtcbiAgICBmb3IgKGNvbnN0IHNvdXJjZSBvZiBhbGxTb3VyY2VzKSB7XG4gICAgICBzb3VyY2VTZWxlY3RFbC5hcHBlbmRDaGlsZChuZXcgT3B0aW9uKHNvdXJjZSwgc291cmNlKSk7XG4gICAgfVxuICAgIHNvdXJjZVNlbGVjdEVsLnZhbHVlID0gdGhpcy5zZWxlY3RlZFNvdXJjZTtcbiAgICBzb3VyY2VTZWxlY3RFbC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIHRoaXMuc2VsZWN0ZWRTb3VyY2UgPSBzb3VyY2VTZWxlY3RFbC52YWx1ZTtcbiAgICAgIHRoaXMuYXBwbHlGaWx0ZXJzKCk7XG4gICAgfSk7XG5cbiAgICAvLyBUYWdcbiAgICBjb25zdCB0YWdDYXJkID0gY3JlYXRlRmlsdGVyQ2FyZChcIlRhZ1wiKTtcbiAgICBjb25zdCB0YWdTZWxlY3RFbCA9IHRhZ0NhcmQuY3JlYXRlRWwoXCJzZWxlY3RcIiwge1xuICAgICAgY2xzOiBcInNkLW1vbnN0ZXItYnJvd3Nlci1zZWxlY3RcIlxuICAgIH0pO1xuXG4gICAgY29uc3QgYWxsVGFnc1NldCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGZvciAoY29uc3QgbW9uc3RlciBvZiB0aGlzLmFsbE1vbnN0ZXJzKSB7XG4gICAgICBmb3IgKGNvbnN0IHRhZyBvZiBtb25zdGVyLnRhZ3MpIHtcbiAgICAgICAgaWYgKHRhZykgYWxsVGFnc1NldC5hZGQodGFnKTtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgYWxsVGFncyA9IEFycmF5LmZyb20oYWxsVGFnc1NldCkuc29ydCgoYTogc3RyaW5nLCBiOiBzdHJpbmcpID0+XG4gICAgICBhLmxvY2FsZUNvbXBhcmUoYilcbiAgICApO1xuXG4gICAgdGFnU2VsZWN0RWwuYXBwZW5kQ2hpbGQobmV3IE9wdGlvbihcIkFsbFwiLCBcIlwiKSk7XG4gICAgZm9yIChjb25zdCB0YWcgb2YgYWxsVGFncykge1xuICAgICAgdGFnU2VsZWN0RWwuYXBwZW5kQ2hpbGQobmV3IE9wdGlvbih0YWcsIHRhZykpO1xuICAgIH1cbiAgICB0YWdTZWxlY3RFbC52YWx1ZSA9IHRoaXMuc2VsZWN0ZWRUYWc7XG4gICAgdGFnU2VsZWN0RWwuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICB0aGlzLnNlbGVjdGVkVGFnID0gdGFnU2VsZWN0RWwudmFsdWU7XG4gICAgICB0aGlzLmFwcGx5RmlsdGVycygpO1xuICAgIH0pO1xuXG4gICAgLy8gTWF4IExldmVsXG4gICAgY29uc3QgbWF4TGV2ZWxDYXJkID0gY3JlYXRlRmlsdGVyQ2FyZChcIk1heCBMZXZlbFwiKTtcbiAgICBjb25zdCBtYXhMZXZlbFNlbGVjdEVsID0gbWF4TGV2ZWxDYXJkLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHtcbiAgICAgIGNsczogXCJzZC1tb25zdGVyLWJyb3dzZXItc2VsZWN0XCJcbiAgICB9KTtcblxuICAgIG1heExldmVsU2VsZWN0RWwuYXBwZW5kQ2hpbGQobmV3IE9wdGlvbihcIkFueVwiLCBcIlwiKSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPD0gMjA7IGkrKykge1xuICAgICAgbWF4TGV2ZWxTZWxlY3RFbC5hcHBlbmRDaGlsZChuZXcgT3B0aW9uKFN0cmluZyhpKSwgU3RyaW5nKGkpKSk7XG4gICAgfVxuICAgIG1heExldmVsU2VsZWN0RWwudmFsdWUgPSB0aGlzLnNlbGVjdGVkTWF4TGV2ZWw7XG4gICAgbWF4TGV2ZWxTZWxlY3RFbC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIHRoaXMuc2VsZWN0ZWRNYXhMZXZlbCA9IG1heExldmVsU2VsZWN0RWwudmFsdWU7XG4gICAgICB0aGlzLmFwcGx5RmlsdGVycygpO1xuICAgIH0pO1xuXG4gICAgLy8gQWN0aW9uc1xuICAgIGNvbnN0IGFjdGlvbnNFbCA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwic2QtbW9uc3Rlci1icm93c2VyLWFjdGlvbnNcIiB9KTtcbiAgICBjb25zdCBjbGVhckJ1dHRvbiA9IGFjdGlvbnNFbC5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwibW9kLWN0YSBzZC1tb25zdGVyLWJyb3dzZXItY2xlYXItYnV0dG9uXCIsXG4gICAgICB0ZXh0OiBcIkNsZWFyIEZpbHRlcnNcIlxuICAgIH0pO1xuXG4gICAgY2xlYXJCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuc2VhcmNoVGV4dCA9IFwiXCI7XG4gICAgICB0aGlzLnNlbGVjdGVkU291cmNlID0gXCJcIjtcbiAgICAgIHRoaXMuc2VsZWN0ZWRUYWcgPSBcIlwiO1xuICAgICAgdGhpcy5zZWxlY3RlZE1heExldmVsID0gXCJcIjtcblxuICAgICAgc2VhcmNoSW5wdXRFbC52YWx1ZSA9IFwiXCI7XG4gICAgICBzb3VyY2VTZWxlY3RFbC52YWx1ZSA9IFwiXCI7XG4gICAgICB0YWdTZWxlY3RFbC52YWx1ZSA9IFwiXCI7XG4gICAgICBtYXhMZXZlbFNlbGVjdEVsLnZhbHVlID0gXCJcIjtcblxuICAgICAgdGhpcy5hcHBseUZpbHRlcnMoKTtcbiAgICB9KTtcblxuICAgIC8vIFJlc3VsdHMgY29udGFpbmVyXG4gICAgdGhpcy5yZXN1bHRzRWwgPSBjb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcInNkLW1vbnN0ZXItYnJvd3Nlci1yZXN1bHRzXCIgfSk7XG5cbiAgICB0aGlzLnJlc3VsdHNFbC5hZGRFdmVudExpc3RlbmVyKFwic2Nyb2xsXCIsICgpID0+IHtcbiAgICAgICAgdGhpcy5oaWRlSG92ZXJDYXJkKCk7XG4gICAgfSk7XG5cbiAgICAvLyBIb3ZlciBjYXJkXG4gICAgdGhpcy5ob3ZlckNhcmRFbCA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwic2QtbW9uc3Rlci1icm93c2VyLWhvdmVyLWNhcmRcIiB9KTtcbiAgICB0aGlzLmhvdmVyUHJldmlld0VsID0gdGhpcy5ob3ZlckNhcmRFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLW1vbnN0ZXItYnJvd3Nlci1ob3Zlci1jYXJkLWlubmVyXCJcbiAgICB9KTtcblxuICAgIHRoaXMuaG92ZXJDYXJkRWwuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZW50ZXJcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5jbGVhckhvdmVySGlkZVRpbWVvdXQoKTtcbiAgICB9KTtcblxuICAgIHRoaXMuaG92ZXJDYXJkRWwuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbGVhdmVcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5zY2hlZHVsZUhpZGVIb3ZlckNhcmQoKTtcbiAgICB9KTtcblxuICAgIHRoaXMucmVuZGVyUmVzdWx0cygpO1xuICB9XG5cbiAgb25DbG9zZSgpOiB2b2lkIHtcbiAgICB0aGlzLmNsZWFySG92ZXJIaWRlVGltZW91dCgpO1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gIH1cblxuICBwcml2YXRlIGNsZWFySG92ZXJIaWRlVGltZW91dCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5ob3ZlckhpZGVUaW1lb3V0ICE9PSBudWxsKSB7XG4gICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMuaG92ZXJIaWRlVGltZW91dCk7XG4gICAgICB0aGlzLmhvdmVySGlkZVRpbWVvdXQgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc2NoZWR1bGVIaWRlSG92ZXJDYXJkKCk6IHZvaWQge1xuICAgIHRoaXMuY2xlYXJIb3ZlckhpZGVUaW1lb3V0KCk7XG4gICAgdGhpcy5ob3ZlckhpZGVUaW1lb3V0ID0gd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5oaWRlSG92ZXJDYXJkKCk7XG4gICAgfSwgMTIwKTtcbiAgfVxuXG4gIHByaXZhdGUgaGlkZUhvdmVyQ2FyZCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5ob3ZlckNhcmRFbCkge1xuICAgICAgdGhpcy5ob3ZlckNhcmRFbC5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtdmlzaWJsZVwiKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNob3dIb3ZlckNhcmQobW9uc3RlcjogTW9uc3RlckluZGV4RW50cnkpOiB2b2lkIHtcbiAgICBjb25zdCByZXN1bHQgPSBwYXJzZUZyb250bWF0dGVyKG1vbnN0ZXIuZnJvbnRtYXR0ZXIpO1xuICAgIGlmICghcmVzdWx0LnN1Y2Nlc3MgfHwgIXJlc3VsdC5kYXRhKSByZXR1cm47XG5cbiAgICB0aGlzLmhvdmVyUHJldmlld0VsLmVtcHR5KCk7XG4gICAgcmVuZGVyTW9uc3RlckJsb2NrKFxuICAgICAgICB0aGlzLmhvdmVyUHJldmlld0VsLFxuICAgICAgICByZXN1bHQuZGF0YSxcbiAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MsXG4gICAgICAgIHJlc3VsdC53YXJuaW5nc1xuICAgICk7XG5cbiAgICB0aGlzLmhvdmVyQ2FyZEVsLmNsYXNzTGlzdC5hZGQoXCJpcy12aXNpYmxlXCIpO1xuICAgIHRoaXMucG9zaXRpb25Ib3ZlckNhcmQoKTtcbiAgICB9XG5cbiAgcHJpdmF0ZSBhcHBseUZpbHRlcnMoKTogdm9pZCB7XG4gICAgdGhpcy5maWx0ZXJlZE1vbnN0ZXJzID0gdGhpcy5hbGxNb25zdGVycy5maWx0ZXIoKG1vbnN0ZXIpID0+IHtcbiAgICAgIGNvbnN0IG1hdGNoZXNTZWFyY2ggPVxuICAgICAgICAhdGhpcy5zZWFyY2hUZXh0IHx8IG1vbnN0ZXIubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHRoaXMuc2VhcmNoVGV4dCk7XG5cbiAgICAgIGNvbnN0IG1hdGNoZXNTb3VyY2UgPVxuICAgICAgICAhdGhpcy5zZWxlY3RlZFNvdXJjZSB8fCBtb25zdGVyLnNvdXJjZSA9PT0gdGhpcy5zZWxlY3RlZFNvdXJjZTtcblxuICAgICAgY29uc3QgbWF0Y2hlc1RhZyA9XG4gICAgICAgICF0aGlzLnNlbGVjdGVkVGFnIHx8IG1vbnN0ZXIudGFncy5pbmNsdWRlcyh0aGlzLnNlbGVjdGVkVGFnKTtcblxuICAgICAgY29uc3QgbWF0Y2hlc0xldmVsID1cbiAgICAgICAgIXRoaXMuc2VsZWN0ZWRNYXhMZXZlbCB8fFxuICAgICAgICAoTnVtYmVyKG1vbnN0ZXIubGV2ZWwpIHx8IDApIDw9IE51bWJlcih0aGlzLnNlbGVjdGVkTWF4TGV2ZWwpO1xuXG4gICAgICByZXR1cm4gbWF0Y2hlc1NlYXJjaCAmJiBtYXRjaGVzU291cmNlICYmIG1hdGNoZXNUYWcgJiYgbWF0Y2hlc0xldmVsO1xuICAgIH0pO1xuXG4gICAgdGhpcy5yZW5kZXJSZXN1bHRzKCk7XG4gIH1cbiAgICBwcml2YXRlIHBvc2l0aW9uSG92ZXJDYXJkKCk6IHZvaWQge1xuICAgICAgICBpZiAoIXRoaXMuaG92ZXJDYXJkRWwuY2xhc3NMaXN0LmNvbnRhaW5zKFwiaXMtdmlzaWJsZVwiKSkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IG9mZnNldCA9IDE2O1xuICAgICAgICBjb25zdCBjYXJkV2lkdGggPSBNYXRoLm1pbig0MjAsIE1hdGguZmxvb3Iod2luZG93LmlubmVyV2lkdGggKiAwLjQyKSk7XG4gICAgICAgIGNvbnN0IGNhcmRIZWlnaHQgPSBNYXRoLm1pbig1MjAsIE1hdGguZmxvb3Iod2luZG93LmlubmVySGVpZ2h0ICogMC43KSk7XG5cbiAgICAgICAgbGV0IGxlZnQgPSB0aGlzLmhvdmVyTW91c2VYICsgb2Zmc2V0O1xuICAgICAgICBsZXQgdG9wID0gdGhpcy5ob3Zlck1vdXNlWSArIG9mZnNldDtcblxuICAgICAgICBpZiAobGVmdCArIGNhcmRXaWR0aCA+IHdpbmRvdy5pbm5lcldpZHRoIC0gMTIpIHtcbiAgICAgICAgICAgIGxlZnQgPSB0aGlzLmhvdmVyTW91c2VYIC0gY2FyZFdpZHRoIC0gb2Zmc2V0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGxlZnQgPCAxMikge1xuICAgICAgICAgICAgbGVmdCA9IDEyO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRvcCArIGNhcmRIZWlnaHQgPiB3aW5kb3cuaW5uZXJIZWlnaHQgLSAxMikge1xuICAgICAgICAgICAgdG9wID0gd2luZG93LmlubmVySGVpZ2h0IC0gY2FyZEhlaWdodCAtIDEyO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRvcCA8IDEyKSB7XG4gICAgICAgICAgICB0b3AgPSAxMjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaG92ZXJDYXJkRWwuc3R5bGUubGVmdCA9IGAke2xlZnR9cHhgO1xuICAgICAgICB0aGlzLmhvdmVyQ2FyZEVsLnN0eWxlLnRvcCA9IGAke3RvcH1weGA7XG4gICAgICAgIH1cblxuICBwcml2YXRlIHJlbmRlclJlc3VsdHMoKTogdm9pZCB7XG4gICAgdGhpcy5yZXN1bHRzRWwuZW1wdHkoKTtcbiAgICB0aGlzLmhpZGVIb3ZlckNhcmQoKTtcblxuICAgIGNvbnN0IHN1bW1hcnkgPSB0aGlzLnJlc3VsdHNFbC5jcmVhdGVEaXYoeyBjbHM6IFwic2QtbW9uc3Rlci1icm93c2VyLXN1bW1hcnlcIiB9KTtcbiAgICBzdW1tYXJ5LnNldFRleHQoYCR7dGhpcy5maWx0ZXJlZE1vbnN0ZXJzLmxlbmd0aH0gbW9uc3RlcihzKWApO1xuXG4gICAgaWYgKHRoaXMuZmlsdGVyZWRNb25zdGVycy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRoaXMucmVzdWx0c0VsLmNyZWF0ZURpdih7XG4gICAgICAgIGNsczogXCJzZC1tb25zdGVyLWJyb3dzZXItZW1wdHlcIixcbiAgICAgICAgdGV4dDogXCJObyBtb25zdGVycyBtYXRjaCB0aG9zZSBmaWx0ZXJzLlwiXG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IG1vbnN0ZXIgb2YgdGhpcy5maWx0ZXJlZE1vbnN0ZXJzKSB7XG4gICAgICBjb25zdCByb3cgPSB0aGlzLnJlc3VsdHNFbC5jcmVhdGVEaXYoeyBjbHM6IFwic2QtbW9uc3Rlci1icm93c2VyLXJvd1wiIH0pO1xuXG4gICAgcm93LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWVudGVyXCIsIChldnQ6IE1vdXNlRXZlbnQpID0+IHtcbiAgICAgICAgdGhpcy5jbGVhckhvdmVySGlkZVRpbWVvdXQoKTtcblxuICAgICAgICB0aGlzLmhvdmVyTW91c2VYID0gZXZ0LmNsaWVudFg7XG4gICAgICAgIHRoaXMuaG92ZXJNb3VzZVkgPSBldnQuY2xpZW50WTtcblxuICAgICAgICBpZiAodGhpcy5ob3ZlclNob3dUaW1lb3V0KSB7XG4gICAgICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMuaG92ZXJTaG93VGltZW91dCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmhvdmVyU2hvd1RpbWVvdXQgPSB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNob3dIb3ZlckNhcmQobW9uc3Rlcik7XG4gICAgICAgIH0sIDEyMCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJvdy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIChldnQ6IE1vdXNlRXZlbnQpID0+IHtcbiAgICAgICAgdGhpcy5ob3Zlck1vdXNlWCA9IGV2dC5jbGllbnRYO1xuICAgICAgICB0aGlzLmhvdmVyTW91c2VZID0gZXZ0LmNsaWVudFk7XG4gICAgICAgIHRoaXMucG9zaXRpb25Ib3ZlckNhcmQoKTtcbiAgICAgfSk7XG5cbiAgICAgICAgcm93LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWxlYXZlXCIsICgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmhvdmVyU2hvd1RpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMuaG92ZXJTaG93VGltZW91dCk7XG4gICAgICAgICAgICAgICAgdGhpcy5ob3ZlclNob3dUaW1lb3V0ID0gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5zY2hlZHVsZUhpZGVIb3ZlckNhcmQoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgIHJvdy5jcmVhdGVEaXYoe1xuICAgICAgICBjbHM6IFwic2QtbW9uc3Rlci1icm93c2VyLW5hbWVcIixcbiAgICAgICAgdGV4dDogbW9uc3Rlci5uYW1lXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgbWV0YVBhcnRzID0gW1xuICAgICAgICBtb25zdGVyLmxldmVsID8gYExWICR7bW9uc3Rlci5sZXZlbH1gIDogXCJcIixcbiAgICAgICAgbW9uc3Rlci5hbGlnbm1lbnQgPyBgQUwgJHttb25zdGVyLmFsaWdubWVudH1gIDogXCJcIixcbiAgICAgICAgbW9uc3Rlci5zb3VyY2UgfHwgXCJcIlxuICAgICAgXS5maWx0ZXIoQm9vbGVhbik7XG5cbiAgICAgIHJvdy5jcmVhdGVEaXYoe1xuICAgICAgICBjbHM6IFwic2QtbW9uc3Rlci1icm93c2VyLW1ldGFcIixcbiAgICAgICAgdGV4dDogbWV0YVBhcnRzLmpvaW4oXCIgXHUyMDIyIFwiKVxuICAgICAgfSk7XG5cbiAgICAgIGlmIChtb25zdGVyLnRhZ3MubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCB0YWdzRWwgPSByb3cuY3JlYXRlRGl2KHsgY2xzOiBcInNkLW1vbnN0ZXItYnJvd3Nlci10YWdzXCIgfSk7XG4gICAgICAgIGZvciAoY29uc3QgdGFnIG9mIG1vbnN0ZXIudGFncykge1xuICAgICAgICAgIHRhZ3NFbC5jcmVhdGVEaXYoe1xuICAgICAgICAgICAgY2xzOiBcInNkLW1vbnN0ZXItYnJvd3Nlci10YWdcIixcbiAgICAgICAgICAgIHRleHQ6IHRhZ1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJvdy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge1xuICAgICAgICBhd2FpdCB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZih0cnVlKS5vcGVuRmlsZShtb25zdGVyLmZpbGUpO1xuICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfSk7XG4gICAgcm93LmFkZEV2ZW50TGlzdGVuZXIoXCJjb250ZXh0bWVudVwiLCAoZXZ0OiBNb3VzZUV2ZW50KSA9PiB7XG4gICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIGNvbnN0IG1lbnUgPSBuZXcgTWVudSgpO1xuXG4gICAgICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT5cbiAgICAgICAgICAgIGl0ZW1cbiAgICAgICAgICAgIC5zZXRUaXRsZShcIk9wZW5cIilcbiAgICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZih0cnVlKS5vcGVuRmlsZShtb25zdGVyLmZpbGUpO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICk7XG5cbiAgICAgICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PlxuICAgICAgICAgICAgaXRlbVxuICAgICAgICAgICAgLnNldFRpdGxlKFwiT3BlbiB0byB0aGUgcmlnaHRcIilcbiAgICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBsZWFmID0gdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYoXCJzcGxpdFwiLCBcInZlcnRpY2FsXCIpO1xuICAgICAgICAgICAgICAgIGF3YWl0IGxlYWYub3BlbkZpbGUobW9uc3Rlci5maWxlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICk7XG5cbiAgICAgICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PlxuICAgICAgICAgICAgaXRlbVxuICAgICAgICAgICAgLnNldFRpdGxlKFwiQ29weSBsaW5rXCIpXG4gICAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgbGluayA9IGBbWyR7bW9uc3Rlci5maWxlLmJhc2VuYW1lfV1dYDtcbiAgICAgICAgICAgICAgICBhd2FpdCBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dChsaW5rKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICk7XG4gICAgICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT5cbiAgICAgICAgICAgIGl0ZW1cbiAgICAgICAgICAgIC5zZXRUaXRsZShcIkNvcHkgZW1iZWRcIilcbiAgICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBlbWJlZCA9IGAhW1ske21vbnN0ZXIuZmlsZS5iYXNlbmFtZX1dXWA7XG4gICAgICAgICAgICAgICAgYXdhaXQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQoZW1iZWQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgKTtcbiAgICAgICAgbWVudS5zaG93QXRNb3VzZUV2ZW50KGV2dCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfVxufSJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFBQUEsbUJBU087OztBQ1RQLHNCQUFxRDtBQVlyRCxTQUFTLG1CQUFtQixTQUFpRDtBQUMzRSxRQUFNLFFBQVEsUUFBUSxNQUFNLHVCQUF1QjtBQUNuRCxNQUFJLENBQUMsTUFBTyxRQUFPO0FBRW5CLE1BQUk7QUFDRixVQUFNLGFBQVMsMkJBQVUsTUFBTSxDQUFDLENBQUM7QUFDakMsUUFBSSxDQUFDLFVBQVUsT0FBTyxXQUFXLFNBQVUsUUFBTztBQUNsRCxXQUFPO0FBQUEsRUFDVCxTQUFTLE9BQU87QUFDZCxZQUFRLE1BQU0sa0RBQWtELEtBQUs7QUFDckUsV0FBTztBQUFBLEVBQ1Q7QUFDRjtBQUVBLGVBQXNCLGlCQUNwQixLQUNBLGVBQ21CO0FBQ25CLFFBQU0saUJBQWEsK0JBQWMsYUFBYTtBQUM5QyxRQUFNLFFBQVEsSUFBSSxNQUNmLGlCQUFpQixFQUNqQjtBQUFBLElBQ0MsQ0FBQyxTQUNDLEtBQUssS0FBSyxXQUFXLEdBQUcsVUFBVSxHQUFHLEtBQUssS0FBSyxTQUFTLEdBQUcsVUFBVTtBQUFBLEVBQ3pFO0FBRUYsUUFBTSxPQUFPLG9CQUFJLElBQVk7QUFFN0IsYUFBVyxRQUFRLE9BQU87QUFDeEIsVUFBTSxVQUFVLE1BQU0sSUFBSSxNQUFNLEtBQUssSUFBSTtBQUN6QyxVQUFNLGNBQWMsbUJBQW1CLE9BQU87QUFFOUMsUUFBSSxDQUFDLGVBQWUsWUFBWSxtQkFBbUIsVUFB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QUssUUFBUSxNQUFNLE1BQU0sTUFBTSxLQUFLO0FBQ3BDLGFBQUssZUFBZTtBQUFBLE1BQ3RCLENBQUM7QUFBQSxJQUNMLENBQUM7QUFFSCxRQUFJLHlCQUFRLE9BQU8sRUFDaEIsUUFBUSxLQUFLLEVBQ2IsUUFBUSxDQUFDLFNBQVM7QUFDakIsV0FBSyxXQUFXO0FBQ2hCLFdBQ0csU0FBUyxLQUFLLFFBQVEsTUFBTSxHQUFHLEVBQy9CLFNBQVMsQ0FBQyxVQUFVO0FBQ25CLGFBQUssUUFBUSxNQUFNLE1BQU0sTUFBTSxLQUFLO0FBQ3BDLGFBQUssZUFBZTtBQUFBLE1BQ3RCLENBQUM7QUFBQSxJQUNMLENBQUM7QUFFSCxRQUFJLHlCQUFRLE9BQU8sRUFDaEIsUUFBUSxLQUFLLEVBQ2IsUUFBUSxDQUFDLFNBQVM7QUFDakIsV0FBSyxXQUFXO0FBQ2hCLFdBQ0csU0FBUyxLQUFLLFFBQVEsTUFBTSxHQUFHLEVBQy9CLFNBQVMsQ0FBQyxVQUFVO0FBQ25CLGFBQUssUUFBUSxNQUFNLE1BQU0sTUFBTSxLQUFLO0FBQ3BDLGFBQUssZUFBZTtBQUFBLE1BQ3RCLENBQUM7QUFBQSxJQUNMLENBQUM7QUFFSCxRQUFJLHlCQUFRLE9BQU8sRUFDaEIsUUFBUSxLQUFLLEVBQ2IsUUFBUSxDQUFDLFNBQVM7QUFDakIsV0FBSyxXQUFXO0FBQ2hCLFdBQ0csU0FBUyxLQUFLLFFBQVEsTUFBTSxHQUFHLEVBQy9CLFNBQVMsQ0FBQyxVQUFVO0FBQ25CLGFBQUssUUFBUSxNQUFNLE1BQU0sTUFBTSxLQUFLO0FBQ3BDLGFBQUssZUFBZTtBQUFBLE1BQ3RCLENBQUM7QUFBQSxJQUNMLENBQUM7QUFFSCxRQUFJLHlCQUFRLE9BQU8sRUFDaEIsUUFBUSxLQUFLLEVBQ2IsUUFBUSxDQUFDLFNBQVM7QUFDakIsV0FBSyxXQUFXO0FBQ2hCLFdBQ0csU0FBUyxLQUFLLFFBQVEsTUFBTSxHQUFHLEVBQy9CLFNBQVMsQ0FBQyxVQUFVO0FBQ25CLGFBQUssUUFBUSxNQUFNLE1BQU0sTUFBTSxLQUFLO0FBQ3BDLGFBQUssZUFBZTtBQUFB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O0FBQ2pDLFNBQUcsVUFBVSxPQUFPLDRCQUE0QjtBQUFBLElBQ2xEO0FBQUEsRUFDRjtBQUFBLEVBRVEsZ0NBQWdDLE1BQTBCO0FBQ2hFLFVBQU0sV0FBVyxLQUFLLFlBQVksaUJBQWlCLGlDQUFpQztBQUNwRixlQUFXLE1BQU0sVUFBVTtBQUN6QixTQUFHLE9BQU87QUFBQSxJQUNaO0FBQUEsRUFDRjtBQUFBLEVBRVEsbUJBQW1CLFNBQWlEO0FBQzFFLFVBQU0sUUFBUSxRQUFRLE1BQU0sdUJBQXVCO0FBQ25ELFFBQUksQ0FBQyxNQUFPLFFBQU87QUFFbkIsUUFBSTtBQUNGLFlBQU0sYUFBUyw0QkFBVSxNQUFNLENBQUMsQ0FBQztBQUNqQyxVQUFJLENBQUMsVUFBVSxPQUFPLFdBQVcsU0FBVSxRQUFPO0FBQ2xELGFBQU87QUFBQSxJQUNULFNBQVMsT0FBTztBQUNkLGNBQVEsTUFBTSxrREFBa0QsS0FBSztBQUNyRSxhQUFPO0FBQUEsSUFDVDtBQUFBLEVBQ0Y7QUFBQSxFQUVRLGdCQUFnQixPQUF1QjtBQUM3QyxXQUFPLE1BQU0sUUFBUSxNQUFNLFFBQVE7QUFBQSxFQUNyQztBQUNGOyIsCiAgIm5hbWVzIjogWyJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAibm9ybWFsaXplTW9kaWZpZXIiLCAibm9ybWFsaXplQXR0YWNrIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIl0KfQo=
