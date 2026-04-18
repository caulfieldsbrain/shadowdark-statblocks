import { ShadowdarkMonster } from "../types";

function yamlString(value: string): string {
  if (!value) return '""';

  if (/[:[\]{}#,&*!|>'"%@`]/.test(value) || value.includes('"')) {
    return JSON.stringify(value);
  }

  return value;
}

function yamlList(items: string[], indent = 0): string {
  const pad = " ".repeat(indent);

  if (items.length === 0) {
    return `${pad}[]`;
  }

  return items.map((item) => `${pad}- ${yamlString(item)}`).join("\n");
}

export function buildMonsterFrontmatter(monster: ShadowdarkMonster): string {
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

export function buildMonsterNoteContent(
  monster: ShadowdarkMonster,
  body?: string
): string {
  const frontmatter = buildMonsterFrontmatter(monster);

  if (body && body.trim()) {
    return `${frontmatter}\n\n${body.replace(/^\s+/, "")}\n`;
  }

  return `${frontmatter}

## Notes

## Tactics

## Encounter Ideas
`;
}