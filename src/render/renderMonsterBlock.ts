import { ShadowdarkMonster } from "../types";
import { ShadowdarkStatblocksSettings } from "../settings";
import { RenderOptions, createDiv, createSpan, getAlignmentLabel, createList, createListItem, renderAttackText, appendRenderedAttack, addSection } from "./render";

export function renderMonsterBlock(
  container: HTMLElement,
  monster: ShadowdarkMonster,
  settings: ShadowdarkStatblocksSettings,
  warnings: string[] = [],
  options: RenderOptions = {}
): void {
  container.innerHTML = "";

  const card = createDiv(
    [
      "sd-card",
      settings.compactMode ? "is-compact" : ""
    ]
      .filter(Boolean)
      .join(" ")
  );

  const header = createDiv("sd-header");
  header.appendChild(createDiv("sd-name", monster.name));

  const meta = createDiv("sd-meta");
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

  const core = createDiv("sd-core");
  core.appendChild(createDiv("sd-core-item", `AC ${monster.ac}`));
  core.appendChild(createDiv("sd-core-item", `HP ${monster.hp}`));

  if (monster.mv) {
    core.appendChild(createDiv("sd-core-item", `MV ${monster.mv}`));
  }

  card.appendChild(core);

  if (monster.atk.length > 0) {
    const atkSection = createDiv("sd-section");
    atkSection.appendChild(createDiv("sd-section-title", "ATTACKS"));

    const atkList = createList("sd-attacks");
    for (const attack of monster.atk) {
      const li = createListItem("sd-attack");
      appendRenderedAttack(li, renderAttackText(attack), settings, options);
      atkList.appendChild(li);
    }

    atkSection.appendChild(atkList);
    card.appendChild(atkSection);
  }

  const abilities = createDiv("sd-section");
  abilities.appendChild(createDiv("sd-section-title", "ABILITIES"));

  const grid = createDiv("sd-abilities");
  grid.appendChild(createDiv("sd-ability", `STR ${monster.stats.str}`));
  grid.appendChild(createDiv("sd-ability", `DEX ${monster.stats.dex}`));
  grid.appendChild(createDiv("sd-ability", `CON ${monster.stats.con}`));
  grid.appendChild(createDiv("sd-ability", `INT ${monster.stats.int}`));
  grid.appendChild(createDiv("sd-ability", `WIS ${monster.stats.wis}`));
  grid.appendChild(createDiv("sd-ability", `CHA ${monster.stats.cha}`));

  abilities.appendChild(grid);
  card.appendChild(abilities);

  addSection(card, "TRAITS", monster.traits, "sd-list", settings, options);
  addSection(card, "SPECIALS", monster.specials, "sd-list", settings, options);
  addSection(card, "SPELLS", monster.spells, "sd-list", settings, options);
  addSection(card, "GEAR", monster.gear, "sd-list", settings, options);

  if (monster.description) {
    const desc = createDiv("sd-section");
    desc.appendChild(createDiv("sd-description", monster.description));
    card.appendChild(desc);
  }

  if (settings.showSource && monster.source) {
    const source = createDiv("sd-footer");
    source.appendChild(createSpan("sd-source", `Source: ${monster.source}`));
    card.appendChild(source);
  }

  if (settings.showTags && monster.tags.length > 0) {
    const tags = createDiv("sd-tags");
    for (const tag of monster.tags) {
      tags.appendChild(createSpan("sd-tag", tag));
    }
    card.appendChild(tags);
  }

  if (warnings.length > 0) {
    const warningBox = createDiv("sd-warning-box");
    for (const warning of warnings) {
      warningBox.appendChild(createDiv("sd-warning", warning));
    }
    card.appendChild(warningBox);
  }

  container.appendChild(card);
}
