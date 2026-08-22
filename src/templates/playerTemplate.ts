export function buildPlayerNote(name = "New Player"): string {
  return `---
shadowdarkType: player
name: ${name}
ancestry: Human
class: Thief
level: 1
xp: 0
title: Thug
alignment: N
background: Scout
deity: Ramlaat
ac: 10
hp: 1
mv: near
atk:
  - Shortsword +0 (1d6)
str: +0
dex: +0
con: +0
int: +0
wis: +0
cha: +0
talents: []
spells: []
gear: []
source:
tags:
  - shadowdark
---

## Notes

## Gear

## Funds
`;
}

export function buildPlayerBlock(name = "New Player"): string {
  return `
\`\`\`shadowdark-player
name: ${name}
ancestry: Human
class: Thief
level: 1
xp: 0
title: Thug
alignment: N
background: Scout
deity: Ramlaat
ac: 10
hp: 1
mv: near
atk:
  - Shortsword +0 (1d6)
str: +0
dex: +0
con: +0
int: +0
wis: +0
cha: +0
talents: []
spells: []
gear: []
source:
tags:
  - shadowdark
\`\`\`
`;
}
