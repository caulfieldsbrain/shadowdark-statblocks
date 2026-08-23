export interface ShadowdarkStatblocksSettings {
  compactMode: boolean;
  showSource: boolean;
  showTags: boolean;
  renderFrontmatter: boolean;
  folder: string;
  hideProperties: boolean;
  lastUsedSource: string;
  enableDiceRollerIntegration: boolean;
}

export const DEFAULT_SETTINGS: ShadowdarkStatblocksSettings = {
  compactMode: false,
  showSource: true,
  showTags: true,
  renderFrontmatter: true,
  folder: "Shadowdark",
  hideProperties: true,
  lastUsedSource: "",
  enableDiceRollerIntegration: false,
};
