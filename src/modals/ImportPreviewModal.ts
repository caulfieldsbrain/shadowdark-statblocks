import {
  App,
  DropdownComponent,
  Modal,
  Notice,
  Setting,
  TextAreaComponent,
  TextComponent
} from "obsidian";
import { ShadowdarkMonster } from "../types";
import { renderMonsterBlock } from "../render/renderMonsterBlock";
import { DEFAULT_SETTINGS } from "../settings";
import { fixMonsterCommonIssues } from "../utils/fixMonsterCommonIssues";

export interface ImportPreviewModalOptions {
  monster: ShadowdarkMonster;
  warnings: string[];
  onConfirm: (monster: ShadowdarkMonster) => Promise<void>;
  onSkip?: () => void;
  mode?: "import" | "edit";
  progressLabel?: string;
  suggestedTags?: string[];
  suggestedOtherSources?: string[];
}

const SOURCE_OPTIONS = [
  "Core Rules",
  "Cursed Scroll 1",
  "Cursed Scroll 2",
  "Cursed Scroll 3",
  "Homebrew",
  "Other"
] as const;

function getNavAction(
  evt: KeyboardEvent
): "next" | "prev" | "enter" | "escape" | null {
  const key = evt.key;
  const code = evt.code;

  if (
    key === "ArrowDown" ||
    key === "Down" ||
    code === "ArrowDown" ||
    key === "ArrowRight" ||
    key === "Right" ||
    code === "ArrowRight"
  ) {
    return "next";
  }

  if (
    key === "ArrowUp" ||
    key === "Up" ||
    code === "ArrowUp" ||
    key === "ArrowLeft" ||
    key === "Left" ||
    code === "ArrowLeft"
  ) {
    return "prev";
  }

  if (key === "Enter" || code === "Enter" || code === "NumpadEnter") {
    return "enter";
  }

  if (key === "Escape" || key === "Esc" || code === "Escape") {
    return "escape";
  }

  return null;
}

function stopKeyEvent(evt: KeyboardEvent): void {
  evt.preventDefault();
  evt.stopPropagation();
  (evt as any).stopImmediatePropagation?.();
}

function normalizeLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function joinAttackLines(monster: ShadowdarkMonster): string {
  return monster.atk.map((a) => a.raw || a.name).join("\n");
}

function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function joinTags(tags: string[]): string {
  return tags.join(", ");
}

function normalizeSourceForDropdown(source: string): string {
  const trimmed = source.trim();
  if (!trimmed) return "Core Rules";

  return SOURCE_OPTIONS.includes(trimmed as (typeof SOURCE_OPTIONS)[number])
    ? trimmed
    : "Other";
}

function getCurrentTagFragment(rawValue: string): string {
  const parts = rawValue.split(",");
  return (parts[parts.length - 1] ?? "").trim().toLowerCase();
}

function replaceCurrentTagFragment(rawValue: string, selectedTag: string): string {
  const parts = rawValue.split(",");
  const committed = parts
    .slice(0, -1)
    .map((part) => part.trim())
    .filter(Boolean);

  return committed.length > 0
    ? `${committed.join(", ")}, ${selectedTag}`
    : selectedTag;
}

function getCurrentSourceFragment(value: string): string {
  return value.trim().toLowerCase();
}

export class ImportPreviewModal extends Modal {
  private monster: ShadowdarkMonster;
  private warnings: string[];
  private onConfirmCallback: (monster: ShadowdarkMonster) => Promise<void>;
  private previewEl!: HTMLDivElement;
  private mode: "import" | "edit";
  private suggestedTags: string[];
  private suggestedOtherSources: string[];

  private nameInput!: TextComponent;
  private descriptionInput!: TextAreaComponent;
  private sourceDropdown!: DropdownComponent;
  private otherSourceInput!: TextComponent;
  private tagsInput!: TextComponent;

  private levelInput!: TextComponent;
  private alignmentInput!: TextComponent;
  private acInput!: TextComponent;
  private hpInput!: TextComponent;
  private mvInput!: TextComponent;

  private strInput!: TextComponent;
  private dexInput!: TextComponent;
  private conInput!: TextComponent;
  private intInput!: TextComponent;
  private wisInput!: TextComponent;
  private chaInput!: TextComponent;

  private attacksInput!: TextAreaComponent;
  private traitsInput!: TextAreaComponent;
  private spellsInput!: TextAreaComponent;
  private specialsInput!: TextAreaComponent;
  private gearInput!: TextAreaComponent;

  private otherSourceSettingEl!: HTMLElement;
  private tagSuggestionsEl!: HTMLDivElement;
  private otherSourceSuggestionsEl!: HTMLDivElement;

  private filteredTagSuggestions: string[] = [];
  private highlightedTagSuggestionIndex = -1;

  private filteredOtherSourceSuggestions: string[] = [];
  private highlightedOtherSourceSuggestionIndex = -1;

  private onSkipCallback?: () => void;

  private progressLabel?: string;

  constructor(app: App, options: ImportPreviewModalOptions) {
    super(app);
    this.monster = structuredClone(options.monster);
    this.warnings = options.warnings;
    this.onConfirmCallback = options.onConfirm;
    this.onSkipCallback = options.onSkip;
    this.mode = options.mode ?? "import";
    this.progressLabel = options.progressLabel;
    this.suggestedTags = [...(options.suggestedTags ?? [])].sort((a, b) =>
      a.localeCompare(b)
    );
    this.suggestedOtherSources = [...(options.suggestedOtherSources ?? [])].sort((a, b) =>
      a.localeCompare(b)
    );
  }

  private getMatchingTagSuggestions(rawValue?: string): string[] {
    const value = rawValue ?? this.tagsInput?.getValue() ?? "";
    const fragment = getCurrentTagFragment(value);
    const currentTags = new Set(splitTags(value).map((tag) => tag.toLowerCase()));

    if (!fragment) return [];

    return this.suggestedTags
      .filter((tag) => !currentTags.has(tag.toLowerCase()))
      .filter((tag) => tag.toLowerCase().includes(fragment))
      .slice(0, 8);
  }

  private getMatchingOtherSourceSuggestions(rawValue?: string): string[] {
    if (this.sourceDropdown?.getValue() !== "Other") return [];

    const value = (rawValue ?? this.otherSourceInput?.getValue() ?? "").trim();
    const fragment = getCurrentSourceFragment(value);

    if (!fragment) return [];

    return this.suggestedOtherSources
      .filter((source) => source.toLowerCase() !== value.toLowerCase())
      .filter((source) => source.toLowerCase().includes(fragment))
      .slice(0, 8);
  }

  private refreshPreview(): void {
    if (!this.previewEl) return;

    renderMonsterBlock(
      this.previewEl,
      this.monster,
      {
        ...DEFAULT_SETTINGS,
        compactMode: false,
        showSource: true,
        showTags: true
      },
      this.warnings
    );
  }

  private refreshSourceVisibility(): void {
    if (!this.otherSourceSettingEl) return;

    const dropdownValue = this.sourceDropdown?.getValue() ?? "Core Rules";
    const visible = dropdownValue === "Other";

    this.otherSourceSettingEl.style.display = visible ? "" : "none";

    if (this.otherSourceSuggestionsEl) {
      this.otherSourceSuggestionsEl.style.display = visible ? "" : "none";
    }

    this.refreshOtherSourceSuggestions();
  }

  private refreshTagSuggestions(): void {
    if (!this.tagSuggestionsEl || !this.tagsInput) return;

    this.tagSuggestionsEl.innerHTML = "";

    const rawValue = this.tagsInput.getValue();
    this.filteredTagSuggestions = this.getMatchingTagSuggestions(rawValue);

    if (this.filteredTagSuggestions.length === 0) {
      this.highlightedTagSuggestionIndex = -1;
      return;
    }

    if (this.highlightedTagSuggestionIndex < 0) {
      this.highlightedTagSuggestionIndex = 0;
    } else if (this.highlightedTagSuggestionIndex >= this.filteredTagSuggestions.length) {
      this.highlightedTagSuggestionIndex = this.filteredTagSuggestions.length - 1;
    }

    const label = document.createElement("div");
    label.className = "sd-tag-suggestions-label";
    label.textContent = "Matching tags";
    this.tagSuggestionsEl.appendChild(label);

    const chips = document.createElement("div");
    chips.className = "sd-tag-suggestions-chips";

    this.filteredTagSuggestions.forEach((tag, index) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "sd-tag-suggestion-chip";

      if (index === this.highlightedTagSuggestionIndex) {
        chip.classList.add("is-active");
      }

      chip.textContent = tag;
      chip.addEventListener("click", () => {
        const updatedValue = replaceCurrentTagFragment(rawValue, tag);
        this.monster.tags = splitTags(updatedValue);
        this.tagsInput.setValue(joinTags(this.monster.tags));
        this.highlightedTagSuggestionIndex = -1;
        this.refreshTagSuggestions();
        this.refreshPreview();
      });

      chips.appendChild(chip);
    });

    this.tagSuggestionsEl.appendChild(chips);
  }

  private refreshOtherSourceSuggestions(): void {
    if (!this.otherSourceSuggestionsEl || !this.otherSourceInput) return;

    this.otherSourceSuggestionsEl.innerHTML = "";

    if (this.sourceDropdown?.getValue() !== "Other") {
      this.filteredOtherSourceSuggestions = [];
      this.highlightedOtherSourceSuggestionIndex = -1;
      return;
    }

    const rawValue = this.otherSourceInput.getValue().trim();
    this.filteredOtherSourceSuggestions = this.getMatchingOtherSourceSuggestions(rawValue);

    if (this.filteredOtherSourceSuggestions.length === 0) {
      this.highlightedOtherSourceSuggestionIndex = -1;

      const empty = document.createElement("div");
      empty.className = "sd-tag-suggestions-empty";
      empty.textContent = "No matching sources";
      this.otherSourceSuggestionsEl.appendChild(empty);
      return;
    }

    if (this.highlightedOtherSourceSuggestionIndex < 0) {
      this.highlightedOtherSourceSuggestionIndex = 0;
    } else if (
      this.highlightedOtherSourceSuggestionIndex >=
      this.filteredOtherSourceSuggestions.length
    ) {
      this.highlightedOtherSourceSuggestionIndex =
        this.filteredOtherSourceSuggestions.length - 1;
    }

    const label = document.createElement("div");
    label.className = "sd-tag-suggestions-label";
    label.textContent = "Matching sources";
    this.otherSourceSuggestionsEl.appendChild(label);

    const chips = document.createElement("div");
    chips.className = "sd-tag-suggestions-chips";

    this.filteredOtherSourceSuggestions.forEach((source, index) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "sd-tag-suggestion-chip";

      if (index === this.highlightedOtherSourceSuggestionIndex) {
        chip.classList.add("is-active");
      }

      chip.textContent = source;
      chip.addEventListener("click", () => {
        this.monster.source = source;
        this.otherSourceInput.setValue(source);
        this.highlightedOtherSourceSuggestionIndex = -1;
        this.refreshOtherSourceSuggestions();
        this.refreshPreview();
      });

      chips.appendChild(chip);
    });

    this.otherSourceSuggestionsEl.appendChild(chips);
  }

  private moveTagSuggestionSelection(direction: 1 | -1): void {
    if (this.filteredTagSuggestions.length === 0) return;

    if (this.highlightedTagSuggestionIndex < 0) {
      this.highlightedTagSuggestionIndex =
        direction === 1 ? 0 : this.filteredTagSuggestions.length - 1;
    } else {
      this.highlightedTagSuggestionIndex =
        (this.highlightedTagSuggestionIndex + direction + this.filteredTagSuggestions.length) %
        this.filteredTagSuggestions.length;
    }

    this.refreshTagSuggestions();
  }

  private applyHighlightedTagSuggestion(): void {
    if (
      this.highlightedTagSuggestionIndex < 0 ||
      this.highlightedTagSuggestionIndex >= this.filteredTagSuggestions.length ||
      !this.tagsInput
    ) {
      return;
    }

    const selectedTag = this.filteredTagSuggestions[this.highlightedTagSuggestionIndex];
    const rawValue = this.tagsInput.getValue();
    const updatedValue = replaceCurrentTagFragment(rawValue, selectedTag);

    this.monster.tags = splitTags(updatedValue);
    this.tagsInput.setValue(joinTags(this.monster.tags));
    this.highlightedTagSuggestionIndex = -1;
    this.refreshTagSuggestions();
    this.refreshPreview();
  }

  private clearTagSuggestionSelection(): void {
    this.highlightedTagSuggestionIndex = -1;
    this.filteredTagSuggestions = [];
    this.refreshTagSuggestions();
  }

  private moveOtherSourceSuggestionSelection(direction: 1 | -1): void {
    if (this.filteredOtherSourceSuggestions.length === 0) return;

    if (this.highlightedOtherSourceSuggestionIndex < 0) {
      this.highlightedOtherSourceSuggestionIndex =
        direction === 1 ? 0 : this.filteredOtherSourceSuggestions.length - 1;
    } else {
      this.highlightedOtherSourceSuggestionIndex =
        (this.highlightedOtherSourceSuggestionIndex +
          direction +
          this.filteredOtherSourceSuggestions.length) %
        this.filteredOtherSourceSuggestions.length;
    }

    this.refreshOtherSourceSuggestions();
  }

  private applyHighlightedOtherSourceSuggestion(): void {
    if (
      this.highlightedOtherSourceSuggestionIndex < 0 ||
      this.highlightedOtherSourceSuggestionIndex >=
        this.filteredOtherSourceSuggestions.length ||
      !this.otherSourceInput
    ) {
      return;
    }

    const selectedSource =
      this.filteredOtherSourceSuggestions[this.highlightedOtherSourceSuggestionIndex];

    this.monster.source = selectedSource;
    this.otherSourceInput.setValue(selectedSource);
    this.highlightedOtherSourceSuggestionIndex = -1;
    this.refreshOtherSourceSuggestions();
    this.refreshPreview();
  }

  private clearOtherSourceSuggestionSelection(): void {
    this.highlightedOtherSourceSuggestionIndex = -1;
    this.filteredOtherSourceSuggestions = [];
    this.refreshOtherSourceSuggestions();
  }

  private refreshFormFields(): void {
    this.nameInput?.setValue(this.monster.name);
    this.descriptionInput?.setValue(this.monster.description);

    const dropdownValue = normalizeSourceForDropdown(this.monster.source);
    this.sourceDropdown?.setValue(dropdownValue);

    if (dropdownValue === "Other") {
      this.otherSourceInput?.setValue(this.monster.source);
    } else {
      this.otherSourceInput?.setValue("");
    }

    this.tagsInput?.setValue(joinTags(this.monster.tags));

    this.levelInput?.setValue(this.monster.level);
    this.alignmentInput?.setValue(this.monster.alignment);
    this.acInput?.setValue(this.monster.ac);
    this.hpInput?.setValue(this.monster.hp);
    this.mvInput?.setValue(this.monster.mv);

    this.strInput?.setValue(this.monster.stats.str);
    this.dexInput?.setValue(this.monster.stats.dex);
    this.conInput?.setValue(this.monster.stats.con);
    this.intInput?.setValue(this.monster.stats.int);
    this.wisInput?.setValue(this.monster.stats.wis);
    this.chaInput?.setValue(this.monster.stats.cha);

    this.attacksInput?.setValue(joinAttackLines(this.monster));
    this.traitsInput?.setValue(this.monster.traits.join("\n"));
    this.spellsInput?.setValue(this.monster.spells.join("\n"));
    this.specialsInput?.setValue(this.monster.specials.join("\n"));
    this.gearInput?.setValue(this.monster.gear.join("\n"));

    this.refreshSourceVisibility();
    this.refreshTagSuggestions();
    this.refreshOtherSourceSuggestions();
  }

  private fixCommonIssues(): void {
    this.monster = fixMonsterCommonIssues(this.monster);
    this.refreshFormFields();
    this.refreshPreview();
    new Notice("Common issues cleaned up.");
  }

  onOpen(): void {
    const { contentEl, titleEl } = this;

    titleEl.setText(
      this.mode === "edit"
        ? "Edit Shadowdark Monster"
        : "Import Shadowdark Monster"
    );

    contentEl.empty();
    contentEl.addClass("sd-import-preview-modal");

    this.modalEl.addClass("sd-import-preview-modal-shell");
    this.modalEl.style.width = "min(1280px, 94vw)";
    this.modalEl.style.maxWidth = "94vw";
    this.modalEl.style.height = "min(90vh, 920px)";

    const intro = document.createElement("p");
    intro.className = "sd-import-preview-description";
    intro.textContent =
      this.mode === "edit"
        ? "Review and edit the monster, then update the note."
        : "Review and edit the imported monster before creating the note.";
    contentEl.appendChild(intro);
    if (this.progressLabel) {
      const progressEl = document.createElement("div");
      progressEl.className = "sd-import-preview-progress";
      progressEl.textContent = this.progressLabel;
      contentEl.appendChild(progressEl);
    }

    if (this.warnings.length > 0) {
      const warningBox = document.createElement("div");
      warningBox.className = "sd-import-preview-warnings";

      const warningTitle = document.createElement("h4");
      warningTitle.textContent = "Warnings";
      warningBox.appendChild(warningTitle);

      const warningList = document.createElement("ul");
      for (const warning of this.warnings) {
        const li = document.createElement("li");
        li.textContent = warning;
        warningList.appendChild(li);
      }

      warningBox.appendChild(warningList);
      contentEl.appendChild(warningBox);
    }

    const layout = document.createElement("div");
    layout.className = "sd-import-preview-layout";
    contentEl.appendChild(layout);

    const formCol = document.createElement("div");
    formCol.className = "sd-import-preview-form";
    layout.appendChild(formCol);

    const previewCol = document.createElement("div");
    previewCol.className = "sd-import-preview-panel";
    layout.appendChild(previewCol);

    const previewHeading = document.createElement("h3");
    previewHeading.textContent = "Live Preview";
    previewCol.appendChild(previewHeading);

    this.previewEl = document.createElement("div");
    this.previewEl.className = "sd-import-preview-statblock";
    previewCol.appendChild(this.previewEl);

    formCol.createEl("h3", { text: "Core" });

    new Setting(formCol)
      .setName("Name")
      .addText((text) => {
        this.nameInput = text;
        text
          .setValue(this.monster.name)
          .onChange((value) => {
            this.monster.name = value.trim();
            this.refreshPreview();
          });
      });

    new Setting(formCol)
      .setName("Description")
      .addTextArea((text) => {
        this.descriptionInput = text;
        text
          .setValue(this.monster.description)
          .onChange((value) => {
            this.monster.description = value.trim();
            this.refreshPreview();
          });
        text.inputEl.rows = 4;
        text.inputEl.addClass("sd-import-preview-textarea");
      });

    formCol.createEl("h3", { text: "Metadata" });

    new Setting(formCol)
      .setName("Source")
      .setDesc("Choose a source for this monster")
      .addDropdown((dropdown) => {
        this.sourceDropdown = dropdown;

        SOURCE_OPTIONS.forEach((option: string) => {
          dropdown.addOption(option, option);
        });

        dropdown
          .setValue(normalizeSourceForDropdown(this.monster.source))
          .onChange((value) => {
            if (value === "Other") {
              this.monster.source = this.otherSourceInput?.getValue().trim() || "";
            } else {
              this.monster.source = value;
            }

            this.highlightedOtherSourceSuggestionIndex = -1;
            this.refreshSourceVisibility();
            this.refreshPreview();
          });
      });

    const otherSourceSetting = new Setting(formCol)
      .setName("Other Source")
      .setDesc("Type a custom source name")
      .addText((text) => {
        this.otherSourceInput = text;
        text
          .setValue(
            normalizeSourceForDropdown(this.monster.source) === "Other"
              ? this.monster.source
              : ""
          )
          .onChange((value) => {
            if (this.sourceDropdown?.getValue() === "Other") {
              this.monster.source = value.trim();
              this.highlightedOtherSourceSuggestionIndex = -1;
              this.refreshOtherSourceSuggestions();
              this.refreshPreview();
            }
          });

        text.inputEl.onkeydown = (evt: KeyboardEvent) => {
          const action = getNavAction(evt);
          this.filteredOtherSourceSuggestions =
            this.getMatchingOtherSourceSuggestions(text.getValue());
          const hasSuggestions = this.filteredOtherSourceSuggestions.length > 0;

          if (!action || !hasSuggestions) return;

          if (action === "next") {
            stopKeyEvent(evt);
            this.moveOtherSourceSuggestionSelection(1);
            return false;
          }

          if (action === "prev") {
            stopKeyEvent(evt);
            this.moveOtherSourceSuggestionSelection(-1);
            return false;
          }

          if (action === "enter") {
            stopKeyEvent(evt);

            if (this.highlightedOtherSourceSuggestionIndex < 0) {
              this.highlightedOtherSourceSuggestionIndex = 0;
            }

            this.applyHighlightedOtherSourceSuggestion();
            return false;
          }

          if (action === "escape") {
            stopKeyEvent(evt);
            this.clearOtherSourceSuggestionSelection();
            return false;
          }

          return;
        };
      });

    this.otherSourceSettingEl = otherSourceSetting.settingEl;

    this.otherSourceSuggestionsEl = document.createElement("div");
    this.otherSourceSuggestionsEl.className = "sd-tag-suggestions";
    formCol.appendChild(this.otherSourceSuggestionsEl);

    new Setting(formCol)
      .setName("Tags")
      .setDesc("Comma-separated tags")
      .addText((text) => {
        this.tagsInput = text;
        text
          .setValue(joinTags(this.monster.tags))
          .onChange((value) => {
            this.monster.tags = splitTags(value);
            this.highlightedTagSuggestionIndex = -1;
            this.refreshTagSuggestions();
            this.refreshPreview();
          });

        text.inputEl.onkeydown = (evt: KeyboardEvent) => {
          const action = getNavAction(evt);
          this.filteredTagSuggestions = this.getMatchingTagSuggestions(text.getValue());
          const hasSuggestions = this.filteredTagSuggestions.length > 0;

          if (!action || !hasSuggestions) return;

          if (action === "next") {
            stopKeyEvent(evt);
            this.moveTagSuggestionSelection(1);
            return false;
          }

          if (action === "prev") {
            stopKeyEvent(evt);
            this.moveTagSuggestionSelection(-1);
            return false;
          }

          if (action === "enter") {
            stopKeyEvent(evt);

            if (this.highlightedTagSuggestionIndex < 0) {
              this.highlightedTagSuggestionIndex = 0;
            }

            this.applyHighlightedTagSuggestion();
            return false;
          }

          if (action === "escape") {
            stopKeyEvent(evt);
            this.clearTagSuggestionSelection();
            return false;
          }

          return;
        };
      });

    this.tagSuggestionsEl = document.createElement("div");
    this.tagSuggestionsEl.className = "sd-tag-suggestions";
    formCol.appendChild(this.tagSuggestionsEl);

    formCol.createEl("h3", { text: "Stats" });

    new Setting(formCol)
      .setName("Level")
      .addText((text) => {
        this.levelInput = text;
        text
          .setValue(this.monster.level)
          .onChange((value) => {
            this.monster.level = value.trim();
            this.refreshPreview();
          });
      });

    new Setting(formCol)
      .setName("Alignment")
      .setDesc("Usually L, N, or C")
      .addText((text) => {
        this.alignmentInput = text;
        text
          .setValue(this.monster.alignment)
          .onChange((value) => {
            this.monster.alignment = value.trim().toUpperCase();
            this.refreshPreview();
          });
      });

    new Setting(formCol)
      .setName("AC")
      .addText((text) => {
        this.acInput = text;
        text
          .setValue(this.monster.ac)
          .onChange((value) => {
            this.monster.ac = value.trim();
            this.refreshPreview();
          });
      });

    new Setting(formCol)
      .setName("HP")
      .addText((text) => {
        this.hpInput = text;
        text
          .setValue(this.monster.hp)
          .onChange((value) => {
            this.monster.hp = value.trim();
            this.refreshPreview();
          });
      });

    new Setting(formCol)
      .setName("MV")
      .addText((text) => {
        this.mvInput = text;
        text
          .setValue(this.monster.mv)
          .onChange((value) => {
            this.monster.mv = value.trim();
            this.refreshPreview();
          });
      });

    formCol.createEl("h3", { text: "Abilities" });

    new Setting(formCol)
      .setName("STR")
      .addText((text) => {
        this.strInput = text;
        text
          .setValue(this.monster.stats.str)
          .onChange((value) => {
            this.monster.stats.str = value.trim();
            this.refreshPreview();
          });
      });

    new Setting(formCol)
      .setName("DEX")
      .addText((text) => {
        this.dexInput = text;
        text
          .setValue(this.monster.stats.dex)
          .onChange((value) => {
            this.monster.stats.dex = value.trim();
            this.refreshPreview();
          });
      });

    new Setting(formCol)
      .setName("CON")
      .addText((text) => {
        this.conInput = text;
        text
          .setValue(this.monster.stats.con)
          .onChange((value) => {
            this.monster.stats.con = value.trim();
            this.refreshPreview();
          });
      });

    new Setting(formCol)
      .setName("INT")
      .addText((text) => {
        this.intInput = text;
        text
          .setValue(this.monster.stats.int)
          .onChange((value) => {
            this.monster.stats.int = value.trim();
            this.refreshPreview();
          });
      });

    new Setting(formCol)
      .setName("WIS")
      .addText((text) => {
        this.wisInput = text;
        text
          .setValue(this.monster.stats.wis)
          .onChange((value) => {
            this.monster.stats.wis = value.trim();
            this.refreshPreview();
          });
      });

    new Setting(formCol)
      .setName("CHA")
      .addText((text) => {
        this.chaInput = text;
        text
          .setValue(this.monster.stats.cha)
          .onChange((value) => {
            this.monster.stats.cha = value.trim();
            this.refreshPreview();
          });
      });

    formCol.createEl("h3", { text: "Lists" });

    new Setting(formCol)
      .setName("Attacks")
      .setDesc("One attack per line")
      .addTextArea((text) => {
        this.attacksInput = text;
        text
          .setValue(joinAttackLines(this.monster))
          .onChange((value) => {
            this.monster.atk = normalizeLines(value).map((line) => ({
              name: line,
              raw: line
            }));
            this.refreshPreview();
          });
        text.inputEl.rows = 5;
        text.inputEl.addClass("sd-import-preview-textarea");
      });

    new Setting(formCol)
      .setName("Traits")
      .setDesc(
        'Passive or always-on abilities. One trait per line. Good formats: "Devour. Use turn to..." or "Devour: Use turn to..."'
      )
      .addTextArea((text) => {
        this.traitsInput = text;
        text
          .setValue(this.monster.traits.join("\n"))
          .onChange((value) => {
            this.monster.traits = normalizeLines(value);
            this.refreshPreview();
          });
        text.inputEl.rows = 5;
        text.inputEl.addClass("sd-import-preview-textarea");
      });

    new Setting(formCol)
      .setName("Spells")
      .setDesc(
        'Spell-like or magical abilities. One spell per line. Good formats: "Ray of Frost (INT Spell). ..." or "Ray of Frost: ..."'
      )
      .addTextArea((text) => {
        this.spellsInput = text;
        text
          .setValue(this.monster.spells.join("\n"))
          .onChange((value) => {
            this.monster.spells = normalizeLines(value);
            this.refreshPreview();
          });
        text.inputEl.rows = 5;
        text.inputEl.addClass("sd-import-preview-textarea");
      });

    new Setting(formCol)
      .setName("Specials")
      .setDesc("Active or triggered non-spell abilities. One special entry per line")
      .addTextArea((text) => {
        this.specialsInput = text;
        text
          .setValue(this.monster.specials.join("\n"))
          .onChange((value) => {
            this.monster.specials = normalizeLines(value);
            this.refreshPreview();
          });
        text.inputEl.rows = 4;
        text.inputEl.addClass("sd-import-preview-textarea");
      });

    new Setting(formCol)
      .setName("Gear")
      .setDesc("One gear entry per line")
      .addTextArea((text) => {
        this.gearInput = text;
        text
          .setValue(this.monster.gear.join("\n"))
          .onChange((value) => {
            this.monster.gear = normalizeLines(value);
            this.refreshPreview();
          });
        text.inputEl.rows = 3;
        text.inputEl.addClass("sd-import-preview-textarea");
      });

    new Setting(formCol)
      .addButton((button) =>
        button
          .setButtonText("Fix Common Issues")
          .setTooltip(
            "Cleans formatting: fixes spacing, dice typos (1dd8 → 1d8), capitalizes names/descriptions, and normalizes traits, spells, and attacks."
          )
          .onClick(() => {
            this.fixCommonIssues();
          })
      )
      .addButton((button) =>
        button
          .setButtonText(this.mode === "edit" ? "Update Note" : "Create Note")
          .setCta()
          .onClick(async () => {
            if (!this.monster.name.trim()) {
              new Notice("Monster needs a name before saving.");
              return;
            }

            try {
              await this.onConfirmCallback(this.monster);
              this.close();
            } catch (error) {
              console.error("Shadowdark Statblocks modal confirm error:", error);
              new Notice("Failed to save monster note.");
            }
          })
      );

    if (this.onSkipCallback) {
      new Setting(formCol).addButton((button) =>
        button
          .setButtonText("Skip")
          .onClick(() => {
            this.onSkipCallback?.();
            this.close();
          })
      );
    }

    new Setting(formCol).addButton((button) =>
      button.setButtonText("Cancel").onClick(() => {
        this.close();
      })
    );

    this.refreshFormFields();
    this.refreshPreview();
  }

  onClose(): void {
    this.contentEl.empty();
    this.modalEl.removeClass("sd-import-preview-modal-shell");
    this.modalEl.style.width = "";
    this.modalEl.style.maxWidth = "";
    this.modalEl.style.height = "";
  }
}