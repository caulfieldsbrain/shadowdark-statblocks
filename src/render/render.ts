import { ShadowdarkAttack, ShadowdarkEntity, ShadowdarkMonster, ShadowdarkPlayer } from "../types";
import { ShadowdarkStatblocksSettings } from "../settings";
import { renderMonsterBlock } from "./renderMonsterBlock";
import { renderPlayerBlock } from "./renderPlayerBlock";

export type RenderOptions = {
  onRollDice?: (formula: string) => void;
};

export function createDiv(className?: string, text?: string): HTMLDivElement {
  const el = document.createElement("div");
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

export function createSpan(className?: string, text?: string): HTMLSpanElement {
  const el = document.createElement("span");
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

export function createList(className?: string): HTMLUListElement {
  const el = document.createElement("ul");
  if (className) el.className = className;
  return el;
}

export function createListItem(className?: string): HTMLLIElement {
  const el = document.createElement("li");
  if (className) el.className = className;
  return el;
}

export function renderAttackText(attack: ShadowdarkAttack): string {
  if (attack.raw) return attack.raw;

  const parts: string[] = [attack.name];

  if (attack.bonus) parts.push(attack.bonus);
  if (attack.damage) parts.push(`(${attack.damage})`);
  if (attack.range) parts.push(`[${attack.range}]`);
  if (attack.notes) parts.push(`- ${attack.notes}`);

  return parts.join(" ").trim();
}

export function getAlignmentLabel(alignment: string): string {
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

export function splitAttackConnector(text: string): { connector: string | null; body: string } {
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

export function normalizeDiceFormula(formula: string): string {
  return formula.replace(/\s+/g, "");
}

export function attackBonusToFormula(bonus: string): string {
  const normalized = bonus.trim();
  return `1d20${normalized}`;
}

export function createDiceRollButton(
  text: string,
  formula: string,
  onRollDice: (formula: string) => void
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "sd-dice-button";
  button.textContent = text;
  button.title = `Roll ${formula}`;

  button.addEventListener("click", (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    onRollDice(formula);
  });

  return button;
}

export function appendAttackBodyWithDiceButtons(
  parent: HTMLElement,
  body: string,
  onRollDice: (formula: string) => void
): void {
  const attackBonusRegex = /([+-]\d+)/;
  const damageRegex = /\b(\d+d\d+(?:\s*[+-]\s*\d+)?)\b/i;

  const replacements: Array<{
    start: number;
    end: number;
    text: string;
    formula: string;
  }> = [];

  const bonusMatch = attackBonusRegex.exec(body);
  if (bonusMatch?.index !== undefined) {
    const text = bonusMatch[1];
    replacements.push({
      start: bonusMatch.index,
      end: bonusMatch.index + text.length,
      text,
      formula: attackBonusToFormula(text)
    });
  }

  const damageMatch = damageRegex.exec(body);
  if (damageMatch?.index !== undefined) {
    const text = damageMatch[1];
    replacements.push({
      start: damageMatch.index,
      end: damageMatch.index + text.length,
      text,
      formula: normalizeDiceFormula(text)
    });
  }

  replacements.sort((a, b) => a.start - b.start);

  let cursor = 0;

  for (const replacement of replacements) {
    if (replacement.start < cursor) {
      continue;
    }

    if (replacement.start > cursor) {
      parent.appendChild(document.createTextNode(body.slice(cursor, replacement.start)));
    }

    parent.appendChild(
      createDiceRollButton(replacement.text, replacement.formula, onRollDice)
    );

    cursor = replacement.end;
  }

  if (cursor < body.length) {
    parent.appendChild(document.createTextNode(body.slice(cursor)));
  }
}

export function appendTextWithDamageDiceButtons(
  parent: HTMLElement,
  text: string,
  onRollDice: (formula: string) => void
): void {
  const damageRegex = /\b\d+d\d+(?:\s*[+-]\s*\d+)?\b/gi;

  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = damageRegex.exec(text)) !== null) {
    const diceText = match[0];
    const start = match.index;
    const end = start + diceText.length;

    if (start > cursor) {
      parent.appendChild(document.createTextNode(text.slice(cursor, start)));
    }

    parent.appendChild(
      createDiceRollButton(diceText, normalizeDiceFormula(diceText), onRollDice)
    );

    cursor = end;
  }

  if (cursor < text.length) {
    parent.appendChild(document.createTextNode(text.slice(cursor)));
  }
}

export function appendRenderedAttack(
  li: HTMLLIElement,
  attackText: string,
  settings: ShadowdarkStatblocksSettings,
  options: RenderOptions
): void {
  const { connector, body } = splitAttackConnector(attackText);

  if (connector) {
    li.appendChild(createSpan("sd-attack-connector", `${connector} `));
  }

  const attackTextEl = createSpan("sd-attack-text");

  if (settings.enableDiceRollerIntegration && options.onRollDice) {
    appendAttackBodyWithDiceButtons(attackTextEl, body, options.onRollDice);
  } else {
    attackTextEl.textContent = body;
  }

  li.appendChild(attackTextEl);
}

export function splitLabelAndBody(text: string): { label: string; body: string } {
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

export function addSection(
  parent: HTMLElement,
  title: string,
  items: string[],
  className: string,
  settings: ShadowdarkStatblocksSettings,
  options: RenderOptions
): void {
  if (items.length === 0) return;

  const section = createDiv("sd-section");
  section.appendChild(createDiv("sd-section-title", title));

  const list = createList(className);

  for (const item of items) {
    const li = createListItem();

    const { label, body } = splitLabelAndBody(item);

    if (label) {
      li.appendChild(createSpan("sd-ability-label", label));
    }

    if (body) {
      if (label) {
        li.appendChild(document.createTextNode(" "));
      }
      const bodyEl = createSpan("sd-ability-text");

      if (settings.enableDiceRollerIntegration && options.onRollDice) {

        appendTextWithDamageDiceButtons(bodyEl, body, options.onRollDice);

      } else {

        bodyEl.textContent = body;

      }

      li.appendChild(bodyEl);
    }

    if (!label) {
      if (settings.enableDiceRollerIntegration && options.onRollDice) {
        appendTextWithDamageDiceButtons(li, item, options.onRollDice);
      } else {
        li.textContent = item;
      }
    }

    list.appendChild(li);
  }

  section.appendChild(list);
  parent.appendChild(section);
}

export function render(
  container: HTMLElement,
  entity: ShadowdarkEntity,
  settings: ShadowdarkStatblocksSettings,
  warnings: string[] = [],
  options: RenderOptions = {}
): void {
  if (entity.shadowdarkType === "monster") {
    renderMonsterBlock(
      container,
      entity,
      settings,
      warnings,
      options
    )
  } else {
    renderPlayerBlock(
      container,
      entity,
      settings,
      warnings,
      options
    )
  }
}
