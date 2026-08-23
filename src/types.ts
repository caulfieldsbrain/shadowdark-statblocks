export type ShadowdarkType = "monster" | "player"

export interface ShadowdarkMonster {
  shadowdarkType: "monster";
  name: string;
  level: string;
  alignment: string;
  type: string;
  ac: string;
  hp: string;
  mv: string;
  atk: ShadowdarkAttack[];
  stats: ShadowdarkAbilities;
  traits: string[];
  specials: string[];
  spells: string[];
  gear: string[];
  description: string;
  source: string;
  tags: string[];
}

export interface ShadowdarkPlayer {
  shadowdarkType: "player";
  name: string;
  ancestry: string;
  class: string;
  level: string;
  xp: string;
  title: string;
  alignment: string;
  background: string;
  deity: string;
  ac: string;
  hp: string;
  mv: string;
  atk: ShadowdarkAttack[];
  stats: ShadowdarkAbilities;
  talents: string[];
  spells: string[];
  gear: string[];
  source: string;
  tags: string[];
}

export type ShadowdarkEntity = ShadowdarkMonster | ShadowdarkPlayer

export interface ShadowdarkAttack {
  name: string;
  bonus?: string;
  damage?: string;
  range?: string;
  notes?: string;
  raw?: string;
}

export interface ShadowdarkAbilities {
  str: string;
  dex: string;
  con: string;
  int: string;
  wis: string;
  cha: string;
}

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  errors: string[];
  warnings: string[];
}
