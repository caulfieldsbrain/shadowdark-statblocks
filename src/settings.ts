export interface ShadowdarkStatblocksSettings {
  compactMode: boolean;
  showSource: boolean;
  showTags: boolean;
  renderFrontmatterMonsters: boolean;
  monsterFolder: string;
  hideMonsterProperties: boolean;
  lastUsedMonsterSource: string;
  enableDiceRollerIntegration: boolean;
}

export const DEFAULT_SETTINGS: ShadowdarkStatblocksSettings = {
  compactMode: false,
  showSource: true,
  showTags: true,
  renderFrontmatterMonsters: true,
  monsterFolder: "Shadowdark/Monsters",
  hideMonsterProperties: true,
  lastUsedMonsterSource: "",
  enableDiceRollerIntegration: false,
};