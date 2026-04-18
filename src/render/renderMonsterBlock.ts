import { ShadowdarkMonster, ShadowdarkAttack } from "../types";
import { ShadowdarkStatblocksSettings } from "../settings";

function createDiv(className?: string, text?: string): HTMLDivElement {
  const el = document.createElement("div");
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function createSpan(className?: string, text?: string): HTMLSpanElement {
  const el = document.createElement("span");
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function createList(className?: string): HTMLUListElement {
  const el = document.createElement("ul");
  if (className) el.className = className;
  return el;
}

function createListItem(className?: string): HTMLLIElement {
  const el = document.createElement("li");
  if (className) el.className = className;
  return el;
}

function renderAttackText(attack: ShadowdarkAttack): string {
  if (attack.raw) return attack.raw;

  const parts: string[] = [attack.name];

  if (attack.bonus) parts.push(attack.bonus);
  if (attack.damage) parts.push(`(${attack.damage})`);
  if (attack.range) parts.push(`[${attack.range}]`);
  if (attack.notes) parts.push(`- ${attack.notes}`);

  return parts.join(" ").trim();
}

function getAlignmentLabel(alignment: string): string {
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

function splitAttackConnector(text: string): { connector: string | null; body: string } {
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

function appendRenderedAttack(li: HTMLLIElement, attackText: string): void {
  const { connector, body } = splitAttackConnector(attackText);

  if (connector) {
    li.appendChild(createSpan("sd-monster-attack-connector", `${connector} `));
  }

  li.appendChild(createSpan("sd-monster-attack-text", body));
}

function splitLabelAndBody(text: string): { label: string; body: string } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { label: "", body: "" };
  }

  let match: RegExpMatchArray | null = null;

  // 1) Parenthetical spell-style label up to first period
  // Example: "Ray of Frost (INT 15). Target takes..."
  match = trimmed.match(/^(.{1,100}?\([^)]{1,40}\)\.)\s*(.+)$/);
  if (match) {
    return {
      label: match[1].trim(),
      body: match[2].trim()
    };
  }

  // 2) Standard sentence label
  // Example: "Devour. Use turn to devour..."
  match = trimmed.match(/^([^.!?:]{1,80}[.!?])\s*(.+)$/);
  if (match) {
    return {
      label: match[1].trim(),
      body: match[2].trim()
    };
  }

  // 3) Colon label
  // Example: "Devour: Use turn to devour..."
  match = trimmed.match(/^([^:]{1,80}:)\s*(.+)$/);
  if (match) {
    return {
      label: match[1].trim(),
      body: match[2].trim()
    };
  }

  // 4) Dash / em dash label
  // Example: "Stormblood - Electricity immune."
  // Example: "Stormblood — Electricity immune."
  match = trimmed.match(/^(.{1,80}?\s[-—])\s*(.+)$/);
  if (match) {
    return {
      label: match[1].trim(),
      body: match[2].trim()
    };
  }

  return { label: "", body: trimmed };
}

function addSection(
  parent: HTMLElement,
  title: string,
  items: string[],
  className: string
): void {
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

export function renderMonsterBlock(
  container: HTMLElement,
  monster: ShadowdarkMonster,
  settings: ShadowdarkStatblocksSettings,
  warnings: string[] = []
): void {
  container.innerHTML = "";

  const card = createDiv(
    [
      "sd-monster-card",
      settings.compactMode ? "is-compact" : ""
    ]
      .filter(Boolean)
      .join(" ")
  );

  const header = createDiv("sd-monster-header");
  header.appendChild(createDiv("sd-monster-name", monster.name));

  const meta = createDiv("sd-monster-meta");
  const metaParts: HTMLElement[] = [];

  if (monster.level) {
    metaParts.push(createSpan(undefined, `Level ${monster.level}`));
  }

  if (monster.alignment) {
    const alignmentSpan = createSpan(undefined, `AL ${monster.alignment}`);
    const tooltip = getAlignmentLabel(monster.alignment);
    if (tooltip) {
      alignmentSpan.title = tooltip;
    }
    metaParts.push(alignmentSpan);
  }

  metaParts.forEach((part, index) => {
    meta.appendChild(part);

    if (index < metaParts.length - 1) {
      meta.appendChild(createSpan(undefined, " • "));
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