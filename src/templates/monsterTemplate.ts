export function buildMonsterTemplate(name = "New Monster"): string {
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

export function buildMonsterBlock(name = "New Monster"): string {
  return `
\`\`\`shadowdark
shadowdarkType: monster
name: ${name}
level: 1
alignment: C
ac: 13
hp: 5
mv: near
atk:
  - 1 Dagger +2 (1d4)
str: -1
dex: +2
con: +0
int: +0
wis: -1
cha: -1
traits:
  - Sneaky
  - Dark-adapted
description: A wiry goblin that stalks the edges of torchlight.
source: Homebrew
tags:
  - shadowdark
  - goblin
\`\`\`
`;
}
