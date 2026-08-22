import { ShadowdarkPlayer } from "../types";
import { asString, normalizeAttacks, normalizeModifier, normalizeStringArray } from "./normalize";

type LoosePlayer = Record<string, unknown> & {
  name?: unknown;
  ancestry?: unknown;
  class?: unknown;
  level?: unknown;
  xp?: unknown;
  title?: unknown;
  alignment?: unknown;
  background?: unknown;
  deity?: unknown;
  ac?: unknown;
  hp?: unknown;
  mv?: unknown;
  atk?: unknown;
  str?: unknown;
  dex?: unknown;
  con?: unknown;
  int?: unknown;
  wis?: unknown;
  cha?: unknown;
  talents?: unknown;
  spells?: unknown;
  gear?: unknown;
  source?: unknown;
  tags?: unknown;
};

export function normalizePlayer(input: LoosePlayer): ShadowdarkPlayer {
  const nestedStats = (input.stats as Record<string, unknown> | undefined) ?? {};

  const strValue = input.str ?? nestedStats.str;
  const dexValue = input.dex ?? nestedStats.dex;
  const conValue = input.con ?? nestedStats.con;
  const intValue = input.int ?? nestedStats.int;
  const wisValue = input.wis ?? nestedStats.wis;
  const chaValue = input.cha ?? nestedStats.cha;

  return {
    shadowdarkType: "player",
    name: asString(input.name, "Unnamed Player"),
    ancestry: asString(input.ancestry, ""),
    class: asString(input.class, ""),
    level: asString(input.level, "?"),
    xp: asString(input.xp, ""),
    title: asString(input.title, ""),
    alignment: asString(input.alignment, ""),
    background: asString(input.background, ""),
    deity: asString(input.deity, ""),
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
    talents: normalizeStringArray(input.talents),
    spells: normalizeStringArray(input.spells),
    gear: normalizeStringArray(input.gear),
    source: asString(input.source, ""),
    tags: normalizeStringArray(input.tags)
  };
}
