import { App, PluginSettingTab, Setting } from "obsidian";
import ShadowdarkStatblocksPlugin from "./main";

export class ShadowdarkStatblocksSettingTab extends PluginSettingTab {
  plugin: ShadowdarkStatblocksPlugin;

  constructor(app: App, plugin: ShadowdarkStatblocksPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
  const { containerEl } = this;
  containerEl.empty();

  new Setting(containerEl)
    .setName("Shadowdark statblocks settings")
    .setHeading();

  // ===== DISPLAY SECTION =====
  
  new Setting(containerEl)
    .setName("Display")
    .setHeading();

  new Setting(containerEl)
    .setName("Compact statblock mode")
    .setDesc("Render monster statblocks with tighter spacing.")
    .addToggle((toggle) =>
      toggle
        .setValue(this.plugin.settings.compactMode)
        .onChange(async (value) => {
          this.plugin.settings.compactMode = value;
          await this.plugin.savePluginSettings();
          void this.plugin.refreshMonsterView();
        })
    );

  new Setting(containerEl)
    .setName("Show source")
    .setDesc("Display the source field in rendered statblocks.")
    .addToggle((toggle) =>
      toggle
        .setValue(this.plugin.settings.showSource)
        .onChange(async (value) => {
          this.plugin.settings.showSource = value;
          await this.plugin.savePluginSettings();
          void this.plugin.refreshMonsterView();
        })
    );

  new Setting(containerEl)
    .setName("Show tags")
    .setDesc("Display tag pills in rendered statblocks.")
    .addToggle((toggle) =>
      toggle
        .setValue(this.plugin.settings.showTags)
        .onChange(async (value) => {
          this.plugin.settings.showTags = value;
          await this.plugin.savePluginSettings();
          void this.plugin.refreshMonsterView();
        })
    );

  new Setting(containerEl)
    .setName("Render frontmatter monsters")
    .setDesc("Render statblocks from monster note frontmatter in reading view.")
    .addToggle((toggle) =>
      toggle
        .setValue(this.plugin.settings.renderFrontmatterMonsters)
        .onChange(async (value) => {
          this.plugin.settings.renderFrontmatterMonsters = value;
          await this.plugin.savePluginSettings();
          void this.plugin.refreshMonsterView();
        })
    );
  new Setting(containerEl)
    .setName("Enable Dice Roller integration")
    .setDesc("Render compatible attack and damage rolls using Dice Roller inline syntax when possible.")
    .addToggle((toggle) =>
      toggle
        .setValue(this.plugin.settings.enableDiceRollerIntegration)
        .onChange(async (value) => {
          this.plugin.settings.enableDiceRollerIntegration = value;
          await this.plugin.savePluginSettings();
          await this.plugin.refreshMonsterView();
        })
    );
    
  new Setting(containerEl)
    .setName("Hide monster properties")
    .setDesc("Hide Obsidian's native properties section in reading view for monster notes.")
    .addToggle((toggle) =>
      toggle
        .setValue(this.plugin.settings.hideMonsterProperties)
        .onChange(async (value) => {
          this.plugin.settings.hideMonsterProperties = value;
          await this.plugin.savePluginSettings();
          void this.plugin.refreshMonsterView();
        })
    );

  // ===== FILES SECTION =====
  new Setting(containerEl)
    .setName("Files")
    .setHeading();

  new Setting(containerEl)
    .setName("Monster folder")
    .setDesc("Folder used when creating new monster notes.")
    .addText((text) =>
      text
        .setPlaceholder("Shadowdark/Monsters")
        .setValue(this.plugin.settings.monsterFolder)
        .onChange(async (value) => {
          this.plugin.settings.monsterFolder =
            value.trim() || "Shadowdark/Monsters";
          await this.plugin.savePluginSettings();
        })
    );
  }
}