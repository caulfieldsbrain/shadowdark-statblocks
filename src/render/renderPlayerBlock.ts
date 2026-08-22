import { ShadowdarkPlayer } from "../types";
import { ShadowdarkStatblocksSettings } from "../settings";
import { RenderOptions, createDiv, createSpan, getAlignmentLabel, createList, createListItem, renderAttackText, appendRenderedAttack, addSection } from "./render";

export function renderPlayerBlock(
  container: HTMLElement,
  player: ShadowdarkPlayer,
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
  header.appendChild(createDiv("sd-name", player.name));

  const experience = createDiv("sd-meta");
  const experienceParts: HTMLElement[] = [];

  if (player.level) {
    experienceParts.push(createSpan(undefined, `Level ${player.level}`));
  }

  if (player.xp) {
    experienceParts.push(createSpan(undefined, `XP ${player.xp} / 10`));
  }

  if (player.alignment) {
    const alignmentSpan = createSpan(undefined, `AL ${player.alignment}`);
    const tooltip = getAlignmentLabel(player.alignment);
    if (tooltip) {
      alignmentSpan.title = tooltip;
    }
    experienceParts.push(alignmentSpan);
  }

  experienceParts.forEach((part, index) => {
    experience.appendChild(part);

    if (index < experienceParts.length - 1) {
      experience.appendChild(createSpan(undefined, " • "));
    }
  });
  header.appendChild(experience);

  const lore = createDiv("sd-meta")
  const loreParts: HTMLElement[] = [];

  if (player.ancestry) {
    loreParts.push(createSpan(undefined, player.ancestry))
  }

  if (player.class) {
    loreParts.push(createSpan(undefined, player.class))
  }

  if (player.title) {
    loreParts.push(createSpan(undefined, player.title))
  }

  if (player.background) {
    loreParts.push(createSpan(undefined, player.background))
  }

  if (player.deity) {
    loreParts.push(createSpan(undefined, `following ${player.deity}`))
  }

  loreParts.forEach((part, index) => {
    lore.appendChild(part);

    if (index < loreParts.length - 1) {
      lore.appendChild(createSpan(undefined, ", "));
    }
  });
  header.appendChild(lore)

  card.appendChild(header);

  const core = createDiv("sd-core");
  core.appendChild(createDiv("sd-core-item", `AC ${player.ac}`));
  core.appendChild(createDiv("sd-core-item", `HP ${player.hp}`));

  if (player.mv) {
    core.appendChild(createDiv("sd-core-item", `MV ${player.mv}`));
  }

  card.appendChild(core);

  if (player.atk.length > 0) {
    const atkSection = createDiv("sd-section");
    atkSection.appendChild(createDiv("sd-section-title", "ATTACKS"));

    const atkList = createList("sd-attacks");
    for (const attack of player.atk) {
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
  grid.appendChild(createDiv("sd-ability", `STR ${player.stats.str}`));
  grid.appendChild(createDiv("sd-ability", `DEX ${player.stats.dex}`));
  grid.appendChild(createDiv("sd-ability", `CON ${player.stats.con}`));
  grid.appendChild(createDiv("sd-ability", `INT ${player.stats.int}`));
  grid.appendChild(createDiv("sd-ability", `WIS ${player.stats.wis}`));
  grid.appendChild(createDiv("sd-ability", `CHA ${player.stats.cha}`));

  abilities.appendChild(grid);
  card.appendChild(abilities);

  addSection(card, "TALENTS", player.talents, "sd-list", settings, options);
  addSection(card, "SPELLS", player.spells, "sd-list", settings, options);
  addSection(card, "GEAR", player.gear, "sd-list", settings, options);

  if (settings.showSource && player.source) {
    const source = createDiv("sd-footer");
    source.appendChild(createSpan("sd-source", `Source: ${player.source}`));
    card.appendChild(source);
  }

  if (settings.showTags && player.tags.length > 0) {
    const tags = createDiv("sd-tags");
    for (const tag of player.tags) {
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
