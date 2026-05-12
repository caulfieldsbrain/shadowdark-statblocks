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
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL3NlcnZpY2VzL21vbnN0ZXJJbmRleFNlcnZpY2UudHMiLCAic3JjL3NldHRpbmdzLnRzIiwgInNyYy9wYXJzaW5nL3BhcnNlQ29kZUJsb2NrLnRzIiwgInNyYy9wYXJzaW5nL25vcm1hbGl6ZU1vbnN0ZXIudHMiLCAic3JjL3BhcnNpbmcvcGFyc2VGcm9udG1hdHRlci50cyIsICJzcmMvcGFyc2luZy9wYXJzZVJhd1NoYWRvd2RhcmtUZXh0LnRzIiwgInNyYy9yZW5kZXIvcmVuZGVyTW9uc3RlckJsb2NrLnRzIiwgInNyYy90ZW1wbGF0ZXMvbW9uc3RlclRlbXBsYXRlLnRzIiwgInNyYy91dGlscy9tb25zdGVyTm90ZUNvbnRlbnQudHMiLCAic3JjL3NldHRpbmdzVGFiLnRzIiwgInNyYy9tb2RhbHMvSW1wb3J0UHJldmlld01vZGFsLnRzIiwgInNyYy91dGlscy9maXhNb25zdGVyQ29tbW9uSXNzdWVzLnRzIiwgInNyYy9tb2RhbHMvRHVwbGljYXRlTW9uc3Rlck1vZGFsLnRzIiwgInNyYy91dGlscy9zcGxpdFJhd1NoYWRvd2RhcmtCbG9ja3MudHMiLCAic3JjL21vZGFscy9Nb25zdGVyQnJvd3Nlck1vZGFsLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQge1xuICBFZGl0b3IsXG4gIE1hcmtkb3duUG9zdFByb2Nlc3NvckNvbnRleHQsXG4gIE1hcmtkb3duVmlldyxcbiAgTm90aWNlLFxuICBQbHVnaW4sXG4gIFRGaWxlLFxuICBub3JtYWxpemVQYXRoLFxuICBwYXJzZVlhbWxcbn0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQge1xuICBnZXRBbGxNb25zdGVySW5kZXhFbnRyaWVzLFxuICBnZXRTdWdnZXN0ZWRPdGhlclNvdXJjZXMsXG4gIGdldFN1Z2dlc3RlZFRhZ3Ncbn0gZnJvbSBcIi4vc2VydmljZXMvbW9uc3RlckluZGV4U2VydmljZVwiO1xuaW1wb3J0IHsgREVGQVVMVF9TRVRUSU5HUywgU2hhZG93ZGFya1N0YXRibG9ja3NTZXR0aW5ncyB9IGZyb20gXCIuL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBwYXJzZUNvZGVCbG9jayB9IGZyb20gXCIuL3BhcnNpbmcvcGFyc2VDb2RlQmxvY2tcIjtcbmltcG9ydCB7IHBhcnNlRnJvbnRtYXR0ZXIgfSBmcm9tIFwiLi9wYXJzaW5nL3BhcnNlRnJvbnRtYXR0ZXJcIjtcbmltcG9ydCB7IHBhcnNlUmF3U2hhZG93ZGFya1RleHQgfSBmcm9tIFwiLi9wYXJzaW5nL3BhcnNlUmF3U2hhZG93ZGFya1RleHRcIjtcbmltcG9ydCB7IHJlbmRlck1vbnN0ZXJCbG9jayB9IGZyb20gXCIuL3JlbmRlci9yZW5kZXJNb25zdGVyQmxvY2tcIjtcbmltcG9ydCB7IGJ1aWxkTW9uc3RlclRlbXBsYXRlIH0gZnJvbSBcIi4vdGVtcGxhdGVzL21vbnN0ZXJUZW1wbGF0ZVwiO1xuaW1wb3J0IHsgYnVpbGRNb25zdGVyTm90ZUNvbnRlbnQgfSBmcm9tIFwiLi91dGlscy9tb25zdGVyTm90ZUNvbnRlbnRcIjtcbmltcG9ydCB7IFNoYWRvd2RhcmtTdGF0YmxvY2tzU2V0dGluZ1RhYiB9IGZyb20gXCIuL3NldHRpbmdzVGFiXCI7XG5pbXBvcnQgeyBJbXBvcnRQcmV2aWV3TW9kYWwgfSBmcm9tIFwiLi9tb2RhbHMvSW1wb3J0UHJldmlld01vZGFsXCI7XG5pbXBvcnQgeyBEdXBsaWNhdGVNb25zdGVyTW9kYWwgfSBmcm9tIFwiLi9tb2RhbHMvRHVwbGljYXRlTW9uc3Rlck1vZGFsXCI7XG5pbXBvcnQgeyBTaGFkb3dkYXJrTW9uc3RlciB9IGZyb20gXCIuL3R5cGVzXCI7XG5pbXBvcnQgeyBzcGxpdFJhd1NoYWRvd2RhcmtCbG9ja3MgfSBmcm9tIFwiLi91dGlscy9zcGxpdFJhd1NoYWRvd2RhcmtCbG9ja3NcIjtcbmltcG9ydCB7IE1vbnN0ZXJCcm93c2VyTW9kYWwgfSBmcm9tIFwiLi9tb2RhbHMvTW9uc3RlckJyb3dzZXJNb2RhbFwiO1xuXG50eXBlIENhY2hlZE1vbnN0ZXJGcm9udG1hdHRlclBhcnNlID0ge1xuICBtdGltZTogbnVtYmVyO1xuICByZXN1bHQ6IFJldHVyblR5cGU8dHlwZW9mIHBhcnNlRnJvbnRtYXR0ZXI+O1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2hhZG93ZGFya1N0YXRibG9ja3NQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuICBzZXR0aW5ncyE6IFNoYWRvd2RhcmtTdGF0YmxvY2tzU2V0dGluZ3M7XG4gIHByaXZhdGUgcmVuZGVyR2VuZXJhdGlvbiA9IDA7XG4gIHByaXZhdGUgYXV0b1ByZXZpZXdlZExlYWZGaWxlcyA9IG5ldyBXZWFrTWFwPE1hcmtkb3duVmlldywgc3RyaW5nPigpO1xuICBwcml2YXRlIHBhcnNlZE1vbnN0ZXJDYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCBDYWNoZWRNb25zdGVyRnJvbnRtYXR0ZXJQYXJzZT4oKTtcblxuICBwcml2YXRlIHJlbmRlck1vbnN0ZXJJblByb2Nlc3NlZFByZXZpZXcoXG4gICAgZWw6IEhUTUxFbGVtZW50LFxuICAgIGN0eDogTWFya2Rvd25Qb3N0UHJvY2Vzc29yQ29udGV4dFxuICApOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuc2V0dGluZ3MucmVuZGVyRnJvbnRtYXR0ZXJNb25zdGVycykgcmV0dXJuO1xuXG4gICAgaWYgKCFlbC5jbGFzc0xpc3QuY29udGFpbnMoXCJtb2QtZnJvbnRtYXR0ZXJcIikpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoZWwuZ2V0QXR0cmlidXRlKFwiZGF0YS1zZC1wcm9jZXNzZWQtcHJldmlld1wiKSA9PT0gXCJ0cnVlXCIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzb3VyY2VQYXRoID0gY3R4LnNvdXJjZVBhdGg7XG4gICAgaWYgKCFzb3VyY2VQYXRoKSByZXR1cm47XG5cbiAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHNvdXJjZVBhdGgpO1xuICAgIGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHJldHVybjtcblxuICAgIGNvbnN0IGNhY2hlID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSk7XG4gICAgY29uc3QgZnJvbnRtYXR0ZXIgPSBjYWNoZT8uZnJvbnRtYXR0ZXIgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQ7XG5cbiAgICBpZiAoIWZyb250bWF0dGVyIHx8IGZyb250bWF0dGVyLnNoYWRvd2RhcmtUeXBlICE9PSBcIm1vbnN0ZXJcIikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuZ2V0Q2FjaGVkTW9uc3RlclBhcnNlKGZpbGUsIGZyb250bWF0dGVyKTtcbiAgICBpZiAoIXJlc3VsdC5zdWNjZXNzIHx8ICFyZXN1bHQuZGF0YSkgcmV0dXJuO1xuXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiZGF0YS1zZC1wcm9jZXNzZWQtcHJldmlld1wiLCBcInRydWVcIik7XG4gICAgZWwuaW5uZXJIVE1MID0gXCJcIjtcbiAgICBlbC5jbGFzc0xpc3QucmVtb3ZlKFwibW9kLWZyb250bWF0dGVyXCIsIFwibW9kLXVpXCIsIFwiZWwtcHJlXCIpO1xuICAgIGVsLmNsYXNzTGlzdC5hZGQoXCJzZC1tb25zdGVyLWVtYmVkLWhvc3RcIik7XG5cbiAgICBjb25zdCB3cmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICB3cmFwcGVyLmNsYXNzTmFtZSA9IFwic2QtbW9uc3Rlci1lbWJlZC13cmFwcGVyXCI7XG4gICAgd3JhcHBlci5zZXRBdHRyaWJ1dGUoXCJkYXRhLXNvdXJjZS1wYXRoXCIsIGZpbGUucGF0aCk7XG5cbiAgICByZW5kZXJNb25zdGVyQmxvY2sod3JhcHBlciwgcmVzdWx0LmRhdGEsIHRoaXMuc2V0dGluZ3MsIHJlc3VsdC53YXJuaW5ncyk7XG4gICAgZWwuYXBwZW5kQ2hpbGQod3JhcHBlcik7XG4gIH1cblxuICBwcml2YXRlIGdldENhY2hlZE1vbnN0ZXJQYXJzZShcbiAgICBmaWxlOiBURmlsZSxcbiAgICBmcm9udG1hdHRlcjogUmVjb3JkPHN0cmluZywgdW5rbm93bj5cbiAgKTogUmV0dXJuVHlwZTx0eXBlb2YgcGFyc2VGcm9udG1hdHRlcj4ge1xuICAgIGNvbnN0IGNhY2hlZCA9IHRoaXMucGFyc2VkTW9uc3RlckNhY2hlLmdldChmaWxlLnBhdGgpO1xuXG4gICAgaWYgKGNhY2hlZCAmJiBjYWNoZWQubXRpbWUgPT09IGZpbGUuc3RhdC5tdGltZSkge1xuICAgICAgcmV0dXJuIGNhY2hlZC5yZXN1bHQ7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0ID0gcGFyc2VGcm9udG1hdHRlcihmcm9udG1hdHRlcik7XG4gICAgdGhpcy5wYXJzZWRNb25zdGVyQ2FjaGUuc2V0KGZpbGUucGF0aCwge1xuICAgICAgbXRpbWU6IGZpbGUuc3RhdC5tdGltZSxcbiAgICAgIHJlc3VsdFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlMYXN0VXNlZFNvdXJjZShtb25zdGVyOiBTaGFkb3dkYXJrTW9uc3Rlcik6IFNoYWRvd2RhcmtNb25zdGVyIHtcbiAgICBpZiAoIXRoaXMuc2V0dGluZ3MubGFzdFVzZWRNb25zdGVyU291cmNlPy50cmltKCkpIHtcbiAgICAgIHJldHVybiBtb25zdGVyO1xuICAgIH1cblxuICAgIGNvbnN0IGN1cnJlbnRTb3VyY2UgPSBtb25zdGVyLnNvdXJjZT8udHJpbSgpID8/IFwiXCI7XG5cbiAgICBpZiAoXG4gICAgICAhY3VycmVudFNvdXJjZSB8fFxuICAgICAgY3VycmVudFNvdXJjZSA9PT0gXCJJbXBvcnRlZCBmcm9tIGNsaXBib2FyZFwiIHx8XG4gICAgICBjdXJyZW50U291cmNlID09PSBcIkNvcmUgUnVsZXNcIlxuICAgICkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgLi4ubW9uc3RlcixcbiAgICAgICAgc291cmNlOiB0aGlzLnNldHRpbmdzLmxhc3RVc2VkTW9uc3RlclNvdXJjZVxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gbW9uc3RlcjtcbiAgfVxuXG4gIHByaXZhdGUgY291bnRTdGF0QW5jaG9ycyh0ZXh0OiBzdHJpbmcpOiBudW1iZXIge1xuICAgIGNvbnN0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKC9cXGJBQ1xcYltcXHNcXFNdezAsMTIwfT9cXGJIUFxcYltcXHNcXFNdezAsMTIwfT9cXGJBVEtcXGIvZ2kpO1xuICAgIHJldHVybiBtYXRjaGVzID8gbWF0Y2hlcy5sZW5ndGggOiAwO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyByZW1lbWJlckxhc3RVc2VkU291cmNlKHNvdXJjZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgdHJpbW1lZCA9IHNvdXJjZS50cmltKCk7XG4gICAgaWYgKCF0cmltbWVkKSByZXR1cm47XG5cbiAgICBpZiAodGhpcy5zZXR0aW5ncy5sYXN0VXNlZE1vbnN0ZXJTb3VyY2UgPT09IHRyaW1tZWQpIHJldHVybjtcblxuICAgIHRoaXMuc2V0dGluZ3MubGFzdFVzZWRNb25zdGVyU291cmNlID0gdHJpbW1lZDtcbiAgICBhd2FpdCB0aGlzLnNhdmVQbHVnaW5TZXR0aW5ncygpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBpbXBvcnRNdWx0aXBsZUZyb21DbGlwYm9hcmQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgbGV0IGNsaXBib2FyZFRleHQgPSBcIlwiO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNsaXBib2FyZFRleHQgPSBhd2FpdCBuYXZpZ2F0b3IuY2xpcGJvYXJkLnJlYWRUZXh0KCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJDbGlwYm9hcmQgcmVhZCBlcnJvcjpcIiwgZXJyb3IpO1xuICAgICAgbmV3IE5vdGljZShcIkNvdWxkIG5vdCByZWFkIGNsaXBib2FyZC5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgYmxvY2tzID0gc3BsaXRSYXdTaGFkb3dkYXJrQmxvY2tzKGNsaXBib2FyZFRleHQpO1xuXG4gICAgaWYgKGJsb2Nrcy5sZW5ndGggPT09IDApIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJObyBtb25zdGVyIGJsb2NrcyBkZXRlY3RlZC5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbmV3IE5vdGljZShgRGV0ZWN0ZWQgJHtibG9ja3MubGVuZ3RofSBwb3RlbnRpYWwgbW9uc3RlcnMuLi5gKTtcblxuICAgIGF3YWl0IHRoaXMucnVuQnVsa0ltcG9ydEZsb3coYmxvY2tzKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcnVuQnVsa0ltcG9ydEZsb3coYmxvY2tzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGxldCBjYW5jZWxsZWQgPSBmYWxzZTtcblxuICAgIGNvbnN0IGltcG9ydGVkTmFtZXM6IHN0cmluZ1tdID0gW107XG4gICAgY29uc3Qgc2tpcHBlZE5hbWVzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGNvbnN0IHBhcnNlRmFpbGVkTmFtZXM6IHN0cmluZ1tdID0gW107XG4gICAgY29uc3QgY29tYmluZWRTa2lwcGVkTmFtZXM6IHN0cmluZ1tdID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJsb2Nrcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgYmxvY2sgPSBibG9ja3NbaV07XG5cbiAgICAgIGNvbnN0IHN0YXRBbmNob3JDb3VudCA9IHRoaXMuY291bnRTdGF0QW5jaG9ycyhibG9jayk7XG4gICAgICBpZiAoc3RhdEFuY2hvckNvdW50ID4gMSkge1xuICAgICAgICBjb21iaW5lZFNraXBwZWROYW1lcy5wdXNoKGBCbG9jayAke2kgKyAxfWApO1xuICAgICAgICBuZXcgTm90aWNlKGBTa2lwcGluZyBibG9jayAke2kgKyAxfTogbG9va3MgbGlrZSBtdWx0aXBsZSBtb25zdGVycyB3ZXJlIGNvbWJpbmVkLmApO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVzdWx0ID0gcGFyc2VSYXdTaGFkb3dkYXJrVGV4dChibG9jayk7XG5cbiAgICAgIGlmICghcmVzdWx0LnN1Y2Nlc3MgfHwgIXJlc3VsdC5kYXRhKSB7XG4gICAgICAgIHBhcnNlRmFpbGVkTmFtZXMucHVzaChgQmxvY2sgJHtpICsgMX1gKTtcbiAgICAgICAgbmV3IE5vdGljZShgU2tpcHBpbmcgYmxvY2sgJHtpICsgMX06IHBhcnNlIGZhaWxlZGApO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc3VnZ2VzdGVkVGFncyA9IGF3YWl0IHRoaXMuZ2V0U3VnZ2VzdGVkVGFncygpO1xuICAgICAgY29uc3Qgc3VnZ2VzdGVkT3RoZXJTb3VyY2VzID0gYXdhaXQgdGhpcy5nZXRTdWdnZXN0ZWRPdGhlclNvdXJjZXMoKTtcblxuICAgICAgY29uc3QgbW9uc3RlcldpdGhMYXN0U291cmNlID0gdGhpcy5hcHBseUxhc3RVc2VkU291cmNlKHJlc3VsdC5kYXRhKTtcbiAgICAgIGNvbnN0IG1vbnN0ZXJXaXRoU21hcnRUYWdzID0gdGhpcy5hcHBseVNtYXJ0RGVmYXVsdFRhZ3MobW9uc3RlcldpdGhMYXN0U291cmNlKTtcbiAgICAgIGNvbnN0IG1vbnN0ZXJOYW1lID0gbW9uc3RlcldpdGhTbWFydFRhZ3MubmFtZSB8fCBgQmxvY2sgJHtpICsgMX1gO1xuXG4gICAgICBjb25zdCBhY3Rpb24gPSBhd2FpdCBuZXcgUHJvbWlzZTxcImNvbmZpcm1cIiB8IFwic2tpcFwiIHwgXCJjYW5jZWxcIj4oKHJlc29sdmUpID0+IHtcbiAgICAgICAgbGV0IGZpbmFsQWN0aW9uOiBcImNvbmZpcm1cIiB8IFwic2tpcFwiIHwgXCJjYW5jZWxcIiA9IFwiY2FuY2VsXCI7XG5cbiAgICAgICAgY29uc3QgbW9kYWwgPSBuZXcgSW1wb3J0UHJldmlld01vZGFsKHRoaXMuYXBwLCB7XG4gICAgICAgICAgbW9uc3RlcjogbW9uc3RlcldpdGhTbWFydFRhZ3MsXG4gICAgICAgICAgd2FybmluZ3M6IHJlc3VsdC53YXJuaW5ncyxcbiAgICAgICAgICBtb2RlOiBcImltcG9ydFwiLFxuICAgICAgICAgIHByb2dyZXNzTGFiZWw6IGBSZXZpZXdpbmcgJHtpICsgMX0gb2YgJHtibG9ja3MubGVuZ3RofTogJHttb25zdGVyV2l0aFNtYXJ0VGFncy5uYW1lfWAsXG4gICAgICAgICAgc3VnZ2VzdGVkVGFncyxcbiAgICAgICAgICBzdWdnZXN0ZWRPdGhlclNvdXJjZXMsXG4gICAgICAgICAgb25Db25maXJtOiBhc3luYyAobW9uc3RlcikgPT4ge1xuICAgICAgICAgICAgZmluYWxBY3Rpb24gPSBcImNvbmZpcm1cIjtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucmVtZW1iZXJMYXN0VXNlZFNvdXJjZShtb25zdGVyLnNvdXJjZSk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNyZWF0ZUltcG9ydGVkTW9uc3RlckNvcHkobW9uc3RlciwgcmVzdWx0Lndhcm5pbmdzKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uU2tpcDogKCkgPT4ge1xuICAgICAgICAgICAgZmluYWxBY3Rpb24gPSBcInNraXBcIjtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IG9yaWdpbmFsT25DbG9zZSA9IG1vZGFsLm9uQ2xvc2UuYmluZChtb2RhbCk7XG4gICAgICAgIG1vZGFsLm9uQ2xvc2UgPSAoKSA9PiB7XG4gICAgICAgICAgb3JpZ2luYWxPbkNsb3NlKCk7XG4gICAgICAgICAgcmVzb2x2ZShmaW5hbEFjdGlvbik7XG4gICAgICAgIH07XG5cbiAgICAgICAgbW9kYWwub3BlbigpO1xuICAgICAgfSk7XG5cbiAgICAgIGlmIChhY3Rpb24gPT09IFwiY29uZmlybVwiKSB7XG4gICAgICAgIGltcG9ydGVkTmFtZXMucHVzaChtb25zdGVyTmFtZSk7XG4gICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gXCJza2lwXCIpIHtcbiAgICAgICAgc2tpcHBlZE5hbWVzLnB1c2gobW9uc3Rlck5hbWUpO1xuICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFwiY2FuY2VsXCIpIHtcbiAgICAgICAgY2FuY2VsbGVkID0gdHJ1ZTtcbiAgICAgICAgbmV3IE5vdGljZShcIkJ1bGsgaW1wb3J0IGNhbmNlbGxlZC5cIik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGZvcm1hdExpc3QgPSAobGFiZWw6IHN0cmluZywgaXRlbXM6IHN0cmluZ1tdKSA9PiB7XG4gICAgICBpZiAoaXRlbXMubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcblxuICAgICAgY29uc3QgcHJldmlldyA9IGl0ZW1zLnNsaWNlKDAsIDQpLmpvaW4oXCIsIFwiKTtcbiAgICAgIGNvbnN0IGV4dHJhID0gaXRlbXMubGVuZ3RoID4gNCA/IGAgKyR7aXRlbXMubGVuZ3RoIC0gNH0gbW9yZWAgOiBcIlwiO1xuXG4gICAgICByZXR1cm4gYCR7bGFiZWx9OiAke2l0ZW1zLmxlbmd0aH0gKCR7cHJldmlld30ke2V4dHJhfSlgO1xuICAgIH07XG5cbiAgICBjb25zdCBzdW1tYXJ5UGFydHMgPSBbXG4gICAgICBmb3JtYXRMaXN0KFwiSW1wb3J0ZWRcIiwgaW1wb3J0ZWROYW1lcyksXG4gICAgICBmb3JtYXRMaXN0KFwiU2tpcHBlZFwiLCBza2lwcGVkTmFtZXMpLFxuICAgICAgZm9ybWF0TGlzdChcIlBhcnNlIGZhaWxlZFwiLCBwYXJzZUZhaWxlZE5hbWVzKSxcbiAgICAgIGZvcm1hdExpc3QoXCJDb21iaW5lZC1ibG9jayBza2lwc1wiLCBjb21iaW5lZFNraXBwZWROYW1lcylcbiAgICBdLmZpbHRlcihCb29sZWFuKTtcblxuICAgIGNvbnN0IHN1bW1hcnlQcmVmaXggPSBjYW5jZWxsZWQgPyBcIkJ1bGsgaW1wb3J0IHN0b3BwZWQuXCIgOiBcIkJ1bGsgaW1wb3J0IGNvbXBsZXRlLlwiO1xuICAgIG5ldyBOb3RpY2UoYCR7c3VtbWFyeVByZWZpeH0gJHtzdW1tYXJ5UGFydHMuam9pbihcIiB8IFwiKX1gLCAxMDAwMCk7XG4gIH1cblxuICBhc3luYyBvbmxvYWQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5sb2FkUGx1Z2luU2V0dGluZ3MoKTtcblxuICAgIHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgU2hhZG93ZGFya1N0YXRibG9ja3NTZXR0aW5nVGFiKHRoaXMuYXBwLCB0aGlzKSk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyTWFya2Rvd25Db2RlQmxvY2tQcm9jZXNzb3IoXG4gICAgICBcInNoYWRvd2RhcmstbW9uc3RlclwiLFxuICAgICAgKHNvdXJjZTogc3RyaW5nLCBlbDogSFRNTEVsZW1lbnQsIF9jdHg6IE1hcmtkb3duUG9zdFByb2Nlc3NvckNvbnRleHQpID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gcGFyc2VDb2RlQmxvY2soc291cmNlKTtcblxuICAgICAgICBpZiAoIXJlc3VsdC5zdWNjZXNzIHx8ICFyZXN1bHQuZGF0YSkge1xuICAgICAgICAgIGNvbnN0IGVycm9yQm94ID0gZWwuY3JlYXRlRGl2KHsgY2xzOiBcInNkLW1vbnN0ZXItZXJyb3ItYm94XCIgfSk7XG4gICAgICAgICAgZXJyb3JCb3guY3JlYXRlRGl2KHtcbiAgICAgICAgICAgIHRleHQ6IFwiU2hhZG93ZGFyayBtb25zdGVyIHBhcnNlIGVycm9yXCIsXG4gICAgICAgICAgICBjbHM6IFwic2QtbW9uc3Rlci1lcnJvci10aXRsZVwiXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBmb3IgKGNvbnN0IGVycm9yIG9mIHJlc3VsdC5lcnJvcnMpIHtcbiAgICAgICAgICAgIGVycm9yQm94LmNyZWF0ZURpdih7XG4gICAgICAgICAgICAgIHRleHQ6IGVycm9yLFxuICAgICAgICAgICAgICBjbHM6IFwic2QtbW9uc3Rlci1lcnJvclwiXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICByZW5kZXJNb25zdGVyQmxvY2soZWwsIHJlc3VsdC5kYXRhLCB0aGlzLnNldHRpbmdzLCByZXN1bHQud2FybmluZ3MpO1xuICAgICAgfVxuICAgICk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC53b3Jrc3BhY2Uub24oXCJhY3RpdmUtbGVhZi1jaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgICB2b2lkIHRoaXMucmVuZGVyQWxsTW9uc3RlclZpZXdzKCk7XG4gICAgICB9KVxuICAgICk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyTWFya2Rvd25Qb3N0UHJvY2Vzc29yKChlbCwgY3R4KSA9PiB7XG4gICAgICB0aGlzLnJlbmRlck1vbnN0ZXJJblByb2Nlc3NlZFByZXZpZXcoZWwsIGN0eCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC53b3Jrc3BhY2Uub24oXCJmaWxlLW9wZW5cIiwgKCkgPT4ge1xuICAgICAgICB2b2lkIHRoaXMuZW5zdXJlTW9uc3RlclZpZXdzSW5QcmV2aWV3KCk7XG4gICAgICAgIHZvaWQgdGhpcy5yZW5kZXJBbGxNb25zdGVyVmlld3MoKTtcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImxheW91dC1jaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgICB2b2lkIHRoaXMucmVuZGVyQWxsTW9uc3RlclZpZXdzKCk7XG4gICAgICB9KVxuICAgICk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLm9uKFwiY2hhbmdlZFwiLCAoKSA9PiB7XG4gICAgICAgIHZvaWQgdGhpcy5yZW5kZXJBbGxNb25zdGVyVmlld3MoKTtcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJpbnNlcnQtc2hhZG93ZGFyay1tb25zdGVyLWJsb2NrXCIsXG4gICAgICBuYW1lOiBcIkluc2VydCBTaGFkb3dkYXJrIG1vbnN0ZXIgYmxvY2tcIixcbiAgICAgIGVkaXRvckNhbGxiYWNrOiAoZWRpdG9yKSA9PiB7XG4gICAgICAgIGNvbnN0IHRlbXBsYXRlID0gW1xuICAgICAgICAgIFwiYGBgc2hhZG93ZGFyay1tb25zdGVyXCIsXG4gICAgICAgICAgXCJuYW1lOiBHb2JsaW4gU25lYWtcIixcbiAgICAgICAgICBcImxldmVsOiAxXCIsXG4gICAgICAgICAgXCJhbGlnbm1lbnQ6IENcIixcbiAgICAgICAgICBcImFjOiAxM1wiLFxuICAgICAgICAgIFwiaHA6IDVcIixcbiAgICAgICAgICBcIm12OiBuZWFyXCIsXG4gICAgICAgICAgXCJhdGs6XCIsXG4gICAgICAgICAgXCIgIC0gMSBEYWdnZXIgKzIgKDFkNClcIixcbiAgICAgICAgICBcInN0cjogLTFcIixcbiAgICAgICAgICBcImRleDogKzJcIixcbiAgICAgICAgICBcImNvbjogKzBcIixcbiAgICAgICAgICBcImludDogKzBcIixcbiAgICAgICAgICBcIndpczogLTFcIixcbiAgICAgICAgICBcImNoYTogLTFcIixcbiAgICAgICAgICBcInRyYWl0czpcIixcbiAgICAgICAgICBcIiAgLSBTbmVha3lcIixcbiAgICAgICAgICBcIiAgLSBEYXJrLWFkYXB0ZWRcIixcbiAgICAgICAgICBcImRlc2NyaXB0aW9uOiBBIHdpcnkgZ29ibGluIHRoYXQgc3RhbGtzIHRoZSBlZGdlcyBvZiB0b3JjaGxpZ2h0LlwiLFxuICAgICAgICAgIFwic291cmNlOiBIb21lYnJld1wiLFxuICAgICAgICAgIFwidGFnczpcIixcbiAgICAgICAgICBcIiAgLSBzaGFkb3dkYXJrXCIsXG4gICAgICAgICAgXCIgIC0gZ29ibGluXCIsXG4gICAgICAgICAgXCJgYGBcIlxuICAgICAgICBdLmpvaW4oXCJcXG5cIik7XG5cbiAgICAgICAgZWRpdG9yLnJlcGxhY2VTZWxlY3Rpb24odGVtcGxhdGUpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcImNyZWF0ZS1zaGFkb3dkYXJrLW1vbnN0ZXItbm90ZVwiLFxuICAgICAgbmFtZTogXCJDcmVhdGUgU2hhZG93ZGFyayBtb25zdGVyIG5vdGVcIixcbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IHRoaXMuY3JlYXRlTW9uc3Rlck5vdGUoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJpbXBvcnQtc2hhZG93ZGFyay1tb25zdGVyLWZyb20tY2xpcGJvYXJkXCIsXG4gICAgICBuYW1lOiBcIkltcG9ydCBTaGFkb3dkYXJrIG1vbnN0ZXIgZnJvbSBjbGlwYm9hcmRcIixcbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IHRoaXMuaW1wb3J0TW9uc3RlckZyb21DbGlwYm9hcmQoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJpbXBvcnQtc2hhZG93ZGFyay1tb25zdGVyLWZyb20tc2VsZWN0aW9uXCIsXG4gICAgICBuYW1lOiBcIkltcG9ydCBTaGFkb3dkYXJrIG1vbnN0ZXIgZnJvbSBzZWxlY3RlZCB0ZXh0XCIsXG4gICAgICBlZGl0b3JDYWxsYmFjazogYXN5bmMgKGVkaXRvcjogRWRpdG9yKSA9PiB7XG4gICAgICAgIGF3YWl0IHRoaXMuaW1wb3J0TW9uc3RlckZyb21TZWxlY3Rpb24oZWRpdG9yKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJlZGl0LWN1cnJlbnQtc2hhZG93ZGFyay1tb25zdGVyXCIsXG4gICAgICBuYW1lOiBcIkVkaXQgY3VycmVudCBTaGFkb3dkYXJrIG1vbnN0ZXJcIixcbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IHRoaXMuZWRpdEN1cnJlbnRNb25zdGVyTm90ZSgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcImltcG9ydC1tdWx0aXBsZS1zaGFkb3dkYXJrLW1vbnN0ZXJzXCIsXG4gICAgICBuYW1lOiBcIkltcG9ydCBtdWx0aXBsZSBTaGFkb3dkYXJrIG1vbnN0ZXJzIGZyb20gY2xpcGJvYXJkXCIsXG4gICAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgICBhd2FpdCB0aGlzLmltcG9ydE11bHRpcGxlRnJvbUNsaXBib2FyZCgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm9wZW4tbW9uc3Rlci1icm93c2VyXCIsXG4gICAgICBuYW1lOiBcIk9wZW4gbW9uc3RlciBicm93c2VyXCIsXG4gICAgICBjYWxsYmFjazogKCkgPT4ge1xuICAgICAgICBuZXcgTW9uc3RlckJyb3dzZXJNb2RhbCh0aGlzLmFwcCwgdGhpcykub3BlbigpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdm9pZCB0aGlzLmVuc3VyZU1vbnN0ZXJWaWV3c0luUHJldmlldygpO1xuICAgICAgdm9pZCB0aGlzLnJlbmRlckFsbE1vbnN0ZXJWaWV3cygpO1xuICAgIH0sIDEwMCk7XG4gIH1cblxuICBvbnVubG9hZCgpOiB2b2lkIHtcbiAgICBjb25zdCBsZWF2ZXMgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFwibWFya2Rvd25cIik7XG5cbiAgICBmb3IgKGNvbnN0IGxlYWYgb2YgbGVhdmVzKSB7XG4gICAgICBjb25zdCB2aWV3ID0gbGVhZi52aWV3O1xuICAgICAgaWYgKHZpZXcgaW5zdGFuY2VvZiBNYXJrZG93blZpZXcpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVFeGlzdGluZ0Zyb250bWF0dGVyUmVuZGVyKHZpZXcpO1xuICAgICAgICB0aGlzLnNob3dQcm9wZXJ0aWVzKHZpZXcpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMucGFyc2VkTW9uc3RlckNhY2hlLmNsZWFyKCk7XG4gIH1cblxuICBhc3luYyBsb2FkUGx1Z2luU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5zZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIERFRkFVTFRfU0VUVElOR1MsIGF3YWl0IHRoaXMubG9hZERhdGEoKSk7XG4gIH1cblxuICBhc3luYyBzYXZlUGx1Z2luU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgfVxuXG4gIGFzeW5jIHJlZnJlc2hNb25zdGVyVmlldygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLnJlbmRlckFsbE1vbnN0ZXJWaWV3cygpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjcmVhdGVNb25zdGVyTm90ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmb2xkZXJQYXRoID0gbm9ybWFsaXplUGF0aCh0aGlzLnNldHRpbmdzLm1vbnN0ZXJGb2xkZXIpO1xuXG4gICAgYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXJFeGlzdHMoZm9sZGVyUGF0aCk7XG5cbiAgICBjb25zdCBiYXNlTmFtZSA9IFwiTmV3IE1vbnN0ZXJcIjtcbiAgICBjb25zdCBmaWxlUGF0aCA9IHRoaXMuZ2V0VW5pcXVlRmlsZVBhdGgoZm9sZGVyUGF0aCwgYCR7YmFzZU5hbWV9Lm1kYCk7XG4gICAgY29uc3QgY29udGVudCA9IGJ1aWxkTW9uc3RlclRlbXBsYXRlKGJhc2VOYW1lKTtcblxuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGUoZmlsZVBhdGgsIGNvbnRlbnQpO1xuICAgIGF3YWl0IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWFmKHRydWUpLm9wZW5GaWxlKGZpbGUpO1xuXG4gICAgbmV3IE5vdGljZShgQ3JlYXRlZCBtb25zdGVyIG5vdGU6ICR7ZmlsZS5iYXNlbmFtZX1gKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgaW1wb3J0TW9uc3RlckZyb21DbGlwYm9hcmQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgbGV0IGNsaXBib2FyZFRleHQgPSBcIlwiO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNsaXBib2FyZFRleHQgPSBhd2FpdCBuYXZpZ2F0b3IuY2xpcGJvYXJkLnJlYWRUZXh0KCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJTaGFkb3dkYXJrIFN0YXRibG9ja3MgY2xpcGJvYXJkIHJlYWQgZXJyb3I6XCIsIGVycm9yKTtcbiAgICAgIG5ldyBOb3RpY2UoXCJDb3VsZCBub3QgcmVhZCBjbGlwYm9hcmQuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGF3YWl0IHRoaXMub3BlbkltcG9ydFByZXZpZXdGcm9tVGV4dChjbGlwYm9hcmRUZXh0KTtcbiAgfVxuXG4gIGdldFN1Z2dlc3RlZE90aGVyU291cmNlcygpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgcmV0dXJuIGdldFN1Z2dlc3RlZE90aGVyU291cmNlcyh0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncy5tb25zdGVyRm9sZGVyKTtcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlTbWFydERlZmF1bHRUYWdzKG1vbnN0ZXI6IFNoYWRvd2RhcmtNb25zdGVyKTogU2hhZG93ZGFya01vbnN0ZXIge1xuICAgIGNvbnN0IGV4aXN0aW5nVGFncyA9IG5ldyBTZXQoXG4gICAgICAobW9uc3Rlci50YWdzID8/IFtdKS5tYXAoKHRhZykgPT4gdGFnLnRyaW0oKS50b0xvd2VyQ2FzZSgpKS5maWx0ZXIoQm9vbGVhbilcbiAgICApO1xuXG4gICAgY29uc3QgdGV4dEJsb2IgPSBbXG4gICAgICBtb25zdGVyLm5hbWUsXG4gICAgICBtb25zdGVyLmRlc2NyaXB0aW9uLFxuICAgICAgLi4uKG1vbnN0ZXIudHJhaXRzID8/IFtdKSxcbiAgICAgIC4uLihtb25zdGVyLnNwZWNpYWxzID8/IFtdKSxcbiAgICAgIC4uLihtb25zdGVyLnNwZWxscyA/PyBbXSlcbiAgICBdXG4gICAgICAuam9pbihcIiBcIilcbiAgICAgIC50b0xvd2VyQ2FzZSgpO1xuXG4gICAgY29uc3QgbXYgPSAobW9uc3Rlci5tdiA/PyBcIlwiKS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgY29uc3QgYWRkVGFnID0gKHRhZzogc3RyaW5nKSA9PiB7XG4gICAgICBleGlzdGluZ1RhZ3MuYWRkKHRhZyk7XG4gICAgfTtcblxuICAgIGNvbnN0IGFkZElmTWF0Y2ggPSAodGFnOiBzdHJpbmcsIHBhdHRlcm5zOiBSZWdFeHBbXSkgPT4ge1xuICAgICAgaWYgKHBhdHRlcm5zLnNvbWUoKHBhdHRlcm4pID0+IHBhdHRlcm4udGVzdCh0ZXh0QmxvYikpKSB7XG4gICAgICAgIGFkZFRhZyh0YWcpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBhZGRJZk1hdGNoKFwidW5kZWFkXCIsIFtcbiAgICAgIC9cXGJ1bmRlYWRcXGIvLFxuICAgICAgL1xcYnNrZWxldG9uXFxiLyxcbiAgICAgIC9cXGJ6b21iaWVcXGIvLFxuICAgICAgL1xcYmdob3VsXFxiLyxcbiAgICAgIC9cXGJ2YW1waXJlXFxiLyxcbiAgICAgIC9cXGJsaWNoXFxiLyxcbiAgICAgIC9cXGJ3aWdodFxcYi9cbiAgICBdKTtcbiAgICBhZGRJZk1hdGNoKFwiZHJhZ29uXCIsIFsvXFxiZHJhZ29uXFxiLywgL1xcYmRyYWtlXFxiLywgL1xcYnd5cm1cXGIvXSk7XG4gICAgYWRkSWZNYXRjaChcImRlbW9uXCIsIFsvXFxiZGVtb25cXGIvXSk7XG4gICAgYWRkSWZNYXRjaChcImRldmlsXCIsIFsvXFxiZGV2aWxcXGIvXSk7XG4gICAgYWRkSWZNYXRjaChcImNvbnN0cnVjdFwiLCBbXG4gICAgICAvXFxiY29uc3RydWN0XFxiLyxcbiAgICAgIC9cXGJnb2xlbVxcYi8sXG4gICAgICAvXFxiYW5pbWF0ZWQgYXJtb3JcXGIvLFxuICAgICAgL1xcYmNsb2Nrd29ya1xcYi9cbiAgICBdKTtcbiAgICBhZGRJZk1hdGNoKFwib296ZVwiLCBbL1xcYm9vemVcXGIvLCAvXFxic2xpbWVcXGIvLCAvXFxiamVsbHlcXGIvLCAvXFxicHVkZGluZ1xcYi8sIC9cXGJpY2hvclxcYi9dKTtcbiAgICBhZGRJZk1hdGNoKFwiZ29ibGluXCIsIFsvXFxiZ29ibGluXFxiL10pO1xuICAgIGFkZElmTWF0Y2goXCJvcmNcIiwgWy9cXGJvcmNcXGIvXSk7XG4gICAgYWRkSWZNYXRjaChcInRyb2xsXCIsIFsvXFxidHJvbGxcXGIvXSk7XG4gICAgYWRkSWZNYXRjaChcIndvbGZcIiwgWy9cXGJ3b2xmXFxiL10pO1xuICAgIGFkZElmTWF0Y2goXCJnaWFudFwiLCBbL1xcYmdpYW50XFxiL10pO1xuXG4gICAgaWYgKC9cXGJmbHlcXGIvLnRlc3QobXYpKSB7XG4gICAgICBhZGRUYWcoXCJmbHlpbmdcIik7XG4gICAgfVxuXG4gICAgaWYgKC9cXGJzd2ltXFxiLy50ZXN0KG12KSB8fCAvXFxiYXF1YXRpY1xcYi8udGVzdCh0ZXh0QmxvYikgfHwgL1xcYndhdGVyXFxiLy50ZXN0KHRleHRCbG9iKSkge1xuICAgICAgYWRkVGFnKFwiYXF1YXRpY1wiKTtcbiAgICB9XG5cbiAgICBpZiAoKG1vbnN0ZXIuc3BlbGxzID8/IFtdKS5sZW5ndGggPiAwKSB7XG4gICAgICBhZGRUYWcoXCJzcGVsbGNhc3RlclwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgLi4ubW9uc3RlcixcbiAgICAgIHRhZ3M6IFsuLi5leGlzdGluZ1RhZ3NdLnNvcnQoKGEsIGIpID0+IGEubG9jYWxlQ29tcGFyZShiKSlcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBpbXBvcnRNb25zdGVyRnJvbVNlbGVjdGlvbihlZGl0b3I6IEVkaXRvcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHNlbGVjdGVkVGV4dCA9IGVkaXRvci5nZXRTZWxlY3Rpb24oKS50cmltKCk7XG5cbiAgICBpZiAoIXNlbGVjdGVkVGV4dCkge1xuICAgICAgbmV3IE5vdGljZShcIk5vIHRleHQgc2VsZWN0ZWQuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGF3YWl0IHRoaXMub3BlbkltcG9ydFByZXZpZXdGcm9tVGV4dChzZWxlY3RlZFRleHQpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBvcGVuSW1wb3J0UHJldmlld0Zyb21UZXh0KHNvdXJjZVRleHQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IHBhcnNlUmF3U2hhZG93ZGFya1RleHQoc291cmNlVGV4dCk7XG5cbiAgICBpZiAoIXJlc3VsdC5zdWNjZXNzIHx8ICFyZXN1bHQuZGF0YSkge1xuICAgICAgY29uc3QgbWVzc2FnZSA9XG4gICAgICAgIHJlc3VsdC5lcnJvcnMubGVuZ3RoID4gMFxuICAgICAgICAgID8gcmVzdWx0LmVycm9yc1swXVxuICAgICAgICAgIDogXCJDb3VsZCBub3QgcGFyc2UgbW9uc3RlciB0ZXh0LlwiO1xuICAgICAgbmV3IE5vdGljZShtZXNzYWdlLCA2MDAwKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzdWdnZXN0ZWRUYWdzID0gYXdhaXQgdGhpcy5nZXRTdWdnZXN0ZWRUYWdzKCk7XG4gICAgY29uc3Qgc3VnZ2VzdGVkT3RoZXJTb3VyY2VzID0gYXdhaXQgdGhpcy5nZXRTdWdnZXN0ZWRPdGhlclNvdXJjZXMoKTtcblxuICAgIGNvbnN0IG1vbnN0ZXJXaXRoTGFzdFNvdXJjZSA9IHRoaXMuYXBwbHlMYXN0VXNlZFNvdXJjZShyZXN1bHQuZGF0YSk7XG4gICAgY29uc3QgbW9uc3RlcldpdGhTbWFydFRhZ3MgPSB0aGlzLmFwcGx5U21hcnREZWZhdWx0VGFncyhtb25zdGVyV2l0aExhc3RTb3VyY2UpO1xuXG4gICAgY29uc3QgbW9kYWwgPSBuZXcgSW1wb3J0UHJldmlld01vZGFsKHRoaXMuYXBwLCB7XG4gICAgICBtb25zdGVyOiBtb25zdGVyV2l0aFNtYXJ0VGFncyxcbiAgICAgIHdhcm5pbmdzOiByZXN1bHQud2FybmluZ3MsXG4gICAgICBtb2RlOiBcImltcG9ydFwiLFxuICAgICAgc3VnZ2VzdGVkVGFncyxcbiAgICAgIHN1Z2dlc3RlZE90aGVyU291cmNlcyxcbiAgICAgIG9uQ29uZmlybTogYXN5bmMgKG1vbnN0ZXIpID0+IHtcbiAgICAgICAgYXdhaXQgdGhpcy5yZW1lbWJlckxhc3RVc2VkU291cmNlKG1vbnN0ZXIuc291cmNlKTtcbiAgICAgICAgYXdhaXQgdGhpcy5jcmVhdGVJbXBvcnRlZE1vbnN0ZXJOb3RlKG1vbnN0ZXIsIHJlc3VsdC53YXJuaW5ncyk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBtb2RhbC5vcGVuKCk7XG4gIH1cblxuICBnZXRTdWdnZXN0ZWRUYWdzKCk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICByZXR1cm4gZ2V0U3VnZ2VzdGVkVGFncyh0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncy5tb25zdGVyRm9sZGVyKTtcbiAgfVxuXG4gIGdldEFsbE1vbnN0ZXJJbmRleEVudHJpZXMoKTogUmV0dXJuVHlwZTx0eXBlb2YgZ2V0QWxsTW9uc3RlckluZGV4RW50cmllcz4ge1xuICAgIHJldHVybiBnZXRBbGxNb25zdGVySW5kZXhFbnRyaWVzKHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzLm1vbnN0ZXJGb2xkZXIpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjcmVhdGVJbXBvcnRlZE1vbnN0ZXJOb3RlKFxuICAgIG1vbnN0ZXI6IFNoYWRvd2RhcmtNb25zdGVyLFxuICAgIHdhcm5pbmdzOiBzdHJpbmdbXVxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmb2xkZXJQYXRoID0gbm9ybWFsaXplUGF0aCh0aGlzLnNldHRpbmdzLm1vbnN0ZXJGb2xkZXIpO1xuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyRXhpc3RzKGZvbGRlclBhdGgpO1xuXG4gICAgY29uc3Qgc2FmZU5hbWUgPSAobW9uc3Rlci5uYW1lIHx8IFwiSW1wb3J0ZWQgTW9uc3RlclwiKS50cmltKCk7XG5cbiAgICBjb25zdCBleGlzdGluZ01vbnN0ZXJGaWxlID0gdGhpcy5hcHAudmF1bHRcbiAgICAgIC5nZXRNYXJrZG93bkZpbGVzKClcbiAgICAgIC5maW5kKChmaWxlKSA9PiB7XG4gICAgICAgIGNvbnN0IGluTW9uc3RlckZvbGRlciA9XG4gICAgICAgICAgZmlsZS5wYXRoLnN0YXJ0c1dpdGgoYCR7Zm9sZGVyUGF0aH0vYCkgfHwgZmlsZS5wYXRoID09PSBgJHtmb2xkZXJQYXRofS5tZGA7XG5cbiAgICAgICAgaWYgKCFpbk1vbnN0ZXJGb2xkZXIpIHJldHVybiBmYWxzZTtcblxuICAgICAgICByZXR1cm4gZmlsZS5iYXNlbmFtZS50cmltKCkudG9Mb3dlckNhc2UoKSA9PT0gc2FmZU5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgIH0pO1xuXG4gICAgaWYgKGV4aXN0aW5nTW9uc3RlckZpbGUgaW5zdGFuY2VvZiBURmlsZSkge1xuICAgICAgY29uc3QgZXhpc3RpbmdDb250ZW50ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChleGlzdGluZ01vbnN0ZXJGaWxlKTtcbiAgICAgIGNvbnN0IGV4aXN0aW5nRnJvbnRtYXR0ZXIgPSB0aGlzLmV4dHJhY3RGcm9udG1hdHRlcihleGlzdGluZ0NvbnRlbnQpO1xuICAgICAgY29uc3QgY2FuT3ZlcndyaXRlID0gZXhpc3RpbmdGcm9udG1hdHRlcj8uc2hhZG93ZGFya1R5cGUgPT09IFwibW9uc3RlclwiO1xuXG4gICAgICBjb25zdCBtb2RhbCA9IG5ldyBEdXBsaWNhdGVNb25zdGVyTW9kYWwodGhpcy5hcHAsIHtcbiAgICAgICAgbW9uc3Rlck5hbWU6IHNhZmVOYW1lLFxuICAgICAgICBleGlzdGluZ0ZpbGVOYW1lOiBleGlzdGluZ01vbnN0ZXJGaWxlLmJhc2VuYW1lLFxuICAgICAgICBjYW5PdmVyd3JpdGUsXG4gICAgICAgIG9uT3ZlcndyaXRlOiBjYW5PdmVyd3JpdGVcbiAgICAgICAgICA/IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVFeGlzdGluZ01vbnN0ZXJOb3RlKGV4aXN0aW5nTW9uc3RlckZpbGUsIG1vbnN0ZXIpO1xuXG4gICAgICAgICAgICAgIGlmICh3YXJuaW5ncy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgbmV3IE5vdGljZShcbiAgICAgICAgICAgICAgICAgIGBVcGRhdGVkICR7ZXhpc3RpbmdNb25zdGVyRmlsZS5iYXNlbmFtZX0gd2l0aCAke3dhcm5pbmdzLmxlbmd0aH0gd2FybmluZyhzKS4gUmV2aWV3IHRoZSBub3RlLmAsXG4gICAgICAgICAgICAgICAgICA3MDAwXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBuZXcgTm90aWNlKGBVcGRhdGVkIG1vbnN0ZXI6ICR7ZXhpc3RpbmdNb25zdGVyRmlsZS5iYXNlbmFtZX1gKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICBvbkNyZWF0ZUNvcHk6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICBhd2FpdCB0aGlzLmNyZWF0ZUltcG9ydGVkTW9uc3RlckNvcHkobW9uc3Rlciwgd2FybmluZ3MpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgbW9kYWwub3BlbigpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGF3YWl0IHRoaXMuY3JlYXRlSW1wb3J0ZWRNb25zdGVyQ29weShtb25zdGVyLCB3YXJuaW5ncyk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNyZWF0ZUltcG9ydGVkTW9uc3RlckNvcHkoXG4gICAgbW9uc3RlcjogU2hhZG93ZGFya01vbnN0ZXIsXG4gICAgd2FybmluZ3M6IHN0cmluZ1tdXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGZvbGRlclBhdGggPSBub3JtYWxpemVQYXRoKHRoaXMuc2V0dGluZ3MubW9uc3RlckZvbGRlcik7XG4gICAgYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXJFeGlzdHMoZm9sZGVyUGF0aCk7XG5cbiAgICBjb25zdCBzYWZlTmFtZSA9IG1vbnN0ZXIubmFtZSB8fCBcIkltcG9ydGVkIE1vbnN0ZXJcIjtcbiAgICBjb25zdCBmaWxlUGF0aCA9IHRoaXMuZ2V0VW5pcXVlRmlsZVBhdGgoZm9sZGVyUGF0aCwgYCR7c2FmZU5hbWV9Lm1kYCk7XG4gICAgY29uc3QgY29udGVudCA9IGJ1aWxkTW9uc3Rlck5vdGVDb250ZW50KG1vbnN0ZXIpO1xuXG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShmaWxlUGF0aCwgY29udGVudCk7XG4gICAgYXdhaXQgdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYodHJ1ZSkub3BlbkZpbGUoZmlsZSk7XG5cbiAgICBpZiAod2FybmluZ3MubGVuZ3RoID4gMCkge1xuICAgICAgbmV3IE5vdGljZShcbiAgICAgICAgYEltcG9ydGVkICR7ZmlsZS5iYXNlbmFtZX0gd2l0aCAke3dhcm5pbmdzLmxlbmd0aH0gd2FybmluZyhzKS4gUmV2aWV3IHRoZSBub3RlLmAsXG4gICAgICAgIDcwMDBcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ldyBOb3RpY2UoYEltcG9ydGVkIG1vbnN0ZXI6ICR7ZmlsZS5iYXNlbmFtZX1gKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGVkaXRDdXJyZW50TW9uc3Rlck5vdGUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgdmlldyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG4gICAgaWYgKCF2aWV3KSB7XG4gICAgICBuZXcgTm90aWNlKFwiTm8gYWN0aXZlIG1hcmtkb3duIG5vdGUuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGZpbGUgPSB2aWV3LmZpbGU7XG4gICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xuICAgICAgbmV3IE5vdGljZShcIk5vIGFjdGl2ZSBmaWxlIHRvIGVkaXQuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICAgIGNvbnN0IHBhcnNlZEZyb250bWF0dGVyID0gdGhpcy5leHRyYWN0RnJvbnRtYXR0ZXIoY29udGVudCk7XG5cbiAgICBpZiAoIXBhcnNlZEZyb250bWF0dGVyIHx8IHBhcnNlZEZyb250bWF0dGVyLnNoYWRvd2RhcmtUeXBlICE9PSBcIm1vbnN0ZXJcIikge1xuICAgICAgbmV3IE5vdGljZShcIkN1cnJlbnQgbm90ZSBpcyBub3QgYSBTaGFkb3dkYXJrIG1vbnN0ZXIuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuZ2V0Q2FjaGVkTW9uc3RlclBhcnNlKGZpbGUsIHBhcnNlZEZyb250bWF0dGVyKTtcbiAgICBpZiAoIXJlc3VsdC5zdWNjZXNzIHx8ICFyZXN1bHQuZGF0YSkge1xuICAgICAgbmV3IE5vdGljZShcIkNvdWxkIG5vdCBwYXJzZSBjdXJyZW50IG1vbnN0ZXIgbm90ZS5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc3VnZ2VzdGVkVGFncyA9IGF3YWl0IHRoaXMuZ2V0U3VnZ2VzdGVkVGFncygpO1xuICAgIGNvbnN0IHN1Z2dlc3RlZE90aGVyU291cmNlcyA9IGF3YWl0IHRoaXMuZ2V0U3VnZ2VzdGVkT3RoZXJTb3VyY2VzKCk7XG5cbiAgICBjb25zdCBtb2RhbCA9IG5ldyBJbXBvcnRQcmV2aWV3TW9kYWwodGhpcy5hcHAsIHtcbiAgICAgIG1vbnN0ZXI6IHJlc3VsdC5kYXRhLFxuICAgICAgd2FybmluZ3M6IFtdLFxuICAgICAgbW9kZTogXCJlZGl0XCIsXG4gICAgICBzdWdnZXN0ZWRUYWdzLFxuICAgICAgc3VnZ2VzdGVkT3RoZXJTb3VyY2VzLFxuICAgICAgb25Db25maXJtOiBhc3luYyAobW9uc3RlcikgPT4ge1xuICAgICAgICBhd2FpdCB0aGlzLnJlbWVtYmVyTGFzdFVzZWRTb3VyY2UobW9uc3Rlci5zb3VyY2UpO1xuICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZUV4aXN0aW5nTW9uc3Rlck5vdGUoZmlsZSwgbW9uc3Rlcik7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBtb2RhbC5vcGVuKCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHVwZGF0ZUV4aXN0aW5nTW9uc3Rlck5vdGUoXG4gICAgZmlsZTogVEZpbGUsXG4gICAgbW9uc3RlcjogU2hhZG93ZGFya01vbnN0ZXJcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZXhpc3RpbmdDb250ZW50ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChmaWxlKTtcbiAgICBjb25zdCBib2R5ID0gdGhpcy5leHRyYWN0Qm9keUFmdGVyRnJvbnRtYXR0ZXIoZXhpc3RpbmdDb250ZW50KTtcblxuICAgIGNvbnN0IHVwZGF0ZWRDb250ZW50ID0gYnVpbGRNb25zdGVyTm90ZUNvbnRlbnQobW9uc3RlciwgYm9keSk7XG4gICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KGZpbGUsIHVwZGF0ZWRDb250ZW50KTtcbiAgICB0aGlzLnBhcnNlZE1vbnN0ZXJDYWNoZS5kZWxldGUoZmlsZS5wYXRoKTtcblxuICAgIG5ldyBOb3RpY2UoYFVwZGF0ZWQgbW9uc3RlcjogJHtmaWxlLmJhc2VuYW1lfWApO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaE1vbnN0ZXJWaWV3KCk7XG4gIH1cblxuICBwcml2YXRlIGV4dHJhY3RCb2R5QWZ0ZXJGcm9udG1hdHRlcihjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IG1hdGNoID0gY29udGVudC5tYXRjaCgvXi0tLVxcbltcXHNcXFNdKj9cXG4tLS1cXG4/KFtcXHNcXFNdKikkLyk7XG4gICAgcmV0dXJuIG1hdGNoPy5bMV0gPz8gXCJcIjtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZW5zdXJlRm9sZGVyRXhpc3RzKGZvbGRlclBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHBhcnRzID0gZm9sZGVyUGF0aC5zcGxpdChcIi9cIikuZmlsdGVyKEJvb2xlYW4pO1xuICAgIGxldCBjdXJyZW50UGF0aCA9IFwiXCI7XG5cbiAgICBmb3IgKGNvbnN0IHBhcnQgb2YgcGFydHMpIHtcbiAgICAgIGN1cnJlbnRQYXRoID0gY3VycmVudFBhdGggPyBgJHtjdXJyZW50UGF0aH0vJHtwYXJ0fWAgOiBwYXJ0O1xuICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoY3VycmVudFBhdGgpO1xuXG4gICAgICBpZiAoIWV4aXN0aW5nKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcihjdXJyZW50UGF0aCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBnZXRVbmlxdWVGaWxlUGF0aChmb2xkZXJQYXRoOiBzdHJpbmcsIGZpbGVOYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGRvdEluZGV4ID0gZmlsZU5hbWUubGFzdEluZGV4T2YoXCIuXCIpO1xuICAgIGNvbnN0IGJhc2UgPSBkb3RJbmRleCA+PSAwID8gZmlsZU5hbWUuc2xpY2UoMCwgZG90SW5kZXgpIDogZmlsZU5hbWU7XG4gICAgY29uc3QgZXh0ID0gZG90SW5kZXggPj0gMCA/IGZpbGVOYW1lLnNsaWNlKGRvdEluZGV4KSA6IFwiXCI7XG5cbiAgICBsZXQgY2FuZGlkYXRlID0gYCR7Zm9sZGVyUGF0aH0vJHtiYXNlfSR7ZXh0fWA7XG4gICAgbGV0IGNvdW50ZXIgPSAyO1xuXG4gICAgd2hpbGUgKHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChjYW5kaWRhdGUpKSB7XG4gICAgICBjYW5kaWRhdGUgPSBgJHtmb2xkZXJQYXRofS8ke2Jhc2V9ICR7Y291bnRlcn0ke2V4dH1gO1xuICAgICAgY291bnRlcisrO1xuICAgIH1cblxuICAgIHJldHVybiBjYW5kaWRhdGU7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJlbmRlckFsbE1vbnN0ZXJWaWV3cygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBteUdlbmVyYXRpb24gPSArK3RoaXMucmVuZGVyR2VuZXJhdGlvbjtcblxuICAgIGNvbnN0IGxlYXZlcyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoXCJtYXJrZG93blwiKTtcbiAgICBjb25zdCB2aWV3cyA9IGxlYXZlc1xuICAgICAgLm1hcCgobGVhZikgPT4gbGVhZi52aWV3KVxuICAgICAgLmZpbHRlcigodmlldyk6IHZpZXcgaXMgTWFya2Rvd25WaWV3ID0+IHZpZXcgaW5zdGFuY2VvZiBNYXJrZG93blZpZXcpO1xuXG4gICAgZm9yIChjb25zdCB2aWV3IG9mIHZpZXdzKSB7XG4gICAgICBhd2FpdCB0aGlzLnJlbmRlck1vbnN0ZXJWaWV3KHZpZXcsIG15R2VuZXJhdGlvbik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyByZW5kZXJNb25zdGVyVmlldyhcbiAgICB2aWV3OiBNYXJrZG93blZpZXcsXG4gICAgZ2VuZXJhdGlvbjogbnVtYmVyXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMucmVtb3ZlRXhpc3RpbmdGcm9udG1hdHRlclJlbmRlcih2aWV3KTtcbiAgICB0aGlzLnNob3dQcm9wZXJ0aWVzKHZpZXcpO1xuXG4gICAgaWYgKCF0aGlzLnNldHRpbmdzLnJlbmRlckZyb250bWF0dGVyTW9uc3RlcnMpIHJldHVybjtcbiAgICBpZiAodmlldy5nZXRNb2RlKCkgIT09IFwicHJldmlld1wiKSByZXR1cm47XG5cbiAgICBjb25zdCBmaWxlID0gdmlldy5maWxlO1xuICAgIGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHJldHVybjtcblxuICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpO1xuXG4gICAgaWYgKGdlbmVyYXRpb24gIT09IHRoaXMucmVuZGVyR2VuZXJhdGlvbikgcmV0dXJuO1xuXG4gICAgY29uc3QgcGFyc2VkRnJvbnRtYXR0ZXIgPSB0aGlzLmV4dHJhY3RGcm9udG1hdHRlcihjb250ZW50KTtcbiAgICBpZiAoIXBhcnNlZEZyb250bWF0dGVyKSByZXR1cm47XG4gICAgaWYgKHBhcnNlZEZyb250bWF0dGVyLnNoYWRvd2RhcmtUeXBlICE9PSBcIm1vbnN0ZXJcIikgcmV0dXJuO1xuXG4gICAgaWYgKHRoaXMuc2V0dGluZ3MuaGlkZU1vbnN0ZXJQcm9wZXJ0aWVzKSB7XG4gICAgICB0aGlzLmhpZGVQcm9wZXJ0aWVzKHZpZXcpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZW5zdXJlTW9uc3RlclZpZXdJblByZXZpZXcodmlldzogTWFya2Rvd25WaWV3KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZmlsZSA9IHZpZXcuZmlsZTtcbiAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSByZXR1cm47XG5cbiAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChmaWxlKTtcbiAgICBjb25zdCBwYXJzZWRGcm9udG1hdHRlciA9IHRoaXMuZXh0cmFjdEZyb250bWF0dGVyKGNvbnRlbnQpO1xuXG4gICAgaWYgKCFwYXJzZWRGcm9udG1hdHRlciB8fCBwYXJzZWRGcm9udG1hdHRlci5zaGFkb3dkYXJrVHlwZSAhPT0gXCJtb25zdGVyXCIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBhbHJlYWR5QXV0b1ByZXZpZXdlZEZvclRoaXNGaWxlID0gdGhpcy5hdXRvUHJldmlld2VkTGVhZkZpbGVzLmdldCh2aWV3KSA9PT0gZmlsZS5wYXRoO1xuICAgIGlmIChhbHJlYWR5QXV0b1ByZXZpZXdlZEZvclRoaXNGaWxlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHZpZXcuZ2V0TW9kZSgpID09PSBcInByZXZpZXdcIikge1xuICAgICAgdGhpcy5hdXRvUHJldmlld2VkTGVhZkZpbGVzLnNldCh2aWV3LCBmaWxlLnBhdGgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGxlYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2VcbiAgICAgICAgICAuZ2V0TGVhdmVzT2ZUeXBlKFwibWFya2Rvd25cIilcbiAgICAgICAgICAuZmluZCgobCkgPT4gbC52aWV3ID09PSB2aWV3KTtcblxuICAgICAgICBpZiAoIWxlYWYpIHJldHVybjtcblxuICAgICAgICBjb25zdCBzdGF0ZSA9IHZpZXcuZ2V0U3RhdGUoKTtcblxuICAgICAgICB2b2lkIGxlYWYuc2V0Vmlld1N0YXRlKHtcbiAgICAgICAgICB0eXBlOiBcIm1hcmtkb3duXCIsXG4gICAgICAgICAgc3RhdGU6IHtcbiAgICAgICAgICAgIC4uLnN0YXRlLFxuICAgICAgICAgICAgbW9kZTogXCJwcmV2aWV3XCIsXG4gICAgICAgICAgICBmaWxlOiBmaWxlLnBhdGhcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuYXV0b1ByZXZpZXdlZExlYWZGaWxlcy5zZXQodmlldywgZmlsZS5wYXRoKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIHN3aXRjaCB0byBwcmV2aWV3IG1vZGU6XCIsIGVycik7XG4gICAgICB9XG4gICAgfSwgNTApO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBlbnN1cmVNb25zdGVyVmlld3NJblByZXZpZXcoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbGVhdmVzID0gdGhpcy5hcHAud29ya3NwYWNlLmdldExlYXZlc09mVHlwZShcIm1hcmtkb3duXCIpO1xuICAgIGNvbnN0IHZpZXdzID0gbGVhdmVzXG4gICAgICAubWFwKChsZWFmKSA9PiBsZWFmLnZpZXcpXG4gICAgICAuZmlsdGVyKCh2aWV3KTogdmlldyBpcyBNYXJrZG93blZpZXcgPT4gdmlldyBpbnN0YW5jZW9mIE1hcmtkb3duVmlldyk7XG5cbiAgICBmb3IgKGNvbnN0IHZpZXcgb2Ygdmlld3MpIHtcbiAgICAgIGF3YWl0IHRoaXMuZW5zdXJlTW9uc3RlclZpZXdJblByZXZpZXcodmlldyk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBoaWRlUHJvcGVydGllcyh2aWV3OiBNYXJrZG93blZpZXcpOiB2b2lkIHtcbiAgICBjb25zdCBwcm9wZXJ0aWVzRWwgPSB2aWV3LmNvbnRhaW5lckVsLnF1ZXJ5U2VsZWN0b3IoXCIubWV0YWRhdGEtY29udGFpbmVyXCIpO1xuICAgIGlmIChwcm9wZXJ0aWVzRWwgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkge1xuICAgICAgcHJvcGVydGllc0VsLmNsYXNzTGlzdC5hZGQoXCJzZC1tb25zdGVyLWhpZGUtcHJvcGVydGllc1wiKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNob3dQcm9wZXJ0aWVzKHZpZXc6IE1hcmtkb3duVmlldyk6IHZvaWQge1xuICAgIGNvbnN0IGhpZGRlblByb3BlcnRpZXMgPSB2aWV3LmNvbnRhaW5lckVsLnF1ZXJ5U2VsZWN0b3JBbGwoXCIuc2QtbW9uc3Rlci1oaWRlLXByb3BlcnRpZXNcIik7XG4gICAgZm9yIChjb25zdCBlbCBvZiBoaWRkZW5Qcm9wZXJ0aWVzKSB7XG4gICAgICBlbC5jbGFzc0xpc3QucmVtb3ZlKFwic2QtbW9uc3Rlci1oaWRlLXByb3BlcnRpZXNcIik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSByZW1vdmVFeGlzdGluZ0Zyb250bWF0dGVyUmVuZGVyKHZpZXc6IE1hcmtkb3duVmlldyk6IHZvaWQge1xuICAgIGNvbnN0IGV4aXN0aW5nID0gdmlldy5jb250YWluZXJFbC5xdWVyeVNlbGVjdG9yQWxsKFwiLnNkLW1vbnN0ZXItZnJvbnRtYXR0ZXItd3JhcHBlclwiKTtcbiAgICBmb3IgKGNvbnN0IGVsIG9mIGV4aXN0aW5nKSB7XG4gICAgICBlbC5yZW1vdmUoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGV4dHJhY3RGcm9udG1hdHRlcihjb250ZW50OiBzdHJpbmcpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IG51bGwge1xuICAgIGNvbnN0IG1hdGNoID0gY29udGVudC5tYXRjaCgvXi0tLVxcbihbXFxzXFxTXSo/KVxcbi0tLS8pO1xuICAgIGlmICghbWF0Y2gpIHJldHVybiBudWxsO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlWWFtbChtYXRjaFsxXSk7XG4gICAgICBpZiAoIXBhcnNlZCB8fCB0eXBlb2YgcGFyc2VkICE9PSBcIm9iamVjdFwiKSByZXR1cm4gbnVsbDtcbiAgICAgIHJldHVybiBwYXJzZWQgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJTaGFkb3dkYXJrIFN0YXRibG9ja3MgZnJvbnRtYXR0ZXIgcGFyc2UgZXJyb3I6XCIsIGVycm9yKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxufSIsICJpbXBvcnQgeyBBcHAsIFRGaWxlLCBub3JtYWxpemVQYXRoLCBwYXJzZVlhbWwgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuZXhwb3J0IHR5cGUgTW9uc3RlckluZGV4RW50cnkgPSB7XG4gIGZpbGU6IFRGaWxlO1xuICBuYW1lOiBzdHJpbmc7XG4gIGxldmVsOiBzdHJpbmc7XG4gIGFsaWdubWVudDogc3RyaW5nO1xuICBzb3VyY2U6IHN0cmluZztcbiAgdGFnczogc3RyaW5nW107XG4gIGZyb250bWF0dGVyOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbn07XG5cbmZ1bmN0aW9uIGV4dHJhY3RGcm9udG1hdHRlcihjb250ZW50OiBzdHJpbmcpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IG51bGwge1xuICBjb25zdCBtYXRjaCA9IGNvbnRlbnQubWF0Y2goL14tLS1cXG4oW1xcc1xcU10qPylcXG4tLS0vKTtcbiAgaWYgKCFtYXRjaCkgcmV0dXJuIG51bGw7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBwYXJzZWQgPSBwYXJzZVlhbWwobWF0Y2hbMV0pO1xuICAgIGlmICghcGFyc2VkIHx8IHR5cGVvZiBwYXJzZWQgIT09IFwib2JqZWN0XCIpIHJldHVybiBudWxsO1xuICAgIHJldHVybiBwYXJzZWQgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIlNoYWRvd2RhcmsgU3RhdGJsb2NrcyBmcm9udG1hdHRlciBwYXJzZSBlcnJvcjpcIiwgZXJyb3IpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRTdWdnZXN0ZWRUYWdzKFxuICBhcHA6IEFwcCxcbiAgbW9uc3RlckZvbGRlcjogc3RyaW5nXG4pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gIGNvbnN0IGZvbGRlclBhdGggPSBub3JtYWxpemVQYXRoKG1vbnN0ZXJGb2xkZXIpO1xuICBjb25zdCBmaWxlcyA9IGFwcC52YXVsdFxuICAgIC5nZXRNYXJrZG93bkZpbGVzKClcbiAgICAuZmlsdGVyKFxuICAgICAgKGZpbGUpID0+XG4gICAgICAgIGZpbGUucGF0aC5zdGFydHNXaXRoKGAke2ZvbGRlclBhdGh9L2ApIHx8IGZpbGUucGF0aCA9PT0gYCR7Zm9sZGVyUGF0aH0ubWRgXG4gICAgKTtcblxuICBjb25zdCB0YWdzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG4gICAgY29uc3QgY29udGVudCA9IGF3YWl0IGFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICAgIGNvbnN0IGZyb250bWF0dGVyID0gZXh0cmFjdEZyb250bWF0dGVyKGNvbnRlbnQpO1xuXG4gICAgaWYgKCFmcm9udG1hdHRlciB8fCBmcm9udG1hdHRlci5zaGFkb3dkYXJrVHlwZSAhPT0gXCJtb25zdGVyXCIpIGNvbnRpbnVlO1xuXG4gICAgY29uc3QgcmF3VGFncyA9IGZyb250bWF0dGVyLnRhZ3M7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkocmF3VGFncykpIHtcbiAgICAgIGZvciAoY29uc3QgdGFnIG9mIHJhd1RhZ3MpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB0YWcgPT09IFwic3RyaW5nXCIgJiYgdGFnLnRyaW0oKSkge1xuICAgICAgICAgIHRhZ3MuYWRkKHRhZy50cmltKCkudG9Mb3dlckNhc2UoKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gWy4uLnRhZ3NdLnNvcnQoKGEsIGIpID0+IGEubG9jYWxlQ29tcGFyZShiKSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRTdWdnZXN0ZWRPdGhlclNvdXJjZXMoXG4gIGFwcDogQXBwLFxuICBtb25zdGVyRm9sZGVyOiBzdHJpbmdcbik6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgY29uc3QgZm9sZGVyUGF0aCA9IG5vcm1hbGl6ZVBhdGgobW9uc3RlckZvbGRlcik7XG4gIGNvbnN0IGZpbGVzID0gYXBwLnZhdWx0XG4gICAgLmdldE1hcmtkb3duRmlsZXMoKVxuICAgIC5maWx0ZXIoXG4gICAgICAoZmlsZSkgPT5cbiAgICAgICAgZmlsZS5wYXRoLnN0YXJ0c1dpdGgoYCR7Zm9sZGVyUGF0aH0vYCkgfHwgZmlsZS5wYXRoID09PSBgJHtmb2xkZXJQYXRofS5tZGBcbiAgICApO1xuXG4gIGNvbnN0IGJ1aWx0SW5Tb3VyY2VzID0gbmV3IFNldChbXG4gICAgXCJDb3JlIFJ1bGVzXCIsXG4gICAgXCJDdXJzZWQgU2Nyb2xsIDFcIixcbiAgICBcIkN1cnNlZCBTY3JvbGwgMlwiLFxuICAgIFwiQ3Vyc2VkIFNjcm9sbCAzXCIsXG4gICAgXCJIb21lYnJld1wiLFxuICAgIFwiT3RoZXJcIlxuICBdKTtcblxuICBjb25zdCBzb3VyY2VzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG4gICAgY29uc3QgY29udGVudCA9IGF3YWl0IGFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICAgIGNvbnN0IGZyb250bWF0dGVyID0gZXh0cmFjdEZyb250bWF0dGVyKGNvbnRlbnQpO1xuXG4gICAgaWYgKCFmcm9udG1hdHRlciB8fCBmcm9udG1hdHRlci5zaGFkb3dkYXJrVHlwZSAhPT0gXCJtb25zdGVyXCIpIGNvbnRpbnVlO1xuXG4gICAgY29uc3QgcmF3U291cmNlID0gZnJvbnRtYXR0ZXIuc291cmNlO1xuICAgIGlmICh0eXBlb2YgcmF3U291cmNlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBjb25zdCBzb3VyY2UgPSByYXdTb3VyY2UudHJpbSgpO1xuICAgICAgaWYgKHNvdXJjZSAmJiAhYnVpbHRJblNvdXJjZXMuaGFzKHNvdXJjZSkpIHtcbiAgICAgICAgc291cmNlcy5hZGQoc291cmNlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gWy4uLnNvdXJjZXNdLnNvcnQoKGEsIGIpID0+IGEubG9jYWxlQ29tcGFyZShiKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRBbGxNb25zdGVySW5kZXhFbnRyaWVzKFxuICBhcHA6IEFwcCxcbiAgbW9uc3RlckZvbGRlcjogc3RyaW5nXG4pOiBNb25zdGVySW5kZXhFbnRyeVtdIHtcbiAgY29uc3QgZm9sZGVyUGF0aCA9IG5vcm1hbGl6ZVBhdGgobW9uc3RlckZvbGRlcik7XG5cbiAgY29uc3QgZmlsZXMgPSBhcHAudmF1bHRcbiAgICAuZ2V0TWFya2Rvd25GaWxlcygpXG4gICAgLmZpbHRlcihcbiAgICAgIChmaWxlKSA9PlxuICAgICAgICBmaWxlLnBhdGguc3RhcnRzV2l0aChgJHtmb2xkZXJQYXRofS9gKSB8fCBmaWxlLnBhdGggPT09IGAke2ZvbGRlclBhdGh9Lm1kYFxuICAgICk7XG5cbiAgY29uc3QgcmVzdWx0czogTW9uc3RlckluZGV4RW50cnlbXSA9IFtdO1xuXG4gIGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xuICAgIGNvbnN0IGNhY2hlID0gYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGZpbGUpO1xuICAgIGNvbnN0IGZyb250bWF0dGVyID0gY2FjaGU/LmZyb250bWF0dGVyIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdW5kZWZpbmVkO1xuXG4gICAgaWYgKCFmcm9udG1hdHRlciB8fCBmcm9udG1hdHRlci5zaGFkb3dkYXJrVHlwZSAhPT0gXCJtb25zdGVyXCIpIGNvbnRpbnVlO1xuXG4gICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgIGZpbGUsXG4gICAgICBuYW1lOiB0eXBlb2YgZnJvbnRtYXR0ZXIubmFtZSA9PT0gXCJzdHJpbmdcIiA/IGZyb250bWF0dGVyLm5hbWUgOiBmaWxlLmJhc2VuYW1lLFxuICAgICAgbGV2ZWw6XG4gICAgICAgIHR5cGVvZiBmcm9udG1hdHRlci5sZXZlbCA9PT0gXCJzdHJpbmdcIiB8fFxuICAgICAgICB0eXBlb2YgZnJvbnRtYXR0ZXIubGV2ZWwgPT09IFwibnVtYmVyXCJcbiAgICAgICAgICA/IFN0cmluZyhmcm9udG1hdHRlci5sZXZlbClcbiAgICAgICAgICA6IFwiXCIsXG4gICAgICBhbGlnbm1lbnQ6XG4gICAgICAgIHR5cGVvZiBmcm9udG1hdHRlci5hbGlnbm1lbnQgPT09IFwic3RyaW5nXCIgPyBmcm9udG1hdHRlci5hbGlnbm1lbnQgOiBcIlwiLFxuICAgICAgc291cmNlOiB0eXBlb2YgZnJvbnRtYXR0ZXIuc291cmNlID09PSBcInN0cmluZ1wiID8gZnJvbnRtYXR0ZXIuc291cmNlIDogXCJcIixcbiAgICAgIHRhZ3M6IEFycmF5LmlzQXJyYXkoZnJvbnRtYXR0ZXIudGFncylcbiAgICAgICAgPyBmcm9udG1hdHRlci50YWdzLmZpbHRlcigodCk6IHQgaXMgc3RyaW5nID0+IHR5cGVvZiB0ID09PSBcInN0cmluZ1wiKVxuICAgICAgICA6IFtdLFxuICAgICAgZnJvbnRtYXR0ZXJcbiAgICB9KTtcbiAgfVxuXG4gIHJlc3VsdHMuc29ydCgoYSwgYikgPT4gYS5uYW1lLmxvY2FsZUNvbXBhcmUoYi5uYW1lKSk7XG4gIHJldHVybiByZXN1bHRzO1xufSIsICJleHBvcnQgaW50ZXJmYWNlIFNoYWRvd2RhcmtTdGF0YmxvY2tzU2V0dGluZ3Mge1xuICBjb21wYWN0TW9kZTogYm9vbGVhbjtcbiAgc2hvd1NvdXJjZTogYm9vbGVhbjtcbiAgc2hvd1RhZ3M6IGJvb2xlYW47XG4gIHJlbmRlckZyb250bWF0dGVyTW9uc3RlcnM6IGJvb2xlYW47XG4gIG1vbnN0ZXJGb2xkZXI6IHN0cmluZztcbiAgaGlkZU1vbnN0ZXJQcm9wZXJ0aWVzOiBib29sZWFuO1xuICBsYXN0VXNlZE1vbnN0ZXJTb3VyY2U6IHN0cmluZztcbn1cblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfU0VUVElOR1M6IFNoYWRvd2RhcmtTdGF0YmxvY2tzU2V0dGluZ3MgPSB7XG4gIGNvbXBhY3RNb2RlOiBmYWxzZSxcbiAgc2hvd1NvdXJjZTogdHJ1ZSxcbiAgc2hvd1RhZ3M6IHRydWUsXG4gIHJlbmRlckZyb250bWF0dGVyTW9uc3RlcnM6IHRydWUsXG4gIG1vbnN0ZXJGb2xkZXI6IFwiU2hhZG93ZGFyay9Nb25zdGVyc1wiLFxuICBoaWRlTW9uc3RlclByb3BlcnRpZXM6IHRydWUsXG4gIGxhc3RVc2VkTW9uc3RlclNvdXJjZTogXCJcIixcbn07IiwgImltcG9ydCB7IHBhcnNlWWFtbCB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgUGFyc2VSZXN1bHQsIFNoYWRvd2RhcmtNb25zdGVyIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBub3JtYWxpemVNb25zdGVyIH0gZnJvbSBcIi4vbm9ybWFsaXplTW9uc3RlclwiO1xuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VDb2RlQmxvY2soc291cmNlOiBzdHJpbmcpOiBQYXJzZVJlc3VsdDxTaGFkb3dkYXJrTW9uc3Rlcj4ge1xuICBjb25zdCBlcnJvcnM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IHdhcm5pbmdzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgcGFyc2VkID0gcGFyc2VZYW1sKHNvdXJjZSk7XG5cbiAgICBpZiAoIXBhcnNlZCB8fCB0eXBlb2YgcGFyc2VkICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgZXJyb3JzOiBbXCJDb2RlIGJsb2NrIGRpZCBub3QgY29udGFpbiBhIHZhbGlkIFlBTUwgb2JqZWN0LlwiXSxcbiAgICAgICAgd2FybmluZ3NcbiAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc3QgbW9uc3RlciA9IG5vcm1hbGl6ZU1vbnN0ZXIocGFyc2VkIGFzIFBhcnRpYWw8U2hhZG93ZGFya01vbnN0ZXI+KTtcblxuICAgIGlmICghbW9uc3Rlci5uYW1lIHx8IG1vbnN0ZXIubmFtZSA9PT0gXCJVbm5hbWVkIE1vbnN0ZXJcIikge1xuICAgICAgd2FybmluZ3MucHVzaChcIk1vbnN0ZXIgaXMgbWlzc2luZyBhIG5hbWUuXCIpO1xuICAgIH1cblxuICAgIGlmICghbW9uc3Rlci5hYyB8fCBtb25zdGVyLmFjID09PSBcIj9cIikge1xuICAgICAgd2FybmluZ3MucHVzaChcIk1vbnN0ZXIgaXMgbWlzc2luZyBBQy5cIik7XG4gICAgfVxuXG4gICAgaWYgKCFtb25zdGVyLmhwIHx8IG1vbnN0ZXIuaHAgPT09IFwiP1wiKSB7XG4gICAgICB3YXJuaW5ncy5wdXNoKFwiTW9uc3RlciBpcyBtaXNzaW5nIEhQLlwiKTtcbiAgICB9XG5cbiAgICBpZiAobW9uc3Rlci5hdGsubGVuZ3RoID09PSAwKSB7XG4gICAgICB3YXJuaW5ncy5wdXNoKFwiTW9uc3RlciBoYXMgbm8gYXR0YWNrcyBsaXN0ZWQuXCIpO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgZGF0YTogbW9uc3RlcixcbiAgICAgIGVycm9ycyxcbiAgICAgIHdhcm5pbmdzXG4gICAgfTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zdCBtZXNzYWdlID1cbiAgICAgIGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogXCJVbmtub3duIHBhcnNlIGVycm9yLlwiO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgZXJyb3JzOiBbYFlBTUwgcGFyc2UgZXJyb3I6ICR7bWVzc2FnZX1gXSxcbiAgICAgIHdhcm5pbmdzXG4gICAgfTtcbiAgfVxufSIsICJpbXBvcnQgeyBTaGFkb3dkYXJrQXR0YWNrLCBTaGFkb3dkYXJrTW9uc3RlciB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG50eXBlIExvb3NlTW9uc3RlciA9IFJlY29yZDxzdHJpbmcsIHVua25vd24+ICYge1xuICBuYW1lPzogdW5rbm93bjtcbiAgbGV2ZWw/OiB1bmtub3duO1xuICBhbGlnbm1lbnQ/OiB1bmtub3duO1xuICB0eXBlPzogdW5rbm93bjtcbiAgYWM/OiB1bmtub3duO1xuICBocD86IHVua25vd247XG4gIG12PzogdW5rbm93bjtcbiAgYXRrPzogdW5rbm93bjtcbiAgc3RhdHM/OiB1bmtub3duO1xuICBzdHI/OiB1bmtub3duO1xuICBkZXg/OiB1bmtub3duO1xuICBjb24/OiB1bmtub3duO1xuICBpbnQ/OiB1bmtub3duO1xuICB3aXM/OiB1bmtub3duO1xuICBjaGE/OiB1bmtub3duO1xuICB0cmFpdHM/OiB1bmtub3duO1xuICBzcGVjaWFscz86IHVua25vd247XG4gIHNwZWxscz86IHVua25vd247XG4gIGdlYXI/OiB1bmtub3duO1xuICBkZXNjcmlwdGlvbj86IHVua25vd247XG4gIHNvdXJjZT86IHVua25vd247XG4gIHRhZ3M/OiB1bmtub3duO1xufTtcblxuZnVuY3Rpb24gYXNTdHJpbmcodmFsdWU6IHVua25vd24sIGZhbGxiYWNrID0gXCJcIik6IHN0cmluZyB7XG4gIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIGZhbGxiYWNrO1xuICB9XG5cbiAgaWYgKFxuICAgIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiB8fFxuICAgIHR5cGVvZiB2YWx1ZSA9PT0gXCJudW1iZXJcIiB8fFxuICAgIHR5cGVvZiB2YWx1ZSA9PT0gXCJib29sZWFuXCJcbiAgKSB7XG4gICAgcmV0dXJuIFN0cmluZyh2YWx1ZSkudHJpbSgpO1xuICB9XG5cbiAgcmV0dXJuIGZhbGxiYWNrO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVNb2RpZmllcih2YWx1ZTogdW5rbm93biwgZmFsbGJhY2sgPSBcIiswXCIpOiBzdHJpbmcge1xuICBjb25zdCByYXcgPSBhc1N0cmluZyh2YWx1ZSwgZmFsbGJhY2spO1xuICBpZiAoIXJhdykgcmV0dXJuIGZhbGxiYWNrO1xuICBpZiAoL15bKy1dXFxkKyQvLnRlc3QocmF3KSkgcmV0dXJuIHJhdztcbiAgaWYgKC9eXFxkKyQvLnRlc3QocmF3KSkgcmV0dXJuIGArJHtyYXd9YDtcbiAgaWYgKC9eLVxcZCskLy50ZXN0KHJhdykpIHJldHVybiByYXc7XG4gIHJldHVybiByYXc7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVN0cmluZ0FycmF5KHZhbHVlOiB1bmtub3duKTogc3RyaW5nW10ge1xuICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdmFsdWUubWFwKChpdGVtKSA9PiBhc1N0cmluZyhpdGVtKSkuZmlsdGVyKEJvb2xlYW4pO1xuICB9XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIikge1xuICAgIHJldHVybiB2YWx1ZVxuICAgICAgLnNwbGl0KFwiXFxuXCIpXG4gICAgICAubWFwKChsaW5lKSA9PiBsaW5lLnRyaW0oKSlcbiAgICAgIC5maWx0ZXIoQm9vbGVhbik7XG4gIH1cblxuICByZXR1cm4gW107XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUF0dGFjayhpdGVtOiB1bmtub3duKTogU2hhZG93ZGFya0F0dGFjayB8IG51bGwge1xuICBpZiAodHlwZW9mIGl0ZW0gPT09IFwic3RyaW5nXCIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbmFtZTogaXRlbS50cmltKCksXG4gICAgICByYXc6IGl0ZW0udHJpbSgpXG4gICAgfTtcbiAgfVxuXG4gIGlmIChpdGVtICYmIHR5cGVvZiBpdGVtID09PSBcIm9iamVjdFwiKSB7XG4gICAgY29uc3Qgb2JqID0gaXRlbSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgICBjb25zdCBuYW1lID0gYXNTdHJpbmcob2JqLm5hbWUpO1xuICAgIGlmICghbmFtZSkgcmV0dXJuIG51bGw7XG5cbiAgICByZXR1cm4ge1xuICAgICAgbmFtZSxcbiAgICAgIGJvbnVzOiBhc1N0cmluZyhvYmouYm9udXMpLFxuICAgICAgZGFtYWdlOiBhc1N0cmluZyhvYmouZGFtYWdlKSxcbiAgICAgIHJhbmdlOiBhc1N0cmluZyhvYmoucmFuZ2UpLFxuICAgICAgbm90ZXM6IGFzU3RyaW5nKG9iai5ub3RlcylcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUF0dGFja3ModmFsdWU6IHVua25vd24pOiBTaGFkb3dkYXJrQXR0YWNrW10ge1xuICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdmFsdWVcbiAgICAgIC5tYXAobm9ybWFsaXplQXR0YWNrKVxuICAgICAgLmZpbHRlcigoYSk6IGEgaXMgU2hhZG93ZGFya0F0dGFjayA9PiBhICE9PSBudWxsKTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgJiYgdmFsdWUudHJpbSgpKSB7XG4gICAgcmV0dXJuIFt7IG5hbWU6IHZhbHVlLnRyaW0oKSwgcmF3OiB2YWx1ZS50cmltKCkgfV07XG4gIH1cblxuICByZXR1cm4gW107XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVNb25zdGVyKGlucHV0OiBMb29zZU1vbnN0ZXIpOiBTaGFkb3dkYXJrTW9uc3RlciB7XG4gIGNvbnN0IG5lc3RlZFN0YXRzID0gKGlucHV0LnN0YXRzIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdW5kZWZpbmVkKSA/PyB7fTtcblxuICBjb25zdCBzdHJWYWx1ZSA9IGlucHV0LnN0ciA/PyBuZXN0ZWRTdGF0cy5zdHI7XG4gIGNvbnN0IGRleFZhbHVlID0gaW5wdXQuZGV4ID8/IG5lc3RlZFN0YXRzLmRleDtcbiAgY29uc3QgY29uVmFsdWUgPSBpbnB1dC5jb24gPz8gbmVzdGVkU3RhdHMuY29uO1xuICBjb25zdCBpbnRWYWx1ZSA9IGlucHV0LmludCA/PyBuZXN0ZWRTdGF0cy5pbnQ7XG4gIGNvbnN0IHdpc1ZhbHVlID0gaW5wdXQud2lzID8/IG5lc3RlZFN0YXRzLndpcztcbiAgY29uc3QgY2hhVmFsdWUgPSBpbnB1dC5jaGEgPz8gbmVzdGVkU3RhdHMuY2hhO1xuXG4gIHJldHVybiB7XG4gICAgbmFtZTogYXNTdHJpbmcoaW5wdXQubmFtZSwgXCJVbm5hbWVkIE1vbnN0ZXJcIiksXG4gICAgbGV2ZWw6IGFzU3RyaW5nKGlucHV0LmxldmVsLCBcIj9cIiksXG4gICAgYWxpZ25tZW50OiBhc1N0cmluZyhpbnB1dC5hbGlnbm1lbnQsIFwiXCIpLFxuICAgIHR5cGU6IGFzU3RyaW5nKGlucHV0LnR5cGUsIFwiXCIpLFxuICAgIGFjOiBhc1N0cmluZyhpbnB1dC5hYywgXCI/XCIpLFxuICAgIGhwOiBhc1N0cmluZyhpbnB1dC5ocCwgXCI/XCIpLFxuICAgIG12OiBhc1N0cmluZyhpbnB1dC5tdiwgXCJcIiksXG4gICAgYXRrOiBub3JtYWxpemVBdHRhY2tzKGlucHV0LmF0ayksXG4gICAgc3RhdHM6IHtcbiAgICAgIHN0cjogbm9ybWFsaXplTW9kaWZpZXIoc3RyVmFsdWUsIFwiKzBcIiksXG4gICAgICBkZXg6IG5vcm1hbGl6ZU1vZGlmaWVyKGRleFZhbHVlLCBcIiswXCIpLFxuICAgICAgY29uOiBub3JtYWxpemVNb2RpZmllcihjb25WYWx1ZSwgXCIrMFwiKSxcbiAgICAgIGludDogbm9ybWFsaXplTW9kaWZpZXIoaW50VmFsdWUsIFwiKzBcIiksXG4gICAgICB3aXM6IG5vcm1hbGl6ZU1vZGlmaWVyKHdpc1ZhbHVlLCBcIiswXCIpLFxuICAgICAgY2hhOiBub3JtYWxpemVNb2RpZmllcihjaGFWYWx1ZSwgXCIrMFwiKVxuICAgIH0sXG4gICAgdHJhaXRzOiBub3JtYWxpemVTdHJpbmdBcnJheShpbnB1dC50cmFpdHMpLFxuICAgIHNwZWNpYWxzOiBub3JtYWxpemVTdHJpbmdBcnJheShpbnB1dC5zcGVjaWFscyksXG4gICAgc3BlbGxzOiBub3JtYWxpemVTdHJpbmdBcnJheShpbnB1dC5zcGVsbHMpLFxuICAgIGdlYXI6IG5vcm1hbGl6ZVN0cmluZ0FycmF5KGlucHV0LmdlYXIpLFxuICAgIGRlc2NyaXB0aW9uOiBhc1N0cmluZyhpbnB1dC5kZXNjcmlwdGlvbiwgXCJcIiksXG4gICAgc291cmNlOiBhc1N0cmluZyhpbnB1dC5zb3VyY2UsIFwiXCIpLFxuICAgIHRhZ3M6IG5vcm1hbGl6ZVN0cmluZ0FycmF5KGlucHV0LnRhZ3MpXG4gIH07XG59IiwgImltcG9ydCB7IFBhcnNlUmVzdWx0LCBTaGFkb3dkYXJrTW9uc3RlciB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgbm9ybWFsaXplTW9uc3RlciB9IGZyb20gXCIuL25vcm1hbGl6ZU1vbnN0ZXJcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlRnJvbnRtYXR0ZXIoXG4gIGZyb250bWF0dGVyOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPlxuKTogUGFyc2VSZXN1bHQ8U2hhZG93ZGFya01vbnN0ZXI+IHtcbiAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCB3YXJuaW5nczogc3RyaW5nW10gPSBbXTtcblxuICBpZiAoIWZyb250bWF0dGVyIHx8IHR5cGVvZiBmcm9udG1hdHRlciAhPT0gXCJvYmplY3RcIikge1xuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGVycm9yczogW1wiTm8gdmFsaWQgZnJvbnRtYXR0ZXIgZm91bmQuXCJdLFxuICAgICAgd2FybmluZ3NcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgbW9uc3RlciA9IG5vcm1hbGl6ZU1vbnN0ZXIoZnJvbnRtYXR0ZXIgYXMgUGFydGlhbDxTaGFkb3dkYXJrTW9uc3Rlcj4pO1xuXG4gIGlmICghbW9uc3Rlci5uYW1lIHx8IG1vbnN0ZXIubmFtZSA9PT0gXCJVbm5hbWVkIE1vbnN0ZXJcIikge1xuICAgIHdhcm5pbmdzLnB1c2goXCJNb25zdGVyIGlzIG1pc3NpbmcgYSBuYW1lLlwiKTtcbiAgfVxuXG4gIGlmICghbW9uc3Rlci5hYyB8fCBtb25zdGVyLmFjID09PSBcIj9cIikge1xuICAgIHdhcm5pbmdzLnB1c2goXCJNb25zdGVyIGlzIG1pc3NpbmcgQUMuXCIpO1xuICB9XG5cbiAgaWYgKCFtb25zdGVyLmhwIHx8IG1vbnN0ZXIuaHAgPT09IFwiP1wiKSB7XG4gICAgd2FybmluZ3MucHVzaChcIk1vbnN0ZXIgaXMgbWlzc2luZyBIUC5cIik7XG4gIH1cblxuICBpZiAobW9uc3Rlci5hdGsubGVuZ3RoID09PSAwKSB7XG4gICAgd2FybmluZ3MucHVzaChcIk1vbnN0ZXIgaGFzIG5vIGF0dGFja3MgbGlzdGVkLlwiKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgc3VjY2VzczogdHJ1ZSxcbiAgICBkYXRhOiBtb25zdGVyLFxuICAgIGVycm9ycyxcbiAgICB3YXJuaW5nc1xuICB9O1xufSIsICJpbXBvcnQgeyBQYXJzZVJlc3VsdCwgU2hhZG93ZGFya01vbnN0ZXIgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZU1vbnN0ZXIgfSBmcm9tIFwiLi9ub3JtYWxpemVNb25zdGVyXCI7XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVBhc3RlZFRleHQoc291cmNlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gc291cmNlXG4gICAgLnJlcGxhY2UoL1xcci9nLCBcIlxcblwiKVxuICAgIC5yZXBsYWNlKC9bXHUyMDEzXHUyMDE0XS9nLCBcIi1cIilcbiAgICAucmVwbGFjZSgvXFx1MDBBMC9nLCBcIiBcIilcbiAgICAucmVwbGFjZSgvYChbXmBdKylgL2csIFwiJDFcIilcbiAgICAucmVwbGFjZSgvKFxcKlxcKnxfXykoLio/KVxcMS9nLCBcIiQyXCIpXG4gICAgLnJlcGxhY2UoLyhcXCp8XykoLio/KVxcMS9nLCBcIiQyXCIpXG4gICAgLnJlcGxhY2UoL1sgXFx0XSsvZywgXCIgXCIpXG4gICAgLnJlcGxhY2UoL1xcbisvZywgXCJcXG5cIilcbiAgICAudHJpbSgpO1xufVxuXG5mdW5jdGlvbiBjbGVhbklubGluZSh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdGV4dC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKS50cmltKCk7XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RWYWx1ZSh0ZXh0OiBzdHJpbmcsIHBhdHRlcm46IFJlZ0V4cCk6IHN0cmluZyB7XG4gIGNvbnN0IG1hdGNoID0gdGV4dC5tYXRjaChwYXR0ZXJuKTtcbiAgcmV0dXJuIG1hdGNoPy5bMV0/LnRyaW0oKSA/PyBcIlwiO1xufVxuXG5mdW5jdGlvbiBwYXJzZUFiaWxpdGllcyh0ZXh0OiBzdHJpbmcpOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHtcbiAgY29uc3QgcmVzdWx0OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG5cbiAgY29uc3QgcGF0dGVybnM6IEFycmF5PFtzdHJpbmcsIFJlZ0V4cF0+ID0gW1xuICAgIFtcInN0clwiLCAvXFxiU1xccyooWystXT9cXGQrKVxcYi9pXSxcbiAgICBbXCJkZXhcIiwgL1xcYkRcXHMqKFsrLV0/XFxkKylcXGIvaV0sXG4gICAgW1wiY29uXCIsIC9cXGJDXFxzKihbKy1dP1xcZCspXFxiL2ldLFxuICAgIFtcImludFwiLCAvXFxiSVxccyooWystXT9cXGQrKVxcYi9pXSxcbiAgICBbXCJ3aXNcIiwgL1xcYldcXHMqKFsrLV0/XFxkKylcXGIvaV0sXG4gICAgW1wiY2hhXCIsIC9cXGJDaFxccyooWystXT9cXGQrKVxcYi9pXVxuICBdO1xuXG4gIGZvciAoY29uc3QgW2tleSwgcmVnZXhdIG9mIHBhdHRlcm5zKSB7XG4gICAgY29uc3QgbWF0Y2ggPSB0ZXh0Lm1hdGNoKHJlZ2V4KTtcbiAgICBpZiAobWF0Y2g/LlsxXSkge1xuICAgICAgY29uc3QgcmF3ID0gbWF0Y2hbMV0udHJpbSgpO1xuICAgICAgcmVzdWx0W2tleV0gPSAvXlsrLV0vLnRlc3QocmF3KSA/IHJhdyA6IGArJHtyYXd9YDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBwYXJzZUF0dGFja3Moc3RhdFRleHQ6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgY29uc3QgaW5saW5lID0gY2xlYW5JbmxpbmUoc3RhdFRleHQpO1xuXG4gIGNvbnN0IGF0a01hdGNoID0gaW5saW5lLm1hdGNoKFxuICAgIC9cXGJBVEtcXGJcXHMqKC4qPykoPz0sXFxzKk1WXFxifCxcXHMqU1xcYnwsXFxzKkRcXGJ8LFxccypDXFxifCxcXHMqSVxcYnwsXFxzKldcXGJ8LFxccypDaFxcYnwsXFxzKkFMXFxifCxcXHMqTFZcXGJ8JCkvaVxuICApO1xuICBpZiAoIWF0a01hdGNoPy5bMV0pIHJldHVybiBbXTtcblxuICBjb25zdCBhdGtUZXh0ID0gYXRrTWF0Y2hbMV0udHJpbSgpO1xuICBjb25zdCBwYXJ0cyA9IGF0a1RleHQuc3BsaXQoL1xccysoYW5kfG9yKVxccysvaSk7XG5cbiAgY29uc3QgYXR0YWNrczogc3RyaW5nW10gPSBbXTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgcGFydCA9IHBhcnRzW2ldLnRyaW0oKTtcbiAgICBpZiAoIXBhcnQpIGNvbnRpbnVlO1xuXG4gICAgaWYgKGkgPT09IDApIHtcbiAgICAgIGF0dGFja3MucHVzaChwYXJ0KTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChpICUgMiA9PT0gMSkgY29udGludWU7XG5cbiAgICBjb25zdCBjb25uZWN0b3IgPSBwYXJ0c1tpIC0gMV0/LnRyaW0oKS50b1VwcGVyQ2FzZSgpO1xuICAgIGlmIChjb25uZWN0b3IgPT09IFwiQU5EXCIgfHwgY29ubmVjdG9yID09PSBcIk9SXCIpIHtcbiAgICAgIGF0dGFja3MucHVzaChgJHtjb25uZWN0b3J9ICR7cGFydH1gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXR0YWNrcy5wdXNoKHBhcnQpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhdHRhY2tzO1xufVxuXG5mdW5jdGlvbiBzcGxpdFNlY3Rpb25zKHNvdXJjZTogc3RyaW5nKToge1xuICBsZWFkVGV4dDogc3RyaW5nO1xuICBzdGF0VGV4dDogc3RyaW5nO1xuICB0cmFpbGluZ1RleHQ6IHN0cmluZztcbn0gfCBudWxsIHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhc3RlZFRleHQoc291cmNlKTtcblxuICBjb25zdCBhY0luZGV4ID0gbm9ybWFsaXplZC5zZWFyY2goL1xcYkFDXFxiL2kpO1xuICBpZiAoYWNJbmRleCA8IDApIHJldHVybiBudWxsO1xuXG4gIGNvbnN0IGxlYWRUZXh0ID0gbm9ybWFsaXplZC5zbGljZSgwLCBhY0luZGV4KS50cmltKCk7XG4gIGNvbnN0IGFmdGVyTGVhZCA9IG5vcm1hbGl6ZWQuc2xpY2UoYWNJbmRleCkudHJpbSgpO1xuXG4gIGNvbnN0IGx2TWF0Y2ggPSBhZnRlckxlYWQubWF0Y2goL1xcYkxWXFxiXFxzKihbXlxccywuO10rKS9pKTtcbiAgaWYgKCFsdk1hdGNoIHx8IGx2TWF0Y2guaW5kZXggPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiB7XG4gICAgICBsZWFkVGV4dCxcbiAgICAgIHN0YXRUZXh0OiBhZnRlckxlYWQsXG4gICAgICB0cmFpbGluZ1RleHQ6IFwiXCJcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgbHZTdGFydCA9IGx2TWF0Y2guaW5kZXg7XG4gIGNvbnN0IGx2RnVsbCA9IGx2TWF0Y2hbMF07XG4gIGNvbnN0IGx2RW5kID0gbHZTdGFydCArIGx2RnVsbC5sZW5ndGg7XG5cbiAgcmV0dXJuIHtcbiAgICBsZWFkVGV4dCxcbiAgICBzdGF0VGV4dDogYWZ0ZXJMZWFkLnNsaWNlKDAsIGx2RW5kKS50cmltKCksXG4gICAgdHJhaWxpbmdUZXh0OiBhZnRlckxlYWQuc2xpY2UobHZFbmQpLnRyaW0oKVxuICB9O1xufVxuXG5mdW5jdGlvbiBsb29rc0xpa2VUcmFpbGluZ05hbWVMaW5lKGxpbmU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBjbGVhbmVkID0gY2xlYW5JbmxpbmUobGluZSk7XG4gIGlmICghY2xlYW5lZCkgcmV0dXJuIGZhbHNlO1xuXG4gIGNvbnN0IHdvcmRzID0gY2xlYW5lZC5zcGxpdCgvXFxzKy8pLmZpbHRlcihCb29sZWFuKTtcbiAgaWYgKHdvcmRzLmxlbmd0aCA9PT0gMCB8fCB3b3Jkcy5sZW5ndGggPiA1KSByZXR1cm4gZmFsc2U7XG5cbiAgcmV0dXJuIHdvcmRzLmV2ZXJ5KCh3b3JkKSA9PiAvXltBLVpdW0EtWiwnLV0qJC8udGVzdCh3b3JkKSk7XG59XG5cbmZ1bmN0aW9uIHNwbGl0TGVhZFRleHQobGVhZFRleHQ6IHN0cmluZyk6IHsgbmFtZTogc3RyaW5nOyBkZXNjcmlwdGlvbjogc3RyaW5nIH0ge1xuICBjb25zdCBvcmlnaW5hbExpbmVzID0gbGVhZFRleHRcbiAgICAuc3BsaXQoL1xcbisvKVxuICAgIC5tYXAoKGxpbmUpID0+IGNsZWFuSW5saW5lKGxpbmUpKVxuICAgIC5maWx0ZXIoQm9vbGVhbik7XG5cbiAgaWYgKG9yaWdpbmFsTGluZXMubGVuZ3RoID49IDIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbmFtZTogb3JpZ2luYWxMaW5lc1swXSxcbiAgICAgIGRlc2NyaXB0aW9uOiBjbGVhbklubGluZShvcmlnaW5hbExpbmVzLnNsaWNlKDEpLmpvaW4oXCIgXCIpKVxuICAgIH07XG4gIH1cblxuICBjb25zdCBsZWFkID0gY2xlYW5JbmxpbmUobGVhZFRleHQpO1xuICBpZiAoIWxlYWQpIHtcbiAgICByZXR1cm4geyBuYW1lOiBcIlwiLCBkZXNjcmlwdGlvbjogXCJcIiB9O1xuICB9XG5cbiAgY29uc3QgY2Fwc01hdGNoID0gbGVhZC5tYXRjaCgvXihbQS1aXVtBLVowLTknIC1dezIsfT8pKD89XFxzK1tBLVpdP1thLXpdKS8pO1xuICBpZiAoY2Fwc01hdGNoKSB7XG4gICAgY29uc3QgbmFtZSA9IGNhcHNNYXRjaFsxXS50cmltKCk7XG4gICAgY29uc3QgZGVzY3JpcHRpb24gPSBsZWFkLnNsaWNlKGNhcHNNYXRjaFswXS5sZW5ndGgpLnRyaW0oKTtcbiAgICByZXR1cm4geyBuYW1lLCBkZXNjcmlwdGlvbiB9O1xuICB9XG5cbiAgcmV0dXJuIHsgbmFtZTogXCJcIiwgZGVzY3JpcHRpb246IGxlYWQgfTtcbn1cblxuZnVuY3Rpb24gc3BsaXRUcmFpbGluZ05hbWUodHJhaWxpbmdUZXh0OiBzdHJpbmcpOiB7IHRyYWlsaW5nQm9keTogc3RyaW5nOyB0cmFpbGluZ05hbWU6IHN0cmluZyB9IHtcbiAgY29uc3QgbGluZXMgPSB0cmFpbGluZ1RleHRcbiAgICAuc3BsaXQoL1xcbisvKVxuICAgIC5tYXAoKGxpbmUpID0+IGNsZWFuSW5saW5lKGxpbmUpKVxuICAgIC5maWx0ZXIoQm9vbGVhbik7XG5cbiAgaWYgKGxpbmVzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiB7IHRyYWlsaW5nQm9keTogXCJcIiwgdHJhaWxpbmdOYW1lOiBcIlwiIH07XG4gIH1cblxuICBjb25zdCBsYXN0TGluZSA9IGxpbmVzW2xpbmVzLmxlbmd0aCAtIDFdO1xuICBpZiAoIWxvb2tzTGlrZVRyYWlsaW5nTmFtZUxpbmUobGFzdExpbmUpKSB7XG4gICAgcmV0dXJuIHsgdHJhaWxpbmdCb2R5OiB0cmFpbGluZ1RleHQsIHRyYWlsaW5nTmFtZTogXCJcIiB9O1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICB0cmFpbGluZ0JvZHk6IGxpbmVzLnNsaWNlKDAsIC0xKS5qb2luKFwiXFxuXCIpLFxuICAgIHRyYWlsaW5nTmFtZTogbGFzdExpbmVcbiAgfTtcbn1cblxuZnVuY3Rpb24gcGFyc2VBYmlsaXR5RW50cmllcyh0cmFpbGluZ1RleHQ6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgY29uc3QgY2xlYW5lZCA9IGNsZWFuSW5saW5lKHRyYWlsaW5nVGV4dCk7XG4gIGlmICghY2xlYW5lZCkgcmV0dXJuIFtdO1xuXG4gIGNvbnN0IGZvcmJpZGRlbkxhYmVscyA9IG5ldyBTZXQoW1xuICAgIFwiQUNcIixcbiAgICBcIkhQXCIsXG4gICAgXCJNVlwiLFxuICAgIFwiQUxcIixcbiAgICBcIkxWXCIsXG4gICAgXCJTVFJcIixcbiAgICBcIkRFWFwiLFxuICAgIFwiQ09OXCIsXG4gICAgXCJJTlRcIixcbiAgICBcIldJU1wiLFxuICAgIFwiQ0hBXCIsXG4gICAgXCJEQ1wiXG4gIF0pO1xuXG4gIGZ1bmN0aW9uIGlzQWJpbGl0eUxhYmVsKGxhYmVsOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBjb25zdCBzdHJpcHBlZCA9IGxhYmVsLnJlcGxhY2UoL1suPyFdKyQvLCBcIlwiKS50cmltKCk7XG4gICAgaWYgKCFzdHJpcHBlZCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgY29uc3Qgd29yZHMgPSBzdHJpcHBlZC5zcGxpdCgvXFxzKy8pLmZpbHRlcihCb29sZWFuKTtcbiAgICBpZiAod29yZHMubGVuZ3RoID09PSAwIHx8IHdvcmRzLmxlbmd0aCA+IDQpIHJldHVybiBmYWxzZTtcblxuICAgIGlmICh3b3Jkcy5sZW5ndGggPT09IDEgJiYgZm9yYmlkZGVuTGFiZWxzLmhhcyh3b3Jkc1swXS50b1VwcGVyQ2FzZSgpKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB3b3Jkcy5ldmVyeSgod29yZCkgPT4gL15bQS1aXVthLXowLTknLV0qJC8udGVzdCh3b3JkKSk7XG4gIH1cblxuICBjb25zdCBsYWJlbFJlZ2V4ID0gLyhefFxccykoW0EtWl1bQS1aYS16MC05Jy1dKig/OlxccytbQS1aXVtBLVphLXowLTknLV0qKXswLDN9Wy4/IV0pKD89XFxzfCQpL2c7XG5cbiAgY29uc3Qgc3RhcnRzOiBudW1iZXJbXSA9IFtdO1xuICBsZXQgbWF0Y2g6IFJlZ0V4cEV4ZWNBcnJheSB8IG51bGw7XG5cbiAgd2hpbGUgKChtYXRjaCA9IGxhYmVsUmVnZXguZXhlYyhjbGVhbmVkKSkgIT09IG51bGwpIHtcbiAgICBjb25zdCBmdWxsTWF0Y2hJbmRleCA9IG1hdGNoLmluZGV4ID8/IDA7XG4gICAgY29uc3QgcHJlZml4ID0gbWF0Y2hbMV0gPz8gXCJcIjtcbiAgICBjb25zdCBsYWJlbCA9IG1hdGNoWzJdID8/IFwiXCI7XG5cbiAgICBpZiAoIWlzQWJpbGl0eUxhYmVsKGxhYmVsKSkgY29udGludWU7XG5cbiAgICBjb25zdCBsYWJlbFN0YXJ0ID0gZnVsbE1hdGNoSW5kZXggKyBwcmVmaXgubGVuZ3RoO1xuICAgIHN0YXJ0cy5wdXNoKGxhYmVsU3RhcnQpO1xuICB9XG5cbiAgaWYgKHN0YXJ0cy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gW2NsZWFuZWRdO1xuICB9XG5cbiAgY29uc3QgZW50cmllczogc3RyaW5nW10gPSBbXTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHN0YXJ0cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHN0YXJ0ID0gc3RhcnRzW2ldO1xuICAgIGNvbnN0IGVuZCA9IGkgKyAxIDwgc3RhcnRzLmxlbmd0aCA/IHN0YXJ0c1tpICsgMV0gOiBjbGVhbmVkLmxlbmd0aDtcblxuICAgIGNvbnN0IGNodW5rID0gY2xlYW5lZC5zbGljZShzdGFydCwgZW5kKS50cmltKCk7XG4gICAgaWYgKGNodW5rKSB7XG4gICAgICBlbnRyaWVzLnB1c2goY2h1bmspO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBlbnRyaWVzO1xufVxuXG5mdW5jdGlvbiBjbGFzc2lmeUFiaWxpdHlFbnRyeShlbnRyeTogc3RyaW5nKTogXCJ0cmFpdFwiIHwgXCJzcGVjaWFsXCIgfCBcInNwZWxsXCIge1xuICBjb25zdCBsb3dlciA9IGVudHJ5LnRvTG93ZXJDYXNlKCk7XG5cbiAgaWYgKC8kYmVnaW46bWF0aDp0ZXh0JFxcKGludFxcfHdpc1xcfGNoYVxcKVxcXFxzXFwrc3BlbGwkZW5kOm1hdGg6dGV4dCQvaS50ZXN0KGVudHJ5KSkge1xuICAgIHJldHVybiBcInNwZWxsXCI7XG4gIH1cblxuICBjb25zdCBsYWJlbCA9IGVudHJ5LnNwbGl0KC9bLjohP10vLCAxKVswXT8udHJpbSgpLnRvTG93ZXJDYXNlKCkgPz8gXCJcIjtcblxuICAvLyBTcGVsbC1saWtlLCBldmVuIGlmIG5vdCBleHBsaWNpdGx5IG1hcmtlZCBhcyBTcGVsbFxuICBpZiAoXG4gICAgbGFiZWwgPT09IFwiY2hhcm1cIiB8fFxuICAgIC9cXGJzcGVsbFxcYi9pLnRlc3QoZW50cnkpXG4gICkge1xuICAgIHJldHVybiBcInNwZWxsXCI7XG4gIH1cblxuICBpZiAoXG4gICAgL1xcYmluIHBsYWNlIG9mIGF0dGFja3NcXGIvaS50ZXN0KGVudHJ5KSB8fFxuICAgIC9cXGJ1c2UgdHVyblxcYi9pLnRlc3QoZW50cnkpIHx8XG4gICAgL1xcYjFcXC9kYXlcXGIvaS50ZXN0KGVudHJ5KSB8fFxuICAgIC9cXGJ0YXJnZXQgdGFrZXNcXGIvaS50ZXN0KGVudHJ5KSB8fFxuICAgIC9cXGJ0YXJnZXQgcGVybWFuZW50bHkgbG9zZXNcXGIvaS50ZXN0KGVudHJ5KSB8fFxuICAgIC9cXGJoZWFsc1xcYi9pLnRlc3QoZW50cnkpIHx8XG4gICAgL1xcYnJpc2VzIGFzXFxiL2kudGVzdChlbnRyeSkgfHxcbiAgICAvXFxic3VtbW9uXFxiL2kudGVzdChlbnRyeSkgfHxcbiAgICAvXFxiZGNcXHMqXFxkK1xcYi9pLnRlc3QoZW50cnkpXG4gICkge1xuICAgIHJldHVybiBcInNwZWNpYWxcIjtcbiAgfVxuXG4gIHJldHVybiBcInRyYWl0XCI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVJhd1NoYWRvd2RhcmtUZXh0KHNvdXJjZTogc3RyaW5nKTogUGFyc2VSZXN1bHQ8U2hhZG93ZGFya01vbnN0ZXI+IHtcbiAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCB3YXJuaW5nczogc3RyaW5nW10gPSBbXTtcblxuICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplUGFzdGVkVGV4dChzb3VyY2UpO1xuICBpZiAoIW5vcm1hbGl6ZWQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBlcnJvcnM6IFtcIkNsaXBib2FyZCBpcyBlbXB0eS5cIl0sXG4gICAgICB3YXJuaW5nc1xuICAgIH07XG4gIH1cblxuICBjb25zdCBzZWN0aW9ucyA9IHNwbGl0U2VjdGlvbnMobm9ybWFsaXplZCk7XG4gIGlmICghc2VjdGlvbnMpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBlcnJvcnM6IFtcIkNvdWxkIG5vdCBmaW5kIGEgc3RhdCBibG9jayBiZWdpbm5pbmcgd2l0aCBBQy5cIl0sXG4gICAgICB3YXJuaW5nc1xuICAgIH07XG4gIH1cblxuICBjb25zdCB7IGxlYWRUZXh0LCBzdGF0VGV4dCwgdHJhaWxpbmdUZXh0IH0gPSBzZWN0aW9ucztcbiAgY29uc3Qgc3RhdElubGluZSA9IGNsZWFuSW5saW5lKHN0YXRUZXh0KTtcblxuICBjb25zdCB0cmFpbGluZ1NwbGl0ID0gc3BsaXRUcmFpbGluZ05hbWUodHJhaWxpbmdUZXh0KTtcbiAgY29uc3QgeyB0cmFpbGluZ0JvZHksIHRyYWlsaW5nTmFtZSB9ID0gdHJhaWxpbmdTcGxpdDtcblxuICBjb25zdCBsZWFkUGFyc2VkID0gc3BsaXRMZWFkVGV4dChsZWFkVGV4dCk7XG5cbiAgY29uc3QgbmFtZSA9IHRyYWlsaW5nTmFtZSB8fCBsZWFkUGFyc2VkLm5hbWU7XG4gIGNvbnN0IGRlc2NyaXB0aW9uID0gdHJhaWxpbmdOYW1lXG4gICAgPyBjbGVhbklubGluZShsZWFkVGV4dClcbiAgICA6IGxlYWRQYXJzZWQuZGVzY3JpcHRpb247XG5cbiAgY29uc3QgYWMgPSBleHRyYWN0VmFsdWUoc3RhdElubGluZSwgL1xcYkFDXFxiXFxzKihbXixdKykvaSk7XG4gIGNvbnN0IGhwID0gZXh0cmFjdFZhbHVlKHN0YXRJbmxpbmUsIC9cXGJIUFxcYlxccyooW14sXSspL2kpO1xuICBjb25zdCBhbGlnbm1lbnQgPSBleHRyYWN0VmFsdWUoc3RhdElubGluZSwgL1xcYkFMXFxiXFxzKihbXixdKykvaSk7XG4gIGNvbnN0IGxldmVsID0gZXh0cmFjdFZhbHVlKHN0YXRJbmxpbmUsIC9cXGJMVlxcYlxccyooW15cXHMsLjtdKykvaSk7XG5cbiAgY29uc3QgbXZNYXRjaCA9IHN0YXRJbmxpbmUubWF0Y2goXG4gICAgL1xcYk1WXFxiXFxzKiguKj8pKD89LFxccypTXFxifCxcXHMqRFxcYnwsXFxzKkNcXGJ8LFxccypJXFxifCxcXHMqV1xcYnwsXFxzKkNoXFxifCxcXHMqQUxcXGJ8LFxccypMVlxcYnwkKS9pXG4gICk7XG4gIGNvbnN0IG12ID0gbXZNYXRjaD8uWzFdPy50cmltKCkgPz8gXCJcIjtcblxuICBjb25zdCBhdHRhY2tzID0gcGFyc2VBdHRhY2tzKHN0YXRJbmxpbmUpO1xuICBpZiAoYXR0YWNrcy5sZW5ndGggPT09IDApIHtcbiAgICB3YXJuaW5ncy5wdXNoKFwiTm8gYXR0YWNrcyBjb3VsZCBiZSBwYXJzZWQuIFlvdSBtYXkgbmVlZCB0byBhZGQgdGhlbSBtYW51YWxseS5cIik7XG4gIH1cblxuICBjb25zdCBhYmlsaXRpZXMgPSBwYXJzZUFiaWxpdGllcyhzdGF0SW5saW5lKTtcblxuICBjb25zdCBlbnRyaWVzID0gcGFyc2VBYmlsaXR5RW50cmllcyh0cmFpbGluZ0JvZHkpO1xuXG4gIGNvbnN0IHRyYWl0czogc3RyaW5nW10gPSBbXTtcbiAgY29uc3Qgc3BlY2lhbHM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IHNwZWxsczogc3RyaW5nW10gPSBbXTtcblxuICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHtcbiAgICBjb25zdCBraW5kID0gY2xhc3NpZnlBYmlsaXR5RW50cnkoZW50cnkpO1xuICAgIGlmIChraW5kID09PSBcInNwZWxsXCIpIHtcbiAgICAgIHNwZWxscy5wdXNoKGVudHJ5KTtcbiAgICB9IGVsc2UgaWYgKGtpbmQgPT09IFwic3BlY2lhbFwiKSB7XG4gICAgICBzcGVjaWFscy5wdXNoKGVudHJ5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdHJhaXRzLnB1c2goZW50cnkpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IG1vbnN0ZXIgPSBub3JtYWxpemVNb25zdGVyKHtcbiAgICBuYW1lLFxuICAgIGxldmVsLFxuICAgIGFsaWdubWVudCxcbiAgICBhYyxcbiAgICBocCxcbiAgICBtdixcbiAgICBhdGs6IGF0dGFja3MsXG4gICAgc3RyOiBhYmlsaXRpZXMuc3RyLFxuICAgIGRleDogYWJpbGl0aWVzLmRleCxcbiAgICBjb246IGFiaWxpdGllcy5jb24sXG4gICAgaW50OiBhYmlsaXRpZXMuaW50LFxuICAgIHdpczogYWJpbGl0aWVzLndpcyxcbiAgICBjaGE6IGFiaWxpdGllcy5jaGEsXG4gICAgdHJhaXRzLFxuICAgIHNwZWNpYWxzLFxuICAgIHNwZWxscyxcbiAgICBkZXNjcmlwdGlvbixcbiAgICBzb3VyY2U6IFwiSW1wb3J0ZWQgZnJvbSBjbGlwYm9hcmRcIixcbiAgICB0YWdzOiBbXCJzaGFkb3dkYXJrXCIsIFwiaW1wb3J0ZWRcIl1cbiAgfSk7XG5cbiAgaWYgKCFtb25zdGVyLm5hbWUgfHwgbW9uc3Rlci5uYW1lID09PSBcIlVubmFtZWQgTW9uc3RlclwiKSB7XG4gICAgZXJyb3JzLnB1c2goXCJDb3VsZCBub3QgZGV0ZXJtaW5lIG1vbnN0ZXIgbmFtZS5cIik7XG4gIH1cblxuICBpZiAoIW1vbnN0ZXIuYWMgfHwgbW9uc3Rlci5hYyA9PT0gXCI/XCIpIHtcbiAgICB3YXJuaW5ncy5wdXNoKFwiQ291bGQgbm90IGNvbmZpZGVudGx5IHBhcnNlIEFDLlwiKTtcbiAgfVxuXG4gIGlmICghbW9uc3Rlci5ocCB8fCBtb25zdGVyLmhwID09PSBcIj9cIikge1xuICAgIHdhcm5pbmdzLnB1c2goXCJDb3VsZCBub3QgY29uZmlkZW50bHkgcGFyc2UgSFAuXCIpO1xuICB9XG5cbiAgaWYgKCFtb25zdGVyLmxldmVsIHx8IG1vbnN0ZXIubGV2ZWwgPT09IFwiP1wiKSB7XG4gICAgd2FybmluZ3MucHVzaChcIkNvdWxkIG5vdCBjb25maWRlbnRseSBwYXJzZSBsZXZlbC5cIik7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHN1Y2Nlc3M6IGVycm9ycy5sZW5ndGggPT09IDAsXG4gICAgZGF0YTogZXJyb3JzLmxlbmd0aCA9PT0gMCA/IG1vbnN0ZXIgOiB1bmRlZmluZWQsXG4gICAgZXJyb3JzLFxuICAgIHdhcm5pbmdzXG4gIH07XG59IiwgImltcG9ydCB7IFNoYWRvd2RhcmtNb25zdGVyLCBTaGFkb3dkYXJrQXR0YWNrIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBTaGFkb3dkYXJrU3RhdGJsb2Nrc1NldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzXCI7XG5cbmZ1bmN0aW9uIGNyZWF0ZURpdihjbGFzc05hbWU/OiBzdHJpbmcsIHRleHQ/OiBzdHJpbmcpOiBIVE1MRGl2RWxlbWVudCB7XG4gIGNvbnN0IGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgaWYgKGNsYXNzTmFtZSkgZWwuY2xhc3NOYW1lID0gY2xhc3NOYW1lO1xuICBpZiAodGV4dCAhPT0gdW5kZWZpbmVkKSBlbC50ZXh0Q29udGVudCA9IHRleHQ7XG4gIHJldHVybiBlbDtcbn1cblxuZnVuY3Rpb24gY3JlYXRlU3BhbihjbGFzc05hbWU/OiBzdHJpbmcsIHRleHQ/OiBzdHJpbmcpOiBIVE1MU3BhbkVsZW1lbnQge1xuICBjb25zdCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICBpZiAoY2xhc3NOYW1lKSBlbC5jbGFzc05hbWUgPSBjbGFzc05hbWU7XG4gIGlmICh0ZXh0ICE9PSB1bmRlZmluZWQpIGVsLnRleHRDb250ZW50ID0gdGV4dDtcbiAgcmV0dXJuIGVsO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVMaXN0KGNsYXNzTmFtZT86IHN0cmluZyk6IEhUTUxVTGlzdEVsZW1lbnQge1xuICBjb25zdCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ1bFwiKTtcbiAgaWYgKGNsYXNzTmFtZSkgZWwuY2xhc3NOYW1lID0gY2xhc3NOYW1lO1xuICByZXR1cm4gZWw7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUxpc3RJdGVtKGNsYXNzTmFtZT86IHN0cmluZyk6IEhUTUxMSUVsZW1lbnQge1xuICBjb25zdCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcbiAgaWYgKGNsYXNzTmFtZSkgZWwuY2xhc3NOYW1lID0gY2xhc3NOYW1lO1xuICByZXR1cm4gZWw7XG59XG5cbmZ1bmN0aW9uIHJlbmRlckF0dGFja1RleHQoYXR0YWNrOiBTaGFkb3dkYXJrQXR0YWNrKTogc3RyaW5nIHtcbiAgaWYgKGF0dGFjay5yYXcpIHJldHVybiBhdHRhY2sucmF3O1xuXG4gIGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IFthdHRhY2submFtZV07XG5cbiAgaWYgKGF0dGFjay5ib251cykgcGFydHMucHVzaChhdHRhY2suYm9udXMpO1xuICBpZiAoYXR0YWNrLmRhbWFnZSkgcGFydHMucHVzaChgKCR7YXR0YWNrLmRhbWFnZX0pYCk7XG4gIGlmIChhdHRhY2sucmFuZ2UpIHBhcnRzLnB1c2goYFske2F0dGFjay5yYW5nZX1dYCk7XG4gIGlmIChhdHRhY2subm90ZXMpIHBhcnRzLnB1c2goYC0gJHthdHRhY2subm90ZXN9YCk7XG5cbiAgcmV0dXJuIHBhcnRzLmpvaW4oXCIgXCIpLnRyaW0oKTtcbn1cblxuZnVuY3Rpb24gZ2V0QWxpZ25tZW50TGFiZWwoYWxpZ25tZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBub3JtYWxpemVkID0gYWxpZ25tZW50LnRyaW0oKS50b1VwcGVyQ2FzZSgpO1xuXG4gIHN3aXRjaCAobm9ybWFsaXplZCkge1xuICAgIGNhc2UgXCJMXCI6XG4gICAgICByZXR1cm4gXCJMYXdmdWxcIjtcbiAgICBjYXNlIFwiTlwiOlxuICAgICAgcmV0dXJuIFwiTmV1dHJhbFwiO1xuICAgIGNhc2UgXCJDXCI6XG4gICAgICByZXR1cm4gXCJDaGFvdGljXCI7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBcIlwiO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNwbGl0QXR0YWNrQ29ubmVjdG9yKHRleHQ6IHN0cmluZyk6IHsgY29ubmVjdG9yOiBzdHJpbmcgfCBudWxsOyBib2R5OiBzdHJpbmcgfSB7XG4gIGNvbnN0IHRyaW1tZWQgPSB0ZXh0LnRyaW0oKTtcbiAgY29uc3QgbWF0Y2ggPSB0cmltbWVkLm1hdGNoKC9eKEFORHxPUilcXHMrKC4rKSQvaSk7XG5cbiAgaWYgKCFtYXRjaCkge1xuICAgIHJldHVybiB7IGNvbm5lY3RvcjogbnVsbCwgYm9keTogdHJpbW1lZCB9O1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBjb25uZWN0b3I6IG1hdGNoWzFdLnRvVXBwZXJDYXNlKCksXG4gICAgYm9keTogbWF0Y2hbMl0udHJpbSgpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGFwcGVuZFJlbmRlcmVkQXR0YWNrKGxpOiBIVE1MTElFbGVtZW50LCBhdHRhY2tUZXh0OiBzdHJpbmcpOiB2b2lkIHtcbiAgY29uc3QgeyBjb25uZWN0b3IsIGJvZHkgfSA9IHNwbGl0QXR0YWNrQ29ubmVjdG9yKGF0dGFja1RleHQpO1xuXG4gIGlmIChjb25uZWN0b3IpIHtcbiAgICBsaS5hcHBlbmRDaGlsZChjcmVhdGVTcGFuKFwic2QtbW9uc3Rlci1hdHRhY2stY29ubmVjdG9yXCIsIGAke2Nvbm5lY3Rvcn0gYCkpO1xuICB9XG5cbiAgbGkuYXBwZW5kQ2hpbGQoY3JlYXRlU3BhbihcInNkLW1vbnN0ZXItYXR0YWNrLXRleHRcIiwgYm9keSkpO1xufVxuXG5mdW5jdGlvbiBzcGxpdExhYmVsQW5kQm9keSh0ZXh0OiBzdHJpbmcpOiB7IGxhYmVsOiBzdHJpbmc7IGJvZHk6IHN0cmluZyB9IHtcbiAgY29uc3QgdHJpbW1lZCA9IHRleHQudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQpIHtcbiAgICByZXR1cm4geyBsYWJlbDogXCJcIiwgYm9keTogXCJcIiB9O1xuICB9XG5cbiAgbGV0IG1hdGNoOiBSZWdFeHBNYXRjaEFycmF5IHwgbnVsbCA9IG51bGw7XG5cbiAgLy8gMSkgUGFyZW50aGV0aWNhbCBzcGVsbC1zdHlsZSBsYWJlbCB1cCB0byBmaXJzdCBwZXJpb2RcbiAgLy8gRXhhbXBsZTogXCJSYXkgb2YgRnJvc3QgKElOVCAxNSkuIFRhcmdldCB0YWtlcy4uLlwiXG4gIG1hdGNoID0gdHJpbW1lZC5tYXRjaCgvXiguezEsMTAwfT9cXChbXildezEsNDB9XFwpXFwuKVxccyooLispJC8pO1xuICBpZiAobWF0Y2gpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbGFiZWw6IG1hdGNoWzFdLnRyaW0oKSxcbiAgICAgIGJvZHk6IG1hdGNoWzJdLnRyaW0oKVxuICAgIH07XG4gIH1cblxuICAvLyAyKSBTdGFuZGFyZCBzZW50ZW5jZSBsYWJlbFxuICAvLyBFeGFtcGxlOiBcIkRldm91ci4gVXNlIHR1cm4gdG8gZGV2b3VyLi4uXCJcbiAgbWF0Y2ggPSB0cmltbWVkLm1hdGNoKC9eKFteLiE/Ol17MSw4MH1bLiE/XSlcXHMqKC4rKSQvKTtcbiAgaWYgKG1hdGNoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGxhYmVsOiBtYXRjaFsxXS50cmltKCksXG4gICAgICBib2R5OiBtYXRjaFsyXS50cmltKClcbiAgICB9O1xuICB9XG5cbiAgLy8gMykgQ29sb24gbGFiZWxcbiAgLy8gRXhhbXBsZTogXCJEZXZvdXI6IFVzZSB0dXJuIHRvIGRldm91ci4uLlwiXG4gIG1hdGNoID0gdHJpbW1lZC5tYXRjaCgvXihbXjpdezEsODB9OilcXHMqKC4rKSQvKTtcbiAgaWYgKG1hdGNoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGxhYmVsOiBtYXRjaFsxXS50cmltKCksXG4gICAgICBib2R5OiBtYXRjaFsyXS50cmltKClcbiAgICB9O1xuICB9XG5cbiAgLy8gNCkgRGFzaCAvIGVtIGRhc2ggbGFiZWxcbiAgLy8gRXhhbXBsZTogXCJTdG9ybWJsb29kIC0gRWxlY3RyaWNpdHkgaW1tdW5lLlwiXG4gIC8vIEV4YW1wbGU6IFwiU3Rvcm1ibG9vZCBcdTIwMTQgRWxlY3RyaWNpdHkgaW1tdW5lLlwiXG4gIG1hdGNoID0gdHJpbW1lZC5tYXRjaCgvXiguezEsODB9P1xcc1stXHUyMDE0XSlcXHMqKC4rKSQvKTtcbiAgaWYgKG1hdGNoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGxhYmVsOiBtYXRjaFsxXS50cmltKCksXG4gICAgICBib2R5OiBtYXRjaFsyXS50cmltKClcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIHsgbGFiZWw6IFwiXCIsIGJvZHk6IHRyaW1tZWQgfTtcbn1cblxuZnVuY3Rpb24gYWRkU2VjdGlvbihcbiAgcGFyZW50OiBIVE1MRWxlbWVudCxcbiAgdGl0bGU6IHN0cmluZyxcbiAgaXRlbXM6IHN0cmluZ1tdLFxuICBjbGFzc05hbWU6IHN0cmluZ1xuKTogdm9pZCB7XG4gIGlmIChpdGVtcy5sZW5ndGggPT09IDApIHJldHVybjtcblxuICBjb25zdCBzZWN0aW9uID0gY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1zZWN0aW9uXCIpO1xuICBzZWN0aW9uLmFwcGVuZENoaWxkKGNyZWF0ZURpdihcInNkLW1vbnN0ZXItc2VjdGlvbi10aXRsZVwiLCB0aXRsZSkpO1xuXG4gIGNvbnN0IGxpc3QgPSBjcmVhdGVMaXN0KGNsYXNzTmFtZSk7XG5cbiAgZm9yIChjb25zdCBpdGVtIG9mIGl0ZW1zKSB7XG4gICAgY29uc3QgbGkgPSBjcmVhdGVMaXN0SXRlbSgpO1xuXG4gICAgY29uc3QgeyBsYWJlbCwgYm9keSB9ID0gc3BsaXRMYWJlbEFuZEJvZHkoaXRlbSk7XG5cbiAgICBpZiAobGFiZWwpIHtcbiAgICAgIGxpLmFwcGVuZENoaWxkKGNyZWF0ZVNwYW4oXCJzZC1tb25zdGVyLWFiaWxpdHktbGFiZWxcIiwgbGFiZWwpKTtcbiAgICB9XG5cbiAgICBpZiAoYm9keSkge1xuICAgICAgaWYgKGxhYmVsKSB7XG4gICAgICAgIGxpLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiIFwiKSk7XG4gICAgICB9XG4gICAgICBsaS5hcHBlbmRDaGlsZChjcmVhdGVTcGFuKFwic2QtbW9uc3Rlci1hYmlsaXR5LXRleHRcIiwgYm9keSkpO1xuICAgIH1cblxuICAgIGlmICghbGFiZWwpIHtcbiAgICAgIGxpLnRleHRDb250ZW50ID0gaXRlbTtcbiAgICB9XG5cbiAgICBsaXN0LmFwcGVuZENoaWxkKGxpKTtcbiAgfVxuXG4gIHNlY3Rpb24uYXBwZW5kQ2hpbGQobGlzdCk7XG4gIHBhcmVudC5hcHBlbmRDaGlsZChzZWN0aW9uKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlck1vbnN0ZXJCbG9jayhcbiAgY29udGFpbmVyOiBIVE1MRWxlbWVudCxcbiAgbW9uc3RlcjogU2hhZG93ZGFya01vbnN0ZXIsXG4gIHNldHRpbmdzOiBTaGFkb3dkYXJrU3RhdGJsb2Nrc1NldHRpbmdzLFxuICB3YXJuaW5nczogc3RyaW5nW10gPSBbXVxuKTogdm9pZCB7XG4gIGNvbnRhaW5lci5pbm5lckhUTUwgPSBcIlwiO1xuXG4gIGNvbnN0IGNhcmQgPSBjcmVhdGVEaXYoXG4gICAgW1xuICAgICAgXCJzZC1tb25zdGVyLWNhcmRcIixcbiAgICAgIHNldHRpbmdzLmNvbXBhY3RNb2RlID8gXCJpcy1jb21wYWN0XCIgOiBcIlwiXG4gICAgXVxuICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgLmpvaW4oXCIgXCIpXG4gICk7XG5cbiAgY29uc3QgaGVhZGVyID0gY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1oZWFkZXJcIik7XG4gIGhlYWRlci5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLW5hbWVcIiwgbW9uc3Rlci5uYW1lKSk7XG5cbiAgY29uc3QgbWV0YSA9IGNyZWF0ZURpdihcInNkLW1vbnN0ZXItbWV0YVwiKTtcbiAgY29uc3QgbWV0YVBhcnRzOiBIVE1MRWxlbWVudFtdID0gW107XG5cbiAgaWYgKG1vbnN0ZXIubGV2ZWwpIHtcbiAgICBtZXRhUGFydHMucHVzaChjcmVhdGVTcGFuKHVuZGVmaW5lZCwgYExldmVsICR7bW9uc3Rlci5sZXZlbH1gKSk7XG4gIH1cblxuICBpZiAobW9uc3Rlci5hbGlnbm1lbnQpIHtcbiAgICBjb25zdCBhbGlnbm1lbnRTcGFuID0gY3JlYXRlU3Bhbih1bmRlZmluZWQsIGBBTCAke21vbnN0ZXIuYWxpZ25tZW50fWApO1xuICAgIGNvbnN0IHRvb2x0aXAgPSBnZXRBbGlnbm1lbnRMYWJlbChtb25zdGVyLmFsaWdubWVudCk7XG4gICAgaWYgKHRvb2x0aXApIHtcbiAgICAgIGFsaWdubWVudFNwYW4udGl0bGUgPSB0b29sdGlwO1xuICAgIH1cbiAgICBtZXRhUGFydHMucHVzaChhbGlnbm1lbnRTcGFuKTtcbiAgfVxuXG4gIG1ldGFQYXJ0cy5mb3JFYWNoKChwYXJ0LCBpbmRleCkgPT4ge1xuICAgIG1ldGEuYXBwZW5kQ2hpbGQocGFydCk7XG5cbiAgICBpZiAoaW5kZXggPCBtZXRhUGFydHMubGVuZ3RoIC0gMSkge1xuICAgICAgbWV0YS5hcHBlbmRDaGlsZChjcmVhdGVTcGFuKHVuZGVmaW5lZCwgXCIgXHUyMDIyIFwiKSk7XG4gICAgfVxuICB9KTtcblxuICBoZWFkZXIuYXBwZW5kQ2hpbGQobWV0YSk7XG4gIGNhcmQuYXBwZW5kQ2hpbGQoaGVhZGVyKTtcblxuICBjb25zdCBjb3JlID0gY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1jb3JlXCIpO1xuICBjb3JlLmFwcGVuZENoaWxkKGNyZWF0ZURpdihcInNkLW1vbnN0ZXItY29yZS1pdGVtXCIsIGBBQyAke21vbnN0ZXIuYWN9YCkpO1xuICBjb3JlLmFwcGVuZENoaWxkKGNyZWF0ZURpdihcInNkLW1vbnN0ZXItY29yZS1pdGVtXCIsIGBIUCAke21vbnN0ZXIuaHB9YCkpO1xuXG4gIGlmIChtb25zdGVyLm12KSB7XG4gICAgY29yZS5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLWNvcmUtaXRlbVwiLCBgTVYgJHttb25zdGVyLm12fWApKTtcbiAgfVxuXG4gIGNhcmQuYXBwZW5kQ2hpbGQoY29yZSk7XG5cbiAgaWYgKG1vbnN0ZXIuYXRrLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBhdGtTZWN0aW9uID0gY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1zZWN0aW9uXCIpO1xuICAgIGF0a1NlY3Rpb24uYXBwZW5kQ2hpbGQoY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1zZWN0aW9uLXRpdGxlXCIsIFwiQVRUQUNLU1wiKSk7XG5cbiAgICBjb25zdCBhdGtMaXN0ID0gY3JlYXRlTGlzdChcInNkLW1vbnN0ZXItYXR0YWNrc1wiKTtcbiAgICBmb3IgKGNvbnN0IGF0dGFjayBvZiBtb25zdGVyLmF0aykge1xuICAgICAgY29uc3QgbGkgPSBjcmVhdGVMaXN0SXRlbShcInNkLW1vbnN0ZXItYXR0YWNrXCIpO1xuICAgICAgYXBwZW5kUmVuZGVyZWRBdHRhY2sobGksIHJlbmRlckF0dGFja1RleHQoYXR0YWNrKSk7XG4gICAgICBhdGtMaXN0LmFwcGVuZENoaWxkKGxpKTtcbiAgICB9XG5cbiAgICBhdGtTZWN0aW9uLmFwcGVuZENoaWxkKGF0a0xpc3QpO1xuICAgIGNhcmQuYXBwZW5kQ2hpbGQoYXRrU2VjdGlvbik7XG4gIH1cblxuICBjb25zdCBhYmlsaXRpZXMgPSBjcmVhdGVEaXYoXCJzZC1tb25zdGVyLXNlY3Rpb25cIik7XG4gIGFiaWxpdGllcy5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLXNlY3Rpb24tdGl0bGVcIiwgXCJBQklMSVRJRVNcIikpO1xuXG4gIGNvbnN0IGdyaWQgPSBjcmVhdGVEaXYoXCJzZC1tb25zdGVyLWFiaWxpdGllc1wiKTtcbiAgZ3JpZC5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLWFiaWxpdHlcIiwgYFNUUiAke21vbnN0ZXIuc3RhdHMuc3RyfWApKTtcbiAgZ3JpZC5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLWFiaWxpdHlcIiwgYERFWCAke21vbnN0ZXIuc3RhdHMuZGV4fWApKTtcbiAgZ3JpZC5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLWFiaWxpdHlcIiwgYENPTiAke21vbnN0ZXIuc3RhdHMuY29ufWApKTtcbiAgZ3JpZC5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLWFiaWxpdHlcIiwgYElOVCAke21vbnN0ZXIuc3RhdHMuaW50fWApKTtcbiAgZ3JpZC5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLWFiaWxpdHlcIiwgYFdJUyAke21vbnN0ZXIuc3RhdHMud2lzfWApKTtcbiAgZ3JpZC5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLWFiaWxpdHlcIiwgYENIQSAke21vbnN0ZXIuc3RhdHMuY2hhfWApKTtcblxuICBhYmlsaXRpZXMuYXBwZW5kQ2hpbGQoZ3JpZCk7XG4gIGNhcmQuYXBwZW5kQ2hpbGQoYWJpbGl0aWVzKTtcblxuICBhZGRTZWN0aW9uKGNhcmQsIFwiVFJBSVRTXCIsIG1vbnN0ZXIudHJhaXRzLCBcInNkLW1vbnN0ZXItbGlzdFwiKTtcbiAgYWRkU2VjdGlvbihjYXJkLCBcIlNQRUNJQUxTXCIsIG1vbnN0ZXIuc3BlY2lhbHMsIFwic2QtbW9uc3Rlci1saXN0XCIpO1xuICBhZGRTZWN0aW9uKGNhcmQsIFwiU1BFTExTXCIsIG1vbnN0ZXIuc3BlbGxzLCBcInNkLW1vbnN0ZXItbGlzdFwiKTtcbiAgYWRkU2VjdGlvbihjYXJkLCBcIkdFQVJcIiwgbW9uc3Rlci5nZWFyLCBcInNkLW1vbnN0ZXItbGlzdFwiKTtcblxuICBpZiAobW9uc3Rlci5kZXNjcmlwdGlvbikge1xuICAgIGNvbnN0IGRlc2MgPSBjcmVhdGVEaXYoXCJzZC1tb25zdGVyLXNlY3Rpb25cIik7XG4gICAgZGVzYy5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLWRlc2NyaXB0aW9uXCIsIG1vbnN0ZXIuZGVzY3JpcHRpb24pKTtcbiAgICBjYXJkLmFwcGVuZENoaWxkKGRlc2MpO1xuICB9XG5cbiAgaWYgKHNldHRpbmdzLnNob3dTb3VyY2UgJiYgbW9uc3Rlci5zb3VyY2UpIHtcbiAgICBjb25zdCBzb3VyY2UgPSBjcmVhdGVEaXYoXCJzZC1tb25zdGVyLWZvb3RlclwiKTtcbiAgICBzb3VyY2UuYXBwZW5kQ2hpbGQoY3JlYXRlU3BhbihcInNkLW1vbnN0ZXItc291cmNlXCIsIGBTb3VyY2U6ICR7bW9uc3Rlci5zb3VyY2V9YCkpO1xuICAgIGNhcmQuYXBwZW5kQ2hpbGQoc291cmNlKTtcbiAgfVxuXG4gIGlmIChzZXR0aW5ncy5zaG93VGFncyAmJiBtb25zdGVyLnRhZ3MubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IHRhZ3MgPSBjcmVhdGVEaXYoXCJzZC1tb25zdGVyLXRhZ3NcIik7XG4gICAgZm9yIChjb25zdCB0YWcgb2YgbW9uc3Rlci50YWdzKSB7XG4gICAgICB0YWdzLmFwcGVuZENoaWxkKGNyZWF0ZVNwYW4oXCJzZC1tb25zdGVyLXRhZ1wiLCB0YWcpKTtcbiAgICB9XG4gICAgY2FyZC5hcHBlbmRDaGlsZCh0YWdzKTtcbiAgfVxuXG4gIGlmICh3YXJuaW5ncy5sZW5ndGggPiAwKSB7XG4gICAgY29uc3Qgd2FybmluZ0JveCA9IGNyZWF0ZURpdihcInNkLW1vbnN0ZXItd2FybmluZy1ib3hcIik7XG4gICAgZm9yIChjb25zdCB3YXJuaW5nIG9mIHdhcm5pbmdzKSB7XG4gICAgICB3YXJuaW5nQm94LmFwcGVuZENoaWxkKGNyZWF0ZURpdihcInNkLW1vbnN0ZXItd2FybmluZ1wiLCB3YXJuaW5nKSk7XG4gICAgfVxuICAgIGNhcmQuYXBwZW5kQ2hpbGQod2FybmluZ0JveCk7XG4gIH1cblxuICBjb250YWluZXIuYXBwZW5kQ2hpbGQoY2FyZCk7XG59IiwgImV4cG9ydCBmdW5jdGlvbiBidWlsZE1vbnN0ZXJUZW1wbGF0ZShuYW1lID0gXCJOZXcgTW9uc3RlclwiKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAtLS1cbnNoYWRvd2RhcmtUeXBlOiBtb25zdGVyXG5uYW1lOiAke25hbWV9XG5sZXZlbDogMVxuYWxpZ25tZW50OiBOXG50eXBlOiBIdW1hbm9pZFxuYWM6IDEwXG5ocDogNFxubXY6IG5lYXJcbmF0azpcbiAgLSBDbHViICswICgxZDQpXG5zdHI6ICswXG5kZXg6ICswXG5jb246ICswXG5pbnQ6ICswXG53aXM6ICswXG5jaGE6ICswXG50cmFpdHM6XG4gIC0gRXhhbXBsZSB0cmFpdFxuc3BlY2lhbHM6IFtdXG5zcGVsbHM6IFtdXG5nZWFyOiBbXVxuZGVzY3JpcHRpb246IEFkZCBhIHNob3J0IGRlc2NyaXB0aW9uIGhlcmUuXG5zb3VyY2U6IEhvbWVicmV3XG50YWdzOlxuICAtIHNoYWRvd2Rhcmtcbi0tLVxuXG4jIyBOb3Rlc1xuXG4jIyBUYWN0aWNzXG5cbiMjIEVuY291bnRlciBJZGVhc1xuYDtcbn0iLCAiaW1wb3J0IHsgU2hhZG93ZGFya01vbnN0ZXIgfSBmcm9tIFwiLi4vdHlwZXNcIjtcblxuZnVuY3Rpb24geWFtbFN0cmluZyh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKCF2YWx1ZSkgcmV0dXJuICdcIlwiJztcblxuICBpZiAoL1s6W1xcXXt9IywmKiF8PidcIiVAYF0vLnRlc3QodmFsdWUpIHx8IHZhbHVlLmluY2x1ZGVzKCdcIicpKSB7XG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHZhbHVlKTtcbiAgfVxuXG4gIHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24geWFtbExpc3QoaXRlbXM6IHN0cmluZ1tdLCBpbmRlbnQgPSAwKTogc3RyaW5nIHtcbiAgY29uc3QgcGFkID0gXCIgXCIucmVwZWF0KGluZGVudCk7XG5cbiAgaWYgKGl0ZW1zLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBgJHtwYWR9W11gO1xuICB9XG5cbiAgcmV0dXJuIGl0ZW1zLm1hcCgoaXRlbSkgPT4gYCR7cGFkfS0gJHt5YW1sU3RyaW5nKGl0ZW0pfWApLmpvaW4oXCJcXG5cIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZE1vbnN0ZXJGcm9udG1hdHRlcihtb25zdGVyOiBTaGFkb3dkYXJrTW9uc3Rlcik6IHN0cmluZyB7XG4gIHJldHVybiBgLS0tXG5zaGFkb3dkYXJrVHlwZTogbW9uc3RlclxubmFtZTogJHt5YW1sU3RyaW5nKG1vbnN0ZXIubmFtZSl9XG5sZXZlbDogJHt5YW1sU3RyaW5nKG1vbnN0ZXIubGV2ZWwpfVxuYWxpZ25tZW50OiAke3lhbWxTdHJpbmcobW9uc3Rlci5hbGlnbm1lbnQpfVxudHlwZTogJHt5YW1sU3RyaW5nKG1vbnN0ZXIudHlwZSl9XG5hYzogJHt5YW1sU3RyaW5nKG1vbnN0ZXIuYWMpfVxuaHA6ICR7eWFtbFN0cmluZyhtb25zdGVyLmhwKX1cbm12OiAke3lhbWxTdHJpbmcobW9uc3Rlci5tdil9XG5hdGs6XG4ke3lhbWxMaXN0KG1vbnN0ZXIuYXRrLm1hcCgoYSkgPT4gYS5yYXcgfHwgYS5uYW1lKSwgMil9XG5zdHI6ICR7eWFtbFN0cmluZyhtb25zdGVyLnN0YXRzLnN0cil9XG5kZXg6ICR7eWFtbFN0cmluZyhtb25zdGVyLnN0YXRzLmRleCl9XG5jb246ICR7eWFtbFN0cmluZyhtb25zdGVyLnN0YXRzLmNvbil9XG5pbnQ6ICR7eWFtbFN0cmluZyhtb25zdGVyLnN0YXRzLmludCl9XG53aXM6ICR7eWFtbFN0cmluZyhtb25zdGVyLnN0YXRzLndpcyl9XG5jaGE6ICR7eWFtbFN0cmluZyhtb25zdGVyLnN0YXRzLmNoYSl9XG50cmFpdHM6XG4ke3lhbWxMaXN0KG1vbnN0ZXIudHJhaXRzLCAyKX1cbnNwZWNpYWxzOlxuJHt5YW1sTGlzdChtb25zdGVyLnNwZWNpYWxzLCAyKX1cbnNwZWxsczpcbiR7eWFtbExpc3QobW9uc3Rlci5zcGVsbHMsIDIpfVxuZ2VhcjpcbiR7eWFtbExpc3QobW9uc3Rlci5nZWFyLCAyKX1cbmRlc2NyaXB0aW9uOiAke3lhbWxTdHJpbmcobW9uc3Rlci5kZXNjcmlwdGlvbil9XG5zb3VyY2U6ICR7eWFtbFN0cmluZyhtb25zdGVyLnNvdXJjZSl9XG50YWdzOlxuJHt5YW1sTGlzdChtb25zdGVyLnRhZ3MsIDIpfVxuLS0tYDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkTW9uc3Rlck5vdGVDb250ZW50KFxuICBtb25zdGVyOiBTaGFkb3dkYXJrTW9uc3RlcixcbiAgYm9keT86IHN0cmluZ1xuKTogc3RyaW5nIHtcbiAgY29uc3QgZnJvbnRtYXR0ZXIgPSBidWlsZE1vbnN0ZXJGcm9udG1hdHRlcihtb25zdGVyKTtcblxuICBpZiAoYm9keSAmJiBib2R5LnRyaW0oKSkge1xuICAgIHJldHVybiBgJHtmcm9udG1hdHRlcn1cXG5cXG4ke2JvZHkucmVwbGFjZSgvXlxccysvLCBcIlwiKX1cXG5gO1xuICB9XG5cbiAgcmV0dXJuIGAke2Zyb250bWF0dGVyfVxuXG4jIyBOb3Rlc1xuXG4jIyBUYWN0aWNzXG5cbiMjIEVuY291bnRlciBJZGVhc1xuYDtcbn0iLCAiaW1wb3J0IHsgQXBwLCBQbHVnaW5TZXR0aW5nVGFiLCBTZXR0aW5nIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgU2hhZG93ZGFya1N0YXRibG9ja3NQbHVnaW4gZnJvbSBcIi4vbWFpblwiO1xuXG5leHBvcnQgY2xhc3MgU2hhZG93ZGFya1N0YXRibG9ja3NTZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XG4gIHBsdWdpbjogU2hhZG93ZGFya1N0YXRibG9ja3NQbHVnaW47XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHBsdWdpbjogU2hhZG93ZGFya1N0YXRibG9ja3NQbHVnaW4pIHtcbiAgICBzdXBlcihhcHAsIHBsdWdpbik7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gIH1cblxuICBkaXNwbGF5KCk6IHZvaWQge1xuICBjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xuICBjb250YWluZXJFbC5lbXB0eSgpO1xuXG4gIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgIC5zZXROYW1lKFwiU2hhZG93ZGFyayBzdGF0YmxvY2tzIHNldHRpbmdzXCIpXG4gICAgLnNldEhlYWRpbmcoKTtcblxuICAvLyA9PT09PSBESVNQTEFZIFNFQ1RJT04gPT09PT1cbiAgXG4gIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgIC5zZXROYW1lKFwiRGlzcGxheVwiKVxuICAgIC5zZXRIZWFkaW5nKCk7XG5cbiAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgLnNldE5hbWUoXCJDb21wYWN0IHN0YXRibG9jayBtb2RlXCIpXG4gICAgLnNldERlc2MoXCJSZW5kZXIgbW9uc3RlciBzdGF0YmxvY2tzIHdpdGggdGlnaHRlciBzcGFjaW5nLlwiKVxuICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgIHRvZ2dsZVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuY29tcGFjdE1vZGUpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb21wYWN0TW9kZSA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVQbHVnaW5TZXR0aW5ncygpO1xuICAgICAgICAgIHZvaWQgdGhpcy5wbHVnaW4ucmVmcmVzaE1vbnN0ZXJWaWV3KCk7XG4gICAgICAgIH0pXG4gICAgKTtcblxuICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAuc2V0TmFtZShcIlNob3cgc291cmNlXCIpXG4gICAgLnNldERlc2MoXCJEaXNwbGF5IHRoZSBzb3VyY2UgZmllbGQgaW4gcmVuZGVyZWQgc3RhdGJsb2Nrcy5cIilcbiAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XG4gICAgICB0b2dnbGVcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dTb3VyY2UpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93U291cmNlID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVBsdWdpblNldHRpbmdzKCk7XG4gICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5yZWZyZXNoTW9uc3RlclZpZXcoKTtcbiAgICAgICAgfSlcbiAgICApO1xuXG4gIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgIC5zZXROYW1lKFwiU2hvdyB0YWdzXCIpXG4gICAgLnNldERlc2MoXCJEaXNwbGF5IHRhZyBwaWxscyBpbiByZW5kZXJlZCBzdGF0YmxvY2tzLlwiKVxuICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgIHRvZ2dsZVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd1RhZ3MpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93VGFncyA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVQbHVnaW5TZXR0aW5ncygpO1xuICAgICAgICAgIHZvaWQgdGhpcy5wbHVnaW4ucmVmcmVzaE1vbnN0ZXJWaWV3KCk7XG4gICAgICAgIH0pXG4gICAgKTtcblxuICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAuc2V0TmFtZShcIlJlbmRlciBmcm9udG1hdHRlciBtb25zdGVyc1wiKVxuICAgIC5zZXREZXNjKFwiUmVuZGVyIHN0YXRibG9ja3MgZnJvbSBtb25zdGVyIG5vdGUgZnJvbnRtYXR0ZXIgaW4gcmVhZGluZyB2aWV3LlwiKVxuICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgIHRvZ2dsZVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MucmVuZGVyRnJvbnRtYXR0ZXJNb25zdGVycylcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnJlbmRlckZyb250bWF0dGVyTW9uc3RlcnMgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlUGx1Z2luU2V0dGluZ3MoKTtcbiAgICAgICAgICB2b2lkIHRoaXMucGx1Z2luLnJlZnJlc2hNb25zdGVyVmlldygpO1xuICAgICAgICB9KVxuICAgICk7XG5cbiAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgLnNldE5hbWUoXCJIaWRlIG1vbnN0ZXIgcHJvcGVydGllc1wiKVxuICAgIC5zZXREZXNjKFwiSGlkZSBPYnNpZGlhbidzIG5hdGl2ZSBwcm9wZXJ0aWVzIHNlY3Rpb24gaW4gcmVhZGluZyB2aWV3IGZvciBtb25zdGVyIG5vdGVzLlwiKVxuICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgIHRvZ2dsZVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuaGlkZU1vbnN0ZXJQcm9wZXJ0aWVzKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaGlkZU1vbnN0ZXJQcm9wZXJ0aWVzID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVBsdWdpblNldHRpbmdzKCk7XG4gICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5yZWZyZXNoTW9uc3RlclZpZXcoKTtcbiAgICAgICAgfSlcbiAgICApO1xuXG4gIC8vID09PT09IEZJTEVTIFNFQ1RJT04gPT09PT1cbiAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgLnNldE5hbWUoXCJGaWxlc1wiKVxuICAgIC5zZXRIZWFkaW5nKCk7XG5cbiAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgLnNldE5hbWUoXCJNb25zdGVyIGZvbGRlclwiKVxuICAgIC5zZXREZXNjKFwiRm9sZGVyIHVzZWQgd2hlbiBjcmVhdGluZyBuZXcgbW9uc3RlciBub3Rlcy5cIilcbiAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgIHRleHRcbiAgICAgICAgLnNldFBsYWNlaG9sZGVyKFwiU2hhZG93ZGFyay9Nb25zdGVyc1wiKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MubW9uc3RlckZvbGRlcilcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm1vbnN0ZXJGb2xkZXIgPVxuICAgICAgICAgICAgdmFsdWUudHJpbSgpIHx8IFwiU2hhZG93ZGFyay9Nb25zdGVyc1wiO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVQbHVnaW5TZXR0aW5ncygpO1xuICAgICAgICB9KVxuICAgICk7XG4gIH1cbn0iLCAiaW1wb3J0IHtcbiAgQXBwLFxuICBEcm9wZG93bkNvbXBvbmVudCxcbiAgTW9kYWwsXG4gIE5vdGljZSxcbiAgU2V0dGluZyxcbiAgVGV4dEFyZWFDb21wb25lbnQsXG4gIFRleHRDb21wb25lbnRcbn0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBTaGFkb3dkYXJrTW9uc3RlciB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgcmVuZGVyTW9uc3RlckJsb2NrIH0gZnJvbSBcIi4uL3JlbmRlci9yZW5kZXJNb25zdGVyQmxvY2tcIjtcbmltcG9ydCB7IERFRkFVTFRfU0VUVElOR1MgfSBmcm9tIFwiLi4vc2V0dGluZ3NcIjtcbmltcG9ydCB7IGZpeE1vbnN0ZXJDb21tb25Jc3N1ZXMgfSBmcm9tIFwiLi4vdXRpbHMvZml4TW9uc3RlckNvbW1vbklzc3Vlc1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIEltcG9ydFByZXZpZXdNb2RhbE9wdGlvbnMge1xuICBtb25zdGVyOiBTaGFkb3dkYXJrTW9uc3RlcjtcbiAgd2FybmluZ3M6IHN0cmluZ1tdO1xuICBvbkNvbmZpcm06IChtb25zdGVyOiBTaGFkb3dkYXJrTW9uc3RlcikgPT4gUHJvbWlzZTx2b2lkPjtcbiAgb25Ta2lwPzogKCkgPT4gdm9pZDtcbiAgbW9kZT86IFwiaW1wb3J0XCIgfCBcImVkaXRcIjtcbiAgcHJvZ3Jlc3NMYWJlbD86IHN0cmluZztcbiAgc3VnZ2VzdGVkVGFncz86IHN0cmluZ1tdO1xuICBzdWdnZXN0ZWRPdGhlclNvdXJjZXM/OiBzdHJpbmdbXTtcbn1cblxuY29uc3QgU09VUkNFX09QVElPTlMgPSBbXG4gIFwiQ29yZSBSdWxlc1wiLFxuICBcIkN1cnNlZCBTY3JvbGwgMVwiLFxuICBcIkN1cnNlZCBTY3JvbGwgMlwiLFxuICBcIkN1cnNlZCBTY3JvbGwgM1wiLFxuICBcIkhvbWVicmV3XCIsXG4gIFwiT3RoZXJcIlxuXSBhcyBjb25zdDtcblxuZnVuY3Rpb24gZ2V0TmF2QWN0aW9uKFxuICBldnQ6IEtleWJvYXJkRXZlbnRcbik6IFwibmV4dFwiIHwgXCJwcmV2XCIgfCBcImVudGVyXCIgfCBcImVzY2FwZVwiIHwgbnVsbCB7XG4gIGNvbnN0IGtleSA9IGV2dC5rZXk7XG4gIGNvbnN0IGNvZGUgPSBldnQuY29kZTtcblxuICBpZiAoXG4gICAga2V5ID09PSBcIkFycm93RG93blwiIHx8XG4gICAga2V5ID09PSBcIkRvd25cIiB8fFxuICAgIGNvZGUgPT09IFwiQXJyb3dEb3duXCIgfHxcbiAgICBrZXkgPT09IFwiQXJyb3dSaWdodFwiIHx8XG4gICAga2V5ID09PSBcIlJpZ2h0XCIgfHxcbiAgICBjb2RlID09PSBcIkFycm93UmlnaHRcIlxuICApIHtcbiAgICByZXR1cm4gXCJuZXh0XCI7XG4gIH1cblxuICBpZiAoXG4gICAga2V5ID09PSBcIkFycm93VXBcIiB8fFxuICAgIGtleSA9PT0gXCJVcFwiIHx8XG4gICAgY29kZSA9PT0gXCJBcnJvd1VwXCIgfHxcbiAgICBrZXkgPT09IFwiQXJyb3dMZWZ0XCIgfHxcbiAgICBrZXkgPT09IFwiTGVmdFwiIHx8XG4gICAgY29kZSA9PT0gXCJBcnJvd0xlZnRcIlxuICApIHtcbiAgICByZXR1cm4gXCJwcmV2XCI7XG4gIH1cblxuICBpZiAoa2V5ID09PSBcIkVudGVyXCIgfHwgY29kZSA9PT0gXCJFbnRlclwiIHx8IGNvZGUgPT09IFwiTnVtcGFkRW50ZXJcIikge1xuICAgIHJldHVybiBcImVudGVyXCI7XG4gIH1cblxuICBpZiAoa2V5ID09PSBcIkVzY2FwZVwiIHx8IGtleSA9PT0gXCJFc2NcIiB8fCBjb2RlID09PSBcIkVzY2FwZVwiKSB7XG4gICAgcmV0dXJuIFwiZXNjYXBlXCI7XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gc3RvcEtleUV2ZW50KGV2dDogS2V5Ym9hcmRFdmVudCk6IHZvaWQge1xuICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgZXZ0LnN0b3BQcm9wYWdhdGlvbigpO1xuICBpZiAoXCJzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb25cIiBpbiBldnQpIHtcbiAgICBldnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplTGluZXModmFsdWU6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgcmV0dXJuIHZhbHVlXG4gICAgLnNwbGl0KC9cXHI/XFxuLylcbiAgICAubWFwKChsaW5lKSA9PiBsaW5lLnRyaW0oKSlcbiAgICAuZmlsdGVyKEJvb2xlYW4pO1xufVxuXG5mdW5jdGlvbiBqb2luQXR0YWNrTGluZXMobW9uc3RlcjogU2hhZG93ZGFya01vbnN0ZXIpOiBzdHJpbmcge1xuICByZXR1cm4gbW9uc3Rlci5hdGsubWFwKChhKSA9PiBhLnJhdyB8fCBhLm5hbWUpLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHNwbGl0VGFncyh2YWx1ZTogc3RyaW5nKTogc3RyaW5nW10ge1xuICByZXR1cm4gdmFsdWVcbiAgICAuc3BsaXQoXCIsXCIpXG4gICAgLm1hcCgodGFnKSA9PiB0YWcudHJpbSgpKVxuICAgIC5maWx0ZXIoQm9vbGVhbik7XG59XG5cbmZ1bmN0aW9uIGpvaW5UYWdzKHRhZ3M6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRhZ3Muam9pbihcIiwgXCIpO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVTb3VyY2VGb3JEcm9wZG93bihzb3VyY2U6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSBzb3VyY2UudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQpIHJldHVybiBcIkNvcmUgUnVsZXNcIjtcblxuICByZXR1cm4gU09VUkNFX09QVElPTlMuaW5jbHVkZXModHJpbW1lZCBhcyAodHlwZW9mIFNPVVJDRV9PUFRJT05TKVtudW1iZXJdKVxuICAgID8gdHJpbW1lZFxuICAgIDogXCJPdGhlclwiO1xufVxuXG5mdW5jdGlvbiBnZXRDdXJyZW50VGFnRnJhZ21lbnQocmF3VmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHBhcnRzID0gcmF3VmFsdWUuc3BsaXQoXCIsXCIpO1xuICByZXR1cm4gKHBhcnRzW3BhcnRzLmxlbmd0aCAtIDFdID8/IFwiXCIpLnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xufVxuXG5mdW5jdGlvbiByZXBsYWNlQ3VycmVudFRhZ0ZyYWdtZW50KHJhd1ZhbHVlOiBzdHJpbmcsIHNlbGVjdGVkVGFnOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBwYXJ0cyA9IHJhd1ZhbHVlLnNwbGl0KFwiLFwiKTtcbiAgY29uc3QgY29tbWl0dGVkID0gcGFydHNcbiAgICAuc2xpY2UoMCwgLTEpXG4gICAgLm1hcCgocGFydCkgPT4gcGFydC50cmltKCkpXG4gICAgLmZpbHRlcihCb29sZWFuKTtcblxuICByZXR1cm4gY29tbWl0dGVkLmxlbmd0aCA+IDBcbiAgICA/IGAke2NvbW1pdHRlZC5qb2luKFwiLCBcIil9LCAke3NlbGVjdGVkVGFnfWBcbiAgICA6IHNlbGVjdGVkVGFnO1xufVxuXG5mdW5jdGlvbiBnZXRDdXJyZW50U291cmNlRnJhZ21lbnQodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB2YWx1ZS50cmltKCkudG9Mb3dlckNhc2UoKTtcbn1cblxuZXhwb3J0IGNsYXNzIEltcG9ydFByZXZpZXdNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSBtb25zdGVyOiBTaGFkb3dkYXJrTW9uc3RlcjtcbiAgcHJpdmF0ZSB3YXJuaW5nczogc3RyaW5nW107XG4gIHByaXZhdGUgb25Db25maXJtQ2FsbGJhY2s6IChtb25zdGVyOiBTaGFkb3dkYXJrTW9uc3RlcikgPT4gUHJvbWlzZTx2b2lkPjtcbiAgcHJpdmF0ZSBwcmV2aWV3RWwhOiBIVE1MRGl2RWxlbWVudDtcbiAgcHJpdmF0ZSBtb2RlOiBcImltcG9ydFwiIHwgXCJlZGl0XCI7XG4gIHByaXZhdGUgc3VnZ2VzdGVkVGFnczogc3RyaW5nW107XG4gIHByaXZhdGUgc3VnZ2VzdGVkT3RoZXJTb3VyY2VzOiBzdHJpbmdbXTtcblxuICBwcml2YXRlIG5hbWVJbnB1dCE6IFRleHRDb21wb25lbnQ7XG4gIHByaXZhdGUgZGVzY3JpcHRpb25JbnB1dCE6IFRleHRBcmVhQ29tcG9uZW50O1xuICBwcml2YXRlIHNvdXJjZURyb3Bkb3duITogRHJvcGRvd25Db21wb25lbnQ7XG4gIHByaXZhdGUgb3RoZXJTb3VyY2VJbnB1dCE6IFRleHRDb21wb25lbnQ7XG4gIHByaXZhdGUgdGFnc0lucHV0ITogVGV4dENvbXBvbmVudDtcblxuICBwcml2YXRlIGxldmVsSW5wdXQhOiBUZXh0Q29tcG9uZW50O1xuICBwcml2YXRlIGFsaWdubWVudElucHV0ITogVGV4dENvbXBvbmVudDtcbiAgcHJpdmF0ZSBhY0lucHV0ITogVGV4dENvbXBvbmVudDtcbiAgcHJpdmF0ZSBocElucHV0ITogVGV4dENvbXBvbmVudDtcbiAgcHJpdmF0ZSBtdklucHV0ITogVGV4dENvbXBvbmVudDtcblxuICBwcml2YXRlIHN0cklucHV0ITogVGV4dENvbXBvbmVudDtcbiAgcHJpdmF0ZSBkZXhJbnB1dCE6IFRleHRDb21wb25lbnQ7XG4gIHByaXZhdGUgY29uSW5wdXQhOiBUZXh0Q29tcG9uZW50O1xuICBwcml2YXRlIGludElucHV0ITogVGV4dENvbXBvbmVudDtcbiAgcHJpdmF0ZSB3aXNJbnB1dCE6IFRleHRDb21wb25lbnQ7XG4gIHByaXZhdGUgY2hhSW5wdXQhOiBUZXh0Q29tcG9uZW50O1xuXG4gIHByaXZhdGUgYXR0YWNrc0lucHV0ITogVGV4dEFyZWFDb21wb25lbnQ7XG4gIHByaXZhdGUgdHJhaXRzSW5wdXQhOiBUZXh0QXJlYUNvbXBvbmVudDtcbiAgcHJpdmF0ZSBzcGVsbHNJbnB1dCE6IFRleHRBcmVhQ29tcG9uZW50O1xuICBwcml2YXRlIHNwZWNpYWxzSW5wdXQhOiBUZXh0QXJlYUNvbXBvbmVudDtcbiAgcHJpdmF0ZSBnZWFySW5wdXQhOiBUZXh0QXJlYUNvbXBvbmVudDtcblxuICBwcml2YXRlIG90aGVyU291cmNlU2V0dGluZ0VsITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgdGFnU3VnZ2VzdGlvbnNFbCE6IEhUTUxEaXZFbGVtZW50O1xuICBwcml2YXRlIG90aGVyU291cmNlU3VnZ2VzdGlvbnNFbCE6IEhUTUxEaXZFbGVtZW50O1xuXG4gIHByaXZhdGUgZmlsdGVyZWRUYWdTdWdnZXN0aW9uczogc3RyaW5nW10gPSBbXTtcbiAgcHJpdmF0ZSBoaWdobGlnaHRlZFRhZ1N1Z2dlc3Rpb25JbmRleCA9IC0xO1xuXG4gIHByaXZhdGUgZmlsdGVyZWRPdGhlclNvdXJjZVN1Z2dlc3Rpb25zOiBzdHJpbmdbXSA9IFtdO1xuICBwcml2YXRlIGhpZ2hsaWdodGVkT3RoZXJTb3VyY2VTdWdnZXN0aW9uSW5kZXggPSAtMTtcblxuICBwcml2YXRlIG9uU2tpcENhbGxiYWNrPzogKCkgPT4gdm9pZDtcblxuICBwcml2YXRlIHByb2dyZXNzTGFiZWw/OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIG9wdGlvbnM6IEltcG9ydFByZXZpZXdNb2RhbE9wdGlvbnMpIHtcbiAgICBzdXBlcihhcHApO1xuICAgIHRoaXMubW9uc3RlciA9IHN0cnVjdHVyZWRDbG9uZShvcHRpb25zLm1vbnN0ZXIpO1xuICAgIHRoaXMud2FybmluZ3MgPSBvcHRpb25zLndhcm5pbmdzO1xuICAgIHRoaXMub25Db25maXJtQ2FsbGJhY2sgPSBvcHRpb25zLm9uQ29uZmlybTtcbiAgICB0aGlzLm9uU2tpcENhbGxiYWNrID0gb3B0aW9ucy5vblNraXA7XG4gICAgdGhpcy5tb2RlID0gb3B0aW9ucy5tb2RlID8/IFwiaW1wb3J0XCI7XG4gICAgdGhpcy5wcm9ncmVzc0xhYmVsID0gb3B0aW9ucy5wcm9ncmVzc0xhYmVsO1xuICAgIHRoaXMuc3VnZ2VzdGVkVGFncyA9IFsuLi4ob3B0aW9ucy5zdWdnZXN0ZWRUYWdzID8/IFtdKV0uc29ydCgoYSwgYikgPT5cbiAgICAgIGEubG9jYWxlQ29tcGFyZShiKVxuICAgICk7XG4gICAgdGhpcy5zdWdnZXN0ZWRPdGhlclNvdXJjZXMgPSBbLi4uKG9wdGlvbnMuc3VnZ2VzdGVkT3RoZXJTb3VyY2VzID8/IFtdKV0uc29ydCgoYSwgYikgPT5cbiAgICAgIGEubG9jYWxlQ29tcGFyZShiKVxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGdldE1hdGNoaW5nVGFnU3VnZ2VzdGlvbnMocmF3VmFsdWU/OiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgdmFsdWUgPSByYXdWYWx1ZSA/PyB0aGlzLnRhZ3NJbnB1dD8uZ2V0VmFsdWUoKSA/PyBcIlwiO1xuICAgIGNvbnN0IGZyYWdtZW50ID0gZ2V0Q3VycmVudFRhZ0ZyYWdtZW50KHZhbHVlKTtcbiAgICBjb25zdCBjdXJyZW50VGFncyA9IG5ldyBTZXQoc3BsaXRUYWdzKHZhbHVlKS5tYXAoKHRhZykgPT4gdGFnLnRvTG93ZXJDYXNlKCkpKTtcblxuICAgIGlmICghZnJhZ21lbnQpIHJldHVybiBbXTtcblxuICAgIHJldHVybiB0aGlzLnN1Z2dlc3RlZFRhZ3NcbiAgICAgIC5maWx0ZXIoKHRhZykgPT4gIWN1cnJlbnRUYWdzLmhhcyh0YWcudG9Mb3dlckNhc2UoKSkpXG4gICAgICAuZmlsdGVyKCh0YWcpID0+IHRhZy50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKGZyYWdtZW50KSlcbiAgICAgIC5zbGljZSgwLCA4KTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0TWF0Y2hpbmdPdGhlclNvdXJjZVN1Z2dlc3Rpb25zKHJhd1ZhbHVlPzogc3RyaW5nKTogc3RyaW5nW10ge1xuICAgIGlmICh0aGlzLnNvdXJjZURyb3Bkb3duPy5nZXRWYWx1ZSgpICE9PSBcIk90aGVyXCIpIHJldHVybiBbXTtcblxuICAgIGNvbnN0IHZhbHVlID0gKHJhd1ZhbHVlID8/IHRoaXMub3RoZXJTb3VyY2VJbnB1dD8uZ2V0VmFsdWUoKSA/PyBcIlwiKS50cmltKCk7XG4gICAgY29uc3QgZnJhZ21lbnQgPSBnZXRDdXJyZW50U291cmNlRnJhZ21lbnQodmFsdWUpO1xuXG4gICAgaWYgKCFmcmFnbWVudCkgcmV0dXJuIFtdO1xuXG4gICAgcmV0dXJuIHRoaXMuc3VnZ2VzdGVkT3RoZXJTb3VyY2VzXG4gICAgICAuZmlsdGVyKChzb3VyY2UpID0+IHNvdXJjZS50b0xvd2VyQ2FzZSgpICE9PSB2YWx1ZS50b0xvd2VyQ2FzZSgpKVxuICAgICAgLmZpbHRlcigoc291cmNlKSA9PiBzb3VyY2UudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhmcmFnbWVudCkpXG4gICAgICAuc2xpY2UoMCwgOCk7XG4gIH1cblxuICBwcml2YXRlIHJlZnJlc2hQcmV2aWV3KCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5wcmV2aWV3RWwpIHJldHVybjtcblxuICAgIHJlbmRlck1vbnN0ZXJCbG9jayhcbiAgICAgIHRoaXMucHJldmlld0VsLFxuICAgICAgdGhpcy5tb25zdGVyLFxuICAgICAge1xuICAgICAgICAuLi5ERUZBVUxUX1NFVFRJTkdTLFxuICAgICAgICBjb21wYWN0TW9kZTogZmFsc2UsXG4gICAgICAgIHNob3dTb3VyY2U6IHRydWUsXG4gICAgICAgIHNob3dUYWdzOiB0cnVlXG4gICAgICB9LFxuICAgICAgdGhpcy53YXJuaW5nc1xuICAgICk7XG4gIH1cblxuICBwcml2YXRlIHJlZnJlc2hTb3VyY2VWaXNpYmlsaXR5KCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5vdGhlclNvdXJjZVNldHRpbmdFbCkgcmV0dXJuO1xuXG4gICAgY29uc3QgZHJvcGRvd25WYWx1ZSA9IHRoaXMuc291cmNlRHJvcGRvd24/LmdldFZhbHVlKCkgPz8gXCJDb3JlIFJ1bGVzXCI7XG4gICAgY29uc3QgdmlzaWJsZSA9IGRyb3Bkb3duVmFsdWUgPT09IFwiT3RoZXJcIjtcblxuICAgIHRoaXMub3RoZXJTb3VyY2VTZXR0aW5nRWwuc3R5bGUuZGlzcGxheSA9IHZpc2libGUgPyBcIlwiIDogXCJub25lXCI7XG5cbiAgICBpZiAodGhpcy5vdGhlclNvdXJjZVN1Z2dlc3Rpb25zRWwpIHtcbiAgICAgIHRoaXMub3RoZXJTb3VyY2VTdWdnZXN0aW9uc0VsLnN0eWxlLmRpc3BsYXkgPSB2aXNpYmxlID8gXCJcIiA6IFwibm9uZVwiO1xuICAgIH1cblxuICAgIHRoaXMucmVmcmVzaE90aGVyU291cmNlU3VnZ2VzdGlvbnMoKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVmcmVzaFRhZ1N1Z2dlc3Rpb25zKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy50YWdTdWdnZXN0aW9uc0VsIHx8ICF0aGlzLnRhZ3NJbnB1dCkgcmV0dXJuO1xuXG4gICAgdGhpcy50YWdTdWdnZXN0aW9uc0VsLmlubmVySFRNTCA9IFwiXCI7XG5cbiAgICBjb25zdCByYXdWYWx1ZSA9IHRoaXMudGFnc0lucHV0LmdldFZhbHVlKCk7XG4gICAgdGhpcy5maWx0ZXJlZFRhZ1N1Z2dlc3Rpb25zID0gdGhpcy5nZXRNYXRjaGluZ1RhZ1N1Z2dlc3Rpb25zKHJhd1ZhbHVlKTtcblxuICAgIGlmICh0aGlzLmZpbHRlcmVkVGFnU3VnZ2VzdGlvbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLmhpZ2hsaWdodGVkVGFnU3VnZ2VzdGlvbkluZGV4ID0gLTE7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaGlnaGxpZ2h0ZWRUYWdTdWdnZXN0aW9uSW5kZXggPCAwKSB7XG4gICAgICB0aGlzLmhpZ2hsaWdodGVkVGFnU3VnZ2VzdGlvbkluZGV4ID0gMDtcbiAgICB9IGVsc2UgaWYgKHRoaXMuaGlnaGxpZ2h0ZWRUYWdTdWdnZXN0aW9uSW5kZXggPj0gdGhpcy5maWx0ZXJlZFRhZ1N1Z2dlc3Rpb25zLmxlbmd0aCkge1xuICAgICAgdGhpcy5oaWdobGlnaHRlZFRhZ1N1Z2dlc3Rpb25JbmRleCA9IHRoaXMuZmlsdGVyZWRUYWdTdWdnZXN0aW9ucy5sZW5ndGggLSAxO1xuICAgIH1cblxuICAgIGNvbnN0IGxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBsYWJlbC5jbGFzc05hbWUgPSBcInNkLXRhZy1zdWdnZXN0aW9ucy1sYWJlbFwiO1xuICAgIGxhYmVsLnRleHRDb250ZW50ID0gXCJNYXRjaGluZyB0YWdzXCI7XG4gICAgdGhpcy50YWdTdWdnZXN0aW9uc0VsLmFwcGVuZENoaWxkKGxhYmVsKTtcblxuICAgIGNvbnN0IGNoaXBzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBjaGlwcy5jbGFzc05hbWUgPSBcInNkLXRhZy1zdWdnZXN0aW9ucy1jaGlwc1wiO1xuXG4gICAgdGhpcy5maWx0ZXJlZFRhZ1N1Z2dlc3Rpb25zLmZvckVhY2goKHRhZywgaW5kZXgpID0+IHtcbiAgICAgIGNvbnN0IGNoaXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICAgICAgY2hpcC50eXBlID0gXCJidXR0b25cIjtcbiAgICAgIGNoaXAuY2xhc3NOYW1lID0gXCJzZC10YWctc3VnZ2VzdGlvbi1jaGlwXCI7XG5cbiAgICAgIGlmIChpbmRleCA9PT0gdGhpcy5oaWdobGlnaHRlZFRhZ1N1Z2dlc3Rpb25JbmRleCkge1xuICAgICAgICBjaGlwLmNsYXNzTGlzdC5hZGQoXCJpcy1hY3RpdmVcIik7XG4gICAgICB9XG5cbiAgICAgIGNoaXAudGV4dENvbnRlbnQgPSB0YWc7XG4gICAgICBjaGlwLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHVwZGF0ZWRWYWx1ZSA9IHJlcGxhY2VDdXJyZW50VGFnRnJhZ21lbnQocmF3VmFsdWUsIHRhZyk7XG4gICAgICAgIHRoaXMubW9uc3Rlci50YWdzID0gc3BsaXRUYWdzKHVwZGF0ZWRWYWx1ZSk7XG4gICAgICAgIHRoaXMudGFnc0lucHV0LnNldFZhbHVlKGpvaW5UYWdzKHRoaXMubW9uc3Rlci50YWdzKSk7XG4gICAgICAgIHRoaXMuaGlnaGxpZ2h0ZWRUYWdTdWdnZXN0aW9uSW5kZXggPSAtMTtcbiAgICAgICAgdGhpcy5yZWZyZXNoVGFnU3VnZ2VzdGlvbnMoKTtcbiAgICAgICAgdGhpcy5yZWZyZXNoUHJldmlldygpO1xuICAgICAgfSk7XG5cbiAgICAgIGNoaXBzLmFwcGVuZENoaWxkKGNoaXApO1xuICAgIH0pO1xuXG4gICAgdGhpcy50YWdTdWdnZXN0aW9uc0VsLmFwcGVuZENoaWxkKGNoaXBzKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVmcmVzaE90aGVyU291cmNlU3VnZ2VzdGlvbnMoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLm90aGVyU291cmNlU3VnZ2VzdGlvbnNFbCB8fCAhdGhpcy5vdGhlclNvdXJjZUlucHV0KSByZXR1cm47XG5cbiAgICB0aGlzLm90aGVyU291cmNlU3VnZ2VzdGlvbnNFbC5pbm5lckhUTUwgPSBcIlwiO1xuXG4gICAgaWYgKHRoaXMuc291cmNlRHJvcGRvd24/LmdldFZhbHVlKCkgIT09IFwiT3RoZXJcIikge1xuICAgICAgdGhpcy5maWx0ZXJlZE90aGVyU291cmNlU3VnZ2VzdGlvbnMgPSBbXTtcbiAgICAgIHRoaXMuaGlnaGxpZ2h0ZWRPdGhlclNvdXJjZVN1Z2dlc3Rpb25JbmRleCA9IC0xO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHJhd1ZhbHVlID0gdGhpcy5vdGhlclNvdXJjZUlucHV0LmdldFZhbHVlKCkudHJpbSgpO1xuICAgIHRoaXMuZmlsdGVyZWRPdGhlclNvdXJjZVN1Z2dlc3Rpb25zID0gdGhpcy5nZXRNYXRjaGluZ090aGVyU291cmNlU3VnZ2VzdGlvbnMocmF3VmFsdWUpO1xuXG4gICAgaWYgKHRoaXMuZmlsdGVyZWRPdGhlclNvdXJjZVN1Z2dlc3Rpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhpcy5oaWdobGlnaHRlZE90aGVyU291cmNlU3VnZ2VzdGlvbkluZGV4ID0gLTE7XG5cbiAgICAgIGNvbnN0IGVtcHR5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgIGVtcHR5LmNsYXNzTmFtZSA9IFwic2QtdGFnLXN1Z2dlc3Rpb25zLWVtcHR5XCI7XG4gICAgICBlbXB0eS50ZXh0Q29udGVudCA9IFwiTm8gbWF0Y2hpbmcgc291cmNlc1wiO1xuICAgICAgdGhpcy5vdGhlclNvdXJjZVN1Z2dlc3Rpb25zRWwuYXBwZW5kQ2hpbGQoZW1wdHkpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhpZ2hsaWdodGVkT3RoZXJTb3VyY2VTdWdnZXN0aW9uSW5kZXggPCAwKSB7XG4gICAgICB0aGlzLmhpZ2hsaWdodGVkT3RoZXJTb3VyY2VTdWdnZXN0aW9uSW5kZXggPSAwO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICB0aGlzLmhpZ2hsaWdodGVkT3RoZXJTb3VyY2VTdWdnZXN0aW9uSW5kZXggPj1cbiAgICAgIHRoaXMuZmlsdGVyZWRPdGhlclNvdXJjZVN1Z2dlc3Rpb25zLmxlbmd0aFxuICAgICkge1xuICAgICAgdGhpcy5oaWdobGlnaHRlZE90aGVyU291cmNlU3VnZ2VzdGlvbkluZGV4ID1cbiAgICAgICAgdGhpcy5maWx0ZXJlZE90aGVyU291cmNlU3VnZ2VzdGlvbnMubGVuZ3RoIC0gMTtcbiAgICB9XG5cbiAgICBjb25zdCBsYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgbGFiZWwuY2xhc3NOYW1lID0gXCJzZC10YWctc3VnZ2VzdGlvbnMtbGFiZWxcIjtcbiAgICBsYWJlbC50ZXh0Q29udGVudCA9IFwiTWF0Y2hpbmcgc291cmNlc1wiO1xuICAgIHRoaXMub3RoZXJTb3VyY2VTdWdnZXN0aW9uc0VsLmFwcGVuZENoaWxkKGxhYmVsKTtcblxuICAgIGNvbnN0IGNoaXBzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBjaGlwcy5jbGFzc05hbWUgPSBcInNkLXRhZy1zdWdnZXN0aW9ucy1jaGlwc1wiO1xuXG4gICAgdGhpcy5maWx0ZXJlZE90aGVyU291cmNlU3VnZ2VzdGlvbnMuZm9yRWFjaCgoc291cmNlLCBpbmRleCkgPT4ge1xuICAgICAgY29uc3QgY2hpcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgICBjaGlwLnR5cGUgPSBcImJ1dHRvblwiO1xuICAgICAgY2hpcC5jbGFzc05hbWUgPSBcInNkLXRhZy1zdWdnZXN0aW9uLWNoaXBcIjtcblxuICAgICAgaWYgKGluZGV4ID09PSB0aGlzLmhpZ2hsaWdodGVkT3RoZXJTb3VyY2VTdWdnZXN0aW9uSW5kZXgpIHtcbiAgICAgICAgY2hpcC5jbGFzc0xpc3QuYWRkKFwiaXMtYWN0aXZlXCIpO1xuICAgICAgfVxuXG4gICAgICBjaGlwLnRleHRDb250ZW50ID0gc291cmNlO1xuICAgICAgY2hpcC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICB0aGlzLm1vbnN0ZXIuc291cmNlID0gc291cmNlO1xuICAgICAgICB0aGlzLm90aGVyU291cmNlSW5wdXQuc2V0VmFsdWUoc291cmNlKTtcbiAgICAgICAgdGhpcy5oaWdobGlnaHRlZE90aGVyU291cmNlU3VnZ2VzdGlvbkluZGV4ID0gLTE7XG4gICAgICAgIHRoaXMucmVmcmVzaE90aGVyU291cmNlU3VnZ2VzdGlvbnMoKTtcbiAgICAgICAgdGhpcy5yZWZyZXNoUHJldmlldygpO1xuICAgICAgfSk7XG5cbiAgICAgIGNoaXBzLmFwcGVuZENoaWxkKGNoaXApO1xuICAgIH0pO1xuXG4gICAgdGhpcy5vdGhlclNvdXJjZVN1Z2dlc3Rpb25zRWwuYXBwZW5kQ2hpbGQoY2hpcHMpO1xuICB9XG5cbiAgcHJpdmF0ZSBtb3ZlVGFnU3VnZ2VzdGlvblNlbGVjdGlvbihkaXJlY3Rpb246IDEgfCAtMSk6IHZvaWQge1xuICAgIGlmICh0aGlzLmZpbHRlcmVkVGFnU3VnZ2VzdGlvbnMubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgICBpZiAodGhpcy5oaWdobGlnaHRlZFRhZ1N1Z2dlc3Rpb25JbmRleCA8IDApIHtcbiAgICAgIHRoaXMuaGlnaGxpZ2h0ZWRUYWdTdWdnZXN0aW9uSW5kZXggPVxuICAgICAgICBkaXJlY3Rpb24gPT09IDEgPyAwIDogdGhpcy5maWx0ZXJlZFRhZ1N1Z2dlc3Rpb25zLmxlbmd0aCAtIDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuaGlnaGxpZ2h0ZWRUYWdTdWdnZXN0aW9uSW5kZXggPVxuICAgICAgICAodGhpcy5oaWdobGlnaHRlZFRhZ1N1Z2dlc3Rpb25JbmRleCArIGRpcmVjdGlvbiArIHRoaXMuZmlsdGVyZWRUYWdTdWdnZXN0aW9ucy5sZW5ndGgpICVcbiAgICAgICAgdGhpcy5maWx0ZXJlZFRhZ1N1Z2dlc3Rpb25zLmxlbmd0aDtcbiAgICB9XG5cbiAgICB0aGlzLnJlZnJlc2hUYWdTdWdnZXN0aW9ucygpO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseUhpZ2hsaWdodGVkVGFnU3VnZ2VzdGlvbigpOiB2b2lkIHtcbiAgICBpZiAoXG4gICAgICB0aGlzLmhpZ2hsaWdodGVkVGFnU3VnZ2VzdGlvbkluZGV4IDwgMCB8fFxuICAgICAgdGhpcy5oaWdobGlnaHRlZFRhZ1N1Z2dlc3Rpb25JbmRleCA+PSB0aGlzLmZpbHRlcmVkVGFnU3VnZ2VzdGlvbnMubGVuZ3RoIHx8XG4gICAgICAhdGhpcy50YWdzSW5wdXRcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzZWxlY3RlZFRhZyA9IHRoaXMuZmlsdGVyZWRUYWdTdWdnZXN0aW9uc1t0aGlzLmhpZ2hsaWdodGVkVGFnU3VnZ2VzdGlvbkluZGV4XTtcbiAgICBjb25zdCByYXdWYWx1ZSA9IHRoaXMudGFnc0lucHV0LmdldFZhbHVlKCk7XG4gICAgY29uc3QgdXBkYXRlZFZhbHVlID0gcmVwbGFjZUN1cnJlbnRUYWdGcmFnbWVudChyYXdWYWx1ZSwgc2VsZWN0ZWRUYWcpO1xuXG4gICAgdGhpcy5tb25zdGVyLnRhZ3MgPSBzcGxpdFRhZ3ModXBkYXRlZFZhbHVlKTtcbiAgICB0aGlzLnRhZ3NJbnB1dC5zZXRWYWx1ZShqb2luVGFncyh0aGlzLm1vbnN0ZXIudGFncykpO1xuICAgIHRoaXMuaGlnaGxpZ2h0ZWRUYWdTdWdnZXN0aW9uSW5kZXggPSAtMTtcbiAgICB0aGlzLnJlZnJlc2hUYWdTdWdnZXN0aW9ucygpO1xuICAgIHRoaXMucmVmcmVzaFByZXZpZXcoKTtcbiAgfVxuXG4gIHByaXZhdGUgY2xlYXJUYWdTdWdnZXN0aW9uU2VsZWN0aW9uKCk6IHZvaWQge1xuICAgIHRoaXMuaGlnaGxpZ2h0ZWRUYWdTdWdnZXN0aW9uSW5kZXggPSAtMTtcbiAgICB0aGlzLmZpbHRlcmVkVGFnU3VnZ2VzdGlvbnMgPSBbXTtcbiAgICB0aGlzLnJlZnJlc2hUYWdTdWdnZXN0aW9ucygpO1xuICB9XG5cbiAgcHJpdmF0ZSBtb3ZlT3RoZXJTb3VyY2VTdWdnZXN0aW9uU2VsZWN0aW9uKGRpcmVjdGlvbjogMSB8IC0xKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuZmlsdGVyZWRPdGhlclNvdXJjZVN1Z2dlc3Rpb25zLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuXG4gICAgaWYgKHRoaXMuaGlnaGxpZ2h0ZWRPdGhlclNvdXJjZVN1Z2dlc3Rpb25JbmRleCA8IDApIHtcbiAgICAgIHRoaXMuaGlnaGxpZ2h0ZWRPdGhlclNvdXJjZVN1Z2dlc3Rpb25JbmRleCA9XG4gICAgICAgIGRpcmVjdGlvbiA9PT0gMSA/IDAgOiB0aGlzLmZpbHRlcmVkT3RoZXJTb3VyY2VTdWdnZXN0aW9ucy5sZW5ndGggLSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmhpZ2hsaWdodGVkT3RoZXJTb3VyY2VTdWdnZXN0aW9uSW5kZXggPVxuICAgICAgICAodGhpcy5oaWdobGlnaHRlZE90aGVyU291cmNlU3VnZ2VzdGlvbkluZGV4ICtcbiAgICAgICAgICBkaXJlY3Rpb24gK1xuICAgICAgICAgIHRoaXMuZmlsdGVyZWRPdGhlclNvdXJjZVN1Z2dlc3Rpb25zLmxlbmd0aCkgJVxuICAgICAgICB0aGlzLmZpbHRlcmVkT3RoZXJTb3VyY2VTdWdnZXN0aW9ucy5sZW5ndGg7XG4gICAgfVxuXG4gICAgdGhpcy5yZWZyZXNoT3RoZXJTb3VyY2VTdWdnZXN0aW9ucygpO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseUhpZ2hsaWdodGVkT3RoZXJTb3VyY2VTdWdnZXN0aW9uKCk6IHZvaWQge1xuICAgIGlmIChcbiAgICAgIHRoaXMuaGlnaGxpZ2h0ZWRPdGhlclNvdXJjZVN1Z2dlc3Rpb25JbmRleCA8IDAgfHxcbiAgICAgIHRoaXMuaGlnaGxpZ2h0ZWRPdGhlclNvdXJjZVN1Z2dlc3Rpb25JbmRleCA+PVxuICAgICAgICB0aGlzLmZpbHRlcmVkT3RoZXJTb3VyY2VTdWdnZXN0aW9ucy5sZW5ndGggfHxcbiAgICAgICF0aGlzLm90aGVyU291cmNlSW5wdXRcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzZWxlY3RlZFNvdXJjZSA9XG4gICAgICB0aGlzLmZpbHRlcmVkT3RoZXJTb3VyY2VTdWdnZXN0aW9uc1t0aGlzLmhpZ2hsaWdodGVkT3RoZXJTb3VyY2VTdWdnZXN0aW9uSW5kZXhdO1xuXG4gICAgdGhpcy5tb25zdGVyLnNvdXJjZSA9IHNlbGVjdGVkU291cmNlO1xuICAgIHRoaXMub3RoZXJTb3VyY2VJbnB1dC5zZXRWYWx1ZShzZWxlY3RlZFNvdXJjZSk7XG4gICAgdGhpcy5oaWdobGlnaHRlZE90aGVyU291cmNlU3VnZ2VzdGlvbkluZGV4ID0gLTE7XG4gICAgdGhpcy5yZWZyZXNoT3RoZXJTb3VyY2VTdWdnZXN0aW9ucygpO1xuICAgIHRoaXMucmVmcmVzaFByZXZpZXcoKTtcbiAgfVxuXG4gIHByaXZhdGUgY2xlYXJPdGhlclNvdXJjZVN1Z2dlc3Rpb25TZWxlY3Rpb24oKTogdm9pZCB7XG4gICAgdGhpcy5oaWdobGlnaHRlZE90aGVyU291cmNlU3VnZ2VzdGlvbkluZGV4ID0gLTE7XG4gICAgdGhpcy5maWx0ZXJlZE90aGVyU291cmNlU3VnZ2VzdGlvbnMgPSBbXTtcbiAgICB0aGlzLnJlZnJlc2hPdGhlclNvdXJjZVN1Z2dlc3Rpb25zKCk7XG4gIH1cblxuICBwcml2YXRlIHJlZnJlc2hGb3JtRmllbGRzKCk6IHZvaWQge1xuICAgIHRoaXMubmFtZUlucHV0Py5zZXRWYWx1ZSh0aGlzLm1vbnN0ZXIubmFtZSk7XG4gICAgdGhpcy5kZXNjcmlwdGlvbklucHV0Py5zZXRWYWx1ZSh0aGlzLm1vbnN0ZXIuZGVzY3JpcHRpb24pO1xuXG4gICAgY29uc3QgZHJvcGRvd25WYWx1ZSA9IG5vcm1hbGl6ZVNvdXJjZUZvckRyb3Bkb3duKHRoaXMubW9uc3Rlci5zb3VyY2UpO1xuICAgIHRoaXMuc291cmNlRHJvcGRvd24/LnNldFZhbHVlKGRyb3Bkb3duVmFsdWUpO1xuXG4gICAgaWYgKGRyb3Bkb3duVmFsdWUgPT09IFwiT3RoZXJcIikge1xuICAgICAgdGhpcy5vdGhlclNvdXJjZUlucHV0Py5zZXRWYWx1ZSh0aGlzLm1vbnN0ZXIuc291cmNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5vdGhlclNvdXJjZUlucHV0Py5zZXRWYWx1ZShcIlwiKTtcbiAgICB9XG5cbiAgICB0aGlzLnRhZ3NJbnB1dD8uc2V0VmFsdWUoam9pblRhZ3ModGhpcy5tb25zdGVyLnRhZ3MpKTtcblxuICAgIHRoaXMubGV2ZWxJbnB1dD8uc2V0VmFsdWUodGhpcy5tb25zdGVyLmxldmVsKTtcbiAgICB0aGlzLmFsaWdubWVudElucHV0Py5zZXRWYWx1ZSh0aGlzLm1vbnN0ZXIuYWxpZ25tZW50KTtcbiAgICB0aGlzLmFjSW5wdXQ/LnNldFZhbHVlKHRoaXMubW9uc3Rlci5hYyk7XG4gICAgdGhpcy5ocElucHV0Py5zZXRWYWx1ZSh0aGlzLm1vbnN0ZXIuaHApO1xuICAgIHRoaXMubXZJbnB1dD8uc2V0VmFsdWUodGhpcy5tb25zdGVyLm12KTtcblxuICAgIHRoaXMuc3RySW5wdXQ/LnNldFZhbHVlKHRoaXMubW9uc3Rlci5zdGF0cy5zdHIpO1xuICAgIHRoaXMuZGV4SW5wdXQ/LnNldFZhbHVlKHRoaXMubW9uc3Rlci5zdGF0cy5kZXgpO1xuICAgIHRoaXMuY29uSW5wdXQ/LnNldFZhbHVlKHRoaXMubW9uc3Rlci5zdGF0cy5jb24pO1xuICAgIHRoaXMuaW50SW5wdXQ/LnNldFZhbHVlKHRoaXMubW9uc3Rlci5zdGF0cy5pbnQpO1xuICAgIHRoaXMud2lzSW5wdXQ/LnNldFZhbHVlKHRoaXMubW9uc3Rlci5zdGF0cy53aXMpO1xuICAgIHRoaXMuY2hhSW5wdXQ/LnNldFZhbHVlKHRoaXMubW9uc3Rlci5zdGF0cy5jaGEpO1xuXG4gICAgdGhpcy5hdHRhY2tzSW5wdXQ/LnNldFZhbHVlKGpvaW5BdHRhY2tMaW5lcyh0aGlzLm1vbnN0ZXIpKTtcbiAgICB0aGlzLnRyYWl0c0lucHV0Py5zZXRWYWx1ZSh0aGlzLm1vbnN0ZXIudHJhaXRzLmpvaW4oXCJcXG5cIikpO1xuICAgIHRoaXMuc3BlbGxzSW5wdXQ/LnNldFZhbHVlKHRoaXMubW9uc3Rlci5zcGVsbHMuam9pbihcIlxcblwiKSk7XG4gICAgdGhpcy5zcGVjaWFsc0lucHV0Py5zZXRWYWx1ZSh0aGlzLm1vbnN0ZXIuc3BlY2lhbHMuam9pbihcIlxcblwiKSk7XG4gICAgdGhpcy5nZWFySW5wdXQ/LnNldFZhbHVlKHRoaXMubW9uc3Rlci5nZWFyLmpvaW4oXCJcXG5cIikpO1xuXG4gICAgdGhpcy5yZWZyZXNoU291cmNlVmlzaWJpbGl0eSgpO1xuICAgIHRoaXMucmVmcmVzaFRhZ1N1Z2dlc3Rpb25zKCk7XG4gICAgdGhpcy5yZWZyZXNoT3RoZXJTb3VyY2VTdWdnZXN0aW9ucygpO1xuICB9XG5cbiAgcHJpdmF0ZSBmaXhDb21tb25Jc3N1ZXMoKTogdm9pZCB7XG4gICAgdGhpcy5tb25zdGVyID0gZml4TW9uc3RlckNvbW1vbklzc3Vlcyh0aGlzLm1vbnN0ZXIpO1xuICAgIHRoaXMucmVmcmVzaEZvcm1GaWVsZHMoKTtcbiAgICB0aGlzLnJlZnJlc2hQcmV2aWV3KCk7XG4gICAgbmV3IE5vdGljZShcIkNvbW1vbiBpc3N1ZXMgY2xlYW5lZCB1cC5cIik7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250ZW50RWwsIHRpdGxlRWwgfSA9IHRoaXM7XG5cbiAgICB0aXRsZUVsLnNldFRleHQoXG4gICAgICB0aGlzLm1vZGUgPT09IFwiZWRpdFwiXG4gICAgICAgID8gXCJFZGl0IFNoYWRvd2RhcmsgbW9uc3RlclwiXG4gICAgICAgIDogXCJJbXBvcnQgU2hhZG93ZGFyayBtb25zdGVyXCJcbiAgICApO1xuXG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgY29udGVudEVsLmFkZENsYXNzKFwic2QtaW1wb3J0LXByZXZpZXctbW9kYWxcIik7XG5cbiAgICB0aGlzLm1vZGFsRWwuYWRkQ2xhc3MoXCJzZC1pbXBvcnQtcHJldmlldy1tb2RhbC1zaGVsbFwiKTtcblxuICAgIGNvbnN0IGludHJvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInBcIik7XG4gICAgaW50cm8uY2xhc3NOYW1lID0gXCJzZC1pbXBvcnQtcHJldmlldy1kZXNjcmlwdGlvblwiO1xuICAgIGludHJvLnRleHRDb250ZW50ID1cbiAgICAgIHRoaXMubW9kZSA9PT0gXCJlZGl0XCJcbiAgICAgICAgPyBcIlJldmlldyBhbmQgZWRpdCB0aGUgbW9uc3RlciwgdGhlbiB1cGRhdGUgdGhlIG5vdGUuXCJcbiAgICAgICAgOiBcIlJldmlldyBhbmQgZWRpdCB0aGUgaW1wb3J0ZWQgbW9uc3RlciBiZWZvcmUgY3JlYXRpbmcgdGhlIG5vdGUuXCI7XG4gICAgY29udGVudEVsLmFwcGVuZENoaWxkKGludHJvKTtcbiAgICBpZiAodGhpcy5wcm9ncmVzc0xhYmVsKSB7XG4gICAgICBjb25zdCBwcm9ncmVzc0VsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgIHByb2dyZXNzRWwuY2xhc3NOYW1lID0gXCJzZC1pbXBvcnQtcHJldmlldy1wcm9ncmVzc1wiO1xuICAgICAgcHJvZ3Jlc3NFbC50ZXh0Q29udGVudCA9IHRoaXMucHJvZ3Jlc3NMYWJlbDtcbiAgICAgIGNvbnRlbnRFbC5hcHBlbmRDaGlsZChwcm9ncmVzc0VsKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy53YXJuaW5ncy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB3YXJuaW5nQm94ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgIHdhcm5pbmdCb3guY2xhc3NOYW1lID0gXCJzZC1pbXBvcnQtcHJldmlldy13YXJuaW5nc1wiO1xuXG4gICAgICBjb25zdCB3YXJuaW5nVGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaDRcIik7XG4gICAgICB3YXJuaW5nVGl0bGUudGV4dENvbnRlbnQgPSBcIldhcm5pbmdzXCI7XG4gICAgICB3YXJuaW5nQm94LmFwcGVuZENoaWxkKHdhcm5pbmdUaXRsZSk7XG5cbiAgICAgIGNvbnN0IHdhcm5pbmdMaXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInVsXCIpO1xuICAgICAgZm9yIChjb25zdCB3YXJuaW5nIG9mIHRoaXMud2FybmluZ3MpIHtcbiAgICAgICAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XG4gICAgICAgIGxpLnRleHRDb250ZW50ID0gd2FybmluZztcbiAgICAgICAgd2FybmluZ0xpc3QuYXBwZW5kQ2hpbGQobGkpO1xuICAgICAgfVxuXG4gICAgICB3YXJuaW5nQm94LmFwcGVuZENoaWxkKHdhcm5pbmdMaXN0KTtcbiAgICAgIGNvbnRlbnRFbC5hcHBlbmRDaGlsZCh3YXJuaW5nQm94KTtcbiAgICB9XG5cbiAgICBjb25zdCBsYXlvdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIGxheW91dC5jbGFzc05hbWUgPSBcInNkLWltcG9ydC1wcmV2aWV3LWxheW91dFwiO1xuICAgIGNvbnRlbnRFbC5hcHBlbmRDaGlsZChsYXlvdXQpO1xuXG4gICAgY29uc3QgZm9ybUNvbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgZm9ybUNvbC5jbGFzc05hbWUgPSBcInNkLWltcG9ydC1wcmV2aWV3LWZvcm1cIjtcbiAgICBsYXlvdXQuYXBwZW5kQ2hpbGQoZm9ybUNvbCk7XG5cbiAgICBjb25zdCBwcmV2aWV3Q29sID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBwcmV2aWV3Q29sLmNsYXNzTmFtZSA9IFwic2QtaW1wb3J0LXByZXZpZXctcGFuZWxcIjtcbiAgICBsYXlvdXQuYXBwZW5kQ2hpbGQocHJldmlld0NvbCk7XG5cbiAgICBjb25zdCBwcmV2aWV3SGVhZGluZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJoM1wiKTtcbiAgICBwcmV2aWV3SGVhZGluZy50ZXh0Q29udGVudCA9IFwiTGl2ZSBwcmV2aWV3XCI7XG4gICAgcHJldmlld0NvbC5hcHBlbmRDaGlsZChwcmV2aWV3SGVhZGluZyk7XG5cbiAgICB0aGlzLnByZXZpZXdFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgdGhpcy5wcmV2aWV3RWwuY2xhc3NOYW1lID0gXCJzZC1pbXBvcnQtcHJldmlldy1zdGF0YmxvY2tcIjtcbiAgICBwcmV2aWV3Q29sLmFwcGVuZENoaWxkKHRoaXMucHJldmlld0VsKTtcblxuICAgIGZvcm1Db2wuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiQ29yZVwiIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoZm9ybUNvbClcbiAgICAgIC5zZXROYW1lKFwiTmFtZVwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgdGhpcy5uYW1lSW5wdXQgPSB0ZXh0O1xuICAgICAgICB0ZXh0XG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMubW9uc3Rlci5uYW1lKVxuICAgICAgICAgIC5vbkNoYW5nZSgodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMubW9uc3Rlci5uYW1lID0gdmFsdWUudHJpbSgpO1xuICAgICAgICAgICAgdGhpcy5yZWZyZXNoUHJldmlldygpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhmb3JtQ29sKVxuICAgICAgLnNldE5hbWUoXCJEZXNjcmlwdGlvblwiKVxuICAgICAgLmFkZFRleHRBcmVhKCh0ZXh0KSA9PiB7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb25JbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHRcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5tb25zdGVyLmRlc2NyaXB0aW9uKVxuICAgICAgICAgIC5vbkNoYW5nZSgodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMubW9uc3Rlci5kZXNjcmlwdGlvbiA9IHZhbHVlLnRyaW0oKTtcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaFByZXZpZXcoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgdGV4dC5pbnB1dEVsLnJvd3MgPSA0O1xuICAgICAgICB0ZXh0LmlucHV0RWwuYWRkQ2xhc3MoXCJzZC1pbXBvcnQtcHJldmlldy10ZXh0YXJlYVwiKTtcbiAgICAgIH0pO1xuXG4gICAgZm9ybUNvbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJNZXRhZGF0YVwiIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoZm9ybUNvbClcbiAgICAgIC5zZXROYW1lKFwiU291cmNlXCIpXG4gICAgICAuc2V0RGVzYyhcIkNob29zZSBhIHNvdXJjZSBmb3IgdGhpcyBtb25zdGVyXCIpXG4gICAgICAuYWRkRHJvcGRvd24oKGRyb3Bkb3duKSA9PiB7XG4gICAgICAgIHRoaXMuc291cmNlRHJvcGRvd24gPSBkcm9wZG93bjtcblxuICAgICAgICBTT1VSQ0VfT1BUSU9OUy5mb3JFYWNoKChvcHRpb246IHN0cmluZykgPT4ge1xuICAgICAgICAgIGRyb3Bkb3duLmFkZE9wdGlvbihvcHRpb24sIG9wdGlvbik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGRyb3Bkb3duXG4gICAgICAgICAgLnNldFZhbHVlKG5vcm1hbGl6ZVNvdXJjZUZvckRyb3Bkb3duKHRoaXMubW9uc3Rlci5zb3VyY2UpKVxuICAgICAgICAgIC5vbkNoYW5nZSgodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gXCJPdGhlclwiKSB7XG4gICAgICAgICAgICAgIHRoaXMubW9uc3Rlci5zb3VyY2UgPSB0aGlzLm90aGVyU291cmNlSW5wdXQ/LmdldFZhbHVlKCkudHJpbSgpIHx8IFwiXCI7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aGlzLm1vbnN0ZXIuc291cmNlID0gdmFsdWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuaGlnaGxpZ2h0ZWRPdGhlclNvdXJjZVN1Z2dlc3Rpb25JbmRleCA9IC0xO1xuICAgICAgICAgICAgdGhpcy5yZWZyZXNoU291cmNlVmlzaWJpbGl0eSgpO1xuICAgICAgICAgICAgdGhpcy5yZWZyZXNoUHJldmlldygpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBjb25zdCBvdGhlclNvdXJjZVNldHRpbmcgPSBuZXcgU2V0dGluZyhmb3JtQ29sKVxuICAgICAgLnNldE5hbWUoXCJPdGhlciBTb3VyY2VcIilcbiAgICAgIC5zZXREZXNjKFwiVHlwZSBhIGN1c3RvbSBzb3VyY2UgbmFtZVwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgdGhpcy5vdGhlclNvdXJjZUlucHV0ID0gdGV4dDtcbiAgICAgICAgdGV4dFxuICAgICAgICAgIC5zZXRWYWx1ZShcbiAgICAgICAgICAgIG5vcm1hbGl6ZVNvdXJjZUZvckRyb3Bkb3duKHRoaXMubW9uc3Rlci5zb3VyY2UpID09PSBcIk90aGVyXCJcbiAgICAgICAgICAgICAgPyB0aGlzLm1vbnN0ZXIuc291cmNlXG4gICAgICAgICAgICAgIDogXCJcIlxuICAgICAgICAgIClcbiAgICAgICAgICAub25DaGFuZ2UoKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5zb3VyY2VEcm9wZG93bj8uZ2V0VmFsdWUoKSA9PT0gXCJPdGhlclwiKSB7XG4gICAgICAgICAgICAgIHRoaXMubW9uc3Rlci5zb3VyY2UgPSB2YWx1ZS50cmltKCk7XG4gICAgICAgICAgICAgIHRoaXMuaGlnaGxpZ2h0ZWRPdGhlclNvdXJjZVN1Z2dlc3Rpb25JbmRleCA9IC0xO1xuICAgICAgICAgICAgICB0aGlzLnJlZnJlc2hPdGhlclNvdXJjZVN1Z2dlc3Rpb25zKCk7XG4gICAgICAgICAgICAgIHRoaXMucmVmcmVzaFByZXZpZXcoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcblxuICAgICAgICB0ZXh0LmlucHV0RWwub25rZXlkb3duID0gKGV2dDogS2V5Ym9hcmRFdmVudCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGFjdGlvbiA9IGdldE5hdkFjdGlvbihldnQpO1xuICAgICAgICAgIHRoaXMuZmlsdGVyZWRPdGhlclNvdXJjZVN1Z2dlc3Rpb25zID1cbiAgICAgICAgICAgIHRoaXMuZ2V0TWF0Y2hpbmdPdGhlclNvdXJjZVN1Z2dlc3Rpb25zKHRleHQuZ2V0VmFsdWUoKSk7XG4gICAgICAgICAgY29uc3QgaGFzU3VnZ2VzdGlvbnMgPSB0aGlzLmZpbHRlcmVkT3RoZXJTb3VyY2VTdWdnZXN0aW9ucy5sZW5ndGggPiAwO1xuXG4gICAgICAgICAgaWYgKCFhY3Rpb24gfHwgIWhhc1N1Z2dlc3Rpb25zKSByZXR1cm47XG5cbiAgICAgICAgICBpZiAoYWN0aW9uID09PSBcIm5leHRcIikge1xuICAgICAgICAgICAgc3RvcEtleUV2ZW50KGV2dCk7XG4gICAgICAgICAgICB0aGlzLm1vdmVPdGhlclNvdXJjZVN1Z2dlc3Rpb25TZWxlY3Rpb24oMSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGFjdGlvbiA9PT0gXCJwcmV2XCIpIHtcbiAgICAgICAgICAgIHN0b3BLZXlFdmVudChldnQpO1xuICAgICAgICAgICAgdGhpcy5tb3ZlT3RoZXJTb3VyY2VTdWdnZXN0aW9uU2VsZWN0aW9uKC0xKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoYWN0aW9uID09PSBcImVudGVyXCIpIHtcbiAgICAgICAgICAgIHN0b3BLZXlFdmVudChldnQpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5oaWdobGlnaHRlZE90aGVyU291cmNlU3VnZ2VzdGlvbkluZGV4IDwgMCkge1xuICAgICAgICAgICAgICB0aGlzLmhpZ2hsaWdodGVkT3RoZXJTb3VyY2VTdWdnZXN0aW9uSW5kZXggPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmFwcGx5SGlnaGxpZ2h0ZWRPdGhlclNvdXJjZVN1Z2dlc3Rpb24oKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoYWN0aW9uID09PSBcImVzY2FwZVwiKSB7XG4gICAgICAgICAgICBzdG9wS2V5RXZlbnQoZXZ0KTtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJPdGhlclNvdXJjZVN1Z2dlc3Rpb25TZWxlY3Rpb24oKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgICB9KTtcblxuICAgIHRoaXMub3RoZXJTb3VyY2VTZXR0aW5nRWwgPSBvdGhlclNvdXJjZVNldHRpbmcuc2V0dGluZ0VsO1xuXG4gICAgdGhpcy5vdGhlclNvdXJjZVN1Z2dlc3Rpb25zRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIHRoaXMub3RoZXJTb3VyY2VTdWdnZXN0aW9uc0VsLmNsYXNzTmFtZSA9IFwic2QtdGFnLXN1Z2dlc3Rpb25zXCI7XG4gICAgZm9ybUNvbC5hcHBlbmRDaGlsZCh0aGlzLm90aGVyU291cmNlU3VnZ2VzdGlvbnNFbCk7XG5cbiAgICBuZXcgU2V0dGluZyhmb3JtQ29sKVxuICAgICAgLnNldE5hbWUoXCJUYWdzXCIpXG4gICAgICAuc2V0RGVzYyhcIkNvbW1hLXNlcGFyYXRlZCB0YWdzXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICB0aGlzLnRhZ3NJbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHRcbiAgICAgICAgICAuc2V0VmFsdWUoam9pblRhZ3ModGhpcy5tb25zdGVyLnRhZ3MpKVxuICAgICAgICAgIC5vbkNoYW5nZSgodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMubW9uc3Rlci50YWdzID0gc3BsaXRUYWdzKHZhbHVlKTtcbiAgICAgICAgICAgIHRoaXMuaGlnaGxpZ2h0ZWRUYWdTdWdnZXN0aW9uSW5kZXggPSAtMTtcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaFRhZ1N1Z2dlc3Rpb25zKCk7XG4gICAgICAgICAgICB0aGlzLnJlZnJlc2hQcmV2aWV3KCk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgdGV4dC5pbnB1dEVsLm9ua2V5ZG93biA9IChldnQ6IEtleWJvYXJkRXZlbnQpID0+IHtcbiAgICAgICAgICBjb25zdCBhY3Rpb24gPSBnZXROYXZBY3Rpb24oZXZ0KTtcbiAgICAgICAgICB0aGlzLmZpbHRlcmVkVGFnU3VnZ2VzdGlvbnMgPSB0aGlzLmdldE1hdGNoaW5nVGFnU3VnZ2VzdGlvbnModGV4dC5nZXRWYWx1ZSgpKTtcbiAgICAgICAgICBjb25zdCBoYXNTdWdnZXN0aW9ucyA9IHRoaXMuZmlsdGVyZWRUYWdTdWdnZXN0aW9ucy5sZW5ndGggPiAwO1xuXG4gICAgICAgICAgaWYgKCFhY3Rpb24gfHwgIWhhc1N1Z2dlc3Rpb25zKSByZXR1cm47XG5cbiAgICAgICAgICBpZiAoYWN0aW9uID09PSBcIm5leHRcIikge1xuICAgICAgICAgICAgc3RvcEtleUV2ZW50KGV2dCk7XG4gICAgICAgICAgICB0aGlzLm1vdmVUYWdTdWdnZXN0aW9uU2VsZWN0aW9uKDEpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChhY3Rpb24gPT09IFwicHJldlwiKSB7XG4gICAgICAgICAgICBzdG9wS2V5RXZlbnQoZXZ0KTtcbiAgICAgICAgICAgIHRoaXMubW92ZVRhZ1N1Z2dlc3Rpb25TZWxlY3Rpb24oLTEpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChhY3Rpb24gPT09IFwiZW50ZXJcIikge1xuICAgICAgICAgICAgc3RvcEtleUV2ZW50KGV2dCk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmhpZ2hsaWdodGVkVGFnU3VnZ2VzdGlvbkluZGV4IDwgMCkge1xuICAgICAgICAgICAgICB0aGlzLmhpZ2hsaWdodGVkVGFnU3VnZ2VzdGlvbkluZGV4ID0gMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5hcHBseUhpZ2hsaWdodGVkVGFnU3VnZ2VzdGlvbigpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChhY3Rpb24gPT09IFwiZXNjYXBlXCIpIHtcbiAgICAgICAgICAgIHN0b3BLZXlFdmVudChldnQpO1xuICAgICAgICAgICAgdGhpcy5jbGVhclRhZ1N1Z2dlc3Rpb25TZWxlY3Rpb24oKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgICB9KTtcblxuICAgIHRoaXMudGFnU3VnZ2VzdGlvbnNFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgdGhpcy50YWdTdWdnZXN0aW9uc0VsLmNsYXNzTmFtZSA9IFwic2QtdGFnLXN1Z2dlc3Rpb25zXCI7XG4gICAgZm9ybUNvbC5hcHBlbmRDaGlsZCh0aGlzLnRhZ1N1Z2dlc3Rpb25zRWwpO1xuXG4gICAgZm9ybUNvbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJTdGF0c1wiIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoZm9ybUNvbClcbiAgICAgIC5zZXROYW1lKFwiTGV2ZWxcIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRoaXMubGV2ZWxJbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHRcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5tb25zdGVyLmxldmVsKVxuICAgICAgICAgIC5vbkNoYW5nZSgodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMubW9uc3Rlci5sZXZlbCA9IHZhbHVlLnRyaW0oKTtcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaFByZXZpZXcoKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoZm9ybUNvbClcbiAgICAgIC5zZXROYW1lKFwiQWxpZ25tZW50XCIpXG4gICAgICAuc2V0RGVzYyhcIlVzdWFsbHkgTCwgTiwgb3IgQ1wiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgdGhpcy5hbGlnbm1lbnRJbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHRcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5tb25zdGVyLmFsaWdubWVudClcbiAgICAgICAgICAub25DaGFuZ2UoKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1vbnN0ZXIuYWxpZ25tZW50ID0gdmFsdWUudHJpbSgpLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgICAgICB0aGlzLnJlZnJlc2hQcmV2aWV3KCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGZvcm1Db2wpXG4gICAgICAuc2V0TmFtZShcIkFDXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICB0aGlzLmFjSW5wdXQgPSB0ZXh0O1xuICAgICAgICB0ZXh0XG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMubW9uc3Rlci5hYylcbiAgICAgICAgICAub25DaGFuZ2UoKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1vbnN0ZXIuYWMgPSB2YWx1ZS50cmltKCk7XG4gICAgICAgICAgICB0aGlzLnJlZnJlc2hQcmV2aWV3KCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGZvcm1Db2wpXG4gICAgICAuc2V0TmFtZShcIkhQXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICB0aGlzLmhwSW5wdXQgPSB0ZXh0O1xuICAgICAgICB0ZXh0XG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMubW9uc3Rlci5ocClcbiAgICAgICAgICAub25DaGFuZ2UoKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1vbnN0ZXIuaHAgPSB2YWx1ZS50cmltKCk7XG4gICAgICAgICAgICB0aGlzLnJlZnJlc2hQcmV2aWV3KCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGZvcm1Db2wpXG4gICAgICAuc2V0TmFtZShcIk1WXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICB0aGlzLm12SW5wdXQgPSB0ZXh0O1xuICAgICAgICB0ZXh0XG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMubW9uc3Rlci5tdilcbiAgICAgICAgICAub25DaGFuZ2UoKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1vbnN0ZXIubXYgPSB2YWx1ZS50cmltKCk7XG4gICAgICAgICAgICB0aGlzLnJlZnJlc2hQcmV2aWV3KCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIGZvcm1Db2wuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiQWJpbGl0aWVzXCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhmb3JtQ29sKVxuICAgICAgLnNldE5hbWUoXCJTVFJcIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRoaXMuc3RySW5wdXQgPSB0ZXh0O1xuICAgICAgICB0ZXh0XG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMubW9uc3Rlci5zdGF0cy5zdHIpXG4gICAgICAgICAgLm9uQ2hhbmdlKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tb25zdGVyLnN0YXRzLnN0ciA9IHZhbHVlLnRyaW0oKTtcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaFByZXZpZXcoKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoZm9ybUNvbClcbiAgICAgIC5zZXROYW1lKFwiREVYXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICB0aGlzLmRleElucHV0ID0gdGV4dDtcbiAgICAgICAgdGV4dFxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLm1vbnN0ZXIuc3RhdHMuZGV4KVxuICAgICAgICAgIC5vbkNoYW5nZSgodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMubW9uc3Rlci5zdGF0cy5kZXggPSB2YWx1ZS50cmltKCk7XG4gICAgICAgICAgICB0aGlzLnJlZnJlc2hQcmV2aWV3KCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGZvcm1Db2wpXG4gICAgICAuc2V0TmFtZShcIkNPTlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgdGhpcy5jb25JbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHRcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5tb25zdGVyLnN0YXRzLmNvbilcbiAgICAgICAgICAub25DaGFuZ2UoKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1vbnN0ZXIuc3RhdHMuY29uID0gdmFsdWUudHJpbSgpO1xuICAgICAgICAgICAgdGhpcy5yZWZyZXNoUHJldmlldygpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhmb3JtQ29sKVxuICAgICAgLnNldE5hbWUoXCJJTlRcIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRoaXMuaW50SW5wdXQgPSB0ZXh0O1xuICAgICAgICB0ZXh0XG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMubW9uc3Rlci5zdGF0cy5pbnQpXG4gICAgICAgICAgLm9uQ2hhbmdlKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tb25zdGVyLnN0YXRzLmludCA9IHZhbHVlLnRyaW0oKTtcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaFByZXZpZXcoKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoZm9ybUNvbClcbiAgICAgIC5zZXROYW1lKFwiV0lTXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICB0aGlzLndpc0lucHV0ID0gdGV4dDtcbiAgICAgICAgdGV4dFxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLm1vbnN0ZXIuc3RhdHMud2lzKVxuICAgICAgICAgIC5vbkNoYW5nZSgodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMubW9uc3Rlci5zdGF0cy53aXMgPSB2YWx1ZS50cmltKCk7XG4gICAgICAgICAgICB0aGlzLnJlZnJlc2hQcmV2aWV3KCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGZvcm1Db2wpXG4gICAgICAuc2V0TmFtZShcIkNIQVwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgdGhpcy5jaGFJbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHRcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5tb25zdGVyLnN0YXRzLmNoYSlcbiAgICAgICAgICAub25DaGFuZ2UoKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1vbnN0ZXIuc3RhdHMuY2hhID0gdmFsdWUudHJpbSgpO1xuICAgICAgICAgICAgdGhpcy5yZWZyZXNoUHJldmlldygpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBmb3JtQ29sLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIkxpc3RzXCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhmb3JtQ29sKVxuICAgICAgLnNldE5hbWUoXCJBdHRhY2tzXCIpXG4gICAgICAuc2V0RGVzYyhcIk9uZSBhdHRhY2sgcGVyIGxpbmVcIilcbiAgICAgIC5hZGRUZXh0QXJlYSgodGV4dCkgPT4ge1xuICAgICAgICB0aGlzLmF0dGFja3NJbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHRcbiAgICAgICAgICAuc2V0VmFsdWUoam9pbkF0dGFja0xpbmVzKHRoaXMubW9uc3RlcikpXG4gICAgICAgICAgLm9uQ2hhbmdlKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tb25zdGVyLmF0ayA9IG5vcm1hbGl6ZUxpbmVzKHZhbHVlKS5tYXAoKGxpbmUpID0+ICh7XG4gICAgICAgICAgICAgIG5hbWU6IGxpbmUsXG4gICAgICAgICAgICAgIHJhdzogbGluZVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgdGhpcy5yZWZyZXNoUHJldmlldygpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB0ZXh0LmlucHV0RWwucm93cyA9IDU7XG4gICAgICAgIHRleHQuaW5wdXRFbC5hZGRDbGFzcyhcInNkLWltcG9ydC1wcmV2aWV3LXRleHRhcmVhXCIpO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhmb3JtQ29sKVxuICAgICAgLnNldE5hbWUoXCJUcmFpdHNcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICAnUGFzc2l2ZSBvciBhbHdheXMtb24gYWJpbGl0aWVzLiBPbmUgdHJhaXQgcGVyIGxpbmUuIEdvb2QgZm9ybWF0czogXCJEZXZvdXIuIFVzZSB0dXJuIHRvLi4uXCIgb3IgXCJEZXZvdXI6IFVzZSB0dXJuIHRvLi4uXCInXG4gICAgICApXG4gICAgICAuYWRkVGV4dEFyZWEoKHRleHQpID0+IHtcbiAgICAgICAgdGhpcy50cmFpdHNJbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHRcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5tb25zdGVyLnRyYWl0cy5qb2luKFwiXFxuXCIpKVxuICAgICAgICAgIC5vbkNoYW5nZSgodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMubW9uc3Rlci50cmFpdHMgPSBub3JtYWxpemVMaW5lcyh2YWx1ZSk7XG4gICAgICAgICAgICB0aGlzLnJlZnJlc2hQcmV2aWV3KCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHRleHQuaW5wdXRFbC5yb3dzID0gNTtcbiAgICAgICAgdGV4dC5pbnB1dEVsLmFkZENsYXNzKFwic2QtaW1wb3J0LXByZXZpZXctdGV4dGFyZWFcIik7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGZvcm1Db2wpXG4gICAgICAuc2V0TmFtZShcIlNwZWxsc1wiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgICdTcGVsbC1saWtlIG9yIG1hZ2ljYWwgYWJpbGl0aWVzLiBPbmUgc3BlbGwgcGVyIGxpbmUuIEdvb2QgZm9ybWF0czogXCJSYXkgb2YgRnJvc3QgKElOVCBTcGVsbCkuIC4uLlwiIG9yIFwiUmF5IG9mIEZyb3N0OiAuLi5cIidcbiAgICAgIClcbiAgICAgIC5hZGRUZXh0QXJlYSgodGV4dCkgPT4ge1xuICAgICAgICB0aGlzLnNwZWxsc0lucHV0ID0gdGV4dDtcbiAgICAgICAgdGV4dFxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLm1vbnN0ZXIuc3BlbGxzLmpvaW4oXCJcXG5cIikpXG4gICAgICAgICAgLm9uQ2hhbmdlKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tb25zdGVyLnNwZWxscyA9IG5vcm1hbGl6ZUxpbmVzKHZhbHVlKTtcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaFByZXZpZXcoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgdGV4dC5pbnB1dEVsLnJvd3MgPSA1O1xuICAgICAgICB0ZXh0LmlucHV0RWwuYWRkQ2xhc3MoXCJzZC1pbXBvcnQtcHJldmlldy10ZXh0YXJlYVwiKTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoZm9ybUNvbClcbiAgICAgIC5zZXROYW1lKFwiU3BlY2lhbHNcIilcbiAgICAgIC5zZXREZXNjKFwiQWN0aXZlIG9yIHRyaWdnZXJlZCBub24tc3BlbGwgYWJpbGl0aWVzLiBPbmUgc3BlY2lhbCBlbnRyeSBwZXIgbGluZVwiKVxuICAgICAgLmFkZFRleHRBcmVhKCh0ZXh0KSA9PiB7XG4gICAgICAgIHRoaXMuc3BlY2lhbHNJbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHRcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5tb25zdGVyLnNwZWNpYWxzLmpvaW4oXCJcXG5cIikpXG4gICAgICAgICAgLm9uQ2hhbmdlKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tb25zdGVyLnNwZWNpYWxzID0gbm9ybWFsaXplTGluZXModmFsdWUpO1xuICAgICAgICAgICAgdGhpcy5yZWZyZXNoUHJldmlldygpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB0ZXh0LmlucHV0RWwucm93cyA9IDQ7XG4gICAgICAgIHRleHQuaW5wdXRFbC5hZGRDbGFzcyhcInNkLWltcG9ydC1wcmV2aWV3LXRleHRhcmVhXCIpO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhmb3JtQ29sKVxuICAgICAgLnNldE5hbWUoXCJHZWFyXCIpXG4gICAgICAuc2V0RGVzYyhcIk9uZSBnZWFyIGVudHJ5IHBlciBsaW5lXCIpXG4gICAgICAuYWRkVGV4dEFyZWEoKHRleHQpID0+IHtcbiAgICAgICAgdGhpcy5nZWFySW5wdXQgPSB0ZXh0O1xuICAgICAgICB0ZXh0XG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMubW9uc3Rlci5nZWFyLmpvaW4oXCJcXG5cIikpXG4gICAgICAgICAgLm9uQ2hhbmdlKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tb25zdGVyLmdlYXIgPSBub3JtYWxpemVMaW5lcyh2YWx1ZSk7XG4gICAgICAgICAgICB0aGlzLnJlZnJlc2hQcmV2aWV3KCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHRleHQuaW5wdXRFbC5yb3dzID0gMztcbiAgICAgICAgdGV4dC5pbnB1dEVsLmFkZENsYXNzKFwic2QtaW1wb3J0LXByZXZpZXctdGV4dGFyZWFcIik7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGZvcm1Db2wpXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvblxuICAgICAgICAgIC5zZXRCdXR0b25UZXh0KFwiRml4IGNvbW1vbiBpc3N1ZXNcIilcbiAgICAgICAgICAuc2V0VG9vbHRpcChcbiAgICAgICAgICAgIFwiQ2xlYW5zIGZvcm1hdHRpbmc6IGZpeGVzIHNwYWNpbmcsIGRpY2UgdHlwb3MgKDFkZDggXHUyMTkyIDFkOCksIGNhcGl0YWxpemVzIG5hbWVzL2Rlc2NyaXB0aW9ucywgYW5kIG5vcm1hbGl6ZXMgdHJhaXRzLCBzcGVsbHMsIGFuZCBhdHRhY2tzLlwiXG4gICAgICAgICAgKVxuICAgICAgICAgIC5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZml4Q29tbW9uSXNzdWVzKCk7XG4gICAgICAgICAgfSlcbiAgICAgIClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uXG4gICAgICAgICAgLnNldEJ1dHRvblRleHQodGhpcy5tb2RlID09PSBcImVkaXRcIiA/IFwiVXBkYXRlIG5vdGVcIiA6IFwiQ3JlYXRlIG5vdGVcIilcbiAgICAgICAgICAuc2V0Q3RhKClcbiAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXRoaXMubW9uc3Rlci5uYW1lLnRyaW0oKSkge1xuICAgICAgICAgICAgICBuZXcgTm90aWNlKFwiTW9uc3RlciBuZWVkcyBhIG5hbWUgYmVmb3JlIHNhdmluZy5cIik7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgYXdhaXQgdGhpcy5vbkNvbmZpcm1DYWxsYmFjayh0aGlzLm1vbnN0ZXIpO1xuICAgICAgICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiU2hhZG93ZGFyayBTdGF0YmxvY2tzIG1vZGFsIGNvbmZpcm0gZXJyb3I6XCIsIGVycm9yKTtcbiAgICAgICAgICAgICAgbmV3IE5vdGljZShcIkZhaWxlZCB0byBzYXZlIG1vbnN0ZXIgbm90ZS5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICBpZiAodGhpcy5vblNraXBDYWxsYmFjaykge1xuICAgICAgbmV3IFNldHRpbmcoZm9ybUNvbCkuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvblxuICAgICAgICAgIC5zZXRCdXR0b25UZXh0KFwiU2tpcFwiKVxuICAgICAgICAgIC5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMub25Ta2lwQ2FsbGJhY2s/LigpO1xuICAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIG5ldyBTZXR0aW5nKGZvcm1Db2wpLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgYnV0dG9uLnNldEJ1dHRvblRleHQoXCJDYW5jZWxcIikub25DbGljaygoKSA9PiB7XG4gICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIHRoaXMucmVmcmVzaEZvcm1GaWVsZHMoKTtcbiAgICB0aGlzLnJlZnJlc2hQcmV2aWV3KCk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gICAgdGhpcy5tb2RhbEVsLnJlbW92ZUNsYXNzKFwic2QtaW1wb3J0LXByZXZpZXctbW9kYWwtc2hlbGxcIik7XG4gIH1cbn0iLCAiaW1wb3J0IHsgU2hhZG93ZGFya01vbnN0ZXIsIFNoYWRvd2RhcmtBdHRhY2sgfSBmcm9tIFwiLi4vdHlwZXNcIjtcblxuZnVuY3Rpb24gY2xlYW5UZXh0KHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdmFsdWVcbiAgICAucmVwbGFjZSgvW1x1MjAxM1x1MjAxNF0vZywgXCItXCIpXG4gICAgLnJlcGxhY2UoL1xcdTAwQTAvZywgXCIgXCIpXG4gICAgLnJlcGxhY2UoL1xccysvZywgXCIgXCIpXG4gICAgLnRyaW0oKTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplTW9kaWZpZXIodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGNsZWFuZWQgPSBjbGVhblRleHQodmFsdWUpO1xuXG4gIGlmICghY2xlYW5lZCkgcmV0dXJuIFwiXCI7XG5cbiAgaWYgKC9eWystXVxcZCskLy50ZXN0KGNsZWFuZWQpKSByZXR1cm4gY2xlYW5lZDtcbiAgaWYgKC9eXFxkKyQvLnRlc3QoY2xlYW5lZCkpIHJldHVybiBgKyR7Y2xlYW5lZH1gO1xuICBpZiAoL14tXFxkKyQvLnRlc3QoY2xlYW5lZCkpIHJldHVybiBjbGVhbmVkO1xuXG4gIHJldHVybiBjbGVhbmVkO1xufVxuXG5mdW5jdGlvbiB0b1NtYXJ0VGl0bGVDYXNlKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHNtYWxsV29yZHMgPSBuZXcgU2V0KFtcbiAgICBcIm9mXCIsIFwiaW5cIiwgXCJhbmRcIiwgXCJ0aGVcIiwgXCJ0b1wiLCBcImZvclwiLCBcIm9uXCIsIFwiYXRcIiwgXCJieVwiLCBcImZyb21cIiwgXCJ3aXRoXCIsIFwiYVwiLCBcImFuXCJcbiAgXSk7XG5cbiAgY29uc3Qgd29yZHMgPSB0ZXh0LnRvTG93ZXJDYXNlKCkuc3BsaXQoL1xccysvKTtcblxuICByZXR1cm4gd29yZHNcbiAgICAubWFwKCh3b3JkLCBpbmRleCkgPT4ge1xuICAgICAgaWYgKCF3b3JkKSByZXR1cm4gd29yZDtcblxuICAgICAgY29uc3QgaXNGaXJzdCA9IGluZGV4ID09PSAwO1xuICAgICAgY29uc3QgaXNMYXN0ID0gaW5kZXggPT09IHdvcmRzLmxlbmd0aCAtIDE7XG5cbiAgICAgIGlmICghaXNGaXJzdCAmJiAhaXNMYXN0ICYmIHNtYWxsV29yZHMuaGFzKHdvcmQpKSB7XG4gICAgICAgIHJldHVybiB3b3JkO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gd29yZC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHdvcmQuc2xpY2UoMSk7XG4gICAgfSlcbiAgICAuam9pbihcIiBcIik7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZURpY2VUeXBvcyh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdGV4dFxuICAgIC5yZXBsYWNlKC9cXGIoXFxkKylkZChcXGQrKVxcYi9naSwgXCIkMWQkMlwiKVxuICAgIC5yZXBsYWNlKC9cXGIoXFxkKylkK2QoXFxkKylcXGIvZ2ksIFwiJDFkJDJcIik7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVB1bmN0dWF0aW9uU3BhY2luZyh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdGV4dFxuICAgIC5yZXBsYWNlKC9cXHMqOlxccyovZywgXCI6IFwiKVxuICAgIC5yZXBsYWNlKC9cXHMqXFwuXFxzKi9nLCBcIi4gXCIpXG4gICAgLnJlcGxhY2UoL1xccyosXFxzKi9nLCBcIiwgXCIpXG4gICAgLnJlcGxhY2UoL1xcc3syLH0vZywgXCIgXCIpXG4gICAgLnRyaW0oKTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplTGFiZWxTdHlsZSh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBjbGVhbmVkID0gbm9ybWFsaXplUHVuY3R1YXRpb25TcGFjaW5nKG5vcm1hbGl6ZURpY2VUeXBvcyhjbGVhblRleHQodGV4dCkpKTtcbiAgaWYgKCFjbGVhbmVkKSByZXR1cm4gXCJcIjtcblxuICAvLyBIZWxwZXIgdG8gY2FwaXRhbGl6ZSBmaXJzdCBsZXR0ZXIgb2YgYm9keSB0ZXh0XG4gIGNvbnN0IGNhcGl0YWxpemVCb2R5ID0gKGJvZHk6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4gICAgaWYgKCFib2R5KSByZXR1cm4gXCJcIjtcbiAgICByZXR1cm4gYm9keS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIGJvZHkuc2xpY2UoMSk7XG4gIH07XG5cbiAgLy8gMSkgTGFiZWwgYmVmb3JlIGNvbG9uXG4gIGxldCBtYXRjaCA9IGNsZWFuZWQubWF0Y2goL14oW146XXsxLDgwfSk6XFxzKiguKykkLyk7XG4gIGlmIChtYXRjaCkge1xuICAgIGNvbnN0IGxhYmVsID0gdG9TbWFydFRpdGxlQ2FzZShtYXRjaFsxXS50cmltKCkpO1xuICAgIGNvbnN0IGJvZHkgPSBjYXBpdGFsaXplQm9keShtYXRjaFsyXS50cmltKCkpO1xuICAgIHJldHVybiBgJHtsYWJlbH06ICR7Ym9keX1gO1xuICB9XG5cbiAgLy8gMikgTGFiZWwgYmVmb3JlIHNlbnRlbmNlIGJyZWFrXG4gIG1hdGNoID0gY2xlYW5lZC5tYXRjaCgvXihbXi4hP117MSw4MH1bLiE/XSlcXHMqKC4rKSQvKTtcbiAgaWYgKG1hdGNoKSB7XG4gICAgY29uc3QgcmF3TGFiZWwgPSBtYXRjaFsxXS50cmltKCk7XG4gICAgY29uc3QgcHVuY3R1YXRpb24gPSByYXdMYWJlbC5zbGljZSgtMSk7XG4gICAgY29uc3QgbGFiZWxDb3JlID0gcmF3TGFiZWwuc2xpY2UoMCwgLTEpLnRyaW0oKTtcbiAgICBjb25zdCBib2R5ID0gY2FwaXRhbGl6ZUJvZHkobWF0Y2hbMl0udHJpbSgpKTtcblxuICAgIHJldHVybiBgJHt0b1NtYXJ0VGl0bGVDYXNlKGxhYmVsQ29yZSl9JHtwdW5jdHVhdGlvbn0gJHtib2R5fWA7XG4gIH1cblxuICAvLyAzKSBObyBjbGVhciBsYWJlbCBcdTIxOTIganVzdCBjbGVhbiArIGNhcGl0YWxpemUgZmlyc3QgbGV0dGVyXG4gIGlmICgvXlthLXpdLy50ZXN0KGNsZWFuZWQpKSB7XG4gICAgcmV0dXJuIGNsZWFuZWQuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBjbGVhbmVkLnNsaWNlKDEpO1xuICB9XG5cbiAgcmV0dXJuIGNsZWFuZWQ7XG59XG5cbmZ1bmN0aW9uIGNsZWFuTXVsdGlsaW5lSXRlbXMoaXRlbXM6IHN0cmluZ1tdKTogc3RyaW5nW10ge1xuICByZXR1cm4gaXRlbXNcbiAgICAubWFwKChpdGVtKSA9PiBub3JtYWxpemVMYWJlbFN0eWxlKGl0ZW0pKVxuICAgIC5maWx0ZXIoQm9vbGVhbik7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUF0dGFja1RleHQodGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgbGV0IGNsZWFuZWQgPSBub3JtYWxpemVQdW5jdHVhdGlvblNwYWNpbmcobm9ybWFsaXplRGljZVR5cG9zKGNsZWFuVGV4dCh0ZXh0KSkpO1xuXG4gIGNvbnN0IGNvbm5lY3Rvck1hdGNoID0gY2xlYW5lZC5tYXRjaCgvXihBTkR8T1IpXFxzKyguKykkL2kpO1xuICBpZiAoY29ubmVjdG9yTWF0Y2gpIHtcbiAgICBjb25zdCBjb25uZWN0b3IgPSBjb25uZWN0b3JNYXRjaFsxXS50b1VwcGVyQ2FzZSgpO1xuICAgIGNvbnN0IGJvZHkgPSBjb25uZWN0b3JNYXRjaFsyXS50cmltKCk7XG4gICAgcmV0dXJuIGAke2Nvbm5lY3Rvcn0gJHtib2R5fWA7XG4gIH1cblxuICByZXR1cm4gY2xlYW5lZDtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplQXR0YWNrKGF0dGFjazogU2hhZG93ZGFya0F0dGFjayk6IFNoYWRvd2RhcmtBdHRhY2sge1xuICBjb25zdCByYXcgPSBub3JtYWxpemVBdHRhY2tUZXh0KGF0dGFjay5yYXcgfHwgXCJcIik7XG4gIGNvbnN0IG5hbWUgPSBub3JtYWxpemVBdHRhY2tUZXh0KGF0dGFjay5uYW1lIHx8IFwiXCIpO1xuXG4gIHJldHVybiB7XG4gICAgLi4uYXR0YWNrLFxuICAgIG5hbWU6IHJhdyB8fCBuYW1lLFxuICAgIHJhdzogcmF3IHx8IG5hbWVcbiAgfTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplRGVzY3JpcHRpb24odGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgY2xlYW5lZCA9IG5vcm1hbGl6ZVB1bmN0dWF0aW9uU3BhY2luZyhub3JtYWxpemVEaWNlVHlwb3MoY2xlYW5UZXh0KHRleHQpKSk7XG4gIGlmICghY2xlYW5lZCkgcmV0dXJuIFwiXCI7XG4gIHJldHVybiBjbGVhbmVkLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgY2xlYW5lZC5zbGljZSgxKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpeE1vbnN0ZXJDb21tb25Jc3N1ZXMobW9uc3RlcjogU2hhZG93ZGFya01vbnN0ZXIpOiBTaGFkb3dkYXJrTW9uc3RlciB7XG4gIHJldHVybiB7XG4gICAgLi4ubW9uc3RlcixcbiAgICBuYW1lOiBjbGVhblRleHQobW9uc3Rlci5uYW1lKSxcbiAgICBsZXZlbDogY2xlYW5UZXh0KG1vbnN0ZXIubGV2ZWwpLFxuICAgIGFsaWdubWVudDogY2xlYW5UZXh0KG1vbnN0ZXIuYWxpZ25tZW50KS50b1VwcGVyQ2FzZSgpLFxuICAgIHR5cGU6IGNsZWFuVGV4dChtb25zdGVyLnR5cGUpLFxuICAgIGFjOiBjbGVhblRleHQobW9uc3Rlci5hYyksXG4gICAgaHA6IGNsZWFuVGV4dChtb25zdGVyLmhwKSxcbiAgICBtdjogY2xlYW5UZXh0KG1vbnN0ZXIubXYpLFxuICAgIGF0azogbW9uc3Rlci5hdGtcbiAgICAgIC5tYXAobm9ybWFsaXplQXR0YWNrKVxuICAgICAgLmZpbHRlcigoYXR0YWNrKSA9PiBCb29sZWFuKChhdHRhY2sucmF3IHx8IGF0dGFjay5uYW1lKS50cmltKCkpKSxcbiAgICBzdGF0czoge1xuICAgICAgc3RyOiBub3JtYWxpemVNb2RpZmllcihtb25zdGVyLnN0YXRzLnN0ciksXG4gICAgICBkZXg6IG5vcm1hbGl6ZU1vZGlmaWVyKG1vbnN0ZXIuc3RhdHMuZGV4KSxcbiAgICAgIGNvbjogbm9ybWFsaXplTW9kaWZpZXIobW9uc3Rlci5zdGF0cy5jb24pLFxuICAgICAgaW50OiBub3JtYWxpemVNb2RpZmllcihtb25zdGVyLnN0YXRzLmludCksXG4gICAgICB3aXM6IG5vcm1hbGl6ZU1vZGlmaWVyKG1vbnN0ZXIuc3RhdHMud2lzKSxcbiAgICAgIGNoYTogbm9ybWFsaXplTW9kaWZpZXIobW9uc3Rlci5zdGF0cy5jaGEpXG4gICAgfSxcbiAgICB0cmFpdHM6IGNsZWFuTXVsdGlsaW5lSXRlbXMobW9uc3Rlci50cmFpdHMpLFxuICAgIHNwZWNpYWxzOiBjbGVhbk11bHRpbGluZUl0ZW1zKG1vbnN0ZXIuc3BlY2lhbHMpLFxuICAgIHNwZWxsczogY2xlYW5NdWx0aWxpbmVJdGVtcyhtb25zdGVyLnNwZWxscyksXG4gICAgZ2VhcjogY2xlYW5NdWx0aWxpbmVJdGVtcyhtb25zdGVyLmdlYXIpLFxuICAgIGRlc2NyaXB0aW9uOiBub3JtYWxpemVEZXNjcmlwdGlvbihtb25zdGVyLmRlc2NyaXB0aW9uKSxcbiAgICBzb3VyY2U6IGNsZWFuVGV4dChtb25zdGVyLnNvdXJjZSksXG4gICAgdGFnczogY2xlYW5UYWdzKG1vbnN0ZXIudGFncylcbiAgfTtcblxuICBmdW5jdGlvbiBjbGVhblRhZ3ModGFnczogc3RyaW5nW10pOiBzdHJpbmdbXSB7XG4gIHJldHVybiB0YWdzXG4gICAgLm1hcCgodGFnKSA9PlxuICAgICAgdGFnXG4gICAgICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgICAgIC5yZXBsYWNlKC9bXHUyMDEzXHUyMDE0XS9nLCBcIi1cIilcbiAgICAgICAgLnJlcGxhY2UoL1xcdTAwQTAvZywgXCIgXCIpXG4gICAgICAgIC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKVxuICAgICAgICAudHJpbSgpXG4gICAgKVxuICAgIC5maWx0ZXIoQm9vbGVhbik7XG59XG59IiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuZXhwb3J0IGludGVyZmFjZSBEdXBsaWNhdGVNb25zdGVyTW9kYWxPcHRpb25zIHtcbiAgbW9uc3Rlck5hbWU6IHN0cmluZztcbiAgZXhpc3RpbmdGaWxlTmFtZTogc3RyaW5nO1xuICBjYW5PdmVyd3JpdGU6IGJvb2xlYW47XG4gIG9uT3ZlcndyaXRlPzogKCkgPT4gUHJvbWlzZTx2b2lkPjtcbiAgb25DcmVhdGVDb3B5OiAoKSA9PiBQcm9taXNlPHZvaWQ+O1xufVxuXG5leHBvcnQgY2xhc3MgRHVwbGljYXRlTW9uc3Rlck1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIG1vbnN0ZXJOYW1lOiBzdHJpbmc7XG4gIHByaXZhdGUgZXhpc3RpbmdGaWxlTmFtZTogc3RyaW5nO1xuICBwcml2YXRlIGNhbk92ZXJ3cml0ZTogYm9vbGVhbjtcbiAgcHJpdmF0ZSBvbk92ZXJ3cml0ZUNhbGxiYWNrPzogKCkgPT4gUHJvbWlzZTx2b2lkPjtcbiAgcHJpdmF0ZSBvbkNyZWF0ZUNvcHlDYWxsYmFjazogKCkgPT4gUHJvbWlzZTx2b2lkPjtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgb3B0aW9uczogRHVwbGljYXRlTW9uc3Rlck1vZGFsT3B0aW9ucykge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5tb25zdGVyTmFtZSA9IG9wdGlvbnMubW9uc3Rlck5hbWU7XG4gICAgdGhpcy5leGlzdGluZ0ZpbGVOYW1lID0gb3B0aW9ucy5leGlzdGluZ0ZpbGVOYW1lO1xuICAgIHRoaXMuY2FuT3ZlcndyaXRlID0gb3B0aW9ucy5jYW5PdmVyd3JpdGU7XG4gICAgdGhpcy5vbk92ZXJ3cml0ZUNhbGxiYWNrID0gb3B0aW9ucy5vbk92ZXJ3cml0ZTtcbiAgICB0aGlzLm9uQ3JlYXRlQ29weUNhbGxiYWNrID0gb3B0aW9ucy5vbkNyZWF0ZUNvcHk7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250ZW50RWwsIHRpdGxlRWwgfSA9IHRoaXM7XG5cbiAgICB0aXRsZUVsLnNldFRleHQoXCJEdXBsaWNhdGUgbW9uc3RlciBub3RlXCIpO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuXG4gICAgY29uc3QgbWVzc2FnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwXCIpO1xuICAgIG1lc3NhZ2UudGV4dENvbnRlbnQgPSB0aGlzLmNhbk92ZXJ3cml0ZVxuICAgICAgPyBgQSBTaGFkb3dkYXJrIG1vbnN0ZXIgbm90ZSBuYW1lZCBcIiR7dGhpcy5leGlzdGluZ0ZpbGVOYW1lfVwiIGFscmVhZHkgZXhpc3RzLmBcbiAgICAgIDogYEEgZmlsZSBuYW1lZCBcIiR7dGhpcy5leGlzdGluZ0ZpbGVOYW1lfVwiIGFscmVhZHkgZXhpc3RzLCBidXQgaXQgaXMgbm90IGEgU2hhZG93ZGFyayBtb25zdGVyIG5vdGUuYDtcbiAgICBjb250ZW50RWwuYXBwZW5kQ2hpbGQobWVzc2FnZSk7XG5cbiAgICBjb25zdCBzdWJNZXNzYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInBcIik7XG4gICAgc3ViTWVzc2FnZS50ZXh0Q29udGVudCA9IHRoaXMuY2FuT3ZlcndyaXRlXG4gICAgICA/IFwiQ2hvb3NlIHdoZXRoZXIgdG8gdXBkYXRlIHRoZSBleGlzdGluZyBub3RlLCBjcmVhdGUgYSBjb3B5LCBvciBjYW5jZWwuXCJcbiAgICAgIDogXCJUbyBhdm9pZCBvdmVyd3JpdGluZyBhIG5vbi1tb25zdGVyIG5vdGUsIHlvdSBjYW4gY3JlYXRlIGEgY29weSBvciBjYW5jZWwuXCI7XG4gICAgY29udGVudEVsLmFwcGVuZENoaWxkKHN1Yk1lc3NhZ2UpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmNhbk92ZXJ3cml0ZSAmJiB0aGlzLm9uT3ZlcndyaXRlQ2FsbGJhY2spIHtcbiAgICAgICAgICBidXR0b25cbiAgICAgICAgICAgIC5zZXRCdXR0b25UZXh0KFwiVXBkYXRlIGV4aXN0aW5nIG5vdGVcIilcbiAgICAgICAgICAgIC5zZXRDdGEoKVxuICAgICAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICBhd2FpdCB0aGlzLm9uT3ZlcndyaXRlQ2FsbGJhY2s/LigpO1xuICAgICAgICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uXG4gICAgICAgICAgLnNldEJ1dHRvblRleHQoXCJDcmVhdGUgY29weVwiKVxuICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMub25DcmVhdGVDb3B5Q2FsbGJhY2soKTtcbiAgICAgICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgICB9KVxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b25cbiAgICAgICAgICAuc2V0QnV0dG9uVGV4dChcIkNhbmNlbFwiKVxuICAgICAgICAgIC5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgICB9KVxuICAgICAgKTtcbiAgfVxuXG4gIG9uQ2xvc2UoKTogdm9pZCB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgfVxufSIsICJjb25zdCBVUFBFUkNBU0VfTk9OX05BTUVfV09SRFMgPSBuZXcgU2V0KFtcbiAgXCJBQ1wiLFxuICBcIkhQXCIsXG4gIFwiQVRLXCIsXG4gIFwiTVZcIixcbiAgXCJBTFwiLFxuICBcIkxWXCIsXG4gIFwiU1RSXCIsXG4gIFwiREVYXCIsXG4gIFwiQ09OXCIsXG4gIFwiSU5UXCIsXG4gIFwiV0lTXCIsXG4gIFwiQ0hBXCIsXG4gIFwiRENcIixcbiAgXCJBRFZcIixcbiAgXCJESVNBRFZcIlxuXSk7XG5cbmZ1bmN0aW9uIGNsZWFuTmFtZVRva2VuKHdvcmQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB3b3JkLnJlcGxhY2UoL1ssJ1x1MjAxOS1dL2csIFwiXCIpO1xufVxuXG5mdW5jdGlvbiBpc1VwcGVyY2FzZU5hbWVUb2tlbih3b3JkOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgY2xlYW5lZCA9IGNsZWFuTmFtZVRva2VuKHdvcmQpO1xuICBpZiAoIWNsZWFuZWQpIHJldHVybiBmYWxzZTtcbiAgaWYgKFVQUEVSQ0FTRV9OT05fTkFNRV9XT1JEUy5oYXMoY2xlYW5lZCkpIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIC9eW0EtWjAtOV0rJC8udGVzdChjbGVhbmVkKTtcbn1cblxuZnVuY3Rpb24gbG9va3NMaWtlTW9uc3Rlck5hbWVJbmxpbmUoY2FuZGlkYXRlOiBzdHJpbmcsIG1pbldvcmRzID0gMSk6IGJvb2xlYW4ge1xuICBjb25zdCB3b3JkcyA9IGNhbmRpZGF0ZS50cmltKCkuc3BsaXQoL1xccysvKS5maWx0ZXIoQm9vbGVhbik7XG4gIGlmICh3b3Jkcy5sZW5ndGggPCBtaW5Xb3JkcyB8fCB3b3Jkcy5sZW5ndGggPiA0KSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiB3b3Jkcy5ldmVyeSgod29yZCkgPT4gaXNVcHBlcmNhc2VOYW1lVG9rZW4od29yZCkpO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVFbWJlZGRlZE1vbnN0ZXJOYW1lcyhpbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgbGV0IHRleHQgPSBpbnB1dDtcblxuICAvLyBDYXNlIDE6XG4gIC8vIFNlbnRlbmNlLWVuZGluZyBwdW5jdHVhdGlvbiBmb2xsb3dlZCBieSBOQU1FIHRoZW4gZGVzY3JpcHRpb24uXG4gIC8vXG4gIC8vIFwiLi4uIGRpcmVjdGlvbi4gRFVORUZJRU5EIERlbW9ucyB0aGF0IGFwcGVhciAuLi5cIlxuICAvLyA9PiBcIi4uLiBkaXJlY3Rpb24uXFxuRFVORUZJRU5EXFxuRGVtb25zIHRoYXQgYXBwZWFyIC4uLlwiXG4gIHRleHQgPSB0ZXh0LnJlcGxhY2UoXG4gICAgLyhbLiE/XSlcXHMrKFtBLVpdW0EtWjAtOSwnXHUyMDE5LV0qKD86XFxzK1tBLVpdW0EtWjAtOSwnXHUyMDE5LV0qKXswLDN9KVxccysoW0EtWl1bYS16XVteXFxyXFxuXSopL2csXG4gICAgKG1hdGNoLCBwdW5jdCwgbWF5YmVOYW1lLCBkZXNjcmlwdGlvblN0YXJ0KSA9PiB7XG4gICAgICBpZiAoIWxvb2tzTGlrZU1vbnN0ZXJOYW1lSW5saW5lKG1heWJlTmFtZSwgMSkpIHtcbiAgICAgICAgcmV0dXJuIG1hdGNoO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYCR7cHVuY3R9XFxuJHttYXliZU5hbWV9XFxuJHtkZXNjcmlwdGlvblN0YXJ0fWA7XG4gICAgfVxuICApO1xuXG4gIC8vIENhc2UgMjpcbiAgLy8gTWlkLXNlbnRlbmNlIGVtYmVkZGVkIE1VTFRJLVdPUkQgbmFtZSB3aXRoIGEgc2hvcnQgbG93ZXJjYXNlIHRhaWwuXG4gIC8vXG4gIC8vIFwiLi4uIGltbXVuZSAxIGRheSBDQU5ZT04gQVBFIGlmIHBhc3MpLlwiXG4gIC8vID0+IFwiLi4uIGltbXVuZSAxIGRheSBpZiBwYXNzKS5cXG5DQU5ZT04gQVBFXCJcbiAgLy9cbiAgLy8gVGhpcyByZXF1aXJlcyAyKyB1cHBlcmNhc2Ugd29yZHMgc28gd2UgZG8gbm90IGFjY2lkZW50YWxseSByaXAgb3V0XG4gIC8vIERFWCAvIENIQSAvIENPTiAvIGV0Yy5cbiAgdGV4dCA9IHRleHQucmVwbGFjZShcbiAgICAvKFthLXowLTkpXFxdXSlcXHMrKFtBLVpdW0EtWjAtOSwnXHUyMDE5LV0qKD86XFxzK1tBLVpdW0EtWjAtOSwnXHUyMDE5LV0rKXsxLDN9KVxccysoW2Etel1bXi5cXHJcXG5dezAsMzB9Wy4pXT8pL2csXG4gICAgKG1hdGNoLCBwcmVmaXhFbmQsIG1heWJlTmFtZSwgc3VmZml4KSA9PiB7XG4gICAgICBpZiAoIWxvb2tzTGlrZU1vbnN0ZXJOYW1lSW5saW5lKG1heWJlTmFtZSwgMikpIHtcbiAgICAgICAgcmV0dXJuIG1hdGNoO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYCR7cHJlZml4RW5kfSAke3N1ZmZpeH1cXG4ke21heWJlTmFtZX1gO1xuICAgIH1cbiAgKTtcblxuICAvLyBDYXNlIDM6XG4gIC8vIFRyYWlsaW5nIG5hbWUgYXQgdGhlIGVuZCBvZiBhIGJsb2NrLlxuICAvL1xuICAvLyBcIi4uLiB3b29kZW4gc3Rha2Ugd2hpbGUgYXQgMCBIUC4gU05BS0UsIENPQlJBXCJcbiAgLy8gPT4gXCIuLi4gd29vZGVuIHN0YWtlIHdoaWxlIGF0IDAgSFAuXFxuU05BS0UsIENPQlJBXCJcbiAgdGV4dCA9IHRleHQucmVwbGFjZShcbiAgICAvKFsuIT9dKVxccysoW0EtWl1bQS1aMC05LCdcdTIwMTktXSooPzpcXHMrW0EtWl1bQS1aMC05LCdcdTIwMTktXSopezAsM30pJC9nbSxcbiAgICAobWF0Y2gsIHB1bmN0LCBtYXliZU5hbWUpID0+IHtcbiAgICAgIGlmICghbG9va3NMaWtlTW9uc3Rlck5hbWVJbmxpbmUobWF5YmVOYW1lLCAxKSkge1xuICAgICAgICByZXR1cm4gbWF0Y2g7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBgJHtwdW5jdH1cXG4ke21heWJlTmFtZX1gO1xuICAgIH1cbiAgKTtcblxuICByZXR1cm4gdGV4dDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNwbGl0UmF3U2hhZG93ZGFya0Jsb2NrcyhpbnB1dDogc3RyaW5nKTogc3RyaW5nW10ge1xuICBjb25zdCBub3JtYWxpemVkSW5wdXQgPSBub3JtYWxpemVFbWJlZGRlZE1vbnN0ZXJOYW1lcyhpbnB1dCk7XG5cbiAgY29uc3QgbGluZXMgPSBub3JtYWxpemVkSW5wdXRcbiAgICAuc3BsaXQoL1xcclxcbnxcXG58XFxyLylcbiAgICAubWFwKChsaW5lKSA9PiBsaW5lLnRyaW0oKSlcbiAgICAuZmlsdGVyKChsaW5lKSA9PiBsaW5lLmxlbmd0aCA+IDApO1xuXG4gIGNvbnN0IGJsb2Nrczogc3RyaW5nW10gPSBbXTtcbiAgbGV0IGN1cnJlbnRCbG9jazogc3RyaW5nW10gPSBbXTtcblxuICBjb25zdCBoYXNTdGF0QW5jaG9yID0gKHRleHQ6IHN0cmluZyk6IGJvb2xlYW4gPT5cbiAgICAvXFxiQUNcXGIvaS50ZXN0KHRleHQpICYmXG4gICAgL1xcYkhQXFxiL2kudGVzdCh0ZXh0KSAmJlxuICAgIC9cXGJBVEtcXGIvaS50ZXN0KHRleHQpICYmXG4gICAgL1xcYkxWXFxiL2kudGVzdCh0ZXh0KTtcblxuICBjb25zdCBpc0xpa2VseU1vbnN0ZXJOYW1lID0gKGxpbmU6IHN0cmluZyk6IGJvb2xlYW4gPT4ge1xuICAgIGlmIChsaW5lLmxlbmd0aCA8IDMgfHwgbGluZS5sZW5ndGggPiA0MCkgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiBsb29rc0xpa2VNb25zdGVyTmFtZUlubGluZShsaW5lLCAxKTtcbiAgfTtcblxuICBjb25zdCBpc0FiaWxpdHlMZWFkID0gKGxpbmU6IHN0cmluZyk6IGJvb2xlYW4gPT4ge1xuICAgIHJldHVybiAvXltBLVpdW0EtWmEtejAtOSdcdTIwMTktXXswLDQwfVxcLi8udGVzdChsaW5lKTtcbiAgfTtcblxuICBjb25zdCBpc0Rlc2NyaXB0aW9uTGlrZSA9IChsaW5lOiBzdHJpbmcpOiBib29sZWFuID0+IHtcbiAgICBpZiAoaXNMaWtlbHlNb25zdGVyTmFtZShsaW5lKSkgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChpc0FiaWxpdHlMZWFkKGxpbmUpKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKC9cXGJBQ1xcYnxcXGJIUFxcYnxcXGJBVEtcXGJ8XFxiQUxcXGJ8XFxiTFZcXGJ8XFxiTVZcXGIvLnRlc3QobGluZSkpIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gL15bQS1aXS8udGVzdChsaW5lKSAmJiAvW2Etel0vLnRlc3QobGluZSk7XG4gIH07XG5cbiAgY29uc3QgdXBjb21pbmdIYXNTdGF0QW5jaG9yID0gKHN0YXJ0SW5kZXg6IG51bWJlciwgbG9va2FoZWFkID0gNik6IGJvb2xlYW4gPT4ge1xuICAgIGNvbnN0IHRleHQgPSBsaW5lcy5zbGljZShzdGFydEluZGV4LCBzdGFydEluZGV4ICsgbG9va2FoZWFkKS5qb2luKFwiIFwiKTtcbiAgICByZXR1cm4gaGFzU3RhdEFuY2hvcih0ZXh0KTtcbiAgfTtcblxuICBjb25zdCBibG9ja1N0YXJ0c1dpdGhOYW1lID0gKGJsb2NrOiBzdHJpbmdbXSk6IGJvb2xlYW4gPT4ge1xuICAgIGlmIChibG9jay5sZW5ndGggPT09IDApIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gaXNMaWtlbHlNb25zdGVyTmFtZShibG9ja1swXSk7XG4gIH07XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGxpbmUgPSBsaW5lc1tpXTtcblxuICAgIGlmIChjdXJyZW50QmxvY2subGVuZ3RoID09PSAwKSB7XG4gICAgICBjdXJyZW50QmxvY2sucHVzaChsaW5lKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGN1cnJlbnRUZXh0ID0gY3VycmVudEJsb2NrLmpvaW4oXCIgXCIpO1xuICAgIGNvbnN0IGN1cnJlbnRIYXNTdGF0ID0gaGFzU3RhdEFuY2hvcihjdXJyZW50VGV4dCk7XG4gICAgY29uc3QgY3VycmVudFN0YXJ0ZWRXaXRoTmFtZSA9IGJsb2NrU3RhcnRzV2l0aE5hbWUoY3VycmVudEJsb2NrKTtcblxuICAgIGNvbnN0IHNob3VsZFN0YXJ0TmV3QnlMZWFkaW5nTmFtZSA9XG4gICAgICBjdXJyZW50SGFzU3RhdCAmJlxuICAgICAgY3VycmVudFN0YXJ0ZWRXaXRoTmFtZSAmJlxuICAgICAgaXNMaWtlbHlNb25zdGVyTmFtZShsaW5lKTtcblxuICAgIGNvbnN0IHNob3VsZFN0YXJ0TmV3QnlEZXNjcmlwdGlvbiA9XG4gICAgICBjdXJyZW50SGFzU3RhdCAmJlxuICAgICAgaXNEZXNjcmlwdGlvbkxpa2UobGluZSkgJiZcbiAgICAgIHVwY29taW5nSGFzU3RhdEFuY2hvcihpLCA2KTtcblxuICAgIGlmIChzaG91bGRTdGFydE5ld0J5TGVhZGluZ05hbWUgfHwgc2hvdWxkU3RhcnROZXdCeURlc2NyaXB0aW9uKSB7XG4gICAgICBibG9ja3MucHVzaChjdXJyZW50QmxvY2suam9pbihcIlxcblwiKSk7XG4gICAgICBjdXJyZW50QmxvY2sgPSBbbGluZV07XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjdXJyZW50QmxvY2sucHVzaChsaW5lKTtcbiAgfVxuXG4gIGlmIChjdXJyZW50QmxvY2subGVuZ3RoID4gMCkge1xuICAgIGJsb2Nrcy5wdXNoKGN1cnJlbnRCbG9jay5qb2luKFwiXFxuXCIpKTtcbiAgfVxuXG4gIHJldHVybiBibG9ja3M7XG59IiwgImltcG9ydCB7IEFwcCwgTW9kYWwsfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB0eXBlIFNoYWRvd2RhcmtTdGF0YmxvY2tzUGx1Z2luIGZyb20gXCIuLi9tYWluXCI7XG5pbXBvcnQgeyBwYXJzZUZyb250bWF0dGVyIH0gZnJvbSBcIi4uL3BhcnNpbmcvcGFyc2VGcm9udG1hdHRlclwiO1xuaW1wb3J0IHsgcmVuZGVyTW9uc3RlckJsb2NrIH0gZnJvbSBcIi4uL3JlbmRlci9yZW5kZXJNb25zdGVyQmxvY2tcIjtcbmltcG9ydCB7IE1lbnUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IHR5cGUgTW9uc3RlckluZGV4RW50cnkgfSBmcm9tIFwiLi4vc2VydmljZXMvbW9uc3RlckluZGV4U2VydmljZVwiO1xuXG5leHBvcnQgY2xhc3MgTW9uc3RlckJyb3dzZXJNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgICBwcml2YXRlIHBsdWdpbjogU2hhZG93ZGFya1N0YXRibG9ja3NQbHVnaW47XG4gICAgcHJpdmF0ZSBhbGxNb25zdGVyczogTW9uc3RlckluZGV4RW50cnlbXSA9IFtdO1xuICAgIHByaXZhdGUgZmlsdGVyZWRNb25zdGVyczogTW9uc3RlckluZGV4RW50cnlbXSA9IFtdO1xuXG4gICAgcHJpdmF0ZSBzZWFyY2hUZXh0ID0gXCJcIjtcbiAgICBwcml2YXRlIHNlbGVjdGVkU291cmNlID0gXCJcIjtcbiAgICBwcml2YXRlIHNlbGVjdGVkVGFnID0gXCJcIjtcbiAgICBwcml2YXRlIHNlbGVjdGVkTWF4TGV2ZWwgPSBcIlwiO1xuXG4gICAgcHJpdmF0ZSByZXN1bHRzRWwhOiBIVE1MRGl2RWxlbWVudDtcblxuICAgIHByaXZhdGUgaG92ZXJDYXJkRWwhOiBIVE1MRGl2RWxlbWVudDtcbiAgICBwcml2YXRlIGhvdmVyUHJldmlld0VsITogSFRNTERpdkVsZW1lbnQ7XG4gICAgcHJpdmF0ZSBob3ZlckhpZGVUaW1lb3V0OiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgICBwcml2YXRlIGhvdmVyTW91c2VYID0gMDtcbiAgICBwcml2YXRlIGhvdmVyTW91c2VZID0gMDsgICAgICAgXG4gICAgcHJpdmF0ZSBob3ZlclNob3dUaW1lb3V0OiBudW1iZXIgfCBudWxsID0gbnVsbDsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IFNoYWRvd2RhcmtTdGF0YmxvY2tzUGx1Z2luKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgfVxuXG4gIGFzeW5jIG9uT3BlbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCwgdGl0bGVFbCB9ID0gdGhpcztcbiAgICB0aXRsZUVsLnNldFRleHQoXCJNb25zdGVyIGJyb3dzZXJcIik7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgY29udGVudEVsLmFkZENsYXNzKFwic2QtbW9uc3Rlci1icm93c2VyLW1vZGFsXCIpO1xuICAgIFxuICAgIHRoaXMuYWxsTW9uc3RlcnMgPSBhd2FpdCB0aGlzLnBsdWdpbi5nZXRBbGxNb25zdGVySW5kZXhFbnRyaWVzKCk7XG4gICAgdGhpcy5maWx0ZXJlZE1vbnN0ZXJzID0gWy4uLnRoaXMuYWxsTW9uc3RlcnNdO1xuXG4gICAgY29uc3QgY29udHJvbHNFbCA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwic2QtbW9uc3Rlci1icm93c2VyLWNvbnRyb2xzXCIgfSk7XG5cbiAgICBjb25zdCBjcmVhdGVGaWx0ZXJDYXJkID0gKGxhYmVsVGV4dDogc3RyaW5nKTogSFRNTERpdkVsZW1lbnQgPT4ge1xuICAgICAgY29uc3QgY2FyZCA9IGNvbnRyb2xzRWwuY3JlYXRlRGl2KHsgY2xzOiBcInNkLW1vbnN0ZXItYnJvd3Nlci1maWx0ZXJcIiB9KTtcbiAgICAgIGNhcmQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7XG4gICAgICAgIGNsczogXCJzZC1tb25zdGVyLWJyb3dzZXItZmlsdGVyLWxhYmVsXCIsXG4gICAgICAgIHRleHQ6IGxhYmVsVGV4dFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gY2FyZDtcbiAgICB9O1xuXG4gICAgLy8gU2VhcmNoXG4gICAgY29uc3Qgc2VhcmNoQ2FyZCA9IGNyZWF0ZUZpbHRlckNhcmQoXCJTZWFyY2hcIik7XG4gICAgY29uc3Qgc2VhcmNoSW5wdXRFbCA9IHNlYXJjaENhcmQuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRleHRcIixcbiAgICAgIHBsYWNlaG9sZGVyOiBcIlNlYXJjaCBieSBuYW1lLi4uXCIsXG4gICAgICBjbHM6IFwic2QtbW9uc3Rlci1icm93c2VyLWlucHV0XCJcbiAgICB9KTtcbiAgICBzZWFyY2hJbnB1dEVsLnZhbHVlID0gdGhpcy5zZWFyY2hUZXh0O1xuICAgIHNlYXJjaElucHV0RWwuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHtcbiAgICAgIHRoaXMuc2VhcmNoVGV4dCA9IHNlYXJjaElucHV0RWwudmFsdWUudHJpbSgpLnRvTG93ZXJDYXNlKCk7XG4gICAgICB0aGlzLmFwcGx5RmlsdGVycygpO1xuICAgIH0pO1xuXG4gICAgLy8gU291cmNlXG4gICAgY29uc3Qgc291cmNlQ2FyZCA9IGNyZWF0ZUZpbHRlckNhcmQoXCJTb3VyY2VcIik7XG4gICAgY29uc3Qgc291cmNlU2VsZWN0RWwgPSBzb3VyY2VDYXJkLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHtcbiAgICAgIGNsczogXCJzZC1tb25zdGVyLWJyb3dzZXItc2VsZWN0XCJcbiAgICB9KTtcblxuICAgIGNvbnN0IGFsbFNvdXJjZXMgPSBBcnJheS5mcm9tKFxuICAgICAgbmV3IFNldCh0aGlzLmFsbE1vbnN0ZXJzLm1hcCgobSkgPT4gbS5zb3VyY2UpLmZpbHRlcihCb29sZWFuKSlcbiAgICApLnNvcnQoKGE6IHN0cmluZywgYjogc3RyaW5nKSA9PiBhLmxvY2FsZUNvbXBhcmUoYikpO1xuXG4gICAgc291cmNlU2VsZWN0RWwuYXBwZW5kQ2hpbGQobmV3IE9wdGlvbihcIkFsbFwiLCBcIlwiKSk7XG4gICAgZm9yIChjb25zdCBzb3VyY2Ugb2YgYWxsU291cmNlcykge1xuICAgICAgc291cmNlU2VsZWN0RWwuYXBwZW5kQ2hpbGQobmV3IE9wdGlvbihzb3VyY2UsIHNvdXJjZSkpO1xuICAgIH1cbiAgICBzb3VyY2VTZWxlY3RFbC52YWx1ZSA9IHRoaXMuc2VsZWN0ZWRTb3VyY2U7XG4gICAgc291cmNlU2VsZWN0RWwuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICB0aGlzLnNlbGVjdGVkU291cmNlID0gc291cmNlU2VsZWN0RWwudmFsdWU7XG4gICAgICB0aGlzLmFwcGx5RmlsdGVycygpO1xuICAgIH0pO1xuXG4gICAgLy8gVGFnXG4gICAgY29uc3QgdGFnQ2FyZCA9IGNyZWF0ZUZpbHRlckNhcmQoXCJUYWdcIik7XG4gICAgY29uc3QgdGFnU2VsZWN0RWwgPSB0YWdDYXJkLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHtcbiAgICAgIGNsczogXCJzZC1tb25zdGVyLWJyb3dzZXItc2VsZWN0XCJcbiAgICB9KTtcblxuICAgIGNvbnN0IGFsbFRhZ3NTZXQgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBmb3IgKGNvbnN0IG1vbnN0ZXIgb2YgdGhpcy5hbGxNb25zdGVycykge1xuICAgICAgZm9yIChjb25zdCB0YWcgb2YgbW9uc3Rlci50YWdzKSB7XG4gICAgICAgIGlmICh0YWcpIGFsbFRhZ3NTZXQuYWRkKHRhZyk7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGFsbFRhZ3MgPSBBcnJheS5mcm9tKGFsbFRhZ3NTZXQpLnNvcnQoKGE6IHN0cmluZywgYjogc3RyaW5nKSA9PlxuICAgICAgYS5sb2NhbGVDb21wYXJlKGIpXG4gICAgKTtcblxuICAgIHRhZ1NlbGVjdEVsLmFwcGVuZENoaWxkKG5ldyBPcHRpb24oXCJBbGxcIiwgXCJcIikpO1xuICAgIGZvciAoY29uc3QgdGFnIG9mIGFsbFRhZ3MpIHtcbiAgICAgIHRhZ1NlbGVjdEVsLmFwcGVuZENoaWxkKG5ldyBPcHRpb24odGFnLCB0YWcpKTtcbiAgICB9XG4gICAgdGFnU2VsZWN0RWwudmFsdWUgPSB0aGlzLnNlbGVjdGVkVGFnO1xuICAgIHRhZ1NlbGVjdEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5zZWxlY3RlZFRhZyA9IHRhZ1NlbGVjdEVsLnZhbHVlO1xuICAgICAgdGhpcy5hcHBseUZpbHRlcnMoKTtcbiAgICB9KTtcblxuICAgIC8vIE1heCBMZXZlbFxuICAgIGNvbnN0IG1heExldmVsQ2FyZCA9IGNyZWF0ZUZpbHRlckNhcmQoXCJNYXggTGV2ZWxcIik7XG4gICAgY29uc3QgbWF4TGV2ZWxTZWxlY3RFbCA9IG1heExldmVsQ2FyZC5jcmVhdGVFbChcInNlbGVjdFwiLCB7XG4gICAgICBjbHM6IFwic2QtbW9uc3Rlci1icm93c2VyLXNlbGVjdFwiXG4gICAgfSk7XG5cbiAgICBtYXhMZXZlbFNlbGVjdEVsLmFwcGVuZENoaWxkKG5ldyBPcHRpb24oXCJBbnlcIiwgXCJcIikpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IDIwOyBpKyspIHtcbiAgICAgIG1heExldmVsU2VsZWN0RWwuYXBwZW5kQ2hpbGQobmV3IE9wdGlvbihTdHJpbmcoaSksIFN0cmluZyhpKSkpO1xuICAgIH1cbiAgICBtYXhMZXZlbFNlbGVjdEVsLnZhbHVlID0gdGhpcy5zZWxlY3RlZE1heExldmVsO1xuICAgIG1heExldmVsU2VsZWN0RWwuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICB0aGlzLnNlbGVjdGVkTWF4TGV2ZWwgPSBtYXhMZXZlbFNlbGVjdEVsLnZhbHVlO1xuICAgICAgdGhpcy5hcHBseUZpbHRlcnMoKTtcbiAgICB9KTtcblxuICAgIC8vIEFjdGlvbnNcbiAgICBjb25zdCBhY3Rpb25zRWwgPSBjb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcInNkLW1vbnN0ZXItYnJvd3Nlci1hY3Rpb25zXCIgfSk7XG4gICAgY29uc3QgY2xlYXJCdXR0b24gPSBhY3Rpb25zRWwuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcIm1vZC1jdGEgc2QtbW9uc3Rlci1icm93c2VyLWNsZWFyLWJ1dHRvblwiLFxuICAgICAgdGV4dDogXCJDbGVhciBmaWx0ZXJzXCJcbiAgICB9KTtcblxuICAgIGNsZWFyQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLnNlYXJjaFRleHQgPSBcIlwiO1xuICAgICAgdGhpcy5zZWxlY3RlZFNvdXJjZSA9IFwiXCI7XG4gICAgICB0aGlzLnNlbGVjdGVkVGFnID0gXCJcIjtcbiAgICAgIHRoaXMuc2VsZWN0ZWRNYXhMZXZlbCA9IFwiXCI7XG5cbiAgICAgIHNlYXJjaElucHV0RWwudmFsdWUgPSBcIlwiO1xuICAgICAgc291cmNlU2VsZWN0RWwudmFsdWUgPSBcIlwiO1xuICAgICAgdGFnU2VsZWN0RWwudmFsdWUgPSBcIlwiO1xuICAgICAgbWF4TGV2ZWxTZWxlY3RFbC52YWx1ZSA9IFwiXCI7XG5cbiAgICAgIHRoaXMuYXBwbHlGaWx0ZXJzKCk7XG4gICAgfSk7XG5cbiAgICAvLyBSZXN1bHRzIGNvbnRhaW5lclxuICAgIHRoaXMucmVzdWx0c0VsID0gY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogXCJzZC1tb25zdGVyLWJyb3dzZXItcmVzdWx0c1wiIH0pO1xuXG4gICAgdGhpcy5yZXN1bHRzRWwuYWRkRXZlbnRMaXN0ZW5lcihcInNjcm9sbFwiLCAoKSA9PiB7XG4gICAgICAgIHRoaXMuaGlkZUhvdmVyQ2FyZCgpO1xuICAgIH0pO1xuXG4gICAgLy8gSG92ZXIgY2FyZFxuICAgIHRoaXMuaG92ZXJDYXJkRWwgPSBjb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcInNkLW1vbnN0ZXItYnJvd3Nlci1ob3Zlci1jYXJkXCIgfSk7XG4gICAgdGhpcy5ob3ZlclByZXZpZXdFbCA9IHRoaXMuaG92ZXJDYXJkRWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1tb25zdGVyLWJyb3dzZXItaG92ZXItY2FyZC1pbm5lclwiXG4gICAgfSk7XG5cbiAgICB0aGlzLmhvdmVyQ2FyZEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWVudGVyXCIsICgpID0+IHtcbiAgICAgIHRoaXMuY2xlYXJIb3ZlckhpZGVUaW1lb3V0KCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLmhvdmVyQ2FyZEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWxlYXZlXCIsICgpID0+IHtcbiAgICAgIHRoaXMuc2NoZWR1bGVIaWRlSG92ZXJDYXJkKCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnJlbmRlclJlc3VsdHMoKTtcbiAgfVxuXG4gIG9uQ2xvc2UoKTogdm9pZCB7XG4gICAgdGhpcy5jbGVhckhvdmVySGlkZVRpbWVvdXQoKTtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBjbGVhckhvdmVySGlkZVRpbWVvdXQoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuaG92ZXJIaWRlVGltZW91dCAhPT0gbnVsbCkge1xuICAgICAgd2luZG93LmNsZWFyVGltZW91dCh0aGlzLmhvdmVySGlkZVRpbWVvdXQpO1xuICAgICAgdGhpcy5ob3ZlckhpZGVUaW1lb3V0ID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNjaGVkdWxlSGlkZUhvdmVyQ2FyZCgpOiB2b2lkIHtcbiAgICB0aGlzLmNsZWFySG92ZXJIaWRlVGltZW91dCgpO1xuICAgIHRoaXMuaG92ZXJIaWRlVGltZW91dCA9IHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMuaGlkZUhvdmVyQ2FyZCgpO1xuICAgIH0sIDEyMCk7XG4gIH1cblxuICBwcml2YXRlIGhpZGVIb3ZlckNhcmQoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuaG92ZXJDYXJkRWwpIHtcbiAgICAgIHRoaXMuaG92ZXJDYXJkRWwuY2xhc3NMaXN0LnJlbW92ZShcImlzLXZpc2libGVcIik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzaG93SG92ZXJDYXJkKG1vbnN0ZXI6IE1vbnN0ZXJJbmRleEVudHJ5KTogdm9pZCB7XG4gICAgY29uc3QgcmVzdWx0ID0gcGFyc2VGcm9udG1hdHRlcihtb25zdGVyLmZyb250bWF0dGVyKTtcbiAgICBpZiAoIXJlc3VsdC5zdWNjZXNzIHx8ICFyZXN1bHQuZGF0YSkgcmV0dXJuO1xuXG4gICAgdGhpcy5ob3ZlclByZXZpZXdFbC5lbXB0eSgpO1xuICAgIHJlbmRlck1vbnN0ZXJCbG9jayhcbiAgICAgICAgdGhpcy5ob3ZlclByZXZpZXdFbCxcbiAgICAgICAgcmVzdWx0LmRhdGEsXG4gICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLFxuICAgICAgICByZXN1bHQud2FybmluZ3NcbiAgICApO1xuXG4gICAgdGhpcy5ob3ZlckNhcmRFbC5jbGFzc0xpc3QuYWRkKFwiaXMtdmlzaWJsZVwiKTtcbiAgICB0aGlzLnBvc2l0aW9uSG92ZXJDYXJkKCk7XG4gICAgfVxuXG4gIHByaXZhdGUgYXBwbHlGaWx0ZXJzKCk6IHZvaWQge1xuICAgIHRoaXMuZmlsdGVyZWRNb25zdGVycyA9IHRoaXMuYWxsTW9uc3RlcnMuZmlsdGVyKChtb25zdGVyKSA9PiB7XG4gICAgICBjb25zdCBtYXRjaGVzU2VhcmNoID1cbiAgICAgICAgIXRoaXMuc2VhcmNoVGV4dCB8fCBtb25zdGVyLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyh0aGlzLnNlYXJjaFRleHQpO1xuXG4gICAgICBjb25zdCBtYXRjaGVzU291cmNlID1cbiAgICAgICAgIXRoaXMuc2VsZWN0ZWRTb3VyY2UgfHwgbW9uc3Rlci5zb3VyY2UgPT09IHRoaXMuc2VsZWN0ZWRTb3VyY2U7XG5cbiAgICAgIGNvbnN0IG1hdGNoZXNUYWcgPVxuICAgICAgICAhdGhpcy5zZWxlY3RlZFRhZyB8fCBtb25zdGVyLnRhZ3MuaW5jbHVkZXModGhpcy5zZWxlY3RlZFRhZyk7XG5cbiAgICAgIGNvbnN0IG1hdGNoZXNMZXZlbCA9XG4gICAgICAgICF0aGlzLnNlbGVjdGVkTWF4TGV2ZWwgfHxcbiAgICAgICAgKE51bWJlcihtb25zdGVyLmxldmVsKSB8fCAwKSA8PSBOdW1iZXIodGhpcy5zZWxlY3RlZE1heExldmVsKTtcblxuICAgICAgcmV0dXJuIG1hdGNoZXNTZWFyY2ggJiYgbWF0Y2hlc1NvdXJjZSAmJiBtYXRjaGVzVGFnICYmIG1hdGNoZXNMZXZlbDtcbiAgICB9KTtcblxuICAgIHRoaXMucmVuZGVyUmVzdWx0cygpO1xuICB9XG4gICAgcHJpdmF0ZSBwb3NpdGlvbkhvdmVyQ2FyZCgpOiB2b2lkIHtcbiAgICAgICAgaWYgKCF0aGlzLmhvdmVyQ2FyZEVsLmNsYXNzTGlzdC5jb250YWlucyhcImlzLXZpc2libGVcIikpIHJldHVybjtcblxuICAgICAgICBjb25zdCBvZmZzZXQgPSAxNjtcbiAgICAgICAgY29uc3QgY2FyZFdpZHRoID0gTWF0aC5taW4oNDIwLCBNYXRoLmZsb29yKHdpbmRvdy5pbm5lcldpZHRoICogMC40MikpO1xuICAgICAgICBjb25zdCBjYXJkSGVpZ2h0ID0gTWF0aC5taW4oNTIwLCBNYXRoLmZsb29yKHdpbmRvdy5pbm5lckhlaWdodCAqIDAuNykpO1xuXG4gICAgICAgIGxldCBsZWZ0ID0gdGhpcy5ob3Zlck1vdXNlWCArIG9mZnNldDtcbiAgICAgICAgbGV0IHRvcCA9IHRoaXMuaG92ZXJNb3VzZVkgKyBvZmZzZXQ7XG5cbiAgICAgICAgaWYgKGxlZnQgKyBjYXJkV2lkdGggPiB3aW5kb3cuaW5uZXJXaWR0aCAtIDEyKSB7XG4gICAgICAgICAgICBsZWZ0ID0gdGhpcy5ob3Zlck1vdXNlWCAtIGNhcmRXaWR0aCAtIG9mZnNldDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsZWZ0IDwgMTIpIHtcbiAgICAgICAgICAgIGxlZnQgPSAxMjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0b3AgKyBjYXJkSGVpZ2h0ID4gd2luZG93LmlubmVySGVpZ2h0IC0gMTIpIHtcbiAgICAgICAgICAgIHRvcCA9IHdpbmRvdy5pbm5lckhlaWdodCAtIGNhcmRIZWlnaHQgLSAxMjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0b3AgPCAxMikge1xuICAgICAgICAgICAgdG9wID0gMTI7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmhvdmVyQ2FyZEVsLnN0eWxlLmxlZnQgPSBgJHtsZWZ0fXB4YDtcbiAgICAgICAgdGhpcy5ob3ZlckNhcmRFbC5zdHlsZS50b3AgPSBgJHt0b3B9cHhgO1xuICAgICAgICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJSZXN1bHRzKCk6IHZvaWQge1xuICAgIHRoaXMucmVzdWx0c0VsLmVtcHR5KCk7XG4gICAgdGhpcy5oaWRlSG92ZXJDYXJkKCk7XG5cbiAgICBjb25zdCBzdW1tYXJ5ID0gdGhpcy5yZXN1bHRzRWwuY3JlYXRlRGl2KHsgY2xzOiBcInNkLW1vbnN0ZXItYnJvd3Nlci1zdW1tYXJ5XCIgfSk7XG4gICAgc3VtbWFyeS5zZXRUZXh0KGAke3RoaXMuZmlsdGVyZWRNb25zdGVycy5sZW5ndGh9IG1vbnN0ZXIocylgKTtcblxuICAgIGlmICh0aGlzLmZpbHRlcmVkTW9uc3RlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLnJlc3VsdHNFbC5jcmVhdGVEaXYoe1xuICAgICAgICBjbHM6IFwic2QtbW9uc3Rlci1icm93c2VyLWVtcHR5XCIsXG4gICAgICAgIHRleHQ6IFwiTm8gbW9uc3RlcnMgbWF0Y2ggdGhvc2UgZmlsdGVycy5cIlxuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBtb25zdGVyIG9mIHRoaXMuZmlsdGVyZWRNb25zdGVycykge1xuICAgICAgY29uc3Qgcm93ID0gdGhpcy5yZXN1bHRzRWwuY3JlYXRlRGl2KHsgY2xzOiBcInNkLW1vbnN0ZXItYnJvd3Nlci1yb3dcIiB9KTtcblxuICAgIHJvdy5hZGRFdmVudExpc3RlbmVyKFwibW91c2VlbnRlclwiLCAoZXZ0OiBNb3VzZUV2ZW50KSA9PiB7XG4gICAgICAgIHRoaXMuY2xlYXJIb3ZlckhpZGVUaW1lb3V0KCk7XG5cbiAgICAgICAgdGhpcy5ob3Zlck1vdXNlWCA9IGV2dC5jbGllbnRYO1xuICAgICAgICB0aGlzLmhvdmVyTW91c2VZID0gZXZ0LmNsaWVudFk7XG5cbiAgICAgICAgaWYgKHRoaXMuaG92ZXJTaG93VGltZW91dCkge1xuICAgICAgICAgICAgd2luZG93LmNsZWFyVGltZW91dCh0aGlzLmhvdmVyU2hvd1RpbWVvdXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5ob3ZlclNob3dUaW1lb3V0ID0gd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zaG93SG92ZXJDYXJkKG1vbnN0ZXIpO1xuICAgICAgICB9LCAxMjApO1xuICAgICAgICB9KTtcblxuICAgICAgICByb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCAoZXZ0OiBNb3VzZUV2ZW50KSA9PiB7XG4gICAgICAgIHRoaXMuaG92ZXJNb3VzZVggPSBldnQuY2xpZW50WDtcbiAgICAgICAgdGhpcy5ob3Zlck1vdXNlWSA9IGV2dC5jbGllbnRZO1xuICAgICAgICB0aGlzLnBvc2l0aW9uSG92ZXJDYXJkKCk7XG4gICAgIH0pO1xuXG4gICAgICAgIHJvdy5hZGRFdmVudExpc3RlbmVyKFwibW91c2VsZWF2ZVwiLCAoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5ob3ZlclNob3dUaW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgd2luZG93LmNsZWFyVGltZW91dCh0aGlzLmhvdmVyU2hvd1RpbWVvdXQpO1xuICAgICAgICAgICAgICAgIHRoaXMuaG92ZXJTaG93VGltZW91dCA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuc2NoZWR1bGVIaWRlSG92ZXJDYXJkKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICByb3cuY3JlYXRlRGl2KHtcbiAgICAgICAgY2xzOiBcInNkLW1vbnN0ZXItYnJvd3Nlci1uYW1lXCIsXG4gICAgICAgIHRleHQ6IG1vbnN0ZXIubmFtZVxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IG1ldGFQYXJ0cyA9IFtcbiAgICAgICAgbW9uc3Rlci5sZXZlbCA/IGBMViAke21vbnN0ZXIubGV2ZWx9YCA6IFwiXCIsXG4gICAgICAgIG1vbnN0ZXIuYWxpZ25tZW50ID8gYEFMICR7bW9uc3Rlci5hbGlnbm1lbnR9YCA6IFwiXCIsXG4gICAgICAgIG1vbnN0ZXIuc291cmNlIHx8IFwiXCJcbiAgICAgIF0uZmlsdGVyKEJvb2xlYW4pO1xuXG4gICAgICByb3cuY3JlYXRlRGl2KHtcbiAgICAgICAgY2xzOiBcInNkLW1vbnN0ZXItYnJvd3Nlci1tZXRhXCIsXG4gICAgICAgIHRleHQ6IG1ldGFQYXJ0cy5qb2luKFwiIFx1MjAyMiBcIilcbiAgICAgIH0pO1xuXG4gICAgICBpZiAobW9uc3Rlci50YWdzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3QgdGFnc0VsID0gcm93LmNyZWF0ZURpdih7IGNsczogXCJzZC1tb25zdGVyLWJyb3dzZXItdGFnc1wiIH0pO1xuICAgICAgICBmb3IgKGNvbnN0IHRhZyBvZiBtb25zdGVyLnRhZ3MpIHtcbiAgICAgICAgICB0YWdzRWwuY3JlYXRlRGl2KHtcbiAgICAgICAgICAgIGNsczogXCJzZC1tb25zdGVyLWJyb3dzZXItdGFnXCIsXG4gICAgICAgICAgICB0ZXh0OiB0YWdcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jICgpID0+IHtcbiAgICAgICAgYXdhaXQgdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYodHJ1ZSkub3BlbkZpbGUobW9uc3Rlci5maWxlKTtcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgIH0pO1xuICAgIHJvdy5hZGRFdmVudExpc3RlbmVyKFwiY29udGV4dG1lbnVcIiwgKGV2dDogTW91c2VFdmVudCkgPT4ge1xuICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBjb25zdCBtZW51ID0gbmV3IE1lbnUoKTtcblxuICAgICAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+XG4gICAgICAgICAgICBpdGVtXG4gICAgICAgICAgICAuc2V0VGl0bGUoXCJPcGVuXCIpXG4gICAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYodHJ1ZSkub3BlbkZpbGUobW9uc3Rlci5maWxlKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICApO1xuXG4gICAgICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT5cbiAgICAgICAgICAgIGl0ZW1cbiAgICAgICAgICAgIC5zZXRUaXRsZShcIk9wZW4gdG8gdGhlIHJpZ2h0XCIpXG4gICAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgbGVhZiA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWFmKFwic3BsaXRcIiwgXCJ2ZXJ0aWNhbFwiKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBsZWFmLm9wZW5GaWxlKG1vbnN0ZXIuZmlsZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICApO1xuXG4gICAgICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT5cbiAgICAgICAgICAgIGl0ZW1cbiAgICAgICAgICAgIC5zZXRUaXRsZShcIkNvcHkgbGlua1wiKVxuICAgICAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGxpbmsgPSBgW1ske21vbnN0ZXIuZmlsZS5iYXNlbmFtZX1dXWA7XG4gICAgICAgICAgICAgICAgYXdhaXQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQobGluayk7XG4gICAgICAgICAgICB9KVxuICAgICAgICApO1xuICAgICAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+XG4gICAgICAgICAgICBpdGVtXG4gICAgICAgICAgICAuc2V0VGl0bGUoXCJDb3B5IGVtYmVkXCIpXG4gICAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZW1iZWQgPSBgIVtbJHttb25zdGVyLmZpbGUuYmFzZW5hbWV9XV1gO1xuICAgICAgICAgICAgICAgIGF3YWl0IG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KGVtYmVkKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICk7XG4gICAgICAgIG1lbnUuc2hvd0F0TW91c2VFdmVudChldnQpO1xuICAgICAgICB9KTtcbiAgICB9XG4gIH1cbn0iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBQUFBLG1CQVNPOzs7QUNUUCxzQkFBcUQ7QUFZckQsU0FBUyxtQkFBbUIsU0FBaUQ7QUFDM0UsUUFBTSxRQUFRLFFBQVEsTUFBTSx1QkFBdUI7QUFDbkQsTUFBSSxDQUFDLE1BQU8sUUFBTztBQUVuQixNQUFJO0FBQ0YsVUFBTSxhQUFTLDJCQUFVLE1BQU0sQ0FBQyxDQUFDO0FBQ2pDLFFBQUksQ0FBQyxVQUFVLE9BQU8sV0FBVyxTQUFVLFFBQU87QUFDbEQsV0FBTztBQUFBLEVBQ1QsU0FBUyxPQUFPO0FBQ2QsWUFBUSxNQUFNLGtEQUFrRCxLQUFLO0FBQ3JFLFdBQU87QUFBQSxFQUNUO0FBQ0Y7QUFFQSxlQUFzQixpQkFDcEIsS0FDQSxlQUNtQjtBQUNuQixRQUFNLGlCQUFhLCtCQUFjLGFBQWE7QUFDOUMsUUFBTSxRQUFRLElBQUksTUFDZixpQkFBaUIsRUFDakI7QUFBQSxJQUNDLENBQUMsU0FDQyxLQUFLLEtBQUssV0FBVyxHQUFHLFVBQVUsR0FBRyxLQUFLLEtBQUssU0FBUyxHQUFHLFVBQVU7QUFBQSxFQUN6RTtBQUVGLFFBQU0sT0FBTyxvQkFBSSxJQUFZO0FBRTdCLGFBQVcsUUFBUSxPQUFPO0FBQ3hCLFVBQU0sVUFBVSxNQUFNLElBQUksTUFBTSxLQUFLLElBQUk7QUFDekMsVUFBTSxjQUFjLG1CQUFtQixPQUFPO0FBRTlDLFFBQUksQ0FBQyxlQUFlLFlBQVksbUJBQW1CLFVBQVc7QUFFOUQsVUFBTSxVQUFVLFlBQVk7QUFDNUIsUUFBSSxNQUFNLFFB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TUFBTSxHQUFHLEVBQy9CLFNBQVMsQ0FBQyxVQUFVO0FBQ25CLGFBQUssUUFBUSxNQUFNLE1BQU0sTUFBTSxLQUFLO0FBQ3BDLGFBQUssZUFBZTtBQUFBLE1BQ3RCLENBQUM7QUFBQSxJQUNMLENBQUM7QUFFSCxRQUFJLHlCQUFRLE9BQU8sRUFDaEIsUUFBUSxLQUFLLEVBQ2IsUUFBUSxDQUFDLFNBQVM7QUFDakIsV0FBSyxXQUFXO0FBQ2hCLFdBQ0csU0FBUyxLQUFLLFFBQVEsTUFBTSxHQUFHLEVBQy9CLFNBQVMsQ0FBQyxVQUFVO0FBQ25CLGFBQUssUUFBUSxNQUFNLE1BQU0sTUFBTSxLQUFLO0FBQ3BDLGFBQUssZUFBZTtBQUFBLE1BQ3RCLENBQUM7QUFBQSxJQUNMLENBQUM7QUFFSCxRQUFJLHlCQUFRLE9BQU8sRUFDaEIsUUFBUSxLQUFLLEVBQ2IsUUFBUSxDQUFDLFNBQVM7QUFDakIsV0FBSyxXQUFXO0FBQ2hCLFdBQ0csU0FBUyxLQUFLLFFBQVEsTUFBTSxHQUFHLEVBQy9CLFNBQVMsQ0FBQyxVQUFVO0FBQ25CLGFBQUssUUFBUSxNQUFNLE1BQU0sTUFBTSxLQUFLO0FBQ3BDLGFBQUssZUFBZTtBQUFBLE1BQ3RCLENBQUM7QUFBQSxJQUNMLENBQUM7QUFFSCxRQUFJLHlCQUFRLE9BQU8sRUFDaEIsUUFBUSxLQUFLLEVBQ2IsUUFBUSxDQUFDLFNBQVM7QUFDakIsV0FBSyxXQUFXO0FBQ2hCLFdBQ0csU0FBUyxLQUFLLFFBQVEsTUFBTSxHQUFHLEVBQy9CLFNBQVMsQ0FBQyxVQUFVO0FBQ25CLGFBQUssUUFBUSxNQUFNLE1BQU0sTUFBTSxLQUFLO0FBQ3BDLGFBQUssZUFBZTtBQUFBLE1BQ3RCLENBQUM7QUFBQSxJQUNMLENBQUM7QUFFSCxRQUFJLHlCQUFRLE9BQU8sRUFDaEIsUUFBUSxLQUFLLEVBQ2IsUUFBUSxDQUFDLFNBQVM7QUFDakIsV0FBSyxXQUFXO0FBQ2hCLFdBQ0csU0FBUyxLQUFLLFFBQVEsTUFBTSxHQUFHLEVBQy9CLFNBQVMsQ0FBQyxVQUFVO0FBQ25CLGFBQUssUUFBUSxN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VUFDTixPQUFPO0FBQUEsWUFDTCxHQUFHO0FBQUEsWUFDSCxNQUFNO0FBQUEsWUFDTixNQUFNLEtBQUs7QUFBQSxVQUNiO0FBQUEsUUFDRixDQUFDO0FBRUQsYUFBSyx1QkFBdUIsSUFBSSxNQUFNLEtBQUssSUFBSTtBQUFBLE1BQ2pELFNBQVMsS0FBSztBQUNaLGdCQUFRLE1BQU0scUNBQXFDLEdBQUc7QUFBQSxNQUN4RDtBQUFBLElBQ0YsR0FBRyxFQUFFO0FBQUEsRUFDUDtBQUFBLEVBRUEsTUFBYyw4QkFBNkM7QUFDekQsVUFBTSxTQUFTLEtBQUssSUFBSSxVQUFVLGdCQUFnQixVQUFVO0FBQzVELFVBQU0sUUFBUSxPQUNYLElBQUksQ0FBQyxTQUFTLEtBQUssSUFBSSxFQUN2QixPQUFPLENBQUMsU0FBK0IsZ0JBQWdCLDZCQUFZO0FBRXRFLGVBQVcsUUFBUSxPQUFPO0FBQ3hCLFlBQU0sS0FBSywyQkFBMkIsSUFBSTtBQUFBLElBQzVDO0FBQUEsRUFDRjtBQUFBLEVBRVEsZUFBZSxNQUEwQjtBQUMvQyxVQUFNLGVBQWUsS0FBSyxZQUFZLGNBQWMscUJBQXFCO0FBQ3pFLFFBQUksd0JBQXdCLGFBQWE7QUFDdkMsbUJBQWEsVUFBVSxJQUFJLDRCQUE0QjtBQUFBLElBQ3pEO0FBQUEsRUFDRjtBQUFBLEVBRVEsZUFBZSxNQUEwQjtBQUMvQyxVQUFNLG1CQUFtQixLQUFLLFlBQVksaUJBQWlCLDZCQUE2QjtBQUN4RixlQUFXLE1BQU0sa0JBQWtCO0FBQ2pDLFNBQUcsVUFBVSxPQUFPLDRCQUE0QjtBQUFBLElBQ2xEO0FBQUEsRUFDRjtBQUFBLEVBRVEsZ0NBQWdDLE1BQTBCO0FBQ2hFLFVBQU0sV0FBVyxLQUFLLFlBQVksaUJBQWlCLGlDQUFpQztBQUNwRixlQUFXLE1BQU0sVUFBVTtBQUN6QixTQUFHLE9BQU87QUFBQSxJQUNaO0FBQUEsRUFDRjtBQUFBLEVBRVEsbUJBQW1CLFNBQWlEO0FBQzFFLFVBQU0sUUFBUSxRQUFRLE1BQU0sdUJBQXVCO0FBQ25ELFFBQUksQ0FBQyxNQUFPLFFBQU87QUFFbkIsUUFBSTtBQUNGLFlBQU0sYUFBUyw0QkFBVSxNQUFNLENBQUMsQ0FBQztBQUNqQyxVQUFJLENBQUMsVUFBVSxPQUFPLFdBQVcsU0FBVSxRQUFPO0FBQ2xELGFBQU87QUFBQSxJQUNULFNBQVMsT0FBTztBQUNkLGNBQVEsTUFBTSxrREFBa0QsS0FBSztBQUNyRSxhQUFPO0FBQUEsSUFDVDtBQUFBLEVBQ0Y7QUFDRjsiLAogICJuYW1lcyI6IFsiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgIm5vcm1hbGl6ZU1vZGlmaWVyIiwgIm5vcm1hbGl6ZUF0dGFjayIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiJdCn0K
