import {
  App,
  PluginSettingTab,
  Setting,
  type SettingDefinitionItem
} from "obsidian";
import ShadowdarkStatblocksPlugin from "./main";

export class ShadowdarkStatblocksSettingTab extends PluginSettingTab {
  plugin: ShadowdarkStatblocksPlugin;

  constructor(app: App, plugin: ShadowdarkStatblocksPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  async setControlValue(key: string, value: unknown): Promise<void> {
    let shouldRefresh = false;

    switch (key) {
      case "compactMode":
        if (typeof value !== "boolean") return;
        this.plugin.settings.compactMode = value;
        shouldRefresh = true;
        break;

      case "showSource":
        if (typeof value !== "boolean") return;
        this.plugin.settings.showSource = value;
        shouldRefresh = true;
        break;

      case "showTags":
        if (typeof value !== "boolean") return;
        this.plugin.settings.showTags = value;
        shouldRefresh = true;
        break;

      case "renderFrontmatterMonsters":
        if (typeof value !== "boolean") return;
        this.plugin.settings.renderFrontmatterMonsters = value;
        shouldRefresh = true;
        break;

      case "enableDiceRollerIntegration":
        if (typeof value !== "boolean") return;
        this.plugin.settings.enableDiceRollerIntegration = value;
        shouldRefresh = true;
        break;

      case "hideMonsterProperties":
        if (typeof value !== "boolean") return;
        this.plugin.settings.hideMonsterProperties = value;
        shouldRefresh = true;
        break;

      case "monsterFolder":
        if (typeof value !== "string") return;
        this.plugin.settings.monsterFolder =
          value.trim() || "Shadowdark/Monsters";
        break;

      default:
        return;
    }

    await this.plugin.savePluginSettings();

    if (shouldRefresh) {
      await this.plugin.refreshMonsterView();
    }
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        type: "group",
        heading: "Display",
        items: [
          {
            name: "Compact statblock mode",
            desc: "Render monster statblocks with tighter spacing.",
            control: {
              type: "toggle",
              key: "compactMode"
            }
          },
          {
            name: "Show source",
            desc: "Display the source field in rendered statblocks.",
            control: {
              type: "toggle",
              key: "showSource"
            }
          },
          {
            name: "Show tags",
            desc: "Display tag pills in rendered statblocks.",
            control: {
              type: "toggle",
              key: "showTags"
            }
          },
          {
            name: "Render frontmatter monsters",
            desc: "Render statblocks from monster note frontmatter in reading view.",
            control: {
              type: "toggle",
              key: "renderFrontmatterMonsters"
            }
          },
          {
            name: "Enable Dice Roller integration",
            desc: "Make compatible attack, damage, and ability rolls clickable using Dice Roller.",
            control: {
              type: "toggle",
              key: "enableDiceRollerIntegration"
            }
          },
          {
            name: "Hide monster properties",
            desc: "Hide Obsidian's native properties section in reading view for monster notes.",
            control: {
              type: "toggle",
              key: "hideMonsterProperties"
            }
          }
        ]
      },
      {
        type: "group",
        heading: "Files",
        items: [
          {
            name: "Monster folder",
            desc: "Folder used when creating new monster notes.",
            control: {
              type: "text",
              key: "monsterFolder",
              placeholder: "Shadowdark/Monsters"
            }
          }
        ]
      }
    ];
  }

  display(): void {
  const { containerEl } = this;
  containerEl.empty();

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